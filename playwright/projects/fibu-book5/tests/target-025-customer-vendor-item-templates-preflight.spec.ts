import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-025-customer-vendor-item-templates-preflight';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-025-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  importantText: RegExp[];
  purpose: string;
  plannedRecords: string[];
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
  visibleActions: string[];
  plannedRecords: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'customers-list',
    pageId: 22,
    label: 'Customers / Debitoren',
    expectedText: /Customers|Debitoren|Customer|Debitor|No\.|Nr\.|Name/i,
    importantText: [/New|Neu/i, /Customer|Debitor|No\.|Nr\.|Name/i, /Template|Vorlage|Apply Template/i],
    purpose: 'Preflight for customer list/card route before creating U-CUST records.',
    plannedRecords: ['U-CUST-100', 'U-CUST-110', 'U-CUST-120', 'U-CUST-190', 'U-CUST-900']
  },
  {
    id: 'vendors-list',
    pageId: 27,
    label: 'Vendors / Kreditoren',
    expectedText: /Vendors|Kreditoren|Vendor|Kreditor|No\.|Nr\.|Name/i,
    importantText: [/New|Neu/i, /Vendor|Kreditor|No\.|Nr\.|Name/i, /Template|Vorlage|Apply Template/i],
    purpose: 'Preflight for vendor list/card route before creating U-VEND records.',
    plannedRecords: ['U-VEND-100', 'U-VEND-110', 'U-VEND-120', 'U-VEND-130', 'U-VEND-900']
  },
  {
    id: 'items-list',
    pageId: 31,
    label: 'Items / Artikel',
    expectedText: /Items|Artikel|Item|No\.|Nr\.|Description|Beschreibung/i,
    importantText: [/New|Neu/i, /Item|Artikel|No\.|Nr\.|Description|Beschreibung/i, /Type|Typ|Inventory|Lager/i],
    purpose: 'Preflight for item list/card route before creating U-ITEM records.',
    plannedRecords: ['U-ITEM-HW100', 'U-ITEM-RM100', 'U-ITEM-FG100', 'U-ITEM-SRV100', 'U-ITEM-ERR900']
  },
  {
    id: 'locations-list',
    pageId: 15,
    label: 'Locations / Lagerorte',
    expectedText: /Locations|Lagerorte|Location|Lagerort|Code|Name/i,
    importantText: [/New|Neu/i, /Location|Lagerort|Code|Name/i, /Require Receive|Wareneingang|Bin Mandatory|Lagerplatz/i],
    purpose: 'Preflight for simple locations before inventory and warehouse cases.',
    plannedRecords: ['SAAR-HL', 'SAAR-QS', 'SAAR-SRV']
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
  return /Do you want to post|Moechten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice|Preview Posting|Buchungsvorschau|Create\?|Erstellen\?|Save\?|Speichern\?/i.test(
    text
  );
}

