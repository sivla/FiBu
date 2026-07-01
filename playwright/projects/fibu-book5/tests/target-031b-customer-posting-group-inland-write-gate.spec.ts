import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-031B-CUSTOMER-POSTING-GROUP-INLAND-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-031b-customer-posting-group-inland-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-031B-result.json');
const CUSTOMER_POSTING_GROUPS_PAGE_ID = 110;

const candidate = {
  code: 'INLAND',
  description: 'Inlaendische Kunden',
  receivablesAccount: '1200',
  receivablesAccountName: 'Forderungen aus Lieferungen und Leistungen'
};

type Step = Record<string, unknown>;

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
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
  for (const key of ['page', 'company', 'profile']) {
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

function containsForbiddenDialog(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Company|Mandant wechseln/i.test(
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

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertSafeContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(/Debitorenbuchungsgruppen|Customer Posting Groups|Debitorensammelkonto|Forderungen-Konto|Receivables/i.test(text), 'Page 110 Debitorenbuchungsgruppen muss sichtbar sein').toBe(true);
  expect(containsForbiddenDialog(text), 'Keine Buchungs-, Loesch-, Apply-, Company- oder Preview-Dialoge erlaubt').toBe(false);
}

async function openCustomerPostingGroups(page: Page) {
  await page.goto(buildPlaythruUrl(CUSTOMER_POSTING_GROUPS_PAGE_ID).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
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
        await page.waitForTimeout(700);
        return true;
      }
    }
  }
  return false;
}

async function editableTextboxes(scope: Frame | Locator) {
  const boxes = scope.locator('input[role="textbox"], input[role="combobox"], textarea[role="textbox"], input:not([type])');
  const result: Locator[] = [];
  const count = await boxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = boxes.nth(index);
    if (!(await box.isVisible({ timeout: 300 }).catch(() => false))) continue;
    if (await box.isDisabled({ timeout: 300 }).catch(() => false)) continue;
    if ((await box.isEditable({ timeout: 300 }).catch(() => false)) === false) continue;
    result.push(box);
  }
  return result;
}

async function fillCardByVisibleInputs(page: Page, frame: Frame, steps: Step[]) {
  const boxes = await editableTextboxes(frame);
  const inspected = [];
  for (const box of boxes) {
    inspected.push({
      aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
      title: (await box.getAttribute('title').catch(() => '')) || '',
      role: (await box.getAttribute('role').catch(() => '')) || '',
      value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
    });
  }
  steps.push({ step: 'card-inputs-before-fill', inspected });

  if (boxes.length < 3) {
    return {
      changed: false,
      reason: `Card route expected at least three editable inputs for Code, Beschreibung and Debitorensammelkonto, found ${boxes.length}.`
    };
  }

  const values = [candidate.code, candidate.description, candidate.receivablesAccount];
  for (let index = 0; index < values.length; index += 1) {
    await boxes[index].click({ force: true });
    await boxes[index].fill('').catch(async () => {
      await page.keyboard.press('Control+A');
    });
    await page.keyboard.insertText(values[index]);
    await page.keyboard.press(index === 2 ? 'Enter' : 'Tab');
    await page.waitForTimeout(index === 2 ? 1400 : 700);
  }

  steps.push({ step: 'filled-card-inputs', values });
  return { changed: true, reason: 'Filled visible card fields as Code, Beschreibung and Debitorensammelkonto.' };
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Debitorenbuchungsgruppen|Customer Posting Groups|Code|Beschreibung|Description|Debitorensammelkonto|Forderungen-Konto|Receivables|INLAND|1200|Neu|New|Bearbeiten|Edit|Liste bearbeiten|Saved|Gespeichert/i
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
      pageContext: /Debitorenbuchungsgruppen|Customer Posting Groups/i.test(text),
      code: literalPattern(candidate.code).test(text),
      description: /Inlaendische Kunden|Inlandische Kunden/i.test(text),
      receivablesAccount: literalPattern(candidate.receivablesAccount).test(text),
      receivablesField: /Debitorensammelkonto|Forderungen-Konto|Receivables Account/i.test(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: CUSTOMER_POSTING_GROUPS_PAGE_ID,
    page: 'Debitorenbuchungsgruppen / Customer Posting Groups',
    step,
    visibleLearning: [
      'Die Seite verbindet Debitorenposten mit einem Forderungskonto.',
      'TARGET-031B darf nur die Gruppe INLAND und das Konto 1200 bearbeiten.'
    ],
    importantUi: ['Code', 'Beschreibung', 'Debitorensammelkonto'],
    internallyProves: 'Page 110 context and INLAND/1200 row state in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No vendor posting group change.',
      'No general posting setup.',
      'No VAT setup.',
      'No master data.',
      'No Preview Posting.',
      'No Posting.'
    ],
    finalScreenshotStatus: 'foundation-evidence',
    ...extra
  });
  return snapshot;
}

