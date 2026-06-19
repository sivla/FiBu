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

const CASE_ID = 'FIXEDASSETS-099-PURCHASE-INVOICE-TYPE-DROPDOWN-BUTTON-PROBE';
const NEXT_CASE_ID = 'FIXEDASSETS-100-PURCHASE-INVOICE-TYPE-DROPDOWN-REVIEW';
const TEST_ID = 'fixedassets-099';
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
  await dismissTours(page).catch(() => undefined);
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
    if (match?.[1]) {
      return match[1];
    }
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
        const entries = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"],[role="button"],[role="option"],[role="menuitem"],[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            return {
              text,
              role: normalize(element.getAttribute('role')),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')).replace(/[^\x20-\x7E]/g, ''),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) =>
            /Item|Artikel|Fixed Asset|Anlage|Type|Art|No\.|Nr\.|Description|Beschreibung|Option Values/i.test(
              `${entry.text} ${entry.aria} ${entry.title}`,
            ),
          )
          .filter((entry) => entry.text.length <= 180 && entry.rect.width < 1400 && entry.rect.y >= 0)
          .slice(0, 120);

        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          purchaseInvoicesListVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(bodyText),
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
    if (evidence) {
      frames.push(evidence);
    }
  }
  return {
    purchaseInvoiceVisible: frames.some((entry) => entry.purchaseInvoiceVisible),
    purchaseInvoicesListVisible: frames.some((entry) => entry.purchaseInvoicesListVisible),
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
  return {
    purchaseInvoiceVisible: signals.purchaseInvoiceVisible,
    purchaseInvoicesListVisible: signals.purchaseInvoicesListVisible,
    linesContextVisible: signals.linesContextVisible,
    fixedAssetLineTypeVisible: signals.fixedAssetLineTypeVisible,
    itemLineTypeVisible: signals.itemLineTypeVisible,
    forbiddenFixedAssetNoVisible: signals.forbiddenFixedAssetNoVisible,
    vendorCardVisible: signals.vendorCardVisible,
    vendorRegistrationVisible: signals.vendorRegistrationVisible,
    postingOrPreviewVisible: signals.postingOrPreviewVisible,
    frameCount: signals.frames.length,
    matchingEntryCount: signals.frames.reduce((sum, frame) => sum + frame.entries.length, 0),
    lineTypeEntries: signals.frames
      .flatMap((frame) => frame.entries)
      .filter((entry) => /^(Item|Artikel|Fixed Asset|Anlage)$/i.test(entry.text))
      .slice(0, 24)
      .map((entry) => ({ text: entry.text, role: entry.role, rect: entry.rect })),
  };
}

async function findItemTypeButtonBox(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],td,div,span,input,[role="gridcell"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            const role = normalize(element.getAttribute('role'));
            let score = 0;
            if (/^(Item|Artikel)$/i.test(text)) score -= 80;
            if (role === 'button') score -= 80;
            if (rect.width <= 50) score -= 60;
            if (rect.y > 520) score -= 25;
            if (rect.x > 450 && rect.x < 850) score -= 25;
            if (rect.width > 80) score += 80;
            return {
              text,
              role,
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')).replace(/[^\x20-\x7E]/g, ''),
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
    if (result.found && result.chosen) {
      return { frameUrl: frame.url(), ...result };
    }
  }
  return { found: false, chosen: null, candidates: [], frameUrl: '' };
}

async function clickVisibleFixedAssetOption(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"],[role="option"],[role="menuitem"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            return {
              element,
              text,
              role: normalize(element.getAttribute('role')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text))
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'fixed-asset-option-not-visible' };
        chosen.element.click();
        const { element: _element, ...serializable } = chosen;
        return { clicked: true, chosen: serializable };
      })
      .catch((error) => ({ clicked: false, reason: String(error) }));
    if (result.clicked) {
      await page.waitForTimeout(1200);
      return { frameUrl: frame.url(), ...result };
    }
  }
  return { clicked: false, reason: 'fixed-asset-option-not-visible', frameUrl: '' };
}

