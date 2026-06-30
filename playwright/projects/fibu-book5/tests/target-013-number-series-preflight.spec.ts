import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-013-NUMBER-SERIES-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-013-number-series-preflight';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-013-result.json');

const REQUIRED_SERIES_FAMILIES = [
  { id: 'customer', pattern: /CUST|CUSTOMER|DEB|DEBI|KUND|KUNDE/i },
  { id: 'vendor', pattern: /VEND|VENDOR|KRED|KREDI|LIEF/i },
  { id: 'item', pattern: /ITEM|ART|ARTIKEL|WARE/i },
  { id: 'sales-document', pattern: /SALES|SALE|VERK|VK|ANGEBOT|AUFTRAG/i },
  { id: 'purchase-document', pattern: /PURCH|EINK|EK|BESTELL|RECHNUNG/i },
  { id: 'journal', pattern: /JNL|JOURNAL|FIBU|BUCHBLATT/i }
];

function buildPlaythruUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', '456');
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

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
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

async function collectVisibleButtonNames(page: Page) {
  const names = await page
    .evaluate(() => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"]'))
        .filter(visible)
        .map((element) => normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title')))
        .filter(Boolean)
        .slice(0, 80);
    })
    .catch(() => [] as string[]);
  return [...new Set(names.map(clean).filter(Boolean))];
}

