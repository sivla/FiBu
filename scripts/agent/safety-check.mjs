import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

const errors = [];
const current = readJson('.agent/state/current.json');
const project = readJson('.agent/state/project_state.json');
const budgets = readJson('.agent/budgets.json');
const gitignore = existsSync('.gitignore') ? readFileSync('.gitignore', 'utf8') : '';

const configuredInstance = project.businessCentral?.instance;
const configuredCompany = project.businessCentral?.primaryCompany;

if (typeof configuredInstance !== 'string' || configuredInstance.trim() === '') {
  errors.push('project_state businessCentral.instance must be a non-empty string');
}

if (typeof configuredCompany !== 'string' || configuredCompany.trim() === '') {
  errors.push('project_state businessCentral.primaryCompany must be a non-empty string');
}

if (configuredInstance !== current.instance) {
  errors.push(`current.instance must match project_state businessCentral.instance: ${configuredInstance} vs ${current.instance}`);
}

if (configuredCompany !== current.company) {
  errors.push(`current.company must match project_state businessCentral.primaryCompany: ${configuredCompany} vs ${current.company}`);
}

if (project.safety?.doNotLeaveInstance !== true) {
  errors.push('project_state.safety.doNotLeaveInstance must be true');
}

for (const forbidden of ['leave-instance', 'commit-secrets', 'show-env-or-auth', 'fake-evidence', 'book-claim-without-evidence']) {
  if (!current.forbiddenActions?.includes(forbidden)) {
    errors.push(`current.forbiddenActions must include hard stop ${forbidden}`);
  }
}

for (const locked of ['post', 'preview-posting', 'api-shortcut']) {
  if (!current.defaultLockedActions?.includes(locked)) {
    errors.push(`current.defaultLockedActions must include default lock ${locked}`);
  }
}

for (const ignored of ['.env', 'playwright/.auth/', 'playwright-report/', 'test-results/']) {
  if (!gitignore.includes(ignored)) {
    errors.push(`.gitignore must include ${ignored}`);
  }
}

for (const pattern of budgets.neverReadOrCommit ?? []) {
  if (pattern.endsWith('/') && !gitignore.includes(pattern)) {
    errors.push(`neverReadOrCommit directory should be ignored: ${pattern}`);
  }
}

if (errors.length) {
  console.error(`Agent safety check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('Agent safety check OK');