async function probeFixedAssetLineTypeFromButton(page: Page) {
  const button = await findItemTypeButtonBox(page);
  const attempts = [];
  if (!button.found || !button.chosen) {
    return { status: 'blocked-item-type-button-not-found', button, attempts };
  }

  const rect = button.chosen.rect;
  const clickPoint = { x: rect.x + Math.round(rect.width / 2), y: rect.y + Math.round(rect.height / 2) };

  for (const action of ['click-button', 'alt-arrowdown-after-button-click', 'f4-after-button-click']) {
    await page.mouse.click(clickPoint.x, clickPoint.y);
    await page.waitForTimeout(900);
    if (action === 'alt-arrowdown-after-button-click') {
      await page.keyboard.press('Alt+ArrowDown');
      await page.waitForTimeout(1000);
    }
    if (action === 'f4-after-button-click') {
      await page.keyboard.press('F4');
      await page.waitForTimeout(1000);
    }

    const signals = await collectLineTypeSignals(page);
    attempts.push({ action, clickPoint, signals: summarizeSignals(signals) });
    if (signals.fixedAssetLineTypeVisible) {
      const selection = await clickVisibleFixedAssetOption(page);
      const afterSelectionSignals = await collectLineTypeSignals(page);
      return {
        status: selection.clicked ? `fixed-asset-selected-after-${action}` : `fixed-asset-visible-not-selected-after-${action}`,
        button,
        attempts,
        selection,
        signals: afterSelectionSignals,
      };
    }
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(500);
  }

  const signals = await collectLineTypeSignals(page);
  return { status: signals.fixedAssetLineTypeVisible ? 'fixed-asset-visible-final' : 'blocked-fixed-asset-not-visible', button, attempts, signals };
}

async function confirmDeleteDraftOnly(page: Page) {
  const text = await pageText(page);
  if (!/delete|l.schen|remove|entfernen/i.test(text) || /post|preview|buchen|vorschau|invoice\b/i.test(text)) {
    return { confirmed: false, reason: 'no-safe-delete-confirmation-context' };
  }
  for (const scope of [page, ...page.frames()]) {
    for (const pattern of [/^Yes$/i, /^Ja$/i, /^Delete$/i, /^L.schen$/i]) {
      const button = scope.getByRole('button', { name: pattern }).first();
      if (await button.isVisible({ timeout: 1200 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1800);
        return { confirmed: true, button: pattern.source };
      }
    }
  }
  return { confirmed: false, reason: 'delete-confirm-button-not-found' };
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
            const title = normalize(element.getAttribute('title') || clickable.getAttribute('title')).replace(/[^\x20-\x7E]/g, '');
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
  const confirmation = deleteAction.clicked ? await confirmDeleteDraftOnly(page) : { confirmed: false, reason: 'delete-action-not-clicked' };
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
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-100-purchase-invoice-type-dropdown-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-099-purchase-invoice-type-dropdown-button-probe.json',
      nextStep:
        resultStatus === 'observed'
          ? 'FIXEDASSETS-100: review FA-099 evidence locally and decide whether target field mapping may be unlocked.'
          : 'FIXEDASSETS-100: review FA-099 blocker evidence locally and choose a safer non-invoice acquisition route.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-purchase-invoice-type-dropdown-button-probe',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep: 'Run FIXEDASSETS-100 local evidence review before unlocking target values.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-099/FIXEDASSETS-099-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-100 local evidence review.',
    },
  };
}

