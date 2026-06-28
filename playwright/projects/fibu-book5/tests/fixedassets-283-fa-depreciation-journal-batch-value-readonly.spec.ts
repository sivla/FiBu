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

const TEST_ID = 'fixedassets-283';
const CASE_ID = 'FIXEDASSETS-283-FA-DEPRECIATION-JOURNAL-BATCH-VALUE-READONLY';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const TARGET_PAGE_ID = 5628;
const ASSET_NO = 'FA-CNC-01';
const DEPRECIATION_BOOK = 'HGB';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2800, height: 1400 },
});

test.setTimeout(240_000);

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
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function journalUrl() {
  const url = new URL(bcPageUrl(TARGET_PAGE_ID, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function isJournalFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`) && frameUrl.includes('runinframe=1');
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url: safeUrl(url),
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
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
    /\b(Post|Preview Posting|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Calculate Depreciation|Abschreibung berechnen|AfA berechnen)\b/i.test(text),
  );
  return { phase, dialogs, dangerous, ok: dangerous.length === 0 };
}

async function readBatchValueProbe(frame: Frame) {
  return frame.evaluate(() => {
    const norm = (value: string | null | undefined) =>
      (value ?? '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rectOf = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const labelled = (element: Element) =>
      norm(
        [
          element.getAttribute('aria-label'),
          element.getAttribute('title'),
          element.getAttribute('name'),
          element.getAttribute('id'),
          element.getAttribute('placeholder'),
          element.getAttribute('aria-describedby'),
          element.getAttribute('aria-labelledby'),
          element.textContent,
        ].join(' '),
      );
    const batchLike = /Batch Name|Journal Batch|Buch\.-Blattname|Batch|Stapel|Wahlen Sie einen Wert fur Batch Name|Choose a value for Batch Name/i;
    const valueLike = (value: string) => value && !/^Batch Name$|^Journal Batch$|^Batch$|^Stapel$/i.test(value.trim());

    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea,[role="combobox"],[aria-haspopup="listbox"],button,a[role="button"]')]
      .filter((element) => visible(element as HTMLElement))
      .map((element, index) => {
        const html = element as HTMLInputElement;
        const selectedText =
          element instanceof HTMLSelectElement ? [...element.options].find((option) => option.selected)?.text || element.value : '';
        const text = labelled(element);
        return {
          index,
          tag: element.tagName.toLowerCase(),
          role: norm(element.getAttribute('role')),
          value: norm(element instanceof HTMLSelectElement ? selectedText || element.value : html.value),
          text,
          ariaExpanded: norm(element.getAttribute('aria-expanded')),
          ariaHasPopup: norm(element.getAttribute('aria-haspopup')),
          readOnly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          rect: rectOf(element as HTMLElement),
        };
      })
      .filter((entry) => batchLike.test(`${entry.value} ${entry.text} ${entry.role} ${entry.ariaHasPopup}`))
      .slice(0, 60);

    const elements = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter(visible)
      .map((element, index) => ({
        index,
        tag: element.tagName.toLowerCase(),
        role: norm(element.getAttribute('role')),
        text: norm(element.innerText || element.textContent).slice(0, 220),
        ariaLabel: norm(element.getAttribute('aria-label')),
        title: norm(element.getAttribute('title')),
        value: norm((element as HTMLInputElement).value),
        rect: rectOf(element),
      }))
      .filter((entry) => batchLike.test(`${entry.text} ${entry.ariaLabel} ${entry.title} ${entry.value}`))
      .slice(0, 80);

    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name]')]
      .filter(visible)
      .map((row, index) => ({ index, text: norm(row.innerText || row.textContent), rect: rectOf(row) }))
      .filter((row) => /Batch Name|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|FADEP-|FA-CNC-01|HGB/i.test(row.text))
      .slice(0, 80);

    const bodyText = norm(document.body?.innerText || '');
    const possibleConcreteValues = controls
      .map((control) => control.value)
      .filter(valueLike)
      .filter((value, index, values) => values.indexOf(value) === index);
    const dropdownCandidates = controls.filter((control) =>
      /combobox|listbox|menu/i.test(`${control.role} ${control.ariaHasPopup}`) ||
      /Batch Name|Wahlen Sie einen Wert fur Batch Name|Choose a value for Batch Name/i.test(control.text),
    );

    return {
      pageTitleVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(bodyText),
      batchNameLabelVisible: /Batch Name/i.test(bodyText),
      concreteBatchValueCaptured: possibleConcreteValues.length > 0,
      possibleConcreteValues,
      dropdownCandidateCount: dropdownCandidates.length,
      dropdownCandidates,
      controls,
      batchElements: elements,
      rows,
      targetSignals: {
        assetVisible: /\bFA-CNC-01\b/i.test(bodyText),
        depreciationBookVisible: /\bHGB\b/i.test(bodyText),
        faDepVisible: /FADEP-/i.test(bodyText),
        pageHasTwoItemsSignal: /hat jetzt 2 Artikel|has 2 items/i.test(bodyText),
      },
      dropdownOpened: false,
      dropdownOpenReason: dropdownCandidates.length
        ? 'Dropdown candidates were identified but not opened because this case forbids selecting or changing Batch Name.'
        : 'No safe Batch Name dropdown candidate was identified.',
    };
  });
}

function renderLearning(result: any) {
  return [
    '# FIXEDASSETS-283 Batchwert-Probe read-only',
    '',
    'Status: `labor`, `read-only`, `batch-value-probe`, `no-select`, `no-edit`, `no-ok`, `no-preview`, `no-post`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Page sichtbar: ${result.batchProbe.pageTitleVisible ? 'ja' : 'nein'}`,
    `- Batch-Name-Label sichtbar: ${result.batchProbe.batchNameLabelVisible ? 'ja' : 'nein'}`,
    `- konkreter Batchwert erfasst: ${result.batchProbe.concreteBatchValueCaptured ? 'ja' : 'nein'}`,
    `- moegliche Werte: ${result.batchProbe.possibleConcreteValues.length ? result.batchProbe.possibleConcreteValues.join(', ') : 'keine'}`,
    `- Dropdown-Kandidaten: ${result.batchProbe.dropdownCandidateCount}`,
    '',
    '## Entscheidung fuer die Anleitung',
    '',
    result.decisionSummary,
    '',
    '## Grenzen',
    '',
    '- Kein Batch-Wert wurde ausgewaehlt oder geaendert.',
    '- Keine Journalzeile wurde angelegt, bearbeitet oder geloescht.',
    '- Kein Calculate-Depreciation-OK.',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Kein Setup Change.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-283 reads FA G/L Journal Batch Name value without selecting or changing it', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Batch Name|Document No\./i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const dialogState = await dangerousDialogs(page, 'after-open-fa-gl-journal');
  const frame = page.frames().find(isJournalFrame);
  const batchProbe = frame ? await readBatchValueProbe(frame) : null;
  const compactText = clean(
    await compactPageText(page, {
      include: [/Fixed Asset G\/L Journals|Batch Name|Journal Batch|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|FADEP-|FA-CNC-01|HGB/i],
      maxLines: 180,
      maxLineLength: 260,
    }),
  );

  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company-url']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(frame ? [] : ['journal-frame-not-found']),
    ...(batchProbe?.pageTitleVisible ? [] : ['fixed-asset-gl-journals-not-visible']),
    ...(dialogState.ok ? [] : dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog}`)),
  ];
  const observed = blockedBy.length === 0;
  const nextCase = 'FIXEDASSETS-284-FA-DEPRECIATION-BATCH-VALUE-RESULT-REVIEW';
  const nextCaseFile = '.agent/state/cases/fixedassets-284-fa-depreciation-batch-value-result-review.json';
  const decisionSummary = batchProbe?.concreteBatchValueCaptured
    ? 'FA-283 found at least one concrete Batch Name value candidate. A local review must decide whether that value is a real current batch or only UI noise before any OK/Preview/Post.'
    : 'FA-283 still did not expose a concrete Batch Name value. The next review must decide whether to inspect the Calculate Depreciation request page again, use a safe journal batch list path, or treat the output-target gap as a blocker.';
  const nextStep = batchProbe?.concreteBatchValueCaptured
    ? 'FIXEDASSETS-284: locally review whether the captured Batch Name candidate is a valid output-target proof; no OK, Preview Posting or Post yet.'
    : 'FIXEDASSETS-284: locally review the missing Batch Name value and choose the next smallest proof path; no OK, Preview Posting or Post yet.';

  await writeTextEvidence(faEvidencePath('010-batch-value-focused-text.txt'), compactText || 'No compact Batch Name text captured.');
  await writeJsonEvidence(faEvidencePath('020-batch-value-probe.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    context,
    dialogState,
    frameUrl: frame ? safeUrl(frame.url()) : '',
    batchProbe,
    blockedBy,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-journal-batch-value-readonly',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-journal-batch-value-probe',
    resultStatus: observed ? 'observed' : 'blocked',
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    target: {
      pageId: TARGET_PAGE_ID,
      pageName: 'Fixed Asset G/L Journals',
      fixedAssetNo: ASSET_NO,
      depreciationBook: DEPRECIATION_BOOK,
    },
    context,
    dialogState,
    batchProbe: {
      pageTitleVisible: Boolean(batchProbe?.pageTitleVisible),
      batchNameLabelVisible: Boolean(batchProbe?.batchNameLabelVisible),
      concreteBatchValueCaptured: Boolean(batchProbe?.concreteBatchValueCaptured),
      possibleConcreteValues: batchProbe?.possibleConcreteValues ?? [],
      dropdownCandidateCount: batchProbe?.dropdownCandidateCount ?? 0,
      dropdownOpened: false,
      dropdownOpenReason: batchProbe?.dropdownOpenReason ?? 'No batch probe was available.',
      targetSignals: batchProbe?.targetSignals ?? {},
    },
    decisionSummary,
    safety: {
      noBatchValueSelected: true,
      noBatchValueChanged: true,
      noJournalLineInsertEditDelete: true,
      noCalculateDepreciationOk: true,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noDraft: true,
    },
    proved: [
      ...(observed ? ['Fixed Asset G/L Journals was opened read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      batchProbe?.batchNameLabelVisible ? '`Batch Name` label is visible.' : '`Batch Name` label is not visible.',
      batchProbe?.concreteBatchValueCaptured
        ? `Concrete Batch Name candidate(s) were captured: ${(batchProbe?.possibleConcreteValues ?? []).join(', ')}.`
        : 'No concrete Batch Name value was exposed by the read-only DOM/control probe.',
      'No Batch Name value was selected or changed.',
      'No journal line was inserted, edited or deleted.',
      'No Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, API shortcut or book change was executed.',
    ],
    notProved: [
      ...(batchProbe?.concreteBatchValueCaptured ? [] : ['The actual output batch for Calculate Depreciation is still not known.']),
      'No FADEP depreciation journal line is proven.',
      'No Calculate Depreciation request page result.',
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-283-fa-depreciation-journal-batch-value-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-283/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-283/FIXEDASSETS-283-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-283/FIXEDASSETS-283-BATCH-VALUE-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-283/010-batch-value-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-283/020-batch-value-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-283/README.md',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-283-fa-depreciation-journal-batch-value-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: batchProbe?.concreteBatchValueCaptured
          ? 'FA-283 captured a possible Batch Name value candidate read-only; local review required before OK/Preview/Post.'
          : 'FA-283 did not expose a concrete Batch Name value; output-target gap remains and local review is required before OK/Preview/Post.',
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: observed,
    reason: 'Read-only batch-value probe completed without selecting or changing Batch Name; local review required before further action.',
    nextCase,
    nextCaseFile,
    nextStep,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-283-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-283-BATCH-VALUE-READONLY.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-283 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-283-result.json` | JSON-Ergebnis | Batchwert-Probe, Safety-Flags und naechster Review | keine AfA-Buchungsreife | labor |',
      '| `FIXEDASSETS-283-BATCH-VALUE-READONLY.md` | Lernzusammenfassung | Warum konkreter Batchwert wichtiger ist als Label | keinen deutschen Finalnachweis | labor |',
      '| `010-batch-value-focused-text.txt` | kompakter Seitentext | sichtbare Batch-/Journal-Signale | keinen Rohdump | compact |',
      '| `020-batch-value-probe.json` | UI-Control-Snapshot | Batch-Label/-Control-Kandidaten ohne Auswahl | keine Wertauswahl oder Aenderung | read-only |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noBatchValueSelected).toBe(true);
  expect(result.safety.noBatchValueChanged).toBe(true);
  expect(result.safety.noJournalLineInsertEditDelete).toBe(true);
  expect(result.safety.noCalculateDepreciationOk).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|dangerous-dialog/i.test(entry))).toEqual([]);
});
