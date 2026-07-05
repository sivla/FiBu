import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-071-VAT-POSTING-SETUP-PAGE472-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-071-vat-posting-setup-page472-controlled-write-gate';
const EVIDENCE_REL_DIR = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_REL_DIR);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-071-result.json');

type CellEntry = {
  text: string;
  role: string;
  ariaLabel: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
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
  vatPercent: '19',
  vatCalculationType: 'Normale MwSt.',
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
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString().replace('%7Btenant%7D', '{tenant}');
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
    /Normale MwSt|Normal VAT/i.test(text) &&
    /\b3806\b/i.test(text) &&
    /\b1406\b/i.test(text) &&
    !/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie|Error|Fehler/i.test(text)
  );
}

function rowHasPartialTarget(text: string) {
  return /\bINLAND\b/i.test(text) || /\bVAT19\b/i.test(text) || /\b3806\b/i.test(text) || /\b1406\b/i.test(text);
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
        /Gesch.*ftsbuchungsgruppe|Produktbuchungsgruppe|VAT Bus|VAT Prod/i,
        /Beschreibung|MwSt\. %|VAT %|Berechnungsart|Calculation Type|Umsatzsteuerkonto|Sales VAT Account|Vorsteuerkonto|Purchase VAT Account/i,
        /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Nicht gespeichert|Fehler|Error/i
      ],
      maxLines: 420,
      maxLineLength: 360
    })
  );
}

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main, .modal-dialog');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (/\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|OK|Yes|Ja|Finish|Fertig stellen)\b/i.test(text)) {
        dialogs.push(text);
      }
    }
  }
  return dialogs;
}

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
}

async function screenshot(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, fileName), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: path.join(EVIDENCE_DIR, fileName),
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
    visibleLearning: 'Das Bild zeigt die MwSt.-Buchungsmatrix, die Zielzeile oder den sicheren Stop-Zustand.',
    internallyProves: 'Universaarl Page-472 VAT Posting Setup state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries', 'No G/L Entries', 'No final German VAT correctness'],
    ...extra
  });
  return text;
}

async function openMatrix(page: Page) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertContext(page);
  const text = await visibleText(page);
  if (!page472Visible(text)) {
    return false;
  }
  return true;
}

async function clickAction(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const candidate = frame.getByRole(role, { name: pattern }).first();
      if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
        await candidate.click({ timeout: 5000 }).catch(async () => candidate.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(1400);
        return { clicked: true, by: role, pattern: pattern.source };
      }
    }
  }
  return { clicked: false, by: 'not-found', pattern: pattern.source };
}

async function visibleEntries(page: Page, pattern: RegExp) {
  const all: CellEntry[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((source) => {
        const pattern = new RegExp(source, 'i');
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],[role="columnheader"],[role="row"],[role="button"],button,span,div,input,td')]
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
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(rect.y + rect.height / 2)
            };
          })
          .filter(Boolean)
          .slice(0, 360);
      }, pattern.source)
      .catch(() => []);
    all.push(...(entries as CellEntry[]));
  }
  return all;
}

async function rowCellCenters(page: Page, rowY: number) {
  const all: CellEntry[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((rowY) => {
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],td,input')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = (element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const centerY = rect.y + rect.height / 2;
            if (
              Math.abs(centerY - rowY) > 26 ||
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
    all.push(...(entries as CellEntry[]));
  }

  const unique: CellEntry[] = [];
  for (const entry of all.sort((left, right) => left.x - right.x || left.width - right.width)) {
    if (unique.some((existing) => Math.abs(existing.centerX - entry.centerX) < 8)) continue;
    unique.push(entry);
  }
  return unique;
}

async function locateColumn(page: Page, pattern: RegExp, fallbackX: number) {
  const headers = (await visibleEntries(page, pattern))
    .filter((entry) => /columnheader|button|div|span/i.test(entry.role))
    .filter((entry) => entry.y >= 80 && entry.y <= 250)
    .sort((left, right) => left.x - right.x);
  const header = headers[0];
  return header ? header.centerX : fallbackX;
}

async function locateWritableRow(page: Page) {
  const target = (await visibleEntries(page, /INLAND|VAT19/))
    .filter((entry) => /row|gridcell|td|div/i.test(entry.role))
    .filter((entry) => entry.y > 120 && entry.height <= 90)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (target) return { y: target.centerY, row: target, source: 'existing-target-row' };

  const blankOrDefault = (await visibleEntries(page, /Normale MwSt|Normal VAT|\b0\b|\*/))
    .filter((entry) => entry.y > 150 && entry.y < 360 && entry.height <= 90)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (blankOrDefault) return { y: blankOrDefault.centerY, row: blankOrDefault, source: 'new-or-default-row' };

  return { y: 220, row: null, source: 'fallback-grid-y' };
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
          found: Boolean(isEditor && visible && distanceFromCell < 300),
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

async function probeEditor(page: Page, x: number, y: number, key: string, steps: Array<Record<string, unknown>>) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(400);
  let editor = await activeEditorInfo(page, { x, y });
  if (!editor.found) {
    await page.mouse.dblclick(x, y);
    await page.waitForTimeout(500);
    editor = await activeEditorInfo(page, { x, y });
  }
  steps.push({ step: 'editor-probe', key, x, y, editor });
  return editor;
}

async function writeEditorValue(page: Page, value: string) {
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 35 });
  await page.waitForTimeout(400);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(900);
}

