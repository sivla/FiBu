import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
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

function reportingEvidencePath(fileName: string) {
  return evidencePath(project.name, 'reporting-007', fileName);
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/\u00c3\u0152/g, 'Ue')
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u2013/g, 'Oe')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u201e/g, 'Ae')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u0178/g, 'ss')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(text: string) {
  const interesting =
    /Analysis by Dimensions|Analyse nach Dimensionen|Analysis View|Analysis Views|Analyseansicht|Dimensions|Dimension|PRODUCTLINE|CHANNEL|DEPARTMENT|MACHINE|B2B|REVENUE|GEN_LEDGER|Date Filter|G\/L Account|Sachkonto|Show Matrix|Matrix|Filter|Update|Aktualisieren|Preview|Vorschau|Report|Bericht|Pages and Tasks|Seiten und Aufgaben/i;
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -3; offset <= 5; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
    }
  }

  const excerpt = [...selected]
    .sort((left, right) => left - right)
    .map((index) => lines[index])
    .slice(0, 180);

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...excerpt
  ].join('\n'));
}

function hasProductlineMachine(text: string) {
  return /PRODUCTLINE[\s\S]{0,260}MACHINE|MACHINE[\s\S]{0,260}PRODUCTLINE/i.test(text);
}

function hasChannelB2b(text: string) {
  return /CHANNEL[\s\S]{0,260}B2B|B2B[\s\S]{0,260}CHANNEL/i.test(text);
}

async function clickFirstVisible(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'option', 'link'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(5000);
          return { clicked: true, method: `role:${role}` };
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(5000);
        return { clicked: true, method: 'text' };
      }
    }
  }

  return { clicked: false, method: undefined as string | undefined };
}

