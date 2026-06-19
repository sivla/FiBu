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

const CASE_ID = 'FIXEDASSETS-110-FA-GL-JOURNAL-AMOUNT-BALACCOUNT-CONTROL-ROUTE-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-111-FA-GL-JOURNAL-CONTROL-ROUTE-DECISION';
const TEST_ID = 'fixedassets-110';
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

async function readFieldRoutes(frame: Frame) {
  return frame.evaluate(async () => {
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
        rowText: norm(row?.innerText || row?.textContent || '').slice(0, 260),
        cellText: norm(cell?.innerText || cell?.textContent || '').slice(0, 160),
      };
    }

    function readVisibleSnapshot(scrollLabel: string) {
      const bodyText = norm(document.body?.innerText || '');
      const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
        .filter((control) => visible(control))
        .map((control, index) => {
          const selectedText =
            control instanceof HTMLSelectElement
              ? [...control.options].find((option) => option.selected)?.text || ''
              : '';
          const context = closestText(control);
          return {
            index,
            scrollLabel,
            tag: control.tagName.toLowerCase(),
            type: control instanceof HTMLInputElement ? norm(control.type) : '',
            value: norm(control.value),
            selectedText: norm(selectedText),
            readOnly: 'readOnly' in control ? Boolean(control.readOnly) : false,
            disabled: Boolean(control.disabled),
            label: controlLabel(control),
            rowText: context.rowText,
            cellText: context.cellText,
            rect: rectOf(control),
          };
        });

      const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
        .filter(visible)
        .map((header, index) => ({
          index,
          scrollLabel,
          text: norm(header.innerText || header.textContent).slice(0, 140),
          rect: rectOf(header),
        }))
        .filter((header) => header.text.length > 0);

      const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
        .filter(visible)
        .map((row, index) => ({
          index,
          scrollLabel,
          text: norm(row.innerText || row.textContent).slice(0, 360),
          rect: rectOf(row),
        }))
        .filter((row) => row.text.length > 0);

      return { bodyText, controls, headers, rows };
    }

    function isTargetControl(control: ReturnType<typeof readVisibleSnapshot>['controls'][number]) {
      return /amount|betrag|bal\. account no|bal account no|bal\. account|gegenkonto|gegenkontonr|account no/i.test(
        `${control.label} ${control.rowText} ${control.cellText} ${control.value} ${control.selectedText}`,
      );
    }

    const scrollables = [...document.querySelectorAll<HTMLElement>('div,section,main')]
      .filter(visible)
      .filter((element) => element.scrollWidth > element.clientWidth + 20)
      .map((element, index) => ({
        index,
        element,
        text: norm(element.innerText || '').slice(0, 180),
        scrollWidth: Math.round(element.scrollWidth),
        clientWidth: Math.round(element.clientWidth),
        originalScrollLeft: Math.round(element.scrollLeft),
        rect: rectOf(element),
      }))
      .filter((candidate) => /Fixed Asset|Posting Date|Document No|Account Type|FA-CNC-01|G05001|Amount|Bal\. Account/i.test(candidate.text))
      .slice(0, 6);

    const snapshots: ReturnType<typeof readVisibleSnapshot>[] = [];
    snapshots.push(readVisibleSnapshot('initial'));

    for (const candidate of scrollables.slice(0, 3)) {
      const positions = [0, Math.floor((candidate.scrollWidth - candidate.clientWidth) / 2), candidate.scrollWidth - candidate.clientWidth]
        .filter((value, index, values) => value >= 0 && values.indexOf(value) === index);
      for (const position of positions) {
        candidate.element.scrollLeft = position;
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        snapshots.push(readVisibleSnapshot(`scrollable-${candidate.index}-left-${Math.round(position)}`));
      }
      candidate.element.scrollLeft = candidate.originalScrollLeft;
    }

    const allControls = snapshots.flatMap((snapshot) => snapshot.controls);
    const allHeaders = snapshots.flatMap((snapshot) => snapshot.headers);
    const allRows = snapshots.flatMap((snapshot) => snapshot.rows);
    const relevantControls = allControls.filter(isTargetControl);
    const exactAmountControls = relevantControls.filter((control) => /\bamount\b|betrag/i.test(`${control.label} ${control.rowText} ${control.cellText}`));
    const exactBalAccountControls = relevantControls.filter((control) =>
      /bal\. account no|bal account no|bal\. account|gegenkonto|gegenkontonr/i.test(`${control.label} ${control.rowText} ${control.cellText}`),
    );
    const combinedText = norm(
      [
        snapshots.map((snapshot) => snapshot.bodyText).join(' '),
        allControls.map((control) => `${control.value} ${control.selectedText} ${control.label}`).join(' '),
        allHeaders.map((header) => header.text).join(' '),
      ].join(' '),
    );

    return {
      pageTitleVisible: /Fixed Asset G\/L Journals/i.test(combinedText),
      targetLineStillVisible: /G05001/i.test(combinedText) && /FA-CNC-01/i.test(combinedText),
      scrollables: scrollables.map(({ element: _element, ...rest }) => rest),
      snapshotCount: snapshots.length,
      routeSignals: {
        amountHeaderVisible: allHeaders.some((header) => /\bamount\b|betrag/i.test(header.text)),
        balAccountNoHeaderVisible: allHeaders.some((header) => /bal\. account no|bal account no|bal\. account|gegenkonto/i.test(header.text)),
        amountControlCandidates: exactAmountControls.length,
        balAccountControlCandidates: exactBalAccountControls.length,
        amount68000Visible: /68[.,]?000|68000/i.test(combinedText),
        k30000Visible: /K30000/i.test(combinedText),
      },
      relevantHeaders: allHeaders
        .filter((header) => /amount|betrag|bal\. account|gegenkonto|account no|posting date|document no/i.test(header.text))
        .slice(0, 40),
      relevantControls: relevantControls.slice(0, 60),
      relevantRows: allRows
        .filter((row) => /G05001|FA-CNC-01|HGB|Amount|Bal\. Account|Account No|Posting Date|Document No|68000|K30000/i.test(row.text))
        .slice(0, 40),
      focusedText: combinedText
        .split(/(?=Fixed Asset G\/L Journals|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|Bal\. Account|Number of Lines|Balance|FA-CNC-01|G05001|K30000|HGB)/i)
        .map((part) => part.trim())
        .filter((part) => /Amount|Bal\. Account|G05001|FA-CNC-01|K30000|HGB|68000|Account No|Balance/i.test(part))
        .slice(0, 35),
    };
  });
}

