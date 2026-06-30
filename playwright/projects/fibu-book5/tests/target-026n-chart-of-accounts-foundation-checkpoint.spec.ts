import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-026n-chart-of-accounts-foundation-checkpoint';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-026N-result.json');
const CHART_OF_ACCOUNTS_PAGE_ID = 16;
const GL_ACCOUNT_CARD_PAGE_ID = 17;

const starterAccounts = [
  { no: '1200', name: 'Bank Saarland', expectedType: 'Bilanz', expectedAccountType: 'Buchung', classification: 'blocked-bank-conflict' },
  { no: '1406', name: 'Abziehbare Vorsteuer 19 Prozent', expectedType: 'Bilanz', expectedAccountType: 'Buchung', classification: 'foundation-candidate' },
  { no: '1800', name: 'Bank Saarland', expectedType: 'Bilanz', expectedAccountType: 'Buchung', classification: 'foundation-candidate' },
  { no: '3300', name: 'Verbindlichkeiten aus Lieferungen und Leistungen', expectedType: 'Bilanz', expectedAccountType: 'Buchung', classification: 'foundation-candidate' },
  { no: '3806', name: 'Umsatzsteuer 19 Prozent', expectedType: 'Bilanz', expectedAccountType: 'Buchung', classification: 'foundation-candidate' },
  { no: '4400', name: 'Umsatzerloese Inland 19 Prozent', expectedType: 'GuV', expectedAccountType: 'Buchung', classification: 'foundation-candidate' },
  { no: '5400', name: 'Wareneingang / Materialaufwand', expectedType: 'GuV', expectedAccountType: 'Buchung', classification: 'foundation-candidate' }
];

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId/i.test(line))
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

function buildPlaythruFilteredUrl(pageId: number, filter: string) {
  const url = new URL(buildPlaythruUrl(pageId));
  url.searchParams.set('filter', filter);
  return url.toString();
}

function cardUrl(accountNo: string) {
  return buildPlaythruFilteredUrl(GL_ACCOUNT_CARD_PAGE_ID, `'G/L Account'.'No.' IS '${accountNo}'`);
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
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

async function roleCenterIsVisiblyOnScreen(page: Page) {
  const patterns = [/^Aktivitaeten$|^Aktivitäten$/i, /Laufender Verkauf/i, /Eingehende Belege/i, /Shopify/i];
  for (const scope of [page, ...page.frames()]) {
    for (const pattern of patterns) {
      if (await scope.getByText(pattern).first().isVisible({ timeout: 300 }).catch(() => false)) {
        return true;
      }
    }
  }
  return false;
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function compactChartText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV\/Bilanz|Income\/Balance|Kontoart|Account Type|Buchung|Posting/i,
        /1200|1406|1800|3300|3806|4400|5400|Bank Saarland|Vorsteuer|Umsatzsteuer|Umsatzerloese|Wareneingang|Verbindlichkeiten/i,
        /Bilanz|GuV|Balance Sheet|Income Statement/i,
        /Neu|New|Liste bearbeiten|Edit list|Bearbeiten|Edit|Loeschen|Delete|Buchen|Post|Buchungsvorschau|Preview Posting/i
      ],
      maxLines: 260,
      maxLineLength: 260
    })
  );
}

async function ensureChartOfAccountsPage(page: Page) {
  let text = clean(await compactChartText(page));
  const isChartText = (value: string) => /1200|1406|1800|3300|3806|4400|5400|Kontenplan:\s+Alle|Liste bearbeiten|Nr\.\s+Name/i.test(value);
  if (isChartText(text)) {
    return { navigatedVia: 'direct-url-page-16', text };
  }

  await page.goto(cardUrl('4400'), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.goto(buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1800);
  await page.keyboard.press('Escape').catch(() => undefined);
  text = clean(await compactChartText(page));
  if (isChartText(text)) {
    return { navigatedVia: 'card-17-filtered-4400-then-page-16-reopen', text };
  }

  const chartTargets = [
    page.getByRole('link', { name: /^Kontenplan$/ }).first(),
    page.getByRole('menuitem', { name: /Kontenplan/ }).first(),
    page.locator('a, button').filter({ hasText: /^Kontenplan$/ }).first(),
    page.getByText(/^Kontenplan$/, { exact: true }).first()
  ];
  for (const frame of page.frames()) {
    chartTargets.push(frame.getByRole('menuitem', { name: /Kontenplan/ }).first());
    chartTargets.push(frame.getByText(/^Kontenplan$/, { exact: true }).first());
  }

  for (const chartTarget of chartTargets) {
    if (!(await chartTarget.isVisible({ timeout: 2500 }).catch(() => false))) {
      continue;
    }
    await chartTarget.hover().catch(() => undefined);
    await page.waitForTimeout(250);
    const attempts = [
      async () => chartTarget.click({ timeout: 3000 }),
      async () => chartTarget.press('Enter', { timeout: 3000 }),
      async () => chartTarget.dblclick({ timeout: 3000 })
    ];
    for (const [index, attempt] of attempts.entries()) {
      await attempt().catch(() => undefined);
      await waitForBusinessCentralShell(page);
      await page.waitForTimeout(1800);
      await page.keyboard.press('Escape').catch(() => undefined);
      text = clean(await compactChartText(page));
      if (isChartText(text)) {
        return { navigatedVia: `role-center-link-kontenplan-attempt-${index + 1}`, text };
      }
    }
  }

  await page.mouse.click(604, 119);
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1800);
  await page.keyboard.press('Escape').catch(() => undefined);
  text = clean(await compactChartText(page));
  if (isChartText(text)) {
    return { navigatedVia: 'role-center-kontenplan-coordinate-from-screenshot-qa', text };
  }

  return { navigatedVia: 'direct-url-page-16-no-chart-link-found', text };
}

function normalizeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function classifyAccounts(text: string) {
  return starterAccounts.map((account) => {
    const accountBlockPattern = new RegExp(
      `${normalizeForRegex(account.no)}[\\s\\S]{0,220}${normalizeForRegex(account.name)}[\\s\\S]{0,220}${normalizeForRegex(
        account.expectedType
      )}[\\s\\S]{0,220}${normalizeForRegex(account.expectedAccountType)}`,
      'i'
    );
    const linePattern = new RegExp(`${normalizeForRegex(account.no)}\\s+${normalizeForRegex(account.name)}\\s+.*${account.expectedType}.*${account.expectedAccountType}`, 'i');
    const visible = new RegExp(`${normalizeForRegex(account.no)}|${normalizeForRegex(account.name)}`, 'i').test(text);
    const expectedStateVisible = accountBlockPattern.test(text) || linePattern.test(text);
    return {
      ...account,
      visible,
      expectedStateVisible,
      status: visible && expectedStateVisible ? 'observed' : 'blocked'
    };
  });
}

test('TARGET-026N reads the Universaarl chart foundation without edits', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await page.goto(buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1800);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.mouse.move(1600, 760).catch(() => undefined);
  await page.waitForTimeout(700);
  const chartNavigation = await ensureChartOfAccountsPage(page);

  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const dialogs = await dangerousDialogs(page);
  const rawText = clean(await pageText(page));
  const compactText = chartNavigation.text || (await compactChartText(page));
  const textForClassification = compactText || rawText;
  const accountFindings = classifyAccounts(textForClassification);
  const missingOrWrong = accountFindings.filter((entry) => entry.status !== 'observed');
  const bankConflict = accountFindings.some((entry) => entry.no === '1200' && entry.visible) && accountFindings.some((entry) => entry.no === '1800' && entry.visible);
  const roleCenterStillVisible = /Guten Morgen|Aktivitaeten|Laufender Verkauf|Eingehende Belege|Shopify/i.test(rawText) || (await roleCenterIsVisiblyOnScreen(page));
  const foundationRowsReady = missingOrWrong.length === 0;
  const resultStatus = safeContext && dialogs.length === 0 && foundationRowsReady && !roleCenterStillVisible ? 'observed' : 'blocked';
  const nextCase = resultStatus === 'observed' ? 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT' : 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-REVIEW';

  await writeText('target-026n-chart-context.txt', textForClassification || 'No compact chart text captured.');
  await writeJson(path.join(EVIDENCE_DIR, 'target-026n-account-findings.json'), {
    caseId: CASE_ID,
    accountFindings,
    bankConflict,
    interpretation: bankConflict
      ? '1200 and 1800 are both visible with Bank Saarland naming. This is classified as a blocker for bank/payment setup, but it does not block VAT Posting Groups preflight.'
      : 'No duplicate Bank Saarland conflict was visible in this checkpoint text.'
  });

  await screenshotWithMetadata(page, 'target-026n-010-chart-foundation-checkpoint.png', {
    page: 'Kontenplan / Chart of Accounts',
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    step: 'Read-only starter chart checkpoint',
    status: resultStatus,
    navigatedVia: chartNavigation.navigatedVia,
    importantUi: ['Nr.', 'Name', 'GuV/Bilanz', 'Kontoart', 'Buchung'],
    visibleLearning: [
      'The chart foundation is checked before VAT Posting Groups, posting groups and master data.',
      'GuV/Bilanz and Kontoart must be visible for each starter account.',
      'Visible 1200/1800 Bank Saarland conflict is a bank/payment blocker, not VAT setup proof.'
    ],
    internallyProves: 'Visible starter chart state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No VAT Posting Setup', 'No posting groups', 'No master data', 'No document draft', 'No Preview Posting', 'No Posting'],
    accountFindings,
    bankConflict,
    screenshotQaRule: 'The screenshot must show account number, name, GuV/Bilanz and Kontoart; a hidden row is not proof.'
  });

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
    lastEvidenceSummary: 'TARGET-026M proved 4400 and 5400 as GuV/Buchung; TARGET-026N checks the whole starter chart read-only.',
    isPlannedNextCaseStillSensible: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'The starter accounts are visible with expected GuV/Bilanz and Kontoart values. VAT preflight can inspect setup mappings next without writing yet.'
        : `Chart checkpoint blocked: ${
            roleCenterStillVisible ? 'Role Center still visible; screenshot truth gate rejected hidden/stale chart fragments.' : missingOrWrong.map((entry) => `${entry.no} ${entry.name}`).join(', ') || dialogs.join('; ') || 'unsafe context'
          }.`,
    lookaheadReviewed: [
      {
        caseId: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason: resultStatus === 'observed' ? 'Chart foundation is visible; VAT preflight remains read-only/decision-first.' : 'Chart foundation is not coherent yet.'
      },
      {
        caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups depend on VAT and account foundation.'
      },
      {
        caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
        status: 'needs-setup-first',
        reason: 'Master data waits for VAT/posting groups.'
      },
      {
        caseId: 'TARGET-030-FIRST-DOCUMENT-DRAFT-GATE',
        status: 'needs-setup-first',
        reason: 'Documents require master data, number series, VAT and posting groups.'
      }
    ],
    queueChangesMade: resultStatus === 'observed' ? ['Select TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT as next case.'] : ['Keep chart foundation review before VAT.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'VAT preflight is the next narrow setup-reading step after account foundation visibility.'
        : 'The chart must be reviewed before any VAT or posting group path.',
    risksBeforeNextCase: bankConflict
      ? ['Do not use 1200 Bank Saarland for bank/payment setup until a separate cleanup decision exists.']
      : [],
    requiredPreparation: resultStatus === 'observed' ? ['Keep VAT setup write locked until TARGET-027 explicitly unlocks it.'] : ['Review missing/wrong chart rows.']
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-chart-checkpoint',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(currentUrl),
    page: 'Kontenplan / Chart of Accounts',
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    navigatedVia: chartNavigation.navigatedVia,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      chartNavigation.navigatedVia === 'role-center-link-kontenplan'
        ? 'Used the visible Role Center Kontenplan link after direct page parameter did not land on the list.'
        : 'Opened Chart of Accounts Page 16 directly.',
      'Captured compact account text and screenshot.',
      'Classified starter account rows and the 1200/1800 bank conflict.'
    ],
    actionsNotTaken: ['No account edit', 'No VAT setup', 'No posting groups', 'No master data', 'No document draft', 'No Preview Posting', 'No Posting', 'No API shortcut'],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved:
      resultStatus === 'observed'
        ? [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            'Starter chart rows 1200, 1406, 1800, 3300, 3806, 4400 and 5400 are visible with expected GuV/Bilanz and Kontoart values.',
            '4400 and 5400 are visible as GuV/Buchung in the Chart of Accounts.',
            'No VAT setup, posting groups, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [`Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`, 'The chart checkpoint stopped before VAT/posting/master data.'],
    notProved: [
      'No complete SKR04 chart of accounts.',
      'No tax advisor approval.',
      'No VAT Posting Setup row.',
      'No posting groups.',
      'No master data.',
      'No document, Preview Posting or Posting.',
      'No German compliance final claim.',
      'Bank/payment setup is not ready while the 1200/1800 Bank Saarland conflict is open.'
    ],
    blockedBy:
      resultStatus === 'observed'
        ? []
        : [
            ...(roleCenterStillVisible ? ['Screenshot truth gate rejected this checkpoint because the visible page still looked like Role Center.'] : []),
            ...dialogs,
            ...missingOrWrong.map((entry) => `${entry.no} ${entry.name} not visible with expected ${entry.expectedType}/${entry.expectedAccountType}`)
          ],
    warnings: bankConflict
      ? ['1200 Bank Saarland and 1800 Bank Saarland are both visible; classify before bank/payment setup.']
      : [],
    screenshots: ['target-026n-010-chart-foundation-checkpoint.png'],
    evidenceRefs: [
      'TARGET-026N-result.json',
      'README.md',
      'target-026n-chart-context.txt',
      'target-026n-account-findings.json',
      'target-026n-010-chart-foundation-checkpoint.png',
      'target-026n-010-chart-foundation-checkpoint.screenshot.json'
    ],
    accountFindings,
    bankConflict,
    roleCenterStillVisible,
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    nextStepDecision,
    nextCase,
    reason:
      resultStatus === 'observed'
        ? 'Starter chart checkpoint observed; VAT Posting Groups preflight can run next.'
        : roleCenterStillVisible
          ? 'Starter chart checkpoint blocked because the visible screenshot/page still showed Role Center; compact text fragments alone are not sufficient evidence.'
          : 'Starter chart checkpoint blocked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-026N Chart of Accounts Foundation Checkpoint',
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
      '- Kein vollstaendiger SKR04-Kontenplan.',
      '- Keine Steuerberaterfreigabe.',
      '- Keine VAT Posting Setup Zeile.',
      '- Keine Posting Groups.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Der 1200/1800 Bank-Saarland-Konflikt bleibt fuer Bank und Payment gesperrt.'
    ].join('\n')
  );

  expect(safeContext).toBe(true);
  expect(dialogs).toEqual([]);
  expect(['observed', 'blocked']).toContain(resultStatus);
  if (resultStatus === 'blocked') {
    expect(result.blockedBy.length).toBeGreaterThan(0);
  }
});
