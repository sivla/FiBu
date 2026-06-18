import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function firstItems(value, limit) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function chooseTaskClass(current, activeCase) {
  if (current.requiresStrongModel === true) {
    return 'judge_work';
  }

  const workType = `${activeCase.workType ?? ''} ${current.mode ?? ''}`.toLowerCase();
  const joinedActions = [
    ...(activeCase.allowedActions ?? []),
    ...(current.allowedActions ?? []),
  ].join(' ').toLowerCase();

  if (
    workType.includes('posting') ||
    workType.includes('setup') ||
    joinedActions.includes('posting') ||
    joinedActions.includes('setup')
  ) {
    return 'judge_work';
  }

  if (
    workType.includes('helper') ||
    workType.includes('tool') ||
    joinedActions.includes('helper-analysis') ||
    joinedActions.includes('static-helper-analysis')
  ) {
    return 'wizard_work';
  }

  return 'monkey_work';
}

const current = readJson('.agent/state/current.json');
const project = readJson('.agent/state/project_state.json');
const coverage = readJson('.agent/state/coverage_state.json');
const lastRun = readJson('.agent/state/last_run_summary.json');
const routing = readJson('.agent/model-routing.json');

if (!existsSync(current.active_case_file)) {
  throw new Error(`active case file not found: ${current.active_case_file}`);
}

const activeCase = readJson(current.active_case_file);
const taskClass = chooseTaskClass(current, activeCase);
const route = routing.taskClasses?.[taskClass];

if (!route) {
  throw new Error(`model route not found for task class: ${taskClass}`);
}

const contextPack = {
  schemaVersion: 1,
  purpose: 'compact-autopilot-context',
  branchExpected: current.branchExpected,
  instance: current.instance,
  company: current.company,
  project: project.primaryProject,
  activeArea: current.activeArea,
  activeCase: current.activeCase,
  activeCaseFile: current.active_case_file,
  lastReferenceCase: current.lastReferenceCase,
  workType: activeCase.workType ?? lastRun.workType,
  selectedTaskClass: taskClass,
  selectedRole: route.roleName,
  defaultModelClass: route.defaultModel,
  usageLogRequired: route.usageLogRequired,
  recommendedSkills: firstItems(activeCase.recommendedSkills, 3),
  mustRead: firstItems(activeCase.mustRead, 8),
  allowedActions: firstItems(activeCase.allowedActions ?? current.allowedActions, 12),
  forbiddenActions: firstItems(activeCase.forbiddenActions ?? current.forbiddenActions, 16),
  acceptanceCriteria: firstItems(activeCase.acceptanceCriteria, 6),
  hardExclusions: coverage.hardExclusions ?? {},
  nextStep: current.nextStep ?? lastRun.nextStep,
};

console.log(JSON.stringify(contextPack, null, 2));
