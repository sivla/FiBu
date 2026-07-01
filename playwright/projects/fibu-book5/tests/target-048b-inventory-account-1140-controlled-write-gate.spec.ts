import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-048B-INVENTORY-ACCOUNT-1140-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-048b-inventory-account-1140-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-048B-result.json');
const CHART_OF_ACCOUNTS_PAGE_ID = 16;
const GL_ACCOUNT_CARD_PAGE_ID = 17;

const targetAccount = {
  no: '1140',
  name: 'Waren (Bestand)',
  expectedType: 'Bilanz',
  expectedAccountType: 'Buchung',
  purpose: 'SKR04-orientiertes Warenbestandskonto fuer spaetere Inventory Posting Setup Zeilen'
};

type GateStatus = 'observed' | 'blocked';

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number, filter?: string) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  if (filter) url.searchParams.set('filter', filter);
  return url.toString();
}

function cardUrl() {
  return buildPlaythruUrl(GL_ACCOUNT_CARD_PAGE_ID, `'G/L Account'.'No.' IS '${targetAccount.no}'`);
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

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function literalPattern(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
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

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (/\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|OK|Yes|Ja|Finish|New|Neu)\b/i.test(text)) {
        dialogs.push(text);
      }
    }
  }
  return dialogs;
}

async function assertTargetContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
}

async function openChart(page: Page) {
  await page.goto(buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1800);
  await assertTargetContext(page);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''));
    if (expected.test(bodyText)) return { frame, bodyText };
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
}

async function clickAction(frame: Frame, name: RegExp) {
  const candidates = [
    frame.getByRole('button', { name }).first(),
    frame.getByRole('menuitem', { name }).first(),
    frame.getByText(name).first()
  ];
  for (const action of candidates) {
    if (await action.isVisible({ timeout: 1000 }).catch(() => false)) {
      await action.hover({ timeout: 1200 }).catch(() => undefined);
      await frame.page().waitForTimeout(200).catch(() => undefined);
      await action.click({ force: true, timeout: 5000 }).catch(async () => action.click({ timeout: 5000 }));
      return true;
    }
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
    if (await box.isDisabled({ timeout: 300 }).catch(() => false)) continue;
    if ((await box.isEditable({ timeout: 300 }).catch(() => false)) === false) continue;
    candidates.push(box);
  }
  return candidates;
}

async function fillFirstEmptyNoNamePair(page: Page, frame: Frame) {
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
      await page.keyboard.insertText(targetAccount.no);
      await rowBoxes[1].click({ force: true });
      await rowBoxes[1].fill('');
      await page.keyboard.insertText(targetAccount.name);
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
    await page.keyboard.insertText(targetAccount.no);
    await boxes[1].click({ force: true });
    await boxes[1].fill('');
    await page.keyboard.insertText(targetAccount.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    return true;
  }
  return fillBlankGridRowByKeyboard(page, frame);
}

async function fillBlankGridRowByKeyboard(page: Page, frame: Frame) {
  const rows = frame.getByRole('row');
  const rowCount = await rows.count().catch(() => 0);
  const inspectedRows: Array<Record<string, unknown>> = [];
  for (let index = rowCount - 1; index >= 0; index -= 1) {
    const row = rows.nth(index);
    if (!(await row.isVisible({ timeout: 300 }).catch(() => false))) continue;
    const text = clean(await row.innerText({ timeout: 300 }).catch(() => ''));
    const box = await row.boundingBox().catch(() => null);
    inspectedRows.push({ index, text, box });
    if (!box || box.width < 250 || box.height < 16) continue;
    if (/\b(1200|1406|1800|3300|3806|4400|5400)\b/.test(text)) continue;
    await page.mouse.click(box.x + 32, box.y + Math.max(10, Math.min(box.height / 2, 18)));
    await page.waitForTimeout(300);
    await page.keyboard.insertText(targetAccount.no);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    await page.keyboard.insertText(targetAccount.name);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1400);
    const after = await safeText(page);
    if (literalPattern(targetAccount.no).test(after) && /Waren|Bestand/i.test(after)) {
      return true;
    }
  }
  await writeJson(path.join(EVIDENCE_DIR, 'target-048b-blank-grid-row-keyboard-fallback.inspection.json'), {
    inspectedRows
  });
  return false;
}

