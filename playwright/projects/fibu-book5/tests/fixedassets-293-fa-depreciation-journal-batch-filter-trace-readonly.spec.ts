import { test, type Frame, type Page } from '@playwright/test';
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

const TEST_ID = 'fixedassets-293';
const CASE_ID = 'FIXEDASSETS-293-FA-DEPRECIATION-JOURNAL-BATCH-FILTER-TRACE-READONLY';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const TARGET_PAGE_ID = 5628;
const TARGET_DOCUMENT_NO = 'FADEP-291-OK';
const TARGET_ASSET_NO = 'FA-CNC-01';
const TARGET_BOOK = 'HGB';
const TARGET_DATE = '31.01.2027';

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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId/i.test(line))
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

async function readJournalFrames(page: Page) {
  const frameResults = [];
  for (const frame of page.frames()) {
    const frameUrl = decodeURIComponent(frame.url());
    if (!frameUrl.includes(EXPECTED_INSTANCE) || !frameUrl.includes(`page=${TARGET_PAGE_ID}`)) continue;
    frameResults.push(await readJournalFrame(frame));
  }

  const combined = frameResults
    .flatMap((entry) => [entry.bodyText, ...entry.rows.map((row) => row.text), ...entry.controls.map((control) => `${control.value} ${control.text} ${control.ariaLabel} ${control.title}`)])
    .join('\n');

  return {
    frameCount: page.frames().length,
    relevantFrameCount: frameResults.length,
    pageVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(combined),
    targetDocumentVisible: combined.includes(TARGET_DOCUMENT_NO),
    targetAssetVisible: combined.includes(TARGET_ASSET_NO),
    targetBookVisible: new RegExp(`\\b${TARGET_BOOK}\\b`, 'i').test(combined),
    targetDateVisible: combined.includes(TARGET_DATE),
    faDepPrefixVisible: /FADEP-/i.test(combined),
    assetsTemplateVisible: /\bASSETS\b/i.test(combined),
    defaultBatchVisible: /\bDEFAULT\b/i.test(combined),
    visibleFilterHints: /Filter|Filtered|Show|View|Batch Name|Template Name|Journal Template Name/i.test(combined),
    previewPostingVisible: /Preview Posting|Buchungsvorschau/i.test(combined),
    postVisible: /\bPost\b|\bBuchen\b/i.test(combined),
    newOrEditVisible: /\bNew\b|\bNeu\b|\bEdit\b|\bBearbeiten\b|Edit List|Liste bearbeiten/i.test(combined),
    frames: frameResults,
  };
}

async function readJournalFrame(frame: Frame) {
  return frame.evaluate(
    ({ targetDocumentNo, targetAssetNo, targetBook, targetDate }) => {
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
      const interesting =
        /Fixed Asset G\/L|Batch Name|Template|Journal|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|FADEP-|FA-CNC-01|HGB|DEFAULT|ASSETS|Preview Posting|Post|New|Edit|Filter|View/i;
      const bodyText = norm(document.body?.innerText || '');
      const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name]')]
        .filter(visible)
        .map((row, index) => ({ index, text: norm(row.innerText || row.textContent).slice(0, 900) }))
        .filter((row) => interesting.test(row.text) || row.text.includes(targetDocumentNo) || row.text.includes(targetAssetNo))
        .slice(0, 160);
      const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea,[role="combobox"],button,a[role="button"]')]
        .filter((control) => visible(control as HTMLElement))
        .map((control, index) => {
          const input = control as HTMLInputElement;
          return {
            index,
            tag: control.tagName.toLowerCase(),
            role: norm(control.getAttribute('role')),
            value: norm(control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || control.value : input.value),
            text: norm(control.textContent),
            ariaLabel: norm(control.getAttribute('aria-label')),
            title: norm(control.getAttribute('title')),
            disabled: control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true',
          };
        })
        .filter((control) =>
          interesting.test(`${control.value} ${control.text} ${control.ariaLabel} ${control.title}`),
        )
        .slice(0, 160);
      const combined = `${bodyText}\n${rows.map((row) => row.text).join('\n')}\n${controls
        .map((control) => `${control.value} ${control.text} ${control.ariaLabel} ${control.title}`)
        .join('\n')}`;
      return {
        frameUrl: location.href,
        bodyText: bodyText.slice(0, 7000),
        targetDocumentVisible: combined.includes(targetDocumentNo),
        targetAssetVisible: combined.includes(targetAssetNo),
        targetBookVisible: new RegExp(`\\b${targetBook}\\b`, 'i').test(combined),
        targetDateVisible: combined.includes(targetDate),
        rows,
        controls,
      };
    },
    {
      targetDocumentNo: TARGET_DOCUMENT_NO,
      targetAssetNo: TARGET_ASSET_NO,
      targetBook: TARGET_BOOK,
      targetDate: TARGET_DATE,
    },
  );
}

