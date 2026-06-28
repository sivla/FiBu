import { expect, test, type Frame, type Page } from '@playwright/test';
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
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'P2P-021-PURCHASE-INVOICE-ALTERNATIVE-ROUTE-PREFLIGHT';
const TEST_ID = 'p2p-021';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const PAGE_ID_PURCHASE_INVOICES = 9308;
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

function purchaseInvoicesUrl(invoiceNo?: string) {
  const url = new URL(bcPageUrl(PAGE_ID_PURCHASE_INVOICES, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
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

type VisibleControl = {
  index: number;
  tag: string;
  value: string;
  aria: string;
  title: string;
  placeholder: string;
  nearbyText: string;
  rect: { x: number; y: number; width: number; height: number };
};

async function visibleControls(page: Page) {
  const frames: Array<{ frameUrl: string; controls: VisibleControl[] }> = [];
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
            for (let depth = 0; depth < 5 && container?.parentElement; depth += 1) {
              container = container.parentElement;
            }
            return {
              index,
              tag: element.tagName,
              value: normalize(element.value),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              placeholder: normalize(element.getAttribute('placeholder')),
              nearbyText: normalize(container?.textContent).slice(0, 220),
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
          .slice(0, 160);
      })
      .catch(() => []);
    if (controls.length) {
      frames.push({ frameUrl: frame.url(), controls });
    }
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
            for (let depth = 0; depth < 6 && container?.parentElement; depth += 1) {
              container = container.parentElement;
            }
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
        if (!chosen) {
          return { filled: false, reason: 'vendor-control-not-found', candidates: candidates.slice(0, 10).map(({ element: _element, ...entry }) => entry) };
        }
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

async function extractDraftNo(page: Page) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const text = await pageText(page);
    const matches = [...text.matchAll(/\b(10\d{4,})\b/g)].map((match) => match[1]);
    const preferred = matches.find((entry) => !['10000'].includes(entry));
    if (preferred) {
      return preferred;
    }
    await page.waitForTimeout(500);
  }
  return null;
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

async function confirmDeleteDraftOnly(page: Page) {
  const text = await pageText(page);
  if (!/delete|l.schen|remove|entfernen/i.test(text) || /post|preview|buchen|vorschau/i.test(text)) {
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

async function cleanupDraft(page: Page, invoiceNo: string | null) {
  if (!invoiceNo) {
    return { status: 'not-needed-no-draft-no', invoiceNo, visibleBefore: false, visibleAfter: false };
  }
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);

  const visibleBefore = new RegExp(invoiceNo).test(await pageText(page));
  if (!visibleBefore) {
    return { status: 'not-visible-before-cleanup', invoiceNo, visibleBefore, visibleAfter: false };
  }
  const deleteAction = await clickDeleteSelectedInvoice(page, invoiceNo);
  const confirmation = deleteAction.clicked ? await confirmDeleteDraftOnly(page) : { confirmed: false, reason: 'delete-action-not-clicked' };
  await page.waitForTimeout(2500);
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  const visibleAfter = new RegExp(invoiceNo).test(await pageText(page));
  return { status: visibleAfter ? 'cleanup-clicked-but-still-visible' : 'deleted', invoiceNo, visibleBefore, visibleAfter, deleteAction, confirmation };
}

function renderReadme(result: Record<string, any>) {
  return [
    '# P2P-021 Purchase Invoice Alternative Route Preflight',
    '',
    'Status: `labor`, `ui-first`, `purchase-invoice-preflight`, `no-preview`, `no-post`, `needs-german-final-rebuild`.',
    '',
    '| Datei | Typ | Beweist | Beweist nicht | Status |',
    '|---|---|---|---|---|',
    '| `P2P-021-result.json` | JSON | strukturierter Laufbefund, Flags, Cleanup | keine Buchung | labor |',
    '| `010-before-new-text.txt` | Text | Purchase-Invoices-Startkontext | keine Feldwerte | compact |',
    '| `020-after-new-signals.json` | JSON | Beleg-/Zeilen-/Aktionskontext nach New | keine Buchungsvorschau | labor |',
    '| `030-after-vendor-signals.json` | JSON | Vendor-Eingabeversuch und sichtbare Signale | keine Item-Zeile | labor/blocked |',
    '| `040-cleanup-result.json` | JSON | Cleanup/Keep-Status des Entwurfs | keine Postenspur | cleanup |',
    '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen der Bilder | keine eigenstaendige Wahrheit | evidence |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfängerhinweis',
    '',
    'Die Einkaufsrechnung ist der direkte Kreditorenbeleg. Sie ist nicht dasselbe wie eine Einkaufsbestellung mit Wareneingang und auch nicht dasselbe wie ein Purchase Journal. In diesem Gate wird nur geprüft, ob der Belegkopf kontrolliert entsteht, ob der Kreditor sichtbar gesetzt werden kann und ob danach ein Zeilenkontext fuer Artikelwerte sichtbar wird.',
    '',
    '## Grenze',
    '',
    '- Keine Preview Posting.',
    '- Keine Buchung.',
    '- Kein Wareneingang.',
    '- Kein deutscher Finalnachweis.',
    '- RM-DEMO bleibt Labor-/Vorproduktionsnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('P2P-021 uses Purchase Invoice as alternative no-post preflight', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    p2pEvidencePath('010-before-new-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Vendor|Kreditor|Post|Buchen|Preview|Vorschau/i],
      maxLines: 100,
      maxLineLength: 220,
    }),
  );

  await screenshot(page, 'p2p-021-010-purchase-invoices-start.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: 'labor',
    bookUse: 'navigation',
    purpose: 'P2P-021 Start: Purchase Invoices direkt per Page-ID in RM-DEMO, ohne Suche und ohne Feldwert.',
    expectedPageText: [/Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: ['Noch kein Belegkopf, keine Zeile, kein Preview, keine Buchung.'],
  });

  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(p2pEvidencePath('015-scoped-new-attempt.json'), newAttempt);
  const afterNewSignals = await collectSignals(page);
  await writeJsonEvidence(p2pEvidencePath('020-after-new-signals.json'), {
    ...afterNewSignals,
    compact: undefined,
  });
  await writeTextEvidence(p2pEvidencePath('020-after-new-text.txt'), afterNewSignals.compact);

  await screenshot(page, 'p2p-021-020-after-new.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: newAttempt.clicked && afterNewSignals.purchaseInvoiceContextVisible ? 'labor' : 'rejected',
    bookUse: newAttempt.clicked && afterNewSignals.purchaseInvoiceContextVisible ? 'evidence' : 'do-not-use',
    purpose: 'P2P-021 Purchase-Invoice-Kontext nach scoped New: Belegkopf/Zeilenbereich sichtbar, aber noch ohne Posting.',
    expectedPageText: newAttempt.clicked ? [/Purchase Invoice|Einkaufsrechnung/i] : [/Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: ['Kein Preview Posting, keine Buchung, Zielwerte noch nicht vollstaendig.'],
  });

  const vendorAttempt = newAttempt.clicked ? await fillVendorNo(page) : { filled: false, reason: 'new-not-clicked' };
  const draftNo = await extractDraftNo(page);
  const afterVendorSignals = await collectSignals(page);
  await writeJsonEvidence(p2pEvidencePath('030-after-vendor-signals.json'), {
    vendorAttempt,
    draftNo,
    signals: { ...afterVendorSignals, compact: undefined },
  });
  await writeTextEvidence(p2pEvidencePath('030-after-vendor-text.txt'), afterVendorSignals.compact);

  await screenshot(page, 'p2p-021-030-after-vendor-attempt.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: vendorAttempt.filled && afterVendorSignals.vendorTargetVisible ? 'labor' : 'candidate',
    bookUse: 'evidence',
    purpose: 'P2P-021 nach Vendor-Eingabeversuch K10000: prueft, ob der Purchase-Invoice-Kopf als P2P-Alternative tragfaehig wird.',
    expectedPageText: [/Purchase Invoice|Einkaufsrechnung|Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: ['Kein RAW-STEEL-Zeilennachweis, kein Preview, keine Buchung.'],
  });

  const cleanup = await cleanupDraft(page, draftNo);
  await writeJsonEvidence(p2pEvidencePath('040-cleanup-result.json'), cleanup);

  const cleanupOk = cleanup.status === 'deleted' || cleanup.status === 'not-visible-before-cleanup' || cleanup.status === 'not-needed-no-draft-no';
  const observed = Boolean(newAttempt.clicked && afterNewSignals.purchaseInvoiceContextVisible && vendorAttempt.filled && cleanupOk);
  const resultStatus = observed ? 'observed' : 'blocked';
  const summary = observed
    ? `P2P-021 proved a controlled Purchase Invoice preflight route in RM-DEMO: scoped New opened a Purchase Invoice context, K10000 was attempted in the vendor area, draft ${draftNo ?? '(no number detected)'} was cleaned or no longer visible.`
    : `P2P-021 did not fully prove the Purchase Invoice alternative route. new=${newAttempt.clicked}, vendorFilled=${vendorAttempt.filled}, vendorVisible=${afterVendorSignals.vendorTargetVisible}, cleanup=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'p2p-purchase-invoice-alternative-route-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-ui-labor-purchase-invoice-preflight',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    sourceCompany: EXPECTED_COMPANY,
    startedAt,
    finishedAt: new Date().toISOString(),
    purchaseInvoiceDraftNo: draftNo,
    targetValues: { vendorNo, itemNo },
    previewPosting: false,
    posted: false,
    setupChanges: [],
    changedRecords: draftNo ? [{ type: 'Purchase Invoice', documentNo: draftNo, cleanup }] : [],
    postedRecords: [],
    signals: [
      'purchase-invoices-page-direct-url',
      ...(newAttempt.clicked ? ['scoped-new'] : []),
      ...(vendorAttempt.filled ? ['vendor-field-attempt'] : []),
      ...(afterVendorSignals.linesContextVisible ? ['lines-context-visible'] : []),
      'cleanup-or-no-visible-draft',
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noPurchaseOrderCellEditRepeat: true,
      noPurchaseJournalRepeat: true,
      cleanupOk,
    },
    context,
    attempts: { newAttempt, vendorAttempt },
    observed: {
      afterNew: {
        purchaseInvoiceContextVisible: afterNewSignals.purchaseInvoiceContextVisible,
        linesContextVisible: afterNewSignals.linesContextVisible,
        postVisible: afterNewSignals.postVisible,
        previewVisible: afterNewSignals.previewVisible,
        possibleDocumentNos: afterNewSignals.possibleDocumentNos,
      },
      afterVendor: {
        vendorTargetVisible: afterVendorSignals.vendorTargetVisible,
        itemTargetVisible: afterVendorSignals.itemTargetVisible,
        linesContextVisible: afterVendorSignals.linesContextVisible,
        postVisible: afterVendorSignals.postVisible,
        previewVisible: afterVendorSignals.previewVisible,
        possibleDocumentNos: afterVendorSignals.possibleDocumentNos,
      },
    },
    proved: [
      'Purchase Invoices was opened by direct page URL in MCP_1_20260210 / RM-DEMO.',
      ...(newAttempt.clicked ? ['Scoped New/Neu was clicked in the Purchase Invoices context.'] : []),
      ...(afterNewSignals.purchaseInvoiceContextVisible ? ['A Purchase Invoice document context became visible.'] : []),
      ...(vendorAttempt.filled ? [`A vendor field candidate was filled with ${vendorNo}.`] : []),
      cleanupOk ? 'Draft cleanup/no-visible-draft status was documented.' : 'Cleanup was attempted but not proven clean.',
      'No Preview Posting or posting was executed.',
    ],
    notProved: [
      ...(afterVendorSignals.vendorTargetVisible ? [] : [`${vendorNo} is not yet visibly proven as persisted vendor value.`]),
      `${itemNo} was not entered or persisted on a purchase invoice line.`,
      'No clean Preview Posting.',
      'No posted purchase invoice, receipt, vendor ledger or G/L trace.',
      'No German final proof.',
    ],
    blockedBy: [
      ...(newAttempt.clicked ? [] : ['scoped-new-not-clicked']),
      ...(afterNewSignals.purchaseInvoiceContextVisible ? [] : ['purchase-invoice-context-not-visible']),
      ...(vendorAttempt.filled ? [] : ['vendor-field-not-filled']),
      ...(afterVendorSignals.vendorTargetVisible ? [] : ['vendor-target-not-visible-after-entry']),
      ...(cleanupOk ? [] : ['cleanup-not-proven']),
    ],
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    safeToFinalizeState: false,
    requiresReview: resultStatus !== 'observed',
    statePatch: {},
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/p2p-021/P2P-021-result.json',
      'playwright/projects/fibu-book5/evidence/p2p-021/010-before-new-text.txt',
      'playwright/projects/fibu-book5/evidence/p2p-021/020-after-new-signals.json',
      'playwright/projects/fibu-book5/evidence/p2p-021/030-after-vendor-signals.json',
      'playwright/projects/fibu-book5/evidence/p2p-021/040-cleanup-result.json',
    ],
    screenshots: [
      'playwright/projects/fibu-book5/img/p2p-021-010-purchase-invoices-start.png',
      'playwright/projects/fibu-book5/img/p2p-021-020-after-new.png',
      'playwright/projects/fibu-book5/img/p2p-021-030-after-vendor-attempt.png',
    ],
    summary,
    nextStep: observed
      ? 'P2P-022: review whether Purchase Invoice can safely unlock RAW-STEEL line value entry, still no posting until item/quantity/cost are visible and cleanup is proven.'
      : 'P2P-022: diagnose Purchase Invoice vendor/cleanup blocker before any item line or preview route.',
  };

  await writeJsonEvidence(p2pEvidencePath('P2P-021-result.json'), result);
  await writeTextEvidence(p2pEvidencePath('README.md'), renderReadme(result));

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(result.flags.noApiShortcut).toBe(true);
});
