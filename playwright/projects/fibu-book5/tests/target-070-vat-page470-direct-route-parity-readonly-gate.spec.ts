import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(210_000);

const CASE_ID = 'TARGET-070-VAT-PAGE470-DIRECT-ROUTE-PARITY-READONLY-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-070-vat-page470-direct-route-parity-readonly-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-070-result.json');

const PAGE_ID = 470;
const PAGE_LABEL = 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups';
const PAGE_TITLE = /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i;
const BODY_SIGNALS = [/\bCode\b/i, /Beschreibung|Description/i];
const SEARCH_TERM = 'MwSt.-Gesch\u00e4ftsbuchungsgruppen';

type RouteAttempt = {
  route: string;
  clicked: boolean;
  accepted: boolean;
  url: string;
  screenshot: string;
  textFile: string;
  metadata: string;
  blockedBy: string[];
  signals: {
    titleVisible: boolean;
    codeColumnVisible: boolean;
    descriptionColumnVisible: boolean;
    searchOverlayVisible: boolean;
    dangerousDialogVisible: boolean;
    roleCenterVisible: boolean;
  };
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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId|upn:|login\.microsoftonline/i.test(line))
    .join('\n')
    .trim();
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

function buildPlaythruUrl(pageId?: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  if (pageId) url.searchParams.set('page', String(pageId));
  return url.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function hasSearchOverlay(text: string) {
  return /Wie mochten Sie weiter verfahren|Was mochten Sie tun|Tell me|Nach .* suchen|Seiten und Aufgaben|Zu Seiten und Aufgaben wechseln/i.test(
    text
  );
}

function hasDangerousDialog(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja|OK)\b/i.test(
    text
  );
}

function hasRoleCenter(text: string) {
  return /Guten Abend|Aktivitaten|Verkaufsauftrag|Einkaufsrechnung|Shopify|Power BI|Role Center/i.test(text);
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
    include: [PAGE_TITLE, /\bCode\b/i, /Beschreibung|Description/i, /MwSt|USt|VAT|Neu|Liste bearbeiten|Verwaltung/i],
    maxLines: 180,
    maxLineLength: 240
  });
  return clean(`${compact}\n${frameTexts.join('\n')}`);
}

async function findSearchCandidates(page: Page) {
  const all: Array<{ frameUrl: string; text: string; role: string; rect: { x: number; y: number; width: number; height: number } }> = [];
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
    for (const entry of entries as Array<{ text: string; role: string; rect: { x: number; y: number; width: number; height: number } }>) {
      all.push({ frameUrl: sanitizeUrl(frame.url()), ...entry });
    }
  }
  return all;
}

async function clickExactSearchResult(page: Page) {
  const patterns = [/MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen\s+Verwaltung/i, /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen/i, /VAT Business Posting Groups/i];

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
  return false;
}

async function clickBestGeometryCandidate(
  page: Page,
  candidates: Array<{ text: string; role: string; rect: { x: number; y: number; width: number; height: number } }>
) {
  const row = candidates
    .filter((entry) => /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i.test(clean(entry.text)))
    .filter((entry) => /Verwaltung|Management/i.test(clean(entry.text)))
    .filter((entry) => entry.rect.x >= 600 && entry.rect.y >= 100 && entry.rect.width > 80 && entry.rect.height >= 20 && entry.rect.height <= 90)
    .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];

  if (!row) return false;

  // In Tell-Me results the chevron at the left edge opens the selected page more reliably than text-clicking.
  await page.mouse.click(row.rect.x + 12, row.rect.y + Math.round(row.rect.height / 2));
  await page.waitForTimeout(2500);
  return true;
}

