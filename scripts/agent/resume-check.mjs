import { spawnSync } from 'node:child_process';

const specPath = 'playwright/projects/fibu-book5/tests/target-075-chart-of-accounts-reopen-and-setup-consistency-check.spec.ts';
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const nodeCmd = process.execPath;

function runStep(id, command, args, options = {}) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    shell: false
  });
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
    ok: (result.status ?? 0) === 0,
    parsedJson,
    stdoutTail: options.keepStdout ? stdout.slice(-2000) : undefined,
    stderrTail: stderr ? stderr.slice(-2000) : undefined
  };
}

const steps = [
  runStep('agent-preflight', npmCmd, ['run', '--silent', 'agent:preflight'], { keepStdout: true }),
  runStep('quality-audit', nodeCmd, ['scripts/agent/quality-audit.mjs'], { parseJson: true }),
  runStep('target-075-readiness', nodeCmd, ['scripts/agent/target-075-readiness-check.mjs'], { parseJson: true }),
  runStep('encoding', npmCmd, ['run', '--silent', 'check:encoding'], { keepStdout: true }),
  runStep('target-075-playwright-list', npxCmd, ['playwright', 'test', '--list', specPath], { keepStdout: true })
];

const failed = steps.filter((step) => !step.ok);
const qualityAudit = steps.find((step) => step.id === 'quality-audit')?.parsedJson;
const readiness = steps.find((step) => step.id === 'target-075-readiness')?.parsedJson;
const qualityRiskIds = (qualityAudit?.risks ?? []).map((risk) => risk.id);

const warnings = [];
if (qualityRiskIds.includes('narrow-tsconfig')) {
  warnings.push('tsconfig is still intentionally not treated as full project health proof.');
}
if (qualityRiskIds.includes('auth-check-not-enforced')) {
  warnings.push('Auth freshness remains a live-run precondition; this check does not open or validate live auth.');
}
if (qualityRiskIds.includes('playwright-flake-surface')) {
  warnings.push('Legacy Playwright risk surface remains; TARGET-075 stays read-only.');
}

const output = {
  schemaVersion: 1,
  purpose: 'autopilot-resume-check',
  caseId: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
  canResumeAfterFreezeLift: failed.length === 0 && readiness?.canProceedAfterFreezeLift === true,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  authFilesOpened: false,
  steps: steps.map((step) => ({
    id: step.id,
    ok: step.ok,
    exitCode: step.exitCode,
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
  warnings,
  errors: failed.map((step) => `${step.id} failed with exit code ${step.exitCode}`),
  nextStep:
    failed.length === 0 && readiness?.canProceedAfterFreezeLift === true
      ? 'All local resume checks passed. Freeze lift and live auth/context validation are still required before running TARGET-075.'
      : 'Fix failed local resume checks before considering TARGET-075.'
};

console.log(JSON.stringify(output, null, 2));

if (failed.length || readiness?.canProceedAfterFreezeLift !== true) process.exitCode = 1;
