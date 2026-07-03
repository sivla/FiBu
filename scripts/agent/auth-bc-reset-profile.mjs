import { existsSync, rmSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const authRoot = resolve('playwright/.auth');
const targets = [
  resolve('playwright/.auth/bc-profile'),
  resolve('playwright/.auth/bc-user.json'),
  resolve('playwright/.auth/bc-user.meta.json'),
];
const confirmed = process.argv.includes('--confirm');

function isInsideAuthRoot(path) {
  const rel = relative(authRoot, path);
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith('/') && !rel.startsWith('\\'));
}

const plan = targets.map(path => ({
  path: path.replaceAll('\\', '/'),
  exists: existsSync(path),
  safeTarget: isInsideAuthRoot(path),
}));

if (!plan.every(item => item.safeTarget)) {
  console.error(JSON.stringify({
    schemaVersion: 1,
    purpose: 'business-central-auth-profile-reset',
    canReset: false,
    resetMode: confirmed,
    blockedBy: ['unsafe-auth-reset-target'],
    targets: plan,
  }, null, 2));
  process.exit(1);
}

if (!confirmed) {
  console.log(JSON.stringify({
    schemaVersion: 1,
    purpose: 'business-central-auth-profile-reset',
    canReset: false,
    resetMode: false,
    reason: 'Dry run only. Re-run with --confirm to remove the ignored local Playwright auth profile and storage state.',
    targets: plan,
    nextStep: 'npm run auth:bc:reset-profile -- --confirm',
  }, null, 2));
  process.exit(0);
}

for (const item of plan) {
  if (item.exists) rmSync(item.path, { recursive: true, force: true });
}

console.log(JSON.stringify({
  schemaVersion: 1,
  purpose: 'business-central-auth-profile-reset',
  canReset: true,
  resetMode: true,
  removedTargets: plan.filter(item => item.exists),
  skippedTargets: plan.filter(item => !item.exists),
  nextStep: 'Run npm run auth:bc:interactive and complete Login/MFA in the Playwright-opened browser window until Business Central shell is visible.',
}, null, 2));
