import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import 'dotenv/config';
import { bcPageUrl, dismissTours, pageText, requireBcUrl, screenshot, searchFor, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

const testId = 'fixedassets-004';

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function listFilter(tableName: string, fieldName: string, value: string) {
  return `'${tableName}'.'${fieldName}' IS '${value}'`;
}

function pageUrl(pageId: number, filter?: string) {
  const url = new URL(bcPageUrl(pageId, project.envPrefix));
  if (filter) {
    url.searchParams.set('filter', filter);
  }
  return url.toString();
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/\u00c3\u0152/g, 'Ue')
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u2013/g, 'Oe')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u201e/g, 'Ae')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u0178/g, 'ss')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(text: string) {
  const interesting =
    /Fixed Asset|Fixed Assets|FA Ledger|FA Posting|Depreciation|Purchase Invoice|Purchase Invoices|Vendor|K30000|FA-CNC-01|HGB|MACHINES|CNC|Anlage|Anlagen|AfA|Abschreibung|Einkaufsrechnung|Kreditor|Buchungsgruppe|No\.|Code|Description|Name|Posting Group/i;
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

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 220)
  ].join('\n'));
}

function hasValue(text: string, value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text);
}

async function loadFixedAssetScenario() {
  const raw = await fs.readFile('playwright/projects/fibu-book5/testdata/masterdata/resources-assets-projects.json', 'utf8');
  const parsed = JSON.parse(raw) as {
    fixedAssets?: Array<{ no: string; description: string; acquisitionCost: number }>;
  };
  const asset = parsed.fixedAssets?.find((entry) => entry.no === 'FA-CNC-01');
  return {
    fixedAssetNo: asset?.no ?? 'FA-CNC-01',
    fixedAssetDescription: asset?.description ?? 'CNC-Anlage',
    acquisitionCost: asset?.acquisitionCost ?? 120000,
    depreciationBookCode: 'HGB',
    faPostingGroup: 'MACHINES',
    vendorNo: 'K30000',
    depreciationMethod: 'Linear',
    usefulLifeYears: 8,
    acquisitionPath: 'Purchase Invoice / Einkaufsrechnung',
    postingForbiddenInThisRun: true
  };
}

async function openFilteredPageAndCapture(
  page: Page,
  target: {
    id: string;
    pageId: number;
    filter: string;
    expectedContext: RegExp;
    searchedValue: string;
    screenshotFile: string;
    purpose: string;
  }
) {
  await page.goto(pageUrl(target.pageId, target.filter), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  const contextVisible = target.expectedContext.test(text);
  const targetValueVisible = hasValue(text, target.searchedValue);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const status = contextVisible ? 'labor' : 'rejected';

  await writeTextEvidence(fixedAssetsEvidencePath(`${target.id}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(fixedAssetsEvidencePath(`${target.id}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: contextVisible ? 'candidate' : 'rejected',
    bookUse: contextVisible ? 'evidence' : 'do-not-use',
    purpose: target.purpose,
    knownLimitations: [
      'Read-only Setup-Readiness in RM-DEMO / CRONUS USA.',
      'Gefilterte Listen beweisen Sichtbarkeit oder Fehlen im Labor, aber keine Anlage oder Einrichtung.',
      'Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Buchung.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ]
  });

  return {
    id: target.id,
    pageId: target.pageId,
    contextVisible,
    targetValueVisible,
    status,
    searchedValue: target.searchedValue,
    screenshot: `playwright/projects/${project.name}/img/${target.screenshotFile}`,
    textEvidence: `playwright/projects/${project.name}/evidence/${testId}/${target.id}-page-text.txt`,
    relevantButtons: buttons.filter((button) => /New|Neu|Edit|Bearbeiten|Posting|Buchung|Dimensions|Dimension/i.test(button)).slice(0, 40)
  };
}

async function clickFirstVisible(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link', 'option'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        if (await locator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(4000);
          return { clicked: true, method: `role:${role}` };
        }
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      if (await textLocator.click({ timeout: 5000 }).then(() => true).catch(() => false)) {
        await page.waitForTimeout(4000);
        return { clicked: true, method: 'text' };
      }
    }
  }

  return { clicked: false, method: undefined as string | undefined };
}

