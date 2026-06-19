import { expect, test, type Page } from '@playwright/test';

import { pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { writeJsonEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'LIVE-SMOKE-BC-001-READONLY-CONTEXT';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const RESULT_PATH = 'playwright/projects/fibu-book5/evidence/live-smoke-bc-001/result.json';

const forbiddenDialogAction = /\b(OK|Yes|Ja|Post|Preview|Delete|New|Edit|Buchen|Vorschau|Loeschen|Neu|Bearbeiten)\b/i;

test.use({ storageState: 'playwright/.auth/bc-user.json' });

function buildTargetUrl() {
  const target = new URL(requireBcUrl(project.envPrefix));
  if (!target.toString().includes(EXPECTED_INSTANCE)) {
    throw new Error(`Configured BC URL does not target ${EXPECTED_INSTANCE}.`);
  }

  target.searchParams.set('company', EXPECTED_COMPANY);
  return target;
}

async function readDialogTexts(page: Page) {
  const texts: string[] = [];
  const scopes = [page, ...page.frames()];

  for (const scope of scopes) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => '');
      const normalized = text.replace(/\s+/g, ' ').trim();
      if (normalized) {
        texts.push(normalized);
      }
    }
  }

  return [...new Set(texts)];
}

function compactSafePageLines(text: string) {
  const keep = /Business Central|Search|Suchen|Tell me|Was moechten Sie tun|Meine Einstellungen|My Settings|RM-DEMO|CRONUS|Role Center/i;
  const seen = new Set<string>();
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line && keep.test(line))
    .filter((line) => {
      if (seen.has(line)) {
        return false;
      }
      seen.add(line);
      return true;
    })
    .slice(0, 30);
}

function baseResult() {
  return {
    schemaVersion: 1,
    purpose: 'autopilot-live-smoke-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-smoke',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    changedFiles: [RESULT_PATH],
    evidenceRefs: [RESULT_PATH],
    statePatch: {},
    safeToFinalizeState: false,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noScreenshot: true
    }
  };
}

function safeStatePatch(status: 'observed' | 'blocked', resultFile: string, reason: string) {
  return {
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'playwright-readonly-smoke',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary: reason,
      nextStep:
        status === 'observed'
          ? 'Review the state-finalize plan or plan the next read-only page-context smoke. Do not use --write without explicit approval.'
          : 'Resolve the live-smoke blocker before any further live Business Central run.'
    },
    activeCase: {
      status,
      lastResult: {
        status,
        resultFile,
        summary: reason
      },
      nextSafeAction:
        status === 'observed'
          ? 'Result is safe for a state-finalize patch plan only. Wait for explicit approval before --write.'
          : 'Fix blocker and rerun read-only smoke before any state finalization.'
    }
  };
}

test('LIVE-SMOKE-BC-001 confirms BC context without writing', async ({ page }) => {
  const startedAt = new Date().toISOString();
  let finalUrl = '';
  let title = '';

  try {
    const targetUrl = buildTargetUrl();
    await page.goto(targetUrl.toString(), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);

    finalUrl = page.url();
    title = await page.title();
    const parsedFinalUrl = new URL(finalUrl);
    const detectedInstance = parsedFinalUrl.toString().includes(EXPECTED_INSTANCE) ? EXPECTED_INSTANCE : null;
    const detectedCompany = parsedFinalUrl.searchParams.get('company');
    const text = await pageText(page);
    const dialogTexts = await readDialogTexts(page);
    const dangerousDialogs = dialogTexts.filter((dialogText) => forbiddenDialogAction.test(dialogText));

    if (detectedInstance !== EXPECTED_INSTANCE) {
      throw new Error(`Detected instance mismatch: ${detectedInstance ?? 'not detected'}.`);
    }
    if (detectedCompany !== EXPECTED_COMPANY) {
      throw new Error(`Detected company mismatch: ${detectedCompany ?? 'not detected'}.`);
    }
    if (dangerousDialogs.length > 0) {
      throw new Error(`Unsafe dialog detected: ${dangerousDialogs.join(' | ')}`);
    }

    const result = {
      ...baseResult(),
      resultStatus: 'observed',
      proved: [
        `Business Central URL stayed in ${EXPECTED_INSTANCE}.`,
        `Company URL parameter stayed ${EXPECTED_COMPANY}.`,
        'Business Central shell was visible with existing storageState.',
        'BC read-only was reachable.',
        'No booking was triggered.',
        'No Preview Posting was triggered.',
        'No Post was triggered.',
        'No draft was created.',
        'No setup change was triggered.'
      ],
      notProved: [
        'No business process, posting readiness, ledger trace or book screenshot was tested.',
        'Company was confirmed from URL context only, not from a changed UI setting.'
      ],
      warnings: [],
      blockedBy: [],
      requiresReview: false,
      safeToFinalizeState: true,
      statePatch: safeStatePatch(
        'observed',
        RESULT_PATH,
        'LIVE-SMOKE-BC-001 ran read-only in MCP_1_20260210 / RM-DEMO and produced compact context evidence. No posting, preview, draft, setup change, company switch or book change.'
      ),
      environment: {
        instance: detectedInstance,
        company: detectedCompany,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: EXPECTED_COMPANY
      },
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        url: finalUrl,
        title,
        dialogCount: dialogTexts.length,
        safePageTextLines: compactSafePageLines(text)
      }
    };

    await writeJsonEvidence(RESULT_PATH, result);
    expect(result.resultStatus).toBe('observed');
  } catch (error) {
    const blockedResult = {
      ...baseResult(),
      resultStatus: 'blocked',
      proved: [],
      notProved: [
        'Business Central read-only context smoke did not complete.',
        'No write/post/preview/draft/setup action is claimed.'
      ],
      warnings: [],
      blockedBy: [error instanceof Error ? error.message : String(error)],
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: safeStatePatch(
        'blocked',
        RESULT_PATH,
        `LIVE-SMOKE-BC-001 blocked: ${error instanceof Error ? error.message : String(error)}`
      ),
      environment: {
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: EXPECTED_COMPANY
      },
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        url: finalUrl || page.url(),
        title
      }
    };

    await writeJsonEvidence(RESULT_PATH, blockedResult);
    throw error;
  }
});
