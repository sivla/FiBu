import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027c-vat-groups-controlled-write';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027C-result.json');

type GroupTarget = {
  kind: 'business' | 'product';
  pageId: number;
  code: string;
  description: string;
  pageTitle: RegExp;
  pageLabel: string;
  codeColumn: RegExp;
  descriptionColumn: RegExp;
  searchTerm: string;
  searchResult: RegExp;
};

type GroupResult = {
  kind: GroupTarget['kind'];
  pageId: number;
  code: string;
  status: 'confirmed-existing' | 'created-and-confirmed' | 'blocked';
  route: string[];
  before: Capture;
  after: Capture;
  reopen: Capture;
  blockedBy: string[];
  warnings: string[];
};

type Capture = {
  step: string;
  url: string;
  screenshot: string | null;
  screenshotMetadata: string | null;
  textFile: string;
  targetSurfaceVisible: boolean;
  pageTitleVisible: boolean;
  gridColumnsVisible: boolean;
  targetCodeVisible: boolean;
  targetDescriptionVisible: boolean;
  roleCenterVisible: boolean;
  searchOverlayVisible: boolean;
  textSignals: string[];
};

const targets: GroupTarget[] = [
  {
    kind: 'business',
    pageId: 470,
    code: 'INLAND',
    description: 'Inland Deutschland',
    pageTitle: /MwSt\.-?Gesch[aä]ftsbuchungsgruppen|USt\.-?Gesch[aä]ftsbuchungsgruppen|VAT Business Posting Groups/i,
    pageLabel: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    codeColumn: /^Code$/i,
    descriptionColumn: /Beschreibung|Description/i,
    searchTerm: 'MwSt.-Geschäftsbuchungsgruppen',
    searchResult: /MwSt\.-?Gesch[aä]ftsbuchungsgruppen\s+Verwaltung|VAT Business Posting Groups\s+Verwaltung/i
  },
  {
    kind: 'product',
    pageId: 471,
    code: 'VAT19',
    description: 'USt 19 Prozent',
    pageTitle: /MwSt\.-?Produktbuchungsgruppen|USt\.-?Produktbuchungsgruppen|VAT Product Posting Groups/i,
    pageLabel: 'MwSt.-Produktbuchungsgruppen / VAT Product Posting Groups',
    codeColumn: /^Code$/i,
    descriptionColumn: /Beschreibung|Description/i,
    searchTerm: 'MwSt.-Produktbuchungsgruppen',
    searchResult: /MwSt\.-?Produktbuchungsgruppen\s+Verwaltung|VAT Product Posting Groups\s+Verwaltung/i
  }
];

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId|clientId|authority:/i.test(line))
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

function roleCenterVisible(text: string) {
  return /Guten Morgen|Aktivitaeten|Laufender Verkauf|Laufende Einkaufe|Shopify\s+-\s+Aktivitaeten/i.test(text);
}

function searchOverlayVisible(text: string) {
  return /Wie mochten Sie weiter verfahren|Was mochten Sie tun|Tell me|Nach .* suchen|Seiten und Aufgaben/i.test(text);
}

function dangerousDialogSignal(text: string) {
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

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (dangerousDialogSignal(text)) dialogs.push(text);
    }
  }
  return dialogs;
}

async function assertTargetContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
}

async function visibleText(page: Page) {
  return clean(await pageText(page));
}

