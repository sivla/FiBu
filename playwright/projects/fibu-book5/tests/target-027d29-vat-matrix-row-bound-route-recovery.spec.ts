import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(210_000);

const CASE_ID = 'TARGET-027D29-VAT-MATRIX-ROW-BOUND-ROUTE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d29-vat-matrix-row-bound-route-recovery';
const EVIDENCE_REL_DIR = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_REL_DIR);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D29-result.json');

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId|upn/i.test(line))
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
        /MwSt\. %|VAT %|Berechnungsart|Calculation Type|Umsatzsteuerkonto|Sales VAT Account|Vorsteuerkonto|Purchase VAT Account/i,
        /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Personalisieren|Page Inspection|Seiten/i
      ],
      maxLines: 320,
      maxLineLength: 340
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
    internallyProves: 'Read-only Business Central UI state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No setup write', 'No Preview Posting', 'No Posting', 'No VAT Entries', 'No final German VAT correctness'],
    ...extra
  });
  return text;
}

async function openMatrix(page: Page, actionsTaken: string[]) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertContext(page);
  let text = await visibleText(page);
  if (!page472Visible(text)) {
    actionsTaken.push('Direct page=472 did not show Page 472; used Tell Me fallback for MwSt.-Buchungsmatrix.');
    await searchFor(page, 'MwSt.-Buchungsmatrix');
    await openSearchResult(page, /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i, { requireUnique: false });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(2500);
    await page.keyboard.press('Escape').catch(() => undefined);
    await assertContext(page);
    text = await visibleText(page);
  } else {
    actionsTaken.push('Opened Page 472 directly in playthru / UNIVERSAARL-DE.');
  }
  if (!page472Visible(text)) throw new Error('Page 472 VAT Posting Setup context is not visible.');
}

async function inventory(page: Page) {
  const all = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        return [...document.querySelectorAll<HTMLElement>('[role], button, input, textarea, select, a, [aria-label], [title]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = (element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (
              !text ||
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
              text: text.slice(0, 160),
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              tag: element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              ariaDisabled: element.getAttribute('aria-disabled') || '',
              ariaExpanded: element.getAttribute('aria-expanded') || '',
              ariaHasPopup: element.getAttribute('aria-haspopup') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(rect.y + rect.height / 2)
            };
          })
          .filter(Boolean)
          .slice(0, 420);
      })
      .catch(() => []);
    all.push(...entries);
  }
  return all;
}

function compactUnique<T extends Record<string, unknown>>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const value = key(item);
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(item);
  }
  return result;
}

async function hitTests(page: Page, patterns: RegExp[]) {
  const tests = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((sources) => {
        const patterns = sources.map((source) => new RegExp(source, 'i'));
        return [...document.querySelectorAll<HTMLElement>('[role], button, input, textarea, select, a, [aria-label], [title]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (!text || !patterns.some((pattern) => pattern.test(text)) || rect.width <= 1 || rect.height <= 1) return null;
            const centerX = Math.round(rect.x + rect.width / 2);
            const centerY = Math.round(rect.y + rect.height / 2);
            const hit = document.elementFromPoint(centerX, centerY) as HTMLElement | null;
            const hitText = hit
              ? (hit.innerText || hit.getAttribute('aria-label') || hit.getAttribute('title') || '').replace(/\s+/g, ' ').trim()
              : '';
            return {
              candidateText: text.slice(0, 160),
              candidateRole: element.getAttribute('role') || element.tagName.toLowerCase(),
              candidateAria: element.getAttribute('aria-label') || '',
              candidateRect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height), centerX, centerY },
              hitText: hitText.slice(0, 160),
              hitRole: hit?.getAttribute('role') || hit?.tagName.toLowerCase() || '',
              hitAria: hit?.getAttribute('aria-label') || '',
              sameElement: hit === element || element.contains(hit)
            };
          })
          .filter(Boolean)
          .slice(0, 100);
      }, patterns.map((pattern) => pattern.source))
      .catch(() => []);
    tests.push(...entries);
  }
  return compactUnique(tests as Array<Record<string, unknown>>, (item) => `${item.candidateText}|${JSON.stringify(item.candidateRect)}`).slice(0, 120);
}

