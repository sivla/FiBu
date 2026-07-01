import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-031A-RECEIVABLES-ACCOUNT-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-031a-receivables-account-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-031A-result.json');
const CHART_OF_ACCOUNTS_PAGE_ID = 16;

const account = {
  no: '1200',
  oldName: 'Bank Saarland',
  name: 'Forderungen aus Lieferungen und Leistungen',
  incomeBalance: 'Bilanz',
  accountType: 'Buchung'
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

function literalPattern(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsForbiddenDialog(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Company wechseln/i.test(
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

async function assertSafeChartContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(/Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name/i.test(text), 'Kontenplan-/Sachkonto-Kontext muss sichtbar sein').toBe(true);
  expect(containsForbiddenDialog(text), 'Keine Buchungs-, Loesch-, Apply-, Company- oder Preview-Dialoge erlaubt').toBe(false);
}

async function openChartOfAccounts(page: Page) {
  await page.goto(buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeChartContext(page);
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
    const candidate = locator.nth(index);
    if (await candidate.isVisible({ timeout }).catch(() => false)) return candidate;
  }
  return undefined;
}

async function clickAction(page: Page, frame: Frame, name: RegExp) {
  for (const scope of [frame, page]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = await firstVisible(scope.getByRole(role, { name }), 900);
      if (action) {
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(900);
        return true;
      }
    }
  }
  const textAction = await firstVisible(frame.getByText(name), 900);
  if (textAction) {
    await textAction.click({ timeout: 5000 }).catch(async () => textAction.click({ timeout: 5000, force: true }));
    await page.waitForTimeout(900);
    return true;
  }
  return false;
}

async function editableInputs(scope: Frame | Locator) {
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

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name|Balance Sheet|Bilanz|Income Statement|GuV|Kontoart|Account Type|1200|Bank Saarland|Forderungen aus Lieferungen und Leistungen|Buchung|Heading|Summe|Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List/i
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
      accountNo: literalPattern(account.no).test(text),
      targetName:
        /1200[\s\S]{0,700}Forderungen aus Lieferungen und Leistungen|Forderungen aus Lieferungen und Leistungen[\s\S]{0,700}1200/i.test(text),
      oldWrongName: /1200[\s\S]{0,700}Bank Saarland|Bank Saarland[\s\S]{0,700}1200/i.test(text),
      balanceSheet: /1200[\s\S]{0,700}(Bilanz|Balance Sheet)/i.test(text),
      accountTypePosting: /1200[\s\S]{0,900}(Buchung|Posting)/i.test(text),
      editAction: /Bearbeiten|Edit|Liste bearbeiten|Edit List/i.test(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 7000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    page: 'Kontenplan / Sachkontokarte',
    step,
    status: 'universaarl-controlled-setup-gate',
    visibleLearning: [
      'Das Forderungskonto ist ein Bilanzkonto und wird spaeter als Debitorensammelkonto verwendet.',
      'In diesem Gate wird nur Konto 1200 geprueft oder korrigiert.',
      'Debitorenbuchungsgruppen, Stammdaten, Belege, Preview Posting und Posting bleiben gesperrt.'
    ],
    importantUi: ['Nr./No. 1200', 'Name', 'GuV/Bilanz', 'Kontoart'],
    internallyProves:
      snapshot.visible.accountNo && snapshot.visible.targetName && snapshot.visible.balanceSheet && snapshot.visible.accountTypePosting
        ? 'Konto 1200 ist sichtbar als Forderungen aus Lieferungen und Leistungen, Bilanz, Kontoart Buchung.'
        : 'Konto-1200-Zustand ist sichtbar, aber noch nicht vollstaendig als Forderungskonto akzeptiert.',
    doesNotProve: [
      'Kein vollstaendiger SKR04-Kontenplan.',
      'Keine Debitorenbuchungsgruppe.',
      'Keine Buchungsmatrix.',
      'Keine Stammdaten, keine Belege, keine Preview, keine Buchung.'
    ],
    finalScreenshotStatus: 'universaarl-foundation-evidence',
    ...extra
  });
  return snapshot;
}

async function rowFor1200(frame: Frame) {
  const exact = frame.locator('[role="row"]').filter({ hasText: account.no }).first();
  if (await exact.isVisible({ timeout: 1200 }).catch(() => false)) return exact;
  const noText = frame.getByText(literalPattern(account.no)).first();
  if (await noText.isVisible({ timeout: 1200 }).catch(() => false)) {
    await noText.click({ force: true }).catch(() => undefined);
    const focused = frame.locator('[role="row"]').filter({ hasText: account.no }).first();
    if (await focused.isVisible({ timeout: 1200 }).catch(() => false)) return focused;
  }
  return undefined;
}

async function openAccountCard(page: Page, frame: Frame, steps: Step[]) {
  const row = await rowFor1200(frame);
  if (!row) return { opened: false, reason: 'Kontozeile 1200 war auf Page 16 nicht sichtbar.' };
  await row.click({ force: true }).catch(() => undefined);
  const rowText = clean(await row.innerText({ timeout: 1000 }).catch(() => ''));
  steps.push({ step: 'selected-1200-row', rowText });

  const editClicked = await clickAction(page, frame, /^Bearbeiten$|^Edit$/i);
  steps.push({ step: 'click-edit-action', editClicked });
  await page.waitForTimeout(1200);
  let text = await safeText(page);
  if (/Sachkontokarte|G\/L Account Card|G\/L Account|Sachkonto/i.test(text) && literalPattern(account.no).test(text)) {
    return { opened: true, reason: 'Sachkontokarte ueber Bearbeiten geoeffnet.' };
  }

  const noCell = row.getByText(literalPattern(account.no)).first();
  if (await noCell.isVisible({ timeout: 900 }).catch(() => false)) {
    await noCell.dblclick({ force: true }).catch(async () => noCell.click({ force: true }));
  } else {
    await row.dblclick({ force: true }).catch(async () => row.click({ force: true }));
  }
  await page.waitForTimeout(1600);
  text = await safeText(page);
  if (/Sachkontokarte|G\/L Account Card|G\/L Account|Sachkonto/i.test(text) && literalPattern(account.no).test(text)) {
    return { opened: true, reason: 'Sachkontokarte ueber Kontozeilen-Doppelklick geoeffnet.' };
  }
  return { opened: false, reason: 'Weder Bearbeiten noch Doppelklick oeffnete eine sichere Sachkontokarte fuer 1200.' };
}

async function inputMeta(input: Locator) {
  return {
    aria: (await input.getAttribute('aria-label').catch(() => '')) || '',
    title: (await input.getAttribute('title').catch(() => '')) || '',
    value: (await input.inputValue({ timeout: 300 }).catch(() => '')) || ''
  };
}

async function setInputValue(page: Page, input: Locator, value: string) {
  await input.click({ force: true });
  await input.fill('').catch(async () => {
    await page.keyboard.press('Control+A').catch(() => undefined);
  });
  await page.keyboard.insertText(value);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900);
}

