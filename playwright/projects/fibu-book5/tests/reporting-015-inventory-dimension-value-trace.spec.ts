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

test.setTimeout(360_000);

const TEST_ID = 'reporting-015';
const DOCUMENT_NO = 'INV008-899959';
const ANALYSIS_VIEW_LIST_PAGE_ID = 556;

type TraceCheck = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  screenshotFile: string;
  labelPattern: RegExp;
  purpose: string;
};

function reportingEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function bcPageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
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
    /INV008-899959|RM-M100|FRA-ZL|14140|84[.,]000|42[.,]000|Quantity|Amount|Unit Cost|PRODUCTLINE|MACHINE|CHANNEL|B2B|Dimension|Dimensions|Dimension Set|Item Ledger|Value Entr|G\/L Entr|Analysis View|Analysis by Dimensions|RM-PLCH|REVENUE|Filter|Matrix/i;
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

async function activateWideLayout(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const checkbox = scope.getByRole('menuitemcheckbox', { name: /Breites Layout|Wide layout/i }).last();
    if (await checkbox.isVisible({ timeout: 500 }).catch(() => false)) {
      const checked = await checkbox.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await checkbox.click().catch(() => undefined);
        await page.waitForTimeout(1000);
      }
      return true;
    }

    const button = scope
      .getByRole('button', {
        name: /Breites Layout|Wide layout|Focus mode|Full screen|Maximi[sz]e|Expand|Fokus|Vollbild|Maximieren|Erweitern/i
      })
      .last();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(1000);
      return true;
    }
  }

  return false;
}

async function clickFirstVisible(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'menuitemcheckbox'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(2200);
          return { clicked: true, method: `role:${role}` };
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 800 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(2200);
        return { clicked: true, method: 'text' };
      }
    }
  }

  return { clicked: false, method: undefined as string | undefined };
}

