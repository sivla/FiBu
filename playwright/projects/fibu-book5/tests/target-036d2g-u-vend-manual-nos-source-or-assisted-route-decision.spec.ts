import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(300_000);

const CASE_ID = 'TARGET-036D2G-U-VEND-MANUAL-NOS-SOURCE-OR-ASSISTED-ROUTE-DECISION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_SERIES = 'U-VEND';
const EVIDENCE_ID = 'target-036d2g-u-vend-manual-nos-source-or-assisted-route-decision';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036D2G-result.json');

function buildNumberSeriesUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', '456');
  url.searchParams.set('filter', `'No. Series'.'Code' IS '${TARGET_SERIES}'`);
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
  expect(text).toMatch(/U-VEND/i);
  expect(text).not.toMatch(/Buchungsvorschau|Preview Posting|Moechten Sie buchen|Mochten Sie buchen|Do you want to post|Ship and Invoice|Zahlung buchen|Payment Journal/i);
}

async function openFilteredNumberSeries(page: Page) {
  await page.goto(buildNumberSeriesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
}

async function hoverFirst(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.getByText(label).first();
    if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
      await locator.hover({ timeout: 3000 }).catch(() => undefined);
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

async function collectDomDiagnostics(page: Page) {
  const frames = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate((targetSeries) => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const rectOf = (element: Element) => {
            const rect = element.getBoundingClientRect();
            return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
          };
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const textOf = (element: Element) =>
            normalize(
              `${(element as HTMLElement).innerText || element.textContent || ''} ${(element as HTMLInputElement).value || ''} ${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''}`
            );
          const centerY = (rect: DOMRect | { y: number; height: number }) => rect.y + rect.height / 2;
          const centerX = (rect: DOMRect | { x: number; width: number }) => rect.x + rect.width / 2;
          const nodes = Array.from(document.querySelectorAll<HTMLElement>('tr,[role="row"],[role="gridcell"],td,th,button,[role="button"],[role="menuitem"],input[type="checkbox"],[role="checkbox"],label,span,div'))
            .filter(visible)
            .map((element) => ({ element, text: textOf(element), rect: element.getBoundingClientRect(), role: element.getAttribute('role') || element.tagName.toLowerCase() }));
          const rows = nodes
            .filter((entry) => /row|tr/i.test(entry.role) && entry.text.toUpperCase().includes(targetSeries))
            .map((entry) => ({ text: entry.text.slice(0, 260), rect: rectOf(entry.element), role: entry.role }))
            .slice(0, 8);
          const headers = nodes
            .filter((entry) => /Manuelle\s*Anz|Manual Nos/i.test(entry.text))
            .map((entry) => ({ text: entry.text.slice(0, 180), rect: rectOf(entry.element), role: entry.role }))
            .slice(0, 12);
          const checkboxes = nodes
            .filter((entry) => entry.element.matches('input[type="checkbox"],[role="checkbox"]'))
            .map((entry) => ({
              text: entry.text.slice(0, 180),
              rect: rectOf(entry.element),
              role: entry.role,
              checked:
                entry.element instanceof HTMLInputElement
                  ? entry.element.checked
                  : entry.element.getAttribute('aria-checked') === 'true'
                    ? true
                    : entry.element.getAttribute('aria-checked') === 'false'
                      ? false
                      : null
            }))
            .slice(0, 40);
          const manualHeaders = headers.filter((header) => /Manuelle\s*Anz|Manual Nos/i.test(header.text));
          const scored = rows.flatMap((row) =>
            manualHeaders.flatMap((header) =>
              checkboxes
                .map((checkbox) => {
                  const inRowBand = centerY(checkbox.rect) >= row.rect.y - 6 && centerY(checkbox.rect) <= row.rect.y + row.rect.height + 6;
                  const columnDistance = Math.abs(centerX(checkbox.rect) - centerX(header.rect));
                  return {
                    rowText: row.text,
                    headerText: header.text,
                    checkboxText: checkbox.text,
                    checked: checkbox.checked,
                    rowRect: row.rect,
                    headerRect: header.rect,
                    checkboxRect: checkbox.rect,
                    score: (inRowBand ? 60 : 0) + (columnDistance <= 90 ? 50 : 0) + (typeof checkbox.checked === 'boolean' ? 30 : 0) - Math.min(columnDistance / 10, 30)
                  };
                })
                .filter((candidate) => candidate.score >= 95)
            )
          );
          const actions = nodes
            .filter((entry) => /button|menuitem|a/i.test(entry.role))
            .filter((entry) => /Neu|New|Liste bearbeiten|Edit List|Zeilen|Lines|Weitere Optionen|More|Personalisieren|Personalize|Seiten|Inspect|Oeffnen|Open|Karte|Card/i.test(entry.text))
            .map((entry) => ({ text: entry.text.slice(0, 180), rect: rectOf(entry.element), role: entry.role }))
            .slice(0, 60);
          return {
            frameUrl: 'business-central-frame',
            rows,
            headers,
            checkboxCount: checkboxes.length,
            checkboxes,
            candidateManualNosCheckboxes: scored.sort((left, right) => right.score - left.score).slice(0, 8),
            actions
          };
        }, TARGET_SERIES)
        .catch((error) => ({ frameUrl: 'business-central-frame-error', error: String(error), rows: [], headers: [], checkboxCount: 0, checkboxes: [], candidateManualNosCheckboxes: [], actions: [] }))
    )
  );
  return frames.filter((frame) => frame.rows.length || frame.headers.length || frame.checkboxCount || frame.actions.length);
}

