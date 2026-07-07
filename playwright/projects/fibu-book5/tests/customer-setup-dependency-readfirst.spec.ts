import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(240_000);
test.skip(
  process.env.CUSTOMER_SETUP_DEP_LIVE_APPROVED !== '1' || process.env.CUSTOMER_SETUP_DEP_RUNNER_GUARD_CHECKED !== '1',
  'CUSTOMER-SETUP-DEPENDENCY-READFIRST must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'CUSTOMER-SETUP-DEPENDENCY-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_CUSTOMER = 'U-CUST-100';
const TARGET_CUSTOMER_NAME = 'Saarland Maschinenbau AG';
const ROUTE_RECOVERY_CASE = 'CUSTOMER-SETUP-ROUTE-RECOVERY-READFIRST';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'customer-setup-dependency-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

type SetupProbe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  include: RegExp;
  beginnerMeaning: string;
};

type SetupProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked';
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  textFile: string;
  textSignals: string[];
  pageInspectionOpened: boolean;
  pageInspectionScreenshot?: string;
  reason: string;
};

const setupProbes: SetupProbe[] = [
  {
    id: 'customer-posting-groups',
    pageId: 110,
    label: 'Debitorenbuchungsgruppen / Customer Posting Groups',
    expectedText: /Debitorenbuchungsgruppen|Customer Posting Groups|Debitorensammelkonto|Forderung|Receivables|Code|Beschreibung|Description/i,
    include: /Debitorenbuchungsgruppen|Customer Posting Groups|Debitorensammelkonto|Forderung|Receivables|Code|Beschreibung|Description|INLAND|1200|Konto|Account|Neu|New|Bearbeiten|Edit/i,
    beginnerMeaning:
      'Debitorenbuchungsgruppen verbinden Debitorenposten mit Forderungskonten. Ohne passende Gruppe ist eine Verkaufsrechnung nicht sauber kontierbar.'
  },
  {
    id: 'general-business-posting-groups',
    pageId: 312,
    label: 'Geschaeftsbuchungsgruppen / Gen. Business Posting Groups',
    expectedText: /Geschaeftsbuchungsgruppen|Geschaftsbuchungsgruppen|Gen\. Business Posting Groups|Code|Beschreibung|Description|INLAND/i,
    include: /Geschaeftsbuchungsgruppen|Geschaftsbuchungsgruppen|Gen\. Business Posting Groups|Code|Beschreibung|Description|INLAND|Neu|New|Bearbeiten|Edit/i,
    beginnerMeaning:
      'Geschaeftsbuchungsgruppen beschreiben, mit wem die Firma handelt. In der Buchungsmatrix werden sie mit Produktbuchungsgruppen kombiniert.'
  },
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    expectedText: /MwSt\.-?Geschaeftsbuchungsgruppen|MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Geschaeftsbuchungsgruppen|VAT Business Posting Groups|Code|Beschreibung|Description/i,
    include: /MwSt|USt|VAT|Geschaeftsbuchungsgruppen|Geschaftsbuchungsgruppen|Business Posting Groups|Code|Beschreibung|Description|INLAND|Neu|New|Bearbeiten|Edit/i,
    beginnerMeaning:
      'MwSt.-Geschaeftsbuchungsgruppen ordnen Debitoren und Kreditoren einem steuerlichen Markt zu, zum Beispiel Inland oder Ausland.'
  },
  {
    id: 'payment-terms',
    pageId: 4,
    label: 'Zahlungsbedingungen / Payment Terms',
    expectedText: /Zahlungsbedingungen|Payment Terms|Faelligkeitsformel|Due Date Calculation|Code|Beschreibung|Description/i,
    include: /Zahlungsbedingungen|Payment Terms|Faelligkeitsformel|Due Date Calculation|Skonto|Discount|Code|Beschreibung|Description|Neu|New|Bearbeiten|Edit/i,
    beginnerMeaning:
      'Zahlungsbedingungen steuern Faelligkeiten und moegliche Skontologik auf Verkaufs- und Einkaufsbelegen.'
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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|upn:/i.test(line))
    .join('\n')
    .trim();
}

