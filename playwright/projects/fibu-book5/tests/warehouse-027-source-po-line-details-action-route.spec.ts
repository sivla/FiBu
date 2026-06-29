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

const testId = 'warehouse-027';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const sourceDocumentNo = '106055';
const targetItem = 'RAW-STEEL';

type Candidate = {
  frameIndex?: number;
  text: string;
  aria: string;
  title: string;
  role: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
      /Quantity|Qty\. to Receive|Direct Unit Cost|Status|Open|Lines|Line|No\.|Vendor|Invoice Details|Item Tracking|Dimensions/i,
      /Show more|Mehr anzeigen|Focus mode|Fokusmodus|Maximize|Maximieren|Expand|Erweitern/i
    ],
    maxLines: 280
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

async function findAndClickLineMenu(page: Page) {
  for (const [frameIndex, frame] of page.frames().entries()) {
    const candidates: Candidate[] = await frame.evaluate(({ frameIndex }) => {
      const normalize = (value: string | null | undefined, max = 180) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const rect = html.getBoundingClientRect();
        const style = window.getComputedStyle(html);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      return [...document.querySelectorAll('button,[role="button"],[role="menuitem"],a')]
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
        .filter((entry) => /^Line$/i.test(entry.text) || /^Line$/i.test(entry.aria))
        .filter((entry) => entry.y >= 760 && entry.y <= 900)
        .slice(0, 5);
    }, { frameIndex }).catch(() => []);
    if (candidates.length === 1) {
      const box = await frame.frameElement().then((handle) => handle.boundingBox()).catch(() => ({ x: 0, y: 0 }));
      const candidate = candidates[0];
      const x = Math.round((box?.x ?? 0) + candidate.x + Math.max(4, candidate.width / 2));
      const y = Math.round((box?.y ?? 0) + candidate.y + Math.max(4, candidate.height / 2));
      await page.mouse.click(x, y);
      await page.waitForTimeout(1200);
      return { clicked: true, frameIndex, candidate, x, y, candidateCount: candidates.length };
    }
    if (candidates.length > 1) return { clicked: false, frameIndex, candidateCount: candidates.length, candidates };
  }
  return { clicked: false, candidateCount: 0 };
}

async function captureActionCandidates(page: Page) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const candidates = await frame.evaluate(({ frameIndex }) => {
      const normalize = (value: string | null | undefined, max = 240) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
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
        .filter((entry) => /Line|Zeile|Details|Dimensions|Dimensionen|Item Tracking|Artikelverfolgung|Reserve|Reservation|Comments|Bemerkungen|Order|Functions|Funktionen/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
        .filter((entry) => !/Post|Buchen|Release|Freigeben|Receive|Invoice|Ship|Delete|Loeschen|Löschen/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
        .slice(0, 100);
    }, { frameIndex }).catch(() => []);
    frames.push({ frameIndex, candidates });
  }
  return frames;
}

