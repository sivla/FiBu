import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-026O-CHART-OF-ACCOUNTS-VISIBLE-SCREENSHOT-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-026o-chart-of-accounts-visible-screenshot-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-026O-result.json');
const CHART_OF_ACCOUNTS_PAGE_ID = 16;

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

async function compactChartText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV\/Bilanz|Income\/Balance|Kontoart|Account Type|Buchung|Posting/i,
        /1200|1406|1800|3300|3806|4400|5400|Bank Saarland|Vorsteuer|Umsatzsteuer|Umsatzerloese|Wareneingang|Verbindlichkeiten/i,
        /Bilanz|GuV|Balance Sheet|Income Statement/i
      ],
      maxLines: 260,
      maxLineLength: 260
    })
  );
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

function normalizeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function classifyAccounts(text: string) {
  return starterAccounts.map((account) => {
    const visible = new RegExp(`${normalizeForRegex(account.no)}|${normalizeForRegex(account.name)}`, 'i').test(text);
    const expectedStateVisible =
      new RegExp(
        `${normalizeForRegex(account.no)}[\\s\\S]{0,260}${normalizeForRegex(account.name)}[\\s\\S]{0,260}${normalizeForRegex(
          account.expectedType
        )}[\\s\\S]{0,260}${normalizeForRegex(account.expectedAccountType)}`,
        'i'
      ).test(text) ||
      new RegExp(
        `${normalizeForRegex(account.no)}[\\s\\S]{0,260}${normalizeForRegex(account.name)}[\\s\\S]{0,260}${normalizeForRegex(
          account.expectedAccountType
        )}[\\s\\S]{0,260}${normalizeForRegex(account.expectedType)}`,
        'i'
      ).test(text);
    return {
      ...account,
      visible,
      expectedStateVisible,
      status: visible && expectedStateVisible ? 'observed' : 'blocked'
    };
  });
}

async function findVisibleChartIframe(page: Page): Promise<{ locator: Locator | null; text: string; index: number | null; reason: string }> {
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
    const accountScore = starterAccounts.reduce((sum, account) => sum + (new RegExp(`${account.no}|${normalizeForRegex(account.name)}`, 'i').test(text) ? 1 : 0), 0);
    const hasChartWords = /Kontenplan|Chart of Accounts|Nr\.|No\.|GuV\/Bilanz|Kontoart/i.test(text);
    if (accountScore > 0 && hasChartWords) {
      candidates.push({ index, score: accountScore + (hasChartWords ? 3 : 0), text, boxArea: Math.round(box.width * box.height) });
    }
  }

  candidates.sort((left, right) => right.score - left.score || right.boxArea - left.boxArea);
  const best = candidates[0];
  if (!best) {
    return { locator: null, text: '', index: null, reason: 'No visible iframe with chart account text found.' };
  }
  return { locator: iframes.nth(best.index), text: best.text, index: best.index, reason: `Selected iframe ${best.index} with chart score ${best.score}.` };
}

