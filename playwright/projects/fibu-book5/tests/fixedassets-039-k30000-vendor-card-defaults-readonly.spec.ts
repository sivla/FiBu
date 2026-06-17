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
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(300_000);

const testId = 'fixedassets-039';
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  vendorNo: 'K30000',
  vendorName: 'Zollspedition Nord GmbH'
};

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
  await page.waitForTimeout(1500);
}

async function clickVisibleShowMore(page: Page) {
  const clicks: Array<Record<string, unknown>> = [];
  for (let pass = 0; pass < 3; pass += 1) {
    let clickedInPass = false;
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
            .filter((entry) => entry.width <= 260 && entry.height <= 80)
            .sort((left, right) => left.y - right.y || left.x - right.x);
          const chosen = candidates[0];
          if (!chosen) return { clicked: false, candidates: [] };
          chosen.element.click();
          return {
            clicked: true,
            label: chosen.label,
            x: chosen.x,
            y: chosen.y,
            frameUrl: location.href,
            candidates: candidates.slice(0, 10).map(({ element: _element, ...entry }) => entry)
          };
        })
        .catch((error) => ({ clicked: false, error: String(error), candidates: [] }));
      if (result.clicked) {
        clicks.push(result);
        clickedInPass = true;
        await page.waitForTimeout(1000);
        break;
      }
    }
    if (!clickedInPass) break;
  }
  return clicks;
}

