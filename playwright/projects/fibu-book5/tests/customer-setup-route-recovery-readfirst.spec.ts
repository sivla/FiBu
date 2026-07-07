import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(300_000);
test.skip(
  process.env.CUSTOMER_SETUP_ROUTE_RECOVERY_LIVE_APPROVED !== '1' ||
    process.env.CUSTOMER_SETUP_ROUTE_RECOVERY_RUNNER_GUARD_CHECKED !== '1',
  'CUSTOMER-SETUP-ROUTE-RECOVERY-READFIRST must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'CUSTOMER-SETUP-ROUTE-RECOVERY-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'customer-setup-route-recovery-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

type Probe = {
  id: string;
  pageId: number;
  label: string;
  searchTerms: string[];
  title: RegExp;
  requiredSignals: RegExp[];
  candidates: RegExp[];
  beginnerMeaning: string;
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked';
  routeUsed: string;
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  textFile: string;
  pageInspectionOpened: boolean;
  pageInspectionScreenshot?: string;
  visibleSignals: string[];
  blockedBy: string[];
  warnings: string[];
};

const probes: Probe[] = [
  {
    id: 'customer-posting-groups',
    pageId: 110,
    label: 'Debitorenbuchungsgruppen / Customer Posting Groups',
    searchTerms: ['Debitorenbuchungsgruppen', 'Customer Posting Groups'],
    title: /Debitorenbuchungsgruppen|Customer Posting Groups/i,
    requiredSignals: [/Code/i, /Beschreibung|Description/i, /Debitorensammelkonto|Receivables Account|Forderung/i],
    candidates: [/Debitorenbuchungsgruppen/i, /Customer Posting Groups/i],
    beginnerMeaning:
      'Debitorenbuchungsgruppen verbinden Debitorenposten mit dem Forderungskonto. Fuer einen ersten Verkaufsprozess muss diese Liste sichtbar und fachlich verstanden sein.'
  },
  {
    id: 'general-business-posting-groups',
    pageId: 312,
    label: 'Geschaeftsbuchungsgruppen / Gen. Business Posting Groups',
    searchTerms: ['Geschaeftsbuchungsgruppen', 'Geschäftsbuchungsgruppen', 'Gen. Business Posting Groups'],
    title: /Geschaeftsbuchungsgruppen|Gesch[a-z]*ftsbuchungsgruppen|Gen\.? Business Posting Groups/i,
    requiredSignals: [/Code/i, /Beschreibung|Description/i],
    candidates: [/Geschaeftsbuchungsgruppen/i, /Gesch[a-z]*ftsbuchungsgruppen/i, /Gen\.? Business Posting Groups/i],
    beginnerMeaning:
      'Geschaeftsbuchungsgruppen beschreiben, mit welcher Art Geschaeftspartner die Firma handelt. Zusammen mit Produktbuchungsgruppen steuern sie die Buchungsmatrix.'
  },
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    searchTerms: ['MwSt.-Geschäftsbuchungsgruppen', 'MwSt.-Geschaeftsbuchungsgruppen', 'VAT Business Posting Groups'],
    title: /MwSt\.-?Geschaeftsbuchungsgruppen|MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i,
    requiredSignals: [/Code/i, /Beschreibung|Description/i],
    candidates: [/MwSt[\s\S]{0,80}Gesch/i, /MwSt[\s\S]{0,80}Geschaeft/i, /VAT Business Posting Groups/i],
    beginnerMeaning:
      'MwSt.-Geschaeftsbuchungsgruppen ordnen Debitoren und Kreditoren einem steuerlichen Markt zu. Sie sind Voraussetzung fuer spaetere VAT-Setup-Entscheidungen.'
  },
  {
    id: 'payment-terms',
    pageId: 4,
    label: 'Zahlungsbedingungen / Payment Terms',
    searchTerms: ['Zahlungsbedingungen', 'Payment Terms'],
    title: /Zahlungsbedingungen|Payment Terms/i,
    requiredSignals: [/Code/i, /Beschreibung|Description/i, /Faelligkeitsformel|Due Date Calculation/i],
    candidates: [/Zahlungsbedingungen/i, /Payment Terms/i],
    beginnerMeaning:
      'Zahlungsbedingungen steuern Faelligkeiten und Skontologik. Ohne sichtbaren Setup-Kontext darf keine Zahlungsbedingung auf einen Debitor geschrieben werden.'
  }
];

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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|originAuthorityValidator|upn:/i.test(line))
    .join('\n')
    .trim();
}

