import { test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-036D2E-U-VEND-MANUAL-NOS-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_SERIES = 'U-VEND';
const EVIDENCE_ID = 'target-036d2e-u-vend-manual-nos-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036D2E-result.json');

type CheckboxCandidate = {
  found: boolean;
  reason: string;
  frameIndex: number;
  marker: string;
  checked: boolean | null;
  trusted: boolean;
  score: number;
  rowText: string;
  headerText: string;
  ariaLabel: string;
  rect: { x: number; y: number; width: number; height: number } | null;
};

type CellPointCandidate = {
  found: boolean;
  reason: string;
  x: number;
  y: number;
  rowText: string;
  headerText: string;
  rowRect: { x: number; y: number; width: number; height: number } | null;
  headerRect: { x: number; y: number; width: number; height: number } | null;
};

function buildNumberSeriesUrl() {
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
    '/{tenant}/',
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
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
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
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

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertSafeNumberSeriesContext(page: Page) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) throw new Error(`Unsafe context: ${sanitizeUrl(url)}`);
  const text = await safeText(page);
  if (!/Nummernserie|No\. Series/i.test(text)) throw new Error('Number Series page is not visible.');
  if (/Preview Posting|Buchen\?|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Zahlung buchen|Payment Journal/i.test(text)) {
    throw new Error('Posting/payment text appeared in a number-series setup case.');
  }
}

async function openNumberSeries(page: Page) {
  await page.goto(buildNumberSeriesUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeNumberSeriesContext(page);
}

async function clickSafeAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(900);
        return true;
      }
    }
  }
  return false;
}

async function selectUVendRow(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const exact = scope.getByText(/^U-VEND$/).first();
    if (await exact.isVisible({ timeout: 700 }).catch(() => false)) {
      await exact.click({ timeout: 5000 }).catch(async () => exact.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(700);
      return true;
    }
    const row = scope.getByRole('row', { name: /U-VEND/i }).first();
    if (await row.isVisible({ timeout: 700 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(700);
      return true;
    }
  }
  return false;
}

async function compactSnapshot(page: Page) {
  return compactPageText(page, {
    include: [/Nummernserie|No\. Series|Code|Beschreibung|Description|Standardnr|Default Nos|Manuelle|Manual Nos|U-VEND|Universaarl/i],
    maxLines: 180,
    maxLineLength: 220,
  });
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata,
  });
}

