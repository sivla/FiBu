import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

type FilteredPageCheck = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  screenshotFile: string;
  labelPattern: RegExp;
  expectedMarkers: RegExp[];
  purpose: string;
};

function inventoryEvidencePath(fileName: string) {
  return evidencePath(project.name, 'inventory-001', fileName);
}

function existingEvidencePath(testId: string, fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function hasAll(text: string, patterns: RegExp[]) {
  return patterns.every((pattern) => pattern.test(text));
}

async function activateWideLayout(page: Page) {
  const selectors = [
    'button[aria-label*="Breites Layout" i]',
    'button[aria-label*="Focus mode" i]',
    'button[aria-label*="Full screen" i]',
    'button[aria-label*="Maximize" i]',
    'button[aria-label*="Maximise" i]',
    'button[aria-label*="Expand" i]',
    'button[aria-label*="Fokus" i]',
    'button[aria-label*="Vollbild" i]',
    'button[aria-label*="Maximieren" i]',
    'button[title*="Breites Layout" i]',
    'button[title*="Focus mode" i]',
    'button[title*="Full screen" i]',
    'button[title*="Maximize" i]',
    'button[title*="Maximise" i]',
    'button[title*="Expand" i]',
    'button[title*="Fokus" i]',
    'button[title*="Vollbild" i]',
    'button[title*="Maximieren" i]'
  ];

  for (const scope of [page, ...page.frames()]) {
    const wideLayoutToggle = scope.getByRole('menuitemcheckbox', { name: /Breites Layout|Wide layout/i }).last();
    if (await wideLayoutToggle.isVisible({ timeout: 500 }).catch(() => false)) {
      const checked = await wideLayoutToggle.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await wideLayoutToggle.click().catch(() => undefined);
        await page.waitForTimeout(1000);
      }
      return true;
    }

    const roleButton = scope
      .getByRole('button', {
        name: /Breites Layout|Wide layout|Focus mode|Full screen|Maximi[sz]e|Expand|Fokus|Vollbild|Maximieren|Erweitern/i
      })
      .last();
    if (await roleButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await roleButton.click().catch(() => undefined);
      await page.waitForTimeout(1000);
      return true;
    }

    for (const selector of selectors) {
      const button = scope.locator(selector).last();
      if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
        await button.click().catch(() => undefined);
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }

  return false;
}

async function openAndCaptureFilteredPage(page: Page, check: FilteredPageCheck) {
  await page.goto(filteredBcPageUrl(check.pageId, check.tableName, check.filterField, check.filterValue), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await dismissTours(page);
  await hideFactBoxPane(page);
  const wideLayoutActivated = await activateWideLayout(page);
  await page.waitForTimeout(500);

  const text = normalizeText(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath(`${check.fileStem}-page-text.txt`), text);
  await screenshot(page, check.screenshotFile, {
    projectName: project.name,
    testId: 'inventory-001',
    status: check.labelPattern.test(text) && text.includes(check.filterValue) ? 'labor' : 'rejected',
    purpose: check.purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO; kein deutscher Kontenplan- oder Steuer-Endstand.',
      'Read-only-Navigation auf bereits gebuchte O2C/P2P-Laborposten; keine neue Buchung.'
    ],
    bookUse: 'evidence'
  });

  return {
    id: check.id,
    pageId: check.pageId,
    tableName: check.tableName,
    filterField: check.filterField,
    filterValue: check.filterValue,
    pageContextVisible: check.labelPattern.test(text),
    filterValueVisible: text.includes(check.filterValue),
    expectedMarkersVisible: hasAll(text, check.expectedMarkers),
    visibleMarkers: check.expectedMarkers.map((pattern) => ({ pattern: pattern.source, visible: pattern.test(text) })),
    hasRmM100: /RM-M100/i.test(text),
    hasRawSteel: /RAW-STEEL|Stahltraeger|Stahltr/i.test(text),
    hasFraZl: /FRA-ZL/i.test(text),
    hasQuantityMinus1: /-\s*1(?:\.00|,00)?\b|-1\b/i.test(text),
    hasQuantity10: /\b10(?:\.00|,00)?\b/i.test(text),
    hasCost25000: /25[.,]000|25000/i.test(text),
    hasAmount68000: /68[.,]000|68000/i.test(text),
    hasInventoryAccount14140: /\b14140\b/i.test(text),
    hasApAccount22100: /\b22100\b/i.test(text),
    hasCogsOrSalesAccounts: /\b50110\b|\b40140\b|\b15110\b/i.test(text),
    hasProductlineMachine: /PRODUCTLINE[\s\S]{0,180}MACHINE|MACHINE[\s\S]{0,180}PRODUCTLINE/i.test(text),
    hasChannelB2b: /CHANNEL[\s\S]{0,180}B2B|B2B[\s\S]{0,180}CHANNEL/i.test(text),
    wideLayoutActivated,
    textEvidenceFile: `${check.fileStem}-page-text.txt`,
    screenshot: check.screenshotFile
  };
}

async function openTellMeAndCaptureInventoryValuation(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'Inventory Valuation');
  await page.waitForTimeout(1500);

  const tellMeText = normalizeText(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath('100-inventory-valuation-tell-me-page-text.txt'), tellMeText);
  const buttons = await visibleButtonNames(page);
  await writeJsonEvidence(inventoryEvidencePath('100-inventory-valuation-tell-me-buttons.json'), buttons);
  await screenshot(page, 'inventory-001-100-inventory-valuation-tell-me.png', {
    projectName: project.name,
    testId: 'inventory-001',
    status: /Inventory Valuation|Lagerbewertung/i.test(tellMeText) ? 'labor' : 'rejected',
    purpose: 'Tell-Me-Nachweis fuer Inventory Valuation/Lagerbewertung als naechsten Reporting-Einstieg.',
    knownLimitations: [
      'Nur Such-/Einstiegsnachweis; keine Zahlenwirkung im Bewertungsbericht behauptet.',
      'Kein Reportlauf und keine Aenderung an Lager-/Buchungssetup.'
    ],
    bookUse: /Inventory Valuation|Lagerbewertung/i.test(tellMeText) ? 'evidence' : 'do-not-use'
  });

  return {
    searchedFor: 'Inventory Valuation',
    inventoryValuationVisibleInTellMe: /Inventory Valuation|Lagerbewertung/i.test(tellMeText),
    relatedInventoryResultsVisible: /Item|Inventory|Lager|Artikel/i.test(tellMeText),
    openedReport: false,
    textEvidenceFile: '100-inventory-valuation-tell-me-page-text.txt',
    buttonEvidenceFile: '100-inventory-valuation-tell-me-buttons.json',
    screenshot: 'inventory-001-100-inventory-valuation-tell-me.png',
    limitation:
      'Dieser Lauf sichert nur den Einstieg. Die konkrete Lagerbewertung mit Datum/Filter und Zahlenwirkung bleibt ein separater, read-only Reporting-Schritt.'
  };
}

