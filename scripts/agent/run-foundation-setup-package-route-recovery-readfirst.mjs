import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/foundation-setup-package-route-recovery-readfirst.spec.ts';
const currentPath = '.agent/state/current.json';
const casePath = '.agent/state/cases/foundation-setup-package-route-recovery-readfirst.json';
const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-ROUTE-RECOVERY-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const listOnly = rawArgs.includes('--list');
const checkOnly = rawArgs.includes('--check');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');

function commandName(base) {
  return process.platform === 'win32' ? `${base}.cmd` : base;
}

function run(base, args, options = {}) {
  const inheritedStdio = options.stdio === 'inherit';
  return spawnSync(commandName(base), args, {
    cwd: process.cwd(),
    stdio: options.stdio ?? 'pipe',
    shell: process.platform === 'win32',
    env: { ...process.env, ...(options.env ?? {}) },
    ...(inheritedStdio ? {} : { encoding: 'utf8' })
  });
}

function parseJsonOutput(label, stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error(`${label} did not print JSON output`);
  return JSON.parse(stdout.slice(start));
}

function printChildFailure(label, result) {
  if (result.stdout) process.stderr.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) process.stderr.write(`${label}: ${result.error.message}\n`);
}

function exitWith(result) {
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(typeof result.status === 'number' ? result.status : 1);
}

function localCaseStatus() {
  if (!existsSync(currentPath)) {
    return { ready: false, blocker: 'current-state-missing', nextStep: 'Restore .agent/state/current.json.' };
  }
  if (!existsSync(casePath)) {
    return { ready: false, blocker: 'case-file-missing', nextStep: `Create ${casePath}.` };
  }
  const current = JSON.parse(readFileSync(currentPath, 'utf8'));
  const activeCase = current.activeCase ?? current.nextCase ?? '';
  if (activeCase !== CASE_ID) {
    return {
      ready: false,
      blocker: 'foundation-package-route-recovery-not-active-case',
      nextStep: `Select ${CASE_ID} as activeCase before running this live proof.`
    };
  }
  const caseFile = JSON.parse(readFileSync(casePath, 'utf8'));
  if (caseFile.instance !== EXPECTED_INSTANCE || caseFile.company !== TARGET_COMPANY) {
    return {
      ready: false,
      blocker: 'case-target-mismatch',
      nextStep: `Fix ${casePath} to ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`
    };
  }
  if (caseFile.effectiveBcActionsAllowed !== false) {
    return {
      ready: false,
      blocker: 'case-must-stay-readfirst-no-write',
      nextStep: 'This recovery must remain read-first/no-write.'
    };
  }
  return {
    ready: true,
    blocker: '',
    nextStep: 'Run the read-first route recovery only with --live-approved.'
  };
}

if (help) {
  console.log(`FOUNDATION package route recovery runner

Usage:
  node scripts/agent/run-foundation-setup-package-route-recovery-readfirst.mjs --check
  node scripts/agent/run-foundation-setup-package-route-recovery-readfirst.mjs --list
  node scripts/agent/run-foundation-setup-package-route-recovery-readfirst.mjs --live-approved

This runner may only recover the read-only Configuration Packages page route in playthru / UNIVERSAARL-DE.
It must not create, open-for-edit, import, export, validate, apply packages, get tables or write setup values.`);
  process.exit(0);
}

if (listOnly) {
  exitWith(run('npx', ['playwright', 'test', '--list', specPath], { stdio: 'inherit' }));
}

const contextTest = run('npm', ['run', '--silent', 'agent:context:test']);
if (contextTest.status !== 0) {
  printChildFailure('agent:context:test', contextTest);
  process.exit(typeof contextTest.status === 'number' ? contextTest.status : 1);
}

let contextStatus;
try {
  contextStatus = parseJsonOutput('agent:context:test', contextTest.stdout);
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const auth = run('npm', ['run', '--silent', 'auth:bc:check']);
let authStatus;
try {
  authStatus = parseJsonOutput('auth:bc:check', auth.stdout);
} catch (error) {
  if (auth.status !== 0) {
    printChildFailure('auth:bc:check', auth);
    process.exit(typeof auth.status === 'number' ? auth.status : 1);
  }
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const localCase = localCaseStatus();
const liveGateAllowsNow = contextStatus.details?.canRunBusinessCentralWorkflows === true;
const authUsableForReadFirst = authStatus.canUseStoredAuth === true;
const blockedBy = [
  localCase.ready ? '' : localCase.blocker,
  authUsableForReadFirst ? '' : 'stored-auth-not-usable',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'foundation-setup-package-route-recovery-readfirst-check',
        caseId: CASE_ID,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        localCaseReady: localCase.ready,
        authStateChecked: true,
        authStateCheckScript: 'auth:bc:check',
        authExpiresInHours: authStatus.expiresInHours,
        authUsableForReadFirst,
        canRunNow: blockedBy.length === 0,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy,
        nextStep: localCase.nextStep
      },
      null,
      2
    )
  );
  process.exit(0);
}

if (!liveApproved || blockedBy.length > 0) {
  console.error(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'foundation-setup-package-route-recovery-readfirst-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run live recovery before case selection, usable auth, live gate and --live-approved.'
      },
      null,
      2
    )
  );
  process.exit(2);
}

exitWith(
  run('npx', ['playwright', 'test', specPath], {
    stdio: 'inherit',
    env: {
      FOUNDATION_PACKAGE_ROUTE_RECOVERY_RUNNER_GUARD_CHECKED: '1',
      FOUNDATION_PACKAGE_ROUTE_RECOVERY_LIVE_APPROVED: '1'
    }
  })
);
