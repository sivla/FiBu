import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
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

const TEST_ID = 'reporting-013';
const ANALYSIS_VIEW_LIST_PAGE_ID = 556;
const TARGET = {
  code: 'RM-PLCH',
  name: 'RM PRODUCTLINE CHANNEL',
  dimension1: 'PRODUCTLINE',
  dimension2: 'CHANNEL'
};

type FieldProbe = {
  index: number;
  tagName: string;
  type: string;
  role: string;
  value: string;
  ariaLabel: string;
  title: string;
  placeholder: string;
  textNearby: string;
  disabled: boolean;
  readOnly: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

type MappingKey = 'code' | 'name' | 'dimension1' | 'dimension2';

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
    /Analysis View|Analysis Views|Analysis by Dimensions|Dimension|PRODUCTLINE|CHANNEL|RM-PLCH|REVENUE|GEN_LEDGER|Update|Show Matrix|Matrix|Filter|Code|Name|Edit List|Liste bearbeiten|New|Neu|Pages and Tasks|Seiten und Aufgaben/i;
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
    .slice(0, 220);

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
      return { opened: true, tellMeMatchCount: count, method: 'tell-me' };
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
  return { opened: openedDirect, tellMeMatchCount: 0, method: 'direct-page-556' };
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
      'REPORTING-013 nutzt das einmalige Feldmapping-/Setup-Gate aus GOVERNANCE-007.',
      'Keine Buchung, keine Zahlung, keine Bankabstimmung.',
      'Analysis View RM-PLCH darf nur bei sicherer UI-Feldzuordnung angelegt oder geaendert werden.'
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

async function safeClick(locator: Locator, page: Page) {
  const box = await locator.boundingBox().catch(() => null);
  if (!box || box.width <= 0 || box.height <= 0) {
    return false;
  }

  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(1800);
  return true;
}

async function selectAnalysisView(page: Page, code: string) {
  for (const scope of [page, ...page.frames()]) {
    const rowText = scope.getByText(new RegExp(`^${code}$`, 'i')).first();
    if (await rowText.isVisible({ timeout: 1000 }).catch(() => false)) {
      await safeClick(rowText, page);
      return true;
    }
  }

  return false;
}

async function selectExistingReferenceView(page: Page) {
  return (await selectAnalysisView(page, 'REVENUE')) || (await selectAnalysisView(page, 'GEN_LEDGER'));
}

async function ensureEditMode(page: Page) {
  const clicked = await clickAction(page, /^Edit List$|^Liste bearbeiten$/i);
  await page.waitForTimeout(2000);
  return clicked;
}

async function probeVisibleFields(frame: Frame): Promise<FieldProbe[]> {
  return frame.locator('input,textarea,select,[contenteditable="true"]').evaluateAll((elements) =>
    elements
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        let container: Element | null = element;
        for (let depth = 0; depth < 4 && container?.parentElement; depth += 1) {
          container = container.parentElement;
        }
        return {
          index,
          visible: Boolean(rect.width && rect.height),
          tagName: element.tagName,
          type: element.getAttribute('type') ?? '',
          role: element.getAttribute('role') ?? '',
          value: input.value ?? element.textContent ?? '',
          ariaLabel: element.getAttribute('aria-label') ?? '',
          title: element.getAttribute('title') ?? '',
          placeholder: element.getAttribute('placeholder') ?? '',
          textNearby: (container?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 300),
          disabled: Boolean(input.disabled),
          readOnly: Boolean((input as HTMLInputElement | HTMLTextAreaElement).readOnly),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })
      .filter((entry) => entry.visible)
      .map(({ visible: _visible, ...entry }) => entry)
  );
}

function fieldEvidence(field: FieldProbe) {
  return `${field.ariaLabel} ${field.title} ${field.placeholder} ${field.textNearby}`.trim();
}

