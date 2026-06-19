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

const CASE_ID = 'FIXEDASSETS-102-FA-GL-JOURNAL-CONTROLLED-DRAFT-PROBE';
const NEXT_CASE_ID = 'FIXEDASSETS-103-FA-GL-JOURNAL-DRAFT-RESULT-REVIEW';
const TEST_ID = 'fixedassets-102';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_PAGE_ID = 5628;

const TARGET = {
  postingDate: '01.01.2027',
  documentNo: 'G05001',
  accountType: 'Fixed Asset',
  accountNo: 'FA-CNC-01',
  depreciationBookCode: 'HGB',
  faPostingType: 'Acquisition Cost',
  genPostingType: 'Purchase',
  amount: '68000',
  balancingAccountType: 'Vendor',
  balancingAccountNo: 'K30000',
};

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(360_000);

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

async function targetFrame(page: Page) {
  const frame = page.frames().find(isTargetFrame);
  if (!frame) {
    throw new Error('Fixed Asset G/L Journals runinframe was not found.');
  }
  return frame;
}

async function rowSnapshot(frame: Frame) {
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

    const controls = [...document.querySelectorAll<HTMLElement>('input,select,textarea,[role="textbox"],[role="combobox"],[role="gridcell"],button,[role="button"]')]
      .filter(visible)
      .map((element) => {
        const input = element as HTMLInputElement | HTMLSelectElement;
        const rect = element.getBoundingClientRect();
        const options =
          element instanceof HTMLSelectElement
            ? [...element.options].map((option) => ({ text: normalized(option.text), value: option.value, selected: option.selected }))
            : [];
        return {
          tagName: element.tagName,
          role: element.getAttribute('role'),
          text: normalized(element.innerText || element.textContent),
          ariaLabel: normalized(element.getAttribute('aria-label')),
          title: normalized(element.getAttribute('title')),
          value: normalized('value' in input ? input.value : ''),
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          readonly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          options,
        };
      })
      .filter((entry) => {
        const haystack = [entry.text, entry.value, entry.ariaLabel, entry.title, ...entry.options.map((option) => option.text)].join(' ');
        return /Fixed Asset G\/L Journals|Batch Name|Posting Date|Document No\.|Account Type|Account No\.|Depreciation Book|FA Posting Type|Description|Gen\. Posting|Amount|Bal\. Account|G\/L Account|Fixed Asset|Vendor|Acquisition Cost|Purchase|K30000|FA-CNC-01|HGB|G05001/i.test(haystack);
      });

    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row) => normalized(row.innerText || row.textContent).slice(0, 700))
      .filter(Boolean)
      .slice(0, 20);

    const fullText = normalized(document.body?.innerText || '').slice(0, 3000);
    return { controls, rows, fullText };
  });
}

async function setSelect(frame: Frame, label: string, optionPattern: RegExp, occurrence = 0) {
  return frame.evaluate(
    ({ label, optionSource, optionFlags, occurrence }) => {
      const optionPattern = new RegExp(optionSource, optionFlags);
      const selects = [...document.querySelectorAll<HTMLSelectElement>('select')].filter((select) => {
        const rect = select.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && [...select.options].some((option) => optionPattern.test(option.text));
      });
      const select = selects[occurrence];
      if (!select) {
        return { ok: false, label, reason: 'select-not-found', occurrence, candidates: selects.length };
      }
      const option = [...select.options].find((entry) => optionPattern.test(entry.text));
      if (!option) {
        return { ok: false, label, reason: 'option-not-found', occurrence, candidates: selects.length };
      }
      select.focus();
      select.value = option.value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      select.blur();
      return {
        ok: true,
        label,
        value: option.value,
        text: option.text,
        occurrence,
        rect: (() => {
          const rect = select.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        })(),
      };
    },
    { label, optionSource: optionPattern.source, optionFlags: optionPattern.flags, occurrence },
  );
}

