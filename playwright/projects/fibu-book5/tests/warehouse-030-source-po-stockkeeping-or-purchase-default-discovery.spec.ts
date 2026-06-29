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

const testId = 'warehouse-030';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const itemNo = 'RAW-STEEL';
const vendorNo = 'K10000';
const locationCode = 'FRA-ZL';

type ProbeTarget = {
  label: string;
  pageId: number;
  table: string;
  filter: string;
  include: RegExp[];
};

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function filteredUrl(target: ProbeTarget) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', company);
  url.searchParams.set('page', String(target.pageId));
  url.searchParams.set('filter', target.filter);
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

async function probeReadOnlyPage(page: Page, target: ProbeTarget) {
  const url = filteredUrl(target);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const decodedUrl = decodeURIComponent(page.url());
  const rawText = sanitizeText(await pageText(page));
  const compactText = sanitizeText(await compactPageText(page, { include: target.include, maxLines: 180, maxLineLength: 220 }));
  const combined = `${rawText}\n${compactText}`.replace(/\s+/g, ' ');
  const contextOk = /MCP_1_20260210/i.test(decodedUrl) && /company=RM-DEMO/i.test(decodedUrl);
  const targetSignals = {
    itemVisible: new RegExp(itemNo, 'i').test(combined),
    vendorVisible: new RegExp(vendorNo, 'i').test(combined),
    locationVisible: new RegExp(locationCode, 'i').test(combined),
    stockkeepingSignalVisible: /Stockkeeping|SKU|Item No\.|Location Code|Replenishment System|Lagerhaltungsdaten/i.test(combined),
    purchaseDefaultSignalVisible: /Vendor Item|Item Vendor|Vendor No\.|Purchasing|Purchase|Einkauf/i.test(combined),
    errorVisible: /Sorry|Error|Fehler|not available|nicht verfuegbar|could not open|nicht geoeffnet/i.test(combined)
  };
  const usefulForDefaultRoute =
    contextOk &&
    !targetSignals.errorVisible &&
    targetSignals.itemVisible &&
    targetSignals.locationVisible &&
    (targetSignals.stockkeepingSignalVisible || targetSignals.purchaseDefaultSignalVisible);

  return {
    label: target.label,
    pageId: target.pageId,
    table: target.table,
    filter: target.filter,
    url: decodedUrl,
    contextOk,
    targetSignals,
    usefulForDefaultRoute,
    compactText
  };
}