function renderLearning(result: any) {
  return [
    '# FIXEDASSETS-293 AfA-Journal-/Batch-/Filter-Trace read-only',
    '',
    'Status: `labor`, `read-only`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Fixed Asset G/L Journals sichtbar: ${result.journal.pageVisible ? 'ja' : 'nein'}`,
    `- ASSETS sichtbar: ${result.journal.assetsTemplateVisible ? 'ja' : 'nein'}`,
    `- DEFAULT sichtbar: ${result.journal.defaultBatchVisible ? 'ja' : 'nein'}`,
    `- FADEP-291-OK sichtbar: ${result.journal.targetDocumentVisible ? 'ja' : 'nein'}`,
    `- FA-CNC-01 sichtbar: ${result.journal.targetAssetVisible ? 'ja' : 'nein'}`,
    `- HGB sichtbar: ${result.journal.targetBookVisible ? 'ja' : 'nein'}`,
    `- 31.01.2027 sichtbar: ${result.journal.targetDateVisible ? 'ja' : 'nein'}`,
    '',
    '## Buchwirkung',
    '',
    result.journal.targetDocumentVisible
      ? 'Die AfA-Zeile ist im Labor sichtbar und kann im naechsten Gate fachlich fuer Preview Posting bewertet werden.'
      : 'Die AfA-Zeile ist im sichtbaren Journal-/Batch-Kontext weiterhin nicht belegt. Fuer Anfaenger ist wichtig: Nach `Calculate Depreciation` muss die erzeugte Journalzeile nachweisbar sein; sonst darf Preview/Post nicht folgen.',
    '',
    '## Grenzen',
    '',
    '- Kein Calculate Depreciation OK.',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Kein Setup Change.',
    '- Kein Company Switch.',
    '- Kein deutscher Finalnachweis.',
  ].join('\n');
}

