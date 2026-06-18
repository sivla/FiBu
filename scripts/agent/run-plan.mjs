import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function runDryRun() {
  const output = execSync('npm run --silent agent:dry-run', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(output);
}

function step(type, fields) {
  return {
    type,
    ...fields,
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const current = readJson('.agent/state/current.json');
const activeCase = current.active_case_file && existsSync(current.active_case_file)
  ? readJson(current.active_case_file)
  : {};
const dryRun = runDryRun();

const blockedLiveActions = unique([
  ...(dryRun.forbiddenActions ?? []),
  ...(dryRun.stopConditions?.length ? ['live-run'] : []),
  'business-central-execution',
  'playwright-execution',
  'book-edit',
  'binary-or-screenshot-read',
]);

const steps = [];

steps.push(step('run-command', {
  command: 'npm run agent:preflight',
  reason: 'Validate state, budgets, safety, routing, capabilities and skills before any agent work.',
  allowed: true,
}));

for (const path of dryRun.filesToRead ?? []) {
  steps.push(step('read-file', {
    path,
    reason: 'Required by active case mustRead within dry-run budget.',
    allowed: true,
  }));
}

for (const skill of dryRun.selectedSkills ?? []) {
  steps.push(step('load-skill', {
    path: `.agent/skills/${skill}.md`,
    skill,
    reason: 'Selected by active case and dry-run budget.',
    allowed: true,
  }));
}

for (const capability of dryRun.selectedCapabilities ?? []) {
  steps.push(step('inspect-capability', {
    capability: capability.id,
    maturity: capability.maturity,
    gates: capability.gates ?? [],
    reason: 'Capability relevant to selected taskClass or selected skills.',
    allowed: true,
  }));
}

steps.push(step('local-analysis', {
  caseId: activeCase.caseId ?? current.activeCase ?? '',
  reason: activeCase.goal ?? current.nextStep ?? 'Perform the selected local analysis only.',
  allowed: dryRun.canProceed === true,
}));

steps.push(step('propose-playwright-change', {
  allowed: false,
  reason: 'Run-plan is plan-only. Playwright changes require a later explicit implementation step.',
}));

steps.push(step('execute-playwright', {
  allowed: false,
  reason: 'Run-plan must not start Playwright.',
}));

steps.push(step('execute-business-central', {
  allowed: false,
  reason: 'Run-plan must not open or operate Business Central.',
}));

steps.push(step('write-book-content', {
  allowed: false,
  reason: 'Run-plan must not change book content.',
}));

steps.push(step('state-update-plan', {
  allowed: true,
  reason: 'If local analysis changes project truth, propose state updates only; do not fabricate evidence.',
  targetFiles: [
    '.agent/state/last_run_summary.json',
    current.active_case_file ?? '',
  ].filter(Boolean),
}));

const approvalRequiredBefore = [];
if (dryRun.requiresHumanApproval) {
  approvalRequiredBefore.push('state-change');
}
approvalRequiredBefore.push('playwright', 'business-central', 'posting', 'book-edit');

const canProceed = dryRun.canProceed === true;
const runPlan = {
  schemaVersion: 1,
  purpose: 'autopilot-run-plan',
  runPlanId: `${activeCase.caseId ?? current.activeCase ?? 'UNKNOWN'}-PLAN`,
  caseId: activeCase.caseId ?? current.activeCase ?? '',
  sourceDryRun: {
    canProceed: dryRun.canProceed,
    selectedTaskClass: dryRun.selectedTaskClass,
    selectedModelClass: dryRun.selectedModelClass,
    budgetProfile: dryRun.budgetProfile,
    requiresHumanApproval: dryRun.requiresHumanApproval,
  },
  canProceed,
  steps,
  blockedLiveActions,
  approvalRequiredBefore: unique(approvalRequiredBefore),
  safetyGates: dryRun.safetyGates ?? [],
  stopConditions: dryRun.stopConditions ?? [],
  validationCommands: [
    'npm run agent:preflight',
    'npm run agent:dry-run',
    'npm run agent:run-plan',
    'npm run check:encoding',
    'git diff --check',
  ],
  nextSafeAction: canProceed
    ? 'Execute only the allowed local-analysis steps. Do not run Playwright or Business Central.'
    : 'Resolve dry-run stopConditions before local analysis.',
};

console.log(JSON.stringify(runPlan, null, 2));
