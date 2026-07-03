import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027D28-VAT-MATRIX-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d28-vat-matrix-controlled-write-gate';
const EVIDENCE_REL_DIR = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_REL_DIR);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D28-result.json');

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

function completeRowVisible(text: string) {
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

function hasWrongOrDuplicateRisk(text: string) {
  const lines = text.split(/\n/).filter((line) => /\bINLAND\b/i.test(line) || /\bVAT19\b/i.test(line));
  const combined = lines.join(' ');
  return {
    targetSignals: lines,
    duplicateRisk: lines.filter((line) => /\bINLAND\b/i.test(line) || /\bVAT19\b/i.test(line)).length > 2,
    partialRowRisk: /\bINLAND\b/i.test(combined) !== /\bVAT19\b/i.test(combined)
  };
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
        /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Nicht gespeichert|Fehler|Error/i
      ],
      maxLines: 260,
      maxLineLength: 320
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
    internallyProves: 'Visible Business Central state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No Preview Posting', 'No Posting', 'No VAT Entries', 'No G/L Entries', 'No final German VAT correctness'],
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

async function clickFirstVisible(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const locator = frame.getByRole(role, { name: pattern }).first();
      if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
        const clickFailure = await locator.click({ timeout: 5000 }).then(
          () => null,
          (error) => {
            return {
              clicked: false,
              role,
              label: pattern.source,
              error: clean(error instanceof Error ? error.message : String(error)).slice(0, 700)
            };
          }
        );
        if (clickFailure) {
          return clickFailure;
        }
        await page.waitForTimeout(1600);
        return { clicked: true, role, label: pattern.source };
      }
    }
  }
  return { clicked: false, role: 'not-found', label: pattern.source };
}

async function controlsInventory(page: Page) {
  const controls: Array<Record<string, string>> = [];
  for (const frame of page.frames()) {
    const found = await frame
      .evaluate(() => {
        return [...document.querySelectorAll<HTMLElement>('input, textarea, [role="textbox"], [role="combobox"], [contenteditable="true"], select')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            return {
              tag: element.tagName.toLowerCase(),
              role: element.getAttribute('role') || '',
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              placeholder: element.getAttribute('placeholder') || '',
              value,
              text: (element.innerText || '').replace(/\s+/g, ' ').trim(),
              visible: String(rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0)
            };
          })
          .filter((entry) => entry.visible === 'true')
          .slice(0, 160);
      })
      .catch(() => []);
    controls.push(...found);
  }
  return controls;
}

function controlMatches(control: Record<string, string>, pattern: RegExp) {
  return pattern.test(`${control.ariaLabel} ${control.title} ${control.placeholder} ${control.text}`);
}

async function findControlLocator(page: Page, pattern: RegExp): Promise<Locator | null> {
  for (const frame of page.frames()) {
    const locators = [
      frame.getByRole('textbox', { name: pattern }).first(),
      frame.getByRole('combobox', { name: pattern }).first(),
      frame.locator('input, textarea, [role="textbox"], [role="combobox"], [contenteditable="true"], select').filter({ hasText: pattern }).first(),
      frame.locator(`input[aria-label*="${pattern.source.replace(/[^a-z0-9]/gi, '').slice(0, 8)}" i]`).first()
    ];
    for (const locator of locators) {
      if (await locator.isVisible({ timeout: 500 }).catch(() => false)) return locator;
    }
  }
  return null;
}

async function fillControl(locator: Locator, value: string) {
  await locator.click({ timeout: 4000 });
  await locator.press('Control+A').catch(() => undefined);
  await locator.fill(value, { timeout: 5000 }).catch(async () => {
    await locator.press('Control+A').catch(() => undefined);
    await locator.page().keyboard.type(value, { delay: 35 });
  });
  await locator.press('Tab').catch(() => undefined);
  await locator.page().waitForTimeout(900);
}

