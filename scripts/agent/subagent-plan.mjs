import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(resolve(filePath), 'utf8'));
  } catch (error) {
    throw new Error(`${filePath}: ${error.message}`);
  }
}

function runJson(command) {
  return JSON.parse(execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function readFileInputs(runPlan) {
  return (runPlan.steps ?? [])
    .filter((step) => step.type === 'read-file' && step.allowed !== false && step.path)
    .map((step) => step.path);
}

function capabilityInputs(runPlan) {
  return (runPlan.steps ?? [])
    .filter((step) => step.type === 'inspect-capability' && step.allowed !== false && step.capability)
    .map((step) => ({
      capability: step.capability,
      maturity: step.maturity,
      gates: step.gates ?? [],
    }));
}

function skillInputs(runPlan) {
  return (runPlan.steps ?? [])
    .filter((step) => step.type === 'load-skill' && step.allowed !== false && step.skill)
    .map((step) => step.skill);
}

function routeFor(taskClass, routing) {
  const route = routing.taskClasses?.[taskClass];
  if (!route?.subagentSpawn?.spawnModel) {
    return null;
  }

  return {
    spawnModel: route.subagentSpawn.spawnModel,
    reasoningEffort: route.subagentSpawn.reasoningEffort ?? 'low',
    usageLogRequired: route.usageLogRequired === true || route.subagentSpawn.usageLogReasonRequired === true,
  };
}

function compactSchema(name, properties) {
  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(properties),
    properties: Object.fromEntries(
      Object.entries(properties).map(([key, description]) => [key, { type: 'string', description }])
    ),
    outputName: name,
  };
}

function subagent(fields) {
  return {
    skills: [],
    maxContextLines: 120,
    maxOutputTokens: 400,
    stopIf: [
      'asked-to-run-playwright',
      'asked-to-open-business-central',
      'asked-to-edit-book',
      'asked-to-write-state',
      'input-budget-exceeded',
    ],
    ...fields,
  };
}

const runPlan = runJson('npm run --silent agent:run-plan');
const routing = readJson('.agent/model-routing.json');
const budgets = readJson('.agent/budgets.json');
const capabilities = readJson('.agent/capabilities.json');
const current = readJson('.agent/state/current.json');
const activeCase = current.active_case_file && existsSync(current.active_case_file)
  ? readJson(current.active_case_file)
  : {};

const budgetProfileName = activeCase.budgetProfile ?? budgets.defaults?.budgetProfile ?? 'standard';
const budgetProfile = budgets.budgetProfiles?.[budgetProfileName] ?? budgets.defaults ?? {};
const maxSubagents = Math.min(budgetProfile.maxSubagentsPerRun ?? budgets.defaults?.maxSubagentsPerRun ?? 3, 3);
const maxFiles = budgetProfile.maxFilesToReadPerRun ?? budgets.defaults?.maxFilesToReadPerRun ?? 0;
const maxSkills = budgetProfile.maxSkillsPerRun ?? budgets.defaults?.maxSkillsPerRun ?? 0;

const plannedFiles = unique(readFileInputs(runPlan));
const plannedSkills = unique(skillInputs(runPlan));
const plannedCapabilities = capabilityInputs(runPlan).slice(0, 6);
const stateInputs = unique([
  '.agent/state/current.json',
  '.agent/state/project_state.json',
  '.agent/state/coverage_state.json',
  current.active_case_file,
]);

const blockedBy = [];
if (runPlan.canProceed !== true) {
  blockedBy.push('run-plan cannot proceed');
}
if (!current.activeCase || !current.active_case_file || !existsSync(current.active_case_file ?? '')) {
  blockedBy.push('active case state is missing');
}
if (!routing.subagentPolicy || !routing.taskClasses) {
  blockedBy.push('subagent routing policy is missing');
}
if (!Array.isArray(capabilities.capabilities)) {
  blockedBy.push('capability registry is unclear');
}
if (plannedFiles.length > maxFiles) {
  blockedBy.push(`run-plan files exceed budget: ${plannedFiles.length}/${maxFiles}`);
}
if (plannedSkills.length > maxSkills) {
  blockedBy.push(`run-plan skills exceed budget: ${plannedSkills.length}/${maxSkills}`);
}
if (maxSubagents < 1) {
  blockedBy.push('maxSubagents budget is below 1');
}

const monkeyRoute = routeFor('monkey_work', routing);
const wizardRoute = routeFor('wizard_work', routing);
if (!monkeyRoute) {
  blockedBy.push('monkey_work subagent route is missing');
}
if (!wizardRoute) {
  blockedBy.push('wizard_work subagent route is missing');
}

const defaultSubagents = [
  subagent({
    id: 'state-context-reader',
    taskClass: 'monkey_work',
    spawnModel: monkeyRoute?.spawnModel ?? '',
    reasoningEffort: 'low',
    inputs: stateInputs.slice(0, Math.min(4, maxFiles)),
    outputName: 'state_context_summary',
    outputJsonSchema: compactSchema('state_context_summary', {
      activeCase: 'Current active case id.',
      companyContext: 'Instance and company summary.',
      latestProof: 'Most recent compact proof or empty string.',
      nextSafeAction: 'Next safe action from state.',
      limits: 'Known limits as one compact sentence.'
    }),
  }),
  subagent({
    id: 'safety-capability-checker',
    taskClass: 'monkey_work',
    spawnModel: monkeyRoute?.spawnModel ?? '',
    reasoningEffort: 'medium',
    inputs: [
      '.agent/model-routing.json',
      '.agent/budgets.json',
      '.agent/capabilities.json',
      ...plannedCapabilities.map((entry) => `capability:${entry.capability}`),
    ].slice(0, Math.min(6, maxFiles)),
    outputName: 'safety_capability_summary',
    outputJsonSchema: compactSchema('safety_capability_summary', {
      forbiddenActions: 'Compact list of relevant forbidden actions.',
      safetyGates: 'Compact list of required gates.',
      capabilityFit: 'Whether selected capabilities match the case.',
      blocker: 'Blocking issue or empty string.',
      approvalNeeded: 'yes or no with short reason.'
    }),
  }),
  subagent({
    id: 'local-planner',
    taskClass: 'wizard_work',
    spawnModel: wizardRoute?.spawnModel ?? '',
    reasoningEffort: wizardRoute?.reasoningEffort ?? 'medium',
    skills: plannedSkills.slice(0, maxSkills),
    inputs: [
      'state_context_summary',
      'safety_capability_summary',
      ...plannedFiles.slice(0, Math.max(0, maxFiles - 2)),
    ],
    outputName: 'local_analysis_plan',
    outputJsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['steps', 'blockedLiveActions', 'validationCommands', 'resultShape'],
      properties: {
        steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Local-only analysis steps; no BC, Playwright, book edit or write mode.'
        },
        blockedLiveActions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Live actions that remain forbidden.'
        },
        validationCommands: {
          type: 'array',
          items: { type: 'string' },
          description: 'Commands to validate the plan safely.'
        },
        resultShape: {
          type: 'string',
          description: 'Expected compact JSON result shape.'
        }
      }
    },
    maxContextLines: 180,
    maxOutputTokens: 650,
  }),
].slice(0, maxSubagents);

