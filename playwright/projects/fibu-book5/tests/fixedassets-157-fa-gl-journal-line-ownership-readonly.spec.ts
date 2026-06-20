import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-157-FA-GL-JOURNAL-LINE-OWNERSHIP-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-158-FA-GL-JOURNAL-LINE-OWNERSHIP-DECISION';
const TEST_ID = 'fixedassets-157';
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

function evidenceText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`);
}

async function readLineOwnership(page: Page) {
  const frame = page.frames().find(isTargetFrame) ?? page.mainFrame();
  const frameUrl = safeUrl(frame.url());
  const result = await frame.evaluate(() => {
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

    const bodyText = norm(document.body?.innerText || '');
    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row, index) => ({
        index,
        text: norm(row.innerText || row.textContent),
        rect: rectOf(row),
      }))
      .filter((row) => row.text)
      .filter((row) =>
        /Fixed Asset G\/L Journals|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Fixed Asset No\.|Depreciation Book|Amount|Bal\. Account|Number of Lines|Balance|G05001|FA-CNC-01|HGB|Acquisition Cost|G\/L Account|Bank Account|Vendor|K30000|68000/i.test(
          row.text,
        ),
      )
      .slice(0, 40);

    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
      .filter(visible)
      .map((control, index) => {
        const selectedText = control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || '' : '';
        return {
          index,
          tag: control.tagName.toLowerCase(),
          value: norm(control.value),
          selectedText: norm(selectedText),
          ariaLabel: norm(control.getAttribute('aria-label')),
          title: norm(control.getAttribute('title')),
          readonly: control.hasAttribute('readonly') || control.getAttribute('aria-readonly') === 'true',
          disabled: control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true',
          rect: rectOf(control),
        };
      })
      .filter((control) =>
        /G05001|FA-CNC-01|K30000|HGB|68000|68[.,]000|Fixed Asset|Acquisition Cost|G\/L Account|Bank Account|Vendor|Amount|Bal\. Account|Account No/i.test(
          `${control.value} ${control.selectedText} ${control.ariaLabel} ${control.title}`,
        ),
      )
      .slice(0, 50);

    const combinedText = `${bodyText} ${controls
      .map((control) => `${control.value} ${control.selectedText} ${control.ariaLabel} ${control.title}`)
      .join(' ')}`;
    const balanceMatch = bodyText.match(/Number of Lines Balance Total Balance\s+([0-9]+)\s+([0-9.,-]+)\s+([0-9.,-]+)/i);

    return {
      bodyText,
      rows,
      controls,
      pageSignals: {
        titleVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
        postVisible: /\bPost\b/i.test(bodyText),
        previewVisible: /Preview Posting|Posting Preview|Vorschau/i.test(bodyText),
      },
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
    };
  });

  const focusedText = evidenceText(result.bodyText)
    .split(/(?=Fixed Asset G\/L Journals|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Fixed Asset No\.|Depreciation Book|Amount|Bal\. Account|Number of Lines|Balance|Post|Preview|G05001|FA-CNC-01|HGB|Acquisition Cost|G\/L Account|Bank Account|Vendor|K30000|68000)/i)
    .map((part) => part.trim())
    .filter((part) => /Fixed Asset|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Amount|Balance|Post|Preview|G05001|FA-CNC-01|HGB|Acquisition Cost|G\/L Account|Bank Account|Vendor|K30000|68000/i.test(part))
    .slice(0, 40)
    .join('\n');

  return {
    frameUrl,
    targetFrameFound: page.frames().some(isTargetFrame),
    ...result,
    focusedText,
    interpretedOwnership: {
      existingLineCount: result.balanceSummary?.numberOfLines ?? null,
      targetLineLooksVisible: result.targetSignals.g05001Visible && result.targetSignals.faCnc01Visible,
      targetAmountLooksVisible: result.targetSignals.amount68000Visible,
      lineNeedsDecisionBeforeWrite: true,
      cleanupPerformed: false,
      keepDraftApproved: false,
    },
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-158-fa-gl-journal-line-ownership-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-157-fa-gl-journal-line-ownership-readonly.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-158: review FA-157 line ownership locally and decide whether the existing line can be kept, needs cleanup, or must be rebuilt before any value entry.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-gl-journal-line-ownership-readonly',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      playwrightRun: true,
      posted: false,
      previewPosting: false,
      setupChanged: false,
      companySwitched: false,
      apiShortcut: false,
      bookChanged: false,
      resultStatus: status,
      summary,
      nextStep: 'Run FIXEDASSETS-158 local decision before cleanup, value entry, Preview Posting or posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly' : 'blocked-readonly',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-157/FIXEDASSETS-157-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-158 local decision; do not enter values, cleanup, preview or post.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: 'fa-gl-journal-line-ownership-decision',
          latestPracticalCase: 'FIXEDASSETS-157',
          latestReviewCase: 'FIXEDASSETS-156',
          nextCase: NEXT_CASE_ID,
        },
      },
    },
  };
}

test('FIXEDASSETS-157 reads FA G/L Journal line ownership without changing values', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let ownership: Awaited<ReturnType<typeof readLineOwnership>> | undefined;
  let compactContext = '';
  let screenshotCaptured = false;

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
      ownership = await readLineOwnership(page);
      compactContext = await compactPageText(page, {
        include: [
          /Fixed Asset G\/L Journals|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Fixed Asset No\.|Depreciation Book|Amount|Bal\. Account/i,
          /Number of Lines|Balance|Total Balance|Post|Preview|G05001|FA-CNC-01|HGB|Acquisition Cost|G\/L Account|Bank Account|Vendor|K30000|68000/i,
        ],
        maxLines: 220,
        maxLineLength: 260,
      });
      await screenshot(page, 'fixedassets-157-010-fa-gl-journal-line-ownership-readonly.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: 'labor',
        bookUse: 'diagnostic',
        purpose:
          'Read-only Nachweis der aktuellen Zeilensituation im Fixed Asset G/L Journal. Das Bild soll zeigen, ob vor Werteingabe eine vorhandene Laborzeile oder ein leerer Zeilenkontext zu klaeren ist.',
        expectedPageText: [/Fixed Asset G\/L Journals/i],
        knownLimitations: [
          'Keine Werteingabe.',
          'Keine Journalzeile angelegt oder geloescht.',
          'Keine Preview Posting.',
          'Keine Buchung.',
          'Kein deutscher Finalnachweis.',
        ],
      });
      screenshotCaptured = true;
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (!ownership?.pageSignals.titleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible.');
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-157 captured current FA G/L Journal line ownership read-only. Existing lines: ${ownership?.balanceSummary?.numberOfLines ?? 'unknown'}; target line visible: ${ownership?.interpretedOwnership.targetLineLooksVisible}; amount 68000 visible: ${ownership?.interpretedOwnership.targetAmountLooksVisible}.`
      : `FA-157 blocked before line ownership proof: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeTextEvidence(faEvidencePath('010-fa-gl-journal-line-ownership-context.txt'), compactContext || 'No compact FA G/L Journal context captured.');
  await writeTextEvidence(faEvidencePath('020-focused-line-ownership-text.txt'), ownership?.focusedText || 'No focused line ownership text captured.');
  await writeJsonEvidence(faEvidencePath('030-line-ownership-signals.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-157-fa-gl-journal-line-ownership-signals',
    caseId: CASE_ID,
    context,
    ownership,
    screenshotCaptured,
    blockedBy,
  });

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
      frameUrl: ownership?.frameUrl ?? '',
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(ownership?.balanceSummary ? [`Balance summary is visible: ${JSON.stringify(ownership.balanceSummary)}.`] : []),
      ...(ownership?.targetSignals ? ['Target line signals were evaluated read-only.'] : []),
      ...(screenshotCaptured ? ['A line ownership diagnostic screenshot was captured.'] : []),
      'No value entry was made.',
      'No line was inserted or deleted.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      ...(ownership?.interpretedOwnership.targetLineLooksVisible ? [] : ['No target-like G05001 / FA-CNC-01 line is visible.']),
      ...(ownership?.interpretedOwnership.targetAmountLooksVisible ? [] : ['Amount 68000 is not visible.']),
      'No ownership decision: existing line is not yet approved for keep, cleanup or rebuild.',
      'No corrected balancing account.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    diagnosisSummary: {
      balanceSummary: ownership?.balanceSummary ?? null,
      pageSignals: ownership?.pageSignals ?? null,
      targetSignals: ownership?.targetSignals ?? null,
      interpretedOwnership: ownership?.interpretedOwnership ?? null,
      relevantRowsCount: ownership?.rows.length ?? 0,
      relevantControlsCount: ownership?.controls.length ?? 0,
      screenshotCaptured,
    },
    changedFiles: [
      'package.json',
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-157-fa-gl-journal-line-ownership-readonly.json',
      '.agent/state/cases/fixedassets-158-fa-gl-journal-line-ownership-decision.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'playwright/projects/fibu-book5/tests/fixedassets-157-fa-gl-journal-line-ownership-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-157/',
      'playwright/projects/fibu-book5/img/fixedassets-157-010-fa-gl-journal-line-ownership-readonly.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-157/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-157/FIXEDASSETS-157-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-157/FIXEDASSETS-157-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-157/010-fa-gl-journal-line-ownership-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-157/020-focused-line-ownership-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-157/030-line-ownership-signals.json',
      'playwright/projects/fibu-book5/img/fixedassets-157-010-fa-gl-journal-line-ownership-readonly.png',
      'playwright/projects/fibu-book5/evidence/fixedassets-157/fixedassets-157-010-fa-gl-journal-line-ownership-readonly.screenshot.json',
    ],
    warnings: [
      'Read-only diagnostic run.',
      'Do not enter FA-CNC-01, amount or balancing account from FA-157 alone.',
      'Do not cleanup, preview or post before FA-158 local decision.',
    ],
    blockedBy,
    requiresReview: false,
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    flags: {
      noValueEntry: true,
      noInsertLine: true,
      noDeleteLine: true,
      noCleanup: true,
      noPost: true,
      noPreview: true,
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-157-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-157-learning.md'),
    [
      '# FIXEDASSETS-157 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `line-ownership`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Ein Anlagen-Fibu-Journal kann bereits eine sichtbare Zeilensituation enthalten. Bevor ein Anfaenger Werte eingibt, muss geklaert sein, ob diese Zeile zum aktuellen Laborfall gehoert, ob sie leer/ungefaehrlich ist oder ob sie aus einem frueheren Versuch stammt. Sonst wuerde man auf einer falschen Zeile weiterarbeiten.',
      '',
      '## Warum das wichtig ist',
      '',
      'Journalzeilen sind Arbeitsflaechen. Business Central unterscheidet nicht automatisch zwischen "meinem naechsten Laborbeleg" und "Rest einer frueheren Probe". Deshalb braucht der Klickpfad vor jeder Werteingabe einen Ownership-/Cleanup-Check.',
      '',
      '## Grenzen',
      '',
      '- Keine Zeile angelegt, geaendert oder geloescht.',
      '- Keine Werteingabe.',
      '- Keine Preview Posting.',
      '- Keine Buchung.',
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
      '# FIXEDASSETS-157 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-fa-gl-journal-line-ownership-context.txt` | Text | kompakte Journal-/Zeilensignale | keine Werteingabe | `labor`, `read-only` |',
      '| `020-focused-line-ownership-text.txt` | Text | fokussierte Zeilen-/Balance-Signale | kein Rohdump | `compact` |',
      '| `030-line-ownership-signals.json` | JSON | Ziel-, Balance-, Page- und Screenshot-Signale | keine Ownership-Entscheidung | `labor`, `read-only` |',
      '| `fixedassets-157-010-fa-gl-journal-line-ownership-readonly.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bildes | keine Buchungswirkung | `labor` |',
      '| `FIXEDASSETS-157-result.json` | JSON | Ergebnis, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-157-learning.md` | Markdown | Lernwert fuer Journalzeilen-Besitz/Cleanup | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noValueEntry).toBe(true);
  expect(result.flags.noInsertLine).toBe(true);
  expect(result.flags.noDeleteLine).toBe(true);
  expect(result.flags.noCleanup).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
});
