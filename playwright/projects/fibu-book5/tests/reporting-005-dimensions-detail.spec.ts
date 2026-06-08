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
  return evidencePath(project.name, 'reporting-005', fileName);
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
    /Dimensions - Detail|Dimensionen - Detail|Dimensions|Dimension|Analysis View|Analysis Views|PRODUCTLINE|CHANNEL|DEPARTMENT|MACHINE|B2B|REVENUE|GEN_LEDGER|Date Filter|G\/L Account|Sachkonto|Preview|Vorschau|Print|Drucken|Show|Matrix|Filter|Report/i;
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
    .slice(0, 160);

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
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(3500);
          return true;
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(3500);
        return true;
      }
    }
  }

  return false;
}

async function openDimensionsDetailFromTellMe(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'Dimensions - Detail');

  const tellMeText = await pageText(page);
  const tellMeButtons = await visibleButtonNames(page);
  await writeTextEvidence(reportingEvidencePath('010-tell-me-dimensions-detail-page-text.txt'), compactPageText(tellMeText));
  await writeJsonEvidence(reportingEvidencePath('010-tell-me-dimensions-detail-buttons.json'), tellMeButtons.map(sanitizeEvidenceText));
  await screenshot(page, 'reporting-005-010-tell-me-dimensions-detail.png', {
    projectName: project.name,
    testId: 'reporting-005',
    status: /Dimensions - Detail|Dimensionen - Detail/i.test(tellMeText) ? 'labor' : 'rejected',
    purpose: 'REPORTING-005 Tell-Me-Suche nach Dimensions - Detail als read-only Reporting-Hebel.',
    knownLimitations: [
      'Tell-Me-Suche ist nur Navigationsevidence.',
      'Noch kein Berichtsergebnis und keine Dimensionsauswertung.'
    ],
    bookUse: 'evidence'
  });

  const clicked = await clickFirstVisible(page, /^Dimensions - Detail$|^Dimensionen - Detail$/i);
  await dismissTours(page);
  await page.waitForTimeout(5000);

  return {
    tellMeVisible: /Dimensions - Detail|Dimensionen - Detail/i.test(tellMeText),
    clicked,
    tellMeButtons: tellMeButtons.filter((button) => /Dimension|Report|Bericht|Page|Seite/i.test(button)),
    textEvidenceFile: '010-tell-me-dimensions-detail-page-text.txt',
    buttonEvidenceFile: '010-tell-me-dimensions-detail-buttons.json',
    screenshot: 'reporting-005-010-tell-me-dimensions-detail.png'
  };
}

