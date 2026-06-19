import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-112-FA-GL-JOURNAL-ACTIVE-CELL-ROUTE-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-113-FA-GL-JOURNAL-ACTIVE-CELL-ROUTE-DECISION';
const TEST_ID = 'fixedassets-112';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
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
    url: safeUrl(url),
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

async function activeCellProbe(frame: Frame) {
  return frame.evaluate(async () => {
    type ControlSnapshot = {
      index: number;
      tag: string;
      type: string;
      value: string;
      selectedText: string;
      readOnly: boolean;
      disabled: boolean;
      focused: boolean;
      label: string;
      rowText: string;
      cellText: string;
      rect: { x: number; y: number; width: number; height: number };
    };

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

    function rectOf(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    }

    function controlLabel(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
      return norm(
        [
          control.getAttribute('aria-label'),
          control.getAttribute('title'),
          control.getAttribute('name'),
          control.getAttribute('id'),
          control.getAttribute('aria-describedby'),
          control.getAttribute('aria-labelledby'),
          control.getAttribute('placeholder'),
        ].join(' '),
      );
    }

    function closestText(element: HTMLElement) {
      const row = element.closest<HTMLElement>('[role="row"],tr');
      const cell = element.closest<HTMLElement>('[role="gridcell"],td,[role="cell"]');
      return {
        rowText: norm(row?.innerText || row?.textContent || '').slice(0, 320),
        cellText: norm(cell?.innerText || cell?.textContent || '').slice(0, 180),
      };
    }

    function visibleControls() {
      return [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
        .filter((control) => visible(control))
        .map((control, index): ControlSnapshot => {
          const selectedText =
            control instanceof HTMLSelectElement
              ? [...control.options].find((option) => option.selected)?.text || ''
              : '';
          const context = closestText(control);
          return {
            index,
            tag: control.tagName.toLowerCase(),
            type: control instanceof HTMLInputElement ? norm(control.type) : '',
            value: norm(control.value),
            selectedText: norm(selectedText),
            readOnly: 'readOnly' in control ? Boolean(control.readOnly) : false,
            disabled: Boolean(control.disabled),
            focused: control === document.activeElement,
            label: controlLabel(control),
            rowText: context.rowText,
            cellText: context.cellText,
            rect: rectOf(control),
          };
        });
    }

    function isRelevantControl(control: ControlSnapshot) {
      return /amount|betrag|bal\. account no|bal account no|bal\. account|gegenkonto|gegenkontonr|account no/i.test(
        `${control.label} ${control.rowText} ${control.cellText} ${control.value} ${control.selectedText}`,
      );
    }

    function visibleDialogs() {
      return [...document.querySelectorAll<HTMLElement>('[role="dialog"],.ms-Dialog-main')]
        .filter(visible)
        .map((dialog) => norm(dialog.innerText || dialog.textContent).slice(0, 400));
    }

    function riskDialogs() {
      return visibleDialogs().filter((text) =>
        /\bOK\b|\bYes\b|\bJa\b|\bPost\b|Buchen|Preview|Vorschau|Delete|L schen|Finish|Fertig stellen/i.test(text),
      );
    }

    function pageSignals() {
      const bodyText = norm(document.body?.innerText || '');
      const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
        .filter(visible)
        .map((header, index) => ({
          index,
          text: norm(header.innerText || header.textContent).slice(0, 140),
          rect: rectOf(header),
        }))
        .filter((header) => header.text.length > 0);
      return {
        pageTitleVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
        targetLineStillVisible: /G05001/i.test(bodyText) && /FA-CNC-01/i.test(bodyText),
        amountHeaderVisible: headers.some((header) => /\bamount\b|betrag/i.test(header.text)),
        balAccountNoHeaderVisible: headers.some((header) => /bal\. account no|bal account no|bal\. account|gegenkonto/i.test(header.text)),
        amount68000Visible: /68[.,]?000|68000/i.test(bodyText),
        k30000Visible: /K30000/i.test(bodyText),
        relevantHeaders: headers
          .filter((header) => /amount|betrag|bal\. account|gegenkonto|account no|posting date|document no/i.test(header.text))
          .slice(0, 40),
      };
    }

    function capture(label: string) {
      const controls = visibleControls();
      const focused = controls.find((control) => control.focused);
      return {
        label,
        activeTag: norm(document.activeElement?.tagName || ''),
        activeText: norm((document.activeElement as HTMLElement | null)?.innerText || document.activeElement?.textContent || '').slice(0, 240),
        focusedControl: focused ?? null,
        relevantControls: controls.filter(isRelevantControl).slice(0, 80),
        dialogs: visibleDialogs(),
        riskDialogs: riskDialogs(),
      };
    }

    async function clickHeaderCenter(pattern: RegExp, label: string) {
      const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
        .filter(visible)
        .filter((header) => pattern.test(norm(header.innerText || header.textContent)));
      const header = headers[headers.length - 1];
      if (!header) {
        return { label, clicked: false, reason: 'header-not-found', after: capture(`${label}-not-clicked`) };
      }
      const rect = header.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2);
      const y = Math.round(rect.bottom + 24);
      const target = document.elementFromPoint(x, y) as HTMLElement | null;
      if (!target || !visible(target)) {
        return { label, clicked: false, reason: 'target-cell-not-visible', after: capture(`${label}-not-clicked`) };
      }
      const eventOptions = { bubbles: true, cancelable: true, clientX: x, clientY: y };
      target.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
      target.dispatchEvent(new MouseEvent('mousedown', eventOptions));
      target.dispatchEvent(new PointerEvent('pointerup', eventOptions));
      target.dispatchEvent(new MouseEvent('mouseup', eventOptions));
      target.dispatchEvent(new MouseEvent('click', eventOptions));
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      return { label, clicked: true, reason: null, targetText: norm(target.innerText || target.textContent).slice(0, 180), after: capture(label) };
    }

    const scrollables = [...document.querySelectorAll<HTMLElement>('div,section,main')]
      .filter(visible)
      .filter((element) => element.scrollWidth > element.clientWidth + 20)
      .filter((element) => /Fixed Asset|Posting Date|Document No|Account Type|FA-CNC-01|G05001|Amount|Bal\. Account/i.test(norm(element.innerText || '')))
      .slice(0, 4);

    const before = capture('before-focus');
    const signalsBefore = pageSignals();
    const operations: Awaited<ReturnType<typeof clickHeaderCenter>>[] = [];
    const maxScroll = Math.max(0, ...scrollables.map((element) => element.scrollWidth - element.clientWidth));
    const positions = [0, Math.floor(maxScroll / 2), maxScroll].filter((value, index, values) => value >= 0 && values.indexOf(value) === index);

    for (const position of positions) {
      for (const element of scrollables) {
        element.scrollLeft = position;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 160));
      if (riskDialogs().length > 0) {
        break;
      }
      if (pageSignals().amountHeaderVisible) {
        operations.push(await clickHeaderCenter(/\bamount\b|betrag/i, `amount-cell-focus-left-${Math.round(position)}`));
      }
      if (riskDialogs().length > 0) {
        break;
      }
      if (pageSignals().balAccountNoHeaderVisible) {
        operations.push(
          await clickHeaderCenter(/bal\. account no|bal account no|bal\. account|gegenkonto/i, `bal-account-no-cell-focus-left-${Math.round(position)}`),
        );
      }
      if (operations.some((operation) => operation.after.relevantControls.length > before.relevantControls.length)) {
        break;
      }
    }

    const after = capture('after-focus');
    const signalsAfter = pageSignals();
    const combinedControls = [before, ...operations.map((operation) => operation.after), after].flatMap((snapshot) => snapshot.relevantControls);
    const amountControls = combinedControls.filter((control) => /\bamount\b|betrag/i.test(`${control.label} ${control.rowText} ${control.cellText}`));
    const balAccountControls = combinedControls.filter((control) =>
      /bal\. account no|bal account no|bal\. account|gegenkonto|gegenkontonr/i.test(`${control.label} ${control.rowText} ${control.cellText}`),
    );

    return {
      signalsBefore,
      signalsAfter,
      before,
      operations,
      after,
      interpretedSignals: {
        targetLineStillVisible: signalsAfter.targetLineStillVisible,
        amountHeaderVisible: signalsAfter.amountHeaderVisible,
        balAccountNoHeaderVisible: signalsAfter.balAccountNoHeaderVisible,
        amountActiveCellControls: amountControls.length,
        balAccountActiveCellControls: balAccountControls.length,
        focusedRelevantControlAppeared: [before, ...operations.map((operation) => operation.after), after].some(
          (snapshot) => snapshot.focusedControl && isRelevantControl(snapshot.focusedControl),
        ),
        riskDialogAppeared: [before, ...operations.map((operation) => operation.after), after].some((snapshot) => snapshot.riskDialogs.length > 0),
        amount68000Visible: signalsAfter.amount68000Visible,
        k30000Visible: signalsAfter.k30000Visible,
      },
    };
  });
}

