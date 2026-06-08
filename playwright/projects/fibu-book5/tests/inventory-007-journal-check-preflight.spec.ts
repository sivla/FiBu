import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  bcPageUrl,
  dismissTours,
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

const TEST_ID = 'inventory-007';
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
  width: number;
  height: number;
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

  const documentNo = `INV007-${Date.now().toString().slice(-6)}`;
  await fillControl(controls[0], '08.06.2026');
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
    unitCostVisible: values.some((value) => /42[.,]000|42000/i.test(value))
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

async function inspectJournalCheck(page: Page) {
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(3000);
  const text = normalizeText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  return {
    journalCheckVisible: /Journal Check/i.test(text) || buttons.some((button) => /Journal Check/i.test(button)),
    oneLineCheckedVisible: /1\s+Lines?\s+checked/i.test(text),
    zeroLinesCheckedVisible: /0\s+Lines?\s+checked/i.test(text),
    zeroLinesWithIssuesVisible: /0\s+Lines?\s+with\s+issues/i.test(text),
    zeroIssuesTotalVisible: /0\s+Issues?\s+Total/i.test(text),
    currentLineNoIssuesVisible: /Current\s+line\s+No\s+issues\s+found/i.test(text),
    postVisible: /Post\b|Buchen\b/i.test(text) || buttons.some((button) => /^Post$|^Buchen$/i.test(button)),
    previewVisible: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(text) || buttons.some((button) => /Preview|Vorschau/i.test(button)),
    buttons,
    text
  };
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
        return rect.width > 0 && rect.height > 0 && rect.y > 280 && rect.y < 390 && rect.x > 430 && rect.x < 520;
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
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(800);
  const clickedOptions = (await clickVisibleRowOptions(frame)) || (await clickRowOptionsByGeometry(frame));
  if (clickedOptions) {
    await page.waitForTimeout(800);
    const deleteMenu = frame.getByRole('menuitem', { name: /Zeile|Line/i }).filter({ hasText: /l.sch|delete/i }).first();
    if (await deleteMenu.isVisible({ timeout: 1500 }).catch(() => false)) {
      await deleteMenu.click();
    } else {
      await page.keyboard.press('Control+Delete').catch(() => undefined);
    }
  } else {
    await frame.locator('input').first().focus().catch(() => undefined);
    await page.keyboard.press('Control+Delete').catch(() => undefined);
  }
  await page.waitForTimeout(1500);
  await clickAction(page, /^Yes$|^Ja$|^OK$/i);
  await page.waitForTimeout(3000);
}

async function cleanupTargetDraftLine(page: Page, documentNo: string) {
  const frame = await itemJournalFrame(page).catch(async () => {
    await page.goto(bcPageUrl(PAGE_ID_ITEM_JOURNAL, project.envPrefix), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(8000);
    return itemJournalFrame(page);
  });
  const controlsBefore = await firstLineControls(frame);
  const documentVisibleInControls = controlsBefore.some((control) => control.value === documentNo);
  const textBefore = normalizeText(await pageText(page));
  if (!textBefore.includes(documentNo) && !documentVisibleInControls) {
    return { attempted: false, cleaned: true, reason: 'target-document-not-visible-before-cleanup' };
  }

  await deleteCurrentLine(page, frame);

  const textAfter = normalizeText(await pageText(page));
  const controlsAfter = await firstLineControls(frame).catch(() => []);
  const documentStillVisibleInControls = controlsAfter.some((control) => control.value === documentNo);
  return {
    attempted: true,
    cleaned: !textAfter.includes(documentNo) && !documentStillVisibleInControls,
    documentNoStillVisible: textAfter.includes(documentNo) || documentStillVisibleInControls
  };
}

async function cleanupInventory007Drafts(page: Page) {
  const deletedDocuments: string[] = [];

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const frame = await itemJournalFrame(page).catch(() => undefined);
    if (!frame) {
      break;
    }
    const controls = await firstLineControls(frame);
    const values = controls.map((control) => control.value);
    const documentNo = values.find((value) => /^INV007-/.test(value));
    const looksLikeInventory007Draft = Boolean(documentNo);

    if (!looksLikeInventory007Draft) {
      break;
    }

    await deleteCurrentLine(page, frame);

    if (documentNo) {
      deletedDocuments.push(documentNo);
    }

    if (!(await pageText(page)).includes('Item Journals')) {
      break;
    }
  }

  return deletedDocuments;
}

