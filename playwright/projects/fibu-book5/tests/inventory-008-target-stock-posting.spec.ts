import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  bcPageUrl,
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
  headless: true,
  viewport: { width: 1920, height: 1200 }
});

test.setTimeout(540_000);

const TEST_ID = 'inventory-008';
const PAGE_ID_ITEM_JOURNAL = 40;
const AS_OF_DATE = '08.06.2026';
const ITEM_FILTER = 'RM-M100|RAW-STEEL';
const LOCATION_FILTER = 'FRA-ZL';

type TargetStockPlan = {
  itemNo: string;
  locationCode: string;
  quantityToAdd: number;
  unitCost: number;
  expectedPositiveValue: number;
  expectedAfterCurrentOutflow: {
    remainingQuantity: number;
    remainingValue: number;
  };
  dimension: Record<string, string>;
};

type ControlHandle = {
  handle: import('@playwright/test').ElementHandle<HTMLElement>;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  value: string;
  title: string;
  text: string;
};

type TraceTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  imageFileName: string;
  labelPattern: RegExp;
};

function inventoryEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

async function loadTargetStockPlan() {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/inventory/rm-m100-target-stock-plan.json', 'utf8');
  return JSON.parse(raw) as TargetStockPlan;
}

async function openItemJournal(page: Page) {
  await page.goto(bcPageUrl(PAGE_ID_ITEM_JOURNAL, project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3500);
  await dismissTours(page);
  await ensureFactBoxVisible(page);
  await page.waitForTimeout(1000);
}

async function ensureFactBoxVisible(page: Page) {
  for (const frame of page.frames()) {
    const toggle = frame.getByRole('menuitemcheckbox', { name: /Infobox umschalten|Toggle FactBox|FactBox/i }).first();
    if (!(await toggle.isVisible({ timeout: 700 }).catch(() => false))) {
      continue;
    }

    const checked = await toggle.getAttribute('aria-checked').catch(() => undefined);
    if (checked === 'false') {
      await toggle.click();
      await page.waitForTimeout(1200);
      return true;
    }

    return true;
  }

  return false;
}

async function itemJournalFrame(page: Page) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
      if (/Item Journals/i.test(text) && /Batch Name/i.test(text)) {
        return frame;
      }
    }
    await page.waitForTimeout(1500);
  }
  throw new Error('Item-Journal-Frame nicht gefunden.');
}

async function firstLineControls(frame: Frame) {
  const handles = (await frame.locator('input,select').elementHandles()) as Array<import('@playwright/test').ElementHandle<HTMLElement>>;
  const controls: ControlHandle[] = [];

  for (const handle of handles) {
    const data = await handle
      .evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          visible: Boolean(rect.width && rect.height),
          tag: element.tagName,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          value: (element as HTMLInputElement | HTMLSelectElement).value ?? '',
          title: element.getAttribute('title') ?? '',
          text: element.textContent ?? ''
        };
      })
      .catch(() => undefined);

    if (!data?.visible || data.y < 250 || data.y > 430) {
      continue;
    }

    controls.push({
      handle,
      tag: data.tag,
      x: data.x,
      y: data.y,
      width: data.width,
      height: data.height,
      value: data.value,
      title: data.title,
      text: data.text
    });
  }

  return controls.sort((left, right) => left.x - right.x);
}

async function fillControl(control: ControlHandle, value: string) {
  if (control.tag === 'SELECT') {
    await control.handle.selectOption({ label: value }).catch(async () => {
      await control.handle.selectOption({ value });
    });
  } else {
    await control.handle.fill(value);
  }
  await control.handle.press('Tab').catch(() => undefined);
}

