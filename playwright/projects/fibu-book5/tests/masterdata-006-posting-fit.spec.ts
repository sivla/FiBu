import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import {
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
  writeEvidenceText
} from '../../../core/bc-helpers';
import { project } from '../project';

type BcApiContext = {
  company: {
    id: string;
    name: string;
    displayName: string;
  };
  root: string;
  token: string;
};

type SalesOrderProbe = {
  ok: boolean;
  order?: Record<string, unknown>;
  line?: Record<string, unknown>;
  deleted?: { status: number; text: string };
  error?: { stage: string; status: number; text: string };
};

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

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
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
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

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${endpoint} fehlgeschlagen: ${response.status} ${text}`);
  }

  return text ? JSON.parse(text) : undefined;
}

async function findApiRecords(api: BcApiContext, endpoint: string, filter: string) {
  const result = await bcApi(api, `${endpoint}?$filter=${encodeURIComponent(filter)}`);
  return result.value as Array<Record<string, unknown>>;
}

async function patchCustomerAddress(api: BcApiContext) {
  const [customer] = await findApiRecords(api, 'customers', "number eq 'D10000'");
  if (!customer) {
    throw new Error('D10000 fehlt. MASTERDATA-005 muss vorher laufen.');
  }

  return bcApi(api, `customers(${customer.id})`, {
    method: 'PATCH',
    headers: { 'If-Match': '*' },
    body: {
      displayName: 'Mueller Maschinenbau GmbH',
      addressLine1: 'Industriestrasse 10',
      city: 'Frankfurt am Main',
      country: 'DE',
      postalCode: '60311',
      email: 'rechnung@mueller-maschinenbau.example',
      taxLiable: true
    }
  });
}

async function ensureItemPostingFit(api: BcApiContext) {
  const [item] = await findApiRecords(api, 'items', "number eq 'RM-M100'");
  if (!item) {
    throw new Error('RM-M100 fehlt. MASTERDATA-005 muss vorher laufen.');
  }

  await bcApi(api, `items(${item.id})`, {
    method: 'PATCH',
    headers: { 'If-Match': '*' },
    body: {
      baseUnitOfMeasureCode: 'PCS',
      generalProductPostingGroupCode: 'RETAIL',
      inventoryPostingGroupCode: 'RESALE',
      taxGroupCode: 'FURNITURE'
    }
  });

  const [finalItem] = await findApiRecords(api, 'items', "number eq 'RM-M100'");
  return finalItem;
}

async function applyCustomerCompanyTemplate(page: Page) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '21');
  url.searchParams.set('filter', "'Customer'.'No.' IS 'D10000'");

  await page.goto(url.toString());
  await waitForBusinessCentralShell(page);
  await expect.poll(() => pageText(page), { timeout: 60_000 }).toMatch(/D10000[\s\S]*Mueller Maschinenbau GmbH/i);
  await dismissTours(page);

  for (const frame of page.frames()) {
    await frame.getByText('Apply Template', { exact: true }).click({ timeout: 1500 }).catch(() => undefined);
  }
  await page.waitForTimeout(2000);

  for (const frame of page.frames()) {
    await frame.getByRole('button', { name: /^OK$/i }).click({ timeout: 1500 }).catch(() => undefined);
  }
  await page.waitForTimeout(1000);

  for (const frame of page.frames()) {
    await frame.getByRole('button', { name: /^Ja$|^Yes$/i }).click({ timeout: 1500 }).catch(() => undefined);
  }
  await page.waitForTimeout(8000);
}

async function probeSalesOrder(api: BcApiContext): Promise<SalesOrderProbe> {
  const [item] = await findApiRecords(api, 'items', "number eq 'RM-M100'");
  const [location] = await findApiRecords(api, 'locations', "code eq 'FRA-ZL'");
  if (!item || !location) {
    return { ok: false, error: { stage: 'prerequisite', status: 0, text: 'RM-M100 oder FRA-ZL fehlt.' } };
  }

  let order: Record<string, unknown> | undefined;
  let line: Record<string, unknown> | undefined;
  let deleted: { status: number; text: string } | undefined;
  let probe: SalesOrderProbe | undefined;

  try {
    try {
      order = await bcApi(api, 'salesOrders', {
        method: 'POST',
        body: { customerNumber: 'D10000', externalDocumentNumber: `MD006-${Date.now()}` }
      });
    } catch (error) {
      probe = { ok: false, error: { stage: 'salesOrder', status: 400, text: String(error) } };
      return probe;
    }

    try {
      line = await bcApi(api, `salesOrders(${order.id})/salesOrderLines`, {
        method: 'POST',
        body: {
          lineType: 'Item',
          itemId: item.id,
          quantity: 1,
          unitPrice: 68000,
          locationId: location.id
        }
      });
    } catch (error) {
      probe = { ok: false, order, error: { stage: 'salesOrderLine', status: 400, text: String(error) } };
      return probe;
    }

    probe = { ok: true, order, line };
    return probe;
  } finally {
    if (order?.id) {
      const response = await fetch(`${api.root}/companies(${api.company.id})/salesOrders(${order.id})`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${api.token}`, Accept: 'application/json', 'If-Match': '*' }
      });
      deleted = { status: response.status, text: await response.text() };
      if (probe) {
        probe.deleted = deleted;
      }
    }
  }
}

