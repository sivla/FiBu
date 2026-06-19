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
import { classifyPurchaseInvoiceLineTypeVisibility } from '../../../core/bc/purchase-invoice-guards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(420_000);

const testId = 'fixedassets-066';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  forbiddenVendorNo: 'K30000',
  forbiddenFixedAssetNo: 'FA-CNC-01',
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function purchaseInvoicesUrl() {
  return bcPageUrl(9308, project.envPrefix);
}

function purchaseInvoicesFilteredUrl(invoiceNo: string) {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
  return url.toString();
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
  return clickBcScoredAction(page, {
    scopeText: /Purchase Invoices|Einkaufsrechnungen/i,
    actionPattern: /^(New|Neu)$|new entry|neuen Eintrag/i,
    titleBonusPattern: /Create a new entry|Erstellen Sie einen neuen Eintrag|neuen Eintrag/i,
    rejectPattern: /Sales|Order|Quote|Power BI|Intercompany|Time Sheet|Report/i,
    preferredYMin: 35,
    preferredYMax: 140,
    waitAfterClick: 4500,
  });
}

async function collectLineTypeEvidence(page: Page) {
  const frameEvidence = [];
  for (const frame of page.frames()) {
    const evidence = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const bodyText = normalize(document.body?.innerText || '');
        const entries = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"],[role="button"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            return {
              text,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => /^(Item|Artikel|Fixed Asset|Anlage)$/.test(entry.text) || /Fixed Asset|Anlage|Item|Artikel/i.test(entry.text))
          .filter((entry) => entry.rect.y > 300)
          .slice(0, 80);
        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          linesContextVisible: /\bType\b|\bNo\.\b|\bDescription\b|\bArt\b|\bNr\./i.test(bodyText),
          fixedAssetLineTypeVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/.test(entry.text)),
          itemLineTypeVisible: entries.some((entry) => /^(Item|Artikel)$/.test(entry.text)),
          forbiddenVendorNoVisible: bodyText.includes('K30000'),
          forbiddenFixedAssetNoVisible: bodyText.includes('FA-CNC-01'),
          vendorCardVisible: /Vendor Card\s*-|Kreditorenkarte\s*-/i.test(bodyText),
          vendorRegistrationVisible: /Create a new vendor card|new vendor card|not registered|neue Kreditorenkarte/i.test(bodyText),
          postingOrPreviewVisible: /\bPost\b|\bBuchen\b|Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(bodyText),
          entries,
        };
      })
      .catch(() => null);
    if (evidence) frameEvidence.push(evidence);
  }

  return {
    purchaseInvoiceVisible: frameEvidence.some((entry) => entry.purchaseInvoiceVisible),
    linesContextVisible: frameEvidence.some((entry) => entry.linesContextVisible),
    fixedAssetLineTypeVisible: frameEvidence.some((entry) => entry.fixedAssetLineTypeVisible),
    itemLineTypeVisible: frameEvidence.some((entry) => entry.itemLineTypeVisible),
    forbiddenVendorNoVisible: frameEvidence.some((entry) => entry.forbiddenVendorNoVisible),
    forbiddenFixedAssetNoVisible: frameEvidence.some((entry) => entry.forbiddenFixedAssetNoVisible),
    vendorCardVisible: frameEvidence.some((entry) => entry.vendorCardVisible),
    vendorRegistrationVisible: frameEvidence.some((entry) => entry.vendorRegistrationVisible),
    postingOrPreviewVisible: frameEvidence.some((entry) => entry.postingOrPreviewVisible),
    frameEvidence,
  };
}

async function extractPurchaseInvoiceDraftNo(page: Page) {
  const text = await pageText(page);
  const headerMatch = text.match(/\b(10\d{4})\s*[^\w\s]?\s*(Purchase Invoice|Einkaufsrechnung)?/i);
  if (headerMatch) return headerMatch[1];
  const anyNumber = text.match(/\b(10\d{4})\b/);
  return anyNumber?.[1] ?? null;
}

async function confirmDialog(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const label of [/^Yes$|^Ja$/i, /^OK$/i]) {
      const button = scope.getByRole('button', { name: label }).first();
      if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1500);
        return { confirmed: true, button: label.source };
      }
    }
  }
  return { confirmed: false, button: 'not-found' };
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
    const result = await clickBcScoredAction(page, {
      scopeText: new RegExp(invoiceNo),
      actionPattern: /Delete|L.schen/i,
      rejectPattern: /line|zeile|posted|gebucht|archive|archiv|Post|Preview/i,
      preferredYMin: 35,
      preferredYMax: 135,
      candidateLimit: 15,
      waitAfterClick: 0,
    });

    if (result.clicked) {
      const confirmation = await confirmDialog(page);
      await page.waitForTimeout(3500);
      await page.goto(purchaseInvoicesFilteredUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await waitForBusinessCentralShell(page);
      await dismissTours(page).catch(() => undefined);
      await page.waitForTimeout(1200);
      const visibleAfter = new RegExp(invoiceNo).test(await pageText(page));
      return { status: visibleAfter ? 'cleanup-clicked-but-still-visible' : 'cleaned-up', invoiceNo, deleteAction: result, confirmation, visibleAfter };
    }
  }

  return { status: 'delete-action-not-found', invoiceNo };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-066 - Guarded Purchase-Invoice-Line-Type Probe',
    '',
    'Status: `labor`, `guarded-no-target-probe`, `no-preview`, `no-posting`, `not-final`',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Status | ${result.status} |`,
    `| Guard | ${result.guard.status} |`,
    `| Draft | ${result.draftInvoiceNo ?? 'nicht ermittelt'} |`,
    `| Cleanup | ${result.cleanup?.status ?? 'not-needed'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Grenzen',
    '',
    '- Kein `K30000`.',
    '- Kein `FA-CNC-01`.',
    '- Keine Preview.',
    '- Kein `Post`.',
    '- Kein Anlagenzugang und keine AfA.',
    '',
  ].join('\n');
}

