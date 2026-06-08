import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { pageText, requireBcUrl, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

type PostingResult = {
  posted: boolean;
  orderNumber: string;
  postedSalesInvoiceNumber: string;
};

type TraceTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  imageFileName: string;
  labelPattern: RegExp;
};

function o2cEvidencePath(fileName: string) {
  return evidencePath(project.name, 'uat-o2c-001', fileName);
}

function bcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

async function openFilteredPage(page: Page, target: TraceTarget, postedInvoiceNo: string) {
  await page.goto(bcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  const text = await pageText(page);
  await writeTextEvidence(o2cEvidencePath(`${target.fileStem}-page-text.txt`), text);
  await screenshot(page, target.imageFileName, {
    projectName: project.name,
    testId: 'uat-o2c-001',
    status: target.labelPattern.test(text) && new RegExp(target.filterValue).test(text) ? 'labor' : 'rejected',
    purpose: `Read-only-Postenspur fuer ${postedInvoiceNo}: ${target.id}.`,
    expectedPageText: [],
    knownLimitations: [
      'CRONUS-USA-Laborposten, kein deutscher 19-%-USt-Endstand.',
      `Gefilterte Listen-/Kartenansicht auf ${target.filterField} = ${target.filterValue}; keine neue Buchung.`
    ],
    bookUse: 'evidence'
  });

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValueVisible: new RegExp(target.filterValue).test(text),
    postedInvoiceNoVisible: new RegExp(postedInvoiceNo).test(text),
    pageContextVisible: target.labelPattern.test(text),
    hasAmount68000: /68[.,]000|68000/i.test(text),
    hasCustomerD10000: /D10000/i.test(text),
    hasItemRmM100: /RM-M100/i.test(text),
    hasInventoryAccount14140: /14140/i.test(text),
    hasProductlineMachine: /PRODUCTLINE[\s\S]{0,160}MACHINE|MACHINE[\s\S]{0,160}PRODUCTLINE/i.test(text),
    textEvidenceFile: `${target.fileStem}-page-text.txt`,
    screenshot: target.imageFileName
  };
}

async function clickFirstVisibleAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(3000);
          return true;
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(3000);
        return true;
      }
    }
  }

  return false;
}

async function captureFindEntriesTrace(page: Page, postedInvoiceNo: string) {
  await page.goto(bcPageUrl(132, 'Sales Invoice Header', 'No.', postedInvoiceNo), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);

  const clickedFindEntries = await clickFirstVisibleAction(
    page,
    /^Find entries\.\.\.$|^Find entries$|^Posten suchen\.\.\.$|^Posten suchen$|^Navigate\.\.\.$|^Navigieren\.\.\.$/i
  );
  await page.waitForTimeout(5000);
  const text = await pageText(page);
  await writeTextEvidence(o2cEvidencePath('087-find-entries-posted-invoice-page-text.txt'), text);
  await screenshot(page, 'uat-o2c-001-087-find-entries-posted-invoice.png', {
    projectName: project.name,
    testId: 'uat-o2c-001',
    status: clickedFindEntries && /Find Entries|Navigate|Posten suchen|Item Ledger Entry|Value Entry|G\/L Entry|Cust\. Ledger Entry/i.test(text) ? 'labor' : 'rejected',
    purpose: `Read-only-Find-Entries-Nachweis zur gebuchten Verkaufsrechnung ${postedInvoiceNo}.`,
    expectedPageText: [],
    knownLimitations: [
      'CRONUS-USA-Laborposten, keine deutsche 19-%-USt-Evidence.',
      'Find Entries/Navigate ist read-only; keine neue Buchung.'
    ],
    bookUse: 'evidence'
  });

  return {
    id: 'find-entries-posted-invoice',
    postedSalesInvoiceNumber: postedInvoiceNo,
    clickedFindEntries,
    pageContextVisible: /Find Entries|Navigate|Posten suchen|Gebuchte Verkaufsrechnung|Posted Sales Invoice/i.test(text),
    hasPostedInvoiceNo: new RegExp(postedInvoiceNo).test(text),
    hasCustomerLedgerEntry: /Cust\. Ledger Entry|Customer Ledger Entry|Debitorenposten/i.test(text),
    hasGlEntry: /G\/L Entry|G\/L Entries|Sachposten/i.test(text),
    hasItemLedgerEntry: /Item Ledger Entry|Item Ledger Entries|Artikelposten/i.test(text),
    hasValueEntry: /Value Entry|Value Entries|Wertposten/i.test(text),
    hasProductlineMachine: /PRODUCTLINE[\s\S]{0,160}MACHINE|MACHINE[\s\S]{0,160}PRODUCTLINE/i.test(text),
    textEvidenceFile: '087-find-entries-posted-invoice-page-text.txt',
    screenshot: 'uat-o2c-001-087-find-entries-posted-invoice.png'
  };
}