test('FIXEDASSETS-293 reads FA depreciation journal context for FADEP-291-OK without writing', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Batch Name|Document No\.|FA Posting Type/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const dialogState = await dangerousDialogs(page, 'after-open-fa-gl-journals');
  const journal = await readJournalFrames(page);
  const compactText = clean(
    await compactPageText(page, {
      include: [/Fixed Asset G\/L Journals|Batch Name|ASSETS|DEFAULT|Document No\.|FA Posting Type|Depreciation Book|Amount|FADEP-291-OK|FADEP-|FA-CNC-01|HGB|31\.01\.2027|Preview Posting|\bPost\b|New|Edit|Filter|View/i],
      maxLines: 320,
      maxLineLength: 320,
    }),
  );

  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company-url']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(dialogState.ok ? [] : dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog.slice(0, 180)}`)),
    ...(journal.pageVisible ? [] : ['fixed-asset-gl-journals-not-visible']),
  ];
  const observed = blockedBy.length === 0;
  const nextCase = journal.targetDocumentVisible
    ? 'FIXEDASSETS-294-FA-DEPRECIATION-PREVIEW-GATE-REVIEW'
    : 'FIXEDASSETS-294-FA-DEPRECIATION-REQUEST-PAGE-OPTIONS-OR-CONTROLLED-REPEAT-GATE';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-gl-journal-trace',
    resultStatus: observed ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    sourceCompany: EXPECTED_COMPANY,
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction:
      'In the German target company, repeat the depreciation journal trace after Calculate Depreciation and prove the journal line, Preview Posting and posted FA/G/L entries with German setup.',
    mustRecreateInFinalSandbox: true,
    targetGermanCompanyImpact:
      'German final evidence must recreate this trace with German UI labels, German accounts and final screenshots.',
    finalScreenshotNeeded: true,
    target: {
      pageId: TARGET_PAGE_ID,
      pageName: 'Fixed Asset G/L Journals',
      documentNo: TARGET_DOCUMENT_NO,
      fixedAssetNo: TARGET_ASSET_NO,
      depreciationBook: TARGET_BOOK,
      postingDate: TARGET_DATE,
    },
    context,
    dialogState,
    journal: {
      pageVisible: journal.pageVisible,
      targetDocumentVisible: journal.targetDocumentVisible,
      targetAssetVisible: journal.targetAssetVisible,
      targetBookVisible: journal.targetBookVisible,
      targetDateVisible: journal.targetDateVisible,
      faDepPrefixVisible: journal.faDepPrefixVisible,
      assetsTemplateVisible: journal.assetsTemplateVisible,
      defaultBatchVisible: journal.defaultBatchVisible,
      visibleFilterHints: journal.visibleFilterHints,
      previewPostingVisible: journal.previewPostingVisible,
      postVisible: journal.postVisible,
      newOrEditVisible: journal.newOrEditVisible,
      frameCount: journal.frameCount,
      relevantFrameCount: journal.relevantFrameCount,
    },
    safety: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noCalculateDepreciationOk: true,
      noRecordEdit: true,
      noRecordDelete: true,
      noJournalLineInsertEditDelete: true,
    },
    proved: [
      ...(observed ? ['Fixed Asset G/L Journals was opened read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      ...(journal.assetsTemplateVisible ? ['ASSETS journal template signal is visible.'] : []),
      ...(journal.defaultBatchVisible ? ['DEFAULT batch signal is visible.'] : []),
      ...(journal.targetDocumentVisible ? ['FADEP-291-OK is visible in the read-only journal context.'] : ['FADEP-291-OK is not visible in the read-only journal context.']),
      'No Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, API shortcut, draft creation or book change was executed.',
    ],
    notProved: [
      ...(journal.targetDocumentVisible ? [] : ['It is still not proven whether FADEP-291-OK exists in another hidden filter, batch or view context.']),
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-293-fa-depreciation-journal-batch-filter-trace-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-293/',
      '.agent/state/current.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-293/FIXEDASSETS-293-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-293/FIXEDASSETS-293-JOURNAL-BATCH-FILTER-TRACE-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-293/010-fa-gl-journal-trace.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-293/010-fa-gl-journal-trace-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-293/README.md',
    ],
    statePatch: {
      current: {
        activeArea: 'fixedassets',
        activeCase: nextCase,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-293-fa-depreciation-journal-batch-filter-trace-readonly.json',
        nextStep: journal.targetDocumentVisible
          ? 'FIXEDASSETS-294: locally review whether FADEP-291-OK is safe for Preview Posting gate; no Post before review.'
          : 'FIXEDASSETS-294: decide between request-page option review and guarded controlled repeat; do not repeat Calculate Depreciation OK blindly.',
      },
      coverage: {
        activeArea: 'fixedassets',
        currentBlock: 'fa-depreciation-journal-batch-filter-trace-readonly',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: journal.targetDocumentVisible
          ? 'FA-293 found FADEP-291-OK in the read-only journal context. Preview Posting remains locked pending local gate review.'
          : 'FA-293 did not find FADEP-291-OK in the read-only Fixed Asset G/L Journals context. Request-page option review or guarded controlled repeat must be decided before any Preview/Post.',
      },
      lastRunSummary: {
        runId: CASE_ID,
        workType: 'playwright-readonly-fa-gl-journal-trace',
        instance: EXPECTED_INSTANCE,
        company: EXPECTED_COMPANY,
        bcRun: true,
        playwrightRun: true,
        posted: false,
        previewPosting: false,
        dataChanged: false,
        setupChanged: false,
        bookChanged: false,
        summary: journal.targetDocumentVisible
          ? 'FA-293 found FADEP-291-OK in the read-only Fixed Asset G/L Journals context.'
          : 'FA-293 opened Fixed Asset G/L Journals read-only but did not find FADEP-291-OK in the visible journal context.',
        nextStep: journal.targetDocumentVisible
          ? 'Review Preview Posting gate for FADEP-291-OK without posting.'
          : 'Review request-page options or guarded controlled repeat; no blind OK repeat.',
      },
    },
    blockedBy,
    requiresReview: !journal.targetDocumentVisible,
    safeToFinalizeState: observed,
    reason:
      'Read-only Fixed Asset G/L Journals trace completed without Calculate Depreciation OK, Preview Posting, Post or setup changes.',
    nextCase,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeTextEvidence(faEvidencePath('010-fa-gl-journal-trace-text.txt'), compactText || 'No compact journal text captured.');
  await writeJsonEvidence(faEvidencePath('010-fa-gl-journal-trace.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    context,
    dialogState,
    journal,
    blockedBy,
  });
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-293-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-293-JOURNAL-BATCH-FILTER-TRACE-READONLY.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-293 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-293-result.json` | JSON-Ergebnis | read-only Journal-/Batch-/Filter-Trace fuer `FADEP-291-OK` | keine AfA-Buchung | labor-reference |',
      '| `FIXEDASSETS-293-JOURNAL-BATCH-FILTER-TRACE-READONLY.md` | Lernzusammenfassung | sichtbarer/nicht sichtbarer AfA-Journal-Kontext und naechster Gate-Schritt | keinen deutschen Finalnachweis | labor-reference |',
      '| `010-fa-gl-journal-trace.json` | UI-Signalextrakt | Page-/Frame-/Control-Signale zu `FADEP-291-OK`, `FA-CNC-01`, `HGB`, `ASSETS`, `DEFAULT` | keine Buchungswirkung | read-only |',
      '| `010-fa-gl-journal-trace-text.txt` | kompakter Seitentext | relevante sichtbare Journaltexte | keinen Rohdump | read-only |',
      '',
      'Migration: Dieser Schritt ist `needed-for-german-final`, muss in der deutschen Zielcompany neu erzeugt werden und ist kein finaler deutscher Buchbeweis.',
      '',
    ].join('\n'),
  );
});
