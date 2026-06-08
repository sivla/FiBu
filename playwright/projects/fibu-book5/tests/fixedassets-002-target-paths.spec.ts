import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, screenshot, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

const testId = 'fixedassets-002';

type PathTarget = {
  id: string;
  term: string;
  expected: RegExp;
  screenshotFile: string;
  purpose: string;
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

async function loadFixedAssetTestdata() {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/masterdata/resources-assets-projects.json', 'utf8');
  const parsed = JSON.parse(raw) as {
    fixedAssets?: Array<{
      no: string;
      description: string;
      acquisitionCost?: number;
      purpose?: string;
    }>;
  };
  return parsed.fixedAssets?.find((asset) => asset.no === 'FA-CNC-01');
}

function compactPageText(text: string) {
  const interesting =
    /Anlage|Anlagen|AfA|Abschreibung|Fixed Asset|Fixed Assets|FA Ledger|FA Posting|Depreciation|Purchase Invoice|Einkaufsrechnung|Buchungsgruppe|FA-CNC-01|HGB|MACHINES|CNC/i;
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -2; offset <= 5; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
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

async function capturePath(page: Page, target: PathTarget) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);

  await searchFor(page, target.term);
  const text = await pageText(page);
  const hasExpectedContext = target.expected.test(text);
  const status = hasExpectedContext ? 'labor-candidate' : 'rejected';

  await writeTextEvidence(fixedAssetsEvidencePath(`${target.id}-tell-me-page-text.txt`), compactPageText(text));
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status,
    bookUse: hasExpectedContext ? 'evidence' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Read-only Tell-Me-/Suchpfadnachweis in RM-DEMO / CRONUS USA.',
      'Suchtreffer wurden bewusst nicht geoeffnet, weil der Anlagenprozess noch nicht eingerichtet wird.',
      'Keine Anlagenkarte, kein AfA-Buch, keine FA Posting Group und keine Buchung wurden angelegt.'
    ]
  });

  return {
    id: target.id,
    term: target.term,
    hasExpectedContext,
    status,
    evidenceBasis: 'tell-me-page-text-and-screenshot'
  };
}

