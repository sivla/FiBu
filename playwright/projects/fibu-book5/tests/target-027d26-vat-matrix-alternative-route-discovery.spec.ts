import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D26-VAT-MATRIX-ALTERNATIVE-ROUTE-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d26-vat-matrix-alternative-route-discovery';
const EVIDENCE_REL_DIR = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_REL_DIR);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D26-result.json');
const RESULT_REF = `${EVIDENCE_REL_DIR}/TARGET-027D26-result.json`;
const README_REF = `${EVIDENCE_REL_DIR}/README.md`;

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
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

async function collectText(page: Page) {
  return clean(await pageText(page));
}

async function collectCompactVatText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i,
        /INLAND|VAT19|MwSt\. %|VAT %|Normale MwSt|Normal VAT|Umsatzsteuerkonto|Sales VAT Account|Vorsteuerkonto|Purchase VAT Account/i,
        /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Kopieren|Copy|Konfiguration|Configuration/i
      ],
      maxLines: 180,
      maxLineLength: 260
    })
  );
}

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main, .modal-dialog');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 400 }).catch(() => ''));
      if (/\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|OK|Yes|Ja|Finish|New|Neu)\b/i.test(text)) {
        dialogs.push(text);
      }
    }
  }
  return dialogs;
}

async function visibleControls(page: Page) {
  const found = new Set<string>();
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link', 'checkbox', 'textbox', 'combobox'] as const) {
      const locators = await scope.getByRole(role).all().catch(() => []);
      for (const locator of locators.slice(0, 120)) {
        if (!(await locator.isVisible({ timeout: 120 }).catch(() => false))) continue;
        const label = clean(
          (await locator.getAttribute('aria-label').catch(() => null)) ??
            (await locator.getAttribute('title').catch(() => null)) ??
            (await locator.textContent().catch(() => null)) ??
            ''
        );
        if (label && /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Kopieren|Copy|Filtern|Filter|Suchen|Search|Personalisieren|Personalize/i.test(label)) {
          found.add(`${role}: ${label}`.slice(0, 200));
        }
      }
    }
  }
  return [...found].slice(0, 100);
}

