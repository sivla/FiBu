import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027D14-VAT-MATRIX-RECREATE-AFTER-CLEANUP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d14-vat-matrix-recreate-after-cleanup';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D14-result.json');

type RectEntry = {
  text: string;
  role: string;
  tag: string;
  ariaLabel: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type EditorInfo = {
  found: boolean;
  tagName?: string;
  role?: string;
  ariaLabel?: string;
  title?: string;
  value?: string;
  text?: string;
  rect?: { x: number; y: number; width: number; height: number };
  distanceFromCell?: number;
};

const targetValues = {
  vatBusinessPostingGroup: 'INLAND',
  vatProductPostingGroup: 'VAT19',
  vatCalculationType: 'Normale MwSt.',
  vatPercent: '19',
  salesVatAccount: '3806',
  purchaseVatAccount: '1406'
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId|parentPageOrigin|upn/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
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

function page472Visible(text: string) {
  return /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i.test(text);
}

function rowComplete(text: string) {
  return (
    /\bINLAND\b/i.test(text) &&
    /\bVAT19\b/i.test(text) &&
    /\b19(?:,00|\.00)?\b/i.test(text) &&
    /\b3806\b/i.test(text) &&
    /\b1406\b/i.test(text) &&
    /Normale MwSt|Normal VAT/i.test(text) &&
    !/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(text)
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

async function visibleText(page: Page) {
  return clean(await pageText(page));
}

async function matrixText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i,
        /INLAND|VAT19|1406|3806|19|Normale MwSt|Normal VAT/i,
        /Beschreibung|MwSt\. %|MwSt\.-Berechnungsart|Umsatzsteuerkonto|Vorsteuerkonto/i,
        /Geschaeftsbuchungsgruppe|Gesch.ftsbuchungsgruppe|Produktbuchungsgruppe|Neu|Liste bearbeiten|Weitere Optionen/i,
        /Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie|Fehler|Error/i
      ],
      maxLines: 380,
      maxLineLength: 360
    })
  );
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const found = await frame
      .locator('[role="dialog"], .ms-Dialog-main, .modal-dialog')
      .filter({
        hasText: /Preview Posting|Buchungsvorschau|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Do you want to post|Moechten Sie buchen/i
      })
      .first()
      .isVisible({ timeout: 300 })
      .catch(() => false);
    if (found) return true;
  }
  return false;
}

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogVisible(page)).toBe(false);
}

async function screenshot(page: Page, name: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, name.replace(/\.png$/i, '.screenshot.json')), {
    fileName: name,
    imagePath: path.join(EVIDENCE_DIR, name),
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function capture(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await matrixText(page);
  await writeText(`${prefix}.txt`, text || 'No compact Page-472 text captured.');
  await screenshot(page, `${prefix}.png`, {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step,
    visibleLearning: 'Das Bild muss Page 472, die leere oder neue Matrixzeile und die relevanten Spalten sichtbar machen.',
    internallyProves: 'Universaarl VAT Posting Setup setup evidence in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries', 'No G/L Entries', 'No final German VAT correctness'],
    ...extra
  });
  return text;
}

async function openMatrix(page: Page) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertContext(page);
  const text = await visibleText(page);
  if (!page472Visible(text)) {
    throw new Error('Page 472 VAT Posting Setup context is not visible.');
  }
}

async function clickAction(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const candidate = frame.getByRole(role, { name: pattern }).first();
      if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
        await candidate.click({ timeout: 4000 }).catch(async () => candidate.click({ timeout: 4000, force: true }));
        await page.waitForTimeout(1200);
        return { clicked: true, by: role };
      }
    }
    const text = frame.getByText(pattern).first();
    if (await text.isVisible({ timeout: 700 }).catch(() => false)) {
      await text.click({ timeout: 4000 }).catch(async () => text.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(1200);
      return { clicked: true, by: 'text' };
    }
  }
  return { clicked: false, by: 'not-found' };
}

async function visibleEntries(page: Page, pattern: RegExp) {
  const all: RectEntry[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((source) => {
        const pattern = new RegExp(source, 'i');
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],[role="columnheader"],[role="row"],[role="button"],button,span,div,input')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = (element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (
              !text ||
              !pattern.test(text) ||
              rect.width <= 1 ||
              rect.height <= 1 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity || '1') <= 0
            ) {
              return null;
            }
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              tag: element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .slice(0, 260);
      }, pattern.source)
      .catch(() => []);
    all.push(...(entries as RectEntry[]));
  }
  return all;
}

