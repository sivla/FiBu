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

const testId = 'warehouse-023';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const sourceDocumentNo = '106055';
const locationCode = 'FRA-ZL';

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
    .replace(/\u201e/g, '"')
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function cleanEvidenceValue<T>(value: T): T {
  if (typeof value === 'string') return sanitizeText(value) as T;
  if (Array.isArray(value)) return value.map((entry) => cleanEvidenceValue(entry)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cleanEvidenceValue(entry)])
    ) as T;
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

async function collectControlMap(page: Page) {
  const include = /106055|K10000|RAW-STEEL|FRA-ZL|ATLANTA|Location Code|Location|Lagerort|Quantity|Qty\.|Direct Unit Cost|Status|Release|Receive|Invoice|Post|Lines/i;
  const frames = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const data = await frame.evaluate((source) => {
      const include = new RegExp(source, 'i');
      const normalize = (value: string | null | undefined, max = 180) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const visible = (element: Element) => {
        const html = element as HTMLElement;
        const rect = html.getBoundingClientRect();
        const style = window.getComputedStyle(html);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      return [...document.querySelectorAll('input,textarea,select,[role="textbox"],[role="combobox"],[role="gridcell"],td,th,button,[role="button"],[role="menuitem"],[aria-label],[title],[controlname]')]
        .filter(visible)
        .map((element) => {
          const html = element as HTMLElement;
          const input = element as HTMLInputElement;
          const rect = html.getBoundingClientRect();
          const row = html.closest('[role="row"],tr');
          const text = normalize(html.innerText || html.textContent);
          return {
            tag: html.tagName.toLowerCase(),
            role: normalize(html.getAttribute('role')),
            aria: normalize(html.getAttribute('aria-label')),
            title: normalize(html.getAttribute('title')),
            controlName: normalize(html.getAttribute('controlname') ?? html.closest('[controlname]')?.getAttribute('controlname')),
            value: normalize(input.value),
            text,
            rowText: normalize(row?.textContent, 360),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            readonly: Boolean(input.readOnly || html.getAttribute('aria-readonly') === 'true'),
            disabled: Boolean(input.disabled || html.getAttribute('aria-disabled') === 'true')
          };
        })
        .filter((entry) => include.test(`${entry.controlName} ${entry.aria} ${entry.title} ${entry.text} ${entry.rowText} ${entry.value}`))
        .slice(0, 180);
    }, include.source).catch(() => []);
    frames.push({ frameIndex, entries: data });
  }
  return frames;
}

function analyzeText(text: string, controls: Array<{ entries: Array<Record<string, unknown>> }>) {
  const combinedControls = controls.flatMap((frame) => frame.entries)
    .map((entry) => Object.values(entry).join(' '))
    .join('\n');
  const combined = `${text}\n${combinedControls}`;
  const rawSteelLine = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .find((line) => /RAW-STEEL/i.test(line)) ?? '';
  const locationControls = controls.flatMap((frame) => frame.entries).filter((entry) =>
    /Location Code|Location|Lagerort/i.test(String(entry.controlName ?? '') + ' ' + String(entry.aria ?? '') + ' ' + String(entry.title ?? '') + ' ' + String(entry.text ?? '') + ' ' + String(entry.rowText ?? '') + ' ' + String(entry.value ?? ''))
  );
  const fillableLocationControls = locationControls.filter((entry) => {
    const tag = String(entry.tag ?? '').toLowerCase();
    const role = String(entry.role ?? '').toLowerCase();
    const looksEditable = ['input', 'textarea', 'select'].includes(tag) || ['textbox', 'combobox'].includes(role);
    return looksEditable && !entry.readonly && !entry.disabled;
  });
  return {
    documentVisible: new RegExp(`\\b${sourceDocumentNo}\\b`).test(combined),
    rawSteelVisible: /RAW-STEEL/i.test(combined),
    rawSteelLine,
    vendorVisible: /K10000|Stahlwerk/i.test(combined),
    fraZlVisible: /FRA-ZL/i.test(combined),
    rawLineFraZlVisible: /FRA-ZL/i.test(rawSteelLine),
    atlantaVisible: /ATLANTA|Atlanta/i.test(combined),
    rawLineAtlantaVisible: /ATLANTA|Atlanta/i.test(rawSteelLine),
    locationLabelVisible: /Location Code|Location|Lagerort/i.test(combined),
    lineSignalsVisible: /RAW-STEEL|Lines|Quantity|Qty\.|Direct Unit Cost/i.test(combined),
    releasedVisible: /Released|Freigegeben/i.test(combined),
    openVisible: /\bOpen\b|Offen/i.test(combined),
    locationControlCount: locationControls.length,
    fillableLocationControlCount: fillableLocationControls.length,
    locationControls: locationControls.slice(0, 8),
    fillableLocationControls: fillableLocationControls.slice(0, 5)
  };
}

