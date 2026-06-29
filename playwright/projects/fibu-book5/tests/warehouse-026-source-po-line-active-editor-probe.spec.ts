import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { compactPageText, dismissTours, hideFactBoxPane, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(240_000);

const testId = 'warehouse-026';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const sourceDocumentNo = '106055';
const targetItem = 'RAW-STEEL';

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

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function purchaseOrderCardUrl(orderNo: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', company);
  url.searchParams.set('page', '50');
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${orderNo}'`);
  return url.toString();
}

function sanitizeText(text: string) {
  return text
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u009f/g, 'ss')
    .replace(/\u00c3\u009c/g, 'Ue')
    .replace(/\u00c3\u0096/g, 'Oe')
    .replace(/\u00c3\u0084/g, 'Ae')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function cleanEvidenceValue<T>(value: T): T {
  if (typeof value === 'string') return sanitizeText(value) as T;
  if (Array.isArray(value)) return value.map((entry) => cleanEvidenceValue(entry)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cleanEvidenceValue(entry)])) as T;
  }
  return value;
}

async function compactUiText(page: Page) {
  return compactPageText(page, {
    include: [
      /Purchase Order|106055|K10000|RAW-STEEL|FRA-ZL|ATLANTA|Location Code|Location|Lagerort/i,
      /Quantity|Qty\. to Receive|Direct Unit Cost|Status|Open|Lines|No\.|Vendor|Line Details|Zeilendetails/i,
      /Show more|Mehr anzeigen|Focus mode|Fokusmodus|Maximize|Maximieren|Expand|Erweitern/i
    ],
    maxLines: 260
  });
}

async function clickSafeLayoutAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const locator = scope.getByRole(role, { name: label }).first();
      if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
        await locator.click({ timeout: 3000 });
        await page.waitForTimeout(1400);
        return { clicked: true, role, label: label.source };
      }
    }
    const text = scope.getByText(label).first();
    if (await text.isVisible({ timeout: 700 }).catch(() => false)) {
      await text.click({ timeout: 3000 });
      await page.waitForTimeout(1400);
      return { clicked: true, role: 'text', label: label.source };
    }
  }
  return { clicked: false, label: label.source };
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
            height: Math.round(rect.height)
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
      { itemNo: targetItem, frameIndex }
    ).catch(() => ({ frameIndex, headers: [], rows: [], rawRow: undefined }));
    const offset = { x: Math.round(frameBox?.x ?? 0), y: Math.round(frameBox?.y ?? 0) };
    const offsetCell = (cell: CellSnapshot): CellSnapshot => ({ ...cell, x: cell.x + offset.x, y: cell.y + offset.y });
    frames.push({
      ...frameData,
      frameOffset: offset,
      headers: frameData.headers.map(offsetCell),
      rows: frameData.rows.map((row) => ({ ...offsetCell(row), cells: row.cells?.map(offsetCell) })),
      rawRow: frameData.rawRow ? { ...offsetCell(frameData.rawRow), cells: frameData.rawRow.cells?.map(offsetCell) } : undefined
    });
  }
  const match = frames.find((frame) => frame.rawRow && frame.headers.length > 0) ?? frames.find((frame) => frame.rawRow) ?? frames[0] ?? { headers: [], rows: [] };
  return { ...match, frames };
}

function compactGeometry(geometry: GridGeometry) {
  const relevantHeader = (header: CellSnapshot) => /Type|No\.|Description|Location Code|Location|Quantity|Direct Unit Cost|Qty\. to Receive/i.test(headerText(header));
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
      cells: geometry.rawRow.cells
    } : undefined,
    frameSummary: geometry.frames?.map((frame) => ({
      frameIndex: frame.frameIndex,
      headerCount: frame.headers.length,
      rowCount: frame.rows.length,
      hasRawRow: Boolean(frame.rawRow)
    }))
  };
}

