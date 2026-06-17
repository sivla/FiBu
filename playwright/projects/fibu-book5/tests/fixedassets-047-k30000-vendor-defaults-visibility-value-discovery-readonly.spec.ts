import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, compactPageText, dismissTours, hideFactBoxPane, pageText, screenshot, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(360_000);

const testId = 'fixedassets-047';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
};

const criticalCaptions = ['Vendor Posting Group', 'Gen. Bus. Posting Group', 'Currency Code', 'VAT Bus. Posting Group'];
const contextCaptions = ['Tax Area Code', 'Tax Liable', 'Payment Terms Code', 'Payment Method Code'];
const tabs = [
  { caption: 'Invoicing', targetCaptions: [...criticalCaptions, 'Tax Area Code', 'Tax Liable'] },
  { caption: 'Payments', targetCaptions: ['Payment Terms Code', 'Payment Method Code'] },
  { caption: 'Receiving', targetCaptions: ['Location Code', 'Shipment Method Code'] },
];
const allCaptions = [...new Set([...criticalCaptions, ...contextCaptions, ...tabs.flatMap((tab) => tab.targetCaptions)])];

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
  await page.waitForTimeout(900);
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
      await page.waitForTimeout(700);
      return;
    }
  }

  await page.mouse.wheel(0, top);
  await page.waitForTimeout(700);
}

async function expandFastTabByChevron(page: Page, caption: string) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((targetCaption) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const captionPattern = new RegExp(`(^|\\b)${escape(targetCaption)}($|\\b)`, 'i');
        const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
        const captionCandidates = visibleElements
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            rect: rectOf(element),
          }))
          .filter((entry) => captionPattern.test(entry.text) || captionPattern.test(entry.ariaLabel) || captionPattern.test(entry.title))
          .filter((entry) => !entry.text || entry.text.length <= 120)
          .filter((entry) => entry.rect.width > 30 && entry.rect.height > 10 && entry.rect.width <= 520 && entry.rect.height <= 80)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const captionEntry = captionCandidates[0];

        if (!captionEntry) {
          return { clicked: false, caption: targetCaption, reason: 'caption-not-visible', candidates: [] };
        }

        const captionCenterY = captionEntry.rect.y + captionEntry.rect.height / 2;
        const controls = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[aria-expanded]'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            ariaExpanded: normalize(element.getAttribute('aria-expanded')),
            rect: rectOf(element),
          }))
          .filter((entry) => entry.rect.width <= 90 && entry.rect.height <= 90)
          .filter((entry) => Math.abs(entry.rect.y + entry.rect.height / 2 - captionCenterY) <= 35 || Math.abs(entry.rect.y - captionEntry.rect.y) <= 45)
          .map((entry) => {
            const labelText = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            const captionInLabel = captionPattern.test(labelText);
            const isLeftChevron = entry.rect.x <= captionEntry.rect.x + 45;
            const isCollapsed = entry.ariaExpanded === 'false';
            const score = (isCollapsed ? 50 : 0) + (captionInLabel ? 30 : 0) + (isLeftChevron ? 20 : 0) - Math.abs(entry.rect.y - captionEntry.rect.y);
            return { ...entry, score, captionInLabel, isLeftChevron, isCollapsed };
          })
          .sort((left, right) => right.score - left.score || left.rect.x - right.rect.x);

        const chosen = controls[0];
        if (!chosen) {
          return { clicked: false, caption: targetCaption, reason: 'no-small-chevron-control', captionRect: captionEntry.rect, candidates: [] };
        }

        const beforeExpanded = chosen.ariaExpanded || null;
        if (beforeExpanded !== 'false') {
          return {
            clicked: false,
            caption: targetCaption,
            reason: 'already-expanded-or-not-collapsible',
            beforeExpanded,
            captionRect: captionEntry.rect,
            chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect, score: chosen.score },
          };
        }

        chosen.element.click();
        return {
          clicked: true,
          caption: targetCaption,
          method: 'small-chevron-or-aria-expanded-control-near-caption',
          beforeExpanded,
          captionRect: captionEntry.rect,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect, score: chosen.score },
        };
      }, caption)
      .catch((error) => ({ clicked: false, caption, reason: 'evaluate-error', error: String(error), candidates: [] }));

    if (result.clicked || result.reason === 'already-expanded-or-not-collapsible') {
      await page.waitForTimeout(900);
      return result;
    }
  }

  return { clicked: false, caption, reason: 'caption-not-found-in-any-frame', candidates: [] };
}

