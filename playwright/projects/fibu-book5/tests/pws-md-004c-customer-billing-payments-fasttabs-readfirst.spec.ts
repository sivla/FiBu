import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(180_000);
test.skip(
  process.env.PWS_MD_004C_LIVE_APPROVED !== '1' || process.env.PWS_MD_004C_RUNNER_GUARD_CHECKED !== '1',
  'PWS-MD-004C must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'PWS-MD-004C-CUSTOMER-BILLING-PAYMENTS-FASTTABS-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_CUSTOMER = 'U-CUST-100';
const TARGET_CUSTOMER_NAME = 'Universaarl Kunde 100';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-md-004c-customer-billing-payments-fasttabs-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

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
  const url = new URL(process.env.PWS_MD_004C_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-MD-004C can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE)) {
    throw new Error('PWS-MD-004C target URL must resolve to playthru before navigation.');
  }
  if ((url.searchParams.get('company') ?? '').toUpperCase() !== TARGET_COMPANY) {
    throw new Error('PWS-MD-004C target URL must resolve to UNIVERSAARL-DE before navigation.');
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

function buildFilteredCustomerCardUrl() {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', '21');
  url.searchParams.set('filter', `Customer.'No.' IS '@*${TARGET_CUSTOMER}*'`);
  url.searchParams.delete('dc');
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

async function captureReadOnlyCheckpoint(
  page: Page,
  fileName: string,
  metadata: Record<string, unknown>,
  captures: Capture[]
) {
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

function hasBillingSignals(text: string) {
  return [
    /Fakturierung/i,
    /Debitorenbuchungsgruppe|Customer Posting Group/i,
    /Geschaftsbuchungsgruppe|Geschaeftsbuchungsgruppe|Gen\. Business Posting Group|Business Posting Group/i,
    /Buchungsdetails|USt-IdNr|E-Rechnungs-Leitweg-ID|MwSt|VAT/i
  ].filter((signal) => signal.test(text)).length;
}

function hasPaymentSignals(text: string) {
  return [
    /Zahlungen|Payment/i,
    /Zahlungsbeding|Zlg\.-Bedingungscode|Payment Terms/i,
    /Zahlungsform|Payment Method/i,
    /Mahnmethode|Reminder Terms|Lastschrift|SEPA|Finanzbuchhaltung|Prepayment/i
  ].filter((signal) => signal.test(text)).length;
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
    'pws-md-004c-010-customer-list-route-context.png',
    {
      page: 'Debitoren / Customers',
      pageId: 22,
      step: 'Customer list or route context before opening existing U-CUST-100',
      importantUi: ['Debitoren navigation', 'U-CUST-100 row if visible', 'read-only toolbar boundary'],
      visibleSignals: text.split('\n').slice(0, 80),
      internallyProves: 'Initial customer route/list context before opening any card FastTab.',
      doesNotProve: ['No billing FastTab proof', 'No payment FastTab proof', 'No setup correctness'],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );
  return text;
}

async function cardContextVisible(page: Page) {
  const text = await fullText(page);
  return hasCustomerCardContext(text);
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

  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const customerMenu = scope.getByRole('menuitem', { name: /^Debitor$/i }).first();
    if (!(await customerMenu.isVisible({ timeout: 1000 }).catch(() => false))) continue;
    attemptedRoutes.push(`customer-command-menu-scope-${scopeIndex}`);
    await customerMenu.click({ timeout: 5000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    const cardAction = scope.getByRole('menuitem', { name: /Karte|Card|Anzeigen|View/i }).first();
    if (await cardAction.isVisible({ timeout: 1500 }).catch(() => false)) {
      attemptedRoutes.push(`customer-card-action-scope-${scopeIndex}`);
      await cardAction.click({ timeout: 5000 }).catch(() => undefined);
      if (await waitForCardContext(page)) return attemptedRoutes.join(' -> ');
    }
    await page.keyboard.press('Escape').catch(() => undefined);
  }

  return attemptedRoutes.join(' -> ');
}

async function expandFastTab(page: Page, label: 'Fakturierung' | 'Zahlungen') {
  const exactHeading = new RegExp(`^\\s*\\*?\\s*${label}\\s*>?\\s*$`, 'i');
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const candidateGroups: Array<{ name: string; locator: Locator }> = [
      { name: 'exact-heading-button', locator: scope.getByRole('button', { name: exactHeading }) },
      { name: 'exact-heading-text', locator: scope.getByText(exactHeading) }
    ];
    for (const candidateGroup of candidateGroups) {
      const count = Math.min(await candidateGroup.locator.count().catch(() => 0), 20);
      for (let index = 0; index < count; index += 1) {
        const candidate = candidateGroup.locator.nth(index);
        if (!(await candidate.isVisible({ timeout: 1000 }).catch(() => false))) continue;
        const box = await candidate.boundingBox().catch(() => null);
        if (box && (box.x > 1300 || box.y < 500)) {
          continue;
        }
        await candidate.evaluate((element) => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          element.scrollIntoView({ block: 'center', inline: 'nearest' });
        }).catch(() => undefined);
        await page.waitForTimeout(500);
        try {
          await candidate.click({ timeout: 5000 });
        } catch {
          await candidate.evaluate((element) => {
            element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          });
          await page.waitForTimeout(500);
          if (label === 'Zahlungen' && (await hasPaymentSignals(await fullText(page))) < 2) {
            continue;
          }
          if (label === 'Fakturierung' && (await hasBillingSignals(await fullText(page))) < 2) {
            continue;
          }
          return `${candidateGroup.name}-${index}-dom-click-fallback-scope-${scopeIndex}`;
        }
        await page.waitForTimeout(1000);
        return `${candidateGroup.name}-${index}-scope-${scopeIndex}`;
      }
    }
  }
  return '';
}

test('PWS-MD-004C inspects customer billing and payments FastTabs read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const blockedBy: string[] = [];
  const actionsTaken: string[] = [];

  const listText = await openCustomerList(page, captures);
  if (!/U-CUST-100|Universaarl Kunde 100/i.test(listText)) {
    blockedBy.push('U-CUST-100 was not visible in the route/list context before opening the card.');
  }

  const openRoute = await openExistingCustomerCard(page);
  if (openRoute) actionsTaken.push(`Opened or selected existing customer through ${openRoute}.`);
  const cardText = await fullText(page);
  const cardAccepted = hasCustomerCardContext(cardText);
  if (!cardAccepted) blockedBy.push('Customer card context for U-CUST-100 was not strong enough.');

  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004c-020-customer-card-before-fasttabs.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Existing customer card before expanding billing/payment FastTabs',
      openRoute: openRoute || 'no safe open route found',
      importantUi: ['U-CUST-100', 'customer name', 'Fakturierung marker', 'Zahlungen marker'],
      visibleSignals: cardText.split('\n').slice(0, 100),
      internallyProves: cardAccepted
        ? 'Existing customer card context is visible before expanding setup FastTabs.'
        : 'Customer card context is not accepted strongly enough.',
      doesNotProve: ['No setup field completeness', 'No save/reopen proof', 'No O2C readiness'],
      finalScreenshotStatus: cardAccepted ? 'draft-candidate' : 'boundary-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  const billingRoute = await expandFastTab(page, 'Fakturierung');
  if (billingRoute) actionsTaken.push(`Expanded Fakturierung through ${billingRoute}.`);
  const billingText = await fullText(page);
  const billingSignalCount = hasBillingSignals(billingText);
  if (!billingRoute || billingSignalCount < 2) {
    blockedBy.push('Fakturierung FastTab did not expose enough billing/posting/VAT field signals.');
  }

  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004c-030-fakturierung-expanded.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Fakturierung FastTab expanded read-only',
      routeUsed: billingRoute || 'not-expanded',
      importantUi: ['Fakturierung FastTab', 'Customer Posting Group', 'Business Posting Group', 'VAT field context'],
      visibleSignals: billingText.split('\n').slice(0, 130),
      internallyProves:
        billingSignalCount >= 2
          ? 'Billing-related customer setup field context is visible read-only.'
          : 'Billing FastTab was not visible enough for setup-gap classification.',
      doesNotProve: ['No field value correctness', 'No setup change', 'No customer write gate'],
      finalScreenshotStatus: billingSignalCount >= 2 ? 'draft-candidate' : 'boundary-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  const paymentRoute = await expandFastTab(page, 'Zahlungen');
  if (paymentRoute) actionsTaken.push(`Expanded Zahlungen through ${paymentRoute}.`);
  const paymentText = await fullText(page);
  const paymentSignalCount = hasPaymentSignals(paymentText);
  if (!paymentRoute || paymentSignalCount < 2) {
    blockedBy.push('Zahlungen FastTab did not expose enough payment field signals.');
  }

  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004c-040-zahlungen-expanded.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Zahlungen FastTab expanded read-only',
      routeUsed: paymentRoute || 'not-expanded',
      importantUi: ['Zahlungen FastTab', 'Payment Terms', 'Payment Method', 'finance/payment field context'],
      visibleSignals: paymentText.split('\n').slice(0, 140),
      internallyProves:
        paymentSignalCount >= 2
          ? 'Payment-related customer setup field context is visible read-only.'
          : 'Payment FastTab was not visible enough for setup-gap classification.',
      doesNotProve: ['No payment setup correctness', 'No payment process readiness', 'No customer write gate'],
      finalScreenshotStatus: paymentSignalCount >= 2 ? 'draft-candidate' : 'boundary-candidate',
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

  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004c-050-page-inspection-after-fasttabs.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Page Inspection after billing/payment FastTab proof',
      importantUi: ['Page Inspection pane', 'Customer Card page', 'Customer table'],
      visibleSignals: inspectionText.split('\n').slice(0, 120),
      internallyProves: inspectionAccepted
        ? 'Page Inspection remains customer-related after FastTab proof.'
        : 'Page Inspection is not accepted as strong customer context proof.',
      doesNotProve: ['No field value correctness', 'No edit/save proof', 'No posting readiness'],
      finalScreenshotStatus: inspectionAccepted ? 'draft-candidate' : 'boundary-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );
  const endText = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004c-060-no-save-end-context.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'End context after read-only FastTab inspection',
      importantUi: ['No save dialog', 'no draft', 'customer card context'],
      visibleSignals: endText.split('\n').slice(0, 100),
      internallyProves: 'The run ended in customer context after read-only inspection.',
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
        /U-CUST-100|Universaarl Kunde 100|Debitor|Customer|Fakturierung|Zahlungen|Buchungsgruppe|Posting Group|Zahlungsbedingung|Payment Terms|Zahlungsform|Payment Method|MwSt|VAT|Dimension|Saldo|Balance/i
      ],
      maxLines: 220,
      maxLineLength: 260
    }).catch(() => '')
  );
  const textFile = 'pws-md-004c-010-fasttab-context.txt';
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, textFile),
    compact || clean(`${listText}\n${cardText}\n${billingText}\n${paymentText}\n${inspectionText}\n${endText}`)
  );

  const observed = cardAccepted && billingSignalCount >= 2 && paymentSignalCount >= 2 && inspectionAccepted;
  const status = observed ? 'observed-read-first-fasttabs' : 'blocked-read-first-fasttabs';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-master-data-fasttab-proof',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Debitorenkarte / Customer Card',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened the guarded customer context route.',
      ...actionsTaken,
      'Captured customer list/route, card, Fakturierung, Zahlungen, Page Inspection and no-save end screenshots.',
      'Kept the run read-first and no-save.'
    ],
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No customer created.',
      'No customer edited.',
      'No customer saved.',
      'No customer deleted.',
      'No values typed.',
      'No customer template changed.',
      'No customer posting group changed.',
      'No payment terms changed.',
      'No payment method changed.',
      'No VAT setup changed.',
      'No dimensions changed.',
      'No sales document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No API shortcut.'
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
        'customer list or route context',
        'customer card before FastTabs',
        'Fakturierung expanded',
        'Zahlungen expanded',
        'Page Inspection after FastTabs',
        'no-save end context'
      ],
      capturedCheckpoints: captures.map((capture) => capture.screenshot),
      acceptedForHandbookTrainingDraft: observed,
      acceptedForCustomerWriteGate: false,
      acceptedForO2CReady: false,
      reason: observed
        ? 'Multiple visual checkpoints show the existing customer card and billing/payment FastTab contexts without write.'
        : 'One or more required customer FastTab contexts were not strong enough.'
    },
    proved: observed
      ? [
          'Existing customer U-CUST-100 / Universaarl Kunde 100 can be inspected read-only on the customer card.',
          'Fakturierung FastTab context is visible read-only enough for setup-gap classification.',
          'Zahlungen FastTab context is visible read-only enough for setup-gap classification.',
          'Multiple screenshots were captured for list/route, card, billing, payment, Page Inspection and no-save end context.'
        ]
      : [],
    notProved: [
      'No customer setup field value was changed or saved.',
      'No customer setup correctness or completeness.',
      'No customer write gate.',
      'No O2C readiness.',
      'No VAT correctness.',
      'No posting group correctness.',
      'No sales document, Preview Posting, Posting, payment or ledger trace.'
    ],
    blockedBy: observed ? [] : blockedBy,
    warnings: unsafeActionWarnings(clean(`${listText}\n${cardText}\n${billingText}\n${paymentText}\n${endText}`)),
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: observed
        ? 'Customer billing and payment FastTab contexts were observed read-only with multiple screenshots.'
        : 'Customer billing/payment FastTab proof did not reach all required checkpoints.',
      isPlannedNextCaseStillSensible: !observed,
      reason: observed
        ? 'The missing customer setup areas are now visible enough to decide training and next setup route; repeating the same read-first proof is unnecessary.'
        : 'The read-first proof remains incomplete and should not be followed by write or O2C work.',
      lookaheadReviewed: [
        {
          caseId: 'TRAINING-CUSTOMER-CARD-BASICS-DRAFT',
          status: observed ? 'ready-next' : 'needs-ui-discovery-first',
          reason: observed
            ? 'The customer card, billing and payment areas can now be translated into training/handbook material with clear boundaries.'
            : 'Training should wait until the FastTab evidence is accepted.'
        },
        {
          caseId: 'CUSTOMER-SETUP-ROUTE-DECISION',
          status: observed ? 'ready-after-current' : 'blocked',
          reason: 'A setup route decision needs the visible field context from this proof.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'blocked',
          reason: 'O2C remains blocked until customer, item/service, VAT and posting group setup are consciously handled.'
        },
        {
          caseId: 'PWS-MD-VENDOR-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Vendor write work remains behind payment/bank and posting setup boundaries.'
        },
        {
          caseId: 'PWS-MD-ITEM-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Item/service write work remains behind UOM, posting, VAT product, inventory and costing setup.'
        }
      ],
      queueChangesMade: observed
        ? ['Selected TRAINING-CUSTOMER-CARD-BASICS-DRAFT as the next local, no-BC artifact candidate.']
        : ['Kept PWS-MD-004C boundary unresolved; no write or O2C case selected.'],
      selectedNextCase: observed ? 'TRAINING-CUSTOMER-CARD-BASICS-DRAFT' : CASE_ID,
      whySelectedNextCaseIsBest: observed
        ? 'It converts accepted UI evidence into customer-facing training/handbook value without premature setup writes.'
        : 'The same narrow proof remains needed before any setup or process decision.',
      risksBeforeNextCase: [
        'Do not claim customer setup correctness from visible field context.',
        'Do not proceed to O2C before posting/VAT/item/service dependencies are resolved.',
        'Keep screenshots explanatory, not just archived.'
      ],
      requiredPreparation: observed
        ? ['Use PWS-MD-004B and PWS-MD-004C screenshots as draft evidence for customer-card training.']
        : ['Review screenshots and add a better FastTab route hypothesis.']
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/${textFile}`,
      ...captures.flatMap((capture) => [capture.screenshot, capture.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/PWS-MD-004C-result.json`
    ],
    nextCase: observed ? 'TRAINING-CUSTOMER-CARD-BASICS-DRAFT' : CASE_ID,
    requiresReview: !observed,
    safeToFinalizeState: observed
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-MD-004C-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# PWS-MD-004C Customer Billing/Payments FastTabs Read-first',
      '',
      'Dieser Lauf prueft den vorhandenen Debitor U-CUST-100 rein lesend. Er klaert, welche FastTab-Bereiche fuer spaetere Debitoren-, O2C- und Trainingsentscheidungen sichtbar sind.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      `Status: ${status}`,
      '',
      '## Nicht enthalten',
      '',
      '- Keine Debitorenanlage.',
      '- Keine Debitorenbearbeitung.',
      '- Keine Vorlagenauswahl.',
      '- Keine Buchungsgruppen-, Zahlungsbedingungs-, Zahlungsform-, USt- oder Dimensionsaenderung.',
      '- Kein Verkaufsbeleg.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine API-Abkuerzung.',
      '',
      '## Evidence-Dateien',
      '',
      ...result.evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(status, 'Fakturierung and Zahlungen FastTabs must be visible enough for read-first setup-gap proof.').toBe(
    'observed-read-first-fasttabs'
  );
});
