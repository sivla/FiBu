import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const checks = [
  {
    id: 'PWS-MD-001',
    area: 'Debitoren / Customers',
    script: 'fibu:pws:md001:customer-context',
    expectedListSignal: 'pws-md-001-customer-context-readonly.spec.ts',
    specPath: 'playwright/projects/fibu-book5/tests/pws-md-001-customer-context-readonly.spec.ts',
    expectedMinimumScreenshotCheckpoints: 5
  },
  {
    id: 'PWS-MD-002',
    area: 'Kreditoren / Vendors',
    script: 'fibu:pws:md002:vendor-context',
    expectedListSignal: 'pws-md-002-vendor-context-readonly.spec.ts',
    specPath: 'playwright/projects/fibu-book5/tests/pws-md-002-vendor-context-readonly.spec.ts',
    expectedMinimumScreenshotCheckpoints: 5
  },
  {
    id: 'PWS-MD-003',
    area: 'Artikel und Services / Items and Services',
    script: 'fibu:pws:md003:item-service-context',
    expectedListSignal: 'pws-md-003-item-service-context-readonly.spec.ts',
    specPath: 'playwright/projects/fibu-book5/tests/pws-md-003-item-service-context-readonly.spec.ts',
    expectedMinimumScreenshotCheckpoints: 5
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

function readSpecScreenshotContract(check) {
  const text = fs.readFileSync(check.specPath, 'utf8');
  const minimumConstant = `MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS = ${check.expectedMinimumScreenshotCheckpoints}`;
  const usesMinimumInAcceptance = /captures\.length\s*>=\s*MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS/.test(text);
  const hasRouteDecision = /route decision context/i.test(text);
  const hasNoWriteEndContext = /no-write end context/i.test(text);
  const hasMinimumOutput = /minimumAcceptedCheckpoints:\s*MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS/.test(text);
  const ok = text.includes(minimumConstant) && usesMinimumInAcceptance && hasRouteDecision && hasNoWriteEndContext && hasMinimumOutput;
  return {
    specPath: check.specPath,
    expectedMinimumScreenshotCheckpoints: check.expectedMinimumScreenshotCheckpoints,
    ok,
    hasMinimumConstant: text.includes(minimumConstant),
    usesMinimumInAcceptance,
    hasRouteDecision,
    hasNoWriteEndContext,
    hasMinimumOutput
  };
}

const results = [];
let ok = true;

for (const check of checks) {
  const child = runCheck(check.script);
  const listed = runList(check.script);
  const listOk = listed.status === 0 && listed.stdout.includes(check.expectedListSignal);
  const screenshotContract = readSpecScreenshotContract(check);
  if (!screenshotContract.ok) ok = false;
  if (child.status !== 0) {
    ok = false;
    results.push({
      ...check,
      runnerOk: false,
      listOk,
      screenshotContract,
      canRunNow: false,
      blockedBy: ['runner-check-failed', ...(screenshotContract.ok ? [] : ['screenshot-contract-too-weak'])],
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
      screenshotContract,
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
      screenshotContract,
      canRunNow: false,
      blockedBy: ['runner-json-parse-failed', ...(screenshotContract.ok ? [] : ['screenshot-contract-too-weak'])],
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

const allPrepared = results.every(
  (result) =>
    result.runnerOk === true &&
    result.listOk === true &&
    result.screenshotContract?.ok === true &&
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
    result.screenshotContract?.ok === true &&
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
  ok: ok && (allPrepared || authOnlyBlocker),
  activeWorld: {
    instance: 'playthru',
    company: 'UNIVERSAARL-DE',
    legalName: 'Universaarl GmbH'
  },
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  realCustomerProjectBoundary: {
    realBusinessCentralUiRequired: true,
    uiMockupsAllowedAsEvidence: false,
    throwawayDummyDataAllowed: false,
    confidentialRealCustomerDataAllowed: false,
    acceptedDataMode:
      'customer-project-like Universaarl records that are fictional or anonymized, have business purpose, owner, dependencies, UAT/training use and BC setup readiness, and are proven through real playthru UI evidence before they become book or process truth'
  },
  screenshotQaBoundary: {
    minimumAcceptedCheckpoints: 5,
    requiredSpecSignals: [
      'minimumAcceptedCheckpoints',
      'captures.length >= MIN_ACCEPTED_SCREENSHOT_CHECKPOINTS',
      'route decision context',
      'no-write end context'
    ]
  },
  localPrepared,
  allPrepared,
  authOnlyBlocker,
  anyUnexpectedLiveReady,
  approvalRequiredBeforeLiveRun: anyUnexpectedLiveReady,
  liveReadyMeaning:
    anyUnexpectedLiveReady
      ? 'Stored auth and local guards are green; this does not authorize running all Master Data pilots. Select and approve exactly one read-first/no-write pilot.'
      : 'Master Data pilots are locally guarded, but not live-ready yet.',
  foundationParked,
  blockedByLiveGateOrFoundation,
  checks: results,
  nextStep: foundationParked
    ? 'Resolve the Foundation gaps documented in FOUNDATION-READINESS-DECISION.md before any PWS-MD read-first pilot.'
    : authOnlyBlocker
    ? 'PWS-MD read-first runners are locally prepared. Refresh Playwright auth, rerun agent:resume:check, then approve exactly one read-first/no-write Master Data pilot if Foundation gates still allow it.'
    : allPrepared
    ? 'PWS-MD read-first runners are guarded and auth-ready. Approve exactly one read-first/no-write Master Data pilot at a time only after the selected case and Foundation gates still allow it.'
    : 'Fix the failing PWS-MD guarded runner before returning to live Master Data work.'
};

console.log(JSON.stringify(output, null, 2));
if (!output.ok) process.exitCode = 1;