async function fillTargetLine(page: Page, target: TargetStockPlan) {
  const frame = await itemJournalFrame(page);
  const controls = await firstLineControls(frame);
  if (controls.length < 14) {
    throw new Error(`Zu wenige sichtbare Journal-Controls gefunden: ${controls.length}.`);
  }

  const documentNo = `INV008-${Date.now().toString().slice(-6)}`;
  await fillControl(controls[0], AS_OF_DATE);
  await fillControl(controls[1], 'Positive Adjmt.');
  await fillControl(controls[3], documentNo);
  await fillControl(controls[4], target.itemNo);
  await page.waitForTimeout(2000);
  await fillControl(controls[6], target.locationCode);
  await page.waitForTimeout(1000);
  await fillControl(controls[8], String(target.quantityToAdd));
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(7000);

  const controlSnapshotAfter = (await firstLineControls(frame)).map((control, index) => ({
    index,
    tag: control.tag,
    x: Math.round(control.x),
    y: Math.round(control.y),
    width: Math.round(control.width),
    height: Math.round(control.height),
    value: control.value,
    title: control.title,
    text: control.text.trim().slice(0, 80)
  }));
  const values = controlSnapshotAfter.map((control) => control.value);

  return {
    documentNo,
    controlSnapshotAfter,
    targetVisible:
      values.includes(documentNo) &&
      values.includes(target.itemNo) &&
      values.includes(target.locationCode) &&
      values.includes(String(target.quantityToAdd)),
    unitCostVisible: values.some((value) => /42[.,]000|42000/i.test(value)),
    amountVisible: values.some((value) => /84[.,]000|84000/i.test(value))
  };
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 1000 }).catch(() => false)) {
        await action.click().catch(() => undefined);
        await page.waitForTimeout(1800);
        return true;
      }
    }
  }
  return false;
}

async function clickVisibleRowOptions(frame: Frame) {
  const rowOptions = frame.getByRole('button', { name: /Weitere Optionen anzeigen|Show more options/i });
  const count = await rowOptions.count().catch(() => 0);
  for (let index = count - 1; index >= 0; index -= 1) {
    const option = rowOptions.nth(index);
    if (await option.isVisible({ timeout: 700 }).catch(() => false)) {
      await option.click();
      return true;
    }
  }

  return false;
}

async function clickRowOptionsByGeometry(frame: Frame) {
  return frame
    .evaluate(() => {
      const buttons = [...document.querySelectorAll<HTMLElement>('button')].filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.y > 280 && rect.y < 430 && rect.x > 430 && rect.x < 520;
      });
      const target =
        buttons.find((button) => /Weitere Optionen anzeigen|Show more options/i.test(button.getAttribute('aria-label') || button.getAttribute('title') || button.innerText || '')) ??
        buttons[0];
      if (!target) return false;
      target.click();
      return true;
    })
    .catch(() => false);
}

async function deleteCurrentLine(page: Page, frame: Frame) {
  const clickedOptions = (await clickVisibleRowOptions(frame)) || (await clickRowOptionsByGeometry(frame));
  if (!clickedOptions) {
    return false;
  }

  await page.waitForTimeout(800);
  const deleteMenu = frame.getByRole('menuitem', { name: /Zeile|Line/i }).filter({ hasText: /l.sch|delete/i }).first();
  if (!(await deleteMenu.isVisible({ timeout: 2000 }).catch(() => false))) {
    return false;
  }

  await deleteMenu.click();
  await page.waitForTimeout(1500);
  await clickAction(page, /^Yes$|^Ja$|^OK$/i);
  await page.waitForTimeout(3000);
  return true;
}

async function cleanupInventory008Drafts(page: Page) {
  const deletedDocuments: string[] = [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const frame = await itemJournalFrame(page).catch(() => undefined);
    if (!frame) {
      break;
    }

    const controls = await firstLineControls(frame);
    const values = controls.map((control) => control.value);
    const documentNo = values.find((value) => /^INV008-/.test(value));
    if (!documentNo) {
      break;
    }

    const deleted = await deleteCurrentLine(page, frame);
    if (!deleted) {
      break;
    }

    deletedDocuments.push(documentNo);
  }

  return deletedDocuments;
}