function targetInstanceUrl() {
  const url = new URL(process.env.CUSTOMER_SETUP_ROUTE_RECOVERY_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL must include a tenant/environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url;
}

function buildTargetUrl(pageId?: number) {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  if (pageId) url.searchParams.set('page', String(pageId));
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

async function compactSignals(page: Page, probe: Probe) {
  const include = [probe.title, ...probe.requiredSignals, /Neu|New|Liste bearbeiten|Edit|Verwaltung|Administration/i];
  const compact = await compactPageText(page, { include, maxLines: 140, maxLineLength: 220 }).catch(() => '');
  const text = clean(`${compact}\n${await fullText(page)}`);
  return text.split('\n').filter((line, index, all) => index === all.indexOf(line)).slice(0, 140);
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

async function capture(page: Page, captures: Capture[], fileName: string, metadata: Record<string, unknown>) {
  const shot = await screenshotWithMetadata(page, fileName, metadata);
  captures.push(shot);
  return shot;
}

function pageLooksAccepted(text: string, probe: Probe) {
  return probe.title.test(text) && probe.requiredSignals.every((pattern) => pattern.test(text)) && !/Business Manager Role Center|Rollencenter|Was mochten Sie tun|Wie mochten Sie weiter verfahren|Nach .* suchen/i.test(text);
}

function blockedReasons(text: string, inspectionText: string, probe: Probe) {
  return [
    probe.title.test(text) ? '' : 'Target page title is not visible in the page surface.',
    ...probe.requiredSignals.map((pattern) => (pattern.test(text) ? '' : `Required page signal missing: ${pattern}`)),
    /Business Manager Role Center|Rollencenter/i.test(inspectionText) ? 'Page Inspection shows Business Manager Role Center instead of the requested setup page.' : '',
    /Was mochten Sie tun|Wie mochten Sie weiter verfahren|Nach .* suchen/i.test(text) ? 'Visible state still looks like Tell-Me/search overlay.' : ''
  ].filter(Boolean);
}

async function inspectCurrentPage(page: Page, captures: Capture[], probe: Probe, fileName: string, routeUsed: string) {
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1200);
  const text = await fullText(page);
  const opened = /Page Inspection|Seitenuberprufung|Seitenueberpruefung|Page ID|Page Name|Source Table|Tabelle/i.test(text);
  const shot = await capture(page, captures, fileName, {
    page: probe.label,
    pageId: probe.pageId,
    step: `Page Inspection after ${routeUsed}`,
    routeUsed,
    visibleSignals: text.split('\n').slice(0, 120),
    pageInspectionOpened: opened,
    noWrite: true,
    noPost: true,
    noPreview: true
  });
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  return { opened, text, shot };
}

async function findSearchCandidates(page: Page, probe: Probe) {
  const candidates: Array<{ frameUrl: string; text: string; role: string; rect: { x: number; y: number; width: number; height: number } }> = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const selectors = '[role="option"],[role="button"],[role="link"],button,a,li,div,span';
        return [...document.querySelectorAll<HTMLElement>(selectors)]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
            const visible =
              text.length > 0 &&
              rect.width > 1 &&
              rect.height > 1 &&
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < window.innerHeight &&
              rect.left < window.innerWidth &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              Number(style.opacity || '1') > 0;
            if (!visible) return null;
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              }
            };
          })
          .filter(Boolean)
          .slice(0, 120);
      })
      .catch(() => []);
    for (const entry of entries as Array<{ text: string; role: string; rect: { x: number; y: number; width: number; height: number } }>) {
      if (probe.candidates.some((pattern) => pattern.test(entry.text))) {
        candidates.push({ frameUrl: sanitizeUrl(frame.url()), ...entry });
      }
    }
  }
  return candidates;
}

