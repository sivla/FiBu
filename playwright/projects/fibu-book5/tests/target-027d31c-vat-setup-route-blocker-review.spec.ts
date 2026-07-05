import { test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D31C-VAT-SETUP-ROUTE-BLOCKER-REVIEW';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d31c-vat-setup-route-blocker-review';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D31C-result.json');

type RouteProbe = {
  id: string;
  pageId: number;
  label: string;
  expected: RegExp;
  signals: RegExp[];
  searchTerms: string[];
  searchResult: RegExp;
  allowedToPark: boolean;
  reasonToPark: string;
};

const probes: RouteProbe[] = [
  {
    id: 'vat-business-posting-groups-page-470',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    expected: /MwSt\.-?Gesch[a-z ]*ftsbuchungsgruppen|USt\.-?Gesch[a-z ]*ftsbuchungsgruppen|VAT Business Posting Groups/i,
    signals: [/Code/i, /Beschreibung|Description/i],
    searchTerms: ['MwSt.-Gesch\u00e4ftsbuchungsgruppen', 'MwSt.-Geschaeftsbuchungsgruppen', 'USt.-Gesch\u00e4ftsbuchungsgruppen', 'VAT Business Posting Groups'],
    searchResult: /MwSt\.-?Gesch(?:\u00e4|a|ae)ftsbuchungsgruppen|USt\.-?Gesch(?:\u00e4|a|ae)ftsbuchungsgruppen|VAT Business Posting Groups/i,
    allowedToPark: false,
    reasonToPark: 'VAT Business Posting Groups are needed as manual VAT setup context unless an existing group is deliberately reused.'
  },
  {
    id: 'assisted-setup-vat-route',
    pageId: 1801,
    label: 'Unterstuetztes Setup / Assisted Setup VAT route',
    expected: /Unterst[a-z ]*tztes Setup|Assisted Setup|Einrichtung|Setup/i,
    signals: [/MwSt|USt|VAT|Mehrwertsteuer|Value-Added Tax|Einrichtung|Setup/i],
    searchTerms: ['Unterst\u00fctztes Setup', 'Unterstuetztes Setup', 'Assisted Setup', 'MwSt. einrichten', 'Set up Value-Added Tax'],
    searchResult: /Unterst(?:\u00fc|u|ue)tztes Setup|Assisted Setup|MwSt|USt|VAT|Value-Added Tax/i,
    allowedToPark: true,
    reasonToPark: 'Assisted Setup is optional for this Foundation path because manual VAT setup pages are the safer book route.'
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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile']) {
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

function looksLikeSearchOverlay(text: string) {
  return /Nach .*suchen|Tell me|Search for|Seiten und Aufgaben|Unternehmensdaten durchsuchen|Hilfe durchsuchen|Wie mochten Sie weiter verfahren/i.test(
    text
  );
}

function dangerousSignal(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Anwenden|Finish|Fertig|Next|Weiter|Import|Export|Validate|OK|Yes|Ja)\b/i.test(
    text
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function collectVisibleText(page: Page, probe: RouteProbe) {
  const compact = clean(
    await compactPageText(page, {
      include: [probe.expected, ...probe.signals, /Neu|Liste bearbeiten|Weitere Optionen|Code|Beschreibung|Description|Einrichtung|Setup|MwSt|USt|VAT/i],
      maxLines: 180,
      maxLineLength: 260
    }).catch(() => '')
  );
  const raw = clean(await pageText(page).catch(() => ''));
  return compact || raw;
}

async function visibleCandidates(page: Page) {
  const entries: Array<{ frameUrl: string; text: string; role: string; area: number }> = [];
  for (const frame of page.frames()) {
    const frameEntries = await frame
      .evaluate(() => {
        const selectors = 'button,[role="button"],[role="menuitem"],[role="option"],[role="listitem"],a,div,span';
        return [...document.querySelectorAll<HTMLElement>(selectors)]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              visible:
                text.length > 0 &&
                rect.width > 0 &&
                rect.height > 0 &&
                style.visibility !== 'hidden' &&
                style.display !== 'none' &&
                Number(style.opacity || '1') > 0,
              area: Math.round(rect.width * rect.height)
            };
          })
          .filter((entry) => entry.visible && entry.area > 40)
          .slice(0, 260);
      })
      .catch(() => []);
    for (const entry of frameEntries) {
      entries.push({ frameUrl: sanitizeUrl(frame.url()), text: clean(entry.text), role: entry.role, area: entry.area });
    }
  }
  return entries.filter((entry) => /MwSt|USt|VAT|Buchungsgruppe|Setup|Einrichtung|Verwaltung|Business Posting/i.test(entry.text)).slice(0, 80);
}

async function tryOpenBySearch(page: Page, probe: RouteProbe) {
  const attempts = [];
  for (const term of probe.searchTerms) {
    await searchFor(page, term);
    const candidates = await visibleCandidates(page);
    attempts.push({ term, candidates: candidates.slice(0, 20) });
    await writeJson(path.join(EVIDENCE_DIR, `${probe.id}-search-${term.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`), {
      caseId: CASE_ID,
      term,
      candidates
    });
    const clicked = await clickVisiblePageCandidate(page, probe);
    if (!clicked) {
      await openSearchResult(page, probe.searchResult, { requireUnique: false }).catch(() => undefined);
    }
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape').catch(() => undefined);
    const text = await collectVisibleText(page, probe);
    if (probe.expected.test(text) && probe.signals.every((signal) => signal.test(text)) && !looksLikeSearchOverlay(text)) {
      return { opened: true, attempts };
    }
  }
  return { opened: false, attempts };
}

async function clickVisiblePageCandidate(page: Page, probe: RouteProbe) {
  const domClicked = await clickSmallestDomCandidate(page, probe);
  if (domClicked) return true;

  const exactPatterns =
    probe.id === 'vat-business-posting-groups-page-470'
      ? [
          /MwSt\.-?Gesch(?:\u00e4|a|ae)ftsbuchungsgruppen\s+Verwaltung/i,
          /USt\.-?Gesch(?:\u00e4|a|ae)ftsbuchungsgruppen\s+Verwaltung/i,
          /MwSt\.-?Gesch(?:\u00e4|a|ae)ftsbuchungsgruppen/i,
          /VAT Business Posting Groups/i
        ]
      : [
          /Unterst(?:\u00fc|u|ue)tztes Setup/i,
          /Assisted Setup/i,
          /Set up Value-Added Tax/i,
          /MwSt.*einrichten/i
        ];

  for (const scope of [page, ...page.frames()]) {
    for (const pattern of exactPatterns) {
      const locators = [
        scope.getByRole('option', { name: pattern }),
        scope.getByRole('button', { name: pattern }),
        scope.getByRole('link', { name: pattern }),
        scope.getByText(pattern)
      ];
      for (const locator of locators) {
        const count = await locator.count().catch(() => 0);
        for (let index = 0; index < Math.min(count, 8); index += 1) {
          const item = locator.nth(index);
          if (!(await item.isVisible({ timeout: 500 }).catch(() => false))) continue;
          const label = clean((await item.innerText({ timeout: 500 }).catch(() => '')) || (await item.getAttribute('aria-label').catch(() => '')));
          if (/Nach .*suchen|Unternehmensdaten durchsuchen|Hilfe durchsuchen|keine Vorsch|no suggestions|Sie haben nicht gefunden/i.test(label)) continue;
          if (probe.id === 'vat-business-posting-groups-page-470' && !/Verwaltung|Business Posting Groups/i.test(label)) continue;
          const clicked = await item
            .click({ timeout: 4000 })
            .then(() => true)
            .catch(async () => {
              return item.click({ timeout: 2000, force: true }).then(() => true).catch(() => false);
            });
          if (!clicked) continue;
          await page.waitForTimeout(2500);
          return true;
        }
      }
    }
  }

  return false;
}

async function clickSmallestDomCandidate(page: Page, probe: RouteProbe) {
  const expectedTexts =
    probe.id === 'vat-business-posting-groups-page-470'
      ? ['mwst.-geschaftsbuchungsgruppen verwaltung', 'ust.-geschaftsbuchungsgruppen verwaltung', 'vat business posting groups']
      : ['unterstutztes setup', 'assisted setup', 'mehrwertsteuer', 'value-added tax'];

  for (const frame of page.frames()) {
    const clicked = await frame
      .evaluate((needles) => {
        function normalizeText(value: string) {
          return value
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .toLowerCase()
            .trim();
        }

        const candidates = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="option"],[role="menuitem"],a,div,span')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = normalizeText(element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '');
            return {
              element,
              text,
              area: rect.width * rect.height,
              visible:
                text.length > 0 &&
                rect.width > 2 &&
                rect.height > 2 &&
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < window.innerHeight &&
                rect.left < window.innerWidth &&
                style.visibility !== 'hidden' &&
                style.display !== 'none' &&
                Number(style.opacity || '1') > 0
            };
          })
          .filter((entry) => entry.visible)
          .filter((entry) => needles.some((needle) => entry.text.includes(needle)))
          .filter((entry) => !/nach .*suchen|unternehmensdaten durchsuchen|hilfe durchsuchen|keine vorsch|no suggestions|sie haben nicht gefunden/.test(entry.text))
          .sort((left, right) => left.text.length - right.text.length || left.area - right.area);

        const target = candidates[0]?.element;
        if (!target) return false;
        target.scrollIntoView({ block: 'center', inline: 'center' });
        target.click();
        return true;
      }, expectedTexts)
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(2500);
      return true;
    }
  }

  return false;
}

