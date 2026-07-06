import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { dismissTours, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(180_000);
test.skip(
  process.env.PWS_FF_002B_LIVE_APPROVED !== '1' || process.env.PWS_FF_002B_RUNNER_GUARD_CHECKED !== '1',
  'PWS-FF-002B must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'PWS-FF-002B-PAGE314-NAVIGATION-CAPTURE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-ff-002b-page314-navigation-capture-recovery';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/KAJETAN\.KALICKI/gi, '[user]')
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
  const url = new URL(process.env.PWS_FF_002B_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-FF-002B can build a target URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  return url;
}

function targetPageUrl(pageId: number) {
  const url = targetInstanceUrl();
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i,
    '/{tenant}'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

async function compactText(page: Page) {
  return clean(await pageText(page).catch(() => ''));
}

async function searchCandidateTexts(page: Page) {
  const texts = await Promise.all(
    page.frames().map((frame) =>
      frame
        .locator('button:visible, [role="button"]:visible, [role="menuitem"]:visible, [role="row"]:visible, a:visible, span:visible, div:visible')
        .evaluateAll((elements) =>
          elements
            .map((element) => `${element.getAttribute('aria-label') ?? ''} ${element.textContent ?? ''}`.replace(/\s+/g, ' ').trim())
            .filter((text) => text.length > 0)
            .slice(0, 300)
        )
        .catch(() => [])
    )
  );
  return [...new Set(texts.flat())].filter((text) => /Buchungsmatrix|General Posting Setup|Posting Setup|Einrichtung/i.test(text)).slice(0, 80);
}

async function firstVisibleCandidate(page: Page, candidates: Locator[]) {
  for (const candidate of candidates) {
    if (await candidate.isVisible({ timeout: 800 }).catch(() => false)) {
      return candidate;
    }
  }
  return null;
}

async function openExactSearchResult(page: Page) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    const candidate = await firstVisibleCandidate(page, [
      scope
        .locator('[role="dialog"], [aria-modal="true"]')
        .locator('a:visible, button:visible, [role="button"]:visible, [role="menuitem"]:visible, [role="row"]:visible, div:visible')
        .filter({ hasText: /^Buchungsmatrix Einrichtung\s*(Verwaltung)?$/i })
        .first(),
      scope
        .locator('[role="dialog"], [aria-modal="true"]')
        .locator('a:visible, button:visible, [role="button"]:visible, [role="menuitem"]:visible, [role="row"]:visible, div:visible')
        .filter({ hasText: /^General Posting Setup\s*(Administration|Setup)?$/i })
        .first(),
      scope.getByRole('button', { name: /^Buchungsmatrix Einrichtung$/i }).first(),
      scope.getByRole('menuitem', { name: /^Buchungsmatrix Einrichtung$/i }).first(),
      scope.getByRole('row', { name: /^Buchungsmatrix Einrichtung$/i }).first(),
      scope.getByText(/^Buchungsmatrix Einrichtung$/i).first(),
      scope.getByRole('button', { name: /^General Posting Setup$/i }).first(),
      scope.getByRole('menuitem', { name: /^General Posting Setup$/i }).first(),
      scope.getByRole('row', { name: /^General Posting Setup$/i }).first(),
      scope.getByText(/^General Posting Setup$/i).first()
    ]);
      if (candidate) {
        await candidate.click({ timeout: 3000 });
        await page.waitForTimeout(3500);
        return 'exact-search-result';
      }
  }

  const candidatesBeforeKeyboard = await searchCandidateTexts(page);
  if (candidatesBeforeKeyboard.some((text) => /Zu .Seiten und Aufgaben. wechseln.*Buchungsmatrix Einrichtung.*Verwaltung/i.test(text))) {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3500);
    const textAfterArrow = await compactText(page);
    if (page314Accepted(textAfterArrow, page.url()).accepted) {
      return 'tell-me-top-result-arrowdown-enter';
    }

    await page.keyboard.press('Enter');
    await page.waitForTimeout(3500);
    return 'tell-me-top-result-enter';
  }
  return '';
}

function page314Accepted(text: string, url: string) {
  const title = /Buchungsmatrix Einrichtung|General Posting Setup/i.test(text);
  const columns = /Geschaeft|Geschaft|Business Posting|Produkt|Product Posting|Warenverkaufskonto|Wareneinkaufskonto|Sales Account|Purchase Account/i.test(text);
  const notRoleCenter = !/Guten Abend|Aktivitaeten|Laufender Verkauf|Laufende Einkaufe|Shopify - Aktivitaten/i.test(text);
  const urlKeepsPage = /[?&]page=314\b/i.test(url);
  return {
    accepted: title && (columns || urlKeepsPage) && notRoleCenter,
    title,
    columns,
    notRoleCenter,
    urlKeepsPage
  };
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
  return `${EVIDENCE_DIR_REL}/${fileName}`;
}