async function setCardFields(page: Page, frame: Frame, steps: Step[]) {
  await clickAction(page, frame, /^Bearbeiten$|^Edit$/i).catch(() => false);
  await page.waitForTimeout(700);
  const inputs = await editableInputs(frame);
  const inspected: Step[] = [];
  for (const input of inputs) inspected.push(await inputMeta(input));
  steps.push({ step: 'card-inputs-before-correction', inspected });

  let nameChanged = false;
  let balanceChanged = false;
  let typeChanged = false;

  for (const input of inputs) {
    const meta = await inputMeta(input);
    const label = `${meta.aria} ${meta.title} ${meta.value}`;
    if (!nameChanged && (/Name/i.test(label) || literalPattern(account.oldName).test(meta.value))) {
      await setInputValue(page, input, account.name);
      nameChanged = true;
      continue;
    }
    if (!balanceChanged && /GuV\/Bilanz|Income\/Balance/i.test(label)) {
      await setInputValue(page, input, account.incomeBalance);
      balanceChanged = true;
      continue;
    }
    if (!typeChanged && /Kontoart|Account Type/i.test(label)) {
      await setInputValue(page, input, account.accountType);
      typeChanged = true;
    }
  }

  steps.push({ step: 'card-field-correction-attempt', nameChanged, balanceChanged, typeChanged });
  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(1600);
  return { nameChanged, balanceChanged, typeChanged };
}

