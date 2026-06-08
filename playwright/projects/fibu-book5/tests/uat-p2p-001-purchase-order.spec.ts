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
  dimensions: Record<string, string>;
};

type BcApiContext = {
  company: { id: string; name: string; displayName: string };
  root: string;
  odataRoot: string;
  token: string;
};

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, 'p2p-001', fileName);
}

function bcEnvironmentLabel() {
  const [tenant, environment] = new URL(requireBcUrl(project.envPrefix)).pathname.split('/').filter(Boolean);
  return { tenant, environment };
}

function bcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

async function loadPurchaseCase() {
  return JSON.parse(
    await fs.readFile(path.resolve('playwright/projects/fibu-book5/testdata/purchase/uat-p2p-001.json'), 'utf8')
  ) as PurchaseCase;
}

async function postingResultExists() {
  return fs.access(p2pEvidencePath('100-purchase-posting-result.json')).then(() => true).catch(() => false);
}

async function readPostingResult() {
  if (!(await postingResultExists())) {
    return undefined;
  }
  return JSON.parse(await fs.readFile(p2pEvidencePath('100-purchase-posting-result.json'), 'utf8')) as {
    posted?: boolean;
    purchaseOrderNumber?: string;
    postedPurchaseInvoiceNumber?: string;
  };
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
    const base = `https://api.businesscentral.dynamics.com/v2.0/${tenant}/${environment}`;
    const root = `${base}/api/v2.0`;
    const odataRoot = `${base}/ODataV4`;
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

    return { company, root, odataRoot, token };
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

async function findApiRecords(api: BcApiContext, endpoint: string, filter: string, orderBy?: string) {
  const orderPart = orderBy ? `&$orderby=${encodeURIComponent(orderBy)}` : '';
  const result = await bcApi(api, `${endpoint}?$filter=${encodeURIComponent(filter)}${orderPart}`);
  return ((result.value as { value?: Array<Record<string, unknown>> }).value ?? []) as Array<Record<string, unknown>>;
}

async function odata(
  api: BcApiContext,
  endpoint: string,
  options: { method?: string; body?: unknown; headers?: Record<string, string>; allowError?: boolean } = {}
) {
  const response = await fetch(`${api.odataRoot}/${endpoint}`, {
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
    throw new Error(`${options.method ?? 'GET'} OData ${endpoint} fehlgeschlagen: ${response.status} ${text}`);
  }

  return { ok: response.ok, status: response.status, text, value };
}

async function readReferences(api: BcApiContext, purchaseCase: PurchaseCase) {
  const [vendor] = await findApiRecords(api, 'vendors', `number eq '${purchaseCase.vendorNo}'`);
  const [item] = await findApiRecords(api, 'items', `number eq '${purchaseCase.itemNo}'`);
  const [location] = await findApiRecords(api, 'locations', `code eq '${purchaseCase.locationCode}'`);
  return { vendor, item, location };
}

async function createPurchaseOrder(api: BcApiContext, purchaseCase: PurchaseCase) {
  const references = await readReferences(api, purchaseCase);
  if (!references.vendor || !references.item || !references.location) {
    throw new Error('Kreditor, Artikel oder Lagerort fehlt vor P2P-Buchungslauf.');
  }

  const orderResponse = await bcApi(api, 'purchaseOrders', {
    method: 'POST',
    body: {
      vendorNumber: purchaseCase.vendorNo
    }
  });
  let order = orderResponse.value as Record<string, unknown>;
  const vendorInvoiceNumber = `${purchaseCase.id}-${Date.now()}`;
  const encodedCompany = encodeURIComponent(project.defaultCompany);
  const purchaseDocuments = await odata(
    api,
    `Company('${encodedCompany}')/purchaseDocuments?$filter=${encodeURIComponent(
      `documentType eq 'Order' and number eq '${order.number}'`
    )}`
  );
  const [purchaseDocument] = ((purchaseDocuments.value as { value?: Array<Record<string, unknown>> }).value ?? []) as Array<
    Record<string, unknown>
  >;
  if (!purchaseDocument?.id) {
    throw new Error(`Purchase Document OData-Datensatz fuer ${order.number} nicht gefunden.`);
  }
  const orderPatch = await odata(api, `Company('${encodedCompany}')/purchaseDocuments(${purchaseDocument.id})`, {
    method: 'PATCH',
    headers: { 'If-Match': '*' },
    body: {
      vendorInvoiceNumber
    }
  });
  const [patchedOrder] = await findApiRecords(api, 'purchaseOrders', `number eq '${order.number}'`);
  order = patchedOrder ?? order;

  const lineResponse = await bcApi(api, `purchaseOrders(${order.id})/purchaseOrderLines`, {
    method: 'POST',
    body: {
      lineType: 'Item',
      itemId: references.item.id,
      quantity: purchaseCase.quantity,
      directUnitCost: purchaseCase.unitCost,
      locationId: references.location.id
    }
  });
  const line = lineResponse.value as Record<string, unknown>;

  const patchedLineResponse = await bcApi(api, `purchaseOrders(${order.id})/purchaseOrderLines(${line.id})`, {
    method: 'PATCH',
    headers: { 'If-Match': '*' },
    body: {
      directUnitCost: purchaseCase.unitCost
    }
  });
  const patchedLine = patchedLineResponse.value as Record<string, unknown>;

  return { references, order, line: patchedLine, vendorInvoiceNumber, vendorInvoicePatchStatus: orderPatch.status };
}

async function deletePurchaseOrder(api: BcApiContext, orderId: unknown, orderNumber: unknown) {
  if (!orderId) {
    return { orderNumber, deleted: false, reason: 'missing-order-id' };
  }
  const response = await fetch(`${api.root}/companies(${api.company.id})/purchaseOrders(${orderId})`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${api.token}`,
      Accept: 'application/json',
      'If-Match': '*'
    }
  });

  return { orderNumber, status: response.status, deleted: response.status === 204, text: await response.text() };
}

async function openPurchaseOrderCard(page: Page, orderNumber: string) {
  await page.goto(bcPageUrl(50, 'Purchase Header', 'No.', orderNumber), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await expect.poll(() => pageText(page), { timeout: 90_000 }).toMatch(new RegExp(orderNumber));
}

async function openFilteredPage(
  page: Page,
  args: {
    pageId: number;
    table: string;
    field: string;
    value: string;
    fileStem: string;
    screenshotFile: string;
    labelPattern: RegExp;
    purpose: string;
  }
) {
  await page.goto(bcPageUrl(args.pageId, args.table, args.field, args.value), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  const text = await pageText(page);
  await writeTextEvidence(p2pEvidencePath(`${args.fileStem}-page-text.txt`), text);
  await screenshot(page, args.screenshotFile, {
    projectName: project.name,
    testId: 'p2p-001',
    status: args.labelPattern.test(text) && new RegExp(args.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(text) ? 'labor' : 'rejected',
    purpose: args.purpose,
    expectedPageText: [],
    knownLimitations: ['CRONUS-USA-Labor; kein deutscher 19-%-Vorsteuer-Endstand.', 'Read-only-Nachweis nach kontrollierter Laborbuchung.'],
    bookUse: 'evidence'
  });

  return {
    pageId: args.pageId,
    table: args.table,
    field: args.field,
    value: args.value,
    valueVisible: new RegExp(args.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(text),
    pageContextVisible: args.labelPattern.test(text),
    hasVendor: /K10000|Stahlwerk Ruhr/i.test(text),
    hasItem: /RAW-STEEL|Stahltraeger|Stahltr/i.test(text),
    hasAmount25000: /25[.,]000|25000/i.test(text),
    hasAmount2500: /2[.,]500|2500/i.test(text),
    hasLocation: /FRA-ZL/i.test(text),
    hasProductlineMachine: /PRODUCTLINE[\s\S]{0,180}MACHINE|MACHINE[\s\S]{0,180}PRODUCTLINE/i.test(text),
    textEvidenceFile: `${args.fileStem}-page-text.txt`,
    screenshot: args.screenshotFile
  };
}

async function clickFirstVisibleAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'radio'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(1500);
          return true;
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(1500);
        return true;
      }
    }
  }

  return false;
}

async function clickPostDropdown(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const postAction = scope.getByRole('button', { name: /^Post(?:\.\.\.)?$|^Buchen(?:\.\.\.)?$/i }).first();
    if (!(await postAction.isVisible({ timeout: 1000 }).catch(() => false))) {
      continue;
    }
    const box = await postAction.boundingBox().catch(() => null);
    if (!box) {
      continue;
    }
    await page.mouse.click(box.x + box.width + 12, box.y + box.height / 2);
    await page.waitForTimeout(1500);
    return true;
  }
  return false;
}

async function openPreviewPosting(page: Page) {
  const openedPostMenu = await clickPostDropdown(page);
  const clickedPreview = await clickFirstVisibleAction(page, /^Preview Posting$|^Buchungsvorschau$|^Vorschau buchen$/i);
  await page.waitForTimeout(6000);
  const text = await pageText(page);
  const previewEntries = [
    'G/L Entry',
    'Vendor Ledger Entry',
    'Detailed Vendor Ledg. Entry',
    'Item Ledger Entry',
    'Value Entry',
    'VAT Entry'
  ]
    .map((entryType) => {
      const match = text.match(new RegExp(`${entryType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)`, 'i'));
      return match ? { entryType, count: Number(match[1]) } : undefined;
    })
    .filter((entry): entry is { entryType: string; count: number } => Boolean(entry));
  const blocked = /Error Messages|Fehlermeldungen|There is nothing to post|Warehouse Receive|Inventory Account is missing|Vendor Posting Group|Gen\. Bus\. Posting Group|VAT|Tax/i.test(text) &&
    !/Posting Preview|Buchungsvorschau/i.test(text);

  return {
    openedPostMenu,
    clickedPreview,
    openedPreview: /Posting Preview|Buchungsvorschau/i.test(text) && previewEntries.length >= 3,
    blocked,
    previewEntries,
    text
  };
}

async function openPostingDialog(page: Page) {
  const clickedMainPost = await clickFirstVisibleAction(page, /^Post(?:\.\.\.)?$|^Buchen(?:\.\.\.)?$/i);
  await page.waitForTimeout(2500);
  let text = await pageText(page);
  if (!/Receive and Invoice|Empfangen und fakturieren|Receive|Invoice|OK/i.test(text)) {
    await clickPostDropdown(page);
    await clickFirstVisibleAction(page, /^Post(?:\.\.\.)?$|^Buchen(?:\.\.\.)?$/i);
    await page.waitForTimeout(2500);
    text = await pageText(page);
  }

  return { clickedMainPost, text };
}

async function chooseReceiveAndInvoice(page: Page) {
  return clickFirstVisibleAction(page, /^Receive and Invoice$|^Empfangen und fakturieren$/i);
}

async function confirmPostingOnce(page: Page) {
  const clickedOk = await clickFirstVisibleAction(page, /^OK$/i);
  await page.waitForTimeout(14_000);
  let text = await pageText(page);
  const openPostedQuestion =
    /Do you want to open the posted invoice|Moechten Sie die gebuchte Rechnung|Möchten Sie die gebuchte Rechnung|posted invoice/i.test(text) &&
    /Yes|Ja/i.test(text);
  if (openPostedQuestion) {
    await clickFirstVisibleAction(page, /^Yes$|^Ja$/i);
    await page.waitForTimeout(8000);
    text = await pageText(page);
  }
  return { clickedOk, openPostedQuestion, text };
}

async function findPostedPurchaseInvoices(api: BcApiContext, vendorNo: string) {
  return findApiRecords(api, 'purchaseInvoices', `vendorNumber eq '${vendorNo}'`, 'lastModifiedDateTime desc');
}

function extractPostedInvoiceNumber(text: string, invoices: Array<Record<string, unknown>>) {
  const apiNumber = invoices.find((entry) => typeof entry.number === 'string')?.number;
  const textNumber =
    text.match(/\b(PP?I-\w+|PI-\w+|PS-INV\d+|10\d{4,})\b/i)?.[1] ??
    text.match(/(?:Invoice|Rechnung)[^\n]*?(\d{4,})/i)?.[1];
  return typeof apiNumber === 'string' ? apiNumber : textNumber ?? '';
}

test('UAT-P2P-001 Einkaufsbestellung, Preview Posting und kontrollierte Laborbuchung', async ({ page }) => {
  test.setTimeout(520_000);

  const purchaseCase = await loadPurchaseCase();
  const existingPosting = await readPostingResult();
  if (existingPosting?.posted && existingPosting.purchaseOrderNumber && existingPosting.postedPurchaseInvoiceNumber) {
    await capturePostingTrace(page, existingPosting.postedPurchaseInvoiceNumber, existingPosting.purchaseOrderNumber);
    await writeJsonEvidence(p2pEvidencePath('160-posting-trace-refresh-result.json'), {
      testId: purchaseCase.id,
      mode: 'read-only-refresh-no-new-posting',
      purchaseOrderNumber: existingPosting.purchaseOrderNumber,
      postedPurchaseInvoiceNumber: existingPosting.postedPurchaseInvoiceNumber,
      refreshedAt: new Date().toISOString(),
      noNewPosting: true
    });
    return;
  }

  const api = await getApiContext(page);
  let order: Record<string, unknown> | undefined;
  let posted = false;

  try {
    const created = await createPurchaseOrder(api, purchaseCase);
    order = created.order;
    const orderNumber = String(order.number ?? '');
    const line = created.line;

    await writeJsonEvidence(p2pEvidencePath('090-purchase-order-api-result.json'), {
      testId: purchaseCase.id,
      environment: bcEnvironmentLabel().environment,
      company: project.defaultCompany,
      order,
      line,
      vendorInvoiceNumber: created.vendorInvoiceNumber,
      vendorInvoicePatchStatus: created.vendorInvoicePatchStatus,
      references: created.references,
      expected: purchaseCase,
      fitsTargetBeforePreview:
        String(order.vendorNumber ?? '') === purchaseCase.vendorNo &&
        Number(line.quantity) === purchaseCase.quantity &&
        Number(line.directUnitCost) === purchaseCase.unitCost &&
        Number(line.amountExcludingTax) === purchaseCase.netAmount &&
        Number(line.taxPercent) === 0
    });

    await openPurchaseOrderCard(page, orderNumber);
    const orderText = await pageText(page);
    await writeTextEvidence(p2pEvidencePath('090-purchase-order-page-text.txt'), orderText);
    await screenshot(page, 'p2p-001-090-purchase-order-before-preview.png', {
      projectName: project.name,
      testId: 'p2p-001',
      status: /Purchase Order|Einkaufsbestellung/i.test(orderText) && /RAW-STEEL|Stahltr/i.test(orderText) ? 'labor' : 'rejected',
      purpose: `Einkaufsbestellung ${orderNumber} vor Preview Posting mit K10000/RAW-STEEL.`,
      expectedPageText: [],
      knownLimitations: ['CRONUS-USA-Labor; Tax Percent 0 %, keine deutsche 19-%-Vorsteuer.'],
      bookUse: 'process-proof'
    });

    const preview = await openPreviewPosting(page);
    await writeTextEvidence(p2pEvidencePath('095-preview-posting-page-text.txt'), preview.text);
    await writeJsonEvidence(p2pEvidencePath('095-preview-posting-result.json'), {
      testId: purchaseCase.id,
      orderNumber,
      openedPostMenu: preview.openedPostMenu,
      clickedPreview: preview.clickedPreview,
      openedPreview: preview.openedPreview,
      blocked: preview.blocked,
      previewEntries: preview.previewEntries,
      hasVendorLedgerEntry: /Vendor Ledger Entry/i.test(preview.text),
      hasGlEntry: /G\/L Entry/i.test(preview.text),
      hasItemLedgerEntry: /Item Ledger Entry/i.test(preview.text),
      hasValueEntry: /Value Entry/i.test(preview.text),
      hasVatOrTaxEntry: /VAT Entry|Tax/i.test(preview.text),
      labBoundary: 'CRONUS-USA-Tax/VAT; deutsche 19-%-Vorsteuer nicht belegt.'
    });
    await screenshot(page, 'p2p-001-095-preview-posting.png', {
      projectName: project.name,
      testId: 'p2p-001',
      status: preview.openedPreview ? 'labor' : 'rejected',
      purpose: `Posting Preview fuer P2P-Laborbestellung ${orderNumber}.`,
      expectedPageText: preview.openedPreview ? [/Posting Preview|Buchungsvorschau/i] : [],
      knownLimitations: ['Nicht buchende Preview; CRONUS-USA-Labor; keine deutsche Vorsteuer-Evidence.'],
      bookUse: preview.openedPreview ? 'evidence' : 'do-not-use'
    });

    if (!preview.openedPreview) {
      await writeTextEvidence(
        p2pEvidencePath('P2P-LAB-POSTING.md'),
        renderPostingMarkdown({
          orderNumber,
          posted: false,
          postedInvoiceNo: '',
          selectedPostingOption: '',
          previewEntries: preview.previewEntries,
          blocker: 'Preview Posting wurde nicht tragfaehig erreicht. Siehe 095-preview-posting-result.json.',
          purchaseCase
        })
      );
      throw new Error('P2P Preview Posting nicht tragfaehig; keine Buchung ausgefuehrt.');
    }

    await openPurchaseOrderCard(page, orderNumber);
    const postingDialog = await openPostingDialog(page);
    await writeTextEvidence(p2pEvidencePath('100-posting-dialog-page-text.txt'), postingDialog.text);
    expect(postingDialog.text).toMatch(/Receive and Invoice|Empfangen und fakturieren|Receive|Invoice|OK/i);

    const selectedReceiveAndInvoice = await chooseReceiveAndInvoice(page);
    await screenshot(page, 'p2p-001-100-posting-dialog-before-ok.png', {
      projectName: project.name,
      testId: 'p2p-001',
      status: 'labor',
      purpose: `Normaler P2P-Buchungsdialog vor genau einer Laborbestaetigung fuer ${orderNumber}.`,
      expectedPageText: [/Receive and Invoice|Empfangen und fakturieren|Receive|Invoice|OK/i],
      knownLimitations: ['Einmalige CRONUS-USA-Laborbuchung; keine deutsche Finalbuchung.'],
      bookUse: 'evidence'
    });

    const confirmation = await confirmPostingOnce(page);
    await writeTextEvidence(p2pEvidencePath('100-posting-result-page-text.txt'), confirmation.text);
    const postedInvoices = await findPostedPurchaseInvoices(api, purchaseCase.vendorNo);
    const postedInvoiceNo = extractPostedInvoiceNumber(confirmation.text, postedInvoices);
    posted = Boolean(postedInvoiceNo) || /Posted Purchase Invoice|Gebuchte Einkaufsrechnung|has been posted|wurde gebucht/i.test(confirmation.text);

    await screenshot(page, 'p2p-001-101-posting-result.png', {
      projectName: project.name,
      testId: 'p2p-001',
      status: posted ? 'labor' : 'rejected',
      purpose: `Ergebniszustand nach P2P-Laborbuchung ${orderNumber}.`,
      expectedPageText: [],
      knownLimitations: ['Nur CRONUS-USA-Labor; keine deutsche 19-%-Vorsteuer.'],
      bookUse: posted ? 'evidence' : 'do-not-use'
    });

    const traces = postedInvoiceNo
      ? await capturePostingTrace(page, postedInvoiceNo, orderNumber)
      : [];
    const postingResult = {
      testId: purchaseCase.id,
      environment: bcEnvironmentLabel().environment,
      company: project.defaultCompany,
      status: posted ? 'posted-labor' : 'posting-result-unclear',
      posted,
      purchaseOrderNumber: orderNumber,
      selectedPostingOption: 'Receive and Invoice',
      selectedReceiveAndInvoice,
      clickedOkOnce: confirmation.clickedOk,
      openPostedInvoiceQuestion: confirmation.openPostedQuestion,
      postedPurchaseInvoiceNumber: postedInvoiceNo,
      postedPurchaseInvoicesApiSample: postedInvoices.slice(0, 5),
      previewEntries: preview.previewEntries,
      traces,
      target: purchaseCase,
      labActual: {
        currencyCode: order.currencyCode,
        taxPercent: line.taxPercent,
        netAmount: line.amountExcludingTax,
        totalTaxAmount: line.totalTaxAmount,
        amountIncludingTax: line.amountIncludingTax
      },
      explicitNonProofs: [
        'kein deutscher 19-%-Vorsteuer-Endstand',
        'kein deutscher Kontenplan-Endstand',
        'keine produktive Buchungsfreigabe'
      ]
    };
    await writeJsonEvidence(p2pEvidencePath('100-purchase-posting-result.json'), postingResult);
    await writeTextEvidence(
      p2pEvidencePath('P2P-LAB-POSTING.md'),
      renderPostingMarkdown({
        orderNumber,
        posted,
        postedInvoiceNo,
        selectedPostingOption: 'Receive and Invoice',
        previewEntries: preview.previewEntries,
        blocker: '',
        purchaseCase
      })
    );

    expect(posted, 'Nach OK muss eine P2P-Laborbuchung oder eine gebuchte Einkaufsrechnung nachweisbar sein.').toBe(true);
  } finally {
    if (order && !posted) {
      await writeJsonEvidence(p2pEvidencePath('999-purchase-order-aborted-cleanup.json'), await deletePurchaseOrder(api, order.id, order.number));
    }
  }
});

async function capturePostingTrace(page: Page, postedInvoiceNo: string, orderNumber: string) {
  const targets = [
    {
      id: 'posted-purchase-invoice',
      pageId: 138,
      table: 'Purch. Inv. Header',
      field: 'No.',
      value: postedInvoiceNo,
      fileStem: '110-posted-purchase-invoice',
      screenshotFile: 'p2p-001-110-posted-purchase-invoice.png',
      labelPattern: /Posted Purchase Invoice|Gebuchte Einkaufsrechnung|Purchase Invoice/i,
      purpose: `Gebuchte Einkaufsrechnung ${postedInvoiceNo} aus P2P-Laborbuchung.`
    },
    {
      id: 'vendor-ledger-entries',
      pageId: 29,
      table: 'Vendor Ledger Entry',
      field: 'Document No.',
      value: postedInvoiceNo,
      fileStem: '120-vendor-ledger-entries',
      screenshotFile: 'p2p-001-120-vendor-ledger-entries.png',
      labelPattern: /Vendor Ledger Entries|Kreditorenposten|Remaining Amount|Restbetrag/i,
      purpose: `Kreditorenposten zur gebuchten Einkaufsrechnung ${postedInvoiceNo}.`
    },
    {
      id: 'gl-entries',
      pageId: 20,
      table: 'G/L Entry',
      field: 'Document No.',
      value: postedInvoiceNo,
      fileStem: '130-gl-entries',
      screenshotFile: 'p2p-001-130-gl-entries.png',
      labelPattern: /G\/L Entries|Sachposten|Account No\.|Konto/i,
      purpose: `Sachposten zur gebuchten Einkaufsrechnung ${postedInvoiceNo}.`
    },
    {
      id: 'item-ledger-entries',
      pageId: 38,
      table: 'Item Ledger Entry',
      field: 'Order No.',
      value: orderNumber,
      fileStem: '140-item-ledger-entries',
      screenshotFile: 'p2p-001-140-item-ledger-entries.png',
      labelPattern: /Item Ledger Entries|Artikelposten|RAW-STEEL|Stahltr/i,
      purpose: `Artikelposten zum P2P-Laborauftrag ${orderNumber}.`
    },
    {
      id: 'value-entries',
      pageId: 5802,
      table: 'Value Entry',
      field: 'Document No.',
      value: postedInvoiceNo,
      fileStem: '150-value-entries',
      screenshotFile: 'p2p-001-150-value-entries.png',
      labelPattern: /Value Entries|Wertposten|Cost Amount|Kostenbetrag/i,
      purpose: `Wertposten zur gebuchten Einkaufsrechnung ${postedInvoiceNo}.`
    }
  ];

  const traces = [];
  for (const target of targets) {
    traces.push({ id: target.id, ...(await openFilteredPage(page, target)) });
  }
  const valueEntryText = await fs.readFile(p2pEvidencePath('150-value-entries-page-text.txt'), 'utf8');
  const itemLedgerEntryNo = extractItemLedgerEntryNoFromValueEntry(valueEntryText);
  let itemLedgerEntryByEntryNoTrace: Awaited<ReturnType<typeof openFilteredPage>> | undefined;
  if (itemLedgerEntryNo) {
    itemLedgerEntryByEntryNoTrace = await openFilteredPage(page, {
      id: 'item-ledger-entry-by-entry-no',
      pageId: 38,
      table: 'Item Ledger Entry',
      field: 'Entry No.',
      value: itemLedgerEntryNo,
      fileStem: '155-item-ledger-entry-by-entry-no',
      screenshotFile: 'p2p-001-155-item-ledger-entry-by-entry-no.png',
      labelPattern: /Item Ledger Entries|Artikelposten|RAW-STEEL|Stahltr/i,
      purpose: `Artikelposten ${itemLedgerEntryNo} zur P2P-Laborrechnung ${postedInvoiceNo}.`
    });
  }

  await writeJsonEvidence(p2pEvidencePath('160-posting-trace-summary.json'), {
    postedPurchaseInvoiceNumber: postedInvoiceNo,
    purchaseOrderNumber: orderNumber,
    itemLedgerEntryNoFromValueEntry: itemLedgerEntryNo,
    itemLedgerEntryByEntryNoTrace,
    summary: {
      postedInvoiceVisible: traces.find((entry) => entry.id === 'posted-purchase-invoice')?.valueVisible ?? false,
      vendorLedgerVisible: traces.find((entry) => entry.id === 'vendor-ledger-entries')?.valueVisible ?? false,
      glEntriesVisible: traces.find((entry) => entry.id === 'gl-entries')?.valueVisible ?? false,
      itemLedgerVisible:
        (traces.find((entry) => entry.id === 'item-ledger-entries')?.valueVisible ?? false) ||
        (itemLedgerEntryByEntryNoTrace?.valueVisible ?? false),
      valueEntriesVisible: traces.find((entry) => entry.id === 'value-entries')?.valueVisible ?? false,
      productlineMachineFoundInTrace:
        traces.some((entry) => entry.hasProductlineMachine) || (itemLedgerEntryByEntryNoTrace?.hasProductlineMachine ?? false)
    }
  });

  return [...traces, ...(itemLedgerEntryByEntryNoTrace ? [{ id: 'item-ledger-entry-by-entry-no', ...itemLedgerEntryByEntryNoTrace }] : [])];
}

function extractItemLedgerEntryNoFromValueEntry(valueEntryText: string) {
  const match = valueEntryText.match(/Item Ledger Entry No\.[\s\S]*?\b(\d{2,})\s+\d{2,}\s*(?:\n|$)/i);
  return match?.[1] ?? valueEntryText.match(/\bRAW-STEEL[\s\S]{0,240}\b(\d{2,})\s+\d{2,}\s*(?:\n|$)/i)?.[1];
}

function renderPostingMarkdown(args: {
  orderNumber: string;
  posted: boolean;
  postedInvoiceNo: string;
  selectedPostingOption: string;
  previewEntries: Array<{ entryType: string; count: number }>;
  blocker: string;
  purchaseCase: PurchaseCase;
}) {
  const previewRows = args.previewEntries.length
    ? args.previewEntries.map((entry) => `| ${entry.entryType} | ${entry.count} |`)
    : ['| keine tragfaehigen Preview-Zeilen | 0 |'];

  return [
    '# UAT-P2P-001 Laborbuchung',
    '',
    '| Feld | Wert |',
    '|---|---|',
    '| Umgebung | MCP_1_20260210 |',
    `| Company | ${project.defaultCompany} |`,
    `| Einkaufsbestellung | ${args.orderNumber} |`,
    `| Kreditor | ${args.purchaseCase.vendorNo} / ${args.purchaseCase.vendorName} |`,
    `| Artikel | ${args.purchaseCase.itemNo} / ${args.purchaseCase.itemDescription} |`,
    `| Menge / Preis | ${args.purchaseCase.quantity} x ${args.purchaseCase.unitCost} |`,
    `| Lagerort | ${args.purchaseCase.locationCode} |`,
    `| Gebucht | ${args.posted ? 'ja, kontrollierte CRONUS-USA-Laborbuchung' : 'nein'} |`,
    `| Buchungsoption | ${args.selectedPostingOption || 'nicht ausgefuehrt'} |`,
    `| Gebuchte Einkaufsrechnung | ${args.postedInvoiceNo || 'nicht vorhanden'} |`,
    `| Blocker | ${args.blocker || 'kein Preview-Blocker vor Buchung'} |`,
    '',
    '## Preview Posting',
    '',
    '| Postenart | Anzahl |',
    '|---|---:|',
    ...previewRows,
    '',
    '## Lernbefund',
    '',
    'Der P2P-Fall zeigt, dass eine Einkaufsbestellung nicht erst mit der gebuchten Rechnung fachlich relevant wird. Schon die Buchungsvorschau prueft, ob Kreditor, Artikel, Lagerort, Buchungsgruppen und Steuer-/Tax-Setup zusammenpassen. Erst wenn diese Vorschau tragfaehig ist, darf im Labor bewusst gebucht werden.',
    '',
    '## Laborgrenzen',
    '',
    '- CRONUS-USA-Labor, kein deutscher Kontenplan-Endstand.',
    '- Deutsche 19-%-Vorsteuer bleibt offen; Tax/VAT aus diesem Lauf ist kein finaler DE-Nachweis.',
    '- Diese Evidence ersetzt keine produktive Freigabe und keine E-Rechnungs-/Zahlungspruefung.',
    '',
    '## Naechster Schritt',
    '',
    args.posted
      ? 'Gebuchte Einkaufsrechnung, Kreditorenposten, Sachposten, Artikelposten und Wertposten fuer Buchkapitel 12 auswerten; danach Payment/OP-Ausgleich vorbereiten.'
      : 'Preview-Blocker fachlich analysieren und erst nach sicherem Setup-Fit erneut versuchen.',
    ''
  ].join('\n');
}
