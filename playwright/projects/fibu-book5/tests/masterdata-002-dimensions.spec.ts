import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import {
  bcPageUrl,
  findFrameText,
  pageText,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell,
  writeEvidenceText
} from '../../../core/bc-helpers';
import { project } from '../project';

type DimensionBuildData = {
  minimumForO2C: Array<{
    code: string;
    name: string;
  }>;
};

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

async function loadData() {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/masterdata/dimensions.json', 'utf8');
  return JSON.parse(raw) as DimensionBuildData;
}

async function openDimensions(page: Page) {
  await page.goto(bcPageUrl(536, project.envPrefix));
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2000);
  return findFrameText(page, /Dimensions:/i);
}

async function confirmDeleteIfVisible(page: Page) {
  const buttonName = /^(Ja|Yes|OK|Löschen|Delete)$/i;
  await expect.poll(() => pageText(page), { timeout: 10_000 }).toMatch(/Fortfahren und löschen|Continue and delete/i);

  const pageButton = page.getByRole('button', { name: buttonName }).first();
  if (await pageButton.isVisible({ timeout: 1500 }).catch(() => false)) {
    await pageButton.click({ force: true });
    await page.waitForTimeout(3000);
    return;
  }

  for (const frame of page.frames()) {
    const frameButton = frame.getByRole('button', { name: buttonName }).first();
    if (await frameButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await frameButton.click({ force: true });
      await page.waitForTimeout(3000);
      return;
    }
  }

  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
}

async function deleteDimensionIfExists(page: Page, code: string) {
  const { frame } = await openDimensions(page);
  const codeCell = frame.getByRole('textbox', {
    name: new RegExp(`^Code, Sortierreihenfolge Aufsteigend ${code}$`, 'i')
  }).first();
  if ((await codeCell.count()) === 0 || !(await codeCell.isVisible({ timeout: 1000 }).catch(() => false))) {
    return 'not-found';
  }

  await codeCell.click();
  await page.waitForTimeout(500);
  await frame.getByRole('menuitem', { name: /^(Löschen|Delete)$/i }).first().click();
  await confirmDeleteIfVisible(page);
  await page.waitForTimeout(3000);

  const text = await pageText(page);
  await expect(text).not.toMatch(new RegExp(`\\b${code}\\b`, 'i'));
  return 'deleted';
}

async function ensureDimension(page: Page, code: string, name: string) {
  let { frame, bodyText } = await openDimensions(page);
  if (new RegExp(`\\b${code}\\b`, 'i').test(bodyText)) {
    return 'already-exists';
  }

  await frame.getByText(/^(Neu|New)$/i).first().click();
  await expect.poll(() => pageText(page), { timeout: 10_000 }).toMatch(/Neu - Dimensions|Liste mit Titel „Neu - Dimensions“/i);
  await page.waitForTimeout(1000);

  const currentFrame = (await findFrameText(page, /Neu - Dimensions|Dimensions:/i)).frame;
  const newDimensionForm = currentFrame.getByRole('form', { name: /Neu - Dimensions|New - Dimensions/i }).first();
  await expect(newDimensionForm).toBeVisible({ timeout: 10_000 });
  const newRow = newDimensionForm
    .getByRole('row', { name: /^Code, Sortierreihenfolge Aufsteigend Name Code Caption/i })
    .first();
  await newRow.getByRole('textbox').nth(0).click({ force: true });
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(code);
  await page.keyboard.press('Tab');
  await page.keyboard.insertText(name);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000);

  const text = await pageText(page);
  await expect(text).toMatch(new RegExp(`\\b${code}\\b`, 'i'));
  return 'created';
}

test('MASTERDATA-002 Rhein-Main-Mindestdimensionen anlegen', async ({ page }) => {
  const data = await loadData();
  const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/masterdata-002');
  const results: string[] = [];

  const cleanupResult = await deleteDimensionIfExists(page, 'LINE');
  results.push(`LINE: cleanup-${cleanupResult}`);

  for (const dimension of data.minimumForO2C) {
    const result = await ensureDimension(page, dimension.code, dimension.name);
    results.push(`${dimension.code}: ${result}`);
  }

  await page.goto(bcPageUrl(536, project.envPrefix));
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2000);
  await screenshot(page, 'masterdata-002-dimensions-rhein-main.png');

  const finalText = await pageText(page);
  const buttons = await visibleButtonNames(page);
  await writeEvidenceText(path.join(evidenceDir, 'dimensions-after.txt'), finalText);
  await writeEvidenceText(path.join(evidenceDir, 'dimensions-buttons.txt'), buttons.join('\n'));
  await writeEvidenceText(path.join(evidenceDir, 'result.txt'), results.join('\n'));

  const { bodyText } = await findFrameText(page, /Dimensions:/i);
  for (const dimension of data.minimumForO2C) {
    await expect(bodyText).toMatch(new RegExp(`\\b${dimension.code}\\b`, 'i'));
  }
});