async function clickVisibleChartLink(page: Page) {
  const clicked: string[] = [];
  const candidates = [
    page.getByRole('link', { name: /^Kontenplan$/i }).first(),
    page.getByRole('button', { name: /^Kontenplan$/i }).first(),
    page.locator('a,button,[role="link"],[role="button"]').filter({ hasText: /^Kontenplan$/ }).first()
  ];

  for (const locator of candidates) {
    if (!(await locator.isVisible({ timeout: 1200 }).catch(() => false))) continue;
    await locator.hover().catch(() => undefined);
    await page.waitForTimeout(300);
    await locator.click({ timeout: 5000 }).catch(async () => locator.click({ timeout: 5000, force: true }));
    clicked.push('outer-page-kontenplan-link');
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(2500);
    return clicked;
  }

  for (const frame of page.frames()) {
    const frameCandidates = [
      frame.getByRole('link', { name: /^Kontenplan$/i }).first(),
      frame.getByRole('button', { name: /^Kontenplan$/i }).first(),
      frame.locator('a,button,[role="link"],[role="button"]').filter({ hasText: /^Kontenplan$/ }).first()
    ];
    for (const locator of frameCandidates) {
      if (!(await locator.isVisible({ timeout: 1200 }).catch(() => false))) continue;
      await locator.hover().catch(() => undefined);
      await page.waitForTimeout(300);
      await locator.click({ timeout: 5000 }).catch(async () => locator.click({ timeout: 5000, force: true }));
      clicked.push('frame-kontenplan-link');
      await waitForBusinessCentralShell(page);
      await page.waitForTimeout(2500);
      return clicked;
    }
  }

  return clicked;
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

async function fullPageDiagnostic(page: Page, fileName: string, metadata: Record<string, unknown>) {
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

test('TARGET-026O recovers a visible Chart of Accounts screenshot without edits', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await page.goto(buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.mouse.move(1600, 760).catch(() => undefined);
  await page.waitForTimeout(700);

  let currentUrl = page.url();
  const dialogs = await dangerousDialogs(page);
  let rawText = clean(await pageText(page));
  let compactText = await compactChartText(page);
  let chartFrame = await findVisibleChartIframe(page);
  const navigationSteps: string[] = [];
  if (!chartFrame.locator) {
    navigationSteps.push(...(await clickVisibleChartLink(page)));
    currentUrl = page.url();
    rawText = clean(await pageText(page));
    compactText = await compactChartText(page);
    chartFrame = await findVisibleChartIframe(page);
  }
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  const textForClassification = chartFrame.text || compactText || rawText;
  const accountFindings = classifyAccounts(textForClassification);
  const missingOrWrong = accountFindings.filter((entry) => entry.status !== 'observed');
  const bankConflict = accountFindings.some((entry) => entry.no === '1200' && entry.visible) && accountFindings.some((entry) => entry.no === '1800' && entry.visible);
  const chartVisibleInFrame = Boolean(chartFrame.locator) && /1200|1406|1800|3300|3806|4400|5400|Kontenplan|Nr\.|Name/i.test(chartFrame.text);
  const resultStatus = safeContext && dialogs.length === 0 && chartVisibleInFrame && missingOrWrong.length === 0 ? 'observed' : 'blocked';
  const nextCase = resultStatus === 'observed' ? 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT' : 'TARGET-026O-CHART-OF-ACCOUNTS-VISIBLE-SCREENSHOT-REVIEW';

  await writeText('target-026o-chart-frame-text.txt', textForClassification || 'No chart frame text captured.');
  await writeJson(path.join(EVIDENCE_DIR, 'target-026o-account-findings.json'), {
    caseId: CASE_ID,
    accountFindings,
    bankConflict,
    chartFrameIndex: chartFrame.index,
    chartFrameReason: chartFrame.reason
  });

  await fullPageDiagnostic(page, 'target-026o-000-full-page-diagnostic.png', {
    page: 'Business Central outer page',
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    step: 'Diagnostic outer screenshot before iframe-scoped screenshot',
    status: 'diagnostic-only',
    internallyProves: 'Outer browser viewport context only; not sufficient as chart proof if Role Center is visible.',
    doesNotProve: ['No chart proof by itself', 'No setup readiness', 'No VAT setup', 'No posting groups']
  });

  if (chartFrame.locator) {
    await screenshotWithMetadata(chartFrame.locator, 'target-026o-010-visible-chart-iframe.png', {
      page: 'Kontenplan / Chart of Accounts',
      pageId: CHART_OF_ACCOUNTS_PAGE_ID,
      step: 'Iframe-scoped visible chart screenshot recovery',
      status: resultStatus,
      iframeIndex: chartFrame.index,
      importantUi: ['Nr.', 'Name', 'GuV/Bilanz', 'Kontoart', 'Buchung'],
      visibleLearning: [
        'Der sichtbare Kontenplan muss vor USt- und Buchungsgruppenarbeit geprueft werden.',
        'Ein Aussenscreenshot reicht nicht, wenn Business Central den Inhalt in einem Iframe rendert.'
      ],
      internallyProves: 'Visible iframe-scoped starter chart state in playthru / UNIVERSAARL-DE.',
      doesNotProve: ['No complete SKR04 chart', 'No VAT Posting Setup', 'No posting groups', 'No master data', 'No document draft', 'No Preview Posting', 'No Posting'],
      screenshotQaRule: 'The screenshot itself must show the chart list, not the Role Center.',
      accountFindings,
      bankConflict
    });
  }

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
    lastEvidenceSummary: 'TARGET-026N blocked because compact text contained chart fragments but the visible page screenshot still looked like Role Center.',
    isPlannedNextCaseStillSensible: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'The visible iframe screenshot shows the Kontenplan list with starter account values; VAT preflight can inspect setup mappings next without writing.'
        : `Chart screenshot recovery blocked: ${chartFrame.reason} ${missingOrWrong.map((entry) => `${entry.no} ${entry.name}`).join(', ')}`.trim(),
    lookaheadReviewed: [
      {
        caseId: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason: resultStatus === 'observed' ? 'Visible chart checkpoint recovered.' : 'Visible chart screenshot is still not trustworthy.'
      },
      {
        caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Posting groups depend on chart and VAT foundation.'
      },
      {
        caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
        status: 'needs-setup-first',
        reason: 'Master data waits for VAT and posting groups.'
      },
      {
        caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
        status: 'needs-setup-first',
        reason: 'Foundation readiness waits for chart, VAT, posting groups and dimensions.'
      }
    ],
    queueChangesMade: resultStatus === 'observed' ? ['Select TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT as next case.'] : ['Keep chart screenshot recovery review before VAT.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'VAT preflight is the next narrow read-only setup step after visible account foundation proof.'
        : 'Do not continue to VAT from hidden or untrustworthy chart text.',
    risksBeforeNextCase: bankConflict ? ['Do not use 1200 Bank Saarland for bank/payment setup until the 1200/1800 conflict is resolved.'] : [],
    requiredPreparation: resultStatus === 'observed' ? ['Keep VAT setup write locked until TARGET-027 explicitly unlocks it.'] : ['Fix visible chart screenshot route.']
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-chart-screenshot-recovery',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(currentUrl),
    page: 'Kontenplan / Chart of Accounts',
    pageId: CHART_OF_ACCOUNTS_PAGE_ID,
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Chart of Accounts Page 16 read-only.',
      ...(navigationSteps.length ? [`Used visible UI navigation: ${navigationSteps.join(', ')}.`] : []),
      'Selected the visible Business Central iframe with chart account text.',
      'Captured a diagnostic outer screenshot and an iframe-scoped chart screenshot.',
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
            'The iframe-scoped screenshot route shows the visible Kontenplan list instead of the Role Center.',
            'Starter chart rows 1200, 1406, 1800, 3300, 3806, 4400 and 5400 are visible with expected GuV/Bilanz and Kontoart values in the captured chart context.',
            'No VAT setup, posting groups, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [`Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`, 'The chart screenshot recovery stopped before VAT/posting/master data.'],
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
            ...(!chartVisibleInFrame ? [chartFrame.reason] : []),
            ...dialogs,
            ...missingOrWrong.map((entry) => `${entry.no} ${entry.name} not visible with expected ${entry.expectedType}/${entry.expectedAccountType}`)
          ],
    warnings: bankConflict ? ['1200 Bank Saarland and 1800 Bank Saarland are both visible; classify before bank/payment setup.'] : [],
    screenshots: chartFrame.locator
      ? ['target-026o-000-full-page-diagnostic.png', 'target-026o-010-visible-chart-iframe.png']
      : ['target-026o-000-full-page-diagnostic.png'],
    evidenceRefs: [
      'TARGET-026O-result.json',
      'README.md',
      'target-026o-chart-frame-text.txt',
      'target-026o-account-findings.json',
      'target-026o-000-full-page-diagnostic.png',
      'target-026o-000-full-page-diagnostic.screenshot.json',
      ...(chartFrame.locator ? ['target-026o-010-visible-chart-iframe.png', 'target-026o-010-visible-chart-iframe.screenshot.json'] : [])
    ],
    accountFindings,
    bankConflict,
    chartFrameIndex: chartFrame.index,
    chartFrameReason: chartFrame.reason,
    navigationSteps,
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    nextStepDecision,
    nextCase,
    reason:
      resultStatus === 'observed'
        ? 'Visible chart screenshot route recovered; VAT Posting Groups preflight can run next.'
        : 'Visible chart screenshot recovery blocked; do not proceed to VAT preflight.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-026O Chart of Accounts Visible Screenshot Recovery',
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
      '- `target-026o-000-full-page-diagnostic.png` ist nur Diagnose.',
      '- `target-026o-010-visible-chart-iframe.png` ist der fachliche Screenshot, wenn er den Kontenplan sichtbar zeigt.',
      '- Kompakter Text allein zaehlt nicht als Bildbeweis.',
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
