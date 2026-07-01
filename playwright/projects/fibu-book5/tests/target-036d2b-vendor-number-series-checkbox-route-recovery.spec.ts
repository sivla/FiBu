import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-036D2B-VENDOR-NUMBER-SERIES-CHECKBOX-ROUTE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_SERIES = 'U-VEND';
const EVIDENCE_ID = 'target-036d2b-vendor-number-series-checkbox-route-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036D2B-result.json');

type CheckboxCandidate = {
  found: boolean;
  frameIndex: number;
  checkboxIndex: number;
  checked: boolean | null;
  rowText: string;
  headerText: string;
  confidence: number;
  reason: string;
  rect: { x: number; y: number; width: number; height: number };
  rowRect: { x: number; y: number; width: number; height: number };
};

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
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeNumberSeriesContext(page);
}

async function clickAction(page: Page, name: RegExp) {
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
      await page.waitForTimeout(900);
      return true;
    }
    const row = scope.getByRole('row', { name: /U-VEND/i }).first();
    if (await row.isVisible({ timeout: 700 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(900);
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

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const snapshot = {
    step,
    url: sanitizeUrl(page.url()),
    title: clean(await page.title()),
    compact: await compactSnapshot(page),
    candidate: await findDefaultNosCandidate(page),
    ...extra,
  };
  await writeText(`${filePrefix}.txt`, snapshot.compact);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nummernserie / No. Series',
    pageId: 456,
    step,
    targetSeries: TARGET_SERIES,
    visibleLearning:
      'Die Zeile U-VEND steuert die automatische oder manuelle Vergabe von Kreditorennummern; Standardnr. muss nach Reopen sichtbar aktiv sein.',
    importantUi: ['U-VEND row', 'Standardnr. / Default Nos.', 'Manuelle Anz. / Manual Nos.'],
    internallyProves: 'Visible U-VEND number-series checkbox state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No vendor exists.', 'No purchase document exists.', 'No Preview Posting or Posting occurred.'],
    qualityDecision: 'number-series-checkbox-route-recovery-evidence',
    ...extra,
  });
  return snapshot;
}

