import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const currentPath = '.agent/state/current.json';
const casePath = '.agent/state/cases/target-075-chart-of-accounts-reopen-and-setup-consistency-check.json';
const readinessPath = '.agent/TARGET-075-PILOT-READINESS.md';
const freezePath = '.agent/IMPROVEMENT-FREEZE.md';
const rootReadmePath = 'README.md';
const handoverPath = 'HANDOVER.md';
const projectTemplateReadmePath = '.agent/project-template/README.md';
const executionRoadmapPath = '.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md';
const projectDashboardPath = '.agent/project-template/PROJECT-DASHBOARD-DRAFT.md';
const activeArtifactClassificationPath = '.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md';
const capabilitiesPath = '.agent/capabilities.json';
const packagePath = 'package.json';
const specPath = 'playwright/projects/fibu-book5/tests/target-075-chart-of-accounts-reopen-and-setup-consistency-check.spec.ts';
const guardedRunnerPath = 'scripts/agent/run-target-075-foundation-consistency-pilot.mjs';
const contextPackSelftestPath = 'scripts/agent/context-pack.selftest.mjs';
const foundationDecisionScriptPath = 'scripts/agent/foundation-readiness-decision.mjs';
const foundationDecisionSelftestPath = 'scripts/agent/foundation-readiness-decision.selftest.mjs';
const foundationDecisionTemplatePath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.template.md';
const target075ResultPath =
  'playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/TARGET-075-result.json';
const foundationDecisionPath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md';
const scriptName = 'fibu:target:foundation-consistency-pilot';

function readText(relativePath) {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.resolve(root, relativePath));
}

function includesAll(values, required) {
  const set = new Set(values ?? []);
  return required.filter((value) => !set.has(value));
}

const errors = [];
const warnings = [];

for (const requiredFile of [
  currentPath,
  casePath,
  readinessPath,
  freezePath,
  rootReadmePath,
  handoverPath,
  projectTemplateReadmePath,
  executionRoadmapPath,
  projectDashboardPath,
  activeArtifactClassificationPath,
  capabilitiesPath,
  packagePath,
  specPath,
  guardedRunnerPath,
  contextPackSelftestPath,
  foundationDecisionScriptPath,
  foundationDecisionSelftestPath,
  foundationDecisionTemplatePath
]) {
  if (!exists(requiredFile)) errors.push(`missing required file: ${requiredFile}`);
}

let targetCase = null;
let currentState = null;
let packageJson = null;
let capabilities = null;
let readiness = '';
let freeze = '';
let rootReadme = '';
let handover = '';
let projectTemplateReadme = '';
let executionRoadmap = '';
let projectDashboard = '';
let activeArtifactClassification = '';
let spec = '';
let guardedRunner = '';
let foundationDecisionTemplate = '';
let target075Result = null;

if (!errors.length) {
  currentState = readJson(currentPath);
  targetCase = readJson(casePath);
  packageJson = readJson(packagePath);
  capabilities = readJson(capabilitiesPath);
  readiness = readText(readinessPath);
  freeze = readText(freezePath);
  rootReadme = readText(rootReadmePath);
  handover = readText(handoverPath);
  projectTemplateReadme = readText(projectTemplateReadmePath);
  executionRoadmap = readText(executionRoadmapPath);
  projectDashboard = readText(projectDashboardPath);
  activeArtifactClassification = readText(activeArtifactClassificationPath);
  spec = readText(specPath);
  guardedRunner = readText(guardedRunnerPath);
  foundationDecisionTemplate = readText(foundationDecisionTemplatePath);
  if (exists(target075ResultPath)) target075Result = readJson(target075ResultPath);
}

if (currentState) {
  if (currentState.instance !== 'playthru') errors.push(`${currentPath}: instance must be playthru`);
  if (currentState.company !== 'UNIVERSAARL-DE') errors.push(`${currentPath}: company must be UNIVERSAARL-DE`);
  if (currentState.activeCase !== 'PROJECT-IMPROVEMENT-FREEZE-001') {
    errors.push(`${currentPath}: activeCase must remain PROJECT-IMPROVEMENT-FREEZE-001 while freeze is active`);
  }
  if (currentState.nextCase !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push(`${currentPath}: nextCase must remain TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK`);
  }
  if (currentState.activeNextStepAuthority?.roadmap !== executionRoadmapPath) {
    errors.push(`${currentPath}: activeNextStepAuthority.roadmap must point to ${executionRoadmapPath}`);
  }
  if (currentState.activeNextStepAuthority?.dashboard !== projectDashboardPath) {
    errors.push(`${currentPath}: activeNextStepAuthority.dashboard must point to ${projectDashboardPath}`);
  }
  const forbiddenActions = new Set(currentState.forbiddenActions ?? []);
  for (const action of ['open-business-central-live', 'continue-target-073', 'setup-change', 'master-data-change']) {
    if (!forbiddenActions.has(action)) errors.push(`${currentPath}: forbiddenActions must include ${action} during freeze`);
  }
}