test(CASE_ID, async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-031 blocked Customer Posting Group setup because account 1200 is visible with the wrong name. Correcting only account 1200 is the smallest safe prerequisite before Page 110 writes.',
      supportedBy: [
        'TARGET-031 read-only Chart of Accounts screenshot showing 1200 Bank Saarland',
        'TARGET-031A source correction: SKR04 receivables anchor is 1200, not a new 1400 account'
      ],
      fieldsChangedOnlyIfSafe: ['Name', 'GuV/Bilanz', 'Kontoart for G/L Account 1200 only'],
      fieldsNotTouched: [
        'Customer Posting Groups',
        'General Posting Setup',
        'Inventory Posting Setup',
        'VAT Posting Setup',
        'Bank Posting Groups',
        'Master Data',
        'Documents',
        'Preview Posting',
        'Posting'
      ],
      fallback: 'Abort and document card/input diagnostics if Page 16/17 does not expose a safe 1200 editor.'
    }
  ];
  const blockedBy: string[] = [];

  await openChartOfAccounts(page);
  const before = await captureState(page, 'target-031a-010-before-chart-of-accounts', 'Before 1200 receivables recovery.', {
    targetAccount: account
  });

  const { frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\./i);
  const openCard = await openAccountCard(page, frame, steps);
  steps.push({ step: 'open-account-card', openCard });
  if (!openCard.opened) blockedBy.push(openCard.reason);

  let cardSnapshot: unknown = null;
  let fieldAttempt = { nameChanged: false, balanceChanged: false, typeChanged: false };
  if (openCard.opened) {
    await assertSafeChartContext(page);
    const card = await findBcFrame(page, /Sachkontokarte|G\/L Account Card|G\/L Account|Sachkonto|1200|Bank Saarland|Forderungen/i);
    cardSnapshot = await captureState(page, 'target-031a-020-card-before-correction', 'G/L Account Card for 1200 before correction.', {
      openCard
    });
    fieldAttempt = await setCardFields(page, card.frame, steps);
  }

  await openChartOfAccounts(page);
  const after = await captureState(page, 'target-031a-030-after-reopen-proof', 'After reopening Chart of Accounts for 1200 proof.', {
    fieldAttempt,
    steps
  });

  const success = after.visible.accountNo && after.visible.targetName && after.visible.balanceSheet && after.visible.accountTypePosting;
  if (!success) {
    if (!after.visible.targetName) blockedBy.push('Konto 1200 ist nach Reopen nicht sichtbar als Forderungen aus Lieferungen und Leistungen.');
    if (!after.visible.balanceSheet) blockedBy.push('Konto 1200 ist nach Reopen nicht sichtbar als Bilanzkonto.');
    if (!after.visible.accountTypePosting) blockedBy.push('Konto 1200 ist nach Reopen nicht sichtbar mit Kontoart Buchung.');
  }

  const resultStatus = success ? 'observed' : 'blocked';
  const nextCase = success
    ? 'TARGET-031B-CUSTOMER-POSTING-GROUP-INLAND-WRITE-GATE'
    : 'TARGET-031A-RECEIVABLES-ACCOUNT-RECOVERY-FOLLOWUP';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-receivables-account-recovery',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Kontenplan Page 16 / Sachkontokarte Page 17',
    pageIds: [16, 17],
    url: sanitizeEvidenceUrl(page.url()),
    targetAccount: account,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Chart of Accounts Page 16 directly.',
      'Selected only account 1200.',
      openCard.opened ? 'Opened the G/L Account Card for account 1200.' : 'Stopped before field entry because account card route was not safe.',
      openCard.opened ? 'Attempted only Name, GuV/Bilanz and Kontoart correction for account 1200.' : 'No field correction attempted.',
      'Reopened Chart of Accounts for persistence proof.',
      'Captured before/card/reopen screenshot QA and result JSON.'
    ],
    actionsNotTaken: [
      'No account 1400 was created.',
      'No account 1406 was used as receivables account.',
      'No Customer Posting Group was changed.',
      'No General Posting Setup changed.',
      'No Inventory Posting Setup changed.',
      'No VAT Posting Setup changed.',
      'No Bank Posting Groups changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting executed.',
      'No Posting executed.',
      'No API shortcut used.'
    ],
    setupChanged: openCard.opened && (fieldAttempt.nameChanged || fieldAttempt.balanceChanged || fieldAttempt.typeChanged),
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-031a-010-before-chart-of-accounts.png',
      'playwright/projects/fibu-book5/img/target-031a-020-card-before-correction.png',
      'playwright/projects/fibu-book5/img/target-031a-030-after-reopen-proof.png'
    ],
    proved: success
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Only account 1200 was targeted.',
          'After reopen, account 1200 is visible as Forderungen aus Lieferungen und Leistungen.',
          'After reopen, account 1200 is visible as Bilanz and Kontoart Buchung.',
          'No account 1400, Customer Posting Group, master data, draft, Preview Posting, Posting or API shortcut was created/executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Only account 1200 was targeted.',
          'No account 1400, Customer Posting Group, master data, draft, Preview Posting, Posting or API shortcut was created/executed.'
        ],
    notProved: [
      ...(!success ? ['Account 1200 is not fully proven as Forderungen/Bilanz/Buchung after reopen.'] : []),
      'No Customer Posting Group INLAND exists or is assigned.',
      'No receivables posting readiness is proven.',
      'No General Posting Setup, VAT Posting Setup, master data, Preview Posting or ledger trace is proven.',
      'No full SKR04 chart of accounts completeness or tax advisor approval is proven.'
    ],
    blockedBy,
    warnings: [
      'Do not create account 1400 for SKR04 receivables.',
      'Do not use account 1406 as receivables account.',
      'Customer Posting Group write remains separate in TARGET-031B.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noCustomerPostingGroupChange: true,
      setupChangedOnlyAccount1200: openCard.opened && (fieldAttempt.nameChanged || fieldAttempt.balanceChanged || fieldAttempt.typeChanged)
    },
    snapshots: { before, card: cardSnapshot, after },
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-031 showed account 1200 as Bank Saarland and blocked Page 110 writes.',
      isPlannedNextCaseStillSensible: true,
      reason: success
        ? 'The 1200 prerequisite is now visibly proven after reopen; Customer Posting Group write can be planned next.'
        : 'The 1200 prerequisite remains unresolved or only partially changed; do not proceed to Page 110 writes.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-031B-CUSTOMER-POSTING-GROUP-INLAND-WRITE-GATE',
          status: success ? 'ready-next' : 'needs-setup-first',
          reason: success ? '1200 Forderungen/Bilanz/Buchung proof exists.' : 'Needs 1200 reopen proof first.'
        },
        {
          caseId: 'TARGET-032-GENERAL-POSTING-GROUPS-AND-SETUP-GATE',
          status: 'needs-source-check-first',
          reason: 'Requires General Business/Product Posting Groups and sales/purchase account mapping.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Can resume after posting-group route status is clear.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation still lacks customer posting group, general setup, VAT matrix and dimensions status.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: success
        ? 'It is now the smallest safe setup write after the receivables account proof.'
        : 'It prevents writing Customer Posting Groups against an unresolved receivables account.',
      risksBeforeNextCase: ['Do not create account 1400.', 'Do not use 1406 as receivables account.', 'Do not create master data yet.'],
      requiredPreparation: success
        ? ['Use Page 110 only for Customer Posting Group INLAND + account 1200.']
        : ['Run a narrow follow-up for the remaining 1200 field route, with screenshot QA before any Page 110 write.']
    },
    nextCase,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-031a-receivables-account-recovery/TARGET-031A-result.json',
      'playwright/projects/fibu-book5/evidence/target-031a-receivables-account-recovery/*.txt',
      'playwright/projects/fibu-book5/evidence/target-031a-receivables-account-recovery/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-031a-receivables-account-recovery/*.screenshot.json',
      'playwright/projects/fibu-book5/img/target-031a-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-031a-receivables-account-recovery/TARGET-031A-result.json',
      'playwright/projects/fibu-book5/img/target-031a-010-before-chart-of-accounts.png',
      'playwright/projects/fibu-book5/img/target-031a-020-card-before-correction.png',
      'playwright/projects/fibu-book5/img/target-031a-030-after-reopen-proof.png'
    ],
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: success
          ? '.agent/state/cases/target-031b-customer-posting-group-inland-write-gate.json'
          : '.agent/state/cases/target-031a-receivables-account-recovery.json',
        activeArea: success
          ? 'universaarl-customer-posting-group-write-gate'
          : 'universaarl-receivables-account-1200-recovery-followup',
        nextStep: success
          ? 'Run TARGET-031B to create or verify Customer Posting Group INLAND with receivables account 1200. Do not create master data or run Preview Posting.'
          : 'Run TARGET-031A follow-up to finish account 1200 Forderungen/Bilanz/Buchung proof before Customer Posting Group write.'
      },
      activeCase: {
        status: resultStatus,
        resultPath: 'playwright/projects/fibu-book5/evidence/target-031a-receivables-account-recovery/TARGET-031A-result.json',
        nextCase
      },
      coverage: {
        latestReceivablesAccountRecovery: {
          caseId: CASE_ID,
          status: resultStatus,
          accountNo: account.no,
          accountName: account.name,
          setupChanged: openCard.opened && (fieldAttempt.nameChanged || fieldAttempt.balanceChanged || fieldAttempt.typeChanged),
          accountVisibleAfterReopen: after.visible.accountNo,
          targetNameVisibleAfterReopen: after.visible.targetName,
          balanceSheetVisibleAfterReopen: after.visible.balanceSheet,
          accountTypePostingVisibleAfterReopen: after.visible.accountTypePosting,
          resultPath: 'playwright/projects/fibu-book5/evidence/target-031a-receivables-account-recovery/TARGET-031A-result.json',
          nextCase
        }
      }
    }
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      'Controlled receivables-account recovery before Customer Posting Group setup.',
      '',
      '- Targeted only account 1200.',
      '- Did not create account 1400.',
      '- Did not use 1406 as receivables account.',
      '- Did not change Customer Posting Groups.',
      '- No master data, draft, Preview Posting, Posting or API shortcut occurred.',
      `- Selected next case: ${nextCase}.`
    ].join('\n')
  );

  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(success, blockedBy.join('\n')).toBe(true);
});
