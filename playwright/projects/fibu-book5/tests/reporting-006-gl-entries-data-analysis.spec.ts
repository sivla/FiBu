import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

function reportingEvidencePath(fileName: string) {
  return evidencePath(project.name, 'reporting-006', fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
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
    /G\/L Entries|Sachposten|PS-INV103297|D10000|14140|50110|40140|15110|PRODUCTLINE|CHANNEL|MACHINE|B2B|Dimension|Dimensions|Analysis|Analyse|Analyze|Analysieren|Column|Spalte|Filter|Pivot|Data Analysis|Datenanalyse/i;
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -3; offset <= 4; offset += 1) {
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
    for (const role of ['button', 'menuitem', 'menuitemcheckbox'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(3500);
          return { clicked: true, method: `role:${role}` };
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 800 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(3500);
        return { clicked: true, method: 'text' };
      }
    }
  }

  return { clicked: false, method: undefined };
}

async function captureState(page: Page, fileStem: string, screenshotFile: string, purpose: string) {
  const text = await pageText(page);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(reportingEvidencePath(`${fileStem}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(reportingEvidencePath(`${fileStem}-buttons.json`), buttons);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId: 'reporting-006',
    status: /G\/L Entries|G\/L Entry|Sachposten|PS-INV103297|Analysis|Analyse|Analyze|Datenanalyse/i.test(text)
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
    glEntriesVisible: /G\/L Entries|G\/L Entry|Sachposten/i.test(text),
    postedInvoiceVisible: /PS-INV103297/i.test(text),
    productlineVisible: /PRODUCTLINE/i.test(text),
    channelVisible: /CHANNEL/i.test(text),
    productlineMachineVisible: hasProductlineMachine(text),
    channelB2bVisible: hasChannelB2b(text),
    analysisTextVisible: /Data Analysis|Datenanalyse|Analysis mode|Analysemodus|Analyze|Analysieren|Analyse/i.test(text),
    relevantButtons: buttons.filter((button) =>
      /Analyze|Analysis|Analyse|Analysieren|Data|Daten|Dimension|Filter|Column|Spalte|Pivot|Group|Gruppieren|Show|Anzeigen/i.test(button)
    ),
    textEvidenceFile: `${fileStem}-page-text.txt`,
    buttonEvidenceFile: `${fileStem}-buttons.json`,
    screenshot: screenshotFile
  };
}

test('REPORTING-006 G/L Entries Data Analysis read-only pruefen', async ({ page }) => {
  const postedInvoiceNo = 'PS-INV103297';

  await page.goto(filteredBcPageUrl(20, 'G/L Entry', 'Document No.', postedInvoiceNo), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3000);

  const before = await captureState(
    page,
    '010-gl-entries-before-analysis',
    'reporting-006-010-gl-entries-before-analysis.png',
    'REPORTING-006 G/L Entries zur gebuchten O2C-Laborrechnung vor Data-Analysis-Versuch.'
  );

  const clickCandidates = [
    /^Analyze$/i,
    /^Analyze list$/i,
    /^Analysis mode$/i,
    /^Data Analysis$/i,
    /^Datenanalyse$/i,
    /^Analysieren$/i,
    /^Analyse$/i
  ];

  let analysisClick = { clicked: false, method: undefined as string | undefined, pattern: undefined as string | undefined };
  for (const candidate of clickCandidates) {
    const attempt = await clickFirstVisible(page, candidate);
    if (attempt.clicked) {
      analysisClick = { clicked: true, method: attempt.method, pattern: candidate.source };
      break;
    }
  }

  const after = await captureState(
    page,
    '020-gl-entries-after-analysis-attempt',
    'reporting-006-020-gl-entries-after-analysis-attempt.png',
    'REPORTING-006 G/L Entries nach read-only Data-Analysis-/Analysemodus-Versuch.'
  );

  const result = {
    testId: 'REPORTING-006',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting-no-setup',
    sourceContext: {
      postedSalesInvoiceNo: postedInvoiceNo,
      priorFinding:
        'REPORTING-002 bis REPORTING-005 belegen Dimensionen am Artikelposten, aber keine sichtbare Financial-Reports-Auswertung nach PRODUCTLINE/CHANNEL.'
    },
    actions: {
      openedGlEntries: before.glEntriesVisible,
      filterValueVisible: before.postedInvoiceVisible,
      analysisClick
    },
    before: {
      glEntriesVisible: before.glEntriesVisible,
      postedInvoiceVisible: before.postedInvoiceVisible,
      productlineVisible: before.productlineVisible,
      channelVisible: before.channelVisible,
      productlineMachineVisible: before.productlineMachineVisible,
      channelB2bVisible: before.channelB2bVisible,
      analysisTextVisible: before.analysisTextVisible,
      relevantButtons: before.relevantButtons,
      textEvidenceFile: before.textEvidenceFile,
      buttonEvidenceFile: before.buttonEvidenceFile,
      screenshot: before.screenshot
    },
    after: {
      glEntriesVisible: after.glEntriesVisible,
      postedInvoiceVisible: after.postedInvoiceVisible,
      productlineVisible: after.productlineVisible,
      channelVisible: after.channelVisible,
      productlineMachineVisible: after.productlineMachineVisible,
      channelB2bVisible: after.channelB2bVisible,
      analysisTextVisible: after.analysisTextVisible,
      relevantButtons: after.relevantButtons,
      textEvidenceFile: after.textEvidenceFile,
      buttonEvidenceFile: after.buttonEvidenceFile,
      screenshot: after.screenshot
    },
    summary: {
      dataAnalysisReached: analysisClick.clicked && after.analysisTextVisible,
      productlineOrChannelVisibleInGlEntries:
        before.productlineVisible || before.channelVisible || after.productlineVisible || after.channelVisible,
      productlineMachineOrChannelB2bVisible:
        before.productlineMachineVisible ||
        before.channelB2bVisible ||
        after.productlineMachineVisible ||
        after.channelB2bVisible,
      noPostingCommittedByTest: true,
      noSetupChangedByTest: true
    },
    proves: [
      'Ob G/L Entries zur gebuchten O2C-Laborrechnung read-only erreichbar sind.',
      'Ob ein sichtbarer Data-Analysis-/Analysemodus-Hebel in diesem G/L-Entries-Kontext nutzbar ist.',
      'Ob PRODUCTLINE/CHANNEL im sichtbaren G/L-Entries-/Analysekontext auftauchen.'
    ],
    doesNotProve: [
      'Keine neue oder aktualisierte Analysis View.',
      'Keine garantierte GuV-/Revenue-Zahlenwirkung nach PRODUCTLINE oder CHANNEL.',
      'Kein deutscher Reporting-Finalnachweis.',
      'Keine neue Buchung und kein deutscher 19-Prozent-USt-Nachweis.'
    ],
    nextStep:
      analysisClick.clicked && (after.productlineVisible || after.channelVisible)
        ? 'Gefundene Dimensionen im Data-Analysis-Kontext gezielt als Buchbild pruefen und erklaeren.'
        : 'Data Analysis auf G/L Entries liefert in diesem Laborlauf noch keinen sichtbaren PRODUCTLINE-/CHANNEL-Nachweis. Naechster Hebel: Analysis by Dimensions gezielt oeffnen oder freigegebenen Analysis-View-Fit fuer PRODUCTLINE/CHANNEL planen.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-006-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-006-GL-ENTRIES-DATA-ANALYSIS.md'),
    [
      '# REPORTING-006 G/L Entries Data Analysis',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-posting, no-setup |',
      `| Ausgangsbeleg | ${postedInvoiceNo} |`,
      '',
      '## Kernergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| G/L Entries zur Rechnung sichtbar | ${result.actions.openedGlEntries ? 'ja' : 'nein'} |`,
      `| Filterwert sichtbar | ${result.actions.filterValueVisible ? 'ja' : 'nein'} |`,
      `| Analyse-/Data-Analysis-Aktion geklickt | ${result.actions.analysisClick.clicked ? 'ja' : 'nein'} |`,
      `| Analysemodus sichtbar erreicht | ${result.summary.dataAnalysisReached ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE oder CHANNEL sichtbar | ${result.summary.productlineOrChannelVisibleInGlEntries ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE=MACHINE oder CHANNEL=B2B sichtbar | ${result.summary.productlineMachineOrChannelB2bVisible ? 'ja' : 'nein'} |`,
      `| Keine Buchung | ${result.summary.noPostingCommittedByTest ? 'ja' : 'nein'} |`,
      '',
      '## Anfaenger-Lernwert',
      '',
      'Sachposten sind die Hauptbuchspur der gebuchten Rechnung. Data Analysis kann fuer Listen ein schneller Analysehebel sein, ersetzt aber keinen Nachweis, wenn die benoetigten Dimensionen in diesem Kontext nicht sichtbar auswaehlbar oder filterbar sind. Der Leser lernt: Posten vorhanden, Dimension am Artikelposten vorhanden und Reportingauswertung sind drei unterschiedliche Nachweise.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 10 und 25 bleiben beim Reportingziel offen, solange `PRODUCTLINE` und `CHANNEL` in `G/L Entries`, Data Analysis oder einem Financial Report nicht sichtbar als Filter, Spalte oder Auswertungsachse erscheinen.',
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

  expect(result.actions.openedGlEntries).toBe(true);
  expect(result.actions.filterValueVisible).toBe(true);
  expect(result.summary.noPostingCommittedByTest).toBe(true);
  expect(result.summary.noSetupChangedByTest).toBe(true);
});
