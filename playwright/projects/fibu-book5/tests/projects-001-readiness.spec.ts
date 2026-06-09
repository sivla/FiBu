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

const testId = 'projects-001';

type TellMeTarget = {
  id: string;
  term: string;
  expected: RegExp;
  screenshotFile: string;
  purpose: string;
};

type DirectCheck = {
  id: string;
  pageId: number;
  tableName: string;
  fieldName: string;
  value: string;
  expected: RegExp;
  screenshotFile: string;
  purpose: string;
  role: string;
};

function projectsEvidencePath(fileName: string) {
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
    /Project|Projects|Job|Jobs|Task|Planning Lines|Project Journal|Job Journal|Ledger Entries|Statistics|WIP|Resources|Resource|Item|Items|Location|Customer|D10000|PROJ-5001|RES-TECH|SP-SENSOR-02|PROJ-LAG|RM-X500|Projekt|Projektposten|Projektplanzeilen|Projektaufgaben|Ressource|Artikel|Lagerort|Debitor/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => sanitizeEvidenceText(line.replace(/\s+/g, ' ').trim()))
    .filter(
      (line) =>
        Boolean(line) &&
        !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens|O365SuiteServiceProxy|authority:|cacheLocation:|parentPageOrigin:|upn:/i.test(line)
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

  await writeTextEvidence(projectsEvidencePath(`${target.id}-page-text.txt`), compactText);
  await writeJsonEvidence(projectsEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: visible ? 'candidate' : 'rejected',
    bookUse: visible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Nur Tell-Me-/Navigationsevidence in RM-DEMO / CRONUS USA.',
      'Suchtreffer werden bewusst nicht als Projektprozessbeweis verwendet.',
      'Keine Projektanlage, keine Projektplanzeile, kein Projektjournal, keine WIP-Berechnung, keine Rechnung und keine Buchung.'
    ]
  });

  return {
    id: target.id,
    searchedFor: target.term,
    expectedVisible: visible,
    relevantButtons: buttons.filter((button) => /Project|Job|Task|Planning|Journal|Ledger|Statistic|WIP|Projekt|Posten|Ressource/i.test(button)),
    screenshot: target.screenshotFile,
    pageTextEvidenceFile: `${target.id}-page-text.txt`,
    buttonsEvidenceFile: `${target.id}-buttons.json`
  };
}

