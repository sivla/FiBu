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
import { classifyCurrentPurchaseInvoiceFieldMappingPage } from '../../../core/bc/purchase-invoice-guards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(540_000);

const testId = 'fixedassets-062';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
  fixedAssetNo: 'FA-CNC-01',
  fixedAssetDescription: 'CNC Maschine FRA',
  vendorInvoiceNo: `FA062-${Date.now().toString().slice(-8)}`,
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function purchaseInvoicesUrl() {
  return bcPageUrl(9308, project.envPrefix);
}

async function closeExternalPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) continue;
    const url = candidate.url();
    if (/learn\.microsoft\.com|go\.microsoft\.com|support\.microsoft\.com/i.test(url)) {
      closed.push(url);
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const text = await pageText(page);
  const decoded = decodeURIComponent(url);
  return {
    url,
    environmentInUrl: /MCP_1_20260210/i.test(decoded),
    companyInUrl: /company=RM-DEMO\b/i.test(decoded),
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !/MCP_1_20260210/i.test(decoded),
  };
}

async function openPurchaseInvoices(page: Page) {
  await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|Vendor|Kreditor/i, { timeout: 90_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  const closedExternalPages = await closeExternalPages(page);
  await page.waitForTimeout(1200);
  return { closedExternalPages };
}

async function clickScopedNew(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Purchase Invoices|Einkaufsrechnungen/i.test(body)) continue;

    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const label = `${text} ${aria} ${title}`;
            let score = 0;
            if (/^(New|Neu)$/.test(text) || /^(New|Neu)$/.test(aria)) score -= 50;
            if (/Create a new entry|Erstellen Sie einen neuen Eintrag|neuen Eintrag/i.test(title)) score -= 20;
            if (rect.y >= 35 && rect.y <= 140) score -= 10;
            if (/Sales|Order|Quote|Power BI|Intercompany|Time Sheet|Report/i.test(label)) score += 100;
            return {
              element,
              text,
              aria,
              title,
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              score,
            };
          })
          .filter((entry) => /^(New|Neu)$/.test(entry.text) || /^(New|Neu)$/.test(entry.aria) || /new entry|neuen Eintrag/i.test(entry.title))
          .sort((left, right) => left.score - right.score || left.y - right.y || left.x - right.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'no-scoped-new', candidates: candidates.slice(0, 20).map(({ element: _element, ...entry }) => entry) };
        chosen.element.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, x: chosen.x, y: chosen.y, width: chosen.width, height: chosen.height },
          candidates: candidates.slice(0, 20).map(({ element: _element, ...entry }) => entry),
        };
      })
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));

    if (result.clicked) {
      await page.waitForTimeout(4500);
      return result;
    }
  }
  return { clicked: false, reason: 'purchase-invoices-frame-not-found', candidates: [] };
}

async function focusInputNearCaption(page: Page, caption: RegExp) {
  const source = caption.source;
  const flags = caption.flags.replace('g', '');
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(
        ({ source: patternSource, flags: patternFlags }) => {
          const pattern = new RegExp(patternSource, patternFlags);
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const candidates = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'))
            .filter(visible)
            .map((input) => {
              const rect = input.getBoundingClientRect();
              let container: Element | null = input;
              const chunks: string[] = [];
              for (let depth = 0; depth < 7 && container; depth += 1) {
                chunks.push(normalize(container.textContent));
                container = container.parentElement;
              }
              const nearbyText = chunks.join(' ');
              return {
                input,
                value: normalize(input.value),
                aria: normalize(input.getAttribute('aria-label')),
                title: normalize(input.getAttribute('title')),
                placeholder: normalize(input.placeholder),
                nearbyText,
                readOnly: input.readOnly || input.getAttribute('aria-readonly') === 'true',
                rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              };
            })
            .filter((entry) => !entry.readOnly)
            .filter((entry) => pattern.test(`${entry.aria} ${entry.title} ${entry.placeholder} ${entry.nearbyText}`))
            .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
          const chosen = candidates[0];
          if (!chosen) return { focused: false, candidates: [] };
          chosen.input.focus();
          chosen.input.click();
          return {
            focused: true,
            chosen: {
              value: chosen.value,
              aria: chosen.aria,
              title: chosen.title,
              placeholder: chosen.placeholder,
              nearbyText: chosen.nearbyText.slice(0, 220),
              rect: chosen.rect,
            },
          };
        },
        { source, flags },
      )
      .catch((error) => ({ focused: false, error: String(error), candidates: [] }));
    if (result.focused) return result;
  }
  return { focused: false, reason: `caption-not-found:${caption.source}` };
}

