import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  dismissTours,
  hideFactBoxPane,
  openSearchResult,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-166-FA-BALACCOUNT-CANDIDATE-READONLY';
const NEXT_CASE_ID_IF_CANDIDATE = 'FIXEDASSETS-167-FA-BALACCOUNT-SETUP-FIT-DECISION';
const NEXT_CASE_ID_IF_BLOCKED = 'FIXEDASSETS-166-FA-BALACCOUNT-CANDIDATE-READONLY';
const TEST_ID = 'fixedassets-166';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const CHART_OF_ACCOUNTS_PAGE_ID = 16;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

type CandidateAccount = {
  code: string;
  name: string;
  score: number;
  reasons: string[];
  rowText: string;
};

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

function chartOfAccountsUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(CHART_OF_ACCOUNTS_PAGE_ID));
  return url.toString();
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function compactError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/\x1b\[[0-9;]*m/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' ')
    .slice(0, 500);
}

function isSafeEvidenceText(value: string) {
  return !/requestExecutorSettings|allowedEndpoints|allowedResources|tokenFactory|O365MSAL|clientId|upn|originAuthorityValidator|kajetan\.kalicki|playwright\/\.auth|storageState|aadTenantId|startTraceId/i.test(
    value,
  );
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

async function openChartOfAccounts(page: Page) {
  await page.goto(chartOfAccountsUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1500);

  if (/Chart of Accounts|Kontenplan|G\/L Accounts|Sachkonten/i.test(await pageText(page))) {
    return 'direct-page-16';
  }

  await searchFor(page, 'Chart of Accounts');
  await openSearchResult(page, /^Chart of Accounts$/i, { requireUnique: false });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1500);
  return 'tell-me-chart-of-accounts';
}

async function readChartOfAccountsSignals(page: Page) {
  const frameSignals = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate(() => {
          function clean(value: string | null | undefined) {
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

          const bodyText = clean(document.body?.innerText || document.body?.textContent || '');
          const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
            .filter(visible)
            .map((row) => clean(row.innerText || row.textContent).slice(0, 700))
            .filter(Boolean);
          return { bodyText, rows };
        })
        .catch(() => ({ bodyText: '', rows: [] })),
    ),
  );

  const bodyText = frameSignals.map((entry) => entry.bodyText).join(' ');
  const rows = frameSignals.flatMap((entry) => entry.rows);

  function scoreRows() {
    function clean(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const codeRows = rows
      .filter((row) => /\b\d{4,6}\b/.test(row))
      .map((row) => {
        const code = row.match(/\b\d{4,6}\b/)?.[0] ?? '';
        const compactName = clean(
          row
            .replace(code, '')
            .replace(/-?\d{1,3}(?:\.\d{3})*(?:,\d+)?/g, '')
            .replace(/\bYes\b|\bNo\b/gi, ' '),
        );
        const reasons: string[] = [];
        let score = 0;
        if (/cash|bank|checking|payment|clearing|offset|suspense/i.test(row)) {
          score += 4;
          reasons.push('row name suggests cash/bank/payment/clearing offset account');
        }
        if (/payable|vendor|purchase/i.test(row)) {
          score += 2;
          reasons.push('row name suggests payable/purchase context');
        }
        if (/fixed asset|acquisition|machin|equipment/i.test(row)) {
          score -= 2;
          reasons.push('row appears to be the asset/acquisition side, not necessarily the balancing side');
        }
        if (/\bHeading\b|\bBegin-Total\b|\bEnd-Total\b|^Total,|\bTotal,\b/i.test(row)) {
          score -= 3;
          reasons.push('row may be heading/total account');
        }
        return {
          code,
          name: compactName.slice(0, 180),
          score,
          reasons,
          rowText: row,
        };
      });

    const candidates = codeRows
      .filter((row) => row.score > 0)
      .sort((left, right) => right.score - left.score || left.code.localeCompare(right.code))
      .slice(0, 12);

    return {
      pageContextVisible: /Chart of Accounts|Kontenplan|G\/L Accounts|Sachkonten/i.test(bodyText),
      visibleCodeCount: codeRows.length,
      accountSignals: [...new Set(codeRows.map((row) => row.code))].slice(0, 120),
      candidateAccounts: candidates,
      focusedRows: codeRows
        .filter((row) => row.score > 0 || /cash|bank|checking|payable|clearing|suspense|payment|purchase/i.test(row.rowText))
        .filter((row) => isSafeEvidenceText(row.rowText))
        .slice(0, 80),
      visibleTextSample: [
        /Chart of Accounts|Kontenplan|G\/L Accounts|Sachkonten/i.test(bodyText) ? 'Chart of Accounts context visible' : '',
        ...rows,
      ]
        .map((line) => clean(line))
        .filter(Boolean)
        .filter(isSafeEvidenceText)
        .filter((line) => /Chart of Accounts|Kontenplan|G\/L|No\.|Name|Balance|cash|bank|payable|clearing|payment/i.test(line))
        .slice(0, 100),
    };
  }

  return scoreRows();
}