async function inspectJournalCheck(page: Page) {
  let text = '';
  let buttons: string[] = [];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press('Tab').catch(() => undefined);
    await page.waitForTimeout(2500);
    text = normalizeText(await pageText(page));
    buttons = await visibleButtonNames(page);

    const currentLineNoIssuesVisible = /Current\s+line\s+No\s+issues\s+found/i.test(text);
    const zeroIssuesTotalVisible =
      /0\s+Issues?\s+Total/i.test(text) || buttons.some((button) => /0\s+Issues?\s+Total/i.test(button));
    const savedVisible = /Gespeichert|Saved/i.test(text);
    const notSavedVisible = /Nicht gespeichert|Not saved/i.test(text);
    if (currentLineNoIssuesVisible && zeroIssuesTotalVisible && (savedVisible || !notSavedVisible)) {
      break;
    }
  }

  return {
    journalCheckVisible: /Journal Check/i.test(text) || buttons.some((button) => /Journal Check/i.test(button)),
    oneLineCheckedVisible:
      /1\s+Lines?\s+checked/i.test(text) || buttons.some((button) => /1\s+Lines?\s+checked/i.test(button)),
    zeroLinesWithIssuesVisible:
      /0\s+Lines?\s+with\s+issues/i.test(text) ||
      buttons.some((button) => /0\s+Lines?\s+with\s+issues/i.test(button)),
    zeroIssuesTotalVisible:
      /0\s+Issues?\s+Total/i.test(text) || buttons.some((button) => /0\s+Issues?\s+Total/i.test(button)),
    currentLineNoIssuesVisible: /Current\s+line\s+No\s+issues\s+found/i.test(text),
    savedVisible: /Gespeichert|Saved/i.test(text),
    notSavedVisible: /Nicht gespeichert|Not saved/i.test(text),
    postVisible: /Post\b|Buchen\b/i.test(text) || buttons.some((button) => /^Post$|^Buchen$/i.test(button)),
    buttons,
    text
  };
}

async function closeDimensionDialog(page: Page) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Edit Dimension Set Entries/i.test(bodyText)) {
      continue;
    }

    const buttons = frame.getByRole('button');
    const count = await buttons.count().catch(() => 0);
    for (let index = count - 1; index >= 0; index -= 1) {
      const text = await buttons.nth(index).innerText({ timeout: 500 }).catch(() => '');
      if (/^Schlie|^Close/i.test(text.trim())) {
        await buttons.nth(index).click();
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }

  return false;
}

async function inspectLineDimensions(page: Page) {
  const clickedLineMenu = await clickAction(page, /^Line$/i);
  const clickedDimensions = await clickAction(page, /Dimensions|Dimensionen/i);
  await page.waitForTimeout(2500);
  const text = normalizeText(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath('020-line-dimensions-before-post-page-text.txt'), text);
  await closeDimensionDialog(page);
  await page.waitForTimeout(1000);
  return {
    clickedLineMenu,
    clickedDimensions,
    productlineMachineVisible: /PRODUCTLINE[\s\S]{0,180}MACHINE|MACHINE[\s\S]{0,180}PRODUCTLINE/i.test(text),
    textEvidenceFile: '020-line-dimensions-before-post-page-text.txt'
  };
}

async function postCurrentJournalLine(page: Page, documentNo: string) {
  await clickAction(page, /^Start$/i);
  await page.waitForTimeout(1200);
  const clickedPost = await clickAction(page, /^Post$|^Buchen$/i);
  await page.waitForTimeout(2500);
  const dialogText = normalizeText(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath('030-post-confirm-dialog-page-text.txt'), dialogText);
  await screenshot(page, 'inventory-008-030-post-confirm-dialog.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: clickedPost && /post|buchen|journal/i.test(dialogText) ? 'labor' : 'rejected',
    purpose: `Bestaetigungsdialog vor der genau einmaligen Laborbuchung der Item-Journal-Zeile ${documentNo}.`,
    knownLimitations: [
      'CRONUS-USA-Laborbuchung; kein deutscher Finalnachweis.',
      'Dieser Screenshot liegt vor der Bestaetigung und beweist noch keine Posten.'
    ],
    bookUse: 'process-proof'
  });

  const confirmed = await clickAction(page, /^Yes$|^Ja$|^OK$/i);
  await page.waitForTimeout(12_000);
  const resultText = normalizeText(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath('040-post-result-page-text.txt'), resultText);
  await screenshot(page, 'inventory-008-040-post-result.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: confirmed ? 'labor' : 'rejected',
    purpose: `Zustand nach Bestaetigung der Laborbuchung ${documentNo}.`,
    knownLimitations: [
      'BC-Ergebnistext kann je nach UI-Zustand kurzlebig sein; belastbarer Postennachweis folgt ueber gefilterte Postenlisten.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'evidence'
  });

  await clickAction(page, /^OK$|^Schlie|^Close$/i);
  return {
    clickedPost,
    confirmed,
    dialogTextHasPostQuestion: /post|buchen|journal/i.test(dialogText),
    resultTextHasSuccess: /successfully posted|erfolgreich gebucht|journal lines were successfully/i.test(resultText),
    dialogTextEvidenceFile: '030-post-confirm-dialog-page-text.txt',
    resultTextEvidenceFile: '040-post-result-page-text.txt'
  };
}

