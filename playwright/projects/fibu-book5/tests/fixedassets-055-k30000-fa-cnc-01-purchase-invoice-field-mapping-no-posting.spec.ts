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

test.setTimeout(480_000);

const testId = 'fixedassets-055';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
  fixedAssetNo: 'FA-CNC-01',
  fixedAssetDescription: 'CNC Maschine FRA',
  vendorInvoiceNo: `FA055-${Date.now().toString().slice(-8)}`
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function purchaseInvoicesUrl(filterNo?: string) {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  if (filterNo) {
    url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${filterNo}'`);
  }
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
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !/MCP_1_20260210/i.test(decoded)
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
            if (rect.y >= 35 && rect.y <= 135) score -= 10;
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
              score
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
          candidates: candidates.slice(0, 20).map(({ element: _element, ...entry }) => entry)
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

async function focusInputNearCaption(page: Page, caption: RegExp) {
  const source = caption.source;
  const flags = caption.flags.replace('g', '');
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(
        ({ source: patternSource, flags: patternFlags }) => {
          const pattern = new RegExp(patternSource, patternFlags);
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const candidates = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'))
            .filter(visible)
            .map((input) => {
              const rect = input.getBoundingClientRect();
              let container: Element | null = input;
              const chunks: string[] = [];
              for (let depth = 0; depth < 7 && container; depth += 1) {
                chunks.push(normalize(container.textContent));
                container = container.parentElement;
              }
              const nearbyText = chunks.join(' ');
              return {
                input,
                value: normalize(input.value),
                aria: normalize(input.getAttribute('aria-label')),
                title: normalize(input.getAttribute('title')),
                placeholder: normalize(input.placeholder),
                nearbyText,
                readOnly: input.readOnly || input.getAttribute('aria-readonly') === 'true',
                rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
              };
            })
            .filter((entry) => !entry.readOnly)
            .filter((entry) => pattern.test(`${entry.aria} ${entry.title} ${entry.placeholder} ${entry.nearbyText}`))
            .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
          const chosen = candidates[0];
          if (!chosen) return { focused: false, candidates: [] };
          chosen.input.focus();
          chosen.input.click();
          return {
            focused: true,
            chosen: {
              value: chosen.value,
              aria: chosen.aria,
              title: chosen.title,
              placeholder: chosen.placeholder,
              nearbyText: chosen.nearbyText.slice(0, 220),
              rect: chosen.rect
            }
          };
        },
        { source, flags }
      )
      .catch((error) => ({ focused: false, error: String(error), candidates: [] }));
    if (result.focused) return result;
  }
  return { focused: false, reason: `caption-not-found:${caption.source}` };
}

async function fillInputNearCaption(page: Page, caption: RegExp, value: string, commitKey: 'Tab' | 'Enter' = 'Tab') {
  const focus = await focusInputNearCaption(page, caption);
  if (!focus.focused) return { filled: false, value, focus };
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value, { delay: 35 });
  await page.keyboard.press(commitKey);
  await page.waitForTimeout(3500);
  return { filled: true, value, focus };
}

