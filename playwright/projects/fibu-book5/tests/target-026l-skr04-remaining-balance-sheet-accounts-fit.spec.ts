import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-026L-SKR04-REMAINING-BALANCE-SHEET-ACCOUNTS-FIT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-026l-skr04-remaining-balance-sheet-accounts-fit';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-026L-result.json');
const CHART_OF_ACCOUNTS_PAGE_ID = 16;

let account = {
  no: '3300',
  name: 'Verbindlichkeiten aus Lieferungen und Leistungen',
  incomeBalance: 'Balance Sheet',
  purpose: 'SKR04-Kreditoren-/Verbindlichkeitenkonto fuer spaetere Vendor Posting Groups'
};

const targetAccounts = [
  {
    no: '3300',
    name: 'Verbindlichkeiten aus Lieferungen und Leistungen',
    incomeBalance: 'Balance Sheet',
    purpose: 'SKR04-Kreditoren-/Verbindlichkeitenkonto fuer spaetere Vendor Posting Groups'
  },
  {
    no: '3806',
    name: 'Umsatzsteuer 19 Prozent',
    incomeBalance: 'Balance Sheet',
    purpose: 'SKR04-Umsatzsteuerkonto fuer spaetere VAT-/USt-Strecken'
  }
];

type StepStatus = 'created' | 'already-exists' | 'blocked';

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
  return new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
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
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|L.schen\?|Apply\?|Anwenden\?/i.test(
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

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertSafeContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(/Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name/i.test(text), 'Kontenplan-Kontext muss sichtbar sein').toBe(
    true
  );
  expect(containsForbiddenDialog(text), 'Keine Buchungs-, Loesch-, Apply- oder Preview-Dialoge erlaubt').toBe(false);
}

async function openChartOfAccounts(page: Page) {
  await page.goto(buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
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
    const candidate = locator.nth(index);
    if (await candidate.isVisible({ timeout }).catch(() => false)) return candidate;
  }
  return undefined;
}

async function clickAction(frame: Frame, name: RegExp) {
  for (const role of ['button', 'menuitem'] as const) {
    const action = await firstVisible(frame.getByRole(role, { name }), 1000);
    if (action) {
      await action.click({ force: true });
      return true;
    }
  }
  const textAction = await firstVisible(frame.getByText(name), 1000);
  if (textAction) {
    await textAction.click({ force: true });
    return true;
  }
  return false;
}

async function editableTextboxes(scope: Frame | Locator) {
  const candidates: Locator[] = [];
  const textboxes = scope.locator('input[role="textbox"], textarea[role="textbox"]');
  const count = await textboxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = textboxes.nth(index);
    if (!(await box.isVisible({ timeout: 300 }).catch(() => false))) continue;
    if ((await box.isDisabled({ timeout: 300 }).catch(() => false)) || (await box.isEditable({ timeout: 300 }).catch(() => false)) === false) {
      continue;
    }
    candidates.push(box);
  }
  return candidates;
}

async function pageKeyboardInsert(page: Page, value: string) {
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(value);
}

async function fillFirstEmptyNoNamePair(page: Page, frame: Frame, no: string, name: string) {
  const forms = frame.getByRole('form');
  const formCount = await forms.count().catch(() => 0);
  const scopes: Array<Frame | Locator> = [frame];
  for (let index = 0; index < formCount; index += 1) scopes.unshift(forms.nth(index));

  for (const scope of scopes) {
    const rows = scope.getByRole('row');
    const rowCount = await rows.count().catch(() => 0);
    for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
      const row = rows.nth(rowIndex);
      if (!(await row.isVisible({ timeout: 300 }).catch(() => false))) continue;
      const rowBoxes = await editableTextboxes(row);
      if (rowBoxes.length < 2) continue;
      const firstValue = await rowBoxes[0].inputValue({ timeout: 300 }).catch(() => '');
      if (firstValue.trim()) continue;
      await rowBoxes[0].click({ force: true });
      await rowBoxes[0].fill('');
      await pageKeyboardInsert(page, no);
      await rowBoxes[1].click({ force: true });
      await rowBoxes[1].fill('');
      await pageKeyboardInsert(page, name);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(1200);
      return true;
    }

    const boxes = await editableTextboxes(scope);
    if (boxes.length < 2) continue;
    const firstValue = await boxes[0].inputValue({ timeout: 300 }).catch(() => '');
    if (firstValue.trim()) continue;
    await boxes[0].click({ force: true });
    await boxes[0].fill('');
    await pageKeyboardInsert(page, no);
    await boxes[1].click({ force: true });
    await boxes[1].fill('');
    await pageKeyboardInsert(page, name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    return true;
  }
  return false;
}