async function openAndCaptureFilteredPage(page: Page, target: TraceTarget, documentNo: string) {
  await page.goto(filteredBcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3000);
  await dismissTours(page);
  const text = normalizeText(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath(`${target.fileStem}-page-text.txt`), text);
  await screenshot(page, target.imageFileName, {
    projectName: project.name,
    testId: TEST_ID,
    status: target.labelPattern.test(text) && text.includes(target.filterValue) ? 'labor' : 'rejected',
    purpose: `Read-only-Postenspur fuer positive RM-M100-Laborbuchung ${documentNo}: ${target.id}.`,
    knownLimitations: [
      'CRONUS-USA-Laborposten, kein deutscher Kontenplan- oder Steuer-Endstand.',
      `Gefilterte Ansicht auf ${target.filterField} = ${target.filterValue}; keine weitere Buchung.`
    ],
    bookUse: 'posting-trace'
  });

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    pageContextVisible: target.labelPattern.test(text),
    filterValueVisible: text.includes(target.filterValue),
    hasRmM100: /RM-M100/i.test(text),
    hasFraZl: /FRA-ZL/i.test(text),
    hasQuantity2: /\b2(?:\.00|,00)?\b/i.test(text),
    hasAmount84000: /84[.,]000|84000/i.test(text),
    hasUnitCost42000: /42[.,]000|42000/i.test(text),
    hasInventoryAccount14140: /\b14140\b/i.test(text),
    hasProductlineMachine: /PRODUCTLINE[\s\S]{0,180}MACHINE|MACHINE[\s\S]{0,180}PRODUCTLINE/i.test(text),
    textEvidenceFile: `${target.fileStem}-page-text.txt`,
    screenshot: target.imageFileName
  };
}

async function searchTellMe(page: Page, term: string) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
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
  await searchTellMe(page, 'Inventory Valuation');
  for (const scope of [page, ...page.frames()]) {
    const bodyText = await scope.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Berichte und Analysen|Reports and Analysis|Inventory Valuation/i.test(bodyText)) {
      continue;
    }

    const inventoryValuation = scope.getByText('Inventory Valuation', { exact: true }).first();
    if (await inventoryValuation.isVisible({ timeout: 1000 }).catch(() => false)) {
      await inventoryValuation.click();
      break;
    }
  }

  await page.waitForTimeout(5000);
}

async function setInventoryValuationFilters(page: Page) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!/Inventory Valuation/i.test(bodyText) || !/As Of Date/i.test(bodyText)) {
      continue;
    }

    const dateInput = frame.locator('input[title*="Datum"], input[title*="Date"]').first();
    if (await dateInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await dateInput.fill(AS_OF_DATE);
      await dateInput.press('Tab');
    }

    const inputHandles = await frame.locator('input[type="text"]').elementHandles();
    const visibleInputIndexes: number[] = [];
    for (let index = 0; index < inputHandles.length; index += 1) {
      const visible = await inputHandles[index]
        .evaluate((element) => Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length))
        .catch(() => false);
      if (visible) visibleInputIndexes.push(index);
    }

    const inputs = frame.locator('input[type="text"]');
    const noFilterIndex = visibleInputIndexes[2];
    const locationFilterIndex = visibleInputIndexes[4];
    if (noFilterIndex !== undefined) {
      await inputs.nth(noFilterIndex).fill(ITEM_FILTER);
      await inputs.nth(noFilterIndex).press('Tab');
    }
    if (locationFilterIndex !== undefined) {
      await inputs.nth(locationFilterIndex).fill(LOCATION_FILTER);
      await inputs.nth(locationFilterIndex).press('Tab');
    }
    break;
  }

  await page.waitForTimeout(2000);
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

