import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-072-VAT-PAGE472-NAVIGATION-ROUTE-DECISION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-072-vat-page472-navigation-route-decision';
const EVIDENCE_REL_DIR = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_REL_DIR);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-072-result.json');

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId|parentPageOrigin|upn|access[_-]?token|refresh[_-]?token/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId?: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  if (pageId) url.searchParams.set('page', String(pageId));
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
  return /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup|VAT Bus\.|VAT Prod\.|MwSt\. %|VAT %|Umsatzsteuerkonto|Sales VAT Account|Vorsteuerkonto|Purchase VAT Account/i.test(text);
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

async function page472Text(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup/i,
        /VAT Bus|VAT Prod|Gesch.*ftsbuchungsgruppe|Produktbuchungsgruppe|MwSt\. %|VAT %|Berechnungsart|Calculation Type/i,
        /Umsatzsteuerkonto|Sales VAT Account|Vorsteuerkonto|Purchase VAT Account|INLAND|VAT19|1406|3806|19/i,
        /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Suchen|Search|Kopieren|Copy|Personalisieren|Personalize/i
      ],
      maxLines: 260,
      maxLineLength: 300
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
      if (/\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|OK|Yes|Ja|Finish|Fertig|Next|Weiter|Import|Export|Validate)\b/i.test(text)) {
        dialogs.push(text.slice(0, 500));
      }
    }
  }
  return dialogs;
}

async function visibleControls(page: Page) {
  const found = new Set<string>();
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link', 'checkbox', 'textbox', 'combobox'] as const) {
      const count = await scope.getByRole(role).count().catch(() => 0);
      for (let index = 0; index < Math.min(count, 120); index += 1) {
        const locator = scope.getByRole(role).nth(index);
        if (!(await locator.isVisible({ timeout: 120 }).catch(() => false))) continue;
        const label = clean(
          (await locator.getAttribute('aria-label').catch(() => null)) ??
            (await locator.getAttribute('title').catch(() => null)) ??
            (await locator.textContent().catch(() => null)) ??
            ''
        );
        if (label && /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Kopieren|Copy|Filtern|Filter|Suchen|Search|Personalisieren|Personalize|Page Inspection|Seiten/i.test(label)) {
          found.add(`${role}: ${label}`.slice(0, 220));
        }
      }
    }
  }
  return [...found].slice(0, 100);
}

