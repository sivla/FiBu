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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function includesRisk(action) {
  const normalized = action.toLowerCase();
  return [
    'post',
    'preview-posting',
    'ship',
    'invoice',
    'payment',
    'acquisition',
    'depreciation',
    'setup',
    'change',
    'create',
    'enter-',
    'keep-draft',
    'company-switch',
    'api-shortcut',
  ].some((word) => normalized.includes(word));
}

function isStateChangingAction(action) {
  const normalized = action.toLowerCase();
  if (normalized.includes('read-only')) {
    return false;
  }
  return [
    'post',
    'ship',
    'invoice',
    'payment',
    'acquisition',
    'depreciation',
    'setup',
    'fit',
    'create',
    'change',
    'enter-',
    'keep-draft',
    'cleanup',
    'company-switch',
    'api-shortcut',
  ].some((word) => normalized.includes(word));
}

function chooseTaskClass(current, activeCase) {
  if (typeof activeCase.taskClass === 'string' && activeCase.taskClass.length > 0) {
    return activeCase.taskClass;
  }

  if (current.requiresStrongModel === true) {
    return 'judge_work';
  }

  const workType = `${activeCase?.workType ?? ''} ${current.mode ?? ''}`.toLowerCase();
  const joinedActions = [
    ...(activeCase?.allowedActions ?? []),
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

function gatesForActions(actions) {
  const gates = [];
  for (const action of actions) {
    const normalized = action.toLowerCase();
    if (normalized.includes('post') || normalized.includes('ship') || normalized.includes('invoice')) {
      gates.push('posting_safety_gate');
    }
    if (normalized.includes('payment')) {
      gates.push('posting_safety_gate');
      gates.push('payment-approval-gate');
    }
    if (normalized.includes('setup') || normalized.includes('change') || normalized.includes('fit')) {
      gates.push('setup-change-gate');
    }
    if (normalized.includes('company-switch')) {
      gates.push('company-context-gate');
    }
    if (normalized.includes('api-shortcut')) {
      gates.push('api-shortcut-exception-gate');
    }
    if (normalized.includes('enter-') || normalized.includes('keep-draft') || normalized.includes('create')) {
      gates.push('ui-state-change-gate');
    }
  }
  return unique(gates);
}

const validationCommands = [
  'npm run agent:preflight',
  'npm run agent:dry-run',
  'npm run check:encoding',
  'git diff --check',
];

const stopConditions = [];
const safetyGates = ['instance-boundary-gate', 'no-bc-execution-in-dry-run', 'no-playwright-execution-in-dry-run'];

const current = readJson('.agent/state/current.json');
const project = readJson('.agent/state/project_state.json');
const coverage = readJson('.agent/state/coverage_state.json');
const budgets = readJson('.agent/budgets.json');
const routing = readJson('.agent/model-routing.json');
const capabilities = readJson('.agent/capabilities.json');

let activeCase = null;
if (!current.activeCase) {
  stopConditions.push('current.activeCase is missing');
}
if (!current.active_case_file) {
  stopConditions.push('current.active_case_file is missing');
} else if (!existsSync(current.active_case_file)) {
  stopConditions.push(`active_case_file does not exist: ${current.active_case_file}`);
} else {
  activeCase = readJson(current.active_case_file);
}

const budgetProfileName =
  activeCase?.budgetProfile ??
  budgets.defaults?.budgetProfile ??
  'standard';
const budgetProfile = budgets.budgetProfiles?.[budgetProfileName] ?? budgets.defaults;

if (!budgetProfile) {
  stopConditions.push(`budget profile is unclear: ${budgetProfileName}`);
}

const maxFiles = budgetProfile?.maxFilesToReadPerRun ?? 0;
const maxSkills = budgetProfile?.maxSkillsPerRun ?? 0;
const filesToRead = firstItems(activeCase?.mustRead ?? [], maxFiles);
const filesNotToRead = unique([
  ...firstItems(activeCase?.mustRead ?? [], 999).slice(maxFiles),
  ...(budgets.neverReadOrCommit ?? []),
  project.book?.mainFile,
  'playwright-report/',
  'test-results/',
  'playwright/.auth/',
]);
const selectedSkills = firstItems(activeCase?.recommendedSkills ?? [], maxSkills);
const allowedActions = activeCase?.allowedActions ?? current.allowedActions ?? [];
const forbiddenActions = activeCase?.forbiddenActions ?? current.forbiddenActions ?? [];

if ((activeCase?.mustRead ?? []).length > maxFiles) {
  stopConditions.push(`mustRead exceeds budget: ${(activeCase?.mustRead ?? []).length}/${maxFiles}`);
}
if ((activeCase?.recommendedSkills ?? []).length > maxSkills) {
  stopConditions.push(`recommendedSkills exceeds budget: ${(activeCase?.recommendedSkills ?? []).length}/${maxSkills}`);
}

const missingFiles = filesToRead.filter((file) => !existsSync(file));
for (const file of missingFiles) {
  stopConditions.push(`planned fileToRead is missing: ${file}`);
}

const selectedTaskClass = chooseTaskClass(current, activeCase);
const route = routing.taskClasses?.[selectedTaskClass];
if (!route) {
  stopConditions.push(`model route is unclear for taskClass: ${selectedTaskClass}`);
}

const selectedModelClass = route?.defaultModel ?? '';
const usageLogRequired =
  selectedTaskClass === 'judge_work' ||
  selectedTaskClass === 'big_brain_review' ||
  route?.usageLogRequired === true;

if (usageLogRequired && route?.usageLogRequired !== true) {
  stopConditions.push(`usageLogRequired is inconsistent for taskClass: ${selectedTaskClass}`);
}

const selectedCapabilities = capabilities.capabilities
  ?.filter((capability) =>
    capability.taskClass === selectedTaskClass ||
    capability.linkedSkills?.some((skill) => selectedSkills.includes(skill)))
  .slice(0, 6)
  .map((capability) => ({
    id: capability.id,
    maturity: capability.maturity,
    taskClass: capability.taskClass,
    gates: capability.gates,
  })) ?? [];

if (!Array.isArray(capabilities.capabilities) || capabilities.capabilities.length === 0) {
  stopConditions.push('capability registry is unclear or empty');
}

const riskyForbiddenActions = forbiddenActions.filter(includesRisk);
const riskyAllowedActions = allowedActions.filter(includesRisk);
const stateChangingAllowedActions = allowedActions.filter(isStateChangingAction);

safetyGates.push(...gatesForActions(riskyForbiddenActions));
if (riskyForbiddenActions.length) {
  safetyGates.push('forbidden-actions-win');
}
if (riskyAllowedActions.length) {
  safetyGates.push(...gatesForActions(riskyAllowedActions));
}

if (project.businessCentral?.instance !== current.instance) {
  stopConditions.push(`project/current instance mismatch: ${project.businessCentral?.instance} vs ${current.instance}`);
}
if (coverage.hardExclusions?.shopify) {
  safetyGates.push('shopify-hard-excluded');
}

const requiresHumanApproval = stateChangingAllowedActions.length > 0 || selectedTaskClass === 'big_brain_review';
if (requiresHumanApproval) {
  safetyGates.push('human-approval-before-state-change');
}

const canProceed = stopConditions.length === 0;
const reason = canProceed
  ? `Plan is safe to hand to ${selectedTaskClass}: read ${filesToRead.length}/${maxFiles} files, load ${selectedSkills.length}/${maxSkills} skills, no BC or Playwright execution.`
  : `Dry-run blocked: ${stopConditions.join('; ')}`;

const dryRun = {
  schemaVersion: 1,
  purpose: 'autopilot-dry-run',
  canProceed,
  selectedTaskClass,
  selectedModelClass,
  usageLogRequired,
  budgetProfile: budgetProfileName,
  selectedCapabilities,
  selectedSkills,
  filesToRead,
  filesNotToRead,
  allowedActions,
  forbiddenActions,
  safetyGates: unique(safetyGates),
  stopConditions,
  nextSafeAction: canProceed
    ? 'Run local diagnosis/plan only; do not execute Business Central or Playwright from dry-run.'
    : 'Fix stopConditions before selecting a live agent run.',
  requiresHumanApproval,
  reason,
  validationCommands,
};

console.log(JSON.stringify(dryRun, null, 2));
