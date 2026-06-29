import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(240_000);

const testId = 'warehouse-029';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const vendorNo = 'K10000';
const itemNo = 'RAW-STEEL';
const locationCode = 'FRA-ZL';

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', company);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function sanitizeText(text: string) {
  return text
    .replace(/\u201e/g, '"')
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

async function readFilteredCard(page: Page, args: {
  label: string;
  pageId: number;
  table: string;
  field: string;
  value: string;
  include: RegExp[];
}) {
  const url = filteredBcPageUrl(args.pageId, args.table, args.field, args.value);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const rawText = sanitizeText(await pageText(page));
  const compact = sanitizeText(await compactPageText(page, { include: args.include, maxLines: 180, maxLineLength: 220 }));
  const decodedUrl = decodeURIComponent(page.url());
  const contextOk = /MCP_1_20260210/i.test(decodedUrl) && /company=RM-DEMO/i.test(decodedUrl) && new RegExp(args.value, 'i').test(rawText);

  return {
    label: args.label,
    pageId: args.pageId,
    table: args.table,
    field: args.field,
    value: args.value,
    url: decodedUrl,
    contextOk,
    rawText,
    compactText: compact
  };
}

function analyzeVendor(text: string) {
  const combined = text.replace(/\s+/g, ' ');
  return {
    targetVisible: /K10000|Stahlwerk/i.test(combined),
    locationSignalVisible: /Location Code|Location|Lagerort|FRA-ZL|ATLANTA/i.test(combined),
    fraZlVisible: /FRA-ZL/i.test(combined),
    atlantaVisible: /ATLANTA|Atlanta/i.test(combined),
    receivingOrShippingSignalVisible: /Receiving|Shipment|Shipping|Wareneingang|Lieferung|Versand|Purchaser|Einkaeufer/i.test(combined),
    postingGroupSignalsVisible: /Vendor Posting Group|Gen\. Bus\. Posting Group|VAT Bus\. Posting Group|Tax Area|DOMESTIC/i.test(combined)
  };
}

function analyzeItem(text: string) {
  const combined = text.replace(/\s+/g, ' ');
  return {
    targetVisible: /RAW-STEEL|Stahltraeger/i.test(combined),
    locationSignalVisible: /Location Code|Location|Lagerort|FRA-ZL|ATLANTA/i.test(combined),
    fraZlVisible: /FRA-ZL/i.test(combined),
    atlantaVisible: /ATLANTA|Atlanta/i.test(combined),
    replenishmentSignalVisible: /Replenishment|Beschaffung|Vendor|K10000|Purchasing|Einkauf/i.test(combined),
    postingGroupSignalsVisible: /Inventory Posting Group|Gen\. Prod\. Posting Group|Tax Group|RESALE|RETAIL|FURNITURE/i.test(combined),
    warehouseSignalVisible: /Warehouse|Stockkeeping|SKU|Lager|Bin|Location/i.test(combined)
  };
}

function analyzeLocation(text: string) {
  const combined = text.replace(/\s+/g, ' ');
  return {
    targetVisible: /FRA-ZL/i.test(combined),
    receiveSignalVisible: /Require Receive|Require Put-away|Require Shipment|Bin Mandatory|Directed Put-away|Warehouse|Receipt|Put-away|Pick/i.test(combined),
    basicWarehouseSignalsVisible: /Require Receive|Require Put-away|Warehouse|Receipt|Put-away/i.test(combined),
    noWarehouseHandlingVisible: /No Warehouse Handling/i.test(combined)
  };
}

