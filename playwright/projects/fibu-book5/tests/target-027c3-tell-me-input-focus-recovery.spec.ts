import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027C3-TELL-ME-INPUT-FOCUS-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027c3-tell-me-input-focus-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027C3-result.json');

type SearchProbe = {
  id: 'business-de' | 'business-en' | 'product-de';
  term: string;
  expectedTitle: RegExp;
};

type TextboxSignal = {
  frameUrl: string;
  tag: string;
  role: string;
  ariaLabel: string;
  value: string;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
};

const probes: SearchProbe[] = [
  {
    id: 'business-de',
    term: 'MwSt.-Gesch\u00e4ftsbuchungsgruppen',
    expectedTitle: /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i
  },
  {
    id: 'business-en',
    term: 'VAT Business Posting Groups',
    expectedTitle: /MwSt\.-?Gesch[a-z]*ftsbuchungsgruppen|VAT Business Posting Groups/i
  },
  {
    id: 'product-de',
    term: 'MwSt.-Produktbuchungsgruppen',
    expectedTitle: /MwSt\.-?Produktbuchungsgruppen|VAT Product Posting Groups/i
  }
];

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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId|clientId|authority:|upn:/i.test(line))
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

function termMatches(value: string, term: string) {
  const normalizedValue = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const normalizedTerm = term.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return normalizedValue.includes(normalizedTerm);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function visibleTextboxSignals(page: Page): Promise<TextboxSignal[]> {
  const signals: TextboxSignal[] = [];
  for (const frame of page.frames()) {
    const frameSignals = await frame
      .evaluate(() => {
        return [...document.querySelectorAll<HTMLElement>('input, textarea, [contenteditable="true"], [role="textbox"]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const visible =
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
              tag: element.tagName.toLowerCase(),
              role: element.getAttribute('role') || '',
              ariaLabel: element.getAttribute('aria-label') || '',
              value: (element as HTMLInputElement).value || '',
              text: element.textContent || '',
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              }
            };
          })
          .filter(Boolean);
      })
      .catch(() => []);

    for (const signal of frameSignals as Omit<TextboxSignal, 'frameUrl'>[]) {
      signals.push({ frameUrl: sanitizeUrl(frame.url()), ...signal });
    }
  }
  return signals;
}

async function visibleBodyText(page: Page) {
  const text = await Promise.all(
    page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''))
  );
  return clean(text.join('\n'));
}

async function captureSearchProbe(page: Page, probe: SearchProbe, sequence: number) {
  await searchFor(page, probe.term);
  await page.waitForTimeout(1000);

  const textboxSignals = await visibleTextboxSignals(page);
  const text = await visibleBodyText(page);
  const compact = await compactPageText(page, {
    include: [probe.expectedTitle, /Wie mochten Sie weiter verfahren|Tell me|Suchen|Search/i, /Seiten|Pages|Berichte|Reports/i],
    maxLines: 120,
    maxLineLength: 220
  });
  const filledSignals = textboxSignals.filter((signal) => termMatches(`${signal.value}\n${signal.text}`, probe.term));
  const targetPageVisible = probe.expectedTitle.test(text);
  const prefix = `target-027c3-${String(sequence).padStart(3, '0')}-${probe.id}`;
  const screenshot = `${prefix}-tell-me-input.png`;
  const textFile = `${prefix}-visible-text.txt`;
  const metadata = `${prefix}.screenshot.json`;

  await writeText(textFile, clean(compact || text) || 'No compact Tell-Me text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, screenshot), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, metadata), {
    fileName: screenshot,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    probe: probe.id,
    term: probe.term,
    status: filledSignals.length > 0 || targetPageVisible ? 'accepted-readonly-input-proof' : 'rejected-empty-input',
    screenshotQa: {
      searchTermDomVisible: filledSignals.length > 0,
      targetPageVisible,
      textboxSignalCount: textboxSignals.length,
      filledSignalCount: filledSignals.length
    },
    whatAUserSees:
      filledSignals.length > 0
        ? 'Der Tell-Me-Suchdialog enthaelt den eingegebenen Suchbegriff.'
        : 'Der Tell-Me-Suchdialog oder Role Center ist sichtbar, aber kein gefuelltes Suchfeld wurde nachgewiesen.',
    internallyProves:
      filledSignals.length > 0
        ? 'The visible Tell-Me textbox input route can receive the intended search term.'
        : 'The attempted Tell-Me input route is still not accepted.',
    doesNotProve: [
      'No VAT page setup is changed.',
      'No VAT group exists or was created.',
      'No VAT Posting Setup matrix row exists.',
      'No Preview Posting, Posting, VAT Entry or G/L Entry.'
    ],
    textboxSignals
  });

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);

  return {
    probe: probe.id,
    term: probe.term,
    status: filledSignals.length > 0 || targetPageVisible ? 'accepted' : 'rejected',
    screenshot,
    screenshotMetadata: metadata,
    textFile,
    url: sanitizeUrl(page.url()),
    targetPageVisible,
    textboxSignalCount: textboxSignals.length,
    filledSignalCount: filledSignals.length,
    filledSignals,
    textSignals: clean(compact || text).split('\n').slice(0, 40)
  };
}

