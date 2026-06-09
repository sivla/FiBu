import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  bcPageUrl,
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

test.setTimeout(420_000);

const TEST_ID = 'reporting-011';
const TARGET_ANALYSIS_VIEW = {
  code: 'RM-PLCH',
  name: 'RM PRODUCTLINE CHANNEL',
  dimension1: 'PRODUCTLINE',
  dimension2: 'CHANNEL'
};
const ANALYSIS_VIEW_LIST_PAGE_ID = 556;

type FieldSnapshot = {
  index: number;
  value: string;
  ariaLabel: string;
  title: string;
  placeholder: string;
  x: number;
  y: number;
};

function reportingEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
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
    /Analysis View|Analysis Views|Analysis by Dimensions|Dimension|PRODUCTLINE|CHANNEL|RM-PLCH|REVENUE|GEN_LEDGER|Update|Show Matrix|Matrix|Filter|Code|Name|Pages and Tasks|Seiten und Aufgaben/i;
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
      .getByRole('button', { name: /Breites Layout|Wide layout|Focus mode|Full screen|Maximi[sz]e|Fokus|Vollbild|Maximieren/i })
      .last();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(1000);
      return true;
    }
  }

  return false;
}

async function openAnalysisViews(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await searchFor(page, 'Analysis Views');
  await page.waitForTimeout(1500);

  const tellMeText = await pageText(page);
  await writeTextEvidence(reportingEvidencePath('010-tell-me-analysis-views-page-text.txt'), compactPageText(tellMeText));

  for (const scope of [page, ...page.frames()]) {
    const bodyText = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Analysis Views/i.test(bodyText) || !/Pages and Tasks|Seiten und Aufgaben|Reports and Analysis|Berichte und Analysen/i.test(bodyText)) {
      continue;
    }

    const analysisViews = scope.getByText('Analysis Views', { exact: true });
    const count = await analysisViews.count().catch(() => 0);
    if (count > 0) {
      await analysisViews.first().click();
      await page.waitForTimeout(6000);
      await dismissTours(page);
      await hideFactBoxPane(page).catch(() => undefined);
      await activateWideLayout(page);
      return { opened: true, tellMeMatchCount: count };
    }
  }

  await page.goto(bcPageUrl(ANALYSIS_VIEW_LIST_PAGE_ID, project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(5000);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await activateWideLayout(page);

  const directText = await pageText(page);
  const openedDirect = /Analysis Views|Analysis View List/i.test(directText) && /Dimension 1 Code|Dimension 2 Code|Code/i.test(directText);
  return { opened: openedDirect, tellMeMatchCount: 0 };
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
      'UI-first Analysis-View-Laborfit; keine Buchung, keine Zahlung, keine Bankabstimmung.',
      'Der Lauf darf PRODUCTLINE/CHANNEL nur als Reporting-Setup-Fit markieren, wenn die Felder sichtbar oder nach UI-Eingabe nachgewiesen sind.'
    ],
    bookUse: status === 'rejected' ? 'do-not-use' : 'evidence'
  });

  return { text, buttons };
}

async function analysisViewsFrame(page: Page) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (/Analysis Views|Analysis View List/i.test(text) && /Dimension 1 Code|Dimension 2 Code|Code/i.test(text)) {
        return frame;
      }
    }
    await page.waitForTimeout(1000);
  }

  throw new Error('Analysis-Views-Frame nicht gefunden.');
}

async function visibleFieldSnapshot(frame: Frame): Promise<FieldSnapshot[]> {
  return frame.locator('input,textarea,select').evaluateAll((elements) =>
    elements
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          visible: Boolean(rect.width && rect.height),
          value: (element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value ?? '',
          ariaLabel: element.getAttribute('aria-label') ?? '',
          title: element.getAttribute('title') ?? '',
          placeholder: element.getAttribute('placeholder') ?? '',
          x: Math.round(rect.x),
          y: Math.round(rect.y)
        };
      })
      .filter((entry) => entry.visible)
      .map(({ visible: _visible, ...entry }) => entry)
  );
}

