import { expect, test } from '@playwright/test';
import 'dotenv/config';
import path from 'node:path';
import { hideFactBoxPane, pageText, requireBcUrl, screenshot, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

const testId = 'masterdata-008';
const target = {
  locationCode: 'FRA-ZL',
  inventoryPostingGroupCode: 'RESALE'
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

function diagnosisEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function extractRelevantLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => /Inventory Posting Setup|Location Code|Invt\. Posting Group|Inventory Account|FRA-ZL|RESALE|Error Messages/i.test(line));
}

test('MASTERDATA-008 Inventory Posting Setup fuer FRA-ZL und RESALE diagnostizieren', async ({ page }) => {
  await page.goto(inventoryPostingSetupUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3000);

  const factBoxHidden = await hideFactBoxPane(page);
  await page.waitForTimeout(1000);

  const text = await pageText(page);
  const relevantLines = extractRelevantLines(text);
  const actionNames = await visibleButtonNames(page);
  const targetCombinationVisible = new RegExp(target.locationCode, 'i').test(text) && new RegExp(target.inventoryPostingGroupCode, 'i').test(text);
  const inventoryAccountMentioned = /Inventory Account/i.test(text);
  const diagnosis =
    targetCombinationVisible && inventoryAccountMentioned
      ? 'target-row-or-filter-visible-check-in-screenshot'
      : targetCombinationVisible
        ? 'target-row-visible-but-inventory-account-not-visible-in-page-text'
        : 'target-row-not-visible-after-filter';

  await screenshot(page, 'masterdata-008-inventory-posting-setup-fra-zl-resale.png', {
    projectName: project.name,
    testId,
    status: 'labor',
    purpose: 'Diagnose der Inventory-Posting-Setup-Kombination, die Preview Posting fuer UAT-O2C-001 blockiert.',
    expectedPageText: [/Inventory Posting Setup|Lagerbuchungsmatrix|Location Code|Inventory Posting Group|Invt\. Posting Group/i],
    knownLimitations: [
      'CRONUS-USA-Laborbefund; noch keine fachliche Kontenentscheidung.',
      'Dieses Bild diagnostiziert die Setup-Luecke, setzt aber kein Bestandskonto.'
    ],
    bookUse: 'evidence'
  });

  await writeTextEvidence(diagnosisEvidencePath('010-inventory-posting-setup-page-text.txt'), text);
  await writeTextEvidence(diagnosisEvidencePath('011-relevant-lines.txt'), relevantLines.join('\n'));
  await writeTextEvidence(diagnosisEvidencePath('012-visible-actions.txt'), actionNames.join('\n'));
  await writeJsonEvidence(diagnosisEvidencePath('013-diagnosis.json'), {
    target,
    pageId: 5826,
    factBoxHidden,
    targetCombinationVisible,
    inventoryAccountMentioned,
    diagnosis,
    sourceErrorFromO2C:
      'Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.',
    decision:
      'Nur Diagnose. Kein Konto automatisch setzen, weil die Kontenentscheidung fachlich zum Inventory Posting Setup gehoert.'
  });
  await writeTextEvidence(
    diagnosisEvidencePath('014-learning-note.md'),
    [
      '# MASTERDATA-008 Inventory Posting Setup Lernbefund',
      '',
      '| Punkt | Befund |',
      '|---|---|',
      `| Zielkombination | Location Code ${target.locationCode}, Invt. Posting Group Code ${target.inventoryPostingGroupCode} |`,
      '| Situation | `UAT-O2C-001` erreicht Preview Posting, stoppt aber auf `Error Messages`. |',
      '| Symptom | `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` |',
      '| Warum BC so reagiert | Beim Buchen einer Artikelbewegung braucht BC nicht nur Debitor, Artikel und Preis, sondern auch eine Kontenfindung fuer Bestand. Diese kommt aus Inventory Posting Setup. |',
      '| Laborstatus | Diagnose ausgefuehrt; Konto wurde bewusst nicht automatisch gesetzt. |',
      '| Buchwirkung | Die Anleitung muss erklaeren, dass Lagerort und Lagerbuchungsgruppe buchungsrelevant sind. Preview Posting ist der sichere Ort, diese Luecke vor einer echten Buchung zu erkennen. |',
      '',
      '## Pruefung nach Korrektur',
      '',
      'Nach einer fachlich freigegebenen Kontenentscheidung erneut `npm run fibu:uat:o2c` ausfuehren. Erwartung: `Preview Posting` zeigt dann Postenvorschau oder den naechsten echten Setup-Fehler.',
      ''
    ].join('\n')
  );

  expect(text).toMatch(/Inventory Posting Setup|Lagerbuchungsmatrix|Location Code|Inventory Posting Group|Invt\. Posting Group/i);
});
