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
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(300_000);

const testId = 'fixedassets-029-existing-asset-readonly';
const projectRoot = path.join('playwright', 'projects', project.name);
const evidenceDir = path.join(projectRoot, 'evidence', testId);
const target = {
  environment: 'MCP_1_20260210',
  company: project.defaultCompany,
  fixedAssetNo: 'FA-CNC-01',
  description: 'CNC Maschine FRA',
  faClassCode: 'TANGIBLE',
  faSubclassCode: 'EQUIPMENT',
  depreciationBook: 'HGB',
  faPostingGroup: 'MACHINES',
  depreciationYears: '8'
};

const captions = [
  'No.',
  'Description',
  'FA Class Code',
  'FA Subclass Code',
  'Depreciation Book Code',
  'Posting Group',
  'No. of Depreciation Years',
  'Depreciation Starting Date',
  'Depreciation Ending Date',
  'Book Value',
  'Acquired'
];

type FieldValue = {
  caption: string;
  selectedValue: string;
  diagnosis: string;
  labels: unknown[];
  controls: unknown[];
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function fixedAssetsUrl(filterToTarget = true) {
  const url = new URL(bcPageUrl(5601, project.envPrefix));
  if (filterToTarget) {
    url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${target.fixedAssetNo}'`);
  }
  return url.toString();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

async function openFixedAssets(page: Page) {
  await page.goto(fixedAssetsUrl(true), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Assets|Anlagen|No\.|Description/i, { timeout: 60_000 });
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
  const directLink = page.getByRole('link', { name: new RegExp(`^${escapeRegExp(target.fixedAssetNo)}$`, 'i') }).first();
  if (await directLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await directLink.click();
  } else {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    if (!/Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book/i.test(await pageText(page))) {
      let clickedInFrame = false;
      for (const frame of page.frames()) {
        clickedInFrame = await frame
          .evaluate((assetNo) => {
            const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
            const visible = (element: Element) => {
              const rect = element.getBoundingClientRect();
              const style = window.getComputedStyle(element);
              return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
            };
            const candidates = Array.from(document.querySelectorAll<HTMLElement>('a,button,[role="button"],[role="gridcell"],[role="cell"],td,span,div'))
              .filter((element) => visible(element))
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  element,
                  text: normalize(element.innerText || element.textContent),
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height)
                };
              })
              .filter((entry) => entry.text === assetNo)
              .sort((left, right) => left.y - right.y || left.x - right.x);

            const chosen = candidates[0];
            if (!chosen) return false;
            chosen.element.click();
            chosen.element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
            return true;
          }, target.fixedAssetNo)
          .catch(() => false);
        if (clickedInFrame) break;
      }
      expect(clickedInFrame, `${target.fixedAssetNo} muss in einem BC-Frame klickbar sein`).toBeTruthy();
    }
  }

  await waitForPageText(page, /Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book/i, {
    timeout: 60_000
  });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
}

async function clickCardShowMoreForGeneralAndDepreciationBook(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  const result = await frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]'))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        const targetFastTab = /Depreciation Book/i.test([aria, title].join(' '))
          ? 'Depreciation Book'
          : /General/i.test([aria, title].join(' '))
            ? 'General'
            : '';
        return {
          element,
          text,
          aria,
          title,
          targetFastTab,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })
      .filter((candidate) => visible(candidate.element))
      .filter((candidate) => candidate.width <= 220 && candidate.height <= 60)
      .filter((candidate) => /show\s*more|mehr\s*anzeigen/i.test([candidate.text, candidate.aria, candidate.title].join(' ')))
      .filter((candidate) => candidate.targetFastTab)
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const clicked: Array<Omit<(typeof candidates)[number], 'element'>> = [];
    const seen = new Set<string>();
    for (const candidate of candidates) {
      if (seen.has(candidate.targetFastTab)) continue;
      candidate.element.click();
      seen.add(candidate.targetFastTab);
      const { element, ...entry } = candidate;
      clicked.push(entry);
    }

    return {
      candidates: candidates.map(({ element, ...entry }) => entry),
      clicked
    };
  });

  await page.waitForTimeout(1500);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-show-more-readonly.json'), result);
  return result;
}

