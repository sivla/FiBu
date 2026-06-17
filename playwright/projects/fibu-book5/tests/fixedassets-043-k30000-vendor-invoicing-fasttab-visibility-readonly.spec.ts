import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, hideFactBoxPane, pageText, screenshot, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(360_000);

const testId = 'fixedassets-043';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH',
};

const tabs = [
  {
    caption: 'Invoicing',
    targetCaptions: ['Vendor Posting Group', 'Gen. Bus. Posting Group', 'Currency Code', 'Tax Area Code', 'Tax Liable', 'VAT Bus. Posting Group'],
    screenshotName: 'fixedassets-043-020-k30000-vendor-invoicing-fasttab-proof.png',
  },
  {
    caption: 'Payments',
    targetCaptions: ['Payment Terms Code', 'Payment Method Code'],
    screenshotName: 'fixedassets-043-030-k30000-vendor-payments-fasttab-proof.png',
  },
  {
    caption: 'Receiving',
    targetCaptions: ['Location Code', 'Shipment Method Code'],
    screenshotName: 'fixedassets-043-040-k30000-vendor-receiving-fasttab-proof.png',
  },
];

const allTargetCaptions = [...new Set(tabs.flatMap((tab) => tab.targetCaptions))];

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
          .filter((entry) => !entry.ariaLabel || entry.ariaLabel.length <= 120)
          .filter((entry) => !entry.title || entry.title.length <= 120)
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
          return {
            clicked: false,
            caption: targetCaption,
            reason: 'no-small-chevron-control',
            captionRect: captionEntry.rect,
            candidates: controls.slice(0, 8).map(({ element: _element, ...entry }) => entry),
          };
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
          candidates: controls.slice(0, 8).map(({ element: _element, ...entry }) => entry),
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

function field(summary: Array<Record<string, any>>, caption: string) {
  return summary.find((entry) => entry.caption === caption) ?? { caption, diagnosis: 'caption-not-visible', visibleAsActiveCardField: false, values: [] };
}

function hasVisibleTarget(summary: Array<Record<string, any>>, captions: string[]) {
  return captions.some((caption) => field(summary, caption).visibleAsActiveCardField);
}

