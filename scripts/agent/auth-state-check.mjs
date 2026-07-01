import fs from 'node:fs/promises';
import path from 'node:path';

const authFile = path.resolve('playwright/.auth/bc-user.json');
const maxAgeHours = Number(process.env.BC_AUTH_MAX_AGE_HOURS ?? 12);
const now = Date.now();

function result(overrides) {
  return {
    schemaVersion: 1,
    purpose: 'business-central-auth-state-check',
    authFile: 'playwright/.auth/bc-user.json',
    canUseStoredAuth: false,
    exists: false,
    readableJson: false,
    ageHours: null,
    maxAgeHours,
    cookieCount: 0,
    originCount: 0,
    blockedBy: [],
    nextStep: 'Run npm run auth:bc and complete Login/MFA until the Business Central shell is visible.',
    ...overrides
  };
}

async function main() {
  let stats;
  try {
    stats = await fs.stat(authFile);
  } catch {
    console.log(
      JSON.stringify(
        result({
          blockedBy: ['storage-state-file-missing']
        }),
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
          exists: true,
          ageHours,
          blockedBy: ['storage-state-json-invalid']
        }),
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
  if (ageHours > maxAgeHours) blockedBy.push('storage-state-too-old');
  if (!cookies.length) blockedBy.push('storage-state-has-no-cookies');

  console.log(
    JSON.stringify(
      result({
        canUseStoredAuth: blockedBy.length === 0,
        exists: true,
        readableJson: true,
        ageHours,
        cookieCount: cookies.length,
        originCount: origins.length,
        blockedBy,
        nextStep:
          blockedBy.length === 0
            ? 'Stored auth has a plausible local shape. Live tests must still validate the Business Central shell.'
            : 'Run npm run auth:bc and complete Login/MFA until the Business Central shell is visible.'
      }),
      null,
      2
    )
  );

  if (blockedBy.length) process.exitCode = 1;
}

await main();
