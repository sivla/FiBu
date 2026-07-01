import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-028-POSTING-GROUPS-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-028-posting-groups-preflight';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-028-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  title: RegExp;
  expectedText: RegExp;
  include: RegExp;
  purpose: string;
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked' | 'rejected';
  url: string;
  screenshot: string;
  textFile: string;
  textSignals: string[];
  visibleWarnings: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'general-posting-setup',
    pageId: 314,
    label: 'Buchungsmatrix / General Posting Setup',
    title: /General Posting Setup|Buchungsmatrix/i,
    expectedText: /Gen\. Bus\. Posting Group|Geschaeftsbuchungsgruppe|Geschäftsbuchungsgruppe|Sales Account|Purchase Account|Warenverkaufskonto|Wareneinkaufskonto/i,
    include: /General Posting Setup|Buchungsmatrix|Gen\.|Posting Group|Buchungsgruppe|Sales Account|Purchase Account|Verkauf|Einkauf|Code|Account|Konto/i,
    purpose: 'General Posting Setup controls which G/L accounts are used for business/product posting group combinations.'
  },
  {
    id: 'customer-posting-groups',
    pageId: 110,
    label: 'Debitorenbuchungsgruppen / Customer Posting Groups',
    title: /Customer Posting Groups|Debitorenbuchungsgruppen/i,
    expectedText: /Receivables Account|Forderungskonto|Debitorensammelkonto/i,
    include: /Customer Posting Groups|Debitorenbuchungsgruppen|Receivables|Forderung|Service Charge|Payment Disc|Code|Description|Beschreibung|Account|Konto/i,
    purpose: 'Customer Posting Groups connect customer ledger entries to receivables and related G/L accounts.'
  },
  {
    id: 'vendor-posting-groups',
    pageId: 111,
    label: 'Kreditorenbuchungsgruppen / Vendor Posting Groups',
    title: /Vendor Posting Groups|Kreditorenbuchungsgruppen/i,
    expectedText: /Payables Account|Verbindlichkeitskonto|Verbindlichkeiten-Konto|Kreditorensammelkonto/i,
    include: /Vendor Posting Groups|Kreditorenbuchungsgruppen|Payables|Verbindlichkeit|Payment Disc|Code|Description|Beschreibung|Account|Konto/i,
    purpose: 'Vendor Posting Groups connect vendor ledger entries to payables and related G/L accounts.'
  },
  {
    id: 'inventory-posting-setup',
    pageId: 5826,
    label: 'Lagerbuchung Einrichtung / Inventory Posting Setup',
    title: /Inventory Posting Setup|Lagerbuchung Einrichtung/i,
    expectedText: /Inventory Account|Bestandskonto|Lagerkonto|Location Code|Lagerortcode|Lagerort/i,
    include: /Inventory Posting Setup|Lagerbuchung|Inventory Account|Bestand|Location Code|Lagerort|Posting Group|Buchungsgruppe|Code|Account|Konto/i,
    purpose: 'Inventory Posting Setup connects locations and inventory posting groups to inventory G/L accounts.'
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'USt-Buchungsmatrix / VAT Posting Setup',
    title: /VAT Posting Setup|USt-Buchungsmatrix|MwSt\.-Buchungsmatrix/i,
    expectedText: /VAT Bus\. Posting Group|VAT Prod\. Posting Group|VAT %|MwSt\.-Geschäftsbuchungsgruppe|MwSt\.-Produktbuchungsgruppe|MwSt\. %|USt/i,
    include: /VAT Posting Setup|USt|MwSt|VAT|Posting Group|Buchungsgruppe|VAT %|Sales VAT|Purchase VAT|Konto|Account/i,
    purpose: 'VAT Posting Setup is read together with posting groups before German VAT claims or document previews.'
  }
];

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile']) {
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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Möchten Sie buchen|Delete\?|Loeschen\?|Löschen\?|Ship and Invoice|Liefern und fakturieren|Preview Posting|Buchungsvorschau/i.test(
    text
  );
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Aenderungen|Änderungen/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting/preview action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
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
    ...metadata
  });
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  const url = buildPlaythruUrl(probe.pageId);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(text);
  const matchedExpectedText = probe.title.test(text) && probe.expectedText.test(text);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const compact = await compactPageText(page, {
    include: [probe.include],
    maxLines: 80,
    maxLineLength: 180
  });
  const screenshot = `target-028-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;
  const textSignals = compact
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .slice(0, 40);

  await writeText(textFile, compact || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status: status === 'observed' ? 'universaarl-readonly-candidate' : status,
    bookUse: status === 'observed' ? 'posting-groups-readonly-preflight' : 'do-not-use-as-proof',
    visibleLearning: textSignals.slice(0, 12),
    importantUi: ['Read-only direct page route', 'No New/Edit/Post/Preview/Setup change clicked'],
    internallyProves:
      status === 'observed'
        ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `The route did not yet produce a safe visible ${probe.label} proof.`,
    doesNotProve: [
      'No setup value was changed.',
      'No posting group completeness or account correctness is proven.',
      'No master data, preview posting, posting or ledger trace exists.'
    ],
    finalScreenshotStatus: status === 'observed' ? 'candidate' : 'rejected'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: `playwright/projects/fibu-book5/img/${screenshot}`,
    textFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${textFile}`,
    textSignals,
    visibleWarnings: visibleWarnings(text),
    reason: !safeContext
      ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
      : dangerousDialog
        ? 'Dangerous dialog/action text detected; no action was confirmed.'
        : matchedExpectedText
          ? 'Expected posting-group page text is visible.'
          : 'Expected posting-group page text was not visible.'
  };
}

