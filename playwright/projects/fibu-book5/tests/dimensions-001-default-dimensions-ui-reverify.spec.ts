import { test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(300_000);

const testId = 'dimensions-001';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;

type Target = {
  id: string;
  tableId: number;
  tableName: string;
  no: string;
  dimensionCode: string;
  dimensionValueCode: string;
  expectedUse: string;
};

function dimensionsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function asciiSafeEvidenceText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildDefaultDimensionsUrl(target: Target) {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }

  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', '540');
  url.searchParams.set(
    'filter',
    `'Default Dimension'.'Table ID' IS '${target.tableId}' AND 'Default Dimension'.'No.' IS '${target.no}'`
  );
  return url.toString();
}

function compactPageText(text: string) {
  const interesting =
    /Default Dimensions|Standarddimensionen|Table ID|No\.|Dimension Code|Dimension Value Code|Value Posting|Same Code|PRODUCTLINE|MACHINE|CHANNEL|B2B|D10000|RM-M100|Customer|Item|Debitor|Artikel/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafeEvidenceText(line))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 8; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }

  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 180)
  ].join('\n');
}

async function verifyTarget(page: Page, target: Target) {
  await page.goto(buildDefaultDimensionsUrl(target), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  const buttons = (await visibleButtonNames(page)).map(asciiSafeEvidenceText);
  const compactText = compactPageText(text);
  const textEvidenceFile = `${target.id}-page-540-text.txt`;
  await writeTextEvidence(dimensionsEvidencePath(textEvidenceFile), compactText);

  const pageVisible = /Default Dimensions|Standarddimensionen/i.test(text);
  const noVisible = new RegExp(`\\b${target.no}\\b`, 'i').test(text);
  const dimensionCodeVisible = new RegExp(`\\b${target.dimensionCode}\\b`, 'i').test(text);
  const dimensionValueVisible = new RegExp(`\\b${target.dimensionValueCode}\\b`, 'i').test(text);
  const valuePostingVisible = /Same Code|Gleicher Code|Value Posting|Wertbuchung/i.test(text);
  const riskyActionsVisible = buttons
    .filter((button) => /\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Post|Buchen|Preview|Vorschau)\b/i.test(button))
    .slice(0, 30);

  return {
    id: target.id,
    tableId: target.tableId,
    tableName: target.tableName,
    no: target.no,
    expectedDimension: `${target.dimensionCode}=${target.dimensionValueCode}`,
    expectedUse: target.expectedUse,
    pageVisible,
    noVisible,
    dimensionCodeVisible,
    dimensionValueVisible,
    valuePostingVisible,
    targetSatisfied: pageVisible && dimensionCodeVisible && dimensionValueVisible,
    riskyActionsVisibleNotClicked: riskyActionsVisible,
    textEvidenceFile
  };
}