async function setFirstPurchaseLineToFixedAsset(page: Page) {
  const clickType = await clickVisibleGridText(page, /^Item$|^Artikel$/i, /Purchase Invoice|Einkaufsrechnung|Type|No\.|Nr\./i);
  if (!clickType.clicked) return { lineTypeSet: false, fixedAssetNoSet: false, clickType };

  await page.keyboard.press('Control+A');
  await page.keyboard.type('Fixed Asset', { delay: 35 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  if (/Vendor Card|Kreditorenkarte/i.test(await pageText(page))) {
    return {
      lineTypeSet: false,
      fixedAssetNoSet: false,
      wrongContext: 'vendor-card-opened-after-line-type-entry',
      clickType
    };
  }
  await page.keyboard.press('Tab');
  await page.waitForTimeout(800);
  await page.keyboard.type(target.fixedAssetNo, { delay: 45 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4500);
  if (/Vendor Card|Kreditorenkarte/i.test(await pageText(page))) {
    return {
      lineTypeSet: false,
      fixedAssetNoSet: false,
      wrongContext: 'vendor-card-opened-after-fixed-asset-no-entry',
      clickType
    };
  }

  const text = await pageText(page);
  return {
    lineTypeSet: /Fixed Asset|Anlage/i.test(text),
    fixedAssetNoSet: /FA-CNC-01|CNC Maschine FRA/i.test(text),
    clickType
  };
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
            .filter((entry) => entry.rect.y > 350)
            .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
          const chosen = candidates[0];
          if (!chosen) return { clicked: false, reason: 'text-not-found' };
          chosen.element.click();
          return { clicked: true, chosen: { text: chosen.text, rect: chosen.rect } };
        },
        { source, flags, contextSource, contextFlags }
      )
      .catch((error) => ({ clicked: false, reason: String(error) }));
    if (result.clicked) return result;
  }
  return { clicked: false, reason: `grid-text-not-found:${textPattern.source}` };
}

async function collectVisibleBusinessSignals(page: Page) {
  const signals = [];
  for (const frame of page.frames()) {
    const frameSignals = await frame
      .evaluate((targetValues) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const bodyText = normalize(document.body?.innerText || '');
        const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'))
          .filter(visible)
          .map((input) => {
            const rect = input.getBoundingClientRect();
            let container: Element | null = input;
            for (let depth = 0; depth < 5 && container?.parentElement; depth += 1) {
              container = container.parentElement;
            }
            return {
              value: normalize(input.value),
              aria: normalize(input.getAttribute('aria-label')),
              title: normalize(input.getAttribute('title')),
              placeholder: normalize(input.placeholder),
              required: input.hasAttribute('required') || input.getAttribute('aria-required') === 'true',
              readOnly: input.readOnly || input.getAttribute('aria-readonly') === 'true',
              nearbyText: normalize(container?.textContent).slice(0, 260),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
            };
          })
          .filter((field) => field.value !== 'on')
          .filter((field) =>
            /Vendor Name|Vendor Invoice No|Document Date|Posting Date|Due Date|Type|No\.|Description|Fixed Asset|Anlage|K30000|FA-CNC-01|Zollspedition|CNC Maschine/i.test(
              `${field.value} ${field.aria} ${field.title} ${field.placeholder} ${field.nearbyText}`
            )
          )
          .slice(0, 160);
        const actions = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            return {
              text,
              aria,
              title,
              role: normalize(element.getAttribute('role')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
            };
          })
          .filter((entry) => entry.rect.width < 1200)
          .filter((entry) => `${entry.text} ${entry.aria} ${entry.title}`.length <= 260)
          .filter((entry) => /Post|Buchen|Preview|Vorschau|Invoice|Rechnung|Delete|L.schen|Cancel|Abbrechen|Close|Schlie/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
          .slice(0, 60);
        const possibleDocumentNos = Array.from(new Set(bodyText.match(/\b(?:PI|EK|ER|PUR|P-INV|PPI|INV|FA055)?[- ]?\d{4,}\b/gi) ?? [])).slice(0, 30);
        return {
          frameUrl: location.href,
          purchaseInvoiceContextVisible: /Purchase Invoice|Einkaufsrechnung|Purchase Invoices|Einkaufsrechnungen/i.test(bodyText),
          vendorVisible: bodyText.includes(targetValues.vendorNo) || bodyText.includes(targetValues.vendorName),
          fixedAssetVisible: bodyText.includes(targetValues.fixedAssetNo) || bodyText.includes(targetValues.fixedAssetDescription),
          vendorInvoiceNoVisible: bodyText.includes(targetValues.vendorInvoiceNo),
          fixedAssetLineTypeVisible: /Fixed Asset|Anlage/i.test(bodyText),
          hasPostingAction: /Post|Buchen/i.test(bodyText),
          hasPreviewPostingAction: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(bodyText),
          possibleDocumentNos,
          inputs,
          actions
        };
      }, target)
      .catch(() => null);
    if (frameSignals) signals.push(frameSignals);
  }

  const text = await pageText(page);
  return {
    frameSignals: signals,
    purchaseInvoiceContextVisible: /Purchase Invoice|Einkaufsrechnung|Purchase Invoices|Einkaufsrechnungen/i.test(text),
    vendorVisible: /K30000|Zollspedition Nord GmbH/i.test(text),
    fixedAssetVisible: /FA-CNC-01|CNC Maschine FRA/i.test(text),
    vendorInvoiceNoVisible: text.includes(target.vendorInvoiceNo),
    fixedAssetLineTypeVisible: /Fixed Asset|Anlage/i.test(text),
    hasPostingAction: /Post|Buchen/i.test(text),
    hasPreviewPostingAction: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(text),
    possibleDocumentNos: Array.from(new Set(signals.flatMap((entry) => entry.possibleDocumentNos))).slice(0, 30),
    actionLabels: Array.from(
      new Set(signals.flatMap((entry) => entry.actions.map((action) => `${action.text || action.aria || action.title}`.trim()).filter(Boolean)))
    ).slice(0, 100)
  };
}

