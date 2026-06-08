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
  return evidencePath(project.name, 'reporting-004', fileName);
}

function normalizePageEvidenceText(text: string) {
  return text.replace(/^\s+\t/gm, '\t');
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
    .replace(/\u00e2\u02c6\u2122/g, '*')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(text: string) {
  const interesting =
    /Analysis Views|Analysis View|Analysis by Dimensions|Dimensions - Detail|Dimension|PRODUCTLINE|CHANNEL|DEPARTMENT|MACHINE|B2B|G\/L Account|Filter|Show Matrix|Update|Financial Reports|Berichte und Analysen|Pages and Tasks|Seiten und Aufgaben|Don't show this again/i;
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -2; offset <= 3; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
    }
  }

  const excerpt = [...selected]
    .sort((left, right) => left - right)
    .map((index) => lines[index])
    .slice(0, 140);

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...excerpt
  ].join('\n'));
}

function hasProductlineMachine(text: string) {
  return /PRODUCTLINE[\s\S]{0,240}MACHINE|MACHINE[\s\S]{0,240}PRODUCTLINE/i.test(text);
}

function hasChannelB2b(text: string) {
  return /CHANNEL[\s\S]{0,240}B2B|B2B[\s\S]{0,240}CHANNEL/i.test(text);
}

async function clickFirstVisible(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(2500);
          return true;
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(2500);
        return true;
      }
    }
  }

  return false;
}

async function clickVisibleTextByMouse(page: Page, text: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const matches = scope.getByText(text);
    const count = await matches.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const match = matches.nth(index);
      if (!(await match.isVisible({ timeout: 500 }).catch(() => false))) {
        continue;
      }

      const box = await match.boundingBox().catch(() => null);
      if (!box || box.width <= 0 || box.height <= 0) {
        continue;
      }

      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1500);
      return true;
    }
  }

  return false;
}

async function openAnalysisViewsFromTellMe(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'Analysis Views');

  const tellMeText = normalizePageEvidenceText(await pageText(page));
  await writeTextEvidence(reportingEvidencePath('010-tell-me-analysis-views-page-text.txt'), compactPageText(tellMeText));

  for (const scope of [page, ...page.frames()]) {
    const bodyText = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Analysis Views/i.test(bodyText) || !/Seiten und Aufgaben|Pages and Tasks|Berichte und Analysen|Reports and Analysis/i.test(bodyText)) {
      continue;
    }

    const analysisViews = scope.getByText('Analysis Views', { exact: true });
    const count = await analysisViews.count().catch(() => 0);
    if (count >= 1) {
      await analysisViews.first().click();
      await page.waitForTimeout(6000);
      await dismissTours(page);
      return { opened: true, openError: undefined, tellMeMatchCount: count };
    }
  }

  return {
    opened: false,
    openError: 'Analysis Views wurde in Tell-Me nicht eindeutig in einer Seiten-/Aufgabengruppe gefunden.',
    tellMeMatchCount: 0
  };
}

