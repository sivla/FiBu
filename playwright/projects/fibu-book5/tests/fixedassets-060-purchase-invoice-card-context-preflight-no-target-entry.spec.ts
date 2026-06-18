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

test.setTimeout(420_000);

const testId = 'fixedassets-060';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  fixedAssetNo: 'FA-CNC-01',
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
        const visibleTextEntries = Array.from(document.querySelectorAll<HTMLElement>('h1,h2,h3,[role="heading"],span,div,label'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              text: normalize(element.innerText || element.textContent),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => entry.text || entry.aria || entry.title)
          .slice(0, 1000);
        const titleCandidates = visibleTextEntries
          .filter((entry) => /^(Purchase Invoice|Einkaufsrechnung)$|^(Purchase Invoices|Einkaufsrechnungen)$/i.test(entry.text))
          .slice(0, 30);
        const fields = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'))
          .filter(visible)
          .map((input) => {
            const rect = input.getBoundingClientRect();
            let container: Element | null = input;
            const textChunks: string[] = [];
            for (let depth = 0; depth < 7 && container; depth += 1) {
              textChunks.push(normalize(container.textContent));
              container = container.parentElement;
            }
            return {
              value: normalize(input.value),
              aria: normalize(input.getAttribute('aria-label')),
              title: normalize(input.getAttribute('title')),
              placeholder: normalize(input.placeholder),
              readOnly: input.readOnly || input.getAttribute('aria-readonly') === 'true',
              nearbyText: textChunks.join(' ').slice(0, 280),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => /Vendor Name|Buy-from Vendor|Vendor Invoice No|Document Date|Posting Date|Due Date|Type|No\.|Description|Kreditor|Rechnungsnr/i.test(`${entry.aria} ${entry.title} ${entry.placeholder} ${entry.nearbyText}`))
          .slice(0, 120);
        const bodyText = normalize(document.body?.innerText || '');
        const exactPurchaseInvoiceTitle = titleCandidates.some((entry) => /^Purchase Invoice$|^Einkaufsrechnung$/i.test(entry.text));
        const listTitle = titleCandidates.some((entry) => /^Purchase Invoices$|^Einkaufsrechnungen$/i.test(entry.text));
        const requiredFieldSignals = {
          vendorName: /Vendor Name|Buy-from Vendor|Kreditor/i.test(bodyText),
          vendorInvoiceNo: /Vendor Invoice No\.|Kreditorenrechnungsnr|Rechnungsnr/i.test(bodyText),
          postingDate: /Posting Date|Buchungsdatum/i.test(bodyText),
          documentDate: /Document Date|Belegdatum/i.test(bodyText),
        };
        const linesSignals = {
          typeColumn: /\bType\b|\bArt\b/i.test(bodyText),
          noColumn: /\bNo\.\b|\bNr\./i.test(bodyText),
          descriptionColumn: /\bDescription\b|Beschreibung/i.test(bodyText),
        };
        return {
          frameUrl: location.href,
          exactPurchaseInvoiceTitle,
          listTitle,
          titleCandidates,
          requiredFieldSignals,
          linesSignals,
          fields,
          hasPostingAction: /\bPost\b|\bBuchen\b/i.test(bodyText),
          hasPreviewPostingAction: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(bodyText),
        };
      })
      .catch(() => null);
    if (signals) frameSignals.push(signals);
  }
  const aggregate = {
    exactPurchaseInvoiceTitle: frameSignals.some((entry) => entry.exactPurchaseInvoiceTitle),
    listTitle: frameSignals.some((entry) => entry.listTitle),
    vendorNameField: frameSignals.some((entry) => entry.requiredFieldSignals.vendorName),
    vendorInvoiceNoField: frameSignals.some((entry) => entry.requiredFieldSignals.vendorInvoiceNo),
    postingDateField: frameSignals.some((entry) => entry.requiredFieldSignals.postingDate),
    documentDateField: frameSignals.some((entry) => entry.requiredFieldSignals.documentDate),
    linesTypeColumn: frameSignals.some((entry) => entry.linesSignals.typeColumn),
    linesNoColumn: frameSignals.some((entry) => entry.linesSignals.noColumn),
    linesDescriptionColumn: frameSignals.some((entry) => entry.linesSignals.descriptionColumn),
    hasPostingAction: frameSignals.some((entry) => entry.hasPostingAction),
    hasPreviewPostingAction: frameSignals.some((entry) => entry.hasPreviewPostingAction),
  };
  return {
    ...aggregate,
    activeCardAndLinesContextProven:
      aggregate.exactPurchaseInvoiceTitle &&
      aggregate.vendorInvoiceNoField &&
      aggregate.vendorNameField &&
      aggregate.linesTypeColumn &&
      aggregate.linesNoColumn &&
      !aggregate.listTitle,
    frameSignals,
  };
}

