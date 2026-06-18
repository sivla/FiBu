import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const testId = 'fixedassets-063';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

async function readJson<T>(relativePath: string): Promise<T> {
  const content = await fs.readFile(path.resolve(relativePath), 'utf8');
  return JSON.parse(content) as T;
}

type FixedAssets062Result = {
  status: string;
  environment: string;
  company: string;
  lineMapping?: {
    clickType?: {
      clicked?: boolean;
      chosen?: {
        text?: string;
      };
    };
  };
  safety?: {
    clickedPreviewPosting?: boolean;
    clickedPost?: boolean;
    posted?: boolean;
    setupChanged?: boolean;
    apiShortcutUsed?: boolean;
    companySwitched?: boolean;
    acquisitionPosted?: boolean;
    depreciationPosted?: boolean;
  };
  nextStep?: string;
};

type CleanupResult = {
  status?: string;
  visibleAfter?: boolean;
  invoiceVisibleAfter?: boolean;
  vendorVisibleAfter?: boolean;
};

function renderMarkdown(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-063 - Purchase Invoice Line Type Strictness',
    '',
    'Status: `labor`, `no-bc-run`, `helper-strictness`, `no-preview`, `no-posting`, `not-final`',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Quell-Evidence | ${result.sourceEvidence.join(', ')} |`,
    `| Ergebnis | ${result.status} |`,
    `| Naechster Schritt | ${result.nextStep} |`,
    '',
    '## Entscheidung',
    '',
    result.decision,
    '',
    '## Strikte Regel fuer den naechsten UI-Lauf',
    '',
    '- `FA-CNC-01` darf erst eingegeben oder ausgewaehlt werden, wenn dieselbe sichtbare Einkaufsrechnungszeile `Type = Fixed Asset` zeigt.',
    '- Ein Klick auf den Default-Zeilentyp `Item` ist kein Nachweis, dass der Zeilentyp gewechselt wurde.',
    '- `Vendor Card`, Vendor-Registrierungsdialog, verlorener Purchase-Invoice-Kontext oder fehlender Zeilentyp sind harte Stop-Kriterien.',
    '- Ein Screenshot ist nur als Buchkandidat brauchbar, wenn Kopfwerte und Anlagenzeile gemeinsam sichtbar sind.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Beweist nicht',
    '',
    ...result.doesNotProve.map((entry: string) => `- ${entry}`),
    '',
  ].join('\n');
}

test('FIXEDASSETS-063 derives strict line-type gate from FIXEDASSETS-062 evidence', async () => {
  const fixedAssets062 = await readJson<FixedAssets062Result>(
    'playwright/projects/fibu-book5/evidence/fixedassets-062/FIXEDASSETS-062-result.json',
  );
  const cleanup107224 = await readJson<CleanupResult>('playwright/projects/fibu-book5/evidence/fixedassets-062/090-cleanup-result.json');
  const cleanup107223 = await readJson<CleanupResult>(
    'playwright/projects/fibu-book5/evidence/fixedassets-062/094-accidental-purchase-invoice-107223-cleanup-result.json',
  );
  const cleanupVendor = await readJson<CleanupResult>(
    'playwright/projects/fibu-book5/evidence/fixedassets-062/097-accidental-vendor-V00060-cleanup-result.json',
  );

  const checks = {
    rejectedWrongContext: fixedAssets062.status === 'line-no-lookup-opened-vendor-card-rejected',
    clickedOnlyDefaultItemType: fixedAssets062.lineMapping?.clickType?.clicked === true && fixedAssets062.lineMapping?.clickType?.chosen?.text === 'Item',
    cleanup107224Done: cleanup107224.status === 'filtered-cleanup-clicked-and-confirmed' && cleanup107224.visibleAfter === false,
    cleanup107223Done: cleanup107223.status === 'cleaned-up' && cleanup107223.invoiceVisibleAfter === false,
    cleanupVendorDone: cleanupVendor.status === 'cleaned-up' && cleanupVendor.vendorVisibleAfter === false,
    noPostingOrPreview:
      fixedAssets062.safety?.clickedPreviewPosting === false &&
      fixedAssets062.safety?.clickedPost === false &&
      fixedAssets062.safety?.posted === false &&
      fixedAssets062.safety?.acquisitionPosted === false &&
      fixedAssets062.safety?.depreciationPosted === false,
    noSetupOrApi:
      fixedAssets062.safety?.setupChanged === false &&
      fixedAssets062.safety?.apiShortcutUsed === false &&
      fixedAssets062.safety?.companySwitched === false,
  };

  const result = {
    caseId: 'FIXEDASSETS-063-PURCHASE-INVOICE-LINE-TYPE-STRICTNESS',
    generatedAt: new Date().toISOString(),
    environment: fixedAssets062.environment,
    company: fixedAssets062.company,
    dataBasis: 'CRONUS USA',
    mode: 'no-bc-helper-strictness-decision',
    sourceEvidence: [
      'playwright/projects/fibu-book5/evidence/fixedassets-062/FIXEDASSETS-062-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-062/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-062/094-accidental-purchase-invoice-107223-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-062/097-accidental-vendor-V00060-cleanup-result.json',
    ],
    status: Object.values(checks).every(Boolean) ? 'strictness-gate-defined' : 'source-evidence-inconsistent',
    checks,
    decision:
      'FIXEDASSETS-062 is a valid rejected-path learning case, not a valid fixed-asset purchase-invoice preflight. The next practical run must isolate the line-type problem before entering the target fixed asset number.',
    strictRule: {
      requiredBeforeFixedAssetNoEntry: [
        'active Purchase Invoice card context',
        'visible Lines/Grid context',
        'same visible line shows Type = Fixed Asset',
        'no Vendor Card or vendor-registration dialog visible',
      ],
      rejectIf: [
        'line type remains Item',
        'FA-CNC-01 opens or creates a Vendor Card',
        'Purchase Invoice context is lost',
        'Preview Posting or Post dialog appears',
        'draft cleanup cannot be verified',
      ],
      screenshotRule:
        'A book candidate screenshot must show K30000/header context and the fixed-asset line together; a target code alone is not enough.',
    },
    safety: {
      noBcRun: true,
      apiShortcutUsed: false,
      companySwitched: false,
      setupChanged: false,
      clickedPreviewPosting: false,
      clickedPost: false,
      posted: false,
      acquisitionPosted: false,
      depreciationPosted: false,
    },
    proves: [
      'FIXEDASSETS-062 is consistently rejected because the line type was not proven as Fixed Asset.',
      'The accidental purchase invoice drafts and vendor draft from 062 are documented as cleaned up.',
      'The next practical step must probe line-type selection without entering FA-CNC-01.',
    ],
    doesNotProve: [
      'No new Business Central UI state.',
      'No valid FA-CNC-01 purchase invoice line.',
      'No Preview Posting.',
      'No fixed asset acquisition.',
      'No depreciation.',
      'No German final proof.',
    ],
    bookImpact:
      'Kapitel 21 und das Debugging-/Screenshot-QA-Kapitel muessen erklaeren: Bei Anlagen-Einkaufsrechnungen ist der Zeilentyp der fachliche Schalter. Ein Code im falschen Lookup-Kontext ist kein Beweis.',
    nextStep: 'FIXEDASSETS-064-PURCHASE-INVOICE-LINE-TYPE-UI-PROBE-NO-TARGET',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-063-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-063-PURCHASE-INVOICE-LINE-TYPE-STRICTNESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-063 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-063-result.json` | JSON | Strictness-Gate aus 062, Cleanup-Konsistenz, No-BC-Safety | keinen neuen UI-Zustand, keine Anlagenzeile, keine Preview/Buchung | `labor`, `no-bc-run`, `helper-strictness` |',
      '| `FIXEDASSETS-063-PURCHASE-INVOICE-LINE-TYPE-STRICTNESS.md` | Markdown | fachliche Lernregel fuer Zeilentyp `Fixed Asset` vor `FA-CNC-01` | keinen deutschen Finalnachweis | `book-learning` |',
      '',
      'Aktuelle Wahrheit: Der naechste praktische Lauf darf nur den Zeilentyp `Fixed Asset` in einer Einkaufsrechnungszeile stabil sichtbar machen. `FA-CNC-01` bleibt bis danach gesperrt.',
      '',
    ].join('\n'),
  );

  expect(checks.rejectedWrongContext).toBe(true);
  expect(checks.clickedOnlyDefaultItemType).toBe(true);
  expect(checks.cleanup107224Done).toBe(true);
  expect(checks.cleanup107223Done).toBe(true);
  expect(checks.cleanupVendorDone).toBe(true);
  expect(checks.noPostingOrPreview).toBe(true);
  expect(checks.noSetupOrApi).toBe(true);
});
