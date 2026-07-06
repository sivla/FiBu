import { expect, test, type Page } from '@playwright/test';
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
  process.env.PWS_FF_002_LIVE_APPROVED !== '1' || process.env.PWS_FF_002_RUNNER_GUARD_CHECKED !== '1',
  'PWS-FF-002 must be run through the guarded runner with --live-approved after Foundation Readiness Decision.'
);

const CASE_ID = 'PWS-FF-002-GENERAL-POSTING-SETUP-READFIRST-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-ff-002-general-posting-setup-readfirst-recovery';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

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
  const url = new URL(process.env.PWS_FF_002_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-FF-002 can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!new URL(url.toString()).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE)) {
    throw new Error('PWS-FF-002 target URL must resolve to playthru before navigation.');
  }
  if ((url.searchParams.get('company') ?? '').toUpperCase() !== TARGET_COMPANY) {
    throw new Error('PWS-FF-002 target URL must resolve to UNIVERSAARL-DE before navigation.');
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

function unsafeActionWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/List Edit may be visible but was not clicked.' : '',
    /Konten vorschlagen|Suggest Accounts/i.test(text) ? 'Suggest Accounts may be visible but was not clicked.' : '',
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

test('PWS-FF-002 captures General Posting Setup context read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();

  await page.goto(buildTargetUrl(314), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);

  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  const rawText = await fullText(page);
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Buchungsmatrix|General Posting Setup|Geschaeft|Geschaft|Produkt|Business Posting|Product Posting|Warenverkaufskonto|Wareneinkaufskonto|Sales Account|Purchase Account|INLAND|WAREN|4400|5400|Neu|New|Liste bearbeiten|Edit list|Konten vorschlagen/i
      ],
      maxLines: 180,
      maxLineLength: 260
    }).catch(() => '')
  );
  const text = compact || rawText;
  const visibleSignals = text.split('\n').slice(0, 80);
  const requiredSignals = [
    /Buchungsmatrix|General Posting Setup/i,
    /Geschaeft|Geschaft|Business Posting|Produkt|Product Posting/i,
    /Warenverkaufskonto|Sales Account/i,
    /Wareneinkaufskonto|Purchase Account/i
  ];
  const signalCount = requiredSignals.filter((signal) => signal.test(text)).length;
  const rowSignals = [/INLAND/i, /WAREN/i].filter((signal) => signal.test(text)).length;
  const accountSignals = [/4400/i, /5400/i].filter((signal) => signal.test(text)).length;
  const status = signalCount >= 3 && rowSignals >= 1 ? 'observed' : 'blocked';
  const blockedBy =
    status === 'observed'
      ? []
      : [
          'General Posting Setup page 314 was not visible enough for accepted read-first recovery proof.',
          `signalCount=${signalCount}, rowSignals=${rowSignals}, accountSignals=${accountSignals}`
        ];
  const textFile = 'pws-ff-002-010-general-posting-setup-context.txt';
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No compact page text captured.');
  const shot = await screenshotWithMetadata(page, 'pws-ff-002-010-general-posting-setup-context.png', {
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    pageId: 314,
    step: 'Read-only General Posting Setup recovery proof',
    status,
    importantUi: [
      'Page title',
      'company context',
      'business/product posting group columns',
      'sales and purchase account columns',
      'INLAND/WAREN row if visible'
    ],
    visibleSignals,
    internallyProves:
      status === 'observed'
        ? 'General Posting Setup context is visible read-only in playthru / UNIVERSAARL-DE.'
        : 'General Posting Setup context was not accepted.',
    doesNotProve: [
      'No General Posting Setup row was changed.',
      'No 5400 persistence proof unless visible in the captured page text.',
      'No posting readiness.',
      'No VAT correctness.',
      'No Master Data readiness.'
    ],
    finalScreenshotStatus: status === 'observed' ? 'draft-candidate' : 'rejected',
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-foundation-gap-recovery',
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
    actionsTaken: [
      'Opened General Posting Setup page 314 read-only after guarded runner approval.',
      'Captured compact page text, screenshot and screenshot metadata.',
      'Classified visible posting setup signals for Foundation Readiness.'
    ],
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
    screenshots: [shot.screenshot],
    proved:
      status === 'observed'
        ? ['General Posting Setup context is visible read-only in playthru / UNIVERSAARL-DE.']
        : [],
    notProved: [
      'No General Posting Setup correctness.',
      'No row write or reopen proof.',
      'No VAT correctness.',
      'No Master Data readiness.',
      'No Preview Posting, Posting or ledger trace.'
    ],
    blockedBy,
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
      noBookChange: true
    },
    signalSummary: {
      signalCount,
      rowSignals,
      accountSignals,
      inlandVisible: /INLAND/i.test(text),
      warenVisible: /WAREN/i.test(text),
      salesAccount4400Visible: /4400/i.test(text),
      purchaseAccount5400Visible: /5400/i.test(text)
    },
    changedFiles: [
      `${EVIDENCE_DIR_REL}/${textFile}`,
      shot.screenshot,
      shot.screenshotMetadata,
      `${EVIDENCE_DIR_REL}/PWS-FF-002-result.json`
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'FOUNDATION-READINESS-DECISION',
      lastEvidenceSummary:
        status === 'observed'
          ? 'General Posting Setup was observed read-only for Foundation recovery.'
          : 'General Posting Setup remains blocked or weak after read-first recovery attempt.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Foundation Readiness must consume this page-specific recovery proof before Master Data or write gates.',
      lookaheadReviewed: [
        {
          caseId: 'PWS-FF-004-VAT-SETUP-BOUNDARY',
          status: 'ready-after-current',
          reason: 'VAT read-first proof follows after posting setup gap is classified.'
        },
        {
          caseId: 'PWS-FF-005-DIMENSIONS-READFIRST',
          status: 'ready-after-current',
          reason: 'Dimensions remain Foundation context, but are not the immediate TARGET-075 rejected page.'
        },
        {
          caseId: 'PWS-MD-001-CUSTOMER-CONTEXT-READFIRST',
          status: 'needs-setup-first',
          reason: 'Master Data remains parked until Foundation gaps are resolved or explicitly accepted.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'FOUNDATION-READINESS-DECISION',
      whySelectedNextCaseIsBest: 'The Foundation Decision is the control point that decides whether this read-first proof is enough or another gap remains.',
      risksBeforeNextCase: ['Page 314 may still expose write actions that were only observed, not used.'],
      requiredPreparation: ['Normalize this result and refresh FOUNDATION-READINESS-DECISION.md after review.']
    },
    nextCase: 'FOUNDATION-READINESS-DECISION'
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-FF-002-result.json'), result);
});