test('TARGET-028 read-only Posting Groups preflight', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], index + 1));
  }

  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status !== 'observed');
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-w1-posting-groups-preflight',
    resultStatus: blocked.length ? 'blocked' : 'observed',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    proved: [
      `${observed.length}/${probes.length} posting-group or VAT setup pages opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
      'No setup value, master data, document draft, preview posting or posting was executed.',
      ...observed.map((entry) => `${entry.label} visible read-only.`)
    ],
    notProved: [
      'Posting group completeness is not proven.',
      'Account correctness is not proven.',
      'German VAT correctness is not proven.',
      'No Preview Posting or ledger trace exists.',
      ...blocked.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-028-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-028-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-028-result.json`,
      ...results.map((entry) => entry.screenshot)
    ],
    pages: results,
    blockedBy: blocked.map((entry) => `${entry.id}: ${entry.reason}`),
    warnings: Array.from(new Set(results.flatMap((entry) => entry.visibleWarnings))),
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      noSetupChange: true,
      readOnlyDirectPageRoutes: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-027D24 parked the blocked VAT matrix route with explicit no-final/no-preview/no-posting boundary.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Posting groups are the next W1 Foundation dependency before master data and any Preview Posting.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-029-POSTING-GROUPS-CONTROLLED-SETUP-DECISION',
          status: blocked.length ? 'ready-after-current' : 'ready-next',
          reason: 'A controlled setup decision follows only after current posting-group page context is visible and risks are scoped.'
        },
        {
          caseId: 'TARGET-030-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Dimensions can continue after posting-group direction is known and VAT remains explicitly parked.'
        },
        {
          caseId: 'TARGET-031-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'The foundation checkpoint needs posting-group, VAT and dimension status before master data.'
        },
        {
          caseId: 'TARGET-032-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'First customer/vendor/item remains locked until foundation setup gates are explicit.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: blocked.length ? 'TARGET-028B-POSTING-GROUPS-PAGE-ROUTE-FOLLOWUP' : 'TARGET-029-POSTING-GROUPS-CONTROLLED-SETUP-DECISION',
      whySelectedNextCaseIsBest: blocked.length
        ? 'At least one target page route did not produce safe proof; resolve only the missing route before setup decisions.'
        : 'Posting group page contexts are visible enough for a controlled setup decision case.',
      risksBeforeNextCase: [
        'Do not edit posting groups until a separate setup-change case defines values and accounts.',
        'Do not create master data yet.',
        'Do not claim posting readiness from visibility alone.'
      ],
      requiredPreparation: blocked.length
        ? ['Review rejected/blocked page routes and use a non-search direct route or Page Inspection follow-up.']
        : ['Use TARGET-028 screenshots as read-only context, not setup correctness proof.']
    },
    requiresReview: blocked.length > 0,
    safeToFinalizeState: false,
    statePatch: {},
    reason: blocked.length
      ? 'Posting Groups read-only preflight partially blocked; review required.'
      : 'Posting Groups read-only preflight observed without setup changes.'
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-028 Posting Groups Read-only Preflight',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Sichtbare Seiten',
      '',
      ...observed.map((entry) => `- ${entry.label}`),
      '',
      '## Grenzen',
      '',
      '- Keine Setup-Aenderung.',
      '- Keine Stammdaten.',
      '- Kein Belegentwurf.',
      '- Keine Preview und keine Buchung.',
      '- Sichtbarkeit ist noch keine fachliche Konten- oder USt-Richtigkeit.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(results.every((entry) => instancePathIsTarget(entry.url) && companyParamIsTarget(entry.url))).toBe(true);
  expect(blocked, blocked.map((entry) => `${entry.id}: ${entry.reason}`).join('\n')).toHaveLength(0);
});