async function capture(page: Page, fileStem: string, screenshotFile: string, purpose: string, status: 'labor' | 'rejected') {
  const text = normalizePageEvidenceText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(reportingEvidencePath(`${fileStem}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(reportingEvidencePath(`${fileStem}-buttons.json`), buttons);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId: 'reporting-004',
    status,
    purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Reporting-Finalnachweis.',
      'Read-only-Navigation; keine Buchung, keine Stammdatenanlage, keine Analysis-View-Aktualisierung.'
    ],
    bookUse: status === 'labor' ? 'evidence' : 'do-not-use'
  });

  return { text, buttons };
}

test('REPORTING-004 Analysis Views als Dimensions-Reporting-Hebel read-only pruefen', async ({ page }) => {
  const openResult = await openAnalysisViewsFromTellMe(page);
  const listCapture = await capture(
    page,
    '020-analysis-views-list',
    'reporting-004-020-analysis-views-list.png',
    'REPORTING-004 Analysis Views als naechsten read-only Hebel fuer Dimensionsreporting oeffnen.',
    openResult.opened ? 'labor' : 'rejected'
  );

  const revenueAnalysisViewSelected = await clickVisibleTextByMouse(page, /^REVENUE$/i);
  await page.waitForTimeout(1000);

  const analysisByDimensionsClicked = await clickFirstVisible(page, /^Analysis by Dimensions$|^Analyse nach Dimensionen$/i);
  await page.waitForTimeout(3000);

  const revenueCardCapture = await capture(
    page,
    '030-revenue-analysis-view-card',
    'reporting-004-030-revenue-analysis-view-card.png',
    'REPORTING-004 REVENUE Analysis View Card mit eingerichteten Dimensionscodes.',
    revenueAnalysisViewSelected ? 'labor' : 'rejected'
  );

  const listText = listCapture.text;
  const revenueCardText = revenueCardCapture.text;
  const result = {
    testId: 'REPORTING-004',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting-no-setup',
    sourceContext: {
      priorO2cInvoice: 'PS-INV103297',
      priorItemLedgerEntry: '792',
      selectedAnalysisView: revenueAnalysisViewSelected ? 'REVENUE' : 'not-selected',
      priorFinding: 'REPORTING-003 konnte Dimension Perspective nicht als sichtbaren Dimensionskontext erreichen.'
    },
    microsoftLearnContext: {
      analysisViewsPurpose:
        'Microsoft Learn beschreibt Analysis Views als Grundlage fuer Analysis by Dimensions und Dimensions-Detail-Auswertungen.',
      dimensionsDetailPurpose:
        'Dimensions - Detail zeigt laut Microsoft Learn eine Aufschluesselung von Sachposten nach Dimensionsebenen.'
    },
    actions: {
      analysisViewsOpened: openResult.opened,
      analysisViewsOpenError: openResult.openError,
      tellMeMatchCount: openResult.tellMeMatchCount,
      revenueAnalysisViewSelected,
      analysisByDimensionsClicked
    },
    visibleState: {
      analysisViewsPageVisible: /Analysis Views|Analysis View List|Analyseansichten/i.test(listText),
      analysisByDimensionsActionVisible: /Analysis by Dimensions|Analyse nach Dimensionen/i.test(listText),
      dimensionsOrFilterActionsVisible: /Dimension|Filter|Update|Show Matrix|Matrix|Column|Row/i.test(listText),
      productlineVisibleInAnalysisViews: /PRODUCTLINE/i.test(listText),
      channelVisibleInAnalysisViews: /CHANNEL/i.test(listText),
      revenueAnalysisViewCardVisible: /REVENUE|Sales Revenue|Analysis View Card/i.test(revenueCardText),
      revenueDimensionAreaVisible: /AREA/i.test(revenueCardText),
      revenueDimensionDepartmentVisible: /DEPARTMENT/i.test(revenueCardText),
      revenueDimensionCustomerGroupVisible: /CUSTOMERGROUP/i.test(revenueCardText),
      productlineVisibleInRevenueAnalysisView: /PRODUCTLINE/i.test(revenueCardText),
      channelVisibleInRevenueAnalysisView: /CHANNEL/i.test(revenueCardText),
      productlineMachineVisibleInRevenueAnalysisView: hasProductlineMachine(revenueCardText),
      channelB2bVisibleInRevenueAnalysisView: hasChannelB2b(revenueCardText),
      showMatrixVisibleAfterClick: /Show Matrix|Matrix anzeigen/i.test(revenueCardText),
      relevantButtonsInList: listCapture.buttons.filter((button) => /Analysis|Dimension|Filter|Update|Matrix|Show|View|Anzeigen|Analyse/i.test(button)),
      relevantButtonsAfterClick: revenueCardCapture.buttons.filter((button) => /Analysis|Dimension|Filter|Update|Matrix|Show|View|Anzeigen|Analyse/i.test(button))
    },
    proves: [
      'Ob Analysis Views in RM-DEMO read-only erreichbar ist.',
      'Ob Analysis by Dimensions als naechster Reporting-Hebel sichtbar und ausloesbar ist.',
      'Ob PRODUCTLINE oder CHANNEL in diesem UI-Pfad bereits sichtbar werden.'
    ],
    doesNotProve: [
      'Kein deutscher Reporting-Finalnachweis.',
      'Keine neue O2C-, P2P- oder Inventory-Buchung.',
      'Keine neue oder aktualisierte Analysis View.',
      'Keine Zahlenwirkung nach PRODUCTLINE oder CHANNEL, solange keine Matrix oder Detailauswertung mit diesen Dimensionen sichtbar ist.',
      'Kein deutscher 19-Prozent-USt-Nachweis.'
    ],
    nextStep:
      /PRODUCTLINE|CHANNEL/i.test(revenueCardText)
        ? 'Gefundene Dimensionsfelder in Analysis by Dimensions gezielt als Filter/Zeile/Spalte einstellen und Matrixbild sichern.'
        : 'Die bestehende REVENUE Analysis View enthaelt AREA, DEPARTMENT und CUSTOMERGROUP, aber nicht PRODUCTLINE/CHANNEL. Naechster Schritt: Read-only Dimensions - Detail pruefen oder kontrolliert klaeren, ob eine zusaetzliche Analysis View mit PRODUCTLINE/CHANNEL eingerichtet und aktualisiert werden muss.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-004-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-004-ANALYSIS-VIEWS.md'),
    [
      '# REPORTING-004 Analysis Views als Dimensions-Reporting-Hebel',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-posting, no-setup |',
      '| Ausgangsbeleg | O2C-Laborrechnung `PS-INV103297` |',
      '| Ausgangspunkt | `REPORTING-003` lieferte keinen sichtbaren Dimension-Perspective-Kontext |',
      '',
      '## Kernergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| Analysis Views geoeffnet | ${result.actions.analysisViewsOpened ? 'ja' : 'nein'} |`,
      `| Analysis View REVENUE gewaehlt | ${result.actions.revenueAnalysisViewSelected ? 'ja' : 'nein'} |`,
      `| Analysis by Dimensions sichtbar | ${result.visibleState.analysisByDimensionsActionVisible ? 'ja' : 'nein'} |`,
      `| Analysis by Dimensions geklickt | ${result.actions.analysisByDimensionsClicked ? 'ja' : 'nein'} |`,
      `| REVENUE Analysis View Card sichtbar | ${result.visibleState.revenueAnalysisViewCardVisible ? 'ja' : 'nein'} |`,
      `| REVENUE-Dimensionen sichtbar | ${[
        result.visibleState.revenueDimensionAreaVisible ? 'AREA' : '',
        result.visibleState.revenueDimensionDepartmentVisible ? 'DEPARTMENT' : '',
        result.visibleState.revenueDimensionCustomerGroupVisible ? 'CUSTOMERGROUP' : ''
      ]
        .filter(Boolean)
        .join(', ') || 'nein'} |`,
      `| PRODUCTLINE im REVENUE-Kontext sichtbar | ${result.visibleState.productlineVisibleInRevenueAnalysisView ? 'ja' : 'nein'} |`,
      `| CHANNEL im REVENUE-Kontext sichtbar | ${result.visibleState.channelVisibleInRevenueAnalysisView ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE=MACHINE sichtbar | ${result.visibleState.productlineMachineVisibleInRevenueAnalysisView ? 'ja' : 'nein'} |`,
      `| CHANNEL=B2B sichtbar | ${result.visibleState.channelB2bVisibleInRevenueAnalysisView ? 'ja' : 'nein'} |`,
      `| Show Matrix sichtbar | ${result.visibleState.showMatrixVisibleAfterClick ? 'ja' : 'nein'} |`,
      '',
      '## Microsoft-Learn-Abgleich',
      '',
      'Microsoft Learn beschreibt Analysis Views als Grundlage fuer `Analysis by Dimensions`; `Dimensions - Detail` baut auf einer Analysis View mit Dimensionsebenen auf. Deshalb ist dieser Lauf fachlich der richtige Anschluss an den negativen `Dimension Perspective`-Befund.',
      '',
      '## Anfaenger-Lernwert',
      '',
      'Reporting nach Dimensionen ist ein eigener Einrichtungspfad. Dass `PRODUCTLINE=MACHINE` am Artikelposten sichtbar ist, bedeutet noch nicht, dass ein Bericht diese Dimension sofort als Zeile, Spalte oder Filter anbietet. Ein Leser muss erst verstehen, ob es eine passende Analysis View gibt und ob sie fuer die gesuchten Dimensionen aktualisiert ist.',
      '',
      '## Buchwirkung',
      '',
      'Die Buchstelle zu Reporting darf den O2C-Dimensionsnachweis am Artikelposten als Laborbeleg verwenden. Sie darf aber weiterhin keine GuV-/Revenue-Auswertung nach `PRODUCTLINE` oder `CHANNEL` behaupten, solange `Analysis by Dimensions`, `Dimensions - Detail` oder ein Financial Report die Dimensionen nicht sichtbar auswertet.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
      '- Keine Buchung und keine Analysis-View-Aktualisierung.',
      '- Deutsche `19 %` USt bleibt offen.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.actions.analysisViewsOpened, result.actions.analysisViewsOpenError).toBe(true);
  expect(result.visibleState.analysisViewsPageVisible).toBe(true);
});
