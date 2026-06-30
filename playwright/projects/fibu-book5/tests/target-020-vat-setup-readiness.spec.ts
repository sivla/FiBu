import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-020-VAT-SETUP-READINESS';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-020-vat-setup-readiness';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-020-result.json');

type Probe = {
  id: string;
  pageId: number;
  label: string;
  expectedText: RegExp;
  include: RegExp[];
  purpose: string;
  readinessSignals: RegExp[];
};

type ProbeResult = {
  id: string;
  pageId: number;
  label: string;
  status: 'observed' | 'blocked' | 'rejected';
  url: string;
  screenshot: string;
  textFile: string;
  textSignals: string[];
  readinessSignals: string[];
  visibleWarnings: string[];
  reason: string;
};

const probes: Probe[] = [
  {
    id: 'vat-business-posting-groups',
    pageId: 470,
    label: 'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    expectedText:
      /VAT Business Posting Groups|MwSt|USt|Gesch[aä]ftsbuchungsgruppen|Business Posting Group|Posting Group|Code|Description|Beschreibung/i,
    include: [
      /VAT Business|MwSt|USt|Gesch[aä]ft|Business Posting Group|Buchungsgruppe|Code|Description|Beschreibung|Domestic|EU|Export|Inland/i
    ],
    purpose:
      'VAT Business Posting Groups describe who the company sells to or buys from before VAT posting setup can calculate tax.',
    readinessSignals: [/DOMESTIC|INLAND|EU|EXPORT|AUSLAND|Code|Description|Beschreibung/i]
  },
  {
    id: 'vat-product-posting-groups',
    pageId: 471,
    label: 'MwSt.-Produktbuchungsgruppen / VAT Product Posting Groups',
    expectedText:
      /VAT Product Posting Groups|MwSt|USt|Produktbuchungsgruppen|Product Posting Group|Posting Group|Code|Description|Beschreibung/i,
    include: [
      /VAT Product|MwSt|USt|Produkt|Product Posting Group|Buchungsgruppe|VAT|19|7|0|Code|Description|Beschreibung|Standard|Reduced|Zero/i
    ],
    purpose:
      'VAT Product Posting Groups describe what is sold or bought before VAT posting setup can calculate a rate.',
    readinessSignals: [/19|STANDARD|REDUCED|ZERO|VAT|MwSt|USt|Code|Description|Beschreibung/i]
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    label: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    expectedText:
      /VAT Posting Setup|MwSt|USt|Buchungsmatrix|VAT Bus\. Posting Group|VAT Prod\. Posting Group|VAT %|Sales VAT Account|Purchase VAT Account|Code/i,
    include: [
      /VAT Posting Setup|MwSt|USt|Buchungsmatrix|VAT Bus|VAT Prod|VAT %|19|Sales VAT|Purchase VAT|Konto|Account|Calculation Type|Berechnungsart/i
    ],
    purpose:
      'VAT Posting Setup combines VAT business and product groups with VAT percent, calculation type and VAT accounts.',
    readinessSignals: [/VAT %|19|Sales VAT|Purchase VAT|Konto|Account|Calculation Type|Berechnungsart|MwSt|USt/i]
  }
];

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
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

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Möchten Sie buchen|Delete\?|Loeschen\?|Löschen\?|Preview Posting|Buchungsvorschau|Fertig stellen|Finish|OK\s*$/i.test(
    text
  );
}

function visibleWarnings(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu action may be visible but was not clicked.' : '',
    /Edit|Bearbeiten|Aenderungen|Änderungen/i.test(text) ? 'Edit/Bearbeiten action may be visible but was not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text)
      ? 'Posting/preview action text may be visible but was not clicked.'
      : ''
  ].filter(Boolean);
}

