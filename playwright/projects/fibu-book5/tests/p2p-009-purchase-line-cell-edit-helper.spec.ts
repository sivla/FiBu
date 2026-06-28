import { test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { project } from '../project';

const caseId = 'P2P-009-PURCHASE-LINE-CELL-EDIT-HELPER';
const environment = process.env.BC_ENVIRONMENT ?? 'MCP_1_20260210';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const purchaseOrderNo = process.env.P2P009_PURCHASE_ORDER_NO ?? '106051';
const targetItem = 'RAW-STEEL';
const evidenceDir = path.join(process.cwd(), 'playwright/projects/fibu-book5/evidence/p2p-009');

type AttemptStatus = 'success' | 'observed' | 'blocked';

type EditAttempt = {
  route: string;
  field: string;
  value: string;
  status: AttemptStatus;
  details: string[];
  beforeCellText?: string;
  afterCellText?: string;
  afterRowText?: string;
  activeEditor?: unknown;
};

type CellSnapshot = {
  text: string;
  aria: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type GridGeometry = {
  frameIndex?: number;
  frameOffset?: { x: number; y: number };
  headers: CellSnapshot[];
  rows: Array<CellSnapshot & { cells?: CellSnapshot[] }>;
  rawRow?: CellSnapshot & { cells?: CellSnapshot[] };
  frames?: GridGeometry[];
};

async function ensureDirs() {
  await fs.mkdir(evidenceDir, { recursive: true });
}

async function writeJson(fileName: string, data: unknown) {
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, data: string) {
  await fs.writeFile(path.join(evidenceDir, fileName), data, 'utf8');
}

function scrubEvidenceText(data: string) {
  return data
    .split('\n')
    .filter((line) => !/tokenFactory|clientId|authority|cacheLocation|upn|requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints/i.test(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
    .concat('\n');
}

function purchaseOrderUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', company);
  url.searchParams.set('page', '50');
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${purchaseOrderNo}'`);
  return url.toString();
}

function sanitizeUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (/token|tenant|trace|client|auth|session|sid/i.test(key)) {
        url.searchParams.set(key, '[redacted]');
      }
    }
    return url.toString();
  } catch {
    return value.replace(/(token|tenant|trace|client|auth|session|sid)=([^&\s]+)/gi, '$1=[redacted]');
  }
}

async function clickIfVisible(page: Page, selector: string) {
  for (const scope of [page, ...page.frames()]) {
    const control = scope.locator(selector).first();
    if (await control.isVisible({ timeout: 700 }).catch(() => false)) {
      await control.click({ timeout: 3000 });
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

async function enableWideLayout(page: Page) {
  return clickIfVisible(
    page,
    '[title*="Breite Layoutansicht" i], [aria-label*="Breites Layout" i], [title*="Wide layout" i], [aria-label*="Wide layout" i]',
  );
}

async function enableLinesFocusMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const control = scope.getByRole('menuitemcheckbox', { name: /Fokusmodus.*Seitenteil|Fokusmodus umschalten|Focus mode|Toggle focus mode/i }).first();
    if (await control.isVisible({ timeout: 700 }).catch(() => false)) {
      const checked = await control.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await control.click({ timeout: 3000 });
        await page.waitForTimeout(900);
      }
      return true;
    }
  }
  return false;
}