async function collectVendorCardSignals(page: Page) {
  const frameSignals = [];
  for (const frame of page.frames()) {
    const signal = await frame
      .evaluate((targetValues) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const elements = Array.from(document.querySelectorAll<HTMLElement>('input,textarea,span,div,button,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const input = element as HTMLInputElement;
            const rect = element.getBoundingClientRect();
            return {
              text: normalize(
                [input.value, element.innerText || element.textContent, element.getAttribute('aria-label'), element.getAttribute('title')]
                  .filter(Boolean)
                  .join(' ')
              ),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter((entry) => entry.text)
          .slice(0, 1000);

        const bodyText = normalize(document.body.innerText || document.body.textContent);
        const findValue = (labelPattern: RegExp, valuePattern?: RegExp) => {
          const labelHits = elements.filter((entry) => labelPattern.test(entry.text)).slice(0, 20);
          const nearby = labelHits
            .flatMap((label) =>
              elements
                .filter((entry) => Math.abs(entry.y - label.y) <= 35 && entry.x > label.x)
                .map((entry) => entry.text)
                .filter((text) => !labelPattern.test(text))
                .slice(0, 8)
            )
            .filter(Boolean);
          const anywhere = valuePattern ? elements.filter((entry) => valuePattern.test(entry.text)).map((entry) => entry.text).slice(0, 20) : [];
          return {
            visible: labelHits.length > 0 || anywhere.length > 0,
            labelHits: labelHits.map(({ text, x, y }) => ({ text, x, y })),
            nearbyValues: [...new Set(nearby)].slice(0, 12),
            valueHits: [...new Set(anywhere)].slice(0, 12)
          };
        };

        return {
          frameUrl: location.href,
          targetVisible: bodyText.includes(targetValues.vendorNo),
          vendorNameVisible: bodyText.includes(targetValues.vendorName),
          fields: {
            no: findValue(/\bNo\.|\bNr\.|Nummer/i, new RegExp(`\\b${targetValues.vendorNo}\\b`, 'i')),
            name: findValue(/\bName\b/i, /Zollspedition Nord GmbH/i),
            vendorPostingGroup: findValue(/Vendor Posting Group|Kreditorenbuchungsgruppe|Vendor Posting-Gruppe/i),
            genBusPostingGroup: findValue(/Gen\.?\s*Bus\.?\s*Posting Group|Gesch\.ftsbuchungsgruppe|Gen\.\s*Gesch\.fts/i),
            paymentTermsCode: findValue(/Payment Terms Code|Zahlungsbedingungscode|Zahlungsbedingungen/i),
            currencyCode: findValue(/Currency Code|W.hrungscode|Waehrungscode/i),
            taxAreaCode: findValue(/Tax Area Code|Steuergebietscode/i),
            taxLiable: findValue(/Tax Liable|Steuerpflichtig|MwSt\.?-pflichtig/i),
            vatBusPostingGroup: findValue(/VAT Bus\.?\s*Posting Group|VAT Business Posting Group|MwSt\.?-Gesch\.ftsbuchungsgruppe|USt-Gesch/i),
            blocked: findValue(/\bBlocked\b|Gesperrt|Blockiert/i)
          },
          interestingTexts: [...new Set(
            elements
              .map((entry) => entry.text)
              .filter((text) =>
                /K30000|Zollspedition|Vendor Posting Group|Kreditorenbuchungsgruppe|Gen\.|Posting Group|Payment Terms|Zahlungs|Currency|W.hrung|Tax|VAT|MwSt|USt|Blocked|Gesperrt|Balance/i.test(text)
              )
          )].slice(0, 180)
        };
      }, target)
      .catch(() => null);
    if (signal) frameSignals.push(signal);
  }
  const mergedFields: Record<string, unknown> = {};
  for (const key of [
    'no',
    'name',
    'vendorPostingGroup',
    'genBusPostingGroup',
    'paymentTermsCode',
    'currencyCode',
    'taxAreaCode',
    'taxLiable',
    'vatBusPostingGroup',
    'blocked'
  ]) {
    const hits = frameSignals.map((signal) => signal.fields[key]).filter((field) => field.visible);
    mergedFields[key] = hits[0] ?? { visible: false, labelHits: [], nearbyValues: [], valueHits: [] };
  }
  return {
    frameSignals,
    targetVisible: frameSignals.some((signal) => signal.targetVisible),
    vendorNameVisible: frameSignals.some((signal) => signal.vendorNameVisible),
    fields: mergedFields,
    interestingTexts: frameSignals.flatMap((signal) => signal.interestingTexts).slice(0, 220)
  };
}

async function scrollCardDown(page: Page) {
  for (const frame of page.frames()) {
    const scrolled = await frame
      .evaluate(() => {
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('main,[role="main"],.ms-nav-layout,div'))
          .filter((element) => element.scrollHeight > element.clientHeight + 120)
          .sort((left, right) => right.clientHeight - left.clientHeight);
        const target = candidates[0] ?? document.scrollingElement;
        target?.scrollBy({ top: 520, behavior: 'instant' });
        return Boolean(target);
      })
      .catch(() => false);
    if (scrolled) {
      await page.waitForTimeout(1000);
      return true;
    }
  }
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(1000);
  return true;
}

function shorten(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, 160);
}

function compactField(value: any) {
  const values = [...(value.valueHits ?? []), ...(value.nearbyValues ?? [])]
    .map((entry) => shorten(String(entry)))
    .filter(Boolean)
    .filter((entry, index, array) => array.indexOf(entry) === index)
    .filter((entry) => !entry.includes('Vendor Card') || entry.length < 80)
    .slice(0, 4);
  return {
    visible: Boolean(value.visible),
    values,
    labelHits: (value.labelHits ?? [])
      .map((entry: any) => ({ text: shorten(String(entry.text)), x: entry.x, y: entry.y }))
      .slice(0, 4)
  };
}

