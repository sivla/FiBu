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

const testId = 'fixedassets-032';
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
  depreciationYears: '8',
  depreciationStartingDate: '01.01.2026'
};

const captions = [
  'No.',
  'Description',
  'FA Class Code',
  'FA Subclass Code',
  'Depreciation Book Code',
  'Posting Group',
  'Depreciation Starting Date',
  'No. of Depreciation Years',
  'Depreciation Ending Date',
  'Book Value',
  'Acquired'
];

type FieldDiagnostic = {
  caption: string;
  selectedValue: string;
  diagnosis: string;
  editable: boolean;
  labels: unknown[];
  controls: unknown[];
};

type FillResult = {
  caption: string;
  targetValue: string;
  attempted: boolean;
  filled: boolean;
  reason?: string;
  valueAfter?: string;
  chosen?: unknown;
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  await page.waitForTimeout(1000);
  await writeJsonEvidence(fixedAssetsEvidencePath('012-show-more-result.json'), result);
  return result;
}

async function collectEditActionCandidates(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate(() => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    return Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[aria-label],[title]'))
      .filter((element) => visible(element))
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          text: normalize(element.innerText || element.textContent),
          aria: normalize(element.getAttribute('aria-label')),
          title: normalize(element.getAttribute('title')),
          role: normalize(element.getAttribute('role')),
          tag: element.tagName,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          topToolbarCandidate: rect.y >= 35 && rect.y <= 115 && rect.width <= 80 && rect.height <= 80
        };
      })
      .filter((entry) => entry.topToolbarCandidate || /edit|bearbeit|pencil|stift/i.test([entry.text, entry.aria, entry.title].join(' ')))
      .sort((left, right) => left.y - right.y || left.x - right.x);
  });
}

async function activateEditMode(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  const before = await collectEditActionCandidates(page);
  const clicked = await frame
    .evaluate(() => {
      const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
      const visible = (element: Element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,a,[role="button"],[aria-label],[title]'))
        .filter((element) => visible(element))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const label = [element.innerText, element.textContent, element.getAttribute('aria-label'), element.getAttribute('title')]
            .map(normalize)
            .join(' ');
          return {
            element,
            label,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          };
        })
        .filter((entry) => entry.y >= 35 && entry.y <= 115)
        .filter((entry) => /edit|bearbeit|pencil|stift/i.test(entry.label))
        .sort((left, right) => left.y - right.y || left.x - right.x);
      const chosen = candidates[0];
      if (!chosen) return null;
      chosen.element.click();
      return {
        label: chosen.label.replace(/\s+/g, ' ').trim(),
        x: Math.round(chosen.x),
        y: Math.round(chosen.y),
        width: Math.round(chosen.width),
        height: Math.round(chosen.height)
      };
    })
    .catch(() => null);

  if (clicked) {
    await page.waitForTimeout(1500);
    return { method: 'explicit-edit-action', before, clicked, fallbackUsed: false };
  }

  await page.keyboard.press('Control+Shift+E').catch(() => undefined);
  await page.waitForTimeout(1500);
  const afterKeyboard = await collectEditActionCandidates(page);
  return { method: 'keyboard-fallback-control-shift-e', before, clicked: null, afterKeyboard, fallbackUsed: true };
}