async function focusTargetCell(page: Page) {
  const beforeGeometry = await gridGeometry(page);
  const locationHeader = findHeader(beforeGeometry, /Location Code|Location|Lagerort/i);
  const targetCell = cellForHeader(beforeGeometry, locationHeader);
  if (!beforeGeometry.rawRow || !locationHeader || !targetCell) {
    return {
      focused: false,
      reason: `target-not-safe rawRow=${Boolean(beforeGeometry.rawRow)} header=${Boolean(locationHeader)} cell=${Boolean(targetCell)}`,
      beforeGeometry,
      afterGeometry: beforeGeometry
    };
  }
  const x = targetCell.x + Math.max(6, Math.floor(targetCell.width / 2));
  const y = targetCell.y + Math.max(6, Math.floor(targetCell.height / 2));
  await page.mouse.click(x, y);
  await page.waitForTimeout(1000);
  const afterGeometry = await gridGeometry(page);
  return {
    focused: true,
    x,
    y,
    locationHeader,
    targetCell,
    beforeRowText: beforeGeometry.rawRow.text,
    beforeCellText: targetCell.text,
    afterGeometry
  };
}

async function activeEditorSnapshot(page: Page) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const data = await frame.evaluate(({ frameIndex }) => {
      const normalize = (value: string | null | undefined, max = 360) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const rectOf = (element: Element | null) => {
        if (!element) return undefined;
        const rect = (element as HTMLElement).getBoundingClientRect();
        return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
      };
      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const rect = html.getBoundingClientRect();
        const style = window.getComputedStyle(html);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const active = document.activeElement as HTMLElement | null;
      const controls = [...document.querySelectorAll('input,textarea,select,[role="textbox"],[role="combobox"],[contenteditable="true"]')]
        .filter(visible)
        .map((element, index) => {
          const html = element as HTMLInputElement;
          const row = html.closest('[role="row"],tr');
          const cell = html.closest('[role="gridcell"],td,[role="cell"]');
          return {
            index,
            tag: html.tagName.toLowerCase(),
            role: normalize(html.getAttribute('role')),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            value: normalize(html.value || html.textContent),
            rowText: normalize(row?.textContent, 700),
            cellText: normalize(cell?.textContent),
            readOnly: Boolean(html.readOnly || html.getAttribute('aria-readonly') === 'true'),
            disabled: Boolean(html.disabled || html.getAttribute('aria-disabled') === 'true'),
            rect: rectOf(html)
          };
        });
      return {
        frameIndex,
        active: active ? {
          tag: active.tagName.toLowerCase(),
          role: normalize(active.getAttribute('role')),
          aria: normalize(active.getAttribute('aria-label')),
          title: normalize(active.getAttribute('title')),
          text: normalize(active.innerText || active.textContent),
          value: normalize((active as HTMLInputElement).value),
          rect: rectOf(active),
          rowText: normalize(active.closest('[role="row"],tr')?.textContent, 700),
          cellText: normalize(active.closest('[role="gridcell"],td,[role="cell"]')?.textContent)
        } : undefined,
        rawSteelControls: controls.filter((control) => /RAW-STEEL|Location Code|Location|Lagerort|ATLANTA|FRA-ZL/i.test(`${control.aria} ${control.title} ${control.value} ${control.rowText} ${control.cellText}`)).slice(0, 40),
        allControlCount: controls.length
      };
    }, { frameIndex }).catch(() => ({ frameIndex, active: undefined, rawSteelControls: [], allControlCount: 0 }));
    frames.push(data);
  }
  return frames;
}

async function lineActionCandidates(page: Page) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const data = await frame.evaluate(({ frameIndex }) => {
      const normalize = (value: string | null | undefined, max = 220) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const rect = html.getBoundingClientRect();
        const style = window.getComputedStyle(html);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      return [...document.querySelectorAll('button,[role="button"],a,[role="menuitem"],[aria-label],[title]')]
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
            height: Math.round(rect.height)
          };
        })
        .filter((entry) => /Line|Zeile|Details|Manage|Verwalten|Functions|Funktionen|Order|Select items|Focus mode|Fokusmodus|Edit|Bearbeiten/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
        .slice(0, 120);
    }, { frameIndex }).catch(() => []);
    frames.push({ frameIndex, candidates: data });
  }
  return frames;
}