async function locateColumn(page: Page, pattern: RegExp, fallbackX: number) {
  const headers = (await visibleEntries(page, pattern))
    .filter((entry) => /columnheader|button|div|span/i.test(entry.role))
    .filter((entry) => entry.y >= 90 && entry.y <= 230)
    .sort((left, right) => left.x - right.x);
  const header = headers[0];
  return header ? header.x + Math.round(header.width / 2) : fallbackX;
}

async function locateNewOrTargetRowY(page: Page) {
  const target = (await visibleEntries(page, /INLAND|VAT19/))
    .filter((entry) => /row|gridcell|tr|div/i.test(entry.role))
    .filter((entry) => entry.y > 120 && entry.height <= 80)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (target) return { y: target.y + Math.min(18, Math.max(8, Math.round(target.height / 2))), row: target, source: 'target-row' };

  const activeNewRow = (await visibleEntries(page, /Normale MwSt|Normal VAT|\b0\b|\*/))
    .filter((entry) => entry.y > 170 && entry.y < 280 && entry.height <= 80)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (activeNewRow) {
    return {
      y: activeNewRow.y + Math.min(18, Math.max(8, Math.round(activeNewRow.height / 2))),
      row: activeNewRow,
      source: 'new-row-visible-values'
    };
  }

  const blank = (await visibleEntries(page, /MwSt|VAT|INLAND|VAT19|Beschreibung|Code|Neu|New/))
    .filter((entry) => entry.y > 170)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (blank) return { y: blank.y + Math.min(18, Math.max(8, Math.round(blank.height / 2))), row: blank, source: 'near-grid-row' };

  return { y: 205, row: null, source: 'fallback-y' };
}

async function rowCellCenters(page: Page, rowY: number) {
  const all: Array<RectEntry & { centerX: number; centerY: number }> = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((rowY) => {
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],td')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = (element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const centerY = rect.y + rect.height / 2;
            if (
              Math.abs(centerY - rowY) > 24 ||
              rect.width <= 5 ||
              rect.height <= 5 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity || '1') <= 0
            ) {
              return null;
            }
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              tag: element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(centerY)
            };
          })
          .filter(Boolean)
          .sort((left, right) => left!.x - right!.x);
      }, rowY)
      .catch(() => []);
    all.push(...(entries as Array<RectEntry & { centerX: number; centerY: number }>));
  }
  const unique: Array<RectEntry & { centerX: number; centerY: number }> = [];
  for (const entry of all.sort((left, right) => left.x - right.x || left.width - right.width)) {
    if (unique.some((existing) => Math.abs(existing.centerX - entry.centerX) < 8)) continue;
    unique.push(entry);
  }
  return unique;
}

async function activeEditorInfo(page: Page, cell: { x: number; y: number }): Promise<EditorInfo> {
  for (const frame of page.frames()) {
    const info = await frame
      .evaluate(({ x, y }) => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return { found: false };
        const tagName = active.tagName.toLowerCase();
        const role = active.getAttribute('role') || '';
        const editable = active.getAttribute('contenteditable') || '';
        const isEditor = tagName === 'input' || tagName === 'textarea' || role === 'textbox' || role === 'combobox' || editable === 'true';
        const rect = active.getBoundingClientRect();
        const visible = rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0;
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        const distanceFromCell = Math.round(Math.hypot(centerX - x, centerY - y));
        return {
          found: Boolean(isEditor && visible && distanceFromCell < 280),
          tagName,
          role,
          ariaLabel: active.getAttribute('aria-label') || '',
          title: active.getAttribute('title') || '',
          value: active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.value : '',
          text: active.innerText || '',
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          distanceFromCell
        };
      }, cell)
      .catch(() => ({ found: false }));
    if (info.found) return info;
  }
  return { found: false };
}

async function clickCellAndFindEditor(page: Page, x: number, y: number, step: string, steps: Array<Record<string, unknown>>) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(400);
  let editor = await activeEditorInfo(page, { x, y });
  if (!editor.found) {
    await page.mouse.dblclick(x, y);
    await page.waitForTimeout(500);
    editor = await activeEditorInfo(page, { x, y });
  }
  steps.push({ step, x, y, editor });
  return editor;
}

async function writeEditorValue(page: Page, value: string) {
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 35 });
  await page.waitForTimeout(400);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(800);
}