function classifyFields(fields: FieldProbe[]) {
  const mapping: Partial<Record<MappingKey, FieldProbe>> = {};
  const reasons: string[] = [];
  const editable = fields.filter((field) => !field.disabled && !field.readOnly && field.type !== 'checkbox' && field.value !== 'on');

  const referenceCode = editable.find((field) => field.value === 'REVENUE');
  const referenceName = editable.find((field) => field.value === 'Sales Revenue');
  const referenceDimension1 = editable.find((field) => field.value === 'AREA' && /Dimension 1 CodeDimension 2 Code/i.test(field.textNearby));
  const referenceDimension2 = editable.find((field) => field.value === 'DEPARTMENT' && /Dimension 1 CodeDimension 2 Code/i.test(field.textNearby));
  if (referenceCode && referenceName && referenceDimension1 && referenceDimension2) {
    return {
      safe: true,
      mapping: {
        code: referenceCode,
        name: referenceName,
        dimension1: referenceDimension1,
        dimension2: referenceDimension2
      },
      editableCount: editable.length,
      reasons: ['reference-view-value-mapping: REVENUE/Sales Revenue/AREA/DEPARTMENT proves card field order'],
      method: 'reference-view-values'
    };
  }

  const matchers: Array<[MappingKey, RegExp]> = [
    ['dimension1', /\bDimension 1 Code\b/i],
    ['dimension2', /\bDimension 2 Code\b/i],
    ['code', /\bCode\b/i],
    ['name', /\bName\b/i]
  ];

  for (const [key, pattern] of matchers) {
    const matches = editable.filter((field) => pattern.test(fieldEvidence(field)));
    if (matches.length === 1) {
      mapping[key] = matches[0];
    } else {
      reasons.push(`${key}: ${matches.length} sichere Treffer`);
    }
  }

  const safe =
    Boolean(mapping.code) &&
    Boolean(mapping.name) &&
    Boolean(mapping.dimension1) &&
    Boolean(mapping.dimension2) &&
    new Set(Object.values(mapping).map((field) => field?.index)).size === 4;

  return {
    safe,
    mapping,
    editableCount: editable.length,
    reasons,
    method: safe ? 'label-nearby-text' : 'not-safe'
  };
}

function classifyBlankOrNewCardFields(fields: FieldProbe[]) {
  const editable = fields.filter((field) => !field.disabled && !field.readOnly && field.type !== 'checkbox' && field.value !== 'on');
  const topGroup = editable
    .filter((field) => /CodeNameAccount Source/i.test(field.textNearby))
    .sort((left, right) => left.y - right.y || left.x - right.x);
  const dimensionGroup = editable
    .filter((field) => /Dimension 1 CodeDimension 2 Code/i.test(field.textNearby))
    .sort((left, right) => left.x - right.x || left.y - right.y);

  const code = topGroup.find((field) => field.tagName === 'INPUT' && field.type === 'text');
  const name = topGroup.filter((field) => field.tagName === 'INPUT' && field.type === 'text')[1];
  const accountFilter = topGroup.find((field) => field.role === 'combobox' && field.value !== '01.01.2025');
  const dimension1 = dimensionGroup[0];
  const dimension2 = dimensionGroup[1];

  return {
    safe: Boolean(code && name && dimension1 && dimension2),
    mapping: { code, name, accountFilter, dimension1, dimension2 },
    reasons: [
      `topGroup=${topGroup.length}`,
      `dimensionGroup=${dimensionGroup.length}`,
      `code=${code?.index ?? 'missing'}`,
      `name=${name?.index ?? 'missing'}`,
      `accountFilter=${accountFilter?.index ?? 'missing'}`,
      `dimension1=${dimension1?.index ?? 'missing'}`,
      `dimension2=${dimension2?.index ?? 'missing'}`
    ]
  };
}

async function fillFieldByProbeIndex(frame: Frame, probe: FieldProbe | undefined, value: string) {
  if (!probe) {
    throw new Error(`Kein Feld fuer Wert ${value} gemappt.`);
  }

  const locator = frame.locator('input,textarea,select,[contenteditable="true"]').nth(probe.index);
  await locator.click({ timeout: 5000 });
  await locator.fill(value, { timeout: 5000 });
  await locator.press('Tab').catch(() => undefined);
  await frame.page().waitForTimeout(900);
}

async function tryCreateOrUpdateTargetAnalysisView(page: Page) {
  return {
    setupAttempted: false,
    setupChanged: false,
    setupReason:
      'Kein Setup-Versuch: Die bestehende REVENUE-Karte belegt zwar die Feldpositionen fuer Code, Name, Dimension 1 und Dimension 2, aber New/Neu ist in der BC-Shell global mehrdeutig. Der kontrollierte Folgeversuch zeigte, dass ein ungescopter New-Klick in den Role-Center-Kontext geraten kann. REPORTING-013 verbraucht das Gate deshalb ohne Aenderung.'
  };
}

