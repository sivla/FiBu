import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/pws-ff-001-number-series-readfirst.spec.ts';
const casePath = '.agent/state/cases/pws-ff-001-number-series-readfirst.json';
const currentPath = '.agent/state/current.json';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const CASE_ID = 'PWS-FF-001-NUMBER-SERIES-READFIRST';
const MIN_LIVE_AUTH_EXPIRES_IN_HOURS = 9;

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const listOnly = rawArgs.includes('--list');
const checkOnly = rawArgs.includes('--check');
const overnightCheck = rawArgs.includes('--overnight') || rawArgs.includes('--overnight-check') || liveApproved;
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

function localCaseStatus() {
  if (!existsSync(casePath)) {
    return {
      ready: false,
      blocker: 'pws-ff-001-case-file-missing',
      nextStep: 'Create the PWS-FF-001 case file before any live Number Series read-first proof.'
    };
  }
  const current = JSON.parse(readFileSync(currentPath, 'utf8'));
  const caseFile = JSON.parse(readFileSync(casePath, 'utf8'));
  const selected = current.nextCase ?? current.activeCase ?? '';
  if (selected !== CASE_ID) {
    return {
      ready: false,
      blocker: 'pws-ff-001-not-selected-next-case',
      nextStep: `Select ${CASE_ID} as nextCase before running this guarded live proof.`
    };
  }
  if (caseFile.instance !== EXPECTED_INSTANCE || caseFile.company !== TARGET_COMPANY) {
    return {
      ready: false,
      blocker: 'pws-ff-001-case-target-mismatch',
      nextStep: 'Fix the case target to playthru / UNIVERSAARL-DE before any live run.'
    };
  }
  if (caseFile.effectiveBcActionsAllowed !== false) {
    return {
      ready: false,
      blocker: 'pws-ff-001-must-stay-readonly',
      nextStep: 'PWS-FF-001 must remain read-first/no-write.'
    };
  }
  return {
    ready: true,
    blocker: '',
    nextStep: 'When auth and live gate are ready, run PWS-FF-001 with --live-approved as read-first/no-write.'
  };
}

if (help) {
  console.log(`PWS-FF-001 guarded runner

Usage:
  node scripts/agent/run-pws-ff-001-number-series-readfirst.mjs --check
  node scripts/agent/run-pws-ff-001-number-series-readfirst.mjs --check --overnight
  node scripts/agent/run-pws-ff-001-number-series-readfirst.mjs --list
  node scripts/agent/run-pws-ff-001-number-series-readfirst.mjs --live-approved

This runner opens Number Series read-only and captures screenshot QA for list, checkbox/tooltips and Lines action context.
It must not create, edit, assign number series, create master data, preview, post or use API shortcuts.`);
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

const authScript = overnightCheck ? 'auth:bc:check:overnight' : 'auth:bc:check';
const auth = run('npm', ['run', '--silent', authScript]);
let authStatus;
try {
  authStatus = parseJsonOutput(authScript, auth.stdout);
} catch (error) {
  if (auth.status !== 0) {
    printChildFailure(authScript, auth);
    process.exit(typeof auth.status === 'number' ? auth.status : 1);
  }
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const localCase = localCaseStatus();
const targetUrl = targetUrlFromConfiguredUrl();
const targetUrlReady = Boolean(targetUrl);
const liveGateAllowsNow = contextStatus.details?.canRunBusinessCentralWorkflows === true;
const authMeetsLiveWindow =
  authStatus.canUseStoredAuth === true &&
  Number.isFinite(Number(authStatus.expiresInHours)) &&
  Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS &&
  !((authStatus.blockedBy ?? []).includes('storage-state-expires-before-required-window'));
const authUsableForReadFirst = authStatus.canUseStoredAuth === true;
const blockedBy = [
  localCase.ready ? '' : localCase.blocker,
  targetUrlReady ? '' : 'target-url-could-not-be-built-from-configured-url',
  overnightCheck
    ? authMeetsLiveWindow
      ? ''
      : 'storage-state-expires-before-required-window'
    : authUsableForReadFirst
      ? ''
      : 'stored-auth-not-usable',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'pws-ff-001-number-series-readfirst-check',
        caseId: CASE_ID,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        casePath,
        localCaseReady: localCase.ready,
        targetUrlReady,
        authStateChecked: true,
        authStateCheckScript: authScript,
        authMinExpiresInHours: MIN_LIVE_AUTH_EXPIRES_IN_HOURS,
        authExpiresInHours: authStatus.expiresInHours,
        authMeetsLiveWindow,
        authUsableForReadFirst,
        overnightCheck,
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
        purpose: 'pws-ff-001-number-series-readfirst-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run PWS-FF-001 live before case selection, fresh auth, live gate and --live-approved.'
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
      PWS_FF_001_RUNNER_GUARD_CHECKED: '1',
      PWS_FF_001_LIVE_APPROVED: '1',
      PWS_FF_001_BC_TARGET_URL: targetUrl
    }
  })
);
