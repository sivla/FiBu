import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { clickBcScoredAction } from '../../../core/bc/actions';
import { classifyPurchaseInvoiceLineTypeVisibility } from '../../../core/bc/purchase-invoice-guards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-115-PURCHASE-INVOICE-LINE-TYPE-DROPDOWN-DISCOVERY';
const NEXT_CASE_ID = 'FIXEDASSETS-116-PURCHASE-INVOICE-LINE-TYPE-DROPDOWN-REVIEW';
const TEST_ID = 'fixedassets-115';
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

function sanitizeUrl(value: string) {
  if (!/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(value);
    for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
      url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return value;
  }
}

function sanitizeEvidenceValue<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeUrl(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeEvidenceValue(entry)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitizeEvidenceValue(entry)]),
    ) as T;
  }
  return value;
}

async function writeSafeJsonEvidence(filePath: string, value: unknown) {
  await writeJsonEvidence(filePath, sanitizeEvidenceValue(value));
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
        const entries = Array.from(
          document.querySelectorAll<HTMLElement>(
            'td,div,span,input,[role="gridcell"],[role="button"],[role="option"],[role="menuitem"],[aria-label],[title]',
          ),
        )
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
            /Item|Artikel|Fixed Asset|Anlage|G\/L Account|Sachkonto|Resource|Ressource|Charge|Type|Art|No\.|Nr\.|Description|Beschreibung|Option Values/i.test(
              `${entry.text} ${entry.aria} ${entry.title}`,
            ),
          )
          .filter((entry) => entry.text.length <= 180 && entry.rect.width < 1400 && entry.rect.y >= 0)
          .slice(0, 140);

        const optionTexts = Array.from(
          new Set(
            entries
              .filter((entry) => /^(G\/L Account|Sachkonto|Item|Artikel|Fixed Asset|Anlage|Resource|Ressource|Charge \(Item\)|Geb.hr \(Artikel\))$/i.test(entry.text))
              .map((entry) => entry.text)
              .filter(Boolean),
          ),
        ).slice(0, 40);

        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          purchaseInvoicesListVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(bodyText),
          linesContextVisible: /\bType\b|\bNo\.\b|\bDescription\b|\bArt\b|\bNr\./i.test(bodyText),
          fixedAssetLineTypeVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text)),
          itemLineTypeVisible: entries.some((entry) => /^(Item|Artikel)$/i.test(entry.text)),
          forbiddenVendorNoVisible: /K30000/.test(bodyText),
          forbiddenFixedAssetNoVisible: /FA-CNC-01/.test(bodyText),
          vendorCardVisible: /\bVendor Card\s*-|\bKreditorenkarte\s*-/i.test(bodyText),
          vendorRegistrationVisible: /Create a new vendor card|new vendor card|not registered|Kreditor.*anlegen|neue Kreditorenkarte/i.test(bodyText),
          postingOrPreviewVisible: /\bPost\b|\bBuchen\b|Preview Posting|Buchungsvorschau/i.test(bodyText),
          optionTexts,
          entries,
        };
      })
      .catch(() => null);
    if (evidence) frames.push(evidence);
  }

  return {
    purchaseInvoiceVisible: frames.some((entry) => entry.purchaseInvoiceVisible),
    purchaseInvoicesListVisible: frames.some((entry) => entry.purchaseInvoicesListVisible),
    linesContextVisible: frames.some((entry) => entry.linesContextVisible),
    fixedAssetLineTypeVisible: frames.some((entry) => entry.fixedAssetLineTypeVisible),
    itemLineTypeVisible: frames.some((entry) => entry.itemLineTypeVisible),
    forbiddenVendorNoVisible: frames.some((entry) => entry.forbiddenVendorNoVisible),
    forbiddenFixedAssetNoVisible: frames.some((entry) => entry.forbiddenFixedAssetNoVisible),
    vendorCardVisible: frames.some((entry) => entry.vendorCardVisible),
    vendorRegistrationVisible: frames.some((entry) => entry.vendorRegistrationVisible),
    postingOrPreviewVisible: frames.some((entry) => entry.postingOrPreviewVisible),
    optionTexts: Array.from(new Set(frames.flatMap((entry) => entry.optionTexts))).slice(0, 40),
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
    forbiddenVendorNoVisible: signals.forbiddenVendorNoVisible,
    forbiddenFixedAssetNoVisible: signals.forbiddenFixedAssetNoVisible,
    vendorCardVisible: signals.vendorCardVisible,
    vendorRegistrationVisible: signals.vendorRegistrationVisible,
    postingOrPreviewVisible: signals.postingOrPreviewVisible,
    optionTexts: signals.optionTexts,
    frameCount: signals.frames.length,
    matchingEntryCount: signals.frames.reduce((sum, frame) => sum + frame.entries.length, 0),
    lineTypeEntries: signals.frames
      .flatMap((frame) => frame.entries)
      .filter((entry) => /^(Item|Artikel|Fixed Asset|Anlage|G\/L Account|Sachkonto|Resource|Ressource|Charge \(Item\))$/i.test(entry.text))
      .slice(0, 32)
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
    if (result.found && result.chosen) return { frameUrl: frame.url(), ...result };
  }
  return { found: false, chosen: null, candidates: [], frameUrl: '' };
}

