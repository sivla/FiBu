import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { addSalesOrderItemLine, createSalesOrder } from '../../../core/bc-api';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { pageText, requireBcUrl, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

type O2CTestData = {
  id: string;
  customerNo: string;
  customerName: string;
  itemNo: string;
  quantity: number;
  unitPrice: number;
  currencyCode: string;
  vatPercent: number;
  locationCode: string;
  dimensions: Record<string, string>;
};

function o2cEvidencePath(fileName: string) {
  return evidencePath(project.name, 'uat-o2c-001', fileName);
}

function bcEnvironmentLabel() {
  const [tenant, environment] = new URL(requireBcUrl(project.envPrefix)).pathname.split('/').filter(Boolean);
  return { tenant, environment };
}

async function loadTestData() {
  const filePath = path.resolve('playwright/projects/fibu-book5/testdata/sales/uat-o2c-001.json');
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as O2CTestData;
}

async function ensurePostingReadiness() {
  const readiness = await fs.readFile(o2cEvidencePath('070-lab-posting-readiness.md'), 'utf8');
  expect(readiness).toMatch(/Laborbuchung ist erlaubt:\s*ja/i);
}

async function postingResultExists() {
  return fs.access(o2cEvidencePath('080-posting-result.json')).then(() => true).catch(() => false);
}

async function openSalesOrderCard(page: Page, orderNumber: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '42');
  url.searchParams.set('filter', `'Sales Header'.'No.' IS '${orderNumber}'`);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await expect.poll(async () => pageText(page), { timeout: 90_000 }).toMatch(new RegExp(orderNumber));
}

async function runInBcApi<TResult, TArgs extends Record<string, unknown>>(
  page: Page,
  args: TArgs & { companyName: string },
  operation: string
) {
  return page.evaluate(
    async ({ args, operation }) => {
      const token = document.documentElement.innerHTML.match(/"accessToken":"([^"]+)/)?.[1];
      if (!token) {
        throw new Error('BC accessToken im Webclient nicht gefunden.');
      }

      const [tenant, environment] = location.pathname.split('/').filter(Boolean);
      const root = `https://api.businesscentral.dynamics.com/v2.0/${tenant}/${environment}/api/v2.0`;
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const companiesResponse = await fetch(`${root}/companies`, { headers });
      const companies = await companiesResponse.json();
      const company = companies.value.find((entry: { name: string }) => entry.name === args.companyName);
      if (!company) {
        throw new Error(`Company ${args.companyName} nicht gefunden.`);
      }

      return Function('api', 'args', `return (${operation})({ root: api.root, headers: api.headers, company: api.company }, args);`)(
        { root, headers, company },
        args
      );
    },
    { args, operation }
  ) as Promise<TResult>;
}

async function deleteDraftSalesOrder(page: Page, orderNumber: string) {
  return runInBcApi(page, { companyName: project.defaultCompany, orderNumber }, async function deleteOrder(api, args) {
    const filter = encodeURIComponent(`number eq '${args.orderNumber}'`);
    const ordersResponse = await fetch(`${api.root}/companies(${api.company.id})/salesOrders?$filter=${filter}`, {
      headers: api.headers
    });
    const orders = await ordersResponse.json();
    const [order] = orders.value ?? [];
    if (!order) {
      return { orderNumber: args.orderNumber, deleted: false, reason: 'not-found' };
    }

    const deleteResponse = await fetch(`${api.root}/companies(${api.company.id})/salesOrders(${order.id})`, {
      method: 'DELETE',
      headers: { ...api.headers, 'If-Match': '*' }
    });

    return {
      orderNumber: args.orderNumber,
      deleted: deleteResponse.status === 204,
      status: deleteResponse.status,
      text: await deleteResponse.text()
    };
  }.toString());
}

async function findPostedSalesInvoices(page: Page, customerNumber: string) {
  return runInBcApi<Array<Record<string, unknown>>>(
    page,
    { companyName: project.defaultCompany, customerNumber },
    async function findInvoices(api, args) {
      const filter = encodeURIComponent(`customerNumber eq '${args.customerNumber}'`);
      const response = await fetch(`${api.root}/companies(${api.company.id})/salesInvoices?$filter=${filter}&$orderby=lastModifiedDateTime desc`, {
        headers: api.headers
      });
      const text = await response.text();
      if (!response.ok) {
        return [{ apiError: true, status: response.status, text }];
      }
      return (JSON.parse(text).value ?? []).slice(0, 5);
    }.toString()
  );
}

