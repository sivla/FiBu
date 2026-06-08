import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { pageText, requireBcUrl, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1080 }
});

type BcApiContext = {
  company: { id: string; name: string; displayName: string };
  root: string;
  token: string;
};

type VendorTestData = {
  minimumForP2P: Array<{
    no: string;
    name: string;
    countryRegionCode: string;
    addressLine1: string;
    city: string;
    postalCode: string;
    email: string;
    purpose: string;
    taxCase: string;
    dimensions?: Record<string, string>;
  }>;
};

type ItemTestData = {
  minimumForP2P: Array<{
    no: string;
    description: string;
    type: string;
    baseUnitOfMeasureCode: string;
    unitCost: number;
    locationCode: string;
    labPostingFit?: {
      generalProductPostingGroupCode: string;
      inventoryPostingGroupCode: string;
      taxGroupCode: string;
      reason: string;
    };
    dimensions?: Record<string, string>;
  }>;
};

type PurchaseCase = {
  id: string;
  vendorNo: string;
  vendorName: string;
  itemNo: string;
  itemDescription: string;
  quantity: number;
  unitCost: number;
  netAmount: number;
  targetVatPercent: number;
  targetVatAmount: number;
  targetGrossAmount: number;
  currencyCode: string;
  locationCode: string;
  expectedEntriesAfterFuturePosting: string[];
};

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, 'p2p-001', fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

async function loadJson<T>(filePath: string) {
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as T;
}