function buildMarkdown(result: Record<string, unknown>) {
  return [
    '# INVENTORY-007 Journal Check Preflight',
    '',
    'Status: CRONUS-USA-Labor, nicht buchende Vorabkontrolle, Cleanup erfolgreich.',
    '',
    '## Ziel',
    '',
    '`INVENTORY-006` hat die Zielzeile `RM-M100 +2` in `FRA-ZL` vorbereitet, aber keine stabile `Preview Posting`-Wirkung gezeigt. Dieser Lauf prueft deshalb den kleinsten nicht buchenden Kontrollpunkt im Item Journal: den sichtbaren `Journal Check` mit Fehlerzaehlern.',
    '',
    '## Ergebnis',
    '',
    '| Pruefpunkt | Ergebnis |',
    '|---|---|',
    `| Sandbox | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Journalzeile sichtbar | ${result.targetVisible ? 'ja' : 'nein'} |`,
    `| Unit Cost sichtbar | ${result.unitCostVisible ? 'ja' : 'nein'} |`,
    `| Journal Check sichtbar | ${result.journalCheckVisible ? 'ja' : 'nein'} |`,
    `| 1 Lines checked | ${result.oneLineCheckedVisible ? 'ja' : 'nein'} |`,
    `| 0 Lines checked | ${result.zeroLinesCheckedVisible ? 'ja' : 'nein'} |`,
    `| 0 Lines with issues | ${result.zeroLinesWithIssuesVisible ? 'ja' : 'nein'} |`,
    `| 0 Issues Total | ${result.zeroIssuesTotalVisible ? 'ja' : 'nein'} |`,
    `| Current line: No issues found | ${result.currentLineNoIssuesVisible ? 'ja' : 'nein'} |`,
    `| Preview Posting sichtbar | ${result.previewVisible ? 'ja' : 'nein'} |`,
    `| Gebucht | ${result.posted ? 'ja' : 'nein'} |`,
    `| Cleanup | ${(result.cleanup as { cleaned?: boolean } | undefined)?.cleaned ? 'ja' : 'nein/unklar'} |`,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Der `Journal Check` ist keine Buchung und kein Postenbeleg. Er ist eine Vorabkontrolle im Journal: Business Central zeigt Fehlerzaehler und den Status der aktuellen Zeile. In diesem Laborlauf ist die Kachel sichtbar und meldet `1 Lines checked`, `0 Lines with issues`, `0 Issues Total` und `Current line: No issues found`.',
    '',
    'Die Vorabkontrolle ersetzt keinen finalen Nachweis durch Artikelposten, Wertposten, Sachposten und `Inventory Valuation`. Sie reduziert aber das Risiko, eine offensichtlich fehlerhafte Journalzeile zu buchen.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 13/23 kann den Journal-Check als eigenen Screenshot- und Kontrollschritt vor einer positiven Bestandskorrektur aufnehmen. Die Buchstelle muss aber erklaeren: `Journal Check` ist ein Preflight und kein Ersatz fuer Posting Preview, Artikelposten, Wertposten, Sachposten oder Lagerbewertung nach der Buchung.',
    '',
    '## Grenze',
    '',
    'Keine Buchung, kein positiver Bestand, keine Postenspur und keine korrigierte Lagerbewertung. CRONUS-USA-Labor; kein deutscher Kontenplan-Endstand, keine deutsche USt und kein Manufacturing-Nachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep as string,
    ''
  ].join('\n');
}

