import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-021-DIMENSIONS-FOUNDATION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-021-dimensions-foundation';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-021-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  include: RegExp[];
  purpose: string;
  beginnerLearning: string;
  notProof: string[];
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked' | 'rejected';
  url: string;
  screenshot: string;
  textFile: string;
  textSignals: string[];
  visibleWarnings: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'dimensions-list',
    pageId: 560,
    label: 'Dimensionen / Dimensions',
    expectedText: /Dimensions|Dimensionen|Dimensionswerte|Dimension Values|Code|Name|Beschreibung/i,
    include: [
      /Dimensions|Dimensionen|Dimensionswerte|Dimension Values|Code|Name|Beschreibung|Department|Area|Business|Customer|nichts angezeigt|nothing can be displayed/i
    ],
    purpose: 'Dimension foundation page context before master data, documents or reporting.',
    beginnerLearning:
      'Dimensionen sind Auswertungsmerkmale. Sie helfen spaeter, Buchungen nach Produktlinie, Kanal oder Kostenstelle zu filtern.',
    notProof: [
      'No Dimension Value was created or changed.',
      'No Default Dimension was assigned.',
      'No posted Dimension Set Entry exists yet.'
    ]
  },
  {
    id: 'general-ledger-global-dimensions',
    pageId: 118,
    label: 'Finanzbuchhaltung Einrichtung / General Ledger Setup',
    expectedText:
      /General Ledger Setup|Finanzbuchhaltung Einrichtung|Sachbuchhaltung Einrichtung|Globaler Dimensionscode|Global Dimension Code|Shortcut Dimension/i,
    include: [
      /General Ledger Setup|Finanzbuchhaltung Einrichtung|Globaler Dimensionscode|Global Dimension Code|Shortcut Dimension|Dimension/i
    ],
    purpose: 'Read-only context for global and shortcut dimension fields.',
    beginnerLearning:
      'Globale Dimensionen sind wichtige Standard-Auswertungsachsen. Business Central fuehrt sie in der Finanzbuchhaltung-Einrichtung.',
    notProof: [
      'No Global Dimension Code was changed.',
      'No Shortcut Dimension was changed.',
      'No report or ledger filter is proven.'
    ]
  }
];

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeUrl(rawUrl: string) {
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
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function cleanEvidenceLine(value: string) {
  return value
    .replace(/\u00C3\u00A4/g, 'ae')
    .replace(/\u00C3\u00B6/g, 'oe')
    .replace(/\u00C3\u00BC/g, 'ue')
    .replace(/\u00C3\u0084/g, 'Ae')
    .replace(/\u00C3\u0096/g, 'Oe')
    .replace(/\u00C3\u009C/g, 'Ue')
    .replace(/\u00C3\u009F/g, 'ss')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Delete\?|Loeschen\?|Preview Posting|Buchungsvorschau|Fertig stellen|Finish|OK\s*$/i.test(
    text
  );
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Aenderungen/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting/preview action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
}

function isEvidenceNoise(line: string) {
  return /trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer|allowedEndpoints|allowedResources|clientId|authority:|parentPageOrigin|upn:|login\.microsoftonline\.com|graph\.microsoft\.com|officeapps\.live\.com|officeshell/i.test(
    line
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
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
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  const url = buildPlaythruUrl(probe.pageId);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(text);
  const matchedExpectedText = probe.expectedText.test(text);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const compact = await compactPageText(page, {
    include: probe.include,
    maxLines: 100,
    maxLineLength: 180
  });
  const textLines = compact
    .split('\n')
    .map((line) => cleanEvidenceLine(line))
    .filter((line) => line && !isEvidenceNoise(line));
  const screenshot = `target-021-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;

  await writeText(textFile, textLines.join('\n') || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status: status === 'observed' ? 'universaarl-dimensions-readonly-context' : status,
    bookUse: status === 'observed' ? 'dimensions-foundation-explanation' : 'do-not-use-as-proof',
    visibleLearning: probe.beginnerLearning,
    importantUi: textLines.slice(0, 16),
    internallyProves:
      status === 'observed'
        ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `The route did not yet produce a safe visible ${probe.label} proof.`,
    doesNotProve: [
      ...probe.notProof,
      'No master data, document draft, preview posting, posting or ledger trace was created.'
    ],
    finalScreenshotStatus: status === 'observed' ? 'candidate-readonly' : 'rejected',
    qualityDecision: status,
    matchedExpectedText
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: `playwright/projects/fibu-book5/img/${screenshot}`,
    textFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${textFile}`,
    textSignals: textLines.slice(0, 50),
    visibleWarnings: visibleWarnings(text),
    reason: !safeContext
      ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
      : dangerousDialog
        ? 'Dangerous dialog/action text detected; no action was confirmed.'
        : matchedExpectedText
          ? 'Expected dimension setup page text is visible.'
          : 'Expected dimension setup page text was not visible.'
  };
}

test('TARGET-021 Dimensions foundation read-only classification', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], index + 1));
  }

  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status !== 'observed');
  const dimensionPageObserved = observed.some((entry) => entry.id === 'dimensions-list');
  const glDimensionContextObserved = observed.some((entry) => entry.id === 'general-ledger-global-dimensions');
  const dimensionListResult = results.find((entry) => entry.id === 'dimensions-list');
  const noDimensionRowsVisible = Boolean(
    dimensionListResult?.textSignals.some((line) => /nichts angezeigt|nothing can be displayed/i.test(line))
  );

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-dimensions-readonly-foundation',
    resultStatus: blocked.length ? 'blocked' : 'observed',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    readinessClassification:
      dimensionPageObserved && glDimensionContextObserved && noDimensionRowsVisible
        ? 'dimensions-context-observed-empty-needs-setup-fit'
        : dimensionPageObserved && glDimensionContextObserved
          ? 'dimensions-context-observed-needs-values-defaults-and-posted-entry-proof'
        : 'dimensions-context-incomplete',
    sourceRefs: [
      'Microsoft Learn: Work with dimensions - https://learn.microsoft.com/en-us/dynamics365/business-central/finance-dimensions'
    ],
    proved: [
      `${observed.length}/${probes.length} dimension-related pages opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
      ...(dimensionPageObserved ? ['Dimensions page context is visible read-only.'] : []),
      ...(noDimensionRowsVisible ? ['Dimensions page is visible but currently shows no rows in the active view.'] : []),
      ...(glDimensionContextObserved
        ? ['General Ledger Setup dimension fields are visible read-only as dimension-related setup context.']
        : []),
      'No Dimension, Dimension Value, Default Dimension, master data, document draft, preview posting or posting was created.'
    ],
    notProved: [
      'No Universaarl reporting axis is marked final-ready.',
      'No Dimension Value completeness is proven.',
      ...(noDimensionRowsVisible ? ['No Dimension Codes are visible in the Dimensions list screenshot.'] : []),
      'No Default Dimension assignment is proven.',
      'No Dimension Set Entry, G/L Entry or report filter result exists yet.',
      ...blocked.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-021-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-021-*.png'
    ],
    evidenceRefs: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-021-result.json`, ...results.map((entry) => entry.screenshot)],
    pages: results,
    blockedBy: blocked.map((entry) => `${entry.id}: ${entry.reason}`),
    warnings: Array.from(new Set(results.flatMap((entry) => entry.visibleWarnings))),
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      noSetupChange: true,
      readOnlyDirectPageRoutes: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-020 proved VAT setup page context read-only, but no 19 percent VAT, setup correctness, preview or VAT Entries.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'Dimensions are the next non-posting foundation dependency because master data, document lines and reporting need clear dimension semantics.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-022-CORE-MASTERDATA-PLAN',
          status: blocked.length || noDimensionRowsVisible ? 'ready-after-current' : 'ready-next',
          reason:
            'Master data planning remains useful, but visible empty dimensions should be resolved or consciously parked first.'
        },
        {
          caseId: 'TARGET-023-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Templates depend on number series, posting groups, VAT defaults and dimension/default-dimension decisions.'
        },
        {
          caseId: 'TARGET-024-FIRST-MASTERDATA-CANDIDATE',
          status: 'needs-setup-first',
          reason: 'First master data should wait for a concrete plan and Smart Decision before writes.'
        },
        {
          caseId: 'TARGET-025-VAT-SETUP-FIT-DECISION',
          status: 'needs-source-check-first',
          reason: 'German VAT setup requires source-backed values and later preview/VAT Entry proof.'
        },
        {
          caseId: 'TARGET-026-DIMENSION-VALUE-SETUP-FIT-DECISION',
          status: noDimensionRowsVisible ? 'ready-next' : 'ready-after-current',
          reason:
            'If master data needs PRODUCTLINE/CHANNEL/COSTCENTER defaults, a separate setup-fit decision should create or verify those values.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: blocked.length
        ? 'TARGET-021B-DIMENSIONS-ROUTE-FOLLOWUP'
        : noDimensionRowsVisible
          ? 'TARGET-022-DIMENSION-VALUE-SETUP-FIT-DECISION'
          : 'TARGET-022-CORE-MASTERDATA-PLAN',
      whySelectedNextCaseIsBest: blocked.length
        ? 'At least one dimension route did not produce safe proof.'
        : noDimensionRowsVisible
          ? 'The dimension list is reachable but empty, so a setup-fit decision is more practical than creating master data first.'
          : 'The foundation context is sufficient to plan first master data without claiming final reporting readiness.',
      risksBeforeNextCase: [
        'Do not treat page visibility as reporting proof.',
        'Do not create default dimensions silently.',
        'Do not create master data before a compact Smart Decision explains required posting groups, VAT and dimensions.'
      ],
      requiredPreparation: [
        'Use TARGET-021 screenshots as dimension context, not as Dimension Set Entry or reporting proof.',
        'Keep Microsoft Learn dimensions source linked for setup-fit and book text.'
      ]
    },
    requiresReview: blocked.length > 0,
    safeToFinalizeState: false,
    statePatch: {},
    reason: blocked.length
      ? 'Dimensions foundation was partially blocked; review required.'
      : 'Dimensions foundation context observed without setup or data changes.'
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-021 Dimensions Foundation',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Sichtbare Seiten',
      '',
      ...observed.map((entry) => `- ${entry.label}`),
      '',
      '## Grenze',
      '',
      '- Keine Dimension wurde angelegt oder geaendert.',
      '- Keine Standarddimension wurde zugeordnet.',
      '- Keine Stammdaten, kein Entwurf, keine Preview und keine Buchung.',
      '- Reportingwirkung braucht spaeter gebuchte Posten und Dimension Set Entries.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(results.every((entry) => instancePathIsTarget(entry.url) && companyParamIsTarget(entry.url))).toBe(true);
  expect(blocked, blocked.map((entry) => `${entry.id}: ${entry.reason}`).join('\n')).toHaveLength(0);
});
