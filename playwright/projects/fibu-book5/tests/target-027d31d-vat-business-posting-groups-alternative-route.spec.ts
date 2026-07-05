import { test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D31D-VAT-BUSINESS-POSTING-GROUPS-ALTERNATIVE-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d31d-vat-business-posting-groups-alternative-route';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D31D-result.json');

const SEARCH_TERM = 'MwSt.-Gesch\u00e4ftsbuchungsgruppen';
const PAGE_LABEL = 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups';
const PAGE_TITLE = /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i;

type SearchCandidate = {
  frameUrl: string;
  text: string;
  role: string;
  rect: { x: number; y: number; width: number; height: number };
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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token/i.test(line))
    .join('\n')
    .trim();
}

function normalizeForMatch(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
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

function buildPlaythruHomeUrl() {
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
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Weiter|Next|Yes|Ja|OK)\b/i.test(
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

async function visibleText(page: Page) {
  const compact = await compactPageText(page, {
    include: [PAGE_TITLE, /\bCode\b/i, /Beschreibung|Description/i, /Verwaltung|MwSt|VAT|Neu|Liste bearbeiten|Bearbeiten/i],
    maxLines: 180,
    maxLineLength: 240
  }).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${compact}\n${frameTexts.join('\n')}`);
}

async function findSearchCandidates(page: Page): Promise<SearchCandidate[]> {
  const all: SearchCandidate[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const selectors = '[role="row"],[role="gridcell"],[role="option"],[role="button"],[role="link"],button,a,li,div,span';
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
          .filter((entry) => /MwSt|USt|VAT|Buchungsgruppen|Verwaltung|Seiten und Aufgaben/i.test(entry!.text))
          .slice(0, 120);
      })
      .catch(() => []);
    for (const entry of entries as Omit<SearchCandidate, 'frameUrl'>[]) {
      all.push({ frameUrl: sanitizeUrl(frame.url()), ...entry });
    }
  }
  return all;
}

async function clickSmallPagesAndTasksCandidate(page: Page, candidates: SearchCandidate[]) {
  const exact = candidates
    .filter((entry) => normalizeForMatch(entry.text).includes('mwst.-geschaftsbuchungsgruppen'))
    .filter((entry) => normalizeForMatch(entry.text).includes('verwaltung'))
    .filter((entry) => !/Nach .* suchen|Unternehmensdaten durchsuchen|Hilfe durchsuchen/i.test(entry.text))
    .filter((entry) => entry.rect.width < 700 && entry.rect.height <= 100 && entry.rect.x >= 500 && entry.rect.y >= 80)
    .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];

  if (exact) {
    await page.mouse.click(exact.rect.x + Math.min(36, Math.round(exact.rect.width / 2)), exact.rect.y + Math.round(exact.rect.height / 2));
    await page.waitForTimeout(2500);
    return { clicked: true, route: 'small-pages-and-tasks-candidate-geometry', candidate: exact };
  }

  for (const scope of [page, ...page.frames()] as Array<Page | Frame>) {
    const locators = [
      scope.getByRole('row', { name: /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen\s+Verwaltung/i }),
      scope.getByRole('button', { name: /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen\s+Verwaltung/i }),
      scope.getByText(/MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen\s+Verwaltung/i)
    ];
    for (const locator of locators) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < Math.min(count, 4); index += 1) {
        const item = locator.nth(index);
        if (!(await item.isVisible({ timeout: 500 }).catch(() => false))) continue;
        await item.click({ timeout: 4000 }).catch(async () => item.click({ timeout: 4000, force: true }));
        await page.waitForTimeout(2500);
        return { clicked: true, route: 'pages-and-tasks-row-locator', candidate: null };
      }
    }
  }

  return { clicked: false, route: 'no-exact-pages-and-tasks-candidate', candidate: null };
}

test('TARGET-027D31D revalidates Page 470 through the exact pages-and-tasks row read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 1920, height: 1080 });

  const startedAt = new Date().toISOString();
  const smartDecision = {
    action: 'read-only-page-470-route-revalidation',
    effectiveAction: false,
    reason:
      'D31C blocked Page 470 because broad direct/search activation returned Role Center text. Earlier C4 evidence showed a narrower pages-and-tasks row route; D31D revalidates that exact surface before any VAT write gate.',
    sourceSupport: [
      'Existing TARGET-027C4 evidence accepted only the real Page 470 list with title, Code and Beschreibung.',
      'D31C rejected search overlays and Role Center context as page proof.'
    ],
    fieldsChanged: [],
    fieldsLeftUntouched: ['All VAT setup fields', 'All posting group fields', 'All accounts', 'All master data'],
    risk: 'A search overlay can contain the right text without opening the target page.',
    fallback: 'If title, Code and Beschreibung are not visible after the exact row click, keep VAT setup parked and move to source/page-inspection decision.',
    beginnerBookUse:
      'The book can explain that the Tell-Me result is only a navigation helper; the real setup page must show columns like Code and Beschreibung before values are entered.'
  };

  await page.goto(buildPlaythruHomeUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.keyboard.press('Escape').catch(() => undefined);

  await searchFor(page, SEARCH_TERM);
  await page.waitForTimeout(1000);
  const candidates = await findSearchCandidates(page);
  await writeJson(path.join(EVIDENCE_DIR, 'target-027d31d-search-candidates.json'), {
    caseId: CASE_ID,
    term: SEARCH_TERM,
    candidateCount: candidates.length,
    candidates: candidates.slice(0, 60)
  });
  await writeText(
    'target-027d31d-search-overlay-before-click.txt',
    clean((await compactPageText(page, { include: [/MwSt|VAT|Verwaltung|Seiten und Aufgaben|Nach .* suchen/i], maxLines: 120, maxLineLength: 240 }).catch(() => '')) || '')
  );
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'target-027d31d-000-search-overlay-before-click.png'), fullPage: false });

  const clickResult = await clickSmallPagesAndTasksCandidate(page, candidates);
  await waitForBusinessCentralShell(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1000);

  const text = await visibleText(page);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const accepted = safeContext && clickResult.clicked && hasRequiredPageSignals(text) && !hasSearchOverlay(text) && !hasDangerousDialog(text);
  const resultStatus = accepted ? 'observed' : 'blocked';
  const screenshot = 'target-027d31d-010-after-exact-pages-and-tasks-click.png';
  await writeText('target-027d31d-010-after-exact-pages-and-tasks-click.txt', text || 'No visible text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, screenshot), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, 'target-027d31d-010-after-exact-pages-and-tasks-click.screenshot.json'), {
    fileName: screenshot,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: PAGE_LABEL,
    route: clickResult.route,
    status: accepted ? 'accepted-readonly-page-470-surface' : 'rejected-readonly-page-470-surface',
    screenshotQa: {
      clicked: clickResult.clicked,
      titleVisible: PAGE_TITLE.test(text),
      codeColumnVisible: /\bCode\b/i.test(text),
      descriptionColumnVisible: /Beschreibung|Description/i.test(text),
      searchOverlayVisible: hasSearchOverlay(text),
      dangerousDialogVisible: hasDangerousDialog(text),
      accepted
    },
    clickedCandidate: clickResult.candidate,
    whatAUserSees: accepted
      ? 'Die Liste MwSt.-Geschaeftsbuchungsgruppen ist sichtbar. Hier werden Geschaeftspartner-Steuergruppen als Codes mit Beschreibung gepflegt.'
      : 'Die erwartete Liste MwSt.-Geschaeftsbuchungsgruppen ist nach diesem Navigationsversuch noch nicht sauber sichtbar.',
    internallyProves: accepted
      ? 'Page 470 is visible read-only through the exact pages-and-tasks result route.'
      : 'This route is not accepted as Page 470 proof.',
    doesNotProve: [
      'No VAT business posting group was created or changed.',
      'No VAT product posting group was created or changed.',
      'No VAT Posting Setup matrix row exists.',
      'No VAT correctness, Preview Posting or Posting is proven.'
    ]
  });

  const blockedBy = [
    !safeContext ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.` : '',
    !clickResult.clicked ? 'No exact pages-and-tasks row candidate was clicked.' : '',
    !PAGE_TITLE.test(text) ? 'Page 470 title not visible.' : '',
    !/\bCode\b/i.test(text) ? 'Code column not visible.' : '',
    !/Beschreibung|Description/i.test(text) ? 'Beschreibung/Description column not visible.' : '',
    hasSearchOverlay(text) ? 'Visible state still looks like Tell-Me/search overlay.' : '',
    hasDangerousDialog(text) ? 'Dangerous dialog/action signal visible; no confirmation performed.' : ''
  ].filter(Boolean);

  const nextCase = accepted ? 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION' : 'TARGET-027D31E-VAT-BUSINESS-GROUPS-SOURCE-OR-PAGEINSPECTION-DECISION';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
    lastEvidenceSummary:
      'D31C proved Assisted Setup read-only but blocked Page 470 because broad direct/search routes stayed in Role Center or overlay context.',
    isPlannedNextCaseStillSensible: accepted,
    reason: accepted
      ? 'Page 470 is again visibly reachable through the exact pages-and-tasks row, so D32 can decide the VAT write gate without writing yet.'
      : 'The exact row route did not produce accepted Page 470 proof; VAT setup writes remain parked.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION',
        status: accepted ? 'ready-next' : 'blocked',
        reason: accepted ? 'Needs source-backed value decision before any write.' : 'Needs Page 470 proof or a documented alternative first.'
      },
      {
        caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting group preflight depends on VAT setup route/value decision.'
      },
      {
        caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
        status: accepted ? 'ready-after-current' : 'ready-after-current',
        reason: 'Can proceed after VAT setup is resolved or deliberately parked.'
      },
      {
        caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
        status: 'needs-setup-first',
        reason: 'Foundation readiness waits for VAT/posting group status.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: accepted
      ? 'The remaining route blocker is resolved read-only; the next useful step is a no-write value/write-gate decision.'
      : 'Repeating UI clicks would waste time; the next useful step is a source/page-inspection decision or deliberate VAT parking.',
    risksBeforeNextCase: [
      'Visible Page 470 is not VAT correctness.',
      'No INLAND/VAT19 values are final until a separate write case with Reopen-Proof.',
      'No Preview Posting, Posting or VAT Entries exist.'
    ],
    requiredPreparation: accepted
      ? ['Use screenshot QA from D31D and existing source registry before D32.']
      : ['Do not repeat D31C/D31D click routes without a new route hypothesis.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-business-page-470-alternative-route-readonly',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    startedAt,
    finishedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(currentUrl),
    page: PAGE_LABEL,
    smartDecision,
    actionsTaken: [
      'Opened Business Central read-only in playthru / UNIVERSAARL-DE.',
      'Opened Tell-Me only as a navigation helper for MwSt.-Geschaeftsbuchungsgruppen.',
      'Captured the search overlay and candidate inventory before clicking.',
      'Clicked only the exact small pages-and-tasks row candidate for MwSt.-Geschaeftsbuchungsgruppen Verwaltung.',
      'Captured after-click screenshot QA and rejected overlay/Role Center text as page proof.'
    ],
    actionsNotTaken: [
      'No VAT group create/edit',
      'No VAT Posting Setup matrix row',
      'No assisted setup Next/Finish/Apply/OK',
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
    screenshots: ['target-027d31d-000-search-overlay-before-click.png', screenshot],
    evidenceRefs: [
      'TARGET-027D31D-result.json',
      'README.md',
      'target-027d31d-search-candidates.json',
      'target-027d31d-search-overlay-before-click.txt',
      'target-027d31d-000-search-overlay-before-click.png',
      'target-027d31d-010-after-exact-pages-and-tasks-click.txt',
      screenshot,
      'target-027d31d-010-after-exact-pages-and-tasks-click.screenshot.json'
    ],
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      ...(accepted ? [`Page 470 ${PAGE_LABEL} is visible read-only after the exact pages-and-tasks row click.`] : []),
      'No VAT setup, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      ...(accepted ? [] : [`Page 470 ${PAGE_LABEL} did not pass screenshot QA.`]),
      'No INLAND or VAT19 group exists or was changed by this run.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT calculation is proven.',
      'No VAT Entries or G/L Entries exist.'
    ],
    blockedBy,
    warnings: [
      'Tell-Me is treated only as navigation; the accepted proof is the actual list surface.',
      'Visible New/Edit/List actions remain unclicked.'
    ],
    route: {
      searchTerm: SEARCH_TERM,
      clicked: clickResult.clicked,
      route: clickResult.route,
      candidateCount: candidates.length,
      accepted
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
      noBookChange: true
    },
    nextStepDecision,
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    statePatch: {},
    nextCase,
    reason: accepted
      ? 'Page 470 visible route recovered read-only through the exact pages-and-tasks row; VAT writes remain separate.'
      : 'Page 470 route remains blocked; VAT setup writes stay locked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027D31D VAT Business Posting Groups Alternative Route',
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
      '- Vor dem Klick wird das Suchoverlay mit der Kandidatenliste gespeichert.',
      '- Geklickt wird nur der kleine Treffer unter Seiten und Aufgaben, nicht Unternehmensdaten durchsuchen oder Hilfe durchsuchen.',
      '- Akzeptiert wird nur die echte Liste mit Seitentitel, Code und Beschreibung.',
      '- Suchoverlay, Role Center und Dialoge zaehlen nicht als Page-470-Beweis.',
      '',
      '## Grenzen',
      '',
      '- Keine MwSt.-Geschaeftsbuchungsgruppe wurde angelegt oder geaendert.',
      '- Keine MwSt.-Produktbuchungsgruppe wurde angelegt oder geaendert.',
      '- Keine MwSt.-Buchungsmatrix wurde geaendert.',
      '- Keine Stammdaten, kein Beleg, keine Preview, keine Buchung.'
    ].join('\n')
  );
});
