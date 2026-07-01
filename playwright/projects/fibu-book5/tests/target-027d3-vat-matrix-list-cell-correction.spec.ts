import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027D3-VAT-MATRIX-LIST-CELL-CORRECTION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d3-vat-matrix-list-cell-correction';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D3-result.json');

type RectEntry = { text: string; role: string; x: number; y: number; width: number; height: number };

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

function dangerous(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja)\b/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
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
      maxLines: 260,
      maxLineLength: 300
    })
  );
}

async function visibleText(page: Page) {
  return clean(await pageText(page));
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
          .slice(0, 200);
      }, pattern.source)
      .catch(() => []);
    all.push(...(frameEntries as RectEntry[]));
  }
  return all;
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
  expect(dangerous(await visibleText(page))).toBe(false);
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
  const candidate = (await entries(page, /^Liste bearbeiten$|^Edit List$/i))
    .filter((entry) => entry.x > 450 && entry.y < 130)
    .sort((a, b) => a.width * a.height - b.width * b.height)[0];
  if (candidate) {
    await page.mouse.click(candidate.x + Math.round(candidate.width / 2), candidate.y + Math.round(candidate.height / 2));
    await page.waitForTimeout(1200);
    return 'clicked-by-geometry';
  }
  return 'not-visible-or-already-editing';
}

async function locateColumn(page: Page, pattern: RegExp, fallbackX: number) {
  const header = (await entries(page, pattern))
    .filter((entry) => /columnheader|button|div/i.test(entry.role))
    .filter((entry) => entry.y >= 85 && entry.y <= 170)
    .sort((left, right) => left.x - right.x)[0];
  return header ? header.x + Math.round(header.width / 2) : fallbackX;
}

async function locateTargetRowY(page: Page) {
  const row = (await entries(page, /INLAND|VAT19/))
    .filter((entry) => /^(INLAND|VAT19)$|INLAND\s+VAT19/i.test(entry.text))
    .filter((entry) => entry.y > 150)
    .filter((entry) => entry.width < 420 && entry.height < 80)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (!row) throw new Error('No INLAND/VAT19 row visible on matrix list.');
  return row.y + Math.round(Math.min(row.height, 40) / 2);
}

async function setCell(page: Page, x: number, y: number, value: string, step: string, steps: Array<Record<string, unknown>>) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(350);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 35 });
  await page.waitForTimeout(350);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(900);
  steps.push({ step, value, x, y });
}

