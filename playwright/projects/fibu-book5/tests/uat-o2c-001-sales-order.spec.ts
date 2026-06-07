import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { addSalesOrderItemLine, cleanupSalesOrdersByCustomer, createSalesOrder } from '../../../core/bc-api';
import {
  buildFinancialTargetVsLaborDelta,
  evidencePath,
  renderFinancialTargetVsLaborDeltaMarkdown,
  writeJsonEvidence,
  writeTextEvidence
} from '../../../core/evidence';
import {
  bcPageUrl,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

type O2CTestData = {
  id?: string;
  customerNo: string;
  customerName: string;
  itemNo: string;
  quantity: number;
  unitPrice: number;
  currencyCode: string;
  vatPercent: number;
  expectedVatAmount: number;
  expectedGrossAmount: number;
  locationCode: string;
  searchTerms?: {
    salesOrders?: string[];
  };
  dimensions: Record<string, string>;
};

async function loadTestData() {
  const filePath = path.resolve('playwright/projects/fibu-book5/testdata/sales/uat-o2c-001.json');
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as O2CTestData;
}

function o2cEvidencePath(fileName: string) {
  return evidencePath(project.name, 'uat-o2c-001', fileName);
}

function o2cScreenshotOptions(
  status: 'labor' | 'candidate' | 'final' | 'rejected',
  purpose: string,
  expectedPageText: RegExp[],
  knownLimitations: string[],
  bookUse: 'navigation' | 'process-proof' | 'field-proof' | 'evidence' | 'do-not-use'
) {
  return {
    projectName: project.name,
    testId: 'uat-o2c-001',
    status,
    purpose,
    expectedPageText,
    knownLimitations,
    bookUse
  };
}

async function createSalesOrderByApi(page: Page, data: O2CTestData) {
  return createSalesOrder(page, {
    companyName: project.defaultCompany,
    customerNumber: data.customerNo,
    externalDocumentNumber: `UAT-O2C-001-${Date.now()}`
  });
}

async function addSalesLineByOrderNumber(page: Page, orderNumber: string, data: O2CTestData) {
  return addSalesOrderItemLine(page, {
    companyName: project.defaultCompany,
    orderNumber,
    itemNo: data.itemNo,
    locationCode: data.locationCode,
    quantity: data.quantity,
    unitPrice: data.unitPrice
  });
}

async function writeO2CTargetVsLaborDelta(
  data: O2CTestData,
  lineEvidence: {
    order: { currencyCode?: string };
    line: {
      taxCode?: string;
      taxPercent?: number;
      amountExcludingTax?: number;
      totalTaxAmount?: number;
      amountIncludingTax?: number;
    };
  },
  dimensions: Record<string, string>
) {
  const targetVsLaborDelta = buildFinancialTargetVsLaborDelta(data, {
    currencyCode: lineEvidence.order.currencyCode,
    taxCode: lineEvidence.line.taxCode,
    taxPercent: lineEvidence.line.taxPercent,
    netAmount: lineEvidence.line.amountExcludingTax,
    vatAmount: lineEvidence.line.totalTaxAmount,
    grossAmount: lineEvidence.line.amountIncludingTax,
    dimensions
  });
  await writeJsonEvidence(o2cEvidencePath('045-target-vs-labor-delta.json'), targetVsLaborDelta);
  await writeTextEvidence(
    o2cEvidencePath('045-target-vs-labor-delta.md'),
    renderFinancialTargetVsLaborDeltaMarkdown(
      targetVsLaborDelta,
      `${data.id ?? 'UAT-O2C-001'} Zielmodell vs. CRONUS-Labor`
    )
  );

  return targetVsLaborDelta;
}

async function writeO2CLabLearningSummary(
  data: O2CTestData,
  lineEvidence: {
    order: {
      number?: string;
      currencyCode?: string;
      totalAmountExcludingTax?: number;
      totalTaxAmount?: number;
      totalAmountIncludingTax?: number;
    };
    item: {
      number?: string;
      generalProductPostingGroupCode?: string;
      inventoryPostingGroupCode?: string;
      taxGroupCode?: string;
      baseUnitOfMeasureCode?: string;
    };
    line: {
      lineObjectNumber?: string;
      quantity?: number;
      unitPrice?: number;
      taxCode?: string;
      taxPercent?: number;
      amountExcludingTax?: number;
      totalTaxAmount?: number;
      amountIncludingTax?: number;
    };
    orderDimensionSetLines: unknown;
  },
  dimensions: Record<string, string>,
  lineDimensionEvidence: { hasTargetDimension: boolean }
) {
  const orderDimensions = Object.entries(dimensions)
    .map(([dimensionCode, dimensionValue]) => `${dimensionCode}=${dimensionValue}`)
    .join(', ');

  await writeTextEvidence(
    o2cEvidencePath('046-o2c-lab-learning-summary.md'),
    [
      '# UAT-O2C-001 Labor-Lernzusammenfassung',
      '',
      '| Punkt | Erklaerung |',
      '|---|---|',
      `| Situation | Verkaufsauftrag ${lineEvidence.order.number ?? ''} fuer Debitor ${data.customerNo}, Artikel ${data.itemNo}, Menge ${data.quantity}, Lagerort ${data.locationCode}. |`,
      `| Waehrung | Der Auftrag laeuft im aktuellen Labor mit ${lineEvidence.order.currencyCode ?? 'leer'}. Das entspricht jetzt dem Buchziel ${data.currencyCode}. |`,
      `| Betrag | Netto ${lineEvidence.line.amountExcludingTax ?? ''}, Steuer ${lineEvidence.line.totalTaxAmount ?? ''}, Brutto ${lineEvidence.line.amountIncludingTax ?? ''}. |`,
      `| Steuer-/Tax-Logik | Die Verkaufszeile nutzt Tax Code ${lineEvidence.line.taxCode ?? 'leer'} mit ${lineEvidence.line.taxPercent ?? 'leer'} %. Das ist CRONUS-USA-Sales-Tax-Logik und kein deutscher 19-%-USt-Nachweis. |`,
      `| Artikel-Posting | Artikel ${lineEvidence.item.number ?? data.itemNo} traegt Base Unit ${lineEvidence.item.baseUnitOfMeasureCode ?? 'leer'}, Gen. Prod. Posting Group ${lineEvidence.item.generalProductPostingGroupCode ?? 'leer'}, Inventory Posting Group ${lineEvidence.item.inventoryPostingGroupCode ?? 'leer'} und Tax Group ${lineEvidence.item.taxGroupCode ?? 'leer'}. |`,
      `| Dimensionen | Die Evidence weist ${orderDimensions || 'keine Dimensionen'} nach. Wichtig: CHANNEL kommt aus dem Auftragskontext; PRODUCTLINE=MACHINE wird im Zeilen-Dimensionsdialog ${lineDimensionEvidence.hasTargetDimension ? 'sichtbar nachgewiesen' : 'noch nicht sichtbar nachgewiesen'}. |`,
      '| Warum BC so reagiert | Business Central berechnet Betrag, Steuer und Konten nicht aus einem einzelnen Feld. Debitor, Artikel, Buchungsgruppen, Steuergruppen, Lagerort und Dimensionen wirken zusammen. |',
      '| Anfaengerpruefung | Vor dem Buchen Kopf, Zeile, EUR-Summen, Tax/VAT-Ergebnis, Lagerort und Dimensionsdialog pruefen. Wenn Steuer 0 % bleibt, nicht als deutschen Zielbeleg buchen. |',
      '| Buchwirkung | Das Buch darf den aktuellen Lauf als Klickpfad- und Lernnachweis verwenden. Der deutsche 19-%-USt-Endstand bleibt future-de-final. |',
      ''
    ].join('\n')
  );
}

function dimensionMapFromApiResult(result: unknown) {
  if (!result || typeof result !== 'object' || !('ok' in result) || result.ok !== true || !Array.isArray(result.value)) {
    return {};
  }

  return Object.fromEntries(
    result.value
      .map((entry: Record<string, unknown>) => {
        const dimensionCode = entry.code ?? entry.dimensionCode;
        const dimensionValueCode = entry.valueCode ?? entry.dimensionValueCode;
        return typeof dimensionCode === 'string' && typeof dimensionValueCode === 'string'
          ? [dimensionCode, dimensionValueCode]
          : undefined;
      })
      .filter((entry): entry is [string, string] => Boolean(entry))
  );
}

async function openSalesOrderCard(page: Page, orderNumber: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '42');
  url.searchParams.set('filter', `'Sales Header'.'No.' IS '${orderNumber}'`);

  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await expect.poll(async () => pageText(page), { timeout: 90_000 }).toMatch(new RegExp(orderNumber));
}

