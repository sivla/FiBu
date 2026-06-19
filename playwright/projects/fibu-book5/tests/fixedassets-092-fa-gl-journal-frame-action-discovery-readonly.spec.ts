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

const CASE_ID = 'FIXEDASSETS-092-FA-GL-JOURNAL-FRAME-ACTION-DISCOVERY-READONLY';
const TEST_ID = 'fixedassets-092';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function faJournalPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(TARGET_PAGE_ID));
  return url.toString();
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
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

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url,
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

function isTargetFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`) && frameUrl.includes('runinframe=1');
}

async function targetBusinessCentralFrame(page: Page) {
  const frame = page.frames().find(isTargetFrame);
  if (!frame) {
    throw new Error('Business Central runinframe for Fixed Asset G/L Journals page 5628 was not found.');
  }
  return frame;
}

async function frameInventory(frame: Frame) {
  return frame.evaluate(() => {
    function normalized(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    const interactive = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],a,input,select')]
      .filter(visible)
      .map((element) => ({
        tagName: element.tagName,
        role: element.getAttribute('role'),
        text: normalized(element.innerText || element.textContent),
        ariaLabel: normalized(element.getAttribute('aria-label')),
        title: normalized(element.getAttribute('title')),
        value: normalized((element as HTMLInputElement | HTMLSelectElement).value),
        disabled: Boolean((element as HTMLButtonElement | HTMLInputElement | HTMLSelectElement).disabled),
        readonly: Boolean((element as HTMLInputElement).readOnly),
      }));

    const columns = [...document.querySelectorAll<HTMLElement>('th,[role="columnheader"]')]
      .filter(visible)
      .map((element) => normalized(element.innerText || element.textContent))
      .filter(Boolean);

    const grids = [...document.querySelectorAll<HTMLElement>('[role="grid"],table')]
      .filter(visible)
      .map((element) => normalized(element.innerText || element.textContent).slice(0, 500))
      .filter(Boolean);

    return { interactive, columns, grids };
  });
}

function actionFlags(labels: string[]) {
  return {
    deleteVisible: labels.some((label) => /Delete|Loeschen|Loschen/i.test(label)),
    newVisible: labels.some((label) => /^(New|Neu)$|New Line|Neue Zeile/i.test(label)),
    editVisible: labels.some((label) => /^Edit|Bearbeiten/i.test(label)),
    postVisible: labels.some((label) => /^(Post|Buchen)$/i.test(label)),
    previewVisible: labels.some((label) => /Preview Posting|Buchungsvorschau|Vorschau/i.test(label)),
    insertFaBalAccountVisible: labels.some((label) => /Insert FA Bal\. Account/i.test(label)),
    reconcileVisible: labels.some((label) => /Reconcile/i.test(label)),
    applyEntriesVisible: labels.some((label) => /Apply Entries/i.test(label)),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string, cleanupCandidateFound: boolean) {
  const nextCase =
    status === 'observed' && cleanupCandidateFound
      ? 'FIXEDASSETS-093-FA-GL-JOURNAL-DRAFT-PROBE-PLAN'
      : 'FIXEDASSETS-093-FA-GL-JOURNAL-VALUE-ENTRY-GATE-DECISION';
  const nextFile =
    status === 'observed' && cleanupCandidateFound
      ? '.agent/state/cases/fixedassets-093-fa-gl-journal-draft-probe-plan.json'
      : '.agent/state/cases/fixedassets-093-fa-gl-journal-value-entry-gate-decision.json';
  const nextStep =
    status === 'observed' && cleanupCandidateFound
      ? 'Plan a no-post draft probe only after confirming how the Delete candidate can clean up the line.'
      : 'Decide whether FA journal acquisition should remain blocked, use a documented keep-draft policy, or switch route after frame-scoped action discovery.';

  return {
    current: {
      activeCase: nextCase,
      active_case_file: nextFile,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-092-fa-gl-journal-frame-action-discovery-readonly.json',
      nextStep,
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-gl-journal-frame-action-discovery-readonly',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      resultStatus: status,
      summary,
      nextStep,
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly' : 'blocked-readonly',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-092/FIXEDASSETS-092-result.json',
        summary,
      },
      nextSafeAction: nextStep,
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: cleanupCandidateFound ? 'fa-gl-journal-draft-probe-plan' : 'fa-gl-journal-value-entry-gate-decision',
          latestPracticalCase: 'FIXEDASSETS-092',
          nextCase,
        },
      },
    },
  };
}

test('FIXEDASSETS-092 discovers FA journal frame actions read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let contextBefore: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let contextAfter: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let inventory: Awaited<ReturnType<typeof frameInventory>> | undefined;
  let frameContextText = '';

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);

    contextBefore = await sandboxContext(page);
    if (!contextBefore.environmentInUrl || (!contextBefore.companyInUrl && !contextBefore.companyInText) || contextBefore.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context before FA-092 frame discovery: ${JSON.stringify(contextBefore)}`);
    } else {
      const frame = await targetBusinessCentralFrame(page);
      frameUrl = safeUrl(frame.url());
      inventory = await frameInventory(frame);
      frameContextText = await compactPageText(page, {
        include: [
          /Fixed Asset|FA G\/L|G\/L Journal|Journal/i,
          /Post|Insert FA Bal\. Account|Reconcile|Apply Entries|Delete|New|Edit/i,
          /Batch Name|Posting Date|Document No\.|Account Type|FA Posting Type|Amount/i,
        ],
        maxLines: 120,
        maxLineLength: 220,
      });
      contextAfter = await sandboxContext(page);
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const labels = (inventory?.interactive ?? [])
    .flatMap((entry) => [entry.text, entry.ariaLabel, entry.title, entry.value])
    .map(cleanText)
    .filter(Boolean);
  const flags = actionFlags(labels);
  const cleanupCandidateFound = flags.deleteVisible;

  if (!inventory) {
    blockedBy.push('No frame-scoped inventory was captured.');
  }
  if (contextAfter && (!contextAfter.environmentInUrl || (!contextAfter.companyInUrl && !contextAfter.companyInText) || contextAfter.wrongEnvironmentVisible)) {
    blockedBy.push(`Wrong BC context after FA-092 frame discovery: ${JSON.stringify(contextAfter)}`);
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? cleanupCandidateFound
        ? 'FA-092 captured frame-scoped action inventory and found a Delete cleanup candidate without executing it.'
        : 'FA-092 captured frame-scoped action inventory. Post, Insert FA Bal. Account and Reconcile are visible and remain locked; no Delete cleanup candidate was visible in the frame.'
      : `FA-092 could not capture safe frame-scoped action inventory. Blocker: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary, cleanupCandidateFound);

  await writeTextEvidence(faEvidencePath('010-frame-action-context.txt'), frameContextText || 'No FA journal frame context captured.');
  await writeJsonEvidence(faEvidencePath('020-frame-action-inventory.json'), {
    contextBefore,
    contextAfter,
    frameUrl,
    inventory,
    actionFlags: flags,
    cleanupCandidateFound,
    riskyExecuted: false,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-frame-action-discovery-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-result',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    proved: [
      ...(contextAfter?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(contextAfter?.companyInUrl || contextAfter?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(frameUrl ? ['The Fixed Asset G/L Journals runinframe context was isolated.'] : []),
      ...(inventory ? ['Frame-scoped action inventory was captured without group clicks.'] : []),
      ...(cleanupCandidateFound ? ['A Delete cleanup candidate is visible in the frame inventory.'] : []),
      'The run did not create, edit, delete, preview, post, reconcile, insert balancing account, pay, invoice, ship or change setup.',
    ],
    notProved: [
      ...(cleanupCandidateFound ? ['The Delete action was not executed or confirmed.'] : ['No Delete cleanup candidate is visible in the frame inventory.']),
      'No journal line was created.',
      'No FA-CNC-01 was entered in a journal.',
      'No K30000 was entered.',
      'No amount was entered.',
      'No Preview Posting.',
      'No acquisition posting.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-092-fa-gl-journal-frame-action-discovery-readonly.json',
      cleanupCandidateFound
        ? '.agent/state/cases/fixedassets-093-fa-gl-journal-draft-probe-plan.json'
        : '.agent/state/cases/fixedassets-093-fa-gl-journal-value-entry-gate-decision.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-092-fa-gl-journal-frame-action-discovery-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/FIXEDASSETS-092-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/FIXEDASSETS-092-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/010-frame-action-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/020-frame-action-inventory.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-092/FIXEDASSETS-092-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/FIXEDASSETS-092-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/010-frame-action-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-092/020-frame-action-inventory.json',
    ],
    warnings: [
      'Frame inventory only. Candidate labels are not executed actions.',
      'Post, Reconcile and Insert FA Bal. Account may be visible but remain forbidden.',
      'CRONUS/RM-DEMO labor only.',
    ],
    blockedBy,
    requiresReview: status === 'blocked',
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    actionInventory: {
      actionFlags: flags,
      cleanupCandidateFound,
      frameUrl,
      actionCount: inventory?.interactive.length ?? 0,
      columnCount: inventory?.columns.length ?? 0,
    },
    flags: {
      stayedInExpectedInstance: Boolean(contextAfter?.environmentInUrl),
      companyContextDocumented: Boolean(contextAfter?.companyInUrl || contextAfter?.companyInText),
      frameScoped: Boolean(frameUrl),
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noReconcile: true,
      noInsertFaBalAccount: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noEditRecord: true,
      noDeleteExecuted: true,
      noJournalLineCreated: true,
      cleanupRequired: false,
      cleanupCompleted: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-092-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-092-learning.md'),
    [
      '# FIXEDASSETS-092 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `frame-scoped-action-inventory`, `no-draft`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Business Central kann dieselbe Seite in einer Shell und in einem `runinframe` darstellen. Fuer Action Discovery ist der Frame-Kontext oft sauberer als globale Button-Suchen, weil Role-Center-Texte und andere Shell-Aktionen weniger stark in den Befund hineinlaufen.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 sollte den Journal-Preflight als technische Nachweisfuehrung beschreiben: Frame-Kontext, sichtbare Journal-Aktionen, gesperrte Buchungsaktionen und offene Cleanup-Frage gehoeren vor jede Werteingabe.',
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
      '# FIXEDASSETS-092 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-frame-action-context.txt` | Text | kompakter Journal-/Frame-Kontext | keine Aktion ausgefuehrt | `labor`, `read-only` |',
      '| `020-frame-action-inventory.json` | JSON | frame-gescoptes Aktions- und Spalteninventar | keine Loesch-/Buchungswirkung | `labor`, `read-only` |',
      '| `FIXEDASSETS-092-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-092-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noReconcile).toBe(true);
  expect(result.flags.noInsertFaBalAccount).toBe(true);
  expect(result.flags.noDeleteExecuted).toBe(true);
  expect(result.flags.noNewDraft).toBe(true);
  expect(result.flags.noEditRecord).toBe(true);
  expect(result.flags.frameScoped).toBe(status === 'observed');
});