async function rowForAccount(frame: Frame) {
  const row = frame.getByRole('row', { name: new RegExp(`${account.no}.*${account.name}`, 'i') }).first();
  if (await row.isVisible({ timeout: 900 }).catch(() => false)) return row;
  const noText = frame.getByText(literalPattern(account.no)).first();
  if (await noText.isVisible({ timeout: 900 }).catch(() => false)) {
    await noText.click({ force: true }).catch(() => undefined);
    const focusedRow = frame.locator('[role="row"]').filter({ hasText: account.no }).filter({ hasText: account.name }).first();
    if (await focusedRow.isVisible({ timeout: 900 }).catch(() => false)) return focusedRow;
  }
  return undefined;
}

async function correctIncomeBalanceToBalanceSheet(page: Page, frame: Frame) {
  const steps: Array<Record<string, unknown>> = [];
  const row = await rowForAccount(frame);
  if (!row) return { corrected: false, reason: 'Account row could not be located for GuV/Bilanz correction.', steps };

  await row.click({ force: true }).catch(() => undefined);
  const rowTextBefore = clean(await row.innerText({ timeout: 1000 }).catch(() => ''));
  steps.push({ step: 'row-before-income-balance-correction', rowTextBefore });
  if (/Bilanz|Balance Sheet/i.test(rowTextBefore)) {
    return { corrected: true, reason: 'Account row already shows Bilanz/Balance Sheet.', steps };
  }

  const incomeCell = row.getByText(/^GuV$|^Income Statement$/i).first();
  if (!(await incomeCell.isVisible({ timeout: 900 }).catch(() => false))) {
    return { corrected: false, reason: `GuV/Income Statement cell was not directly visible. Row text: ${rowTextBefore}`, steps };
  }

  await incomeCell.dblclick({ force: true }).catch(async () => incomeCell.click({ force: true }));
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.insertText('Bilanz');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1600);

  const rowTextAfter = clean(await row.innerText({ timeout: 1000 }).catch(() => ''));
  steps.push({ step: 'row-after-income-balance-correction', rowTextAfter });
  if (/Bilanz|Balance Sheet/i.test(rowTextAfter)) {
    return { corrected: true, reason: 'GuV/Bilanz was corrected to Bilanz on the visible row.', steps };
  }

  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1000);
  const rowTextAfterTab = clean(await row.innerText({ timeout: 1000 }).catch(() => ''));
  steps.push({ step: 'row-after-tab', rowTextAfterTab });
  if (/Bilanz|Balance Sheet/i.test(rowTextAfterTab)) {
    return { corrected: true, reason: 'GuV/Bilanz was corrected to Bilanz after tabbing out.', steps };
  }

  const cardCorrection = await correctIncomeBalanceOnAccountCard(page, row);
  steps.push({ step: 'card-fallback-correction', cardCorrection });
  return cardCorrection.corrected
    ? { corrected: true, reason: cardCorrection.reason, steps }
    : { corrected: false, reason: `${cardCorrection.reason}. Row text: ${rowTextAfterTab}`, steps };
}

