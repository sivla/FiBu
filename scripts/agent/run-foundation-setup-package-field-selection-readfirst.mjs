import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const specPath = 'playwright/projects/fibu-book5/tests/foundation-setup-package-field-selection-readfirst.spec.ts';
const casePath = '.agent/state/cases/foundation-setup-package-field-selection-readfirst.json';
const currentPath = '.agent/state/current.json';

const rawArgs = process.argv.slice(2);
const checkOnly = rawArgs.includes('--check');
const listOnly = rawArgs.includes('--list');
const liveApproved = rawArgs.includes('--live-approved');
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

function readJsonIfExists(path, errors, label) {
  if (!existsSync(path)) {
    errors.push(`${label}-missing`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    errors.push(`${label}-invalid-json`);
    return null;
  }
}

function localCaseStatus() {
  const errors = [];
  const warnings = [];
  const current = readJsonIfExists(currentPath, errors, 'current-state');
  const caseFile = readJsonIfExists(casePath, errors, 'case-file');
  if (!existsSync(specPath)) errors.push('live-spec-missing');

  if (current?.activeCase !== CASE_ID || current?.nextCase !== CASE_ID) {
    errors.push('field-selection-readfirst-not-active-case');
  }

  if (caseFile) {
    if (caseFile.caseId !== CASE_ID) errors.push('case-id-mismatch');
    if (caseFile.caseType !== 'read-first-no-write') errors.push('case-type-must-be-read-first-no-write');
    if (caseFile.instance !== EXPECTED_INSTANCE) errors.push('case-instance-mismatch');
    if (caseFile.company !== TARGET_COMPANY) errors.push('case-company-mismatch');

    const allowed = new Set(caseFile.allowedActions ?? []);
    for (const action of [
      'validate-playthru-context-readonly',
      'validate-universaarl-company-context-readonly',
      'inspect-existing-table-325-line-readonly',
      'inspect-field-selection-surface-readonly',
      'capture-screenshot-chain',
      'capture-visual-state-json',
      'write-readfirst-result-json'
    ]) {
      if (!allowed.has(action)) warnings.push(`case-allowed-actions-should-include-${action}`);
    }

    const forbidden = new Set(caseFile.forbiddenActions ?? []);
    for (const action of [
      'create-configuration-package',
      'rename-configuration-package',
      'edit-configuration-package-header',
      'get-tables',
      'add-table',
      'remove-table',
      'toggle-field-selection',
      'select-fields',
      'import-configuration-package',
      'export-configuration-package',
      'validate-configuration-package',
      'apply-configuration-package',
      'edit-in-excel',
      'write-setup',
      'create-master-data',
      'preview-posting',
      'post',
      'payment',
      'api-shortcut',
      'company-switch'
    ]) {
      if (!forbidden.has(action)) errors.push(`case-missing-forbidden-action-${action}`);
    }
  }

  return {
    ready: errors.length === 0,
    errors,
    warnings,
    nextStep:
      errors.length === 0
        ? 'Run the field-selection read-first proof only with --live-approved and stop before any field toggle/select/import/validate/apply/setup action.'
        : 'Fix case registration before opening Business Central.'
  };
}

if (help) {
  console.log(`FOUNDATION package field-selection read-first runner

Usage:
  node scripts/agent/run-foundation-setup-package-field-selection-readfirst.mjs --check
  node scripts/agent/run-foundation-setup-package-field-selection-readfirst.mjs --list
  node scripts/agent/run-foundation-setup-package-field-selection-readfirst.mjs --live-approved

This runner may only inspect the existing U-VAT325-DISC / Table 325 package field context read-only in playthru / UNIVERSAARL-DE.
It must not create packages, get tables, add/remove tables, toggle/select fields, import, export, validate, apply, edit in Excel or write setup values.`);
  process.exit(0);
}

if (listOnly) {
  exitWith(run('npx', ['playwright', 'test', '--list', specPath], { stdio: 'inherit' }));
}

const contextTest = run('npm', ['run', '--silent', 'agent:context:test']);
let contextStatus = null;
if (contextTest.status === 0) {
  try {
    contextStatus = parseJsonOutput('agent:context:test', contextTest.stdout);
  } catch {
    contextStatus = null;
  }
}

const auth = run('npm', ['run', '--silent', 'auth:bc:check']);
let authStatus = null;
if (auth.status === 0) {
  try {
    authStatus = parseJsonOutput('auth:bc:check', auth.stdout);
  } catch {
    authStatus = null;
  }
}

const localCase = localCaseStatus();
const liveGateAllowsNow = contextStatus?.details?.canRunBusinessCentralWorkflows === true;
const authUsableForReadFirst = authStatus?.canUseStoredAuth === true;
const blockedBy = [
  ...localCase.errors,
  contextTest.status === 0 ? '' : 'agent-context-test-failed',
  auth.status === 0 ? '' : 'auth-bc-check-failed',
  authUsableForReadFirst ? '' : 'stored-auth-not-usable',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'foundation-setup-package-field-selection-readfirst-check',
        caseId: CASE_ID,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        specPath,
        casePath,
        localCaseReady: localCase.ready,
        authStateChecked: true,
        authStateCheckScript: 'auth:bc:check',
        authExpiresInHours: authStatus?.expiresInHours ?? null,
        authUsableForReadFirst,
        liveGateAllowsNow,
        canRunNow: blockedBy.length === 0,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy,
        warnings: localCase.warnings,
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
        purpose: 'foundation-setup-package-field-selection-readfirst-guard',
        caseId: CASE_ID,
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run read-first proof before case selection, usable auth, live gate and --live-approved.'
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
      FOUNDATION_PACKAGE_FIELD_SELECTION_RUNNER_GUARD_CHECKED: '1',
      FOUNDATION_PACKAGE_FIELD_SELECTION_LIVE_APPROVED: '1'
    }
  })
);
