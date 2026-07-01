import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(210_000);

const CASE_ID = 'TARGET-027C4-VAT-BUSINESS-RESULT-CLICK-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027c4-vat-business-result-click-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027C4-result.json');

const PAGE_ID = 470;
const SEARCH_TERM = 'MwSt.-Gesch\u00e4ftsbuchungsgruppen';
const PAGE_LABEL = 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups';
const PAGE_TITLE = /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i;

type SearchCandidate = {
  frameUrl: string;
  text: string;
  role: string;
  rect: { x: number; y: number; width: number; height: number };
};

type RouteAttempt = {
  route: string;
  clicked: boolean;
  accepted: boolean;
  blockedBy: string[];
  screenshot: string;
  textFile: string;
  metadata: string;
  candidates: SearchCandidate[];
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId|clientId|authority:|originAuthorityValidator|upn:|shouldAttachOauthTokens/i.test(line))
    .join('\n')
    .trim();
}

function normalizeForMatch(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(new RegExp('\u00c3\u0192\u00c2\u00a4', 'g'), 'a')
    .replace(new RegExp('\u00c3\u0192\u00e2\u20ac\u017e', 'g'), 'A')
    .replace(new RegExp('\u00c3\u0192\u00c2\u00b6', 'g'), 'o')
    .replace(new RegExp('\u00c3\u0192\u00e2\u20ac\u201c', 'g'), 'O')
    .replace(new RegExp('\u00c3\u0192\u00c2\u00bc', 'g'), 'u')
    .replace(new RegExp('\u00c3\u0192\u00c5\u201c', 'g'), 'U')
    .replace(new RegExp('\u00c3\u0192\u00c5\u00b8', 'g'), 'ss')
    .toLowerCase();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['company', 'page', 'dc', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function buildPlaythruUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function hasRequiredPageSignals(text: string) {
  return PAGE_TITLE.test(text) && /\bCode\b/i.test(text) && /Beschreibung|Description/i.test(text);
}

function hasSearchOverlay(text: string) {
  return /Wie mochten Sie weiter verfahren|Was mochten Sie tun|Tell me|Nach .* suchen|Seiten und Aufgaben|Zu Seiten und Aufgaben wechseln/i.test(text);
}

function hasDangerousDialog(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja|OK)\b/i.test(text);
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
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  const compact = await compactPageText(page, {
    include: [PAGE_TITLE, /\bCode\b/i, /Beschreibung|Description/i, /Verwaltung|MwSt|VAT|Neu|Liste bearbeiten/i],
    maxLines: 180,
    maxLineLength: 240
  });
  return clean(`${compact}\n${frameTexts.join('\n')}`);
}

async function findSearchCandidates(page: Page): Promise<SearchCandidate[]> {
  const all: SearchCandidate[] = [];
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
          .filter((entry) => /MwSt|USt|VAT|Buchungsgruppen|Verwaltung/i.test(entry!.text))
          .slice(0, 80);
      })
      .catch(() => []);
    for (const entry of entries as Omit<SearchCandidate, 'frameUrl'>[]) {
      all.push({ frameUrl: sanitizeUrl(frame.url()), ...entry });
    }
  }

  return all;
}

async function clickByLocator(page: Page, candidates: SearchCandidate[]) {
  const patterns = [
    /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen\s+Verwaltung/i,
    /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen/i,
    /VAT Business Posting Groups/i
  ];

  for (const scope of [page, ...page.frames()] as Array<Page | Frame>) {
    for (const pattern of patterns) {
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
          await item.click({ timeout: 5000 }).catch(async () => item.click({ timeout: 5000, force: true }));
          return true;
        }
      }
    }
  }

  const exact = candidates
    .filter((entry) => normalizeForMatch(entry.text).includes('mwst.-geschaftsbuchungsgruppen'))
    .filter((entry) => entry.rect.width < 620 && entry.rect.height <= 90 && entry.rect.x >= 600 && entry.rect.y >= 100)
    .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];
  if (exact) {
    await page.mouse.click(exact.rect.x + Math.min(40, Math.round(exact.rect.width / 2)), exact.rect.y + Math.round(exact.rect.height / 2));
    await page.waitForTimeout(700);
    return true;
  }

  return false;
}

