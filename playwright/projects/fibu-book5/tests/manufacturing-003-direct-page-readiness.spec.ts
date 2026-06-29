import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'manufacturing-003';
const instanceName = 'MCP_1_20260210';

type ManufacturingPageTarget = {
  id: string;
  pageId: number;
  label: string;
  expected: RegExp;
  purpose: string;
  screenshotFile: string;
};

const targets: ManufacturingPageTarget[] = [
  {
    id: 'production-boms',
    pageId: 99000786,
    label: 'Production BOMs',
    expected: /Production BOM|Prod\. BOM|BOM|Fertigungsstueckliste|Fertigungsstückliste|Stueckliste|Stückliste/i,
    purpose: 'Direkter Read-only-Seitenkontext fuer Fertigungsstuecklisten als Materialstruktur-Gate.',
    screenshotFile: 'manufacturing-003-010-production-boms.png'
  },
  {
    id: 'routings',
    pageId: 99000764,
    label: 'Routings',
    expected: /Routing|Routings|Arbeitsplan|Arbeitsplaene|Arbeitspläne/i,
    purpose: 'Direkter Read-only-Seitenkontext fuer Arbeitsplaene als Kapazitaets-/Ablauf-Gate.',
    screenshotFile: 'manufacturing-003-020-routings.png'
  },
  {
    id: 'work-centers',
    pageId: 99000754,
    label: 'Work Centers',
    expected: /Work Center|Work Centers|Arbeitsplatz|Arbeitsplaetze|Arbeitsplätze/i,
    purpose: 'Direkter Read-only-Seitenkontext fuer Arbeitsplatz-/Kapazitaetsstammdaten.',
    screenshotFile: 'manufacturing-003-030-work-centers.png'
  },
  {
    id: 'released-production-orders',
    pageId: 99000831,
    label: 'Released Production Orders',
    expected: /Released Production Order|Released Production Orders|Freigegebene Fertigungsauftraege|Freigegebene Fertigungsaufträge|Fertigungsauftrag/i,
    purpose: 'Direkter Read-only-Seitenkontext fuer spaetere Fertigungsauftragsroute.',
    screenshotFile: 'manufacturing-003-040-released-production-orders.png'
  }
];

function caseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function directPageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', project.defaultCompany);
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

function compactText(text: string) {
  const interesting =
    /Business Central|Manufacturing|Production|BOM|Routing|Work Center|Released|Order|Fertigung|Stueckliste|Stückliste|Arbeitsplan|Arbeitsplatz|Freigegeben|RM-DEMO/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources/i.test(line));

  const selected = lines.filter((line) => interesting.test(line)).slice(0, 160);
  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...selected
  ].join('\n');
}

async function openReadonlyTarget(page: Page, target: ManufacturingPageTarget) {
  const url = directPageUrl(target.pageId);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  await page.waitForTimeout(1500);

  const text = await pageText(page);
  const expectedVisible = target.expected.test(text);
  const instanceOk = page.url().includes(instanceName);
  const companyOk = page.url().includes('company=RM-DEMO') || page.url().includes('company=RM-DEMO'.replace('-', '%2D'));

  await writeTextEvidence(caseEvidencePath(`${target.id}-page-text.txt`), compactText(text));
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: expectedVisible ? 'labor' : 'rejected',
    bookUse: expectedVisible ? 'navigation' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Direkte Page-URL in RM-DEMO / MCP_1_20260210, keine Tell-Me-Suche.',
      'Read-only: kein New, Edit, Delete, Setup, Preview Posting oder Post.',
      'Seitenkontext beweist keine Stueckliste, keinen Arbeitsplan, keinen Fertigungsauftrag und keine Fertigungsposten.'
    ]
  });

  return {
    id: target.id,
    label: target.label,
    pageId: target.pageId,
    url,
    finalUrl: page.url(),
    instanceOk,
    companyOk,
    expectedVisible,
    textEvidence: `playwright/projects/fibu-book5/evidence/${testId}/${target.id}-page-text.txt`,
    screenshot: `playwright/projects/fibu-book5/img/${target.screenshotFile}`,
    screenshotMetadata: `playwright/projects/fibu-book5/evidence/${testId}/${target.screenshotFile.replace(/\.png$/i, '.screenshot.json')}`
  };
}

