import { test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-300';
const CASE_ID = 'FIXEDASSETS-300-FA-JOURNAL-DEPRECIATION-OUTPUT-TARGET-READONLY';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const TARGET_DOCUMENTS = ['FADEP-291-OK', 'FADEP-295-OK'];
const TARGET_ASSET_NO = 'FA-CNC-01';
const TARGET_BOOK = 'HGB';

const CANDIDATE_PAGES = [
  { pageId: 5621, expectedName: 'Fixed Asset Journals candidate' },
  { pageId: 5622, expectedName: 'Fixed Asset Journals candidate' },
  { pageId: 5623, expectedName: 'Fixed Asset Journals candidate' },
  { pageId: 5624, expectedName: 'Fixed Asset Journals candidate' },
  { pageId: 5625, expectedName: 'Fixed Asset Journals candidate' },
  { pageId: 5626, expectedName: 'Fixed Asset Journals candidate' },
  { pageId: 5627, expectedName: 'Fixed Asset Journals candidate' },
  { pageId: 5628, expectedName: 'Known Fixed Asset G/L Journals control candidate' },
  { pageId: 5629, expectedName: 'Fixed Asset Journals candidate' },
];

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

function safeMaybeUrl(value: string) {
  try {
    return safeUrl(value);
  } catch {
    return value;
  }
}

function candidateUrl(pageId: number) {
  const url = new URL(bcPageUrl(pageId, project.envPrefix));
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

async function readPageFrames(page: Page, pageId: number) {
  const frameResults = [];
  for (const frame of page.frames()) {
    const frameUrl = decodeURIComponent(frame.url());
    if (!frameUrl.includes(EXPECTED_INSTANCE) || !frameUrl.includes(`page=${pageId}`)) continue;
    frameResults.push(await readCandidateFrame(frame));
  }

  const combined = frameResults
    .flatMap((entry) => [
      entry.bodyText,
      ...entry.rows.map((row: any) => row.text),
      ...entry.controls.map((control: any) => `${control.value} ${control.text} ${control.ariaLabel} ${control.title}`),
    ])
    .join('\n');

  const targetDocumentsVisible = Object.fromEntries(TARGET_DOCUMENTS.map((doc) => [doc, combined.includes(doc)]));
  const fixedAssetGlJournalsVisible = /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(combined);
  const fixedAssetJournalsVisible =
    /Fixed Asset Journals|Fixed Asset Journal/i.test(combined) && !fixedAssetGlJournalsVisible;
  const frames = frameResults.map((entry) => ({
    frameUrl: safeMaybeUrl(entry.frameUrl),
    bodyText: entry.bodyText.slice(0, 1200),
    targetDocumentsVisible: entry.targetDocumentsVisible,
    targetAssetVisible: entry.targetAssetVisible,
    targetBookVisible: entry.targetBookVisible,
    rows: entry.rows.slice(0, 20),
    controls: entry.controls.slice(0, 30),
  }));

  return {
    pageId,
    frameCount: page.frames().length,
    relevantFrameCount: frameResults.length,
    fixedAssetJournalsVisible,
    fixedAssetGlJournalsVisible,
    targetDocumentsVisible,
    anyTargetDocumentVisible: Object.values(targetDocumentsVisible).some(Boolean),
    targetAssetVisible: combined.includes(TARGET_ASSET_NO),
    targetBookVisible: new RegExp(`\\b${TARGET_BOOK}\\b`, 'i').test(combined),
    faDepPrefixVisible: /FADEP-/i.test(combined),
    previewPostingVisible: /Preview Posting|Buchungsvorschau/i.test(combined),
    postVisible: /\bPost\b|\bBuchen\b/i.test(combined),
    newEditDeleteVisible: /\bNew\b|\bNeu\b|\bEdit\b|\bBearbeiten\b|\bDelete\b|\bLoeschen\b/i.test(combined),
    frames,
  };
}

async function readCandidateFrame(frame: Frame) {
  return frame.evaluate(
    ({ targetDocuments, targetAssetNo, targetBook }) => {
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
        /Fixed Asset Journal|Fixed Asset G\/L|Batch Name|Template|Journal|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|FADEP-|FA-CNC-01|HGB|DEFAULT|ASSETS|Preview Posting|Post|New|Edit|Delete|Filter|View/i;
      const bodyText = norm(document.body?.innerText || '');
      const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name]')]
        .filter(visible)
        .map((row, index) => ({ index, text: norm(row.innerText || row.textContent).slice(0, 900) }))
        .filter(
          (row) =>
            interesting.test(row.text) ||
            targetDocuments.some((targetDocument: string) => row.text.includes(targetDocument)) ||
            row.text.includes(targetAssetNo),
        )
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
        .filter((control) => interesting.test(`${control.value} ${control.text} ${control.ariaLabel} ${control.title}`))
        .slice(0, 160);
      const combined = `${bodyText}\n${rows.map((row) => row.text).join('\n')}\n${controls
        .map((control) => `${control.value} ${control.text} ${control.ariaLabel} ${control.title}`)
        .join('\n')}`;
      return {
        frameUrl: location.href,
        bodyText: bodyText.slice(0, 7000),
        targetDocumentsVisible: Object.fromEntries(targetDocuments.map((doc: string) => [doc, combined.includes(doc)])),
        targetAssetVisible: combined.includes(targetAssetNo),
        targetBookVisible: new RegExp(`\\b${targetBook}\\b`, 'i').test(combined),
        rows,
        controls,
      };
    },
    {
      targetDocuments: TARGET_DOCUMENTS,
      targetAssetNo: TARGET_ASSET_NO,
      targetBook: TARGET_BOOK,
    },
  );
}

function renderLearning(result: any) {
  const selected = result.selectedPage ?? {};
  return [
    '# FIXEDASSETS-300 Fixed Asset Journals Output Target Read-only',
    '',
    'Status: `labor`, `read-only`, `no-ok`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Non-G/L Fixed Asset Journals sichtbar: ${selected.fixedAssetJournalsVisible ? 'ja' : 'nein'}`,
    `- Fixed Asset G/L Journals sichtbar: ${selected.fixedAssetGlJournalsVisible ? 'ja' : 'nein'}`,
    `- Kandidaten-Pages geprueft: ${result.candidatesTried.map((entry: any) => entry.pageId).join(', ')}`,
    `- FADEP-291-OK sichtbar: ${selected.targetDocumentsVisible?.['FADEP-291-OK'] ? 'ja' : 'nein'}`,
    `- FADEP-295-OK sichtbar: ${selected.targetDocumentsVisible?.['FADEP-295-OK'] ? 'ja' : 'nein'}`,
    `- FADEP-Prefix sichtbar: ${selected.faDepPrefixVisible ? 'ja' : 'nein'}`,
    `- FA-CNC-01 sichtbar: ${selected.targetAssetVisible ? 'ja' : 'nein'}`,
    `- HGB sichtbar: ${selected.targetBookVisible ? 'ja' : 'nein'}`,
    '',
    '## Buchwirkung',
    '',
    selected.fixedAssetJournalsVisible
      ? 'Die nicht-G/L-Anlagenjournalroute wurde im Labor sichtbar. Fuer Abschreibung bleibt trotzdem ein separates Gate noetig, weil keine Buchungsvorschau oder Buchung ausgefuehrt wurde.'
      : 'Die direkte Kandidatenroute konnte die nicht-G/L-Anlagenjournalpage nicht als sichtbaren AfA-Ausgabeort belegen. Das stuetzt die Aussage, dass die aktuelle AfA-Blockade nicht durch einfaches Umschauen in denselben alten G/L-Journal-Kontext geloest ist.',
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

function compactCandidate(entry: any, includeDetails = false) {
  const sampleRows = (entry.frames ?? []).flatMap((frame: any) => frame.rows ?? []).map((row: any) => row.text).filter(Boolean).slice(0, 8);
  const sampleControls = (entry.frames ?? [])
    .flatMap((frame: any) => frame.controls ?? [])
    .map((control: any) => ({
      tag: control.tag,
      role: control.role,
      value: control.value,
      text: control.text,
      ariaLabel: control.ariaLabel,
      title: control.title,
      disabled: control.disabled,
    }))
    .filter((control: any) => `${control.value} ${control.text} ${control.ariaLabel} ${control.title}`.trim())
    .slice(0, 16);
  const bodyTextSample = (entry.frames ?? [])
    .map((frame: any) => frame.bodyText)
    .find((text: string) => /Fixed Asset Journals|Fixed Asset G\/L|FA Allocations|FA Registers|Fehler ist aufgetreten|Maintenance Registration/i.test(text ?? ''));

  return {
    pageId: entry.pageId,
    expectedName: entry.expectedName,
    url: entry.url,
    environmentInUrl: entry.context?.environmentInUrl ?? false,
    companyInUrl: entry.context?.companyInUrl ?? false,
    companyInText: entry.context?.companyInText ?? false,
    blockedBy: entry.blockedBy ?? [],
    frameCount: entry.frameCount,
    relevantFrameCount: entry.relevantFrameCount,
    fixedAssetJournalsVisible: entry.fixedAssetJournalsVisible,
    fixedAssetGlJournalsVisible: entry.fixedAssetGlJournalsVisible,
    targetDocumentsVisible: entry.targetDocumentsVisible,
    anyTargetDocumentVisible: entry.anyTargetDocumentVisible,
    targetAssetVisible: entry.targetAssetVisible,
    targetBookVisible: entry.targetBookVisible,
    faDepPrefixVisible: entry.faDepPrefixVisible,
    previewPostingVisible: entry.previewPostingVisible,
    postVisible: entry.postVisible,
    newEditDeleteVisible: entry.newEditDeleteVisible,
    ...(includeDetails
      ? {
          bodyTextSample: (bodyTextSample ?? '').slice(0, 900),
          sampleRows,
          sampleControls,
        }
      : {}),
  };
}

test('FIXEDASSETS-300 inspects direct Fixed Asset Journals candidates read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const candidatesTried: any[] = [];
  let selectedPage: any = null;
  let selectedCompactText = '';

  for (const candidate of CANDIDATE_PAGES) {
    await page.goto(candidateUrl(candidate.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForURL(new RegExp(EXPECTED_INSTANCE), { timeout: 30_000 }).catch(() => undefined);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    await page.waitForTimeout(2500);

    const context = await sandboxContext(page);
    const dialogState = await dangerousDialogs(page, `after-open-page-${candidate.pageId}`);
    const pageSignals = await readPageFrames(page, candidate.pageId);
    const compactText = clean(
      await compactPageText(page, {
        include: [/Fixed Asset Journal|Fixed Asset G\/L|Batch Name|ASSETS|DEFAULT|Document No\.|FA Posting Type|Depreciation Book|Amount|FADEP-291-OK|FADEP-295-OK|FADEP-|FA-CNC-01|HGB|Preview Posting|\bPost\b|New|Edit|Delete|Filter|View/i],
        maxLines: 260,
        maxLineLength: 320,
      }),
    );
    const blockedBy = [
      ...(context.environmentInUrl ? [] : ['wrong-instance']),
      ...(context.companyInUrl ? [] : ['wrong-company-url']),
      ...(context.wrongEnvironmentVisible ? ['production-environment-visible'] : []),
      ...(dialogState.ok ? [] : dialogState.dangerous.map((dialog) => `dangerous-dialog:${dialog.slice(0, 180)}`)),
    ];

    const tried = {
      ...candidate,
      url: safeUrl(page.url()),
      context,
      dialogState,
      blockedBy,
      ...pageSignals,
    };
    candidatesTried.push(tried);

    if (blockedBy.length > 0) {
      selectedPage = tried;
      selectedCompactText = compactText;
      break;
    }

    if (pageSignals.fixedAssetJournalsVisible && !pageSignals.fixedAssetGlJournalsVisible) {
      selectedPage = tried;
      selectedCompactText = compactText;
      break;
    }

    if (!selectedPage && (pageSignals.fixedAssetGlJournalsVisible || pageSignals.fixedAssetJournalsVisible || pageSignals.faDepPrefixVisible)) {
      selectedPage = tried;
      selectedCompactText = compactText;
    }
  }

  if (!selectedPage) {
    selectedPage = candidatesTried[candidatesTried.length - 1] ?? null;
  }

  const selectedBlockedBy = selectedPage?.blockedBy ?? ['no-candidate-page-opened'];
  const observed = selectedBlockedBy.length === 0;
  const targetFound = Boolean(selectedPage?.anyTargetDocumentVisible || selectedPage?.faDepPrefixVisible);
  const nonGlPageProven = Boolean(selectedPage?.fixedAssetJournalsVisible && !selectedPage?.fixedAssetGlJournalsVisible);
  const compactCandidatesTried = candidatesTried.map((entry) => compactCandidate(entry));
  const compactSelectedPage = selectedPage ? compactCandidate(selectedPage, true) : null;
  const nextCase = nonGlPageProven || targetFound
    ? 'FIXEDASSETS-301-FA-DEPRECIATION-OUTPUT-TARGET-RESULT-REVIEW'
    : 'FIXEDASSETS-301-FA-JOURNAL-PAGE-ID-ROUTE-REVIEW';
  const nextCaseFile = nonGlPageProven || targetFound
    ? '.agent/state/cases/fixedassets-301-fa-depreciation-output-target-result-review.json'
    : '.agent/state/cases/fixedassets-301-fa-journal-page-id-route-review.json';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-journal-output-target-trace',
    resultStatus: observed ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    proved: [
      ...(observed ? ['The run stayed in MCP_1_20260210 / RM-DEMO.'] : []),
      'The run used direct BC page URLs for candidate Fixed Asset Journal pages instead of Tell-Me/search.',
      'No Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, new draft, edit or delete action was executed.',
      ...(nonGlPageProven ? ['A non-G/L Fixed Asset Journals page context was visible read-only.'] : []),
      ...(targetFound ? ['A FADEP target signal was visible in the selected read-only candidate context.'] : []),
    ],
    notProved: [
      ...(nonGlPageProven ? [] : ['A non-G/L Fixed Asset Journals output target is not proven by this run.']),
      ...(targetFound ? [] : ['FADEP-291-OK, FADEP-295-OK and generic FADEP line signals are not proven in the selected candidate context.']),
      'No depreciation Preview Posting was opened.',
      'No depreciation posting was performed.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-300-fa-journal-depreciation-output-target-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/FIXEDASSETS-300-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/FIXEDASSETS-300-FA-JOURNAL-DEPRECIATION-OUTPUT-TARGET-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/010-fa-journal-output-target-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/010-fa-journal-output-target-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-300/FIXEDASSETS-300-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/FIXEDASSETS-300-FA-JOURNAL-DEPRECIATION-OUTPUT-TARGET-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/010-fa-journal-output-target-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/010-fa-journal-output-target-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-300/README.md',
    ],
    warnings: [
      'CRONUS/RM-DEMO labor only.',
      'Candidate page ids are direct URL probes; page id confirmation remains BC UI evidence, not German final proof.',
      'Visible Post/Preview/New/Edit/Delete actions, if present, were not clicked.',
    ],
    blockedBy: selectedBlockedBy,
    requiresReview: true,
    safeToFinalizeState: observed,
    statePatch: {
      current: {
        activeCase: nextCase,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-300-fa-journal-depreciation-output-target-readonly.json',
        nextStep: targetFound
          ? 'Review FA-300 output-target evidence before any Preview Posting or Post.'
          : 'Review direct page-id route result and decide next FA depreciation output-target route without repeating Calculate Depreciation OK.',
      },
      lastRunSummary: {
        schemaVersion: 1,
        runId: CASE_ID,
        date: '2026-06-29',
        workType: 'fixedassets-fa-journal-depreciation-output-target-readonly',
        branch: 'codex/token-efficient-autopilot-state',
        instance: EXPECTED_INSTANCE,
        company: EXPECTED_COMPANY,
        bcRun: true,
        playwrightRun: true,
        posted: false,
        preview: false,
        setupChanged: false,
        companySwitched: false,
        resultStatus: observed ? 'observed' : 'blocked',
        summary: targetFound
          ? 'FA-300 found a FADEP signal in a direct Fixed Asset Journals candidate context read-only.'
          : 'FA-300 direct candidate-page trace did not prove non-G/L Fixed Asset Journals as the visible depreciation output target.',
        nextStep: targetFound
          ? 'Review output-target evidence before any Preview Posting or Post.'
          : 'Review page-id/route result and choose the next non-repeating depreciation output-target route.',
      },
      activeCase: {
        status: observed ? 'observed-readonly-review-required' : 'blocked-readonly',
        lastResult: {
          status: observed ? 'observed' : 'blocked',
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-300/FIXEDASSETS-300-result.json',
          summary: targetFound
            ? 'FADEP target signal visible in direct candidate page trace.'
            : 'No FADEP/non-G-L Fixed Asset Journals output target proven by direct candidate page trace.',
        },
        nextSafeAction: targetFound
          ? 'Local review before Preview Posting/Post.'
          : 'Local route review; do not repeat OK without a new hypothesis.',
      },
      coverage: {
        areas: {
          fixedassets: {
            currentBlock: targetFound ? 'fa-depreciation-output-target-review' : 'fa-depreciation-output-target-route-review',
            latestPracticalCase: 'FIXEDASSETS-300',
            nextCase,
            depreciationReadiness: targetFound
              ? 'FA-300 captured a FADEP signal in direct Fixed Asset Journal candidate context, but Preview/Post remain locked pending review.'
              : 'FA-300 did not prove non-G/L Fixed Asset Journals as the depreciation output target; no Preview/Post unlocked.',
          },
        },
      },
    },
    candidatesTried: compactCandidatesTried,
    selectedPage: compactSelectedPage,
    flags: {
      stayedInExpectedInstance: observed,
      companyContextDocumented: observed,
      noBookChange: true,
      noCalculateDepreciationOk: true,
      noPost: true,
      noPreview: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noEditRecord: true,
      noDeleteRecord: true,
      cleanupRequired: false,
      cleanupCompleted: true,
    },
    migrationRelevance: 'needed-for-german-final',
    rebuildInstruction:
      'In the German target company, reproduce the depreciation output-target route using direct page context and visible journal evidence before any Preview Posting or posting.',
    mustRecreateInFinalSandbox: true,
    sourceCompany: EXPECTED_COMPANY,
    targetGermanCompanyImpact: 'German final depreciation evidence must prove the correct journal/output target and then preview/posting trace with German setup.',
    finalScreenshotNeeded: true,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep: targetFound
      ? 'Review FA-300 output-target evidence before any Preview Posting or Post.'
      : 'Review direct page-id route result and decide next FA depreciation output-target route without repeating Calculate Depreciation OK.',
  };

  await writeJsonEvidence(faEvidencePath('010-fa-journal-output-target-context.json'), {
    candidatesTried: compactCandidatesTried,
    selectedPage: compactSelectedPage,
    targetFound,
    nonGlPageProven,
  });
  await writeTextEvidence(
    faEvidencePath('010-fa-journal-output-target-text.txt'),
    selectedCompactText || 'No compact Fixed Asset Journal candidate text captured.',
  );
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-300-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-300-FA-JOURNAL-DEPRECIATION-OUTPUT-TARGET-READONLY.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-300 Evidence',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-300-result.json` | JSON-Ergebnis | Direkte Kandidaten-Page-Route und FADEP-/Journal-Signale | keine AfA-Buchung | labor-reference |',
      '| `010-fa-journal-output-target-context.json` | JSON | Kandidaten-Pages, ausgewaehlter Kontext und sichtbare Signale | keine versteckten BC-Tabellenwerte | read-only |',
      '| `010-fa-journal-output-target-text.txt` | Text | Kompakter sichtbarer UI-Text des ausgewaehlten Kontextes | keine Screenshots oder Postingwirkung | read-only |',
      '| `FIXEDASSETS-300-FA-JOURNAL-DEPRECIATION-OUTPUT-TARGET-READONLY.md` | Lernnotiz | Buchwirkung und Grenzen | keinen deutschen Finalnachweis | not-final |',
      '',
      'Status: `labor-reference`, `read-only`, `no-ok`, `no-preview`, `no-posting`, `needs-german-final-rebuild`.',
    ].join('\n'),
  );
});
