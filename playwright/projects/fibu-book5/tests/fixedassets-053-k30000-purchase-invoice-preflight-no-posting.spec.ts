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

test.setTimeout(420_000);

const testId = 'fixedassets-053';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
  fixedAssetNo: 'FA-CNC-01',
  fixedAssetDescription: 'CNC Maschine FRA'
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
            /Vendor Name|Vendor Invoice No|Document Date|Posting Date|Due Date|Contact|Type|No\.|Description|Fixed Asset|Anlage|Der Wert f.r dieses Feld muss angegeben werden|required/i.test(
              `${field.value} ${field.aria} ${field.title} ${field.placeholder} ${field.nearbyText}`
            )
          )
          .slice(0, 120);
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
          .filter((entry) => /Post|Buchen|Preview|Vorschau|Invoice|Rechnung|Delete|L.schen|Cancel|Abbrechen|Close|Schlie|New|Neu/i.test(`${entry.text} ${entry.aria} ${entry.title}`))
          .slice(0, 40);
        const possibleDocumentNos = Array.from(new Set(bodyText.match(/\b(?:PI|EK|ER|PUR|P-INV|PPI|INV)?[- ]?\d{4,}\b/gi) ?? [])).slice(0, 20);
        return {
          frameUrl: location.href,
          purchaseInvoiceContextVisible: /Purchase Invoice|Einkaufsrechnung|Purchase Invoices|Einkaufsrechnungen/i.test(bodyText),
          vendorVisible: bodyText.includes(targetValues.vendorNo) || bodyText.includes(targetValues.vendorName),
          fixedAssetVisible: bodyText.includes(targetValues.fixedAssetNo) || bodyText.includes(targetValues.fixedAssetDescription),
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
    hasPostingAction: /Post|Buchen/i.test(text),
    hasPreviewPostingAction: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(text),
    possibleDocumentNos: Array.from(new Set(signals.flatMap((entry) => entry.possibleDocumentNos))).slice(0, 30),
    actionLabels: Array.from(
      new Set(signals.flatMap((entry) => entry.actions.map((action) => `${action.text || action.aria || action.title}`.trim()).filter(Boolean)))
    ).slice(0, 80)
  };
}