async function collectVisibleCardFieldValues(page: Page, requestedCaptions: string[]): Promise<FieldValue[]> {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate((captionValues) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const escapeRegExpLocal = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return captionValues.map((captionValue) => {
      const exactCaption = new RegExp(`^${escapeRegExpLocal(captionValue)}$`, 'i');
      const labels = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
        .filter((element) => visible(element))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const text = normalize(element.innerText || element.textContent);
          const aria = normalize(element.getAttribute('aria-label'));
          const title = normalize(element.getAttribute('title'));
          const role = normalize(element.getAttribute('role'));
          return {
            element,
            text,
            aria,
            title,
            role,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            rect
          };
        })
        .filter((entry) => exactCaption.test(entry.text) || exactCaption.test(entry.aria) || exactCaption.test(entry.title))
        .filter((entry) => entry.rect.y > 160 && entry.rect.x > 230 && entry.rect.x < 1200)
        .sort((left, right) => left.y - right.y || left.x - right.x);

      const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'))
        .filter((input) => visible(input))
        .map((input) => {
          const rect = input.getBoundingClientRect();
          return {
            value: normalize((input as HTMLInputElement).value),
            aria: normalize(input.getAttribute('aria-label')),
            title: normalize(input.getAttribute('title')),
            role: normalize(input.getAttribute('role')),
            checked: input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : null,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            rect
          };
        })
        .filter((entry) => entry.rect.y > 160 && entry.rect.x > 230 && entry.rect.x < 1700);

      const rowCandidates = labels
        .flatMap((label) =>
          controls
            .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 10)
            .filter((control) => control.rect.x >= label.rect.x)
            .filter((control) => control.rect.x - label.rect.x < 620)
            .map((control) => ({
              label,
              control,
              score: Math.abs(control.rect.y - label.rect.y) * 100 + Math.max(0, control.rect.x - label.rect.x)
            }))
        )
        .sort((left, right) => left.score - right.score || left.control.x - right.control.x);

      const selected = rowCandidates[0];
      const selectedValue = selected
        ? selected.control.checked === null
          ? selected.control.value
          : String(selected.control.checked)
        : '';
      return {
        caption: captionValue,
        selectedValue,
        diagnosis: selected ? 'visible-card-row-control' : labels.length ? 'caption-visible-no-row-control' : 'caption-not-visible',
        labels: labels.slice(0, 5).map(({ element, rect, ...entry }) => entry),
        controls: rowCandidates.slice(0, 5).map(({ label, control, score }) => ({
          score,
          label: { text: label.text, aria: label.aria, title: label.title, x: label.x, y: label.y },
          control: {
            value: control.value,
            aria: control.aria,
            title: control.title,
            checked: control.checked,
            x: control.x,
            y: control.y,
            width: control.width,
            height: control.height
          }
        }))
      };
    });
  }, requestedCaptions);
}

function normalizeFitValue(value: string) {
  return value.replace(/\s+/g, ' ').trim().toUpperCase();
}

