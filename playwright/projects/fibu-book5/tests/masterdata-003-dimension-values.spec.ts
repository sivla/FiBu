import { expect, test, type Frame, type Page } from '@playwright/test';
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

type DimensionBuildData = {
  minimumForO2C: Array<{
    code: string;
    name: string;
    values?: Array<{
      code: string;
      name: string;
    }>;
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
  await page.goto('about:blank');
  await page.goto(bcPageUrl(536, project.envPrefix));
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2000);
  return findFrameText(page, /Dimensions:/i);
}

async function openDimensionValues(page: Page, dimensionCode: string, dimensionName: string) {
  let { frame } = await openDimensions(page);
  await frame
    .getByRole('textbox', {
      name: new RegExp(`^Code, Sortierreihenfolge Aufsteigend ${dimensionCode}$`, 'i')
    })
    .first()
    .click();
  await page.waitForTimeout(500);
  await frame.getByRole('menuitem', { name: /^Dimension$/i }).first().click();
  await page.waitForTimeout(500);

  ({ frame } = await findFrameText(page, /Dimension Values/i));
  await frame.getByText(/^Dimension Values$/i).first().click();
  await page.waitForTimeout(3000);

  const valueFrame = (await findFrameText(page, new RegExp(`${dimensionCode}[\\s\\S]*${dimensionName}`, 'i'))).frame;
  const valueForm = valueFrame.getByRole('form', { name: /^Dimension Values$/i }).first();
  await expect(valueForm).toBeVisible({ timeout: 10_000 });
  return { frame: valueFrame, form: valueForm };
}

async function visibleGridValues(form: ReturnType<Frame['getByRole']>) {
  return form.locator('input[role="textbox"], span[role="textbox"]').evaluateAll((elements) =>
    elements
      .map((element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          return element.value;
        }

        return element.textContent ?? element.getAttribute('title') ?? element.getAttribute('aria-label') ?? '';
      })
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

async function ensureDimensionValue(page: Page, dimensionCode: string, dimensionName: string, valueCode: string, valueName: string) {
  let { form } = await openDimensionValues(page, dimensionCode, dimensionName);
  let values = await visibleGridValues(form);
  if (values.includes(valueCode)) {
    return 'already-exists';
  }

  const newRow = form.getByRole('row').last();
  await newRow.getByRole('textbox').nth(0).click({ force: true });
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(valueCode);
  await page.keyboard.press('Tab');
  await page.keyboard.insertText(valueName);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(5000);

  ({ form } = await openDimensionValues(page, dimensionCode, dimensionName));
  values = await visibleGridValues(form);
  await expect(values).toContain(valueCode);
  await expect(values).toContain(valueName);
  return 'created';
}

test('MASTERDATA-003 Rhein-Main-Dimensionswerte anlegen', async ({ page }) => {
  test.setTimeout(420_000);

  const data = await loadData();
  const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/masterdata-003');
  const results: string[] = [];

  for (const dimension of data.minimumForO2C) {
    for (const value of dimension.values ?? []) {
      const result = await ensureDimensionValue(page, dimension.code, dimension.name, value.code, value.name);
      results.push(`${dimension.code}.${value.code}: ${result}`);
    }
  }

  const valuesEvidence: string[] = [];
  for (const dimension of data.minimumForO2C) {
    const { form } = await openDimensionValues(page, dimension.code, dimension.name);
    const values = await visibleGridValues(form);
    valuesEvidence.push(`${dimension.code}: ${values.join(' | ')}`);
  }

  await screenshot(page, 'masterdata-003-dimension-values-rhein-main.png');
  await writeEvidenceText(path.join(evidenceDir, 'result.txt'), results.join('\n'));
  await writeEvidenceText(path.join(evidenceDir, 'dimension-values.txt'), valuesEvidence.join('\n'));
  await writeEvidenceText(path.join(evidenceDir, 'last-page.txt'), await pageText(page));
});