async function leaveContextWithoutPosting(page: Page) {
  const attempts: string[] = [];
  for (const label of [/^Cancel$|^Abbrechen$/i, /^Close$|^Schlie/i, /^Back$|^Zur.ck$/i]) {
    for (const scope of [page, ...page.frames()]) {
      const action = scope.getByRole('button', { name: label }).first();
      if (await action.isVisible({ timeout: 700 }).catch(() => false)) {
        attempts.push(`click:${label.source}`);
        await action.click({ timeout: 4000 }).catch(() => undefined);
        await page.waitForTimeout(1800);
        return { left: true, method: attempts.at(-1), attempts };
      }
    }
  }
  attempts.push('goto-purchase-invoices-list');
  await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => undefined);
  await waitForBusinessCentralShell(page).catch(() => undefined);
  await dismissTours(page).catch(() => undefined);
  return { left: true, method: 'goto-purchase-invoices-list', attempts };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-060 Purchase-Invoice-Card-Kontext-Preflight',
    '',
    'Status: `labor`, `ui-first`, `context-preflight`, `no-target-entry`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Status | ${result.status} |`,
    `| Zielwerte eingegeben | ${result.safety.targetValuesEntered ? 'ja' : 'nein'} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Lernwert',
    '',
    'Nach `Neu` muss Business Central nicht nur eine Aktion bestaetigen, sondern einen eindeutigen fachlichen Zielbereich zeigen. Fuer den Anlagenkauf reicht ein Listen- oder Inline-Zeilenkontext nicht. Erst ein sichtbarer Belegkopf mit Pflichtfeldern und ein sichtbarer Lines-/Gridbereich waeren die Grundlage fuer spaetere Zielwerte.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Keine Eingabe von `K30000`, `Vendor Invoice No.` oder `FA-CNC-01`.',
    '- Keine Preview, kein `Post`, kein Anlagenzugang, keine AfA und keine Anlagenposten.',
    '- CRONUS-USA-Labor; kein deutscher HGB-/Kontenplan-/VAT-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-060 proves or blocks Purchase Invoice Card/Lines context without target entry', async ({ page }) => {
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
  const guard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
  const cardContext = await collectCardContextSignals(page);

  await writeJsonEvidence(fixedAssetsEvidencePath('030-after-new-guard.json'), guard);
  await writeJsonEvidence(fixedAssetsEvidencePath('031-after-new-card-context-signals.json'), cardContext);
  await writeTextEvidence(
    fixedAssetsEvidencePath('032-after-new-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Purchase Invoices|Einkaufsrechnung|Vendor|Kreditor|Vendor Invoice No|Document Date|Posting Date|Type|No\.|Description|Post|Buchen|Preview|Vorschau|Delete|L.schen/i],
      maxLines: 200,
      maxLineLength: 260,
    }),
  );

  await screenshot(page, 'fixedassets-060-030-after-new-context-preflight.png', {
    projectName: project.name,
    testId,
    status: cardContext.activeCardAndLinesContextProven ? 'candidate' : 'rejected',
    bookUse: cardContext.activeCardAndLinesContextProven ? 'evidence' : 'do-not-use',
    purpose:
      'FIXEDASSETS-060 Kontext-Preflight nach New/Neu: prueft, ob aktive Purchase-Invoice-Karte, Pflichtfelder und Lines/Grid sichtbar sind, ohne Zielwerte einzugeben.',
    expectedPageText: [/Purchase Invoice|Purchase Invoices|Einkaufsrechnung|Einkaufsrechnungen/i],
    knownLimitations: [
      'Kein K30000, keine Vendor Invoice No. und keine FA-CNC-01-Zeile.',
      'Keine Preview und keine Buchung.',
      cardContext.activeCardAndLinesContextProven
        ? 'Kontextbild ist nur Preflight, kein Anlagenkauf.'
        : 'Bild ist rejected/do-not-use fuer Buchprozess, weil Card-/Lines-Kontext nicht voll bewiesen ist.',
    ],
  });

  const leaveResult = await leaveContextWithoutPosting(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('040-leave-context-result.json'), leaveResult);
  await openPurchaseInvoices(page).catch(() => undefined);
  await writeTextEvidence(
    fixedAssetsEvidencePath('050-after-leave-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Post|Buchen|Invoice|Rechnung/i],
      maxLines: 120,
      maxLineLength: 220,
    }),
  );

  const status = cardContext.activeCardAndLinesContextProven ? 'card-lines-context-proven-no-target-entry' : 'blocked-card-lines-context-not-proven';
  const result = {
    caseId: 'FIXEDASSETS-060-PURCHASE-INVOICE-CARD-CONTEXT-PREFLIGHT-NO-TARGET-ENTRY',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-card-context-preflight-no-target-entry',
    target,
    context,
    openResult,
    newAttempt,
    guard,
    cardContext,
    leaveResult,
    status,
    summary: cardContext.activeCardAndLinesContextProven
      ? 'Nach New/Neu sind ein singularer Purchase-Invoice-Titel, Pflichtfelder und Lines-/Gridspalten sichtbar. Es wurden bewusst keine Zielwerte eingegeben.'
      : 'Nach New/Neu ist der aktive Purchase-Invoice-Card-/Lines-Kontext weiter nicht belastbar genug bewiesen. Der Lauf stoppt ohne Zielwerte, Preview oder Buchung.',
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      setupChanged: false,
      targetValuesEntered: false,
      clickedPreviewPosting: false,
      clickedPost: false,
      posted: false,
      acquisitionPosted: false,
      depreciationPosted: false,
    },
    proves: [
      'The run stayed within MCP_1_20260210 / RM-DEMO.',
      'New/Neu was tested with a scoped Purchase Invoices context.',
      'The active card/lines context after New/Neu was evaluated before any target value entry.',
      'No target value, Preview Posting or Post action was executed.',
    ],
    doesNotProve: [
      'No K30000 purchase invoice header.',
      'No Vendor Invoice No. value.',
      'No FA-CNC-01 fixed-asset line.',
      'No Preview Posting.',
      'No acquisition, depreciation or ledger trace.',
      'No German final proof.',
    ],
    screenshots: ['playwright/projects/fibu-book5/img/fixedassets-060-030-after-new-context-preflight.png'],
    bookImpact: cardContext.activeCardAndLinesContextProven
      ? 'Kapitel 21 kann als naechsten Gate-Schritt entscheiden, ob ein enger Zielwerte-Preflight erlaubt wird. Das Bild bleibt Preflight, kein Anlagenkauf.'
      : 'Kapitel 21 bekommt keinen Zielwerte- oder Anlagenkauf-Screenshot. Das Debugging-/Nachweiskapitel sollte den Fall als Kontextblocker nutzen: Nach New/Neu muss erst der aktive Beleg-/Lines-Kontext sichtbar sein.',
    nextStep: cardContext.activeCardAndLinesContextProven
      ? 'FIXEDASSETS-061-K30000-FA-CNC-01-TARGET-FIELD-MAPPING-GATE: ohne BC-Lauf entscheiden, ob Zielwerte in einem neuen kontrollierten Lauf gesetzt werden duerfen.'
      : 'FIXEDASSETS-061-PURCHASE-INVOICE-CARD-CONTEXT-MANUAL-OR-HELPER-REFINEMENT: einen alternativen manuellen UI-Pfad oder besseren Card-Kontext-Helper dokumentieren, bevor Zielwerte gesetzt werden.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-060-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-060-PURCHASE-INVOICE-CARD-CONTEXT-PREFLIGHT.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-060 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-060-result.json` | JSON | Kontext-Preflight nach `New/Neu`, Safety-Status, naechster Schritt | keinen Zielbeleg, keine Buchung | `labor`, `ui-first`, `no-target-entry` |',
      '| `030-after-new-guard.json` | JSON | Purchase-Invoice-Guard-Zustand nach `New/Neu` | keine Feldwerte | `guard` |',
      '| `031-after-new-card-context-signals.json` | JSON | ob singularer Belegtitel, Pflichtfelder und Lines/Grid sichtbar sind | keine Zielwerte | `context-preflight` |',
      '| `032-after-new-focused-text.txt` | kompakter Seitentext | sichtbaren UI-Kontext nach `New/Neu` | keinen visuellen Buchbeweis allein | `compact` |',
      '| `fixedassets-060-030-after-new-context-preflight.png` | Screenshot | Kontextbild nach `New/Neu` | keinen Anlagenkauf; bei Blocker kein Buchbild | `candidate/rejected` laut Metadaten |',
      '| `040-leave-context-result.json` | JSON | Verlassen ohne Zielwerte/Posting | keine Datenbank-Cleanup-Pruefung | `safety` |',
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
    ].join('\n'),
  );

  expect(context.environmentInUrl).toBe(true);
  expect(result.safety.targetValuesEntered).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.apiShortcutUsed).toBe(false);
});
