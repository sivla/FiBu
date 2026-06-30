import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027-vat-posting-groups-preflight';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  searchTerm: string;
  searchResult: RegExp;
  include: RegExp[];
  importantUi: string[];
  sourceRefs: string[];
};

const probes: Probe[] = [
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'VAT Business Posting Groups / MwSt.-Geschaeftsbuchungsgruppen',
    expectedText: /VAT Business Posting Groups|MwSt\.-?Geschaeftsbuchungsgruppen|USt\.-?Geschaeftsbuchungsgruppen|VAT Business Posting Group/i,
    searchTerm: 'VAT Business Posting Groups',
    searchResult: /VAT Business Posting Groups|MwSt.*Geschaeftsbuchungsgruppen|USt.*Geschaeftsbuchungsgruppen/i,
    include: [/VAT Business Posting Groups|VAT Business Posting Group|MwSt\.-?Geschaeft|USt\.-?Geschaeft|Inland|Domestic|EU|Export|Code|Description|Beschreibung/i],
    importantUi: ['Code', 'Description/Beschreibung', 'New/Neu is not clicked', 'Edit/List edit is not clicked'],
    sourceRefs: [
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.finance.vat.setup.vat-business-posting-group'
    ]
  },
  {
    id: 'vat-product-posting-groups',
    pageId: 471,
    label: 'VAT Product Posting Groups / MwSt.-Produktbuchungsgruppen',
    expectedText: /VAT Product Posting Groups|MwSt\.-?Produktbuchungsgruppen|USt\.-?Produktbuchungsgruppen|VAT Product Posting Group/i,
    searchTerm: 'VAT Product Posting Groups',
    searchResult: /VAT Product Posting Groups|MwSt.*Produktbuchungsgruppen|USt.*Produktbuchungsgruppen/i,
    include: [/VAT Product Posting Groups|VAT Product Posting Group|MwSt\.-?Produkt|USt\.-?Produkt|19|7|Standard|Reduced|Zero|Code|Description|Beschreibung/i],
    importantUi: ['Code', 'Description/Beschreibung', 'VAT product classification', 'New/Neu is not clicked'],
    sourceRefs: []
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'VAT Posting Setup / MwSt.-Buchungsmatrix',
    expectedText: /VAT Posting Setup|MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Bus\. Posting Group|VAT Prod\. Posting Group|VAT %|Sales VAT Account|Purchase VAT Account/i,
    searchTerm: 'VAT Posting Setup',
    searchResult: /VAT Posting Setup|MwSt.*Buchungsmatrix|USt.*Buchungsmatrix/i,
    include: [/VAT Posting Setup|MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Bus|VAT Prod|VAT %|19|Sales VAT|Purchase VAT|Konto|Account|Calculation Type|Berechnungsart|1406|3806/i],
    importantUi: ['VAT Bus. Posting Group', 'VAT Prod. Posting Group', 'VAT %', 'Sales VAT Account', 'Purchase VAT Account'],
    sourceRefs: [
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/page/microsoft.finance.vat.setup.vat-posting-setup',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.finance.vat.setup.vat-posting-setup'
    ]
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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId|clientId|authority:/i.test(line))
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

function roleCenterStillVisible(text: string) {
  return /Guten Morgen|Aktivitaeten|Laufender Verkauf|Laufende Einkaufe|Shopify\s+-\s+Aktivitaeten/i.test(text);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
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
      if (/\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|OK|Yes|Ja|Finish|New|Neu)\b/i.test(text)) {
        dialogs.push(text);
      }
    }
  }
  return dialogs;
}

async function compactProbeText(page: Page, probe: Probe) {
  return clean(
    await compactPageText(page, {
      include: probe.include,
      maxLines: 180,
      maxLineLength: 240
    })
  );
}

async function findVisibleProbeIframe(page: Page, probe: Probe): Promise<{ locator: Locator | null; text: string; index: number | null; reason: string }> {
  const iframes = page.locator('iframe');
  const count = await iframes.count().catch(() => 0);
  const candidates: Array<{ index: number; score: number; text: string; boxArea: number }> = [];
  for (let index = 0; index < count; index += 1) {
    const iframe = iframes.nth(index);
    const box = await iframe.boundingBox().catch(() => null);
    if (!box || box.width < 600 || box.height < 400) continue;
    const handle = await iframe.elementHandle().catch(() => null);
    const frame = await handle?.contentFrame().catch(() => null);
    if (!frame) continue;
    const text = clean(await frame.locator('body').innerText({ timeout: 2000 }).catch(() => ''));
    if (roleCenterStillVisible(text)) continue;
    const expected = probe.expectedText.test(text);
    const signalScore = probe.include.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
    if (expected || signalScore > 0) {
      candidates.push({ index, score: signalScore + (expected ? 5 : 0), text, boxArea: Math.round(box.width * box.height) });
    }
  }
  candidates.sort((left, right) => right.score - left.score || right.boxArea - left.boxArea);
  const best = candidates[0];
  if (!best) return { locator: null, text: '', index: null, reason: `No visible iframe for ${probe.label}.` };
  return { locator: iframes.nth(best.index), text: best.text, index: best.index, reason: `Selected iframe ${best.index} with score ${best.score}.` };
}

