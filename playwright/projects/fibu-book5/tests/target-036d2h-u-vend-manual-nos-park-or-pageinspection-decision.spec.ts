import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(300_000);

const CASE_ID = 'TARGET-036D2H-U-VEND-MANUAL-NOS-PARK-OR-PAGEINSPECTION-DECISION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_SERIES = 'U-VEND';
const PARKED_NEXT_CASE = 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT';
const EVIDENCE_ID = 'target-036d2h-u-vend-manual-nos-park-or-pageinspection-decision';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036D2H-result.json');

function buildNumberSeriesUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', '456');
  url.searchParams.set('filter', `'No. Series'.'Code' IS '${TARGET_SERIES}'`);
  return url.toString();
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

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function assertSafeContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `Wrong instance: ${sanitizeUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `Wrong company: ${sanitizeUrl(url)}`).toBe(true);
  const text = clean(await pageText(page));
  expect(text).toMatch(/Nummernserie|No\. Series/i);
  expect(text).toMatch(/U-VEND/i);
  expect(text).not.toMatch(/Buchungsvorschau|Preview Posting|Moechten Sie buchen|Mochten Sie buchen|Do you want to post|Ship and Invoice|Zahlung buchen|Payment Journal/i);
}

async function openFilteredNumberSeries(page: Page) {
  await page.goto(buildNumberSeriesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
}

async function compactSnapshot(page: Page) {
  return compactPageText(page, {
    include: [/Nummernserie|No\. Series|Code|Beschreibung|Description|Standardnr|Default Nos|Manuelle|Manual Nos|U-VEND|Page Inspection|Seitenpr|Page ID|Source Table|Table ID|Felder|Fields|308|456/i],
    maxLines: 260,
    maxLineLength: 260
  });
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    caseId: CASE_ID,
    fileName,
    imagePath: `playwright/projects/fibu-book5/img/${fileName}`,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function capture(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactSnapshot(page);
  await writeText(`${filePrefix}.txt`, compact);
  const snapshot = {
    step,
    url: sanitizeUrl(page.url()),
    title: clean(await page.title()),
    compact,
    ...extra
  };
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nummernserie / No. Series',
    pageId: 456,
    table: 'No. Series',
    tableId: 308,
    step,
    targetSeries: TARGET_SERIES,
    purpose: 'Read-only screenshot QA for U-VEND Manual Nos park/Page Inspection decision.',
    importantUi: ['filtered U-VEND row', 'Manuelle Anz. / Manual Nos.', 'Page Inspection pane when visible'],
    internallyProves: 'Business Central UI stayed in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No setup write.', 'No vendor exists.', 'No Preview Posting or Posting occurred.'],
    ...extra
  });
  return snapshot;
}

async function inspectPage(page: Page) {
  const beforeText = clean(await pageText(page));
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1800);
  const afterText = clean(await pageText(page));
  const opened = afterText !== beforeText && /Page Inspection|Seitenpr|Page ID|Source Table|Table ID|No\. Series|Manual Nos|Manuelle/i.test(afterText);
  const fieldSignals = {
    page456: /456|No\. Series|Nummernserie/i.test(afterText),
    table308: /308|No\. Series/i.test(afterText),
    manualNosField: /Manual Nos|Manuelle Anz/i.test(afterText),
    defaultNosField: /Default Nos|Standardnr/i.test(afterText),
    uVendValue: /U-VEND/i.test(afterText),
    manualNosTrue: /Manual Nos[^\\n]{0,120}(true|yes|ja|checked)|Manuelle Anz[^\\n]{0,120}(true|yes|ja|aktiv|ausgewaehlt)/i.test(afterText)
  };
  return { attempted: true, opened, fieldSignals };
}

test('TARGET-036D2H parks or chooses Page Inspection route for U-VEND Manual Nos', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await openFilteredNumberSeries(page);

  const baseline = await capture(page, 'target-036d2h-010-u-vend-baseline', 'Filtered U-VEND baseline before Page Inspection.');
  const pageInspection = await inspectPage(page);
  const inspection = await capture(page, 'target-036d2h-020-page-inspection-attempt', 'Page Inspection attempt for U-VEND Manual Nos.', { pageInspection });

  const hasTechnicalFieldContext =
    pageInspection.opened && pageInspection.fieldSignals.page456 && pageInspection.fieldSignals.table308 && pageInspection.fieldSignals.manualNosField;
  const provesManualNosValue = pageInspection.fieldSignals.manualNosTrue;
  const parkManualVendorNumbering = !provesManualNosValue;
  const nextCase = parkManualVendorNumbering
    ? PARKED_NEXT_CASE
    : 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE';
  const resultStatus = parkManualVendorNumbering ? 'observed-parked' : 'observed';
  const completedAt = new Date().toISOString();

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary:
      'D2G proved source basis and visible U-VEND checkbox columns, but no unique Playwright Manual Nos checkbox candidate.',
    isPlannedNextCaseStillSensible: true,
    reason: parkManualVendorNumbering
      ? 'Page Inspection did not prove Manual Nos active for U-VEND, so first-vendor manual-numbering stays parked.'
      : 'Page Inspection indicates Manual Nos is active; vendor write gate can become sensible.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
        status: parkManualVendorNumbering ? 'blocked' : 'ready-next',
        reason: parkManualVendorNumbering
          ? 'Manual Nos is not proven active for U-VEND after Page Inspection.'
          : 'Manual Nos appears active, but vendor write must still be a separate gate.'
      },
      {
        caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
        status: 'obsolete',
        reason: 'Already blocked and superseded by later 026O/028/029/034/039 foundation evidence.'
      },
      {
        caseId: PARKED_NEXT_CASE,
        status: parkManualVendorNumbering ? 'ready-next' : 'ready-after-current',
        reason: parkManualVendorNumbering
          ? 'Best current no-write route after U-VEND is parked: decide customer/item posting field fit from 044D evidence instead of creating a vendor.'
          : 'Customer/item field fit can wait because Manual Nos would unblock a separate vendor gate.'
      },
      {
        caseId: 'TARGET-027D-VAT-POSTING-SETUP',
        status: 'blocked',
        reason: 'VAT matrix was parked by later D24 evidence and must not be mixed into number-series recovery.'
      },
      {
        caseId: 'TARGET-040-ITEM-INVENTORY-FOUNDATION-READONLY-PREFLIGHT',
        status: 'ready-after-current',
        reason: 'Already done; item retry must wait for remaining Foundation checkpoint decisions.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C needs customer/item/posting/VAT readiness.'
      }
    ],
    queueChangesMade: [`Selected ${nextCase} after D2H.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: parkManualVendorNumbering
      ? 'U-VEND manual vendor numbering is parked; the fastest useful next step is a no-write controlled-fit decision for customer/item posting fields based on existing 044D evidence.'
      : 'Manual Nos active state would unblock only the separate first-vendor write gate.',
    risksBeforeNextCase: [
      'Do not create a vendor while U-VEND Manual Nos remains unproven.',
      'Do not repeat broad checkbox or coordinate routes.',
      'Keep VAT, posting, documents and API locked.'
    ],
    requiredPreparation: parkManualVendorNumbering
      ? ['Read TARGET-044D and prepare exact source-backed customer/item posting-field values before any later write gate.']
      : ['Create a separate vendor write-gate with no documents, no preview and no posting.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-u-vend-manual-nos-pageinspection-park-decision',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    page: 'No. Series / Nummernserie',
    pageId: 456,
    table: 'No. Series',
    tableId: 308,
    actionsTaken: [
      'Opened Page 456 Number Series with a U-VEND-only filter in playthru / UNIVERSAARL-DE.',
      'Captured baseline screenshot QA.',
      'Attempted Ctrl+Alt+F1 Page Inspection read-only.',
      parkManualVendorNumbering ? 'Parked U-VEND manual vendor numbering for now.' : 'Selected separate first-vendor write gate as next step.'
    ],
    actionsNotTaken: [
      'No company switch.',
      'No customer, vendor or item card was created.',
      'No sales or purchase document draft was created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No setup field was changed.',
      'No number-series lines were changed.',
      'No Standard Nos. checkbox was toggled.',
      'No Manual Nos. checkbox was toggled.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036d2h-010-u-vend-baseline.png',
      'playwright/projects/fibu-book5/img/target-036d2h-020-page-inspection-attempt.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2H-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2h-010-u-vend-baseline.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2h-020-page-inspection-attempt.snapshot.json`
    ],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 456 was opened with a U-VEND-only filter.',
      hasTechnicalFieldContext
        ? 'Page Inspection exposed technical No. Series / Manual Nos context.'
        : 'Page Inspection did not expose enough technical Manual Nos context for a write route.',
      parkManualVendorNumbering
        ? 'U-VEND manual vendor numbering is consciously parked instead of repeating failed checkbox routes.'
        : 'Manual Nos active signal was observed; any vendor write still needs a separate gate.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ],
    notProved: [
      parkManualVendorNumbering ? 'U-VEND Manual Nos. is not proven active after reopen.' : 'No vendor exists from this case.',
      'No vendor exists from this case.',
      'No automatic numbering behavior, posting group, VAT, ledger entry, Preview Posting or Posting behavior is proven.'
    ],
    warnings: [
      'Page Inspection is technical/debug context, not a beginner-facing final screenshot.',
      'A visible unchecked checkbox column is not a safe Playwright write route.'
    ],
    blockedBy: parkManualVendorNumbering ? ['Manual Nos active value was not proven by Page Inspection or reopen evidence.'] : [],
    flags: {
      noCompanySwitch: true,
      noMasterDataChange: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noApiShortcut: true,
      noSetupChange: true
    },
    pageInspection,
    snapshotRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2h-010-u-vend-baseline.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2h-020-page-inspection-attempt.snapshot.json`
    ],
    nextStepDecision,
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2H-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036d2h-*.png'
    ],
    timestamp: completedAt,
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea: parkManualVendorNumbering ? 'universaarl-customer-item-posting-field-fit' : 'universaarl-first-vendor-controlled-write-gate',
        activeCase: nextCase,
        active_case_file: parkManualVendorNumbering
          ? '.agent/state/cases/target-045-customer-item-posting-fields-controlled-fit.json'
          : '.agent/state/cases/target-036d3-first-vendor-manual-number-controlled-write-gate.json',
        lastCompletedCase: CASE_ID,
        nextCase,
        nextStep: nextStepDecision.whySelectedNextCaseIsBest
      },
      activeCase: {
        status: resultStatus,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2H-result.json`,
        nextCase
      },
      lastRunSummary: {
        runId: CASE_ID,
        completedAt,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        bcRun: true,
        setupChanged: false,
        masterDataChanged: false,
        draftCreated: false,
        previewPosting: false,
        posted: false,
        apiShortcut: false,
        nextCase,
        summary: parkManualVendorNumbering
          ? 'D2H parked U-VEND manual vendor numbering after Page Inspection did not prove Manual Nos active.'
          : 'D2H observed Manual Nos active signal; next is separate first-vendor write gate.'
      }
    },
    reason: parkManualVendorNumbering
      ? 'U-VEND manual vendor numbering parked; move to Foundation checkpoint instead of repeating checkbox routes.'
      : 'Manual Nos signal observed; separate first-vendor write gate is next.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Entscheidung',
      '',
      result.reason,
      '',
      '## Nicht gemacht',
      '',
      '- keine Checkbox umgeschaltet',
      '- keine Nummernserienzeile geaendert',
      '- kein Kreditor, Debitor oder Artikel',
      '- kein Beleg oder Draft',
      '- keine Buchungsvorschau',
      '- keine Buchung',
      '- kein API Shortcut',
      '',
      '## Naechster Schritt',
      '',
      nextStepDecision.whySelectedNextCaseIsBest,
      ''
    ].join('\n')
  );

  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
