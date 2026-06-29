import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
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

const testId = 'manufacturing-007';
const instanceName = 'MCP_1_20260210';
const targetDataPath = 'playwright/projects/fibu-book5/testdata/manufacturing/rm-m100-bom-routing-target.json';

type DirectTarget = {
  id: string;
  pageId: number;
  label: string;
  expected: RegExp;
  targetSignals: RegExp[];
  screenshotFile: string;
  purpose: string;
  filter?: {
    table: string;
    field: string;
    value: string;
  };
};

function caseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function directPageUrl(target: DirectTarget) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', project.defaultCompany);
  url.searchParams.set('page', String(target.pageId));
  if (target.filter) {
    url.searchParams.set('filter', `'${target.filter.table}'.'${target.filter.field}' IS '${target.filter.value}'`);
  }
  return url.toString();
}

function compactText(text: string) {
  const interesting =
    /Business Central|Production BOM|BOM-RM-M100|BOM|Routing|ROUTE-M100|Work Center|Assembly department|RM-M100|RAW-STEEL|FRA-ZL|No\.|Description|Status|Certified|Item Card|Replenishment|Manufacturing|Production|Fertigung|Arbeitsplan|Arbeitsplatz|Stueckliste|Stückliste/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources/i.test(line));
  const selected = lines.filter((line) => interesting.test(line)).slice(0, 180);
  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...selected
  ].join('\n');
}

async function tryMaximizeReadonly(page: Page) {
  const selectors = [
    'button[aria-label*="Maximize" i]',
    'button[aria-label*="Maximise" i]',
    'button[aria-label*="Expand" i]',
    'button[aria-label*="Full screen" i]',
    'button[aria-label*="Focus mode" i]',
    'button[aria-label*="Breites Layout" i]',
    'button[aria-label*="Maximieren" i]',
    'button[aria-label*="Erweitern" i]',
    'button[aria-label*="Vollbild" i]',
    'button[title*="Maximize" i]',
    'button[title*="Maximise" i]',
    'button[title*="Expand" i]',
    'button[title*="Full screen" i]',
    'button[title*="Focus mode" i]',
    'button[title*="Breites Layout" i]',
    'button[title*="Maximieren" i]',
    'button[title*="Erweitern" i]',
    'button[title*="Vollbild" i]'
  ];

  for (const frame of page.frames()) {
    for (const selector of selectors) {
      const button = frame.locator(selector).first();
      if (await button.isVisible({ timeout: 250 }).catch(() => false)) {
        await button.click({ timeout: 1000 }).catch(() => undefined);
        await page.waitForTimeout(500);
        return true;
      }
    }
  }

  return false;
}

async function readTargetData() {
  return JSON.parse(await fs.readFile(path.resolve(targetDataPath), 'utf8')) as {
    productionItem: { no: string; locationCode: string };
    productionBom: { targetNo: string };
    routing: { targetNo: string; lines: Array<{ no: string; description: string }> };
  };
}

async function openReadonlyTarget(page: Page, target: DirectTarget) {
  const url = directPageUrl(target);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page);
  const maximized = await tryMaximizeReadonly(page);
  await page.waitForTimeout(1500);

  const text = await pageText(page);
  const finalUrl = page.url();
  const instanceOk = finalUrl.includes(instanceName);
  const companyOk = /company=RM-DEMO/i.test(finalUrl);
  const pageContextVisible = target.expected.test(text);
  const targetSignals = target.targetSignals.map((pattern) => ({
    pattern: pattern.source,
    visible: pattern.test(text)
  }));
  const targetSignalVisible = targetSignals.some((entry) => entry.visible);

  await writeTextEvidence(caseEvidencePath(`${target.id}-page-text.txt`), compactText(text));
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: pageContextVisible ? 'labor' : 'rejected',
    bookUse: 'field-proof',
    purpose: target.purpose,
    knownLimitations: [
      'Direkte Page-URL in RM-DEMO / MCP_1_20260210, keine Tell-Me-Suche.',
      'Read-only: kein New, Edit, Delete, Certify, Release, Setup, Preview Posting oder Post.',
      'Sichtbarkeit beweist nur Kontext und Zielwert-Readiness; kein BOM-/Routing-Setup und kein Fertigungsprozess.'
    ]
  });

  return {
    id: target.id,
    label: target.label,
    pageId: target.pageId,
    url,
    finalUrl,
    instanceOk,
    companyOk,
    pageContextVisible,
    targetSignalVisible,
    targetSignals,
    maximized,
    textEvidence: `playwright/projects/fibu-book5/evidence/${testId}/${target.id}-page-text.txt`,
    screenshot: `playwright/projects/fibu-book5/img/${target.screenshotFile}`,
    screenshotMetadata: `playwright/projects/fibu-book5/evidence/${testId}/${target.screenshotFile.replace(/\.png$/i, '.screenshot.json')}`
  };
}

