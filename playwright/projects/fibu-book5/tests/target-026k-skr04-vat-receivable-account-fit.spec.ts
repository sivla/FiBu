import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-026K-SKR04-VAT-RECEIVABLE-ACCOUNT-FIT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-026k-skr04-vat-receivable-account-fit';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-026K-result.json');
const CHART_OF_ACCOUNTS_PAGE_ID = 16;

const account = {
  no: '1406',
  name: 'Abziehbare Vorsteuer 19 Prozent',
  incomeBalance: 'Balance Sheet',
  purpose: 'SKR04-Vorsteuerkonto fuer spaetere VAT-/USt-Strecken'
};

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
      await page.waitForTimeout(1406);
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
    await page.waitForTimeout(1406);
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

  const { frame, bodyText } = await findBcFrame(page, /G\/L Account|Sachkonto|Abziehbare Vorsteuer 19 Prozent|GuV\/Bilanz|Income\/Balance|Bilanz|GuV/i);
  steps.push({ step: 'card-open-attempt', bodyText: bodyText.slice(0, 1000), url: sanitizeEvidenceUrl(page.url()) });
  if (!/Abziehbare Vorsteuer 19 Prozent|1406/i.test(bodyText)) {
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
  await page.waitForTimeout(1406);
  await openChartOfAccounts(page);
  const text = await safeText(page);
  return /1406[\s\S]{0,500}(Bilanz|Balance Sheet)/i.test(text)
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
    if (/1406[\s\S]{0,1500}(Bilanz|Balance Sheet)/i.test(text)) {
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
      /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name|Balance Sheet|Bilanz|Income Statement|GuV|1406|Abziehbare Vorsteuer 19 Prozent|Neu|New|Liste bearbeiten|Edit List/i
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
      accountName: /1406[\s\S]{0,500}Abziehbare Vorsteuer 19 Prozent|Abziehbare Vorsteuer 19 Prozent[\s\S]{0,500}1406/i.test(text),
      balanceSheet: /1406[\s\S]{0,500}(Bilanz|Balance Sheet)/i.test(text),
      incomeStatement: /1406[\s\S]{0,500}(GuV|Income Statement)/i.test(text),
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
  if (literalPattern(account.no).test(afterText) && literalPattern(account.name).test(afterText) && /1406[\s\S]{0,500}Bilanz/i.test(afterText)) {
    return { status: 'created', reason: `${account.no} ${account.name} wurde angelegt, auf Bilanz gesetzt und nach Reopen sichtbar.`, steps };
  }
  return { status: 'blocked', reason: `${account.no} ${account.name} oder Bilanz war nach Eingabe/Reopen nicht sichtbar.`, steps };
}

test('TARGET-026K creates or confirms 1406 SKR04 VAT receivable account', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await openChartOfAccounts(page);
  const before = await captureState(page, 'target-026k-010-before-chart-of-accounts', 'Before controlled setup attempt.', {
    targetAccount: account
  });

  const accountResult = await ensureAccount(page);
  const afterAttempt = await captureState(page, 'target-026k-020-after-account-attempt', 'After controlled account setup attempt.', {
    targetAccount: account,
    accountResult
  });
  await openChartOfAccounts(page);
  const afterReopen = await captureState(page, 'target-026k-030-after-reopen-proof', 'After reopening Chart of Accounts for persistence proof.', {
    targetAccount: account,
    accountResult
  });

  const accountVisible = afterReopen.visible.accountNo && afterReopen.visible.accountName && afterReopen.visible.balanceSheet;
  const resultStatus: 'observed' | 'blocked' = accountResult.status === 'blocked' || !accountVisible ? 'blocked' : 'observed';
  const blockedBy = accountResult.status === 'blocked' || !accountVisible ? [accountResult.reason] : [];
  const setupChangeAttempted =
    accountResult.status === 'created' || JSON.stringify(accountResult.steps).includes('"corrected":true');

  const nextStepDecisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary: 'TARGET-026E planned the minimal G/L account candidate structure; no account had been created yet.',
    isPlannedNextCaseStillSensible: true,
    reason: 'VAT setup and first master data need at least a controlled account setup route before further foundation work.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-026L-SKR04-REMAINING-BALANCE-SHEET-ACCOUNTS-FIT',
        status: accountVisible ? 'ready-next' : 'needs-ui-discovery-first',
        reason: accountVisible
          ? 'The 1406 VAT receivable route has reopen proof; the next balance-sheet starter accounts can reuse the same reset-New route.'
          : 'The account route must be repaired before creating more accounts.'
      },
      {
        caseId: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
        status: accountVisible ? 'ready-after-current' : 'needs-setup-first',
        reason: 'VAT posting groups still need G/L accounts and source-backed field mapping before setup write.'
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
    selectedNextCase: accountVisible
      ? 'TARGET-026L-SKR04-REMAINING-BALANCE-SHEET-ACCOUNTS-FIT'
      : 'TARGET-026K-SKR04-ACCOUNT-ROUTE-RECOVERY',
    whySelectedNextCaseIsBest: accountVisible
      ? 'The fastest useful follow-up is to fit the remaining balance-sheet starter accounts, then handle GuV accounts with an explicit GuV/Bilanz route.'
      : 'More setup would be unsafe until the account creation route is repaired.',
    risksBeforeNextCase: accountVisible ? ['Income statement account types still need careful field handling.'] : ['Route did not persist the first account.'],
    requiredPreparation: accountVisible
      ? ['Separate balance-sheet and income-statement account field handling.']
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
            `${account.no} ${account.name} ist nach dem kontrollierten Setup-Versuch und Reopen sichtbar.`,
            `${account.no} ${account.name} ist als Bilanzkonto sichtbar.`
          ]
        : [
            `Instanz ${EXPECTED_INSTANCE} und Company ${TARGET_COMPANY} wurden per URL-Kontext kontrolliert.`,
            `Kontenplan Page ${CHART_OF_ACCOUNTS_PAGE_ID} wurde geoeffnet.`
          ],
    notProved: [
      'Kein vollstaendiger Kontenplan.',
      'Keine SKR04- oder Steuerberaterfreigabe.',
      'Keine VAT Posting Setup Zeile.',
      'Keine Stammdatenanlage.',
      'Kein Dokument, keine Preview, keine Buchung.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-026k-skr04-vat-receivable-account-fit/'
    ],
    evidenceRefs: [
      'target-026k-010-before-chart-of-accounts.png',
      'target-026k-020-after-account-attempt.png',
      'target-026k-030-after-reopen-proof.png',
      'TARGET-026K-result.json'
    ],
    warnings: [],
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    statePatch:
      resultStatus === 'observed'
        ? {
            current: {
              activeCase: 'TARGET-026L-SKR04-REMAINING-BALANCE-SHEET-ACCOUNTS-FIT',
              nextCase: 'TARGET-026L-SKR04-REMAINING-BALANCE-SHEET-ACCOUNTS-FIT',
              activeArea: 'universaarl-skr04-remaining-starter-accounts-fit'
            },
            lastRunSummary: {
              caseId: CASE_ID,
              summary: `${account.no} ${account.name} was created or confirmed as balance sheet account in UNIVERSAARL-DE with reopen proof; no VAT setup, master data, preview or posting.`,
              nextCase: 'TARGET-026L-SKR04-REMAINING-BALANCE-SHEET-ACCOUNTS-FIT'
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
    targetAccount: account,
    before,
    afterAttempt,
    afterReopen,
    accountResult,
    nextStepDecisionCard,
    reason:
      resultStatus === 'observed'
        ? '1406 Abziehbare Vorsteuer 19 Prozent is visible after controlled setup and reopen proof.'
        : `Controlled account setup gate blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-026K SKR04 VAT Receivable Account Fit',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Zielkonto',
      '',
      `- ${account.no} ${account.name}: ${accountResult.status} - ${accountResult.reason}`,
      '',
      '## Grenzen',
      '',
      '- Kein vollstaendiger Kontenplan.',
      '- Screenshot-QA hat geprueft, dass das Vorsteuerkonto nicht als GuV-Konto stehen bleiben darf.',
      '- Keine VAT-/USt-Einrichtung.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Keine Buchaenderung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});