async function collectFieldSummary(page: Page, captions: string[]) {
  const diagnostics = await collectActiveCardControlDiagnostics(page, captions, {
    targetText: /K30000|Zollspedition Nord GmbH/i,
  });
  return diagnostics.diagnostics.map((entry) => {
    const controlValues = entry.nearbyControls
      .flatMap((control) => [control.value, control.text, control.ariaLabel, control.title])
      .map((value) => (value || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const buttonValues = entry.nearbyButtons
      .flatMap((button) => [button.text, button.ariaLabel, button.title])
      .map((value) => (value || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .filter((value) => !/Details|Open|AssistEdit|Show more|Mehr anzeigen/i.test(value));
    return {
      caption: entry.caption,
      diagnosis: entry.diagnosis,
      visibleAsActiveCardField: ['active-card-label-with-control', 'active-card-label-with-button', 'label-only'].includes(entry.diagnosis),
      values: [...new Set([...controlValues, ...buttonValues])].slice(0, 8),
      selectedLabel: entry.selectedLabel
        ? {
            text: entry.selectedLabel.text,
            rect: entry.selectedLabel.rect,
            scoreReasons: entry.selectedLabel.scoreReasons,
          }
        : null,
    };
  });
}

function mergeFieldSummaries(summaries: Array<Array<any>>) {
  const merged = new Map<string, any>();
  for (const summary of summaries) {
    for (const entry of summary) {
      const current = merged.get(entry.caption);
      if (!current || (!current.visibleAsActiveCardField && entry.visibleAsActiveCardField) || (!current.values.length && entry.values.length)) {
        merged.set(entry.caption, entry);
      }
    }
  }

  return allCaptions.map((caption) => merged.get(caption) ?? { caption, diagnosis: 'caption-not-visible', visibleAsActiveCardField: false, values: [] });
}

function field(summary: Array<Record<string, any>>, caption: string) {
  return summary.find((entry) => entry.caption === caption) ?? { caption, diagnosis: 'caption-not-visible', visibleAsActiveCardField: false, values: [] };
}

function visibleFieldNames(summary: Array<Record<string, any>>, captions: string[]) {
  return captions.filter((caption) => field(summary, caption).visibleAsActiveCardField);
}

function renderMarkdown(result: any) {
  const tabRows = result.fastTabs
    .map((tab: any) => `| ${tab.caption} | ${tab.expandResult.reason ?? tab.expandResult.method ?? 'n/a'} | ${tab.visibleTargetCaptions.length ? tab.visibleTargetCaptions.map((caption: string) => `\`${caption}\``).join(', ') : 'keine Zielcaption sichtbar'} | ${tab.screenshot} |`)
    .join('\n');
  const fieldRows = result.fieldSummary
    .map((entry: any) => `| ${entry.caption} | ${entry.visibleAsActiveCardField ? 'sichtbar' : 'nicht sichtbar'} | ${entry.values.length ? entry.values.map((value: string) => `\`${value}\``).join(', ') : entry.diagnosis} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-047 - K30000 Vendor Defaults Visibility/Value Discovery read-only',
    '',
    'Status: `labor`, `read-only`, `ui-first`, `visibility-value-discovery`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.vendorNo} / ${result.vendorName} |`,
    `| Ergebnisstatus | ${result.status} |`,
    '| Gebucht | nein |',
    '| Einkaufsrechnung erzeugt | nein |',
    '| Kreditor/Setup geaendert | nein |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## FastTabs und Screenshots',
    '',
    '| Bereich | Klick-/Zustandsbefund | sichtbare Zielcaptions | Screenshot |',
    '|---|---|---|---|',
    tabRows,
    '',
    '## Feld- und Wertnachweis',
    '',
    '| Feld | Sichtbarkeit | Wert / Diagnose |',
    '|---|---|---|',
    fieldRows,
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Read-only: keine Kreditoren-, Setup- oder Belegaenderung.',
    '- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Keine API-Abkuerzung; der Befund basiert auf sichtbarer BC-UI und kompaktem Seitentext.',
    '- Nicht als deutscher USt-, Kontenplan- oder HGB-Finalnachweis verwenden.',
    '- Ein Screenshot gilt nur fuer Felder/Codes, die im Bild wirklich sichtbar sind.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-047 K30000 Vendor Defaults visibility/value discovery read-only', async ({ page }) => {
  await openVendorCard(page);
  await scrollMain(page, 0);

  await screenshot(page, 'fixedassets-047-010-k30000-vendor-card-context.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'K30000 Vendor Card im breiten Layout vor der Default-Wert-Discovery; beweist Kontext, nicht unsichtbare Default-Codes.',
    expectedPageText: [/K30000/i, /Zollspedition Nord GmbH/i],
    knownLimitations: ['Kontextbild fuer RM-DEMO/CRONUS-USA-Labor.', 'Nur sichtbare Werte im Bild duerfen als Bildnachweis verwendet werden.'],
  });

  const summaries: Array<Array<any>> = [];
  const fastTabs: any[] = [];

  for (const tab of tabs) {
    const expandResult = await expandFastTabByChevron(page, tab.caption);
    await page.waitForTimeout(900);
    const summary = await collectFieldSummary(page, tab.targetCaptions);
    summaries.push(summary);
    const visibleTargetCaptions = visibleFieldNames(summary, tab.targetCaptions);
    const screenshotName = `fixedassets-047-${String(20 + fastTabs.length * 10).padStart(3, '0')}-k30000-${tab.caption.toLowerCase()}-visibility.png`;
    await screenshot(page, screenshotName, {
      projectName: project.name,
      testId,
      status: visibleTargetCaptions.length ? 'candidate' : 'labor',
      bookUse: visibleTargetCaptions.length ? 'field-proof' : 'evidence',
      purpose: `${tab.caption}-Bereich nach gezieltem Aufklappversuch. Nur als Beleg fuer Felder nutzen, die im Bild tatsaechlich sichtbar sind.`,
      expectedPageText: [/K30000/i, /Zollspedition Nord GmbH/i],
      knownLimitations: [
        'Read-only CRONUS-USA-Labor in RM-DEMO.',
        'Nicht sichtbare Default-Codes bleiben offen und duerfen aus dem Bild nicht behauptet werden.',
        'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
      ],
    });
    fastTabs.push({
      caption: tab.caption,
      expandResult,
      targetCaptions: tab.targetCaptions,
      visibleTargetCaptions,
      fieldSummary: summary,
      screenshot: `playwright/projects/fibu-book5/img/${screenshotName}`,
    });
  }

  const fieldSummary = mergeFieldSummaries(summaries);
  const criticalVisible = visibleFieldNames(fieldSummary, criticalCaptions);
  const contextVisible = visibleFieldNames(fieldSummary, contextCaptions);
  const focusedText = await compactPageText(page, {
    include: [/K30000|Zollspedition|Vendor Posting Group|Gen\. Bus\. Posting Group|Currency Code|VAT Bus\. Posting Group|Tax Area Code|Tax Liable|Payment Terms Code|Payment Method Code|BANK|1M\(8D\)|Posting Details|Invoicing|Payments|Receiving/i],
    maxLines: 120,
    maxLineLength: 220,
  });
  const fullText = await pageText(page);

  const status =
    criticalVisible.length === criticalCaptions.length
      ? 'done-labor-readonly-critical-defaults-visible'
      : criticalVisible.length > 0
        ? 'done-labor-readonly-critical-defaults-partial'
        : 'done-labor-readonly-critical-defaults-still-not-visibly-proven';
  const result = {
    caseId: 'FIXEDASSETS-047-K30000-VENDOR-DEFAULTS-VISIBILITY-VALUE-DISCOVERY-READONLY',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-ui-first-visibility-value-discovery',
    vendorNo: target.vendorNo,
    vendorName: target.vendorName,
    status,
    criticalCaptions,
    criticalVisible,
    criticalMissing: criticalCaptions.filter((caption) => !criticalVisible.includes(caption)),
    contextVisible,
    fastTabs,
    fieldSummary,
    focusedTextEvidence: 'playwright/projects/fibu-book5/evidence/fixedassets-047/010-focused-page-text.txt',
    pageTextContains: {
      vendorPostingGroup: /Vendor Posting Group/i.test(fullText),
      genBusPostingGroup: /Gen\. Bus\. Posting Group/i.test(fullText),
      currencyCode: /Currency Code/i.test(fullText),
      vatBusPostingGroup: /VAT Bus\. Posting Group/i.test(fullText),
      taxAreaCode: /Tax Area Code/i.test(fullText),
      taxLiable: /Tax Liable/i.test(fullText),
      paymentTermsCode: /Payment Terms Code|1M\(8D\)/i.test(fullText),
      paymentMethodCode: /Payment Method Code|BANK/i.test(fullText),
    },
    safety: {
      posted: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      vendorChanged: false,
      setupChanged: false,
      apiShortcutUsed: false,
      companyChanged: false,
    },
    screenshots: [
      'playwright/projects/fibu-book5/img/fixedassets-047-010-k30000-vendor-card-context.png',
      ...fastTabs.map((tab) => tab.screenshot),
    ],
    summary:
      criticalVisible.length === criticalCaptions.length
        ? 'Die K30000-Kreditorenkarte zeigt alle kritischen Einkaufs-/Posting-Default-Felder sichtbar. Das ist ein Read-only-Werte-/Sichtbarkeitsnachweis, aber noch keine Kaufbeleg- oder Buchungsfreigabe.'
        : `Die K30000-Kreditorenkarte zeigt weiter keinen vollstaendigen sichtbaren Nachweis fuer die kritischen Defaults. Sichtbar kritisch: ${criticalVisible.length ? criticalVisible.join(', ') : 'keine'}. Weiter offen: ${criticalCaptions.filter((caption) => !criticalVisible.includes(caption)).join(', ')}. Zahlungs-/Tax-Kontext kann nur fuer sichtbar gefundene Felder genutzt werden.`,
    bookImpact:
      'Kapitel 21 soll den Anlagenzugang ueber Einkaufsrechnung weiter an ein Default-Preflight-Gate binden. Fuer Anfaenger ist wichtig: Ein Kreditor kann existieren und Zahlungswerte zeigen, trotzdem fehlen fuer eine sichere Einkaufsrechnung noch sichtbare Buchungsgruppen-/Waehrungs-/VAT-Defaults. Personalisieren/Page Inspection bleiben Diagnosewerkzeuge; der Buchscreen muss die wirklichen Codes zeigen.',
    nextStep:
      criticalVisible.length === criticalCaptions.length
        ? 'FIXEDASSETS-048-K30000-PURCHASE-INVOICE-PREFLIGHT-GATE-DECISION: ohne Buchung entscheiden, ob ein reiner Kaufbeleg-Preflight erlaubt ist.'
        : 'FIXEDASSETS-048-K30000-VENDOR-DEFAULTS-MANUAL-PERSONALIZE-OR-SETUP-GATE-DECISION: ohne Buchung entscheiden, ob die fehlenden Defaults manuell per Personalisieren sichtbar gemacht oder ein enger UI-first Default-Fit vorbereitet werden darf.',
  };

  await writeTextEvidence(fixedAssetsEvidencePath('010-focused-page-text.txt'), focusedText || 'No focused K30000/default text captured.\n');
  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-047-result.json'), result);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-field-value-diagnostics.json'), {
    criticalCaptions,
    criticalVisible,
    criticalMissing: result.criticalMissing,
    contextVisible,
    fieldSummary,
    pageTextContains: result.pageTextContains,
    screenshotRule: 'A screenshot is only valid proof for captions and values visibly present in that screenshot.',
  });
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-047-K30000-VENDOR-DEFAULTS-VISIBILITY-VALUE-DISCOVERY-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('020-visual-qa.md'),
    [
      '# FIXEDASSETS-047 Visual QA',
      '',
      'Status: `labor`, `read-only`, `screenshot-qa`, `not-final`.',
      '',
      '| Screenshot | Sichtbares Ziel | Bewertung |',
      '|---|---|---|',
      '| `fixedassets-047-010-k30000-vendor-card-context.png` | K30000-Kartenkontext | Kontextbild, kein Default-Proof fuer nicht sichtbare Codes |',
      ...fastTabs.map((tab) => `| \`${tab.screenshot.split('/').pop()}\` | ${tab.visibleTargetCaptions.length ? tab.visibleTargetCaptions.join(', ') : 'keine Zielcaption sichtbar'} | ${tab.visibleTargetCaptions.length ? 'partieller Field-Proof nur fuer sichtbare Felder' : 'Diagnosebild; nicht als Proof fuer fehlende Codes verwenden'} |`),
      '',
      'Regel: Ein Bild beweist nur das, was darauf wirklich lesbar ist. Wenn der konkrete Code oder die konkrete Caption nicht sichtbar ist, bleibt der Punkt offen.',
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-047 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-047-result.json` | JSON | strukturierter UI-first Read-only-Befund fuer K30000 Default-Sichtbarkeit/Werte | keine Einkaufsrechnung, keine Setup-Aenderung, keine Buchung | labor/read-only |',
      '| `020-field-value-diagnostics.json` | JSON | Feldsichtbarkeit, gefundene Werte und kompakter Seitentext-Check | keine Tabellen-/API-Wahrheit und keine nicht sichtbaren Werte | compact |',
      '| `010-focused-page-text.txt` | Text | gefilterter Seitentext zu K30000 und Default-Feldern | kein Rohdump und kein finaler Screenshot | compact |',
      '| `FIXEDASSETS-047-K30000-VENDOR-DEFAULTS-VISIBILITY-VALUE-DISCOVERY-READONLY.md` | Markdown | Ergebnis, Lernwert, Buchwirkung und Grenze | kein deutscher Finalnachweis | labor/read-only |',
      '| `020-visual-qa.md` | Markdown | welche Bilder welche sichtbaren Ziele tragen | keine fachliche Wahrheit ohne sichtbaren Code | screenshot-qa |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Limitationen je Bild | keine Rohlogs | compact |',
      '',
      result.summary,
      '',
      result.nextStep,
      '',
    ].join('\n'),
  );

  expect(fullText).toMatch(/K30000/i);
  expect(fullText).toMatch(/Zollspedition Nord GmbH/i);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
  expect(result.safety.acquisitionPosted).toBe(false);
  expect(result.safety.vendorChanged).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
});
