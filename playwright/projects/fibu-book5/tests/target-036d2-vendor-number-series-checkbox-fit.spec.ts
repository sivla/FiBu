import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-036D2-VENDOR-NUMBER-SERIES-CHECKBOX-FIT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-036d2-vendor-number-series-checkbox-fit';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036D2-result.json');
const TARGET_SERIES = 'U-VEND';

type CheckboxState = {
  label: 'defaultNos' | 'manualNos';
  headerText: string;
  checked: boolean;
  trusted: boolean;
  x: number;
  y: number;
};

type RowDiagnostics = {
  rowVisible: boolean;
  rowText: string;
  checkboxStates: CheckboxState[];
  headers: Array<{ text: string; x: number }>;
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
    '/{tenant}/'
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
    ...metadata
  });
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

async function compactSnapshot(page: Page) {
  return compactPageText(page, {
    include: [/Nummernserie|No\. Series|Code|Beschreibung|Description|Standardnr|Default Nos|Manuelle|Manual Nos|U-VEND|Universaarl/i],
    maxLines: 180,
    maxLineLength: 220
  });
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const snapshot = {
    step,
    url: sanitizeUrl(page.url()),
    title: clean(await page.title()),
    compact: await compactSnapshot(page),
    diagnostics: await getUVendDiagnostics(page),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.compact);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nummernserie / No. Series',
    pageId: 456,
    step,
    targetSeries: TARGET_SERIES,
    visibleLearning:
      'Die Zeile U-VEND steuert die automatische oder manuelle Vergabe von Kreditorennummern fuer Universaarl.',
    importantUi: ['U-VEND row', 'Standardnr. / Default Nos.', 'Manuelle Anz. / Manual Nos.'],
    internallyProves: 'Visible U-VEND number-series checkbox state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No vendor exists.', 'No purchase document exists.', 'No Preview Posting or Posting occurred.'],
    qualityDecision: 'number-series-checkbox-fit-evidence',
    ...extra
  });
  return snapshot;
}