async function captureCurrentEntryDimensions(page: Page, entryContext: string) {
  const clickedEntryMenu = await clickFirstVisibleAction(page, /^Entry$|^Posten$/i);
  const clickedDimensions = await clickFirstVisibleAction(page, /^Dimensions$|^Dimensionen$/i);
  await page.waitForTimeout(3000);
  const text = await pageText(page);
  await writeTextEvidence(o2cEvidencePath('089-item-ledger-entry-dimensions-page-text.txt'), text);
  await screenshot(page, 'uat-o2c-001-089-item-ledger-entry-dimensions.png', {
    projectName: project.name,
    testId: 'uat-o2c-001',
    status: clickedDimensions && /Dimension|Dimensionen|PRODUCTLINE|MACHINE/i.test(text) ? 'labor' : 'rejected',
    purpose: `Read-only-Dimensionspruefung fuer ${entryContext}.`,
    expectedPageText: [],
    knownLimitations: [
      'CRONUS-USA-Laborposten, keine deutsche 19-%-USt-Evidence.',
      'Prueft nur, ob Dimensionen am gebuchten Artikelposten sichtbar sind; keine neue Buchung.'
    ],
    bookUse: clickedDimensions ? 'evidence' : 'do-not-use'
  });

  return {
    id: 'item-ledger-entry-dimensions',
    entryContext,
    clickedEntryMenu,
    clickedDimensions,
    dimensionContextVisible: /Dimension|Dimensionen/i.test(text),
    hasProductlineMachine: /PRODUCTLINE[\s\S]{0,160}MACHINE|MACHINE[\s\S]{0,160}PRODUCTLINE/i.test(text),
    textEvidenceFile: '089-item-ledger-entry-dimensions-page-text.txt',
    screenshot: 'uat-o2c-001-089-item-ledger-entry-dimensions.png'
  };
}

function extractItemLedgerEntryNoFromValueEntry(valueEntryText: string) {
  const match = valueEntryText.match(/\b(-?\d+)\s+(-?\d+)\s*(?:\n|$)/m);
  return match?.[1];
}

