import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, screenshot, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

const testId = 'fixedassets-001';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function compactPageText(text: string) {
  const interesting =
    /Fixed Asset|Fixed Assets|FA Ledger Entries|FA Posting Group|Depreciation|Calculate Depreciation|Anlage|Anlagen|AfA|Anlagenposten|Buchungsgruppe|FA-CNC-01|HGB|MACHINES|CNC/i;
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -2; offset <= 4; offset += 1) {
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
      .slice(0, 160)
  ].join('\n');
}

async function captureTellMeTarget(
  page: Page,
  target: {
    term: string;
    expected: RegExp;
    fileStem: string;
    screenshotFile: string;
    purpose: string;
  }
) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);

  await searchFor(page, target.term);
  const tellMeText = await pageText(page);
  const hasExpectedContext = target.expected.test(tellMeText);
  const status = hasExpectedContext ? 'labor-candidate' : 'rejected';

  await writeTextEvidence(fixedAssetsEvidencePath(`${target.fileStem}-tell-me-page-text.txt`), compactPageText(tellMeText));
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status,
    bookUse: status === 'labor-candidate' ? 'evidence' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Read-only Tell-Me-Einstieg in RM-DEMO / CRONUS USA; Suchtreffer wurden bewusst nicht geoeffnet.',
      'Keine Anlagenkarte angelegt, kein Einkauf, keine AfA, keine Anlagen- oder Sachposten gebucht.',
      'Kein deutscher Anlagen-/HGB-Finalnachweis.'
    ]
  });

  return {
    term: target.term,
    hasExpectedContext,
    status,
    evidenceBasis: 'tell-me-page-text-and-screenshot'
  };
}

test('FIXEDASSETS-001 Anlagen-Readiness read-only pruefen', async ({ page }) => {
  const targets = [
    {
      term: 'Fixed Assets',
      expected: /Fixed Assets|Fixed Asset|Anlagen|Anlage/i,
      fileStem: '010-fixed-assets',
      screenshotFile: 'fixedassets-001-010-fixed-assets-tell-me.png',
      purpose: 'FIXEDASSETS-001 Anlagenliste als Tell-Me-Einstieg nachweisen, bevor FA-CNC-01 angelegt wird.'
    },
    {
      term: 'Depreciation Books',
      expected: /Depreciation Books|Depreciation Book|AfA/i,
      fileStem: '020-depreciation-books',
      screenshotFile: 'fixedassets-001-020-depreciation-books-tell-me.png',
      purpose: 'FIXEDASSETS-001 AfA-Buecher als Tell-Me-Einstieg nachweisen, bevor HGB als Zielannahme verwendet wird.'
    },
    {
      term: 'FA Posting Groups',
      expected: /FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppe|Buchungsgruppe/i,
      fileStem: '030-fa-posting-groups',
      screenshotFile: 'fixedassets-001-030-fa-posting-groups-tell-me.png',
      purpose: 'FIXEDASSETS-001 Anlagenbuchungsgruppen als Tell-Me-Einstieg nachweisen, bevor MACHINES als Zielwert verwendet wird.'
    },
    {
      term: 'FA Ledger Entries',
      expected: /FA Ledger Entries|FA Ledger Entry|Anlagenposten/i,
      fileStem: '040-fa-ledger-entries',
      screenshotFile: 'fixedassets-001-040-fa-ledger-entries-tell-me.png',
      purpose: 'FIXEDASSETS-001 Anlagenposten als Tell-Me-Einstieg nachweisen; noch keine Posten fuer FA-CNC-01 erwarten.'
    }
  ];

  const checks = [];
  for (const target of targets) {
    checks.push(await captureTellMeTarget(page, target));
  }

  const result = {
    testId: 'FIXEDASSETS-001',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only',
    noPostingCommittedByTest: true,
    noSetupChangedByTest: true,
    targetBookScenario: {
      fixedAssetNo: 'FA-CNC-01',
      description: 'CNC-Anlage',
      depreciationBookCode: 'HGB',
      faPostingGroup: 'MACHINES',
      acquisitionCostBookModel: 120000,
      acquisitionCostTestdata: 250000
    },
    checks,
    proves: [
      'Der Anlagenblock wird als eigener Readiness-Schritt gestartet, ohne Anlagenstammdaten oder Buchungen zu veraendern.',
      'Die benoetigten BC-Kontexte fuer Anlagen, AfA-Buecher, Anlagenbuchungsgruppen und Anlagenposten sind als Tell-Me-Einstiegspfade pruefbar oder liefern konkrete Rejected-Evidence.',
      'Das Buchziel FA-CNC-01 darf noch nicht als praktisch erledigt gelten.'
    ],
    doesNotProve: [
      'Keine Anlage FA-CNC-01 angelegt.',
      'Kein AfA-Buch HGB oder MACHINES-Fit gesetzt.',
      'Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten gebucht.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ],
    nextStep:
      'FIXEDASSETS-002 als UI-Read-only-Seitenoeffnung oder Setup-Fit nur nach Pruefung der Zielwerte: FA-CNC-01, AfA-Buch, FA Posting Group, Kreditor K30000 und Betrag im Buch/Testdatenmodell harmonisieren.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-001-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-001-READINESS.md'),
    [
      '# FIXEDASSETS-001 Anlagen-Readiness',
      '',
      'Status: `labor-candidate`, `read-only`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      '## Zweck',
      '',
      'Dieser Lauf startet Kapitel 21 kontrolliert als Readiness-Pruefung. Es wird keine Anlage angelegt, keine Einkaufsrechnung vorbereitet, keine AfA berechnet und nichts gebucht.',
      '',
      '## Ergebnis',
      '',
      '| Pruefpunkt | Status |',
      '|---|---|',
      ...checks.map((check) => `| ${check.term} | ${check.status}; ${check.evidenceBasis} |`),
      '',
      '## Buchwirkung',
      '',
      '- Kapitel 21 ist noch kein praktischer Anlagenprozess.',
      '- `FA-CNC-01`, `HGB`, `MACHINES`, Kreditor `K30000`, Zugang und AfA bleiben Zielwerte.',
      '- Vor einer Buchung muessen Anlagenkarte, AfA-Buch, Anlagenbuchungsgruppe, Einkaufsbeleg, Preview Posting und Postenspur separat belegt werden.',
      '- Der direkte Suchtreffer-Aufruf wurde in diesem Lauf bewusst nicht als Beweis verwendet; fuer Buchscreenshots braucht es danach gezielte Seitenoeffnungen.',
      '- Im Buch/Testdatenmodell ist der Zugangsbetrag noch zu klaeren: Kapitel 21 nennt `120.000 EUR`, `resources-assets-projects.json` nennt `250.000`.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep
    ].join('\n')
  );

  expect(result.noPostingCommittedByTest).toBe(true);
  expect(result.noSetupChangedByTest).toBe(true);
  expect(checks.some((check) => check.status === 'labor-candidate' || check.status === 'rejected')).toBe(true);
});
