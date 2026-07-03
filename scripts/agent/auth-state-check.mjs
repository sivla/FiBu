import fs from 'node:fs/promises';
import path from 'node:path';

const authFile = path.resolve('playwright/.auth/bc-user.json');
const authMetaFile = path.resolve('playwright/.auth/bc-user.meta.json');
const currentStateFile = path.resolve('.agent/state/current.json');
const maxAgeHours = Number(process.env.BC_AUTH_MAX_AGE_HOURS ?? 12);
const now = Date.now();
const authUnblockStep =
  'Run npm run auth:bc:interactive and complete Login/MFA until the Business Central shell is visible. ' +
  'If it stays on Microsoft sign-in or times out, run npm run auth:bc:probe for a short redacted diagnosis.';

function result(overrides, target = {}) {
  return {
    schemaVersion: 1,
    purpose: 'business-central-auth-state-check',
    authFile: 'playwright/.auth/bc-user.json',
    authMetaFile: 'playwright/.auth/bc-user.meta.json',
    canUseStoredAuth: false,
    exists: false,
    readableJson: false,
    hasShellValidationMeta: false,
    ageHours: null,
    metaAgeHours: null,
    maxAgeHours,
    expectedInstance: target.expectedInstance ?? '',
    expectedCompany: target.expectedCompany ?? '',
    shellValidationMeta: null,
    cookieCount: 0,
    originCount: 0,
    blockedBy: [],
    nextStep: authUnblockStep,
    ...overrides
  };
}

async function main() {
  let expectedInstance = '';
  let expectedCompany = '';
  try {
    const currentState = JSON.parse(await fs.readFile(currentStateFile, 'utf8'));
    expectedInstance = typeof currentState?.instance === 'string' ? currentState.instance : '';
    expectedCompany = typeof currentState?.company === 'string' ? currentState.company : '';
  } catch {
    // Auth can still report storage-state shape, but target context validation will stay unavailable.
  }

  const target = { expectedInstance, expectedCompany };

  let stats;
  try {
    stats = await fs.stat(authFile);
  } catch {
    console.log(
      JSON.stringify(
        result({
          expectedInstance,
          expectedCompany,
          blockedBy: ['storage-state-file-missing']
        }, target),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  const ageHours = Math.round(((now - stats.mtimeMs) / 36_000) * 10) / 1000;
  let parsed;
  try {
    parsed = JSON.parse(await fs.readFile(authFile, 'utf8'));
  } catch {
    console.log(
      JSON.stringify(
        result({
          expectedInstance,
          expectedCompany,
          exists: true,
          ageHours,
          blockedBy: ['storage-state-json-invalid']
        }, target),
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  const cookies = Array.isArray(parsed.cookies) ? parsed.cookies : [];
  const origins = Array.isArray(parsed.origins) ? parsed.origins : [];
  const blockedBy = [];
  let metaAgeHours = null;
  let hasShellValidationMeta = false;
  let metaMtimeMs = null;
  let shellValidationMeta = null;

  try {
    const metaStats = await fs.stat(authMetaFile);
    metaMtimeMs = metaStats.mtimeMs;
    metaAgeHours = Math.round(((now - metaStats.mtimeMs) / 36_000) * 10) / 1000;
    const meta = JSON.parse(await fs.readFile(authMetaFile, 'utf8'));
    const metaEnvironment = typeof meta?.pathname === 'string' ? meta.pathname.split('/').filter(Boolean).at(-1) ?? '' : '';
    const metaCompany = typeof meta?.company === 'string' ? meta.company : '';
    shellValidationMeta = {
      generatedAt: typeof meta?.generatedAt === 'string' ? meta.generatedAt : '',
      host: typeof meta?.host === 'string' ? meta.host : '',
      environment: metaEnvironment,
      company: metaCompany,
      matchedShellSignal: typeof meta?.matchedShellSignal === 'string' ? meta.matchedShellSignal : ''
    };
    hasShellValidationMeta =
      meta?.schemaVersion === 1 &&
      meta?.purpose === 'business-central-auth-shell-validation' &&
      meta?.shellValidation === true &&
      typeof meta?.matchedShellSignal === 'string' &&
      meta.matchedShellSignal.length > 0;
    if (expectedInstance && metaEnvironment !== expectedInstance) {
      blockedBy.push('shell-validation-environment-mismatch');
    }
    if (expectedCompany && metaCompany !== expectedCompany) {
      blockedBy.push('shell-validation-company-mismatch');
    }
  } catch {
    blockedBy.push('shell-validation-meta-missing-or-invalid');
  }

  if (!hasShellValidationMeta && !blockedBy.includes('shell-validation-meta-missing-or-invalid')) {
    blockedBy.push('shell-validation-meta-missing-or-invalid');
  }
  if (metaMtimeMs !== null && metaMtimeMs + 1000 < stats.mtimeMs) blockedBy.push('shell-validation-meta-older-than-storage-state');
  if (ageHours > maxAgeHours) blockedBy.push('storage-state-too-old');
  if (metaAgeHours !== null && metaAgeHours > maxAgeHours) blockedBy.push('shell-validation-meta-too-old');
  if (!cookies.length) blockedBy.push('storage-state-has-no-cookies');

  console.log(
    JSON.stringify(
      result({
        canUseStoredAuth: blockedBy.length === 0,
        exists: true,
        readableJson: true,
        hasShellValidationMeta,
        ageHours,
        metaAgeHours,
        expectedInstance,
        expectedCompany,
        shellValidationMeta,
        cookieCount: cookies.length,
        originCount: origins.length,
        blockedBy,
        nextStep:
          blockedBy.length === 0
            ? 'Stored auth has local shell-validation metadata. Live tests must still validate the Business Central shell.'
            : authUnblockStep
      }),
      null,
      2
    )
  );

  if (blockedBy.length) process.exitCode = 1;
}

await main();