test('TARGET-027D29 diagnoses Page 472 row-bound route read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const screenshots: string[] = [];

  await openMatrix(page, actionsTaken);
  await capture(page, 'target-027d29-010-page472-baseline', 'Baseline Page 472 before read-only route recovery.', {
    routeRule: 'Read-only only: no New click, no Edit List click, no typing, no setup write.'
  });
  screenshots.push('target-027d29-010-page472-baseline.png');

  const uiInventory = await inventory(page);
  const relevantInventory = compactUnique(
    uiInventory.filter((entry) => /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Weitere Optionen|More options|MwSt|VAT|Umsatzsteuerkonto|Vorsteuerkonto|Beschreibung/i.test(String(entry.text))),
    (entry) => `${entry.text}|${entry.role}|${entry.x}|${entry.y}`
  ).slice(0, 160);
  const pointerHitTests = await hitTests(page, [/^Neu$|^New$/i, /^Liste bearbeiten$|^Edit List$/i, /^Bearbeiten$|^Edit$/i, /MwSt|VAT|Umsatzsteuerkonto|Vorsteuerkonto/i]);
  await writeJson(path.join(EVIDENCE_DIR, 'target-027d29-ui-inventory.json'), { relevantInventory, pointerHitTests });
  actionsTaken.push('Captured read-only action/control inventory and pointer hit tests.');

  await capture(page, 'target-027d29-020-action-and-hit-test-inventory', 'After read-only action/hit-test inventory.', {
    relevantInventory: relevantInventory.slice(0, 60),
    pointerHitTests: pointerHitTests.slice(0, 40)
  });
  screenshots.push('target-027d29-020-action-and-hit-test-inventory.png');

  await page.keyboard.press('Control+Alt+F1').catch((error) => warnings.push(`Ctrl+Alt+F1 failed: ${clean(String(error)).slice(0, 180)}`));
  await page.waitForTimeout(2500);
  await assertContext(page);
  const inspectionText = await capture(page, 'target-027d29-030-page-inspection-probe', 'After Ctrl+Alt+F1 Page Inspection probe.', {
    shortcut: 'Control+Alt+F1'
  });
  screenshots.push('target-027d29-030-page-inspection-probe.png');
  const pageInspectionVisible = /Page Inspection|Seitenpr|VAT Posting Setup \(472|VAT Posting Setup \(325|Source Table|Table ID|Page ID/i.test(inspectionText);
  if (!pageInspectionVisible) warnings.push('Page Inspection did not expose a visible technical panel in this browser context.');

  await openMatrix(page, actionsTaken);
  const reopenText = await capture(page, 'target-027d29-040-reopen-no-write-proof', 'Reopen proof after read-only D29 diagnosis.', {
    pageInspectionVisible
  });
  screenshots.push('target-027d29-040-reopen-no-write-proof.png');

  const hasTargetValues =
    /\bINLAND\b/i.test(reopenText) &&
    /\bVAT19\b/i.test(reopenText) &&
    /\b19(?:,00|\.00)?\b/i.test(reopenText) &&
    /\b3806\b/i.test(reopenText) &&
    /\b1406\b/i.test(reopenText);
  if (hasTargetValues) {
    warnings.push('Target text signals appear in compact reopen text; manual screenshot review is required before any setup claim.');
  }

  blockedBy.push('D29 is read-only and did not prove a materially safe row-bound write route for INLAND/VAT19.');
  if (!pageInspectionVisible) blockedBy.push('Page Inspection panel was not visibly usable as a route explanation in this browser context.');

  const nextCase = 'TARGET-027D30-VAT-MATRIX-PARK-OR-SOURCE-ROUTE-DECISION';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary: 'D28 blocked the visible top-level New/label-bound write gate. D29 captured Page 472 action inventory, pointer hit tests and Page Inspection probe without writing setup values.',
    isPlannedNextCaseStillSensible: true,
    reason: 'VAT Posting Setup remains the active W1 Foundation blocker, but another live write would be premature without a new source-backed route decision.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: 'ready-next',
        reason: 'A local decision is needed to park Page 472 or choose a materially different route; no more blind UI attempts.'
      },
      {
        caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
        status: 'blocked',
        reason: 'Dimensions should wait until VAT matrix is either solved or explicitly parked with boundaries.'
      },
      {
        caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
        status: 'needs-setup-first',
        reason: 'Checkpoint needs explicit VAT-matrix status.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C remains locked until VAT/posting/dimension foundations are ready or consciously parked.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: 'D29 produced enough read-only UI truth to stop repeated Page-472 probing; the next step should be a source/route decision, not another write attempt.',
    risksBeforeNextCase: [
      'Repeating Page 472 grid or command-bar attempts without new route evidence.',
      'Claiming VAT setup readiness without a persisted row.',
      'Moving to documents before VAT/posting groups are solved or explicitly parked.'
    ],
    requiredPreparation: [
      'Review D28/D29 screenshots and UI inventory.',
      'Compare Page 472 route with Microsoft Learn/source options.',
      'Choose park/source-route before any further live VAT action.'
    ]
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-row-bound-route-recovery',
    resultStatus: 'blocked-readonly-route-recovery',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    actionsTaken,
    actionsNotTaken: [
      'No New/Neu click as write route',
      'No Edit List click',
      'No value typing',
      'No VAT Posting Setup write',
      'No General Posting Setup write',
      'No Dimensions write',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No payment',
      'No API shortcut',
      'No company switch'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    pageInspectionVisible,
    screenshots,
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was visibly open.',
      'D29 captured read-only action/control inventory and pointer hit tests.',
      'D29 did not click New/Neu or Edit List as a write route and did not type values.',
      'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      'No saved INLAND/VAT19 VAT Posting Setup row.',
      'No VAT percent 19 setup row.',
      'No Sales VAT Account 3806 setup row.',
      'No Purchase VAT Account 1406 setup row.',
      'No final German VAT correctness.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No posting readiness.'
    ],
    blockedBy,
    warnings,
    evidenceRefs: [`${EVIDENCE_REL_DIR}/TARGET-027D29-result.json`, `${EVIDENCE_REL_DIR}/README.md`, `${EVIDENCE_REL_DIR}/target-027d29-ui-inventory.json`],
    changedFiles: [
      `${EVIDENCE_REL_DIR}/TARGET-027D29-result.json`,
      `${EVIDENCE_REL_DIR}/target-027d29-ui-inventory.json`,
      `${EVIDENCE_REL_DIR}/*.txt`,
      `${EVIDENCE_REL_DIR}/*.png`,
      `${EVIDENCE_REL_DIR}/*.screenshot.json`
    ],
    requiresReview: true,
    safeToFinalizeState: false,
    nextStepDecision,
    nextCase,
    statePatch: {},
    reason: 'Read-only D29 route recovery did not prove a safe Page-472 write route; next step is local park/source-route decision.'
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
      'D29 ist absichtlich read-only. Nach dem blockierten D28-Write-Gate wird Page 472 nicht erneut mit Zellklicks oder `Neu`/`Liste bearbeiten` beschrieben. Stattdessen sammelt der Lauf Action-Inventar, Pointer-Hit-Tests und Page-Inspection-Signale.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine VAT-Setup-Werte geschrieben.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine Stammdaten.',
      '- Keine Belege.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );

  expect(result.resultStatus).toBe('blocked-readonly-route-recovery');
});
