import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  openSearchResult,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { createBcStepTimeline } from '../../../core/bc/step-timeline';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});
test.setTimeout(180_000);
test.skip(
  process.env.FOUNDATION_CONFIGURATION_WORKSHEET_FIELD_MAP_READFIRST_LIVE_APPROVED !== '1' ||
    process.env.FOUNDATION_CONFIGURATION_WORKSHEET_FIELD_MAP_READFIRST_RUNNER_GUARD_CHECKED !== '1',
  'FOUNDATION-CONFIGURATION-WORKSHEET-FIELD-MAP-READFIRST must run through the guarded runner with --live-approved.'
);

const CASE_ID = 'FOUNDATION-CONFIGURATION-WORKSHEET-FIELD-MAP-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'foundation-configuration-worksheet-field-map-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

const CONFIG_PACKAGES_PAGE_RE = /Konfigurationspakete|Configurationspakete|Configuration Packages|Config\. Packages/i;
const CONFIG_WORKSHEET_RE = /Konfigurationsarbeitsblatt|Configuration Worksheet/i;
const CONFIG_ROUTE_RE =
  /Konfigurationsarbeitsblatt|Configuration Worksheet|Konfigurationspakete|Configuration Packages|Config\. Packages|Tabellen|Tables|Felder|Fields|Paketcode|Package Code|323|325|252|MwSt|USt|VAT|Buchungsmatrix|Posting Setup/i;
const WRITE_CAPABLE_RE =
  /Neu|New|Bearbeiten|Edit|Loeschen|Loschen|Delete|Tabellen abrufen|Get Tables|Import|Export|Validieren|Validate|Anwenden|Apply|Excel|Paket|Package/i;

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
  for (const key of ['page', 'company', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function isTargetContext(rawUrl: string) {
  const url = new URL(rawUrl);
  return (
    url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE) &&
    (url.searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY
  );
}

async function compactRouteText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        CONFIG_ROUTE_RE,
        /U-VAT325-DISC|VAT 325 Discovery|252|323|325|470|VAT Business Posting Group|MwSt|USt|VAT|Buchungsmatrix|Posting Setup|Code|Description|Beschreibung|Anzahl Tabellen|Anzahl Datensatze/i,
        WRITE_CAPABLE_RE
      ],
      maxLines: 220,
      maxLineLength: 240
    }).catch(() => '')
  );
}

async function capture(page: Page, fileName: string, metadata: Record<string, unknown>) {
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
  return `${EVIDENCE_DIR_REL}/${fileName}`;
}

async function collectVisibleActions(page: Page) {
  const actions = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const interesting =
          /Neu|New|Bearbeiten|Edit|Loeschen|Loschen|Delete|Tabellen abrufen|Get Tables|Import|Export|Validieren|Validate|Anwenden|Apply|Excel|Paket|Package|Tabelle|Table|Felder|Fields/i;
        return [...document.querySelectorAll<HTMLElement>('[role="button"],[role="menuitem"],button,a,span,div')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const topElement = document.elementFromPoint(centerX, centerY);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const isForeground =
              !!topElement && (element === topElement || element.contains(topElement) || !!topElement.closest('[role="dialog"], [aria-modal="true"]'));
            if (!isForeground || !interesting.test(text) || text.length > 180 || rect.width <= 1 || rect.height <= 1) return null;
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .slice(0, 240);
      })
      .catch(() => []);
    actions.push(...(entries as Array<Record<string, unknown>>));
  }
  return actions;
}

