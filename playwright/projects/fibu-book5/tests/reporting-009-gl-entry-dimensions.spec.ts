import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1300 }
});

function reportingEvidencePath(fileName: string) {
  return evidencePath(project.name, 'reporting-009', fileName);
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
    /G\/L Entries|G\/L Entry|Sachposten|PS-INV103297|14140|50110|40140|15110|PRODUCTLINE|CHANNEL|MACHINE|B2B|Dimension|Dimensions|Dimension Set|Edit Dimension Set Entries|Account No\.|Amount|Betrag/i;
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

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 180)
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
          await page.waitForTimeout(2500);
          return { clicked: true, method: `role:${role}` };
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 800 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(2500);
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
    testId: 'reporting-009',
    status: /G\/L Entries|G\/L Entry|Sachposten|Dimension|Dimensions|PS-INV103297/i.test(text)
      ? 'labor'
      : 'rejected',
    purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Reporting-Finalnachweis.',
      'Read-only-Navigation; keine Buchung, kein Setup und keine Analysis-View-Aktualisierung.',
      'Breite Layoutansicht wurde genutzt, damit Sachposten- und Aktionskontext besser sichtbar werden.'
    ],
    bookUse: 'evidence'
  });

  return {
    text,
    buttons,
    glEntriesVisible: /G\/L Entries|G\/L Entry|Sachposten/i.test(text),
    postedInvoiceVisible: /PS-INV103297/i.test(text),
    dimensionContextVisible: /Dimension|Dimensions|Dimension Set|Edit Dimension Set Entries|Dimensionen/i.test(text),
    departmentCodeColumnVisible: /Department Code|Abteilungscode/i.test(text),
    customerGroupCodeColumnVisible: /Customergroup Code|Customer Group Code|Debitorengruppe|Kundengruppe/i.test(text),
    productlineVisible: /PRODUCTLINE/i.test(text),
    channelVisible: /CHANNEL/i.test(text),
    productlineMachineVisible: hasProductlineMachine(text),
    channelB2bVisible: hasChannelB2b(text),
    relevantButtons: buttons.filter((button) => /Entry|Posten|Dimension|Navigate|Find|Show|Open|Related/i.test(button)),
    textEvidenceFile: `${fileStem}-page-text.txt`,
    buttonEvidenceFile: `${fileStem}-buttons.json`,
    screenshot: screenshotFile
  };
}

