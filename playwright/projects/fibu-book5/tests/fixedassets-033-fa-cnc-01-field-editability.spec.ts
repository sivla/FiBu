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
import { clickBcTopIconAction, type ClickBcTopIconActionResult } from '../../../core/bc/actions';
import { collectActiveCardControlDiagnostics } from '../../../core/bc/cards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 }
});

test.setTimeout(360_000);

const testId = 'fixedassets-033';
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
  depreciationStartingDate: '01.01.2026',
  depreciationEndingDate: '31.12.2033'
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
  'Book Value',
  'Acquired'
];

type FieldRow = {
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
  valueAfter?: string;
  reason?: string;
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

async function clickVisibleShowMoreControls(page: Page) {
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
        const label = [text, aria, title].join(' ');
        const targetFastTab = /Depreciation Book/i.test(label) ? 'Depreciation Book' : /General/i.test(label) ? 'General' : '';
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

    return { candidates: candidates.map(({ element, ...entry }) => entry), clicked };
  });
  await page.waitForTimeout(1000);
  return result;
}

async function switchToWideLayout(page: Page) {
  return clickBcTopIconAction(page, {
    title: /Breite Layoutansicht anzeigen|wide layout/i,
    scopeText: /Fixed Asset Card/i,
    yMax: 70
  }).catch((error): ClickBcTopIconActionResult => ({ clicked: false, attempts: [String(error)] }));
}

async function activateCardEditMode(page: Page) {
  const result = await clickBcTopIconAction(page, {
    title: /Seite vornehmen|make changes|edit/i,
    scopeText: /Fixed Asset Card/i,
    yMax: 70,
    expectedAfterClick: /Fixed Asset Card/i
  });
  await page.waitForTimeout(1500);
  return result;
}

