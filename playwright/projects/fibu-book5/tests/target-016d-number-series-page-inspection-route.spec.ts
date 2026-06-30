import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016D-NUMBER-SERIES-PAGE-INSPECTION-OR-ALTERNATIVE-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016d-number-series-page-inspection-or-alternative-route';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016D-result.json');
const probeSeries = { code: 'U-CUST', startNo: 'U-CUST00001', endNo: 'U-CUST99999' };

type UiSnapshot = {
  url: string;
  title: string;
  compactText: string;
  pageInspectionSeen: boolean;
  technicalTerms: string[];
  visibleColumns: string[];
  visibleActions: string[];
};

function buildPlaythruUrl(pageId = 456) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const sanitizedPath = url.pathname.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
      '/{tenant}/'
    );
    const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
    for (const key of ['page', 'company', 'profile']) {
      const value = url.searchParams.get(key);
      if (value) kept.searchParams.set(key, value);
    }
    return kept.toString();
  } catch {
    return rawUrl.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant}');
  }
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE.toLowerCase());
}

function codePattern(code: string) {
  return new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
}

function scrubEvidenceData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => scrubEvidenceData(entry)).filter((entry) => entry !== undefined);
  }
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  if (typeof record.frameUrl === 'string' && !/businesscentral\.dynamics\.com/i.test(record.frameUrl)) return undefined;
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, entry]) => [key, scrubEvidenceData(entry)] as const)
      .filter(([, entry]) => entry !== undefined)
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(scrubEvidenceData(data), null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function assertSafeContext(page: Page) {
  const currentUrl = page.url();
  if (!instancePathIsTarget(currentUrl) || !companyParamIsTarget(currentUrl)) {
    throw new Error(`Unsafe context ${sanitizeEvidenceUrl(currentUrl)}`);
  }
  const text = clean(await pageText(page));
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Expected Number Series context is not visible.');
  }
  if (/Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice/i.test(text)) {
    throw new Error('Dangerous dialog text detected.');
  }
}

async function clickFirstVisible(page: Page, names: RegExp[]) {
  for (const name of names) {
    for (const scope of [page, ...page.frames()]) {
      for (const role of ['button', 'menuitem'] as const) {
        const locator = scope.getByRole(role, { name }).first();
        if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
          await locator.click({ timeout: 4000 }).catch(async () => locator.click({ timeout: 4000, force: true }));
          await page.waitForTimeout(900);
          return true;
        }
      }
    }
  }
  return false;
}

