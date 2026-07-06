import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(210_000);
test.skip(
  process.env.CUSTOMER_U_CUST_100_DEP_LIVE_APPROVED !== '1' ||
    process.env.CUSTOMER_U_CUST_100_DEP_RUNNER_GUARD_CHECKED !== '1',
  'CUSTOMER-U-CUST-100-DEPENDENCY-READFIRST must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'CUSTOMER-U-CUST-100-DEPENDENCY-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_CUSTOMER = 'U-CUST-100';
const TARGET_CUSTOMER_NAME = 'Universaarl Kunde 100';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'customer-u-cust-100-dependency-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const CURRENT_USER_PATTERN = new RegExp(`Kaje${'tan'}[.\\s_-]*Kali${'cki'}`, 'gi');

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(CURRENT_USER_PATTERN, '[user]')
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
  const url = new URL(process.env.CUSTOMER_U_CUST_100_DEP_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before CUSTOMER-U-CUST-100 can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE)) {
    throw new Error('Target URL must resolve to playthru before navigation.');
  }
  if ((url.searchParams.get('company') ?? '').toUpperCase() !== TARGET_COMPANY) {
    throw new Error('Target URL must resolve to UNIVERSAARL-DE before navigation.');
  }
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

async function captureReadOnlyCheckpoint(page: Page, fileName: string, metadata: Record<string, unknown>, captures: Capture[]) {
  const shot = await screenshotWithMetadata(page, fileName, metadata);
  captures.push(shot);
  return shot;
}

async function clickFirstVisible(page: Page, label: RegExp) {
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const candidates: Array<{ name: string; locator: Locator }> = [
      { name: 'role-link', locator: scope.getByRole('link', { name: label }).first() },
      { name: 'role-button', locator: scope.getByRole('button', { name: label }).first() },
      { name: 'anchor-text', locator: scope.locator('a').filter({ hasText: label }).first() },
      { name: 'visible-text', locator: scope.getByText(label).first() }
    ];
    for (const candidate of candidates) {
      if (await candidate.locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await candidate.locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
        await candidate.locator.click({ timeout: 5000 });
        return `${candidate.name}-scope-${scopeIndex}`;
      }
    }
  }
  return '';
}

function customerListSignalCount(text: string) {
  return [/Debitor|Customer|Kunde/i, /Nr\.|No\.|Name/i].filter((signal) => signal.test(text)).length;
}

function hasCustomerCardContext(text: string) {
  return /Debitorenkarte|Customer Card/i.test(text) && /U-CUST-100/i.test(text) && /Universaarl Kunde 100/i.test(text);
}

function hasLedgerEntryContext(text: string) {
  return /Debitorenposten|Customer Ledger Entries|Customer Ledger Entry|Posten/i.test(text) && /U-CUST-100|Debitor|Customer/i.test(text);
}

function hasCustomerDependencyStatistics(text: string) {
  const signals = [
    /Saldo \(MW\)\s+0,00/i,
    /Auftragsbestand \(MW\)\s+0,00/i,
    /Nicht fakt\. Lieferungen \(MW\)\s+0,00/i,
    /Ausstehende Rechnungen \(MW\)\s+0,00/i,
    /Lauf\. Rechnungen\s+0/i,
    /Gebuchte Verkaufsrechnungen\s+0/i,
    /Gebuchte Verkaufslieferungen\s+0/i,
    /Gutschriften\s+0/i
  ];
  return signals.filter((signal) => signal.test(text)).length >= 4;
}

function unsafeActionWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/List Edit may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text) ? 'Posting/Preview text may be visible but was not clicked.' : ''
  ].filter(Boolean);
}

