import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/target-073b-vat-page472-surface-and-editor-proof.spec.ts';
const casePath = '.agent/state/cases/target-073b-vat-page472-surface-and-editor-proof.json';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const ACTIVE_CASE = 'TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF';
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
  url.searchParams.set('page', '472');
  url.searchParams.set('dc', '0');
  return url.toString();
}

function commandName(base) {
  if (base === 'node') return base;
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

if (help) {
  console.log(`TARGET-073B guarded runner

Usage:
  node scripts/agent/run-target-073b-vat-page472-surface-and-editor-proof.mjs --check
  node scripts/agent/run-target-073b-vat-page472-surface-and-editor-proof.mjs --list
  node scripts/agent/run-target-073b-vat-page472-surface-and-editor-proof.mjs --live-approved

This runner proves only the Page 472 surface/editor route. It must not type VAT target values, save setup, create data, preview, post, pay or use API shortcuts.`);
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

const readiness = run('node', ['scripts/agent/target-073b-readiness-check.mjs']);
if (readiness.status !== 0) {
  printChildFailure('target-073b-readiness-check', readiness);
  process.exit(typeof readiness.status === 'number' ? readiness.status : 1);
}

let readinessStatus;
try {
  readinessStatus = parseJsonOutput('target-073b-readiness-check', readiness.stdout);
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
const activeCaseAcceptable = current.activeCase === ACTIVE_CASE || current.nextCase === ACTIVE_CASE;
const targetUrl = targetUrlFromConfiguredUrl();
const liveGateAllowsNow = contextStatus.details?.canRunBusinessCentralWorkflows === true;
const authMeetsLiveWindow =
  authStatus.canUseStoredAuth === true &&
  Number.isFinite(Number(authStatus.expiresInHours)) &&
  Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS &&
  !((authStatus.blockedBy ?? []).includes('storage-state-expires-before-required-window'));
const caseData = readJsonIfExists(casePath);
const caseIsNoWrite =
  caseData?.effectiveBcActionsAllowed === false &&
  caseData?.forbiddenActions?.includes('write-vat-posting-setup') &&
  caseData?.forbiddenActions?.includes('preview-posting') &&
  caseData?.forbiddenActions?.includes('post');
const blockedBy = [
  existsSync(specPath) ? '' : 'target-073b-spec-missing',
  existsSync(casePath) ? '' : 'target-073b-case-file-missing',
  activeCaseAcceptable ? '' : 'target-073b-is-not-active-or-next-case',
  readinessStatus.ok ? '' : 'target-073b-readiness-check-failed',
  caseIsNoWrite ? '' : 'target-073b-case-is-not-no-write',
  targetUrl ? '' : 'target-url-could-not-be-built-from-configured-url',
  authMeetsLiveWindow ? '' : 'storage-state-expires-before-required-window',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-073b-vat-page472-surface-and-editor-proof-check',
        caseId: ACTIVE_CASE,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        targetUrlReady: Boolean(targetUrl),
        activeCase: current.activeCase ?? null,
        nextCase: current.nextCase ?? null,
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
        nextStep:
          blockedBy.length === 0
            ? 'TARGET-073B can run only with --live-approved as read-first/no-write Page 472 surface/editor proof.'
            : 'Fix the listed blockers before any TARGET-073B live no-write diagnosis.'
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
        purpose: 'target-073b-vat-page472-surface-and-editor-proof-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep: 'Do not run TARGET-073B live before readiness, stored auth, live gate and --live-approved are clear.'
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
      TARGET_073B_RUNNER_GUARD_CHECKED: '1',
      TARGET_073B_LIVE_APPROVED: '1',
      TARGET_073B_BC_TARGET_URL: targetUrl
    }
  })
);