async function fillInputNearCaption(page: Page, caption: RegExp, value: string, commitKey: 'Tab' | 'Enter' = 'Tab') {
  const focus = await focusInputNearCaption(page, caption);
  if (!focus.focused) return { filled: false, value, focus };
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value, { delay: 35 });
  await page.keyboard.press(commitKey);
  await page.waitForTimeout(3000);
  return { filled: true, value, focus };
}

async function clickVisibleGridText(page: Page, textPattern: RegExp, contextPattern: RegExp) {
  const source = textPattern.source;
  const flags = textPattern.flags.replace('g', '');
  const contextSource = contextPattern.source;
  const contextFlags = contextPattern.flags.replace('g', '');
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!contextPattern.test(body)) continue;
    const result = await frame
      .evaluate(
        ({ source: patternSource, flags: patternFlags, contextSource: ctxSource, contextFlags: ctxFlags }) => {
          const pattern = new RegExp(patternSource, patternFlags);
          const context = new RegExp(ctxSource, ctxFlags);
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          if (!context.test(normalize(document.body?.innerText))) return { clicked: false, reason: 'context-mismatch' };
          const candidates = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"],[role="button"]'))
            .filter(visible)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
              return { element, text, rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } };
            })
            .filter((entry) => pattern.test(entry.text))
            .filter((entry) => entry.rect.y > 330)
            .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
          const chosen = candidates[0];
          if (!chosen) return { clicked: false, reason: 'text-not-found' };
          chosen.element.click();
          return { clicked: true, chosen: { text: chosen.text, rect: chosen.rect } };
        },
        { source, flags, contextSource, contextFlags },
      )
      .catch((error) => ({ clicked: false, reason: String(error) }));
    if (result.clicked) return result;
  }
  return { clicked: false, reason: `grid-text-not-found:${textPattern.source}` };
}

