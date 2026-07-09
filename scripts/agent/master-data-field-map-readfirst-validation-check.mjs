import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const files = {
  current: '.agent/state/current.json',
  caseFile: '.agent/state/cases/master-data-field-map-readfirst-validation.json',
  fieldMapDecision:
    'playwright/projects/fibu-book5/evidence/master-data-package-field-map-decision/result.json',
  foundationDecision: 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md',
  rejectedRoutes: '.agent/state/rejected_route_register.json',
  visualStateHelper: 'playwright/core/bc/visual-state-capture.ts',
  stepTimelineHelper: 'playwright/core/bc/step-timeline.ts'
};

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));
}

function readText(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function runNpmScript(scriptName) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['run', '--silent', scriptName], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = null;
  try {
    output = result.stdout ? JSON.parse(result.stdout) : null;
  } catch {
    output = null;
  }

  return {
    ok: result.status === 0,
    exitCode: result.status,
    output,
    stderr: result.stderr?.trim() ?? ''
  };
}

const errors = [];
const warnings = [];
const checkedFiles = [];

for (const [id, file] of Object.entries(files)) {
  if (!existsSync(resolve(root, file))) {
    errors.push(`${id}: missing ${file}`);
  } else {
    checkedFiles.push(file);
  }
}

let current = null;
let activeCase = null;
let fieldMapDecision = null;
let foundationDecision = '';
let rejectedRoutes = null;

if (!errors.length) {
  current = readJson(files.current);
  activeCase = readJson(files.caseFile);
  fieldMapDecision = readJson(files.fieldMapDecision);
  foundationDecision = readText(files.foundationDecision);
  rejectedRoutes = readJson(files.rejectedRoutes);
}

if (current) {
  if (current.instance !== 'playthru') errors.push(`${files.current}: instance must be playthru`);
  if (current.company !== 'UNIVERSAARL-DE') errors.push(`${files.current}: company must be UNIVERSAARL-DE`);
  if (current.activeCase !== 'MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION') {
    errors.push(`${files.current}: activeCase must be MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION`);
  }
  if (current.nextCase !== 'MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION') {
    errors.push(`${files.current}: nextCase must be MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION`);
  }
  if (current.active_case_file !== files.caseFile) {
    errors.push(`${files.current}: active_case_file must point to ${files.caseFile}`);
  }
  if (current.preparedNextCaseFile !== files.caseFile) {
    errors.push(`${files.current}: preparedNextCaseFile must point to ${files.caseFile}`);
  }
  if (current.caseType !== 'read-first-no-write') {
    errors.push(`${files.current}: caseType must be read-first-no-write`);
  }
}

if (activeCase) {
  if (activeCase.caseId !== 'MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION') {
    errors.push(`${files.caseFile}: caseId must be MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION`);
  }
  if (activeCase.caseType !== 'read-first-no-write') {
    errors.push(`${files.caseFile}: caseType must be read-first-no-write`);
  }
  if (activeCase.mode !== 'universaarl-master-data-field-map-readfirst-validation') {
    errors.push(`${files.caseFile}: mode must be universaarl-master-data-field-map-readfirst-validation`);
  }
  if (activeCase.instance !== 'playthru') errors.push(`${files.caseFile}: instance must be playthru`);
  if (activeCase.company !== 'UNIVERSAARL-DE') {
    errors.push(`${files.caseFile}: company must be UNIVERSAARL-DE`);
  }

  for (const file of activeCase.mustRead ?? []) {
    if (!existsSync(resolve(root, file))) errors.push(`${files.caseFile}: missing mustRead ${file}`);
  }

  const allowed = new Set(activeCase.allowedActions ?? []);
  for (const action of [
    'open-business-central-readonly',
    'run-playwright-readfirst',
    'capture-screenshots',
    'capture-visual-state-json',
    'capture-step-timeline',
    'write-readfirst-result-json'
  ]) {
    if (!allowed.has(action)) errors.push(`${files.caseFile}: allowedActions missing ${action}`);
  }

  const forbidden = new Set(activeCase.forbiddenActions ?? []);
  for (const action of [
    'write-setup',
    'create-master-data',
    'edit-master-data',
    'save-record',
    'change-template',
    'create-document-or-draft',
    'preview-posting',
    'post',
    'payment',
    'api-shortcut',
    'company-switch',
    'edit-book'
  ]) {
    if (!forbidden.has(action)) errors.push(`${files.caseFile}: forbiddenActions missing ${action}`);
  }

  const expectedOutput = (activeCase.expectedOutput ?? []).join('\n');
  if (!/screenshots/i.test(expectedOutput)) errors.push(`${files.caseFile}: expectedOutput must require screenshots`);
  if (!/visual-state/i.test(expectedOutput)) errors.push(`${files.caseFile}: expectedOutput must require visual-state JSON`);
  if (!/step timeline/i.test(expectedOutput)) errors.push(`${files.caseFile}: expectedOutput must require step timeline`);

  const stopConditions = (activeCase.stopConditions ?? []).join('\n');
  for (const signal of ['Save', 'OK', 'Finish', 'Create', 'Post', 'Preview', 'Validate', 'Apply']) {
    if (!stopConditions.includes(signal)) {
      errors.push(`${files.caseFile}: stopConditions must stop before ${signal}`);
    }
  }
}

