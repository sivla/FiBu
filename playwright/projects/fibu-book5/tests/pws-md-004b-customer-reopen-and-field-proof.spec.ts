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
  process.env.PWS_MD_004B_LIVE_APPROVED !== '1' || process.env.PWS_MD_004B_RUNNER_GUARD_CHECKED !== '1',
  'PWS-MD-004B must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'PWS-MD-004B-CUSTOMER-REOPEN-AND-FIELD-PROOF';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_CUSTOMER = 'U-CUST-100';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-md-004b-customer-reopen-and-field-proof';
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
  const url = new URL(process.env.PWS_MD_004B_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-MD-004B can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE)) {
    throw new Error('PWS-MD-004B target URL must resolve to playthru before navigation.');
  }
  if ((url.searchParams.get('company') ?? '').toUpperCase() !== TARGET_COMPANY) {
    throw new Error('PWS-MD-004B target URL must resolve to UNIVERSAARL-DE before navigation.');
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

function customerListSignalCount(text: string) {
  return [/Debitor|Customer|Kunde/i, /Nr\.|No\.|Name/i].filter((signal) => signal.test(text)).length;
}

function customerCardSignalCount(text: string) {
  return [
    /Debitorenkarte|Customer Card|Debitorenkarte/i,
    /U-CUST-100/i,
    /Universaarl Kunde 100/i,
    /Debitorenbuchungsgruppe|Customer Posting Group/i,
    /Zahlungsbeding|Payment Terms/i,
    /MwSt|VAT/i
  ].filter((signal) => signal.test(text)).length;
}

function unsafeActionWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/List Edit may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text) ? 'Posting/Preview text may be visible but was not clicked.' : ''
  ].filter(Boolean);
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

