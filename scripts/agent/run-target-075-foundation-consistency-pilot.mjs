import { spawnSync } from 'node:child_process';

const specPath =
  'playwright/projects/fibu-book5/tests/target-075-chart-of-accounts-reopen-and-setup-consistency-check.spec.ts';

const rawArgs = process.argv.slice(2);
const liveApproved = rawArgs.includes('--live-approved');
const listOnly = rawArgs.includes('--list');
const checkOnly = rawArgs.includes('--check');
const help = rawArgs.includes('--help') || rawArgs.includes('-h');

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
Use --live-approved only after explicit freeze lift or active-case approval for TARGET-075.
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

if (freezeStatus.freezeActive && !liveApproved && !checkOnly) {
  console.error(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-075-live-runner-guard',
        canRun: false,
        freezeActive: true,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        targetCase: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
        blockedBy: ['improvement-freeze-active'],
        reason:
          'TARGET-075 is prepared as the read-first return pilot, but the improvement freeze still blocks Business Central live execution.',
        nextStep:
          'Run local freeze/resume checks and use --live-approved only after explicit freeze lift or active-case approval.'
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

if (checkOnly) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'target-075-runner-safe-check',
        targetCase: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
        canResumeAfterFreezeLift: true,
        canRunNow: freezeStatus.freezeActive !== true,
        freezeActive: freezeStatus.freezeActive === true,
        requiresFreezeLift: freezeStatus.freezeActive === true,
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
        blockedBy: freezeStatus.freezeActive === true ? ['improvement-freeze-active'] : [],
        nextStep:
          freezeStatus.freezeActive === true
            ? 'Stored auth and local readiness are usable, but the freeze is still active. Do not open Business Central until explicit freeze lift or active-case approval.'
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
    env: { TARGET_075_LIVE_APPROVED: '1' }
  })
);
