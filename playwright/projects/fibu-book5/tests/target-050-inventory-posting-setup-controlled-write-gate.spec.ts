import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-050-inventory-posting-setup-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-050-result.json');
const INVENTORY_POSTING_SETUP_PAGE_ID = 5826;

const targetSetup = {
  locationCode: 'SAAR-HL',
  inventoryPostingGroupCode: 'WARE',
  inventoryAccount: '1140',
  inventoryAccountName: 'Waren (Bestand)',
  purpose: 'Minimale Inventory-Posting-Setup-Zeile fuer den ersten Universaarl-Warenbestand.'
};

type CaseStatus = 'observed' | 'blocked';
type Step = Record<string, unknown>;
type CellBox = { text: string; x: number; y: number; w: number; h: number };
type ColumnAwareState = {
  targetRowFound: boolean;
  targetAccountInInventoryAccountColumn: boolean;
  targetAccountInDescriptionColumn: boolean;
  rowY?: number;
  cells: CellBox[];
  columns: {
    location?: CellBox;
    group?: CellBox;
    description?: CellBox;
    inventoryAccount?: CellBox;
    nextAfterInventoryAccount?: CellBox;
  };
  repairClick?: {
    description?: { x: number; y: number };
    inventoryAccount?: { x: number; y: number };
  };
};

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

function buildPlaythruUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(INVENTORY_POSTING_SETUP_PAGE_ID));
  return url.toString();
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
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function containsDangerousText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Ship|Invoice|Payment|Apply|Delete\?|Loeschen\?|Buchen|Artikelkarte|Debitorenkarte|Kreditorenkarte|VAT Posting Setup|MwSt.-Buchungsmatrix|General Posting Setup|Buchungsmatrix Einrichtung/i.test(
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

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (containsDangerousText(text) || /\b(OK|Yes|Ja|Finish|Delete|Post|Buchen)\b/i.test(text)) dialogs.push(text);
    }
  }
  return dialogs;
}

async function assertTargetContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `Wrong instance URL: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `Wrong company URL: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
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

function targetRowSnippet(text: string) {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const index = lines.findIndex((line) => line.includes(targetSetup.locationCode));
  if (index < 0) return '';
  return lines.slice(index, index + 8).join(' ');
}

function classifySetupText(text: string) {
  const rowSnippet = targetRowSnippet(text);
  const searchable = rowSnippet || text;
  return {
    pageContextVisible: /Lagerbuchung Einrichtung|Inventory Posting Setup|Lagerortcode|Location Code|Lagerbuchungsgruppencode|Invt\. Posting Group|Lagerkonto|Inventory Account/i.test(
      text
    ),
    targetLocationVisible: searchable.includes(targetSetup.locationCode),
    targetGroupVisible: searchable.includes(targetSetup.inventoryPostingGroupCode),
    targetAccountVisible: searchable.includes(targetSetup.inventoryAccount),
    rowSnippet,
    dangerousTextVisible: containsDangerousText(text)
  };
}

function isInsideColumn(cell: CellBox, column?: CellBox, nextColumn?: CellBox) {
  if (!column) return false;
  const start = column.x - 8;
  const end = nextColumn ? nextColumn.x - 8 : column.x + column.w + 80;
  return cell.x >= start && cell.x < end;
}

