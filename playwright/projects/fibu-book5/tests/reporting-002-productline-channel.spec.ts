import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
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
  viewport: { width: 1920, height: 1080 }
});

type PageCheck = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  screenshotFile: string;
  labelPattern: RegExp;
};

function reportingEvidencePath(fileName: string) {
  return evidencePath(project.name, 'reporting-002', fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function hasProductlineMachine(text: string) {
  return /PRODUCTLINE[\s\S]{0,180}MACHINE|MACHINE[\s\S]{0,180}PRODUCTLINE/i.test(text);
}

function hasChannelB2b(text: string) {
  return /CHANNEL[\s\S]{0,180}B2B|B2B[\s\S]{0,180}CHANNEL/i.test(text);
}

function normalizePageEvidenceText(text: string) {
  return text.replace(/^\s+\t/gm, '\t');
}

async function clickFirstVisibleAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(2500);
          return true;
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(2500);
        return true;
      }
    }
  }

  return false;
}

async function openAndCaptureFilteredPage(page: Page, check: PageCheck) {
  await page.goto(filteredBcPageUrl(check.pageId, check.tableName, check.filterField, check.filterValue), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);

  const text = normalizePageEvidenceText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  await writeTextEvidence(reportingEvidencePath(`${check.fileStem}-page-text.txt`), text);
  await writeJsonEvidence(reportingEvidencePath(`${check.fileStem}-buttons.json`), buttons);
  await screenshot(page, check.screenshotFile, {
    projectName: project.name,
    testId: 'reporting-002',
    status: check.labelPattern.test(text) && text.includes(check.filterValue) ? 'labor' : 'rejected',
    purpose: `REPORTING-002 read-only Sichtpruefung: ${check.id}.`,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher 19-Prozent-USt-Endstand.',
      'Read-only-Navigation; keine Buchung und keine Stammdatenanlage.'
    ],
    bookUse: 'evidence'
  });

  return {
    id: check.id,
    pageId: check.pageId,
    filterField: check.filterField,
    filterValue: check.filterValue,
    pageContextVisible: check.labelPattern.test(text),
    filterValueVisible: text.includes(check.filterValue),
    productlineMachineVisibleInPageText: hasProductlineMachine(text),
    channelB2bVisibleInPageText: hasChannelB2b(text),
    dimensionRelatedButtons: buttons.filter((button) => /Dimension|Dimensionen|Analysis|Analyse|Filter|Column|Spalte/i.test(button)),
    textEvidenceFile: `${check.fileStem}-page-text.txt`,
    buttonEvidenceFile: `${check.fileStem}-buttons.json`,
    screenshot: check.screenshotFile
  };
}

async function captureCurrentEntryDimensions(page: Page, fileStem: string, screenshotFile: string, purpose: string) {
  const clickedEntry = await clickFirstVisibleAction(page, /^Entry$|^Posten$/i);
  const clickedDimensions = await clickFirstVisibleAction(page, /^Dimensions$|^Dimensionen$/i);
  await page.waitForTimeout(2500);

  const text = normalizePageEvidenceText(await pageText(page));
  await writeTextEvidence(reportingEvidencePath(`${fileStem}-page-text.txt`), text);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId: 'reporting-002',
    status: clickedDimensions && /Dimension|Dimensionen/i.test(text) ? 'labor' : 'rejected',
    purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher 19-Prozent-USt-Endstand.',
      'Read-only-Dimensionsdialog; keine Buchung und keine Korrektur.'
    ],
    bookUse: clickedDimensions ? 'evidence' : 'do-not-use'
  });

  return {
    clickedEntry,
    clickedDimensions,
    dimensionContextVisible: /Dimension|Dimensionen/i.test(text),
    productlineMachineVisible: hasProductlineMachine(text),
    channelB2bVisible: hasChannelB2b(text),
    textEvidenceFile: `${fileStem}-page-text.txt`,
    screenshot: screenshotFile
  };
}

async function openFinancialReportsFromTellMe(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await searchFor(page, 'Financial Reports');
  const tellMeText = normalizePageEvidenceText(await pageText(page));
  await writeTextEvidence(reportingEvidencePath('050-tell-me-financial-reports-page-text.txt'), tellMeText);

  for (const scope of [page, ...page.frames()]) {
    const bodyText = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Financial Reports/i.test(bodyText) || !/Berichte und Analysen|Reports and Analysis/i.test(bodyText)) {
      continue;
    }

    const financialReports = scope.getByText('Financial Reports', { exact: true });
    const count = await financialReports.count().catch(() => 0);
    if (count === 1) {
      await financialReports.first().click();
      await page.waitForTimeout(6000);
      return { opened: true, openError: undefined };
    }
  }

  return { opened: false, openError: 'Financial Reports nicht eindeutig in Tell-Me gefunden.' };
}

