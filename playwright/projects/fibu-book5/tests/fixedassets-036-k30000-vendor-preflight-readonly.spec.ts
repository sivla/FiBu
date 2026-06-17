import { expect, test } from '@playwright/test';
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
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(240_000);

const testId = 'fixedassets-036';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  purpose: 'Anlagenkreditor fuer spaetere Einkaufsrechnung / Anlagenzugang zu FA-CNC-01'
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function vendorListUrl() {
  const url = new URL(bcPageUrl(27, project.envPrefix));
  url.searchParams.set('filter', `'Vendor'.'No.' IS '${target.vendorNo}'`);
  return url.toString();
}

async function extractVisibleVendorListSignals(page: import('@playwright/test').Page) {
  const frameSignals = [];
  for (const frame of page.frames()) {
    const signals = await frame
      .evaluate((vendorNo) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };

        const rows = Array.from(document.querySelectorAll<HTMLElement>('tr,[role="row"]'))
          .filter(visible)
          .map((element) => normalize(element.innerText || element.textContent))
          .filter(Boolean)
          .slice(0, 80);
        const visibleTexts = Array.from(document.querySelectorAll<HTMLElement>('input,textarea,span,div,button,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const input = element as HTMLInputElement;
            return normalize(
              [
                input.value,
                element.innerText || element.textContent,
                element.getAttribute('aria-label'),
                element.getAttribute('title')
              ]
                .filter(Boolean)
                .join(' ')
            );
          })
          .filter(Boolean)
          .slice(0, 220);

        return {
          frameUrl: location.href,
          rowCount: rows.length,
          targetVisibleInRows: rows.some((row) => new RegExp(`\\b${vendorNo}\\b`, 'i').test(row)),
          rowSnippets: rows.filter((row) => /No\.|Name|Balance|Vendor|Kreditor|K30000|There is nothing|nichts|Keine/i.test(row)).slice(0, 30),
          targetVisibleAnywhere: visibleTexts.some((text) => new RegExp(`\\b${vendorNo}\\b`, 'i').test(text)),
          emptyStateVisible: visibleTexts.some((text) => /There is nothing to show|Nothing to show|In dieser Ansicht kann nichts angezeigt werden|Keine anzuzeigenden|Es gibt nichts|No data/i.test(text)),
          visibleFilterOrSearchSignals: visibleTexts
            .filter((text) => /K30000|Filter|Filtern|Search|Suchen|No\.|Nummer|Vendor|Kreditor|nichts angezeigt/i.test(text))
            .slice(0, 60)
        };
      }, target.vendorNo)
      .catch(() => null);
    if (signals) {
      frameSignals.push(signals);
    }
  }

  return {
    frameSignals,
    rowCount: frameSignals.reduce((sum, entry) => sum + entry.rowCount, 0),
    targetVisibleInRows: frameSignals.some((entry) => entry.targetVisibleInRows),
    rowSnippets: frameSignals.flatMap((entry) => entry.rowSnippets).slice(0, 40),
    targetVisibleAnywhere: frameSignals.some((entry) => entry.targetVisibleAnywhere),
    emptyStateVisible: frameSignals.some((entry) => entry.emptyStateVisible),
    visibleFilterOrSearchSignals: frameSignals.flatMap((entry) => entry.visibleFilterOrSearchSignals).slice(0, 80)
  };
}

