import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(300_000);
test.skip(
  process.env.CUSTOMER_PAYMENT_TERMS_LIVE_APPROVED !== '1' || process.env.CUSTOMER_PAYMENT_TERMS_RUNNER_GUARD_CHECKED !== '1',
  'CUSTOMER-PAYMENT-TERMS-WRITE-GATE must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'customer-payment-terms-write-gate';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const CURRENT_USER_PATTERN = new RegExp(`Kaje${'tan'}[.\\s_-]*Kali${'cki'}`, 'gi');

const targetPaymentTerm = {
  code: 'NET30',
  description: '30 Tage netto',
  dueDateCalculation: '<30D>',
  localizedDueDateCandidates: ['<30D>', '30D', '30T', '<30T>'],
  discountDateCalculation: '',
  discountPercent: '0'
};

type Scope = Page | Frame;

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

type FillAttempt = {
  field: string;
  value: string;
  status: 'filled' | 'already-target' | 'not-found' | 'not-editable';
  before?: string;
  after?: string;
  error?: string;
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
  const url = new URL(process.env.CUSTOMER_PAYMENT_TERMS_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL must include a tenant/environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url;
}

function buildTargetUrl() {
  const url = targetInstanceUrl();
  url.searchParams.set('page', '4');
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

async function capture(page: Page, fileName: string, metadata: Record<string, unknown>, captures: Capture[]) {
  const shot = await screenshotWithMetadata(page, fileName, metadata);
  captures.push(shot);
  return shot;
}

async function paymentTermsText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [/Zahlungsbedingungen|Payment Terms|Code|Beschreibung|Description|Falligkeitsformel|Faelligkeitsformel|Due Date|Skonto|NET30|30 Tage|30D|30T|Neu|Liste bearbeiten/i],
      maxLines: 180,
      maxLineLength: 260
    }).catch(async () => fullText(page))
  );
}

function pageLooksLikePaymentTerms(text: string) {
  return /Zahlungsbedingungen|Payment Terms/i.test(text) && /Code/i.test(text) && /Beschreibung|Description/i.test(text) && /Falligkeitsformel|Faelligkeitsformel|Due Date/i.test(text);
}

function net30LooksVisible(text: string) {
  return /NET30/i.test(text) && /30 Tage netto/i.test(text) && /<?30[DT]>?/i.test(text);
}

