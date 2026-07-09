import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/master-data-customer-new-dropdown-template-cancelsafe-readfirst.spec.ts';
const currentPath = '.agent/state/current.json';
const casePath = '.agent/state/cases/master-data-customer-new-dropdown-template-cancelsafe-readfirst.json';
const readinessScript = 'scripts/agent/read-first-no-write-case-readiness-check.mjs';
const CASE_ID = 'MASTER-DATA-CUSTOMER-NEW-DROPDOWN-TEMPLATE-CANCELSAFE-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const MIN_LIVE_AUTH_EXPIRES_IN_HOURS = 1;

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const listOnly = rawArgs.includes('--list');
const checkOnly = rawArgs.includes('--check');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');

function commandName(base) {
  return process.platform === 'win32' && ['npm', 'npx'].includes(base) ? `${base}.cmd` : base;
}

function run(base, args, options = {}) {
  return spawnSync(commandName(base), args, {
    cwd: process.cwd(),
    stdio: options.stdio ?? 'pipe',
    shell: process.platform === 'win32',
    env: { ...process.env, ...(options.env ?? {}) },
    ...(options.stdio === 'inherit' ? {} : { encoding: 'utf8' })
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
  if (!existsSync(specPath)) return { ready: false, blocker: 'spec-missing' };

  const current = JSON.parse(readFileSync(currentPath, 'utf8'));
  const caseFile = JSON.parse(readFileSync(casePath, 'utf8'));
  if (current.activeCase !== CASE_ID || current.nextCase !== CASE_ID) {
    return { ready: false, blocker: 'customer-cancelsafe-readfirst-not-active-case' };
  }
  if (current.instance !== EXPECTED_INSTANCE || current.company !== TARGET_COMPANY) {
    return { ready: false, blocker: 'current-target-mismatch' };
  }
  if (caseFile.caseType !== 'read-first-no-write') {
    return { ready: false, blocker: 'case-is-not-read-first-no-write' };
  }
  for (const action of ['create-master-data', 'edit-master-data', 'save-record', 'change-template', 'type-business-central-values']) {
    if (!(caseFile.forbiddenActions ?? []).includes(action)) {
      return { ready: false, blocker: `case-missing-forbidden-action-${action}` };
    }
  }
  return { ready: true, blocker: '' };
}

if (help) {
  console.log(`MASTER-DATA customer New/Neu cancel-safe read-first runner

Usage:
  node scripts/agent/run-master-data-customer-new-dropdown-template-cancelsafe-readfirst.mjs --check
  node scripts/agent/run-master-data-customer-new-dropdown-template-cancelsafe-readfirst.mjs --list
  node scripts/agent/run-master-data-customer-new-dropdown-template-cancelsafe-readfirst.mjs --live-approved

This runner inspects only the Debitoren/Customers New/Neu and safe menu boundary in playthru / UNIVERSAARL-DE.
It must not type values, select templates, create records, save, finish, preview post or post.`);
  process.exit(0);
}

if (listOnly) {
  exitWith(run('npx', ['playwright', 'test', '--list', specPath], { stdio: 'inherit' }));
}

const localCase = localCaseStatus();
const readiness = run('node', [readinessScript]);
let readinessStatus = null;
try {
  readinessStatus = parseJsonOutput('read-first-no-write-case-readiness-check', readiness.stdout ?? '');
} catch (error) {
  if (readiness.status !== 0) {
    printChildFailure('read-first-no-write-case-readiness-check', readiness);
    process.exit(typeof readiness.status === 'number' ? readiness.status : 1);
  }
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const auth = run('npm', ['run', '--silent', 'auth:bc:check']);
let authStatus = null;
try {
  authStatus = parseJsonOutput('auth:bc:check', auth.stdout ?? '');
} catch (error) {
  if (auth.status !== 0) {
    printChildFailure('auth:bc:check', auth);
    process.exit(typeof auth.status === 'number' ? auth.status : 1);
  }
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const authMeetsLiveWindow =
  authStatus.canUseStoredAuth === true &&
  Number.isFinite(Number(authStatus.expiresInHours)) &&
  Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS;
const blockedBy = [
  localCase.ready ? '' : localCase.blocker,
  readinessStatus.ok === true ? '' : 'case-readiness-check-failed',
  authMeetsLiveWindow ? '' : 'stored-auth-not-usable-or-too-close-to-expiry'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'master-data-customer-new-dropdown-template-cancelsafe-readfirst-runner-check',
        caseId: CASE_ID,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        localCaseReady: localCase.ready,
        readinessCheckOk: readinessStatus.ok === true,
        authUsableForReadFirst: authStatus.canUseStoredAuth === true,
        authExpiresInHours: authStatus.expiresInHours ?? null,
        authMinExpiresInHours: MIN_LIVE_AUTH_EXPIRES_IN_HOURS,
        authMeetsLiveWindow,
        canRunNow: blockedBy.length === 0,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy,
        nextStep:
          blockedBy.length === 0
            ? 'Run with --live-approved for exactly one Debitoren/Customers cancel-safe read-first proof.'
            : 'Fix readiness, active case or auth before opening Business Central.'
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
        purpose: 'master-data-customer-new-dropdown-template-cancelsafe-readfirst-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run this read-first proof before active case, usable auth, readiness and --live-approved.'
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
      MASTER_DATA_CUSTOMER_CANCELSAFE_RUNNER_GUARD_CHECKED: '1',
      MASTER_DATA_CUSTOMER_CANCELSAFE_LIVE_APPROVED: '1'
    }
  })
);