async function captureDirectCheck(page: Page, check: DirectCheck) {
  await page.goto(filteredBcPageUrl(check.pageId, check.tableName, check.fieldName, check.value), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await dismissTours(page);
  await hideFactBoxPane(page);
  const wideLayoutActivated = await activateWideLayout(page);
  await page.waitForTimeout(500);

  const text = normalizeText(await pageText(page));
  const compactText = compactPageText(text);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const targetVisible = check.expected.test(text);
  const setupMarkers = {
    projectContextVisible: /Project|Projects|Job|Jobs|Projekt/i.test(text),
    planningContextVisible: /Planning Lines|Planzeilen|Budget/i.test(text),
    taskContextVisible: /Task|Aufgabe/i.test(text),
    postingGroupVisible: /Posting Group|Buchungsgruppe/i.test(text),
    priceVisible: /Unit Price|Price|Einheitspreis|Verkaufspreis|Preis/i.test(text),
    dimensionVisible: /Dimension|Dimensionen|PROJECT|PRODUCTLINE/i.test(text)
  };

  await writeTextEvidence(projectsEvidencePath(`${check.id}-page-text.txt`), compactText);
  await writeJsonEvidence(projectsEvidencePath(`${check.id}-buttons.json`), buttons);
  await screenshot(page, check.screenshotFile, {
    projectName: project.name,
    testId,
    status: targetVisible ? 'labor' : 'rejected',
    bookUse: targetVisible ? 'evidence' : 'do-not-use',
    purpose: check.purpose,
    knownLimitations: [
      'Read-only Objektkontext in RM-DEMO / CRONUS USA.',
      'Direkte Page-ID-/Filteroeffnung ist technischer UI-Nachweispfad; Buch-Klickpfad bleibt Alt+Q/Tell-Me.',
      'Keine Anlage oder Aenderung von Projekt, Ressource, Artikel, Lagerort oder Debitor.',
      'Keine Projektbuchung, keine WIP-Berechnung, keine Projektfaktura und kein deutscher Finalnachweis.'
    ]
  });

  return {
    id: check.id,
    pageId: check.pageId,
    tableName: check.tableName,
    fieldName: check.fieldName,
    value: check.value,
    role: check.role,
    targetVisible,
    setupMarkers,
    wideLayoutActivated,
    screenshot: check.screenshotFile,
    pageTextEvidenceFile: `${check.id}-page-text.txt`,
    buttonsEvidenceFile: `${check.id}-buttons.json`
  };
}

function renderMarkdown(result: Record<string, any>) {
  const tellMeRows = (result.tellMeEntries as Array<Record<string, any>>)
    .map((entry) => `| ${entry.searchedFor} | ${entry.expectedVisible ? 'ja' : 'nein'} | ${entry.screenshot} |`)
    .join('\n');
  const directRows = (result.directChecks as Array<Record<string, any>>)
    .map((entry) => `| ${entry.value} | ${entry.targetVisible ? 'ja' : 'nein'} | ${entry.role} | ${entry.screenshot} |`)
    .join('\n');

  return [
    '# PROJECTS-001 Readiness',
    '',
    'Status: `labor`, `read-only`, `projects-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Relevantes Gate | `PROJECTS-001-POSTING` locked |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '',
    '## Gepruefte UI-Einstiege',
    '',
    '| Tell-Me-Suche | Treffer sichtbar | Screenshot |',
    '|---|---|---|',
    tellMeRows,
    '',
    '## Gepruefte Zielobjekte',
    '',
    '| Objekt | Sichtbar | Rolle im Buchfall | Screenshot |',
    '|---|---|---|---|',
    directRows,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Projekte starten nicht mit einer Rechnung. Zuerst muss klar sein, ob Business Central den Projektbereich findet und ob Projekt, Debitor, Ressource, Materialartikel und Projektlager ueberhaupt vorhanden sind. Erst danach machen Projektplanzeilen, Projektjournale, WIP oder Meilensteinrechnung fachlich Sinn. Wenn `PROJ-5001`, `RES-TECH`, `SP-SENSOR-02` oder `PROJ-LAG` fehlen, ist das kein Klickfehler des Anfaengers, sondern eine Stammdaten- oder Setup-Luecke.',
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
    'Kapitel 16 darf den aktuellen Stand nur als Project-Readiness behandeln. Die Zielschritte `PROJ-5001`, Projektaufgaben, Projektplanzeilen, Projektjournal, WIP-nahe Sicht, Meilensteinrechnung und Postenspur bleiben Gate-gesperrt, bis die benoetigten Stammdaten und ein eigener UI-first Projektlauf freigegeben sind.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('PROJECTS-001 Project-Readiness read-only pruefen', async ({ page }) => {
  const tellMeTargets: TellMeTarget[] = [
    {
      id: '010-projects-tell-me',
      term: 'Projects',
      expected: /Projects|Project|Jobs|Job|Projekte|Projekt/i,
      screenshotFile: 'projects-001-010-projects-tell-me.png',
      purpose: 'PROJECTS-001 Projekte als nicht buchenden Einstieg fuer Kapitel 16 suchen.'
    },
    {
      id: '020-project-planning-lines-tell-me',
      term: 'Project Planning Lines',
      expected: /Project Planning Lines|Job Planning Lines|Projektplanzeilen/i,
      screenshotFile: 'projects-001-020-project-planning-lines-tell-me.png',
      purpose: 'PROJECTS-001 Projektplanzeilen als Planungsort vor Verbrauch und Faktura suchen.'
    },
    {
      id: '030-project-journals-tell-me',
      term: 'Project Journals',
      expected: /Project Journals|Job Journals|Projekt Buch|Projektjournale/i,
      screenshotFile: 'projects-001-030-project-journals-tell-me.png',
      purpose: 'PROJECTS-001 Projektjournale als spaeteren, gesperrten Buchungsort suchen.'
    },
    {
      id: '040-project-ledger-entries-tell-me',
      term: 'Project Ledger Entries',
      expected: /Project Ledger Entries|Job Ledger Entries|Projektposten/i,
      screenshotFile: 'projects-001-040-project-ledger-entries-tell-me.png',
      purpose: 'PROJECTS-001 Projektposten als spaeteren Nachweispfad suchen.'
    },
    {
      id: '050-project-statistics-tell-me',
      term: 'Project Statistics',
      expected: /Project Statistics|Job Statistics|Projektstatistik/i,
      screenshotFile: 'projects-001-050-project-statistics-tell-me.png',
      purpose: 'PROJECTS-001 Projektstatistik als spaeteren Kontrollbericht suchen.'
    },
    {
      id: '060-project-wip-tell-me',
      term: 'Project WIP',
      expected: /Project WIP|Job WIP|WIP/i,
      screenshotFile: 'projects-001-060-project-wip-tell-me.png',
      purpose: 'PROJECTS-001 WIP-Kontext sichtbar machen, aber wegen Gate nicht berechnen oder buchen.'
    }
  ];

  const tellMeEntries = [];
  for (const target of tellMeTargets) {
    tellMeEntries.push(await captureTellMe(page, target));
  }

  const directTargets: DirectCheck[] = [
    {
      id: '070-project-proj-5001',
      pageId: 89,
      tableName: 'Job',
      fieldName: 'No.',
      value: 'PROJ-5001',
      expected: /PROJ-5001|Installation Sondermaschine/i,
      screenshotFile: 'projects-001-070-project-proj-5001.png',
      purpose: 'PROJECTS-001 Zielprojekt PROJ-5001 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplantes Projekt fuer Installation Sondermaschine'
    },
    {
      id: '080-customer-d10000',
      pageId: 22,
      tableName: 'Customer',
      fieldName: 'No.',
      value: 'D10000',
      expected: /D10000|Mueller Maschinenbau|Muller Maschinenbau/i,
      screenshotFile: 'projects-001-080-customer-d10000.png',
      purpose: 'PROJECTS-001 Debitor D10000 read-only als Projektkunde pruefen.',
      role: 'Projektkunde / Meilensteinfaktura'
    },
    {
      id: '090-resource-res-tech',
      pageId: 77,
      tableName: 'Resource',
      fieldName: 'No.',
      value: 'RES-TECH',
      expected: /RES-TECH/i,
      screenshotFile: 'projects-001-090-resource-res-tech.png',
      purpose: 'PROJECTS-001 Ressource RES-TECH read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplante Technikerzeit'
    },
    {
      id: '100-item-sp-sensor-02',
      pageId: 31,
      tableName: 'Item',
      fieldName: 'No.',
      value: 'SP-SENSOR-02',
      expected: /SP-SENSOR-02|Sensor/i,
      screenshotFile: 'projects-001-100-item-sp-sensor-02.png',
      purpose: 'PROJECTS-001 Artikel SP-SENSOR-02 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter Materialverbrauch im Projekt'
    },
    {
      id: '110-location-proj-lag',
      pageId: 15,
      tableName: 'Location',
      fieldName: 'Code',
      value: 'PROJ-LAG',
      expected: /PROJ-LAG/i,
      screenshotFile: 'projects-001-110-location-proj-lag.png',
      purpose: 'PROJECTS-001 Lagerort PROJ-LAG read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter Projektlagerort'
    }
  ];

  const directChecks = [];
  for (const directTarget of directTargets) {
    directChecks.push(await captureDirectCheck(page, directTarget));
  }

  const result = {
    testId,
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-projects-readiness-no-posting-no-setup-change',
    gate: {
      id: 'PROJECTS-001-POSTING',
      status: 'locked',
      consequence: 'No project creation, no project task setup, no planning line, no project journal, no WIP calculation, no sales invoice, no posting.'
    },
    tellMeEntries,
    directChecks,
    safety: {
      setupChanged: false,
      projectCreated: false,
      projectTaskChanged: false,
      planningLineChanged: false,
      projectJournalCreated: false,
      wipCalculated: false,
      invoiceCreated: false,
      posted: false
    },
    proves: [
      'Projects/Jobs-Einstiege wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.',
      'D10000 wurde als vorhandener Projektkunde read-only geprueft.',
      'PROJ-5001, RES-TECH, SP-SENSOR-02 und PROJ-LAG wurden als Zielobjekte read-only geprueft; fehlende Sichtbarkeit ist ein Stammdaten-/Setup-Backlog-Befund.',
      'Kapitel 16 braucht vor dem Projektprozess einen eigenen Projekt-Stammdaten- und Setup-Fit.'
    ],
    doesNotProve: [
      'Kein Projekt PROJ-5001 als fertig eingerichteter Zielprozess.',
      'Keine Projektaufgaben 1000/2000/3000.',
      'Keine Projektplanzeilen fuer RES-TECH oder SP-SENSOR-02.',
      'Kein Projektjournal, kein Ressourcen- oder Materialverbrauch.',
      'Keine WIP-Berechnung und keine WIP-Buchung.',
      'Keine Meilensteinrechnung, keine Debitoren-/Sach-/Projektposten aus Projects.',
      'Kein deutscher Finalnachweis.'
    ],
    nextStep:
      'PROJECTS-002 als Buch-/Evidence-Sync fuer Kapitel 16: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Projekt, Aufgaben, Ressource, Material, Projektlager und Projektbuchung UI-first vorbereiten.'
  };

  await writeJsonEvidence(projectsEvidencePath('PROJECTS-001-result.json'), result);
  await writeTextEvidence(projectsEvidencePath('PROJECTS-001-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    projectsEvidencePath('README.md'),
    [
      '# PROJECTS-001 Evidence-Index',
      '',
      'Ziel: Projects-Readiness fuer Kapitel 16 read-only pruefen, ohne Projektanlage, Projektplanzeile, Projektjournal, WIP-Berechnung, Rechnung oder Buchung.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `PROJECTS-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, Tell-Me-Einstiege, Zielobjektbefunde, Sicherheitsgrenzen | keinen Projektprozess und keine Buchung | labor, read-only |',
      '| `PROJECTS-001-READINESS.md` | Lernzusammenfassung | Warum Projects zuerst Projekt, Kunde, Ressource, Material und Lagerort braucht | keine Projektaufgabe, keine WIP, keine Faktura | labor, gate-locked |',
      '| `010-*` bis `060-*` | Tell-Me-Evidence | sichtbare oder verworfene Einstiegspfade fuer Projects, Planning Lines, Journals, Ledger Entries, Statistics und WIP | keinen geoeffneten Prozess und keine Buchung | navigation-evidence |',
      '| `070-*` bis `110-*` | kompakter Objekt-Seitentext und Buttons | vorhandene oder fehlende Zielobjekte im Labor | keine Anlage und keinen Projekt-Endstand | object-readiness |',
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
  expect(directChecks.some((entry) => entry.value === 'D10000' && entry.targetVisible)).toBe(true);
});