function classifyAccountText(text: string) {
  const rowSnippet = targetRowSnippet(text);
  const accountVisible = literalPattern(targetAccount.no).test(rowSnippet);
  const nameVisible = /Waren|Bestand/i.test(rowSnippet);
  const balanceSheetVisible = /Bilanz|Balance Sheet/i.test(rowSnippet);
  const incomeStatementVisible = /GuV|Income Statement/i.test(rowSnippet);
  const postingVisible = /Buchung|Posting/i.test(rowSnippet);
  return { accountVisible, nameVisible, balanceSheetVisible, incomeStatementVisible, postingVisible, rowSnippet };
}

function targetRowSnippet(text: string) {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const index = lines.findIndex((line) => literalPattern(targetAccount.no).test(line));
  if (index < 0) return '';
  if (/Waren|Bestand/i.test(lines[index])) return lines[index];
  if (/Waren|Bestand/i.test(lines[index + 1] ?? '')) return lines.slice(index, index + 2).join(' ');
  return lines.slice(index, index + 3).join(' ');
}

async function compactChartText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV\/Bilanz|Income\/Balance|Kontoart|Account Type|Buchung|Posting/i,
        /1140|Waren|Bestand|Bilanz|Balance Sheet|GuV|Income Statement/i,
        /Neu|New|Liste bearbeiten|Edit List/i
      ],
      maxLines: 220,
      maxLineLength: 260
    })
  );
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function captureState(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactChartText(page);
  const text = compact || (await safeText(page)).slice(0, 9000);
  const valueState = classifyAccountText(text);
  const payload = {
    step,
    targetAccount,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    text,
    valueState,
    ...extra
  };
  await writeText(`${prefix}.txt`, text || 'No compact text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`), payload);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    page: 'Kontenplan / Chart of Accounts',
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    step,
    targetAccount,
    status: 'inventory-account-1140-controlled-write-gate',
    importantUi: ['Nr.', 'Name', 'GuV/Bilanz', 'Kontoart', 'Neu/New', 'Liste bearbeiten/Edit List'],
    internallyProves:
      valueState.accountVisible && valueState.nameVisible
        ? `1140 ${targetAccount.name} is visible in playthru / UNIVERSAARL-DE; Bilanz visible: ${valueState.balanceSheetVisible}; Buchung visible: ${valueState.postingVisible}.`
        : 'Chart of Accounts context and 1140 setup route; target account is not yet fully proven in this capture.',
    doesNotProve: [
      'No complete SKR04 chart of accounts.',
      'No Inventory Posting Setup.',
      'No Item Posting Group.',
      'No item master data.',
      'No document draft.',
      'No Preview Posting.',
      'No Posting.'
    ],
    screenshotQaRule: 'The screenshot must show the Chart of Accounts context or the route is not accepted as proof.',
    ...extra
  });
  return payload;
}

async function rowForAccount(frame: Frame) {
  const row = frame.getByRole('row', { name: new RegExp(`${targetAccount.no}.*Waren`, 'i') }).first();
  if (await row.isVisible({ timeout: 900 }).catch(() => false)) return row;
  const fallback = frame.locator('[role="row"]').filter({ hasText: targetAccount.no }).first();
  if (await fallback.isVisible({ timeout: 900 }).catch(() => false)) return fallback;
  return undefined;
}