async function clickFirstVisibleAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'radio'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(1500);
          return true;
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
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
  await page.waitForTimeout(5000);
  const text = await pageText(page);
  const previewEntries = ['G/L Entry', 'Cust. Ledger Entry', 'Item Ledger Entry', 'Detailed Cust. Ledg. Entry', 'Value Entry']
    .map((entryType) => {
      const match = text.match(new RegExp(`${entryType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)`, 'i'));
      return match ? { entryType, count: Number(match[1]) } : undefined;
    })
    .filter((entry): entry is { entryType: string; count: number } => Boolean(entry));

  return {
    openedPostMenu,
    clickedPreview,
    openedPreview: previewEntries.length >= 5,
    oldInventoryPostingErrorPresent: /Inventory Account is missing.*FRA-ZL.*RESALE/i.test(text),
    pageTextEvidenceFile: '079-pre-posting-preview-page-text.txt',
    previewEntries,
    text
  };
}

async function checkLineDimensions(page: Page, data: O2CTestData) {
  const lineOpened = await clickFirstVisibleAction(page, /^Line$/i);
  const relatedOpened = lineOpened ? await clickFirstVisibleAction(page, /^Related Information$|^Zugehoerige Informationen$|^Zugeh/i) : false;
  const dimensionsOpened =
    (relatedOpened || lineOpened) && (await clickFirstVisibleAction(page, /^Dimensions$|^Dimensionen$/i));
  await page.waitForTimeout(1500);
  const text = await pageText(page);
  const hasTargetDimension = Object.entries(data.dimensions).every(
    ([dimensionCode, dimensionValue]) => new RegExp(dimensionCode, 'i').test(text) && new RegExp(dimensionValue, 'i').test(text)
  );
  return { lineOpened, relatedOpened, dimensionsOpened, hasTargetDimension, text };
}

function hasExpectedLineValues(lineEvidence: {
  order: { currencyCode?: string };
  item: { inventoryPostingGroupCode?: string };
  line: {
    lineObjectNumber?: string;
    quantity?: number;
    unitPrice?: number;
    taxPercent?: number;
    amountExcludingTax?: number;
    totalTaxAmount?: number;
  };
}, data: O2CTestData) {
  return (
    lineEvidence.order.currencyCode === data.currencyCode &&
    lineEvidence.line.lineObjectNumber === data.itemNo &&
    lineEvidence.line.quantity === data.quantity &&
    lineEvidence.line.unitPrice === data.unitPrice &&
    lineEvidence.line.taxPercent === 0 &&
    lineEvidence.line.totalTaxAmount === 0 &&
    lineEvidence.item.inventoryPostingGroupCode === 'RESALE'
  );
}

async function openPostingDialog(page: Page) {
  const clickedMainPost = await clickFirstVisibleAction(page, /^Post(?:\.\.\.)?$|^Buchen(?:\.\.\.)?$/i);
  await page.waitForTimeout(2500);
  let text = await pageText(page);
  if (!/Ship and Invoice|Liefern und fakturieren|Invoice|Rechnung|OK/i.test(text)) {
    await clickPostDropdown(page);
    await clickFirstVisibleAction(page, /^Post(?:\.\.\.)?$|^Buchen(?:\.\.\.)?$/i);
    await page.waitForTimeout(2500);
    text = await pageText(page);
  }

  return { clickedMainPost, text };
}

async function chooseShipAndInvoice(page: Page) {
  const selected = await clickFirstVisibleAction(page, /^Ship and Invoice$|^Liefern und fakturieren$/i);
  await page.waitForTimeout(1000);
  return selected;
}

async function confirmPostingOnce(page: Page) {
  const clickedOk = await clickFirstVisibleAction(page, /^OK$/i);
  await page.waitForTimeout(12_000);
  let text = await pageText(page);
  const openPostedQuestion = /Do you want to open the posted invoice|Moechten Sie die gebuchte Rechnung|geoeffnete gebuchte Rechnung/i.test(text);
  if (openPostedQuestion) {
    await clickFirstVisibleAction(page, /^Yes$|^Ja$/i);
    await page.waitForTimeout(8000);
    text = await pageText(page);
  }
  return { clickedOk, openPostedQuestion, text };
}

