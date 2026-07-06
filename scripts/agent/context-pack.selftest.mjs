import { execFileSync } from 'node:child_process';

function fail(message, details = {}) {
  console.error(JSON.stringify({
    ok: false,
    script: 'context-pack.selftest',
    message,
    details,
  }, null, 2));
  process.exit(1);
}

function pass(details) {
  console.log(JSON.stringify({
    ok: true,
    script: 'context-pack.selftest',
    details,
  }, null, 2));
}

let context;
try {
  const output = execFileSync(process.execPath, ['scripts/agent/context-pack.mjs'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  context = JSON.parse(output);
} catch (error) {
  fail('agent:context did not produce parseable JSON.', {
    error: error.message,
    stderr: error.stderr?.toString(),
  });
}

const liveGate = context.liveGate ?? {};
const authGate = context.authGate ?? {};
const liveBlocked = liveGate.businessCentralLiveAllowed === false;
const storedAuthUsableButBlocked = authGate.decision === 'stored-auth-usable-but-live-gate-blocked';

if (liveBlocked && authGate.canRunBusinessCentralWorkflows === true) {
  fail('Live gate blocks Business Central, but authGate allows workflows.', {
    liveGate,
    authGate,
  });
}

if (liveBlocked && authGate.decision === 'stored-auth-usable-run-readonly-or-gated-target-tests') {
  fail('Stored auth must not be presented as runnable while the live gate blocks Business Central.', {
    liveGate,
    authGate,
  });
}

if (liveBlocked && storedAuthUsableButBlocked) {
  const nextSafeAction = authGate.nextSafeAction ?? '';
  if (!/blocked|freeze|gesperrt|eingefroren/i.test(nextSafeAction)) {
    fail('Blocked stored-auth decision must explain that live work remains blocked.', {
      liveGate,
      authGate,
    });
  }
}

if (authGate.target) {
  const target = authGate.target;
  if (target.instance !== 'playthru' || target.company !== 'UNIVERSAARL-DE') {
    fail('Auth target in context must reflect the active Universaarl target world.', {
      target,
    });
  }

  if (target.sourceDiffersFromTarget === true) {
    if (target.targetBuiltFromCurrentState !== true || target.targetMatchesState !== true) {
      fail('Legacy auth source must be marked as rebuilt from current state and matching the active target.', {
        target,
      });
    }
  }
}

pass({
  activeCase: context.activeCase,
  businessCentralLiveAllowed: liveGate.businessCentralLiveAllowed,
  authDecision: authGate.decision ?? null,
  canRunBusinessCentralWorkflows: authGate.canRunBusinessCentralWorkflows ?? null,
  authTarget: authGate.target ?? null,
});
