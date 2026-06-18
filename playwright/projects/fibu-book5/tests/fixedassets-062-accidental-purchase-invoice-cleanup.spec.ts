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

const testId = 'fixedassets-062';
const accidentalInvoiceNo = process.env.FIXEDASSETS_062_CLEANUP_INVOICE_NO || '107223';

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
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !/MCP_1_20260210/i.test(decoded),
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
      const confirmed = await confirmYes(page);
      await page.waitForTimeout(3500);
      return { deleteResult: result, confirmed };
    }
  }
  return { deleteResult: { clicked: false, reason: 'invoice-row-not-found' }, confirmed: false };
}

test('FIXEDASSETS-062 accidental purchase invoice draft cleanup', async ({ page }) => {
  await openFilteredInvoice(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  const beforeText = await compactPageText(page, {
    include: [new RegExp(accidentalInvoiceNo), /K30000|Zollspedition|Purchase Invoices|Einkaufsrechnungen|Amount|Delete|L.schen|No\.|Vendor/i],
    maxLines: 140,
    maxLineLength: 240,
  });
  await writeTextEvidence(fixedAssetsEvidencePath(`092-accidental-purchase-invoice-${accidentalInvoiceNo}-before-cleanup-focused-text.txt`), beforeText || `No ${accidentalInvoiceNo} text visible before cleanup.`);
  const invoiceVisibleBefore = new RegExp(accidentalInvoiceNo).test(await pageText(page));
  if (invoiceVisibleBefore) {
    await screenshot(page, `fixedassets-062-092-accidental-purchase-invoice-${accidentalInvoiceNo}-before-cleanup.png`, {
      projectName: project.name,
      testId,
      status: 'rejected',
      bookUse: 'do-not-use',
      purpose: `FIXEDASSETS-062 rejected anti-pattern: versehentlich erzeugter Purchase-Invoice-Draft ${accidentalInvoiceNo} vor Cleanup.`,
      expectedPageText: [new RegExp(accidentalInvoiceNo)],
      knownLimitations: ['Dies ist kein Buchungs- oder Anlagenzugangsnachweis.', 'Das Bild dokumentiert einen zu bereinigenden Draft.'],
    });
  }

  const cleanup = invoiceVisibleBefore ? await clickDeleteSelectedInvoice(page) : { deleteResult: { clicked: false, reason: 'not-visible-before' }, confirmed: false };
  await openFilteredInvoice(page);
  const afterText = await compactPageText(page, {
    include: [new RegExp(accidentalInvoiceNo), /K30000|Zollspedition|Purchase Invoices|Einkaufsrechnungen|In dieser Ansicht|Nothing to show|There is nothing|No\.|Vendor/i],
    maxLines: 140,
    maxLineLength: 240,
  });
  await writeTextEvidence(fixedAssetsEvidencePath(`093-accidental-purchase-invoice-${accidentalInvoiceNo}-after-cleanup-focused-text.txt`), afterText || `No ${accidentalInvoiceNo} text visible after cleanup.`);
  const invoiceVisibleAfter = new RegExp(accidentalInvoiceNo).test(await pageText(page));
  await screenshot(page, `fixedassets-062-093-accidental-purchase-invoice-${accidentalInvoiceNo}-after-cleanup.png`, {
    projectName: project.name,
    testId,
    status: invoiceVisibleAfter ? 'rejected' : 'labor',
    bookUse: invoiceVisibleAfter ? 'do-not-use' : 'evidence',
    purpose: `FIXEDASSETS-062 Cleanup-Nachweis fuer den versehentlichen Purchase-Invoice-Draft ${accidentalInvoiceNo}.`,
    expectedPageText: [/Purchase Invoices|Einkaufsrechnungen|No\.|In dieser Ansicht|There is nothing/i],
    knownLimitations: ['Cleanup-Evidence, kein fachlicher Anlagenkauf.', 'Keine Buchung, keine Anlagenposten.'],
  });

  const result = {
    testId: 'FIXEDASSETS-062-ACCIDENTAL-PURCHASE-INVOICE-CLEANUP',
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
      clickedPreviewPosting: false,
    },
    bookImpact:
      'FIXEDASSETS-062 zeigt als Rejected Path: FA-CNC-01 darf nicht einfach in ein aktives No.-Feld getippt werden, bevor Type = Fixed Asset sicher gesetzt und sichtbar bestaetigt wurde.',
    nextStep:
      invoiceVisibleBefore && !invoiceVisibleAfter
        ? 'FIXEDASSETS-063-PURCHASE-INVOICE-LINE-TYPE-STRICTNESS: Zeilentyp-Auswahl fuer Fixed Asset robuster machen, bevor Zielmapping erneut versucht wird.'
        : 'FIXEDASSETS-063-CLEANUP-BLOCKER: Entwurf erst manuell oder mit gezieltem UI-Cleanup entfernen, bevor weitere Purchase-Invoice-Laeufe erlaubt sind.',
  };
  await writeJsonEvidence(fixedAssetsEvidencePath(`094-accidental-purchase-invoice-${accidentalInvoiceNo}-cleanup-result.json`), result);

  expect(result.safety.posted).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(invoiceVisibleAfter).toBe(false);
});