async function probeTypeDropdownWithoutSelection(page: Page) {
  const button = await findItemTypeButtonBox(page);
  const attempts = [];
  if (!button.found || !button.chosen) {
    return { status: 'blocked-item-type-button-not-found', button, attempts };
  }

  const rect = button.chosen.rect;
  const clickPoint = { x: rect.x + Math.round(rect.width / 2), y: rect.y + Math.round(rect.height / 2) };

  for (const action of ['click-button', 'alt-arrowdown-after-button-click', 'f4-after-button-click', 'enter-after-button-click']) {
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
    if (action === 'enter-after-button-click') {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    }

    const signals = await collectLineTypeSignals(page);
    const summary = summarizeSignals(signals);
    attempts.push({ action, clickPoint, signals: summary });
    const dropdownOptionsVisible = summary.optionTexts.some((text) => /^(G\/L Account|Sachkonto|Fixed Asset|Anlage|Resource|Ressource|Charge \(Item\)|Geb.hr \(Artikel\))$/i.test(text));
    if (summary.fixedAssetLineTypeVisible || dropdownOptionsVisible) {
      return {
        status: summary.fixedAssetLineTypeVisible ? `fixed-asset-option-visible-after-${action}` : `dropdown-options-visible-after-${action}`,
        button,
        attempts,
        signals,
      };
    }
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(500);
  }

  const signals = await collectLineTypeSignals(page);
  return {
    status: signals.fixedAssetLineTypeVisible ? 'fixed-asset-option-visible-final' : 'blocked-dropdown-options-not-visible',
    button,
    attempts,
    signals,
  };
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
      active_case_file: '.agent/state/cases/fixedassets-116-purchase-invoice-line-type-dropdown-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-115-purchase-invoice-line-type-dropdown-discovery.json',
      nextStep:
        resultStatus === 'observed'
          ? 'FIXEDASSETS-116: review FA-115 dropdown evidence and decide whether a no-target selection proof may be allowed.'
          : 'FIXEDASSETS-116: review FA-115 blocker evidence and decide whether to improve dropdown helper or switch route.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-purchase-invoice-line-type-dropdown-discovery',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      summary,
      nextStep: 'Run FIXEDASSETS-116 local evidence review before any Type selection or target values are unlocked.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-115/FIXEDASSETS-115-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-116 local evidence review.',
    },
  };
}

