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
const accidentalVendorNo = 'V00040';
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
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !/MCP_1_20260210/i.test(decoded)
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
  return { deleteResult: { clicked: false, reason: 'vendor-row-not-found' }, confirmed: false };
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

test('FIXEDASSETS-055 accidental V00040 vendor cleanup', async ({ page }) => {
  await openFilteredVendor(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  const beforeText = await compactPageText(page, {
    include: [/V00040|FA-CNC-01|Vendors|Kreditoren|Balance|Saldo|Delete|L.schen|No\.|Name/i],
    maxLines: 140,
    maxLineLength: 240
  });
  await writeTextEvidence(fixedAssetsEvidencePath('070-accidental-vendor-before-cleanup-focused-text.txt'), beforeText || 'No V00040 text visible before cleanup.');
  const vendorVisibleBefore = /V00040/i.test(await pageText(page));
  if (vendorVisibleBefore) {
    await screenshot(page, 'fixedassets-055-070-accidental-vendor-before-cleanup.png', {
      projectName: project.name,
      testId,
      status: 'rejected',
      bookUse: 'do-not-use',
      purpose: 'FIXEDASSETS-055 rejected anti-pattern: versehentlich geoeffneter/erzeugter Vendor-Kontext V00040 mit Name FA-CNC-01 vor Cleanup.',
      expectedPageText: [/V00040/i],
      knownLimitations: [
        'Dies ist kein Anlagen- oder Einkaufsrechnungsnachweis.',
        'Das Bild dokumentiert einen zu bereinigenden Fehlkontext.'
      ]
    });
  }

  const cleanup = vendorVisibleBefore ? await clickDeleteSelectedVendor(page) : { deleteResult: { clicked: false, reason: 'not-visible-before' }, confirmed: false };
  await openFilteredVendor(page);
  const afterText = await compactPageText(page, {
    include: [/V00040|FA-CNC-01|Vendors|Kreditoren|In dieser Ansicht|Nothing to show|There is nothing|No\.|Name/i],
    maxLines: 140,
    maxLineLength: 240
  });
  await writeTextEvidence(fixedAssetsEvidencePath('071-accidental-vendor-after-cleanup-focused-text.txt'), afterText || 'No V00040 text visible after cleanup.');
  const vendorVisibleAfter = /V00040/i.test(await pageText(page));
  await screenshot(page, 'fixedassets-055-071-accidental-vendor-after-cleanup.png', {
    projectName: project.name,
    testId,
    status: vendorVisibleAfter ? 'rejected' : 'labor',
    bookUse: vendorVisibleAfter ? 'do-not-use' : 'evidence',
    purpose: 'FIXEDASSETS-055 Cleanup-Nachweis fuer den versehentlichen Vendor-Kontext V00040.',
    expectedPageText: [/Vendors|Kreditoren|No\.|Name|In dieser Ansicht|There is nothing/i],
    knownLimitations: [
      'Cleanup-Evidence, kein fachlicher Anlagenkauf.',
      'Keine Buchung, keine Einkaufsrechnung, keine Anlagenposten.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-055-ACCIDENTAL-V00040-VENDOR-CLEANUP',
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
      clickedPreviewPosting: false
    },
    bookImpact:
      'Dieser Anti-Pattern-Fall gehoert in Kapitel 21/Debugging: unscharfe Eingaben in Lookups koennen unerwartet eine andere Karte oeffnen oder einen falschen Stammdatendraft erzeugen. Screenshots muessen immer den richtigen fachlichen Kontext zeigen.',
    nextStep:
      vendorVisibleBefore && !vendorVisibleAfter
        ? 'FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS: 055 als rejected/partial einordnen und vor jedem neuen Mapping einen sichereren Zeilenkontext-Helper bauen.'
        : 'FIXEDASSETS-056-ACCIDENTAL-VENDOR-CLEANUP-BLOCKER: V00040 erst bereinigen, bevor weitere Purchase-Invoice-Feldmapping-Laeufe erlaubt werden.'
  };
  await writeJsonEvidence(fixedAssetsEvidencePath('070-accidental-vendor-cleanup-result.json'), result);

  expect(result.safety.posted).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(vendorVisibleAfter).toBe(false);
});