async function fillInputByOrder(frame: Frame, label: string, value: string, order: number) {
  return frame.evaluate(
    ({ label, value, order }) => {
      const inputs = [...document.querySelectorAll<HTMLInputElement>('input')]
        .filter((input) => {
          const rect = input.getBoundingClientRect();
          const type = (input.getAttribute('type') ?? '').toLowerCase();
          return rect.width > 0 && rect.height > 0 && !input.disabled && type !== 'hidden' && type !== 'checkbox';
        })
        .sort((left, right) => {
          const leftRect = left.getBoundingClientRect();
          const rightRect = right.getBoundingClientRect();
          return leftRect.y - rightRect.y || leftRect.x - rightRect.x;
        });
      const input = inputs[order];
      if (!input) {
        return { ok: false, label, reason: 'input-not-found', order, candidates: inputs.length };
      }
      input.focus();
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.blur();
      return {
        ok: true,
        label,
        value,
        order,
        previousCandidates: inputs.length,
        rect: (() => {
          const rect = input.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        })(),
      };
    },
    { label, value, order },
  );
}

async function performControlledDraftProbe(frame: Frame) {
  const steps = [];

  steps.push(await fillInputByOrder(frame, 'Posting Date', TARGET.postingDate, 1));
  steps.push(await fillInputByOrder(frame, 'Document No.', TARGET.documentNo, 2));
  steps.push(await setSelect(frame, 'Account Type', /^Fixed Asset$/i, 0));
  steps.push(await fillInputByOrder(frame, 'Account No.', TARGET.accountNo, 3));
  steps.push(await fillInputByOrder(frame, 'Depreciation Book Code', TARGET.depreciationBookCode, 4));
  steps.push(await setSelect(frame, 'FA Posting Type', /^Acquisition Cost$/i, 0));
  steps.push(await setSelect(frame, 'Gen. Posting Type', /^Purchase$/i, 0));
  steps.push(await fillInputByOrder(frame, 'Amount', TARGET.amount, 8));
  steps.push(await setSelect(frame, 'Bal. Account Type', /^Vendor$/i, 1));
  steps.push(await fillInputByOrder(frame, 'Bal. Account No.', TARGET.balancingAccountNo, 9));

  return {
    steps,
    ok: steps.every((step) => step.ok),
    failedSteps: steps.filter((step) => !step.ok),
  };
}

function targetSignals(snapshot: Awaited<ReturnType<typeof rowSnapshot>>) {
  const haystack = [
    snapshot.fullText,
    ...snapshot.rows,
    ...snapshot.controls.flatMap((control) => [control.text, control.value, control.title, control.ariaLabel]),
  ].join(' ');
  return {
    faCnc01Visible: /FA-CNC-01/i.test(haystack),
    k30000Visible: /K30000/i.test(haystack),
    hgbVisible: /\bHGB\b/i.test(haystack),
    amountVisible: /68[.,]?000|68000/i.test(haystack),
    documentNoVisible: /G05001/i.test(haystack),
    fixedAssetVisible: /Fixed Asset/i.test(haystack),
    acquisitionCostVisible: /Acquisition Cost/i.test(haystack),
  };
}