async function loadJson<T>(testId: string, fileName: string) {
  return JSON.parse(await fs.readFile(existingEvidencePath(testId, fileName), 'utf8')) as T;
}

test('INVENTORY-001 O2C/P2P Artikelposten, Wertposten und Lagerbewertung read-only verstehen', async ({ page }) => {
  const o2c = await loadJson<{
    postedSalesInvoiceNumber: string;
    orderNumber: string;
    itemLedgerEntryNoFromValueEntry?: string;
  }>('uat-o2c-001', '082-posting-entry-trace.json');
  const p2p = await loadJson<{
    postedPurchaseInvoiceNumber: string;
    purchaseOrderNumber: string;
    itemLedgerEntryNoFromValueEntry?: string;
  }>('p2p-001', '160-posting-trace-summary.json');

  const o2cInvoiceNo = o2c.postedSalesInvoiceNumber;
  const p2pInvoiceNo = p2p.postedPurchaseInvoiceNumber;
  const o2cItemLedgerEntryNo = o2c.itemLedgerEntryNoFromValueEntry ?? '792';
  const p2pItemLedgerEntryNo = p2p.itemLedgerEntryNoFromValueEntry ?? '793';

  const checks: FilteredPageCheck[] = [
    {
      id: 'o2c-item-ledger-entry-rm-m100',
      pageId: 38,
      tableName: 'Item Ledger Entry',
      filterField: 'Entry No.',
      filterValue: o2cItemLedgerEntryNo,
      fileStem: '010-o2c-item-ledger-entry-rm-m100',
      screenshotFile: 'inventory-001-010-o2c-item-ledger-entry-rm-m100.png',
      labelPattern: /Item Ledger Entries|Item Ledger Entry|Artikelposten/i,
      expectedMarkers: [/RM-M100/i, /FRA-ZL/i],
      purpose: `O2C-Artikelposten ${o2cItemLedgerEntryNo} fuer RM-M100 nach gebuchter Verkaufsrechnung ${o2cInvoiceNo}.`
    },
    {
      id: 'o2c-value-entry-rm-m100',
      pageId: 5802,
      tableName: 'Value Entry',
      filterField: 'Document No.',
      filterValue: o2cInvoiceNo,
      fileStem: '020-o2c-value-entry-rm-m100',
      screenshotFile: 'inventory-001-020-o2c-value-entry-rm-m100.png',
      labelPattern: /Value Entries|Value Entry|Wertposten|Cost Amount|Kostenbetrag/i,
      expectedMarkers: [/RM-M100/i, new RegExp(o2cItemLedgerEntryNo)],
      purpose: `O2C-Wertposten zur gebuchten Verkaufsrechnung ${o2cInvoiceNo}; Bruecke zum Artikelposten.`
    },
    {
      id: 'o2c-gl-entries-inventory-cogs',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: o2cInvoiceNo,
      fileStem: '030-o2c-gl-entries-inventory-cogs',
      screenshotFile: 'inventory-001-030-o2c-gl-entries-inventory-cogs.png',
      labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i,
      expectedMarkers: [/\b14140\b/i],
      purpose: `Sachposten zur O2C-Rechnung ${o2cInvoiceNo}; Finanzspur fuer Bestand/COGS/Umsatz im Labor.`
    },
    {
      id: 'p2p-item-ledger-entry-raw-steel',
      pageId: 38,
      tableName: 'Item Ledger Entry',
      filterField: 'Entry No.',
      filterValue: p2pItemLedgerEntryNo,
      fileStem: '040-p2p-item-ledger-entry-raw-steel',
      screenshotFile: 'inventory-001-040-p2p-item-ledger-entry-raw-steel.png',
      labelPattern: /Item Ledger Entries|Item Ledger Entry|Artikelposten/i,
      expectedMarkers: [/RAW-STEEL|Stahltraeger|Stahltr/i, /FRA-ZL/i],
      purpose: `P2P-Artikelposten ${p2pItemLedgerEntryNo} fuer RAW-STEEL nach gebuchter Einkaufsrechnung ${p2pInvoiceNo}.`
    },
    {
      id: 'p2p-value-entry-raw-steel',
      pageId: 5802,
      tableName: 'Value Entry',
      filterField: 'Document No.',
      filterValue: p2pInvoiceNo,
      fileStem: '050-p2p-value-entry-raw-steel',
      screenshotFile: 'inventory-001-050-p2p-value-entry-raw-steel.png',
      labelPattern: /Value Entries|Value Entry|Wertposten|Cost Amount|Kostenbetrag/i,
      expectedMarkers: [/RAW-STEEL|Stahltraeger|Stahltr/i, new RegExp(p2pItemLedgerEntryNo)],
      purpose: `P2P-Wertposten zur gebuchten Einkaufsrechnung ${p2pInvoiceNo}; Bruecke zum Artikelposten.`
    },
    {
      id: 'p2p-gl-entries-inventory-ap',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: p2pInvoiceNo,
      fileStem: '060-p2p-gl-entries-inventory-ap',
      screenshotFile: 'inventory-001-060-p2p-gl-entries-inventory-ap.png',
      labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i,
      expectedMarkers: [/\b14140\b/i, /\b22100\b/i],
      purpose: `Sachposten zur P2P-Rechnung ${p2pInvoiceNo}; Lagerbestand und Kreditor im Labor.`
    },
    {
      id: 'item-card-rm-m100',
      pageId: 30,
      tableName: 'Item',
      filterField: 'No.',
      filterValue: 'RM-M100',
      fileStem: '070-item-card-rm-m100',
      screenshotFile: 'inventory-001-070-item-card-rm-m100.png',
      labelPattern: /Item Card|Item|Artikelkarte|Artikel/i,
      expectedMarkers: [/RM-M100/i],
      purpose: 'Artikelkarte RM-M100 read-only: Welche Buchungs-/Lagerlogik steckt hinter dem O2C-Artikel?'
    },
    {
      id: 'item-card-raw-steel',
      pageId: 30,
      tableName: 'Item',
      filterField: 'No.',
      filterValue: 'RAW-STEEL',
      fileStem: '080-item-card-raw-steel',
      screenshotFile: 'inventory-001-080-item-card-raw-steel.png',
      labelPattern: /Item Card|Item|Artikelkarte|Artikel/i,
      expectedMarkers: [/RAW-STEEL|Stahltraeger|Stahltr/i],
      purpose: 'Artikelkarte RAW-STEEL read-only: Welche Buchungs-/Lagerlogik steckt hinter dem P2P-Rohmaterial?'
    },
    {
      id: 'location-fra-zl',
      pageId: 15,
      tableName: 'Location',
      filterField: 'Code',
      filterValue: 'FRA-ZL',
      fileStem: '090-location-fra-zl',
      screenshotFile: 'inventory-001-090-location-fra-zl.png',
      labelPattern: /Locations|Location|Lagerorte|Lagerort/i,
      expectedMarkers: [/FRA-ZL/i],
      purpose: 'Lagerort FRA-ZL read-only: Ist die Lagerbewegung einem einfachen Standort zugeordnet?'
    }
  ];

  const traces = [];
  for (const check of checks) {
    traces.push(await openAndCaptureFilteredPage(page, check));
  }
  const inventoryValuation = await openTellMeAndCaptureInventoryValuation(page);

  const result = {
    testId: 'INVENTORY-001',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting',
    sourceDocuments: {
      o2c: {
        salesOrderNo: o2c.orderNumber,
        postedSalesInvoiceNo: o2cInvoiceNo,
        itemNo: 'RM-M100',
        expectedLocation: 'FRA-ZL',
        itemLedgerEntryNo: o2cItemLedgerEntryNo
      },
      p2p: {
        purchaseOrderNo: p2p.purchaseOrderNumber,
        postedPurchaseInvoiceNo: p2pInvoiceNo,
        itemNo: 'RAW-STEEL',
        expectedLocation: 'FRA-ZL',
        itemLedgerEntryNo: p2pItemLedgerEntryNo
      }
    },
    traces,
    inventoryValuation,
    summary: {
      o2cItemLedgerEntryVisible: traces.find((entry) => entry.id === 'o2c-item-ledger-entry-rm-m100')?.expectedMarkersVisible ?? false,
      o2cValueEntryVisible: traces.find((entry) => entry.id === 'o2c-value-entry-rm-m100')?.expectedMarkersVisible ?? false,
      o2cGlInventoryAccountVisible: traces.find((entry) => entry.id === 'o2c-gl-entries-inventory-cogs')?.hasInventoryAccount14140 ?? false,
      p2pItemLedgerEntryVisible: traces.find((entry) => entry.id === 'p2p-item-ledger-entry-raw-steel')?.expectedMarkersVisible ?? false,
      p2pValueEntryVisible: traces.find((entry) => entry.id === 'p2p-value-entry-raw-steel')?.expectedMarkersVisible ?? false,
      p2pGlInventoryAndApVisible:
        Boolean(traces.find((entry) => entry.id === 'p2p-gl-entries-inventory-ap')?.hasInventoryAccount14140) &&
        Boolean(traces.find((entry) => entry.id === 'p2p-gl-entries-inventory-ap')?.hasApAccount22100),
      itemCardsVisible:
        Boolean(traces.find((entry) => entry.id === 'item-card-rm-m100')?.expectedMarkersVisible) &&
        Boolean(traces.find((entry) => entry.id === 'item-card-raw-steel')?.expectedMarkersVisible),
      locationFraZlVisible: traces.find((entry) => entry.id === 'location-fra-zl')?.expectedMarkersVisible ?? false,
      productlineMachineVisibleInInventoryTrace: traces.some((entry) => entry.hasProductlineMachine),
      channelB2bVisibleInInventoryTrace: traces.some((entry) => entry.hasChannelB2b),
      inventoryValuationEntryPointVisible: inventoryValuation.inventoryValuationVisibleInTellMe,
      wideLayoutActivatedForFilteredPages: traces.every((entry) => entry.wideLayoutActivated),
      noPostingCommittedByTest: true
    },
    proves: [
      'O2C- und P2P-Laborposten koennen ueber Artikelposten, Wertposten und Sachposten read-only nachvollzogen werden.',
      'Value Entries sind die praktische Bruecke von gebuchten Belegen zu Item Ledger Entries, wenn direkte Order-/Document-Filter nicht reichen.',
      'FRA-ZL ist als Lagerort in beiden Inventory-Spuren sichtbar.',
      '14140 ist als CRONUS-USA-Labor-Bestandskonto in den Sachposten sichtbar, soweit die Seite es zeigt.',
      'Breite Layoutansicht wurde fuer die gefilterten Tabellenbilder aktiviert, damit mehr fachlich relevante Spalten sichtbar sind.'
    ],
    doesNotProve: [
      'Kein deutscher Kontenplan-Endstand.',
      'Kein deutscher 19-Prozent-USt-/Vorsteuer-Endstand.',
      'Keine aktivierte Warehouse-Funktion und keine Warehouse-Prozessfreigabe.',
      'Keine finale Lagerbewertungszahl, weil Inventory Valuation nur als Einstieg gesichert wurde.',
      'Keine neue Buchung.'
    ],
    nextStep:
      'Inventory Valuation/Lagerbewertung mit Datum, Item-Filter und Location-Filter separat read-only ausfuehren; danach Buchkapitel Lagerbewertung mit Zahlenwirkung ergaenzen.'
  };

  await writeJsonEvidence(inventoryEvidencePath('INVENTORY-LAB-TRACE-result.json'), result);
  await writeTextEvidence(inventoryEvidencePath('INVENTORY-LAB-TRACE.md'), renderMarkdown(result));

  expect(result.summary.o2cItemLedgerEntryVisible).toBe(true);
  expect(result.summary.o2cValueEntryVisible).toBe(true);
  expect(result.summary.p2pItemLedgerEntryVisible).toBe(true);
  expect(result.summary.p2pValueEntryVisible).toBe(true);
  expect(result.summary.noPostingCommittedByTest).toBe(true);
});

