import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  readme: '.agent/project-template/README.md',
  workbreakdown: '.agent/project-template/BC-IMPLEMENTATION-WORKBREAKDOWN-DRAFT.md',
  jiraModel: '.agent/project-template/JIRA-WORK-ITEM-MODEL.md',
  cadence: '.agent/project-template/DOCUMENTATION-CADENCE.md',
  artifactTemplates: '.agent/project-template/PROJECT-ARTIFACT-TEMPLATES.md'
};

function absolute(relativePath) {
  return path.resolve(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), 'utf8');
}

const errors = [];
const warnings = [];

for (const filePath of Object.values(files)) {
  if (!fs.existsSync(absolute(filePath))) {
    errors.push(`missing required file: ${filePath}`);
  }
}

let workbreakdownText = '';
let allText = '';
if (!errors.length) {
  workbreakdownText = readText(files.workbreakdown);
  allText = Object.values(files).map((filePath) => readText(filePath)).join('\n\n');
}

function requirePhrase(phrase) {
  if (!allText.includes(phrase)) errors.push(`project template must mention: ${phrase}`);
}

function requireAtLeast(label, phrases, minimum) {
  const found = phrases.filter((phrase) => allText.includes(phrase));
  if (found.length < minimum) {
    errors.push(`project template must mention at least ${minimum}/${phrases.length} ${label}: missing ${phrases.filter((phrase) => !found.includes(phrase)).join(', ')}`);
  }
}

if (allText) {
  for (const phrase of [
    'Universaarl BC Project Template',
    'Business Central Implementation Workbreakdown Draft',
    'Jira Work Item Model',
    'Documentation Cadence',
    'Project Artifact Templates',
    'Universaarl Business Central Implementation, Book, Training and Evidence System',
    'Workstream',
    'Epic',
    'Story',
    'Task',
    'Implementation route decision',
    'Playwright validation',
    'Book curation',
    'Finance Foundation and Control Model',
    'Recommended first refinement target: Finance Foundation and Control Model'
  ]) {
    requirePhrase(phrase);
  }

  requireAtLeast('official/source anchors', [
    'MB-800',
    'Business Central setup overview',
    'Dynamics 365 Business Process Catalog',
    'Source to pay',
    'Order to cash',
    'Inventory to deliver'
  ], 5);

  requireAtLeast('core workstreams', [
    'Project Governance and Delivery Method',
    'Universaarl Case Study and Core System Basis',
    'Finance Foundation and Control Model',
    'Commercial Master Data and Product Model',
    'Purchasing and Source-to-Pay',
    'Sales and Order-to-Cash',
    'Inventory, Costing and Stock Control',
    'Warehouse and Physical Logistics',
    'Security, Workflows and Operational Controls',
    'Reporting, Analytics and Management View',
    'Data Migration, Configuration Packages and Integration',
    'Book, Playwright and Agent Learning System'
  ], 10);

  requireAtLeast('route alternatives', [
    'manual UI setup',
    'Assisted Setup',
    'configuration package',
    'Excel import',
    'API',
    'AL extension',
    'no-change/park route'
  ], 6);

  requireAtLeast('delivery outputs', [
    'Definition of Ready',
    'Definition of Done',
    'Required customer data',
    'Required source/evidence',
    'Playwright scenario',
    'Training output',
    'Book output'
  ], 6);

  if (/password|client_secret|refresh_token|access_token|Bearer |eyJ/i.test(allText)) {
    errors.push('.agent/project-template appears to contain secret-like text');
  }

  if (allText.includes('RM-DEMO') || allText.includes('MCP_1_20260210')) {
    warnings.push('.agent/project-template mentions legacy target names; keep this draft Universaarl-first unless explicitly archiving history.');
  }

  if (!workbreakdownText.includes('Recommended first refinement target: Finance Foundation and Control Model')) {
    errors.push(`${files.workbreakdown} must keep Finance Foundation as the first refinement target`);
  }
}

const output = {
  schemaVersion: 1,
  purpose: 'bc-implementation-workbreakdown-check',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles: Object.values(files),
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'Workbreakdown draft is usable as a local implementation planning anchor. Refine Finance Foundation first.'
      : 'Fix the workbreakdown draft before using it as a planning anchor.'
};

console.log(JSON.stringify(output, null, 2));

if (errors.length) process.exitCode = 1;
