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

const TEST_ID = 'fixedassets-285';
const CASE_ID = 'FIXEDASSETS-285-FA-DEPRECIATION-BATCH-LOOKUP-LIST-NO-SELECT';
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

    const possibleConcreteValues = controls
      .map((control) => control.value)
      .filter(valueLike)
      .filter((value, index, values) => values.indexOf(value) === index);
    const dropdownCandidates = controls.filter((control) =>
      /combobox|listbox|menu/i.test(`${control.role} ${control.ariaHasPopup}`) ||
      /Batch Name|Wahlen Sie einen Wert fur Batch Name|Choose a value for Batch Name/i.test(control.text),
    );

    return {
      bodyText: norm(document.body?.innerText || '').slice(0, 5000),
      pageTitleVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(norm(document.body?.innerText || '')),
      batchNameLabelVisible: /Batch Name/i.test(norm(document.body?.innerText || '')),
      concreteBatchValueCaptured: possibleConcreteValues.length > 0,
      possibleConcreteValues,
      dropdownCandidateCount: dropdownCandidates.length,
      dropdownCandidates,
      controls,
    };
  });
}

async function readVisibleLookupState(frame: Frame) {
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
    const optionSelectors = [
      '[role="listbox"] [role="option"]',
      '[role="option"]',
      '[role="grid"] [role="row"]',
      '[role="row"]',
      '[aria-label*="Batch"]',
      '[title*="Batch"]',
    ].join(',');
    const candidates = [...document.querySelectorAll<HTMLElement>(optionSelectors)]
      .filter(visible)
      .map((element, index) => ({
        index,
        tag: element.tagName.toLowerCase(),
        role: norm(element.getAttribute('role')),
        text: norm(element.innerText || element.textContent).slice(0, 300),
        ariaLabel: norm(element.getAttribute('aria-label')),
        title: norm(element.getAttribute('title')),
        ariaSelected: norm(element.getAttribute('aria-selected')),
        rect: rectOf(element),
      }))
      .filter((entry) => /Batch|Name|Code|Journal|DEFAULT|ALLG|FA|ANL|HGB|Abschreibung|Depreciation/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
      .slice(0, 80);
    const panels = [...document.querySelectorAll<HTMLElement>('[role="listbox"],[role="grid"],[role="dialog"],[aria-modal="true"],.ms-Callout,.ms-Layer')]
      .filter(visible)
      .map((element, index) => ({
        index,
        tag: element.tagName.toLowerCase(),
        role: norm(element.getAttribute('role')),
        text: norm(element.innerText || element.textContent).slice(0, 1500),
        ariaLabel: norm(element.getAttribute('aria-label')),
        title: norm(element.getAttribute('title')),
        rect: rectOf(element),
      }))
      .filter((entry) => entry.text || entry.ariaLabel || entry.title)
      .slice(0, 40);
    return {
      bodyText: norm(document.body?.innerText || '').slice(0, 5000),
      candidates,
      panels,
      candidateCount: candidates.length,
      panelCount: panels.length,
      selectedCandidates: candidates.filter((entry) => /true/i.test(entry.ariaSelected)),
    };
  });
}

async function clickBatchLookupNoSelect(frame: Frame) {
  const locator = frame.locator('a[title*="Batch Name"], a[aria-label*="Batch Name"]').last();
  const count = await locator.count().catch(() => 0);
  if (count === 0) return { clicked: false, reason: 'No Batch Name lookup button with title or aria-label was found.' };
  await locator.click({ timeout: 5000 });
  await frame.page().waitForTimeout(1200);
  return { clicked: true, reason: 'Clicked Batch Name lookup button without choosing a list item.' };
}

