import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-048C-INVENTORY-ACCOUNT-1140-BALANCE-SHEET-CORRECTION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-048c-inventory-account-1140-balance-sheet-correction';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-048C-result.json');
const GL_ACCOUNT_CARD_PAGE_ID = 17;
const CHART_OF_ACCOUNTS_PAGE_ID = 16;

const targetAccount = {
  no: '1140',
  name: 'Waren (Bestand)',
  expectedType: 'Bilanz',
  expectedAccountType: 'Buchung'
};

type CaseStatus = 'observed' | 'blocked';

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

function cardUrl() {
  return buildPlaythruUrl(GL_ACCOUNT_CARD_PAGE_ID, `'G/L Account'.'No.' IS '${targetAccount.no}'`);
}

function chartUrl() {
  return buildPlaythruUrl(CHART_OF_ACCOUNTS_PAGE_ID);
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
        /Sachkontokarte|G\/L Account Card|Kontenplan|Chart of Accounts|Nr\.|No\.|Name|GuV\/Bilanz|Income\/Balance|GuV|Bilanz|Balance Sheet|Income Statement|Kontoart|Account Type|Buchung|Posting|1140|Waren|Bestand/i
      ],
      maxLines: 260,
      maxLineLength: 280
    })
  );
}

function classifyCardOrChartText(text: string) {
  const rowSnippet = targetRowSnippet(text);
  const searchable = rowSnippet || text;
  return {
    accountVisible: /1140/i.test(searchable),
    nameVisible: /Waren|Bestand/i.test(searchable),
    balanceSheetVisible: /GuV\/Bilanz\s+Bilanz\b|Income\/Balance\s+Balance Sheet\b|1140\s+Waren \(Bestand\)\s+Bilanz\s+Buchung|Waren \(Bestand\)\s+Bilanz\s+Buchung/i.test(
      searchable
    ),
    incomeStatementVisible: /GuV\/Bilanz\s+GuV\b|Income\/Balance\s+Income Statement\b|1140\s+Waren \(Bestand\)\s+GuV\s+Buchung|Waren \(Bestand\)\s+GuV\s+Buchung/i.test(
      searchable
    ),
    postingVisible: /Kontoart\s+Buchung\b|Account Type\s+Posting\b|Waren \(Bestand\).*\bBuchung\b|1140.*\bBuchung\b/i.test(searchable),
    rowSnippet
  };
}

function targetRowSnippet(text: string) {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const index = lines.findIndex((line) => /^1140$/.test(line) || /1140.*Waren/i.test(line));
  if (index < 0) return '';
  if (/Waren|Bestand/i.test(lines[index])) return lines[index];
  if (/Waren|Bestand/i.test(lines[index + 1] ?? '')) return lines.slice(index, index + 2).join(' ');
  return lines.slice(index, index + 4).join(' ');
}

async function captureState(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await compactAccountText(page);
  const payload = {
    step,
    targetAccount,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    text,
    valueState: classifyCardOrChartText(text),
    ...extra
  };
  await writeText(`${prefix}.txt`, text || 'No compact text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`), payload);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    page: /page=16/i.test(page.url()) ? 'Kontenplan / Chart of Accounts' : 'Sachkontokarte / G/L Account Card',
    step,
    targetAccount,
    status: 'inventory-account-1140-balance-sheet-correction',
    importantUi: ['GuV/Bilanz', 'Bilanz', 'GuV', 'Kontoart', 'Buchung'],
    internallyProves: 'Visible account field state for 1140 in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No Inventory Posting Setup', 'No Item Posting Group', 'No item', 'No document draft', 'No preview', 'No posting'],
    screenshotQaRule: '1140 must visibly be Bilanz and Buchung after reopen. Nearby Bilanz values from other rows do not count.',
    ...extra
  });
  return payload;
}