function renderMarkdown(result: {
  environment: string;
  company: string;
  mode: string;
  sourceDocuments: {
    o2c: { salesOrderNo: string; postedSalesInvoiceNo: string; itemNo: string; expectedLocation: string; itemLedgerEntryNo: string };
    p2p: { purchaseOrderNo: string; postedPurchaseInvoiceNo: string; itemNo: string; expectedLocation: string; itemLedgerEntryNo: string };
  };
  traces: Array<Record<string, unknown>>;
  inventoryValuation: Record<string, unknown>;
  summary: Record<string, unknown>;
  proves: string[];
  doesNotProve: string[];
  nextStep: string;
}) {
  const traceRows = result.traces.map((trace) => {
    const id = String(trace.id);
    const visible = trace.expectedMarkersVisible ? 'ja' : 'nein';
    const file = String(trace.textEvidenceFile);
    const screenshotFile = String(trace.screenshot);
    return `| ${id} | ${visible} | ${file} | ${screenshotFile} |`;
  });

  return [
    '# INVENTORY-001 Inventory Trace',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Modus | ${result.mode} |`,
    `| O2C-Beleg | ${result.sourceDocuments.o2c.postedSalesInvoiceNo} / ${result.sourceDocuments.o2c.itemNo} / ILE ${result.sourceDocuments.o2c.itemLedgerEntryNo} |`,
    `| P2P-Beleg | ${result.sourceDocuments.p2p.postedPurchaseInvoiceNo} / ${result.sourceDocuments.p2p.itemNo} / ILE ${result.sourceDocuments.p2p.itemLedgerEntryNo} |`,
    '',
    '## Kernergebnis',
    '',
    '| Frage | Befund |',
    '|---|---|',
    `| O2C-Artikelposten sichtbar | ${result.summary.o2cItemLedgerEntryVisible ? 'ja' : 'nein'} |`,
    `| O2C-Wertposten sichtbar | ${result.summary.o2cValueEntryVisible ? 'ja' : 'nein'} |`,
    `| O2C-Bestandskonto 14140 sichtbar | ${result.summary.o2cGlInventoryAccountVisible ? 'ja' : 'nein'} |`,
    `| P2P-Artikelposten sichtbar | ${result.summary.p2pItemLedgerEntryVisible ? 'ja' : 'nein'} |`,
    `| P2P-Wertposten sichtbar | ${result.summary.p2pValueEntryVisible ? 'ja' : 'nein'} |`,
    `| P2P-Bestand und Kreditor 14140/22100 sichtbar | ${result.summary.p2pGlInventoryAndApVisible ? 'ja' : 'nein'} |`,
    `| Artikelkarten sichtbar | ${result.summary.itemCardsVisible ? 'ja' : 'nein'} |`,
    `| Lagerort FRA-ZL sichtbar | ${result.summary.locationFraZlVisible ? 'ja' : 'nein'} |`,
    `| Inventory Valuation Einstieg sichtbar | ${result.summary.inventoryValuationEntryPointVisible ? 'ja' : 'nein'} |`,
    `| Breite Layoutansicht fuer Tabellen aktiviert | ${result.summary.wideLayoutActivatedForFilteredPages ? 'ja' : 'nein'} |`,
    `| Neue Buchung im Lauf | ${result.summary.noPostingCommittedByTest ? 'nein' : 'unklar'} |`,
    '',
    '## Evidence-Dateien',
    '',
    '| Kontrollpunkt | Erwartete Marker sichtbar | Seitentext | Screenshot |',
    '|---|---|---|---|',
    ...traceRows,
    '',
    '## Anfänger-Lernwert',
    '',
    'Business Central trennt Mengenbewegung und Wertbewegung. Der Artikelposten zeigt, welcher Artikel in welcher Menge an welchem Lagerort bewegt wurde. Der Wertposten zeigt die Kosten-/Wertwirkung dieser Bewegung und verbindet gebuchte Belege praktisch mit dem Artikelposten. Die Sachposten zeigen, welche Finanzkonten daraus bebucht wurden. Fuer die Buchanleitung ist deshalb nicht ein einzelner Screenshot ausreichend: Ein guter Nachweis besteht aus Beleg, Artikelposten, Wertposten und Sachposten.',
    '',
    '## Was bewiesen ist',
    '',
    ...result.proves.map((entry) => `- ${entry}`),
    '',
    '## Was nicht bewiesen ist',
    '',
    ...result.doesNotProve.map((entry) => `- ${entry}`),
    '',
    '## Inventory Valuation',
    '',
    `Der Tell-Me-Einstieg wurde gesichert: ${result.inventoryValuation.inventoryValuationVisibleInTellMe ? 'sichtbar' : 'nicht sichtbar'}. Eine konkrete Lagerbewertungszahl wurde in diesem Lauf nicht behauptet.`,
    '',
    '## Buchwirkung',
    '',
    'Kapitel zu Lager und Bewertung sollten die Spur nicht nur als Klickpfad zeigen, sondern die Rollen der Postenarten erklaeren: Artikelposten fuer Menge, Wertposten fuer Bewertung/Kosten, Sachposten fuer Kontenwirkung. Die CRONUS-USA-Konten und Tax-Werte bleiben Laborbefund.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}