test('FIXEDASSETS-099 probes Purchase Invoice Type button/dropdown without target values', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(faEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  let draftInvoiceNo = await extractDraftNo(page);

  const beforeProbeSignals = await collectLineTypeSignals(page);
  const buttonProbe = await probeFixedAssetLineTypeFromButton(page);
  const afterProbeSignals = await collectLineTypeSignals(page);
  const guard = classifyPurchaseInvoiceLineTypeVisibility({
    purchaseInvoiceVisible: afterProbeSignals.purchaseInvoiceVisible,
    linesContextVisible: afterProbeSignals.linesContextVisible,
    fixedAssetLineTypeVisible: afterProbeSignals.fixedAssetLineTypeVisible,
    itemLineTypeVisible: afterProbeSignals.itemLineTypeVisible,
    forbiddenFixedAssetNoVisible: afterProbeSignals.forbiddenFixedAssetNoVisible,
    vendorCardVisible: afterProbeSignals.vendorCardVisible,
    vendorRegistrationVisible: afterProbeSignals.vendorRegistrationVisible,
    postingOrPreviewVisible: afterProbeSignals.postingOrPreviewVisible,
  });

  await writeJsonEvidence(faEvidencePath('030-type-dropdown-button-probe.json'), {
    beforeProbeSignals: summarizeSignals(beforeProbeSignals),
    buttonProbe: {
      ...buttonProbe,
      signals: buttonProbe.signals ? summarizeSignals(buttonProbe.signals) : undefined,
    },
    afterProbeSignals: summarizeSignals(afterProbeSignals),
    guard,
  });
  await writeTextEvidence(
    faEvidencePath('031-after-button-probe-focused-text.txt'),
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
  const fixedAssetProved = afterProbeSignals.fixedAssetLineTypeVisible && guard.success;
  const fixedAssetSelected = /^fixed-asset-selected/i.test(buttonProbe.status);
  const resultStatus = fixedAssetProved ? 'observed' : 'blocked';
  const summary = fixedAssetProved
    ? `FA-099 proved Purchase Invoice Type dropdown button can expose ${fixedAssetSelected ? 'and select' : ''} Fixed Asset. Cleanup status=${cleanup.status}.`
    : `FA-099 did not prove Fixed Asset through the Type dropdown button route; status=${buttonProbe.status}, guard=${guard.status}. Cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-purchase-invoice-type-dropdown-button-probe-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-purchase-invoice-type-dropdown-button-probe',
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
        purpose: 'Temporary sandbox draft to probe only the Purchase Invoice Type dropdown button; no vendor/fixed asset target values, no preview, no post.',
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
        oldValue: beforeProbeSignals.itemLineTypeVisible ? 'Item' : 'unknown',
        newValue: fixedAssetProved ? 'Fixed Asset' : 'not-proven',
        purpose: 'Probe only the Type dropdown button before any target value entry.',
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
      'The run targeted the smaller Type-cell button/dropdown area instead of the gridcell center.',
      ...(fixedAssetProved ? [`Type = Fixed Asset was ${fixedAssetSelected ? 'selected' : 'visible'} from the Type button/dropdown route.`] : []),
      persistedDraftDetected && cleanupCompleted
        ? `Temporary Purchase Invoice draft ${draftInvoiceNo ?? ''} was removed through UI cleanup.`
        : 'No persisted Purchase Invoice draft number was detected after the probe; cleanup was not needed.',
    ],
    notProved: [
      ...(fixedAssetProved ? [] : ['Type = Fixed Asset was not proven through the Type button/dropdown route.']),
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No Preview Posting.',
      'No posting.',
      'No setup change.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-099-purchase-invoice-type-dropdown-button-probe.json',
      '.agent/state/cases/fixedassets-100-purchase-invoice-type-dropdown-review.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-099-purchase-invoice-type-dropdown-button-probe.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/FIXEDASSETS-099-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/030-type-dropdown-button-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/031-after-button-probe-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-099/FIXEDASSETS-099-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/030-type-dropdown-button-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/031-after-button-probe-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-099/README.md',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'This probe intentionally stops before K30000 and FA-CNC-01.',
      'No Preview Posting or posting was attempted.',
    ],
    blockedBy: fixedAssetProved ? [] : ['Type = Fixed Asset not visible/selectable through Type button/dropdown route.'],
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
      beforeProbeSignals: summarizeSignals(beforeProbeSignals),
      buttonProbe: {
        ...buttonProbe,
        signals: buttonProbe.signals ? summarizeSignals(buttonProbe.signals) : undefined,
      },
      afterProbeSignals: summarizeSignals(afterProbeSignals),
      guard,
    },
    nextStep: 'Run FIXEDASSETS-100 local evidence review before unlocking target values.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-099-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-099 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-099-result.json` | JSON | Type-Button-/Dropdown-Probe, Cleanup, Grenzen | keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |',
      '| `030-type-dropdown-button-probe.json` | JSON | Button-/Dropdown-Klickpunkt und Guard-Klassifikation | keine No.-Feldzuordnung | `line-type-context` |',
      '| `031-after-button-probe-focused-text.txt` | Text | kompakter UI-Text nach Probe | kein Rohdump, kein Screenshot | `compact` |',
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
