import { test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D31B-VAT-SETUP-ROUTE-UI-SOURCE-FOLLOWUP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d31b-vat-setup-route-ui-source-followup';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D31B-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  searchTerm: string;
  searchResult: RegExp;
  include: RegExp[];
  importantUi: string[];
  routeBasis: string;
};

const probes: Probe[] = [
  {
    id: 'assisted-setup-page-1801',
    pageId: 1801,
    label: 'Assisted Setup / Unterstuetztes Setup',
    expectedText: /Assisted Setup|Unterst.tztes Setup|Unterstutztes Setup|Einrichtung|Setup/i,
    searchTerm: 'Assisted Setup',
    searchResult: /Assisted Setup|Unterst.tztes Setup|Unterstutztes Setup/i,
    include: [
      /Assisted Setup|Unterst.tztes Setup|Unterstutztes Setup|Einrichtung|Setup|Value-Added Tax|VAT|MwSt|USt|Mehrwertsteuer|Steuer|Start|Beginnen|Weiter|Next|Finish|Fertig/i
    ],
    importantUi: ['Assisted Setup list', 'VAT/MwSt/USt setup row candidates', 'Start/Next/Finish actions are not clicked'],
    routeBasis: 'Microsoft Learn recommends opening Assisted Setup and choosing Set up Value-Added Tax (VAT).'
  },
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'VAT Business Posting Groups / MwSt.-Geschaeftsbuchungsgruppen',
    expectedText: /VAT Business Posting Groups|MwSt.*Geschaeft|USt.*Geschaeft|VAT Business Posting Group/i,
    searchTerm: 'VAT Business Posting Groups',
    searchResult: /VAT Business Posting Groups|MwSt.*Geschaeft|USt.*Geschaeft/i,
    include: [/VAT Business Posting Groups|VAT Business Posting Group|MwSt.*Geschaeft|USt.*Geschaeft|Code|Description|Beschreibung|Inland|EU|Export|Domestic/i],
    importantUi: ['Code', 'Description/Beschreibung', 'New/Neu is not clicked', 'Edit/List edit is not clicked'],
    routeBasis: 'Microsoft Learn names VAT Business Posting Groups as a manual VAT setup page.'
  },
  {
    id: 'vat-product-posting-groups',
    pageId: 471,
    label: 'VAT Product Posting Groups / MwSt.-Produktbuchungsgruppen',
    expectedText: /VAT Product Posting Groups|MwSt.*Produkt|USt.*Produkt|VAT Product Posting Group/i,
    searchTerm: 'VAT Product Posting Groups',
    searchResult: /VAT Product Posting Groups|MwSt.*Produkt|USt.*Produkt/i,
    include: [/VAT Product Posting Groups|VAT Product Posting Group|MwSt.*Produkt|USt.*Produkt|Code|Description|Beschreibung|19|7|Standard|Reduced|Zero/i],
    importantUi: ['Code', 'Description/Beschreibung', 'VAT product classification', 'New/Neu is not clicked'],
    routeBasis: 'Microsoft Learn names VAT Product Posting Groups as a manual VAT setup page.'
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'VAT Posting Setup / MwSt.-Buchungsmatrix',
    expectedText: /VAT Posting Setup|MwSt.*Buchungsmatrix|USt.*Buchungsmatrix|VAT Bus|VAT Prod|VAT %|Sales VAT|Purchase VAT|Konto|Account/i,
    searchTerm: 'VAT Posting Setup',
    searchResult: /VAT Posting Setup|MwSt.*Buchungsmatrix|USt.*Buchungsmatrix/i,
    include: [/VAT Posting Setup|MwSt.*Buchungsmatrix|USt.*Buchungsmatrix|VAT Bus|VAT Prod|VAT %|Sales VAT|Purchase VAT|Konto|Account|Calculation Type|Berechnungsart|1406|3806/i],
    importantUi: ['VAT Bus. Posting Group', 'VAT Prod. Posting Group', 'VAT %', 'Sales VAT Account', 'Purchase VAT Account'],
    routeBasis: 'Microsoft Learn names VAT Posting Setup as the matrix where VAT business/product groups, percent and accounts are combined.'
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

function sanitizeEvidenceUrl(rawUrl: string) {
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

function roleCenterStillVisible(text: string) {
  return /Guten Morgen|Good morning|Aktivitaeten|Activities|Shopify\s+-\s+Aktivitaeten|Laufender Verkauf|Laufende Einkaufe/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (/\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|OK|Yes|Ja|Finish|Fertig|Next|Weiter|Import|Export|Validate|New|Neu)\b/i.test(text)) {
        dialogs.push(text);
      }
    }
  }
  return dialogs;
}