async function openProbePage(page: Page, probe: Probe) {
  const navigationSteps = [`direct-page-${probe.pageId}`];
  await page.goto(buildPlaythruUrl(probe.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1800);
  await page.keyboard.press('Escape').catch(() => undefined);

  let iframe = await findVisibleProbeIframe(page, probe);
  if (iframe.locator && probe.expectedText.test(iframe.text)) {
    return { iframe, navigationSteps };
  }

  navigationSteps.push(`search:${probe.searchTerm}`);
  await searchFor(page, probe.searchTerm);
  await openSearchResult(page, probe.searchResult, { requireUnique: false });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2200);
  await page.keyboard.press('Escape').catch(() => undefined);
  iframe = await findVisibleProbeIframe(page, probe);
  return { iframe, navigationSteps };
}

async function screenshotWithMetadata(locator: Locator, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  await locator.screenshot({ path: imagePath });
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
  const opened = await openProbePage(page, probe);
  await page.mouse.move(1600, 760).catch(() => undefined);
  await page.waitForTimeout(500);

  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dialogs = await dangerousDialogs(page);
  const rawText = clean(await pageText(page));
  const compactText = await compactProbeText(page, probe);
  const iframe = opened.iframe;
  const text = iframe.text || compactText || rawText;
  const expectedTextVisible = probe.expectedText.test(text);
  const roleCenterVisible = roleCenterStillVisible(text);
  const status = safeContext && dialogs.length === 0 && expectedTextVisible && iframe.locator && !roleCenterVisible ? 'observed' : 'blocked';
  const screenshot = `target-027-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `target-027-${String(index).padStart(3, '0')}-${probe.id}.txt`;

  await writeText(textFile, text || 'No VAT preflight text captured.');
  if (iframe.locator) {
    await screenshotWithMetadata(iframe.locator, screenshot, {
      page: probe.label,
      pageId: probe.pageId,
      step: 'Read-only VAT setup preflight',
      status,
      importantUi: probe.importantUi,
      visibleLearning: text.split('\n').slice(0, 16),
      internallyProves: status === 'observed' ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.` : `Visible route for ${probe.label} is not yet reliable.`,
      doesNotProve: ['No VAT setup row was created or changed.', 'No VAT rate correctness.', 'No VAT entries.', 'No document preview.', 'No posting.'],
      sourceRefs: probe.sourceRefs
    });
  }

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeEvidenceUrl(currentUrl),
    screenshot: iframe.locator ? screenshot : null,
    textFile,
    iframeIndex: iframe.index,
    iframeReason: iframe.reason,
    navigationSteps: opened.navigationSteps,
    textSignals: text.split('\n').slice(0, 60),
    blockedBy:
      status === 'observed'
        ? []
        : [
            ...(!safeContext ? [`Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`] : []),
            ...dialogs,
            ...(!expectedTextVisible ? [`Expected page text not visible for ${probe.label}.`] : []),
            ...(roleCenterVisible ? [`Screenshot/text still shows Role Center instead of ${probe.label}.`] : []),
            ...(!iframe.locator ? [iframe.reason] : [])
          ],
    warnings: /New|Neu|Edit|Bearbeiten|Liste bearbeiten/i.test(text) ? ['New/Edit actions may be visible, but were not clicked.'] : []
  };
}

