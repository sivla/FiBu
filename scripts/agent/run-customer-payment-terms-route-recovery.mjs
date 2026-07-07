import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/customer-payment-terms-route-recovery.spec.ts';
const casePath = '.agent/state/cases/customer-payment-terms-write-gate-recovery.json';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const ACTIVE_CASE = 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY';
const MIN_LIVE_AUTH_EXPIRES_IN_HOURS = 1;

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const listOnly = rawArgs.includes('--list');
const checkOnly = rawArgs.includes('--check');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');

function readDotEnv() {
  if (!existsSync('.env')) return {};
  const env = {};
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function targetUrlFromConfiguredUrl() {
  const localEnv = readDotEnv();
  const env = { ...localEnv, ...process.env };
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

function activeCaseStatus() {
  if (!existsSync(casePath)) return { ready: false, blocker: 'case-file-missing' };
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(casePath, 'utf8'));
  } catch {
    return { ready: false, blocker: 'case-file-invalid-json' };
  }
  const forbidden = new Set(parsed.forbiddenActions ?? []);
  const allowed = new Set(parsed.allowedActions ?? []);
  const ready =
    parsed.caseId === ACTIVE_CASE &&
    parsed.instance === EXPECTED_INSTANCE &&
    parsed.company === TARGET_COMPANY &&
    allowed.has('open-payment-terms-page-readonly') &&
    forbidden.has('create-or-edit-payment-term') &&
    forbidden.has('edit-customer') &&
    forbidden.has('preview-posting') &&
    forbidden.has('post') &&
    forbidden.has('api-shortcut') &&
    forbidden.has('use-confidential-real-customer-data');
  return {
    ready,
    blocker: ready ? '' : 'case-file-does-not-match-payment-terms-route-recovery'
  };
}

if (help) {
  console.log(`CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY guarded runner

Usage:
  node scripts/agent/run-customer-payment-terms-route-recovery.mjs --check
  node scripts/agent/run-customer-payment-terms-route-recovery.mjs --list
  node scripts/agent/run-customer-payment-terms-route-recovery.mjs --live-approved

This runner is read-first only. It captures Business Central route evidence for Zahlungsbedingungen / Payment Terms and must not create or edit setup.`);
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
  activeCaseMatches ? '' : 'active-case-is-not-customer-payment-terms-write-gate-recovery',
  targetUrl ? '' : 'target-url-could-not-be-built-from-configured-url',
  authMeetsLiveWindow ? '' : 'storage-state-expires-before-required-window',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'customer-payment-terms-route-recovery-check',
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
        purpose: 'customer-payment-terms-route-recovery-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run route recovery before case gate, live gate, usable auth and --live-approved.'
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
      CUSTOMER_PAYMENT_TERMS_RECOVERY_RUNNER_GUARD_CHECKED: '1',
      CUSTOMER_PAYMENT_TERMS_RECOVERY_LIVE_APPROVED: '1',
      CUSTOMER_PAYMENT_TERMS_RECOVERY_BC_TARGET_URL: targetUrl
    }
  })
);