async function captureState(page: Page, fileStem: string, screenshotFile: string, purpose: string) {
  const text = await pageText(page);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(reportingEvidencePath(`${fileStem}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(reportingEvidencePath(`${fileStem}-buttons.json`), buttons);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId: 'reporting-007',
    status: /Analysis by Dimensions|Analyse nach Dimensionen|Analysis View|Dimensions|Dimension|REVENUE|GEN_LEDGER/i.test(text)
      ? 'labor'
      : 'rejected',
    purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Reporting-Finalnachweis.',
      'Read-only-Navigation; keine Buchung, kein Setup und keine Analysis-View-Aktualisierung.'
    ],
    bookUse: 'evidence'
  });

  return {
    text,
    buttons,
    analysisByDimensionsVisible: /Analysis by Dimensions|Analyse nach Dimensionen/i.test(text),
    analysisViewVisible: /Analysis View|Analysis Views|Analyseansicht/i.test(text),
    revenueVisible: /REVENUE/i.test(text),
    genLedgerVisible: /GEN_LEDGER/i.test(text),
    productlineVisible: /PRODUCTLINE/i.test(text),
    channelVisible: /CHANNEL/i.test(text),
    departmentVisible: /DEPARTMENT/i.test(text),
    productlineMachineVisible: hasProductlineMachine(text),
    channelB2bVisible: hasChannelB2b(text),
    showMatrixVisible: /Show Matrix|Matrix anzeigen|Matrix/i.test(text) || buttons.some((button) => /Show Matrix|Matrix anzeigen|Matrix/i.test(button)),
    dateFilterVisible: /Date Filter|Datumsfilter|Posting Date|Buchungsdatum/i.test(text),
    relevantButtons: buttons.filter((button) =>
      /Analysis|Analyse|Dimension|Filter|Update|Aktualisieren|Matrix|Show|Anzeigen|OK|Preview|Vorschau|Cancel|Abbrechen/i.test(button)
    ),
    textEvidenceFile: `${fileStem}-page-text.txt`,
    buttonEvidenceFile: `${fileStem}-buttons.json`,
    screenshot: screenshotFile
  };
}

async function openAnalysisByDimensionsFromTellMe(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'Analysis by Dimensions');
  await page.waitForTimeout(1500);

  const tellMe = await captureState(
    page,
    '010-tell-me-analysis-by-dimensions',
    'reporting-007-010-tell-me-analysis-by-dimensions.png',
    'REPORTING-007 Tell-Me-Suche nach Analysis by Dimensions als gezielter read-only Reporting-Hebel.'
  );

  const clicked = await clickFirstVisible(page, /^Analysis by Dimensions$|^Analyse nach Dimensionen$/i);
  await dismissTours(page);
  await page.waitForTimeout(5000);

  return {
    ...tellMe,
    clicked
  };
}

test('REPORTING-007 Analysis by Dimensions read-only pruefen', async ({ page }) => {
  const tellMe = await openAnalysisByDimensionsFromTellMe(page);
  const requestOrResult = await captureState(
    page,
    '020-analysis-by-dimensions-result',
    'reporting-007-020-analysis-by-dimensions-result.png',
    'REPORTING-007 Analysis by Dimensions Ziel-/Request-/Ergebniszustand read-only pruefen.'
  );

  const result = {
    testId: 'REPORTING-007',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting-no-setup',
    sourceContext: {
      postedSalesInvoiceNo: 'PS-INV103297',
      itemLedgerEntryNo: '792',
      priorFinding:
        'REPORTING-002 bis REPORTING-006 belegen PRODUCTLINE/CHANNEL am Artikelposten, aber keine sichtbare Reportingauswertung.'
    },
    actions: {
      tellMeAnalysisByDimensionsVisible: tellMe.analysisByDimensionsVisible,
      clickedAnalysisByDimensions: tellMe.clicked.clicked,
      clickMethod: tellMe.clicked.method
    },
    tellMe: {
      analysisByDimensionsVisible: tellMe.analysisByDimensionsVisible,
      analysisViewVisible: tellMe.analysisViewVisible,
      productlineVisible: tellMe.productlineVisible,
      channelVisible: tellMe.channelVisible,
      relevantButtons: tellMe.relevantButtons,
      textEvidenceFile: tellMe.textEvidenceFile,
      buttonEvidenceFile: tellMe.buttonEvidenceFile,
      screenshot: tellMe.screenshot
    },
    resultState: {
      analysisByDimensionsVisible: requestOrResult.analysisByDimensionsVisible,
      analysisViewVisible: requestOrResult.analysisViewVisible,
      revenueVisible: requestOrResult.revenueVisible,
      genLedgerVisible: requestOrResult.genLedgerVisible,
      productlineVisible: requestOrResult.productlineVisible,
      channelVisible: requestOrResult.channelVisible,
      departmentVisible: requestOrResult.departmentVisible,
      productlineMachineVisible: requestOrResult.productlineMachineVisible,
      channelB2bVisible: requestOrResult.channelB2bVisible,
      showMatrixVisible: requestOrResult.showMatrixVisible,
      dateFilterVisible: requestOrResult.dateFilterVisible,
      relevantButtons: requestOrResult.relevantButtons,
      textEvidenceFile: requestOrResult.textEvidenceFile,
      buttonEvidenceFile: requestOrResult.buttonEvidenceFile,
      screenshot: requestOrResult.screenshot
    },
    summary: {
      analysisByDimensionsReached:
        tellMe.clicked.clicked && (requestOrResult.analysisByDimensionsVisible || requestOrResult.analysisViewVisible),
      targetDimensionsVisible: requestOrResult.productlineVisible || requestOrResult.channelVisible,
      targetDimensionValuesVisible: requestOrResult.productlineMachineVisible || requestOrResult.channelB2bVisible,
      matrixOrReportActionVisible: requestOrResult.showMatrixVisible,
      noPostingCommittedByTest: true,
      noSetupChangedByTest: true
    },
    proves: [
      'Ob Analysis by Dimensions in RM-DEMO ueber Tell-Me gezielt erreichbar ist.',
      'Ob der Ziel-/Request-/Ergebniszustand PRODUCTLINE oder CHANNEL sichtbar anbietet.',
      'Ob dieser Pfad ein belastbarer Buchbildkandidat fuer O2C-Reporting ist.'
    ],
    doesNotProve: [
      'Keine neue oder aktualisierte Analysis View.',
      'Keine garantierte GuV-/Revenue-Zahlenwirkung nach PRODUCTLINE oder CHANNEL.',
      'Kein deutscher Reporting-Finalnachweis.',
      'Keine neue Buchung und kein deutscher 19-Prozent-USt-Nachweis.'
    ],
    nextStep:
      requestOrResult.productlineVisible || requestOrResult.channelVisible
        ? 'Gefundene PRODUCTLINE-/CHANNEL-Felder gezielt mit O2C-Beleg/Zeitraum pruefen und Matrix-/Berichtbild sichern.'
        : tellMe.clicked.clicked
          ? 'Analysis by Dimensions wurde angeklickt, liefert aber noch keine sichtbaren PRODUCTLINE-/CHANNEL-Felder. Naechster Hebel: kontrolliert klaeren, ob eine Analysis View fuer PRODUCTLINE/CHANNEL eingerichtet und aktualisiert werden muss.'
          : 'Analysis by Dimensions wurde in diesem Laborlauf nicht belastbar geoeffnet. Naechster Hebel bleibt kontrollierter Analysis-View-Fit oder alternativer offizieller Reporting-Einstieg.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-007-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-007-ANALYSIS-BY-DIMENSIONS.md'),
    [
      '# REPORTING-007 Analysis by Dimensions',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-posting, no-setup |',
      '| Ausgangslage | `REPORTING-002` bis `REPORTING-006`: Dimension am Artikelposten belegt, Reportingauswertung offen |',
      '',
      '## Kernergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| Tell-Me zeigt Analysis by Dimensions | ${result.actions.tellMeAnalysisByDimensionsVisible ? 'ja' : 'nein'} |`,
      `| Analysis by Dimensions geklickt | ${result.actions.clickedAnalysisByDimensions ? 'ja' : 'nein'} |`,
      `| Ziel-/Request-/Ergebniszustand erreicht | ${result.summary.analysisByDimensionsReached ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE oder CHANNEL sichtbar | ${result.summary.targetDimensionsVisible ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE=MACHINE oder CHANNEL=B2B sichtbar | ${result.summary.targetDimensionValuesVisible ? 'ja' : 'nein'} |`,
      `| Matrix-/Berichtsaktion sichtbar | ${result.summary.matrixOrReportActionVisible ? 'ja' : 'nein'} |`,
      `| Keine Buchung | ${result.summary.noPostingCommittedByTest ? 'ja' : 'nein'} |`,
      '',
      '## Anfaenger-Lernwert',
      '',
      '`Analysis by Dimensions` ist nicht dasselbe wie ein normaler Finanzbericht und auch nicht dasselbe wie ein Sachpostenfilter. Der Pfad ist nur dann ein Buchnachweis, wenn dort die richtigen Dimensionen sichtbar als Analyseachse, Filter oder Matrixkontext verwendet werden koennen.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 10 und 25 bleiben beim Ziel `GuV/Revenue nach PRODUCTLINE und CHANNEL` offen, solange `Analysis by Dimensions` oder eine passende Analysis View die Ziel-Dimensionen nicht sichtbar anbietet.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
      '- Keine Buchung, keine Stammdatenanlage und keine Analysis-View-Aktualisierung.',
      '- Deutsche `19 %` USt bleibt offen.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  await writeTextEvidence(
    reportingEvidencePath('README.md'),
    [
      '# REPORTING-007 Evidence Index',
      '',
      'Ziel: Read-only pruefen, ob `Analysis by Dimensions` als offizieller Dimensionsanalysepfad in `RM-DEMO` fuer `PRODUCTLINE`/`CHANNEL` sichtbar nutzbar ist.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `REPORTING-007-result.json` | JSON-Ergebnis | Sandbox, Company, Klickversuch, sichtbare Ziel-/Dimensionsfelder, keine Buchung und kein Setup | keine Analysis-View-Aktualisierung, keine GuV-Zahlenwirkung | labor, read-only |',
      '| `REPORTING-007-ANALYSIS-BY-DIMENSIONS.md` | Lernzusammenfassung | warum Analysis by Dimensions ein eigener Reportingnachweis ist | keinen deutschen Finalreport | labor-negativ oder labor-kandidat |',
      '| `010-tell-me-analysis-by-dimensions-page-text.txt` | Seitentext | Tell-Me-/Navigationskontext | keinen Berichtsnachweis | raw-text-evidence |',
      '| `010-tell-me-analysis-by-dimensions-buttons.json` | Button-Evidence | sichtbare Aktionen im Suchkontext | keine Zahlenwirkung | raw-ui-evidence |',
      '| `020-analysis-by-dimensions-result-page-text.txt` | Seitentext | Ziel-/Request-/Ergebniszustand nach Klickversuch | keine finale GuV-Auswertung | raw-text-evidence |',
      '| `020-analysis-by-dimensions-result-buttons.json` | Button-Evidence | sichtbare Aktionen nach Klickversuch | keine Buchung, kein Setup | raw-ui-evidence |',
      '| `../img/reporting-007-010-tell-me-analysis-by-dimensions.png` | Screenshot | Such-/Navigationsbild | keinen Reportingbeweis | labor-candidate |',
      '| `../img/reporting-007-020-analysis-by-dimensions-result.png` | Screenshot | Zustand nach Klickversuch | nur als Reportingbeweis nutzbar, wenn Ziel-Dimensionen sichtbar sind | labor-candidate/rejected |',
      '',
      '## Kernaussage',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.summary.noPostingCommittedByTest).toBe(true);
  expect(result.summary.noSetupChangedByTest).toBe(true);
});