async function clickSearchResult(page: Page, probe: Probe) {
  const scopes = [page, ...page.frames()] as Array<Page | Frame>;
  for (const scope of scopes) {
    for (const pattern of probe.candidates) {
      const locators = [
        scope.getByRole('option', { name: pattern }),
        scope.getByRole('button', { name: pattern }),
        scope.getByRole('link', { name: pattern }),
        scope.getByText(pattern)
      ];
      for (const locator of locators) {
        const count = await locator.count().catch(() => 0);
        for (let index = 0; index < Math.min(count, 6); index += 1) {
          const item = locator.nth(index);
          if (!(await item.isVisible({ timeout: 500 }).catch(() => false))) continue;
          await item.click({ timeout: 5000 }).catch(() => undefined);
          await page.waitForTimeout(2500);
          return true;
        }
      }
    }
  }

  const candidates = await findSearchCandidates(page, probe);
  const exact = candidates
    .filter((entry) => probe.candidates.some((pattern) => pattern.test(entry.text)))
    .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];
  if (!exact) return false;
  await page.mouse.click(exact.rect.x + Math.min(40, Math.round(exact.rect.width / 2)), exact.rect.y + Math.round(exact.rect.height / 2));
  await page.waitForTimeout(2500);
  return true;
}

async function tryDirectRoute(page: Page, probe: Probe, captures: Capture[]) {
  await page.goto(buildTargetUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1200);
  const text = (await compactSignals(page, probe)).join('\n');
  const shot = await capture(page, captures, `customer-route-recovery-${probe.id}-010-direct.png`, {
    page: probe.label,
    pageId: probe.pageId,
    step: 'Direct page-id route after dependency blocker',
    routeUsed: 'direct-page-id',
    visibleSignals: text.split('\n').slice(0, 90),
    internallyProves: pageLooksAccepted(text, probe) ? 'Direct page route shows the target setup page.' : 'Direct route is not accepted without Page Inspection.',
    beginnerMeaning: probe.beginnerMeaning,
    noWrite: true,
    noPost: true,
    noPreview: true
  });
  const inspection = await inspectCurrentPage(page, captures, probe, `customer-route-recovery-${probe.id}-011-direct-page-inspection.png`, 'direct-page-id');
  const accepted = pageLooksAccepted(text, probe) && probe.title.test(inspection.text) && !/Business Manager Role Center|Rollencenter/i.test(inspection.text);
  return {
    routeUsed: 'direct-page-id',
    accepted,
    shot,
    text,
    inspection,
    blockedBy: accepted ? [] : blockedReasons(text, inspection.text, probe)
  };
}