async function settleForBookScreenshot(page: Page) {
  await page.waitForTimeout(1_000);
}

async function scrollSalesLinesForBookScreenshot(page: Page, targetScrollLeft: number, evidenceFileName: string) {
  const frameResults = [];
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((targetScrollLeft) => {
        const elements = [...document.querySelectorAll<HTMLElement>('*')];
        const candidates = elements
          .filter((element) => element.scrollWidth > element.clientWidth + 40 && element.clientWidth > 200)
          .map((element, index) => {
            const before = element.scrollLeft;
            element.scrollLeft = Math.min(targetScrollLeft, element.scrollWidth);
            element.dispatchEvent(new Event('scroll', { bubbles: true }));
            return {
              index,
              tagName: element.tagName,
              className: element.className,
              role: element.getAttribute('role'),
              before,
              after: element.scrollLeft,
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
              textSample: element.innerText?.replace(/\s+/g, ' ').slice(0, 180) ?? ''
            };
          })
          .filter((entry) => entry.after !== entry.before)
          .sort((left, right) => right.scrollWidth - left.scrollWidth)
          .slice(0, 12);

        return candidates;
      }, targetScrollLeft)
      .catch(() => []);

    if (result.length) {
      frameResults.push({ url: frame.url(), scrolledContainers: result });
    }
  }

  await writeJsonEvidence(o2cEvidencePath(evidenceFileName), frameResults);
  await page.waitForTimeout(1_000);
}

