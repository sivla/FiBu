import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const files = {
  current: '.agent/state/current.json',
  projectDecision: '.agent/PROJECT-DECISION.md',
  architectureGate: '.agent/CASE-STUDY-ARCHITECTURE-GATE.md',
  companyUsecase: 'playwright/projects/fibu-book5/BC-COMPANY-USECASE.md',
  datasetBlueprint: 'playwright/projects/fibu-book5/UNIVERSAARL-DATASET-BLUEPRINT.md',
  fullCatalog: 'playwright/projects/fibu-book5/BC-FULL-PLAYTHROUGH-CATALOG.md',
  companyRegistry: 'playwright/projects/fibu-book5/COMPANY-REGISTRY.json'
};

function absolute(relativePath) {
  return path.resolve(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(absolute(relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function requirePhrase(fileKey, phrase, errors) {
  const text = readText(files[fileKey]);
  if (!text.includes(phrase)) errors.push(`${files[fileKey]} must mention: ${phrase}`);
}

function forbidPhrase(fileKey, phrase, errors) {
  const text = readText(files[fileKey]);
  if (text.includes(phrase)) errors.push(`${files[fileKey]} must not mention active-stale phrase: ${phrase}`);
}

const errors = [];
const warnings = [];

for (const filePath of Object.values(files)) {
  if (!fs.existsSync(absolute(filePath))) errors.push(`missing required file: ${filePath}`);
}

let current = null;
let registry = null;

if (!errors.length) {
  current = readJson(files.current);
  registry = readJson(files.companyRegistry);

  if (current.instance !== 'playthru') errors.push(`${files.current}: instance must be playthru`);
  if (current.company !== 'UNIVERSAARL-DE') errors.push(`${files.current}: company must be UNIVERSAARL-DE`);

  if (registry.environment !== 'playthru') errors.push(`${files.companyRegistry}: environment must be playthru`);
  if (registry.primaryCompany !== 'UNIVERSAARL-DE') errors.push(`${files.companyRegistry}: primaryCompany must be UNIVERSAARL-DE`);
  if (registry.legalEntity !== 'Universaarl GmbH') errors.push(`${files.companyRegistry}: legalEntity must be Universaarl GmbH`);
  if (registry.currency !== 'EUR') errors.push(`${files.companyRegistry}: currency must be EUR`);
  if (!String(registry.chartOfAccountsPolicy ?? '').includes('SKR04')) {
    errors.push(`${files.companyRegistry}: chartOfAccountsPolicy must mention SKR04`);
  }

  const companies = Array.isArray(registry.companies) ? registry.companies : [];
  const companyByName = new Map(companies.map((company) => [company.company, company]));
  for (const requiredCompany of [
    'UNIVERSAARL-DE',
    'UNIVERSAARL-PROD',
    'UNIVERSAARL-SALES',
    'UNIVERSAARL-SERVICE',
    'UNIVERSAARL-HOLDING'
  ]) {
    if (!companyByName.has(requiredCompany)) errors.push(`${files.companyRegistry}: missing company ${requiredCompany}`);
  }

  const primary = companyByName.get('UNIVERSAARL-DE');
  if (primary && primary.status !== 'active-target-visible') {
    errors.push(`${files.companyRegistry}: UNIVERSAARL-DE status must be active-target-visible`);
  }

  for (const legacyName of ['RM-DEMO', 'CRONUS USA, Inc.']) {
    const legacy = companyByName.get(legacyName);
    if (!legacy) {
      warnings.push(`${files.companyRegistry}: ${legacyName} not listed as legacy archive reference`);
    } else if (!String(legacy.status ?? '').includes('legacy')) {
      errors.push(`${files.companyRegistry}: ${legacyName} must be marked legacy`);
    }
  }

  for (const [fileKey, phrases] of Object.entries({
    projectDecision: ['Universaarl GmbH', 'SKR04-orientierter Kontenplan', 'nicht queue-getrieben'],
    architectureGate: ['Universaarl GmbH', 'SKR04-oriented starter chart', 'departments, product lines, channels, regions and locations'],
    companyUsecase: ['UNIVERSAARL-DE', 'Mehr-Company-Fallstudie', 'SKR04 ist der Zielkontenplan'],
    datasetBlueprint: [
      'DATA-FOUNDATION',
      'W1-FINANCE-FOUNDATION',
      'MD-CUSTOMERS-01',
      'PROC-O2C-01',
      'TARGET-075',
      'FOUNDATION-READINESS-DECISION.md',
      'PWS-MD-001'
    ],
    fullCatalog: ['Business Central Full Playthrough Catalog - Universaarl', 'Shopify / Online Store: `excluded-shopify`', 'TARGET-075']
  })) {
    for (const phrase of phrases) requirePhrase(fileKey, phrase, errors);
  }

  forbidPhrase(
    'datasetBlueprint',
    'Naechster Schritt: `TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT`',
    errors
  );
  forbidPhrase('datasetBlueprint', 'bis zum UI-Preflight gesperrt', errors);
}

const output = {
  schemaVersion: 1,
  purpose: 'universaarl-case-study-check',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles: Object.values(files),
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'Universaarl case-study anchors are consistent enough for local planning.'
      : 'Fix active case-study truth before relying on Universaarl setup or book decisions.'
};

console.log(JSON.stringify(output, null, 2));

if (errors.length) process.exitCode = 1;
