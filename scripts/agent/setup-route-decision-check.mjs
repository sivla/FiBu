import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const files = {
  operatingModel: '.agent/BC-OPERATING-MODEL.md',
  smartDecision: '.agent/SMART-DECISION-GATE.md',
  setupRouteDecision: '.agent/SETUP-ROUTE-DECISION.md',
  caseStudyArchitecture: '.agent/CASE-STUDY-ARCHITECTURE-GATE.md',
  setupRouteSkill: '.agent/skills/bc-setup-route-decision.md',
  sourceSkill: '.agent/skills/bc-source-research.md',
  capabilities: '.agent/capabilities.json',
  sourceRegistry: 'playwright/projects/fibu-book5/BC-SOURCE-REGISTRY.md',
  packageJson: 'package.json'
};

function readText(filePath) {
  return fs.readFileSync(path.resolve(root, filePath), 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function requirePhrase(fileKey, phrase, errors) {
  const text = readText(files[fileKey]);
  if (!text.includes(phrase)) errors.push(`${files[fileKey]} must mention: ${phrase}`);
}

const errors = [];
const warnings = [];

for (const filePath of Object.values(files)) {
  if (!fs.existsSync(path.resolve(root, filePath))) errors.push(`missing required file: ${filePath}`);
}

if (!errors.length) {
  const capabilities = readJson(files.capabilities).capabilities ?? [];
  const setupCapability = capabilities.find((capability) => capability.id === 'bc_setup_route_decision');
  if (!setupCapability) {
    errors.push(`${files.capabilities} must define capability bc_setup_route_decision`);
  } else {
    for (const route of [
      'manualUi',
      'assistedSetup',
      'configurationPackageOrRapidStart',
      'excelImport',
      'template',
      'api',
      'alExtension',
      'parkOrNoChange'
    ]) {
      const allText = JSON.stringify(setupCapability);
      if (!allText.includes(route)) errors.push(`bc_setup_route_decision must mention route ${route}`);
    }
    for (const skillId of ['bc-setup-route-decision', 'bc-source-research']) {
      if (!setupCapability.linkedSkills?.includes(skillId)) {
        errors.push(`bc_setup_route_decision must link ${skillId}`);
      }
    }
    const setupCapabilityText = JSON.stringify(setupCapability);
    for (const phrase of ['caseStudyContext', 'caseStudyArchitecture']) {
      if (!setupCapabilityText.includes(phrase)) errors.push(`bc_setup_route_decision must mention ${phrase}`);
    }
  }

  const packageJson = readJson(files.packageJson);
  if (packageJson.scripts?.['agent:setup-route:check'] !== 'node scripts/agent/setup-route-decision-check.mjs') {
    errors.push(`${files.packageJson} must expose agent:setup-route:check`);
  }

  for (const phrase of [
    'manual UI entry',
    'assisted setup',
    'configuration packages/RapidStart',
    'Excel import/export',
    'templates',
    'API route',
    'AL extension'
  ]) {
    requirePhrase('operatingModel', phrase, errors);
  }

  for (const phrase of [
    '"setupRouteAssessment"',
    '"configurationPackageOrRapidStart"',
    '"excelImport"',
    '"alExtension"'
  ]) {
    requirePhrase('smartDecision', phrase, errors);
  }

  for (const phrase of [
    'Configuration Package / RapidStart',
    'Excel Import/Export',
    'Before effective action',
    'After effective action'
  ]) {
    requirePhrase('setupRouteDecision', phrase, errors);
  }

  for (const phrase of [
    '## Skill name',
    'bc-setup-route-decision',
    '"setupRouteAssessment"',
    '"caseStudyArchitecture"',
    'configuration packages/RapidStart',
    'The only reason for the action is that the queue says so'
  ]) {
    requirePhrase('setupRouteSkill', phrase, errors);
  }

  for (const phrase of [
    'Universaarl GmbH',
    'Which Universaarl business need',
    '"caseStudyArchitecture"',
    'Stop or redesign'
  ]) {
    requirePhrase('caseStudyArchitecture', phrase, errors);
  }

  for (const phrase of [
    'CASE-STUDY-ARCHITECTURE-GATE.md',
    'realistic Universaarl implementation',
    'legal entity'
  ]) {
    requirePhrase('operatingModel', phrase, errors);
  }

  for (const phrase of [
    'configuration packages/RapidStart',
    'Excel import',
    'templates',
    'APIs',
    'AL extensions'
  ]) {
    requirePhrase('sourceSkill', phrase, errors);
  }

  for (const phrase of [
    'Apply company configuration packages',
    'Set up company configuration packages',
    'Use Excel to import data with configuration packages'
  ]) {
    requirePhrase('sourceRegistry', phrase, errors);
  }
}

const output = {
  schemaVersion: 1,
  purpose: 'setup-route-decision-check',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles: Object.values(files),
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'Setup route decision rules are present. Use them before larger setup, migration or master-data actions.'
      : 'Fix setup route decision wiring before relying on it.'
};

console.log(JSON.stringify(output, null, 2));

if (errors.length) process.exitCode = 1;
