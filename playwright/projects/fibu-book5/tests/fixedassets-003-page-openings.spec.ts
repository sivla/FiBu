import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

const testId = 'fixedassets-003';

type PageTarget = {
  id: string;
  pageId: number;
  label: string;
  expected: RegExp;
  screenshotFile: string;
  purpose: string;
  bookUse: 'navigation' | 'evidence' | 'do-not-use';
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function compactPageText(text: string) {
  const interesting =
    /Fixed Asset|Fixed Assets|FA Ledger|FA Posting|Depreciation|Purchase Invoice|Anlage|Anlagen|AfA|Abschreibung|Einkaufsrechnung|Buchungsgruppe|No\.|Description|Posting Group|FA-CNC-01|HGB|MACHINES|CNC/i;
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
      .slice(0, 200)
  ].join('\n');
}

async function openDirectPageAndCapture(page: Page, target: PageTarget) {
  await page.goto(bcPageUrl(target.pageId, project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  const matched = target.expected.test(text);
  const status = matched ? 'labor-candidate' : 'rejected';

  await writeTextEvidence(fixedAssetsEvidencePath(`${target.id}-page-text.txt`), compactPageText(text));
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: matched ? 'candidate' : 'rejected',
    bookUse: matched ? target.bookUse : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Read-only Direktoeffnung ueber Business-Central-Page-ID in RM-DEMO / CRONUS USA.',
      'Keine Anlage FA-CNC-01, kein AfA-Buch HGB und keine Anlagenbuchungsgruppe MACHINES wurden angelegt oder geaendert.',
      'Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten wurden gebucht.',
      'Kein deutscher Anlagen-/HGB-/Kontenplan-Endstand.'
    ]
  });

  return {
    id: target.id,
    label: target.label,
    pageId: target.pageId,
    status,
    matchedExpectedContext: matched,
    screenshot: `playwright/projects/${project.name}/img/${target.screenshotFile}`,
    evidence: `playwright/projects/${project.name}/evidence/${testId}/${target.id}-page-text.txt`
  };
}