test('TARGET-027D3 corrects the VAT matrix row from the visible list cells', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const steps: Array<Record<string, unknown>> = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openMatrix(page);
  await writeText('target-027d3-010-before-list.txt', await matrixText(page));
  await screenshot(page, 'target-027d3-010-before-list.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'Before list-cell correction',
    status: 'accepted-page-screenshot',
    internallyProves: 'Visible list state before targeted cell correction.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries']
  });

  try {
    steps.push({ step: 'edit-list', route: await clickEditList(page) });
    const y = await locateTargetRowY(page);
    const descriptionX = await locateColumn(page, /^Beschreibung$/i, 545);
    const vatPercentX = await locateColumn(page, /^MwSt\.?\s*%$/i, 885);
    const salesVatX = await locateColumn(page, /^Umsatzst|^Umsatzsteuerkonto$/i, 1210);
    const purchaseVatX = await locateColumn(page, /^Vorsteuer|^Vorsteuerkonto$/i, 1370);
    steps.push({ step: 'located-list-cells', y, descriptionX, vatPercentX, salesVatX, purchaseVatX });
    await setCell(page, descriptionX, y, 'Inland 19 Prozent', 'description', steps);
    await setCell(page, vatPercentX, y, '19', 'vat-percent', steps);
    await setCell(page, salesVatX, y, '3806', 'sales-vat-account', steps);
    await setCell(page, purchaseVatX, y, '1406', 'purchase-vat-account', steps);
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  await assertContext(page);
  await writeText('target-027d3-020-after-list-cell-correction.txt', await matrixText(page));
  await screenshot(page, 'target-027d3-020-after-list-cell-correction.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'After list-cell correction attempt',
    status: 'after-correction',
    internallyProves: 'Visible list state immediately after targeted cell correction.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries']
  });

  await openMatrix(page);
  const reopenText = await matrixText(page);
  await writeText('target-027d3-030-reopen-list.txt', reopenText);
  await screenshot(page, 'target-027d3-030-reopen-list.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'Reopen proof after list-cell correction',
    status: 'reopen-proof',
    internallyProves: 'Visible list state after reopening Page 472.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries']
  });

  const success =
    /\bINLAND\b/i.test(reopenText) &&
    /\bVAT19\b/i.test(reopenText) &&
    /Inland 19 Prozent/i.test(reopenText) &&
    /\b19(?:,00|\.00)?\b/i.test(reopenText) &&
    /\b3806\b/i.test(reopenText) &&
    /\b1406\b/i.test(reopenText) &&
    !/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(reopenText);
  if (!success && blockedBy.length === 0) blockedBy.push('Reopen list still does not visibly show complete target values INLAND/VAT19/Inland 19 Prozent/19/3806/1406.');
  if (/Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie/i.test(reopenText)) warnings.push('Business Central reports unsaved/error state after list-cell correction.');

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-list-cell-correction',
    resultStatus: success ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    targetValues: {
      vatBusinessPostingGroup: 'INLAND',
      vatProductPostingGroup: 'VAT19',
      description: 'Inland 19 Prozent',
      vatPercent: '19',
      salesVatAccount: '3806',
      purchaseVatAccount: '1406'
    },
    actionsTaken: [
      'Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix.',
      'Used visible column headers and the INLAND/VAT19 row to target list cells.',
      'Attempted to correct Beschreibung, MwSt. %, Umsatzsteuerkonto and Vorsteuerkonto.',
      'Captured before, after and reopen screenshots.',
      'Stopped before master data, document draft, Preview Posting and Posting.'
    ],
    actionsNotTaken: ['No master data', 'No document draft', 'No Preview Posting', 'No Posting', 'No API shortcut', 'No Company switch', 'No VAT final claim'],
    setupChanged: success,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: success
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'The INLAND + VAT19 row is visible after reopen with description Inland 19 Prozent and candidate accounts 3806/1406.',
          'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
        ]
      : ['Business Central stayed in playthru / UNIVERSAARL-DE.', 'The targeted list-cell correction was attempted and documented.'],
    notProved: ['No final German VAT correctness.', 'No Preview Posting.', 'No VAT Entries.', 'No G/L Entries.', 'No VAT Statement.', 'No tax advisor approval.'],
    screenshots: ['target-027d3-010-before-list.png', 'target-027d3-020-after-list-cell-correction.png', 'target-027d3-030-reopen-list.png'],
    evidenceRefs: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D3-result.json`, `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`],
    blockedBy,
    warnings,
    steps,
    flags: {
      setupChangeAttempted: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-027D2-VAT-POSTING-SETUP-CARD-CORRECTION',
      lastEvidenceSummary: 'TARGET-027D2 showed the card route did not actually open a card. TARGET-027D3 uses visible list columns instead.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The partially created matrix row must be corrected or explicitly blocked before broader setup.',
      lookaheadReviewed: [
        { caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT', status: success ? 'ready-next' : 'needs-setup-first', reason: success ? 'VAT matrix candidate row is visible after reopen.' : 'VAT matrix row remains incomplete.' },
        { caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM', status: 'needs-setup-first', reason: 'Master data waits for posting groups and VAT defaults.' },
        { caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT', status: 'needs-setup-first', reason: 'Foundation readiness waits for posting groups and defaults.' }
      ],
      queueChangesMade: [],
      selectedNextCase: success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D4-VAT-MATRIX-PAGEINSPECTION-FOLLOWUP',
      whySelectedNextCaseIsBest: success ? 'The next bottleneck is posting-group/default preflight.' : 'Page 472 needs Page Inspection or a record-card route; do not repeat list cells blindly.',
      risksBeforeNextCase: ['Do not claim final VAT correctness before Preview Posting, VAT Entries and G/L Entries.'],
      requiredPreparation: success ? ['Keep master data locked until posting groups/defaults are ready.'] : ['Inspect Page 472 field/control mapping.']
    },
    safeToFinalizeState: false,
    requiresReview: !success,
    statePatch: {},
    nextCase: success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D4-VAT-MATRIX-PAGEINSPECTION-FOLLOWUP',
    reason: success ? 'VAT matrix row is visible after list-cell correction; still no preview/posting proof.' : `VAT matrix list-cell correction is still blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027D3 VAT Matrix List Cell Correction',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
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
  expect(result.resultStatus).toMatch(/observed|blocked/);
});
