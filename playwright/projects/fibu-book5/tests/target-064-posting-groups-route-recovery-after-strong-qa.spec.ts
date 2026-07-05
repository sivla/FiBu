import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(360_000);

const CASE_ID = 'TARGET-064-POSTING-GROUPS-ROUTE-RECOVERY-AFTER-STRONG-QA';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-064-posting-groups-route-recovery-after-strong-qa';
const EVIDENCE_DIR_REL = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-064-result.json');

type ProbeStatus = 'observed' | 'rejected' | 'blocked';

type RouteAttempt = {
  route: string;
  term?: string;
  clicked?: boolean;
  candidateText?: string;
  status: ProbeStatus;
  reason: string;
  url: string;
  matchedSignals: string[];
  roleCenterFallback: boolean;
  searchOverlayVisible: boolean;
};

type Probe = {
  id: string;
  pageId: number;
  label: string;
  searchTerms: string[];
  candidates: RegExp[];
  signals: Array<{ id: string; pattern: RegExp; required?: boolean; specific?: boolean }>;
  accept: (matches: string[]) => boolean;
};

const probes: Probe[] = [
  {
    id: 'general-posting-setup',
    pageId: 314,
    label: 'Buchungsmatrix Einrichtung / General Posting Setup',
    searchTerms: ['Buchungsmatrix Einrichtung', 'General Posting Setup'],
    candidates: [/Buchungsmatrix\s+Einrichtung/i, /General Posting Setup/i],
    signals: [
      { id: 'caption', pattern: /Buchungsmatrix Einrichtung|General Posting Setup/i, required: true, specific: true },
      { id: 'business-group', pattern: /Geschaeftsbuchungsgruppe|Gen\.? Bus\.? Posting Group|Business Posting Group/i, specific: true },
      { id: 'product-group', pattern: /Produktbuchungsgruppe|Gen\.? Prod\.? Posting Group|Product Posting Group/i, specific: true },
      { id: 'sales-account', pattern: /Warenverkaufskonto|Sales Account/i, specific: true },
      { id: 'purchase-account', pattern: /Wareneinkaufskonto|Purch\.? Account|Purchase Account/i, specific: true },
      { id: 'inland-waren', pattern: /INLAND[\s\S]{0,1600}WAREN|WAREN[\s\S]{0,1600}INLAND/i, specific: true },
      { id: 'code', pattern: /\bCode\b/i },
      { id: 'description', pattern: /Beschreibung|Description/i }
    ],
    accept: (matches) =>
      matches.includes('caption') &&
      (matches.includes('business-group') || matches.includes('product-group')) &&
      (matches.includes('sales-account') || matches.includes('purchase-account') || matches.includes('inland-waren'))
  },
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    searchTerms: ['MwSt.-Geschaeftsbuchungsgruppen', 'MwSt.-Geschäftsbuchungsgruppen', 'VAT Business Posting Groups'],
    candidates: [/MwSt[\s\S]{0,80}Geschaeftsbuchungsgruppen/i, /MwSt[\s\S]{0,80}Gesch[a-z]*ftsbuchungsgruppen/i, /VAT Business Posting Groups/i],
    signals: [
      { id: 'caption', pattern: /MwSt[\s\S]{0,120}Geschaeftsbuchungsgruppen|MwSt[\s\S]{0,120}Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i, required: true, specific: true },
      { id: 'vat-business', pattern: /MwSt|USt|VAT Business|VAT Bus\.?/i, specific: true },
      { id: 'posting-group', pattern: /Buchungsgruppe|Posting Group/i, specific: true },
      { id: 'code', pattern: /\bCode\b/i },
      { id: 'description', pattern: /Beschreibung|Description/i }
    ],
    accept: (matches) => matches.includes('caption') && matches.includes('vat-business') && matches.includes('posting-group')
  },
  {
    id: 'vendor-posting-groups',
    pageId: 111,
    label: 'Kreditorenbuchungsgruppen / Vendor Posting Groups',
    searchTerms: ['Kreditorenbuchungsgruppen', 'Vendor Posting Groups'],
    candidates: [/Kreditorenbuchungsgruppen/i, /Vendor Posting Groups/i],
    signals: [
      { id: 'caption', pattern: /Kreditorenbuchungsgruppen|Vendor Posting Groups/i, required: true, specific: true },
      { id: 'payables-account', pattern: /Verbindlichkeitskonto|Verbindlichkeiten-Konto|Kreditorensammelkonto|Payables Account/i, specific: true },
      { id: 'vendor', pattern: /Kreditor|Vendor/i, specific: true },
      { id: 'posting-group', pattern: /Buchungsgruppe|Posting Group/i, specific: true },
      { id: 'code', pattern: /\bCode\b/i },
      { id: 'description', pattern: /Beschreibung|Description/i }
    ],
    accept: (matches) =>
      matches.includes('caption') &&
      matches.includes('vendor') &&
      (matches.includes('payables-account') || matches.includes('posting-group'))
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
    .filter((line) => !/allowedEndpoints|allowedResources|trustedOriginAuthorities|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|upn:/i.test(line))
    .join('\n')
    .trim();
}

