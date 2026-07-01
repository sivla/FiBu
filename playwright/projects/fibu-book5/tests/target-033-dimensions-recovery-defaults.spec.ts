import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-033-dimensions-recovery-defaults';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-033-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  filter?: string;
  expected: RegExp[];
  include: RegExp[];
  purpose: string;
  proves: string[];
  notProof: string[];
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked';
  url: string;
  screenshot: string;
  textFile: string;
  observedSignals: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'dimensions-list',
    pageId: 536,
    label: 'Dimensionen / Dimensions',
    expected: [/PRODUCTLINE/i, /COSTCENTER/i, /CHANNEL/i],
    include: [/Dimensions|Dimensionen|PRODUCTLINE|COSTCENTER|CHANNEL|Code|Name|Beschreibung/i],
    purpose: 'Read-only reopen proof for the Universaarl starter Dimension codes.',
    proves: ['PRODUCTLINE, COSTCENTER and CHANNEL are visible on the Dimensions page.'],
    notProof: ['No Global Dimension Code assignment.', 'No Default Dimension assignment.', 'No posted dimension effect.']
  },
  {
    id: 'productline-values',
    pageId: 537,
    label: 'Dimensionswerte / Dimension Values PRODUCTLINE',
    filter: "'Dimension Value'.'Dimension Code' IS 'PRODUCTLINE'",
    expected: [/SOFTWARE/i, /SERVICE/i, /TRAINING/i],
    include: [/Dimension Values|Dimensionswerte|PRODUCTLINE|SOFTWARE|SERVICE|TRAINING|Code|Name|Beschreibung/i],
    purpose: 'Read-only reopen proof for PRODUCTLINE values.',
    proves: ['PRODUCTLINE values SOFTWARE, SERVICE and TRAINING are visible.'],
    notProof: ['No Default Dimension assignment.', 'No Dimension Set Entry.']
  },
  {
    id: 'costcenter-values',
    pageId: 537,
    label: 'Dimensionswerte / Dimension Values COSTCENTER',
    filter: "'Dimension Value'.'Dimension Code' IS 'COSTCENTER'",
    expected: [/ADMIN/i, /SALES/i, /OPERATIONS/i],
    include: [/Dimension Values|Dimensionswerte|COSTCENTER|ADMIN|SALES|OPERATIONS|Code|Name|Beschreibung/i],
    purpose: 'Read-only reopen proof for COSTCENTER values.',
    proves: ['COSTCENTER values ADMIN, SALES and OPERATIONS are visible.'],
    notProof: ['No Default Dimension assignment.', 'No Dimension Set Entry.']
  },
  {
    id: 'channel-values',
    pageId: 537,
    label: 'Dimensionswerte / Dimension Values CHANNEL',
    filter: "'Dimension Value'.'Dimension Code' IS 'CHANNEL'",
    expected: [/DIRECT/i, /PARTNER/i],
    include: [/Dimension Values|Dimensionswerte|CHANNEL|DIRECT|PARTNER|Code|Name|Beschreibung/i],
    purpose: 'Read-only reopen proof for CHANNEL values.',
    proves: ['CHANNEL values DIRECT and PARTNER are visible.'],
    notProof: ['No Default Dimension assignment.', 'No Dimension Set Entry.']
  },
  {
    id: 'general-ledger-global-dimensions',
    pageId: 118,
    label: 'Finanzbuchhaltung Einrichtung / General Ledger Setup',
    expected: [/Globaler Dimensionscode|Global Dimension Code|Shortcut Dimension|Dimension/i],
    include: [/General Ledger Setup|Finanzbuchhaltung Einrichtung|Globaler Dimensionscode|Global Dimension Code|Shortcut Dimension|Dimension/i],
    purpose: 'Read-only context for global dimension fields after earlier global-dimension routes were parked.',
    proves: ['General Ledger Setup still exposes global/shortcut dimension context.'],
    notProof: ['PRODUCTLINE is not proven as Global Dimension Code 1.', 'COSTCENTER is not proven as Global Dimension Code 2.']
  }
];