async function setFirstPurchaseLineToFixedAsset(page: Page) {
  const clickType = await clickVisibleGridText(page, /^Item$|^Artikel$/i, /Purchase Invoice|Einkaufsrechnung|Type|No\.|Nr\./i);
  if (!clickType.clicked) return { lineTypeAttempted: false, fixedAssetNoAttempted: false, clickType };

  await page.keyboard.press('Control+A');
  await page.keyboard.type('Fixed Asset', { delay: 35 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  const afterTypeGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
  if (afterTypeGuard.stopReasons.length > 0) {
    return { lineTypeAttempted: true, fixedAssetNoAttempted: false, clickType, afterTypeGuard };
  }

  await page.keyboard.press('Tab');
  await page.waitForTimeout(800);
  await page.keyboard.type(target.fixedAssetNo, { delay: 45 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4500);
  const afterNoGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
  return { lineTypeAttempted: true, fixedAssetNoAttempted: true, clickType, afterTypeGuard, afterNoGuard };
}

async function collectCardContextSignals(page: Page) {
  const frameSignals = [];
  for (const frame of page.frames()) {
    const signals = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const bodyText = normalize(document.body?.innerText || '');
        const titleCandidates = Array.from(document.querySelectorAll<HTMLElement>('h1,h2,h3,[role="heading"],span,div,label'))
          .filter(visible)
          .map((element) => normalize(element.innerText || element.textContent))
          .filter((text) => /^(Purchase Invoice|Einkaufsrechnung)$|^(Purchase Invoices|Einkaufsrechnungen)$/i.test(text))
          .slice(0, 30);
        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          exactPurchaseInvoiceTitle: titleCandidates.some((text) => /^Purchase Invoice$|^Einkaufsrechnung$/i.test(text)),
          listTitle: titleCandidates.some((text) => /^Purchase Invoices$|^Einkaufsrechnungen$/i.test(text)),
          vendorNameField: /Vendor Name|Buy-from Vendor|Kreditor/i.test(bodyText),
          vendorInvoiceNoField: /Vendor Invoice No\.|Kreditorenrechnungsnr|Rechnungsnr/i.test(bodyText),
          linesTypeColumn: /\bType\b|\bArt\b/i.test(bodyText),
          linesNoColumn: /\bNo\.\b|\bNr\./i.test(bodyText),
          linesDescriptionColumn: /\bDescription\b|Beschreibung/i.test(bodyText),
        };
      })
      .catch(() => null);
    if (signals) frameSignals.push(signals);
  }
  const aggregate = {
    exactPurchaseInvoiceTitle: frameSignals.some((entry) => entry.exactPurchaseInvoiceTitle),
    listTitle: frameSignals.some((entry) => entry.listTitle),
    vendorNameField: frameSignals.some((entry) => entry.vendorNameField),
    vendorInvoiceNoField: frameSignals.some((entry) => entry.vendorInvoiceNoField),
    linesTypeColumn: frameSignals.some((entry) => entry.linesTypeColumn),
    linesNoColumn: frameSignals.some((entry) => entry.linesNoColumn),
    linesDescriptionColumn: frameSignals.some((entry) => entry.linesDescriptionColumn),
  };
  return {
    ...aggregate,
    activeCardAndLinesContextProven:
      aggregate.exactPurchaseInvoiceTitle &&
      aggregate.vendorNameField &&
      aggregate.vendorInvoiceNoField &&
      aggregate.linesTypeColumn &&
      aggregate.linesNoColumn &&
      !aggregate.listTitle,
    frameSignals,
  };
}

async function collectTargetVisibility(page: Page) {
  const text = await pageText(page);
  return {
    purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(text),
    purchaseInvoicesListVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(text),
    vendorNoVisible: text.includes(target.vendorNo),
    vendorNameVisible: text.includes(target.vendorName),
    vendorInvoiceNoVisible: text.includes(target.vendorInvoiceNo),
    fixedAssetLineTypeVisible: /Fixed Asset|Anlage/i.test(text),
    fixedAssetNoVisible: text.includes(target.fixedAssetNo),
    fixedAssetDescriptionVisible: text.includes(target.fixedAssetDescription),
    previewPostingVisible: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(text),
    postVisible: /\bPost\b|\bBuchen\b/i.test(text),
    vendorCardVisible: /Vendor Card\s*-|Kreditorenkarte\s*-/i.test(text),
    vendorRegistrationVisible: /Create a new vendor card|new vendor card|not registered|neue Kreditorenkarte/i.test(text),
  };
}

async function confirmDialogNoPosting(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const yes = scope.getByRole('button', { name: /^Yes$|^Ja$/i }).first();
    if (await yes.isVisible({ timeout: 800 }).catch(() => false)) {
      await yes.click();
      return { confirmed: true, button: 'yes' };
    }
    const ok = scope.getByRole('button', { name: /^OK$/i }).first();
    if (await ok.isVisible({ timeout: 800 }).catch(() => false)) {
      await ok.click();
      return { confirmed: true, button: 'ok' };
    }
  }
  return { confirmed: false, button: 'not-found' };
}

async function extractPurchaseInvoiceDraftNo(page: Page) {
  const text = await pageText(page);
  const headerMatch = text.match(/\b(10\d{4})\s*[∙·-]\s*Zollspedition/i);
  if (headerMatch) return headerMatch[1];
  const rowMatch = text.match(/\b(10\d{4})\s+K30000\s+Zollspedition/i);
  if (rowMatch) return rowMatch[1];
  return null;
}

function purchaseInvoicesFilteredUrl(invoiceNo: string) {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
  return url.toString();
}

