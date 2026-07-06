import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath = 'playwright/projects/fibu-book5/tests/pws-md-001-customer-context-readonly.spec.ts';
const foundationDecisionPath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
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

function foundationDecisionStatus() {
  const missingBlocker = 'foundation-readiness-decision-missing-or-not-finalized';
  if (!existsSync(foundationDecisionPath)) {
    return {
      ready: false,
      blocker: missingBlocker,
      nextStep: 'Run TARGET-075 and write FOUNDATION-READINESS-DECISION.md before customer context read-first proof.'
    };
  }
  const text = readFileSync(foundationDecisionPath, 'utf8');
  if (/template\/no-evidence|pending-target075-evidence/i.test(text)) {
    return {
      ready: false,
      blocker: missingBlocker,
      nextStep: 'Finalize FOUNDATION-READINESS-DECISION.md from TARGET-075 evidence before customer context read-first proof.'
    };
  }
  if (/Master Data bleibt geparkt/i.test(text)) {
    return {
      ready: false,
      blocker: 'foundation-readiness-decision-parks-master-data',
      nextStep: 'Resolve Foundation gaps from FOUNDATION-READINESS-DECISION.md before PWS-MD-001 customer context read-first proof.'
    };
  }
  if (!text.includes('PWS-MD-001')) {
    return {
      ready: false,
      blocker: 'foundation-readiness-decision-missing-pws-md-001',
      nextStep: 'Add an explicit PWS-MD-001 handoff before customer context read-first proof.'
    };
  }
  return {
    ready: true,
    blocker: '',
    nextStep: 'When live gate is open, run PWS-MD-001 only with --live-approved as read-first/no-write.'
  };
}

if (help) {
  console.log(`PWS-MD-001 guarded runner

Usage:
  node scripts/agent/run-pws-md-001-customer-context-readonly.mjs --check
  node scripts/agent/run-pws-md-001-customer-context-readonly.mjs --list
  node scripts/agent/run-pws-md-001-customer-context-readonly.mjs --live-approved

This runner never writes customer data. Live execution requires:
- FOUNDATION-READINESS-DECISION.md from TARGET-075 evidence
- usable stored auth
- live gate open for Business Central
- --live-approved`);
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

const foundationDecision = foundationDecisionStatus();
const foundationReady = foundationDecision.ready;
const targetUrl = targetUrlFromConfiguredUrl();
const targetUrlReady = Boolean(targetUrl);
const liveGateAllowsNow = contextStatus.details?.canRunBusinessCentralWorkflows === true;
const authMeetsLiveWindow =
  authStatus.canUseStoredAuth === true &&
  Number.isFinite(Number(authStatus.expiresInHours)) &&
  Number(authStatus.expiresInHours) >= MIN_LIVE_AUTH_EXPIRES_IN_HOURS &&
  !((authStatus.blockedBy ?? []).includes('storage-state-expires-before-required-window'));
const blockedBy = [
  foundationReady ? '' : foundationDecision.blocker,
  targetUrlReady ? '' : 'target-url-could-not-be-built-from-configured-url',
  authMeetsLiveWindow ? '' : 'storage-state-expires-before-required-window',
  liveGateAllowsNow ? '' : 'business-central-live-gate-blocked'
].filter(Boolean);

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'pws-md-001-customer-context-readonly-check',
        caseId: 'PWS-MD-001-CUSTOMER-CONTEXT-READFIRST',
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        foundationDecisionPath,
        foundationReady,
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
        nextStep: foundationDecision.nextStep
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
        purpose: 'pws-md-001-customer-context-readonly-guard',
        canRun: false,
        liveApproved,
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        blockedBy: liveApproved ? blockedBy : ['missing-live-approved-flag', ...blockedBy],
        nextStep:
          'Do not run PWS-MD-001 live before TARGET-075 evidence, Foundation Readiness Decision, live gate and --live-approved.'
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
      PWS_MD_001_RUNNER_GUARD_CHECKED: '1',
      PWS_MD_001_LIVE_APPROVED: '1',
      PWS_MD_001_BC_TARGET_URL: targetUrl
    }
  })
);
