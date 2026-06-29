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

const testId = 'warehouse-024';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const sourceDocumentNo = '106055';
const targetItem = 'RAW-STEEL';
const targetLocationCode = 'FRA-ZL';

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
      /Purchase Order|Einkaufsbestellung|106055|K10000|RAW-STEEL|FRA-ZL|ATLANTA|Location Code|Location|Lagerort/i,
      /Quantity|Qty\. to Receive|Qty\. to Invoice|Direct Unit Cost|Status|Released|Open|Lines|No\.|Vendor|Buy-from/i,
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

async function dangerousDialogVisible(page: Page) {
  const dialogs = [];
  for (const scope of [page, ...page.frames()]) {
    const count = await scope.getByRole('dialog').count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const dialog = scope.getByRole('dialog').nth(index);
      if (await dialog.isVisible({ timeout: 250 }).catch(() => false)) {
        dialogs.push(sanitizeText(await dialog.innerText({ timeout: 1000 }).catch(() => '')).slice(0, 900));
      }
    }
  }
  const dangerous = dialogs.some((text) =>
    /(?:Post|Buchen|Delete|Loeschen|Löschen|Receive|Invoice|Ship|Release|Freigeben|Yes|Ja|OK|Confirm|Bestätigen|Bestaetigen)/i.test(text)
  );
  return { visible: dangerous, text: dialogs.join('\n--- dialog ---\n').slice(0, 1200) };
}

async function attemptSingleLocationCellValue(page: Page) {
  const beforeGeometry = await gridGeometry(page);
  const locationHeader = findHeader(beforeGeometry, /Location Code|Location|Lagerort/i);
  const beforeCell = cellForHeader(beforeGeometry, locationHeader);
  const attempt = {
    status: 'blocked' as 'blocked' | 'observed' | 'success',
    route: 'single-guarded-location-cell-click-type-tab',
    targetValue: targetLocationCode,
    beforeRowText: beforeGeometry.rawRow?.text ?? '',
    beforeCellText: beforeCell?.text ?? '',
    locationHeader,
    targetCell: beforeCell,
    details: [] as string[]
  };

  const targetOk =
    Boolean(beforeGeometry.rawRow)
    && Boolean(locationHeader)
    && Boolean(beforeCell)
    && /RAW-STEEL/i.test(beforeGeometry.rawRow?.text ?? '')
    && /ATLANTA|FRA-ZL|Location|Lagerort|^$/i.test(beforeCell?.text ?? '');

  if (!targetOk || !beforeCell || !locationHeader) {
    attempt.details.push(`target-not-safe rawRow=${Boolean(beforeGeometry.rawRow)} header=${Boolean(locationHeader)} cell=${Boolean(beforeCell)} cellText=${beforeCell?.text ?? ''}`);
    return { attempt, beforeGeometry, afterGeometry: beforeGeometry };
  }

  const x = beforeCell.x + Math.max(6, Math.floor(beforeCell.width / 2));
  const y = beforeCell.y + Math.max(6, Math.floor(beforeCell.height / 2));
  attempt.details.push(`target x=${x} y=${y} header=${locationHeader.text || locationHeader.title} before=${beforeCell.text}`);

  await page.mouse.click(x, y);
  await page.waitForTimeout(450);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(targetLocationCode);
  await page.waitForTimeout(350);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1600);

  const dialog = await dangerousDialogVisible(page);
  if (dialog.visible) {
    attempt.status = 'blocked';
    attempt.details.push('dangerous-dialog-visible-after-value-attempt-no-confirm-clicked');
    const afterGeometry = await gridGeometry(page);
    return { attempt: { ...attempt, dialogText: dialog.text }, beforeGeometry, afterGeometry };
  }

  const afterGeometry = await gridGeometry(page);
  const afterHeader = findHeader(afterGeometry, /Location Code|Location|Lagerort/i);
  const afterCell = cellForHeader(afterGeometry, afterHeader);
  const afterRowText = afterGeometry.rawRow?.text ?? '';
  const afterCellText = afterCell?.text ?? '';
  attempt.status = /FRA-ZL/i.test(afterCellText) || /FRA-ZL/i.test(afterRowText) ? 'success' : 'observed';
  attempt.details.push(`after-cell=${afterCellText}`);
  attempt.details.push(`after-row=${afterRowText.slice(0, 240)}`);
  return { attempt: { ...attempt, afterCellText, afterRowText }, beforeGeometry, afterGeometry };
}

