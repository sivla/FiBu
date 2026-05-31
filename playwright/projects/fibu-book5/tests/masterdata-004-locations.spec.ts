import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import {
  bcPageUrl,
  findFrameText,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  writeEvidenceText
} from '../../../core/bc-helpers';
import { project } from '../project';

type LocationBuildData = {
  minimumForO2C: Array<{
    code: string;
    name: string;
    locationGroup: string;
    bookPurpose: string;
  }>;
};

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

async function loadData() {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/masterdata/locations.json', 'utf8');
  return JSON.parse(raw) as LocationBuildData;
}

async function openLocations(page: Page) {
  await page.goto('about:blank');
  await page.goto(bcPageUrl(15, project.envPrefix));
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2000);
  return findFrameText(page, /Locations:/i);
}

async function findLocation(page: Page, code: string) {
  const { bodyText } = await openLocations(page);
  return new RegExp(`\\b${code}\\b`, 'i').test(bodyText);
}

async function ensureLocation(page: Page, code: string, name: string) {
  if (await findLocation(page, code)) {
    return 'already-exists';
  }

  let { frame } = await findFrameText(page, /Locations:/i);
  await frame.getByText(/^(Neu|New)$/i).first().click();
  await page.waitForTimeout(3000);

  ({ frame } = await findFrameText(page, /Location Card/i));
  const locationCard = frame.getByRole('form', { name: /Location Card/i }).first();
  await expect(locationCard).toBeVisible({ timeout: 10_000 });

  const fields = locationCard.getByRole('textbox');
  await fields.nth(0).fill(code);
  await fields.nth(1).fill(name);
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(5000);

  await expect.poll(() => findLocation(page, code), { timeout: 60_000 }).toBeTruthy();
  return 'created';
}

test('MASTERDATA-004 Rhein-Main-Mindestlagerorte anlegen', async ({ page }) => {
  test.setTimeout(240_000);

  const data = await loadData();
  const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/masterdata-004');
  const results: string[] = [];

  for (const location of data.minimumForO2C) {
    const result = await ensureLocation(page, location.code, location.name);
    results.push(`${location.code}: ${result}; purpose=${location.bookPurpose}; locationGroup=${location.locationGroup}`);
  }

  await openLocations(page);
  await screenshot(page, 'masterdata-004-locations-rhein-main.png');
  const finalText = await pageText(page);
  await writeEvidenceText(path.join(evidenceDir, 'locations-after.txt'), finalText);
  await writeEvidenceText(path.join(evidenceDir, 'result.txt'), results.join('\n'));

  for (const location of data.minimumForO2C) {
    await expect(finalText).toMatch(new RegExp(`\\b${location.code}\\b`, 'i'));
  }
});