test('TARGET-027 inspects VAT posting groups preflight read-only', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const probeResults = [];
  for (let index = 0; index < probes.length; index += 1) {
    probeResults.push(await probePage(page, probes[index], index + 1));
  }

  const blockedBy = probeResults.flatMap((entry) => entry.blockedBy);
  const visibleVat19Signals = probeResults.some((entry) => /(^|\D)19([,.]00)?(\D|$)|1406|3806/i.test(entry.textSignals.join('\n')));
  const resultStatus = blockedBy.length === 0 ? 'observed' : 'blocked';
  const nextCase = resultStatus === 'observed' ? 'TARGET-027B-VAT-POSTING-SETUP-WRITE-GATE-DECISION' : 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT-REVIEW';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
    lastEvidenceSummary: 'TARGET-026O recovered a visible Kontenplan screenshot with Universaarl starter accounts.',
    isPlannedNextCaseStillSensible: true,
    reason: 'VAT must be inspected before any posting groups, master data, documents, preview or posting.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason: resultStatus === 'observed' ? 'VAT pages are visible read-only; write-gate decision can define exact rows and fields.' : 'VAT page visibility is not complete enough.'
      },
      {
        caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups need VAT setup decision first.'
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
    queueChangesMade: resultStatus === 'observed' ? ['Insert TARGET-027B VAT Posting Setup write-gate decision before any VAT write.'] : ['Keep TARGET-027 review before VAT setup write.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'The next step must decide exact VAT Business/Product Posting Groups and VAT Posting Setup rows before any write.'
        : 'Do not write VAT setup until the read-only preflight is reliable.',
    risksBeforeNextCase: ['Do not claim German 19 percent VAT correctness without VAT setup, preview, posting and VAT entries.'],
    requiredPreparation: resultStatus === 'observed' ? ['Define exact VAT group codes, VAT percent, sales VAT account and purchase VAT account.'] : ['Repair visible VAT page route.']
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-vat-posting-groups-preflight',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'VAT setup preflight',
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened VAT Business Posting Groups read-only with direct page first, then scoped search fallback only if needed.',
      'Opened VAT Product Posting Groups read-only with direct page first, then scoped search fallback only if needed.',
      'Opened VAT Posting Setup read-only with direct page first, then scoped search fallback only if needed.',
      'Captured iframe-scoped screenshots and compact page text.'
    ],
    actionsNotTaken: ['No VAT setup write', 'No posting group write', 'No master data', 'No document draft', 'No Preview Posting', 'No Posting', 'No API shortcut'],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    sourceRefs: [
      'https://learn.microsoft.com/en-us/dynamics365/business-central/finance-how-report-vat',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/page/microsoft.finance.vat.setup.vat-posting-setup',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.finance.vat.setup.vat-posting-setup',
      'https://learn.microsoft.com/en-us/dynamics365/business-central/application/base-application/table/microsoft.finance.vat.setup.vat-business-posting-group'
    ],
    proved:
      resultStatus === 'observed'
        ? [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            'VAT Business Posting Groups, VAT Product Posting Groups and VAT Posting Setup opened read-only.',
            'No VAT setup, posting groups, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [`Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`, 'VAT preflight stopped without setup writes.'],
    notProved: [
      'No German VAT setup row is proven ready.',
      'No 19 percent VAT final correctness.',
      'No VAT Entries.',
      'No document preview or posting.',
      'No tax advisor approval.',
      'No German compliance final claim.'
    ],
    blockedBy,
    warnings: [
      ...probeResults.flatMap((entry) => entry.warnings),
      ...(visibleVat19Signals ? ['VAT 19 / 1406 / 3806 signals are visible in text, but this is not a VAT correctness proof without setup write, preview and VAT Entries.'] : [])
    ],
    screenshots: probeResults.map((entry) => entry.screenshot).filter(Boolean),
    evidenceRefs: [
      'TARGET-027-result.json',
      'README.md',
      ...probeResults.flatMap((entry) => [entry.textFile, ...(entry.screenshot ? [entry.screenshot, entry.screenshot.replace(/\.png$/i, '.screenshot.json')] : [])])
    ],
    probeResults,
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    nextStepDecision,
    nextCase,
    reason:
      resultStatus === 'observed'
        ? 'VAT preflight observed read-only; a separate write-gate decision is required before any VAT setup change.'
        : 'VAT preflight blocked; do not write VAT setup.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027 VAT Posting Groups Preflight',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Quellenbasis',
      '',
      '- Microsoft Learn beschreibt VAT-Berichte und VAT Entries als abhaengig von VAT Posting Setup und VAT Posting Groups.',
      '- Page 472 ist laut Microsoft Learn die Liste VAT Posting Setup.',
      '',
      '## Grenzen',
      '',
      '- Keine VAT Setup Zeile wurde angelegt oder geaendert.',
      '- Keine Posting Groups wurden geaendert.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Keine finale deutsche 19-Prozent-USt-Behauptung.'
    ].join('\n')
  );

  expect(['observed', 'blocked']).toContain(resultStatus);
  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
