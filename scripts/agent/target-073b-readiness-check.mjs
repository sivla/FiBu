import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

function readText(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const currentPath = '.agent/state/current.json';
const casePath = '.agent/state/cases/target-073b-vat-page472-surface-and-editor-proof.json';
const foundationPath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md';
const skillPath = '.agent/skills/bc-active-editor.md';
const uiGuidePath = '.agent/BC-UI-LOOK-AND-FEEL-GUIDE.md';
const roadmapPath = '.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md';
const dashboardPath = '.agent/project-template/PROJECT-DASHBOARD-DRAFT.md';
const specPath = 'playwright/projects/fibu-book5/tests/target-073b-vat-page472-surface-and-editor-proof.spec.ts';
const runnerPath = 'scripts/agent/run-target-073b-vat-page472-surface-and-editor-proof.mjs';
const packagePath = 'package.json';

const current = readJson(currentPath);
const activeCase = readJson(casePath);
const foundation = readText(foundationPath);
const skill = readText(skillPath);
const uiGuide = readText(uiGuidePath);
const roadmap = readText(roadmapPath);
const dashboard = readText(dashboardPath);
const spec = readText(specPath);
const runner = readText(runnerPath);
const packageJson = readJson(packagePath);

const errors = [];
const warnings = [];

function requireEqual(actual, expected, label) {
  if (actual !== expected) errors.push(`${label}: expected ${expected}, got ${actual}`);
}

function requireIncludes(list, value, label) {
  if (!Array.isArray(list) || !list.includes(value)) errors.push(`${label}: missing ${value}`);
}

function requireText(text, pattern, label) {
  if (!pattern.test(text)) errors.push(`${label}: missing ${pattern}`);
}

function requireNotText(text, pattern, label) {
  if (pattern.test(text)) errors.push(`${label}: must not contain ${pattern}`);
}

requireEqual(current.instance, 'playthru', `${currentPath} instance`);
requireEqual(current.company, 'UNIVERSAARL-DE', `${currentPath} company`);
requireEqual(current.nextCase, 'TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF', `${currentPath} nextCase`);
requireEqual(current.preparedNextCaseFile, casePath, `${currentPath} preparedNextCaseFile`);

requireEqual(activeCase.caseId, 'TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF', `${casePath} caseId`);
requireEqual(activeCase.instance, 'playthru', `${casePath} instance`);
requireEqual(activeCase.company, 'UNIVERSAARL-DE', `${casePath} company`);
requireEqual(activeCase.mayRunPlaywright, true, `${casePath} mayRunPlaywright`);
requireEqual(activeCase.mayOpenBusinessCentral, true, `${casePath} mayOpenBusinessCentral`);
requireEqual(activeCase.effectiveBcActionsAllowed, false, `${casePath} effectiveBcActionsAllowed`);

for (const action of [
  'write-vat-posting-setup',
  'create-master-data',
  'create-document-or-draft',
  'preview-posting',
  'post',
  'api-shortcut'
]) {
  requireIncludes(activeCase.forbiddenActions, action, `${casePath} forbiddenActions`);
}

for (const action of [
  'capture-surface-truth-screenshots',
  'use-focus-or-maximize-for-grid-diagnosis',
  'use-page-inspection-as-diagnostic-context',
  'probe-active-editor-without-typing-target-values'
]) {
  requireIncludes(activeCase.allowedActions, action, `${casePath} allowedActions`);
}

requireText(foundation, /TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF/, foundationPath);
requireText(skill, /surfaceProof/i, skillPath);
requireText(skill, /proof order is fixed/i, skillPath);
requireText(uiGuide, /Surface-Truth-Gate/i, uiGuidePath);
requireText(roadmap, /TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF/, roadmapPath);
requireText(dashboard, /TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF/, dashboardPath);
requireText(spec, /TARGET_073B_LIVE_APPROVED/, specPath);
requireText(spec, /No INLAND typed/, specPath);
requireText(spec, /setupChanged:\s*false/, specPath);
requireText(spec, /No-Write-Proof: Neu\/New is not clicked/i, specPath);
requireNotText(spec, /force:\s*true/i, `${specPath} no force click`);
requireText(runner, /--live-approved/, runnerPath);
requireText(runner, /auth:bc:check:overnight/, runnerPath);
requireText(runner, /TARGET_073B_LIVE_APPROVED/, runnerPath);
requireText(runner, /target-073b-readiness-check/, runnerPath);

if (
  packageJson.scripts?.['fibu:target:vat-page472-surface-editor-proof'] !==
  'node scripts/agent/run-target-073b-vat-page472-surface-and-editor-proof.mjs'
) {
  errors.push(`${packagePath}: missing fibu:target:vat-page472-surface-editor-proof runner script`);
}

if ((activeCase.doNotRepeatAsIs ?? []).some((entry) => !entry)) {
  warnings.push(`${casePath}: doNotRepeatAsIs contains an empty entry`);
}

const output = {
  schemaVersion: 1,
  purpose: 'target-073b-readiness-check',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles: [currentPath, casePath, foundationPath, skillPath, uiGuidePath, roadmapPath, dashboardPath, specPath, runnerPath, packagePath],
  errors,
  warnings,
  nextStep: errors.length
    ? 'Fix TARGET-073B readiness before any live no-write diagnosis.'
    : 'TARGET-073B is prepared as a no-write Page 472 surface/editor diagnosis, not a VAT setup write.'
};

console.log(JSON.stringify(output, null, 2));
if (errors.length) process.exitCode = 1;
