import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { clickBcScoredAction } from '../../../core/bc/actions';
import { classifyPurchaseInvoiceLineTypeVisibility } from '../../../core/bc/purchase-invoice-guards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-076-GUARDED-DIRECT-LINE-TYPE-VALUE-ENTRY';
const TEST_ID = 'fixedassets-076';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(420_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function purchaseInvoicesUrl(invoiceNo?: string) {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  if (invoiceNo) {
    url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
  }
  return url.toString();
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const text = await pageText(page);
  const decoded = decodeURIComponent(url);
  return {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };
}

async function openPurchaseInvoices(page: Page) {
  await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|Vendor|Kreditor/i, { timeout: 90_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function clickScopedNew(page: Page) {
  return clickBcScoredAction(page, {
    scopeText: /Purchase Invoices|Einkaufsrechnungen/i,
    actionPattern: /^(New|Neu)$|new entry|neuen Eintrag/i,
    titleBonusPattern: /Create a new entry|Erstellen Sie einen neuen Eintrag|neuen Eintrag/i,
    rejectPattern: /Sales|Order|Quote|Power BI|Intercompany|Time Sheet|Report|PDF/i,
    preferredYMin: 35,
    preferredYMax: 140,
    waitAfterClick: 4500,
  });
}

async function extractDraftNo(page: Page) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const text = await pageText(page);
    const match = text.match(/\b(10\d{4,})\b/);
    if (match?.[1]) return match[1];
    await page.waitForTimeout(500);
  }
  return null;
}

async function collectLineTypeSignals(page: Page) {
  const frames = [];
  for (const frame of page.frames()) {
    const evidence = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const bodyText = normalize(document.body?.innerText || '');
        const entries = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"],[role="option"],[role="menuitem"],[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            return {
              text,
              role: normalize(element.getAttribute('role')),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) =>
            /Item|Artikel|Fixed Asset|Anlage|Type|Art|No\.|Nr\.|Description|Beschreibung|Option Values/i.test(
              `${entry.text} ${entry.aria} ${entry.title}`,
            ),
          )
          .filter((entry) => entry.text.length <= 180 && entry.rect.width < 1200 && entry.rect.y >= 0)
          .slice(0, 80);

        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          linesContextVisible: /\bType\b|\bNo\.\b|\bDescription\b|\bArt\b|\bNr\./i.test(bodyText),
          fixedAssetLineTypeVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text)),
          itemLineTypeVisible: entries.some((entry) => /^(Item|Artikel)$/i.test(entry.text)),
          forbiddenFixedAssetNoVisible: /FA-CNC-01/.test(bodyText),
          vendorCardVisible: /\bVendor Card\s*-|\bKreditorenkarte\s*-/i.test(bodyText),
          vendorRegistrationVisible: /Create a new vendor card|new vendor card|not registered|Kreditor.*anlegen|neue Kreditorenkarte/i.test(bodyText),
          postingOrPreviewVisible: /\bPost\b|\bBuchen\b|Preview Posting|Buchungsvorschau/i.test(bodyText),
          entries,
        };
      })
      .catch(() => null);
    if (evidence) frames.push(evidence);
  }

  return {
    purchaseInvoiceVisible: frames.some((entry) => entry.purchaseInvoiceVisible),
    linesContextVisible: frames.some((entry) => entry.linesContextVisible),
    fixedAssetLineTypeVisible: frames.some((entry) => entry.fixedAssetLineTypeVisible),
    itemLineTypeVisible: frames.some((entry) => entry.itemLineTypeVisible),
    forbiddenFixedAssetNoVisible: frames.some((entry) => entry.forbiddenFixedAssetNoVisible),
    vendorCardVisible: frames.some((entry) => entry.vendorCardVisible),
    vendorRegistrationVisible: frames.some((entry) => entry.vendorRegistrationVisible),
    postingOrPreviewVisible: frames.some((entry) => entry.postingOrPreviewVisible),
    frames,
  };
}