async function correctIncomeBalanceOnAccountCard(page: Page, row: Locator) {
  const steps: Array<Record<string, unknown>> = [];
  const accountNoLink = row.getByText(literalPattern(account.no)).first();
  if (await accountNoLink.isVisible({ timeout: 900 }).catch(() => false)) {
    await accountNoLink.dblclick({ force: true }).catch(async () => accountNoLink.click({ force: true }));
  } else {
    await row.dblclick({ force: true }).catch(async () => row.click({ force: true }));
  }
  await page.waitForTimeout(1600);
  await assertSafeContext(page);

  const { frame, bodyText } = await findBcFrame(
    page,
    /G\/L Account|Sachkonto|Verbindlichkeiten aus Lieferungen und Leistungen|Umsatzsteuer 19 Prozent|GuV\/Bilanz|Income\/Balance|Bilanz|GuV/i
  );
  steps.push({ step: 'card-open-attempt', bodyText: bodyText.slice(0, 1000), url: sanitizeEvidenceUrl(page.url()) });
  if (!literalPattern(account.no).test(bodyText) && !literalPattern(account.name).test(bodyText)) {
    return { corrected: false, reason: 'Account card fallback did not show the target account.', steps };
  }

  await clickAction(frame, /^Bearbeiten$|^Edit$/i).catch(() => false);
  await page.waitForTimeout(700);
  let setResult = await setComboboxOrTextboxValue(frame, /GuV\/Bilanz|Income\/Balance/i, 'Bilanz');
  if (!setResult.changed) {
    const tabResult = await setIncomeBalanceViaNameFieldTab(page, frame);
    setResult = {
      changed: tabResult.changed,
      reason: tabResult.reason,
      inspected: [...setResult.inspected, ...tabResult.inspected]
    };
  }
  steps.push({ step: 'set-card-income-balance-field', setResult });
  if (!setResult.changed) return { corrected: false, reason: setResult.reason, steps };

  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(1200);
  await openChartOfAccounts(page);
  const text = await safeText(page);
  return new RegExp(`${account.no}[\\s\\S]{0,500}(Bilanz|Balance Sheet)`, 'i').test(text)
    ? { corrected: true, reason: 'GuV/Bilanz was corrected to Bilanz via the G/L Account Card fallback.', steps }
    : { corrected: false, reason: 'G/L Account Card fallback did not show Bilanz after reopen.', steps };
}

async function setIncomeBalanceViaNameFieldTab(page: Page, frame: Frame) {
  const inspected: Array<Record<string, string>> = [];
  const inputs = frame.locator('input[role="textbox"], input[role="combobox"], textarea[role="textbox"]');
  const count = await inputs.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const input = inputs.nth(index);
    if (!(await input.isVisible({ timeout: 300 }).catch(() => false))) continue;
    const value = (await input.inputValue({ timeout: 300 }).catch(() => '')) || '';
    const meta = {
      index: String(index),
      aria: (await input.getAttribute('aria-label').catch(() => '')) || '',
      title: (await input.getAttribute('title').catch(() => '')) || '',
      value
    };
    inspected.push(meta);
    if (!literalPattern(account.name).test(value)) continue;
    await input.click({ force: true });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
    const text = await safeText(page);
    if (new RegExp(`${account.no}[\\s\\S]{0,1500}(Bilanz|Balance Sheet)`, 'i').test(text)) {
      return { changed: true, reason: 'Tabbed from Name field to GuV/Bilanz and selected Bilanz with keyboard.', inspected };
    }
    return { changed: false, reason: 'Name-field tab route did not make Bilanz visible on the card.', inspected };
  }
  return { changed: false, reason: 'Name field input was not found for keyboard tab route.', inspected };
}