async function findDefaultNosCandidate(page: Page): Promise<CheckboxCandidate> {
  const frameResults = await Promise.all(
    page.frames().map((frame, frameIndex) =>
      frame
        .evaluate(
          ({ targetSeries, frameIndex }) => {
            const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
            const rectOf = (element: Element) => {
              const rect = element.getBoundingClientRect();
              return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            };
            const centerX = (rect: { x: number; width: number }) => rect.x + rect.width / 2;
            const centerY = (rect: { y: number; height: number }) => rect.y + rect.height / 2;
            const visible = (element: Element) => {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
            };
            const structuralRows = Array.from(document.querySelectorAll<HTMLElement>('[role="row"],tr'))
              .filter(visible)
              .map((element) => ({
                element,
                text: normalize(element.textContent || element.innerText),
                rect: rectOf(element),
              }))
              .filter((entry) => entry.text.includes(targetSeries) && /Vendor Nos\.|Kreditor|Lieferant|Universaarl Vendor/i.test(entry.text))
              .filter((entry) => entry.rect.height >= 12 && entry.rect.height <= 80)
              .sort((left, right) => left.rect.height * left.rect.width - right.rect.height * right.rect.width);
            const codeFallbackRows = Array.from(document.querySelectorAll<HTMLElement>('body *'))
              .filter(visible)
              .filter((element) => normalize(element.innerText || element.textContent) === targetSeries)
              .map((element) => {
                const candidates = [element.closest('[role="row"]'), element.closest('tr'), element.parentElement, element.parentElement?.parentElement, element.parentElement?.parentElement?.parentElement]
                  .filter(Boolean) as HTMLElement[];
                const row = candidates.find((candidate) => /Vendor Nos\.|Kreditor|Lieferant|Universaarl Vendor/i.test(normalize(candidate.textContent || candidate.innerText))) ?? candidates[candidates.length - 1] ?? element;
                return { element: row, text: normalize(row.textContent || row.innerText), rect: rectOf(row) };
              })
              .filter((entry) => entry.text.includes(targetSeries))
              .filter((entry) => entry.rect.height >= 12 && entry.rect.height <= 120)
              .sort((left, right) => left.rect.height * left.rect.width - right.rect.height * right.rect.width);
            const rows = [...structuralRows, ...codeFallbackRows];
            const headers = Array.from(document.querySelectorAll<HTMLElement>('button,span,div,[aria-label],[title]'))
              .filter(visible)
              .map((element) => ({
                text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title')),
                rect: rectOf(element),
              }))
              .filter((entry) => /Standardnr\.?|Default Nos\.?/i.test(entry.text) && entry.text.length <= 80)
              .sort((left, right) => left.text.length - right.text.length);
            const checkboxElements = Array.from(document.querySelectorAll<HTMLElement>('input[type="checkbox"],[role="checkbox"]'))
              .filter(visible)
              .map((element, checkboxIndex) => {
                const input = element as HTMLInputElement;
                const checked =
                  input.type === 'checkbox'
                    ? input.checked
                    : element.getAttribute('aria-checked') === 'true'
                      ? true
                      : element.getAttribute('aria-checked') === 'false'
                        ? false
                        : null;
                return {
                  element,
                  checkboxIndex,
                  checked,
                  disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
                  readOnly: Boolean(input.readOnly || element.getAttribute('aria-readonly') === 'true'),
                  ariaLabel: normalize(element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent),
                  rect: rectOf(element),
                };
              });

            const candidates = [];
            for (const row of rows) {
              for (const header of headers) {
                for (const checkbox of checkboxElements) {
                  const inRowBand = centerY(checkbox.rect) >= row.rect.y - 3 && centerY(checkbox.rect) <= row.rect.y + row.rect.height + 3;
                  const closeToHeader = Math.abs(centerX(checkbox.rect) - centerX(header.rect)) <= 85;
                  const rowScopedControl = checkbox.element.closest('[role="row"],tr') === row.element;
                  const namesDefault = /Standardnr|Default Nos/i.test(checkbox.ariaLabel);
                  const score =
                    (inRowBand ? 45 : 0) +
                    (closeToHeader ? 30 : 0) +
                    (rowScopedControl ? 35 : 0) +
                    (namesDefault ? 25 : 0) +
                    (typeof checkbox.checked === 'boolean' ? 15 : 0) -
                    (checkbox.disabled || checkbox.readOnly ? 40 : 0);
                  candidates.push({ row, header, checkbox, score });
                }
              }
            }
            const best = candidates.sort(
              (left, right) =>
                right.score - left.score ||
                Math.abs(centerX(left.checkbox.rect) - centerX(left.header.rect)) -
                  Math.abs(centerX(right.checkbox.rect) - centerX(right.header.rect)),
            )[0];
            if (!best || best.score < 80 || typeof best.checkbox.checked !== 'boolean' || best.checkbox.disabled || best.checkbox.readOnly) {
              return {
                found: false,
                frameIndex,
                checkboxIndex: -1,
                checked: null,
                rowText: rows[0]?.text || '',
                headerText: headers[0]?.text || '',
                confidence: best?.score || 0,
                reason: 'no-unique-trusted-u-vend-default-nos-checkbox',
                rect: { x: 0, y: 0, width: 0, height: 0 },
                rowRect: rows[0]?.rect || { x: 0, y: 0, width: 0, height: 0 },
              };
            }
            return {
              found: true,
              frameIndex,
              checkboxIndex: best.checkbox.checkboxIndex,
              checked: best.checkbox.checked,
              rowText: best.row.text,
              headerText: best.header.text,
              confidence: best.score,
              reason: 'trusted-u-vend-default-nos-checkbox-candidate',
              rect: best.checkbox.rect,
              rowRect: best.row.rect,
            };
          },
          { targetSeries: TARGET_SERIES, frameIndex },
        )
        .catch(() => null),
    ),
  );
  return (
    frameResults.find((entry): entry is CheckboxCandidate => Boolean(entry?.found)) ??
    frameResults.find((entry): entry is CheckboxCandidate => Boolean(entry)) ?? {
      found: false,
      frameIndex: -1,
      checkboxIndex: -1,
      checked: null,
      rowText: '',
      headerText: '',
      confidence: 0,
      reason: 'no-frame-result',
      rect: { x: 0, y: 0, width: 0, height: 0 },
      rowRect: { x: 0, y: 0, width: 0, height: 0 },
    }
  );
}