function buildPlaythruUrl(pageId: number, filter?: string) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  if (filter) url.searchParams.set('filter', filter);
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function dangerousTextVisible(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Buchen\?|Delete\?|Loeschen\?|Ship and Invoice/i.test(
    text
  ) && /dialog|modal|yes|ja|ok|confirm|bestaetigen|fortfahren/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    finalScreenshotStatus: 'universaarl-foundation-draft',
    ...metadata
  });
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  const url = buildPlaythruUrl(probe.pageId, probe.filter);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const currentUrl = page.url();
  const contextOk = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const expectedOk = probe.expected.every((pattern) => pattern.test(text));
  const status = contextOk && expectedOk && !dangerousTextVisible(text) ? 'observed' : 'blocked';
  const compact = await compactPageText(page, { include: probe.include, maxLines: 120, maxLineLength: 180 });
  const signals = compact
    .split('\n')
    .map(clean)
    .filter(Boolean)
    .slice(0, 80);
  const screenshot = `target-033-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;

  await writeText(textFile, signals.join('\n') || text.slice(0, 4000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status,
    bookUse: status === 'observed' ? 'foundation-explanation' : 'do-not-use-as-proof',
    importantUi: probe.expected.map((pattern) => pattern.source),
    internallyProves: status === 'observed' ? probe.proves : [],
    doesNotProve: probe.notProof
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot,
    textFile,
    observedSignals: signals.slice(0, 20),
    reason: status === 'observed' ? 'Expected read-only signals visible.' : 'Context, expected signals or dangerous-dialog gate failed.'
  };
}

test('TARGET-033 revalidates Universaarl dimensions and parks defaults until master data', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const results: ProbeResult[] = [];
  for (const [index, probe] of probes.entries()) {
    results.push(await probePage(page, probe, index + 1));
  }

  const blocked = results.filter((result) => result.status !== 'observed');
  const allObserved = blocked.length === 0;
  const decisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary:
      'TARGET-023B proved starter Dimension Values; TARGET-024H parked global dimension assignment and default dimensions until better route or concrete master data exists.',
    isPlannedNextCaseStillSensible: true,
    reason: 'Dimensions are independent from the parked Page 314 General Posting Setup route and can be revalidated read-only before the Foundation checkpoint.',
    lookaheadReviewed: [
      {
        caseId: CASE_ID,
        status: 'ready-next',
        reason: 'Read-only revalidation of starter dimension codes and values is safe and useful.'
      },
      {
        caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
        status: allObserved ? 'ready-next' : 'needs-ui-discovery-first',
        reason: allObserved
          ? 'The dimensions starter set is visible; checkpoint can classify remaining parked setup gaps.'
          : 'Blocked dimension visibility must be resolved before a checkpoint.'
      },
      {
        caseId: 'TARGET-035-MASTER-DATA-FIRST-CUSTOMER-VENDOR-ITEM',
        status: 'needs-setup-first',
        reason: 'Master data remains locked until Foundation checkpoint accepts the remaining parked boundaries.'
      },
      {
        caseId: 'TARGET-036-FIRST-PREVIEW-GATE',
        status: 'blocked',
        reason: 'No Preview Posting before master data and posting/VAT boundaries are deliberately accepted.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: allObserved ? 'TARGET-034-FOUNDATION-READY-CHECKPOINT' : 'TARGET-033B-DIMENSIONS-UI-RECOVERY',
    whySelectedNextCaseIsBest: allObserved
      ? 'The starter dimensions are visible; the next value is a Foundation checkpoint that states exactly what is proven, parked and still blocked.'
      : 'A narrow UI recovery is needed before the Foundation checkpoint.',
    risksBeforeNextCase: [
      'Do not claim Global Dimension Code 1/2 are assigned.',
      'Do not claim Default Dimensions exist for customers, vendors or items.',
      'Do not unlock master data, Preview Posting or Posting without the Foundation checkpoint.'
    ],
    requiredPreparation: allObserved
      ? ['Review Page 314 and VAT parked boundaries before checkpoint.']
      : ['Inspect blocked dimension pages before proceeding.']
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    source: 'playwright-readonly-foundation',
    resultStatus: allObserved ? 'observed-dimensions-starter-visible-defaults-parked' : 'blocked',
    page: 'Dimensions / Dimension Values / General Ledger Setup',
    actionsTaken: [
      'Opened Dimensions page 536 read-only.',
      'Opened Dimension Values page 537 with PRODUCTLINE, COSTCENTER and CHANNEL filters read-only.',
      'Opened General Ledger Setup page 118 read-only for global dimension context.',
      'Captured compact text and screenshot metadata for each page.'
    ],
    actionsNotTaken: [
      'No setup value was changed.',
      'No dimension value was created or edited.',
      'No Global Dimension Code was assigned.',
      'No Default Dimension was assigned.',
      'No master data, document draft, Preview Posting, Posting, Payment, company switch or API shortcut.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    probes: results,
    screenshots: results.map((result) => `playwright/projects/fibu-book5/img/${result.screenshot}`),
    proved: allObserved
      ? [
          'PRODUCTLINE, COSTCENTER and CHANNEL are visible in playthru / UNIVERSAARL-DE.',
          'PRODUCTLINE values SOFTWARE, SERVICE and TRAINING are visible.',
          'COSTCENTER values ADMIN, SALES and OPERATIONS are visible.',
          'CHANNEL values DIRECT and PARTNER are visible.',
          'General Ledger Setup dimension context is reachable read-only.',
          'Default Dimensions are deliberately parked until concrete master data exists.'
        ]
      : ['The run stayed read-only and blocked before changing setup.'],
    notProved: [
      'PRODUCTLINE is not proven as Global Dimension Code 1.',
      'COSTCENTER is not proven as Global Dimension Code 2.',
      'No Default Dimensions for customers, vendors, items or accounts are proven.',
      'No Dimension Set Entries, posted entries, report filters, Preview Posting or Posting are proven.',
      'No full Foundation readiness or posting readiness is proven.'
    ],
    blockedBy: blocked.map((entry) => `${entry.id}: ${entry.reason}`),
    warnings: [
      'This is a read-only revalidation, not a setup write.',
      'Starter dimension values support later master data design, but do not unlock master data by themselves.',
      'Global dimensions and default dimensions remain separate gates.'
    ],
    nextStepDecision: decisionCard,
    nextCase: decisionCard.selectedNextCase,
    safeToFinalizeState: false,
    requiresReview: !allObserved,
    statePatch: {},
    createdAt: new Date().toISOString()
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-033 Dimensions Recovery / Defaults',
      '',
      'Read-only Universaarl W1 Foundation revalidation.',
      '',
      '- No setup write.',
      '- No master data.',
      '- No draft.',
      '- No Preview Posting.',
      '- No Posting.',
      '- No API shortcut.',
      '',
      allObserved
        ? 'Starter dimension codes and values are visible. Global Dimension Code assignment and Default Dimensions remain parked.'
        : 'At least one dimension page did not show the expected signals; see TARGET-033-result.json.'
    ].join('\n'),
    'utf8'
  );

  expect(blocked, blocked.map((entry) => `${entry.id}: ${entry.reason}`).join('\n')).toHaveLength(0);
});
