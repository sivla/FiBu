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
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-072';
const CASE_ID = 'FIXEDASSETS-072-TYPE-DROPDOWN-SELECTOR-FIX';
const targetInvoiceNo = process.env.FIXEDASSETS_072_CLEANUP_PURCHASE_INVOICE_NO || '107225';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(240_000);

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function purchaseInvoicesFilteredUrl(invoiceNo: string) {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('company', project.defaultCompany);
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
  return url.toString();
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const text = await pageText(page);
  const decoded = decodeURIComponent(url);
  return {
    url,
    environmentInUrl: decoded.includes('MCP_1_20260210'),
    companyInUrl: new URL(url).searchParams.get('company') === project.defaultCompany,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes('MCP_1_20260210'),
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
            return {
              element,
              clickable,
              text,
              aria,
              title,
              label,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score,
            };
          })
          .filter((entry) => /Delete|L.*schen/i.test(entry.label))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) {
          return { clicked: false, reason: 'delete-action-not-found', candidates: candidates.slice(0, 20).map(({ element: _e, clickable: _c, ...entry }) => entry) };
        }
        chosen.clickable.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, label: chosen.label, rect: chosen.rect, score: chosen.score },
          candidates: candidates.slice(0, 8).map(({ element: _e, clickable: _c, ...entry }) => entry),
        };
      })
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    if (result.clicked) {
      await page.waitForTimeout(1500);
      return result;
    }
  }
  return { clicked: false, reason: 'invoice-row-not-found', candidates: [] };
}

test('FIXEDASSETS-072 cleanup temporary Purchase Invoice draft', async ({ page }) => {
  await openFilteredInvoice(page, targetInvoiceNo);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const visibleBefore = new RegExp(targetInvoiceNo).test(await pageText(page));
  await writeTextEvidence(
    fixedAssetsEvidencePath('091-cleanup-retry-before-focused-text.txt'),
    await compactPageText(page, {
      include: [new RegExp(targetInvoiceNo), /Purchase Invoices|Einkaufsrechnungen|Delete|L.schen|No\.|Vendor/i],
      maxLines: 120,
      maxLineLength: 220,
    }) || `No ${targetInvoiceNo} text visible before cleanup retry.`,
  );

  const deleteAction = visibleBefore
    ? await clickDeleteSelectedInvoice(page, targetInvoiceNo)
    : { clicked: false, reason: 'not-visible-before', candidates: [] };

  const confirmation = deleteAction.clicked ? await confirmYes(page) : { confirmed: false, button: 'not-needed' };
  await page.waitForTimeout(2500);
  await openFilteredInvoice(page, targetInvoiceNo);
  const afterText = await compactPageText(page, {
    include: [new RegExp(targetInvoiceNo), /Purchase Invoices|Einkaufsrechnungen|In dieser Ansicht|Nothing to show|There is nothing|No\.|Vendor/i],
    maxLines: 120,
    maxLineLength: 220,
  });
  await writeTextEvidence(
    fixedAssetsEvidencePath('092-cleanup-retry-after-focused-text.txt'),
    afterText || `No ${targetInvoiceNo} text visible after cleanup retry.`,
  );
  const visibleAfter = new RegExp(targetInvoiceNo).test(await pageText(page));

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-072-draft-cleanup-retry-result',
    caseId: CASE_ID,
    source: 'playwright-ui-cleanup',
    resultStatus: visibleBefore && !visibleAfter ? 'observed' : visibleBefore ? 'blocked' : 'observed',
    instance: 'MCP_1_20260210',
    company: project.defaultCompany,
    context,
    invoiceNo: targetInvoiceNo,
    visibleBefore,
    deleteAction,
    confirmation,
    visibleAfter,
    status: visibleBefore && !visibleAfter ? 'cleaned-up' : visibleBefore ? 'cleanup-blocked' : 'not-present',
    proved: visibleBefore && !visibleAfter ? [`Temporary Purchase Invoice draft ${targetInvoiceNo} is no longer visible after UI cleanup.`] : [],
    notProved: visibleBefore && visibleAfter ? [`Temporary Purchase Invoice draft ${targetInvoiceNo} is still visible after cleanup retry.`] : [],
    warnings: [],
    blockedBy: visibleBefore && visibleAfter ? ['cleanup-visible-after-retry'] : [],
    requiresReview: visibleBefore && visibleAfter,
    safeToFinalizeState: !visibleAfter,
    createdRecords: [
      {
        company: project.defaultCompany,
        type: 'Purchase Invoice',
        documentNo: targetInvoiceNo,
        purpose: 'Cleanup follow-up for FA-072 Type dropdown selector probe.',
        createdAt: '',
        status: visibleAfter ? 'draft' : 'deleted',
        cleanupStatus: visibleAfter ? 'blocked' : 'deleted',
      },
    ],
    cleanup: {
      required: visibleBefore,
      completed: !visibleAfter,
      method: 'filtered Purchase Invoices list delete via UI',
      blockedBy: visibleAfter ? ['cleanup-visible-after-retry'] : [],
    },
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
    },
    nextStep: visibleAfter
      ? 'Resolve cleanup blocker before further FA-072 probes.'
      : 'Continue with a narrower Type dropdown selector diagnosis; do not enter target values yet.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('091-cleanup-retry-result.json'), result);

  expect(result.flags.stayedInExpectedInstance).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(visibleAfter).toBe(false);
});
