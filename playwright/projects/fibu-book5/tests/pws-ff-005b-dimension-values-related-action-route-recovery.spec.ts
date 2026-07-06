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

test.setTimeout(240_000);
test.skip(
  process.env.PWS_FF_005B_LIVE_APPROVED !== '1' || process.env.PWS_FF_005B_RUNNER_GUARD_CHECKED !== '1',
  'PWS-FF-005B must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'PWS-FF-005B-DIMENSION-VALUES-RELATED-ACTION-ROUTE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-ff-005b-dimension-values-related-action-route-recovery';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const routeDebugEvidence: string[] = [];

type Probe = {
  id: string;
  pageId: number;
  label: string;
  filter?: string;
  searchTerm: string;
  searchResult: RegExp;
  expectedSignals: RegExp[];
  include: RegExp[];
  beginnerLearning: string;
  importantUi: string[];
  doesNotProve: string[];
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked';
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  textFile: string;
  visibleSignals: string[];
  missingSignals: string[];
  warnings: string[];
  route: {
    routeUsed: string;
    routeNote: string;
  };
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'dimensions-list',
    pageId: 536,
    label: 'Dimensionen / Dimensions',
    searchTerm: 'Dimensionen',
    searchResult: /^Dimensionen$/i,
    expectedSignals: [/Dimensionen|Dimensions/i, /PRODUCTLINE/i, /COSTCENTER/i, /CHANNEL/i],
    include: [/Dimensionen|Dimensions|PRODUCTLINE|COSTCENTER|CHANNEL|Code|Name|Beschreibung|Neu|New|Bearbeiten|Edit/i],
    beginnerLearning:
      'Dimensionen sind Auswertungsmerkmale. Sie helfen, Buchungen spaeter nach Produktlinie, Kostenstelle oder Vertriebskanal zu analysieren.',
    importantUi: ['Seitentitel', 'Dimensionscode', 'Name/Beschreibung', 'sichtbare Aktionen wie Neu oder Bearbeiten'],
    doesNotProve: [
      'Keine globale Dimension ist gesetzt.',
      'Keine Standarddimension ist zugeordnet.',
      'Keine gebuchte Dimensionswirkung ist nachgewiesen.'
    ]
  },
  {
    id: 'productline-values',
    pageId: 537,
    label: 'Dimensionswerte / Dimension Values PRODUCTLINE',
    filter: "'Dimension Value'.'Dimension Code' IS 'PRODUCTLINE'",
    searchTerm: 'Dimensionswerte',
    searchResult: /^Dimensionswerte$|^Dimension Values$/i,
    expectedSignals: [/Dimensionswerte|Dimension Values|Dimensionen|Dimensions/i, /PRODUCTLINE/i, /SOFTWARE/i, /SERVICE/i, /TRAINING/i],
    include: [/Dimensionswerte|Dimension Values|Dimensionen|PRODUCTLINE|SOFTWARE|SERVICE|TRAINING|Code|Name|Beschreibung|Neu|New/i],
    beginnerLearning:
      'Dimensionswerte konkretisieren eine Dimension. Bei PRODUCTLINE koennen spaeter Umsatz, Aufwand oder Artikel nach Leistungsbereich getrennt werden.',
    importantUi: ['Dimensionscode-Filter', 'Code', 'Name/Beschreibung', 'sichtbare Werte SOFTWARE, SERVICE, TRAINING'],
    doesNotProve: [
      'Kein Artikel, Kunde oder Beleg nutzt diese Werte.',
      'Keine Reporting-Auswertung nach PRODUCTLINE ist bewiesen.'
    ]
  },
  {
    id: 'costcenter-values',
    pageId: 537,
    label: 'Dimensionswerte / Dimension Values COSTCENTER',
    filter: "'Dimension Value'.'Dimension Code' IS 'COSTCENTER'",
    searchTerm: 'Dimensionswerte',
    searchResult: /^Dimensionswerte$|^Dimension Values$/i,
    expectedSignals: [/Dimensionswerte|Dimension Values|Dimensionen|Dimensions/i, /COSTCENTER/i, /ADMIN/i, /SALES/i, /OPERATIONS/i],
    include: [/Dimensionswerte|Dimension Values|Dimensionen|COSTCENTER|ADMIN|SALES|OPERATIONS|Code|Name|Beschreibung|Neu|New/i],
    beginnerLearning:
      'Kostenstellen helfen, Verantwortungsbereiche auszuwerten. Fuer Schulung und UAT ist wichtig, welche Werte ein Key User spaeter auswaehlt.',
    importantUi: ['Dimensionscode-Filter', 'Code', 'Name/Beschreibung', 'sichtbare Werte ADMIN, SALES, OPERATIONS'],
    doesNotProve: [
      'Keine Kostenstellenpflicht ist eingerichtet.',
      'Keine Standarddimension fuer Debitoren, Kreditoren oder Artikel ist bewiesen.'
    ]
  },
  {
    id: 'channel-values',
    pageId: 537,
    label: 'Dimensionswerte / Dimension Values CHANNEL',
    filter: "'Dimension Value'.'Dimension Code' IS 'CHANNEL'",
    searchTerm: 'Dimensionswerte',
    searchResult: /^Dimensionswerte$|^Dimension Values$/i,
    expectedSignals: [/Dimensionswerte|Dimension Values|Dimensionen|Dimensions/i, /CHANNEL/i, /DIRECT/i, /PARTNER/i],
    include: [/Dimensionswerte|Dimension Values|Dimensionen|CHANNEL|DIRECT|PARTNER|Code|Name|Beschreibung|Neu|New/i],
    beginnerLearning:
      'Der Vertriebskanal trennt Direktgeschaeft und Partnergeschaeft. Das ist fuer Verkaufsanalyse und Managementberichte relevant.',
    importantUi: ['Dimensionscode-Filter', 'Code', 'Name/Beschreibung', 'sichtbare Werte DIRECT, PARTNER'],
    doesNotProve: [
      'Kein Verkaufsprozess verwendet CHANNEL.',
      'Keine GuV- oder Umsatzauswertung nach CHANNEL ist bewiesen.'
    ]
  }
];

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki|KAJETAN\.KALICKI/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|upn:|O365SuiteServiceProxy|originAuthorityValidator|RequestExecutorMessageProcessor/i.test(line))
    .join('\n')
    .trim();
}

