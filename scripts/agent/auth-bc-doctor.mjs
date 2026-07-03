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
const detachedHandoffLaunched =
  current?.latestDetachedAuthHandoffLaunch?.result === 'detached-playwright-profile-window-launched';
const profileExists = existsSync(resolve('playwright/.auth/bc-profile'));
const preferredAuthHandoff = detachedHandoffLaunched || profileExists ? 'detached-capture' : 'bounded-open-login';
const interactiveOperatorAction = {
  reason: 'The Playwright auth profile is not logged in to Business Central yet.',
  profilePath: 'playwright/.auth/bc-profile',
  requiredWindow:
    preferredAuthHandoff === 'detached-capture'
      ? 'the detached browser window opened by npm run auth:bc:open-login-detached'
      : 'the browser window opened by npm run auth:bc:open-login',
  steps:
    preferredAuthHandoff === 'detached-capture'
      ? [
          'Complete sign-in and MFA in the detached Playwright profile browser window if it is still open.',
          'Wait until Business Central shell text such as Search/Tell Me, Role Center or My Settings is visible.',
          'Close the detached browser window so npm run auth:bc can reuse the profile.',
          'Run npm run auth:bc:capture-detached to verify the detached browser is closed.',
          'If clear, run npm run auth:bc:capture-detached -- --confirm to validate the same profile and write playwright/.auth/bc-user.json.',
          'Then run npm run auth:bc:check and require canUseStoredAuth=true.',
        ]
      : [
          'Run npm run auth:bc:open-login from this repo.',
          'Complete sign-in and MFA in the Playwright-opened browser window.',
          'Wait until Business Central shell text such as Search/Tell Me, Role Center or My Settings is visible.',
          'Then run npm run auth:bc:check and require canUseStoredAuth=true.',
          'For a longer attended handoff, set BC_AUTH_OPEN_LOGIN_TIMEOUT_MS explicitly for that one run.',
          'If the Playwright window repeatedly stays on Microsoft sign-in, run npm run auth:bc:reset-profile first as a dry run, then with -- --confirm only when the local auth profile should be reset.',
          'If time-bound handoffs keep closing before the login can be completed, run npm run auth:bc:open-login-detached, finish Login/MFA, close that browser, then run npm run auth:bc:capture-detached.',
        ],
  normalBrowserLoginIsNotEnough: true,
};
const nextInteractiveAction =
  preferredAuthHandoff === 'detached-capture'
    ? 'Complete Login/MFA in the detached Playwright profile browser if it is still open, wait for Business Central shell, close that browser, then run npm run auth:bc:capture-detached and, if clear, npm run auth:bc:capture-detached -- --confirm. Finish with npm run auth:bc:check.'
    : 'Run npm run auth:bc:open-login and complete Login/MFA in the Playwright-opened browser window, not normal Chrome, until Business Central shell is visible. The handoff is bounded by default; set BC_AUTH_OPEN_LOGIN_TIMEOUT_MS explicitly only for a longer attended run. If it repeatedly stays on Microsoft sign-in, dry-run npm run auth:bc:reset-profile and confirm only the ignored local profile reset. If the handoff window keeps closing before login completes, use npm run auth:bc:open-login-detached, finish login, close it, then run npm run auth:bc:capture-detached.';

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
    profileExists: check.profileExists === true,
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
  preferredAuthHandoff,
  decision: canUseStoredAuth
    ? 'stored-auth-usable-run-readonly-or-gated-target-tests'
    : operatorActionRequired
      ? 'operator-must-complete-playwright-auth-window'
    : 'do-not-run-business-central-workflows-refresh-playwright-auth-first',
  nextSafeAction: canUseStoredAuth
    ? 'Run only the active case allowed by agent:run-plan and keep normal BC shell/context checks enabled.'
    : operatorActionRequired
      ? nextInteractiveAction
    : 'Run npm run auth:bc:open-login, complete Login/MFA in the Playwright-opened browser until Business Central shell is visible, then rerun npm run auth:bc:check. For longer attended login, set BC_AUTH_OPEN_LOGIN_TIMEOUT_MS explicitly. If bounded handoffs keep timing out, use npm run auth:bc:open-login-detached, close it after shell loads, then run npm run auth:bc:capture-detached.',
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
