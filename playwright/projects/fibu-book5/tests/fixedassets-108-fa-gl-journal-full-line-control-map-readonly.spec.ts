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

const CASE_ID = 'FIXEDASSETS-108-FA-GL-JOURNAL-FULL-LINE-CONTROL-MAP-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-109-FA-GL-JOURNAL-WRITE-READINESS-DECISION';
const TEST_ID = 'fixedassets-108';
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

async function readFullLineControlMap(frame: Frame) {
  return frame.evaluate(() => {
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

    function labelNear(element: HTMLElement) {
      const aria = norm(element.getAttribute('aria-label'));
      const title = norm(element.getAttribute('title'));
      const describedBy = norm(element.getAttribute('aria-describedby'));
      const labelledBy = norm(element.getAttribute('aria-labelledby'));
      const placeholder = norm(element.getAttribute('placeholder'));
      const name = norm(element.getAttribute('name'));
      const id = norm(element.getAttribute('id'));
      return { aria, title, describedBy, labelledBy, placeholder, name, id };
    }

    const bodyText = norm(document.body?.innerText || '');
    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
      .filter((control) => visible(control))
      .map((control, index) => {
        const selectedText =
          control instanceof HTMLSelectElement
            ? [...control.options].find((option) => option.selected)?.text || ''
            : '';
        return {
          index,
          tag: control.tagName.toLowerCase(),
          type: control instanceof HTMLInputElement ? norm(control.type) : '',
          value: norm(control.value),
          selectedText: norm(selectedText),
          readOnly: 'readOnly' in control ? Boolean(control.readOnly) : false,
          disabled: Boolean(control.disabled),
          labels: labelNear(control),
          rect: rectOf(control),
        };
      });

    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row, index) => ({
        index,
        text: norm(row.innerText || row.textContent),
        rect: rectOf(row),
      }))
      .filter((row) => row.text.length > 0)
      .slice(0, 35);

    const scrollables = [...document.querySelectorAll<HTMLElement>('div,section,main')]
      .filter(visible)
      .map((element, index) => ({
        index,
        text: norm(element.innerText || '').slice(0, 160),
        scrollLeft: Math.round(element.scrollLeft),
        scrollWidth: Math.round(element.scrollWidth),
        clientWidth: Math.round(element.clientWidth),
        rect: rectOf(element),
      }))
      .filter((entry) => entry.scrollWidth > entry.clientWidth + 20)
      .slice(0, 12);

    const controlText = controls
      .map((control) => `${control.value} ${control.selectedText} ${Object.values(control.labels).join(' ')}`)
      .join(' ');
    const combinedText = `${bodyText} ${controlText}`;
    const amountLikeControls = controls.filter((control) =>
      /amount|betrag|debit|credit|balance|bal\. account|gegenkonto|account no\.|konto/i.test(
        `${control.value} ${control.selectedText} ${Object.values(control.labels).join(' ')}`,
      ),
    );

    const targetControlMap = {
      g05001: controls.filter((control) => /G05001/i.test(`${control.value} ${control.selectedText}`)),
      faCnc01: controls.filter((control) => /FA-CNC-01/i.test(`${control.value} ${control.selectedText}`)),
      hgb: controls.filter((control) => /\bHGB\b/i.test(`${control.value} ${control.selectedText}`)),
      k30000: controls.filter((control) => /K30000/i.test(`${control.value} ${control.selectedText}`)),
      amount68000: controls.filter((control) => /68[.,]?000|68000/i.test(`${control.value} ${control.selectedText}`)),
      amountOrBalanceCandidates: amountLikeControls,
    };

    return {
      pageTitleVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
      bodySignals: {
        postVisible: /\bPost\b/i.test(bodyText),
        previewVisible: /Preview Posting|Posting Preview|Vorschau/i.test(bodyText),
        numberOfLinesBalanceVisible: /Number of Lines Balance Total Balance/i.test(bodyText),
      },
      targetSignals: {
        g05001Visible: /G05001/i.test(combinedText),
        faCnc01Visible: /FA-CNC-01/i.test(combinedText),
        hgbVisible: /\bHGB\b/i.test(combinedText),
        k30000Visible: /K30000/i.test(combinedText),
        amount68000Visible: /68[.,]?000|68000/i.test(combinedText),
        balAccountNoReachableByLabel: /Bal\. Account No\.|Bal Account No|Gegenkontonr|Gegenkonto Nr/i.test(combinedText),
        amountReachableByLabel: /\bAmount\b|Betrag/i.test(combinedText),
      },
      controlsTotal: controls.length,
      rowsTotal: rows.length,
      horizontalScrollCandidates: scrollables,
      targetControlMap,
      relevantRows: rows.filter((row) =>
        /Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|Bal\. Account|Balance|FA-CNC-01|G05001|K30000|HGB|Fixed Asset|Acquisition Cost/i.test(
          row.text,
        ),
      ),
      focusedText: bodyText
        .split(/(?=Fixed Asset G\/L Journals|Posting Date|Document Type|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|Bal\. Account|Number of Lines|Balance|FA-CNC-01|G05001|K30000|HGB|Acquisition Cost)/i)
        .map((part) => part.trim())
        .filter((part) =>
          /Fixed Asset|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|Bal\. Account|Number of Lines|Balance|K30000|FA-CNC-01|HGB|G05001|68000|Acquisition Cost/i.test(
            part,
          ),
        )
        .slice(0, 30),
    };
  });
}