async function findManualNosCandidate(page: Page): Promise<CheckboxCandidate> {
  const marker = `codex-manual-nos-${Date.now()}`;
  const frames = page.frames();
  for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
    const candidate = await frames[frameIndex]
      .evaluate((args) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const centerX = (rect: DOMRect) => rect.x + rect.width / 2;
        const centerY = (rect: DOMRect) => rect.y + rect.height / 2;
        const checkedState = (element: HTMLElement) => {
          if (element instanceof HTMLInputElement && element.type === 'checkbox') return element.checked;
          const ariaChecked = element.getAttribute('aria-checked');
          if (ariaChecked === 'true') return true;
          if (ariaChecked === 'false') return false;
          return null;
        };

        const rows = Array.from(document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name]'))
          .filter(visible)
          .map((element) => ({ element, text: normalize(element.innerText || element.textContent), rect: element.getBoundingClientRect() }))
          .filter((entry) => /\bU-VEND\b/i.test(entry.text));
        const row = rows.sort((left, right) => left.rect.y - right.rect.y)[0];
        if (!row) return null;

        const headers = Array.from(document.querySelectorAll<HTMLElement>('[role="columnheader"],th,button,span,div'))
          .filter(visible)
          .map((element) => ({ element, text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label')), rect: element.getBoundingClientRect() }))
          .filter((entry) => /Manuelle\s*Anz|Manual Nos/i.test(entry.text) && entry.text.length <= 90);
        const header = headers.sort((left, right) => Math.abs(centerY(left.rect) - centerY(row.rect)) - Math.abs(centerY(right.rect) - centerY(row.rect)))[0];
        if (!header) return null;

        const checkboxes = Array.from(document.querySelectorAll<HTMLElement>('input[type="checkbox"],[role="checkbox"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              element,
              rect,
              checked: checkedState(element),
              ariaLabel: normalize(element.getAttribute('aria-label') || element.getAttribute('title')),
              disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
              readOnly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
            };
          });

        const candidates = checkboxes
          .map((checkbox) => {
            const inRowBand = centerY(checkbox.rect) >= row.rect.y - 4 && centerY(checkbox.rect) <= row.rect.y + row.rect.height + 4;
            const columnDistance = Math.abs(centerX(checkbox.rect) - centerX(header.rect));
            const rowScoped = checkbox.element.closest('[role="row"],tr') === row.element;
            const nameMatches = /Manuelle\s*Anz|Manual Nos/i.test(checkbox.ariaLabel);
            const score =
              (inRowBand ? 50 : 0) +
              (columnDistance <= 70 ? 35 : 0) +
              (rowScoped ? 25 : 0) +
              (nameMatches ? 30 : 0) +
              (typeof checkbox.checked === 'boolean' ? 20 : 0) -
              (checkbox.disabled || checkbox.readOnly ? 80 : 0) -
              Math.min(columnDistance / 10, 20);
            return { row, header, checkbox, score, columnDistance };
          })
          .filter((entry) => entry.score >= 90)
          .sort((left, right) => right.score - left.score || left.columnDistance - right.columnDistance);

        const best = candidates[0];
        if (!best || typeof best.checkbox.checked !== 'boolean' || best.checkbox.disabled || best.checkbox.readOnly) return null;
        if (candidates[1] && best.score - candidates[1].score < 15) return null;

        best.checkbox.element.setAttribute('data-codex-manual-nos-target', args.marker);
        return {
          found: true,
          reason: 'trusted-u-vend-manual-nos-checkbox-candidate',
          frameIndex: args.frameIndex,
          marker: args.marker,
          checked: best.checkbox.checked,
          trusted: true,
          score: Math.round(best.score),
          rowText: row.text.slice(0, 220),
          headerText: best.header.text,
          ariaLabel: best.checkbox.ariaLabel,
          rect: {
            x: Math.round(best.checkbox.rect.x),
            y: Math.round(best.checkbox.rect.y),
            width: Math.round(best.checkbox.rect.width),
            height: Math.round(best.checkbox.rect.height),
          },
        };
      }, { marker, frameIndex })
      .catch(() => null);
    if (candidate) return candidate;
  }
  return {
    found: false,
    reason: 'no-unique-trusted-u-vend-manual-nos-checkbox',
    frameIndex: -1,
    marker,
    checked: null,
    trusted: false,
    score: 0,
    rowText: '',
    headerText: '',
    ariaLabel: '',
    rect: null,
  };
}

async function findManualNosCellPoint(page: Page): Promise<CellPointCandidate> {
  const frameResults = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate(() => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const centerX = (rect: DOMRect) => rect.x + rect.width / 2;
          const centerY = (rect: DOMRect) => rect.y + rect.height / 2;
          const rectJson = (rect: DOMRect) => ({
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });

          const exactUVendCells = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,td,[role="gridcell"]'))
            .filter(visible)
            .map((element) => ({ element, text: normalize(element.innerText || element.textContent), rect: element.getBoundingClientRect() }))
            .filter((entry) => /^U-VEND$/i.test(entry.text) && entry.rect.y > 200);
          if (exactUVendCells.length !== 1) return null;
          const uVendCell = exactUVendCells[0];
          const rowElement = uVendCell.element.closest('[role="row"],tr') as HTMLElement | null;
          const rowRect = rowElement && visible(rowElement) ? rowElement.getBoundingClientRect() : uVendCell.rect;
          const rowText = normalize(rowElement?.innerText || rowElement?.textContent || uVendCell.text);
          if (!/\bU-VEND\b/i.test(rowText)) return null;

          const headerCandidates = Array.from(document.querySelectorAll<HTMLElement>('[role="columnheader"],th,span,div'))
            .filter(visible)
            .map((element) => ({ element, text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label')), rect: element.getBoundingClientRect() }))
            .filter((entry) => /Manuelle\s*Anz|Manual Nos|Man\W*Anz/i.test(entry.text) && entry.rect.y < rowRect.y && entry.text.length <= 100);
          const header = headerCandidates.sort((left, right) => Math.abs(centerX(left.rect) - 1095) - Math.abs(centerX(right.rect) - 1095))[0] || null;
          if (!header) return null;

          const x = Math.round(centerX(header.rect));
          const y = Math.round(centerY(uVendCell.rect));
          if (x < rowRect.x || x > rowRect.x + rowRect.width || y < rowRect.y || y > rowRect.y + rowRect.height) return null;
          return {
            found: true,
            reason: 'exact-u-vend-text-anchor-manual-nos-cell-intersection',
            x,
            y,
            rowText: rowText.slice(0, 220),
            headerText: header.text,
            rowRect: rectJson(rowRect),
            headerRect: rectJson(header.rect),
          };
        })
        .catch(() => null),
    ),
  );
  const candidates = frameResults.filter(Boolean) as CellPointCandidate[];
  if (candidates.length !== 1) {
    return {
      found: false,
      reason: `manual-nos-cell-point-candidate-count-${candidates.length}`,
      x: 0,
      y: 0,
      rowText: '',
      headerText: '',
      rowRect: null,
      headerRect: null,
    };
  }
  return candidates[0];
}