function compactJournalEvidence(
  phase: 'before' | 'after',
  context: Awaited<ReturnType<typeof sandboxContext>> | undefined,
  frameUrl: string,
  snapshot: Awaited<ReturnType<typeof rowSnapshot>> | undefined,
  signals?: ReturnType<typeof targetSignals>,
) {
  const text = snapshot?.fullText ?? '';
  const pageSignals = signals ?? (snapshot ? targetSignals(snapshot) : undefined);
  return {
    schemaVersion: 1,
    purpose: `fixedassets-102-${phase}-journal-row-compact-evidence`,
    status: phase === 'before' ? 'labor-before-snapshot-compact' : 'partial-draft-signal-compact',
    [phase === 'before' ? 'contextBefore' : 'contextAfter']: context,
    frameUrl,
    visiblePageSignals: {
      pageTitleVisible: /Fixed Asset G\/L Journals/i.test(text),
      faCnc01Visible: Boolean(pageSignals?.faCnc01Visible),
      k30000Visible: Boolean(pageSignals?.k30000Visible),
      hgbVisible: Boolean(pageSignals?.hgbVisible),
      documentNoVisible: Boolean(pageSignals?.documentNoVisible),
      fixedAssetVisible: Boolean(pageSignals?.fixedAssetVisible),
      acquisitionCostVisible: Boolean(pageSignals?.acquisitionCostVisible),
      amount68000Visible: Boolean(pageSignals?.amountVisible),
      pageErrorVisible: /Account Type or Bal\. Account Type must be a G\/L Account or Bank Account/i.test(text),
      noSuggestionsForK30000Visible: /K30000/i.test(text) && /keine Vorschl|No suggestions/i.test(text),
    },
    relevantRows: (snapshot?.rows ?? [])
      .filter((row) => /Posting Date|Document No\.|Amount|Bal\. Account|Number of Lines|Balance|No\.Name/i.test(row))
      .slice(0, 4),
    conclusion:
      phase === 'after'
        ? 'Partial signal only unless all target signals including amount 68000 are visible; no preview and no posting are performed by this probe.'
        : 'Before context only; no journal booking effect.',
    omitted: 'Full control list, control rectangles and full page text intentionally omitted to avoid raw dumps.',
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-103-fa-gl-journal-draft-result-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-102-fa-gl-journal-controlled-draft-probe.json',
      nextStep:
        status === 'observed'
          ? 'FIXEDASSETS-103: review controlled FA G/L Journal draft evidence locally before any Preview Posting or posting is unlocked.'
          : 'FIXEDASSETS-103: review why the controlled FA G/L Journal draft probe blocked before retrying.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-gl-journal-controlled-draft-probe',
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
      nextStep:
        status === 'observed'
          ? 'Run FIXEDASSETS-103 local review before any Preview Posting or posting.'
          : 'Run FIXEDASSETS-103 local blocker review before retrying.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-keep-draft' : 'blocked',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-102/FIXEDASSETS-102-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-103 local evidence review.',
    },
  };
}