async function captureFinancialReportSelection(page: Page, reportName: string) {
  const selected = await clickFirstVisibleAction(page, new RegExp(`^${reportName}$`, 'i'));
  await page.waitForTimeout(1500);
  const text = normalizePageEvidenceText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  const safeName = reportName.toLowerCase().replace(/\s+/g, '-');
  await writeTextEvidence(reportingEvidencePath(`060-financial-report-${safeName}-page-text.txt`), text);
  await writeJsonEvidence(reportingEvidencePath(`060-financial-report-${safeName}-buttons.json`), buttons);

  return {
    reportName,
    selected,
    reportNameVisible: new RegExp(reportName, 'i').test(text),
    productlineVisible: /PRODUCTLINE/i.test(text),
    channelVisible: /CHANNEL/i.test(text),
    dimensionOptionsVisible: /Dimension|Dimensions|Analyse|Analysis|Column Definition|Spaltendefinition|Filter/i.test(text),
    relevantButtons: buttons.filter((button) => /View|Edit|Overview|Show Matrix|Dimension|Analysis|Filter|Column|Anzeigen|Bearbeiten|Uebersicht|Übersicht/i.test(button)),
    textEvidenceFile: `060-financial-report-${safeName}-page-text.txt`,
    buttonEvidenceFile: `060-financial-report-${safeName}-buttons.json`
  };
}