test('WAREHOUSE-026 source PO line active editor probe', async ({ page }) => {
  await page.goto(purchaseOrderCardUrl(sourceDocumentNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  await page.waitForTimeout(2500);

  const initialUrl = decodeURIComponent(page.url());
  const initialText = sanitizeText(await pageText(page));
  const contextOk = /MCP_1_20260210/i.test(initialUrl)
    && /company=RM-DEMO/i.test(initialUrl)
    && new RegExp(`\\b${sourceDocumentNo}\\b`).test(initialText);

  const layoutAttempts = [];
  layoutAttempts.push(await clickSafeLayoutAction(page, /Maximize|Maximieren|Expand|Erweitern|Open in full screen|Vollbild/i));
  layoutAttempts.push(await clickSafeLayoutAction(page, /Wide layout|Breite Layoutansicht|Layout/i));
  layoutAttempts.push(await clickSafeLayoutAction(page, /Focus mode|Fokusmodus/i));
  layoutAttempts.push(await clickSafeLayoutAction(page, /Show more|Mehr anzeigen|Mehr anzeigen\.\.\.|Mehr|Weitere anzeigen/i));
  await page.waitForTimeout(1800);

  const beforeCompactText = sanitizeText(await compactUiText(page));
  const focus = contextOk ? await focusTargetCell(page) : undefined;
  const editor = cleanEvidenceValue(await activeEditorSnapshot(page));
  const actions = cleanEvidenceValue(await lineActionCandidates(page));
  const finalText = sanitizeText(await pageText(page));
  const geometry = cleanEvidenceValue(compactGeometry(focus?.afterGeometry ?? await gridGeometry(page)));
  const rawSteelLine = finalText.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).find((line) => /RAW-STEEL/i.test(line)) ?? '';
  const rowScopedEditableControls = editor.flatMap((frame: any) => frame.rawSteelControls ?? [])
    .filter((control: any) => !control.readOnly && !control.disabled && /RAW-STEEL|ATLANTA|Location|Lagerort/i.test(`${control.rowText} ${control.cellText} ${control.aria} ${control.title}`));
  const activeLooksEditor = editor.some((frame: any) =>
    /input|textarea|select/i.test(String(frame.active?.tag ?? '')) ||
    /textbox|combobox/i.test(String(frame.active?.role ?? ''))
  );
  const lineActionCount = actions.reduce((sum: number, frame: any) => sum + (frame.candidates?.length ?? 0), 0);
  const compactFocus = focus ? cleanEvidenceValue({
    focused: focus.focused,
    reason: focus.reason,
    x: focus.x,
    y: focus.y,
    locationHeader: focus.locationHeader,
    targetCell: focus.targetCell,
    beforeRowText: focus.beforeRowText,
    beforeCellText: focus.beforeCellText
  }) : { focused: false, reason: 'context-not-ok' };
  const resultStatus = contextOk ? 'observed' : 'blocked';
  const blockedBy = [
    ...(!contextOk ? ['purchase-order-106055-context-not-proven'] : []),
    ...(contextOk && !focus?.focused ? ['raw-steel-location-cell-focus-not-proven'] : []),
    ...(contextOk && !activeLooksEditor && rowScopedEditableControls.length === 0 ? ['no-active-editor-or-row-scoped-editable-control-after-focus'] : [])
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-po-line-active-editor-probe',
    caseId: 'WAREHOUSE-026-SOURCE-PO-LINE-ACTIVE-EDITOR-PROBE',
    source: 'playwright-ui-active-editor-probe',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    dataChanged: false,
    valueTyped: false,
    companySwitched: false,
    apiShortcut: false,
    bookChanged: false,
    released: false,
    received: false,
    invoiced: false,
    warehouseSourceConfirmed: false,
    sourceDocumentType: 'Purchase Order',
    sourceDocumentNo,
    targetItem,
    contextOk,
    initialUrl,
    layoutAttempts,
    focus: compactFocus,
    rawSteelLine,
    activeLooksEditor,
    rowScopedEditableControlCount: rowScopedEditableControls.length,
    lineActionCount,
    blockedBy,
    proved: [
      contextOk ? 'Purchase Order 106055 opened directly by Page 50 filter URL in MCP_1_20260210 / RM-DEMO.' : 'Purchase Order 106055 context was not safely proven.',
      focus?.focused ? 'The RAW-STEEL Location Code cell was focused without typing a value.' : 'The RAW-STEEL Location Code cell was not safely focused.',
      activeLooksEditor || rowScopedEditableControls.length > 0 ? 'An active editor or row-scoped editable control signal is visible after focus.' : 'No active editor or row-scoped editable control is visible after focus.',
      lineActionCount > 0 ? 'Line/action candidates were captured for a possible alternative route.' : 'No line/action candidates were captured.',
      'No value entry, Release, Receive, Invoice, Preview Posting, Post, Warehouse Receipt source confirmation, setup change, company switch, API shortcut or book change occurred.'
    ],
    notProved: [
      'Location Code FRA-ZL is not entered or proven.',
      'Purchase Order 106055 is not released.',
      'Warehouse Receipt source selection is not performed.',
      'Warehouse Receipt posting and Put-away are not proven.',
      'No German final Warehouse proof exists.'
    ],
    flags: {
      noValueEntry: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noReceive: true,
      noInvoice: true,
      noRelease: true,
      noWarehouseReceiptSourceConfirmation: true
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In German final sandbox, use this probe pattern only to validate editable line routes before setting final Location Code values.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final Warehouse proof needs an editable source-line route or setup/default path before release and receipt.',
    finalScreenshotNeeded: false,
    nextCase: activeLooksEditor || rowScopedEditableControls.length > 0
      ? 'WAREHOUSE-027-SOURCE-PO-LOCATION-EDITOR-VALUE-PREFLIGHT'
      : 'WAREHOUSE-027-SOURCE-PO-LINE-DETAILS-ACTION-ROUTE',
    nextStep: activeLooksEditor || rowScopedEditableControls.length > 0
      ? 'WAREHOUSE-027: run a guarded value preflight using the proven active editor/control; still stop before release.'
      : 'WAREHOUSE-027: use captured line action candidates to find a Line Details/action route; do not type into the display cell.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-compact-text.txt'), beforeCompactText);
  await writeJsonEvidence(warehouseEvidencePath('020-focus-target.json'), compactFocus);
  await writeJsonEvidence(warehouseEvidencePath('030-active-editor-snapshot.json'), editor);
  await writeJsonEvidence(warehouseEvidencePath('040-line-action-candidates.json'), actions);
  await writeJsonEvidence(warehouseEvidencePath('050-geometry-after-focus.json'), geometry);
  await writeTextEvidence(warehouseEvidencePath('060-after-compact-text.txt'), sanitizeText(await compactUiText(page)));
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-026-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-026-ACTIVE-EDITOR-PROBE.md'),
    [
      '# WAREHOUSE-026 Source PO Line Active Editor Probe',
      '',
      'Status: `labor`, `active-editor-probe`, `no-value-entry`, `no-release`, `no-posting`, `not-final`.',
      '',
      `Purchase Order: ${sourceDocumentNo}`,
      `Context OK: ${contextOk ? 'ja' : 'nein'}`,
      `RAW-STEEL-Zeile: ${rawSteelLine || 'nicht erkannt'}`,
      `Zielzelle fokussiert: ${focus?.focused ? 'ja' : 'nein'}`,
      `Active Editor sichtbar: ${activeLooksEditor ? 'ja' : 'nein'}`,
      `Row-scoped editable Controls: ${rowScopedEditableControls.length}`,
      `Line Action Candidates: ${lineActionCount}`,
      '',
      '## Grenze',
      '',
      '- Keine Werteingabe.',
      '- Kein Release.',
      '- Kein Receive.',
      '- Keine Invoice.',
      '- Kein Preview Posting.',
      '- Kein Post.',
      '- Kein Warehouse Receipt Source Confirm.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    warehouseEvidencePath('README.md'),
    [
      '# WAREHOUSE-026 Evidence Index',
      '',
      'Status: `labor`, `active-editor-probe`, `no-value-entry`, `no-release`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-026-result.json` | Result JSON | Kontext, Fokus, Editor-/Action-Signale | Wertsetzung, Release, Receipt, Posting |',
      '| `020-focus-target.json` | Fokus Evidence | RAW-STEEL/Location-Zielzelle wurde fokussiert oder nicht | Schreibfaehigkeit |',
      '| `030-active-editor-snapshot.json` | Editor Evidence | aktives Element und row-scoped Controls nach Fokus | finalen Wertebeweis |',
      '| `040-line-action-candidates.json` | Action Evidence | moegliche Line-/Details-Aktionen | dass eine Aktion schon genutzt wurde |',
      '| `WAREHOUSE-026-ACTIVE-EDITOR-PROBE.md` | Lernnotiz | naechsten sicheren Pfad | deutschen Finalnachweis |',
      '',
      'German Final: Source Purchase Order und Warehouse Receipt muessen spaeter in deutscher Zielumgebung neu aufgebaut und bebildert werden.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.setupChanged).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.companySwitched).toBe(false);
  expect(result.valueTyped).toBe(false);
  expect(result.released).toBe(false);
  expect(result.received).toBe(false);
  expect(result.invoiced).toBe(false);
});