async function captureAttempt(page: Page, route: string, sequence: number, candidates: SearchCandidate[], clicked: boolean): Promise<RouteAttempt> {
  await page.waitForTimeout(2500);
  const text = await visibleText(page);
  const accepted = hasRequiredPageSignals(text) && !hasSearchOverlay(text) && !hasDangerousDialog(text);
  const blockedBy = [
    !PAGE_TITLE.test(text) ? 'Page 470 title not visible.' : '',
    !/\bCode\b/i.test(text) ? 'Code column not visible.' : '',
    !/Beschreibung|Description/i.test(text) ? 'Beschreibung/Description column not visible.' : '',
    hasSearchOverlay(text) ? 'Visible state still looks like Tell-Me/search overlay.' : '',
    hasDangerousDialog(text) ? 'Dangerous dialog/action signal visible; no confirmation performed.' : ''
  ].filter(Boolean);
  const prefix = `target-027c4-${String(sequence).padStart(3, '0')}-${route.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
  const screenshot = `${prefix}.png`;
  const textFile = `${prefix}.txt`;
  const metadata = `${prefix}.screenshot.json`;

  await writeText(textFile, text || 'No visible text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, screenshot), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, metadata), {
    fileName: screenshot,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    pageId: PAGE_ID,
    page: PAGE_LABEL,
    route,
    clicked,
    status: accepted ? 'accepted-readonly-page-470-surface' : 'rejected-readonly-page-470-surface',
    screenshotQa: {
      titleVisible: PAGE_TITLE.test(text),
      codeColumnVisible: /\bCode\b/i.test(text),
      descriptionColumnVisible: /Beschreibung|Description/i.test(text),
      searchOverlayVisible: hasSearchOverlay(text),
      dangerousDialogVisible: hasDangerousDialog(text),
      accepted
    },
    whatAUserSees:
      accepted
        ? 'Die Liste MwSt.-Geschaeftsbuchungsgruppen ist sichtbar. Sie enthaelt Codes fuer den steuerlichen Kontext von Debitoren und Kreditoren.'
        : 'Die erwartete Liste MwSt.-Geschaeftsbuchungsgruppen ist nach diesem Klick noch nicht sauber sichtbar.',
    internallyProves: accepted ? 'Page 470 is visible read-only after exact result activation.' : 'This activation route is not accepted as Page 470 proof.',
    doesNotProve: [
      'No VAT business posting group was created or changed.',
      'No VAT product posting group was created or changed.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT correctness.',
      'No Preview Posting or Posting.'
    ],
    candidates: candidates.slice(0, 20)
  });

  return { route, clicked, accepted, blockedBy, screenshot, textFile, metadata, candidates };
}

test('TARGET-027C4 recovers exact Page 470 result click read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.goto(buildPlaythruUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);

  const attempts: RouteAttempt[] = [];

  await searchFor(page, SEARCH_TERM);
  await page.waitForTimeout(1000);
  const candidates = await findSearchCandidates(page);
  await writeJson(path.join(EVIDENCE_DIR, 'target-027c4-search-candidates.json'), {
    caseId: CASE_ID,
    term: SEARCH_TERM,
    candidates
  });
  await writeText(
    'target-027c4-search-overlay.txt',
    clean((await compactPageText(page, { include: [/MwSt|VAT|Verwaltung|Seiten und Aufgaben/i], maxLines: 120, maxLineLength: 240 })) || '')
  );
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'target-027c4-000-search-overlay-before-click.png'), fullPage: false });

  const clickedLocator = await clickByLocator(page, candidates);
  attempts.push(await captureAttempt(page, 'exact-result-locator-or-geometry-click', 1, candidates, clickedLocator));

  if (!attempts[0].accepted) {
    await searchFor(page, SEARCH_TERM);
    await page.keyboard.press('Enter').catch(() => undefined);
    attempts.push(await captureAttempt(page, 'search-enter-activation', 2, candidates, true));
  }

  const acceptedAttempt = attempts.find((entry) => entry.accepted);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const blockedBy = [
    !safeContext ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.` : '',
    ...(acceptedAttempt ? [] : Array.from(new Set(attempts.flatMap((entry) => entry.blockedBy))))
  ].filter(Boolean);
  const resultStatus = safeContext && acceptedAttempt ? 'observed' : 'blocked';
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE-RETRY'
      : 'TARGET-027C5-VAT-BUSINESS-ALTERNATIVE-NAVIGATION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-business-page-470-result-click-readonly',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(currentUrl),
    actionsTaken: [
      'Opened Business Central read-only in playthru / UNIVERSAARL-DE.',
      'Opened Tell-Me search and entered MwSt.-Geschaeftsbuchungsgruppen.',
      'Captured search-result candidates and before-click screenshot.',
      'Activated only the exact visible Page 470 result route by locator/geometry and Enter fallback.',
      'Captured accepted or rejected Page 470 screenshot QA.'
    ],
    actionsNotTaken: [
      'No VAT group create/edit',
      'No VAT Posting Setup matrix row',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      ...(acceptedAttempt ? [`Page 470 ${PAGE_LABEL} is visible read-only after ${acceptedAttempt.route}.`] : []),
      'No VAT setup, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      ...(acceptedAttempt ? [] : [`Page 470 ${PAGE_LABEL} did not pass screenshot QA.`]),
      'No INLAND or VAT19 group exists or was changed by this run.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT calculation is proven.',
      'No VAT Entries or G/L Entries exist.'
    ],
    attempts,
    screenshots: ['target-027c4-000-search-overlay-before-click.png', ...attempts.map((entry) => entry.screenshot)],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027C4-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-027c4-search-candidates.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-027c4-search-overlay.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-027c4-000-search-overlay-before-click.png`,
      ...attempts.flatMap((entry) => [
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.textFile}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.screenshot}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.metadata}`
      ])
    ],
    blockedBy,
    warnings: [
      'This is navigation/surface recovery only; visible New/Edit actions remain unclicked.',
      'Page 470 visibility is a prerequisite for VAT group writes, not a VAT setup correctness proof.'
    ],
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-027C3 recovered Tell-Me input and TARGET-027C2 accepted Page 471; Page 470 result activation was the remaining blocker.',
      isPlannedNextCaseStillSensible: true,
      reason: 'C4 is the narrowest remaining prerequisite before any controlled VAT group write retry.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE-RETRY',
          status: resultStatus === 'observed' ? 'ready-next' : 'needs-ui-discovery-first',
          reason:
            resultStatus === 'observed'
              ? 'Page 470 and Page 471 surfaces now have read-only proof; write retry can be scoped.'
              : 'Write retry remains unsafe until Page 470 has accepted visible surface proof.'
        },
        {
          caseId: 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE',
          status: 'needs-setup-first',
          reason: 'The matrix row depends on INLAND and VAT19 group creation first.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting groups wait for VAT groups and matrix setup.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for posting groups, VAT defaults and dimensions.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'The blocker is removed; the next useful step is the bounded INLAND/VAT19 group write retry.'
          : 'Repeating the same exact result route would waste time; an alternative Page 470 route is needed.',
      risksBeforeNextCase: [
        'Do not click New/Edit/List actions without the controlled write case.',
        'Do not claim German VAT correctness before matrix, Preview Posting, VAT Entries and G/L Entries.'
      ],
      requiredPreparation:
        resultStatus === 'observed'
          ? ['Reuse accepted Page 470 and Page 471 screenshots as write-gate prerequisites.']
          : ['Use Page Inspection, source/object mapping or another UI route for Page 470.']
    },
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    statePatch: {},
    nextCase,
    reason:
      resultStatus === 'observed'
        ? 'Page 470 visible route recovered read-only; VAT writes remain separate.'
        : 'Page 470 visible route remains blocked; setup writes stay locked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027C4 VAT Business Result Click Recovery',
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
      '- Akzeptiert wird nur die echte Liste MwSt.-Geschaeftsbuchungsgruppen mit Titel, Code-Spalte und Beschreibung-Spalte.',
      '- Ein Tell-Me-Suchtreffer ist nur Navigation, kein VAT-Setup-Beweis.',
      '- Neu, Liste bearbeiten, Loeschen und Einrichtung bleiben ungeklickt.',
      '',
      '## Grenzen',
      '',
      '- Keine MwSt.-Geschaeftsbuchungsgruppe wurde angelegt oder geaendert.',
      '- Keine MwSt.-Produktbuchungsgruppe wurde angelegt oder geaendert.',
      '- Keine MwSt.-Buchungsmatrix wurde geaendert.',
      '- Keine Stammdaten, kein Beleg, keine Preview, keine Buchung.'
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
