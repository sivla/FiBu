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

const CASE_ID = 'FIXEDASSETS-106-FA-GL-JOURNAL-LINE-OWNERSHIP-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-107-FA-GL-JOURNAL-LINE-OWNERSHIP-DECISION';
const TEST_ID = 'fixedassets-106';
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

async function readJournalLineOwnership(frame: Frame) {
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

    const bodyText = norm(document.body?.innerText || '');
    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row, index) => {
        const rect = row.getBoundingClientRect();
        return {
          index,
          text: norm(row.innerText || row.textContent),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      })
      .filter((row) => row.text.length > 0)
      .filter((row) => /Posting Date|Document No\.|Account Type|Amount|Balance|FA-CNC-01|G05001|K30000|HGB|68000|Fixed Asset|Acquisition Cost/i.test(row.text))
      .slice(0, 12);

    const inputs = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select')]
      .filter(visible)
      .map((control, index) => {
        const rect = control.getBoundingClientRect();
        const selectedText =
          control instanceof HTMLSelectElement
            ? [...control.options].find((option) => option.selected)?.text || ''
            : '';
        return {
          index,
          tag: control.tagName.toLowerCase(),
          value: norm(control.value),
          selectedText: norm(selectedText),
          ariaLabel: norm(control.getAttribute('aria-label')),
          title: norm(control.getAttribute('title')),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      })
      .filter((control) => /G05001|FA-CNC-01|K30000|HGB|68000|Fixed Asset|Acquisition Cost|G\/L Account|Bank Account|Vendor/i.test(`${control.value} ${control.selectedText} ${control.ariaLabel} ${control.title}`))
      .slice(0, 20);

    const balanceMatch = bodyText.match(/Number of Lines Balance Total Balance\s+([0-9]+)\s+([0-9.,-]+)\s+([0-9.,-]+)/i);
    const controlText = inputs.map((control) => `${control.value} ${control.selectedText} ${control.title}`).join(' ');
    const combinedText = `${bodyText} ${controlText}`;

    return {
      pageTitleVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
      postVisible: /\bPost\b/i.test(bodyText),
      previewVisible: /Preview Posting|Posting Preview|Vorschau/i.test(bodyText),
      balanceSummary: balanceMatch
        ? {
            numberOfLines: balanceMatch[1],
            balance: balanceMatch[2],
            totalBalance: balanceMatch[3],
          }
        : null,
      targetSignals: {
        g05001Visible: /G05001/i.test(combinedText),
        faCnc01Visible: /FA-CNC-01/i.test(combinedText),
        k30000Visible: /K30000/i.test(combinedText),
        hgbVisible: /\bHGB\b/i.test(combinedText),
        amount68000Visible: /68[.,]?000|68000/i.test(combinedText),
        fixedAssetVisible: /Fixed Asset/i.test(combinedText),
        acquisitionCostVisible: /Acquisition Cost/i.test(combinedText),
        glAccountVisible: /G\/L Account/i.test(combinedText),
        bankAccountVisible: /Bank Account/i.test(combinedText),
      },
      lineOwnership: {
        targetLineLooksVisible: /G05001/i.test(combinedText) && /FA-CNC-01/i.test(combinedText),
        targetAmountLooksVisible: /68[.,]?000|68000/i.test(combinedText),
        balanceLooksZero: /Number of Lines Balance Total Balance\s+1\s+0,00\s+0,00/i.test(bodyText),
      },
      relevantRows: rows,
      relevantControls: inputs,
      focusedText: bodyText
        .split(/(?=Fixed Asset G\/L Journals|Post|Posting Date|Document Type|Document No\.|Account Type|Number of Lines|Balance|FA-CNC-01|G05001|K30000|HGB|68000)/i)
        .map((part) => part.trim())
        .filter((part) => /Fixed Asset|Post|Posting Date|Document No\.|Account Type|Number of Lines|Balance|K30000|FA-CNC-01|HGB|G05001|68000|Acquisition Cost|G\/L Account|Bank Account|Vendor/i.test(part))
        .slice(0, 20),
    };
  });
}

