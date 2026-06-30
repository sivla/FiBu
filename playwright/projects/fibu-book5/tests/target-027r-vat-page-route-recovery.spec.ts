import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027R-VAT-PAGE-ROUTE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027r-vat-page-route-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027R-result.json');

type TargetPage = {
  id: string;
  pageId: number;
  label: string;
  directTitle: RegExp;
  bodySignals: RegExp[];
  searchTerms: string[];
  beginnerLearning: string;
};

type TargetResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked';
  routeUsed: string[];
  url: string;
  screenshot: string | null;
  screenshotMetadata: string | null;
  textFile: string;
  textSignals: string[];
  blockedBy: string[];
  warnings: string[];
};

const targetPages: TargetPage[] = [
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    directTitle: /MwSt\.-?Gesch[aä]ftsbuchungsgruppen|USt\.-?Gesch[aä]ftsbuchungsgruppen|VAT Business Posting Groups/i,
    bodySignals: [/Code/i, /Beschreibung|Description/i],
    searchTerms: ['MwSt.-Geschaeftsbuchungsgruppen', 'VAT Business Posting Groups'],
    beginnerLearning:
      'Diese Liste trennt die steuerliche Einordnung des Geschaeftspartners, zum Beispiel Inland, EU oder Export.'
  },
  {
    id: 'vat-product-posting-groups',
    pageId: 471,
    label: 'MwSt.-Produktbuchungsgruppen / VAT Product Posting Groups',
    directTitle: /MwSt\.-?Produktbuchungsgruppen|USt\.-?Produktbuchungsgruppen|VAT Product Posting Groups/i,
    bodySignals: [/Code/i, /Beschreibung|Description/i],
    searchTerms: ['MwSt.-Produktbuchungsgruppen', 'VAT Product Posting Groups'],
    beginnerLearning:
      'Diese Liste trennt die steuerliche Einordnung von Artikeln, Dienstleistungen oder Sachkonten.'
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    directTitle: /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup/i,
    bodySignals: [/MwSt|USt|VAT/i, /Gesch[aä]ftsbuchungsgruppe|Bus\. Posting Group/i, /Produktbuchungsgruppe|Prod\. Posting Group/i],
    searchTerms: ['MwSt.-Buchungsmatrix', 'VAT Posting Setup'],
    beginnerLearning:
      'Diese Matrix verbindet Geschaeftspartnergruppe und Produktgruppe mit Prozentsatz, Berechnungsart und Steuerkonten.'
  }
];

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
  return /Nach.*suchen|Tell me|Search for|Wie moechten Sie weiter verfahren|Was moechten Sie tun/i.test(text);
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

async function collectCompactText(page: Page, target: TargetPage) {
  const text = await compactPageText(page, {
    include: [target.directTitle, ...target.bodySignals, /Neu|Liste bearbeiten|Einrichtung|Weitere Optionen|Code|Beschreibung|Description/i],
    maxLines: 120,
    maxLineLength: 220
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
          .slice(0, 400);
      })
      .catch(() => []);
    lines.push(...frameLines);
  }

  return normalize([...new Set(lines)].join('\n'));
}

function targetVisible(text: string, target: TargetPage) {
  return target.directTitle.test(text) && target.bodySignals.every((signal) => signal.test(text));
}

async function visibleSearchCandidates(page: Page) {
  const entries: Array<{ frameUrl: string; text: string; role: string; area: number }> = [];
  for (const frame of page.frames()) {
    const frameEntries = await frame
      .evaluate(() => {
        const selectors = 'button,[role="button"],[role="menuitem"],[role="option"],a,div,span';
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
          .slice(0, 200);
      })
      .catch(() => []);
    for (const entry of frameEntries) {
      entries.push({ frameUrl: sanitizeUrl(frame.url()), text: entry.text, role: entry.role, area: entry.area });
    }
  }
  return entries.filter((entry) => /MwSt|USt|VAT|Buchungsgruppe|Buchungsmatrix/i.test(entry.text)).slice(0, 40);
}

async function clickExactVisibleText(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const candidates = [
      scope.getByRole('button', { name: pattern }),
      scope.getByRole('menuitem', { name: pattern }),
      scope.getByRole('option', { name: pattern }),
      scope.getByText(pattern)
    ];
    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < Math.min(count, 4); index += 1) {
        const item = locator.nth(index);
        if (!(await item.isVisible({ timeout: 400 }).catch(() => false))) continue;
        await item.click({ timeout: 3000 });
        await page.waitForTimeout(2500);
        return true;
      }
    }
  }
  return false;
}

