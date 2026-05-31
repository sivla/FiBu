import { expect, test } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  bcPageUrl,
  pageText,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

const auditDir = path.resolve('playwright/projects/fibu-book5/evidence/masterdata-001');

const auditPages = [
  {
    id: 'customers',
    pageId: 22,
    expected: /Customers|Debitoren/i,
    rejectRoleCenterOnly: /Guten Morgen|Sales This Month/i
  },
  {
    id: 'items',
    pageId: 31,
    expected: /Items|Artikel/i,
    rejectRoleCenterOnly: /Guten Morgen|Sales This Month/i
  },
  {
    id: 'locations',
    pageId: 15,
    expected: /Locations|Lagerorte/i,
    rejectRoleCenterOnly: /Guten Morgen|Sales This Month/i
  },
  {
    id: 'dimensions',
    pageId: 536,
    expected: /Dimensions|Dimensionen/i,
    rejectRoleCenterOnly: /Guten Morgen|Sales This Month/i
  },
  {
    id: 'general-posting-setup',
    pageId: 314,
    expected: /General Posting Setup|Buchungsmatrix|Gen\. Bus\. Posting Group|Gen\. Prod\. Posting Group/i,
    rejectRoleCenterOnly: /Guten Morgen|Sales This Month/i
  },
  {
    id: 'vat-posting-setup',
    pageId: 472,
    expected: /VAT Posting Setup|USt|MwSt|VAT Bus\. Posting Group|VAT Prod\. Posting Group/i,
    rejectRoleCenterOnly: /Guten Morgen|Sales This Month/i
  },
  {
    id: 'inventory-posting-setup',
    pageId: 5826,
    expected: /Inventory Posting Setup|Lagerbuchungsmatrix|Location Code|Inventory Posting Group/i,
    rejectRoleCenterOnly: /Guten Morgen|Sales This Month/i
  }
];

test.describe('MASTERDATA-001 Projektfit Rhein-Main-Daten prüfen', () => {
  for (const auditPage of auditPages) {
    test(`MASTERDATA-001 Seite prüfen: ${auditPage.id}`, async ({ page }) => {
      await fs.mkdir(auditDir, { recursive: true });

      await page.goto(bcPageUrl(auditPage.pageId, project.envPrefix));
      await waitForBusinessCentralShell(page);
      await page.waitForTimeout(3000);
      await screenshot(page, `masterdata-001-${auditPage.id}.png`);

      const text = await pageText(page);
      await fs.writeFile(path.join(auditDir, `${auditPage.id}.txt`), text, 'utf8');

      const buttons = await visibleButtonNames(page);
      await fs.writeFile(path.join(auditDir, `${auditPage.id}-buttons.txt`), buttons.join('\n'), 'utf8');

      await expect(text).toMatch(auditPage.expected);
      await expect(text).not.toMatch(auditPage.rejectRoleCenterOnly);
    });
  }
});