async function ensureBalanceSheetOnVisibleRow(page: Page, frame: Frame) {
  const steps: Array<Record<string, unknown>> = [];
  const row = await rowForAccount(frame);
  if (!row) return { corrected: false, reason: 'Account row 1140 could not be located for Bilanz/Kontoart verification.', steps };
  const rowText = clean(await row.innerText({ timeout: 1000 }).catch(() => ''));
  steps.push({ step: 'row-text-before-balance-check', rowText });
  if (/Bilanz|Balance Sheet/i.test(rowText) && /Buchung|Posting/i.test(rowText)) {
    return { corrected: true, reason: '1140 row already shows Bilanz and Buchung/Posting.', steps };
  }
  if (/GuV|Income Statement/i.test(rowText)) {
    const correction = await correctVisibleGuvCellToBilanz(page, row);
    steps.push({ step: 'correct-guv-to-bilanz-inline', correction });
    if (correction.corrected) return { corrected: true, reason: correction.reason, steps };
    const cardCorrection = await correctCardIncomeBalanceToBilanz(page);
    steps.push({ step: 'correct-guv-to-bilanz-card-fallback', cardCorrection });
    if (cardCorrection.corrected) return { corrected: true, reason: cardCorrection.reason, steps };
    return { corrected: false, reason: `${cardCorrection.reason}. Initial row text: ${rowText}`, steps };
  }
  return {
    corrected: false,
    reason: `1140 row is visible but Bilanz/Buchung is not clear enough for a write correction in this narrow case: ${rowText}`,
    steps
  };
}

async function correctVisibleGuvCellToBilanz(page: Page, row: Locator) {
  const steps: Array<Record<string, unknown>> = [];
  const guvCell = row.getByText(/^GuV$|^Income Statement$/i).first();
  if (!(await guvCell.isVisible({ timeout: 900 }).catch(() => false))) {
    return { corrected: false, reason: 'GuV cell was not directly visible inside the 1140 row.', steps };
  }
  await guvCell.dblclick({ force: true, timeout: 3000 }).catch(async () => guvCell.click({ force: true, timeout: 3000 }));
  await page.waitForTimeout(500);
  steps.push({ step: 'opened-guv-cell-editor' });

  const bilanzOption = page.getByText(/^Bilanz$|^Balance Sheet$/i).last();
  if (await bilanzOption.isVisible({ timeout: 800 }).catch(() => false)) {
    await bilanzOption.click({ force: true, timeout: 3000 });
    steps.push({ step: 'clicked-visible-bilanz-option' });
  } else {
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.insertText('Bilanz');
    await page.keyboard.press('Enter').catch(() => undefined);
    steps.push({ step: 'typed-bilanz-enter' });
  }
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1500);

  const rowTextAfter = clean(await row.innerText({ timeout: 1000 }).catch(() => ''));
  steps.push({ step: 'row-text-after-bilanz-correction', rowTextAfter });
  if (/Bilanz|Balance Sheet/i.test(rowTextAfter) && /Buchung|Posting/i.test(rowTextAfter) && !/GuV|Income Statement/i.test(rowTextAfter)) {
    return { corrected: true, reason: '1140 GuV/Bilanz was corrected inline to Bilanz/Buchung.', steps };
  }

  await page.waitForTimeout(1200);
  const pageTextAfter = await safeText(page);
  const state = classifyAccountText(pageTextAfter);
  if (state.accountVisible && state.nameVisible && state.balanceSheetVisible && state.postingVisible && !state.incomeStatementVisible) {
    return { corrected: true, reason: '1140 GuV/Bilanz was corrected to Bilanz/Buchung in the visible page text.', steps };
  }
  return { corrected: false, reason: `Inline Bilanz correction did not persist visibly. Row text after: ${rowTextAfter}`, steps };
}