function renderMarkdown(result: Record<string, any>) {
  const fieldRows = (result.fieldValues as FieldValue[])
    .map((entry) => `| ${entry.caption} | ${entry.selectedValue || '(leer/nicht sichtbar)'} | ${entry.diagnosis} |`)
    .join('\n');

  const fitRows = Object.entries(result.coreFit as Record<string, boolean>)
    .map(([key, value]) => `| ${key} | ${value ? 'ja' : 'nein'} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-029 Existing Asset Read-only Verify',
    '',
    `Status: \`${result.status}\`, \`ui-first\`, \`read-only\`, \`fixed-assets\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    `| Zielanlage | ${result.target.fixedAssetNo} |`,
    '| Geaendert | nein |',
    '| Gebucht | nein |',
    '',
    '## Sichtbare Kartenwerte',
    '',
    '| Caption | sichtbarer Wert | Diagnose |',
    '|---|---|---|',
    fieldRows,
    '',
    '## Zielwert-Fit',
    '',
    '| Zielwert | sichtbar passend |',
    '|---|---:|',
    fitRows,
    '',
    '## Kernaussage',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine sichtbare Nummer in der Anlagenliste ist noch kein verwendbarer Anlagenstamm. Fuer eine Buchanleitung muss die Karte zeigen, ob Beschreibung, Anlagenklasse, Unterklasse, AfA-Buch und Anlagenbuchungsgruppe wirklich gepflegt sind. Sonst wuerde ein spaeterer Einkaufs- oder AfA-Schritt auf ungesichertem Stammdatengrund laufen.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- Read-only CRONUS-USA-Labor in `RM-DEMO`.',
    '- Kein `K30000`, keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.',
    '- Kein deutscher HGB-/Kontenplan- oder Steuer-Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-029 verifies existing FA-CNC-01 read-only before any next asset step', async ({ page }) => {
  await prepareRunArtifacts();

  await openFixedAssets(page);
  const context = await assertRmDemoContext(page);
  await waitForPageText(page, new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i'), { timeout: 30_000 });

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-filtered-list-context.txt'),
    await compactPageText(page, {
      include: [/MCP_1_20260210|Rhein-Main Demo GmbH|RM-DEMO|Fixed Assets|FA-CNC-01|Description|FA Class|FA Subclass|Acquired/i],
      maxLines: 90
    })
  );
  await screenshot(page, `${testId}-010-filtered-list.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'field-proof',
    purpose:
      'FIXEDASSETS-029 Existing Read-only: Die gefilterte Anlagenliste zeigt den Zielcode FA-CNC-01, aber noch nicht die fachliche Vollstaendigkeit der Anlagenkarte.',
    expectedPageText: [/\bFA-CNC-01\b/i],
    knownLimitations: ['Listenbild beweist nur den Code, nicht Beschreibung, HGB, MACHINES oder AfA-Felder.']
  });

  await openExistingAssetCard(page);
  await clickCardShowMoreForGeneralAndDepreciationBook(page);
  const fieldValues = await collectVisibleCardFieldValues(page, captions);
  await writeJsonEvidence(fixedAssetsEvidencePath('030-card-field-values.json'), fieldValues);
  await writeTextEvidence(
    fixedAssetsEvidencePath('020-card-context-readonly.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|Depreciation|Posting Group|Book Value|Acquired/i],
      maxLines: 160
    })
  );

  const valueByCaption = new Map(fieldValues.map((entry) => [entry.caption, normalizeFitValue(entry.selectedValue)]));
  const coreFit = {
    fixedAssetNo: valueByCaption.get('No.') === target.fixedAssetNo,
    description: valueByCaption.get('Description') === normalizeFitValue(target.description),
    faClassCode: valueByCaption.get('FA Class Code') === target.faClassCode,
    faSubclassCode: valueByCaption.get('FA Subclass Code') === target.faSubclassCode,
    depreciationBook: valueByCaption.get('Depreciation Book Code') === target.depreciationBook,
    postingGroup: valueByCaption.get('Posting Group') === target.faPostingGroup,
    depreciationYears: (valueByCaption.get('No. of Depreciation Years') ?? '').startsWith(target.depreciationYears)
  };
  const allCoreValuesFit = Object.values(coreFit).every(Boolean);

  await screenshot(page, `${testId}-020-existing-card-readonly.png`, {
    projectName: project.name,
    testId,
    status: allCoreValuesFit ? 'candidate' : 'rejected',
    bookUse: allCoreValuesFit ? 'field-proof' : 'do-not-use',
    purpose:
      'FIXEDASSETS-029 Existing Read-only: Die Anlagenkarte muss die fachlichen Zielwerte FA-CNC-01, CNC Maschine FRA, TANGIBLE/EQUIPMENT, HGB und MACHINES sichtbar tragen.',
    expectedPageText: allCoreValuesFit
      ? [/\bFA-CNC-01\b/i, /CNC Maschine FRA/i, /\bHGB\b/i, /\bMACHINES\b/i]
      : [/\bFA-CNC-01\b/i, /Fixed Asset|Depreciation Book|Posting Group/i],
    knownLimitations: [
      'Read-only Klassifikation, keine Korrektur.',
      'Bei rejected Status darf das Bild nicht als fachlich vollstaendiger Stammdatennachweis ins Buch.'
    ]
  });

  const status = allCoreValuesFit
    ? 'existing-target-masterdata-validated-readonly'
    : 'blocked-existing-target-values-incomplete-readonly';
  const result = {
    testId: 'FIXEDASSETS-029-EXISTING-ASSET-READONLY-VERIFY',
    generatedAt: new Date().toISOString(),
    status,
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-existing-asset-read-only-verification',
    target,
    context,
    fieldValues,
    coreFit,
    allCoreValuesFit,
    screenshots: [
      `${testId}-010-filtered-list.png`,
      `${testId}-020-existing-card-readonly.png`
    ],
    safety: {
      posted: false,
      setupChanged: false,
      assetChanged: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false
    },
    summary: allCoreValuesFit
      ? 'Der vorhandene Zielstammsatz FA-CNC-01 ist read-only als fachlich passender Labor-Anlagenstamm sichtbar. Der naechste Schritt darf eine neue Gate-Entscheidung fuer K30000/Vendor-Readiness sein.'
      : 'FA-CNC-01 existiert zwar als Nummer, aber die sichtbaren Kartenwerte reichen nicht als fachlich vollstaendiger Anlagenstamm. Code-Sichtbarkeit allein ist kein Buch- oder Buchungsnachweis.',
    bookImpact: allCoreValuesFit
      ? 'Kapitel 21 kann FA-CNC-01 als Labor-Stammdatennachweis aufnehmen, muss aber weiter Zugang/AfA/Buchung trennen.'
      : 'Kapitel 21 muss einen Lernfall aufnehmen: Wenn ein Zielcode schon existiert, zuerst die Karte pruefen. Nur sichtbare, passende Feldwerte zaehlen; ein Listen-Code reicht nicht.',
    nextStep: allCoreValuesFit
      ? 'FIXEDASSETS-030-K30000-VENDOR-READINESS-DECISION: ohne Anlagenbuchung entscheiden, ob der Kreditorpfad vorbereitet werden darf.'
      : 'FIXEDASSETS-030-FA-CNC-01-CORRECTION-GATE-DECISION: entscheiden, ob die bestehende Anlage UI-first korrigiert oder ein neuer Labor-Zielcode verwendet wird; keine Einkaufsrechnung und keine Buchung.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-029-existing-readonly-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-029-EXISTING-ASSET-READONLY-VERIFY.md'),
    renderMarkdown(result)
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# fixedassets-029-existing-asset-readonly Evidence',
      '',
      `Status: \`${status}\`, \`ui-first\`, \`read-only\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-029-existing-readonly-result.json` | JSON-Ergebnis | Zielwert-Fit der sichtbaren Kartenfelder | keine Tabellen-/API-Aenderung, keine Buchung | read-only |',
      '| `FIXEDASSETS-029-EXISTING-ASSET-READONLY-VERIFY.md` | Markdown | Lern- und Buchwirkung | keinen deutschen Finalnachweis | read-only |',
      '| `010-filtered-list-context.txt` | kompakter UI-Text | `FA-CNC-01` ist im gefilterten Listen-Kontext sichtbar | keine fachliche Vollstaendigkeit | candidate |',
      '| `020-card-context-readonly.txt` | kompakter UI-Text | relevanter Kartenkontext | kein Rohdump, keine technische Tabelle | read-only |',
      '| `030-card-field-values.json` | JSON | gelesene sichtbare Kartenwerte je Caption | keine Aenderung oder Buchung | field-proof |',
      '| `fixedassets-029-existing-asset-readonly-010-filtered-list.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Listenbilds | keine Kartenwerte | candidate |',
      '| `fixedassets-029-existing-asset-readonly-020-existing-card-readonly.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Kartenbilds | keine Buchung | mixed |',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.setupChanged).toBe(false);
  expect(result.safety.assetChanged).toBe(false);
});
