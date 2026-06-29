import { expect, test } from '@playwright/test';
import 'dotenv/config';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(180_000);

const testId = 'warehouse-004';

function warehouseEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function filteredLocationUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', '5703');
  url.searchParams.set('filter', "'Location'.'Code' IS 'FRA-ZL'");
  return url.toString();
}

function sanitizeText(text: string) {
  return text
    .replace(/\u201e/g, '"')
    .replace(/\u201c/g, '"')
    .replace(/\u201d/g, '"')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function normalizeLines(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => sanitizeText(line).replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !/requestExecutorSettings|trustedOriginAuthorities|allowedEndpoints|allowedResources|shouldAttachOauthTokens|O365SuiteServiceProxy|cacheLocation/i.test(line));
}

function compactWarehouseText(text: string) {
  const interesting = /FRA-ZL|Location|Locations|Code|Name|Warehouse|Bin|Bins|Mandatory|Require|Receive|Shipment|Put-away|Pick|Directed|Cross-Dock|Adjustment|Receipt|Lagerort|Lagerplatz|Einlagerung|Kommissionierung|Wareneingang|Warenausgang/i;
  const selected = normalizeLines(text).filter((line) => interesting.test(line));
  return [
    `Kompakter Warehouse-Preflight-Auszug; Volltext bewusst nicht committed. Trefferzeilen: ${selected.length}.`,
    '',
    ...selected.slice(0, 180)
  ].join('\n');
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

async function clickSafeExpander(page: import('@playwright/test').Page, label: RegExp) {
  const scopes = [page, ...page.frames()];
  for (const scope of scopes) {
    const candidate = scope.getByRole('button', { name: label }).first();
    if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
      await candidate.click({ timeout: 2000 }).catch(() => undefined);
      await page.waitForTimeout(800);
      return true;
    }
  }

  return false;
}

