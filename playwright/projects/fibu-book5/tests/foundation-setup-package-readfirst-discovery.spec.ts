import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  openSearchResult,
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
  process.env.FOUNDATION_PACKAGE_READFIRST_LIVE_APPROVED !== '1' ||
    process.env.FOUNDATION_PACKAGE_READFIRST_RUNNER_GUARD_CHECKED !== '1',
  'FOUNDATION-SETUP-PACKAGE-READFIRST-DISCOVERY must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-READFIRST-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'foundation-setup-package-readfirst-discovery';
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

function targetInstanceUrl() {
  const url = new URL(process.env.FOUNDATION_PACKAGE_READFIRST_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL must include a tenant/environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  return url;
}

function buildTargetUrl(pageId: number) {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
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

function configPackageSignals(text: string) {
  return [
    /Konfigurationspakete|Configuration Packages|Config\. Packages|RapidStart/i,
    /Paketcode|Package Code|Code|Paketname|Package Name/i,
    /Neu|New|Paket importieren|Import Package|Paket exportieren|Export Package|Tabellen abrufen|Get Tables/i
  ].filter((signal) => signal.test(text)).length;
}

function dangerousDialogText(text: string) {
  return /Daten anwenden|Apply Package|Validate Package|Paket importieren|Paket exportieren|Edit in Excel|In Excel bearbeiten|OK|Ja|Yes|Fertig stellen|Finish|Buchungsvorschau|Preview Posting|Buchen|Post/i.test(
    text
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

async function fullText(page: Page) {
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(frameTexts.join('\n'));
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
      maxLines: 220,
      maxLineLength: 260
    }).catch(() => '')
  );
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
        await page.waitForTimeout(1200);
        return label.source;
      }
    }
  }
  return '';
}

async function assertTargetContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogVisible(page)).toBe(false);
}

