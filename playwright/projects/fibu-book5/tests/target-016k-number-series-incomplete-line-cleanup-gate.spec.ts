import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016K-NUMBER-SERIES-INCOMPLETE-LINE-CLEANUP-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016k-number-series-incomplete-line-cleanup-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016K-result.json');
const targetCode = 'U-CUST';

function buildPlaythruUrl(pageId = 456) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
  try {
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
  } catch {
    return rawUrl.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant}');
  }
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function literalPattern(value: string) {
  return new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
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

async function assertSafeContext(page: Page) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) throw new Error(`Unsafe context: ${sanitizeEvidenceUrl(url)}`);
  const text = await safeText(page);
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) throw new Error('Number Series context is not visible.');
  if (/Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Preview Posting|Ship and Invoice|Buchen\?/i.test(text)) {
    throw new Error('Posting/preview text is visible.');
  }
}

async function clickAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 900 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(700);
        return true;
      }
    }
  }
  return false;
}

async function selectSeriesRow(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const row = scope.getByRole('row', { name: literalPattern(targetCode) }).first();
    if (await row.isVisible({ timeout: 900 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
    const code = scope.getByText(literalPattern(targetCode)).first();
    if (await code.isVisible({ timeout: 900 }).catch(() => false)) {
      await code.click({ timeout: 5000 }).catch(async () => code.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

async function openLines(page: Page) {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeContext(page);
  if (!(await selectSeriesRow(page))) throw new Error('U-CUST row could not be selected.');
  if (!(await clickAction(page, /^Zeilen$|^Lines$/i))) throw new Error('Zeilen/Lines action could not be opened.');
  await page.waitForTimeout(900);
  await assertSafeContext(page);
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await safeText(page);
  const compact = await compactPageText(page, {
    include: [/Nr\.-Serienzeilen|Nummernserie|U-CUST|Startdatum|Startnr|Endnr|30\.06|Offen|Liste bearbeiten|Loeschen|Löschen|Neu/i],
    maxLines: 160,
    maxLineLength: 220
  });
  const visible = {
    targetCode: literalPattern(targetCode).test(text),
    targetStartNo: /U-CUST00001/i.test(text),
    targetEndNo: /U-CUST99999/i.test(text),
    linesCountHint: clean(text.match(/Nr\.-Serienzeilen[^]*?Artikel/i)?.[0] ?? '').slice(0, 180)
  };
  const enrichedVisible = {
    ...visible,
    incompleteDateLine:
      !visible.targetStartNo &&
      !visible.targetEndNo &&
      (/30\.06\.2026|30\.06\.20|hat jetzt einen Artikel|has.*one item/i.test(text) || /einen Artikel/i.test(visible.linesCountHint))
  };
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible: enrichedVisible,
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    visibleLearning: 'Der Screenshot zeigt, ob die unvollstaendige U-CUST-Zeile mit Startdatum aber ohne Start-/Endnummer vorhanden ist.',
    importantUi: ['Startdatum', 'Startnr.', 'Endnr.', 'Löschen', 'U-CUST'],
    internallyProves: 'Cleanup context for incomplete U-CUST Number Series Line in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No finished number-series line.', 'No setup assignment.', 'No master data.', 'No posting.'],
    qualityDecision: 'cleanup-evidence',
    finalScreenshotStatus: 'debugging-not-book-final',
    visible: enrichedVisible,
    ...extra
  });
  return snapshot;
}

async function selectFirstLinesRow(page: Page) {
  for (const frame of page.frames()) {
    if (!/businesscentral\.dynamics\.com/i.test(frame.url())) continue;
    const frameBox = await frame.frameElement().then((element) => element.boundingBox()).catch(() => null);
    const clicked = await frame
      .evaluate(() => {
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const cells = Array.from(document.querySelectorAll<HTMLElement>('[role="gridcell"],td'))
        .filter(visible)
        .filter((cell) => {
          const rect = cell.getBoundingClientRect();
          return rect.x >= 560 && rect.x <= 720 && rect.y >= 180 && rect.y <= 270;
        })
        .sort((a, b) => a.getBoundingClientRect().y - b.getBoundingClientRect().y || a.getBoundingClientRect().x - b.getBoundingClientRect().x);
      const cell = cells[0];
      if (!cell) return null;
      const rect = cell.getBoundingClientRect();
      return { x: rect.x + Math.min(18, rect.width / 2), y: rect.y + rect.height / 2 };
      })
      .catch(() => null as { x: number; y: number } | null);
    if (!clicked) continue;
    await page.mouse.click(clicked.x + (frameBox?.x ?? 0), clicked.y + (frameBox?.y ?? 0));
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

async function confirmDeleteIfVisible(page: Page) {
  const text = await safeText(page);
  if (!/loeschen|löschen|delete/i.test(text)) return false;
  for (const scope of [page, ...page.frames()]) {
    for (const name of [/^Ja$|^Yes$/i, /^OK$/i]) {
      const button = scope.getByRole('button', { name }).first();
      if (await button.isVisible({ timeout: 700 }).catch(() => false)) {
        await button.click({ timeout: 5000 });
        await page.waitForTimeout(1200);
        return true;
      }
    }
  }
  return false;
}

test('TARGET-016K cleans incomplete U-CUST Number Series Line only', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  let cleanupAttempted = false;
  let cleanupConfirmed = false;

  await openLines(page);
  const before = await captureState(page, 'target-016k-010-before-incomplete-line-cleanup', 'Before cleanup of incomplete U-CUST line.');

  if (!before.visible.incompleteDateLine) {
    blockedBy.push('No visible incomplete date-only U-CUST line was detected; cleanup not attempted.');
  } else if (!(await selectFirstLinesRow(page))) {
    blockedBy.push('Incomplete U-CUST line row could not be selected for cleanup.');
  } else if (!(await clickAction(page, /^Löschen$|^Loeschen$|^Delete$/i))) {
    blockedBy.push('Scoped Löschen/Delete action was not visible for the selected Number Series Line.');
  } else {
    cleanupAttempted = true;
    cleanupConfirmed = await confirmDeleteIfVisible(page);
    if (!cleanupConfirmed) blockedBy.push('Delete confirmation was not visible or was not confirmed.');
  }

  await assertSafeContext(page);
  const afterDelete = await captureState(page, 'target-016k-020-after-delete-attempt', 'After cleanup delete attempt.', {
    cleanupAttempted,
    cleanupConfirmed
  });

  await openLines(page);
  const afterReopen = await captureState(page, 'target-016k-030-after-reopen-cleanup-proof', 'After reopening U-CUST Lines for cleanup proof.', {
    cleanupAttempted,
    cleanupConfirmed
  });

  const cleanupSucceeded = cleanupAttempted && cleanupConfirmed && !afterReopen.visible.incompleteDateLine;
  if (cleanupAttempted && !cleanupSucceeded) blockedBy.push('Incomplete U-CUST line is still visible after cleanup reopen proof.');

  const resultStatus = cleanupSucceeded ? 'observed' : 'blocked';
  const nextCase = cleanupSucceeded
    ? 'TARGET-016L-NUMBER-SERIES-ASSISTED-SETUP-OR-CONFIG-PACKAGE-FALLBACK'
    : 'TARGET-016K-NUMBER-SERIES-INCOMPLETE-LINE-CLEANUP-GATE';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-incomplete-line-cleanup',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    proved: [
      'U-CUST Number Series Lines context was opened in playthru / UNIVERSAARL-DE.',
      ...(before.visible.incompleteDateLine ? ['An incomplete U-CUST line with Startdatum but without Startnr./Endnr. was visible before cleanup.'] : []),
      ...(cleanupSucceeded ? ['The incomplete U-CUST line was removed and is no longer visible after reopen.'] : []),
      'No setup assignment, master data, preview posting or posting was executed.'
    ],
    notProved: [
      'No valid U-CUST Startnr./Endnr. line is proven.',
      'No customer/vendor/item/document numbering assignment is proven.',
      'No German legal invoice-number compliance claim is made.'
    ],
    snapshots: { before, afterDelete, afterReopen },
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016k-number-series-incomplete-line-cleanup-gate/TARGET-016K-result.json',
      'playwright/projects/fibu-book5/evidence/target-016k-number-series-incomplete-line-cleanup-gate/README.md',
      'playwright/projects/fibu-book5/evidence/target-016k-number-series-incomplete-line-cleanup-gate/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016k-number-series-incomplete-line-cleanup-gate/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016k-number-series-incomplete-line-cleanup-gate/*.txt',
      'playwright/projects/fibu-book5/img/target-016k-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016k-number-series-incomplete-line-cleanup-gate/TARGET-016K-result.json',
      'playwright/projects/fibu-book5/img/target-016k-010-before-incomplete-line-cleanup.png',
      'playwright/projects/fibu-book5/img/target-016k-020-after-delete-attempt.png',
      'playwright/projects/fibu-book5/img/target-016k-030-after-reopen-cleanup-proof.png'
    ],
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
      checkboxChanged: false,
      cleanupAttempted,
      cleanupConfirmed,
      setupChanged: cleanupSucceeded
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-016J exposed an incomplete U-CUST Number Series Line with Startdatum but without Startnr./Endnr.',
      isPlannedNextCaseStillSensible: true,
      reason: 'A cleanup gate is required before any fallback route, otherwise the setup truth stays polluted.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-016L-NUMBER-SERIES-ASSISTED-SETUP-OR-CONFIG-PACKAGE-FALLBACK',
          status: cleanupSucceeded ? 'ready-next' : 'blocked',
          reason: cleanupSucceeded ? 'Cleanup is proven; fallback route can be planned without polluted U-CUST line.' : 'Cleanup must be finished first.'
        },
        {
          caseId: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT',
          status: 'needs-setup-first',
          reason: 'Setup assignment still needs valid line ranges.'
        },
        {
          caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Customer creation waits for assigned customer number series and posting setup.'
        },
        {
          caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups can continue after numbering is completed or parked.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: cleanupSucceeded
        ? 'The dirty incomplete line is gone; the next useful route is a source-backed fallback instead of more grid typing.'
        : 'The incomplete setup line remains and must be cleaned before fallback.',
      risksBeforeNextCase: ['Do not create master data.', 'Do not assign setup pages.', 'Do not repeat grid typing.'],
      requiredPreparation: cleanupSucceeded
        ? ['Choose a source-backed fallback route such as Assisted Setup or Configuration Packages UI for table 309.']
        : ['Inspect cleanup screenshots and decide whether manual cleanup is needed.']
    },
    blockedBy,
    requiresReview: !cleanupSucceeded,
    safeToFinalizeState: cleanupSucceeded,
    reason: cleanupSucceeded
      ? 'TARGET-016K cleaned the incomplete U-CUST Number Series Line left by editor probing.'
      : 'TARGET-016K did not prove cleanup of the incomplete U-CUST Number Series Line.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016K Number Series Incomplete Line Cleanup',
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
      '- Keine fertige Nummernserienzeile.',
      '- Keine Setup-Zuweisung.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