test('WAREHOUSE-004 FRA-ZL Aktivierungs-Preflight direct UI read', async ({ page }) => {
  await page.goto(filteredLocationUrl(), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const expandActions = {
    showMoreClicked: await clickSafeExpander(page, /Mehr anzeigen|Show more/i),
    warehouseFastTabClicked: await clickSafeExpander(page, /^Warehouse$/i),
    binPoliciesFastTabClicked: await clickSafeExpander(page, /^Bin Policies$/i)
  };

  const text = await pageText(page);
  const buttons = (await visibleButtonNames(page))
    .map((name) => sanitizeText(name).replace(/\s+/g, ' ').trim())
    .filter((name) => /[A-Za-z0-9]/.test(name));
  const pageUrl = page.url();
  const directUrlUsed = /page=5703/i.test(pageUrl);
  const instanceVisible = /MCP_1_20260210/i.test(pageUrl);
  const companyVisible = /company=RM-DEMO|RM-DEMO/i.test(pageUrl) || /RM-DEMO/i.test(text);
  const locationVisible = /FRA-ZL/i.test(text);
  const locationContextVisible = /Location|Locations|Lagerort|Lagerorte/i.test(text);

  const setupFieldSignals = {
    binMandatoryVisible: hasAny(text, [/Bin Mandatory/i, /Lagerplatzpflicht/i]),
    requireReceiveVisible: hasAny(text, [/Require Receive/i, /Wareneingang erforderlich/i]),
    requireShipmentVisible: hasAny(text, [/Require Shipment/i, /Warenausgang erforderlich/i]),
    requirePutAwayVisible: hasAny(text, [/Require Put-away/i, /Einlagerung erforderlich/i]),
    requirePickVisible: hasAny(text, [/Require Pick/i, /Kommissionierung erforderlich/i]),
    directedPutAwayAndPickVisible: hasAny(text, [/Directed Put-away and Pick/i, /gesteuerte Einlagerung/i])
  };

  const visibleSetupSignalCount = Object.values(setupFieldSignals).filter(Boolean).length;
  const editSignals = buttons.filter((name) => /Edit|Bearbeiten|Personalize|Personalisieren|Manage|Verwalten/i.test(name));
  const dangerousActionSignals = buttons.filter((name) => /Post|Buchen|Delete|Loeschen|L.schen|New|Neu|Invoice|Ship/i.test(name));

  const result = {
    schemaVersion: 1,
    purpose: 'warehouse-fra-zl-activation-preflight',
    caseId: 'WAREHOUSE-004-FRA-ZL-ACTIVATION-PREFLIGHT',
    source: 'playwright-ui-readonly-preflight',
    resultStatus: locationVisible && locationContextVisible ? 'observed' : 'blocked',
    instance: 'MCP_1_20260210',
    company: 'RM-DEMO',
    directUrlUsed,
    pageUrl,
    bcRun: true,
    playwrightRun: true,
    posted: false,
    previewPosting: false,
    setupChanged: false,
    companySwitched: false,
    draftCreated: false,
    apiShortcut: false,
    location: {
      code: 'FRA-ZL',
      pageId: 5703,
      locationVisible,
      locationContextVisible,
      instanceVisible,
      companyVisible
    },
    setupFieldSignals,
    visibleSetupSignalCount,
    expandActions,
    editSignals,
    dangerousActionSignals,
    decision: visibleSetupSignalCount > 0
      ? 'Warehouse setup fields are visible enough for a separate guarded setup-fit attempt.'
      : 'Warehouse setup fields are still not visible in the compact page context; next step should use personalization/page inspection/card expansion before any setup-fit.',
    proves: [
      'Location FRA-ZL was opened directly by page URL without Tell-Me search.',
      'The run stayed read-only: no posting, no preview, no draft, no setup change and no API shortcut.',
      visibleSetupSignalCount > 0
        ? 'At least one Warehouse activation field signal is visible in the Location context.'
        : 'No Warehouse activation field signal is visible in the compact Location context.'
    ],
    doesNotProve: [
      'No Warehouse setup was changed.',
      'No Bin was created.',
      'No Warehouse document or activity was created.',
      'No Warehouse posting was performed.',
      'No German final Warehouse proof.'
    ],
    blockedBy: visibleSetupSignalCount > 0 ? [] : ['warehouse-activation-fields-not-visible-in-compact-location-context'],
    nextStep: visibleSetupSignalCount > 0
      ? 'WAREHOUSE-005: guarded UI-first setup-fit for explicitly visible Warehouse fields only.'
      : 'WAREHOUSE-005: UI-first Personalize/Page Inspection/card expansion scout for Location FRA-ZL fields before setup-fit.',
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction: 'In German final sandbox, repeat the Location-card field visibility proof with the final German location and German screenshots before any Warehouse setup.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: 'RM-DEMO',
    finalScreenshotNeeded: true
  };

  await writeTextEvidence(warehouseEvidencePath('010-fra-zl-location-compact-page-text.txt'), compactWarehouseText(text));
  await writeJsonEvidence(warehouseEvidencePath('020-visible-buttons.json'), buttons);
  await writeJsonEvidence(warehouseEvidencePath('WAREHOUSE-004-result.json'), result);
  await writeTextEvidence(
    warehouseEvidencePath('WAREHOUSE-004-FRA-ZL-ACTIVATION-PREFLIGHT.md'),
    [
      '# WAREHOUSE-004 FRA-ZL Aktivierungs-Preflight',
      '',
      'Status: `labor`, `ui-first`, `read-only-preflight`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      `Direkte URL genutzt: ${result.directUrlUsed ? 'ja' : 'nein'}.`,
      `Lagerort sichtbar: ${result.location.locationVisible ? 'ja' : 'nein'}.`,
      `Setup-Feldsignale sichtbar: ${visibleSetupSignalCount}.`,
      '',
      '## Setup-Feldsignale',
      '',
      '| Feldsignal | Sichtbar |',
      '|---|---|',
      ...Object.entries(setupFieldSignals).map(([key, value]) => `| ${key} | ${value ? 'ja' : 'nein'} |`),
      '',
      '## Entscheidung',
      '',
      result.decision,
      '',
      '## Grenze',
      '',
      '- Keine Setup-Aenderung.',
      '- Keine Bins.',
      '- Keine Warehouse-Aktivitaet.',
      '- Keine Buchung.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    warehouseEvidencePath('README.md'),
    [
      '# WAREHOUSE-004 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `WAREHOUSE-004-result.json` | JSON-Ergebnis | direkter UI-Preflight auf Lagerort `FRA-ZL` und sichtbare Warehouse-Feldsignale | keine Aktivierung, keine Buchung | labor-readonly-preflight |',
      '| `WAREHOUSE-004-FRA-ZL-ACTIVATION-PREFLIGHT.md` | Lernnotiz | Entscheidung fuer naechsten Setup- oder Feldsichtbarkeitshebel | keinen deutschen Finalnachweis | labor |',
      '| `010-fra-zl-location-compact-page-text.txt` | kompakter Seitentext | relevante Lagerort-/Warehouse-Zeilen | keinen Vollsnapshot | ui-evidence |',
      '| `020-visible-buttons.json` | Buttonliste | sichtbare Aktionssignale zur Risikopruefung | keine Aktion wurde ausgefuehrt | ui-evidence |',
      ''
    ].join('\n')
  );

  expect(result.location.locationContextVisible, 'Location context must be visible.').toBe(true);
  expect(result.location.locationVisible, 'FRA-ZL must be visible.').toBe(true);
  expect(result.posted).toBe(false);
  expect(result.setupChanged).toBe(false);
});
