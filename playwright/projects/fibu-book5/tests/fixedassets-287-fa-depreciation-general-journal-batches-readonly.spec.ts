import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-287';
const CASE_ID = 'FIXEDASSETS-287-FA-DEPRECIATION-GENERAL-JOURNAL-BATCHES-READONLY';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const TARGET_PAGE_ID = 251;
const EXPECTED_PAGE = 'General Journal Batches';
const EXPECTED_BATCH = 'DEFAULT';
const EXPECTED_DESCRIPTION = 'Default Journal Batch';
const EXPECTED_NO_SERIES = 'FA-JNL';

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

function page251Url() {
  const url = new URL(bcPageUrl(TARGET_PAGE_ID, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function isTargetFrame(frame: Frame) {
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

async function detectDangerousDialogs(page: Page, phase: string) {
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

async function readBatchContext(page: Page) {
  const frameResults = [];
  for (const frame of page.frames()) {
    const result = await frame.evaluate(
      ({ expectedPage, expectedBatch, expectedDescription, expectedNoSeries }) => {
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
      const bodyText = norm(document.body?.innerText || '');
      const rowTexts = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
        .filter(visible)
        .map((row, index) => ({
          index,
          text: norm(row.innerText || row.textContent).slice(0, 500),
          ariaSelected: norm(row.getAttribute('aria-selected')),
          rect: rectOf(row),
        }))
        .filter((row) => /Name|Description|No\. Series|Posting No\. Series|DEFAULT|FA-JNL|Default Journal Batch|G\/L Account/i.test(row.text))
        .slice(0, 80);
      const controls = [...document.querySelectorAll<HTMLElement>('input,select,textarea,[role="textbox"],[role="combobox"],button,a[role="button"]')]
        .filter(visible)
        .map((control, index) => ({
          index,
          tag: control.tagName.toLowerCase(),
          role: norm(control.getAttribute('role')),
          text: norm(control.innerText || control.textContent),
          value: norm((control as HTMLInputElement).value),
          ariaLabel: norm(control.getAttribute('aria-label')),
          title: norm(control.getAttribute('title')),
          rect: rectOf(control),
        }))
        .filter((control) => /Name|Description|No\. Series|Posting No\. Series|DEFAULT|FA-JNL|Default Journal Batch|G\/L Account|New|Neu|Edit List|Liste bearbeiten/i.test(`${control.text} ${control.value} ${control.ariaLabel} ${control.title}`))
        .slice(0, 100);
      const combined = `${bodyText}\n${rowTexts.map((row) => row.text).join('\n')}\n${controls.map((control) => `${control.text} ${control.value} ${control.ariaLabel} ${control.title}`).join('\n')}`;
      return {
        frameUrl: location.href,
        pageVisible: new RegExp(expectedPage, 'i').test(combined),
        batchVisible: new RegExp(`\\b${expectedBatch}\\b`, 'i').test(combined),
        descriptionVisible: new RegExp(expectedDescription, 'i').test(combined),
        noSeriesVisible: new RegExp(`\\b${expectedNoSeries}\\b`, 'i').test(combined),
        balAccountTypeVisible: /G\/L Account/i.test(combined),
        newActionVisible: /Neu|New/i.test(combined),
        editListActionVisible: /Liste bearbeiten|Edit List/i.test(combined),
        bodyText: bodyText.slice(0, 6000),
        rowTexts,
        controls,
      };
    },
    {
      expectedPage: EXPECTED_PAGE,
      expectedBatch: EXPECTED_BATCH,
      expectedDescription: EXPECTED_DESCRIPTION,
      expectedNoSeries: EXPECTED_NO_SERIES,
    },
    ).catch((error) => ({
      frameUrl: frame.url(),
      pageVisible: false,
      batchVisible: false,
      descriptionVisible: false,
      noSeriesVisible: false,
      balAccountTypeVisible: false,
      newActionVisible: false,
      editListActionVisible: false,
      bodyText: '',
      rowTexts: [],
      controls: [],
      error: String(error),
    }));
    frameResults.push(result);
  }

  const relevant = frameResults.filter((entry) =>
    entry.pageVisible ||
    entry.batchVisible ||
    entry.descriptionVisible ||
    entry.noSeriesVisible ||
    /General Journal Batches|DEFAULT|FA-JNL|Default Journal Batch/i.test(entry.bodyText),
  );
  const source =
    relevant[0] ??
    frameResults.find((entry) => {
      const frameUrl = decodeURIComponent(entry.frameUrl);
      return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`);
    }) ??
    frameResults[0];
  return {
    frameUrl: source?.frameUrl ?? page.url(),
    pageVisible: frameResults.some((entry) => entry.pageVisible),
    batchVisible: frameResults.some((entry) => entry.batchVisible),
    descriptionVisible: frameResults.some((entry) => entry.descriptionVisible),
    noSeriesVisible: frameResults.some((entry) => entry.noSeriesVisible),
    balAccountTypeVisible: frameResults.some((entry) => entry.balAccountTypeVisible),
    newActionVisible: frameResults.some((entry) => entry.newActionVisible),
    editListActionVisible: frameResults.some((entry) => entry.editListActionVisible),
    bodyText: relevant.map((entry) => entry.bodyText).join('\n').slice(0, 6000) || source?.bodyText || '',
    rowTexts: relevant.flatMap((entry) => entry.rowTexts).slice(0, 120),
    controls: relevant.flatMap((entry) => entry.controls).slice(0, 120),
    frameCount: frameResults.length,
    relevantFrameCount: relevant.length,
    frameSummaries: frameResults.map((entry) => ({
      frameUrl: entry.frameUrl,
      pageVisible: entry.pageVisible,
      batchVisible: entry.batchVisible,
      noSeriesVisible: entry.noSeriesVisible,
      textSample: entry.bodyText.slice(0, 200),
    })).slice(0, 20),
  };
}

function renderLearning(result: any) {
  return [
    '# FIXEDASSETS-287 General Journal Batches read-only',
    '',
    'Status: `labor`, `read-only`, `batch-context`, `no-select`, `no-new`, `no-edit-list`, `no-ok`, `no-preview`, `no-post`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Page direkt geoeffnet: ${result.batchContext.pageVisible ? 'ja' : 'nein/unklar'}`,
    `- Batch \`${EXPECTED_BATCH}\` sichtbar: ${result.batchContext.batchVisible ? 'ja' : 'nein'}`,
    `- Beschreibung \`${EXPECTED_DESCRIPTION}\` sichtbar: ${result.batchContext.descriptionVisible ? 'ja' : 'nein'}`,
    `- Nummernserie \`${EXPECTED_NO_SERIES}\` sichtbar: ${result.batchContext.noSeriesVisible ? 'ja' : 'nein'}`,
    `- Gegenkontoart \`G/L Account\` sichtbar: ${result.batchContext.balAccountTypeVisible ? 'ja' : 'nein'}`,
    '',
    '## Bedeutung fuer die Klickanleitung',
    '',
    'Der Batch-Kontext ist ein Setup-/Listenbefund. Er erklaert, welche Batch-Option Business Central im Lookup gezeigt hat. Er beweist weiterhin nicht, dass `Batch Name` im Anlagen-Fibu-Buchblatt gesetzt wurde und erzeugt keine AfA-Zeile.',
    '',
    '## Grenzen',
    '',
    '- Kein Batch wurde ausgewaehlt.',
    '- Kein `OK` wurde bestaetigt.',
    '- `Neu` und `Liste bearbeiten` wurden nicht geklickt.',
    '- Kein `Calculate Depreciation -> OK`.',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Keine Setup-Aenderung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-287 reads General Journal Batches context without selecting or editing', async ({ page }) => {
  const startedAt = new Date().toISOString();

  await page.goto(page251Url(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);

  const context = await sandboxContext(page);
  const dialogState = await detectDangerousDialogs(page, 'after-open-general-journal-batches');
  const batchContext = await readBatchContext(page);
  const compactText = clean(
    await compactPageText(page, {
      include: [/General Journal Batches|Name|Description|Bal\. Account Type|No\. Series|Posting No\. Series|DEFAULT|Default Journal Batch|FA-JNL|G\/L Account|Neu|Liste bearbeiten|New|Edit List/i],
      maxLines: 220,
      maxLineLength: 260,
    }),
  );

  const blockedBy = [
    ...(context.environmentInUrl ? [] : ['wrong-instance']),
    ...(context.companyInUrl ? [] : ['wrong-company-url']),
    ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
    ...(dialogState.ok ? [] : dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog}`)),
    ...(batchContext.pageVisible ? [] : ['general-journal-batches-page-not-visible']),
    ...(batchContext.batchVisible ? [] : ['default-batch-not-visible']),
    ...(batchContext.noSeriesVisible ? [] : ['fa-jnl-no-series-not-visible']),
  ];
  const observed = blockedBy.length === 0;
  const nextCase = 'FIXEDASSETS-288-FA-DEPRECIATION-BATCH-CONTEXT-RESULT-REVIEW';
  const nextCaseFile = '.agent/state/cases/fixedassets-288-fa-depreciation-batch-context-result-review.json';
  const nextStep = observed
    ? 'FIXEDASSETS-288: locally review whether DEFAULT / FA-JNL batch context is enough for the depreciation click guide; do not select Batch Name or run OK/Preview/Post yet.'
    : 'FIXEDASSETS-288: locally review the FA-287 blocker and choose the next no-select proof path; no OK, Preview Posting or Post.';

  await writeTextEvidence(faEvidencePath('010-general-journal-batches-text.txt'), compactText || 'No compact General Journal Batches text captured.');
  await writeJsonEvidence(faEvidencePath('010-general-journal-batches-context.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    context,
    dialogState,
    batchContext: {
      ...batchContext,
      frameUrl: safeUrl(batchContext.frameUrl),
    },
    blockedBy,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-general-journal-batches-readonly',
    caseId: CASE_ID,
    source: 'playwright-readonly-general-journal-batches-context',
    resultStatus: observed ? 'observed' : 'blocked',
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    target: {
      pageId: TARGET_PAGE_ID,
      pageName: EXPECTED_PAGE,
      batchName: EXPECTED_BATCH,
      description: EXPECTED_DESCRIPTION,
      noSeries: EXPECTED_NO_SERIES,
    },
    context,
    batchContext: {
      pageVisible: batchContext.pageVisible,
      batchVisible: batchContext.batchVisible,
      descriptionVisible: batchContext.descriptionVisible,
      noSeriesVisible: batchContext.noSeriesVisible,
      balAccountTypeVisible: batchContext.balAccountTypeVisible,
      newActionVisible: batchContext.newActionVisible,
      editListActionVisible: batchContext.editListActionVisible,
      rowCount: batchContext.rowTexts.length,
      controlCount: batchContext.controls.length,
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
    },
    proved: [
      ...(observed ? ['General Journal Batches was opened read-only in MCP_1_20260210 / RM-DEMO.'] : []),
      ...(batchContext.batchVisible ? ['DEFAULT is visible in General Journal Batches context.'] : []),
      ...(batchContext.descriptionVisible ? ['Default Journal Batch description is visible.'] : []),
      ...(batchContext.noSeriesVisible ? ['FA-JNL is visible as No. Series context.'] : []),
      ...(batchContext.balAccountTypeVisible ? ['G/L Account is visible as Bal. Account Type context.'] : []),
      'No batch selection, OK, New, Edit List, Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, API shortcut or book change was executed.',
    ],
    notProved: [
      'No selected Batch Name field value is proven in Fixed Asset G/L Journals.',
      'No FADEP depreciation journal line is proven.',
      'No Preview Posting result is proven.',
      'No depreciation posting is proven.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-287-fa-depreciation-general-journal-batches-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-287/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-287/FIXEDASSETS-287-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-287/FIXEDASSETS-287-GENERAL-JOURNAL-BATCHES-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-287/010-general-journal-batches-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-287/010-general-journal-batches-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-287/README.md',
    ],
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-287-fa-depreciation-general-journal-batches-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase,
        depreciationReadiness: observed
          ? 'FA-287 proves DEFAULT / FA-JNL as read-only General Journal Batches context. It still does not prove selected Batch Name or depreciation journal line.'
          : 'FA-287 could not prove General Journal Batches context; local blocker review required.',
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: observed,
    reason: 'Read-only General Journal Batches context probe completed or blocked without selecting/editing a batch.',
    nextCase,
    nextCaseFile,
    nextStep,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-287-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-287-GENERAL-JOURNAL-BATCHES-READONLY.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-287 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-287-result.json` | JSON-Ergebnis | Batch-Kontext, Safety-Flags und naechster Review | keinen gesetzten Batch Name, keine AfA-Zeile | labor |',
      '| `FIXEDASSETS-287-GENERAL-JOURNAL-BATCHES-READONLY.md` | Lernzusammenfassung | Warum Batchlisten-Kontext nuetzlich, aber kein Feldwert ist | keinen deutschen Finalnachweis | labor |',
      '| `010-general-journal-batches-text.txt` | kompakter Seitentext | sichtbare Batch-/Nummernserien-Signale | keinen Rohdump | compact |',
      '| `010-general-journal-batches-context.json` | UI-Signalextrakt | DEFAULT/FA-JNL-Kontext und Blocker | keine Wertauswahl oder Aenderung | read-only |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noBatchSelected).toBe(true);
  expect(result.safety.noLookupOk).toBe(true);
  expect(result.safety.noNew).toBe(true);
  expect(result.safety.noEditList).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-instance|wrong-company|production-environment-visible|dangerous-dialog/i.test(entry))).toEqual([]);
});