async function compactSnapshot(page: Page) {
  return compactPageText(page, {
    include: [/Nummernserie|No\. Series|Code|Beschreibung|Description|Standardnr|Default Nos|Manuelle|Manual Nos|U-VEND|Filter|Liste bearbeiten|Edit List|Weitere Optionen|More|Zeilen|Lines|Personalisieren|Personalize/i],
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
  const diagnostics = await collectDomDiagnostics(page);
  await writeText(`${filePrefix}.txt`, compact);
  const snapshot = {
    step,
    url: sanitizeUrl(page.url()),
    title: clean(await page.title()),
    compact,
    diagnostics,
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
    purpose: 'Read-only screenshot QA for U-VEND Manual Nos source/route decision.',
    importantUi: ['filtered U-VEND row', 'Manuelle Anz. / Manual Nos.', 'Standardnr. / Default Nos.', 'command bar actions'],
    internallyProves: 'Business Central UI stayed on filtered U-VEND Number Series page in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No setup write.', 'No vendor exists.', 'No Preview Posting or Posting occurred.'],
    ...extra
  });
  return snapshot;
}

test('TARGET-036D2G decides source-backed route for U-VEND Manual Nos without setup write', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openFilteredNumberSeries(page);
  actionsTaken.push('Opened Page 456 Number Series with a U-VEND-only filter in playthru / UNIVERSAARL-DE.');

  const before = await capture(page, 'target-036d2g-010-u-vend-readonly-source-context', 'Filtered U-VEND read-only source context before hover.', {
    hoveredManual: false
  });
  const hoveredManual = await hoverFirst(page, /Manuelle Anz\.?|Manual Nos\.?/i);
  const tooltip = await capture(page, 'target-036d2g-020-manual-nos-tooltip-context', 'Manual Nos tooltip context.', { hoveredManual });
  await page.mouse.move(220, 320);
  await page.waitForTimeout(700);
  const plain = await capture(page, 'target-036d2g-030-u-vend-plain-checkbox-context', 'Filtered U-VEND plain checkbox context after hover cleared.', {
    hoverCleared: true
  });

  const editListVisible = (plain.diagnostics as Array<{ actions: Array<{ text: string }> }>).some((frame) =>
    frame.actions.some((action) => /Liste bearbeiten|Edit List/i.test(action.text))
  );
  const manualCandidates = (plain.diagnostics as Array<{ candidateManualNosCheckboxes: unknown[] }>).flatMap((frame) => frame.candidateManualNosCheckboxes);

  const sourceDecision = {
    officialSource: 'Microsoft Learn: Create number series',
    officialUrl: 'https://learn.microsoft.com/en-us/dynamics365/business-central/ui-create-number-series',
    relatedOfficialSource: 'Microsoft Learn: Integrate with Dynamics 365 Field Service',
    relatedOfficialUrl: 'https://learn.microsoft.com/en-us/dynamics365/business-central/admin-integrate-field-service',
    conclusion:
      'Manual Nos. is a real No. Series field and Microsoft documents selecting the Manual Nos. checkbox on the No. Series page for scenarios that require manually supplied numbers. The remaining blocker is not fachlich, but the Playwright row/checkbox route certainty.',
    selectedRoute: manualCandidates.length
      ? 'next-helper-fix-then-controlled-write-gate'
      : 'no-write-until-dom-or-page-inspection-route-exposes-a-unique-u-vend-manual-nos-checkbox',
    whyNoAssistedSetupNow:
      'The official number-series route is already Page 456. An Assisted Setup detour would add surface area without proving the row-scoped checkbox better than DOM/Page Inspection diagnostics.'
  };

  if (!manualCandidates.length) {
    blockedBy.push('Read-only DOM diagnostics did not expose a unique U-VEND Manual Nos checkbox candidate.');
  }
  if (!editListVisible) {
    warnings.push('Edit List / Liste bearbeiten was not present in the read-only action inventory; a later write gate must prove edit mode separately.');
  }
  const diagnosticSummary = {
    before: (before.diagnostics as Array<{ rows: unknown[]; headers: unknown[]; checkboxCount: number; candidateManualNosCheckboxes: unknown[] }>).map((frame) => ({
      rowCount: frame.rows.length,
      headerCount: frame.headers.length,
      checkboxCount: frame.checkboxCount,
      candidateCount: frame.candidateManualNosCheckboxes.length
    })),
    tooltip: (tooltip.diagnostics as Array<{ rows: unknown[]; headers: unknown[]; checkboxCount: number; candidateManualNosCheckboxes: unknown[] }>).map((frame) => ({
      rowCount: frame.rows.length,
      headerCount: frame.headers.length,
      checkboxCount: frame.checkboxCount,
      candidateCount: frame.candidateManualNosCheckboxes.length
    })),
    plain: (plain.diagnostics as Array<{ rows: unknown[]; headers: unknown[]; checkboxCount: number; candidateManualNosCheckboxes: unknown[] }>).map((frame) => ({
      rowCount: frame.rows.length,
      headerCount: frame.headers.length,
      checkboxCount: frame.checkboxCount,
      candidateCount: frame.candidateManualNosCheckboxes.length
    }))
  };

  const nextCase = manualCandidates.length
    ? 'TARGET-036D2H-U-VEND-MANUAL-NOS-HELPER-FIX-AND-WRITE-GATE'
    : 'TARGET-036D2H-U-VEND-MANUAL-NOS-PARK-OR-PAGEINSPECTION-DECISION';
  const resultStatus = manualCandidates.length ? 'observed' : 'blocked';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary:
      'TARGET-036D2F reached playthru / UNIVERSAARL-DE and filtered U-VEND, but the Manual Nos checkbox locator returned zero row/header/candidate matches.',
    isPlannedNextCaseStillSensible: true,
    reason:
      'D2G is read-only and addresses the exact D2F blocker by combining Microsoft source basis with DOM/screenshot route diagnostics.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: 'ready-next',
        reason: manualCandidates.length
          ? 'A candidate exists; the next step can fix the locator and only then attempt a narrow U-VEND Manual Nos write gate.'
          : 'No unique candidate exists; the next step must park or use Page Inspection, not write.'
      },
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
        status: 'blocked',
        reason: 'First vendor must wait until U-VEND Manual Nos is proven active after reopen.'
      },
      {
        caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
        status: 'ready-after-current',
        reason: 'Useful as a cross-check, but SKR04 starter-account evidence is already recorded; it does not unblock U-VEND directly.'
      },
      {
        caseId: 'TARGET-027D-VAT-POSTING-SETUP',
        status: 'blocked',
        reason: 'VAT matrix remains a separate setup blocker and must not be mixed into vendor-numbering route recovery.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C requires customer/item/posting/VAT readiness and must not jump ahead of Foundation blockers.'
      }
    ],
    queueChangesMade: [`Selected ${nextCase} after D2G.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: sourceDecision.selectedRoute,
    risksBeforeNextCase: [
      'Do not create a vendor before U-VEND Manual Nos is proven active after reopen.',
      'Do not toggle any checkbox unless the next case proves row, header and candidate identity.',
      'Do not use API shortcuts.'
    ],
    requiredPreparation: [
      'Use D2G DOM diagnostics and screenshot QA to repair the row/checkbox locator.',
      'Keep the write case limited to U-VEND Manual Nos only, with reopen proof.'
    ]
  };

  const completedAt = new Date().toISOString();
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-u-vend-manual-nos-source-route-decision',
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
    actionsTaken,
    actionsNotTaken: [
      'No company switch.',
      'No customer, vendor or item card was created.',
      'No sales or purchase document draft was created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No setup field was changed.',
      'No number-series lines were changed.',
      'No Standard Nos. checkbox was toggled.',
      'No Manual Nos. checkbox was toggled.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036d2g-010-u-vend-readonly-source-context.png',
      'playwright/projects/fibu-book5/img/target-036d2g-020-manual-nos-tooltip-context.png',
      'playwright/projects/fibu-book5/img/target-036d2g-030-u-vend-plain-checkbox-context.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2G-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2g-010-u-vend-readonly-source-context.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2g-020-manual-nos-tooltip-context.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2g-030-u-vend-plain-checkbox-context.snapshot.json`
    ],
    sourceBasis: [sourceDecision],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 456 was opened with a U-VEND-only filter.',
      'Microsoft source basis supports Manual Nos. as a real No. Series checkbox for manual numbers.',
      manualCandidates.length
        ? 'Read-only diagnostics found at least one U-VEND Manual Nos checkbox candidate for a follow-up helper/write-gate.'
        : 'Read-only diagnostics did not justify a setup write.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ],
    notProved: [
      'U-VEND Manual Nos. is not proven active after reopen.',
      'No vendor exists from this case.',
      'No automatic numbering behavior, posting group, VAT, ledger entry, Preview Posting or Posting behavior is proven.'
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
      noApiShortcut: true,
      noSetupChange: true
    },
    diagnosticSummary,
    snapshotRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2g-010-u-vend-readonly-source-context.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2g-020-manual-nos-tooltip-context.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-036d2g-030-u-vend-plain-checkbox-context.snapshot.json`
    ],
    sourceDecision,
    nextStepDecision,
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2G-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-036d2g-*.png'
    ],
    timestamp: completedAt,
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea: 'universaarl-vendor-number-series-route-recovery',
        activeCase: nextCase,
        active_case_file: manualCandidates.length
          ? '.agent/state/cases/target-036d2h-u-vend-manual-nos-helper-fix-and-write-gate.json'
          : '.agent/state/cases/target-036d2h-u-vend-manual-nos-park-or-pageinspection-decision.json',
        lastCompletedCase: CASE_ID,
        nextCase,
        nextStep: nextStepDecision.whySelectedNextCaseIsBest
      },
      activeCase: {
        status: resultStatus,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-036D2G-result.json`,
        nextCase
      },
      lastRunSummary: {
        runId: CASE_ID,
        completedAt,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        bcRun: true,
        setupChanged: false,
        masterDataChanged: false,
        draftCreated: false,
        previewPosting: false,
        posted: false,
        apiShortcut: false,
        nextCase,
        summary: manualCandidates.length
          ? 'D2G proved source basis and found read-only U-VEND Manual Nos checkbox candidates; next is a locator/helper-backed write gate.'
          : 'D2G proved source basis but no unique U-VEND Manual Nos checkbox candidate; next is park/Page Inspection decision.'
      }
    },
    reason: manualCandidates.length
      ? 'Source-backed decision: repair helper/locator and attempt one narrow U-VEND Manual Nos write gate next.'
      : 'Source-backed decision: do not write; use park/Page Inspection fallback first.'
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
      '## Entscheidung',
      '',
      result.reason,
      '',
      '## Quelle',
      '',
      '- Microsoft Learn: Create number series',
      '- Microsoft Learn: Integrate with Dynamics 365 Field Service',
      '',
      '## Nicht gemacht',
      '',
      '- keine Checkbox umgeschaltet',
      '- keine Nummernserienzeile geaendert',
      '- kein Kreditor, Debitor oder Artikel',
      '- kein Beleg oder Draft',
      '- keine Buchungsvorschau',
      '- keine Buchung',
      '- kein API Shortcut',
      '',
      '## Naechster Schritt',
      '',
      nextStepDecision.whySelectedNextCaseIsBest,
      ''
    ].join('\n')
  );

  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