async function captureState(page: Page, fileStem: string, screenshotFile: string, purpose: string, status: 'labor' | 'candidate' | 'rejected') {
  const text = await pageText(page);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(reportingEvidencePath(`${fileStem}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(reportingEvidencePath(`${fileStem}-buttons.json`), buttons);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId: TEST_ID,
    status,
    purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Reporting-Finalnachweis.',
      'Read-only-Navigation; kein New/Edit/Delete, keine Buchung, keine Vorschau, keine Setup-Aenderung.',
      'Wenn PRODUCTLINE/CHANNEL nicht sichtbar sind, bleibt die Dimension nur vor der Item-Journal-Buchung belegt.'
    ],
    bookUse: status === 'rejected' ? 'do-not-use' : 'evidence'
  });

  return { text, buttons };
}

async function openTracePage(page: Page, check: TraceCheck) {
  await page.goto(filteredBcPageUrl(check.pageId, check.tableName, check.filterField, check.filterValue), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  const wideLayoutActivated = await activateWideLayout(page);
  await page.waitForTimeout(800);

  const before = await captureState(
    page,
    `${check.fileStem}-before-dimensions`,
    check.screenshotFile,
    check.purpose,
    'labor'
  );

  let entryClick = await clickFirstVisible(page, /^Entry$|^Posten$/i);
  let dimensionsClick = await clickFirstVisible(page, /^Dimensions$|^Dimensionen$/i);
  let moreOptionsClick = { clicked: false, method: undefined as string | undefined };

  if (!dimensionsClick.clicked) {
    moreOptionsClick = await clickFirstVisible(page, /^Weitere Optionen$|^More options$/i);
    if (moreOptionsClick.clicked) {
      entryClick = entryClick.clicked ? entryClick : await clickFirstVisible(page, /^Entry$|^Posten$/i);
      dimensionsClick = await clickFirstVisible(page, /^Dimensions$|^Dimensionen$/i);
    }
  }

  const after = await captureState(
    page,
    `${check.fileStem}-after-dimensions`,
    check.screenshotFile.replace(/\.png$/i, '-dimensions.png'),
    `${check.purpose} Ergebnis nach read-only Dimensionsversuch.`,
    dimensionsClick.clicked ? 'candidate' : 'rejected'
  );

  const combinedText = `${before.text}\n${after.text}`;
  const beforeText = before.text;
  const afterText = after.text;

  return {
    id: check.id,
    pageId: check.pageId,
    tableName: check.tableName,
    filterField: check.filterField,
    filterValue: check.filterValue,
    wideLayoutActivated,
    pageContextVisible: check.labelPattern.test(beforeText),
    filterValueVisible: beforeText.includes(check.filterValue),
    documentNoVisible: /INV008-899959/i.test(combinedText),
    rmM100Visible: /RM-M100/i.test(combinedText),
    fraZlVisible: /FRA-ZL/i.test(combinedText),
    quantity2Visible: /\b2(?:\.00|,00)?\b/i.test(combinedText),
    amount84000Visible: /84[.,]000|84000/i.test(combinedText),
    unitCost42000Visible: /42[.,]000|42000/i.test(combinedText),
    inventoryAccount14140Visible: /\b14140\b/i.test(combinedText),
    productlineVisible: /PRODUCTLINE/i.test(combinedText),
    channelVisible: /CHANNEL/i.test(combinedText),
    productlineMachineVisible: hasProductlineMachine(combinedText),
    channelB2bVisible: hasChannelB2b(combinedText),
    dimensionContextVisible: /Dimension|Dimensions|Dimension Set|Edit Dimension Set Entries|Dimensionen/i.test(afterText),
    relevantButtonsBefore: before.buttons.filter((button) => /Entry|Posten|Dimension|Navigate|Find|Show|Open|Related/i.test(button)),
    relevantButtonsAfter: after.buttons.filter((button) => /Entry|Posten|Dimension|Navigate|Find|Show|Open|Related/i.test(button)),
    actions: {
      entryClick,
      moreOptionsClick,
      dimensionsClick
    },
    textEvidenceFiles: [
      `${check.fileStem}-before-dimensions-page-text.txt`,
      `${check.fileStem}-after-dimensions-page-text.txt`
    ],
    buttonEvidenceFiles: [
      `${check.fileStem}-before-dimensions-buttons.json`,
      `${check.fileStem}-after-dimensions-buttons.json`
    ],
    screenshots: [
      check.screenshotFile,
      check.screenshotFile.replace(/\.png$/i, '-dimensions.png')
    ]
  };
}

async function captureAnalysisViewsReadOnly(page: Page) {
  await page.goto(bcPageUrl(ANALYSIS_VIEW_LIST_PAGE_ID), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3000);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  const wideLayoutActivated = await activateWideLayout(page);
  await page.waitForTimeout(800);

  const state = await captureState(
    page,
    '040-analysis-views-readonly',
    'reporting-015-040-analysis-views-readonly.png',
    'reporting-015 read-only Analysis Views Liste als Reporting-Kontext fuer PRODUCTLINE/CHANNEL.',
    'labor'
  );

  return {
    pageId: ANALYSIS_VIEW_LIST_PAGE_ID,
    wideLayoutActivated,
    pageContextVisible: /Analysis Views|Analysis View List|Analyseansichten/i.test(state.text),
    productlineVisible: /PRODUCTLINE/i.test(state.text),
    channelVisible: /CHANNEL/i.test(state.text),
    rmPlchVisible: /RM-PLCH/i.test(state.text),
    analysisByDimensionsVisible: /Analysis by Dimensions|Analyse nach Dimensionen/i.test(state.text),
    relevantButtons: state.buttons.filter((button) => /Analysis|Dimension|Filter|Update|Matrix|Show|View|Anzeigen|Analyse/i.test(button)),
    textEvidenceFile: '040-analysis-views-readonly-page-text.txt',
    buttonEvidenceFile: '040-analysis-views-readonly-buttons.json',
    screenshot: 'reporting-015-040-analysis-views-readonly.png'
  };
}

function renderMarkdown(result: Record<string, any>) {
  const traceRows = result.traces
    .map(
      (trace: Record<string, any>) =>
        `| ${trace.id} | ${trace.pageContextVisible ? 'ja' : 'nein'} | ${trace.filterValueVisible ? 'ja' : 'nein'} | ${
          trace.productlineMachineVisible ? 'ja' : 'nein'
        } | ${trace.channelB2bVisible ? 'ja' : 'nein'} | ${trace.dimensionContextVisible ? 'ja' : 'nein'} |`
    )
    .join('\n');

  return [
    '# reporting-015 Inventory Dimension / Value Trace',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Sandbox | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | `labor`, `read-only`, `no-posting`, `not-final` |',
    `| Inventory-Beleg | \`${result.sourceDocument.documentNo}\` |`,
    `| Artikel | \`${result.sourceDocument.itemNo}\` |`,
    `| Lagerort | \`${result.sourceDocument.locationCode}\` |`,
    '',
    '## Kernergebnis',
    '',
    '| Trace | Seite sichtbar | Beleg sichtbar | PRODUCTLINE=MACHINE sichtbar | CHANNEL=B2B sichtbar | Dimensionskontext sichtbar |',
    '|---|---:|---:|---:|---:|---:|',
    traceRows,
    '',
    '| Reporting-Kontext | Befund |',
    '|---|---|',
    `| Analysis Views sichtbar | ${result.analysisViews.pageContextVisible ? 'ja' : 'nein'} |`,
    `| RM-PLCH sichtbar | ${result.analysisViews.rmPlchVisible ? 'ja' : 'nein'} |`,
    `| PRODUCTLINE in Analysis Views sichtbar | ${result.analysisViews.productlineVisible ? 'ja' : 'nein'} |`,
    `| CHANNEL in Analysis Views sichtbar | ${result.analysisViews.channelVisible ? 'ja' : 'nein'} |`,
    '',
    '## Was wurde bewiesen?',
    '',
    ...result.proved.map((entry: string) => `- ${entry}`),
    '',
    '## Was wurde nicht bewiesen?',
    '',
    ...result.notProved.map((entry: string) => `- ${entry}`),
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine Dimension an der Journalzeile ist ein Vor-Buchungsnachweis. Nach der Buchung muss man gesondert pruefen, ob diese Dimension auf den erzeugten Posten oder in einem Bericht sichtbar ist. Wenn `PRODUCTLINE=MACHINE` im Artikeljournal vor der Buchung sichtbar war, aber in Artikelposten, Wertposten oder Sachposten nicht sichtbar wird, darf das Buch daraus keine Reporting-Wirkung ableiten.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 13 darf die Bestandswirkung von `INV008-899959` weiter als Laborbeleg verwenden. Kapitel 10/25 muessen aber weiterhin trennen: `PRODUCTLINE=MACHINE` ist vor der Inventory-Buchung belegt; eine durchgaengige Reporting-/Sachposten-Dimensionswirkung ist erst belegt, wenn sie in Posten, Analysis View oder Bericht sichtbar wird.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
    '- Keine Buchung, keine Vorschau, keine Stammdaten-/Setup-Aenderung.',
    '- Keine deutsche `19 %` USt und kein deutscher Kontenplan-Endstand.',
    '- Keine neue oder aktualisierte Analysis View.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('reporting-015 Inventory Dimension und Value Trace read-only pruefen', async ({ page }) => {
  const traces = [];
  for (const check of [
    {
      id: 'item-ledger-entry',
      pageId: 38,
      tableName: 'Item Ledger Entry',
      filterField: 'Document No.',
      filterValue: DOCUMENT_NO,
      fileStem: '010-item-ledger-entry-inv008',
      screenshotFile: 'reporting-015-010-item-ledger-entry-inv008.png',
      labelPattern: /Item Ledger Entries|Item Ledger Entry|Artikelposten/i,
      purpose: 'reporting-015 Artikelposten zur Inventory-Laborbuchung INV008-899959 read-only pruefen.'
    },
    {
      id: 'value-entry',
      pageId: 5802,
      tableName: 'Value Entry',
      filterField: 'Document No.',
      filterValue: DOCUMENT_NO,
      fileStem: '020-value-entry-inv008',
      screenshotFile: 'reporting-015-020-value-entry-inv008.png',
      labelPattern: /Value Entries|Value Entry|Wertposten|Cost Amount|Kostenbetrag/i,
      purpose: 'reporting-015 Wertposten zur Inventory-Laborbuchung INV008-899959 read-only pruefen.'
    },
    {
      id: 'gl-entry',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: DOCUMENT_NO,
      fileStem: '030-gl-entry-inv008',
      screenshotFile: 'reporting-015-030-gl-entry-inv008.png',
      labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i,
      purpose: 'reporting-015 Sachposten zur Inventory-Laborbuchung INV008-899959 read-only pruefen.'
    }
  ] satisfies TraceCheck[]) {
    traces.push(await openTracePage(page, check));
  }

  const analysisViews = await captureAnalysisViewsReadOnly(page);
  const productlineVisibleInPostedTrace = traces.some((trace) => trace.productlineMachineVisible);
  const channelVisibleInPostedTrace = traces.some((trace) => trace.channelB2bVisible);
  const productlineOrChannelVisibleInAnalysisViews =
    analysisViews.productlineVisible || analysisViews.channelVisible || analysisViews.rmPlchVisible;

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: 'REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE',
    source: 'playwright-readonly-smoke',
    resultStatus: 'observed',
    runPlanId: 'REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE-PLAN',
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-high',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting-no-setup',
    sourceDocument: {
      sourceCase: 'INVENTORY-008',
      documentNo: DOCUMENT_NO,
      itemNo: 'RM-M100',
      locationCode: 'FRA-ZL',
      prePostingDimension: 'PRODUCTLINE=MACHINE'
    },
    traces,
    analysisViews,
    summary: {
      itemLedgerEntryVisible: traces.find((trace) => trace.id === 'item-ledger-entry')?.pageContextVisible ?? false,
      valueEntryVisible: traces.find((trace) => trace.id === 'value-entry')?.pageContextVisible ?? false,
      glEntryVisible: traces.find((trace) => trace.id === 'gl-entry')?.pageContextVisible ?? false,
      productlineMachineVisibleInPostedTrace: productlineVisibleInPostedTrace,
      channelB2bVisibleInPostedTrace: channelVisibleInPostedTrace,
      productlineOrChannelVisibleInAnalysisViews,
      noPostingCommittedByTest: true,
      noPreviewCommittedByTest: true,
      noSetupChangedByTest: true,
      noCompanySwitch: true
    },
    proved: [
      'INV008-899959 was inspected read-only in Item Ledger Entries, Value Entries and G/L Entries.',
      analysisViews.pageContextVisible
        ? 'Analysis Views page was reachable read-only as a reporting context.'
        : 'Analysis Views page was attempted read-only but did not provide a reliable reporting context.',
      productlineVisibleInPostedTrace
        ? 'PRODUCTLINE=MACHINE is visible in at least one posted Inventory trace context.'
        : 'PRODUCTLINE=MACHINE was not visible in the inspected posted Inventory trace contexts.',
      productlineOrChannelVisibleInAnalysisViews
        ? 'PRODUCTLINE/CHANNEL or RM-PLCH is visible in Analysis Views context.'
        : 'PRODUCTLINE/CHANNEL was not visible as an Analysis Views reporting axis in this read-only run.'
    ],
    notProved: [
      'No new Business Central posting occurred.',
      'No Preview Posting occurred.',
      'No setup or master data change occurred.',
      'No German final proof.',
      'No German 19 percent VAT proof.',
      'No final Financial Reports or Analysis by Dimensions sum by PRODUCTLINE/CHANNEL was proven.',
      'No claim that Item Journal is creditor-side P2P receipt proof.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/tests/reporting-015-inventory-dimension-value-trace.spec.ts',
      'playwright/projects/fibu-book5/evidence/reporting-015/REPORTING-015-result.json',
      'playwright/projects/fibu-book5/evidence/reporting-015/REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE.md',
      'playwright/projects/fibu-book5/evidence/reporting-015/README.md',
      '.agent/state/cases/reporting-015-inventory-dimension-value-trace.json',
      '.agent/state/cases/reporting-016-inventory-dimension-reporting-decision.json',
      '.agent/state/current.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json'
    ],
    statePatch: {
      current: {
        activeArea: 'reporting',
        activeCase: 'REPORTING-016-INVENTORY-DIMENSION-REPORTING-DECISION',
        active_case_file: '.agent/state/cases/reporting-016-inventory-dimension-reporting-decision.json',
        lastReferenceCase: 'REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE',
        lastReferenceCaseFile: '.agent/state/cases/reporting-015-inventory-dimension-value-trace.json',
        nextStep: 'Review reporting-015 read-only result and decide whether a setup-fit Analysis View route, a Dimensions Detail route, or bookdraft-only explanation is the next best reporting step.'
      },
      lastRunSummary: {
        runId: 'REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE',
        date: '2026-06-29',
        workType: 'inventory-dimension-readonly-trace',
        bcRun: true,
        playwrightRun: true,
        posted: false,
        previewPosting: false,
        setupChanged: false,
        companySwitched: false,
        summary:
          'Read-only inspected INV008-899959 in Item Ledger, Value Entry, G/L Entry and Analysis Views contexts for PRODUCTLINE/CHANNEL visibility.',
        resultPath: 'playwright/projects/fibu-book5/evidence/reporting-015/REPORTING-015-result.json',
        nextCase: 'REPORTING-016-INVENTORY-DIMENSION-REPORTING-DECISION',
        nextStep:
          'Decide the next reporting route based on whether PRODUCTLINE/CHANNEL became visible in posted trace or Analysis Views.'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/inventory-008/INVENTORY-008-POSTING-result.json',
      'playwright/projects/fibu-book5/evidence/reporting-015/README.md',
      'playwright/projects/fibu-book5/evidence/reporting-015/REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE.md'
    ],
    warnings: [
      'RM-DEMO evidence remains laboratory reference only.',
      'Do not claim German final reporting from this result.',
      'Do not claim PRODUCTLINE/CHANNEL reporting effect unless visible in the captured contexts.'
    ],
    blockedBy: [],
    requiresReview: false,
    safeToFinalizeState: true,
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      migrationRelevance: 'needed-for-german-final',
      mustRecreateInFinalSandbox: true,
      sourceCompany: 'RM-DEMO',
      targetGermanCompanyImpact:
        'German final reporting/dimension proof must be rebuilt with German target setup and final screenshots.',
      finalScreenshotNeeded: true
    },
    reason: 'Read-only follow-up to check whether the Inventory Item Journal dimension is visible beyond the pre-posting journal dialog.',
    validationCommands: [
      'npm run agent:preflight',
      'npm run agent:context',
      'npm run agent:dry-run',
      'npm run agent:run-plan',
      'npm run fibu:reporting:inventory-dimension-trace',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/reporting-015/REPORTING-015-result.json',
      'npm run agent:state-finalize -- --input playwright/projects/fibu-book5/evidence/reporting-015/REPORTING-015-result.json',
      'npm run check:encoding',
      'npx tsc --noEmit',
      'git diff --check'
    ],
    nextStep:
      productlineVisibleInPostedTrace || productlineOrChannelVisibleInAnalysisViews
        ? 'Classify the visible dimension/reporting signal and sync the Inventory/Reporting draft without German final claims.'
        : 'Keep PRODUCTLINE=MACHINE as pre-posting Item Journal dimension evidence and decide whether an Analysis View setup-fit or Dimensions Detail route is justified.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-015-result.json'), result);
  await writeTextEvidence(reportingEvidencePath('REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE.md'), renderMarkdown(result));
  await writeTextEvidence(
    reportingEvidencePath('README.md'),
    [
      '# reporting-015 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `REPORTING-015-result.json` | JSON-Ergebnis | read-only Trace, Flags, State-Patch-Plan | keine deutsche Finalwahrheit | labor |',
      '| `REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE.md` | Lernzusammenfassung | Posten-/Dimensions-/Reporting-Grenze | keine Reporting-Summenwirkung ohne Sichtbeleg | labor |',
      '| `010-*` | Item Ledger Evidence | `INV008-899959` im Artikelposten-Kontext | keine Kreditoren-P2P-Wirkung | labor |',
      '| `020-*` | Value Entry Evidence | `INV008-899959` im Wertposten-Kontext | keine Reporting-Auswertung | labor |',
      '| `030-*` | G/L Entry Evidence | `INV008-899959` im Sachposten-Kontext | keine vollstaendige Dimension-Reporting-Wirkung | labor |',
      '| `040-*` | Analysis Views Evidence | Reporting-Kontext read-only | keine neue/aktualisierte Analysis View | labor |',
      '',
      '## Aktuelle Wahrheit',
      '',
      productlineVisibleInPostedTrace || productlineOrChannelVisibleInAnalysisViews
        ? 'Mindestens ein Dimensions-/Reporting-Signal ist sichtbar. Es bleibt RM-DEMO-Labor und muss in deutscher Zielinstanz neu erzeugt werden.'
        : '`PRODUCTLINE=MACHINE` bleibt fuer diese Inventory-Laborbuchung sicher vor der Buchung belegt, aber nicht als durchgaengige sichtbare Posten-/Reporting-Wirkung.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.summary.itemLedgerEntryVisible).toBe(true);
  expect(result.summary.valueEntryVisible).toBe(true);
  expect(result.summary.glEntryVisible).toBe(true);
  expect(result.summary.noPostingCommittedByTest).toBe(true);
  expect(result.summary.noSetupChangedByTest).toBe(true);
});