test('UAT-O2C-001 genau eine CRONUS-USA-Laborbuchung ausfuehren', async ({ page }) => {
  test.skip(await postingResultExists(), '080-posting-result.json existiert bereits; keine zweite Laborbuchung ausfuehren.');
  await ensurePostingReadiness();
  const data = await loadTestData();
  let orderNumber = '';
  let posted = false;

  try {
    await page.goto(requireBcUrl(project.envPrefix));
    await waitForBusinessCentralShell(page);

    const order = await createSalesOrder(page, {
      companyName: project.defaultCompany,
      customerNumber: data.customerNo,
      externalDocumentNumber: `${data.id}-LAB-POST-${Date.now()}`
    });
    orderNumber = order.number;
    await writeJsonEvidence(o2cEvidencePath('079-pre-posting-order-api-result.json'), order);

    const lineEvidence = await addSalesOrderItemLine(page, {
      companyName: project.defaultCompany,
      orderNumber,
      itemNo: data.itemNo,
      locationCode: data.locationCode,
      quantity: data.quantity,
      unitPrice: data.unitPrice
    });
    await writeJsonEvidence(o2cEvidencePath('079-pre-posting-line-api-result.json'), lineEvidence);

    await openSalesOrderCard(page, orderNumber);
    const dimension = await checkLineDimensions(page, data);
    await writeTextEvidence(o2cEvidencePath('079-pre-posting-dimension-page-text.txt'), dimension.text);
    await writeJsonEvidence(o2cEvidencePath('079-pre-posting-dimension-result.json'), {
      ...dimension,
      text: undefined,
      targetDimensions: data.dimensions
    });

    await openSalesOrderCard(page, orderNumber);
    const preview = await openPreviewPosting(page);
    await writeTextEvidence(o2cEvidencePath(preview.pageTextEvidenceFile), preview.text);
    await writeJsonEvidence(o2cEvidencePath('079-pre-posting-check-result.json'), {
      testId: data.id,
      company: project.defaultCompany,
      sandbox: bcEnvironmentLabel().environment,
      orderNumber,
      expected: {
        customerNo: data.customerNo,
        itemNo: data.itemNo,
        quantity: data.quantity,
        locationCode: data.locationCode,
        unitPrice: data.unitPrice,
        currencyCode: data.currencyCode,
        taxPercent: 0,
        inventoryPostingAccount: '14140',
        dimensions: data.dimensions
      },
      apiLineFitsTarget: hasExpectedLineValues(lineEvidence, data),
      dimensionFitsTarget: dimension.hasTargetDimension,
      previewPostingFitsTarget: preview.openedPreview && !preview.oldInventoryPostingErrorPresent,
      previewEntries: preview.previewEntries,
      oldInventoryPostingErrorPresent: preview.oldInventoryPostingErrorPresent,
      visibleActionSummary: {
        postActionExpected: true,
        normalPostingDialogOpenedLater: true,
        fullActionDumpOmitted: 'Absichtlich nicht gespeichert, damit 079 kompakte Evidence bleibt.'
      }
    });

    expect(hasExpectedLineValues(lineEvidence, data), 'Kopf/Zeile/EUR/Tax-0/RESALE muessen vor Buchung passen.').toBe(true);
    expect(dimension.hasTargetDimension, 'PRODUCTLINE=MACHINE muss vor Buchung im Belegdialog nachgewiesen sein.').toBe(true);
    expect(preview.openedPreview, 'Preview Posting muss echte Vorschauzeilen zeigen.').toBe(true);
    expect(preview.oldInventoryPostingErrorPresent, 'Alter Inventory-Posting-Setup-Blocker darf nicht mehr sichtbar sein.').toBe(false);

    await screenshot(page, 'uat-o2c-001-079-preview-before-lab-posting.png', {
      projectName: project.name,
      testId: 'uat-o2c-001',
      status: 'labor',
      purpose: 'Letzte nicht buchende Buchungsvorschau vor der einmaligen CRONUS-USA-Laborbuchung.',
      expectedPageText: [/G\/L Entry/i, /Cust\. Ledger Entry/i, /Item Ledger Entry/i, /Value Entry/i],
      knownLimitations: ['CRONUS-USA-Labor; Tax bleibt 0 %, kein deutscher 19-%-USt-Endstand.'],
      bookUse: 'evidence'
    });

    await openSalesOrderCard(page, orderNumber);
    const postingDialog = await openPostingDialog(page);
    await writeTextEvidence(o2cEvidencePath('080-posting-dialog-page-text.txt'), postingDialog.text);
    expect(postingDialog.text).toMatch(/Ship and Invoice|Liefern und fakturieren|Invoice|Rechnung/i);

    const selectedShipAndInvoice = await chooseShipAndInvoice(page);
    await screenshot(page, 'uat-o2c-001-080-posting-dialog-before-ok.png', {
      projectName: project.name,
      testId: 'uat-o2c-001',
      status: 'labor',
      purpose: 'Normaler Buchungsdialog vor der bewussten Bestaetigung der Laborbuchung.',
      expectedPageText: [/Ship and Invoice|Liefern und fakturieren|Invoice|Rechnung/i, /OK/i],
      knownLimitations: ['Einmalige CRONUS-USA-Laborbuchung; keine deutsche Finalbuchung.'],
      bookUse: 'evidence'
    });

    const confirmation = await confirmPostingOnce(page);
    await writeTextEvidence(o2cEvidencePath('080-posting-result-page-text.txt'), confirmation.text);
    const postedInvoices = await findPostedSalesInvoices(page, data.customerNo);
    const invoiceNumber =
      postedInvoices.find((entry) => typeof entry.number === 'string' && entry.customerNumber === data.customerNo)?.number ??
      confirmation.text.match(/(?:Invoice|Rechnung)[^\n]*?(\d{4,})/i)?.[1] ??
      '';
    posted = Boolean(invoiceNumber) || /Posted Sales Invoice|Gebuchte Verkaufsrechnung|has been posted|wurde gebucht/i.test(confirmation.text);

    await screenshot(page, 'uat-o2c-001-081-posting-result.png', {
      projectName: project.name,
      testId: 'uat-o2c-001',
      status: posted ? 'labor' : 'rejected',
      purpose: 'Ergebniszustand nach genau einer CRONUS-USA-Laborbuchung.',
      expectedPageText: [],
      knownLimitations: ['Nur Laborposten; Steuer bleibt CRONUS-USA/0 %.'],
      bookUse: posted ? 'evidence' : 'do-not-use'
    });

    const result = {
      testId: data.id,
      company: project.defaultCompany,
      sandbox: bcEnvironmentLabel().environment,
      status: posted ? 'posted-labor' : 'posting-result-unclear',
      posted,
      orderNumber,
      selectedPostingOption: 'Ship and Invoice',
      selectedShipAndInvoice,
      clickedOkOnce: confirmation.clickedOk,
      openPostedInvoiceQuestion: confirmation.openPostedQuestion,
      postedSalesInvoiceNumber: invoiceNumber,
      postedSalesInvoicesApiSample: postedInvoices,
      preconditions: {
        customerNo: data.customerNo,
        itemNo: data.itemNo,
        quantity: data.quantity,
        locationCode: data.locationCode,
        unitPrice: data.unitPrice,
        currencyCode: data.currencyCode,
        taxPercent: 0,
        targetVatPercentStillOpen: data.vatPercent,
        productlineMachineInDocumentDialog: dimension.hasTargetDimension,
        inventoryPostingSetup: 'FRA-ZL + RESALE -> 14140',
        previewPostingOpened: preview.openedPreview,
        previewEntries: preview.previewEntries
      },
      evidence: {
        postingDialogText: '080-posting-dialog-page-text.txt',
        postingResultText: '080-posting-result-page-text.txt',
        screenshots: [
          'uat-o2c-001-079-preview-before-lab-posting.png',
          'uat-o2c-001-080-posting-dialog-before-ok.png',
          'uat-o2c-001-081-posting-result.png'
        ]
      },
      explicitNonProofs: [
        'kein deutscher 19-%-USt-Endstand',
        'kein deutscher Kontenplan-Endstand',
        'keine finale deutsche Buchabbildung'
      ]
    };
    await writeJsonEvidence(o2cEvidencePath('080-posting-result.json'), result);
    await writeTextEvidence(
      o2cEvidencePath('080-posting-learning.md'),
      [
        '# UAT-O2C-001 Laborbuchung Lernbefund',
        '',
        '| Punkt | Befund |',
        '|---|---|',
        `| Auftrag | ${orderNumber} |`,
        `| Buchungsoption | Ship and Invoice |`,
        `| Genau einmal bestaetigt | ${confirmation.clickedOk ? 'ja' : 'nein'} |`,
        `| Gebucht | ${posted ? 'ja' : 'unklar'} |`,
        `| Gebuchte Verkaufsrechnung | ${invoiceNumber || 'nicht eindeutig ermittelt'} |`,
        '| Warum diese Option | Der O2C-Laborfall soll Lieferung und Fakturierung in einem Schritt zeigen. Deshalb ist `Ship and Invoice` fachlich passend. |',
        '| Warum BC vorher Preview braucht | Die Preview beweist vor dem Buchen, dass BC Sach-, Debitoren-, Artikel- und Wertposten bilden kann und dass der Inventory-Setup-Blocker nicht mehr greift. |',
        '| Steuergrenze | Tax bleibt im CRONUS-USA-Labor 0 %. Das ist bewusst kein deutscher 19-%-USt-Nachweis. |',
        '| Buchwirkung | Das Buch kann diesen Lauf als Laborbeispiel fuer kontrolliertes Buchen und nachgelagerte Postenspur nutzen, aber finale deutsche Screenshots muessen spaeter neu entstehen. |',
        '',
        '## Naechster Schritt',
        '',
        'Die gebuchte Verkaufsrechnung und die entstandenen Debitoren-, Sach-, Artikel- und Wertposten in Business Central oeffnen und als kompakte Postenspur-Evidence sichern.',
        ''
      ].join('\n')
    );

    expect(posted, 'Nach OK muss eine Laborbuchung oder eine eindeutige gebuchte Rechnung nachweisbar sein.').toBe(true);
  } finally {
    if (orderNumber && !posted) {
      await writeJsonEvidence(o2cEvidencePath('080-posting-aborted-cleanup.json'), await deleteDraftSalesOrder(page, orderNumber));
    }
  }
});