async function openCustomerList(page: Page, captures: Capture[]) {
  await page.goto(buildTargetUrl(22), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  let text = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004b-010-customer-list-before-open.png',
    {
      page: 'Debitoren / Customers',
      pageId: 22,
      step: 'Customer list context before opening existing customer',
      importantUi: ['Customer list', 'U-CUST-100 row if visible', 'FactBox and toolbar boundary'],
      visibleSignals: text.split('\n').slice(0, 70),
      internallyProves: 'Initial customer-list context before opening any card route.',
      doesNotProve: ['No customer card field proof', 'No customer posting group correctness', 'No sales readiness'],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  if (customerListSignalCount(text) < 2 || !new RegExp(TARGET_CUSTOMER, 'i').test(text)) {
    const customerRouteUsed = await clickFirstVisible(page, /^Debitoren$|^Customers$|^Kunden$/i);
    if (customerRouteUsed) {
      await waitForBusinessCentralShell(page);
      await dismissTours(page);
      await expect.poll(async () => customerListSignalCount(await fullText(page)), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
      text = await fullText(page);
      await captureReadOnlyCheckpoint(
        page,
        'pws-md-004b-015-customer-list-route.png',
        {
          page: 'Debitoren / Customers',
          pageId: 22,
          step: 'Customer list reached through visible navigation route',
          routeUsed: customerRouteUsed,
          importantUi: ['Debitoren navigation', 'U-CUST-100 row if visible'],
          visibleSignals: text.split('\n').slice(0, 70),
          internallyProves: 'Customer list was reached through visible Business Central navigation.',
          doesNotProve: ['No customer card field proof', 'No setup correctness'],
          finalScreenshotStatus: 'draft-candidate',
          noWrite: true,
          noPost: true,
          noPreview: true
        },
        captures
      );
    }
  }
  return text;
}

async function openExistingCustomerCard(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const candidates: Array<{ name: string; locator: Locator }> = [
      { name: 'customer-number-link', locator: scope.getByRole('link', { name: new RegExp(TARGET_CUSTOMER, 'i') }).first() },
      { name: 'customer-number-text', locator: scope.getByText(new RegExp(TARGET_CUSTOMER, 'i')).first() },
      { name: 'customer-name-text', locator: scope.getByText(/Universaarl Kunde 100/i).first() }
    ];
    for (const candidate of candidates) {
      if (await candidate.locator.isVisible({ timeout: 1500 }).catch(() => false)) {
        await candidate.locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
        await candidate.locator.click({ timeout: 5000 });
        await waitForBusinessCentralShell(page);
        await dismissTours(page);
        await page.waitForTimeout(1000);
        return candidate.name;
      }
    }
  }
  return '';
}

test('PWS-MD-004B reopens existing U-CUST-100 and proves fields without saving', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];

  const listText = await openCustomerList(page, captures);
  const customerVisibleBeforeOpen = /U-CUST-100|Universaarl Kunde 100/i.test(listText);
  if (!customerVisibleBeforeOpen) blockedBy.push('U-CUST-100 was not visible in the customer list before card-open attempt.');

  const openRoute = await openExistingCustomerCard(page);
  if (openRoute) actionsTaken.push(`Opened or selected existing customer through ${openRoute}.`);
  const textAfterOpen = await fullText(page);
  const cardSignalsAfterOpen = customerCardSignalCount(textAfterOpen);
  const cardOpened = cardSignalsAfterOpen >= 3 && /U-CUST-100|Universaarl Kunde 100/i.test(textAfterOpen);
  if (!cardOpened) blockedBy.push('Existing customer card or field context was not visible enough after open/select route.');

  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004b-020-customer-card-or-selection-context.png',
    {
      page: 'Debitor / Customer',
      pageId: '22-or-card-route',
      step: 'Existing customer card or selected-row context after safe open route',
      openRoute: openRoute || 'no safe open route found',
      importantUi: ['U-CUST-100', 'customer name', 'card/list context', 'FastTabs or selected-row FactBox'],
      visibleSignals: textAfterOpen.split('\n').slice(0, 90),
      internallyProves: cardOpened
        ? 'Existing customer U-CUST-100 context is visible after a no-save open/select route.'
        : 'The run selected or attempted to open U-CUST-100, but card-level context was not strong enough.',
      doesNotProve: ['No field was edited', 'No card was saved', 'No sales document readiness', 'No posting readiness'],
      finalScreenshotStatus: cardOpened ? 'draft-candidate' : 'boundary-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1000);
  const inspectionText = await fullText(page);
  const inspectionCustomerAccepted =
    /Customer \(18\)|Customer Card|Customer List|Debitor|Debitoren/i.test(inspectionText) &&
    !/Business Manager Role Center/i.test(inspectionText);
  if (!inspectionCustomerAccepted) blockedBy.push('Page Inspection did not provide accepted Customer table/card proof.');

  await captureReadOnlyCheckpoint(
    page,
    'pws-md-004b-030-page-inspection-boundary.png',
    {
      page: 'Debitor / Customer',
      pageId: 'Customer table/card inspection if available',
      step: 'Page Inspection boundary after customer reopen/select route',
      importantUi: ['Page Inspection pane', 'page/table identity if available'],
      visibleSignals: inspectionText.split('\n').slice(0, 90),
      internallyProves: inspectionCustomerAccepted
        ? 'Page Inspection produced customer-related page/table context.'
        : 'Page Inspection opened, but it is not accepted as strong customer table/card proof.',
      doesNotProve: ['No API or AL shortcut', 'No required-field enforcement', 'No edit/save proof'],
      finalScreenshotStatus: inspectionCustomerAccepted ? 'draft-candidate' : 'boundary-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );
  await page.keyboard.press('Escape').catch(() => undefined);

  const compact = clean(
    await compactPageText(page, {
      include: [
        /U-CUST-100|Universaarl Kunde 100|Debitor|Customer|Nr\.|No\.|Name|Buchungsgruppe|Posting Group|Zahlungsbedingung|Payment Terms|MwSt|VAT|Adresse|Address|Kontakt|Contact|Saldo|Balance/i
      ],
      maxLines: 180,
      maxLineLength: 240
    }).catch(() => '')
  );
  const rawText = clean(`${listText}\n${textAfterOpen}\n${inspectionText}`);
  const textFile = 'pws-md-004b-010-customer-reopen-context.txt';
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), compact || rawText || 'No compact page text captured.');

  const status = customerVisibleBeforeOpen && cardOpened ? 'observed-existing-customer-boundary' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-master-data-reopen-proof',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Debitor / Customer',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened the customer context page through the guarded runner.',
      ...actionsTaken,
      'Captured list, existing-customer open/select context and Page Inspection boundary screenshots.',
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
        'customer list with U-CUST-100',
        'safe open/card or selected-row context',
        'FactBox or FastTab/field context',
        'Page Inspection boundary'
      ],
      capturedCheckpoints: captures.map((capture) => capture.screenshot),
      acceptedForExistingCustomerHandbookDraft: status === 'observed-existing-customer-boundary',
      acceptedForCustomerWriteGate: false,
      pageInspectionCustomerAccepted: inspectionCustomerAccepted,
      reason:
        status === 'observed-existing-customer-boundary'
          ? 'Existing U-CUST-100 was observed and opened/selected without save. This supports handbook/training draft, not write or sales readiness.'
          : 'Existing customer field/card context was not strong enough for accepted proof.'
    },
    proved:
      status === 'observed-existing-customer-boundary'
        ? [
            'Existing customer U-CUST-100 / Universaarl Kunde 100 is visible in playthru / UNIVERSAARL-DE.',
            'The existing customer can be opened or selected without creating a duplicate customer.',
            'No-save screenshot QA gives usable customer master-data context for handbook/training draft.'
          ]
        : [],
    notProved: [
      'No customer creation route.',
      'No customer write gate approval.',
      'No customer template correctness.',
      'No customer posting group correctness beyond visible UI context.',
      'No VAT correctness.',
      'No sales process readiness.',
      'No posted entries, Preview Posting or ledger trace.',
      inspectionCustomerAccepted
        ? 'Page Inspection was customer-related, but no field enforcement or save/reopen cycle was tested.'
        : 'Page Inspection was not accepted as strong Customer table/card proof.'
    ],
    blockedBy: status === 'observed-existing-customer-boundary' ? [] : blockedBy,
    warnings: unsafeActionWarnings(rawText),
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
      plannedNextCaseBeforeReview: 'PWS-MD-004B-CUSTOMER-REOPEN-AND-FIELD-PROOF',
      lastEvidenceSummary:
        status === 'observed-existing-customer-boundary'
          ? 'Existing U-CUST-100 customer context was observed without write, duplicate creation or document creation.'
          : 'Existing U-CUST-100 could not be proven strongly enough from the safe route.',
      isPlannedNextCaseStillSensible: status !== 'observed-existing-customer-boundary',
      reason:
        status === 'observed-existing-customer-boundary'
          ? 'The customer proof is enough for handbook/training draft; next work should decide whether customer setup gaps block O2C or whether vendor/customer route decisions should continue.'
          : 'Repeat only with a better safe route hypothesis; do not create or edit a customer.',
      lookaheadReviewed: [
        {
          caseId: 'PWS-MD-CUSTOMER-SETUP-GAP-DECISION',
          status: status === 'observed-existing-customer-boundary' ? 'ready-next' : 'blocked',
          reason: 'Use existing customer evidence to decide visible setup gaps before any O2C or write claim.'
        },
        {
          caseId: 'PWS-MD-VENDOR-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Vendor remains parked behind payment/bank boundaries and customer setup decision.'
        },
        {
          caseId: 'PWS-MD-ITEM-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Item remains parked behind UOM, posting, VAT product, inventory and costing checks.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'O2C is premature until customer setup, item/service setup and posting/VAT boundaries are consciously handled.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase:
        status === 'observed-existing-customer-boundary'
          ? 'PWS-MD-CUSTOMER-SETUP-GAP-DECISION'
          : 'PWS-MD-004B-CUSTOMER-REOPEN-AND-FIELD-PROOF',
      whySelectedNextCaseIsBest:
        status === 'observed-existing-customer-boundary'
          ? 'After proving existing customer context, the next useful progress is a setup-gap decision, not another customer surface screenshot.'
          : 'The same proof remains needed, but only with a safer route hypothesis.',
      risksBeforeNextCase: [
        'Do not edit or save U-CUST-100.',
        'Do not claim sales readiness from customer visibility alone.',
        'Do not proceed to O2C before setup gaps are decided.'
      ],
      requiredPreparation: ['Review PWS-MD-004B screenshots and visible field/FastTab signals.']
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/${textFile}`,
      ...captures.flatMap((capture) => [capture.screenshot, capture.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/PWS-MD-004B-result.json`
    ],
    nextCase:
      status === 'observed-existing-customer-boundary'
        ? 'PWS-MD-CUSTOMER-SETUP-GAP-DECISION'
        : 'PWS-MD-004B-CUSTOMER-REOPEN-AND-FIELD-PROOF',
    requiresReview: status !== 'observed-existing-customer-boundary',
    safeToFinalizeState: false
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-MD-004B-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# PWS-MD-004B Customer Reopen and Field Proof',
      '',
      'Dieser Lauf ist ein lesender Nachweis fuer den vorhandenen Debitor U-CUST-100. Er legt keinen Debitor an und gibt keinen Verkaufsprozess frei.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Nicht enthalten',
      '',
      '- Keine Debitorenanlage.',
      '- Keine Debitorenbearbeitung.',
      '- Keine Vorlagenauswahl.',
      '- Keine Buchungsgruppen- oder Zahlungsbedingungsaenderung.',
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

  expect(status, 'Existing customer U-CUST-100 must be visible enough for no-save reopen proof.').toBe(
    'observed-existing-customer-boundary'
  );
});