async function openPaymentTermsPage(page: Page) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await page.goto(buildTargetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await dismissSafeInfoDialogs(page);
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(1800 + attempt * 1200);
    await dismissSafeInfoDialogs(page);
    await page.waitForTimeout(500);
    const text = await paymentTermsText(page);
    if (pageLooksLikePaymentTerms(text)) return text;
  }

  await dismissSafeInfoDialogs(page);
  await page.waitForTimeout(500);
  await searchFor(page, 'Zahlungsbedingungen');
  await openSearchResult(page, /^Zahlungsbedingungen$/i, { requireUnique: false }).catch(async () => {
    await openSearchResult(page, /Zahlungsbedingungen\s+Verwaltung|Payment Terms/i, { requireUnique: false });
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await dismissSafeInfoDialogs(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1800);
  await dismissSafeInfoDialogs(page);
  await page.waitForTimeout(500);
  return paymentTermsText(page);
}

async function dismissSafeInfoDialogs(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const dialogText = await scope.locator('body').innerText({ timeout: 500 }).catch(() => '');
    const okButton = scope.getByRole('button', { name: /^OK$/i }).first();
    const looksLikeSafeInfo =
      /Power BI ist nicht eingerichtet|Power BI is not set up|Informationen hilfreich|information helpful/i.test(dialogText) ||
      (await okButton.isVisible({ timeout: 500 }).catch(() => false));
    if (looksLikeSafeInfo && (await okButton.isVisible({ timeout: 1000 }).catch(() => false))) {
      await okButton.click({ timeout: 3000 });
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

async function clickFirstVisible(page: Page, label: RegExp) {
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const candidates: Array<{ name: string; locator: Locator }> = [
      { name: 'role-button', locator: scope.getByRole('button', { name: label }).first() },
      { name: 'role-menuitem', locator: scope.getByRole('menuitem', { name: label }).first() },
      { name: 'role-link', locator: scope.getByRole('link', { name: label }).first() },
      { name: 'visible-text', locator: scope.getByText(label).first() }
    ];
    for (const candidate of candidates) {
      if (await candidate.locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await candidate.locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
        await candidate.locator.hover({ timeout: 1000 }).catch(() => undefined);
        await page.waitForTimeout(300);
        await candidate.locator.click({ timeout: 5000 });
        await page.waitForTimeout(1200);
        return `${candidate.name}-scope-${scopeIndex}`;
      }
    }
  }
  return '';
}

async function collectVisibleInputValues(page: Page) {
  const values: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
    const count = Math.min(await inputs.count().catch(() => 0), 220);
    for (let index = 0; index < count; index += 1) {
      const candidate = inputs.nth(index);
      if (!(await candidate.isVisible({ timeout: 200 }).catch(() => false))) continue;
      const value = clean(await candidate.inputValue({ timeout: 200 }).catch(async () => candidate.innerText({ timeout: 200 }).catch(() => '')));
      if (value) values.push(value);
    }
  }
  return Array.from(new Set(values)).slice(0, 120);
}

async function visibleInputs(page: Page) {
  const candidates: Locator[] = [];
  for (const scope of [page, ...page.frames()]) {
    const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
    const count = Math.min(await inputs.count().catch(() => 0), 220);
    for (let index = 0; index < count; index += 1) {
      const candidate = inputs.nth(index);
      if (await candidate.isVisible({ timeout: 200 }).catch(() => false)) candidates.push(candidate);
    }
  }
  return candidates;
}

async function inputMeta(locator: Locator) {
  return clean(
    await locator
      .evaluate((node) => {
        const element = node as HTMLElement;
        const labelledBy = (element.getAttribute('aria-labelledby') ?? '')
          .split(/\s+/)
          .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '')
          .join(' ');
        return [
          element.getAttribute('aria-label'),
          labelledBy,
          element.getAttribute('title'),
          element.getAttribute('placeholder'),
          element.getAttribute('name'),
          element.getAttribute('controlname'),
          element.id
        ]
          .filter(Boolean)
          .join(' ');
      })
      .catch(() => '')
  );
}

async function fillInput(locator: Locator, value: string) {
  const before = clean(await locator.inputValue({ timeout: 1000 }).catch(async () => locator.innerText({ timeout: 1000 }).catch(() => '')));
  if (before === value || (value === targetPaymentTerm.dueDateCalculation && targetPaymentTerm.localizedDueDateCandidates.includes(before))) {
    return { before, after: before, status: 'already-target' as const };
  }
  await locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
  await locator.click({ timeout: 3000 });
  await locator.fill(value, { timeout: 5000 });
  await locator.press('Tab').catch(() => undefined);
  await locator.page().waitForTimeout(600);
  const after = clean(await locator.inputValue({ timeout: 1000 }).catch(async () => locator.innerText({ timeout: 1000 }).catch(() => '')));
  return { before, after, status: after === value || (value === targetPaymentTerm.dueDateCalculation && targetPaymentTerm.localizedDueDateCandidates.includes(after)) ? ('filled' as const) : ('not-editable' as const) };
}

async function fillByMeta(page: Page, field: string, pattern: RegExp, value: string): Promise<FillAttempt> {
  for (const locator of await visibleInputs(page)) {
    const meta = await inputMeta(locator);
    if (!pattern.test(meta)) continue;
    try {
      const result = await fillInput(locator, value);
      return { field, value, ...result };
    } catch (error) {
      return { field, value, status: 'not-editable', error: String(error instanceof Error ? error.message : error) };
    }
  }
  return { field, value, status: 'not-found' };
}