async function setComboboxOrTextboxValue(frame: Frame, label: RegExp, value: string) {
  const candidates = frame.locator('input[role="combobox"], input[role="textbox"], textarea[role="textbox"]');
  const count = await candidates.count().catch(() => 0);
  const inspected: Array<Record<string, string>> = [];
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (!(await candidate.isVisible({ timeout: 300 }).catch(() => false))) continue;
    const meta = {
      aria: (await candidate.getAttribute('aria-label').catch(() => '')) || '',
      title: (await candidate.getAttribute('title').catch(() => '')) || '',
      value: (await candidate.inputValue({ timeout: 300 }).catch(() => '')) || ''
    };
    inspected.push(meta);
    if (!label.test(`${meta.aria} ${meta.title}`)) continue;
    await candidate.click({ force: true });
    await candidate.fill('').catch(async () => {
      await frame.page().keyboard.press('Control+A').catch(() => undefined);
    });
    await frame.page().keyboard.insertText(value);
    await frame.page().keyboard.press('Enter');
    await frame.page().waitForTimeout(1200);
    return { changed: true, reason: `Set ${meta.aria || meta.title} to ${value}.`, inspected };
  }
  const exactTextCandidates = frame.getByText(new RegExp(`^${value}$`, 'i'));
  const textCount = await exactTextCandidates.count().catch(() => 0);
  for (let index = textCount - 1; index >= 0; index -= 1) {
    const candidate = exactTextCandidates.nth(index);
    if (!(await candidate.isVisible({ timeout: 300 }).catch(() => false))) continue;
    await candidate.click({ force: true });
    await frame.page().waitForTimeout(1200);
    return {
      changed: true,
      reason: `Clicked visible exact text option ${value} because no labelled input exposed ${label}.`,
      inspected
    };
  }
  return { changed: false, reason: `No editable field or exact visible option matching ${label}/${value} was found.`, inspected };
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name|Balance Sheet|Bilanz|Income Statement|GuV|3300|3806|Verbindlichkeiten aus Lieferungen und Leistungen|Umsatzsteuer 19 Prozent|Neu|New|Liste bearbeiten|Edit List/i
    ],
    maxLines: 160,
    maxLineLength: 220
  });
  const compactClean = clean(compact);
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact: compactClean,
    visible: {
      accountNo: literalPattern(account.no).test(text),
      accountName:
        new RegExp(`${account.no}[\\s\\S]{0,500}${account.name}`, 'i').test(text) ||
        new RegExp(`${account.name}[\\s\\S]{0,500}${account.no}`, 'i').test(text),
      balanceSheet: new RegExp(`${account.no}[\\s\\S]{0,500}(Bilanz|Balance Sheet)`, 'i').test(text),
      incomeStatement: new RegExp(`${account.no}[\\s\\S]{0,500}(GuV|Income Statement)`, 'i').test(text),
      editList: /Liste bearbeiten|Edit List/i.test(text),
      newAction: /\bNeu\b|\bNew\b/i.test(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compactClean || text.slice(0, 7000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    page: 'Kontenplan / Chart of Accounts',
    step,
    status: 'universaarl-controlled-setup-gate',
    visibleLearning: [
      'Der Kontenplan ist die Grundlage fuer spaetere USt-, Zahlungs-, Debitoren-, Kreditoren- und Artikelprozesse.',
      'In diesem Gate wird nur ein geplantes Basiskonto angelegt oder als bereits vorhanden nachgewiesen.',
      'USt-Setup, Stammdaten, Belege, Preview Posting und Posting bleiben ausserhalb dieses Schritts.'
    ],
    importantUi: ['Kontenplanliste', 'Neu/New', 'Liste bearbeiten/Edit List', 'Nr./No.', 'Name'],
    internallyProves:
      snapshot.visible.accountNo && snapshot.visible.accountName
        ? `${account.no} ${account.name} ist im Kontenplan sichtbar; GuV/Bilanz sichtbar: ${
            snapshot.visible.balanceSheet ? 'Bilanz' : snapshot.visible.incomeStatement ? 'GuV' : 'unklar'
          }.`
        : 'Kontenplan-Kontext und Setup-Route, aber noch kein persistierter Kontennachweis.',
    doesNotProve: [
      'Kein vollstaendiger Kontenplan.',
      'Keine steuerliche SKR04-Endgueltigkeit.',
      'Keine VAT Posting Setup Zeile.',
      'Keine Stammdaten, keine Belege, keine Preview, keine Buchung.'
    ],
    finalScreenshotStatus: 'universaarl-foundation-evidence',
    ...extra
  });
  return snapshot;
}

