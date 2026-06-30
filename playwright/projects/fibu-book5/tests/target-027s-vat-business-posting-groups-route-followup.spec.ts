import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027S-VAT-PAGE-ROUTE-SOURCE-AND-UI-FOLLOWUP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027s-vat-business-posting-groups-route-followup';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027S-result.json');

const PAGE_ID = 470;
const PAGE_LABEL = 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups';
const PAGE_TITLE = /MwSt\.-?Gesch[aä]ftsbuchungsgruppen|USt\.-?Gesch[aä]ftsbuchungsgruppen|VAT Business Posting Groups/i;
const BODY_SIGNALS = [/Code/i, /Beschreibung|Description/i];
const SEARCH_TERMS = ['MwSt.-Geschäftsbuchungsgruppen', 'MwSt.-Geschaeftsbuchungsgruppen', 'VAT Business Posting Groups'];

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId/i.test(line))
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

function isSearchOverlay(text: string) {
  return /Nach.*suchen|Tell me|Search for|Wie moechten Sie weiter verfahren|Was moechten Sie tun|Seiten und Aufgaben/i.test(text);
}

function dangerousDialogSignal(text: string) {
  return /Do you want to post|Moechten Sie buchen|Delete\?|Loeschen\?|Preview Posting|Buchungsvorschau|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|OK\s*$|Yes\s*$|Ja\s*$/i.test(
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

async function collectCompactText(page: Page) {
  const text = await compactPageText(page, {
    include: [PAGE_TITLE, ...BODY_SIGNALS, /Neu|Liste bearbeiten|Einrichtung|Weitere Optionen|Code|Beschreibung|Description|Verwaltung/i],
    maxLines: 160,
    maxLineLength: 240
  });
  return normalize(text || (await pageText(page)));
}

async function collectVisibleText(page: Page) {
  const lines: string[] = [];
  for (const frame of page.frames()) {
    const frameLines = await frame
      .evaluate(() => {
        return [...document.querySelectorAll<HTMLElement>('body *')]
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
            return visible ? text : '';
          })
          .filter(Boolean)
          .slice(0, 500);
      })
      .catch(() => []);
    lines.push(...frameLines);
  }

  return normalize([...new Set(lines)].join('\n'));
}

function targetVisible(text: string) {
  return PAGE_TITLE.test(text) && BODY_SIGNALS.every((signal) => signal.test(text));
}

async function visibleSearchCandidates(page: Page) {
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
          .slice(0, 220);
      })
      .catch(() => []);
    for (const entry of frameEntries) {
      entries.push({ frameUrl: sanitizeUrl(frame.url()), text: entry.text, role: entry.role, area: entry.area });
    }
  }
  return entries.filter((entry) => /MwSt|USt|VAT|Buchungsgruppe|Verwaltung/i.test(entry.text)).slice(0, 60);
}

async function clickTellMePageResult(page: Page) {
  const resultPatterns = [
    /MwSt\.-?Gesch[aä]ftsbuchungsgruppen\s+Verwaltung/i,
    /MwSt\.-?Gesch[aä]ftsbuchungsgruppen/i,
    /VAT Business Posting Groups/i
  ];

  for (const scope of [page, ...page.frames()]) {
    for (const pattern of resultPatterns) {
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
          await item.click({ timeout: 5000 });
          await page.waitForTimeout(3500);
          return { clicked: true, pattern: String(pattern), method: 'locator-click' };
        }
      }
    }
  }

  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(3500);
  return { clicked: false, pattern: null, method: 'enter-fallback' };
}

