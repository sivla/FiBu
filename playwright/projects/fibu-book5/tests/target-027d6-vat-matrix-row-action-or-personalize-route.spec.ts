import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027D6-VAT-MATRIX-ROW-ACTION-OR-PERSONALIZE-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d6-vat-matrix-row-action-or-personalize-route';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D6-result.json');

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

async function compactMatrixText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i,
        /INLAND|VAT19|Inland|Umsatzsteuerkonto|Vorsteuerkonto|MwSt\. %|Normale MwSt/i,
        /Personalisieren|Wird personalisiert|Fertig|Weitere Optionen|Aktionen|Details|Karte|Bearbeiten|Seitenueberpruefung|Page Inspection/i
      ],
      maxLines: 260,
      maxLineLength: 320
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

async function collectControls(page: Page, pattern: RegExp) {
  const found = new Set<string>();
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link', 'checkbox', 'textbox', 'combobox'] as const) {
      const locators = await frame.getByRole(role).all().catch(() => []);
      for (const locator of locators.slice(0, 100)) {
        if (!(await locator.isVisible({ timeout: 100 }).catch(() => false))) continue;
        const label = clean(
          (await locator.getAttribute('aria-label').catch(() => null)) ??
            (await locator.getAttribute('title').catch(() => null)) ??
            (await locator.textContent().catch(() => null)) ??
            ''
        );
        if (label && pattern.test(label)) found.add(`${role}: ${label}`.slice(0, 180));
      }
    }
  }
  return [...found].slice(0, 120);
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

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await visibleText(page);
  const compact = await compactMatrixText(page);
  const controls = await collectControls(page, /Personalisieren|Personalize|Wird personalisiert|Fertig|Done|Weitere Optionen|More options|Aktionen|Actions|Details|Karte|Bearbeiten|Edit|Seitenueberpruefung|Page Inspection|Umsatzsteuerkonto|Vorsteuerkonto|MwSt/i);
  const snapshot = {
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compactText: compact || text,
    controls,
    signals: {
      page472Visible: /MwSt\.-?Buchungsmatrix|VAT Posting Setup/i.test(text),
      inlandVat19Visible: /\bINLAND\b/i.test(text) && /\bVAT19\b/i.test(text),
      personalizationVisible: /Wird personalisiert|Personalizing|Fertig|Done|Personalisieren|Personalize/i.test(text),
      pageInspectionVisible: /Seitenueberpruefung|Page Inspection|VAT Posting Setup \(472|VAT Posting Setup \(325/i.test(text),
      dangerousDialogVisible: await dangerousDialogVisible(page)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.compactText);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), { step, snapshot });
  await screenshot(page, `${filePrefix}.png`, {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step,
    status: 'row-action-personalize-route-discovery',
    visibleLearning: 'Das Bild muss zeigen, welche Business-Central-Route oder welcher Kontext wirklich sichtbar ist.',
    internallyProves: 'Page-472 UI route discovery in playthru / UNIVERSAARL-DE without value write.',
    doesNotProve: ['No VAT matrix completion', 'No Preview Posting', 'No Posting', 'No master data'],
    qualityDecision: 'diagnostic',
    snapshot
  });
  return snapshot;
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

async function locateTargetRow(page: Page) {
  const row = (await entries(page, /INLAND|VAT19/))
    .filter((entry) => entry.y > 120)
    .filter((entry) => /INLAND|VAT19/i.test(entry.text))
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (!row) throw new Error('No INLAND/VAT19 row anchor visible on Page 472.');
  return { x: row.x + Math.min(Math.round(row.width / 2), 70), y: row.y + Math.round(Math.min(row.height, 38) / 2), row };
}

async function clickIfVisible(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const candidate = frame.getByRole(role, { name: pattern }).first();
      if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
        await candidate.click({ timeout: 4000 }).catch(async () => candidate.click({ timeout: 4000, force: true }));
        await page.waitForTimeout(1000);
        return true;
      }
    }
    const text = frame.getByText(pattern).first();
    if (await text.isVisible({ timeout: 700 }).catch(() => false)) {
      await text.click({ timeout: 4000 }).catch(async () => text.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(1000);
      return true;
    }
  }
  return false;
}

async function openSettingsThenPersonalize(page: Page) {
  await clickIfVisible(page, /^Einstellungen$|^Settings$|^Einstell/i);
  await page.waitForTimeout(800);
  const opened = await clickIfVisible(page, /Personalisieren|Personalize|Anpassen/i);
  await page.waitForTimeout(1200);
  return opened;
}

async function leavePersonalizeIfVisible(page: Page) {
  const text = await visibleText(page);
  if (!/Wird personalisiert|Personalizing|Fertig|Done/i.test(text)) return false;
  const left = await clickIfVisible(page, /^Fertig$|^Done$/i);
  await page.waitForTimeout(1000);
  return left;
}

