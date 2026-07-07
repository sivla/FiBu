import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function runDryRun() {
  const output = execSync('npm run --silent agent:dry-run', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

function runContextPack() {
  try {
    const output = execSync('npm run --silent agent:context', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      exitCode: 0,
      output: JSON.parse(output),
    };
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

function runAuthCheck() {
  try {
    const output = execSync('npm run --silent auth:bc:check', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      canUseStoredAuth: true,
      exitCode: 0,
      output: JSON.parse(output),
    };
  } catch (error) {
    const rawOutput = `${error.stdout ?? ''}`.trim();
    let output = null;
    try {
      output = rawOutput ? JSON.parse(rawOutput) : null;
    } catch {
      output = null;
    }

    return {
      canUseStoredAuth: false,
      exitCode: typeof error.status === 'number' ? error.status : 1,
      output,
      blockedBy: output?.blockedBy ?? ['auth-check-failed'],
    };
  }
}

function runAuthDoctor() {
  try {
    const output = execSync('npm run --silent auth:bc:doctor', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      exitCode: 0,
      output: JSON.parse(output),
    };
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

const authUnblockStep =
  'Run npm run auth:bc:open-login and complete Login/MFA in the Playwright-opened browser window until the Business Central shell is visible. ' +
  'The command is bounded by default; set BC_AUTH_OPEN_LOGIN_TIMEOUT_MS explicitly only for a longer attended handoff. ' +
  'If repeated handoffs time out before shell, use npm run auth:bc:open-login-detached, finish login, close that browser, then run npm run auth:bc:capture-detached.';

function step(type, fields) {
  return {
    type,
    ...fields,
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function caseMayNeedBusinessCentralAuth(activeCase, dryRun) {
  const haystack = [
    activeCase.caseId,
    activeCase.title,
    activeCase.purpose,
    activeCase.goal,
    ...(activeCase.allowedActions ?? []),
    ...(activeCase.stopIf ?? []),
    ...(dryRun.allowedActions ?? []),
    ...(dryRun.stopConditions ?? []),
  ]
    .filter(Boolean)
    .join(' ');

  return /business central|playwright|open-playthru|open-number-series|confirm-UNIVERSAARL-DE|storageState|auth/i.test(haystack);
}

const current = readJson('.agent/state/current.json');
const activeCase = current.active_case_file && existsSync(current.active_case_file)
  ? readJson(current.active_case_file)
  : {};
const dryRun = runDryRun();
const contextPack = runContextPack();
const contextAuthGate = contextPack.output?.authGate ?? null;
const contextAuthBlocked =
  contextAuthGate?.requiresAuth === true &&
  contextAuthGate?.canRunBusinessCentralWorkflows === false;
const needsBusinessCentralAuth =
  caseMayNeedBusinessCentralAuth(activeCase, dryRun) ||
  contextAuthGate?.requiresAuth === true;
const authCheck = needsBusinessCentralAuth ? runAuthCheck() : null;
const authDoctor = needsBusinessCentralAuth ? runAuthDoctor() : null;
const authBlockedBy = unique([
  ...(authCheck && !authCheck.canUseStoredAuth ? authCheck.blockedBy ?? [] : []),
  ...(contextAuthBlocked ? contextAuthGate.blockedBy ?? [] : []),
]);
const operatorActionRequired = authDoctor?.output?.operatorActionRequired === true;
const authRecoveryNeeded =
  needsBusinessCentralAuth &&
  (authBlockedBy.length > 0 || operatorActionRequired || contextAuthBlocked);
const operatorAction = authDoctor?.output?.lastAuthRefreshAttempt?.operatorAction ?? null;
const operatorAuthUnblockStep =
  contextAuthBlocked && contextAuthGate.nextSafeAction
    ? contextAuthGate.nextSafeAction
    : operatorActionRequired && operatorAction
      ? authDoctor.output.nextSafeAction
      : authUnblockStep;
const combinedForbiddenActions = unique([
  ...(current.forbiddenActions ?? []),
  ...(activeCase.forbiddenActions ?? []),
  ...(dryRun.forbiddenActions ?? []),
]);
const freezeActive =
  current.freezeStatus?.status === 'active' ||
  current.activeArea === 'project-improvement-freeze' ||
  current.mode === 'project-improvement-freeze';
const liveBlocked =
  freezeActive ||
  combinedForbiddenActions.includes('open-business-central-live') ||
  combinedForbiddenActions.includes('business-central-execution') ||
  combinedForbiddenActions.includes('playwright-execution');
const liveGate = {
  businessCentralLiveAllowed: !liveBlocked,
  playwrightLiveAllowed: !liveBlocked && !combinedForbiddenActions.includes('playwright-execution'),
  freezeActive,
  blockedBy: unique([
    ...(freezeActive ? ['improvement-freeze-active'] : []),
    ...(combinedForbiddenActions.includes('open-business-central-live') ? ['open-business-central-live-forbidden'] : []),
    ...(combinedForbiddenActions.includes('business-central-execution') ? ['business-central-execution-forbidden'] : []),
    ...(combinedForbiddenActions.includes('playwright-execution') ? ['playwright-execution-forbidden'] : []),
  ]),
  parkedCase: current.freezeStatus?.frozenLiveCase,
  resumeCandidate: current.freezeStatus?.resumeCandidateAfterFreeze ?? current.nextCase,
  nextLiveType: current.implementationOperatingSystem?.currentLiveBoundary?.resumePilotMode,
};

const blockedLiveActions = unique([
  ...(dryRun.forbiddenActions ?? []),
  ...(dryRun.stopConditions?.length ? ['live-run'] : []),
  'business-central-execution',
  'playwright-execution',
  'book-edit',
  'binary-or-screenshot-read',
]);

const steps = [];

steps.push(step('run-command', {
  command: 'npm run agent:preflight',
  reason: 'Validate state, budgets, safety, routing, capabilities and skills before any agent work.',
  allowed: true,
}));

if (needsBusinessCentralAuth) {
  steps.push(step('run-command', {
    command: 'npm run auth:bc:check',
    reason: 'Validate local Business Central storageState shape and shell-validation metadata before any later Playwright/BC execution.',
    allowed: true,
    requiredBefore: ['execute-playwright', 'execute-business-central'],
    expectedFailureMeans: operatorAuthUnblockStep,
  }));
  if (authRecoveryNeeded) {
    steps.push(step('run-command', {
      command: 'npm run auth:bc:target',
      reason: 'Print a redacted Business Central target URL diagnosis so source environment and current-state override are clear before auth retry.',
      allowed: true,
      requiredBefore: ['npm run auth:bc:open-login', 'execute-playwright', 'execute-business-central'],
      expectedFailureMeans: 'Fix the local BC target URL or current.json instance/company before any auth retry or BC workflow.',
    }));
    steps.push(step('run-command', {
      command: 'npm run auth:bc:doctor',
      reason: 'Summarize Business Central auth go/no-go, target context and last auth blocker before any expensive retry or BC workflow.',
      allowed: true,
      requiredBefore: ['npm run auth:bc:open-login', 'execute-playwright', 'execute-business-central'],
      expectedFailureMeans: operatorAuthUnblockStep,
    }));
    steps.push(step('run-command', {
      command: 'npm run auth:bc:probe',
      reason: 'Run a short attended Playwright auth probe when a human believes login is complete, so repeated login waits are avoided.',
      allowed: true,
      requiredBefore: ['npm run auth:bc:open-login', 'execute-playwright', 'execute-business-central'],
      expectedFailureMeans: 'The Playwright auth window is still before Business Central shell; complete Login/MFA in that window or avoid rerunning long auth loops.',
    }));
    steps.push(step('run-command', {
      command: 'npm run auth:bc:reset-profile',
      reason: 'Dry-run the ignored local Playwright auth profile reset if repeated interactive attempts stay on Microsoft sign-in.',
      allowed: true,
      requiredBefore: ['npm run auth:bc:open-login'],
      expectedFailureMeans: 'Do not delete auth artifacts automatically; use -- --confirm only when the operator intentionally wants a fresh Playwright auth profile.',
    }));
    steps.push(step('run-command', {
      command: 'npm run auth:bc:open-login',
      reason: 'Open the Playwright auth profile with a bounded attended handoff when the operator is ready to complete Login/MFA.',
      allowed: true,
      requiredBefore: ['npm run auth:bc:check', 'execute-playwright', 'execute-business-central'],
      expectedFailureMeans: 'Login/MFA still did not reach Business Central shell in the Playwright auth window; do not run BC workflows. For a longer attended handoff, set BC_AUTH_OPEN_LOGIN_TIMEOUT_MS explicitly.',
    }));
    steps.push(step('run-command', {
      command: 'npm run auth:bc:open-login-detached',
      reason: 'Open the same Playwright auth profile in a detached browser when bounded handoffs repeatedly close before Login/MFA can be completed.',
      allowed: true,
      requiredBefore: ['npm run auth:bc:capture-detached', 'npm run auth:bc:check', 'execute-playwright', 'execute-business-central'],
      expectedFailureMeans: 'Detached login only prepares the persistent profile. Close the browser after Business Central shell loads, then run npm run auth:bc:capture-detached to verify and capture storage state.',
    }));
  }
}

for (const path of dryRun.filesToRead ?? []) {
  steps.push(step('read-file', {
    path,
    reason: 'Required by active case mustRead within dry-run budget.',
    allowed: true,
  }));
}

for (const skill of dryRun.selectedSkills ?? []) {
  steps.push(step('load-skill', {
    path: `.agent/skills/${skill}.md`,
    skill,
    reason: 'Selected by active case and dry-run budget.',
    allowed: true,
  }));
}

for (const capability of dryRun.selectedCapabilities ?? []) {
  steps.push(step('inspect-capability', {
    capability: capability.id,
    maturity: capability.maturity,
    gates: capability.gates ?? [],
    reason: 'Capability relevant to selected taskClass or selected skills.',
    allowed: true,
  }));
}

steps.push(step('local-analysis', {
  caseId: activeCase.caseId ?? current.activeCase ?? '',
  reason: activeCase.goal ?? current.nextStep ?? 'Perform the selected local analysis only.',
  allowed: dryRun.canProceed === true && authBlockedBy.length === 0,
}));

steps.push(step('propose-playwright-change', {
  allowed: false,
  reason: 'Run-plan is plan-only. Playwright changes require a later explicit implementation step.',
}));

steps.push(step('execute-playwright', {
  allowed: false,
  reason: 'Run-plan must not start Playwright.',
}));

steps.push(step('execute-business-central', {
  allowed: false,
  reason: 'Run-plan must not open or operate Business Central.',
}));

steps.push(step('write-book-content', {
  allowed: false,
  reason: 'Run-plan must not change book content.',
}));

steps.push(step('state-update-plan', {
  allowed: true,
  reason: 'If local analysis changes project truth, propose state updates only; do not fabricate evidence.',
  targetFiles: [
    '.agent/state/last_run_summary.json',
    current.active_case_file ?? '',
  ].filter(Boolean),
}));

const approvalRequiredBefore = [];
if (dryRun.requiresHumanApproval) {
  approvalRequiredBefore.push('state-change');
}
approvalRequiredBefore.push('playwright', 'business-central', 'posting', 'book-edit');

const canProceed = dryRun.canProceed === true;
const canProceedWithAuth = canProceed && authBlockedBy.length === 0;
const runPlan = {
  schemaVersion: 1,
  purpose: 'autopilot-run-plan',
  runPlanId: `${activeCase.caseId ?? current.activeCase ?? 'UNKNOWN'}-PLAN`,
  caseId: activeCase.caseId ?? current.activeCase ?? '',
  sourceDryRun: {
    canProceed: dryRun.canProceed,
    selectedTaskClass: dryRun.selectedTaskClass,
    selectedModelClass: dryRun.selectedModelClass,
    budgetProfile: dryRun.budgetProfile,
    requiresHumanApproval: dryRun.requiresHumanApproval,
  },
  needsBusinessCentralAuth,
  contextAuthGate: contextAuthGate
    ? {
        decision: contextAuthGate.decision ?? '',
        requiresAuth: contextAuthGate.requiresAuth === true,
        canRunBusinessCentralWorkflows: contextAuthGate.canRunBusinessCentralWorkflows === true,
        blockedBy: contextAuthGate.blockedBy ?? [],
        nextSafeAction: contextAuthGate.nextSafeAction ?? '',
        preferredAuthHandoff: contextAuthGate.preferredAuthHandoff ?? '',
        targetInstance: contextAuthGate.target?.instance ?? contextAuthGate.authState?.expectedInstance ?? '',
        targetCompany: contextAuthGate.target?.company ?? contextAuthGate.authState?.expectedCompany ?? '',
      }
    : null,
  authCheck: authCheck
    ? {
        canUseStoredAuth: authCheck.canUseStoredAuth,
        exitCode: authCheck.exitCode,
        blockedBy: authBlockedBy,
        authFile: authCheck.output?.authFile ?? 'playwright/.auth/bc-user.json',
        authMetaFile: authCheck.output?.authMetaFile ?? 'playwright/.auth/bc-user.meta.json',
        hasShellValidationMeta: authCheck.output?.hasShellValidationMeta ?? false,
        expectedInstance: authCheck.output?.expectedInstance ?? '',
        expectedCompany: authCheck.output?.expectedCompany ?? '',
        shellValidationMeta: authCheck.output?.shellValidationMeta ?? null,
        nextStep: authCheck.output?.nextStep ?? authUnblockStep,
      }
    : null,
  authDoctor: authDoctor
    ? {
        exitCode: authDoctor.exitCode,
        decision: authDoctor.output?.decision ?? '',
        operatorActionRequired,
        operatorAction,
        nextSafeAction: authDoctor.output?.nextSafeAction ?? '',
      }
    : null,
  canProceed: canProceedWithAuth,
  canProceedMeaning: 'local-plan-only; not Business Central live permission',
  liveGate,
  steps,
  blockedLiveActions,
  approvalRequiredBefore: unique(approvalRequiredBefore),
  safetyGates: dryRun.safetyGates ?? [],
  stopConditions: unique([
    ...(dryRun.stopConditions ?? []),
    ...authBlockedBy.map((blocker) => `auth:${blocker}`),
    ...(operatorActionRequired ? ['auth:operator-action-required'] : []),
  ]),
  validationCommands: [
    'npm run agent:preflight',
    'npm run agent:context',
    'npm run agent:dry-run',
    'npm run agent:run-plan',
    ...(needsBusinessCentralAuth ? ['npm run auth:bc:check'] : []),
    ...(authRecoveryNeeded ? ['npm run auth:bc:target'] : []),
    ...(authRecoveryNeeded ? ['npm run auth:bc:doctor'] : []),
    ...(authRecoveryNeeded ? ['npm run auth:bc:probe'] : []),
    'npm run check:encoding',
    'git diff --check',
  ],
  nextSafeAction: canProceedWithAuth
    ? 'Execute only the allowed local-analysis steps. Do not run Playwright or Business Central.'
    : operatorActionRequired
      ? operatorAuthUnblockStep
    : contextAuthBlocked
      ? operatorAuthUnblockStep
    : authBlockedBy.length
      ? authUnblockStep
      : 'Resolve dry-run stopConditions before local analysis.',
};

console.log(JSON.stringify(runPlan, null, 2));
