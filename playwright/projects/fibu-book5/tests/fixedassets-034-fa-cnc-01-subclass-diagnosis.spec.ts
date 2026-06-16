import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import { mkdir, readdir, rm, unlink } from 'node:fs/promises';
import path from 'node:path';
import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText
} from '../../../core/bc-helpers';
import { clickBcTopIconAction } from '../../../core/bc/actions';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(360_000);

const testId = 'fixedassets-034';
const projectRoot = path.join('playwright', 'projects', project.name);
const evidenceDir = path.join(projectRoot, 'evidence', testId);

const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  fixedAssetNo: 'FA-CNC-01',
  faSubclassCode: 'EQUIPMENT'
};

const cardCaptions = [
  'No.',
  'Description',
  'FA Class Code',
  'FA Subclass Code',
  'Depreciation Book Code',
  'Posting Group',
  'Depreciation Starting Date',
  'No. of Depreciation Years',
  'Depreciation Ending Date',
  'Book Value'
];

type CardRow = {
  caption: string;
  selectedValue: string;
  diagnosis: string;
  editable: boolean;
};

type LookupCandidate = {
  scope: string;
  text: string;
  aria: string;
  title: string;
  role: string;
  tagName: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${target.fixedAssetNo}'`);
  return url.toString();
}

function faLedgerEntriesUrl() {
  const url = new URL(bcPageUrl(5604, project.envPrefix));
  url.searchParams.set('filter', `'FA Ledger Entry'.'FA No.' IS '${target.fixedAssetNo}'`);
  return url.toString();
}

function normalizeValue(value: string) {
  return value.replace(/\s+/g, ' ').trim().toUpperCase();
}

async function prepareRunArtifacts() {
  await rm(evidenceDir, { recursive: true, force: true });
  await mkdir(evidenceDir, { recursive: true });
  const imgDir = path.join(projectRoot, 'img');
  await mkdir(imgDir, { recursive: true });
  const existingImages = await readdir(imgDir).catch(() => []);
  await Promise.all(
    existingImages
      .filter((fileName) => fileName.startsWith(`${testId}-`))
      .map((fileName) => unlink(path.join(imgDir, fileName)).catch(() => undefined))
  );
}

async function assertRmDemoContext(page: Page) {
  const body = await pageText(page);
  const url = decodeURIComponent(page.url());
  const issues: string[] = [];
  if (!url.includes(target.environment)) issues.push(`URL enthaelt nicht ${target.environment}`);
  if (!/company=RM-DEMO/i.test(url)) issues.push('URL enthaelt nicht company=RM-DEMO');
  if (!/Rhein-Main Demo GmbH|RM-DEMO|MCP_1_20260210/i.test(body)) {
    issues.push('RM-DEMO ist im sichtbaren Seitentext nicht nachweisbar');
  }
  expect(issues, issues.join('\n')).toEqual([]);
  return { url, textOk: issues.length === 0 };
}

async function findFixedAssetCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book/i.test(text)) {
      return frame;
    }
  }
  return page.mainFrame();
}

