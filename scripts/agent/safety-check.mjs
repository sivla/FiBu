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
const authorityPath = '.agent/PLAYTHRU-AUTHORITY-CHARTER.md';
const operatingModelPath = '.agent/BC-OPERATING-MODEL.md';
const authRefreshResultPath = 'playwright/projects/fibu-book5/evidence/auth-bc-refresh-active-resume/AUTH-BC-REFRESH-result.json';
const authorityText = existsSync(authorityPath) ? readFileSync(authorityPath, 'utf8') : '';
const operatingModelText = existsSync(operatingModelPath) ? readFileSync(operatingModelPath, 'utf8') : '';
const authRefreshResultText = existsSync(authRefreshResultPath) ? readFileSync(authRefreshResultPath, 'utf8') : '';

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

if (!authorityText.includes('Playthru Authority Charter')) {
  errors.push(`${authorityPath} must define the Playthru Authority Charter`);
}

for (const phrase of ['playthru', 'Destructive action protocol', 'Company strategy', 'does not override the currently active Improvement Freeze']) {
  if (!authorityText.includes(phrase)) {
    errors.push(`${authorityPath} must mention: ${phrase}`);
  }
}

if (!operatingModelText.includes(authorityPath)) {
  errors.push(`${operatingModelPath} must reference ${authorityPath}`);
}

if (current.authorityCharter?.path !== authorityPath) {
  errors.push(`current.authorityCharter.path must be ${authorityPath}`);
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

if (authRefreshResultText) {
  const authRefreshResult = JSON.parse(authRefreshResultText);
  const diagnosisPathname = String(authRefreshResult.authDiagnosis?.diagnosisPathname ?? '');
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(authRefreshResultText)) {
    errors.push(`${authRefreshResultPath} must not contain raw tenant or object GUIDs; use {tenant-guid} redaction`);
  }
  if (/access_token|refresh_token|id_token|client_secret|password|Bearer |Set-Cookie|eyJ/i.test(authRefreshResultText)) {
    errors.push(`${authRefreshResultPath} must not contain auth secrets, cookies or token-like payloads`);
  }
  if (diagnosisPathname && !diagnosisPathname.includes('{tenant-guid}')) {
    errors.push(`${authRefreshResultPath} authDiagnosis.diagnosisPathname must use {tenant-guid} redaction`);
  }
}

if (errors.length) {
  console.error(`Agent safety check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('Agent safety check OK');
