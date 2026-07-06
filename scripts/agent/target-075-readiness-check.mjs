import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const casePath = '.agent/state/cases/target-075-chart-of-accounts-reopen-and-setup-consistency-check.json';
const readinessPath = '.agent/TARGET-075-PILOT-READINESS.md';
const freezePath = '.agent/IMPROVEMENT-FREEZE.md';
const capabilitiesPath = '.agent/capabilities.json';
const packagePath = 'package.json';
const specPath = 'playwright/projects/fibu-book5/tests/target-075-chart-of-accounts-reopen-and-setup-consistency-check.spec.ts';
const guardedRunnerPath = 'scripts/agent/run-target-075-foundation-consistency-pilot.mjs';
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

for (const requiredFile of [casePath, readinessPath, freezePath, capabilitiesPath, packagePath, specPath, guardedRunnerPath]) {
  if (!exists(requiredFile)) errors.push(`missing required file: ${requiredFile}`);
}

let targetCase = null;
let packageJson = null;
let capabilities = null;
let readiness = '';
let freeze = '';
let spec = '';
let guardedRunner = '';

if (!errors.length) {
  targetCase = readJson(casePath);
  packageJson = readJson(packagePath);
  capabilities = readJson(capabilitiesPath);
  readiness = readText(readinessPath);
  freeze = readText(freezePath);
  spec = readText(specPath);
  guardedRunner = readText(guardedRunnerPath);
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
  if (!guardedRunner.includes('auth:bc:check') || !guardedRunner.includes('canUseStoredAuth')) {
    errors.push(`${guardedRunnerPath}: guarded runner must check stored auth before live execution`);
  }
  if (!guardedRunner.includes('--live-approved')) {
    errors.push(`${guardedRunnerPath}: guarded runner must require --live-approved for live execution while freeze is active`);
  }
  if (!guardedRunner.includes('--check')) {
    errors.push(`${guardedRunnerPath}: guarded runner must offer --check for safe readiness/auth validation without live execution`);
  }
  if (!guardedRunner.includes('TARGET_075_LIVE_APPROVED')) {
    errors.push(`${guardedRunnerPath}: guarded runner must set TARGET_075_LIVE_APPROVED only for approved live execution`);
  }
}

if (readiness) {
  for (const phrase of [
    'freeze still active',
    'Do not resume TARGET-073',
    'TARGET-075 stays read-only',
    'stored auth must resolve to `playthru / UNIVERSAARL-DE`',
    'It cannot prove final SKR04 completeness'
  ]) {
    if (!readiness.includes(phrase)) errors.push(`${readinessPath}: missing readiness phrase: ${phrase}`);
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
  if (!spec.includes('TARGET_075_LIVE_APPROVED') || !spec.includes('test.skip')) {
    errors.push(`${specPath}: direct Playwright execution must be skipped unless TARGET_075_LIVE_APPROVED is set by the guarded runner`);
  }
}

const result = {
  schemaVersion: 1,
  purpose: 'target-075-readiness-check',
  canProceedAfterFreezeLift: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles: [casePath, readinessPath, freezePath, capabilitiesPath, packagePath, specPath, guardedRunnerPath],
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'TARGET-075 is locally prepared as a read-only pilot. Freeze lift and auth/context validation are still required before live execution.'
      : 'Fix readiness errors before considering TARGET-075 for live execution.'
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) process.exitCode = 1;