function renderLearning(result: any) {
  return [
    '# FIXEDASSETS-285 Batch-Lookup-Liste ohne Auswahl',
    '',
    'Status: `labor`, `read-only`, `lookup-list-probe`, `no-select`, `no-enter`, `no-ok`, `no-preview`, `no-post`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Lookup-Klick versucht: ${result.lookupAction.clicked ? 'ja' : 'nein'}`,
    `- sichtbare Kandidaten nach Lookup: ${result.lookupState.candidateCount}`,
    `- sichtbare Panels nach Lookup: ${result.lookupState.panelCount}`,
    `- ausgewaehlte Kandidaten erkannt: ${result.lookupState.selectedCandidates.length}`,
    `- konkreter Batchwert nach Schliessen erfasst: ${result.afterCloseProbe.concreteBatchValueCaptured ? 'ja' : 'nein'}`,
    '',
    '## Entscheidung fuer die Anleitung',
    '',
    result.decisionSummary,
    '',
    '## Grenzen',
    '',
    '- Kein Batch-Wert wurde ausgewaehlt oder geaendert.',
    '- Es wurde nicht in Batch Name getippt und nicht Enter gedrueckt.',
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

test('FIXEDASSETS-285 opens Batch Name lookup list without selecting a value', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Batch Name|Document No\./i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const beforeDialogState = await dangerousDialogs(page, 'before-batch-lookup-click');
  const frame = page.frames().find(isJournalFrame);
  const beforeProbe = frame ? await readBatchValueProbe(frame) : null;
  const lookupAction = frame && beforeDialogState.ok ? await clickBatchLookupNoSelect(frame) : { clicked: false, reason: 'Journal frame missing or dangerous dialog detected before lookup.' };
  const lookupState = frame ? await readVisibleLookupState(frame) : { candidates: [], panels: [], candidateCount: 0, panelCount: 0, selectedCandidates: [], bodyText: '' };
  const afterLookupDialogState = await dangerousDialogs(page, 'after-batch-lookup-click');

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(800);
  const afterCloseProbe = frame ? await readBatchValueProbe(frame) : null;
  const afterCloseDialogState = await dangerousDialogs(page, 'after-escape-close');

  const compactText = clean(
    await compactPageText(page, {
      include: [/Fixed Asset G\/L Journals|Batch Name|Journal Batch|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|FADEP-|FA-CNC-01|HGB|DEFAULT|ALLG|Abschreibung|Depreciation/i],
      maxLines: 220,
      maxLineLength: 260,
    }),
  );

  const selectedAfterLookup = lookupState.selectedCandidates.length > 0;
  const valueChanged =
    JSON.stringify(beforeProbe?.possibleConcreteValues ?? []) !== JSON.stringify(afterCloseProbe?.possibleConcreteValues ?? []);
  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company-url']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(frame ? [] : ['journal-frame-not-found']),
    ...(beforeProbe?.pageTitleVisible ? [] : ['fixed-asset-gl-journals-not-visible']),
    ...(beforeDialogState.ok ? [] : beforeDialogState.dangerous.map((dialog) => `dangerous-dialog-before:${dialog}`)),
    ...(afterLookupDialogState.ok ? [] : afterLookupDialogState.dangerous.map((dialog) => `dangerous-dialog-after-lookup:${dialog}`)),
    ...(afterCloseDialogState.ok ? [] : afterCloseDialogState.dangerous.map((dialog) => `dangerous-dialog-after-close:${dialog}`)),
    ...(lookupAction.clicked ? [] : [`lookup-not-clicked:${lookupAction.reason}`]),
    ...(selectedAfterLookup ? ['lookup-candidate-selected-after-click'] : []),
    ...(valueChanged ? ['batch-value-changed-after-lookup'] : []),
  ];
  const observed = blockedBy.length === 0;
  const nextCase = observed
    ? 'FIXEDASSETS-286-FA-DEPRECIATION-BATCH-LOOKUP-RESULT-REVIEW'
    : 'FIXEDASSETS-286-FA-DEPRECIATION-BATCH-LOOKUP-BLOCKER-REVIEW';
  const nextCaseFile = observed
    ? '.agent/state/cases/fixedassets-286-fa-depreciation-batch-lookup-result-review.json'
    : '.agent/state/cases/fixedassets-286-fa-depreciation-batch-lookup-blocker-review.json';
  const decisionSummary = observed
    ? 'FA-285 opened the Batch Name lookup/list without selecting or changing a value. A local review must decide whether the visible options prove a useful journal batch route or whether the output-target remains blocked.'
    : 'FA-285 could not safely prove the Batch Name lookup/list without a blocker. A local review must classify the blocker before any further UI action.';
  const nextStep = observed
    ? 'FIXEDASSETS-286: locally review Batch Name lookup-list evidence; no selection, OK, Preview Posting or Post yet.'
    : 'FIXEDASSETS-286: locally review the Batch Name lookup blocker; no retry before the blocker is classified.';

  await writeTextEvidence(faEvidencePath('010-batch-lookup-focused-text.txt'), compactText || 'No compact Batch Name lookup text captured.');
  await writeJsonEvidence(faEvidencePath('020-batch-lookup-list.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    context,
    beforeDialogState,
    afterLookupDialogState,
    afterCloseDialogState,
    frameUrl: frame ? safeUrl(frame.url()) : '',
    beforeProbe,
    lookupAction,
    lookupState,
    afterCloseProbe,
    safetyChecks: {
      selectedAfterLookup,
      valueChanged,
    },
    blockedBy,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-batch-lookup-list-no-select',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-journal-batch-lookup-list-no-select',
    resultStatus: observed ? 'observed' : 'blocked',
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    target: {
      pageId: TARGET_PAGE_ID,
      pageName: 'Fixed Asset G/L Journals',
      field: 'Batch Name',
      fixedAssetNo: ASSET_NO,
      depreciationBook: DEPRECIATION_BOOK,
    },
    context,
    lookupAction,
    lookupState: {
      candidateCount: lookupState.candidateCount,
      panelCount: lookupState.panelCount,
      candidates: lookupState.candidates,
      panels: lookupState.panels,
      selectedCandidates: lookupState.selectedCandidates,
    },
    afterCloseProbe: {
      concreteBatchValueCaptured: Boolean(afterCloseProbe?.concreteBatchValueCaptured),
      possibleConcreteValues: afterCloseProbe?.possibleConcreteValues ?? [],
    },
    decisionSummary,
    safety: {
      noBatchValueSelected: !selectedAfterLookup,
      noBatchValueChanged: !valueChanged,
      noBatchNameTyped: true,
      noEnterPressed: true,
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
      ...(observed ? ['Batch Name lookup/list was opened read-only in MCP_1_20260210 / RM-DEMO without selecting a value.'] : []),
      `Visible lookup/list candidates captured: ${lookupState.candidateCount}.`,
      `Visible lookup/list panels captured: ${lookupState.panelCount}.`,
      'No Batch Name value was intentionally selected or changed.',
      'No typing, Enter, Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, API shortcut or book change was executed.',
    ],
    notProved: [
      ...(observed ? [] : ['The Batch Name lookup/list could not be safely opened and read.']),
      'No selected Batch Name value is proven unless visible options are accepted by local review.',
      'No FADEP depreciation journal line is proven.',
      'No Preview Posting result is proven.',
      'No depreciation posting is proven.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-285-fa-depreciation-batch-lookup-list-no-select.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-285/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-285/FIXEDASSETS-285-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-285/FIXEDASSETS-285-BATCH-LOOKUP-LIST-NO-SELECT.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-285/010-batch-lookup-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-285/020-batch-lookup-list.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-285/README.md',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-285-fa-depreciation-batch-lookup-list-no-select.json',
        requiresStrongModel: true,
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: observed
          ? 'FA-285 opened and read the Batch Name lookup/list without selection; local review required before OK/Preview/Post.'
          : 'FA-285 could not safely prove the Batch Name lookup/list; local blocker review required before retry.',
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: observed,
    reason: 'No-select Batch Name lookup/list probe completed or blocked without selecting/changing a batch value.',
    nextCase,
    nextCaseFile,
    nextStep,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-285-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-285-BATCH-LOOKUP-LIST-NO-SELECT.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-285 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-285-result.json` | JSON-Ergebnis | Lookup-Listen-Probe, Safety-Flags und naechster Review | keine AfA-Buchungsreife | labor |',
      '| `FIXEDASSETS-285-BATCH-LOOKUP-LIST-NO-SELECT.md` | Lernzusammenfassung | Warum Lookup-Liste ohne Auswahl ein Diagnosepfad ist | keinen deutschen Finalnachweis | labor |',
      '| `010-batch-lookup-focused-text.txt` | kompakter Seitentext | sichtbare Batch-/Journal-Signale nach Lookup | keinen Rohdump | compact |',
      '| `020-batch-lookup-list.json` | UI-Control-Snapshot | Lookup-/Listen-/Panel-Kandidaten ohne Auswahl | keine Wertauswahl oder Aenderung | read-only |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noBatchValueChanged).toBe(true);
  expect(result.safety.noBatchNameTyped).toBe(true);
  expect(result.safety.noEnterPressed).toBe(true);
  expect(result.safety.noJournalLineInsertEditDelete).toBe(true);
  expect(result.safety.noCalculateDepreciationOk).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(afterCloseDialogState.ok).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|changed/i.test(entry))).toEqual([]);
});