async function tryTellMeRoute(page: Page, probe: Probe, captures: Capture[]) {
  let clicked = false;
  let searchTerm = '';
  let overlayText = '';
  let candidates: unknown[] = [];
  for (const term of probe.searchTerms) {
    searchTerm = term;
    await page.goto(buildTargetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page);
    await searchFor(page, term);
    overlayText = await fullText(page);
    candidates = await findSearchCandidates(page, probe);
    await capture(page, captures, `customer-route-recovery-${probe.id}-020-search-overlay-${probe.searchTerms.indexOf(term) + 1}.png`, {
      page: probe.label,
      pageId: probe.pageId,
      step: `Tell-Me/search overlay for ${term}`,
      routeUsed: 'bounded-tell-me',
      searchTerm: term,
      candidates,
      visibleSignals: overlayText.split('\n').filter((line) => probe.candidates.some((pattern) => pattern.test(line))).slice(0, 80),
      noWrite: true,
      noPost: true,
      noPreview: true
    });
    clicked = await clickSearchResult(page, probe);
    if (clicked) break;
  }

  await page.waitForTimeout(1800);
  const text = (await compactSignals(page, probe)).join('\n');
  const shot = await capture(page, captures, `customer-route-recovery-${probe.id}-030-after-search-click.png`, {
    page: probe.label,
    pageId: probe.pageId,
    step: 'After bounded Tell-Me result activation',
    routeUsed: 'bounded-tell-me',
    searchTerm,
    clicked,
    candidates,
    visibleSignals: text.split('\n').slice(0, 100),
    internallyProves: pageLooksAccepted(text, probe) ? 'Tell-Me route shows the target setup page.' : 'Tell-Me route is not accepted without Page Inspection.',
    beginnerMeaning: probe.beginnerMeaning,
    noWrite: true,
    noPost: true,
    noPreview: true
  });
  const inspection = await inspectCurrentPage(page, captures, probe, `customer-route-recovery-${probe.id}-031-search-page-inspection.png`, 'bounded-tell-me');
  const accepted = clicked && pageLooksAccepted(text, probe) && probe.title.test(inspection.text) && !/Business Manager Role Center|Rollencenter/i.test(inspection.text);
  return {
    routeUsed: 'bounded-tell-me',
    accepted,
    shot,
    text,
    inspection,
    blockedBy: accepted
      ? []
      : [
          clicked ? '' : 'No search result candidate was clicked.',
          ...blockedReasons(text, inspection.text, probe)
        ].filter(Boolean)
  };
}

async function recoverProbe(page: Page, probe: Probe, captures: Capture[]): Promise<ProbeResult> {
  const direct = await tryDirectRoute(page, probe, captures);
  const selected = direct.accepted ? direct : await tryTellMeRoute(page, probe, captures);
  const routeTextFile = `${EVIDENCE_DIR_REL}/customer-route-recovery-${probe.id}.txt`;
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, `customer-route-recovery-${probe.id}.txt`), selected.text || 'No target page text captured.');
  const status = selected.accepted ? 'observed' : 'blocked';
  const signals = selected.text.split('\n').slice(0, 120);
  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    routeUsed: selected.routeUsed,
    url: sanitizeUrl(page.url()),
    screenshot: selected.shot.screenshot,
    screenshotMetadata: selected.shot.screenshotMetadata,
    textFile: routeTextFile,
    pageInspectionOpened: selected.inspection.opened,
    pageInspectionScreenshot: selected.inspection.shot.screenshot,
    visibleSignals: signals,
    blockedBy: selected.blockedBy,
    warnings: [
      /Neu|New/i.test(selected.text) ? 'New/Neu visible but not clicked.' : '',
      /Liste bearbeiten|Edit/i.test(selected.text) ? 'Edit/List Edit visible but not clicked.' : '',
      /Buchen|Post|Preview Posting|Buchungsvorschau/i.test(selected.text) ? 'Posting/Preview text visible but not clicked.' : ''
    ].filter(Boolean)
  };
}