test('FIXEDASSETS-002 Zielwerte und Suchpfade read-only klaeren', async ({ page }) => {
  const fixedAssetTestdata = await loadFixedAssetTestdata();
  const bookScenario = {
    fixedAssetNo: 'FA-CNC-01',
    description: 'CNC Maschine FRA',
    acquisitionCost: 120000,
    depreciationBookCode: 'HGB',
    depreciationMethod: 'Linear',
    usefulLifeYears: 8,
    faPostingGroup: 'MACHINES',
    vendorNo: 'K30000',
    depreciationUntil: '2026-06-30'
  };

  const targetValueDelta = {
    acquisitionCostBook: bookScenario.acquisitionCost,
    acquisitionCostTestdata: fixedAssetTestdata?.acquisitionCost ?? null,
    aligned: fixedAssetTestdata?.acquisitionCost === bookScenario.acquisitionCost,
    decision:
      fixedAssetTestdata?.acquisitionCost === bookScenario.acquisitionCost
        ? 'Buch und Testdaten sind beim Anlagenzugang konsistent.'
        : 'Buch und Testdaten sind beim Anlagenzugang nicht konsistent; vor Setup/Buchung harmonisieren.'
  };

  const targets: PathTarget[] = [
    {
      id: '010-fixed-assets-de',
      term: 'Anlagen',
      expected: /Anlagen|Fixed Assets|Fixed Asset|Anlage/i,
      screenshotFile: 'fixedassets-002-010-anlagen-tell-me.png',
      purpose: 'FIXEDASSETS-002 deutschen Suchpfad fuer Anlagenliste als Einstieg in FA-CNC-01 pruefen.'
    },
    {
      id: '020-depreciation-books-afa',
      term: 'AfA',
      expected: /AfA|Depreciation|Abschreibung/i,
      screenshotFile: 'fixedassets-002-020-afa-tell-me.png',
      purpose: 'FIXEDASSETS-002 AfA-nahe Suchpfade fuer AfA-Buch und Abschreibung pruefen.'
    },
    {
      id: '030-fa-posting-groups-de',
      term: 'Anlagenbuchungsgruppen',
      expected: /Anlagenbuchungsgruppe|FA Posting Group|Buchungsgruppe/i,
      screenshotFile: 'fixedassets-002-030-anlagenbuchungsgruppen-tell-me.png',
      purpose: 'FIXEDASSETS-002 Suchpfad fuer Anlagenbuchungsgruppen als Setup-Voraussetzung pruefen.'
    },
    {
      id: '040-purchase-invoices-de',
      term: 'Einkaufsrechnungen',
      expected: /Einkaufsrechnung|Purchase Invoice|Purchase Invoices/i,
      screenshotFile: 'fixedassets-002-040-einkaufsrechnungen-tell-me.png',
      purpose: 'FIXEDASSETS-002 Einkaufsrechnungen als Zugangspfad fuer Anlage per Purchase Invoice pruefen.'
    },
    {
      id: '050-fa-ledger-entries-de',
      term: 'Anlagenposten',
      expected: /Anlagenposten|FA Ledger Entries|FA Ledger Entry/i,
      screenshotFile: 'fixedassets-002-050-anlagenposten-tell-me.png',
      purpose: 'FIXEDASSETS-002 Anlagenposten als spaeteren Nachweispfad fuer Zugang und AfA pruefen.'
    }
  ];

  const checks = [];
  for (const target of targets) {
    checks.push(await capturePath(page, target));
  }

  const result = {
    testId: 'FIXEDASSETS-002',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only',
    noPostingCommittedByTest: true,
    noSetupChangedByTest: true,
    bookScenario,
    fixedAssetTestdata,
    targetValueDelta,
    checks,
    proves: [
      'Kapitel 21 wurde gegen vorhandene Testdaten abgeglichen.',
      'Deutsche/BC-nahe Suchbegriffe fuer Anlagen, AfA, Anlagenbuchungsgruppen, Einkaufsrechnungen und Anlagenposten wurden read-only geprueft.',
      'Der naechste Anlagenlauf darf noch nicht buchen, solange Zielbetrag und Setup-Pfade nicht harmonisiert sind.'
    ],
    doesNotProve: [
      'Keine Anlage FA-CNC-01 angelegt.',
      'Kein AfA-Buch HGB gesetzt.',
      'Keine Anlagenbuchungsgruppe MACHINES gesetzt.',
      'Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten gebucht.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ],
    nextStep:
      'FIXEDASSETS-003 nur nach Zielwertentscheidung: entweder Buch/Testdaten auf 120.000 harmonisieren und dann UI-Seitenoeffnungen fuer Anlagenkarte, AfA-Buch und FA Posting Group gezielt nachweisen, oder bewusst den Testdatenwert 250.000 ins Buchmodell uebernehmen.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-002-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-002-TARGET-PATHS.md'),
    [
      '# FIXEDASSETS-002 Zielwerte und Suchpfade',
      '',
      'Status: `labor-candidate`, `read-only`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      '## Zweck',
      '',
      'Dieser Lauf klaert den naechsten Anlagen-Schritt, ohne Stammdaten oder Setup zu veraendern. Er gleicht Kapitel 21 gegen die vorhandenen Testdaten ab und prueft deutsche/BC-nahe Suchpfade fuer die spaetere Klickanleitung.',
      '',
      '## Zielwertabgleich',
      '',
      '| Feld | Buch Kapitel 21 | Testdaten | Status |',
      '|---|---:|---:|---|',
      `| Zugangsbetrag | ${bookScenario.acquisitionCost} | ${fixedAssetTestdata?.acquisitionCost ?? 'nicht gefunden'} | ${targetValueDelta.aligned ? 'konsistent' : 'Widerspruch'} |`,
      '',
      'Weitere Buchzielwerte: `FA-CNC-01`, `HGB`, `Linear`, `8 Jahre`, `MACHINES`, `K30000`, AfA bis `30.06.2026`.',
      '',
      '## Suchpfade',
      '',
      '| Suchbegriff | Status | Beweist | Beweist nicht |',
      '|---|---|---|---|',
      ...checks.map((check) => `| ${check.term} | ${check.status} | Tell-Me-/Suchkontext in ` + '`RM-DEMO`' + ` | Seite nicht geoeffnet, keine Einrichtung, keine Buchung |`),
      '',
      '## Buchwirkung',
      '',
      '- Kapitel 21 darf noch nicht als praktisch belegt gelten.',
      '- Vor der ersten Anlagenanlage muss der Zugangsbetrag harmonisiert werden.',
      '- Suchbegriffe muessen fuer deutsche/gemischtsprachige Oberflaechen stabiler formuliert werden als nur mit englischen Namen.',
      '- Die spaetere Klickanleitung braucht getrennte Bilder fuer Anlagenkarte, AfA-Buch, Anlagenbuchungsgruppe, Einkaufsrechnung, Preview/Buchung, Anlagenposten, Sachposten und Anlagenspiegel.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep
    ].join('\n')
  );

  expect(result.noPostingCommittedByTest).toBe(true);
  expect(result.noSetupChangedByTest).toBe(true);
  expect(checks.some((check) => check.status === 'labor-candidate')).toBe(true);
});