async function searchChartOfAccounts(page: Page, term: string) {
  for (const frame of page.frames()) {
    const locators = [
      frame.getByRole('searchbox', { name: /Chart of Accounts suchen|Kontenplan suchen|Search|Suchen/i }).first(),
      frame.locator('input[aria-label*="Chart of Accounts" i], input[aria-label*="suchen" i], input[type="search"], [role="searchbox"]').first(),
    ];
    for (const searchBox of locators) {
      if (await searchBox.isVisible({ timeout: 700 }).catch(() => false)) {
        await searchBox.click({ timeout: 2000 }).catch(() => undefined);
        await searchBox.fill(term);
        await page.waitForTimeout(1800);
        return true;
      }
    }
  }
  return false;
}

function mergeSignals(
  current: Awaited<ReturnType<typeof readChartOfAccountsSignals>>,
  next: Awaited<ReturnType<typeof readChartOfAccountsSignals>>,
) {
  const byCode = new Map<string, CandidateAccount>();
  for (const candidate of [...current.candidateAccounts, ...next.candidateAccounts]) {
    const existing = byCode.get(candidate.code);
    if (!existing || candidate.score > existing.score) {
      byCode.set(candidate.code, candidate);
    }
  }
  const focusedRows = [...current.focusedRows, ...next.focusedRows].filter(
    (row, index, allRows) => allRows.findIndex((candidate) => candidate.rowText === row.rowText) === index,
  );
  const visibleTextSample = [...current.visibleTextSample, ...next.visibleTextSample].filter(
    (line, index, allLines) => allLines.indexOf(line) === index,
  );
  const accountSignals = [...current.accountSignals, ...next.accountSignals].filter(
    (code, index, allCodes) => allCodes.indexOf(code) === index,
  );
  return {
    pageContextVisible: current.pageContextVisible || next.pageContextVisible,
    visibleCodeCount: Math.max(current.visibleCodeCount, next.visibleCodeCount),
    accountSignals: accountSignals.slice(0, 160),
    candidateAccounts: [...byCode.values()]
      .sort((left, right) => right.score - left.score || left.code.localeCompare(right.code))
      .slice(0, 12),
    focusedRows: focusedRows.slice(0, 100),
    visibleTextSample: visibleTextSample.slice(0, 140),
  };
}

async function scanChartOfAccounts(page: Page, initial: Awaited<ReturnType<typeof readChartOfAccountsSignals>>) {
  let combined = initial;
  const scanSteps: string[] = ['initial'];
  for (let index = 0; index < 8 && (combined.candidateAccounts.length === 0 || (combined.candidateAccounts[0]?.score ?? 0) < 4); index += 1) {
    await page.mouse.move(1500, 900);
    await page.mouse.wheel(0, 1150);
    await page.waitForTimeout(700);
    const next = await readChartOfAccountsSignals(page);
    combined = mergeSignals(combined, next);
    scanSteps.push(`wheel-${index + 1}`);
  }
  return { combined, scanSteps };
}

function makeStatePatch(resultStatus: string, hasCandidate: boolean, summary: string) {
  const nextCase = hasCandidate ? NEXT_CASE_ID_IF_CANDIDATE : NEXT_CASE_ID_IF_BLOCKED;
  return {
    current: {
      activeCase: nextCase,
      active_case_file: hasCandidate
        ? '.agent/state/cases/fixedassets-167-fa-balaccount-setup-fit-decision.json'
        : '.agent/state/cases/fixedassets-166-fa-balaccount-candidate-readonly.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-166-fa-balaccount-candidate-readonly.json',
      requiresStrongModel: true,
      nextStep: hasCandidate
        ? 'FIXEDASSETS-167: judge whether a visible G/L account candidate is safe enough for a separate UI-first setup-fit case; no setup change in FA-166.'
        : 'FIXEDASSETS-166 remains blocked: improve read-only G/L account candidate discovery before any setup-fit or value-entry case.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-21',
      workType: 'fa-balaccount-candidate-readonly',
      taskClass: 'wizard_work',
      modelClass: 'gpt-4-medium',
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
      dataChanged: false,
      resultStatus,
      summary,
      nextStep: hasCandidate
        ? 'Run FIXEDASSETS-167 setup-fit decision before any setup write.'
        : 'Repeat candidate discovery with a safer UI route or document the blocker.',
    },
    activeCase: {
      status: resultStatus,
      lastResult: {
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-166/FIXEDASSETS-166-result.json',
        candidateVisible: hasCandidate,
        summary,
      },
      nextSafeAction: hasCandidate
        ? 'Judge candidate account fit locally; setup change remains locked.'
        : 'Keep acquisition route blocked; no setup or value entry.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: hasCandidate ? 'fa-balaccount-setup-fit-decision' : 'fa-balaccount-candidate-readonly',
          latestPracticalCase: CASE_ID,
          latestReviewCase: 'FIXEDASSETS-165',
          nextCase,
          bookScreenshots: {
            acquisitionPostingTrace: hasCandidate
              ? 'candidate-gl-account-visible-no-setup-fit-yet'
              : 'blocked-no-visible-gl-account-candidate',
          },
        },
      },
      fixedAssets: {
        faCnc01: {
          nextAcquisitionRoute: hasCandidate ? 'fa-balaccount-setup-fit-decision' : 'fa-balaccount-candidate-readonly',
          acquisitionUnlocked: false,
        },
      },
    },
  };
}

