import { expect, test } from '@playwright/test';
import 'dotenv/config';
import {
  findFrameText,
  openSearchResult,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell
} from './bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

test('FOUNDATION-001 Company RM-DEMO aus CRONUS kopieren oder prüfen', async ({ page }) => {
  test.setTimeout(12 * 60_000);

  await page.goto(requireBcUrl());
  await waitForBusinessCentralShell(page);

  await searchFor(page, 'Companies');
  await openSearchResult(page, /^Companies$/i);
  await screenshot(page, 'foundation-001-010-companies-vorbereitung.png');

  const companiesBefore = await findFrameText(page, /Companies/);
  if (/RM-DEMO/.test(companiesBefore.bodyText)) {
    await screenshot(page, 'foundation-001-030-rm-demo-besteht.png');
    return;
  }

  await companiesBefore.frame.getByText('CRONUS USA, Inc.').first().click();
  await companiesBefore.frame.getByText(/^Copy$/i).first().click();
  await page.waitForTimeout(2000);
  await screenshot(page, 'foundation-001-020-copy-company-dialog.png');

  await page.keyboard.type('RM-DEMO');
  await page.waitForTimeout(500);

  // Business Central exposes this toggle inconsistently through ARIA in the dialog.
  // With a fixed screenshot viewport, the coordinate is more reliable for this specific control.
  await page.mouse.click(724, 542);
  await page.waitForTimeout(500);
  await screenshot(page, 'foundation-001-025-copy-company-bestaetigung.png');

  await page.mouse.click(836, 765);

  await expect.poll(
    async () => {
      await page.waitForTimeout(5000);
      const { bodyText } = await findFrameText(page, /Companies|Copy Company|RM-DEMO/);
      return bodyText;
    },
    { timeout: 10 * 60_000 }
  ).toMatch(/RM-DEMO/);

  await screenshot(page, 'foundation-001-030-rm-demo-angelegt.png');
});