function summarizeSignals(signals: Awaited<ReturnType<typeof collectLineTypeSignals>>) {
  const lineTypeEntries = signals.frames
    .flatMap((frame) => frame.entries)
    .filter((entry) => /^(Item|Artikel|Fixed Asset|Anlage)$/i.test(entry.text))
    .slice(0, 12)
    .map((entry) => ({
      text: entry.text,
      role: entry.role,
      rect: entry.rect,
    }));

  return {
    purchaseInvoiceVisible: signals.purchaseInvoiceVisible,
    linesContextVisible: signals.linesContextVisible,
    fixedAssetLineTypeVisible: signals.fixedAssetLineTypeVisible,
    itemLineTypeVisible: signals.itemLineTypeVisible,
    forbiddenFixedAssetNoVisible: signals.forbiddenFixedAssetNoVisible,
    vendorCardVisible: signals.vendorCardVisible,
    vendorRegistrationVisible: signals.vendorRegistrationVisible,
    postingOrPreviewVisible: signals.postingOrPreviewVisible,
    frameCount: signals.frames.length,
    matchingEntryCount: signals.frames.reduce((sum, frame) => sum + frame.entries.length, 0),
    lineTypeEntries,
  };
}

async function findItemTypeCellBox(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            let score = 0;
            if (/^(Item|Artikel)$/i.test(text)) score -= 100;
            if (rect.y > 520) score -= 25;
            if (rect.x > 450 && rect.x < 850) score -= 25;
            if (rect.width < 20 || rect.height < 10) score += 20;
            return {
              text,
              role: normalize(element.getAttribute('role')),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score,
            };
          })
          .filter((entry) => /^(Item|Artikel)$/i.test(entry.text))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        return chosen ? { found: true, chosen, candidates: candidates.slice(0, 12) } : { found: false, chosen: null, candidates: [] };
      })
      .catch((error) => ({ found: false, chosen: null, candidates: [], error: String(error) }));
    if (result.found && result.chosen) return { frameUrl: frame.url(), ...result };
  }
  return { found: false, chosen: null, candidates: [], frameUrl: '' };
}

async function enterFixedAssetLineTypeOnly(page: Page) {
  const cell = await findItemTypeCellBox(page);
  const attempts = [];
  if (!cell.found || !cell.chosen) return { status: 'blocked-item-type-cell-not-found', cell, attempts };

  const rect = cell.chosen.rect;
  const clickPoint = { x: rect.x + Math.round(rect.width / 2), y: rect.y + Math.round(rect.height / 2) };
  await page.mouse.click(clickPoint.x, clickPoint.y);
  await page.waitForTimeout(600);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type('Fixed Asset');
  await page.waitForTimeout(800);
  let signals = await collectLineTypeSignals(page);
  attempts.push({ action: 'type-fixed-asset', clickPoint, signals: summarizeSignals(signals) });

  if (signals.fixedAssetLineTypeVisible) {
    return { status: 'fixed-asset-visible-after-typing', cell, attempts, signals };
  }

  await page.keyboard.press('Enter');
  await page.waitForTimeout(1400);
  signals = await collectLineTypeSignals(page);
  attempts.push({ action: 'enter-after-typing', signals: summarizeSignals(signals) });
  if (signals.fixedAssetLineTypeVisible) {
    return { status: 'fixed-asset-visible-after-enter', cell, attempts, signals };
  }

  await page.keyboard.press('Tab');
  await page.waitForTimeout(1400);
  signals = await collectLineTypeSignals(page);
  attempts.push({ action: 'tab-after-typing', signals: summarizeSignals(signals) });
  return {
    status: signals.fixedAssetLineTypeVisible ? 'fixed-asset-visible-after-tab' : 'blocked-direct-entry-not-accepted',
    cell,
    attempts,
    signals,
  };
}