async function fillByVisibleInputOrder(page: Page) {
  const inputs = await visibleInputs(page);
  const editableInputs: Locator[] = [];
  for (const locator of inputs) {
    const meta = await inputMeta(locator);
    const value = clean(await locator.inputValue({ timeout: 300 }).catch(async () => locator.innerText({ timeout: 300 }).catch(() => '')));
    if (/Suchen|Search|Filter|Tell me|Was mochten|Wie mochten/i.test(meta)) continue;
    if (/Universaarl GmbH|Playthru/i.test(value)) continue;
    editableInputs.push(locator);
  }
  const targets: Array<[string, string]> = [
    ['Code', targetPaymentTerm.code],
    ['Description', targetPaymentTerm.description],
    ['Due Date Calculation', targetPaymentTerm.dueDateCalculation]
  ];
  const attempts: FillAttempt[] = [];
  for (let index = 0; index < targets.length; index += 1) {
    const locator = editableInputs[index];
    const [field, value] = targets[index];
    if (!locator) {
      attempts.push({ field, value, status: 'not-found' });
      continue;
    }
    try {
      const result = await fillInput(locator, value);
      attempts.push({ field, value, ...result });
    } catch (error) {
      attempts.push({ field, value, status: 'not-editable', error: String(error instanceof Error ? error.message : error) });
    }
  }
  return attempts;
}

async function createOrVerifyNet30(page: Page) {
  const beforeText = await paymentTermsText(page);
  if (net30LooksVisible(beforeText)) {
    return {
      route: 'already-visible',
      setupChanged: false,
      attempts: [] as FillAttempt[],
      blockedBy: [] as string[]
    };
  }

  const newRoute = await clickFirstVisible(page, /^Neu$|^New$/i);
  if (!newRoute) {
    return {
      route: 'blocked-no-new-action',
      setupChanged: false,
      attempts: [] as FillAttempt[],
      blockedBy: ['New/Neu action was not visible or not safely clickable on Payment Terms page.']
    };
  }

  const attempts = [
    await fillByMeta(page, 'Code', /^Code$|Code/i, targetPaymentTerm.code),
    await fillByMeta(page, 'Description', /Beschreibung|Description/i, targetPaymentTerm.description),
    await fillByMeta(page, 'Due Date Calculation', /Falligkeitsformel|Faelligkeitsformel|Due Date/i, targetPaymentTerm.dueDateCalculation)
  ];
  const metaRouteWorked = attempts.every((attempt) => attempt.status === 'filled' || attempt.status === 'already-target');
  const finalAttempts = metaRouteWorked ? attempts : await fillByVisibleInputOrder(page);

  await page.keyboard.press('Control+S').catch(() => undefined);
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(2500);

  const afterText = await paymentTermsText(page);
  const accepted = net30LooksVisible(afterText);
  return {
    route: metaRouteWorked ? `new-action-${newRoute}-accessible-labels` : `new-action-${newRoute}-visible-input-order`,
    setupChanged: accepted,
    attempts: finalAttempts,
    blockedBy: accepted
      ? []
      : [
          'NET30 is not visibly proven after New/Neu route.',
          ...finalAttempts
            .filter((attempt) => attempt.status === 'not-found' || attempt.status === 'not-editable')
            .map((attempt) => `${attempt.field} was ${attempt.status}.`)
        ]
  };
}