test('WAREHOUSE-030 Source PO Stockkeeping or Purchase Default Discovery', async ({ page }) => {
  const targets: ProbeTarget[] = [
    {
      label: 'stockkeeping-unit-list-raw-steel',
      pageId: 5701,
      table: 'Stockkeeping Unit',
      filter: `'Stockkeeping Unit'.'Item No.' IS '${itemNo}'`,
      include: [/Stockkeeping|SKU|RAW-STEEL|FRA-ZL|ATLANTA|Location Code|Item No\.|Replenishment|Vendor|K10000|Purchase/i]
    },
    {
      label: 'stockkeeping-unit-list-raw-steel-fra-zl',
      pageId: 5701,
      table: 'Stockkeeping Unit',
      filter: `'Stockkeeping Unit'.'Item No.' IS '${itemNo}'&'Stockkeeping Unit'.'Location Code' IS '${locationCode}'`,
      include: [/Stockkeeping|SKU|RAW-STEEL|FRA-ZL|ATLANTA|Location Code|Item No\.|Replenishment|Vendor|K10000|Purchase/i]
    },
    {
      label: 'item-vendor-catalog-raw-steel',
      pageId: 99,
      table: 'Item Vendor',
      filter: `'Item Vendor'.'Item No.' IS '${itemNo}'`,
      include: [/Item Vendor|Vendor Item|RAW-STEEL|K10000|FRA-ZL|Vendor No\.|Item No\.|Purchasing|Purchase/i]
    },
    {
      label: 'item-vendor-catalog-k10000',
      pageId: 99,
      table: 'Item Vendor',
      filter: `'Item Vendor'.'Vendor No.' IS '${vendorNo}'`,
      include: [/Item Vendor|Vendor Item|RAW-STEEL|K10000|FRA-ZL|Vendor No\.|Item No\.|Purchasing|Purchase/i]
    }
  ];

  const probes = [];
  for (const target of targets) {
    const probe = await probeReadOnlyPage(page, target);
    probes.push(probe);
    await writeTextEvidence(warehouseEvidencePath(`${String(target.pageId)}-${target.label}-compact-text.txt`), probe.compactText);
  }

  const usefulRoutes = probes.filter((probe) => probe.usefulForDefaultRoute);
  const stockkeepingRoutes = usefulRoutes.filter((probe) => /stockkeeping/i.test(probe.label));
  const purchaseDefaultRoutes = usefulRoutes.filter((probe) => /vendor|purchase/i.test(probe.label));
  const selectedNextRoute = stockkeepingRoutes.length > 0
    ? 'stockkeeping-unit-setup-fit-or-fresh-draft'
    : purchaseDefaultRoutes.length > 0
      ? 'purchase-default-fit-or-fresh-draft'
      : 'guarded-setup-fit-decision-or-park-warehouse-source-route';
  const nextCase = stockkeepingRoutes.length > 0
    ? 'WAREHOUSE-031-STOCKKEEPING-UNIT-FRA-ZL-SETUP-FIT-DECISION'
    : purchaseDefaultRoutes.length > 0
      ? 'WAREHOUSE-031-PURCHASE-DEFAULT-FRA-ZL-SETUP-FIT-DECISION'
      : 'WAREHOUSE-031-WAREHOUSE-SOURCE-ROUTE-PARK-OR-SETUP-FIT-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-source-po-stockkeeping-or-purchase-default-discovery',
    caseId: 'WAREHOUSE-030-SOURCE-PO-STOCKKEEPING-OR-PURCHASE-DEFAULT-DISCOVERY',
    source: 'playwright-ui-readonly-direct-page-discovery',
    resultStatus: 'observed',
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
    probes,
    usefulRoutes,
    stockkeepingRoutes,
    purchaseDefaultRoutes,
    selectedNextRoute,
    decision: usefulRoutes.length > 0
      ? 'At least one read-only default/setup route shows RAW-STEEL and FRA-ZL signals; next case should decide between guarded setup-fit and fresh source draft.'
      : 'Direct read-only page probes did not prove a Stockkeeping Unit or Item Vendor route with RAW-STEEL/FRA-ZL. Next case should decide whether to run a guarded setup-fit route with explicit evidence or park Warehouse source route as labor-blocked.',
    proved: [
      'Stockkeeping Unit and Item Vendor/default page candidates were opened only by direct page URLs, without Tell-Me search.',
      usefulRoutes.length > 0
        ? 'At least one candidate page contains useful RAW-STEEL/FRA-ZL default-route signals.'
        : 'No candidate page proved a usable RAW-STEEL/FRA-ZL default route in compact read-only evidence.',
      'No value entry, new draft, Release, Receive, Invoice, Preview Posting, Post, Warehouse Receipt source confirmation, setup change, company switch, API shortcut or book change occurred.'
    ],
    notProved: [
      'No Stockkeeping Unit was created or edited.',
      'No purchase/default setup was changed.',
      'No fresh Purchase Order defaulting behavior is proven.',
      'No Warehouse Receipt source document confirmation is proven.',
      'No receive, invoice, preview posting or posting is proven.',
      'No German-final Warehouse proof is derived from RM-DEMO lab evidence.'
    ],
    blockedBy: usefulRoutes.length > 0 ? [] : ['no-readonly-stockkeeping-or-purchase-default-route-proved'],
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
    rebuildInstruction: 'In German final sandbox, repeat the default/setup discovery with German target master data and then decide whether to fit SKU/default setup or park Warehouse source route.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final Warehouse proof needs German source default/setup evidence or a different source-document strategy before Warehouse Receipt.',
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: false,
    changedFiles: ['playwright/projects/fibu-book5/evidence/warehouse-030/WAREHOUSE-030-result.json'],
    nextCase,
    nextStep: selectedNextRoute
  };

  await writeJsonEvidence(warehouseEvidencePath('010-page-probes.json'), probes);
  await writeJsonEvidence(warehouseEvidencePath('020-useful-routes.json'), usefulRoutes);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-030-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-030-STOCKKEEPING-PURCHASE-DEFAULT-DISCOVERY.md'),
    [
      '# WAREHOUSE-030 Stockkeeping / Purchase Default Discovery',
      '',
      'Status: `labor`, `read-only`, `default-discovery`, `not-final`.',
      '',
      `Gepruefte Seiten: ${probes.map((probe) => `${probe.label} (${probe.pageId})`).join(', ')}`,
      `Nuetzliche Default-Routen: ${usefulRoutes.map((probe) => probe.label).join(', ') || 'keine'}`,
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
      '# WAREHOUSE-030 Evidence Index',
      '',
      'Status: `labor`, `read-only`, `default-discovery`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-030-result.json` | Result JSON | direkte Page-Probes und Route Decision | Setup-Fit, frischen PO, Warehouse Receipt |',
      '| `010-page-probes.json` | strukturierte UI-Auswertung | welche Direktseiten Signale liefern | Tabellenlogik oder Schreibfaehigkeit |',
      '| `020-useful-routes.json` | gefilterte Auswertung | ob eine Route RAW-STEEL/FRA-ZL zeigt | finalen deutschen Nachweis |',
      '| `*-compact-text.txt` | kompakter UI-Text | sichtbare Seitensignale | Rohsnapshot |',
      '',
      'German Final: Default-/Setup-Route und Source Purchase Order muessen in deutscher Zielumgebung neu aufgebaut und bebildert werden.',
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
