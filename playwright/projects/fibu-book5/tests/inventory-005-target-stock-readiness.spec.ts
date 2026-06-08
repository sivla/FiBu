import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  bcPageUrl,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

test.setTimeout(300_000);

const TEST_ID = 'inventory-005';
const DIRECT_ITEM_JOURNAL_PAGE_ID = 40;

type TargetStockPlan = {
  itemNo: string;
  locationCode: string;
  quantityToAdd: number;
  unitCost: number;
  dimension: Record<string, string>;
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

async function activateWideLayout(page: Page) {
  const selectors = [
    'button[aria-label*="Breites Layout" i]',
    'button[aria-label*="Wide layout" i]',
    'button[aria-label*="Focus mode" i]',
    'button[aria-label*="Full screen" i]',
    'button[aria-label*="Maximize" i]',
    'button[aria-label*="Maximise" i]',
    'button[aria-label*="Fokus" i]',
    'button[aria-label*="Vollbild" i]',
    'button[aria-label*="Maximieren" i]',
    'button[title*="Breites Layout" i]',
    'button[title*="Wide layout" i]',
    'button[title*="Focus mode" i]',
    'button[title*="Full screen" i]',
    'button[title*="Maximize" i]',
    'button[title*="Maximise" i]',
    'button[title*="Fokus" i]',
    'button[title*="Vollbild" i]',
    'button[title*="Maximieren" i]'
  ];

  for (const scope of [page, ...page.frames()]) {
    const checkbox = scope.getByRole('menuitemcheckbox', { name: /Breites Layout|Wide layout/i }).last();
    if (await checkbox.isVisible({ timeout: 500 }).catch(() => false)) {
      const checked = await checkbox.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await checkbox.click().catch(() => undefined);
        await page.waitForTimeout(1000);
      }
      return true;
    }

    const button = scope
      .getByRole('button', { name: /Breites Layout|Wide layout|Focus mode|Full screen|Maximi[sz]e|Fokus|Vollbild|Maximieren/i })
      .last();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(1000);
      return true;
    }

    for (const selector of selectors) {
      const candidate = scope.locator(selector).last();
      if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
        await candidate.click().catch(() => undefined);
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }

  return false;
}

async function openDirectItemJournalCandidate(page: Page) {
  await page.goto(bcPageUrl(DIRECT_ITEM_JOURNAL_PAGE_ID, project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3000);
  await dismissTours(page);
  const factBoxHidden = await hideFactBoxPane(page);
  const wideLayoutActivated = await activateWideLayout(page);
  await page.waitForTimeout(1000);

  const text = normalizeText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  await writeTextEvidence(inventoryEvidencePath('010-item-journal-direct-page-text.txt'), text);
  await writeJsonEvidence(inventoryEvidencePath('010-item-journal-direct-buttons.json'), buttons);
  await screenshot(page, 'inventory-005-010-item-journal-direct.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: /Item Journal|Item Journals|Artikeljournal|Artikel Buch/i.test(text) ? 'labor' : 'rejected',
    purpose: 'Read-only-Kandidat fuer den positiven RM-M100-Trainingsbestand: direkte BC-Seite 40 Item Journal.',
    knownLimitations: [
      'Keine Zeile wurde angelegt oder gebucht.',
      'Page-ID 40 ist Laborbefund in RM-DEMO und muss im deutschen Zielmandanten erneut geprueft werden.',
      'Der Screenshot beweist den Einstieg, nicht die spaetere Buchungswirkung.'
    ],
    bookUse: 'navigation'
  });

  return {
    pageId: DIRECT_ITEM_JOURNAL_PAGE_ID,
    textEvidenceFile: '010-item-journal-direct-page-text.txt',
    buttonEvidenceFile: '010-item-journal-direct-buttons.json',
    screenshot: 'inventory-005-010-item-journal-direct.png',
    pageLooksLikeItemJournal: /Item Journal|Item Journals|Artikeljournal|Artikel Buch/i.test(text),
    hasItemNoOrNoField: /Item No\.|Artikelnummer|No\./i.test(text),
    hasEntryType: /Entry Type|Buchungsart|Postenart/i.test(text),
    hasPostingDate: /Posting Date|Buchungsdatum/i.test(text),
    hasDocumentNo: /Document No\.|Belegnr\.|Belegnummer/i.test(text),
    hasLocationCode: /Location Code|Lagerortcode|Lagerort/i.test(text),
    hasQuantity: /Quantity|Menge/i.test(text),
    hasUnitCost: /Unit Cost|Einstandspreis|Kosten/i.test(text),
    hasDimensionsText: /Dimension|Dimensions|Dimensionen/i.test(text),
    hasPreviewAction: /Preview Posting|Buchungsvorschau|Vorschau buchen|Vorschau/i.test(text) || buttons.some((name) => /Preview|Vorschau/i.test(name)),
    hasPostAction: /Post\b|Buchen\b|Register\b|Registrieren\b/i.test(text) || buttons.some((name) => /Post|Buchen|Register|Registrieren/i.test(name)),
    existingDefaultLineVisible: /DEFAULT/i.test(text) && /Positive Adjmt\.|Purchase|Sale|Negative Adjmt\./i.test(text),
    targetItemVisible: /RM-M100/i.test(text),
    targetLocationVisible: /FRA-ZL/i.test(text),
    targetQuantityVisible: /RM-M100[\s\S]{0,300}\b2(?:\.00|,00)?\b/i.test(text),
    factBoxHidden,
    wideLayoutActivated
  };
}

