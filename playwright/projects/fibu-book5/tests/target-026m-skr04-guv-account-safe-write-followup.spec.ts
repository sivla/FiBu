import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-026M-SKR04-GUV-ACCOUNT-SAFE-WRITE-FOLLOWUP';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-026m-skr04-guv-account-safe-write-followup';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-026M-SAFE-WRITE-result.json');
const GL_ACCOUNT_CARD_PAGE_ID = 17;
const CHART_OF_ACCOUNTS_PAGE_ID = 16;

const targetAccounts = [
  {
    no: '4400',
    name: 'Umsatzerloese Inland 19 Prozent',
    expectedType: 'GuV'
  },
  {
    no: '5400',
    name: 'Wareneingang / Materialaufwand',
    expectedType: 'GuV'
  }
];

type AccountResult = {
  targetAccount: (typeof targetAccounts)[number];
  status: 'observed' | 'blocked';
  reason: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reopen: Record<string, unknown>;
  steps: Array<Record<string, unknown>>;
};

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

function buildPlaythruUrl(pageId: number, filter?: string) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  if (filter) url.searchParams.set('filter', filter);
  return url.toString();
}

function cardUrl(accountNo: string) {
  return buildPlaythruUrl(GL_ACCOUNT_CARD_PAGE_ID, `'G/L Account'.'No.' IS '${accountNo}'`);
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

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (/\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|L schen|Ship|Invoice|Payment|Apply|OK|Yes|Ja|Finish|New|Neu)\b/i.test(text)) {
        dialogs.push(text);
      }
    }
  }
  return dialogs;
}

async function assertTargetContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
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

async function compactAccountText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Sachkontokarte|G\/L Account Card|Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV\/Bilanz|Income\/Balance|GuV|Bilanz|Balance Sheet|Income Statement|Kontoart|Account Type|Buchung|Posting|4400|5400|Umsatzerloese|Wareneingang|geandert|changed/i
      ],
      maxLines: 240,
      maxLineLength: 260
    })
  );
}

async function captureState(page: Page, prefix: string, step: string, targetAccount: (typeof targetAccounts)[number], extra: Record<string, unknown> = {}) {
  const text = await compactAccountText(page);
  const payload = {
    step,
    targetAccount,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    text,
    valueState: classifyAccountText(text, targetAccount.no, targetAccount.name),
    ...extra
  };
  await writeText(`${prefix}.txt`, text || 'No compact text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`), payload);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    page: /page=16/i.test(page.url()) ? 'Kontenplan / Chart of Accounts' : 'Sachkontokarte / G/L Account Card',
    step,
    targetAccount,
    status: 'safe-write-followup',
    importantUi: ['GuV/Bilanz', 'Bilanz', 'GuV', 'Kontoart', 'Buchung'],
    internallyProves: 'Visible account field state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No VAT setup', 'No posting groups', 'No master data', 'No document draft', 'No preview', 'No posting'],
    screenshotQaRule: 'Value must visibly be GuV after reopen; field label GuV/Bilanz is not enough.',
    ...extra
  });
  return payload;
}

function classifyAccountText(text: string, accountNo: string, accountName: string) {
  const accountVisible = new RegExp(`${accountNo}|${accountName}`, 'i').test(text);
  const guvValueVisible = /GuV\/Bilanz\s+GuV\b|Income\/Balance\s+Income Statement\b|\bGuV\s+Kontokategorie\b/i.test(text);
  const bilanzValueVisible = /GuV\/Bilanz\s+Bilanz\b|Income\/Balance\s+Balance Sheet\b|\bBilanz\s+Kontokategorie\b/i.test(text);
  const postingVisible = /Kontoart\s+Buchung\b|Account Type\s+Posting\b/i.test(text);
  return { accountVisible, guvValueVisible, bilanzValueVisible, postingVisible };
}

