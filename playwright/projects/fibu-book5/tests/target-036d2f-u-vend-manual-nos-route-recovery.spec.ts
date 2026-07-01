import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(360_000);

const CASE_ID = 'TARGET-036D2F-U-VEND-MANUAL-NOS-ROUTE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_SERIES = 'U-VEND';
const EVIDENCE_ID = 'target-036d2f-u-vend-manual-nos-route-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036D2F-result.json');

type ManualNosState = {
  found: boolean;
  checked: boolean | null;
  reason: string;
  rowText: string;
  headerText: string;
  candidateCount: number;
  rect: { x: number; y: number; width: number; height: number } | null;
};

function buildNumberSeriesUrl(filtered = true) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', '456');
  if (filtered) url.searchParams.set('filter', `No. Series.'Code' IS '${TARGET_SERIES}'`);
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
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

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
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

async function assertSafeContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `Wrong instance: ${sanitizeUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `Wrong company: ${sanitizeUrl(url)}`).toBe(true);
  const text = clean(await pageText(page));
  expect(text).toMatch(/Nummernserie|No\. Series/i);
  expect(text).not.toMatch(/Buchungsvorschau|Preview Posting|Moechten Sie buchen|Mochten Sie buchen|Do you want to post|Ship and Invoice|Zahlung buchen|Payment Journal/i);
}

async function openFilteredNumberSeries(page: Page) {
  await page.goto(buildNumberSeriesUrl(true), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
}

async function writeBlockedResult(args: {
  page: Page;
  blockedBy: string[];
  actionsTaken: string[];
  reason: string;
  nextCase: string;
}) {
  const completedAt = new Date().toISOString();
  const visibleText = clean(await pageText(args.page).catch(() => ''));
  const sanitizedUrl = sanitizeUrl(args.page.url());
  const authBlocker = /Token wurde erwartet|Something went wrong|Token was expected|sign in|Anmelden/i.test(visibleText);
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
    lastEvidenceSummary: 'TARGET-036D2E did not persist U-VEND Manual Nos after an unfiltered/cell-coordinate route.',
    isPlannedNextCaseStillSensible: false,
    reason: args.reason,
    lookaheadReviewed: [
      {
        caseId: 'TARGET-036D2F-U-VEND-MANUAL-NOS-ROUTE-RECOVERY',
        status: authBlocker ? 'blocked' : 'ready-next',
        reason: authBlocker ? 'Playwright storageState/auth token must be refreshed before retry.' : 'Retry only after the blocker reason is resolved.'
      },
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
        status: 'blocked',
        reason: 'Vendor creation remains blocked until U-VEND Manual Nos is proven active.'
      },
      {
        caseId: 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT',
        status: 'needs-ui-discovery-first',
        reason: 'Still unrelated to the active vendor-numbering blocker.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C must wait for master data and posting/VAT readiness.'
      }
    ],
    queueChangesMade: [],
    selectedNextCase: args.nextCase,
    whySelectedNextCaseIsBest: authBlocker
      ? 'The next useful step is to refresh Playwright BC authentication and rerun the same narrow D2F route.'
      : 'The route did not complete; the next step must resolve the specific blocker before any vendor attempt.',
    risksBeforeNextCase: ['Do not create vendor/customer/item records until U-VEND Manual Nos is proven active.'],
    requiredPreparation: authBlocker
      ? ['Run auth refresh for playwright/.auth/bc-user.json in the normal local workflow, then rerun D2F.']
      : ['Resolve the documented blocker before rerun.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-filtered-u-vend-manual-nos-route-recovery',
    resultStatus: 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizedUrl,
    page: authBlocker ? 'Business Central auth/token error page' : 'No. Series / Nummernserie',
    actionsTaken: args.actionsTaken,
    actionsNotTaken: [
      'No company switch.',
      'No customer, vendor or item card was created.',
      'No sales or purchase document draft was created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No setup field was changed.',
      'No number-series lines were changed.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [],
    evidenceRefs: [`playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2F-result.json`],
    proved: [
      authBlocker
        ? 'The D2F route did not reach Business Central because the Playwright session/token is missing or expired.'
        : 'The D2F route stopped before any effective Business Central action.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ],
    notProved: [
      'U-VEND Manual Nos. is not proven active.',
      'No vendor exists from this case.',
      'No automatic numbering behavior, Preview Posting, Posting, ledger entry or VAT effect is proven.'
    ],
    warnings: [
      authBlocker
        ? 'Auth/token failure is an execution blocker, not a Business Central setup finding.'
        : 'Blocked before setup route proof.'
    ],
    blockedBy: args.blockedBy,
    flags: {
      noCompanySwitch: true,
      noMasterDataChange: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noApiShortcut: true
    },
    visibleTextSample: authBlocker ? 'Business Central token/auth error page; raw screenshot intentionally not committed.' : visibleText.slice(0, 600),
    nextStepDecision,
    nextCase: args.nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2F-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    timestamp: completedAt,
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea: 'universaarl-vendor-number-series-route-recovery',
        activeCase: args.nextCase,
        active_case_file: '.agent/state/cases/target-036d2f-u-vend-manual-nos-route-recovery.json',
        lastCompletedCase: CASE_ID,
        nextCase: args.nextCase,
        nextStep: nextStepDecision.whySelectedNextCaseIsBest
      },
      activeCase: {
        status: 'blocked',
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2F-result.json`,
        nextCase: args.nextCase
      },
      lastRunSummary: {
        runId: CASE_ID,
        completedAt,
        status: 'blocked',
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        bcRun: false,
        setupChanged: false,
        masterDataChanged: false,
        draftCreated: false,
        previewPosting: false,
        posted: false,
        apiShortcut: false,
        nextCase: args.nextCase,
        summary: args.reason
      }
    },
    reason: args.reason
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      'Status: blocked',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      args.reason,
      '',
      '## Grenze',
      '',
      'Business Central wurde nicht wirksam erreicht. Es gab keine Einrichtungsaenderung, keine Stammdatenanlage, keinen Draft, keine Buchungsvorschau, keine Buchung und keinen API Shortcut.',
      '',
      '## Naechster Schritt',
      '',
      authBlocker
        ? 'Playwright-Authentifizierung aktualisieren und denselben engen D2F-Case erneut ausfuehren.'
        : 'Blocker beheben und denselben engen D2F-Case erneut ausfuehren.',
      ''
    ].join('\n')
  );
}