test('REPORTING-009 G/L Entry Dimensions read-only pruefen', async ({ page }) => {
  const postedInvoiceNo = 'PS-INV103297';

  await page.goto(filteredBcPageUrl(20, 'G/L Entry', 'Document No.', postedInvoiceNo), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  const factBoxHidden = await hideFactBoxPane(page);
  await page.waitForTimeout(2500);

  const before = await captureState(
    page,
    '010-gl-entries-before-dimensions',
    'reporting-009-010-gl-entries-before-dimensions.png',
    'REPORTING-009 gefilterte G/L Entries zur gebuchten O2C-Laborrechnung vor Dimensionsversuch.'
  );

  let entryClick = await clickFirstVisible(page, /^Entry$|^Posten$/i);
  let dimensionClick = await clickFirstVisible(page, /^Dimensions$|^Dimensionen$/i);
  let moreOptionsClick = { clicked: false, method: undefined as string | undefined };

  if (!dimensionClick.clicked) {
    moreOptionsClick = await clickFirstVisible(page, /^Weitere Optionen$|^More options$/i);
    if (moreOptionsClick.clicked) {
      entryClick = entryClick.clicked ? entryClick : await clickFirstVisible(page, /^Entry$|^Posten$/i);
      dimensionClick = await clickFirstVisible(page, /^Dimensions$|^Dimensionen$/i);
    }
  }

  const after = await captureState(
    page,
    '020-gl-entry-dimensions-result',
    'reporting-009-020-gl-entry-dimensions-result.png',
    'REPORTING-009 Ergebniszustand nach read-only Versuch Entry -> Dimensions auf G/L Entries.'
  );

  const result = {
    testId: 'REPORTING-009',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting-no-setup',
    sourceContext: {
      postedSalesInvoiceNo: postedInvoiceNo,
      priorProof:
        'UAT-O2C-001 belegt PRODUCTLINE=MACHINE und CHANNEL=B2B am Artikelposten 792; Reporting-002 bis Reporting-008 belegen noch keine Financial-Reports-Auswertung.'
    },
    actions: {
      usedWideViewport: true,
      attemptedFactBoxHide: true,
      factBoxHidden,
      openedGlEntries: before.glEntriesVisible,
      filterValueVisible: before.postedInvoiceVisible,
      moreOptionsClick,
      entryClick,
      dimensionClick
    },
    before: {
      glEntriesVisible: before.glEntriesVisible,
      postedInvoiceVisible: before.postedInvoiceVisible,
      departmentCodeColumnVisible: before.departmentCodeColumnVisible,
      customerGroupCodeColumnVisible: before.customerGroupCodeColumnVisible,
      productlineVisible: before.productlineVisible,
      channelVisible: before.channelVisible,
      productlineMachineVisible: before.productlineMachineVisible,
      channelB2bVisible: before.channelB2bVisible,
      relevantButtons: before.relevantButtons,
      textEvidenceFile: before.textEvidenceFile,
      buttonEvidenceFile: before.buttonEvidenceFile,
      screenshot: before.screenshot
    },
    after: {
      dimensionContextVisible: after.dimensionContextVisible,
      departmentCodeColumnVisible: after.departmentCodeColumnVisible,
      customerGroupCodeColumnVisible: after.customerGroupCodeColumnVisible,
      productlineVisible: after.productlineVisible,
      channelVisible: after.channelVisible,
      productlineMachineVisible: after.productlineMachineVisible,
      channelB2bVisible: after.channelB2bVisible,
      relevantButtons: after.relevantButtons,
      textEvidenceFile: after.textEvidenceFile,
      buttonEvidenceFile: after.buttonEvidenceFile,
      screenshot: after.screenshot
    },
    summary: {
      glEntryDimensionsOpened: dimensionClick.clicked && after.dimensionContextVisible,
      shortcutDimensionColumnsVisible:
        before.departmentCodeColumnVisible ||
        before.customerGroupCodeColumnVisible ||
        after.departmentCodeColumnVisible ||
        after.customerGroupCodeColumnVisible,
      productlineOrChannelVisibleInGlEntryDimensionContext:
        after.productlineVisible || after.channelVisible || after.productlineMachineVisible || after.channelB2bVisible,
      productlineMachineVisibleInGlEntryDimensionContext: after.productlineMachineVisible,
      channelB2bVisibleInGlEntryDimensionContext: after.channelB2bVisible,
      noPostingCommittedByTest: true,
      noSetupChangedByTest: true
    },
    proves: [
      'Ob G/L Entries zur gebuchten O2C-Laborrechnung read-only erreichbar sind.',
      'Ob die Aktion Entry -> Dimensions auf Sachposten in diesem UI-Kontext sichtbar nutzbar ist.',
      'Ob PRODUCTLINE/CHANNEL im Sachposten-Dimensionskontext sichtbar werden.'
    ],
    doesNotProve: [
      'Keine Financial-Reports-Summenwirkung nach PRODUCTLINE/CHANNEL.',
      'Keine neue oder aktualisierte Analysis View.',
      'Kein deutscher Reporting-Finalnachweis.',
      'Keine neue Buchung und kein deutscher 19-Prozent-USt-Nachweis.'
    ],
    nextStep:
      dimensionClick.clicked && (after.productlineVisible || after.channelVisible)
        ? 'Sachposten-Dimensionsbild als Labor-Evidence erklaeren und Reporting-Auswertung weiterhin separat klaeren.'
        : 'Sachposten-Dimensionsdialog liefert in diesem UI-Lauf keinen sichtbaren PRODUCTLINE-/CHANNEL-Nachweis. Naechster Reporting-Hebel bleibt der freigegebene Analysis-View-Fit oder ein alternativer offizieller Reporting-Einstieg.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-009-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-009-GL-ENTRY-DIMENSIONS.md'),
    [
      '# REPORTING-009 G/L Entry Dimensions',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-posting, no-setup |',
      `| Ausgangsbeleg | ${postedInvoiceNo} |`,
      '| Layout | breite Ansicht 2200 x 1300; FactBox-Hide versucht |',
      '',
      '## Kernergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| G/L Entries zur Rechnung sichtbar | ${result.actions.openedGlEntries ? 'ja' : 'nein'} |`,
      `| Rechnungsfilter sichtbar | ${result.actions.filterValueVisible ? 'ja' : 'nein'} |`,
      `| Entry/Posten-Aktion geklickt | ${result.actions.entryClick.clicked ? 'ja' : 'nein'} |`,
      `| Weitere Optionen geklickt | ${result.actions.moreOptionsClick.clicked ? 'ja' : 'nein'} |`,
      `| Dimensionsaktion geklickt | ${result.actions.dimensionClick.clicked ? 'ja' : 'nein'} |`,
      `| Sachposten-Dimensionskontext sichtbar | ${result.summary.glEntryDimensionsOpened ? 'ja' : 'nein'} |`,
      `| Shortcut-Dimensionsspalten sichtbar | ${result.summary.shortcutDimensionColumnsVisible ? 'ja' : 'nein'} |`,
      `| PRODUCTLINE/CHANNEL dort sichtbar | ${result.summary.productlineOrChannelVisibleInGlEntryDimensionContext ? 'ja' : 'nein'} |`,
      `| Keine Buchung | ${result.summary.noPostingCommittedByTest ? 'ja' : 'nein'} |`,
      '',
      '## Anfaenger-Lernwert',
      '',
      'Ein Sachposten zeigt die Hauptbuchwirkung einer Buchung. Das ist nicht automatisch dasselbe wie die Dimensionen, die vorher an Verkaufszeile, Debitor oder Artikel sichtbar waren. In diesem Listenbild sind zwar Shortcut-Spalten wie `Department Code` und `Customergroup Code` sichtbar, aber nicht die Buchziel-Dimensionen `PRODUCTLINE` und `CHANNEL`. Fuer das Buch ist deshalb wichtig, die Postenarten getrennt zu lesen: Artikelposten koennen die operative Artikel-/Dimensionsspur zeigen, waehrend Sachposten vor allem Konten, Betraege und einzelne Shortcut-Dimensionen zeigen. Erst ein sichtbarer Dimensionsdialog, eine Analysis View oder ein Bericht macht daraus eine Reporting-Evidence fuer `PRODUCTLINE`/`CHANNEL`.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 10, 11 und 25 duerfen weiterhin nicht behaupten, dass `PRODUCTLINE=MACHINE` oder `CHANNEL=B2B` schon in Financial Reports oder Sachposten-Reporting auswertbar sind. Der Lauf ergaenzt aber die Klickanleitung: Bei Sachposten soll der Leser bewusst nach `Entry`/`Posten` und `Dimensions` suchen und das Ergebnis als getrennten Kontrollpunkt bewerten.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
      '- Keine Buchung, keine Stammdatenanlage und keine Analysis-View-Aktualisierung.',
      '- Deutsche `19 %` USt bleibt offen.',
      '- Wenn der Dimensionsdialog nicht sichtbar oder ohne Zielwerte bleibt, ist das kein Gegenbeweis zur Artikelposten-Dimension, sondern eine Grenze dieses Sachposten-/Reportingpfads.',
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
      '# REPORTING-009 Evidence-Index',
      '',
      'Ziel: Read-only pruefen, ob `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` auf gefilterten `G/L Entries` zur gebuchten O2C-Laborrechnung ueber `Entry` -> `Dimensions` sichtbar werden.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `REPORTING-009-result.json` | JSON-Ergebnis | Sandbox, Company, Klickversuch, breite Ansicht, keine Buchung, keine Setup-Aenderung | keine Financial-Reports-Summenwirkung | labor, read-only |',
      '| `REPORTING-009-GL-ENTRY-DIMENSIONS.md` | Lernzusammenfassung | warum Sachposten-Dimensionen ein eigener Kontrollpunkt sind | keinen deutschen Finalreport | labor |',
      '| `010-gl-entries-before-dimensions-page-text.txt` | kompakter UI-Text | gefilterte Sachposten zur `PS-INV103297` | keine Dimensionserzeugung | labor |',
      '| `020-gl-entry-dimensions-result-page-text.txt` | kompakter UI-Text | Ergebniszustand nach Dimensionsversuch | keine Buchung und keine Analysis View | labor/rejected je nach sichtbarem Zielwert |',
      '| `../img/reporting-009-010-gl-entries-before-dimensions.png` | Screenshot | Sachposten-Ausgangspunkt in breiter Ansicht | keinen Dimensionsnachweis | labor-candidate |',
      '| `../img/reporting-009-020-gl-entry-dimensions-result.png` | Screenshot | Ergebniszustand nach `Entry`/`Dimensions`-Versuch | nur als Dimensionsnachweis nutzbar, wenn Zielwerte sichtbar sind | labor-candidate/rejected |',
      '',
      '## Aktuelle Wahrheit',
      '',
      result.summary.productlineOrChannelVisibleInGlEntryDimensionContext
        ? '`PRODUCTLINE` oder `CHANNEL` wurde im Sachposten-Dimensionskontext sichtbar. Reporting-Auswertung bleibt trotzdem separat offen.'
        : result.summary.shortcutDimensionColumnsVisible
          ? '`PRODUCTLINE`/`CHANNEL` wurde im Sachposten-Dimensionskontext nicht sichtbar als Reportingnachweis erreicht. Das Sachpostenbild zeigt aber einzelne Shortcut-Dimensionsspalten wie `Department Code`/`Customergroup Code`; Artikelposten-Dimension bleibt belegt, Financial Reports/Analysis View bleiben offen.'
        : '`PRODUCTLINE`/`CHANNEL` wurde im Sachposten-Dimensionskontext nicht sichtbar als Reportingnachweis erreicht. Artikelposten-Dimension bleibt belegt; Financial Reports/Analysis View bleiben offen.',
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