async function openConfigurationWorksheetViaTellMe(page: Page) {
  await searchFor(page, 'Konfigurationsarbeitsblatt');
  await openSearchResult(page, /Konfigurationsarbeitsblatt|Configuration Worksheet/i, {
    expectedPageText: CONFIG_WORKSHEET_RE,
    rejectIfTellMeStaysOpen: false,
    timeout: 45_000
  });
  await dismissTours(page);
  // Do not press Escape here: BC may render the target as a foreground pane.
  const text = await compactRouteText(page);
  expect(isTargetContext(page.url()), `Wrong target context: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(text).toMatch(CONFIG_WORKSHEET_RE);
  return text;
}

async function openConfigurationPackagesByPageId(page: Page) {
  await page.goto(buildPlaythruPageUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  const text = await compactRouteText(page);
  expect(isTargetContext(page.url()), `Wrong target context: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(text).toMatch(CONFIG_PACKAGES_PAGE_RE);
  return text;
}

test(`${CASE_ID} proves configuration worksheet field-map route read-first`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const screenshots: string[] = [];
  const stepTimeline = createBcStepTimeline({
    project: PROJECT,
    evidenceId: EVIDENCE_ID,
    caseId: CASE_ID,
    evidenceDir: EVIDENCE_DIR,
    evidenceDirRelative: EVIDENCE_DIR_REL
  });

  let worksheetText = '';
  await page.goto(buildPlaythruPageUrl(9022), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await stepTimeline.step(page, {
    stepId: '010-open-configuration-worksheet',
    action: 'Open Configuration Worksheet via Tell-Me read-first for Foundation table-field context',
    claim: 'Business Central shows Configuration Worksheet as the foreground target for read-only table-field inspection, not merely Role Center or Tell-Me.',
    expectedPageText: [CONFIG_WORKSHEET_RE],
    run: async () => {
      worksheetText = await openConfigurationWorksheetViaTellMe(page);
    },
    verdict: (_before, after) =>
      ['side-pane-open', 'list-page-open', 'target-page-open', 'card-page-open'].includes(after.classification)
        ? 'proven'
        : 'not-proven',
    stopReason: (_before, after) =>
      after.classification === 'search-overlay-open'
        ? 'Tell-Me/search overlay remained open after selecting Configuration Worksheet.'
        : after.classification === 'role-center-background'
          ? 'Only Role Center background was visible after selecting Configuration Worksheet.'
          : null
  });
  screenshots.push(
    await capture(page, 'foundation-configuration-worksheet-010-target.png', {
      page: 'Konfigurationsarbeitsblatt / Configuration Worksheet',
      step: 'Worksheet target context',
      sanitizedUrl: sanitizeUrl(page.url()),
      visibleSignals: worksheetText.split('\n').slice(0, 90),
      noWrite: true
    })
  );

  const worksheetActions = await collectVisibleActions(page);
  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'worksheet-visible-actions.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actions: worksheetActions
  });
  screenshots.push(
    await capture(page, 'foundation-configuration-worksheet-020-actions.png', {
      page: 'Konfigurationsarbeitsblatt / Configuration Worksheet',
      step: 'Worksheet visible action inventory without execution',
      actionCount: worksheetActions.length,
      writeCapableActions: worksheetActions
        .filter((action) => WRITE_CAPABLE_RE.test(`${action.text} ${action.title} ${action.ariaLabel}`))
        .slice(0, 35),
      noWrite: true
    })
  );

  let packageText = '';
  await stepTimeline.step(page, {
    stepId: '030-open-configuration-packages',
    action: 'Open Configuration Packages page 8615 read-first',
    claim: 'Business Central shows Configuration Packages page/list without repeating the old Escape-after-Tell-Me route and without package actions.',
    expectedPageText: [CONFIG_PACKAGES_PAGE_RE],
    run: async () => {
      packageText = await openConfigurationPackagesByPageId(page);
    },
    verdict: (_before, after) =>
      ['side-pane-open', 'list-page-open', 'target-page-open', 'card-page-open'].includes(after.classification)
        ? 'proven'
        : 'not-proven',
    stopReason: (_before, after) =>
      after.classification === 'search-overlay-open'
        ? 'Search overlay remained open after direct page navigation.'
        : after.classification === 'role-center-background'
          ? 'Only Role Center background was visible after direct page navigation.'
          : null
  });
  screenshots.push(
    await capture(page, 'foundation-configuration-worksheet-030-packages.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Packages read-first context',
      sanitizedUrl: sanitizeUrl(page.url()),
      visibleSignals: packageText.split('\n').slice(0, 90),
      noWrite: true
    })
  );

  const packageActions = await collectVisibleActions(page);
  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'package-visible-actions.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actions: packageActions
  });
  screenshots.push(
    await capture(page, 'foundation-configuration-worksheet-040-package-actions.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Package visible action inventory without execution',
      actionCount: packageActions.length,
      writeCapableActions: packageActions
        .filter((action) => WRITE_CAPABLE_RE.test(`${action.text} ${action.title} ${action.ariaLabel}`))
        .slice(0, 35),
      noWrite: true
    })
  );

  const allText = [worksheetText, packageText].join('\n');
  const tableSignals = {
    table252GeneralPostingSetup: /(^|\D)252(\D|$)|Buchungsmatrix Einrichtung|General Posting Setup/i.test(allText),
    table323VatBusinessPostingGroup:
      /(^|\D)323(\D|$)|MwSt\.?-Geschaeftsbuchungsgruppen|VAT Business Posting Groups|VAT Business Posting Group|VAT Bus\. Posting Groups/i.test(
        allText
      ),
    table325VatPostingSetup: /(^|\D)325(\D|$)|MwSt\.?-Buchungsmatrix|VAT Posting Setup/i.test(allText),
    vatBusinessPostingGroups: /MwSt\.?-Geschaeftsbuchungsgruppen|VAT Business Posting Groups|VAT Bus\. Posting Groups/i.test(allText),
    configurationWorksheetVisible: CONFIG_WORKSHEET_RE.test(worksheetText),
    configurationPackagesVisible: CONFIG_PACKAGES_PAGE_RE.test(packageText)
  };
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'page-text.txt'), clean(allText));
  stepTimeline.timeline.businessCentralOpened = true;
  stepTimeline.timeline.playwrightLiveRunExecuted = true;
  stepTimeline.timeline.liveActionsExecuted = false;
  const stepTimelinePath = await stepTimeline.write();

  const routeDecision =
    tableSignals.configurationWorksheetVisible &&
    tableSignals.configurationPackagesVisible &&
    (tableSignals.table323VatBusinessPostingGroup || tableSignals.table325VatPostingSetup || tableSignals.table252GeneralPostingSetup)
      ? 'ready-for-source-backed-write-gate-decision'
      : 'parked-readfirst-blocked';
  const nextCase =
    routeDecision === 'ready-for-source-backed-write-gate-decision'
      ? 'FOUNDATION-SETUP-PACKAGE-WRITE-GATE-DECISION'
      : 'FOUNDATION-SETUP-PACKAGE-ROUTE-RECOVERY-OR-ALTERNATIVE';

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readfirst-configuration-worksheet-field-map-and-packages',
    resultStatus: routeDecision === 'ready-for-source-backed-write-gate-decision' ? 'observed-readfirst' : 'blocked-readfirst',
    routeDecision,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    pages: [
      'Konfigurationsarbeitsblatt / Configuration Worksheet',
      'Page 8615 Konfigurationspakete / Configuration Packages'
    ],
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
    configurationPackageCreated: false,
    configurationPackageOpenedForEdit: false,
    configurationPackageImported: false,
    configurationPackageExported: false,
    configurationPackageValidated: false,
    configurationPackageApplied: false,
    editInExcel: false,
    tableSignals,
    actionsTaken: [
      'Opened Business Central read-only in playthru / UNIVERSAARL-DE.',
      'Opened Configuration Worksheet read-only via Tell-Me and captured target context for Foundation table-field mapping.',
      'Inventoried visible Configuration Worksheet actions without clicking write-capable actions.',
      'Opened Configuration Packages read-only by direct page URL 8615.',
      'Inventoried visible Configuration Package actions without creating, importing, exporting, validating or applying data.'
    ],
    actionsNotTaken: [
      'No package creation',
      'No package card open/edit',
      'No Get Tables/Tabellen abrufen click',
      'No table-field selection',
      'No table add/remove',
      'No package import',
      'No package export',
      'No package validation',
      'No package apply',
      'No Edit in Excel',
      'No setup value typing',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No company switch'
    ],
    screenshots,
    stepTimeline: stepTimelinePath,
    worksheetActionInventoryPath: `${EVIDENCE_DIR_REL}/worksheet-visible-actions.json`,
    packageActionInventoryPath: `${EVIDENCE_DIR_REL}/package-visible-actions.json`,
    screenshotQaReferences: [
      'Step timeline before/after screenshots and visual-state JSON classify target page, side pane, search overlay, dialog and Role Center background.',
      stepTimelinePath
    ],
    proved:
      routeDecision === 'ready-for-source-backed-write-gate-decision'
        ? [
            'Business Central opened in playthru / UNIVERSAARL-DE.',
            'Configuration Worksheet is reachable read-first.',
            'Configuration Packages page 8615 is reachable read-first.',
            'At least one Foundation setup source table signal among Table 323, Table 325 or Table 252 is visible in read-first evidence.',
            'The old Escape-after-Tell-Me retry route was not repeated.',
            'No package/setup/master-data/posting action occurred.'
          ]
        : [
            'Business Central opened in playthru / UNIVERSAARL-DE.',
            'No package/setup/master-data/posting action occurred.'
          ],
    notProved: [
      'No package write gate.',
      'No package table line creation.',
      'No field selection.',
      'No Table 323 VAT Business Posting Group local row proof unless visible tableSignals explicitly show it.',
      'No Table 252 or Table 325 package mapping write.',
      'No import/export/validate/apply route.',
      'No setup value.',
      'No posting/VAT/master-data readiness.',
      'No UAT acceptance.'
    ],
    warnings: [
      'Configuration Packages and Worksheet are standard setup/data surfaces; write-capable package actions remain locked until a separate write gate.',
      'Table signals in this run are only visible text signals, not write or mapping proof.'
    ],
    blockedBy:
      routeDecision === 'ready-for-source-backed-write-gate-decision'
        ? []
        : [
            tableSignals.configurationWorksheetVisible ? '' : 'configuration-worksheet-not-visible',
            tableSignals.configurationPackagesVisible ? '' : 'configuration-packages-not-visible',
            tableSignals.table323VatBusinessPostingGroup || tableSignals.table325VatPostingSetup || tableSignals.table252GeneralPostingSetup
              ? ''
              : 'no-foundation-table-field-signal-visible'
          ].filter(Boolean),
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'Source decision selected Configuration Worksheet and Configuration Packages as read-first proof before any package or setup write, with special attention to Table 323 VAT Business Posting Group source truth.',
      isPlannedNextCaseStillSensible: routeDecision === 'ready-for-source-backed-write-gate-decision',
      reason:
        routeDecision === 'ready-for-source-backed-write-gate-decision'
          ? 'Standard BC setup-data surfaces are reachable and at least one Foundation table-field signal is visible.'
          : 'The standard BC setup-data surfaces or Foundation table-field signals were not sufficiently visible.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-WRITE-GATE-DECISION',
          status: routeDecision === 'ready-for-source-backed-write-gate-decision' ? 'ready-next' : 'blocked',
          reason:
            routeDecision === 'ready-for-source-backed-write-gate-decision'
              ? 'Read-first surfaces and at least one relevant table-field signal are proven.'
              : 'Read-first surface or table-field proof is incomplete.'
        },
        {
          caseId: 'FOUNDATION-READINESS-DECISION',
          status: 'ready-after-current',
          reason: 'Should consume the read-first result and keep Master Data blocked until Foundation is decided.'
        },
        {
          caseId: 'Master Data route decisions',
          status: 'needs-setup-first',
          reason: 'Master Data remains blocked until Foundation readiness clarifies setup route and posting prerequisites.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        routeDecision === 'ready-for-source-backed-write-gate-decision'
          ? 'The next decision can now evaluate whether a tightly scoped package write gate is justified.'
          : 'A recovery or alternative route is needed before any package write gate.',
      risksBeforeNextCase: [
        'Any package create/get-tables/import/export/validate/apply action changes setup metadata or data route state and needs its own gate.'
      ],
      requiredPreparation: ['Review screenshot QA and step timeline before allowing any write-capable package action.']
    },
    safeToFinalizeState: false,
    requiresReview: false,
    nextCase
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      `# ${CASE_ID}`,
      '',
      `Result: ${result.resultStatus}`,
      `Route decision: ${routeDecision}`,
      '',
      'This run opened Configuration Worksheet and Configuration Packages read-only in playthru / UNIVERSAARL-DE.',
      'It checked whether Foundation table-field signals for Table 323, Table 325 or Table 252 are visible without acting on package metadata.',
      'No package was created, edited, imported, exported, validated, applied, deleted or edited in Excel.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].join('\n')
  );
});