function normalized(value: string | null | undefined) {
  return clean(value).toLowerCase();
}

function buildPlaythruUrl(pageId?: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  if (pageId) url.searchParams.set('page', String(pageId));
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i, '/{tenant}/');
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

function roleCenterFallback(text: string) {
  return /Guten Tag[\s\S]{0,240}Aktivitaeten|Laufender Verkauf|Laufende Einkaufe|Role Center|Rollencenter|Shopify - Aktivitaten/i.test(text);
}

function searchOverlayVisible(text: string) {
  return /Was mochten Sie tun|Wie mochten Sie weiter verfahren|Tell me|Seiten und Aufgaben|Pages and Tasks|Nach .* suchen/i.test(text);
}

function dangerousDialogVisible(text: string) {
  return /\b(Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete|Loeschen|Loschen|Apply|Anwenden|Finish|Fertig stellen|Yes|Ja|OK|Post|Buchen|Company switch|Mandant wechseln)\b/i.test(text);
}

function actionWordOnlyCandidate(text: string) {
  return /\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Loschen|Copy|Kopieren|Post|Buchen|Preview|Vorschau)\b/i.test(text);
}

function matchesFor(probe: Probe, text: string) {
  return probe.signals.filter((signal) => signal.pattern.test(text)).map((signal) => signal.id);
}