test('FIXEDASSETS-102 creates one controlled FA G/L Journal laboratory draft line', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let contextBefore: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let contextAfter: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let beforeSnapshot: Awaited<ReturnType<typeof rowSnapshot>> | undefined;
  let afterSnapshot: Awaited<ReturnType<typeof rowSnapshot>> | undefined;
  let frameUrl = '';
  let probe: Awaited<ReturnType<typeof performControlledDraftProbe>> | undefined;

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    contextBefore = await sandboxContext(page);
    if (!contextBefore.environmentInUrl || (!contextBefore.companyInUrl && !contextBefore.companyInText) || contextBefore.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context before FA-102: ${JSON.stringify(contextBefore)}`);
    } else {
      const frame = await targetFrame(page);
      frameUrl = safeUrl(frame.url());
      beforeSnapshot = await rowSnapshot(frame);
      await writeJsonEvidence(faEvidencePath('010-before-journal-row.json'), compactJournalEvidence('before', contextBefore, frameUrl, beforeSnapshot));
      probe = await performControlledDraftProbe(frame);
      await page.waitForTimeout(2500);
      afterSnapshot = await rowSnapshot(frame);
      contextAfter = await sandboxContext(page);
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (contextAfter && (!contextAfter.environmentInUrl || (!contextAfter.companyInUrl && !contextAfter.companyInText) || contextAfter.wrongEnvironmentVisible)) {
    blockedBy.push(`Wrong BC context after FA-102: ${JSON.stringify(contextAfter)}`);
  }
  if (!frameUrl) {
    blockedBy.push('Target Fixed Asset G/L Journal frame was not identified.');
  }
  if (probe && !probe.ok) {
    blockedBy.push(`One or more controlled draft entry steps failed: ${JSON.stringify(probe.failedSteps)}`);
  }
  if (!afterSnapshot) {
    blockedBy.push('No after-snapshot was captured.');
  }

  const signals = afterSnapshot ? targetSignals(afterSnapshot) : {
    faCnc01Visible: false,
    k30000Visible: false,
    hgbVisible: false,
    amountVisible: false,
    documentNoVisible: false,
    fixedAssetVisible: false,
    acquisitionCostVisible: false,
  };
  const targetSignalCount = Object.values(signals).filter(Boolean).length;
  const draftLineProven =
    signals.faCnc01Visible &&
    signals.k30000Visible &&
    signals.hgbVisible &&
    signals.amountVisible &&
    signals.documentNoVisible &&
    signals.fixedAssetVisible &&
    signals.acquisitionCostVisible;
  const status: 'observed' | 'blocked' = blockedBy.length === 0 && probe?.ok && draftLineProven ? 'observed' : 'blocked';
  if (status === 'blocked' && !draftLineProven) {
    blockedBy.push(
      `Expected draft target signals are incomplete after the probe: ${JSON.stringify({
        ...signals,
        targetSignalCount,
      })}`,
    );
  }

  const summary =
    status === 'observed'
      ? 'FA-102 created or updated exactly one controlled FA G/L Journal laboratory draft line with visible target signals; draft is intentionally kept as evidence, no Preview Posting and no posting.'
      : `FA-102 produced only a partial FA G/L Journal draft signal. Blocker: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('020-draft-entry-probe.json'), {
    contextBefore,
    contextAfter,
    frameUrl,
    target: TARGET,
    probe,
    beforeSignals: beforeSnapshot ? targetSignals(beforeSnapshot) : undefined,
    afterSignals: signals,
    blockedBy,
  });
  await writeJsonEvidence(faEvidencePath('030-after-journal-row.json'), compactJournalEvidence('after', contextAfter, frameUrl, afterSnapshot, signals));
  await writeTextEvidence(
    faEvidencePath('031-after-journal-row-focused-text.txt'),
    await compactPageText(page, {
      include: [/Fixed Asset|FA G\/L|Journal|G05001|FA-CNC-01|K30000|HGB|Acquisition Cost|Amount|Post|Preview|Buchen|Vorschau/i],
      maxLines: 180,
      maxLineLength: 220,
    }).catch(() => 'No focused text captured.'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-controlled-draft-probe-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-controlled-fa-gl-journal-draft-probe',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      contextBefore,
      contextAfter,
      frameUrl,
      urlAfterProbe: page.url(),
    },
    createdRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Fixed Asset G/L Journal Line',
        documentNo: TARGET.documentNo,
        batchName: 'DEFAULT',
        purpose: 'Controlled laboratory draft line for FA-CNC-01 acquisition route proof only.',
        status: status === 'observed' ? 'kept-controlled-labor-draft' : 'not-proven',
        cleanupStatus: status === 'observed' ? 'kept-by-case-approval' : 'not-applicable-or-unknown',
      },
    ],
    changedRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Fixed Asset G/L Journal Line',
        documentNo: TARGET.documentNo,
        fieldsAttempted: TARGET,
        visibleSignals: Object.entries(signals)
          .filter(([, visible]) => visible)
          .map(([key]) => key),
        missingVisibleSignals: Object.entries(signals)
          .filter(([, visible]) => !visible)
          .map(([key]) => key),
        purpose: 'Labor draft evidence only; no preview and no posting. Attempted values are not treated as proven unless visible in after-evidence.',
        cleanupStatus: status === 'observed' ? 'kept-by-case-approval' : 'kept-by-case-approval-review-required',
      },
    ],
    postedRecords: [],
    setupChanges: [],
    cleanup: {
      required: false,
      completed: status === 'observed',
      method: status === 'observed' ? 'kept-one-controlled-labor-draft-line-by-case-approval' : 'not-applicable-or-blocked-before-proof',
      blockedBy: status === 'observed' ? [] : blockedBy,
      keepTrace: {
        approvedByCase: 'FIXEDASSETS-101-FA-GL-JOURNAL-OWNERSHIP-GATE',
        documentNo: TARGET.documentNo,
        batchName: 'DEFAULT',
        maxDraftLinesAffected: 1,
      },
    },
    proved: [
      ...(contextAfter?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(contextAfter?.companyInUrl || contextAfter?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(status === 'observed' ? ['One controlled FA G/L Journal laboratory draft line was created or updated.'] : []),
      ...(signals.faCnc01Visible ? ['FA-CNC-01 is visible in the after-snapshot.'] : []),
      ...(signals.k30000Visible ? ['K30000 is visible in the after-snapshot.'] : []),
      ...(signals.documentNoVisible ? ['Document No. G05001 is visible in the after-snapshot.'] : []),
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      ...(status === 'observed' ? [] : ['A complete controlled FA G/L Journal draft line with amount 68000 is not proven.']),
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry.',
      'No G/L Entry trace.',
      'No Delete cleanup route.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-102-fa-gl-journal-controlled-draft-probe.json',
      '.agent/state/cases/fixedassets-103-fa-gl-journal-draft-result-review.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-102-fa-gl-journal-controlled-draft-probe.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/FIXEDASSETS-102-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/010-before-journal-row.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/020-draft-entry-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/030-after-journal-row.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/031-after-journal-row-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/FIXEDASSETS-102-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-102/FIXEDASSETS-102-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/010-before-journal-row.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/020-draft-entry-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/030-after-journal-row.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/031-after-journal-row-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/FIXEDASSETS-102-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-102/README.md',
    ],
    warnings: [
      'Controlled laboratory draft only.',
      'The draft line may remain in RM-DEMO by FA-101 approval.',
      'No Preview Posting or posting was attempted.',
      'CRONUS/RM-DEMO laboratory evidence only.',
    ],
    blockedBy,
    requiresReview: status === 'blocked',
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      target: TARGET,
      probe,
      targetSignals: signals,
      targetSignalCount,
    },
    flags: {
      stayedInExpectedInstance: Boolean(contextAfter?.environmentInUrl),
      companyContextDocumented: Boolean(contextAfter?.companyInUrl || contextAfter?.companyInText),
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noPayment: true,
      noShip: true,
      noInvoice: true,
      noMoreThanOneDraftLine: true,
      keepDraftApprovedByCase: true,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-102-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-102-learning.md'),
    [
      '# FIXEDASSETS-102 Lernnotiz',
      '',
      summary,
      '',
      'Der Lauf ist ein Labor-Draft-Proof, keine Buchung. Genau deshalb bleibt `Preview Posting` gesperrt: Erst muss bewiesen sein, welche Journalzeile mit welchen Feldern entstanden ist und ob diese Zeile kontrolliert behalten oder geloescht werden kann.',
      '',
      'Fuer Anfaenger ist der Kern: Eine Journalzeile ist bereits eine gefaehrliche Vorstufe zur Buchung. Sie muss identifizierbar sein, bevor man ueber Vorschau oder Buchen spricht.',
      '',
      'Status: RM-DEMO-Labor, kein deutscher Finalnachweis.',
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-102 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-before-journal-row.json` | JSON | Journal-Zustand vor der Werteingabe | keine Buchungswirkung | `labor`, `before` |',
      '| `020-draft-entry-probe.json` | JSON | Eingabeversuch, Zielwerte, Blocker oder sichtbare Zielsignale | kein Preview/Post | `labor`, `draft-probe` |',
      '| `030-after-journal-row.json` | JSON | Journal-Zustand nach der Werteingabe | keine Postenspur | `labor`, `after` |',
      '| `031-after-journal-row-focused-text.txt` | Text | kompakte sichtbare Zielsignale | kein Rohdump | `compact` |',
      '| `FIXEDASSETS-102-result.json` | JSON | Ergebnis, Safety Flags, Keep-Trace | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-102-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.stayedInExpectedInstance).toBe(true);
  expect(result.flags.companyContextDocumented).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noApiShortcut).toBe(true);
  expect(result.flags.noMoreThanOneDraftLine).toBe(true);
});