if (targetCase) {
  if (targetCase.caseId !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push(`${casePath}: unexpected caseId ${targetCase.caseId}`);
  }
  if (targetCase.status !== 'prepared-pending-freeze-lift') {
    errors.push(`${casePath}: status must remain prepared-pending-freeze-lift`);
  }
  if (targetCase.instance !== 'playthru') errors.push(`${casePath}: instance must be playthru`);
  if (targetCase.company !== 'UNIVERSAARL-DE') errors.push(`${casePath}: company must be UNIVERSAARL-DE`);
  if (targetCase.effectiveBcActionsAllowed !== false) {
    errors.push(`${casePath}: effectiveBcActionsAllowed must be false`);
  }
  if (targetCase.mayRunPlaywright !== true) {
    warnings.push(`${casePath}: mayRunPlaywright is not true; after freeze lift this pilot would need explicit update`);
  }

  const missingCapabilities = includesAll(targetCase.requiredCapabilities, [
    'bc_page_context_guard',
    'screenshot_truth_gate',
    'evidence_pack_writer',
    'bc_dialog_gate',
    'bc_source_research',
    'mcp_tooling_governance'
  ]);
  if (missingCapabilities.length) {
    errors.push(`${casePath}: missing requiredCapabilities ${missingCapabilities.join(', ')}`);
  }

  const forbiddenActions = new Set(targetCase.forbiddenActions ?? []);
  for (const action of [
    'type-business-central-values',
    'write-setup',
    'create-master-data',
    'create-document-or-draft',
    'preview-posting',
    'post',
    'payment',
    'api-shortcut',
    'cleanup-delete',
    'claim-foundation-ready'
  ]) {
    if (!forbiddenActions.has(action)) errors.push(`${casePath}: forbiddenActions must include ${action}`);
  }

  const requiredFlags = targetCase.evidencePlan?.requiredFlags ?? {};
  for (const [flag, expected] of Object.entries({
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false
  })) {
    if (requiredFlags[flag] !== expected) {
      errors.push(`${casePath}: evidencePlan.requiredFlags.${flag} must be ${expected}`);
    }
  }

  const qualityAudit = targetCase.qualityAuditReview ?? {};
  if (qualityAudit.reviewedCommand !== 'npm run agent:quality:audit') {
    errors.push(`${casePath}: qualityAuditReview.reviewedCommand must be npm run agent:quality:audit`);
  }
  const acceptedRiskIds = new Set((qualityAudit.risksAcceptedForThisCaseOnly ?? []).map((risk) => risk.id));
  for (const riskId of ['narrow-tsconfig', 'auth-check-not-enforced', 'playwright-flake-surface']) {
    if (!acceptedRiskIds.has(riskId)) errors.push(`${casePath}: qualityAuditReview must address ${riskId}`);
  }
  if (!(qualityAudit.mustHoldBeforePilot ?? []).some((entry) => /TARGET-075 remains read-only/i.test(entry))) {
    errors.push(`${casePath}: qualityAuditReview.mustHoldBeforePilot must keep TARGET-075 read-only`);
  }
  if (/TARGET-075-FIRST-VENDOR-CARD-CONTROLLED-FIT|first Vendor Card fit/i.test(JSON.stringify(targetCase))) {
    errors.push(`${casePath}: TARGET-075 must hand off to FOUNDATION-READINESS-DECISION.md before any first vendor pilot`);
  }
  if (targetCase.nextCase !== 'FOUNDATION-READINESS-DECISION') {
    errors.push(`${casePath}: nextCase must be FOUNDATION-READINESS-DECISION`);
  }
}

if (capabilities) {
  const capabilityIds = new Set((capabilities.capabilities ?? []).map((capability) => capability.id));
  for (const id of ['bc_source_research', 'bc_active_editor_diagnosis', 'mcp_tooling_governance']) {
    if (!capabilityIds.has(id)) errors.push(`${capabilitiesPath}: missing capability ${id}`);
  }
}

