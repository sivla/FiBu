import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-279';
const CASE_ID = 'FIXEDASSETS-279-FA-DEPRECIATION-CARD-FIELDVALUE-READONLY-PROBE';
const NEXT_CASE_ID = 'FIXEDASSETS-280-FA-DEPRECIATION-FIELDVALUE-RESULT-REVIEW';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const ASSET_NO = 'FA-CNC-01';
const DEPRECIATION_BOOK = 'HGB';
const ACQUISITION_DOC_NO = 'G05001';

const FIELD_CAPTIONS = [
  'No.',
  'Description',
  'Depreciation Book Code',
  'Posting Group',
  'Depreciation Method',
  'Depreciation Starting Date',
  'No. of Depreciation Years',
  'Depreciation Ending Date',
  'Book Value',
  'Acquisition Cost',
  'Acquired',
];

type FieldValue = {
  caption: string;
  selectedValue: string;
  diagnosis: string;
  labelCount?: number;
  controlCandidateCount?: number;
  displayCandidateCount?: number;
  labels: unknown[];
  controls: unknown[];
  displayCandidates: unknown[];
};

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2800, height: 1400 },
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function fixedAssetCardUrl() {
  const url = new URL(bcPageUrl(5600, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'Fixed Asset'.'No.' IS '${ASSET_NO}'`);
  return url.toString();
}

function statusFor(values: FieldValue[]) {
  const byCaption = new Map(values.map((entry) => [entry.caption, entry]));
  const hasValue = (caption: string, pattern?: RegExp) => {
    const value = byCaption.get(caption)?.selectedValue ?? '';
    return pattern ? pattern.test(value) : Boolean(value);
  };
  const depreciationCore = ['Depreciation Starting Date', 'No. of Depreciation Years', 'Depreciation Ending Date'];
  const missingDepreciationCore = depreciationCore.filter((caption) => !hasValue(caption));
  const bookValueOk = hasValue('Book Value', /120[., ]?000|120\.000|120,000/i);
  const acquisitionCostOk = hasValue('Acquisition Cost', /120[., ]?000|120\.000|120,000/i);

  if (missingDepreciationCore.length === 0 && bookValueOk) return 'field-values-visible-readonly';
  if (bookValueOk || acquisitionCostOk) return 'partial-values-visible-depreciation-core-empty-or-hidden';
  return 'depreciation-values-not-visible-or-unread';
}

async function findFixedAssetCardFrame(page: Page): Promise<Frame> {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Fixed Asset Card|FA Class Code|FA Subclass Code|Depreciation Book|Book Value/i.test(text)) {
      return frame;
    }
  }
  return page.mainFrame();
}

async function dangerousDialogs(page: Page, phase: string) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (text) dialogs.push(text);
    }
  }
  const dangerous = dialogs.filter((text) =>
    /\b(Post|Preview Posting|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Calculate Depreciation|AfA berechnen|Abschreibung berechnen)\b/i.test(
      text,
    ),
  );
  return { phase, dialogs, dangerous, ok: dangerous.length === 0 };
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const parsed = new URL(url);
  const text = await pageText(page);
  return {
    url: safeUrl(url),
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

async function openReadOnlyCard(page: Page) {
  await page.goto(fixedAssetCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset Card|FA-CNC-01|Book Value|Depreciation Book/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);
}

async function expandSafeShowMore(page: Page) {
  const frame = await findFixedAssetCardFrame(page);
  const result = await frame.evaluate(() => {
    const norm = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const dangerous = /\b(Post|Preview|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Calculate)\b/i;
    const candidates = [...document.querySelectorAll<HTMLElement>('button,[role="button"],a,[aria-label],[title]')]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = norm(element.innerText || element.textContent);
        const aria = norm(element.getAttribute('aria-label'));
        const title = norm(element.getAttribute('title'));
        const joined = [text, aria, title].join(' ');
        return {
          element,
          text,
          aria,
          title,
          joined,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => visible(entry.element))
      .filter((entry) => /show\s*more|mehr\s*anzeigen/i.test(entry.joined))
      .filter((entry) => !dangerous.test(entry.joined))
      .filter((entry) => entry.width <= 260 && entry.height <= 80)
      .sort((left, right) => left.y - right.y || left.x - right.x);

    const clicked = [];
    for (const candidate of candidates.slice(0, 4)) {
      candidate.element.click();
      const { element, joined, ...entry } = candidate;
      clicked.push(entry);
    }
    return {
      candidates: candidates.map(({ element, joined, ...entry }) => entry),
      clicked,
    };
  });

  await page.waitForTimeout(1200);
  return result;
}

async function collectVisibleCardFieldValues(page: Page, captions: string[]): Promise<FieldValue[]> {
  const frame = await findFixedAssetCardFrame(page);
  return frame.evaluate((captionValues) => {
    const norm = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const dangerousText = /\b(Post|Preview Posting|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Calculate)\b/i;

    const labelElements = [...document.querySelectorAll<HTMLElement>('a,span,div,label,[role="button"]')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          element,
          text: norm(element.innerText || element.textContent),
          aria: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          role: norm(element.getAttribute('role')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect,
        };
      })
      .filter((entry) => entry.rect.y > 120 && entry.rect.x > 120 && entry.rect.x < 1800);

    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,textarea,select')]
      .filter((input) => visible(input))
      .map((input) => {
        const rect = input.getBoundingClientRect();
        return {
          value: norm(input instanceof HTMLSelectElement ? [...input.options].find((option) => option.selected)?.text || input.value : input.value),
          aria: norm(input.getAttribute('aria-label')),
          title: norm(input.getAttribute('title')),
          role: norm(input.getAttribute('role')),
          checked: input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked : null,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect,
        };
      })
      .filter((entry) => entry.rect.y > 120 && entry.rect.x > 120 && entry.rect.x < 2100);

    const displayElements = [...document.querySelectorAll<HTMLElement>('a,span,div,[role="button"],[role="gridcell"],[role="cell"]')]
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = norm(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title'));
        return {
          text,
          aria: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          role: norm(element.getAttribute('role')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          rect,
        };
      })
      .filter((entry) => entry.text && !dangerousText.test(entry.text))
      .filter((entry) => entry.rect.y > 120 && entry.rect.x > 120 && entry.rect.x < 2100);

    return captionValues.map((caption) => {
      const exact = new RegExp(`^${escapeRegExp(caption)}$`, 'i');
      const labels = labelElements
        .filter((entry) => exact.test(entry.text) || exact.test(entry.aria) || exact.test(entry.title))
        .sort((left, right) => left.y - right.y || left.x - right.x);

      const rowControls = labels
        .flatMap((label) =>
          controls
            .filter((control) => Math.abs(control.rect.y - label.rect.y) <= 16)
            .filter((control) => control.rect.x >= label.rect.x)
            .filter((control) => control.rect.x - label.rect.x < 760)
            .map((control) => ({
              label,
              control,
              score: Math.abs(control.rect.y - label.rect.y) * 100 + Math.max(0, control.rect.x - label.rect.x),
            })),
        )
        .sort((left, right) => left.score - right.score || left.control.x - right.control.x);

      const displayCandidates = labels
        .flatMap((label) =>
          displayElements
            .filter((entry) => Math.abs(entry.rect.y - label.rect.y) <= 18)
            .filter((entry) => entry.rect.x > label.rect.x + Math.max(40, label.rect.width * 0.6))
            .filter((entry) => entry.rect.x - label.rect.x < 900)
            .filter((entry) => !exact.test(entry.text))
            .filter((entry) => !entry.text.includes(caption))
            .map((entry) => ({
              label,
              value: entry,
              score: Math.abs(entry.rect.y - label.rect.y) * 100 + Math.max(0, entry.rect.x - label.rect.x),
            })),
        )
        .sort((left, right) => left.score - right.score || left.value.x - right.value.x);

      const selectedControl = rowControls.find((entry) => entry.control.value || entry.control.checked !== null);
      const selectedDisplay = displayCandidates.find((entry) => entry.value.text && entry.value.text.length <= 120);
      const selectedValue = selectedControl
        ? selectedControl.control.checked === null
          ? selectedControl.control.value
          : String(selectedControl.control.checked)
        : selectedDisplay?.value.text ?? '';

      return {
        caption,
        selectedValue,
        diagnosis: selectedControl
          ? 'visible-card-row-control'
          : selectedDisplay
            ? 'visible-card-row-display-value'
            : labels.length
              ? 'caption-visible-empty-or-no-value-control'
              : 'caption-not-visible',
        labels: labels.slice(0, 4).map(({ element, rect, ...entry }) => entry),
        controls: rowControls.slice(0, 5).map(({ label, control, score }) => ({
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
            height: control.height,
          },
        })),
        displayCandidates: displayCandidates.slice(0, 5).map(({ label, value, score }) => ({
          score,
          label: { text: label.text, aria: label.aria, title: label.title, x: label.x, y: label.y },
          value: {
            text: value.text,
            aria: value.aria,
            title: value.title,
            role: value.role,
            x: value.x,
            y: value.y,
            width: value.width,
            height: value.height,
          },
        })),
      };
    });
  }, captions);
}

function renderMarkdown(result: Record<string, unknown>) {
  const fieldRows = (result.fieldValues as FieldValue[])
    .map((entry) => `| ${entry.caption} | ${entry.selectedValue || '(leer/nicht sichtbar)'} | ${entry.diagnosis} |`)
    .join('\n');
  const flags = result.flags as Record<string, boolean>;

  return [
    '# FIXEDASSETS-279 FA Depreciation Card Field-value Read-only Probe',
    '',
    'Status: `labor`, `read-only`, `ui-first`, `fixed-assets`, `no-posting`, `not-final`, `de-final-open`.',
    '',
    '## Ziel',
    '',
    'FA-279 prueft auf der Anlagenkarte von FA-CNC-01, ob die fuer die Abschreibung relevanten Kartenfelder sichtbar Werte liefern oder ob sie leer bzw. nicht ueber den Karten-Mapping-Ansatz lesbar sind. Der Lauf ist ein Diagnosebeweis vor jeder weiteren Abschreibungsaktion.',
    '',
    '## Kontext',
    '',
    '| Punkt | Wert |',
    '|---|---|',
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | ${ASSET_NO} |`,
    `| AfA-Buch | ${DEPRECIATION_BOOK} |`,
    `| Ergebnisstatus | ${result.resultStatus} |`,
    '',
    '## Feldwerte',
    '',
    '| Feld | Sichtbarer/lesbarer Wert | Diagnose |',
    '|---|---|---|',
    fieldRows,
    '',
    '## Safety',
    '',
    ...Object.entries(flags).map(([key, value]) => `- ${key}: ${value ? 'ja' : 'nein'}`),
    '',
    '## Ergebnis',
    '',
    ...(result.proved as string[]).map((entry) => `- Nachgewiesen: ${entry}`),
    ...(result.notProved as string[]).map((entry) => `- Nicht nachgewiesen: ${entry}`),
    '',
    '## Buchwirkung',
    '',
    'Die Buchanleitung darf die vorhandenen Anschaffungswerte, das AfA-Buch HGB sowie Startdatum, Nutzungsdauer und Enddatum als sichtbaren Laborbefund verwenden. Fuer Abschreibungsbuchungen ist damit aber nur die Kartenbasis belegt; Journal-/Batch-, Preview- und Posten-Evidence bleiben getrennte Nachweisschritte.',
    '',
    '## Naechster Schritt',
    '',
    `Naechster lokaler Review: ${NEXT_CASE_ID}.`,
    '',
  ].join('\n');
}

test('FA-279 reads visible fixed asset depreciation card field values without changing data', async ({ page }) => {
  await openReadOnlyCard(page);
  const contextBefore = await sandboxContext(page);
  expect(contextBefore.environmentInUrl, `URL muss ${EXPECTED_INSTANCE} enthalten`).toBeTruthy();
  expect(contextBefore.companyInUrl, `URL muss company=${EXPECTED_COMPANY} enthalten`).toBeTruthy();
  expect(contextBefore.wrongEnvironmentVisible, 'Produktivsignal darf nicht sichtbar sein').toBeFalsy();

  const dialogsBefore = await dangerousDialogs(page, 'before-field-probe');
  expect(dialogsBefore.ok, `Gefaehrlicher Dialog vor Feldprobe: ${dialogsBefore.dangerous.join(' | ')}`).toBeTruthy();

  const showMore = await expandSafeShowMore(page);
  const focusedText = await compactPageText(page, {
    include: [
      /Fixed Asset Card|FA-CNC-01|CNC|Depreciation Book|HGB|Depreciation Starting Date|No\. of Depreciation Years|Depreciation Ending Date|Book Value|Acquisition Cost|120\.000|120,000|120000|G05001/i,
    ],
    maxLines: 140,
    maxLineLength: 220,
  });
  const rawFieldValues = await collectVisibleCardFieldValues(page, FIELD_CAPTIONS);
  const fieldValues: FieldValue[] = rawFieldValues.map((entry) => ({
    caption: entry.caption,
    selectedValue: entry.selectedValue,
    diagnosis: entry.diagnosis,
    labelCount: entry.labels.length,
    controlCandidateCount: entry.controls.length,
    displayCandidateCount: entry.displayCandidates.length,
    labels: [],
    controls: [],
    displayCandidates: [],
  }));
  const dialogsAfter = await dangerousDialogs(page, 'after-field-probe');
  expect(dialogsAfter.ok, `Gefaehrlicher Dialog nach Feldprobe: ${dialogsAfter.dangerous.join(' | ')}`).toBeTruthy();

  const resultStatus = statusFor(fieldValues);
  const byCaption = new Map(fieldValues.map((entry) => [entry.caption, entry]));
  const valueOf = (caption: string) => byCaption.get(caption)?.selectedValue ?? '';
  const missingDepreciationCore = ['Depreciation Starting Date', 'No. of Depreciation Years', 'Depreciation Ending Date'].filter((caption) => !valueOf(caption));
  const bookValue = byCaption.get('Book Value')?.selectedValue ?? '';
  const acquisitionCost = byCaption.get('Acquisition Cost')?.selectedValue ?? '';
  const proved = [
    `Business Central instance ${EXPECTED_INSTANCE} opened read-only.`,
    `Company ${EXPECTED_COMPANY} stayed selected via URL context.`,
    `Fixed Asset Card for ${ASSET_NO} was opened read-only.`,
    valueOf('Depreciation Book Code') ? `Depreciation Book Code is readable as ${valueOf('Depreciation Book Code')}.` : '',
    valueOf('Posting Group') ? `Posting Group is readable as ${valueOf('Posting Group')}.` : '',
    valueOf('Depreciation Method') ? `Depreciation Method is readable as ${valueOf('Depreciation Method')}.` : '',
    valueOf('Depreciation Starting Date') ? `Depreciation Starting Date is readable as ${valueOf('Depreciation Starting Date')}.` : '',
    valueOf('No. of Depreciation Years') ? `No. of Depreciation Years is readable as ${valueOf('No. of Depreciation Years')}.` : '',
    valueOf('Depreciation Ending Date') ? `Depreciation Ending Date is readable as ${valueOf('Depreciation Ending Date')}.` : '',
    bookValue ? `Book Value is readable on the card as ${bookValue}.` : '',
    acquisitionCost ? `Acquisition Cost is readable on the card as ${acquisitionCost}.` : '',
    focusedText.includes(ACQUISITION_DOC_NO) ? `Acquisition document ${ACQUISITION_DOC_NO} is visible in focused card text.` : '',
  ].filter(Boolean);
  const notProved = [
    ...missingDepreciationCore.map((caption) => `${caption} has no readable non-empty value on the card via this mapper.`),
    contextBefore.companyInText ? '' : `Company ${EXPECTED_COMPANY} was not independently visible in page body text; company proof is URL-context only.`,
    valueOf('Acquired') ? '' : 'Acquired flag has no readable non-empty value on the card via this mapper.',
    'No depreciation posting readiness is proven by this read-only card probe.',
    'No German final proof exists.',
  ].filter(Boolean);

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-result',
    resultStatus: 'observed',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    timestamp: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    assetNo: ASSET_NO,
    depreciationBook: DEPRECIATION_BOOK,
    cardProbeStatus: resultStatus,
    context: contextBefore,
    fieldValues,
    showMore,
    proved,
    notProved,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/fixedassets-279/',
      'playwright/projects/fibu-book5/tests/fixedassets-279-fa-depreciation-card-fieldvalue-readonly-probe.spec.ts',
      'package.json',
    ],
    statePatch: {
      lastRunSummary: {
        runId: CASE_ID,
        workType: 'playwright-readonly-fixedasset-card-fieldvalue-probe',
        taskClass: 'wizard_work',
        modelClass: 'gpt-4-medium',
        instance: EXPECTED_INSTANCE,
        company: EXPECTED_COMPANY,
        bcRun: true,
        playwrightRun: true,
        posted: false,
        previewPosting: false,
        setupChanged: false,
        companySwitched: false,
        apiShortcut: false,
        bookChanged: false,
        dataChanged: false,
        draftCreated: false,
        recordEdited: false,
        recordDeleted: false,
        resultStatus: 'observed',
        summary: `FA-279 read ${ASSET_NO} card field values read-only. Depreciation start ${valueOf('Depreciation Starting Date') || 'unread'}, years ${valueOf('No. of Depreciation Years') || 'unread'}, ending ${valueOf('Depreciation Ending Date') || 'unread'}, book value ${bookValue || 'unread'}. Next: ${NEXT_CASE_ID}.`,
        nextCase: NEXT_CASE_ID,
      },
    },
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-279/FIXEDASSETS-279-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-279/020-card-field-values.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-279/FIXEDASSETS-279-FA-DEPRECIATION-CARD-FIELDVALUE-READONLY-PROBE.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-279/README.md',
    ],
    warnings: [],
    blockedBy: [],
    requiresReview: true,
    safeToFinalizeState: false,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noOkConfirmed: true,
    },
    dialogs: [dialogsBefore, dialogsAfter],
    reason: 'Read-only card field-value probe. State finalization remains blocked pending local review.',
    validationCommands: [
      'npm run agent:preflight',
      'npm run agent:dry-run',
      'npm run agent:run-plan',
      'npm run fibu:fixedassets:fa-depreciation-card-fieldvalue-readonly-probe',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/fixedassets-279/FIXEDASSETS-279-result.json',
      'npm run agent:state-finalize -- --input playwright/projects/fibu-book5/evidence/fixedassets-279/FIXEDASSETS-279-result.json',
      'npm run check:encoding',
      'git diff --check',
    ],
  };

  await writeTextEvidence(faEvidencePath('010-card-focused-text.txt'), clean(focusedText));
  await writeJsonEvidence(faEvidencePath('020-card-field-values.json'), fieldValues);
  await writeJsonEvidence(faEvidencePath('030-show-more-readonly.json'), showMore);
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-279-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-279-FA-DEPRECIATION-CARD-FIELDVALUE-READONLY-PROBE.md'), renderMarkdown(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-279 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| 010-card-focused-text.txt | UI-Text | fokussierte, harmlose Kartensignale | keine vollstaendige Page-Struktur | labor-read-only |',
      '| 020-card-field-values.json | Feldwert-Evidence | sichtbare/lesbare Feldwerte und Diagnose je Caption | keine Tabellenwerte ausserhalb der Page | labor-read-only |',
      '| 030-show-more-readonly.json | UI-Aktion | welche Show-more-Aktionen ohne Risiko geklickt wurden | keine Personalisierung | labor-read-only |',
      '| FIXEDASSETS-279-result.json | Result | Case-Ergebnis, Flags, State-Patch-Plan | kein automatisches State-Finalizing | requires-review |',
      '| FIXEDASSETS-279-FA-DEPRECIATION-CARD-FIELDVALUE-READONLY-PROBE.md | Lernsummary | Buchwirkung und Grenzen | kein DE-Finalnachweis | labor-read-only |',
      '',
      'Grenze: FA-279 ist UI-first und read-only. Keine Buchung, kein Preview Posting, kein OK, keine Einrichtungsaenderung.',
      '',
    ].join('\n'),
  );
});
