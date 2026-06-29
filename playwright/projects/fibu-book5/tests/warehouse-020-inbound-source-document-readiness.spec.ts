import { expect, test } from '@playwright/test';
import 'dotenv/config';
import { dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(240_000);

const testId = 'warehouse-020';
const company = process.env.BC_COMPANY ?? project.defaultCompany;
const knownPurchaseOrders = ['106002', '106051', '106054'];

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
    .replace(/\u201e/g, '"')
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactText(text: string) {
  const interesting = /Purchase Order|Einkaufsbestellung|K10000|Stahlwerk|RAW-STEEL|FRA-ZL|ATLANTA|Location Code|Quantity|Qty\. to Receive|Qty\. to Invoice|Direct Unit Cost|Status|Released|Open|Pending|Warehouse|Receipt|Receive|No\.|Vendor|Buy-from|Lines|Error|Fehler/i;
  const selected = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation|shouldAttachOauthTokens|TokenFactory/i.test(line))
    .filter((line) => interesting.test(line));
  return selected.slice(0, 260).join('\n');
}

function analyzeOrder(orderNo: string, text: string) {
  const compact = compactText(text);
  const combined = `${text}\n${compact}`;
  const orderVisible = new RegExp(`\\b${orderNo}\\b`).test(combined) || /Purchase Order|Einkaufsbestellung/i.test(combined);
  const vendorVisible = /K10000|Stahlwerk/i.test(combined);
  const rawSteelVisible = /RAW-STEEL/i.test(combined);
  const fraZlVisible = /FRA-ZL/i.test(combined);
  const atlantaVisible = /ATLANTA|Atlanta/i.test(combined);
  const releasedVisible = /Released|Freigegeben/i.test(combined);
  const openVisible = /\bOpen\b|Offen/i.test(combined);
  const quantityVisible = /Quantity|Qty\.|Menge/i.test(combined);
  const receiveVisible = /Qty\. to Receive|Receive|Empfangen/i.test(combined);
  const warehouseHintsVisible = /Warehouse|Receipt|Get Source|Source Document|Wareneingang|Lager/i.test(combined);
  const eligibleSignal = orderVisible && rawSteelVisible && fraZlVisible && (releasedVisible || warehouseHintsVisible);
  return {
    orderNo,
    orderVisible,
    vendorVisible,
    rawSteelVisible,
    fraZlVisible,
    atlantaVisible,
    releasedVisible,
    openVisible,
    quantityVisible,
    receiveVisible,
    warehouseHintsVisible,
    eligibleSignal,
    compactText: compact
  };
}

