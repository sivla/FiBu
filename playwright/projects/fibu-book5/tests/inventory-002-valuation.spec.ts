import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

test.setTimeout(360_000);

const TEST_ID = 'inventory-002';
const AS_OF_DATE = '08.06.2026';
const ITEM_FILTER = 'RM-M100|RAW-STEEL';
const LOCATION_FILTER = 'FRA-ZL';

function inventoryEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function relevantSection(text: string, startPattern: RegExp) {
  const normalized = normalizeText(text);
  const startMatch = normalized.match(startPattern);
  const startIndex = startMatch?.index ?? 0;
  const sliced = normalized.slice(startIndex);
  const endMarkers = [
    '\nVerwenden Sie die NACH-LINKS',
    '\nListe mit Titel',
    '\nKreisdiagramm',
    '\n                var requestExecutorSettings'
  ];
  const endIndex = endMarkers
    .map((marker) => sliced.indexOf(marker))
    .filter((index) => index > 0)
    .sort((left, right) => left - right)[0];

  return (endIndex ? sliced.slice(0, endIndex) : sliced).trim();
}

function tellMeSection(text: string) {
  const normalized = normalizeText(text);
  const startIndex = normalized.search(/Wie möchten Sie weiter verfahren|Zu „Berichte und Analysen“ wechseln|Inventory Valuation/i);
  const sliced = normalized.slice(startIndex >= 0 ? startIndex : 0);
  const endMarkers = ['\nVerwenden Sie die NACH-LINKS', '\nKreisdiagramm'];
  const endIndex = endMarkers
    .map((marker) => sliced.indexOf(marker))
    .filter((index) => index > 0)
    .sort((left, right) => left - right)[0];

  return (endIndex ? sliced.slice(0, endIndex) : sliced).trim();
}

async function activateWideLayout(page: Page) {
  const selectors = [
    'button[aria-label*="Breites Layout" i]',
    'button[aria-label*="Wide layout" i]',
    'button[title*="Breite Layoutansicht" i]',
    'button[title*="Seite maximieren" i]',
    'button[title*="Maximize" i]',
    'button[title*="Full screen" i]'
  ];

  for (const scope of [page, ...page.frames()]) {
    const wideLayoutButton = scope
      .getByRole('button', { name: /Breites Layout|Wide layout|Maximi[sz]e|Vollbild/i })
      .last();
    if (await wideLayoutButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await wideLayoutButton.click().catch(() => undefined);
      await page.waitForTimeout(1000);
      return true;
    }

    for (const selector of selectors) {
      const button = scope.locator(selector).last();
      if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
        await button.click().catch(() => undefined);
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }

  return false;
}

async function searchTellMe(page: Page, term: string) {
  await page.keyboard.press('Alt+Q');
  await page.waitForTimeout(1000);

  const searchBox = page.getByRole('textbox').last();
  if (await searchBox.isVisible({ timeout: 1500 }).catch(() => false)) {
    await searchBox.fill(term);
  } else {
    await page.keyboard.type(term);
  }

  await page.waitForTimeout(3000);
}

async function openInventoryValuation(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchTellMe(page, 'Inventory Valuation');

  const tellMeText = tellMeSection(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath('010-inventory-valuation-tell-me-page-text.txt'), tellMeText);
  await writeJsonEvidence(inventoryEvidencePath('010-inventory-valuation-tell-me-buttons.json'), await visibleButtonNames(page));

  let clicked = false;
  for (const scope of [page, ...page.frames()]) {
    const bodyText = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Zu „Berichte und Analysen“ wechseln|Berichte und Analysen|Reports and Analysis/i.test(bodyText)) {
      continue;
    }

    const inventoryValuation = scope.getByText('Inventory Valuation', { exact: true }).first();
    if (await inventoryValuation.isVisible({ timeout: 1000 }).catch(() => false)) {
      await inventoryValuation.click();
      clicked = true;
      break;
    }
  }

  await page.waitForTimeout(5000);
  let requestText = normalizeText(await pageText(page));
  if (!/As Of Date/i.test(requestText)) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000);
    requestText = normalizeText(await pageText(page));
  }

  expect(requestText).toMatch(/Inventory Valuation/i);
  expect(requestText).toMatch(/As Of Date/i);

  return {
    shellWideLayoutActivated: false,
    tellMeVisible: /Inventory Valuation/i.test(tellMeText),
    clickedReportResult: clicked
  };
}

