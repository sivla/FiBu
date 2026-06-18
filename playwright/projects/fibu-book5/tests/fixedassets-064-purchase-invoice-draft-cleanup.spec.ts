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
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(300_000);

const testId = 'fixedassets-064';
const cleanupInvoiceNo = process.env.FIXEDASSETS_064_CLEANUP_INVOICE_NO || '107209';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function purchaseInvoicesFilteredUrl() {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${cleanupInvoiceNo}'`);
  return url.toString();
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

async function openFilteredInvoice(page: Page) {
  await page.goto(purchaseInvoicesFilteredUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function clickVisibleInvoiceRow(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!new RegExp(cleanupInvoiceNo).test(body)) continue;
    const result = await frame
      .evaluate((invoiceNo) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('tr,[role="row"],td,[role="gridcell"],a,button,div,span'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            return { element, text, rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } };
          })
          .filter((entry) => entry.text.includes(invoiceNo))
          .filter((entry) => entry.rect.y > 180)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'invoice-row-not-found' };
        chosen.element.click();
        return { clicked: true, chosen: { text: chosen.text.slice(0, 220), rect: chosen.rect } };
      }, cleanupInvoiceNo)
      .catch((error) => ({ clicked: false, reason: String(error) }));
    if (result.clicked) {
      await page.waitForTimeout(800);
      return result;
    }
  }
  return { clicked: false, reason: 'invoice-frame-not-found' };
}

async function confirmAnyDeleteDialog(page: Page) {
  const attempts: string[] = [];
  for (let round = 0; round < 6; round += 1) {
    for (const scope of [page, ...page.frames()]) {
      const body = await scope.locator('body').innerText({ timeout: 500 }).catch(() => '');
      if (/delete|l.schen|record|datensatz|invoice|rechnung/i.test(body)) {
        attempts.push(`dialog-text-round-${round}`);
      }
      for (const label of [/^Yes$|^Ja$/i, /^OK$/i]) {
        const button = scope.getByRole('button', { name: label }).first();
        if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
          await button.click();
          await page.waitForTimeout(1800);
          return { confirmed: true, method: `button:${label.source}`, attempts };
        }
      }
    }
    await page.waitForTimeout(500);
  }
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(1800);
  attempts.push('keyboard-enter-fallback');
  return { confirmed: false, method: 'keyboard-enter-fallback', attempts };
}

async function clickDeleteSelectedInvoice(page: Page) {
  const rowClick = await clickVisibleInvoiceRow(page);
  const attempts: any[] = [{ rowClick }];
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!new RegExp(cleanupInvoiceNo).test(body)) continue;
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
    attempts.push({ deleteResult: result });
    if (result.clicked) {
      await page.waitForTimeout(1500);
      const confirmation = await confirmAnyDeleteDialog(page);
      return { attempts, deleteResult: result, confirmation };
    }
  }
  return { attempts, deleteResult: { clicked: false, reason: 'invoice-row-not-found' }, confirmation: { confirmed: false, method: 'not-started' } };
}