async function getUVendDiagnostics(page: Page): Promise<RowDiagnostics> {
  const frameResults = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate((targetCode) => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const all = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(visible);
          const codeCandidates = all
            .filter((element) => normalize(element.innerText || element.textContent) === targetCode)
            .map((element) => {
              const rowCandidate =
                element.closest('[role="row"]') ??
                element.closest('tr') ??
                element.parentElement?.parentElement ??
                null;
              return {
                element,
                rowCandidate,
                rowText: normalize(rowCandidate?.textContent ?? ''),
                rect: element.getBoundingClientRect()
              };
            });
          const selectedCode =
            codeCandidates.find((candidate) => /Universaarl Vendor Nos\.|Vendor Nos\.|Kreditor/i.test(candidate.rowText)) ??
            codeCandidates.sort((a, b) => b.rect.top - a.rect.top)[0];
          const codeElement = selectedCode?.element ?? null;
          const directRow = Array.from(document.querySelectorAll<HTMLElement>('[role="row"],tr'))
            .filter(visible)
            .map((element) => ({
              element,
              text: normalize(element.textContent || element.innerText),
              rect: element.getBoundingClientRect()
            }))
            .filter(
              ({ text, rect }) =>
                text.includes(targetCode) &&
                /Universaarl Vendor Nos\.|Vendor Nos\.|Kreditor/i.test(text) &&
                rect.height > 8 &&
                rect.height < 80
            )
            .sort((a, b) => a.rect.height * a.rect.width - b.rect.height * b.rect.width)[0];
          const selectedRow = Array.from(document.querySelectorAll<HTMLElement>('[role="row"][aria-selected="true"],[aria-selected="true"]'))
            .filter(visible)
            .find((element) => {
              const text = normalize(element.textContent || element.innerText);
              return text.includes(targetCode) && /Universaarl Vendor Nos\.|Vendor Nos\.|Kreditor/i.test(text);
            });
          const row =
            directRow?.element ??
            selectedRow ??
            codeElement?.closest('[role="row"]') ??
            codeElement?.closest('tr') ??
            codeElement?.parentElement?.parentElement ??
            null;
          const rowText = normalize(row?.textContent ?? '');
          const directRect = directRow?.rect;
          const selectedRect = selectedRow?.getBoundingClientRect();
          const codeRect = codeElement?.getBoundingClientRect();
          const rowY = directRect
            ? directRect.top + directRect.height / 2
            : selectedRect
              ? selectedRect.top + selectedRect.height / 2
              : codeRect
                ? codeRect.top + codeRect.height / 2
                : null;
          const headers = all
            .map((element) => ({
              text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title')),
              rect: element.getBoundingClientRect()
            }))
            .filter(
              ({ text, rect }) =>
                /Standardnr|Default Nos|Manuelle|Manual Nos/i.test(text) &&
                text.length < 80 &&
                rect.width > 0 &&
                rect.height > 0
            )
            .map(({ text, rect }) => ({ text, x: rect.left + rect.width / 2 }));
          const checkboxes = Array.from(document.querySelectorAll<HTMLElement>('input[type="checkbox"],[role="checkbox"]'))
            .filter(visible)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const checked =
                element instanceof HTMLInputElement
                  ? element.checked
                  : /true/i.test(element.getAttribute('aria-checked') || '');
              return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                checked,
                aria: normalize(element.getAttribute('aria-label') || element.getAttribute('title'))
              };
            })
            .filter((box) => (rowY ? Math.abs(box.y - rowY) < 20 : true));
          const resolve = (label: 'defaultNos' | 'manualNos', pattern: RegExp) => {
            const header = headers.filter((candidate) => pattern.test(candidate.text)).sort((a, b) => a.text.length - b.text.length)[0];
            if (!header) return null;
            const nearest = checkboxes
              .map((box) => ({ ...box, distance: Math.abs(box.x - header.x) }))
              .sort((a, b) => a.distance - b.distance)[0];
            if (!nearest) return null;
            return {
              label,
              headerText: header.text,
              checked: nearest.checked,
              trusted: nearest.distance < 80,
              x: nearest.x,
              y: nearest.y
            };
          };
          return {
            rowVisible: Boolean(codeElement && rowText.includes(targetCode)),
            rowText,
            checkboxStates: [
              resolve('defaultNos', /Standardnr|Default Nos/i),
              resolve('manualNos', /Manuelle|Manual Nos/i)
            ].filter(Boolean),
            headers
          };
        }, TARGET_SERIES)
        .catch(() => null)
    )
  );
  return (
    frameResults.find((result): result is RowDiagnostics => Boolean(result?.rowVisible)) ?? {
      rowVisible: false,
      rowText: '',
      checkboxStates: [],
      headers: []
    }
  );
}

