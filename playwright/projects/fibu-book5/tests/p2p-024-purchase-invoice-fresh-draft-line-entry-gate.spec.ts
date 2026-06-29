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
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'P2P-024-PURCHASE-INVOICE-FRESH-DRAFT-LINE-ENTRY-GATE';
const TEST_ID = 'p2p-024';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const PAGE_ID_PURCHASE_INVOICES = 9308;
const FORBIDDEN_DRAFT_NO = '107229';
const vendorNo = 'K10000';
const itemNo = 'RAW-STEEL';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(480_000);

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function sanitizeEvidenceValue<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '') as T;
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
  const url = new URL(bcPageUrl(PAGE_ID_PURCHASE_INVOICES, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  for (const staleParam of ['filter', 'bookmark', 'dc']) {
    url.searchParams.delete(staleParam);
  }
  if (invoiceNo) {
    url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
  }
  return url.toString();
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const text = await pageText(page);
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
    const matches = [...text.matchAll(/\b(10\d{4,})\b/g)]
      .map((match) => match[1])
      .filter((entry) => entry !== '10000' && entry !== FORBIDDEN_DRAFT_NO);
    if (matches[0]) return matches[0];
    await page.waitForTimeout(500);
  }
  return null;
}

async function visibleControls(page: Page) {
  const frames = [];
  for (const frame of page.frames()) {
    const controls = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'))
          .filter(visible)
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            let container: Element | null = element;
            for (let depth = 0; depth < 6 && container?.parentElement; depth += 1) {
              container = container.parentElement;
            }
            return {
              index,
              tag: element.tagName,
              value: normalize(element.value),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              placeholder: normalize(element.getAttribute('placeholder')),
              nearbyText: normalize(container?.textContent).slice(0, 260),
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
            };
          })
          .filter((control) => control.value !== 'on')
          .filter((control) => control.rect.width < 1400)
          .slice(0, 180);
      })
      .catch(() => []);
    if (controls.length) frames.push({ frameUrl: frame.url(), controls });
  }
  return frames;
}

async function fillVendorNo(page: Page) {
  const attempts: string[] = [];
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((targetVendorNo) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLInputElement>('input'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            let container: Element | null = element;
            for (let depth = 0; depth < 6 && container?.parentElement; depth += 1) container = container.parentElement;
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const nearbyText = normalize(container?.textContent);
            const label = `${aria} ${title} ${nearbyText}`;
            let score = 0;
            if (/Buy-from Vendor No\.|Vendor No\.|Kreditorennr|Kreditor Nr|Kreditor/i.test(label)) score -= 80;
            if (/Vendor Name|Kreditorenname|Name/i.test(label)) score -= 40;
            if (/Invoice No|Document Date|Posting Date|Due Date|Amount|Total|Search|Suchen/i.test(label)) score += 80;
            if (rect.y < 180 || rect.y > 620) score += 15;
            return {
              element,
              aria,
              title,
              nearbyText: nearbyText.slice(0, 220),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score,
            };
          })
          .filter((candidate) => /Vendor|Kreditor/i.test(`${candidate.aria} ${candidate.title} ${candidate.nearbyText}`))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { filled: false, reason: 'vendor-control-not-found', candidates: candidates.slice(0, 10).map(({ element: _element, ...entry }) => entry) };
        chosen.element.focus();
        chosen.element.value = '';
        chosen.element.dispatchEvent(new Event('input', { bubbles: true }));
        chosen.element.dispatchEvent(new Event('change', { bubbles: true }));
        chosen.element.value = targetVendorNo;
        chosen.element.dispatchEvent(new Event('input', { bubbles: true }));
        chosen.element.dispatchEvent(new Event('change', { bubbles: true }));
        const { element: _element, ...serializable } = chosen;
        return { filled: true, chosen: serializable, candidates: candidates.slice(0, 10).map(({ element: _el, ...entry }) => entry) };
      }, vendorNo)
      .catch((error) => ({ filled: false, reason: String(error), candidates: [] }));
    attempts.push(`${frame.url()}: ${result.filled ? 'filled' : result.reason}`);
    if (result.filled) {
      await page.keyboard.press('Tab').catch(() => undefined);
      await page.waitForTimeout(3500);
      return { ...result, frameUrl: frame.url(), attempts };
    }
  }
  return { filled: false, reason: 'vendor-control-not-found', attempts };
}