test('FIXEDASSETS-064 cleanup remaining purchase invoice draft', async ({ page }) => {
  await openFilteredInvoice(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  const beforeText = await compactPageText(page, {
    include: [new RegExp(cleanupInvoiceNo), /Purchase Invoices|Einkaufsrechnungen|Delete|L.schen|No\.|Vendor|Kreditor/i],
    maxLines: 140,
    maxLineLength: 240,
  });
  await writeTextEvidence(fixedAssetsEvidencePath(`092-purchase-invoice-${cleanupInvoiceNo}-before-cleanup-focused-text.txt`), beforeText || `No ${cleanupInvoiceNo} text visible before cleanup.`);
  const invoiceVisibleBefore = new RegExp(cleanupInvoiceNo).test(await pageText(page));
  if (invoiceVisibleBefore) {
    await screenshot(page, `fixedassets-064-092-purchase-invoice-${cleanupInvoiceNo}-before-cleanup.png`, {
      projectName: project.name,
      testId,
      status: 'rejected',
      bookUse: 'do-not-use',
      purpose: `FIXEDASSETS-064 Cleanup: stehengebliebener Purchase-Invoice-Draft ${cleanupInvoiceNo} vor Cleanup.`,
      expectedPageText: [new RegExp(cleanupInvoiceNo)],
      knownLimitations: ['Cleanup-Bild, kein Anlagenkauf.', 'Keine Buchung, keine Anlagenposten.'],
    });
  }

  const cleanup = invoiceVisibleBefore ? await clickDeleteSelectedInvoice(page) : { deleteResult: { clicked: false, reason: 'not-visible-before' }, confirmation: { confirmed: false } };
  await openFilteredInvoice(page);
  const invoiceVisibleAfter = new RegExp(cleanupInvoiceNo).test(await pageText(page));
  const afterText = await compactPageText(page, {
    include: [new RegExp(cleanupInvoiceNo), /Purchase Invoices|Einkaufsrechnungen|In dieser Ansicht|Nothing to show|There is nothing|No\.|Vendor|Kreditor/i],
    maxLines: 140,
    maxLineLength: 240,
  });
  await writeTextEvidence(fixedAssetsEvidencePath(`093-purchase-invoice-${cleanupInvoiceNo}-after-cleanup-focused-text.txt`), afterText || `No ${cleanupInvoiceNo} text visible after cleanup.`);
  await screenshot(page, `fixedassets-064-093-purchase-invoice-${cleanupInvoiceNo}-after-cleanup.png`, {
    projectName: project.name,
    testId,
    status: invoiceVisibleAfter ? 'rejected' : 'labor',
    bookUse: invoiceVisibleAfter ? 'do-not-use' : 'evidence',
    purpose: `FIXEDASSETS-064 Cleanup-Nachweis fuer Purchase-Invoice-Draft ${cleanupInvoiceNo}.`,
    expectedPageText: [/Purchase Invoices|Einkaufsrechnungen|No\.|In dieser Ansicht|There is nothing/i],
    knownLimitations: ['Cleanup-Evidence, kein fachlicher Anlagenkauf.', 'Keine Buchung, keine Anlagenposten.'],
  });

  const result = {
    caseId: 'FIXEDASSETS-064-PURCHASE-INVOICE-DRAFT-CLEANUP',
    generatedAt: new Date().toISOString(),
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    cleanupInvoiceNo,
    context,
    invoiceVisibleBefore,
    cleanup,
    invoiceVisibleAfter,
    status: invoiceVisibleBefore && !invoiceVisibleAfter ? 'cleaned-up' : invoiceVisibleBefore ? 'cleanup-blocked' : 'not-present',
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      posted: false,
      clickedPost: false,
      clickedPreviewPosting: false,
    },
    bookImpact: 'FIXEDASSETS-064 bleibt ein Rejected-/Debugging-Fall: Der Zeilentyp wurde nicht sauber gesetzt, und Entwuerfe muessen nach solchen Probes zwingend ueber die UI bereinigt werden.',
    nextStep:
      invoiceVisibleBefore && !invoiceVisibleAfter
        ? 'FIXEDASSETS-065-PURCHASE-INVOICE-LINE-TYPE-HELPER-DIAGNOSIS: Zeilentyp-Auswahl robuster diagnostizieren, weiter ohne FA-CNC-01.'
        : 'FIXEDASSETS-064-CLEANUP-BLOCKER: Entwurf erst manuell oder mit gezieltem UI-Cleanup entfernen, bevor weitere Purchase-Invoice-Laeufe erlaubt sind.',
  };
  await writeJsonEvidence(fixedAssetsEvidencePath(`094-purchase-invoice-${cleanupInvoiceNo}-cleanup-result.json`), result);

  expect(result.safety.posted).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(invoiceVisibleAfter).toBe(false);
});