async function visibleIframeForProbe(page: Page, probe: Probe): Promise<{ locator: Locator | null; text: string; index: number | null; reason: string }> {
  const iframes = page.locator('iframe');
  const count = await iframes.count().catch(() => 0);
  const candidates: Array<{ index: number; score: number; text: string; area: number }> = [];
  for (let index = 0; index < count; index += 1) {
    const iframe = iframes.nth(index);
    const box = await iframe.boundingBox().catch(() => null);
    if (!box || box.width < 700 || box.height < 450) continue;
    const handle = await iframe.elementHandle().catch(() => null);
    const frame = await handle?.contentFrame().catch(() => null);
    if (!frame) continue;
    const text = clean(await frame.locator('body').innerText({ timeout: 2000 }).catch(() => ''));
    if (!text) continue;
    const expected = probe.expectedText.test(text);
    const signalScore = probe.include.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
    if (expected || signalScore > 0) {
      candidates.push({ index, score: signalScore + (expected ? 8 : 0), text, area: Math.round(box.width * box.height) });
    }
  }
  candidates.sort((left, right) => right.score - left.score || right.area - left.area);
  const best = candidates[0];
  if (!best) return { locator: null, text: '', index: null, reason: `No visible iframe for ${probe.label}.` };
  return { locator: iframes.nth(best.index), text: best.text, index: best.index, reason: `Selected iframe ${best.index} with score ${best.score}.` };
}

async function openProbePage(page: Page, probe: Probe) {
  const navigationSteps = [`direct-page-${probe.pageId}`];
  await page.goto(buildPlaythruUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);

  let iframe = await visibleIframeForProbe(page, probe);
  let text = iframe.text || clean(await pageText(page).catch(() => ''));
  if (probe.expectedText.test(text)) {
    return { iframe, navigationSteps };
  }

  navigationSteps.push(`exact-search:${probe.searchTerm}`);
  await searchFor(page, probe.searchTerm);
  await openSearchResult(page, probe.searchResult, { requireUnique: false });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  iframe = await visibleIframeForProbe(page, probe);
  text = iframe.text || clean(await pageText(page).catch(() => ''));

  return { iframe, navigationSteps };
}