function renderMarkdown(result: Record<string, any>) {
  const rows = result.targets
    .map(
      (target: Record<string, any>) =>
        `| ${target.no} | ${target.expectedDimension} | ${target.targetSatisfied ? 'ja' : 'nein'} | ${target.valuePostingVisible ? 'ja' : 'nein'} | ${target.textEvidenceFile} |`
    )
    .join('\n');

  return [
    '# DIMENSIONS-001 Default Dimensions UI Reverify',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor-reference, UI-only, no-API, no-setup-change, not-final |',
    '',
    '## Ergebnis',
    '',
    result.resultStatus === 'observed'
      ? '`PRODUCTLINE=MACHINE` und `CHANNEL=B2B` wurden auf der UI-Seite Default Dimensions erneut sichtbar nachgewiesen.'
      : 'Mindestens ein Standarddimensionsziel war auf der UI-Seite Default Dimensions nicht sichtbar.',
    '',
    '| Stammdatensatz | Erwartete Standarddimension | Ziel sichtbar | Value Posting sichtbar | Evidence |',
    '|---|---|---:|---:|---|',
    rows,
    '',
    '## Sicherheitsgrenze',
    '',
    '- Keine API-Abkuerzung.',
    '- Keine Setup-Aenderung.',
    '- Kein New/Edit/Delete.',
    '- Kein Posting.',
    '- Keine Buchaenderung.',
    '',
    '## Buchwirkung',
    '',
    'Die bestehende Laborannahme zu Standarddimensionen wird UI-seitig bestaetigt. Fuer den deutschen Finalnachweis muessen dieselben Dimensionen in der deutschen Zielcompany neu eingerichtet und fotografiert werden.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('DIMENSIONS-001 prueft Standarddimensionen UI-only', async ({ page }) => {
  const targets: Target[] = [
    {
      id: '010-item-rm-m100-productline-machine',
      tableId: 27,
      tableName: 'Item',
      no: 'RM-M100',
      dimensionCode: 'PRODUCTLINE',
      dimensionValueCode: 'MACHINE',
      expectedUse: 'O2C/P2P/Inventory item dimension'
    },
    {
      id: '020-customer-d10000-channel-b2b',
      tableId: 18,
      tableName: 'Customer',
      no: 'D10000',
      dimensionCode: 'CHANNEL',
      dimensionValueCode: 'B2B',
      expectedUse: 'O2C customer dimension'
    }
  ];

  const targetResults = [];
  for (const target of targets) targetResults.push(await verifyTarget(page, target));

  const allSatisfied = targetResults.every((target) => target.targetSatisfied);
  const result = {
    schemaVersion: 1,
    purpose: 'dimension-default-ui-reverify-result',
    caseId: 'DIMENSIONS-001-DEFAULT-DIMENSION-REVERIFY',
    testId: 'DIMENSIONS-001',
    source: 'playwright-ui-readonly',
    resultStatus: allSatisfied ? 'observed' : 'blocked',
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    dataBasis: 'CRONUS USA / RM-DEMO labor',
    targets: targetResults,
    proved: allSatisfied
      ? ['Default Dimensions page 540 shows PRODUCTLINE=MACHINE for RM-M100 and CHANNEL=B2B for D10000.']
      : ['Default Dimensions page 540 opened UI-only, but at least one expected target was not visible.'],
    notProved: [
      'No new dimension setup was created in this run.',
      'No German final dimension setup was proved.',
      'No posting or ledger dimension effect was newly proved.'
    ],
    safety: {
      noApiShortcut: true,
      noSetupChange: true,
      noNew: true,
      noEdit: true,
      noDelete: true,
      noPreviewPosting: true,
      noPost: true,
      noBookChange: true
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    rebuildInstruction:
      'In der deutschen Zielcompany Dimensionen PRODUCTLINE/CHANNEL, Werte MACHINE/B2B und Standarddimensionen fuer Zielartikel/Zieldebitor per UI einrichten und als deutsche Evidence neu fotografieren.',
    targetGermanCompanyImpact:
      'Standarddimensionen muessen in deutscher Zielcompany neu nachgewiesen werden, bevor O2C/P2P/Reporting als deutscher Finalpfad gelten.',
    blockedBy: allSatisfied ? [] : targetResults.filter((target) => !target.targetSatisfied).map((target) => `${target.id}-not-visible`),
    safeToFinalizeState: false,
    requiresReview: !allSatisfied,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/dimensions-001/DIMENSIONS-001-result.json',
      'playwright/projects/fibu-book5/evidence/dimensions-001/DIMENSIONS-001-DEFAULT-DIMENSIONS-UI-REVERIFY.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/dimensions-001/'],
    nextStep: allSatisfied
      ? 'INVENTORY-009: target stock posting trace pruefen oder buchen, weil Dimensionen UI-seitig weiter tragen.'
      : 'DIMENSIONS-002: fehlenden UI-Nachweis per Page Inspection/Personalize oder sauberem Setup-Fit klaeren.'
  };

  await writeJsonEvidence(dimensionsEvidencePath('DIMENSIONS-001-result.json'), result);
  await writeTextEvidence(dimensionsEvidencePath('DIMENSIONS-001-DEFAULT-DIMENSIONS-UI-REVERIFY.md'), renderMarkdown(result));
  await writeTextEvidence(
    dimensionsEvidencePath('README.md'),
    [
      '# DIMENSIONS-001 Evidence Index',
      '',
      'Status: labor-reference, UI-only, no-API, no-setup-change, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `DIMENSIONS-001-result.json` | JSON-Ergebnis | UI-seitiger Reverify der Standarddimensionen | keinen deutschen Finalnachweis | labor-reference |',
      '| `DIMENSIONS-001-DEFAULT-DIMENSIONS-UI-REVERIFY.md` | Lernzusammenfassung | Buchwirkung und Rebuild-Hinweis | keine neue Einrichtung | labor-reference |',
      '| `010-*` und `020-*` | kompakter Page-Text | sichtbare Page-540-Dimensionszeilen | keine Ledger-Wirkung | labor-reference |',
      ''
    ].join('\n')
  );
});
