import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function fail(message, details = {}) {
  console.error(JSON.stringify({
    ok: false,
    script: 'auth-target-diagnose.selftest',
    message,
    details,
  }, null, 2));
  process.exit(1);
}

function pass(details) {
  console.log(JSON.stringify({
    ok: true,
    script: 'auth-target-diagnose.selftest',
    details,
  }, null, 2));
}

const current = JSON.parse(readFileSync('.agent/state/current.json', 'utf8'));
const fakeSourceUrl =
  'https://businesscentral.dynamics.com/11111111-2222-3333-4444-555555555555/MCP_1_20260210?company=RM-DEMO';

let output;
try {
  output = execFileSync(process.execPath, ['scripts/agent/auth-target-diagnose.mjs'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BC_AUTH_URL: fakeSourceUrl,
    },
  });
} catch (error) {
  fail('auth target diagnosis failed for fake legacy source URL.', {
    exitCode: error.status,
    stdout: error.stdout?.toString(),
    stderr: error.stderr?.toString(),
  });
}

let diagnosis;
try {
  diagnosis = JSON.parse(output);
} catch (error) {
  fail('auth target diagnosis did not produce parseable JSON.', {
    error: error.message,
    output,
  });
}

const errors = [];
if (diagnosis.canBuildTargetUrl !== true) errors.push('canBuildTargetUrl should be true.');
if (diagnosis.sourceEnvironmentCandidate !== 'MCP_1_20260210') {
  errors.push('sourceEnvironmentCandidate should preserve the redacted legacy source environment.');
}
if (diagnosis.sourceCompany !== 'RM-DEMO') errors.push('sourceCompany should preserve the legacy source company.');
if (diagnosis.targetEnvironment !== current.instance) errors.push('targetEnvironment must come from current state.');
if (diagnosis.targetCompany !== current.company) errors.push('targetCompany must come from current state.');
if (diagnosis.sourceDiffersFromTarget !== true) errors.push('sourceDiffersFromTarget should be true for this fixture.');
if (diagnosis.targetBuiltFromCurrentState !== true) errors.push('targetBuiltFromCurrentState should be true.');
if (diagnosis.targetMatchesState !== true) errors.push('targetMatchesState should be true.');
if (!Array.isArray(diagnosis.warnings) || diagnosis.warnings.length === 0) {
  errors.push('warnings should explain that the source differs from the active state.');
}
if (JSON.stringify(diagnosis).includes('11111111-2222-3333-4444-555555555555')) {
  errors.push('tenant GUID must be redacted from diagnostic output.');
}

if (errors.length) {
  fail('auth target diagnosis did not preserve the legacy-source/current-target boundary.', {
    errors,
    diagnosis,
  });
}

pass({
  sourceEnvironmentCandidate: diagnosis.sourceEnvironmentCandidate,
  sourceCompany: diagnosis.sourceCompany,
  targetEnvironment: diagnosis.targetEnvironment,
  targetCompany: diagnosis.targetCompany,
  sourceDiffersFromTarget: diagnosis.sourceDiffersFromTarget,
  targetMatchesState: diagnosis.targetMatchesState,
});