async function hoverHeaderOrCell(page: Page, pattern: RegExp, fallback: { x: number; y: number }) {
  const candidate = (await entries(page, pattern))
    .filter((entry) => entry.y > 110)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  const x = candidate ? candidate.x + Math.round(candidate.width / 2) : fallback.x;
  const y = candidate ? candidate.y + Math.round(candidate.height / 2) : fallback.y;
  await page.mouse.move(x, y);
  await page.waitForTimeout(1300);
  return { x, y, candidate };
}

test('TARGET-027D6 discovers row action, Personalize and inspection route without repeating cell edits', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const steps: Array<Record<string, unknown>> = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openMatrix(page);
  const before = await captureState(page, 'target-027d6-010-page-472-before-route-discovery', 'Page 472 before D6 route discovery.');
  const target = await locateTargetRow(page);
  steps.push({ step: 'target-row-anchor', row: target.row, point: { x: target.x, y: target.y } });

  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(600);
  await assertContext(page);

  await page.mouse.click(target.x + 18, target.y, { button: 'right' });
  await page.waitForTimeout(900);
  await assertContext(page);
  const contextMenu = await captureState(page, 'target-027d6-020-row-context-click-state', 'After right-clicking the INLAND/VAT19 row anchor.', {
    routeProbe: 'row-context-menu',
    routeMustBeDifferentFromD3D5: true
  });

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(700);
  await assertContext(page);

  const moreOptionsClicked = await clickIfVisible(page, /Weitere Optionen|More options/i);
  await assertContext(page);
  const moreOptions = await captureState(page, 'target-027d6-030-more-options-state', 'After opening More options if available.', {
    routeProbe: 'more-options-or-action-menu',
    moreOptionsClicked
  });

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(700);
  await assertContext(page);

  const hoverSales = await hoverHeaderOrCell(page, /Umsatzsteuerkonto|Sales VAT Account/i, { x: target.x + 1220, y: target.y });
  const salesHover = await captureState(page, 'target-027d6-040-sales-vat-account-hover', 'Hover over Sales VAT Account / Umsatzsteuerkonto area.', {
    routeProbe: 'tooltip',
    hover: hoverSales
  });

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  await assertContext(page);

  const hoverPurchase = await hoverHeaderOrCell(page, /Vorsteuerkonto|Purchase VAT Account/i, { x: target.x + 1380, y: target.y });
  const purchaseHover = await captureState(page, 'target-027d6-050-purchase-vat-account-hover', 'Hover over Purchase VAT Account / Vorsteuerkonto area.', {
    routeProbe: 'tooltip',
    hover: hoverPurchase
  });

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  await assertContext(page);

  const personalizeOpened = await openSettingsThenPersonalize(page);
  await assertContext(page);
  const personalize = await captureState(page, 'target-027d6-060-personalize-state', 'Personalize mode or settings state after trying the standard BC Personalize route.', {
    routeProbe: 'personalize',
    personalizeOpened
  });
  const personalizeLeft = await leavePersonalizeIfVisible(page);
  const personalizeWrongTarget = personalizeOpened && !personalize.signals.page472Visible;
  steps.push({ step: 'personalize', personalizeOpened, personalizeLeft, personalizeWrongTarget });
  if (personalizeWrongTarget) {
    warnings.push('Settings -> Personalize opened Role Center personalization instead of Page 472 personalization; marked as wrong-target evidence.');
  }
  await assertContext(page);

  const afterPersonalizeText = await visibleText(page);
  if (!/MwSt\.-?Buchungsmatrix|VAT Posting Setup/i.test(afterPersonalizeText)) {
    await openMatrix(page);
    await captureState(page, 'target-027d6-065-page-472-reopened-after-wrong-target-personalize', 'Page 472 reopened after wrong-target Personalize state.', {
      routeProbe: 'reopen-after-personalize',
      personalizeWrongTarget
    });
  }

  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+Alt+F1');
  await page.waitForTimeout(1800);
  await assertContext(page);
  const inspection = await captureState(page, 'target-027d6-070-page-inspection-after-target-row-focus', 'Page Inspection after focusing the INLAND/VAT19 row.', {
    routeProbe: 'page-inspection'
  });

  const finalText = await visibleText(page);
  const pageInspectionWorks =
    /Page Inspection|Seitenueberpruefung|VAT Posting Setup \(472|VAT Posting Setup \(325|MwSt\.-Buchungsmatrix/i.test(finalText) &&
    /VAT Posting Setup|MwSt\.-Buchungsmatrix|INLAND|VAT19/i.test(finalText);
  const personalizeWorks = Boolean(personalizeOpened && personalize.signals.personalizationVisible);
  const routeShowsAccountFields =
    /Umsatzsteuerkonto|Vorsteuerkonto|Sales VAT Account|Purchase VAT Account/i.test(
      [salesHover.compactText, purchaseHover.compactText, personalize.compactText, inspection.compactText].join('\n')
    );

  if (!pageInspectionWorks) blockedBy.push('Page Inspection did not produce a clearly accepted target-row field/value proof in the captured text.');
  if (!routeShowsAccountFields) blockedBy.push('No row action, tooltip, Personalize or inspection route exposed a stronger VAT account field editing path.');
  if (!personalizeWorks) warnings.push('Personalize route was not visibly accepted on Page 472 in this run.');
  if (!moreOptionsClicked) warnings.push('More options/action menu was not opened by an accessible label in this run.');

  const resultStatus = blockedBy.length === 0 ? 'observed-ui-discovery-no-write' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-row-action-or-personalize-route',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actionsTaken: [
      'Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix in playthru / UNIVERSAARL-DE.',
      'Selected the visible INLAND/VAT19 row anchor.',
      'Tried a row context-click route without choosing destructive menu items.',
      'Opened More options if available and captured the visible state.',
      'Hovered Sales VAT Account and Purchase VAT Account areas for tooltip evidence.',
      'Tried the standard Settings -> Personalize route and left Personalize mode if visible.',
      'Opened Page Inspection after focusing the target row.',
      'Stopped before any value write, master data, document draft, Preview Posting or Posting.'
    ],
    actionsNotTaken: [
      'No cell-edit typing',
      'No setup value write',
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
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix remained the scoped page.',
      'The run did not repeat D3/D5 cell-edit typing for VAT account fields.',
      'Row context, More options, hover/tooltip, Personalize and Page Inspection routes were captured as separate UI hypotheses.',
      'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      'No VAT Posting Setup matrix completion.',
      'No persisted Sales VAT Account 3806 or Purchase VAT Account 1406 in the INLAND/VAT19 row.',
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval.'
    ],
    screenshots: [
      'target-027d6-010-page-472-before-route-discovery.png',
      'target-027d6-020-row-context-click-state.png',
      'target-027d6-030-more-options-state.png',
      'target-027d6-040-sales-vat-account-hover.png',
      'target-027d6-050-purchase-vat-account-hover.png',
      'target-027d6-060-personalize-state.png',
      'target-027d6-065-page-472-reopened-after-wrong-target-personalize.png',
      'target-027d6-070-page-inspection-after-target-row-focus.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-027d6-vat-matrix-row-action-or-personalize-route/TARGET-027D6-result.json',
      'playwright/projects/fibu-book5/evidence/target-027d6-vat-matrix-row-action-or-personalize-route/README.md'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-027d6-vat-matrix-row-action-or-personalize-route/TARGET-027D6-result.json',
      'playwright/projects/fibu-book5/evidence/target-027d6-vat-matrix-row-action-or-personalize-route/*.txt',
      'playwright/projects/fibu-book5/evidence/target-027d6-vat-matrix-row-action-or-personalize-route/*.png',
      'playwright/projects/fibu-book5/evidence/target-027d6-vat-matrix-row-action-or-personalize-route/*.screenshot.json'
    ],
    blockedBy,
    warnings,
    steps,
    routeObservations: {
      beforeSignals: before.signals,
      contextMenuSignals: contextMenu.signals,
      moreOptionsSignals: moreOptions.signals,
      salesHoverSignals: salesHover.signals,
      purchaseHoverSignals: purchaseHover.signals,
      personalizeSignals: personalize.signals,
      inspectionSignals: inspection.signals,
      personalizeOpened,
      personalizeLeft,
      personalizeWrongTarget,
      moreOptionsClicked,
      routeShowsAccountFields,
      pageInspectionWorks
    },
    flags: {
      noCleanupDelete: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noBlindGridTabFlow: true,
      noCellEditTyping: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-027D5 blocked safely because Sales VAT Account and Purchase VAT Account cells did not expose true active editors.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The incomplete INLAND/VAT19 VAT Posting Setup row still blocks posting groups, master data and first document cases; D6 tests new UI routes instead of repeating cell edits.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'VAT matrix row is still incomplete or unproven.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT setup and posting group defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT matrix, posting groups and dimension/default decisions.'
        },
        {
          caseId: 'TARGET-031-FIRST-DOCUMENT-DRAFT-GATE',
          status: 'needs-setup-first',
          reason: 'First document draft waits for master data and complete setup gates.'
        }
      ],
      queueChangesMade:
        blockedBy.length === 0
          ? ['Keep VAT matrix completion blocked until a follow-up write route is explicitly selected from D6 evidence.']
          : ['Park direct matrix completion until a stronger source-backed route, personalization field route, or controlled cleanup decision exists.'],
      selectedNextCase:
        blockedBy.length === 0
          ? 'TARGET-027D7-VAT-MATRIX-ROUTE-DECISION-AFTER-D6'
          : 'TARGET-027D7-VAT-MATRIX-SOURCE-OR-CLEANUP-DECISION',
      whySelectedNextCaseIsBest:
        blockedBy.length === 0
          ? 'D6 produced new route evidence but did not write values; the next case must decide the bounded write path from that evidence.'
          : 'D6 did not expose a safe account-field editor route; the next case should stop UI repetition and choose a source-backed alternate route or cleanup decision.',
      risksBeforeNextCase: [
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.',
        'Do not create master data until VAT and posting setup gates are complete.',
        'Do not repeat D3/D5 list-cell typing for 3806/1406.'
      ],
      requiredPreparation: [
        'Review D6 screenshots and Page Inspection/Personalize evidence.',
        'Decide whether Page 472 can be completed through a new route or whether the partial row must be cleaned/recreated with a different standard UI path.'
      ]
    },
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea:
          blockedBy.length === 0 ? 'universaarl-vat-matrix-route-decision-after-d6' : 'universaarl-vat-matrix-source-or-cleanup-decision',
        activeCase:
          blockedBy.length === 0 ? 'TARGET-027D7-VAT-MATRIX-ROUTE-DECISION-AFTER-D6' : 'TARGET-027D7-VAT-MATRIX-SOURCE-OR-CLEANUP-DECISION',
        active_case_file:
          blockedBy.length === 0
            ? '.agent/state/cases/target-027d7-vat-matrix-route-decision-after-d6.json'
            : '.agent/state/cases/target-027d7-vat-matrix-source-or-cleanup-decision.json',
        lastReferenceCase: CASE_ID,
        nextCase:
          blockedBy.length === 0 ? 'TARGET-027D7-VAT-MATRIX-ROUTE-DECISION-AFTER-D6' : 'TARGET-027D7-VAT-MATRIX-SOURCE-OR-CLEANUP-DECISION',
        nextStep:
          blockedBy.length === 0
            ? 'Review D6 route evidence and select a bounded non-cell-edit completion path for Page 472.'
            : 'Stop repeating Page 472 cell-edit routes; decide source-backed alternate route or controlled partial-row cleanup.'
      },
      lastRunSummary: {
        runId: CASE_ID,
        caseId: CASE_ID,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        resultPath: 'playwright/projects/fibu-book5/evidence/target-027d6-vat-matrix-row-action-or-personalize-route/TARGET-027D6-result.json',
        summary: 'D6 captured row action, More options, tooltip, Personalize and Page Inspection routes without writing setup values.',
        nextCase:
          blockedBy.length === 0 ? 'TARGET-027D7-VAT-MATRIX-ROUTE-DECISION-AFTER-D6' : 'TARGET-027D7-VAT-MATRIX-SOURCE-OR-CLEANUP-DECISION'
      }
    },
    nextCase:
      blockedBy.length === 0 ? 'TARGET-027D7-VAT-MATRIX-ROUTE-DECISION-AFTER-D6' : 'TARGET-027D7-VAT-MATRIX-SOURCE-OR-CLEANUP-DECISION',
    reason:
      blockedBy.length === 0
        ? 'D6 produced new UI route evidence but no setup value write.'
        : `D6 remains blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      'Zweck: Page 472 MwSt.-Buchungsmatrix nach D5 mit neuen, sichtbaren UI-Routen untersuchen.',
      '',
      'Ergebnis:',
      `- Status: ${resultStatus}`,
      '- Instanz: playthru',
      '- Company: UNIVERSAARL-DE',
      '- Keine Zellwerte geschrieben.',
      '- Keine Stammdaten, keine Belege, keine Buchungsvorschau, keine Buchung.',
      '',
      'Gepruefte Routen:',
      '- Zeilen-/Kontextmenue auf der INLAND/VAT19-Zeile',
      '- Weitere Optionen / Action-Menue',
      '- Hover/Tooltip fuer Umsatzsteuerkonto und Vorsteuerkonto',
      '- Einstellungen -> Personalisieren',
      '- Ctrl+Alt+F1 Seitenueberpruefung',
      '',
      'Grenze:',
      '- Die INLAND/VAT19-Zeile ist dadurch noch nicht vollstaendig.',
      '- 3806/1406 sind nicht als persistierte Matrixkonten bewiesen.',
      '- Keine deutsche Umsatzsteuer-Finalbehauptung.'
    ].join('\n')
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noCellEditTyping).toBe(true);
});