function statePatch(summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-107-fa-gl-journal-line-ownership-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-106-fa-gl-journal-line-ownership-readonly.json',
      nextStep: 'FIXEDASSETS-107: review FA-106 line ownership locally and decide whether cleanup, target-line rebuild or a later guarded balancing probe is next.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-gl-journal-line-ownership-readonly',
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
      nextStep: 'Run FIXEDASSETS-107 local decision before any cleanup, value correction, Preview Posting or posting.',
    },
    activeCase: {
      status: 'observed-readonly',
      lastResult: {
        status: 'observed',
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-106/FIXEDASSETS-106-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-107 local decision; do not preview or post.',
    },
  };
}

test('FIXEDASSETS-106 reads current FA G/L Journal line ownership without changing values', async ({ page }) => {
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let ownership: Awaited<ReturnType<typeof readJournalLineOwnership>> | undefined;

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
      ownership = await readJournalLineOwnership(frame);
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (!ownership?.pageTitleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible.');
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-106 captured current FA G/L Journal line ownership read-only. Target line visible: ${ownership?.lineOwnership.targetLineLooksVisible}; amount visible: ${ownership?.lineOwnership.targetAmountLooksVisible}; balance summary: ${JSON.stringify(ownership?.balanceSummary)}.`
      : `FA-106 blocked before line ownership proof: ${blockedBy.join(' | ')}`;
  const patch = statePatch(summary);

  await writeJsonEvidence(faEvidencePath('010-current-line-ownership.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-106-current-fa-gl-journal-line-ownership',
    caseId: CASE_ID,
    context,
    frameUrl,
    ownership,
    interpretedSignals: {
      targetLineLooksVisible: Boolean(ownership?.lineOwnership.targetLineLooksVisible),
      targetAmountLooksVisible: Boolean(ownership?.lineOwnership.targetAmountLooksVisible),
      balanceLooksZero: Boolean(ownership?.lineOwnership.balanceLooksZero),
      needsLocalDecisionBeforeAnyFix: true,
    },
    blockedBy,
    omitted: 'No screenshots, full page text, traces, videos or binaries are stored.',
  });
  await writeTextEvidence(
    faEvidencePath('020-focused-text.txt'),
    [
      'FIXEDASSETS-106 focused text',
      '',
      ...(ownership?.focusedText ?? ['No focused text captured.']),
    ].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-line-ownership-readonly-result',
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
      urlAfterDiagnosis: page.url(),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(ownership?.balanceSummary ? [`Balance summary is visible: ${JSON.stringify(ownership.balanceSummary)}.`] : []),
      ...(ownership?.targetSignals ? ['Target signal visibility was evaluated read-only.'] : []),
      'No value correction was made.',
      'No line was inserted or deleted.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      ...(ownership?.lineOwnership.targetLineLooksVisible ? [] : ['Current visible line is not proven to be the FA-102 target line G05001 / FA-CNC-01.']),
      ...(ownership?.lineOwnership.targetAmountLooksVisible ? [] : ['Amount 68000 is not visible.']),
      'No corrected balancing account.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    diagnosisSummary: {
      balanceSummary: ownership?.balanceSummary ?? null,
      targetSignals: ownership?.targetSignals,
      lineOwnership: ownership?.lineOwnership,
      relevantRowsCount: ownership?.relevantRows.length ?? 0,
      relevantControlsCount: ownership?.relevantControls.length ?? 0,
    },
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-106-fa-gl-journal-line-ownership-readonly.json',
      '.agent/state/cases/fixedassets-107-fa-gl-journal-line-ownership-decision.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-106-fa-gl-journal-line-ownership-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-106/FIXEDASSETS-106-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-106/010-current-line-ownership.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-106/020-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-106/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-106/FIXEDASSETS-106-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-106/010-current-line-ownership.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-106/020-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-106/README.md',
    ],
    warnings: [
      'Read-only diagnostic run.',
      'Do not unlock Preview Posting or posting from FA-106 alone.',
      'If target line and amount are not visible, decide cleanup or rebuild locally before changing values.',
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-106-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-106 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-current-line-ownership.json` | JSON | aktuelle Zeilen-/Balance-Signale | keine Wertkorrektur | `labor`, `read-only` |',
      '| `020-focused-text.txt` | Text | kompakte UI-Signale | kein Screenshot, kein Rohdump | `compact` |',
      '| `FIXEDASSETS-106-result.json` | JSON | Diagnoseergebnis und naechster Decision-Case | keine Buchungswirkung | `labor` |',
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