async function hoverIfVisible(page: Page, pattern: RegExp, fallback: { x: number; y: number }) {
  for (const frame of page.frames()) {
    const locator = frame.getByText(pattern).first();
    if (await locator.isVisible({ timeout: 300 }).catch(() => false)) {
      await locator.hover({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(900);
      return true;
    }
  }
  await page.mouse.move(fallback.x, fallback.y).catch(() => undefined);
  await page.waitForTimeout(900);
  return false;
}

async function screenshot(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
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

test('TARGET-027D26 inventories VAT Posting Setup route read-only after Page 314 was parked', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const warnings: string[] = [];
  const blockedBy: string[] = [];

  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  actionsTaken.push('Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix directly in playthru / UNIVERSAARL-DE.');

  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);

  let firstText = await collectText(page);
  let pageVisible = /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i.test(firstText);
  let fallbackSearchUsed = false;
  if (!pageVisible) {
    fallbackSearchUsed = true;
    actionsTaken.push('Direct page=472 stayed on Role Center; used Tell Me search for MwSt.-Buchungsmatrix as a justified fallback route.');
    await searchFor(page, 'MwSt.-Buchungsmatrix');
    await openSearchResult(page, /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i, { requireUnique: false });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(2500);
    await page.keyboard.press('Escape').catch(() => undefined);
    firstText = await collectText(page);
    pageVisible = /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i.test(firstText);
  }
  const rowSignals = {
    inland: /\bINLAND\b/i.test(firstText),
    vat19: /\bVAT19\b/i.test(firstText),
    percent19: /\b19\b|19,00|19\.00/i.test(firstText),
    salesVatAccount3806: /\b3806\b/i.test(firstText),
    purchaseVatAccount1406: /\b1406\b/i.test(firstText),
    normalVat: /Normale MwSt|Normal VAT/i.test(firstText)
  };
  const controlsBefore = await visibleControls(page);
  const dialogsBefore = await dangerousDialogs(page);
  if (!pageVisible) blockedBy.push('Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix is not visibly open.');
  if (dialogsBefore.length > 0) blockedBy.push('A dangerous or confirmation-like dialog is visible; no interaction was continued.');

  const compactBefore = await collectCompactVatText(page);
  await writeText('target-027d26-010-page-472-readonly.txt', compactBefore || firstText || 'No VAT Posting Setup text captured.');
  await writeJson(path.join(EVIDENCE_DIR, 'target-027d26-010-page-472-readonly.snapshot.json'), {
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    pageVisible,
    fallbackSearchUsed,
    rowSignals,
    controls: controlsBefore,
    dangerousDialogs: dialogsBefore
  });
  await screenshot(page, 'target-027d26-010-page-472-readonly.png', {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step: 'Readonly route discovery after General Posting Setup was parked.',
    fallbackSearchUsed,
    visibleLearning:
      'Die MwSt.-Buchungsmatrix verbindet MwSt.-Geschaeftsbuchungsgruppe und MwSt.-Produktbuchungsgruppe mit Steuersatz, Berechnungsart und Steuerkonten.',
    internallyProves: pageVisible
      ? 'Page 472 is reachable in playthru / UNIVERSAARL-DE without setup writes.'
      : 'Page 472 was requested but not visibly proven.',
    doesNotProve: [
      'No VAT Posting Setup row is completed.',
      'No German VAT correctness is proven.',
      'No Preview Posting.',
      'No Posting.',
      'No VAT Entries.'
    ],
    qualityDecision: pageVisible ? 'accepted-readonly-page-context' : 'blocked'
  });

  const hoverSales = await hoverIfVisible(page, /Umsatzsteuerkonto|Sales VAT Account/i, { x: 1760, y: 610 });
  const hoverPurchase = await hoverIfVisible(page, /Vorsteuerkonto|Purchase VAT Account/i, { x: 1940, y: 610 });
  actionsTaken.push('Hovered VAT account header areas for tooltip/surface learning without clicking or typing.');
  const hoverText = await collectCompactVatText(page);
  await writeText('target-027d26-020-tooltip-surface.txt', hoverText || 'No tooltip/surface text captured.');
  await screenshot(page, 'target-027d26-020-tooltip-surface.png', {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step: 'Tooltip/surface hover over VAT account fields.',
    hoverSales,
    hoverPurchase,
    internallyProves: 'Hover probing is safe and does not write VAT setup values.',
    doesNotProve: ['No field editability', 'No value persistence']
  });

  const routeAssessment = {
    sourceBasis: [
      'Microsoft Learn: VAT Posting Setup combines VAT business/product posting groups with VAT %, calculation type and VAT G/L accounts.',
      'TARGET-027D25: item VAT19 value is only prerequisite evidence and does not prove the INLAND/VAT19 matrix row.',
      'TARGET-032P: General Posting Setup Page 314 purchase-account route is parked separately.'
    ],
    materiallyDifferentFromPriorRoutes: [
      'This run does not repeat D3/D5/D8/D14 cell-edit or List Edit value typing.',
      fallbackSearchUsed
        ? 'This run proves direct page=472 may fall back to Role Center and Tell Me search is the safer visible route for Page 472.'
        : 'This run only reopens and inventories Page 472 after a separate setup blocker was parked.',
      'Any future VAT write must be a new narrow gate, not a continuation of this read-only case.'
    ],
    routeChoice: pageVisible
      ? 'Create a separate controlled VAT matrix write-gate decision before any setup write.'
      : 'Recover Page 472 visibility before any setup write.'
  };

  if (!rowSignals.inland || !rowSignals.vat19) {
    warnings.push('The compact visible text did not prove both INLAND and VAT19 as row values in this run.');
  }
  if (!rowSignals.salesVatAccount3806 || !rowSignals.purchaseVatAccount1406 || !rowSignals.percent19 || !rowSignals.normalVat) {
    warnings.push('The visible read-only text does not prove a complete 19 percent INLAND/VAT19 VAT Posting Setup row with accounts 3806 and 1406.');
  }

  const resultStatus = blockedBy.length === 0 ? 'observed' : 'blocked';
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-027D27-VAT-MATRIX-CONTROLLED-WRITE-GATE-DECISION'
      : 'TARGET-027D26B-VAT-MATRIX-PAGE-472-VISIBILITY-RECOVERY';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary:
      'TARGET-032P parked the separate General Posting Setup purchase-account route; TARGET-027D25 kept VAT Posting Setup parked because item VAT19 is not a matrix row.',
    isPlannedNextCaseStillSensible: true,
    reason:
      'VAT Posting Setup remains the next separate W1 Foundation blocker and can be investigated read-only without document, preview or posting work.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-027D27-VAT-MATRIX-CONTROLLED-WRITE-GATE-DECISION',
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason:
          resultStatus === 'observed'
            ? 'Page 472 is visible; a separate source-backed write-gate can now decide exact target fields and stop rules.'
            : 'Page 472 visibility must be recovered first.'
      },
      {
        caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
        status: 'ready-after-current',
        reason: 'Dimensions should wait until VAT matrix write/park status is explicit.'
      },
      {
        caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
        status: 'ready-after-current',
        reason: 'Useful only after VAT and dimensions status are known.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C remains locked until VAT Posting Setup, posting groups and dimensions are sufficiently scoped.'
      }
    ],
    queueChangesMade: [`Select ${nextCase} after TARGET-027D26.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'A separate decision gate avoids turning read-only route discovery into an unsafe setup write.'
        : 'Page visibility must be fixed before any VAT value decision.',
    risksBeforeNextCase: [
      'Do not claim VAT correctness from item VAT19 or page visibility.',
      'Do not type 19/3806/1406 unless a new write gate explicitly unlocks those fields.',
      'Do not start master data, documents, Preview Posting or Posting before Foundation readiness.'
    ],
    requiredPreparation: [
      'Read TARGET-027D25 and TARGET-032P result JSONs.',
      'Use Microsoft Learn VAT setup source mapping before deciding the write gate.'
    ]
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-alternative-route-discovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    actionsTaken,
    actionsNotTaken: [
      'No New/Neu',
      'No Edit List/Liste bearbeiten',
      'No Copy/Kopieren',
      'No setup value write',
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
    screenshots: [
      'target-027d26-010-page-472-readonly.png',
      'target-027d26-020-tooltip-surface.png'
    ],
    rowSignals,
    routeAssessment,
    fallbackSearchUsed,
    proved:
      resultStatus === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix is reachable read-only.',
            'The run did not repeat prior VAT matrix cell-edit routes.',
            'VAT Posting Setup remains a separate prerequisite from item VAT product assignment and General Posting Setup.',
            'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'The run stopped before any write action.'
          ],
    notProved: [
      'No INLAND/VAT19 VAT Posting Setup row completion.',
      'No persisted VAT % 19.',
      'No persisted Sales VAT Account 3806.',
      'No persisted Purchase VAT Account 1406.',
      'No German VAT final correctness.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No Preview Posting.',
      'No Posting.'
    ],
    blockedBy,
    warnings,
    changedFiles: [
      RESULT_REF,
      README_REF,
      `${EVIDENCE_REL_DIR}/*.txt`,
      `${EVIDENCE_REL_DIR}/*.png`,
      `${EVIDENCE_REL_DIR}/*.screenshot.json`
    ],
    evidenceRefs: [
      RESULT_REF,
      README_REF
    ],
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    nextStepDecision,
    nextCase,
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case: nextCase,
        active_case_file: `.agent/state/cases/${nextCase.toLowerCase().replace(/_/g, '-').replace(/-+/g, '-')}.json`,
        activeCaseFile: `.agent/state/cases/${nextCase.toLowerCase().replace(/_/g, '-').replace(/-+/g, '-')}.json`,
        lastCompletedCase: CASE_ID,
        lastResultPath: RESULT_REF,
        nextCase,
        nextStep:
          resultStatus === 'observed'
            ? 'Decide a controlled VAT matrix write gate for INLAND/VAT19; keep documents, preview and posting locked.'
            : 'Recover Page 472 VAT Posting Setup visibility before any VAT write gate.',
        nextStepDecisionCard: nextStepDecision
      },
      lastRunSummary: {
        caseId: CASE_ID,
        resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        resultPath: RESULT_REF,
        setupChanged: false,
        masterDataChanged: false,
        draftCreated: false,
        previewPosting: false,
        posted: false,
        apiShortcut: false,
        summary:
          resultStatus === 'observed'
            ? 'TARGET-027D26 reopened Page 472 VAT Posting Setup read-only after Page 314 was parked and selected a separate VAT write-gate decision.'
            : `TARGET-027D26 blocked safely: ${blockedBy.join('; ')}`,
        nextCase,
        nextStepDecision
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'done' : 'blocked',
        completedAt: new Date().toISOString(),
        result:
          resultStatus === 'observed'
            ? 'Page 472 VAT Posting Setup reopened read-only; no setup values were changed; next is a separate controlled write-gate decision.'
            : `VAT matrix route discovery blocked: ${blockedBy.join('; ')}`,
        resultPath: RESULT_REF,
        nextCase
      },
      coverage: {
        currentCoverageFocus:
          resultStatus === 'observed'
            ? 'TARGET-027D26 proves Page 472 VAT Posting Setup read-only route after Page 314 park; VAT matrix write still needs a separate gate.'
            : 'TARGET-027D26 blocked Page 472 VAT route discovery; recover visibility before VAT matrix write.'
      }
    },
    reason:
      resultStatus === 'observed'
        ? 'Readonly VAT matrix route discovery succeeded; write remains locked for a separate decision gate.'
        : `Readonly VAT matrix route discovery blocked safely: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      'Read-only VAT Posting Setup route discovery for `playthru / UNIVERSAARL-DE`.',
      '',
      'This run deliberately did not click New, Edit List, Copy, Preview Posting, Post, Payment or API routes.',
      'It captures Page 472 as a separate W1 Foundation blocker after Page 314 General Posting Setup was parked.',
      '',
      `Result: ${resultStatus}`,
      `Next case: ${nextCase}`
    ].join('\n')
  );

  expect(resultStatus).toMatch(/observed|blocked/);
});