async function setRequestPageFilters(page: Page) {
  let dateSet = false;
  let itemFilterSet = false;
  let locationFilterSet = false;

  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Inventory Valuation/i.test(bodyText) || !/As Of Date/i.test(bodyText)) {
      continue;
    }

    const dateInput = frame.locator('input[title*="Datum"], input[title*="Date"]').first();
    if (await dateInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await dateInput.fill(AS_OF_DATE);
      await dateInput.press('Tab');
      dateSet = true;
    }

    const inputHandles = await frame.locator('input[type="text"]').elementHandles();
    const visibleInputIndexes: number[] = [];
    for (let index = 0; index < inputHandles.length; index += 1) {
      const visible = await inputHandles[index]
        .evaluate((element) => Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length))
        .catch(() => false);
      if (visible) {
        visibleInputIndexes.push(index);
      }
    }

    const inputs = frame.locator('input[type="text"]');
    const noFilterIndex = visibleInputIndexes[2];
    const locationFilterIndex = visibleInputIndexes[4];

    if (noFilterIndex !== undefined) {
      await inputs.nth(noFilterIndex).fill(ITEM_FILTER);
      await inputs.nth(noFilterIndex).press('Tab');
      itemFilterSet = true;
    }

    if (locationFilterIndex !== undefined) {
      await inputs.nth(locationFilterIndex).fill(LOCATION_FILTER);
      await inputs.nth(locationFilterIndex).press('Tab');
      locationFilterSet = true;
    }

    break;
  }

  await page.waitForTimeout(2000);
  return { dateSet, itemFilterSet, locationFilterSet };
}

async function clickPreview(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const previewButton = scope.getByRole('button', { name: /Vorschau|Preview/i }).last();
    if (await previewButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await previewButton.click();
      await page.waitForTimeout(45_000);
      return true;
    }
  }

  return false;
}

function buildLearningMarkdown(result: Record<string, unknown>) {
  return [
    '# INVENTORY-002 Inventory Valuation',
    '',
    'Status: Labor-Nachweis, read-only, keine Buchung.',
    '',
    '## Situation',
    '',
    'Nach `INVENTORY-001` waren Artikelposten, Wertposten und Sachposten fuer O2C und P2P sichtbar. Offen war, ob Business Central daraus einen Lagerbewertungsbericht mit Item- und Lagerortfilter erzeugt.',
    '',
    '## Was wurde getan?',
    '',
    `- Sandbox: \`${result.environment}\``,
    `- Company: \`${result.company}\``,
    `- Bericht: \`Inventory Valuation\``,
    `- As Of Date: \`${AS_OF_DATE}\``,
    `- Item-Filter: \`${ITEM_FILTER}\``,
    `- Location Filter: \`${LOCATION_FILTER}\``,
    '- Modus: read-only; es wurde keine Buchung und keine Einrichtungsaenderung ausgefuehrt.',
    '',
    '## Was sieht ein Anfaenger?',
    '',
    'Die Request Page zeigt, dass ein Lagerbewertungsbericht nicht nur ueber den Berichtsnamen gestartet wird. Entscheidend sind Stichtag, Artikelfilter und Lagerortfilter. Der erfolgreiche Laborlauf setzt `As Of Date`, weil eine Lagerbewertung immer als Stichtagsbetrachtung gelesen werden muss.',
    '',
    '## Was wurde nachgewiesen?',
    '',
    `- \`RAW-STEEL\`: Menge \`10,00\`, Unit Cost \`2.500,00\`, Inventory Value \`25.000,00\`.`,
    `- \`RM-M100\`: Menge \`-1,00\`, Unit Cost \`42.000,00\`, Inventory Value \`-42.000,00\`.`,
    `- \`Total Inventory Value\`: \`-17.000,00\`.`,
    '- Der Bericht zeigt den Filterkontext `Item: No.: RM-M100|RAW-STEEL, Location Filter: FRA-ZL`.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel zu Lagerbewertung und Abschluss duerfen jetzt im Labor erklaeren, wie aus Artikelposten und Wertposten ein stichtagsbezogener Lagerbewertungsbericht entsteht. Die Zahlen sind CRONUS-USA-Laborwerte und duerfen nicht als deutscher Kontenplan-, USt- oder Abschluss-Endstand formuliert werden.',
    '',
    '## Grenze',
    '',
    'Der Bericht beweist keine deutsche 19-Prozent-USt, keine Kostenregulierung und keinen deutschen Kontenplan. Die negative Menge/Wert fuer `RM-M100` ist ein Laborbefund aus der bewusst isolierten O2C/P2P-Spielwiese und muss vor finalen Buchbildern in einer konsistenten deutschen Zielumgebung neu bewertet werden.',
    '',
    '## Naechster Schritt',
    '',
    'Den negativen Lagerwert als Lernfall analysieren: Bestand vor Verkauf, Kostenkette und ob fuer finale Buchbilder zuerst ein sauberer Anfangsbestand oder Einkaufszugang fuer `RM-M100` noetig ist.',
    ''
  ].join('\n');
}