async function getApiContext(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix));
  await waitForBusinessCentralShell(page);

  return page.evaluate(async (companyName) => {
    const token = document.documentElement.innerHTML.match(/"accessToken":"([^"]+)/)?.[1];
    if (!token) {
      throw new Error('BC accessToken im Webclient nicht gefunden.');
    }

    const [tenant, environment] = location.pathname.split('/').filter(Boolean);
    const root = `https://api.businesscentral.dynamics.com/v2.0/${tenant}/${environment}/api/v2.0`;
    const response = await fetch(`${root}/companies`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Companies API fehlgeschlagen: ${response.status} ${await response.text()}`);
    }

    const companies = await response.json();
    const company = companies.value.find((entry: { name: string }) => entry.name === companyName);
    if (!company) {
      throw new Error(`Company ${companyName} nicht in API-Antwort gefunden.`);
    }

    return { company, root, token };
  }, project.defaultCompany) as Promise<BcApiContext>;
}

async function bcApi(
  api: BcApiContext,
  endpoint: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string>; allowError?: boolean } = {}
) {
  const response = await fetch(`${api.root}/companies(${api.company.id})/${endpoint}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${api.token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  const value = text ? tryParseJson(text) : undefined;

  if (!response.ok && !options.allowError) {
    throw new Error(`${options.method ?? 'GET'} ${endpoint} fehlgeschlagen: ${response.status} ${text}`);
  }

  return { ok: response.ok, status: response.status, text, value };
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function findApiRecords(api: BcApiContext, endpoint: string, filter: string) {
  const result = await bcApi(api, `${endpoint}?$filter=${encodeURIComponent(filter)}`);
  return ((result.value as { value?: Array<Record<string, unknown>> }).value ?? []) as Array<Record<string, unknown>>;
}

async function ensureVendor(api: BcApiContext, vendor: VendorTestData['minimumForP2P'][number]) {
  const existing = await findApiRecords(api, 'vendors', `number eq '${vendor.no}'`);
  const payload = {
    number: vendor.no,
    displayName: vendor.name,
    addressLine1: vendor.addressLine1,
    city: vendor.city,
    country: vendor.countryRegionCode,
    postalCode: vendor.postalCode,
    email: vendor.email
  };

  if (existing.length) {
    const patch = await bcApi(api, `vendors(${existing[0].id})`, {
      method: 'PATCH',
      headers: { 'If-Match': '*' },
      body: payload
    });
    const [finalVendor] = await findApiRecords(api, 'vendors', `number eq '${vendor.no}'`);
    return { action: 'updated', responseStatus: patch.status, record: finalVendor };
  }

  const post = await bcApi(api, 'vendors', { method: 'POST', body: payload });
  const [finalVendor] = await findApiRecords(api, 'vendors', `number eq '${vendor.no}'`);
  return { action: 'created', responseStatus: post.status, record: finalVendor };
}

async function ensureItem(api: BcApiContext, item: ItemTestData['minimumForP2P'][number]) {
  const existing = await findApiRecords(api, 'items', `number eq '${item.no}'`);
  const payload = {
    number: item.no,
    displayName: item.description,
    type: item.type,
    itemCategoryCode: 'MISC',
    baseUnitOfMeasureCode: item.baseUnitOfMeasureCode,
    unitCost: item.unitCost,
    generalProductPostingGroupCode: item.labPostingFit?.generalProductPostingGroupCode,
    inventoryPostingGroupCode: item.labPostingFit?.inventoryPostingGroupCode,
    taxGroupCode: item.labPostingFit?.taxGroupCode,
    blocked: false
  };

  if (existing.length) {
    const patch = await bcApi(api, `items(${existing[0].id})`, {
      method: 'PATCH',
      headers: { 'If-Match': '*' },
      body: payload
    });
    const [finalItem] = await findApiRecords(api, 'items', `number eq '${item.no}'`);
    return { action: 'updated', responseStatus: patch.status, record: finalItem };
  }

  const post = await bcApi(api, 'items', { method: 'POST', body: payload });
  const [finalItem] = await findApiRecords(api, 'items', `number eq '${item.no}'`);
  return { action: 'created', responseStatus: post.status, record: finalItem };
}

async function readReferenceRecords(api: BcApiContext, purchaseCase: PurchaseCase) {
  const [vendor] = await findApiRecords(api, 'vendors', `number eq '${purchaseCase.vendorNo}'`);
  const [item] = await findApiRecords(api, 'items', `number eq '${purchaseCase.itemNo}'`);
  const [location] = await findApiRecords(api, 'locations', `code eq '${purchaseCase.locationCode}'`);

  return { vendor, item, location };
}

async function probePurchaseOrderDraft(api: BcApiContext, purchaseCase: PurchaseCase) {
  const references = await readReferenceRecords(api, purchaseCase);
  if (!references.vendor || !references.item || !references.location) {
    return {
      ok: false,
      stage: 'prerequisite',
      references,
      error: 'Kreditor, Artikel oder Lagerort fehlt.'
    };
  }

  let order: Record<string, unknown> | undefined;
  let line: Record<string, unknown> | undefined;
  let deleteResult: { status: number; text: string; deleted: boolean } | undefined;

  try {
    const orderResponse = await bcApi(api, 'purchaseOrders', {
      method: 'POST',
      allowError: true,
      body: {
        vendorNumber: purchaseCase.vendorNo
      }
    });
    if (!orderResponse.ok) {
      return { ok: false, stage: 'purchaseOrder', references, status: orderResponse.status, error: orderResponse.text };
    }

    order = orderResponse.value as Record<string, unknown>;
    const lineResponse = await bcApi(api, `purchaseOrders(${order.id})/purchaseOrderLines`, {
      method: 'POST',
      allowError: true,
      body: {
        lineType: 'Item',
        itemId: references.item.id,
        quantity: purchaseCase.quantity,
        directUnitCost: purchaseCase.unitCost,
        locationId: references.location.id
      }
    });
    if (!lineResponse.ok) {
      return {
        ok: false,
        stage: 'purchaseOrderLine',
        references,
        order,
        status: lineResponse.status,
        error: lineResponse.text
      };
    }

    line = lineResponse.value as Record<string, unknown>;
    const lineCostPatch = await bcApi(api, `purchaseOrders(${order.id})/purchaseOrderLines(${line.id})`, {
      method: 'PATCH',
      allowError: true,
      headers: { 'If-Match': '*' },
      body: {
        directUnitCost: purchaseCase.unitCost
      }
    });
    if (!lineCostPatch.ok) {
      return {
        ok: false,
        stage: 'purchaseOrderLineCost',
        references,
        order,
        line,
        status: lineCostPatch.status,
        error: lineCostPatch.text
      };
    }

    line = lineCostPatch.value as Record<string, unknown>;
    return {
      ok: Number(line.directUnitCost) === purchaseCase.unitCost,
      stage: Number(line.directUnitCost) === purchaseCase.unitCost ? 'draftLineCreated' : 'purchaseOrderLineCost',
      references,
      order,
      line,
      expectedDirectUnitCost: purchaseCase.unitCost,
      actualDirectUnitCost: line.directUnitCost
    };
  } finally {
    if (order?.id) {
      const response = await fetch(`${api.root}/companies(${api.company.id})/purchaseOrders(${order.id})`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${api.token}`,
          Accept: 'application/json',
          'If-Match': '*'
        }
      });
      deleteResult = { status: response.status, text: await response.text(), deleted: response.status === 204 };
    }
    if (deleteResult) {
      await writeJsonEvidence(p2pEvidencePath('030-purchase-order-draft-cleanup.json'), deleteResult);
    }
  }
}

async function clickFirstVisibleAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(2500);
          return true;
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(2500);
        return true;
      }
    }
  }

  return false;
}

async function applyVendorTemplate(page: Page, vendorNo: string) {
  await page.goto(filteredBcPageUrl(26, 'Vendor', 'No.', vendorNo), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await expect.poll(() => pageText(page), { timeout: 60_000 }).toMatch(new RegExp(vendorNo));
  await page.waitForTimeout(2000);

  const clickedApplyTemplate = await clickFirstVisibleAction(page, /^Apply Template$|^Vorlage anwenden$/i);
  const clickedOk = await clickFirstVisibleAction(page, /^OK$/i);
  const clickedYes = await clickFirstVisibleAction(page, /^Yes$|^Ja$/i);
  await page.waitForTimeout(6000);
  const text = await pageText(page);
  await writeTextEvidence(p2pEvidencePath('005-vendor-template-application-page-text.txt'), text);

  return {
    clickedApplyTemplate,
    clickedOk,
    clickedYes,
    pageStillShowsVendor: new RegExp(vendorNo).test(text),
    textEvidenceFile: '005-vendor-template-application-page-text.txt'
  };
}

async function captureFilteredPage(page: Page, args: { pageId: number; table: string; field: string; value: string; fileStem: string; screenshotFile: string; expected: RegExp }) {
  await page.goto(filteredBcPageUrl(args.pageId, args.table, args.field, args.value), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  const text = await pageText(page);
  await writeTextEvidence(p2pEvidencePath(`${args.fileStem}-page-text.txt`), text);
  await screenshot(page, args.screenshotFile, {
    projectName: project.name,
    testId: 'p2p-001',
    status: args.expected.test(text) && text.includes(args.value) ? 'labor' : 'rejected',
    purpose: `P2P-001 Readiness-Screenshot fuer ${args.value}.`,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO; kein deutscher VAT-/Kontenplan-Endstand.',
      'Readiness-Pruefung ohne P2P-Buchung.'
    ],
    bookUse: 'evidence'
  });

  return {
    textEvidenceFile: `${args.fileStem}-page-text.txt`,
    screenshot: args.screenshotFile,
    pageContextVisible: args.expected.test(text),
    targetVisible: text.includes(args.value),
    hasVendorPostingGroupText: /Vendor Posting Group|Kreditorenbuchungsgruppe/i.test(text),
    hasGenBusPostingGroupText: /Gen\. Bus\. Posting Group|Gesch[a-z]*ftsbuchungsgruppe/i.test(text),
    hasVatBusPostingGroupText: /VAT Bus\. Posting Group|USt-Gesch[a-z]*ftsbuchungsgruppe|Tax Area|Tax Liable/i.test(text),
    hasPaymentTermsText: /Payment Terms|Zahlungsbedingung/i.test(text),
    hasCurrencyText: /Currency Code|W[a-z]*hrungscode|EUR/i.test(text),
    hasGenProdPostingGroupText: /Gen\. Prod\. Posting Group|Produktbuchungsgruppe/i.test(text),
    hasInventoryPostingGroupText: /Inventory Posting Group|Lagerbuchungsgruppe/i.test(text),
    hasTaxProductText: /VAT Prod\. Posting Group|Tax Group Code|USt-Produktbuchungsgruppe/i.test(text),
    hasCostingText: /Costing Method|Kostenmethode|Unit Cost|Einstandspreis/i.test(text)
  };
}

test('UAT-P2P-001 Readiness fuer K10000 und RAW-STEEL pruefen', async ({ page }) => {
  test.setTimeout(420_000);

  const vendors = await loadJson<VendorTestData>('playwright/projects/fibu-book5/testdata/masterdata/vendors.json');
  const items = await loadJson<ItemTestData>('playwright/projects/fibu-book5/testdata/masterdata/items.json');
  const purchaseCase = await loadJson<PurchaseCase>('playwright/projects/fibu-book5/testdata/purchase/uat-p2p-001.json');
  const vendorTarget = vendors.minimumForP2P.find((entry) => entry.no === purchaseCase.vendorNo);
  const itemTarget = items.minimumForP2P.find((entry) => entry.no === purchaseCase.itemNo);
  if (!vendorTarget || !itemTarget) {
    throw new Error('P2P-Testdaten fuer K10000 oder RAW-STEEL fehlen.');
  }

  const api = await getApiContext(page);
  const vendorResult = await ensureVendor(api, vendorTarget);
  const itemResult = await ensureItem(api, itemTarget);
  const vendorTemplateApplication = await applyVendorTemplate(page, purchaseCase.vendorNo);
  const vendorAfterTemplatePatch = await ensureVendor(api, vendorTarget);
  const references = await readReferenceRecords(api, purchaseCase);
  const draftProbe = await probePurchaseOrderDraft(api, purchaseCase);

  const vendorUi = await captureFilteredPage(page, {
    pageId: 26,
    table: 'Vendor',
    field: 'No.',
    value: purchaseCase.vendorNo,
    fileStem: '010-vendor-k10000',
    screenshotFile: 'p2p-001-010-vendor-k10000.png',
    expected: /Vendor Card|Vendor|Kreditor|Stahlwerk Ruhr/i
  });

  const itemUi = await captureFilteredPage(page, {
    pageId: 30,
    table: 'Item',
    field: 'No.',
    value: purchaseCase.itemNo,
    fileStem: '020-item-raw-steel',
    screenshotFile: 'p2p-001-020-item-raw-steel.png',
    expected: /Item Card|Item|Artikel|RAW-STEEL|Stahltraeger/i
  });

  const draftLineCostMatches =
    draftProbe.ok && Number((draftProbe as { line?: { directUnitCost?: unknown } }).line?.directUnitCost) === purchaseCase.unitCost;
  const readiness = {
    testId: 'UAT-P2P-001',
    status: draftProbe.ok ? 'labor-ready-for-preview-precheck' : 'labor-blocked-before-preview',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'readiness-no-posting',
    target: purchaseCase,
    masterdata: {
      vendor: {
        exists: Boolean(references.vendor),
        action: vendorResult.action,
        templateApplication: vendorTemplateApplication,
        afterTemplatePatchAction: vendorAfterTemplatePatch.action,
        apiRecord: references.vendor,
        ui: vendorUi
      },
      item: {
        exists: Boolean(references.item),
        action: itemResult.action,
        apiRecord: references.item,
        ui: itemUi
      },
      location: {
        exists: Boolean(references.location),
        apiRecord: references.location
      }
    },
    setupReadiness: {
      vendorPostingSetup: {
        status: draftProbe.ok ? 'indirectly-usable-for-draft' : 'not-proven',
        reason:
          'Die Standard-API zeigt keine vollstaendige Vendor-Posting-Setup-Matrix; die technische Probe bewertet nur, ob ein Einkaufsbestellentwurf mit Kreditor/Artikel/Lagerort angelegt werden kann.'
      },
      generalPostingSetup: {
        status: draftProbe.ok ? 'not-blocking-draft-line' : 'not-proven-or-blocked',
        reason:
          'Keine Buchung und keine Preview in diesem Lauf. General Posting Setup ist erst mit Preview Posting oder Posting-Vorschau fachlich belastbar.'
      },
      vatTaxSetup: {
        status: 'lab-boundary',
        reason: 'Deutsche 19-Prozent-Vorsteuer bleibt Zielbild; CRONUS-USA-Sales-Tax/VAT wird nicht als deutscher Endstand interpretiert.'
      },
      inventoryPostingSetup: {
        status: 'not-fully-proven-for-raw-steel',
        reason: 'FRA-ZL existiert, aber Inventory Posting Group/Inventory Posting Setup fuer RAW-STEEL muss vor Preview Posting sichtbar geprueft werden.'
      },
      readyForNextPreviewPosting: draftProbe.ok && draftLineCostMatches
    },
    draftPurchaseOrderProbe: draftProbe,
    proves: [
      'K10000 und RAW-STEEL koennen in RM-DEMO fuer P2P-Readiness identifiziert oder idempotent angelegt werden.',
      'FRA-ZL existiert als Lagerort fuer den ersten Einkaufsfall.',
      'Ein temporaerer Einkaufsbestell-Entwurf wurde nur als technische Readiness-Probe genutzt und wieder geloescht, falls die API ihn anlegen konnte.'
    ],
    doesNotProve: [
      'Keine P2P-Buchung.',
      'Kein Wareneingang.',
      'Keine gebuchte Einkaufsrechnung.',
      'Kein deutscher 19-Prozent-Vorsteuer-Endstand.',
      'Kein finaler Vendor-/General-/Inventory-Posting-Setup-Endstand ohne Preview Posting.'
    ],
    nextStep: draftProbe.ok && draftLineCostMatches
      ? 'UAT-P2P-001 Preview-Readiness: Einkaufsbestellung per UI/API erzeugen, Buchungsvorschau oeffnen, Setup-Blocker dokumentieren, danach Entwurf bereinigen; weiterhin nicht buchen.'
      : 'Blocker aus der Einkaufsbestell-Entwurfsprobe analysieren und gezielt Vendor-/Item-/Posting-Setup korrigieren, bevor Preview Posting versucht wird.'
  };

  await writeJsonEvidence(p2pEvidencePath('P2P-READINESS.json'), readiness);
  await writeTextEvidence(
    p2pEvidencePath('P2P-READINESS.md'),
    [
      '# UAT-P2P-001 Readiness fuer K10000 und RAW-STEEL',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${readiness.environment} |`,
      `| Company | ${readiness.company} |`,
      '| Status | labor, readiness, no-posting |',
      `| Kreditor | ${purchaseCase.vendorNo} / ${purchaseCase.vendorName} |`,
      `| Artikel | ${purchaseCase.itemNo} / ${purchaseCase.itemDescription} |`,
      `| Menge / Preis | ${purchaseCase.quantity} x ${purchaseCase.unitCost} EUR |`,
      `| Lagerort | ${purchaseCase.locationCode} |`,
      `| Zielsteuer | ${purchaseCase.targetVatPercent} % als deutscher Zielwert, nicht Laborbeweis |`,
      '',
      '## Kernergebnis',
      '',
      '| Pruefpunkt | Ergebnis |',
      '|---|---|',
      `| K10000 existiert | ${readiness.masterdata.vendor.exists ? 'ja' : 'nein'} |`,
      `| K10000 Aktion | ${readiness.masterdata.vendor.action} |`,
      `| Vendor Template angewendet | ${vendorTemplateApplication.clickedApplyTemplate ? 'ja' : 'nein'} |`,
      `| Labor-Waehrung am Entwurf | ${draftProbe.ok ? ((draftProbe as { order?: { currencyCode?: string } }).order?.currencyCode ?? '') : 'nicht erreicht'} |`,
      `| RAW-STEEL existiert | ${readiness.masterdata.item.exists ? 'ja' : 'nein'} |`,
      `| RAW-STEEL Aktion | ${readiness.masterdata.item.action} |`,
      `| RAW-STEEL Labor-Posting-Fit | ${itemTarget.labPostingFit ? `${itemTarget.labPostingFit.generalProductPostingGroupCode}/${itemTarget.labPostingFit.inventoryPostingGroupCode}/${itemTarget.labPostingFit.taxGroupCode}` : 'nicht gesetzt'} |`,
      `| FRA-ZL existiert | ${readiness.masterdata.location.exists ? 'ja' : 'nein'} |`,
      `| Einkaufsbestell-Entwurfsprobe | ${draftProbe.ok ? 'erfolgreich, Entwurf geloescht' : `blockiert bei ${draftProbe.stage}`} |`,
      `| Direct Unit Cost in Entwurfszeile | ${draftLineCostMatches ? `${purchaseCase.unitCost}` : 'nicht passend'} |`,
      `| Tax Percent in Entwurfszeile | ${draftProbe.ok ? ((draftProbe as { line?: { taxPercent?: number } }).line?.taxPercent ?? '') : 'nicht erreicht'} |`,
      `| Bereit fuer naechstes Preview Posting | ${readiness.setupReadiness.readyForNextPreviewPosting ? 'ja, als Labor-Preview-Vorstufe' : 'nein'} |`,
      '',
      '## Warum dieser Schritt wichtig ist',
      '',
      'Ein P2P-Prozess kann erst sinnvoll geklickt werden, wenn Kreditor, Artikel, Lagerort und grundlegende Einkaufszeile tragfaehig sind. Business Central erzeugt aus diesen Stammdaten spaeter Kreditorenposten, Sachposten, Artikelposten, Wertposten und Steuer-/Tax-Posten. Ohne Readiness wuerde der erste Einkaufsbeleg nur zufaellige Setupfehler produzieren.',
      '',
      '## Laborgrenzen',
      '',
      '- Keine P2P-Buchung, kein Wareneingang und keine Eingangsrechnung.',
      '- Deutsche 19-%-Vorsteuer bleibt offen.',
      '- Der Laborentwurf laeuft in der aktuellen CRONUS-USA-Basis mit `USD` und `Tax Percent = 0`.',
      '- `RAW-STEEL` nutzt `RETAIL`/`RESALE`/`FURNITURE` nur als CRONUS-Technikfit; das ist kein deutscher Rohmaterial-/Vorsteuer-Endstand.',
      '- Vendor Posting Setup, General Posting Setup und Inventory Posting Setup sind erst mit Preview Posting belastbar fuer die Buchungswirkung.',
      '- `COMP-CTRL` bleibt spaeterer Manufacturing-/P2P-Erweiterungsfall und wurde in diesem Lauf nicht angelegt.',
      '',
      '## Naechster Schritt',
      '',
      readiness.nextStep,
      ''
    ].join('\n')
  );

  expect(readiness.masterdata.vendor.exists).toBe(true);
  expect(readiness.masterdata.item.exists).toBe(true);
  expect(readiness.masterdata.location.exists).toBe(true);
});