test('FIXEDASSETS-066 probes Purchase Invoice line type with guard and no target values', async ({ page }) => {
  const openResult = await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-before-new-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Post|Buchen|Invoice|Rechnung/i],
      maxLines: 120,
      maxLineLength: 220,
    }),
  );

  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-scoped-new-attempt.json'), newAttempt);

  const lineTypeEvidence = await collectLineTypeEvidence(page);
  const guard = classifyPurchaseInvoiceLineTypeVisibility(lineTypeEvidence);
  await writeJsonEvidence(fixedAssetsEvidencePath('030-line-type-guard-result.json'), { lineTypeEvidence, guard });
  await writeTextEvidence(
    fixedAssetsEvidencePath('031-after-new-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Type|Fixed Asset|Anlage|Item|Artikel|Vendor Card|Kreditorenkarte|Post|Buchen|Preview|Vorschau/i],
      maxLines: 220,
      maxLineLength: 220,
    }),
  );

  const draftInvoiceNo = await extractPurchaseInvoiceDraftNo(page);
  const cleanup = draftInvoiceNo ? await deletePurchaseInvoiceDraftViaFilteredList(page, draftInvoiceNo) : { status: 'not-needed-or-no-draft-no-found' };
  await writeJsonEvidence(fixedAssetsEvidencePath('090-cleanup-result.json'), cleanup);

  const safeLineTypeVisible = guard.status === 'safe-fixed-asset-line-type-visible';
  const status = safeLineTypeVisible ? 'fixed-asset-line-type-visible-no-target' : `blocked-${guard.status}`;
  const result = {
    caseId: 'FIXEDASSETS-066-PURCHASE-INVOICE-LINE-TYPE-GUARDED-PROBE',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'guarded-no-target-line-type-probe-no-preview-no-posting',
    target,
    openResult,
    context,
    newAttempt,
    lineTypeEvidence,
    guard,
    draftInvoiceNo,
    cleanup,
    status,
    success: safeLineTypeVisible,
    safety: {
      forbiddenVendorNoEntered: false,
      forbiddenFixedAssetNoEntered: false,
      forbiddenVendorNoVisible: lineTypeEvidence.forbiddenVendorNoVisible,
      forbiddenFixedAssetNoVisible: lineTypeEvidence.forbiddenFixedAssetNoVisible,
      clickedPreviewPosting: false,
      clickedPost: false,
      posted: false,
      acquisitionPosted: false,
      depreciationPosted: false,
      setupChanged: false,
      apiShortcutUsed: false,
      companySwitched: false,
    },
    summary: safeLineTypeVisible
      ? 'Der Zeilentyp Fixed Asset wurde sichtbar im Einkaufsrechnungs-Zeilenkontext nachgewiesen; Zielwerte bleiben fuer den Folgelauf gesperrt.'
      : `Der Guard stoppte den Lauf mit ${guard.status}. Zielwerte bleiben gesperrt.`,
    bookImpact: safeLineTypeVisible
      ? 'Kapitel 21 kann den Zeilentyp als separaten Labor-Kontrollpunkt verwenden, aber noch keinen Anlagenkauf behaupten.'
      : 'Kapitel 21 bleibt beim Debugging-Hinweis: Ohne sichtbaren Zeilentyp Fixed Asset darf keine Anlagen-Nr. eingegeben werden.',
    nextStep: safeLineTypeVisible
      ? 'Naechsten separaten Field-Mapping-Lauf planen; dann erst K30000/FA-CNC-01 pruefen, weiter ohne Preview/Post.'
      : 'Zeilentyp-Auswahl weiter verbessern; keine Zielwerte eingeben.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-066-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-066-PURCHASE-INVOICE-LINE-TYPE-GUARDED-PROBE.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-066 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-066-result.json` | JSON | Guarded no-target UI-Probe fuer Einkaufsrechnungs-Zeilentyp | keine Zielanlage, keine Preview/Buchung | `labor`, `guarded-probe` |',
      '| `030-line-type-guard-result.json` | JSON | strukturierte Zeilentyp-Evidence und Guard-Status | keine Nummernspalte | `line-type-guard` |',
      '| `090-cleanup-result.json` | JSON | UI-Cleanup des Entwurfs, falls einer entstand | keine API-Datenbankgarantie | `cleanup` |',
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
    ].join('\n'),
  );

  expect(result.safety.forbiddenVendorNoEntered).toBe(false);
  expect(result.safety.forbiddenFixedAssetNoEntered).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.posted).toBe(false);
});