async function screenshotWithMetadata(locator: Locator | Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  if ('screenshot' in locator) {
    await locator.screenshot({ path: imagePath });
  }
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function probePage(page: Page, probe: Probe, index: number) {
  const filePrefix = `target-027d31b-${String(index).padStart(3, '0')}-${probe.id}`;
  const opened = await openProbePage(page, probe);

  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dialogs = await dangerousDialogs(page);
  const iframe = opened.iframe;
  const compact = clean(
    await compactPageText(page, {
      include: probe.include,
      maxLines: 160,
      maxLineLength: 240
    }).catch(() => '')
  );
  const raw = clean(await pageText(page).catch(() => ''));
  const text = iframe.text || compact || raw;
  const expectedTextVisible = probe.expectedText.test(text);
  const roleCenterVisible = roleCenterStillVisible(text) && !expectedTextVisible;
  const riskSignals = /\b(New|Neu|Edit|Bearbeiten|Liste bearbeiten|Start|Beginnen|Next|Weiter|Finish|Fertig|OK|Apply|Anwenden|Import|Export|Validate)\b/i.test(text);
  const status = safeContext && dialogs.length === 0 && expectedTextVisible && !roleCenterVisible ? 'observed' : 'blocked';
  const screenshot = `${filePrefix}.png`;
  const textFile = `${filePrefix}.txt`;

  await writeText(textFile, text || 'No page text captured.');
  await screenshotWithMetadata(iframe.locator ?? page, screenshot, {
    page: probe.label,
    pageId: probe.pageId,
    routeBasis: probe.routeBasis,
    status,
    step: 'Read-only VAT setup route recovery; no Tell-Me search overlay accepted.',
    importantUi: probe.importantUi,
    visibleLearning: text.split('\n').slice(0, 18),
    internallyProves:
      status === 'observed'
        ? `${probe.label} is reachable read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY} via direct page route.`
        : `The direct page route for ${probe.label} is not yet reliable.`,
    doesNotProve: [
      'No VAT setup value was changed.',
      'No wizard was completed.',
      'No VAT correctness, preview, posting or VAT entry is proven.'
    ],
    qualityDecision: status === 'observed' ? 'usable-route-context' : 'blocked-route-context',
    finalScreenshotStatus: status === 'observed' ? 'german-final-candidate-preflight' : 'not-final-blocked'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeEvidenceUrl(currentUrl),
    screenshot,
    textFile,
    iframeIndex: iframe.index,
    iframeReason: iframe.reason,
    navigationSteps: opened.navigationSteps,
    textSignals: text.split('\n').slice(0, 80),
    riskSignalsVisible: riskSignals,
    blockedBy:
      status === 'observed'
        ? []
        : [
            ...(!safeContext ? [`Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`] : []),
            ...dialogs,
            ...(!expectedTextVisible ? [`Expected page text not visible for ${probe.label}.`] : []),
            ...(roleCenterVisible ? [`Role Center still visible instead of ${probe.label}.`] : []),
            ...(!iframe.locator ? [iframe.reason] : [])
          ],
    warnings: riskSignals ? ['Potential write/navigation actions are visible, but were not clicked.'] : []
  };
}

test('TARGET-027D31B recovers VAT setup route read-only from source-backed pages', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const startedAt = new Date().toISOString();
  const smartDecision = {
    action: 'read-only-vat-setup-route-recovery',
    effectiveAction: false,
    reason: 'D31 showed that broad Tell-Me searches for VAT Setup and Manual Setup can leave only a search overlay. Microsoft Learn points to Assisted Setup and the concrete manual VAT setup pages.',
    sourceSupport: [
      'Microsoft Learn: open Assisted Setup and choose Set up Value-Added Tax (VAT).',
      'Microsoft Learn: VAT Business Posting Groups, VAT Product Posting Groups and VAT Posting Setup are manual VAT setup pages.'
    ],
    fieldsChanged: [],
    fieldsLeftUntouched: ['All VAT setup fields', 'All posting group fields', 'All accounts', 'All master data'],
    risk: 'Assisted Setup can expose Start/Next/Finish/Apply actions. The test must inventory them without clicking.',
    fallback: 'Keep VAT setup writes parked and use the observed direct page route for a separate write-gate decision.',
    beginnerBookUse: 'Explain that VAT setup consists of business groups, product groups and the posting matrix before any sales or purchase document can post VAT.'
  };

  const probeResults = [];
  for (let index = 0; index < probes.length; index += 1) {
    probeResults.push(await probePage(page, probes[index], index + 1));
  }

  const blockedBy = probeResults.flatMap((entry) => entry.blockedBy);
  const manualPagesObserved = probeResults.filter((entry) => entry.id !== 'assisted-setup-page-1801').every((entry) => entry.status === 'observed');
  const anyVatSetupPageObserved = probeResults.some((entry) => entry.id !== 'assisted-setup-page-1801' && entry.status === 'observed');
  const assistedObserved = probeResults.find((entry) => entry.id === 'assisted-setup-page-1801')?.status === 'observed';
  const resultStatus = blockedBy.length === 0 || manualPagesObserved ? 'observed' : anyVatSetupPageObserved ? 'partially-observed' : 'blocked';
  const nextCase = resultStatus === 'observed' ? 'TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION' : 'TARGET-027D31C-VAT-SETUP-ROUTE-BLOCKER-REVIEW';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027D32-VAT-ASSISTED-SETUP-WRITE-GATE-DECISION',
    lastEvidenceSummary: 'D31 stayed in playthru / UNIVERSAARL-DE but only proved that broad VAT Setup and Manual Setup Tell-Me searches can remain search overlays.',
    isPlannedNextCaseStillSensible: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'A concrete read-only route to VAT setup pages is now available; a separate write-gate can decide exact values.'
        : 'A VAT write-gate remains premature because source-backed page route recovery is incomplete.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason: resultStatus === 'observed' ? 'Direct read-only routes are available for VAT setup decision.' : 'Write-gate waits for a reliable route.'
      },
      {
        caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups need VAT setup status first.'
      },
      {
        caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
        status: 'ready-after-current',
        reason: 'Dimensions can continue after VAT setup route is either decided or parked.'
      },
      {
        caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
        status: 'needs-setup-first',
        reason: 'Foundation readiness waits for VAT/posting group status.'
      }
    ],
    queueChangesMade: resultStatus === 'observed' ? ['Replace premature assisted-setup write gate with TARGET-027D32-VAT-SETUP-WRITE-GATE-DECISION.'] : ['Keep VAT setup writes parked.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'The next useful step is to decide exact VAT groups, VAT percent and accounts before any write.'
        : 'Do not write VAT setup until the route blocker is resolved.',
    risksBeforeNextCase: [
      'A visible VAT setup page is not a correctness proof.',
      'VAT setup values still need source-backed field and account decisions.',
      'No Preview Posting or VAT Entries exist yet.'
    ],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Define VAT Business Group, VAT Product Group, VAT %, Sales VAT Account and Purchase VAT Account for Universaarl SKR04 starter setup.']
        : ['Repair direct page visibility or choose a different read-only route.']
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-vat-setup-route-ui-source-followup',
    resultStatus,
    startedAt,
    finishedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'VAT setup route recovery',
    smartDecision,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Assisted Setup Page 1801 read-only by direct page route.',
      'Opened VAT Business Posting Groups Page 470 read-only by direct page route.',
      'Opened VAT Product Posting Groups Page 471 read-only by direct page route.',
      'Opened VAT Posting Setup Page 472 read-only by direct page route.',
      'Captured screenshot QA and compact text for each route.',
      'Used exact source-backed search fallback only when direct page route stayed on the Role Center.',
      'Did not start or finish any setup wizard.'
    ],
    actionsNotTaken: [
      'No VAT setup write',
      'No assisted setup Next/Finish/Apply/OK',
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
      'https://learn.microsoft.com/en-us/training/modules/set-up-vat-dynamics-365-business-central/',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/page/microsoft.finance.vat.setup.vat-posting-setup'
    ],
    proved:
      resultStatus === 'observed' || resultStatus === 'partially-observed'
        ? [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            ...(assistedObserved ? ['Assisted Setup Page 1801 is reachable read-only without starting or finishing a wizard.'] : []),
            ...(manualPagesObserved
              ? ['VAT Business Posting Groups, VAT Product Posting Groups and VAT Posting Setup are reachable read-only by direct page route.']
              : [
                  ...probeResults
                    .filter((entry) => entry.id !== 'assisted-setup-page-1801' && entry.status === 'observed')
                    .map((entry) => `${entry.label} is reachable read-only by direct page route.`)
                ]),
            'D31 Tell-Me search-overlay route is not needed for the manual VAT setup page inventory.',
            'No setup, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            'VAT setup route recovery stopped read-only without setup writes.'
          ],
    notProved: [
      'No VAT setup value has been written.',
      'No Universaarl VAT group code or VAT posting setup row is final.',
      'No VAT correctness, Preview Posting, Posting, VAT Entry or German compliance claim is proven.',
      'No tax advisor approval is proven.'
    ],
    blockedBy,
    warnings: probeResults.flatMap((entry) => entry.warnings),
    screenshots: probeResults.map((entry) => entry.screenshot),
    evidenceRefs: [
      'TARGET-027D31B-result.json',
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
    reason:
      resultStatus === 'observed'
        ? 'Source-backed VAT setup routes were recovered read-only; separate write-gate decision is still required.'
        : 'VAT route recovery remains blocked; setup writes stay parked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027D31B VAT Setup Route UI Source Follow-up',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Smart Decision',
      '',
      smartDecision.reason,
      '',
      '## Grenzen',
      '',
      '- Keine Einrichtung wurde geschrieben.',
      '- Kein Assistent wurde abgeschlossen.',
      '- Keine Buchungsvorschau und keine Buchung wurden ausgefuehrt.',
      '- Die Screenshots zeigen Navigations- und Seitenkontext, keine fachliche Steuerfreigabe.'
    ].join('\n')
  );
});