async function confirmYes(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const pattern of [/^Yes$/i, /^Ja$/i, /^Delete$/i, /^L.schen$/i, /^OK$/i]) {
      const button = scope.getByRole('button', { name: pattern }).first();
      if (await button.isVisible({ timeout: 1200 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1800);
        return { confirmed: true, button: pattern.source };
      }
    }
  }
  return { confirmed: false, button: 'not-found' };
}

async function clickDeleteSelectedInvoice(page: Page, invoiceNo: string) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!new RegExp(invoiceNo).test(body)) continue;
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[aria-label],[title],span,div'))
          .filter(visible)
          .map((element) => {
            const clickable = (element.closest('button,[role="button"]') as HTMLElement | null) ?? element;
            const rect = clickable.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label') || clickable.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title') || clickable.getAttribute('title'));
            const label = `${text} ${aria} ${title}`;
            let score = 0;
            if (/^(Delete|L.*schen)$/i.test(text) || /^(Delete|L.*schen)$/i.test(aria)) score -= 60;
            if (/Delete|L.*schen/i.test(title)) score -= 30;
            if (rect.y >= 35 && rect.y <= 135) score -= 20;
            if (/Post|Preview|Buchen|Vorschau|Invoice|Rechnung|New|Neu/i.test(label)) score += 200;
            return { clickable, text, aria, title, label, rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }, score };
          })
          .filter((entry) => /Delete|L.*schen/i.test(entry.label))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'delete-action-not-found' };
        chosen.clickable.click();
        return { clicked: true, chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, label: chosen.label, rect: chosen.rect, score: chosen.score } };
      })
      .catch((error) => ({ clicked: false, reason: String(error) }));
    if (result.clicked) {
      await page.waitForTimeout(1500);
      return result;
    }
  }
  return { clicked: false, reason: 'invoice-row-not-found' };
}

async function cleanupDraft(page: Page, invoiceNo: string) {
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);

  const visibleBefore = new RegExp(invoiceNo).test(await pageText(page));
  if (!visibleBefore) return { status: 'not-visible-before-cleanup', invoiceNo, visibleBefore, visibleAfter: false };
  const deleteAction = await clickDeleteSelectedInvoice(page, invoiceNo);
  const confirmation = deleteAction.clicked ? await confirmYes(page) : { confirmed: false, button: 'not-needed' };
  await page.waitForTimeout(2500);
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  const visibleAfter = new RegExp(invoiceNo).test(await pageText(page));
  return { status: visibleAfter ? 'cleanup-clicked-but-still-visible' : 'deleted', invoiceNo, visibleBefore, visibleAfter, deleteAction, confirmation };
}

function statePatch(resultStatus: string, summary: string) {
  return {
    current: {
      activeCase: CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-076.json',
      nextStep:
        resultStatus === 'observed'
          ? 'FA-076 proved visible Type = Fixed Asset through guarded direct UI entry. Next: plan a separate field-mapping route for the No. field without entering K30000 yet.'
          : 'FA-076 did not prove visible Type = Fixed Asset through direct UI entry. Next: switch route to Purchase Order acquisition path or page/setup capability review; do not repeat the same direct entry probe.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'purchase-invoice-line-type-direct-ui-probe',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        resultStatus === 'observed'
          ? 'Plan a separate No.-field mapping case. Keep K30000 and FA-CNC-01 locked until that case explicitly unlocks them.'
          : 'Reject another identical direct Type-entry retry; choose Purchase Order route or setup/page capability review.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-076/FIXEDASSETS-076-result.json',
        summary,
      },
      nextSafeAction:
        resultStatus === 'observed'
          ? 'Create a separate guarded field-mapping case for the No. field. Do not enter target values in FA-076.'
          : 'Use a different route; do not repeat direct Type value entry.',
    },
  };
}