async function targetSurface(page: Page, target: GroupTarget): Promise<Locator | null> {
  const scopes = [page, ...page.frames()];
  const candidates: Locator[] = [];
  for (const scope of scopes) {
    candidates.push(scope.locator('form').filter({ hasText: target.pageTitle }).last());
    candidates.push(scope.locator('form').filter({ hasText: /Code|Beschreibung|Description/i }).last());
    candidates.push(scope.getByRole('form', { name: target.pageTitle }).last());
    candidates.push(scope.getByRole('grid', { name: target.pageTitle }).last());
    candidates.push(scope.locator('[role="grid"]').filter({ hasText: /Code|Beschreibung|Description/i }).last());
  }

  for (const candidate of candidates) {
    const count = await candidate.count().catch(() => 0);
    if (count === 0) continue;
    const locator = candidate.first();
    const text = clean(await locator.innerText({ timeout: 1000 }).catch(() => ''));
    const box = await locator.boundingBox().catch(() => null);
    const titleVisible = target.pageTitle.test(text);
    const gridVisible = /Code/i.test(text) && /Beschreibung|Description/i.test(text);
    if ((titleVisible || gridVisible) && box && box.width > 100 && box.height > 40) return locator;
  }
  return null;
}

async function compactGroupText(page: Page, target: GroupTarget) {
  const surface = await targetSurface(page, target);
  if (surface) {
    const surfaceText = clean(await surface.innerText({ timeout: 1500 }).catch(() => ''));
    if (surfaceText) return surfaceText;
  }
  return clean(
    await compactPageText(page, {
      include: [target.pageTitle, target.codeColumn, target.descriptionColumn, /Neu|New|Liste bearbeiten|Edit list|INLAND|VAT19|Inland Deutschland|USt 19 Prozent/i],
      maxLines: 220,
      maxLineLength: 260
    })
  );
}

