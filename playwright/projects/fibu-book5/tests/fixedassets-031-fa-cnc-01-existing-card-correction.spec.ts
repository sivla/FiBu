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

test.setTimeout(360_000);

const testId = 'fixedassets-031';
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

type FillAttempt = {
  caption: string;
  value: string;
  filled: boolean;
  inputIndex?: number;
  chosen?: unknown;
  reason?: string;
  valueAfter?: string;
};

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function fixedAssetsUrl() {
  const url = new URL(bcPageUrl(5601, project.envPrefix));
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${target.fixedAssetNo}'`);
  return url.toString();
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeFitValue(value: string) {
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

async function openFilteredFixedAssets(page: Page) {
  await page.goto(fixedAssetsUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Assets|Anlagen|No\.|Description/i, { timeout: 60_000 });
  await waitForPageText(page, new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i'), { timeout: 30_000 });
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
  await waitForPageText(page, new RegExp(`\\b${escapeRegExp(target.fixedAssetNo)}\\b`, 'i'), { timeout: 30_000 });
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

  await page.waitForTimeout(1200);
  await writeJsonEvidence(fixedAssetsEvidencePath('015-show-more-result.json'), result);
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
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select')).filter((input) => visible(input));

    return captionValues.map((captionValue) => {
      const exactCaption = new RegExp(`^${escapeRegExpLocal(captionValue)}$`, 'i');
      const labels = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
        .filter((element) => visible(element))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element,
            text: normalize(element.innerText || element.textContent),
            aria: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            role: normalize(element.getAttribute('role')),
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

      const controls = inputs
        .map((input, index) => {
          const rect = input.getBoundingClientRect();
          return {
            index,
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
            index: control.index,
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

async function resolveInputIndexForCaption(frame: Frame, caption: string) {
  return frame.evaluate((captionValue) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const exactCaption = new RegExp(`^${captionValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const labels = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          text: normalize(element.innerText || element.textContent),
          aria: normalize(element.getAttribute('aria-label')),
          title: normalize(element.getAttribute('title')),
          role: normalize(element.getAttribute('role')),
          tagName: element.tagName,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect
        };
      })
      .filter((entry) => exactCaption.test(entry.text) || exactCaption.test(entry.aria) || exactCaption.test(entry.title))
      .filter((entry) => entry.rect.y > 160 && entry.rect.x > 230 && entry.rect.x < 1200)
      .filter((entry) => entry.role !== 'columnheader' && entry.tagName !== 'TH')
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea'))
      .map((input, index) => {
        const rect = input.getBoundingClientRect();
        return {
          index,
          valueBefore: normalize(input.value),
          aria: normalize(input.getAttribute('aria-label')),
          title: normalize(input.getAttribute('title')),
          disabled: input.disabled,
          readOnly: input.readOnly,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect,
          visible: visible(input)
        };
      })
      .filter((control) => control.visible && !control.disabled && !control.readOnly)
      .filter((control) => control.y > 160 && control.x > 230 && control.x < 1700);

    const candidates = labels
      .flatMap((label) =>
        controls
          .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 10)
          .filter((control) => control.rect.x >= label.rect.x + Math.min(label.rect.width, 220) - 6)
          .filter((control) => control.rect.x - label.rect.x < 620)
          .map((control) => ({
            label,
            control,
            score: Math.abs(control.rect.y - label.rect.y) * 100 + Math.max(0, control.rect.x - label.rect.x)
          }))
      )
      .sort((left, right) => left.score - right.score || left.control.x - right.control.x);

    const chosen = candidates[0];
    return {
      found: Boolean(chosen),
      inputIndex: chosen?.control.index ?? -1,
      chosen: chosen
        ? {
            score: chosen.score,
            label: { text: chosen.label.text, aria: chosen.label.aria, title: chosen.label.title, x: chosen.label.x, y: chosen.label.y },
            control: {
              valueBefore: chosen.control.valueBefore,
              aria: chosen.control.aria,
              title: chosen.control.title,
              x: chosen.control.x,
              y: chosen.control.y,
              width: chosen.control.width,
              height: chosen.control.height
            }
          }
        : null,
      candidates: candidates.slice(0, 8).map(({ label, control, score }) => ({
        score,
        label: { text: label.text, aria: label.aria, title: label.title, x: label.x, y: label.y },
        control: {
          index: control.index,
          valueBefore: control.valueBefore,
          aria: control.aria,
          title: control.title,
          x: control.x,
          y: control.y,
          width: control.width,
          height: control.height
        }
      }))
    };
  }, caption);
}

async function fillCardField(page: Page, caption: string, value: string): Promise<FillAttempt> {
  const frame = await findFixedAssetCardFrame(page);
  const resolved = await resolveInputIndexForCaption(frame, caption);
  if (!resolved.found || resolved.inputIndex < 0) {
    return {
      caption,
      value,
      filled: false,
      reason: `Kein sichtbares editierbares Feld fuer ${caption}`,
      chosen: resolved
    };
  }

  const input = frame.locator('input,textarea').nth(resolved.inputIndex);
  await input.fill(value, { timeout: 10_000 });
  await input.press('Tab').catch(() => undefined);
  await page.waitForTimeout(900);
  const valueAfter = await input.inputValue({ timeout: 2000 }).catch(() => '');
  return {
    caption,
    value,
    filled: true,
    inputIndex: resolved.inputIndex,
    chosen: resolved.chosen,
    valueAfter
  };
}

function valueMap(fieldValues: FieldValue[]) {
  return new Map(fieldValues.map((entry) => [entry.caption, normalizeFitValue(entry.selectedValue)]));
}

function coreFitFromFields(fieldValues: FieldValue[]) {
  const values = valueMap(fieldValues);
  return {
    fixedAssetNo: values.get('No.') === target.fixedAssetNo,
    description: values.get('Description') === normalizeFitValue(target.description),
    faClassCode: values.get('FA Class Code') === target.faClassCode,
    faSubclassCode: values.get('FA Subclass Code') === target.faSubclassCode,
    depreciationBook: values.get('Depreciation Book Code') === target.depreciationBook,
    postingGroup: values.get('Posting Group') === target.faPostingGroup,
    depreciationYears: (values.get('No. of Depreciation Years') ?? '').startsWith(target.depreciationYears)
  };
}

async function checkFaLedgerEntries(page: Page) {
  await page.goto(faLedgerEntriesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /FA Ledger Entries|FA Ledger Entry|Anlagenposten|Entry No\./i, { timeout: 60_000 });
  const text = await compactPageText(page, {
    include: [/FA-CNC-01|CNC Maschine|Entry No\.|Document No\.|Amount|Book Value|Acquisition|Depreciation|Anschaffung|AfA/i],
    maxLines: 120
  });
  await writeTextEvidence(fixedAssetsEvidencePath('025-fa-ledger-entries-safety.txt'), text);
  const hasTargetLedgerTrace = /\bFA-CNC-01\b/i.test(text) && /Entry No\.|Document No\.|Amount|Acquisition|Depreciation|Anschaffung|AfA/i.test(text);
  return {
    page: 'FA Ledger Entries',
    pageId: 5604,
    filteredUrl: page.url(),
    hasTargetLedgerTrace,
    compactText: text
  };
}

function renderMarkdown(result: Record<string, any>) {
  const beforeRows = (result.beforeFieldValues as FieldValue[])
    .map((entry) => `| ${entry.caption} | ${entry.selectedValue || '(leer/nicht sichtbar)'} | ${entry.diagnosis} |`)
    .join('\n');
  const afterRows = (result.afterFieldValues as FieldValue[])
    .map((entry) => `| ${entry.caption} | ${entry.selectedValue || '(leer/nicht sichtbar)'} | ${entry.diagnosis} |`)
    .join('\n');
  const fillRows = (result.fillAttempts as FillAttempt[])
    .map((entry) => `| ${entry.caption} | ${entry.value} | ${entry.filled ? 'ja' : 'nein'} | ${entry.valueAfter ?? ''} | ${entry.reason ?? ''} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-031 - FA-CNC-01 Existing Card Correction',
    '',
    `Status: \`${result.status}\`, \`ui-first\`, \`fixed-assets\`, \`masterdata-correction\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielanlage | `FA-CNC-01` / `CNC Maschine FRA` |',
    `| Stammdaten korrigiert | ${result.masterdataChanged ? 'ja' : 'nein'} |`,
    '| Gebucht | nein |',
    '| Kreditor/Einkauf/Zugang/AfA | nein |',
    '',
    '## Safety-Check',
    '',
    `- Book Value / Acquired / Postenspur blockiert: ${result.safetyBlocked ? 'ja' : 'nein'}.`,
    `- FA Ledger Entries zu \`FA-CNC-01\` sichtbar: ${result.faLedgerEntries?.hasTargetLedgerTrace ? 'ja' : 'nein'}.`,
    '',
    '## Vorher',
    '',
    '| Caption | sichtbarer Wert | Diagnose |',
    '|---|---|---|',
    beforeRows,
    '',
    '## Korrekturversuche',
    '',
    '| Feld | Zielwert | gesetzt | Wert danach | Hinweis |',
    '|---|---|---:|---|---|',
    fillRows,
    '',
    '## Nachher',
    '',
    '| Caption | sichtbarer Wert | Diagnose |',
    '|---|---|---|',
    afterRows,
    '',
    '## Visuelle Screenshot-Pruefung',
    '',
    'Der Screenshot `fixedassets-031-040-card-after-correction.png` ist als visueller Labor-Teilnachweis zu lesen: Er zeigt die bestehende Karte `FA-CNC-01`, `HGB`, `MACHINES` und `Book Value = 0,00`. Die JSON-Feldextraktion bleibt konservativ und der Lauf wird nicht als kompletter Stammdaten-Fit gewertet. Beschreibung, Klasse/Unterklasse, AfA-Jahre und AfA-Daten bleiben offen.',
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine vorhandene Anlagennummer ist erst dann buchungsreif, wenn die Karte die relevanten Stammdatenwerte sichtbar traegt. Die Korrektur bleibt ein Stammdaten-Schritt: Sie erzeugt keinen Anlagenzugang, keine AfA und keine Posten. Genau deshalb wird vor der Korrektur der Buchwert und die Anlagenpostenspur geprueft.',
    '',
    '## Buchwirkung',
    '',
    result.bookImpact,
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Anlagen-Finalnachweis.',
    '- Kein `K30000`, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- AfA-Datumslogik bleibt offen; in diesem Lauf wurden keine Datumswerte geraten.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-031 corrects existing FA-CNC-01 card values only after safety checks', async ({ page }) => {
  await prepareRunArtifacts();

  await openFilteredFixedAssets(page);
  const context = await assertRmDemoContext(page);
  await writeTextEvidence(
    fixedAssetsEvidencePath('010-filtered-list-before-correction.txt'),
    await compactPageText(page, {
      include: [/MCP_1_20260210|Rhein-Main Demo GmbH|RM-DEMO|Fixed Assets|FA-CNC-01|Description|FA Class|FA Subclass/i],
      maxLines: 90
    })
  );

  await screenshot(page, `${testId}-010-filtered-list-before-correction.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'preflight',
    purpose: 'FIXEDASSETS-031 Vorher-Liste: Zielcode FA-CNC-01 ist sichtbar, aber das Bild beweist noch keine Kartenwerte.',
    expectedPageText: [/\bFA-CNC-01\b/i],
    knownLimitations: ['Listenbild beweist nur den Zielcode; Buchbild braucht die Kartenwerte.']
  });

  await openExistingAssetCard(page);
  await clickCardShowMoreForGeneralAndDepreciationBook(page);

  const beforeFieldValues = await collectVisibleCardFieldValues(page, captions);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-before-field-values.json'), beforeFieldValues);
  await writeTextEvidence(
    fixedAssetsEvidencePath('020-card-before-correction.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|Depreciation|Posting Group|Book Value|Acquired/i],
      maxLines: 160
    })
  );

  await screenshot(page, `${testId}-020-card-before-correction.png`, {
    projectName: project.name,
    testId,
    status: 'rejected',
    bookUse: 'error-learning',
    purpose: 'FIXEDASSETS-031 Vorher-Karte: FA-CNC-01 ist vorhanden, aber die Zielwerte muessen vor Folgeprozessen korrigiert werden.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Depreciation Book|Posting Group/i],
    knownLimitations: ['Fehler-/Lernbild, kein fertiger Anlagenstamm und kein Buchungsnachweis.']
  });

  const valuesBefore = valueMap(beforeFieldValues);
  const bookValueBefore = valuesBefore.get('Book Value') ?? '';
  const acquiredBefore = valuesBefore.get('Acquired') ?? '';
  const hasNonZeroBookValue = Boolean(bookValueBefore) && !/^(0|0,00|0\.00|-)$/.test(bookValueBefore);
  const hasAcquiredState = /TRUE|YES|JA|ACQUIRED/i.test(acquiredBefore);

  const faLedgerEntries = await checkFaLedgerEntries(page);
  const safetyBlocked = hasNonZeroBookValue || hasAcquiredState || faLedgerEntries.hasTargetLedgerTrace;
  await writeJsonEvidence(fixedAssetsEvidencePath('026-safety-check.json'), {
    bookValueBefore,
    acquiredBefore,
    hasNonZeroBookValue,
    hasAcquiredState,
    faLedgerEntries,
    safetyBlocked
  });

  const fillAttempts: FillAttempt[] = [];
  let afterFieldValues = beforeFieldValues;
  let masterdataChanged = false;
  let saveProblemText = '';

  if (!safetyBlocked) {
    await openFilteredFixedAssets(page);
    await openExistingAssetCard(page);
    await clickCardShowMoreForGeneralAndDepreciationBook(page);

    for (const [caption, value] of [
      ['Description', target.description],
      ['FA Class Code', target.faClassCode],
      ['FA Subclass Code', target.faSubclassCode],
      ['Depreciation Book Code', target.depreciationBook],
      ['Posting Group', target.faPostingGroup],
      ['No. of Depreciation Years', target.depreciationYears]
    ] as const) {
      fillAttempts.push(await fillCardField(page, caption, value));
    }
    await writeJsonEvidence(fixedAssetsEvidencePath('030-fill-attempts.json'), fillAttempts);

    saveProblemText = await compactPageText(page, {
      include: [/Error|Fehler|blocked|gesperrt|required|Pflicht|must have|muss|zugeh.rige Datens.tze|related records/i],
      maxLines: 80
    });
    await writeTextEvidence(fixedAssetsEvidencePath('035-save-problem-text.txt'), saveProblemText);

    await page.keyboard.press('Control+Enter').catch(() => undefined);
    await page.waitForTimeout(2500);

    await openFilteredFixedAssets(page);
    await openExistingAssetCard(page);
    await clickCardShowMoreForGeneralAndDepreciationBook(page);
    afterFieldValues = await collectVisibleCardFieldValues(page, captions);
    await writeJsonEvidence(fixedAssetsEvidencePath('040-after-field-values.json'), afterFieldValues);
    await writeTextEvidence(
      fixedAssetsEvidencePath('040-card-after-correction.txt'),
      await compactPageText(page, {
        include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|Depreciation|Posting Group|Book Value|Acquired/i],
        maxLines: 160
      })
    );
    masterdataChanged = fillAttempts.some((entry) => entry.filled);
  }

  const coreFit = coreFitFromFields(afterFieldValues);
  const allCoreValuesFit = Object.values(coreFit).every(Boolean);

  await screenshot(page, `${testId}-040-card-after-correction.png`, {
    projectName: project.name,
    testId,
    status: allCoreValuesFit ? 'candidate' : 'rejected',
    bookUse: allCoreValuesFit ? 'master-data-card' : 'do-not-use',
    purpose:
      'FIXEDASSETS-031 Nachher-Karte: Buchbild ist nur brauchbar, wenn FA-CNC-01, CNC Maschine FRA, TANGIBLE/EQUIPMENT, HGB, MACHINES und 8 Jahre sichtbar sind.',
    expectedPageText: allCoreValuesFit
      ? [/\bFA-CNC-01\b/i, /CNC Maschine FRA/i, /\bTANGIBLE\b/i, /\bEQUIPMENT\b/i, /\bHGB\b/i, /\bMACHINES\b/i]
      : [/\bFA-CNC-01\b/i, /Depreciation Book|Posting Group|Fixed Asset/i],
    knownLimitations: [
      'Nur Stammdatenkorrektur im CRONUS-USA-Labor.',
      'Kein Zugang, keine AfA, keine Einkaufsrechnung und keine Buchung.',
      'Datumslogik bleibt offen, wenn keine Zielwerte sichtbar gesetzt wurden.'
    ]
  });

  const status = safetyBlocked
    ? 'blocked-safety-check-posting-or-bookvalue-present'
    : allCoreValuesFit
      ? 'done-labor-existing-card-corrected'
      : 'blocked-correction-not-fully-visible';

  const result = {
    testId: 'FIXEDASSETS-031-FA-CNC-01-EXISTING-CARD-CORRECTION',
    generatedAt: new Date().toISOString(),
    status,
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-existing-fixed-asset-card-correction',
    target,
    context,
    beforeFieldValues,
    afterFieldValues,
    coreFit,
    allCoreValuesFit,
    fillAttempts,
    faLedgerEntries,
    safetyBlocked,
    masterdataChanged,
    screenshots: [
      `${testId}-010-filtered-list-before-correction.png`,
      `${testId}-020-card-before-correction.png`,
      `${testId}-040-card-after-correction.png`
    ],
    safety: {
      posted: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      companyChanged: false
    },
    bookImpact: allCoreValuesFit
      ? 'Kapitel 21 kann FA-CNC-01 jetzt als korrigierten CRONUS-USA-Labor-Stammsatz zeigen. Die Anleitung muss weiter klar trennen: Stammsatz ist nicht Zugang, nicht AfA und nicht deutscher Finalnachweis.'
      : safetyBlocked
        ? 'Kapitel 21 muss die Korrektur stoppen, wenn ein vorhandener Anlagenstamm bereits Buchwert, Zugang oder Postenspur zeigt.'
        : 'Kapitel 21 darf den Nachher-Screenshot nur als Labor-Teilnachweis fuer HGB/MACHINES nutzen. Die Anlage bleibt blockiert, bis Beschreibung, Klasse/Unterklasse, AfA-Jahre und Datumslogik sichtbar fit sind.',
    nextStep: allCoreValuesFit
      ? 'FIXEDASSETS-032-K30000-VENDOR-READINESS-DECISION: ohne Anlagenbuchung entscheiden, ob der Kreditorpfad vorbereitet werden darf.'
      : safetyBlocked
        ? 'FIXEDASSETS-032-CORRECTION-BLOCKER-DECISION: vorhandene Buchwert-/Postenspur-Evidence bewerten; keinen Folgeprozess starten.'
        : 'FIXEDASSETS-032-FA-CNC-01-CORRECTION-BLOCKER-DIAGNOSIS: sichtbaren Feld-/Save-Blocker analysieren; keine Einkaufsrechnung und keine Buchung.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-031-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('FIXEDASSETS-031-FA-CNC-01-EXISTING-CARD-CORRECTION.md'),
    renderMarkdown(result)
  );
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# fixedassets-031 Evidence',
      '',
      `Status: \`${status}\`, \`ui-first\`, \`masterdata-correction\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-031-result.json` | JSON-Ergebnis | Safety, Vorher/Nachher-Werte, Korrekturstatus | keine Buchung, keinen deutschen Finalnachweis | labor |',
      '| `FIXEDASSETS-031-FA-CNC-01-EXISTING-CARD-CORRECTION.md` | Markdown | Lernwert und Buchwirkung | keine Anlagenpostenspur nach Buchung | labor |',
      '| `020-before-field-values.json` | JSON | sichtbare Kartenwerte vor Korrektur | keine technische Tabellenextraktion | field-proof |',
      '| `026-safety-check.json` | JSON | Buchwert-/Acquired-/FA-Ledger-Safety | keinen Finalabschluss | safety |',
      '| `030-fill-attempts.json` | JSON | UI-Feldfuellversuche auf der Karte | keine Buchung | field-proof |',
      '| `040-after-field-values.json` | JSON | sichtbare Kartenwerte nach Korrektur | keine Einkauf-/AfA-Wirkung | field-proof |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze der Bilder | keine eigenstaendige Wahrheit ohne JSON/Markdown | mixed |',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );

  expect(result.safety.posted).toBe(false);
  expect(result.safety.purchaseInvoiceCreated).toBe(false);
  expect(result.safety.acquisitionPosted).toBe(false);
  expect(result.safety.depreciationCalculatedOrPosted).toBe(false);
});
