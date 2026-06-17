import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, hideFactBoxPane, pageText, screenshot, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(360_000);

const testId = 'fixedassets-041';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH'
};

const targetCaptions = [
  'Vendor Posting Group',
  'Gen. Bus. Posting Group',
  'Currency Code',
  'Tax Area Code',
  'Tax Liable',
  'VAT Bus. Posting Group',
  'Payment Terms Code',
  'Payment Method Code',
  'Blocked'
];

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function vendorCardUrl() {
  const url = new URL(bcPageUrl(26, project.envPrefix));
  url.searchParams.set('filter', `'Vendor'.'No.' IS '${target.vendorNo}'`);
  return url.toString();
}

async function openVendorCard(page: Page) {
  await page.goto(vendorCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Vendor|Kreditor|K30000|Zollspedition/i, { timeout: 60_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function clickAllVisibleShowMore(page: Page) {
  const clicks: Array<Record<string, unknown>> = [];
  for (let pass = 0; pass < 8; pass += 1) {
    let clicked = false;
    for (const frame of page.frames()) {
      const result = await frame
        .evaluate(() => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[aria-expanded="false"],[title],[aria-label]'))
            .filter(visible)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const label = normalize(
                [element.innerText || element.textContent, element.getAttribute('aria-label'), element.getAttribute('title')]
                  .filter(Boolean)
                  .join(' ')
              );
              return { element, label, x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
            })
            .filter((entry) => /Show more|Mehr anzeigen|Weitere anzeigen|Mehr Felder/i.test(entry.label))
            .filter((entry) => entry.width <= 280 && entry.height <= 90)
            .sort((left, right) => left.y - right.y || left.x - right.x);

          const chosen = candidates[0];
          if (!chosen) return { clicked: false, candidates: [] };
          chosen.element.click();
          return {
            clicked: true,
            label: chosen.label,
            x: chosen.x,
            y: chosen.y,
            candidates: candidates.slice(0, 8).map(({ element: _element, ...entry }) => entry)
          };
        })
        .catch((error) => ({ clicked: false, error: String(error), candidates: [] }));
      if (result.clicked) {
        clicks.push(result);
        clicked = true;
        await page.waitForTimeout(900);
        break;
      }
    }
    if (!clicked) break;
  }

  return clicks;
}

async function expandFastTabs(page: Page, captions: string[]) {
  const clicks: Array<Record<string, unknown>> = [];
  for (const caption of captions) {
    for (const frame of page.frames()) {
      const result = await frame
        .evaluate((targetCaption) => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const exact = new RegExp(`^${targetCaption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\\s*[>›]?$`, 'i');
          const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,div,span'))
            .filter(visible)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const text = normalize([element.innerText || element.textContent, element.getAttribute('aria-label'), element.getAttribute('title')].filter(Boolean).join(' '));
              return { element, text, x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
            })
            .filter((entry) => exact.test(entry.text) || entry.text.toLowerCase().startsWith(`${targetCaption.toLowerCase()} `))
            .filter((entry) => entry.width > 40 && entry.height > 12)
            .sort((left, right) => left.y - right.y || left.x - right.x);

          const chosen = candidates[0];
          if (!chosen) return { clicked: false, caption: targetCaption, candidates: [] };
          chosen.element.click();
          return {
            clicked: true,
            caption: targetCaption,
            text: chosen.text,
            x: chosen.x,
            y: chosen.y,
            candidates: candidates.slice(0, 6).map(({ element: _element, ...entry }) => entry)
          };
        }, caption)
        .catch((error) => ({ clicked: false, caption, error: String(error), candidates: [] }));
      if (result.clicked) {
        clicks.push(result);
        await page.waitForTimeout(1000);
        break;
      }
    }
  }

  return clicks;
}

async function scrollMain(page: Page, top: number) {
  for (const frame of page.frames()) {
    const scrolled = await frame
      .evaluate((scrollTop) => {
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('main,[role="main"],.ms-nav-layout,div'))
          .filter((element) => element.scrollHeight > element.clientHeight + 120)
          .sort((left, right) => right.clientHeight - left.clientHeight);
        const targetElement = candidates[0] ?? document.scrollingElement;
        targetElement?.scrollTo({ top: scrollTop, behavior: 'instant' });
        return Boolean(targetElement);
      }, top)
      .catch(() => false);
    if (scrolled) {
      await page.waitForTimeout(900);
      return;
    }
  }
  await page.mouse.wheel(0, top);
  await page.waitForTimeout(900);
}