async function clickMarkedManualNosCandidate(page: Page, candidate: CheckboxCandidate) {
  if (!candidate.found || candidate.frameIndex < 0 || candidate.checked === true) {
    return { clicked: false, reason: candidate.checked === true ? 'already-checked' : candidate.reason, before: candidate.checked, after: candidate.checked };
  }
  const frame = page.frames()[candidate.frameIndex];
  if (!frame) return { clicked: false, reason: 'candidate-frame-missing', before: candidate.checked, after: candidate.checked };
  const target = frame.locator(`[data-codex-manual-nos-target="${candidate.marker}"]`).first();
  if (!(await target.isVisible({ timeout: 1000 }).catch(() => false))) {
    return { clicked: false, reason: 'marked-candidate-not-visible', before: candidate.checked, after: candidate.checked };
  }
  await target.click({ timeout: 5000 });
  await page.waitForTimeout(1500);
  const after = await target
    .evaluate((element) => {
      if (element instanceof HTMLInputElement && element.type === 'checkbox') return element.checked;
      const ariaChecked = element.getAttribute('aria-checked');
      if (ariaChecked === 'true') return true;
      if (ariaChecked === 'false') return false;
      return null;
    })
    .catch(() => null);
  return { clicked: true, reason: 'clicked-trusted-u-vend-manual-nos-checkbox', before: candidate.checked, after };
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactSnapshot(page);
  const candidate = await findManualNosCandidate(page);
  const snapshot = {
    step,
    url: sanitizeUrl(page.url()),
    title: clean(await page.title()),
    compact,
    manualNosCandidate: candidate,
    ...extra,
  };
  await writeText(`${filePrefix}.txt`, compact);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nummernserie / No. Series',
    pageId: 456,
    table: 'No. Series',
    tableId: 308,
    step,
    targetSeries: TARGET_SERIES,
    visibleLearning:
      'Die Checkbox Manuelle Anz. / Manual Nos. steuert, ob die Nummernserie U-VEND manuelle Kreditorennummern wie U-VEND-100 zulaesst.',
    importantUi: ['U-VEND row', 'Manuelle Anz. / Manual Nos.', 'Standardnr. / Default Nos.'],
    internallyProves: 'Visible U-VEND Manual Nos candidate state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No vendor exists.', 'No document exists.', 'No Preview Posting or Posting occurred.'],
    qualityDecision: 'manual-nos-controlled-write-gate-evidence',
    ...extra,
  });
  return snapshot;
}

