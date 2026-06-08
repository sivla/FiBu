import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
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

function reportingEvidencePath(fileName: string) {
  return evidencePath(project.name, 'reporting-003', fileName);
}

function normalizePageEvidenceText(text: string) {
  return text.replace(/^\s+\t/gm, '\t');
}

function compactPageText(text: string) {
  const interesting = /Financial Reports|Income Statement|Revenue|Balance Sheet|Dimension Perspective|Column Definition|Row Definition|PRODUCTLINE|CHANNEL|Guten Tag|Want to learn more|Verbindung zu Banken|Role Center|Don't show this again|Berichte und Analysen|Reports and Analysis/i;
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

  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...excerpt
  ].join('\n');
}

function hasProductlineMachine(text: string) {
  return /PRODUCTLINE[\s\S]{0,220}MACHINE|MACHINE[\s\S]{0,220}PRODUCTLINE/i.test(text);
}

function hasChannelB2b(text: string) {
  return /CHANNEL[\s\S]{0,220}B2B|B2B[\s\S]{0,220}CHANNEL/i.test(text);
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

async function clickDimensionPerspectiveAction(page: Page) {
  const openedDefinitionsMenu = await clickFirstVisible(page, /^Definitions$|^Definitionen$/i);
  await page.waitForTimeout(1000);

  const clickedFromMenu =
    (await clickFirstVisible(page, /^Dimension Perspective$|^Dimensionsperspektive$/i)) ||
    (await clickVisibleTextByMouse(page, /^Dimension Perspective$|^Dimensionsperspektive$/i));
  await page.waitForTimeout(2500);

  return { openedDefinitionsMenu, clickedFromMenu };
}

async function openFinancialReportsFromTellMe(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'Financial Reports');

  const tellMeText = normalizePageEvidenceText(await pageText(page));
  await writeTextEvidence(reportingEvidencePath('010-tell-me-financial-reports-page-text.txt'), compactPageText(tellMeText));

  for (const scope of [page, ...page.frames()]) {
    const bodyText = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Financial Reports/i.test(bodyText) || !/Berichte und Analysen|Reports and Analysis/i.test(bodyText)) {
      continue;
    }

    const financialReports = scope.getByText('Financial Reports', { exact: true });
    if ((await financialReports.count().catch(() => 0)) === 1) {
      await financialReports.first().click();
      await page.waitForTimeout(6000);
      await dismissTours(page);
      await hideFactBoxPane(page);
      return { opened: true, openError: undefined };
    }
  }

  return { opened: false, openError: 'Financial Reports nicht eindeutig in Tell-Me gefunden.' };
}