function statePatch(summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-109-fa-gl-journal-write-readiness-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-108-fa-gl-journal-full-line-control-map-readonly.json',
      nextStep:
        'FIXEDASSETS-109: decide locally whether the FA G/L Journal target-line controls are sufficient for a guarded write-case or whether another read-only field route is needed.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-gl-journal-full-line-control-map-readonly',
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
      nextStep: 'Run FIXEDASSETS-109 local write-readiness decision before any value entry, Preview Posting or posting.',
    },
    activeCase: {
      status: 'observed-readonly',
      lastResult: {
        status: 'observed',
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-108/FIXEDASSETS-108-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-109 local decision; do not edit, preview or post.',
    },
  };
}

test('FIXEDASSETS-108 maps current FA G/L Journal line controls without changing values', async ({ page }) => {
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let controlMap: Awaited<ReturnType<typeof readFullLineControlMap>> | undefined;

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
      controlMap = await readFullLineControlMap(frame);
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (!controlMap?.pageTitleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible.');
  }
  if (!controlMap?.targetSignals.g05001Visible || !controlMap?.targetSignals.faCnc01Visible) {
    blockedBy.push('Current target-line shell G05001 / FA-CNC-01 was not clearly visible.');
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-108 mapped current FA G/L Journal controls read-only. Amount label reachable: ${controlMap?.targetSignals.amountReachableByLabel}; Bal. Account No. label reachable: ${controlMap?.targetSignals.balAccountNoReachableByLabel}; 68000 visible: ${controlMap?.targetSignals.amount68000Visible}; K30000 visible: ${controlMap?.targetSignals.k30000Visible}.`
      : `FA-108 blocked before full control map: ${blockedBy.join(' | ')}`;
  const patch = statePatch(summary);

  await writeJsonEvidence(faEvidencePath('010-full-line-control-map.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-108-fa-gl-journal-full-line-control-map-readonly',
    caseId: CASE_ID,
    context,
    frameUrl,
    controlMap,
    interpretedSignals: {
      targetLineShellVisible: Boolean(controlMap?.targetSignals.g05001Visible && controlMap?.targetSignals.faCnc01Visible),
      amountLabelReachable: Boolean(controlMap?.targetSignals.amountReachableByLabel),
      balAccountNoLabelReachable: Boolean(controlMap?.targetSignals.balAccountNoReachableByLabel),
      amount68000AlreadyVisible: Boolean(controlMap?.targetSignals.amount68000Visible),
      k30000AlreadyVisible: Boolean(controlMap?.targetSignals.k30000Visible),
      horizontalScrollCandidatesFound: (controlMap?.horizontalScrollCandidates.length ?? 0) > 0,
    },
    blockedBy,
    omitted: 'No screenshots, full page text, traces, videos or binaries are stored.',
  });
  await writeTextEvidence(
    faEvidencePath('020-focused-text.txt'),
    ['FIXEDASSETS-108 focused text', '', ...(controlMap?.focusedText ?? ['No focused text captured.'])].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-full-line-control-map-readonly-result',
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
      ...(controlMap?.targetSignals.g05001Visible && controlMap.targetSignals.faCnc01Visible
        ? ['The current FA G/L Journal target-line shell is still visible with G05001 and FA-CNC-01.']
        : []),
      ...(controlMap?.targetSignals.amountReachableByLabel ? ['An Amount-labelled control/text signal is reachable read-only.'] : []),
      ...(controlMap?.targetSignals.balAccountNoReachableByLabel
        ? ['A Bal. Account No.-labelled control/text signal is reachable read-only.']
        : []),
      'No value was entered or changed.',
      'No line was inserted or deleted.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      ...(controlMap?.targetSignals.amount68000Visible ? [] : ['Amount 68000 is not visible as an existing value.']),
      ...(controlMap?.targetSignals.k30000Visible ? [] : ['K30000 is not visible as an existing balancing value.']),
      ...(controlMap?.targetSignals.amountReachableByLabel ? [] : ['Amount control route is not proven.']),
      ...(controlMap?.targetSignals.balAccountNoReachableByLabel ? [] : ['Bal. Account No. control route is not proven.']),
      'No corrected balancing account.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    diagnosisSummary: {
      controlsTotal: controlMap?.controlsTotal ?? 0,
      rowsTotal: controlMap?.rowsTotal ?? 0,
      horizontalScrollCandidates: controlMap?.horizontalScrollCandidates.length ?? 0,
      targetSignals: controlMap?.targetSignals,
      targetControlCounts: {
        g05001: controlMap?.targetControlMap.g05001.length ?? 0,
        faCnc01: controlMap?.targetControlMap.faCnc01.length ?? 0,
        hgb: controlMap?.targetControlMap.hgb.length ?? 0,
        k30000: controlMap?.targetControlMap.k30000.length ?? 0,
        amount68000: controlMap?.targetControlMap.amount68000.length ?? 0,
        amountOrBalanceCandidates: controlMap?.targetControlMap.amountOrBalanceCandidates.length ?? 0,
      },
    },
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-108-fa-gl-journal-full-line-control-map-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-108/FIXEDASSETS-108-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-108/010-full-line-control-map.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-108/020-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-108/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-108/FIXEDASSETS-108-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-108/010-full-line-control-map.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-108/020-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-108/README.md',
    ],
    warnings: [
      'Read-only diagnostic run.',
      'Do not enter Amount or Bal. Account No. from FA-108 alone; run FA-109 local decision first.',
      'Visible Post/Preview action text does not mean it was clicked.',
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-108-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-108 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-full-line-control-map.json` | JSON | sichtbare Controls/Zeilen der aktuellen FA-G/L-Journalzeile | keine Wertkorrektur, kein Screenshot | `labor`, `read-only` |',
      '| `020-focused-text.txt` | Text | kompakte UI-Signale fuer Amount/Bal. Account No. | kein Rohdump | `compact` |',
      '| `FIXEDASSETS-108-result.json` | JSON | Diagnoseergebnis und naechster Decision-Case | keine Buchungswirkung | `labor` |',
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
