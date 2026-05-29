import { expect, test } from '@playwright/test';
import 'dotenv/config';
import { openSearchResult, pageText, requireBcUrl, screenshot, searchFor, waitForBusinessCentralShell } from './bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

const pages = [
  {
    id: 'customers',
    search: 'Customers',
    result: /^Customers$/i,
    expected: /Customers|Debitoren|Name|Balance/i
  },
  {
    id: 'vendors',
    search: 'Vendors',
    result: /^Vendors$/i,
    expected: /Vendors|Kreditoren|Name|Balance/i
  },
  {
    id: 'items',
    search: 'Items',
    result: /^Items$/i,
    expected: /Items|Artikel|Description|Inventory/i
  },
  {
    id: 'sales-orders',
    search: 'Sales Orders',
    result: /^Sales Orders$/i,
    expected: /Sales Orders|Verkaufsaufträge|Sell-to|Customer/i
  },
  {
    id: 'purchase-orders',
    search: 'Purchase Orders',
    result: /^Purchase Orders$/i,
    expected: /Purchase Orders|Einkaufsbestellungen|Buy-from|Vendor/i
  },
  {
    id: 'chart-of-accounts',
    search: 'Chart of Accounts',
    result: /^Chart of Accounts$/i,
    expected: /Chart of Accounts|Kontenplan|No\.|Name|Balance/i
  }
];

for (const bcPage of pages) {
  test(`BC-Seite öffnen: ${bcPage.search}`, async ({ page }) => {
    await page.goto(requireBcUrl());
    await waitForBusinessCentralShell(page);

    await searchFor(page, bcPage.search);
    await openSearchResult(page, bcPage.result);
    await screenshot(page, `smoke-bc-${bcPage.id}.png`);

    await expect.poll(async () => pageText(page), { timeout: 15_000 }).toMatch(bcPage.expected);
  });
}