async function probeRoute(page: Page, probe: RouteProbe, index: number) {
  const prefix = `target-027d31c-${String(index).padStart(3, '0')}-${probe.id}`;
  const navigationSteps = [`direct-page-${probe.pageId}`];

  await page.goto(buildPlaythruUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);

  let text = await collectVisibleText(page, probe);
  let searchAttempts: unknown[] = [];
  if (!(probe.expected.test(text) && probe.signals.every((signal) => signal.test(text))) || looksLikeSearchOverlay(text)) {
    const search = await tryOpenBySearch(page, probe);
    searchAttempts = search.attempts;
    navigationSteps.push(...probe.searchTerms.map((term) => `exact-search:${term}`));
    text = await collectVisibleText(page, probe);
  }

  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const expectedVisible = probe.expected.test(text);
  const signalsVisible = probe.signals.every((signal) => signal.test(text));
  const searchOverlay = looksLikeSearchOverlay(text);
  const danger = dangerousSignal(text);
  const observed = safeContext && expectedVisible && signalsVisible && !searchOverlay;
  const parked = !observed && probe.allowedToPark && safeContext;
  const status = observed ? 'observed' : parked ? 'parked' : 'blocked';
  const screenshot = `${prefix}.png`;
  const textFile = `${prefix}.txt`;

  await writeText(textFile, text || 'No visible route text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, screenshot), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, screenshot.replace(/\.png$/i, '.screenshot.json')), {
    fileName: screenshot,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: probe.label,
    status,
    routeUsed: navigationSteps,
    url: sanitizeUrl(currentUrl),
    screenshotQualityGate: {
      expectedVisible,
      signalsVisible,
      searchOverlayRejected: searchOverlay,
      dangerousSetupSignalVisible: danger,
      acceptedAsRouteProof: observed,
      acceptedAsParkedBlocker: parked
    },
    visibleLearning: text.split('\n').slice(0, 28),
    whatAUserSees:
      probe.id === 'vat-business-posting-groups-page-470'
        ? 'Die MwSt.-Geschaeftsbuchungsgruppen ordnen Geschaeftspartner einem steuerlichen Kontext zu, zum Beispiel Inland, EU oder Export.'
        : 'Unterstuetztes Setup kann Einrichtungsassistenten anbieten. Fuer diesen Read-only-Schritt werden moegliche Start- oder Weiter-Schaltflaechen nicht angeklickt.',
    internallyProves: observed
      ? `${probe.label} is visible read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
      : `${probe.label} is not accepted as write-ready route proof in this run.`,
    doesNotProve: [
      'No VAT setup value was changed.',
      'No wizard was started or finished.',
      'No VAT correctness, Preview Posting, Posting or VAT Entry is proven.'
    ],
    searchAttempts
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot,
    textFile,
    navigationSteps,
    expectedVisible,
    signalsVisible,
    searchOverlay,
    dangerousSetupSignalVisible: danger,
    reasonToPark: probe.reasonToPark,
    searchAttempts,
    blockedBy:
      status === 'observed' || status === 'parked'
        ? []
        : [
            ...(!safeContext ? [`Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`] : []),
            ...(!expectedVisible ? [`Expected page title/text not visible for ${probe.label}.`] : []),
            ...(!signalsVisible ? [`Required page signals not visible for ${probe.label}.`] : []),
            ...(searchOverlay ? [`Search overlay still visible for ${probe.label}; rejected as route proof.`] : []),
            ...(danger ? [`Setup-impacting action text visible for ${probe.label}; no confirmation was clicked.`] : [])
          ],
    parkedReason: parked ? probe.reasonToPark : null,
    warnings: danger ? ['Setup-impacting action text may be visible, but no Next/Finish/Apply/OK action was clicked.'] : []
  };
}

test('TARGET-027D31C reviews VAT setup route blockers read-only', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const startedAt = new Date().toISOString();
  const smartDecision = {
    action: 'read-only-vat-route-blocker-review',
    effectiveAction: false,
    reason:
      'D31B proved Page 471 and Page 472 read-only, but left Assisted Setup and Page 470 blocked by generic search overlays. D31C must decide whether the blockers are resolved, parked, or still block the VAT write gate.',
    sourceSupport: [
      'Microsoft Learn names VAT Business Posting Groups, VAT Product Posting Groups and VAT Posting Setup as VAT setup pages.',
      'Microsoft Learn mentions Assisted Setup for VAT, but the book path can use manual setup pages if the wizard route is not needed.'
    ],
    fieldsChanged: [],
    fieldsLeftUntouched: ['All VAT setup fields', 'All posting group fields', 'All accounts', 'All master data'],
    risk: 'A search overlay can look like progress; it must be rejected as route proof. Assisted Setup can expose wizard buttons that must not be confirmed.',
    fallback: 'If Page 470 remains blocked, keep VAT write gate blocked. If only Assisted Setup remains blocked, park the wizard route and continue with manual setup decision.',
    beginnerBookUse:
      'Use the manual VAT setup pages in the book before values are written: business groups, product groups and the posting matrix.'
  };

  const probeResults = [];
  for (let index = 0; index < probes.length; index += 1) {
    probeResults.push(await probeRoute(page, probes[index], index + 1));
  }

  const businessGroup = probeResults.find((entry) => entry.id === 'vat-business-posting-groups-page-470');
  const assistedSetup = probeResults.find((entry) => entry.id === 'assisted-setup-vat-route');
  const page470Ready = businessGroup?.status === 'observed';
  const assistedParkedOrReady = assistedSetup?.status === 'observed' || assistedSetup?.status === 'parked';
  const canMoveToWriteGateDecision = Boolean(page470Ready && assistedParkedOrReady);
  const blockedBy = probeResults.flatMap((entry) => entry.blockedBy);
  const resultStatus = canMoveToWriteGateDecision ? 'observed-with-parked-wizard-route' : 'blocked';
  const nextCase = canMoveToWriteGateDecision ? 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION' : CASE_ID;

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
    lastEvidenceSummary:
      'D31B proved Page 471 and Page 472, while Page 470 and Assisted Setup still looked like search overlays. D31C rechecked both blockers with direct page and localized search routes.',
    isPlannedNextCaseStillSensible: canMoveToWriteGateDecision,
    reason: canMoveToWriteGateDecision
      ? 'The mandatory manual VAT Business Posting Groups route is now visible; the Assisted Setup wizard route is parked because manual VAT setup is safer for the book path.'
      : 'VAT write-gate remains premature because a mandatory manual VAT route is still blocked.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
        status: canMoveToWriteGateDecision ? 'ready-next' : 'blocked',
        reason: canMoveToWriteGateDecision
          ? 'Manual VAT setup pages have route proof or accepted park decision; D32 can decide values without writing yet.'
          : 'Needs Page 470 route proof or an explicit alternative before any write-gate.'
      },
      {
        caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups depend on VAT setup decision.'
      },
      {
        caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
        status: 'ready-after-current',
        reason: 'Dimensions can continue after VAT setup is decided or deliberately parked.'
      },
      {
        caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
        status: 'needs-setup-first',
        reason: 'Foundation readiness waits for VAT/posting group status.'
      }
    ],
    queueChangesMade: canMoveToWriteGateDecision
      ? ['Advance from route blocker review to TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION.']
      : ['Keep TARGET-027D31C active because Page 470 route proof is still missing.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: canMoveToWriteGateDecision
      ? 'The next useful step is a source-backed decision card for exact VAT group/matrix values before any write.'
      : 'Repeating setup writes would be unsafe without mandatory route proof.',
    risksBeforeNextCase: [
      'A visible setup page is not a correctness proof.',
      'VAT accounts and percentages still need a separate source-backed decision.',
      'No Preview Posting, Posting or VAT Entries exist.'
    ],
    requiredPreparation: canMoveToWriteGateDecision
      ? ['Decide Universaarl VAT business group, product group, VAT %, sales VAT account and purchase VAT account.']
      : ['Recover Page 470 route or document a safer alternative manual route.']
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-vat-route-blocker-review',
    resultStatus,
    startedAt,
    finishedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    page: 'VAT setup route blocker review',
    smartDecision,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Rechecked VAT Business Posting Groups Page 470 read-only by direct page URL and localized search fallbacks.',
      'Rechecked Assisted Setup/VAT wizard route read-only and treated wizard actions as stop boundaries.',
      'Rejected generic Tell-Me/search overlays as route proof.',
      'Captured screenshot QA, text evidence and route decision metadata.'
    ],
    actionsNotTaken: [
      'No VAT setup write',
      'No assisted setup Next/Finish/Apply/OK',
      'No setup wizard completion',
      'No posting group write',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    sourceRefs: [
      'https://learn.microsoft.com/en-gb/dynamics365/business-central/finance-setup-vat',
      'https://learn.microsoft.com/en-us/training/modules/set-up-vat-dynamics-365-business-central/'
    ],
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      ...(page470Ready ? ['VAT Business Posting Groups / MwSt.-Geschaeftsbuchungsgruppen Page 470 is visible read-only.'] : []),
      ...(assistedSetup?.status === 'observed'
        ? ['Assisted Setup route is visible read-only, but no wizard action was clicked.']
        : assistedSetup?.status === 'parked'
          ? ['Assisted Setup VAT wizard route is intentionally parked; manual VAT setup pages are the safer path for this book sequence.']
          : []),
      'No VAT setup, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      'No VAT setup value has been written.',
      'No Universaarl VAT setup value is final.',
      'No VAT correctness, Preview Posting, Posting, VAT Entry or German compliance claim is proven.',
      'No tax advisor approval is proven.'
    ],
    blockedBy,
    warnings: probeResults.flatMap((entry) => entry.warnings),
    screenshots: probeResults.map((entry) => entry.screenshot),
    evidenceRefs: [
      'TARGET-027D31C-result.json',
      'README.md',
      ...probeResults.flatMap((entry) => [entry.textFile, entry.screenshot, entry.screenshot.replace(/\.png$/i, '.screenshot.json')])
    ],
    probeResults,
    flags: {
      noSetupWrite: true,
      noMasterData: true,
      noDraft: true,
      noPreviewPosting: true,
      noPosting: true,
      noApiShortcut: true,
      noBroadTellMeSearchOverlayAccepted: true
    },
    safeToFinalizeState: false,
    requiresReview: true,
    statePatch: {},
    nextStepDecision,
    nextCase,
    reason: canMoveToWriteGateDecision
      ? 'Route blockers are resolved or intentionally parked; VAT can move to a separate write-gate decision without writing setup yet.'
      : 'VAT route blocker review still blocks setup write-gate.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027D31C VAT Setup Route Blocker Review',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Screenshot-QA',
      '',
      '- Such-Overlays wurden nicht als Seitenbeweis akzeptiert.',
      '- Assistenten-Schaltflaechen wie Weiter, Fertig stellen, Anwenden oder OK wurden nicht bestaetigt.',
      '- Page 470 ist nur dann akzeptiert, wenn Titel und Code/Beschreibung sichtbar sind.',
      '',
      '## Grenzen',
      '',
      '- Keine Einrichtung wurde geschrieben.',
      '- Kein Assistent wurde abgeschlossen.',
      '- Keine Buchungsvorschau und keine Buchung wurden ausgefuehrt.',
      '- Die Screenshots zeigen Routen- und Seitenkontext, keine steuerliche Freigabe.'
    ].join('\n')
  );
});
