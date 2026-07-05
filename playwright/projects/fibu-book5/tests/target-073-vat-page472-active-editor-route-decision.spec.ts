import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-073-vat-page472-active-editor-route-decision';
const EVIDENCE_REL_DIR = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_REL_DIR);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-073-result.json');

type CellEntry = {
  text: string;
  role: string;
  ariaLabel: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|id[_-]?token/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString().replace('%7Btenant%7D', '{tenant}');
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function page472Visible(text: string) {
  return /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup|MwSt\.-Geschaftsbuchungsgruppe|MwSt\.-Produktbuchungsgruppe|MwSt\. %|Umsatzsteuerkonto|Vorsteuerkonto/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function visibleText(page: Page) {
  return clean(await pageText(page));
}

async function matrixText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup/i,
        /MwSt\.-Geschaftsbuchungsgruppe|MwSt\.-Produktbuchungsgruppe|Gesch.*ftsbuchungsgruppe|Produktbuchungsgruppe/i,
        /MwSt\. %|Berechnungsart|Umsatzsteuerkonto|Vorsteuerkonto|INLAND|VAT19|1406|3806|Normale MwSt/i,
        /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Nicht gespeichert|Fehler|Error/i
      ],
      maxLines: 360,
      maxLineLength: 340
    })
  );
}

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
}

async function screenshot(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, fileName), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: path.join(EVIDENCE_DIR, fileName),
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function capture(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await matrixText(page);
  await writeText(`${prefix}.txt`, text || 'No compact Page-472 text captured.');
  await screenshot(page, `${prefix}.png`, {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step,
    visibleLearning: 'Die MwSt.-Buchungsmatrix ist eine Listenseite. Bei Listenfeldern muss vor jeder Werteingabe ein echter Zeileneditor oder ein alternatives Eingabeformular sichtbar sein.',
    internallyProves: 'Page 472 editor-route state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No VAT setup write', 'No Preview Posting', 'No Posting', 'No VAT Entries', 'No final German VAT correctness'],
    ...extra
  });
  return text;
}

async function openMatrix(page: Page) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertContext(page);

  let text = await visibleText(page);
  if (page472Visible(text)) return { opened: true, route: 'direct-page-472' };

  await searchFor(page, 'MwSt.-Buchungsmatrix');
  await page.waitForTimeout(1200);
  await openSearchResult(page, /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i, { requireUnique: false });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertContext(page);
  text = await visibleText(page);
  return { opened: page472Visible(text), route: 'visible-tell-me-search' };
}

async function clickAction(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const candidate = frame.getByRole(role, { name: pattern }).first();
      if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
        await candidate.click({ timeout: 5000 }).catch(async () => candidate.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(1400);
        return { clicked: true, by: role, pattern: pattern.source };
      }
    }
  }
  return { clicked: false, by: 'not-found', pattern: pattern.source };
}

async function visibleEntries(page: Page, pattern: RegExp) {
  const all: CellEntry[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((source) => {
        const pattern = new RegExp(source, 'i');
        const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],[role="columnheader"],[role="row"],input,textarea,[contenteditable="true"],td,th')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = normalize(element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title'));
            if (
              !text ||
              !pattern.test(text) ||
              rect.width <= 1 ||
              rect.height <= 1 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity || '1') <= 0
            ) {
              return null;
            }
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(rect.y + rect.height / 2)
            };
          })
          .filter(Boolean)
          .slice(0, 360);
      }, pattern.source)
      .catch(() => []);
    all.push(...(entries as CellEntry[]));
  }
  return all;
}

async function rowCellCenters(page: Page, rowY: number) {
  const all: CellEntry[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((rowY) => {
        const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],td,input,textarea,[contenteditable="true"]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const centerY = rect.y + rect.height / 2;
            if (
              Math.abs(centerY - rowY) > 28 ||
              rect.width <= 5 ||
              rect.height <= 5 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity || '1') <= 0
            ) {
              return null;
            }
            return {
              text: normalize(element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title')),
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(centerY)
            };
          })
          .filter(Boolean)
          .sort((left, right) => left!.x - right!.x);
      }, rowY)
      .catch(() => []);
    all.push(...(entries as CellEntry[]));
  }

  const unique: CellEntry[] = [];
  for (const entry of all.sort((left, right) => left.x - right.x || left.width - right.width)) {
    if (unique.some((existing) => Math.abs(existing.centerX - entry.centerX) < 8)) continue;
    unique.push(entry);
  }
  return unique;
}

