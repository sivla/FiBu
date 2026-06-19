import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function writeJson(path, value) {
  writeFileSync(resolve(path), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runJson(command) {
  return JSON.parse(execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }));
}

function parseArgs(argv) {
  const args = { writeMode: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--input') {
      args.input = argv[index + 1];
      index += 1;
    } else if (value === '--write') {
      args.writeMode = true;
    }
  }
  return args;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasPatchContent(statePatch) {
  return isObject(statePatch) && Object.keys(statePatch).length > 0;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function findCaseFileForCaseId(caseId, current) {
  if (!caseId) {
    return current.active_case_file;
  }

  if (current.activeCase === caseId) {
    return current.active_case_file;
  }

  const casesDir = resolve('.agent/state/cases');
  if (!existsSync(casesDir)) {
    return current.active_case_file;
  }

  for (const fileName of readdirSync(casesDir)) {
    if (!fileName.endsWith('.json')) {
      continue;
    }

    const filePath = `.agent/state/cases/${fileName}`;
    try {
      const candidate = readJson(filePath);
      if (candidate.caseId === caseId) {
        return filePath;
      }
    } catch {
      // State validation reports malformed case files separately.
    }
  }

  return current.active_case_file;
}

function buildPatchList(statePatch, current, normalized) {
  const patchList = [];
  const knownTargets = {
    current: '.agent/state/current.json',
    lastRunSummary: '.agent/state/last_run_summary.json',
    activeCase: findCaseFileForCaseId(normalized.caseId, current),
    coverage: '.agent/state/coverage_state.json',
  };

  for (const [key, patch] of Object.entries(statePatch ?? {})) {
    const targetFile = knownTargets[key] ?? key;
    patchList.push({
      targetFile,
      patchType: 'merge',
      patch,
    });
  }

  return patchList;
}

function applyMergePatch(targetFile, patch) {
  if (!targetFile || !existsSync(targetFile)) {
    throw new Error(`target file does not exist: ${targetFile}`);
  }
  const target = readJson(targetFile);
  writeJson(targetFile, {
    ...target,
    ...patch,
  });
}

const args = parseArgs(process.argv.slice(2));
const current = readJson('.agent/state/current.json');
const normalized = args.input && existsSync(args.input)
  ? readJson(args.input)
  : runJson('npm run --silent agent:result-normalize');

const proposedPatches = buildPatchList(normalized.statePatch, current, normalized);
const targetFiles = unique(proposedPatches.map((patch) => patch.targetFile));
const blockedBy = unique([
  ...(normalized.blockedBy ?? []),
  ...(normalized.safeToFinalizeState === true ? [] : ['safeToFinalizeState is false']),
  ...(normalized.requiresReview ? ['requiresReview is true'] : []),
  ...(hasPatchContent(normalized.statePatch) ? [] : ['statePatch is empty']),
]);

const canWrite = blockedBy.length === 0;
const writeMode = args.writeMode === true;

if (writeMode && canWrite) {
  for (const patch of proposedPatches) {
    applyMergePatch(patch.targetFile, patch.patch);
  }
}

const result = {
  schemaVersion: 1,
  purpose: 'autopilot-state-finalize',
  caseId: normalized.caseId ?? current.activeCase ?? '',
  sourceResult: args.input ?? 'agent:result-normalize',
  canWrite,
  writeMode,
  targetFiles,
  proposedPatches,
  blockedBy,
  requiresReview: Boolean(normalized.requiresReview),
  reason: canWrite
    ? writeMode
      ? 'State patches were written because the normalized result was marked safe to finalize.'
      : 'State patches are writable, but this run was plan-only. Use --write to apply.'
    : 'State finalization blocked by safety gates; no files were written.',
  validationCommands: [
    'npm run agent:preflight',
    'npm run agent:run-plan',
    'npm run agent:result-normalize',
    'npm run agent:state-finalize',
    'npm run check:encoding',
    'git diff --check',
  ],
};

console.log(JSON.stringify(result, null, 2));