async function columnAwareSetupState(page: Page): Promise<ColumnAwareState> {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 800 }).catch(() => ''));
    if (!/Lagerbuchung Einrichtung|Inventory Posting Setup|Lagerortcode|Location Code|Lagerkonto|Inventory Account/i.test(bodyText)) continue;

    const rawCells = await frame
      .locator('[role="columnheader"], [role="gridcell"], a, input, button')
      .evaluateAll((elements) =>
        elements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = (
              element.textContent ||
              element.getAttribute('aria-label') ||
              element.getAttribute('title') ||
              element.getAttribute('value') ||
              ''
            )
              .replace(/\s+/g, ' ')
              .trim();
            return {
              text,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            };
          })
          .filter((cell) => cell.text && cell.y > 100 && cell.y < 420 && cell.x < 1400)
      );

    const cells = rawCells as CellBox[];
    const headers = cells.filter((cell) => cell.y < 170);
    const columns = {
      location: headers.find((cell) => /^Lagerortcode$|^Location Code$/i.test(cell.text)),
      group: headers.find((cell) => /Lagerbuchungsgruppencode|Invt\. Posting Group/i.test(cell.text)),
      description: headers.find((cell) => /^Beschreibung$|^Description$/i.test(cell.text)),
      inventoryAccount: headers.find((cell) => /^Lagerkonto$|^Inventory Account$/i.test(cell.text)),
      nextAfterInventoryAccount: headers.find((cell) => /Lagerkonto \(Interim\)|Inventory Account \(Interim\)/i.test(cell.text))
    };
    const rowSignals = cells.filter((cell) => [targetSetup.locationCode, targetSetup.inventoryPostingGroupCode].includes(cell.text));
    const rowY = rowSignals.length ? Math.min(...rowSignals.map((cell) => cell.y)) : undefined;
    const rowCells = rowY === undefined ? [] : cells.filter((cell) => Math.abs(cell.y - rowY) <= 18);
    const accountCells = rowCells.filter((cell) => cell.text === targetSetup.inventoryAccount);
    const targetRowFound =
      rowCells.some((cell) => cell.text === targetSetup.locationCode) &&
      rowCells.some((cell) => cell.text === targetSetup.inventoryPostingGroupCode);
    const targetAccountInInventoryAccountColumn = accountCells.some((cell) =>
      isInsideColumn(cell, columns.inventoryAccount, columns.nextAfterInventoryAccount)
    );
    const targetAccountInDescriptionColumn = accountCells.some((cell) =>
      isInsideColumn(cell, columns.description, columns.inventoryAccount)
    );

    return {
      targetRowFound,
      targetAccountInInventoryAccountColumn,
      targetAccountInDescriptionColumn,
      rowY,
      cells: rowCells,
      columns,
      repairClick:
        targetRowFound && rowY !== undefined
          ? {
              description: columns.description ? { x: columns.description.x + 28, y: rowY + 17 } : undefined,
              inventoryAccount: columns.inventoryAccount ? { x: columns.inventoryAccount.x + 28, y: rowY + 17 } : undefined
            }
          : undefined
    };
  }

  return {
    targetRowFound: false,
    targetAccountInInventoryAccountColumn: false,
    targetAccountInDescriptionColumn: false,
    cells: [],
    columns: {}
  };
}