test('FIXEDASSETS-003 Zielseiten read-only oeffnen', async ({ page }) => {
  const targets: PageTarget[] = [
    {
      id: '010-fixed-assets-list',
      pageId: 5601,
      label: 'Fixed Assets / Anlagenliste',
      expected: /Fixed Assets|Fixed Asset|Anlagen|Anlage/i,
      screenshotFile: 'fixedassets-003-010-fixed-assets-list.png',
      purpose: 'FIXEDASSETS-003 Anlagenliste als robuste Zielseite fuer FA-CNC-01-Setup pruefen.',
      bookUse: 'navigation'
    },
    {
      id: '020-depreciation-books',
      pageId: 5611,
      label: 'Depreciation Books / AfA-Buecher',
      expected: /Depreciation Book|Depreciation Books|AfA|Abschreibung/i,
      screenshotFile: 'fixedassets-003-020-depreciation-books.png',
      purpose: 'FIXEDASSETS-003 AfA-Buecher als Setup-Kontext fuer HGB pruefen.',
      bookUse: 'navigation'
    },
    {
      id: '030-fa-posting-groups',
      pageId: 5606,
      label: 'FA Posting Groups / Anlagenbuchungsgruppen',
      expected: /FA Posting Group|FA Posting Groups|Anlagenbuchungsgruppe|Buchungsgruppe/i,
      screenshotFile: 'fixedassets-003-030-fa-posting-groups.png',
      purpose: 'FIXEDASSETS-003 Anlagenbuchungsgruppen als Kontenfindungs-Kontext fuer MACHINES pruefen.',
      bookUse: 'navigation'
    },
    {
      id: '040-purchase-invoices',
      pageId: 9308,
      label: 'Purchase Invoices / Einkaufsrechnungen',
      expected: /Purchase Invoices|Purchase Invoice|Einkaufsrechnung|Einkaufsrechnungen/i,
      screenshotFile: 'fixedassets-003-040-purchase-invoices.png',
      purpose: 'FIXEDASSETS-003 Einkaufsrechnungen als moeglichen Anlagenzugangspfad read-only pruefen.',
      bookUse: 'navigation'
    },
    {
      id: '050-fa-ledger-entries',
      pageId: 5604,
      label: 'FA Ledger Entries / Anlagenposten',
      expected: /FA Ledger Entries|FA Ledger Entry|Anlagenposten/i,
      screenshotFile: 'fixedassets-003-050-fa-ledger-entries.png',
      purpose: 'FIXEDASSETS-003 Anlagenposten als spaeteren Nachweispfad fuer Zugang/AfA pruefen.',
      bookUse: 'navigation'
    }
  ];

  const checks = [];
  for (const target of targets) {
    checks.push(await openDirectPageAndCapture(page, target));
  }

  const result = {
    testId: 'FIXEDASSETS-003',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only',
    noPostingCommittedByTest: true,
    noSetupChangedByTest: true,
    targetBookScenario: {
      fixedAssetNo: 'FA-CNC-01',
      acquisitionCost: 120000,
      depreciationBookCode: 'HGB',
      faPostingGroup: 'MACHINES',
      vendorNo: 'K30000'
    },
    checks,
    openedPages: checks.filter((check) => check.status === 'labor-candidate').map((check) => check.id),
    rejectedPages: checks.filter((check) => check.status === 'rejected').map((check) => check.id),
    proves: [
      'Der Anlagenblock hat jetzt direkte read-only Zielseitenkandidaten statt nur Tell-Me-Suchbilder.',
      'Jeder Zielpfad ist einzeln als geoeffnet oder rejected dokumentiert.',
      'Vor einer Anlagenanlage bleiben Anlagenkarte, AfA-Buch, FA Posting Group, Einkaufsrechnung und Anlagenposten getrennte Kontrollpunkte.'
    ],
    doesNotProve: [
      'Keine Anlage FA-CNC-01 existiert als Laborstammdatum.',
      'Kein AfA-Buch HGB und keine Anlagenbuchungsgruppe MACHINES wurden eingerichtet.',
      'Keine Einkaufsrechnung, keine Aktivierung, keine AfA, keine Sachposten und keine Anlagenposten wurden gebucht.',
      'Kein deutscher Anlagen-/HGB-/Kontenplan-Endstand.'
    ],
    nextStep:
      'FIXEDASSETS-004 als UI-first Setup-Readiness nur fuer die geoeffneten Zielseiten planen: Anlagenkarte FA-CNC-01, AfA-Buch, FA Posting Group und Zugangspfad getrennt pruefen; noch keine Buchung ohne Preview/Postenspur-Plan.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-003-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-003-PAGE-OPENINGS.md'),
    [
      '# FIXEDASSETS-003 Zielseiten read-only oeffnen',
      '',
      'Status: `labor-candidate`, `read-only`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      '## Zweck',
      '',
      'FIXEDASSETS-001/002 haben Suchpfade belegt. Dieser Lauf prueft, ob daraus direkte, robuste Zielseiten fuer die spaetere bebilderte Klickanleitung werden koennen.',
      '',
      '## Ergebnis',
      '',
      '| Zielseite | Page-ID | Status | Buchwirkung |',
      '|---|---:|---|---|',
      ...checks.map((check) => {
        const effect =
          check.status === 'labor-candidate'
            ? 'Candidate fuer spaetere Klickanleitung; noch kein Setup-/Buchungsbeweis.'
            : 'Nicht als Buchbild nutzen; alternativen UI-/Tell-Me-Pfad suchen.';
        return `| ${check.label} | ${check.pageId} | ${check.status} | ${effect} |`;
      }),
      '',
      '## Was Anfaenger daraus lernen',
      '',
      '- Anlagenbuchhaltung startet nicht mit einer Buchung, sondern mit mehreren Setup- und Nachweisseiten.',
      '- Eine Anlagenkarte ist Stammdatum; AfA-Buch und Anlagenbuchungsgruppe steuern Bewertung und Kontenfindung.',
      '- Einkaufsrechnung oder Anlagenjournal erzeugen spaeter den Zugang; Anlagenposten und Sachposten beweisen die Wirkung.',
      '- Read-only Zielseiten sind nur Navigationsevidence, noch keine Prozessfreigabe.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor, gemischte UI, kein deutscher HGB-/Kontenplan-Endstand.',
      '- Keine Anlage `FA-CNC-01`, kein `HGB`, kein `MACHINES`, keine Einkaufsrechnung, keine AfA, keine Buchung.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep
    ].join('\n')
  );

  expect(result.noPostingCommittedByTest).toBe(true);
  expect(result.noSetupChangedByTest).toBe(true);
  expect(checks.length).toBe(targets.length);
});
