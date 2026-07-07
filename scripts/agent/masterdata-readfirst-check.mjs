import { spawnSync } from 'node:child_process';

const checks = [
  {
    id: 'PWS-MD-001',
    area: 'Debitoren / Customers',
    script: 'fibu:pws:md001:customer-context',
    expectedListSignal: 'pws-md-001-customer-context-readonly.spec.ts'
  },
  {
    id: 'PWS-MD-002',
    area: 'Kreditoren / Vendors',
    script: 'fibu:pws:md002:vendor-context',
    expectedListSignal: 'pws-md-002-vendor-context-readonly.spec.ts'
  },
  {
    id: 'PWS-MD-003',
    area: 'Artikel und Services / Items and Services',
    script: 'fibu:pws:md003:item-service-context',
    expectedListSignal: 'pws-md-003-item-service-context-readonly.spec.ts'
  }
];

function commandName(base) {
  return process.platform === 'win32' ? `${base}.cmd` : base;
}

function runCheck(script) {
  return spawnSync(commandName('npm'), ['run', '--silent', script, '--', '--check'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8'
  });
}

function runList(script) {
  return spawnSync(commandName('npm'), ['run', '--silent', script, '--', '--list'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf8'
  });
}

function parseJson(stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error('Runner did not print JSON output.');
  return JSON.parse(stdout.slice(start));
}

const results = [];
let ok = true;

for (const check of checks) {
  const child = runCheck(check.script);
  const listed = runList(check.script);
  const listOk = listed.status === 0 && listed.stdout.includes(check.expectedListSignal);
  if (child.status !== 0) {
    ok = false;
    results.push({
      ...check,
      runnerOk: false,
      listOk,
      canRunNow: false,
      blockedBy: ['runner-check-failed'],
      stderr: child.stderr?.trim() ?? '',
      stdout: child.stdout?.trim() ?? '',
      listStdoutTail: listed.stdout?.slice(-500) ?? '',
      listStderr: listed.stderr?.trim() ?? ''
    });
    continue;
  }
  if (!listOk) ok = false;

  try {
    const parsed = parseJson(child.stdout);
    results.push({
      ...check,
      runnerOk: true,
      listOk,
      caseId: parsed.caseId,
      expectedInstance: parsed.expectedInstance,
      expectedCompany: parsed.expectedCompany,
      foundationReady: parsed.foundationReady,
      targetUrlReady: parsed.targetUrlReady,
      authStateChecked: parsed.authStateChecked,
      authStateCheckScript: parsed.authStateCheckScript,
      authMinExpiresInHours: parsed.authMinExpiresInHours,
      authExpiresInHours: parsed.authExpiresInHours,
      authMeetsLiveWindow: parsed.authMeetsLiveWindow,
      canRunNow: parsed.canRunNow,
      blockedBy: parsed.blockedBy ?? [],
      nextStep: parsed.nextStep,
      listStdoutTail: listed.stdout?.slice(-500) ?? ''
    });
  } catch (error) {
    ok = false;
    results.push({
      ...check,
      runnerOk: false,
      listOk,
      canRunNow: false,
      blockedBy: ['runner-json-parse-failed'],
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

const allPrepared = results.every(
  (result) =>
    result.runnerOk === true &&
    result.listOk === true &&
    result.targetUrlReady === true &&
    result.authStateChecked === true &&
    result.authStateCheckScript === 'auth:bc:check:overnight' &&
    result.authMinExpiresInHours === 9 &&
    result.authMeetsLiveWindow === true
);
const localPrepared = results.every(
  (result) =>
    result.runnerOk === true &&
    result.listOk === true &&
    result.targetUrlReady === true &&
    result.authStateChecked === true &&
    result.authStateCheckScript === 'auth:bc:check:overnight' &&
    result.authMinExpiresInHours === 9
);
const anyUnexpectedLiveReady = results.some((result) => result.canRunNow === true);
const foundationParked = results.some((result) =>
  (result.blockedBy ?? []).some((blocker) => String(blocker).includes('foundation-readiness-decision-parks-master-data'))
);
const authOnlyBlocker =
  localPrepared &&
  !allPrepared &&
  results.every((result) => {
    const blockers = result.blockedBy ?? [];
    return (
      result.canRunNow === false &&
      result.authMeetsLiveWindow === false &&
      blockers.includes('storage-state-expires-before-required-window') &&
      blockers.includes('business-central-live-gate-blocked')
    );
  });
const blockedByLiveGateOrFoundation = results.every((result) => {
  const blockers = result.blockedBy ?? [];
  return (
    result.canRunNow === false &&
    blockers.some((blocker) => String(blocker).includes('foundation-readiness-decision')) &&
    blockers.includes('business-central-live-gate-blocked')
  );
});

const output = {
  schemaVersion: 1,
  purpose: 'universaarl-masterdata-readfirst-check',
  ok: ok && (allPrepared || authOnlyBlocker) && !anyUnexpectedLiveReady,
  activeWorld: {
    instance: 'playthru',
    company: 'UNIVERSAARL-DE',
    legalName: 'Universaarl GmbH'
  },
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  localPrepared,
  allPrepared,
  authOnlyBlocker,
  anyUnexpectedLiveReady,
  foundationParked,
  blockedByLiveGateOrFoundation,
  checks: results,
  nextStep: foundationParked
    ? 'Resolve the Foundation gaps documented in FOUNDATION-READINESS-DECISION.md before any PWS-MD read-first pilot.'
    : authOnlyBlocker
    ? 'PWS-MD read-first runners are locally prepared. Refresh Playwright auth, rerun agent:resume:check, then approve exactly one read-first/no-write Master Data pilot if Foundation gates still allow it.'
    : allPrepared
    ? 'Run TARGET-075 first. After FOUNDATION-READINESS-DECISION.md exists and live gate opens, approve one PWS-MD read-first pilot at a time with --live-approved.'
    : 'Fix the failing PWS-MD guarded runner before returning to live Master Data work.'
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 1;