function statusFor(probe: Probe, text: string, dialogText: string, url: string): { status: ProbeStatus; reason: string; matches: string[] } {
  const matches = matchesFor(probe, text);
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) {
    return { status: 'blocked', reason: 'Business Central context is outside playthru / UNIVERSAARL-DE.', matches };
  }
  if (dangerousDialogVisible(dialogText)) return { status: 'blocked', reason: 'A dangerous dialog signal is visible.', matches };
  if (roleCenterFallback(text)) return { status: 'rejected', reason: 'Route stayed on the Role Center; navigation words are not page proof.', matches };
  if (searchOverlayVisible(text)) return { status: 'rejected', reason: 'Search/Tell-Me overlay is still visible; overlay text is not page proof.', matches };
  if (probe.accept(matches)) return { status: 'observed', reason: 'Page-specific caption and setup-list signals are visible.', matches };
  return { status: 'rejected', reason: 'Required page-specific signals are not visible enough.', matches };
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(filePath: string, text: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${text.trim()}\n`, 'utf8');
}

async function visibleTextWithFrames(page: Page) {
  const pieces = [await pageText(page).catch(() => '')];
  for (const frame of page.frames()) {
    pieces.push(await frame.locator('body').innerText({ timeout: 700 }).catch(() => ''));
    pieces.push(
      await frame
        .locator('[role], [aria-label], [title], th, td, button, a, h1, h2, h3')
        .evaluateAll((nodes) =>
          nodes
            .slice(0, 1000)
            .map((node) => {
              const element = node as HTMLElement;
              return [element.getAttribute('role'), element.getAttribute('aria-label'), element.getAttribute('title'), element.textContent]
                .filter(Boolean)
                .join(' ');
            })
            .join('\n')
        )
        .catch(() => '')
    );
  }
  return clean(pieces.join('\n'));
}

async function visibleDialogText(page: Page) {
  const chunks: string[] = [];
  for (const scope of [page, ...page.frames()] as Array<Page | Frame>) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .modal-dialog, .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      chunks.push(clean(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => '')));
    }
  }
  return chunks.filter(Boolean).join('\n');
}

async function captureProbeState(page: Page, probe: Probe, phase: string, attempt: RouteAttempt) {
  const text = await visibleTextWithFrames(page);
  const screenshotName = `target-064-${probe.id}-${phase}.png`;
  const screenshotPath = path.join(EVIDENCE_DIR, screenshotName);
  const textPath = path.join(EVIDENCE_DIR, screenshotName.replace(/\.png$/i, '.visible-text.txt'));
  const metaPath = path.join(EVIDENCE_DIR, screenshotName.replace(/\.png$/i, '.screenshot.json'));
  const signalsPath = path.join(EVIDENCE_DIR, screenshotName.replace(/\.png$/i, '.signals.json'));

  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await writeText(
    textPath,
    text
      .split('\n')
      .filter((line) => probe.signals.some((signal) => signal.pattern.test(line)) || /Role Center|Rollencenter|Seiten und Aufgaben|Pages and Tasks|Neu|New|Bearbeiten|Edit/i.test(line))
      .slice(0, 180)
      .join('\n') || text.slice(0, 7000)
  );
  await writeJson(signalsPath, {
    caseId: CASE_ID,
    pageId: probe.pageId,
    page: probe.label,
    phase,
    status: attempt.status,
    reason: attempt.reason,
    route: attempt.route,
    matchedSignals: attempt.matchedSignals,
    requiredSignals: probe.signals.filter((signal) => signal.required).map((signal) => signal.id),
    roleCenterFallback: attempt.roleCenterFallback,
    searchOverlayVisible: attempt.searchOverlayVisible
  });
  await writeJson(metaPath, {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    pageId: probe.pageId,
    page: probe.label,
    route: attempt.route,
    status: attempt.status,
    screenshotQa: {
      safeInstance: instancePathIsTarget(page.url()),
      safeCompany: companyParamIsTarget(page.url()),
      dangerousDialogVisible: attempt.status === 'blocked' && attempt.reason === 'A dangerous dialog signal is visible.',
      roleCenterFallback: attempt.roleCenterFallback,
      searchOverlayVisible: attempt.searchOverlayVisible,
      matchedSignals: attempt.matchedSignals,
      accepted: attempt.status === 'observed'
    },
    whatAUserSees:
      attempt.status === 'observed'
        ? `Die Seite ${probe.label} ist als echte Setup-Liste sichtbar.`
        : 'Diese Ansicht ist kein ausreichender Seitenbeweis und darf nicht als Setup-Wahrheit genutzt werden.',
    internallyProves:
      attempt.status === 'observed'
        ? `${probe.label} is reachable read-only through ${attempt.route}.`
        : `The ${attempt.route} route is not accepted as page proof.`,
    doesNotProve: [
      'No setup value was written.',
      'No posting group correctness is proven.',
      'No master data, document draft, Preview Posting, Posting or API shortcut is proven.'
    ],
    url: sanitizeUrl(page.url())
  });

  return {
    screenshot: `${EVIDENCE_DIR_REL}/${screenshotName}`,
    screenshotMetadata: `${EVIDENCE_DIR_REL}/${path.basename(metaPath)}`,
    signalJson: `${EVIDENCE_DIR_REL}/${path.basename(signalsPath)}`,
    visibleTextFile: `${EVIDENCE_DIR_REL}/${path.basename(textPath)}`
  };
}

async function candidateInventory(page: Page, probe: Probe) {
  const inventory = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const nodes = [...document.querySelectorAll<HTMLElement>('[role="row"],[role="button"],[role="menuitem"],[role="link"],button,a,li,div,span')];
        return nodes
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
            if (!text || rect.width < 2 || rect.height < 2 || style.display === 'none' || style.visibility === 'hidden') return null;
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
          .slice(0, 250);
      })
      .catch(() => []);
    for (const entry of entries as Array<{ text: string; role: string; rect: { x: number; y: number; width: number; height: number } }>) {
      if (probe.candidates.some((pattern) => pattern.test(entry.text)) || /Seiten und Aufgaben|Pages and Tasks|Verwaltung|Administration/i.test(entry.text)) {
        inventory.push({ frameUrl: sanitizeUrl(frame.url()), ...entry });
      }
    }
  }
  return inventory;
}

async function clickExactSearchCandidate(page: Page, probe: Probe, inventory: Awaited<ReturnType<typeof candidateInventory>>) {
  const target = inventory
    .filter((entry) => probe.candidates.some((pattern) => pattern.test(entry.text)))
    .filter((entry) => /Verwaltung|Administration|Seiten und Aufgaben|Pages and Tasks|List|Liste|Setup|Einrichtung/i.test(entry.text) || entry.role === 'row' || entry.role === 'button')
    .filter((entry) => !actionWordOnlyCandidate(entry.text))
    .filter((entry) => !/Unternehmensdaten durchsuchen|Hilfe durchsuchen|Search company data|Search help|Nach .* suchen/i.test(entry.text))
    .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];

  if (!target) return { clicked: false, candidateText: '', reason: 'No exact safe page/list candidate was visible.' };

  await page.mouse.click(target.rect.x + Math.min(40, Math.max(8, Math.round(target.rect.width / 2))), target.rect.y + Math.max(8, Math.round(target.rect.height / 2)));
  await page.waitForTimeout(2600);
  await waitForBusinessCentralShell(page).catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(800);
  return { clicked: true, candidateText: clean(target.text), reason: 'Clicked exact search candidate.' };
}

function pagesAndTasksOverlayHasSingleTarget(text: string, probe: Probe) {
  const hasPagesAndTasks = /zu .*seiten und aufgaben.* wechseln|pages and tasks/i.test(text);
  const hasSingleItem = /weist jetzt einen artikel|has 1 item|one item/i.test(text);
  const hasTarget = probe.candidates.some((pattern) => pattern.test(text));
  const hasOnlySearchHelpAlternatives = /Unternehmensdaten durchsuchen|Search company data|Hilfe durchsuchen|Search help/i.test(text);
  return hasPagesAndTasks && hasSingleItem && hasTarget && hasOnlySearchHelpAlternatives;
}

async function pressEnterOnFirstPagesAndTasksResult(page: Page, probe: Probe) {
  const text = await visibleTextWithFrames(page);
  if (!pagesAndTasksOverlayHasSingleTarget(text, probe)) {
    return { clicked: false, candidateText: '', reason: 'Pages-and-tasks overlay was not narrow enough for Enter fallback.' };
  }

  await page.keyboard.press('Enter');
  await page.waitForTimeout(3200);
  await waitForBusinessCentralShell(page).catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(900);
  return { clicked: true, candidateText: `${probe.label} via first pages-and-tasks result`, reason: 'Pressed Enter on the single visible pages-and-tasks result.' };
}

async function evaluateCurrent(page: Page, probe: Probe, route: string, term?: string, clicked?: boolean, candidateText?: string): Promise<RouteAttempt> {
  const text = await visibleTextWithFrames(page);
  const dialogText = await visibleDialogText(page);
  const { status, reason, matches } = statusFor(probe, text, dialogText, page.url());
  return {
    route,
    term,
    clicked,
    candidateText,
    status,
    reason,
    url: sanitizeUrl(page.url()),
    matchedSignals: matches,
    roleCenterFallback: roleCenterFallback(text),
    searchOverlayVisible: searchOverlayVisible(text)
  };
}

async function probeRoute(page: Page, probe: Probe) {
  const attempts: Array<RouteAttempt & { evidence?: Awaited<ReturnType<typeof captureProbeState>> }> = [];

  await page.goto(buildPlaythruUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1600);
  const direct = await evaluateCurrent(page, probe, 'direct-page-url');
  attempts.push({ ...direct, evidence: await captureProbeState(page, probe, '010-direct', direct) });
  if (direct.status === 'observed' || direct.status === 'blocked') return attempts;

  for (let index = 0; index < probe.searchTerms.length; index += 1) {
    const term = probe.searchTerms[index];
    await page.goto(buildPlaythruUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await page.keyboard.press('Escape').catch(() => undefined);
    await searchFor(page, term);
    await page.waitForTimeout(900);
    const inventory = await candidateInventory(page, probe);
    await writeJson(path.join(EVIDENCE_DIR, `target-064-${probe.id}-search-${index + 1}-candidates.json`), {
      caseId: CASE_ID,
      pageId: probe.pageId,
      page: probe.label,
      term,
      candidateCount: inventory.length,
      candidates: inventory.slice(0, 80)
    });
    const beforeClick = await evaluateCurrent(page, probe, 'tell-me-overlay-before-click', term, false);
    attempts.push({ ...beforeClick, evidence: await captureProbeState(page, probe, `020-search-${index + 1}-before-click`, beforeClick) });
    if (beforeClick.status === 'blocked') return attempts;

    const click = await clickExactSearchCandidate(page, probe, inventory);
    const enterFallback = click.clicked ? click : await pressEnterOnFirstPagesAndTasksResult(page, probe);
    const afterClick = await evaluateCurrent(
      page,
      probe,
      click.clicked ? `tell-me-exact-candidate-${index + 1}` : `tell-me-enter-first-pages-and-tasks-${index + 1}`,
      term,
      enterFallback.clicked,
      enterFallback.candidateText || click.candidateText
    );
    attempts.push({ ...afterClick, evidence: await captureProbeState(page, probe, `030-search-${index + 1}-after-click`, afterClick) });
    if (afterClick.status === 'observed' || afterClick.status === 'blocked') return attempts;
  }

  return attempts;
}

test('TARGET-064 recovers posting group routes read-only after strong screenshot QA', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const pageResults = [];
  for (const probe of probes) {
    const attempts = await probeRoute(page, probe);
    const finalAttempt =
      attempts.find((attempt) => attempt.status === 'observed' || attempt.status === 'blocked') ??
      attempts
        .slice()
        .reverse()
        .find((attempt) => attempt.clicked) ??
      attempts.at(-1)!;
    pageResults.push({
      id: probe.id,
      pageId: probe.pageId,
      label: probe.label,
      status: finalAttempt.status,
      reason: finalAttempt.reason,
      route: finalAttempt.route,
      term: finalAttempt.term,
      clicked: finalAttempt.clicked ?? false,
      candidateText: finalAttempt.candidateText ?? '',
      url: finalAttempt.url,
      matchedSignals: finalAttempt.matchedSignals,
      attempts
    });
  }

  const observed = pageResults.filter((entry) => entry.status === 'observed');
  const blockedOrRejected = pageResults.filter((entry) => entry.status !== 'observed');
  const resultStatus = blockedOrRejected.length === 0 ? 'observed' : observed.length > 0 ? 'partially-completed' : 'blocked';
  const nextCase =
    blockedOrRejected.length === 0
      ? 'TARGET-065-POSTING-GROUPS-BOUNDARY-DECISION-AFTER-ROUTE-RECOVERY'
      : 'TARGET-065-POSTING-GROUPS-PAGEINSPECTION-OR-SOURCE-ROUTE-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-w1-posting-groups-route-recovery-readonly',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: pageResults.at(-1)?.url ?? sanitizeUrl(page.url()),
    actionsTaken: [
      'Opened Business Central read-only in playthru / UNIVERSAARL-DE.',
      'Retried direct page URLs only as the baseline route from TARGET-063.',
      'Used Tell-Me only as narrow read-only page/list route discovery after direct routes failed.',
      'Activated only exact non-action page/list candidates or the single visible pages-and-tasks result.',
      'Captured screenshots, candidate inventories and screenshot QA for every target page.'
    ],
    actionsNotTaken: [
      'No New/Edit/Delete/Copy action clicked.',
      'No setup value written.',
      'No VAT Business Posting Group, Vendor Posting Group or General Posting Setup row changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting executed.',
      'No Posting executed.',
      'No Payment executed.',
      'No API shortcut used.',
      'No company switch.'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      directPageRouteIsNotEnough: true,
      tellMeOverlayIsNotPageProof: true
    },
    pages: pageResults,
    screenshots: pageResults.flatMap((entry) => entry.attempts.map((attempt) => attempt.evidence?.screenshot).filter(Boolean)),
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      `${observed.length}/3 posting-group target pages were reached with page-specific read-only signals.`,
      'Tell-Me/search overlay text was rejected as page proof until an actual page/list surface appeared.',
      'No setup value, master data, document draft, Preview Posting, Posting, payment or API shortcut occurred.',
      ...observed.map((entry) => `${entry.label} was reached read-only through ${entry.route}.`)
    ],
    notProved: [
      'W1 Foundation is not posting-ready.',
      'No VAT setup, General Posting Setup, Vendor Posting Group or Customer Posting Group correctness is proven.',
      'No German tax correctness, SKR04 completeness, Preview Posting, Posting, G/L Entry, VAT Entry or ledger trace is proven.',
      ...blockedOrRejected.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    blockedBy: blockedOrRejected.map((entry) => `${entry.id}: ${entry.reason}`),
    warnings: [
      'This run deliberately uses Tell-Me only after direct page URLs failed in TARGET-063.',
      'A recovered route does not unlock any write gate by itself.',
      'Accepted screenshots can support page explanation, not posting readiness.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-063 rejected all three direct page probes because direct page URLs fell back to Role Center or lacked page-specific caption signals.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'Route recovery is the smallest useful step before any VAT/posting-group write gate; repeating writes would be premature.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-064-POSTING-GROUPS-ROUTE-RECOVERY-AFTER-STRONG-QA',
          status: 'ready-next',
          reason: 'This is the active route-recovery case.'
        },
        {
          caseId: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
          status: observed.some((entry) => entry.id === 'vat-business-posting-groups') ? 'needs-source-check-first' : 'blocked',
          reason: 'VAT writes remain locked until source-backed values and page route proof are both clear.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'needs-setup-first',
          reason: 'Foundation cannot be ready while posting group and VAT boundaries are unresolved.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'blocked',
          reason: 'O2C remains locked before Foundation readiness.'
        },
        {
          caseId: nextCase,
          status: 'ready-next',
          reason:
            blockedOrRejected.length === 0
              ? 'All routes recovered; next step is a local boundary decision, not a write.'
              : 'Some routes remain unresolved; next step must be source/page-inspection decision, not more blind UI retries.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        blockedOrRejected.length === 0
          ? 'It prevents route evidence from being mistaken for setup readiness.'
          : 'It stops repeated search/cell attempts and forces a better route/source decision.',
      risksBeforeNextCase: [
        'Recovered page visibility is not setup correctness.',
        'Do not write VAT or posting-group values without a separate Smart Decision and source-backed fields.',
        'Do not create master data, documents, Preview Posting or Posting.'
      ],
      requiredPreparation: [
        'Review TARGET-064 screenshots and candidate inventories.',
        'Keep all write gates locked until a separate decision case.'
      ]
    },
    changedFiles: [
      `${EVIDENCE_DIR_REL}/TARGET-064-result.json`,
      `${EVIDENCE_DIR_REL}/target-064-*.png`,
      `${EVIDENCE_DIR_REL}/target-064-*.json`,
      `${EVIDENCE_DIR_REL}/target-064-*.txt`
    ],
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/TARGET-064-result.json`,
      ...pageResults.flatMap((entry) => entry.attempts.map((attempt) => attempt.evidence?.screenshot).filter(Boolean))
    ],
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file:
          nextCase === 'TARGET-065-POSTING-GROUPS-BOUNDARY-DECISION-AFTER-ROUTE-RECOVERY'
            ? '.agent/state/cases/target-065-posting-groups-boundary-decision-after-route-recovery.json'
            : '.agent/state/cases/target-065-posting-groups-pageinspection-or-source-route-decision.json',
        activeArea: 'universaarl-posting-groups-route-recovery-followup',
        nextStep:
          blockedOrRejected.length === 0
            ? 'Classify recovered posting-group page routes locally before any write gate.'
            : 'Decide page-inspection/source route for unresolved posting-group pages; do not repeat broad Tell-Me clicks.'
      },
      lastRunSummary: {
        caseId: CASE_ID,
        status: resultStatus,
        resultPath: `${EVIDENCE_DIR_REL}/TARGET-064-result.json`,
        nextCase
      },
      coverage: {
        latestTarget064PostingGroupsRouteRecovery: {
          caseId: CASE_ID,
          status: resultStatus,
          resultPath: `${EVIDENCE_DIR_REL}/TARGET-064-result.json`,
          observedPages: observed.map((entry) => entry.id),
          unresolvedPages: blockedOrRejected.map((entry) => entry.id),
          setupChanged: false,
          previewPosting: false,
          posted: false,
          nextCase
        }
      }
    },
    reason:
      resultStatus === 'observed'
        ? 'All target page routes were recovered read-only; write gates remain locked.'
        : observed.length > 0
          ? 'Some target page routes were recovered read-only; unresolved routes remain parked for source/page-inspection decision.'
          : 'No target page route passed strong screenshot QA; repeated UI clicks should stop.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-064 Posting Groups Route Recovery',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Sicherheitsgrenze',
      '',
      '- Tell-Me wurde nur als Navigationshilfe genutzt.',
      '- Suchoverlay und Role Center wurden nicht als Seitenbeweis akzeptiert.',
      '- Kein Neu, Bearbeiten, Loeschen, Kopieren, Preview, Posting oder API Shortcut.',
      '- Keine Einrichtung und keine Stammdaten wurden geaendert.',
      ''
    ].join('\n')
  );

  expect(pageResults.every((entry) => entry.status !== 'blocked')).toBe(true);
  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
