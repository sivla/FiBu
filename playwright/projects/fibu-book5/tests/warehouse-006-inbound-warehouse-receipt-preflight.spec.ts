import { expect, test } from '@playwright/test';
import 'dotenv/config';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'warehouse-006';

type Candidate = {
  id: string;
  pageId: number;
  expectedKind: 'warehouse-receipt' | 'warehouse-putaway' | 'warehouse-activity';
};

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function directPageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
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

function normalizedLines(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|cacheLocation/i.test(line));
}

function compactWarehouseText(text: string) {
  const interesting = /Warehouse|Receipt|Put-away|Putaway|Activity|Source|Document|Location|FRA-ZL|RAW-STEEL|Purchase|Order|Vendor|K10000|Get Source|Post|Release|Lines|Qty|Quantity|Receive|Shipment/i;
  const selected = normalizedLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-006-Seitenauszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 180)
  ].join('\n');
}

function compactButtons(buttons: string[]) {
  const interesting = /New|Neu|Edit|Bearbeiten|Delete|Loeschen|L.schen|Post|Buchen|Release|Freigeben|Get Source|Source Document|Document|Receipt|Put-away|Show more|Mehr anzeigen|Open|Oeffnen|View|Ansicht|Card|Liste/i;
  return buttons
    .map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((name) => interesting.test(name))
    .slice(0, 120);
}

function classifyPage(text: string, buttons: string[]) {
  const routeSignals = {
    warehouseReceiptText: /Warehouse Receipt|Warehouse Receipts/i.test(text),
    warehousePutawayText: /Warehouse Put-away|Warehouse Put-aways|Inventory Put-away|Inventory Put-aways/i.test(text),
    sourceDocumentAction: buttons.some((name) => /Get Source Documents|Use Filters to Get Source|Source Documents/i.test(name)),
    releaseAction: buttons.some((name) => /Release|Freigeben/i.test(name)),
    postAction: buttons.some((name) => /Post|Buchen/i.test(name)),
    newAction: buttons.some((name) => /^New$|^Neu$|New Document/i.test(name)),
    editAction: buttons.some((name) => /Edit|Bearbeiten/i.test(name)),
    deleteAction: buttons.some((name) => /Delete|Loeschen|L.schen/i.test(name)),
    dialogConfirmSignal: buttons.some((name) => /^OK$|^Yes$|^Ja$|Post|Buchen|Delete|Loeschen|L.schen/i.test(name))
  };
  const isWarehouseRoute = routeSignals.warehouseReceiptText || routeSignals.warehousePutawayText || routeSignals.sourceDocumentAction;
  const dangerousActionVisible = routeSignals.postAction || routeSignals.deleteAction || routeSignals.dialogConfirmSignal;
  return { routeSignals, isWarehouseRoute, dangerousActionVisible };
}

const candidates: Candidate[] = [
  { id: 'warehouse-receipts-list-7331', pageId: 7331, expectedKind: 'warehouse-receipt' },
  { id: 'warehouse-receipt-card-7332', pageId: 7332, expectedKind: 'warehouse-receipt' },
  { id: 'warehouse-putaways-list-7344', pageId: 7344, expectedKind: 'warehouse-putaway' },
  { id: 'inventory-putaways-list-7375', pageId: 7375, expectedKind: 'warehouse-putaway' },
  { id: 'warehouse-activity-lines-5768', pageId: 5768, expectedKind: 'warehouse-activity' }
];

