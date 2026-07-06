import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  openSearchResult,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(180_000);
test.skip(
  process.env.PWS_FF_006_LIVE_APPROVED !== '1' || process.env.PWS_FF_006_RUNNER_GUARD_CHECKED !== '1',
  'PWS-FF-006 must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'PWS-FF-006-CHART-OF-ACCOUNTS-STARTER-ACCOUNTS-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-ff-006-chart-of-accounts-starter-accounts-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const PAGE_ID_CHART_OF_ACCOUNTS = 16;

const starterAccounts = [
  { no: '1200', purpose: 'Bank starter account' },
  { no: '1406', purpose: 'Input VAT starter account' },
  { no: '1800', purpose: 'Cash or liquidity starter account' },
  { no: '3300', purpose: 'Vendor liabilities starter account' },
  { no: '3806', purpose: 'Output VAT starter account' },
  { no: '4400', purpose: 'Domestic sales revenue starter account' },
  { no: '5400', purpose: 'Purchasing/material expense starter account' }
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
  const url = new URL(process.env.PWS_FF_006_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-FF-006 can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE)) {
    throw new Error('PWS-FF-006 target URL must resolve to playthru before navigation.');
  }
  if ((url.searchParams.get('company') ?? '').toUpperCase() !== TARGET_COMPANY) {
    throw new Error('PWS-FF-006 target URL must resolve to UNIVERSAARL-DE before navigation.');
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

function actionWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting or preview action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
}

function dangerousDialogText(text: string) {
  return /create|anlegen|edit|bearbeiten|delete|loeschen|post|buchen|preview|vorschau|import|apply|confirm|bestaetigen/i.test(text);
}

function accountFindings(text: string) {
  return starterAccounts.map((account) => ({
    ...account,
    visible: new RegExp(`\\b${account.no}\\b`).test(text)
  }));
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

function chartIdentitySignalCount(text: string) {
  return [
    /Kontenplan|Chart of Accounts/i,
    /\bNr\.|\bNo\.|Kontonr\.|Account No\./i,
    /Kontoart|Account Type|GuV\/Bilanz|Balance Sheet|Income Statement/i
  ].filter(
    (signal) => signal.test(text)
  ).length;
}

async function openChartFromRoleCenterIfNeeded(page: Page) {
  const initialText = await fullText(page);
  const looksLikeRoleCenter =
    /Kontenplan/i.test(initialText) && /Guten|Aktivitaeten|Aktivitäten|Laufender Verkauf|Laufende Eink|Verkaufsangebot|Einkaufsanfrage/i.test(initialText);
  if (!looksLikeRoleCenter) {
    return {
      routeUsed: 'direct-page-url',
      routeNote: 'Direct page URL produced enough chart-context signals before fallback navigation.'
    };
  }

  const menuItem = page.getByRole('menuitem', { name: /^Kontenplan\b/i }).first();
  const link = page.getByRole('link', { name: /^Kontenplan$/ }).first();
  const textFallback = page.getByText(/^Kontenplan$/).first();
  if (await menuItem.isVisible({ timeout: 3000 }).catch(() => false)) {
    await menuItem.click();
  } else if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
    await link.click();
  } else if (await textFallback.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textFallback.click();
  } else {
    return {
      routeUsed: 'direct-page-url-role-center-fallback-blocked',
      routeNote: 'Role Center showed Kontenplan text, but no scoped visible Kontenplan navigation control was clickable.'
    };
  }

  await waitForBusinessCentralShell(page);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await expect.poll(async () => chartIdentitySignalCount(await fullText(page)), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Escape').catch(() => undefined);
  return {
    routeUsed: 'role-center-kontenplan-link',
    routeNote: 'Direct page URL landed on Role Center; clicked the visible Kontenplan navigation link read-only.'
  };
}

async function firstVisibleKontenplanControl(page: Page) {
  const scopes: Array<Page | Frame> = [page, ...page.frames()];
  for (const scope of scopes) {
    const candidates = [
      scope.getByRole('menuitem', { name: /^Kontenplan\b/i }).first(),
      scope.getByRole('link', { name: /^Kontenplan$/i }).first(),
      scope.getByText(/^Kontenplan$/i).first(),
      scope.locator('[role="menuitem"]').filter({ hasText: /^Kontenplan\b/i }).first(),
      scope.locator('a, button, [role="button"], [role="menuitem"], span, div').filter({ hasText: /^Kontenplan$/i }).first()
    ];
    for (const candidate of candidates) {
      const canClick = await candidate
        .click({ timeout: 1000, trial: true })
        .then(() => true)
        .catch(() => false);
      if (canClick) {
        return candidate;
      }
    }
  }
  return null;
}

async function openChartWithFrameAwareFallback(page: Page) {
  const initialText = await fullText(page);
  const initialSignals = chartIdentitySignalCount(initialText);
  if (initialSignals >= 2) {
    return {
      routeUsed: 'direct-page-url',
      routeNote: 'Direct page URL produced enough chart-context signals before fallback navigation.',
      routeReachedChart: true
    };
  }

  const control = /Kontenplan/i.test(initialText) ? await firstVisibleKontenplanControl(page) : null;
  if (!control) {
    const searchReachedChart = await searchFor(page, 'Kontenplan')
      .then(async () => {
        await openSearchResult(page, /^Kontenplan\b/i);
        await waitForBusinessCentralShell(page);
        await page.waitForLoadState('domcontentloaded').catch(() => undefined);
        return expect
          .poll(async () => chartIdentitySignalCount(await fullText(page)), { timeout: 30_000 })
          .toBeGreaterThanOrEqual(2)
          .then(() => true)
          .catch(() => false);
      })
      .catch(() => false);
    return {
      routeUsed: searchReachedChart ? 'tell-me-search-kontenplan' : 'direct-page-url-role-center-fallback-blocked',
      routeNote: searchReachedChart
        ? 'Direct page URL and scoped Role Center control did not open the list; used Tell-Me search for Kontenplan read-only.'
        : 'Direct page URL did not produce enough chart-context signals, no scoped visible Kontenplan navigation control was clickable, and Tell-Me search did not reach the list.',
      routeReachedChart: searchReachedChart
    };
  }

  await control.click();
  await waitForBusinessCentralShell(page);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  const routeReachedChart = await expect
    .poll(async () => chartIdentitySignalCount(await fullText(page)), { timeout: 30_000 })
    .toBeGreaterThanOrEqual(2)
    .then(() => true)
    .catch(() => false);
  await page.keyboard.press('Escape').catch(() => undefined);
  return {
    routeUsed: 'role-center-kontenplan-link',
    routeNote: 'Direct page URL did not produce enough chart-context signals; clicked the visible Kontenplan navigation control read-only.',
    routeReachedChart
  };
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

test('PWS-FF-006 captures starter account visibility read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();

  await page.goto(buildTargetUrl(PAGE_ID_CHART_OF_ACCOUNTS), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  const route = await openChartWithFrameAwareFallback(page);

  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  const currentUrl = page.url();
  const safeInstance = currentUrl.toLowerCase().split(/[/?&=]/).includes(EXPECTED_INSTANCE);
  const safeCompany = (new URL(currentUrl).searchParams.get('company') ?? '').toUpperCase() === TARGET_COMPANY;
  const dialogs = await visibleDialogs(page);
  const dangerousDialogs = dialogs.filter(dangerousDialogText);
  const rawText = await fullText(page);
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV|Bilanz|Balance Sheet|Income Statement|Kontoart|Account Type|Buchung|Posting/i,
        /1200|1406|1800|3300|3806|4400|5400|Vorsteuer|Umsatzsteuer|Umsatzerloese|Wareneingang|Verbindlichkeiten|Bank/i,
        /Neu|New|Liste bearbeiten|Edit list|Bearbeiten|Edit|Loeschen|Delete|Buchen|Post|Buchungsvorschau|Preview Posting/i
      ],
      maxLines: 180,
      maxLineLength: 260
    }).catch(() => '')
  );
  const text = compact || rawText;
  const chartSignals = chartIdentitySignalCount(rawText);
  const findings = accountFindings(text);
  const visibleAccounts = findings.filter((entry) => entry.visible).map((entry) => entry.no);
  const absentOrUnclearAccounts = findings.filter((entry) => !entry.visible).map((entry) => entry.no);
  const blockedBy = [
    safeInstance ? '' : `Expected instance ${EXPECTED_INSTANCE} was not visible in URL.`,
    safeCompany ? '' : `Expected company ${TARGET_COMPANY} was not visible in URL query.`,
    chartSignals >= 2 ? '' : 'Chart of Accounts page identity was not visible enough.',
    ...dangerousDialogs.map((dialog) => `Dangerous dialog visible: ${dialog.slice(0, 180)}`)
  ].filter(Boolean);
  const resultStatus = blockedBy.length > 0 ? 'blocked' : absentOrUnclearAccounts.length > 0 ? 'partially-completed' : 'observed';

  const textFile = 'pws-ff-006-010-chart-of-accounts-starter-accounts.txt';
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No compact page text captured.');
  const shot = await screenshotWithMetadata(page, 'pws-ff-006-010-chart-of-accounts-starter-accounts.png', {
    page: 'Kontenplan / Chart of Accounts',
    pageId: PAGE_ID_CHART_OF_ACCOUNTS,
    step: 'Read-only starter account visibility proof',
    status: resultStatus,
    importantUi: ['Page title', 'company context', 'account number/name/type columns', 'visible starter account rows if present'],
    visibleSignals: text.split('\n').slice(0, 45),
    accountFindings: findings,
    route,
    internallyProves:
      resultStatus === 'blocked'
        ? 'Chart of Accounts context was not accepted.'
        : 'Chart of Accounts context was opened read-only and starter account visibility was classified.',
    doesNotProve: [
      'No complete SKR04 chart of accounts',
      'No German tax or compliance finality',
      'No posting readiness',
      'No master-data readiness',
      'No setup value persistence'
    ],
    screenshotQaRule: 'Accept only if page identity, company context and relevant account rows or their absence classification are clear.',
    finalScreenshotStatus: resultStatus === 'blocked' ? 'rejected' : 'draft-candidate',
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  const evidenceRefs = [
    `${EVIDENCE_DIR_REL}/${textFile}`,
    shot.screenshot,
    shot.screenshotMetadata,
    `${EVIDENCE_DIR_REL}/PWS-FF-006-result.json`,
    `${EVIDENCE_DIR_REL}/README.md`
  ];
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-foundation-chart-of-accounts',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Kontenplan / Chart of Accounts',
    pageId: PAGE_ID_CHART_OF_ACCOUNTS,
    url: sanitizeUrl(currentUrl),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened Chart of Accounts directly in playthru / UNIVERSAARL-DE through the guarded runner.',
      route.routeUsed === 'role-center-kontenplan-link'
        ? 'Direct page URL landed on Role Center, then clicked the visible Kontenplan navigation link read-only.'
        : route.routeUsed === 'tell-me-search-kontenplan'
          ? 'Direct page URL and visible Role Center control did not open the list; used Tell-Me search for Kontenplan read-only.'
        : route.routeUsed === 'direct-page-url'
          ? 'Direct page URL was kept because it produced enough chart context.'
          : 'Direct page URL did not produce enough chart context and the read-only Kontenplan fallback stayed blocked.',
      'Captured compact page text, screenshot and screenshot metadata.',
      'Classified starter account visibility for Foundation Readiness.'
    ],
    route,
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No Edit/Bearbeiten action clicked.',
      'No values typed.',
      'No account created or changed.',
      'No setup changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No API shortcut.',
      'No company switch.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [shot.screenshot],
    accountFindings: findings,
    proved:
      resultStatus === 'blocked'
        ? []
        : [
            'Chart of Accounts page is visible read-only in playthru / UNIVERSAARL-DE.',
            `Visible starter accounts in captured evidence: ${visibleAccounts.length ? visibleAccounts.join(', ') : 'none'}.`
          ],
    notProved: [
      ...absentOrUnclearAccounts.map((accountNo) => `Starter account ${accountNo} was not visible in captured compact evidence.`),
      'No complete SKR04 chart of accounts.',
      'No tax advisor, GoBD, HGB or AO correctness claim.',
      'No VAT setup correctness.',
      'No posting group correctness.',
      'No master-data readiness.',
      'No posting readiness.'
    ],
    blockedBy,
    warnings: actionWarnings(rawText),
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-075 saw Chart of Accounts context but did not visibly prove the starter accounts needed by later setup, training and book examples.',
      isPlannedNextCaseStillSensible: true,
      reason: 'This run is read-only and checks a narrow Foundation gap before Master Data or write cases continue.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-READINESS-DECISION',
          status: resultStatus === 'blocked' ? 'blocked' : 'ready-after-current',
          reason: 'Foundation Readiness should consume the starter-account findings before selecting VAT, Dimensions or Master Data.'
        },
        {
          caseId: 'PWS-FF-004-VAT-SETUP-BOUNDARY',
          status: resultStatus === 'blocked' ? 'needs-setup-first' : 'ready-after-current',
          reason: 'VAT read-first remains later Foundation work; do not retry Page 472 writes from this case.'
        },
        {
          caseId: 'PWS-MD-001-CUSTOMER-CONTEXT-READFIRST',
          status: 'needs-setup-first',
          reason: 'Master Data remains parked until Foundation Readiness accepts or parks the chart/setup gaps.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'FOUNDATION-READINESS-DECISION',
      whySelectedNextCaseIsBest: 'The local decision file must classify whether account visibility is enough for later Foundation work.',
      risksBeforeNextCase: ['Do not treat visible account rows as complete SKR04, tax correctness or posting readiness.'],
      requiredPreparation: ['Normalize this result and update Foundation Readiness plan-only before choosing the next live gap.']
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
      readOnlyDirectPageRoute: route.routeUsed === 'direct-page-url',
      readOnlyTellMeFallback: route.routeUsed === 'tell-me-search-kontenplan'
    },
    evidenceRefs,
    nextCase: 'FOUNDATION-READINESS-DECISION',
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus !== 'blocked'
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-FF-006-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# PWS-FF-006 Chart of Accounts Starter Accounts Read-first',
      '',
      'Dieser Lauf ist ein lesender Foundation-Nachweis fuer den Kontenplan. Er legt keine Sachkonten an und aendert keine Einrichtung.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Nicht enthalten',
      '',
      '- Kein Sachkonto wurde angelegt oder bearbeitet.',
      '- Keine Einrichtung wurde geaendert.',
      '- Keine Stammdaten wurden erzeugt.',
      '- Kein Beleg oder Draft wurde erzeugt.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine API-Abkuerzung.',
      '',
      '## Evidence-Dateien',
      '',
      ...evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(blockedBy, 'PWS-FF-006 must not continue with wrong instance/company, unclear page identity or dangerous dialogs.').toEqual([]);
});