test('TARGET-071 writes or blocks the single Page 472 INLAND/VAT19 VAT Posting Setup row', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const steps: Array<Record<string, unknown>> = [];
  let setupChangeAttempted = false;
  let setupChanged = false;

  const openedMatrix = await openMatrix(page);
  actionsTaken.push('Opened Page 472 directly in playthru / UNIVERSAARL-DE.');
  if (!openedMatrix) {
    blockedBy.push('Direct page=472 route stayed on a non-Page-472 context; refusing Tell-Me/search fallback and refusing setup write.');
    const blockedText = await capture(page, 'target-071-000-direct-page-route-blocked', 'Direct page=472 did not show Page 472.', {
      targetValues,
      routeRule: 'No search fallback in TARGET-071; wrong-target direct route blocks before setup write.',
      currentUrl: sanitizeEvidenceUrl(page.url())
    });
    const nextCase = 'TARGET-072-VAT-PAGE472-NAVIGATION-ROUTE-DECISION';
    const result = {
      schemaVersion: 1,
      purpose: 'autopilot-result-normalized',
      caseId: CASE_ID,
      source: 'playwright-universaarl-vat-posting-setup-page472-controlled-write-gate',
      resultStatus: 'blocked-vat-posting-setup-page472-direct-route',
      runPlanId: `${CASE_ID}-PLAN`,
      selectedTaskClass: 'judge_work',
      selectedModelClass: 'gpt-5.5-low',
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      url: sanitizeEvidenceUrl(page.url()),
      page: 'Role Center or non-Page-472 context after direct page=472 route',
      targetValues,
      actionsTaken,
      actionsNotTaken: [
        'No Tell-Me/search fallback',
        'No Page 470 write',
        'No VAT Business Posting Group write',
        'No VAT Product Posting Group write',
        'No VAT Posting Setup write',
        'No Configuration Package import/export/validate/apply',
        'No cleanup/delete',
        'No master data',
        'No document draft',
        'No Preview Posting',
        'No Posting',
        'No payment',
        'No API shortcut',
        'No company switch',
        'No book change'
      ],
      setupChanged: false,
      setupChangeAttempted: false,
      masterDataChanged: false,
      draftCreated: false,
      previewPosting: false,
      posted: false,
      apiShortcut: false,
      screenshots: ['target-071-000-direct-page-route-blocked.png'],
      proved: [
        'Business Central stayed in playthru / UNIVERSAARL-DE.',
        'The direct page=472 route did not produce accepted Page 472 context in this run.',
        'TARGET-071 stopped before any setup write, Preview Posting, Posting, master data, document draft, payment or API shortcut.'
      ],
      notProved: [
        'No saved INLAND/VAT19 VAT Posting Setup row.',
        'No Page 472 live write route.',
        'No final German VAT correctness.',
        'No Preview Posting.',
        'No VAT Entries.',
        'No G/L Entries.'
      ],
      blockedBy,
      warnings,
      steps: [{ step: 'direct-page-route-text-sample', text: blockedText.slice(0, 1200) }],
      evidenceRefs: [`${EVIDENCE_REL_DIR}/TARGET-071-result.json`, `${EVIDENCE_REL_DIR}/README.md`],
      changedFiles: [
        `${EVIDENCE_REL_DIR}/TARGET-071-result.json`,
        `${EVIDENCE_REL_DIR}/*.txt`,
        `${EVIDENCE_REL_DIR}/*.png`,
        `${EVIDENCE_REL_DIR}/*.screenshot.json`
      ],
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: {},
      nextStepDecision: {
        currentCase: CASE_ID,
        plannedNextCaseBeforeReview: CASE_ID,
        lastEvidenceSummary: 'TARGET-027D32 approved only a narrow Page 472 live gate. The live direct page=472 route currently lands in non-Page-472 context.',
        isPlannedNextCaseStillSensible: false,
        reason: 'The planned Page-472 write is not sensible while the direct route cannot prove Page 472 without search fallback.',
        lookaheadReviewed: [
          {
            caseId: 'TARGET-071B-VAT-POSTING-SETUP-REOPEN-AND-SOURCE-REVIEW',
            status: 'blocked',
            reason: 'No saved VAT setup row exists.'
          },
          {
            caseId: 'TARGET-032P-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-PARK',
            status: 'obsolete',
            reason: 'The older General Posting Setup park case is already completed and should not become the active fallback.'
          },
          {
            caseId: 'TARGET-072-VAT-PAGE472-NAVIGATION-ROUTE-DECISION',
            status: 'ready-next',
            reason: 'The direct Page 472 route landed outside Page 472; the next useful step is a route decision/helper before any VAT setup write.'
          },
          {
            caseId: 'TARGET-068-W1-FOUNDATION-READY-CHECKPOINT-AFTER-DIMENSION-PARK',
            status: 'ready-after-current',
            reason: 'Useful only after VAT/Page472 and General Posting blockers are classified.'
          },
          {
            caseId: 'TARGET-038-O2C-PREFLIGHT',
            status: 'blocked',
            reason: 'O2C remains blocked until VAT and General Posting Setup are proven or consciously limited.'
          }
        ],
        queueChangesMade: [],
        selectedNextCase: nextCase,
        whySelectedNextCaseIsBest: 'TARGET-071 blocked before write; the next practical progress path is a bounded Page-472 navigation route decision, not a stale General Posting Setup park case.',
        risksBeforeNextCase: ['Do not open search as a hidden fallback for this write gate.', 'Do not claim VAT setup readiness from Role Center text.'],
        requiredPreparation: ['Review the blocked screenshot and define a non-hidden Page-472 navigation route before another VAT write gate.']
      },
      nextCase,
      reason: `TARGET-071 blocked safely: ${blockedBy.join('; ')}`
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
        '## Ergebnis',
        '',
        result.reason,
        '',
        '## Grenze',
        '',
        'Die direkte Page-472-Route zeigte in diesem Lauf keine MwSt.-Buchungsmatrix. Deshalb wurde kein Such-Fallback gestartet und kein Setupwert geschrieben.'
      ].join('\n')
    );

    expect(result.resultStatus).toMatch(/blocked/);
    return;
  }

  const beforeText = await capture(page, 'target-071-010-before-page472', 'Before TARGET-071: Page 472 live context and current row state.', {
    targetValues,
    routeRule: 'Stop before write unless Page 472, row scope, field route and screenshot QA are unambiguous.'
  });

  if (rowComplete(beforeText)) {
    actionsTaken.push('INLAND/VAT19 target row already appears complete; no write was attempted.');
  } else if (rowHasPartialTarget(beforeText)) {
    blockedBy.push('Existing partial or ambiguous INLAND/VAT19/3806/1406 signals are visible; refusing cleanup or overwrite in TARGET-071.');
  } else {
    const editRoute = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
    steps.push({ step: 'optional-edit-list-click', editRoute });
    await assertContext(page);

    const newRoute = await clickAction(page, /^Neu$|^New$/i);
    steps.push({ step: 'new-row-click', newRoute });
    if (!newRoute.clicked) {
      blockedBy.push('Neu/New was not visibly clickable on Page 472; refusing unscoped VAT setup write.');
    } else {
      await assertContext(page);
      const afterNewText = await capture(page, 'target-071-020-after-new-before-write', 'After New on Page 472, before any value write.', {
        editRoute,
        newRoute
      });
      if (!page472Visible(afterNewText)) blockedBy.push('Page 472 text disappeared after New; refusing write.');

      const rowInfo = await locateWritableRow(page);
      const cells = await rowCellCenters(page, rowInfo.y);
      const cellMap = {
        businessGroupX: cells[1]?.centerX ?? (await locateColumn(page, /Gesch.*ftsbuchungsgruppe|Business Posting Group|Bus\. Posting Group/i, 780)),
        productGroupX: cells[3]?.centerX ?? (await locateColumn(page, /Produktbuchungsgruppe|Product Posting Group|Prod\. Posting Group/i, 912)),
        vatPercentX: cells[7]?.centerX ?? (await locateColumn(page, /^MwSt\.?\s*%$|VAT %/i, 1335)),
        calcTypeX: cells[8]?.centerX ?? (await locateColumn(page, /Berechnungsart|Calculation Type/i, 1398)),
        salesVatX: cells[11]?.centerX ?? (await locateColumn(page, /Umsatzsteuerkonto|Sales VAT Account|Verkauf.*MwSt/i, 1617)),
        purchaseVatX: cells[13]?.centerX ?? (await locateColumn(page, /Vorsteuerkonto|Purchase VAT Account|Einkauf.*MwSt/i, 1725))
      };
      steps.push({ step: 'row-bound-cell-map', rowInfo, cells: cells.slice(0, 18), cellMap });

      const writePlan = [
        { key: 'vatBusinessPostingGroup', x: cellMap.businessGroupX, value: targetValues.vatBusinessPostingGroup },
        { key: 'vatProductPostingGroup', x: cellMap.productGroupX, value: targetValues.vatProductPostingGroup },
        { key: 'vatPercent', x: cellMap.vatPercentX, value: targetValues.vatPercent },
        { key: 'vatCalculationType', x: cellMap.calcTypeX, value: targetValues.vatCalculationType },
        { key: 'salesVatAccount', x: cellMap.salesVatX, value: targetValues.salesVatAccount },
        { key: 'purchaseVatAccount', x: cellMap.purchaseVatX, value: targetValues.purchaseVatAccount }
      ];

      const editorProofs: Array<Record<string, unknown>> = [];
      for (const item of writePlan) {
        const editor = await probeEditor(page, item.x, rowInfo.y, item.key, steps);
        editorProofs.push({ key: item.key, editorFound: editor.found, editor });
        if (!editor.found) {
          blockedBy.push(`No true active editor detected for ${item.key}; refusing to type ${item.value}.`);
        }
      }

      await capture(page, 'target-071-030-pre-write-editor-proof', 'Pre-write screenshot after row-bound editor probes.', {
        rowInfo,
        cellMap,
        editorProofs,
        blockedBy
      });

      if (blockedBy.length === 0) {
        for (const item of writePlan) {
          setupChangeAttempted = true;
          await page.mouse.click(item.x, rowInfo.y);
          await page.waitForTimeout(300);
          await writeEditorValue(page, item.value);
          steps.push({ step: 'typed-target-value', key: item.key, value: item.value });
          await assertContext(page);
        }
      }
    }
  }

  await assertContext(page);
  const afterText = await capture(page, 'target-071-040-after-write-or-block', 'After TARGET-071 write attempt or safe block.', {
    setupChangeAttempted,
    blockedBy,
    steps
  });
  if (/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie|Fehler|Error/i.test(afterText)) {
    warnings.push('Business Central shows unsaved/error text after TARGET-071 route; reopen proof decides acceptance.');
  }

  const reopenedMatrix = await openMatrix(page);
  if (!reopenedMatrix) {
    blockedBy.push('Reopen proof did not show Page 472; refusing setup success claim.');
  }
  const reopenText = await capture(page, 'target-071-050-reopen-proof', 'Reopen proof after TARGET-071.', {
    setupChangeAttempted
  });
  setupChanged = rowComplete(reopenText) && (setupChangeAttempted || rowComplete(beforeText));
  if (setupChangeAttempted && !setupChanged) {
    blockedBy.push('Values were attempted, but reopen proof does not show INLAND/VAT19 with 19, Normale MwSt., 3806 and 1406 in one row.');
  }

  const resultStatus = setupChanged ? 'observed-vat-posting-setup-row-proven' : 'blocked-vat-posting-setup-page472-gate';
  const nextCase = setupChanged
    ? 'TARGET-071B-VAT-POSTING-SETUP-REOPEN-AND-SOURCE-REVIEW'
    : 'TARGET-072-VAT-PAGE472-NAVIGATION-ROUTE-DECISION';

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary: 'TARGET-027D32 approved only a narrow Page 472 live gate after Page 472/Table 325 field truth and Page 470 parking.',
    isPlannedNextCaseStillSensible: true,
    reason: 'TARGET-071 is the smallest practical W1 Foundation step for the missing INLAND/VAT19 VAT Posting Setup row.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-071B-VAT-POSTING-SETUP-REOPEN-AND-SOURCE-REVIEW',
        status: setupChanged ? 'ready-next' : 'blocked',
        reason: setupChanged
          ? 'The setup row is visible after reopen and needs source/claim review before any Preview Posting.'
          : 'No saved VAT setup row exists, so 071B is premature.'
      },
      {
        caseId: 'TARGET-032P-GENERAL-POSTING-SETUP-PURCHASE-ACCOUNT-PARK',
        status: 'obsolete',
        reason: setupChanged
          ? 'General Posting Setup remains separate, but the older 032P park case is already complete.'
          : 'The older General Posting Setup park case is already complete; do not jump backward as active next case.'
      },
      {
        caseId: 'TARGET-072-VAT-PAGE472-NAVIGATION-ROUTE-DECISION',
        status: setupChanged ? 'ready-after-current' : 'ready-next',
        reason: setupChanged
          ? 'Only needed if later Page 472 navigation becomes unstable again.'
          : 'The Page 472 direct route blocked; define a bounded navigation/helper route before another VAT write gate.'
      },
      {
        caseId: 'TARGET-068-W1-FOUNDATION-READY-CHECKPOINT-AFTER-DIMENSION-PARK',
        status: 'ready-after-current',
        reason: 'Foundation checkpoint is useful only after VAT/Page472 and General Posting blockers are classified.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'blocked',
        reason: 'O2C remains blocked until VAT and General Posting Setup are proven or consciously limited as learning-only.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: setupChanged
      ? 'A saved VAT setup row needs one narrow reopen/source review before any posting-style claim.'
      : 'TARGET-071 stopped or failed safely; another Page-472 write loop would repeat risk, so the next useful lane is the Page-472 navigation route decision.',
    risksBeforeNextCase: [
      'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.',
      'Do not create master data or documents before Foundation readiness.',
      'Do not delete or clean up VAT rows outside an explicit cleanup case.'
    ],
    requiredPreparation: setupChanged
      ? ['Review TARGET-071 screenshots and source boundaries; keep Preview Posting locked.']
      : ['Review TARGET-071 screenshots and blockers before choosing any further VAT route.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-posting-setup-page472-controlled-write-gate',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    targetValues,
    actionsTaken,
    actionsNotTaken: [
      'No Page 470 write',
      'No VAT Business Posting Group write',
      'No VAT Product Posting Group write',
      'No Configuration Package import/export/validate/apply',
      'No cleanup/delete',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No payment',
      'No API shortcut',
      'No company switch',
      'No book change'
    ],
    setupChanged,
    setupChangeAttempted,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'target-071-010-before-page472.png',
      'target-071-020-after-new-before-write.png',
      'target-071-030-pre-write-editor-proof.png',
      'target-071-040-after-write-or-block.png',
      'target-071-050-reopen-proof.png'
    ],
    proved: setupChanged
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was visibly open.',
          'INLAND/VAT19 is visible after reopen with normal VAT, VAT percent 19, Sales VAT Account 3806 and Purchase VAT Account 1406.',
          'No master data, document draft, Preview Posting, Posting, payment or API shortcut was executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was opened and captured.',
          'TARGET-071 stopped before Preview Posting, Posting, master data, document drafts, payments and API shortcuts.',
          'The run did not use Page 470, configuration packages, cleanup/delete or company switch.'
        ],
    notProved: [
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval or compliance final proof.'
    ],
    blockedBy,
    warnings,
    steps,
    evidenceRefs: [`${EVIDENCE_REL_DIR}/TARGET-071-result.json`, `${EVIDENCE_REL_DIR}/README.md`],
    changedFiles: [
      `${EVIDENCE_REL_DIR}/TARGET-071-result.json`,
      `${EVIDENCE_REL_DIR}/*.txt`,
      `${EVIDENCE_REL_DIR}/*.png`,
      `${EVIDENCE_REL_DIR}/*.screenshot.json`
    ],
    requiresReview: !setupChanged,
    safeToFinalizeState: false,
    statePatch: {},
    nextStepDecision,
    nextCase,
    reason: setupChanged
      ? 'VAT Posting Setup target row is visible after reopen; still no Preview/Post or entry proof.'
      : `TARGET-071 blocked safely: ${blockedBy.join('; ')}`
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
      'TARGET-071 darf nur die einzelne Page-472-Zeile INLAND/VAT19 pruefen. Vor einem Write muessen Page, Company, Zielzeile, Feldroute und Screenshot-QA eindeutig sein. Wenn die Oberflaeche nur Suchkontext, unsichere Zellklicks, Konfigurationspakete oder Cleanup verlangt, stoppt der Lauf.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine Stammdaten.',
      '- Keine Belege.',
      '- Keine VAT Entries oder Sachposten.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.resultStatus).toMatch(/observed|blocked/);
});