async function captureTellMeCandidates(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'Item Journals');
  await page.waitForTimeout(1500);

  const text = normalizeText(await pageText(page));
  const buttons = await visibleButtonNames(page);
  await writeTextEvidence(inventoryEvidencePath('020-item-journals-tell-me-page-text.txt'), text);
  await writeJsonEvidence(inventoryEvidencePath('020-item-journals-tell-me-buttons.json'), buttons);
  await screenshot(page, 'inventory-005-020-item-journals-tell-me.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: /Item Journal|Item Journals|Artikeljournal|Artikel Buch|Inventory Journal|Lagerjournal/i.test(text) ? 'labor' : 'rejected',
    purpose: 'Tell-Me-Suchbild fuer den stabilen Journal-Einstieg, ohne Enter-Fallback und ohne Buchung.',
    knownLimitations: [
      'Suchtreffer sind UI-/Sprachabhaengig; der konkrete Buchungslauf muss den richtigen Treffer bewusst waehlen.',
      'Kein Journal wurde in diesem Suchbild geoeffnet oder gebucht.'
    ],
    bookUse: 'navigation'
  });

  return {
    searchedFor: 'Item Journals',
    textEvidenceFile: '020-item-journals-tell-me-page-text.txt',
    buttonEvidenceFile: '020-item-journals-tell-me-buttons.json',
    screenshot: 'inventory-005-020-item-journals-tell-me.png',
    itemJournalResultVisible: /Item Journal|Item Journals|Artikeljournal|Artikel Buch/i.test(text),
    inventoryJournalResultVisible: /Inventory Journal|Lagerjournal/i.test(text),
    resultGroupVisible: /Tasks|Aufgaben|Pages and Tasks|Verwaltung|Listen|Reports and Analysis|Berichte und Analysen/i.test(text)
  };
}

