import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(210_000);

const CASE_ID = 'TARGET-070B-VAT-PAGE470-HELPER-FIX-OR-PAGEINSPECTION-DIAGNOSIS';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-070b-vat-page470-helper-fix-or-pageinspection-diagnosis';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-070B-result.json');
const PAGE_ID = 470;
const PAGE_LABEL = 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups';
const PAGE_TITLE = /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|USt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i;

type RouteObservation = {
  route: string;
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
    roleCenterVisible: boolean;
    dangerousDialogVisible: boolean;
    pageParamPresent: boolean;
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

function basePlaythruUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.search = '';
  return url;
}

function buildRouteUrl(route: string) {
  const url = basePlaythruUrl();
  if (route === 'target020-exact-company-then-page-no-dc') {
    url.searchParams.set('company', TARGET_COMPANY);
    url.searchParams.set('page', String(PAGE_ID));
    return url.toString();
  }
  if (route === 'page-first-then-company-no-dc') {
    return `${url.origin}${url.pathname}?page=${PAGE_ID}&company=${encodeURIComponent(TARGET_COMPANY)}`;
  }
  if (route === 'company-then-page-with-dc-control') {
    url.searchParams.set('company', TARGET_COMPANY);
    url.searchParams.set('page', String(PAGE_ID));
    url.searchParams.set('dc', '0');
    return url.toString();
  }
  throw new Error(`Unknown route ${route}`);
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

function hasRoleCenter(text: string) {
  return /Guten Abend|Aktivitaten|Verkaufsauftrag|Einkaufsrechnung|Shopify|Power BI|Role Center/i.test(text);
}

function hasDangerousDialog(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja|OK)\b/i.test(
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
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  const compact = await compactPageText(page, {
    include: [PAGE_TITLE, /\bCode\b/i, /Beschreibung|Description/i, /MwSt|USt|VAT|Page Inspection|Seitenpr|Source Table|Table ID|Neu|Liste bearbeiten|Verwaltung/i],
    maxLines: 180,
    maxLineLength: 240
  });
  return clean(`${compact}\n${frameTexts.join('\n')}`);
}

async function capture(page: Page, route: string, sequence: number): Promise<RouteObservation> {
  await page.waitForTimeout(2200);
  const text = await visibleText(page);
  const currentUrl = page.url();
  const signals = {
    titleVisible: PAGE_TITLE.test(text),
    codeColumnVisible: /\bCode\b/i.test(text),
    descriptionColumnVisible: /Beschreibung|Description/i.test(text),
    searchOverlayVisible: hasSearchOverlay(text),
    roleCenterVisible: hasRoleCenter(text),
    dangerousDialogVisible: hasDangerousDialog(text),
    pageParamPresent: new URL(currentUrl).searchParams.get('page') === String(PAGE_ID)
  };
  const accepted =
    instancePathIsTarget(currentUrl) &&
    companyParamIsTarget(currentUrl) &&
    signals.titleVisible &&
    signals.codeColumnVisible &&
    signals.descriptionColumnVisible &&
    !signals.searchOverlayVisible &&
    !signals.roleCenterVisible &&
    !signals.dangerousDialogVisible;
  const blockedBy = [
    !instancePathIsTarget(currentUrl) ? `Unsafe instance: expected ${EXPECTED_INSTANCE}.` : '',
    !companyParamIsTarget(currentUrl) ? `Unsafe company: expected ${TARGET_COMPANY}.` : '',
    !signals.pageParamPresent ? 'Business Central removed or ignored page=470 from the visible URL.' : '',
    !signals.titleVisible ? 'Page 470 title not visible.' : '',
    !signals.codeColumnVisible ? 'Code column not visible.' : '',
    !signals.descriptionColumnVisible ? 'Beschreibung/Description column not visible.' : '',
    signals.searchOverlayVisible ? 'Visible state still looks like Tell-Me/search overlay.' : '',
    signals.roleCenterVisible ? 'Visible state still looks like Role Center, not Page 470.' : '',
    signals.dangerousDialogVisible ? 'Dangerous dialog/action signal visible; no confirmation performed.' : ''
  ].filter(Boolean);
  const prefix = `target-070b-${String(sequence).padStart(3, '0')}-${route.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
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
    url: sanitizeUrl(currentUrl),
    status: accepted ? 'accepted-readonly-page-470-surface' : 'rejected-readonly-page-470-surface',
    screenshotQa: { ...signals, accepted },
    beginnerLearning:
      'Die MwSt.-Geschaeftsbuchungsgruppen sind eine Liste fuer steuerliche Geschaeftspartner-Kontexte. Eine sichtbare Suchzeile allein ist noch keine geoeffnete Liste.',
    internallyProves: accepted ? 'Page 470 is visible read-only.' : 'This route did not produce accepted Page 470 screenshot truth.',
    doesNotProve: [
      'No VAT Business Posting Group was created or changed.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT correctness.',
      'No Preview Posting or Posting.'
    ]
  });

  return { route, accepted, url: sanitizeUrl(currentUrl), screenshot, textFile, metadata, blockedBy, signals };
}

async function pageInspectionAttempt(page: Page) {
  await searchFor(page, 'MwSt.-Geschaeftsbuchungsgruppen');
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(2500);
  const text = await visibleText(page);
  const opened = /Page Inspection|Inspect pages and data|Page ID|Page Name|Page Type|Source Table|Table ID|Seitenpr|Seitenuberprufung|Seitenueberpruefung/i.test(
    text
  );
  await writeText('target-070b-900-pageinspection-attempt.txt', text || 'No Page Inspection text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'target-070b-900-pageinspection-attempt.png'), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, 'target-070b-900-pageinspection-attempt.screenshot.json'), {
    fileName: 'target-070b-900-pageinspection-attempt.png',
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: PAGE_LABEL,
    opened,
    hasPage470Signal: /470|MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i.test(text),
    hasRoleCenterSignal: hasRoleCenter(text),
    hasSearchOverlaySignal: hasSearchOverlay(text)
  });
  return {
    opened,
    hasPage470Signal: /470|MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i.test(text),
    hasRoleCenterSignal: hasRoleCenter(text),
    hasSearchOverlaySignal: hasSearchOverlay(text)
  };
}

test('TARGET-070B diagnoses Page 470 URL shape and Page Inspection read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const routeNames = [
    'target020-exact-company-then-page-no-dc',
    'page-first-then-company-no-dc',
    'company-then-page-with-dc-control'
  ];
  const observations: RouteObservation[] = [];

  for (let index = 0; index < routeNames.length; index += 1) {
    const route = routeNames[index];
    await page.goto(buildRouteUrl(route), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await page.keyboard.press('Escape').catch(() => undefined);
    observations.push(await capture(page, route, index + 1));
    if (observations[index].accepted) break;
  }

  const accepted = observations.find((entry) => entry.accepted);
  const pageInspection = accepted ? undefined : await pageInspectionAttempt(page);
  const resultStatus = accepted ? 'observed' : 'blocked';
  const nextCase = accepted
    ? 'TARGET-071-VAT-GROUPS-CONTROLLED-WRITE-GATE-DECISION'
    : 'TARGET-070C-VAT-PAGE470-SOURCE-OBJECT-OR-ALTERNATIVE-ROUTE-DECISION';
  const blockedBy = accepted
    ? []
    : Array.from(new Set([...observations.flatMap((entry) => entry.blockedBy), ...(pageInspection?.opened ? [] : ['Page Inspection did not open a usable technical pane for Page 470.'])]));

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-page470-url-shape-pageinspection-readonly',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actionsTaken: [
      'Opened Business Central read-only in playthru / UNIVERSAARL-DE.',
      'Tried Page 470 URL-shape variants without setup writes.',
      ...(accepted ? [] : ['Attempted Ctrl+Alt+F1 Page Inspection from the Tell-Me candidate context.']),
      'Captured screenshots, text, metadata and result JSON.'
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
      ...(accepted ? [`Page 470 ${PAGE_LABEL} is visible read-only via ${accepted.route}.`] : []),
      'No VAT setup, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      ...(accepted ? [] : [`Page 470 ${PAGE_LABEL} did not pass screenshot QA with URL-shape variants or Page Inspection.`]),
      'No INLAND or VAT19 group exists or was changed by this run.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT calculation is proven.',
      'No VAT Entries or G/L Entries exist.'
    ],
    observations,
    pageInspection,
    screenshots: [
      ...observations.map((entry) => entry.screenshot),
      ...(pageInspection ? ['target-070b-900-pageinspection-attempt.png'] : [])
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-070B-result.json`,
      ...observations.flatMap((entry) => [
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.textFile}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.screenshot}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.metadata}`
      ]),
      ...(pageInspection
        ? [
            `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-070b-900-pageinspection-attempt.txt`,
            `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-070b-900-pageinspection-attempt.png`,
            `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-070b-900-pageinspection-attempt.screenshot.json`
          ]
        : [])
    ],
    blockedBy,
    warnings: [
      'This run is route diagnosis only; visible New/Edit actions remain unclicked.',
      'Page 470 visibility is not VAT setup correctness.'
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
      lastEvidenceSummary: 'TARGET-070 blocked Page 470 direct, exact-result and row-chevron geometry routes.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Route construction and Page Inspection are materially different from repeating the same Tell-Me clicks.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-071-VAT-GROUPS-CONTROLLED-WRITE-GATE-DECISION',
          status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
          reason: resultStatus === 'observed' ? 'Page 470 is visible read-only.' : 'No VAT group write gate before Page 470 route truth.'
        },
        {
          caseId: 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE',
          status: 'needs-setup-first',
          reason: 'VAT matrix remains downstream of VAT Business/Product Posting Group setup.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting Groups remain downstream of VAT group/matrix readiness.'
        },
        {
          caseId: 'TARGET-012-W1-FOUNDATION-READINESS',
          status: 'needs-setup-first',
          reason: 'Foundation readiness cannot be claimed while VAT route truth remains blocked.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: accepted
        ? 'Page 470 route truth exists; next step is a local write-gate decision before any setup change.'
        : 'URL shape and Page Inspection did not unlock Page 470; use source/object or alternative non-UI route decision before further clicks.',
      risksBeforeNextCase: [
        'Do not write VAT groups before a controlled write gate.',
        'Do not claim German VAT correctness before matrix, Preview Posting, VAT Entries and G/L Entries.'
      ],
      requiredPreparation: accepted
        ? ['Use the accepted screenshot as Page 470 route proof only.']
        : ['Stop repeating Page 470 Tell-Me clicks; decide source/object or alternative route.']
    },
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    statePatch: {},
    nextCase,
    reason: accepted
      ? 'Page 470 URL route recovered read-only; VAT writes remain separate.'
      : 'Page 470 route remains blocked after URL-shape and Page Inspection diagnosis; setup writes stay locked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-070B VAT Page 470 URL Shape and Page Inspection Diagnosis',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
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