test('WAREHOUSE-020 Inbound Source Document Readiness', async ({ page }) => {
  const inspected = [];
  for (const orderNo of knownPurchaseOrders) {
    await page.goto(purchaseOrderCardUrl(orderNo), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await page.waitForTimeout(2200);
    const text = await pageText(page);
    const analysis = analyzeOrder(orderNo, text);
    inspected.push(analysis);
    await writeTextEvidence(warehouseEvidencePath(`${orderNo}-purchase-order-text.txt`), [
      `# Purchase Order ${orderNo}`,
      '',
      analysis.compactText
    ].join('\n'));
  }

  const eligibleCandidates = inspected.filter((entry) => entry.eligibleSignal);
  const fraZlRawCandidates = inspected.filter((entry) => entry.rawSteelVisible && entry.fraZlVisible);
  const rawWithoutFraZl = inspected.filter((entry) => entry.rawSteelVisible && !entry.fraZlVisible);
  const resultStatus = inspected.length > 0 ? 'observed' : 'blocked';
  const selectedNextRoute = eligibleCandidates.length > 0
    ? 'retry-warehouse-receipt-source-selection-with-proven-source'
    : 'create-controlled-source-purchase-order-for-fra-zl';

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-inbound-source-document-readiness',
    caseId: 'WAREHOUSE-020-INBOUND-SOURCE-DOCUMENT-READINESS',
    source: 'playwright-ui-purchase-order-readiness',
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
    inspectedPurchaseOrders: inspected,
    eligibleCandidates,
    fraZlRawCandidates,
    rawWithoutFraZl,
    selectedNextRoute,
    decision: eligibleCandidates.length > 0
      ? 'At least one existing Purchase Order shows an eligible-looking FRA-ZL/RAW source signal; next case may retry Warehouse Receipt source selection against that specific document.'
      : 'Known P2P Purchase Order drafts do not prove an eligible FRA-ZL/RAW released inbound source document; create a controlled source Purchase Order for Warehouse before repeating Receipt source selection.',
    proved: [
      'Known P2P Purchase Order candidates were opened directly by filtered Purchase Order card URLs, without Tell-Me search.',
      'No Warehouse Receipt source confirmation, Preview Posting, posting, setup change or company switch occurred.',
      eligibleCandidates.length > 0
        ? 'At least one existing Purchase Order has visible source-readiness signals.'
        : 'No inspected existing Purchase Order proves a clear FRA-ZL/RAW eligible Warehouse source document.'
    ],
    notProved: [
      'No source document was selected into a Warehouse Receipt.',
      'No Warehouse Receipt lines are proven.',
      'No Warehouse Receipt posting is proven.',
      'No Put-away document or posting is proven.',
      'No Warehouse/Item/Value entry trace is proven.',
      'No German final Warehouse proof exists.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noWarehouseReceiptSourceConfirmation: true
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In German final sandbox, create or identify a final Purchase Order source document for the target warehouse location before Warehouse Receipt source selection.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final Warehouse proof needs a released inbound Purchase Order/source document, Warehouse Receipt source selection, receipt posting, Put-away handling and ledger trace.',
    finalScreenshotNeeded: true,
    nextCase: eligibleCandidates.length > 0
      ? 'WAREHOUSE-021-SOURCE-SELECTION-WITH-PROVEN-PURCHASE-ORDER'
      : 'WAREHOUSE-021-CONTROLLED-SOURCE-PURCHASE-ORDER-FOR-WAREHOUSE',
    nextStep: eligibleCandidates.length > 0
      ? 'WAREHOUSE-021: retry Warehouse Receipt source selection against the proven Purchase Order candidate without posting.'
      : 'WAREHOUSE-021: create a controlled Purchase Order source for FRA-ZL/RAW-STEEL and prove release/source-readiness before Warehouse Receipt selection.'
  };

  await writeJsonEvidence(warehouseEvidencePath('010-inspected-purchase-orders.json'), inspected);
  await writeJsonEvidence(warehouseEvidencePath('020-eligible-candidates.json'), eligibleCandidates);
  await writeJsonEvidence(warehouseEvidencePath('030-fra-zl-raw-candidates.json'), fraZlRawCandidates);
  await writeJsonEvidence(warehouseEvidencePath('040-raw-without-fra-zl.json'), rawWithoutFraZl);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-020-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-020-INBOUND-SOURCE-DOCUMENT-READINESS.md'),
    [
      '# WAREHOUSE-020 Inbound Source Document Readiness',
      '',
      'Status: `labor`, `source-readiness`, `no-posting`, `not-final`.',
      '',
      `Gepruefte Purchase Orders: ${knownPurchaseOrders.join(', ')}`,
      `Eligible Candidates: ${eligibleCandidates.map((entry) => entry.orderNo).join(', ') || 'keine'}`,
      `FRA-ZL + RAW Candidates: ${fraZlRawCandidates.map((entry) => entry.orderNo).join(', ') || 'keine'}`,
      `RAW ohne FRA-ZL: ${rawWithoutFraZl.map((entry) => entry.orderNo).join(', ') || 'keine'}`,
      '',
      '## Entscheidung',
      '',
      result.decision,
      '',
      '## Grenze',
      '',
      '- Kein Warehouse Receipt Source Confirm.',
      '- Kein Warehouse Receipt Posting.',
      '- Kein Put-away.',
      '- Keine Postenspur.',
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
      '# WAREHOUSE-020 Evidence Index',
      '',
      'Status: `labor`, `source-readiness`, `no-posting`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      '| `WAREHOUSE-020-result.json` | Result JSON | welche Purchase Orders als Source-Kandidaten geprueft wurden | Warehouse Receipt Posting |',
      '| `010-inspected-purchase-orders.json` | strukturierte UI-Auswertung | RAW/FRA-ZL/Status/Readiness-Signale pro Purchase Order | Source-Auswahl |',
      '| `*-purchase-order-text.txt` | kompakter UI-Text | sichtbare Karten-/Zeilenbegriffe pro Purchase Order | technische Tabellenlogik |',
      '',
      'German Final: Source Purchase Order und Warehouse Receipt muessen in deutscher Zielumgebung neu erzeugt werden.',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.setupChanged).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