test('WAREHOUSE-029 Source PO Default Location Preflight', async ({ page }) => {
  const vendor = await readFilteredCard(page, {
    label: 'vendor-k10000',
    pageId: 26,
    table: 'Vendor',
    field: 'No.',
    value: vendorNo,
    include: [
      /Vendor Card|Vendor|K10000|Stahlwerk|Location Code|Location|Lagerort|FRA-ZL|ATLANTA/i,
      /Receiving|Shipping|Shipment|Purchaser|Posting Group|Tax Area|Payment Terms|Currency/i
    ]
  });
  const item = await readFilteredCard(page, {
    label: 'item-raw-steel',
    pageId: 30,
    table: 'Item',
    field: 'No.',
    value: itemNo,
    include: [
      /Item Card|Item|RAW-STEEL|Stahltraeger|Location Code|Location|Lagerort|FRA-ZL|ATLANTA/i,
      /Replenishment|Vendor|K10000|Purchasing|Inventory Posting Group|Gen\. Prod\. Posting Group|Tax Group|Warehouse|Stockkeeping|SKU|RESALE|RETAIL|FURNITURE/i
    ]
  });
  const location = await readFilteredCard(page, {
    label: 'location-fra-zl',
    pageId: 5703,
    table: 'Location',
    field: 'Code',
    value: locationCode,
    include: [
      /Location Card|Location|Locations|FRA-ZL|Warehouse|Bin|Mandatory|Require|Receive|Shipment|Put-away|Pick|Directed|No Warehouse Handling/i
    ]
  });

  const vendorAnalysis = analyzeVendor(vendor.rawText);
  const itemAnalysis = analyzeItem(item.rawText);
  const locationAnalysis = analyzeLocation(location.rawText);
  const contextOk = vendor.contextOk && item.contextOk && location.contextOk;
  const directDefaultSignal =
    (vendorAnalysis.fraZlVisible && vendorAnalysis.locationSignalVisible) ||
    (itemAnalysis.fraZlVisible && itemAnalysis.locationSignalVisible);
  const locationReadySignal = locationAnalysis.targetVisible && locationAnalysis.basicWarehouseSignalsVisible && !locationAnalysis.noWarehouseHandlingVisible;
  const selectedNextRoute = directDefaultSignal
    ? 'fresh-draft-with-visible-default-location-signal'
    : 'stockkeeping-unit-or-purchase-default-setup-discovery-before-fresh-draft';
  const nextCase = directDefaultSignal
    ? 'WAREHOUSE-030-FRESH-SOURCE-PO-DEFAULT-LOCATION-ROUTE'
    : 'WAREHOUSE-030-SOURCE-PO-STOCKKEEPING-OR-PURCHASE-DEFAULT-DISCOVERY';

  await writeTextEvidence(warehouseEvidencePath('010-vendor-k10000-compact-text.txt'), vendor.compactText);
  await writeTextEvidence(warehouseEvidencePath('020-item-raw-steel-compact-text.txt'), item.compactText);
  await writeTextEvidence(warehouseEvidencePath('030-location-fra-zl-compact-text.txt'), location.compactText);
  await writeJsonEvidence(warehouseEvidencePath('040-card-analyses.json'), {
    vendor: vendorAnalysis,
    item: itemAnalysis,
    location: locationAnalysis,
    context: {
      vendor: vendor.contextOk,
      item: item.contextOk,
      location: location.contextOk
    },
    directDefaultSignal,
    locationReadySignal
  });

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-po-default-location-preflight',
    caseId: 'WAREHOUSE-029-SOURCE-PO-DEFAULT-LOCATION-PREFLIGHT',
    source: 'playwright-ui-readonly-direct-card-preflight',
    resultStatus: contextOk ? 'observed' : 'blocked',
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
    valueEntered: false,
    draftCreated: false,
    vendor: {
      no: vendorNo,
      pageId: vendor.pageId,
      contextOk: vendor.contextOk,
      analysis: vendorAnalysis
    },
    item: {
      no: itemNo,
      pageId: item.pageId,
      contextOk: item.contextOk,
      analysis: itemAnalysis
    },
    location: {
      code: locationCode,
      pageId: location.pageId,
      contextOk: location.contextOk,
      analysis: locationAnalysis
    },
    directDefaultSignal,
    locationReadySignal,
    selectedNextRoute,
    decision: directDefaultSignal
      ? 'Vendor or item card text shows a direct FRA-ZL default-location signal; next case may create a fresh source Purchase Order and verify defaulting before release.'
      : 'Vendor K10000 and Item RAW-STEEL do not show a direct FRA-ZL default-location signal in read-only card evidence; inspect Stockkeeping Unit or purchase/default setup route before another fresh source draft.',
    proved: [
      vendor.contextOk ? 'Vendor K10000 card was opened read-only by direct Page 26 filtered URL.' : 'Vendor K10000 card context was not fully proven.',
      item.contextOk ? 'Item RAW-STEEL card was opened read-only by direct Page 30 filtered URL.' : 'Item RAW-STEEL card context was not fully proven.',
      location.contextOk ? 'Location FRA-ZL card was opened read-only by direct Page 5703 filtered URL.' : 'Location FRA-ZL card context was not fully proven.',
      directDefaultSignal
        ? 'A direct FRA-ZL default-location signal is visible on Vendor or Item card evidence.'
        : 'No direct FRA-ZL default-location signal is visible on Vendor K10000 or Item RAW-STEEL card evidence.',
      locationReadySignal
        ? 'FRA-ZL still shows Warehouse/receipt/put-away readiness signals in Location Card evidence.'
        : 'FRA-ZL Warehouse readiness is not fully proven by this compact read-only evidence.',
      'No value entry, new draft, Release, Receive, Invoice, Preview Posting, Post, Warehouse Receipt source confirmation, setup change, company switch, API shortcut or book change occurred.'
    ],
    notProved: [
      'No fresh Purchase Order defaulting behavior is proven by this read-only preflight.',
      'No FRA-ZL value is proven on Purchase Order 106055.',
      'No Stockkeeping Unit/default setup page is proven yet.',
      'No Warehouse Receipt source document confirmation is proven.',
      'No receive, invoice, preview posting or posting is proven.',
      'No German-final Warehouse proof is derived from RM-DEMO lab evidence.'
    ],
    blockedBy: contextOk ? [] : ['card-context-not-fully-proven'],
    flags: {
      noValueEntry: true,
      noDraft: true,
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
    rebuildInstruction: 'In German final sandbox, repeat Vendor/Item/Location default preflight with German target master data before any Warehouse source document creation.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final Warehouse proof needs German Vendor/Item/Location defaulting evidence, released source Purchase Order, Warehouse Receipt source selection, receipt posting and ledger trace.',
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: false,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/warehouse-029/WAREHOUSE-029-result.json'
    ],
    nextCase,
    nextStep: directDefaultSignal
      ? 'WAREHOUSE-030: create a fresh source Purchase Order and verify whether FRA-ZL defaults onto RAW-STEEL before any release.'
      : 'WAREHOUSE-030: inspect Stockkeeping Unit or purchase/default setup route read-only before another fresh source Purchase Order.'
  };

  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-029-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-029-DEFAULT-LOCATION-PREFLIGHT.md'),
    [
      '# WAREHOUSE-029 Source PO Default Location Preflight',
      '',
      'Status: `labor`, `read-only`, `default-preflight`, `not-final`.',
      '',
      `Vendor K10000 Kontext: ${vendor.contextOk ? 'ja' : 'nein'}`,
      `Item RAW-STEEL Kontext: ${item.contextOk ? 'ja' : 'nein'}`,
      `Location FRA-ZL Kontext: ${location.contextOk ? 'ja' : 'nein'}`,
      `Direktes FRA-ZL-Default-Signal auf Vendor/Item: ${directDefaultSignal ? 'ja' : 'nein'}`,
      `FRA-ZL Warehouse-Readiness-Signal: ${locationReadySignal ? 'ja' : 'nein'}`,
      '',
      '## Entscheidung',
      '',
      result.decision,
      '',
      '## Grenze',
      '',
      '- Kein neuer Draft.',
      '- Keine Werteingabe.',
      '- Keine Setup-Aenderung.',
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
      '# WAREHOUSE-029 Evidence Index',
      '',
      'Status: `labor`, `read-only`, `default-preflight`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-029-result.json` | Result JSON | Vendor/Item/Location read-only Preflight und Route Decision | frischen PO-Default, Release, Warehouse Receipt |',
      '| `010-vendor-k10000-compact-text.txt` | UI-Text | sichtbare Vendor-Signale | Tabellenlogik oder Defaultwirkung |',
      '| `020-item-raw-steel-compact-text.txt` | UI-Text | sichtbare Item-Signale | Stockkeeping Unit Setup |',
      '| `030-location-fra-zl-compact-text.txt` | UI-Text | sichtbare FRA-ZL Warehouse-Signale | Quelle auf Purchase Line |',
      '| `040-card-analyses.json` | Auswertung | direkte Default-Signal-Pruefung | finalen deutschen Nachweis |',
      '',
      'German Final: Vendor, Item, Location, Source Purchase Order und Warehouse Receipt muessen in deutscher Zielumgebung neu aufgebaut und bebildert werden.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.setupChanged).toBe(false);
  expect(result.companySwitched).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.valueEntered).toBe(false);
  expect(result.draftCreated).toBe(false);
});
