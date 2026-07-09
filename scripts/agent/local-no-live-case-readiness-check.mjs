import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const currentPath = '.agent/state/current.json';

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));
}

const current = readJson(currentPath);
const casePath = current.active_case_file;
const errors = [];
const warnings = [];

if (!casePath || !existsSync(resolve(root, casePath))) {
  errors.push(`${currentPath}: active_case_file is missing or does not exist`);
}

const activeCase = casePath && existsSync(resolve(root, casePath)) ? readJson(casePath) : null;

if (activeCase) {
  if (activeCase.caseId !== current.activeCase) {
    errors.push(`${casePath}: caseId must match current.activeCase`);
  }
  if (activeCase.caseType !== 'local-no-live-decision') {
    errors.push(`${casePath}: caseType must be local-no-live-decision`);
  }
  for (const key of ['goal', 'mustRead', 'allowedActions', 'forbiddenActions', 'skills', 'requiredChecks', 'expectedOutput', 'stopConditions']) {
    const value = activeCase[key];
    if (key === 'goal') {
      if (typeof value !== 'string' || !value.trim()) errors.push(`${casePath}: missing non-empty ${key}`);
    } else if (!Array.isArray(value) || value.length === 0) {
      errors.push(`${casePath}: missing non-empty ${key}`);
    }
  }

  const forbidden = new Set(activeCase.forbiddenActions ?? []);
  for (const action of [
    'open-business-central',
    'run-playwright-live',
    'write-setup',
    'create-master-data',
    'create-document-or-draft',
    'preview-posting',
    'post',
    'payment',
    'api-shortcut',
    'company-switch'
  ]) {
    if (!forbidden.has(action)) errors.push(`${casePath}: forbiddenActions must include ${action}`);
  }

  for (const inputPath of activeCase.mustRead ?? []) {
    if (/^https?:\/\//i.test(inputPath)) continue;
    if (!existsSync(resolve(root, inputPath))) warnings.push(`${casePath}: mustRead reference not found locally: ${inputPath}`);
  }
}

if (current.instance !== 'playthru') errors.push(`${currentPath}: instance must be playthru`);
if (current.company !== 'UNIVERSAARL-DE') errors.push(`${currentPath}: company must be UNIVERSAARL-DE`);
const acceptedLocalDecisionModes = new Set([
  'universaarl-foundation-local-decision',
  'universaarl-master-data-local-decision'
]);
if (!acceptedLocalDecisionModes.has(current.mode)) {
  errors.push(
    `${currentPath}: mode must be one of ${[...acceptedLocalDecisionModes].join(', ')} for this local no-live case`
  );
}

const output = {
  schemaVersion: 1,
  purpose: 'local-no-live-case-readiness-check',
  ok: errors.length === 0,
  activeCase: current.activeCase,
  casePath,
  caseType: activeCase?.caseType ?? null,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'Local no-live case is registered and bounded. Execute only the case-declared must-read, actions, checks and output.'
      : 'Fix local no-live case registration before executing the case.'
};

console.log(JSON.stringify(output, null, 2));
if (errors.length) process.exitCode = 1;