async function captureState(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Lagerbuchung Einrichtung|Inventory Posting Setup|Lagerortcode|Location Code|Lagerbuchungsgruppencode|Invt\. Posting Group|Lagerkonto|Inventory Account|SAAR-HL|WARE|1140|Waren|Bestand|Neu|New|Liste bearbeiten|Edit List/i
      ],
      maxLines: 240,
      maxLineLength: 260
    })
  );
  const text = compact || (await safeText(page));
  const columnAware = await columnAwareSetupState(page);
  const textVisible = classifySetupText(text);
  const visible = {
    ...textVisible,
    targetAccountVisible: columnAware.targetAccountInInventoryAccountColumn,
    targetRowFound: columnAware.targetRowFound,
    targetAccountInInventoryAccountColumn: columnAware.targetAccountInInventoryAccountColumn,
    targetAccountInDescriptionColumn: columnAware.targetAccountInDescriptionColumn
  };
  const snapshot = {
    step,
    targetSetup,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    text,
    visible,
    columnAware,
    ...extra
  };
  await writeText(`${prefix}.txt`, text || 'No compact text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    pageId: INVENTORY_POSTING_SETUP_PAGE_ID,
    page: 'Lagerbuchung Einrichtung / Inventory Posting Setup',
    step,
    targetSetup,
    importantUi: ['Lagerortcode/Location Code', 'Lagerbuchungsgruppencode/Invt. Posting Group Code', 'Lagerkonto/Inventory Account'],
    beginnerLearning: [
      'Inventory Posting Setup verbindet Lagerort, Lagerbuchungsgruppe und Sachkonto.',
      'Die Zeile legt noch keine Artikelwerte fest und bucht nichts.',
      'Erst spaetere Artikel- und Belegcases koennen zeigen, ob daraus Posten entstehen.'
    ],
    internallyProves:
      snapshot.visible.targetLocationVisible && snapshot.visible.targetGroupVisible && snapshot.visible.targetAccountVisible
        ? 'SAAR-HL + WARE + 1140 is visible on Page 5826 after reopen.'
        : 'Page 5826 context and current matrix state before or during the controlled gate.',
    doesNotProve: [
      'No item field assignment.',
      'No document draft.',
      'No Preview Posting.',
      'No Posting.',
      'No Item Ledger, Value, G/L or VAT entries.',
      'No full SKR04 or tax approval.'
    ],
    screenshotQaRule: 'Only the same visible Page 5826 row with SAAR-HL, WARE and 1140 counts. Nearby unrelated setup text does not count.',
    finalScreenshotStatus:
      snapshot.visible.targetLocationVisible && snapshot.visible.targetGroupVisible && snapshot.visible.targetAccountVisible
        ? 'universaarl-foundation-evidence'
        : 'setup-or-blocker-evidence',
    ...extra
  });
  return snapshot;
}

async function openInventoryPostingSetup(page: Page) {
  await page.goto(buildPlaythruUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
  await assertTargetContext(page);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''));
    if (expected.test(bodyText)) return { frame, bodyText };
  }
  throw new Error(`No BC frame matched ${expected}.`);
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
        await action.hover({ timeout: 1200 }).catch(() => undefined);
        await page.waitForTimeout(250);
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(1200);
        return true;
      }
    }
  }
  return false;
}