function isEvidenceNoise(line: string) {
  return /trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer|allowedEndpoints|allowedResources|clientId|authority:|parentPageOrigin|upn:|login\.microsoftonline\.com|graph\.microsoft\.com|officeapps\.live\.com|officeshell/i.test(
    line
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

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

function findSignals(lines: string[], patterns: RegExp[]) {
  return lines.filter((line) => patterns.some((pattern) => pattern.test(line))).slice(0, 24);
}

async function probePage(page: Page, probe: Probe, index: number): Promise<ProbeResult> {
  const url = buildPlaythruUrl(probe.pageId);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(text);
  const matchedExpectedText = probe.expectedText.test(text);
  const status = !safeContext || dangerousDialog ? 'blocked' : matchedExpectedText ? 'observed' : 'rejected';
  const compact = await compactPageText(page, {
    include: probe.include,
    maxLines: 100,
    maxLineLength: 180
  });
  const textLines = compact
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !isEvidenceNoise(line));
  const sanitizedCompact = textLines.join('\n');
  const screenshot = `target-020-${String(index).padStart(3, '0')}-${probe.id}.png`;
  const textFile = `${probe.id}.txt`;
  const readinessSignals = findSignals(textLines, probe.readinessSignals);

  await writeText(textFile, sanitizedCompact || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: probe.pageId,
    page: probe.label,
    step: probe.purpose,
    status: status === 'observed' ? 'universaarl-vat-readiness-context' : status,
    bookUse: status === 'observed' ? 'vat-setup-readiness-explanation' : 'do-not-use-as-proof',
    visibleLearning: textLines.slice(0, 14),
    importantUi: ['Read-only direct page route', 'VAT setup context only', 'No New/Edit/Post/Preview/Setup change clicked'],
    internallyProves:
      status === 'observed'
        ? `${probe.label} opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `The route did not yet produce a safe visible ${probe.label} proof.`,
    doesNotProve: [
      'No VAT setup value was changed.',
      'No German 19 percent VAT readiness is proven by page visibility.',
      'No master data, document preview, posting or VAT Entry exists.'
    ],
    finalScreenshotStatus: status === 'observed' ? 'candidate' : 'rejected'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    label: probe.label,
    status,
    url: sanitizeUrl(currentUrl),
    screenshot: `playwright/projects/fibu-book5/img/${screenshot}`,
    textFile: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${textFile}`,
    textSignals: textLines.slice(0, 50),
    readinessSignals,
    visibleWarnings: visibleWarnings(text),
    reason: !safeContext
      ? `Unsafe context: expected ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
      : dangerousDialog
        ? 'Dangerous dialog/action text detected; no action was confirmed.'
        : matchedExpectedText
          ? 'Expected VAT setup page text is visible.'
          : 'Expected VAT setup page text was not visible.'
  };
}

test('TARGET-020 VAT setup readiness read-only classification', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const results: ProbeResult[] = [];
  for (let index = 0; index < probes.length; index += 1) {
    results.push(await probePage(page, probes[index], index + 1));
  }

  const observed = results.filter((entry) => entry.status === 'observed');
  const blocked = results.filter((entry) => entry.status !== 'observed');
  const hasExplicit19Signal = results.some((entry) => entry.readinessSignals.some((line) => /\b19\b|19,00|19\.00/.test(line)));
  const readinessClassification = blocked.length
    ? 'blocked'
    : hasExplicit19Signal
      ? 'vat-context-observed-19-signal-needs-preview-proof'
      : 'vat-context-observed-needs-setup-fit-before-19-percent-claim';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-setup-readonly-readiness',
    resultStatus: blocked.length ? 'blocked' : 'observed',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    readinessClassification,
    sourceRefs: [
      'Microsoft Learn: Set up value-added tax - https://learn.microsoft.com/en-us/dynamics365/business-central/finance-setup-vat',
      'Microsoft Learn Training: Set up VAT in Dynamics 365 Business Central - https://learn.microsoft.com/en-us/training/modules/set-up-vat-dynamics-365-business-central/'
    ],
    proved: [
      `${observed.length}/${probes.length} VAT setup pages opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
      'VAT Business Posting Groups, VAT Product Posting Groups and VAT Posting Setup are separate setup contexts.',
      'No VAT setup value, master data, document draft, preview posting or posting was executed.',
      ...observed.map((entry) => `${entry.label} visible read-only.`)
    ],
    notProved: [
      'German 19 percent VAT is not proven.',
      'VAT account correctness is not proven.',
      'VAT business/product group assignment to customers, vendors, items or G/L accounts is not proven.',
      'No Preview Posting, VAT Entry or G/L Entry exists.',
      ...blocked.map((entry) => `${entry.label}: ${entry.reason}`)
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-020-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-020-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-020-result.json`,
      ...results.map((entry) => entry.screenshot)
    ],
    pages: results,
    blockedBy: blocked.map((entry) => `${entry.id}: ${entry.reason}`),
    warnings: Array.from(new Set(results.flatMap((entry) => entry.visibleWarnings))),
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      noSetupChange: true,
      readOnlyDirectPageRoutes: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-019B proved read-only Posting Groups and VAT Posting Setup page contexts, but no account correctness or VAT correctness.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'VAT setup readiness must be classified before dimensions, master data, document preview or any German VAT claim.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-021-DIMENSIONS-FOUNDATION',
          status: blocked.length ? 'ready-after-current' : 'ready-next',
          reason: 'Dimensions can proceed after VAT context is classified, because no VAT setup write is required yet.'
        },
        {
          caseId: 'TARGET-022-CORE-MASTERDATA-PLAN',
          status: 'needs-setup-first',
          reason: 'Master data still needs posting groups, VAT defaults and dimensions.'
        },
        {
          caseId: 'TARGET-023-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Templates depend on visible VAT/posting group defaults.'
        },
        {
          caseId: 'TARGET-024-FIRST-MASTERDATA-CANDIDATE',
          status: 'needs-setup-first',
          reason: 'First master data must wait for foundation readiness and a Smart Decision.'
        },
        {
          caseId: 'TARGET-025-VAT-SETUP-FIT-DECISION',
          status: hasExplicit19Signal ? 'ready-after-current' : 'needs-source-check-first',
          reason: hasExplicit19Signal
            ? 'A visible 19 signal still needs preview/VAT Entry proof before any claim.'
            : 'If domestic 19 percent VAT is required, source-backed setup values and accounts must be decided first.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: blocked.length ? 'TARGET-020B-VAT-SETUP-READINESS-ROUTE-FOLLOWUP' : 'TARGET-021-DIMENSIONS-FOUNDATION',
      whySelectedNextCaseIsBest: blocked.length
        ? 'At least one VAT setup page route did not produce safe proof.'
        : 'VAT setup context is classified; dimensions are the next non-posting foundation dependency before master data.',
      risksBeforeNextCase: [
        'Do not claim German 19 percent VAT until setup values, Preview Posting, VAT Entries and G/L Entries are proven.',
        'Do not change VAT setup without a separate setup-fit Smart Decision.',
        'Do not create master data yet.'
      ],
      requiredPreparation: [
        'Use TARGET-020 screenshots as VAT context, not as VAT correctness proof.',
        'Keep Microsoft Learn VAT setup source linked for later setup-fit decision.'
      ]
    },
    requiresReview: blocked.length > 0,
    safeToFinalizeState: false,
    statePatch: {},
    reason: blocked.length
      ? 'VAT setup readiness partially blocked; review required.'
      : 'VAT setup context observed and classified without setup changes.'
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-020 VAT Setup Readiness',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Sichtbare Seiten',
      '',
      ...observed.map((entry) => `- ${entry.label}`),
      '',
      '## Quellen',
      '',
      '- Microsoft Learn: Set up value-added tax',
      '- Microsoft Learn Training: Set up VAT in Dynamics 365 Business Central',
      '',
      '## Grenzen',
      '',
      '- Keine USt-/VAT-Setup-Aenderung.',
      '- Keine Stammdaten.',
      '- Kein Belegentwurf.',
      '- Keine Preview und keine Buchung.',
      '- Deutsche 19-Prozent-USt bleibt gesperrt bis Setupwerte, Preview, VAT Entries und Sachposten belegt sind.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(results.every((entry) => instancePathIsTarget(entry.url) && companyParamIsTarget(entry.url))).toBe(true);
  expect(blocked, blocked.map((entry) => `${entry.id}: ${entry.reason}`).join('\n')).toHaveLength(0);
});
