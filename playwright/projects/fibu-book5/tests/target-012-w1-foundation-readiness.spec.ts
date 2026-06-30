import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-012-W1-FOUNDATION-READINESS';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const LEGAL_NAME = 'Universaarl GmbH';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-012-w1-foundation-readiness';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-012-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  purpose: string;
  nextUse: string;
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'rejected' | 'blocked';
  url: string;
  screenshot: string;
  textFile: string;
  matchedExpectedText: boolean;
  textSignals: string[];
  purpose: string;
  nextUse: string;
  visibleActionWarnings: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'company-information',
    pageId: 1,
    label: 'Firmendaten / Company Information',
    expectedText: /Firmendaten|Company Information|Universaarl GmbH|Allgemein|Kommunikation/i,
    purpose: 'Saved company information baseline after TARGET-011.',
    nextUse: 'Confirms that W1 starts from the correct Universaarl company baseline.'
  },
  {
    id: 'general-ledger-setup',
    pageId: 118,
    label: 'General Ledger Setup / Finanzbuchhaltung Einrichtung',
    expectedText: /General Ledger Setup|Finanzbuchhaltung Einrichtung|Sachbuchhaltung Einrichtung|Allow Posting From|Buchen zugel/i,
    purpose: 'Read-only foundation check for base accounting setup context.',
    nextUse: 'Decide whether manual setup discovery is needed before posting groups and VAT.'
  },
  {
    id: 'no-series',
    pageId: 456,
    label: 'No. Series / Nummernserien',
    expectedText: /No\. Series|Nummernserie|Nummernserien|Starting No\.|Startnr|Last No\. Used|Letzte Nr/i,
    purpose: 'Read-only foundation check for document and master-data numbering.',
    nextUse: 'Next candidate case if the page is visible: number series preflight.'
  },
  {
    id: 'general-posting-setup',
    pageId: 314,
    label: 'General Posting Setup / Buchungsmatrix',
    expectedText: /General Posting Setup|Buchungsmatrix|Gen\. Bus\. Posting Group|Geschaeftsbuchungsgruppe|Sales Account|Purchase Account/i,
    purpose: 'Read-only foundation check for account determination matrix.',
    nextUse: 'Posting groups must be understood before preview or posting cases.'
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'VAT Posting Setup / USt-Buchungsmatrix',
    expectedText: /VAT Posting Setup|USt-Buchungsmatrix|MwSt|VAT Bus\. Posting Group|VAT Prod\. Posting Group|VAT %|USt/i,
    purpose: 'Read-only foundation check for VAT setup context.',
    nextUse: 'German VAT claims need setup, preview, VAT entries and G/L trace later.'
  },
  {
    id: 'dimensions',
    pageId: 560,
    label: 'Dimensions / Dimensionen',
    expectedText: /Dimensions|Dimensionen|Dimension Code|Dimensionswerte|Dimension Values|Code|Name/i,
    purpose: 'Read-only foundation check for reporting axes.',
    nextUse: 'Dimension setup should follow after numbering and posting/VAT order is clear.'
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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Möchten Sie buchen|Delete\?|Loeschen\?|Löschen\?|Ship and Invoice|Liefern und fakturieren/i.test(
    text
  );
}

function actionWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action text is visible but not clicked.' : '',
    /Edit|Bearbeiten|Aenderungen|Änderungen/i.test(text) ? 'Edit/Bearbeiten action text is visible but not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting/preview action text is visible but not clicked.'
      : ''
  ].filter(Boolean);
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
  const compact = await compactPageText(page, {
    include: [
      /Universaarl|Firmendaten|Company Information|General Ledger|Finanz|No\. Series|Nummern|Posting Setup|Buchungsmatrix|VAT|USt|Dimension/i
    ],
    maxLines: 80,
    maxLineLength: 180
  });
  const currentUrl = page.url();
  const matchedExpectedText = probe.expectedText.test(text);
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(text);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const screenshot = `target-012-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;
  const textSignals = compact
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .slice(0, 40);
  const warnings = actionWarnings(text);

  await writeText(textFile, compact || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status: status === 'observed' ? 'universaarl-candidate' : status,
    bookUse: status === 'observed' ? 'foundation-readiness' : 'do-not-use-as-proof',
    visibleLearning: probe.nextUse,
    importantUi: textSignals.slice(0, 12),
    internallyProves:
      status === 'observed'
        ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `The requested page route did not yet produce a safe visible ${probe.label} proof.`,
    doesNotProve: [
      'No setup value was changed.',
      'No readiness for posting is proven.',
      'No preview posting, posting, master data or draft was created.'
    ],
    qualityDecision: status,
    finalScreenshotStatus: 'german-final-candidate-readonly',
    matchedExpectedText,
    visibleActionWarnings: warnings
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot,
    textFile,
    matchedExpectedText,
    textSignals,
    purpose: probe.purpose,
    nextUse: probe.nextUse,
    visibleActionWarnings: warnings,
    reason: status === 'observed' ? 'Expected read-only page text was visible.' : safeContext ? 'Expected page text not visible.' : 'Unsafe instance or company context.'
  };
}

test('TARGET-012 W1 Foundation readiness read-only probe', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const probeResults: ProbeResult[] = [];
  for (const [index, probe] of probes.entries()) {
    probeResults.push(await probePage(page, probe, (index + 1) * 10));
  }

  const observed = probeResults.filter((probe) => probe.status === 'observed');
  const rejected = probeResults.filter((probe) => probe.status === 'rejected');
  const blocked = probeResults.filter((probe) => probe.status === 'blocked');
  const companyInfoObserved = observed.some((probe) => probe.id === 'company-information');
  const noSeriesObserved = observed.some((probe) => probe.id === 'no-series');
  const selectedNextCase = noSeriesObserved ? 'TARGET-013-NUMBER-SERIES-PREFLIGHT' : 'TARGET-013-NUMBER-SERIES-PAGE-DISCOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-universaarl-foundation-readiness',
    resultStatus: companyInfoObserved ? 'observed' : 'blocked',
    runPlanId: 'TARGET-012-W1-FOUNDATION-READINESS-READONLY',
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    legalName: LEGAL_NAME,
    proved: [
      ...(companyInfoObserved ? [`Company Information in ${TARGET_COMPANY} still shows ${LEGAL_NAME}.`] : []),
      ...observed.map((probe) => `${probe.label} opened read-only via page ${probe.pageId}.`)
    ],
    notProved: [
      'No setup value, number series, posting group, VAT setup or dimension value was changed.',
      'No foundation area is marked posting-ready from this read-only probe alone.',
      'No master data, draft, preview posting, posting or ledger trace was created.',
      ...rejected.map((probe) => `${probe.label} direct page route did not show the expected page text.`),
      ...blocked.map((probe) => `${probe.label} was blocked by safety context or dangerous dialog detection.`)
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-012-w1-foundation-readiness/TARGET-012-result.json',
      ...probeResults.map((probe) => `playwright/projects/fibu-book5/evidence/target-012-w1-foundation-readiness/${probe.textFile}`),
      ...probeResults.map((probe) => `playwright/projects/fibu-book5/evidence/target-012-w1-foundation-readiness/${probe.screenshot.replace(/\.png$/i, '.screenshot.json')}`),
      ...probeResults.map((probe) => `playwright/projects/fibu-book5/img/${probe.screenshot}`)
    ],
    statePatch: {
      current: {
        activeCase: selectedNextCase,
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep: noSeriesObserved
          ? 'Run TARGET-013-NUMBER-SERIES-PREFLIGHT: inspect number series read-only, then decide the first controlled setup changes.'
          : 'Run TARGET-013-NUMBER-SERIES-PAGE-DISCOVERY: find the safest UI route to Number Series without search ambiguity or setup changes.'
      },
      lastRunSummary: {
        caseId: CASE_ID,
        status: companyInfoObserved ? 'observed' : 'blocked',
        summary:
          'TARGET-012 opened W1 foundation setup candidates read-only in playthru/UNIVERSAARL-DE and selected the next Number Series step. No setup, draft, preview or posting occurred.',
        resultPath: 'playwright/projects/fibu-book5/evidence/target-012-w1-foundation-readiness/TARGET-012-result.json'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-012-w1-foundation-readiness/TARGET-012-result.json',
      ...probeResults.map((probe) => `playwright/projects/fibu-book5/img/${probe.screenshot}`)
    ],
    probeResults,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookChange: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-012-W1-FOUNDATION-READINESS',
      lastEvidenceSummary: 'TARGET-011 proved the saved company name Universaarl GmbH on Company Information.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Foundation setup order must be decided before number series, posting groups, VAT, dimensions or master data are changed.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-013-NUMBER-SERIES-PREFLIGHT',
          status: noSeriesObserved ? 'ready-next' : 'needs-ui-discovery-first',
          reason: noSeriesObserved
            ? 'No. Series page was visible read-only.'
            : 'No. Series direct page route was not safely proven in this run.'
        },
        {
          caseId: 'TARGET-014-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups are necessary before preview/posting but should follow number series context.'
        },
        {
          caseId: 'TARGET-015-VAT-SETUP-READINESS',
          status: 'needs-source-check-first',
          reason: 'German VAT claims need source-backed setup and later preview/VAT Entries.'
        },
        {
          caseId: 'TARGET-016-DIMENSIONS-FOUNDATION',
          status: 'ready-after-current',
          reason: 'Dimensions should be prepared before reporting and process evidence, after W1 order is stable.'
        },
        {
          caseId: 'TARGET-017-CORE-MASTERDATA-PLAN',
          status: 'needs-setup-first',
          reason: 'Customers, vendors and items need number series, posting groups, VAT and dimensions first.'
        }
      ],
      queueChangesMade: ['Mark stale TARGET-011 queue item done and add TARGET-012 result before selecting TARGET-013.'],
      selectedNextCase,
      whySelectedNextCaseIsBest: noSeriesObserved
        ? 'Number Series is the safest next W1 area before setup changes and master data.'
        : 'Number Series remains first, but the UI route must be discovered safely before any setup change.',
      risksBeforeNextCase: ['Do not use global search when a direct route or scoped navigation is required.'],
      requiredPreparation: ['Keep TARGET-013 read-only unless a setup gate explicitly unlocks changes.']
    },
    warnings: rejected.map((probe) => `${probe.id}: ${probe.reason}`),
    blockedBy: blocked.map((probe) => `${probe.id}: ${probe.reason}`),
    requiresReview: blocked.length > 0,
    safeToFinalizeState: companyInfoObserved && blocked.length === 0,
    reason: companyInfoObserved
      ? 'Read-only W1 foundation readiness probe completed without write actions.'
      : 'Company Information baseline was not visible; do not proceed to setup.'
  };

  await writeJson(RESULT_PATH, result);

  expect(probeResults.every((probe) => instancePathIsTarget(probe.url))).toBeTruthy();
  expect(probeResults.every((probe) => companyParamIsTarget(probe.url))).toBeTruthy();
  expect(companyInfoObserved).toBeTruthy();
});