async function captureFaPostingGroupsTellMe(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await searchFor(page, 'FA Posting Groups');
  await page.waitForTimeout(1500);

  const tellMeText = await pageText(page);
  await writeTextEvidence(fixedAssetsEvidencePath('030-fa-posting-groups-tell-me-page-text.txt'), compactPageText(tellMeText));
  await screenshot(page, 'fixedassets-004-030-fa-posting-groups-tell-me.png', {
    projectName: project.name,
    testId,
    status: /FA Posting Group|FA Posting Groups|Anlagenbuchungsgruppe|Buchungsgruppe/i.test(tellMeText) ? 'candidate' : 'rejected',
    bookUse: 'evidence',
    purpose: 'FIXEDASSETS-004 alternativen UI-/Tell-Me-Pfad fuer Anlagenbuchungsgruppen suchen.',
    knownLimitations: ['Read-only Tell-Me-Pfad; kein Setup und keine Anlagenbuchungsgruppe angelegt.']
  });

  const clicked = await clickFirstVisible(page, /^FA Posting Groups$|^Anlagenbuchungsgruppen$/i);
  await dismissTours(page);
  await page.waitForTimeout(3000);

  const resultText = await pageText(page);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const contextVisible = /FA Posting Group|FA Posting Groups|Anlagenbuchungsgruppe|Buchungsgruppe/i.test(resultText);
  const targetValueVisible = /MACHINES/i.test(resultText);
  await writeTextEvidence(fixedAssetsEvidencePath('031-fa-posting-groups-result-page-text.txt'), compactPageText(resultText));
  await writeJsonEvidence(fixedAssetsEvidencePath('031-fa-posting-groups-result-buttons.json'), buttons);
  await screenshot(page, 'fixedassets-004-031-fa-posting-groups-result.png', {
    projectName: project.name,
    testId,
    status: contextVisible ? 'candidate' : 'rejected',
    bookUse: contextVisible ? 'evidence' : 'do-not-use',
    purpose: 'FIXEDASSETS-004 Ergebnis nach Klick auf FA Posting Groups pruefen.',
    knownLimitations: [
      'Read-only; kein MACHINES-Fit und keine Kontenpflege.',
      'Wenn der Zielkontext nicht sichtbar ist, bleibt der Pfad rejected und muss spaeter anders gesucht werden.'
    ]
  });

  return {
    id: '030-fa-posting-groups',
    tellMeCandidateVisible: /FA Posting Group|FA Posting Groups|Anlagenbuchungsgruppe|Buchungsgruppe/i.test(tellMeText),
    clicked,
    contextVisible,
    targetValueVisible,
    searchedValue: 'MACHINES',
    status: contextVisible ? 'labor' : 'rejected',
    screenshot: `playwright/projects/${project.name}/img/fixedassets-004-031-fa-posting-groups-result.png`,
    textEvidence: `playwright/projects/${project.name}/evidence/${testId}/031-fa-posting-groups-result-page-text.txt`,
    relevantButtons: buttons.filter((button) => /New|Neu|Edit|Bearbeiten|Posting|Buchung|Accounts|Konten/i.test(button)).slice(0, 40)
  };
}

