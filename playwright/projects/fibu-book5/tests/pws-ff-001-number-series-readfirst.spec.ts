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
  process.env.PWS_FF_001_LIVE_APPROVED !== '1' || process.env.PWS_FF_001_RUNNER_GUARD_CHECKED !== '1',
  'PWS-FF-001 must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'PWS-FF-001-NUMBER-SERIES-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'pws-ff-001-number-series-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const TARGET_SERIES = ['U-CUST', 'U-VEND', 'U-ITEM', 'U-SO', 'U-SINV', 'U-PO', 'U-PINV'];

type ActionCandidate = {
  text: string;
  aria: string;
  title: string;
  role: string;
  visibleText: string;
};

type Capture = {
  step: string;
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  textFile: string;
  snapshotFile: string;
  compact: string;
  actionCandidates: ActionCandidate[];
};

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
  const url = new URL(process.env.PWS_FF_001_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include a tenant/environment path before PWS-FF-001 can build a page URL.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  return url;
}

function buildNumberSeriesUrl(filterCode?: string) {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', '456');
  url.searchParams.set('dc', '0');
  if (filterCode) url.searchParams.set('filter', `'No. Series'.Code IS '${filterCode}'`);
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
    /Loeschen|Delete/i.test(text) ? 'Delete/Loeschen may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text) ? 'Posting or preview text may be visible but was not clicked.' : ''
  ].filter(Boolean);
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  const visibleValues = await collectVisibleValues(page);
  return clean(`${body}\n${frameTexts.join('\n')}\n${visibleValues.join('\n')}`);
}

async function compactNumberSeriesText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines|Code|Beschreibung|Description|Standardnr|Default Nos|Manuelle|Manual Nos|Startnr|Starting No|Endnr|Ending No|Letzte Nr|Last No|U-CUST|U-VEND|U-ITEM|U-SO|U-SINV|U-PO|U-PINV|Universaarl|Zeilen|Lines|Verbindungen|Relationships|Weitere Optionen|More|Liste bearbeiten|Edit List/i
      ],
      maxLines: 260,
      maxLineLength: 260
    }).catch(() => '')
  );
}

async function collectVisibleValues(page: Page) {
  const frameValues = await Promise.all(
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
            '[role="columnheader"]',
            '[role="row"]',
            '[role="textbox"]',
            '[role="combobox"]',
            'input',
            'textarea',
            'button',
            '[role="button"]',
            '[role="menuitem"]',
            'span[title]',
            'div[title]'
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
            .slice(0, 700);
        })
        .catch(() => [])
    )
  );
  return [...new Set(frameValues.flat())];
}

async function collectActions(page: Page): Promise<ActionCandidate[]> {
  const frameResults = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate(() => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
            .filter(visible)
            .map((element) => ({
              text: normalize(element.innerText || element.textContent),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              role: normalize(element.getAttribute('role') || element.tagName.toLowerCase()),
              visibleText: normalize(`${element.innerText || element.textContent} ${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''}`)
            }))
            .filter((entry) => entry.visibleText)
            .slice(0, 240);
        })
        .catch(() => [] as ActionCandidate[])
    )
  );
  const seen = new Set<string>();
  return frameResults
    .flat()
    .filter((entry) => {
      const key = `${entry.role}|${entry.visibleText}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter((entry) => /Zeilen|Line|Verbindungen|Relationship|Liste bearbeiten|Edit List|Weitere Optionen|More|Alle anzeigen|Show all|Neu|New|Standard|Default|Manual|Manuelle|Personalisieren|Personalize|Seiten|Inspect/i.test(entry.visibleText))
    .slice(0, 100);
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

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}): Promise<Capture> {
  const compact = (await compactNumberSeriesText(page)) || (await fullText(page));
  const textFile = `${filePrefix}.txt`;
  const snapshotFile = `${filePrefix}.snapshot.json`;
  const actionCandidates = await collectActions(page);
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), compact || 'No compact page text captured.');
  const shot = await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nummernserie / No. Series',
    pageId: 456,
    step,
    visibleSignals: compact.split('\n').slice(0, 90),
    actionCandidates,
    importantUi: [
      'Seitentitel Nummernserie / No. Series',
      'Code and Description columns',
      'Standardnr. / Default Nos. checkbox column',
      'Manuelle Anz. / Manual Nos. checkbox column',
      'Zeilen / Lines action',
      'Visible Universaarl U-* number-series rows'
    ],
    visibleLearning:
      'Nummernserien steuern spaetere Beleg- und Stammdatennummern. Checkboxen und Zeilen gehoeren zur fachlichen Bedeutung der Nummernvergabe und muessen vor Master-Data-Writes sichtbar verstanden werden.',
    internallyProves: `Read-only UI checkpoint for Number Series in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
    doesNotProve: [
      'No number series was created or edited.',
      'No number-series line was created or edited.',
      'No number series was assigned to setup.',
      'No customer, vendor, item, document, preview posting or posting was created.'
    ],
    finalScreenshotStatus: 'foundation-readfirst-candidate',
    noWrite: true,
    noPost: true,
    noPreview: true,
    ...extra
  });
  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, snapshotFile), {
    step,
    url: sanitizeUrl(page.url()),
    title: clean(await page.title()),
    compact,
    actionCandidates,
    ...extra
  });
  return {
    step,
    url: sanitizeUrl(page.url()),
    screenshot: shot.screenshot,
    screenshotMetadata: shot.screenshotMetadata,
    textFile: `${EVIDENCE_DIR_REL}/${textFile}`,
    snapshotFile: `${EVIDENCE_DIR_REL}/${snapshotFile}`,
    compact,
    actionCandidates
  };
}

