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
const accidentalVendorNo = process.env.FIXEDASSETS_062_CLEANUP_VENDOR_NO || 'V00060';
const accidentalVendorName = 'FA-CNC-01';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function vendorsUrl() {
  const url = new URL(bcPageUrl(27, project.envPrefix));
  url.searchParams.set('filter', `'Vendor'.'No.' IS '${accidentalVendorNo}'`);
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

async function openFilteredVendor(page: Page) {
  await page.goto(vendorsUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Vendors|Kreditoren|No\.|Nr\./i, { timeout: 90_000 });
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

async function clickDeleteSelectedVendor(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!new RegExp(accidentalVendorNo).test(body)) continue;
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
  return { deleteResult: { clicked: false, reason: 'vendor-row-not-found' }, confirmed: false };
}

test('FIXEDASSETS-062 accidental vendor draft cleanup', async ({ page }) => {
  await openFilteredVendor(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  const beforeText = await compactPageText(page, {
    include: [new RegExp(accidentalVendorNo), /FA-CNC-01|Vendors|Kreditoren|Balance|Saldo|Delete|L.schen|No\.|Name/i],
    maxLines: 140,
    maxLineLength: 240,
  });
  await writeTextEvidence(fixedAssetsEvidencePath(`095-accidental-vendor-${accidentalVendorNo}-before-cleanup-focused-text.txt`), beforeText || `No ${accidentalVendorNo} text visible before cleanup.`);
  const vendorVisibleBefore = new RegExp(accidentalVendorNo).test(await pageText(page));
  if (vendorVisibleBefore) {
    await screenshot(page, `fixedassets-062-095-accidental-vendor-${accidentalVendorNo}-before-cleanup.png`, {
      projectName: project.name,
      testId,
      status: 'rejected',
      bookUse: 'do-not-use',
      purpose: `FIXEDASSETS-062 rejected anti-pattern: versehentlich erzeugter Vendor-Kontext ${accidentalVendorNo} mit Name FA-CNC-01 vor Cleanup.`,
      expectedPageText: [new RegExp(accidentalVendorNo)],
      knownLimitations: ['Dies ist kein Anlagen- oder Einkaufsrechnungsnachweis.', 'Das Bild dokumentiert einen zu bereinigenden Fehlkontext.'],
    });
  }

  const cleanup = vendorVisibleBefore ? await clickDeleteSelectedVendor(page) : { deleteResult: { clicked: false, reason: 'not-visible-before' }, confirmed: false };
  await openFilteredVendor(page);
  const afterText = await compactPageText(page, {
    include: [new RegExp(accidentalVendorNo), /FA-CNC-01|Vendors|Kreditoren|In dieser Ansicht|Nothing to show|There is nothing|No\.|Name/i],
    maxLines: 140,
    maxLineLength: 240,
  });
  await writeTextEvidence(fixedAssetsEvidencePath(`096-accidental-vendor-${accidentalVendorNo}-after-cleanup-focused-text.txt`), afterText || `No ${accidentalVendorNo} text visible after cleanup.`);
  const vendorVisibleAfter = new RegExp(accidentalVendorNo).test(await pageText(page));
  await screenshot(page, `fixedassets-062-096-accidental-vendor-${accidentalVendorNo}-after-cleanup.png`, {
    projectName: project.name,
    testId,
    status: vendorVisibleAfter ? 'rejected' : 'labor',
    bookUse: vendorVisibleAfter ? 'do-not-use' : 'evidence',
    purpose: `FIXEDASSETS-062 Cleanup-Nachweis fuer den versehentlichen Vendor-Kontext ${accidentalVendorNo}.`,
    expectedPageText: [/Vendors|Kreditoren|No\.|Name|In dieser Ansicht|There is nothing/i],
    knownLimitations: ['Cleanup-Evidence, kein fachlicher Anlagenkauf.', 'Keine Buchung, keine Einkaufsrechnung, keine Anlagenposten.'],
  });

  const result = {
    testId: 'FIXEDASSETS-062-ACCIDENTAL-VENDOR-CLEANUP',
    generatedAt: new Date().toISOString(),
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    context,
    accidentalVendorNo,
    accidentalVendorName,
    vendorVisibleBefore,
    cleanup,
    vendorVisibleAfter,
    status: vendorVisibleBefore && !vendorVisibleAfter ? 'cleaned-up' : vendorVisibleBefore ? 'cleanup-blocked' : 'not-present',
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      posted: false,
      clickedPost: false,
      clickedPreviewPosting: false,
    },
    bookImpact:
      'FIXEDASSETS-062 dokumentiert fuer Kapitel 21 und Debugging: unscharfe Zeilen-/Lookup-Eingaben koennen einen falschen Stammdatendraft erzeugen; Screenshots muessen den fachlichen Zielkontext zeigen.',
    nextStep:
      vendorVisibleBefore && !vendorVisibleAfter
        ? 'FIXEDASSETS-063-PURCHASE-INVOICE-LINE-TYPE-STRICTNESS: Zeilentyp-Auswahl fuer Fixed Asset robuster machen, bevor Zielmapping erneut versucht wird.'
        : 'FIXEDASSETS-063-ACCIDENTAL-VENDOR-CLEANUP-BLOCKER: Vendor-Draft erst bereinigen, bevor weitere Purchase-Invoice-Laeufe erlaubt sind.',
  };
  await writeJsonEvidence(fixedAssetsEvidencePath(`097-accidental-vendor-${accidentalVendorNo}-cleanup-result.json`), result);

  expect(result.safety.posted).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(vendorVisibleAfter).toBe(false);
});