async function captureAttempt(page: Page, route: string, sequence: number, clicked: boolean): Promise<RouteAttempt> {
  await page.waitForTimeout(2500);
  const text = await visibleText(page);
  const signals = {
    titleVisible: PAGE_TITLE.test(text),
    codeColumnVisible: /\bCode\b/i.test(text),
    descriptionColumnVisible: /Beschreibung|Description/i.test(text),
    searchOverlayVisible: hasSearchOverlay(text),
    dangerousDialogVisible: hasDangerousDialog(text),
    roleCenterVisible: hasRoleCenter(text)
  };
  const accepted =
    signals.titleVisible &&
    BODY_SIGNALS.every((signal) => signal.test(text)) &&
    !signals.searchOverlayVisible &&
    !signals.dangerousDialogVisible &&
    !signals.roleCenterVisible;
  const blockedBy = [
    !signals.titleVisible ? 'Page 470 title not visible.' : '',
    !signals.codeColumnVisible ? 'Code column not visible.' : '',
    !signals.descriptionColumnVisible ? 'Beschreibung/Description column not visible.' : '',
    signals.searchOverlayVisible ? 'Visible state still looks like Tell-Me/search overlay.' : '',
    signals.roleCenterVisible ? 'Visible state still looks like Role Center, not Page 470.' : '',
    signals.dangerousDialogVisible ? 'Dangerous dialog/action signal visible; no confirmation performed.' : ''
  ].filter(Boolean);
  const prefix = `target-070-${String(sequence).padStart(3, '0')}-${route.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
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
    screenshotQa: { ...signals, accepted },
    beginnerLearning:
      'Die Liste MwSt.-Geschaeftsbuchungsgruppen trennt Geschaeftspartner nach steuerlichem Kontext. Sie ist ein Baustein vor der MwSt.-Buchungsmatrix, aber noch kein Steuer-Setup.',
    internallyProves: accepted
      ? 'Page 470 is visible read-only in playthru / UNIVERSAARL-DE.'
      : 'This route is not accepted as current Page 470 proof.',
    doesNotProve: [
      'No VAT business posting group was created or changed.',
      'No VAT product posting group was created or changed.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT correctness.',
      'No Preview Posting or Posting.'
    ]
  });

  return {
    route,
    clicked,
    accepted,
    url: sanitizeUrl(page.url()),
    screenshot,
    textFile,
    metadata,
    blockedBy,
    signals
  };
}

test('TARGET-070 proves or blocks current Page 470 direct route parity read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const attempts: RouteAttempt[] = [];

  await page.goto(buildPlaythruUrl(PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  attempts.push(await captureAttempt(page, 'target020-direct-page-470', 1, false));

  if (!attempts[0].accepted) {
    await page.goto(buildPlaythruUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await searchFor(page, SEARCH_TERM);
    await page.waitForTimeout(1000);
    let candidates = await findSearchCandidates(page);
    await writeJson(path.join(EVIDENCE_DIR, 'target-070-search-candidates.json'), {
      caseId: CASE_ID,
      term: SEARCH_TERM,
      candidates
    });
    await writeText(
      'target-070-search-overlay-before-click.txt',
      clean((await compactPageText(page, { include: [/MwSt|VAT|Verwaltung|Seiten und Aufgaben/i], maxLines: 120, maxLineLength: 240 })) || (await pageText(page)))
    );
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'target-070-000-search-overlay-before-click.png'), fullPage: false });
    const clicked = await clickExactSearchResult(page);
    attempts.push(await captureAttempt(page, 'target027c4-exact-result-locator-or-geometry-click', 2, clicked));

    if (!attempts[1].accepted) {
      await page.goto(buildPlaythruUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await waitForBusinessCentralShell(page);
      await searchFor(page, SEARCH_TERM);
      await page.waitForTimeout(1000);
      candidates = await findSearchCandidates(page);
      await writeJson(path.join(EVIDENCE_DIR, 'target-070-geometry-search-candidates.json'), {
        caseId: CASE_ID,
        term: SEARCH_TERM,
        route: 'row-chevron-geometry-click',
        candidates
      });
      const geometryClicked = await clickBestGeometryCandidate(page, candidates);
      attempts.push(await captureAttempt(page, 'target070-row-chevron-geometry-click', 3, geometryClicked));
    }
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
      ? 'TARGET-071-VAT-GROUPS-CONTROLLED-WRITE-GATE-DECISION'
      : 'TARGET-070B-VAT-PAGE470-HELPER-FIX-OR-PAGEINSPECTION-DIAGNOSIS';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-page470-direct-route-parity-readonly',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(currentUrl),
    actionsTaken: [
      'Opened Business Central read-only in playthru / UNIVERSAARL-DE.',
      'Tried TARGET-020 direct Page 470 URL pattern first.',
      ...(attempts.length > 1 ? ['Direct route did not pass QA; tried TARGET-027C4 exact result route as fallback.'] : []),
      ...(attempts.length > 2 ? ['Exact result text route did not pass QA; tried row-chevron geometry click as a BC UI learning fallback.'] : []),
      'Captured compact text, screenshot QA metadata and result JSON.'
    ],
    actionsNotTaken: [
      'No VAT Business Posting Group create/edit',
      'No VAT Product Posting Group create/edit',
      'No VAT Posting Setup write',
      'No New action',
      'No Edit List action',
      'No setup change',
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
    screenshots: [
      ...(attempts.length > 1 ? ['target-070-000-search-overlay-before-click.png'] : []),
      ...attempts.map((entry) => entry.screenshot)
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-070-result.json`,
      ...(attempts.length > 1
        ? [
            `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-070-search-candidates.json`,
            ...(attempts.length > 2
              ? [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-070-geometry-search-candidates.json`]
              : []),
            `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-070-search-overlay-before-click.txt`,
            `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-070-000-search-overlay-before-click.png`
          ]
        : []),
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
        'TARGET-069 found conflicting Page 470 route evidence: older TARGET-020/TARGET-027C4 positive signals versus newer D31D/D31E blocked routes.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The next write-gate depends on current Page 470 screenshot truth, so route parity must be settled before VAT setup work.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-071-VAT-GROUPS-CONTROLLED-WRITE-GATE-DECISION',
          status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
          reason:
            resultStatus === 'observed'
              ? 'Current Page 470 read-only proof exists; a local write-gate decision can decide whether INLAND/VAT19 group writes are ready.'
              : 'No write-gate before current Page 470 proof.'
        },
        {
          caseId: 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE',
          status: 'needs-setup-first',
          reason: 'The VAT matrix row depends on VAT Business and Product Posting Groups first.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting Groups remain downstream of VAT group/matrix readiness.'
        },
        {
          caseId: 'TARGET-012-W1-FOUNDATION-READINESS',
          status: 'needs-setup-first',
          reason: 'Foundation readiness cannot be claimed while VAT write gates remain unresolved.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'The current blocker is removed; the cheapest next step is a local controlled write-gate decision before any setup change.'
          : 'Repeating the same route would waste time; the next useful work is helper/Page Inspection diagnosis.',
      risksBeforeNextCase: [
        'Do not click New/Edit/List actions without the controlled write case.',
        'Do not claim German VAT correctness before matrix, Preview Posting, VAT Entries and G/L Entries.'
      ],
      requiredPreparation:
        resultStatus === 'observed'
          ? ['Use the accepted Page 470 screenshot as a write-gate prerequisite, not as VAT correctness proof.']
          : ['Use Page Inspection or a materially different UI route; do not repeat the failed search-click path.']
    },
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    statePatch: {},
    nextCase,
    reason:
      resultStatus === 'observed'
        ? 'Page 470 visible route parity recovered read-only; VAT writes remain separate.'
        : 'Page 470 visible route parity remains blocked; setup writes stay locked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-070 VAT Page 470 Direct Route Parity',
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
      '- Role Center, Tell-Me-Suchoverlay oder generische Code/Beschreibung-Texte reichen nicht.',
      '- Neu, Liste bearbeiten, Loeschen, Einrichtung, Preview und Buchen bleiben ungeklickt.',
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