async function deleteDraftViaUi(page: Page) {
  const attempts: string[] = [];
  for (const frame of page.frames()) {
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
            if (rect.y <= 150) score -= 20;
            if (/line|zeile/i.test(label)) score += 80;
            if (/posted|gebucht|archive|archiv/i.test(label)) score += 80;
            return {
              element,
              text,
              aria,
              title,
              label,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score
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
    attempts.push(JSON.stringify(result));
    if (result.clicked) {
      await page.waitForTimeout(1500);
      const confirm = await confirmDialogNoPosting(page);
      await page.waitForTimeout(3500);
      return { deleteClicked: true, deleteResult: result, confirm, attempts };
    }
  }
  return { deleteClicked: false, attempts };
}

async function confirmDialogNoPosting(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const yes = scope.getByRole('button', { name: /^Yes$|^Ja$/i }).first();
    if (await yes.isVisible({ timeout: 800 }).catch(() => false)) {
      await yes.click();
      return { confirmed: true, button: 'yes' };
    }
    const ok = scope.getByRole('button', { name: /^OK$/i }).first();
    if (await ok.isVisible({ timeout: 800 }).catch(() => false)) {
      await ok.click();
      return { confirmed: true, button: 'ok' };
    }
  }
  return { confirmed: false, button: 'not-found' };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-055 - K30000/FA-CNC-01 Purchase Invoice Field Mapping ohne Buchung',
    '',
    'Status: `labor`, `ui-first`, `field-mapping`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.target.vendorNo} / ${result.target.vendorName} |`,
    `| Zielanlage | ${result.target.fixedAssetNo} / ${result.target.fixedAssetDescription} |`,
    `| Labor-Vendor-Invoice-No. | ${result.target.vendorInvoiceNo} |`,
    `| Feldmapping-Status | ${result.status} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    `| Preview Posting geklickt | ${result.safety.clickedPreviewPosting ? 'ja' : 'nein'} |`,
    `| Draft-Cleanup | ${result.cleanup?.status ?? 'nicht ermittelt'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Was man in Business Central sieht',
    '',
    '- Die Einkaufsrechnung ist ein Auto-Save-naher Belegkontext: Schon Kopf- oder Zeilenwerte koennen einen Entwurf erzeugen.',
    '- Der Kreditor gehoert in den Kopf. Erst danach ist fachlich sinnvoll, die Zeile auf den passenden Typ fuer Anlagen umzustellen.',
    '- Eine Anlagenzeile ist nur belastbar, wenn der Zeilentyp und die Anlagen-Nr. gleichzeitig sichtbar sind.',
    '- `Post` und `Preview Posting` bleiben in diesem Lauf nur Gefahrengrenzen; sie wurden nicht geklickt.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Keine Vorschau, keine Buchung, kein Anlagenzugang, keine AfA und keine Anlagenposten.',
    '- Keine deutsche VAT-/Kontenplan-/HGB-Finalbehauptung.',
    '- Falls die Zeilenwerte nicht sichtbar sind, ist das ein UI-/Feldmapping-Blocker und kein fachlicher Anlagenzugang.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-055 K30000/FA-CNC-01 Purchase Invoice Field Mapping ohne Buchung', async ({ page }) => {
  let cleanup: Record<string, any> = { status: 'not-needed' };
  let finalStatus = 'not-started';
  let finalSummary = '';
  let finalSignals: Awaited<ReturnType<typeof collectVisibleBusinessSignals>> | undefined;

  const openResult = await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-purchase-invoices-list-focused-text.txt'),
    await compactPageText(page, {
      include: /./ ? [/Purchase Invoices|Einkaufsrechnungen|Vendor|Kreditor|New|Neu|Post|Buchen|Invoice|Rechnung/i] : [],
      maxLines: 120,
      maxLineLength: 220
    })
  );

  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  const afterNewText = await compactPageText(page, {
    include: [/Purchase Invoice|Einkaufsrechnung|Vendor|Kreditor|Vendor Invoice No|Type|Fixed Asset|Anlage|No\.|Nr\.|Post|Buchen|Preview|Vorschau|Delete|L.schen/i],
    maxLines: 180,
    maxLineLength: 240
  });
  await writeTextEvidence(fixedAssetsEvidencePath('030-after-new-focused-text.txt'), afterNewText || 'No focused text captured after New/Neu.');

  if (!newAttempt.clicked || !/Purchase Invoice|Einkaufsrechnung/i.test(await pageText(page))) {
    finalStatus = 'blocked-before-field-entry';
    finalSummary = 'Der neue Purchase-Invoice-Kontext wurde nicht stabil erreicht; deshalb wurden K30000 und FA-CNC-01 nicht eingetragen.';
  } else {
    const vendorFill = await fillInputNearCaption(page, /Vendor Name|Kreditorenname|Vendor|Kreditor/i, target.vendorNo, 'Tab');
    const vendorInvoiceFill = await fillInputNearCaption(page, /Vendor Invoice No\.|Kreditorenrechnungsnr\.|Vendor Invoice/i, target.vendorInvoiceNo, 'Tab');
    const afterHeaderSignals = await collectVisibleBusinessSignals(page);
    await writeJsonEvidence(fixedAssetsEvidencePath('035-header-fill-result.json'), {
      vendorFill,
      vendorInvoiceFill,
      afterHeaderSignals
    });
    await writeTextEvidence(
      fixedAssetsEvidencePath('036-after-header-focused-text.txt'),
      await compactPageText(page, {
        include: [/K30000|Zollspedition|Vendor Invoice|FA055|Purchase Invoice|Einkaufsrechnung|Type|Fixed Asset|Anlage|No\.|Post|Buchen|Preview|Vorschau/i],
        maxLines: 180,
        maxLineLength: 260
      })
    );

    const headerText = await pageText(page);
    const headerHasVendorRegistrationDialog = /not registered|nicht registriert|new vendor card|neue Kreditorenkarte/i.test(headerText);
    if (afterHeaderSignals.vendorVisible || afterHeaderSignals.vendorInvoiceNoVisible || headerHasVendorRegistrationDialog) {
      await screenshot(page, 'fixedassets-055-030-header-k30000-visible.png', {
        projectName: project.name,
        testId,
        status: headerHasVendorRegistrationDialog ? 'rejected' : afterHeaderSignals.vendorVisible ? 'candidate' : 'rejected',
        bookUse: headerHasVendorRegistrationDialog ? 'do-not-use' : 'evidence',
        purpose: headerHasVendorRegistrationDialog
          ? 'FIXEDASSETS-055 rejected: Kopf-/Lookup-Versuch zeigt einen Vendor-Registrierungsdialog statt eines stabilen K30000-Belegkopfs.'
          : 'FIXEDASSETS-055 Kopf-Feldmapping: K30000 oder die eindeutige Labor-Vendor-Invoice-No. ist im Purchase-Invoice-Kontext sichtbar.',
        expectedPageText: [/Purchase Invoice|Einkaufsrechnung/i],
        knownLimitations: [
          'Kein Buchbild fuer einen fertigen K30000-Belegkopf.',
          'Nur nutzbar als Anti-Pattern, wenn ein Vendor-Registrierungs-/Lookup-Dialog sichtbar ist.',
          'Keine Vorschau und keine Buchung.'
        ]
      });
    }

    const lineMapping = await setFirstPurchaseLineToFixedAsset(page);
    await writeJsonEvidence(fixedAssetsEvidencePath('040-line-field-mapping-attempt.json'), lineMapping);
    finalSignals = await collectVisibleBusinessSignals(page);
    await writeJsonEvidence(fixedAssetsEvidencePath('050-target-values-visible-signals.json'), finalSignals);
    await writeTextEvidence(
      fixedAssetsEvidencePath('050-target-values-focused-text.txt'),
      await compactPageText(page, {
        include: [/K30000|Zollspedition|FA-CNC-01|CNC Maschine|Fixed Asset|Anlage|Vendor Invoice|FA055|Type|No\.|Post|Buchen|Preview|Vorschau/i],
        maxLines: 220,
        maxLineLength: 260
      })
    );

    const lineText = await pageText(page);
    const lineHasWrongVendorCardContext = /Vendor Card|Kreditorenkarte/i.test(lineText);
    if (finalSignals.fixedAssetVisible || finalSignals.fixedAssetLineTypeVisible || lineHasWrongVendorCardContext) {
      await screenshot(page, 'fixedassets-055-050-line-fa-cnc-01-visible.png', {
        projectName: project.name,
        testId,
        status: lineHasWrongVendorCardContext ? 'rejected' : finalSignals.fixedAssetVisible ? 'candidate' : 'rejected',
        bookUse: lineHasWrongVendorCardContext ? 'do-not-use' : 'evidence',
        purpose: lineHasWrongVendorCardContext
          ? 'FIXEDASSETS-055 rejected: FA-CNC-01 ist in einem Vendor-Card-Kontext sichtbar, nicht in einer Einkaufsrechnungs-Anlagenzeile.'
          : 'FIXEDASSETS-055 Zeilen-Feldmapping: Anlagenzeilentyp und/oder FA-CNC-01 im Purchase-Invoice-Kontext sichtbar.',
        expectedPageText: [/Purchase Invoice|Einkaufsrechnung/i],
        knownLimitations: [
          'Kein Buchbild fuer eine Anlagenzeile.',
          'Als Erfolg nur geeignet, wenn sowohl Zeilentyp Fixed Asset als auch Anlagen-Nr. im Einkaufsrechnungs-Zeilenbereich erkennbar sind.',
          'Keine Preview Posting und keine Buchung.'
        ]
      });
    }

    if ('wrongContext' in lineMapping && lineMapping.wrongContext) {
      finalStatus = 'rejected-wrong-vendor-card-context-no-posting';
      finalSummary =
        'Der Zeilenversuch landete in einem Vendor-Card-/Lookup-Kontext statt in einer Anlagenzeile. Das Bild ist rejected; der Lauf beweist keinen FA-CNC-01-Beleg.';
    } else if (finalSignals.vendorVisible && finalSignals.fixedAssetVisible && finalSignals.fixedAssetLineTypeVisible) {
      finalStatus = 'target-field-mapping-visible-no-posting';
      finalSummary = 'K30000 und FA-CNC-01 sind im Purchase-Invoice-Kontext sichtbar; der Lauf hat bewusst keine Vorschau und keine Buchung ausgefuehrt.';
    } else if (finalSignals.vendorVisible || finalSignals.vendorInvoiceNoVisible || finalSignals.fixedAssetVisible || finalSignals.fixedAssetLineTypeVisible) {
      finalStatus = 'partial-field-mapping-visible-no-posting';
      finalSummary = 'Der Purchase-Invoice-Kontext zeigt Teile des Ziel-Feldmappings, aber nicht alle Zielwerte in einer als Buchbild belastbaren Form.';
    } else {
      finalStatus = 'field-mapping-blocked-no-posting';
      finalSummary = 'K30000/FA-CNC-01 wurden nicht sichtbar belastbar in der Einkaufsrechnung nachgewiesen; der Lauf bleibt ein Feldmapping-Blocker.';
    }

    cleanup = await deleteDraftViaUi(page);
    await openPurchaseInvoices(page).catch(() => undefined);
    const cleanupSignals = await collectVisibleBusinessSignals(page);
    cleanup = {
      ...cleanup,
      status: cleanup.deleteClicked && !cleanupSignals.vendorInvoiceNoVisible ? 'cleanup-attempted-list-returned' : 'cleanup-needs-review',
      afterCleanupSignals: cleanupSignals
    };
    await writeJsonEvidence(fixedAssetsEvidencePath('060-cleanup-result.json'), cleanup);
    await screenshot(page, 'fixedassets-055-060-after-cleanup-list.png', {
      projectName: project.name,
      testId,
      status: cleanup.status === 'cleanup-attempted-list-returned' ? 'labor' : 'candidate',
      bookUse: 'evidence',
      purpose: 'FIXEDASSETS-055 Cleanup-Nachkontrolle: Rueckkehr zur Purchase-Invoices-Liste nach UI-Loesch-/Abbruchversuch.',
      expectedPageText: [/Purchase Invoices|Einkaufsrechnungen/i],
      knownLimitations: [
        'Listenrueckkehr ist ein UI-Cleanup-Nachweis; falls Zielwerte noch sichtbar waeren, muss ein Folgelauf den Entwurf bereinigen.',
        'Keine Buchung und kein Posted-Invoice-Kontext.'
      ]
    });
  }

  const result = {
    testId: 'FIXEDASSETS-055-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-NO-POSTING',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-field-mapping-no-preview-no-posting',
    target,
    context,
    openResult,
    newAttempt,
    finalSignals,
    status: finalStatus,
    summary: finalSummary,
    cleanup,
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      setupChanged: false,
      vendorChanged: false,
      fixedAssetChanged: false,
      clickedPreviewPosting: false,
      clickedPost: false,
      posted: false,
      acquisitionPosted: false,
      depreciationPosted: false
    },
    proves:
      finalStatus === 'target-field-mapping-visible-no-posting'
        ? [
            'K30000 can be entered/validated visibly in the Purchase Invoice header.',
            'A Fixed Asset line context can show FA-CNC-01 before Preview Posting.',
            'The draft context can be cleaned up through UI without posting.'
          ]
        : [
            'The Purchase Invoice field-mapping attempt ran within MCP_1_20260210 / RM-DEMO.',
            'No Preview Posting or Post action was clicked.',
            'The current visible UI result is partial or blocked and must not be overclaimed.'
          ],
    doesNotProve: [
      'No Preview Posting result.',
      'No fixed asset acquisition.',
      'No FA Ledger Entry.',
      'No depreciation.',
      'No German VAT, HGB or chart-of-accounts final proof.'
    ],
    screenshots: [
      'playwright/projects/fibu-book5/img/fixedassets-055-030-header-k30000-visible.png',
      'playwright/projects/fibu-book5/img/fixedassets-055-050-line-fa-cnc-01-visible.png',
      'playwright/projects/fibu-book5/img/fixedassets-055-060-after-cleanup-list.png'
    ],
    bookImpact:
      finalStatus === 'target-field-mapping-visible-no-posting'
        ? 'Kapitel 21 kann den naechsten Anlagenkauf-Schritt enger erklaeren: erst Kreditor im Kopf, dann Zeilentyp Fixed Asset und Anlagen-Nr. in der Zeile, danach erst ein eigenes Preview-Posting-Gate.'
        : finalStatus === 'rejected-wrong-vendor-card-context-no-posting'
          ? 'Kapitel 21 und das Debugging-Kapitel muessen diesen Lauf als Anti-Pattern erklaeren: Ein unscharfer Zeilen-/Lookup-Klick kann in die falsche Karte springen. Als Buchbild ist der Screenshot rejected.'
        : 'Kapitel 21 darf den Anlagenkauf noch nicht als durchgaengige Klickanleitung darstellen. Es muss den aktuellen Blocker als Feldmapping-/UI-Lernfall erklaeren.',
    nextStep:
      finalStatus === 'target-field-mapping-visible-no-posting' && cleanup.status === 'cleanup-attempted-list-returned'
        ? 'FIXEDASSETS-056-K30000-FA-CNC-01-PURCHASE-INVOICE-PREVIEW-GATE-DECISION: ohne BC-Lauf entscheiden, ob ein enger Preview-Posting-Preflight erlaubt wird.'
        : 'FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS: zuerst klaeren, warum Zielwerte oder Cleanup nicht belastbar genug sichtbar sind.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-055-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-055-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-NO-POSTING.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-055 Evidence Index',
      '',
      'Status: `labor`, `ui-first`, `field-mapping`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-055-result.json` | JSON | strukturiertes Ergebnis des Feldmapping-Laufs | keine Vorschau, keine Buchung | labor/partial |',
      '| `FIXEDASSETS-055-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-NO-POSTING.md` | Markdown | Lernbefund, Buchwirkung, Grenzen und naechster Schritt | keinen Anlagenzugang | labor |',
      '| `010-purchase-invoices-list-focused-text.txt` | kompakter Seitentext | Purchase-Invoices-Startkontext | keine Zielwerte | compact |',
      '| `020-scoped-new-attempt.json` | JSON | gescopten New/Neu-Versuch | keine Feldvalidierung | labor |',
      '| `030-after-new-focused-text.txt` | kompakter Seitentext | Belegkontext nach New/Neu | keine Buchung | compact |',
      '| `035-header-fill-result.json` | JSON | Kopf-Feldmapping-Versuch fuer K30000/Vendor Invoice No. | keine Anlagenzeile | labor/partial |',
      '| `036-after-header-focused-text.txt` | kompakter Seitentext | sichtbare Kopfwerte nach Eingabeversuch | keine Vorschau | compact |',
      '| `040-line-field-mapping-attempt.json` | JSON | Versuch, Zeilentyp Fixed Asset und FA-CNC-01 zu setzen | keine Postenspur | labor/partial |',
      '| `050-target-values-visible-signals.json` | JSON | sichtbare Zielwert-/Aktionssignale nach Zeilenversuch | keine fachliche Buchungswirkung | compact |',
      '| `050-target-values-focused-text.txt` | kompakter Seitentext | lesbare Zielwerte oder Blockerhinweise | keine Final-Evidence | compact |',
      '| `060-cleanup-result.json` | JSON | UI-Cleanup-/Rueckkehrnachweis | keine API-Pruefung | labor/partial |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen der Bilder | keine eigenstaendige Fachwahrheit | labor/candidate |',
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(result.safety.apiShortcutUsed).toBe(false);
  expect(result.context.environmentInUrl).toBe(true);
  expect(result.cleanup.status).not.toBe('cleanup-needs-review');
});