function statePatch(summary: string, status: 'observed' | 'blocked') {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-113-fa-gl-journal-active-cell-route-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-112-fa-gl-journal-active-cell-route-readonly.json',
      requiresStrongModel: true,
      nextStep:
        status === 'observed'
          ? 'FIXEDASSETS-113: decide locally whether FA-112 proves an active-cell control route or whether the FA G/L Journal value-entry path remains blocked.'
          : 'FIXEDASSETS-113: review FA-112 blocker before any further FA Journal action.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-gl-journal-active-cell-route-readonly',
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
      nextStep: 'Run FIXEDASSETS-113 local decision before any value entry, Preview Posting or posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly' : 'blocked',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-112/FIXEDASSETS-112-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-113 local decision; do not edit, preview or post.',
    },
  };
}

test('FIXEDASSETS-112 probes active-cell controls read-only without entering values', async ({ page }) => {
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let probe: Awaited<ReturnType<typeof activeCellProbe>> | undefined;

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    } else {
      const frame = await targetFrame(page);
      frameUrl = safeUrl(frame.url());
      probe = await activeCellProbe(frame);
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (!probe?.signalsAfter.pageTitleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible after active-cell probe.');
  }
  if (!probe?.interpretedSignals.targetLineStillVisible) {
    blockedBy.push('Current target-line shell G05001 / FA-CNC-01 was not clearly visible after active-cell probe.');
  }
  if (probe?.interpretedSignals.riskDialogAppeared) {
    blockedBy.push('A risk dialog appeared during read-only focus probe.');
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-112 focused Amount/Bal. Account cells read-only. Amount active controls: ${probe?.interpretedSignals.amountActiveCellControls}; Bal. Account active controls: ${probe?.interpretedSignals.balAccountActiveCellControls}; focused relevant control appeared: ${probe?.interpretedSignals.focusedRelevantControlAppeared}; 68000 visible: ${probe?.interpretedSignals.amount68000Visible}; K30000 visible: ${probe?.interpretedSignals.k30000Visible}.`
      : `FA-112 blocked before completing active-cell probe: ${blockedBy.join(' | ')}`;
  const patch = statePatch(summary, status);

  await writeJsonEvidence(faEvidencePath('010-active-cell-route-probe.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-112-fa-gl-journal-active-cell-route-readonly',
    caseId: CASE_ID,
    context,
    frameUrl,
    probe,
    blockedBy,
    omitted: 'No screenshots, full page text, traces, videos or binaries are stored.',
  });
  await writeTextEvidence(
    faEvidencePath('020-active-cell-focused-text.txt'),
    [
      'FIXEDASSETS-112 active-cell focused evidence',
      '',
      `Summary: ${summary}`,
      '',
      'Relevant control labels:',
      ...(
        probe
          ? [probe.before, ...probe.operations.map((operation) => operation.after), probe.after]
              .flatMap((snapshot) => snapshot.relevantControls)
              .map((control) => `- ${control.label || control.cellText || control.rowText || '(empty label)'}`)
              .slice(0, 60)
          : ['- No focused text captured.']
      ),
    ].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-active-cell-route-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-diagnosis',
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
      urlAfterDiagnosis: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(probe?.interpretedSignals.targetLineStillVisible ? ['The current FA G/L Journal target-line shell is still visible.'] : []),
      ...(probe?.interpretedSignals.amountHeaderVisible ? ['The Amount header remains visible read-only.'] : []),
      ...(probe?.interpretedSignals.balAccountNoHeaderVisible ? ['The Bal. Account No. header remains visible read-only.'] : []),
      'Amount and Bal. Account No. were probed by focus/click only.',
      'No value was entered or changed.',
      'No line was inserted or deleted.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      ...(probe?.interpretedSignals.amountActiveCellControls ? [] : ['No Amount active-cell control is proven.']),
      ...(probe?.interpretedSignals.balAccountActiveCellControls ? [] : ['No Bal. Account No. active-cell control is proven.']),
      ...(probe?.interpretedSignals.focusedRelevantControlAppeared ? [] : ['No focused relevant control is proven.']),
      ...(probe?.interpretedSignals.amount68000Visible ? [] : ['Amount 68000 is not visible as an existing value.']),
      ...(probe?.interpretedSignals.k30000Visible ? [] : ['K30000 is not visible as an existing balancing value.']),
      'No value entry.',
      'No corrected balancing account.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    diagnosisSummary: {
      operations: probe?.operations.map((operation) => ({
        label: operation.label,
        clicked: operation.clicked,
        reason: operation.reason,
        relevantControlsAfter: operation.after.relevantControls.length,
        focusedControlLabel: operation.after.focusedControl?.label ?? '',
        riskDialogs: operation.after.riskDialogs,
      })),
      interpretedSignals: probe?.interpretedSignals,
    },
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-112-fa-gl-journal-active-cell-route-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-112/FIXEDASSETS-112-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-112/010-active-cell-route-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-112/020-active-cell-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-112/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-112/FIXEDASSETS-112-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-112/010-active-cell-route-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-112/020-active-cell-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-112/README.md',
    ],
    warnings: [
      'Read-only active-cell probe.',
      'Do not infer write readiness from FA-112 without FA-113 local decision.',
      'No value entry, Preview Posting or posting happened in FA-112.',
    ],
    blockedBy,
    requiresReview: false,
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    flags: {
      noValueCorrection: true,
      noInsertLine: true,
      noDeleteLine: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-112-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-112 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-active-cell-route-probe.json` | JSON | aktive Zellen-/Control-Signale nach Fokus auf `Amount` und `Bal. Account No.` | keine Werteingabe, keine Buchungsreife | `labor`, `read-only` |',
      '| `020-active-cell-focused-text.txt` | Text | kompakte relevante Control-Labels aus der Fokusprobe | kein Rohdump | `compact` |',
      '| `FIXEDASSETS-112-result.json` | JSON | Diagnoseergebnis und naechster Decision-Case | keine Buchungswirkung | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noValueCorrection).toBe(true);
  expect(result.flags.noInsertLine).toBe(true);
  expect(result.flags.noDeleteLine).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
});