test('FIXEDASSETS-004 Anlagen-Setup-Readiness read-only pruefen', async ({ page }) => {
  const scenario = await loadFixedAssetScenario();

  const fixedAsset = await openFilteredPageAndCapture(page, {
    id: '010-fixed-asset-fa-cnc-01',
    pageId: 5601,
    filter: listFilter('Fixed Asset', 'No.', scenario.fixedAssetNo),
    expectedContext: /Fixed Assets|Fixed Asset|Anlagen|Anlage/i,
    searchedValue: scenario.fixedAssetNo,
    screenshotFile: 'fixedassets-004-010-fixed-asset-fa-cnc-01.png',
    purpose: 'FIXEDASSETS-004 pruefen, ob Zielanlage FA-CNC-01 im Anlagenstamm bereits sichtbar ist.'
  });

  const depreciationBook = await openFilteredPageAndCapture(page, {
    id: '020-depreciation-book-hgb',
    pageId: 5611,
    filter: listFilter('Depreciation Book', 'Code', scenario.depreciationBookCode),
    expectedContext: /Depreciation Book|Depreciation Books|AfA|Abschreibung/i,
    searchedValue: scenario.depreciationBookCode,
    screenshotFile: 'fixedassets-004-020-depreciation-book-hgb.png',
    purpose: 'FIXEDASSETS-004 pruefen, ob AfA-Buch HGB im Labor bereits sichtbar ist.'
  });

  const faPostingGroups = await captureFaPostingGroupsTellMe(page);

  const vendor = await openFilteredPageAndCapture(page, {
    id: '040-vendor-k30000',
    pageId: 27,
    filter: listFilter('Vendor', 'No.', scenario.vendorNo),
    expectedContext: /Vendors|Vendor|Kreditoren|Kreditor/i,
    searchedValue: scenario.vendorNo,
    screenshotFile: 'fixedassets-004-040-vendor-k30000.png',
    purpose: 'FIXEDASSETS-004 pruefen, ob Zielkreditor K30000 fuer Anlagenzugang bereits sichtbar ist.'
  });

  const purchaseInvoices = await openFilteredPageAndCapture(page, {
    id: '050-purchase-invoices-entry-path',
    pageId: 9308,
    filter: listFilter('Purchase Header', 'Buy-from Vendor No.', scenario.vendorNo),
    expectedContext: /Purchase Invoices|Purchase Invoice|Einkaufsrechnung|Einkaufsrechnungen/i,
    searchedValue: scenario.vendorNo,
    screenshotFile: 'fixedassets-004-050-purchase-invoices-entry-path.png',
    purpose: 'FIXEDASSETS-004 Einkaufsrechnungspfad fuer spaeteren Anlagenzugang read-only pruefen.'
  });

  const checks = [fixedAsset, depreciationBook, faPostingGroups, vendor, purchaseInvoices];
  const missingTargets = [...new Set(checks.filter((check) => !check.targetValueVisible).map((check) => check.searchedValue))];

  const result = {
    testId: 'FIXEDASSETS-004',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-setup-readiness-no-posting-no-setup-change',
    scenario,
    checks,
    readiness: {
      fixedAssetExists: fixedAsset.targetValueVisible,
      depreciationBookExists: depreciationBook.targetValueVisible,
      faPostingGroupPathReached: faPostingGroups.contextVisible,
      faPostingGroupExists: faPostingGroups.targetValueVisible,
      vendorExists: vendor.targetValueVisible,
      purchaseInvoicePathReached: purchaseInvoices.contextVisible,
      missingTargets,
      readyForSetupFit: fixedAsset.contextVisible && depreciationBook.contextVisible && faPostingGroups.contextVisible && vendor.contextVisible,
      readyForPosting: false
    },
    safety: {
      posted: false,
      setupChanged: false,
      fixedAssetCreated: false,
      purchaseInvoiceCreated: false,
      depreciationCalculated: false
    },
    proves: [
      'Welche Anlagen-Zielobjekte in RM-DEMO bereits sichtbar sind oder fehlen.',
      'Ob der alternative FA-Posting-Groups-Pfad ueber Tell-Me besser ist als die rejected Page-ID 5606.',
      'Dass Kapitel 21 vor einer Anlagenbuchung zuerst Stammdaten, AfA-Buch, Anlagenbuchungsgruppe, Kreditor und Zugangspfad klaeren muss.'
    ],
    doesNotProve: [
      'Keine Anlage FA-CNC-01 wurde angelegt.',
      'Kein AfA-Buch HGB und keine Anlagenbuchungsgruppe MACHINES wurden eingerichtet.',
      'Keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Anlagenposten wurden gebucht.',
      'Kein deutscher HGB-/Kontenplan-Endstand.'
    ],
    nextStep:
      'FIXEDASSETS-005 als idempotenten UI-Setup-Fit nur vorbereiten oder ausfuehren, wenn fehlende Zielobjekte fachlich sicher angelegt werden sollen: zuerst FA-CNC-01 und K30000/Anlagenzugangsvoraussetzung, dann HGB/MACHINES-Kontenfindung, danach erst separater Buchungsfreigabe-Lauf.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-004-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-004-SETUP-READINESS.md'),
    [
      '# FIXEDASSETS-004 Anlagen-Setup-Readiness',
      '',
      'Status: `labor`, `read-only`, `setup-readiness`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Datenbasis | CRONUS USA |',
      '| Zielanlage | `FA-CNC-01` |',
      '| Zielbetrag | `120.000 EUR` |',
      '| Ziel-AfA-Buch | `HGB` |',
      '| Ziel-Anlagenbuchungsgruppe | `MACHINES` |',
      '| Zielkreditor | `K30000` |',
      '| Buchung in diesem Lauf | nein |',
      '',
      '## Ergebnis',
      '',
      '| Pruefpunkt | Seite/Pfad | Zielwert sichtbar | Bedeutung |',
      '|---|---|---:|---|',
      `| Anlage | Fixed Assets / Page 5601 | ${fixedAsset.targetValueVisible ? 'ja' : 'nein'} | Stammdatum fuer die spaetere Aktivierung |`,
      `| AfA-Buch | Depreciation Books / Page 5611 | ${depreciationBook.targetValueVisible ? 'ja' : 'nein'} | Bewertungs-/Abschreibungslogik |`,
      `| Anlagenbuchungsgruppe | Tell-Me FA Posting Groups | ${faPostingGroups.targetValueVisible ? 'ja' : 'nein'} | Kontenfindung fuer Anlagenzugang und AfA |`,
      `| Kreditor | Vendors / Page 27 | ${vendor.targetValueVisible ? 'ja' : 'nein'} | Lieferant fuer Einkaufsrechnung |`,
      `| Einkaufsrechnungspfad | Purchase Invoices / Page 9308 | ${purchaseInvoices.contextVisible ? 'ja' : 'nein'} | moeglicher Zugangspfad; noch kein Beleg |`,
      '',
      '## Anfaenger-Lernwert',
      '',
      'Anlagenbuchhaltung ist kein einzelner Button. Eine Anlage wird erst buchungsfaehig, wenn Stammdatum, AfA-Buch, Anlagenbuchungsgruppe, Zugangspfad und Kontenfindung zusammenpassen. Eine leere gefilterte Liste ist dabei kein technischer Fehler: Sie zeigt, dass das Zielobjekt noch nicht als Laborstammdatum existiert oder nicht ueber diesen Pfad sichtbar ist.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 braucht vor der ersten bebilderten Anlagenbuchung eine Setup-Checkliste: Zielanlage `FA-CNC-01`, AfA-Buch `HGB`, Anlagenbuchungsgruppe `MACHINES`, Kreditor `K30000`, Zugangsbetrag `120.000 EUR`, danach erst Einkaufsrechnung/Aktivierung und Postenspur. Dieser Lauf liefert Readiness-Evidence, aber noch kein finales Prozessbild.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor, gemischte UI, kein deutscher HGB-/Kontenplan-Endstand.',
      '- Keine Anlage, keine Einkaufsrechnung, keine Aktivierung, keine AfA und keine Buchung.',
      '- Fehlende Zielwerte duerfen im Buch nicht als vorhanden behauptet werden.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep
    ].join('\n')
  );

  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-004 Evidence-Index',
      '',
      'Status: `labor`, `read-only`, `setup-readiness`, `no-posting`, `no-setup-change`, `not-final`.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-004-result.json` | JSON-Ergebnis | strukturierte Readiness fuer Anlage, AfA-Buch, Anlagenbuchungsgruppe, Kreditor, Einkaufsrechnungspfad | keine Anlage und keine Buchung | labor |',
      '| `FIXEDASSETS-004-SETUP-READINESS.md` | Lernzusammenfassung | Anfaengererklaerung und Buchwirkung fuer Kapitel 21 | keinen deutschen Finalnachweis | labor |',
      '| `010-fixed-asset-fa-cnc-01-page-text.txt` | Seitentext | gefilterte Anlagenliste fuer `FA-CNC-01` | keine Anlageanlage | labor-readiness |',
      '| `020-depreciation-book-hgb-page-text.txt` | Seitentext | gefilterte AfA-Buecher fuer `HGB` | keine AfA-Einrichtung | labor-readiness |',
      '| `030-fa-posting-groups-tell-me-page-text.txt` | Seitentext | alternativer Tell-Me-Pfad fuer Anlagenbuchungsgruppen | keine Kontenfindung | labor-readiness |',
      '| `031-fa-posting-groups-result-page-text.txt` | Seitentext | Ergebnis nach Klickversuch auf FA Posting Groups | keinen `MACHINES`-Fit | labor/rejected |',
      '| `040-vendor-k30000-page-text.txt` | Seitentext | gefilterte Kreditorenliste fuer `K30000` | keine Einkaufsrechnung | labor-readiness |',
      '| `050-purchase-invoices-entry-path-page-text.txt` | Seitentext | Einkaufsrechnungspfad als Zugangskandidat | keine Aktivierung | labor-readiness |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen je Bild | keine eigenstaendige fachliche Wahrheit ohne JSON/Markdown | mixed |',
      '',
      '## Kernaussage',
      '',
      result.nextStep
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(checks.some((check) => check.contextVisible)).toBe(true);
});
