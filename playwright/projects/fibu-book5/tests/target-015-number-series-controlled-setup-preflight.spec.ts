import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-015-NUMBER-SERIES-CONTROLLED-SETUP-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-015-number-series-controlled-setup-preflight';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-015-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  include: RegExp[];
  purpose: string;
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
  setupSignals: string[];
  fieldSignals: string[];
  buttonSignals: string[];
  reason: string;
};

const targetSeriesDraft = [
  { family: 'customer', code: 'U-CUST', startNo: 'U-CUST00001' },
  { family: 'vendor', code: 'U-VEND', startNo: 'U-VEND00001' },
  { family: 'item', code: 'U-ITEM', startNo: 'U-ITEM00001' },
  { family: 'sales-order', code: 'U-SO', startNo: 'U-SO00001' },
  { family: 'sales-invoice', code: 'U-SINV', startNo: 'U-SINV00001' },
  { family: 'purchase-order', code: 'U-PO', startNo: 'U-PO00001' },
  { family: 'purchase-invoice', code: 'U-PINV', startNo: 'U-PINV00001' }
];

const probes: Probe[] = [
  {
    id: 'number-series',
    pageId: 456,
    label: 'Nummernserie / No. Series',
    expectedText: /Nummernserie|No\. Series|Startnr|Starting No\.|Letzte Nr|Last No\. Used|VATNOTIF|BANKEINZ|CT-MSG/i,
    include: [/Nummernserie|No\. Series|Code|Beschreibung|Description|Startnr|Starting No|Letzte Nr|Last No|BANKEINZ|CT-MSG|VATNOTIF|U-/i],
    purpose: 'Before-state list of existing number series before any Universaarl series is created.'
  },
  {
    id: 'sales-receivables-setup',
    pageId: 459,
    label: 'Verkauf & Debitoren Einrichtung / Sales & Receivables Setup',
    expectedText: /Sales & Receivables Setup|Verkauf.*Debitor|Debitoren.*Einrichtung|Customer Nos\.|Order Nos\.|Invoice Nos\.|Nummern/i,
    include: [/Sales|Receivables|Verkauf|Debitor|Customer|Order|Invoice|Nummern|Nos\.|Nr\./i],
    purpose: 'Find visible assignment fields for customer, sales order and sales invoice number series.'
  },
  {
    id: 'purchases-payables-setup',
    pageId: 460,
    label: 'Einkauf & Kreditoren Einrichtung / Purchases & Payables Setup',
    expectedText: /Purchases & Payables Setup|Einkauf.*Kreditor|Kreditoren.*Einrichtung|Vendor Nos\.|Order Nos\.|Invoice Nos\.|Nummern/i,
    include: [/Purchase|Payables|Einkauf|Kreditor|Vendor|Order|Invoice|Nummern|Nos\.|Nr\./i],
    purpose: 'Find visible assignment fields for vendor, purchase order and purchase invoice number series.'
  },
  {
    id: 'inventory-setup',
    pageId: 461,
    label: 'Lager Einrichtung / Inventory Setup',
    expectedText: /Inventory Setup|Lager.*Einrichtung|Item Nos\.|Artikel.*Nr|Nummern|Automatic Cost/i,
    include: [/Inventory|Lager|Item|Artikel|Nummern|Nos\.|Nr\.|Cost|Kosten/i],
    purpose: 'Find visible assignment fields for item number series and inventory numbering context.'
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

async function visibleNames(page: Page, selector: string) {
  const values = await page
    .evaluate((query) => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      return Array.from(document.querySelectorAll<HTMLElement>(query))
        .filter(visible)
        .map((element) =>
          normalize(
            element.innerText ||
              element.textContent ||
              element.getAttribute('aria-label') ||
              element.getAttribute('title') ||
              element.getAttribute('name')
          )
        )
        .filter(Boolean)
        .slice(0, 120);
    }, selector)
    .catch(() => [] as string[]);
  return [...new Set(values.map(clean).filter(Boolean))];
}

function interestingFieldSignals(lines: string[]) {
  return lines
    .filter((line) => /Nos\.|No\.|Nr\.|Nummern|Customer|Vendor|Item|Debitor|Kreditor|Artikel|Order|Invoice|Auftrag|Rechnung/i.test(line))
    .slice(0, 40);
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  await page.goto(buildPlaythruUrl(probe.pageId).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const compact = (
    await compactPageText(page, {
      include: probe.include,
      maxLines: 120,
      maxLineLength: 180
    })
  )
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .join('\n');
  const compactLines = compact.split('\n').map(clean).filter(Boolean);
  const currentUrl = page.url();
  const matchedExpectedText = probe.expectedText.test(text);
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(text);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const screenshot = `target-015-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;
  const buttonSignals = (await visibleNames(page, 'button,[role="button"],[role="menuitem"]'))
    .filter((name) => /New|Neu|Edit|Bearbeiten|Lines|Zeilen|Related|Verwalten|Aktionen|Process|Navigate/i.test(name))
    .slice(0, 40);
  const fieldSignals = interestingFieldSignals(compactLines);

  await writeText(textFile, compact || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status: status === 'observed' ? 'german-final-candidate-readonly-before' : status,
    bookUse: status === 'observed' ? 'foundation-number-series-before-state' : 'do-not-use-as-proof',
    visibleLearning: probe.purpose,
    importantUi: [...fieldSignals.slice(0, 12), ...buttonSignals.slice(0, 8)],
    internallyProves:
      status === 'observed'
        ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `${probe.label} was not proven as a usable before-state page.`,
    doesNotProve: [
      'No number series was created or edited.',
      'No setup assignment was changed.',
      'No master data, draft, preview posting or posting occurred.'
    ],
    qualityDecision: status,
    matchedExpectedText,
    fieldSignals,
    buttonSignals
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
    setupSignals: compactLines.slice(0, 60),
    fieldSignals,
    buttonSignals,
    reason: status === 'observed' ? 'Expected setup page text was visible.' : safeContext ? 'Expected setup page text not visible.' : 'Unsafe instance or company context.'
  };
}

test('TARGET-015 Number Series controlled setup preflight read-only', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const probeResults: ProbeResult[] = [];
  for (const [index, probe] of probes.entries()) {
    probeResults.push(await probePage(page, probe, (index + 1) * 10));
  }

  const observed = probeResults.filter((probe) => probe.status === 'observed');
  const rejected = probeResults.filter((probe) => probe.status === 'rejected');
  const blocked = probeResults.filter((probe) => probe.status === 'blocked');
  const numberSeriesObserved = observed.some((probe) => probe.id === 'number-series');
  const setupPagesObserved = observed.filter((probe) => probe.id !== 'number-series');
  const duplicateTargetCodes = targetSeriesDraft.filter((series) =>
    probeResults.some((probe) => probe.setupSignals.some((line) => new RegExp(`\\b${series.code}\\b`, 'i').test(line)))
  );
  const selectedNextCase =
    numberSeriesObserved && setupPagesObserved.length > 0 && duplicateTargetCodes.length === 0
      ? 'TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE'
      : 'TARGET-016-NUMBER-SERIES-UI-DISCOVERY-FOLLOWUP';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-number-series-controlled-setup-preflight',
    resultStatus: numberSeriesObserved && blocked.length === 0 ? 'observed' : 'blocked',
    runPlanId: 'TARGET-015-NUMBER-SERIES-CONTROLLED-SETUP-PREFLIGHT-READONLY',
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    proved: [
      ...(numberSeriesObserved ? ['Number Series before-state page opened read-only in playthru / UNIVERSAARL-DE.'] : []),
      ...setupPagesObserved.map((probe) => `${probe.label} opened read-only as an assignment-context page.`),
      ...(duplicateTargetCodes.length === 0 ? ['No target Universaarl U-* number-series code was visible in captured before-state text.'] : [])
    ],
    notProved: [
      'No number series was created, edited or assigned.',
      'No setup value was changed.',
      'No master data, draft, preview posting, posting or ledger trace exists.',
      ...(duplicateTargetCodes.length
        ? [`Potential duplicate target codes visible before setup: ${duplicateTargetCodes.map((series) => series.code).join(', ')}.`]
        : []),
      ...rejected.map((probe) => `${probe.label} was opened but did not show the expected setup text.`),
      ...blocked.map((probe) => `${probe.label} was blocked by safety context or dangerous dialog detection.`)
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-015-number-series-controlled-setup-preflight/TARGET-015-result.json',
      ...probeResults.map((probe) => `playwright/projects/fibu-book5/evidence/target-015-number-series-controlled-setup-preflight/${probe.textFile}`),
      ...probeResults.map((probe) => `playwright/projects/fibu-book5/evidence/target-015-number-series-controlled-setup-preflight/${probe.screenshot.replace(/\.png$/i, '.screenshot.json')}`),
      ...probeResults.map((probe) => `playwright/projects/fibu-book5/img/${probe.screenshot}`)
    ],
    statePatch: {
      current: {
        activeCase: selectedNextCase,
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep:
          selectedNextCase === 'TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE'
            ? 'Run TARGET-016: create or update the first Universaarl number series only after explicit write gate and before screenshots.'
            : 'Run TARGET-016: inspect Number Series/setup UI further before any write because preflight did not prove all needed assignment context.'
      },
      lastRunSummary: {
        caseId: CASE_ID,
        status: numberSeriesObserved && blocked.length === 0 ? 'observed' : 'blocked',
        summary:
          'TARGET-015 captured Number Series and related setup pages read-only before any controlled number-series setup write. No setup, master data, draft, preview or posting occurred.',
        resultPath: 'playwright/projects/fibu-book5/evidence/target-015-number-series-controlled-setup-preflight/TARGET-015-result.json'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-015-number-series-controlled-setup-preflight/TARGET-015-result.json',
      ...probeResults.map((probe) => `playwright/projects/fibu-book5/img/${probe.screenshot}`)
    ],
    targetSeriesDraft,
    duplicateTargetCodes,
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
    smartDecisionCard: {
      caseId: CASE_ID,
      effectiveActionRequested: false,
      decision: 'Read-only before-state only. Do not create U-* series in TARGET-015.',
      alternativesConsidered: [
        'Create number series immediately: rejected because setup-page assignment context needed before write.',
        'Skip number series and continue posting groups: rejected because master data and documents need explainable numbering.',
        'Read-only preflight: selected because it captures before-state and UI field context safely.'
      ],
      risk: 'Wrong numbering setup can affect every later card and document; avoid duplicate series and assignment mistakes.',
      fallback: 'If setup fields are not visible, run a UI-discovery follow-up instead of writing.'
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-015-NUMBER-SERIES-CONTROLLED-SETUP-PREFLIGHT',
      lastEvidenceSummary: 'TARGET-014 defined draft Universaarl numbering families but did not prove setup-page assignment fields.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Before-state screenshots and assignment-page context are needed before any Number Series write.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE',
          status: selectedNextCase === 'TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE' ? 'ready-next' : 'needs-ui-discovery-first',
          reason:
            selectedNextCase === 'TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE'
              ? 'Before-state is captured and no target U-* duplicate is visible.'
              : 'Preflight did not prove enough assignment context for a write.'
        },
        {
          caseId: 'TARGET-017-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups should follow after numbering setup is created or deliberately deferred.'
        },
        {
          caseId: 'TARGET-018-VAT-SETUP-READINESS',
          status: 'needs-source-check-first',
          reason: 'German VAT claims need source-backed setup and later preview/VAT Entries.'
        },
        {
          caseId: 'TARGET-019-DIMENSIONS-FOUNDATION',
          status: 'ready-after-current',
          reason: 'Dimensions can follow once core numbering and posting setup order is stable.'
        },
        {
          caseId: 'TARGET-020-CORE-MASTERDATA-PLAN',
          status: 'needs-setup-first',
          reason: 'Master data waits for number series, posting groups, VAT and dimensions.'
        }
      ],
      queueChangesMade: [
        `Selected ${selectedNextCase} based on TARGET-015 before-state visibility.`
      ],
      selectedNextCase,
      whySelectedNextCaseIsBest:
        selectedNextCase === 'TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE'
          ? 'It is now reasonable to prepare a narrowly scoped write gate for U-* number series, still without master data or postings.'
          : 'A follow-up discovery is safer than writing because the needed setup context was not fully proven.',
      risksBeforeNextCase: [
        'Do not create duplicate U-* series.',
        'Do not assign series to setup fields without before/after screenshots.',
        'Do not claim legal German invoice-number compliance from this setup alone.'
      ],
      requiredPreparation: [
        'Read TARGET-015 result and screenshot metadata.',
        'If writing later, create only the explicitly approved U-* series and document before/after.'
      ]
    },
    warnings: rejected.map((probe) => `${probe.id}: ${probe.reason}`),
    blockedBy: blocked.map((probe) => `${probe.id}: ${probe.reason}`),
    requiresReview: blocked.length > 0,
    safeToFinalizeState: numberSeriesObserved && blocked.length === 0,
    reason: numberSeriesObserved
      ? 'Read-only controlled setup preflight completed without write actions.'
      : 'Number Series before-state was not visible; do not proceed to setup writes.'
  };

  await writeJson(RESULT_PATH, result);

  expect(probeResults.every((probe) => instancePathIsTarget(probe.url))).toBeTruthy();
  expect(probeResults.every((probe) => companyParamIsTarget(probe.url))).toBeTruthy();
  expect(numberSeriesObserved).toBeTruthy();
  expect(blocked).toHaveLength(0);
});