async function rowWithCode(frame: Frame, code: string) {
  const row = frame.getByRole('row', { name: literalPattern(code) }).first();
  if (await row.isVisible({ timeout: 900 }).catch(() => false)) return row;
  const text = frame.getByText(literalPattern(code)).first();
  if (await text.isVisible({ timeout: 900 }).catch(() => false)) {
    await text.click({ force: true }).catch(() => undefined);
    const focused = frame.locator('[role="row"]').filter({ hasText: code }).first();
    if (await focused.isVisible({ timeout: 900 }).catch(() => false)) return focused;
  }
  return undefined;
}

async function fillRowByVisibleInputs(page: Page, frame: Frame, steps: Step[]) {
  let targetRow = await rowWithCode(frame, candidate.code);
  if (!targetRow) {
    const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
    steps.push({ step: 'click-new', newClicked });
    await page.waitForTimeout(900);
    await assertSafeContext(page);
    const cardText = await safeText(page);
    if (/Debitorenbuchungsgruppen-Karte|Customer Posting Group Card|Neu - Debitorenbuchungsgruppen/i.test(cardText)) {
      return fillCardByVisibleInputs(page, frame, steps);
    }
    const rows = frame.getByRole('row');
    const rowCount = await rows.count().catch(() => 0);
    targetRow = rows.nth(Math.max(0, rowCount - 1));
    await targetRow.click({ force: true }).catch(() => undefined);
  } else {
    steps.push({ step: 'existing-INLAND-row-selected' });
    await targetRow.click({ force: true }).catch(() => undefined);
  }

  const editClicked = await clickAction(page, frame, /^Liste bearbeiten$|^Edit List$|^Bearbeiten$|^Edit$/i);
  steps.push({ step: 'edit-action', editClicked });
  await page.waitForTimeout(900);
  await assertSafeContext(page);
  targetRow = (await rowWithCode(frame, candidate.code)) ?? targetRow;

  const boxes = await editableTextboxes(targetRow);
  const beforeInputs = [];
  for (const box of boxes) {
    beforeInputs.push({
      aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
      title: (await box.getAttribute('title').catch(() => '')) || '',
      value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
    });
  }
  steps.push({ step: 'row-inputs-before-fill', beforeInputs });

  if (boxes.length < 3) {
    const allBoxes = await editableTextboxes(frame);
    const allInputs = [];
    for (const box of allBoxes.slice(0, 20)) {
      allInputs.push({
        aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
        title: (await box.getAttribute('title').catch(() => '')) || '',
        value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
      });
    }
    steps.push({ step: 'frame-inputs-for-diagnosis', allInputs });
    return { changed: false, reason: 'Fewer than three editable row inputs were visible for Code, Description and Debitorensammelkonto.' };
  }

  const values = [candidate.code, candidate.description, candidate.receivablesAccount];
  for (let index = 0; index < values.length; index += 1) {
    await boxes[index].click({ force: true });
    await boxes[index].fill('').catch(async () => {
      await page.keyboard.press('Control+A');
    });
    await page.keyboard.insertText(values[index]);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(700);
  }
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(1500);
  steps.push({ step: 'filled-visible-inputs', values });
  return { changed: true, reason: 'Filled first visible editable row inputs as Code, Description and Debitorensammelkonto.' };
}

