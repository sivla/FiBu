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

if (current.instance !== 'MCP_1_20260210') {
  errors.push(`current.instance must stay MCP_1_20260210, got ${current.instance}`);
}

if (project.businessCentral?.instance !== 'MCP_1_20260210') {
  errors.push(`project_state businessCentral.instance must stay MCP_1_20260210`);
}

if (project.safety?.doNotLeaveInstance !== true) {
  errors.push('project_state.safety.doNotLeaveInstance must be true');
}

for (const forbidden of ['post', 'preview-posting', 'api-shortcut']) {
  if (!current.forbiddenActions?.includes(forbidden)) {
    errors.push(`current.forbiddenActions must include ${forbidden}`);
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
