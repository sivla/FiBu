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
  if (activeCase.caseId !== current.activeCase) errors.push(`${casePath}: caseId must match current.activeCase`);
  if (activeCase.caseType !== 'read-first-no-write') errors.push(`${casePath}: caseType must be read-first-no-write`);

  for (const key of ['goal', 'mustRead', 'allowedActions', 'forbiddenActions', 'skills', 'requiredChecks', 'expectedOutput', 'stopConditions']) {
    const value = activeCase[key];
    if (key === 'goal') {
      if (typeof value !== 'string' || !value.trim()) errors.push(`${casePath}: missing non-empty ${key}`);
    } else if (!Array.isArray(value) || value.length === 0) {
      errors.push(`${casePath}: missing non-empty ${key}`);
    }
  }

  const allowed = new Set(activeCase.allowedActions ?? []);
  for (const action of [
    'validate-playthru-context-readonly',
    'validate-universaarl-company-context-readonly',
    'capture-screenshot-chain'
  ]) {
    if (!allowed.has(action)) warnings.push(`${casePath}: allowedActions should include ${action}`);
  }

  const forbidden = new Set(activeCase.forbiddenActions ?? []);
  for (const action of [
    'write-setup',
    'create-master-data',
    'create-document-or-draft',
    'preview-posting',
    'post',
    'payment',
    'api-shortcut',
    'company-switch',
    'import-configuration-package',
    'export-configuration-package',
    'validate-configuration-package',
    'apply-configuration-package'
  ]) {
    if (!forbidden.has(action)) errors.push(`${casePath}: forbiddenActions must include ${action}`);
  }

  const outputText = (activeCase.expectedOutput ?? []).join('\n');
  if (!/Screenshot QA|screenshot/i.test(outputText)) {
    warnings.push(`${casePath}: expectedOutput should require screenshot QA / visual evidence`);
  }

  for (const inputPath of activeCase.mustRead ?? []) {
    if (/^https?:\/\//i.test(inputPath)) continue;
    if (!existsSync(resolve(root, inputPath))) warnings.push(`${casePath}: mustRead reference not found locally: ${inputPath}`);
  }
}

if (current.instance !== 'playthru') errors.push(`${currentPath}: instance must be playthru`);
if (current.company !== 'UNIVERSAARL-DE') errors.push(`${currentPath}: company must be UNIVERSAARL-DE`);
if (current.mode !== 'universaarl-foundation-readfirst') {
  errors.push(`${currentPath}: mode must be universaarl-foundation-readfirst for this read-first/no-write case`);
}

const result = {
  schemaVersion: 1,
  purpose: 'read-first-no-write-case-readiness-check',
  ok: errors.length === 0,
  activeCase: current.activeCase,
  casePath,
  caseType: activeCase?.caseType ?? null,
  liveActionsAllowed: true,
  writeActionsAllowed: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'Read-first/no-write case is bounded. Run only after auth/context gate and capture visual-state screenshot evidence.'
      : 'Fix read-first/no-write case registration before opening Business Central.'
};

console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
