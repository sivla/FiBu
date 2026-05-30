import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import 'dotenv/config';
import {
  findFrameText,
  openSecondSearchBlockResult,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

type RmDemoData = {
  companyQueryName: string;
  companyInformation: {
    name: string;
    address: string;
    address2: string;
    city: string;
    state: string;
    zipCode: string;
    countryRegionCode: string;
    contactName: string;
    phoneNo: string;
  };
};

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

async function loadData(): Promise<RmDemoData> {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/foundation/rm-demo-company.json', 'utf8');
  return JSON.parse(raw) as RmDemoData;
}

test('FOUNDATION-002 Unternehmensdaten in RM-DEMO setzen', async ({ page }) => {
  const data = await loadData();
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', data.companyQueryName);

  await page.goto(url.toString());
  await waitForBusinessCentralShell(page);
  await screenshot(page, 'foundation-002-010-rm-demo-rollencenter.png');

  await searchFor(page, 'Company Information');
  await openSecondSearchBlockResult(page);
  await screenshot(page, 'foundation-002-020-company-information-vorher.png');

  const { frame } = await findFrameText(page, /Company Information/);
  const textInputs = frame.locator('input[type="text"], input[type="tel"], input[type="email"], input[type="url"]');

  await textInputs.nth(0).fill(data.companyInformation.name);
  await textInputs.nth(1).fill(data.companyInformation.address);
  await textInputs.nth(2).fill(data.companyInformation.address2);
  await textInputs.nth(7).fill(data.companyInformation.countryRegionCode);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1000);
  await textInputs.nth(3).fill(data.companyInformation.city);
  await page.mouse.click(470, 449);
  await page.keyboard.press('Control+A');
  await page.keyboard.type(data.companyInformation.zipCode);
  await textInputs.nth(8).fill(data.companyInformation.contactName);
  await textInputs.nth(9).fill(data.companyInformation.phoneNo);
  if (await textInputs.count() > 14) {
    await textInputs.nth(14).fill('');
  }
  await page.keyboard.press('Tab');

  await expect.poll(async () => {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    return text;
  }, { timeout: 30_000 }).toMatch(/Gespeichert|Saved/i);

  await page.waitForTimeout(5000);
  await screenshot(page, 'foundation-002-030-company-information-nachher.png');
});
