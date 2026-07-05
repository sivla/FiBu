import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(300_000);

const CASE_ID = 'TARGET-063-POSTING-GROUPS-SCREENSHOT-QA-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-063-posting-groups-screenshot-qa-recovery';
const EVIDENCE_DIR_REL = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-063-result.json');

type SignalDefinition = {
  id: string;
  pattern: RegExp;
  specific: boolean;
  required?: boolean;
};

type Probe = {
  id: string;
  pageId: number;
  label: string;
  screenshotName: string;
  signals: SignalDefinition[];
  acceptance: (matches: string[]) => boolean;
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'rejected' | 'blocked';
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  signalJson: string;
  visibleTextFile: string;
  matchedSignals: string[];
  missingSignals: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'general-posting-setup',
    pageId: 314,
    label: 'Buchungsmatrix Einrichtung / General Posting Setup',
    screenshotName: 'target-063-010-general-posting-setup-strong-qa.png',
    signals: [
      { id: 'page-caption', pattern: /Buchungsmatrix|General Posting Setup/i, specific: true, required: true },
      { id: 'business-posting-group-header', pattern: /Geschaeftsbuchungsgruppe|Gen\.? Bus\.? Posting Group|Business Posting Group/i, specific: true },
      { id: 'product-posting-group-header', pattern: /Produktbuchungsgruppe|Gen\.? Prod\.? Posting Group|Product Posting Group/i, specific: true },
      { id: 'sales-account-header', pattern: /Warenverkaufskonto|Sales Account/i, specific: true },
      { id: 'purchase-account-header', pattern: /Wareneinkaufskonto|Purch\.? Account|Purchase Account/i, specific: true },
      { id: 'inland-waren-row', pattern: /INLAND[\s\S]{0,1200}WAREN|WAREN[\s\S]{0,1200}INLAND/i, specific: true },
      { id: 'generic-code', pattern: /\bCode\b/i, specific: false },
      { id: 'generic-description', pattern: /Beschreibung|Description/i, specific: false }
    ],
    acceptance: (matches) =>
      matches.includes('page-caption') &&
      (matches.includes('business-posting-group-header') || matches.includes('product-posting-group-header')) &&
      (matches.includes('sales-account-header') || matches.includes('purchase-account-header') || matches.includes('inland-waren-row'))
  },
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    screenshotName: 'target-063-020-vat-business-posting-groups-strong-qa.png',
    signals: [
      { id: 'page-caption', pattern: /MwSt[\s\S]{0,120}Geschaeftsbuchungsgruppen|USt[\s\S]{0,120}Geschaeftsbuchungsgruppen|VAT Business Posting Groups/i, specific: true, required: true },
      { id: 'vat-business-terminology', pattern: /MwSt|USt|VAT Business|VAT Bus\.?/i, specific: true },
      { id: 'posting-group-terminology', pattern: /Buchungsgruppe|Posting Group/i, specific: true },
      { id: 'generic-code', pattern: /\bCode\b/i, specific: false },
      { id: 'generic-description', pattern: /Beschreibung|Description/i, specific: false }
    ],
    acceptance: (matches) =>
      matches.includes('page-caption') &&
      matches.includes('vat-business-terminology') &&
      matches.includes('posting-group-terminology') &&
      (matches.includes('generic-code') || matches.includes('generic-description'))
  },
  {
    id: 'vendor-posting-groups',
    pageId: 111,
    label: 'Kreditorenbuchungsgruppen / Vendor Posting Groups',
    screenshotName: 'target-063-030-vendor-posting-groups-strong-qa.png',
    signals: [
      { id: 'page-caption', pattern: /Kreditorenbuchungsgruppen|Vendor Posting Groups/i, specific: true, required: true },
      { id: 'payables-account-header', pattern: /Verbindlichkeitskonto|Verbindlichkeiten-Konto|Kreditorensammelkonto|Payables Account/i, specific: true },
      { id: 'vendor-terminology', pattern: /Kreditor|Vendor/i, specific: true },
      { id: 'posting-group-terminology', pattern: /Buchungsgruppe|Posting Group/i, specific: true },
      { id: 'generic-code', pattern: /\bCode\b/i, specific: false },
      { id: 'generic-description', pattern: /Beschreibung|Description/i, specific: false }
    ],
    acceptance: (matches) =>
      matches.includes('page-caption') &&
      matches.includes('vendor-terminology') &&
      (matches.includes('payables-account-header') || matches.includes('posting-group-terminology')) &&
      (matches.includes('generic-code') || matches.includes('generic-description'))
  }
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
    .filter((line) => !/allowedEndpoints|allowedResources|trustedOriginAuthorities|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|upn:/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i, '/{tenant}/');
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsDangerousDialog(text: string) {
  return /\b(Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete|Loeschen|Loschen|Apply|Anwenden|Finish|Fertig stellen|Yes|Ja|Post|Buchen|New|Neu|Edit|Bearbeiten)\b/i.test(text);
}