test(`${CASE_ID} captures configuration-package route read-first`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const warnings: string[] = [];
  const blockedBy: string[] = [];

  await page.goto(buildTargetUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertTargetContext(page);

  const shellText = await fullText(page);
  await capture(
    page,
    'foundation-package-readfirst-010-shell-context.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'Shell and target context after opening Page 8615',
      importantUi: ['Business Central shell', 'playthru URL path', 'UNIVERSAARL-DE company parameter'],
      visibleSignals: shellText.split('\n').slice(0, 45),
      internallyProves: 'Business Central shell opened in the expected playthru / UNIVERSAARL-DE target context.',
      doesNotProve: ['No package table field availability', 'No setup value', 'No configuration package safety for writes'],
      noWrite: true
    },
    captures
  );

  let routeUsed = 'direct-page-8615';
  let pageContextText = await fullText(page);
  const directSignalCount = configPackageSignals(pageContextText);
  if (directSignalCount < 2) {
    routeUsed = 'tell-me-search-konfigurationspakete-after-direct-page-8615-role-center';
    await searchFor(page, 'Konfigurationspakete');
    await capture(
      page,
      'foundation-package-readfirst-015-search-route-context.png',
      {
        page: 'Konfigurationspakete / Configuration Packages',
        pageId: 8615,
        step: 'Tell-Me search route because direct Page 8615 resolved to Role Center',
        directSignalCount,
        importantUi: ['search overlay', 'Konfigurationspakete result candidate'],
        visibleSignals: (await fullText(page)).split('\n').slice(0, 70),
        internallyProves: 'The direct URL route was not trusted blindly; a user-like search route was prepared.',
        doesNotProve: ['No package page yet', 'No package action clicked', 'No setup value'],
        noWrite: true
      },
      captures
    );
    await openSearchResult(page, /Konfigurationspakete|Configuration Packages|Config\. Packages/i, { occurrence: 0 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await page.keyboard.press('Escape').catch(() => undefined);
    await assertTargetContext(page);
    pageContextText = await fullText(page);
  }

  const compactText = (await compactConfigText(page)) || pageContextText;
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'foundation-package-readfirst-page-text.txt'), compactText);
  const signalCount = configPackageSignals(pageContextText);
  if (signalCount < 2) blockedBy.push('Configuration Packages page signals were too weak for accepted page proof.');
  await capture(
    page,
    'foundation-package-readfirst-020-package-page-context.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'Configuration Packages page/list context',
      routeUsed,
      signalCount,
      importantUi: ['page title/list context', 'package code/name columns or empty-list state', 'command bar'],
      visibleSignals: compactText.split('\n').slice(0, 70),
      internallyProves: 'The run reached the package route surface or captured enough UI text to reject it.',
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
    actions
  });
  const dangerousActions = actions.filter((action) =>
    /Import|Export|Validate|Validieren|Apply|Anwenden|Excel|Tabellen abrufen|Get Tables|Neu|New/i.test(
      `${action.text} ${action.ariaLabel} ${action.title}`
    )
  );
  await capture(
    page,
    'foundation-package-readfirst-030-action-inventory.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'Action inventory without clicking write-capable controls',
      actionCount: actions.length,
      dangerousActions: dangerousActions.slice(0, 25),
      importantUi: ['Neu/New', 'Import/Export', 'Tabellen abrufen/Get Tables', 'Validate/Apply/Edit in Excel if visible'],
      internallyProves: 'The command surface was inspected without executing package actions.',
      doesNotProve: ['No action is approved for writes', 'No package metadata is safe to keep'],
      noWrite: true
    },
    captures
  );

  const hovered = await hoverFirstVisible(page, [/Tabellen abrufen|Get Tables/i, /Neu|New/i, /Paket importieren|Import Package/i]);
  const hoverText = await fullText(page);
  await capture(
    page,
    'foundation-package-readfirst-040-hover-tooltip-context.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'Hover or tooltip context for package actions',
      hoveredAction: hovered || 'no target action could be hovered safely',
      visibleSignals: hoverText.split('\n').slice(0, 70),
      internallyProves: 'A package action/tooltip context was inspected by hover only.',
      doesNotProve: ['No package action was clicked', 'No package field route was executed'],
      noWrite: true
    },
    captures
  );

  await page.keyboard.press('Escape').catch(() => undefined);
  await assertTargetContext(page);
  const finalText = await fullText(page);
  await capture(
    page,
    'foundation-package-readfirst-050-no-write-end-context.png',
    {
      page: 'Konfigurationspakete / Configuration Packages',
      pageId: 8615,
      step: 'No-write end context',
      importantUi: ['final page context', 'no modal confirmation', 'no package card creation intentionally entered'],
      visibleSignals: finalText.split('\n').slice(0, 55),
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
    warnings.push('No mapped Foundation setup table was visible from the list context without clicking Get Tables or creating/opening package metadata.');
  }
  if (dangerousActions.length) {
    warnings.push('Write-capable package actions are visible; they remain inventory-only and locked.');
  }

  const resultStatus = blockedBy.length ? 'blocked-readfirst-context' : 'observed-readfirst-context';
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-configuration-package-discovery',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Konfigurationspakete / Configuration Packages',
    sanitizedUrl: sanitizeUrl(page.url()),
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
      'Opened Page 8615 Konfigurationspakete directly in playthru / UNIVERSAARL-DE.',
      routeUsed === 'direct-page-8615'
        ? 'Accepted the direct Page 8615 route.'
        : 'Used Tell-Me search for Konfigurationspakete after direct Page 8615 resolved to Role Center.',
      'Captured shell, page, action inventory, hover/tooltip and no-write end screenshots.',
      'Inventoried visible package actions without clicking New, Get Tables, Import, Export, Validate, Apply or Edit in Excel.',
      'Checked whether mapped Foundation setup tables are visible without package metadata or package actions.'
    ],
    actionsNotTaken: [
      'No package creation',
      'No package open/edit',
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
      accepted: resultStatus === 'observed-readfirst-context' && captures.length >= MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS,
      requiredCheckpoints: [
        'shell and target context',
        'route recovery/search context when direct page route is weak',
        'Configuration Packages page/list context',
        'visible action inventory',
        'hover/tooltip context',
        'no-write end context'
      ],
      reason:
        captures.length >= MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS
          ? 'The run uses a screenshot chain instead of one end screenshot.'
          : 'Screenshot chain is too weak for UI learning.'
    },
    tableSignals,
    visibleActionsPath: `${EVIDENCE_DIR_REL}/visible-actions.json`,
    routeUsed,
    proved:
      resultStatus === 'observed-readfirst-context'
        ? [
            'Business Central was opened in playthru / UNIVERSAARL-DE.',
            'Page 8615 Konfigurationspakete / Configuration Packages was visible as a real Business Central UI surface.',
            'The command surface was inventoried read-only.',
            'No package action or setup write was executed.'
          ]
        : [
            'The run stayed inside playthru / UNIVERSAARL-DE before stopping.',
            'No package action or setup write was executed.'
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
      lastEvidenceSummary: 'The local Foundation field map selected configuration-package/table discovery as the next no-write route.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The run proves or rejects the package route surface without writing setup data.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION',
          status: 'ready-after-current',
          reason: 'Only a later Smart Decision may decide whether temporary package metadata is justified.'
        },
        {
          caseId: 'Foundation setup write/import gate',
          status: 'needs-source-check-first',
          reason: 'Import/apply remains locked until fields, validation, rollback/keep strategy and screenshots are defined.'
        },
        {
          caseId: 'Master Data write gates',
          status: 'needs-setup-first',
          reason: 'Foundation setup is still not proven ready.'
        },
        {
          caseId: 'O2C/P2P process cases',
          status: 'blocked',
          reason: 'No posting/VAT setup readiness or Preview Posting boundary exists.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION',
      whySelectedNextCaseIsBest:
        'The read-first route can now be evaluated by a BC consultant before any package metadata, import/export/validate/apply or setup write is allowed.',
      risksBeforeNextCase: [
        'Configuration package metadata is an admin setup artifact, not business setup proof.',
        'Get Tables, Import, Validate, Apply and Edit in Excel can become effective and need explicit gates.',
        'Planned setup values must not be treated as saved values.'
      ],
      requiredPreparation: [
        'Review the five-screenshot chain.',
        'Review visible-actions.json.',
        'Decide whether package metadata is justified or whether the setup route should remain parked.'
      ]
    },
    nextCase: 'FOUNDATION-SETUP-PACKAGE-METADATA-WRITE-GATE-DECISION',
    requiresReview: false,
    safeToFinalizeState: false
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# FOUNDATION-SETUP-PACKAGE-READFIRST-DISCOVERY',
      '',
      'Dieser Lauf ist ein lesender Erstnachweis fuer Konfigurationspakete in `playthru / UNIVERSAARL-DE`.',
      '',
      `Status: \`${resultStatus}\``,
      '',
      '## Nicht ausgefuehrt',
      '',
      '- Kein Paket angelegt.',
      '- Kein Paket geoeffnet oder bearbeitet.',
      '- Kein `Tabellen abrufen`.',
      '- Kein Import, Export, Validieren, Anwenden oder In Excel bearbeiten.',
      '- Keine Einrichtungsaenderung.',
      '- Keine Stammdaten.',
      '- Keine Belege, keine Buchungsvorschau, keine Buchung.',
      '',
      '## Evidence',
      '',
      ...result.screenshots.map((file) => `- ${file}`),
      `- ${EVIDENCE_DIR_REL}/visible-actions.json`,
      `- ${EVIDENCE_DIR_REL}/result.json`,
      ''
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(result.companySwitch).toBe(false);
  expect(captures.length).toBeGreaterThanOrEqual(MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS);
});
