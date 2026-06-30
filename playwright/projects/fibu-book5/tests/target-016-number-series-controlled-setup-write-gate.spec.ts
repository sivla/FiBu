import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-016-number-series-controlled-setup-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016-result.json');

type TargetSeries = {
  family: string;
  code: string;
  description: string;
  startNo: string;
  endNo: string;
};

type CreationAttempt = {
  code: string;
  status: 'created-or-visible' | 'already-existing' | 'blocked';
  reason: string;
};

type LineAttempt = {
  code: string;
  status: 'line-created-or-visible' | 'already-configured' | 'blocked';
  reason: string;
};

const targetSeries: TargetSeries[] = [
  { family: 'customer', code: 'U-CUST', description: 'Universaarl Customer Nos.', startNo: 'U-CUST00001', endNo: 'U-CUST99999' },
  { family: 'vendor', code: 'U-VEND', description: 'Universaarl Vendor Nos.', startNo: 'U-VEND00001', endNo: 'U-VEND99999' },
  { family: 'item', code: 'U-ITEM', description: 'Universaarl Item Nos.', startNo: 'U-ITEM00001', endNo: 'U-ITEM99999' },
  { family: 'sales-order', code: 'U-SO', description: 'Universaarl Sales Order Nos.', startNo: 'U-SO00001', endNo: 'U-SO99999' },
  { family: 'sales-invoice', code: 'U-SINV', description: 'Universaarl Sales Invoice Nos.', startNo: 'U-SINV00001', endNo: 'U-SINV99999' },
  { family: 'purchase-order', code: 'U-PO', description: 'Universaarl Purchase Order Nos.', startNo: 'U-PO00001', endNo: 'U-PO99999' },
  { family: 'purchase-invoice', code: 'U-PINV', description: 'Universaarl Purchase Invoice Nos.', startNo: 'U-PINV00001', endNo: 'U-PINV99999' }
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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsDangerousDialog(text: string) {
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice|Liefern und fakturieren/i.test(text);
}

function containsSetupAssignmentSignal(text: string) {
  return /Einrichtung Debitoren|Sales & Receivables Setup|Kreditoren & Einkauf Einr\.|Purchases & Payables Setup|Lager Einrichtung|Inventory Setup/i.test(
    text
  );
}

function codePattern(code: string) {
  return new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
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

async function visibleNames(page: Page, selector: string) {
  const values = await page
    .evaluate((query) => {
      const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      return Array.from(document.querySelectorAll<HTMLElement>(query))
        .filter(visible)
        .map((element) =>
          normalize(
            element.innerText ||
              element.textContent ||
              element.getAttribute('aria-label') ||
              element.getAttribute('title') ||
              element.getAttribute('name')
          )
        )
        .filter(Boolean)
        .slice(0, 160);
    }, selector)
    .catch(() => [] as string[]);
  return [...new Set(values.map(clean).filter(Boolean))];
}

async function clickFirstVisible(locators: Locator[]) {
  for (const locator of locators) {
    if (await locator.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await locator
        .first()
        .click({ timeout: 5000 })
        .catch(async () => {
          await locator.first().click({ timeout: 5000, force: true });
        });
      return true;
    }
  }
  return false;
}

async function clickActionInAnyFrame(page: Page, name: RegExp) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    const clicked = await clickFirstVisible([
      scope.getByRole('button', { name }),
      scope.getByRole('menuitem', { name }),
      scope.getByText(name)
    ]);
    if (clicked) {
      await page.waitForTimeout(1200);
      return true;
    }
  }
  return false;
}