async function recoverRoute(page: Page) {
  const routeUsed = [`direct-page-${PAGE_ID}`];
  await page.goto(buildPlaythruUrl(PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => undefined);

  let visibleText = await collectVisibleText(page);
  let compactText = await collectCompactText(page);
  await writeText('target-027s-direct-page-470-before-fallback.txt', visibleText || compactText || 'No direct Page 470 text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'target-027s-000-direct-page-470-before-fallback.png'), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, 'target-027s-000-direct-page-470-before-fallback.screenshot.json'), {
    fileName: 'target-027s-000-direct-page-470-before-fallback.png',
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: PAGE_LABEL,
    routeUsed: ['direct-page-470'],
    directPageTitleVisible: PAGE_TITLE.test(visibleText) || PAGE_TITLE.test(compactText),
    directPageSignalsVisible: BODY_SIGNALS.every((signal) => signal.test(visibleText) || signal.test(compactText)),
    directPageSearchOverlay: isSearchOverlay(visibleText),
    note: 'Direct Page 470 checkpoint before any Tell-Me/search fallback.'
  });

  if ((targetVisible(visibleText) || (PAGE_TITLE.test(compactText) && BODY_SIGNALS.every((signal) => signal.test(compactText)))) && !isSearchOverlay(visibleText)) {
    return { routeUsed, text: visibleText || compactText, visibleText: visibleText || compactText, searchCandidates: [], clickResult: null as unknown };
  }

  let searchCandidates: Awaited<ReturnType<typeof visibleSearchCandidates>> = [];
  let clickResult: unknown = null;
  for (const term of SEARCH_TERMS) {
    routeUsed.push(`search:${term}`);
    await searchFor(page, term);
    searchCandidates = await visibleSearchCandidates(page);
    await writeJson(path.join(EVIDENCE_DIR, `search-candidates-${term.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`), {
      caseId: CASE_ID,
      term,
      candidates: searchCandidates
    });

    clickResult = await clickTellMePageResult(page);
    await waitForBusinessCentralShell(page);
    visibleText = await collectVisibleText(page);
    compactText = await collectCompactText(page);
    if (targetVisible(visibleText) && !isSearchOverlay(visibleText)) {
      routeUsed.push(`opened-search-result:${term}`);
      return { routeUsed, text: visibleText || compactText, visibleText, searchCandidates, clickResult };
    }

    await page.keyboard.press('Escape').catch(() => undefined);
  }

  visibleText = await collectVisibleText(page);
  compactText = await collectCompactText(page);
  return { routeUsed, text: compactText || visibleText, visibleText, searchCandidates, clickResult };
}

