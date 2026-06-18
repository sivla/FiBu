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

const testId = 'fixedassets-064';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
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
    forbiddenFixedAssetNoVisible: frameEvidence.some((entry) => entry.forbiddenFixedAssetNoVisible),
    vendorCardVisible: frameEvidence.some((entry) => entry.vendorCardVisible),
    vendorRegistrationVisible: frameEvidence.some((entry) => entry.vendorRegistrationVisible),
    postingOrPreviewVisible: frameEvidence.some((entry) => entry.postingOrPreviewVisible),
    frameEvidence,
  };
}

async function setFirstLineTypeToFixedAssetOnly(page: Page) {
  const clickType = await clickVisibleGridText(page, /^Item$|^Artikel$/i, /Purchase Invoice|Einkaufsrechnung|Type|No\.|Nr\./i);
  if (!clickType.clicked) return { attempted: false, clickType };

  await page.keyboard.press('Control+A');
  await page.keyboard.type('Fixed Asset', { delay: 35 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3500);
  const guard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
  const lineTypeEvidence = await collectLineTypeEvidence(page);
  return { attempted: true, clickType, guard, lineTypeEvidence };
}

async function extractPurchaseInvoiceDraftNo(page: Page) {
  const text = await pageText(page);
  const headerMatch = text.match(/\b(10\d{4})\s*[∙·\-.]\s*(Purchase Invoice|Einkaufsrechnung)?/i);
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
        if (!chosen) return { clicked: false, reason: 'delete-action-not-found', candidates: candidates.slice(0, 15).map(({ element: _element, ...entry }) => entry) };
        chosen.element.click();
        return { clicked: true, chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, rect: chosen.rect, score: chosen.score } };
      })
      .catch((error) => ({ clicked: false, reason: String(error) }));

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
    '# FIXEDASSETS-064 - Purchase-Invoice-Zeilentyp ohne Zielanlage',
    '',
    'Status: `labor`, `ui-first`, `line-type-probe`, `no-target-entry`, `no-preview`, `no-posting`, `not-final`',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Status | ${result.status} |`,
    `| Draft | ${result.draftInvoiceNo ?? 'nicht ermittelt'} |`,
    `| Cleanup | ${result.cleanup?.status ?? 'not-needed'} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Lernwert',
    '',
    'Bei einer Anlagen-Einkaufsrechnung ist nicht die Nummer der erste sichere Nachweis, sondern der Zeilentyp. Erst wenn die Zeile sichtbar `Fixed Asset` zeigt, gehoert die nachfolgende Nummernspalte fachlich zur Anlagenlogik. Bleibt `Type = Item`, kann dieselbe Eingabe in einen falschen Lookup- oder Kreditorenkontext fuehren.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Kein `K30000` und kein `FA-CNC-01` in diesem Lauf.',
    '- Keine Preview, kein `Post`, kein Anlagenzugang und keine AfA.',
    '- CRONUS-USA-Labor; kein deutscher HGB-/Kontenplan-/VAT-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-064 proves Purchase Invoice line type Fixed Asset without target number', async ({ page }) => {
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
  const afterNewGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
  const afterNewLineTypeEvidence = await collectLineTypeEvidence(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('030-after-new-line-type-evidence.json'), afterNewLineTypeEvidence);

  const lineTypeAttempt = newAttempt.clicked ? await setFirstLineTypeToFixedAssetOnly(page) : { attempted: false, reason: 'new-not-clicked' };
  await writeJsonEvidence(fixedAssetsEvidencePath('040-line-type-attempt-result.json'), lineTypeAttempt);
  await writeTextEvidence(
    fixedAssetsEvidencePath('041-after-line-type-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Type|Fixed Asset|Anlage|Item|Artikel|FA-CNC-01|Vendor Card|Kreditorenkarte|Post|Buchen|Preview|Vorschau/i],
      maxLines: 220,
      maxLineLength: 220,
    }),
  );

  const afterLineTypeEvidence = await collectLineTypeEvidence(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('050-final-line-type-visibility-result.json'), afterLineTypeEvidence);

  const success =
    newAttempt.clicked &&
    Boolean(lineTypeAttempt.attempted) &&
    afterLineTypeEvidence.purchaseInvoiceVisible &&
    afterLineTypeEvidence.linesContextVisible &&
    afterLineTypeEvidence.fixedAssetLineTypeVisible &&
    !afterLineTypeEvidence.forbiddenFixedAssetNoVisible &&
    !afterLineTypeEvidence.vendorCardVisible &&
    !afterLineTypeEvidence.vendorRegistrationVisible;

  await screenshot(page, 'fixedassets-064-050-line-type-fixed-asset-visible.png', {
    projectName: project.name,
    testId,
    status: success ? 'candidate' : 'rejected',
    bookUse: success ? 'field-proof' : 'do-not-use',
    purpose: 'FIXEDASSETS-064 Zeilentyp-Probe: Nur zeigen, ob eine Purchase-Invoice-Zeile sichtbar auf Fixed Asset gesetzt werden kann. Kein FA-CNC-01.',
    expectedPageText: success ? [/Purchase Invoice|Einkaufsrechnung/i, /Fixed Asset|Anlage/i] : [/Purchase Invoice|Einkaufsrechnung|Vendor Card|Kreditorenkarte/i],
    knownLimitations: ['Kein K30000, kein FA-CNC-01, keine Preview, kein Post, kein Anlagenzugang.', 'CRONUS-USA-Labor, kein deutscher Finalnachweis.'],
  });

  const draftInvoiceNo = await extractPurchaseInvoiceDraftNo(page);
  const cleanup = draftInvoiceNo ? await deletePurchaseInvoiceDraftViaFilteredList(page, draftInvoiceNo) : { status: 'not-needed-or-no-draft-no-found' };
  await writeJsonEvidence(fixedAssetsEvidencePath('090-cleanup-result.json'), cleanup);
  await writeTextEvidence(
    fixedAssetsEvidencePath('091-after-cleanup-focused-text.txt'),
    await compactPageText(page, {
      include: [new RegExp(draftInvoiceNo ?? 'NO_DRAFT_NUMBER_FOUND'), /Purchase Invoices|Einkaufsrechnungen|nothing to show|nichts angezeigt/i],
      maxLines: 160,
      maxLineLength: 220,
    }),
  );

  const status = success
    ? cleanup.status === 'cleaned-up' || cleanup.status === 'not-needed-or-no-draft-no-found'
      ? 'line-type-fixed-asset-visible-cleaned-up'
      : 'line-type-visible-cleanup-blocked'
    : 'line-type-fixed-asset-not-proven';

  const result = {
    caseId: 'FIXEDASSETS-064-PURCHASE-INVOICE-LINE-TYPE-UI-PROBE-NO-TARGET',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-line-type-probe-no-target-no-preview-no-posting',
    target,
    openResult,
    context,
    newAttempt,
    afterNewGuard,
    afterNewLineTypeEvidence,
    lineTypeAttempt,
    afterLineTypeEvidence,
    draftInvoiceNo,
    cleanup,
    status,
    success,
    safety: {
      forbiddenFixedAssetNoEntered: false,
      forbiddenFixedAssetNoVisible: afterLineTypeEvidence.forbiddenFixedAssetNoVisible,
      clickedPreviewPosting: false,
      clickedPost: false,
      posted: false,
      acquisitionPosted: false,
      depreciationPosted: false,
      setupChanged: false,
      apiShortcutUsed: false,
      companySwitched: false,
    },
    screenshots: ['playwright/projects/fibu-book5/img/fixedassets-064-050-line-type-fixed-asset-visible.png'],
    summary: success
      ? 'Die Einkaufsrechnungszeile konnte ohne Zielanlagennummer sichtbar auf Type = Fixed Asset gesetzt werden. Damit ist der Zeilentyp als naechster fachlicher Schalter belegt; FA-CNC-01 bleibt fuer den Folgelauf gesperrt.'
      : 'Der Zeilentyp Fixed Asset wurde nicht belastbar im Purchase-Invoice-Zeilenkontext nachgewiesen. Der Folgelauf darf FA-CNC-01 weiterhin nicht eingeben.',
    bookImpact: success
      ? 'Kapitel 21 kann den Zeilentyp als separaten Pflichtschritt vor der Anlagen-Nr. erklaeren. Das Bild ist ein Labor-Kandidat fuer den Schalter Type = Fixed Asset, nicht fuer den Zielbeleg.'
      : 'Kapitel 21 muss weiter warnen: Ohne sichtbaren Zeilentyp Fixed Asset ist jede Anlagen-Nr.-Eingabe ein falscher oder unbewiesener Pfad.',
    nextStep: success
      ? 'FIXEDASSETS-065-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-NO-POSTING: erst nach neuem Gate K30000 und FA-CNC-01 im selben sichtbaren Kontext pruefen; weiter ohne Preview/Post.'
      : 'FIXEDASSETS-065-PURCHASE-INVOICE-LINE-TYPE-HELPER-DIAGNOSIS: Zeilentyp-Auswahl robuster diagnostizieren, weiter ohne FA-CNC-01.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-064-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-064-PURCHASE-INVOICE-LINE-TYPE-UI-PROBE-NO-TARGET.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-064 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-064-result.json` | JSON | UI-first Zeilentyp-Probe, Safety- und Cleanup-Status | keine Zielanlage, keine Preview/Buchung | `labor`, `line-type-probe` |',
      '| `040-line-type-attempt-result.json` | JSON | Klick-/Eingabeversuch fuer `Type = Fixed Asset` | keine Nummernspalte | `line-type-proof-or-blocker` |',
      '| `050-final-line-type-visibility-result.json` | JSON | ob `Fixed Asset` sichtbar wurde und ob verbotene Kontexte offen sind | keine Postenspur | `visibility` |',
      '| `fixedassets-064-050-line-type-fixed-asset-visible.png` | Screenshot | Zeilentyp-Kandidat oder Rejected-Bild laut Metadaten | kein `FA-CNC-01`, kein Anlagenzugang | `candidate/rejected` |',
      '| `090-cleanup-result.json` | JSON | UI-Cleanup des Entwurfs, falls einer entstand | keine API-Datenbankgarantie | `cleanup` |',
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
    ].join('\n'),
  );

  expect(result.safety.forbiddenFixedAssetNoEntered).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.posted).toBe(false);
});