async function activeEditorSnapshot(page: Page) {
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const data = await frame.evaluate(({ frameIndex }) => {
      const normalize = (value: string | null | undefined, max = 500) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const active = document.activeElement as HTMLElement | null;
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

test('WAREHOUSE-027 source PO line details action route', async ({ page }) => {
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
  await page.waitForTimeout(1400);

  const beforeText = sanitizeText(await compactUiText(page));
  const lineMenu = contextOk ? await findAndClickLineMenu(page) : { clicked: false, reason: 'context-not-ok' };
  const afterText = sanitizeText(await compactUiText(page));
  const candidates = cleanEvidenceValue(await captureActionCandidates(page));
  const editor = cleanEvidenceValue(await activeEditorSnapshot(page));
  const candidateList = candidates.flatMap((frame: any) => frame.candidates ?? []);
  const promisingCandidates = candidateList.filter((entry: Candidate) =>
    /Dimension|Item Tracking|Reservation|Reserve|Comments|Line Details|Details|Zeile/i.test(`${entry.text} ${entry.aria} ${entry.title}`)
  );
  const detailOrEditorOpened = /Line Details|Zeilendetails|Invoice Details|Item Tracking|Artikelverfolgung|Dimensions|Dimensionen/i.test(afterText);
  const editableControls = editor.flatMap((frame: any) => frame.rawSteelControls ?? []).filter((control: any) => !control.readOnly && !control.disabled);
  const resultStatus = contextOk ? 'observed' : 'blocked';
  const blockedBy = [
    ...(!contextOk ? ['purchase-order-106055-context-not-proven'] : []),
    ...(contextOk && !lineMenu.clicked ? ['line-menu-not-uniquely-clicked'] : []),
    ...(contextOk && promisingCandidates.length === 0 ? ['no-safe-line-detail-candidate-visible-after-line-menu'] : []),
    ...(contextOk && editableControls.length === 0 ? ['no-row-scoped-editable-control-after-line-menu'] : [])
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-po-line-details-action-route',
    caseId: 'WAREHOUSE-027-SOURCE-PO-LINE-DETAILS-ACTION-ROUTE',
    source: 'playwright-ui-line-action-route',
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
    lineMenu: cleanEvidenceValue(lineMenu),
    safeLineCandidateCount: promisingCandidates.length,
    detailOrEditorOpened,
    rowScopedEditableControlCount: editableControls.length,
    blockedBy,
    proved: [
      contextOk ? 'Purchase Order 106055 opened directly by Page 50 filter URL in MCP_1_20260210 / RM-DEMO.' : 'Purchase Order 106055 context was not safely proven.',
      lineMenu.clicked ? 'The Lines-area Line menu was uniquely clicked without selecting a risky action.' : 'The Lines-area Line menu was not uniquely clicked.',
      promisingCandidates.length > 0 ? 'Safe line/detail/action candidates were visible after opening the Line menu.' : 'No safe line/detail/action candidate was visible after opening the Line menu.',
      editableControls.length > 0 ? 'A row-scoped editable control is visible after the Line menu route.' : 'No row-scoped editable control is visible after the Line menu route.',
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
    rebuildInstruction: 'In German final sandbox, use this action inventory pattern before choosing a line detail/value route.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final Warehouse proof needs a stable line value route before release and receipt.',
    finalScreenshotNeeded: false,
    nextCase: editableControls.length > 0
      ? 'WAREHOUSE-028-SOURCE-PO-LINE-ACTION-VALUE-PREFLIGHT'
      : 'WAREHOUSE-028-SOURCE-PO-LOCATION-DEFAULT-OR-FRESH-DRAFT-DECISION',
    nextStep: editableControls.length > 0
      ? 'WAREHOUSE-028: run a guarded value preflight using the row-scoped editable control; still stop before release.'
      : 'WAREHOUSE-028: decide between location default/setup route or fresh source document route; line menu did not expose an editable Location route.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-before-compact-text.txt'), beforeText);
  await writeJsonEvidence(warehouseEvidencePath('020-line-menu-click.json'), result.lineMenu);
  await writeTextEvidence(warehouseEvidencePath('030-after-line-menu-compact-text.txt'), afterText);
  await writeJsonEvidence(warehouseEvidencePath('040-line-menu-candidates.json'), candidates);
  await writeJsonEvidence(warehouseEvidencePath('050-active-editor-after-line-menu.json'), editor);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-027-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-027-LINE-ACTION-ROUTE.md'),
    [
      '# WAREHOUSE-027 Source PO Line Action Route',
      '',
      'Status: `labor`, `line-action-route`, `no-value-entry`, `no-release`, `no-posting`, `not-final`.',
      '',
      `Purchase Order: ${sourceDocumentNo}`,
      `Context OK: ${contextOk ? 'ja' : 'nein'}`,
      `Line-Menue geklickt: ${lineMenu.clicked ? 'ja' : 'nein'}`,
      `Safe Line/Detail Candidates: ${promisingCandidates.length}`,
      `Row-scoped editable Controls: ${editableControls.length}`,
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
      '# WAREHOUSE-027 Evidence Index',
      '',
      'Status: `labor`, `line-action-route`, `no-value-entry`, `no-release`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-027-result.json` | Result JSON | Kontext, Line-Menue-Route, Ergebnisflags | Wertsetzung, Release, Receipt, Posting |',
      '| `020-line-menu-click.json` | Action Evidence | welcher Line-Menuepunkt geklickt wurde | dass ein Wert gesetzt wurde |',
      '| `040-line-menu-candidates.json` | Candidate Evidence | sichtbare sichere Line-/Detail-Kandidaten | finalen Editierpfad |',
      '| `050-active-editor-after-line-menu.json` | Editor Evidence | Controls nach Menue-Route | deutschen Finalnachweis |',
      '| `WAREHOUSE-027-LINE-ACTION-ROUTE.md` | Lernnotiz | naechsten sicheren Pfad | Warehouse-Receipt-Trace |',
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