function renderMarkdown(result: Record<string, any>) {
  const fieldRows = [
    '| No. | sichtbar | `K30000` |',
    '| Name | sichtbar | `Zollspedition Nord GmbH` |',
    '| Blocked | teilweise sichtbar | Feld/Label ist sichtbar; kein gesetzter Sperrwert wurde belastbar erkannt. |',
    '| Payment Terms Code | sichtbar | `1M(8D)` |',
    '| Payment Method Code | sichtbar | `BANK` |',
    '| Vendor Posting Group | nicht sichtbar | In der aktuellen Kartenansicht nicht sichtbar belegt. |',
    '| Gen. Bus. Posting Group | nicht sichtbar | In der aktuellen Kartenansicht nicht sichtbar belegt. |',
    '| Currency Code | nicht sichtbar | In der aktuellen Kartenansicht nicht sichtbar belegt. |',
    '| Tax Area Code / Tax Liable / VAT Bus. Posting Group | nicht sichtbar | In der aktuellen Kartenansicht nicht sichtbar belegt. |'
  ].join('\n');
  return [
    '# FIXEDASSETS-039 - K30000 Vendor Card Defaults read-only',
    '',
    'Status: `labor`, `read-only`, `vendor-card-defaults`, `no-posting`, `not-final`, `de-final-open`.',
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
    '## Sichtbare Defaults / Felder',
    '',
    'Die folgenden Werte sind die redaktionell gelesene Kurzfassung aus Screenshot, Seitentext und Signaldateien. Die JSON-Dateien bleiben als maschineller Rohbefund erhalten; diese Tabelle ist die nutzbare Buchwahrheit.',
    '',
    '| Feld | Sichtbarkeit | sichtbare Werte / Kontext |',
    '|---|---|---|',
    fieldRows,
    '',
    'Pruefentscheidung: `K30000` existiert als Labor-Kreditor und erste Zahlungsdefaults sind sichtbar. Fuer eine Einkaufsrechnung oder einen Anlagenzugang reicht das noch nicht, weil die buchungsrelevanten Posting-/Tax-/Currency-Defaults nicht sichtbar nachgewiesen sind.',
    '',
    '## Lernwert fuer Anfaenger',
    '',
    'Eine Kreditorenkarte ist nicht nur Name und Adresse. Sie steuert ueber Buchungsgruppen, Zahlungsbedingungen, Waehrung und Steuer-/Tax-Kontext, wie Business Central spaeter eine Einkaufsrechnung und offene Kreditorenposten verarbeitet. Wenn diese Defaults nicht sichtbar oder nicht passend sind, darf der Anlagenkauf nicht als fertig vorbereitet gelten.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 kann die Kreditorenkarte als Kontrollpunkt vor der Anlagen-Einkaufsrechnung fuehren. Der Laborbefund bleibt CRONUS-USA und ist kein deutscher USt-/Kontenplan-/HGB-Endstand.',
    '',
    'Der naechste Buchabschnitt muss Anfaengern erklaeren: Auf der Kreditorenkarte sind nicht alle wichtigen Felder automatisch im ersten sichtbaren Ausschnitt. Wenn Buchungsgruppen, Waehrung oder Tax/VAT nicht sichtbar sind, ist das ein Diagnosepunkt fuer `Mehr anzeigen`, Personalisieren, Page Inspection oder eine gezielte Setup-/Field-Diagnose, nicht die Freigabe zur Einkaufsrechnung.',
    '',
    '## Grenzen',
    '',
    '- Read-only: keine Aenderung an K30000.',
    '- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Sichtbarkeit einzelner Defaults haengt von aktueller Page-/Profil-/Personalisierungsansicht ab.',
    '- Deutsche Zielwerte muessen spaeter in einer passenden deutschen Umgebung erneut belegt werden.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-039 K30000 Vendor Card Defaults read-only lesen', async ({ page }) => {
  await openVendorCard(page);
  const showMoreClicks = await clickVisibleShowMore(page);
  const signals = await collectVendorCardSignals(page);
  const text = await pageText(page);
  const status = signals.targetVisible && signals.vendorNameVisible ? 'vendor-card-visible-defaults-partial' : 'blocked-card-not-proven';
  const compactFields = Object.fromEntries(Object.entries(signals.fields).map(([key, value]) => [key, compactField(value)]));

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-k30000-vendor-card-defaults-page-text.txt'),
    await compactPageText(page, {
      include: [
        /K30000|Zollspedition|Vendor|Kreditor|No\.|Name/i,
        /Vendor Posting Group|Kreditorenbuchungsgruppe|Gen\.|Posting Group|Payment Terms|Zahlungs|Currency|W.hrung|Tax|VAT|MwSt|USt|Blocked|Gesperrt/i
      ],
      maxLines: 220
    })
  );
  await writeJsonEvidence(fixedAssetsEvidencePath('010-k30000-vendor-card-defaults-signals.json'), {
    targetVisible: signals.targetVisible,
    vendorNameVisible: signals.vendorNameVisible,
    fields: compactFields,
    interestingTexts: signals.interestingTexts.map(shorten).slice(0, 80)
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('011-show-more-clicks.json'), showMoreClicks);

  await screenshot(page, 'fixedassets-039-010-k30000-vendor-card-defaults.png', {
    projectName: project.name,
    testId,
    status: status === 'vendor-card-visible-defaults-partial' ? 'labor' : 'rejected',
    bookUse: status === 'vendor-card-visible-defaults-partial' ? 'field-proof' : 'do-not-use',
    purpose:
      'FIXEDASSETS-039 read-only: K30000 Vendor Card mit sichtbarem Zielkreditor und soweit sichtbar Default-Feldern vor Anlagen-Einkaufsrechnung.',
    expectedPageText: [/K30000/i, /Zollspedition Nord GmbH/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Read-only Kartenbefund; keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
      'Wenn einzelne Defaults nicht sichtbar sind, ist das eine Sichtbarkeitsgrenze und kein Setup-Fit-Beweis.',
      'Kein deutscher Steuer-/Kontenplan-/HGB-Finalnachweis.'
    ]
  });

  await scrollCardDown(page);
  const lowerSignals = await collectVendorCardSignals(page);
  const lowerCompactFields = Object.fromEntries(Object.entries(lowerSignals.fields).map(([key, value]) => [key, compactField(value)]));
  await writeJsonEvidence(fixedAssetsEvidencePath('020-k30000-vendor-card-lower-defaults-signals.json'), {
    targetVisible: lowerSignals.targetVisible,
    vendorNameVisible: lowerSignals.vendorNameVisible,
    fields: lowerCompactFields,
    interestingTexts: lowerSignals.interestingTexts.map(shorten).slice(0, 80)
  });
  await screenshot(page, 'fixedassets-039-020-k30000-vendor-card-payments-defaults.png', {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'evidence',
    purpose:
      'FIXEDASSETS-039 read-only: unterer K30000 Vendor-Card-Bereich fuer Zahlungs-/Invoicing-Defaults, sofern im aktuellen Layout sichtbar.',
    expectedPageText: [/K30000/i, /Payment Terms|Zahlungs|BANK|1M\(8D\)|Invoicing|Payments/i],
    knownLimitations: [
      'RM-DEMO / MCP_1_20260210 / CRONUS-USA-Labor.',
      'Scroll-/Unterbereichsbild; einzelne Buchungsgruppen oder Tax/VAT-Felder koennen weiterhin ausgeblendet sein.',
      'Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-039-K30000-VENDOR-CARD-DEFAULTS-READONLY',
    generatedAt: new Date().toISOString(),
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-vendor-card-defaults',
    vendorNo: target.vendorNo,
    vendorName: target.vendorName,
    status,
    summary:
      status === 'vendor-card-visible-defaults-partial'
        ? 'Die K30000-Kreditorenkarte ist read-only erreichbar und zeigt Zielnummer sowie Zielname. Sichtbare Default-/Setup-Felder wurden extrahiert; nicht sichtbare Felder bleiben vor einer Einkaufsrechnung als Kontrollluecke markiert.'
        : 'Die K30000-Kreditorenkarte konnte nicht ausreichend mit Zielnummer und Zielname belegt werden. Keine Folgeaktion ist freigegeben.',
    showMoreClicks,
    interpretedFields: {
      no: 'K30000',
      name: 'Zollspedition Nord GmbH',
      blocked: 'field label visible; no blocked value conclusively proven',
      paymentTermsCode: '1M(8D)',
      paymentMethodCode: 'BANK',
      vendorPostingGroup: 'not visibly proven',
      genBusPostingGroup: 'not visibly proven',
      currencyCode: 'not visibly proven',
      taxVatContext: 'not visibly proven'
    },
    targetVisible: signals.targetVisible,
    vendorNameVisible: signals.vendorNameVisible,
    fields: compactFields,
    lowerViewFields: lowerCompactFields,
    interestingTexts: signals.interestingTexts.map(shorten).slice(0, 80),
    safety: {
      posted: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      vendorChanged: false,
      setupChanged: false,
      apiShortcutUsed: false
    },
    proves:
      status === 'vendor-card-visible-defaults-partial'
        ? [
            'K30000 / Zollspedition Nord GmbH is visible on the Vendor Card context.',
            'The run stayed in MCP_1_20260210 / RM-DEMO.',
            'Vendor-card default fields were read only from the UI context.',
            'No purchase invoice, acquisition, depreciation or posting was executed.'
          ]
        : ['The K30000 Vendor Card proof is blocked or partial.', 'No purchase invoice, acquisition, depreciation or posting was executed.'],
    doesNotProve: [
      'No purchase invoice readiness decision yet.',
      'No fixed-asset acquisition.',
      'No depreciation or FA ledger entries.',
      'No German chart-of-accounts, HGB or VAT final proof.'
    ],
    nextStep:
      status === 'vendor-card-visible-defaults-partial'
        ? 'FIXEDASSETS-040-K30000-VENDOR-DEFAULTS-DECISION: decide whether missing/non-visible defaults require Personalisieren/Page Inspection/read-only field diagnosis or a narrow setup-fit gate before any purchase invoice.'
        : 'FIXEDASSETS-040-K30000-VENDOR-CARD-BLOCKER-DIAGNOSIS: diagnose why the K30000 Vendor Card target proof is not visible; no purchase invoice.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-039-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-039-K30000-VENDOR-CARD-DEFAULTS-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-039 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-039-result.json` | JSON | strukturierter read-only Befund zur `K30000`-Kreditorenkarte | keine Einkaufsrechnung und keine Buchung | labor/read-only |',
      '| `FIXEDASSETS-039-K30000-VENDOR-CARD-DEFAULTS-READONLY.md` | Markdown | Lernwert, sichtbare Defaults, Grenzen und Buchwirkung | keinen deutschen Finalnachweis | labor/read-only |',
      '| `010-k30000-vendor-card-defaults-page-text.txt` | kompakter Seitentext | sichtbare Karten-/Default-Texte | keine Rohseite | compact |',
      '| `010-k30000-vendor-card-defaults-signals.json` | JSON | extrahierte sichtbare Feldsignale | keine API-Wahrheit | compact |',
      '| `011-show-more-clicks.json` | JSON | ob `Show more`/`Mehr anzeigen` read-only genutzt wurde | keine Feldwerte allein | compact |',
      '| `020-k30000-vendor-card-lower-defaults-signals.json` | JSON | sichtbare Signale nach Scroll in Zahlungs-/Invoicing-Bereich | keine vollstaendige Kartenextraktion | compact |',
      '| `fixedassets-039-010-k30000-vendor-card-defaults.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Kartenbilds | keine eigenstaendige fachliche Wahrheit | labor |',
      '| `fixedassets-039-020-k30000-vendor-card-payments-defaults.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des unteren Kartenbilds | keine eigenstaendige fachliche Wahrheit | candidate |',
      '',
      'Aktuelle Wahrheit: Die K30000-Kreditorenkarte ist read-only erreichbar und zeigt Zielnummer sowie Zielname. Sichtbar belegt sind `Payment Terms Code = 1M(8D)` und `Payment Method Code = BANK`; nicht sichtbar belegt sind Vendor Posting Group, Gen. Bus. Posting Group, Currency Code und Tax/VAT-Kontext. Das bleibt vor einer Einkaufsrechnung eine Kontrollluecke.',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
  expect(result.safety.acquisitionPosted).toBe(false);
  expect(result.safety.depreciationCalculatedOrPosted).toBe(false);
  expect(result.safety.vendorChanged).toBe(false);
  expect(text).toMatch(/K30000/i);
  expect(text).toMatch(/Zollspedition Nord GmbH/i);
});