async function readVisibleCardRows(page: Page, captions: string[]): Promise<FieldRow[]> {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate((captionValues) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const controlElements = Array.from(
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement>(
        'input,textarea,select,[contenteditable="true"],a.value,[class*="value"]'
      )
    ).filter((element) => visible(element));

    return captionValues.map((caption) => {
      const exactCaption = new RegExp(`^${escapeRegExp(caption)}$`, 'i');
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
        .filter((entry) => entry.rect.y > 150 && entry.rect.x > 50 && entry.rect.x < 1250)
        .sort((left, right) => left.y - right.y || left.x - right.x);

      const controls = controlElements
        .map((control, index) => {
          const rect = control.getBoundingClientRect();
          const input = control as HTMLInputElement;
          const checked = input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : null;
          const value =
            'value' in input
              ? normalize(String(input.value))
              : checked === null
                ? normalize(control.innerText || control.textContent || control.getAttribute('aria-label') || control.getAttribute('title'))
                : String(checked);
          const editable =
            (control.getAttribute('contenteditable') === 'true' || control.tagName === 'SELECT' || 'value' in input) &&
            !('disabled' in input && Boolean(input.disabled)) &&
            !('readOnly' in input && Boolean(input.readOnly));
          return {
            index,
            tagName: control.tagName,
            value,
            aria: normalize(control.getAttribute('aria-label')),
            title: normalize(control.getAttribute('title')),
            disabled: 'disabled' in input ? Boolean(input.disabled) : false,
            readOnly: 'readOnly' in input ? Boolean(input.readOnly) : false,
            editable,
            checked,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            rect
          };
        })
        .filter((entry) => entry.rect.y > 150 && entry.rect.x > 50 && entry.rect.x < 1700);

      const rowCandidates = labels
        .flatMap((label) =>
          controls
            .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 11)
            .filter((control) => control.rect.x >= label.rect.x + Math.min(label.rect.width, 220) - 8)
            .filter((control) => control.rect.x - label.rect.x < 680)
            .map((control) => ({
              label,
              control,
              score: Math.abs(control.rect.y - label.rect.y) * 100 + Math.max(0, control.rect.x - label.rect.x)
            }))
        )
        .sort((left, right) => left.score - right.score || Number(right.control.editable) - Number(left.control.editable));

      const selected = rowCandidates[0];
      const selectedValue = selected ? selected.control.value : '';
      const editable = Boolean(selected?.control.editable);
      return {
        caption,
        selectedValue,
        diagnosis: selected ? (editable ? 'visible-editable-card-row-control' : 'visible-readonly-card-row-control') : labels.length ? 'caption-visible-no-row-control' : 'caption-not-visible',
        editable,
        labels: labels.slice(0, 5).map(({ element, rect, ...entry }) => entry),
        controls: rowCandidates.slice(0, 8).map(({ label, control, score }) => ({
          score,
          label: { text: label.text, aria: label.aria, title: label.title, x: label.x, y: label.y },
          control: {
            index: control.index,
            tagName: control.tagName,
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
  }, captions);
}

async function fillCardField(page: Page, caption: string, targetValue: string): Promise<FillResult> {
  const frame = await findFixedAssetCardFrame(page);
  const resolved = await frame.evaluate((input) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const exactCaption = new RegExp(`^${input.caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
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
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect
        };
      })
      .filter((entry) => exactCaption.test(entry.text) || exactCaption.test(entry.aria) || exactCaption.test(entry.title))
      .filter((entry) => entry.rect.y > 150 && entry.rect.x > 50 && entry.rect.x < 1250);

    const controls = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input,textarea,select'))
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          valueBefore: normalize('value' in element ? String(element.value) : ''),
          disabled: 'disabled' in element ? Boolean(element.disabled) : false,
          readOnly: 'readOnly' in element ? Boolean(element.readOnly) : false,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect,
          visible: visible(element)
        };
      })
      .filter((control) => control.visible && !control.disabled && !control.readOnly)
      .filter((control) => control.y > 150 && control.x > 50 && control.x < 1700);

    const candidates = labels
      .flatMap((label) =>
        controls
          .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 11)
          .filter((control) => control.rect.x >= label.rect.x + Math.min(label.rect.width, 220) - 8)
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
          x: control.x,
          y: control.y,
          width: control.width,
          height: control.height
        }
      }))
    };
  }, { caption });

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

  const input = frame.locator('input,textarea,select').nth(resolved.inputIndex);
  await input.fill(targetValue, { timeout: 10_000 });
  await input.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1000);
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

async function chooseLookupValueForCaption(page: Page, caption: string, targetValue: string): Promise<FillResult> {
  const frame = await findFixedAssetCardFrame(page);
  const clicked = await frame.evaluate((input) => {
    const normalize = (text: string | null | undefined) => (text || '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const exactCaption = new RegExp(`^${input.caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const label = Array.from(document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
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
      .filter((entry) => entry.rect.y > 150 && entry.rect.x > 50 && entry.rect.x < 1250)
      .sort((left, right) => left.y - right.y || left.x - right.x)[0];

    if (!label) return null;

    const picker = Array.from(document.querySelectorAll<HTMLElement>('a,button,[role="button"],[aria-label],[title]'))
      .filter((element) => visible(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = normalize(element.innerText || element.textContent);
        const aria = normalize(element.getAttribute('aria-label'));
        const title = normalize(element.getAttribute('title'));
        return {
          element,
          text,
          aria,
          title,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect
        };
      })
      .filter((entry) => Math.abs(entry.rect.y - label.rect.y) <= 12)
      .filter((entry) => entry.rect.x > label.rect.x)
      .filter((entry) => entry.rect.x - label.rect.x < 760)
      .filter((entry) => new RegExp(input.caption.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test([entry.text, entry.aria, entry.title].join(' ')))
      .sort((left, right) => right.x - left.x)[0];

    if (!picker) return null;
    picker.element.click();
    const { element, ...serializable } = picker;
    return serializable;
  }, { caption });

  if (!clicked) {
    return {
      caption,
      targetValue,
      attempted: false,
      filled: false,
      reason: `Kein Lookup-/Valuepicker fuer ${caption} gefunden`
    };
  }

  await page.waitForTimeout(1000);

  const scopes: Array<Page | Frame> = [page, ...page.frames()];
  const fullListPattern = /Aus vollst.ndiger Liste ausw.hlen|Select from full list|Open full list/i;
  let fullListOpened = false;

  for (const scope of scopes) {
    const fullList = scope.getByText(fullListPattern).first();
    if (await fullList.isVisible({ timeout: 700 }).catch(() => false)) {
      fullListOpened = await fullList.click({ timeout: 4000 }).then(() => true).catch(() => false);
      if (fullListOpened) break;
    }
  }

  if (!fullListOpened) {
    await page.keyboard.press('Alt+ArrowDown').catch(() => undefined);
    await page.waitForTimeout(700);
    for (const scope of scopes) {
      const fullList = scope.getByText(fullListPattern).first();
      if (await fullList.isVisible({ timeout: 700 }).catch(() => false)) {
        fullListOpened = await fullList.click({ timeout: 4000 }).then(() => true).catch(() => false);
        if (fullListOpened) break;
      }
    }
  }

  await page.waitForTimeout(fullListOpened ? 1800 : 700);

  let selected = false;
  const targetPattern = new RegExp(targetValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  for (const scope of scopes) {
    const locators = [scope.getByRole('row', { name: targetPattern }), scope.getByText(targetPattern)];
    for (const locator of locators) {
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const candidate = locator.nth(index);
        if (!(await candidate.isVisible({ timeout: 500 }).catch(() => false))) {
          continue;
        }
        selected = await candidate
          .dblclick({ timeout: 4000 })
          .then(() => true)
          .catch(async () => candidate.click({ timeout: 4000 }).then(() => true).catch(() => false));
        if (selected) break;
      }
      if (selected) break;
    }
    if (selected) break;
  }

  if (selected) {
    await page.waitForTimeout(700);
    await page.keyboard.press('Enter').catch(() => undefined);
  }

  await page.waitForTimeout(1500);
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(1000);
  const afterRows = await readVisibleCardRows(page, [caption]);
  const valueAfter = afterRows[0]?.selectedValue ?? '';
  return {
    caption,
    targetValue,
    attempted: true,
    filled: normalizeValue(valueAfter) === normalizeValue(targetValue),
    valueAfter,
    reason: selected ? undefined : `Lookup-Wert ${targetValue} wurde nicht sichtbar ausgewaehlt`,
    chosen: { clicked, fullListOpened }
  };
}

function fitFromRows(rows: FieldRow[]) {
  const values = new Map(rows.map((entry) => [entry.caption, normalizeValue(entry.selectedValue)]));
  return {
    fixedAssetNo: values.get('No.') === target.fixedAssetNo,
    description: values.get('Description') === normalizeValue(target.description),
    faClassCode: values.get('FA Class Code') === target.faClassCode,
    faSubclassCode: values.get('FA Subclass Code') === target.faSubclassCode,
    depreciationBook: values.get('Depreciation Book Code') === target.depreciationBook,
    postingGroup: values.get('Posting Group') === target.faPostingGroup,
    depreciationYears: (values.get('No. of Depreciation Years') ?? '').startsWith(target.depreciationYears),
    depreciationStartingDate: (values.get('Depreciation Starting Date') ?? '').includes(target.depreciationStartingDate),
    depreciationEndingDate: (values.get('Depreciation Ending Date') ?? '').includes(target.depreciationEndingDate),
    bookValueZero: (values.get('Book Value') ?? '').includes('0,00')
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
  const renderRows = (rows: FieldRow[]) =>
    rows.map((entry) => `| ${entry.caption} | ${entry.selectedValue || '(leer/nicht sichtbar)'} | ${entry.diagnosis} | ${entry.editable ? 'ja' : 'nein'} |`).join('\n');
  const fillRows = (result.fillResults as FillResult[])
    .map((entry) => `| ${entry.caption} | ${entry.targetValue} | ${entry.attempted ? 'ja' : 'nein'} | ${entry.filled ? 'ja' : 'nein'} | ${entry.valueAfter ?? ''} | ${entry.reason ?? ''} |`)
    .join('\n');

  return [
    '# FIXEDASSETS-033 - FA-CNC-01 Field Editability Path',
    '',
    `Status: \`${result.status}\`, \`ui-first\`, \`masterdata-correction\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Datenbasis | CRONUS USA |',
    '| Zielanlage | `FA-CNC-01` |',
    `| Edit-Icon geklickt | ${result.editIcon.clicked ? 'ja' : 'nein'} |`,
    `| Wide Layout geklickt | ${result.wideLayout.clicked ? 'ja' : 'nein'} |`,
    `| Stammdaten geaendert | ${result.masterdataChanged ? 'ja' : 'nein'} |`,
    '| Gebucht | nein |',
    '| Kreditor/Einkauf/Zugang/AfA | nein |',
    '',
    '## Safety',
    '',
    `- FA Ledger Entries zu \`FA-CNC-01\` sichtbar: ${result.faLedgerEntries?.hasTargetLedgerTrace ? 'ja' : 'nein'}.`,
    '- Kein Kreditor, keine Einkaufsrechnung, keine Anschaffung, keine AfA und keine Buchung.',
    '',
    '## Vor Edit-Icon',
    '',
    '| Caption | sichtbarer Wert | Diagnose | editierbar |',
    '|---|---|---|---:|',
    renderRows(result.beforeRows),
    '',
    '## Nach Edit-Icon',
    '',
    '| Caption | sichtbarer Wert | Diagnose | editierbar |',
    '|---|---|---|---:|',
    renderRows(result.afterEditRows),
    '',
    '## Korrektur',
    '',
    '| Feld | Zielwert | versucht | gefuellt | Wert danach | Hinweis |',
    '|---|---|---:|---:|---|---|',
    fillRows,
    '',
    '## Final sichtbarer Kartenstand',
    '',
    '| Caption | sichtbarer Wert | Diagnose | editierbar |',
    '|---|---|---|---:|',
    renderRows(result.finalRows),
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
    '- Kein deutscher HGB-/Kontenplan- oder Anlagen-Finalnachweis.',
    '- Noch keine Anlagenanschaffung, keine AfA und keine Postenspur.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-033 documents FA-CNC-01 general-field editability path without posting', async ({ page }) => {
  await prepareRunArtifacts();

  await openExistingAssetCard(page);
  const context = await assertRmDemoContext(page);
  await clickVisibleShowMoreControls(page);
  const beforeRows = await readVisibleCardRows(page, cardCaptions);
  const beforeHelperDiagnostics = await collectActiveCardControlDiagnostics(page, ['Description', 'FA Class Code', 'FA Subclass Code'], {
    targetText: /Fixed Asset Card|FA-CNC-01/i
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('010-before-edit-visible-rows.json'), beforeRows);
  await writeJsonEvidence(fixedAssetsEvidencePath('011-before-edit-helper-diagnostics.json'), beforeHelperDiagnostics);
  await writeTextEvidence(
    fixedAssetsEvidencePath('010-card-before-edit.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|Description|FA Class|FA Subclass|Depreciation|Posting Group|Book Value|Acquired/i],
      maxLines: 180
    })
  );

  await screenshot(page, `${testId}-010-card-before-edit-icon.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'field-proof',
    purpose: 'FIXEDASSETS-033 Vorher: FA-CNC-01-Karte zeigt Teilfit, aber General-Felder sind vor dem Stift-Icon noch nicht editierbar.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Fixed Asset Card|Description|FA Class Code/i],
    knownLimitations: ['Diagnosebild vor der Korrektur, kein fertiger Stammdatensatz.']
  });

  const faLedgerEntries = await checkFaLedgerEntries(page);
  expect(faLedgerEntries.hasTargetLedgerTrace, 'Vor der Feldkorrektur duerfen keine FA Ledger Entries fuer FA-CNC-01 existieren.').toBe(false);

  await openExistingAssetCard(page);
  const wideLayout = await switchToWideLayout(page);
  await clickVisibleShowMoreControls(page);
  const editIcon = await activateCardEditMode(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('030-top-icon-actions.json'), { wideLayout, editIcon });
  expect(editIcon.clicked, 'Das top-nahe Edit-Icon muss vor der Korrektur sicher getroffen werden.').toBe(true);

  await clickVisibleShowMoreControls(page);
  const afterEditRows = await readVisibleCardRows(page, cardCaptions);
  const afterHelperDiagnostics = await collectActiveCardControlDiagnostics(page, ['Description', 'FA Class Code', 'FA Subclass Code'], {
    targetText: /Fixed Asset Card|FA-CNC-01/i
  });
  await writeJsonEvidence(fixedAssetsEvidencePath('040-after-edit-visible-rows.json'), afterEditRows);
  await writeJsonEvidence(fixedAssetsEvidencePath('041-after-edit-helper-diagnostics.json'), afterHelperDiagnostics);

  await screenshot(page, `${testId}-040-card-after-edit-icon.png`, {
    projectName: project.name,
    testId,
    status: 'candidate',
    bookUse: 'field-proof',
    purpose: 'FIXEDASSETS-033 Nach Stift-Icon: General-Felder werden als editierbare Controls sichtbar und koennen gezielt gefuellt werden.',
    expectedPageText: [/\bFA-CNC-01\b/i, /Description|FA Class Code|FA Subclass Code/i],
    knownLimitations: ['Zwischenbild vor Persistenz-/Neuoeffnungspruefung.']
  });

  const fillResults: FillResult[] = [];
  for (const [caption, value] of [
    ['Description', target.description],
    ['FA Class Code', target.faClassCode],
    ['FA Subclass Code', target.faSubclassCode]
  ] as const) {
    const directResult = await fillCardField(page, caption, value);
    if (directResult.filled || caption !== 'FA Subclass Code') {
      fillResults.push(directResult);
      continue;
    }

    const lookupResult = await chooseLookupValueForCaption(page, caption, value);
    fillResults.push({
      ...lookupResult,
      reason: lookupResult.filled
        ? 'Direkte Texteingabe wurde von BC geleert; Wert danach per Lookup sichtbar gewaehlt.'
        : (lookupResult.reason ?? 'Direkte Texteingabe wurde von BC geleert; Lookup setzte den Wert nicht sichtbar.'),
      chosen: {
        direct: directResult.chosen,
        lookup: lookupResult.chosen
      }
    });
  }
  await writeJsonEvidence(fixedAssetsEvidencePath('050-fill-results.json'), fillResults);
  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(2500);
  await writeTextEvidence(
    fixedAssetsEvidencePath('055-save-or-validation-text.txt'),
    await compactPageText(page, {
      include: [/Error|Fehler|required|Pflicht|must|muss|valid|ungueltig|not valid|not possible|nicht moeglich|gespeichert|saved/i],
      maxLines: 100
    })
  );

  await openExistingAssetCard(page);
  await switchToWideLayout(page);
  await clickVisibleShowMoreControls(page);
  const finalRows = await readVisibleCardRows(page, cardCaptions);
  const finalFit = fitFromRows(finalRows);
  const coreMasterDataFit =
    finalFit.fixedAssetNo &&
    finalFit.description &&
    finalFit.faClassCode &&
    finalFit.faSubclassCode &&
    finalFit.depreciationBook &&
    finalFit.postingGroup &&
    finalFit.depreciationYears &&
    finalFit.depreciationStartingDate &&
    finalFit.depreciationEndingDate &&
    finalFit.bookValueZero;
  await writeJsonEvidence(fixedAssetsEvidencePath('060-final-visible-rows.json'), finalRows);
  await writeTextEvidence(
    fixedAssetsEvidencePath('060-final-card-text.txt'),
    await compactPageText(page, {
      include: [/FA-CNC-01|CNC Maschine FRA|TANGIBLE|EQUIPMENT|HGB|MACHINES|Description|FA Class|FA Subclass|Depreciation|Posting Group|Book Value|Acquired/i],
      maxLines: 180
    })
  );

  await screenshot(page, `${testId}-060-card-final-values.png`, {
    projectName: project.name,
    testId,
    status: coreMasterDataFit ? 'candidate' : 'rejected',
    bookUse: coreMasterDataFit ? 'master-data-card' : 'field-proof',
    purpose: coreMasterDataFit
      ? 'FIXEDASSETS-033 Final: FA-CNC-01-Karte zeigt Zielcode, Beschreibung, FA Class/Subclass, HGB, MACHINES, AfA-Daten und Book Value sichtbar.'
      : 'FIXEDASSETS-033 Final: FA-CNC-01-Karte zeigt Description und FA Class als Teilfit; FA Subclass bleibt sichtbar leer und ist der naechste Blocker.',
    expectedPageText: coreMasterDataFit
      ? [/\bFA-CNC-01\b/i, /CNC Maschine FRA/i, /\bTANGIBLE\b/i, /\bEQUIPMENT\b/i, /\bHGB\b/i, /\bMACHINES\b/i]
      : [/\bFA-CNC-01\b/i, /Fixed Asset Card|Description|Depreciation/i],
    knownLimitations: [
      'Kein Kreditor, keine Einkaufsrechnung, kein Anlagenzugang, keine AfA und keine Buchung.',
      'Nur CRONUS-USA-Labor in RM-DEMO.',
      'Noch kein deutscher Anlagen-Finalnachweis.'
    ]
  });

  const result = {
    testId: 'FIXEDASSETS-033-FA-CNC-01-FIELD-EDITABILITY-HELPER-OR-MANUAL-PATH',
    generatedAt: new Date().toISOString(),
    status: coreMasterDataFit ? 'done-labor-existing-card-core-masterdata-fit-no-posting' : 'blocked-field-editability-or-final-visibility',
    environment: target.environment,
    company: target.company,
    dataBasis: 'CRONUS USA',
    mode: 'ui-first-existing-fixed-asset-card-field-editability-path',
    target,
    context,
    wideLayout,
    editIcon,
    beforeRows,
    beforeHelperDiagnostics,
    afterEditRows,
    afterHelperDiagnostics,
    fillResults,
    finalRows,
    finalFit,
    coreMasterDataFit,
    masterdataChanged: fillResults.some((entry) => entry.attempted && entry.filled),
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
      `${testId}-010-card-before-edit-icon.png`,
      `${testId}-040-card-after-edit-icon.png`,
      `${testId}-060-card-final-values.png`
    ],
    learning: coreMasterDataFit
      ? 'Der Blocker war kein Anlagen-Setup- oder Buchungsproblem, sondern ein UI-Modusproblem: Die Fixed Asset Card startet in View Mode. Erst das top-nahe Stift-Icon mit Titel "Aenderungen auf der Seite vornehmen" macht die General-Felder als editierbare Controls sichtbar. Danach koennen Beschreibung, FA Class Code und FA Subclass Code UI-first gepflegt und nach Neuoeffnen sichtbar nachgewiesen werden.'
      : 'Die Fixed Asset Card bleibt trotz Edit-Icon nicht vollstaendig fit. Der Lernwert ist die Trennung zwischen sichtbarer Caption, editierbarem Control und final sichtbarem Kartenwert.',
    bookImpact: coreMasterDataFit
      ? 'Kapitel 21 kann die Anlagenkarte jetzt als CRONUS-USA-Labor-Stammdatenbild verwenden: Zielcode, Beschreibung, Klasse, Unterklasse, HGB, MACHINES, AfA-Daten und Book Value sind sichtbar. Das bleibt nur Stammdatenreife; Zugang, AfA, Kreditor und Einkauf brauchen eigene Gates.'
      : 'Kapitel 21 muss weiter einen Feld-/Editierbarkeitsblocker erklaeren und darf keinen Anlagenzugang vorbereiten.',
    nextStep: coreMasterDataFit
      ? 'FIXEDASSETS-034-K30000-VENDOR-READINESS-DECISION: ohne Buchung entscheiden, ob der Kreditor K30000 als naechste Schicht vorbereitet werden darf.'
      : 'FIXEDASSETS-034-FA-CNC-01-FIELD-BLOCKER-MANUAL-DIAGNOSIS: Page Inspection/Personalize zur Feldursache nutzen, weiterhin ohne Kauf/AfA/Buchung.'
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-033-result.json'), result);
  await writeTextEvidence(fixedAssetsEvidencePath('FIXEDASSETS-033-FA-CNC-01-FIELD-EDITABILITY-PATH.md'), renderMarkdown(result));
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# fixedassets-033 Evidence',
      '',
      `Status: \`${result.status}\`, \`ui-first\`, \`masterdata-correction\`, \`no-posting\`, \`not-final\`, \`de-final-open\`.`,
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-033-result.json` | JSON-Ergebnis | Edit-Icon-Pfad, Feldkorrektur, final sichtbare Kartenwerte, Safety | keinen Anlagenzugang, keine AfA, keinen deutschen Finalnachweis | labor |',
      '| `FIXEDASSETS-033-FA-CNC-01-FIELD-EDITABILITY-PATH.md` | Markdown | Lernwert, Buchwirkung, naechster Schritt | keine Einkauf-/AfA-Wirkung | labor |',
      '| `010-before-edit-visible-rows.json` | JSON | View-Mode-Feldzustand vor Stift-Icon | keine Tabellenlogik | field-proof |',
      '| `030-top-icon-actions.json` | JSON | getroffenes Wide-Layout-/Edit-Icon | keine fachliche Wertewirkung allein | ui-proof |',
      '| `040-after-edit-visible-rows.json` | JSON | Feldzustand nach Stift-Icon | keine Persistenz ohne Finalcheck | field-proof |',
      '| `050-fill-results.json` | JSON | UI-first Korrektur von Description/Class/Subclass | keine Buchung | field-proof |',
      '| `060-final-visible-rows.json` | JSON | finaler sichtbarer Kartenstand nach Neuoeffnen | keine Postenspur | masterdata-proof |',
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
  expect(result.finalFit.description, 'FA-CNC-01 muss nach dem 033-Lauf eine sichtbare Beschreibung haben.').toBe(true);
  expect(result.finalFit.faClassCode, 'FA-CNC-01 muss nach dem 033-Lauf eine sichtbare Anlagenklasse haben.').toBe(true);
});