async function openExistingAssetCard(page: Page) {
  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Fixed Asset Card/i, { timeout: 60_000 });
  await waitForPageText(page, /\bFA-CNC-01\b/i, { timeout: 30_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
}

async function readVisibleCardRows(page: Page, captions: string[]): Promise<CardRow[]> {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate((captionValues) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const controls = Array.from(document.querySelectorAll<HTMLElement>('input,textarea,select,a,span,[role="textbox"],[aria-label]'))
      .filter((element) => visible(element))
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        const tagName = element.tagName.toUpperCase();
        const input = element as HTMLInputElement;
        const value =
          tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
            ? normalize(input.value)
            : normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title'));
        return {
          index,
          tagName,
          value,
          aria: normalize(element.getAttribute('aria-label')),
          title: normalize(element.getAttribute('title')),
          editable: tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || element.isContentEditable,
          rect
        };
      });

    return captionValues.map((caption) => {
      const escaped = caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactCaption = new RegExp(`^${escaped}$`, 'i');
      const labels = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
        .filter((element) => visible(element))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: normalize(element.innerText || element.textContent),
            aria: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            rect
          };
        })
        .filter((entry) => exactCaption.test(entry.text) || exactCaption.test(entry.aria) || exactCaption.test(entry.title))
        .filter((entry) => entry.rect.y > 150 && entry.rect.x > 50 && entry.rect.x < 1700)
        .sort((left, right) => left.y - right.y || left.x - right.x);

      const label = labels[0];
      if (!label) {
        return { caption, selectedValue: '', diagnosis: 'caption-not-visible', editable: false };
      }

      const sameRowControls = controls
        .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 18)
        .filter((control) => control.rect.x > label.rect.x)
        .filter((control) => control.rect.x - label.rect.x < 900)
        .sort((left, right) => left.rect.x - right.rect.x);
      const valueControl = sameRowControls.find((control) => control.value && !new RegExp(caption, 'i').test(control.value));
      return {
        caption,
        selectedValue: valueControl?.value ?? '',
        diagnosis: sameRowControls.length ? 'visible-card-row-control' : 'caption-visible-no-row-control',
        editable: sameRowControls.some((control) => control.editable)
      };
    });
  }, captions);
}

