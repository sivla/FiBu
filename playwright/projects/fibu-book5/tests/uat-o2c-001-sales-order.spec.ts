import { expect, test } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  clickButtonInAnyFrame,
  openSearchResult,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

type O2CTestData = {
  customerNo: string;
  itemNo: string;
  quantity: number;
  unitPrice: number;
  expectedGrossAmount: number;
  locationCode: string;
  dimensions: Record<string, string>;
};

async function loadTestData() {
  const filePath = path.resolve('playwright/projects/fibu-book5/testdata/sales/uat-o2c-001.json');
  return JSON.parse(await fs.readFile(filePath, 'utf8')) as O2CTestData;
}

test('UAT-O2C-001 Verkaufsauftrag starten und Lern-Screenshots erzeugen', async ({ page }) => {
  const data = await loadTestData();

  await page.goto(requireBcUrl(project.envPrefix));
  await waitForBusinessCentralShell(page);

  await searchFor(page, 'Sales Orders');
  await screenshot(page, 'uat-o2c-001-010-suche-verkaufsauftraege.png');

  await openSearchResult(page, /^Sales Orders$/i);
  await screenshot(page, 'uat-o2c-001-020-liste-verkaufsauftraege.png');

  await expect.poll(async () => pageText(page), { timeout: 20_000 }).toMatch(/Sales Orders|Verkaufsauftr/i);

  await clickButtonInAnyFrame(page, /New|Neu/i);
  await page.waitForTimeout(6000);
  await screenshot(page, 'uat-o2c-001-030-neuer-verkaufsauftrag.png');

  const text = await pageText(page);
  await fs.mkdir(path.resolve('playwright/projects/fibu-book5/evidence/uat-o2c-001'), { recursive: true });
  await fs.writeFile(
    path.resolve('playwright/projects/fibu-book5/evidence/uat-o2c-001/030-neuer-verkaufsauftrag-page-text.txt'),
    text,
    'utf8'
  );

  await expect(text).toMatch(/Sales Order|Verkaufsauftrag|Customer|Debitor|Sell-to/i);
  await expect(JSON.stringify(data)).toContain('D10000');
});
