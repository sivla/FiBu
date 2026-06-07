import { expect, type Frame, test } from '@playwright/test';
import 'dotenv/config';
import { pageText, requireBcUrl, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

const testId = 'masterdata-009';
const target = {
  locationCode: 'FRA-ZL',
  inventoryPostingGroupCode: 'RESALE',
  inventoryAccount: '14140'
};

function inventoryPostingSetupUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '5826');
  url.searchParams.set(
    'filter',
    `'Inventory Posting Setup'.'Location Code' IS '${target.locationCode}' AND 'Inventory Posting Setup'.'Invt. Posting Group Code' IS '${target.inventoryPostingGroupCode}'`
  );
  return url.toString();
}

function setupFitEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

async function findInventoryPostingFrame(pageTextFrameSource: { frames(): Frame[] }) {
  for (const frame of pageTextFrameSource.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1500 }).catch(() => '');
    if (/Inventory Posting Setup|Lagerbuchungsmatrix/i.test(text) && /FRA-ZL|RESALE/i.test(text)) {
      return frame;
    }
  }
  throw new Error('Inventory Posting Setup frame fuer FRA-ZL/RESALE nicht gefunden.');
}

async function ensureEditMode(frame: Frame) {
  const editInputs = frame.locator('input.cursorinherit.stringcontrol-edit');
  if ((await editInputs.count()) >= 4) {
    return;
  }
  await frame.getByText(/Liste bearbeiten|Edit List/i).first().click();
  await expect.poll(async () => editInputs.count(), { timeout: 20_000 }).toBeGreaterThanOrEqual(4);
}

async function readVisibleEditValues(frame: Frame) {
  return frame.locator('input.cursorinherit.stringcontrol-edit').evaluateAll((inputs: HTMLInputElement[]) =>
    inputs
      .slice(0, 8)
      .map((input, index) => ({ index, value: input.value, ariaLabel: input.getAttribute('aria-label') ?? '' }))
  );
}

test('MASTERDATA-009 Inventory Posting Setup fuer O2C-Laborfit setzen', async ({ page }) => {
  await page.goto(inventoryPostingSetupUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(4000);

  const frame = await findInventoryPostingFrame(page);
  await ensureEditMode(frame);

  const beforeValues = await readVisibleEditValues(frame);
  const inventoryAccountInput = frame.locator('input.cursorinherit.stringcontrol-edit').nth(3);
  const beforeInventoryAccount = await inventoryAccountInput.inputValue();
  let action: 'already-fit' | 'set-lab-account' = 'already-fit';

  if (beforeInventoryAccount !== target.inventoryAccount) {
    action = 'set-lab-account';
    await inventoryAccountInput.fill(target.inventoryAccount);
    await inventoryAccountInput.press('Tab');
    await page.waitForTimeout(3000);
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(4000);

  const afterText = await pageText(page);
  const afterFrame = await findInventoryPostingFrame(page);
  const afterValues = await readVisibleEditValues(afterFrame).catch(() => []);
  const hasTargetSetup =
    new RegExp(target.locationCode, 'i').test(afterText) &&
    new RegExp(target.inventoryPostingGroupCode, 'i').test(afterText) &&
    new RegExp(target.inventoryAccount, 'i').test(afterText);

  await screenshot(page, 'masterdata-009-inventory-posting-setup-fra-zl-resale-14140.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    purpose: 'Labor-Setup-Fit: Inventory Account 14140 fuer FRA-ZL + RESALE setzen oder bestaetigen.',
    expectedPageText: [/Inventory Posting Setup/i, /FRA-ZL/i, /RESALE/i, /14140/i],
    knownLimitations: [
      'CRONUS-USA-Laborfix auf Basis vorhandener RESALE-Zeilen aus MASTERDATA-001.',
      'Kein finaler deutscher Kontenplan- oder USt-Nachweis.',
      'O2C-Preview Posting muss danach separat erneut geprueft werden.'
    ],
    bookUse: 'evidence'
  });

  await writeJsonEvidence(setupFitEvidencePath('010-inventory-posting-setup-fit.json'), {
    project: project.name,
    testId: 'MASTERDATA-009',
    environment: {
      sandbox: 'MCP_1_20260210',
      company: 'Rhein-Main Demo GmbH',
      baseData: 'CRONUS USA',
      uiLanguage: 'mixed German/English'
    },
    evidenceStatus: 'labor',
    target,
    sourceForAccountDecision:
      'MASTERDATA-001 inventory-posting-setup evidence shows existing CRONUS RESALE rows with Inventory Account 14140 for blank/default and multiple locations.',
    action,
    beforeInventoryAccount: beforeInventoryAccount || '(empty)',
    afterTextContainsTargetSetup: hasTargetSetup,
    beforeValues,
    afterValues,
    limitations: [
      'Laborfix, not German final chart-of-accounts decision.',
      'Does not solve CRONUS Sales Tax / German 19 percent VAT gap.',
      'Does not prove posting entries; UAT-O2C-001 Preview Posting must run after this setup fit.'
    ],
    nextStep: 'Run npm run fibu:uat:o2c and check whether Preview Posting now reaches entries or the next setup error.'
  });

  await writeTextEvidence(
    setupFitEvidencePath('011-learning-note.md'),
    [
      '# MASTERDATA-009 Inventory Posting Setup Fit',
      '',
      '| Punkt | Befund |',
      '|---|---|',
      '| Status | Labor-Fix in CRONUS-USA-Spielwiese |',
      '| Ziel | `FRA-ZL` + `RESALE` braucht ein `Inventory Account`, damit O2C Preview Posting nicht an dieser Stelle stoppt. |',
      '| Kontoentscheidung | `14140`, weil vorhandene CRONUS-RESALE-Zeilen dieses Inventory Account verwenden. |',
      `| Aktion | ${action === 'set-lab-account' ? 'Inventory Account wurde gesetzt.' : 'Inventory Account war bereits passend gesetzt.'} |`,
      '| Was ist damit geloest? | Die konkrete Inventory-Posting-Setup-Luecke fuer `FRA-ZL` + `RESALE` ist im Labor geschlossen. |',
      '| Was ist nicht geloest? | Deutsche 19-%-USt, finaler deutscher Kontenplan, echte Postenvorschau und Buchung/Postenspur. |',
      '| Anfaenger-Pruefung | Nach dem Fix muss die Zeile `FRA-ZL` + `RESALE` sichtbar `14140` zeigen. Danach wird die Buchungsvorschau erneut ausgefuehrt. |',
      '',
      '## Naechster praktischer Schritt',
      '',
      '`npm run fibu:uat:o2c` erneut ausfuehren. Erwartung: Die bisherige Meldung `Inventory Account is missing... FRA-ZL, RESALE` erscheint nicht mehr. Wenn ein neuer Fehler erscheint, wird er als naechster Lernfall dokumentiert.',
      ''
    ].join('\n')
  );

  expect(hasTargetSetup).toBe(true);
});