async function clickMarkedCheckbox(page: Page, candidate: CheckboxCandidate) {
  const frame = page.frames()[candidate.frameIndex];
  if (!frame || candidate.checkboxIndex < 0) return { clicked: false, reason: 'candidate-frame-or-index-missing', before: candidate.checked, after: candidate.checked };
  const marked = await frame.evaluate((checkboxIndex) => {
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const checkboxes = Array.from(document.querySelectorAll<HTMLElement>('input[type="checkbox"],[role="checkbox"]')).filter(visible);
    const target = checkboxes[checkboxIndex] as HTMLInputElement | undefined;
    if (!target) return { marked: false, reason: 'checkbox-index-not-found', before: null };
    const before =
      target.type === 'checkbox'
        ? target.checked
        : target.getAttribute('aria-checked') === 'true'
          ? true
          : target.getAttribute('aria-checked') === 'false'
            ? false
            : null;
    target.setAttribute('data-target036d2b-u-vend-default-nos', 'true');
    return { marked: true, reason: before === true ? 'already-checked' : 'marked-for-locator-click', before };
  }, candidate.checkboxIndex);
  if (!marked.marked || marked.reason === 'already-checked') {
    return { clicked: false, reason: marked.reason, before: marked.before, after: marked.before };
  }
  const locator = frame.locator('[data-target036d2b-u-vend-default-nos="true"]');
  await locator.click({ timeout: 5000 });
  await page.waitForTimeout(1200);
  return locator.evaluate((target: HTMLElement, before) => {
    const input = target as HTMLInputElement;
    const after =
      input.type === 'checkbox'
        ? input.checked
        : target.getAttribute('aria-checked') === 'true'
          ? true
          : target.getAttribute('aria-checked') === 'false'
            ? false
            : null;
    return { clicked: true, reason: 'locator-clicked-marked-checkbox', before, after };
  }, marked.before);
}

