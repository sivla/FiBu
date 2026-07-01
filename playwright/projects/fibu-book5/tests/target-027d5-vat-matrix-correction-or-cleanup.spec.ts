import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027D5-VAT-MATRIX-CORRECTION-OR-CLEANUP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d5-vat-matrix-correction-or-cleanup';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D5-result.json');

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
  description: 'Inland 19 Prozent',
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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId/i.test(line))
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
        /INLAND|VAT19|Inland 19 Prozent|1406|3806|19|Normale MwSt|Normal VAT/i,
        /Beschreibung|MwSt\. %|MwSt\.-Berechnungsart|Umsatzsteuerkonto|Vorsteuerkonto/i,
        /Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i
      ],
      maxLines: 300,
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

async function entries(page: Page, pattern: RegExp) {
  const all: RectEntry[] = [];
  for (const frame of page.frames()) {
    const frameEntries = await frame
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
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .slice(0, 220);
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
        const isEditor =
          tagName === 'input' ||
          tagName === 'textarea' ||
          role === 'textbox' ||
          role === 'combobox' ||
          editable === 'true';
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

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogVisible(page)).toBe(false);
}

async function openMatrix(page: Page) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertContext(page);
}

async function clickEditList(page: Page) {
  for (const candidate of [
    page.getByRole('button', { name: /^Liste bearbeiten$|^Edit List$/i }).first(),
    page.getByRole('menuitem', { name: /^Liste bearbeiten$|^Edit List$/i }).first(),
    page.getByText(/^Liste bearbeiten$|^Edit List$/i).first()
  ]) {
    if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
      await candidate.click({ timeout: 3000 }).catch(async () => candidate.click({ timeout: 3000, force: true }));
      await page.waitForTimeout(1200);
      return 'clicked-by-locator';
    }
  }
  return 'not-visible-or-already-editing';
}

async function locateColumn(page: Page, pattern: RegExp, fallbackX: number) {
  const header = (await entries(page, pattern))
    .filter((entry) => /columnheader|button|div/i.test(entry.role))
    .filter((entry) => entry.y >= 80 && entry.y <= 190)
    .sort((left, right) => left.x - right.x)[0];
  return header ? header.x + Math.round(header.width / 2) : fallbackX;
}

async function locateTargetRowY(page: Page) {
  const row = (await entries(page, /INLAND|VAT19/))
    .filter((entry) => /^(INLAND|VAT19)$|INLAND\s+VAT19/i.test(entry.text))
    .filter((entry) => entry.y > 130)
    .filter((entry) => entry.width < 460 && entry.height < 100)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (!row) throw new Error('No INLAND/VAT19 row visible on Page 472.');
  return row.y + Math.round(Math.min(row.height, 40) / 2);
}

async function setCellOnlyWithTrueEditor(
  page: Page,
  x: number,
  y: number,
  value: string,
  step: string,
  steps: Array<Record<string, unknown>>,
  blockedBy: string[]
) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(450);
  const editor = await activeEditorInfo(page, { x, y });
  steps.push({ step, x, y, value, editor });
  if (!editor.found) {
    blockedBy.push(`No true active editor detected for ${step}; refusing to type ${value}.`);
    return false;
  }
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 35 });
  await page.waitForTimeout(350);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(900);
  return true;
}

function rowComplete(text: string) {
  return (
    /\bINLAND\b/i.test(text) &&
    /\bVAT19\b/i.test(text) &&
    /\b19(?:,00|\.00)?\b|Inland 19 Prozent/i.test(text) &&
    /\b3806\b/i.test(text) &&
    /\b1406\b/i.test(text) &&
    !/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(text)
  );
}