async function openCustomerList(page: Page, captures: Capture[]) {
  await page.goto(buildTargetUrl(22), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  let text = await fullText(page);
  if (customerListSignalCount(text) < 2 || !new RegExp(TARGET_CUSTOMER, 'i').test(text)) {
    const routeUsed = await clickFirstVisible(page, /^Debitoren$|^Customers$|^Kunden$/i);
    if (routeUsed) {
      await waitForBusinessCentralShell(page);
      await dismissTours(page);
      await expect.poll(async () => customerListSignalCount(await fullText(page)), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
      text = await fullText(page);
    }
  }

  await captureReadOnlyCheckpoint(
    page,
    'customer-u-cust-100-010-customer-list-context.png',
    {
      page: 'Debitoren / Customers',
      pageId: 22,
      step: 'Customer list context with existing U-CUST-100',
      importantUi: ['Debitoren list', 'U-CUST-100 row', 'no New/Neu action clicked'],
      visibleSignals: text.split('\n').slice(0, 100),
      internallyProves: /U-CUST-100|Universaarl Kunde 100/i.test(text)
        ? 'Existing customer U-CUST-100 is visible before any dependency inspection.'
        : 'Customer list was opened, but U-CUST-100 is not visible enough.',
      doesNotProve: ['No customer dependency status', 'No customer setup correctness', 'No O2C readiness'],
      finalScreenshotStatus: /U-CUST-100|Universaarl Kunde 100/i.test(text) ? 'draft-candidate' : 'boundary-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );
  return text;
}

async function cardContextVisible(page: Page) {
  return hasCustomerCardContext(await fullText(page));
}

async function waitForCardContext(page: Page, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    await waitForBusinessCentralShell(page).catch(() => undefined);
    await dismissTours(page).catch(() => undefined);
    if (await cardContextVisible(page)) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

async function openExistingCustomerCard(page: Page) {
  const attemptedRoutes: string[] = [];

  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const customerNo = scope.getByText(new RegExp(`^\\s*${TARGET_CUSTOMER}\\s*$`, 'i')).first();
    if (!(await customerNo.isVisible({ timeout: 1500 }).catch(() => false))) continue;
    await customerNo.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);

    attemptedRoutes.push(`row-double-click-scope-${scopeIndex}`);
    await customerNo.dblclick({ timeout: 5000 }).catch(() => undefined);
    if (await waitForCardContext(page)) return attemptedRoutes.join(' -> ');

    attemptedRoutes.push(`row-enter-scope-${scopeIndex}`);
    await customerNo.click({ timeout: 5000 }).catch(() => undefined);
    await page.keyboard.press('Enter').catch(() => undefined);
    if (await waitForCardContext(page)) return attemptedRoutes.join(' -> ');
  }

  return attemptedRoutes.join(' -> ');
}

async function openCustomerLedgerEntries(page: Page, captures: Capture[]) {
  const filter = `'Cust. Ledger Entry'.'Customer No.' IS '${TARGET_CUSTOMER}'`;
  await page.goto(buildTargetUrl(25, filter), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1500);

  const text = await fullText(page);
  const hasContext = hasLedgerEntryContext(text);
  const noEntriesSignal = /keine Zeilen|No rows|There is nothing to show|Keine Daten|nothing to show/i.test(text);
  await captureReadOnlyCheckpoint(
    page,
    'customer-u-cust-100-040-customer-ledger-entries-context.png',
    {
      page: 'Debitorenposten / Customer Ledger Entries',
      pageId: 25,
      step: 'Customer Ledger Entries filtered/read-only context for U-CUST-100',
      importantUi: ['Debitorenposten list', 'Customer No. filter/context', 'entry or empty-list signal'],
      visibleSignals: text.split('\n').slice(0, 140),
      internallyProves: hasContext
        ? 'Customer Ledger Entries context was reached read-only for dependency inspection.'
        : 'The ledger-entry dependency page did not provide accepted context.',
      doesNotProve: [
        'No complete dependency audit across all possible customer references',
        'No O2C readiness',
        'No permission to edit or delete customer'
      ],
      finalScreenshotStatus: hasContext ? 'draft-candidate' : 'boundary-candidate',
      noEntriesSignal,
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );
  return { text, hasContext, noEntriesSignal };
}

test('CUSTOMER-U-CUST-100 dependency proof reads customer context without writing', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];

  const listText = await openCustomerList(page, captures);
  const listShowsCustomer = /U-CUST-100|Universaarl Kunde 100/i.test(listText);
  if (!listShowsCustomer) blockedBy.push('U-CUST-100 was not visible in the customer list.');

  const openRoute = await openExistingCustomerCard(page);
  if (openRoute) actionsTaken.push(`Opened existing customer through ${openRoute}.`);
  const cardText = await fullText(page);
  const cardAccepted = hasCustomerCardContext(cardText);
  const cardStatisticsAccepted = hasCustomerDependencyStatistics(cardText);
  if (!cardAccepted) blockedBy.push('Customer card context for U-CUST-100 was not accepted.');
  if (!cardStatisticsAccepted) blockedBy.push('Customer card statistics/FactBoxes did not provide accepted zero-dependency signals.');

  await captureReadOnlyCheckpoint(
    page,
    'customer-u-cust-100-020-customer-card-context.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Existing U-CUST-100 customer card context before dependency decision',
      openRoute: openRoute || 'no safe open route found',
      importantUi: ['U-CUST-100', TARGET_CUSTOMER_NAME, 'Saldo/Balance if visible', 'FastTabs/FactBox if visible'],
      visibleSignals: cardText.split('\n').slice(0, 130),
      internallyProves:
        cardAccepted && cardStatisticsAccepted
          ? 'Existing customer U-CUST-100 card context and zero-statistics/FactBox signals are visible without creating or saving a record.'
          : cardAccepted
            ? 'Existing customer U-CUST-100 card context is visible, but dependency statistics were not strong enough.'
            : 'Existing customer card context was not strong enough.',
      doesNotProve: ['No dependency clearance', 'No setup correctness', 'No customer conversion write permission'],
      finalScreenshotStatus: cardAccepted && cardStatisticsAccepted ? 'draft-candidate' : 'boundary-candidate',
      cardStatisticsAccepted,
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1000);
  const inspectionText = await fullText(page);
  const inspectionAccepted =
    /Customer \(18\)|Customer Card|Debitor/i.test(inspectionText) && !/Business Manager Role Center/i.test(inspectionText);
  if (!inspectionAccepted) blockedBy.push('Page Inspection did not provide accepted Customer table/card proof.');

  await captureReadOnlyCheckpoint(
    page,
    'customer-u-cust-100-030-page-inspection-context.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Page Inspection boundary on U-CUST-100 customer context',
      importantUi: ['Page Inspection pane', 'Customer Card page', 'Customer table'],
      visibleSignals: inspectionText.split('\n').slice(0, 120),
      internallyProves: inspectionAccepted
        ? 'Page Inspection produced customer-related page/table context.'
        : 'Page Inspection was not accepted as strong Customer table/card proof.',
      doesNotProve: ['No field value correctness', 'No edit/save proof', 'No dependency clearance'],
      finalScreenshotStatus: inspectionAccepted ? 'draft-candidate' : 'boundary-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  const ledger = await openCustomerLedgerEntries(page, captures);
  if (ledger.hasContext) actionsTaken.push('Opened Customer Ledger Entries read-only for dependency context.');
  if (!ledger.hasContext) actionsTaken.push('Customer Ledger Entries direct page route did not provide accepted context; card statistics/FactBoxes remain the primary read-first dependency signal.');

  const finalText = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'customer-u-cust-100-050-no-save-end-context.png',
    {
      page: 'Read-only customer dependency proof end context',
      pageId: '21-and-25',
      step: 'No-save end context after customer dependency read-first proof',
      importantUi: ['no save dialog', 'no edit confirmation', 'read-only page context'],
      visibleSignals: finalText.split('\n').slice(0, 100),
      internallyProves: 'The run ended without save, create, delete, document, preview or posting action.',
      doesNotProve: ['No write/reopen proof because this case intentionally did not write'],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  const compact = clean(
    await compactPageText(page, {
      include: [
        /U-CUST-100|Universaarl Kunde 100|Debitor|Customer|Debitorenkarte|Customer Card|Debitorenposten|Customer Ledger|Saldo|Balance|Restbetrag|Remaining Amount|Betrag|Amount|Offen|Open|Posten|Entries/i
      ],
      maxLines: 260,
      maxLineLength: 260
    }).catch(() => '')
  );
  const textFile = 'customer-u-cust-100-010-dependency-context.txt';
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, textFile),
    compact || clean(`${listText}\n${cardText}\n${inspectionText}\n${ledger.text}\n${finalText}`)
  );

  const dependencyStatus = ledger.hasContext
    ? (ledger.noEntriesSignal ? 'observed-no-visible-entries-signal' : 'observed-ledger-context')
    : cardStatisticsAccepted
      ? 'observed-card-statistics-zero-visible'
      : 'inconclusive';
  const observed = listShowsCustomer && cardAccepted && cardStatisticsAccepted;
  const status = observed ? 'observed-read-first-dependency-context' : 'blocked-read-first-dependency-context';
  const allText = clean(`${listText}\n${cardText}\n${inspectionText}\n${ledger.text}\n${finalText}`);
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-customer-dependency-proof',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Debitorenkarte / Debitorenposten',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened guarded Business Central context for playthru / UNIVERSAARL-DE.',
      'Opened Customers list read-only.',
      ...actionsTaken,
      'Captured customer list, card, Page Inspection, ledger-entry dependency and no-save end screenshots.',
      'Kept the run read-first and no-save.'
    ],
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No customer created.',
      'No customer edited.',
      'No customer saved.',
      'No customer deleted.',
      'No customer template changed.',
      'No posting group, payment terms, dimensions or VAT setup changed.',
      'No sales document or draft created.',
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
    screenshots: captures.map((capture) => capture.screenshot),
    screenshotQa: {
      requiredCheckpoints: [
        'customer list with U-CUST-100',
        'U-CUST-100 customer card context with zero-statistics/FactBox signals',
        'Page Inspection customer boundary',
        'Customer Ledger Entries route or equivalent card statistics dependency context',
        'no-save end context'
      ],
      capturedCheckpoints: captures.map((capture) => capture.screenshot),
      acceptedForDependencyDecision: observed,
      acceptedForCustomerWriteGate: false,
      acceptedForO2CReady: false,
      reason: observed
        ? 'Multiple real Business Central screenshots show the existing customer and read-only dependency signals from card statistics/FactBoxes; the direct ledger route is helpful but not required for this no-write decision.'
        : 'One or more required contexts were not strong enough.'
    },
    dependencyStatus,
    proved: observed
      ? [
          'Existing customer U-CUST-100 / Universaarl Kunde 100 is visible in playthru / UNIVERSAARL-DE.',
          'The existing customer can be opened/read without duplicate creation or save.',
          'Customer-related Page Inspection context was attempted and captured.',
          cardStatisticsAccepted
            ? 'Customer card statistics/FactBoxes show zero visible balance, open sales and posted sales-history signals for the inspected placeholder.'
            : 'Customer card statistics/FactBoxes were inspected, but not accepted as dependency signal.',
          ledger.hasContext
            ? 'Customer Ledger Entries / Debitorenposten context was reached read-only for dependency inspection.'
            : 'The direct Customer Ledger Entries route was attempted and captured as a boundary; no write action followed.',
          'No customer, setup, document, Preview Posting, Posting, payment or API shortcut was changed.'
        ]
      : [],
    notProved: [
      'No full cross-table dependency audit across every possible customer reference.',
      'No customer conversion write gate approval.',
      'No customer setup correctness.',
      'No full deletion-safety guarantee from all BC tables; this is a customer-facing read-first dependency signal, not a destructive cleanup approval.',
      'No O2C readiness.',
      'No VAT or posting group correctness.',
      'No Preview Posting, Posting, payment or ledger trace from a new process.',
      inspectionAccepted
        ? 'Page Inspection was customer-related, but no field enforcement or save/reopen cycle was tested.'
        : 'Page Inspection was not accepted as strong Customer table/card proof.'
    ],
    blockedBy: observed ? [] : blockedBy,
    warnings: unsafeActionWarnings(allText),
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      readOnlyDirectPageRoute: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: observed
        ? 'U-CUST-100 customer card and read-only ledger/dependency context were observed in playthru / UNIVERSAARL-DE.'
        : 'U-CUST-100 dependency proof did not reach all required screenshot contexts.',
      isPlannedNextCaseStillSensible: !observed,
      reason: observed
        ? 'The dependency read-first proof is enough to plan the next data-quality decision, but not enough to write automatically.'
        : 'The same proof remains needed before customer conversion or alternate-number decisions.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-U-CUST-100-CONVERSION-WRITE-GATE',
          status: observed ? 'needs-setup-first' : 'blocked',
          reason: 'A conversion write gate still needs explicit setup field boundaries and a final smart decision.'
        },
        {
          caseId: 'CUSTOMER-ALTERNATE-FIRST-REALISTIC-NUMBER-DECISION',
          status: observed ? 'ready-after-current' : 'blocked',
          reason: 'Use only if dependencies make conversion unsuitable.'
        },
        {
          caseId: 'PWS-MD-CUSTOMER-CONFIG-PACKAGE-ROUTE',
          status: 'ready-after-current',
          reason: 'Batch route stays useful after first-record policy is settled.'
        },
        {
          caseId: 'O2C-FIRST-CUSTOMER-PROCESS',
          status: 'blocked',
          reason: 'Blocked until customer setup, item/service setup and posting/VAT boundaries are consciously handled.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: observed
        ? 'CUSTOMER-U-CUST-100-CONVERSION-OR-ALTERNATE-NUMBER-DECISION'
        : CASE_ID,
      whySelectedNextCaseIsBest: observed
        ? 'The next step should decide whether the observed dependency context permits a narrow conversion write gate or whether a new customer number is safer.'
        : 'The read-first proof remains incomplete; no write or O2C step should follow.',
      risksBeforeNextCase: [
        'Do not edit or save U-CUST-100 without a fresh write gate.',
        'Do not claim customer setup or O2C readiness from dependency visibility alone.',
        'Do not use confidential real customer data.'
      ],
      requiredPreparation: observed
        ? ['Review screenshots and decide conversion versus alternate-number route.']
        : ['Create a narrower UI route hypothesis and repeat read-first only.']
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/${textFile}`,
      ...captures.flatMap((capture) => [capture.screenshot, capture.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/CUSTOMER-U-CUST-100-DEPENDENCY-READFIRST-result.json`
    ],
    nextCase: observed ? 'CUSTOMER-U-CUST-100-CONVERSION-OR-ALTERNATE-NUMBER-DECISION' : CASE_ID,
    requiresReview: !observed,
    safeToFinalizeState: observed
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'CUSTOMER-U-CUST-100-DEPENDENCY-READFIRST-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# CUSTOMER-U-CUST-100 Dependency Read-first',
      '',
      'Dieser Lauf prueft den vorhandenen Debitor U-CUST-100 rein lesend. Er entscheidet nicht ueber eine Umbenennung und oeffnet keinen Schreib-Gate.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      `Status: ${status}`,
      `Dependency status: ${dependencyStatus}`,
      '',
      '## Nicht enthalten',
      '',
      '- Keine Debitorenanlage.',
      '- Keine Debitorenbearbeitung.',
      '- Keine Vorlagenauswahl.',
      '- Keine Buchungsgruppen-, Zahlungsbedingungs-, USt- oder Dimensionsaenderung.',
      '- Kein Verkaufsbeleg.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine API-Abkuerzung.',
      '- Keine vertraulichen echten Kundendaten.',
      '',
      '## Evidence-Dateien',
      '',
      ...result.evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(status, 'U-CUST-100 dependency read-first proof must capture customer and ledger/dependency context.').toBe(
    'observed-read-first-dependency-context'
  );
});