async function openCard(page: Page, target: (typeof targetAccounts)[number]) {
  await page.goto(cardUrl(target.no), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertTargetContext(page);
}

async function openChart(page: Page) {
  await page.goto(buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertTargetContext(page);
}

async function clickEditAction(page: Page) {
  const candidates = [
    page.getByTitle(/^Bearbeiten$|^Edit$/i).first(),
    page.getByRole('button', { name: /^Bearbeiten$|^Edit$/i }).first(),
    page.getByRole('button', { name: /Bearbeiten|Edit/i }).first()
  ];
  for (const locator of candidates) {
    if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
      await locator.click({ timeout: 3000 }).catch(async () => locator.click({ timeout: 3000, force: true }));
      await page.waitForTimeout(1200);
      return { clicked: true, method: 'locator' };
    }
  }
  await page.mouse.click(1108, 80);
  await page.waitForTimeout(1200);
  return { clicked: true, method: 'coordinate-pencil-fallback-from-card-screenshot-qa' };
}

async function closeHarmlessTeachingTips(page: Page) {
  const closed: string[] = [];
  for (const label of [/Schliessen|Schließen|Close/i, /Nicht mehr anzeigen|Don't show again/i]) {
    const button = page.getByRole('button', { name: label }).last();
    if (await button.isVisible({ timeout: 700 }).catch(() => false)) {
      await button.click({ timeout: 3000 }).catch(async () => button.click({ timeout: 3000, force: true }));
      closed.push(String(label));
      await page.waitForTimeout(500);
    }
  }
  const iconOnlyClose = page.locator('[aria-label*="Schlie"], [aria-label*="Close"], [title*="Schlie"], [title*="Close"]').last();
  if (await iconOnlyClose.isVisible({ timeout: 700 }).catch(() => false)) {
    await iconOnlyClose.click({ timeout: 3000 }).catch(async () => iconOnlyClose.click({ timeout: 3000, force: true }));
    closed.push('icon-close');
    await page.waitForTimeout(500);
  }
  return closed;
}

async function locateGuvValuePoint(page: Page) {
  const candidates = [];
  for (const frame of page.frames().filter((entry) => /businesscentral\.dynamics\.com/i.test(entry.url()))) {
    const entries = await frame
      .evaluate(() => {
        const norm = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(document.querySelectorAll<HTMLElement>('label,span,div,input,button,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              text: norm(element.innerText || element.textContent),
              aria: norm(element.getAttribute('aria-label')),
              title: norm(element.getAttribute('title')),
              tag: element.tagName,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter((entry) => /GuV\/Bilanz|Income\/Balance|Bilanz|Balance Sheet/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
          .slice(0, 120);
      })
      .catch(() => []);
    candidates.push(...entries);
  }
  const smallLabel = candidates
    .filter((entry) => /GuV\/Bilanz|Income\/Balance/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
    .filter((entry) => entry.width < 260 && entry.height < 60 && entry.x > 150 && entry.y > 160)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (smallLabel) {
    return { x: smallLabel.x + 330, y: smallLabel.y + Math.round(smallLabel.height / 2), source: 'small-label-right-offset', smallLabel, candidates };
  }
  const bilanzValue = candidates
    .filter((entry) => /^(Bilanz|Balance Sheet)$/.test(entry.text))
    .filter((entry) => entry.x > 300 && entry.y > 160)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (bilanzValue) {
    return { x: bilanzValue.x + Math.round(bilanzValue.width / 2), y: bilanzValue.y + Math.round(bilanzValue.height / 2), source: 'exact-bilanz-value', bilanzValue, candidates };
  }
  return { x: 635, y: 408, source: 'viewport-coordinate-fallback-from-screenshot-qa', candidates };
}

async function chooseGuvValue(page: Page, point: { x: number; y: number; source: string }) {
  const steps: Array<Record<string, unknown>> = [];
  const compactPoint = { x: point.x, y: point.y, source: point.source };
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(500);
  steps.push({ step: 'click-income-balance-value', point: compactPoint });
  await page.mouse.click(point.x + 112, point.y);
  await page.waitForTimeout(800);
  steps.push({ step: 'click-income-balance-dropdown-arrow-from-screenshot-qa', point: { x: point.x + 112, y: point.y } });
  const option = page.getByText(/^GuV$|^Income Statement$/i).last();
  if (await option.isVisible({ timeout: 1200 }).catch(() => false)) {
    await option.click({ force: true });
    steps.push({ step: 'clicked-visible-guv-option', key: 'dropdown-arrow' });
    await page.waitForTimeout(1000);
    await page.keyboard.press('Tab').catch(() => undefined);
    await page.waitForTimeout(1200);
    return steps;
  }
  for (const key of ['Alt+ArrowDown', 'F4']) {
    await page.keyboard.press(key).catch(() => undefined);
    await page.waitForTimeout(800);
    if (await option.isVisible({ timeout: 1200 }).catch(() => false)) {
      await option.click({ force: true });
      steps.push({ step: 'clicked-visible-guv-option', key });
      await page.waitForTimeout(1000);
      await page.keyboard.press('Tab').catch(() => undefined);
      await page.waitForTimeout(1200);
      return steps;
    }
    steps.push({ step: 'option-not-visible-after-key', key });
  }
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type('GuV', { delay: 60 }).catch(() => undefined);
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(1200);
  steps.push({ step: 'typed-guv-enter-fallback' });
  await page.waitForTimeout(1200);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1200);
  return steps;
}

async function setAccountToGuv(page: Page, target: (typeof targetAccounts)[number]): Promise<AccountResult> {
  const steps: Array<Record<string, unknown>> = [];
  await openCard(page, target);
  const before = await captureState(page, `target-026m-safe-write-${target.no}-010-before-card`, `Before GuV correction for ${target.no}`, target);
  const beforeState = before.valueState as ReturnType<typeof classifyAccountText>;
  if (beforeState.guvValueVisible && beforeState.postingVisible) {
    steps.push({ step: 'already-guv-no-write-needed' });
  } else {
    const closedTeachingTips = await closeHarmlessTeachingTips(page);
    steps.push({ step: 'closed-harmless-teaching-tips-before-edit', closedTeachingTips });
    const edit = await clickEditAction(page);
    steps.push({ step: 'enter-edit-mode', edit });
    const point = await locateGuvValuePoint(page);
    steps.push({ step: 'located-income-balance-point', point: { x: point.x, y: point.y, source: point.source } });
    steps.push(...(await chooseGuvValue(page, point)));
  }
  const after = await captureState(page, `target-026m-safe-write-${target.no}-020-after-field-route`, `After GuV field route for ${target.no}`, target, { steps });
  await openCard(page, target);
  const reopen = await captureState(page, `target-026m-safe-write-${target.no}-030-card-reopen-proof`, `Card reopen proof for ${target.no}`, target, { steps });
  const reopenState = reopen.valueState as ReturnType<typeof classifyAccountText>;
  const status = reopenState.accountVisible && reopenState.guvValueVisible && reopenState.postingVisible ? 'observed' : 'blocked';
  return {
    targetAccount: target,
    status,
    reason:
      status === 'observed'
        ? `${target.no} ${target.name} is visible as GuV/Buchung after card reopen.`
        : `${target.no} ${target.name} is not visibly GuV/Buchung after card reopen.`,
    before,
    after,
    reopen,
    steps
  };
}

test('TARGET-026M safely corrects 4400 and 5400 to GuV with reopen proof', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const accountResults: AccountResult[] = [];
  for (const target of targetAccounts) {
    const result = await setAccountToGuv(page, target);
    accountResults.push(result);
    if (result.status !== 'observed') break;
  }

  await openChart(page);
  const chartText = await compactAccountText(page);
  await writeText('target-026m-safe-write-090-chart-reopen-proof.txt', chartText || 'No chart text captured.');
  await writeJson(path.join(EVIDENCE_DIR, 'target-026m-safe-write-090-chart-reopen-proof.snapshot.json'), {
    url: sanitizeEvidenceUrl(page.url()),
    chartText,
    accountResults: accountResults.map((entry) => ({ targetAccount: entry.targetAccount, status: entry.status, reason: entry.reason }))
  });
  await screenshotWithMetadata(page, 'target-026m-safe-write-090-chart-reopen-proof.png', {
    page: 'Kontenplan / Chart of Accounts',
    step: 'Final chart reopen proof after safe-write follow-up',
    status: 'reopen-proof',
    importantUi: ['Nr.', 'Name', 'GuV/Bilanz', 'Kontoart'],
    internallyProves: 'Final visible chart state after the controlled GuV/Bilanz route.',
    doesNotProve: ['No VAT setup', 'No posting groups', 'No master data', 'No preview', 'No posting']
  });

  const blockedBy = accountResults.filter((entry) => entry.status !== 'observed').map((entry) => entry.reason);
  const resultStatus = blockedBy.length === 0 && accountResults.length === targetAccounts.length ? 'observed' : 'blocked';
  const setupWriteAttempted = accountResults.some((entry) => !entry.steps.some((step) => step.step === 'already-guv-no-write-needed'));
  const screenshots = [
    ...accountResults.flatMap((entry) => [
      `target-026m-safe-write-${entry.targetAccount.no}-010-before-card.png`,
      `target-026m-safe-write-${entry.targetAccount.no}-020-after-field-route.png`,
      `target-026m-safe-write-${entry.targetAccount.no}-030-card-reopen-proof.png`
    ]),
    'target-026m-safe-write-090-chart-reopen-proof.png'
  ];
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT'
      : 'TARGET-026M-SKR04-GUV-ACCOUNT-SAFE-WRITE-REVIEW';
  const nextStepDecisionCard = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-026M-SKR04-GUV-ACCOUNT-SAFE-WRITE-FOLLOWUP',
    lastEvidenceSummary: 'TARGET-026M Page Inspection identified Page 17/Table 15/Income/Balance (9, Option) and showed both accounts still Bilanz.',
    isPlannedNextCaseStillSensible: true,
    reason: 'The controlled safe-write attempt is the narrowest useful step before chart checkpoint and VAT setup.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason: resultStatus === 'observed' ? 'GuV starter accounts have reopen proof.' : 'GuV starter accounts still need review before checkpoint.'
      },
      {
        caseId: 'TARGET-027-VAT-POSTING-GROUPS-PREFLIGHT',
        status: resultStatus === 'observed' ? 'ready-after-current' : 'needs-setup-first',
        reason: 'VAT setup waits for completed chart checkpoint.'
      },
      {
        caseId: 'TARGET-028-CUSTOMER-VENDOR-ITEM-MASTERDATA',
        status: 'needs-setup-first',
        reason: 'Master data waits for chart, VAT and posting groups.'
      },
      {
        caseId: 'TARGET-029-FIRST-SALES-PURCHASE-DRAFT-GATE',
        status: 'needs-setup-first',
        reason: 'Drafts wait for foundation readiness.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'The next practical step is a full chart-of-accounts checkpoint before VAT/posting setup.'
        : 'The safe-write route did not prove both accounts; review before any wider setup.',
    risksBeforeNextCase:
      resultStatus === 'observed'
        ? ['Do not claim full SKR04 or tax compliance; this is only starter account proof.']
        : ['Do not continue to VAT, posting groups or master data without GuV reopen proof.'],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Check 1800, 1406, 3300, 3806, 4400 and 5400 together in TARGET-026N.']
        : ['Review screenshots and route steps; avoid repeating failed coordinates blindly.']
  };
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-setup-write',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    actionsTaken: [
      'Opened filtered G/L Account Card page 17 for 4400 and 5400.',
      'Used Page-Inspection-backed Income/Balance field route on the card.',
      'Captured before, after and reopen screenshots.',
      'Opened Chart of Accounts page 16 for final context proof.'
    ],
    actionsNotTaken: [
      'No VAT setup',
      'No posting groups',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut'
    ],
    setupChanged: resultStatus === 'observed' && setupWriteAttempted,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved:
      resultStatus === 'observed'
        ? [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            '4400 Umsatzerloese Inland 19 Prozent is visible as GuV/Buchung after card reopen.',
            '5400 Wareneingang / Materialaufwand is visible as GuV/Buchung after card reopen.',
            'No VAT setup, posting group, master data, document draft, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [`Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`, 'The safe-write route was attempted with screenshots and stopped before wider setup.'],
    notProved: [
      'No complete SKR04 chart of accounts.',
      'No tax advisor approval.',
      'No VAT Posting Setup row.',
      'No posting groups.',
      'No master data.',
      'No document, Preview Posting or Posting.',
      'No German compliance final claim.'
    ],
    changedFiles: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/`],
    screenshots,
    evidenceRefs: [
      'TARGET-026M-SAFE-WRITE-result.json',
      'README.md',
      ...screenshots,
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.screenshot.json')),
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.snapshot.json')),
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.txt'))
    ],
    warnings: ['This is starter account setup proof, not complete SKR04, tax or posting readiness proof.'],
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: false,
    flags: {
      setupChangeAttempted: setupWriteAttempted,
      setupChanged: resultStatus === 'observed' && setupWriteAttempted,
      noVatSetupChange: true,
      noPostingGroupChange: true,
      noMasterData: true,
      noDocumentOrDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true,
      noBookChange: true,
      noCompanySwitch: true
    },
    accountResults,
    nextStepDecisionCard,
    nextCase,
    reason:
      resultStatus === 'observed'
        ? '4400 and 5400 have GuV/Buchung reopen proof; chart checkpoint can run next.'
        : `Safe-write follow-up blocked: ${blockedBy.join('; ')}`
  };
  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-026M SKR04 GuV Account Safe Write Follow-up',
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
      'Die Page Inspection hatte Page 17, Table 15 und Field 9 `Income/Balance` sichtbar gemacht. Deshalb war genau ein kontrollierter Schreibversuch auf dieses Feld sinnvoll. VAT Setup, Posting Groups und Stammdaten blieben gesperrt.',
      '',
      '## Grenzen',
      '',
      '- Kein vollstaendiger SKR04-Kontenplan.',
      '- Keine Steuerberaterfreigabe.',
      '- Keine VAT Posting Setup Zeile.',
      '- Keine Posting Groups.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Kein API Shortcut.'
    ].join('\n')
  );
  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