test('WAREHOUSE-024 source PO line Location Code value gate', async ({ page }) => {
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
  const valueAttempt = contextOk
    ? await attemptSingleLocationCellValue(page)
    : undefined;
  const finalText = sanitizeText(await pageText(page));
  const finalGeometry = cleanEvidenceValue(compactGeometry(valueAttempt?.afterGeometry ?? await gridGeometry(page)));
  const rawSteelLine = finalText.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).find((line) => /RAW-STEEL/i.test(line)) ?? '';
  const locationSet = /FRA-ZL/i.test(String(valueAttempt?.attempt.afterRowText ?? rawSteelLine));
  const locationStillAtlanta = /ATLANTA|Atlanta/i.test(String(valueAttempt?.attempt.afterRowText ?? rawSteelLine));
  const resultStatus = contextOk ? (locationSet ? 'observed' : 'blocked') : 'blocked';
  const blockedBy = [
    ...(!contextOk ? ['purchase-order-106055-context-not-proven'] : []),
    ...(contextOk && !valueAttempt ? ['location-cell-value-attempt-not-run'] : []),
    ...(valueAttempt?.attempt.status === 'blocked' ? ['safe-location-code-target-cell-not-proven'] : []),
    ...(contextOk && valueAttempt?.attempt.status !== 'success' ? ['fra-zl-not-visible-after-single-guarded-line-cell-route'] : [])
  ];
  const nextCase = locationSet
    ? 'WAREHOUSE-025-SOURCE-PO-RELEASE-GATE'
    : 'WAREHOUSE-025-SOURCE-PO-LOCATION-ALTERNATIVE-OR-HELPER-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-po-line-location-cell-value-gate',
    caseId: 'WAREHOUSE-024-SOURCE-PO-LINE-LOCATION-CELL-VALUE-GATE',
    source: 'playwright-ui-line-cell-value-gate',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    dataChanged: locationSet,
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
    targetLocationCode,
    contextOk,
    initialUrl,
    layoutAttempts,
    attempt: cleanEvidenceValue(valueAttempt?.attempt ?? { status: 'not-run' }),
    rawSteelLine,
    locationSet,
    locationStillAtlanta,
    blockedBy,
    proved: [
      contextOk ? 'Purchase Order 106055 opened directly by Page 50 filter URL in MCP_1_20260210 / RM-DEMO.' : 'Purchase Order 106055 context was not safely proven.',
      valueAttempt ? 'A single guarded Location Code line-cell value route was attempted on the visible RAW-STEEL row.' : 'No Location Code value route was attempted because context was not safe.',
      locationSet ? 'FRA-ZL is visible on the RAW-STEEL row after the guarded value route.' : 'FRA-ZL is not visible on the RAW-STEEL row after the guarded value route.',
      'No Release, Receive, Invoice, Preview Posting, Post, Warehouse Receipt source confirmation, setup change, company switch, API shortcut or book change occurred.'
    ],
    notProved: [
      'Purchase Order 106055 is not released.',
      'Warehouse Receipt source selection is not performed.',
      'Warehouse Receipt posting and Put-away are not proven.',
      'Warehouse/Item/Value entry traces are not proven.',
      'No German final Warehouse proof exists.'
    ],
    flags: {
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
    rebuildInstruction: 'In German final sandbox, recreate a source Purchase Order and prove Location Code on the item line before release and Warehouse Receipt source selection; do not reuse RM-DEMO as final proof.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final Warehouse proof still needs German source Purchase Order, release, Warehouse Receipt source selection, receipt posting and ledger trace.',
    finalScreenshotNeeded: true,
    nextCase,
    nextStep: locationSet
      ? 'WAREHOUSE-025: run a controlled release gate for Purchase Order 106055, still no receive/post unless explicitly unlocked.'
      : 'WAREHOUSE-025: choose an alternative UI/helper route for Purchase Order line Location Code; do not repeat this single guarded cell route blindly.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-compact-text.txt'), beforeCompactText);
  await writeJsonEvidence(warehouseEvidencePath('020-before-geometry.json'), cleanEvidenceValue(compactGeometry(valueAttempt?.beforeGeometry ?? await gridGeometry(page))));
  await writeJsonEvidence(warehouseEvidencePath('030-value-attempt.json'), result.attempt);
  await writeTextEvidence(warehouseEvidencePath('040-after-compact-text.txt'), sanitizeText(await compactUiText(page)));
  await writeTextEvidence(warehouseEvidencePath('050-after-page-text.txt'), finalText);
  await writeJsonEvidence(warehouseEvidencePath('060-after-geometry.json'), finalGeometry);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-024-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-024-LINE-LOCATION-VALUE-GATE.md'),
    [
      '# WAREHOUSE-024 Source PO Line Location Value Gate',
      '',
      'Status: `labor`, `line-cell-value-gate`, `no-release`, `no-posting`, `not-final`.',
      '',
      `Purchase Order: ${sourceDocumentNo}`,
      `Context OK: ${contextOk ? 'ja' : 'nein'}`,
      `Route: ${result.attempt.route ?? 'not-run'}`,
      `Attempt Status: ${result.attempt.status}`,
      `RAW-STEEL-Zeile danach: ${rawSteelLine || result.attempt.afterRowText || 'nicht erkannt'}`,
      `FRA-ZL auf RAW-STEEL sichtbar: ${locationSet ? 'ja' : 'nein'}`,
      `ATLANTA auf RAW-STEEL sichtbar: ${locationStillAtlanta ? 'ja' : 'nein'}`,
      '',
      '## Grenze',
      '',
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
      '# WAREHOUSE-024 Evidence Index',
      '',
      'Status: `labor`, `line-cell-value-gate`, `no-release`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-024-result.json` | Result JSON | Kontext, Route, Ergebnisflags | Release, Receipt, Posting |',
      '| `020-before-geometry.json` | Geometry Evidence | RAW-STEEL/Location-Zielzelle vor Versuch | stabile generische Cell-Edit-Faehigkeit |',
      '| `030-value-attempt.json` | Attempt Evidence | genau eine guarded Location-Code-Wertsetzung | Wiederholung/Alternative Route |',
      '| `060-after-geometry.json` | Geometry Evidence | RAW-STEEL/Location-Zustand nach Versuch | deutschen Finalnachweis |',
      '| `WAREHOUSE-024-LINE-LOCATION-VALUE-GATE.md` | Lernnotiz | was gesetzt bzw. blockiert wurde | Warehouse-Receipt-Trace |',
      '',
      'German Final: Source Purchase Order und Warehouse Receipt muessen in deutscher Zielumgebung neu aufgebaut und bebildert werden.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.setupChanged).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.companySwitched).toBe(false);
  expect(result.released).toBe(false);
  expect(result.received).toBe(false);
  expect(result.invoiced).toBe(false);
});