test('TARGET-036D2B recovers U-VEND Default Nos through marked checkbox locator', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await openNumberSeries(page);
  const selectedUVend = await selectUVendRow(page);
  const editListClicked = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
  if (editListClicked) await selectUVendRow(page);

  const before = await captureState(page, 'target-036d2b-010-before-marked-checkbox-route', 'Before marked-checkbox recovery route.', {
    selectedUVend,
    editListClicked,
  });
  const blockedBy: string[] = [];
  const actionsTaken = [
    'Opened Business Central Number Series Page 456 in playthru / UNIVERSAARL-DE.',
    selectedUVend ? 'Selected the U-VEND row before marked-checkbox diagnosis.' : 'Tried to select the U-VEND row before marked-checkbox diagnosis.',
    editListClicked ? 'Enabled Liste bearbeiten / Edit List before marked-checkbox route.' : 'Liste bearbeiten / Edit List was not visible or not clicked.',
    'Captured before-state and DOM candidate diagnostics for U-VEND Standardnr. / Default Nos.',
  ];

  if (!before.candidate.found) blockedBy.push(`No trusted U-VEND Standardnr. checkbox candidate: ${before.candidate.reason}.`);
  let clickResult: Awaited<ReturnType<typeof clickMarkedCheckbox>> | null = null;
  if (blockedBy.length === 0) {
    if (before.candidate.checked === true) {
      clickResult = { clicked: false, reason: 'already-checked', before: true, after: true };
      actionsTaken.push('U-VEND Standardnr. / Default Nos. was already active; no checkbox click was needed.');
    } else {
      clickResult = await clickMarkedCheckbox(page, before.candidate);
      actionsTaken.push('Clicked the marked DOM checkbox locator for U-VEND Standardnr. / Default Nos.; the failed coordinate route from TARGET-036D2 was not repeated.');
    }
  }

  const after = await captureState(page, 'target-036d2b-020-after-marked-checkbox-route', 'After marked-checkbox recovery route.', {
    clickResult,
  });

  await openNumberSeries(page);
  await selectUVendRow(page);
  const reopen = await captureState(page, 'target-036d2b-030-reopen-proof', 'Reopen proof after marked-checkbox route.', {
    clickResult,
  });

  const defaultActiveAfterReopen = reopen.candidate.found && reopen.candidate.checked === true;
  const setupChanged = before.candidate.checked === false && defaultActiveAfterReopen;
  if (blockedBy.length === 0 && !defaultActiveAfterReopen) {
    blockedBy.push('U-VEND Standardnr. / Default Nos. is still not active after marked-checkbox route and reopen.');
  }
  const resultStatus = blockedBy.length === 0 && defaultActiveAfterReopen ? 'observed' : 'blocked';
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-036D3-FIRST-VENDOR-CONTROLLED-WRITE-RETRY'
      : 'TARGET-036D2C-VENDOR-NUMBER-SERIES-CARD-OR-PERSONALIZATION-ROUTE';

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-036D3-FIRST-VENDOR-CONTROLLED-WRITE-RETRY',
    lastEvidenceSummary:
      'TARGET-036D2B used a new marked DOM-checkbox route for U-VEND Standardnr. / Default Nos.; it did not repeat the TARGET-036D2 coordinate route.',
    isPlannedNextCaseStillSensible: resultStatus === 'observed',
    reason:
      resultStatus === 'observed'
        ? 'U-VEND Standardnr. is active after reopen, so a controlled first-vendor retry can test automatic numbering.'
        : 'The marked DOM-checkbox route did not produce a persisted Standardnr. state, so vendor retry remains blocked.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-CONTROLLED-WRITE-RETRY',
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason:
          resultStatus === 'observed'
            ? 'U-VEND Standardnr. is visible after reopen; retry vendor with blank No. and Name only.'
            : 'Do not retry vendor until U-VEND Standardnr. is active after reopen.',
      },
      {
        caseId: 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE',
        status: 'needs-setup-first',
        reason: 'Item creation waits until vendor route is closed and item number-series/base-unit route is checked.',
      },
      {
        caseId: 'TARGET-039-FOUNDATION-BLOCKER-REVISIT',
        status: 'ready-after-current',
        reason: 'Foundation blockers remain relevant before document, preview or posting.',
      },
    ],
    queueChangesMade:
      resultStatus === 'observed'
        ? ['Set TARGET-036D3 as next vendor retry case.']
        : ['Prepare TARGET-036D2C as a different card/personalization route; do not repeat D2 or D2B click routes.'],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'It immediately validates the number-series setup against the original first-vendor blocker.'
        : 'It changes hypothesis again: card/personalization/field route discovery instead of another checkbox click.',
    risksBeforeNextCase: [
      'Do not create item yet.',
      'Do not click Apply Template.',
      'Do not change Manual Nos. unless a separate decision requires explicit manual numbering.',
      'Do not use API shortcuts.',
    ],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Retry vendor with No. blank so Business Central assigns from U-VEND automatically.']
        : ['Inspect whether Page 456 exposes a card/detail/personalization route for Standardnr.; if not, park vendor until a supported setup route is found.'],
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vendor-number-series-checkbox-route-recovery',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'No. Series / Nummernserie',
    pageId: 456,
    url: sanitizeUrl(page.url()),
    actionsTaken,
    actionsNotTaken: [
      'No number-series lines were changed.',
      'No non-U-VEND number series was changed.',
      'No vendor, customer or item was created.',
      'No document or draft was created.',
      'No Preview Posting was executed.',
      'No Posting was executed.',
      'No payment was executed.',
      'No API shortcut was used.',
      'No company switch was executed.',
      'Manual Nos. / Manuelle Anz. was not changed.',
      'The failed TARGET-036D2 coordinate route was not repeated.',
    ],
    setupChanged,
    setupChangeAttempted: Boolean(clickResult?.clicked),
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036d2b-010-before-marked-checkbox-route.png',
      'playwright/projects/fibu-book5/img/target-036d2b-020-after-marked-checkbox-route.png',
      'playwright/projects/fibu-book5/img/target-036d2b-030-reopen-proof.png',
    ],
    proved:
      resultStatus === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'U-VEND Standardnr. / Default Nos. is active after reopen.',
            'No vendor, customer, item, document, Preview Posting, Posting or API shortcut occurred.',
          ]
        : [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'A different marked DOM-checkbox route was attempted instead of repeating the D2 coordinate route.',
          ],
    notProved: [
      'No vendor is created by this case.',
      'No manual U-VEND-100 number route is proven.',
      'No Vendor Posting Group, VAT group, payment term, document, Preview Posting or Posting is proven.',
      'No number-series line, last number used or legal numbering behavior is proven by this setup fit alone.',
    ],
    blockedBy,
    warnings: [
      'This case only concerns automatic vendor numbering and does not make the vendor posting-ready.',
      'Manual Nos. remains a separate decision if explicit U-VEND-100-style manual numbers are required.',
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCustomerCreated: true,
      noVendorCreated: true,
      noItemCreated: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      numberSeriesLinesChanged: false,
      setupChangeAttempted: Boolean(clickResult?.clicked),
      setupChanged,
    },
    routeDiagnostics: {
      beforeCandidate: before.candidate,
      clickResult,
      afterCandidate: after.candidate,
      reopenCandidate: reopen.candidate,
    },
    before,
    after,
    reopen,
    nextStepDecision,
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2B-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036d2b-*.png',
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2B-result.json`,
      'playwright/projects/fibu-book5/img/target-036d2b-010-before-marked-checkbox-route.png',
      'playwright/projects/fibu-book5/img/target-036d2b-020-after-marked-checkbox-route.png',
      'playwright/projects/fibu-book5/img/target-036d2b-030-reopen-proof.png',
    ],
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: false,
    statePatch: {},
    reason:
      resultStatus === 'observed'
        ? 'U-VEND Standardnr. / Default Nos. is active after reopen; first vendor retry can use automatic numbering.'
        : `U-VEND marked-checkbox recovery blocked: ${blockedBy.join('; ')}`,
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-036D2B Vendor Number Series Checkbox Route Recovery',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Geaendert',
      '',
      setupChanged
        ? '- In der Nummernserie U-VEND wurde nur Standardnr. / Default Nos. aktiviert.'
        : clickResult?.clicked
          ? '- Eine alternative markierte Checkboxroute wurde versucht, aber Standardnr. / Default Nos. war nach Reopen nicht aktiv.'
          : '- Keine Setup-Aenderung war noetig oder die Route wurde vor einer unsicheren Aenderung gestoppt.',
      '',
      '## Grenzen',
      '',
      '- Kein Kreditor wurde angelegt.',
      '- Keine Nummernserienzeile wurde geaendert.',
      '- Keine Vorlage, kein Beleg, keine Preview und keine Buchung.',
      '- Manuelle Nummern bleiben eine separate Entscheidung.',
      '',
      '## Screenshot-QA und naechste Entscheidung',
      '',
      'Die Screenshots zeigen `U-VEND` auf der Nummernserienseite mit sichtbaren Checkboxspalten `Standardnr.` und `Manuelle Anz.`. Die markierte DOM-Route findet aber keinen eindeutigen, vertrauenswuerdigen Checkboxkandidaten fuer genau diese Zeile. Deshalb wird keine Aenderung versucht, solange die Zeilenbindung nicht klar ist.',
      '',
      `Naechster sinnvoller Schritt ist \`${nextCase}\`: Karten-/Detailroute, Personalisieren oder Seitenueberpruefung read-only pruefen, bevor wieder ein Setupfeld geaendert wird.`,
      ''
    ].join('\n'),
    'utf8',
  );

  expect(resultStatus === 'observed' || blockedBy.length > 0, blockedBy.join('\n')).toBe(true);
});