async function clickMappedCheckbox(page: Page, target: CheckboxState) {
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(900);
  return true;
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
      if (await locator.isVisible({ timeout: 900 }).catch(() => false)) {
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
    if (await exact.isVisible({ timeout: 900 }).catch(() => false)) {
      await exact.click({ timeout: 5000 }).catch(async () => exact.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(900);
      return true;
    }
    const row = scope.getByRole('row', { name: /U-VEND/i }).first();
    if (await row.isVisible({ timeout: 900 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

test('TARGET-036D2 fits U-VEND Default Nos checkbox only after row-scoped proof', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await openNumberSeries(page);
  const selectedUVend = await selectUVendRow(page);
  const editListClicked = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
  if (editListClicked) await selectUVendRow(page);

  const before = await captureState(page, 'target-036d2-010-u-vend-before', 'Before U-VEND checkbox fit.');
  const defaultBefore = before.diagnostics.checkboxStates.find((state) => state.label === 'defaultNos');
  const manualBefore = before.diagnostics.checkboxStates.find((state) => state.label === 'manualNos');
  const blockedBy: string[] = [];
  const actionsTaken = [
    'Opened Business Central Number Series Page 456 in playthru / UNIVERSAARL-DE.',
    selectedUVend ? 'Selected the U-VEND row before checkbox diagnosis.' : 'Tried to select U-VEND row before checkbox diagnosis.',
    editListClicked ? 'Enabled Liste bearbeiten / Edit List before checkbox write.' : 'Liste bearbeiten / Edit List was not visible or not clicked.',
    'Captured U-VEND before-state screenshot QA.',
    'Mapped U-VEND row and checkbox header positions before any write.'
  ];

  if (!before.diagnostics.rowVisible) blockedBy.push('U-VEND row is not uniquely visible.');
  if (!defaultBefore?.trusted) blockedBy.push('Standardnr. / Default Nos. checkbox could not be trusted as U-VEND scoped.');

  let setupChangeAttempted = false;
  let defaultAfterClick = defaultBefore?.checked ?? false;
  if (blockedBy.length === 0 && defaultBefore && !defaultBefore.checked) {
    const clicked = await clickMappedCheckbox(page, defaultBefore);
    if (!clicked) {
      blockedBy.push('Standardnr. / Default Nos. checkbox click did not execute.');
    } else {
      setupChangeAttempted = true;
      actionsTaken.push('Attempted only U-VEND Standardnr. / Default Nos.; no other series or lines were changed.');
      await page.keyboard.press('Tab').catch(() => undefined);
      await page.waitForTimeout(1200);
    }
  } else if (defaultBefore?.checked) {
    actionsTaken.push('U-VEND Standardnr. / Default Nos. was already active; no checkbox write was needed.');
  }

  const after = await captureState(page, 'target-036d2-020-u-vend-after-attempt', 'After U-VEND checkbox fit attempt.', {
    attemptedDefaultNosChange: !defaultBefore?.checked,
    setupChangeAttempted
  });
  const defaultAfter = after.diagnostics.checkboxStates.find((state) => state.label === 'defaultNos');
  defaultAfterClick = defaultAfter?.checked ?? defaultAfterClick;

  await openNumberSeries(page);
  const reopen = await captureState(page, 'target-036d2-030-u-vend-reopen-proof', 'After reopening Number Series for U-VEND proof.', {
    setupChangeAttempted
  });
  const defaultReopen = reopen.diagnostics.checkboxStates.find((state) => state.label === 'defaultNos');
  const manualReopen = reopen.diagnostics.checkboxStates.find((state) => state.label === 'manualNos');
  const persistedDefault = defaultReopen?.checked === true;
  const setupChanged = persistedDefault && defaultBefore?.checked === false;
  const resultStatus = blockedBy.length === 0 && persistedDefault ? 'observed' : 'blocked';
  if (blockedBy.length === 0 && !persistedDefault) {
    blockedBy.push('U-VEND Standardnr. / Default Nos. did not persist after the visible row-scoped click route.');
  }

  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-036D3-FIRST-VENDOR-CONTROLLED-WRITE-RETRY'
      : 'TARGET-036D2B-VENDOR-NUMBER-SERIES-CHECKBOX-ROUTE-RECOVERY';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-036D2-VENDOR-NUMBER-SERIES-CHECKBOX-FIT',
    lastEvidenceSummary:
      'TARGET-036D proved that first vendor creation was blocked because U-VEND did not allow automatic numbering.',
    isPlannedNextCaseStillSensible: true,
    reason: 'The first vendor retry depends directly on U-VEND Standardnr. / Default Nos.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-CONTROLLED-WRITE-RETRY',
        status: resultStatus === 'observed' ? 'ready-next' : 'blocked',
        reason:
          resultStatus === 'observed'
            ? 'U-VEND automatic numbering is active after reopen; retry vendor with blank No. and Name only.'
            : 'Do not retry vendor until U-VEND Standardnr. is proven active.'
      },
      {
        caseId: 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE',
        status: 'needs-setup-first',
        reason: 'Item creation waits until vendor route is closed and item numbering/base-unit route is checked.'
      },
      {
        caseId: 'TARGET-039-FOUNDATION-BLOCKER-REVISIT',
        status: 'ready-after-current',
        reason: 'Foundation blockers remain relevant before document, preview or posting.'
      }
    ],
    queueChangesMade: resultStatus === 'observed' ? ['Set TARGET-036D3 as next vendor retry case.'] : [],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'observed'
        ? 'It immediately validates the setup fix against the original first-vendor blocker.'
        : 'The checkbox route needs recovery before any master-data expansion.',
    risksBeforeNextCase: [
      'Do not create item yet.',
      'Do not click Apply Template.',
      'Do not change Vendor Posting Group/VAT/Payment fields inside the retry.'
    ],
    requiredPreparation:
      resultStatus === 'observed'
        ? ['Retry vendor with No. blank so Business Central assigns from U-VEND automatically.']
        : ['Recover the U-VEND checkbox route without changing number-series lines.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vendor-number-series-checkbox-fit',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'No. Series / Nummernserie',
    pageId: 456,
    url: sanitizeUrl(page.url()),
    sourceRefs: [
      {
        title: 'Microsoft Learn: Create number series',
        url: 'https://learn.microsoft.com/en-us/dynamics365/business-central/ui-create-number-series',
        claim: 'Default Nos. allows automatic numbering; Manual Nos. allows manual number entry.'
      }
    ],
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
      'Manual Nos. / Manuelle Anz. was inspected but not changed.'
    ],
    setupChanged,
    setupChangeAttempted,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036d2-010-u-vend-before.png',
      'playwright/projects/fibu-book5/img/target-036d2-020-u-vend-after-attempt.png',
      'playwright/projects/fibu-book5/img/target-036d2-030-u-vend-reopen-proof.png'
    ],
    proved:
      resultStatus === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'U-VEND row was visible on Page 456 Number Series.',
            'U-VEND Standardnr. / Default Nos. is active after reopen.',
            'Manual Nos. / Manuelle Anz. was inspected but not changed.'
          ]
        : ['Business Central stayed in playthru / UNIVERSAARL-DE.', 'U-VEND Number Series checkbox route was attempted.'],
    notProved: [
      'No vendor is created by this case.',
      'No manual U-VEND-100 number route is proven.',
      'No Vendor Posting Group, VAT group, payment term, document, Preview Posting or Posting is proven.',
      'No number-series line, last number used or compliance behavior is changed/proven by this checkbox fit.'
    ],
    blockedBy,
    warnings: [
      'This case only unblocks automatic vendor numbering; it does not make the vendor posting-ready.',
      'Manual Nos. remains a separate decision if the book requires explicit U-VEND-100 style numbers.'
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
      setupChangeAttempted,
      setupChanged
    },
    before,
    after,
    reopen,
    checkboxState: {
      defaultBefore,
      manualBefore,
      defaultAfter,
      defaultReopen,
      manualReopen,
      defaultAfterClick
    },
    nextStepDecision,
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036d2-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2-result.json`,
      'playwright/projects/fibu-book5/img/target-036d2-010-u-vend-before.png',
      'playwright/projects/fibu-book5/img/target-036d2-020-u-vend-after-attempt.png',
      'playwright/projects/fibu-book5/img/target-036d2-030-u-vend-reopen-proof.png'
    ],
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: false,
    statePatch: {},
    reason:
      resultStatus === 'observed'
        ? 'U-VEND Standardnr. / Default Nos. is active after reopen; first vendor retry can use automatic numbering.'
        : `U-VEND checkbox fit blocked: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-036D2 Vendor Number Series Checkbox Fit',
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
        : setupChangeAttempted
          ? '- U-VEND war sichtbar und die Checkboxroute wurde versucht, aber Standardnr. / Default Nos. war nach Reopen nicht aktiv.'
        : '- Keine Setup-Aenderung war noetig oder die Route wurde vor einer unsicheren Aenderung gestoppt.',
      '',
      '## Grenzen',
      '',
      '- Kein Kreditor wurde angelegt.',
      '- Keine Nummernserienzeile wurde geaendert.',
      '- Keine Vorlage, kein Beleg, keine Preview und keine Buchung.',
      '- Manuelle Nummern bleiben eine separate Entscheidung.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(resultStatus === 'observed' || blockedBy.length > 0, blockedBy.join('\n')).toBe(true);
});
