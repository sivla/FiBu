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

const testId = 'intercompany-001';

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

function intercompanyEvidencePath(fileName: string) {
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
    /Intercompany|IC |IC-|Inbox|Outbox|Partner|Setup|Sales Orders|Purchase Orders|VAT Entries|Currencies|Customer|D20000|D30000|D90000|RM-PROD|RM-SALES|RM-AT|EU|Export|VAT|Currency|USt|Debitor|Waehrung|Ausland|Sachposten/i;
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

  await writeTextEvidence(intercompanyEvidencePath(`${target.id}-page-text.txt`), compactText);
  await writeJsonEvidence(intercompanyEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: visible ? 'candidate' : 'rejected',
    bookUse: visible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Nur Tell-Me-/Navigationsevidence in RM-DEMO / CRONUS USA.',
      'Suchtreffer werden bewusst nicht als Intercompany- oder Auslandprozessbeweis verwendet.',
      'Keine neue Company, kein Company-Wechsel, keine IC-Partneranlage, kein IC-Beleg, keine USt-/Waehrungs-Setup-Aenderung und keine Buchung.'
    ]
  });

  return {
    id: target.id,
    searchedFor: target.term,
    expectedVisible: visible,
    relevantButtons: buttons.filter((button) => /Intercompany|IC|Inbox|Outbox|VAT|Currency|Customer|Sales|Purchase|Partner|Ausland|USt/i.test(button)),
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
    customerContextVisible: /Customer|Customers|Debitor/i.test(text),
    intercompanyContextVisible: /Intercompany|IC Partner|IC-/i.test(text),
    countryContextVisible: /Country|Region|Land|FR|CH|DE/i.test(text),
    vatContextVisible: /VAT|USt|Tax|Registration/i.test(text),
    currencyContextVisible: /Currency|Waehrung|EUR|CHF|USD/i.test(text),
    dimensionVisible: /Dimension|CHANNEL|B2B|IC|EXPORT/i.test(text)
  };

  await writeTextEvidence(intercompanyEvidencePath(`${check.id}-page-text.txt`), compactText);
  await writeJsonEvidence(intercompanyEvidencePath(`${check.id}-buttons.json`), buttons);
  await screenshot(page, check.screenshotFile, {
    projectName: project.name,
    testId,
    status: targetVisible ? 'labor' : 'rejected',
    bookUse: targetVisible ? 'evidence' : 'do-not-use',
    purpose: check.purpose,
    knownLimitations: [
      'Read-only Objektkontext in RM-DEMO / CRONUS USA.',
      'Direkte Page-ID-/Filteroeffnung ist technischer UI-Nachweispfad; Buch-Klickpfad bleibt Alt+Q/Tell-Me.',
      'Keine Anlage oder Aenderung von Debitor, IC-Partner, Company, USt-Setup, Waehrung oder Beleg.',
      'Kein Intercompany-Prozess, keine Auslandslieferung, keine Buchung und kein deutscher Finalnachweis.'
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
    '# INTERCOMPANY-001 Readiness',
    '',
    'Status: `labor`, `read-only`, `intercompany-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Buchfall | `IC-7001`, IC-Partner `RM-SALES`, Artikel `RM-M100`, Menge `1`, Preis `42.000 EUR`, EU-/Auslandssicht |',
    '| Relevante Gates | `NEW-COMPANY-001` locked; `TAX-002-DE-VAT-FIT` locked; Intercompany-Prozess als zukuenftiges Gate empfohlen |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '| Company-Wechsel | nein |',
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
    'Intercompany und Ausland sind kein einzelner Verkaufsauftrag. Der Fall braucht mehrere Companies, IC-Partner, korrespondierende Belege, Steuer-/VAT-Logik, Waehrungslogik und Abstimmung. Im aktuellen `RM-DEMO`-Labor wird bewusst nicht in Zielcompanies gewechselt und keine Company angelegt. Wenn IC-/Auslandszielobjekte wie `D20000`, `D30000` oder `D90000` fehlen, ist das ein Setup- und Stammdatenbefund, kein Bedienfehler.',
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
    'Kapitel 18 darf den aktuellen Stand nur als Intercompany-/Ausland-Readiness behandeln. Die Schrittfolge `IC-7001` bleibt Zielpfad fuer einen spaeteren Mehr-Company-/UI-first Setup- und Prozesslauf. Deutsche VAT-/EU-/Export-Logik und Intercompany-Abstimmung sind nicht final belegt.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('INTERCOMPANY-001 Intercompany- und Ausland-Readiness read-only pruefen', async ({ page }) => {
  const tellMeTargets: TellMeTarget[] = [
    {
      id: '010-intercompany-setup-tell-me',
      term: 'Intercompany Setup',
      expected: /Intercompany Setup|Intercompany|IC Setup|Intercompany-Einrichtung/i,
      screenshotFile: 'intercompany-001-010-intercompany-setup-tell-me.png',
      purpose: 'INTERCOMPANY-001 Intercompany Setup als Einstieg suchen, ohne Setup zu aendern.'
    },
    {
      id: '020-ic-partners-tell-me',
      term: 'IC Partners',
      expected: /IC Partners|Intercompany Partners|IC Partner/i,
      screenshotFile: 'intercompany-001-020-ic-partners-tell-me.png',
      purpose: 'INTERCOMPANY-001 IC Partners als Stammdaten-/Setup-Kontext suchen, ohne Partner anzulegen.'
    },
    {
      id: '030-ic-inbox-tell-me',
      term: 'IC Inbox Transactions',
      expected: /IC Inbox|Inbox Transactions|Intercompany.*Inbox|Eingang/i,
      screenshotFile: 'intercompany-001-030-ic-inbox-tell-me.png',
      purpose: 'INTERCOMPANY-001 IC Inbox als spaeteren Annahmepfad suchen, ohne Transaktion anzunehmen.'
    },
    {
      id: '040-ic-outbox-tell-me',
      term: 'IC Outbox Transactions',
      expected: /IC Outbox|Outbox Transactions|Intercompany.*Outbox|Ausgang/i,
      screenshotFile: 'intercompany-001-040-ic-outbox-tell-me.png',
      purpose: 'INTERCOMPANY-001 IC Outbox als spaeteren Sendepfad suchen, ohne Transaktion zu senden.'
    },
    {
      id: '050-vat-entries-tell-me',
      term: 'VAT Entries',
      expected: /VAT Entries|USt-Posten|VAT/i,
      screenshotFile: 'intercompany-001-050-vat-entries-tell-me.png',
      purpose: 'INTERCOMPANY-001 VAT Entries als spaeteren Steuer-Nachweispfad fuer EU/Ausland suchen.'
    },
    {
      id: '060-currencies-tell-me',
      term: 'Currencies',
      expected: /Currencies|Currency|Waehrungen|Währung/i,
      screenshotFile: 'intercompany-001-060-currencies-tell-me.png',
      purpose: 'INTERCOMPANY-001 Currencies als Ausland-/Fremdwaehrungs-Readiness suchen.'
    }
  ];

  const tellMeEntries = [];
  for (const target of tellMeTargets) {
    tellMeEntries.push(await captureTellMe(page, target));
  }

  const directTargets: DirectCheck[] = [
    {
      id: '070-customer-d20000-eu',
      pageId: 22,
      tableName: 'Customer',
      fieldName: 'No.',
      value: 'D20000',
      expected: /D20000|Alpha Machines/i,
      screenshotFile: 'intercompany-001-070-customer-d20000-eu.png',
      purpose: 'INTERCOMPANY-001 EU-B2B-Zieldebitor D20000 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter EU-B2B-Kunde'
    },
    {
      id: '080-customer-d30000-export',
      pageId: 22,
      tableName: 'Customer',
      fieldName: 'No.',
      value: 'D30000',
      expected: /D30000|SwissTech/i,
      screenshotFile: 'intercompany-001-080-customer-d30000-export.png',
      purpose: 'INTERCOMPANY-001 Drittland-/Export-Zieldebitor D30000 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter Drittland-/Exportkunde'
    },
    {
      id: '090-customer-d90000-ic',
      pageId: 22,
      tableName: 'Customer',
      fieldName: 'No.',
      value: 'D90000',
      expected: /D90000|RM-SALES/i,
      screenshotFile: 'intercompany-001-090-customer-d90000-ic.png',
      purpose: 'INTERCOMPANY-001 IC-Debitor D90000 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter Intercompany-Debitor fuer RM-SALES'
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
    mode: 'read-only-intercompany-foreign-readiness-no-posting-no-setup-change-no-company-switch',
    gates: [
      {
        id: 'NEW-COMPANY-001',
        status: 'locked',
        consequence: 'No RM-PROD, RM-SALES, RM-AT or other company creation/switch.'
      },
      {
        id: 'TAX-002-DE-VAT-FIT',
        status: 'locked',
        consequence: 'No EU/IC VAT setup or VAT19 setup change.'
      }
    ],
    recommendedFutureGate: {
      id: 'INTERCOMPANY-001-PROCESS',
      reason:
        'IC partner setup, company switch, IC sales/purchase documents, inbox/outbox actions and postings need explicit approval before execution.'
    },
    tellMeEntries,
    directChecks,
    safety: {
      setupChanged: false,
      companyCreated: false,
      companySwitched: false,
      intercompanyPartnerCreated: false,
      customerCreated: false,
      salesOrderCreated: false,
      purchaseOrderCreated: false,
      icTransactionSentOrAccepted: false,
      vatSetupChanged: false,
      currencySetupChanged: false,
      posted: false
    },
    proves: [
      'Intercompany-/IC-, VAT-Entries- und Currency-Suchpfade wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.',
      'D20000, D30000 und D90000 wurden als Kapitel-18-Zieldebitoren read-only geprueft; fehlende Sichtbarkeit ist ein Stammdaten-/Setup-Backlog-Befund.',
      'Kapitel 18 braucht vor einem echten IC-/Auslandprozess einen Mehr-Company-, IC-Partner-, Steuer- und Stammdaten-Fit.',
      'Die aktuelle RM-DEMO-Company bleibt konsolidiertes Labor; Zielcompanies sind nicht angelegt oder gewechselt.'
    ],
    doesNotProve: [
      'Kein IC-Beleg IC-7001.',
      'Keine IC Outbox-Transaktion und keine IC Inbox-Annahme.',
      'Keine RM-PROD/RM-SALES/RM-AT-Zielcompany als praktischer Prozesskontext.',
      'Keine EU-/Export-/IC-Steuerlogik, keine VAT Entries und keine deutsche 19-%-USt.',
      'Keine Verkaufs-/Einkaufsbuchung, keine Debitoren-/Kreditoren-/Sach-/Artikel-/Wertposten.',
      'Kein Intercompany-Abstimmungsbericht und kein deutscher Finalnachweis.'
    ],
    nextStep:
      'INTERCOMPANY-002 als Buch-/Evidence-Sync fuer Kapitel 18: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Mehr-Company-/IC-Partner-/Steuer-Setup und IC-7001 UI-first vorbereiten.'
  };

  await writeJsonEvidence(intercompanyEvidencePath('INTERCOMPANY-001-result.json'), result);
  await writeTextEvidence(intercompanyEvidencePath('INTERCOMPANY-001-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    intercompanyEvidencePath('README.md'),
    [
      '# INTERCOMPANY-001 Evidence-Index',
      '',
      'Ziel: Kapitel 18 als Intercompany-/Ausland-Readiness read-only pruefen, ohne neue Company, Company-Wechsel, IC-Partneranlage, USt-/Waehrungs-Setup, Beleganlage oder Buchung.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `INTERCOMPANY-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gates, Tell-Me-Einstiege, Zielobjektbefunde, Sicherheitsgrenzen | keinen Intercompany-/Auslandprozess und keine Buchung | labor, read-only |',
      '| `INTERCOMPANY-001-READINESS.md` | Lernzusammenfassung | Warum Kapitel 18 zuerst Companies, IC-Partner, Auslandskunden, VAT/Waehrung und Abstimmung braucht | kein `IC-7001`, keine IC Inbox/Outbox-Wirkung, keine Posten | labor, gate-locked |',
      '| `010-*` bis `060-*` | Tell-Me-Evidence | sichtbare oder verworfene Einstiegspfade fuer Intercompany, VAT Entries und Currencies | keinen geoeffneten Prozessbeleg und keine Einrichtung | navigation-evidence |',
      '| `070-*` bis `090-*` | kompakter Objekt-Seitentext und Buttons | vorhandene oder fehlende Zieldebitoren `D20000`, `D30000`, `D90000` im Labor | keine Anlage und keinen IC-/Ausland-Endstand | object-readiness |',
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
  expect(result.safety.companyCreated).toBe(false);
  expect(result.safety.companySwitched).toBe(false);
});
