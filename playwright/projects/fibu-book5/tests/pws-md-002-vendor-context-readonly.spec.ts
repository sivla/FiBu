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

test('PWS-MD-002 captures vendor list context read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();

  await page.goto(buildTargetUrl(27), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);

  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  const rawText = await fullText(page);
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
  const vendorSignals = [/Kreditor|Vendor|Lieferant/i, /Nr\.|No\.|Name/i].filter((signal) => signal.test(rawText)).length;
  const status = vendorSignals >= 2 ? 'observed' : 'blocked';
  const blockedBy = status === 'observed' ? [] : ['Vendor list/page context was not visible enough for read-first proof.'];
  const textFile = 'pws-md-002-010-vendor-context.txt';
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No compact page text captured.');
  const shot = await screenshotWithMetadata(page, 'pws-md-002-010-vendor-context.png', {
    page: 'Kreditoren / Vendors',
    pageId: 27,
    step: 'Read-only vendor context proof',
    status,
    importantUi: ['Page title', 'company context', 'vendor list/card signals', 'posting/payment/template field signals if visible'],
    visibleSignals: text.split('\n').slice(0, 40),
    internallyProves: status === 'observed' ? 'Vendor context page is visible read-only in playthru / UNIVERSAARL-DE.' : 'Vendor context was not accepted.',
    doesNotProve: [
      'No vendor created',
      'No vendor template changed',
      'No vendor bank/payment setup',
      'No posting group correctness',
      'No VAT correctness',
      'No purchase document readiness'
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
      'Captured compact page text, screenshot and screenshot metadata.',
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
    screenshots: [shot.screenshot],
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
    evidenceRefs: [`${EVIDENCE_DIR_REL}/${textFile}`, shot.screenshot, shot.screenshotMetadata, `${EVIDENCE_DIR_REL}/PWS-MD-002-result.json`],
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
