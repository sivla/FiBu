import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import {
  compactPageText,
  openSearchResult,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell,
  writeEvidenceText
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

const testId = 'governance-013';
const evidenceDir = path.resolve('playwright/projects/fibu-book5/evidence', testId);
const registryPath = path.resolve('playwright/projects/fibu-book5/COMPANY-REGISTRY.json');

type Registry = {
  environment: string;
  companies: Array<{
    company: string;
    actualVisibleInBc?: string;
  }>;
};

async function writeJson(fileName: string, data: unknown) {
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(path.join(evidenceDir, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function renderMarkdown(result: {
  environment: string;
  startCompany: string;
  mode: string;
  visibleKnownCompanies: string[];
  notVisibleKnownCompanies: string[];
  limitations: string[];
  nextStep: string;
}) {
  return [
    '# GOVERNANCE-013 Company List Read-only',
    '',
    'Status: `labor`, `read-only`, `company-context`, `no-company-switch`, `no-company-created`, `no-setup-change`, `no-posting`, `not-final`.',
    '',
    '## Zweck',
    '',
    'Dieser Lauf prueft die Companies-Liste innerhalb der Business-Central-Instanz `MCP_1_20260210`, ohne Company zu wechseln, eine Company anzulegen oder Setup zu aendern.',
    '',
    '## Ergebnis',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Startcompany | ${result.startCompany} |`,
    `| Modus | ${result.mode} |`,
    `| Sichtbare bekannte Registry-Companies | ${result.visibleKnownCompanies.length ? result.visibleKnownCompanies.map((entry) => `\`${entry}\``).join(', ') : 'keine'} |`,
    `| Nicht sichtbar im Seitentext | ${result.notVisibleKnownCompanies.length ? result.notVisibleKnownCompanies.map((entry) => `\`${entry}\``).join(', ') : 'keine'} |`,
    '',
    '## Was bewiesen ist',
    '',
    '- Die Companies-Seite wurde ueber die Business-Central-UI read-only geoeffnet.',
    '- Die Pruefung blieb in `MCP_1_20260210` und startete aus `RM-DEMO`.',
    '- Es wurde kein `New`, `Copy`, `Create`, `Switch` oder aehnlicher datenveraendernder Company-Schritt ausgefuehrt.',
    '',
    '## Was nicht bewiesen ist',
    '',
    '- Es wurde keine Zielcompany angelegt.',
    '- Es wurde nicht in eine andere Company gewechselt.',
    '- Es wurde kein deutsches VAT19-, Kontenplan- oder Finalbild erzeugt.',
    '- Die Seitentext-Erkennung beweist nur sichtbare bekannte Namen, keine vollstaendige Company-Metadatenanalyse.',
    '',
    '## Limitationen',
    '',
    ...result.limitations.map((entry) => `- ${entry}`),
    '',
    '## Buchwirkung',
    '',
    'Kapitel zu Intercompany, Migration, Zielmandanten und Handover duerfen jetzt zwischen geplanter Registry und live sichtbarer Companies-Liste unterscheiden. Anfaenger lernen: Erst pruefen, in welcher Instanz und Company man arbeitet, dann Company-Aktionen planen.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('GOVERNANCE-013 Companies-Liste read-only pruefen', async ({ page }) => {
  test.setTimeout(6 * 60_000);
  await page.setViewportSize({ width: 2400, height: 1300 });

  const registry = JSON.parse(await fs.readFile(registryPath, 'utf8')) as Registry;
  const bcUrl = requireBcUrl(project.envPrefix);
  const expectedCompany = project.defaultCompany;

  await page.goto(bcUrl);
  await waitForBusinessCentralShell(page);

  const startUrl = decodeURIComponent(page.url());
  expect(startUrl, 'Der Lauf muss in MCP_1_20260210 bleiben.').toMatch(/MCP_1_20260210/i);
  expect(startUrl, 'Der Lauf muss aus RM-DEMO starten.').toMatch(/company=RM-DEMO/i);

  await searchFor(page, 'Companies');
  await openSearchResult(page, /Companies\s+Listen/i, { requireUnique: false });
  await expect.poll(async () => pageText(page), { timeout: 30_000 }).toMatch(/Companies|Unternehmen|Company Name|Name|CRONUS|RM-DEMO|Rhein-Main Demo GmbH/i);

  await screenshot(page, 'governance-013-010-companies-list-readonly.png', {
    testId,
    status: 'labor',
    bookUse: 'evidence',
    purpose: 'GOVERNANCE-013 Companies-Liste read-only als Company-Kontext und Registry-Abgleich sichern.',
    expectedPageText: [/Companies|Unternehmen|Company Name|Name/i, /RM-DEMO|CRONUS|Rhein-Main Demo GmbH/i],
    knownLimitations: [
      'Read-only Laborbild, kein Company-Wechsel, keine Company-Anlage.',
      'Seitentext beweist nur sichtbare bekannte Namen, keine vollstaendige Company-Metadatenanalyse.'
    ]
  });

  const fullText = await pageText(page);
  const compactText = await compactPageText(page, {
    include: /Companies|Company|Unternehmen|RM-|CRONUS|My Company|Display Name|Evaluation Company|Assisted Company Setup|Setup Status/i,
    maxLines: 180
  });
  await writeEvidenceText(path.join(evidenceDir, '010-companies-list-page-text.txt'), compactText);

  const knownCompanies = registry.companies.map((entry) => entry.company);
  const visibleKnownCompanies = knownCompanies.filter((company) => new RegExp(company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(fullText));
  const notVisibleKnownCompanies = knownCompanies.filter((company) => !visibleKnownCompanies.includes(company));

  const result = {
    testId: 'GOVERNANCE-013-COMPANY-LIST-READONLY',
    timestamp: new Date().toISOString(),
    environment: registry.environment,
    startCompany: expectedCompany,
    mode: 'read-only-ui-company-list-no-company-switch-no-company-created',
    urlBeforeCompaniesList: startUrl,
    urlAfterCompaniesList: decodeURIComponent(page.url()),
    visibleKnownCompanies,
    notVisibleKnownCompanies,
    companyCreated: false,
    companySwitched: false,
    setupChanged: false,
    posted: false,
    screenshots: ['playwright/projects/fibu-book5/img/governance-013-010-companies-list-readonly.png'],
    evidence: [
      'playwright/projects/fibu-book5/evidence/governance-013/010-companies-list-page-text.txt',
      'playwright/projects/fibu-book5/evidence/governance-013/GOVERNANCE-013-COMPANY-LIST-READONLY.md',
      'playwright/projects/fibu-book5/evidence/governance-013/GOVERNANCE-013-result.json'
    ],
    limitations: [
      'RM-DEMO ist im Companies-Seitentext sichtbar und bleibt die aktive Laborcompany.',
      'Geplante Zielcompanies werden nur dann als sichtbar markiert, wenn ihr Code im UI-Seitentext vorkommt.',
      'Keine Company wurde angelegt, kopiert, geloescht oder geoeffnet.'
    ],
    nextStep: 'COMPANY-REGISTRY.md/json mit actual-visible/not-visible synchronisieren und danach den fachlich besten naechsten Lauf waehlen.'
  };

  await writeJson('GOVERNANCE-013-result.json', result);
  await writeEvidenceText(
    path.join(evidenceDir, '011-visible-company-codes.txt'),
    [
      'Visible known registry companies:',
      ...visibleKnownCompanies.map((entry) => `- ${entry}`),
      '',
      'Known registry companies not visible in UI page text:',
      ...notVisibleKnownCompanies.map((entry) => `- ${entry}`)
    ].join('\n')
  );
  await writeEvidenceText(path.join(evidenceDir, 'GOVERNANCE-013-COMPANY-LIST-READONLY.md'), renderMarkdown(result));
  await writeEvidenceText(
    path.join(evidenceDir, 'README.md'),
    [
      '# Evidence GOVERNANCE-013',
      '',
      'Ziel: Companies-Liste innerhalb `MCP_1_20260210` read-only oeffnen und Registry-Eintraege gegen sichtbare UI-Namen pruefen.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `GOVERNANCE-013-result.json` | JSON-Ergebnis | Umgebung, Startcompany, sichtbare bekannte Registry-Companies, Safety Flags | vollstaendige Company-Metadaten oder Zielcompany-Anlage | labor, read-only |',
      '| `GOVERNANCE-013-COMPANY-LIST-READONLY.md` | Lern-/Governance-Zusammenfassung | Company-Kontext, Grenzen, Buchwirkung und naechsten Schritt | deutschen Finalmandanten | labor, read-only |',
      '| `010-companies-list-page-text.txt` | kompakter UI-Seitentext | sichtbare Company-/Listenbegriffe | Rohsnapshot oder vollstaendige Tabellenstruktur | labor, read-only |',
      '| `011-visible-company-codes.txt` | fokussierte Text-Evidence | welche Registry-Companies im UI-Seitentext sichtbar/nicht sichtbar waren | vollstaendige Company-Metadaten | labor, read-only |',
      '| `governance-013-010-companies-list-readonly.png` | Screenshot | Companies-Liste als Company-Kontext | Setup, Wechsel oder Anlage einer Company | labor, evidence |',
      ''
    ].join('\n')
  );
});