async function ensureAccount(page: Page): Promise<{ status: StepStatus; reason: string; steps: Array<Record<string, unknown>> }> {
  const steps: Array<Record<string, unknown>> = [];
  await openChartOfAccounts(page);
  let { frame, bodyText } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\./i);
  if (literalPattern(account.no).test(bodyText) && literalPattern(account.name).test(bodyText)) {
    const editListClicked = await clickAction(frame, /^Liste bearbeiten$|^Edit List$/i);
    steps.push({ step: 'edit-list-for-existing-account', clicked: editListClicked });
    await page.waitForTimeout(900);
    ({ frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\./i));
    const correction = await correctIncomeBalanceToBalanceSheet(page, frame);
    steps.push({ step: 'income-balance-correction-existing-account', correction });
    if (!correction.corrected) return { status: 'blocked', reason: correction.reason, steps };
    await page.keyboard.press('Control+Enter').catch(() => undefined);
    await page.waitForTimeout(1500);
    return { status: 'already-exists', reason: `${account.no} ${account.name} ist sichtbar und GuV/Bilanz ist auf Bilanz korrigiert.`, steps };
  }

  const editListClicked = await clickAction(frame, /^Liste bearbeiten$|^Edit List$/i);
  steps.push({ step: 'edit-list', clicked: editListClicked });
  await page.waitForTimeout(900);
  await assertSafeContext(page);
  ({ frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\./i));

  const newClicked = await clickAction(frame, /^(Neu|New)$/i);
  steps.push({ step: 'new', clicked: newClicked });
  if (!newClicked) return { status: 'blocked', reason: 'Neu/New auf dem Kontenplan war nicht eindeutig klickbar.', steps };
  await page.waitForTimeout(1200);
  await assertSafeContext(page);
  ({ frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name|Card|Karte/i));

  const filled = await fillFirstEmptyNoNamePair(page, frame, account.no, account.name);
  steps.push({ step: 'fill-no-name', filled });
  if (!filled) {
    steps.push({ step: 'edit-list-new-route-blocked', reason: 'No editable row was visible after Edit List + New.' });
    await openChartOfAccounts(page);
    ({ frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\./i));
    const freshNewClicked = await clickAction(frame, /^(Neu|New)$/i);
    steps.push({ step: 'fresh-new-without-edit-list', clicked: freshNewClicked });
    if (!freshNewClicked) return { status: 'blocked', reason: 'Neu/New auf dem Kontenplan war nach Route-Reset nicht eindeutig klickbar.', steps };
    await page.waitForTimeout(1600);
    await assertSafeContext(page);
    ({ frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name|Card|Karte/i));
    const filledAfterRouteReset = await fillFirstEmptyNoNamePair(page, frame, account.no, account.name);
    steps.push({ step: 'fill-no-name-after-route-reset', filled: filledAfterRouteReset });
    if (!filledAfterRouteReset) {
      return {
        status: 'blocked',
        reason: 'Keine editierbaren Nr./Name-Felder fuer das geplante Konto gefunden; Edit-List-New und frischer New-Route-Reset sind beide blockiert.',
        steps
      };
    }
  }

  const correction = await correctIncomeBalanceToBalanceSheet(page, frame);
  steps.push({ step: 'income-balance-correction-new-account', correction });
  if (!correction.corrected) return { status: 'blocked', reason: correction.reason, steps };

  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(2500);
  await openChartOfAccounts(page);
  const afterText = await safeText(page);
  if (
    literalPattern(account.no).test(afterText) &&
    literalPattern(account.name).test(afterText) &&
    new RegExp(`${account.no}[\\s\\S]{0,500}(Bilanz|Balance Sheet)`, 'i').test(afterText)
  ) {
    return { status: 'created', reason: `${account.no} ${account.name} wurde angelegt, auf Bilanz gesetzt und nach Reopen sichtbar.`, steps };
  }
  return { status: 'blocked', reason: `${account.no} ${account.name} oder Bilanz war nach Eingabe/Reopen nicht sichtbar.`, steps };
}

