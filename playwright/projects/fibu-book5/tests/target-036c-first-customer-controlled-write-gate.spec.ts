import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-036C-FIRST-CUSTOMER-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-036c-first-customer-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036C-result.json');
const CUSTOMERS_PAGE_ID = 22;

const targetCustomer = {
  preferredNo: 'U-CUST-100',
  name: 'Universaarl Kunde 100'
};

type Step = Record<string, unknown>;

function buildPlaythruUrl(filterTarget = false) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(CUSTOMERS_PAGE_ID));
  if (filterTarget) {
    url.searchParams.set('filter', `'Customer'.'No.' IS '${targetCustomer.preferredNo}'`);
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
      /Customers|Debitoren|Customer Card|Debitorenkarte|Nr\.|No\.|Name|Vorlage anwenden|Apply Template|Debitorenbuchungsgruppe|Customer Posting Group|Zahlungsbedingung|Payment Terms|U-CUST-100|Universaarl Kunde 100/i
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
      pageContext: /Customers|Debitoren|Customer Card|Debitorenkarte/i.test(text),
      targetNo: literalPattern(targetCustomer.preferredNo).test(text),
      targetName: literalPattern(targetCustomer.name).test(text),
      applyTemplateAction: /Vorlage anwenden|Apply Template/i.test(text),
      postingGroupSignal: /Debitorenbuchungsgruppe|Customer Posting Group|Buchungsgruppe/i.test(text),
      hardForbiddenSignal: containsHardForbiddenText(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: CUSTOMERS_PAGE_ID,
    page: 'Customers / Debitoren',
    step,
    visibleLearning: [
      'Debitoren sind Kundenstammdaten fuer Verkaufsprozesse.',
      'Neu oeffnet die Debitorenkarte.',
      'In diesem Gate werden nur Nr. und Name geprueft oder geschrieben.',
      'Vorlage anwenden bleibt sichtbar, wird aber nicht geklickt.'
    ],
    importantUi: ['Customers/Debitoren Liste oder Karte', 'Nr./No.', 'Name', 'Vorlage anwenden/Apply Template'],
    internallyProves:
      snapshot.visible.targetNo || snapshot.visible.targetName
        ? 'Der erste Universaarl-Debitor ist im Debitorenkontext sichtbar.'
        : 'Debitorenkontext vor oder waehrend des kontrollierten Schreibgates.',
    doesNotProve: [
      'Keine Debitorenbuchungsgruppe auf einem gebuchten Beleg.',
      'Keine USt- oder Buchungsmatrix-Wirkung.',
      'Keine Verkaufsrechnung, Preview Posting, Posting oder Debitorenposten.',
      'Keine Vorlage wurde angewendet.'
    ],
    finalScreenshotStatus: snapshot.visible.targetName ? 'universaarl-masterdata-evidence' : 'setup-before',
    ...extra
  });
  return snapshot;
}