async function capturePageState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const rawText = await pageText(page);
  const compact = (
    await compactPageText(page, {
      include: [/Nummernserie|No\. Series|Code|Beschreibung|Description|Startnr|Starting No|Letzte Nr|Last No|BANKEINZ|CT-MSG|VATNOTIF|U-/i],
      maxLines: 140,
      maxLineLength: 180
    })
  )
    .split('\n')
    .filter((line) => !/trustedOriginAuthorities|trustedOriginAuthoritiesSetFromServer/i.test(line))
    .join('\n');
  const screenshot = `${filePrefix}.png`;
  const buttonSignals = (await visibleNames(page, 'button,[role="button"],[role="menuitem"]'))
    .filter((name) => /New|Neu|Edit|Bearbeiten|Liste bearbeiten|Edit List|Lines|Zeilen|Related|Verwalten|Aktionen|Process|Navigate/i.test(name))
    .slice(0, 50);
  await writeText(`${filePrefix}.txt`, compact || clean(rawText).slice(0, 6000));
  await screenshotWithMetadata(page, screenshot, {
    pageId: 456,
    page: 'Nummernserie / No. Series',
    step,
    status: 'german-final-candidate-setup-evidence',
    bookUse: 'foundation-number-series-setup',
    visibleLearning:
      'Die Nummernserienliste steuert spaeter, welche Nummern Business Central fuer Stammdaten und Belege vergeben kann. Dieser Screenshot zaehlt nur fuer die sichtbaren Reihen und Spalten.',
    importantUi: buttonSignals,
    internallyProves: 'The Number Series page was visible in playthru / UNIVERSAARL-DE at this step.',
    doesNotProve: [
      'No Sales/Purchase/Inventory setup assignment was changed.',
      'No master data, document draft, preview posting, posting or ledger entry was created.',
      'German invoice-number compliance is not proven by creating a series code alone.'
    ],
    qualityDecision: 'requires-visual-qa',
    ...extra
  });
  return {
    text: clean(rawText),
    compact,
    screenshot,
    buttonSignals
  };
}

async function assertSafeNumberSeriesContext(page: Page) {
  const text = clean(await pageText(page));
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  if (!safeContext) {
    throw new Error(`Unsafe context. URL was ${sanitizeUrl(currentUrl)}`);
  }
  if (!/Nummernserie|No\. Series/i.test(text)) {
    throw new Error('Number Series page text is not visible.');
  }
  if (containsSetupAssignmentSignal(text)) {
    throw new Error('A setup assignment page is visible; TARGET-016 may only write in Number Series page 456.');
  }
  if (containsDangerousDialog(text)) {
    throw new Error('Dangerous dialog/action text detected.');
  }
}

async function assertSafeNumberSeriesOrLinesContext(page: Page) {
  const text = clean(await pageText(page));
  const currentUrl = page.url();
  const safeContext = instancePathIsTarget(currentUrl) && companyParamIsTarget(currentUrl);
  if (!safeContext) {
    throw new Error(`Unsafe context. URL was ${sanitizeUrl(currentUrl)}`);
  }
  if (!/Nummernserie|No\. Series|Nummernserienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Number Series or Number Series Lines page text is not visible.');
  }
  if (containsSetupAssignmentSignal(text)) {
    throw new Error('A setup assignment page is visible; TARGET-016 may only write in Number Series and Number Series Lines.');
  }
  if (containsDangerousDialog(text)) {
    throw new Error('Dangerous dialog/action text detected.');
  }
}

