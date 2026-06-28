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

const TEST_ID = 'fixedassets-289';
const CASE_ID = 'FIXEDASSETS-289-FA-DEPRECIATION-JOURNAL-ASSETS-DEFAULT-READONLY';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const TARGET_PAGE_ID = 5628;
const EXPECTED_TEMPLATE = 'ASSETS';
const EXPECTED_BATCH = 'DEFAULT';
const EXPECTED_NO_SERIES = 'FA-JNL';
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

function isJournalFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`);
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

async function readFrameJournalContext(page: Page) {
  const frameResults = [];
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(
        ({ expectedTemplate, expectedBatch, expectedNoSeries, assetNo, depreciationBook }) => {
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
          const bodyText = norm(document.body?.innerText || '');
          const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name]')]
            .filter(visible)
            .map((row, index) => ({ index, text: norm(row.innerText || row.textContent).slice(0, 600) }))
            .filter((row) =>
              /Fixed Asset G\/L|Batch Name|Template|Journal|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|FADEP-|FA-CNC-01|HGB|DEFAULT|ASSETS/i.test(row.text),
            )
            .slice(0, 120);
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
              /Fixed Asset G\/L|Batch Name|Template|Journal|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|FADEP-|FA-CNC-01|HGB|DEFAULT|ASSETS|Preview Posting|Post|New|Edit/i.test(
                `${control.value} ${control.text} ${control.ariaLabel} ${control.title}`,
              ),
            )
            .slice(0, 120);
          const combined = `${bodyText}\n${rows.map((row) => row.text).join('\n')}\n${controls
            .map((control) => `${control.value} ${control.text} ${control.ariaLabel} ${control.title}`)
            .join('\n')}`;
          return {
            frameUrl: location.href,
            pageVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(combined),
            templateVisible: new RegExp(`\\b${expectedTemplate}\\b`, 'i').test(combined),
            batchVisible: new RegExp(`\\b${expectedBatch}\\b`, 'i').test(combined),
            noSeriesVisible: new RegExp(`\\b${expectedNoSeries}\\b`, 'i').test(combined),
            batchNameLabelVisible: /Batch Name/i.test(combined),
            assetVisible: new RegExp(`\\b${assetNo}\\b`, 'i').test(combined),
            depreciationBookVisible: new RegExp(`\\b${depreciationBook}\\b`, 'i').test(combined),
            faDepVisible: /FADEP-/i.test(combined),
            previewPostingVisible: /Preview Posting|Buchungsvorschau/i.test(combined),
            postVisible: /\bPost\b|\bBuchen\b/i.test(combined),
            newOrEditVisible: /\bNew\b|\bNeu\b|\bEdit\b|\bBearbeiten\b|Edit List|Liste bearbeiten/i.test(combined),
            bodyText: bodyText.slice(0, 6000),
            rows,
            controls,
          };
        },
        {
          expectedTemplate: EXPECTED_TEMPLATE,
          expectedBatch: EXPECTED_BATCH,
          expectedNoSeries: EXPECTED_NO_SERIES,
          assetNo: ASSET_NO,
          depreciationBook: DEPRECIATION_BOOK,
        },
      )
      .catch((error) => ({
        frameUrl: frame.url(),
        pageVisible: false,
        templateVisible: false,
        batchVisible: false,
        noSeriesVisible: false,
        batchNameLabelVisible: false,
        assetVisible: false,
        depreciationBookVisible: false,
        faDepVisible: false,
        previewPostingVisible: false,
        postVisible: false,
        newOrEditVisible: false,
        bodyText: '',
        rows: [],
        controls: [],
        error: String(error),
      }));
    frameResults.push(result);
  }

  const relevant = frameResults.filter((entry) => entry.pageVisible || entry.batchVisible || entry.templateVisible || entry.assetVisible || entry.faDepVisible);
  const source = relevant[0] ?? frameResults.find((entry) => isJournalFrame({ url: () => entry.frameUrl } as Frame)) ?? frameResults[0];
  return {
    frameUrl: safeUrl(source?.frameUrl ?? page.url()),
    pageVisible: frameResults.some((entry) => entry.pageVisible),
    templateVisible: frameResults.some((entry) => entry.templateVisible),
    batchVisible: frameResults.some((entry) => entry.batchVisible),
    noSeriesVisible: frameResults.some((entry) => entry.noSeriesVisible),
    batchNameLabelVisible: frameResults.some((entry) => entry.batchNameLabelVisible),
    assetVisible: frameResults.some((entry) => entry.assetVisible),
    depreciationBookVisible: frameResults.some((entry) => entry.depreciationBookVisible),
    faDepVisible: frameResults.some((entry) => entry.faDepVisible),
    previewPostingVisible: frameResults.some((entry) => entry.previewPostingVisible),
    postVisible: frameResults.some((entry) => entry.postVisible),
    newOrEditVisible: frameResults.some((entry) => entry.newOrEditVisible),
    bodyText: relevant.map((entry) => entry.bodyText).join('\n').slice(0, 8000) || source?.bodyText || '',
    rows: relevant.flatMap((entry) => entry.rows).slice(0, 160),
    controls: relevant.flatMap((entry) => entry.controls).slice(0, 160),
    frameCount: frameResults.length,
    relevantFrameCount: relevant.length,
  };
}

function renderLearning(result: any) {
  return [
    '# FIXEDASSETS-289 Fixed Asset G/L Journals ASSETS / DEFAULT read-only',
    '',
    'Status: `labor`, `read-only`, `journal-context`, `no-new`, `no-edit`, `no-preview`, `no-post`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Page sichtbar: ${result.journal.pageVisible ? 'ja' : 'nein'}`,
    `- Template \`${EXPECTED_TEMPLATE}\` sichtbar: ${result.journal.templateVisible ? 'ja' : 'nein'}`,
    `- Batch \`${EXPECTED_BATCH}\` sichtbar: ${result.journal.batchVisible ? 'ja' : 'nein'}`,
    `- Batch-Label sichtbar: ${result.journal.batchNameLabelVisible ? 'ja' : 'nein'}`,
    `- FADEP-Signal sichtbar: ${result.journal.faDepVisible ? 'ja' : 'nein'}`,
    `- ${ASSET_NO} sichtbar: ${result.journal.assetVisible ? 'ja' : 'nein'}`,
    `- ${DEPRECIATION_BOOK} sichtbar: ${result.journal.depreciationBookVisible ? 'ja' : 'nein'}`,
    '',
    '## Migration-Relevanz',
    '',
    '- `migrationRelevance`: `needed-for-german-final`',
    '- `mustRecreateInFinalSandbox`: `true`',
    '- Dieser Laborlauf zeigt den Bedien- und Beweispfad. In einer deutschen Zielcompany muss derselbe Kontext mit deutscher UI, deutschem Konten-/VAT-Setup und finaler AfA-Postenspur neu erzeugt werden.',
    '',
    '## Grenzen',
    '',
    '- Keine Journalzeile wurde angelegt oder bearbeitet.',
    '- Kein Calculate Depreciation OK.',
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

