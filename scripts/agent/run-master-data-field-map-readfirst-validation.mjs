import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/master-data-field-map-readfirst-validation.spec.ts';
const currentPath = '.agent/state/current.json';
const casePath = '.agent/state/cases/master-data-field-map-readfirst-validation.json';
const readinessScript = 'scripts/agent/master-data-field-map-readfirst-validation-check.mjs';
const CASE_ID = 'MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';

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
    return { ready: false, blocker: 'master-data-field-map-readfirst-validation-not-active-case' };
  }
  if (current.instance !== EXPECTED_INSTANCE || current.company !== TARGET_COMPANY) {
    return { ready: false, blocker: 'current-target-mismatch' };
  }
  if (caseFile.caseType !== 'read-first-no-write') {
    return { ready: false, blocker: 'case-is-not-read-first-no-write' };
  }
  for (const action of ['create-master-data', 'edit-master-data', 'save-record', 'change-template']) {
    if (!(caseFile.forbiddenActions ?? []).includes(action)) {
      return { ready: false, blocker: `case-missing-forbidden-action-${action}` };
    }
  }
  return { ready: true, blocker: '' };
}

if (help) {
  console.log(`MASTER-DATA field-map read-first validation runner

Usage:
  node scripts/agent/run-master-data-field-map-readfirst-validation.mjs --check
  node scripts/agent/run-master-data-field-map-readfirst-validation.mjs --list
  node scripts/agent/run-master-data-field-map-readfirst-validation.mjs --live-approved

This runner may only inspect Customers, Vendors and Items read-first in playthru / UNIVERSAARL-DE.
It must not create records, edit records, save, change templates, create documents, preview post or post.`);
  process.exit(0);
}

if (listOnly) {
  exitWith(run('npx', ['playwright', 'test', '--list', specPath], { stdio: 'inherit' }));
}

const localCase = localCaseStatus();
const readiness = run('node', [readinessScript]);
let readinessStatus = null;
try {
  readinessStatus = parseJsonOutput('master-data-field-map-readfirst-validation-check', readiness.stdout ?? '');
} catch (error) {
  if (readiness.status !== 0) {
    printChildFailure('master-data-field-map-readfirst-validation-check', readiness);
    process.exit(typeof readiness.status === 'number' ? readiness.status : 1);
  }
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const blockedBy = [
  localCase.ready ? '' : localCase.blocker,
  readinessStatus.ok === true ? '' : 'case-readiness-check-failed',
  readinessStatus.auth?.canUseStoredAuth === true ? '' : 'stored-auth-not-usable'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'master-data-field-map-readfirst-validation-runner-check',
        caseId: CASE_ID,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        localCaseReady: localCase.ready,
        readinessCheckOk: readinessStatus.ok === true,
        authUsableForReadFirst: readinessStatus.auth?.canUseStoredAuth === true,
        authExpiresInHours: readinessStatus.auth?.expiresInHours ?? null,
        canRunNow: blockedBy.length === 0,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy,
        nextStep:
          blockedBy.length === 0
            ? 'Run with --live-approved for exactly one read-first/no-write validation.'
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
        purpose: 'master-data-field-map-readfirst-validation-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run read-first proof before active case, usable auth, readiness and --live-approved.'
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
      MASTER_DATA_FIELD_MAP_READFIRST_VALIDATION_RUNNER_GUARD_CHECKED: '1',
      MASTER_DATA_FIELD_MAP_READFIRST_VALIDATION_LIVE_APPROVED: '1'
    }
  })
);