async function openCustomers(page: Page, filterTarget = false) {
  await page.goto(buildPlaythruUrl(filterTarget).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
  await assertCustomerContext(page);
}

async function assertCustomerContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(/Customers|Debitoren|Customer Card|Debitorenkarte|Customer|Debitor|Nr\.|No\.|Name/i.test(text)).toBe(true);
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

async function fillCustomerFields(page: Page, frame: Frame, steps: Step[]) {
  const { result: boxes, inspected } = await editableTextboxes(frame);
  steps.push({ step: 'editable-inputs-after-new-customer-card', inspected });

  const noByLabel = await firstVisible(frame.getByRole('textbox', { name: /^Nr\.?$|^No\.?$/i }), 500);
  const nameByLabel = await firstVisible(frame.getByRole('textbox', { name: /^Name$/i }), 500);

  let changedNo = false;
  let changedName = false;
  const fieldsChanged: string[] = [];
  const fieldsNotTouched = [
    'Vorlage anwenden / Apply Template',
    'Debitorenbuchungsgruppe / Customer Posting Group',
    'Geschaeftsbuchungsgruppe / Gen. Bus. Posting Group',
    'USt-Geschaeftsbuchungsgruppe / VAT Bus. Posting Group',
    'Zahlungsbedingungen / Payment Terms',
    'Kreditlimit / Credit Limit',
    'Gesperrt / Blocked'
  ];

  if (noByLabel && (await noByLabel.isEditable({ timeout: 500 }).catch(() => false))) {
    await fillBox(page, noByLabel, targetCustomer.preferredNo);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(700);
    changedNo = true;
    fieldsChanged.push(`No=${targetCustomer.preferredNo}`);
  }

  if (nameByLabel && (await nameByLabel.isEditable({ timeout: 500 }).catch(() => false))) {
    await fillBox(page, nameByLabel, targetCustomer.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    changedName = true;
    fieldsChanged.push(`Name=${targetCustomer.name}`);
  } else if (boxes.length >= 2) {
    const candidate = changedNo ? boxes[1] : boxes[0];
    await fillBox(page, candidate, targetCustomer.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    changedName = true;
    fieldsChanged.push(`Name=${targetCustomer.name} via first safe empty/editable textbox`);
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
        : 'Filled Name while No. stayed controlled by Business Central or was not safely editable.'
      : 'No trusted editable Name field was visible.'
  };
}

async function createOrVerifyCustomer(page: Page, steps: Step[]) {
  await openCustomers(page);
  const textBefore = await safeText(page);
  if (literalPattern(targetCustomer.preferredNo).test(textBefore) || literalPattern(targetCustomer.name).test(textBefore)) {
    return {
      changed: false,
      status: 'already-exists' as const,
      reason: `${targetCustomer.preferredNo} or ${targetCustomer.name} already visible before write gate.`
    };
  }

  const { frame } = await findBcFrame(page, /Customers|Debitoren|Customer|Debitor|Nr\.|No\.|Name/i);
  const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
  steps.push({ step: 'click-scoped-new-on-customers', newClicked });
  if (!newClicked) {
    return { changed: false, status: 'blocked' as const, reason: 'New/Neu was not visible in the Customers context.' };
  }

  await page.waitForTimeout(1400);
  await assertCustomerContext(page);
  const afterNewText = await safeText(page);
  if (!/Customer Card|Debitorenkarte|Customer|Debitor|Nr\.|No\.|Name/i.test(afterNewText)) {
    return { changed: false, status: 'blocked' as const, reason: 'New did not keep a trusted Customer Card context.' };
  }
  if (!/Vorlage anwenden|Apply Template/i.test(afterNewText)) {
    steps.push({ step: 'apply-template-action-not-visible', risk: 'Expected action missing; continue only with simple Name field if context stays trusted.' });
  }

  const { frame: afterNewFrame } = await findBcFrame(page, /Customer Card|Debitorenkarte|Customer|Debitor|Nr\.|No\.|Name/i);
  const fill = await fillCustomerFields(page, afterNewFrame, steps);
  steps.push({ step: 'fill-customer-approved-fields-only', fill });
  if (!fill.changed) {
    return { changed: false, status: 'blocked' as const, reason: fill.reason, fill };
  }

  await assertCustomerContext(page);
  await page.waitForTimeout(1500);
  return { changed: true, status: 'created-or-edited' as const, reason: fill.reason, fill };
}

test('TARGET-036C creates or verifies first Universaarl customer with narrow field gate', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-036B proved that Customer New opens a direct card with Vorlage anwenden visible but not clicked; Customer is the smallest accounting master-data write before vendor and item.',
      sourceBasis: [
        'Microsoft Learn: Register new customers says customers can be added manually on the Customer Card or by using templates.',
        'TARGET-036B: Customer New route is card-with-apply-template-action.'
      ],
      fieldsChangedOnlyIfSafe: [`Customer.No=${targetCustomer.preferredNo} if editable`, `Customer.Name=${targetCustomer.name}`],
      fieldsNotTouched: [
        'Vorlage anwenden / Apply Template',
        'Customer Posting Group',
        'Gen. Bus. Posting Group',
        'VAT Bus. Posting Group',
        'Payment Terms',
        'Credit Limit',
        'Blocked'
      ],
      risk: 'A customer without posting/VAT fields is not posting-ready; this case proves only first customer master-data persistence.',
      fallback: 'Abort and document screenshots if the Customer Card, field route, context, save/reopen route or template behavior is unclear.'
    }
  ];

  await openCustomers(page);
  const before = await captureState(page, 'target-036c-010-customers-before', 'Before first Customer write gate.', {
    targetCustomer
  });

  const writeAttempt = await createOrVerifyCustomer(page, steps);
  const afterAttempt = await captureState(page, 'target-036c-020-after-customer-attempt', 'After Customer write or verify attempt.', {
    targetCustomer,
    writeAttempt,
    steps
  });

  await openCustomers(page, true);
  const afterReopen = await captureState(page, 'target-036c-030-after-reopen-filtered-proof', 'After reopening Customers filtered to U-CUST-100.', {
    targetCustomer,
    writeAttempt,
    steps,
    reopenProofRoute: 'direct Page 22 URL with Customer No. filter'
  });

  const afterReopenText = await safeText(page);
  const persistedPreferredNo = literalPattern(targetCustomer.preferredNo).test(afterReopenText);
  const persistedName = literalPattern(targetCustomer.name).test(afterReopenText);
  const persisted = persistedName && (persistedPreferredNo || !writeAttempt.changed);
  const blockedBy = persisted ? [] : [`${targetCustomer.preferredNo} / ${targetCustomer.name} is not visible after filtered reopen.`];
  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted ? 'TARGET-036D-FIRST-VENDOR-CONTROLLED-WRITE-GATE' : 'TARGET-036C-CUSTOMER-WRITE-ROUTE-RECOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-first-customer-controlled-write-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Customers / Debitoren',
    pageId: CUSTOMERS_PAGE_ID,
    url: sanitizeEvidenceUrl(page.url()),
    sourceRefs: [
      {
        title: 'Microsoft Learn: Register new customers',
        url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/sales-how-register-new-customers',
        claim: 'Customers can be added manually on the Customer Card or by using templates.'
      }
    ],
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Page 22 Customers / Debitoren.',
      'Captured before screenshot QA.',
      writeAttempt.changed
        ? 'Opened Customer Card via scoped New and filled only approved customer fields.'
        : writeAttempt.status === 'already-exists'
          ? 'Verified an existing matching customer without creating a duplicate.'
          : 'Stopped before an unsafe write.',
      'Reopened Page 22 with a Customer No. filter for persistence proof.',
      'Captured after/reopen screenshot QA.'
    ],
    actionsNotTaken: [
      'No Vorlage anwenden / Apply Template action was clicked.',
      'No vendor was created.',
      'No item was created.',
      'No setup field was changed.',
      'No sales/purchase document or draft was created.',
      'No Preview Posting was executed.',
      'No Posting was executed.',
      'No payment was executed.',
      'No API shortcut was used.',
      'No company switch was executed.'
    ],
    setupChanged: false,
    masterDataChanged: writeAttempt.changed,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036c-010-customers-before.png',
      'playwright/projects/fibu-book5/img/target-036c-020-after-customer-attempt.png',
      'playwright/projects/fibu-book5/img/target-036c-030-after-reopen-filtered-proof.png'
    ],
    proved: persisted
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 22 Customers / Debitoren was used as the scoped page.',
          `${targetCustomer.name} is visible after reopen.`,
          'The first customer route was executed without applying a template, without creating vendor/item records and without document/preview/posting routes.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 22 Customers / Debitoren was opened and screenshot QA was captured.'
        ],
    notProved: [
      'No customer posting readiness is proven.',
      'No Customer Posting Group, Gen. Bus. Posting Group, VAT Bus. Posting Group or Payment Terms value is proven as correct.',
      'No sales document, Preview Posting, Posting, customer ledger entry or G/L entry is proven.',
      'No vendor or item route is proven by this write gate.',
      ...blockedBy
    ],
    blockedBy,
    warnings: [
      'This customer is only the first master-data persistence proof, not O2C readiness.',
      'Vorlage anwenden / Apply Template was deliberately not clicked.',
      'Posting/VAT/payment fields remain separate gated setup and master-data steps.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noVendorCreated: true,
      noItemCreated: true,
      noTemplateApplied: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      customerMasterDataChanged: writeAttempt.changed
    },
    targetCustomer,
    before,
    afterAttempt,
    afterReopen,
    writeAttempt,
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-036B showed Customer/Vendor/Item New routes open direct cards with Vorlage anwenden visible but not clicked.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Customer is the smallest accounting-relevant master-data write after the card route discovery; vendor and item remain locked.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-036D-FIRST-VENDOR-CONTROLLED-WRITE-GATE',
          status: persisted ? 'ready-next' : 'blocked',
          reason: persisted
            ? 'Vendor route can reuse the card/write/reopen discipline but needs its own field list.'
            : 'Do not create a vendor until the first customer write route is recovered.'
        },
        {
          caseId: 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE',
          status: 'needs-setup-first',
          reason: 'Item creation touches Base Unit, Item Type, inventory and product posting logic.'
        },
        {
          caseId: 'TARGET-039-FOUNDATION-BLOCKER-REVISIT',
          status: 'ready-after-current',
          reason: 'Parked Page 314, VAT matrix, inventory posting and default-dimension blockers remain relevant before first document flow.'
        },
        {
          caseId: 'TARGET-037-FIRST-PREVIEW-GATE',
          status: 'blocked',
          reason: 'Preview requires more master data and accepted setup boundaries.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'The next useful step is a similarly narrow vendor write gate; item remains later because it carries more inventory/setup impact.'
        : 'Recover the narrow customer write route before expanding master-data scope.',
      risksBeforeNextCase: [
        'Do not treat one saved customer as sales or posting readiness.',
        'Do not click Apply Template unless a nested Smart Decision explicitly approves it.',
        'Do not create vendor or item in the same case.'
      ],
      requiredPreparation: persisted
        ? ['Prepare vendor field list and safe reopen proof; keep item locked.']
        : ['Diagnose customer field/save/reopen route with screenshot QA.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036C-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036c-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036C-result.json`,
      'playwright/projects/fibu-book5/img/target-036c-010-customers-before.png',
      'playwright/projects/fibu-book5/img/target-036c-020-after-customer-attempt.png',
      'playwright/projects/fibu-book5/img/target-036c-030-after-reopen-filtered-proof.png'
    ],
    requiresReview: !persisted,
    safeToFinalizeState: persisted,
    statePatch: persisted
      ? {
          current: {
            activeCase: nextCase,
            active_case_file: '.agent/state/cases/target-036d-first-vendor-controlled-write-gate.json',
            activeArea: 'universaarl-first-vendor-controlled-write',
            nextStep: 'Prepare TARGET-036D as the first vendor controlled write gate; do not create item records yet.'
          },
          activeCase: {
            status: 'done',
            resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036C-result.json`,
            nextCase
          },
          coverage: {
            latestTarget036CFirstCustomer: {
              caseId: CASE_ID,
              status: 'observed',
              preferredNo: targetCustomer.preferredNo,
              name: targetCustomer.name,
              resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036C-result.json`
            }
          }
        }
      : {},
    reason: persisted
      ? `${targetCustomer.preferredNo} / ${targetCustomer.name} is visible after controlled Customer write/verify and filtered reopen proof.`
      : `Controlled Customer write gate blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-036C First Customer Controlled Write Gate',
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
        ? `- Debitor ${targetCustomer.preferredNo} / ${targetCustomer.name} wurde mit eng begrenzter Feldliste angelegt oder bearbeitet.`
        : writeAttempt.status === 'already-exists'
          ? `- Debitor ${targetCustomer.preferredNo} oder ${targetCustomer.name} war bereits sichtbar; keine Dublette angelegt.`
          : '- Keine Aenderung, der Schreibweg wurde blockiert.',
      '',
      '## Grenzen',
      '',
      '- Keine Vorlage wurde angewendet.',
      '- Keine Buchungsgruppe, USt-Gruppe oder Zahlungsbedingung wurde fachlich bewiesen.',
      '- Kein Verkaufsbeleg, keine Preview und keine Buchung.',
      '- Kreditoren und Artikel bleiben eigene Gates.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(blockedBy, blockedBy.join('\n')).toHaveLength(0);
  expect(persisted, `${targetCustomer.preferredNo} / ${targetCustomer.name} must be visible after reopen.`).toBe(true);
});