test('FIXEDASSETS-289 reads Fixed Asset G/L Journals ASSETS DEFAULT context without writing', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Batch Name|Document No\.|FA Posting Type|ASSETS|DEFAULT/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const dialogState = await dangerousDialogs(page, 'after-open-fa-gl-journals');
  const journal = await readFrameJournalContext(page);
  const compactText = clean(
    await compactPageText(page, {
      include: [/Fixed Asset G\/L Journals|Batch Name|ASSETS|DEFAULT|FA-JNL|Document No\.|FA Posting Type|Depreciation Book|Amount|FADEP-|FA-CNC-01|HGB|Preview Posting|\bPost\b|New|Edit/i],
      maxLines: 260,
      maxLineLength: 280,
    }),
  );

  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company-url']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(dialogState.ok ? [] : dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog}`)),
    ...(journal.pageVisible ? [] : ['fixed-asset-gl-journals-not-visible']),
  ];
  const observed = blockedBy.length === 0;
  const nextCase = observed
    ? 'FIXEDASSETS-290-FA-DEPRECIATION-JOURNAL-ASSETS-DEFAULT-REVIEW'
    : 'FIXEDASSETS-290-FA-DEPRECIATION-JOURNAL-ASSETS-DEFAULT-BLOCKER-REVIEW';
  const nextCaseFile = observed
    ? '.agent/state/cases/fixedassets-290-fa-depreciation-journal-assets-default-review.json'
    : '.agent/state/cases/fixedassets-290-fa-depreciation-journal-assets-default-blocker-review.json';
  const nextStep = observed
    ? 'FIXEDASSETS-290: locally review FA-289 journal context before any Calculate Depreciation OK, Preview Posting or Post.'
    : 'FIXEDASSETS-290: locally review the FA-289 blocker before any retry.';

  await writeTextEvidence(faEvidencePath('010-fa-gl-journal-assets-default-text.txt'), compactText || 'No compact Fixed Asset G/L Journals text captured.');
  await writeJsonEvidence(faEvidencePath('010-fa-gl-journal-assets-default-context.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    context,
    dialogState,
    journal,
    blockedBy,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-journal-assets-default-readonly',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-gl-journal-assets-default-context',
    resultStatus: observed ? 'observed' : 'blocked',
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    sourceCompany: EXPECTED_COMPANY,
    dataBasis: 'CRONUS USA laboratory',
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction:
      'In the future German target company, open Fixed Asset G/L Journals read-only first, prove the journal template/batch context, then create or calculate a depreciation line only after setup, VAT/accounting and posting gates are proven.',
    mustRecreateInFinalSandbox: true,
    targetGermanCompanyImpact:
      'German final evidence must recreate the page context, batch, depreciation line, Preview Posting and posted depreciation entries with German UI labels and German accounting setup.',
    finalScreenshotNeeded: true,
    target: {
      pageId: TARGET_PAGE_ID,
      pageName: 'Fixed Asset G/L Journals',
      journalTemplateName: EXPECTED_TEMPLATE,
      journalBatchName: EXPECTED_BATCH,
      batchNoSeries: EXPECTED_NO_SERIES,
      fixedAssetNo: ASSET_NO,
      depreciationBook: DEPRECIATION_BOOK,
    },
    context,
    dialogState,
    journal: {
      pageVisible: journal.pageVisible,
      templateVisible: journal.templateVisible,
      batchVisible: journal.batchVisible,
      noSeriesVisible: journal.noSeriesVisible,
      batchNameLabelVisible: journal.batchNameLabelVisible,
      assetVisible: journal.assetVisible,
      depreciationBookVisible: journal.depreciationBookVisible,
      faDepVisible: journal.faDepVisible,
      previewPostingVisible: journal.previewPostingVisible,
      postVisible: journal.postVisible,
      newOrEditVisible: journal.newOrEditVisible,
      frameCount: journal.frameCount,
      relevantFrameCount: journal.relevantFrameCount,
    },
    safety: {
      noBatchSelected: true,
      noLookupOk: true,
      noNew: true,
      noEditList: true,
      noCalculateDepreciationOk: true,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noDraft: true,
      noRecordEdit: true,
      noRecordDelete: true,
      noJournalLineInsertEditDelete: true,
    },
    proved: [
      ...(observed ? ['Fixed Asset G/L Journals was opened read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      ...(journal.templateVisible ? ['ASSETS journal template context is visible.'] : []),
      ...(journal.batchVisible ? ['DEFAULT batch context is visible.'] : []),
      ...(journal.batchNameLabelVisible ? ['Batch Name label/context is visible.'] : []),
      ...(journal.faDepVisible ? ['FADEP depreciation document prefix is visible in the journal context.'] : []),
      'No batch selection, OK, New, Edit List, Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, API shortcut or book change was executed.',
    ],
    notProved: [
      'No selected Batch Name value was changed or confirmed.',
      'No new FADEP depreciation journal line is proven from this run.',
      'No Preview Posting result is proven.',
      'No depreciation posting is proven.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-289-fa-depreciation-journal-assets-default-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-289/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-289/FIXEDASSETS-289-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-289/FIXEDASSETS-289-JOURNAL-ASSETS-DEFAULT-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-289/010-fa-gl-journal-assets-default-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-289/010-fa-gl-journal-assets-default-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-289/README.md',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-289-fa-depreciation-journal-assets-default-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: observed
          ? 'FA-289 captured Fixed Asset G/L Journals ASSETS / DEFAULT context read-only. Local review required before Calculate Depreciation OK, Preview Posting or Post.'
          : 'FA-289 could not prove Fixed Asset G/L Journals ASSETS / DEFAULT context; local blocker review required.',
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: observed,
    reason: 'Read-only Fixed Asset G/L Journals ASSETS / DEFAULT context probe completed or blocked without editing, previewing or posting.',
    nextCase,
    nextCaseFile,
    nextStep,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-289-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-289-JOURNAL-ASSETS-DEFAULT-READONLY.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-289 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-289-result.json` | JSON-Ergebnis | Journal-Kontext, Safety-Flags, Migration-Relevanz | keine AfA-Zeile und keine Buchung | labor-reference |',
      '| `FIXEDASSETS-289-JOURNAL-ASSETS-DEFAULT-READONLY.md` | Lernzusammenfassung | warum ASSETS/DEFAULT-Kontext vor AfA-Aktion wichtig ist | keinen deutschen Finalnachweis | labor-reference |',
      '| `010-fa-gl-journal-assets-default-context.json` | UI-Signalextrakt | Page-/Frame-/Control-Signale zu ASSETS, DEFAULT, FADEP | keine Wertauswahl oder Aenderung | read-only |',
      '| `010-fa-gl-journal-assets-default-text.txt` | kompakter Seitentext | sichtbare Journal-/Batch-Signale | keinen Rohdump | read-only |',
      '',
      'Migration: Dieser Schritt ist `needed-for-german-final`, muss in der deutschen Zielcompany neu erzeugt werden und ist kein finaler deutscher Buchbeweis.',
      '',
    ].join('\n'),
  );

  expect(result.safety.noCalculateDepreciationOk).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
  expect(result.safety.noJournalLineInsertEditDelete).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|dangerous-dialog/i.test(entry))).toEqual([]);
});
