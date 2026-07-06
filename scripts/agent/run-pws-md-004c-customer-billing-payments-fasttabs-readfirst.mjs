import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/pws-md-004c-customer-billing-payments-fasttabs-readfirst.spec.ts';
const casePath = '.agent/state/cases/pws-md-004c-customer-billing-payments-fasttabs-readfirst.json';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
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

function caseStatus() {
  const missingBlocker = 'case-file-missing-or-not-planned';
  if (!existsSync(casePath)) {
    return {
      ready: false,
      blocker: missingBlocker,
      nextStep: 'Create the PWS-MD-004C case file before running the FastTab proof.'
    };
  }
  const text = readFileSync(casePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ready: false,
      blocker: 'case-file-invalid-json',
      nextStep: 'Fix the PWS-MD-004C case JSON before running the FastTab proof.'
    };
  }
  const correctCase = parsed.caseId === 'PWS-MD-004C-CUSTOMER-BILLING-PAYMENTS-FASTTABS-READFIRST';
  const readOnly = parsed.effectiveBcActionsAllowed === false;
  const correctTarget = parsed.instance === EXPECTED_INSTANCE && parsed.company === TARGET_COMPANY;
  const mayRun = parsed.mayRunPlaywright === true && parsed.mayOpenBusinessCentral === true;
  const ready = correctCase && readOnly && correctTarget && mayRun;
  return {
    ready,
    blocker: ready ? '' : 'case-file-does-not-match-readonly-target-gate',
    nextStep: ready
      ? 'When live gate is open, run PWS-MD-004C only with --live-approved as read-first/no-save.'
      : 'Align case file to playthru / UNIVERSAARL-DE read-first/no-write before running.'
  };
}

if (help) {
  console.log(`PWS-MD-004C guarded runner

Usage:
  node scripts/agent/run-pws-md-004c-customer-billing-payments-fasttabs-readfirst.mjs --check
  node scripts/agent/run-pws-md-004c-customer-billing-payments-fasttabs-readfirst.mjs --list
  node scripts/agent/run-pws-md-004c-customer-billing-payments-fasttabs-readfirst.mjs --live-approved

This runner opens existing U-CUST-100 and expands Fakturierung/Zahlungen read-only. It must not edit or save customer data.`);
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

const auth = run('npm', ['run', '--silent', 'auth:bc:check:overnight']);
let authStatus;
try {
  authStatus = parseJsonOutput('auth:bc:check:overnight', auth.stdout);
} catch (error) {
  if (auth.status !== 0) {
    printChildFailure('auth:bc:check:overnight', auth);
    process.exit(typeof auth.status === 'number' ? auth.status : 1);
  }
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const activeCase = caseStatus();
const targetUrl = targetUrlFromConfiguredUrl();
const targetUrlReady = Boolean(targetUrl);
const liveGateAllowsNow = contextStatus.details?.canRunBusinessCentralWorkflows === true;
const activeCaseMatches = contextStatus.details?.activeCase === 'PWS-MD-004C-CUSTOMER-BILLING-PAYMENTS-FASTTABS-READFIRST';
const authMeetsLiveWindow =
  authStatus.canUseStoredAuth === true &&
  Number.isFinite(Number(authStatus.expiresInHours)) &&
  Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS &&
  !((authStatus.blockedBy ?? []).includes('storage-state-expires-before-required-window'));
const blockedBy = [
  activeCase.ready ? '' : activeCase.blocker,
  activeCaseMatches ? '' : 'active-case-is-not-pws-md-004c',
  targetUrlReady ? '' : 'target-url-could-not-be-built-from-configured-url',
  authMeetsLiveWindow ? '' : 'storage-state-expires-before-required-window',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'pws-md-004c-customer-billing-payments-fasttabs-readfirst-check',
        caseId: 'PWS-MD-004C-CUSTOMER-BILLING-PAYMENTS-FASTTABS-READFIRST',
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        casePath,
        activeCaseReady: activeCase.ready,
        activeCaseMatches,
        targetUrlReady,
        authStateChecked: true,
        authStateCheckScript: 'auth:bc:check:overnight',
        authMinExpiresInHours: MIN_LIVE_AUTH_EXPIRES_IN_HOURS,
        authExpiresInHours: authStatus.expiresInHours,
        authMeetsLiveWindow,
        canRunNow: blockedBy.length === 0,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy,
        nextStep: activeCase.nextStep
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
        purpose: 'pws-md-004c-customer-billing-payments-fasttabs-readfirst-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run PWS-MD-004C live before case gate, live gate, usable auth and --live-approved.'
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
      PWS_MD_004C_RUNNER_GUARD_CHECKED: '1',
      PWS_MD_004C_LIVE_APPROVED: '1',
      PWS_MD_004C_BC_TARGET_URL: targetUrl
    }
  })
);
