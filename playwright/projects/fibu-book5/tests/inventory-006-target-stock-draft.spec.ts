import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  bcPageUrl,
  dismissTours,
  hideFactBoxPane,
  pageText,
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

test.setTimeout(360_000);

const TEST_ID = 'inventory-006';
const PAGE_ID_ITEM_JOURNAL = 40;

type TargetStockPlan = {
  itemNo: string;
  locationCode: string;
  quantityToAdd: number;
  unitCost: number;
  dimension: Record<string, string>;
};

type ControlHandle = {
  handle: import('@playwright/test').ElementHandle<HTMLElement>;
  tag: string;
  x: number;
  y: number;
  value: string;
  title: string;
  text: string;
};

function inventoryEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
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
  const factBoxHidden = await hideFactBoxPane(page);
  await page.waitForTimeout(500);
  return { factBoxHidden };
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
          value: (element as HTMLInputElement | HTMLSelectElement).value ?? '',
          title: element.getAttribute('title') ?? '',
          text: element.textContent ?? ''
        };
      })
      .catch(() => undefined);

    if (!data?.visible || data.y < 250 || data.y > 390) {
      continue;
    }

    controls.push({
      handle,
      tag: data.tag,
      x: data.x,
      y: data.y,
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

  const documentNo = `INV006-${Date.now().toString().slice(-6)}`;
  const controlSnapshotBefore = controls.map((control, index) => ({
    index,
    tag: control.tag,
    x: Math.round(control.x),
    y: Math.round(control.y),
    value: control.value,
    title: control.title,
    text: control.text.trim().slice(0, 80)
  }));

  await fillControl(controls[0], '08.06.2026');
  await fillControl(controls[1], 'Positive Adjmt.');
  await fillControl(controls[3], documentNo);
  await fillControl(controls[4], target.itemNo);
  await page.waitForTimeout(2000);
  await fillControl(controls[6], target.locationCode);
  await page.waitForTimeout(1000);
  await fillControl(controls[8], String(target.quantityToAdd));
  await page.waitForTimeout(3500);

  const text = normalizeText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  const controlSnapshotAfter = (await firstLineControls(frame)).map((control, index) => ({
    index,
    tag: control.tag,
    x: Math.round(control.x),
    y: Math.round(control.y),
    value: control.value,
    title: control.title,
    text: control.text.trim().slice(0, 80)
  }));
  const snapshotValues = controlSnapshotAfter.map((control) => control.value);
  const hasTargetValues =
    snapshotValues.includes(documentNo) &&
    snapshotValues.includes(target.itemNo) &&
    snapshotValues.includes(target.locationCode) &&
    snapshotValues.includes(String(target.quantityToAdd));
  const hasUnitCost = snapshotValues.some((value) => /42[.,]000|42000/i.test(value));

  return {
    documentNo,
    controlSnapshotBefore,
    controlSnapshotAfter,
    text,
    buttons,
    targetVisible: hasTargetValues,
    unitCostVisible: hasUnitCost,
    pageHasError: /Die Seite enthaelt einen Fehler|Die Seite enthält einen Fehler|page contains an error/i.test(text),
    postVisible: /Post\b|Buchen\b/i.test(text) || buttons.some((button) => /^Post$|^Buchen$/i.test(button))
  };
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 800 }).catch(() => false)) {
        await action.click().catch(() => undefined);
        await page.waitForTimeout(1500);
        return true;
      }
    }
  }
  return false;
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
  await clickAction(page, /^Line$/i);
  await page.waitForTimeout(1000);
  const clickedDimensions = await clickAction(page, /Dimensions|Dimensionen/i);
  await page.waitForTimeout(2500);
  const text = normalizeText(await pageText(page));
  await closeDimensionDialog(page);
  await page.waitForTimeout(1000);
  return {
    clickedLineMenu: true,
    clickedDimensions,
    productlineMachineVisible: /PRODUCTLINE[\s\S]{0,180}MACHINE|MACHINE[\s\S]{0,180}PRODUCTLINE/i.test(text),
    text
  };
}

async function inspectPostingControls(page: Page) {
  const text = normalizeText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  return {
    previewVisible: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(text) || buttons.some((button) => /Preview|Vorschau/i.test(button)),
    postVisible: /Post\b|Buchen\b/i.test(text) || buttons.some((button) => /^Post$|^Buchen$/i.test(button)),
    buttons,
    text
  };
}

