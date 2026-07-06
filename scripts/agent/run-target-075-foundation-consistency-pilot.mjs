import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const specPath =
  'playwright/projects/fibu-book5/tests/target-075-chart-of-accounts-reopen-and-setup-consistency-check.spec.ts';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const listOnly = rawArgs.includes('--list');
const checkOnly = rawArgs.includes('--check');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');
const freezeOverrideApproved = process.env.TARGET_075_FREEZE_OVERRIDE_APPROVED === '1';

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

function printChildFailure(label, result) {
  if (result.stdout) process.stderr.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) process.stderr.write(`${label}: ${result.error.message}\n`);
}

function parseJsonOutput(label, stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) {
    throw new Error(`${label} did not print JSON output`);
  }
  return JSON.parse(stdout.slice(start));
}

function exitWith(result) {
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(typeof result.status === 'number' ? result.status : 1);
}

if (help) {
  console.log(`TARGET-075 guarded runner

Usage:
  node scripts/agent/run-target-075-foundation-consistency-pilot.mjs --check
  node scripts/agent/run-target-075-foundation-consistency-pilot.mjs [--list]
  node scripts/agent/run-target-075-foundation-consistency-pilot.mjs --live-approved

Default behavior refuses to open Business Central while the improvement freeze is active.
Use --check to validate readiness, freeze status and stored auth without opening Business Central.
Use --live-approved only after explicit freeze lift for TARGET-075.
If the freeze is still active, --live-approved also requires TARGET_075_FREEZE_OVERRIDE_APPROVED=1.
The runner checks stored Playwright auth before any live execution.`);
  process.exit(0);
}

if (listOnly) {
  exitWith(run('npx', ['playwright', 'test', '--list', specPath], { stdio: 'inherit' }));
}

const readiness = run('npm', ['run', '--silent', 'agent:target075:readiness']);
if (readiness.status !== 0) {
  printChildFailure('agent:target075:readiness', readiness);
  process.exit(typeof readiness.status === 'number' ? readiness.status : 1);
}

const contextTest = run('npm', ['run', '--silent', 'agent:context:test']);
if (contextTest.status !== 0) {
  printChildFailure('agent:context:test', contextTest);
  process.exit(typeof contextTest.status === 'number' ? contextTest.status : 1);
}

let contextTestStatus;
try {
  contextTestStatus = parseJsonOutput('agent:context:test', contextTest.stdout);
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const freeze = run('npm', ['run', '--silent', 'agent:freeze:status']);
if (freeze.status !== 0) {
  printChildFailure('agent:freeze:status', freeze);
  process.exit(typeof freeze.status === 'number' ? freeze.status : 1);
}

let freezeStatus;
try {
  freezeStatus = parseJsonOutput('agent:freeze:status', freeze.stdout);
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

if (freezeStatus.freezeActive && !checkOnly && (!liveApproved || !freezeOverrideApproved)) {
  console.error(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-075-live-runner-guard',
        canRun: false,
        freezeActive: true,
        liveApproved,
        freezeOverrideApproved,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        targetCase: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
        blockedBy: liveApproved
          ? ['improvement-freeze-active', 'missing-target-075-freeze-override-approval']
          : ['improvement-freeze-active', 'missing-live-approved-flag'],
        reason:
          'TARGET-075 is prepared as the read-first return pilot, but the improvement freeze still blocks Business Central live execution without a second explicit freeze override.',
        nextStep:
          'Run local freeze/resume checks. Prefer lifting the freeze first; only use TARGET_075_FREEZE_OVERRIDE_APPROVED=1 for an explicit active-case override.'
      },
      null,
      2
    )
  );
  process.exit(2);
}

const auth = run('npm', ['run', '--silent', 'auth:bc:check']);
if (auth.status !== 0) {
  printChildFailure('auth:bc:check', auth);
  process.exit(typeof auth.status === 'number' ? auth.status : 1);
}