function statePatch(summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-111-fa-gl-journal-control-route-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-110-fa-gl-journal-amount-balaccount-control-route-readonly.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-111: decide locally whether FA-110 proves enough exact control route evidence for a later guarded write probe.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-gl-journal-amount-balaccount-control-route-readonly',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      resultStatus: 'observed',
      summary,
      nextStep: 'Run FIXEDASSETS-111 local decision before any value entry, Preview Posting or posting.',
    },
    activeCase: {
      status: 'observed-readonly',
      lastResult: {
        status: 'observed',
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-110/FIXEDASSETS-110-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-111 local decision; do not edit, preview or post.',
    },
  };
}

test('FIXEDASSETS-110 maps Amount and Bal. Account No. control routes without changing values', async ({ page }) => {
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let routeMap: Awaited<ReturnType<typeof readFieldRoutes>> | undefined;

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
      routeMap = await readFieldRoutes(frame);
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (!routeMap?.pageTitleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible.');
  }
  if (!routeMap?.targetLineStillVisible) {
    blockedBy.push('Current target-line shell G05001 / FA-CNC-01 was not clearly visible.');
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-110 mapped Amount/Bal. Account routes read-only. Amount header: ${routeMap?.routeSignals.amountHeaderVisible}; Bal. Account header: ${routeMap?.routeSignals.balAccountNoHeaderVisible}; amount candidates: ${routeMap?.routeSignals.amountControlCandidates}; bal-account candidates: ${routeMap?.routeSignals.balAccountControlCandidates}; 68000 visible: ${routeMap?.routeSignals.amount68000Visible}; K30000 visible: ${routeMap?.routeSignals.k30000Visible}.`
      : `FA-110 blocked before route mapping: ${blockedBy.join(' | ')}`;
  const patch = statePatch(summary);

  await writeJsonEvidence(faEvidencePath('010-amount-balaccount-control-routes.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-110-fa-gl-journal-amount-balaccount-control-routes-readonly',
    caseId: CASE_ID,
    context,
    frameUrl,
    routeMap,
    interpretedSignals: {
      targetLineStillVisible: Boolean(routeMap?.targetLineStillVisible),
      amountHeaderVisible: Boolean(routeMap?.routeSignals.amountHeaderVisible),
      balAccountNoHeaderVisible: Boolean(routeMap?.routeSignals.balAccountNoHeaderVisible),
      amountControlCandidates: routeMap?.routeSignals.amountControlCandidates ?? 0,
      balAccountControlCandidates: routeMap?.routeSignals.balAccountControlCandidates ?? 0,
      amount68000AlreadyVisible: Boolean(routeMap?.routeSignals.amount68000Visible),
      k30000AlreadyVisible: Boolean(routeMap?.routeSignals.k30000Visible),
      routeDecisionNeeded: true,
    },
    blockedBy,
    omitted: 'No screenshots, full page text, traces, videos or binaries are stored.',
  });
  await writeTextEvidence(
    faEvidencePath('020-focused-text.txt'),
    ['FIXEDASSETS-110 focused text', '', ...(routeMap?.focusedText ?? ['No focused text captured.'])].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-amount-balaccount-control-route-readonly-result',
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
      ...(routeMap?.targetLineStillVisible ? ['The current FA G/L Journal target-line shell is still visible.'] : []),
      ...(routeMap?.routeSignals.amountHeaderVisible ? ['An Amount header/route signal is visible read-only.'] : []),
      ...(routeMap?.routeSignals.balAccountNoHeaderVisible ? ['A Bal. Account No. header/route signal is visible read-only.'] : []),
      'No value was entered or changed.',
      'No line was inserted or deleted.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      ...(routeMap?.routeSignals.amountControlCandidates ? [] : ['No exact Amount control candidate is proven.']),
      ...(routeMap?.routeSignals.balAccountControlCandidates ? [] : ['No exact Bal. Account No. control candidate is proven.']),
      ...(routeMap?.routeSignals.amount68000Visible ? [] : ['Amount 68000 is not visible as an existing value.']),
      ...(routeMap?.routeSignals.k30000Visible ? [] : ['K30000 is not visible as an existing balancing value.']),
      'No value entry.',
      'No corrected balancing account.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    diagnosisSummary: {
      snapshotCount: routeMap?.snapshotCount ?? 0,
      scrollables: routeMap?.scrollables.length ?? 0,
      routeSignals: routeMap?.routeSignals,
      relevantHeadersCount: routeMap?.relevantHeaders.length ?? 0,
      relevantControlsCount: routeMap?.relevantControls.length ?? 0,
      relevantRowsCount: routeMap?.relevantRows.length ?? 0,
    },
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-110-fa-gl-journal-amount-balaccount-control-route-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-110/FIXEDASSETS-110-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-110/010-amount-balaccount-control-routes.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-110/020-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-110/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-110/FIXEDASSETS-110-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-110/010-amount-balaccount-control-routes.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-110/020-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-110/README.md',
    ],
    warnings: [
      'Read-only route-mapping run.',
      'Do not enter Amount or Bal. Account No. from FA-110 alone; run FA-111 local decision first.',
      'Header visibility is not the same as safe write readiness.',
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-110-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-110 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-amount-balaccount-control-routes.json` | JSON | read-only Feldrouten-/Header-/Control-Signale fuer `Amount` und `Bal. Account No.` | keine Wertkorrektur, kein Screenshot | `labor`, `read-only` |',
      '| `020-focused-text.txt` | Text | kompakte UI-Signale | kein Rohdump | `compact` |',
      '| `FIXEDASSETS-110-result.json` | JSON | Diagnoseergebnis und naechster Decision-Case | keine Buchungswirkung | `labor` |',
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