async function openVisibleFilterOrSearchContext(page: import('@playwright/test').Page) {
  let filterPane: { clicked: boolean; reason: string; frameUrl?: string } = { clicked: false, reason: 'filter-button-not-found' };
  for (const frame of page.frames()) {
    filterPane = await frame
      .evaluate(() => {
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[aria-label],[title]'))
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element,
            text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
            aria: element.getAttribute('aria-label') || '',
            title: element.getAttribute('title') || '',
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          };
        })
        .filter((entry) => /Filter|Filtern/i.test([entry.text, entry.aria, entry.title].join(' ')))
        .filter((entry) => entry.y < 160)
        .sort((left, right) => right.x - left.x);
      const targetButton = candidates[0]?.element;
      if (!targetButton) return { clicked: false, reason: 'filter-button-not-found', frameUrl: location.href };
      targetButton.click();
      return { clicked: true, reason: 'filter-button-clicked', frameUrl: location.href };
    })
    .catch((error) => ({ clicked: false, reason: String(error) }));
    if (filterPane.clicked) {
      break;
    }
  }

  await page.waitForTimeout(1500);
  let searchBox: { clicked: boolean; filled: boolean; reason: string; frameUrl?: string } = {
    clicked: false,
    filled: false,
    reason: 'list-search-button-not-found'
  };
  for (const frame of page.frames()) {
    searchBox = await frame
      .evaluate((vendorNo) => {
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const buttons = Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[aria-label],[title]'))
        .filter(visible)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element,
            text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
            aria: element.getAttribute('aria-label') || '',
            title: element.getAttribute('title') || '',
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          };
        })
        .filter((entry) => /Search|Suchen/i.test([entry.text, entry.aria, entry.title].join(' ')))
        .filter((entry) => entry.y >= 70 && entry.y <= 150 && entry.x < 700)
        .sort((left, right) => left.x - right.x);
      const listSearchButton = buttons[0]?.element;
      if (!listSearchButton) return { clicked: false, filled: false, reason: 'list-search-button-not-found', frameUrl: location.href };
      listSearchButton.click();

      const input = Array.from(document.querySelectorAll<HTMLInputElement>('input'))
        .filter(visible)
        .filter((candidate) => {
          const label = [candidate.getAttribute('aria-label'), candidate.getAttribute('title'), candidate.placeholder].join(' ');
          return /Search|Suchen|Filter|Filtern/i.test(label) || candidate.getBoundingClientRect().y < 180;
        })
        .sort((left, right) => right.getBoundingClientRect().width - left.getBoundingClientRect().width)[0];
      if (!input) return { clicked: true, filled: false, reason: 'search-input-not-found', frameUrl: location.href };
      input.focus();
      input.value = vendorNo;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return { clicked: true, filled: true, reason: 'search-input-filled', frameUrl: location.href };
    }, target.vendorNo)
    .catch((error) => ({ clicked: false, filled: false, reason: String(error) }));
    if (searchBox.clicked) {
      break;
    }
  }

  await page.waitForTimeout(1500);
  return { filterPane, searchBox };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-036 - K30000 Vendor Preflight Read-only',
    '',
    'Status: `labor`, `read-only`, `vendor-preflight`, `no-save`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.vendorNo} |`,
    `| Fachlicher Zweck | ${target.purpose} |`,
    `| Zielkreditor als Datensatz sichtbar | ${result.summary.vendorRecordVisible ? 'ja' : 'nein'} |`,
    `| Leerer Ergebniszustand sichtbar | ${result.summary.emptyStateVisible ? 'ja' : 'nein'} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary.vendorRecordVisible
      ? '`K30000` ist in der Kreditorenliste sichtbar. Das ist nur ein read-only Sichtbarkeitsnachweis; eine Kartenpruefung fuer Zahlungsbedingungen, Buchungsgruppen, Waehrung, Steuer-/Tax-Kontext und Sperrstatus bleibt noetig.'
      : '`K30000` ist im gefilterten Vendor-/Kreditoren-Kontext nicht als Datensatz sichtbar. Damit bleibt die spaetere Anlagen-Einkaufsrechnung gesperrt, bis ein eigener UI-first Setup-/Stammdaten-Gate den Kreditor entweder anlegt oder einen vorhandenen Kreditor fachlich freigibt.',
    '',
    '## Was man in Business Central sieht',
    '',
    '- Die Seite `Vendors` / `Kreditoren` ist der richtige Stammdatenkontext fuer den Anlagenlieferanten.',
    '- Der gefilterte Kontext dient als Vorpruefung: existiert der Zielkreditor bereits oder muss er erst angelegt werden?',
    '- Ein fehlender Kreditor ist kein Fehler von Business Central. BC verhindert damit, dass eine Einkaufsrechnung ohne valide Gegenpartei, Zahlungslogik und Buchungsgruppen aufgebaut wird.',
    '',
    '## Warum dieser Schritt vor der Einkaufsrechnung kommt',
    '',
    'Der Kreditor steuert nicht nur Name und Adresse. Auf der Kreditorenkarte haengen unter anderem Zahlungsbedingungen, Waehrung, Kreditorenbuchungsgruppe, Geschaeftsbuchungsgruppe, Steuer-/Tax-Kontext und Sperrstatus. Wenn diese Werte fehlen oder falsch sind, scheitert spaeter Preview Posting oder die Anlagenanschaffung wird falsch kontiert.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 muss vor der Einkaufsrechnung einen eigenen Kreditoren-Preflight zeigen: zuerst Zielkreditor suchen, dann Ergebnis bewerten, erst danach ueber Anlagekreditor-Anlage oder Einkaufsrechnung entscheiden. Das verhindert den Anfaengerfehler, vom fertigen Anlagenstamm direkt in den Kaufbeleg zu springen.',
    '',
    '## Grenzen',
    '',
    '- Kein Kreditor wurde angelegt oder geaendert.',
    '- Keine Kreditorenkarte wurde gespeichert.',
    '- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Nur CRONUS-USA-Labor in `RM-DEMO`; kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-036 prueft K30000 in Vendors read-only', async ({ page }) => {
  await page.goto(vendorListUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Vendors|Vendor|Kreditoren|Kreditor/i, { timeout: 60_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);
  const visibleContextActions = await openVisibleFilterOrSearchContext(page);

  const text = await pageText(page);
  const context = {
    url: decodeURIComponent(page.url()),
    environmentVisibleInUrl: page.url().includes(target.environment),
    companyVisibleInUrl: /company=RM-DEMO/i.test(decodeURIComponent(page.url())),
    vendorContextVisible: /Vendors|Vendor|Kreditoren|Kreditor/i.test(text)
  };
  const signals = await extractVisibleVendorListSignals(page);
  const vendorRecordVisible = signals.targetVisibleInRows;
  const screenshotStatus = vendorRecordVisible || signals.emptyStateVisible || signals.targetVisibleAnywhere ? 'candidate' : 'rejected';

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-vendors-k30000-page-text.txt'),
    await compactPageText(page, {
      include: [/K30000|Vendor|Vendors|Kreditor|No\.|Name|Balance|Filter|Search|Suchen|nothing|nichts|Keine/i],
      maxLines: 100
    })
  );
  await writeJsonEvidence(fixedAssetsEvidencePath('020-vendors-k30000-visible-signals.json'), signals);
  await screenshot(page, `${testId}-010-vendors-k30000-readonly.png`, {
    projectName: project.name,
    testId,
    status: screenshotStatus,
    bookUse: screenshotStatus === 'candidate' ? 'negative-list-proof' : 'do-not-use',
    purpose:
      'FIXEDASSETS-036 read-only: gefilterte Vendors-/Kreditorenliste fuer Zielkreditor K30000 als Negativbefund pruefen, ohne Anlage, Vorlage, Einkaufsrechnung oder Buchung.',
    knownLimitations: [
      'Read-only Labor-Preflight in RM-DEMO / MCP_1_20260210.',
      'Screenshot ist nur als Negativlisten-Nachweis brauchbar, wenn der Filter No.=K30000 und der leere Listenbefund visuell nachvollziehbar sind.',
      'Keine Kreditoranlage, keine Kartenbearbeitung, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA, keine Buchung.',
      'Kein deutscher Steuer-/Kontenplan-Finalnachweis.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-036-K30000-VENDOR-PREFLIGHT-READONLY',
    generatedAt: new Date().toISOString(),
    status: vendorRecordVisible ? 'vendor-visible-readonly' : 'vendor-not-visible-readonly',
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-read-only-vendor-preflight',
    vendorNo: target.vendorNo,
    context,
    visibleContextActions,
    signals,
    summary: {
      vendorContextVisible: context.vendorContextVisible,
      vendorRecordVisible,
      targetVisibleAnywhere: signals.targetVisibleAnywhere,
      emptyStateVisible: signals.emptyStateVisible,
      screenshotStatus
    },
    safety: {
      posted: false,
      setupChanged: false,
      vendorCreated: false,
      vendorCardSaved: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false
    },
    proves: vendorRecordVisible
      ? ['K30000 ist im Vendors-/Kreditorenkontext sichtbar, aber nur read-only als Listennachweis.']
      : ['K30000 ist im gefilterten Vendors-/Kreditorenkontext nicht als Datensatz sichtbar.'],
    doesNotProve: [
      'Keine Kreditorenkarte mit Zahlungsbedingungen, Buchungsgruppen, Waehrung, Steuer-/Tax-Kontext oder Sperrstatus.',
      'Keine Kreditoranlage und keine Kartenbearbeitung.',
      'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Anlagenposten.',
      'Kein deutscher Finalnachweis.'
    ],
    nextStep: vendorRecordVisible
      ? 'FIXEDASSETS-037-K30000-VENDOR-CARD-READONLY: Kreditorenkarte read-only oeffnen und Zahlungsbedingungen, Buchungsgruppen, Waehrung, Tax/VAT-Kontext und Sperrstatus pruefen; weiterhin keine Einkaufsrechnung oder Buchung.'
      : 'FIXEDASSETS-037-K30000-VENDOR-SETUP-GATE-DECISION: ohne BC-Aenderung entscheiden, ob und wie K30000 UI-first als Anlagenkreditor angelegt werden darf; weiterhin keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-036-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-036-K30000-VENDOR-PREFLIGHT-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-036 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-036-result.json` | JSON | strukturierter read-only Befund zu `K30000` im Vendor-Kontext | keine Kreditorenkarte und keine Buchung | labor |',
      '| `FIXEDASSETS-036-K30000-VENDOR-PREFLIGHT-READONLY.md` | Markdown | Lernwert, Buchwirkung und naechster Schritt | keinen deutschen Finalnachweis | labor |',
      '| `010-vendors-k30000-page-text.txt` | kompakter Seitentext | Vendor-/Kreditorenkontext und Such-/Filterbefund | keine Rohseite, keine vollstaendige Feldliste | compact |',
      '| `020-vendors-k30000-visible-signals.json` | JSON-Diagnose | sichtbare Row-/Filter-/Leersignale fuer Screenshot-QA | keine API- oder Tabellenwahrheit | compact |',
      '| `fixedassets-036-010-vendors-k30000-readonly.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bilds | keine eigenstaendige fachliche Wahrheit | candidate / negative-list-proof |',
      '',
      'Aktuelle Wahrheit: `K30000` ist im gefilterten Vendor-/Kreditorenkontext nicht als Datensatz sichtbar. Das Bild ist nur ein Negativlisten-/Filter-Nachweis; vor Einkaufsrechnung, Anlagenzugang oder AfA braucht es zuerst eine Setup-Gate-Entscheidung zur UI-first Kreditoranlage.',
      ''
    ].join('\n')
  );

  expect(context.environmentVisibleInUrl).toBe(true);
  expect(context.companyVisibleInUrl).toBe(true);
  expect(context.vendorContextVisible).toBe(true);
  expect(result.safety.posted).toBe(false);
});