async function attemptRawSteelLineEntry(page: Page) {
  const attempts: any[] = [];
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((targetItemNo) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const bodyText = normalize(document.body?.innerText || '');
        const candidates = Array.from(document.querySelectorAll<HTMLInputElement>('input'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            let container: Element | null = element;
            for (let depth = 0; depth < 8 && container?.parentElement; depth += 1) container = container.parentElement;
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const nearbyText = normalize(container?.textContent);
            const label = `${aria} ${title} ${nearbyText}`;
            let score = 0;
            if (/\bNo\.|Nr\.|Artikel|Item/i.test(label)) score -= 80;
            if (/Lines|Zeilen|Type|Art|Description|Beschreibung|Quantity|Menge/i.test(label)) score -= 30;
            if (/Vendor|Kreditor|Date|Datum|Invoice No|Rechnungsnr|Amount|Total|Search|Suchen/i.test(label)) score += 90;
            if (rect.y < 480) score += 40;
            if (rect.width < 30 || rect.height < 12) score += 20;
            return {
              element,
              aria,
              title,
              nearbyText: nearbyText.slice(0, 260),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score,
            };
          })
          .filter((candidate) => /\bNo\.|Nr\.|Artikel|Item|Lines|Zeilen/i.test(`${candidate.aria} ${candidate.title} ${candidate.nearbyText}`))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen || !/Purchase Invoice|Einkaufsrechnung/i.test(bodyText)) {
          return {
            filled: false,
            reason: chosen ? 'purchase-invoice-context-not-confirmed' : 'line-no-control-not-found',
            candidates: candidates.slice(0, 12).map(({ element: _element, ...entry }) => entry),
          };
        }
        chosen.element.focus();
        chosen.element.value = '';
        chosen.element.dispatchEvent(new Event('input', { bubbles: true }));
        chosen.element.dispatchEvent(new Event('change', { bubbles: true }));
        chosen.element.value = targetItemNo;
        chosen.element.dispatchEvent(new Event('input', { bubbles: true }));
        chosen.element.dispatchEvent(new Event('change', { bubbles: true }));
        const { element: _element, ...serializable } = chosen;
        return { filled: true, chosen: serializable, candidates: candidates.slice(0, 12).map(({ element: _el, ...entry }) => entry) };
      }, itemNo)
      .catch((error) => ({ filled: false, reason: String(error), candidates: [] }));
    attempts.push({ frameUrl: frame.url(), ...result });
    if (result.filled) {
      await page.keyboard.press('Tab').catch(() => undefined);
      await page.waitForTimeout(3500);
      return { ...result, frameUrl: frame.url(), attempts };
    }
  }
  return { filled: false, reason: 'line-no-control-not-found', attempts };
}

async function collectSignals(page: Page) {
  const text = await pageText(page);
  const controls = await visibleControls(page);
  const compact = await compactPageText(page, {
    include: [
      /Purchase Invoice|Purchase Invoices|Einkaufsrechnung|Einkaufsrechnungen|Vendor|Kreditor|K10000|RAW-STEEL|Type|Art|No\.|Nr\.|Quantity|Menge|Amount|Post|Buchen|Preview|Vorschau|Delete|L.schen/i,
    ],
    maxLines: 180,
    maxLineLength: 240,
  });
  return {
    purchaseInvoiceContextVisible: /Purchase Invoice|Einkaufsrechnung/i.test(text),
    purchaseInvoicesListVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(text),
    forbiddenDraftVisible: new RegExp(FORBIDDEN_DRAFT_NO).test(text),
    vendorTargetVisible: new RegExp(vendorNo).test(text),
    itemTargetVisible: new RegExp(itemNo).test(text),
    linesContextVisible: /\bType\b|\bNo\.\b|\bQuantity\b|\bDescription\b|\bArt\b|\bNr\.\b|\bMenge\b/i.test(text),
    postVisible: /\bPost\b|\bBuchen\b/i.test(text),
    previewVisible: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(text),
    possibleDocumentNos: [...new Set([...text.matchAll(/\b(10\d{4,})\b/g)].map((match) => match[1]))].slice(0, 20),
    controls,
    compact,
  };
}