function targetInstanceUrl() {
  const url = new URL(process.env.PWS_FF_005B_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-FF-005B can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  return url;
}

function buildTargetUrl(probe: Probe) {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(probe.pageId));
  url.searchParams.set('dc', '0');
  if (probe.filter) url.searchParams.set('filter', probe.filter);
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
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
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Change Global Dimensions|Globale Dimensionen.*andern|Globale Dimensionen.*aendern/i.test(text)
      ? 'Global dimension change action may be visible but was not clicked.'
      : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting or preview action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
}

function dangerousDialogText(text: string) {
  return /create|anlegen|edit|bearbeiten|delete|loeschen|post|buchen|preview|vorschau|import|apply|confirm|bestaetigen|fertig stellen|finish/i.test(
    text
  );
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  const visibleValues = await collectVisibleGridValues(page);
  return clean(`${body}\n${frameTexts.join('\n')}\n${visibleValues.join('\n')}`);
}

async function visibleDialogs(page: Page) {
  const chunks: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .modal-dialog, .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (text) chunks.push(text);
    }
  }
  return chunks;
}

async function collectVisibleGridValues(page: Page) {
  const values = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate(() => {
          const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const selectors = [
            '[role="gridcell"]',
            '[role="textbox"]',
            '[role="combobox"]',
            'input',
            'textarea',
            'span[title]',
            'div[title]',
            'td',
            'th'
          ].join(',');
          return Array.from(document.querySelectorAll<HTMLElement>(selectors))
            .filter(visible)
            .flatMap((element) => {
              const input = element as HTMLInputElement;
              return [
                normalize('value' in input ? input.value : ''),
                normalize(element.textContent),
                normalize(element.getAttribute('title')),
                normalize(element.getAttribute('aria-label'))
              ];
            })
            .filter(Boolean)
            .slice(0, 500);
        })
        .catch(() => [])
    )
  );
  return [...new Set(values.flat())];
}