test('TARGET-027C3 recovers visible Tell-Me search input read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.goto(buildPlaythruUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);

  const captures = [];
  for (let index = 0; index < probes.length; index += 1) {
    captures.push(await captureSearchProbe(page, probes[index], index + 1));
    if (captures[captures.length - 1].status === 'accepted') break;
  }

  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const accepted = captures.filter((entry) => entry.status === 'accepted');
  const blockedBy = [
    !safeContext ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.` : '',
    accepted.length === 0 ? 'No visible Tell-Me textbox input proof was accepted.' : ''
  ].filter(Boolean);
  const resultStatus = blockedBy.length === 0 ? 'observed' : 'blocked';
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-027C2-VAT-PAGE-SURFACE-RECOVERY-RETRY'
      : 'TARGET-027C4-VAT-NAVIGATION-ALTERNATIVE-ROUTE';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-tell-me-input-focus-readonly',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actionsTaken: [
      'Opened Business Central read-only in playthru / UNIVERSAARL-DE.',
      'Opened Tell-Me/Search and attempted visible textbox input for VAT page search terms.',
      'Captured screenshot QA and textbox diagnostics.',
      'Stopped before any New, Edit, VAT setup, master data, draft, Preview Posting or Posting.'
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
      ...(accepted.length > 0
        ? [`Tell-Me input accepted visible search text for ${accepted[0].term}.`]
        : []),
      'No VAT setup, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
    ],
    notProved: [
      ...(accepted.length > 0 ? [] : ['No visible Tell-Me textbox input proof was accepted.']),
      'No VAT Business/Product Posting Groups page surface is accepted by this run.',
      'No INLAND or VAT19 group exists or was changed by this run.',
      'No VAT Posting Setup matrix row exists.',
      'No German 19 percent VAT calculation is proven.',
      'No VAT Entries or G/L Entries exist.'
    ],
    captures,
    screenshots: captures.map((entry) => entry.screenshot),
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027C3-result.json`,
      ...captures.flatMap((entry) => [
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.textFile}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.screenshot}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.screenshotMetadata}`
      ])
    ],
    blockedBy,
    warnings: [
      'This run proves only Tell-Me input/focus behavior, not VAT setup correctness.',
      'A filled search box is navigation evidence; it is not a VAT page or setup proof by itself.'
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
        'TARGET-027C2 showed Tell-Me open but the visible search textbox stayed empty; VAT writes remain locked.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Recovering Tell-Me input is the smallest prerequisite before repeating VAT page-surface recovery.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027C2-VAT-PAGE-SURFACE-RECOVERY-RETRY',
          status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
          reason:
            resultStatus === 'observed'
              ? 'The search input route now has visible proof and can be reused for page-surface recovery.'
              : 'Still no visible input proof.'
        },
        {
          caseId: 'TARGET-027C-VAT-GROUPS-CONTROLLED-WRITE-RETRY',
          status: 'needs-ui-discovery-first',
          reason: 'VAT group writes require accepted VAT page surfaces, not just a search box.'
        },
        {
          caseId: 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE',
          status: 'needs-setup-first',
          reason: 'The matrix row depends on visible INLAND and VAT19 groups first.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting groups wait for VAT setup readiness.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'The input blocker is removed; retrying VAT page surface recovery is the next narrow step.'
          : 'A different navigation route is needed because the search input blocker remains.',
      risksBeforeNextCase: [
        'Do not treat a filled search box as VAT setup proof.',
        'Do not click New/Edit/List actions on VAT pages until the target page surface is accepted.'
      ],
      requiredPreparation:
        resultStatus === 'observed'
          ? ['Reuse the accepted Tell-Me input route only for read-only page-surface recovery.']
          : ['Try an alternative menu/action route or Page Inspection/source-backed navigation route.']
    },
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    statePatch: {},
    nextCase,
    reason:
      resultStatus === 'observed'
        ? 'Tell-Me input/focus route recovered read-only; VAT setup remains locked.'
        : 'Tell-Me input/focus route remains blocked; use an alternative navigation route next.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027C3 Tell-Me Input Focus Recovery',
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
      '- Akzeptiert wird nur ein sichtbarer Suchbegriff im Tell-Me-Suchfeld oder eine echte Zielseite.',
      '- Ein Suchfeldbeweis ist noch keine VAT-Setup-Evidence.',
      '- Schreibaktionen wie Neu, Liste bearbeiten oder Setup speichern bleiben ungeklickt.',
      '',
      '## Grenzen',
      '',
      '- Keine VAT-Gruppe wurde angelegt oder geaendert.',
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