test('TARGET-031B Customer Posting Group INLAND controlled write gate', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow: 'TARGET-031A proved account 1200 as Forderungen aus Lieferungen und Leistungen, Bilanz and Buchung. Customer Posting Group INLAND is now the smallest safe next setup dependency before master data.',
      supportedBy: [
        'TARGET-028 read-only Page 110 context',
        'TARGET-031A account 1200 reopen proof',
        'TARGET-030 Vendor Posting Group INLAND/3300 proof as same narrow setup pattern'
      ],
      fieldsChangedOnlyIfSafe: ['Code', 'Beschreibung', 'Debitorensammelkonto'],
      fieldsNotTouched: [
        'Vendor Posting Groups',
        'General Posting Setup',
        'Inventory Posting Setup',
        'VAT Posting Setup',
        'Bank Posting Groups',
        'G/L Account 1200',
        'Master Data',
        'Documents',
        'Preview Posting',
        'Posting'
      ],
      fallback: 'Abort and document editor diagnostics if Page 110 or visible row inputs are not safe.'
    }
  ];
  const blockedBy: string[] = [];

  await openCustomerPostingGroups(page);
  const before = await captureState(page, 'target-031b-010-before-customer-posting-groups', 'Before Customer Posting Group INLAND write gate.');
  const { frame } = await findBcFrame(page, /Debitorenbuchungsgruppen|Customer Posting Groups|Debitorensammelkonto|Forderungen-Konto|Receivables/i);

  const alreadyComplete =
    before.visible.code &&
    before.visible.receivablesAccount &&
    /INLAND[\s\S]{0,500}1200|1200[\s\S]{0,500}INLAND/i.test(before.compact || '');

  let writeAttempt: { changed: boolean; reason: string } = {
    changed: false,
    reason: 'INLAND/1200 was already visible before the write gate.'
  };

  if (!alreadyComplete) {
    writeAttempt = await fillRowByVisibleInputs(page, frame, steps);
    if (!writeAttempt.changed) blockedBy.push(writeAttempt.reason);
  }

  const afterAttempt = await captureState(page, 'target-031b-020-after-attempt', 'After Customer Posting Group INLAND write attempt.', {
    writeAttempt,
    steps
  });

  await openCustomerPostingGroups(page);
  const afterReopen = await captureState(page, 'target-031b-030-after-reopen', 'After reopening Page 110 for persistence proof.', {
    writeAttempt,
    steps
  });

  const persisted =
    afterReopen.visible.code &&
    afterReopen.visible.receivablesAccount &&
    /INLAND[\s\S]{0,500}1200|1200[\s\S]{0,500}INLAND/i.test(afterReopen.compact || '');

  if (!persisted) blockedBy.push('INLAND with Debitorensammelkonto 1200 is not visibly proven after reopen.');

  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted
    ? 'TARGET-032-GENERAL-POSTING-GROUPS-AND-SETUP-GATE'
    : 'TARGET-031B-CUSTOMER-POSTING-GROUP-INLAND-WRITE-GATE-FOLLOWUP';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-customer-posting-group-write-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Debitorenbuchungsgruppen / Customer Posting Groups',
    pageId: CUSTOMER_POSTING_GROUPS_PAGE_ID,
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Page 110 Debitorenbuchungsgruppen directly.',
      'Captured before screenshot QA.',
      alreadyComplete ? 'Detected INLAND/1200 as already visible.' : 'Attempted only the INLAND Customer Posting Group row write.',
      'Reopened Page 110 for persistence proof.',
      'Captured after/reopen screenshot QA.'
    ],
    actionsNotTaken: [
      'No Vendor Posting Groups changed.',
      'No General Posting Setup changed.',
      'No Inventory Posting Setup changed.',
      'No VAT Posting Setup changed.',
      'No Bank Posting Groups changed.',
      'No G/L Account 1200 changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting executed.',
      'No Posting executed.',
      'No API shortcut used.'
    ],
    setupChanged: writeAttempt.changed,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-031b-010-before-customer-posting-groups.png',
      'playwright/projects/fibu-book5/img/target-031b-020-after-attempt.png',
      'playwright/projects/fibu-book5/img/target-031b-030-after-reopen.png'
    ],
    proved: persisted
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 110 Debitorenbuchungsgruppen was used as the scoped setup page.',
          'INLAND is visible after reopen with Debitorensammelkonto 1200.',
          'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 110 Debitorenbuchungsgruppen was opened and screenshot QA was captured.',
          'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
        ],
    notProved: [
      'No General Posting Setup is proven.',
      'No Inventory Posting Setup is proven.',
      'No VAT Posting Setup is proven.',
      'No Customer, Sales Document, Preview Posting or Posting is proven.',
      'No final SKR04, tax advisor or German compliance claim is proven.',
      ...(!persisted ? ['INLAND/1200 persistence is not proven after reopen.'] : [])
    ],
    blockedBy,
    warnings: [
      'A single Customer Posting Group does not make the company posting-ready.',
      'Account 1200 is a Universaarl starter account, not a final tax-advisor-approved setup.',
      'Master data remains locked until further posting group and VAT gates pass.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noVatSetupChange: true,
      noVendorPostingGroupChange: true,
      noGeneralPostingSetupChange: true,
      noInventoryPostingSetupChange: true,
      noAccount1200Change: true
    },
    before,
    afterAttempt,
    afterReopen,
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: persisted
        ? 'TARGET-031B proved the single Customer Posting Group INLAND with account 1200 after reopen.'
        : 'TARGET-031B opened Page 110 but did not prove INLAND/1200 after reopen.',
      isPlannedNextCaseStillSensible: persisted,
      reason: persisted
        ? 'Customer and Vendor Posting Groups have the first INLAND groups; the next useful gate is General Posting Groups / General Posting Setup source and write decision.'
        : 'The Page 110 editor route needs recovery before moving to General Posting Setup.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-032-GENERAL-POSTING-GROUPS-AND-SETUP-GATE',
          status: persisted ? 'needs-source-check-first' : 'blocked',
          reason: persisted
            ? 'Requires General Business/Product Posting Groups and sales/purchase account mapping before Page 314 writes.'
            : 'Do not broaden to General Posting Setup before the customer posting group editor route is understood.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Dimensions can resume after posting-group route status is clear.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation checkpoint still needs general setup, VAT matrix and dimensions status.'
        },
        {
          caseId: 'TARGET-035-MASTER-DATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data remains locked until posting groups, VAT and dimensions are sufficient.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'It moves from specific posting groups to the broader General Posting Setup only after both sides have narrow evidence.'
        : 'It keeps the work on the actual failed Page 110 route instead of skipping a prerequisite.',
      risksBeforeNextCase: [
        'Do not create master data yet.',
        'Do not run Preview Posting or Posting.',
        'Do not claim full posting readiness from one specific posting group.'
      ],
      requiredPreparation: persisted
        ? ['Source-check General Business/Product Posting Groups and Page 314 field mapping before any write.']
        : ['Use Page Inspection, personalization or scoped editor diagnostics for Page 110 only.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-031B-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-031b-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-031B-result.json`,
      'playwright/projects/fibu-book5/img/target-031b-010-before-customer-posting-groups.png',
      'playwright/projects/fibu-book5/img/target-031b-020-after-attempt.png',
      'playwright/projects/fibu-book5/img/target-031b-030-after-reopen.png'
    ],
    requiresReview: !persisted,
    safeToFinalizeState: persisted,
    statePatch: persisted
      ? {
          current: {
            activeCase: nextCase,
            activeArea: 'universaarl-general-posting-setup-gate',
            nextStep: 'Run TARGET-032 as a source-backed General Posting Groups / General Posting Setup gate. Do not create master data, documents, Preview Posting or Posting.'
          },
          activeCase: {
            status: 'done',
            resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-031B-result.json`,
            nextCase
          },
          coverage: {
            latestCustomerPostingGroupFit: {
              caseId: CASE_ID,
              status: 'observed',
              pageId: CUSTOMER_POSTING_GROUPS_PAGE_ID,
              code: candidate.code,
              receivablesAccount: candidate.receivablesAccount,
              resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-031B-result.json`
            }
          }
        }
      : {}
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-031B Customer Posting Group INLAND',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Geaendert',
      '',
      writeAttempt.changed ? '- Versuch: INLAND mit Debitorensammelkonto 1200 auf Page 110.' : '- Keine neue Aenderung, INLAND/1200 war bereits sichtbar oder der Editor wurde blockiert.',
      '',
      '## Grenzen',
      '',
      '- Keine Buchungsmatrix.',
      '- Keine USt-Buchungsmatrix.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(blockedBy, blockedBy.join('\n')).toHaveLength(0);
  expect(persisted, 'INLAND with account 1200 must be visible after reopen.').toBe(true);
});
