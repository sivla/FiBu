import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(240_000);
test.skip(
  process.env.TARGET_075_LIVE_APPROVED !== '1' || process.env.TARGET_075_RUNNER_GUARD_CHECKED !== '1',
  'TARGET-075 must be run through the guarded runner with --live-approved after freeze lift; active freeze also requires TARGET_075_FREEZE_OVERRIDE_APPROVED=1.'
);

const CASE_ID = 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-075-chart-of-accounts-reopen-and-setup-consistency-check';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

type ProbeStatus = 'observed' | 'blocked' | 'rejected';

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  include: RegExp[];
  proves: string;
  doesNotProve: string[];
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: ProbeStatus;
  url: string;
  textFile: string;
  screenshot: string;
  screenshotMetadata: string;
  visibleSignals: string[];
  blockedBy: string[];
  warnings: string[];
};

const starterAccounts = ['1200', '1406', '1800', '3300', '3806', '4400', '5400'];

const probes: Probe[] = [
  {
    id: 'chart-of-accounts',
    pageId: 16,
    label: 'Kontenplan / Chart of Accounts',
    expectedText: /Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV|Bilanz|Balance Sheet|Income Statement|Kontoart|Account Type/i,
    include: [
      /Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV|Bilanz|Balance Sheet|Income Statement|Kontoart|Account Type|Buchung|Posting/i,
      /1200|1406|1800|3300|3806|4400|5400|Vorsteuer|Umsatzsteuer|Umsatzerloese|Wareneingang|Verbindlichkeiten|Bank Saarland/i,
      /Neu|New|Liste bearbeiten|Edit list|Bearbeiten|Edit|Loeschen|Delete|Buchen|Post|Buchungsvorschau|Preview Posting/i
    ],
    proves: 'Starter chart context is visible read-only before setup or master data is resumed.',
    doesNotProve: ['No complete SKR04 chart', 'No tax advisor approval', 'No posting readiness']
  },
  {
    id: 'general-business-posting-groups',
    pageId: 312,
    label: 'Geschaeftsbuchungsgruppen / Gen. Business Posting Groups',
    expectedText: /Geschaeftsbuchungsgruppen|Geschaftsbuchungsgruppen|Gen\. Business Posting Groups|INLAND|Code|Beschreibung|Description/i,
    include: [/Geschaeft|Geschaft|Business Posting|INLAND|Code|Beschreibung|Description|Neu|New|Bearbeiten|Edit/i],
    proves: 'General Business Posting Groups page is reachable read-only.',
    doesNotProve: ['No setup value written', 'No posting setup row correctness']
  },
  {
    id: 'general-product-posting-groups',
    pageId: 313,
    label: 'Produktbuchungsgruppen / Gen. Product Posting Groups',
    expectedText: /Produktbuchungsgruppen|Gen\. Product Posting Groups|WAREN|Code|Beschreibung|Description/i,
    include: [/Produktbuchungsgruppen|Product Posting|WAREN|Code|Beschreibung|Description|Neu|New|Bearbeiten|Edit/i],
    proves: 'General Product Posting Groups page is reachable read-only.',
    doesNotProve: ['No setup value written', 'No posting setup row correctness']
  },
  {
    id: 'general-posting-setup',
    pageId: 314,
    label: 'Buchungsmatrix Einrichtung / General Posting Setup',
    expectedText: /Buchungsmatrix|General Posting Setup|Gen\. Bus\. Posting Group|Gen\. Prod\. Posting Group|Sales Account|Purchase Account|INLAND|WAREN/i,
    include: [
      /Buchungsmatrix|General Posting Setup|Geschaeft|Geschaft|Produkt|Gen\. Bus|Gen\. Prod|Sales Account|Purchase Account|Warenverkaufskonto|Wareneinkaufskonto/i,
      /INLAND|WAREN|4400|5400|Neu|New|Liste bearbeiten|Edit list|Bearbeiten|Edit/i
    ],
    proves: 'General Posting Setup page is reachable read-only for boundary evidence.',
    doesNotProve: ['No INLAND/WAREN row write', 'No 4400/5400 persistence proof unless visible', 'No posting readiness']
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    expectedText: /MwSt|USt|VAT Posting Setup|VAT Bus\. Posting Group|VAT Prod\. Posting Group|VAT %|Sales VAT|Purchase VAT/i,
    include: [
      /MwSt|USt|VAT|Posting Group|Buchungsgruppe|VAT %|Sales VAT|Purchase VAT|Konto|Account|Code|Beschreibung|Description/i,
      /INLAND|VAT19|19|3806|1406|Neu|New|Liste bearbeiten|Edit list|Bearbeiten|Edit/i
    ],
    proves: 'VAT Posting Setup page is reachable read-only; no Page 472 edit retry is performed.',
    doesNotProve: ['No INLAND/VAT19 row saved', 'No VAT correctness', 'No active editor route']
  }
];

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|originAuthorityValidator|upn:/i.test(line))
    .join('\n')
    .trim();
}