async function locateWritableRow(page: Page) {
  const target = (await visibleEntries(page, /INLAND|VAT19|Normale MwSt|Normal VAT|\b0\b/))
    .filter((entry) => /row|gridcell|td|div/i.test(entry.role))
    .filter((entry) => entry.y > 120 && entry.y < 420 && entry.height <= 100)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];

  return {
    y: target?.centerY ?? 220,
    row: target ?? null,
    source: target ? 'visible-default-or-target-row' : 'fallback-grid-y'
  };
}

async function editorSnapshot(page: Page, cell: { x: number; y: number }) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const data = await frame
      .evaluate(({ frameIndex, cell }) => {
        const normalize = (value: string | null | undefined, max = 700) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
        const rectOf = (element: Element | null) => {
          if (!element) return undefined;
          const rect = (element as HTMLElement).getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const visible = (element: Element) => {
          const html = element as HTMLElement;
          const rect = html.getBoundingClientRect();
          const style = window.getComputedStyle(html);
          return rect.width > 1 && rect.height > 1 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const active = document.activeElement as HTMLElement | null;
        const controls = [...document.querySelectorAll<HTMLElement>('input,textarea,select,[role="textbox"],[role="combobox"],[contenteditable="true"]')]
          .filter(visible)
          .map((element, index) => {
            const input = element as HTMLInputElement;
            const rect = element.getBoundingClientRect();
            const centerX = rect.x + rect.width / 2;
            const centerY = rect.y + rect.height / 2;
            const distanceFromCell = Math.round(Math.hypot(centerX - cell.x, centerY - cell.y));
            return {
              index,
              tag: element.tagName.toLowerCase(),
              role: normalize(element.getAttribute('role')),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              value: normalize(input.value || element.textContent),
              rowText: normalize(element.closest('[role="row"],tr')?.textContent, 900),
              cellText: normalize(element.closest('[role="gridcell"],td,[role="cell"]')?.textContent),
              readOnly: Boolean(input.readOnly || element.getAttribute('aria-readonly') === 'true'),
              disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
              rect: rectOf(element),
              distanceFromCell
            };
          })
          .sort((left, right) => left.distanceFromCell - right.distanceFromCell);

        const activeRect = rectOf(active);
        const activeCenter = activeRect ? { x: activeRect.x + activeRect.width / 2, y: activeRect.y + activeRect.height / 2 } : undefined;
        return {
          frameIndex,
          active: active
            ? {
                tag: active.tagName.toLowerCase(),
                role: normalize(active.getAttribute('role')),
                aria: normalize(active.getAttribute('aria-label')),
                title: normalize(active.getAttribute('title')),
                text: normalize(active.innerText || active.textContent),
                value: normalize((active as HTMLInputElement).value),
                rect: activeRect,
                rowText: normalize(active.closest('[role="row"],tr')?.textContent, 900),
                cellText: normalize(active.closest('[role="gridcell"],td,[role="cell"]')?.textContent),
                distanceFromCell: activeCenter ? Math.round(Math.hypot(activeCenter.x - cell.x, activeCenter.y - cell.y)) : undefined
              }
            : undefined,
          nearestControls: controls.slice(0, 30),
          rowScopedControls: controls.filter((control) => control.distanceFromCell < 280).slice(0, 30),
          allControlCount: controls.length
        };
      }, { frameIndex, cell })
      .catch(() => ({ frameIndex, active: undefined, nearestControls: [], rowScopedControls: [], allControlCount: 0 }));
    frames.push(data);
  }
  return frames;
}

async function probeCell(page: Page, key: string, x: number, y: number) {
  const probes = [];
  for (const route of ['single-click', 'double-click', 'enter-after-click', 'f2-after-click'] as const) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(300);
    if (route === 'double-click') await page.mouse.dblclick(x, y);
    if (route === 'enter-after-click') await page.keyboard.press('Enter').catch(() => undefined);
    if (route === 'f2-after-click') await page.keyboard.press('F2').catch(() => undefined);
    await page.waitForTimeout(700);
    probes.push({ route, key, x, y, snapshot: await editorSnapshot(page, { x, y }) });
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(300);
  }
  return probes;
}

function hasTrueEditor(probe: Array<Record<string, any>>) {
  for (const entry of probe) {
    for (const frame of entry.snapshot ?? []) {
      for (const control of frame.rowScopedControls ?? []) {
        if (
          !control.readOnly &&
          !control.disabled &&
          Number(control.distanceFromCell ?? 9999) <= 90 &&
          Number(control.rect?.height ?? 0) >= 18 &&
          Number(control.rect?.height ?? 0) <= 45 &&
          /Normale MwSt|0|INLAND|VAT19/i.test(`${control.rowText} ${control.cellText} ${control.aria} ${control.title}`)
        ) {
          return true;
        }
      }

      const active = frame.active;
      if (
        active &&
        /input|textarea|select/i.test(String(active.tag ?? '')) &&
        /textbox|combobox|input|select/i.test(`${active.role} ${active.tag}`) &&
        Number(active.distanceFromCell ?? 9999) <= 90 &&
        /Normale MwSt|0|INLAND|VAT19/i.test(`${active.rowText} ${active.cellText} ${active.aria} ${active.title}`)
      ) {
        return true;
      }
    }
  }

  return false;
}