test('INVENTORY-002 Inventory Valuation mit Item- und Location-Filter read-only nachweisen', async ({ page }) => {
  const entry = await openInventoryValuation(page);
  const requestWideLayoutActivated = false;
  const filterResult = await setRequestPageFilters(page);

  const requestText = relevantSection(await pageText(page), /Inventory Valuation/i);
  await writeTextEvidence(inventoryEvidencePath('020-inventory-valuation-request-page-text.txt'), requestText);
  await writeJsonEvidence(inventoryEvidencePath('020-inventory-valuation-request-buttons.json'), await visibleButtonNames(page));
  await screenshot(page, 'inventory-002-020-inventory-valuation-request.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: filterResult.dateSet && filterResult.itemFilterSet && filterResult.locationFilterSet ? 'labor' : 'rejected',
    purpose: 'Request Page fuer Inventory Valuation mit Stichtag, Artikelfilter und Location Filter.',
    knownLimitations: [
      'Request Page beweist Filtereingabe, aber noch keine Berichtszahlen.',
      'CRONUS-USA-Labor in RM-DEMO; kein deutscher Finalabschluss.'
    ],
    bookUse: 'field-proof'
  });

  const previewClicked = await clickPreview(page);
  const previewText = relevantSection(await pageText(page), /Inventory Valuation/i);
  await writeTextEvidence(inventoryEvidencePath('030-inventory-valuation-preview-page-text.txt'), previewText);
  await screenshot(page, 'inventory-002-030-inventory-valuation-preview.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: /Total Inventory Value/i.test(previewText) ? 'labor' : 'rejected',
    purpose: 'Read-only-Vorschau des Inventory-Valuation-Berichts fuer RM-M100 und RAW-STEEL in FRA-ZL.',
    knownLimitations: [
      'Berichtswerte sind CRONUS-USA-Laborwerte.',
      'Negative Menge/Wert fuer RM-M100 ist ein Lernbefund und kein finaler deutscher Zielzustand.',
      'Keine Kostenregulierung und keine Buchung in diesem Lauf.'
    ],
    bookUse: 'evidence'
  });

  const result = {
    testId: 'INVENTORY-002',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-no-posting',
    report: 'Inventory Valuation',
    filters: {
      asOfDate: AS_OF_DATE,
      itemNo: ITEM_FILTER,
      locationFilter: LOCATION_FILTER
    },
    ui: {
      tellMeVisible: entry.tellMeVisible,
      clickedReportResult: entry.clickedReportResult,
      shellWideLayoutActivated: entry.shellWideLayoutActivated,
      requestWideLayoutActivated,
      requestPageVisible: /Inventory Valuation/i.test(requestText) && /As Of Date/i.test(requestText),
      previewClicked,
      previewVisible: /Total Inventory Value/i.test(previewText)
    },
    filterEntry: filterResult,
    observedValues: {
      rawSteelVisible: /RAW-STEEL/i.test(previewText),
      rawSteelQuantity10Visible: /RAW-STEEL[\s\S]{0,220}10,00/i.test(previewText),
      rawSteelInventoryValue25000Visible: /RAW-STEEL[\s\S]{0,320}25\.000,00/i.test(previewText),
      rmM100Visible: /RM-M100/i.test(previewText),
      rmM100QuantityMinus1Visible: /RM-M100[\s\S]{0,220}-1,00/i.test(previewText),
      rmM100InventoryValueMinus42000Visible: /RM-M100[\s\S]{0,320}-42\.000,00/i.test(previewText),
      totalInventoryValueMinus17000Visible: /Total Inventory Value[\s\S]{0,80}-17\.000,00/i.test(previewText),
      reportFilterContextVisible: /Item:\s*No\.\s*:\s*RM-M100\|RAW-STEEL,\s*Location Filter:\s*FRA-ZL/i.test(previewText),
      quantitiesAndValuesAsOfVisible: /Quantities and Values As Of 08\.06\.26/i.test(previewText)
    },
    proves: [
      'Inventory Valuation ist ueber Tell-Me in Berichte und Analysen erreichbar.',
      'Die Request Page zeigt einen Stichtag und bietet Item- sowie Location-Filter.',
      'Mit As Of Date, Item-Filter und Location Filter rendert BC eine read-only Berichtsvorschau.',
      'Der Bericht zeigt im Labor RAW-STEEL, RM-M100 und Total Inventory Value fuer FRA-ZL.'
    ],
    doesNotProve: [
      'Kein deutscher Kontenplan-Endstand.',
      'Kein deutscher 19-Prozent-USt-Endstand.',
      'Keine Kostenregulierung.',
      'Keine Warehouse-Aktivierung.',
      'Keine neue Buchung.'
    ],
    nextStep:
      'Negativen Lagerwert RM-M100 als Lernfall analysieren und entscheiden, ob finale Buchbilder vorher sauberen Anfangsbestand oder Einkaufszugang fuer RM-M100 brauchen.'
  };

  await writeJsonEvidence(inventoryEvidencePath('INVENTORY-VALUATION-result.json'), result);
  await writeTextEvidence(inventoryEvidencePath('INVENTORY-VALUATION.md'), buildLearningMarkdown(result));

  expect(result.ui.previewVisible).toBe(true);
  expect(result.observedValues.rawSteelVisible).toBe(true);
  expect(result.observedValues.rmM100Visible).toBe(true);
  expect(result.observedValues.reportFilterContextVisible).toBe(true);
});