async function openNumberSeries(page: Page) {
  await page.goto(buildNumberSeriesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(1200);

  let text = await fullText(page);
  if (/Nummernserie|No\. Series/i.test(text)) return 'direct-page-456-url';

  await searchFor(page, 'Nummernserien');
  await openSearchResult(page, /Nummernserie\s+Verwaltung|Nummernserie|Nummernserien|No\. Series/i, {
    occurrence: 0
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1200);
  text = await fullText(page);
  if (!/Nummernserie|No\. Series/i.test(text)) throw new Error('Number Series page did not open with accepted title signals.');
  return 'tell-me-search-number-series';
}

async function clickFirstVisible(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'row', 'gridcell'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 900 }).catch(() => false)) {
        const clicked = await locator.click({ timeout: 5000 }).then(() => true).catch(async () => {
          const text = await fullText(page).catch(() => '');
          return /Nr\.-Serienzeilen|No\. Series Lines/i.test(text);
        });
        if (!clicked) continue;
        await page.waitForTimeout(900);
        return true;
      }
    }
    const text = scope.getByText(name).first();
    if (await text.isVisible({ timeout: 900 }).catch(() => false)) {
      const clicked = await text.click({ timeout: 5000 }).then(() => true).catch(async () => {
        const bodyText = await fullText(page).catch(() => '');
        return /Nr\.-Serienzeilen|No\. Series Lines/i.test(bodyText);
      });
      if (!clicked) continue;
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

async function hoverFirst(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['columnheader', 'gridcell', 'button'] as const) {
      const locator = scope.getByRole(role, { name: label }).first();
      if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
        await locator.hover({ timeout: 3000 }).catch(() => undefined);
        await page.waitForTimeout(900);
        return true;
      }
    }
    const locator = scope.getByText(label).first();
    if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
      await locator.hover({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

async function tryOpenLines(page: Page) {
  const selected = await clickFirstVisible(page, /^U-CUST\b|\bU-CUST\b/i);
  if (!selected) return { selected, linesOpened: false };
  const linesOpened = await clickFirstVisible(page, /^Zeilen$|^Lines$/i);
  if (linesOpened) {
    await waitForBusinessCentralShell(page).catch(() => undefined);
    await page.waitForTimeout(1200);
  }
  return { selected, linesOpened };
}

async function tryPageInspection(page: Page) {
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1500);
  const text = await fullText(page);
  return /Page Inspection|Seitenprufung|Seitenueberprufung|No\. Series \(456, List\)|No\. Series \(308\)|No\. Series Line \(309\)|Default Nos\.|Manual Nos\./i.test(text);
}

function targetSeriesSummary(text: string) {
  return Object.fromEntries(
    TARGET_SERIES.map((code) => [
      code,
      {
        visible: new RegExp(`\\b${code}\\b`, 'i').test(text),
        startVisible: new RegExp(`${code}0+1|${code}00001`, 'i').test(text),
        endVisible: new RegExp(`${code}9+|${code}99999`, 'i').test(text)
      }
    ])
  );
}

test('PWS-FF-001 captures Number Series context read-first with screenshot QA', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const openRoute = await openNumberSeries(page);
  const captures: Capture[] = [];

  captures.push(
    await captureState(page, 'pws-ff-001-010-number-series-list-context', 'Number Series list context before row/action inspection.', {
      openRoute,
      expectation: 'The page title, code/description columns and visible Universaarl U-* rows should be visible.'
    })
  );

  const selectedUCust = await clickFirstVisible(page, /^U-CUST\b|\bU-CUST\b/i);
  captures.push(
    await captureState(page, 'pws-ff-001-020-u-cust-row-selected', 'U-CUST row selected before inspecting checkbox and line action context.', {
      selectedUCust,
      actionRisk: 'row-selection-only-no-write'
    })
  );

  const hoverDefaultNos = await hoverFirst(page, /Standardnr\.?|Default Nos\.?/i);
  const hoverManualNos = await hoverFirst(page, /Manuelle Anz\.?|Manual Nos\.?/i);
  captures.push(
    await captureState(page, 'pws-ff-001-030-checkbox-hover-context', 'Hover context for Standardnr. and Manuelle Anz. checkbox columns.', {
      hoverDefaultNos,
      hoverManualNos,
      actionRisk: 'hover-only-no-write'
    })
  );

  const linesRoute = await tryOpenLines(page);
  captures.push(
    await captureState(page, 'pws-ff-001-040-lines-action-context', 'Lines action context after selecting U-CUST and using Zeilen/Lines if safely visible.', {
      ...linesRoute,
      actionRisk: 'related-action-read-only-no-write'
    })
  );

  const pageInspectionOpened = await tryPageInspection(page);
  captures.push(
    await captureState(page, 'pws-ff-001-050-page-inspection-context', 'Page Inspection technical context after Number Series route QA.', {
      pageInspectionOpened,
      actionRisk: 'technical-read-only-inspection'
    })
  );

  const rawText = clean(captures.map((entry) => entry.compact).join('\n'));
  const unsafe = captures.filter((entry) => !instancePathIsTarget(entry.url) || !companyParamIsTarget(entry.url));
  const pageTitleVisible = /Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(rawText);
  const checkboxSignals = /Standardnr|Default Nos|Manuelle Anz|Manual Nos/i.test(rawText);
  const uSeries = targetSeriesSummary(rawText);
  const visibleUSeries = Object.values(uSeries).filter((entry) => entry.visible).length;
  const lineSignals = /Nr\.-Serienzeilen|No\. Series Lines|Startnr|Starting No|Endnr|Ending No|Letzte Nr|Last No/i.test(rawText);
  const status = unsafe.length
    ? 'blocked'
    : pageTitleVisible && checkboxSignals && visibleUSeries >= 3
      ? 'observed'
      : 'partially-completed';
  const nextCase = 'FOUNDATION-READINESS-DECISION-REFRESH-AFTER-NUMBER-SERIES';
  const warnings = Array.from(new Set(visibleWarnings(rawText)));
  const evidenceRefs = [
    `${EVIDENCE_DIR_REL}/PWS-FF-001-result.json`,
    `${EVIDENCE_DIR_REL}/README.md`,
    ...captures.flatMap((entry) => [entry.textFile, entry.snapshotFile, entry.screenshot, entry.screenshotMetadata])
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-foundation-number-series',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Nummernserie / No. Series',
    url: captures.map((entry) => entry.url),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      `Opened Number Series page 456 read-only via ${openRoute}.`,
      selectedUCust ? 'Selected U-CUST row read-only for context.' : 'Tried to select U-CUST row read-only.',
      'Hovered Standardnr./Default Nos. and Manuelle Anz./Manual Nos. where visible.',
      linesRoute.linesOpened ? 'Opened Zeilen/Lines related context read-only.' : 'Tried to inspect Zeilen/Lines read-only, but it was not safely opened.',
      'Captured Page Inspection context read-only if available.',
      'Captured checkpoint screenshots and compact page text for list, row, checkbox, action and technical context.'
    ],
    actionsNotTaken: [
      'No New/Neu action clicked.',
      'No Edit/Bearbeiten or Edit List action clicked.',
      'No number series created.',
      'No number series edited.',
      'No number-series line created.',
      'No number-series line edited.',
      'No number series assigned to any setup page.',
      'No customer, vendor or item created.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
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
    captures,
    screenshots: captures.map((entry) => entry.screenshot),
    signalSummary: {
      pageTitleVisible,
      checkboxSignals,
      lineSignals,
      targetSeries: uSeries,
      visibleUSeries,
      hoverDefaultNos,
      hoverManualNos,
      pageInspectionOpened
    },
    proved: [
      status === 'blocked'
        ? ''
        : `Number Series read-first context was observed in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
      pageTitleVisible ? 'Number Series or Number Series Lines page title/context was visible.' : '',
      checkboxSignals ? 'Numbering checkbox context such as Standardnr./Default Nos. or Manuelle Anz./Manual Nos. was visible.' : '',
      visibleUSeries > 0 ? `${visibleUSeries} Universaarl U-* number-series codes were visible in captured UI text.` : '',
      lineSignals ? 'Number Series Lines context/signals were visible read-only.' : '',
      'No number-series setup, master data, draft, Preview Posting, Posting, payment, API shortcut or company switch was executed.'
    ].filter(Boolean),
    notProved: [
      status === 'observed' ? '' : 'Number Series proof is incomplete because one or more required UI signals were missing.',
      'No number-series correctness or completeness.',
      'No persisted checkbox value was changed or newly proven by a write/reopen cycle.',
      'No setup assignment for customer/vendor/item/document number series.',
      'No master data readiness.',
      'No legal numbering policy or audit readiness.',
      'No Preview Posting or Posting readiness.'
    ].filter(Boolean),
    blockedBy:
      status === 'blocked'
        ? ['Unsafe instance/company context appeared in captured URLs.']
        : status === 'partially-completed'
          ? [
              pageTitleVisible ? '' : 'Number Series page title/context signal missing.',
              checkboxSignals ? '' : 'Numbering checkbox signals missing.',
              visibleUSeries >= 3 ? '' : 'Fewer than three Universaarl U-* series visible.'
            ].filter(Boolean)
          : [],
    warnings,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'PWS-FF-005B consumed Dimension Values route proof; Number Series remained the smallest Foundation read-first dependency before Master Data write gates.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'Number Series controls later customer/vendor/item/document numbering and must be classified before any write-gated master data case.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: 'ready-next',
          reason: 'Foundation Readiness should consume the Number Series read-first result before Master Data.'
        },
        {
          caseId: 'PWS-MD-001-CUSTOMER-CONTEXT-READFIRST',
          status: 'needs-setup-first',
          reason: 'Customer context stays parked until Foundation Readiness classifies numbering, VAT, posting groups and dimensions.'
        },
        {
          caseId: 'PWS-MD-002-VENDOR-CONTEXT-READFIRST',
          status: 'needs-setup-first',
          reason: 'Vendor context depends on number-series and posting/VAT readiness boundaries.'
        },
        {
          caseId: 'PWS-MD-003-ITEM-SERVICE-CONTEXT-READFIRST',
          status: 'needs-setup-first',
          reason: 'Item/service context depends on item numbering and posting/VAT readiness boundaries.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        'The decision file is the control point that prevents jumping from visible Number Series UI directly into Master Data writes.',
      risksBeforeNextCase: [
        'Do not interpret visible U-* rows as full numbering setup readiness.',
        'Do not create master data until Foundation Readiness explicitly allows a write-gated pilot.',
        'Do not change checkbox values or line values without a separate Smart Decision write gate.'
      ],
      requiredPreparation: ['Normalize this result and refresh Foundation Readiness plan-only.']
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
      screenshotQa: true
    },
    evidenceRefs,
    nextCase,
    requiresReview: status !== 'observed',
    safeToFinalizeState: status === 'observed'
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'PWS-FF-001-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# PWS-FF-001 Number Series Read-first',
      '',
      `Status: ${status}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Zweck',
      '',
      'Dieser Lauf prueft die Nummernserien nur lesend. Fuer das Buch und die spaetere Schulung ist wichtig, dass nicht nur Codes sichtbar sind, sondern auch Checkboxen, Zeilen und Aktionen verstanden werden.',
      '',
      '## UI-Learning',
      '',
      '- Nummernserien vergeben spaeter Nummern fuer Stammdaten und Belege.',
      '- Standardnr. / Default Nos. und Manuelle Anz. / Manual Nos. sind fachlich relevante Checkboxen.',
      '- Zeilen / Lines fuehrt in den Bereich, in dem Start-, End- und laufende Nummern sichtbar werden koennen.',
      '- Sichtbare Aktionen sind Kontext, aber keine ausgefuehrten Setup-Aenderungen.',
      '',
      '## Nicht gemacht',
      '',
      '- Keine Nummernserie wurde angelegt oder geaendert.',
      '- Keine Nummernserienzeile wurde angelegt oder geaendert.',
      '- Keine Nummernserie wurde einer Setup-Seite zugewiesen.',
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

  expect(unsafe, 'PWS-FF-001 must not continue with wrong instance/company.').toEqual([]);
});