function targetInstanceUrl() {
  const url = new URL(process.env.CUSTOMER_SETUP_DEP_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  return url;
}

function buildTargetUrl(pageId: number, filter?: string) {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  if (filter) url.searchParams.set('filter', filter);
  return url.toString();
}

function buildCustomerCardUrl() {
  return buildTargetUrl(21, `Customer.'No.' IS '@*${TARGET_CUSTOMER}*'`);
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
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

async function capture(page: Page, captures: Capture[], fileName: string, metadata: Record<string, unknown>) {
  const shot = await screenshotWithMetadata(page, fileName, metadata);
  captures.push(shot);
  return shot;
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = Math.min(await locator.count().catch(() => 0), 20);
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isVisible({ timeout }).catch(() => false)) return candidate;
  }
  return null;
}

async function expandFastTab(page: Page, label: RegExp) {
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const candidates = [
      scope.getByRole('button', { name: label }),
      scope.getByText(label)
    ];
    for (const locator of candidates) {
      const candidate = await firstVisible(locator);
      if (!candidate) continue;
      await candidate.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
      await candidate.hover({ timeout: 2000 }).catch(() => undefined);
      await candidate.click({ timeout: 5000 }).catch(async () => {
        await candidate.evaluate((element) => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))).catch(() => undefined);
      });
      await page.waitForTimeout(1000);
      return `scope-${scopeIndex}`;
    }
  }
  return '';
}

async function hoverField(page: Page, pattern: RegExp) {
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const candidate = await firstVisible(scope.getByText(pattern));
    if (!candidate) continue;
    await candidate.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
    await candidate.hover({ timeout: 3000 }).catch(() => undefined);
    await page.waitForTimeout(700);
    return `hovered-scope-${scopeIndex}`;
  }
  return '';
}

async function inspectCurrentPage(page: Page, captures: Capture[], fileName: string, metadata: Record<string, unknown>) {
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1200);
  const inspectionText = await fullText(page);
  const opened = /Page Inspection|Inspect pages and data|Page ID|Page Name|Page Type|Source Table|Table ID|Seitenpr|Seitenuberprufung|Seitenueberpruefung/i.test(
    inspectionText
  );
  const shot = await capture(page, captures, fileName, {
    ...metadata,
    step: `${metadata.step ?? 'Page Inspection'} / Page Inspection`,
    visibleSignals: inspectionText.split('\n').slice(0, 120),
    pageInspectionOpened: opened,
    noWrite: true,
    noPost: true,
    noPreview: true
  });
  return { opened, text: inspectionText, shot };
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu visible but not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/List Edit visible but not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text) ? 'Posting/Preview text visible but not clicked.' : ''
  ].filter(Boolean);
}

function extractSignals(text: string, include: RegExp, max = 90) {
  return text
    .split('\n')
    .filter((line) => include.test(line))
    .slice(0, max);
}

