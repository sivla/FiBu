import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function runAuthCheck() {
  try {
    const output = execSync('npm run --silent auth:bc:check', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { exitCode: 0, output: JSON.parse(output) };
  } catch (error) {
    const rawOutput = `${error.stdout ?? ''}`.trim();
    let output = null;
    try {
      output = rawOutput ? JSON.parse(rawOutput) : null;
    } catch {
      output = null;
    }
    return {
      exitCode: typeof error.status === 'number' ? error.status : 1,
      output,
    };
  }
}

function runAuthTargetDiagnosis() {
  try {
    const output = execSync('npm run --silent auth:bc:target', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { exitCode: 0, output: JSON.parse(output) };
  } catch (error) {
    const rawOutput = `${error.stdout ?? ''}`.trim();
    let output = null;
    try {
      output = rawOutput ? JSON.parse(rawOutput) : null;
    } catch {
      output = null;
    }
    return {
      exitCode: typeof error.status === 'number' ? error.status : 1,
      output,
    };
  }
}

function readJsonIfExists(path) {
  const resolved = resolve(path);
  if (!existsSync(resolved)) return null;
  return JSON.parse(readFileSync(resolved, 'utf8'));
}

const current = readJsonIfExists('.agent/state/current.json') ?? {};
const lastAuthResult =
  typeof current.latestTarget027D31AuthRefreshResult === 'string'
    ? readJsonIfExists(current.latestTarget027D31AuthRefreshResult)
    : null;
const authCheck = runAuthCheck();
const authTarget = runAuthTargetDiagnosis();
const check = authCheck.output ?? {};
const blockedBy = Array.isArray(check.blockedBy) ? check.blockedBy : ['auth-check-unavailable'];
const canUseStoredAuth = check.canUseStoredAuth === true;
const operatorActionRequired = !canUseStoredAuth && lastAuthResult?.operatorActionRequired === true;
const interactiveOperatorAction = {
  reason: 'The Playwright auth profile is not logged in to Business Central yet.',
  profilePath: 'playwright/.auth/bc-profile',
  requiredWindow: 'the browser window opened by npm run auth:bc:interactive',
  steps: [
    'Run npm run auth:bc:interactive from this repo.',
    'Complete sign-in and MFA in the Playwright-opened browser window.',
    'Wait until Business Central shell text such as Search/Tell Me, Role Center or My Settings is visible.',
    'Then run npm run auth:bc:check and require canUseStoredAuth=true.',
  ],
  normalBrowserLoginIsNotEnough: true,
};

const result = {
  schemaVersion: 1,
  purpose: 'business-central-auth-doctor',
  activeCase: current.activeCase ?? '',
  instance: current.instance ?? '',
  company: current.company ?? '',
  canRunBusinessCentralWorkflows: canUseStoredAuth,
  authCheck: {
    canUseStoredAuth,
    exitCode: authCheck.exitCode,
    blockedBy,
    expectedInstance: check.expectedInstance ?? current.instance ?? '',
    expectedCompany: check.expectedCompany ?? current.company ?? '',
    shellValidationMeta: check.shellValidationMeta ?? null,
    ageHours: check.ageHours ?? null,
    metaAgeHours: check.metaAgeHours ?? null,
    maxAgeHours: check.maxAgeHours ?? null,
  },
  authTarget: authTarget.output
    ? {
        exitCode: authTarget.exitCode,
        canBuildTargetUrl: authTarget.output.canBuildTargetUrl === true,
        source: authTarget.output.source ?? '',
        sourcePathRedacted: authTarget.output.sourcePathRedacted ?? '',
        targetPathRedacted: authTarget.output.targetPathRedacted ?? '',
        sourceEnvironmentCandidate: authTarget.output.sourceEnvironmentCandidate ?? '',
        targetEnvironment: authTarget.output.targetEnvironment ?? '',
        expectedEnvironment: authTarget.output.expectedEnvironment ?? '',
        sourceCompanyParamPresent: authTarget.output.sourceCompanyParamPresent === true,
        targetCompanyParamPresent: authTarget.output.targetCompanyParamPresent === true,
        expectedCompany: authTarget.output.expectedCompany ?? '',
        targetCompany: authTarget.output.targetCompany ?? '',
        targetMatchesState: authTarget.output.targetMatchesState === true,
      }
    : {
        exitCode: authTarget.exitCode,
        canBuildTargetUrl: false,
        targetMatchesState: false,
      },
  lastAuthRefreshAttempt: lastAuthResult
    ? {
        resultPath: current.latestTarget027D31AuthRefreshResult,
        resultStatus: lastAuthResult.resultStatus ?? '',
        blockedBy: lastAuthResult.blockedBy ?? [],
        authDiagnosis: lastAuthResult.authDiagnosis ?? null,
        operatorActionRequired: lastAuthResult.operatorActionRequired === true,
        operatorAction: operatorActionRequired ? interactiveOperatorAction : (lastAuthResult.operatorAction ?? null),
      }
    : null,
  operatorActionRequired,
  decision: canUseStoredAuth
    ? 'stored-auth-usable-run-readonly-or-gated-target-tests'
    : operatorActionRequired
      ? 'operator-must-complete-playwright-auth-window'
    : 'do-not-run-business-central-workflows-refresh-playwright-auth-first',
  nextSafeAction: canUseStoredAuth
    ? 'Run only the active case allowed by agent:run-plan and keep normal BC shell/context checks enabled.'
    : operatorActionRequired
      ? 'Run npm run auth:bc:interactive and complete Login/MFA in the Playwright-opened browser window, not normal Chrome, until Business Central shell is visible; then rerun npm run auth:bc:check.'
    : 'Run npm run auth:bc:interactive, complete Login/MFA in the Playwright-opened browser until Business Central shell is visible, then rerun npm run auth:bc:check.',
  forbiddenUntilGreen: [
    'D31 VAT Assisted Setup read-only discovery',
    'VAT setup pages',
    'setup changes',
    'master data',
    'drafts/documents',
    'Preview Posting',
    'Posting',
    'API shortcuts',
  ],
};

console.log(JSON.stringify(result, null, 2));
