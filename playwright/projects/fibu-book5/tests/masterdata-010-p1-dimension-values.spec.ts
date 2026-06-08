import { expect, test, type Frame, type Page } from '@playwright/test';
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

type DimensionValueTarget = {
  dimensionCode: string;
  dimensionName: string;
  valueCode: string;
  valueName: string;
  reason: string;
};

const testId = 'masterdata-010';
const targets: DimensionValueTarget[] = [
  {
    dimensionCode: 'DEPARTMENT',
    dimensionName: 'Department',
    valueCode: 'PURCH',
    valueName: 'Purchasing',
    reason: 'P2P braucht eine Einkaufsabteilungsachse.'
  },
  {
    dimensionCode: 'DEPARTMENT',
    dimensionName: 'Department',
    valueCode: 'WHSE',
    valueName: 'Warehouse',
    reason: 'Inventory/Warehouse braucht eine Lagerabteilungsachse.'
  },
  {
    dimensionCode: 'PRODUCTLINE',
    dimensionName: 'Product Line',
    valueCode: 'SPARE',
    valueName: 'Spare Parts',
    reason: 'Ersatzteil-, Inventory- und spaetere Servicefaelle brauchen eine Produktlinie.'
  },
  {
    dimensionCode: 'LOCATION-GROUP',
    dimensionName: 'Location Group',
    valueCode: 'SIMPLE',
    valueName: 'Simple Warehouse',
    reason: 'Der einfache Lagerort `MZ-EINFACH` braucht eine Lagerlogik-Achse.'
  }
];

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

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

async function ensureDimensionValue(page: Page, target: DimensionValueTarget) {
  let { form } = await openDimensionValues(page, target.dimensionCode, target.dimensionName);
  let values = await visibleGridValues(form);
  if (values.includes(target.valueCode)) {
    return { ...target, action: 'already-exists', valuesAfter: values };
  }

  const newRow = form.getByRole('row').last();
  await newRow.getByRole('textbox').nth(0).click({ force: true });
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(target.valueCode);
  await page.keyboard.press('Tab');
  await page.keyboard.insertText(target.valueName);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(5000);

  ({ form } = await openDimensionValues(page, target.dimensionCode, target.dimensionName));
  values = await visibleGridValues(form);
  await expect(values).toContain(target.valueCode);
  await expect(values).toContain(target.valueName);
  return { ...target, action: 'created', valuesAfter: values };
}

test('MASTERDATA-010 P1-Dimensionswerte fuer P2P und Inventory anlegen', async ({ page }) => {
  test.setTimeout(420_000);

  const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/masterdata-010');
  const results = [];
  for (const target of targets) {
    results.push(await ensureDimensionValue(page, target));
  }

  const valuesByDimension = [];
  for (const dimensionCode of [...new Set(targets.map((target) => target.dimensionCode))]) {
    const dimensionName = targets.find((target) => target.dimensionCode === dimensionCode)?.dimensionName ?? dimensionCode;
    const { form } = await openDimensionValues(page, dimensionCode, dimensionName);
    valuesByDimension.push({
      dimensionCode,
      values: await visibleGridValues(form)
    });
  }

  await openDimensionValues(page, 'LOCATION-GROUP', 'Location Group');
  await screenshot(page, 'masterdata-010-p1-location-group-simple.png', {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'field-proof',
    purpose: 'P1-Dimensionswert LOCATION-GROUP=SIMPLE als UI-Labornachweis fuer einfache Lagerlogik.',
    expectedPageText: [/LOCATION-GROUP/i, /SIMPLE/i],
    knownLimitations: [
      'Laborumgebung ist CRONUS USA und UI ist gemischt Deutsch/Englisch.',
      'Der Screenshot zeigt exemplarisch LOCATION-GROUP; weitere Werte stehen in JSON/Markdown-Evidence.',
      'Keine Pflichtdimensionslogik und keine Buchung in diesem Lauf.'
    ]
  });

  const result = {
    status: 'labor',
    sandbox: 'MCP_1_20260210',
    company: project.defaultCompany,
    purpose: 'P1-Dimensionswerte fuer P2P, Inventory und einfache Warehouse-Vorbereitung.',
    results,
    valuesByDimension,
    mandatoryDimensionLogicTested: false,
    postingDone: false,
    finalDeProof: false
  };

  await writeEvidenceText(path.join(evidenceDir, '010-p1-dimension-values-result.json'), JSON.stringify(result, null, 2));
  await writeEvidenceText(
    path.join(evidenceDir, '011-p1-dimension-values-summary.md'),
    [
      '# MASTERDATA-010: P1-Dimensionswerte fuer P2P und Inventory',
      '',
      '| Wert | Zweck | Ergebnis |',
      '|---|---|---|',
      ...results.map(
        (entry) => `| ${entry.dimensionCode}=${entry.valueCode} | ${entry.reason} | ${entry.action} |`
      ),
      '',
      '## Laborgrenze',
      '',
      'Dieser Lauf legt nur P1-Werte fuer die naechsten realistischen Prozesse an. Service-, Projekt-, Intercompany- und Mietwerte bleiben bewusst spaeter. Es wurde keine Pflichtdimensionslogik provoziert und keine Buchung ausgefuehrt.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 10 kann jetzt sauber unterscheiden: O2C-Kernwerte sind vorhanden, und die ersten P1-Erweiterungswerte fuer Einkauf/Lager sind ebenfalls vorbereitet. Die vollstaendige Buchmatrix ist weiterhin nicht komplett.'
    ].join('\n')
  );
  await writeEvidenceText(path.join(evidenceDir, '010-location-group-page-text.txt'), await pageText(page));
});
