import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-026B-CHART-OF-ACCOUNTS-VAT-ACCOUNT-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-026b-chart-of-accounts-vat-account-preflight';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-026B-result.json');
const CHART_OF_ACCOUNTS_PAGE_ID = 16;

type CandidateSignal = {
  line: string;
  reason: string[];
};

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

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice|Preview Posting|Buchungsvorschau|Create\?|Erstellen\?|Save\?|Speichern\?|Apply\?|Anwenden\?/i.test(
    text
  );
}

function visibleActionSignals(text: string) {
  return [
    /New|Neu/i.test(text) ? 'New/Neu visible but not clicked.' : '',
    /Edit|Bearbeiten|Aenderungen|Anderungen/i.test(text) ? 'Edit/Bearbeiten visible but not clicked.' : '',
    /Delete|Loeschen/i.test(text) ? 'Delete/Loeschen visible but not clicked.' : '',
    /Post|Buchen|Preview Posting|Buchungsvorschau/i.test(text) ? 'Posting/Preview text visible but not clicked.' : '',
    /Filter|Filtern/i.test(text) ? 'Filter UI visible; no persistent filter saved.' : ''
  ].filter(Boolean);
}

function extractCandidateSignals(text: string): CandidateSignal[] {
  const lines = text
    .split('\n')
    .map((line) => clean(line))
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .filter((line) => !/allowedEndpoints|trustedOrigin|clientId|authority|parentPageOrigin|aadTenantId/i.test(line));

  return lines
    .map((line) => {
      const reason = [
        /VAT|USt|Umsatzsteuer|MwSt|Tax|Steuer|Vorsteuer/i.test(line) ? 'vat-tax-text' : '',
        /\b(157|177|380|381|260|261|1406|1407)\d*\b/.test(line) ? 'common-vat-account-number-pattern' : '',
        /Sales VAT|Purchase VAT|Umsatzsteuerkonto|Vorsteuerkonto|Sales Tax|Purchase Tax/i.test(line)
          ? 'explicit-vat-account-label'
          : ''
      ].filter(Boolean);
      return { line, reason };
    })
    .filter((entry) => entry.reason.length > 0)
    .slice(0, 80);
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
  const imagePath = path.join(EVIDENCE_DIR, fileName);
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

async function moveAwayFromHeaderHover(page: Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.mouse.move(950, 520).catch(() => undefined);
  await page.waitForTimeout(500);
}

test('TARGET-026B Chart of Accounts VAT account preflight is read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const targetUrl = buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID);
  await page.goto(targetUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  const rawText = await pageText(page);
  const text = clean(rawText);
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dangerousDialog = containsDangerousDialog(text);
  const chartContextVisible = /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name|Balance|Saldo/i.test(text);
  const visibleActions = visibleActionSignals(text);

  const compact = await compactPageText(page, {
    include: [
      /Chart of Accounts|Kontenplan|G\/L Account|Sachkonto|No\.|Nr\.|Name|Balance|Saldo/i,
      /VAT|USt|Umsatzsteuer|MwSt|Tax|Steuer|Vorsteuer/i,
      /Sales VAT|Purchase VAT|Umsatzsteuerkonto|Vorsteuerkonto/i,
      /New|Neu|Edit|Bearbeiten|Delete|Loeschen|Filter|Filtern/i
    ],
    maxLines: 140,
    maxLineLength: 220
  });
  const candidateSignals = extractCandidateSignals(compact || text);
  const resultStatus = !safeContext || dangerousDialog ? 'blocked' : chartContextVisible ? 'observed' : 'blocked';

  await writeText('chart-of-accounts-page-text.txt', compact || text.slice(0, 7000));
  await writeJson(path.join(EVIDENCE_DIR, 'vat-account-candidate-signals.json'), {
    caseId: CASE_ID,
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    candidateSignals,
    interpretation:
      candidateSignals.length > 0
        ? 'Candidate signals are read-only hints only. They do not prove account correctness or VAT setup readiness.'
        : 'No VAT account candidates were visible in the captured read-only text. A later setup/account-fit case must decide whether to create or map accounts.'
  });

  await screenshotWithMetadata(page, 'target-026b-010-chart-of-accounts-readonly.png', {
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    page: 'Chart of Accounts / Kontenplan',
    step: 'Read-only account preflight before VAT setup write',
    status: resultStatus === 'observed' ? 'universaarl-readonly-preflight' : 'blocked',
    visibleLearning: [
      'The Chart of Accounts is the account basis before VAT Posting Setup.',
      'Visible VAT/tax account-like lines are only candidates until a controlled setup fit proves them.',
      'New/Edit/Delete/Post/Preview actions were not clicked.'
    ],
    importantUi: [
      'Direct page route',
      'Account list context',
      'Filter/list affordances',
      'No setup write'
    ],
    internallyProves:
      resultStatus === 'observed'
        ? `Chart of Accounts opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : 'Chart of Accounts preflight did not reach safe observed state.',
    doesNotProve: [
      'No G/L account was created or edited.',
      'No VAT setup was changed.',
      'No Sales VAT Account or Purchase VAT Account assignment is proven.',
      'No 19 percent VAT claim, VAT Entry, G/L Entry, Preview Posting or posting exists.'
    ],
    candidateSignalCount: candidateSignals.length,
    finalScreenshotStatus: resultStatus === 'observed' ? 'candidate' : 'rejected'
  });

  await moveAwayFromHeaderHover(page);
  await screenshotWithMetadata(page, 'target-026b-020-chart-of-accounts-context-after-hover-clear.png', {
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    page: 'Chart of Accounts / Kontenplan',
    step: 'Second screenshot after moving focus away from the column header hover tooltip',
    status: resultStatus === 'observed' ? 'universaarl-readonly-preflight' : 'blocked',
    visibleLearning: [
      'A first BC screenshot can contain helpful but distracting hover or tour overlays.',
      'A second context screenshot after moving focus helps distinguish page truth from hover-state truth.',
      'The account list still shows no visible G/L account rows in this view.'
    ],
    importantUi: [
      'Clean page context after hover clear attempt',
      'Empty Chart of Accounts grid',
      'FactBox still visible as context, not account proof'
    ],
    internallyProves:
      resultStatus === 'observed'
        ? 'The Chart of Accounts list remains visible after clearing the hover focus.'
        : 'The second screenshot also did not reach safe observed state.',
    doesNotProve: [
      'No account candidate is proven by an empty grid screenshot.',
      'No VAT setup or account mapping is proven.',
      'No setup write, Preview Posting or posting occurred.'
    ],
    candidateSignalCount: candidateSignals.length,
    finalScreenshotStatus: resultStatus === 'observed' ? 'candidate' : 'rejected'
  });

  const nextStepDecisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-026B-CHART-OF-ACCOUNTS-VAT-ACCOUNT-PREFLIGHT',
    lastEvidenceSummary:
      'TARGET-026 source-backed VAT setup decision said VAT Posting Setup needs account candidates before any setup write.',
    isPlannedNextCaseStillSensible: true,
    reason:
      'Chart of Accounts read-only preflight is the smallest safe dependency check before VAT setup or first master data creation.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-026C-VAT-GROUPS-CONTROLLED-SETUP-FIT',
        status: candidateSignals.length > 0 ? 'ready-after-current' : 'needs-setup-first',
        reason:
          candidateSignals.length > 0
            ? 'VAT group setup can be planned only after candidates are reviewed.'
            : 'No visible VAT account candidates are proven; account setup/route decision must come first.'
      },
      {
        caseId: 'TARGET-026D-CHART-OF-ACCOUNTS-SETUP-FIT-DECISION',
        status: candidateSignals.length > 0 ? 'ready-after-current' : 'ready-next',
        reason:
          candidateSignals.length > 0
            ? 'May still be needed to review candidate quality before write.'
            : 'Needed to decide whether Universaarl should create German VAT/control accounts from scratch.'
      },
      {
        caseId: 'TARGET-027-DEFAULT-DIMENSIONS-STRATEGY',
        status: 'ready-after-current',
        reason: 'Can proceed after VAT/account dependency is classified; global dimensions remain parked.'
      },
      {
        caseId: 'TARGET-028-FIRST-CUSTOMER-CONTROLLED-CREATE',
        status: 'needs-setup-first',
        reason: 'First customer needs number series, posting group and VAT/default-dimension decisions.'
      },
      {
        caseId: 'TARGET-029-FIRST-VENDOR-AND-ITEM-CONTROLLED-CREATE',
        status: 'needs-setup-first',
        reason: 'Vendor/item creation needs posting/VAT setup and card/template gates.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase:
      candidateSignals.length > 0
        ? 'TARGET-026C-VAT-GROUPS-CONTROLLED-SETUP-FIT'
        : 'TARGET-026D-CHART-OF-ACCOUNTS-SETUP-FIT-DECISION',
    whySelectedNextCaseIsBest:
      candidateSignals.length > 0
        ? 'Visible account candidates allow a narrow VAT setup-fit decision without creating accounts first.'
        : 'A blank/insufficient Chart of Accounts means account setup route must be decided before VAT groups or master data.',
    risksBeforeNextCase: [
      'Do not edit Chart of Accounts from read-only candidate screenshots.',
      'Do not claim German 19 percent VAT until VAT setup, Preview Posting, VAT Entries and G/L Entries are proven.',
      'Do not create customers/vendors/items until posting/VAT decisions are clear.'
    ],
    requiredPreparation: [
      'Review VAT account candidate signals.',
      'If candidates are insufficient, create a source-backed Chart of Accounts setup-fit decision case.'
    ]
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-smoke',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    page: 'Chart of Accounts / Kontenplan',
    url: sanitizeUrl(currentUrl),
    proved:
      resultStatus === 'observed'
        ? [
            `Chart of Accounts opened read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
            `${candidateSignals.length} VAT/tax/account-like candidate text signals captured for review.`,
            'No G/L account, VAT setup, master data, draft, Preview Posting or posting was changed.'
          ]
        : [],
    notProved: [
      'No G/L account was created or edited.',
      'No VAT Business Posting Group, VAT Product Posting Group or VAT Posting Setup was changed.',
      'No Sales VAT Account or Purchase VAT Account assignment is proven.',
      'No German 19 percent VAT claim is proven.',
      'No Preview Posting, VAT Entry, G/L Entry or posting exists.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-026B-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/chart-of-accounts-page-text.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/vat-account-candidate-signals.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-026b-010-chart-of-accounts-readonly.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-026b-010-chart-of-accounts-readonly.screenshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-026b-020-chart-of-accounts-context-after-hover-clear.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-026b-020-chart-of-accounts-context-after-hover-clear.screenshot.json`
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-026B-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/chart-of-accounts-page-text.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/vat-account-candidate-signals.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-026b-010-chart-of-accounts-readonly.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-026b-020-chart-of-accounts-context-after-hover-clear.png`
    ],
    warnings: [
      ...(!safeContext ? ['wrong-instance-or-company-context'] : []),
      ...(dangerousDialog ? ['dangerous-dialog-visible'] : []),
      ...(candidateSignals.length === 0 ? ['no-visible-vat-account-candidates-in-captured-text'] : []),
      'First screenshot may include BC hover/tour overlays; second screenshot clears hover focus where possible.',
      ...visibleActions
    ],
    blockedBy:
      resultStatus === 'observed'
        ? []
        : [
            ...(!safeContext ? ['wrong-instance-or-company-context'] : []),
            ...(dangerousDialog ? ['dangerous-dialog-visible'] : []),
            ...(!chartContextVisible ? ['chart-of-accounts-context-not-visible'] : [])
          ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true
    },
    candidateSignals,
    nextStepDecisionCard,
    requiresReview: candidateSignals.length > 0,
    safeToFinalizeState: false,
    statePatch: {},
    reason:
      resultStatus === 'observed'
        ? 'Read-only Chart of Accounts preflight completed; candidate signals need review before setup write.'
        : 'Chart of Accounts preflight did not reach safe observed state.',
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:chart-of-accounts-vat-account-preflight',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-026B-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      `# ${CASE_ID}`,
      '',
      `Status: ${resultStatus}`,
      '',
      'Read-only Kontenplan-/Chart-of-Accounts-Preflight vor USt-/VAT-Setup.',
      '',
      'Grenzen:',
      '',
      '- Keine Sachkonten angelegt oder geaendert.',
      '- Keine VAT-/USt-Einrichtung geaendert.',
      '- Keine Buchung, keine Buchungsvorschau, kein Beleg, kein API-Shortcut.',
      '- Kandidatensignale sind nur Hinweise, keine Kontenplan- oder Steuer-Finalclaims.',
      ''
    ].join('\n'),
    'utf8'
  );
  await writeJson(RESULT_PATH, result);

  expect(safeContext, 'BC must stay in playthru / UNIVERSAARL-DE').toBe(true);
  expect(dangerousDialog, 'No risky confirmation dialog may be visible').toBe(false);
  expect(chartContextVisible, 'Chart of Accounts / Kontenplan context should be visible').toBe(true);
});