function targetInstanceUrl() {
  const url = new URL(process.env.TARGET_075_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before TARGET-075 can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!instancePathIsTarget(url.toString()) || !companyParamIsTarget(url.toString())) {
    throw new Error('TARGET-075 target URL must resolve to playthru / UNIVERSAARL-DE before any page navigation.');
  }
  return url;
}

function buildTargetUrl(pageId: number) {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function dangerousDialogText(text: string) {
  return /\b(OK|Yes|Ja|Finish|Fertig stellen|Delete|Loeschen|Loschen|Post|Buchen|Preview Posting|Buchungsvorschau|Ship|Invoice|Payment|Apply|Anwenden|New|Neu|Edit|Bearbeiten)\b/i.test(
    text
  );
}

function actionWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting or preview action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
}

function accountSignals(text: string) {
  return starterAccounts.map((accountNo) => ({
    accountNo,
    visible: new RegExp(`\\b${accountNo}\\b`).test(text)
  }));
}

function numericEnv(name: string) {
  const value = Number(process.env[name] ?? '');
  return Number.isFinite(value) ? value : null;
}

function authWarningsEnv() {
  try {
    const parsed = JSON.parse(process.env.TARGET_075_AUTH_WARNINGS ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
  } catch {
    return ['target-075-auth-warnings-env-invalid'];
  }
}

function jsonEnv(name: string) {
  const raw = process.env[name];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { parseError: `${name}-invalid-json` };
  }
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

async function visibleDialogs(page: Page) {
  const chunks: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .modal-dialog, .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (text) chunks.push(text);
    }
  }
  return chunks;
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = evidencePath(PROJECT, EVIDENCE_ID, fileName);
  const metadataPath = evidencePath(PROJECT, EVIDENCE_ID, fileName.replace(/\.png$/i, '.screenshot.json'));
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJsonEvidence(metadataPath, {
    fileName,
    imagePath: `${EVIDENCE_DIR_REL}/${fileName}`,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
  return {
    screenshot: `${EVIDENCE_DIR_REL}/${fileName}`,
    screenshotMetadata: `${EVIDENCE_DIR_REL}/${path.basename(metadataPath)}`
  };
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  await page.goto(buildTargetUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);

  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  const currentUrl = page.url();
  const safeInstance = instancePathIsTarget(currentUrl);
  const safeCompany = companyParamIsTarget(currentUrl);
  const dialogs = await visibleDialogs(page);
  const dangerousDialogs = dialogs.filter(dangerousDialogText);
  const rawText = await fullText(page);
  const compact = clean(
    await compactPageText(page, {
      include: probe.include,
      maxLines: 160,
      maxLineLength: 240
    }).catch(() => '')
  );
  const text = compact || rawText;
  const expectedVisible = probe.expectedText.test(rawText);
  const blockedBy = [
    safeInstance ? '' : `Expected instance ${EXPECTED_INSTANCE} was not visible in URL.`,
    safeCompany ? '' : `Expected company ${TARGET_COMPANY} was not visible in URL query.`,
    ...dangerousDialogs.map((dialog) => `Dangerous dialog visible: ${dialog.slice(0, 180)}`)
  ].filter(Boolean);
  const status: ProbeStatus = blockedBy.length > 0 ? 'blocked' : expectedVisible ? 'observed' : 'rejected';
  const fileStem = `target-075-${String(index).padStart(3, '0')}-${probe.id}`;
  const textFile = `${fileStem}.txt`;
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No compact page text captured.');

  const shot = await screenshotWithMetadata(page, `${fileStem}.png`, {
    page: probe.label,
    pageId: probe.pageId,
    step: 'Read-only Foundation consistency probe',
    status,
    importantUi: ['Page title', 'Company context', 'visible setup/list fields', 'dangerous action text if present'],
    visibleSignals: text.split('\n').slice(0, 30),
    internallyProves: status === 'observed' ? probe.proves : `No accepted proof for ${probe.label}.`,
    doesNotProve: probe.doesNotProve,
    screenshotQaRule: 'Accept only if page identity, company context and relevant list/setup text are visible.',
    finalScreenshotStatus: status === 'observed' ? 'draft-candidate' : 'rejected',
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    textFile: `${EVIDENCE_DIR_REL}/${textFile}`,
    screenshot: shot.screenshot,
    screenshotMetadata: shot.screenshotMetadata,
    visibleSignals: text.split('\n').slice(0, 40),
    blockedBy,
    warnings: actionWarnings(rawText)
  };
}

test('TARGET-075 runs a read-only Foundation consistency pilot', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const startedAt = new Date().toISOString();
  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], index + 1));
  }

  const chart = results.find((entry) => entry.id === 'chart-of-accounts');
  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status === 'blocked');
  const rejected = results.filter((entry) => entry.status === 'rejected');
  const chartText = chart ? await fs.readFile(path.resolve(chart.textFile), 'utf8').catch(() => '') : '';
  const accountFindings = accountSignals(chartText);
  const missingStarterAccounts = accountFindings.filter((entry) => !entry.visible).map((entry) => entry.accountNo);
  const resultStatus =
    blocked.length > 0 || !chart || chart.status !== 'observed'
      ? 'blocked'
      : missingStarterAccounts.length > 0 || rejected.length > 0
        ? 'partially-completed'
        : 'observed';
  const statusFor = (id: string) => results.find((entry) => entry.id === id)?.status ?? 'blocked';
  const authGate = {
    checkedByGuard: true,
    secretsPrinted: false,
    ageHours: numericEnv('TARGET_075_AUTH_AGE_HOURS'),
    maxAgeHours: numericEnv('TARGET_075_AUTH_MAX_AGE_HOURS'),
    expiresInHours: numericEnv('TARGET_075_AUTH_EXPIRES_IN_HOURS'),
    warnExpiresInHours: numericEnv('TARGET_075_AUTH_WARN_EXPIRES_IN_HOURS'),
    warnings: authWarningsEnv(),
    doctorDecision: process.env.TARGET_075_AUTH_DOCTOR_DECISION ?? '',
    doctorLiveGate: jsonEnv('TARGET_075_AUTH_DOCTOR_LIVE_GATE'),
    authTarget: jsonEnv('TARGET_075_AUTH_TARGET'),
    targetUrlPassedToSpec: Boolean(process.env.TARGET_075_BC_TARGET_URL),
    targetUrlPrinted: false
  };
  const executionGate = {
    runnerGuardChecked: process.env.TARGET_075_RUNNER_GUARD_CHECKED === '1',
    liveApproved: process.env.TARGET_075_LIVE_APPROVED === '1',
    freezeActiveAtRunner: process.env.TARGET_075_FREEZE_ACTIVE === 'true',
    freezeOverrideUsed: process.env.TARGET_075_FREEZE_OVERRIDE_USED === 'true'
  };

  const nextCase = 'FOUNDATION-READINESS-DECISION';
  const evidenceFiles = [
    `${EVIDENCE_DIR_REL}/TARGET-075-result.json`,
    `${EVIDENCE_DIR_REL}/README.md`,
    ...results.flatMap((entry) => [entry.textFile, entry.screenshot, entry.screenshotMetadata])
  ];
  const masterDataHandoffDecision =
    resultStatus === 'observed' ? 'ready-for-read-first-review' : 'blocked-or-needs-foundation-follow-up';
  const masterDataReadFirstHandoff = [
    {
      candidate: 'PWS-MD-001',
      area: 'Debitoren (Customers)',
      decision: masterDataHandoffDecision,
      minimumBasis:
        'Company, Kontenplan, Debitoren-/Buchungsgruppen-/Payment-Abhaengigkeiten sind sichtbar oder als Luecke benannt.',
      remainsForbidden: ['Debitor speichern', 'Vorlage aendern', 'Verkaufsbeleg anlegen'],
      allowedClassifications: [
        'ready-for-customer-write-gate',
        'needs-foundation-follow-up',
        'needs-template-discovery',
        'blocked'
      ]
    },
    {
      candidate: 'PWS-MD-002',
      area: 'Kreditoren (Vendors)',
      decision: masterDataHandoffDecision,
      minimumBasis:
        'Company, Kontenplan, Kreditoren-/Buchungsgruppen-/Payment-Abhaengigkeiten sind sichtbar oder als Luecke benannt; Bankdaten bleiben ausserhalb.',
      remainsForbidden: ['Kreditor speichern', 'Bankdaten erfassen', 'Einkaufsbeleg oder Zahlung anlegen'],
      allowedClassifications: [
        'ready-for-vendor-write-gate',
        'needs-foundation-follow-up',
        'needs-template-discovery',
        'needs-payment-boundary-decision',
        'blocked'
      ]
    },
    {
      candidate: 'PWS-MD-003',
      area: 'Artikel/Services/Nichtlagerartikel',
      decision: masterDataHandoffDecision,
      minimumBasis:
        'Company, Kontenplan, Produktbuchungsgruppen, USt-Produktkontext, Basiseinheiten und Inventory-/Costing-Grenzen sind sichtbar oder als Luecke benannt.',
      remainsForbidden: [
        'Artikel speichern',
        'Basiseinheit anlegen',
        'Lager-/Bewertungs-/Buchungssetup aendern',
        'Lagerwert oder Wertposten behaupten'
      ],
      allowedClassifications: [
        'ready-for-item-write-gate',
        'needs-uom-follow-up',
        'needs-product-posting-follow-up',
        'needs-inventory-setup-follow-up',
        'needs-service-route-decision',
        'blocked'
      ]
    }
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-foundation-consistency-pilot',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Foundation read-only context',
    url: chart?.url ?? '',
    authGate,
    executionGate,
    actionsTaken: [
      'Opened Business Central with stored auth after the freeze-prepared case.',
      'Opened target Foundation pages by direct page URL inside playthru / UNIVERSAARL-DE.',
      'Captured compact page text, screenshot and screenshot-QA metadata.',
      'Classified starter chart and setup page visibility.'
    ],
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No Edit/List Edit action clicked.',
      'No values typed.',
      'No setup changed.',
      'No master data changed.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No Payment.',
      'No API shortcut.',
      'No company switch.'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: results.map((entry) => entry.screenshot),
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      `${observed.length}/${probes.length} Foundation pages were accepted as read-only visible evidence.`,
      'TARGET-075 did not write setup, master data, documents, Preview Posting, Posting, Payment or API shortcuts.',
      ...observed.map((entry) => `${entry.label} was visible read-only.`)
    ],
    notProved: [
      'No complete SKR04 chart of accounts.',
      'No final German tax or compliance claim.',
      'No VAT Posting Setup correctness.',
      'No General Posting Setup correctness.',
      'No master data readiness.',
      'No document, Preview Posting, Posting or ledger trace.',
      ...rejected.map((entry) => `${entry.label} was not visible enough for accepted proof.`),
      ...missingStarterAccounts.map((accountNo) => `Starter account ${accountNo} was not visible in compact chart evidence.`)
    ],
    blockedBy: [
      ...blocked.flatMap((entry) => entry.blockedBy),
      ...(chart && chart.status === 'observed' ? [] : ['Chart of Accounts was not accepted as visible read-only proof.'])
    ],
    warnings: Array.from(new Set([...results.flatMap((entry) => entry.warnings), ...authGate.warnings])),
    accountFindings,
    pages: results,
    foundationReadinessInput: {
      decisionStatus:
        resultStatus === 'observed'
          ? 'ready-for-foundation-readiness-decision'
          : 'needs-local-review-before-foundation-readiness-decision',
      chartOfAccounts: {
        status: chart?.status ?? 'blocked',
        starterAccountsVisible: accountFindings.filter((entry) => entry.visible).map((entry) => entry.accountNo),
        starterAccountsMissingOrUnclear: missingStarterAccounts,
        bookBoundary: 'Use as beginner-facing chart visibility only, not as complete SKR04 or posting readiness proof.'
      },
      setupContext: {
        generalBusinessPostingGroups: statusFor('general-business-posting-groups'),
        generalProductPostingGroups: statusFor('general-product-posting-groups'),
        generalPostingSetup: statusFor('general-posting-setup'),
        vatPostingSetup: statusFor('vat-posting-setup'),
        bookBoundary: 'Use as setup-page visibility and dependency map only; do not claim setup correctness from read-only visibility.'
      },
      masterDataReadFirstHandoff,
      nextProjectOutputs: [
        'Update or create FOUNDATION-READINESS-DECISION.md after reviewing this result.',
        'Classify master-data readiness only after chart/setup context is accepted.',
        'Use accepted screenshots as draft handbook/training evidence, not final compliance proof.'
      ],
      uatTrainingImpact: [
        'Shows key users where chart and posting setup context lives.',
        'Supports a Foundation checkpoint exercise before master data entry.',
        'Defines stop conditions for setup pages that expose write actions or unclear dialogs.'
      ]
    },
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      readOnlyDirectPageRoutes: true
    },
    evidenceRefs: evidenceFiles,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-074 selected TARGET-075 because W1 Foundation remains limited-learning-path-only and TARGET-073 Page 472 editor retry is parked.',
      isPlannedNextCaseStillSensible: true,
      reason:
        resultStatus === 'observed'
          ? 'The Foundation read-only pilot produced accepted chart/setup context and can hand off to the Foundation Readiness Decision.'
          : 'The Foundation pilot must be reviewed before any master data or setup write.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-READINESS-DECISION.md',
          status: resultStatus === 'observed' ? 'ready-next' : 'needs-local-review-before-decision',
          reason:
            resultStatus === 'observed'
              ? 'TARGET-075 evidence can be classified into proven, parked and blocking Foundation areas before any master-data pilot.'
              : 'Review blocked/rejected Foundation screenshots before deciding master-data or setup readiness.'
        },
        {
          caseId: 'TARGET-071B-VAT-POSTING-SETUP-REOPEN-AND-SOURCE-REVIEW',
          status: 'needs-ui-discovery-first',
          reason: 'Page 472 write route remains parked until a materially new editor/helper route exists.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'blocked',
          reason: 'O2C remains too early before Foundation/master data readiness.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'Read-only Foundation visibility is not the same as setup readiness; a Foundation Readiness Decision is the required handoff before master data.'
          : 'A local Foundation review is safer than starting writes after unclear screenshots.',
      risksBeforeNextCase: [
        'Do not treat read-only page visibility as posting readiness.',
        'Do not use Page 472 for writes without a new active-editor route.',
        'Do not start master data if chart/setup screenshots are rejected.'
      ],
      requiredPreparation:
        resultStatus === 'observed'
          ? ['Create or update FOUNDATION-READINESS-DECISION.md from TARGET-075 result evidence before selecting any master-data pilot.']
          : ['Review rejected screenshots and blocked page contexts.']
    },
    changedFiles: evidenceFiles,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: false,
    reason:
      resultStatus === 'observed'
        ? 'Read-only Foundation consistency pilot observed.'
        : 'Read-only Foundation consistency pilot needs review before any next live write.',
    nextCase
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'TARGET-075-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# TARGET-075 Chart of Accounts / Foundation Consistency Check',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Ziel- und Auth-Grenze',
      '',
      `- Erwartete Instanz: ${EXPECTED_INSTANCE}`,
      `- Erwartete Company: ${TARGET_COMPANY}`,
      `- Auth-Ziel passt zum State: ${authGate.authTarget && typeof authGate.authTarget === 'object' && 'targetMatchesState' in authGate.authTarget ? String(authGate.authTarget.targetMatchesState) : 'unbekannt'}`,
      `- Auth-Ziel aus aktuellem State aufgebaut: ${authGate.authTarget && typeof authGate.authTarget === 'object' && 'targetBuiltFromCurrentState' in authGate.authTarget ? String(authGate.authTarget.targetBuiltFromCurrentState) : 'unbekannt'}`,
      '',
      '## Was dieser Lauf nicht tut',
      '',
      '- Kein Setup schreiben.',
      '- Keine Stammdaten anlegen.',
      '- Kein Belegentwurf.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine API-Abkuerzung.',
      '',
      '## Buchwirkung',
      '',
      'Dieser Lauf liefert die Foundation-Grenze: Was ist vor Stammdaten und Buchungen sichtbar, und welche Setup-Aussagen bleiben noch offen?',
      '',
      '## Foundation-Readiness-Handoff',
      '',
      '- Nach dem Lauf `FOUNDATION-READINESS-DECISION.md` erstellen oder aktualisieren.',
      '- Kontenplan-Sichtbarkeit nicht als vollstaendigen SKR04- oder Buchungsfaehigkeitsnachweis werten.',
      '- Buchungsgruppen- und MwSt.-Seiten nur als sichtbaren Setup-Kontext werten, nicht als Korrektheitsnachweis.',
      '- Master Data erst nach angenommener Foundation-Readiness starten.',
      '',
      '## Evidence-QA',
      '',
      '- Alle Foundation-Pages brauchen beobachtete Page-Evidence.',
      '- Jede Page braucht Textauszug, Screenshot und Screenshot-Metadaten.',
      '- Rejected oder blocked Pages halten Master Data geparkt.',
      '',
      '## Evidence-Dateien',
      '',
      ...evidenceFiles.map((file) => `- ${file}`),
      '',
      '## UAT- und Trainingswirkung',
      '',
      '- Key User sehen, wo Kontenplan und Setup-Kontext geprueft werden.',
      '- Der Lauf liefert eine Uebung fuer den Foundation-Checkpoint vor Stammdaten.',
      '- Unklare Dialoge, Edit-Modus oder falsche Company blockieren den naechsten Schritt.',
      ''
    ].join('\n')
  );

  expect(blocked, 'No unsafe instance/company/dialog blocker is allowed in TARGET-075.').toEqual([]);
  expect(chart?.status, 'Chart of Accounts must be the anchor proof for TARGET-075.').toBe('observed');
});