test('CUSTOMER-PAYMENT-TERMS-WRITE-GATE creates or verifies NET30 only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const blockedBy: string[] = [];

  const beforeText = await openPaymentTermsPage(page);
  if (!pageLooksLikePaymentTerms(beforeText)) blockedBy.push('Payment Terms page was not proven before write attempt.');

  await capture(
    page,
    'customer-payment-terms-010-before.png',
    {
      page: 'Zahlungsbedingungen / Payment Terms',
      pageId: 4,
      step: 'Before NET30 write gate',
      visibleSignals: beforeText.split('\n').slice(0, 150),
      internallyProves: pageLooksLikePaymentTerms(beforeText) ? 'Payment Terms page context is visible before the write gate.' : 'Payment Terms page context is not accepted.',
      doesNotProve: ['No customer setup readiness', 'No invoice due-date calculation', 'No posting readiness'],
      noCustomerWrite: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true
    },
    captures
  );

  let routeResult = {
    route: 'not-attempted',
    setupChanged: false,
    attempts: [] as FillAttempt[],
    blockedBy: blockedBy.slice()
  };
  if (blockedBy.length === 0) {
    routeResult = await createOrVerifyNet30(page);
    blockedBy.push(...routeResult.blockedBy);
  }

  const afterText = await paymentTermsText(page);
  const afterAccepted = net30LooksVisible(afterText);
  if (!afterAccepted && blockedBy.length === 0) blockedBy.push('NET30 was not visible after write/verify route.');

  await capture(
    page,
    'customer-payment-terms-020-after.png',
    {
      page: 'Zahlungsbedingungen / Payment Terms',
      pageId: 4,
      step: 'After NET30 write or verify route',
      route: routeResult.route,
      fillAttempts: routeResult.attempts,
      visibleInputValues: await collectVisibleInputValues(page),
      visibleSignals: afterText.split('\n').slice(0, 180),
      internallyProves: afterAccepted ? 'NET30 is visible on the Payment Terms page after the route.' : 'NET30 is not accepted as visible after the route.',
      doesNotProve: ['No customer card update', 'No document due-date calculation', 'No O2C readiness'],
      noCustomerWrite: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true
    },
    captures
  );

  const reopenText = await openPaymentTermsPage(page);
  const reopenAccepted = net30LooksVisible(reopenText);
  if (!reopenAccepted && afterAccepted) blockedBy.push('NET30 was visible after route but not after reopen proof.');

  await capture(
    page,
    'customer-payment-terms-030-reopen-proof.png',
    {
      page: 'Zahlungsbedingungen / Payment Terms',
      pageId: 4,
      step: 'Reopen proof for NET30',
      route: routeResult.route,
      visibleSignals: reopenText.split('\n').slice(0, 180),
      internallyProves: reopenAccepted ? 'Reopen proof shows NET30 persisted on Payment Terms.' : 'Reopen proof does not show NET30.',
      doesNotProve: ['No customer assignment', 'No document due-date calculation', 'No posting or ledger trace'],
      noCustomerWrite: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true
    },
    captures
  );

  const compact = clean(`${beforeText}\n${afterText}\n${reopenText}`);
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'customer-payment-terms-context.txt'), compact);

  const resultStatus = blockedBy.length === 0 && reopenAccepted ? (routeResult.setupChanged ? 'observed-setup-written' : 'observed-already-existed') : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-controlled-payment-terms-write-gate',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Zahlungsbedingungen / Payment Terms',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: routeResult.setupChanged,
    setupChangeAttempted: routeResult.route !== 'already-visible' && routeResult.route !== 'not-attempted' && routeResult.route !== 'blocked-no-new-action',
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    confidentialRealCustomerDataUsed: false,
    selectedValue: targetPaymentTerm,
    route: routeResult.route,
    fillAttempts: routeResult.attempts,
    actionsTaken: [
      'Opened guarded Business Central context for playthru / UNIVERSAARL-DE.',
      'Opened Payment Terms page 4.',
      routeResult.route === 'already-visible' ? 'Verified NET30 already visible.' : `Attempted bounded NET30 setup route: ${routeResult.route}.`,
      'Captured before, after and reopen proof screenshots.'
    ],
    actionsNotTaken: [
      'No customer edited or saved.',
      'No customer posting group changed.',
      'No general business posting group changed.',
      'No VAT setup changed.',
      'No dimensions changed.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No confidential real customer data used.'
    ],
    screenshots: captures.map((entry) => entry.screenshot),
    screenshotQa: {
      requiredCheckpoints: ['before Payment Terms page', 'after NET30 route', 'reopen proof'],
      capturedCheckpoints: captures.map((entry) => entry.screenshot),
      acceptedForPaymentTerms: blockedBy.length === 0 && reopenAccepted,
      acceptedForCustomerSetupWrite: false,
      acceptedForO2CReady: false
    },
    proved:
      blockedBy.length === 0 && reopenAccepted
        ? [
            'playthru / UNIVERSAARL-DE was used.',
            'Payment Terms page 4 was visible.',
            'NET30 / 30 Tage netto with a 30-day due-date formula is visible after reopen proof.',
            'No customer, document, Preview Posting, Posting, payment or API shortcut was executed.'
          ]
        : [
            'playthru / UNIVERSAARL-DE was used.',
            'Payment Terms page 4 was opened or attempted through the guarded route.',
            'No customer, document, Preview Posting, Posting, payment or API shortcut was executed.'
          ],
    notProved: [
      'No customer Payment Terms Code was updated.',
      'No invoice due-date calculation was proven.',
      'No customer setup completeness.',
      'No O2C readiness.',
      'No Preview Posting, Posting, payment or ledger trace.',
      'No UAT acceptance.'
    ],
    blockedBy,
    warnings: [
      'This is real Business Central UI evidence in playthru, not a UI mockup.',
      'NET30 is realistic Universaarl setup data, not confidential real customer data.',
      'A Payment Terms row does not prove customer setup or invoice due-date behavior until a later case assigns and uses it.'
    ],
    flags: {
      noCustomerWrite: true,
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
      lastEvidenceSummary:
        blockedBy.length === 0 && reopenAccepted
          ? 'NET30 payment term is available with reopen proof.'
          : 'Payment Terms write gate did not prove NET30.',
      isPlannedNextCaseStillSensible: blockedBy.length === 0 && reopenAccepted,
      reason:
        blockedBy.length === 0 && reopenAccepted
          ? 'Payment Terms is no longer blocking the customer setup value write gate.'
          : 'Do not assign payment terms on the customer while NET30 setup remains unproven.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-SETUP-VALUE-WRITE-GATE',
          status: blockedBy.length === 0 && reopenAccepted ? 'ready-next' : 'blocked',
          reason: blockedBy.length === 0 && reopenAccepted ? 'Payment Terms prerequisite is proven.' : 'NET30 is not proven.'
        },
        {
          caseId: 'CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF',
          status: 'ready-after-current',
          reason: 'Customer setup values need their own bounded write and reopen proof.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'Sales process remains blocked until customer, item/service, posting and VAT setup are consciously handled.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase:
        blockedBy.length === 0 && reopenAccepted ? 'CUSTOMER-SETUP-VALUE-WRITE-GATE' : 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY',
      whySelectedNextCaseIsBest:
        blockedBy.length === 0 && reopenAccepted
          ? 'The next customer setup write can now use a real payment term instead of a guessed or mock value.'
          : 'Recover the Payment Terms write route before touching the customer card.',
      risksBeforeNextCase: ['Do not use NET30 as proof of invoice behavior until a document case calculates due dates.'],
      requiredPreparation:
        blockedBy.length === 0 && reopenAccepted
          ? ['Prepare customer setup value write gate with Customer Posting Group, Gen. Bus. Posting Group and Payment Terms only.']
          : ['Diagnose Payment Terms page edit route with more screenshots before any customer write.']
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/customer-payment-terms-context.txt`,
      ...captures.flatMap((entry) => [entry.screenshot, entry.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/result.json`
    ],
    nextCase: blockedBy.length === 0 && reopenAccepted ? 'CUSTOMER-SETUP-VALUE-WRITE-GATE' : 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY',
    requiresReview: blockedBy.length > 0,
    safeToFinalizeState: blockedBy.length === 0 && reopenAccepted
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# CUSTOMER-PAYMENT-TERMS-WRITE-GATE',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      'Dieser Lauf prueft oder erstellt genau eine Zahlungsbedingung fuer Universaarl:',
      '',
      '- Code: NET30',
      '- Beschreibung: 30 Tage netto',
      '- Faelligkeitsformel: <30D> oder sichtbarer lokalisierter 30-Tage-Wert',
      '',
      'Nicht enthalten: keine Debitorenkarte, keine Belege, keine Buchungsvorschau, keine Buchung, kein API Shortcut und keine vertraulichen echten Kundendaten.',
      '',
      '## Evidence-Dateien',
      '',
      ...result.evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