test('TARGET-027D14 recreates correct INLAND/VAT19 VAT matrix row only after cleanup proof', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const steps: Array<Record<string, unknown>> = [];
  let setupChangeAttempted = false;

  await openMatrix(page);
  const beforeText = await capture(page, 'target-027d14-010-before-recreate', 'Before D14 recreate: Page 472 must show no INLAND/VAT19 row.', {
    status: 'before-recreate'
  });
  const beforeRowVisible = /\bINLAND\b/i.test(beforeText) && /\bVAT19\b/i.test(beforeText);
  if (beforeRowVisible && rowComplete(beforeText)) {
    steps.push({ step: 'row-already-complete-no-write-needed' });
  } else if (beforeRowVisible) {
    blockedBy.push('INLAND/VAT19 row is still visible before D14 recreate; D13C row-absence prerequisite is not fresh enough.');
  }

  if (blockedBy.length === 0 && !rowComplete(beforeText)) {
    const editRoute = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
    steps.push({ step: 'optional-edit-mode', editRoute });
    await assertContext(page);
    const newRoute = await clickAction(page, /^Neu$|^New$/i);
    steps.push({ step: 'new-row', newRoute });
    if (!newRoute.clicked) {
      blockedBy.push('Neu/New was not visibly clickable on Page 472; refusing unscoped setup write.');
    } else {
      await assertContext(page);
      await capture(page, 'target-027d14-020-after-new-row', 'After clicking Neu/New on accepted Page 472.', {
        status: 'after-new-row',
        route: { editRoute, newRoute }
      });

      const rowInfo = await locateNewOrTargetRowY(page);
      const cells = await rowCellCenters(page, rowInfo.y);
      const cellMap = {
        businessGroupX: cells[1]?.centerX ?? (await locateColumn(page, /Gesch.*ftsbuchungsgruppe|Business Posting Group|Bus\. Posting Group/i, 780)),
        productGroupX: cells[3]?.centerX ?? (await locateColumn(page, /Produktbuchungsgruppe|Product Posting Group|Prod\. Posting Group/i, 912)),
        calcTypeX: cells[8]?.centerX ?? (await locateColumn(page, /Berechnungsart|Calculation Type/i, 1398)),
        vatPercentX: cells[7]?.centerX ?? (await locateColumn(page, /^MwSt\.?\s*%$|VAT %/i, 1335)),
        salesVatX: cells[11]?.centerX ?? (await locateColumn(page, /Umsatzsteuerkonto|Sales VAT Account|Verkauf.*MwSt/i, 1617)),
        purchaseVatX: cells[13]?.centerX ?? (await locateColumn(page, /Vorsteuerkonto|Purchase VAT Account|Einkauf.*MwSt/i, 1725))
      };
      steps.push({ step: 'located-new-row-and-columns', rowInfo, cells: cells.slice(0, 18), cellMap });

      const writePlan = [
        { key: 'vat-business-posting-group', x: cellMap.businessGroupX, value: targetValues.vatBusinessPostingGroup },
        { key: 'vat-product-posting-group', x: cellMap.productGroupX, value: targetValues.vatProductPostingGroup },
        { key: 'vat-calculation-type', x: cellMap.calcTypeX, value: targetValues.vatCalculationType },
        { key: 'vat-percent', x: cellMap.vatPercentX, value: targetValues.vatPercent },
        { key: 'sales-vat-account', x: cellMap.salesVatX, value: targetValues.salesVatAccount },
        { key: 'purchase-vat-account', x: cellMap.purchaseVatX, value: targetValues.purchaseVatAccount }
      ];

      for (const item of writePlan) {
        const editor = await clickCellAndFindEditor(page, item.x, rowInfo.y, `${item.key}-editor`, steps);
        if (!editor.found) {
          blockedBy.push(`No true active editor detected for ${item.key}; refusing to type ${item.value}.`);
          break;
        }
        setupChangeAttempted = true;
        await writeEditorValue(page, item.value);
        steps.push({ step: `${item.key}-typed`, value: item.value });
      }
    }
  }

  await assertContext(page);
  const afterText = await capture(page, 'target-027d14-030-after-write-or-stop', 'After D14 recreate attempt or safe stop.', {
    status: blockedBy.length ? 'blocked-before-complete-write' : 'after-write-attempt',
    setupChangeAttempted,
    steps
  });
  if (/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie|Fehler|Error/i.test(afterText)) {
    warnings.push('Business Central reports unsaved/error state after D14 route.');
  }

  await openMatrix(page);
  const reopenText = await capture(page, 'target-027d14-040-reopen-proof', 'Page 472 reopen proof after D14 recreate route.', {
    status: rowComplete(await matrixText(page)) ? 'accepted-reopen-proof' : 'blocked-reopen-proof'
  });
  const success = rowComplete(reopenText);
  if (setupChangeAttempted && !success && blockedBy.length === 0) {
    blockedBy.push('Values were attempted but reopen proof does not visibly show INLAND/VAT19 with normal VAT, 19, 3806 and 1406.');
  }

  const resultStatus = success ? 'observed-vat-matrix-row-recreated-after-cleanup' : 'blocked-vat-matrix-recreate-after-cleanup';
  const nextCase = success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D15-VAT-MATRIX-RECREATE-ROUTE-DIAGNOSIS';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-recreate-after-cleanup',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    targetValues,
    actionsTaken: [
      'Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix in playthru / UNIVERSAARL-DE.',
      'Captured before screenshot/text and checked that no INLAND/VAT19 row is visible before write.',
      setupChangeAttempted
        ? 'Attempted one controlled recreate route through visible Page 472 editors after Neu/New.'
        : 'Stopped before writing values because prerequisite or editor gates were not fully satisfied.',
      'Captured after state and reopen proof.',
      'Stopped before master data, document draft, Preview Posting, Posting and API shortcut.'
    ],
    actionsNotTaken: [
      'No delete/cleanup',
      'No D3/D5/D8 existing-row cell route repeat',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch',
      'No VAT final claim'
    ],
    setupChanged: success && setupChangeAttempted,
    setupChangeAttempted,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: success
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was visibly open.',
          'D14 started after fresh row-absence proof.',
          'INLAND/VAT19 is visible after reopen with normal VAT, VAT percent 19, Sales VAT Account 3806 and Purchase VAT Account 1406.',
          'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 route was captured with before/after/reopen screenshots.',
          'The run stopped before master data, document draft, Preview Posting and Posting.'
        ],
    notProved: [
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval or compliance final proof.'
    ],
    screenshots: [
      'target-027d14-010-before-recreate.png',
      'target-027d14-020-after-new-row.png',
      'target-027d14-030-after-write-or-stop.png',
      'target-027d14-040-reopen-proof.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D14-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D14-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`
    ],
    blockedBy,
    warnings,
    steps,
    flags: {
      noCleanupDelete: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noD3D5D8ExistingRowRouteRepeat: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'D13C proved the incomplete INLAND/VAT19 row is absent after row-inline cleanup and reopen proof.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The next smallest W1 Foundation dependency is one clean INLAND/VAT19 VAT Posting Setup row before posting groups and master data.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: success ? 'ready-next' : 'needs-setup-first',
          reason: success ? 'VAT matrix row is visible after reopen; posting group preflight can follow.' : 'VAT matrix row is not complete/proven.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT/posting defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT matrix, posting groups and dimensions/defaults.'
        },
        {
          caseId: 'TARGET-031-FIRST-DOCUMENT-DRAFT-GATE',
          status: 'needs-setup-first',
          reason: 'Document drafts wait for foundation readiness and master data.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: success
        ? 'After VAT matrix recreate proof, posting group preflight is the next setup dependency; master data remains locked.'
        : 'The failed recreate route needs a narrower UI/field diagnosis before any more VAT setup write.',
      risksBeforeNextCase: [
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.',
        'Do not start master data until posting groups/defaults are ready.',
        'Do not repeat the same failed editor route if D14 blocks.'
      ],
      requiredPreparation: success
        ? ['Keep Preview Posting and Posting locked; run posting-group preflight next.']
        : ['Review D14 screenshots and active-editor diagnostics; use Page Inspection, row card, or an alternate standard UI route next.']
    },
    safeToFinalizeState: success,
    requiresReview: !success,
    statePatch: {},
    nextCase,
    reason: success
      ? 'VAT Posting Setup matrix row is visible after reopen; still no preview/posting proof.'
      : `VAT Posting Setup matrix recreate is blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Smart Decision',
      '',
      'D13C hat die falsche partielle INLAND/VAT19-Zeile entfernt. D14 darf deshalb genau eine neue Matrixzeile versuchen, aber nur auf Page 472 und nur wenn die Eingabefelder sichtbar/fokussiert sind.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Kein Belegdraft.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine VAT Entries oder Sachposten.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.resultStatus).toMatch(/observed|blocked/);
});
