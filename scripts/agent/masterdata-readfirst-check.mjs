import { spawnSync } from 'node:child_process';

const checks = [
  {
    id: 'PWS-MD-001',
    area: 'Debitoren / Customers',
    script: 'fibu:pws:md001:customer-context'
  },
  {
    id: 'PWS-MD-002',
    area: 'Kreditoren / Vendors',
    script: 'fibu:pws:md002:vendor-context'
  },
  {
    id: 'PWS-MD-003',
    area: 'Artikel und Services / Items and Services',
    script: 'fibu:pws:md003:item-service-context'
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

function parseJson(stdout) {
  const start = stdout.indexOf('{');
  if (start < 0) throw new Error('Runner did not print JSON output.');
  return JSON.parse(stdout.slice(start));
}

const results = [];
let ok = true;

for (const check of checks) {
  const child = runCheck(check.script);
  if (child.status !== 0) {
    ok = false;
    results.push({
      ...check,
      runnerOk: false,
      canRunNow: false,
      blockedBy: ['runner-check-failed'],
      stderr: child.stderr?.trim() ?? '',
      stdout: child.stdout?.trim() ?? ''
    });
    continue;
  }

  try {
    const parsed = parseJson(child.stdout);
    results.push({
      ...check,
      runnerOk: true,
      caseId: parsed.caseId,
      expectedInstance: parsed.expectedInstance,
      expectedCompany: parsed.expectedCompany,
      foundationReady: parsed.foundationReady,
      targetUrlReady: parsed.targetUrlReady,
      canRunNow: parsed.canRunNow,
      blockedBy: parsed.blockedBy ?? [],
      nextStep: parsed.nextStep
    });
  } catch (error) {
    ok = false;
    results.push({
      ...check,
      runnerOk: false,
      canRunNow: false,
      blockedBy: ['runner-json-parse-failed'],
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

const allPrepared = results.every((result) => result.runnerOk === true && result.targetUrlReady === true);
const anyUnexpectedLiveReady = results.some((result) => result.canRunNow === true);
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
  ok: ok && allPrepared && !anyUnexpectedLiveReady,
  activeWorld: {
    instance: 'playthru',
    company: 'UNIVERSAARL-DE',
    legalName: 'Universaarl GmbH'
  },
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  allPrepared,
  anyUnexpectedLiveReady,
  blockedByLiveGateOrFoundation,
  checks: results,
  nextStep: allPrepared
    ? 'Run TARGET-075 first. After FOUNDATION-READINESS-DECISION.md exists and live gate opens, approve one PWS-MD read-first pilot at a time with --live-approved.'
    : 'Fix the failing PWS-MD guarded runner before returning to live Master Data work.'
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 1;