test('TARGET-026L creates or confirms 3300 and 3806 SKR04 balance sheet accounts', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const accountResults: Array<Record<string, unknown>> = [];
  const evidenceRefs: string[] = [];

  for (const target of targetAccounts) {
    account = target;
    await openChartOfAccounts(page);
    const before = await captureState(
      page,
      `target-026l-${target.no}-010-before-chart-of-accounts`,
      `Before controlled setup attempt for ${target.no}.`,
      { targetAccount: target }
    );
    evidenceRefs.push(
      `target-026l-${target.no}-010-before-chart-of-accounts.png`,
      `target-026l-${target.no}-010-before-chart-of-accounts.screenshot.json`,
      `target-026l-${target.no}-010-before-chart-of-accounts.snapshot.json`,
      `target-026l-${target.no}-010-before-chart-of-accounts.txt`
    );

    const accountResult = await ensureAccount(page);
    const afterAttempt = await captureState(
      page,
      `target-026l-${target.no}-020-after-account-attempt`,
      `After controlled setup attempt for ${target.no}.`,
      { targetAccount: target, accountResult }
    );
    evidenceRefs.push(
      `target-026l-${target.no}-020-after-account-attempt.png`,
      `target-026l-${target.no}-020-after-account-attempt.screenshot.json`,
      `target-026l-${target.no}-020-after-account-attempt.snapshot.json`,
      `target-026l-${target.no}-020-after-account-attempt.txt`
    );

    await openChartOfAccounts(page);
    const afterReopen = await captureState(
      page,
      `target-026l-${target.no}-030-after-reopen-proof`,
      `After reopening Chart of Accounts for ${target.no} persistence proof.`,
      { targetAccount: target, accountResult }
    );
    evidenceRefs.push(
      `target-026l-${target.no}-030-after-reopen-proof.png`,
      `target-026l-${target.no}-030-after-reopen-proof.screenshot.json`,
      `target-026l-${target.no}-030-after-reopen-proof.snapshot.json`,
      `target-026l-${target.no}-030-after-reopen-proof.txt`
    );

    const accountVisible = afterReopen.visible.accountNo && afterReopen.visible.accountName && afterReopen.visible.balanceSheet;
    accountResults.push({
      targetAccount: target,
      accountResult,
      accountVisible,
      before,
      afterAttempt,
      afterReopen,
      blockedReason: accountResult.status === 'blocked' || !accountVisible ? accountResult.reason : undefined
    });
  }

  const blockedBy = accountResults
    .filter((item) => !item.accountVisible || (item.accountResult as { status: string }).status === 'blocked')
    .map((item) => String(item.blockedReason || 'Target account was not visible as balance sheet account after reopen.'));
  const resultStatus: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const setupChangeAttempted = accountResults.some((item) => {
    const serialized = JSON.stringify(item.accountResult);
    return serialized.includes('"status":"created"') || serialized.includes('"corrected":true');
  });

  const nextStepDecisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary: 'TARGET-026K proved 1406 as a visible SKR04 balance sheet VAT receivable account with reopen proof.',
    isPlannedNextCaseStillSensible: true,
    reason: '3300 and 3806 are the remaining balance-sheet starter accounts required before explicit GuV route and later VAT/posting setup gates.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-026M-SKR04-GUV-ACCOUNTS-ROUTE',
        status: resultStatus === 'observed' ? 'ready-next' : 'needs-ui-discovery-first',
        reason:
          resultStatus === 'observed'
            ? 'Balance-sheet accounts are visible; 4400 and 5400 can now be handled with an explicit GuV/Bilanz route.'
            : 'The balance-sheet account route must be repaired before creating more accounts.'
      },
      {
        caseId: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
        status: resultStatus === 'observed' ? 'ready-after-current' : 'needs-setup-first',
        reason: 'VAT posting groups need G/L account foundation and source-backed field mapping before setup write.'
      },
      {
        caseId: 'TARGET-028-CUSTOMER-VENDOR-ITEM-MASTERDATA',
        status: 'needs-setup-first',
        reason: 'Master data should wait until posting groups and VAT setup are ready.'
      },
      {
        caseId: 'TARGET-029-FIRST-SALES-PURCHASE-DRAFT-GATE',
        status: 'needs-setup-first',
        reason: 'Documents require number series, posting groups, VAT setup and master data.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase:
      resultStatus === 'observed'
        ? 'TARGET-026M-SKR04-GUV-ACCOUNTS-ROUTE'
        : 'TARGET-026L-SKR04-BALANCE-SHEET-ACCOUNT-ROUTE-RECOVERY',
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'The fastest useful follow-up is to fit 4400 and 5400 with the correct GuV account type, keeping VAT setup and posting groups locked until the accounts exist.'
        : 'More setup would be unsafe until the balance-sheet account creation route is repaired.',
    risksBeforeNextCase:
      resultStatus === 'observed'
        ? ['Income statement account types require careful GuV/Bilanz field handling; 1200 remains wrong bank path.']
        : ['Balance-sheet account route did not persist every target account.'],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Separate GuV account field handling for 4400 and 5400.']
        : ['Diagnose New/Edit List route and active editor state.']
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-controlled-setup',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    proved:
      resultStatus === 'observed'
        ? [
            `Instanz ${EXPECTED_INSTANCE} und Company ${TARGET_COMPANY} wurden per URL-Kontext kontrolliert.`,
            `Kontenplan Page ${CHART_OF_ACCOUNTS_PAGE_ID} wurde geoeffnet.`,
            '3300 Verbindlichkeiten aus Lieferungen und Leistungen ist nach Reopen als Bilanzkonto sichtbar.',
            '3806 Umsatzsteuer 19 Prozent ist nach Reopen als Bilanzkonto sichtbar.'
          ]
        : [
            `Instanz ${EXPECTED_INSTANCE} und Company ${TARGET_COMPANY} wurden per URL-Kontext kontrolliert.`,
            `Kontenplan Page ${CHART_OF_ACCOUNTS_PAGE_ID} wurde geoeffnet.`
          ],
    notProved: [
      'Kein vollstaendiger Kontenplan.',
      '4400 und 5400 GuV-Konten wurden in diesem Case bewusst nicht angelegt.',
      'Keine SKR04- oder Steuerberaterfreigabe.',
      'Keine VAT Posting Setup Zeile.',
      'Keine Stammdatenanlage.',
      'Kein Dokument, keine Preview, keine Buchung.'
    ],
    changedFiles: ['playwright/projects/fibu-book5/evidence/target-026l-skr04-remaining-balance-sheet-accounts-fit/'],
    evidenceRefs: [...evidenceRefs, 'TARGET-026L-result.json'],
    warnings: ['1200 Bank Saarland bleibt falscher Bankpfad und wurde nicht fuer Bank-/Payment-/VAT-/Posting-Prozesse genutzt.'],
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    statePatch:
      resultStatus === 'observed'
        ? {
            current: {
              activeCase: 'TARGET-026M-SKR04-GUV-ACCOUNTS-ROUTE',
              nextCase: 'TARGET-026M-SKR04-GUV-ACCOUNTS-ROUTE',
              activeCaseFile: '.agent/state/cases/target-026m-skr04-guv-accounts-route.json',
              activeArea: 'universaarl-skr04-guv-starter-accounts-fit'
            },
            lastRunSummary: {
              caseId: CASE_ID,
              summary:
                '3300 and 3806 were created or confirmed as balance sheet accounts in UNIVERSAARL-DE with reopen proof; no VAT setup, master data, preview or posting.',
              nextCase: 'TARGET-026M-SKR04-GUV-ACCOUNTS-ROUTE'
            }
          }
        : {},
    flags: {
      setupChangeAttempted,
      noVatSetupChange: true,
      noMasterData: true,
      noDocumentOrDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true,
      noBookChange: true
    },
    targetAccounts,
    accountResults,
    nextStepDecisionCard,
    reason:
      resultStatus === 'observed'
        ? '3300 and 3806 are visible as SKR04 balance sheet starter accounts after controlled setup and reopen proof.'
        : `Controlled account setup gate blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-026L SKR04 Remaining Balance Sheet Accounts Fit',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Zielkonten',
      '',
      ...accountResults.map((item) => {
        const target = item.targetAccount as { no: string; name: string };
        const accountResult = item.accountResult as { status: string; reason: string };
        return `- ${target.no} ${target.name}: ${accountResult.status} - ${accountResult.reason}`;
      }),
      '',
      '## Grenzen',
      '',
      '- Kein vollstaendiger Kontenplan.',
      '- 4400 und 5400 sind absichtlich nicht Teil dieses Bilanzkonto-Cases.',
      '- Keine VAT-/USt-Einrichtung.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Keine Buchaenderung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});