test('TARGET-027D5 corrects partial VAT matrix row only through true active editors', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const steps: Array<Record<string, unknown>> = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let setupChangeAttempted = false;

  await openMatrix(page);
  const beforeText = await matrixText(page);
  await writeText('target-027d5-010-before-correction.txt', beforeText);
  await screenshot(page, 'target-027d5-010-before-correction.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'Before D5 correction decision',
    status: 'accepted-page-context',
    visibleLearning: 'The matrix row INLAND/VAT19 must be visibly incomplete before any correction route is justified.',
    internallyProves: 'Page 472 visible context before correction-or-cleanup decision.',
    doesNotProve: ['No completed VAT matrix row', 'No Preview Posting', 'No Posting', 'No VAT Entries']
  });

  const beforePartial = /\bINLAND\b/i.test(beforeText) && /\bVAT19\b/i.test(beforeText);
  if (!beforePartial) blockedBy.push('The partial INLAND/VAT19 row is not visible; refusing correction or cleanup.');

  if (blockedBy.length === 0 && !rowComplete(beforeText)) {
    steps.push({
      step: 'smart-decision',
      decision: 'correct-existing-row',
      reason: 'A partial INLAND/VAT19 row exists; cleanup/delete is riskier than completing the one setup row if true editors are detected.',
      doNotRepeat: ['blind grid tab-flow', 'unverified card route', 'unverified list-cell value write']
    });
    steps.push({ step: 'edit-list', result: await clickEditList(page) });
    await assertContext(page);

    const y = await locateTargetRowY(page);
    const descriptionX = await locateColumn(page, /^Beschreibung$/i, 610);
    const vatPercentX = await locateColumn(page, /^MwSt\.?\s*%$/i, 885);
    const salesVatX = await locateColumn(page, /^Umsatzst|^Umsatzsteuerkonto$/i, 1455);
    const purchaseVatX = await locateColumn(page, /^Vorsteuer|^Vorsteuerkonto$/i, 1610);
    steps.push({ step: 'located-cells-from-d4-field-map', y, descriptionX, vatPercentX, salesVatX, purchaseVatX });

    const writes = [
      await setCellOnlyWithTrueEditor(page, descriptionX, y, targetValues.description, 'description', steps, blockedBy),
      await setCellOnlyWithTrueEditor(page, vatPercentX, y, targetValues.vatPercent, 'vat-percent', steps, blockedBy),
      await setCellOnlyWithTrueEditor(page, salesVatX, y, targetValues.salesVatAccount, 'sales-vat-account', steps, blockedBy),
      await setCellOnlyWithTrueEditor(page, purchaseVatX, y, targetValues.purchaseVatAccount, 'purchase-vat-account', steps, blockedBy)
    ];
    setupChangeAttempted = writes.some(Boolean);
  } else if (rowComplete(beforeText)) {
    steps.push({ step: 'already-complete-no-write-needed' });
  }

  await assertContext(page);
  const afterText = await matrixText(page);
  await writeText('target-027d5-020-after-correction-attempt.txt', afterText);
  await screenshot(page, 'target-027d5-020-after-correction-attempt.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'After true-editor correction attempt',
    status: 'after-correction-attempt',
    visibleLearning: 'Only visible persisted values count; editor detection alone is not enough.',
    internallyProves: 'Visible list state after D5 correction attempt.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries']
  });

  await openMatrix(page);
  const reopenText = await matrixText(page);
  await writeText('target-027d5-030-reopen-proof.txt', reopenText);
  await screenshot(page, 'target-027d5-030-reopen-proof.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'Reopen proof after D5 correction attempt',
    status: rowComplete(reopenText) ? 'accepted-reopen-proof' : 'blocked-reopen-proof',
    visibleLearning: 'A setup correction only counts when the reopened matrix visibly shows the completed row.',
    internallyProves: rowComplete(reopenText) ? 'Completed INLAND/VAT19 candidate row is visible after reopen.' : 'The row remains incomplete or unproven after reopen.',
    doesNotProve: ['No German VAT final correctness', 'No Preview Posting', 'No VAT Entries', 'No G/L Entries']
  });

  const success = rowComplete(reopenText);
  if (!success && blockedBy.length === 0) blockedBy.push('Reopen proof still does not visibly show complete INLAND/VAT19/19/3806/1406 target values.');
  if (/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(`${afterText}\n${reopenText}`)) {
    warnings.push('Business Central reports unsaved/error state after correction attempt.');
  }

  const nextCase = success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D6-VAT-MATRIX-ROW-ACTION-OR-PERSONALIZE-ROUTE';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-correction-or-cleanup',
    resultStatus: success ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    targetValues,
    smartDecision: {
      chosenRoute: 'correct-existing-row-if-true-editor-detected',
      rejectedRoutes: [
        'cleanup/delete existing partial row',
        'repeat blind grid tab-flow',
        'repeat unverified card route',
        'repeat unverified list-cell typing'
      ],
      reason: 'Completing the existing partial INLAND/VAT19 setup row is lower risk than deleting it, but only if Playwright can prove a true active editor before typing.'
    },
    actionsTaken: [
      'Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix in playthru / UNIVERSAARL-DE.',
      'Captured before screenshot/text.',
      'Chose correction over cleanup/delete because a partial target row already exists.',
      'Clicked cells only after locating the INLAND/VAT19 row and relevant headers from the D4 field map.',
      ...(setupChangeAttempted ? ['Typed only into cells where a true active editor was detected.'] : ['Refused to type because no true active editor was detected.']),
      'Captured after screenshot/text and reopen proof.',
      'Stopped before master data, document draft, Preview Posting and Posting.'
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
          'The INLAND + VAT19 VAT Posting Setup row is visible after reopen with candidate values 19, 3806 and 1406.',
          'The correction route avoided master data, document draft, Preview Posting, Posting and API shortcuts.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'The D5 route captured before/after/reopen proof for the partial row.',
          'The route did not repeat blind tab-flow; it required true active editor detection before typing.',
          'The run stopped before master data, document draft, Preview Posting and Posting.'
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
      'target-027d5-010-before-correction.png',
      'target-027d5-020-after-correction-attempt.png',
      'target-027d5-030-reopen-proof.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D5-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D5-result.json`,
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
      noBlindGridTabFlow: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-027D4 mapped Page 472 and proved that the INLAND/VAT19 row exists but remains incomplete.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The partial VAT Posting Setup row blocks posting groups and master data; correcting or blocking it is still the narrowest dependency.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: success ? 'ready-next' : 'needs-setup-first',
          reason: success ? 'VAT matrix row is visibly complete enough for the next setup preflight.' : 'VAT matrix row remains incomplete or unproven.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT and posting group defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT matrix, posting groups and dimensions/defaults.'
        },
        {
          caseId: 'TARGET-031-FIRST-DOCUMENT-DRAFT-GATE',
          status: 'needs-setup-first',
          reason: 'Document drafts wait for master data and complete setup defaults.'
        }
      ],
      queueChangesMade: success ? [] : ['Select a new row-action/personalize route instead of repeating cell edits.'],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: success
        ? 'The next bottleneck becomes posting group/default readiness; Preview and Posting stay locked.'
        : 'The next useful step is a new UI route such as row actions or Personalize, not another cell-click write.',
      risksBeforeNextCase: [
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.',
        'Do not create master data until posting groups/defaults are ready.'
      ],
      requiredPreparation: success ? ['Keep master data locked until posting group preflight finishes.'] : ['Use row action, Personalize or another field discovery route; do not repeat D3/D5 cell typing.']
    },
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea: success ? 'universaarl-posting-groups-preflight' : 'universaarl-vat-matrix-row-action-or-personalize-route',
        activeCase: nextCase,
        active_case_file: success
          ? '.agent/state/cases/target-028-posting-groups-preflight.json'
          : '.agent/state/cases/target-027d6-vat-matrix-row-action-or-personalize-route.json',
        lastReferenceCase: CASE_ID,
        nextCase,
        nextStep: success
          ? 'Run posting groups preflight after the INLAND/VAT19 matrix row correction; no master data yet.'
          : 'Use a row-action or Personalize route to recover Page 472 field editing; do not repeat blind cell writes.'
      },
      lastRunSummary: {
        runId: CASE_ID,
        caseId: CASE_ID,
        status: success ? 'observed' : 'blocked',
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D5-result.json`,
        summary: success
          ? 'D5 visibly completed the INLAND/VAT19 VAT matrix row after reopen; no Preview Posting or Posting.'
          : 'D5 blocked safely because the row could not be completed through true active editors; no Preview Posting or Posting.',
        nextCase
      }
    },
    nextCase,
    reason: success
      ? 'VAT matrix correction is visible after reopen; still no preview/posting proof.'
      : `VAT matrix correction remains blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027D5 VAT Matrix Correction or Cleanup',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Entscheidung',
      '',
      'Die bestehende partielle `INLAND`/`VAT19`-Zeile wird nicht geloescht. Der Lauf versucht eine Korrektur nur dann, wenn vor der Eingabe ein echter aktiver Editor erkannt wird.',
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
