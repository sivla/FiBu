import { existsSync, readFileSync } from 'node:fs';

function readDotEnv() {
  if (!existsSync('.env')) return {};
  const env = {};
  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function redactPath(pathname) {
  return pathname.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '{tenant-guid}'
  );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const localEnv = readDotEnv();
const env = { ...localEnv, ...process.env };
const source = env.BC_AUTH_URL ? 'BC_AUTH_URL' : env.FIBU_BOOK5_BC_URL ? 'FIBU_BOOK5_BC_URL' : 'BC_URL';
const rawUrl = env.BC_AUTH_URL ?? env.FIBU_BOOK5_BC_URL ?? env.BC_URL ?? '';
const current = readJson('.agent/state/current.json');

if (!rawUrl) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'business-central-auth-target-diagnosis',
        canBuildTargetUrl: false,
        blockedBy: ['missing-bc-url-env'],
        source,
      },
      null,
      2
    )
  );
  process.exit(1);
}

let before;
let after;
try {
  before = new URL(rawUrl);
  after = new URL(rawUrl);
} catch {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'business-central-auth-target-diagnosis',
        canBuildTargetUrl: false,
        blockedBy: ['invalid-bc-url-env'],
        source,
        redaction: 'Full URL, tenant IDs, auth values, cookies and tokens are intentionally not printed.',
      },
      null,
      2
    )
  );
  process.exit(1);
}

const expectedEnvironment = current.instance ?? before.pathname.split('/').filter(Boolean).at(-1) ?? '';
const expectedCompany = current.company ?? before.searchParams.get('company') ?? '';

if (expectedEnvironment) {
  const pathParts = after.pathname.split('/').filter(Boolean);
  if (pathParts.length) {
    pathParts[pathParts.length - 1] = expectedEnvironment;
    after.pathname = `/${pathParts.join('/')}`;
  }
}

if (expectedCompany) {
  after.searchParams.set('company', expectedCompany);
}

const beforePathParts = before.pathname.split('/').filter(Boolean);
const afterPathParts = after.pathname.split('/').filter(Boolean);
const sourceEnvironmentCandidate = beforePathParts.at(-1) ?? '';
const targetEnvironment = afterPathParts.at(-1) ?? '';
const sourceCompany = before.searchParams.get('company') ?? '';
const targetCompany = after.searchParams.get('company') ?? '';
const sourceDiffersFromTarget =
  sourceEnvironmentCandidate !== targetEnvironment || (sourceCompany && sourceCompany !== targetCompany);
const warnings = [];

if (sourceDiffersFromTarget) {
  warnings.push(
    'Source URL differs from active state; this is acceptable only because the diagnostic target URL is rebuilt from .agent/state/current.json.'
  );
}

const result = {
  schemaVersion: 1,
  purpose: 'business-central-auth-target-diagnosis',
  canBuildTargetUrl: true,
  source,
  host: before.hostname,
  sourcePathRedacted: redactPath(before.pathname),
  targetPathRedacted: redactPath(after.pathname),
  sourceEnvironmentCandidate,
  targetEnvironment,
  expectedEnvironment,
  sourceCompanyParamPresent: before.searchParams.has('company'),
  targetCompanyParamPresent: after.searchParams.has('company'),
  sourceCompany,
  expectedCompany,
  targetCompany,
  sourceDiffersFromTarget,
  targetBuiltFromCurrentState: true,
  targetMatchesState: targetEnvironment === expectedEnvironment && targetCompany === expectedCompany,
  warnings,
  redaction: 'Full URL, tenant IDs, auth values, cookies and tokens are intentionally not printed.',
};

console.log(JSON.stringify(result, null, 2));

if (!result.targetMatchesState) {
  process.exit(1);
}