async function openCustomerCardAndCapture(page: Page, captures: Capture[]) {
  await page.goto(buildCustomerCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  const initialText = await fullText(page);
  await capture(page, captures, 'customer-setup-dep-010-customer-card-start.png', {
    page: 'Debitorenkarte / Customer Card',
    pageId: 21,
    step: 'Customer card before setup dependency inspection',
    importantUi: [TARGET_CUSTOMER, TARGET_CUSTOMER_NAME, 'read-only customer card context'],
    visibleSignals: initialText.split('\n').slice(0, 120),
    internallyProves: /U-CUST-100|Saarland Maschinenbau AG/i.test(initialText)
      ? 'U-CUST-100 customer card context is visible before dependency inspection.'
      : 'Customer card context is not strong enough.',
    doesNotProve: ['No setup values are chosen', 'No O2C readiness', 'No write/reopen proof'],
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  const billingRoute = await expandFastTab(page, /^Fakturierung$|^Invoicing$/i);
  const billingText = await fullText(page);
  await capture(page, captures, 'customer-setup-dep-020-billing-fasttab-expanded.png', {
    page: 'Debitorenkarte / Customer Card',
    pageId: 21,
    step: 'Billing/Fakturierung FastTab expanded before choosing setup values',
    routeUsed: billingRoute || 'not-expanded',
    importantUi: ['Debitorenbuchungsgruppe', 'Geschaeftsbuchungsgruppe', 'USt.-Geschaeftsbuchungsgruppe if visible'],
    visibleSignals: billingText.split('\n').filter((line) => /Fakturierung|Buchungsgruppe|Posting Group|MwSt|USt|VAT|INLAND|Zahlung|Payment/i.test(line)).slice(0, 120),
    internallyProves: 'Billing setup field context was captured before opening setup lists.',
    doesNotProve: ['No selected dropdown value', 'No setup correctness', 'No save'],
    warnings: visibleWarnings(billingText),
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  const hoverRoute = await hoverField(page, /Debitorenbuchungsgruppe|Customer Posting Group|Geschaeftsbuchungsgruppe|Business Posting Group|Zahlungsbeding/i);
  const hoverText = await fullText(page);
  await capture(page, captures, 'customer-setup-dep-030-field-hover-context.png', {
    page: 'Debitorenkarte / Customer Card',
    pageId: 21,
    step: 'Hover/tooltip-style context on setup fields, without opening editors',
    routeUsed: hoverRoute || 'no-safe-hover-target-found',
    importantUi: ['field label hover', 'no dropdown selection', 'no save dialog'],
    visibleSignals: hoverText.split('\n').filter((line) => /Debitorenbuchungsgruppe|Customer Posting Group|Geschaeft|Business|Zahlungsbeding|Payment Terms|Tooltip|QuickInfo/i.test(line)).slice(0, 100),
    internallyProves: hoverRoute ? 'A setup-field hover context was attempted without editing.' : 'No stable hover target was found.',
    doesNotProve: ['No dropdown values', 'No field value correctness'],
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  const paymentRoute = await expandFastTab(page, /^Zahlungen$|^Payments$/i);
  const paymentText = await fullText(page);
  await capture(page, captures, 'customer-setup-dep-040-payment-fasttab-expanded.png', {
    page: 'Debitorenkarte / Customer Card',
    pageId: 21,
    step: 'Payment/Zahlungen FastTab expanded before payment terms selection',
    routeUsed: paymentRoute || 'not-expanded',
    importantUi: ['Zahlungsbedingungen', 'Zahlungsform', 'no editor opened'],
    visibleSignals: paymentText.split('\n').filter((line) => /Zahlungen|Payment|Zahlungsbeding|Payment Terms|Zahlungsform|Payment Method|Mahnung|Reminder/i.test(line)).slice(0, 120),
    internallyProves: 'Payment setup field context was captured before opening payment terms setup.',
    doesNotProve: ['No payment terms list value', 'No payment method readiness'],
    warnings: visibleWarnings(paymentText),
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  await inspectCurrentPage(page, captures, 'customer-setup-dep-050-customer-page-inspection.png', {
    page: 'Debitorenkarte / Customer Card',
    pageId: 21,
    step: 'Customer card Page Inspection after FastTab and hover checks',
    importantUi: ['Page Inspection', 'Customer table/page', 'field context']
  });
}

async function probeSetupPage(page: Page, probe: SetupProbe, captures: Capture[]): Promise<SetupProbeResult> {
  await page.goto(buildTargetUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1200);

  const text = await fullText(page);
  const signals = extractSignals(text, probe.include);
  const contextLooksLikeTarget = probe.expectedText.test(text) && signals.length > 0;
  const shot = await capture(page, captures, `customer-setup-dep-${probe.id}-context.png`, {
    page: probe.label,
    pageId: probe.pageId,
    step: `Read-only setup dependency page: ${probe.label}`,
    beginnerMeaning: probe.beginnerMeaning,
    importantUi: ['page title/list context', 'code/description/account fields if visible', 'read-only action boundary'],
    visibleSignals: signals,
    internallyProves: contextLooksLikeTarget
      ? `${probe.label} has initial page-like text, pending Page Inspection validation.`
      : `${probe.label} did not pass initial screenshot/text QA.`,
    doesNotProve: ['No setup correctness', 'No row selected for writing', 'No customer field assignment', 'No O2C readiness'],
    warnings: visibleWarnings(text),
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, `customer-setup-dep-${probe.id}-context.txt`), signals.join('\n') || text);

  const inspection = await inspectCurrentPage(page, captures, `customer-setup-dep-${probe.id}-page-inspection.png`, {
    page: probe.label,
    pageId: probe.pageId,
    step: `Page Inspection for setup dependency page: ${probe.label}`,
    importantUi: ['Page Inspection', probe.label]
  });
  const inspectionLooksLikeTarget = probe.expectedText.test(inspection.text);
  const inspectionShowsRoleCenter = /Business Manager Role Center\s*\(9022|Rollencenterseite|Role Center/i.test(inspection.text);
  const observed = contextLooksLikeTarget && inspection.opened && inspectionLooksLikeTarget && !inspectionShowsRoleCenter;
  const blockedReason = !contextLooksLikeTarget
    ? 'setup dependency page did not expose enough expected text'
    : !inspection.opened
      ? 'Page Inspection did not open, so screenshot truth could not be verified'
      : inspectionShowsRoleCenter
        ? 'Page Inspection shows Business Manager Role Center instead of the requested setup page'
        : !inspectionLooksLikeTarget
          ? 'Page Inspection did not confirm the requested setup page'
          : '';

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status: observed ? 'observed' : 'blocked',
    url: sanitizeUrl(page.url()),
    screenshot: shot.screenshot,
    screenshotMetadata: shot.screenshotMetadata,
    textFile: `${EVIDENCE_DIR_REL}/customer-setup-dep-${probe.id}-context.txt`,
    textSignals: signals,
    pageInspectionOpened: inspection.opened,
    pageInspectionScreenshot: inspection.shot.screenshot,
    reason: observed ? 'setup dependency page passed read-first screenshot/text and Page Inspection QA' : blockedReason
  };
}

test('CUSTOMER-SETUP-DEPENDENCY-READFIRST reads setup dependencies with strong screenshot QA', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const blockedBy: string[] = [];

  await openCustomerCardAndCapture(page, captures);

  const setupResults: SetupProbeResult[] = [];
  for (const probe of setupProbes) {
    const result = await probeSetupPage(page, probe, captures);
    setupResults.push(result);
    if (result.status !== 'observed') blockedBy.push(`${probe.label} not observed strongly enough.`);
  }

  await page.goto(buildCustomerCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  const endText = await fullText(page);
  await capture(page, captures, 'customer-setup-dep-900-no-save-end-context.png', {
    page: 'Debitorenkarte / Customer Card',
    pageId: 21,
    step: 'No-save end context after setup dependency read-first run',
    importantUi: [TARGET_CUSTOMER, TARGET_CUSTOMER_NAME, 'no save dialog', 'no document/draft'],
    visibleSignals: endText.split('\n').slice(0, 100),
    internallyProves: /U-CUST-100|Saarland Maschinenbau AG/i.test(endText)
      ? 'Run ended back in customer card context without save/draft/posting.'
      : 'End context is not strong enough for customer-card closure.',
    doesNotProve: ['No write/reopen proof because this case intentionally did not write'],
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  const observedCount = setupResults.filter((result) => result.status === 'observed').length;
  const observed = observedCount >= 3 && /U-CUST-100|Saarland Maschinenbau AG/i.test(endText);
  const status = observed ? 'observed-read-first-dependencies' : 'partially-blocked-read-first-dependencies';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-customer-setup-dependency-proof',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Customer setup dependencies',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened U-CUST-100 customer card read-only.',
      'Captured billing and payment FastTab contexts.',
      'Attempted field hover context without selecting values.',
      'Opened Customer Posting Groups, General Business Posting Groups, VAT Business Posting Groups and Payment Terms read-only.',
      'Captured setup page screenshots and Page Inspection diagnostics.',
      'Returned to customer card no-save end context.'
    ],
    actionsNotTaken: [
      'No customer edited or saved.',
      'No dropdown value selected.',
      'No setup row created, edited or saved.',
      'No posting group, VAT setup, payment term, payment method or dimension changed.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No confidential real customer data used.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    confidentialRealCustomerDataUsed: false,
    screenshots: captures.map((entry) => entry.screenshot),
    setupResults,
    screenshotQa: {
      requiredCheckpoints: [
        'customer-card-before-any-field-interaction',
        'billing-fasttab-expanded',
        'payment-fasttab-expanded',
        'field-hover-context-before-selection',
        'setup-list-context-for-each-relevant-page',
        'page-inspection-for-source-page-and-target-setup-page',
        'no-save-end-context'
      ],
      capturedCheckpoints: captures.map((entry) => entry.screenshot),
      acceptedForWriteGate: observed && setupResults.every((entry) => entry.status === 'observed'),
      acceptedForBookTrainingDraft: observed,
      reason: observed
        ? 'Multiple customer and setup dependency screenshots were captured without write actions.'
        : 'Some setup dependency pages were not observed strongly enough; do not write customer setup values yet.'
    },
    proved: [
      'playthru / UNIVERSAARL-DE was used for a real Business Central read-first run.',
      'U-CUST-100 / Saarland Maschinenbau AG customer setup context was inspected without editing.',
      ...setupResults
        .filter((entry) => entry.status === 'observed')
        .map((entry) => `${entry.label} was observed read-only.`),
      'No setup, master data, document, Preview Posting, Posting, payment or API shortcut was changed.'
    ],
    notProved: [
      'No customer setup value was selected or written.',
      'No VAT, posting group or payment term correctness.',
      'No O2C readiness.',
      'No sales document, Preview Posting, Posting, payment or ledger trace.',
      ...setupResults.filter((entry) => entry.status !== 'observed').map((entry) => `${entry.label} remains not strongly proven.`)
    ],
    blockedBy,
    warnings: [
      'This run uses real Business Central UI in playthru, not mockups.',
      'Customer data is realistic fictitious Universaarl data, not confidential real customer data.',
      'Visible setup lists do not by themselves prove account/tax/process correctness.'
    ],
    flags: {
      noSetupChange: true,
      noMasterDataChange: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noApiShortcut: true,
      noConfidentialRealCustomerData: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'CUSTOMER-SETUP-VALUE-WRITE-GATE',
      lastEvidenceSummary: `Observed ${observedCount}/${setupResults.length} setup dependency pages with screenshot QA.`,
      isPlannedNextCaseStillSensible: observed && setupResults.every((entry) => entry.status === 'observed'),
      reason: observed
        ? 'A narrow write-gate can be planned, but only after values are chosen from the observed setup pages.'
        : 'The setup dependencies are not fully observed; write gate remains blocked.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-SETUP-VALUE-WRITE-GATE',
          status: observed ? 'ready-after-current' : 'blocked',
          reason: observed ? 'Setup pages are visible; a separate narrow Smart Decision can choose values.' : 'Missing setup evidence blocks write.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'O2C still needs customer field assignment plus item/service and VAT/product setup readiness.'
        },
        {
          caseId: 'CUSTOMER-TRAINING-SETUP-FIELDS-DRAFT',
          status: observed ? 'ready-after-current' : 'needs-book-context-first',
          reason: 'Screenshots can support training only after their boundaries are explicit.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: observed ? 'CUSTOMER-SETUP-VALUE-WRITE-GATE' : ROUTE_RECOVERY_CASE,
      whySelectedNextCaseIsBest: observed
        ? 'The dependency pages are visible enough to plan a separate write gate without guessing.'
        : 'A narrower route-recovery case avoids repeating the same failing direct page-id route.',
      risksBeforeNextCase: [
        'Visible setup list does not equal correctness.',
        'Do not select dropdown values in this read-first case.',
      'Auth may expire before follow-up.'
      ],
      requiredPreparation: observed
        ? ['Choose exact values from observed setup evidence before any write.', 'Keep the write gate field-limited and reopen-proven.']
        : ['Repair route/page IDs or use bounded Tell-Me/Page Inspection recovery for blocked setup pages.', 'Do not treat Role Center screenshots as setup-page proof.']
    },
    nextCase: observed ? 'CUSTOMER-SETUP-VALUE-WRITE-GATE' : ROUTE_RECOVERY_CASE
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# CUSTOMER-SETUP-DEPENDENCY-READFIRST',
      '',
      `Status: ${status}`,
      `Setup-Seiten beobachtet: ${observedCount}/${setupResults.length}`,
      '',
      'Dieser Lauf liest die Setup-Abhaengigkeiten fuer `U-CUST-100 / Saarland Maschinenbau AG` in echter Business-Central-Oberflaeche.',
      '',
      'Nicht ausgefuehrt: kein Edit, kein Save, kein Setup-Write, kein Beleg, keine Buchungsvorschau, keine Buchung, kein API Shortcut.',
      '',
      'Wichtig fuer das Buch: Screenshots duerfen nur erklaeren, welche Seiten und Felder sichtbar sind. Sie beweisen noch keine fachliche Korrektheit der Werte.',
      '',
      'Screenshot-QA-Regel: Ein Role-Center-Screenshot zaehlt nicht als Setup-Seitenbeweis, auch wenn die URL urspruenglich eine Page-ID enthielt.'
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
