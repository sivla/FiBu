import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
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
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'manufacturing-001';

type TellMeTarget = {
  id: string;
  term: string;
  expected: RegExp;
  screenshotFile: string;
  purpose: string;
};

type ItemCheck = {
  itemNo: string;
  role: string;
  expected: RegExp;
  screenshotFile: string;
  purpose: string;
};

function manufacturingEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
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
    /Manufacturing|Assembly|Production|Planning|BOM|Routing|Worksheet|Consumption|Output|Item|Items|RM-M100|RAW-STEEL|COMP-CTRL|KIT-MAINT|Fertigung|Montage|Produktions|Stueckliste|Stuckliste|Arbeitsplan|Planungsarbeitsblatt|Verbrauch|Istmeldung|Artikel/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter(
      (line) =>
        Boolean(line) &&
        !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens|O365SuiteServiceProxy/i.test(line)
    );
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -1; offset <= 2; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
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

async function activateWideLayout(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const toggle = scope.getByRole('menuitemcheckbox', { name: /Breites Layout|Wide layout/i }).last();
    if (await toggle.isVisible({ timeout: 500 }).catch(() => false)) {
      const checked = await toggle.getAttribute('aria-checked').catch(() => null);
      if (checked !== 'true') {
        await toggle.click().catch(() => undefined);
        await page.waitForTimeout(1000);
      }
      return true;
    }

    const button = scope
      .getByRole('button', {
        name: /Breites Layout|Wide layout|Focus mode|Full screen|Maximi[sz]e|Expand|Fokus|Vollbild|Maximieren|Erweitern/i
      })
      .last();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click().catch(() => undefined);
      await page.waitForTimeout(1000);
      return true;
    }
  }

  return false;
}

async function captureTellMe(page: Page, target: TellMeTarget) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, target.term);
  await page.waitForTimeout(1500);

  const text = await pageText(page);
  const compactText = compactPageText(text);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const visible = target.expected.test(text);

  await writeTextEvidence(manufacturingEvidencePath(`${target.id}-page-text.txt`), compactText);
  await writeJsonEvidence(manufacturingEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: visible ? 'candidate' : 'rejected',
    bookUse: visible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Nur Tell-Me-/Navigationsevidence in RM-DEMO / CRONUS USA.',
      'Suchtreffer werden bewusst nicht als Prozessbeweis verwendet.',
      'Keine Stueckliste, kein Arbeitsplan, kein Fertigungsauftrag, kein Verbrauch, kein Output und keine Buchung.'
    ]
  });

  return {
    id: target.id,
    searchedFor: target.term,
    expectedVisible: visible,
    relevantButtons: buttons.filter((button) => /Production|Manufacturing|Assembly|BOM|Routing|Worksheet|Consumption|Output|Fertigung|Montage|Stueck|Arbeitsplan|Verbrauch|Istmeldung/i.test(button)),
    screenshot: target.screenshotFile,
    pageTextEvidenceFile: `${target.id}-page-text.txt`,
    buttonsEvidenceFile: `${target.id}-buttons.json`
  };
}

