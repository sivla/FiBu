import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import {
  bcPageUrl,
  dismissTours,
  findFrameText,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
  writeEvidenceText
} from '../../../core/bc-helpers';
import { project } from '../project';

type CustomerBuildData = {
  minimumForO2C: Array<{
    no: string;
    name: string;
    countryRegionCode: string;
  }>;
};

type ItemBuildData = {
  minimumForO2C: Array<{
    no: string;
    description: string;
    type: string;
    unitCost: number;
    unitPrice: number;
  }>;
};

type BcApiContext = {
  company: {
    id: string;
    name: string;
    displayName: string;
  };
  root: string;
  token: string;
};

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

async function loadCustomerData() {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/masterdata/customers.json', 'utf8');
  return JSON.parse(raw) as CustomerBuildData;
}

async function loadItemData() {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/masterdata/items.json', 'utf8');
  return JSON.parse(raw) as ItemBuildData;
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
  options: { method?: string; body?: unknown; headers?: Record<string, string> } = {}
) {
  const url = `${api.root}/companies(${api.company.id})/${endpoint}`;
  const response = await fetch(url, {
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

async function ensureCustomer(api: BcApiContext, customer: CustomerBuildData['minimumForO2C'][number]) {
  const leftovers = await findApiRecords(api, 'customers', "number eq 'C00010'");
  for (const leftover of leftovers) {
    if (!leftover.displayName) {
      await bcApi(api, `customers(${leftover.id})`, { method: 'DELETE', headers: { 'If-Match': '*' } });
    }
  }

  const existing = await findApiRecords(api, 'customers', `number eq '${customer.no}'`);
  const payload = {
    number: customer.no,
    displayName: customer.name,
    type: 'Company',
    addressLine1: 'Industriestrasse 10',
    city: 'Frankfurt am Main',
    country: customer.countryRegionCode,
    postalCode: '60311',
    email: 'rechnung@mueller-maschinenbau.example',
    taxLiable: true
  };

  if (existing.length) {
    await bcApi(api, `customers(${existing[0].id})`, {
      method: 'PATCH',
      headers: { 'If-Match': '*' },
      body: payload
    });
    return 'updated';
  }

  await bcApi(api, 'customers', { method: 'POST', body: payload });
  return 'created';
}

async function ensureItem(api: BcApiContext, item: ItemBuildData['minimumForO2C'][number]) {
  const existing = await findApiRecords(api, 'items', `number eq '${item.no}'`);
  const payload = {
    number: item.no,
    displayName: item.description,
    type: item.type,
    itemCategoryCode: 'MISC',
    unitCost: item.unitCost,
    unitPrice: item.unitPrice,
    blocked: false
  };

  if (existing.length) {
    await bcApi(api, `items(${existing[0].id})`, {
      method: 'PATCH',
      headers: { 'If-Match': '*' },
      body: payload
    });
    return 'updated';
  }

  await bcApi(api, 'items', { method: 'POST', body: payload });
  return 'created';
}

async function openPageAndCapture(
  page: Page,
  pageId: number,
  expected: RegExp,
  fileName: string,
  evidenceFile: string,
  revealText?: RegExp
) {
  await page.goto('about:blank');
  await page.goto(bcPageUrl(pageId, project.envPrefix));
  await waitForBusinessCentralShell(page);
  await expect.poll(() => pageText(page), { timeout: 60_000 }).toMatch(expected);
  if (revealText) {
    const { frame } = await findFrameText(page, expected);
    const target = frame.getByText(revealText).first();
    await target.scrollIntoViewIfNeeded({ timeout: 10_000 }).catch(() => undefined);
    await target.click({ timeout: 10_000 }).catch(() => undefined);
  }
  await dismissTours(page);
  for (const frame of page.frames()) {
    await frame.getByRole('button', { name: /Verwerfen/i }).click({ timeout: 500 }).catch(() => undefined);
  }
  if (/About /i.test(await pageText(page))) {
    await page.mouse.click(357, 770).catch(() => undefined);
  }
  await page.waitForTimeout(3000);
  await screenshot(page, fileName);
  await writeEvidenceText(evidenceFile, await pageText(page));
}

test('MASTERDATA-005 Debitor D10000 und Artikel RM-M100 anlegen', async ({ page }) => {
  test.setTimeout(300_000);

  const customers = await loadCustomerData();
  const items = await loadItemData();
  const customer = customers.minimumForO2C[0];
  const item = items.minimumForO2C[0];
  const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/masterdata-005');
  const api = await getApiContext(page);

  const customerResult = await ensureCustomer(api, customer);
  const itemResult = await ensureItem(api, item);
  const finalCustomers = await findApiRecords(api, 'customers', `number eq '${customer.no}'`);
  const finalItems = await findApiRecords(api, 'items', `number eq '${item.no}'`);

  await writeEvidenceText(
    path.join(evidenceDir, 'api-result.json'),
    JSON.stringify({ company: api.company, customerResult, itemResult, finalCustomers, finalItems }, null, 2)
  );

  await openPageAndCapture(
    page,
    22,
    new RegExp(`${customer.no}[\\s\\S]*${customer.name}`, 'i'),
    'masterdata-005-customers-after-api.png',
    path.join(evidenceDir, 'customers-after-api.txt'),
    new RegExp(`^${customer.no}$`, 'i')
  );

  await openPageAndCapture(
    page,
    31,
    new RegExp(`${item.no}[\\s\\S]*${item.description}`, 'i'),
    'masterdata-005-items-after-api.png',
    path.join(evidenceDir, 'items-after-api.txt'),
    new RegExp(`^${item.no}$`, 'i')
  );

  const itemText = await pageText(page);
  await expect(itemText).toMatch(/42\.000,00|42000/i);
  await expect(itemText).toMatch(/68\.000,00|68000/i);
  await expect(JSON.stringify(finalItems)).toMatch(/"generalProductPostingGroupCode":\s*""/);
});
