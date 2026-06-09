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

const testId = 'dropshipping-001';

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

function dropshippingEvidencePath(fileName: string) {
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
    /Drop|Dropship|Drop Shipment|Sales Orders|Purchase Orders|Requisition|Purchasing Codes|Special Order|Customer|Vendor|Item|Dimension|D11000|K20000|SP-PUMP-01|DS-24001|CHANNEL|B2B|Verkaufs|Einkauf|Debitor|Kreditor|Artikel|Direktliefer/i;
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

  await writeTextEvidence(dropshippingEvidencePath(`${target.id}-page-text.txt`), compactText);
  await writeJsonEvidence(dropshippingEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: visible ? 'candidate' : 'rejected',
    bookUse: visible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Nur Tell-Me-/Navigationsevidence in RM-DEMO / CRONUS USA.',
      'Suchtreffer werden bewusst nicht als Dropshipping-Prozessbeweis verwendet.',
      'Keine Verkaufsauftragsanlage, keine Einkaufsbestellung, keine Requisition-Worksheet-Aktion, kein Shopify-Setup und keine Buchung.'
    ]
  });

  return {
    id: target.id,
    searchedFor: target.term,
    expectedVisible: visible,
    relevantButtons: buttons.filter((button) => /Drop|Sales|Purchase|Requisition|Purchasing|Special|Verkauf|Einkauf/i.test(button)),
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
    vendorContextVisible: /Vendor|Vendors|Kreditor/i.test(text),
    itemContextVisible: /Item|Items|Artikel/i.test(text),
    postingGroupVisible: /Posting Group|Buchungsgruppe|RETAIL|RESALE|DOMESTIC/i.test(text),
    priceVisible: /Unit Price|Price|Preis|Verkaufspreis/i.test(text),
    purchaseContextVisible: /Purchase|Purchasing|Einkauf/i.test(text),
    salesContextVisible: /Sales|Verkauf/i.test(text),
    dimensionVisible: /Dimension|CHANNEL|B2B/i.test(text)
  };

  await writeTextEvidence(dropshippingEvidencePath(`${check.id}-page-text.txt`), compactText);
  await writeJsonEvidence(dropshippingEvidencePath(`${check.id}-buttons.json`), buttons);
  await screenshot(page, check.screenshotFile, {
    projectName: project.name,
    testId,
    status: targetVisible ? 'labor' : 'rejected',
    bookUse: targetVisible ? 'evidence' : 'do-not-use',
    purpose: check.purpose,
    knownLimitations: [
      'Read-only Objektkontext in RM-DEMO / CRONUS USA.',
      'Direkte Page-ID-/Filteroeffnung ist technischer UI-Nachweispfad; Buch-Klickpfad bleibt Alt+Q/Tell-Me.',
      'Keine Anlage oder Aenderung von Debitor, Kreditor, Artikel, Auftrag, Bestellung oder Dimension.',
      'Keine Verkaufs-/Einkaufsbuchung, kein Shopify-Scope und kein deutscher Finalnachweis.'
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
    '# DROPSHIPPING-001 Readiness',
    '',
    'Status: `labor`, `read-only`, `dropshipping-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Buchfall | `DS-24001`, `D11000`, `SP-PUMP-01`, Menge `2`, `850 EUR`, `K20000`, `CHANNEL=B2B` |',
    '| Relevantes Gate | `DROPSHIPPING-001-PROCESS` locked |',
    '| Setup-Aenderung | nein |',
    '| Buchung | nein |',
    '| Shopify/Online Store | out of scope |',
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
    'Dropshipping ist kein normaler Verkauf mit spaeterem Lagertrick. Vor einem Verkaufsauftrag muss klar sein, ob Business Central die Verkaufsauftraege, Einkaufsbestellungen, Requisition-Worksheet-/Beschaffungspfade und Purchasing-Codes findet und ob Debitor, Lieferant und Artikel vorhanden sind. Wenn `D11000`, `K20000` oder `SP-PUMP-01` fehlen, liegt kein Bedienfehler vor, sondern eine Stammdatenluecke. Erst danach darf ein UI-first Klickpfad fuer Auftrag, Dropshipping-Kennzeichen, Einkaufsbezug, Preview Posting und Buchung vorbereitet werden.',
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
    'Kapitel 17 darf den aktuellen Stand nur als Dropshipping-/Sonderverkauf-Readiness behandeln. Die Schrittfolge `DS-24001` bleibt Zielpfad, solange Debitor, Kreditor, Artikel, Dropshipping-/Purchasing-Code-Logik und Buchungsvorschau nicht UI-first belegt sind. Shopify bleibt gestrichen.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('DROPSHIPPING-001 Dropshipping-Readiness read-only pruefen', async ({ page }) => {
  const tellMeTargets: TellMeTarget[] = [
    {
      id: '010-sales-orders-tell-me',
      term: 'Sales Orders',
      expected: /Sales Orders|Verkaufsauftr/i,
      screenshotFile: 'dropshipping-001-010-sales-orders-tell-me.png',
      purpose: 'DROPSHIPPING-001 Verkaufsauftraege als Einstieg fuer Sonderverkauf suchen.'
    },
    {
      id: '020-purchase-orders-tell-me',
      term: 'Purchase Orders',
      expected: /Purchase Orders|Einkaufsbestell/i,
      screenshotFile: 'dropshipping-001-020-purchase-orders-tell-me.png',
      purpose: 'DROPSHIPPING-001 Einkaufsbestellungen als verknuepften Beschaffungsbeleg suchen.'
    },
    {
      id: '030-requisition-worksheets-tell-me',
      term: 'Requisition Worksheets',
      expected: /Requisition Worksheets|Req\. Worksheets|Bestellvorschl|Beschaffung/i,
      screenshotFile: 'dropshipping-001-030-requisition-worksheets-tell-me.png',
      purpose: 'DROPSHIPPING-001 Requisition-Worksheet-Pfad als moeglichen Standardhebel fuer Beschaffung suchen.'
    },
    {
      id: '040-drop-shipments-tell-me',
      term: 'Drop Shipments',
      expected: /Drop Shipments|Drop Shipment|Dropship|Direktliefer/i,
      screenshotFile: 'dropshipping-001-040-drop-shipments-tell-me.png',
      purpose: 'DROPSHIPPING-001 Drop-Shipment-Kontext suchen, ohne Prozessbeleg anzulegen.'
    },
    {
      id: '050-purchasing-codes-tell-me',
      term: 'Purchasing Codes',
      expected: /Purchasing Codes|Purchasing Code|Einkaufscode|Drop Shipment|Special Order/i,
      screenshotFile: 'dropshipping-001-050-purchasing-codes-tell-me.png',
      purpose: 'DROPSHIPPING-001 Purchasing Codes als Setup-Ort fuer Drop Shipment/Special Order suchen.'
    }
  ];

  const tellMeEntries = [];
  for (const target of tellMeTargets) {
    tellMeEntries.push(await captureTellMe(page, target));
  }

  const directTargets: DirectCheck[] = [
    {
      id: '060-customer-d11000',
      pageId: 22,
      tableName: 'Customer',
      fieldName: 'No.',
      value: 'D11000',
      expected: /D11000|Handwerk24/i,
      screenshotFile: 'dropshipping-001-060-customer-d11000.png',
      purpose: 'DROPSHIPPING-001 Zieldebitor D11000 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter Dropshipping-/Sonderverkaufskunde'
    },
    {
      id: '070-vendor-k20000',
      pageId: 27,
      tableName: 'Vendor',
      fieldName: 'No.',
      value: 'K20000',
      expected: /K20000|Dropship Europe/i,
      screenshotFile: 'dropshipping-001-070-vendor-k20000.png',
      purpose: 'DROPSHIPPING-001 Ziellieferant K20000 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter Direktlieferant'
    },
    {
      id: '080-item-sp-pump-01',
      pageId: 31,
      tableName: 'Item',
      fieldName: 'No.',
      value: 'SP-PUMP-01',
      expected: /SP-PUMP-01|Pumpe|Pump/i,
      screenshotFile: 'dropshipping-001-080-item-sp-pump-01.png',
      purpose: 'DROPSHIPPING-001 Zielartikel SP-PUMP-01 read-only pruefen; Rejected ist ein valider Stammdatenbefund.',
      role: 'geplanter Dropshipping-Ersatzteilartikel'
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
    mode: 'read-only-dropshipping-readiness-no-posting-no-setup-change',
    gate: {
      id: 'DROPSHIPPING-001-PROCESS',
      status: 'locked',
      consequence:
        'No sales order DS-24001, no purchase order, no requisition worksheet action, no drop-shipment posting, no Shopify setup, no new company.'
    },
    tellMeEntries,
    directChecks,
    safety: {
      setupChanged: false,
      customerCreated: false,
      vendorCreated: false,
      itemCreated: false,
      salesOrderCreated: false,
      purchaseOrderCreated: false,
      requisitionWorksheetChanged: false,
      posted: false,
      shopifyConfigured: false
    },
    proves: [
      'Sales Orders, Purchase Orders, Requisition Worksheets, Drop Shipments und Purchasing Codes wurden in RM-DEMO read-only gesucht und als Navigationsevidence dokumentiert.',
      'D11000, K20000 und SP-PUMP-01 wurden als konkrete Kapitel-17-Zielobjekte read-only geprueft; fehlende Sichtbarkeit ist ein Stammdaten-/Setup-Backlog-Befund.',
      'Kapitel 17 braucht vor dem echten Dropshipping-Prozess einen UI-first Stammdaten-/Setup-Fit fuer Debitor, Lieferant, Artikel und Purchasing-Code-/Drop-Shipment-Logik.',
      'Shopify/Online Store bleibt out of scope; der Lauf prueft nur BC-Standard-Dropshipping/Sonderverkauf.'
    ],
    doesNotProve: [
      'Kein Verkaufsauftrag DS-24001.',
      'Keine Einkaufsbestellung an K20000.',
      'Kein gesetztes Dropshipping-Kennzeichen und kein Purchasing-Code-Endstand.',
      'Keine Requisition-Worksheet-Aktion und keine Belegverknuepfung.',
      'Keine Preview Posting, keine Verkaufs-/Einkaufsbuchung, keine Debitoren-/Kreditoren-/Sach-/USt-Posten.',
      'Keine deutsche 19-%-USt, kein deutscher Kontenplan und kein deutscher Finalnachweis.',
      'Kein Shopify-/Online-Store-Connector-Scope.'
    ],
    nextStep:
      'DROPSHIPPING-002 als Buch-/Evidence-Sync fuer Kapitel 17: Readiness-Befunde einarbeiten und danach nur mit ausdruecklichem Gate Debitor D11000, Kreditor K20000, Artikel SP-PUMP-01 und Drop-Shipment-/Purchasing-Code-Setup UI-first vorbereiten.'
  };

  await writeJsonEvidence(dropshippingEvidencePath('DROPSHIPPING-001-result.json'), result);
  await writeTextEvidence(dropshippingEvidencePath('DROPSHIPPING-001-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    dropshippingEvidencePath('README.md'),
    [
      '# DROPSHIPPING-001 Evidence-Index',
      '',
      'Ziel: Kapitel 17 als Dropshipping-/Sonderverkauf-Readiness read-only pruefen, ohne Verkaufsauftrag, Einkaufsbestellung, Requisition-Worksheet-Aktion, Shopify-Setup oder Buchung.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `DROPSHIPPING-001-result.json` | JSON-Ergebnis | Sandbox, Company, Gate, Tell-Me-Einstiege, Zielobjektbefunde, Sicherheitsgrenzen | keinen Dropshipping-Prozess und keine Buchung | labor, read-only |',
      '| `DROPSHIPPING-001-READINESS.md` | Lernzusammenfassung | Warum Dropshipping vor dem Prozess Debitor, Lieferant, Artikel und Beschaffungspfad braucht | kein `DS-24001`, keine Bestellung, keine Preview, keine Posten | labor, gate-locked |',
      '| `010-*` bis `050-*` | Tell-Me-Evidence | sichtbare oder verworfene Einstiegspfade fuer Sales Orders, Purchase Orders, Requisition Worksheets, Drop Shipments und Purchasing Codes | keinen geoeffneten Prozessbeleg und keine Buchung | navigation-evidence |',
      '| `060-*` bis `080-*` | kompakter Objekt-Seitentext und Buttons | vorhandene oder fehlende Zielobjekte `D11000`, `K20000`, `SP-PUMP-01` im Labor | keine Anlage und keinen Dropshipping-Endstand | object-readiness |',
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
  expect(result.safety.shopifyConfigured).toBe(false);
});