if (packageJson) {
  const script = packageJson.scripts?.[scriptName] ?? '';
  if (!script.includes(guardedRunnerPath) && !script.includes(specPath.replaceAll('\\', '/'))) {
    errors.push(`${packagePath}: script ${scriptName} must reference the guarded runner or ${specPath}`);
  }
  const foundationDecisionScript = packageJson.scripts?.['agent:foundation:decision'] ?? '';
  if (!foundationDecisionScript.includes(foundationDecisionScriptPath)) {
    errors.push(`${packagePath}: script agent:foundation:decision must reference ${foundationDecisionScriptPath}`);
  }
  const foundationDecisionCheckScript = packageJson.scripts?.['agent:foundation:decision:check'] ?? '';
  if (!foundationDecisionCheckScript.includes(foundationDecisionScriptPath) || !foundationDecisionCheckScript.includes('--check')) {
    errors.push(`${packagePath}: script agent:foundation:decision:check must run ${foundationDecisionScriptPath} --check`);
  }
  const foundationDecisionWriteScript = packageJson.scripts?.['agent:foundation:decision:write'] ?? '';
  if (!foundationDecisionWriteScript.includes(foundationDecisionScriptPath) || !foundationDecisionWriteScript.includes('--write')) {
    errors.push(`${packagePath}: script agent:foundation:decision:write must run ${foundationDecisionScriptPath} --write`);
  }
  const foundationDecisionSelftest = packageJson.scripts?.['agent:foundation:decision:test'] ?? '';
  if (!foundationDecisionSelftest.includes(foundationDecisionSelftestPath)) {
    errors.push(`${packagePath}: script agent:foundation:decision:test must reference ${foundationDecisionSelftestPath}`);
  }
  const contextPackSelftest = packageJson.scripts?.['agent:context:test'] ?? '';
  if (!contextPackSelftest.includes(contextPackSelftestPath)) {
    errors.push(`${packagePath}: script agent:context:test must reference ${contextPackSelftestPath}`);
  }
}

if (exists(foundationDecisionScriptPath)) {
  const foundationDecisionScript = readText(foundationDecisionScriptPath);
  for (const requiredSignal of [
    target075ResultPath,
    foundationDecisionPath,
    'foundationReadinessInput',
    'authGate',
    'executionGate',
    'setupChanged',
    'masterDataChanged',
    'previewPosting',
    'posted',
    '--write'
  ]) {
    if (!foundationDecisionScript.includes(requiredSignal)) {
      errors.push(`${foundationDecisionScriptPath}: missing required handoff signal ${requiredSignal}`);
    }
  }
}