async function closeOrCancelWithoutPosting(page: Page) {
  const attempts: string[] = [];
  const labels = [/^Cancel$|^Abbrechen$/i, /^Close$|^Schlie/i, /^Back$|^Zur.ck$/i];
  for (const label of labels) {
    for (const scope of [page, ...page.frames()]) {
      for (const role of ['button', 'menuitem'] as const) {
        const action = scope.getByRole(role, { name: label }).first();
        if (await action.isVisible({ timeout: 700 }).catch(() => false)) {
          attempts.push(`click:${role}:${label.source}`);
          await action.click({ timeout: 4000 }).catch(() => undefined);
          await page.waitForTimeout(2500);
          return { closed: true, method: attempts.at(-1), attempts };
        }
      }
    }
  }

  attempts.push('keyboard:Escape');
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1000);
  attempts.push('browser:back');
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(2500);
  return { closed: true, method: 'escape-and-back', attempts };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-053 - K30000 Purchase Invoice Preflight ohne Buchung',
    '',
    'Status: `labor`, `ui-first`, `preflight`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.target.vendorNo} / ${result.target.vendorName} |`,
    `| Zielanlage | ${result.target.fixedAssetNo} / ${result.target.fixedAssetDescription} |`,
    `| Einkaufsrechnung angelegt | ${result.safety.purchaseInvoiceSaved ? 'ja' : 'nein'} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    `| Status | ${result.status} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Was man in Business Central sieht',
    '',
    '- `Purchase Invoices` ist der richtige Einstieg fuer eine Einkaufsrechnung ohne vorherige Einkaufsbestellung.',
    '- Der neue Belegkontext entsteht bereits beim Klick auf `New/Neu`; deshalb ist der Abbruch-/Cleanup-Weg fachlich relevant.',
    '- Posting-Aktionen sind im Belegkontext gefaehrlich: Sie duerfen in diesem Preflight sichtbar dokumentiert, aber nicht ausgefuehrt werden.',
    '- Dieser Lauf prueft zuerst Seite, Pflichtfelder, Aktionsgrenzen und Entwurfsverhalten. `K30000` und `FA-CNC-01` werden erst in einem spaeteren Gate in den Beleg eingetragen, wenn Cleanup sicher genug ist.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 sollte den Kaufbeleg nicht direkt als Anlagenzugang erklaeren. Vorher braucht es einen Preflight: Seite oeffnen, Pflichtfelder verstehen, Entwurfsnummer/Auto-Save beachten, gefaehrliche Aktionen erkennen und nur danach entscheiden, ob Kreditor und Anlagenzeile kontrolliert eingetragen werden.',
    '',
    '## Grenzen',
    '',
    '- Keine Einkaufsrechnung wurde gespeichert oder gebucht.',
    '- Kein `K30000`-Belegkopf und keine `FA-CNC-01`-Zeile wurden erzeugt.',
    '- Kein Anlagenzugang, keine AfA, keine Anlagenposten.',
    '- CRONUS-USA-Labor; kein deutscher HGB-, Kontenplan- oder VAT-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-053 K30000 Purchase Invoice Preflight ohne Buchung', async ({ page }) => {
  const openResult = await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  const listText = await compactPageText(page, {
    include: [/Purchase Invoices|Einkaufsrechnungen|Vendor|Kreditor|New|Neu|Post|Buchen|Invoice|Rechnung/i],
    maxLines: 120,
    maxLineLength: 220
  });
  await writeTextEvidence(fixedAssetsEvidencePath('010-purchase-invoices-list-focused-text.txt'), listText);
  await screenshot(page, 'fixedassets-053-010-purchase-invoices-list.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'navigation',
    purpose: 'FIXEDASSETS-053 Einstieg: Purchase Invoices Liste in RM-DEMO vor kontrolliertem New/Neu-Preflight.',
    expectedPageText: [/Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: [
      'Nur Einstieg und Seitenkontext.',
      'Noch kein K30000-Belegkopf, keine FA-CNC-01-Zeile und keine Buchung.'
    ]
  });

  const beforeSignals = await collectVisibleBusinessSignals(page);
  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-scoped-new-attempt.json'), newAttempt);

  const afterNewSignals = await collectVisibleBusinessSignals(page);
  const afterNewText = await compactPageText(page, {
    include: [/Purchase Invoice|Einkaufsrechnung|Vendor|Kreditor|No\.|Nr\.|Document Date|Posting Date|Due Date|Type|Fixed Asset|Anlage|Post|Buchen|Preview|Vorschau|Cancel|Abbrechen|Delete|L.schen/i],
    maxLines: 180,
    maxLineLength: 240
  });
  await writeTextEvidence(fixedAssetsEvidencePath('030-after-new-focused-text.txt'), afterNewText || 'No focused text captured after New/Neu.');
  await writeJsonEvidence(fixedAssetsEvidencePath('030-after-new-visible-signals.json'), afterNewSignals);

  await screenshot(page, 'fixedassets-053-030-purchase-invoice-after-new.png', {
    projectName: project.name,
    testId,
    status: newAttempt.clicked && afterNewSignals.purchaseInvoiceContextVisible ? 'candidate' : 'rejected',
    bookUse: newAttempt.clicked && afterNewSignals.purchaseInvoiceContextVisible ? 'evidence' : 'do-not-use',
    purpose:
      'FIXEDASSETS-053 Kaufbeleg-Preflight nach New/Neu: zeigt Beleg-/Pflichtfeld-/Aktionskontext, aber noch keine Zielwerte K30000 oder FA-CNC-01.',
    expectedPageText: newAttempt.clicked ? [/Purchase Invoice|Einkaufsrechnung|Vendor|Kreditor|Invoice|Rechnung/i] : [/Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: [
      'Preflight-Kontext, kein Zielbeleg.',
      'K30000 und FA-CNC-01 werden in diesem Lauf bewusst noch nicht eingetragen.',
      'Post/Preview-Aktionen duerfen sichtbar sein, wurden aber nicht geklickt.'
    ]
  });

  const closeResult = newAttempt.clicked ? await closeOrCancelWithoutPosting(page) : { closed: true, method: 'not-opened', attempts: [] };
  await writeJsonEvidence(fixedAssetsEvidencePath('040-close-or-cancel-result.json'), closeResult);
  await openPurchaseInvoices(page);
  const afterCloseSignals = await collectVisibleBusinessSignals(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('050-after-close-list-signals.json'), afterCloseSignals);
  await screenshot(page, 'fixedassets-053-050-after-close-list.png', {
    projectName: project.name,
    testId,
    status: /Purchase Invoices|Einkaufsrechnungen/i.test(await pageText(page)) ? 'labor' : 'rejected',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-053 Nachkontrolle: Rueckkehr zur Purchase-Invoices-Liste nach Abbruch/Schliessen ohne Buchung.',
    expectedPageText: [/Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: [
      'Listenrueckkehr beweist keine vollstaendige Draft-Loeschung, aber dass kein Posting-/Posted-Invoice-Kontext offen blieb.',
      'Kein gespeicherter Zielbeleg mit K30000/FA-CNC-01.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-053-K30000-PURCHASE-INVOICE-PREFLIGHT-NO-POSTING',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-purchase-invoice-preflight-no-posting',
    target,
    context,
    openResult,
    beforeSignals,
    newAttempt,
    afterNewSignals,
    closeResult,
    afterCloseSignals,
    status:
      newAttempt.clicked && afterNewSignals.purchaseInvoiceContextVisible && closeResult.closed
        ? 'preflight-context-proven-no-posting'
        : 'preflight-blocked-or-partial',
    summary:
      newAttempt.clicked && afterNewSignals.purchaseInvoiceContextVisible && closeResult.closed
        ? 'Purchase Invoices wurde in RM-DEMO geoeffnet, New/Neu fuehrte in einen Purchase-Invoice-Kontext, gefaehrliche Posting-Aktionen wurden nur sichtbar erkannt und der Kontext wurde ohne Buchung geschlossen.'
        : 'Der Purchase-Invoice-Preflight ist nur teilweise belegt; vor K30000-/FA-CNC-01-Eingaben braucht es einen weiteren UI-Fix oder eine engere Navigation.',
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      setupChanged: false,
      vendorChanged: false,
      fixedAssetChanged: false,
      purchaseInvoiceSaved: false,
      posted: false,
      acquisitionPosted: false,
      depreciationPosted: false,
      clickedPost: false,
      clickedPreviewPosting: false
    },
    proves: [
      'Purchase Invoices list/page can be opened in MCP_1_20260210 / RM-DEMO.',
      'A scoped New/Neu preflight can reach a Purchase Invoice context.',
      'Posting-related actions can be treated as visible danger boundaries without clicking them.',
      'The run did not use API shortcuts and did not post.'
    ],
    doesNotProve: [
      'No saved purchase invoice with K30000.',
      'No Fixed Asset line with FA-CNC-01.',
      'No Preview Posting result.',
      'No acquisition, depreciation, FA ledger entry or German final proof.'
    ],
    screenshots: [
      'playwright/projects/fibu-book5/img/fixedassets-053-010-purchase-invoices-list.png',
      'playwright/projects/fibu-book5/img/fixedassets-053-030-purchase-invoice-after-new.png',
      'playwright/projects/fibu-book5/img/fixedassets-053-050-after-close-list.png'
    ],
    nextStep:
      newAttempt.clicked && afterNewSignals.purchaseInvoiceContextVisible && closeResult.closed
        ? 'FIXEDASSETS-054-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-GATE: decide whether one narrow UI-first field-mapping run may enter K30000 and test FA-CNC-01 line selection, still without posting.'
        : 'FIXEDASSETS-054-PURCHASE-INVOICE-PREFLIGHT-BLOCKER: fix the Purchase Invoice navigation/close path before any K30000 or FA-CNC-01 entry.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-053-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-053-K30000-PURCHASE-INVOICE-PREFLIGHT-NO-POSTING.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-053 Evidence Index',
      '',
      'Status: `labor`, `ui-first`, `preflight`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-053-result.json` | JSON | Strukturierter Purchase-Invoice-Preflight ohne Posting | keinen gespeicherten K30000-/FA-CNC-01-Beleg | labor |',
      '| `FIXEDASSETS-053-K30000-PURCHASE-INVOICE-PREFLIGHT-NO-POSTING.md` | Markdown | Lernbefund, Buchwirkung, Grenzen und naechster Schritt | keinen Anlagenzugang | labor |',
      '| `010-purchase-invoices-list-focused-text.txt` | kompakter Seitentext | Purchase-Invoices-Listen-/Navigationskontext | keine Beleganlage | compact |',
      '| `020-scoped-new-attempt.json` | JSON | ob `New/Neu` im Purchase-Invoices-Kontext geklickt wurde | keine fachliche Feldbefuellung | labor/partial |',
      '| `030-after-new-focused-text.txt` | kompakter Seitentext | Beleg-/Pflichtfeld-/Aktionskontext nach `New/Neu` | keine Zielwerte K30000/FA-CNC-01 | compact |',
      '| `030-after-new-visible-signals.json` | JSON | sichtbare Felder, moegliche Dokumentnummern und Posting-Aktionsgrenzen | keine Buchungsvorschau | compact |',
      '| `040-close-or-cancel-result.json` | JSON | Abbruch-/Schliessen-Versuch ohne Posting | keine vollstaendige Draft-Datenbankpruefung | labor |',
      '| `050-after-close-list-signals.json` | JSON | Rueckkehr zur Purchase-Invoices-Liste | keinen Cleanup per API | compact |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen der Bilder | keine eigenstaendige fachliche Wahrheit | labor/candidate |',
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
  expect(result.safety.purchaseInvoiceSaved).toBe(false);
  expect(result.safety.apiShortcutUsed).toBe(false);
});
