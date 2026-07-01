import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-036D-FIRST-VENDOR-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-036d-first-vendor-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036D-result.json');
const VENDORS_PAGE_ID = 27;

const targetVendor = {
  preferredNo: 'U-VEND-100',
  name: 'Universaarl Lieferant 100'
};

type Step = Record<string, unknown>;

function buildPlaythruUrl(filterTarget = false) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(VENDORS_PAGE_ID));
  if (filterTarget) {
    url.searchParams.set('filter', `'Vendor'.'Name' IS '${targetVendor.name}'`);
  }
  return url;
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function literalPattern(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsHardForbiddenText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|Loschen\?|Payment Journal|Zahlungsjournal|Buchen|Vorlage anwenden\?|Apply Template\?/i.test(
    text
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function safeText(page: Page) {
  return clean(await pageText(page));
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

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Vendors|Kreditoren|Vendor Card|Kreditorenkarte|Nr\.|No\.|Name|Vorlage anwenden|Apply Template|Kreditorenbuchungsgruppe|Vendor Posting Group|Zahlungsbedingung|Payment Terms|U-VEND-100|Universaarl Lieferant 100/i
    ],
    maxLines: 180,
    maxLineLength: 220
  });
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible: {
      pageContext: /Vendors|Kreditoren|Vendor Card|Kreditorenkarte/i.test(text),
      targetNo: literalPattern(targetVendor.preferredNo).test(text),
      targetName: literalPattern(targetVendor.name).test(text),
      applyTemplateAction: /Vorlage anwenden|Apply Template/i.test(text),
      postingGroupSignal: /Kreditorenbuchungsgruppe|Vendor Posting Group|Buchungsgruppe/i.test(text),
      hardForbiddenSignal: containsHardForbiddenText(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: VENDORS_PAGE_ID,
    page: 'Vendors / Kreditoren',
    step,
    visibleLearning: [
      'Kreditoren sind Lieferantenstammdaten fuer Einkaufsprozesse.',
      'Neu oeffnet die Kreditorenkarte.',
      'In diesem Gate werden nur Nr. und Name geprueft oder geschrieben.',
      'Vorlage anwenden bleibt sichtbar, wird aber nicht geklickt.'
    ],
    importantUi: ['Vendors/Kreditoren Liste oder Karte', 'Nr./No.', 'Name', 'Vorlage anwenden/Apply Template'],
    internallyProves:
      snapshot.visible.targetNo || snapshot.visible.targetName
        ? 'Der erste Universaarl-Kreditor ist im Kreditorenkontext sichtbar.'
        : 'Kreditorenkontext vor oder waehrend des kontrollierten Schreibgates.',
    doesNotProve: [
      'Keine Kreditorenbuchungsgruppe auf einem gebuchten Beleg.',
      'Keine USt- oder Buchungsmatrix-Wirkung.',
      'Keine Einkaufsrechnung, Preview Posting, Posting oder Kreditorenposten.',
      'Keine Vorlage wurde angewendet.'
    ],
    finalScreenshotStatus: snapshot.visible.targetName ? 'universaarl-masterdata-evidence' : 'setup-before',
    ...extra
  });
  return snapshot;
}

async function openVendors(page: Page, filterTarget = false) {
  await page.goto(buildPlaythruUrl(filterTarget).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
  await assertVendorContext(page);
}

async function assertVendorContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(/Vendors|Kreditoren|Vendor Card|Kreditorenkarte|Vendor|Kreditor|Nr\.|No\.|Name/i.test(text)).toBe(true);
  expect(containsHardForbiddenText(text), 'Kein Buchungs-, Zahlungs-, Loesch- oder Template-Bestaetigungsdialog erlaubt').toBe(false);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (expected.test(bodyText)) return { frame, bodyText: clean(bodyText) };
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible({ timeout }).catch(() => false)) return item;
  }
  return undefined;
}

async function clickAction(page: Page, frame: Frame, name: RegExp) {
  for (const scope of [frame, page]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = await firstVisible(scope.getByRole(role, { name }), 900);
      if (action) {
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(1200);
        return true;
      }
    }
  }
  return false;
}