let authStatus;
try {
  authStatus = parseJsonOutput('auth:bc:check', auth.stdout);
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

if (authStatus.canUseStoredAuth !== true) {
  console.error(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-075-auth-state-guard',
        canRun: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        targetCase: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
        blockedBy: authStatus.blockedBy ?? ['stored-auth-not-usable'],
        expectedInstance: authStatus.expectedInstance ?? 'playthru',
        expectedCompany: authStatus.expectedCompany ?? 'UNIVERSAARL-DE',
        reason: 'Stored Playwright auth is not usable for TARGET-075.',
        nextStep: authStatus.nextStep ?? 'Refresh Playwright auth before running TARGET-075.'
      },
      null,
      2
    )
  );
  process.exit(3);
}

const authDoctor = run('npm', ['run', '--silent', 'auth:bc:doctor']);
if (authDoctor.status !== 0) {
  printChildFailure('auth:bc:doctor', authDoctor);
  process.exit(typeof authDoctor.status === 'number' ? authDoctor.status : 1);
}

let authDoctorStatus;
try {
  authDoctorStatus = parseJsonOutput('auth:bc:doctor', authDoctor.stdout);
} catch (error) {
  console.error(String(error instanceof Error ? error.message : error));
  process.exit(1);
}

const explicitFreezeOverride = freezeStatus.freezeActive === true && liveApproved && freezeOverrideApproved;
const liveGateAllowsNow = authDoctorStatus.canRunBusinessCentralWorkflows === true;
const liveGateBlockedBy = authDoctorStatus.liveGate?.blockedBy ?? [];
const authTargetOk =
  authDoctorStatus.authTarget?.canBuildTargetUrl === true &&
  authDoctorStatus.authTarget?.targetMatchesState === true &&
  authDoctorStatus.authTarget?.targetBuiltFromCurrentState === true &&
  authDoctorStatus.authTarget?.targetEnvironment === EXPECTED_INSTANCE &&
  authDoctorStatus.authTarget?.targetCompany === TARGET_COMPANY;
const targetUrl = authTargetOk ? targetUrlFromConfiguredUrl() : '';
const targetUrlReady = Boolean(targetUrl);
if (!checkOnly && authTargetOk && !targetUrlReady) {
  console.error(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-075-target-url-builder-guard',
        canRun: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        targetCase: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        blockedBy: ['target-url-could-not-be-built-from-configured-url'],
        reason: 'The guarded runner could not build a TARGET-075 runtime URL from the configured Business Central URL.',
        nextStep: 'Fix BC_AUTH_URL, FIBU_BOOK5_BC_URL or BC_URL before running TARGET-075 live.'
      },
      null,
      2
    )
  );
  process.exit(6);
}
if (!checkOnly && authDoctorStatus.canRunBusinessCentralWorkflows !== true && !explicitFreezeOverride) {
  console.error(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-075-auth-doctor-live-gate',
        canRun: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        targetCase: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
        blockedBy: authDoctorStatus.liveGate?.blockedBy ?? ['auth-doctor-live-gate-blocked'],
        decision: authDoctorStatus.decision,
        liveGate: authDoctorStatus.liveGate,
        reason: 'auth:bc:doctor reports usable stored auth but no current Business Central live permission.',
        nextStep:
          authDoctorStatus.nextSafeAction ??
          'Lift the freeze or update the active live gate before running TARGET-075.'
      },
      null,
      2
    )
  );
  process.exit(4);
}

if (!checkOnly && !authTargetOk) {
  console.error(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-075-auth-target-guard',
        canRun: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        targetCase: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: TARGET_COMPANY,
        authTarget: authDoctorStatus.authTarget ?? null,
        blockedBy: ['auth-target-does-not-match-current-state'],
        reason:
          'auth:bc:doctor did not confirm that the Business Central target URL can be rebuilt from current state for playthru / UNIVERSAARL-DE.',
        nextStep: 'Fix .agent/state/current.json or FIBU_BOOK5_BC_URL target diagnosis before running TARGET-075 live.'
      },
      null,
      2
    )
  );
  process.exit(5);
}

