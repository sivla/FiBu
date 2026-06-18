import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

const budgets = readJson('.agent/budgets.json');
const pkg = readJson('package.json');
const current = readJson('.agent/state/current.json');

const errors = [];
const defaults = budgets.defaults ?? {};
const policy = budgets.dependencyPolicy ?? {};
const profiles = budgets.budgetProfiles ?? {};

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

if (!profiles[defaults.budgetProfile]) {
  errors.push(`budgets.defaults.budgetProfile must reference a known profile: ${defaults.budgetProfile}`);
}

for (const [profileName, profile] of Object.entries(profiles)) {
  for (const [key, min] of [
  ['maxFilesToReadPerRun', 1],
  ['maxEvidenceFilesToReadPerRun', 0],
  ['maxScreenshotMetadataFilesToReadPerRun', 0],
  ['maxSkillsPerRun', 1],
  ['maxPatchFilesPerRun', 0],
]) {
    if (!Number.isInteger(profile[key]) || profile[key] < min) {
      errors.push(`budgets.budgetProfiles.${profileName}.${key} must be an integer >= ${min}`);
    }
  }
}

function profileForCase(activeCase) {
  const requested = activeCase.budgetProfile ?? defaults.budgetProfile;
  if (!profiles[requested]) {
    errors.push(`active case budgetProfile references unknown profile: ${requested}`);
    return profiles[defaults.budgetProfile] ?? defaults;
  }
  return profiles[requested];
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

if (current.active_case_file) {
  const activeCase = readJson(current.active_case_file);
  const activeProfile = profileForCase(activeCase);
  const activeProfileName = activeCase.budgetProfile ?? defaults.budgetProfile;
  if ((activeCase.mustRead?.length ?? 0) > activeProfile.maxFilesToReadPerRun) {
    errors.push(`active case mustRead exceeds ${activeProfileName}.maxFilesToReadPerRun: ${activeCase.mustRead.length} > ${activeProfile.maxFilesToReadPerRun}`);
  }
  if ((activeCase.recommendedSkills?.length ?? 0) > activeProfile.maxSkillsPerRun) {
    errors.push(`active case recommendedSkills exceeds ${activeProfileName}.maxSkillsPerRun: ${activeCase.recommendedSkills.length} > ${activeProfile.maxSkillsPerRun}`);
  }
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