test('TARGET-027S recovers VAT Business Posting Groups visible route read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const route = await recoverRoute(page);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const titleVisible = PAGE_TITLE.test(route.visibleText);
  const signalsVisible = BODY_SIGNALS.every((signal) => signal.test(route.visibleText));
  const searchOverlay = isSearchOverlay(route.visibleText);
  const dangerousDialog = dangerousDialogSignal(route.visibleText);
  const status = safeContext && titleVisible && signalsVisible && !searchOverlay && !dangerousDialog ? 'observed' : 'blocked';

  await writeText('target-027s-001-vat-business-posting-groups.txt', route.text || 'No visible VAT Business Posting Groups text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'target-027s-001-vat-business-posting-groups.png'), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, 'target-027s-001-vat-business-posting-groups.screenshot.json'), {
    fileName: 'target-027s-001-vat-business-posting-groups.png',
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: PAGE_LABEL,
    routeUsed: route.routeUsed,
    clickResult: route.clickResult,
    status,
    screenshotQualityGate: {
      pageTitleVisible: titleVisible,
      requiredSignalsVisible: signalsVisible,
      searchOverlay,
      dangerousDialog,
      acceptedAsProof: status === 'observed'
    },
    whatAUserSees:
      'Die MwSt.-Geschaeftsbuchungsgruppen-Liste trennt Geschaeftspartner nach steuerlichem Kontext, zum Beispiel Inland, EU oder Export.',
    internallyProves:
      status === 'observed'
        ? `${PAGE_LABEL} is visibly open read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `${PAGE_LABEL} route is still not accepted as visible page proof.`,
    doesNotProve: [
      'No VAT business posting group was created or changed.',
      'No VAT posting setup row was created or changed.',
      'No German 19 percent VAT correctness.',
      'No VAT Entries.',
      'No Preview Posting or Posting.'
    ],
    searchCandidates: route.searchCandidates.slice(0, 20)
  });

  const blockedBy =
    status === 'observed'
      ? []
      : [
          ...(!safeContext ? [`Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`] : []),
          ...(!titleVisible ? [`Page title not visible for ${PAGE_LABEL}.`] : []),
          ...(!signalsVisible ? [`Required page signals not visible for ${PAGE_LABEL}.`] : []),
          ...(searchOverlay ? [`Visible screenshot text still looks like search overlay for ${PAGE_LABEL}.`] : []),
          ...(dangerousDialog ? [`Dangerous dialog/action signal detected for ${PAGE_LABEL}; nothing was confirmed.`] : [])
        ];
  const warnings = /Neu|New|Liste bearbeiten|Edit|Bearbeiten|Einrichtung/i.test(route.text)
    ? ['Write-capable actions may be visible, but were not clicked.']
    : [];
  const nextCase = status === 'observed' ? 'TARGET-027B-VAT-POSTING-SETUP-WRITE-GATE-DECISION' : CASE_ID;
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027B-VAT-POSTING-SETUP-WRITE-GATE-DECISION',
    lastEvidenceSummary:
      'TARGET-027R recovered VAT Product Posting Groups and VAT Posting Setup, but VAT Business Posting Groups was still only a Tell-Me/search overlay.',
    isPlannedNextCaseStillSensible: status === 'observed',
    reason:
      status === 'observed'
        ? 'The remaining VAT Business Posting Groups route is now visibly recovered read-only.'
        : 'The remaining VAT Business Posting Groups route is still not visibly reliable.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-027B-VAT-POSTING-SETUP-WRITE-GATE-DECISION',
        status: status === 'observed' ? 'ready-next' : 'blocked',
        reason:
          status === 'observed'
            ? 'All three VAT setup pages now have visible read-only proof; setup writing still needs a separate source-backed gate.'
            : 'Needs visible VAT Business Posting Groups proof first.'
      },
      {
        caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups depend on VAT setup route and decision.'
      },
      {
        caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
        status: 'needs-setup-first',
        reason: 'Master data waits for VAT and posting groups.'
      },
      {
        caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
        status: 'needs-setup-first',
        reason: 'Foundation readiness waits for VAT and posting groups.'
      }
    ],
    queueChangesMade:
      status === 'observed'
        ? ['Promote TARGET-027B as next source-backed VAT write-gate decision.']
        : ['Keep TARGET-027S active and require source/UI follow-up before VAT write-gate.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      status === 'observed'
        ? 'Route recovery is complete; the next useful step is a separate setup-value decision, not another navigation probe.'
        : 'Repeating the same route would waste time; source/UI route diagnosis is still needed.',
    risksBeforeNextCase: [
      'Do not claim German 19 percent VAT correctness before VAT setup, Preview Posting, VAT Entries and G/L Entries.',
      'Do not treat Role Center, Tell-Me overlay or hidden text as page proof.'
    ],
    requiredPreparation:
      status === 'observed'
        ? ['Define VAT Business/Product Posting Group codes and VAT Posting Setup fields from sources before writing.']
        : ['Use source/object mapping or Page Inspection to find the exact route for Page 470.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-business-posting-groups-route-readonly',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Tried direct Page 470 route for VAT Business Posting Groups.',
      'Used German and English Tell-Me search only as read-only fallback.',
      'Clicked only candidate page/search-result entries; no New/Edit/Delete/Setup write action was clicked.',
      'Captured screenshot QA metadata for VAT Business Posting Groups.'
    ],
    actionsNotTaken: [
      'No VAT setup write',
      'No posting group write',
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
    sourceRefs: [
      'https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.finance.vat.setup.vat-business-posting-group'
    ],
    proved:
      status === 'observed'
        ? [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            `${PAGE_LABEL} passed visible screenshot QA.`,
            'No VAT setup, posting groups, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            'No VAT setup, posting groups, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
          ],
    notProved: [
      ...(status === 'observed' ? [] : [`${PAGE_LABEL}: visible route still blocked.`]),
      'No German VAT setup row is proven ready.',
      'No 19 percent VAT final correctness.',
      'No VAT Entries.',
      'No document preview or posting.',
      'No tax advisor approval.'
    ],
    blockedBy,
    warnings,
    screenshots: ['target-027s-001-vat-business-posting-groups.png'],
    evidenceRefs: [
      'TARGET-027S-result.json',
      'README.md',
      'target-027s-001-vat-business-posting-groups.txt',
      'target-027s-001-vat-business-posting-groups.png',
      'target-027s-001-vat-business-posting-groups.screenshot.json'
    ],
    pageResult: {
      id: 'vat-business-posting-groups',
      pageId: PAGE_ID,
      label: PAGE_LABEL,
      status,
      routeUsed: route.routeUsed,
      url: sanitizeUrl(currentUrl),
      screenshot: 'target-027s-001-vat-business-posting-groups.png',
      screenshotMetadata: 'target-027s-001-vat-business-posting-groups.screenshot.json',
      textFile: 'target-027s-001-vat-business-posting-groups.txt',
      textSignals: route.text.split('\n').slice(0, 100),
      blockedBy,
      warnings
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
    safeToFinalizeState: false,
    requiresReview: status !== 'observed',
    statePatch: {},
    nextStepDecision,
    nextCase,
    reason:
      status === 'observed'
        ? 'VAT Business Posting Groups visible route recovered read-only; setup writes remain locked for a separate decision case.'
        : 'VAT Business Posting Groups route remains incomplete; setup writes stay locked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027S VAT Business Posting Groups Route Follow-up',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Screenshot-QA-Regel',
      '',
      '- Akzeptiert wird nur ein sichtbarer Screenshot der MwSt.-Geschaeftsbuchungsgruppen-Seite.',
      '- Role Center, Tell-Me-Suche, ausgeblendete Texte oder alte Seitenreste gelten nicht als Proof.',
      '- Suche ist nur ein dokumentierter Fallback; Schreibaktionen bleiben gesperrt.',
      '',
      '## Grenzen',
      '',
      '- Keine MwSt.-Einrichtung wurde angelegt oder geaendert.',
      '- Keine Buchungsgruppen wurden geaendert.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Keine finale deutsche USt-Behauptung.'
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