async function clickFirstVisibleAction(page: Page, name: RegExp) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    for (const role of ['button', 'menuitem', 'tab'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await locator.click({ timeout: 3000 });
        await page.waitForTimeout(1_500);
        return true;
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      await textLocator.click({ timeout: 3000 });
      await page.waitForTimeout(1_500);
      return true;
    }
  }

  return false;
}

async function captureSalesLineDimensionEvidence(page: Page, data: O2CTestData) {
  const result: {
    selectedLine: boolean;
    openedLineActions: boolean;
    openedRelatedInformation: boolean;
    clickedDimensions: boolean;
    hasTargetDimension: boolean;
    targetDimensions: Record<string, string>;
    notes: string[];
  } = {
    selectedLine: false,
    openedLineActions: false,
    openedRelatedInformation: false,
    clickedDimensions: false,
    hasTargetDimension: false,
    targetDimensions: data.dimensions,
    notes: []
  };

  result.selectedLine = true;
  result.notes.push('Zeile gilt nach dem vorangehenden Screenshot als fokussiert; Artikelnummer wird nicht geklickt, weil sie als Drilldown-Link zur Artikelkarte wirken kann.');

  result.openedLineActions = await clickFirstVisibleAction(page, /^Line$/i);
  await writeTextEvidence(o2cEvidencePath('050-line-actions-page-text.txt'), await pageText(page));

  if (!result.openedLineActions) {
    result.notes.push('Aktionstab Line konnte nicht geoeffnet werden.');
    await writeJsonEvidence(o2cEvidencePath('050-line-dimension-dialog-result.json'), result);
    return result;
  }

  result.clickedDimensions = await clickFirstVisibleAction(page, /^Dimensions$|^Dimensionen$/i);
  if (!result.clickedDimensions) {
    result.openedRelatedInformation = await clickFirstVisibleAction(page, /^Related Information$|^Zugehoerige Informationen$|^Zugehörige Informationen$/i);
    await writeTextEvidence(o2cEvidencePath('050-line-related-information-page-text.txt'), await pageText(page));

    if (result.openedRelatedInformation) {
      result.clickedDimensions = await clickFirstVisibleAction(page, /^Dimensions$|^Dimensionen$/i);
    }
  }
  await writeTextEvidence(o2cEvidencePath('050-line-dimension-dialog-page-text.txt'), await pageText(page));

  if (!result.clickedDimensions) {
    result.notes.push('Dimensionsaktion in den Line-Aktionen oder unter Related Information nicht gefunden.');
    await writeJsonEvidence(o2cEvidencePath('050-line-dimension-dialog-result.json'), result);
    return result;
  }

  await expect.poll(async () => pageText(page), { timeout: 30_000 }).toMatch(/Dimension|Dimensionen/i);
  const dimensionDialogText = await pageText(page);
  result.hasTargetDimension = Object.entries(data.dimensions).every(
    ([dimensionCode, dimensionValue]) =>
      new RegExp(dimensionCode, 'i').test(dimensionDialogText) && new RegExp(dimensionValue, 'i').test(dimensionDialogText)
  );

  if (!result.hasTargetDimension) {
    result.notes.push('Dimensionsdialog wurde geoeffnet, Ziel-Dimension aber nicht im Seitentext nachgewiesen.');
  }

  await screenshot(
    page,
    'uat-o2c-001-050-dimension-productline-machine.png',
    o2cScreenshotOptions(
      result.hasTargetDimension ? 'candidate' : 'rejected',
      'Dimensionsdialog oder Dimensionskontext der Verkaufszeile fuer PRODUCTLINE-Nachweis.',
      [/Dimension|Dimensionen/i],
      result.hasTargetDimension
        ? ['Laborbild; finaler deutscher Lauf spaeter erneut erforderlich.']
        : ['Dialog/Kontext enthaelt noch keinen sichtbaren Nachweis fuer PRODUCTLINE = MACHINE.'],
      result.hasTargetDimension ? 'field-proof' : 'do-not-use'
    )
  );
  await writeJsonEvidence(o2cEvidencePath('050-line-dimension-dialog-result.json'), result);

  return result;
}

