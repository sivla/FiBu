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
  process.env.PWS_MD_002_LIVE_APPROVED !== '1' || process.env.PWS_MD_002_RUNNER_GUARD_CHECKED !== '1',
  'PWS-MD-002 must be run through the guarded runner with --live-approved after Foundation Readiness Decision.'
);

const CASE_ID = 'PWS-MD-002-VENDOR-CONTEXT-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-md-002-vendor-context-readonly';
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
  const url = new URL(process.env.PWS_MD_002_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-MD-002 can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!new URL(url.toString()).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE)) {
    throw new Error('PWS-MD-002 target URL must resolve to playthru before navigation.');
  }
  if ((url.searchParams.get('company') ?? '').toUpperCase() !== TARGET_COMPANY) {
    throw new Error('PWS-MD-002 target URL must resolve to UNIVERSAARL-DE before navigation.');
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
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text) ? 'Posting/Preview text may be visible but was not clicked.' : '',
    /Bank|IBAN|SWIFT|BIC/i.test(text) ? 'Bank/payment fields may be visible but were not opened or changed.' : ''
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

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

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

async function tryHoverFirst(page: Page, labels: RegExp[]) {
  for (const label of labels) {
    const candidate = page.getByRole('button', { name: label }).first();
    if (await candidate.isVisible({ timeout: 1500 }).catch(() => false)) {
      await candidate.hover({ timeout: 2000 }).catch(() => undefined);
      return label.source;
    }
  }
  return '';
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

function vendorListSignalCount(text: string) {
  return [/Kreditor|Vendor|Lieferant/i, /Nr\.|No\.|Name/i].filter((signal) => signal.test(text)).length;
}

test('PWS-MD-002 captures vendor list context read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();

  await page.goto(buildTargetUrl(27), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  const captures: Capture[] = [];

  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  const rawTextAfterOpen = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-002-010-vendor-list-context.png',
    {
      page: 'Kreditoren / Vendors',
      pageId: 27,
      step: 'Vendor list/page context after open',
      importantUi: ['Page title', 'company context', 'vendor list/card signals', 'visible columns or empty-list state'],
      visibleSignals: rawTextAfterOpen.split('\n').slice(0, 40),
      internallyProves: 'Business Central reached the vendor context surface or produced enough text to diagnose the route.',
      doesNotProve: ['No vendor created', 'No vendor template changed', 'No payment or purchase readiness'],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  let rawTextAfterVendorRoute = rawTextAfterOpen;
  let vendorRouteUsed = '';
  if (vendorListSignalCount(rawTextAfterOpen) < 2) {
    vendorRouteUsed = await clickFirstVisible(page, /^Kreditoren$|^Vendors$|^Lieferanten$/i);
    if (vendorRouteUsed) {
      await waitForBusinessCentralShell(page);
      await dismissTours(page);
      await expect
        .poll(async () => vendorListSignalCount(await fullText(page)), { timeout: 20_000 })
        .toBeGreaterThanOrEqual(2);
      rawTextAfterVendorRoute = await fullText(page);
      await captureReadOnlyCheckpoint(
        page,
        'pws-md-002-015-vendor-link-route-context.png',
        {
          page: 'Kreditoren / Vendors',
          pageId: 27,
          step: 'Role Center Kreditoren link route to vendor list',
          routeUsed: vendorRouteUsed,
          routeLearning:
            'Direct page=27 navigation can land on the Role Center; the visible Kreditoren link is the safer user-like route to the vendor list.',
          importantUi: ['Kreditoren link route', 'vendor list title', 'vendor list columns or empty-list state'],
          visibleSignals: rawTextAfterVendorRoute.split('\n').slice(0, 50),
          internallyProves: 'The run used the visible Role Center Kreditoren navigation route without clicking New, Edit or bank-data actions.',
          doesNotProve: ['No vendor created', 'No vendor template changed', 'No purchase, payment or posting readiness'],
          finalScreenshotStatus: 'draft-candidate',
          noWrite: true,
          noPost: true,
          noPreview: true
        },
        captures
      );
    }
  }

  const hoveredAction = await tryHoverFirst(page, [/Search|Suchen/i, /Filter|Filtern/i, /Open in Excel|In Excel oeffnen/i, /Share|Teilen/i]);
  const rawTextAfterActionHover = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-002-020-vendor-action-or-hover-context.png',
    {
      page: 'Kreditoren / Vendors',
      pageId: 27,
      step: 'Read-only action or hover context',
      hoveredAction: hoveredAction || 'no safe read-only toolbar action hovered',
      importantUi: ['Toolbar/action bar', 'read-only utility actions', 'possible New/Edit/bank/payment action visibility without clicking them'],
      visibleSignals: rawTextAfterActionHover.split('\n').slice(0, 40),
      internallyProves: 'The run inspected vendor-page action context without clicking New, Edit, bank details or templates.',
      doesNotProve: ['No write-capable action was tested', 'No action was accepted as safe for data changes'],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );

  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await expect.poll(async () => (await fullText(page)).length, { timeout: 5000 }).toBeGreaterThan(20);
  const rawTextAfterInspection = await fullText(page);
  await captureReadOnlyCheckpoint(
    page,
    'pws-md-002-030-vendor-page-inspection-context.png',
    {
      page: 'Kreditoren / Vendors',
      pageId: 27,
      step: 'Page Inspection / technical context if available',
      importantUi: ['Page Inspection pane', 'page id/name', 'table/source context if available'],
      visibleSignals: rawTextAfterInspection.split('\n').slice(0, 50),
      internallyProves: 'The run attempted a technical page-context check for reproducibility.',
      doesNotProve: ['No object model completeness', 'No API or AL shortcut'],
      finalScreenshotStatus: 'draft-candidate',
      noWrite: true,
      noPost: true,
      noPreview: true
    },
    captures
  );
  await page.keyboard.press('Escape').catch(() => undefined);

  const rawText = clean(`${rawTextAfterOpen}\n${rawTextAfterVendorRoute}\n${rawTextAfterActionHover}\n${rawTextAfterInspection}`);
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Kreditor|Vendor|Lieferant|Nr\.|No\.|Name|Vorlage|Template|Buchungsgruppe|Posting Group|Zahlungsbedingung|Payment Terms|Zahlungsart|Payment Method|Bank|IBAN|MwSt|VAT|Neu|New|Bearbeiten|Edit/i
      ],
      maxLines: 140,
      maxLineLength: 240
    }).catch(() => '')
  );
  const text = compact || rawText;
  const vendorSignals = vendorListSignalCount(rawText);
  const status = vendorSignals >= 2 ? 'observed' : 'blocked';
  const blockedBy = status === 'observed' ? [] : ['Vendor list/page context was not visible enough for read-first proof.'];
  const textFile = 'pws-md-002-010-vendor-context.txt';
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No compact page text captured.');

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-master-data-context',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Kreditoren / Vendors',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened the vendor context page read-only after guarded runner approval.',
      'Captured checkpoint screenshots for page context, action/hover context and Page Inspection context.',
      'Captured compact page text and screenshot metadata.',
      'Classified visible vendor-context signals for the Master Data handoff.'
    ],
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No values typed.',
      'No vendor saved.',
      'No vendor template changed.',
      'No bank details opened or changed.',
      'No purchase document or draft created.',
      'No payment.',
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
        'vendor list/page context',
        'Role Center Kreditoren link route if direct page navigation resolves to Role Center',
        'safe action or hover context',
        'Page Inspection or technical context'
      ],
      capturedCheckpoints: captures.map((capture) => capture.screenshot),
      accepted: status === 'observed' && captures.length >= 3,
      reason:
        status === 'observed' && captures.length >= 3
          ? 'Mehrere UI-Zustaende wurden dokumentiert; der Lauf stuetzt sich nicht auf einen einzelnen End-Screenshot.'
          : 'Vendor context or screenshot checkpoint coverage was not sufficient.'
    },
    proved: status === 'observed' ? ['Vendor context page is visible read-only in playthru / UNIVERSAARL-DE.'] : [],
    notProved: [
      'No vendor setup readiness.',
      'No vendor posting group correctness.',
      'No VAT correctness.',
      'No bank/payment readiness.',
      'No purchase process readiness.',
      'No vendor creation or reopen proof.'
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
      noPayment: true,
      readOnlyDirectPageRoute: true
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/${textFile}`,
      ...captures.flatMap((capture) => [capture.screenshot, capture.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/PWS-MD-002-result.json`
    ],
    nextCase: 'PWS-MD-003-ITEM-SERVICE-CONTEXT-READFIRST',
    requiresReview: status !== 'observed',
    safeToFinalizeState: false
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-MD-002-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# PWS-MD-002 Vendor Context Read-first',
      '',
      'Dieser Lauf ist ein lesender Master-Data-Kontextnachweis. Er legt keinen Kreditor an und gibt keinen Kreditoren-Write frei.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Nicht enthalten',
      '',
      '- Keine Stammdatenanlage.',
      '- Keine Vorlagenaenderung.',
      '- Keine Bankdaten.',
      '- Kein Einkaufsbeleg.',
      '- Keine Zahlung.',
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

  expect(status, 'Vendor context must be visible enough for PWS-MD-002 read-first proof.').toBe('observed');
});
