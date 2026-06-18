import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

const budgets = readJson('.agent/budgets.json');
const pkg = readJson('package.json');

const errors = [];
const defaults = budgets.defaults ?? {};
const policy = budgets.dependencyPolicy ?? {};

for (const [key, min] of [
  ['maxFilesToReadPerRun', 1],
  ['maxMarkdownLinesPerLargeFile', 1],
  ['maxEvidenceFilesToReadPerRun', 0],
  ['maxScreenshotMetadataFilesToReadPerRun', 0],
  ['maxSkillsPerRun', 1],
  ['maxPatchFilesPerRun', 0],
  ['maxOutputTokensPerSkill', 1],
]) {
  if (!Number.isInteger(defaults[key]) || defaults[key] < min) {
    errors.push(`budgets.defaults.${key} must be an integer >= ${min}`);
  }
}

if (defaults.readWholeBook !== false) {
  errors.push('budgets.defaults.readWholeBook must stay false');
}

if (defaults.newNpmDependenciesAllowed !== false) {
  errors.push('budgets.defaults.newNpmDependenciesAllowed must stay false');
}

if (defaults.agentToolsRuntime !== 'node-stdlib-only') {
  errors.push('budgets.defaults.agentToolsRuntime must be node-stdlib-only');
}

if (policy.lockfileRequired !== true) {
  errors.push('budgets.dependencyPolicy.lockfileRequired must be true');
}

const runtimeDeps = Object.keys(pkg.dependencies ?? {});
const allowedRuntimeDeps = new Set(policy.allowedRuntimeDependencies ?? []);
for (const dep of runtimeDeps) {
  if (!allowedRuntimeDeps.has(dep)) {
    errors.push(`runtime dependency is not allowed by agent policy: ${dep}`);
  }
}

const devDeps = Object.keys(pkg.devDependencies ?? {});
const allowedDevDeps = new Set(policy.allowedDevDependencies ?? []);
for (const dep of devDeps) {
  if (!allowedDevDeps.has(dep)) {
    errors.push(`dev dependency is not allowed by agent policy: ${dep}`);
  }
}

if (errors.length) {
  console.error(`Agent budget check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('Agent budget check OK');
