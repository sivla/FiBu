import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { classifyPurchaseInvoiceFieldMappingText } from '../../../core/bc/purchase-invoice-guards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const testId = 'fixedassets-059';
const sourceEvidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/fixedassets-058');

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

async function readSourceEvidence(fileName: string) {
  return fs.readFile(path.join(sourceEvidenceDir, fileName), 'utf8');
}

function renderMarkdown(result: unknown) {
  return [
    '# FIXEDASSETS-059 Purchase-Invoice-Helper-Refinement',
    '',
    'Status: `labor`, `no-bc-run`, `playwright-helper`, `no-preview`, `no-posting`, `not-final`',
    '',
    '## Ziel',
    '',
    'Der 058-Lauf wird nicht wiederholt. Stattdessen wird die vorhandene Evidence genutzt, um den Guard genauer zu machen: Ein Listen-/Inline-Zeilenkontext nach `Neu` ist ein eigener Blocker und kein stabiler Belegkartenbeweis.',
    '',
    '## Befund',
    '',
    '- Der 058-Text nach `Neu` zeigt `Purchase Invoices`, `Buy-from Vendor No.`, `Vendor Invoice No.`, `Type` und weitere Listen-/Zeilensignale.',
    '- Der Text zeigt keinen Zielkreditor `K30000`, keine Zielanlage `FA-CNC-01` und keinen sichtbaren Zeilentyp `Fixed Asset`.',
    '- Der neue Guard-Status lautet deshalb `blocked-list-or-inline-row-context`.',
    '',
    '## Neue Playwright-Regel',
    '',
    'Nach `Neu` darf ein Test Zielwerte erst eingeben, wenn ein stabiler `Purchase Invoice`-Card-Kontext und der Lines-/Gridbereich nachgewiesen sind. Listen- oder Inline-Zeilensignale reichen nicht.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 bekommt noch kein Anlagenkauf-Bild. Das Debugging-/Nachweiskapitel kann aber klarer erklaeren, warum ein Buttonklick kein fachlicher Zielzustand ist.',
    '',
    '## Naechster Schritt',
    '',
    '`FIXEDASSETS-060-PURCHASE-INVOICE-CARD-CONTEXT-PREFLIGHT-NO-TARGET-ENTRY`: UI-first nur den Card-/Lines-Kontext nach `Neu` beweisen und wieder sauber verlassen; weiterhin keine Zielwerte, keine Preview und keine Buchung.',
    '',
    '## Maschinenlesbares Ergebnis',
    '',
    '```json',
    JSON.stringify(result, null, 2),
    '```',
    '',
  ].join('\n');
}

test('refines Purchase Invoice guard with FIXEDASSETS-058 after-New text', async () => {
  const afterNewText = await readSourceEvidence('030-after-new-focused-text.txt');
  const classification = classifyPurchaseInvoiceFieldMappingText(afterNewText);

  expect(classification.success).toBe(false);
  expect(classification.status).toBe('blocked-list-or-inline-row-context');
  expect(classification.visibleSignals.purchaseInvoiceListOrInlineRow).toBe(true);
  expect(classification.stopReasons.length).toBeGreaterThan(0);

  const result = {
    caseId: 'FIXEDASSETS-059-PURCHASE-INVOICE-FIELD-MAPPING-HELPER-REFINEMENT-OR-MANUAL-PATH',
    generatedAt: new Date().toISOString(),
    environment: 'MCP_1_20260210',
    company: 'RM-DEMO',
    sourceEvidence: [
      'playwright/projects/fibu-book5/evidence/fixedassets-058/030-after-new-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-058/FIXEDASSETS-058-result.json',
    ],
    workType: 'playwright-helper-and-evidence-no-bc-run',
    bcRun: false,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    documentsCreated: false,
    classification,
    proves: [
      'FIXEDASSETS-058 after-New text is now classified as blocked-list-or-inline-row-context.',
      'Purchase Invoices list or inline-row context is not a stable Purchase Invoice card/lines proof.',
      'The guard can stop before target value entry with a more specific reason than unknown-context.',
    ],
    doesNotProve: [
      'No active Purchase Invoice Card context.',
      'No K30000 header entry.',
      'No FA-CNC-01 fixed asset line.',
      'No Preview Posting.',
      'No fixed asset acquisition.',
      'No German final proof.',
    ],
    nextStep: 'FIXEDASSETS-060-PURCHASE-INVOICE-CARD-CONTEXT-PREFLIGHT-NO-TARGET-ENTRY',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('010-after-new-list-context-classification.json'), classification);
  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-059-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-059-PURCHASE-INVOICE-FIELD-MAPPING-HELPER-REFINEMENT.md'),
    renderMarkdown(result),
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-059 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-059-result.json` | JSON | Helper-Refinement, neue Guard-Wahrheit, naechster sicherer Schritt | keinen neuen BC-Zustand, keinen Anlagenkauf | `labor`, `no-bc-run`, `no-posting` |',
      '| `010-after-new-list-context-classification.json` | JSON | `blocked-list-or-inline-row-context` fuer 058-Text nach `Neu` | keinen Card-/Lines-Beweis | `playwright-guard` |',
      '| `FIXEDASSETS-059-PURCHASE-INVOICE-FIELD-MAPPING-HELPER-REFINEMENT.md` | Markdown | Lernbefund, Buchwirkung und naechstes Gate | keine Preview-/Buchungsfreigabe | `not-final` |',
      '',
      'Aktuelle Wahrheit: Der naechste praktische Lauf darf nur den Card-/Lines-Kontext nach `Neu` nachweisen, noch keine Zielwerte eingeben.',
      '',
    ].join('\n'),
  );
});
