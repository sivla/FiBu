import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/pws-md-004-customer-card-template-required-fields-preflight.spec.ts';
const statePath = '.agent/state/current.json';
const casePath = '.agent/state/cases/customer-setup-ui-template-preflight.json';
const CASE_ID = 'CUSTOMER-SETUP-UI-TEMPLATE-PREFLIGHT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'customer-setup-ui-template-preflight';
const RESULT_FILE = `${CASE_ID}-result.json`;
const MIN_LIVE_AUTH_EXPIRES_IN_HOURS = 1;

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const listOnly = rawArgs.includes('--list');
const checkOnly = rawArgs.includes('--check');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

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

function localGateStatus() {
  if (!existsSync(statePath)) {
    return { ready: false, blockedBy: ['current-state-missing'] };
  }
  if (!existsSync(casePath)) {
    return { ready: false, blockedBy: ['active-case-file-missing'] };
  }
  const state = readJson(statePath);
  const activeCase = readJson(casePath);
  const blockedBy = [
    state.activeCase === CASE_ID ? '' : `active-case-is-${state.activeCase || 'missing'}`,
    state.instance === EXPECTED_INSTANCE ? '' : `instance-is-${state.instance || 'missing'}`,
    state.company === TARGET_COMPANY ? '' : `company-is-${state.company || 'missing'}`,
    activeCase.caseId === CASE_ID ? '' : `case-file-id-is-${activeCase.caseId || 'missing'}`,
    activeCase.instance === EXPECTED_INSTANCE ? '' : `case-instance-is-${activeCase.instance || 'missing'}`,
    activeCase.company === TARGET_COMPANY ? '' : `case-company-is-${activeCase.company || 'missing'}`,
    activeCase.mayOpenBusinessCentral === true ? '' : 'case-does-not-allow-business-central-open',
    activeCase.mayRunPlaywright === true ? '' : 'case-does-not-allow-playwright',
    activeCase.effectiveBcActionsAllowed === false ? '' : 'case-is-not-read-first-only'
  ].filter(Boolean);
  return { ready: blockedBy.length === 0, blockedBy };
}

if (help) {
  console.log(`Customer setup UI/template preflight guarded runner

Usage:
  node scripts/agent/run-customer-setup-ui-template-preflight.mjs --check
  node scripts/agent/run-customer-setup-ui-template-preflight.mjs --list
  node scripts/agent/run-customer-setup-ui-template-preflight.mjs --live-approved

This runner opens Business Central read-only in playthru / UNIVERSAARL-DE and captures Debitoren UI/template
surface evidence. It must not save, import, edit, delete or create customer data.`);
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

const localGate = localGateStatus();
const targetUrl = targetUrlFromConfiguredUrl();
const targetUrlReady = Boolean(targetUrl);
const liveGateAllowsNow = contextStatus.details?.canRunBusinessCentralWorkflows === true;
const authMeetsLiveWindow =
  authStatus.canUseStoredAuth === true &&
  Number.isFinite(Number(authStatus.expiresInHours)) &&
  Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS;
const blockedBy = [
  ...localGate.blockedBy,
  targetUrlReady ? '' : 'target-url-could-not-be-built-from-configured-url',
  authMeetsLiveWindow ? '' : 'stored-auth-not-usable-for-one-hour-window',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'customer-setup-ui-template-preflight-check',
        caseId: CASE_ID,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        targetUrlReady,
        localGateReady: localGate.ready,
        authStateChecked: true,
        authMinExpiresInHours: MIN_LIVE_AUTH_EXPIRES_IN_HOURS,
        authExpiresInHours: authStatus.expiresInHours,
        authMeetsLiveWindow,
        canRunNow: blockedBy.length === 0,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy,
        nextStep:
          blockedBy.length === 0
            ? 'Run with --live-approved to capture read-first customer setup UI/template evidence.'
            : 'Resolve blockers before opening Business Central.'
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
        purpose: 'customer-setup-ui-template-preflight-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run live before active case, auth, context and --live-approved gates are green.'
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
      PWS_MD_004_RUNNER_GUARD_CHECKED: '1',
      PWS_MD_004_LIVE_APPROVED: '1',
      PWS_MD_004_BC_TARGET_URL: targetUrl,
      PWS_MD_004_CASE_ID: CASE_ID,
      PWS_MD_004_EVIDENCE_ID: EVIDENCE_ID,
      PWS_MD_004_RESULT_FILE: RESULT_FILE
    }
  })
);
