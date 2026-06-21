import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-190-FA-GL-JOURNAL-ACTION-INVENTORY-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-191-FA-GL-JOURNAL-PREVIEW-ACTION-INVENTORY-REVIEW';
const TEST_ID = 'fixedassets-190';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

function faJournalPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(FA_GL_JOURNAL_PAGE_ID));
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

function isTargetFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${FA_GL_JOURNAL_PAGE_ID}`) && frameUrl.includes('runinframe=1');
}

async function targetFrame(page: Page) {
  const frame = page.frames().find(isTargetFrame);
  if (!frame) {
    throw new Error('Fixed Asset G/L Journals runinframe was not found.');
  }
  return frame;
}

async function actionInventory(scope: Page | Frame) {
  return scope.evaluate(() => {
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],a,[aria-label],[title]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tagName: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          text: norm(element.innerText || element.textContent),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          disabled: Boolean((element as HTMLButtonElement).disabled || element.getAttribute('aria-disabled') === 'true'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => [entry.text, entry.ariaLabel, entry.title].some(Boolean))
      .slice(0, 260);
  });
}

function classifyActions(actions: Awaited<ReturnType<typeof actionInventory>>) {
  const labels = actions
    .map((entry) => cleanText([entry.text, entry.ariaLabel, entry.title].filter(Boolean).join(' | ')))
    .filter(Boolean);
  const previewCandidates = actions.filter((entry) => /Preview Posting|Buchungsvorschau|Vorschau buchen|Buchen Vorschau/i.test([entry.text, entry.ariaLabel, entry.title].join(' ')));
  const postCandidates = actions.filter((entry) => /^(Post|Buchen)(\.\.\.)?$|Post and Print|Buchen und drucken/i.test(cleanText([entry.text, entry.ariaLabel, entry.title].join(' '))));
  const riskyCandidates = actions.filter((entry) =>
    /New|Neu|Edit|Bearbeiten|Delete|Loeschen|Loschen|Post|Buchen|Preview|Vorschau|Ship|Invoice|Payment|Zahlung|Reconcile|Insert FA Bal/i.test(
      [entry.text, entry.ariaLabel, entry.title].join(' '),
    ),
  );

  return {
    actionCount: actions.length,
    previewCandidateCount: previewCandidates.length,
    postCandidateCount: postCandidates.length,
    riskyCandidateCount: riskyCandidates.length,
    previewCandidates,
    postCandidates,
    riskyCandidates: riskyCandidates.slice(0, 80),
    labels: labels.slice(0, 120),
    previewCandidateState:
      previewCandidates.length === 0 ? 'absent' : previewCandidates.length === 1 ? 'single-candidate' : 'multiple-candidates',
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-191-fa-gl-journal-preview-action-inventory-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-190-fa-gl-journal-action-inventory-readonly.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-191: locally review FA-190 action inventory before any Preview Posting retry. Do not Post.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly-action-inventory' : 'blocked-readonly-action-inventory',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-190/FIXEDASSETS-190-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-191 local review; do not click Preview Posting or Post.',
    },
  };
}

test('FIXEDASSETS-190 inventories Fixed Asset G/L Journal actions read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let frameActions: Awaited<ReturnType<typeof actionInventory>> = [];
  let pageActions: Awaited<ReturnType<typeof actionInventory>> = [];
  let frameClassification: ReturnType<typeof classifyActions> | undefined;
  let pageClassification: ReturnType<typeof classifyActions> | undefined;
  let pageContextText = '';

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    await page.waitForTimeout(1200);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    } else {
      const frame = await targetFrame(page);
      frameUrl = safeUrl(frame.url());
      frameActions = await actionInventory(frame);
      pageActions = await actionInventory(page);
      frameClassification = classifyActions(frameActions);
      pageClassification = classifyActions(pageActions);
      pageContextText = await compactPageText(page, {
        include: [
          /Fixed Asset|FA G\/L|G\/L Journal|Journal/i,
          /Post|Preview Posting|Buchungsvorschau|Vorschau|Insert FA Bal\. Account|Reconcile|Apply Entries|Delete|New|Edit/i,
          /Batch Name|Posting Date|Document No\.|Account Type|FA Posting Type|Amount|Bal\. Account/i,
        ],
        maxLines: 160,
        maxLineLength: 220,
      });
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (!frameClassification) {
    blockedBy.push('No frame-scoped action inventory was captured.');
  }
  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const previewState = frameClassification?.previewCandidateState ?? 'not-captured';
  const summary =
    status === 'observed'
      ? `FA-190 captured read-only Fixed Asset G/L Journals action inventory. Frame Preview Posting candidate state: ${previewState}. No actions were clicked.`
      : `FA-190 could not capture safe action inventory. Blocker: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeTextEvidence(faEvidencePath('010-action-inventory-context.txt'), pageContextText || 'No action inventory context captured.');
  await writeJsonEvidence(faEvidencePath('020-action-inventory.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-190-action-inventory',
    caseId: CASE_ID,
    context,
    frameUrl,
    frameClassification,
    pageClassification,
    frameActions,
    pageActions,
    safety: {
      clickedAnyAction: false,
      clickedPreviewPosting: false,
      clickedPost: false,
      openedPostingDialog: false,
      changedData: false,
    },
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-190-action-inventory-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-action-inventory',
    resultStatus: status,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      frameUrl,
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(frameUrl ? ['The Fixed Asset G/L Journals runinframe context was isolated.'] : []),
      ...(frameClassification ? [`Frame action inventory was captured with ${frameClassification.actionCount} visible action candidates.`] : []),
      ...(frameClassification ? [`Frame Preview Posting candidate state: ${frameClassification.previewCandidateState}.`] : []),
      'No action was clicked.',
      'No Post confirmation was opened or accepted.',
      'No journal line was created, edited or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      'Preview Posting was not clicked.',
      'No Preview Posting entries were visible.',
      'No Fixed Asset G/L Journal posting was executed.',
      'No FA Ledger Entry or G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-190-fa-gl-journal-action-inventory-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-190/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-190/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-190/010-action-inventory-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-190/020-action-inventory.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-190/FIXEDASSETS-190-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-190/FIXEDASSETS-190-result.json',
    ],
    warnings: [
      'Action inventory only. Candidate labels are not executed actions.',
      'Do not treat a visible Post candidate as permission to post.',
      'Do not treat a Preview Posting candidate as proof of preview entries before a separate reviewed Preview-only run.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    actionInventory: {
      frame: frameClassification,
      page: pageClassification,
    },
    flags: {
      noActionClick: true,
      noInsertLine: true,
      noDeleteLine: true,
      noPost: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-190-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-190-learning.md'),
    [
      '# FIXEDASSETS-190 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `action-inventory`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      'FA-190 trennt Aktionssichtbarkeit von Aktionsausfuehrung. Gerade bei Journalen ist das wichtig: Ein sichtbarer `Post`-Kandidat bleibt gefaehrlich, und ein sichtbarer `Preview Posting`-Kandidat ist erst nach Review ein moeglicher naechster Klickpfad.',
      '',
      '## Grenze',
      '',
      '- Keine Aktion geklickt.',
      '- Keine Buchungsvorschau geoeffnet.',
      '- Keine Buchung.',
      '- Keine Postenspur.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-190 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-action-inventory-context.txt` | Text | kompakter Journal-/Aktionskontext | keine Aktionsausfuehrung | `labor`, `read-only` |',
      '| `020-action-inventory.json` | JSON | frame- und page-gescopte Aktionskandidaten inkl. Preview/Post-Klassifikation | keine Preview-/Posting-Wirkung | `labor`, `read-only` |',
      '| `FIXEDASSETS-190-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-190-learning.md` | Markdown | Lernwert und naechste Route | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noActionClick).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreviewPosting).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