async function selectSeriesRow(page: Page, code: string) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    const row = scope.getByRole('row', { name: codePattern(code) }).first();
    if (await row.isVisible({ timeout: 1000 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(700);
      return true;
    }
    const text = scope.getByText(codePattern(code)).first();
    if (await text.isVisible({ timeout: 1000 }).catch(() => false)) {
      await text.click({ timeout: 5000 }).catch(async () => text.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(700);
      return true;
    }
  }
  return false;
}

async function clickFirstDataCellUnderHeader(page: Page, headerPattern: RegExp) {
  const patternSource = headerPattern.source;
  const patternFlags = headerPattern.flags;
  const point = await page
    .evaluate(
      ({ source, flags }) => {
        const pattern = new RegExp(source, flags);
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const headers = Array.from(document.querySelectorAll<HTMLElement>('*'))
          .filter(visible)
          .map((element) => ({ element, text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label')) }))
          .filter((entry) => pattern.test(entry.text))
          .map((entry) => ({ rect: entry.element.getBoundingClientRect(), text: entry.text }))
          .filter((entry) => entry.rect.width > 20 && entry.rect.height > 8)
          .sort((left, right) => left.rect.top - right.rect.top || left.rect.left - right.rect.left);
        const header = headers[0];
        if (!header) return null;
        return {
          x: header.rect.left + Math.min(Math.max(header.rect.width / 2, 20), header.rect.width - 8),
          y: header.rect.bottom + 28,
          headerText: header.text
        };
      },
      { source: patternSource, flags: patternFlags }
    )
    .catch(() => null as { x: number; y: number; headerText: string } | null);

  if (!point) {
    return false;
  }

  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(300);
  return true;
}

async function attemptCreateSeries(page: Page, series: TargetSeries): Promise<CreationAttempt> {
  const beforeText = clean(await pageText(page));
  if (codePattern(series.code).test(beforeText)) {
    return { code: series.code, status: 'already-existing', reason: 'Code was visible before the create attempt.' };
  }

  const clickedNew = await clickActionInAnyFrame(page, /^Neu$|^New$/i);
  await page.waitForTimeout(1200);
  await assertSafeNumberSeriesContext(page).catch((error: Error) => {
    throw new Error(`Unsafe context after New for ${series.code}: ${error.message}`);
  });

  if (!clickedNew) {
    return { code: series.code, status: 'blocked', reason: 'No scoped New action was visible on Number Series page.' };
  }

  await page.keyboard.type(series.code, { delay: 12 });
  await page.keyboard.press('Tab');
  await page.keyboard.type(series.description, { delay: 8 });
  await page.keyboard.press('Tab');
  await page.keyboard.type(series.startNo, { delay: 12 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1800);

  const afterText = clean(await pageText(page));
  if (containsDangerousDialog(afterText)) {
    return { code: series.code, status: 'blocked', reason: 'Dangerous dialog appeared after row entry.' };
  }
  if (codePattern(series.code).test(afterText)) {
    return { code: series.code, status: 'created-or-visible', reason: 'Code is visible after UI row entry.' };
  }

  return {
    code: series.code,
    status: 'blocked',
    reason: 'The code was not visible after New + keyboard row entry; stop before repeating blind cell-edit attempts.'
  };
}

async function attemptCreateSeriesLine(page: Page, series: TargetSeries, index: number): Promise<LineAttempt> {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeNumberSeriesContext(page);

  const listText = clean(await pageText(page));
  if (!codePattern(series.code).test(listText)) {
    return { code: series.code, status: 'blocked', reason: 'Series code is not visible on Number Series page before opening Lines.' };
  }
  if (codePattern(series.startNo).test(listText)) {
    return { code: series.code, status: 'already-configured', reason: 'Starting number is already visible on Number Series page.' };
  }

  const selected = await selectSeriesRow(page, series.code);
  if (!selected) {
    return { code: series.code, status: 'blocked', reason: 'Could not select the series row before opening Lines.' };
  }

  const linesClicked = await clickActionInAnyFrame(page, /^Zeilen$|^Lines$/i);
  if (!linesClicked) {
    return { code: series.code, status: 'blocked', reason: 'No scoped Lines action was visible for the selected series.' };
  }
  await page.waitForTimeout(1800);
  await assertSafeNumberSeriesOrLinesContext(page);
  await capturePageState(page, `target-016-04${index}-${series.code.toLowerCase()}-lines-before`, `Before line entry for ${series.code}.`, {
    series
  });

  const linePageTextBefore = clean(await pageText(page));
  if (codePattern(series.startNo).test(linePageTextBefore)) {
    return { code: series.code, status: 'already-configured', reason: 'Starting number is already visible on Number Series Lines page.' };
  }

  const clickedNew = await clickActionInAnyFrame(page, /^Neu$|^New$/i);
  if (!clickedNew) {
    return { code: series.code, status: 'blocked', reason: 'No scoped New action was visible on Number Series Lines page.' };
  }
  await page.waitForTimeout(900);
  await assertSafeNumberSeriesOrLinesContext(page);

  const clickedStartNoCell = await clickFirstDataCellUnderHeader(page, /^Startnr\.|^Starting No\./i);
  if (!clickedStartNoCell) {
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(series.startNo, { delay: 12 });
  await page.keyboard.press('Tab');
  await page.keyboard.type(series.endNo, { delay: 12 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1600);
  await capturePageState(page, `target-016-05${index}-${series.code.toLowerCase()}-lines-after`, `After line entry for ${series.code}.`, {
    series
  });

  const linePageTextAfter = clean(await pageText(page));
  if (containsDangerousDialog(linePageTextAfter)) {
    return { code: series.code, status: 'blocked', reason: 'Dangerous dialog appeared after number-series line entry.' };
  }
  if (codePattern(series.startNo).test(linePageTextAfter)) {
    return { code: series.code, status: 'line-created-or-visible', reason: 'Starting number is visible after UI line entry.' };
  }
  return {
    code: series.code,
    status: 'blocked',
    reason: 'Starting number was not visible after Number Series Lines entry.'
  };
}

test('TARGET-016 Number Series controlled setup write gate', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const resultBase = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-number-series-setup-write',
    runPlanId: 'TARGET-016-NUMBER-SERIES-CONTROLLED-SETUP-WRITE-GATE',
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY
  };

  const attempts: CreationAttempt[] = [];
  const lineAttempts: LineAttempt[] = [];
  let beforeState: Awaited<ReturnType<typeof capturePageState>> | undefined;
  let afterState: Awaited<ReturnType<typeof capturePageState>> | undefined;
  let blockedReason = '';

  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);

  try {
    await assertSafeNumberSeriesContext(page);
    beforeState = await capturePageState(page, 'target-016-010-number-series-before', 'Before any TARGET-016 write attempt.');

    const editListClicked = await clickActionInAnyFrame(page, /^Liste bearbeiten$|^Edit List$|^Bearbeiten$/i);
    await page.waitForTimeout(1500);
    await assertSafeNumberSeriesContext(page);
    await capturePageState(page, 'target-016-020-edit-list-or-current-mode', 'After trying to enable list edit mode.', {
      editListClicked
    });

    for (const series of targetSeries) {
      const attempt = await attemptCreateSeries(page, series);
      attempts.push(attempt);
      await capturePageState(page, `target-016-03${attempts.length}-${series.code.toLowerCase()}-attempt`, `After ${series.code} create attempt.`, {
        attempt
      });
      if (attempt.status === 'blocked') {
        blockedReason = `${series.code}: ${attempt.reason}`;
        break;
      }
    }

    if (!blockedReason) {
      for (const [index, series] of targetSeries.entries()) {
        const lineAttempt = await attemptCreateSeriesLine(page, series, index + 1);
        lineAttempts.push(lineAttempt);
        if (lineAttempt.status === 'blocked') {
          blockedReason = `${series.code}: ${lineAttempt.reason}`;
          break;
        }
      }
    }

    await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(1500);
    await assertSafeNumberSeriesContext(page);
    afterState = await capturePageState(page, 'target-016-090-number-series-after-reload', 'After reload verification of Number Series page.');
  } catch (error) {
    blockedReason = error instanceof Error ? error.message : String(error);
    await capturePageState(page, 'target-016-099-blocked-or-error', 'Blocked/error state after controlled setup write gate.', {
      blockedReason
    }).catch(() => undefined);
  }

  const finalText = afterState?.text ?? clean(await pageText(page).catch(() => ''));
  const visibleTargetCodes = targetSeries.filter((series) => codePattern(series.code).test(finalText)).map((series) => series.code);
  const missingTargetCodes = targetSeries.filter((series) => !visibleTargetCodes.includes(series.code)).map((series) => series.code);
  const visibleStartNos = targetSeries.filter((series) => codePattern(series.startNo).test(finalText)).map((series) => series.startNo);
  const missingStartNos = targetSeries.filter((series) => !visibleStartNos.includes(series.startNo)).map((series) => series.startNo);
  const createdOrExisting = attempts.filter((attempt) => attempt.status === 'created-or-visible' || attempt.status === 'already-existing').map((attempt) => attempt.code);
  const linesCreatedOrExisting = lineAttempts
    .filter((attempt) => attempt.status === 'line-created-or-visible' || attempt.status === 'already-configured')
    .map((attempt) => attempt.code);
  const blockedAttempts = attempts.filter((attempt) => attempt.status === 'blocked');
  const blockedLineAttempts = lineAttempts.filter((attempt) => attempt.status === 'blocked');
  const setupChanged = attempts.some((attempt) => attempt.status === 'created-or-visible');
  const linesChanged = lineAttempts.some((attempt) => attempt.status === 'line-created-or-visible');
  const allVisible = missingTargetCodes.length === 0 && missingStartNos.length === 0;
  const resultStatus = allVisible && !blockedReason ? 'observed' : setupChanged || linesChanged ? 'partial-observed' : 'blocked';
  const selectedNextCase = allVisible
    ? 'TARGET-017-NUMBER-SERIES-ASSIGNMENT-FIELD-DISCOVERY'
    : 'TARGET-016B-NUMBER-SERIES-LINES-ROUTE-RECOVERY';

  const result = {
    ...resultBase,
    resultStatus,
    url: sanitizeUrl(page.url()),
    proved: [
      ...(beforeState ? ['Number Series before screenshot captured in playthru / UNIVERSAARL-DE immediately before the write gate.'] : []),
      ...(setupChanged ? [`U-* number-series rows were created or made visible through UI entry: ${createdOrExisting.join(', ')}.`] : []),
      ...(linesCreatedOrExisting.length ? [`U-* number-series line start values were created or made visible through UI entry: ${linesCreatedOrExisting.join(', ')}.`] : []),
      ...(allVisible
        ? [`All target U-* number-series codes and starting numbers are visible after reload: ${visibleTargetCodes.join(', ')} / ${visibleStartNos.join(', ')}.`]
        : [])
    ],
    notProved: [
      'No setup assignment was made in Sales & Receivables, Purchases & Payables or Inventory Setup.',
      'No customer, vendor, item, document draft, preview posting, posting or ledger trace was created.',
      'German legal invoice-number compliance is not proven by this setup alone.',
      ...(missingTargetCodes.length ? [`Target U-* codes not visible after this run: ${missingTargetCodes.join(', ')}.`] : []),
      ...(missingStartNos.length ? [`Target U-* starting numbers not visible after this run: ${missingStartNos.join(', ')}.`] : []),
      ...(blockedReason ? [`Controlled UI route blocked: ${blockedReason}.`] : [])
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016-number-series-controlled-setup-write-gate/TARGET-016-result.json',
      'playwright/projects/fibu-book5/evidence/target-016-number-series-controlled-setup-write-gate/README.md',
      'playwright/projects/fibu-book5/evidence/target-016-number-series-controlled-setup-write-gate/*.txt',
      'playwright/projects/fibu-book5/evidence/target-016-number-series-controlled-setup-write-gate/*.screenshot.json',
      'playwright/projects/fibu-book5/img/target-016-*.png'
    ],
    statePatch: {
      current: {
        activeCase: selectedNextCase,
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep: allVisible
          ? 'Run TARGET-017: discover visible setup assignment fields for the new U-* number series before assigning them.'
          : 'Run TARGET-016B: recover a safer Number Series UI write route; do not repeat blind New+keyboard entry.'
      },
      lastRunSummary: {
        caseId: CASE_ID,
        status: resultStatus,
        summary: allVisible
          ? 'TARGET-016 created/verified the first Universaarl U-* number series and start lines in Number Series only. No setup assignment, master data, draft, preview or posting occurred.'
          : 'TARGET-016 attempted the controlled Number Series write gate but did not verify all target U-* rows after reload. No setup assignment, master data, preview or posting occurred.',
        resultPath: 'playwright/projects/fibu-book5/evidence/target-016-number-series-controlled-setup-write-gate/TARGET-016-result.json'
      }
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016-number-series-controlled-setup-write-gate/TARGET-016-result.json',
      'playwright/projects/fibu-book5/img/target-016-010-number-series-before.png',
      'playwright/projects/fibu-book5/img/target-016-020-edit-list-or-current-mode.png',
      'playwright/projects/fibu-book5/img/target-016-090-number-series-after-reload.png'
    ],
    targetSeries,
    attempts,
    lineAttempts,
    visibleTargetCodes,
    missingTargetCodes,
    visibleStartNos,
    missingStartNos,
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookChange: true,
      noSetupAssignment: true,
      setupChanged: setupChanged || linesChanged
    },
    smartDecisionCard: {
      caseId: CASE_ID,
      effectiveActionRequested: true,
      decision: 'Create only U-* rows on Number Series page 456, after duplicate check and before screenshot.',
      alternativesConsidered: [
        'Assign number series in setup pages: rejected for TARGET-016; this needs a separate visible field discovery and assignment gate.',
        'Create master data directly: rejected because numbering setup is not yet assigned.',
        'Use API/config package: rejected; the case requires UI-first evidence.'
      ],
      risk: 'Wrong number-series setup can affect later cards and documents; stop after Number Series rows and do not claim legal compliance.',
      fallback: 'If the UI write route is blocked, use TARGET-016B route recovery instead of repeating blind cell edits.'
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-015 proved Number Series before-state with no U-* duplicates and visible related setup-page context.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Number-series rows are a prerequisite for later setup assignment, master data and document numbering.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-017-NUMBER-SERIES-ASSIGNMENT-FIELD-DISCOVERY',
          status: allVisible ? 'ready-next' : 'needs-setup-first',
          reason: allVisible
            ? 'U-* rows and starting numbers are visible; assignment fields can be discovered next without changing them yet.'
            : 'Do not discover assignment as complete until U-* row and start-line creation is recovered or consciously deferred.'
        },
        {
          caseId: 'TARGET-018-NUMBER-SERIES-ASSIGNMENT-WRITE-GATE',
          status: 'ready-after-current',
          reason: 'Assignment should follow only after field discovery and before/after screenshots.'
        },
        {
          caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting group readiness follows the numbering foundation.'
        },
        {
          caseId: 'TARGET-020-VAT-SETUP-READINESS',
          status: 'needs-source-check-first',
          reason: 'German VAT claims require source-backed setup plus later Preview/VAT Entries.'
        },
        {
          caseId: 'TARGET-021-CORE-MASTERDATA-PLAN',
          status: 'needs-setup-first',
          reason: 'Master data waits for number-series assignment, posting groups, VAT and dimensions.'
        }
      ],
      queueChangesMade: [`Selected ${selectedNextCase} based on TARGET-016 visible U-* verification.`],
      selectedNextCase,
      whySelectedNextCaseIsBest: allVisible
        ? 'The next useful step is discovering assignment fields, not creating master data yet.'
        : 'The next useful step is recovering the write route without repeating a failed New+keyboard route.',
      risksBeforeNextCase: [
        'Do not assign setup fields without a separate gate.',
        'Do not create master data until numbering assignment and posting setup are clear.',
        'Do not claim German legal invoice numbering from this evidence alone.'
      ],
      requiredPreparation: allVisible
        ? ['Use TARGET-016 screenshots as before/after Number Series evidence.', 'Open setup pages read-only and expand Number Series FastTabs.']
        : ['Inspect TARGET-016 blocked screenshot and action signals.', 'Choose a different Number Series write route before retrying.']
    },
    warnings: [...blockedAttempts, ...blockedLineAttempts].map((attempt) => `${attempt.code}: ${attempt.reason}`),
    blockedBy: blockedReason ? [blockedReason] : [],
    requiresReview: Boolean(blockedReason),
    safeToFinalizeState: Boolean(beforeState) && (setupChanged || linesChanged) && !containsDangerousDialog(finalText),
    reason: allVisible
      ? 'Controlled Number Series write gate completed and target U-* rows plus starting numbers are visible after reload.'
      : 'Controlled Number Series write gate did not verify all target U-* rows and starting numbers; use recovery before further setup.'
  };

  await writeJson(RESULT_PATH, result);

  const readme = [
    '# TARGET-016 Number Series Controlled Setup Write Gate',
    '',
    `Instanz: ${EXPECTED_INSTANCE}`,
    `Company: ${TARGET_COMPANY}`,
    '',
    '## Ergebnis',
    '',
    resultStatus === 'observed'
      ? 'Die ersten Universaarl-Nummernserien sind in der Nummernserienliste sichtbar.'
      : 'Der kontrollierte Schreibpfad wurde nicht vollstaendig verifiziert.',
    '',
    '## Grenzen',
    '',
    '- Keine Zuweisung in Debitoren-/Verkaufs-, Kreditoren-/Einkaufs- oder Lager-Einrichtung.',
    '- Keine Stammdaten, kein Belegentwurf, keine Buchungsvorschau, keine Buchung.',
    '- Keine deutsche Compliance- oder Rechnungsnummern-Endaussage aus dieser Evidence.',
    '',
    '## Naechster Schritt',
    '',
    selectedNextCase
  ].join('\n');
  await writeText('README.md', readme);

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