async function openCard(page: Page) {
  await page.goto(cardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertTargetContext(page);
}

async function openChart(page: Page) {
  await page.goto(chartUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
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
    if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
      await locator.hover({ timeout: 1200 }).catch(() => undefined);
      await page.waitForTimeout(250);
      await locator.click({ timeout: 3000 }).catch(async () => locator.click({ timeout: 3000, force: true }));
      await page.waitForTimeout(1200);
      return { clicked: true, method: 'locator' };
    }
  }
  await page.mouse.click(1108, 80);
  await page.waitForTimeout(1200);
  return { clicked: true, method: 'coordinate-pencil-fallback-from-card-screenshot-qa' };
}

async function locateIncomeBalancePoint(page: Page) {
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
          .filter((entry) => /GuV\/Bilanz|Income\/Balance|GuV|Bilanz|Balance Sheet|Income Statement/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
          .slice(0, 160);
      })
      .catch(() => []);
    candidates.push(...entries);
  }
  const label = candidates
    .filter((entry) => /GuV\/Bilanz|Income\/Balance/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
    .filter((entry) => entry.width < 280 && entry.height < 70 && entry.x > 120 && entry.y > 150)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (label) return { x: label.x + 330, y: label.y + Math.round(label.height / 2), source: 'label-right-offset', label, candidates };
  const value = candidates
    .filter((entry) => /^(GuV|Income Statement)$/.test(entry.text))
    .filter((entry) => entry.x > 250 && entry.y > 150)
    .sort((left, right) => left.y - right.y || left.x - right.x)[0];
  if (value) return { x: value.x + Math.round(value.width / 2), y: value.y + Math.round(value.height / 2), source: 'exact-guv-value', value, candidates };
  return { x: 635, y: 408, source: 'fallback-card-coordinate', candidates };
}

async function chooseBilanzValue(page: Page, point: { x: number; y: number; source: string }) {
  const steps: Array<Record<string, unknown>> = [];
  const compactPoint = { x: point.x, y: point.y, source: point.source };
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(500);
  steps.push({ step: 'click-income-balance-value', point: compactPoint });
  await page.mouse.click(point.x + 112, point.y);
  await page.waitForTimeout(800);
  steps.push({ step: 'click-income-balance-dropdown-arrow-from-screenshot-qa', point: { x: point.x + 112, y: point.y } });
  const option = page.getByText(/^Bilanz$|^Balance Sheet$/i).last();
  if (await option.isVisible({ timeout: 1200 }).catch(() => false)) {
    await option.click({ force: true });
    steps.push({ step: 'clicked-visible-bilanz-option', key: 'dropdown-arrow' });
  } else {
    for (const key of ['Alt+ArrowDown', 'F4']) {
      await page.keyboard.press(key).catch(() => undefined);
      await page.waitForTimeout(800);
      if (await option.isVisible({ timeout: 1200 }).catch(() => false)) {
        await option.click({ force: true });
        steps.push({ step: 'clicked-visible-bilanz-option', key });
        await page.waitForTimeout(1000);
        await page.keyboard.press('Tab').catch(() => undefined);
        await page.waitForTimeout(1200);
        return steps;
      }
      steps.push({ step: 'option-not-visible-after-key', key });
    }
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.type('Bilanz', { delay: 60 }).catch(() => undefined);
    await page.keyboard.press('Enter').catch(() => undefined);
    steps.push({ step: 'typed-bilanz-enter-fallback' });
  }
  await page.waitForTimeout(1000);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1200);
  return steps;
}