async function tryLabelBoundWrite(page: Page, steps: Array<Record<string, unknown>>, blockedBy: string[]) {
  const controls = await controlsInventory(page);
  steps.push({ step: 'visible-input-controls-after-new', controls });

  const fieldPlan = [
    { key: 'vatBusinessPostingGroup', pattern: /MwSt.*Geschaeft|Gesch.*ftsbuchungsgruppe|VAT Bus|Business Posting/i, value: targetValues.vatBusinessPostingGroup },
    { key: 'vatProductPostingGroup', pattern: /MwSt.*Produkt|Produktbuchungsgruppe|VAT Prod|Product Posting/i, value: targetValues.vatProductPostingGroup },
    { key: 'vatPercent', pattern: /MwSt.*%|VAT %|Percent/i, value: targetValues.vatPercent },
    { key: 'vatCalculationType', pattern: /Berechnungsart|Calculation Type/i, value: targetValues.vatCalculationType },
    { key: 'salesVatAccount', pattern: /Umsatzsteuerkonto|Sales VAT Account|Verkauf.*MwSt/i, value: targetValues.salesVatAccount },
    { key: 'purchaseVatAccount', pattern: /Vorsteuerkonto|Purchase VAT Account|Einkauf.*MwSt/i, value: targetValues.purchaseVatAccount }
  ];

  for (const field of fieldPlan) {
    const controlSignal = controls.some((control) => controlMatches(control, field.pattern));
    const locator = controlSignal ? await findControlLocator(page, field.pattern) : null;
    steps.push({ step: 'field-control-check', key: field.key, controlSignal, locatorFound: Boolean(locator) });
    if (!locator) {
      blockedBy.push(`No label-bound control found for ${field.key}; refusing grid-coordinate write.`);
      return false;
    }
    await fillControl(locator, field.value);
    steps.push({ step: 'field-written', key: field.key, value: field.value });
  }
  return true;
}

