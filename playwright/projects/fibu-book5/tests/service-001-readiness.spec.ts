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

const testId = 'service-001';

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

function serviceEvidencePath(fileName: string) {
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
    /Service|Service Orders|Service Items|Service Contracts|Service Management|Resources|Resource|Item|Items|Location|Locations|Ledger Entries|Statistics|Warranty|Repair|RM-M100-SN1001|SERV-4001|SP-PUMP-01|SP-SENSOR-02|RES-TECH|VAN-SERV|D10000|Serviceauftrag|Serviceartikel|Ressource|Garantie|Kulanz|Wartung|Reparatur/i;
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

  await writeTextEvidence(serviceEvidencePath(`${target.id}-page-text.txt`), compactText);
  await writeJsonEvidence(serviceEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: visible ? 'candidate' : 'rejected',
    bookUse: visible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Nur Tell-Me-/Navigationsevidence in RM-DEMO / CRONUS USA.',
      'Suchtreffer werden bewusst nicht als Serviceprozessbeweis verwendet.',
      'Keine Serviceauftragsanlage, kein Ersatzteilverbrauch, keine Ressourcenerfassung, keine Rechnung und keine Buchung.'
    ]
  });

  return {
    id: target.id,
    searchedFor: target.term,
    expectedVisible: visible,
    relevantButtons: buttons.filter((button) => /Service|Resource|Item|Ledger|Warranty|Contract|Statistics|Ressource|Artikel|Posten/i.test(button)),
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
    serviceContextVisible: /Service|Serviceauftrag|Serviceartikel|Warranty|Garantie|Kulanz/i.test(text),
    itemContextVisible: /Items|Item|Artikel/i.test(text),
    resourceContextVisible: /Resources|Resource|Ressource/i.test(text),
    locationContextVisible: /Locations|Location|Lagerort/i.test(text),
    postingGroupVisible: /Posting Group|Buchungsgruppe|RESALE|RETAIL|DOMESTIC/i.test(text),
    unitPriceVisible: /Unit Price|Einstandspreis|Verkaufspreis|Price|Preis/i.test(text)
  };

  await writeTextEvidence(serviceEvidencePath(`${check.id}-page-text.txt`), compactText);
  await writeJsonEvidence(serviceEvidencePath(`${check.id}-buttons.json`), buttons);
  await screenshot(page, check.screenshotFile, {
    projectName: project.name,
    testId,
    status: targetVisible ? 'labor' : 'rejected',
    bookUse: targetVisible ? 'evidence' : 'do-not-use',
    purpose: check.purpose,
    knownLimitations: [
      'Read-only Objektkontext in RM-DEMO / CRONUS USA.',
      'Direkte Page-ID-/Filteroeffnung ist technischer Nachweispfad; Buch-Klickpfad bleibt UI/Tell-Me.',
      'Keine Anlage oder Aenderung von Serviceartikeln, Ressourcen, Artikeln oder Lagerorten.',
      'Keine Servicebuchung und kein deutscher Finalnachweis.'
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
    '# SERVICE-001 Readiness',
    '',
    'Status: `labor`, `read-only`, `service-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Relevantes Gate | `SERVICE-001-POSTING` locked |',
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
    'Service startet nicht mit der Rechnung. Zuerst muss klar sein, welches gewartete Objekt beim Kunden existiert, welcher Debitor dazugehort, welches Ersatzteil verbraucht wird, aus welchem Lagerort das Ersatzteil kommt und welche Ressource die Technikerzeit darstellt. Wenn Serviceartikel, Ersatzteil, Technikerlager oder Ressource fehlen, ist ein Serviceauftrag noch nicht buchungsreif. Ein sichtbarer Serviceauftragspfad ist deshalb nur Readiness, kein Serviceprozess.',
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
    'Kapitel 15 darf den aktuellen Stand nur als Service-Readiness behandeln. Die Zielschritte `SERV-4001`, Ersatzteilverbrauch und Faktura bleiben Gate-gesperrt, bis Serviceartikel, Ersatzteil, Ressource, Technikerlager, Garantie-/Kulanzentscheidung und Preview-/Postenspur vorbereitet sind.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('SERVICE-001 Service-Readiness read-only pruefen', async ({ page }) => {
  const tellMeTargets: TellMeTarget[] = [
    {
      id: '010-service-orders-tell-me',
      term: 'Service Orders',
      expected: /Service Orders|Service Order|Serviceauftraege|Serviceauftrag/i,
      screenshotFile: 'service-001-010-service-orders-tell-me.png',
      purpose: 'SERVICE-001 Serviceauftraege als nicht buchenden Einstieg fuer Kapitel 15 suchen.'
    },
    {
      id: '020-service-items-tell-me',
      term: 'Service Items',
      expected: /Service Items|Service Item|Serviceartikel/i,
      screenshotFile: 'service-001-020-service-items-tell-me.png',
      purpose: 'SERVICE-001 Serviceartikel als Voraussetzung fuer gewartete Maschinen suchen.'
    },
    {
      id: '030-resources-tell-me',
      term: 'Resources',
      expected: /Resources|Resource|Ressourcen|Ressource/i,
      screenshotFile: 'service-001-030-resources-tell-me.png',
      purpose: 'SERVICE-001 Ressourcen als Voraussetzung fuer Technikerzeiten suchen.'
    },
    {
      id: '040-service-management-setup-tell-me',
      term: 'Service Management Setup',
      expected: /Service Management Setup|Service Setup|Serviceeinrichtung/i,
      screenshotFile: 'service-001-040-service-management-setup-tell-me.png',
      purpose: 'SERVICE-001 Serviceeinrichtung als gesperrten Setup-Kontext sichtbar machen.'
    },
    {
      id: '050-service-contracts-tell-me',
      term: 'Service Contracts',
      expected: /Service Contracts|Service Contract|Servicevertraege|Servicevertrag/i,
      screenshotFile: 'service-001-050-service-contracts-tell-me.png',
      purpose: 'SERVICE-001 Servicevertraege als spaeteren Garantie-/Wartungsvertragskontext suchen.'
    },
    {
      id: '060-service-ledger-entries-tell-me',
      term: 'Service Ledger Entries',
      expected: /Service Ledger Entries|Service Ledger Entry|Serviceposten/i,
      screenshotFile: 'service-001-060-service-ledger-entries-tell-me.png',
      purpose: 'SERVICE-001 Serviceposten als spaeteren Nachweispfad suchen.'
    }
  ];

  const tellMeEntries = [];
  for (const target of tellMeTargets) {
    tellMeEntries.push(await captureTellMe(page, target));
  }

  const directTargets: DirectCheck[] = [
    {
      id: '070-customer-d10000',
      pageId: 22,
      tableName: 'Customer',
      fieldName: 'No.',
      value: 'D10000',
      expected: /D10000|Mueller Maschinenbau|Muller Maschinenbau/i,
      screenshotFile: 'service-001-070-customer-d10000.png',
      purpose: 'SERVICE-001 Debitor D10000 read-only als Servicekunde pruefen.',
      role: 'Servicekunde / Faktura- oder Garantiekontext'
    },
    {
      id: '080-service-item-rm-m100-sn1001',
      pageId: 5988,
      tableName: 'Service Item',
      fieldName: 'No.',
      value: 'RM-M100-SN1001',
      expected: /RM-M100-SN1001/i,
      screenshotFile: 'service-001-080-service-item-rm-m100-sn1001.png',
      purpose: 'SERVICE-001 Serviceartikel RM-M100-SN1001 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplantes gewartetes Objekt beim Kunden'
    },
    {
      id: '090-item-sp-pump-01',
      pageId: 31,
      tableName: 'Item',
      fieldName: 'No.',
      value: 'SP-PUMP-01',
      expected: /SP-PUMP-01|Pumpe|Pump/i,
      screenshotFile: 'service-001-090-item-sp-pump-01.png',
      purpose: 'SERVICE-001 Ersatzteil SP-PUMP-01 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplantes Ersatzteil fuer Serviceverbrauch'
    },
    {
      id: '100-resource-res-tech',
      pageId: 77,
      tableName: 'Resource',
      fieldName: 'No.',
      value: 'RES-TECH',
      expected: /RES-TECH/i,
      screenshotFile: 'service-001-100-resource-res-tech.png',
      purpose: 'SERVICE-001 Ressource RES-TECH read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplante Technikerzeit'
    },
    {
      id: '110-location-van-serv',
      pageId: 15,
      tableName: 'Location',
      fieldName: 'Code',
      value: 'VAN-SERV',
      expected: /VAN-SERV/i,
      screenshotFile: 'service-001-110-location-van-serv.png',
      purpose: 'SERVICE-001 Technikerlager VAN-SERV read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter Lagerort fuer Technikerfahrzeug'
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
    mode: 'read-only-service-readiness-no-posting-no-setup-change',
    gate: {
      id: 'SERVICE-001-POSTING',
      status: 'locked',
      consequence: 'No Service Order creation, no service line entry, no item/resource consumption, no invoice, no posting.'
    },
    tellMeEntries,
    directChecks,
    safety: {
      setupChanged: false,
      serviceOrderCreated: false,
      serviceItemChanged: false,
      itemChanged: false,
      resourceChanged: false,
      locationChanged: false,
      itemConsumed: false,
      invoicePosted: false,
      posted: false
    },
    proves: [
      'Service-Einstiege wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.',
      'D10000 wurde als vorhandener Servicekunde read-only geprueft.',
      'RM-M100-SN1001, SP-PUMP-01, RES-TECH und VAN-SERV wurden als Zielobjekte read-only geprueft; fehlende Sichtbarkeit ist ein Stammdaten-/Setup-Backlog-Befund.',
      'Kapitel 15 braucht vor dem Serviceprozess einen eigenen Service-Setup- und Stammdaten-Fit.'
    ],
    doesNotProve: [
      'Kein Serviceauftrag SERV-4001.',
      'Kein Serviceartikel-Fit fuer RM-M100-SN1001.',
      'Kein Ersatzteilverbrauch von SP-PUMP-01.',
      'Keine Ressourcenerfassung RES-TECH.',
      'Keine Garantie-, Kulanz- oder Vertragsentscheidung.',
      'Keine Preview Posting fuer Service.',
      'Keine Servicerechnung, keine Serviceposten, keine Artikel-/Wert-/Sachposten aus Service.',
      'Kein deutscher Finalnachweis.'
    ],
    nextStep:
      'SERVICE-002 als Buch-/Evidence-Sync fuer Kapitel 15: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Serviceartikel, Ersatzteil, Ressource, Technikerlager und Serviceauftrag UI-first vorbereiten.'
  };

  await writeJsonEvidence(serviceEvidencePath('SERVICE-001-result.json'), result);
  await writeTextEvidence(serviceEvidencePath('SERVICE-001-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    serviceEvidencePath('README.md'),
    [
      '# SERVICE-001 Evidence-Index',
      '',
      'Ziel: Service-Readiness fuer Kapitel 15 read-only pruefen, ohne Serviceauftrag, ohne Ersatzteilverbrauch, ohne Ressourcenerfassung, ohne Rechnung und ohne Buchung.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `SERVICE-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, Tell-Me-Einstiege, Zielobjektbefunde, Sicherheitsgrenzen | keinen Serviceprozess und keine Buchung | labor, read-only |',
      '| `SERVICE-001-READINESS.md` | Lernzusammenfassung | Warum Service zuerst Serviceartikel, Ersatzteil, Ressource und Lagerort braucht | keinen Serviceauftrag und keine Faktura | labor, gate-locked |',
      '| `010-*` bis `060-*` | Tell-Me-Evidence | sichtbare oder verworfene Einstiegspfade fuer Service Orders, Service Items, Resources, Setup, Contracts und Service Ledger Entries | keinen geoeffneten Prozess und keine Buchung | navigation-evidence |',
      '| `070-*` bis `110-*` | kompakter Objekt-Seitentext und Buttons | vorhandene oder fehlende Zielobjekte im Labor | keine Anlage und keinen Service-Endstand | object-readiness |',
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