function renderMarkdown(result: Record<string, any>) {
  const rows = (result.pageResults as Array<Record<string, any>>)
    .map((entry) => `| ${entry.label} | ${entry.pageId} | ${entry.expectedVisible ? 'ja' : 'nein'} | ${entry.screenshot} |`)
    .join('\n');

  return [
    '# MANUFACTURING-003 Direct Page Readiness',
    '',
    'Status: `labor`, `read-only`, `direct-page`, `no-search`, `no-draft`, `no-posting`, `needs-german-final-rebuild`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Instanz | ${result.instance} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA / RM-DEMO Labor |',
    '| BC-Ausfuehrung | ja, read-only |',
    '| Setup-Aenderung | nein |',
    '| Draft | nein |',
    '| Preview Posting | nein |',
    '| Buchung | nein |',
    '',
    '## Direkt geoeffnete Seiten',
    '',
    '| Seite | Page ID | Erwarteter Kontext sichtbar | Screenshot |',
    '|---|---:|---|---|',
    rows,
    '',
    '## Was dadurch besser ist',
    '',
    '- Der alte Manufacturing-Readiness-Ansatz hing an Tell-Me/Suche. Dieser Lauf nutzt direkte Page-URLs und ist damit besser reproduzierbar.',
    '- Die Evidence trennt klar zwischen Seitenkontext und Prozessnachweis.',
    '- Kapitel 14 kann diese Seiten als Zielpfad-Anker verwenden, aber nicht als fertigen Fertigungsprozess.',
    '',
    '## Was nicht bewiesen ist',
    '',
    ...result.notProved.map((entry: string) => `- ${entry}`),
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('MANUFACTURING-003 oeffnet Fertigungsseiten direkt und read-only', async ({ page }) => {
  const pageResults = [];
  for (const target of targets) {
    pageResults.push(await openReadonlyTarget(page, target));
  }

  const observedPages = pageResults.filter((entry) => entry.expectedVisible).map((entry) => entry.label);
  const result = {
    schemaVersion: 1,
    caseId: 'MANUFACTURING-003-DIRECT-PAGE-READINESS',
    source: 'playwright-ui-readonly-direct-page-readiness',
    resultStatus: observedPages.length ? 'observed' : 'blocked',
    instance: instanceName,
    company: project.defaultCompany,
    sourceCompany: project.defaultCompany,
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    draftCreated: false,
    companySwitched: false,
    apiShortcut: false,
    flags: {
      noSearch: true,
      noDraft: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    pageResults,
    proved: [
      'Manufacturing readiness can be advanced through direct BC page URLs instead of Tell-Me/search.',
      ...observedPages.map((label) => `${label} page context was observed read-only in RM-DEMO.`)
    ],
    notProved: [
      'No Production BOM for RM-M100 was created or proven.',
      'No Routing for RM-M100 was created or proven.',
      'No Production Order PROD-3001 was created, released or posted.',
      'No Consumption Journal, Output Journal, Capacity Entry, Item Ledger Entry, Value Entry or G/L Entry from manufacturing was created.',
      'No German final proof was created.'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/manufacturing-003/MANUFACTURING-003-result.json',
      'playwright/projects/fibu-book5/evidence/manufacturing-003/MANUFACTURING-003-READINESS.md',
      'playwright/projects/fibu-book5/evidence/manufacturing-003/README.md'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/manufacturing-003/MANUFACTURING-003-result.json',
      'playwright/projects/fibu-book5/evidence/manufacturing-003/MANUFACTURING-003-READINESS.md',
      'playwright/projects/fibu-book5/evidence/manufacturing-003/README.md'
    ],
    blockedBy: observedPages.length ? [] : ['no-direct-manufacturing-page-context-observed'],
    requiresReview: false,
    safeToFinalizeState: false,
    statePatch: {},
    nextStep:
      'MANUFACTURING-004: decide whether a UI-first setup-readiness route for Production BOM/Routing is justified, or sync this direct-page evidence into the chapter 14 lab draft first.'
  };

  await writeJsonEvidence(caseEvidencePath('MANUFACTURING-003-result.json'), result);
  await writeTextEvidence(caseEvidencePath('MANUFACTURING-003-READINESS.md'), renderMarkdown(result));
  await writeTextEvidence(
    caseEvidencePath('README.md'),
    [
      '# MANUFACTURING-003 Evidence-Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `MANUFACTURING-003-result.json` | JSON-Ergebnis | direkte read-only Page-URL Route fuer Manufacturing-Kontexte | keinen Fertigungsprozess, keine Buchung | labor, direct-page |',
      '| `MANUFACTURING-003-READINESS.md` | Lernzusammenfassung | warum Seitenkontext nur ein Setup-/Prozess-Gate ist | keinen BOM-/Routing-Fit | labor-draft input |',
      '| `*-page-text.txt` | kompakter Rohtext | sichtbare Seiten-/Kontextsignale | keine vollstaendige Tabelle | page-text |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen der Bilder | keine eigenstaendige Buchwahrheit | screenshot-metadata |',
      '',
      'Keine Suche, kein Draft, kein Setup, kein Preview Posting, kein Post.',
      ''
    ].join('\n')
  );

  expect(pageResults.every((entry) => entry.instanceOk)).toBe(true);
  expect(pageResults.every((entry) => entry.companyOk)).toBe(true);
  expect(result.posted).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.setupChanged).toBe(false);
});
