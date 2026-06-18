import fs from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { classifyPurchaseInvoiceFieldMappingText } from '../../../core/bc/purchase-invoice-guards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const testId = 'fixedassets-056';
const previousEvidenceDir = path.resolve('playwright/projects/fibu-book5/evidence/fixedassets-055');

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

async function readPreviousEvidence(fileName: string) {
  return fs.readFile(path.join(previousEvidenceDir, fileName), 'utf8');
}

function renderMarkdown(result: unknown) {
  return [
    '# FIXEDASSETS-056 Purchase-Invoice-Feldmapping-Blocker-Diagnose',
    '',
    'Status: `labor`, `no-bc-run`, `playwright-guard`, `no-posting`, `not-final`',
    '',
    '## Ziel',
    '',
    'Der abgelehnte Lauf `FIXEDASSETS-055` wird nicht wiederholt. Stattdessen wird aus der vorhandenen Evidence eine harte Stop-Regel abgeleitet: Ein sichtbarer Code `FA-CNC-01` ist nur dann ein Erfolg, wenn gleichzeitig der richtige Einkaufsrechnungs-Zeilenkontext und der Zeilentyp `Fixed Asset` sichtbar sind.',
    '',
    '## Befund',
    '',
    '- Der Kopf-/Header-Text aus `FIXEDASSETS-055` enthaelt einen Vendor-Registrierungsdialog (`Create a new vendor card ...`).',
    '- Der Zielwert-Text enthaelt `Vendor Card - V00040 - FA-CNC-01`.',
    '- Damit ist `FA-CNC-01` gerade kein Anlagenzeilenbeweis, sondern ein falscher Stammdaten-/Lookup-Kontext.',
    '',
    '## Neue Playwright-Regel',
    '',
    '- Nach jedem Kopf- oder Zeilenfeldschritt muss der Test pruefen, ob weiter `Purchase Invoice` plus Zeilen/Grid-Kontext sichtbar ist.',
    '- `Vendor Card`, Vendor-Registrierungsdialoge und automatisch erzeugte Vendor-Nummern sind harte Stop-Kriterien.',
    '- `FA-CNC-01` zaehlt erst als Erfolg, wenn `Fixed Asset` als Zeilentyp und der Zielcode im Belegzeilenkontext sichtbar sind.',
    '',
    '## Buchwirkung',
    '',
    'Kapitel 21 darf `FIXEDASSETS-055` nicht als Anlagenkauf verwenden. Der Fall gehoert in die Debugging-/Screenshot-QA-Erklaerung: Anfaenger muessen lernen, dass Business Central bei falschem Feldfokus Stammdatenkarten oder Registrierungsdialoge oeffnen kann.',
    '',
    '## Naechster Schritt',
    '',
    '`FIXEDASSETS-057-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-GATE`: erst entscheiden, ob der neue Guard fuer einen erneuten UI-first Field-Mapping-Versuch reicht. Weiterhin keine Preview, kein Post, kein Zugang und keine AfA.',
    '',
    '## Maschinenlesbares Ergebnis',
    '',
    'Siehe `FIXEDASSETS-056-result.json` und `010-guard-classification.json`.',
    '',
    '```json',
    JSON.stringify(result, null, 2),
    '```',
    '',
  ].join('\n');
}

test('classifies FIXEDASSETS-055 as wrong-context blocker and writes reusable evidence', async () => {
  const headerText = await readPreviousEvidence('036-after-header-focused-text.txt');
  const lineText = await readPreviousEvidence('050-target-values-focused-text.txt');
  const headerClassification = classifyPurchaseInvoiceFieldMappingText(headerText);
  const lineClassification = classifyPurchaseInvoiceFieldMappingText(lineText);
  const combinedText = `${headerText}\n${lineText}`;
  const combinedClassification = classifyPurchaseInvoiceFieldMappingText(combinedText);

  expect(headerClassification.success).toBe(false);
  expect(headerClassification.status).toBe('blocked-vendor-registration-dialog');
  expect(lineClassification.success).toBe(false);
  expect(lineClassification.status).toBe('blocked-wrong-vendor-card-context');
  expect(combinedClassification.success).toBe(false);
  expect(combinedClassification.stopReasons.length).toBeGreaterThan(0);

  const result = {
    caseId: 'FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS',
    environment: 'MCP_1_20260210',
    company: 'RM-DEMO',
    sourceEvidence: [
      'playwright/projects/fibu-book5/evidence/fixedassets-055/036-after-header-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-055/050-target-values-focused-text.txt',
    ],
    workType: 'playwright-helper-and-evidence-no-bc-run',
    posted: false,
    bcRun: false,
    setupChanged: false,
    documentsCreated: false,
    classifications: {
      header: headerClassification,
      line: lineClassification,
      combined: combinedClassification,
    },
    decision: 'do-not-rerun-field-mapping-before-a-new-gate',
    stopCriteriaForNextUiRun: [
      'Vendor registration dialog visible',
      'Vendor Card visible',
      'Accidental vendor number visible',
      'FA-CNC-01 visible without Fixed Asset line type',
      'Purchase Invoice page no longer visible after a field action',
    ],
    successCriteriaForFutureRetry: [
      'Purchase Invoice page remains visible',
      'Lines/Grid context remains visible',
      'Vendor K30000 remains in the invoice header',
      'Line Type is visible as Fixed Asset',
      'No. / target field shows FA-CNC-01 in the invoice line, not in a Vendor Card',
    ],
    bookImpact:
      'Use FIXEDASSETS-055/056 as Debugging- und Screenshot-QA-Lernfall. Do not use the 055 target-value screenshots as Anlagenkauf evidence.',
    nextStep: 'FIXEDASSETS-057-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-RETRY-GATE',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('010-guard-classification.json'), result.classifications);
  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-056-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS.md'),
    renderMarkdown(result),
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-056 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-056-result.json` | JSON | Guard-Entscheidung gegen 055-Evidence, Stop- und Erfolgskriterien | keinen neuen BC-Zustand, keinen Anlagenkauf | `labor`, `no-bc-run`, `no-posting` |',
      '| `010-guard-classification.json` | JSON | maschinenlesbare Klassifizierung von Header-, Zeilen- und Kombitext | keine UI-Ausfuehrung | `playwright-guard` |',
      '| `FIXEDASSETS-056-PURCHASE-INVOICE-FIELD-MAPPING-BLOCKER-DIAGNOSIS.md` | Markdown | Lernfall, Buchwirkung und naechstes Gate | keine Buchungsfreigabe | `not-final` |',
      '',
    ].join('\n'),
  );
});
