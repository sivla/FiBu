import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/pws-ff-002b-page314-navigation-capture-recovery.spec.ts';
const casePath = '.agent/state/cases/pws-ff-002b-page314-navigation-capture-recovery.json';
const foundationDecisionPath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md';
const resultPath = 'playwright/projects/fibu-book5/evidence/pws-ff-002b-page314-navigation-capture-recovery/PWS-FF-002B-result.json';
const priorResultPath =
  'playwright/projects/fibu-book5/evidence/pws-ff-002-general-posting-setup-readfirst-recovery/PWS-FF-002-result.json';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const ACTIVE_CASE = 'PWS-FF-002B-PAGE314-NAVIGATION-CAPTURE-RECOVERY';
const MIN_LIVE_AUTH_EXPIRES_IN_HOURS = 9;

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

function readJsonIfExists(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
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

function priorBlockedProofReady() {
  const prior = readJsonIfExists(priorResultPath);
  const decisionText = existsSync(foundationDecisionPath) ? readFileSync(foundationDecisionPath, 'utf8') : '';
  return {
    ready:
      prior?.caseId === 'PWS-FF-002-GENERAL-POSTING-SETUP-READFIRST-RECOVERY' &&
      prior?.resultStatus === 'blocked' &&
      /Screenshot-QA: rejected, weil der Screenshot das Rollencenter zeigt/i.test(decisionText),
    priorStatus: prior?.resultStatus ?? null
  };
}

if (help) {
  console.log(`PWS-FF-002B guarded runner

Usage:
  node scripts/agent/run-pws-ff-002b-page314-navigation-capture-recovery.mjs --check
  node scripts/agent/run-pws-ff-002b-page314-navigation-capture-recovery.mjs --list
  node scripts/agent/run-pws-ff-002b-page314-navigation-capture-recovery.mjs --live-approved

This runner proves only Page 314 navigation/capture. It must not type business values, save, create, preview, post or use API shortcuts.`);
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

const current = readJsonIfExists('.agent/state/current.json') ?? {};
const priorReady = priorBlockedProofReady();
const existingResult = readJsonIfExists(resultPath);
const routeAlreadyBlocked =
  existingResult?.caseId === ACTIVE_CASE &&
  existingResult?.resultStatus === 'blocked' &&
  existingResult?.nextCase === 'FOUNDATION-READINESS-DECISION';
const activeCaseAcceptable =
  current.activeCase === ACTIVE_CASE || (routeAlreadyBlocked && current.activeCase === 'FOUNDATION-READINESS-DECISION');
const targetUrl = targetUrlFromConfiguredUrl();
const liveGateAllowsNow = contextStatus.details?.canRunBusinessCentralWorkflows === true;
const authMeetsLiveWindow =
  authStatus.canUseStoredAuth === true &&
  Number.isFinite(Number(authStatus.expiresInHours)) &&
  Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS &&
  !((authStatus.blockedBy ?? []).includes('storage-state-expires-before-required-window'));
const blockedBy = [
  existsSync(casePath) ? '' : 'pws-ff-002b-case-file-missing',
  activeCaseAcceptable ? '' : 'active-case-is-not-pws-ff-002b-or-foundation-decision',
  priorReady.ready ? '' : 'prior-pws-ff-002-blocked-screenshot-qa-not-recorded',
  routeAlreadyBlocked ? 'pws-ff-002b-current-route-already-blocked-consume-foundation-decision' : '',
  targetUrl ? '' : 'target-url-could-not-be-built-from-configured-url',
  authMeetsLiveWindow ? '' : 'storage-state-expires-before-required-window',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'pws-ff-002b-page314-navigation-capture-recovery-check',
        caseId: ACTIVE_CASE,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        priorResultPath,
        priorResultStatus: priorReady.priorStatus,
        existingResultPath: resultPath,
        existingResultStatus: existingResult?.resultStatus ?? null,
        routeAlreadyBlocked,
        targetUrlReady: Boolean(targetUrl),
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
        nextStep: routeAlreadyBlocked
          ? 'Do not repeat PWS-FF-002B direct Page 314 URL/search route. Consume the blocked result in Foundation Readiness or define a materially new route hypothesis.'
          : 'When live gate is open, run PWS-FF-002B only with --live-approved as read-first/no-write.'
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
        purpose: 'pws-ff-002b-page314-navigation-capture-recovery-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run PWS-FF-002B live before active case, prior screenshot QA, live gate and --live-approved are clear.'
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
      PWS_FF_002B_RUNNER_GUARD_CHECKED: '1',
      PWS_FF_002B_LIVE_APPROVED: '1',
      PWS_FF_002B_BC_TARGET_URL: targetUrl
    }
  })
);
