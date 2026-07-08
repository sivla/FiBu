import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/foundation-setup-package-existing-metadata-readfirst.spec.ts';
const currentPath = '.agent/state/current.json';
const casePath = '.agent/state/cases/foundation-setup-package-existing-metadata-readfirst.json';
const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-EXISTING-METADATA-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const listOnly = rawArgs.includes('--list');
const checkOnly = rawArgs.includes('--check');

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
  if (!existsSync(currentPath)) return { ready: false, blocker: 'current-state-missing' };
  if (!existsSync(casePath)) return { ready: false, blocker: 'case-file-missing' };
  const current = JSON.parse(readFileSync(currentPath, 'utf8'));
  if ((current.activeCase ?? current.nextCase ?? '') !== CASE_ID) {
    return { ready: false, blocker: 'existing-package-metadata-readfirst-not-active-case' };
  }
  const caseFile = JSON.parse(readFileSync(casePath, 'utf8'));
  if (caseFile.instance !== EXPECTED_INSTANCE || caseFile.company !== TARGET_COMPANY) {
    return { ready: false, blocker: 'case-target-mismatch' };
  }
  if (caseFile.effectiveBcActionsAllowed !== false) {
    return { ready: false, blocker: 'case-must-stay-readfirst-no-write' };
  }
  return { ready: true, blocker: '' };
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
const blockedBy = [
  localCase.ready ? '' : localCase.blocker,
  authStatus.canUseStoredAuth === true ? '' : 'stored-auth-not-usable',
  contextStatus.details?.canRunBusinessCentralWorkflows === true ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'foundation-setup-package-existing-metadata-readfirst-check',
        caseId: CASE_ID,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        localCaseReady: localCase.ready,
        authStateChecked: true,
        authExpiresInHours: authStatus.expiresInHours,
        authUsableForReadFirst: authStatus.canUseStoredAuth === true,
        canRunNow: blockedBy.length === 0,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy,
        nextStep: 'Run existing package metadata read-first only with --live-approved.'
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
        purpose: 'foundation-setup-package-existing-metadata-readfirst-guard',
        canRun: false,
        liveApproved,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run before case selection, usable auth, live gate and --live-approved.'
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
      FOUNDATION_PACKAGE_EXISTING_METADATA_RUNNER_GUARD_CHECKED: '1',
      FOUNDATION_PACKAGE_EXISTING_METADATA_LIVE_APPROVED: '1'
    }
  })
);