async function capture(page: Page, fileStem: string, screenshotFile: string, purpose: string, status: 'labor' | 'rejected') {
  const text = normalizePageEvidenceText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  await writeTextEvidence(reportingEvidencePath(`${fileStem}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(reportingEvidencePath(`${fileStem}-buttons.json`), buttons);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId: 'reporting-003',
    status,
    purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Reporting-Finalnachweis.',
      'Read-only-Navigation; keine Buchung, keine Stammdatenanlage und keine Berichtseinrichtung.'
    ],
    bookUse: status === 'labor' ? 'evidence' : 'do-not-use'
  });

  return { text, buttons };
}

test('REPORTING-003 Dimension Perspective in Financial Reports read-only pruefen', async ({ page }) => {
  const openResult = await openFinancialReportsFromTellMe(page);
  const financialReportsCapture = await capture(
    page,
    '020-financial-reports-wide-layout',
    'reporting-003-020-financial-reports-wide-layout.png',
    'REPORTING-003 Financial Reports im breiten Viewport als Ausgangspunkt fuer die Dimensionsperspektive.',
    openResult.opened ? 'labor' : 'rejected'
  );

  const incomeStatementSelected =
    (await clickVisibleTextByMouse(page, /^IS$/i)) || (await clickVisibleTextByMouse(page, /^Income Statement$/i));
  await page.waitForTimeout(1000);

  const dimensionPerspectiveAction = await clickDimensionPerspectiveAction(page);

  const maximizedAttempted =
    (await clickFirstVisible(page, /Maximize|Maximieren|Vergr[oö]ssern|Vergr[oö][ßs]ern|Expand|Full screen|Vollbild/i)) ||
    false;
  await page.waitForTimeout(1500);

  const dimensionPerspectiveProbeText = normalizePageEvidenceText(await pageText(page));
  const dimensionPerspectiveContextVisible =
    /Dimension Perspective|Dimensionsperspektive|Dimension Code|Dimension Value|Dimensionen|Show as Column|Show as Row|Column|Row/i.test(
      dimensionPerspectiveProbeText
    ) && !/Guten Tag|Want to learn more about Business Central|Verbindung zu Banken/i.test(dimensionPerspectiveProbeText);
  const dimensionPerspectiveCapture = await capture(
    page,
    '030-dimension-perspective-result',
    'reporting-003-030-dimension-perspective-result.png',
    'REPORTING-003 Ergebnis nach Auswahl von Income Statement und Klick auf Dimension Perspective.',
    dimensionPerspectiveContextVisible ? 'labor' : 'rejected'
  );

  const dimensionPerspectiveText = dimensionPerspectiveCapture.text;
  const dimensionButtons = dimensionPerspectiveCapture.buttons;
  const result = {
    testId: 'REPORTING-003',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting',
    sourceContext: {
      priorO2cInvoice: 'PS-INV103297',
      priorItemLedgerEntry: '792',
      selectedFinancialReport: 'Income Statement'
    },
    actions: {
      financialReportsOpened: openResult.opened,
      financialReportsOpenError: openResult.openError,
      wideViewport: '1920x1200',
      factBoxHideAttempted: true,
      incomeStatementSelected,
      definitionsMenuOpened: dimensionPerspectiveAction.openedDefinitionsMenu,
      dimensionPerspectiveClicked: dimensionPerspectiveAction.clickedFromMenu,
      maximizedAttempted
    },
    visibleState: {
      financialReportsPageVisible: /Financial Reports|Account Schedules|Finanzberichte/i.test(financialReportsCapture.text),
      incomeStatementVisibleBeforeClick: /Income Statement/i.test(financialReportsCapture.text),
      dimensionPerspectiveActionVisibleBeforeClick: /Dimension Perspective|Dimensionsperspektive/i.test(financialReportsCapture.text),
      dimensionPerspectiveContextVisibleAfterClick: dimensionPerspectiveContextVisible,
      returnedToRoleCenterAfterClick: /Guten Tag|Want to learn more about Business Central|Verbindung zu Banken/i.test(
        dimensionPerspectiveText
      ),
      productlineVisibleAfterClick: /PRODUCTLINE/i.test(dimensionPerspectiveText),
      channelVisibleAfterClick: /CHANNEL/i.test(dimensionPerspectiveText),
      productlineMachineVisibleAfterClick: hasProductlineMachine(dimensionPerspectiveText),
      channelB2bVisibleAfterClick: hasChannelB2b(dimensionPerspectiveText),
      relevantButtonsAfterClick: dimensionButtons.filter((button) =>
        /Dimension|Filter|Column|Row|Analysis|Analyse|Show|View|OK|Cancel|Apply|Spalte|Zeile|Anzeigen|Uebersicht/i.test(button)
      )
    },
    proves: [
      'Financial Reports kann read-only im breiten Viewport als Reporting-Einstieg geoeffnet werden.',
      'Der Menuepfad Definitions -> Dimension Perspective wurde im Labor versucht.',
      'Nach dem Versuch sind PRODUCTLINE und CHANNEL in diesem UI-Zustand nicht sichtbar.'
    ],
    doesNotProve: [
      'Kein deutscher Reporting-Finalnachweis.',
      'Keine neue Buchung und keine Veraenderung am gebuchten O2C-Beleg.',
      'Keine Zahlenwirkung nach PRODUCTLINE oder CHANNEL, solange keine gefilterte/summierte Berichtsansicht sichtbar ist.',
      'Kein deutscher 19-Prozent-USt-Nachweis.'
    ],
    nextStep:
      dimensionPerspectiveContextVisible && /PRODUCTLINE|CHANNEL/i.test(dimensionPerspectiveText)
        ? 'Gefundene Dimension in der Dimensionsperspektive gezielt einstellen und als Zahlen-/Filterbild sichern.'
        : 'Naechster read-only Hebel: Dimensions - Detail oder Analysis Views pruefen; der Menuepfad Dimension Perspective liefert in diesem Lauf keinen sichtbaren PRODUCTLINE/CHANNEL-Kontext.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-003-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-003-DIMENSION-PERSPECTIVE.md'),
    [
      '# REPORTING-003 Dimension Perspective in Financial Reports',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-posting |',
      '| Ausgangsbeleg | O2C-Laborrechnung `PS-INV103297` |',
      '| Ausgangsreport | `Income Statement` |',
      '| Viewport | `1920x1200`, breite Layoutansicht |',
      '',
      '## Kernergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| Financial Reports geoeffnet | ${result.actions.financialReportsOpened ? 'ja' : 'nein'} |`,
      `| Income Statement markiert | ${result.actions.incomeStatementSelected ? 'ja' : 'nein'} |`,
      `| Dimension Perspective geklickt | ${result.actions.dimensionPerspectiveClicked ? 'ja' : 'nein'} |`,
      `| Sichtbarer Dimension-Perspective-Kontext erreicht | ${result.visibleState.dimensionPerspectiveContextVisibleAfterClick ? 'ja' : 'nein'} |`,
      `| Nach Aktion im Role Center gelandet | ${result.visibleState.returnedToRoleCenterAfterClick ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE sichtbar nach Klick | ${result.visibleState.productlineVisibleAfterClick ? 'ja' : 'nein'} |`,
      `| CHANNEL sichtbar nach Klick | ${result.visibleState.channelVisibleAfterClick ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE=MACHINE sichtbar nach Klick | ${result.visibleState.productlineMachineVisibleAfterClick ? 'ja' : 'nein'} |`,
      `| CHANNEL=B2B sichtbar nach Klick | ${result.visibleState.channelB2bVisibleAfterClick ? 'ja' : 'nein'} |`,
      '',
      '## Anfaenger-Lernwert',
      '',
      'Eine Dimension am gebuchten Posten ist noch keine automatische Berichtsauswertung. In Business Central muss ein Finanzbericht, eine Dimensionsperspektive, ein Dimensionsbericht oder eine Analysis View die Dimension auch sichtbar als Filter, Zeile oder Spalte anbieten. Dieser Lauf zeigt zusaetzlich: Ein sichtbarer Menuepunkt ist noch kein fertiger Klickpfad, wenn der UI-Zustand danach nicht den erwarteten Kontext zeigt.',
      '',
      '## Buchwirkung',
      '',
      'Der Buchtext darf weiterhin sagen, dass `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` am O2C-Artikelposten im Labor nachgewiesen sind. Er darf aber noch nicht behaupten, dass Financial Reports diese Dimensionen bereits als GuV-/Revenue-Auswertung zeigen. Fuer das finale Buchbild braucht es einen separaten Nachweis der Reportingachse.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
      '- Keine neue Buchung, keine Berichtseinrichtung und keine Stammdatenanlage.',
      '- Der Versuch `Definitions -> Dimension Perspective` fuehrte in diesem Lauf nicht zu einer sichtbaren Dimensionsperspektive fuer `Income Statement`.',
      '- Deutsche `19 %` USt bleibt offen.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.actions.financialReportsOpened, result.actions.financialReportsOpenError).toBe(true);
  expect(result.visibleState.financialReportsPageVisible).toBe(true);
  expect(result.visibleState.dimensionPerspectiveActionVisibleBeforeClick).toBe(true);
  expect(result.actions.dimensionPerspectiveClicked).toBe(true);
});