test('UAT-O2C-001 gebuchte Rechnung und Postenspur read-only sichern', async ({ page }) => {
  const posting = JSON.parse(await fs.readFile(o2cEvidencePath('080-posting-result.json'), 'utf8')) as PostingResult;
  expect(posting.posted).toBe(true);
  expect(posting.postedSalesInvoiceNumber).toMatch(/^PS-INV/);

  const documentNo = posting.postedSalesInvoiceNumber;
  const targets: TraceTarget[] = [
    {
      id: 'posted-sales-invoice',
      pageId: 132,
      tableName: 'Sales Invoice Header',
      filterField: 'No.',
      filterValue: documentNo,
      fileStem: '082-posted-sales-invoice',
      imageFileName: 'uat-o2c-001-082-posted-sales-invoice.png',
      labelPattern: /Posted Sales Invoice|Gebuchte Verkaufsrechnung|Sales Invoice/i
    },
    {
      id: 'customer-ledger-entries',
      pageId: 25,
      tableName: 'Cust. Ledger Entry',
      filterField: 'Document No.',
      filterValue: documentNo,
      fileStem: '083-customer-ledger-entries',
      imageFileName: 'uat-o2c-001-083-customer-ledger-entries.png',
      labelPattern: /Customer Ledger Entries|Cust\. Ledger Entries|Debitorenposten|Remaining Amount|Restbetrag/i
    },
    {
      id: 'gl-entries',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: documentNo,
      fileStem: '084-gl-entries',
      imageFileName: 'uat-o2c-001-084-gl-entries.png',
      labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i
    },
    {
      id: 'item-ledger-entries',
      pageId: 38,
      tableName: 'Item Ledger Entry',
      filterField: 'Order No.',
      filterValue: posting.orderNumber,
      fileStem: '085-item-ledger-entries',
      imageFileName: 'uat-o2c-001-085-item-ledger-entries.png',
      labelPattern: /Item Ledger Entries|Item Ledger Entry|Artikelposten|RM-M100/i
    },
    {
      id: 'value-entries',
      pageId: 5802,
      tableName: 'Value Entry',
      filterField: 'Document No.',
      filterValue: documentNo,
      fileStem: '086-value-entries',
      imageFileName: 'uat-o2c-001-086-value-entries.png',
      labelPattern: /Value Entries|Value Entry|Wertposten|Cost Amount|Kostenbetrag/i
    }
  ];

  const traces = [];
  for (const target of targets) {
    traces.push(await openFilteredPage(page, target, documentNo));
  }
  const valueEntryText = await fs.readFile(o2cEvidencePath('086-value-entries-page-text.txt'), 'utf8');
  const itemLedgerEntryNoFromValueEntry = extractItemLedgerEntryNoFromValueEntry(valueEntryText);
  let itemLedgerEntryByEntryNoTrace: Awaited<ReturnType<typeof openFilteredPage>> | undefined;
  let itemLedgerEntryDimensionsTrace: Awaited<ReturnType<typeof captureCurrentEntryDimensions>> | undefined;
  if (itemLedgerEntryNoFromValueEntry) {
    itemLedgerEntryByEntryNoTrace = await openFilteredPage(
      page,
      {
        id: 'item-ledger-entry-by-entry-no',
        pageId: 38,
        tableName: 'Item Ledger Entry',
        filterField: 'Entry No.',
        filterValue: itemLedgerEntryNoFromValueEntry,
        fileStem: '088-item-ledger-entry-by-entry-no',
        imageFileName: 'uat-o2c-001-088-item-ledger-entry-by-entry-no.png',
        labelPattern: /Item Ledger Entries|Item Ledger Entry|Artikelposten|RM-M100/i
      },
      documentNo
    );
    itemLedgerEntryDimensionsTrace = await captureCurrentEntryDimensions(
      page,
      `Item Ledger Entry No. ${itemLedgerEntryNoFromValueEntry}`
    );
  }
  const findEntriesTrace = await captureFindEntriesTrace(page, documentNo);

  const result = {
    testId: 'UAT-O2C-001',
    company: project.defaultCompany,
    status: 'labor-read-only-posting-trace',
    orderNumber: posting.orderNumber,
    postedSalesInvoiceNumber: documentNo,
    traces,
    itemLedgerEntryNoFromValueEntry,
    itemLedgerEntryByEntryNoTrace,
    itemLedgerEntryDimensionsTrace,
    findEntriesTrace,
    summary: {
      postedInvoiceVisible: traces.find((entry) => entry.id === 'posted-sales-invoice')?.filterValueVisible ?? false,
      customerLedgerVisible: traces.find((entry) => entry.id === 'customer-ledger-entries')?.filterValueVisible ?? false,
      glEntriesVisible: traces.find((entry) => entry.id === 'gl-entries')?.filterValueVisible ?? false,
      itemLedgerVisible:
        (traces.find((entry) => entry.id === 'item-ledger-entries')?.filterValueVisible ?? false) ||
        (itemLedgerEntryByEntryNoTrace?.filterValueVisible ?? false) ||
        findEntriesTrace.hasItemLedgerEntry,
      valueEntriesVisible: traces.find((entry) => entry.id === 'value-entries')?.filterValueVisible ?? false,
      itemLedgerVisibleViaDirectFilter: traces.find((entry) => entry.id === 'item-ledger-entries')?.filterValueVisible ?? false,
      itemLedgerVisibleViaValueEntryEntryNo: itemLedgerEntryByEntryNoTrace?.filterValueVisible ?? false,
      itemLedgerVisibleViaFindEntries: findEntriesTrace.hasItemLedgerEntry,
      productlineMachineFoundInTrace:
        traces.some((entry) => entry.hasProductlineMachine) ||
        findEntriesTrace.hasProductlineMachine ||
        (itemLedgerEntryDimensionsTrace?.hasProductlineMachine ?? false)
    },
    explicitNonProofs: [
      'kein deutscher 19-%-USt-Endstand',
      'kein deutscher Kontenplan-Endstand',
      'keine produktive Buchungsfreigabe'
    ]
  };

  await writeJsonEvidence(o2cEvidencePath('082-posting-entry-trace.json'), result);
  await writeTextEvidence(
    o2cEvidencePath('082-posting-entry-trace-learning.md'),
    [
      '# UAT-O2C-001 Postenspur-Lernbefund',
      '',
      '| Punkt | Befund |',
      '|---|---|',
      `| Gebuchte Verkaufsrechnung | ${documentNo} |`,
      `| Ursprungsauftrag | ${posting.orderNumber} |`,
      `| Debitorenposten sichtbar | ${result.summary.customerLedgerVisible ? 'ja' : 'nein'} |`,
      `| Sachposten sichtbar | ${result.summary.glEntriesVisible ? 'ja' : 'nein'} |`,
      `| Artikelposten sichtbar | ${result.summary.itemLedgerVisible ? 'ja' : 'nein'} |`,
      `| Artikelposten ueber Direktfilter sichtbar | ${result.summary.itemLedgerVisibleViaDirectFilter ? 'ja' : 'nein'} |`,
      `| Artikelposten ueber Value-Entry-Verknuepfung sichtbar | ${result.summary.itemLedgerVisibleViaValueEntryEntryNo ? 'ja' : 'nein'} |`,
      `| Artikelposten ueber Find entries sichtbar | ${result.summary.itemLedgerVisibleViaFindEntries ? 'ja' : 'nein'} |`,
      `| Wertposten sichtbar | ${result.summary.valueEntriesVisible ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE=MACHINE in Postenspur sichtbar | ${result.summary.productlineMachineFoundInTrace ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE=MACHINE am Artikelposten sichtbar | ${itemLedgerEntryDimensionsTrace?.hasProductlineMachine ? 'ja' : 'nein'} |`,
      '| Warum das wichtig ist | Nach `Ship and Invoice` verschwindet der Auftrag nicht einfach: BC erzeugt eine gebuchte Verkaufsrechnung und daraus fachliche Posten fuer Debitor, Sachkonten, Artikel und Wert. Diese Posten sind die Beweisfuehrung hinter dem Screenshot. |',
      '| Laborgrenze | Alle Posten gehoeren zur CRONUS-USA-Spielwiese mit 0-%-Tax. Das ist keine deutsche 19-%-USt-Evidence. |',
      ''
    ].join('\n')
  );
});
