import { expect, test } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { pageText, requireBcUrl, screenshot, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

function reportingEvidencePath(fileName: string) {
  return evidencePath(project.name, 'reporting-001', fileName);
}

async function openFinancialReportsFromTellMe(page: import('@playwright/test').Page) {
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
      return;
    }
  }

  throw new Error('Financial Reports wurde in Tell-Me nicht eindeutig in der Gruppe Berichte und Analysen gefunden.');
}

test('REPORTING-001 Financial Reports read-only erreichen', async ({ page }) => {
  await page.goto(requireBcUrl(project.envPrefix));
  await waitForBusinessCentralShell(page);

  await searchFor(page, 'Financial Reports');
  const tellMeText = await pageText(page);
  await writeTextEvidence(reportingEvidencePath('005-tell-me-financial-reports-page-text.txt'), tellMeText);

  let opened = false;
  let openError: string | undefined;

  try {
    await openFinancialReportsFromTellMe(page);
    opened = true;
  } catch (error) {
    openError = error instanceof Error ? error.message : String(error);
  }

  const financialReportsText = await pageText(page);
  await writeTextEvidence(reportingEvidencePath('010-financial-reports-page-text.txt'), financialReportsText);

  const hasFinancialReportsPage = /Financial Reports|Account Schedules|Kontenschema|Finanzberichte/i.test(financialReportsText);
  const hasFinancialReportListRows = /Balance Sheet|Income Statement|Revenue|Trial Balance/i.test(financialReportsText);
  const hasDimensionFilterContext = /Dimension|Dimensions|PRODUCTLINE|Global Dimension|Budget Filter/i.test(financialReportsText);
  const result = {
    testId: 'REPORTING-001',
    status: opened && hasFinancialReportsPage && hasFinancialReportListRows ? 'labor-page-reached' : 'blocked',
    company: project.defaultCompany,
    environment: 'MCP_1_20260210',
    dataBasis: 'CRONUS USA',
    mode: 'read-only',
    target: {
      bookExpectation:
        'Financial Reports soll spaeter die GuV beziehungsweise Auswertung nach PRODUCTLINE=MACHINE, CHANNEL=B2B und DEPARTMENT=SALES pruefbar machen.',
      currentStep: 'Nur Seiten-Erreichbarkeit und sichtbarer Einstieg in Financial Reports pruefen.'
    },
    actual: {
      tellMeContainsFinancialReports: /Financial Reports/i.test(tellMeText),
      opened,
      openError,
      hasFinancialReportsPage,
      hasFinancialReportListRows,
      hasDimensionFilterContext,
      pageTextContainsProductline: /PRODUCTLINE/i.test(financialReportsText),
      noPostingCommittedByTest: true
    },
    proves: [
      'Der Reporting-Block kann nach dem O2C-Laborbeleg read-only gestartet werden.',
      'Tell-Me liefert einen Financial-Reports-Kontext in der aktuellen CRONUS-USA-Sandbox.',
      'Der Lauf veraendert keine BC-Daten und bucht nichts.'
    ],
    doesNotProve: [
      'Kein deutscher Reporting-Finalnachweis.',
      'Kein Nachweis, dass PRODUCTLINE=MACHINE bereits im Finanzbericht gefiltert oder summiert ist.',
      'Kein 19-Prozent-USt-Nachweis und kein deutscher Kontenplan-Endstand.'
    ],
    nextStep:
      opened && hasFinancialReportsPage
        ? 'Financial Reports maximieren oder passende Berichtskarte waehlen und den Dimensionsfilter fuer PRODUCTLINE=MACHINE suchen.'
        : 'Tell-Me-Treffer fuer Financial Reports genauer disambiguieren oder stabile Page-ID ermitteln.'
  };

  await screenshot(page, 'reporting-001-010-financial-reports.png', {
    projectName: project.name,
    testId: 'reporting-001',
    status: result.status === 'labor-page-reached' ? 'labor' : 'rejected',
    bookUse: 'evidence',
    purpose: 'Erster read-only Labor-Screenshot fuer den Reporting-Block nach O2C: Financial Reports erreichbar machen.',
    knownLimitations: result.doesNotProve
  });

  await writeJsonEvidence(reportingEvidencePath('010-financial-reports-open-result.json'), result);

  expect(result.actual.opened, result.actual.openError).toBe(true);
  expect(result.actual.hasFinancialReportsPage).toBe(true);
  expect(result.actual.hasFinancialReportListRows).toBe(true);
});