if (fieldMapDecision) {
  if (fieldMapDecision.caseId !== 'MASTER-DATA-PACKAGE-FIELD-MAP-DECISION') {
    errors.push(`${files.fieldMapDecision}: wrong caseId`);
  }
  if (fieldMapDecision.nextCase !== 'MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION') {
    errors.push(`${files.fieldMapDecision}: nextCase must hand off to MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION`);
  }
  if (fieldMapDecision.decision !== 'field-map-ready-for-readfirst-validation-not-write') {
    errors.push(`${files.fieldMapDecision}: decision must be readfirst validation, not write permission`);
  }
}

if (foundationDecision) {
  for (const phrase of [
    'Master Data bleibt nur training-/handbook-ready',
    'keine UI-Mockups',
    'keine vertraulichen echten Kundendaten'
  ]) {
    if (!foundationDecision.includes(phrase)) {
      warnings.push(`${files.foundationDecision}: missing current boundary phrase "${phrase}"`);
    }
  }
}

if (rejectedRoutes) {
  const routeIds = new Set((rejectedRoutes.routes ?? []).map((route) => route.routeId));
  for (const routeId of activeCase?.rejectedRoutesToRespect ?? []) {
    if (!routeIds.has(routeId)) errors.push(`${files.rejectedRoutes}: missing route ${routeId}`);
  }
}

const authCheck = runNpmScript('auth:bc:check');
const authOutput = authCheck.output ?? {};
if (!authCheck.ok || authOutput.canUseStoredAuth !== true) {
  errors.push('auth:bc:check: stored Business Central auth is not currently usable');
}
if (authOutput.expectedInstance && authOutput.expectedInstance !== 'playthru') {
  errors.push('auth:bc:check: expectedInstance must be playthru');
}
if (authOutput.expectedCompany && authOutput.expectedCompany !== 'UNIVERSAARL-DE') {
  errors.push('auth:bc:check: expectedCompany must be UNIVERSAARL-DE');
}
if (authOutput.expiresInHours !== undefined && authOutput.expiresInHours < 2) {
  warnings.push('auth:bc:check: stored auth expires in less than two hours');
}

const output = {
  schemaVersion: 1,
  purpose: 'master-data-field-map-readfirst-validation-check',
  ok: errors.length === 0,
  activeCase: current?.activeCase ?? null,
  casePath: files.caseFile,
  resultPath: activeCase?.resultPath ?? null,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  canRunReadFirstNoWrite: errors.length === 0,
  writeActionsAllowed: false,
  checkedFiles,
  auth: {
    checked: true,
    canUseStoredAuth: authOutput.canUseStoredAuth === true,
    expectedInstance: authOutput.expectedInstance ?? null,
    expectedCompany: authOutput.expectedCompany ?? null,
    expiresInHours: authOutput.expiresInHours ?? null,
    warnings: authOutput.warnings ?? []
  },
  requiredEvidenceOutputs: [
    'screenshots',
    'visual-state-json',
    'step-timeline',
    'readfirst-result-json'
  ],
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'MASTER-DATA-FIELD-MAP-READFIRST-VALIDATION is bounded and auth-ready for exactly one read-first/no-write validation run.'
      : 'Fix the case, helper, rejected-route or auth boundary before opening Business Central.'
};

console.log(JSON.stringify(output, null, 2));
if (errors.length) process.exitCode = 1;