async function tooltipProbe(page: Page, pattern: RegExp, fallback: { x: number; y: number }) {
  for (const scope of [page, ...page.frames()]) {
    const target = scope.getByText(pattern).first();
    if (await target.isVisible({ timeout: 500 }).catch(() => false)) {
      await target.hover({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(900);
      return {
        matched: true,
        text: clean(await pageText(page).catch(() => '')).split('\n').filter((line) => pattern.test(line) || /Tooltip|Quick info|Hilfe|Help|Account|Konto|MwSt|VAT/i.test(line)).slice(0, 40)
      };
    }
  }
  await page.mouse.move(fallback.x, fallback.y).catch(() => undefined);
  await page.waitForTimeout(900);
  return { matched: false, text: clean(await pageText(page).catch(() => '')).split('\n').slice(0, 20) };
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

async function capture(page: Page, prefix: string, step: string, metadata: Record<string, unknown> = {}) {
  const text = await page472Text(page);
  await writeText(`${prefix}.txt`, text || 'No compact Page-472 text captured.');
  await screenshot(page, `${prefix}.png`, {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step,
    url: sanitizeEvidenceUrl(page.url()),
    visibleLearning: 'Die MwSt.-Buchungsmatrix ist die Seite, auf der Business Central die Kombination aus MwSt.-Geschaeftsbuchungsgruppe, MwSt.-Produktbuchungsgruppe, Steuersatz und Steuerkonten verwaltet.',
    internallyProves: 'Read-only navigation/surface state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No VAT setup value persisted', 'No Preview Posting', 'No Posting', 'No VAT Entries', 'No final German VAT correctness'],
    ...metadata
  });
  return text;
}

test('TARGET-072 documents a bounded read-only Page 472 navigation route before any VAT write gate', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const routeSteps: Array<Record<string, unknown>> = [];

  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  actionsTaken.push('Opened direct page=472 URL in playthru / UNIVERSAARL-DE.');
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);

  let directText = await visibleText(page);
  const directPageVisible = page472Visible(directText);
  routeSteps.push({
    route: 'direct-page-472-url',
    accepted: directPageVisible,
    url: sanitizeEvidenceUrl(page.url()),
    textSignals: directText.split('\n').slice(0, 60)
  });
  await capture(page, 'target-072-010-direct-page-route', 'Direct page=472 route probe.', {
    qualityDecision: directPageVisible ? 'accepted-direct-page-route' : 'blocked-direct-page-route'
  });

  let searchRouteUsed = false;
  let pageVisible = directPageVisible;
  if (!pageVisible) {
    searchRouteUsed = true;
    actionsTaken.push('Opened Tell-Me visibly and searched for MwSt.-Buchungsmatrix as an explicit user navigation route.');
    await searchFor(page, 'MwSt.-Buchungsmatrix');
    await page.waitForTimeout(1200);
    const searchText = await visibleText(page);
    routeSteps.push({
      route: 'visible-tell-me-search-before-click',
      accepted: /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i.test(searchText),
      textSignals: searchText.split('\n').filter((line) => /MwSt|VAT|Buchungsmatrix|Setup|Einrichtung/i.test(line)).slice(0, 80)
    });
    await capture(page, 'target-072-020-visible-search-candidates', 'Visible search candidates before opening the result.', {
      qualityDecision: 'navigation-candidate-only',
      searchTerm: 'MwSt.-Buchungsmatrix'
    });
    await openSearchResult(page, /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i, { requireUnique: false });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(2500);
    await page.keyboard.press('Escape').catch(() => undefined);
    actionsTaken.push('Opened the visible MwSt.-Buchungsmatrix / VAT Posting Setup search result read-only.');
    expect(instancePathIsTarget(page.url()), `Wrong instance URL after search route: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
    expect(companyParamIsTarget(page.url()), `Wrong company URL after search route: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
    const searchResultText = await visibleText(page);
    pageVisible = page472Visible(searchResultText);
    routeSteps.push({
      route: 'visible-tell-me-result-opened',
      accepted: pageVisible,
      url: sanitizeEvidenceUrl(page.url()),
      textSignals: searchResultText.split('\n').filter((line) => /MwSt|VAT|Buchungsmatrix|Setup|Einrichtung|INLAND|VAT19|1406|3806/i.test(line)).slice(0, 100)
    });
  }

  const pageTextAfterNavigation = await capture(page, 'target-072-030-page472-after-navigation', 'Page 472 context after bounded navigation route.', {
    searchRouteUsed,
    qualityDecision: pageVisible ? 'accepted-page472-navigation' : 'blocked-no-page472-context'
  });
  const controls = await visibleControls(page);
  const dialogs = await dangerousDialogs(page);
  const tooltipSales = await tooltipProbe(page, /Umsatzsteuerkonto|Sales VAT Account/i, { x: 1700, y: 610 });
  const tooltipPurchase = await tooltipProbe(page, /Vorsteuerkonto|Purchase VAT Account/i, { x: 1880, y: 610 });
  await capture(page, 'target-072-040-tooltip-and-action-surface', 'Tooltip and action surface after Page 472 route decision.', {
    controls,
    tooltipSales,
    tooltipPurchase,
    dangerousDialogs: dialogs,
    qualityDecision: 'surface-learning-no-write'
  });

  if (!pageVisible) blockedBy.push('Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix is still not visibly proven after bounded navigation.');
  if (dialogs.length > 0) blockedBy.push(`Dangerous or confirmation-like dialog visible: ${dialogs.join(' | ')}`);
  if (controls.some((entry) => /Neu|New|Edit|Bearbeiten|Liste bearbeiten|Copy|Kopieren/i.test(entry))) {
    warnings.push('Write-capable actions are visible on the page, but TARGET-072 did not click them.');
  }

  const resultStatus = blockedBy.length === 0 ? 'observed-page472-navigation-route' : 'blocked-page472-navigation-route';
  const nextCase = blockedBy.length === 0
    ? 'TARGET-071-VAT-POSTING-SETUP-PAGE472-CONTROLLED-WRITE-GATE'
    : 'TARGET-068-W1-FOUNDATION-READY-CHECKPOINT-AFTER-DIMENSION-PARK';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary: 'TARGET-071 blocked because direct page=472 stayed outside accepted Page 472 context. No setup write was attempted.',
    isPlannedNextCaseStillSensible: true,
    reason: 'A read-only navigation decision is the narrowest useful next step before repeating any VAT setup write gate.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-071-VAT-POSTING-SETUP-PAGE472-CONTROLLED-WRITE-GATE',
        status: blockedBy.length === 0 ? 'ready-next' : 'blocked',
        reason: blockedBy.length === 0
          ? 'Page 472 is now visibly reachable through a documented route; a controlled write gate may be retried with that route.'
          : 'No accepted Page 472 route exists.'
      },
      {
        caseId: 'TARGET-071B-VAT-POSTING-SETUP-REOPEN-AND-SOURCE-REVIEW',
        status: 'blocked',
        reason: 'No INLAND/VAT19 row was written.'
      },
      {
        caseId: 'TARGET-068-W1-FOUNDATION-READY-CHECKPOINT-AFTER-DIMENSION-PARK',
        status: blockedBy.length === 0 ? 'ready-after-current' : 'ready-next',
        reason: blockedBy.length === 0
          ? 'Checkpoint remains useful after the next write gate or deliberate VAT park decision.'
          : 'If Page 472 remains blocked, foundation limitation should be refreshed instead of repeating write attempts.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'blocked',
        reason: 'O2C remains blocked until VAT and General Posting Setup are proven or deliberately limited.'
      }
    ],
    queueChangesMade: [
      resultStatus === 'observed-page472-navigation-route'
        ? 'TARGET-072 documented a bounded visible Page 472 route and re-selects TARGET-071 as the next write gate.'
        : 'TARGET-072 keeps VAT write gates blocked and selects the Foundation limitation checkpoint.'
    ],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: blockedBy.length === 0
      ? 'The blocker was route visibility, not VAT field logic; the next safest progress is retrying the same controlled write gate with the documented route.'
      : 'Without an accepted Page 472 route, another write attempt would be blind repetition.',
    risksBeforeNextCase: [
      'Do not treat search overlay text as Page 472 truth.',
      'Do not click New/Edit/List Edit/Copy in a read-only route case.',
      'Do not claim VAT readiness before a saved INLAND/VAT19 row and later Preview/Entries proof.'
    ],
    requiredPreparation: blockedBy.length === 0
      ? ['Update TARGET-071 implementation to use the bounded visible route instead of relying on direct page=472 only.']
      : ['Park VAT setup or use a source-backed alternative route; do not repeat direct page=472.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-page472-navigation-route-decision',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix navigation decision',
    actionsTaken,
    actionsNotTaken: [
      'No New/Neu',
      'No Edit/List Edit',
      'No Copy',
      'No VAT setup value write',
      'No Configuration Package route',
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
    screenshots: [
      'target-072-010-direct-page-route.png',
      ...(searchRouteUsed ? ['target-072-020-visible-search-candidates.png'] : []),
      'target-072-030-page472-after-navigation.png',
      'target-072-040-tooltip-and-action-surface.png'
    ],
    routeSteps,
    controls,
    tooltipSales,
    tooltipPurchase,
    page472Signals: {
      pageVisible,
      directPageVisible,
      searchRouteUsed,
      hasInland: /\bINLAND\b/i.test(pageTextAfterNavigation),
      hasVat19: /\bVAT19\b/i.test(pageTextAfterNavigation),
      hasVatPercent19: /\b19(?:,00|\.00)?\b/i.test(pageTextAfterNavigation),
      hasSalesVatAccount3806: /\b3806\b/i.test(pageTextAfterNavigation),
      hasPurchaseVatAccount1406: /\b1406\b/i.test(pageTextAfterNavigation)
    },
    proved: blockedBy.length === 0
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix is visibly reachable through the documented bounded route.',
          'The route decision captured direct route, visible search candidate context and Page 472 surface/tooltip context.',
          'No setup, master data, document draft, Preview Posting, Posting, payment or API shortcut was executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'TARGET-072 stopped before any setup write, Preview Posting, Posting, master data, document draft, payment or API shortcut.'
        ],
    notProved: [
      'No INLAND/VAT19 VAT Posting Setup row was saved.',
      'No VAT % 19 value was persisted.',
      'No Sales VAT Account 3806 value was persisted.',
      'No Purchase VAT Account 1406 value was persisted.',
      'No final German VAT correctness.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No Preview Posting.',
      'No Posting.'
    ],
    blockedBy,
    warnings,
    changedFiles: [
      `${EVIDENCE_REL_DIR}/TARGET-072-result.json`,
      `${EVIDENCE_REL_DIR}/README.md`,
      `${EVIDENCE_REL_DIR}/*.txt`,
      `${EVIDENCE_REL_DIR}/*.png`,
      `${EVIDENCE_REL_DIR}/*.screenshot.json`
    ],
    evidenceRefs: [
      `${EVIDENCE_REL_DIR}/TARGET-072-result.json`,
      `${EVIDENCE_REL_DIR}/README.md`
    ],
    requiresReview: blockedBy.length > 0,
    safeToFinalizeState: false,
    statePatch: {},
    nextStepDecision,
    nextCase,
    reason: blockedBy.length === 0
      ? 'TARGET-072 observed a bounded Page 472 navigation route; no setup values were changed.'
      : `TARGET-072 blocked safely: ${blockedBy.join('; ')}`
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
      '## Was man aus der Oberflaeche lernt',
      '',
      'Die MwSt.-Buchungsmatrix ist nicht schon durch eine URL oder einen Suchtext bewiesen. Der sichtbare Seitenkontext muss die Matrix selbst zeigen. Schreibfaehige Aktionen wie Neu, Bearbeiten, Liste bearbeiten oder Kopieren bleiben in diesem Case tabu.',
      '',
      '## Grenzen',
      '',
      '- Keine USt-Einrichtung wurde geschrieben.',
      '- Keine Buchungsvorschau und keine Buchung wurden ausgefuehrt.',
      '- Keine Steuer- oder Compliance-Freigabe.'
    ].join('\n')
  );

  expect(result.resultStatus).toMatch(/observed|blocked/);
});