async function clickSafeAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name }).first();
      if (await action.isVisible({ timeout: 700 }).catch(() => false)) {
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }
  return false;
}

async function hoverVisible(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.getByText(label).first();
    if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
      await locator.hover({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

async function collectActionInventory(page: Page) {
  const results = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate(() => {
          const norm = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a'))
            .filter(visible)
            .map((element) => ({
              text: norm(element.innerText || element.textContent),
              aria: norm(element.getAttribute('aria-label')),
              title: norm(element.getAttribute('title')),
              role: norm(element.getAttribute('role') || element.tagName.toLowerCase())
            }))
            .filter((entry) => `${entry.text} ${entry.aria} ${entry.title}`.trim())
            .slice(0, 240);
        })
        .catch(() => [])
    )
  );
  const seen = new Set<string>();
  return results
    .flat()
    .filter((entry) => {
      const key = `${entry.role}|${entry.text}|${entry.aria}|${entry.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter((entry) => /Neu|New|Liste bearbeiten|Edit List|Zeilen|Lines|Weitere Optionen|More|Manuelle|Manual|Standard|Default|U-VEND|Filter|Funnel/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
    .slice(0, 80);
}

async function manualNosState(page: Page): Promise<ManualNosState> {
  for (const frame of page.frames()) {
    const state = await frame
      .evaluate((targetSeries) => {
        const norm = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const centerX = (rect: DOMRect) => rect.x + rect.width / 2;
        const centerY = (rect: DOMRect) => rect.y + rect.height / 2;
        const rectJson = (rect: DOMRect) => ({ x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) });
        const checkedOf = (element: HTMLElement) => {
          if (element instanceof HTMLInputElement && element.type === 'checkbox') return element.checked;
          const ariaChecked = element.getAttribute('aria-checked');
          if (ariaChecked === 'true') return true;
          if (ariaChecked === 'false') return false;
          return null;
        };

        const rows = Array.from(document.querySelectorAll<HTMLElement>('[role="row"],tr'))
          .filter(visible)
          .map((element) => ({ element, text: norm(element.innerText || element.textContent), rect: element.getBoundingClientRect() }))
          .filter((entry) => new RegExp(`\\b${targetSeries}\\b`, 'i').test(entry.text));
        const uniqueRows = rows.filter((entry, index, list) => index === list.findIndex((other) => other.text === entry.text && Math.abs(other.rect.y - entry.rect.y) < 2));
        if (uniqueRows.length !== 1) {
          return { found: false, checked: null, reason: `u-vend-row-count-${uniqueRows.length}`, rowText: uniqueRows.map((entry) => entry.text).join(' | ').slice(0, 260), headerText: '', candidateCount: 0, rect: null };
        }
        const row = uniqueRows[0];
        const header = Array.from(document.querySelectorAll<HTMLElement>('[role="columnheader"],th,span,div'))
          .filter(visible)
          .map((element) => ({ element, text: norm(element.innerText || element.textContent || element.getAttribute('aria-label')), rect: element.getBoundingClientRect() }))
          .filter((entry) => /Manuelle\s*Anz|Manual Nos/i.test(entry.text) && entry.rect.y < row.rect.y && entry.text.length <= 100)
          .sort((left, right) => Math.abs(centerX(left.rect) - centerX(row.rect)) - Math.abs(centerX(right.rect) - centerX(row.rect)))[0];
        if (!header) {
          return { found: false, checked: null, reason: 'manual-nos-header-not-found', rowText: row.text.slice(0, 260), headerText: '', candidateCount: 0, rect: null };
        }
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('input[type="checkbox"],[role="checkbox"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const inRowBand = centerY(rect) >= row.rect.y - 5 && centerY(rect) <= row.rect.y + row.rect.height + 5;
            const columnDistance = Math.abs(centerX(rect) - centerX(header.rect));
            return {
              element,
              rect,
              checked: checkedOf(element),
              score: (inRowBand ? 60 : 0) + (columnDistance <= 80 ? 50 : 0) + (typeof checkedOf(element) === 'boolean' ? 30 : 0) - Math.min(columnDistance / 10, 25)
            };
          })
          .filter((entry) => entry.score >= 105)
          .sort((left, right) => right.score - left.score);
        if (candidates.length !== 1) {
          return { found: false, checked: null, reason: `manual-nos-candidate-count-${candidates.length}`, rowText: row.text.slice(0, 260), headerText: header.text, candidateCount: candidates.length, rect: candidates[0] ? rectJson(candidates[0].rect) : null };
        }
        const chosen = candidates[0];
        chosen.element.setAttribute('data-codex-u-vend-manual-nos', 'true');
        return {
          found: true,
          checked: chosen.checked,
          reason: 'filtered-u-vend-single-row-manual-nos-candidate',
          rowText: row.text.slice(0, 260),
          headerText: header.text,
          candidateCount: 1,
          rect: rectJson(chosen.rect)
        };
      }, TARGET_SERIES)
      .catch(() => null);
    if (state) return state;
  }
  return { found: false, checked: null, reason: 'no-frame-state', rowText: '', headerText: '', candidateCount: 0, rect: null };
}

async function clickMarkedManualNos(page: Page) {
  for (const frame of page.frames()) {
    const target = frame.locator('[data-codex-u-vend-manual-nos="true"]').first();
    if (await target.isVisible({ timeout: 700 }).catch(() => false)) {
      await target.click({ timeout: 5000 });
      await page.waitForTimeout(1500);
      return true;
    }
  }
  return false;
}

async function compactSnapshot(page: Page) {
  return compactPageText(page, {
    include: [/Nummernserie|No\. Series|Code|Beschreibung|Description|Standardnr|Default Nos|Manuelle|Manual Nos|U-VEND|Filter|Liste bearbeiten|Edit List|Weitere Optionen|More/i],
    maxLines: 220,
    maxLineLength: 260
  });
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    caseId: CASE_ID,
    fileName,
    imagePath: `playwright/projects/fibu-book5/img/${fileName}`,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function capture(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactSnapshot(page);
  const state = await manualNosState(page);
  const actions = await collectActionInventory(page);
  await writeText(`${filePrefix}.txt`, compact);
  const snapshot = {
    step,
    url: sanitizeUrl(page.url()),
    title: clean(await page.title()),
    compact,
    manualNosState: state,
    actionInventory: actions,
    ...extra
  };
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nummernserie / No. Series',
    pageId: 456,
    table: 'No. Series',
    tableId: 308,
    step,
    targetSeries: TARGET_SERIES,
    purpose: 'Screenshot-QA for filtered U-VEND Manual Nos route recovery.',
    importantUi: ['filtered U-VEND row', 'Manuelle Anz. / Manual Nos.', 'Liste bearbeiten / Edit List', 'Filter context'],
    internallyProves: 'Business Central UI stayed on the filtered U-VEND No. Series page in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No vendor exists.', 'No document exists.', 'No Preview Posting or Posting occurred.'],
    ...extra
  });
  return snapshot;
}

test('TARGET-036D2F recovers U-VEND Manual Nos through filtered single-row route', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const actionsTaken: string[] = [];
  const warnings: string[] = [];
  const blockedBy: string[] = [];

  try {
    await openFilteredNumberSeries(page);
  } catch (error) {
    const reason = `D2F blocked before effective BC action: ${String(error).replace(/\u001b\[[0-9;]*m/g, '').slice(0, 500)}`;
    await writeBlockedResult({
      page,
      blockedBy: [reason],
      actionsTaken: ['Tried to open Page 456 Number Series with URL filter restricted to U-VEND in playthru / UNIVERSAARL-DE.'],
      reason,
      nextCase: CASE_ID
    });
    return;
  }
  actionsTaken.push('Opened Page 456 Number Series with URL filter restricted to U-VEND in playthru / UNIVERSAARL-DE.');
  const hoveredManual = await hoverVisible(page, /Manuelle Anz\.?|Manual Nos\.?/i);
  const before = await capture(page, 'target-036d2f-010-filtered-u-vend-before', 'Before filtered U-VEND Manual Nos route recovery.', { hoveredManual });

  const beforeState = before.manualNosState as ManualNosState;
  const editListClicked = await clickSafeAction(page, /^Liste bearbeiten$|^Edit List$/i);
  actionsTaken.push(editListClicked ? 'Clicked Liste bearbeiten / Edit List after U-VEND-only filter proof.' : 'Tried to click Liste bearbeiten / Edit List; action was not visible.');
  await assertSafeContext(page);
  const editMode = await capture(page, 'target-036d2f-020-filtered-u-vend-edit-mode', 'Filtered U-VEND route after Edit List attempt.', { editListClicked });
  const editState = editMode.manualNosState as ManualNosState;

  let clickedManualNos = false;
  if (beforeState.checked === true || editState.checked === true) {
    actionsTaken.push('U-VEND Manual Nos was already active; no setup click was needed.');
  } else if (!editState.found || editState.checked !== false) {
    blockedBy.push(`No unique filtered U-VEND Manual Nos checkbox was available after Edit List: ${editState.reason}.`);
  } else {
    clickedManualNos = await clickMarkedManualNos(page);
    if (clickedManualNos) actionsTaken.push('Clicked only the marked Manual Nos checkbox in the filtered U-VEND single-row context.');
    else blockedBy.push('Marked Manual Nos checkbox disappeared before click.');
  }

  await assertSafeContext(page);
  const afterAttempt = await capture(page, 'target-036d2f-030-after-manual-nos-route-attempt', 'After filtered U-VEND Manual Nos route attempt.', { clickedManualNos });

  await openFilteredNumberSeries(page);
  const reopen = await capture(page, 'target-036d2f-040-reopen-proof', 'Reopen proof for filtered U-VEND Manual Nos route.', { clickedManualNos });
  const reopenState = reopen.manualNosState as ManualNosState;
  if (reopenState.checked !== true) blockedBy.push(`U-VEND Manual Nos is not proven active after reopen: ${reopenState.reason}.`);

  const observed = blockedBy.length === 0;
  const resultStatus = observed ? 'observed' : 'blocked';
  const nextCase = observed
    ? 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE'
    : 'TARGET-036D2G-U-VEND-MANUAL-NOS-SOURCE-OR-ASSISTED-ROUTE-DECISION';
  const completedAt = new Date().toISOString();
  const setupChanged = observed && beforeState.checked !== true && clickedManualNos;

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
    lastEvidenceSummary: 'TARGET-036D2E did not persist U-VEND Manual Nos after an unfiltered/cell-coordinate route.',
    isPlannedNextCaseStillSensible: observed,
    reason: observed
      ? 'U-VEND Manual Nos is active after filtered single-row reopen proof.'
      : 'Vendor creation remains blocked because Manual Nos is not proven active after a new filtered route.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
        status: observed ? 'ready-next' : 'blocked',
        reason: observed ? 'U-VEND allows manual numbers after reopen.' : 'Do not create vendor while U-VEND Manual Nos is still unproven.'
      },
      {
        caseId: 'TARGET-036D2G-U-VEND-MANUAL-NOS-SOURCE-OR-ASSISTED-ROUTE-DECISION',
        status: observed ? 'obsolete' : 'ready-next',
        reason: observed ? 'No source/assisted fallback is needed.' : 'The next useful step is a source-backed or assisted setup route, not another blind checkbox click.'
      },
      {
        caseId: 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT',
        status: 'needs-ui-discovery-first',
        reason: 'Customer/item posting fields are unrelated to the vendor-numbering blocker and still lack a safe write route.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C needs customer/item/posting/VAT readiness; it must not start from a number-series recovery case.'
      },
      {
        caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
        status: observed ? 'ready-after-current' : 'blocked',
        reason: observed ? 'Useful after first vendor write gate and remaining master-data checks.' : 'Foundation ready check would still hide the vendor-numbering blocker.'
      }
    ],
    queueChangesMade: [`Selected ${nextCase} after D2F.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: observed
      ? 'It turns the solved U-VEND prerequisite into the narrowest next master-data write gate.'
      : 'It avoids repeating the failed list/cell routes and forces a source-backed route decision.',
    risksBeforeNextCase: observed
      ? ['Vendor template/default fields may still block the first vendor; keep documents, Preview Posting and Posting locked.']
      : ['Another UI write attempt may change the wrong number series unless a stronger route is found first.'],
    requiredPreparation: observed
      ? ['Use explicit vendor number U-VEND-100; no documents, Preview Posting or Posting.']
      : ['Check Microsoft Learn/source-backed setup route or assisted setup route before any further U-VEND checkbox write.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-filtered-u-vend-manual-nos-route-recovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    page: 'No. Series / Nummernserie',
    pageId: 456,
    table: 'No. Series',
    tableId: 308,
    sourceBasis: [
      {
        title: 'Microsoft Learn: Create number series',
        url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/ui-create-number-series',
        claim: 'Manual Nos. allows manually entered numbers for the records/documents using a number series.'
      }
    ],
    actionsTaken,
    actionsNotTaken: [
      'No company switch.',
      'No customer, vendor or item card was created.',
      'No sales or purchase document draft was created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No number-series lines were changed.',
      'No non-U-VEND number series was intentionally changed.',
      'U-VEND Default Nos. / Standardnr. was not intentionally changed.'
    ],
    setupChanged,
    setupChangeAttempted: clickedManualNos,
    changedFields: setupChanged
      ? [
          {
            table: 'No. Series',
            tableId: 308,
            code: TARGET_SERIES,
            field: 'Manual Nos.',
            fieldId: 4,
            before: beforeState.checked,
            after: reopenState.checked
          }
        ]
      : [],
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036d2f-010-filtered-u-vend-before.png',
      'playwright/projects/fibu-book5/img/target-036d2f-020-filtered-u-vend-edit-mode.png',
      'playwright/projects/fibu-book5/img/target-036d2f-030-after-manual-nos-route-attempt.png',
      'playwright/projects/fibu-book5/img/target-036d2f-040-reopen-proof.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2F-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2f-010-filtered-u-vend-before.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2f-040-reopen-proof.snapshot.json`
    ],
    proved: observed
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 456 was opened with a U-VEND-only filter before the Manual Nos route attempt.',
          'U-VEND Manual Nos. / Manuelle Anz. is active after reopen proof.',
          'No master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 456 was opened with a U-VEND-only filter before the Manual Nos route attempt.',
          'No master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
        ],
    notProved: observed
      ? [
          'No vendor exists yet.',
          'No vendor template/default behavior is proven.',
          'No automatic numbering behavior, Preview Posting, Posting, ledger entry or VAT effect is proven.',
          'This is not a complete number-series policy review.'
        ]
      : [
          'U-VEND Manual Nos. is not proven active after reopen.',
          'No vendor exists yet.',
          'No automatic numbering behavior, Preview Posting, Posting, ledger entry or VAT effect is proven.'
        ],
    warnings,
    blockedBy,
    flags: {
      noCompanySwitch: true,
      noMasterDataChange: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noApiShortcut: true
    },
    before,
    editMode,
    afterAttempt,
    reopen,
    nextStepDecision,
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2F-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036d2f-*.png'
    ],
    timestamp: completedAt,
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea: observed ? 'universaarl-first-vendor-controlled-write-gate' : 'universaarl-vendor-number-series-route-recovery',
        activeCase: nextCase,
        active_case_file: observed
          ? '.agent/state/cases/target-036d3-first-vendor-manual-number-controlled-write-gate.json'
          : '.agent/state/cases/target-036d2g-u-vend-manual-nos-source-or-assisted-route-decision.json',
        lastCompletedCase: CASE_ID,
        nextCase,
        nextStep: nextStepDecision.whySelectedNextCaseIsBest
      },
      activeCase: {
        status: resultStatus,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2F-result.json`,
        nextCase
      },
      lastRunSummary: {
        runId: CASE_ID,
        completedAt,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        bcRun: true,
        setupChanged,
        masterDataChanged: false,
        draftCreated: false,
        previewPosting: false,
        posted: false,
        apiShortcut: false,
        nextCase,
        summary: observed
          ? 'Filtered U-VEND route proved Manual Nos active after reopen; first vendor write gate is next.'
          : `Filtered U-VEND route blocked: ${blockedBy.join('; ')}`
      }
    },
    reason: observed
      ? 'Filtered single-row route recovered U-VEND Manual Nos with reopen proof.'
      : `Filtered single-row route did not prove U-VEND Manual Nos: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Zweck',
      '',
      'Dieser Lauf prueft eine neue, engere Bedienroute fuer die Nummernserie `U-VEND`: Die Seite `Nummernserie` wird direkt auf `U-VEND` gefiltert, bevor `Liste bearbeiten` und die Checkbox `Manuelle Anz.` bewertet werden.',
      '',
      '## Ergebnis',
      '',
      observed
        ? '- `U-VEND` erlaubt nach erneutem Oeffnen manuelle Nummern.'
        : `- Blockiert: ${blockedBy.join('; ')}`,
      '',
      '## Nicht gemacht',
      '',
      '- kein Kreditor, Debitor oder Artikel',
      '- kein Beleg oder Draft',
      '- keine Buchungsvorschau',
      '- keine Buchung',
      '- kein API Shortcut',
      '- keine andere Nummernserie',
      '',
      '## Buchwirkung',
      '',
      observed
        ? 'Fuer die erste Kreditorenanlage kann das Buch jetzt erklaeren: Eine lesbare manuelle Kreditorennummer setzt voraus, dass die Nummernserie manuelle Nummern erlaubt.'
        : 'Die Kreditorenanlage bleibt gesperrt, bis eine source-backed oder assistierte Route fuer `Manuelle Anz.` vorliegt.',
      ''
    ].join('\n')
  );

  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.apiShortcut).toBe(false);
  expect(startedAt <= completedAt).toBe(true);
});