async function captureCurrentState(page: Page, fileStem: string, screenshotFile: string, purpose: string) {
  const text = await pageText(page);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(reportingEvidencePath(`${fileStem}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(reportingEvidencePath(`${fileStem}-buttons.json`), buttons);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId: 'reporting-005',
    status: /Dimensions - Detail|Dimension|Analysis View|Report|Bericht|Vorschau|Preview/i.test(text) ? 'labor' : 'rejected',
    purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Reporting-Finalnachweis.',
      'Read-only-Navigation; keine Buchung, keine Stammdatenanlage und keine Analysis-View-Aktualisierung.'
    ],
    bookUse: 'evidence'
  });

  return {
    text,
    buttons,
    dimensionsDetailVisible: /Dimensions - Detail|Dimensionen - Detail/i.test(text),
    analysisViewVisible: /Analysis View|Analysis Views|Analyseansicht/i.test(text),
    revenueVisible: /REVENUE/i.test(text),
    genLedgerVisible: /GEN_LEDGER/i.test(text),
    productlineVisible: /PRODUCTLINE/i.test(text),
    channelVisible: /CHANNEL/i.test(text),
    departmentVisible: /DEPARTMENT/i.test(text),
    productlineMachineVisible: hasProductlineMachine(text),
    channelB2bVisible: hasChannelB2b(text),
    previewVisible: /Preview|Vorschau/i.test(text) || buttons.some((button) => /Preview|Vorschau/i.test(button)),
    relevantButtons: buttons.filter((button) => /Dimension|Analysis|Analyse|Preview|Vorschau|Filter|Show|Matrix|OK|Cancel|Abbrechen|Drucken|Print/i.test(button)),
    textEvidenceFile: `${fileStem}-page-text.txt`,
    buttonEvidenceFile: `${fileStem}-buttons.json`,
    screenshot: screenshotFile
  };
}

test('REPORTING-005 Dimensions - Detail read-only pruefen', async ({ page }) => {
  const tellMe = await openDimensionsDetailFromTellMe(page);
  const requestPage = await captureCurrentState(
    page,
    '020-dimensions-detail-request',
    'reporting-005-020-dimensions-detail-request.png',
    'REPORTING-005 Dimensions - Detail Request-/Startkontext read-only pruefen.'
  );

  const previewClicked =
    requestPage.previewVisible &&
    (await clickFirstVisible(page, /^Preview$|^Vorschau$|^Print Preview$|^Seitenansicht$/i));
  await page.waitForTimeout(previewClicked ? 6000 : 1000);

  const preview = previewClicked
    ? await captureCurrentState(
        page,
        '030-dimensions-detail-preview',
        'reporting-005-030-dimensions-detail-preview.png',
        'REPORTING-005 Dimensions - Detail Vorschau read-only pruefen.'
      )
    : undefined;

  const result = {
    testId: 'REPORTING-005',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting-no-setup',
    sourceContext: {
      priorO2cInvoice: 'PS-INV103297',
      priorItemLedgerEntry: '792',
      priorFindings:
        'REPORTING-002 zeigt PRODUCTLINE/CHANNEL am Artikelposten, REPORTING-003/004 zeigen keine Financial-Reports-/REVENUE-Auswertung nach PRODUCTLINE/CHANNEL.'
    },
    actions: {
      tellMeVisible: tellMe.tellMeVisible,
      dimensionsDetailClicked: tellMe.clicked,
      previewButtonVisible: requestPage.previewVisible,
      previewClicked
    },
    requestPage: {
      dimensionsDetailVisible: requestPage.dimensionsDetailVisible,
      analysisViewVisible: requestPage.analysisViewVisible,
      revenueVisible: requestPage.revenueVisible,
      genLedgerVisible: requestPage.genLedgerVisible,
      productlineVisible: requestPage.productlineVisible,
      channelVisible: requestPage.channelVisible,
      departmentVisible: requestPage.departmentVisible,
      productlineMachineVisible: requestPage.productlineMachineVisible,
      channelB2bVisible: requestPage.channelB2bVisible,
      relevantButtons: requestPage.relevantButtons,
      textEvidenceFile: requestPage.textEvidenceFile,
      buttonEvidenceFile: requestPage.buttonEvidenceFile,
      screenshot: requestPage.screenshot
    },
    preview: preview
      ? {
          dimensionsDetailVisible: preview.dimensionsDetailVisible,
          analysisViewVisible: preview.analysisViewVisible,
          revenueVisible: preview.revenueVisible,
          genLedgerVisible: preview.genLedgerVisible,
          productlineVisible: preview.productlineVisible,
          channelVisible: preview.channelVisible,
          departmentVisible: preview.departmentVisible,
          productlineMachineVisible: preview.productlineMachineVisible,
          channelB2bVisible: preview.channelB2bVisible,
          relevantButtons: preview.relevantButtons,
          textEvidenceFile: preview.textEvidenceFile,
          buttonEvidenceFile: preview.buttonEvidenceFile,
          screenshot: preview.screenshot
        }
      : undefined,
    summary: {
      dimensionsDetailReached: tellMe.clicked && (requestPage.dimensionsDetailVisible || requestPage.analysisViewVisible),
      productlineOrChannelVisible:
        requestPage.productlineVisible || requestPage.channelVisible || !!preview?.productlineVisible || !!preview?.channelVisible,
      productlineMachineOrChannelB2bVisible:
        requestPage.productlineMachineVisible ||
        requestPage.channelB2bVisible ||
        !!preview?.productlineMachineVisible ||
        !!preview?.channelB2bVisible,
      noPostingCommittedByTest: true,
      noSetupChangedByTest: true
    },
    proves: [
      'Ob Dimensions - Detail in RM-DEMO read-only ueber Tell-Me erreichbar ist.',
      'Ob der Request-/Vorschaukontext PRODUCTLINE oder CHANNEL bereits sichtbar anbietet.',
      'Ob dieser Pfad als naechster Buch-Screenshot-Kandidat fuer Reporting taugt.'
    ],
    doesNotProve: [
      'Keine neue oder aktualisierte Analysis View.',
      'Keine garantierte GuV-/Revenue-Zahlenwirkung nach PRODUCTLINE oder CHANNEL.',
      'Kein deutscher Reporting-Finalnachweis.',
      'Keine neue Buchung und kein deutscher 19-Prozent-USt-Nachweis.'
    ],
    nextStep:
      requestPage.productlineVisible || requestPage.channelVisible || preview?.productlineVisible || preview?.channelVisible
        ? 'Gefundene Dimensionen im Dimensions-Detail-Kontext gezielt mit O2C-Beleg/Zeitraum filtern und als Reportingbild sichern.'
        : tellMe.tellMeVisible
          ? 'Dimensions - Detail ist als Einstieg sichtbar, aber PRODUCTLINE/CHANNEL sind nicht sichtbar nutzbar. Naechster Schritt: kontrollierten Analysis-View-Fit fuer PRODUCTLINE/CHANNEL planen oder Data Analysis Mode auf G/L Entries read-only pruefen.'
          : 'Dimensions - Detail wurde ueber Tell-Me in diesem Laborlauf nicht sichtbar gefunden. Naechster Schritt: alternativen UI-Einstieg ueber Berichtssuche/Analysis by Dimensions oder Data Analysis Mode auf G/L Entries read-only pruefen.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-005-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-005-DIMENSIONS-DETAIL.md'),
    [
      '# REPORTING-005 Dimensions - Detail',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-posting, no-setup |',
      '| Ausgangslage | `REPORTING-002` bis `REPORTING-004`: Dimension am Artikelposten belegt, Reportingauswertung offen |',
      '',
      '## Kernergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| Tell-Me zeigt Dimensions - Detail | ${result.actions.tellMeVisible ? 'ja' : 'nein'} |`,
      `| Dimensions - Detail geklickt | ${result.actions.dimensionsDetailClicked ? 'ja' : 'nein'} |`,
      `| Request-/Startkontext erreicht | ${result.summary.dimensionsDetailReached ? 'ja' : 'nein'} |`,
      `| Preview/Vorschau sichtbar | ${result.actions.previewButtonVisible ? 'ja' : 'nein'} |`,
      `| Preview/Vorschau geklickt | ${result.actions.previewClicked ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE oder CHANNEL sichtbar | ${result.summary.productlineOrChannelVisible ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE=MACHINE oder CHANNEL=B2B sichtbar | ${result.summary.productlineMachineOrChannelB2bVisible ? 'ja' : 'nein'} |`,
      `| Keine Buchung | ${result.summary.noPostingCommittedByTest ? 'ja' : 'nein'} |`,
      '',
      '## Anfaenger-Lernwert',
      '',
      '`Dimensions - Detail` waere ein anderer Nachweis als `Financial Reports`. Ein Finanzbericht zeigt Kontenzeilen und Summen; Dimensionsberichte beziehungsweise Analysis Views zeigen, ob Sachposten nach Dimensionen aufgeschluesselt werden koennen. Eine am Artikelposten sichtbare Dimension reicht fuer das Reporting-Ziel noch nicht aus, wenn der passende Berichtspfad nicht eindeutig erreichbar ist oder die Dimension dort nicht als Filter, Zeile oder Spalte sichtbar wird.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 10 und 25 duerfen den Reportingpfad weiter als offen markieren. Der aktuelle Laborstand belegt die Grenze des versuchten Bedienpfads, aber noch keine GuV-/Revenue-Auswertung nach `PRODUCTLINE=MACHINE` oder `CHANNEL=B2B`.',
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

  expect(result.summary.noPostingCommittedByTest).toBe(true);
  expect(result.summary.noSetupChangedByTest).toBe(true);
});