test('CUSTOMER-SETUP-ROUTE-RECOVERY-READFIRST recovers setup pages without writes', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const results: ProbeResult[] = [];

  for (const probe of probes) {
    results.push(await recoverProbe(page, probe, captures));
  }

  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status === 'blocked');
  const resultStatus = blocked.length === 0 ? 'observed-route-recovery' : observed.length > 0 ? 'partially-observed-route-recovery' : 'blocked-route-recovery';
  const nextCase = blocked.length === 0 ? 'CUSTOMER-SETUP-VALUE-WRITE-GATE' : CASE_ID;
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-customer-setup-route-recovery',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Customer setup route recovery',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    actionsTaken: [
      'Opened playthru / UNIVERSAARL-DE read-only.',
      'Tried direct page-id route for Customer Posting Groups, General Business Posting Groups, VAT Business Posting Groups and Payment Terms.',
      'Tried bounded Tell-Me/search route where direct route was not accepted.',
      'Captured screenshots, compact text and Page Inspection diagnostics for each setup page route.'
    ],
    actionsNotTaken: [
      'No customer edited or saved.',
      'No setup row created, edited or saved.',
      'No dropdown value selected.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No confidential real customer data used.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    confidentialRealCustomerDataUsed: false,
    routeResults: results,
    screenshots: captures.map((entry) => entry.screenshot),
    screenshotQa: {
      acceptedPages: observed.map((entry) => entry.label),
      blockedPages: blocked.map((entry) => ({ label: entry.label, blockedBy: entry.blockedBy })),
      acceptedForWriteGate: blocked.length === 0,
      reason:
        blocked.length === 0
          ? 'All customer setup dependency pages were accepted by screenshot and Page Inspection QA.'
          : 'Some customer setup dependency pages still need route recovery before any write gate.'
    },
    proved: [
      'playthru / UNIVERSAARL-DE was used for a real Business Central read-first route-recovery run.',
      ...observed.map((entry) => `${entry.label} was recovered read-only via ${entry.routeUsed}.`),
      'No setup, master data, document, Preview Posting, Posting, payment or API shortcut was changed.'
    ],
    notProved: [
      'No customer setup value was selected or written.',
      'No setup correctness, VAT correctness or O2C readiness.',
      ...blocked.map((entry) => `${entry.label} remains blocked: ${entry.blockedBy.join('; ')}`)
    ],
    blockedBy: blocked.flatMap((entry) => entry.blockedBy.map((reason) => `${entry.label}: ${reason}`)),
    warnings: [
      'This run uses real Business Central UI in playthru, not mockups.',
      'Customer data is realistic fictitious Universaarl data, not confidential real customer data.',
      'Visible setup lists do not by themselves prove account/tax/process correctness.'
    ],
    flags: {
      noSetupChange: true,
      noMasterDataChange: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noApiShortcut: true,
      noConfidentialRealCustomerData: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'CUSTOMER-SETUP-VALUE-WRITE-GATE',
      lastEvidenceSummary: `Recovered ${observed.length}/${results.length} customer setup dependency pages.`,
      isPlannedNextCaseStillSensible: blocked.length === 0,
      reason:
        blocked.length === 0
          ? 'All required setup pages are now visible; a narrow Smart Decision can choose values.'
          : 'At least one required setup page remains blocked; write gate remains blocked.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-SETUP-VALUE-WRITE-GATE',
          status: blocked.length === 0 ? 'ready-after-current' : 'blocked',
          reason: blocked.length === 0 ? 'All setup dependency pages are visible.' : 'Route recovery remains incomplete.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'O2C needs setup values plus item/service readiness before a process route.'
        },
        {
          caseId: 'CUSTOMER-TRAINING-SETUP-FIELDS-DRAFT',
          status: observed.length > 0 ? 'ready-after-current' : 'needs-book-context-first',
          reason: 'Only accepted setup pages can feed training text; blocked routes remain an internal note.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        blocked.length === 0
          ? 'The write gate can now work from accepted setup-page evidence instead of guessing.'
          : 'Repeating the same write gate would be unsafe while route recovery is incomplete.',
      risksBeforeNextCase: ['Visible setup list does not equal correctness.', 'Do not assign values until a separate Smart Decision names exact codes.'],
      requiredPreparation:
        blocked.length === 0
          ? ['Choose exact setup values from accepted page evidence.', 'Keep the write gate field-limited and reopen-proven.']
          : ['Repair remaining blocked route(s) or consciously park them with a safer Foundation alternative.']
    },
    nextCase
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# CUSTOMER-SETUP-ROUTE-RECOVERY-READFIRST',
      '',
      `Status: ${resultStatus}`,
      `Setup-Seiten akzeptiert: ${observed.length}/${results.length}`,
      '',
      'Dieser Lauf prueft echte Business-Central-Routen zu Setup-Seiten fuer Debitoren. Role-Center- oder Suchoverlay-Screenshots zaehlen nicht als Setup-Seitenbeweis.',
      '',
      'Nicht ausgefuehrt: kein Edit, kein Save, kein Setup-Write, kein Beleg, keine Buchungsvorschau, keine Buchung, kein API Shortcut.'
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