async function captureActionCandidates(page: Page) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const controls = await frame.evaluate(({ frameIndex }) => {
      const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const rect = html.getBoundingClientRect();
        const style = window.getComputedStyle(html);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      return [...document.querySelectorAll('button,[role="button"],a,[aria-label],[title]')]
        .filter(visible)
        .map((element) => {
          const html = element as HTMLElement;
          const rect = html.getBoundingClientRect();
          return {
            frameIndex,
            text: normalize(html.innerText || html.textContent),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            role: normalize(html.getAttribute('role') || html.tagName),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter((entry) => /Bearbeiten|Edit|Liste bearbeiten|Edit List|Fokusmodus|Focus mode|Breite Layout|Wide layout|Personalize|Personalisieren/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
        .slice(0, 80);
    }, { frameIndex }).catch(() => []);
    frames.push({ frameIndex, controls });
  }
  return frames;
}

async function clickScopedHeaderEditPencil(page: Page) {
  for (const [frameIndex, frame] of page.frames().entries()) {
    const frameBox = await frame.frameElement().then((handle) => handle.boundingBox()).catch(() => ({ x: 0, y: 0 }));
    const candidate = await frame.evaluate(() => {
      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const rect = html.getBoundingClientRect();
        const style = window.getComputedStyle(html);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
      return [...document.querySelectorAll('button,[role="button"],a')]
        .filter(visible)
        .map((element) => {
          const html = element as HTMLElement;
          const rect = html.getBoundingClientRect();
          return {
            text: normalize(html.innerText || html.textContent),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        })
        .filter((entry) => entry.x >= 850 && entry.x <= 1030 && entry.y >= 0 && entry.y <= 85)
        .filter((entry) => !/New|Neu|Delete|Loeschen|Löschen|Share|Freigeben|Open in|Oeffnen|Öffnen/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
        .sort((a, b) => a.x - b.x)[0];
    }).catch(() => undefined);
    if (candidate) {
      const x = (frameBox?.x ?? 0) + candidate.x + Math.max(4, candidate.width / 2);
      const y = (frameBox?.y ?? 0) + candidate.y + Math.max(4, candidate.height / 2);
      await page.mouse.click(x, y);
      await page.waitForTimeout(1200);
      return { clicked: true, frameIndex, candidate, x: Math.round(x), y: Math.round(y) };
    }
  }
  return { clicked: false };
}

async function enableEditMode(page: Page) {
  const selectors = [
    '[title="Bearbeiten"], [aria-label="Bearbeiten"], [title="Edit"], [aria-label="Edit"]',
    '[title*="Bearbeiten" i]:not([title*="Excel" i]), [aria-label*="Bearbeiten" i]:not([aria-label*="Excel" i])',
    '[title*="Edit" i]:not([title*="Excel" i]), [aria-label*="Edit" i]:not([aria-label*="Excel" i])',
  ];
  for (const selector of selectors) {
    if (await clickIfVisible(page, selector)) return true;
  }
  const scoped = await clickScopedHeaderEditPencil(page);
  return scoped.clicked;
}

async function gridGeometry(page: Page): Promise<GridGeometry> {
  const frames: GridGeometry[] = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const frameBox = await frame.frameElement().then((handle) => handle.boundingBox()).catch(() => ({ x: 0, y: 0 }));
    const frameData = await frame.evaluate(
      ({ itemNo, frameIndex }) => {
        const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const html = element as HTMLElement;
          const rect = html.getBoundingClientRect();
          const style = window.getComputedStyle(html);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const snapshot = (element: Element) => {
          const html = element as HTMLElement;
          const rect = html.getBoundingClientRect();
          return {
            text: normalize(html.innerText || html.textContent),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        };
        const headers = [...document.querySelectorAll('th,[role="columnheader"],a[title^="Sortieren nach"],a[title^="Sort by"]')]
          .filter(visible)
          .map(snapshot);
        const rows = [...document.querySelectorAll('[role="row"],tr')]
          .filter(visible)
          .map((row) => {
            const rowSnapshot = snapshot(row);
            const cells = [...row.querySelectorAll('[role="gridcell"],td')]
              .filter(visible)
              .map(snapshot);
            return { ...rowSnapshot, cells };
          });
        const rawRow = rows.find((row) => row.text.includes(itemNo));
        return { frameIndex, headers, rows: rows.slice(0, 40), rawRow };
      },
      { itemNo: targetItem, frameIndex },
    ).catch(() => ({
      frameIndex,
      headers: [],
      rows: [],
      rawRow: undefined,
    }));
    const offset = { x: Math.round(frameBox?.x ?? 0), y: Math.round(frameBox?.y ?? 0) };
    const offsetCell = (cell: CellSnapshot): CellSnapshot => ({ ...cell, x: cell.x + offset.x, y: cell.y + offset.y });
    frames.push({
      ...frameData,
      frameOffset: offset,
      headers: frameData.headers.map(offsetCell),
      rows: frameData.rows.map((row) => ({ ...offsetCell(row), cells: row.cells?.map(offsetCell) })),
      rawRow: frameData.rawRow ? { ...offsetCell(frameData.rawRow), cells: frameData.rawRow.cells?.map(offsetCell) } : undefined,
    });
  }
  const match = frames.find((frame) => frame.rawRow && frame.headers.length > 0) ?? frames.find((frame) => frame.rawRow) ?? frames[0] ?? { headers: [], rows: [] };
  return { ...match, frames };
}

function compactGridGeometry(geometry: GridGeometry) {
  const relevantHeader = (header: CellSnapshot) => /Type|No\.|Description|Location Code|Quantity|Direct Unit Cost|Qty\. to Receive|Tax Area|Tax Group|Line Amount/i.test(headerText(header));
  return {
    frameIndex: geometry.frameIndex,
    frameOffset: geometry.frameOffset,
    headers: geometry.headers.filter(relevantHeader),
    rawRow: geometry.rawRow ? {
      text: geometry.rawRow.text,
      x: geometry.rawRow.x,
      y: geometry.rawRow.y,
      width: geometry.rawRow.width,
      height: geometry.rawRow.height,
      cells: geometry.rawRow.cells,
    } : undefined,
    frameSummary: geometry.frames?.map((frame) => ({
      frameIndex: frame.frameIndex,
      headerCount: frame.headers.length,
      rowCount: frame.rows.length,
      hasRawRow: Boolean(frame.rawRow),
    })),
  };
}

function headerText(header: CellSnapshot) {
  return `${header.text} ${header.aria} ${header.title}`;
}

function findHeader(geometry: GridGeometry, label: RegExp) {
  return geometry.headers.find((header) => label.test(headerText(header)));
}

function cellForHeader(geometry: GridGeometry, header: CellSnapshot | undefined) {
  if (!header || !geometry.rawRow?.cells?.length) return undefined;
  const headerCenter = header.x + header.width / 2;
  return geometry.rawRow.cells.find((cell) => headerCenter >= cell.x && headerCenter <= cell.x + cell.width)
    ?? geometry.rawRow.cells
      .map((cell) => ({ cell, distance: Math.abs((cell.x + cell.width / 2) - headerCenter) }))
      .sort((a, b) => a.distance - b.distance)[0]?.cell;
}

async function activeEditorSnapshot(page: Page) {
  const snapshots = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const snapshot = await frame.evaluate(({ frameIndex }) => {
      const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
      const active = document.activeElement as HTMLElement | null;
      const activeRect = active?.getBoundingClientRect();
      const activeVisible = activeRect ? activeRect.width > 0 && activeRect.height > 0 : false;
      const safeValue = (element: HTMLElement | null) => {
        if (!element) return '';
        const tag = element.tagName;
        if (/BODY|HTML|SCRIPT|IFRAME/i.test(tag)) return '';
        const value = normalize((element as HTMLInputElement).value || element.textContent);
        return value.length > 120 ? `${value.slice(0, 120)} [truncated]` : value;
      };
      const visibleInputs = [...document.querySelectorAll('input,textarea,[contenteditable="true"],[role="textbox"],[role="combobox"]')]
        .map((element) => {
          const html = element as HTMLInputElement;
          const rect = html.getBoundingClientRect();
          const style = window.getComputedStyle(html);
          return {
            tag: html.tagName,
            role: normalize(html.getAttribute('role')),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            value: normalize(html.value || html.textContent),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
          };
        })
        .filter((entry) => entry.visible)
        .slice(0, 8);
      return {
        frameIndex,
        active: active && activeVisible ? {
          tag: active.tagName,
          role: normalize(active.getAttribute('role')),
          aria: normalize(active.getAttribute('aria-label')),
          title: normalize(active.getAttribute('title')),
          value: safeValue(active),
          x: activeRect ? Math.round(activeRect.x) : 0,
          y: activeRect ? Math.round(activeRect.y) : 0,
          width: activeRect ? Math.round(activeRect.width) : 0,
          height: activeRect ? Math.round(activeRect.height) : 0,
        } : undefined,
        visibleInputs,
      };
    }, { frameIndex }).catch(() => ({ frameIndex, active: undefined, visibleInputs: [] }));
    if (snapshot.active || snapshot.visibleInputs.length > 0) {
      snapshots.push(snapshot);
    }
  }
  return snapshots;
}

function valueVisibleInField(field: string, value: string, rowText: string, cellText: string) {
  if (field === 'Location Code') return /FRA-ZL/i.test(cellText) || /FRA-ZL/i.test(rowText);
  if (field === 'Quantity') return /\b4(?:,00)?\b/.test(cellText);
  if (field === 'Direct Unit Cost Excl. Tax') return /2\.500,00|2500/i.test(cellText) || /2\.500,00|2500/i.test(rowText);
  if (field === 'Qty. to Receive') return /\b2(?:,00)?\b/.test(cellText);
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(cellText || rowText);
}

function compactAttempts(attempts: EditAttempt[]) {
  return attempts.map((attempt) => ({
    route: attempt.route,
    field: attempt.field,
    value: attempt.value,
    status: attempt.status,
    beforeCellText: attempt.beforeCellText ?? '',
    afterCellText: attempt.afterCellText ?? '',
    afterRowText: attempt.afterRowText ?? '',
    details: attempt.details,
    activeEditorSummary: Array.isArray(attempt.activeEditor)
      ? attempt.activeEditor.map((entry: any) => ({
        frameIndex: entry.frameIndex,
        active: entry.active ? {
          tag: entry.active.tag,
          role: entry.active.role,
          aria: entry.active.aria,
          title: entry.active.title,
          value: entry.active.value,
        } : undefined,
        visibleInputCount: entry.visibleInputs?.length ?? 0,
        visibleInputSamples: (entry.visibleInputs ?? []).slice(0, 3).map((input: any) => ({
          tag: input.tag,
          role: input.role,
          aria: input.aria,
          title: input.title,
          value: input.value,
        })),
      }))
      : [],
  }));
}

async function tryCellEditRoute(page: Page, route: string, field: string, headerPattern: RegExp, value: string): Promise<EditAttempt> {
  const attempt: EditAttempt = { route, field, value, status: 'blocked', details: [] };
  const beforeGeometry = await gridGeometry(page);
  const header = findHeader(beforeGeometry, headerPattern);
  const beforeCell = cellForHeader(beforeGeometry, header);
  if (!beforeGeometry.rawRow || !header || !beforeCell) {
    attempt.details.push(`missing rawRow=${Boolean(beforeGeometry.rawRow)} header=${Boolean(header)} cell=${Boolean(beforeCell)}`);
    return attempt;
  }
  const x = beforeCell.x + Math.max(6, Math.floor(beforeCell.width / 2));
  const y = beforeCell.y + Math.max(6, Math.floor(beforeCell.height / 2));
  attempt.beforeCellText = beforeCell.text;
  attempt.details.push(`cell x=${x} y=${y} header=${header.text || header.title} before=${beforeCell.text}`);

  if (route === 'single-click-enter-type-tab') {
    await page.mouse.click(x, y);
    await page.keyboard.press('Enter').catch(() => undefined);
  } else if (route === 'double-click-type-enter') {
    await page.mouse.dblclick(x, y);
  } else if (route === 'f2-type-enter-tab') {
    await page.mouse.click(x, y);
    await page.keyboard.press('F2').catch(() => undefined);
  }
  await page.waitForTimeout(400);
  attempt.activeEditor = await activeEditorSnapshot(page);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.press('Backspace').catch(() => undefined);
  await page.keyboard.type(value);
  await page.waitForTimeout(350);
  await page.keyboard.press(route === 'single-click-enter-type-tab' ? 'Tab' : 'Enter').catch(() => undefined);
  await page.waitForTimeout(900);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1000);

  const afterGeometry = await gridGeometry(page);
  const afterHeader = findHeader(afterGeometry, headerPattern);
  const afterCell = cellForHeader(afterGeometry, afterHeader);
  const afterRowText = afterGeometry.rawRow?.text ?? '';
  const afterCellText = afterCell?.text ?? '';
  attempt.afterCellText = afterCellText;
  attempt.afterRowText = afterRowText;
  attempt.status = valueVisibleInField(field, value, afterRowText, afterCellText) ? 'success' : 'observed';
  attempt.details.push(`after-cell=${afterCellText}`);
  attempt.details.push(`after-row=${afterRowText.slice(0, 240)}`);
  return attempt;
}

async function setFieldWithRoutes(page: Page, field: string, headerPattern: RegExp, value: string) {
  const attempts: EditAttempt[] = [];
  for (const route of ['single-click-enter-type-tab', 'double-click-type-enter', 'f2-type-enter-tab']) {
    const attempt = await tryCellEditRoute(page, route, field, headerPattern, value);
    attempts.push(attempt);
    if (attempt.status === 'success') break;
  }
  return attempts;
}

test.describe('P2P-009 purchase line cell edit helper', () => {
  test.use({
    storageState: 'playwright/.auth/bc-user.json',
    viewport: { width: 2600, height: 1400 },
  });

  test('discovers and applies safe UI cell-edit routes for RAW-STEEL purchase line values', async ({ page }) => {
    test.setTimeout(240_000);
    await ensureDirs();
    const result: Record<string, unknown> = {
      schemaVersion: 1,
      caseId,
      source: 'playwright-ui-labor-cell-edit-helper',
      resultStatus: 'started',
      instance: environment,
      company,
      sourceCompany: company,
      purchaseOrderNo,
      targetLine: {
        itemNo: targetItem,
        locationCode: 'FRA-ZL',
        quantity: '4',
        directUnitCostExclTax: '2500',
        qtyToReceive: '2',
      },
      fachlichePruefung: {
        businessCase: 'P2P partial receipt laboratory route on Purchase Order 106051.',
        targetState: 'RAW-STEEL line visibly shows Location FRA-ZL, Quantity 4, Qty. to Receive 2 and Direct Unit Cost 2500 before any Preview Posting.',
        modules: ['Purchasing', 'Inventory'],
        masterDataAndSetup: ['Vendor K10000', 'Item RAW-STEEL', 'Location FRA-ZL', 'RM-DEMO laboratory posting setup'],
        expectedDocumentsAndEntries: ['No posted document or ledger entries in P2P-009; line-value preflight only.'],
        risk: 'Wrong cell editing could change the wrong purchase line value.',
        correctionPath: 'If wrong value is visible, keep draft 106051 as laboratory draft and document exact before/after cell text for manual correction in a later gated run.',
        evidencePlan: ['before/after screenshots', 'frame-aware grid geometry', 'action candidate inventory', 'result JSON'],
      },
      previewPosting: false,
      posted: false,
      setupChanges: [],
      createdRecords: [],
      changedRecords: [],
      postedRecords: [],
      flags: {
        noPost: true,
        noPreview: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noBookChange: true,
      },
      migrationRelevance: 'needed-for-german-final',
      mustRecreateInFinalSandbox: true,
      finalScreenshotNeeded: true,
      rebuildInstruction: 'In the future German target company, reproduce Purchase Order line value entry with German UI, German setup and final screenshots before Preview Posting.',
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
    };

    await page.goto(purchaseOrderUrl(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await hideFactBoxPane(page);
    const wideLayout = await enableWideLayout(page);
    const focusMode = await enableLinesFocusMode(page);
    const editMode = await enableEditMode(page);

    await screenshot(page, 'p2p-009-010-before-cell-edit.png', {
      projectName: project.name,
      testId: 'p2p-009',
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'P2P-009 before cell edit helper: Purchase Order 106051 and RAW-STEEL line context.',
      expectedPageText: [new RegExp(purchaseOrderNo), /RAW-STEEL|Purchase Order|Lines/i],
      knownLimitations: ['RM-DEMO laboratory only; no Preview Posting or posting in this case.'],
    });

    const beforeText = await pageText(page);
    const safeUrl = sanitizeUrl(page.url());
    const contextOk = safeUrl.includes(environment) && safeUrl.includes(`company=${company}`) && beforeText.includes(purchaseOrderNo);
    const rawLineVisible = beforeText.includes(targetItem);
    const actionCandidates = await captureActionCandidates(page);
    const beforeGeometry = await gridGeometry(page);
    await writeJson('010-before-grid-geometry.json', compactGridGeometry(beforeGeometry));
    await writeJson('011-action-candidates.json', actionCandidates);
    await writeText('012-before-page-text-compact.txt', scrubEvidenceText(await compactPageText(page, {
      include: [/106051|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|ATLANTA|Quantity|Location|Qty\. to Receive|Direct Unit Cost|Line Amount/i],
      maxLines: 200,
    })));

    if (!contextOk || !rawLineVisible) {
      result.resultStatus = 'blocked';
      result.blockedBy = [contextOk ? 'raw-steel-line-not-visible' : 'wrong-or-unclear-instance-company-or-draft-context'];
      result.proved = ['No Preview Posting, posting, setup change, company switch or API shortcut was executed.'];
      result.notProved = ['Purchase line cell edit helper was not attempted because the required context was not visible.'];
    } else {
      const allAttempts: EditAttempt[] = [];
      allAttempts.push(...await setFieldWithRoutes(page, 'Location Code', /Location Code/i, 'FRA-ZL'));
      allAttempts.push(...await setFieldWithRoutes(page, 'Quantity', /^Quantity(?! Received| Invoiced)|Sortieren nach 'Quantity'|Sort by 'Quantity'/i, '4'));
      allAttempts.push(...await setFieldWithRoutes(page, 'Direct Unit Cost Excl. Tax', /Direct Unit Cost Excl\. Tax/i, '2500'));
      allAttempts.push(...await setFieldWithRoutes(page, 'Qty. to Receive', /Qty\. to Receive/i, '2'));

      const afterGeometry = await gridGeometry(page);
      await screenshot(page, 'p2p-009-020-after-cell-edit.png', {
        projectName: project.name,
        testId: 'p2p-009',
        status: 'labor',
        bookUse: 'evidence',
        purpose: 'P2P-009 after cell edit helper attempts for Location FRA-ZL, Quantity 4, Direct Unit Cost 2500 and Qty. to Receive 2.',
        expectedPageText: [/RAW-STEEL|FRA-ZL|2\.500|2500|Qty\. to Receive|Quantity/i],
        knownLimitations: ['No Preview Posting or posting was executed.'],
      });
      await writeJson('020-after-grid-geometry.json', compactGridGeometry(afterGeometry));
      await writeText('021-after-page-text-compact.txt', scrubEvidenceText(await compactPageText(page, {
        include: [/106051|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|ATLANTA|Quantity|Location|Qty\. to Receive|Direct Unit Cost|Line Amount|2\.500|2500/i],
        maxLines: 200,
      })));

      const locationCell = cellForHeader(afterGeometry, findHeader(afterGeometry, /Location Code/i));
      const quantityCell = cellForHeader(afterGeometry, findHeader(afterGeometry, /^Quantity(?! Received| Invoiced)|Sortieren nach 'Quantity'|Sort by 'Quantity'/i));
      const unitCostCell = cellForHeader(afterGeometry, findHeader(afterGeometry, /Direct Unit Cost Excl\. Tax/i));
      const qtyToReceiveCell = cellForHeader(afterGeometry, findHeader(afterGeometry, /Qty\. to Receive/i));
      const afterRowText = afterGeometry.rawRow?.text ?? '';
      const fieldResults = {
        locationOk: valueVisibleInField('Location Code', 'FRA-ZL', afterRowText, locationCell?.text ?? ''),
        quantityOk: valueVisibleInField('Quantity', '4', afterRowText, quantityCell?.text ?? ''),
        unitCostOk: valueVisibleInField('Direct Unit Cost Excl. Tax', '2500', afterRowText, unitCostCell?.text ?? ''),
        qtyToReceiveOk: valueVisibleInField('Qty. to Receive', '2', afterRowText, qtyToReceiveCell?.text ?? ''),
        cells: {
          location: locationCell?.text ?? '',
          quantity: quantityCell?.text ?? '',
          unitCost: unitCostCell?.text ?? '',
          qtyToReceive: qtyToReceiveCell?.text ?? '',
        },
        afterRowText,
      };
      const allTargetValuesVisible = fieldResults.locationOk && fieldResults.quantityOk && fieldResults.unitCostOk && fieldResults.qtyToReceiveOk;
      result.details = {
        url: safeUrl,
        wideLayout,
        focusMode,
        editMode,
        actionCandidates,
        attempts: compactAttempts(allAttempts),
        fieldResults,
      };
      result.resultStatus = allTargetValuesVisible ? 'observed' : 'blocked';
      result.changedRecords = allTargetValuesVisible ? [{ type: 'Purchase Order Line', documentNo: purchaseOrderNo, itemNo: targetItem, status: 'labor-target-values-visible' }] : [];
      result.proved = [
        'Purchase Order 106051 remained in MCP_1_20260210/RM-DEMO.',
        'RAW-STEEL purchase line was visible.',
        'P2P-009 captured frame-aware headers, row cells and edit-action candidates.',
        'No Preview Posting, posting, setup change, company switch or API shortcut was executed.',
      ];
      result.notProved = [
        'German final P2P proof remains open.',
        'Preview Posting and Receive are not proven by P2P-009.',
        'Only target values visible in their mapped cells or row snapshot count as laboratory proof.',
      ];
      result.blockedBy = allTargetValuesVisible ? [] : ['target-values-not-all-visible-after-cell-edit-helper-routes'];
      result.evidenceRefs = [
        'playwright/projects/fibu-book5/evidence/p2p-009/010-before-grid-geometry.json',
        'playwright/projects/fibu-book5/evidence/p2p-009/011-action-candidates.json',
        'playwright/projects/fibu-book5/evidence/p2p-009/012-before-page-text-compact.txt',
        'playwright/projects/fibu-book5/evidence/p2p-009/020-after-grid-geometry.json',
        'playwright/projects/fibu-book5/evidence/p2p-009/021-after-page-text-compact.txt',
      ];
      result.screenshots = [
        'playwright/projects/fibu-book5/img/p2p-009-010-before-cell-edit.png',
        'playwright/projects/fibu-book5/img/p2p-009-020-after-cell-edit.png',
      ];
      result.nextStep = allTargetValuesVisible
        ? 'Open a separate gated P2P Preview Posting case for Purchase Order 106051 before any Receive or Invoice.'
        : 'Use the P2P-009 geometry/action evidence to refine the BC Purchase Lines cell editor route or choose a fresh controlled draft route.';
    }

    await writeJson('P2P-009-result.json', result);
  });
});