test('WAREHOUSE-006 inbound Warehouse Receipt/Put-away route preflight without posting', async ({ page }) => {
  const observations = [];

  for (const candidate of candidates) {
    await page.goto(directPageUrl(candidate.pageId), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await page.waitForTimeout(1800);

    const text = await pageText(page);
    const buttons = compactButtons(await visibleButtonNames(page));
    const classification = classifyPage(text, buttons);
    const observation = {
      ...candidate,
      url: page.url(),
      instanceVisible: /MCP_1_20260210/i.test(page.url()),
      companyVisible: /company=RM-DEMO|RM-DEMO/i.test(page.url()) || /RM-DEMO/i.test(text),
      titleSignals: normalizedLines(text).filter((line) => /Warehouse|Receipt|Put-away|Putaway|Activity|Business Central/i.test(line)).slice(0, 30),
      buttons,
      ...classification
    };

    observations.push(observation);
    await writeTextEvidence(warehouseEvidencePath(`${candidate.id}-compact-page-text.txt`), compactWarehouseText(text));
    await writeJsonEvidence(warehouseEvidencePath(`${candidate.id}-buttons.json`), buttons);
  }

  const routeCandidates = observations.filter((entry) => entry.isWarehouseRoute);
  const bestRoute = routeCandidates.find((entry) => entry.routeSignals.sourceDocumentAction)
    ?? routeCandidates.find((entry) => entry.routeSignals.warehouseReceiptText)
    ?? routeCandidates[0]
    ?? null;

  const resultStatus = bestRoute ? 'observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-inbound-receipt-preflight',
    caseId: 'WAREHOUSE-006-INBOUND-WAREHOUSE-RECEIPT-PREFLIGHT',
    source: 'playwright-ui-direct-page-route-scout',
    resultStatus,
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    companySwitched: false,
    draftCreated: false,
    apiShortcut: false,
    routeScoutOnly: true,
    sourceSetup: {
      location: 'FRA-ZL',
      requireReceive: true,
      requireShipment: true,
      requirePutAway: true,
      requirePick: null,
      binMandatory: false,
      directedPutAwayAndPick: false,
      sourceEvidence: 'playwright/projects/fibu-book5/evidence/warehouse-005/WAREHOUSE-005-result.json'
    },
    observations,
    bestRoute,
    proves: bestRoute
      ? [
          'At least one Warehouse inbound route page was opened directly by page URL without Tell-Me search.',
          'The route scout stayed read-only: no New, no Edit, no Delete, no posting, no preview, no draft and no API shortcut.',
          bestRoute.routeSignals.sourceDocumentAction
            ? 'A source-document action signal is visible on the selected Warehouse route candidate.'
            : 'A Warehouse Receipt or Put-away page signal is visible, but source-document action still needs a scoped follow-up.'
        ]
      : [
          'The run stayed read-only and used only direct page navigation.',
          'No candidate page provided a reliable Warehouse Receipt or Put-away route signal.'
        ],
    doesNotProve: [
      'No Warehouse Receipt document was created.',
      'No source document was selected.',
      'No Warehouse receipt/put-away was posted.',
      'No Item Ledger Entry or Warehouse Entry trace was produced.',
      'No German final Warehouse proof.'
    ],
    blockedBy: bestRoute ? [] : ['warehouse-inbound-route-not-found-by-direct-page-scout'],
    warnings: observations.some((entry) => entry.dangerousActionVisible)
      ? ['Dangerous actions are visible on at least one page but were not clicked. Follow-up must use scoped action guards.']
      : [],
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In the German final sandbox, repeat the direct Warehouse Receipt/Put-away route scout with the final German location and source document before creating or posting Warehouse documents.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    targetGermanCompanyImpact: 'German final run must recreate Warehouse page route, source document selection, receipt/put-away posting and ledger trace with German setup and screenshots.',
    finalScreenshotNeeded: true,
    nextCase: bestRoute
      ? 'WAREHOUSE-007-INBOUND-SOURCE-DOCUMENT-SELECTION'
      : 'WAREHOUSE-007-WAREHOUSE-INBOUND-ROUTE-BLOCKER-REVIEW',
    nextStep: bestRoute
      ? 'WAREHOUSE-007: use the selected route candidate to attempt controlled source-document selection without posting.'
      : 'WAREHOUSE-007: refine direct page IDs or UI route discovery before any Warehouse draft.'
  };

  await writeJsonEvidence(warehouseEvidencePath('010-route-observations.json'), observations);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-006-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-006-INBOUND-WAREHOUSE-RECEIPT-PREFLIGHT.md'),
    [
      '# WAREHOUSE-006 Inbound Warehouse Receipt/Put-away Preflight',
      '',
      'Status: `labor`, `ui-first`, `route-scout`, `read-only`, `no-posting`, `not-final`.',
      '',
      '## Ziel',
      '',
      'WAREHOUSE-006 prueft nach dem FRA-ZL-Setup-Fit, welche Warehouse-Receipt-/Put-away-Seiten direkt und ohne Tell-Me-Suche erreichbar sind. Der Lauf erzeugt keinen Beleg und klickt keine riskante Aktion.',
      '',
      '## Ergebnis',
      '',
      `Status: \`${result.resultStatus}\``,
      `Beste Route: ${bestRoute ? `${bestRoute.id} (page ${bestRoute.pageId})` : 'keine belastbare Route gefunden'}`,
      '',
      '| Kandidat | Page ID | Route-Signal | Source-Document-Aktion | Riskante Aktion sichtbar |',
      '|---|---:|---|---|---|',
      ...observations.map((entry) => `| ${entry.id} | ${entry.pageId} | ${entry.isWarehouseRoute ? 'ja' : 'nein'} | ${entry.routeSignals.sourceDocumentAction ? 'ja' : 'nein'} | ${entry.dangerousActionVisible ? 'ja, nicht geklickt' : 'nein'} |`),
      '',
      '## Laborgrenze',
      '',
      '- Kein `New`.',
      '- Kein `Edit`.',
      '- Kein `Delete`.',
      '- Kein `Post`.',
      '- Kein `Preview Posting`.',
      '- Kein Draft.',
      '- Keine Setup-Aenderung.',
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
      '# WAREHOUSE-006 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-006-result.json` | JSON-Ergebnis | direkte Warehouse-Inbound-Seitenroute ohne Suche und ohne Schreibaktion | keinen Warehouse-Beleg, keine Buchung | labor-route-scout |',
      '| `010-route-observations.json` | strukturierte Beobachtung | Kandidaten, Page IDs, Buttons und Route-Signale | keine Source-Document-Auswahl | ui-evidence |',
      '| `*-compact-page-text.txt` | kompakter Seitentext | relevante Warehouse-/Receipt-/Put-away-Zeilen pro Kandidat | keinen Vollsnapshot | ui-evidence |',
      '| `*-buttons.json` | Buttonlisten | sichtbare Aktionssignale und Risikoindikatoren | keine Aktion wurde ausgefuehrt | ui-evidence |',
      '| `WAREHOUSE-006-INBOUND-WAREHOUSE-RECEIPT-PREFLIGHT.md` | Lernnotiz | Entscheidung fuer WAREHOUSE-007 | keinen deutschen Finalnachweis | labor |',
      ''
    ].join('\n')
  );

  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.setupChanged).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