async function cleanupTargetDraftLine(page: Page, documentNo: string) {
  const frame = await itemJournalFrame(page).catch(async () => {
    await page.goto(bcPageUrl(PAGE_ID_ITEM_JOURNAL, project.envPrefix), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(8000);
    return itemJournalFrame(page);
  });
  const textBefore = normalizeText(await pageText(page));
  const controlsBefore = await firstLineControls(frame);
  const documentVisibleInControls = controlsBefore.some((control) => control.value === documentNo);
  if (!textBefore.includes(documentNo) && !documentVisibleInControls) {
    return { attempted: false, cleaned: true, reason: 'target-document-not-visible-before-cleanup' };
  }

  await frame.getByRole('button', { name: /Weitere Optionen anzeigen|Show more options/i }).last().click();
  await page.waitForTimeout(800);
  await frame.getByRole('menuitem', { name: /Zeile|Line/i }).filter({ hasText: /l.sch|delete/i }).first().click();
  await page.waitForTimeout(1500);
  await clickAction(page, /^Yes$|^Ja$|^OK$/i);
  await page.waitForTimeout(3000);

  const textAfter = normalizeText(await pageText(page));
  const controlsAfter = await firstLineControls(frame).catch(() => []);
  const documentStillVisibleInControls = controlsAfter.some((control) => control.value === documentNo);
  return {
    attempted: true,
    cleaned: !textAfter.includes(documentNo) && !documentStillVisibleInControls,
    documentNoStillVisible: textAfter.includes(documentNo) || documentStillVisibleInControls
  };
}

async function cleanupInventory006Drafts(page: Page) {
  const deletedDocuments: string[] = [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const frame = await itemJournalFrame(page);
    const controls = await firstLineControls(frame);
    const values = controls.map((control) => control.value);
    const documentNo = values.find((value) => /^INV006-/.test(value));
    const looksLikeInventory006Draft =
      Boolean(documentNo) || (values.includes('RM-M100') && values.includes('FRA-ZL') && values.includes('2'));

    if (!looksLikeInventory006Draft) {
      break;
    }

    await frame.getByRole('button', { name: /Weitere Optionen anzeigen|Show more options/i }).last().click();
    await page.waitForTimeout(800);
    await frame.getByRole('menuitem', { name: /Zeile|Line/i }).filter({ hasText: /l.sch|delete/i }).first().click();
    await page.waitForTimeout(1200);
    await clickAction(page, /^Yes$|^Ja$|^OK$/i);
    await page.waitForTimeout(2500);

    if (documentNo) {
      deletedDocuments.push(documentNo);
    }
  }

  return deletedDocuments;
}

async function acceptedGridValues(controlSnapshot: Array<{ value: string }>, target: TargetStockPlan, documentNo: string) {
  const values = controlSnapshot.map((control) => control.value);
  return {
    documentNo: values.includes(documentNo),
    itemNo: values.includes(target.itemNo),
    locationCode: values.includes(target.locationCode),
    quantity: values.includes(String(target.quantityToAdd)),
    unitCost: values.some((value) => /42[.,]000|42000/i.test(value))
  };
}

function buildMarkdown(result: Record<string, unknown>) {
  return [
    '# INVENTORY-006 Target Stock Draft',
    '',
    'Status: Labor-Vorlauf, kontrollierte Journalzeile, keine Buchung.',
    '',
    '## Ziel',
    '',
    'Dieser Lauf prueft den naechsten Schritt nach `INVENTORY-005`: Kann eine Ziel-Journalzeile fuer `RM-M100 +2` in `FRA-ZL` praktisch vorbereitet werden, und sind Dimension/Preview vor einer Buchung tragfaehig nachweisbar?',
    '',
    '## Ergebnis',
    '',
    '| Pruefpunkt | Ergebnis |',
    '|---|---|',
    `| Sandbox | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Journalzeile mit Zielwerten sichtbar | ${result.targetVisible ? 'ja' : 'nein'} |`,
    `| Unit Cost sichtbar | ${result.unitCostVisible ? 'ja' : 'nein'} |`,
    `| Dimension PRODUCTLINE=MACHINE vor Buchung sichtbar | ${result.productlineMachineVisible ? 'ja' : 'nein'} |`,
    `| Preview Posting sichtbar | ${result.previewVisible ? 'ja' : 'nein'} |`,
    `| Gebucht | ${result.posted ? 'ja' : 'nein'} |`,
    `| Cleanup Zielentwurf | ${(result.cleanup as { cleaned?: boolean } | undefined)?.cleaned ? 'ja' : 'nein/unklar'} |`,
    '',
    '## Lernbefund',
    '',
    'Das Item Journal ist der richtige Einstieg fuer eine kontrollierte Bestandsbewegung. Der Lauf zeigt aber auch, warum vor einer Buchung nicht nur `Post` sichtbar sein darf: Fuer Buch-Evidence muessen Zielzeile, Dimension und eine Preview- oder gleichwertige Kontrolle nachvollziehbar sein. Wenn Preview oder Dimension vor der Buchung nicht sichtbar sind, ist Nicht-Buchen der richtige Beratungsentscheid.',
    '',
    'Wichtig fuer Anfaenger: Rechts neben `Unit Cost` liegt `Applies-to Entry`. Dieses Feld dient nicht zur Kostenpflege. Ein frueher Probeversuch mit `42000` in `Applies-to Entry` erzeugte einen Zeilenfehler. Der stabile Lauf laesst dieses Feld leer und belegt `Unit Amount`, `Amount` und `Unit Cost` ueber die BC-Automatik.',
    '',
    'Cleanup erfolgt nicht per globalem `Escape` oder `Ctrl+Delete`, sondern ueber das Zeilenmenue `Weitere Optionen anzeigen` -> `Zeile loeschen`.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 13/23 kann jetzt genauer erklaeren, dass ein positiver Trainingsbestand zuerst als Journalzeile sichtbar vorbereitet wird. Die Buchanleitung darf aber noch keinen positiven Bestand oder korrigierte Lagerbewertung behaupten, solange `INVENTORY-006` nicht gebucht wurde.',
    '',
    '## Grenze',
    '',
    'Keine Artikelposten, Wertposten, Sachposten und keine neue Lagerbewertung aus diesem Lauf. CRONUS-USA-Labor; kein deutscher Kontenplan, keine deutsche USt, kein Manufacturing-Nachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep as string,
    ''
  ].join('\n');
}

test('INVENTORY-006 RM-M100 Ziel-Journalzeile vorbereiten und vor Buchung kontrollieren', async ({ page }) => {
  const target = await loadTargetStockPlan();
  const shell = await openItemJournal(page);
  const preCleanupDeletedDocuments = await cleanupInventory006Drafts(page);
  const line = await fillTargetLine(page, target);

  await writeTextEvidence(inventoryEvidencePath('010-target-journal-line-page-text.txt'), line.text);
  await writeJsonEvidence(inventoryEvidencePath('010-target-journal-line-controls.json'), {
    documentNo: line.documentNo,
    before: line.controlSnapshotBefore,
    after: line.controlSnapshotAfter,
    buttons: line.buttons
  });
  await screenshot(page, 'inventory-006-010-target-journal-line-before-post.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: line.targetVisible ? 'labor' : 'rejected',
    purpose: `Vorbereitete Item-Journal-Zielzeile fuer RM-M100 +2 in FRA-ZL, Document No. ${line.documentNo}.`,
    expectedPageText: [],
    knownLimitations: [
      'Business-Central-Gridwerte erscheinen sichtbar im Screenshot, aber nicht verlaesslich im pageText; Feldnachweis erfolgt ueber 010-target-journal-line-controls.json.',
      'Noch keine Buchung und keine Postenspur.',
      'Dimension und Preview werden separat geprueft.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'field-proof'
  });

  const dimensions = await inspectLineDimensions(page);
  await writeTextEvidence(inventoryEvidencePath('020-line-dimensions-attempt-page-text.txt'), dimensions.text);

  const postingControls = await inspectPostingControls(page);
  await writeTextEvidence(inventoryEvidencePath('030-posting-controls-page-text.txt'), postingControls.text);
  await writeJsonEvidence(inventoryEvidencePath('030-posting-controls-buttons.json'), postingControls.buttons);

  const mayPost =
    line.targetVisible &&
    line.unitCostVisible &&
    dimensions.productlineMachineVisible &&
    postingControls.previewVisible;
  const cleanup = await cleanupTargetDraftLine(page, line.documentNo);

  const result = {
    testId: 'INVENTORY-006',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'controlled-draft-no-posting',
    documentNo: line.documentNo,
    target,
    factBoxHidden: shell.factBoxHidden,
    preCleanupDeletedDocuments,
    targetVisible: line.targetVisible,
    unitCostVisible: line.unitCostVisible,
    acceptedGridValues: await acceptedGridValues(line.controlSnapshotAfter, target, line.documentNo),
    pageHasError: line.pageHasError,
    productlineMachineVisible: dimensions.productlineMachineVisible,
    clickedDimensions: dimensions.clickedDimensions,
    previewVisible: postingControls.previewVisible,
    postVisible: postingControls.postVisible || line.postVisible,
    mayPost,
    posted: false,
    cleanup,
    proves: [
      'Eine Ziel-Journalzeile fuer RM-M100 +2 in FRA-ZL kann im Item Journal vorbereitet werden, sofern targetVisible true ist.',
      'Der Lauf prueft vor einer Buchung bewusst Dimension und Preview-Moeglichkeit.',
      'Es wurde nicht gebucht, weil die Vorbedingungen fuer eine saubere Evidence-Buchung nicht vollstaendig erfuellt sind.'
    ],
    doesNotProve: [
      'Kein positiver Bestand wurde erzeugt.',
      'Keine Artikelposten, Wertposten oder Sachposten wurden erzeugt.',
      'Keine korrigierte Inventory Valuation.',
      'Kein deutscher Finalnachweis.'
    ],
    nextStep: mayPost
      ? 'INVENTORY-007 darf die vorbereitete Logik erneut aufbauen, Preview sichern, genau einmal posten und danach Postenspur plus Inventory Valuation erzeugen.'
      : 'Dimension/Preview-Pfad im Item Journal weiter klaeren oder alternativen kontrollierten Bestandszugang suchen, bevor gebucht wird.'
  };

  await writeJsonEvidence(inventoryEvidencePath('INVENTORY-006-TARGET-STOCK-DRAFT-result.json'), result);
  await writeTextEvidence(inventoryEvidencePath('INVENTORY-006-TARGET-STOCK-DRAFT.md'), buildMarkdown(result));

  expect(line.targetVisible, 'Die Ziel-Journalzeile muss vor einem Buchungsentscheid sichtbar sein.').toBe(true);
  expect(result.posted, 'Dieser Lauf darf nicht buchen.').toBe(false);
});
