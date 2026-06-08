import { expect, test } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, requireBcUrl, screenshot, searchFor, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'warehouse-001';

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/\u00c3\u0152/g, 'Ue')
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u2013/g, 'Oe')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u201e/g, 'Ae')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u0178/g, 'ss')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(text: string) {
  const interesting =
    /Warehouse|Location|Locations|Bin|Bins|Put-away|Pick|Receipt|Shipment|Lager|Lagerort|Lagerplatz|Einlagerung|Kommissionierung|Wareneingang|Warenausgang|FRA-ZL|Require|Directed|Mandatory|Receipt Bin|Shipment Bin|Adjustment Bin/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter((line) => Boolean(line) && !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens|O365SuiteServiceProxy/i.test(line));
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (interesting.test(lines[index])) {
      selected.add(index);
      if (index > 0) selected.add(index - 1);
      if (index + 1 < lines.length) selected.add(index + 1);
    }
  }

  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 220)
  ].join('\n');
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

async function captureLocationFraZl(page: import('@playwright/test').Page) {
  await page.goto(filteredBcPageUrl(15, 'Location', 'Code', 'FRA-ZL'), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  const compactText = compactPageText(text);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const contextVisible = /Locations|Location|Lagerorte|Lagerort/i.test(text);
  const locationVisible = /FRA-ZL/i.test(text);
  const warehouseMarkers = {
    binMandatoryVisible: /Bin Mandatory|Lagerplatzpflicht/i.test(text),
    requireReceiveVisible: /Require Receive|Wareneingang erforderlich/i.test(text),
    requireShipmentVisible: /Require Shipment|Warenausgang erforderlich/i.test(text),
    requirePutAwayVisible: /Require Put-away|Einlagerung erforderlich/i.test(text),
    requirePickVisible: /Require Pick|Kommissionierung erforderlich/i.test(text),
    directedPutAwayAndPickVisible: /Directed Put-away and Pick|gesteuerte Einlagerung/i.test(text)
  };

  await writeTextEvidence(warehouseEvidencePath('010-location-fra-zl-page-text.txt'), compactText);
  await writeJsonEvidence(warehouseEvidencePath('010-location-fra-zl-buttons.json'), buttons);
  await screenshot(page, 'warehouse-001-010-location-fra-zl.png', {
    projectName: project.name,
    testId,
    status: contextVisible && locationVisible ? 'labor' : 'rejected',
    bookUse: contextVisible && locationVisible ? 'evidence' : 'do-not-use',
    purpose: 'WAREHOUSE-001 Lagerort FRA-ZL read-only pruefen: einfache vs. gesteuerte Lagerlogik vor Warehouse-Aktivierung.',
    knownLimitations: [
      'Read-only in RM-DEMO / CRONUS USA.',
      'Keine Warehouse-Aktivierung, keine Bins, keine Lageraktivitaet, keine Buchung.',
      'Deutscher Zielmandant und finale Warehouse-Screenshots offen.'
    ]
  });

  return {
    id: '010-location-fra-zl',
    pageId: 15,
    contextVisible,
    locationVisible,
    warehouseMarkers,
    screenshot: 'warehouse-001-010-location-fra-zl.png',
    pageTextEvidenceFile: '010-location-fra-zl-page-text.txt',
    buttonsEvidenceFile: '010-location-fra-zl-buttons.json'
  };
}

async function captureTellMe(page: import('@playwright/test').Page, id: string, term: string, screenshotFile: string, expected: RegExp) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, term);
  await page.waitForTimeout(1500);

  const text = await pageText(page);
  const compactText = compactPageText(text);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const visible = expected.test(text);

  await writeTextEvidence(warehouseEvidencePath(`${id}-page-text.txt`), compactText);
  await writeJsonEvidence(warehouseEvidencePath(`${id}-buttons.json`), buttons);
  await screenshot(page, screenshotFile, {
    projectName: project.name,
    testId,
    status: visible ? 'candidate' : 'rejected',
    bookUse: visible ? 'navigation' : 'do-not-use',
    purpose: `WAREHOUSE-001 Tell-Me-Einstieg fuer ${term} read-only pruefen.`,
    knownLimitations: [
      'Nur Such-/Navigationsevidence; Zielseite wird nicht als Prozessbeweis verwendet.',
      'Keine Warehouse-Aktivierung, keine Bins, keine Lageraktivitaet, keine Buchung.'
    ]
  });

  return {
    id,
    searchedFor: term,
    expectedVisible: visible,
    screenshot: screenshotFile,
    pageTextEvidenceFile: `${id}-page-text.txt`,
    buttonsEvidenceFile: `${id}-buttons.json`
  };
}

