import { spawnSync } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;

function runStep(id, command, args, options = {}) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    shell: process.platform === 'win32' && /\.cmd$/i.test(command)
  });
  const commandError = result.error?.message;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  let parsedJson = null;
  if (options.parseJson) {
    try {
      parsedJson = JSON.parse(stdout);
    } catch (error) {
      return {
        id,
        command: [command, ...args].join(' '),
        startedAt,
        exitCode: result.status ?? 1,
        ok: false,
        commandError,
        parseError: error.message,
        stdoutTail: stdout.slice(-2000),
        stderrTail: stderr.slice(-2000)
      };
    }
  }
  return {
    id,
    command: [command, ...args].join(' '),
    startedAt,
    exitCode: result.status ?? 0,
    ok: !commandError && (result.status ?? 0) === 0,
    commandError,
    parsedJson,
    stdoutTail: options.keepStdout ? stdout.slice(-2000) : undefined,
    stderrTail: stderr ? stderr.slice(-2000) : undefined
  };
}

const steps = [
  runStep('agent-preflight', npmCmd, ['run', '--silent', 'agent:preflight']),
  runStep('freeze-status', nodeCmd, ['scripts/agent/freeze-status-check.mjs'], { parseJson: true }),
  runStep('quality-audit', nodeCmd, ['scripts/agent/quality-audit.mjs'], { parseJson: true }),
  runStep('target-075-readiness', nodeCmd, ['scripts/agent/target-075-readiness-check.mjs'], { parseJson: true }),
  runStep('auth-state-check', npmCmd, ['run', '--silent', 'auth:bc:check'], { parseJson: true }),
  runStep('encoding', npmCmd, ['run', '--silent', 'check:encoding'], { keepStdout: true }),
  runStep('target-075-guarded-list', npmCmd, ['run', '--silent', 'fibu:target:foundation-consistency-pilot', '--', '--list'], {
    keepStdout: true
  })
];

const failed = steps.filter((step) => !step.ok);
const qualityAudit = steps.find((step) => step.id === 'quality-audit')?.parsedJson;
const readiness = steps.find((step) => step.id === 'target-075-readiness')?.parsedJson;
const authCheck = steps.find((step) => step.id === 'auth-state-check')?.parsedJson;
const qualityRiskIds = (qualityAudit?.risks ?? []).map((risk) => risk.id);

const warnings = [];
if (qualityRiskIds.includes('narrow-tsconfig')) {
  warnings.push('tsconfig is still intentionally not treated as full project health proof.');
}
if (qualityRiskIds.includes('auth-check-not-enforced')) {
  warnings.push(
    authCheck?.canUseStoredAuth === true
      ? 'Stored auth was checked locally; TARGET-075 must still validate the live Business Central shell after freeze lift.'
      : 'Stored auth is not usable; refresh Playwright auth before any live resume.'
  );
}
if (qualityRiskIds.includes('playwright-flake-surface')) {
  warnings.push('Legacy Playwright risk surface remains; TARGET-075 stays read-only.');
}

const output = {
  schemaVersion: 1,
  purpose: 'autopilot-resume-check',
  caseId: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
  canResumeAfterFreezeLift:
    failed.length === 0 && readiness?.canProceedAfterFreezeLift === true && authCheck?.canUseStoredAuth === true,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  authStateChecked: true,
  authSecretsPrinted: false,
  steps: steps.map((step) => ({
    id: step.id,
    ok: step.ok,
    exitCode: step.exitCode,
    commandError: step.commandError,
    parseError: step.parseError,
    stdoutTail: step.stdoutTail,
    stderrTail: step.stderrTail
  })),
  qualityAuditSummary: qualityAudit
    ? {
        filesScanned: qualityAudit.filesScanned,
        tsFilesInRepo: qualityAudit.tsFilesInRepo,
        tsconfigFileCount: qualityAudit.tsconfigFileCount,
        counts: qualityAudit.counts,
        risks: qualityAudit.risks
      }
    : null,
  target075Readiness: readiness
    ? {
        canProceedAfterFreezeLift: readiness.canProceedAfterFreezeLift,
        errors: readiness.errors,
        warnings: readiness.warnings,
        nextStep: readiness.nextStep
      }
    : null,
  authState: authCheck
    ? {
        canUseStoredAuth: authCheck.canUseStoredAuth,
        ageHours: authCheck.ageHours,
        maxAgeHours: authCheck.maxAgeHours,
        expectedInstance: authCheck.expectedInstance,
        expectedCompany: authCheck.expectedCompany,
        shellValidationMeta: authCheck.shellValidationMeta
          ? {
              generatedAt: authCheck.shellValidationMeta.generatedAt,
              host: authCheck.shellValidationMeta.host,
              environment: authCheck.shellValidationMeta.environment,
              company: authCheck.shellValidationMeta.company,
              matchedShellSignal: authCheck.shellValidationMeta.matchedShellSignal
            }
          : null,
        blockedBy: authCheck.blockedBy
      }
    : null,
  warnings,
  errors: failed.map((step) => `${step.id} failed with exit code ${step.exitCode}`),
  nextStep:
    failed.length === 0 && readiness?.canProceedAfterFreezeLift === true && authCheck?.canUseStoredAuth === true
      ? 'All local resume checks passed, including stored auth. Freeze lift and live shell/context validation are still required before running TARGET-075.'
      : 'Fix failed local resume checks before considering TARGET-075.'
};

console.log(JSON.stringify(output, null, 2));

if (failed.length || readiness?.canProceedAfterFreezeLift !== true || authCheck?.canUseStoredAuth !== true) {
  process.exitCode = 1;
}