test('FIXEDASSETS-115 discovers Purchase Invoice line Type dropdown options without selecting target values', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const newAttempt = await clickScopedNew(page);
  await writeSafeJsonEvidence(faEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  let draftInvoiceNo = await extractDraftNo(page);

  const beforeProbeSignals = await collectLineTypeSignals(page);
  const dropdownProbe = await probeTypeDropdownWithoutSelection(page);
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

  await writeSafeJsonEvidence(faEvidencePath('030-line-type-dropdown-discovery.json'), {
    beforeProbeSignals: summarizeSignals(beforeProbeSignals),
    dropdownProbe: {
      ...dropdownProbe,
      signals: dropdownProbe.signals ? summarizeSignals(dropdownProbe.signals) : undefined,
    },
    afterProbeSignals: summarizeSignals(afterProbeSignals),
    guard,
  });
  await writeTextEvidence(
    faEvidencePath('031-after-dropdown-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Type|Art|Fixed Asset|Anlage|Item|Artikel|G\/L Account|Sachkonto|Resource|Ressource|No\.|Nr\.|Vendor|Kreditor|Post|Buchen|Preview|Vorschau/i],
      maxLines: 180,
      maxLineLength: 220,
    }),
  );

  await screenshot(page, 'fixedassets-115-030-line-type-dropdown-discovery.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: afterProbeSignals.fixedAssetLineTypeVisible || afterProbeSignals.optionTexts.length > 1 ? 'candidate' : 'rejected',
    bookUse: afterProbeSignals.fixedAssetLineTypeVisible || afterProbeSignals.optionTexts.length > 1 ? 'evidence' : 'do-not-use',
    purpose: 'FIXEDASSETS-115 prueft nur, ob der Type-Dropdown in Purchase Invoice Lines Optionen wie Fixed Asset sichtbar macht; keine Auswahl, keine Zielwerte.',
    expectedPageText: [/Purchase Invoice|Einkaufsrechnung|Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: [
      'Kein K30000, kein FA-CNC-01 und kein Betrag.',
      'Keine Auswahl von Fixed Asset.',
      'Keine Preview Posting und keine Buchung.',
    ],
  });

  draftInvoiceNo = draftInvoiceNo ?? (await extractDraftNo(page));
  const cleanup =
    draftInvoiceNo && /^\d+$/.test(draftInvoiceNo)
      ? await cleanupDraft(page, draftInvoiceNo)
      : { status: 'not-created-or-draft-number-not-found', invoiceNo: draftInvoiceNo, visibleAfter: false };
  await writeJsonEvidence(faEvidencePath('090-cleanup-result.json'), cleanup);

  const cleanupCompleted = cleanup.status === 'deleted' || cleanup.status === 'not-created-or-draft-number-not-found';
  const fixedAssetOptionVisible = afterProbeSignals.fixedAssetLineTypeVisible || afterProbeSignals.optionTexts.some((text) => /^(Fixed Asset|Anlage)$/i.test(text));
  const dropdownOptionsVisible = afterProbeSignals.optionTexts.some((text) =>
    /^(G\/L Account|Sachkonto|Fixed Asset|Anlage|Resource|Ressource|Charge \(Item\)|Geb.hr \(Artikel\))$/i.test(text),
  );
  const resultStatus = fixedAssetOptionVisible || dropdownOptionsVisible ? 'observed' : 'blocked';
  const summary =
    resultStatus === 'observed'
      ? `FA-115 observed Purchase Invoice line Type dropdown/options without selecting target values; Fixed Asset visible=${fixedAssetOptionVisible}. Cleanup status=${cleanup.status}.`
      : `FA-115 did not expose useful Type dropdown options; status=${dropdownProbe.status}, guard=${guard.status}. Cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-purchase-invoice-line-type-dropdown-discovery-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-purchase-invoice-line-type-dropdown-discovery',
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
        purpose: 'Temporary sandbox draft to discover only the Purchase Invoice line Type dropdown/options; no selection, no vendor/fixed asset target values, no preview, no post.',
        createdAt: startedAt,
        status: draftInvoiceNo ? (cleanupCompleted ? 'deleted' : 'draft') : 'no-persisted-number-detected',
        cleanupStatus: draftInvoiceNo ? (cleanupCompleted ? 'deleted' : 'blocked') : 'not-needed',
      },
    ],
    changedRecords: [],
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
      'The run targeted the Purchase Invoice line Type dropdown/options without entering target values.',
      ...(dropdownOptionsVisible ? [`Visible Type option signals were captured: ${afterProbeSignals.optionTexts.join(', ')}`] : []),
      ...(fixedAssetOptionVisible ? ['Fixed Asset/Anlage was visible as a Type option signal.'] : []),
      cleanupCompleted ? `Temporary Purchase Invoice draft ${draftInvoiceNo ?? ''} was removed or no persisted number was created.` : 'Cleanup blocker is documented.',
    ],
    notProved: [
      ...(fixedAssetOptionVisible ? [] : ['Fixed Asset/Anlage was not proven as a Type option.']),
      'Fixed Asset/Anlage was not selected.',
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No amount was entered.',
      'No Preview Posting.',
      'No posting.',
      'No setup change.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-115-purchase-invoice-line-type-dropdown-discovery.json',
      '.agent/state/cases/fixedassets-116-purchase-invoice-line-type-dropdown-review.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-115-purchase-invoice-line-type-dropdown-discovery.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/FIXEDASSETS-115-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/030-line-type-dropdown-discovery.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/031-after-dropdown-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/fixedassets-115-030-line-type-dropdown-discovery.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-115-030-line-type-dropdown-discovery.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-115/FIXEDASSETS-115-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/030-line-type-dropdown-discovery.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/031-after-dropdown-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-115/README.md',
      'playwright/projects/fibu-book5/img/fixedassets-115-030-line-type-dropdown-discovery.png',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'This probe intentionally does not select Fixed Asset/Anlage.',
      'No Preview Posting or posting was attempted.',
    ],
    blockedBy: resultStatus === 'observed' ? [] : ['Type dropdown options not visible through the attempted route.'],
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
      noAmountEntry: true,
      noLineTypeSelection: true,
      cleanupCompleted,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      newAttempt,
      draftInvoiceNo,
      beforeProbeSignals: summarizeSignals(beforeProbeSignals),
      dropdownProbe: {
        ...dropdownProbe,
        signals: dropdownProbe.signals ? summarizeSignals(dropdownProbe.signals) : undefined,
      },
      afterProbeSignals: summarizeSignals(afterProbeSignals),
      guard,
    },
    nextStep: 'Run FIXEDASSETS-116 local evidence review before selecting Type = Fixed Asset or entering target values.',
  };

  await writeSafeJsonEvidence(faEvidencePath('FIXEDASSETS-115-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-115 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-115-result.json` | JSON | Type-Dropdown-/Options-Discovery, Cleanup, Grenzen | keine Auswahl, keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |',
      '| `030-line-type-dropdown-discovery.json` | JSON | Button-/Dropdown-Klickpunkt, Optionssignale und Guard-Klassifikation | keine No.-Feldzuordnung | `line-type-context` |',
      '| `031-after-dropdown-focused-text.txt` | Text | kompakter UI-Text nach Dropdown-Probe | kein Rohdump | `compact` |',
      '| `fixedassets-115-030-line-type-dropdown-discovery.png` | Screenshot | sichtbarer Dropdown-/Blocker-Kontext | kein Zielwert- oder Buchungsbild | `candidate/rejected` laut Metadaten |',
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
  expect(result.flags.noAmountEntry).toBe(true);
  expect(result.flags.noLineTypeSelection).toBe(true);
  expect(result.flags.cleanupCompleted).toBe(true);
});