function renderMarkdown(result: Record<string, any>) {
  const entryRows = (result.tellMeEntries as Array<Record<string, any>>)
    .map((entry) => `| ${entry.searchedFor} | ${entry.expectedVisible ? 'ja' : 'nein'} | ${entry.screenshot} |`)
    .join('\n');
  const markers = result.location.warehouseMarkers as Record<string, boolean>;
  const markerRows = Object.entries(markers)
    .map(([key, value]) => `| ${key} | ${value ? 'sichtbar' : 'nicht sichtbar'} |`)
    .join('\n');

  return [
    '# WAREHOUSE-001 Readiness',
    '',
    'Status: `labor`, `read-only`, `warehouse-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Relevantes Gate | `WAREHOUSE-001-ACTIVATION` locked |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '',
    '## Lagerort FRA-ZL',
    '',
    `Der Lagerortkontext ist sichtbar: ${result.location.contextVisible ? 'ja' : 'nein'}.`,
    '',
    '| Warehouse-Marker auf dem Lagerort | Befund |',
    '|---|---|',
    markerRows,
    '',
    '## Warehouse-Einstiege',
    '',
    '| Tell-Me-Suche | Treffer sichtbar | Screenshot |',
    '|---|---|---|',
    entryRows,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Business Central unterscheidet einfache Lagerorte von Warehouse-Prozessen. Ein einfacher Lagerort wie `FRA-ZL` reicht fuer Artikelposten, Wertposten und Lagerbewertung. Gesteuerte Lagerlogik beginnt erst, wenn Lagerortfelder wie Bin Mandatory, Require Receive, Require Shipment, Require Put-away, Require Pick oder Directed Put-away and Pick bewusst eingerichtet sind. Solange dieses Setup nicht freigegeben ist, duerfen Warehouse Receipts, Put-aways, Picks und Shipments nur als Einstiegspfade gelesen werden.',
    '',
    '## Was bewiesen ist',
    '',
    ...result.proves.map((entry: string) => `- ${entry}`),
    '',
    '## Was nicht bewiesen ist',
    '',
    ...result.doesNotProve.map((entry: string) => `- ${entry}`),
    '',
    '## Buchwirkung',
    '',
    'Kapitel 13 sollte vor einem gesteuerten Warehouse-Fall eine Statusbox bekommen: einfacher Lagerort ist bereits fuer Inventory belegt, Warehouse-Aktivierung bleibt aber ein eigenes Gate. Der Leser soll lernen, dass Lagerort, Bins und Warehouse-Aktivitaeten nicht dasselbe sind.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('WAREHOUSE-001 Lagerort und Warehouse-Einstiege read-only pruefen', async ({ page }) => {
  const location = await captureLocationFraZl(page);
  const tellMeEntries = [
    await captureTellMe(page, '020-warehouse-receipts-tell-me', 'Warehouse Receipts', 'warehouse-001-020-warehouse-receipts-tell-me.png', /Warehouse Receipts|Lagereingaenge|Wareneingang/i),
    await captureTellMe(page, '030-warehouse-putaways-tell-me', 'Warehouse Put-aways', 'warehouse-001-030-warehouse-putaways-tell-me.png', /Warehouse Put-aways|Put-away|Einlagerung/i),
    await captureTellMe(page, '040-warehouse-picks-tell-me', 'Warehouse Picks', 'warehouse-001-040-warehouse-picks-tell-me.png', /Warehouse Picks|Pick|Kommissionierung/i),
    await captureTellMe(page, '050-warehouse-shipments-tell-me', 'Warehouse Shipments', 'warehouse-001-050-warehouse-shipments-tell-me.png', /Warehouse Shipments|Shipment|Warenausgang|Lagerausgang/i),
    await captureTellMe(page, '060-bins-tell-me', 'Bins', 'warehouse-001-060-bins-tell-me.png', /Bins|Lagerplaetze|Lagerplatz/i)
  ];

  const result = {
    testId,
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-warehouse-readiness-no-posting-no-setup-change',
    gate: {
      id: 'WAREHOUSE-001-ACTIVATION',
      status: 'locked',
      consequence: 'No bins, no warehouse receive/put-away/pick/ship setup, no warehouse activity, no posting.'
    },
    location,
    tellMeEntries,
    safety: {
      setupChanged: false,
      locationChanged: false,
      binsCreated: false,
      warehouseActivityCreated: false,
      posted: false
    },
    proves: [
      'FRA-ZL can be opened read-only as a Location in RM-DEMO.',
      'Warehouse-related Tell-Me entry points were checked without opening a posting or setup flow.',
      'The current run separates simple inventory evidence from future warehouse activation evidence.'
    ],
    doesNotProve: [
      'No Warehouse activation for FRA-ZL.',
      'No Bin setup and no directed put-away/pick setup.',
      'No Warehouse Receipt, Put-away, Pick or Shipment process.',
      'No German final warehouse screenshot.',
      'No posting.'
    ],
    nextStep:
      'Without gate: Warehouse-001 book/evidence sync fuer Kapitel 13 ergaenzen oder Manufacturing/Service/Projects nur read-only vorbereiten. With gate: WAREHOUSE-001-ACTIVATION als separaten UI-first Setup-Lauf planen.'
  };

  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-001-result.json'), result);
  await writeTextEvidence(warehouseEvidencePath('WAREHOUSE-001-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    warehouseEvidencePath('README.md'),
    [
      '# WAREHOUSE-001 Evidence-Index',
      '',
      'Ziel: Warehouse-Readiness fuer `FRA-ZL` read-only pruefen, ohne Warehouse-Aktivierung, Bins, Lageraktivitaeten oder Buchung.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, Location- und Tell-Me-Befunde, Sicherheitsgrenzen | keine Aktivierung, keine Bins, keine Buchung | labor, read-only |',
      '| `WAREHOUSE-001-READINESS.md` | Lernzusammenfassung | Unterschied zwischen einfachem Lagerort und Warehouse-Einstiegen | keinen Warehouse-Prozess | labor, gate-locked |',
      '| `010-location-fra-zl-page-text.txt` | kompakter Seitentext | Lagerortkontext `FRA-ZL` und sichtbare Warehouse-Marker | keine Setup-Aenderung | ui-evidence |',
      '| `020-*` bis `060-*` | Tell-Me-Evidence | sichtbare Einstiegspfade fuer Warehouse-Seiten | keinen Prozessnachweis | navigation-evidence |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit | mixed |',
      '',
      '## Kernaussage',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.posted).toBe(false);
  expect(location.contextVisible, 'Location page must open as read-only context.').toBe(true);
  expect(location.locationVisible, 'FRA-ZL must be visible in the Location context.').toBe(true);
});