test('TARGET-036D2E enables U-VEND Manual Nos only with trusted row-field proof', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openNumberSeries(page);
  const selectedBefore = await selectUVendRow(page);
  const editListClicked = await clickSafeAction(page, /^Liste bearbeiten$|^Edit List$/i);
  await selectUVendRow(page);
  actionsTaken.push(selectedBefore ? 'Selected U-VEND before Manual Nos diagnosis.' : 'Tried to select U-VEND before Manual Nos diagnosis.');
  actionsTaken.push(editListClicked ? 'Enabled Liste bearbeiten / Edit List before the controlled Manual Nos write gate.' : 'Liste bearbeiten / Edit List was not visible or not clicked.');

  const before = await captureState(page, 'target-036d2e-010-before-u-vend-manual-nos', 'Before U-VEND Manual Nos controlled write gate.', {
    selectedBefore,
    editListClicked,
  });

  const beforeCandidate = before.manualNosCandidate as CheckboxCandidate;
  const manualNosCellPoint = await findManualNosCellPoint(page);
  let clickResult = { clicked: false, reason: beforeCandidate.reason, before: beforeCandidate.checked, after: beforeCandidate.checked as boolean | null };
  if (!beforeCandidate.found || !beforeCandidate.trusted) {
    if (!manualNosCellPoint.found) {
      const viewport = page.viewportSize();
      if (viewport && viewport.width >= 1600 && viewport.height >= 900 && /U-VEND\s+Universaarl Vendor Nos\./i.test(before.compact)) {
        await page.mouse.click(1097, 512);
        await page.waitForTimeout(1500);
        clickResult = {
          clicked: true,
          reason: `screenshot-qa-fixed-visible-cell-coordinate-after-${manualNosCellPoint.reason}`,
          before: beforeCandidate.checked,
          after: null,
        };
        actionsTaken.push('Clicked the screenshot-QA visible U-VEND / Manuelle Anz. cell coordinate after DOM cell discovery was too strict.');
        warnings.push('The final route used a screenshot-QA coordinate fallback; the result is accepted only if the reopen proof shows U-VEND Manual Nos active.');
      } else {
        blockedBy.push(`No trusted U-VEND Manual Nos checkbox or cell candidate: ${beforeCandidate.reason}; ${manualNosCellPoint.reason}.`);
      }
    } else {
      await page.mouse.click(manualNosCellPoint.x, manualNosCellPoint.y);
      await page.waitForTimeout(1500);
      clickResult = {
        clicked: true,
        reason: manualNosCellPoint.reason,
        before: beforeCandidate.checked,
        after: null,
      };
      actionsTaken.push('Clicked the visible U-VEND row / Manuelle Anz. cell intersection after screenshot-confirmed row and header proof.');
    }
  } else if (beforeCandidate.checked === true) {
    actionsTaken.push('U-VEND Manual Nos was already active; no checkbox click was needed.');
  } else {
    clickResult = await clickMarkedManualNosCandidate(page, beforeCandidate);
    if (!clickResult.clicked) blockedBy.push(`Manual Nos checkbox click did not execute: ${clickResult.reason}.`);
    else actionsTaken.push('Clicked only the trusted U-VEND Manuelle Anz. / Manual Nos checkbox candidate.');
  }

  await assertSafeNumberSeriesContext(page);
  const after = await captureState(page, 'target-036d2e-020-after-u-vend-manual-nos-attempt', 'After U-VEND Manual Nos controlled write gate.', {
    clickResult,
  });

  await openNumberSeries(page);
  const selectedReopen = await selectUVendRow(page);
  const reopen = await captureState(page, 'target-036d2e-030-reopen-proof', 'Reopen proof after U-VEND Manual Nos controlled write gate.', {
    selectedReopen,
  });
  const reopenCandidate = reopen.manualNosCandidate as CheckboxCandidate;
  if (reopenCandidate.checked !== true) {
    blockedBy.push('U-VEND Manual Nos is not active after reopen proof.');
  }

  const resultStatus = blockedBy.length === 0 ? 'observed' : 'blocked';
  const now = new Date().toISOString();
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE'
      : 'TARGET-036D2F-U-VEND-MANUAL-NOS-ROUTE-RECOVERY';

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-036D2E-U-VEND-MANUAL-NOS-CONTROLLED-WRITE-GATE',
    lastEvidenceSummary:
      'TARGET-036D2D selected Manual Nos for explicit U-VEND-100-style vendor numbers based on Microsoft Learn and Page 456 field evidence.',
    isPlannedNextCaseStillSensible: true,
    reason: 'The first vendor cannot be created with the planned manual number until U-VEND Manual Nos is active after reopen proof.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason:
          resultStatus === 'observed'
            ? 'U-VEND Manual Nos is active after reopen; vendor U-VEND-100 can be attempted next.'
            : 'Vendor write remains blocked until U-VEND Manual Nos is active.',
      },
      {
        caseId: 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE',
        status: 'ready-after-current',
        reason: 'Item setup can continue after vendor numbering no longer blocks vendor foundation.',
      },
      {
        caseId: 'TARGET-037-MASTERDATA-FOUNDATION-CHECKPOINT',
        status: 'ready-after-current',
        reason: 'Checkpoint is useful only after vendor and item foundation are resolved.',
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Sales process needs master data and posting setup readiness before documents.',
      },
    ],
    queueChangesMade: [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'The immediate blocker for a readable first vendor number is gone; the next narrow step is the vendor card write gate.'
        : 'The setup route is still not proven; recovery must inspect a safer UI route before any vendor attempt.',
    risksBeforeNextCase: resultStatus === 'observed' ? ['Vendor template defaults may still require a separate dialog or posting-group fit.'] : ['Manual Nos route remains ambiguous.'],
    requiredPreparation: resultStatus === 'observed' ? ['Use U-VEND-100 explicitly; do not create documents or post.'] : ['Inspect row/card/personalization route without changing other number series.'],
  };

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-universaarl-vendor-number-series-manual-nos-write-gate',
    resultStatus,
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
        claim: 'Manual Nos. allows users to manually enter numbers for cards or documents using the number series.',
      },
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
      'No other number-series code was intentionally changed.',
      'Standardnr. / Default Nos. was not intentionally changed.',
    ],
    setupChanged: resultStatus === 'observed' && beforeCandidate.checked !== true,
    changedFields:
      resultStatus === 'observed' && beforeCandidate.checked !== true
        ? [
            {
              table: 'No. Series',
              tableId: 308,
              code: TARGET_SERIES,
              field: 'Manual Nos.',
              fieldId: 4,
              before: beforeCandidate.checked,
              after: reopenCandidate.checked,
            },
          ]
        : [],
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036d2e-010-before-u-vend-manual-nos.png',
      'playwright/projects/fibu-book5/img/target-036d2e-020-after-u-vend-manual-nos-attempt.png',
      'playwright/projects/fibu-book5/img/target-036d2e-030-reopen-proof.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-036d2e-u-vend-manual-nos-controlled-write-gate/target-036d2e-010-before-u-vend-manual-nos.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-036d2e-u-vend-manual-nos-controlled-write-gate/target-036d2e-020-after-u-vend-manual-nos-attempt.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-036d2e-u-vend-manual-nos-controlled-write-gate/target-036d2e-030-reopen-proof.snapshot.json',
    ],
    proved:
      resultStatus === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'U-VEND was selected on Page 456 No. Series.',
            'U-VEND Manual Nos. / Manuelle Anz. is active after reopen proof.',
          ]
        : ['Business Central stayed in playthru / UNIVERSAARL-DE.', 'U-VEND was inspected on Page 456 No. Series.'],
    notProved:
      resultStatus === 'observed'
        ? [
            'No vendor exists yet.',
            'No automatic numbering behavior was tested.',
            'No posting, preview or document process was tested.',
            'This is not a full number-series policy review.',
          ]
        : [
            'U-VEND Manual Nos. was not proven active after reopen.',
            'No vendor exists yet.',
            'No posting, preview or document process was tested.',
          ],
    blockedBy,
    warnings,
    flags: {
      noCompanySwitch: true,
      noMasterDataChange: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noApiShortcut: true,
    },
    nextStepDecision,
    nextCase,
    timestamp: now,
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeCase: nextCase,
        activeArea: resultStatus === 'observed' ? 'universaarl-first-vendor-controlled-write-gate' : 'universaarl-vendor-number-series-route-recovery',
        nextStep: nextStepDecision.whySelectedNextCaseIsBest,
      },
      lastRunSummary: {
        runId: CASE_ID,
        completedAt: now,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        bcRun: true,
        setupChanged: resultStatus === 'observed' && beforeCandidate.checked !== true,
        masterDataChanged: false,
        draftCreated: false,
        previewPosting: false,
        posted: false,
        nextCase,
        summary:
          resultStatus === 'observed'
            ? 'U-VEND Manual Nos. is active after reopen proof; first vendor manual number write gate is next.'
            : `U-VEND Manual Nos write gate blocked: ${blockedBy.join('; ')}`,
      },
    },
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Status: ${resultStatus}`,
      '',
      '## Zweck',
      '',
      'Dieser Case prueft die engste Setup-Aenderung fuer die erste Universaarl-Kreditorenanlage: In der Nummernserie `U-VEND` soll `Manuelle Anz.` aktiv sein, damit der erste Kreditor mit der lesbaren Nummer `U-VEND-100` angelegt werden kann.',
      '',
      '## Sicherheitsgrenze',
      '',
      '- Nur Page 456 `Nummernserie`.',
      '- Nur Code `U-VEND`.',
      '- Nur Feld `Manuelle Anz. / Manual Nos.`.',
      '- Keine Stammdaten, keine Belege, kein Preview, kein Posting, kein API Shortcut.',
      '',
      '## Ergebnis',
      '',
      resultStatus === 'observed'
        ? '- `U-VEND` erlaubt manuelle Nummern nach Reopen-Proof.'
        : `- Blockiert: ${blockedBy.join('; ')}`,
      '',
      '## Buchwirkung',
      '',
      resultStatus === 'observed'
        ? 'Im Buch kann jetzt erklaert werden, dass lesbare manuelle Kreditorennummern vorher in der Nummernserie erlaubt werden muessen.'
        : 'Im Buch bleibt die Kreditorenanlage blockiert, bis die sichere Manual-Nos-Route gefunden ist.',
    ].join('\n'),
  );
});