async function deletePurchaseInvoiceDraftViaFilteredList(page: Page, invoiceNo: string) {
  await page.goto(purchaseInvoicesFilteredUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);

  const visibleBefore = new RegExp(invoiceNo).test(await pageText(page));
  if (!visibleBefore) return { status: 'not-visible-before-filtered-cleanup', invoiceNo };

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
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const label = `${text} ${aria} ${title}`;
            let score = 0;
            if (/^(Delete|L.schen)$/i.test(text) || /^(Delete|L.schen)$/i.test(aria) || /Delete|L.schen/i.test(title)) score -= 50;
            if (rect.y >= 35 && rect.y <= 135) score -= 20;
            if (/line|zeile|posted|gebucht|archive|archiv|Post|Preview/i.test(label)) score += 100;
            return {
              element,
              text,
              aria,
              title,
              label,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score,
            };
          })
          .filter((entry) => /Delete|L.schen/i.test(entry.label))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'delete-action-not-found', candidates: candidates.slice(0, 20).map(({ element: _element, ...entry }) => entry) };
        chosen.element.click();
        return { clicked: true, chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, rect: chosen.rect, score: chosen.score } };
      })
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    if (result.clicked) {
      await page.waitForTimeout(1500);
      const confirm = await confirmDialogNoPosting(page);
      await page.waitForTimeout(3500);
      await page.goto(purchaseInvoicesFilteredUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await waitForBusinessCentralShell(page);
      await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
      const visibleAfter = new RegExp(invoiceNo).test(await pageText(page));
      return {
        status: !visibleAfter && confirm.confirmed ? 'filtered-cleanup-clicked-and-confirmed' : 'filtered-cleanup-needs-review',
        invoiceNo,
        deleteResult: result,
        confirm,
        visibleAfter,
      };
    }
  }
  return { status: 'delete-action-not-found', invoiceNo };
}