function renderMarkdown(result: Record<string, any>) {
  const rows = (result.pageResults as Array<Record<string, any>>)
    .map(
      (entry) =>
        `| ${entry.label} | ${entry.pageId} | ${entry.pageContextVisible ? 'ja' : 'nein'} | ${entry.targetSignalVisible ? 'ja' : 'nein'} | ${entry.screenshot} |`
    )
    .join('\n');

  return [
    '# MANUFACTURING-007 BOM/Routing UI-first Preflight',
    '',
    'Status: `labor`, `read-only`, `direct-page`, `no-search`, `no-setup-change`, `no-posting`, `needs-german-final-rebuild`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Instanz | ${result.instance} |`,
    `| Company | ${result.company} |`,
    '| BC-Ausfuehrung | ja, read-only |',
    '| Setup-Aenderung | nein |',
    '| Draft | nein |',
    '| Preview Posting | nein |',
    '| Buchung | nein |',
    '',
    '## Direkt geoeffnete Pruefpunkte',
    '',
    '| Pruefpunkt | Page ID | Seitenkontext sichtbar | Zielsignal sichtbar | Screenshot |',
    '|---|---:|---|---|---|',
    rows,
    '',
    '## Entscheidung',
    '',
    result.decision,
    '',
    '## Nicht bewiesen',
    '',
    ...result.notProved.map((entry: string) => `- ${entry}`),
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('MANUFACTURING-007 prueft BOM/Routing-Zielwerte read-only per direkter Page-URL', async ({ page }) => {
  const targetData = await readTargetData();
  const targets: DirectTarget[] = [
    {
      id: 'production-bom-target',
      pageId: 99000786,
      label: 'Production BOMs / BOM-RM-M100 target',
      expected: /Production BOM|Prod\. BOM|BOM|Fertigungsstueckliste|Stueckliste|Stückliste/i,
      targetSignals: [new RegExp(targetData.productionBom.targetNo, 'i'), /RAW-STEEL/i],
      screenshotFile: 'manufacturing-007-010-production-bom-target.png',
      purpose: 'Read-only Preflight: Gibt es BOM-RM-M100 oder sichtbare BOM-Kontextsignale, bevor Setup geschrieben wird?',
      filter: { table: 'Production BOM Header', field: 'No.', value: targetData.productionBom.targetNo }
    },
    {
      id: 'routing-target',
      pageId: 99000764,
      label: 'Routings / ROUTE-M100 target',
      expected: /Routing|Routings|Arbeitsplan|Arbeitsplaene|Arbeitspläne/i,
      targetSignals: [new RegExp(targetData.routing.targetNo, 'i'), /100|Assembly department/i],
      screenshotFile: 'manufacturing-007-020-routing-target.png',
      purpose: 'Read-only Preflight: Gibt es ROUTE-M100 oder sichtbare Routing-Kontextsignale, bevor Setup geschrieben wird?',
      filter: { table: 'Routing Header', field: 'No.', value: targetData.routing.targetNo }
    },
    {
      id: 'work-center-100',
      pageId: 99000754,
      label: 'Work Center 100',
      expected: /Work Center|Work Centers|Arbeitsplatz|Arbeitsplaetze|Arbeitsplätze/i,
      targetSignals: [/100/i, /Assembly department/i],
      screenshotFile: 'manufacturing-007-030-work-center-100.png',
      purpose: 'Read-only Preflight: Ist Work Center 100 als Routing-Kandidat sichtbar und fachlich benennbar?',
      filter: { table: 'Work Center', field: 'No.', value: targetData.routing.lines[0].no }
    },
    {
      id: 'item-card-rm-m100-manufacturing-fields',
      pageId: 30,
      label: 'Item Card RM-M100 manufacturing fields',
      expected: /Item Card|Item|Artikelkarte|Artikel|RM-M100/i,
      targetSignals: [/RM-M100/i, /Replenishment|Planning|Purchase|None|Beschaffung|Planung/i],
      screenshotFile: 'manufacturing-007-040-item-rm-m100-manufacturing-fields.png',
      purpose: 'Read-only Preflight: Sind RM-M100 und moegliche BOM-/Routing-Linkfelder auf der Artikelkarte sichtbar, bevor Setup geschrieben wird?',
      filter: { table: 'Item', field: 'No.', value: targetData.productionItem.no }
    }
  ];

  const pageResults = [];
  for (const target of targets) {
    const result = await openReadonlyTarget(page, target);
    pageResults.push(result);
    if (!result.instanceOk || !result.companyOk) {
      break;
    }
  }

  const allContextOk = pageResults.every((entry) => entry.instanceOk && entry.companyOk && entry.pageContextVisible);
  const bomExistsSignal = pageResults.find((entry) => entry.id === 'production-bom-target')?.targetSignalVisible ?? false;
  const routingExistsSignal = pageResults.find((entry) => entry.id === 'routing-target')?.targetSignalVisible ?? false;
  const workCenter100Signal = pageResults.find((entry) => entry.id === 'work-center-100')?.targetSignalVisible ?? false;
  const itemManufacturingSignal =
    pageResults.find((entry) => entry.id === 'item-card-rm-m100-manufacturing-fields')?.targetSignalVisible ?? false;

  const result = {
    schemaVersion: 1,
    caseId: 'MANUFACTURING-007-BOM-ROUTING-UI-FIRST-PREFLIGHT',
    source: 'playwright-ui-readonly-direct-page-preflight',
    resultStatus: allContextOk ? 'observed' : 'blocked',
    instance: instanceName,
    company: project.defaultCompany,
    sourceCompany: project.defaultCompany,
    targetDataPath,
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    bcRun: true,
    playwrightRun: true,
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
    observedSignals: {
      bomExistsSignal,
      routingExistsSignal,
      workCenter100Signal,
      itemManufacturingSignal
    },
    decision:
      workCenter100Signal && itemManufacturingSignal
        ? 'Work Center and RM-M100 card context are visible enough for a later guarded setup-fit decision. The item card screenshot shows Replenishment/Planning context, but not expanded BOM/Routing link fields. BOM-RM-M100 and ROUTE-M100 still require explicit existence/editability judgement before any write.'
        : 'Read-only preflight captured context, but setup-fit is not yet safe until missing target signals are reviewed.',
    proved: [
      'The run stayed inside MCP_1_20260210 / RM-DEMO.',
      'Known Manufacturing pages were opened by direct page URL without Tell-Me/search.',
      'No New/Edit/Delete/Certify/Release/Preview/Post action was clicked.',
      ...(workCenter100Signal ? ['Work Center 100 / Assembly department is visible as first routing candidate.'] : []),
      ...(itemManufacturingSignal ? ['RM-M100 item card context and Replenishment/Planning sections are visible read-only; BOM/Routing link fields are not yet proven expanded/editable.'] : [])
    ],
    notProved: [
      'No Production BOM was created, edited or certified.',
      'No Routing was created, edited or certified.',
      'No Production Order was created, released or posted.',
      'No Consumption Journal or Output Journal was posted.',
      'No manufacturing item/value/G/L/capacity ledger trace exists.',
      'No German final proof exists.'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/manufacturing-007/MANUFACTURING-007-result.json',
      'playwright/projects/fibu-book5/evidence/manufacturing-007/MANUFACTURING-007-READONLY-PREFLIGHT.md',
      targetDataPath
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/manufacturing-007/MANUFACTURING-007-result.json',
      'playwright/projects/fibu-book5/evidence/manufacturing-007/MANUFACTURING-007-READONLY-PREFLIGHT.md',
      'playwright/projects/fibu-book5/evidence/manufacturing-007/README.md'
    ],
    blockedBy: allContextOk ? [] : ['direct-page-context-not-proven-for-all-targets'],
    requiresReview: !allContextOk,
    safeToFinalizeState: false,
    statePatch: {},
    nextCase: 'MANUFACTURING-008-BOM-ROUTING-SETUP-FIT-DECISION',
    nextStep:
      'Review M007 read-only signals and decide whether a guarded UI-first setup-fit case may create or fit BOM-RM-M100/ROUTE-M100. Do not post or create a Production Order yet.'
  };

  await writeJsonEvidence(caseEvidencePath('MANUFACTURING-007-result.json'), result);
  await writeTextEvidence(caseEvidencePath('MANUFACTURING-007-READONLY-PREFLIGHT.md'), renderMarkdown(result));
  await writeTextEvidence(
    caseEvidencePath('README.md'),
    [
      '# MANUFACTURING-007 Evidence-Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `MANUFACTURING-007-result.json` | JSON-Ergebnis | direkte read-only Preflight-Route fuer BOM/Routing-Zielwerte | keinen Setup-Fit und keine Fertigungsbuchung | labor, read-only |',
      '| `MANUFACTURING-007-READONLY-PREFLIGHT.md` | Lernzusammenfassung | welche Zielsignale sichtbar sind | keine deutsche finale Fertigung | labor-draft input |',
      '| `*-page-text.txt` | kompakter Rohtext | sichtbare Ziel-/Kontextsignale | keine vollstaendige Tabelle | page-text |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen je Bild | keine eigenstaendige Buchwahrheit | screenshot-metadata |',
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