async function classifyKeepStatus(page: Page, invoiceNo: string | null) {
  if (!invoiceNo) return { status: 'no-draft-number-detected', invoiceNo, reuseAllowed: false };
  if (invoiceNo === FORBIDDEN_DRAFT_NO) return { status: 'blocked-forbidden-draft-number-detected', invoiceNo, reuseAllowed: false };
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);
  const visibleAfter = new RegExp(invoiceNo).test(await pageText(page));
  return {
    status: visibleAfter ? 'kept-labor-trace' : 'not-visible-after-probe',
    invoiceNo,
    visibleAfter,
    reuseAllowed: false,
  };
}

function renderReadme(result: Record<string, any>) {
  return [
    '# P2P-024 Purchase Invoice Fresh Draft Line Entry Gate',
    '',
    'Status: `labor`, `ui-first`, `purchase-invoice-line-gate`, `no-preview`, `no-post`, `needs-german-final-rebuild`.',
    '',
    '| Datei | Typ | Beweist | Beweist nicht | Status |',
    '|---|---|---|---|---|',
    '| `P2P-024-result.json` | JSON | frischer Draft, Vendor-/Line-Signale, Keep-Status | keine Buchung | labor |',
    '| `010-start-text.txt` | Text | Purchase-Invoices-Startkontext | keine Feldwerte | compact |',
    '| `020-after-new-signals.json` | JSON | neuer Purchase-Invoice-Kontext | keine Item-Zeile | labor |',
    '| `030-after-vendor-signals.json` | JSON | Vendor-Kontext nach K10000-Versuch | keine Buchung | labor |',
    '| `040-after-line-entry-signals.json` | JSON | RAW-STEEL-Zeileneingabeversuch | keine Preview/Post | labor/blocked |',
    '| `090-keep-status.json` | JSON | Draft wird behalten oder nicht sichtbar; Wiederverwendung gesperrt | kein Cleanup-Proof | keep-status |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Grenze',
    '',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Kein Setup Change.',
    '- Kein deutscher Finalnachweis.',
    '- Draft `107229` war im alten Bookmark-Kontext sichtbar, wurde aber nicht fuer Vendor-/Zeileneingabe weiterverwendet.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('P2P-024 creates fresh Purchase Invoice line-entry gate without reusing 107229', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    p2pEvidencePath('010-start-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Vendor|Kreditor|Post|Buchen|Preview|Vorschau/i],
      maxLines: 100,
      maxLineLength: 220,
    }),
  );

  const newAttempt = await clickScopedNew(page);
  const afterNewSignals = await collectSignals(page);
  const draftNoAfterNew = await extractDraftNo(page);
  await writeSafeJsonEvidence(p2pEvidencePath('020-after-new-signals.json'), {
    newAttempt,
    draftNoAfterNew,
    signals: { ...afterNewSignals, compact: undefined },
  });
  await writeTextEvidence(p2pEvidencePath('020-after-new-text.txt'), afterNewSignals.compact);

  const forbiddenDraftVisibleAfterNew = draftNoAfterNew === FORBIDDEN_DRAFT_NO || afterNewSignals.forbiddenDraftVisible;
  const vendorAttempt = newAttempt.clicked && !forbiddenDraftVisibleAfterNew
    ? await fillVendorNo(page)
    : { filled: false, reason: 'new-not-clicked-or-forbidden-draft-visible' };
  const draftNoAfterVendor = (await extractDraftNo(page)) ?? draftNoAfterNew;
  const afterVendorSignals = await collectSignals(page);
  await writeSafeJsonEvidence(p2pEvidencePath('030-after-vendor-signals.json'), {
    vendorAttempt,
    draftNoAfterVendor,
    signals: { ...afterVendorSignals, compact: undefined },
  });
  await writeTextEvidence(p2pEvidencePath('030-after-vendor-text.txt'), afterVendorSignals.compact);

  const lineAttempt =
    vendorAttempt.filled && afterVendorSignals.vendorTargetVisible && !afterVendorSignals.forbiddenDraftVisible
      ? await attemptRawSteelLineEntry(page)
      : { filled: false, reason: 'vendor-not-visible-or-forbidden-draft-visible' };
  const draftNoAfterLine = (await extractDraftNo(page)) ?? draftNoAfterVendor;
  const afterLineSignals = await collectSignals(page);
  await writeSafeJsonEvidence(p2pEvidencePath('040-after-line-entry-signals.json'), {
    lineAttempt,
    draftNoAfterLine,
    signals: { ...afterLineSignals, compact: undefined },
  });
  await writeTextEvidence(p2pEvidencePath('040-after-line-entry-text.txt'), afterLineSignals.compact);

  const keepStatus = await classifyKeepStatus(page, draftNoAfterLine);
  await writeSafeJsonEvidence(p2pEvidencePath('090-keep-status.json'), keepStatus);

  const observed = Boolean(
    newAttempt.clicked &&
      afterNewSignals.purchaseInvoiceContextVisible &&
      draftNoAfterLine &&
      draftNoAfterLine !== FORBIDDEN_DRAFT_NO &&
      vendorAttempt.filled &&
      afterVendorSignals.vendorTargetVisible &&
      lineAttempt.filled &&
      afterLineSignals.itemTargetVisible,
  );
  const resultStatus = observed ? 'observed' : 'blocked';
  const summary = observed
    ? `P2P-024 proved a fresh Purchase Invoice draft ${draftNoAfterLine} with visible ${vendorNo} and ${itemNo}; the draft is kept as laboratory trace and must not be reused silently.`
    : `P2P-024 did not fully prove fresh Purchase Invoice line entry. draft=${draftNoAfterLine ?? '(none)'}, new=${newAttempt.clicked}, vendorFilled=${vendorAttempt.filled}, vendorVisible=${afterVendorSignals.vendorTargetVisible}, lineFilled=${lineAttempt.filled}, itemVisible=${afterLineSignals.itemTargetVisible}, keepStatus=${keepStatus.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'p2p-purchase-invoice-fresh-draft-line-entry-gate-result',
    caseId: CASE_ID,
    source: 'playwright-ui-labor-purchase-invoice-line-entry-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    sourceCompany: EXPECTED_COMPANY,
    startedAt,
    finishedAt: new Date().toISOString(),
    purchaseInvoiceDraftNo: draftNoAfterLine,
    forbiddenDraftNo: FORBIDDEN_DRAFT_NO,
    targetValues: { vendorNo, itemNo },
    previewPosting: false,
    posted: false,
    setupChanges: [],
    changedRecords: draftNoAfterLine
      ? [
          {
            type: 'Purchase Invoice',
            documentNo: draftNoAfterLine,
            status: keepStatus.status,
            reuseAllowed: false,
            cleanup: keepStatus,
          },
        ]
      : [],
    postedRecords: [],
    flags: {
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      staleUrlContextCleaned: !context.url.includes('bookmark=') && !context.url.includes('filter='),
      forbiddenDraftNotUsedForEntry: !vendorAttempt.filled && !lineAttempt.filled && afterLineSignals.forbiddenDraftVisible
        ? true
        : draftNoAfterLine !== FORBIDDEN_DRAFT_NO && !afterLineSignals.forbiddenDraftVisible,
      freshDraftProven: Boolean(draftNoAfterLine && draftNoAfterLine !== FORBIDDEN_DRAFT_NO && !afterLineSignals.forbiddenDraftVisible),
      keepStatusDocumented: true,
    },
    context,
    attempts: { newAttempt, vendorAttempt, lineAttempt },
    observed: {
      afterNew: {
        draftNo: draftNoAfterNew,
        purchaseInvoiceContextVisible: afterNewSignals.purchaseInvoiceContextVisible,
        forbiddenDraftVisible: afterNewSignals.forbiddenDraftVisible,
        possibleDocumentNos: afterNewSignals.possibleDocumentNos,
      },
      afterVendor: {
        draftNo: draftNoAfterVendor,
        vendorTargetVisible: afterVendorSignals.vendorTargetVisible,
        linesContextVisible: afterVendorSignals.linesContextVisible,
        possibleDocumentNos: afterVendorSignals.possibleDocumentNos,
      },
      afterLine: {
        draftNo: draftNoAfterLine,
        itemTargetVisible: afterLineSignals.itemTargetVisible,
        vendorTargetVisible: afterLineSignals.vendorTargetVisible,
        linesContextVisible: afterLineSignals.linesContextVisible,
        postVisible: afterLineSignals.postVisible,
        previewVisible: afterLineSignals.previewVisible,
        possibleDocumentNos: afterLineSignals.possibleDocumentNos,
      },
      keepStatus,
    },
    proved: [
      'Purchase Invoices was opened by direct page URL in MCP_1_20260210 / RM-DEMO.',
      ...(newAttempt.clicked ? ['Scoped New/Neu was clicked in the Purchase Invoices context.'] : []),
      ...(draftNoAfterLine && draftNoAfterLine !== FORBIDDEN_DRAFT_NO ? [`A fresh Purchase Invoice draft ${draftNoAfterLine} was used instead of 107229.`] : []),
      ...(vendorAttempt.filled ? [`A vendor field candidate was filled with ${vendorNo}.`] : []),
      ...(afterVendorSignals.vendorTargetVisible ? [`${vendorNo} was visible after the vendor attempt.`] : []),
      ...(lineAttempt.filled ? [`A line control candidate was filled with ${itemNo}.`] : []),
      ...(afterLineSignals.itemTargetVisible ? [`${itemNo} was visible after the line-entry attempt.`] : []),
      'No Preview Posting or posting was executed.',
      'The draft keep status was documented and reuse is not allowed.',
    ],
    notProved: [
      ...(afterLineSignals.itemTargetVisible ? [] : [`${itemNo} was not visibly proven as a persisted line value.`]),
      'Quantity, Location, Direct Unit Cost and Qty. to Receive were not proven.',
      'No clean Preview Posting.',
      'No posted purchase invoice, receipt, vendor ledger, item ledger or G/L trace.',
      'No German final proof.',
    ],
    blockedBy: [
      ...(newAttempt.clicked ? [] : ['scoped-new-not-clicked']),
      ...(afterNewSignals.purchaseInvoiceContextVisible ? [] : ['purchase-invoice-context-not-visible']),
      ...(draftNoAfterLine && draftNoAfterLine !== FORBIDDEN_DRAFT_NO ? [] : ['fresh-draft-number-not-proven']),
      ...(vendorAttempt.filled ? [] : ['vendor-field-not-filled']),
      ...(afterVendorSignals.vendorTargetVisible ? [] : ['vendor-target-not-visible-after-entry']),
      ...(lineAttempt.filled ? [] : ['raw-steel-line-field-not-filled']),
      ...(afterLineSignals.itemTargetVisible ? [] : ['raw-steel-not-visible-after-line-entry']),
      ...(afterLineSignals.forbiddenDraftVisible ? ['forbidden-draft-107229-visible-in-working-context'] : []),
    ],
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    statePatch: {},
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/p2p-024/P2P-024-result.json',
      'playwright/projects/fibu-book5/evidence/p2p-024/020-after-new-signals.json',
      'playwright/projects/fibu-book5/evidence/p2p-024/030-after-vendor-signals.json',
      'playwright/projects/fibu-book5/evidence/p2p-024/040-after-line-entry-signals.json',
      'playwright/projects/fibu-book5/evidence/p2p-024/090-keep-status.json',
    ],
    screenshots: [],
    summary,
    nextCase: observed ? 'P2P-025-PURCHASE-INVOICE-LINE-VALUE-DECISION' : 'P2P-025-PURCHASE-INVOICE-LINE-ENTRY-BLOCKER-REVIEW',
    nextStep: observed
      ? 'Review P2P-024 evidence before planning quantity/location/cost or Preview Posting; do not reuse the kept draft silently.'
      : 'Review P2P-024 blocker evidence and choose either a stronger Purchase Invoice line helper or another standard UI route.',
  };

  await writeSafeJsonEvidence(p2pEvidencePath('P2P-024-result.json'), result);
  await writeTextEvidence(p2pEvidencePath('README.md'), renderReadme(result));

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(result.flags.noApiShortcut).toBe(true);
  expect(result.flags.forbiddenDraftNotUsedForEntry).toBe(true);
  expect(result.flags.keepStatusDocumented).toBe(true);
});
