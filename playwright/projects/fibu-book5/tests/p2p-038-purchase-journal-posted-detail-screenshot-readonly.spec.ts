import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { dismissTours, pageText, requireBcUrl, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 3000, height: 1500 }
});

test.setTimeout(240_000);

const TEST_ID = 'p2p-038';
const CASE_ID = 'P2P-038-PURCHASE-JOURNAL-POSTED-DETAIL-SCREENSHOT-READONLY';
const DOCUMENT_NO = 'P2P032-682298';

type DetailTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  screenshotFile: string;
  textEvidenceFile: string;
  purpose: string;
  requiredText: RegExp[];
};

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n');
}

function safeText(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '')
    .replace(/businesscentral\.dynamics\.com\/[0-9a-f]{8}-[0-9a-f-]{27,}\//gi, 'businesscentral.dynamics.com/[tenant-id]/');
}

function safeUrl(url: string) {
  return url
    .replace(/businesscentral\.dynamics\.com\/[0-9a-f]{8}-[0-9a-f-]{27,}\//gi, 'businesscentral.dynamics.com/[tenant-id]/')
    .replace(/aadTenantId=[^&]+/g, 'aadTenantId=[redacted]');
}

function compactRelevantText(text: string) {
  const interesting =
    /P2P032-682298|EXT-P2P032-682298|Vendor Ledger|Detailed Vendor|G\/L Entries|G\/L Entry|K10000|Stahlwerk Ruhr|22100|82000|Accounts Payable|Depreciation|Initial Entry|Invoice|-2\.500,00|2\.500,00|Entry No|Amount|Account No|Document No/i;
  return normalizeText(text)
    .split('\n')
    .map((line) => safeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => interesting.test(line))
    .slice(0, 120)
    .join('\n');
}

async function openTarget(page: Page, target: DetailTarget) {
  await page.goto(filteredBcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3500);
}

async function collectVisibility(page: Page, target: DetailTarget) {
  const text = normalizeText(await pageText(page));
  const compactText = compactRelevantText(text);
  await writeTextEvidence(p2pEvidencePath(target.textEvidenceFile), compactText);
  const requiredSignals = Object.fromEntries(target.requiredText.map((pattern) => [pattern.source, pattern.test(text)]));
  const visibleEnough = Object.values(requiredSignals).every(Boolean);
  if (visibleEnough) {
    await screenshot(page, target.screenshotFile, {
      projectName: project.name,
      testId: TEST_ID,
      status: 'labor',
      bookUse: 'process-proof',
      purpose: target.purpose,
      expectedPageText: target.requiredText,
      knownLimitations: [
        'RM-DEMO laboratory screenshot only.',
        'No German final proof.',
        'Read-only posted entry context; no Post, Preview Posting, New, Edit or Delete.'
      ]
    });
  }
  return {
    id: target.id,
    pageId: target.pageId,
    url: safeUrl(page.url()),
    textEvidenceFile: target.textEvidenceFile,
    screenshotFile: visibleEnough ? target.screenshotFile : null,
    requiredSignals,
    visibleEnough,
    compactTextLineCount: compactText.split('\n').filter(Boolean).length
  };
}

test('p2p-038 captures posted Purchase Journal detail screenshots read-only', async ({ page }) => {
  const targets: DetailTarget[] = [
    {
      id: 'vendor-ledger-entry',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: DOCUMENT_NO,
      screenshotFile: 'p2p-038-010-vendor-ledger-entry-detail.png',
      textEvidenceFile: '010-vendor-ledger-entry-detail-text.txt',
      purpose: 'Shows Vendor Ledger Entry for P2P032 with vendor, amount, related G/L details and entry number.',
      requiredText: [/Vendor Ledger Entries|Vendor Ledger Entry/i, /P2P032-682298/i, /K10000/i, /-2\.500,00/i, /22100/i, /82000/i]
    },
    {
      id: 'detailed-vendor-ledger-entry',
      pageId: 574,
      tableName: 'Detailed Vendor Ledg. Entry',
      filterField: 'Document No.',
      filterValue: DOCUMENT_NO,
      screenshotFile: 'p2p-038-020-detailed-vendor-ledger-entry.png',
      textEvidenceFile: '020-detailed-vendor-ledger-entry-text.txt',
      purpose: 'Shows Detailed Vendor Ledger Entry Initial Entry for P2P032 with amount and entry number.',
      requiredText: [/Detailed Vendor Ledger Entries|Detailed Vendor/i, /Initial Entry/i, /P2P032-682298/i, /K10000/i, /-2\.500,00/i]
    },
    {
      id: 'gl-entries',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: DOCUMENT_NO,
      screenshotFile: 'p2p-038-030-gl-entries-detail.png',
      textEvidenceFile: '030-gl-entries-detail-text.txt',
      purpose: 'Shows G/L Entries for P2P032 with accounts 22100 and 82000 and opposite amounts.',
      requiredText: [/G\/L Entries|General Ledger Entries/i, /P2P032-682298/i, /22100/i, /82000/i, /-2\.500,00/i, /2\.500,00/i]
    }
  ];

  const observations = [];
  for (const target of targets) {
    await openTarget(page, target);
    observations.push(await collectVisibility(page, target));
  }

  const allVisibleEnough = observations.every((entry) => entry.visibleEnough);
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-posted-entry-screenshot-visibility',
    resultStatus: allVisibleEnough ? 'observed' : 'blocked',
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    sourceCompany: 'RM-DEMO',
    documentNo: DOCUMENT_NO,
    observations,
    proved: [
      'Read-only posted entry pages for P2P032-682298 were opened directly by page id and document filter.',
      'Screenshots were only captured where the required human-visible accounting signals were present.',
      'No Post, Preview Posting, New, Edit, Delete, setup change, company switch or API shortcut was executed.'
    ],
    notProved: [
      'No German final proof.',
      'No German VAT/tax proof.',
      'No Purchase Order partial receipt.',
      'No new posting.'
    ],
    flags: {
      bcRun: true,
      playwrightRun: true,
      readOnly: true,
      posted: false,
      previewPosting: false,
      setupChanged: false,
      companySwitched: false,
      draftCreated: false,
      editedRecord: false,
      deletedRecord: false,
      apiShortcut: false,
      bookChanged: false
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    targetGermanCompanyImpact:
      'German final P2P must recreate equivalent posted entry screenshots with German accounts, tax setup and target-company context.',
    finalScreenshotNeeded: true,
    safeToFinalizeState: allVisibleEnough,
    requiresReview: !allVisibleEnough,
    blockedBy: allVisibleEnough
      ? []
      : observations.filter((entry) => !entry.visibleEnough).map((entry) => `${entry.id}-required-signals-not-visible`),
    statePatch: {},
    nextStep: allVisibleEnough
      ? 'P2P-039: review P2P-038 screenshot metadata and decide whether Chapter 12 can reference screenshots.'
      : 'Review P2P-038 blocked screenshot visibility before using screenshots in the book.'
  };
  await writeJsonEvidence(p2pEvidencePath('P2P-038-result.json'), result);
  await writeTextEvidence(
    p2pEvidencePath('README.md'),
    [
      '# P2P-038 Posted Entry Screenshot Visibility',
      '',
      'Status: `read-only`, `labor-screenshot-candidate`, `needs-german-final-rebuild`.',
      '',
      `Document No.: \`${DOCUMENT_NO}\``,
      '',
      '| Target | Visible enough | Screenshot | Text evidence |',
      '|---|---:|---|---|',
      ...observations.map(
        (entry) =>
          `| ${entry.id} | ${entry.visibleEnough ? 'yes' : 'no'} | ${entry.screenshotFile ?? ''} | ${entry.textEvidenceFile} |`
      ),
      '',
      'Boundary: RM-DEMO laboratory only. No posting, no preview, no setup change, no edit/delete/new.'
    ].join('\n')
  );

  expect(result.flags.posted).toBe(false);
  expect(result.flags.previewPosting).toBe(false);
  expect(result.flags.setupChanged).toBe(false);
  expect(result.flags.companySwitched).toBe(false);
  expect(allVisibleEnough).toBe(true);
});