async function editableInputs(scope: Frame | Locator) {
  const boxes = scope.locator('input[role="textbox"], input[role="combobox"], textarea[role="textbox"], input:not([type])');
  const inspected = [];
  const result: Locator[] = [];
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

async function fillInventoryAccountEditor(frame: Frame, page: Page, steps: Step[]) {
  const combos = frame.locator('input[role="combobox"]');
  const count = await combos.count().catch(() => 0);
  const inspected: Array<Record<string, unknown>> = [];
  let locationY: number | undefined;
  let groupX: number | undefined;
  for (let index = 0; index < count; index += 1) {
    const combo = combos.nth(index);
    const box = await combo.boundingBox().catch(() => undefined);
    const value = (await combo.inputValue({ timeout: 300 }).catch(() => '')) || '';
    const visible = !!box && box.width > 0 && box.height > 0;
    inspected.push({
      index,
      value,
      visible,
      x: box ? Math.round(box.x) : undefined,
      y: box ? Math.round(box.y) : undefined,
      w: box ? Math.round(box.width) : undefined,
      h: box ? Math.round(box.height) : undefined
    });
    if (visible && value === targetSetup.locationCode) locationY = box.y;
    if (visible && value === targetSetup.inventoryPostingGroupCode) groupX = box.x;
  }

  const candidates: Array<{ index: number; locator: Locator; x: number; y: number }> = [];
  for (let index = 0; index < count; index += 1) {
    const combo = combos.nth(index);
    const box = await combo.boundingBox().catch(() => undefined);
    if (!box || box.width <= 0 || box.height <= 0) continue;
    const value = (await combo.inputValue({ timeout: 300 }).catch(() => '')) || '';
    if (value !== '') continue;
    if (locationY !== undefined && Math.abs(box.y - locationY) > 18) continue;
    if (groupX !== undefined && box.x <= groupX + 80) continue;
    candidates.push({ index, locator: combo, x: box.x, y: box.y });
  }

  candidates.sort((a, b) => a.x - b.x);
  const target = candidates[0];
  steps.push({
    step: 'inventory-account-editor-candidate-scan',
    inspectedComboboxes: inspected,
    selectedCandidate: target ? { index: target.index, x: Math.round(target.x), y: Math.round(target.y) } : undefined
  });
  if (!target) return false;

  await target.locator.click({ timeout: 5000 });
  await target.locator.fill(targetSetup.inventoryAccount, { timeout: 5000 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(2200);
  return true;
}

async function fillDescriptionEditorIfMisplacedAccount(frame: Frame, page: Page, steps: Step[]) {
  const fields = frame.locator('input[role="textbox"], textarea[role="textbox"]');
  const count = await fields.count().catch(() => 0);
  const inspected: Array<Record<string, unknown>> = [];
  let target: Locator | undefined;
  let targetIndex: number | undefined;
  for (let index = 0; index < count; index += 1) {
    const field = fields.nth(index);
    const box = await field.boundingBox().catch(() => undefined);
    const value = (await field.inputValue({ timeout: 300 }).catch(() => '')) || '';
    const visible = !!box && box.width > 0 && box.height > 0;
    inspected.push({
      index,
      value,
      visible,
      x: box ? Math.round(box.x) : undefined,
      y: box ? Math.round(box.y) : undefined,
      w: box ? Math.round(box.width) : undefined,
      h: box ? Math.round(box.height) : undefined
    });
    if (!target && visible && value === targetSetup.inventoryAccount) {
      target = field;
      targetIndex = index;
    }
  }

  steps.push({
    step: 'description-editor-cleanup-scan',
    inspectedTextboxes: inspected,
    selectedIndex: targetIndex
  });
  if (!target) return false;

  await target.fill('Warenbestand', { timeout: 5000 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900);
  return true;
}

async function createOrVerifySetupRow(page: Page, steps: Step[]) {
  await openInventoryPostingSetup(page);
  const beforeText = await safeText(page);
  const beforeClassified = classifySetupText(beforeText);
  const beforeColumns = await columnAwareSetupState(page);
  if (beforeColumns.targetRowFound && beforeColumns.targetAccountInInventoryAccountColumn) {
    if (beforeColumns.targetAccountInDescriptionColumn) {
      const { frame } = await findBcFrame(page, /Lagerbuchung Einrichtung|Inventory Posting Setup|Lagerortcode|Location Code|Lagerkonto|Inventory Account/i);
      const editListClicked = await clickAction(page, frame, /^Liste bearbeiten$|^Edit List$/i);
      await page.waitForTimeout(900);
      const descriptionCleaned = await fillDescriptionEditorIfMisplacedAccount(frame, page, steps);
      steps.push({
        step: 'cleanup-existing-row-description',
        reason: 'Lagerkonto was already correct, but Beschreibung still contained the misplaced account value from the earlier route.',
        editListClicked,
        descriptionCleaned,
        beforeColumns
      });
      return {
        changed: descriptionCleaned,
        status: 'cleaned-existing-row-description' as const,
        reason: 'Cleaned Beschreibung after confirming 1140 was already in the Lagerkonto column.',
        descriptionCleaned,
        beforeClassified,
        beforeColumns
      };
    }
    return {
      changed: false,
      status: 'already-exists' as const,
      reason: 'SAAR-HL + WARE + 1140 already visible before write gate in the Lagerkonto column.',
      beforeClassified,
      beforeColumns
    };
  }
  if (beforeColumns.targetRowFound && beforeColumns.repairClick?.inventoryAccount) {
    const { frame } = await findBcFrame(page, /Lagerbuchung Einrichtung|Inventory Posting Setup|Lagerortcode|Location Code|Lagerkonto|Inventory Account/i);
    const editListClicked = await clickAction(page, frame, /^Liste bearbeiten$|^Edit List$/i);
    await page.waitForTimeout(900);
    steps.push({
      step: 'repair-existing-row-account-column',
      reason: beforeColumns.targetAccountInDescriptionColumn
        ? '1140 was visible in Beschreibung, not in Lagerkonto; corrected the existing row instead of creating another row.'
        : 'Target row existed but Lagerkonto was empty; corrected the existing row instead of creating another row.',
      editListClicked,
      beforeColumns
    });
    let descriptionCleaned = false;
    if (beforeColumns.targetAccountInDescriptionColumn) {
      descriptionCleaned = await fillDescriptionEditorIfMisplacedAccount(frame, page, steps);
    }
    const filledEditor = await fillInventoryAccountEditor(frame, page, steps);
    if (!filledEditor) {
      await page.mouse.dblclick(beforeColumns.repairClick.inventoryAccount.x, beforeColumns.repairClick.inventoryAccount.y);
      await page.waitForTimeout(350);
      await page.keyboard.press('F2').catch(() => undefined);
      await page.waitForTimeout(250);
      await page.keyboard.press('Control+A');
      await page.keyboard.insertText(targetSetup.inventoryAccount);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2200);
    }
    return {
      changed: true,
      status: 'repaired-existing-row-account' as const,
      reason: `Corrected ${targetSetup.inventoryAccount} into the Lagerkonto column for ${targetSetup.locationCode} + ${targetSetup.inventoryPostingGroupCode}.`,
      descriptionCleaned,
      beforeClassified,
      beforeColumns
    };
  }

  const { frame, bodyText } = await findBcFrame(page, /Lagerbuchung Einrichtung|Inventory Posting Setup|Lagerortcode|Location Code|Lagerkonto|Inventory Account/i);
  steps.push({ step: 'page-5826-before-write-context', bodySignals: classifySetupText(bodyText) });
  if (!/Lagerortcode|Location Code/i.test(bodyText) || !/Lagerbuchungsgruppencode|Invt\. Posting Group/i.test(bodyText) || !/Lagerkonto|Inventory Account/i.test(bodyText)) {
    return { changed: false, status: 'blocked' as const, reason: 'Required Page 5826 columns were not visible before write.' };
  }

  const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
  steps.push({ step: 'click-scoped-new-on-inventory-posting-setup', newClicked });
  if (!newClicked) {
    return { changed: false, status: 'blocked' as const, reason: 'Neu/New was not visible in Page 5826 context.' };
  }

  await page.waitForTimeout(1200);
  const afterNewText = await safeText(page);
  if (containsDangerousText(afterNewText)) {
    return { changed: false, status: 'blocked' as const, reason: 'Forbidden dialog or wrong setup context appeared after New.' };
  }

  const { frame: afterNewFrame } = await findBcFrame(page, /Lagerbuchung Einrichtung|Inventory Posting Setup|Lagerortcode|Location Code|Lagerkonto|Inventory Account|SAAR-HL|WARE/i);
  const { inspected } = await editableInputs(afterNewFrame);
  steps.push({ step: 'editable-inputs-after-new-inventory-posting-setup', inspected });

  await page.keyboard.insertText(targetSetup.locationCode);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await page.keyboard.insertText(targetSetup.inventoryPostingGroupCode);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await page.keyboard.insertText(targetSetup.inventoryAccount);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(2200);

  return {
    changed: true,
    status: 'attempted-create' as const,
    reason: `Attempted to create ${targetSetup.locationCode} + ${targetSetup.inventoryPostingGroupCode} + ${targetSetup.inventoryAccount} through Page 5826 list editor.`
  };
}

test('TARGET-050 creates or verifies one Inventory Posting Setup row only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const actionsTaken: string[] = [];
  const steps: Step[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openInventoryPostingSetup(page);
  actionsTaken.push('Opened Page 5826 Lagerbuchung Einrichtung / Inventory Posting Setup in playthru / UNIVERSAARL-DE.');
  const before = await captureState(page, 'target-050-010-before-inventory-posting-setup', 'before-create-or-verify');

  const writeOutcome = await createOrVerifySetupRow(page, steps);
  actionsTaken.push(`Create-or-verify route outcome: ${writeOutcome.status}.`);

  const after = await captureState(page, 'target-050-020-after-inventory-posting-setup-route', 'after-create-or-verify', { writeOutcome });

  await openInventoryPostingSetup(page);
  actionsTaken.push('Reopened Page 5826 for visible row proof.');
  const reopen = await captureState(page, 'target-050-030-reopen-proof', 'reopen-proof');

  const status: CaseStatus =
    reopen.visible.targetLocationVisible && reopen.visible.targetGroupVisible && reopen.visible.targetAccountVisible ? 'observed' : 'blocked';
  if (status === 'blocked') blockedBy.push('SAAR-HL + WARE + 1140 is not visibly proven after Page 5826 reopen.');
  if (before.visible.dangerousTextVisible || after.visible.dangerousTextVisible || reopen.visible.dangerousTextVisible) {
    blockedBy.push('Forbidden or wrong-context text was visible in screenshot QA.');
  }

  const nextCase = status === 'observed' ? 'TARGET-051-ITEM-POSTING-FIELDS-CONTROLLED-ASSIGNMENT-GATE' : 'TARGET-050B-INVENTORY-POSTING-SETUP-ROUTE-RECOVERY';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-038-O2C-PREFLIGHT',
    lastEvidenceSummary:
      status === 'observed'
        ? 'SAAR-HL + WARE + 1140 is visible on Page 5826 after reopen.'
        : 'TARGET-050 did not prove the Inventory Posting Setup row after reopen.',
    isPlannedNextCaseStillSensible: false,
    reason:
      status === 'observed'
        ? 'O2C is still too early; the next narrow step is assigning proven posting fields to the item, not a process document.'
        : 'Do not continue to item assignment or O2C until the Inventory Posting Setup row is proven.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: status === 'observed' ? 'ready-next' : 'needs-ui-discovery-first',
        reason: status === 'observed' ? 'Setup dependencies are individually and jointly proven.' : 'Page 5826 route needs recovery before another write.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C still waits for item field assignment, VAT and General Posting Setup.'
      },
      {
        caseId: 'TARGET-027D4-VAT-MATRIX-FIELD-CONTROL-MAPPING',
        status: 'ready-after-current',
        reason: 'VAT remains a separate foundation lane and must not be mixed with inventory setup.'
      },
      {
        caseId: 'TARGET-036D2G-U-VEND-MANUAL-NOS-SOURCE-OR-ASSISTED-ROUTE-DECISION',
        status: 'blocked',
        reason: 'Vendor numbering remains parked and separate.'
      }
    ],
    queueChangesMade: status === 'observed' ? ['Mark TARGET-050 done and insert TARGET-051 item posting-field assignment gate.'] : ['Keep TARGET-050 blocked or insert TARGET-050B recovery.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      status === 'observed'
        ? 'The item now has enough inventory setup dependencies to attempt a narrow field assignment later.'
        : 'A recovery case is safer than leaving a partial or unproven matrix row.',
    risksBeforeNextCase: [
      'Do not claim inventory posting readiness before item field assignment and Preview Posting.',
      'Keep VAT and General Posting Setup as separate lanes.',
      'Keep Preview Posting and Posting false.'
    ],
    requiredPreparation:
      status === 'observed'
        ? ['Create a narrow item posting-fields assignment case for U-ITEM-HW100 only after reviewing TARGET-045B field visibility.']
        : ['Recover Page 5826 field flow or document exact blocker before another write attempt.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-setup-write',
    resultStatus: status,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: {
      pageId: INVENTORY_POSTING_SETUP_PAGE_ID,
      name: 'Lagerbuchung Einrichtung / Inventory Posting Setup',
      url: sanitizeEvidenceUrl(page.url())
    },
    targetSetup,
    actionsTaken,
    actionsNotTaken: [
      'No G/L account was changed.',
      'No Item Posting Group row was changed.',
      'No Location row was changed.',
      'No item card was changed.',
      'No item was created.',
      'No VAT Posting Setup was changed.',
      'No General Posting Setup was changed.',
      'No document or draft was created.',
      'No Preview Posting was run.',
      'No Posting was run.',
      'No API shortcut was used.'
    ],
    setupChanged: writeOutcome.changed === true && status === 'observed',
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-050-010-before-inventory-posting-setup.png',
      'playwright/projects/fibu-book5/img/target-050-020-after-inventory-posting-setup-route.png',
      'playwright/projects/fibu-book5/img/target-050-030-reopen-proof.png'
    ],
    proved:
      status === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 5826 Lagerbuchung Einrichtung / Inventory Posting Setup was opened.',
            'SAAR-HL + WARE + 1140 is visible after Page 5826 reopen.',
            writeOutcome.changed ? 'A controlled UI write was attempted only for the SAAR-HL + WARE + 1140 Inventory Posting Setup row.' : 'The target row was already visible; no write was needed.',
            'No item, VAT setup, General Posting Setup, document, Preview Posting, Posting or API shortcut occurred.'
          ]
        : [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 5826 Lagerbuchung Einrichtung / Inventory Posting Setup was opened.',
            'The case stopped without item, document, Preview Posting or Posting.'
          ],
    notProved: [
      'No item card assignment is proven.',
      'No inventory posting readiness is proven.',
      'No Preview Posting is proven.',
      'No Posting is proven.',
      'No Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.',
      'No complete SKR04 chart, tax-advisor approval or legal compliance is proven.'
    ],
    blockedBy,
    warnings,
    steps,
    snapshots: { before, after, reopen },
    nextStepDecision,
    nextCase,
    statePatch:
      status === 'observed'
        ? {
            current: {
              activeArea: 'universaarl-item-posting-fields-controlled-assignment-gate',
              activeCase: nextCase,
              active_case_file: '.agent/state/cases/target-051-item-posting-fields-controlled-assignment-gate.json',
              nextCase
            },
            lastRunSummary: {
              caseId: CASE_ID,
              status,
              instance: EXPECTED_INSTANCE,
              company: TARGET_COMPANY,
              summary: 'TARGET-050 proved SAAR-HL + WARE + 1140 as Inventory Posting Setup row after Page 5826 reopen. Item assignment, Preview Posting and Posting remain locked.',
              nextCase
            },
            activeCase: {
              status: 'done',
              resultPath: 'playwright/projects/fibu-book5/evidence/target-050-inventory-posting-setup-controlled-write-gate/TARGET-050-result.json',
              completedAt: new Date().toISOString(),
              nextCase
            }
          }
        : {},
    requiresReview: status !== 'observed',
    safeToFinalizeState: status === 'observed',
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:inventory-posting-setup-write-gate',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/target-050-inventory-posting-setup-controlled-write-gate/TARGET-050-result.json',
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-050 Inventory Posting Setup Controlled Write Gate',
      '',
      `Status: ${status}`,
      '',
      'Ziel: Page 5826 `Lagerbuchung Einrichtung` in `playthru / UNIVERSAARL-DE` oeffnen und genau eine minimale Zeile `SAAR-HL + WARE + 1140` anlegen oder nachweisen.',
      '',
      'Nicht gemacht:',
      '- Keine Sachkontoaenderung.',
      '- Keine Lagerbuchungsgruppen-Aenderung.',
      '- Keine Lagerort-Aenderung.',
      '- Keine Artikelkarte.',
      '- Kein Artikel.',
      '- Keine VAT Posting Setup Aenderung.',
      '- Keine General Posting Setup Aenderung.',
      '- Kein Beleg/Draft.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Kein API Shortcut.',
      '',
      `Naechster Case: ${nextCase}`
    ].join('\n')
  );

  expect(status, blockedBy.join('\n')).toBe('observed');
});
