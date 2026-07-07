import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/customer-u-cust-100-setup-reopen-proof.spec.ts';
const casePath = '.agent/state/cases/customer-u-cust-100-setup-reopen-proof.json';
const sourceResultPath = 'playwright/projects/fibu-book5/evidence/customer-setup-value-write-gate/result.json';
const liveResultPath = 'playwright/projects/fibu-book5/evidence/customer-u-cust-100-setup-reopen-proof/result.json';
const ACTIVE_CASE = 'CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const MIN_LIVE_AUTH_EXPIRES_IN_HOURS = 1;

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const checkOnly = rawArgs.includes('--check');
const listOnly = rawArgs.includes('--list');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');

function readDotEnv() {
  if (!existsSync('.env')) return {};
  const env = {};
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function targetUrlFromConfiguredUrl() {
  const env = { ...readDotEnv(), ...process.env };
  const rawUrl = env.BC_AUTH_URL ?? env.FIBU_BOOK5_BC_URL ?? env.BC_URL ?? '';
  if (!rawUrl) return '';
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return '';
  }
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (!pathParts.length) return '';
  pathParts[pathParts.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${pathParts.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

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
    timeout: options.timeoutMs,
    ...(inheritedStdio ? {} : { encoding: 'utf8' })
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

function activeCaseStatus() {
  if (!existsSync(casePath)) return { ready: false, blocker: 'case-file-missing' };
  if (!existsSync(sourceResultPath)) return { ready: false, blocker: 'source-result-missing' };
  try {
    const parsed = readJson(casePath);
    const sourceResult = readJson(sourceResultPath);
    const forbidden = new Set(parsed.forbiddenActions ?? []);
    const expected = parsed.expectedVisibleValues ?? {};
    const ready =
      parsed.caseId === ACTIVE_CASE &&
      parsed.instance === EXPECTED_INSTANCE &&
      parsed.company === TARGET_COMPANY &&
      expected.customerPostingGroup === 'INLAND' &&
      expected.genBusinessPostingGroup === 'INLAND' &&
      expected.paymentTermsCode === 'NET30' &&
      forbidden.has('change-customer-fields') &&
      forbidden.has('preview-posting') &&
      forbidden.has('post') &&
      forbidden.has('api-shortcut') &&
      sourceResult.company === TARGET_COMPANY &&
      sourceResult.instance === EXPECTED_INSTANCE &&
      sourceResult.safeToFinalizeState === true &&
      sourceResult.requiresReview === false;
    return {
      ready,
      blocker: ready ? '' : 'case-file-or-source-result-does-not-match-readonly-reopen-proof'
    };
  } catch {
    return { ready: false, blocker: 'case-or-source-result-invalid-json' };
  }
}

if (help) {
  console.log(`CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF guarded runner

Usage:
  node scripts/agent/run-customer-u-cust-100-setup-reopen-proof.mjs --check
  node scripts/agent/run-customer-u-cust-100-setup-reopen-proof.mjs --list
  node scripts/agent/run-customer-u-cust-100-setup-reopen-proof.mjs --live-approved

Read-only proof only: opens U-CUST-100, expands Fakturierung/Zahlungen, captures visible INLAND/INLAND/NET30 screenshots, and writes result evidence.`);
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

const activeCase = activeCaseStatus();
const targetUrl = targetUrlFromConfiguredUrl();
const activeCaseMatches = contextStatus.details?.activeCase === ACTIVE_CASE;
const liveGateAllowsNow = contextStatus.details?.canRunBusinessCentralWorkflows === true;
const authMeetsLiveWindow =
  authStatus.canUseStoredAuth === true &&
  Number.isFinite(Number(authStatus.expiresInHours)) &&
  Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS &&
  !((authStatus.blockedBy ?? []).includes('storage-state-expires-before-required-window'));
const blockedBy = [
  activeCase.ready ? '' : activeCase.blocker,
  activeCaseMatches ? '' : 'active-case-is-not-customer-u-cust-100-setup-reopen-proof',
  targetUrl ? '' : 'target-url-could-not-be-built-from-configured-url',
  authMeetsLiveWindow ? '' : 'storage-state-expires-before-required-window',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'customer-u-cust-100-setup-reopen-proof-live-check',
        caseId: ACTIVE_CASE,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        casePath,
        activeCaseReady: activeCase.ready,
        activeCaseMatches,
        targetUrlReady: Boolean(targetUrl),
        authStateChecked: true,
        authMinExpiresInHours: MIN_LIVE_AUTH_EXPIRES_IN_HOURS,
        authExpiresInHours: authStatus.expiresInHours,
        authMeetsLiveWindow,
        canRunNow: blockedBy.length === 0,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy
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
        purpose: 'customer-u-cust-100-setup-reopen-proof-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run read-only customer setup reopen proof before active case, live gate, usable auth and --live-approved.'
      },
      null,
      2
    )
  );
  process.exit(2);
}

if (existsSync(liveResultPath)) {
  try {
    unlinkSync(liveResultPath);
  } catch {
    console.error(`Could not remove stale live result before run: ${liveResultPath}`);
    process.exit(1);
  }
}

exitWith(
  run('npx', ['playwright', 'test', specPath], {
    stdio: 'inherit',
    timeoutMs: 300_000,
    env: {
      CUSTOMER_SETUP_REOPEN_PROOF_RUNNER_GUARD_CHECKED: '1',
      CUSTOMER_SETUP_REOPEN_PROOF_LIVE_APPROVED: '1',
      CUSTOMER_SETUP_REOPEN_PROOF_BC_TARGET_URL: targetUrl
    }
  })
);