function visibleActionSignals(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu visible but not clicked.' : '',
    /Edit|Bearbeiten|Aenderungen|Anderungen/i.test(text) ? 'Edit/Bearbeiten visible but not clicked.' : '',
    /Template|Vorlage/i.test(text) ? 'Template/Vorlage text visible; no template applied.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text) ? 'Posting/Preview text visible but not clicked.' : ''
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
  const imagePath = path.join(EVIDENCE_DIR, fileName);
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
  const matchedExpectedText = probe.expectedText.test(text);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const compact = await compactPageText(page, {
    include: probe.importantText,
    maxLines: 90,
    maxLineLength: 180
  });
  const textSignals = compact
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .slice(0, 45);
  const screenshot = `target-025-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;

  await writeText(textFile, compact || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status: status === 'observed' ? 'universaarl-readonly-candidate' : status,
    bookUse: status === 'observed' ? 'masterdata-template-preflight' : 'do-not-use-as-proof',
    visibleLearning: textSignals.slice(0, 14),
    importantUi: [
      'Direct page route',
      'List/card context before any New action',
      'No template applied',
      'No save/create action'
    ],
    internallyProves:
      status === 'observed'
        ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `The requested ${probe.label} route did not yet produce safe page proof.`,
    doesNotProve: [
      'No customer, vendor, item or location was created.',
      'No template was applied.',
      'No mandatory field was filled.',
      'No posting group, VAT group or number-series readiness is proven.',
      'No preview posting, posting or ledger trace exists.'
    ],
    plannedRecords: probe.plannedRecords,
    finalScreenshotStatus: status === 'observed' ? 'candidate' : 'rejected'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${screenshot}`,
    textFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${textFile}`,
    textSignals,
    visibleActions: visibleActionSignals(text),
    plannedRecords: probe.plannedRecords,
    reason: !safeContext
      ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
      : dangerousDialog
        ? 'Potential save/create/post/delete dialog text detected; no action was confirmed.'
        : matchedExpectedText
          ? 'Expected master-data page text is visible.'
          : 'Expected master-data page text was not visible.'
  };
}

test('TARGET-025 master-data template preflight without record creation', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], (index + 1) * 10));
  }

  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status !== 'observed');
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-masterdata-template-preflight',
    resultStatus: blocked.length ? 'blocked' : 'observed',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    proved: [
      `${observed.length}/${probes.length} master-data pages opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
      'No customer, vendor, item or location was created.',
      'No template was applied, no save/create was confirmed, no preview/posting occurred.',
      ...observed.map((entry) => `${entry.label} visible read-only.`)
    ],
    notProved: [
      'Templates and mandatory fields are not fully proven because New/Create was intentionally not confirmed.',
      'Posting groups, VAT groups and number-series readiness for actual new cards are not proven.',
      'No Default Dimensions, ledger entries, VAT entries, item entries or value entries exist from this case.',
      ...blocked.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-025-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-025-*.png`
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-025-result.json`,
      ...results.map((entry) => entry.screenshot)
    ],
    pages: results,
    blockedBy: blocked.map((entry) => `${entry.id}: ${entry.reason}`),
    warnings: Array.from(new Set(results.flatMap((entry) => entry.visibleActions))),
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      noTemplateApplied: true,
      readOnlyDirectPageRoutes: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-024 defined first Universaarl master-data families without creating records.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Master-data cards and lists must be visible before a controlled New/template/create case can be attempted.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-026-VAT-SETUP-FIT-DECISION',
          status: 'needs-source-check-first',
          reason: 'Customer/vendor/item VAT fields require source-backed setup before first create.'
        },
        {
          caseId: 'TARGET-027-DEFAULT-DIMENSIONS-STRATEGY',
          status: 'ready-after-current',
          reason: 'Default dimensions can be designed after card contexts are known, but global dimensions remain parked.'
        },
        {
          caseId: 'TARGET-028-FIRST-CUSTOMER-CONTROLLED-CREATE',
          status: blocked.length ? 'blocked' : 'ready-after-current',
          reason: blocked.length
            ? 'At least one page context is not safe enough.'
            : 'Customer create can follow after explicit create gate and setup-field decision.'
        },
        {
          caseId: 'TARGET-029-FIRST-VENDOR-AND-ITEM-CONTROLLED-CREATE',
          status: 'needs-setup-first',
          reason: 'Vendor/item creation needs posting/VAT setup and template/default decisions.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: blocked.length ? 'TARGET-025B-MASTERDATA-PAGE-ROUTE-FOLLOWUP' : 'TARGET-026-VAT-SETUP-FIT-DECISION',
      whySelectedNextCaseIsBest: blocked.length
        ? 'Resolve unsafe page routes before any master-data creation.'
        : 'VAT setup decisions affect the fields that will be used on customer, vendor and item cards.',
      risksBeforeNextCase: [
        'New/template actions can create records if confirmed blindly.',
        'No master-data creation should occur before setup-field decisions are explicit.'
      ],
      requiredPreparation: [
        'Keep New/Create/Save dialogs cancel-safe.',
        'Do not treat list visibility as proof of mandatory field completeness.'
      ]
    },
    requiresReview: blocked.length > 0,
    safeToFinalizeState: false,
    statePatch: {},
    reason: blocked.length
      ? 'Master-data preflight partially blocked; no records were created.'
      : 'Master-data list/card contexts were observed read-only; no records were created.'
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-025 Master Data Template Preflight',
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
      '- Keine Debitoren, Kreditoren, Artikel oder Lagerorte wurden angelegt.',
      '- Keine Vorlage wurde angewendet.',
      '- Kein Speichern, kein Erstellen, keine Preview und keine Buchung.',
      '- Sichtbarkeit einer Liste ist noch kein Beweis fuer Pflichtfelder oder Setup-Richtigkeit.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(results.every((entry) => instancePathIsTarget(entry.url) && companyParamIsTarget(entry.url))).toBe(true);
  expect(blocked, blocked.map((entry) => `${entry.id}: ${entry.reason}`).join('\n')).toHaveLength(0);
});