const usageLogRequired = defaultSubagents.some((agent) =>
  agent.taskClass === 'judge_work' || agent.taskClass === 'big_brain_review'
);

if (defaultSubagents.some((agent) => !agent.spawnModel)) {
  blockedBy.push('at least one subagent has no explicit spawnModel');
}
if (defaultSubagents.length > maxSubagents) {
  blockedBy.push(`planned subagents exceed budget: ${defaultSubagents.length}/${maxSubagents}`);
}

const canProceed = blockedBy.length === 0;
const plan = {
  schemaVersion: 1,
  purpose: 'autopilot-subagent-plan',
  caseId: runPlan.caseId ?? current.activeCase ?? '',
  canProceed,
  maxSubagents,
  subagents: canProceed ? defaultSubagents : [],
  joinStrategy: 'Only merge compact JSON outputs. Do not merge raw logs or screenshots.',
  blockedLiveActions: unique([
    ...(runPlan.blockedLiveActions ?? []),
    'subagent-spawn-execution',
    'playwright-execution',
    'business-central-execution',
    'book-edit',
    'state-finalize-write',
  ]),
  requiresHumanApproval: runPlan.sourceDryRun?.requiresHumanApproval === true || usageLogRequired,
  reason: canProceed
    ? `Planned ${defaultSubagents.length}/${maxSubagents} subagents with explicit spawnModel overrides; no inherited parent model and no live execution.`
    : `Subagent planning blocked: ${blockedBy.join('; ')}`,
  validationCommands: [
    'npm run agent:preflight',
    'npm run agent:dry-run',
    'npm run agent:run-plan',
    'npm run agent:subagent-plan',
    'npm run check:encoding',
    'git diff --check',
  ],
};

console.log(JSON.stringify(plan, null, 2));