test('PWS-FF-002B recovers Page 314 navigation before accepting screenshot evidence', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];

  await page.goto(targetPageUrl(314).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1800);
  actionsTaken.push('Opened direct Business Central Page 314 URL in playthru / UNIVERSAARL-DE.');

  let searchCandidates: string[] = [];
  let openRoute = 'direct-page-314-url';
  let text = await compactText(page);
  let acceptance = page314Accepted(text, page.url());

  if (!acceptance.accepted) {
    await searchFor(page, 'Buchungsmatrix Einrichtung');
    actionsTaken.push('Opened Tell Me/Search and searched for Buchungsmatrix Einrichtung.');
    searchCandidates = await searchCandidateTexts(page);
    await writeTextEvidence(
      evidencePath(PROJECT, EVIDENCE_ID, 'pws-ff-002b-010-search-candidates.txt'),
      clean(searchCandidates.length ? searchCandidates.join('\n') : 'No exact Buchungsmatrix Einrichtung search candidates captured.')
    );

    openRoute = (await openExactSearchResult(page)) || 'no-exact-search-result';
    if (openRoute !== 'no-exact-search-result') {
      actionsTaken.push('Used a scoped Buchungsmatrix Einrichtung / General Posting Setup search result route.');
      await dismissTours(page);
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(2500);
    } else {
      blockedBy.push('No exact Buchungsmatrix Einrichtung / General Posting Setup search result was visible.');
    }

    text = await compactText(page);
    acceptance = page314Accepted(text, page.url());
  } else {
    await writeTextEvidence(
      evidencePath(PROJECT, EVIDENCE_ID, 'pws-ff-002b-010-search-candidates.txt'),
      'Search fallback not used because the direct Page 314 URL passed the screenshot/text gate.'
    );
  }
  if (!acceptance.accepted) {
    blockedBy.push('Screenshot/text gate did not prove Buchungsmatrix Einrichtung / Page 314.');
  }

  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'pws-ff-002b-020-page314-context.txt'), text || 'No page text captured.');
  const status = acceptance.accepted ? 'observed' : 'blocked';
  const screenshot = await screenshotWithMetadata(page, 'pws-ff-002b-020-page314-context.png', {
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    pageId: 314,
    step: 'Page 314 navigation/capture gate',
    status,
    openRoute: openRoute || 'no-exact-search-result',
    searchCandidates: searchCandidates.slice(0, 20).map((entry) => clean(entry)),
    acceptance,
    visibleSignals: text.split('\n').slice(0, 80),
    finalScreenshotStatus: status === 'observed' ? 'draft-candidate' : 'rejected',
    internallyProves:
      status === 'observed'
        ? 'Buchungsmatrix Einrichtung / Page 314 was opened read-only before screenshot acceptance.'
        : 'Buchungsmatrix Einrichtung / Page 314 navigation is still not proven.',
    doesNotProve: [
      'No General Posting Setup row correctness.',
      'No account persistence.',
      'No VAT correctness.',
      'No Master Data readiness.',
      'No Preview Posting or Posting.'
    ],
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-page314-navigation-capture-recovery',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken,
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No Edit/List Edit action clicked.',
      'No Suggest Accounts action clicked.',
      'No values typed.',
      'No setup row saved.',
      'No master data created.',
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
    screenshots: [screenshot],
    proved:
      status === 'observed'
        ? ['Buchungsmatrix Einrichtung / Page 314 navigation and screenshot gate passed read-only in playthru / UNIVERSAARL-DE.']
        : ['Business Central shell opened in playthru / UNIVERSAARL-DE read-only.'],
    notProved: [
      'No General Posting Setup correctness.',
      'No INLAND/WAREN row or 4400/5400 account-column proof unless visible in screenshot/text.',
      'No row write or reopen proof.',
      'No VAT correctness.',
      'No Master Data readiness.',
      'No Preview Posting, Posting or ledger trace.'
    ],
    blockedBy,
    warnings: [],
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    signalSummary: {
      ...acceptance,
      searchCandidateCount: searchCandidates.length,
      openRoute: openRoute || 'no-exact-search-result'
    },
    changedFiles: [
      `${EVIDENCE_DIR_REL}/pws-ff-002b-010-search-candidates.txt`,
      `${EVIDENCE_DIR_REL}/pws-ff-002b-020-page314-context.txt`,
      screenshot,
      `${EVIDENCE_DIR_REL}/pws-ff-002b-020-page314-context.screenshot.json`,
      `${EVIDENCE_DIR_REL}/PWS-FF-002B-result.json`
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'PWS-FF-004-VAT-SETUP-BOUNDARY',
      lastEvidenceSummary:
        status === 'observed'
          ? 'Page 314 navigation/capture gate passed; Foundation Decision can now classify whether row/account proof is still needed.'
          : 'Page 314 navigation/capture remains blocked; do not start Master Data.',
      isPlannedNextCaseStillSensible: status === 'observed',
      reason:
        status === 'observed'
          ? 'The immediate screenshot-QA blocker is resolved; next Foundation boundary can be reviewed.'
          : 'The immediate blocker is still navigation/capture, not VAT or Master Data.',
      lookaheadReviewed: [
        {
          caseId: 'PWS-FF-004-VAT-SETUP-BOUNDARY',
          status: status === 'observed' ? 'ready-after-current' : 'blocked',
          reason: 'VAT follows only after Page 314 capture is classified.'
        },
        {
          caseId: 'PWS-FF-005-DIMENSIONS-READFIRST',
          status: 'ready-after-current',
          reason: 'Dimensions are separate Foundation context, still read-first.'
        },
        {
          caseId: 'PWS-MD-001-CUSTOMER-CONTEXT-READFIRST',
          status: 'needs-setup-first',
          reason: 'Master Data remains parked until Foundation gaps are resolved or consciously accepted.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'FOUNDATION-READINESS-DECISION',
      whySelectedNextCaseIsBest:
        status === 'observed'
          ? 'Foundation Decision must consume the accepted navigation gate before moving on.'
          : 'Foundation Decision must consume the blocked navigation gate so the same Page 314 direct URL/search route is not repeated without a new hypothesis.',
      risksBeforeNextCase: blockedBy,
      requiredPreparation: ['Normalize this result and update Foundation Readiness before any Master Data or setup write.']
    },
    nextCase: 'FOUNDATION-READINESS-DECISION'
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-FF-002B-result.json'), result);
});