if (guardedRunner) {
  if (!guardedRunner.includes(specPath)) {
    errors.push(`${guardedRunnerPath}: guarded runner must reference ${specPath}`);
  }
  if (!guardedRunner.includes('agent:freeze:status')) {
    errors.push(`${guardedRunnerPath}: guarded runner must check agent:freeze:status`);
  }
  if (!guardedRunner.includes('agent:target075:readiness')) {
    errors.push(`${guardedRunnerPath}: guarded runner must check agent:target075:readiness`);
  }
  if (!guardedRunner.includes('agent:context:test')) {
    errors.push(`${guardedRunnerPath}: guarded runner must check agent:context:test before live execution`);
  }
  if (!guardedRunner.includes('contextLiveGate')) {
    errors.push(`${guardedRunnerPath}: guarded runner --check output must expose contextLiveGate`);
  }
  if (!guardedRunner.includes('auth:bc:check') || !guardedRunner.includes('canUseStoredAuth')) {
    errors.push(`${guardedRunnerPath}: guarded runner must check stored auth before live execution`);
  }
  if (!guardedRunner.includes('auth:bc:doctor') || !guardedRunner.includes('canRunBusinessCentralWorkflows')) {
    errors.push(`${guardedRunnerPath}: guarded runner must check auth:bc:doctor live-gate status before live execution`);
  }
  if (!guardedRunner.includes('--live-approved')) {
    errors.push(`${guardedRunnerPath}: guarded runner must require --live-approved for live execution while freeze is active`);
  }
  if (!guardedRunner.includes('TARGET_075_FREEZE_OVERRIDE_APPROVED')) {
    errors.push(
      `${guardedRunnerPath}: guarded runner must require TARGET_075_FREEZE_OVERRIDE_APPROVED=1 before bypassing an active freeze`
    );
  }
  if (!guardedRunner.includes('--check')) {
    errors.push(`${guardedRunnerPath}: guarded runner must offer --check for safe readiness/auth validation without live execution`);
  }
  if (!guardedRunner.includes('TARGET_075_LIVE_APPROVED')) {
    errors.push(`${guardedRunnerPath}: guarded runner must set TARGET_075_LIVE_APPROVED only for approved live execution`);
  }
  if (!guardedRunner.includes('TARGET_075_RUNNER_GUARD_CHECKED')) {
    errors.push(`${guardedRunnerPath}: guarded runner must set TARGET_075_RUNNER_GUARD_CHECKED for approved live execution`);
  }
  for (const envName of ['TARGET_075_FREEZE_ACTIVE', 'TARGET_075_FREEZE_OVERRIDE_USED']) {
    if (!guardedRunner.includes(envName)) {
      errors.push(`${guardedRunnerPath}: guarded runner must pass ${envName} into TARGET-075 executionGate evidence`);
    }
  }
  for (const envName of [
    'TARGET_075_AUTH_AGE_HOURS',
    'TARGET_075_AUTH_MAX_AGE_HOURS',
    'TARGET_075_AUTH_EXPIRES_IN_HOURS',
    'TARGET_075_AUTH_WARN_EXPIRES_IN_HOURS',
    'TARGET_075_AUTH_WARNINGS',
    'TARGET_075_AUTH_DOCTOR_DECISION',
    'TARGET_075_AUTH_DOCTOR_LIVE_GATE',
    'TARGET_075_AUTH_TARGET'
  ]) {
    if (!guardedRunner.includes(envName)) {
      errors.push(`${guardedRunnerPath}: guarded runner must pass ${envName} into TARGET-075 evidence`);
    }
  }
}

if (readiness) {
  for (const phrase of [
    'freeze still active',
    'Do not resume TARGET-073',
    'TARGET-075 stays read-only',
    'stored auth must resolve to `playthru / UNIVERSAARL-DE`',
    'It cannot prove final SKR04 completeness',
    'After TARGET-075, create or update `FOUNDATION-READINESS-DECISION.md` before selecting any master-data'
  ]) {
    if (!readiness.includes(phrase)) errors.push(`${readinessPath}: missing readiness phrase: ${phrase}`);
  }
}

for (const [controlPath, text] of [
  [rootReadmePath, rootReadme],
  [handoverPath, handover],
  [projectTemplateReadmePath, projectTemplateReadme],
  [executionRoadmapPath, executionRoadmap],
  [projectDashboardPath, projectDashboard],
  [activeArtifactClassificationPath, activeArtifactClassification]
]) {
  for (const phrase of ['playthru', 'UNIVERSAARL-DE', 'TARGET-073', 'TARGET-075', 'read-first']) {
    if (!text.includes(phrase)) errors.push(`${controlPath}: missing active-control phrase: ${phrase}`);
  }
  if (!text.includes('FOUNDATION-READINESS-DECISION')) {
    errors.push(`${controlPath}: must hand off to FOUNDATION-READINESS-DECISION after TARGET-075`);
  }
}

for (const [controlPath, text] of [
  [handoverPath, handover],
  [projectTemplateReadmePath, projectTemplateReadme],
  [executionRoadmapPath, executionRoadmap]
]) {
  for (const phrase of [
    'agent:resume:check:overnight',
    'agent:foundation:decision:check',
    'fibu:target:foundation-consistency-pilot -- --check',
    'fibu:target:foundation-consistency-pilot -- --list'
  ]) {
    if (!text.includes(phrase)) errors.push(`${controlPath}: missing TARGET-075 gate command: ${phrase}`);
  }
}

if (foundationDecisionTemplate) {
  for (const phrase of [
    'Status: `template/no-evidence`',
    'Diese Vorlage ist keine Evidence',
    'TARGET-075',
    'playthru',
    'UNIVERSAARL-DE',
    'FOUNDATION-READINESS-DECISION.md',
    'keine Setup-Freigabe',
    'keine Stammdaten-Freigabe',
    'Auth-Zielnachweis aus aktuellem State',
    'Geschaeftsbuchungsgruppen',
    'Produktbuchungsgruppen',
    'beobachtete Page-Evidence',
    'Screenshot-Metadaten'
  ]) {
    if (!foundationDecisionTemplate.includes(phrase)) {
      errors.push(`${foundationDecisionTemplatePath}: missing template phrase: ${phrase}`);
    }
  }
}

