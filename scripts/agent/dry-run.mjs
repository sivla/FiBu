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
const budgets = readJson('.agent/budgets.json');
const routing = readJson('.agent/model-routing.json');
const capabilities = readJson('.agent/capabilities.json');

if (!existsSync(current.active_case_file)) {
  throw new Error(`active case file not found: ${current.active_case_file}`);
}

const activeCase = readJson(current.active_case_file);
const budgetProfileName = activeCase.budgetProfile ?? budgets.defaults?.budgetProfile ?? 'standard';
const budgetProfile = budgets.budgetProfiles?.[budgetProfileName] ?? budgets.defaults ?? {};
const taskClass = chooseTaskClass(current, activeCase);
const route = routing.taskClasses?.[taskClass];

if (!route) {
  throw new Error(`model route not found for ${taskClass}`);
}

const maxFiles = budgetProfile.maxFilesToReadPerRun ?? budgets.defaults?.maxFilesToReadPerRun ?? 8;
const maxSkills = budgetProfile.maxSkillsPerRun ?? budgets.defaults?.maxSkillsPerRun ?? 3;
const mustRead = firstItems(activeCase.mustRead, maxFiles);
const recommendedSkills = firstItems(activeCase.recommendedSkills, maxSkills);
const allowedActions = activeCase.allowedActions ?? current.allowedActions ?? [];
const forbiddenActions = activeCase.forbiddenActions ?? current.forbiddenActions ?? [];

const riskyWords = [
  'post',
  'preview-posting',
  'ship',
  'invoice',
  'payment',
  'setup-change',
  'company-switch',
  'api-shortcut',
];

const riskyAllowed = allowedActions.filter((action) =>
  riskyWords.some((word) => action.toLowerCase().includes(word)),
);

const missingMustRead = mustRead.filter((file) => !existsSync(file));
const linkedCapabilities = capabilities.capabilities
  ?.filter((capability) =>
    capability.taskClass === taskClass ||
    capability.linkedSkills?.some((skill) => recommendedSkills.includes(skill)))
  .slice(0, 6)
  .map((capability) => ({
    id: capability.id,
    maturity: capability.maturity,
    taskClass: capability.taskClass,
  })) ?? [];

const gates = [];
if (project.businessCentral?.instance !== current.instance) {
  gates.push(`project instance ${project.businessCentral?.instance} differs from current ${current.instance}`);
}
if (coverage.hardExclusions?.shopify) {
  gates.push('shopify hard exclusion present');
}
if (missingMustRead.length) {
  gates.push(`missing mustRead files: ${missingMustRead.join(', ')}`);
}
if (riskyAllowed.length) {
  gates.push(`risky allowed actions require explicit runtime gate: ${riskyAllowed.join(', ')}`);
}

const dryRun = {
  schemaVersion: 1,
  purpose: 'agent-dry-run-no-bc-no-playwright',
  branchExpected: current.branchExpected,
  instance: current.instance,
  company: current.company,
  activeCase: current.activeCase,
  activeCaseFile: current.active_case_file,
  workType: activeCase.workType,
  selectedTaskClass: taskClass,
  selectedRole: route.roleName,
  defaultModelClass: route.defaultModel,
  spawnModel: route.subagentSpawn?.spawnModel,
  reasoningEffort: route.subagentSpawn?.reasoningEffort,
  budgetProfile: budgetProfileName,
  mustRead,
  recommendedSkills,
  linkedCapabilities,
  allowedActions,
  forbiddenActions,
  acceptanceCriteria: firstItems(activeCase.acceptanceCriteria, 8),
  executionPlan: [
    'Run agent:preflight.',
    'Read only the listed mustRead files.',
    'Load only the listed recommended skills.',
    'Perform the selected local diagnosis or plan.',
    'Do not execute Business Central or Playwright in dry-run mode.',
  ],
  gateNotes: gates,
  mayExecuteBc: false,
  mayExecutePlaywright: false,
  mayPost: false,
};

console.log(JSON.stringify(dryRun, null, 2));