if (checkOnly) {
  const checkBlockedBy = [...liveGateBlockedBy];
  if (!authTargetOk) checkBlockedBy.unshift('auth-target-does-not-match-current-state');
  const canResumeAfterFreezeLift = authTargetOk && targetUrlReady;
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-075-runner-safe-check',
        targetCase: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
        canResumeAfterFreezeLift,
        canResumeAfterFreezeLiftMeaning:
          'local-readiness-auth-target-and-runtime-target-url-only; Business Central/Playwright execution still requires the active live gate to clear',
        canRunNow: liveGateAllowsNow,
        freezeActive: freezeStatus.freezeActive === true,
        requiresFreezeLift: freezeStatus.freezeActive === true,
        requiresLiveGateLift: !liveGateAllowsNow,
        requiresFreezeOverrideWhenFreezeActive: freezeStatus.freezeActive === true,
        authTargetOk,
        requiresTargetFix: !authTargetOk,
        targetUrlReady,
        targetUrlPassedToLiveSpec: targetUrlReady,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        authStateChecked: true,
        authSecretsPrinted: false,
        expectedInstance: authStatus.expectedInstance ?? 'playthru',
        expectedCompany: authStatus.expectedCompany ?? 'UNIVERSAARL-DE',
        authAgeHours: authStatus.ageHours,
        authMaxAgeHours: authStatus.maxAgeHours,
        authExpiresInHours: authStatus.expiresInHours,
        authWarnExpiresInHours: authStatus.warnExpiresInHours,
        authWarnings: authStatus.warnings ?? [],
        authDoctor: {
          decision: authDoctorStatus.decision,
          canRunBusinessCentralWorkflows: authDoctorStatus.canRunBusinessCentralWorkflows,
          authTarget: authDoctorStatus.authTarget,
          liveGate: authDoctorStatus.liveGate,
          nextSafeAction: authDoctorStatus.nextSafeAction
        },
        contextLiveGate: {
          ok: contextTestStatus.ok === true,
          activeCase: contextTestStatus.details?.activeCase,
          businessCentralLiveAllowed: contextTestStatus.details?.businessCentralLiveAllowed,
          authDecision: contextTestStatus.details?.authDecision,
          canRunBusinessCentralWorkflows: contextTestStatus.details?.canRunBusinessCentralWorkflows
        },
        blockedBy: checkBlockedBy,
        nextStep:
          !authTargetOk
            ? 'Fix .agent/state/current.json or FIBU_BOOK5_BC_URL target diagnosis before lifting the freeze for TARGET-075.'
            : !targetUrlReady
            ? 'Fix BC_AUTH_URL, FIBU_BOOK5_BC_URL or BC_URL so the guarded runner can pass a verified target URL to TARGET-075.'
            : !liveGateAllowsNow
            ? 'Stored auth and local readiness are usable, but the active live gate still blocks Business Central/Playwright execution. Do not open Business Central until explicit freeze/live-gate lift or a second explicit freeze override.'
            : 'Stored auth and local readiness are usable. Run TARGET-075 only with live shell/context validation.'
      },
      null,
      2
    )
  );
  process.exit(0);
}

const passthroughArgs = rawArgs.filter((arg) => arg !== '--live-approved');
exitWith(
  run('npx', ['playwright', 'test', specPath, ...passthroughArgs], {
    stdio: 'inherit',
    env: {
      TARGET_075_RUNNER_GUARD_CHECKED: '1',
      TARGET_075_LIVE_APPROVED: '1',
      TARGET_075_FREEZE_ACTIVE: String(freezeStatus.freezeActive === true),
      TARGET_075_FREEZE_OVERRIDE_USED: String(freezeOverrideApproved),
      TARGET_075_AUTH_AGE_HOURS: String(authStatus.ageHours ?? ''),
      TARGET_075_AUTH_MAX_AGE_HOURS: String(authStatus.maxAgeHours ?? ''),
      TARGET_075_AUTH_EXPIRES_IN_HOURS: String(authStatus.expiresInHours ?? ''),
      TARGET_075_AUTH_WARN_EXPIRES_IN_HOURS: String(authStatus.warnExpiresInHours ?? ''),
      TARGET_075_AUTH_WARNINGS: JSON.stringify(authStatus.warnings ?? []),
      TARGET_075_AUTH_DOCTOR_DECISION: String(authDoctorStatus.decision ?? ''),
      TARGET_075_AUTH_DOCTOR_LIVE_GATE: JSON.stringify(authDoctorStatus.liveGate ?? null),
      TARGET_075_AUTH_TARGET: JSON.stringify(authDoctorStatus.authTarget ?? null),
      TARGET_075_BC_TARGET_URL: targetUrl
    }
  })
);
