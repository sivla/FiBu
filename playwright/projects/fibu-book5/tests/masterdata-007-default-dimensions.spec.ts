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

type DefaultDimensionTarget = {
  parentType: 'Customer' | 'Item';
  parentEndpoint: 'customers' | 'items';
  parentNumberField: 'number';
  parentNumber: string;
  dimensionCode: string;
  dimensionValueCode: string;
  postingValidation: 'Same_x0020_Code';
};

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

async function getApiContext(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix));
  await expect
    .poll(
      () =>
        page.evaluate(() => Boolean(document.documentElement.innerHTML.match(/"accessToken":"([^"]+)/)?.[1])),
      { timeout: 120_000 }
    )
    .toBe(true);

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

async function ensureDefaultDimension(api: BcApiContext, target: DefaultDimensionTarget) {
  const [parent] = await findApiRecords(api, target.parentEndpoint, `${target.parentNumberField} eq '${target.parentNumber}'`);
  if (!parent) {
    throw new Error(`${target.parentType} ${target.parentNumber} fehlt.`);
  }

  const [dimension] = await findApiRecords(api, 'dimensions', `code eq '${target.dimensionCode}'`);
  if (!dimension) {
    throw new Error(`Dimension ${target.dimensionCode} fehlt.`);
  }

  const [dimensionValue] = await findApiRecords(
    api,
    'dimensionValues',
    `dimensionId eq ${dimension.id} and code eq '${target.dimensionValueCode}'`
  );
  if (!dimensionValue) {
    throw new Error(`Dimensionswert ${target.dimensionCode}=${target.dimensionValueCode} fehlt.`);
  }

  const existing = await findApiRecords(
    api,
    'defaultDimensions',
    `parentType eq '${target.parentType}' and parentId eq ${parent.id} and dimensionCode eq '${target.dimensionCode}'`
  );

  const payload = {
    parentType: target.parentType,
    parentId: parent.id,
    dimensionId: dimension.id,
    dimensionValueId: dimensionValue.id,
    postingValidation: target.postingValidation
  };

  if (existing.length) {
    await bcApi(api, `defaultDimensions(${existing[0].id})`, {
      method: 'PATCH',
      headers: { 'If-Match': '*' },
      body: payload
    });
    return { action: 'updated', parent, dimension, dimensionValue };
  }

  await bcApi(api, 'defaultDimensions', { method: 'POST', body: payload });
  return { action: 'created', parent, dimension, dimensionValue };
}

async function readDefaultDimensions(api: BcApiContext, target: DefaultDimensionTarget) {
  const [parent] = await findApiRecords(api, target.parentEndpoint, `${target.parentNumberField} eq '${target.parentNumber}'`);
  return findApiRecords(api, 'defaultDimensions', `parentType eq '${target.parentType}' and parentId eq ${parent.id}`);
}

async function openCardAndCapture(page: Page, pageId: string, tableName: string, number: string, fileName: string, evidenceFile: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', pageId);
  url.searchParams.set('filter', `'${tableName}'.'No.' IS '${number}'`);

  await page.goto('about:blank');
  await page.goto(url.toString());
  await expect.poll(() => pageText(page), { timeout: 120_000 }).toMatch(new RegExp(number, 'i'));
  await dismissTours(page);
  await page.waitForTimeout(2000);
  await screenshot(page, fileName);
  await writeEvidenceText(evidenceFile, await pageText(page));
}

test('MASTERDATA-007 Standarddimensionen fuer O2C setzen', async ({ page }) => {
  test.setTimeout(300_000);

  const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/masterdata-007');
  await fs.mkdir(evidenceDir, { recursive: true });

  const api = await getApiContext(page);
  const targets: DefaultDimensionTarget[] = [
    {
      parentType: 'Item',
      parentEndpoint: 'items',
      parentNumberField: 'number',
      parentNumber: 'RM-M100',
      dimensionCode: 'PRODUCTLINE',
      dimensionValueCode: 'MACHINE',
      postingValidation: 'Same_x0020_Code'
    },
    {
      parentType: 'Customer',
      parentEndpoint: 'customers',
      parentNumberField: 'number',
      parentNumber: 'D10000',
      dimensionCode: 'CHANNEL',
      dimensionValueCode: 'B2B',
      postingValidation: 'Same_x0020_Code'
    }
  ];

  const setupResults = [];
  for (const target of targets) {
    setupResults.push({ target, result: await ensureDefaultDimension(api, target) });
  }

  const finalDimensions = [];
  for (const target of targets) {
    finalDimensions.push({ target, records: await readDefaultDimensions(api, target) });
  }

  await writeEvidenceText(
    path.join(evidenceDir, 'api-result.json'),
    JSON.stringify({ company: api.company, setupResults, finalDimensions }, null, 2)
  );

  await writeEvidenceText(
    path.join(evidenceDir, 'default-dimensions-summary.txt'),
    finalDimensions
      .flatMap(({ target, records }) =>
        records.map(
          (record) =>
            `${target.parentType} ${target.parentNumber}: ${record.dimensionCode}=${record.dimensionValueCode}, postingValidation=${record.postingValidation}`
        )
      )
      .join('\n')
  );

  await openCardAndCapture(
    page,
    '30',
    'Item',
    'RM-M100',
    'masterdata-007-item-rm-m100-standarddimension.png',
    path.join(evidenceDir, 'item-rm-m100-card.txt')
  );

  await openCardAndCapture(
    page,
    '21',
    'Customer',
    'D10000',
    'masterdata-007-customer-d10000-standarddimension.png',
    path.join(evidenceDir, 'customer-d10000-card.txt')
  );

  const flattened = JSON.stringify(finalDimensions);
  expect(flattened).toContain('"dimensionCode":"PRODUCTLINE"');
  expect(flattened).toContain('"dimensionValueCode":"MACHINE"');
  expect(flattened).toContain('"dimensionCode":"CHANNEL"');
  expect(flattened).toContain('"dimensionValueCode":"B2B"');
  expect(flattened).toContain('"postingValidation":"Same_x0020_Code"');
});