async function recoverRoute(page: Page, target: TargetPage) {
  const routeUsed = [`direct-page-${target.pageId}`];
  await page.goto(buildPlaythruUrl(target.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await expect.poll(async () => await collectVisibleText(page), { timeout: 8000 }).toMatch(/Dynamics 365|Business Central|Universaarl|MwSt|USt|VAT|Guten Morgen/i);
  await page.waitForTimeout(1800);
  await page.keyboard.press('Escape').catch(() => undefined);

  let visibleText = await collectVisibleText(page);
  let compactText = await collectCompactText(page, target);
  if (targetVisible(visibleText, target) && !isSearchOverlay(visibleText)) {
    return { routeUsed, text: visibleText || compactText, visibleText, searchCandidates: [] as Awaited<ReturnType<typeof visibleSearchCandidates>> };
  }

  let searchCandidates: Awaited<ReturnType<typeof visibleSearchCandidates>> = [];
  for (const term of target.searchTerms) {
    routeUsed.push(`search:${term}`);
    await searchFor(page, term);
    searchCandidates = await visibleSearchCandidates(page);
    await writeJson(path.join(EVIDENCE_DIR, `${target.id}-${term.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-search-candidates.json`), {
      caseId: CASE_ID,
      term,
      candidates: searchCandidates
    });
    const clicked = await clickExactVisibleText(page, target.directTitle);
    if (!clicked) {
      await page.keyboard.press('Escape').catch(() => undefined);
      continue;
    }
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(1800);
    visibleText = await collectVisibleText(page);
    compactText = await collectCompactText(page, target);
    if (targetVisible(visibleText, target) && !isSearchOverlay(visibleText)) {
      return { routeUsed, text: visibleText || compactText, visibleText, searchCandidates };
    }
  }

  visibleText = await collectVisibleText(page);
  compactText = await collectCompactText(page, target);
  return { routeUsed, text: compactText || visibleText, visibleText, searchCandidates };
}

async function probeTargetPage(page: Page, target: TargetPage, index: number): Promise<TargetResult> {
  const route = await recoverRoute(page, target);
  const currentUrl = page.url();
  const text = route.text;
  const visibleText = route.visibleText;
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const titleVisible = target.directTitle.test(visibleText);
  const signalsVisible = target.bodySignals.every((signal) => signal.test(visibleText));
  const searchOverlay = isSearchOverlay(visibleText);
  const dangerousDialog = dangerousDialogSignal(visibleText);
  const status = safeContext && titleVisible && signalsVisible && !searchOverlay && !dangerousDialog ? 'observed' : 'blocked';

  const prefix = `target-027r-${String(index).padStart(3, '0')}-${target.id}`;
  const screenshot = `${prefix}.png`;
  const screenshotMetadata = `${prefix}.screenshot.json`;
  const textFile = `${prefix}.txt`;

  await writeText(textFile, text || 'No visible VAT page text captured.');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, screenshot), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, screenshotMetadata), {
    fileName: screenshot,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: target.label,
    routeUsed: route.routeUsed,
    status,
    screenshotQualityGate: {
      pageTitleVisible: titleVisible,
      requiredSignalsVisible: signalsVisible,
      searchOverlay,
      dangerousDialog,
      acceptedAsProof: status === 'observed'
    },
    whatAUserSees: target.beginnerLearning,
    internallyProves:
      status === 'observed'
        ? `${target.label} is visibly open read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `${target.label} route is still not safe enough for a VAT write gate.`,
    doesNotProve: [
      'No VAT setup row was created or changed.',
      'No German 19 percent VAT correctness.',
      'No VAT Entries.',
      'No document preview.',
      'No posting.'
    ],
    searchCandidates: route.searchCandidates.slice(0, 12)
  });

  return {
    id: target.id,
    pageId: target.pageId,
    label: target.label,
    status,
    routeUsed: route.routeUsed,
    url: sanitizeUrl(currentUrl),
    screenshot,
    screenshotMetadata,
    textFile,
    textSignals: text.split('\n').slice(0, 80),
    blockedBy:
      status === 'observed'
        ? []
        : [
            ...(!safeContext ? [`Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`] : []),
            ...(!titleVisible ? [`Page title not visible for ${target.label}.`] : []),
            ...(!signalsVisible ? [`Required page signals not visible for ${target.label}.`] : []),
            ...(searchOverlay ? [`Visible screenshot text still looks like search overlay for ${target.label}.`] : []),
            ...(dangerousDialog ? [`Dangerous dialog/action signal detected for ${target.label}; nothing was confirmed.`] : [])
          ],
    warnings: /Neu|New|Liste bearbeiten|Edit|Bearbeiten|Einrichtung/i.test(text)
      ? ['Write-capable actions may be visible, but were not clicked.']
      : []
  };
}

test('TARGET-027R recovers visible VAT page routes read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const pageResults: TargetResult[] = [];
  for (let index = 0; index < targetPages.length; index += 1) {
    pageResults.push(await probeTargetPage(page, targetPages[index], index + 1));
  }

  const blockedBy = pageResults.flatMap((entry) => entry.blockedBy);
  const observed = pageResults.filter((entry) => entry.status === 'observed');
  const resultStatus = observed.length === targetPages.length ? 'observed' : observed.length > 0 ? 'partially-observed' : 'blocked';
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-027B-VAT-POSTING-SETUP-WRITE-GATE-DECISION'
      : 'TARGET-027S-VAT-PAGE-ROUTE-SOURCE-AND-UI-FOLLOWUP';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027B-VAT-POSTING-SETUP-WRITE-GATE-DECISION',
    lastEvidenceSummary:
      'TARGET-027 blocked because Role Center/search overlay screenshots were not acceptable VAT page proof, although older TARGET-020 evidence suggested direct VAT pages can be visible.',
    isPlannedNextCaseStillSensible: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'All three VAT setup pages are visibly recovered read-only; a separate write-gate may now decide exact VAT setup values.'
        : 'Do not move to VAT setup write gate until every required VAT page route is visibly reliable.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-027B-VAT-POSTING-SETUP-WRITE-GATE-DECISION',
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason:
          resultStatus === 'observed'
            ? 'Visible VAT pages are available; write-gate can remain separate and source-backed.'
            : 'Needs full visible VAT page proof first.'
      },
      {
        caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups depend on VAT route and setup decision.'
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
      resultStatus === 'observed'
        ? ['Set TARGET-027B as the next source-backed VAT write-gate decision.']
        : ['Insert TARGET-027S for source/UI follow-up before any VAT write-gate decision.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'The next case can decide the exact VAT group rows and fields without mixing route recovery and setup writes.'
        : 'It keeps setup writes locked and narrows the remaining blocker to page route/source/UI diagnosis.',
    risksBeforeNextCase: [
      'Do not claim German 19 percent VAT correctness before VAT setup, Preview Posting, VAT Entries and G/L Entries.',
      'Do not treat Role Center, Tell-Me overlay or hidden text as page proof.'
    ],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Define VAT Business/Product Posting Group codes and VAT Posting Setup fields from sources before writing.']
        : ['Use TARGET-027R screenshots and search-candidate JSONs to choose a better route.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-page-route-recovery-readonly',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Tried direct page routes for VAT Business Posting Groups, VAT Product Posting Groups and VAT Posting Setup.',
      'Used German/English Tell-Me search only as fallback where direct page recognition was insufficient.',
      'Captured screenshot QA metadata for each target page.'
    ],
    actionsNotTaken: [
      'No VAT setup write',
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
      'https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/page/microsoft.finance.vat.setup.vat-posting-setup',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.finance.vat.setup.vat-posting-setup',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.finance.vat.setup.vat-business-posting-group'
    ],
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      `${observed.length}/${targetPages.length} VAT target pages passed visible screenshot QA.`,
      'No VAT setup, posting groups, master data, document draft, Preview Posting, Posting or API shortcut was executed.',
      ...observed.map((entry) => `${entry.label} visible read-only.`)
    ],
    notProved: [
      'No German VAT setup row is proven ready.',
      'No 19 percent VAT final correctness.',
      'No VAT Entries.',
      'No document preview or posting.',
      'No tax advisor approval.',
      ...pageResults.filter((entry) => entry.status !== 'observed').map((entry) => `${entry.label}: visible route still blocked.`)
    ],
    blockedBy,
    warnings: Array.from(new Set(pageResults.flatMap((entry) => entry.warnings))),
    screenshots: pageResults.map((entry) => entry.screenshot).filter(Boolean),
    evidenceRefs: [
      'TARGET-027R-result.json',
      'README.md',
      ...pageResults.flatMap((entry) => [entry.textFile, entry.screenshot, entry.screenshotMetadata].filter(Boolean) as string[])
    ],
    pageResults,
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
    requiresReview: resultStatus !== 'observed',
    statePatch: {},
    nextStepDecision,
    nextCase,
    reason:
      resultStatus === 'observed'
        ? 'Visible VAT page routes recovered read-only; next run can make a separate source-backed VAT write-gate decision.'
        : 'VAT route recovery remains incomplete; setup writes stay locked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027R VAT Page Route Recovery',
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
      '- Akzeptiert wird nur ein sichtbarer Screenshot der tatsaechlichen MwSt.-Zielseite.',
      '- Role Center, Tell-Me-Suche, ausgeblendete Texte oder alte Seitenreste gelten nicht als Proof.',
      '- Direktseitenroute wird bevorzugt; Suche ist nur ein dokumentierter Fallback.',
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