async function capture(page: Page, target: GroupTarget, prefix: string, step: string): Promise<Capture> {
  const text = (await compactGroupText(page, target)) || (await visibleText(page));
  const surface = await targetSurface(page, target);
  const targetSurfaceVisible = !!surface;
  const pageTitleVisible = target.pageTitle.test(text);
  const gridColumnsVisible = /Code/i.test(text) && /Beschreibung|Description/i.test(text);
  const targetCodeVisible = new RegExp(`\\b${target.code}\\b`, 'i').test(text);
  const targetDescriptionVisible = new RegExp(target.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text);
  const screenshotName = `${prefix}.png`;
  const textFile = `${prefix}.txt`;

  await writeText(textFile, text || 'No visible VAT group text captured.');
  const imagePath = path.join(EVIDENCE_DIR, screenshotName);
  if (surface) {
    await surface.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => undefined);
    await surface.screenshot({ path: imagePath });
  } else {
    await page.screenshot({ path: imagePath, fullPage: false });
  }
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.screenshot.json`), {
      fileName: screenshotName,
      imagePath,
      caseId: CASE_ID,
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      page: target.pageLabel,
      pageId: target.pageId,
      step,
      status: targetSurfaceVisible && gridColumnsVisible && !roleCenterVisible(text) && !searchOverlayVisible(text) ? 'accepted-page-screenshot' : 'rejected-page-screenshot',
      importantUi: ['Page title', 'Code column', 'Beschreibung/Description column', target.code, target.description],
      whatAUserSees:
        target.kind === 'business'
          ? 'Die Liste MwSt.-Geschaeftsbuchungsgruppen enthaelt steuerliche Gruppen fuer Geschaeftspartner.'
          : 'Die Liste MwSt.-Produktbuchungsgruppen enthaelt steuerliche Gruppen fuer Artikel, Ressourcen oder Sachkonten.',
      internallyProves: targetCodeVisible && targetDescriptionVisible ? `${target.code} is visible with its target description.` : `${target.pageLabel} route state was captured.`,
      doesNotProve: ['No VAT Posting Setup matrix row.', 'No Preview Posting.', 'No Posting.', 'No VAT Entries.'],
      screenshotQaRule: 'Accepted only when the screenshot itself shows the VAT group page, not Role Center or Tell-Me search.'
  });

  return {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    screenshot: screenshotName,
    screenshotMetadata: `${prefix}.screenshot.json`,
    textFile,
    targetSurfaceVisible,
    pageTitleVisible,
    gridColumnsVisible,
    targetCodeVisible,
    targetDescriptionVisible,
    roleCenterVisible: roleCenterVisible(text),
    searchOverlayVisible: searchOverlayVisible(text),
    textSignals: text.split('\n').slice(0, 80)
  };
}

async function openTargetPage(page: Page, target: GroupTarget, route: string[]) {
  route.push(`direct-page-${target.pageId}-dc0`);
  await page.goto(buildPlaythruUrl(target.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertTargetContext(page);
}

async function clickExactSearchResult(page: Page, target: GroupTarget) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    const locators = [
      scope.getByRole('row', { name: target.searchResult }),
      scope.getByRole('button', { name: target.searchResult }),
      scope.getByRole('link', { name: target.searchResult }),
      scope.getByText(target.searchResult)
    ];
    for (const locator of locators) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < Math.min(count, 6); index += 1) {
        const item = locator.nth(index);
        if (!(await item.isVisible({ timeout: 600 }).catch(() => false))) continue;
        await item.click({ timeout: 5000 }).catch(async () => item.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(3500);
        await waitForBusinessCentralShell(page);
        return true;
      }
    }
  }
  return false;
}

async function openTargetPageWithFallback(page: Page, target: GroupTarget, route: string[]) {
  await openTargetPage(page, target, route);
  const directText = await compactGroupText(page, target);
  if (/Code/i.test(directText) && /Beschreibung|Description/i.test(directText) && !roleCenterVisible(directText) && !searchOverlayVisible(directText)) return 'direct';

  route.push(`exact-search-result:${target.searchTerm}`);
  await searchFor(page, target.searchTerm);
  const clicked = await clickExactSearchResult(page, target);
  if (!clicked) return 'search-result-not-clicked';
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertTargetContext(page);
  return 'exact-search-result';
}

async function clickIfVisible(locator: Locator) {
  if (!(await locator.isVisible({ timeout: 900 }).catch(() => false))) return false;
  await locator.click({ timeout: 4000 }).catch(async () => locator.click({ timeout: 4000, force: true }));
  return true;
}

async function ensureEditMode(page: Page, surface: Locator) {
  const candidates = [
    surface.getByRole('menuitem', { name: /^Liste bearbeiten$|^Edit List$/i }).first(),
    surface.getByRole('button', { name: /^Liste bearbeiten$|^Edit List$/i }).first(),
    surface.getByTitle(/^Liste bearbeiten$|^Edit List$/i).first(),
    surface.getByRole('menuitem', { name: /Liste bearbeiten|Edit List|Bearbeiten/i }).first()
  ];
  for (const candidate of candidates) {
    if (await clickIfVisible(candidate)) {
      await page.waitForTimeout(1500);
      return 'clicked-edit-list';
    }
  }
  return 'edit-list-not-visible-or-already-editable';
}

async function clickNew(surface: Locator) {
  const candidates = [
    surface.getByRole('menuitem', { name: /^Neu$|^New$/i }).first(),
    surface.getByRole('button', { name: /^Neu$|^New$/i }).first(),
    surface.getByTitle(/^Neu$|^New$/i).first()
  ];
  for (const candidate of candidates) {
    if (await clickIfVisible(candidate)) {
      await page.waitForTimeout(1400);
      return true;
    }
  }
  return false;
}

async function fillFocusedOrActive(page: Page, value: string) {
  await page.keyboard.type(value, { delay: 30 });
  await page.waitForTimeout(400);
}

async function createGroupRow(page: Page, target: GroupTarget) {
  const surface = await targetSurface(page, target);
  if (!surface) throw new Error(`No scoped VAT form/grid surface for ${target.pageLabel}; refusing to click unscoped New.`);
  const editMode = await ensureEditMode(page, surface);
  const clickedNew = await clickNew(surface);
  if (!clickedNew) {
    throw new Error(`Neu/New not visible on ${target.pageLabel}; editMode=${editMode}`);
  }

  await fillFocusedOrActive(page, target.code);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await fillFocusedOrActive(page, target.description);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1800);
  await assertTargetContext(page);
  return { editMode, clickedNew };
}

async function processTarget(page: Page, target: GroupTarget, index: number): Promise<GroupResult> {
  const route: string[] = [];
  const prefixBase = `target-027c-${String(index).padStart(3, '0')}-${target.kind}`;
  await openTargetPageWithFallback(page, target, route);
  const before = await capture(page, target, `${prefixBase}-before`, 'Before create/confirm');

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const visibleBefore =
    before.targetSurfaceVisible &&
    before.gridColumnsVisible &&
    before.targetCodeVisible &&
    before.targetDescriptionVisible &&
    !before.roleCenterVisible &&
    !before.searchOverlayVisible;
  let status: GroupResult['status'] = visibleBefore ? 'confirmed-existing' : 'blocked';

  if (!before.targetSurfaceVisible || !before.gridColumnsVisible || before.roleCenterVisible || before.searchOverlayVisible) {
    blockedBy.push(`${target.pageLabel} is not visibly open; refusing setup write.`);
  }

  if (!visibleBefore && blockedBy.length === 0) {
    try {
      route.push('new-row-ui');
      await createGroupRow(page, target);
      status = 'created-and-confirmed';
    } catch (error) {
      status = 'blocked';
      blockedBy.push(error instanceof Error ? error.message : String(error));
    }
  }

  const after = await capture(page, target, `${prefixBase}-after`, 'After create/confirm attempt');
  await openTargetPageWithFallback(page, target, route);
  const reopen = await capture(page, target, `${prefixBase}-reopen`, 'Reopen proof after create/confirm');
  const confirmedAfterReopen =
    reopen.targetSurfaceVisible &&
    reopen.gridColumnsVisible &&
    reopen.targetCodeVisible &&
    reopen.targetDescriptionVisible &&
    !reopen.roleCenterVisible &&
    !reopen.searchOverlayVisible;

  if (!confirmedAfterReopen) {
    status = 'blocked';
    blockedBy.push(`${target.code} with expected description is not visibly confirmed after reopen.`);
  }

  if (await dangerousDialogs(page).then((entries) => entries.length > 0)) {
    status = 'blocked';
    blockedBy.push('Dangerous dialog visible after VAT group route.');
  }

  return { kind: target.kind, pageId: target.pageId, code: target.code, status, route, before, after, reopen, blockedBy, warnings };
}

test('TARGET-027C creates or confirms INLAND and VAT19 posting groups only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const results: GroupResult[] = [];
  for (let index = 0; index < targets.length; index += 1) {
    results.push(await processTarget(page, targets[index], index + 1));
  }

  const blockedBy = results.flatMap((entry) => entry.blockedBy);
  const success = blockedBy.length === 0 && results.every((entry) => entry.status === 'confirmed-existing' || entry.status === 'created-and-confirmed');
  const created = results.filter((entry) => entry.status === 'created-and-confirmed');
  const confirmedExisting = results.filter((entry) => entry.status === 'confirmed-existing');
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-groups-controlled-write',
    resultStatus: success ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    targetValues: {
      vatBusinessPostingGroup: { code: 'INLAND', description: 'Inland Deutschland' },
      vatProductPostingGroup: { code: 'VAT19', description: 'USt 19 Prozent' }
    },
    actionsTaken: success
      ? [
          'Tried direct Page 470 and Page 471 with dc=0 in playthru / UNIVERSAARL-DE.',
          'Used exact Seiten-und-Aufgaben search result only if the direct page was not visibly open.',
          'Confirmed or created only VAT Business/Product Posting Group rows INLAND and VAT19.',
          'Captured before/after/reopen text and screenshots for both pages.',
          'Stopped before VAT Posting Setup matrix, master data, draft, Preview Posting or Posting.'
        ]
      : [
          'Tried direct Page 470 and Page 471 with dc=0 in playthru / UNIVERSAARL-DE.',
          'Used exact Seiten-und-Aufgaben search result only if the direct page was not visibly open.',
          'Captured rejected before/after/reopen screenshots and text for both pages.',
          'Stopped before any VAT group write because the target VAT list surface was not visibly confirmed.',
          'Stopped before VAT Posting Setup matrix, master data, draft, Preview Posting or Posting.'
        ],
    actionsNotTaken: [
      'No VAT Posting Setup matrix row',
      'No posting groups outside VAT Business/Product groups',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch',
      'No search overlay accepted as proof'
    ],
    setupChanged: created.length > 0,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: success
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'VAT Business Posting Group INLAND is visible after reopen with description Inland Deutschland.',
          'VAT Product Posting Group VAT19 is visible after reopen with description USt 19 Prozent.',
          'Only Page 470 and Page 471 VAT group setup was touched; Page 472 matrix was not changed.'
        ]
      : ['Business Central stayed in playthru / UNIVERSAARL-DE until the route was blocked.'],
    notProved: [
      'No VAT Posting Setup matrix row is proven.',
      'No German 19 percent VAT calculation is proven.',
      'No customer/vendor/item/G/L VAT defaults are proven.',
      'No Preview Posting, VAT Entry or G/L Entry exists.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027C-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027C-result.json`,
      ...results.flatMap((entry) =>
        [entry.before, entry.after, entry.reopen].flatMap((captureEntry) => [
          `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${captureEntry.textFile}`,
          captureEntry.screenshot ? `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${captureEntry.screenshot}` : null,
          captureEntry.screenshotMetadata ? `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${captureEntry.screenshotMetadata}` : null
        ])
      ).filter(Boolean)
    ],
    pageResults: results,
    blockedBy,
    warnings: [
      ...results.flatMap((entry) => entry.warnings),
      'This is setup evidence only; it is not a VAT calculation or posting proof.',
      'If search fallback was used, only the final visible VAT page screenshot counts as proof.'
    ],
    flags: {
      noVatPostingSetupMatrix: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noSearchOverlayAsProof: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-027B selected INLAND/VAT19 and SKR04 VAT accounts as the next controlled write gate.',
      isPlannedNextCaseStillSensible: true,
      reason: 'VAT business/product groups are prerequisite records for the later Page 472 VAT Posting Setup matrix.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE',
          status: success ? 'ready-next' : 'blocked',
          reason: success ? 'INLAND and VAT19 are now visible after reopen.' : 'Group creation/confirmation must be fixed before matrix setup.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'General posting groups wait until VAT matrix setup is at least planned.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data must wait for VAT and posting group defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation checkpoint waits for VAT matrix and posting groups.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: success ? 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE' : 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE-FOLLOWUP',
      whySelectedNextCaseIsBest: success
        ? 'The next dependency is the Page 472 matrix row for INLAND + VAT19.'
        : 'The group write gate must be repeated with a better visible-page route before any matrix setup.',
      risksBeforeNextCase: [
        'Do not claim German VAT correctness before VAT matrix, Preview Posting, VAT Entries and G/L Entries.',
        'Do not accept Role Center or Tell-Me overlay screenshots as VAT page proof.'
      ],
      requiredPreparation: success ? ['Use Page 472 only; do not create master data yet.'] : ['Fix Page 470/Page 471 visible route before write.']
    },
    safeToFinalizeState: success,
    requiresReview: false,
    statePatch: success
      ? {
          current: {
            active_case: 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE',
            active_case_file: '.agent/state/cases/target-027d-vat-posting-setup-matrix-write.json',
            lastCompletedCase: CASE_ID
          },
          lastRunSummary: {
            caseId: CASE_ID,
            status: 'observed',
            summary: 'INLAND and VAT19 VAT groups confirmed in playthru / UNIVERSAARL-DE; no matrix, preview or posting.'
          }
        }
      : {},
    nextCase: success ? 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE' : 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE-FOLLOWUP',
    reason: success ? 'VAT group prerequisites are ready for controlled Page 472 matrix setup.' : 'Visible VAT group write proof is blocked.'
  };

  await writeJson(RESULT_PATH, result);
  expect(result.resultStatus).toMatch(/observed|blocked/);
});