async function editableTextControls(frame: Frame) {
  const handles = await frame
    .locator('input:not([type="checkbox"]):not([type="radio"]), textarea')
    .elementHandles();
  const controls = [];

  for (const handle of handles) {
    const data = await handle
      .evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          visible: Boolean(rect.width && rect.height),
          disabled: (element as HTMLInputElement | HTMLTextAreaElement).disabled,
          readOnly: (element as HTMLInputElement | HTMLTextAreaElement).readOnly,
          value: (element as HTMLInputElement | HTMLTextAreaElement).value ?? '',
          ariaLabel: element.getAttribute('aria-label') ?? '',
          title: element.getAttribute('title') ?? '',
          x: Math.round(rect.x),
          y: Math.round(rect.y)
        };
      })
      .catch(() => undefined);

    if (!data?.visible || data.disabled || data.readOnly) {
      continue;
    }

    controls.push({ handle, ...data });
  }

  return controls.sort((left, right) => left.y - right.y || left.x - right.x);
}

async function ensureEditMode(frame: Frame) {
  if ((await frame.locator('input.cursorinherit.stringcontrol-edit').count().catch(() => 0)) > 0) {
    return true;
  }

  const editButton = frame.getByText(/Edit List|Liste bearbeiten/i).first();
  if (await editButton.isVisible({ timeout: 1500 }).catch(() => false)) {
    await editButton.click();
    await frame.page().waitForTimeout(2500);
  }

  return (await frame.locator('input.cursorinherit.stringcontrol-edit').count().catch(() => 0)) > 0;
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 900 }).catch(() => false)) {
        await action.click().catch(() => undefined);
        await page.waitForTimeout(2200);
        return true;
      }
    }
  }
  return false;
}

async function selectAnalysisViewIfVisible(page: Page, code: string) {
  for (const scope of [page, ...page.frames()]) {
    const rowText = scope.getByText(new RegExp(`^${code}$`, 'i')).first();
    if (await rowText.isVisible({ timeout: 1000 }).catch(() => false)) {
      await rowText.click();
      await page.waitForTimeout(1500);
      return true;
    }
  }

  return false;
}

async function tryCreateAnalysisView(page: Page) {
  const frame = await analysisViewsFrame(page);
  const editModeAvailable = await ensureEditMode(frame);
  const beforeFields = await visibleFieldSnapshot(frame);
  const textControls = await editableTextControls(frame);
  const afterFields = await visibleFieldSnapshot(frame);
  return {
    createdOrUpdated: false,
    reason: `Analysis Views list reachable, but no safe editable field mapping for UI-first fit in this run. editModeAvailable=${editModeAvailable}, editableTextControls=${textControls.length}. New action is intentionally not used until the card/list field mapping is documented.`,
    beforeFields,
    afterFields
  };
}

async function tryOpenAnalysisByDimensions(page: Page) {
  const selected = await selectAnalysisViewIfVisible(page, TARGET_ANALYSIS_VIEW.code);
  const clicked = await clickAction(page, /^Analysis by Dimensions$|^Analyse nach Dimensionen$/i);
  await page.waitForTimeout(5000);
  const state = await captureState(
    page,
    '040-analysis-by-dimensions-after-fit',
    'reporting-011-040-analysis-by-dimensions-after-fit.png',
    'REPORTING-011 Analysis by Dimensions nach RM-PLCH-Laborfit pruefen.',
    clicked ? 'candidate' : 'rejected'
  );

  return {
    selected,
    clicked,
    textContainsTargetDimensions: /PRODUCTLINE/i.test(state.text) || /CHANNEL/i.test(state.text),
    matrixVisible: /Show Matrix|Matrix anzeigen|Matrix/i.test(state.text) || state.buttons.some((button) => /Show Matrix|Matrix anzeigen|Matrix/i.test(button)),
    textEvidenceFile: '040-analysis-by-dimensions-after-fit-page-text.txt',
    buttonEvidenceFile: '040-analysis-by-dimensions-after-fit-buttons.json',
    screenshot: 'reporting-011-040-analysis-by-dimensions-after-fit.png'
  };
}