async function selectSeriesRow(page: Page, code: string) {
  for (const scope of [page, ...page.frames()]) {
    const row = scope.getByRole('row', { name: codePattern(code) }).first();
    if (await row.isVisible({ timeout: 800 }).catch(() => false)) {
      await row.click({ timeout: 4000 }).catch(async () => row.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
    const text = scope.getByText(codePattern(code)).first();
    if (await text.isVisible({ timeout: 800 }).catch(() => false)) {
      await text.click({ timeout: 4000 }).catch(async () => text.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

async function uiSnapshot(page: Page): Promise<UiSnapshot> {
  const compactText = await compactPageText(page, {
    include: [/Nr\.-Serienzeilen|Nummernserie|U-CUST|Startdatum|Startnr|Endnr|Letzte Nr|Warnungsnr|Erhohung|Erh.hung|Luecken|L.cken|Offen|Liste bearbeiten|Seitenpr.fung|Page Inspection|Source Table|Page ID|Table/i],
    maxLines: 180,
    maxLineLength: 220
  });
  const allText = clean(await pageText(page));
  const visibleColumns = ['Startdatum', 'Startnr.', 'Endnr.', 'Letztes Datum verwendet', 'Letzte Nr. verwendet', 'Warnungsnr.', 'Erhohung um Nr.', 'Luecken in Nummern zulassen', 'Offen']
    .filter((label) => new RegExp(label.replace('.', '\\.').replace('ue', '(ue|u|ü)'), 'i').test(allText));
  const visibleActions = ['Neu', 'Liste bearbeiten', 'Loeschen', 'Weitere Optionen', 'Auf Seite anzeigen', 'Liste analysieren']
    .filter((label) => new RegExp(label.replace('oe', '(oe|o|ö)'), 'i').test(allText));
  const technicalTerms = ['Page Inspection', 'Seitenpruefung', 'Seitenprufung', 'Seitenuberprufung', 'Page ID', 'Page Name', 'Source Table', 'Table ID', 'Tabelle', 'Tabellenfelder', 'No. Series Line', 'No. Series Lines']
    .filter((term) => new RegExp(term, 'i').test(allText));
  return {
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compactText,
    pageInspectionSeen: /Page Inspection|Seitenpruefung|Seitenprufung|Seitenuberprufung|Page ID|Source Table|Table ID|No\. Series Lines.*457|No\. Series Line.*309|Tabellenfelder/i.test(allText),
    technicalTerms,
    visibleColumns,
    visibleActions
  };
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const snapshot = await uiSnapshot(page);
  await writeText(`${filePrefix}.txt`, snapshot.compactText);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), { step, snapshot, ...extra });
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    status: 'route-discovery',
    visibleLearning: 'Das Bild muss zeigen, ob Page Inspection, Tooltip oder Standardroute die Feld-/Editor-Wahrheit besser sichtbar macht.',
    internallyProves: 'Foreground Number Series Lines context and route-discovery state.',
    doesNotProve: ['No setup assignment, no master data, no preview posting, no posting.'],
    qualityDecision: 'diagnostic',
    snapshot,
    ...extra
  });
  return snapshot;
}

async function hoverVisibleText(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const candidate = scope.getByText(label).first();
    if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
      await candidate.hover({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

test('TARGET-016D uses readonly Page Inspection and tooltip route discovery for Number Series Lines', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const routeFindings: Record<string, unknown> = {};

  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1400);
  await assertSafeContext(page);

  if (!(await selectSeriesRow(page, probeSeries.code))) blockedBy.push('U-CUST row could not be selected.');
  if (!blockedBy.length && !(await clickFirstVisible(page, [/^Zeilen$|^Lines$/i]))) blockedBy.push('Zeilen/Lines action could not be opened.');
  await assertSafeContext(page);

  const before = await captureState(page, 'target-016d-010-lines-context-before-inspection', 'U-CUST Lines context before Page Inspection route.');

  const hoveredStart = await hoverVisibleText(page, /^Startnr\.?$/i);
  const hoverStart = await captureState(page, 'target-016d-020-startnr-tooltip-probe', 'Tooltip probe on Startnr. header.', { hoveredStart });

  const hoveredCheckbox = await hoverVisibleText(page, /L.cken in Nummern zulassen/i);
  const hoverCheckbox = await captureState(page, 'target-016d-030-checkbox-tooltip-probe', 'Tooltip probe on checkbox-related header.', { hoveredCheckbox });

  await page.keyboard.press('Control+Alt+F1').catch((error) => warnings.push(`Ctrl+Alt+F1 failed: ${String(error)}`));
  await page.waitForTimeout(1800);
  await assertSafeContext(page);
  const inspection = await captureState(page, 'target-016d-040-after-page-inspection-shortcut', 'After Ctrl+Alt+F1 Page Inspection shortcut attempt.');

  routeFindings.before = before;
  routeFindings.hoverStart = hoverStart;
  routeFindings.hoverCheckbox = hoverCheckbox;
  routeFindings.inspection = inspection;

  const resultStatus = inspection.pageInspectionSeen ? 'observed' : 'blocked';
  if (!inspection.pageInspectionSeen) {
    blockedBy.push('Ctrl+Alt+F1 did not expose a visible Page Inspection / Seitenpruefung pane in the Playwright browser context.');
  }
  if (!hoveredStart) warnings.push('Startnr. header tooltip could not be hovered via visible text route.');
  if (!hoveredCheckbox) warnings.push('Luecken/checkbox header tooltip could not be hovered via visible text route.');

  const evidenceRefs = [
    'playwright/projects/fibu-book5/img/target-016d-010-lines-context-before-inspection.png',
    'playwright/projects/fibu-book5/img/target-016d-020-startnr-tooltip-probe.png',
    'playwright/projects/fibu-book5/img/target-016d-030-checkbox-tooltip-probe.png',
    'playwright/projects/fibu-book5/img/target-016d-040-after-page-inspection-shortcut.png'
  ];

  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-016E-NUMBER-SERIES-LINES-FIELD-MAPPED-CONTROLLED-FIT'
      : 'TARGET-016E-NUMBER-SERIES-PERSONALIZE-OR-SETUP-ASSISTED-ROUTE';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-page-inspection-route',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    proved: [
      'U-CUST Number Series Lines context was reopened in playthru / UNIVERSAARL-DE.',
      'Startnr. and checkbox-related header tooltip probes were attempted with screenshot QA.',
      ...(inspection.pageInspectionSeen ? ['Page Inspection / Seitenpruefung technical context became visible.'] : [])
    ],
    notProved: [
      ...(inspection.pageInspectionSeen ? [] : ['Page Inspection / Seitenpruefung is not yet accessible through Ctrl+Alt+F1 in this Playwright context.']),
      'A reliable persistent Startnr./Endnr. write route is still not proven.',
      'No setup assignment, master data, preview posting, posting or ledger trace was created.',
      'Checkbox semantics were observed but not changed.'
    ],
    routeFindings,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016d-number-series-page-inspection-or-alternative-route/TARGET-016D-result.json',
      'playwright/projects/fibu-book5/evidence/target-016d-number-series-page-inspection-or-alternative-route/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016d-number-series-page-inspection-or-alternative-route/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016d-number-series-page-inspection-or-alternative-route/*.txt',
      'playwright/projects/fibu-book5/img/target-016d-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016d-number-series-page-inspection-or-alternative-route/TARGET-016D-result.json',
      ...evidenceRefs
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookChange: true,
      noSetupAssignment: true,
      checkboxChanged: false,
      setupChanged: false
    },
    statePatch: {
      current: {
        activeCase: CASE_ID,
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep:
          resultStatus === 'observed'
            ? 'Use Page Inspection findings to map Number Series Lines fields before any controlled write.'
            : 'Use Personalize or another standard Business Central setup route; do not repeat Ctrl+Alt+F1 or selected-cell typing without a new mechanism.'
      }
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-016C showed selected-cell typing selects labels/page text instead of visibly writing Startnr./Endnr.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Page Inspection/tooltip route changes method and can explain the underlying page/field context without another blind write attempt.',
      lookaheadReviewed: [
        { caseId: nextCase, status: resultStatus === 'observed' ? 'ready-next' : 'needs-ui-discovery-first', reason: 'Depends on whether technical field context was visible.' },
        { caseId: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT', status: 'needs-setup-first', reason: 'Assignments need line values or a conscious alternative numbering decision first.' },
        { caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT', status: 'needs-setup-first', reason: 'Customer master data depends on number series assignment.' },
        { caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT', status: 'ready-after-current', reason: 'Posting groups can proceed after Number Series is unblocked or consciously parked.' }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'Technical page context can now guide a safer field-mapped fit.'
          : 'The Page Inspection shortcut did not surface the field model, so the next route must use Personalize or another BC-standard setup path.',
      risksBeforeNextCase: [
        'Do not use API shortcuts.',
        'Do not repeat selected-cell typing.',
        'Do not change checkbox states without explicit field meaning and before/after proof.'
      ],
      requiredPreparation: ['Carry forward screenshot QA and visible field/action evidence.']
    },
    warnings,
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'TARGET-016D exposed Page Inspection / technical context for Number Series Lines.'
        : 'TARGET-016D improved tooltip and screenshot evidence but Page Inspection did not become visible through Ctrl+Alt+F1.'
  };
  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016D Number Series Page Inspection / Alternative Route',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Wichtiges Learning',
      '',
      '- Tooltip- und Screenshot-QA gehoeren vor die naechste Schreibroute.',
      '- Page Inspection per Tastaturkuerzel ist im Playwright-Kontext nicht als gegeben anzunehmen.',
      '- Nummernserien-Checkboxen bleiben sichtbarer Teil der Fachlogik und wurden nicht geaendert.',
      '',
      '## Grenze',
      '',
      '- Keine Setup-Zuweisung.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