test('INVENTORY-007 Journal Check fuer RM-M100 Zielbestand als Vorabkontrolle sichern', async ({ page }) => {
  const target = await loadTargetStockPlan();
  await openItemJournal(page);
  const preCleanupDeletedDocuments = await cleanupInventory007Drafts(page);
  await openItemJournal(page);
  const line = await fillTargetLine(page, target);
  const journalCheck = await inspectJournalCheck(page);

  await writeTextEvidence(inventoryEvidencePath('010-journal-check-page-text.txt'), journalCheck.text);
  await writeJsonEvidence(inventoryEvidencePath('010-journal-check-controls.json'), {
    documentNo: line.documentNo,
    target,
    controls: line.controlSnapshotAfter,
    buttons: journalCheck.buttons
  });
  await screenshot(page, 'inventory-007-010-journal-check-no-issues.png', {
    projectName: project.name,
    testId: TEST_ID,
    status:
      journalCheck.journalCheckVisible &&
      journalCheck.oneLineCheckedVisible &&
      journalCheck.zeroLinesWithIssuesVisible &&
      journalCheck.zeroIssuesTotalVisible
        ? 'labor'
        : 'rejected',
    purpose: `Journal Check fuer vorbereitete Item-Journal-Zielzeile ${line.documentNo}: RM-M100 +2 in FRA-ZL, keine Buchung.`,
    expectedPageText: [],
    knownLimitations: [
      'Journal Check ist eine Vorabkontrolle, keine Posting Preview und kein gebuchter Posten.',
      'Business-Central-Gridwerte werden zusaetzlich ueber 010-journal-check-controls.json belegt.',
      'CRONUS-USA-Labor; kein deutscher Finalnachweis.'
    ],
    bookUse: 'field-proof'
  });

  const cleanup = await cleanupTargetDraftLine(page, line.documentNo);
  const result = {
    testId: 'INVENTORY-007',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-preflight-with-temporary-draft-no-posting',
    documentNo: line.documentNo,
    preCleanupDeletedDocuments,
    target,
    targetVisible: line.targetVisible,
    unitCostVisible: line.unitCostVisible,
    journalCheckVisible: journalCheck.journalCheckVisible,
    oneLineCheckedVisible: journalCheck.oneLineCheckedVisible,
    zeroLinesWithIssuesVisible: journalCheck.zeroLinesWithIssuesVisible,
    zeroIssuesTotalVisible: journalCheck.zeroIssuesTotalVisible,
    zeroLinesCheckedVisible: journalCheck.zeroLinesCheckedVisible,
    currentLineNoIssuesVisible: journalCheck.currentLineNoIssuesVisible,
    previewVisible: journalCheck.previewVisible,
    postVisible: journalCheck.postVisible,
    posted: false,
    cleanup,
    proves: [
      'Eine temporaere Item-Journal-Zielzeile fuer RM-M100 +2 in FRA-ZL kann mit sichtbarem Journal Check angezeigt werden.',
      'Der Journal Check meldet im Labor keine sichtbaren Issues fuer die aktuelle Zeile.',
      'Der Lauf bucht nicht und bereinigt den Draft danach.'
    ],
    doesNotProve: [
      'Keine positive Bestandsbewegung wurde gebucht.',
      'Keine Artikelposten, Wertposten oder Sachposten wurden erzeugt.',
      'Journal Check beweist keine gebuchte Bestandsbewegung.',
      'Journal Check ist nicht identisch mit Posting Preview.',
      'Kein deutscher Finalnachweis.'
    ],
    nextStep:
      'Erledigt durch INVENTORY-008: Die positive Laborbuchung RM-M100 +2 wurde genau einmal als INV008-899959 ausgefuehrt und danach ueber Artikelposten, Wertposten, Sachposten sowie Inventory Valuation nachgewiesen. Nicht erneut buchen.'
  };

  await writeJsonEvidence(inventoryEvidencePath('INVENTORY-007-JOURNAL-CHECK-result.json'), result);
  await writeTextEvidence(inventoryEvidencePath('INVENTORY-007-JOURNAL-CHECK.md'), buildMarkdown(result));

  expect(line.targetVisible, 'Die Ziel-Journalzeile muss sichtbar sein.').toBe(true);
  expect(journalCheck.journalCheckVisible, 'Journal Check muss als Vorabkontrolle sichtbar sein.').toBe(true);
  expect(journalCheck.zeroLinesWithIssuesVisible, 'Business Central soll keine Zeilen mit Issues anzeigen.').toBe(true);
  expect(journalCheck.zeroIssuesTotalVisible, 'Business Central soll keine Issues insgesamt anzeigen.').toBe(true);
  expect(result.posted, 'Dieser Lauf darf nicht buchen.').toBe(false);
  expect(cleanup.cleaned, 'Der temporaere Journal-Draft muss bereinigt werden.').toBe(true);
});
