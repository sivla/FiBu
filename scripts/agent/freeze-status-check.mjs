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
const target075ScriptName = 'fibu:target:foundation-consistency-pilot';
const target075RunnerPath = 'scripts/agent/run-target-075-foundation-consistency-pilot.mjs';
const target075ResultPath =
  'playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/TARGET-075-result.json';
const foundationDecisionPath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md';
const allowedNextCasesAfterTarget075Handoff = new Set([
  'FOUNDATION-READINESS-DECISION',
  'PWS-FF-002-GENERAL-POSTING-SETUP-READFIRST-RECOVERY',
  'PWS-FF-002B-PAGE314-NAVIGATION-CAPTURE-RECOVERY',
  'PWS-FF-006-CHART-OF-ACCOUNTS-STARTER-ACCOUNTS-READFIRST'
]);
const allowedReadFirstLiftCases = new Set([
  'FOUNDATION-READINESS-DECISION',
  'PWS-FF-002-GENERAL-POSTING-SETUP-READFIRST-RECOVERY',
  'PWS-FF-002B-PAGE314-NAVIGATION-CAPTURE-RECOVERY',
  'PWS-FF-006-CHART-OF-ACCOUNTS-STARTER-ACCOUNTS-READFIRST'
]);

function readText(relativePath) {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const errors = [];
const warnings = [];

for (const filePath of [
  currentPath,
  freezePath,
  projectDecisionPath,
  freezeCasePath,
  readinessPath,
  packagePath,
  target075RunnerPath
]) {
  if (!fs.existsSync(path.resolve(root, filePath))) errors.push(`missing required file: ${filePath}`);
}

let current = null;
let freezeCase = null;
let freezeText = '';
let decisionText = '';
let readinessText = '';
let packageJson = null;
let target075Result = null;

if (!errors.length) {
  current = readJson(currentPath);
  freezeCase = readJson(freezeCasePath);
  freezeText = readText(freezePath);
  decisionText = readText(projectDecisionPath);
  readinessText = readText(readinessPath);
  packageJson = readJson(packagePath);
  if (fs.existsSync(path.resolve(root, target075ResultPath))) target075Result = readJson(target075ResultPath);
}

const target075CompletedHandoff =
  target075Result?.caseId === 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK' &&
  target075Result?.nextCase === 'FOUNDATION-READINESS-DECISION' &&
  fs.existsSync(path.resolve(root, foundationDecisionPath));
const nextCaseAllowedAfterTarget075Handoff =
  target075CompletedHandoff && allowedNextCasesAfterTarget075Handoff.has(current?.nextCase ?? '');
const liftedReadFirst =
  current?.freezeStatus?.status === 'lifted-readfirst' &&
  allowedReadFirstLiftCases.has(current?.activeCase ?? '') &&
  current?.activeArea === 'w1-foundation' &&
  current?.mode === 'universaarl-foundation-readfirst' &&
  current?.implementationOperatingSystem?.currentLiveBoundary?.freezeActive === false;

if (current) {
  if (!liftedReadFirst && current.mode !== 'project-improvement-freeze') errors.push(`${currentPath}: mode must be project-improvement-freeze`);
  if (!liftedReadFirst && current.activeArea !== 'project-improvement-freeze') errors.push(`${currentPath}: activeArea must be project-improvement-freeze`);
  if (!liftedReadFirst && current.activeCase !== 'PROJECT-IMPROVEMENT-FREEZE-001') errors.push(`${currentPath}: activeCase must be PROJECT-IMPROVEMENT-FREEZE-001`);
  if (
    current.nextCase !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK' &&
    !nextCaseAllowedAfterTarget075Handoff
  ) {
    errors.push(
      `${currentPath}: nextCase must remain TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK while freeze is active, or be an allowed Foundation follow-up after TARGET-075 handoff`
    );
  }
  if (!liftedReadFirst && current.freezeStatus?.status !== 'active') errors.push(`${currentPath}: freezeStatus.status must be active`);
  if (current.freezeStatus?.frozenLiveCase !== 'TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION') {
    errors.push(`${currentPath}: frozenLiveCase must remain TARGET-073-VAT-PAGE472-ACTIVE-EDITOR-ROUTE-DECISION`);
  }
  if (
    current.freezeStatus?.resumeCandidateAfterFreeze !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK' &&
    !allowedReadFirstLiftCases.has(current.freezeStatus?.resumeCandidateAfterFreeze ?? '')
  ) {
    errors.push(`${currentPath}: resumeCandidateAfterFreeze must remain TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK`);
  }
  const forbidden = new Set(current.forbiddenActions ?? []);
  const requiredForbiddenActions = liftedReadFirst
    ? [
        'continue-target-073',
        'type-business-central-values',
        'write-setup',
        'create-master-data',
        'create-document-or-draft',
        'preview-posting',
        'post',
        'payment',
        'cleanup-delete',
        'company-switch'
      ]
    : [
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
  ];
  for (const action of requiredForbiddenActions) {
    if (!forbidden.has(action)) errors.push(`${currentPath}: forbiddenActions must include ${action}`);
  }
  if (!liftedReadFirst && !forbidden.has('open-business-central-live')) {
    errors.push(`${currentPath}: forbiddenActions must include open-business-central-live while freeze is active`);
  }
  if (liftedReadFirst && forbidden.has('open-business-central-live')) {
    errors.push(`${currentPath}: open-business-central-live must be lifted for PWS-FF-002 read-first resume`);
  }
  if (current.instance !== 'playthru') warnings.push(`${currentPath}: target instance is not playthru`);
  if (current.company !== 'UNIVERSAARL-DE') warnings.push(`${currentPath}: target company is not UNIVERSAARL-DE`);
}

if (freezeCase) {
  if (freezeCase.status !== 'active') errors.push(`${freezeCasePath}: status must be active`);
  if (freezeCase.mayRunPlaywright !== false) errors.push(`${freezeCasePath}: mayRunPlaywright must be false`);
  if (freezeCase.mayOpenBusinessCentral !== false) errors.push(`${freezeCasePath}: mayOpenBusinessCentral must be false`);
  if (freezeCase.effectiveBcActionsAllowed !== false) errors.push(`${freezeCasePath}: effectiveBcActionsAllowed must be false`);
  if (freezeCase.resumeCandidateAfterFreeze !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push(`${freezeCasePath}: resumeCandidateAfterFreeze must remain TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK`);
  }
  if (freezeCase.nextIfSuccessful !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push(`${freezeCasePath}: nextIfSuccessful must point to TARGET-075, not another improvement round`);
  }
}

if (packageJson) {
  const frozenScript = packageJson.scripts?.[frozenScriptName] ?? '';
  if (!frozenScript.includes('legacy-script-blocked.mjs')) {
    errors.push(`${packagePath}: ${frozenScriptName} must route through legacy-script-blocked.mjs while TARGET-073 is frozen`);
  }
  if (/playwright\s+test/i.test(frozenScript)) {
    errors.push(`${packagePath}: ${frozenScriptName} must not directly run Playwright while TARGET-073 is frozen`);
  }
  const target075Script = packageJson.scripts?.[target075ScriptName] ?? '';
  if (!target075Script.includes(target075RunnerPath)) {
    errors.push(`${packagePath}: ${target075ScriptName} must route through ${target075RunnerPath}`);
  }
  if (/playwright\s+test/i.test(target075Script)) {
    errors.push(`${packagePath}: ${target075ScriptName} must not directly run Playwright while the freeze gate is active`);
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
  freezeActive: errors.length === 0 ? !liftedReadFirst : true,
  freezeLiftedReadFirst: errors.length === 0 && liftedReadFirst,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  targetInstance: current?.instance ?? '',
  targetCompany: current?.company ?? '',
  frozenLiveCase: current?.freezeStatus?.frozenLiveCase ?? '',
  resumeCandidateAfterFreeze: current?.freezeStatus?.resumeCandidateAfterFreeze ?? '',
  target075CompletedHandoff,
  nextCaseAllowedAfterTarget075Handoff,
  checkedFiles: [
    currentPath,
    freezePath,
    projectDecisionPath,
    freezeCasePath,
    readinessPath,
    packagePath,
    target075RunnerPath,
    target075ResultPath,
    foundationDecisionPath
  ],
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? liftedReadFirst
        ? `Freeze is lifted only for ${current.activeCase} read-first/no-write. Do not resume TARGET-073 or any write case.`
        : target075CompletedHandoff
        ? 'Freeze invariants are consistent after TARGET-075 handoff. Keep live work blocked until the next read-first Foundation gap case is explicitly selected and gated.'
        : 'Freeze invariants are consistent. Continue local improvement work or explicitly lift the freeze before TARGET-075 live execution.'
      : 'Fix freeze invariant errors before any live resume.'
};

console.log(JSON.stringify(output, null, 2));

if (errors.length) process.exitCode = 1;