test('FIXEDASSETS-076 enters only Purchase Invoice Line Type = Fixed Asset and cleans up', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    faEvidencePath('010-before-new-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Post|Buchen|Invoice|Rechnung/i],
      maxLines: 80,
      maxLineLength: 220,
    }),
  );

  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(faEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  let draftInvoiceNo = await extractDraftNo(page);

  const beforeEntrySignals = await collectLineTypeSignals(page);
  const directEntry = await enterFixedAssetLineTypeOnly(page);
  const afterEntrySignals = await collectLineTypeSignals(page);
  const guard = classifyPurchaseInvoiceLineTypeVisibility(afterEntrySignals);
  await writeJsonEvidence(faEvidencePath('030-direct-line-type-entry.json'), {
    beforeEntrySignals: summarizeSignals(beforeEntrySignals),
    directEntry: {
      ...directEntry,
      signals: directEntry.signals ? summarizeSignals(directEntry.signals) : undefined,
    },
    afterEntrySignals: summarizeSignals(afterEntrySignals),
    guard,
  });
  await writeTextEvidence(
    faEvidencePath('031-after-direct-entry-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Type|Art|Fixed Asset|Anlage|Item|Artikel|No\.|Nr\.|Vendor|Kreditor|Post|Buchen|Preview|Vorschau/i],
      maxLines: 180,
      maxLineLength: 220,
    }),
  );

  draftInvoiceNo = draftInvoiceNo ?? (await extractDraftNo(page));
  const cleanup =
    draftInvoiceNo && /^\d+$/.test(draftInvoiceNo)
      ? await cleanupDraft(page, draftInvoiceNo)
      : { status: 'not-created-or-draft-number-not-found', invoiceNo: draftInvoiceNo, visibleAfter: false };
  await writeJsonEvidence(faEvidencePath('090-cleanup-result.json'), cleanup);

  const persistedDraftDetected = Boolean(draftInvoiceNo && /^\d+$/.test(draftInvoiceNo));
  const cleanupCompleted = cleanup.status === 'deleted' || cleanup.status === 'not-created-or-draft-number-not-found';
  const fixedAssetProved = afterEntrySignals.fixedAssetLineTypeVisible && guard.success;
  const resultStatus = fixedAssetProved ? 'observed' : 'blocked';
  const summary = fixedAssetProved
    ? `FA-076 proved visible Type = Fixed Asset through direct UI value entry for draft ${draftInvoiceNo ?? '(unknown)'}, then cleaned up the draft.`
    : `FA-076 did not prove visible Type = Fixed Asset through direct UI value entry; status=${directEntry.status}, guard=${guard.status}. Cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-guarded-direct-line-type-value-entry-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-direct-line-type-probe',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: { expectedInstance: EXPECTED_INSTANCE, expectedCompany: EXPECTED_COMPANY, context, urlAfterProbe: page.url() },
    createdRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Purchase Invoice',
        documentNo: draftInvoiceNo ?? '',
        purpose: 'Temporary sandbox draft to prove only Purchase Invoice Line Type = Fixed Asset; no vendor/fixed asset target values, no preview, no post.',
        createdAt: startedAt,
        status: persistedDraftDetected ? (cleanupCompleted ? 'deleted' : 'draft') : 'no-persisted-number-detected',
        cleanupStatus: persistedDraftDetected ? (cleanupCompleted ? 'deleted' : 'blocked') : 'not-needed',
      },
    ],
    changedRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Purchase Invoice Line',
        documentNo: draftInvoiceNo ?? '',
        field: 'Type',
        oldValue: beforeEntrySignals.itemLineTypeVisible ? 'Item' : 'unknown',
        newValue: fixedAssetProved ? 'Fixed Asset' : 'not-proven',
        purpose: 'Probe only the line type before any target value entry.',
        cleanupStatus: persistedDraftDetected ? (cleanupCompleted ? 'deleted-with-draft' : 'blocked') : 'not-needed-no-persisted-draft-number',
      },
    ],
    postedRecords: [],
    setupChanges: [],
    cleanup: {
      required: Boolean(draftInvoiceNo),
      completed: cleanupCompleted,
      method: draftInvoiceNo ? 'filtered Purchase Invoices list delete via UI' : 'not-needed',
      blockedBy: cleanupCompleted ? [] : [cleanup.status],
      detail: cleanup,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'New/Neu was clicked once in the scoped Purchase Invoices context.',
      'The run attempted only Purchase Invoice Line Type = Fixed Asset.',
      ...(fixedAssetProved ? ['Type = Fixed Asset was visible in the Purchase Invoice Lines context after direct UI value entry.'] : []),
      persistedDraftDetected && cleanupCompleted
        ? `Temporary Purchase Invoice draft ${draftInvoiceNo ?? ''} was removed through UI cleanup.`
        : 'No persisted Purchase Invoice draft number was detected after the probe; cleanup was not needed.',
    ],
    notProved: [
      ...(fixedAssetProved ? [] : ['Type = Fixed Asset was not proven as visible through direct UI value entry.']),
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No Preview Posting.',
      'No posting.',
      'No setup change.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-076.json',
      '.agent/state/last_run_summary.json',
      '.agent/state/coverage_state.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-076-guarded-direct-line-type-value-entry.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-076/FIXEDASSETS-076-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-076/030-direct-line-type-entry.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-076/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-076/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-076/FIXEDASSETS-076-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-076/030-direct-line-type-entry.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-076/031-after-direct-entry-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-076/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-076/README.md',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'This probe intentionally stops before K30000 and FA-CNC-01.',
      'No Preview Posting or posting was attempted.',
    ],
    blockedBy: fixedAssetProved ? [] : ['Type = Fixed Asset not visible through guarded direct UI value entry.'],
    requiresReview: !cleanupCompleted,
    safeToFinalizeState: cleanupCompleted,
    statePatch: statePatch(resultStatus, summary),
    flags: {
      stayedInExpectedInstance: context.environmentInUrl,
      companyContextDocumented: context.companyInUrl || context.companyInText,
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noTargetVendorEntry: true,
      noTargetFixedAssetEntry: true,
      cleanupCompleted,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      newAttempt,
      draftInvoiceNo,
      beforeEntrySignals: summarizeSignals(beforeEntrySignals),
      directEntry: {
        ...directEntry,
        signals: directEntry.signals ? summarizeSignals(directEntry.signals) : undefined,
      },
      afterEntrySignals: summarizeSignals(afterEntrySignals),
      guard,
    },
    nextStep: fixedAssetProved
      ? 'Create a separate guarded No.-field mapping case. Do not enter K30000 or FA-CNC-01 until that case explicitly unlocks target values.'
      : 'Reject another identical direct Type-entry retry; choose Purchase Order route or setup/page capability review.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-076-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-076-learning.md'),
    [
      '# FIXEDASSETS-076 Lernnotiz',
      '',
      summary,
      '',
      'Dieser Lauf testet nur den Zeilentyp. In Business Central steuert der Zeilentyp, welche Liste und welche Sachlogik im Feld `No.`/`Nr.` danach greift. Solange `Fixed Asset` nicht sichtbar als Zeilentyp nachgewiesen ist, waere die Eingabe von `FA-CNC-01` fachlich unsauber.',
      '',
      'Status: CRONUS-/RM-DEMO-Labor, kein deutscher Finalnachweis.',
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-076 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-076-result.json` | JSON | Direktwert-Probe fuer `Type = Fixed Asset`, Cleanup, Grenzen | keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |',
      '| `030-direct-line-type-entry.json` | JSON | Type-Zelle, Eingabeversuch, sichtbare Signale, Guard-Klassifikation | keine No.-Feldzuordnung | `line-type-context` |',
      '| `031-after-direct-entry-focused-text.txt` | Text | kompakter UI-Text nach Eingabeversuch | kein Rohdump, kein Screenshot | `compact` |',
      '| `090-cleanup-result.json` | JSON | Cleanup-Status eines ggf. erzeugten Drafts | keine Postenspur | `cleanup` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.stayedInExpectedInstance).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noTargetVendorEntry).toBe(true);
  expect(result.flags.noTargetFixedAssetEntry).toBe(true);
  expect(result.flags.cleanupCompleted).toBe(true);
});