async function captureItem(page: Page, check: ItemCheck) {
  await page.goto(filteredBcPageUrl(31, 'Item', 'No.', check.itemNo), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await dismissTours(page);
  await hideFactBoxPane(page);
  const wideLayoutActivated = await activateWideLayout(page);
  await page.waitForTimeout(500);

  const text = normalizeText(await pageText(page));
  const compactText = compactPageText(text);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const itemVisible = check.expected.test(text);
  const setupMarkers = {
    productionBomVisible: /Production BOM|Prod\. BOM|Fertigungsstueckliste|Stueckliste/i.test(text),
    routingVisible: /Routing|Arbeitsplan/i.test(text),
    replenishmentVisible: /Replenishment System|Beschaffungsmethode|Replenishment/i.test(text),
    assemblyPolicyVisible: /Assembly Policy|Montagerichtlinie|Assemble-to-Order|Assemble-to-Stock/i.test(text),
    manufacturingPolicyVisible: /Manufacturing Policy|Fertigungsrichtlinie/i.test(text),
    inventoryPostingVisible: /Inventory Posting Group|Lagerbuchungsgruppe|RESALE/i.test(text)
  };

  await writeTextEvidence(manufacturingEvidencePath(`${check.itemNo.toLowerCase()}-item-page-text.txt`), compactText);
  await writeJsonEvidence(manufacturingEvidencePath(`${check.itemNo.toLowerCase()}-item-buttons.json`), buttons);
  await screenshot(page, check.screenshotFile, {
    projectName: project.name,
    testId,
    status: itemVisible ? 'labor' : 'rejected',
    bookUse: itemVisible ? 'evidence' : 'do-not-use',
    purpose: check.purpose,
    knownLimitations: [
      'Read-only Artikelkontext in RM-DEMO / CRONUS USA.',
      'Der Screenshot beweist keinen freigegebenen Production BOM, keinen Routing-Fit und keinen Produktionsauftrag.',
      'Keine Artikel- oder Setup-Aenderung, keine Buchung.'
    ]
  });

  return {
    itemNo: check.itemNo,
    role: check.role,
    itemVisible,
    setupMarkers,
    wideLayoutActivated,
    screenshot: check.screenshotFile,
    pageTextEvidenceFile: `${check.itemNo.toLowerCase()}-item-page-text.txt`,
    buttonsEvidenceFile: `${check.itemNo.toLowerCase()}-item-buttons.json`
  };
}

function renderMarkdown(result: Record<string, any>) {
  const tellMeRows = (result.tellMeEntries as Array<Record<string, any>>)
    .map((entry) => `| ${entry.searchedFor} | ${entry.expectedVisible ? 'ja' : 'nein'} | ${entry.screenshot} |`)
    .join('\n');
  const itemRows = (result.itemChecks as Array<Record<string, any>>)
    .map((entry) => `| ${entry.itemNo} | ${entry.itemVisible ? 'ja' : 'nein'} | ${entry.role} | ${entry.screenshot} |`)
    .join('\n');

  return [
    '# MANUFACTURING-001 Readiness',
    '',
    'Status: `labor`, `read-only`, `manufacturing-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Relevantes Gate | `MANUFACTURING-001-POSTING` locked |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '',
    '## Gepruefte UI-Einstiege',
    '',
    '| Tell-Me-Suche | Treffer sichtbar | Screenshot |',
    '|---|---|---|',
    tellMeRows,
    '',
    '## Gepruefte Zielartikel',
    '',
    '| Artikel | Sichtbar | Rolle im Buchfall | Screenshot |',
    '|---|---|---|---|',
    itemRows,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Fertigung startet nicht mit `Post`. Zuerst muss klar sein, ob Business Central die richtigen Einstiegsseiten kennt und ob die beteiligten Artikel als Zielartikel, Rohmaterial, Komponente oder Kit ueberhaupt vorhanden sind. Fuer eine Maschine braucht BC spaeter mindestens Artikel, Materialstruktur, Arbeitsplan oder Montage-/Fertigungslogik, Lagerort, Buchungsgruppen, Bestand und Kostenlogik. Wenn einer dieser Bausteine fehlt, scheitert die Produktion nicht am letzten Buchungsbutton, sondern schon an Stammdaten und Setup.',
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
    'Kapitel 14 darf Manufacturing/Assembly jetzt als eigenen Readiness-Block behandeln: Navigation und Zielobjekte muessen vor einer Produktion belegt werden. Der bestehende Inventory-Zugang `INV008-899959` bleibt ein Trainingsbestand, kein Manufacturing-Output. Fuer einen echten Produktionsfall braucht das Buch einen separaten Gate-Lauf mit Production BOM/Routing oder Assembly-BOM und danach Postenspur.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('MANUFACTURING-001 Manufacturing und Assembly Readiness read-only pruefen', async ({ page }) => {
  const tellMeTargets: TellMeTarget[] = [
    {
      id: '010-planning-worksheet-tell-me',
      term: 'Planning Worksheet',
      expected: /Planning Worksheet|Planungsarbeitsblatt/i,
      screenshotFile: 'manufacturing-001-010-planning-worksheet-tell-me.png',
      purpose: 'MANUFACTURING-001 Planungsarbeitsblatt als nicht buchenden Einstieg fuer Bedarfsplanung suchen.'
    },
    {
      id: '020-production-boms-tell-me',
      term: 'Production BOMs',
      expected: /Production BOM|BOM|Fertigungsstueckliste|Stueckliste/i,
      screenshotFile: 'manufacturing-001-020-production-boms-tell-me.png',
      purpose: 'MANUFACTURING-001 Production BOMs als Voraussetzung fuer RM-M100-Fertigung suchen.'
    },
    {
      id: '030-routings-tell-me',
      term: 'Routings',
      expected: /Routings|Routing|Arbeitsplaene|Arbeitsplan/i,
      screenshotFile: 'manufacturing-001-030-routings-tell-me.png',
      purpose: 'MANUFACTURING-001 Routings/Arbeitsplaene als Kapazitaetsvoraussetzung suchen.'
    },
    {
      id: '040-released-production-orders-tell-me',
      term: 'Released Production Orders',
      expected: /Released Production Orders|Production Orders|Freigegebene Fertigungsauftraege|Fertigungsauftraege/i,
      screenshotFile: 'manufacturing-001-040-released-production-orders-tell-me.png',
      purpose: 'MANUFACTURING-001 freigegebene Fertigungsauftraege als spaeteren Prozessort suchen.'
    },
    {
      id: '050-consumption-journal-tell-me',
      term: 'Consumption Journal',
      expected: /Consumption Journal|Verbrauch/i,
      screenshotFile: 'manufacturing-001-050-consumption-journal-tell-me.png',
      purpose: 'MANUFACTURING-001 Verbrauchsbuchblatt als spaeteren, gesperrten Buchungsort suchen.'
    },
    {
      id: '060-output-journal-tell-me',
      term: 'Output Journal',
      expected: /Output Journal|Istmeldung|Output/i,
      screenshotFile: 'manufacturing-001-060-output-journal-tell-me.png',
      purpose: 'MANUFACTURING-001 Istmeldung/Output Journal als spaeteren, gesperrten Buchungsort suchen.'
    },
    {
      id: '070-assembly-orders-tell-me',
      term: 'Assembly Orders',
      expected: /Assembly Orders|Assembly Order|Montageauftraege|Montageauftrag/i,
      screenshotFile: 'manufacturing-001-070-assembly-orders-tell-me.png',
      purpose: 'MANUFACTURING-001 Montageauftraege als Alternative zu voller Fertigung suchen.'
    }
  ];

  const tellMeEntries = [];
  for (const target of tellMeTargets) {
    tellMeEntries.push(await captureTellMe(page, target));
  }

  const itemChecks = [];
  const itemTargets: ItemCheck[] = [
    {
      itemNo: 'RM-M100',
      role: 'Fertigerzeugnis / Maschinenzielartikel',
      expected: /RM-M100|Standardmaschine/i,
      screenshotFile: 'manufacturing-001-080-item-rm-m100.png',
      purpose: 'MANUFACTURING-001 Zielartikel RM-M100 read-only pruefen: Ausgangspunkt fuer spaetere Produktion.'
    },
    {
      itemNo: 'RAW-STEEL',
      role: 'Rohmaterial aus P2P-Labor',
      expected: /RAW-STEEL|Stahl/i,
      screenshotFile: 'manufacturing-001-090-item-raw-steel.png',
      purpose: 'MANUFACTURING-001 Rohmaterial RAW-STEEL read-only pruefen: Materialseite fuer spaetere Produktion.'
    },
    {
      itemNo: 'COMP-CTRL',
      role: 'geplante Komponente',
      expected: /COMP-CTRL|Steuerung/i,
      screenshotFile: 'manufacturing-001-100-item-comp-ctrl.png',
      purpose: 'MANUFACTURING-001 geplante Komponente COMP-CTRL read-only pruefen; Rejected ist ein valider Datenlueckenbefund.'
    },
    {
      itemNo: 'KIT-MAINT',
      role: 'geplanter Assembly-/Service-Kit',
      expected: /KIT-MAINT|Wartung/i,
      screenshotFile: 'manufacturing-001-110-item-kit-maint.png',
      purpose: 'MANUFACTURING-001 geplanten Montageartikel KIT-MAINT read-only pruefen; Rejected ist ein valider Datenlueckenbefund.'
    }
  ];

  for (const itemTarget of itemTargets) {
    itemChecks.push(await captureItem(page, itemTarget));
  }

  const result = {
    testId,
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-manufacturing-assembly-readiness-no-posting-no-setup-change',
    gate: {
      id: 'MANUFACTURING-001-POSTING',
      status: 'locked',
      consequence: 'No Production BOM/Routing setup, no Production Order, no Consumption Journal posting, no Output Journal posting.'
    },
    tellMeEntries,
    itemChecks,
    safety: {
      setupChanged: false,
      itemChanged: false,
      productionOrderCreated: false,
      assemblyOrderCreated: false,
      consumptionPosted: false,
      outputPosted: false,
      posted: false
    },
    proves: [
      'Manufacturing- und Assembly-Einstiege wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.',
      'RM-M100 und RAW-STEEL wurden als vorhandene Laborartikel read-only geprueft.',
      'COMP-CTRL und KIT-MAINT wurden als geplante Buchartikel read-only geprueft; falls nicht sichtbar, ist das ein Stammdaten-Backlog-Befund.',
      'Der vorhandene positive RM-M100-Bestand aus INVENTORY-008 bleibt als Trainingsbestand getrennt von Manufacturing-Output.'
    ],
    doesNotProve: [
      'Kein Production BOM BOM-RM-M100.',
      'Kein Routing ROUTE-M100.',
      'Kein Fertigungsauftrag PROD-3001.',
      'Kein Verbrauch von RAW-STEEL oder COMP-CTRL.',
      'Kein Output von RM-M100.',
      'Kein Montageauftrag fuer KIT-MAINT.',
      'Keine Fertigungsauftragsstatistik, keine Kapazitaets- oder Wertposten aus Produktion.',
      'Kein deutscher Finalnachweis.'
    ],
    nextStep:
      'MANUFACTURING-002 als Buch-/Evidence-Sync fuer Kapitel 14: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Production BOM/Routing/Assembly-Setup UI-first vorbereiten.'
  };

  await writeJsonEvidence(manufacturingEvidencePath('MANUFACTURING-001-result.json'), result);
  await writeTextEvidence(manufacturingEvidencePath('MANUFACTURING-001-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    manufacturingEvidencePath('README.md'),
    [
      '# MANUFACTURING-001 Evidence-Index',
      '',
      'Ziel: Manufacturing-/Assembly-Readiness fuer Kapitel 14 read-only pruefen, ohne Setup, ohne Produktions-/Montageauftrag, ohne Verbrauch, ohne Output und ohne Buchung.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `MANUFACTURING-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, Tell-Me-Einstiege, Artikelbefunde, Sicherheitsgrenzen | keine Produktion, keine Montage, keine Buchung | labor, read-only |',
      '| `MANUFACTURING-001-READINESS.md` | Lernzusammenfassung | Warum Fertigung zuerst Stammdaten-/Setup-Readiness braucht | keinen Prozessnachweis | labor, gate-locked |',
      '| `010-*` bis `070-*` | Tell-Me-Evidence | sichtbare oder verworfene Einstiegspfade fuer Planning, BOM, Routing, Production Orders, Consumption, Output und Assembly | keinen geoeffneten Prozess und keine Buchung | navigation-evidence |',
      '| `rm-m100-*`, `raw-steel-*`, `comp-ctrl-*`, `kit-maint-*` | kompakter Artikel-Seitentext und Buttons | vorhandene oder fehlende Zielartikel im Labor | keine BOM-/Routing-Zuordnung und keinen Bestand-/Kosten-Endstand | item-readiness |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit | mixed |',
      '',
      '## Kernaussage',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(itemChecks.some((entry) => entry.itemNo === 'RM-M100' && entry.itemVisible)).toBe(true);
  expect(itemChecks.some((entry) => entry.itemNo === 'RAW-STEEL' && entry.itemVisible)).toBe(true);
});