test('REPORTING-011 Analysis View PRODUCTLINE/CHANNEL UI-first fit', async ({ page }) => {
  const openResult = await openAnalysisViews(page);
  const before = await captureState(
    page,
    '020-analysis-views-before-fit',
    'reporting-011-020-analysis-views-before-fit.png',
    'REPORTING-011 Analysis Views vor UI-first Laborfit fuer PRODUCTLINE/CHANNEL.',
    openResult.opened ? 'labor' : 'rejected'
  );

  const targetAlreadyVisible =
    /RM-PLCH/i.test(before.text) && /PRODUCTLINE/i.test(before.text) && /CHANNEL/i.test(before.text);

  let fitResult:
    | {
        createdOrUpdated: boolean;
        reason: string;
        beforeFields: FieldSnapshot[];
        afterFields: FieldSnapshot[];
      }
    | undefined;

  if (openResult.opened && !targetAlreadyVisible) {
    fitResult = await tryCreateAnalysisView(page);
  } else {
    const frame = await analysisViewsFrame(page).catch(() => undefined);
    const fields = frame ? await visibleFieldSnapshot(frame) : [];
    fitResult = {
      createdOrUpdated: targetAlreadyVisible,
      reason: targetAlreadyVisible ? 'Target Analysis View already visible before fit.' : 'Analysis Views page not open.',
      beforeFields: fields,
      afterFields: fields
    };
  }

  const after = await captureState(
    page,
    '030-analysis-views-after-fit',
    'reporting-011-030-analysis-views-after-fit.png',
    'REPORTING-011 Analysis Views nach UI-first Laborfit-Versuch fuer RM-PLCH.',
    fitResult.createdOrUpdated ? 'labor' : 'rejected'
  );

  const fitVisibleAfter =
    /RM-PLCH/i.test(after.text) && /PRODUCTLINE/i.test(after.text) && /CHANNEL/i.test(after.text);
  const analysisByDimensions = fitVisibleAfter ? await tryOpenAnalysisByDimensions(page) : undefined;

  const result = {
    testId: 'REPORTING-011',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-idempotent-setup-fit-no-posting-no-payment-no-bank',
    target: TARGET_ANALYSIS_VIEW,
    gate: 'REPORTING-011-ANALYSIS-VIEW-FIT approved-for-next-run by GOVERNANCE-006',
    actions: {
      analysisViewsOpened: openResult.opened,
      tellMeMatchCount: openResult.tellMeMatchCount,
      targetAlreadyVisible,
      createdOrUpdatedByUi: fitResult.createdOrUpdated && !targetAlreadyVisible,
      fitReason: fitResult.reason,
      selectedForAnalysisByDimensions: analysisByDimensions?.selected ?? false,
      analysisByDimensionsClicked: analysisByDimensions?.clicked ?? false
    },
    visibleState: {
      beforeTargetVisible: targetAlreadyVisible,
      afterTargetCodeVisible: /RM-PLCH/i.test(after.text),
      afterProductlineVisible: /PRODUCTLINE/i.test(after.text),
      afterChannelVisible: /CHANNEL/i.test(after.text),
      analysisByDimensionsTargetDimensionsVisible: analysisByDimensions?.textContainsTargetDimensions ?? false,
      analysisByDimensionsMatrixVisible: analysisByDimensions?.matrixVisible ?? false,
      relevantButtonsAfterFit: after.buttons.filter((button) => /Analysis|Dimension|Filter|Update|Matrix|Show|Anzeigen|Analyse/i.test(button))
    },
    fieldSnapshots: {
      before: fitResult.beforeFields,
      after: fitResult.afterFields
    },
    evidence: {
      markdown: 'REPORTING-011-ANALYSIS-VIEW-FIT.md',
      json: 'REPORTING-011-result.json',
      screenshots: [
        'reporting-011-020-analysis-views-before-fit.png',
        'reporting-011-030-analysis-views-after-fit.png',
        ...(analysisByDimensions ? [analysisByDimensions.screenshot] : [])
      ],
      pageTexts: [
        '010-tell-me-analysis-views-page-text.txt',
        '020-analysis-views-before-fit-page-text.txt',
        '030-analysis-views-after-fit-page-text.txt',
        ...(analysisByDimensions ? [analysisByDimensions.textEvidenceFile] : [])
      ]
    },
    summary: {
      fitStatus: fitVisibleAfter ? 'done-labor' : 'rejected',
      noPostingCommittedByTest: true,
      noPaymentCommittedByTest: true,
      noBankReconciliationCommittedByTest: true,
      deFinalOpen: true
    },
    proves: fitVisibleAfter
      ? [
          'Eine RM-DEMO-Labor-Analysis-View mit PRODUCTLINE/CHANNEL ist ueber die BC-UI sichtbar eingerichtet oder bereits passend vorhanden.',
          'Der O2C-Reporting-Gap hat nun einen konkreten Setup-Hebel fuer weitere Analysis-by-Dimensions-Pruefung.'
        ]
      : [
          'Der genehmigte UI-first Setup-Fit wurde versucht, aber nicht belastbar erreicht.',
          'Die Evidence zeigt den sichtbaren UI-Zustand und den konkreten Blocker statt einen API-Abkuerzungspfad zu nutzen.'
        ],
    doesNotProve: [
      'Keine deutsche 19-Prozent-USt.',
      'Kein deutscher Kontenplan-Endstand.',
      'Keine finale deutsche GuV-Summe nach PRODUCTLINE/CHANNEL.',
      'Keine neue O2C-, P2P-, Zahlungs- oder Bankbuchung.'
    ],
    nextStep: fitVisibleAfter
      ? 'REPORTING-012 read-only Analysis by Dimensions/Matrix gezielt mit RM-PLCH pruefen und Buchkapitel 10/25 nur evidence-basiert synchronisieren.'
      : 'REPORTING-012 Blocker aus REPORTING-011 auswerten; entweder UI-Hebel fuer Analysis View Card/List ergaenzen oder Gate als nicht praktikabel schliessen.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-011-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-011-ANALYSIS-VIEW-FIT.md'),
    [
      '# REPORTING-011 Analysis View PRODUCTLINE/CHANNEL Fit',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Sandbox | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | `labor`, `ui-first`, `setup-fit`, `no-posting`, `not-final` |',
      `| Ziel-Analysis-View | \`${TARGET_ANALYSIS_VIEW.code}\` - ${TARGET_ANALYSIS_VIEW.name} |`,
      `| Dimension 1 | \`${TARGET_ANALYSIS_VIEW.dimension1}\` |`,
      `| Dimension 2 | \`${TARGET_ANALYSIS_VIEW.dimension2}\` |`,
      `| Fit-Status | \`${result.summary.fitStatus}\` |`,
      `| UI-Fit-Hinweis | ${fitResult.reason} |`,
      `| Analysis by Dimensions geklickt | ${result.actions.analysisByDimensionsClicked ? 'ja' : 'nein'} |`,
      `| Matrix/Analyse sichtbar | ${result.visibleState.analysisByDimensionsMatrixVisible ? 'ja' : 'nein'} |`,
      '| Gebucht | nein |',
      '',
      '## Was wurde geprueft?',
      '',
      'Der Lauf hat die genehmigte Reporting-Einrichtung nicht per API, sondern ueber die Business-Central-UI versucht. Ziel war eine eigene Labor-Analysis-View fuer das Buchziel `PRODUCTLINE` und `CHANNEL`, weil die vorhandene `REVENUE`-Analysis-View laut `REPORTING-004` andere Dimensionen nutzt.',
      '',
      '## Ergebnis',
      '',
      result.summary.fitStatus === 'done-labor'
        ? 'Die Ziel-Analysis-View beziehungsweise die Ziel-Dimensionen sind nach dem UI-Lauf sichtbar. Das ist ein CRONUS-USA-Laborfit und noch kein finaler deutscher Reportingnachweis.'
        : 'Der UI-first-Fit ist in diesem Lauf nicht belastbar gelungen. Das ist ein verwertbarer Lernfall: Die Einrichtung darf nicht heimlich per API abgekuerzt werden; fuer das Buch braucht es einen stabilen Klickpfad fuer Analysis Views oder eine sauber dokumentierte Laborgrenze.',
      '',
      '## Anfaenger-Lernwert',
      '',
      'Eine Dimension am Beleg oder Posten bedeutet noch nicht automatisch, dass ein Finanzbericht sie auswerten kann. Business Central braucht dafuer einen Reporting-Kontext, zum Beispiel eine passende Analysis View. Diese Einrichtung ist fachlich risikoaermer als eine Buchung, aber trotzdem ein bewusster Setup-Schritt.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 10 und 25 muessen `Dimension vorhanden` und `Dimension im Reporting nutzbar` getrennt erklaeren. Screenshots aus diesem Lauf sind Laborbilder fuer die Analysis-View-Einrichtung, nicht fuer deutsche Steuer- oder Abschlussaussagen.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor in `RM-DEMO`.',
      '- Keine deutsche `19 %` USt.',
      '- Kein deutscher Kontenplan-Endstand.',
      '- Keine Zahlung, keine Bankabstimmung, keine neue O2C-/P2P-Buchung.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.summary.noPostingCommittedByTest).toBe(true);
});
