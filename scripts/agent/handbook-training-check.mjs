import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  standard: '.agent/CUSTOMER-HANDBOOK-TRAINING-STANDARD.md',
  operatingModel: '.agent/BC-OPERATING-MODEL.md',
  projectDecision: '.agent/PROJECT-DECISION.md',
  learningSystem: '.agent/LEARNING-SYSTEM.md',
  bookRules: 'playwright/projects/fibu-book5/BOOK-WRITING-RULES.md'
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
  if (!fs.existsSync(absolute(filePath))) errors.push(`missing required file: ${filePath}`);
}

let allText = '';
if (!errors.length) {
  allText = Object.values(files).map((filePath) => readText(filePath)).join('\n\n');
}

function requirePhrase(phrase) {
  if (!allText.includes(phrase)) errors.push(`handbook/training standard must mention: ${phrase}`);
}

function requireAtLeast(label, phrases, minimum) {
  const found = phrases.filter((phrase) => allText.includes(phrase));
  if (found.length < minimum) {
    const missing = phrases.filter((phrase) => !found.includes(phrase));
    errors.push(`handbook/training standard must mention at least ${minimum}/${phrases.length} ${label}: missing ${missing.join(', ')}`);
  }
}

if (allText) {
  for (const phrase of [
    'Customer Handbook and Training Standard',
    'customer handbook',
    'training guide',
    'target role',
    'daily work',
    'required fields',
    'success check',
    'common mistakes',
    'correction',
    'escalation',
    'Playwright scenarios',
    'technical-only',
    'handbook-draft',
    'training-readiness',
    'Microsoft Learn',
    'Universaarl evidence'
  ]) {
    requirePhrase(phrase);
  }

  requireAtLeast('customer roles', [
    'Accounting',
    'Purchasing',
    'Sales',
    'Warehouse and inventory',
    'Management',
    'Key users',
    'Administrators'
  ], 6);

  requireAtLeast('handbook content items', [
    'short business explanation',
    'when to use the process',
    'required setup and master data',
    'step-by-step user action',
    'safe buttons versus data-changing buttons',
    'how to verify success',
    'common mistakes and visible symptoms',
    'role boundary'
  ], 7);

  if (/password|client_secret|refresh_token|access_token|Bearer |eyJ/i.test(allText)) {
    errors.push('handbook/training files appear to contain secret-like text');
  }

  if (allText.includes('RM-DEMO') || allText.includes('MCP_1_20260210')) {
    warnings.push('handbook/training standard context mentions legacy target names; keep customer-facing truth Universaarl-first.');
  }
}

const output = {
  schemaVersion: 1,
  purpose: 'customer-handbook-training-standard-check',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles: Object.values(files),
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'Customer handbook and training standard is available for future book, UAT and Playwright work.'
      : 'Fix handbook/training standard coverage before claiming customer-facing readiness.'
};

console.log(JSON.stringify(output, null, 2));

if (errors.length) process.exitCode = 1;