async function captureInventoryValuationAfterPosting(page: Page) {
  await openInventoryValuation(page);
  await setInventoryValuationFilters(page);
  const requestText = normalizeText(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath('090-inventory-valuation-request-page-text.txt'), requestText);
  await screenshot(page, 'inventory-008-090-inventory-valuation-request.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: /Inventory Valuation/i.test(requestText) && /As Of Date/i.test(requestText) ? 'labor' : 'rejected',
    purpose: 'Inventory Valuation Request Page nach positiver RM-M100-Laborbuchung.',
    knownLimitations: ['Request Page beweist Filtereingabe, nicht die Zahlenwirkung.', 'CRONUS-USA-Labor; kein deutscher Abschluss.'],
    bookUse: 'field-proof'
  });

  const previewClicked = await clickPreview(page);
  const previewText = normalizeText(await pageText(page));
  await writeTextEvidence(inventoryEvidencePath('091-inventory-valuation-preview-page-text.txt'), previewText);
  await screenshot(page, 'inventory-008-091-inventory-valuation-preview.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: previewClicked && /Total Inventory Value/i.test(previewText) ? 'labor' : 'rejected',
    purpose: 'Inventory Valuation nach positiver RM-M100-Laborbuchung: Pruefung, ob negativer RM-M100-Wert korrigiert wurde.',
    knownLimitations: ['CRONUS-USA-Laborwerte; keine deutsche Abschluss- oder Kontenplan-Evidence.', 'Keine Kostenregulierung in diesem Lauf.'],
    bookUse: 'evidence'
  });

  return {
    previewClicked,
    previewVisible: /Total Inventory Value/i.test(previewText),
    rmM100Visible: /RM-M100/i.test(previewText),
    rmM100Positive42000Visible: /RM-M100[\s\S]{0,360}42\.000,00/i.test(previewText),
    rawSteel25000Visible: /RAW-STEEL[\s\S]{0,360}25\.000,00/i.test(previewText),
    total67000Visible: /Total Inventory Value[\s\S]{0,120}67\.000,00/i.test(previewText),
    requestEvidenceFile: '090-inventory-valuation-request-page-text.txt',
    previewEvidenceFile: '091-inventory-valuation-preview-page-text.txt'
  };
}

function buildLearningMarkdown(result: Record<string, unknown>) {
  return [
    '# INVENTORY-008 Positive RM-M100 Laborbuchung',
    '',
    'Status: CRONUS-USA-Laborbuchung, bewusst genau einmal gebucht, kein deutscher Finalnachweis.',
    '',
    '## Ziel',
    '',
    '`INVENTORY-004` bis `INVENTORY-007` haben den Zielbestand geplant, den Item-Journal-Draft vorbereitet und den Journal Check ohne Issues belegt. Dieser Lauf bucht den Trainings-/Opening-Balance-Zugang `RM-M100 +2` in `FRA-ZL` und prueft danach die Postenspur.',
    '',
    '## Ergebnis',
    '',
    '| Pruefpunkt | Ergebnis |',
    '|---|---|',
    `| Sandbox | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Document No. | ${result.documentNo} |`,
    `| Zielzeile sichtbar | ${result.targetVisible ? 'ja' : 'nein'} |`,
    `| Journal Check ohne Issues | ${result.journalCheckPassed ? 'ja' : 'nein'} |`,
    `| Dimension PRODUCTLINE=MACHINE vor Buchung | ${result.productlineMachineVisibleBeforePosting ? 'ja' : 'nein'} |`,
    `| Gebucht | ${result.posted ? 'ja' : 'nein'} |`,
    `| Item Ledger Entry sichtbar | ${(result.traceSummary as { itemLedgerEntryVisible?: boolean }).itemLedgerEntryVisible ? 'ja' : 'nein'} |`,
    `| Value Entry sichtbar | ${(result.traceSummary as { valueEntryVisible?: boolean }).valueEntryVisible ? 'ja' : 'nein'} |`,
    `| G/L Entry sichtbar | ${(result.traceSummary as { glEntryVisible?: boolean }).glEntryVisible ? 'ja' : 'nein'} |`,
    `| Inventory Valuation korrigiert RM-M100 auf +42.000 | ${(result.inventoryValuation as { rmM100Positive42000Visible?: boolean }).rmM100Positive42000Visible ? 'ja' : 'nein'} |`,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Ein positiver Bestand entsteht in Business Central nicht durch eine Sachkontenbuchung, sondern durch eine Artikelbewegung. Das Item Journal erzeugt nach der Buchung Artikelposten und Wertposten; je nach Setup entstehen beziehungsweise aktualisieren sich auch Sachposten. Der Journal Check ist die Vorabkontrolle, die Postenspur ist der Nachweis nach der Buchung.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 13/23 kann jetzt die komplette Labor-Kette erklaeren: negativer Ausgangswert, Zielbestandsplan, Journal-Draft, Journal Check, bewusste Laborbuchung, Postenspur und korrigierte Inventory Valuation. Alle Bilder bleiben CRONUS-USA-Laborbilder und muessen fuer finale deutsche Screenshots neu erzeugt werden.',
    '',
    '## Grenze',
    '',
    'Keine deutsche 19-%-USt, kein deutscher Kontenplan-Endstand, keine Warehouse-Aktivierung, kein Manufacturing-Nachweis und keine Kostenregulierung. Diese Buchung ist bewusstes Labor-Training und darf nicht als deutscher Produktiv- oder Abschlussnachweis ausgegeben werden.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep as string,
    ''
  ].join('\n');
}