async function openCustomerCardAndCapture(page: Page) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '21');
  url.searchParams.set('filter', "'Customer'.'No.' IS 'D10000'");

  await page.goto(url.toString());
  await waitForBusinessCentralShell(page);
  await expect.poll(() => pageText(page), { timeout: 60_000 }).toMatch(/D10000[\s\S]*Mueller Maschinenbau GmbH/i);
  await dismissTours(page);
  await page.waitForTimeout(2000);
  await screenshot(page, 'masterdata-006-customer-template-fit.png');
  await writeEvidenceText(
    'playwright/projects/fibu-book5/evidence/masterdata-006/customer-template-fit.txt',
    await pageText(page)
  );
}

async function openItemCardAndCapture(page: Page) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '30');
  url.searchParams.set('filter', "'Item'.'No.' IS 'RM-M100'");

  await page.goto(url.toString());
  await waitForBusinessCentralShell(page);
  await expect.poll(() => pageText(page), { timeout: 60_000 }).toMatch(/RM-M100[\s\S]*Standardmaschine M100/i);
  await dismissTours(page);
  await page.waitForTimeout(2000);
  await screenshot(page, 'masterdata-006-item-posting-fit.png');
  await writeEvidenceText(
    'playwright/projects/fibu-book5/evidence/masterdata-006/item-posting-fit.txt',
    await pageText(page)
  );
}

test('MASTERDATA-006 Posting-Fit fuer ersten O2C-Probelauf herstellen', async ({ page }) => {
  test.setTimeout(360_000);

  await fs.mkdir(path.resolve('playwright/projects/fibu-book5/evidence/masterdata-006'), { recursive: true });

  const api = await getApiContext(page);
  const firstProbe = await probeSalesOrder(api);

  if (!firstProbe.ok && /Customer Posting Group/i.test(firstProbe.error?.text ?? '')) {
    await applyCustomerCompanyTemplate(page);
  }

  const customer = await patchCustomerAddress(api);
  const item = await ensureItemPostingFit(api);
  const finalProbe = await probeSalesOrder(api);

  const evidence = {
    decision:
      'CRONUS-Spielwiese: technischer Posting-Fit ueber CUSTOMER COMPANY, PCS, RETAIL, RESALE und FURNITURE. Das ist noch kein deutscher 19-Prozent-USt-Fall.',
    firstProbe,
    customer,
    item,
    finalProbe
  };

  await writeEvidenceText(
    'playwright/projects/fibu-book5/evidence/masterdata-006/api-result.json',
    JSON.stringify(evidence, null, 2)
  );

  await openCustomerCardAndCapture(page);
  await openItemCardAndCapture(page);

  expect(item.baseUnitOfMeasureCode).toBe('PCS');
  expect(item.generalProductPostingGroupCode).toBe('RETAIL');
  expect(item.inventoryPostingGroupCode).toBe('RESALE');
  expect(finalProbe.ok).toBe(true);
  expect(finalProbe.line?.lineObjectNumber).toBe('RM-M100');
});