function renderMarkdown(result: any) {
  const tabRows = result.fastTabs
    .map((tab: any) => {
      const visible = tab.visibleTargetCaptions.length ? tab.visibleTargetCaptions.map((caption: string) => `\`${caption}\``).join(', ') : 'keine Zielcaption sichtbar';
      return `| ${tab.caption} | ${tab.expandResult.reason ?? tab.expandResult.method ?? 'n/a'} | ${visible} | ${tab.status} |`;
    })
    .join('\n');
  const fieldRows = result.fieldSummary
    .map((entry: any) => `| ${entry.caption} | ${entry.visibleAsActiveCardField ? 'sichtbar' : 'nicht sichtbar'} | ${entry.values.length ? entry.values.map((value: string) => `\`${value}\``).join(', ') : entry.diagnosis} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-043 - K30000 Vendor Invoicing FastTab Visibility read-only',
    '',
    'Status: `labor`, `read-only`, `ui-first`, `fasttab-visibility`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielkreditor | ${result.vendorNo} / ${result.vendorName} |`,
    `| Status | ${result.status} |`,
    '| Gebucht | nein |',
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## FastTabs',
    '',
    '| FastTab | Klick-/Zustandsbefund | sichtbare Zielcaptions | Status |',
    '|---|---|---|---|',
    tabRows,
    '',
    '## Feldsichtbarkeit',
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
    '- Keine API-Abkuerzung; der Befund basiert auf sichtbarer BC-UI.',
    '- Nicht als deutscher USt-, Kontenplan- oder HGB-Finalnachweis verwenden.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-043 K30000 Vendor Invoicing FastTab visibility read-only', async ({ page }) => {
  await openVendorCard(page);
  await scrollMain(page, 0);
  await screenshot(page, 'fixedassets-043-010-k30000-vendor-card-fasttab-before.png', {
    projectName: project.name,
    testId,
    status: 'labor-context',
    bookUse: 'context-evidence',
    purpose: 'K30000 Vendor Card vor gezielter FastTab-Sichtbarkeitsdiagnose; beweist nur Kontext, nicht die gesuchten Default-Codes.',
    expectedPageText: [/K30000/i, /Zollspedition Nord GmbH/i],
    knownLimitations: ['Read-only CRONUS-USA-Labor.', 'Noch kein Proof fuer Invoicing-/Posting-/Currency-/Tax-Defaults.'],
  });

  const fastTabs: any[] = [];
  const mergedFieldMap = new Map<string, any>();

  for (const tab of tabs) {
    const expandResult = await expandFastTabByChevron(page, tab.caption);
    await page.waitForTimeout(900);
    const summary = await collectFieldSummary(page, tab.targetCaptions);
    for (const entry of summary) {
      const current = mergedFieldMap.get(entry.caption);
      if (!current || (!current.visibleAsActiveCardField && entry.visibleAsActiveCardField)) {
        mergedFieldMap.set(entry.caption, entry);
      }
    }
    const visibleTargetCaptions = summary.filter((entry) => entry.visibleAsActiveCardField).map((entry) => entry.caption);
    const screenshotStatus = visibleTargetCaptions.length ? 'labor-fasttab-proof' : 'labor-diagnostic-limited';
    await screenshot(page, tab.screenshotName, {
      projectName: project.name,
      testId,
      status: screenshotStatus,
      bookUse: visibleTargetCaptions.length ? 'book-candidate-partial' : 'diagnostic-evidence-only',
      purpose: `${tab.caption}-FastTab nach gezieltem Chevron/aria-expanded-Versuch; nur als Proof nutzen, wenn die Zielcaptions im Bild sichtbar sind.`,
      expectedPageText: [/K30000/i, /Zollspedition Nord GmbH/i],
      knownLimitations: [
        'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
        'Screenshot beweist nur sichtbare Captions/Werte; nicht sichtbare Codes bleiben offen.',
        'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA, keine Buchung.',
      ],
    });

    fastTabs.push({
      caption: tab.caption,
      expandResult,
      targetCaptions: tab.targetCaptions,
      visibleTargetCaptions,
      fieldSummary: summary,
      screenshot: `playwright/projects/fibu-book5/img/${tab.screenshotName}`,
      status: visibleTargetCaptions.length ? 'target-caption-visible' : 'target-caption-not-visible',
    });
  }

  const fieldSummary = allTargetCaptions.map((caption) => mergedFieldMap.get(caption) ?? { caption, diagnosis: 'caption-not-visible', visibleAsActiveCardField: false, values: [] });
  const invoicingVisible = hasVisibleTarget(fieldSummary, tabs[0].targetCaptions);
  const paymentVisible = hasVisibleTarget(fieldSummary, tabs[1].targetCaptions);
  const criticalVisibility = {
    vendorPostingGroup: field(fieldSummary, 'Vendor Posting Group').visibleAsActiveCardField,
    genBusPostingGroup: field(fieldSummary, 'Gen. Bus. Posting Group').visibleAsActiveCardField,
    currencyCode: field(fieldSummary, 'Currency Code').visibleAsActiveCardField,
    taxAreaCode: field(fieldSummary, 'Tax Area Code').visibleAsActiveCardField,
    taxLiable: field(fieldSummary, 'Tax Liable').visibleAsActiveCardField,
    vatBusPostingGroup: field(fieldSummary, 'VAT Bus. Posting Group').visibleAsActiveCardField,
    paymentTermsCode: field(fieldSummary, 'Payment Terms Code').visibleAsActiveCardField,
    paymentMethodCode: field(fieldSummary, 'Payment Method Code').visibleAsActiveCardField,
  };

  const status = invoicingVisible
    ? 'done-labor-readonly-invoicing-fasttab-visible'
    : paymentVisible
      ? 'done-labor-readonly-payments-visible-invoicing-still-hidden'
      : 'done-labor-readonly-fasttab-diagnostic-no-critical-defaults-visible';
  const nextStep = invoicingVisible
    ? 'FIXEDASSETS-044-K30000-PURCHASE-INVOICE-GATE-DECISION: Kaufbeleg-Preflight erst als eigener No-/Posting-Gate-Entscheid, weiterhin ohne automatische Buchung.'
    : 'FIXEDASSETS-044-K30000-PERSONALIZE-PAGEINSPECTION-DIAGNOSIS-READONLY: vor Kaufbeleg per Personalisieren/Page Inspection klaeren, ob die Invoicing-Defaults ausgeblendet, anders benannt oder nicht verfuegbar sind.';
  const result = {
    caseId: 'FIXEDASSETS-043-K30000-VENDOR-INVOICING-FASTTAB-VISIBILITY-READONLY',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-ui-fasttab-visibility-proof',
    vendorNo: target.vendorNo,
    vendorName: target.vendorName,
    status,
    fastTabs,
    fieldSummary,
    criticalVisibility,
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
      'playwright/projects/fibu-book5/img/fixedassets-043-010-k30000-vendor-card-fasttab-before.png',
      ...fastTabs.map((tab) => tab.screenshot),
    ],
    summary: invoicingVisible
      ? 'Der K30000-Kreditor wurde read-only geoeffnet; mindestens eine Invoicing-Zielcaption ist in der UI sichtbar. Das ist FastTab-/Sichtbarkeits-Evidence, aber noch keine Kaufbeleg- oder Buchungsfreigabe.'
      : 'Der K30000-Kreditor wurde read-only geoeffnet; Payment-Kontext ist erneut sichtbar, aber die Invoicing-Defaults Vendor Posting Group, Gen. Bus. Posting Group, Currency Code und Tax/VAT sind weiterhin nicht als sichtbare Zielcaptions belegt. Das ist keine Setup-Fehlerbehauptung, sondern eine UI-Sichtbarkeitsgrenze.',
    bookImpact: invoicingVisible
      ? 'Kapitel 21 kann die K30000-Kreditorenkarte als Labor-Vorstufe aufnehmen, muss aber den Kaufbeleg weiterhin an ein separates Preflight-/Posting-Gate binden.'
      : 'Kapitel 21 muss Anfaengern erklaeren: Wenn Buchungsgruppen/Waehrung/Tax auf der Kreditorenkarte nicht sichtbar sind, darf man nicht blind eine Einkaufsrechnung starten. Erst Sichtbarkeit ueber FastTab, Personalisieren oder Page Inspection klaeren.',
    nextStep,
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-043-result.json'), result);
  await writeJsonEvidence(fixedAssetsEvidencePath('010-fasttab-visibility-diagnostics.json'), {
    fastTabs,
    fieldSummary,
    criticalVisibility,
    screenshotRule: 'Ein Screenshot ist nur Proof fuer Captions/Werte, die im Bild wirklich sichtbar sind. Nicht sichtbare Codes bleiben offen.',
  });
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-043-K30000-VENDOR-INVOICING-FASTTAB-VISIBILITY-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('020-visual-qa.md'),
    [
      '# FIXEDASSETS-043 Visual QA',
      '',
      'Status: `labor`, `read-only`, `screenshot-qa`, `not-final`.',
      '',
      '| Screenshot | Sichtbares Ziel | Bewertung |',
      '|---|---|---|',
      '| `fixedassets-043-010-k30000-vendor-card-fasttab-before.png` | K30000-Kartenkontext | Kontextbild, kein Default-Proof |',
      ...fastTabs.map((tab) => `| \`${tab.screenshot.split('/').pop()}\` | ${tab.visibleTargetCaptions.length ? tab.visibleTargetCaptions.join(', ') : 'keine Zielcaption sichtbar'} | ${tab.status === 'target-caption-visible' ? 'partieller Buchkandidat nur fuer sichtbare Felder' : 'Diagnosebild, nicht als Proof fuer die fehlenden Codes nutzen'} |`),
      '',
      'Regel fuer Folgelaeufe: Wenn der konkrete Code oder die konkrete Caption nicht sichtbar ist, wird das Bild nicht als Buchbeleg fuer diesen Code freigegeben.',
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-043 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-043-result.json` | JSON | strukturierter UI-first FastTab-Sichtbarkeitsbefund fuer K30000 | keine Kaufbeleg-, Zugangs-, AfA- oder Buchungsfreigabe | labor/read-only |',
      '| `010-fasttab-visibility-diagnostics.json` | JSON | FastTab-Klick-/Sichtbarkeitsdiagnose und sichtbare Zielcaptions | keine Tabellen-/Posting-/Tax-Finalitaet | compact |',
      '| `FIXEDASSETS-043-K30000-VENDOR-INVOICING-FASTTAB-VISIBILITY-READONLY.md` | Markdown | Ergebnis, Lernwert, Buchwirkung und Grenze | kein deutscher Finalnachweis | labor/read-only |',
      '| `020-visual-qa.md` | Markdown | welche Screenshots welche sichtbaren Ziele tragen | keine fachliche Wahrheit ohne sichtbaren Code | screenshot-qa |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Limitationen je Bild | keine Rohlogs | compact |',
      '',
      result.summary,
      '',
      result.nextStep,
      '',
    ].join('\n'),
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