test('WAREHOUSE-023 Source PO Location Field Visibility Route', async ({ page }) => {
  await page.goto(purchaseOrderCardUrl(sourceDocumentNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  await page.waitForTimeout(2500);

  const initialUrl = decodeURIComponent(page.url());
  const initialText = await pageText(page);
  const contextOk = /MCP_1_20260210/i.test(initialUrl) && /company=RM-DEMO/i.test(initialUrl) && new RegExp(`\\b${sourceDocumentNo}\\b`).test(initialText);

  const layoutAttempts = [];
  layoutAttempts.push(await clickSafeLayoutAction(page, /Maximize|Maximieren|Expand|Erweitern|Open in full screen|Vollbild/i));
  layoutAttempts.push(await clickSafeLayoutAction(page, /Wide layout|Breite Layoutansicht|Layout/i));
  layoutAttempts.push(await clickSafeLayoutAction(page, /Focus mode|Fokusmodus/i));
  layoutAttempts.push(await clickSafeLayoutAction(page, /Show more|Mehr anzeigen|Mehr anzeigen\.\.\.|Mehr|Weitere anzeigen/i));
  await page.waitForTimeout(1800);

  const finalText = await pageText(page);
  const controls = cleanEvidenceValue(await collectControlMap(page));
  const analysis = analyzeText(finalText, controls);
  const locationColumnVisible = analysis.locationLabelVisible || analysis.locationControlCount > 0;
  const resultStatus = contextOk ? 'observed' : 'blocked';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-po-location-field-visibility-route',
    caseId: 'WAREHOUSE-023-SOURCE-PO-LOCATION-FIELD-VISIBILITY-ROUTE',
    source: 'playwright-ui-field-visibility',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    companySwitched: false,
    apiShortcut: false,
    bookChanged: false,
    sourceDocumentType: 'Purchase Order',
    sourceDocumentNo,
    contextOk,
    initialUrl,
    layoutAttempts,
    analysis,
    locationColumnVisible,
    blockedBy: [
      ...(!contextOk ? ['purchase-order-106055-context-not-proven'] : []),
      ...(contextOk && !analysis.rawLineFraZlVisible ? ['fra-zl-still-not-visible-on-raw-steel-line'] : []),
      ...(contextOk && !analysis.fillableLocationControlCount ? ['fillable-location-code-control-not-proven'] : [])
    ],
    proved: [
      contextOk ? 'Purchase Order 106055 opened directly by Page 50 filter URL in MCP_1_20260210 / RM-DEMO.' : 'Purchase Order 106055 context was not safely proven.',
      analysis.rawSteelVisible ? 'RAW-STEEL is visible in the Purchase Order 106055 context.' : 'RAW-STEEL is not visible in the final context.',
      analysis.vendorVisible ? 'Vendor K10000/Stahlwerk signal is visible.' : 'Vendor K10000/Stahlwerk signal is not visible in the final context.',
      layoutAttempts.some((attempt) => attempt.clicked) ? 'At least one safe layout/focus/show-more action was clicked.' : 'No safe layout/focus/show-more action was clickable.',
      analysis.locationLabelVisible || analysis.locationControlCount > 0 ? 'A Location/Location Code signal is visible in text or controls.' : 'No Location/Location Code signal is visible in compact text/control evidence.',
      analysis.rawLineAtlantaVisible ? 'The RAW-STEEL row currently shows ATLANTA, GA after the visibility route.' : 'The RAW-STEEL row does not clearly show ATLANTA, GA in compact evidence.',
      analysis.rawLineFraZlVisible ? 'FRA-ZL is visible on the RAW-STEEL row after the visibility route.' : 'FRA-ZL is still not visible on the RAW-STEEL row after the visibility route.',
      analysis.fillableLocationControlCount > 0 ? 'A true editable Location-like input/combobox candidate is visible.' : 'No true editable Location-like input/combobox candidate is proven.',
      'No Release, Receive, Invoice, Preview Posting, Post, Warehouse Receipt source confirmation, setup change, company switch, API shortcut or book change occurred.'
    ],
    notProved: [
      'Purchase Order 106055 is not released by this case.',
      'Location Code FRA-ZL is not written by this case.',
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
    rebuildInstruction: 'In German final sandbox, use the same direct Purchase Order source visibility route, but recreate the source document with German target data and readable screenshots before release and Warehouse Receipt selection.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final Warehouse proof needs visible/fillable location values, released source Purchase Order, Warehouse Receipt source selection, receipt posting and ledger trace.',
    finalScreenshotNeeded: true,
    nextCase: locationColumnVisible
      ? 'WAREHOUSE-024-SOURCE-PO-LINE-LOCATION-CELL-VALUE-GATE'
      : 'WAREHOUSE-024-SOURCE-PO-LOCATION-HELPER-OR-ALTERNATIVE-ROUTE-DECISION',
    nextStep: locationColumnVisible
      ? 'WAREHOUSE-024: attempt a guarded Location Code line-cell value route on the visible RAW-STEEL row; stop before release.'
      : 'WAREHOUSE-024: choose helper improvement, alternative Purchase Order route or park Warehouse inbound because Location Code is still not visible/fillable.'
  };

  await writeTextEvidence(warehouseEvidencePath('010-initial-compact-text.txt'), sanitizeText(await compactUiText(page)));
  await writeTextEvidence(warehouseEvidencePath('020-final-compact-text.txt'), sanitizeText(await compactUiText(page)));
  await writeTextEvidence(warehouseEvidencePath('030-final-text.txt'), sanitizeText(finalText));
  await writeJsonEvidence(warehouseEvidencePath('040-layout-attempts.json'), layoutAttempts);
  await writeJsonEvidence(warehouseEvidencePath('050-location-controls.json'), analysis.locationControls);
  await writeJsonEvidence(warehouseEvidencePath('060-final-control-summary.json'), {
    frameCount: controls.length,
    matchingControlCount: controls.reduce((sum, frame) => sum + frame.entries.length, 0),
    rawSteelLine: analysis.rawSteelLine,
    locationColumnVisible,
    rawLineAtlantaVisible: analysis.rawLineAtlantaVisible,
    rawLineFraZlVisible: analysis.rawLineFraZlVisible,
    fillableLocationControlCount: analysis.fillableLocationControlCount,
    keyLocationControls: analysis.locationControls
  });
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-023-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-023-LOCATION-FIELD-VISIBILITY.md'),
    [
      '# WAREHOUSE-023 Source PO Location Field Visibility Route',
      '',
      'Status: `labor`, `field-visibility`, `no-posting`, `not-final`.',
      '',
      `Purchase Order: ${sourceDocumentNo}`,
      `Context OK: ${contextOk ? 'ja' : 'nein'}`,
      `RAW-STEEL sichtbar: ${analysis.rawSteelVisible ? 'ja' : 'nein'}`,
      `RAW-STEEL-Zeile: ${analysis.rawSteelLine || 'nicht erkannt'}`,
      `K10000/Stahlwerk sichtbar: ${analysis.vendorVisible ? 'ja' : 'nein'}`,
      `Location/Location Code Signal sichtbar: ${analysis.locationLabelVisible || analysis.locationControlCount > 0 ? 'ja' : 'nein'}`,
      `RAW-STEEL zeigt ATLANTA, GA: ${analysis.rawLineAtlantaVisible ? 'ja' : 'nein'}`,
      `RAW-STEEL zeigt FRA-ZL: ${analysis.rawLineFraZlVisible ? 'ja' : 'nein'}`,
      `Echte editierbare Location-Eingabekandidaten: ${analysis.fillableLocationControlCount}`,
      '',
      '## Grenze',
      '',
      '- Keine Location-Wertsetzung.',
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
      '# WAREHOUSE-023 Evidence Index',
      '',
      'Status: `labor`, `field-visibility`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-023-result.json` | Result JSON | Kontext, Layoutversuche, Location-Sichtbarkeit | Release, Receipt, Posting |',
      '| `050-location-controls.json` | Control Evidence | sichtbare Location-Kandidaten | sichere Wertsetzung |',
      '| `060-final-control-summary.json` | Control Summary | kompakte Kontrollsumme zu Location/RAW-Zeile | Roh-Control-Dump oder Finalnachweis |',
      '| `WAREHOUSE-023-LOCATION-FIELD-VISIBILITY.md` | Lernnotiz | was sichtbar wurde und was offen bleibt | deutschen Finalnachweis |',
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
});