function isRoleCenterText(text: string) {
  return /Guten Tag[\s\S]{0,220}Aktivitaeten|Laufender Verkauf|Laufende Einkaufe|Shopify - Aktivitaten|Role Center|Rollencenter/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(filePath: string, text: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${text.trim()}\n`, 'utf8');
}

async function visibleTextWithFrames(page: Page) {
  const pieces = [await pageText(page).catch(() => '')];
  for (const frame of page.frames()) {
    pieces.push(await frame.locator('body').innerText({ timeout: 700 }).catch(() => ''));
    pieces.push(
      await frame
        .locator('[role], [aria-label], [title], th, td, button, a, h1, h2, h3')
        .evaluateAll((nodes) =>
          nodes
            .slice(0, 900)
            .map((node) => {
              const element = node as HTMLElement;
              return [element.getAttribute('role'), element.getAttribute('aria-label'), element.getAttribute('title'), element.textContent]
                .filter(Boolean)
                .join(' ');
            })
            .join('\n')
        )
        .catch(() => '')
    );
  }
  return clean(pieces.join('\n'));
}

async function visibleDialogText(page: Page) {
  const chunks: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .modal-dialog, .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      chunks.push(clean(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => '')));
    }
  }
  return chunks.filter(Boolean).join('\n');
}

function signalMatches(probe: Probe, text: string) {
  return probe.signals.filter((signal) => signal.pattern.test(text)).map((signal) => signal.id);
}

function missingSignals(probe: Probe, matches: string[]) {
  return probe.signals
    .filter((signal) => signal.required && !matches.includes(signal.id))
    .map((signal) => signal.id);
}

function strongSpecificCount(probe: Probe, matches: string[]) {
  return probe.signals.filter((signal) => signal.specific && matches.includes(signal.id)).length;
}

async function probePage(page: Page, probe: Probe): Promise<ProbeResult> {
  await page.goto(buildPlaythruUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1800);
  await page.keyboard.press('Escape').catch(() => undefined);

  const currentUrl = page.url();
  const text = await visibleTextWithFrames(page);
  const dialogText = await visibleDialogText(page);
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(dialogText);
  const roleCenterInsteadOfTargetPage = isRoleCenterText(text);
  const matches = signalMatches(probe, text);
  const specificSignals = strongSpecificCount(probe, matches);
  const accepted = !roleCenterInsteadOfTargetPage && probe.acceptance(matches) && specificSignals >= 2;
  const status = !safeContext || dangerousDialog ? 'blocked' : accepted ? 'observed' : 'rejected';
  const reason = !safeContext
    ? 'Target instance/company context is not safe.'
    : dangerousDialog
      ? 'A dangerous dialog/action text appeared and the probe stopped.'
      : roleCenterInsteadOfTargetPage
        ? 'Direct page route stayed on the Role Center; navigation words are not accepted as page proof.'
      : accepted
        ? 'At least two page-specific screenshot signals were visible.'
        : 'Required page-specific screenshot signals were not visible enough.';

  const screenshotPath = path.join(EVIDENCE_DIR, probe.screenshotName);
  const signalJsonPath = path.join(EVIDENCE_DIR, probe.screenshotName.replace(/\.png$/i, '.signals.json'));
  const metadataPath = path.join(EVIDENCE_DIR, probe.screenshotName.replace(/\.png$/i, '.screenshot.json'));
  const visibleTextPath = path.join(EVIDENCE_DIR, probe.screenshotName.replace(/\.png$/i, '.visible-text.txt'));

  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await writeText(
    visibleTextPath,
    text
      .split('\n')
      .filter((line) => probe.signals.some((signal) => signal.pattern.test(line)))
      .slice(0, 120)
      .join('\n') || text.slice(0, 6000)
  );
  await writeJson(signalJsonPath, {
    caseId: CASE_ID,
    pageId: probe.pageId,
    label: probe.label,
    status,
    matchedSignals: matches,
    missingSignals: missingSignals(probe, matches),
    specificSignalCount: specificSignals,
    accepted,
    reason,
    roleCenterInsteadOfTargetPage,
    supportingGenericSignals: matches.filter((entry) => entry.startsWith('generic-')),
    genericSignalsAreNotSufficient: true
  });
  await writeJson(metadataPath, {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    pageId: probe.pageId,
    page: probe.label,
    imagePath: `${EVIDENCE_DIR_REL}/${probe.screenshotName}`,
    status,
    bookUse: status === 'observed' ? 'draft-candidate-after-strong-qa' : 'do-not-use-as-page-proof',
    screenshotQa: {
      safeInstance: instancePathIsTarget(currentUrl),
      safeCompany: companyParamIsTarget(currentUrl),
      dangerousDialogVisible: dangerousDialog,
      roleCenterInsteadOfTargetPage,
      matchedSignals: matches,
      missingSignals: missingSignals(probe, matches),
      specificSignalCount: specificSignals,
      genericSignalsAreNotSufficient: true
    },
    proves: status === 'observed' ? [`${probe.label} is visible with page-specific signals read-only.`] : [],
    doesNotProve: [
      'No setup value was changed.',
      'No posting group correctness is proven.',
      'No Preview Posting, Posting, G/L Entry or VAT Entry is proven.',
      'Generic Code/Beschreibung/New text alone is not accepted.',
      'Role Center navigation words are not accepted as target-page proof.'
    ],
    url: sanitizeUrl(currentUrl)
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: `${EVIDENCE_DIR_REL}/${probe.screenshotName}`,
    screenshotMetadata: `${EVIDENCE_DIR_REL}/${path.basename(metadataPath)}`,
    signalJson: `${EVIDENCE_DIR_REL}/${path.basename(signalJsonPath)}`,
    visibleTextFile: `${EVIDENCE_DIR_REL}/${path.basename(visibleTextPath)}`,
    matchedSignals: matches,
    missingSignals: missingSignals(probe, matches),
    reason
  };
}

test('TARGET-063 recovers posting-group screenshot QA read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const pageResults: ProbeResult[] = [];

  for (const probe of probes) {
    pageResults.push(await probePage(page, probe));
  }

  const accepted = pageResults.filter((entry) => entry.status === 'observed');
  const rejected = pageResults.filter((entry) => entry.status !== 'observed');
  const nextCase =
    rejected.length === 0
      ? 'TARGET-064-POSTING-GROUPS-FOUNDATION-BOUNDARY-DECISION-AFTER-STRONG-QA'
      : 'TARGET-064-POSTING-GROUPS-ROUTE-RECOVERY-AFTER-STRONG-QA';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-w1-posting-groups-screenshot-qa-recovery',
    resultStatus: rejected.length === 0 ? 'observed' : accepted.length > 0 ? 'partially-completed' : 'blocked',
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: pageResults.at(-1)?.url ?? '',
    actionsTaken: [
      'Opened direct read-only Business Central page URLs for Page 314, Page 470 and Page 111.',
      'Captured screenshots and page-specific screenshot QA signals.',
      'Filtered platform/config text before accepting page proof.'
    ],
    actionsNotTaken: [
      'No New/Edit/Delete/Copy action clicked.',
      'No setup value written.',
      'No master data, document draft, journal line, Preview Posting, Posting, payment or API shortcut.'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      genericSignalsAreNotSufficient: true
    },
    pages: pageResults,
    screenshots: pageResults.map((entry) => entry.screenshot),
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      `${accepted.length}/3 target setup pages passed stronger page-specific screenshot QA.`,
      'Generic words such as Code, Beschreibung, New/Neu are treated as supporting signals only, not as proof.',
      'No setup value, master data, draft, Preview Posting, Posting, payment or API shortcut occurred.',
      ...accepted.map((entry) => `${entry.label} passed strong read-only screenshot QA.`)
    ],
    notProved: [
      'W1 Foundation is not posting-ready.',
      'No VAT setup, general posting setup, customer posting group or vendor posting group correctness is proven.',
      'No German tax correctness, SKR04 completeness, Preview Posting, Posting, G/L Entry, VAT Entry or ledger trace is proven.',
      ...rejected.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    blockedBy: rejected.map((entry) => `${entry.id}: missing ${entry.missingSignals.join(', ') || 'page-specific signal combination'}`),
    warnings: [
      'This is a read-only screenshot-QA recovery. It does not unlock write gates by itself.',
      'Accepted screenshots can support beginner-facing page explanation, but not posting readiness.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
      lastEvidenceSummary: 'TARGET-061 had weak screenshot acceptance/rejection signals; TARGET-062 required a stronger read-only recovery before any write gate.',
      isPlannedNextCaseStillSensible: false,
      reason: 'A write gate is still premature until the posting-group boundary evidence is classified with stronger page-specific signals.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: 'ready-next',
          reason: rejected.length === 0 ? 'All three recovered pages passed strong QA and need local boundary decision.' : 'Some page routes still need recovery before write gates.'
        },
        {
          caseId: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
          status: 'blocked',
          reason: 'VAT write gate remains blocked until route evidence and source-backed setup values are clear.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'needs-setup-first',
          reason: 'Foundation cannot be ready while setup pages and posting groups are not safely classified.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'blocked',
          reason: 'O2C remains blocked before Foundation readiness and posting group setup.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        rejected.length === 0
          ? 'The next safe step is a local boundary decision, not a write.'
          : 'The next safe step is route recovery for the pages that still lack strong screenshot proof.',
      risksBeforeNextCase: ['Weak screenshot proof could create false setup/book truth.'],
      requiredPreparation: ['Keep all setup/write/posting gates locked until the local boundary decision is complete.']
    },
    statePatch: {
      lastRunSummary: {
        caseId: CASE_ID,
        status: rejected.length === 0 ? 'observed' : accepted.length > 0 ? 'partially-completed' : 'blocked',
        resultPath: `${EVIDENCE_DIR_REL}/TARGET-063-result.json`,
        nextCase
      }
    },
    requiresReview: false,
    safeToFinalizeState: true,
    reason: 'Strong read-only screenshot QA completed without BC writes.',
    nextCase
  };

  await writeJson(RESULT_PATH, result);
  expect(pageResults.every((entry) => entry.status !== 'blocked')).toBe(true);
});
