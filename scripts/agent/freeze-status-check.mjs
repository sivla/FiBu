import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const currentPath = '.agent/state/current.json';
const freezePath = '.agent/IMPROVEMENT-FREEZE.md';
const projectDecisionPath = '.agent/PROJECT-DECISION.md';
const freezeCasePath = '.agent/state/cases/project-improvement-freeze-001.json';
const readinessPath = '.agent/TARGET-075-PILOT-READINESS.md';
const packagePath = 'package.json';
const frozenScriptName = 'fibu:target:vat-page472-active-editor-route-decision';

function readText(relativePath) {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const errors = [];
const warnings = [];

for (const filePath of [currentPath, freezePath, projectDecisionPath, freezeCasePath, readinessPath, packagePath]) {
  if (!fs.existsSync(path.resolve(root, filePath))) errors.push(`missing required file: ${filePath}`);
}

let current = null;
let freezeCase = null;
let freezeText = '';
let decisionText = '';
let readinessText = '';
let packageJson = null;

if (!errors.length) {
  current = readJson(currentPath);
  freezeCase = readJson(freezeCasePath);
  freezeText = readText(freezePath);
  decisionText = readText(projectDecisionPath);
  readinessText = readText(readinessPath);
  packageJson = readJson(packagePath);
}

if (current) {
  if (current.mode !== 'project-improvement-freeze') errors.push(`${currentPath}: mode must be project-improvement-freeze`);
  if (current.activeArea !== 'project-improvement-freeze') errors.push(`${currentPath}: activeArea must be project-improvement-freeze`);
  if (current.activeCase !== 'PROJECT-IMPROVEMENT-FREEZE-001') errors.push(`${currentPath}: activeCase must be PROJECT-IMPROVEMENT-FREEZE-001`);
  if (current.nextCase !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push(`${currentPath}: nextCase must remain TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK while freeze is active`);
  }
  if (current.freezeStatus?.status !== 'active') errors.push(`${currentPath}: freezeStatus.status must be active`);
  if (current.freezeStatus?.frozenLiveCase !== 'TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION') {
    errors.push(`${currentPath}: frozenLiveCase must remain TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION`);
  }
  if (current.freezeStatus?.resumeCandidateAfterFreeze !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push(`${currentPath}: resumeCandidateAfterFreeze must remain TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK`);
  }
  const forbidden = new Set(current.forbiddenActions ?? []);
  for (const action of [
    'open-business-central-live',
    'continue-target-073',
    'type-business-central-values',
    'setup-change',
    'master-data-change',
    'create-document-or-draft',
    'preview-posting',
    'post',
    'payment',
    'cleanup-delete',
    'company-switch'
  ]) {
    if (!forbidden.has(action)) errors.push(`${currentPath}: forbiddenActions must include ${action}`);
  }
  if (current.instance !== 'playthru') warnings.push(`${currentPath}: target instance is not playthru`);
  if (current.company !== 'UNIVERSAARL-DE') warnings.push(`${currentPath}: target company is not UNIVERSAARL-DE`);
}

if (freezeCase) {
  if (freezeCase.status !== 'active') errors.push(`${freezeCasePath}: status must be active`);
  if (freezeCase.mayRunPlaywright !== false) errors.push(`${freezeCasePath}: mayRunPlaywright must be false`);
  if (freezeCase.mayOpenBusinessCentral !== false) errors.push(`${freezeCasePath}: mayOpenBusinessCentral must be false`);
  if (freezeCase.effectiveBcActionsAllowed !== false) errors.push(`${freezeCasePath}: effectiveBcActionsAllowed must be false`);
}

if (packageJson) {
  const frozenScript = packageJson.scripts?.[frozenScriptName] ?? '';
  if (!frozenScript.includes('legacy-script-blocked.mjs')) {
    errors.push(`${packagePath}: ${frozenScriptName} must route through legacy-script-blocked.mjs while TARGET-073 is frozen`);
  }
  if (/playwright\s+test/i.test(frozenScript)) {
    errors.push(`${packagePath}: ${frozenScriptName} must not directly run Playwright while TARGET-073 is frozen`);
  }
}

for (const [filePath, text, requiredPhrases] of [
  [
    freezePath,
    freezeText,
    ['Status: active', 'TARGET-073', 'TARGET-075 remains read-only', 'do not run Business Central live cases']
  ],
  [
    projectDecisionPath,
    decisionText,
    ['TARGET-073 bleibt eingefroren', 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK', 'read-first']
  ],
  [
    readinessPath,
    readinessText,
    ['freeze still active', 'Do not resume TARGET-073', 'TARGET-075 stays read-only']
  ]
]) {
  for (const phrase of requiredPhrases) {
    if (!text.includes(phrase)) errors.push(`${filePath}: missing phrase ${phrase}`);
  }
}

const output = {
  schemaVersion: 1,
  purpose: 'improvement-freeze-status-check',
  freezeActive: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  targetInstance: current?.instance ?? '',
  targetCompany: current?.company ?? '',
  frozenLiveCase: current?.freezeStatus?.frozenLiveCase ?? '',
  resumeCandidateAfterFreeze: current?.freezeStatus?.resumeCandidateAfterFreeze ?? '',
  checkedFiles: [currentPath, freezePath, projectDecisionPath, freezeCasePath, readinessPath, packagePath],
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'Freeze invariants are consistent. Continue local improvement work or explicitly lift the freeze before TARGET-075 live execution.'
      : 'Fix freeze invariant errors before any live resume.'
};

console.log(JSON.stringify(output, null, 2));

if (errors.length) process.exitCode = 1;
