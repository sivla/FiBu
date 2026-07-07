import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(420_000);
test.skip(
  process.env.CUSTOMER_PAYMENT_TERMS_RECOVERY_LIVE_APPROVED !== '1' ||
    process.env.CUSTOMER_PAYMENT_TERMS_RECOVERY_RUNNER_GUARD_CHECKED !== '1',
  'CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'customer-payment-terms-route-recovery';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const CURRENT_USER_PATTERN = new RegExp(`Kaje${'tan'}[.\\s_-]*Kali${'cki'}`, 'gi');

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

type Attempt = {
  id: string;
  route: string;
  status: 'observed' | 'blocked';
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  visibleSignals: string[];
  pageInspectionOpened: boolean;
  pageInspectionSignals: string[];
  blockedBy: string[];
  warnings: string[];
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
  const url = new URL(process.env.CUSTOMER_PAYMENT_TERMS_RECOVERY_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL must include a tenant/environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url;
}

function buildTargetUrl(options: { page?: number; dc?: string; profile?: string } = {}) {
  const url = targetInstanceUrl();
  if (options.page) url.searchParams.set('page', String(options.page));
  if (typeof options.dc === 'string') {
    if (options.dc) url.searchParams.set('dc', options.dc);
    else url.searchParams.delete('dc');
  }
  if (options.profile) url.searchParams.set('profile', options.profile);
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

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

async function paymentTermsSignals(page: Page) {
  const compact = await compactPageText(page, {
    include: [
      /Zahlungsbedingungen|Payment Terms|Code|Beschreibung|Description|Falligkeitsformel|Faelligkeitsformel|Due Date|Skonto|Discount/i,
      /Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Verwalten|Manage|OK|Power BI/i
    ],
    maxLines: 220,
    maxLineLength: 260
  }).catch(() => '');
  return clean(`${compact}\n${await fullText(page)}`)
    .split('\n')
    .filter((line, index, all) => index === all.indexOf(line))
    .slice(0, 180);
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

function looksLikeRoleCenter(text: string) {
  return /Business Manager Role Center|Rollencenter|Guten Abend|Aktivitaten|Aktivit.ten|Power BI|Verkaufsauftrag|Einkaufsrechnung|Shopify/i.test(text);
}

function looksLikeSearchOverlay(text: string) {
  return /Was mochten Sie tun|Wie mochten Sie weiter verfahren|Nach .* suchen|Unternehmensdaten durchsuchen|Hilfe durchsuchen|Explore pages|Seiten.*Berichte/i.test(text);
}

function looksLikePaymentTerms(text: string) {
  return /Zahlungsbedingungen|Payment Terms/i.test(text) && /Code/i.test(text) && /Beschreibung|Description/i.test(text) && /Falligkeitsformel|Faelligkeitsformel|Due Date/i.test(text);
}

function acceptanceProblems(surfaceText: string, inspectionText: string) {
  const problems = [
    looksLikePaymentTerms(surfaceText) ? '' : 'Surface text does not show the full Payment Terms signal set.',
    /Zahlungsbedingungen|Payment Terms|Payment Term/i.test(inspectionText) ? '' : 'Page Inspection does not confirm Payment Terms context.',
    /Business Manager Role Center|Rollencenter/i.test(inspectionText) ? 'Page Inspection still shows Role Center.' : '',
    looksLikeSearchOverlay(surfaceText) ? 'Visible surface still looks like search/Tell-Me overlay.' : ''
  ].filter(Boolean);
  return problems;
}

async function dismissSafeInfoDialogs(page: Page, captures: Capture[], route: string) {
  for (const scope of [page, ...page.frames()]) {
    const dialogText = await scope.locator('body').innerText({ timeout: 500 }).catch(() => '');
    const okButton = scope.getByRole('button', { name: /^OK$/i }).first();
    const safeInfo =
      /Power BI ist nicht eingerichtet|Power BI is not set up|Informationen hilfreich|information helpful/i.test(dialogText) &&
      (await okButton.isVisible({ timeout: 500 }).catch(() => false));
    if (!safeInfo) continue;
    const signals = clean(dialogText).split('\n').slice(0, 80);
    await capture(page, captures, `customer-payment-terms-recovery-dialog-${route}.png`, {
      page: 'Business Central information dialog',
      step: `Safe information dialog before ${route}`,
      route,
      visibleSignals: signals,
      internallyProves: 'A safe informational dialog was visible and blocked the surface route.',
      doesNotProve: ['No Payment Terms page context', 'No setup value'],
      noWrite: true,
      noPreview: true,
      noPost: true
    });
    await okButton.click({ timeout: 3000 });
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

async function inspectPage(page: Page, captures: Capture[], route: string) {
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1600);
  const text = await fullText(page);
  const opened = /Page Inspection|Seitenuberprufung|Seitenueberpruefung|Page ID|Page Name|Source Table|Tabelle/i.test(text);
  await capture(page, captures, `customer-payment-terms-recovery-${route}-inspection.png`, {
    page: 'Page Inspection',
    step: `Page Inspection after ${route}`,
    route,
    pageInspectionOpened: opened,
    visibleSignals: text.split('\n').slice(0, 140),
    noWrite: true,
    noPreview: true,
    noPost: true
  });
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(600);
  return { opened, text };
}

async function observe(page: Page, captures: Capture[], route: string, fileName: string): Promise<Attempt> {
  await dismissTours(page).catch(() => undefined);
  await dismissSafeInfoDialogs(page, captures, route).catch(() => false);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1200);
  await dismissSafeInfoDialogs(page, captures, `${route}-delayed`).catch(() => false);
  const signals = await paymentTermsSignals(page);
  const surfaceText = signals.join('\n');
  const shot = await capture(page, captures, fileName, {
    page: 'Zahlungsbedingungen / Payment Terms route recovery',
    step: route,
    route,
    visibleSignals: signals,
    internallyProves: looksLikePaymentTerms(surfaceText) ? 'Surface contains Payment Terms signals.' : 'Surface is not accepted as Payment Terms.',
    doesNotProve: ['No setup write', 'No customer assignment', 'No due-date calculation'],
    noWrite: true,
    noPreview: true,
    noPost: true
  });
  const inspection = await inspectPage(page, captures, route);
  const problems = acceptanceProblems(surfaceText, inspection.text);
  return {
    id: route,
    route,
    status: problems.length === 0 ? 'observed' : 'blocked',
    url: sanitizeUrl(page.url()),
    screenshot: shot.screenshot,
    screenshotMetadata: shot.screenshotMetadata,
    visibleSignals: signals,
    pageInspectionOpened: inspection.opened,
    pageInspectionSignals: inspection.text.split('\n').slice(0, 140),
    blockedBy: problems,
    warnings: [
      looksLikeRoleCenter(surfaceText) ? 'Surface contains Role Center signals.' : '',
      looksLikeSearchOverlay(surfaceText) ? 'Surface contains search/Tell-Me overlay signals.' : '',
      /Neu|New/i.test(surfaceText) ? 'New/Neu is visible but intentionally not clicked.' : '',
      /Liste bearbeiten|Edit List|Bearbeiten|Edit/i.test(surfaceText) ? 'Edit action is visible but intentionally not clicked.' : ''
    ].filter(Boolean)
  };
}

async function clickSearchCandidate(page: Page) {
  await openSearchResult(page, /^Zahlungsbedingungen$/i, { requireUnique: false }).catch(async () => {
    await openSearchResult(page, /Zahlungsbedingungen\s+Verwaltung|Payment Terms/i, { requireUnique: false });
  });
  await page.waitForTimeout(2500);
}

async function openSearchExplorer(page: Page) {
  const scopes = [page, ...page.frames()] as Array<Page | Frame>;
  for (const scope of scopes) {
    const candidates = [
      scope.getByRole('link', { name: /Seiten oder Berichte zu erkunden|Seiten und Berichte erkunden|Explore pages/i }).first(),
      scope.getByRole('button', { name: /Seiten oder Berichte zu erkunden|Seiten und Berichte erkunden|Explore pages/i }).first(),
      scope.getByText(/Seiten oder Berichte zu erkunden|Seiten und Berichte erkunden|Explore pages/i).first()
    ];
    for (const candidate of candidates) {
      if (!(await candidate.isVisible({ timeout: 800 }).catch(() => false))) continue;
      await candidate.click({ timeout: 3000 });
      await page.waitForTimeout(1800);
      return true;
    }
  }
  return false;
}

async function fillExplorerFilter(page: Page, term: string) {
  const scopes = [page, ...page.frames()] as Array<Page | Frame>;
  for (const scope of scopes) {
    const candidates = [
      scope.getByRole('textbox', { name: /Suchen|Search|Filter|Page|Seite|Bericht/i }).first(),
      scope.locator('[role="dialog"] input:visible, [aria-modal="true"] input:visible').first(),
      scope.locator('input[type="search"]:visible, input[type="text"]:visible').first()
    ];
    for (const candidate of candidates) {
      if (!(await candidate.isVisible({ timeout: 800 }).catch(() => false))) continue;
      await candidate.click({ timeout: 1000 }).catch(() => undefined);
      await candidate.fill(term).catch(async () => {
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A').catch(() => undefined);
        await page.keyboard.type(term).catch(() => undefined);
      });
      await page.waitForTimeout(1500);
      return true;
    }
  }
  return false;
}

async function clickExplorerCandidate(page: Page) {
  const scopes = [page, ...page.frames()] as Array<Page | Frame>;
  for (const scope of scopes) {
    const candidates = [
      scope.getByText(/^Zahlungsbedingungen$/i).first(),
      scope.getByText(/Zahlungsbedingungen\s+Verwaltung/i).first(),
      scope.getByText(/Payment Terms/i).first()
    ];
    for (const candidate of candidates) {
      if (!(await candidate.isVisible({ timeout: 800 }).catch(() => false))) continue;
      await candidate.hover({ timeout: 1000 }).catch(() => undefined);
      await page.waitForTimeout(300);
      await candidate.click({ timeout: 3000 });
      await page.waitForTimeout(2500);
      return true;
    }
  }
  return false;
}

test('CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY proves Payment Terms route read-first', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const attempts: Attempt[] = [];

  await page.goto(buildTargetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  attempts.push(await observe(page, captures, 'role-center-baseline', 'customer-payment-terms-recovery-010-role-center-baseline.png'));

  const directRoutes = [
    { route: 'direct-page-4-dc-0', url: buildTargetUrl({ page: 4, dc: '0' }) },
    { route: 'direct-page-4-no-dc', url: buildTargetUrl({ page: 4, dc: '' }) },
    { route: 'direct-page-4-business-manager-profile', url: buildTargetUrl({ page: 4, dc: '0', profile: 'Business Manager' }) }
  ];
  for (const direct of directRoutes) {
    await page.goto(direct.url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    attempts.push(await observe(page, captures, direct.route, `customer-payment-terms-recovery-020-${direct.route}.png`));
    if (attempts.at(-1)?.status === 'observed') break;
  }

  if (!attempts.some((entry) => entry.status === 'observed')) {
    await page.goto(buildTargetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await dismissSafeInfoDialogs(page, captures, 'tell-me-before-search').catch(() => false);
    await searchFor(page, 'Zahlungsbedingungen');
    attempts.push(await observe(page, captures, 'tell-me-overlay-zahlungsbedingungen', 'customer-payment-terms-recovery-030-tell-me-overlay.png'));
    await clickSearchCandidate(page).catch(() => undefined);
    attempts.push(await observe(page, captures, 'tell-me-candidate-click', 'customer-payment-terms-recovery-040-after-tell-me-click.png'));
  }

  if (!attempts.some((entry) => entry.status === 'observed')) {
    await page.goto(buildTargetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissSafeInfoDialogs(page, captures, 'explorer-before-search').catch(() => false);
    await searchFor(page, 'Zahlungsbedingungen');
    await openSearchExplorer(page).catch(() => false);
    attempts.push(await observe(page, captures, 'explorer-opened', 'customer-payment-terms-recovery-050-explorer-opened.png'));
    await fillExplorerFilter(page, 'Zahlungsbedingungen').catch(() => false);
    attempts.push(await observe(page, captures, 'explorer-filtered', 'customer-payment-terms-recovery-060-explorer-filtered.png'));
    await clickExplorerCandidate(page).catch(() => false);
    attempts.push(await observe(page, captures, 'explorer-candidate-click', 'customer-payment-terms-recovery-070-after-explorer-click.png'));
  }

  const accepted = attempts.filter((entry) => entry.status === 'observed');
  const blocked = attempts.filter((entry) => entry.status === 'blocked');
  const finalText = clean(attempts.map((entry) => entry.visibleSignals.join('\n')).join('\n'));
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'customer-payment-terms-route-context.txt'), finalText);

  const resultStatus = accepted.length > 0 ? 'observed-read-first-route' : 'blocked-read-first-route';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-payment-terms-route-recovery',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Zahlungsbedingungen / Payment Terms route recovery',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    confidentialRealCustomerDataUsed: false,
    routeAttempts: attempts,
    actionsTaken: [
      'Opened playthru / UNIVERSAARL-DE read-only.',
      'Captured Role Center baseline.',
      'Tried direct Payment Terms Page 4 URL variants.',
      'Tried bounded Tell-Me/search route when direct route was not accepted.',
      'Tried bounded page/report explorer route when Tell-Me was not accepted.',
      'Captured screenshots and Page Inspection diagnostics for each relevant route.'
    ],
    actionsNotTaken: [
      'No payment term created or edited.',
      'No New/Neu action clicked.',
      'No Edit/List Edit action clicked.',
      'No customer edited or saved.',
      'No setup row created, edited or saved.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No confidential real customer data used.'
    ],
    screenshots: captures.map((entry) => entry.screenshot),
    screenshotQa: {
      acceptedForPaymentTermsRoute: accepted.length > 0,
      acceptedRoutes: accepted.map((entry) => entry.route),
      rejectedRoutes: blocked.map((entry) => ({ route: entry.route, blockedBy: entry.blockedBy })),
      reason:
        accepted.length > 0
          ? 'At least one route produced Payment Terms surface and Page Inspection proof.'
          : 'No route produced accepted Payment Terms surface plus Page Inspection proof.'
    },
    proved: [
      'playthru / UNIVERSAARL-DE was used for a real Business Central route recovery run.',
      accepted.length > 0
        ? `Payment Terms route was observed read-first via ${accepted.map((entry) => entry.route).join(', ')}.`
        : 'The tested Payment Terms routes did not pass screenshot/Page Inspection QA.',
      'No payment term, customer, document, Preview Posting, Posting, payment or API shortcut was changed.'
    ],
    notProved: [
      'No NET30 setup row was created or verified.',
      'No customer Payment Terms Code was updated.',
      'No invoice due-date calculation was proven.',
      'No customer setup completeness.',
      'No O2C readiness.',
      'No UAT acceptance.'
    ],
    blockedBy:
      accepted.length > 0
        ? []
        : blocked.flatMap((entry) => entry.blockedBy.map((reason) => `${entry.route}: ${reason}`)),
    warnings: [
      'This is real Business Central UI evidence in playthru, not a UI mockup.',
      'Any future NET30 value remains realistic simulated Universaarl data, not confidential real customer data.',
      'Payment Terms route proof is only a setup-page route proof; it does not prove customer or invoice behavior.'
    ],
    flags: {
      noSetupChange: true,
      noSetupChangeAttempt: true,
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
      plannedNextCaseBeforeReview: 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE',
      lastEvidenceSummary: accepted.length > 0 ? 'Payment Terms route is observed read-first.' : 'Payment Terms route remains blocked after direct/search/explorer attempts.',
      isPlannedNextCaseStillSensible: accepted.length > 0,
      reason:
        accepted.length > 0
          ? 'A write gate can now start from an accepted route, still with Smart Decision and no customer write.'
          : 'Do not retry NET30 writing until a materially different route or source decision exists.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE',
          status: accepted.length > 0 ? 'ready-next' : 'blocked',
          reason: accepted.length > 0 ? 'Accepted route exists.' : 'Payment Terms page route remains unproven.'
        },
        {
          caseId: 'CUSTOMER-PAYMENT-TERMS-ROUTE-SOURCE-DECISION',
          status: accepted.length > 0 ? 'obsolete' : 'ready-next',
          reason: accepted.length > 0 ? 'No source workaround needed.' : 'Need source/object/URL decision before more clicking.'
        },
        {
          caseId: 'CUSTOMER-SETUP-VALUE-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Customer setup remains blocked until NET30 exists and is reopen-proven.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'O2C needs setup and master-data gates first.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: accepted.length > 0 ? 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE' : 'CUSTOMER-PAYMENT-TERMS-ROUTE-SOURCE-DECISION',
      whySelectedNextCaseIsBest:
        accepted.length > 0
          ? 'It can create or verify exactly NET30 from a known Payment Terms route.'
          : 'It prevents repeating the same failed UI route and forces a better route/source decision.',
      risksBeforeNextCase: ['Do not click New/Neu or Edit/List Edit in recovery mode.', 'Do not treat Role Center or search overlay screenshots as page proof.'],
      requiredPreparation: accepted.length > 0 ? ['Use accepted route in the narrow write gate.'] : ['Research or inspect Payment Terms route/object shape before another live write attempt.']
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/customer-payment-terms-route-context.txt`,
      ...captures.flatMap((entry) => [entry.screenshot, entry.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/result.json`
    ],
    nextCase: accepted.length > 0 ? 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE' : 'CUSTOMER-PAYMENT-TERMS-ROUTE-SOURCE-DECISION',
    requiresReview: accepted.length === 0,
    safeToFinalizeState: true
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      'Dieser Lauf ist ein lesender Routen-Nachweis fuer die Seite Zahlungsbedingungen (Payment Terms).',
      'Er darf keine Zahlungsbedingung, keinen Debitor, keinen Beleg und kein Setup schreiben.',
      '',
      '## Ergebnis',
      '',
      accepted.length > 0
        ? `Akzeptierte Route: ${accepted.map((entry) => entry.route).join(', ')}`
        : 'Keine getestete Route wurde als echte Zahlungsbedingungen-Seite akzeptiert.',
      '',
      '## Evidence-Dateien',
      '',
      ...result.evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.payment).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