function buildMarkdown(result: Record<string, unknown>) {
  const direct = result.directPage as Record<string, unknown>;
  const tellMe = result.tellMe as Record<string, unknown>;
  const plan = result.targetPlan as TargetStockPlan;

  return [
    '# INVENTORY-005 Target Stock Readiness',
    '',
    'Status: Labor-Readiness, read-only, keine Buchung.',
    '',
    '## Ziel',
    '',
    'Nach `INVENTORY-004` soll der positive Trainings-/Opening-Balance-Zugang fuer `RM-M100` vorbereitet werden. Dieser Lauf prueft nur den stabilen BC-Einstieg und die sichtbaren Kontrollpunkte. Er erzeugt keinen Artikelposten.',
    '',
    '## Geplanter fachlicher Zielzustand',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Artikel | ${plan.itemNo} |`,
    `| Lagerort | ${plan.locationCode} |`,
    `| Zugang | ${plan.quantityToAdd} |`,
    `| Unit Cost | ${plan.unitCost} |`,
    `| Dimension | PRODUCTLINE=${plan.dimension.PRODUCTLINE ?? 'nicht geplant'} |`,
    '',
    '## Praktischer Befund',
    '',
    '| Pruefpunkt | Ergebnis |',
    '|---|---|',
    `| Sandbox | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Direkte Seite 40 wirkt wie Item Journal | ${direct.pageLooksLikeItemJournal ? 'ja' : 'nein'} |`,
    `| Tell-Me zeigt Journal-Treffer | ${tellMe.itemJournalResultVisible || tellMe.inventoryJournalResultVisible ? 'ja' : 'nein'} |`,
    `| Feld Artikel/No. sichtbar | ${direct.hasItemNoOrNoField ? 'ja' : 'nein'} |`,
    `| Feld Entry Type sichtbar | ${direct.hasEntryType ? 'ja' : 'nein'} |`,
    `| Feld Posting Date sichtbar | ${direct.hasPostingDate ? 'ja' : 'nein'} |`,
    `| Feld Document No. sichtbar | ${direct.hasDocumentNo ? 'ja' : 'nein'} |`,
    `| Feld Location Code sichtbar | ${direct.hasLocationCode ? 'ja' : 'nein'} |`,
    `| Feld Quantity sichtbar | ${direct.hasQuantity ? 'ja' : 'nein'} |`,
    `| Dimensionen sichtbar/ansprechbar | ${direct.hasDimensionsText ? 'ja' : 'nein'} |`,
    `| Preview-Hinweis/Aktion sichtbar | ${direct.hasPreviewAction ? 'ja' : 'nein'} |`,
    `| Buchungsaktion sichtbar | ${direct.hasPostAction ? 'ja' : 'nein'} |`,
    `| Bestehende/default Journalzeile sichtbar | ${direct.existingDefaultLineVisible ? 'ja' : 'nein'} |`,
    `| Zielartikel RM-M100 bereits sichtbar | ${direct.targetItemVisible ? 'ja' : 'nein'} |`,
    `| Ziellagerort FRA-ZL bereits sichtbar | ${direct.targetLocationVisible ? 'ja' : 'nein'} |`,
    `| Zielmenge 2 bereits sichtbar | ${direct.targetQuantityVisible ? 'ja' : 'nein'} |`,
    `| FactBox eingeklappt | ${direct.factBoxHidden ? 'ja' : 'nein'} |`,
    `| Breite Layoutansicht aktiviert | ${direct.wideLayoutActivated ? 'ja' : 'nein'} |`,
    `| Neue Buchung | nein |`,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Ein Bestand wird in Business Central nicht durch eine manuelle Sachpostenbuchung korrigiert, wenn Artikel- und Lagerbewertung verstanden werden sollen. Der richtige Einstieg ist ein Artikel-/Bestandsjournal, weil Business Central daraus Artikelposten, Wertposten und je nach Setup Sachposten erzeugen kann. Vor einer Buchung muss sichtbar sein, ob Artikel, Buchungsart, Datum, Belegnummer, Lagerort, Menge, Kosten und Dimensionen kontrolliert gesetzt werden koennen.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 13/23 koennen den naechsten Praxisschritt jetzt konkret formulieren: zuerst das Item Journal als kontrollierten Einstieg zeigen, danach erst die positive Trainingsbewegung buchen. Das verhindert, dass Leser eine negative Lagerbewertung mit einer falschen Fibu-Direktbuchung zu reparieren versuchen.',
    '',
    '## Laborgrenze',
    '',
    'Dieser Lauf beweist keinen Bestand, keine Postenspur, keine Lagerbewertungsverbesserung, keinen deutschen Kontenplan und keine deutsche USt. Page 40 und die sichtbaren Beschriftungen sind CRONUS-USA-/RM-DEMO-Laborbefund und muessen fuer finale deutsche Bilder erneut belegt werden.',
    '',
    '## Naechster konkreter Schritt',
    '',
    'INVENTORY-006 sollte genau eine kontrollierte Ziel-Journalzeile fuer `RM-M100 +2` in `FRA-ZL` vorbereiten. Vor `Post` muss geklaert werden, ob `Preview Posting` auf dem Journal stabil erreichbar ist. Erst wenn Zielwerte, Dimension und Preview passen, darf genau einmal gebucht und danach Artikelposten, Wertposten, Sachposten und `Inventory Valuation` gesichert werden.',
    ''
  ].join('\n');
}

test('INVENTORY-005 Item-Journal-Pfad fuer RM-M100-Zielbestand read-only pruefen', async ({ page }) => {
  const targetPlan = await loadTargetStockPlan();
  const directPage = await openDirectItemJournalCandidate(page);
  const tellMe = await captureTellMeCandidates(page);

  const result = {
    testId: 'INVENTORY-005',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-readiness-no-posting',
    targetPlan,
    directPage,
    tellMe,
    proves: [
      'Page 40 ist als Labor-Kandidat fuer Item Journal erreichbar, sofern pageLooksLikeItemJournal true ist.',
      'Tell-Me zeigt Journal-Einstiege, sofern itemJournalResultVisible oder inventoryJournalResultVisible true ist.',
      'Der Lauf zeigt, welche Felder und Aktionen vor einer positiven Bestandsbewegung sichtbar geprueft werden koennen.'
    ],
    doesNotProve: [
      'Kein Bestand wurde gebucht.',
      'Keine Ziel-Journalzeile fuer RM-M100 wurde angelegt.',
      'Keine Preview-Posting-Zahlenwirkung wurde bewiesen.',
      'Keine Artikelposten, Wertposten oder Sachposten wurden erzeugt.',
      'Kein deutscher Finalnachweis.'
    ],
    safeForNextStep:
      directPage.pageLooksLikeItemJournal &&
      (directPage.hasItemNoOrNoField || directPage.hasEntryType || directPage.hasQuantity || directPage.hasPostAction),
    nextStep:
      'Eine separate kontrollierte INVENTORY-006-Ausfuehrung kann die Journalzeile vorbereiten, Preview Posting pruefen und nur bei passendem Zielbild genau einmal buchen.'
  };

  await writeJsonEvidence(inventoryEvidencePath('INVENTORY-005-TARGET-STOCK-READINESS-result.json'), result);
  await writeTextEvidence(inventoryEvidencePath('INVENTORY-005-TARGET-STOCK-READINESS.md'), buildMarkdown(result));

  expect(directPage.pageLooksLikeItemJournal || tellMe.itemJournalResultVisible || tellMe.inventoryJournalResultVisible).toBe(true);
});