test('FIXEDASSETS-166 discovers G/L account candidates read-only for FA balancing account', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let openRoute = '';
  let signals: Awaited<ReturnType<typeof readChartOfAccountsSignals>> | undefined;
  let screenshotCaptured = false;
  const searchTermsTried: string[] = [];
  let scanSteps: string[] = [];

  try {
    openRoute = await openChartOfAccounts(page);
    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    }

    signals = await readChartOfAccountsSignals(page);
    for (const term of ['bank', 'cash', 'clearing', 'payable']) {
      if (signals.candidateAccounts.length > 0) {
        break;
      }
      const searched = await searchChartOfAccounts(page, term);
      if (searched) {
        searchTermsTried.push(term);
        signals = await readChartOfAccountsSignals(page);
      }
    }
    if (signals.candidateAccounts.length === 0 || (signals.candidateAccounts[0]?.score ?? 0) < 4) {
      const scanned = await scanChartOfAccounts(page, signals);
      signals = scanned.combined;
      scanSteps = scanned.scanSteps;
    }
    if (!signals.pageContextVisible) {
      blockedBy.push('Chart of Accounts / G/L Accounts context was not visible.');
    }
    if (signals.visibleCodeCount < 1) {
      blockedBy.push('No visible G/L account rows were captured.');
    }

    await screenshot(page, 'fixedassets-166-010-gl-account-candidates-readonly.png', {
      projectName: project.name,
      testId: TEST_ID,
      status: signals.candidateAccounts.length > 0 ? 'candidate' : 'rejected',
      bookUse: 'evidence',
      purpose:
        'Read-only Kandidatenbild: Chart of Accounts als G/L-Account-Quelle fuer ein moegliches Acquisition Cost Bal. Acc. Gegenkonto.',
      expectedPageText: [/Chart of Accounts|Kontenplan|G\/L Accounts|Sachkonten/i],
      knownLimitations: [
        'Kandidatensichtung, kein Setup-Fit.',
        'Keine Feldwerteingabe.',
        'Keine Setup-Aenderung.',
        'Keine Preview Posting.',
        'Keine Buchung.',
        'Kein deutscher Finalnachweis.',
      ],
    });
    screenshotCaptured = true;
  } catch (error) {
    blockedBy.push(compactError(error));
  }

  const candidateAccounts: CandidateAccount[] = signals?.candidateAccounts ?? [];
  const hasCandidate = blockedBy.length === 0 && candidateAccounts.length > 0;
  const resultStatus = blockedBy.length > 0 ? 'blocked' : hasCandidate ? 'observed-candidates' : 'observed-no-candidate';
  const summary = hasCandidate
    ? `Chart of Accounts was read-only visible and produced G/L candidate accounts for a later Acquisition Cost Bal. Acc. setup decision: ${candidateAccounts
        .map((entry) => `${entry.code} ${entry.name}`)
        .join('; ')}.`
    : `No safe visible G/L account candidate was proven. Blockers: ${blockedBy.join(' | ') || 'candidate list empty'}.`;
  const patch = makeStatePatch(resultStatus, hasCandidate, summary);

  await writeJsonEvidence(faEvidencePath('010-gl-account-candidate-signals.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-166-gl-account-candidate-readonly-signals',
    caseId: CASE_ID,
    context,
    openRoute,
    searchTermsTried,
    scanSteps,
    target: {
      sourcePage: 'Chart of Accounts / G/L Accounts',
      targetPostingGroup: 'MACHINES',
      targetField: 'Acquisition Cost Bal. Acc.',
    },
    signals,
    evaluation: {
      candidateAccounts,
      hasCandidate,
      setupFitUnlocked: false,
      safeForValueEntry: false,
    },
    screenshotCaptured,
    blockedBy,
    omitted: 'No full DOM dump, traces, videos, reports, storage state, auth artifact or raw shell text stored.',
  });

  await writeTextEvidence(
    faEvidencePath('020-focused-gl-account-candidate-text.txt'),
    [
      'FIXEDASSETS-166 focused G/L account candidate text',
      '',
      'Visible candidates:',
      ...(candidateAccounts.length
        ? candidateAccounts.map((entry) => `${entry.code} | ${entry.name} | score=${entry.score} | ${entry.reasons.join('; ')}`)
        : ['No candidate accounts.']),
      '',
      'Focused rows:',
      ...((signals?.focusedRows ?? []).map((entry) => entry.rowText).filter(isSafeEvidenceText) || ['No focused rows.']),
    ].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-balaccount-candidate-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-diagnosis',
    resultStatus,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(signals?.pageContextVisible ? ['Chart of Accounts / G/L account context was reached read-only.'] : []),
      ...(hasCandidate ? ['One or more visible G/L account candidates were captured for later decision.'] : []),
      'No field value was entered.',
      'No setup value was changed.',
      'No journal value was entered.',
      'No Preview Posting was opened.',
      'No posting was executed.',
    ],
    notProved: [
      'No Acquisition Cost Bal. Acc. setup-fit.',
      'No specific candidate was selected into FA Posting Group MACHINES.',
      'No FA G/L Journal value-entry readiness.',
      'No Preview Posting result.',
      'No posting result.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-166-fa-balaccount-candidate-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-166/',
      'playwright/projects/fibu-book5/img/fixedassets-166-010-gl-account-candidates-readonly.png',
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-166-fa-balaccount-candidate-readonly.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'playwright/projects/fibu-book5/CURRENT-STATE.md',
      'playwright/projects/fibu-book5/LAB-FIT-STATUS.md',
      'playwright/projects/fibu-book5/BOOK-CLICK-GUIDE-COVERAGE.md',
      'playwright/projects/fibu-book5/SCREENSHOT-QA.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-166/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-166/010-gl-account-candidate-signals.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-166/020-focused-gl-account-candidate-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-166/FIXEDASSETS-166-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-166/FIXEDASSETS-166-result.json',
      'playwright/projects/fibu-book5/img/fixedassets-166-010-gl-account-candidates-readonly.png',
    ],
    candidateEvaluation: {
      candidateAccounts,
      hasCandidate,
      setupFitUnlocked: false,
      safeForValueEntry: false,
    },
    warnings: [
      'Visible G/L accounts are candidates only.',
      'This run does not choose or save Acquisition Cost Bal. Acc.',
      'A separate setup-fit decision is required before any setup write.',
    ],
    blockedBy,
    requiresReview: hasCandidate,
    safeToFinalizeState: true,
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-166-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-166-learning.md'),
    [
      '# FIXEDASSETS-166 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `candidate-discovery`, `no-setup-change`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Ein Gegenkonto fuer Anlagenzugang darf nicht aus einem beliebigen sichtbaren Konto abgeleitet werden. Zuerst muss klar sein, dass man sich in einer G/L-Account-Quelle befindet. Selbst dann ist ein sichtbares Konto nur ein Kandidat, bis ein separater Setup-Fit entscheidet, ob es fachlich zum Feld `Acquisition Cost Bal. Acc.` passt.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 kann diesen Lauf als Zwischenkontrolle erklaeren: Kontenplan lesen, Kandidaten erkennen, aber noch nichts in die Anlagenbuchungsgruppe schreiben.',
      '',
      '## Grenzen',
      '',
      '- Kein Setup-Fit.',
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
      '# FIXEDASSETS-166 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-gl-account-candidate-signals.json` | JSON | sichtbare G/L-Account-Kandidaten aus dem Kontenplan | keinen Setup-Fit, keine Werteingabe | `labor`, `read-only`, `candidate` |',
      '| `020-focused-gl-account-candidate-text.txt` | Text | kompakte Kandidaten- und Zeilensignale | kein Rohdump | `compact` |',
      '| `fixedassets-166-010-gl-account-candidates-readonly.screenshot.json` | Screenshot-Metadaten | Zweck/Grenzen des Kandidatenbildes | keine eigenstaendige Fachfreigabe | `candidate` |',
      '| `FIXEDASSETS-166-learning.md` | Markdown | Lernwert fuer Kontenplan/Kandidatenlogik | keinen deutschen Finalstand | `labor` |',
      '| `FIXEDASSETS-166-result.json` | JSON | Ergebnis, Kandidaten, Safety Flags und State-Patch-Plan | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noValueEntry).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(signals?.pageContextVisible).toBe(true);
});