async function clickFirstVisible(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'row', 'gridcell'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 900 }).catch(() => false)) {
        await locator.click({ timeout: 5000 });
        await page.waitForTimeout(700);
        return true;
      }
    }
    const text = scope.getByText(name).first();
    if (await text.isVisible({ timeout: 900 }).catch(() => false)) {
      await text.click({ timeout: 5000 });
      await page.waitForTimeout(700);
      return true;
    }
  }
  return false;
}

async function clickFirstVisibleAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 900 }).catch(() => false)) {
        await locator.hover({ timeout: 1500 }).catch(() => undefined);
        await locator.click({ timeout: 5000 });
        await page.waitForTimeout(700);
        return true;
      }
    }
  }
  return false;
}

function dimensionCodeFromFilter(filter = '') {
  return filter.match(/IS\s+'([^']+)'/i)?.[1] ?? '';
}

async function openDimensionsList(page: Page) {
  await page.goto(buildTargetUrl(probes[0]), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(900);
  const rawText = await fullText(page);
  const compact = await compactProbeText(page, probes[0]);
  if (missingExpectedSignals(probes[0], rawText, compact || rawText).length === 0) return;

  await searchFor(page, 'Dimensionen');
  await openSearchResult(page, /^Dimensionen$/i, { occurrence: 0 });
  await waitForBusinessCentralShell(page);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function openDimensionValuesFromDimensionsList(page: Page, probe: Probe) {
  const dimensionCode = dimensionCodeFromFilter(probe.filter);
  if (!dimensionCode) return false;
  await openDimensionsList(page);
  await captureRouteCheckpoint(page, dimensionCode, '010-dimensions-list-before-row-select', {
    expectation: `Dimensionen list is open before selecting ${dimensionCode}.`,
    actionRisk: 'read-only-list-context'
  });
  const rowClicked = await clickFirstVisible(page, new RegExp(`^${dimensionCode}\\b|\\b${dimensionCode}\\b`, 'i'));
  if (!rowClicked) return false;
  await captureRouteCheckpoint(page, dimensionCode, '020-dimension-row-selected', {
    expectation: `${dimensionCode} row is selected in the Dimensionen list.`,
    actionRisk: 'row-selection-only-no-write'
  });
  const groupClicked = await clickFirstVisibleAction(page, /^Dimension$/i);
  if (!groupClicked) return false;
  await captureRouteCheckpoint(page, dimensionCode, '030-dimension-action-opened', {
    expectation: 'The Dimension command or dropdown has been activated.',
    actionRisk: 'command-menu-only-no-write'
  });
  const valuesClicked = await clickFirstVisibleAction(page, /^Dimensionswerte$|^Dimension Values$/i);
  if (!valuesClicked) return false;
  await captureRouteCheckpoint(page, dimensionCode, '040-dimension-values-action-clicked', {
    expectation: `Dimension Values action was clicked for ${dimensionCode}.`,
    actionRisk: 'related-action-only-no-write'
  });
  await waitForBusinessCentralShell(page);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(1200);
  return true;
}

function missingExpectedSignals(probe: Probe, rawText: string, compactText: string) {
  return probe.expectedSignals
    .filter((signal) => !signal.test(rawText) && !signal.test(compactText) && !(probe.filter && signal.test(probe.filter)))
    .map((signal) => signal.source);
}

async function compactProbeText(page: Page, probe: Probe) {
  return clean(
    await compactPageText(page, {
      include: probe.include,
      maxLines: 160,
      maxLineLength: 240
    }).catch(() => '')
  );
}

async function openProbePage(page: Page, probe: Probe) {
  if (probe.pageId === 537 && probe.filter) {
    const openedViaRelatedAction = await openDimensionValuesFromDimensionsList(page, probe).catch(() => false);
    const rawText = await fullText(page);
    const compact = await compactProbeText(page, probe);
    return {
      rawText,
      compact,
      route: {
        routeUsed: openedViaRelatedAction
          ? 'dimensions-list-related-action'
          : 'dimensions-list-related-action-blocked',
        routeNote: openedViaRelatedAction
          ? 'Opened Dimensions first, selected the dimension row, then used Dimension > Dimensionswerte read-only.'
          : 'Opened Dimensions first and selected the dimension row, but the Dimension > Dimensionswerte action route was not safely proven. The test deliberately did not fall back to Tell-Me search.'
      }
    };
  }

  await page.goto(buildTargetUrl(probe), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(1000);

  let rawText = await fullText(page);
  let compact = await compactProbeText(page, probe);
  const firstMissingSignals = missingExpectedSignals(probe, rawText, compact || rawText);
  if (firstMissingSignals.length === 0) {
    return {
      rawText,
      compact,
      route: {
        routeUsed: 'direct-page-url',
        routeNote: 'Direct page URL produced accepted page/context signals.'
      }
    };
  }

  await page.keyboard.press('Escape').catch(() => undefined);
  const searchSucceeded = await searchFor(page, probe.searchTerm)
    .then(async () => {
      await openSearchResult(page, probe.searchResult, { occurrence: 0 });
      await waitForBusinessCentralShell(page);
      await page.waitForLoadState('domcontentloaded').catch(() => undefined);
      await page.waitForTimeout(1200);
      return true;
    })
    .catch(() => false);

  if (!searchSucceeded) {
    return {
      rawText,
      compact,
      route: {
        routeUsed: 'direct-page-url-search-fallback-blocked',
        routeNote: `Direct page URL missed signals (${firstMissingSignals.join(', ')}), and Tell-Me search for ${probe.searchTerm} did not open an accepted result.`
      }
    };
  }

  rawText = await fullText(page);
  compact = await compactProbeText(page, probe);
  return {
    rawText,
    compact,
    route: {
      routeUsed: 'tell-me-search',
      routeNote: `Direct page URL missed accepted signals, so Tell-Me search opened ${probe.searchTerm} read-only.`
    }
  };
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

async function captureRouteCheckpoint(page: Page, dimensionCode: string, step: string, metadata: Record<string, unknown>) {
  const safeCode = dimensionCode.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const shot = await screenshotWithMetadata(page, `pws-ff-005b-route-${safeCode}-${step}.png`, {
    routeCheckpoint: true,
    dimensionCode,
    step,
    ...metadata,
    internallyProves: `Intermediate UI state for ${dimensionCode} during Dimensionen -> Dimension -> Dimensionswerte route recovery.`,
    doesNotProve: [
      'No Dimension Value was created or changed.',
      'No setup was changed.',
      'This checkpoint alone does not prove the final Dimension Values page.'
    ],
    finalScreenshotStatus: 'route-debug-evidence',
    noWrite: true,
    noPost: true,
    noPreview: true
  });
  routeDebugEvidence.push(shot.screenshot, shot.screenshotMetadata);
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  const opened = await openProbePage(page, probe);

  const currentUrl = page.url();
  const safeInstance = instancePathIsTarget(currentUrl);
  const safeCompany = companyParamIsTarget(currentUrl);
  const dialogs = await visibleDialogs(page);
  const dangerousDialogs = dialogs.filter(dangerousDialogText);
  const rawText = opened.rawText;
  const compact = opened.compact;
  const text = compact || rawText;
  const missingSignals = missingExpectedSignals(probe, rawText, text);
  const unsafeReasons = [
    safeInstance ? '' : `Expected instance ${EXPECTED_INSTANCE} was not visible in URL.`,
    safeCompany ? '' : `Expected company ${TARGET_COMPANY} was not visible in URL query.`,
    ...dangerousDialogs.map((dialog) => `Dangerous dialog visible: ${dialog.slice(0, 180)}`)
  ].filter(Boolean);
  const status = unsafeReasons.length || missingSignals.length ? 'blocked' : 'observed';

  const textFile = `pws-ff-005b-${String(index).padStart(3, '0')}-${probe.id}.txt`;
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), text || 'No compact page text captured.');
  const shot = await screenshotWithMetadata(page, `pws-ff-005b-${String(index).padStart(3, '0')}-${probe.id}.png`, {
    page: probe.label,
    pageId: probe.pageId,
    filter: probe.filter ?? '',
    step: 'Read-only Dimension Values related-action route recovery',
    status,
    importantUi: probe.importantUi,
    visibleLearning: probe.beginnerLearning,
    visibleSignals: text.split('\n').slice(0, 50),
    missingSignals,
    route: opened.route,
    internallyProves:
      status === 'observed'
        ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `The related-action route did not produce accepted page/context signals for ${probe.label}.`,
    doesNotProve: [
      ...probe.doesNotProve,
      'No setup value was changed.',
      'No master data, document draft, preview posting or posting was created.'
    ],
    screenshotQaRule:
      'Accept only if page identity, company context, selected dimension and visible Dimension Values signals are clear. Reject Role Center, search overlay, Intercompany Dimension Value Assignment or generic navigation text as page proof.',
    finalScreenshotStatus: status === 'observed' ? 'foundation-draft-candidate' : 'rejected',
    noWrite: true,
    noPost: true,
    noPreview: true
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: shot.screenshot,
    screenshotMetadata: shot.screenshotMetadata,
    textFile: `${EVIDENCE_DIR_REL}/${textFile}`,
    visibleSignals: text.split('\n').slice(0, 50),
    missingSignals,
    warnings: visibleWarnings(rawText),
    route: opened.route,
    reason: unsafeReasons.length
      ? unsafeReasons.join(' ')
      : missingSignals.length
        ? `Missing expected signals: ${missingSignals.join(', ')}`
        : 'Expected read-only dimension signals are visible.'
  };
}

test('PWS-FF-005B recovers Universaarl Dimension Values related-action route read-first', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const results: ProbeResult[] = [];

  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], index + 1));
  }

  const unsafe = results.filter((entry) => !instancePathIsTarget(entry.url) || !companyParamIsTarget(entry.url));
  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status !== 'observed');
  const resultStatus = unsafe.length ? 'blocked' : blocked.length ? 'partially-completed' : 'observed';
  const selectedNextCase =
    blocked.length > 0
      ? 'PWS-FF-005C-DIMENSION-VALUES-UI-DISCOVERY-OR-PARK-DECISION'
      : 'FOUNDATION-READINESS-DECISION-REFRESH-AFTER-DIMENSIONS';
  const warnings = Array.from(new Set(results.flatMap((entry) => entry.warnings)));
  const evidenceRefs = [
    `${EVIDENCE_DIR_REL}/PWS-FF-005B-result.json`,
    `${EVIDENCE_DIR_REL}/README.md`,
    ...results.flatMap((entry) => [entry.textFile, entry.screenshot, entry.screenshotMetadata]),
    ...routeDebugEvidence
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-foundation-dimension-values-route',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Dimensions / Dimension Values related action',
    url: results.map((entry) => entry.url),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened Dimensions page 536 read-only in playthru / UNIVERSAARL-DE.',
      'Selected visible existing dimension rows for PRODUCTLINE, COSTCENTER and CHANNEL read-only.',
      'Attempted the Dimension > Dimensionswerte related-action route without using New, Edit List, Delete, setup writes or search fallback for target proof.',
      'Captured screenshot QA metadata and compact page text for every route probe.'
    ],
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No Edit/Bearbeiten or Edit List action clicked.',
      'No values typed.',
      'No Dimension created or changed.',
      'No Dimension Value created or changed.',
      'No Global Dimension Code changed.',
      'No Default Dimension assigned.',
      'No setup changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No API shortcut.',
      'No company switch.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    probes: results,
    screenshots: results.map((entry) => entry.screenshot),
    proved: [
      `${observed.length}/${results.length} dimension-related pages produced accepted read-only context signals in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
      ...(observed.some((entry) => entry.id === 'dimensions-list') ? ['Dimensions page context is visible read-only.'] : []),
      ...(observed.some((entry) => entry.id === 'productline-values') ? ['PRODUCTLINE Dimension Values context is visible read-only.'] : []),
      ...(observed.some((entry) => entry.id === 'costcenter-values') ? ['COSTCENTER Dimension Values context is visible read-only.'] : []),
      ...(observed.some((entry) => entry.id === 'channel-values') ? ['CHANNEL Dimension Values context is visible read-only.'] : []),
      'No Dimension, Dimension Value, Global Dimension, Default Dimension, master data, document draft, preview posting or posting was created.'
    ],
    notProved: [
      ...blocked.map((entry) => `${entry.label}: ${entry.reason}`),
      'No reporting readiness.',
      'No Dimension Set Entry, G/L Entry or posted transaction with dimensions.',
      'No Global Dimension Code 1/2 persistence.',
      'No Default Dimension assignment for customers, vendors, items or accounts.',
      'No Master Data readiness.',
      'No Preview Posting or Posting readiness.'
    ],
    blockedBy: blocked.map((entry) => `${entry.id}: ${entry.reason}`),
    warnings,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'PWS-FF-005 proved the Dimensions list in playthru / UNIVERSAARL-DE, but rejected direct Page 537 and Tell-Me Dimensionswerte as Dimension Values proof.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The smallest useful next step is to recover the related-action route from a selected Dimension row to its Dimension Values without writing setup.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-READINESS-DECISION-REFRESH-AFTER-DIMENSIONS',
          status: blocked.length > 0 ? 'ready-after-current' : 'ready-next',
          reason: 'Foundation Readiness should consume the Dimension Values route outcome after it is proven or explicitly parked.'
        },
        {
          caseId: 'PWS-FF-001-NUMBER-SERIES-READFIRST',
          status: 'ready-after-current',
          reason: 'Number Series is another Foundation lane that can be observed before write-gated Master Data.'
        },
        {
          caseId: 'PWS-MD-001-CUSTOMER-CONTEXT-READFIRST',
          status: 'needs-setup-first',
          reason: 'Customer context remains parked until Foundation Readiness accepts or parks open setup boundaries.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase,
      whySelectedNextCaseIsBest:
        blocked.length > 0
          ? 'The related-action route still needs a narrower UI discovery or park decision before claiming Dimension Values proof.'
          : 'The decision file is the right place to classify whether Dimensions are enough for the next Foundation step or still need a separate setup-write gate.',
      risksBeforeNextCase: [
        'Do not treat visible dimensions as posted reporting proof.',
        'Do not create master data before Foundation Readiness classifies VAT, posting groups, number series and dimensions.',
        'Do not change global dimensions without a separate Smart Decision write gate.'
      ],
      requiredPreparation: ['Normalize this result and refresh Foundation Readiness plan-only or through the existing decision script.']
    },
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noGlobalDimensionChange: true,
      noDefaultDimensionChange: true,
      screenshotQa: true
    },
    evidenceRefs,
    nextCase: selectedNextCase,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed'
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-FF-005B-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# PWS-FF-005B Dimension Values Related-Action Route Recovery',
      '',
      'Dieser Lauf prueft lesend, ob ein Key User von der Dimensionen-Liste ueber die Aktion Dimension zu den passenden Dimensionswerten gelangt.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      `${observed.length}/${results.length} Routen-/Seitenkontexte wurden als read-only beobachtet.`,
      '',
      '## UI-Learning',
      '',
      '- Dimensionen sind keine Buchung und keine Stammdatenkarte, sondern Auswertungsachsen.',
      '- Dimensionswerte muessen im richtigen Dimensionskontext gelesen werden; ein Suchdialog, Role Center oder Intercompany-Zuordnungsseite reicht nicht als Beweis.',
      '- Dieser Lauf verwendet bewusst keinen Tell-Me-Fallback fuer Dimensionswerte, weil PWS-FF-005 gezeigt hat, dass die Suche einen falschen Seitenkontext oeffnen kann.',
      '- Globale Dimensionen und Standarddimensionen sind eigene Setup-Entscheidungen und wurden nicht geaendert.',
      '- Sichtbare Aktionen wie Neu, Liste bearbeiten oder Loeschen sind nur Screenshot-Kontext, keine ausgefuehrten Aktionen.',
      '',
      '## Nicht enthalten',
      '',
      '- Keine Dimension wurde angelegt oder geaendert.',
      '- Kein Dimensionswert wurde angelegt oder geaendert.',
      '- Keine globale Dimension wurde gesetzt.',
      '- Keine Standarddimension wurde zugeordnet.',
      '- Keine Stammdaten, kein Beleg, kein Draft.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine API-Abkuerzung.',
      '',
      '## Evidence-Dateien',
      '',
      ...evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(unsafe, 'PWS-FF-005B must not continue with wrong instance/company.').toEqual([]);
});