if (freeze) {
  if (!/Status:\s*active/i.test(freeze)) errors.push(`${freezePath}: freeze must remain active`);
  if (!freeze.includes('TARGET-075 remains read-only')) {
    errors.push(`${freezePath}: resume conditions must keep TARGET-075 read-only`);
  }
}

if (spec) {
  for (const legacyTerm of ['MCP_1_20260210', 'RM-DEMO', 'CRONUS', 'Rhein-Main']) {
    if (spec.includes(legacyTerm)) {
      errors.push(`${specPath}: active TARGET-075 spec must not contain legacy target term ${legacyTerm}`);
    }
  }
  const riskyPatterns = [
    { id: 'forceTrue', re: /force\s*:\s*true/ },
    { id: 'mouseClick', re: /\bmouse\.click\s*\(/ },
    { id: 'locatorClick', re: /\.click\s*\(/ },
    { id: 'fill', re: /\.fill\s*\(/ },
    { id: 'type', re: /\.type\s*\(|keyboard\.type\s*\(/ },
    { id: 'pressEnter', re: /keyboard\.press\s*\(\s*['"]Enter['"]/ },
    { id: 'apiShortcut', re: /\bfetch\s*\(|request\.(get|post|patch|delete)\s*\(/ },
    { id: 'positivePostOrPreviewFlag', re: /posted:\s*true|previewPosting:\s*true/i }
  ];
  for (const pattern of riskyPatterns) {
    if (pattern.re.test(spec)) errors.push(`${specPath}: risky live-pilot pattern present: ${pattern.id}`);
  }
  if (!/storageState:\s*['"]playwright\/\.auth\/bc-user\.json['"]/.test(spec)) {
    warnings.push(`${specPath}: storageState is not the expected BC storage state; confirm auth handling before live use`);
  }
  if (!spec.includes('EXPECTED_INSTANCE = \'playthru\'')) {
    errors.push(`${specPath}: expected instance guard missing`);
  }
  if (!spec.includes('TARGET_COMPANY = \'UNIVERSAARL-DE\'')) {
    errors.push(`${specPath}: expected company guard missing`);
  }
  if (!spec.includes('TARGET_075_LIVE_APPROVED') || !spec.includes('TARGET_075_RUNNER_GUARD_CHECKED') || !spec.includes('test.skip')) {
    errors.push(
      `${specPath}: direct Playwright execution must be skipped unless TARGET_075_LIVE_APPROVED and TARGET_075_RUNNER_GUARD_CHECKED are set by the guarded runner`
    );
  }
  if (/TARGET-075-FIRST-VENDOR-CARD-CONTROLLED-FIT|first Vendor Card fit/i.test(spec)) {
    errors.push(`${specPath}: result handoff must be FOUNDATION-READINESS-DECISION before any first vendor pilot`);
  }
  if (!spec.includes("const nextCase = 'FOUNDATION-READINESS-DECISION'")) {
    errors.push(`${specPath}: nextCase must be hard-gated to FOUNDATION-READINESS-DECISION`);
  }
  for (const requiredResultSignal of [
    'authGate',
    'executionGate',
    'checkedByGuard',
    'secretsPrinted',
    'runnerGuardChecked',
    'freezeActiveAtRunner',
    'freezeOverrideUsed',
    'TARGET_075_AUTH_EXPIRES_IN_HOURS',
    'TARGET_075_AUTH_WARNINGS',
    'doctorDecision',
    'doctorLiveGate',
    'authTarget',
    'foundationReadinessInput',
    'decisionStatus',
    'chartOfAccounts',
    'setupContext',
    'nextProjectOutputs'
  ]) {
    if (!spec.includes(requiredResultSignal)) {
      errors.push(`${specPath}: result must include ${requiredResultSignal} for FOUNDATION-READINESS-DECISION.md handoff`);
    }
  }
}

if (exists(foundationDecisionPath) && !target075Result) {
  errors.push(`${foundationDecisionPath}: must not exist before ${target075ResultPath} provides TARGET-075 evidence`);
}

if (target075Result) {
  if (target075Result.caseId !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push(`${target075ResultPath}: unexpected caseId ${target075Result.caseId}`);
  }
  if (!target075Result.foundationReadinessInput) {
    errors.push(`${target075ResultPath}: missing foundationReadinessInput for FOUNDATION-READINESS-DECISION.md handoff`);
  }
  if (!target075Result.authGate) {
    errors.push(`${target075ResultPath}: missing authGate for guarded TARGET-075 evidence`);
  } else {
    if (target075Result.authGate.checkedByGuard !== true) {
      errors.push(`${target075ResultPath}: authGate.checkedByGuard must be true`);
    }
    if (target075Result.authGate.secretsPrinted !== false) {
      errors.push(`${target075ResultPath}: authGate.secretsPrinted must be false`);
    }
    if (!Array.isArray(target075Result.authGate.warnings)) {
      errors.push(`${target075ResultPath}: authGate.warnings must be an array`);
    }
    if (!('doctorDecision' in target075Result.authGate)) {
      errors.push(`${target075ResultPath}: authGate.doctorDecision must record auth:bc:doctor decision`);
    }
    if (!('doctorLiveGate' in target075Result.authGate)) {
      errors.push(`${target075ResultPath}: authGate.doctorLiveGate must record auth:bc:doctor liveGate`);
    }
    const authTarget = target075Result.authGate.authTarget;
    if (!authTarget || typeof authTarget !== 'object') {
      errors.push(`${target075ResultPath}: authGate.authTarget must record the redacted target URL diagnosis`);
    } else {
      if (authTarget.targetEnvironment !== 'playthru') {
        errors.push(`${target075ResultPath}: authGate.authTarget.targetEnvironment must be playthru`);
      }
      if (authTarget.targetCompany !== 'UNIVERSAARL-DE') {
        errors.push(`${target075ResultPath}: authGate.authTarget.targetCompany must be UNIVERSAARL-DE`);
      }
      if (authTarget.targetMatchesState !== true) {
        errors.push(`${target075ResultPath}: authGate.authTarget.targetMatchesState must be true`);
      }
      if (authTarget.sourceDiffersFromTarget === true && authTarget.targetBuiltFromCurrentState !== true) {
        errors.push(`${target075ResultPath}: authGate.authTarget must prove the target URL was rebuilt from current state when source differs`);
      }
    }
  }
  if (!target075Result.executionGate) {
    errors.push(`${target075ResultPath}: missing executionGate for guarded TARGET-075 evidence`);
  } else {
    if (target075Result.executionGate.runnerGuardChecked !== true) {
      errors.push(`${target075ResultPath}: executionGate.runnerGuardChecked must be true`);
    }
    if (target075Result.executionGate.liveApproved !== true) {
      errors.push(`${target075ResultPath}: executionGate.liveApproved must be true`);
    }
    if (typeof target075Result.executionGate.freezeActiveAtRunner !== 'boolean') {
      errors.push(`${target075ResultPath}: executionGate.freezeActiveAtRunner must be a boolean`);
    }
    if (typeof target075Result.executionGate.freezeOverrideUsed !== 'boolean') {
      errors.push(`${target075ResultPath}: executionGate.freezeOverrideUsed must be a boolean`);
    }
  }
  for (const [flag, expected] of Object.entries({
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false
  })) {
    if (target075Result[flag] !== expected) {
      errors.push(`${target075ResultPath}: ${flag} must remain ${expected} for read-first Foundation handoff`);
    }
  }
  if (target075Result.nextCase !== 'FOUNDATION-READINESS-DECISION') {
    errors.push(`${target075ResultPath}: nextCase must be FOUNDATION-READINESS-DECISION`);
  }
}

const checkedFiles = [
  currentPath,
  casePath,
  readinessPath,
  freezePath,
  rootReadmePath,
  handoverPath,
  projectTemplateReadmePath,
  executionRoadmapPath,
  projectDashboardPath,
  activeArtifactClassificationPath,
  capabilitiesPath,
  packagePath,
  specPath,
  guardedRunnerPath,
  contextPackSelftestPath,
  foundationDecisionScriptPath,
  foundationDecisionSelftestPath,
  foundationDecisionTemplatePath
];
if (exists(target075ResultPath)) checkedFiles.push(target075ResultPath);
if (exists(foundationDecisionPath)) checkedFiles.push(foundationDecisionPath);

const result = {
  schemaVersion: 1,
  purpose: 'target-075-readiness-check',
  canProceedAfterFreezeLift: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles,
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'TARGET-075 is locally prepared as a read-only pilot. Freeze lift and auth/context validation are still required before live execution.'
      : 'Fix readiness errors before considering TARGET-075 for live execution.'
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) process.exitCode = 1;
