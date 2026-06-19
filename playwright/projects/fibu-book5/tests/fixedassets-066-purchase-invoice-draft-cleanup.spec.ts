import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  waitForBusinessCentralShell,
  waitForPageText
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(240_000);

const testId = 'fixedassets-066';
const targetInvoiceNo = process.env.FIXEDASSETS_CLEANUP_PURCHASE_INVOICE_NO || '107210';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function purchaseInvoicesFilteredUrl(invoiceNo: string) {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
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
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !/MCP_1_20260210/i.test(decoded)
  };
}

async function openFilteredInvoice(page: Page, invoiceNo: string) {
  await page.goto(purchaseInvoicesFilteredUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);
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
            if (/line|zeile/i.test(label)) score += 80;
            if (/Post|Preview|Buchen|Vorschau|Invoice|Rechnung/i.test(label)) score += 200;
            return { element, text, aria, title, label, rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }, score };
          })
          .filter((entry) => /Delete|L.schen/i.test(entry.label))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'delete-action-not-found', candidates: candidates.slice(0, 20).map(({ element: _element, ...entry }) => entry) };
        chosen.element.click();
        return { clicked: true, chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, label: chosen.label, rect: chosen.rect, score: chosen.score }, candidates: candidates.slice(0, 8).map(({ element: _element, ...entry }) => entry) };
      })
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    if (result.clicked) {
      await page.waitForTimeout(1500);
      const confirmation = await confirmYes(page);
      await page.waitForTimeout(3500);
      return { deleteResult: result, confirmation };
    }
  }
  return { deleteResult: { clicked: false, reason: 'invoice-row-not-found' }, confirmation: { confirmed: false, button: 'not-found' } };
}

test('FIXEDASSETS-066 cleanup temporary Purchase Invoice draft', async ({ page }) => {
  await openFilteredInvoice(page, targetInvoiceNo);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  const beforeText = await compactPageText(page, {
    include: [new RegExp(targetInvoiceNo), /Purchase Invoices|Einkaufsrechnungen|Amount|Delete|L.schen|No\.|Vendor/i],
    maxLines: 120,
    maxLineLength: 220
  });
  await writeTextEvidence(fixedAssetsEvidencePath('091-cleanup-retry-before-focused-text.txt'), beforeText || `No ${targetInvoiceNo} text visible before cleanup retry.`);

  const visibleBefore = new RegExp(targetInvoiceNo).test(await pageText(page));
  const cleanup = visibleBefore ? await clickDeleteSelectedInvoice(page, targetInvoiceNo) : { deleteResult: { clicked: false, reason: 'not-visible-before' }, confirmation: { confirmed: false, button: 'not-needed' } };

  await openFilteredInvoice(page, targetInvoiceNo);
  const afterText = await compactPageText(page, {
    include: [new RegExp(targetInvoiceNo), /Purchase Invoices|Einkaufsrechnungen|In dieser Ansicht|Nothing to show|There is nothing|No\.|Vendor/i],
    maxLines: 120,
    maxLineLength: 220
  });
  await writeTextEvidence(fixedAssetsEvidencePath('092-cleanup-retry-after-focused-text.txt'), afterText || `No ${targetInvoiceNo} text visible after cleanup retry.`);
  const visibleAfter = new RegExp(targetInvoiceNo).test(await pageText(page));

  const result = {
    caseId: 'FIXEDASSETS-066-PURCHASE-INVOICE-DRAFT-CLEANUP',
    generatedAt: new Date().toISOString(),
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    context,
    invoiceNo: targetInvoiceNo,
    visibleBefore,
    cleanup,
    visibleAfter,
    status: visibleBefore && !visibleAfter ? 'cleaned-up' : visibleBefore ? 'cleanup-blocked' : 'not-present',
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      setupChanged: false,
      clickedPreviewPosting: false,
      clickedPost: false,
      posted: false
    },
    summary:
      visibleBefore && !visibleAfter
        ? `Temporary Purchase Invoice draft ${targetInvoiceNo} was removed through the UI.`
        : visibleBefore
          ? `Temporary Purchase Invoice draft ${targetInvoiceNo} is still visible after cleanup retry.`
          : `Temporary Purchase Invoice draft ${targetInvoiceNo} was not visible before cleanup retry.`,
    nextStep:
      visibleBefore && !visibleAfter
        ? 'Continue with line-type diagnosis; do not enter target values until Fixed Asset line type is visible.'
        : 'Resolve cleanup blocker before any further Purchase Invoice probe.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('091-cleanup-retry-result.json'), result);

  expect(result.safety.posted).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(visibleAfter).toBe(false);
});