test('INVENTORY-008 RM-M100 positiven Laborbestand buchen und Postenspur sichern', async ({ page }) => {
  const target = await loadTargetStockPlan();
  await openItemJournal(page);
  const preCleanupDeletedDocuments = await cleanupInventory008Drafts(page);
  await openItemJournal(page);

  const line = await fillTargetLine(page, target);
  const journalCheck = await inspectJournalCheck(page);
  const dimensions = await inspectLineDimensions(page);
  await screenshot(page, 'inventory-008-010-journal-line-before-post.png', {
    projectName: project.name,
    testId: TEST_ID,
    status:
      line.targetVisible && journalCheck.currentLineNoIssuesVisible && journalCheck.zeroIssuesTotalVisible
        ? 'labor'
        : 'rejected',
    purpose: `Vor der Buchung gepruefte Item-Journal-Zielzeile ${line.documentNo}: RM-M100 +2 in FRA-ZL.`,
    knownLimitations: [
      'Vor-Buchungsbild: beweist noch keine Posten.',
      'Journal Check ist Preflight, keine Posting Preview.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'process-proof'
  });
  await writeJsonEvidence(inventoryEvidencePath('010-preposting-controls.json'), {
    documentNo: line.documentNo,
    preCleanupDeletedDocuments,
    target,
    controls: line.controlSnapshotAfter,
    journalCheck
  });

  expect(line.targetVisible, 'Zielzeile muss vor Buchung sichtbar sein.').toBe(true);
  expect(line.unitCostVisible, 'Unit Cost 42.000 muss vor Buchung sichtbar sein.').toBe(true);
  expect(line.amountVisible, 'Amount 84.000 muss vor Buchung sichtbar sein.').toBe(true);
  expect(journalCheck.journalCheckVisible, 'Journal Check muss sichtbar sein.').toBe(true);
  expect(journalCheck.currentLineNoIssuesVisible, 'Journal Check muss fuer die aktuelle Zeile No issues found zeigen.').toBe(true);
  expect(journalCheck.zeroLinesWithIssuesVisible, 'Journal Check darf keine Zeilen mit Issues zeigen.').toBe(true);
  expect(journalCheck.zeroIssuesTotalVisible, 'Journal Check darf keine Issues zeigen.').toBe(true);
  expect(dimensions.productlineMachineVisible, 'PRODUCTLINE=MACHINE muss vor Buchung sichtbar sein.').toBe(true);

  const posting = await postCurrentJournalLine(page, line.documentNo);
  expect(posting.clickedPost, 'Post muss bewusst geklickt worden sein.').toBe(true);
  expect(posting.confirmed, 'Buchung muss genau einmal bestaetigt worden sein.').toBe(true);

  const traceTargets: TraceTarget[] = [
    {
      id: 'item-ledger-entry',
      pageId: 38,
      tableName: 'Item Ledger Entry',
      filterField: 'Document No.',
      filterValue: line.documentNo,
      fileStem: '050-item-ledger-entry',
      imageFileName: 'inventory-008-050-item-ledger-entry.png',
      labelPattern: /Item Ledger Entries|Item Ledger Entry|Artikelposten|RM-M100/i
    },
    {
      id: 'value-entry',
      pageId: 5802,
      tableName: 'Value Entry',
      filterField: 'Document No.',
      filterValue: line.documentNo,
      fileStem: '060-value-entry',
      imageFileName: 'inventory-008-060-value-entry.png',
      labelPattern: /Value Entries|Value Entry|Wertposten|Cost Amount|Kostenbetrag/i
    },
    {
      id: 'gl-entry',
      pageId: 20,
      tableName: 'G/L Entry',
      filterField: 'Document No.',
      filterValue: line.documentNo,
      fileStem: '070-gl-entry',
      imageFileName: 'inventory-008-070-gl-entry.png',
      labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i
    }
  ];

  const traces = [];
  for (const targetPage of traceTargets) {
    traces.push(await openAndCaptureFilteredPage(page, targetPage, line.documentNo));
  }

  const inventoryValuation = await captureInventoryValuationAfterPosting(page);
  const traceSummary = {
    itemLedgerEntryVisible: traces.find((entry) => entry.id === 'item-ledger-entry')?.hasRmM100 ?? false,
    valueEntryVisible: traces.find((entry) => entry.id === 'value-entry')?.hasRmM100 ?? false,
    glEntryVisible: traces.find((entry) => entry.id === 'gl-entry')?.filterValueVisible ?? false,
    itemLedgerQuantity2Visible: traces.find((entry) => entry.id === 'item-ledger-entry')?.hasQuantity2 ?? false,
    valueEntryAmount84000Visible: traces.find((entry) => entry.id === 'value-entry')?.hasAmount84000 ?? false,
    glEntryInventoryAccount14140Visible: traces.find((entry) => entry.id === 'gl-entry')?.hasInventoryAccount14140 ?? false
  };

  const result = {
    testId: 'INVENTORY-008',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'controlled-lab-posting',
    documentNo: line.documentNo,
    target,
    targetVisible: line.targetVisible,
    unitCostVisible: line.unitCostVisible,
    amountVisible: line.amountVisible,
    journalCheckPassed:
      journalCheck.journalCheckVisible &&
      journalCheck.currentLineNoIssuesVisible &&
      journalCheck.zeroLinesWithIssuesVisible &&
      journalCheck.zeroIssuesTotalVisible,
    productlineMachineVisibleBeforePosting: dimensions.productlineMachineVisible,
    posting,
    posted: posting.confirmed,
    traces,
    traceSummary,
    inventoryValuation,
    proves: [
      'RM-M100 +2 in FRA-ZL wurde als kontrollierte CRONUS-USA-Laborbuchung gebucht.',
      'Journal Check war vor der Buchung ohne sichtbare Issues.',
      'Nach der Buchung sind Postenspur und Inventory Valuation read-only pruefbar.'
    ],
    doesNotProve: [
      'Kein deutscher Kontenplan-Endstand.',
      'Keine deutsche 19-Prozent-USt.',
      'Kein Warehouse- oder Manufacturing-Prozess.',
      'Keine Kostenregulierung.'
    ],
    nextStep:
      'Inventory-Laborblock didaktisch abrunden: Buch/Coverage auf die neue positive Bestandskette synchronisieren und danach entweder Reporting-Dimension-Perspective read-only oder Payments/OP-Ausgleich als naechsten Prozessblock waehlen.'
  };

  await writeJsonEvidence(inventoryEvidencePath('INVENTORY-008-POSTING-result.json'), result);
  await writeTextEvidence(inventoryEvidencePath('INVENTORY-008-POSTING.md'), buildLearningMarkdown(result));

  expect(traceSummary.itemLedgerEntryVisible, 'Artikelposten zur Laborbuchung muss sichtbar sein.').toBe(true);
  expect(traceSummary.valueEntryVisible, 'Wertposten zur Laborbuchung muss sichtbar sein.').toBe(true);
  expect(inventoryValuation.previewVisible, 'Inventory Valuation muss nach Buchung rendern.').toBe(true);
});
