import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function requireString(obj, key, file, errors) {
  if (typeof obj[key] !== 'string' || obj[key].trim() === '') {
    errors.push(`${file}.${key} must be a non-empty string`);
  }
}

function requireArray(obj, key, file, errors) {
  if (!Array.isArray(obj[key])) {
    errors.push(`${file}.${key} must be an array`);
  }
}

function arraysEqual(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

const errors = [];

const files = {
  project: '.agent/state/project_state.json',
  current: '.agent/state/current.json',
  coverage: '.agent/state/coverage_state.json',
  lastRun: '.agent/state/last_run_summary.json',
  budgets: '.agent/budgets.json',
};

for (const path of Object.values(files)) {
  if (!existsSync(path)) {
    errors.push(`missing required file: ${path}`);
  }
}

const project = readJson(files.project);
const current = readJson(files.current);
const coverage = readJson(files.coverage);
const lastRun = readJson(files.lastRun);
readJson(files.budgets);

requireString(project, 'repository', files.project, errors);
requireString(project, 'primaryProject', files.project, errors);
requireString(current, 'instance', files.current, errors);
requireString(current, 'company', files.current, errors);
requireString(current, 'activeArea', files.current, errors);
requireString(current, 'activeCase', files.current, errors);
requireString(current, 'active_case_file', files.current, errors);
if (typeof current.activeNextStepAuthority !== 'object' || current.activeNextStepAuthority === null) {
  errors.push(`${files.current}.activeNextStepAuthority must define the active next-step precedence`);
} else if (current.activeNextStepAuthority.ignoreHistoricalResultNextSteps !== true) {
  errors.push(
    `${files.current}.activeNextStepAuthority.ignoreHistoricalResultNextSteps must be true so historical result blocks cannot override active next steps`,
  );
} else {
  const selectedNextCase = current.activeNextStepAuthority.selectedNextCase;
  const expectedNextCase = current.nextCase ?? current.activeCase;
  if (selectedNextCase !== expectedNextCase) {
    errors.push(
      `${files.current}.activeNextStepAuthority.selectedNextCase must match current.nextCase/current.activeCase: ${selectedNextCase} vs ${expectedNextCase}`,
    );
  }
  const authorityCaseFile = current.activeNextStepAuthority.activeCaseFile;
  const expectedCaseFile = current.preparedNextCaseFile ?? current.active_case_file;
  if (authorityCaseFile !== undefined && authorityCaseFile !== expectedCaseFile) {
    errors.push(
      `${files.current}.activeNextStepAuthority.activeCaseFile must match current.preparedNextCaseFile/current.active_case_file: ${authorityCaseFile} vs ${expectedCaseFile}`,
    );
  }
}
if (current.activeCaseFile !== undefined && current.activeCaseFile !== current.active_case_file) {
  errors.push(
    `current.activeCaseFile must mirror current.active_case_file when present: ${current.activeCaseFile} vs ${current.active_case_file}`,
  );
}
requireArray(current, 'allowedActions', files.current, errors);
requireArray(current, 'forbiddenActions', files.current, errors);
requireString(lastRun, 'runId', files.lastRun, errors);
requireString(lastRun, 'nextStep', files.lastRun, errors);

if (!existsSync(current.active_case_file)) {
  errors.push(`current.active_case_file does not exist: ${current.active_case_file}`);
} else {
  const activeCase = readJson(current.active_case_file);
  if (activeCase.caseId !== current.activeCase) {
    errors.push(`active case mismatch: current=${current.activeCase}, case file=${activeCase.caseId}`);
  }
  if (Array.isArray(activeCase.allowedActions) && !arraysEqual(current.allowedActions, activeCase.allowedActions)) {
    errors.push(`current.allowedActions must mirror active case allowedActions: ${current.active_case_file}`);
  }
  if (Array.isArray(activeCase.forbiddenActions) && !arraysEqual(current.forbiddenActions, activeCase.forbiddenActions)) {
    errors.push(`current.forbiddenActions must mirror active case forbiddenActions: ${current.active_case_file}`);
  }
}

if (typeof coverage.areas !== 'object' || coverage.areas === null) {
  errors.push(`${files.coverage}.areas must be an object`);
}

if (project.businessCentral?.instance !== current.instance) {
  errors.push(`project/current instance mismatch: ${project.businessCentral?.instance} vs ${current.instance}`);
}

if (project.businessCentral?.primaryCompany !== current.company) {
  errors.push(`project/current company mismatch: ${project.businessCentral?.primaryCompany} vs ${current.company}`);
}

if (errors.length) {
  console.error(`Agent state validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('Agent state validation OK');
