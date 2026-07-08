import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});
test.setTimeout(180_000);
test.skip(
  process.env.FOUNDATION_PACKAGE_ROUTE_RECOVERY_LIVE_APPROVED !== '1' ||
    process.env.FOUNDATION_PACKAGE_ROUTE_RECOVERY_RUNNER_GUARD_CHECKED !== '1',
  'FOUNDATION-SETUP-PACKAGE-ROUTE-RECOVERY-READFIRST must run through the guarded runner with --live-approved.'
);

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-ROUTE-RECOVERY-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'foundation-setup-package-route-recovery-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS = 5;

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

type VisibleAction = {
  text: string;
  role: string;
  ariaLabel: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|upn:/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruPageUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  const parts = url.pathname.split('/').filter(Boolean);
  if (!parts.length) throw new Error('Business Central URL must include a tenant/environment path.');
  parts[parts.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${parts.join('/')}`;
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i,
    '/{tenant}'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter', 'dc']) {
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

function configPackageSignalCount(text: string) {
  return [
    /^Konfigurationspakete:?$/im,
    /Info (uber|zu) Konfigurationspakete|Importieren, exportieren und validieren Sie Mandanteneinrichtungs/i,
    /Paketcode|Package Code|Paketname|Package Name|Tabellen abrufen|Get Tables/i,
    /Paket importieren|Import Package|Paket exportieren|Export Package/i
  ].filter((signal) => signal.test(text)).length;
}

function roleCenterSignal(text: string) {
  return /Guten Tag|Aktivitaten|Shopify|Laufender Verkauf|Laufende Einkaufe|Rollencenter|Role Center/i.test(text);
}

async function fullText(page: Page) {
  const texts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(texts.join('\n'));
}

async function compactConfigText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Konfigurationspakete|Konfigurationspaket|Configuration Packages|Config\. Packages|RapidStart/i,
        /Paketcode|Package Code|Code|Paketname|Package Name|Tabellen-ID|Table ID|Tabellenname|Table Name|Felder|Fields/i,
        /General Posting Setup|Buchungsmatrix Einrichtung|VAT Posting Setup|MwSt\.-?Buchungsmatrix|VAT Business|MwSt\.-?Geschaeft|325|252|470|472/i,
        /Neu|New|Paket importieren|Import Package|Paket exportieren|Export Package|Tabellen abrufen|Get Tables|Validieren|Validate|Anwenden|Apply|Excel/i,
        /Fehler|Error|nicht gespeichert|blocked|gesperrt/i
      ],
      maxLines: 260,
      maxLineLength: 260
    }).catch(() => '')
  );
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const found = await frame
      .locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main, .modal-dialog')
      .filter({
        hasText:
          /Daten anwenden|Apply Package|Validate Package|Paket importieren|Paket exportieren|Edit in Excel|In Excel bearbeiten|OK|Ja|Yes|Fertig stellen|Finish|Buchungsvorschau|Preview Posting|Buchen|Post/i
      })
      .first()
      .isVisible({ timeout: 300 })
      .catch(() => false);
    if (found) return true;
  }
  return false;
}

async function assertTargetContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogVisible(page)).toBe(false);
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = evidencePath(PROJECT, EVIDENCE_ID, fileName);
  const metadataPath = evidencePath(PROJECT, EVIDENCE_ID, fileName.replace(/\.png$/i, '.screenshot.json'));
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJsonEvidence(metadataPath, {
    fileName,
    imagePath: `${EVIDENCE_DIR_REL}/${fileName}`,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
  return {
    screenshot: `${EVIDENCE_DIR_REL}/${fileName}`,
    screenshotMetadata: `${EVIDENCE_DIR_REL}/${path.basename(metadataPath)}`
  };
}

async function capture(page: Page, fileName: string, metadata: Record<string, unknown>, captures: Capture[]) {
  const shot = await screenshotWithMetadata(page, fileName, metadata);
  captures.push(shot);
  return shot;
}

async function collectVisibleActions(page: Page) {
  const all: VisibleAction[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const interesting = /Neu|New|Import|Export|Validate|Validieren|Apply|Anwenden|Excel|Package|Paket|Table|Tabelle|Tabellen abrufen|Get Tables|Field|Feld|Search|Suchen/i;
        return [...document.querySelectorAll<HTMLElement>('[role="button"],[role="menuitem"],button,a,span,div')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const role = element.getAttribute('role') || element.tagName.toLowerCase();
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (
              !interesting.test(text) ||
              text.length > 180 ||
              rect.width <= 1 ||
              rect.height <= 1 ||
              rect.width > 700 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity || '1') <= 0 ||
              (!['button', 'menuitem', 'a'].includes(role) && !element.getAttribute('aria-label') && !element.getAttribute('title'))
            ) {
              return null;
            }
            return {
              text,
              role,
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .slice(0, 300);
      })
      .catch(() => []);
    all.push(...(entries as VisibleAction[]));
  }
  return all
    .filter((entry, index, source) => source.findIndex((other) => other.text === entry.text && other.x === entry.x && other.y === entry.y) === index)
    .sort((left, right) => left.y - right.y || left.x - right.x)
    .slice(0, 160);
}

async function hoverFirstVisible(page: Page, labels: RegExp[]) {
  for (const label of labels) {
    for (const scope of [page, ...page.frames()]) {
      const candidates = [
        scope.getByRole('button', { name: label }).first(),
        scope.getByRole('menuitem', { name: label }).first(),
        scope.getByText(label).first()
      ];
      for (const candidate of candidates) {
        if (!(await candidate.isVisible({ timeout: 500 }).catch(() => false))) continue;
        await candidate.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
        await candidate.hover({ timeout: 2000 }).catch(() => undefined);
        await page.waitForTimeout(1000);
        return label.source;
      }
    }
  }
  return '';
}

async function clickScopedTellMeResult(page: Page, label: RegExp) {
  await searchFor(page, 'Konfigurationspakete');
  const beforeClickText = await fullText(page);
  const candidates = [
    page.getByRole('link', { name: label }).first(),
    page.getByRole('button', { name: label }).first(),
    page.getByText(label).first()
  ];
  for (const candidate of candidates) {
    if (!(await candidate.isVisible({ timeout: 700 }).catch(() => false))) continue;
    await candidate.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
    await candidate.click({ timeout: 3000 }).catch(() => undefined);
    await page.waitForLoadState('domcontentloaded', { timeout: 20_000 }).catch(() => undefined);
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await page.keyboard.press('Escape').catch(() => undefined);
    return { clicked: true, beforeClickText };
  }
  return { clicked: false, beforeClickText };
}

test(`${CASE_ID} recovers configuration-package route read-first`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const warnings: string[] = [];
  const blockedBy: string[] = [];
  let routeUsed = 'direct-page-8615-legacy-url-form';
  let searchOverlayText = '';

  await page.goto(buildPlaythruPageUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(2500);
  await assertTargetContext(page);

  await capture(
    page,
    'foundation-package-route-recovery-010-direct-page8615-context.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'Direct Page 8615 using legacy URL form known from older accepted evidence',
      sanitizedUrl: sanitizeUrl(page.url()),
      visibleSignals: (await fullText(page)).split('\n').slice(0, 70),
      internallyProves: 'Direct route was tried with target instance/company and no write action.',
      doesNotProve: ['No package metadata', 'No import/apply safety', 'No setup value'],
      noWrite: true
    },
    captures
  );

  let pageContextText = await fullText(page);
  let signalCount = configPackageSignalCount(pageContextText);
  if (signalCount < 2 || roleCenterSignal(pageContextText)) {
    routeUsed = 'scoped-tell-me-click-after-direct-page8615-weak';
    const search = await clickScopedTellMeResult(page, /Konfigurationspakete|Configuration Packages|Config\. Packages/i);
    searchOverlayText = search.beforeClickText;
    await capture(
      page,
      'foundation-package-route-recovery-015-scoped-search-context.png',
      {
        page: 'Konfigurationspakete / Configuration Packages',
        pageId: 8615,
        step: 'Scoped Tell-Me result click after direct route stayed weak',
        clickedSearchCandidate: search.clicked,
        visibleSignals: searchOverlayText.split('\n').slice(0, 80),
        internallyProves: 'The fallback used a scoped search-result candidate instead of trusting a generic shell wait.',
        doesNotProve: ['No package page until post-click screenshot passes QA', 'No package action clicked'],
        noWrite: true
      },
      captures
    );
    await assertTargetContext(page);
    pageContextText = await fullText(page);
    signalCount = configPackageSignalCount(pageContextText);
  }

  const compactText = (await compactConfigText(page)) || pageContextText;
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'foundation-package-route-recovery-page-text.txt'), compactText);
  const acceptedPageProof = signalCount >= 2 && !roleCenterSignal(pageContextText);
  if (!acceptedPageProof) {
    blockedBy.push('Konfigurationspakete page/list proof rejected: screenshot/text still looks like Role Center or lacks page/list signals.');
  }

  await capture(
    page,
    'foundation-package-route-recovery-020-page-proof-or-blocker.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'Accepted page proof or blocker state',
      routeUsed,
      signalCount,
      acceptedPageProof,
      importantUi: ['page/list title', 'package action bar', 'empty-list or package-list context'],
      visibleSignals: compactText.split('\n').slice(0, 80),
      internallyProves: acceptedPageProof
        ? 'The Konfigurationspakete page/list surface is visible read-only.'
        : 'The route is still blocked and must not be treated as a page proof.',
      doesNotProve: ['No package was created', 'No package table was selected', 'No setup table was changed'],
      noWrite: true
    },
    captures
  );

  const actions = await collectVisibleActions(page);
  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'visible-actions.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    sanitizedUrl: sanitizeUrl(page.url()),
    routeUsed,
    acceptedPageProof,
    actions
  });
  const dangerousActions = actions.filter((action) =>
    /Import|Export|Validate|Validieren|Apply|Anwenden|Excel|Tabellen abrufen|Get Tables|Neu|New/i.test(
      `${action.text} ${action.ariaLabel} ${action.title}`
    )
  );
  if (dangerousActions.length) {
    warnings.push('Write-capable package controls are visible and remain inventory-only.');
  }

  await capture(
    page,
    'foundation-package-route-recovery-030-action-inventory.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'Action inventory without clicking write-capable controls',
      actionCount: actions.length,
      dangerousActions: dangerousActions.slice(0, 25),
      importantUi: ['Neu/New', 'Import/Export', 'Tabellen abrufen/Get Tables', 'Validate/Apply/Edit in Excel if visible'],
      internallyProves: 'The visible command surface was inspected without executing package actions.',
      doesNotProve: ['No action is approved for writes', 'No package metadata is safe to keep'],
      noWrite: true
    },
    captures
  );

  const hovered = await hoverFirstVisible(page, [/Tabellen abrufen|Get Tables/i, /Neu|New/i, /Paket importieren|Import Package/i]);
  await capture(
    page,
    'foundation-package-route-recovery-040-hover-context.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'Hover or tooltip context for package actions',
      hoveredAction: hovered || 'no target action could be hovered safely',
      visibleSignals: (await fullText(page)).split('\n').slice(0, 80),
      internallyProves: 'A package action/tooltip context was inspected by hover only.',
      doesNotProve: ['No package action was clicked', 'No package field route was executed'],
      noWrite: true
    },
    captures
  );

  await page.keyboard.press('Escape').catch(() => undefined);
  await assertTargetContext(page);
  await capture(
    page,
    'foundation-package-route-recovery-050-no-write-end-context.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'No-write end context',
      importantUi: ['final page context', 'no modal confirmation', 'no package card/edit state intentionally entered'],
      visibleSignals: (await fullText(page)).split('\n').slice(0, 65),
      internallyProves: 'The run ended without a visible dangerous dialog or write state.',
      doesNotProve: ['No setup readiness', 'No import/export/validate/apply route approval'],
      noWrite: true
    },
    captures
  );

  const tableSignals = {
    generalPostingSetup252: /General Posting Setup|Buchungsmatrix Einrichtung|(^|\D)252(\D|$)/i.test(compactText),
    vatPostingSetup325: /VAT Posting Setup|MwSt\.-?Buchungsmatrix|(^|\D)325(\D|$)/i.test(compactText),
    vatBusinessPostingGroup470: /VAT Business Posting Group|MwSt\.-?Geschaeft|(^|\D)470(\D|$)/i.test(compactText)
  };
  if (!tableSignals.generalPostingSetup252 && !tableSignals.vatPostingSetup325 && !tableSignals.vatBusinessPostingGroup470) {
    warnings.push('No mapped Foundation setup table is visible without clicking Get Tables or creating/opening package metadata.');
  }

  const resultStatus = acceptedPageProof ? 'observed-readfirst-page-route' : 'blocked-readfirst-route';
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-configuration-package-route-recovery',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Konfigurationspakete / Configuration Packages',
    sanitizedUrl: sanitizeUrl(page.url()),
    routeUsed,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    confidentialRealCustomerDataUsed: false,
    uiMockupUsed: false,
    actionsTaken: [
      'Opened Page 8615 with the legacy URL form that previously produced accepted Configuration Packages evidence.',
      routeUsed === 'direct-page-8615-legacy-url-form'
        ? 'Accepted or rejected the direct route by screenshot/text proof.'
        : 'Used scoped Tell-Me result click and rejected/accepted only after post-click page proof.',
      'Captured direct route, search fallback when needed, page proof/blocker, action inventory, hover context and no-write end screenshots.',
      'Inventoried visible package actions without clicking New, Get Tables, Import, Export, Validate, Apply or Edit in Excel.'
    ],
    actionsNotTaken: [
      'No package creation',
      'No package card open/edit',
      'No Get Tables/Tabellen abrufen click',
      'No package import',
      'No package export',
      'No package validation',
      'No package apply',
      'No Edit in Excel publish',
      'No setup value typing',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No company switch'
    ],
    screenshots: captures.map((captureRef) => captureRef.screenshot),
    screenshotQa: {
      minimumAcceptedCheckpoints: MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS,
      capturedCheckpoints: captures.map((captureRef) => captureRef.screenshot),
      acceptedForPageProof: acceptedPageProof && captures.length >= MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS,
      acceptedForSetupProof: false,
      requiredCheckpoints: [
        'direct route context',
        'materially different route context if direct route is weak',
        'target page proof or blocker',
        'visible action inventory',
        'hover/action context',
        'no-write end context'
      ],
      reason: acceptedPageProof
        ? 'Screenshot/text QA accepts only the visible Konfigurationspakete page/list surface.'
        : 'Screenshot/text QA rejects Role Center or weak route surface as page proof.'
    },
    tableSignals,
    visibleActionsPath: `${EVIDENCE_DIR_REL}/visible-actions.json`,
    proved: acceptedPageProof
      ? [
          'Business Central was opened in playthru / UNIVERSAARL-DE.',
          'Konfigurationspakete / Configuration Packages page/list surface was visible as read-only page proof.',
          'Package action surface was inventoried without executing write-capable controls.',
          'No setup, master data, draft, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
        ]
      : [
          'Business Central was opened in playthru / UNIVERSAARL-DE.',
          'A materially different read-first route was tried.',
          'The run stopped without executing package actions or setup writes.'
        ],
    notProved: [
      'No mapped Foundation setup table is proven usable for import/apply.',
      'No configuration package was created or opened.',
      'No Table 252, Table 325 or Page 470 package field mapping was proven through package metadata.',
      'No setup value exists because of this run.',
      'No posting/VAT/master-data readiness.',
      'No UAT acceptance.'
    ],
    warnings,
    blockedBy,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'The metadata gate decision rejected package metadata writes until the page/list route is proven read-only.',
      isPlannedNextCaseStillSensible: true,
      reason: 'This run uses a materially different route and strict screenshot QA before any package metadata action.',
      lookaheadReviewed: [
        {
          caseId: 'Configuration Package Metadata Write Gate',
          status: acceptedPageProof ? 'ready-after-current' : 'blocked',
          reason: acceptedPageProof
            ? 'A later local decision can decide whether metadata creation is justified.'
            : 'No page/list proof exists, so metadata creation remains blocked.'
        },
        {
          caseId: 'Foundation Setup Write/Import Gate',
          status: 'needs-source-check-first',
          reason: 'Requires fields, source values, validation and rollback/keep plan.'
        },
        {
          caseId: 'Master Data write gates',
          status: 'needs-setup-first',
          reason: 'Foundation setup remains unresolved.'
        },
        {
          caseId: 'O2C/P2P process cases',
          status: 'blocked',
          reason: 'No posting/VAT setup readiness or Preview Posting boundary exists.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: acceptedPageProof ? 'FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION-2' : 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE-DECISION',
      whySelectedNextCaseIsBest: acceptedPageProof
        ? 'The route proof is now strong enough for a separate metadata gate decision, still not for import/apply.'
        : 'The route must be parked or replaced by another standard approach because the page proof remains blocked.',
      risksBeforeNextCase: [
        'Configuration package metadata is an admin artifact.',
        'Get Tables, Import, Validate, Apply and Edit in Excel can become effective.',
        'Planned setup values must not be treated as saved values.'
      ],
      requiredPreparation: acceptedPageProof
        ? ['Review screenshot QA.', 'Define exact metadata purpose, cleanup/keep and stop conditions before any write.']
        : ['Do not repeat the same route.', 'Decide whether to park package route or use another source-backed standard route.']
    },
    safeToFinalizeState: false,
    requiresReview: false,
    nextCase: acceptedPageProof ? 'FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION-2' : 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE-DECISION'
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      `# ${CASE_ID}`,
      '',
      'Read-first route recovery for Konfigurationspakete / Configuration Packages.',
      '',
      `Result: ${resultStatus}`,
      `Route: ${routeUsed}`,
      '',
      'No package was created, opened for edit, imported, exported, validated, applied or edited in Excel.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].join('\n')
  );
});
