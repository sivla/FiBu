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
  waitForPageText
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(360_000);

const testId = 'fixedassets-055';
const accidentalInvoiceNo = '107222';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function purchaseInvoicesUrl() {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${accidentalInvoiceNo}'`);
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

async function openFilteredInvoice(page: Page) {
  await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function clickDeleteSelectedInvoice(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!new RegExp(accidentalInvoiceNo).test(body)) continue;
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
            return { element, text, aria, title, label, rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }, score };
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
      const confirmed = await confirmYes(page);
      await page.waitForTimeout(3500);
      return { deleteResult: result, confirmed };
    }
  }
  return { deleteResult: { clicked: false, reason: 'invoice-row-not-found' }, confirmed: false };
}

async function confirmYes(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const yes = scope.getByRole('button', { name: /^Yes$|^Ja$/i }).first();
    if (await yes.isVisible({ timeout: 1000 }).catch(() => false)) {
      await yes.click();
      return true;
    }
  }
  return false;
}

test('FIXEDASSETS-055 accidental purchase invoice draft cleanup', async ({ page }) => {
  await openFilteredInvoice(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  const beforeText = await compactPageText(page, {
    include: [/107222|K30000|Zollspedition|Purchase Invoices|Einkaufsrechnungen|Amount|Delete|L.schen|No\.|Vendor/i],
    maxLines: 140,
    maxLineLength: 240
  });
  await writeTextEvidence(fixedAssetsEvidencePath('080-accidental-purchase-invoice-before-cleanup-focused-text.txt'), beforeText || 'No 107222 text visible before cleanup.');
  const invoiceVisibleBefore = new RegExp(accidentalInvoiceNo).test(await pageText(page));
  if (invoiceVisibleBefore) {
    await screenshot(page, 'fixedassets-055-080-accidental-purchase-invoice-before-cleanup.png', {
      projectName: project.name,
      testId,
      status: 'rejected',
      bookUse: 'do-not-use',
      purpose: 'FIXEDASSETS-055 rejected anti-pattern: versehentlich erzeugter Purchase-Invoice-Draft 107222 vor Cleanup.',
      expectedPageText: [/107222/i],
      knownLimitations: [
        'Dies ist kein Buchungs- oder Anlagenzugangsnachweis.',
        'Das Bild dokumentiert einen zu bereinigenden Draft.'
      ]
    });
  }

  const cleanup = invoiceVisibleBefore ? await clickDeleteSelectedInvoice(page) : { deleteResult: { clicked: false, reason: 'not-visible-before' }, confirmed: false };
  await openFilteredInvoice(page);
  const afterText = await compactPageText(page, {
    include: [/107222|K30000|Zollspedition|Purchase Invoices|Einkaufsrechnungen|In dieser Ansicht|Nothing to show|There is nothing|No\.|Vendor/i],
    maxLines: 140,
    maxLineLength: 240
  });
  await writeTextEvidence(fixedAssetsEvidencePath('081-accidental-purchase-invoice-after-cleanup-focused-text.txt'), afterText || 'No 107222 text visible after cleanup.');
  const invoiceVisibleAfter = new RegExp(accidentalInvoiceNo).test(await pageText(page));
  await screenshot(page, 'fixedassets-055-081-accidental-purchase-invoice-after-cleanup.png', {
    projectName: project.name,
    testId,
    status: invoiceVisibleAfter ? 'rejected' : 'labor',
    bookUse: invoiceVisibleAfter ? 'do-not-use' : 'evidence',
    purpose: 'FIXEDASSETS-055 Cleanup-Nachweis fuer den versehentlichen Purchase-Invoice-Draft 107222.',
    expectedPageText: [/Purchase Invoices|Einkaufsrechnungen|No\.|In dieser Ansicht|There is nothing/i],
    knownLimitations: [
      'Cleanup-Evidence, kein fachlicher Anlagenkauf.',
      'Keine Buchung, keine Anlagenposten.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-055-ACCIDENTAL-PURCHASE-INVOICE-CLEANUP',
    generatedAt: new Date().toISOString(),
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    context,
    accidentalInvoiceNo,
    invoiceVisibleBefore,
    cleanup,
    invoiceVisibleAfter,
    status: invoiceVisibleBefore && !invoiceVisibleAfter ? 'cleaned-up' : invoiceVisibleBefore ? 'cleanup-blocked' : 'not-present',
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      posted: false,
      clickedPost: false,
      clickedPreviewPosting: false
    },
    bookImpact:
      'Dieser Anti-Pattern-Fall gehoert in Kapitel 21/Debugging: ein Field-Mapping-Lauf darf nur als erfolgreich gelten, wenn der richtige Belegkontext sichtbar bleibt und jeder Draft sauber geloescht wurde.',
    nextStep:
      invoiceVisibleBefore && !invoiceVisibleAfter
        ? 'FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS: 055 als rejected/partial einordnen und vor jedem neuen Mapping einen sichereren Zeilenkontext-Helper bauen.'
        : 'FIXEDASSETS-056-ACCIDENTAL-PURCHASE-INVOICE-CLEANUP-BLOCKER: 107222 erst bereinigen, bevor weitere Purchase-Invoice-Feldmapping-Laeufe erlaubt werden.'
  };
  await writeJsonEvidence(fixedAssetsEvidencePath('080-accidental-purchase-invoice-cleanup-result.json'), result);

  expect(result.safety.posted).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(invoiceVisibleAfter).toBe(false);
});