test('TARGET-048C corrects only 1140 Waren Bestand to Bilanz with reopen proof', async ({ page }) => {
  await page.setViewportSize({ width: 2400, height: 1350 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const steps: Array<Record<string, unknown>> = [];
  await openCard(page);
  const before = await captureState(page, 'target-048c-010-before-card', 'Before correcting 1140 GuV/Bilanz to Bilanz.');
  const beforeState = before.valueState as ReturnType<typeof classifyCardOrChartText>;
  if (!beforeState.accountVisible || !beforeState.nameVisible) {
    steps.push({ step: 'account-not-visible-on-card', beforeState });
  } else if (beforeState.balanceSheetVisible && beforeState.postingVisible && !beforeState.incomeStatementVisible) {
    steps.push({ step: 'already-bilanz-no-write-needed', beforeState });
  } else {
    const edit = await clickEditAction(page);
    steps.push({ step: 'enter-edit-mode', edit });
    const point = await locateIncomeBalancePoint(page);
    steps.push({ step: 'located-income-balance-point', point: { x: point.x, y: point.y, source: point.source } });
    steps.push(...(await chooseBilanzValue(page, point)));
  }

  const after = await captureState(page, 'target-048c-020-after-field-route', 'After 1140 GuV/Bilanz correction route.', { steps });
  await openCard(page);
  const cardReopen = await captureState(page, 'target-048c-030-card-reopen-proof', 'Card reopen proof for 1140 Bilanz/Buchung.', { steps });
  await openChart(page);
  const chartReopen = await captureState(page, 'target-048c-040-chart-reopen-proof', 'Chart reopen proof for 1140 Bilanz/Buchung.', { steps });

  const finalState = chartReopen.valueState as ReturnType<typeof classifyCardOrChartText>;
  const resultStatus: CaseStatus =
    finalState.accountVisible && finalState.nameVisible && finalState.balanceSheetVisible && finalState.postingVisible && !finalState.incomeStatementVisible
      ? 'observed'
      : 'blocked';
  const blockedBy =
    resultStatus === 'observed'
      ? []
      : [`1140 is not visibly Bilanz/Buchung after reopen. Final row/card snippet: ${finalState.rowSnippet || 'no 1140 row snippet captured'}`];
  const changed = !steps.some((step) => step.step === 'already-bilanz-no-write-needed') && resultStatus === 'observed';
  const nextCase = resultStatus === 'observed' ? 'TARGET-049-ITEM-POSTING-GROUP-CONTROLLED-WRITE-GATE' : CASE_ID;

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-049-ITEM-POSTING-GROUP-CONTROLLED-WRITE-GATE',
    lastEvidenceSummary: 'TARGET-048B shows 1140 Waren (Bestand) exists, but as GuV/Buchung instead of Bilanz/Buchung.',
    isPlannedNextCaseStillSensible: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? '1140 now has the narrow Bilanz/Buchung reopen proof needed before item/inventory setup gates.'
        : 'Item Posting Group and Inventory Posting Setup must not use a wrong or unproven inventory account.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-049-ITEM-POSTING-GROUP-CONTROLLED-WRITE-GATE',
        status: resultStatus === 'observed' ? 'ready-next' : 'needs-setup-first',
        reason: resultStatus === 'observed' ? '1140 is ready as account dependency.' : '1140 still lacks Bilanz/Buchung proof.'
      },
      {
        caseId: 'TARGET-050-INVENTORY-POSTING-SETUP-CONTROLLED-WRITE-GATE',
        status: resultStatus === 'observed' ? 'ready-after-current' : 'needs-setup-first',
        reason: 'Inventory Posting Setup also needs Item Posting Group completion.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C remains blocked until foundation setup and item/customer posting fields are ready.'
      },
      {
        caseId: 'TARGET-027D4-VAT-MATRIX-FIELD-CONTROL-MAPPING',
        status: 'ready-after-current',
        reason: 'VAT remains a separate blocked foundation lane and must not be mixed with inventory account correction.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'The account dependency is now corrected; the next smallest setup gate is Item Posting Group before Inventory Posting Setup.'
        : 'Repeat only after UI diagnosis; do not advance to inventory setup with a wrong account.',
    risksBeforeNextCase:
      resultStatus === 'observed'
        ? ['Do not claim SKR04 completeness, tax approval or inventory posting readiness from one corrected account.']
        : ['Do not repeat blind coordinate editing; inspect card field geometry or Page Inspection first.'],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Keep Inventory Posting Setup, items, documents, Preview Posting and Posting locked until their own cases.']
        : ['Review screenshots and field locator candidates before another write attempt.']
  };

  const screenshots = [
    'target-048c-010-before-card.png',
    'target-048c-020-after-field-route.png',
    'target-048c-030-card-reopen-proof.png',
    'target-048c-040-chart-reopen-proof.png'
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-setup-write',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    page: 'Sachkontokarte / Kontenplan',
    pageId: [GL_ACCOUNT_CARD_PAGE_ID, CHART_OF_ACCOUNTS_PAGE_ID],
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened G/L Account Card Page 17 for account 1140.',
      'Changed or verified only 1140 GuV/Bilanz toward Bilanz.',
      'Captured before, after-route, card-reopen and chart-reopen screenshots.'
    ],
    actionsNotTaken: [
      'No account number or account name change.',
      'No other G/L account changed.',
      'No VAT setup.',
      'No General Posting Setup.',
      'No Item Posting Group.',
      'No Inventory Posting Setup.',
      'No item master data.',
      'No document draft.',
      'No Preview Posting.',
      'No Posting.',
      'No API shortcut.'
    ],
    setupChanged: changed,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved:
      resultStatus === 'observed'
        ? [
            `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
            'Account 1140 remains Waren (Bestand).',
            'Account 1140 is visible after reopen as Bilanz and Buchung/Posting.',
            'No VAT setup, posting groups, item posting group, inventory posting setup, item, document, Preview Posting, Posting or API shortcut was executed.'
          ]
        : [`Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`, 'The 1140 correction route stopped before wider inventory setup.'],
    notProved: [
      'No complete SKR04 chart of accounts.',
      'No tax advisor approval.',
      'No Item Posting Group.',
      'No Inventory Posting Setup row.',
      'No item master data.',
      'No inventory valuation posting.',
      'No document, Preview Posting or Posting.',
      'No German compliance final claim.'
    ],
    changedFiles: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/`],
    screenshots,
    evidenceRefs: [
      'TARGET-048C-result.json',
      'README.md',
      ...screenshots,
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.screenshot.json')),
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.snapshot.json')),
      ...screenshots.map((entry) => entry.replace(/\.png$/i, '.txt'))
    ],
    warnings: ['1140 is still only a starter account dependency, not proof of complete inventory valuation readiness.'],
    blockedBy,
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: false,
    flags: {
      setupChangeAttempted: true,
      setupChanged: changed,
      noVatSetupChange: true,
      noGeneralPostingSetupChange: true,
      noPostingGroupChange: true,
      noItemPostingGroupChange: true,
      noInventoryPostingSetupChange: true,
      noMasterData: true,
      noDocumentOrDraft: true,
      noPreview: true,
      noPost: true,
      noApiShortcut: true,
      noBookChange: true,
      noCompanySwitch: true
    },
    before,
    after,
    cardReopen,
    chartReopen,
    steps,
    nextStepDecision,
    nextCase,
    reason:
      resultStatus === 'observed'
        ? '1140 Waren (Bestand) is visible as Bilanz/Buchung after controlled correction and reopen proof.'
        : `1140 balance-sheet correction blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-048C Inventory Account 1140 Balance Sheet Correction',
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
      'TARGET-048B hat 1140 Waren (Bestand) sichtbar gemacht, aber als GuV/Buchung. Dieser Lauf durfte deshalb nur das Feld GuV/Bilanz auf der Sachkontokarte 1140 korrigieren.',
      '',
      '## Grenzen',
      '',
      '- Kein vollstaendiger SKR04-Kontenplan.',
      '- Keine Steuerberaterfreigabe.',
      '- Keine Item Posting Group.',
      '- Keine Inventory Posting Setup Zeile.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Kein API Shortcut.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
  if (resultStatus === 'blocked') expect(blockedBy.length).toBeGreaterThan(0);
});