async function openAccountCard(page: Page) {
  await page.goto(cardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertTargetContext(page);
}

async function clickEditAction(page: Page) {
  const candidates = [
    page.getByTitle(/^Bearbeiten$|^Edit$/i).first(),
    page.getByRole('button', { name: /^Bearbeiten$|^Edit$/i }).first(),
    page.getByRole('button', { name: /Bearbeiten|Edit/i }).first()
  ];
  for (const locator of candidates) {
    if (await locator.isVisible({ timeout: 900 }).catch(() => false)) {
      await locator.click({ timeout: 3000 }).catch(async () => locator.click({ timeout: 3000, force: true }));
      await page.waitForTimeout(1200);
      return { clicked: true, method: 'button' };
    }
  }
  await page.mouse.click(1108, 80);
  await page.waitForTimeout(1200);
  return { clicked: true, method: 'coordinate-pencil-fallback-from-card-route' };
}

async function locateIncomeBalancePoint(page: Page) {
  const pageLabel = page.getByText(/^GuV\/Bilanz$|^Income\/Balance$/i).first();
  const pageLabelBox = await pageLabel.boundingBox({ timeout: 1200 }).catch(() => null);
  if (pageLabelBox) {
    return {
      x: pageLabelBox.x + 250,
      y: pageLabelBox.y + Math.round(pageLabelBox.height / 2),
      source: 'page-label-right-offset',
      label: pageLabelBox,
      candidates: []
    };
  }
  const candidates = [];
  for (const frame of page.frames().filter((entry) => /businesscentral\.dynamics\.com/i.test(entry.url()))) {
    const entries = await frame
      .evaluate(() => {
        const norm = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(document.querySelectorAll<HTMLElement>('label,span,div,input,button,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              text: norm(element.innerText || element.textContent),
              aria: norm(element.getAttribute('aria-label')),
              title: norm(element.getAttribute('title')),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter((entry) => /GuV\/Bilanz|Income\/Balance|GuV|Bilanz|Balance Sheet|Income Statement/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
          .slice(0, 160);
      })
      .catch(() => []);
    candidates.push(...entries);
  }
  const label = candidates
    .filter((entry) => /GuV\/Bilanz|Income\/Balance/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
    .filter((entry) => entry.width < 280 && entry.height < 70 && entry.x > 120 && entry.y > 150)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (label) return { x: label.x + 330, y: label.y + Math.round(label.height / 2), source: 'label-right-offset', label, candidates };
  const value = candidates
    .filter((entry) => /^(GuV|Income Statement)$/.test(entry.text))
    .filter((entry) => entry.x > 250 && entry.y > 150)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (value) return { x: value.x + Math.round(value.width / 2), y: value.y + Math.round(value.height / 2), source: 'exact-guv-value', value, candidates };
  return { x: 635, y: 408, source: 'fallback-card-coordinate', candidates };
}

async function correctCardIncomeBalanceToBilanz(page: Page) {
  const steps: Array<Record<string, unknown>> = [];
  await openAccountCard(page);
  steps.push({ step: 'open-card', url: sanitizeEvidenceUrl(page.url()) });
  await screenshotWithMetadata(page, 'target-048b-025-card-before-correction.png', {
    page: 'Sachkontokarte / G/L Account Card',
    pageId: GL_ACCOUNT_CARD_PAGE_ID,
    step: 'Card fallback before GuV/Bilanz correction',
    targetAccount,
    status: 'card-correction-diagnostic',
    importantUi: ['Bearbeiten/Edit', 'GuV/Bilanz', 'Kontoart'],
    internallyProves: 'Visible card context before correcting 1140 GuV/Bilanz.',
    doesNotProve: ['No successful correction by itself', 'No Inventory Posting Setup', 'No posting']
  });
  const before = classifyAccountText(await safeText(page));
  steps.push({ step: 'card-before', before });
  if (before.accountVisible && before.nameVisible && before.balanceSheetVisible && before.postingVisible && !before.incomeStatementVisible) {
    await openChart(page);
    return { corrected: true, reason: '1140 is already Bilanz/Buchung on the account card.', steps };
  }

  const edit = await clickEditAction(page);
  steps.push({ step: 'enter-edit-mode', edit });
  await screenshotWithMetadata(page, 'target-048b-026-card-after-edit-attempt.png', {
    page: 'Sachkontokarte / G/L Account Card',
    pageId: GL_ACCOUNT_CARD_PAGE_ID,
    step: 'Card fallback after edit attempt',
    targetAccount,
    status: 'card-correction-diagnostic',
    importantUi: ['GuV/Bilanz', 'Kontoart', 'Edit mode'],
    internallyProves: 'Visible card context after attempting edit mode for 1140.',
    doesNotProve: ['No successful correction by itself', 'No Inventory Posting Setup', 'No posting']
  });
  if (!edit.clicked) {
    await openChart(page);
    return { corrected: false, reason: 'G/L Account Card edit action was not visible for 1140.', steps };
  }

  const point = await locateIncomeBalancePoint(page);
  steps.push({ step: 'located-income-balance-point', point: { x: point.x, y: point.y, source: point.source } });
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(500);
  await page.mouse.click(point.x + 112, point.y).catch(() => undefined);
  await page.waitForTimeout(800);
  const bilanzOption = page.getByText(/^Bilanz$|^Balance Sheet$/i).last();
  if (await bilanzOption.isVisible({ timeout: 1200 }).catch(() => false)) {
    await bilanzOption.click({ force: true, timeout: 3000 });
    steps.push({ step: 'clicked-visible-bilanz-option' });
  } else {
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.insertText('Bilanz');
    await page.keyboard.press('Enter').catch(() => undefined);
    steps.push({ step: 'typed-bilanz-enter-on-card' });
  }
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1500);
  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(1800);

  await openAccountCard(page);
  const after = classifyAccountText(await safeText(page));
  steps.push({ step: 'card-after-reopen', after });
  await openChart(page);
  const chartState = classifyAccountText(await safeText(page));
  steps.push({ step: 'chart-after-card-correction', chartState });
  if (chartState.accountVisible && chartState.nameVisible && chartState.balanceSheetVisible && chartState.postingVisible && !chartState.incomeStatementVisible) {
    return { corrected: true, reason: '1140 GuV/Bilanz was corrected to Bilanz/Buchung via the G/L Account Card.', steps };
  }
  return { corrected: false, reason: `Card correction did not produce 1140 Bilanz/Buchung. Chart snippet: ${chartState.rowSnippet}`, steps };
}

async function ensureAccount(page: Page) {
  const steps: Array<Record<string, unknown>> = [];
  await openChart(page);
  let { frame, bodyText } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\./i);

  if (literalPattern(targetAccount.no).test(bodyText) && /Waren|Bestand/i.test(bodyText)) {
    const editListClicked = await clickAction(frame, /^Liste bearbeiten$|^Edit List$/i);
    steps.push({ step: 'edit-list-for-existing-account', clicked: editListClicked });
    await page.waitForTimeout(900);
    ({ frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\./i));
    const verification = await ensureBalanceSheetOnVisibleRow(page, frame);
    steps.push({ step: 'existing-account-balance-verification', verification });
    return verification.corrected
      ? { status: 'observed' as GateStatus, reason: '1140 Waren (Bestand) was already visible as Bilanz/Buchung.', steps }
      : { status: 'blocked' as GateStatus, reason: verification.reason, steps };
  }

  const editListClicked = await clickAction(frame, /^Liste bearbeiten$|^Edit List$/i);
  steps.push({ step: 'edit-list', clicked: editListClicked });
  await page.waitForTimeout(900);
  await assertTargetContext(page);
  ({ frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\./i));

  const newClicked = await clickAction(frame, /^(Neu|New)$/i);
  steps.push({ step: 'new', clicked: newClicked });
  if (!newClicked) return { status: 'blocked' as GateStatus, reason: 'Neu/New was not unambiguously clickable on Chart of Accounts.', steps };
  await page.waitForTimeout(1200);
  await assertTargetContext(page);
  ({ frame } = await findBcFrame(page, /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name|Card|Karte/i));

  const filled = await fillFirstEmptyNoNamePair(page, frame);
  steps.push({ step: 'fill-no-name', filled });
  if (!filled) {
    return { status: 'blocked' as GateStatus, reason: 'No editable empty No./Name pair was visible after Edit List + New.', steps };
  }

  const verification = await ensureBalanceSheetOnVisibleRow(page, frame);
  steps.push({ step: 'new-account-balance-verification', verification });
  if (!verification.corrected) return { status: 'blocked' as GateStatus, reason: verification.reason, steps };

  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(2200);
  await openChart(page);
  const afterText = await safeText(page);
  const state = classifyAccountText(afterText);
  if (state.accountVisible && state.nameVisible && state.balanceSheetVisible && state.postingVisible) {
    return { status: 'observed' as GateStatus, reason: '1140 Waren (Bestand) was created and is visible as Bilanz/Buchung after reopen.', steps };
  }
  return { status: 'blocked' as GateStatus, reason: '1140 Waren (Bestand) was not visible as Bilanz/Buchung after reopen.', steps };
}

test('TARGET-048B creates or verifies only 1140 Waren Bestand as inventory balance account', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await openChart(page);
  const before = await captureState(page, 'target-048b-010-before-chart-of-accounts', 'Before 1140 controlled write gate.');

  const accountResult = await ensureAccount(page);

  const afterAttempt = await captureState(page, 'target-048b-020-after-account-attempt', 'After 1140 controlled write gate attempt.', {
    accountResult
  });
  await openChart(page);
  const reopen = await captureState(page, 'target-048b-030-reopen-proof', 'After reopening Chart of Accounts for 1140 proof.', {
    accountResult
  });

  const finalState = reopen.valueState as ReturnType<typeof classifyAccountText>;
  const resultStatus: GateStatus =
    accountResult.status === 'observed' && finalState.accountVisible && finalState.nameVisible && finalState.balanceSheetVisible && finalState.postingVisible
      ? 'observed'
      : 'blocked';
  const blockedBy = resultStatus === 'observed' ? [] : [accountResult.reason || '1140 not visible as Bilanz/Buchung after reopen.'];
  const setupChanged = /created/i.test(accountResult.reason);
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-049-ITEM-POSTING-GROUP-CONTROLLED-WRITE-GATE'
      : 'TARGET-048C-INVENTORY-ACCOUNT-1140-BALANCE-SHEET-CORRECTION';

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary: 'TARGET-048 selected 1140 Waren (Bestand) as source-backed SKR04 inventory account candidate without BC write.',
    isPlannedNextCaseStillSensible: true,
    reason: 'The inventory account must be visible/reopened before Item Posting Group or Inventory Posting Setup writes.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-049-ITEM-POSTING-GROUP-CONTROLLED-WRITE-GATE',
        status: resultStatus === 'observed' ? 'ready-next' : 'needs-setup-first',
        reason: resultStatus === 'observed' ? '1140 is proven enough for the next narrow Item Posting Group gate.' : '1140 still lacks reopen proof.'
      },
      {
        caseId: 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE',
        status: resultStatus === 'observed' ? 'ready-after-current' : 'needs-setup-first',
        reason: 'Inventory Posting Setup needs both an item posting group code and visible 1140 inventory account.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C remains blocked until foundation setup and item/customer posting fields are ready.'
      },
      {
        caseId: 'TARGET-027D4-VAT-MATRIX-FIELD-CONTROL-MAPPING',
        status: 'ready-after-current',
        reason: 'VAT remains a separate blocked foundation lane and must not be mixed with inventory account setup.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'It is the next smallest setup step: create or verify the Item Posting Group before Inventory Posting Setup rows use 1140.'
        : 'Do not continue to inventory setup until the one-account proof is repaired.',
    risksBeforeNextCase:
      resultStatus === 'observed'
        ? ['Do not claim full SKR04, inventory valuation readiness or posting readiness from one account.']
        : ['Avoid repeating the same editor route without a better UI diagnosis.'],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Keep Inventory Posting Setup, items, documents, Preview Posting and Posting locked until their own cases.']
        : ['Review screenshots and BC row/editor state for 1140.']
  };

  const evidenceRefs = [
    'TARGET-048B-result.json',
    'README.md',
    'target-048b-025-card-before-correction.png',
    'target-048b-025-card-before-correction.screenshot.json',
    'target-048b-026-card-after-edit-attempt.png',
    'target-048b-026-card-after-edit-attempt.screenshot.json',
    'target-048b-010-before-chart-of-accounts.png',
    'target-048b-010-before-chart-of-accounts.screenshot.json',
    'target-048b-010-before-chart-of-accounts.snapshot.json',
    'target-048b-010-before-chart-of-accounts.txt',
    'target-048b-020-after-account-attempt.png',
    'target-048b-020-after-account-attempt.screenshot.json',
    'target-048b-020-after-account-attempt.snapshot.json',
    'target-048b-020-after-account-attempt.txt',
    'target-048b-030-reopen-proof.png',
    'target-048b-030-reopen-proof.screenshot.json',
    'target-048b-030-reopen-proof.snapshot.json',
    'target-048b-030-reopen-proof.txt'
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-setup-write',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'Kontenplan / Chart of Accounts',
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Chart of Accounts Page 16.',
      'Checked account 1140 before the write gate.',
      'Created or verified only account 1140 Waren (Bestand).',
      'Captured before, after-attempt and reopen screenshots.'
    ],
    actionsNotTaken: [
      'No other G/L account was intentionally changed.',
      'No VAT setup.',
      'No posting groups.',
      'No Item Posting Group.',
      'No Inventory Posting Setup.',
      'No item master data.',
      'No document draft.',
      'No Preview Posting.',
      'No Posting.',
      'No API shortcut.'
    ],
    setupChanged,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved:
      resultStatus === 'observed'
        ? [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            'Account 1140 Waren (Bestand) is visible after reopen.',
            'Account 1140 is visible as Bilanz and Buchung/Posting in the captured chart context.',
            'No VAT setup, posting groups, item posting group, inventory posting setup, item, document, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [`Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`, 'The 1140 route stopped before wider inventory setup.'],
    notProved: [
      'No complete SKR04 chart of accounts.',
      'No tax advisor approval.',
      'No Inventory Posting Setup row.',
      'No Item Posting Group.',
      'No item master data.',
      'No inventory valuation posting.',
      'No document, Preview Posting or Posting.',
      'No German compliance final claim.'
    ],
    changedFiles: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/`],
    screenshots: [
      'target-048b-010-before-chart-of-accounts.png',
      'target-048b-025-card-before-correction.png',
      'target-048b-026-card-after-edit-attempt.png',
      'target-048b-020-after-account-attempt.png',
      'target-048b-030-reopen-proof.png'
    ],
    evidenceRefs,
    warnings: ['1140 is a source-backed starter account candidate, not proof of full inventory valuation readiness.'],
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    flags: {
      setupChangeAttempted: true,
      setupChanged,
      noVatSetupChange: true,
      noPostingGroupChange: true,
      noItemPostingGroupChange: true,
      noInventoryPostingSetupChange: true,
      noMasterData: true,
      noDocumentOrDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true,
      noBookChange: true,
      noCompanySwitch: true
    },
    before,
    afterAttempt,
    reopen,
    accountResult,
    nextStepDecision,
    nextCase,
    reason:
      resultStatus === 'observed'
        ? '1140 Waren (Bestand) is visible as Bilanz/Buchung after controlled setup and reopen proof.'
        : `1140 controlled write gate blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-048B Inventory Account 1140 Controlled Write Gate',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Smart Decision',
      '',
      'TARGET-048 hat 1140 Waren (Bestand) als source-backed Kandidat fuer das spaetere Inventory Posting Setup ausgewaehlt. In diesem Lauf durfte deshalb nur dieses eine Sachkonto geprueft oder angelegt werden.',
      '',
      '## Grenzen',
      '',
      '- Kein vollstaendiger SKR04-Kontenplan.',
      '- Keine Steuerberaterfreigabe.',
      '- Keine Item Posting Group.',
      '- Keine Inventory Posting Setup Zeile.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Kein API Shortcut.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
  if (resultStatus === 'blocked') expect(blockedBy.length).toBeGreaterThan(0);
});