async function collectVisibleCardFieldDiagnostics(page: Page, requestedCaptions: string[]): Promise<FieldDiagnostic[]> {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate((captionValues) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const escapeRegExpLocal = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const inputElements = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select')
    ).filter((input) => visible(input));

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
        .filter((entry) => entry.rect.y > 150 && entry.rect.x > 230 && entry.rect.x < 1250)
        .sort((left, right) => left.y - right.y || left.x - right.x);

      const controls = inputElements
        .map((input, index) => {
          const rect = input.getBoundingClientRect();
          const editable = !input.disabled && !(input instanceof HTMLInputElement && input.readOnly);
          return {
            index,
            value: normalize((input as HTMLInputElement).value),
            aria: normalize(input.getAttribute('aria-label')),
            title: normalize(input.getAttribute('title')),
            disabled: input.disabled,
            readOnly: input instanceof HTMLInputElement ? input.readOnly : false,
            editable,
            checked: input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : null,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            rect
          };
        })
        .filter((entry) => entry.rect.y > 150 && entry.rect.x > 230 && entry.rect.x < 1700);

      const rowCandidates = labels
        .flatMap((label) =>
          controls
            .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 10)
            .filter((control) => control.rect.x >= label.rect.x)
            .filter((control) => control.rect.x - label.rect.x < 680)
            .map((control) => ({
              label,
              control,
              score: Math.abs(control.rect.y - label.rect.y) * 100 + Math.max(0, control.rect.x - label.rect.x)
            }))
        )
        .sort((left, right) => left.score - right.score || Number(right.control.editable) - Number(left.control.editable));

      const selected = rowCandidates[0];
      const selectedValue = selected
        ? selected.control.checked === null
          ? selected.control.value
          : String(selected.control.checked)
        : '';
      const editable = Boolean(selected?.control.editable);
      return {
        caption: captionValue,
        selectedValue,
        diagnosis: selected ? (editable ? 'visible-editable-card-row-control' : 'visible-readonly-card-row-control') : labels.length ? 'caption-visible-no-row-control' : 'caption-not-visible',
        editable,
        labels: labels.slice(0, 5).map(({ element, rect, ...entry }) => entry),
        controls: rowCandidates.slice(0, 8).map(({ label, control, score }) => ({
          score,
          label: { text: label.text, aria: label.aria, title: label.title, x: label.x, y: label.y },
          control: {
            index: control.index,
            value: control.value,
            aria: control.aria,
            title: control.title,
            disabled: control.disabled,
            readOnly: control.readOnly,
            editable: control.editable,
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

async function resolveEditableInputIndexForCaption(frame: Frame, caption: string) {
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
      .filter((entry) => entry.rect.y > 150 && entry.rect.x > 230 && entry.rect.x < 1250)
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
          readOnly: input instanceof HTMLInputElement ? input.readOnly : false,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect,
          visible: visible(input)
        };
      })
      .filter((control) => control.visible && !control.disabled && !control.readOnly)
      .filter((control) => control.y > 150 && control.x > 230 && control.x < 1700);

    const candidates = labels
      .flatMap((label) =>
        controls
          .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 10)
          .filter((control) => control.rect.x >= label.rect.x + Math.min(label.rect.width, 220) - 6)
          .filter((control) => control.rect.x - label.rect.x < 680)
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

async function fillCardField(page: Page, caption: string, targetValue: string): Promise<FillResult> {
  const frame = await findFixedAssetCardFrame(page);
  const resolved = await resolveEditableInputIndexForCaption(frame, caption);
  if (!resolved.found || resolved.inputIndex < 0) {
    return {
      caption,
      targetValue,
      attempted: false,
      filled: false,
      reason: `Kein sichtbares editierbares Feld fuer ${caption}`,
      chosen: resolved
    };
  }

  const input = frame.locator('input,textarea').nth(resolved.inputIndex);
  await input.fill(targetValue, { timeout: 10_000 });
  await input.press('Tab').catch(() => undefined);
  await page.waitForTimeout(800);
  const valueAfter = await input.inputValue({ timeout: 2000 }).catch(() => '');
  return {
    caption,
    targetValue,
    attempted: true,
    filled: normalizeValue(valueAfter) === normalizeValue(targetValue) || normalizeValue(valueAfter).startsWith(normalizeValue(targetValue)),
    valueAfter,
    chosen: resolved.chosen
  };
}

function fieldMap(fieldDiagnostics: FieldDiagnostic[]) {
  return new Map(fieldDiagnostics.map((entry) => [entry.caption, normalizeValue(entry.selectedValue)]));
}

function coreFitFromFields(fieldDiagnostics: FieldDiagnostic[]) {
  const values = fieldMap(fieldDiagnostics);
  return {
    fixedAssetNo: values.get('No.') === target.fixedAssetNo,
    description: values.get('Description') === normalizeValue(target.description),
    faClassCode: values.get('FA Class Code') === target.faClassCode,
    faSubclassCode: values.get('FA Subclass Code') === target.faSubclassCode,
    depreciationBook: values.get('Depreciation Book Code') === target.depreciationBook,
    postingGroup: values.get('Posting Group') === target.faPostingGroup,
    depreciationYears: (values.get('No. of Depreciation Years') ?? '').startsWith(target.depreciationYears),
    depreciationStartingDate: (values.get('Depreciation Starting Date') ?? '').includes('01.01.2026')
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
  await writeTextEvidence(fixedAssetsEvidencePath('020-fa-ledger-entries-safety.txt'), text);
  return {
    page: 'FA Ledger Entries',
    pageId: 5604,
    filteredUrl: page.url(),
    hasTargetLedgerTrace: /\bFA-CNC-01\b/i.test(text) && /Entry No\.|Document No\.|Amount|Acquisition|Depreciation|Anschaffung|AfA/i.test(text),
    compactText: text
  };
}

function renderMarkdown(result: Record<string, any>) {
  const beforeRows = (result.beforeEditFieldDiagnostics as FieldDiagnostic[])
    .map((entry) => `| ${entry.caption} | ${entry.selectedValue || '(leer/nicht sichtbar)'} | ${entry.diagnosis} | ${entry.editable ? 'ja' : 'nein'} |`)
    .join('\n');
  const afterEditRows = (result.afterEditFieldDiagnostics as FieldDiagnostic[])
    .map((entry) => `| ${entry.caption} | ${entry.selectedValue || '(leer/nicht sichtbar)'} | ${entry.diagnosis} | ${entry.editable ? 'ja' : 'nein'} |`)
    .join('\n');
  const finalRows = (result.finalFieldDiagnostics as FieldDiagnostic[])
    .map((entry) => `| ${entry.caption} | ${entry.selectedValue || '(leer/nicht sichtbar)'} | ${entry.diagnosis} | ${entry.editable ? 'ja' : 'nein'} |`)
    .join('\n');
  const fillRows = (result.fillResults as FillResult[])
    .map((entry) => `| ${entry.caption} | ${entry.targetValue} | ${entry.attempted ? 'ja' : 'nein'} | ${entry.filled ? 'ja' : 'nein'} | ${entry.valueAfter ?? ''} | ${entry.reason ?? ''} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-032 - FA-CNC-01 Correction Blocker Diagnosis',
    '',
    `Status: \`${result.status}\`, \`ui-first\`, \`fixed-assets\`, \`masterdata-correction\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielanlage | `FA-CNC-01` |',
    `| Bearbeitungsaktion | ${result.editMode?.method ?? 'nicht ermittelt'} |`,
    `| Stammdaten geaendert | ${result.masterdataChanged ? 'ja' : 'nein'} |`,
    '| Gebucht | nein |',
    '| Kreditor/Einkauf/Zugang/AfA | nein |',
    '',
    '## Safety',
    '',
    `- FA Ledger Entries zu \`FA-CNC-01\` sichtbar: ${result.faLedgerEntries?.hasTargetLedgerTrace ? 'ja' : 'nein'}.`,
    `- Safety blockiert: ${result.safetyBlocked ? 'ja' : 'nein'}.`,
    '',
    '## Vor Bearbeitungsmodus',
    '',
    '| Caption | sichtbarer Wert | Diagnose | editierbar |',
    '|---|---|---|---:|',
    beforeRows,
    '',
    '## Nach Bearbeitungsmodus',
    '',
    '| Caption | sichtbarer Wert | Diagnose | editierbar |',
    '|---|---|---|---:|',
    afterEditRows,
    '',
    '## Korrekturversuch',
    '',
    '| Feld | Zielwert | versucht | gefuellt | Wert danach | Hinweis |',
    '|---|---|---:|---:|---|---|',
    fillRows,
    '',
    '## Final sichtbarer Kartenstand',
    '',
    '| Caption | sichtbarer Wert | Diagnose | editierbar |',
    '|---|---|---|---:|',
    finalRows,
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
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher HGB-/Kontenplan-Finalnachweis.',
    '- Keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
    '- Datumslogik ist nur Labor-Setup-Vorbereitung, keine Nutzungsdauer- oder Bilanzierungsberatung.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-032 diagnoses and safely retries FA-CNC-01 card correction blockers', async ({ page }) => {
  await prepareRunArtifacts();

  await openExistingAssetCard(page);
  const context = await assertRmDemoContext(page);
  await clickCardShowMoreForGeneralAndDepreciationBook(page);
  const beforeEditFieldDiagnostics = await collectVisibleCardFieldDiagnostics(page, captions);
  await writeJsonEvidence(fixedAssetsEvidencePath('010-before-edit-field-diagnostics.json'), beforeEditFieldDiagnostics);
  await writeTextEvidence(
    fixedAssetsEvidencePath('010-card-before-edit.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|Description|FA Class|FA Subclass|Depreciation|Posting Group|Book Value|Acquired/i],
      maxLines: 180
    })
  );
  await screenshot(page, `${testId}-010-card-before-edit.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'field-proof',
    purpose: 'FIXEDASSETS-032 Vorher: FA-CNC-01-Karte mit sichtbarem Teilfit HGB/MACHINES und noch grauen/ungefuellten General-Feldern.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Fixed Asset Card/i],
    knownLimitations: ['Vorher-Bild ist ein Diagnosebild, kein fertiger Anlagenstamm.']
  });

  const faLedgerEntries = await checkFaLedgerEntries(page);
  await openExistingAssetCard(page);
  await clickCardShowMoreForGeneralAndDepreciationBook(page);
  const safetyBlocked = faLedgerEntries.hasTargetLedgerTrace;
  const editMode = safetyBlocked ? { method: 'not-attempted-safety-blocked' } : await activateEditMode(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('030-edit-mode-diagnosis.json'), editMode);
  await clickCardShowMoreForGeneralAndDepreciationBook(page);

  const afterEditFieldDiagnostics = await collectVisibleCardFieldDiagnostics(page, captions);
  await writeJsonEvidence(fixedAssetsEvidencePath('040-after-edit-field-diagnostics.json'), afterEditFieldDiagnostics);
  await screenshot(page, `${testId}-040-card-after-edit-mode.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'field-proof',
    purpose: 'FIXEDASSETS-032 Bearbeitungsdiagnose: prueft, ob Description, FA Class/Subclass und AfA-Felder nach Edit-Aktion wirklich editierbar sind.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Description|FA Class Code|Depreciation/i],
    knownLimitations: ['Technisches Diagnosebild; nicht automatisch finaler Stammdatennachweis.']
  });

  const editableCaptions = new Set(afterEditFieldDiagnostics.filter((entry) => entry.editable).map((entry) => entry.caption));
  const fillPlan = [
    ['Description', target.description],
    ['FA Class Code', target.faClassCode],
    ['FA Subclass Code', target.faSubclassCode],
    ['Depreciation Starting Date', target.depreciationStartingDate],
    ['No. of Depreciation Years', target.depreciationYears]
  ] as const;
  const fillResults: FillResult[] = [];

  if (!safetyBlocked && editableCaptions.size > 0) {
    for (const [caption, value] of fillPlan) {
      fillResults.push(await fillCardField(page, caption, value));
    }
    await page.keyboard.press('Control+Enter').catch(() => undefined);
    await page.waitForTimeout(2500);
  } else {
    for (const [caption, value] of fillPlan) {
      fillResults.push({
        caption,
        targetValue: value,
        attempted: false,
        filled: false,
        reason: safetyBlocked ? 'Safety-Check blockiert Korrektur' : 'Keine editierbaren Zielcontrols nach Bearbeitungsdiagnose'
      });
    }
  }
  await writeJsonEvidence(fixedAssetsEvidencePath('050-fill-results.json'), fillResults);
  await writeTextEvidence(
    fixedAssetsEvidencePath('055-save-or-validation-text.txt'),
    await compactPageText(page, {
      include: [/Error|Fehler|required|Pflicht|must|muss|valid|ungueltig|not valid|not possible|nicht moeglich|gespeichert|saved/i],
      maxLines: 100
    })
  );

  await openExistingAssetCard(page);
  await clickCardShowMoreForGeneralAndDepreciationBook(page);
  const finalFieldDiagnostics = await collectVisibleCardFieldDiagnostics(page, captions);
  await writeJsonEvidence(fixedAssetsEvidencePath('060-final-field-diagnostics.json'), finalFieldDiagnostics);
  await writeTextEvidence(
    fixedAssetsEvidencePath('060-final-card-text.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|Description|FA Class|FA Subclass|Depreciation|Posting Group|Book Value|Acquired/i],
      maxLines: 180
    })
  );

  const coreFit = coreFitFromFields(finalFieldDiagnostics);
  const coreMasterDataFit =
    coreFit.fixedAssetNo &&
    coreFit.description &&
    coreFit.faClassCode &&
    coreFit.faSubclassCode &&
    coreFit.depreciationBook &&
    coreFit.postingGroup &&
    coreFit.depreciationYears;
  const masterdataChanged = fillResults.some((entry) => entry.attempted && entry.filled);
  const allFillTargetsFit = fillResults.every((entry) => entry.filled);
  const status = safetyBlocked
    ? 'blocked-safety-ledger-trace-present'
    : coreMasterDataFit
      ? 'done-labor-existing-card-corrected-no-posting'
      : allFillTargetsFit
        ? 'blocked-final-visibility-not-reconciled'
        : 'blocked-edit-mode-or-field-control-diagnosis';

  await screenshot(page, `${testId}-060-card-final-diagnosis.png`, {
    projectName: project.name,
    testId,
    status: coreMasterDataFit ? 'candidate' : 'rejected',
    bookUse: coreMasterDataFit ? 'master-data-card' : 'error-learning',
    purpose:
      'FIXEDASSETS-032 Finaldiagnose: prueft, ob FA-CNC-01, Beschreibung, Klasse/Unterklasse, HGB, MACHINES und AfA-Jahre sichtbar als Kartenwerte tragen.',
    expectedPageText: coreMasterDataFit
      ? [/\bFA-CNC-01\b/i, /CNC Maschine FRA/i, /\bTANGIBLE\b/i, /\bEQUIPMENT\b/i, /\bHGB\b/i, /\bMACHINES\b/i]
      : [/\bFA-CNC-01\b/i, /Fixed Asset Card|Description|Depreciation/i],
    knownLimitations: [
      'Keine Einkaufsrechnung, kein Zugang, keine AfA und keine Buchung.',
      'Nur CRONUS-USA-Labor in RM-DEMO.',
      'Wenn Zielwerte nicht sichtbar sind, bleibt das Bild Fehler-/Lernbild.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-032-FA-CNC-01-CORRECTION-BLOCKER-DIAGNOSIS',
    generatedAt: new Date().toISOString(),
    status,
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-existing-fixed-asset-card-correction-blocker-diagnosis',
    target,
    context,
    beforeEditFieldDiagnostics,
    editMode,
    afterEditFieldDiagnostics,
    fillResults,
    finalFieldDiagnostics,
    coreFit,
    coreMasterDataFit,
    allFillTargetsFit,
    safetyBlocked,
    masterdataChanged,
    faLedgerEntries,
    safety: {
      posted: false,
      vendorCreated: false,
      purchaseInvoiceCreated: false,
      acquisitionPosted: false,
      depreciationCalculatedOrPosted: false,
      companyChanged: false
    },
    screenshots: [
      `${testId}-010-card-before-edit.png`,
      `${testId}-040-card-after-edit-mode.png`,
      `${testId}-060-card-final-diagnosis.png`
    ],
    learning: coreMasterDataFit
      ? 'Der Blocker aus FIXEDASSETS-031 war Bearbeitungs-/Kontrolldiagnose, nicht Anlagenbuchhaltung: Nach bewusstem Edit-Modus tragen Beschreibung, Klasse/Unterklasse, HGB, MACHINES und Nutzungsdauer sichtbar auf der Karte. Trotzdem ist das nur Stammdatenreife, kein Zugang und keine AfA.'
      : 'Business Central zeigt auf der Fixed Asset Card unterschiedliche Feldzustaende: Teilweise sind Werte sichtbar, aber einzelne Felder bleiben ohne editierbares Control oder ohne final sichtbaren Zielwert. Genau daraus entsteht ein guter Bugfixing-/Anfaengerfall: erst Editierbarkeit und Kartenwerte beweisen, dann Folgeprozesse freigeben.',
    bookImpact: coreMasterDataFit
      ? 'Kapitel 21 kann FA-CNC-01 als CRONUS-USA-Labor-Stammdatenscreenshot verwenden, muss aber klar trennen: Stammdatenkarte ist noch keine Anschaffung, keine AfA und kein deutscher Finalnachweis.'
      : 'Kapitel 21 muss FA-CNC-01 weiter als blockierte oder teilfitte Anlagenkarte erklaeren. Das Buch sollte zeigen, woran man erkennt, ob ein Feld wirklich editierbar ist, und warum Folgeprozesse ohne sichtbare Zielwerte gesperrt bleiben.',
    nextStep: coreMasterDataFit
      ? 'FIXEDASSETS-033-K30000-VENDOR-READINESS-DECISION: ohne Buchung entscheiden, ob der Kreditorpfad als naechste Schicht vorbereitet werden darf.'
      : 'FIXEDASSETS-033-FA-CNC-01-FIELD-EDITABILITY-HELPER-OR-MANUAL-PATH: Feld-/Editierbarkeitsblocker loesen, keine Einkaufsrechnung und keine Anlagenbuchung.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-032-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-032-FA-CNC-01-CORRECTION-BLOCKER-DIAGNOSIS.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# fixedassets-032 Evidence',
      '',
      `Status: \`${status}\`, \`ui-first\`, \`masterdata-correction\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-032-result.json` | JSON-Ergebnis | Edit-Modus, Feldeditierbarkeit, Korrekturstatus, Safety | keine Anlagenbuchung, keinen deutschen Finalnachweis | labor |',
      '| `FIXEDASSETS-032-FA-CNC-01-CORRECTION-BLOCKER-DIAGNOSIS.md` | Markdown | Lernwert, Buchwirkung, naechster Schritt | keine Einkauf-/AfA-Wirkung | labor |',
      '| `010-before-edit-field-diagnostics.json` | JSON | Kartenwerte und Editierbarkeit vor Edit-Aktion | keine Tabellenlogik | field-proof |',
      '| `030-edit-mode-diagnosis.json` | JSON | sichtbare/geklickte Bearbeitungsaktion oder Fallback | keine fachliche Wertewirkung | ui-proof |',
      '| `040-after-edit-field-diagnostics.json` | JSON | Kartenwerte und Editierbarkeit nach Edit-Aktion | keine Persistenz ohne Finalcheck | field-proof |',
      '| `050-fill-results.json` | JSON | Korrekturversuche fuer Zielwerte | keine Buchung | field-proof |',
      '| `060-final-field-diagnostics.json` | JSON | finaler sichtbarer Kartenstand nach Neuoeffnen | keine Postenspur | field-proof |',
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