function primarySearchTerm(data: O2CTestData, key: 'salesOrders', fallback: string) {
  return data.searchTerms?.[key]?.[0] ?? fallback;
}

function searchTermPattern(data: O2CTestData, key: 'salesOrders', fallback: RegExp) {
  const terms = data.searchTerms?.[key]?.filter(Boolean) ?? [];
  if (!terms.length) {
    return fallback;
  }

  return new RegExp(terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
}

test('UAT-O2C-001 Verkaufsauftrag starten und Lern-Screenshots erzeugen', async ({ page }) => {
  const data = await loadTestData();
  let currentOrderNumber: string | undefined;
  const salesOrdersSearchTerm = primarySearchTerm(data, 'salesOrders', 'Sales Orders');
  const salesOrdersPattern = searchTermPattern(data, 'salesOrders', /Sales Orders|Verkaufsauftr/i);

  try {
    await page.goto(requireBcUrl(project.envPrefix));
    await waitForBusinessCentralShell(page);

    await searchFor(page, salesOrdersSearchTerm);
    await screenshot(
      page,
      'uat-o2c-001-010-suche-verkaufsauftraege.png',
      o2cScreenshotOptions(
        'labor',
        'Tell-Me-Suche als Anfaenger-Einstieg in die Verkaufsauftragsliste.',
        [salesOrdersPattern],
        ['Gemischtsprachiger Laborlauf; finales Buchbild spaeter mit deutschem Suchbegriff erzeugen.'],
        'navigation'
      )
    );

    // The Tell-Me search is a useful beginner screenshot, but direct page IDs
    // are more reproducible for long screenshot production runs.
    await page.goto(bcPageUrl(9305, project.envPrefix));
    await waitForBusinessCentralShell(page);
    await settleForBookScreenshot(page);
    await screenshot(
      page,
      'uat-o2c-001-020-liste-verkaufsauftraege.png',
      o2cScreenshotOptions(
        'labor',
        'Sales-Orders-Liste als Navigation zu offenen Verkaufsauftraegen.',
        [salesOrdersPattern],
        ['Zeigt vorhandene CRONUS-Auftraege, nicht den Buchfall D10000. Nur Navigationsbild.'],
        'navigation'
      )
    );

    await expect.poll(async () => pageText(page), { timeout: 20_000 }).toMatch(salesOrdersPattern);

    const order = await createSalesOrderByApi(page, data);
    currentOrderNumber = order.number;
    await writeJsonEvidence(o2cEvidencePath('030-kopf-debitor-d10000-api-result.json'), order);

    await openSalesOrderCard(page, currentOrderNumber);
    await settleForBookScreenshot(page);
    await screenshot(
      page,
      'uat-o2c-001-030-kopf-debitor-d10000.png',
      o2cScreenshotOptions(
        'candidate',
        'Auftragskopf mit Debitor D10000 als Prozess- und Feldnachweis.',
        [/Sales Order|Verkaufsauftrag/i, /D10000|Mueller Maschinenbau/i, new RegExp(currentOrderNumber!)],
        ['Document-Check-Leiste und Copilot-Zusammenfassung sind noch sichtbar.'],
        'process-proof'
      )
    );

    const text = await pageText(page);
    await writeTextEvidence(o2cEvidencePath('030-kopf-debitor-d10000-page-text.txt'), text);

    await expect(text).toMatch(/Sales Order|Verkaufsauftrag|Customer|Debitor|Sell-to/i);
    await expect(text).toMatch(/D10000|Mueller Maschinenbau/i);
    expect(currentOrderNumber).toBeTruthy();

    const lineEvidence = await addSalesLineByOrderNumber(page, currentOrderNumber!, data);
    await writeJsonEvidence(o2cEvidencePath('040-zeile-artikel-rm-m100-api-result.json'), lineEvidence);
    const orderDimensions = dimensionMapFromApiResult(lineEvidence.orderDimensionSetLines);
    await writeO2CTargetVsLaborDelta(data, lineEvidence, orderDimensions);

    await openSalesOrderCard(page, currentOrderNumber!);
    await expect.poll(async () => pageText(page), { timeout: 90_000 }).toMatch(
      /RM-M100|Standardmaschine|68\.000|68000/i
    );
    const factBoxHiddenForLineScreenshots = await hideFactBoxPane(page);
    await writeJsonEvidence(o2cEvidencePath('039-factbox-hidden-result.json'), {
      factBoxHiddenForLineScreenshots,
      reason:
        'Fuer breite Verkaufszeilenbilder wird die rechte Infobox/FactBox eingeklappt, damit Menge, Steuer- und Betragsspalten besser sichtbar werden.'
    });
    await settleForBookScreenshot(page);
    await screenshot(
      page,
      'uat-o2c-001-040-zeile-artikel-rm-m100.png',
      o2cScreenshotOptions(
        'rejected',
        'Laborbild der Verkaufszeile mit Artikel RM-M100.',
        [/RM-M100/i, /Standardmaschine/i, /FRA-ZL/i, /68\.000|68000/i],
        [
          'FactBox wird fuer mehr Tabellenbreite gezielt eingeklappt.',
          'Dimension wird separat im Dimensionsdialog nachgewiesen.',
          'Bild ist Labor-Evidence, aber kein finales Buchbild.'
        ],
        'field-proof'
      )
    );

    await scrollSalesLinesForBookScreenshot(page, 900, '041-horizontal-scroll-diagnostics.json');
    await screenshot(
      page,
      'uat-o2c-001-041-zeile-betraege-steuer.png',
      o2cScreenshotOptions(
        'labor',
        'Zweiter Tabellenzustand nach horizontalem Scroll zur Pruefung von Betrag und Steuergruppe.',
        [/FURNITURE/i, /68\.000|68000/i],
        [
          'DOM-Scroll ueber freeze-pane-scrollbar zeigt Tax Group und Betraege im Laborbild.',
          'CRONUS-Steuergruppe FURNITURE und 0-%-Tax sind kein deutscher 19-%-USt-Nachweis.',
          'Dimension PRODUCTLINE ist in diesem Tabellenbild nicht sichtbar; der Test weist sie separat im Dimensionsdialog nach.'
        ],
        'field-proof'
      )
    );

    await scrollSalesLinesForBookScreenshot(page, 2600, '042-horizontal-scroll-diagnostics.json');
    await screenshot(
      page,
      'uat-o2c-001-042-zeile-spaete-spalten.png',
      o2cScreenshotOptions(
        'rejected',
        'Kontrollbild am rechten Ende des Zeilengrids zur Bewertung der horizontalen Scrollstrategie.',
        [/Department|Customergroup|Shipment Date/i],
        [
          'Zeigt, dass DOM-Scroll grundsaetzlich funktioniert, aber nicht automatisch die fachlich gesuchten Steuer-/Betragsspalten trifft.',
          'Nicht als Buchbild verwenden.'
        ],
        'do-not-use'
      )
    );

    const lineText = await pageText(page);
    await writeTextEvidence(o2cEvidencePath('040-zeile-artikel-rm-m100-page-text.txt'), lineText);
    await expect(lineText).toMatch(/RM-M100|Standardmaschine|68\.000|68000/i);

    const lineDimensionEvidence = await captureSalesLineDimensionEvidence(page, data);
    await writeO2CLabLearningSummary(
      data,
      lineEvidence,
      {
        ...orderDimensions,
        ...(lineDimensionEvidence.hasTargetDimension ? data.dimensions : {})
      },
      lineDimensionEvidence
    );
    await writeO2CTargetVsLaborDelta(data, lineEvidence, {
      ...orderDimensions,
      ...(lineDimensionEvidence.hasTargetDimension ? data.dimensions : {})
    });
  } finally {
    const cleanup = await cleanupSalesOrdersByCustomer(page, {
      companyName: project.defaultCompany,
      customerNumber: data.customerNo
    });
    await writeJsonEvidence(o2cEvidencePath('999-cleanup.json'), { currentOrderNumber, cleanup });
  }
});