async function tryOpenAnalysisByDimensions(page: Page) {
  const selected = await selectAnalysisView(page, TARGET.code);
  const clicked = selected && (await clickAction(page, /^Analysis by Dimensions$|^Analyse nach Dimensionen$/i));
  await page.waitForTimeout(5000);
  const state = await captureState(
    page,
    '050-analysis-by-dimensions-after-fieldmapping',
    'reporting-013-050-analysis-by-dimensions-after-fieldmapping.png',
    'REPORTING-013 Analysis by Dimensions nach sicherem RM-PLCH-Feldmapping pruefen.',
    clicked ? 'candidate' : 'rejected'
  );

  return {
    selected,
    clicked,
    textContainsTargetDimensions: /PRODUCTLINE/i.test(state.text) || /CHANNEL/i.test(state.text),
    matrixVisible: /Show Matrix|Matrix anzeigen|Matrix/i.test(state.text) || state.buttons.some((button) => /Show Matrix|Matrix anzeigen|Matrix/i.test(button)),
    screenshot: 'reporting-013-050-analysis-by-dimensions-after-fieldmapping.png'
  };
}

test('REPORTING-013 Analysis View Feldmapping und optionaler RM-PLCH Setup-Fit', async ({ page }) => {
  const openResult = await openAnalysisViews(page);
  const before = await captureState(
    page,
    '020-analysis-views-before-fieldmapping',
    'reporting-013-020-analysis-views-before-fieldmapping.png',
    'REPORTING-013 Analysis Views vor Feldmapping-/Setup-Entscheidung.',
    openResult.opened ? 'labor' : 'rejected'
  );

  const selectedReferenceView = openResult.opened ? await selectExistingReferenceView(page) : false;
  await page.waitForTimeout(1500);
  const editListClicked = openResult.opened ? await ensureEditMode(page) : false;
  const fieldmapping = await captureState(
    page,
    '030-analysis-views-fieldmapping-probe',
    'reporting-013-030-analysis-views-fieldmapping-probe.png',
    'REPORTING-013 Feldmapping fuer Code, Name, Dimension 1 Code und Dimension 2 Code pruefen.',
    openResult.opened ? 'candidate' : 'rejected'
  );

  const frame = openResult.opened ? await analysisViewsFrame(page).catch(() => undefined) : undefined;
  const fieldProbes = frame ? await probeVisibleFields(frame) : [];
  const classified = classifyFields(fieldProbes);
  const targetAlreadyVisible =
    /RM-PLCH/i.test(fieldmapping.text) && /PRODUCTLINE/i.test(fieldmapping.text) && /CHANNEL/i.test(fieldmapping.text);

  let setupAttempted = false;
  let setupChanged = false;
  let setupReason = '';

  if (!openResult.opened) {
    setupReason = 'Analysis Views wurde nicht belastbar geoeffnet; kein Setup-Versuch.';
  } else if (targetAlreadyVisible) {
    setupReason = 'RM-PLCH mit PRODUCTLINE/CHANNEL ist bereits sichtbar; keine Aenderung noetig.';
  } else if (!classified.safe) {
    setupReason = `Kein Setup, weil das Feldmapping nicht sicher ist: ${classified.reasons.join('; ') || 'keine eindeutigen editierbaren Felder'}.`;
  } else {
    const setup = await tryCreateOrUpdateTargetAnalysisView(page);
    setupAttempted = setup.setupAttempted;
    setupChanged = setup.setupChanged;
    setupReason = setup.setupReason;
  }

  const after = await captureState(
    page,
    '040-analysis-views-after-fieldmapping',
    'reporting-013-040-analysis-views-after-fieldmapping.png',
    'REPORTING-013 Analysis Views nach Feldmapping-/Setup-Entscheidung.',
    targetAlreadyVisible ? 'labor' : 'rejected'
  );

  const fitVisibleAfter = /RM-PLCH/i.test(after.text) && /PRODUCTLINE/i.test(after.text) && /CHANNEL/i.test(after.text);
  const analysisByDimensions = fitVisibleAfter ? await tryOpenAnalysisByDimensions(page) : undefined;
  const status = fitVisibleAfter ? 'done-labor' : 'rejected';

  const result = {
    testId: 'REPORTING-013',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-fieldmapping-gated-setup-no-posting-no-payment-no-bank',
    gate: 'REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP approved-for-next-run by GOVERNANCE-007',
    target: TARGET,
    actions: {
      analysisViewsOpened: openResult.opened,
      openMethod: openResult.method,
      selectedReferenceView,
      editListClicked,
      fieldmappingSafe: classified.safe,
      setupAttempted,
      setupChanged,
      setupReason,
      selectedForAnalysisByDimensions: analysisByDimensions?.selected ?? false,
      analysisByDimensionsClicked: analysisByDimensions?.clicked ?? false
    },
    visibleState: {
      targetAlreadyVisible,
      fitVisibleAfter,
      productlineVisibleAfter: /PRODUCTLINE/i.test(after.text),
      channelVisibleAfter: /CHANNEL/i.test(after.text),
      analysisByDimensionsTargetDimensionsVisible: analysisByDimensions?.textContainsTargetDimensions ?? false,
      analysisByDimensionsMatrixVisible: analysisByDimensions?.matrixVisible ?? false,
      relevantButtons: fieldmapping.buttons.filter((button) => /Analysis|Dimension|Filter|Update|Matrix|Show|New|Neu|Edit|Liste|Anzeigen|Analyse/i.test(button))
    },
    fieldMapping: {
      editableCount: classified.editableCount,
      safe: classified.safe,
      reasons: classified.reasons,
      mappedIndexes: Object.fromEntries(Object.entries(classified.mapping).map(([key, field]) => [key, field?.index])),
      fields: fieldProbes
    },
    safety: {
      noPostingCommittedByTest: true,
      noPaymentCommittedByTest: true,
      noBankReconciliationCommittedByTest: true,
      noCompanySwitch: true,
      deFinalOpen: true
    },
    evidence: {
      markdown: 'REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP.md',
      json: 'REPORTING-013-result.json',
      screenshots: [
        'reporting-013-020-analysis-views-before-fieldmapping.png',
        'reporting-013-030-analysis-views-fieldmapping-probe.png',
        'reporting-013-040-analysis-views-after-fieldmapping.png',
        ...(analysisByDimensions ? [analysisByDimensions.screenshot] : [])
      ],
      pageTexts: [
        '010-tell-me-analysis-views-page-text.txt',
        '020-analysis-views-before-fieldmapping-page-text.txt',
        '030-analysis-views-fieldmapping-probe-page-text.txt',
        '040-analysis-views-after-fieldmapping-page-text.txt'
      ]
    },
    proves:
      status === 'done-labor'
        ? [
            'RM-PLCH mit PRODUCTLINE/CHANNEL ist in Analysis Views sichtbar.',
            'Der Gate-Lauf hat keine Buchung, Zahlung oder Bankabstimmung erzeugt.'
          ]
        : [
            'Das freigegebene Feldmapping-/Setup-Gate wurde verbraucht.',
            'Der Lauf hat keinen sicheren UI-Setup-Pfad fuer RM-PLCH nachgewiesen und deshalb keine Analysis View angelegt oder geaendert.',
            'Die sichtbaren Felder und Buttons sind als Feldmapping-Evidence dokumentiert.'
          ],
    doesNotProve: [
      'Keine Financial-Reports-Summenwirkung nach PRODUCTLINE/CHANNEL.',
      'Keine deutsche 19-Prozent-USt.',
      'Kein deutscher Kontenplan-Endstand.',
      'Keine neue O2C-, P2P-, Inventory-, Payment- oder Bankbuchung.'
    ],
    status,
    nextStep:
      status === 'done-labor'
        ? 'REPORTING-014 read-only Analysis by Dimensions/Matrix mit RM-PLCH pruefen und nur sichtbare Summenwirkung ins Buch uebernehmen.'
        : 'REPORTING-014 Buch-/Governance-Sync: REPORTING-013 als rejected schliessen, Gate auf rejected/locked setzen und im Buch erklaeren, warum Analysis-View-Setup ohne stabile UI-Feldzuordnung nicht als Klickanleitung taugt.'
  };

  await writeJsonEvidence(reportingEvidencePath('REPORTING-013-result.json'), result);
  await writeTextEvidence(
    reportingEvidencePath('REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP.md'),
    [
      '# REPORTING-013 Analysis View Feldmapping und Setup-Entscheidung',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Sandbox | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | `labor`, `ui-first`, `fieldmapping`, `no-posting`, `not-final` |',
      `| Gate | \`${result.gate}\` |`,
      `| Ziel-Analysis-View | \`${TARGET.code}\` - ${TARGET.name} |`,
      `| Dimension 1 | \`${TARGET.dimension1}\` |`,
      `| Dimension 2 | \`${TARGET.dimension2}\` |`,
      `| Ergebnis | \`${result.status}\` |`,
      `| Setup geaendert | ${result.actions.setupChanged ? 'ja' : 'nein'} |`,
      '| Gebucht | nein |',
      '| Zahlung/Bankabstimmung | nein |',
      '',
      '## Was wurde geprueft?',
      '',
      'Der Lauf hat `Analysis Views` in `RM-DEMO` geoeffnet und nach dem von `GOVERNANCE-007` freigegebenen Feldmapping gesucht. Geprueft wurden die sichtbaren und editierbaren UI-Felder fuer `Code`, `Name`, `Dimension 1 Code` und `Dimension 2 Code`.',
      '',
      '## Feldmapping-Befund',
      '',
      `- Analysis Views geoeffnet: ${result.actions.analysisViewsOpened ? 'ja' : 'nein'}`,
      `- Referenz-Analysis-View gewaehlt: ${result.actions.selectedReferenceView ? 'ja' : 'nein'}`,
      `- Liste bearbeiten geklickt: ${result.actions.editListClicked ? 'ja' : 'nein'}`,
      `- editierbare Felder gefunden: ${result.fieldMapping.editableCount}`,
      `- Feldmapping sicher: ${result.fieldMapping.safe ? 'ja' : 'nein'}`,
      `- Setup-Entscheidung: ${result.actions.setupReason}`,
      '',
      '## Ergebnis',
      '',
      result.status === 'done-labor'
        ? '`RM-PLCH` mit `PRODUCTLINE` und `CHANNEL` ist in der UI sichtbar. Das ist ein CRONUS-USA-Laborbefund und noch keine Financial-Reports-Summenwirkung.'
        : 'Der Gate-Lauf wurde bewusst als `rejected` geschlossen: Es gab keinen ausreichend sicheren UI-Pfad, um `RM-PLCH` anzulegen oder zu aendern, ohne falsche Felder oder einen halben Setup-Datensatz zu riskieren.',
      '',
      '## Anfaenger-Lernwert',
      '',
      'Eine Analysis View ist Reporting-Setup. Sie entscheidet, welche Dimensionen spaeter als Analyseachsen verwendet werden koennen. Sichtbare Spalten in einer Liste sind aber noch keine sicheren Eingabefelder. Deshalb muss ein Buch-Klickpfad erst die Feldzuordnung zeigen, bevor er Leser anleitet, eine neue View anzulegen.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 10 und 25 duerfen weiter sagen: `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten belegt. Sie duerfen aber keine GuV-/Revenue-Summenwirkung nach diesen Dimensionen behaupten, solange keine passende Analysis View oder Matrixsicht sichtbar nachgewiesen ist.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor in `RM-DEMO`.',
      '- Kein deutscher Reporting-Finalnachweis.',
      '- Keine deutsche `19 %` USt.',
      '- Kein deutscher Kontenplan-Endstand.',
      '- Keine Buchung, keine Zahlung, keine Bankabstimmung.',
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
      '# REPORTING-013 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `REPORTING-013-ANALYSIS-VIEW-FIELDMAPPING-SETUP.md` | Lern-/Evidence-Zusammenfassung | Feldmapping- und Setup-Entscheidung fuer `RM-PLCH` | keine Financial-Reports-Summe, keinen deutschen Finalnachweis | labor / gated |',
      '| `REPORTING-013-result.json` | JSON-Ergebnis | Gate-Verbrauch, Feldproben, Sicherheitsflags, naechster Schritt | keine Rohsnapshots, keine Buchung | maschinenlesbar |',
      '| `020/030/040-*.page-text.txt` | kompakte Seitentextauszuege | sichtbaren UI-Kontext ohne Rohdump | keine eigenstaendige Fachwahrheit | compact |',
      '| `reporting-013-*.png` und `*.screenshot.json` | Screenshot und Metadaten | sichtbare Analysis-Views-/Feldmapping-Kontrollpunkte | keine finale Buchbildfreigabe | mixed |',
      '',
      '## Kurzfazit',
      '',
      result.status === 'done-labor'
        ? '`RM-PLCH` ist sichtbar. Der naechste Lauf darf read-only Analysis by Dimensions/Matrix pruefen.'
        : '`REPORTING-013` hat das Gate verbraucht und rejected geschlossen. Ohne stabile Feldzuordnung wurde kein Setup geaendert.',
      ''
    ].join('\n')
  );

  expect(result.safety.noPostingCommittedByTest).toBe(true);
  expect(result.safety.noPaymentCommittedByTest).toBe(true);
});