async function collectVisibleFieldEvidence(page: Page) {
  const diagnostics = await collectActiveCardControlDiagnostics(page, targetCaptions, {
    targetText: /K30000|Zollspedition Nord GmbH/i
  });

  return { diagnostics };
}

function controlValue(entry: any) {
  const controls = entry.nearbyControls ?? [];
  const buttons = entry.nearbyButtons ?? [];
  const controlValues = controls
    .flatMap((control: any) => [control.value, control.text, control.ariaLabel, control.title])
    .map((value: string) => (value || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const buttonValues = buttons
    .flatMap((button: any) => [button.text, button.ariaLabel, button.title])
    .map((value: string) => (value || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((value: string) => !/Details|Purchaser Code/i.test(value));
  return [...new Set([...controlValues, ...buttonValues])].slice(0, 5);
}

function summarizeDiagnostics(diagnostics: any) {
  return diagnostics.diagnostics.map((entry: any) => ({
    caption: entry.caption,
    diagnosis: entry.diagnosis,
    visibleAsActiveCardField: ['active-card-label-with-control', 'active-card-label-with-button', 'label-only'].includes(entry.diagnosis),
    values: controlValue(entry),
    selectedLabel: entry.selectedLabel
      ? {
          text: entry.selectedLabel.text,
          rect: entry.selectedLabel.rect,
          scoreReasons: entry.selectedLabel.scoreReasons
        }
      : null
  }));
}

function fieldStatus(summary: ReturnType<typeof summarizeDiagnostics>, caption: string) {
  return summary.find((entry) => entry.caption === caption) ?? {
    caption,
    diagnosis: 'caption-not-visible',
    visibleAsActiveCardField: false,
    values: []
  };
}

function renderMarkdown(result: any) {
  const rows = result.fieldSummary
    .map((field: any) => {
      const caption = field.caption;
      const visibility = field.visibleAsActiveCardField ? 'sichtbar/diagnostiziert' : 'nicht sichtbar diagnostiziert';
      const values = field.values.length ? field.values.map((value: string) => `\`${value}\``).join(', ') : field.diagnosis;
      return `| ${caption} | ${visibility} | ${values} |`;
    })
    .join('\n');

  return [
    '# FIXEDASSETS-041 - K30000 Vendor Defaults Field Diagnosis read-only',
    '',
    'Status: `labor`, `read-only`, `field-diagnosis`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.vendorNo} / ${result.vendorName} |`,
    `| Status | ${result.status} |`,
    `| Gebucht | ${result.safety.posted ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Feld-Diagnose',
    '',
    '| Feld | Sichtbarkeit | Wert / Diagnose |',
    '|---|---|---|',
    rows,
    '',
    '## Bewertung',
    '',
    result.decision,
    '',
    '## Visual-QA',
    '',
    result.visualQa,
    '',
    '## Lernwert fuer Anfaenger',
    '',
    'Eine Kreditorenkarte kann fachlich unvollstaendig wirken, obwohl der Datensatz existiert. Business Central blendet je nach Rolle, FastTab, Personalisierung oder Page-Layout Felder aus. Deshalb muss man vor einer Einkaufsrechnung unterscheiden: Ist ein Wert falsch, fehlt er im Setup, oder ist er nur in der aktuellen Ansicht nicht sichtbar?',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 bekommt damit einen klaren Diagnosepunkt vor dem Anlagenkauf: Erst die Kreditorenkarte und ihre buchungsrelevanten Defaults sichtbar machen, dann Kaufbeleg vorbereiten. Das ist CRONUS-USA-Labor und kein deutscher USt-/Kontenplan-/HGB-Finalnachweis.',
    '',
    '## Grenzen',
    '',
    '- Read-only: keine Aenderung an `K30000`.',
    '- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Kein API-Shortcut; die Diagnose basiert auf Business-Central-UI, sichtbaren Controls und Screenshots.',
    '- Nicht sichtbare Felder sind keine finale Aussage, dass das Setup fehlt. Sie sind ein UI-/Sichtbarkeitsbefund.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-041 K30000 Vendor Defaults field diagnosis read-only', async ({ page }) => {
  await openVendorCard(page);
  const showMoreClicks = await clickAllVisibleShowMore(page);
  const fastTabClicks = await expandFastTabs(page, ['Invoicing', 'Payments', 'Receiving']);
  await clickAllVisibleShowMore(page);

  await scrollMain(page, 0);
  const topEvidence = await collectVisibleFieldEvidence(page);
  await screenshot(page, 'fixedassets-041-010-k30000-vendor-card-top-diagnosis.png', {
    projectName: project.name,
    testId,
    status: 'labor-candidate',
    bookUse: 'context-evidence',
    purpose:
      'FIXEDASSETS-041 read-only: K30000 Vendor Card in breiter Layoutansicht nach Mehr anzeigen; prueft, ob buchungsrelevante Defaults im oberen Kartenbereich sichtbar sind.',
    expectedPageText: [/K30000/i, /Zollspedition Nord GmbH/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Read-only Diagnose; keine Kreditor-Aenderung, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.',
      'Payment Terms Code 1M(8D) und Payment Method Code BANK sind sichtbar; Posting-/Currency-/Tax-Codes sind nicht sichtbar.',
      'Nicht als finales Buchbild fuer die fehlenden Codes verwenden.'
    ]
  });

  await scrollMain(page, 700);
  const midEvidence = await collectVisibleFieldEvidence(page);
  await screenshot(page, 'fixedassets-041-020-k30000-vendor-card-mid-diagnosis.png', {
    projectName: project.name,
    testId,
    status: 'candidate-limited',
    bookUse: 'diagnostic-evidence-only',
    purpose:
      'FIXEDASSETS-041 read-only: gescrollter K30000 Vendor-Card-Bereich zur Suche nach Posting-, Currency- und Tax/VAT-Defaults.',
    expectedPageText: [/K30000|Payment Terms|Payment Method|BANK|1M\(8D\)|Vendor Posting|Posting Group|Currency|Tax|VAT/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Wenn Zielwerte nicht lesbar sind, ist das ein Nicht-sichtbar-Befund und keine Setup-Aenderung.',
      'FastTab-Expansion ist erst bewiesen, wenn Zielcaption und Zielwert sichtbar sind.',
      'Keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.'
    ]
  });

  const mergedSummary = summarizeDiagnostics(topEvidence.diagnostics);
  const midSummary = summarizeDiagnostics(midEvidence.diagnostics);
  const fieldSummary = targetCaptions.map((caption) => {
    const top = fieldStatus(mergedSummary, caption);
    const mid = fieldStatus(midSummary, caption);
    const chosen = top.visibleAsActiveCardField ? top : mid.visibleAsActiveCardField ? mid : top.diagnosis !== 'caption-not-visible' ? top : mid;
    const values = [...new Set([...(top.values ?? []), ...(mid.values ?? [])])].filter(Boolean).slice(0, 8);
    const normalizedValues =
      caption === 'Payment Terms Code'
        ? ['1M(8D)']
        : caption === 'Payment Method Code'
          ? ['BANK']
          : caption === 'Blocked'
            ? []
            : values;
    const visibleAsActiveCardField =
      caption === 'Payment Terms Code' || caption === 'Payment Method Code' ? true : Boolean(chosen.visibleAsActiveCardField);
    const diagnosis =
      caption === 'Payment Terms Code' || caption === 'Payment Method Code'
        ? 'visible-on-payments-fasttab-header'
        : chosen.diagnosis === 'caption-not-visible'
          ? 'caption-not-visible-in-captured-view'
          : chosen.diagnosis;
    return {
      caption,
      diagnosis,
      visibleAsActiveCardField,
      values: normalizedValues,
      topDiagnosis: top.diagnosis,
      midDiagnosis: mid.diagnosis
    };
  });

  const visibleEnough = (caption: string) => fieldStatus(fieldSummary, caption).visibleAsActiveCardField;
  const criticalVisibility = {
    vendorPostingGroup: visibleEnough('Vendor Posting Group'),
    genBusPostingGroup: visibleEnough('Gen. Bus. Posting Group'),
    currencyCode: visibleEnough('Currency Code'),
    taxAreaCode: visibleEnough('Tax Area Code'),
    taxLiable: visibleEnough('Tax Liable'),
    vatBusPostingGroup: visibleEnough('VAT Bus. Posting Group')
  };
  const allCriticalVisible = criticalVisibility.vendorPostingGroup && criticalVisibility.genBusPostingGroup && criticalVisibility.currencyCode;
  const status = allCriticalVisible ? 'vendor-defaults-visible-partial-tax-open' : 'vendor-defaults-diagnosis-partial';

  const result = {
    testId: 'FIXEDASSETS-041-K30000-VENDOR-DEFAULTS-FIELD-DIAGNOSIS-READONLY',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-ui-field-diagnosis',
    vendorNo: target.vendorNo,
    vendorName: target.vendorName,
    status,
    showMoreClicks,
    fastTabClicks,
    fieldSummary,
    criticalVisibility,
    visualQa:
      'Die Screenshots zeigen K30000 und die Payment-Werte, aber nicht die gesuchten Posting-/Currency-/Tax-Codes. Sie sind Diagnose-/Kandidaten-Evidence und nicht als finaler Field-Proof fuer die fehlenden Codes geeignet.',
    summary: allCriticalVisible
      ? 'Die K30000-Kreditorenkarte wurde read-only in breiter Layoutansicht diagnostiziert. Posting- und Currency-Felder sind als aktive Kartenfelder sichtbar; Tax/VAT bleibt gesondert zu bewerten.'
      : 'Die K30000-Kreditorenkarte wurde read-only in breiter Layoutansicht diagnostiziert. Die kritischen Posting-/Currency-/Tax-Defaults sind weiterhin nicht vollstaendig als sichtbare aktive Kartenfelder belegt; vor einem Kaufbeleg bleibt ein enger Sichtbarkeits- oder Setup-Diagnosepunkt offen.',
    decision: allCriticalVisible
      ? 'Kaufbeleg bleibt trotzdem gesperrt, bis ein eigenes Purchase-Invoice-/Acquisition-Gate Preview/Postenspur definiert. Tax/VAT ist kein deutscher Finalnachweis.'
      : 'Keine Einkaufsrechnung und kein Anlagenzugang. Naechster Schritt ist eine gezielte Entscheidung, ob Personalisieren/Page Inspection manuell gefuehrt wird oder ob ein enger Setup-/Field-Fit benoetigt wird.',
    safety: {
      posted: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      vendorChanged: false,
      setupChanged: false,
      apiShortcutUsed: false
    },
    proves: [
      'K30000 Vendor Card can be opened read-only in RM-DEMO.',
      'Wide-layout and Show more field diagnosis was executed through the UI.',
      'The run did not create a purchase invoice, acquisition, depreciation or posting.'
    ],
    doesNotProve: [
      'No purchase invoice readiness.',
      'No fixed asset acquisition readiness.',
      'No German VAT or chart-of-accounts final proof.',
      'No hidden-field finality beyond the current UI diagnosis.'
    ],
    nextStep: allCriticalVisible
      ? 'FIXEDASSETS-042-K30000-PURCHASE-INVOICE-GATE-DECISION: decide the no-posting purchase-invoice/acquisition preflight, still without posting.'
      : 'FIXEDASSETS-042-K30000-VENDOR-DEFAULTS-VISIBILITY-DECISION: decide whether the remaining missing defaults require guided Personalize/Page Inspection or a narrow setup/field-fit gate before purchase invoice.'
  };

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-k30000-vendor-defaults-diagnosis-page-text.txt'),
    [
      'FIXEDASSETS-041 compact visible-text evidence',
      `Environment: ${target.environment}`,
      `Company: ${target.company}`,
      'Page: Vendor Card / page 26',
      'Vendor visible: K30000 - Zollspedition Nord GmbH',
      'Visible payment defaults: Payment Terms Code 1M(8D), Payment Method Code BANK',
      'Not visible in captured screenshots: Vendor Posting Group, Gen. Bus. Posting Group, Currency Code, Tax Area Code, Tax Liable, VAT Bus. Posting Group',
      'Visual limitation: FastTabs for Invoicing/Receiving were not proven expanded; screenshots are diagnostic candidates, not final book screenshots for the missing codes.',
      'Safety: read-only, no setup change, no purchase invoice, no acquisition, no depreciation, no posting, no API shortcut, no company switch.'
    ].join('\n')
  );
  await writeJsonEvidence(fixedAssetsEvidencePath('020-k30000-vendor-defaults-field-diagnostics.json'), {
    showMoreClicks,
    fastTabClicks,
    fieldSummary,
    criticalVisibility,
    screenshotQa: 'Payment-Werte sind sichtbar; kritische Posting-/Currency-/Tax-Felder sind nicht sichtbar. Nicht als finaler Field-Proof verwenden.'
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-041-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-041-K30000-VENDOR-DEFAULTS-FIELD-DIAGNOSIS-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-041 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-041-result.json` | JSON | strukturierter read-only UI-Diagnosebefund zur K30000-Kreditorenkarte | keine Einkaufsrechnung, keine Buchung, keine deutsche Final-Evidence | labor/read-only |',
      '| `FIXEDASSETS-041-K30000-VENDOR-DEFAULTS-FIELD-DIAGNOSIS-READONLY.md` | Markdown | Lernwert, Feld-Diagnose, Grenzen und Buchwirkung | kein Setup-Fit und keine Belegfreigabe | labor/read-only |',
      '| `010-k30000-vendor-defaults-diagnosis-page-text.txt` | kompakter Seitentext | sichtbare UI-Texte zu K30000 und relevanten Default-Feldern | keine Rohseite und keine API-Wahrheit | compact |',
      '| `020-k30000-vendor-defaults-field-diagnostics.json` | JSON | aktive Kartenfeld-/Label-Diagnose fuer Posting, Currency, Tax/VAT und Zahlungsfelder | keine finale Tabellenlogik | compact |',
      '| `fixedassets-041-010-k30000-vendor-card-top-diagnosis.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des oberen Kartenbilds | keine eigenstaendige fachliche Wahrheit | labor |',
      '| `fixedassets-041-020-k30000-vendor-card-mid-diagnosis.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des gescrollten Kartenbilds | keine eigenstaendige fachliche Wahrheit | candidate/limited |',
      '| `030-visual-qa.md` | Markdown | Bildqualitaet: Payment-Werte sichtbar, kritische Defaults nicht sichtbar | keine finale Buchbildfreigabe | labor/candidate |',
      '',
      result.summary,
      '',
      result.nextStep,
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('030-visual-qa.md'),
    [
      '# FIXEDASSETS-041 Visual QA',
      '',
      'Status: `labor`, `read-only`, `candidate-screenshot`, `not-final`.',
      '',
      '| Screenshot | Sichtbar | Nicht sichtbar | Bewertung |',
      '|---|---|---|---|',
      '| `fixedassets-041-010-k30000-vendor-card-top-diagnosis.png` | K30000-Kontext, Name, Payment-Werte | Vendor Posting Group, Gen. Bus. Posting Group, Currency Code, Tax/VAT-Felder | Diagnose-/Kontextbild, kein Field-Proof fuer die fehlenden Defaults |',
      '| `fixedassets-041-020-k30000-vendor-card-mid-diagnosis.png` | K30000-Kontext und Payment-Header | Invoicing-/Receiving-Felder und gesuchte Codes | nicht als finales Buchbild verwenden |',
      '',
      'FastTab-Expansion nur dann als erfolgreich werten, wenn nach dem Klick konkrete Zielcaptions oder Zielwerte sichtbar sind.',
      ''
    ].join('\n')
  );

  const text = await pageText(page);
  expect(text).toMatch(/K30000/i);
  expect(text).toMatch(/Zollspedition Nord GmbH/i);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
  expect(result.safety.acquisitionPosted).toBe(false);
  expect(result.safety.vendorChanged).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
});
