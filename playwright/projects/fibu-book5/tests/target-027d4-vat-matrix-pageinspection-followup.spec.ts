import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D4-VAT-MATRIX-PAGEINSPECTION-FOLLOWUP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d4-vat-matrix-pageinspection-followup';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D4-result.json');

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
        /Page Inspection|Seitenpr|Page ID|Source Table|Table ID|VAT Posting Setup|MwSt.-Buchungsmatrix/i
      ],
      maxLines: 280,
      maxLineLength: 320
    })
  );
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

function compactEntries(items: RectEntry[]) {
  const seen = new Set<string>();
  return items
    .filter((item) => {
      const key = `${item.text}|${item.role}|${item.x}|${item.y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 80);
}

test('TARGET-027D4 maps Page 472 field and inspection context without writing values', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const warnings: string[] = [];
  const blockedBy: string[] = [];
  const actionsTaken: string[] = [];

  await openMatrix(page);
  actionsTaken.push('Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix read-only.');

  const beforeText = await matrixText(page);
  await writeText('target-027d4-010-page472-before-inspection.txt', beforeText);
  await screenshot(page, 'target-027d4-010-page472-before-inspection.png', {
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    step: 'Before Page Inspection / field-control mapping',
    status: 'accepted-page-context',
    visibleLearning: 'Page 472 must show the partial INLAND/VAT19 row and relevant matrix columns before any correction.',
    internallyProves: 'Page 472 visible context before diagnostic mapping.',
    doesNotProve: ['No corrected VAT matrix row', 'No Preview Posting', 'No Posting', 'No VAT Entries']
  });

  const fieldMap = {
    targetRow: compactEntries(await entries(page, /INLAND|VAT19/)),
    headers: compactEntries(await entries(page, /Beschreibung|MwSt\.?\s*%|MwSt\.-?Berechnungsart|Umsatzsteuerkonto|Vorsteuerkonto/i)),
    currentValues: compactEntries(await entries(page, /0|19|Normale MwSt|1406|3806|INLAND|VAT19/i))
  };
  await writeJson(path.join(EVIDENCE_DIR, 'target-027d4-field-control-map.json'), fieldMap);
  actionsTaken.push('Captured visible row/header/control map without editing values.');

  await page.keyboard.press('Control+Alt+F1').catch((error) => warnings.push(`Ctrl+Alt+F1 failed: ${String(error)}`));
  await page.waitForTimeout(2500);
  await assertContext(page);

  const inspectionText = await matrixText(page);
  const pageInspectionVisible =
    /Page Inspection|Inspect pages and data|Page ID|Page Name|Page Type|Source Table|Table ID|Seitenpr|Seitenuberprufung|Seitenueberpruefung/i.test(inspectionText) ||
    (await entries(page, /Page Inspection|Page ID|Source Table|Table ID|VAT Posting Setup|MwSt.-Buchungsmatrix/i)).length > 0;

  await writeText('target-027d4-020-after-page-inspection-shortcut.txt', inspectionText);
  await screenshot(page, 'target-027d4-020-after-page-inspection-shortcut.png', {
    page: 'Page 472 / Page Inspection attempt',
    step: 'After Ctrl+Alt+F1 Page Inspection shortcut',
    status: pageInspectionVisible ? 'technical-context-visible' : 'page-inspection-not-visible',
    visibleLearning: 'The screenshot shows whether Page Inspection is available in this browser context for Page 472.',
    internallyProves: pageInspectionVisible ? 'Technical inspection context or labels became visible.' : 'Shortcut did not expose a usable Page Inspection panel.',
    doesNotProve: ['No value correction', 'No cleanup', 'No Preview Posting', 'No Posting']
  });
  actionsTaken.push('Attempted Ctrl+Alt+F1 Page Inspection shortcut.');

  const mappedRequiredHeaders =
    fieldMap.headers.some((entry) => /Beschreibung/i.test(entry.text)) &&
    fieldMap.headers.some((entry) => /MwSt\.?\s*%/i.test(entry.text)) &&
    fieldMap.headers.some((entry) => /Umsatzsteuerkonto/i.test(entry.text)) &&
    fieldMap.headers.some((entry) => /Vorsteuerkonto/i.test(entry.text));
  const targetRowVisible =
    fieldMap.targetRow.some((entry) => /INLAND/i.test(entry.text)) &&
    fieldMap.targetRow.some((entry) => /VAT19/i.test(entry.text));

  if (!targetRowVisible) blockedBy.push('The partial INLAND/VAT19 row was not sufficiently visible in field-control mapping.');
  if (!mappedRequiredHeaders) blockedBy.push('Required Page 472 headers were not all visible in the field-control map.');
  if (!pageInspectionVisible) warnings.push('Page Inspection was not visibly opened; field mapping relies on visible row/header diagnostics.');

  const observed = targetRowVisible && mappedRequiredHeaders;
  const resultStatus = observed ? 'observed-field-map-no-write' : 'blocked';
  const nextCase = observed ? 'TARGET-027D5-VAT-MATRIX-CORRECTION-OR-CLEANUP' : 'TARGET-027D4B-VAT-MATRIX-PERSONALIZE-OR-MANUAL-FIELD-MAP';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-pageinspection-followup',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: {
      id: 472,
      name: 'MwSt.-Buchungsmatrix Einr. / VAT Posting Setup',
      url: sanitizeEvidenceUrl(page.url())
    },
    actionsTaken,
    actionsNotTaken: [
      'No value write',
      'No cleanup/delete',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch',
      'No VAT final claim'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: [
      ...(targetRowVisible ? ['The partial INLAND/VAT19 row is visible on Page 472.'] : []),
      ...(mappedRequiredHeaders ? ['The relevant Page 472 headers Beschreibung, MwSt. %, Umsatzsteuerkonto and Vorsteuerkonto are visible in the field-control map.'] : []),
      ...(pageInspectionVisible ? ['Page Inspection / technical inspection context became visible for Page 472.'] : [])
    ],
    notProved: [
      'No complete VAT Posting Setup row.',
      'No German 19 percent VAT calculation.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval.'
    ],
    screenshots: [
      'target-027d4-010-page472-before-inspection.png',
      'target-027d4-020-after-page-inspection-shortcut.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-027d4-vat-matrix-pageinspection-followup/TARGET-027D4-result.json',
      'playwright/projects/fibu-book5/evidence/target-027d4-vat-matrix-pageinspection-followup/target-027d4-field-control-map.json',
      'playwright/projects/fibu-book5/evidence/target-027d4-vat-matrix-pageinspection-followup/README.md'
    ],
    fieldControlMapSummary: {
      targetRowVisible,
      mappedRequiredHeaders,
      pageInspectionVisible,
      doNotRepeat: ['blind grid tab-flow', 'unverified card route', 'unverified list-cell value write'],
      recommendedNextRoute: observed
        ? 'Use the visible row/header map to design exactly one correction-or-cleanup case, with before/after/reopen proof.'
        : 'Use Personalize or manual Page Inspection route before any correction-or-cleanup write.'
    },
    blockedBy,
    warnings,
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-027D4-VAT-MATRIX-PAGEINSPECTION-FOLLOWUP',
      lastEvidenceSummary: 'TARGET-027D3 left the VAT matrix row incomplete; Page 472 needed field/control mapping before any correction.',
      isPlannedNextCaseStillSensible: true,
      reason: 'This run is diagnostic and prevents repeated blind writes on a partially wrong setup row.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027D5-VAT-MATRIX-CORRECTION-OR-CLEANUP',
          status: observed ? 'ready-next' : 'needs-ui-discovery-first',
          reason: observed ? 'Visible row/header mapping is now available.' : 'Field mapping is still incomplete.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting groups wait until the partial VAT matrix row is corrected or cleaned up.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for posting groups and VAT defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT/posting-group status.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: observed
        ? 'The next useful step is one controlled correction-or-cleanup case, not more diagnosis.'
        : 'A Personalize/manual field map is needed before any write.',
      risksBeforeNextCase: ['The partial INLAND/VAT19 row remains incomplete until corrected or cleaned.'],
      requiredPreparation: observed
        ? ['Use the row/header map from TARGET-027D4.', 'Define whether to correct the existing row or clean and recreate it.']
        : ['Use Personalize or another diagnostic route to expose missing controls.']
    },
    safeToFinalizeState: observed,
    requiresReview: !observed,
    statePatch: observed
      ? {
          current: {
            activeArea: 'universaarl-vat-matrix-correction-or-cleanup',
            activeCase: nextCase,
            active_case_file: '.agent/state/cases/target-027d5-vat-matrix-correction-or-cleanup.json',
            lastReferenceCase: CASE_ID,
            nextCase,
            nextStep: 'Use the Page 472 row/header map to correct or clean up the partial INLAND/VAT19 VAT matrix row; no Preview Posting or Posting.'
          },
          lastRunSummary: {
            runId: CASE_ID,
            caseId: CASE_ID,
            status: resultStatus,
            instance: EXPECTED_INSTANCE,
            company: TARGET_COMPANY,
            resultPath: 'playwright/projects/fibu-book5/evidence/target-027d4-vat-matrix-pageinspection-followup/TARGET-027D4-result.json',
            summary: 'Page 472 field/control mapping captured the partial INLAND/VAT19 row and relevant VAT matrix headers without writing values.',
            nextCase
          }
        }
      : {},
    nextCase,
    reason: observed
      ? 'Page 472 row/header mapping is sufficient to design one controlled correction-or-cleanup case.'
      : `Page 472 mapping remains blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-027D4 VAT Matrix Page Inspection Follow-up',
      '',
      `Status: ${resultStatus}`,
      '',
      'Dieser Lauf ist Diagnose-Evidence fuer Page 472. Er schreibt keine Werte und fuehrt keine Buchung aus.',
      '',
      '## Geprueft',
      '',
      '- Page 472 `MwSt.-Buchungsmatrix Einr.` in `playthru / UNIVERSAARL-DE`.',
      '- Partielle `INLAND`/`VAT19`-Zeile.',
      '- Sichtbare Header/Felder fuer Beschreibung, MwSt. %, Umsatzsteuerkonto und Vorsteuerkonto.',
      '- Page Inspection per `Ctrl+Alt+F1`, soweit im Browserkontext sichtbar.',
      '',
      '## Nicht gemacht',
      '',
      '- Keine Werteingabe.',
      '- Kein Cleanup/Delete.',
      '- Keine Stammdaten.',
      '- Kein Beleg/Draft.',
      '- Keine Preview.',
      '- Keine Buchung.',
      '- Kein API-Shortcut.',
      '',
      '## Naechster Schritt',
      '',
      nextCase,
      ''
    ].join('\n'),
    'utf8'
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
});
