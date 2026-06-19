import { expect, test, type Page } from '@playwright/test';

import { pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { writeJsonEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'LIVE-SMOKE-BC-004-READONLY-VISIBLE-COMPANY-CONTEXT';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const RESULT_PATH = 'playwright/projects/fibu-book5/evidence/live-smoke-bc-004/result.json';

const riskyDialogOrAction =
  /\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Löschen|Post|Buchen|Preview|Vorschau|Ship|Liefern|Invoice|Fakturieren|Payment|Zahlung|Company|Mandant|Firma wechseln|My Settings|Meine Einstellungen)\b/i;

test.use({ storageState: 'playwright/.auth/bc-user.json' });

function buildTargetUrl() {
  const target = new URL(requireBcUrl(project.envPrefix));
  if (!target.toString().includes(EXPECTED_INSTANCE)) {
    throw new Error(`Configured BC URL does not target ${EXPECTED_INSTANCE}.`);
  }

  target.searchParams.set('company', EXPECTED_COMPANY);
  return target;
}

function asciiSafeEvidenceText(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactSafePageLines(text: string) {
  const keep =
    /Business Central|Role Center|Search|Suchen|Tell me|Was moechten Sie tun|RM-DEMO|CRONUS|Activities|Aktivitaeten|Finance|Sales|Purchase|Inventory|Company|Mandant|Firma/i;
  const seen = new Set<string>();
  return text
    .split('\n')
    .map((line) => asciiSafeEvidenceText(line))
    .filter((line) => line && keep.test(line))
    .filter((line) => {
      if (seen.has(line)) {
        return false;
      }
      seen.add(line);
      return true;
    })
    .slice(0, 60);
}

async function readDialogTexts(page: Page) {
  const texts: string[] = [];
  const scopes = [page, ...page.frames()];

  for (const scope of scopes) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => '');
      const normalized = asciiSafeEvidenceText(text);
      if (normalized) {
        texts.push(normalized);
      }
    }
  }

  return [...new Set(texts)];
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
      noSettingsOpen: true,
      noApiShortcut: true,
      noBookChange: true,
      noScreenshot: true,
      noActionClick: true
    }
  };
}

function safeStatePatch(status: 'observed' | 'blocked', resultFile: string, reason: string) {
  return {
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'playwright-readonly-smoke-visible-company-context',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary: reason,
      nextStep:
        status === 'observed'
          ? 'Review the state-finalize plan for LIVE-SMOKE-BC-004. Do not use --write without explicit approval.'
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

test('LIVE-SMOKE-BC-004 checks visible company context without opening settings or actions', async ({ page }) => {
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
    const riskyDialogs = dialogTexts.filter((dialogText) => riskyDialogOrAction.test(dialogText));
    const visibleCompanyTextLines = compactSafePageLines(text).filter((line) =>
      new RegExp(`\\b${EXPECTED_COMPANY}\\b`, 'i').test(line)
    );
    const companyTextVisible = visibleCompanyTextLines.length > 0;

    if (detectedInstance !== EXPECTED_INSTANCE) {
      throw new Error(`Detected instance mismatch: ${detectedInstance ?? 'not detected'}.`);
    }
    if (detectedCompany !== EXPECTED_COMPANY) {
      throw new Error(`Detected company mismatch: ${detectedCompany ?? 'not detected'}.`);
    }
    if (riskyDialogs.length > 0) {
      throw new Error(`Unsafe dialog detected without interaction: ${riskyDialogs.join(' | ')}`);
    }

    const reason = companyTextVisible
      ? 'LIVE-SMOKE-BC-004 ran read-only in MCP_1_20260210 / RM-DEMO and found RM-DEMO in visible shell/page text without settings, company switch, action click or write operation.'
      : 'LIVE-SMOKE-BC-004 ran read-only in MCP_1_20260210 / RM-DEMO; URL context was correct, but RM-DEMO was not visible in shell/page text without opening settings or actions.';
    const result = {
      ...baseResult(),
      resultStatus: 'observed',
      proved: [
        `Business Central URL stayed in ${EXPECTED_INSTANCE}.`,
        `Company URL parameter stayed ${EXPECTED_COMPANY}.`,
        'Business Central shell was visible with existing storageState.',
        'No settings page, company-switch dialog, menu, action or role-center tile was opened.',
        'No booking was triggered.',
        'No Preview Posting was triggered.',
        'No Post was triggered.',
        'No draft was created.',
        'No setup change was triggered.',
        'No company switch was triggered.',
        companyTextVisible
          ? `Company ${EXPECTED_COMPANY} appeared in visible shell/page text.`
          : `Company ${EXPECTED_COMPANY} was intentionally not forced through settings or navigation.`
      ],
      notProved: [
        'No business process, posting readiness, ledger trace or book screenshot was tested.',
        companyTextVisible
          ? 'No separate Company Information page was opened; proof stays on current shell/page context.'
          : 'Visible UI company proof is still open because RM-DEMO did not appear in shell/page text without opening settings or actions.'
      ],
      warnings: companyTextVisible
        ? []
        : ['Company RM-DEMO was confirmed from URL only; visible UI proof remains open for a later safe pattern.'],
      blockedBy: [],
      requiresReview: false,
      safeToFinalizeState: true,
      statePatch: safeStatePatch('observed', RESULT_PATH, reason),
      environment: {
        instance: detectedInstance,
        company: detectedCompany,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: EXPECTED_COMPANY,
        companyTextVisible
      },
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        url: finalUrl,
        title,
        dialogCount: dialogTexts.length,
        visibleCompanyTextLines,
        safePageTextLines: compactSafePageLines(text)
      }
    };

    await writeJsonEvidence(RESULT_PATH, result);
    expect(result.resultStatus).toBe('observed');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const blockedResult = {
      ...baseResult(),
      resultStatus: 'blocked',
      proved: [],
      notProved: [
        'Business Central read-only visible-company-context smoke did not complete.',
        'No write/post/preview/draft/setup/company-switch/action-click is claimed.'
      ],
      warnings: [],
      blockedBy: [reason],
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: safeStatePatch('blocked', RESULT_PATH, `LIVE-SMOKE-BC-004 blocked: ${reason}`),
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