test('TARGET-073 diagnoses Page 472 active editor route without typing VAT target values', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  const route = await openMatrix(page);
  actionsTaken.push(`Opened Page 472 using route: ${route.route}.`);
  if (!route.opened) blockedBy.push('Page 472 was not visibly reachable; no editor diagnosis possible.');

  const page472Url = sanitizeEvidenceUrl(page.url());
  const beforeText = await capture(page, 'target-073-010-page472-before-editor-diagnosis', 'Page 472 before editor diagnosis.', {
    route
  });

  const editRoute = route.opened ? await clickAction(page, /^Liste bearbeiten$|^Edit List$/i) : { clicked: false, by: 'blocked', pattern: '' };
  actionsTaken.push(`List edit diagnosis click: ${JSON.stringify(editRoute)}.`);
  await assertContext(page);

  const newRoute = route.opened ? await clickAction(page, /^Neu$|^New$/i) : { clicked: false, by: 'blocked', pattern: '' };
  actionsTaken.push(`New-row diagnosis click without value typing: ${JSON.stringify(newRoute)}.`);
  await assertContext(page);

  const afterNewText = await capture(page, 'target-073-020-after-edit-list-and-new-no-values', 'After Edit List/New diagnosis, before any editor probe.', {
    editRoute,
    newRoute
  });

  const rowInfo = await locateWritableRow(page);
  const cells = await rowCellCenters(page, rowInfo.y);
  const cellMap = {
    businessGroupX: cells[1]?.centerX ?? 780,
    productGroupX: cells[3]?.centerX ?? 912,
    vatPercentX: cells[7]?.centerX ?? 1335,
    calcTypeX: cells[8]?.centerX ?? 1398,
    salesVatX: cells[11]?.centerX ?? 1617,
    purchaseVatX: cells[13]?.centerX ?? 1725
  };

  await writeJson(path.join(EVIDENCE_DIR, 'target-073-030-row-and-cell-map.json'), {
    rowInfo,
    cells: cells.slice(0, 24),
    cellMap
  });

  const probes = [
    ...(await probeCell(page, 'vatBusinessPostingGroup', cellMap.businessGroupX, rowInfo.y)),
    ...(await probeCell(page, 'vatProductPostingGroup', cellMap.productGroupX, rowInfo.y)),
    ...(await probeCell(page, 'vatPercent', cellMap.vatPercentX, rowInfo.y)),
    ...(await probeCell(page, 'vatCalculationType', cellMap.calcTypeX, rowInfo.y)),
    ...(await probeCell(page, 'salesVatAccount', cellMap.salesVatX, rowInfo.y)),
    ...(await probeCell(page, 'purchaseVatAccount', cellMap.purchaseVatX, rowInfo.y))
  ];

  const editorRouteDetected = hasTrueEditor(probes);
  if (!editorRouteDetected) {
    blockedBy.push('No convincing row-scoped active editor was detected after single-click, double-click, Enter, or F2 probes.');
  } else {
    warnings.push('A possible row-scoped editor signal exists, but TARGET-073 did not type values. TARGET-071 must still validate before any write.');
  }

  await writeJson(path.join(EVIDENCE_DIR, 'target-073-040-active-editor-probes.json'), probes);
  await capture(page, 'target-073-050-after-editor-probes-no-values', 'After active editor probes; no VAT target values typed.', {
    rowInfo,
    cellMap,
    editorRouteDetected,
    probeRoutes: ['single-click', 'double-click', 'enter-after-click', 'f2-after-click']
  });

  const nextCase = editorRouteDetected
    ? 'TARGET-071-VAT-POSTING-SETUP-PAGE472-CONTROLLED-WRITE-GATE'
    : 'TARGET-068-W1-FOUNDATION-READY-CHECKPOINT-AFTER-DIMENSION-PARK';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-page472-active-editor-route-decision',
    resultStatus: editorRouteDetected ? 'observed-page472-active-editor-candidate' : 'blocked-page472-active-editor-route',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: page472Url,
    finalUrl: sanitizeEvidenceUrl(page.url()),
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    actionsTaken,
    actionsNotTaken: [
      'No INLAND typed',
      'No VAT19 typed',
      'No 19 typed',
      'No 3806 typed',
      'No 1406 typed',
      'No VAT setup value write',
      'No Page 470 write',
      'No Configuration Package import/export/validate/apply',
      'No cleanup/delete',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No payment',
      'No API shortcut',
      'No company switch',
      'No book change'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'target-073-010-page472-before-editor-diagnosis.png',
      'target-073-020-after-edit-list-and-new-no-values.png',
      'target-073-050-after-editor-probes-no-values.png'
    ],
    rowInfo,
    cellMap,
    editorRouteDetected,
    textSignals: {
      before: beforeText.split('\n').slice(0, 80),
      afterNew: afterNewText.split('\n').slice(0, 80)
    },
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was opened through the bounded route.',
      'TARGET-073 probed Page 472 row/cell focus routes without typing target VAT values.',
      'No setup, master data, document draft, Preview Posting, Posting, payment, API shortcut or company switch was executed.'
    ],
    notProved: [
      'No INLAND/VAT19 VAT Posting Setup row was saved.',
      'No VAT % 19 value was persisted.',
      'No Sales VAT Account 3806 value was persisted.',
      'No Purchase VAT Account 1406 value was persisted.',
      'No final German VAT correctness.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No Preview Posting.',
      'No Posting.'
    ],
    blockedBy,
    warnings,
    changedFiles: [
      `${EVIDENCE_REL_DIR}/TARGET-073-result.json`,
      `${EVIDENCE_REL_DIR}/README.md`,
      `${EVIDENCE_REL_DIR}/*.txt`,
      `${EVIDENCE_REL_DIR}/*.png`,
      `${EVIDENCE_REL_DIR}/*.screenshot.json`,
      `${EVIDENCE_REL_DIR}/*.json`
    ],
    evidenceRefs: [
      `${EVIDENCE_REL_DIR}/TARGET-073-result.json`,
      `${EVIDENCE_REL_DIR}/README.md`,
      `${EVIDENCE_REL_DIR}/target-073-040-active-editor-probes.json`
    ],
    requiresReview: true,
    safeToFinalizeState: false,
    statePatch: {},
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-071 reached Page 472 but did not detect a true active editor for target fields.',
      isPlannedNextCaseStillSensible: true,
      reason: 'TARGET-073 is the narrowest non-writing diagnosis before another VAT setup write gate.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-071-VAT-POSTING-SETUP-PAGE472-CONTROLLED-WRITE-GATE',
          status: editorRouteDetected ? 'ready-next' : 'blocked',
          reason: editorRouteDetected
            ? 'A possible active editor candidate exists, but TARGET-071 must still perform the gated write proof.'
            : 'Still no active editor route; repeating TARGET-071 would be blind.'
        },
        {
          caseId: 'TARGET-071B-VAT-POSTING-SETUP-REOPEN-AND-SOURCE-REVIEW',
          status: 'blocked',
          reason: 'No saved INLAND/VAT19 row exists.'
        },
        {
          caseId: 'TARGET-068-W1-FOUNDATION-READY-CHECKPOINT-AFTER-DIMENSION-PARK',
          status: editorRouteDetected ? 'ready-after-current' : 'ready-next',
          reason: editorRouteDetected
            ? 'Useful after write-gate classification.'
            : 'Best next step if VAT matrix write remains blocked; Foundation can be classified as learning-limited.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'blocked',
          reason: 'O2C remains blocked until VAT and General Posting Setup are proven or consciously limited.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: editorRouteDetected
        ? 'A possible editor candidate justifies one more controlled TARGET-071 attempt.'
        : 'The Page 472 editor route remains blocked after materially new probes, so a Foundation limitation checkpoint is more honest than another write attempt.',
      risksBeforeNextCase: [
        'Do not type VAT target values without a row-scoped editor.',
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.',
        'Do not create master data or documents before Foundation readiness.'
      ],
      requiredPreparation: editorRouteDetected
        ? ['Review TARGET-073 active-editor probe JSON before any TARGET-071 write retry.']
        : ['Update the Foundation checkpoint with VAT matrix route limitation and choose a non-repeating next setup route.']
    },
    nextCase,
    reason: editorRouteDetected
      ? 'TARGET-073 found a possible Page 472 active-editor candidate; no values were typed.'
      : 'TARGET-073 did not find a convincing Page 472 active-editor route after materially new probes; no values were typed.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Was man aus der Oberflaeche lernt',
      '',
      'Die MwSt.-Buchungsmatrix ist eine Listenmatrix. Ein sichtbarer Tabellenwert ist noch kein Eingabefeld. Vor einer Werteingabe muss die Zeile einen echten Editor, ein Eingabeformular oder eine eindeutig zeilengebundene Alternative zeigen.',
      '',
      '## Grenzen',
      '',
      '- Keine USt-Einrichtung wurde geschrieben.',
      '- Keine Zielwerte wurden getippt.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine Stammdaten.',
      '- Keine Belege.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.setupChanged).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