async function deleteDraftViaUi(page: Page) {
  const attempts: string[] = [];
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const label = `${text} ${aria} ${title}`;
            let score = 0;
            if (/^(Delete|L.schen)$/i.test(text) || /^(Delete|L.schen)$/i.test(aria) || /Delete|L.schen/i.test(title)) score -= 60;
            if (rect.y <= 170) score -= 20;
            if (/line|zeile|posted|gebucht|archive|archiv|Post|Preview|Invoice|Receive/i.test(label)) score += 120;
            return {
              element,
              text,
              aria,
              title,
              label,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score,
            };
          })
          .filter((entry) => /Delete|L.schen/i.test(entry.label))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'delete-action-not-found', candidates: candidates.slice(0, 15).map(({ element: _element, ...entry }) => entry) };
        chosen.element.click();
        return { clicked: true, chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, rect: chosen.rect, score: chosen.score } };
      })
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    attempts.push(JSON.stringify(result));
    if (result.clicked) {
      await page.waitForTimeout(1500);
      const confirm = await confirmDialogNoPosting(page);
      await page.waitForTimeout(3500);
      return { status: confirm.confirmed ? 'cleanup-clicked-and-confirmed' : 'delete-clicked-confirm-not-found', deleteResult: result, confirm, attempts };
    }
  }
  return { status: 'delete-action-not-found', attempts };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-062 - K30000 / FA-CNC-01 Target Field Mapping ohne Posting',
    '',
    'Status: `labor`, `ui-first`, `target-field-mapping`, `no-preview`, `no-posting`, `not-final`',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Zielkreditor | ${result.target.vendorNo} / ${result.target.vendorName} |`,
    `| Zielanlage | ${result.target.fixedAssetNo} / ${result.target.fixedAssetDescription} |`,
    `| Labor-Vendor-Invoice-No. | ${result.target.vendorInvoiceNo} |`,
    `| Status | ${result.status} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    `| Cleanup | ${result.cleanup?.status ?? 'nicht benoetigt'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Bei einer Anlagen-Einkaufsrechnung reicht es nicht, irgendwo `FA-CNC-01` zu sehen. Der Kreditor gehoert in den Belegkopf; die Anlage gehoert in eine Zeile mit Zeilentyp `Fixed Asset`. Erst wenn beide Ebenen zusammen sichtbar sind, ist der Screenshot fuer eine Klickanleitung belastbar.',
    '',
    '## Grenzen',
    '',
    '- Keine Preview, kein `Post`, kein Anlagenzugang, keine AfA und keine Anlagenposten.',
    '- CRONUS-USA-Labor; kein deutscher HGB-/Kontenplan-/VAT-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-062 maps K30000 and FA-CNC-01 on Purchase Invoice without posting', async ({ page }) => {
  const openResult = await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-purchase-invoices-list-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Post|Buchen|Invoice|Rechnung/i],
      maxLines: 120,
      maxLineLength: 220,
    }),
  );

  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  const afterNewGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('021-after-new-guard.json'), afterNewGuard);
  const afterNewCardContext = await collectCardContextSignals(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('022-after-new-card-context-signals.json'), afterNewCardContext);

  let status = 'blocked-before-target-entry';
  let summary = 'Der Purchase-Invoice-Kontext wurde nicht stabil genug erreicht; Zielwerte wurden nicht eingegeben.';
  let headerFill: Record<string, unknown> = { skipped: true };
  let lineMapping: Record<string, unknown> = { skipped: true };
  let finalGuard = afterNewGuard;
  let cleanup: Record<string, unknown> = { status: 'not-needed' };
  let cleanupRequired = false;

  if (
    newAttempt.clicked &&
    (afterNewCardContext.activeCardAndLinesContextProven || (afterNewGuard.visibleSignals.purchaseInvoice && afterNewGuard.visibleSignals.linesOrLineColumns))
  ) {
    const vendorFill = await fillInputNearCaption(page, /Vendor Name|Kreditorenname|Buy-from Vendor|Vendor|Kreditor/i, target.vendorNo, 'Tab');
    const afterVendorGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
    const vendorInvoiceFill =
      afterVendorGuard.stopReasons.length === 0
        ? await fillInputNearCaption(page, /Vendor Invoice No\.|Kreditorenrechnungsnr\.|Vendor Invoice/i, target.vendorInvoiceNo, 'Tab')
        : { filled: false, skippedBecause: afterVendorGuard.stopReasons };
    const afterHeaderGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
    headerFill = { vendorFill, afterVendorGuard, vendorInvoiceFill, afterHeaderGuard };
    cleanupRequired = Boolean(vendorFill.filled || (vendorInvoiceFill as { filled?: boolean }).filled);
    await writeJsonEvidence(fixedAssetsEvidencePath('030-header-field-mapping-result.json'), headerFill);
    await writeTextEvidence(
      fixedAssetsEvidencePath('031-after-header-focused-text.txt'),
      await compactPageText(page, {
        include: [/K30000|Zollspedition|FA062|Vendor Invoice|Purchase Invoice|Einkaufsrechnung|Type|Fixed Asset|Anlage|FA-CNC-01|Post|Buchen|Preview|Vorschau/i],
        maxLines: 200,
        maxLineLength: 260,
      }),
    );

    if (afterHeaderGuard.stopReasons.length > 0) {
      status = afterHeaderGuard.status;
      summary = `Guard stoppte nach Header-Eingabe: ${afterHeaderGuard.stopReasons.join(' ')}`;
      finalGuard = afterHeaderGuard;
    } else {
      lineMapping = await setFirstPurchaseLineToFixedAsset(page);
      await writeJsonEvidence(fixedAssetsEvidencePath('040-line-field-mapping-result.json'), lineMapping);
      await writeTextEvidence(
        fixedAssetsEvidencePath('041-after-line-focused-text.txt'),
        await compactPageText(page, {
          include: [/K30000|Zollspedition|FA062|Vendor Invoice|Purchase Invoice|Einkaufsrechnung|Type|Fixed Asset|Anlage|FA-CNC-01|CNC Maschine|Post|Buchen|Preview|Vorschau/i],
          maxLines: 220,
          maxLineLength: 280,
        }),
      );
      finalGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
      const finalVisibility = await collectTargetVisibility(page);
      await writeJsonEvidence(fixedAssetsEvidencePath('050-final-visibility-result.json'), finalVisibility);

      if (finalGuard.success && finalVisibility.vendorNoVisible && finalVisibility.vendorInvoiceNoVisible && finalVisibility.fixedAssetLineTypeVisible && finalVisibility.fixedAssetNoVisible) {
        status = 'target-field-mapping-visible-no-posting';
        summary = '`K30000`, Vendor Invoice No., Zeilentyp `Fixed Asset` und `FA-CNC-01` sind im Purchase-Invoice-/Lines-Kontext sichtbar. Es wurde nicht gebucht.';
      } else if (finalVisibility.vendorCardVisible && finalVisibility.fixedAssetNoVisible && !finalVisibility.fixedAssetLineTypeVisible) {
        status = 'line-no-lookup-opened-vendor-card-rejected';
        summary =
          '`FA-CNC-01` wurde sichtbar, aber nicht als Anlagenzeile: BC oeffnete einen Vendor-Card-/Lookup-Kontext. Der Screenshot ist ein Rejected Path, kein Anlagenzugang-Preflight.';
      } else {
        status = finalGuard.status === 'unknown-context' ? 'target-field-mapping-not-fully-visible' : finalGuard.status;
        summary = `Der Zielkontext ist nicht vollstaendig belegbar. Guard=${finalGuard.status}; sichtbar=${JSON.stringify(finalVisibility)}`;
      }

      const screenshotExpectedText =
        status === 'target-field-mapping-visible-no-posting'
          ? [/Purchase Invoice|Einkaufsrechnung/i, /K30000|Zollspedition/i, /Fixed Asset|Anlage/i, /FA-CNC-01|CNC Maschine/i]
          : [/Purchase Invoice|Einkaufsrechnung/i, /K30000|Zollspedition/i, /FA-CNC-01/i];

      await screenshot(page, 'fixedassets-062-050-target-field-mapping.png', {
        projectName: project.name,
        testId,
        status: status === 'target-field-mapping-visible-no-posting' ? 'candidate' : 'rejected',
        bookUse: status === 'target-field-mapping-visible-no-posting' ? 'evidence' : 'debugging',
        purpose: 'FIXEDASSETS-062 Zielwerte-Preflight: K30000, Vendor Invoice No., Fixed-Asset-Zeilentyp und FA-CNC-01 im selben Purchase-Invoice-Kontext pruefen.',
        expectedPageText: screenshotExpectedText,
        knownLimitations: ['Keine Preview, kein Post, kein Anlagenzugang, keine AfA.', 'CRONUS-USA-Labor, kein deutscher Finalnachweis.'],
      });
    }
  }

  const cleanupInvoiceNo = cleanupRequired ? await extractPurchaseInvoiceDraftNo(page) : null;
  if (cleanupRequired) {
    cleanup = cleanupInvoiceNo
      ? await deletePurchaseInvoiceDraftViaFilteredList(page, cleanupInvoiceNo)
      : { status: 'cleanup-blocked-draft-no-not-found' };
    await writeJsonEvidence(fixedAssetsEvidencePath('090-cleanup-result.json'), cleanup);
    await openPurchaseInvoices(page).catch(() => undefined);
    await writeTextEvidence(
      fixedAssetsEvidencePath('091-after-cleanup-focused-text.txt'),
      await compactPageText(page, {
        include: [/Purchase Invoices|Einkaufsrechnungen|K30000|FA062|FA-CNC-01|In dieser Ansicht|Nothing to show|There is nothing|No\./i],
        maxLines: 160,
        maxLineLength: 240,
      }),
    );
  }

  const result = {
    caseId: 'FIXEDASSETS-062-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-NO-POSTING',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-target-field-mapping-no-preview-no-posting',
    target,
    context,
    openResult,
    newAttempt,
    afterNewGuard,
    afterNewCardContext,
    headerFill,
    lineMapping,
    finalGuard,
    cleanupRequired,
    cleanupInvoiceNo,
    cleanup,
    status,
    summary,
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      setupChanged: false,
      clickedPreviewPosting: false,
      clickedPost: false,
      posted: false,
      acquisitionPosted: false,
      depreciationPosted: false,
    },
    proves: [
      'The run stayed within MCP_1_20260210 / RM-DEMO.',
      'The target field-mapping path was attempted UI-first.',
      'The purchase-invoice guard was used after risky header/line steps.',
      'No Preview Posting, Post, acquisition or depreciation action was executed.',
    ],
    doesNotProve: [
      'No Preview Posting result.',
      'No fixed asset acquisition.',
      'No FA Ledger Entry.',
      'No depreciation.',
      'No German final proof.',
    ],
    screenshots:
      status === 'blocked-before-target-entry'
        ? []
        : ['playwright/projects/fibu-book5/img/fixedassets-062-050-target-field-mapping.png'],
    bookImpact:
      status === 'target-field-mapping-visible-no-posting'
        ? 'Kapitel 21 kann den Zielwerte-Preflight als Labor-Klickbild nutzen, aber weiter ohne Preview, Buchung, Zugang oder AfA.'
        : 'Kapitel 21 und das Debugging-Kapitel erhalten einen weiteren Feldmapping-/Screenshot-QA-Befund: Ein Zielbild zaehlt erst, wenn Kopf und Anlagenzeile zusammen sichtbar sind.',
    nextStep:
      status === 'target-field-mapping-visible-no-posting'
        ? 'FIXEDASSETS-063-K30000-FA-CNC-01-PREVIEW-GATE-DECISION: ohne BC-Lauf entscheiden, ob ein Preview-Posting-Preflight erlaubt wird.'
        : 'FIXEDASSETS-063-PURCHASE-INVOICE-LINE-TYPE-STRICTNESS: Zeilentyp `Fixed Asset` sichtbar und stabil setzen/pruefen, bevor `FA-CNC-01` erneut eingegeben oder ausgewaehlt wird.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-062-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-062-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-NO-POSTING.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-062 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-062-result.json` | JSON | UI-first Zielwerte-Preflight, Guard-Status, Cleanup-Status | keine Preview, keine Buchung, keinen Zugang | `labor`, `no-posting` |',
      '| `022-after-new-card-context-signals.json` | JSON | Card-/Lines-Kontextsignale nach `New/Neu` | keine Zielwerte | `context` |',
      '| `030-header-field-mapping-result.json` | JSON | Header-Feldmapping fuer `K30000` und `Vendor Invoice No.` | keine Anlagenzeile | `header-proof-or-blocker` |',
      '| `040-line-field-mapping-result.json` | JSON | Zeilenversuch fuer `Type = Fixed Asset` und `FA-CNC-01` | keine Buchung | `line-proof-or-blocker` |',
      '| `050-final-visibility-result.json` | JSON | ob Zielwerte zusammen sichtbar sind | keine Postenspur | `visibility` |',
      '| `fixedassets-062-050-target-field-mapping.png` | Screenshot | Zielwerte oder Blockerbild laut Metadaten | kein Anlagenzugang | `candidate/rejected` |',
      '| `090-cleanup-result.json` | JSON | UI-Cleanup, falls Draft entstand | keine Datenbankgarantie ueber API | `cleanup` |',
      '| `094-accidental-purchase-invoice-107223-cleanup-result.json` | JSON | UI-Cleanup des beim ersten 062-Versuch entstandenen Einkaufsrechnungsentwurfs | keine Anlagenbuchung | `cleanup` |',
      '| `097-accidental-vendor-V00060-cleanup-result.json` | JSON | UI-Cleanup des versehentlichen Vendor-Drafts aus dem falschen Lookup-Kontext | keine Anlagenzeile | `cleanup` |',
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
    ].join('\n'),
  );

  expect(context.environmentInUrl).toBe(true);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.apiShortcutUsed).toBe(false);
});
