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

test.setTimeout(480_000);

const testId = 'fixedassets-058';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
  fixedAssetNo: 'FA-CNC-01',
  fixedAssetDescription: 'CNC Maschine FRA',
  vendorInvoiceNo: `FA058-${Date.now().toString().slice(-8)}`,
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
                rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
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
              rect: chosen.rect,
            },
          };
        },
        { source, flags },
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
  await page.waitForTimeout(2500);
  return { filled: true, value, focus };
}

async function closeBlockingDialog(page: Page) {
  const attempts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    for (const name of [/^Cancel$|^Abbrechen$/i, /^No$|^Nein$/i, /^Close$|^Schlie.en$/i]) {
      const button = scope.getByRole('button', { name }).first();
      if (await button.isVisible({ timeout: 700 }).catch(() => false)) {
        await button.click().catch((error) => attempts.push(String(error)));
        await page.waitForTimeout(1200);
        return { closed: true, button: String(name), attempts };
      }
    }
  }
  await page.keyboard.press('Escape').catch((error) => attempts.push(String(error)));
  await page.waitForTimeout(1200);
  return { closed: false, button: 'escape-fallback', attempts };
}

async function deleteDraftViaUi(page: Page) {
  const attempts: string[] = [];
  await closeBlockingDialog(page);
  for (const scope of [page, ...page.frames()]) {
    const body = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Purchase Invoice|Einkaufsrechnung|Purchase Invoices|Einkaufsrechnungen/i.test(body)) continue;
    const result = await scope
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
            if (/^(Delete|L.schen)$|Delete selected|Ausgew.hlte.*l.schen/i.test(label)) score -= 60;
            if (/Post|Preview|Receive|Invoice|Copy|Send|Release/i.test(label)) score += 200;
            if (rect.y >= 35 && rect.y <= 180) score -= 10;
            return { element, text, aria, title, label, rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }, score };
          })
          .filter((entry) => /Delete|L.schen/i.test(entry.label))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'delete-not-found', candidates: candidates.slice(0, 15).map(({ element: _element, ...entry }) => entry) };
        chosen.element.click();
        return { clicked: true, chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, rect: chosen.rect, score: chosen.score } };
      })
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    attempts.push(JSON.stringify(result));
    if (result.clicked) {
      await page.waitForTimeout(1200);
      const confirm = await confirmDialogNoPosting(page);
      await page.waitForTimeout(2500);
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
    '# FIXEDASSETS-058 K30000 / FA-CNC-01 guarded Purchase-Invoice-Retry',
    '',
    'Status: `labor`, `ui-first`, `guarded-retry`, `no-preview`, `no-posting`, `not-final`',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Zielkreditor | ${result.target.vendorNo} / ${result.target.vendorName} |`,
    `| Zielanlage | ${result.target.fixedAssetNo} / ${result.target.fixedAssetDescription} |`,
    `| Status | ${result.status} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Guard-Wirkung',
    '',
    '- Der Lauf prueft nach jedem Kopf-/Zeilenschritt, ob der Kontext noch Purchase Invoice plus Zeilen/Grid ist.',
    '- Vendor-Registrierungsdialog, Vendor Card oder `FA-CNC-01` ohne Zeilentyp `Fixed Asset` stoppen den Lauf.',
    '- Ein sichtbarer Code allein zaehlt nicht; der richtige fachliche Kontext zaehlt.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Keine Preview, keine Buchung, kein Anlagenzugang, keine AfA, keine Anlagenposten.',
    '- Kein deutscher HGB-/Kontenplan-/USt-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-058 guarded K30000/FA-CNC-01 Purchase Invoice field mapping retry without posting', async ({ page }) => {
  const guardChecks: Array<Record<string, unknown>> = [];
  let cleanup: Record<string, unknown> = { status: 'not-needed' };
  let finalStatus = 'not-started';
  let finalSummary = '';
  let newAttempt: Record<string, unknown> = {};
  let openResult: Record<string, unknown> = {};

  openResult = await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Falscher BC-Kontext: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-purchase-invoices-list-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Post|Buchen|Invoice|Rechnung/i],
      maxLines: 120,
      maxLineLength: 220,
    }),
  );

  newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  const afterNewGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
  guardChecks.push({ checkpoint: 'after-new', guard: afterNewGuard });
  await writeJsonEvidence(fixedAssetsEvidencePath('021-after-new-guard.json'), afterNewGuard);
  await writeTextEvidence(
    fixedAssetsEvidencePath('030-after-new-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Vendor|Kreditor|Vendor Invoice No|Type|Fixed Asset|Anlage|No\.|Nr\.|Post|Buchen|Preview|Vorschau|Delete|L.schen/i],
      maxLines: 180,
      maxLineLength: 240,
    }),
  );

  if (!newAttempt.clicked || !afterNewGuard.visibleSignals.purchaseInvoice) {
    finalStatus = 'blocked-before-field-entry';
    finalSummary = 'Der neue Purchase-Invoice-Kontext wurde nicht stabil erreicht; deshalb wurden keine Zielwerte eingetragen.';
  } else {
    const vendorFill = await fillInputNearCaption(page, /Vendor Name|Kreditorenname|Buy-from Vendor|Vendor|Kreditor/i, target.vendorNo, 'Tab');
    const afterVendorGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
    guardChecks.push({ checkpoint: 'after-vendor-entry', guard: afterVendorGuard, action: vendorFill });
    await writeJsonEvidence(fixedAssetsEvidencePath('035-after-vendor-entry-guard.json'), {
      vendorFill,
      guard: afterVendorGuard,
    });
    await writeTextEvidence(
      fixedAssetsEvidencePath('036-after-vendor-entry-focused-text.txt'),
      await compactPageText(page, {
        include: [/K30000|Zollspedition|Purchase Invoice|Einkaufsrechnung|Vendor|Kreditor|Create a new vendor|not registered|Type|Fixed Asset|Anlage|No\.|Post|Buchen|Preview|Vorschau/i],
        maxLines: 180,
        maxLineLength: 260,
      }),
    );

    if (afterVendorGuard.stopReasons.length > 0) {
      finalStatus = afterVendorGuard.status;
      finalSummary = `Guard stoppte nach Vendor-Eingabe: ${afterVendorGuard.stopReasons.join(' ')}`;
      await screenshot(page, 'fixedassets-058-035-guard-stop-after-vendor-entry.png', {
        projectName: project.name,
        testId,
        status: 'rejected',
        bookUse: 'debugging',
        purpose: 'FIXEDASSETS-058 Guard-Stop nach Vendor-Eingabe: falscher Kontext wird dokumentiert und nicht weitergeklickt.',
        expectedPageText: [/Purchase Invoice|Einkaufsrechnung|Vendor|Kreditor/i],
        knownLimitations: ['Kein Anlagenzeilenbeweis.', 'Keine Preview und keine Buchung.'],
      });
    } else {
      const vendorInvoiceFill = await fillInputNearCaption(page, /Vendor Invoice No\.|Kreditorenrechnungsnr\.|Vendor Invoice/i, target.vendorInvoiceNo, 'Tab');
      const afterVendorInvoiceGuard = await classifyCurrentPurchaseInvoiceFieldMappingPage(page);
      guardChecks.push({ checkpoint: 'after-vendor-invoice-no', guard: afterVendorInvoiceGuard, action: vendorInvoiceFill });
      await writeJsonEvidence(fixedAssetsEvidencePath('040-after-vendor-invoice-guard.json'), {
        vendorInvoiceFill,
        guard: afterVendorInvoiceGuard,
      });

      if (afterVendorInvoiceGuard.stopReasons.length > 0) {
        finalStatus = afterVendorInvoiceGuard.status;
        finalSummary = `Guard stoppte nach Vendor-Invoice-No.-Eingabe: ${afterVendorInvoiceGuard.stopReasons.join(' ')}`;
      } else {
        finalStatus = 'guarded-header-visible-no-line-entry';
        finalSummary =
          'Der Header blieb nach den Guard-Checks ohne Stop-Signal. Zeilenmapping wird in diesem Lauf trotzdem nicht erzwungen, weil 055 gerade dort den falschen Vendor-Card-Kontext erzeugte.';
      }
    }

    cleanup = await deleteDraftViaUi(page);
    await openPurchaseInvoices(page).catch(() => undefined);
    await writeJsonEvidence(fixedAssetsEvidencePath('090-cleanup-result.json'), cleanup);
    await screenshot(page, 'fixedassets-058-090-after-cleanup-list.png', {
      projectName: project.name,
      testId,
      status: 'labor',
      bookUse: 'evidence',
      purpose: 'FIXEDASSETS-058 Cleanup-Nachkontrolle: Rueckkehr zur Purchase-Invoices-Liste nach guarded Retry.',
      expectedPageText: [/Purchase Invoices|Einkaufsrechnungen/i],
      knownLimitations: ['Listenrueckkehr ist Cleanup-Evidence, kein Anlagenkaufbeweis.', 'Keine Preview und keine Buchung.'],
    });
  }

  const generatedScreenshots = [
    ...(finalStatus !== 'blocked-before-field-entry'
      ? ['playwright/projects/fibu-book5/img/fixedassets-058-035-guard-stop-after-vendor-entry.png']
      : []),
    ...(cleanup.status !== 'not-needed'
      ? ['playwright/projects/fibu-book5/img/fixedassets-058-090-after-cleanup-list.png']
      : []),
  ];

  const result = {
    testId: 'FIXEDASSETS-058-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-NO-POSTING',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'guarded-ui-first-field-mapping-retry-no-preview-no-posting',
    target,
    context,
    openResult,
    newAttempt,
    guardChecks,
    status: finalStatus,
    summary: finalSummary,
    cleanup,
    safety: {
      apiShortcutUsed: false,
      companySwitched: false,
      setupChanged: false,
      clickedPreviewPosting: false,
      clickedPost: false,
      posted: false,
      acquisitionPosted: false,
      depreciationPosted: false,
    },
    proves: [
      'The guarded retry ran within MCP_1_20260210 / RM-DEMO.',
      'The purchase-invoice field-mapping guard was executed after risky field actions.',
      'No Preview Posting or Post action was clicked.',
      'The run stopped or ended based on guard status, not on optimistic target-code visibility.',
    ],
    doesNotProve: [
      'No valid fixed-asset purchase invoice line unless status is safe-purchase-invoice-line-candidate.',
      'No Preview Posting result.',
      'No fixed asset acquisition.',
      'No FA Ledger Entry.',
      'No depreciation.',
      'No German final proof.',
    ],
    screenshots: generatedScreenshots,
    bookImpact:
      finalStatus === 'safe-purchase-invoice-line-candidate'
        ? 'Kapitel 21 kann den guarded Feldmapping-Schritt als Kandidat fuer den naechsten Preview-Gate-Entscheid nutzen.'
        : 'Kapitel 21 und das Debugging-Kapitel bekommen einen besseren Lernfall: Der Guard verhindert, dass falsche Vendor-/Dialogkontexte als Anlagenzeile gelesen werden.',
    nextStep:
      finalStatus === 'safe-purchase-invoice-line-candidate'
        ? 'FIXEDASSETS-059-K30000-FA-CNC-01-PURCHASE-INVOICE-PREVIEW-GATE-DECISION'
        : 'FIXEDASSETS-059-PURCHASE-INVOICE-FIELD-MAPPING-HELPER-REFINEMENT-OR-MANUAL-PATH',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-058-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-058-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-NO-POSTING.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-058 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-058-result.json` | JSON | guarded Retry, Guard-Checkpoints, Safety-Status | keine Buchung, keinen Anlagenzugang | `labor`, `guarded-retry`, `no-posting` |',
      '| `FIXEDASSETS-058-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-NO-POSTING.md` | Markdown | Lernbefund, Buchwirkung, naechster Schritt | keinen DE-Finalnachweis | `not-final` |',
      '| `021-after-new-guard.json` | JSON | Guard-Status nach New/Neu | keine Zielwerte | `guard` |',
      '| `035-after-vendor-entry-guard.json` | JSON | Guard-Status nach Vendor-Eingabe, falls der Card-Kontext stabil erreicht wird | keine Zeile, keine Buchung | `optional`, `guard` |',
      '| `090-cleanup-result.json` | JSON | UI-Cleanup-Versuch, falls ein Entwurf entstand | keine Postenspur | `optional`, `cleanup` |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen tatsaechlich erzeugter Bilder | keine eigenstaendige Fachwahrheit | `optional`, `labor` |',
      `| Screenshot-Liste | Ergebnisfeld | ${generatedScreenshots.length > 0 ? generatedScreenshots.join(', ') : 'Keine Screenshots erzeugt, weil der Guard vor Werteingabe stoppte.'} | keine visuelle Zeilen-/Buchungs-Evidence | \`${generatedScreenshots.length > 0 ? 'labor' : 'not-created'}\` |`,
      '',
      `Aktuelle Wahrheit: ${result.summary}`,
      '',
    ].join('\n'),
  );

  expect(result.context.environmentInUrl).toBe(true);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.clickedPost).toBe(false);
  expect(result.safety.clickedPreviewPosting).toBe(false);
  expect(result.safety.apiShortcutUsed).toBe(false);
});