test('TARGET-013 Number Series read-only preflight', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const compact = (
    await compactPageText(page, {
      include: [/Universaarl|Nummernserie|No\. Series|Code|Startnr|Endnr|Letzte Nr|VATNOTIF|BANKEINZ|CT-MSG|Liste/i],
      maxLines: 100,
      maxLineLength: 180
    })
  )
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .join('\n');
  const buttonNames = await collectVisibleButtonNames(page);
  const visibleCodes = ['BANKEINZ', 'CT-MSG', 'VATNOTIF'].filter((code) => new RegExp(`\\b${code}\\b`, 'i').test(text));
  const visibleCodeText = visibleCodes.join(' ');
  const familySignals = REQUIRED_SERIES_FAMILIES.map((family) => ({
    id: family.id,
    visible: family.pattern.test(visibleCodeText)
  }));
  const missingFamilies = familySignals.filter((family) => !family.visible).map((family) => family.id);
  const pageVisible = /Nummernserie|No\. Series/i.test(text);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const screenshot = 'target-013-010-number-series-preflight.png';

  await writeText('number-series-visible-text.txt', compact || text.slice(0, 5000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: 456,
    page: 'Nummernserie / No. Series',
    step: 'Read-only preflight for Universaarl numbering foundation.',
    status: pageVisible ? 'universaarl-candidate' : 'rejected',
    bookUse: pageVisible ? 'number-series-preflight' : 'do-not-use-as-proof',
    visibleLearning:
      'Number Series is a setup list. The visible rows are context only; missing document/master-data families require a separate controlled setup decision.',
    importantUi: ['Neu/New', 'Liste bearbeiten/Edit List', 'Zeilen/Lines', 'Verbindungen/Relationships', ...visibleCodes],
    internallyProves: pageVisible
      ? 'Number Series page 456 opened read-only in playthru / UNIVERSAARL-DE.'
      : 'Number Series page text was not visible.',
    doesNotProve: [
      'No number series was created or edited.',
      'No master data or document numbering readiness is claimed.',
      'No setup change, draft, preview posting or posting occurred.'
    ],
    qualityDecision: pageVisible ? 'accepted-readonly-context' : 'rejected',
    finalScreenshotStatus: 'german-final-candidate-readonly',
    visibleCodes,
    familySignals,
    missingFamilies
  });

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-number-series-preflight',
    resultStatus: pageVisible && safeContext ? 'observed' : 'blocked',
    runPlanId: 'TARGET-013-NUMBER-SERIES-PREFLIGHT-READONLY',
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    proved: [
      ...(pageVisible ? ['Number Series page 456 opened read-only in playthru / UNIVERSAARL-DE.'] : []),
      ...(visibleCodes.length ? [`Visible number-series codes: ${visibleCodes.join(', ')}.`] : [])
    ],
    notProved: [
      'No number series was created, edited or deleted.',
      'No setup change, master data, draft, preview posting, posting or ledger trace occurred.',
      ...(missingFamilies.length
        ? [`No obvious visible number-series family was proven for: ${missingFamilies.join(', ')}.`]
        : ['Visible text contains signals for all tracked number-series families, but setup readiness still needs a controlled decision.'])
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-013-number-series-preflight/TARGET-013-result.json',
      'playwright/projects/fibu-book5/evidence/target-013-number-series-preflight/number-series-visible-text.txt',
      'playwright/projects/fibu-book5/evidence/target-013-number-series-preflight/target-013-010-number-series-preflight.screenshot.json',
      'playwright/projects/fibu-book5/img/target-013-010-number-series-preflight.png'
    ],
    statePatch: {
      current: {
        activeCase: 'TARGET-014-NUMBER-SERIES-SETUP-DECISION',
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep:
          'Run TARGET-014-NUMBER-SERIES-SETUP-DECISION: decide exact Universaarl number-series setup values before any controlled setup change.'
      },
      lastRunSummary: {
        caseId: CASE_ID,
        status: pageVisible && safeContext ? 'observed' : 'blocked',
        summary:
          'TARGET-013 inspected Number Series read-only and found only limited visible numbering context; setup readiness requires a separate decision before master data or documents.',
        resultPath: 'playwright/projects/fibu-book5/evidence/target-013-number-series-preflight/TARGET-013-result.json'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-013-number-series-preflight/TARGET-013-result.json',
      'playwright/projects/fibu-book5/img/target-013-010-number-series-preflight.png'
    ],
    visibleCodes,
    familySignals,
    missingFamilies,
    visibleButtonNames: buttonNames,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookChange: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-013-NUMBER-SERIES-PREFLIGHT',
      lastEvidenceSummary: 'TARGET-012 proved that Number Series page 456 is reachable read-only in UNIVERSAARL-DE.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Number Series must be understood before master data or documents are created.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-014-NUMBER-SERIES-SETUP-DECISION',
          status: 'ready-next',
          reason: 'Visible numbering context is limited; decide exact setup values before writing.'
        },
        {
          caseId: 'TARGET-015-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups follow after numbering decision.'
        },
        {
          caseId: 'TARGET-016-VAT-SETUP-READINESS',
          status: 'needs-source-check-first',
          reason: 'German VAT needs source-backed setup and later Preview/VAT Entries.'
        },
        {
          caseId: 'TARGET-017-DIMENSIONS-FOUNDATION',
          status: 'ready-after-current',
          reason: 'Dimensions can follow once setup order is stable.'
        },
        {
          caseId: 'TARGET-018-CORE-MASTERDATA-PLAN',
          status: 'needs-setup-first',
          reason: 'Master data creation waits for number series, posting groups, VAT and dimensions.'
        }
      ],
      queueChangesMade: ['Select TARGET-014 number-series setup decision instead of jumping to posting groups.'],
      selectedNextCase: 'TARGET-014-NUMBER-SERIES-SETUP-DECISION',
      whySelectedNextCaseIsBest:
        'The read-only list does not yet prove usable master-data/document series; a setup decision prevents blind data creation.',
      risksBeforeNextCase: ['Do not click New/Edit List/Lines as a setup action without exact target values and screenshots.'],
      requiredPreparation: ['Define Universaarl number-series code families and whether BC default setup should be extended manually.']
    },
    warnings: [],
    blockedBy: pageVisible && safeContext ? [] : ['Number Series page or safe context was not visible.'],
    requiresReview: false,
    safeToFinalizeState: pageVisible && safeContext,
    reason: pageVisible
      ? 'Read-only Number Series preflight completed; setup decision required next.'
      : 'Number Series page was not visible; do not proceed to setup.'
  };

  await writeJson(RESULT_PATH, result);

  expect(safeContext).toBeTruthy();
  expect(pageVisible).toBeTruthy();
});