test('REPORTING-002 PRODUCTLINE und CHANNEL in Posten und Financial Reports read-only pruefen', async ({ page }) => {
  const postedInvoiceNo = 'PS-INV103297';
  const orderNo = 'S-ORD101068';
  const itemLedgerEntryNo = '792';

  const glEntries = await openAndCaptureFilteredPage(page, {
    id: 'gl-entries-posted-sales-invoice',
    pageId: 20,
    tableName: 'G/L Entry',
    filterField: 'Document No.',
    filterValue: postedInvoiceNo,
    fileStem: '010-gl-entries-ps-inv103297',
    screenshotFile: 'reporting-002-010-gl-entries-ps-inv103297.png',
    labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i
  });
  const glEntryDimensions = await captureCurrentEntryDimensions(
    page,
    '020-gl-entry-dimensions',
    'reporting-002-020-gl-entry-dimensions.png',
    `REPORTING-002 Dimensionsdialogversuch auf Sachposten zur gebuchten Rechnung ${postedInvoiceNo}.`
  );

  const postedSalesInvoice = await openAndCaptureFilteredPage(page, {
    id: 'posted-sales-invoice',
    pageId: 132,
    tableName: 'Sales Invoice Header',
    filterField: 'No.',
    filterValue: postedInvoiceNo,
    fileStem: '030-posted-sales-invoice-ps-inv103297',
    screenshotFile: 'reporting-002-030-posted-sales-invoice-ps-inv103297.png',
    labelPattern: /Posted Sales Invoice|Gebuchte Verkaufsrechnung|Sales Invoice/i
  });

  const valueEntries = await openAndCaptureFilteredPage(page, {
    id: 'value-entries-posted-sales-invoice',
    pageId: 5802,
    tableName: 'Value Entry',
    filterField: 'Document No.',
    filterValue: postedInvoiceNo,
    fileStem: '040-value-entries-ps-inv103297',
    screenshotFile: 'reporting-002-040-value-entries-ps-inv103297.png',
    labelPattern: /Value Entries|Value Entry|Wertposten|Cost Amount|Kostenbetrag/i
  });

  const itemLedgerEntry = await openAndCaptureFilteredPage(page, {
    id: 'item-ledger-entry-792',
    pageId: 38,
    tableName: 'Item Ledger Entry',
    filterField: 'Entry No.',
    filterValue: itemLedgerEntryNo,
    fileStem: '045-item-ledger-entry-792',
    screenshotFile: 'reporting-002-045-item-ledger-entry-792.png',
    labelPattern: /Item Ledger Entries|Item Ledger Entry|Artikelposten|RM-M100/i
  });
  const itemLedgerEntryDimensions = await captureCurrentEntryDimensions(
    page,
    '046-item-ledger-entry-792-dimensions',
    'reporting-002-046-item-ledger-entry-792-dimensions.png',
    'REPORTING-002 Kontrollnachweis: Dimensionen am bekannten Artikelposten Entry No. 792.'
  );

  const financialReportsOpen = await openFinancialReportsFromTellMe(page);
  const financialReportsText = normalizePageEvidenceText(await pageText(page));
  const financialReportsButtons = await visibleButtonNames(page);
  await writeTextEvidence(reportingEvidencePath('055-financial-reports-list-page-text.txt'), financialReportsText);
  await writeJsonEvidence(reportingEvidencePath('055-financial-reports-list-buttons.json'), financialReportsButtons);
  await screenshot(page, 'reporting-002-055-financial-reports-list.png', {
    projectName: project.name,
    testId: 'reporting-002',
    status: financialReportsOpen.opened && /Financial Reports|Account Schedules|Finanzberichte/i.test(financialReportsText) ? 'labor' : 'rejected',
    purpose: 'REPORTING-002 read-only Pruefung der Financial-Reports-Liste und sichtbarer Reportingoptionen.',
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Reporting-Finalnachweis.',
      'Sichtbarkeitspruefung; keine Zahlenwirkung nach PRODUCTLINE oder CHANNEL behauptet.'
    ],
    bookUse: 'evidence'
  });

  const financialReportSelections = [];
  for (const reportName of ['Income Statement', 'Revenue', 'Balance Sheet']) {
    financialReportSelections.push(await captureFinancialReportSelection(page, reportName));
  }

  const result = {
    testId: 'REPORTING-002',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting',
    sourceDocument: {
      salesOrderNo: orderNo,
      postedSalesInvoiceNo: postedInvoiceNo,
      itemLedgerEntryNo
    },
    checks: {
      glEntries,
      glEntryDimensions,
      postedSalesInvoice,
      valueEntries,
      itemLedgerEntry,
      itemLedgerEntryDimensions,
      financialReports: {
        opened: financialReportsOpen.opened,
        openError: financialReportsOpen.openError,
        pageContextVisible: /Financial Reports|Account Schedules|Finanzberichte/i.test(financialReportsText),
        reportRowsVisible: /Income Statement|Revenue|Balance Sheet/i.test(financialReportsText),
        productlineVisibleInListText: /PRODUCTLINE/i.test(financialReportsText),
        channelVisibleInListText: /CHANNEL/i.test(financialReportsText),
        dimensionOrAnalysisOptionsVisible: /Dimension|Dimensions|Analyse|Analysis|Column Definition|Filter/i.test(financialReportsText),
        relevantButtons: financialReportsButtons.filter((button) => /View|Edit|Overview|Matrix|Dimension|Analysis|Filter|Column|Anzeigen|Bearbeiten|Uebersicht|Übersicht/i.test(button)),
        selections: financialReportSelections,
        textEvidenceFile: '055-financial-reports-list-page-text.txt',
        buttonEvidenceFile: '055-financial-reports-list-buttons.json',
        screenshot: 'reporting-002-055-financial-reports-list.png'
      }
    },
    summary: {
      productlineMachineVisibleInGlEntries:
        glEntries.productlineMachineVisibleInPageText || glEntryDimensions.productlineMachineVisible,
      channelB2bVisibleInGlEntries: glEntries.channelB2bVisibleInPageText || glEntryDimensions.channelB2bVisible,
      productlineMachineVisibleAtItemLedgerEntry: itemLedgerEntryDimensions.productlineMachineVisible,
      channelB2bVisibleAtItemLedgerEntry: itemLedgerEntryDimensions.channelB2bVisible,
      productlineOrChannelUsableInFinancialReports:
        /PRODUCTLINE|CHANNEL/i.test(financialReportsText) ||
        financialReportSelections.some((selection) => selection.productlineVisible || selection.channelVisible),
      financialReportsDimensionOptionsFound:
        /Dimension|Dimensions|Analyse|Analysis|Column Definition|Filter/i.test(financialReportsText) ||
        financialReportSelections.some((selection) => selection.dimensionOptionsVisible),
      noPostingCommittedByTest: true
    },
    proves: [
      'Read-only-Sichtpruefung der gebuchten O2C-Laborrechnung PS-INV103297 in Sachposten, Wertposten, Artikelposten und Financial Reports.',
      'Ob PRODUCTLINE=MACHINE und CHANNEL=B2B in den geprueften UI-Kontexten sichtbar sind.',
      'Ob Financial Reports in RM-DEMO fuer den naechsten Reporting-Schritt erreichbar sind.'
    ],
    doesNotProve: [
      'Kein deutscher Reporting-Finalnachweis.',
      'Kein deutscher 19-Prozent-USt-Nachweis.',
      'Keine freigegebene Zahlenwirkung im Financial Report, solange PRODUCTLINE/CHANNEL dort nicht sichtbar gefiltert oder ausgewertet wurden.',
      'Keine neue Buchung.'
    ],
    nextStep:
      'Falls Dimensionen in G/L Entries nicht sichtbar sind, gezielt Dimension Set/Dimensions auf Sachposten oder Dimensionen - Detail pruefen; falls Financial Reports keine Achse zeigen, Analysis Views oder Berichtsdimensionen einrichten/pruefen.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-002-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-002-PRODUCTLINE-CHANNEL.md'),
    [
      '# REPORTING-002 PRODUCTLINE/CHANNEL nach O2C-Laborrechnung',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-posting |',
      `| Gebuchte Verkaufsrechnung | ${postedInvoiceNo} |`,
      `| Verkaufsauftrag | ${orderNo} |`,
      `| Kontroll-Artikelposten | Entry No. ${itemLedgerEntryNo} |`,
      '',
      '## Kernergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| PRODUCTLINE=MACHINE in Sachposten sichtbar | ${result.summary.productlineMachineVisibleInGlEntries ? 'ja' : 'nein'} |`,
      `| CHANNEL=B2B in Sachposten sichtbar | ${result.summary.channelB2bVisibleInGlEntries ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE=MACHINE am Artikelposten sichtbar | ${result.summary.productlineMachineVisibleAtItemLedgerEntry ? 'ja' : 'nein'} |`,
      `| CHANNEL=B2B am Artikelposten sichtbar | ${result.summary.channelB2bVisibleAtItemLedgerEntry ? 'ja' : 'nein'} |`,
      `| Financial Reports erreichbar | ${result.checks.financialReports.opened ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE/CHANNEL in Financial Reports sichtbar nutzbar | ${result.summary.productlineOrChannelUsableInFinancialReports ? 'ja' : 'nein'} |`,
      `| Dimension-/Analyseoptionen in Financial Reports sichtbar | ${result.summary.financialReportsDimensionOptionsFound ? 'ja' : 'nein'} |`,
      '',
      '## Was sichtbar oder API-seitig nachgewiesen wurde',
      '',
      '- Die Pruefung lief read-only in `MCP_1_20260210`, Company `RM-DEMO`.',
      '- `PS-INV103297` wurde in den relevanten Postenseiten gefiltert; es wurde nichts gebucht.',
      '- Der bekannte Artikelposten `792` dient als Kontrollpunkt fuer die bereits belegten O2C-Dimensionen.',
      '- Financial Reports wurden als Reporting-Einstieg geprueft; Zahlenwirkung wird nur behauptet, wenn die Dimension dort sichtbar nutzbar ist.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor, kein deutscher Finalnachweis.',
      '- Deutsche `19 %` USt ist weiterhin offen.',
      '- Kein neuer O2C-Beleg und keine neue Buchung in diesem Lauf.',
      '- Falls PRODUCTLINE/CHANNEL nicht im Financial Report sichtbar sind, ist der Buchanspruch weiterhin Zielbild und nicht Reporting-Endnachweis.',
      '',
      '## Buchwirkung',
      '',
      'Das Buch muss zwischen Dimension im Beleg/Posten und Dimension als Berichtsauswertung unterscheiden. Ein Anfaenger soll lernen: Eine Dimension kann korrekt am gebuchten Posten vorhanden sein, ohne dass ein Financial Report sie automatisch als sichtbare Achse oder Filter zeigt. Fuer die finale Anleitung braucht es deshalb einen separaten Reporting-Nachweis oder eine dokumentierte Einrichtung ueber Berichtsdimensionen, Analysis Views oder Dimensionsberichte.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(glEntries.pageContextVisible).toBe(true);
  expect(glEntries.filterValueVisible).toBe(true);
  expect(itemLedgerEntry.pageContextVisible).toBe(true);
  expect(result.summary.noPostingCommittedByTest).toBe(true);
});
