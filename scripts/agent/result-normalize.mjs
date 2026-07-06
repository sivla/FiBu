import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
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

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--input') {
      args.input = argv[index + 1];
      index += 1;
    }
    if (value === '--source') {
      args.source = argv[index + 1];
      index += 1;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const current = readJson('.agent/state/current.json');
const runPlan = runJson('npm run --silent agent:run-plan');
const input = args.input && existsSync(args.input)
  ? readJson(args.input)
  : null;

const source = args.source ?? input?.source ?? 'local-analysis';
const caseId = input?.caseId ?? runPlan.caseId ?? current.activeCase ?? '';
const changedFiles = unique(input?.changedFiles ?? []);
const evidenceRefs = unique(input?.evidenceRefs ?? []);
const proved = unique(input?.proved ?? []);
const notProved = unique(input?.notProved ?? []);
const warnings = unique([
  ...(input?.warnings ?? []),
  ...(runPlan.canProceed ? [] : ['run-plan cannot proceed']),
]);
const blockedBy = unique([
  ...(input?.blockedBy ?? []),
  ...(runPlan.stopConditions ?? []),
]);

const resultStatus = input?.resultStatus ??
  (blockedBy.length ? 'blocked' : proved.length || changedFiles.length || evidenceRefs.length ? 'observed' : 'pending');

const inferredRequiresReview = Boolean(
  runPlan.sourceDryRun?.requiresHumanApproval ||
  blockedBy.length ||
  changedFiles.some((file) => file.includes('FiBu_Buch') || file.startsWith('playwright/')),
);
const requiresReview = input?.requiresReview ?? inferredRequiresReview;

const normalized = {
  schemaVersion: 1,
  purpose: 'autopilot-result-normalized',
  caseId,
  source,
  resultStatus,
  runPlanId: runPlan.runPlanId,
  selectedTaskClass: runPlan.sourceDryRun?.selectedTaskClass ?? '',
  selectedModelClass: runPlan.sourceDryRun?.selectedModelClass ?? '',
  proved,
  notProved,
  changedFiles,
  statePatch: input?.statePatch ?? {},
  evidenceRefs,
  actionsTaken: unique(input?.actionsTaken ?? []),
  actionsNotTaken: unique(input?.actionsNotTaken ?? []),
  screenshots: unique(input?.screenshots ?? []),
  pages: Array.isArray(input?.pages) ? input.pages : [],
  accountFindings: Array.isArray(input?.accountFindings) ? input.accountFindings : [],
  flags: input?.flags ?? {},
  authGate: input?.authGate ?? null,
  foundationReadinessInput: input?.foundationReadinessInput ?? null,
  nextStepDecision: input?.nextStepDecision ?? null,
  nextCase: input?.nextCase ?? '',
  warnings,
  blockedBy,
  requiresReview,
  safeToFinalizeState: false,
  reason: input
    ? 'Normalized explicit input result. State finalization remains a separate gated step.'
    : 'No input result was provided; emitted pending normalized result from current run-plan.',
  validationCommands: [
    'npm run agent:preflight',
    'npm run agent:run-plan',
    'npm run agent:result-normalize',
    'npm run check:encoding',
    'git diff --check',
  ],
};

console.log(JSON.stringify(normalized, null, 2));