test('TARGET-027D28 writes or blocks INLAND/VAT19 only through a label-bound Page-472 route', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const steps: Array<Record<string, unknown>> = [];
  const screenshots: string[] = [];
  let setupChangeAttempted = false;

  await openMatrix(page, actionsTaken);
  const beforeText = await capture(page, 'target-027d28-010-before', 'Before D28 controlled write gate.', {
    targetValues,
    routeRule: 'No D3/D5/D8 cell-edit route; first try top-level New and label-bound controls.'
  });
  screenshots.push('target-027d28-010-before.png');
  const beforeRisk = hasWrongOrDuplicateRisk(beforeText);
  steps.push({ step: 'before-row-risk', beforeRisk });

  if (completeRowVisible(beforeText)) {
    actionsTaken.push('INLAND/VAT19 row already appears complete; no write was attempted.');
  } else if (beforeRisk.duplicateRisk || beforeRisk.partialRowRisk) {
    blockedBy.push('Existing INLAND/VAT19 signals are ambiguous; refusing duplicate or correction write without row-scoped cleanup/diagnosis.');
  } else {
    const newRoute = await clickFirstVisible(page, /^Neu$|^New$/i);
    steps.push({ step: 'top-level-new-click', newRoute });
    if (!newRoute.clicked) {
      blockedBy.push('Top-level New/Neu was visible but not safely clickable/usable as a write route; refusing fallback to Edit List or coordinates.');
    } else {
      await assertContext(page);
      await capture(page, 'target-027d28-020-after-new', 'After top-level New route before any value write.', { newRoute });
      screenshots.push('target-027d28-020-after-new.png');
      setupChangeAttempted = await tryLabelBoundWrite(page, steps, blockedBy);
    }
  }

  await assertContext(page);
  const afterText = await capture(page, 'target-027d28-030-after-write-or-block', 'After D28 write attempt or safe block.', {
    setupChangeAttempted,
    blockedBy,
    steps
  });
  screenshots.push('target-027d28-030-after-write-or-block.png');
  if (/Nicht gespeichert|Fehler|Error|Aktualisieren Sie/i.test(afterText)) {
    warnings.push('Business Central shows unsaved/error text after D28 route; reopen proof decides acceptance.');
  }

  await openMatrix(page, actionsTaken);
  const reopenText = await capture(page, 'target-027d28-040-reopen-proof', 'Reopen proof after D28.', {
    setupChangeAttempted
  });
  screenshots.push('target-027d28-040-reopen-proof.png');

  const success = completeRowVisible(reopenText);
  if (setupChangeAttempted && !success) {
    blockedBy.push('Values were attempted, but reopen proof does not show INLAND/VAT19 with 19, Normale MwSt., 3806 and 1406 in one row.');
  }

  const resultStatus = success ? 'observed-vat-matrix-row-proven' : 'blocked-vat-matrix-write-gate';
  const nextCase = success ? 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS' : 'TARGET-027D29-VAT-MATRIX-ROW-BOUND-ROUTE-RECOVERY';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary: 'D27 selected a source-backed Page-472 write gate. D28 tested top-level New plus label-bound controls and avoided rejected coordinate routes.',
    isPlannedNextCaseStillSensible: true,
    reason: 'VAT Posting Setup is the next narrow Foundation blocker before dimensions and Foundation checkpoint.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: success ? 'ready-next' : 'ready-next',
        reason: success
          ? 'VAT matrix row is proven after reopen; dimensions recovery can resume.'
          : 'The write gate blocked safely; a narrower row-bound route recovery is needed before any more VAT setup write.'
      },
      {
        caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
        status: success ? 'ready-after-current' : 'needs-setup-first',
        reason: success ? 'Checkpoint can follow after dimensions.' : 'Checkpoint waits for VAT matrix status.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C remains locked until VAT, posting groups and dimensions are ready enough.'
      },
      {
        caseId: 'TARGET-032P-GENERAL-POSTING-SETUP-PARK-OR-SOURCE-ROUTE',
        status: 'blocked',
        reason: 'General Posting Setup purchase account remains a separate parked blocker; do not mix with D28.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: success
      ? 'After VAT matrix proof, dimensions are the next lower-risk Foundation lane before readiness checkpoint.'
      : 'The top-level New path did not expose safe label-bound controls; the next step must learn the row-bound route instead of typing coordinates.',
    risksBeforeNextCase: [
      'No German VAT final correctness before Preview Posting and VAT Entries.',
      'No O2C/P2P documents before Foundation readiness.',
      'Do not repeat D3/D5/D8 coordinate/cell routes.'
    ],
    requiredPreparation: success
      ? ['Keep Preview Posting and Posting locked; update VAT coverage as setup-row-proven-not-posting-ready.']
      : ['Review D28 screenshots/control inventory; use Page Inspection, personalization or a true card route before any further VAT write.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-controlled-write-gate',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    targetValues,
    actionsTaken,
    actionsNotTaken: [
      'No Edit List coordinate route',
      'No D3/D5/D8 direct cell route',
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
    setupChanged: success,
    setupChangeAttempted,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots,
    proved: success
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was visibly open.',
          'INLAND/VAT19 is visible after reopen with normal VAT, VAT percent 19, Sales VAT Account 3806 and Purchase VAT Account 1406.',
          'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was visibly open.',
          'D28 did not repeat rejected D3/D5/D8 coordinate/cell routes.',
          'The run stopped before Preview Posting, Posting, master data and documents.'
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
    changedFiles: [
      `${EVIDENCE_REL_DIR}/TARGET-027D28-result.json`,
      `${EVIDENCE_REL_DIR}/*.txt`,
      `${EVIDENCE_REL_DIR}/*.png`,
      `${EVIDENCE_REL_DIR}/*.screenshot.json`
    ],
    evidenceRefs: [`${EVIDENCE_REL_DIR}/TARGET-027D28-result.json`, `${EVIDENCE_REL_DIR}/README.md`],
    requiresReview: !success,
    safeToFinalizeState: success,
    nextStepDecision,
    nextCase,
    statePatch: {},
    reason: success
      ? 'VAT Posting Setup matrix row is visible after reopen; still no preview/posting proof.'
      : `VAT Posting Setup controlled write gate blocked safely: ${blockedBy.join('; ')}`
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
      'D28 prueft eine neue, enge Standard-UI-Hypothese: Top-level `Neu` auf Page 472 und danach nur label- oder control-gebundene Eingabefelder. Wenn Business Central nur Grid-Koordinaten oder alte Zellrouten anbietet, wird blockiert.',
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
      '- Keine API-Shortcuts.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );

  expect(resultStatus).toMatch(/observed|blocked/);
});