async function clickSubclassLookup(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate((caption) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const exactCaption = new RegExp(`^${caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const label = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          text: normalize(element.innerText || element.textContent),
          aria: normalize(element.getAttribute('aria-label')),
          title: normalize(element.getAttribute('title')),
          rect
        };
      })
      .filter((entry) => exactCaption.test(entry.text) || exactCaption.test(entry.aria) || exactCaption.test(entry.title))
      .filter((entry) => entry.rect.y > 150 && entry.rect.x > 50 && entry.rect.x < 1250)
      .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x)[0];

    if (!label) return { clicked: false, reason: 'caption-not-found' };

    const picker = Array.from(document.querySelectorAll<HTMLElement>('a,button,[role="button"],[aria-label],[title]'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        return { element, text, aria, title, rect };
      })
      .filter((entry) => Math.abs(entry.rect.y - label.rect.y) <= 14)
      .filter((entry) => entry.rect.x > label.rect.x)
      .filter((entry) => entry.rect.x - label.rect.x < 820)
      .filter((entry) => /FA Subclass Code|Unterklasse/i.test([entry.text, entry.aria, entry.title].join(' ')))
      .sort((left, right) => right.rect.x - left.rect.x)[0];

    if (!picker) return { clicked: false, reason: 'picker-not-found' };
    picker.element.click();
    return {
      clicked: true,
      text: picker.text,
      aria: picker.aria,
      title: picker.title,
      x: Math.round(picker.rect.x),
      y: Math.round(picker.rect.y),
      width: Math.round(picker.rect.width),
      height: Math.round(picker.rect.height)
    };
  }, 'FA Subclass Code');
}

async function collectVisibleLookupCandidates(page: Page): Promise<LookupCandidate[]> {
  const scopes: Array<{ name: string; frame: Page | Frame }> = [
    { name: 'page', frame: page },
    ...page.frames().map((frame, index) => ({ name: `frame-${index}`, frame }))
  ];

  const result: LookupCandidate[] = [];
  for (const scope of scopes) {
    const entries = await scope.frame
      .locator('body')
      .evaluate((body, scopeName) => {
        const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(body.querySelectorAll<HTMLElement>('tr,li,button,a,span,div,[role="row"],[role="option"],[aria-label],[title]'))
          .filter((element) => visible(element))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              scope: scopeName,
              text: normalize(element.innerText || element.textContent),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              role: normalize(element.getAttribute('role')),
              tagName: element.tagName.toUpperCase(),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter((entry) => /EQUIPMENT|VEHICLE|COMPUTER|vollst|full list|FA Subclass|Unterklasse|Select|Wählen/i.test(
            [entry.text, entry.aria, entry.title, entry.role].join(' ')
          ))
          .slice(0, 80);
      }, scope.name)
      .catch(() => []);
    result.push(...entries);
  }
  return result;
}

async function selectVisibleEquipment(page: Page) {
  const targetPattern = /^EQUIPMENT$/i;
  const scopes: Array<Page | Frame> = [page, ...page.frames()];
  for (const scope of scopes) {
    const candidates = [
      scope.getByRole('row', { name: /EQUIPMENT/i }),
      scope.getByRole('option', { name: /EQUIPMENT/i }),
      scope.getByText(targetPattern)
    ];
    for (const locator of candidates) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);
        if (!(await candidate.isVisible({ timeout: 500 }).catch(() => false))) continue;
        const selected = await candidate
          .dblclick({ timeout: 4000 })
          .then(() => true)
          .catch(async () => candidate.click({ timeout: 4000 }).then(() => true).catch(() => false));
        if (selected) {
          await page.waitForTimeout(1000);
          await page.keyboard.press('Enter').catch(() => undefined);
          await page.keyboard.press('Tab').catch(() => undefined);
          await page.waitForTimeout(1500);
          return { selected: true, locatorIndex: index };
        }
      }
    }
  }
  return { selected: false };
}

function renderRows(rows: CardRow[]) {
  return [
    '| Caption | sichtbarer Wert | Diagnose | editierbar |',
    '|---|---|---|---:|',
    ...rows.map((row) => `| ${row.caption} | ${row.selectedValue || '(leer/nicht sichtbar)'} | ${row.diagnosis} | ${row.editable ? 'ja' : 'nein'} |`)
  ].join('\n');
}

test('FIXEDASSETS-034 diagnoses FA-CNC-01 subclass lookup without posting', async ({ page }) => {
  await prepareRunArtifacts();

  await openExistingAssetCard(page);
  const context = await assertRmDemoContext(page);
  const beforeRows = await readVisibleCardRows(page, cardCaptions);
  const beforeSubclass = beforeRows.find((row) => row.caption === 'FA Subclass Code')?.selectedValue ?? '';
  const beforeSubclassFit = normalizeValue(beforeSubclass) === target.faSubclassCode;
  await writeJsonEvidence(fixedAssetsEvidencePath('010-before-subclass-diagnosis.json'), beforeRows);
  await writeTextEvidence(fixedAssetsEvidencePath('010-card-before-subclass-diagnosis.txt'), await compactPageText(page, {
    include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|FA Class|FA Subclass|Depreciation|Posting Group|Book Value/i],
    maxLines: 80
  }));
  await screenshot(page, `${testId}-010-card-before-subclass-diagnosis.png`, {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: beforeSubclassFit ? 'field-fit-before' : 'field-blocker-before',
    purpose: beforeSubclassFit
      ? 'FIXEDASSETS-034 Start: bestehende FA-CNC-01-Karte zeigt FA Subclass Code EQUIPMENT bereits sichtbar.'
      : 'FIXEDASSETS-034 Start: bestehende FA-CNC-01-Karte zeigt den Subclass-Blocker vor der Diagnose.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Fixed Asset Card|FA Subclass Code/i],
    knownLimitations: ['Kein Anlagenzugang, keine AfA, keine Buchung.']
  });

  await page.goto(faLedgerEntriesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /FA Ledger Entries|Entry No\.|Document No\./i, { timeout: 60_000 });
  const faLedgerText = await compactPageText(page, {
    include: [/FA-CNC-01|Entry No\.|Document No\.|Amount|Depreciation Book|There is nothing/i],
    maxLines: 40
  });
  const hasTargetLedgerTrace = /FA-CNC-01/i.test(faLedgerText) && /Amount|Document No\./i.test(faLedgerText);
  await writeTextEvidence(fixedAssetsEvidencePath('020-fa-ledger-entries-safety.txt'), faLedgerText);
  expect(hasTargetLedgerTrace, 'Vor Subclass-Diagnose duerfen keine FA Ledger Entries zu FA-CNC-01 sichtbar sein.').toBe(false);

  if (beforeSubclassFit) {
    await openExistingAssetCard(page);
    const finalRows = await readVisibleCardRows(page, cardCaptions);
    const finalSubclass = finalRows.find((row) => row.caption === 'FA Subclass Code')?.selectedValue ?? '';
    const subclassFit = normalizeValue(finalSubclass) === target.faSubclassCode;
    await writeJsonEvidence(fixedAssetsEvidencePath('030-edit-mode-subclass-diagnostics.json'), {
      beforeSubclassFit,
      skipped: true,
      reason: 'FA Subclass Code war beim idempotenten Rerun bereits EQUIPMENT; kein erneuter Edit-/Lookup-Pfad noetig.'
    });
    await writeJsonEvidence(fixedAssetsEvidencePath('040-subclass-lookup-candidates.json'), {
      beforeSubclassFit,
      lookupClick: { clicked: false, skippedReason: 'already-fit-before-lookup' },
      lookupCandidates: []
    });
    await writeTextEvidence(
      fixedAssetsEvidencePath('040-subclass-lookup-page-text.txt'),
      'FA Subclass Code war vor dem erneuten Lookup bereits EQUIPMENT; Lookup wurde im idempotenten Rerun nicht erneut erzwungen.\n'
    );
    await screenshot(page, `${testId}-040-subclass-lookup-open.png`, {
      projectName: project.name,
      testId,
      status: 'labor',
      bookUse: 'field-fit-idempotent',
      purpose: 'FIXEDASSETS-034 Lookup: idempotenter Rerun, FA Subclass Code EQUIPMENT ist bereits sichtbar; kein erneuter Lookup noetig.',
      expectedPageText: [/\bFA-CNC-01\b|EQUIPMENT|FA Subclass Code/i],
      knownLimitations: ['Das Bild zeigt den bereits passenden Feldzustand, keinen erneuten Auswahlklick.']
    });
    await writeJsonEvidence(fixedAssetsEvidencePath('050-subclass-selection-result.json'), {
      selection: { selected: false, skippedReason: 'already-fit-before-lookup' },
      finalSubclass,
      subclassFit,
      finalRows
    });
    await writeTextEvidence(fixedAssetsEvidencePath('050-final-card-text.txt'), await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|FA Class|FA Subclass|Depreciation|Posting Group|Book Value/i],
      maxLines: 100
    }));
    await screenshot(page, `${testId}-050-final-subclass-state.png`, {
      projectName: project.name,
      testId,
      status: subclassFit ? 'candidate' : 'rejected',
      bookUse: subclassFit ? 'master-data-field-proof' : 'field-blocker-final',
      purpose: subclassFit
        ? 'FIXEDASSETS-034 Final: FA-CNC-01 zeigt FA Subclass Code EQUIPMENT sichtbar im idempotenten Rerun.'
        : 'FIXEDASSETS-034 Final: FA-CNC-01 zeigt den Subclass-Code weiterhin nicht passend.',
      expectedPageText: [/\bFA-CNC-01\b/i, /EQUIPMENT|FA Subclass Code/i],
      knownLimitations: ['Kein Anlagenzugang, keine AfA, keine Buchung.', 'Nur CRONUS-USA-Labor in RM-DEMO.', 'Dieses Bild zeigt Subclass und AfA-Zeilen; HGB/MACHINES werden durch FIXEDASSETS-033 ergaenzt.']
    });
    await writeTextEvidence(
      fixedAssetsEvidencePath('060-page-inspection-context.txt'),
      'Page Inspection wurde im idempotenten Rerun nicht erneut geoeffnet, weil der konkrete Subclass-Blocker bereits sichtbar geloest ist. Technischer Kartenkontext ist in FIXEDASSETS-023 belegt.\n'
    );

    const result = {
      testId: 'FIXEDASSETS-034-FA-CNC-01-SUBCLASS-FIELD-DIAGNOSIS',
      generatedAt: new Date().toISOString(),
      status: 'already-fit-labor-existing-card-subclass-no-posting',
      environment: target.environment,
      company: target.company,
      dataBasis: 'CRONUS USA',
      mode: 'ui-first-existing-fixed-asset-subclass-idempotent-verification',
      context,
      safety: {
        posted: false,
        vendorCreated: false,
        purchaseInvoiceCreated: false,
        acquisitionPosted: false,
        depreciationCalculatedOrPosted: false,
        faLedgerEntriesVisibleForTarget: hasTargetLedgerTrace
      },
      beforeSubclass,
      finalSubclass,
      subclassFit,
      finalRows,
      screenshots: [
        `${testId}-010-card-before-subclass-diagnosis.png`,
        `${testId}-040-subclass-lookup-open.png`,
        `${testId}-050-final-subclass-state.png`
      ],
      learning: 'FA Subclass Code EQUIPMENT ist im idempotenten Rerun bereits sichtbar gesetzt. Der erste erfolgreiche FIXEDASSETS-034-Versuch hat den vorher offenen Subclass-Blocker geloest; der wiederholte Lauf beweist die Persistenz ohne Buchung.',
      bookImpact: 'Kapitel 21 darf den Subclass-Korrekturpfad ergaenzen und FA-CNC-01 zusammen mit FIXEDASSETS-033 als CRONUS-USA-Labor-Stammdatensatz verwenden; Anschaffung, AfA und Postenspur bleiben getrennte Gates.',
      nextStep: 'FIXEDASSETS-035-K30000-VENDOR-READINESS-DECISION: ohne Buchung entscheiden, ob K30000 als naechste Schicht vorbereitet werden darf.'
    };
    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-034-result.json'), result);
    await writeTextEvidence(
      fixedAssetsEvidencePath('FIXEDASSETS-034-FA-CNC-01-SUBCLASS-DIAGNOSIS.md'),
      [
        '# FIXEDASSETS-034 - FA-CNC-01 Subclass Field Diagnosis',
        '',
        'Status: `already-fit-labor-existing-card-subclass-no-posting`, `ui-first`, `no-posting`, `not-final`, `de-final-open`.',
        '',
        '| Feld | Wert |',
        '|---|---|',
        `| Umgebung | ${target.environment} |`,
        `| Company | ${target.company} |`,
        '| Zielanlage | `FA-CNC-01` |',
        '| FA Subclass Code sichtbar | `EQUIPMENT` |',
        '| Lookup erneut erzwungen | nein, bereits fit |',
        '| Gebucht | nein |',
        '',
        '## Sichtbarer Kartenstand',
        '',
        renderRows(finalRows),
        '',
        '## Lernwert',
        '',
        result.learning,
        '',
        '## Buchwirkung',
        '',
        result.bookImpact,
        '',
        '## Grenzen',
        '',
        '- Nur CRONUS-USA-Labor in `RM-DEMO`.',
        '- Kein deutscher Anlagen-Finalnachweis.',
        '- Kein Kreditor, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
        '',
        '## Naechster Schritt',
        '',
        result.nextStep,
        ''
      ].join('\n')
    );
    await writeTextEvidence(
      fixedAssetsEvidencePath('README.md'),
      [
        '# FIXEDASSETS-034 Evidence Index',
        '',
        '| Datei | Typ | Beweist | Beweist nicht | Status |',
        '|---|---|---|---|---|',
        '| `FIXEDASSETS-034-result.json` | JSON | Subclass-Persistenz, Safety, finaler Kartenwert | keinen Zugang, keine AfA, keine deutsche Finalitaet | labor |',
        '| `FIXEDASSETS-034-FA-CNC-01-SUBCLASS-DIAGNOSIS.md` | Markdown | Lernwert, Buchwirkung, naechster Schritt | keine Buchung | labor |',
        '| `050-subclass-selection-result.json` | JSON | finaler Subclass-Wert im idempotenten Rerun | keinen erneuten Auswahlklick | field-proof |',
        '| `060-page-inspection-context.txt` | Text | warum Page Inspection im Rerun nicht erneut genutzt wurde | kein neuer technischer Page-Nachweis | technical-reference |',
        '| `fixedassets-034-010-card-before-subclass-diagnosis.screenshot.json` | Screenshot-Metadaten | Company, Laborstatus, Kartenkontext vor/bei Subclass-Pruefung | keinen finalen deutschen Anlagenbeleg | candidate |',
        '| `fixedassets-034-040-subclass-lookup-open.screenshot.json` | Screenshot-Metadaten | dokumentiert den Subclass-/Kartenkontext aus dem Diagnosepfad | keine HGB/MACHINES-Vollansicht | candidate |',
        '| `fixedassets-034-050-final-subclass-state.screenshot.json` | Screenshot-Metadaten | final sichtbaren Subclass-Zustand `EQUIPMENT` plus AfA-Zeilen | keine Anschaffung, keine AfA, keine Postenspur | book-candidate-labor |',
        '',
        'Aktuelle Wahrheit: `FA Subclass Code = EQUIPMENT` ist sichtbar gesetzt. Das Finalbild aus 034 zeigt nicht alle Felder gleichzeitig; der vollstaendige Labor-Stammdatenfit entsteht aus 033 plus 034.',
        ''
      ].join('\n')
    );
    return;
  }

  await openExistingAssetCard(page);
  await clickBcTopIconAction(page, {
    title: /Breite Layoutansicht anzeigen|wide layout/i,
    scopeText: /Fixed Asset Card/i,
    yMax: 70
  }).catch(() => undefined);
  const editIcon = await clickBcTopIconAction(page, {
    title: /Seite vornehmen|make changes|edit/i,
    scopeText: /Fixed Asset Card/i,
    yMax: 70,
    expectedAfterClick: /Fixed Asset Card/i
  });
  await page.waitForTimeout(1500);
  const editRows = await readVisibleCardRows(page, cardCaptions);
  const diagnostics = await collectActiveCardControlDiagnostics(page, ['FA Class Code', 'FA Subclass Code'], {
    cardText: /Fixed Asset Card/i,
    minY: 150,
    maxY: 900
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('030-edit-mode-subclass-diagnostics.json'), {
    editIcon,
    editRows,
    diagnostics
  });

  const lookupClick = await clickSubclassLookup(page);
  await page.waitForTimeout(1200);
  const lookupCandidates = await collectVisibleLookupCandidates(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('040-subclass-lookup-candidates.json'), {
    lookupClick,
    lookupCandidates
  });
  await writeTextEvidence(fixedAssetsEvidencePath('040-subclass-lookup-page-text.txt'), await compactPageText(page, {
    include: [/EQUIPMENT|VEHICLE|COMPUTER|FA Subclass|Wählen|Aus vollst|full list|Select/i],
    maxLines: 100
  }));
  await screenshot(page, `${testId}-040-subclass-lookup-open.png`, {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'field-blocker-lookup',
    purpose: 'FIXEDASSETS-034 Lookup: sichtbarer Subclass-Lookup/Picker nach Klick auf FA Subclass Code.',
    expectedPageText: [/\bFA-CNC-01\b|EQUIPMENT|FA Subclass Code/i],
    knownLimitations: ['Lookup-Bild ist Diagnose, kein Buchungs- oder AfA-Nachweis.']
  });

  const selection = lookupClick.clicked
    ? await selectVisibleEquipment(page)
    : { selected: false, skippedReason: 'lookup-picker-not-found-or-field-has-no-visible-picker' };
  if (selection.selected) {
    await page.keyboard.press('Control+Enter').catch(() => undefined);
    await page.waitForTimeout(2500);
  }
  await openExistingAssetCard(page);
  const finalRows = await readVisibleCardRows(page, cardCaptions);
  const finalSubclass = finalRows.find((row) => row.caption === 'FA Subclass Code')?.selectedValue ?? '';
  const subclassFit = normalizeValue(finalSubclass) === target.faSubclassCode;
  await writeJsonEvidence(fixedAssetsEvidencePath('050-subclass-selection-result.json'), {
    selection,
    finalSubclass,
    subclassFit,
    finalRows
  });
  await writeTextEvidence(fixedAssetsEvidencePath('050-final-card-text.txt'), await compactPageText(page, {
    include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|FA Class|FA Subclass|Depreciation|Posting Group|Book Value/i],
    maxLines: 100
  }));
  await screenshot(page, `${testId}-050-final-subclass-state.png`, {
    projectName: project.name,
    testId,
    status: subclassFit ? 'candidate' : 'rejected',
    bookUse: subclassFit ? 'master-data-card' : 'field-blocker-final',
    purpose: subclassFit
      ? 'FIXEDASSETS-034 Final: FA-CNC-01 zeigt FA Subclass Code EQUIPMENT sichtbar nach Lookup-Auswahl.'
      : 'FIXEDASSETS-034 Final: FA-CNC-01 zeigt den Subclass-Code weiterhin nicht passend; der Lookup-/Auswahlpfad bleibt Blocker.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Fixed Asset Card|FA Subclass Code/i],
    knownLimitations: ['Kein Anlagenzugang, keine AfA, keine Buchung.', 'Nur CRONUS-USA-Labor in RM-DEMO.', 'Dieses Bild zeigt Subclass und AfA-Zeilen; HGB/MACHINES werden durch FIXEDASSETS-033 ergaenzt.']
  });

  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(2000);
  const inspectionText = await compactPageText(page, {
    include: [/Page Inspection|Seitenpr|Fixed Asset Card|Page|Table|Source Table|Fixed Asset|5600|FA Subclass/i],
    maxLines: 100
  });
  await writeTextEvidence(fixedAssetsEvidencePath('060-page-inspection-context.txt'), inspectionText);
  await screenshot(page, `${testId}-060-page-inspection-context.png`, {
    projectName: project.name,
    testId,
    status: 'labor',
    bookUse: 'technical-diagnosis',
    purpose: 'FIXEDASSETS-034 Page Inspection: technischer Kontext der Anlagenkarte fuer den Subclass-Blocker.',
    expectedPageText: [/Fixed Asset|Page|Table|FA-CNC-01/i],
    knownLimitations: ['Page Inspection ist Diagnosekontext, kein finaler Anwenderscreenshot.']
  });

  const result = {
    testId: 'FIXEDASSETS-034-FA-CNC-01-SUBCLASS-FIELD-DIAGNOSIS',
    generatedAt: new Date().toISOString(),
    status: subclassFit ? 'done-labor-existing-card-subclass-fit-no-posting' : 'blocked-subclass-lookup-or-field-logic',
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-existing-fixed-asset-subclass-diagnosis',
    context,
    safety: {
      posted: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      faLedgerEntriesVisibleForTarget: hasTargetLedgerTrace
    },
    lookupClick,
    lookupCandidates: {
      count: lookupCandidates.length,
      equipmentVisible: lookupCandidates.some((entry) => /EQUIPMENT/i.test([entry.text, entry.aria, entry.title].join(' '))),
      fullListVisible: lookupCandidates.some((entry) => /vollst|full list/i.test([entry.text, entry.aria, entry.title].join(' ')))
    },
    selection,
    finalSubclass,
    subclassFit,
    finalRows,
    screenshots: [
      `${testId}-010-card-before-subclass-diagnosis.png`,
      `${testId}-040-subclass-lookup-open.png`,
      `${testId}-050-final-subclass-state.png`,
      `${testId}-060-page-inspection-context.png`
    ],
    learning: subclassFit
      ? 'Der offene Blocker war der Auswahlpfad, nicht die fachliche Unmoeglichkeit des Feldes. FA Subclass Code EQUIPMENT ist jetzt sichtbar gesetzt; zusammen mit FIXEDASSETS-033 ist die Anlagenkarte als CRONUS-USA-Laborstamm deutlich tragfaehiger. Folgeprozesse brauchen dennoch ein eigenes K30000-/Einkauf-/Zugang-Gate.'
      : 'Der Subclass-Blocker bleibt fachlich sichtbar: Der Picker/Lookup ist erreichbar, aber EQUIPMENT wurde nicht als finaler Kartenwert sichtbar gespeichert. Naechster Hebel ist Personalisieren oder ein enger Lookup-Dialog-/Tabellenpfad, bevor K30000 oder Zugang erlaubt werden.',
    bookImpact: subclassFit
      ? 'Kapitel 21 darf den Subclass-Korrekturpfad ergaenzen und FA-CNC-01 zusammen mit FIXEDASSETS-033 als CRONUS-USA-Labor-Stammdatensatz verwenden; Anschaffung, AfA und Postenspur bleiben getrennte Gates.'
      : 'Kapitel 21 muss den Subclass-Blocker als Anfaenger- und Diagnosefall erklaeren: sichtbare/editierbare Felder reichen nicht, wenn der validierte Kartenwert nach Auswahl leer bleibt.',
    nextStep: subclassFit
      ? 'FIXEDASSETS-035-K30000-VENDOR-READINESS-DECISION: ohne Buchung entscheiden, ob K30000 als naechste Schicht vorbereitet werden darf.'
      : 'FIXEDASSETS-035-FA-CNC-01-SUBCLASS-PERSONALIZE-OR-TABLE-PATH: Personalisieren/Lookup-Dialog gezielt klaeren; weiter kein K30000, keine Einkaufsrechnung, kein Zugang, keine AfA.'
  };
  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-034-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-034-FA-CNC-01-SUBCLASS-DIAGNOSIS.md'),
    [
      '# FIXEDASSETS-034 - FA-CNC-01 Subclass Field Diagnosis',
      '',
      `Status: \`${result.status}\`, \`ui-first\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${target.environment} |`,
      `| Company | ${target.company} |`,
      '| Zielanlage | `FA-CNC-01` |',
      `| Lookup geklickt | ${lookupClick.clicked ? 'ja' : 'nein'} |`,
      `| EQUIPMENT im Lookup sichtbar | ${result.lookupCandidates.equipmentVisible ? 'ja' : 'nein'} |`,
      `| FA Subclass Code final fit | ${subclassFit ? 'ja' : 'nein'} |`,
      '| Gebucht | nein |',
      '',
      '## Vor Diagnose',
      '',
      renderRows(beforeRows),
      '',
      '## Nach Lookup-/Auswahlversuch',
      '',
      renderRows(finalRows),
      '',
      '## Lernwert',
      '',
      result.learning,
      '',
      '## Buchwirkung',
      '',
      result.bookImpact,
      '',
      '## Grenzen',
      '',
      '- Nur CRONUS-USA-Labor in `RM-DEMO`.',
      '- Kein deutscher Anlagen-Finalnachweis.',
      '- Kein Kreditor, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-034 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-034-result.json` | JSON | Subclass-Diagnose, Safety, Lookup-Sichtbarkeit, finaler Kartenwert | keinen Zugang, keine AfA, keine deutsche Finalitaet | labor |',
      '| `FIXEDASSETS-034-FA-CNC-01-SUBCLASS-DIAGNOSIS.md` | Markdown | Lernwert, Buchwirkung, naechster Schritt | keine Buchung | labor |',
      '| `040-subclass-lookup-candidates.json` | JSON | sichtbare Lookup-/Picker-Kandidaten nach Klick | keine Persistenz ohne Finalcheck | field-proof |',
      '| `050-subclass-selection-result.json` | JSON | finaler Subclass-Wert nach Auswahlversuch | keine Postenspur | field-proof |',
      '| `060-page-inspection-context.txt` | Text | technischer Diagnosekontext | kein Anwender-Endbild | technical-diagnosis |',
      '',
      `Aktuelle Wahrheit: ${subclassFit ? '`FA Subclass Code = EQUIPMENT` ist sichtbar gesetzt.' : '`FA Subclass Code` bleibt nicht fit.'}`,
      ''
    ].join('\n')
  );
});