async function editableTextboxes(scope: Frame | Locator) {
  const boxes = scope.locator('input[role="textbox"], input[role="combobox"], textarea[role="textbox"], input:not([type])');
  const result: Locator[] = [];
  const inspected = [];
  const count = await boxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = boxes.nth(index);
    const row = {
      index,
      visible: await box.isVisible({ timeout: 300 }).catch(() => false),
      disabled: await box.isDisabled({ timeout: 300 }).catch(() => true),
      editable: await box.isEditable({ timeout: 300 }).catch(() => false),
      aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
      title: (await box.getAttribute('title').catch(() => '')) || '',
      value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
    };
    inspected.push(row);
    if (row.visible && !row.disabled && row.editable) result.push(box);
  }
  return { result, inspected };
}

async function fillBox(page: Page, box: Locator, value: string) {
  await box.click({ force: true });
  await box.fill('').catch(async () => {
    await page.keyboard.press('Control+A');
  });
  await page.keyboard.insertText(value);
}

async function fillVendorFields(page: Page, frame: Frame, steps: Step[]) {
  const { result: boxes, inspected } = await editableTextboxes(frame);
  steps.push({ step: 'editable-inputs-after-new-vendor-card', inspected });

  const nameByLabel = await firstVisible(frame.getByRole('textbox', { name: /^Name$/i }), 500);

  let changedNo = false;
  let changedName = false;
  const fieldsChanged: string[] = [];
  const fieldsNotTouched = [
    'Vorlage anwenden / Apply Template',
    'Kreditorenbuchungsgruppe / Vendor Posting Group',
    'Geschaeftsbuchungsgruppe / Gen. Bus. Posting Group',
    'USt-Geschaeftsbuchungsgruppe / VAT Bus. Posting Group',
    'Zahlungsbedingungen / Payment Terms',
    'Gesperrt / Blocked',
    'Bankkonto / Bank Account'
  ];

  steps.push({
    step: 'vendor-number-series-decision',
    decision: 'leave-no-field-blank',
    reason:
      'Screenshot QA showed that manual No. U-VEND-100 is rejected unless Manual Nos. is enabled for the vendor number series. TARGET-036D does not allow number-series setup changes, so Business Central must assign the vendor number.'
  });

  if (nameByLabel && (await nameByLabel.isEditable({ timeout: 500 }).catch(() => false))) {
    await fillBox(page, nameByLabel, targetVendor.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    changedName = true;
    fieldsChanged.push(`Name=${targetVendor.name}`);
  } else if (boxes.length >= 2) {
    const candidate = boxes[1];
    await fillBox(page, candidate, targetVendor.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    changedName = true;
    fieldsChanged.push(`Name=${targetVendor.name} via first safe empty/editable textbox`);
  }

  return {
    changedNo,
    changedName,
    changed: changedName,
    fieldsChanged,
    fieldsNotTouched,
    reason: changedName
      ? changedNo
        ? 'Filled labelled No. and Name fields.'
        : 'Filled Name while No. stayed controlled by Business Central number series.'
      : 'No trusted editable Name field was visible.'
  };
}

async function createOrVerifyVendor(page: Page, steps: Step[]) {
  await openVendors(page);
  const textBefore = await safeText(page);
  if (literalPattern(targetVendor.preferredNo).test(textBefore) || literalPattern(targetVendor.name).test(textBefore)) {
    return {
      changed: false,
      status: 'already-exists' as const,
      reason: `${targetVendor.preferredNo} or ${targetVendor.name} already visible before write gate.`
    };
  }

  const { frame } = await findBcFrame(page, /Vendors|Kreditoren|Vendor|Kreditor|Nr\.|No\.|Name/i);
  const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
  steps.push({ step: 'click-scoped-new-on-vendors', newClicked });
  if (!newClicked) {
    return { changed: false, status: 'blocked' as const, reason: 'New/Neu was not visible in the Vendors context.' };
  }

  await page.waitForTimeout(1400);
  await assertVendorContext(page);
  const afterNewText = await safeText(page);
  if (!/Vendor Card|Kreditorenkarte|Vendor|Kreditor|Nr\.|No\.|Name/i.test(afterNewText)) {
    return { changed: false, status: 'blocked' as const, reason: 'New did not keep a trusted Vendor Card context.' };
  }
  if (!/Vorlage anwenden|Apply Template/i.test(afterNewText)) {
    steps.push({ step: 'apply-template-action-not-visible', risk: 'Expected action missing; continue only with simple Name field if context stays trusted.' });
  }

  const { frame: afterNewFrame } = await findBcFrame(page, /Vendor Card|Kreditorenkarte|Vendor|Kreditor|Nr\.|No\.|Name/i);
  const fill = await fillVendorFields(page, afterNewFrame, steps);
  steps.push({ step: 'fill-vendor-approved-fields-only', fill });
  if (!fill.changed) {
    return { changed: false, status: 'blocked' as const, reason: fill.reason, fill };
  }

  await assertVendorContext(page);
  await page.waitForTimeout(1500);
  return { changed: true, status: 'created-or-edited' as const, reason: fill.reason, fill };
}

test('TARGET-036D creates or verifies first Universaarl vendor with narrow field gate', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-036C proved the first customer write/reopen route; TARGET-036B showed Vendor New opens a direct card with Vorlage anwenden visible but not clicked. Vendor is the next narrow accounting master-data write before item.',
      sourceBasis: [
        'Microsoft Learn: Register a new vendor says vendors can be added manually by filling out the Vendor Card or by using templates.',
        'TARGET-036B: Vendor New route is card-with-apply-template-action.',
        'TARGET-036C: Customer write/reopen proof worked with Nr. and Name only.'
      ],
      fieldsChangedOnlyIfSafe: [
        `Vendor.Name=${targetVendor.name}`,
        'Vendor.No left blank because the active vendor number series controls the number'
      ],
      fieldsNotTouched: [
        'Vorlage anwenden / Apply Template',
        'Vendor Posting Group',
        'Gen. Bus. Posting Group',
        'VAT Bus. Posting Group',
        'Payment Terms',
        'Blocked',
        'Bank Account'
      ],
      risk: 'A vendor without posting/VAT/payment fields is not posting-ready; this case proves only first vendor master-data persistence.',
      fallback: 'Abort and document screenshots if the Vendor Card, field route, context, save/reopen route or template behavior is unclear.'
    }
  ];

  await openVendors(page);
  const before = await captureState(page, 'target-036d-010-vendors-before', 'Before first Vendor write gate.', {
    targetVendor
  });

  const writeAttempt = await createOrVerifyVendor(page, steps);
  const afterAttempt = await captureState(page, 'target-036d-020-after-vendor-attempt', 'After Vendor write or verify attempt.', {
    targetVendor,
    writeAttempt,
    steps
  });

  await openVendors(page, true);
  const afterReopen = await captureState(page, 'target-036d-030-after-reopen-filtered-proof', 'After reopening Vendors filtered to Universaarl Lieferant 100.', {
    targetVendor,
    writeAttempt,
    steps,
    reopenProofRoute: 'direct Page 27 URL with Vendor Name filter'
  });

  const afterReopenText = await safeText(page);
  const persistedPreferredNo = literalPattern(targetVendor.preferredNo).test(afterReopenText);
  const persistedName = literalPattern(targetVendor.name).test(afterReopenText);
  const persisted = persistedName;
  const numberSeriesBlocked = /Standardnr\.|Default Nos\.|Manual Nos\.|Manuelle|Nummernserie U-VEND|number series|Nummern automatisch zuweisen/i.test(
    `${afterAttempt.compact ?? ''}\n${afterReopen.compact ?? ''}`
  );
  const blockedBy = persisted
    ? []
    : numberSeriesBlocked
      ? ['U-VEND number series does not allow automatic Default Nos. / Standardnr.; manual U-VEND-100 is also not proven without Manual Nos.']
      : [`${targetVendor.name} is not visible after filtered reopen.`];
  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted ? 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE' : 'TARGET-036D2-VENDOR-NUMBER-SERIES-CHECKBOX-FIT';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-first-vendor-controlled-write-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Vendors / Kreditoren',
    pageId: VENDORS_PAGE_ID,
    url: sanitizeEvidenceUrl(page.url()),
      sourceRefs: [
      {
        title: 'Microsoft Learn: Register a new vendor',
        url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/purchasing-how-register-new-vendors',
        claim: 'Vendors can be added manually by filling out the Vendor Card or by using templates.'
      },
      {
        title: 'Microsoft Learn: Create number series',
        url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/ui-create-number-series',
        claim: 'Default Nos. allows automatic numbering; Manual Nos. allows manual number entry.'
      }
    ],
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Page 27 Vendors / Kreditoren.',
      'Captured before screenshot QA.',
      writeAttempt.changed
        ? 'Opened Vendor Card via scoped New and attempted only approved vendor fields.'
        : writeAttempt.status === 'already-exists'
          ? 'Verified an existing matching vendor without creating a duplicate.'
          : 'Stopped before an unsafe write.',
      'Reopened Page 27 with a Vendor Name filter for persistence proof.',
      'Captured after/reopen screenshot QA.'
    ],
    actionsNotTaken: [
      'No Vorlage anwenden / Apply Template action was clicked.',
      'No customer was created.',
      'No item was created.',
      'No setup field was changed.',
      'No purchase/sales document or draft was created.',
      'No Preview Posting was executed.',
      'No Posting was executed.',
      'No payment was executed.',
      'No API shortcut was used.',
      'No company switch was executed.',
      'No number-series setup was changed to allow manual vendor numbers.'
    ],
    setupChanged: false,
    masterDataChanged: persisted && writeAttempt.changed,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036d-010-vendors-before.png',
      'playwright/projects/fibu-book5/img/target-036d-020-after-vendor-attempt.png',
      'playwright/projects/fibu-book5/img/target-036d-030-after-reopen-filtered-proof.png'
    ],
    proved: persisted
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 27 Vendors / Kreditoren was used as the scoped page.',
          `${targetVendor.name} is visible after reopen.`,
          'Vendor No. was left to Business Central number-series assignment; manual No. U-VEND-100 was not forced.',
          'The first vendor route was executed without applying a template, without creating customer/item records and without document/preview/posting routes.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 27 Vendors / Kreditoren was opened and screenshot QA was captured.',
          numberSeriesBlocked
            ? 'Vendor creation is blocked by U-VEND number-series checkbox settings before a vendor can be saved.'
            : 'Vendor did not persist after the controlled reopen check.'
        ],
    notProved: [
      'No vendor posting readiness is proven.',
      'No Vendor Posting Group, Gen. Bus. Posting Group, VAT Bus. Posting Group, Payment Terms or bank account value is proven as correct.',
      'No purchase document, Preview Posting, Posting, vendor ledger entry or G/L entry is proven.',
      'No item route is proven by this write gate.',
      persistedPreferredNo ? 'Manual vendor number is visible, but was not required by this run.' : 'Preferred manual No. U-VEND-100 is not proven; Business Central number series controls the vendor number.',
      ...blockedBy
    ],
    blockedBy,
    warnings: [
      'This vendor is only the first master-data persistence proof, not P2P readiness.',
      'Manual vendor number U-VEND-100 is blocked by number-series setup unless Manual Nos. is enabled; this case deliberately does not change that setup.',
      'Vorlage anwenden / Apply Template was deliberately not clicked.',
      'Posting/VAT/payment fields remain separate gated setup and master-data steps.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCustomerCreated: true,
      noItemCreated: true,
      noTemplateApplied: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      vendorMasterDataChanged: persisted && writeAttempt.changed
    },
    targetVendor,
    before,
    afterAttempt,
    afterReopen,
    writeAttempt,
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-036C proved U-CUST-100 after controlled Customer write/reopen proof; TARGET-036B showed Vendor New opens a direct card with Vorlage anwenden visible but not clicked.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Vendor is the next narrow accounting-relevant master-data write before item; it mirrors the Customer route but needs its own proof and field boundaries.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE',
          status: persisted ? 'needs-setup-first' : 'blocked',
          reason: persisted
            ? 'Item creation is next but must first prove Item Type/Base Unit and inventory/product posting field boundaries.'
            : 'Do not create an item until the first vendor write route is recovered.'
        },
        {
          caseId: 'TARGET-039-FOUNDATION-BLOCKER-REVISIT',
          status: 'ready-after-current',
          reason: 'Parked Page 314, VAT matrix, inventory posting and default-dimension blockers remain relevant before first document flow.'
        },
        {
          caseId: 'TARGET-037-FIRST-PREVIEW-GATE',
          status: 'blocked',
          reason: 'Preview requires customer, vendor, item and setup readiness that is not proven by this vendor-only gate.'
        },
        {
          caseId: 'TARGET-040-FIRST-P2P-DRAFT-GATE',
          status: 'blocked',
          reason: 'P2P draft must wait for item and posting/VAT setup acceptance.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'The first item gate is the next missing master-data pillar, but it must start with stricter field discovery because items carry inventory/setup impact.'
        : 'Fit the U-VEND number-series checkboxes before repeating the vendor write route; BC explicitly blocked automatic and manual numbering.',
      risksBeforeNextCase: [
        'Do not treat one saved vendor as purchase or posting readiness.',
        'Do not click Apply Template unless a nested Smart Decision explicitly approves it.',
        'Do not create item in the same case.'
      ],
      requiredPreparation: persisted
        ? ['Prepare item field list with Base Unit and Item Type discovery; keep documents, preview and posting locked.']
        : ['Inspect U-VEND Standardnr. / Default Nos. and Manuelle Anz. / Manual Nos. on the Number Series page; change only approved U-VEND checkboxes if visually scoped.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036d-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D-result.json`,
      'playwright/projects/fibu-book5/img/target-036d-010-vendors-before.png',
      'playwright/projects/fibu-book5/img/target-036d-020-after-vendor-attempt.png',
      'playwright/projects/fibu-book5/img/target-036d-030-after-reopen-filtered-proof.png'
    ],
    requiresReview: !persisted,
    safeToFinalizeState: persisted,
    statePatch: persisted
      ? {
          current: {
            activeCase: nextCase,
            active_case_file: '.agent/state/cases/target-036e-first-item-controlled-write-gate.json',
            activeArea: 'universaarl-first-item-controlled-write',
            nextStep:
              'Prepare TARGET-036E as the first item controlled write/field gate; prove Item Type/Base Unit boundaries before any item write.'
          },
          activeCase: {
            status: 'done',
            resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D-result.json`,
            nextCase
          },
          coverage: {
            latestTarget036DFirstVendor: {
              caseId: CASE_ID,
              status: 'observed',
              preferredNo: targetVendor.preferredNo,
              name: targetVendor.name,
              resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D-result.json`
            }
          }
        }
      : {},
    reason: persisted
      ? `${targetVendor.name} is visible after controlled Vendor write/verify and filtered reopen proof; vendor No. remains number-series controlled.`
      : `Controlled Vendor write gate blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-036D First Vendor Controlled Write Gate',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Geaendert',
      '',
      writeAttempt.changed
        ? persisted
          ? `- Kreditor ${targetVendor.name} wurde mit eng begrenzter Feldliste angelegt oder bearbeitet; die Nr. blieb durch die Nummernserie gesteuert.`
          : '- Kein Kreditor wurde gespeichert. Business Central blockiert U-VEND, weil Standardnr. fuer automatische Nummern nicht aktiv ist und manuelle Nummern nicht freigegeben sind.'
        : writeAttempt.status === 'already-exists'
          ? `- Kreditor ${targetVendor.preferredNo} oder ${targetVendor.name} war bereits sichtbar; keine Dublette angelegt.`
          : '- Keine Aenderung, der Schreibweg wurde blockiert.',
      '',
      '## Grenzen',
      '',
      '- Keine Vorlage wurde angewendet.',
      '- Keine Buchungsgruppe, USt-Gruppe, Zahlungsbedingung oder Bankverbindung wurde fachlich bewiesen.',
      '- Kein Einkaufsbeleg, keine Preview und keine Buchung.',
      '- Artikel bleiben ein eigenes Gate.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(persisted || numberSeriesBlocked, blockedBy.join('\n')).toBe(true);
});
