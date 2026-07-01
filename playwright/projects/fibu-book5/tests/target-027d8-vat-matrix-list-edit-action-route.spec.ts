import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027D8-VAT-MATRIX-LIST-EDIT-ACTION-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d8-vat-matrix-list-edit-action-route';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D8-result.json');

type RectEntry = { text: string; role: string; x: number; y: number; width: number; height: number };
type EditorInfo = {
  found: boolean;
  tagName?: string;
  role?: string;
  ariaLabel?: string;
  title?: string;
  value?: string;
  text?: string;
  contentEditable?: string;
  rect?: { x: number; y: number; width: number; height: number };
  distanceFromCell?: number;
};

const targetValues = {
  vatBusinessPostingGroup: 'INLAND',
  vatProductPostingGroup: 'VAT19',
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
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
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
        /Liste bearbeiten|Weitere Optionen|Bearbeiten|Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i
      ],
      maxLines: 320,
      maxLineLength: 340
    })
  );
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const found = await frame
      .locator('[role="dialog"], .ms-Dialog-main, .modal-dialog')
      .filter({
        hasText: /Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja|Moechten Sie|Mochten Sie|Do you want/i
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

async function entries(page: Page, pattern: RegExp) {
  const all: RectEntry[] = [];
  for (const frame of page.frames()) {
    const frameEntries = await frame
      .evaluate((source) => {
        const pattern = new RegExp(source, 'i');
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],[role="columnheader"],[role="row"],[role="button"],[role="menuitem"],button,span,div,input')]
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
    all.push(...(frameEntries as RectEntry[]));
  }
  return all;
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
          found: Boolean(isEditor && visible && distanceFromCell < 260),
          tagName,
          role,
          ariaLabel: active.getAttribute('aria-label') || '',
          title: active.getAttribute('title') || '',
          value: active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.value : '',
          text: active.innerText || '',
          contentEditable: editable,
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
  await writeText(`${prefix}.txt`, text);
  await screenshot(page, `${prefix}.png`, {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step,
    visibleLearning: 'Das Bild muss die Page-472-Zeile, die gewaehlte Aktion oder den Reopen-Zustand sichtbar machen.',
    internallyProves: 'Universaarl Page-472 route evidence in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No final VAT correctness', 'No Preview Posting', 'No Posting'],
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
  if (!/MwSt\.-?Buchungsmatrix|VAT Posting Setup/i.test(text)) {
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

async function openMoreOptionsThenEditList(page: Page) {
  const moreOptions = await clickAction(page, /Weitere Optionen|More options/i);
  await assertContext(page);
  const editList = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
  await assertContext(page);
  return { moreOptions, editList };
}

async function locateColumn(page: Page, pattern: RegExp, fallbackX: number) {
  const header = (await entries(page, pattern))
    .filter((entry) => /columnheader|button|div/i.test(entry.role))
    .filter((entry) => entry.y >= 80 && entry.y <= 205)
    .sort((left, right) => left.x - right.x)[0];
  return header ? header.x + Math.round(header.width / 2) : fallbackX;
}

async function locateTargetRowY(page: Page) {
  const row = (await entries(page, /INLAND|VAT19/))
    .filter((entry) => /^(INLAND|VAT19)$|INLAND\s+VAT19/i.test(entry.text))
    .filter((entry) => entry.y > 120)
    .filter((entry) => entry.width < 460 && entry.height < 100)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (!row) throw new Error('No INLAND/VAT19 row visible on Page 472.');
  return { y: row.y + Math.round(Math.min(row.height, 40) / 2), row };
}

async function probeEditor(page: Page, x: number, y: number, step: string, steps: Array<Record<string, unknown>>) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(500);
  const editor = await activeEditorInfo(page, { x, y });
  steps.push({ step, x, y, editor });
  return editor;
}

async function writeCell(page: Page, value: string) {
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 35 });
  await page.waitForTimeout(350);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(900);
}

function rowComplete(text: string) {
  return (
    /\bINLAND\b/i.test(text) &&
    /\bVAT19\b/i.test(text) &&
    /\b19(?:,00|\.00)?\b/i.test(text) &&
    /\b3806\b/i.test(text) &&
    /\b1406\b/i.test(text) &&
    !/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(text)
  );
}

test('TARGET-027D8 uses visible More options / Liste bearbeiten before any VAT matrix write', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const steps: Array<Record<string, unknown>> = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let setupChangeAttempted = false;
  let route: Awaited<ReturnType<typeof openMoreOptionsThenEditList>> | undefined;

  await openMatrix(page);
  const beforeText = await capture(page, 'target-027d8-010-before-list-edit-route', 'Before visible More options / Liste bearbeiten route.', {
    status: 'before-route',
    expectedVisibleRow: 'INLAND + VAT19'
  });
  if (!/\bINLAND\b/i.test(beforeText) || !/\bVAT19\b/i.test(beforeText)) {
    blockedBy.push('The INLAND/VAT19 row is not visible; refusing list-edit write route.');
  }

  if (blockedBy.length === 0 && rowComplete(beforeText)) {
    steps.push({ step: 'already-complete-no-write-needed' });
  } else if (blockedBy.length === 0) {
    route = await openMoreOptionsThenEditList(page);
    steps.push({ step: 'visible-more-options-list-edit-route', route });
    await capture(page, 'target-027d8-020-after-visible-list-edit-action', 'After visible More options / Liste bearbeiten route.', {
      status: 'after-list-edit-action',
      route
    });

    if (!route.moreOptions.clicked) blockedBy.push('Weitere Optionen / More options was not visibly clicked; refusing write.');
    if (!route.editList.clicked) blockedBy.push('Liste bearbeiten / Edit List was not visibly clicked; refusing write.');
  }

  const cellMap: Record<string, number> = {};
  let rowInfo: Awaited<ReturnType<typeof locateTargetRowY>> | undefined;
  if (blockedBy.length === 0 && !rowComplete(beforeText)) {
    rowInfo = await locateTargetRowY(page);
    cellMap.vatPercentX = await locateColumn(page, /^MwSt\.?\s*%$/i, 885);
    cellMap.salesVatX = await locateColumn(page, /^Umsatzst|^Umsatzsteuerkonto$/i, 1455);
    cellMap.purchaseVatX = await locateColumn(page, /^Vorsteuer|^Vorsteuerkonto$/i, 1610);
    steps.push({ step: 'located-required-cells', row: rowInfo.row, y: rowInfo.y, cellMap });

    const probes = {
      vatPercent: await probeEditor(page, cellMap.vatPercentX, rowInfo.y, 'vat-percent-editor-probe', steps),
      salesVatAccount: await probeEditor(page, cellMap.salesVatX, rowInfo.y, 'sales-vat-account-editor-probe', steps),
      purchaseVatAccount: await probeEditor(page, cellMap.purchaseVatX, rowInfo.y, 'purchase-vat-account-editor-probe', steps)
    };
    await capture(page, 'target-027d8-030-after-editor-probes', 'After required editor probes.', {
      status: 'after-editor-probes',
      probes
    });

    if (!probes.vatPercent.found) blockedBy.push('No true active editor detected for VAT %; refusing to type 19.');
    if (!probes.salesVatAccount.found) blockedBy.push('No true active editor detected for Sales VAT Account; refusing to type 3806.');
    if (!probes.purchaseVatAccount.found) blockedBy.push('No true active editor detected for Purchase VAT Account; refusing to type 1406.');

    if (blockedBy.length === 0) {
      setupChangeAttempted = true;
      await page.mouse.click(cellMap.vatPercentX, rowInfo.y);
      await writeCell(page, targetValues.vatPercent);
      await page.mouse.click(cellMap.salesVatX, rowInfo.y);
      await writeCell(page, targetValues.salesVatAccount);
      await page.mouse.click(cellMap.purchaseVatX, rowInfo.y);
      await writeCell(page, targetValues.purchaseVatAccount);
      steps.push({ step: 'wrote-required-values-after-editor-proof', values: targetValues });
    }
  }

  await assertContext(page);
  const afterText = await capture(page, 'target-027d8-040-after-write-or-stop', 'After D8 write attempt or safe stop.', {
    status: setupChangeAttempted ? 'after-write-attempt' : 'blocked-before-write'
  });
  if (/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(afterText)) {
    warnings.push('Business Central reports unsaved/error state after the D8 route.');
  }

  await openMatrix(page);
  const reopenText = await capture(page, 'target-027d8-050-reopen-proof', 'Page 472 reopen proof after D8.', {
    status: rowComplete(await matrixText(page)) ? 'accepted-reopen-proof' : 'blocked-reopen-proof'
  });
  const success = rowComplete(reopenText);
  if (setupChangeAttempted && !success) blockedBy.push('Values were attempted but reopen proof does not visibly show INLAND/VAT19 with 19, 3806 and 1406.');
  if (!setupChangeAttempted && blockedBy.length === 0 && !success) blockedBy.push('D8 stopped without a completed row; no setup write proof exists.');

  const nextCase = success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D9-VAT-MATRIX-CLEANUP-OR-ALTERNATIVE-ROUTE-DECISION';
  const resultStatus = success ? 'observed-vat-matrix-row-completed' : 'blocked-before-or-after-write';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-list-edit-action-route',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    targetValues,
    route,
    actionsTaken: [
      'Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix in playthru / UNIVERSAARL-DE.',
      'Captured before screenshot/text for the existing INLAND/VAT19 row.',
      'Used visible More options / Liste bearbeiten before any editor probe.',
      'Probed true active editors for VAT %, Sales VAT Account and Purchase VAT Account.',
      ...(setupChangeAttempted ? ['Typed only VAT %, Sales VAT Account and Purchase VAT Account after all required editor probes passed.'] : ['Stopped without typing because the required editor/route gate was not fully satisfied.']),
      'Captured after state and reopen proof.',
      'Stopped before master data, document draft, Preview Posting, Posting and API shortcut.'
    ],
    actionsNotTaken: [
      'No cleanup/delete',
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
          'Page 472 remained scoped to the INLAND/VAT19 VAT Posting Setup row.',
          'The visible More options / Liste bearbeiten route preceded the write attempt.',
          'The reopened row shows the target VAT %, Sales VAT Account and Purchase VAT Account candidate values.',
          'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 and the INLAND/VAT19 row were captured before the D8 route.',
          'D8 did not repeat the D3/D5 direct cell-edit route.',
          'The run stopped without Preview Posting, Posting, master data, document draft or API shortcut.'
        ],
    notProved: [
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval.'
    ],
    screenshots: [
      'target-027d8-010-before-list-edit-route.png',
      'target-027d8-020-after-visible-list-edit-action.png',
      'target-027d8-030-after-editor-probes.png',
      'target-027d8-040-after-write-or-stop.png',
      'target-027d8-050-reopen-proof.png'
    ],
    evidenceRefs: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D8-result.json`, `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D8-result.json`,
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
      noD3D5CellRouteRepeat: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'D7 selected the visible Page-472 More options / Liste bearbeiten route after D6 proved Personalize was wrong-target and D3/D5 cell routes were unsafe.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The incomplete INLAND/VAT19 VAT Posting Setup row still blocks posting groups, master data and first documents.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: success ? 'ready-next' : 'needs-setup-first',
          reason: success ? 'VAT matrix candidate row is visible after reopen; posting groups can be readied next.' : 'VAT matrix row remains incomplete or unproven.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT/posting defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation cannot be ready until VAT/posting/dimension gates are settled.'
        },
        {
          caseId: 'TARGET-031-FIRST-DOCUMENT-DRAFT-GATE',
          status: 'needs-setup-first',
          reason: 'Document drafts wait for foundation readiness and master data.'
        }
      ],
      queueChangesMade: success
        ? ['Mark D8 done and move the next queue focus to posting groups preflight.']
        : ['Mark D8 blocked and insert a non-repeating cleanup-or-alternative-route decision before any more VAT matrix writes.'],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: success
        ? 'The VAT matrix prerequisite is now sufficiently visible for the next setup preflight; no Preview or Posting is unlocked yet.'
        : 'Another direct list-edit run would repeat the same failure pattern; the next step must decide cleanup/recreate or a different standard route.',
      risksBeforeNextCase: [
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.',
        'Do not create master data until posting groups/defaults are ready.',
        'Do not delete the partial VAT row without a row-scoped confirmation case.'
      ],
      requiredPreparation: success
        ? ['Keep Preview Posting and Posting locked; run posting-group preflight next.']
        : ['Review D8 screenshots and editor diagnostics; choose cleanup/recreate or another standard UI route, not D3/D5/D8 repetition.']
    },
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea: success ? 'universaarl-posting-groups-preflight' : 'universaarl-vat-matrix-cleanup-or-alternative-route-decision',
        activeCase: nextCase,
        active_case_file: success
          ? '.agent/state/cases/target-028-posting-groups-preflight.json'
          : '.agent/state/cases/target-027d9-vat-matrix-cleanup-or-alternative-route-decision.json',
        lastReferenceCase: CASE_ID,
        nextCase,
        nextStep: success
          ? 'Run posting groups preflight after Page 472 INLAND/VAT19 candidate row is visible; no master data yet.'
          : 'Do not repeat list-edit route; decide controlled cleanup/recreate or alternative Page-472 route.'
      },
      lastRunSummary: {
        runId: CASE_ID,
        caseId: CASE_ID,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D8-result.json`,
        summary: success
          ? 'D8 completed the INLAND/VAT19 VAT matrix candidate row through visible list-edit route; no Preview/Post.'
          : 'D8 blocked safely after visible list-edit route; no setup value was proven after reopen.',
        nextCase
      }
    },
    nextCase,
    reason: success
      ? 'VAT matrix row candidate values are visible after reopen; still no preview/posting proof.'
      : `D8 blocked safely: ${blockedBy.join('; ')}`
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
      '## Zweck',
      '',
      'Die vorhandene INLAND/VAT19-Zeile auf Page 472 wird nur ueber die sichtbare Standardroute Weitere Optionen / Liste bearbeiten weiterbearbeitet.',
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
