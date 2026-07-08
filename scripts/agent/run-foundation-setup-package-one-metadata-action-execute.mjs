import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-ONE-METADATA-ACTION-EXECUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const casePath = '.agent/state/cases/foundation-setup-package-one-metadata-action-execute.json';
const currentPath = '.agent/state/current.json';
const gateResultPath =
  'playwright/projects/fibu-book5/evidence/foundation-setup-package-one-metadata-action-write-gate/result.json';
const detailResultPath =
  'playwright/projects/fibu-book5/evidence/foundation-setup-package-card-detail-readfirst/result.json';
const MIN_LIVE_AUTH_EXPIRES_IN_HOURS = 1;

const rawArgs = process.argv.slice(2);
const checkOnly = rawArgs.includes('--check');
const liveApproved = rawArgs.includes('--live-approved');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');

function commandName(base) {
  return process.platform === 'win32' ? `${base}.cmd` : base;
}

function run(base, args) {
  return spawnSync(commandName(base), args, {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8'
  });
}

function parseJsonOutput(label, stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error(`${label} did not print JSON output`);
  return JSON.parse(stdout.slice(start));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readJsonIfExists(path, errors, label) {
  if (!existsSync(path)) {
    errors.push(`${label}-missing`);
    return null;
  }
  try {
    return readJson(path);
  } catch {
    errors.push(`${label}-invalid-json`);
    return null;
  }
}

function runJsonCheck(command, args, errors, label) {
  const result = run(command, args);
  if (result.status !== 0) {
    errors.push(`${label}-failed`);
    return null;
  }
  try {
    return parseJsonOutput(label, result.stdout);
  } catch {
    errors.push(`${label}-invalid-json-output`);
    return null;
  }
}

function evaluate() {
  const errors = [];
  const warnings = [];
  const current = readJsonIfExists(currentPath, errors, 'current-state');
  const caseFile = readJsonIfExists(casePath, errors, 'case-file');
  const gateResult = readJsonIfExists(gateResultPath, errors, 'write-gate-result');
  const detailResult = readJsonIfExists(detailResultPath, errors, 'card-detail-result');
  const rejectedRouteCheck = runJsonCheck('npm', ['run', '--silent', 'agent:rejected-routes:check'], errors, 'rejected-routes-check');

  let contextStatus = null;
  let authStatus = null;
  if (current?.activeCase === CASE_ID) {
    contextStatus = runJsonCheck('npm', ['run', '--silent', 'agent:context:test'], errors, 'agent-context-test');
    authStatus = runJsonCheck('npm', ['run', '--silent', 'auth:bc:check'], errors, 'auth-bc-check');
  }

  if (caseFile) {
    if (caseFile.caseId !== CASE_ID) errors.push('case-id-mismatch');
    if (caseFile.caseType !== 'write-gated-live-case') errors.push('case-type-must-be-write-gated-live-case');
    if (caseFile.instance !== EXPECTED_INSTANCE) errors.push('case-instance-mismatch');
    if (caseFile.company !== TARGET_COMPANY) errors.push('case-company-mismatch');
    if (caseFile.writeGate?.targetPackage !== 'U-VAT325-DISC') errors.push('target-package-mismatch');
    if (caseFile.writeGate?.targetTable?.tableId !== 325) errors.push('target-table-must-be-325');

    const forbidden = new Set(caseFile.forbiddenActions ?? []);
    for (const action of [
      'create-configuration-package',
      'get-tables',
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
      'api-shortcut',
      'company-switch'
    ]) {
      if (!forbidden.has(action)) errors.push(`case-missing-forbidden-action-${action}`);
    }
  }

  if (gateResult) {
    if (gateResult.decision !== 'ready-for-write-gate') errors.push('gate-result-not-ready-for-write-gate');
    if (gateResult.selectedFutureAction?.caseId !== CASE_ID) errors.push('gate-result-selected-future-action-mismatch');
    if (gateResult.businessCentralOpened !== false) errors.push('gate-result-must-be-local-no-live');
  }

  if (detailResult) {
    if (detailResult.resultStatus !== 'observed-package-detail-surface-readfirst') {
      errors.push('detail-readfirst-result-not-observed');
    }
    if (detailResult.packageCode !== 'U-VAT325-DISC') errors.push('detail-readfirst-package-code-mismatch');
    if (detailResult.packageDetailSurfaceVisible !== true) errors.push('detail-surface-not-visible');
    if (detailResult.setupChanged !== false || detailResult.setupChangeAttempted !== false) {
      errors.push('detail-readfirst-must-not-have-setup-change');
    }
  }

  const activeCaseMatches = current?.activeCase === CASE_ID;
  const preparedCaseMatches = current?.preparedNextCaseFile === casePath || current?.active_case_file === casePath;
  if (!preparedCaseMatches) errors.push('case-not-currently-prepared-or-active');

  const liveGateAllowsNow = contextStatus?.details?.canRunBusinessCentralWorkflows === true;
  const authMeetsLiveWindow =
    authStatus?.canUseStoredAuth === true &&
    Number.isFinite(Number(authStatus?.expiresInHours)) &&
    Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS &&
    !((authStatus.blockedBy ?? []).includes('storage-state-expires-before-required-window'));

  if (!activeCaseMatches) warnings.push('case-is-prepared-but-not-active');

  const liveBlockedBy = [
    activeCaseMatches ? '' : 'active-case-not-selected',
    preparedCaseMatches ? '' : 'case-not-prepared',
    liveGateAllowsNow ? '' : 'business-central-live-gate-not-checked-or-blocked',
    authMeetsLiveWindow ? '' : 'auth-not-checked-or-insufficient-live-window',
    'runner-live-implementation-not-yet-built'
  ].filter(Boolean);

  return {
    schemaVersion: 1,
    purpose: 'foundation-setup-package-one-metadata-action-execute-check',
    caseId: CASE_ID,
    expectedInstance: EXPECTED_INSTANCE,
    expectedCompany: TARGET_COMPANY,
    casePath,
    gateResultPath,
    detailResultPath,
    preparedCaseMatches,
    activeCaseMatches,
    rejectedRoutesRespected: rejectedRouteCheck?.ok === true,
    canPrepareFutureLiveRun: errors.length === 0,
    canRunNow: false,
    liveActionsExecuted: false,
    businessCentralOpened: false,
    playwrightLiveRunExecuted: false,
    authStateChecked: Boolean(authStatus),
    authMinExpiresInHours: MIN_LIVE_AUTH_EXPIRES_IN_HOURS,
    authExpiresInHours: authStatus?.expiresInHours ?? null,
    liveBlockedBy,
    errors,
    warnings,
    nextStep:
      errors.length === 0
        ? 'Prepared case is coherent. Build the real guarded Playwright implementation only when this case becomes active.'
        : 'Fix case/evidence/readiness errors before any live implementation or execution.'
  };
}

if (help) {
  console.log(`FOUNDATION package one-metadata-action guarded runner

Usage:
  node scripts/agent/run-foundation-setup-package-one-metadata-action-execute.mjs --check
  node scripts/agent/run-foundation-setup-package-one-metadata-action-execute.mjs --live-approved

This runner currently performs preflight only. It does not execute Business Central.
The future live case may only attempt one configuration-package metadata line:
  U-VAT325-DISC / Table 325 / VAT Posting Setup

Forbidden in this route: Get Tables, Import, Export, Validate, Apply, Edit in Excel, setup values, master data, documents, Preview Posting, Posting and API shortcuts.`);
  process.exit(0);
}

const status = evaluate();

if (checkOnly) {
  console.log(JSON.stringify(status, null, 2));
  process.exit(status.errors.length === 0 ? 0 : 2);
}

console.error(
  JSON.stringify(
    {
      ...status,
      canRun: false,
      liveApproved,
      liveBlockedBy: liveApproved
        ? status.liveBlockedBy
        : ['missing-live-approved-flag', ...status.liveBlockedBy],
      nextStep:
        'No live implementation is present yet. Do not execute Business Central from this runner until the actual one-action Playwright implementation is intentionally added.'
    },
    null,
    2
  )
);
process.exit(2);
