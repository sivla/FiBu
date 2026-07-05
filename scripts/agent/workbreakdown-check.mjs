import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  readme: '.agent/project-template/README.md',
  projectPlan: '.agent/project-template/PROJECT-PLAN-DRAFT.md',
  bookProjectModel: '.agent/project-template/BOOK-AS-PROJECT-MANAGEMENT-MODEL.md',
  bookProjectBacklog: '.agent/project-template/BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md',
  projectCast: '.agent/project-template/PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md',
  projectStoryline: '.agent/project-template/PROJECT-STORYLINE-DRAFT.md',
  projectSceneCards: '.agent/project-template/PROJECT-SCENE-CARDS-DRAFT.md',
  customerDataSimulation: '.agent/project-template/CUSTOMER-DATA-SIMULATION-DRAFT.md',
  workbreakdown: '.agent/project-template/BC-IMPLEMENTATION-WORKBREAKDOWN-DRAFT.md',
  jiraModel: '.agent/project-template/JIRA-WORK-ITEM-MODEL.md',
  cadence: '.agent/project-template/DOCUMENTATION-CADENCE.md',
  artifactTemplates: '.agent/project-template/PROJECT-ARTIFACT-TEMPLATES.md',
  customerDataCatalog: '.agent/project-template/CUSTOMER-DATA-CATALOG-DRAFT.md',
  decisionLog: '.agent/project-template/DECISION-LOG-DRAFT.md',
  riskRegister: '.agent/project-template/RISK-REGISTER-DRAFT.md',
  projectDashboard: '.agent/project-template/PROJECT-DASHBOARD-DRAFT.md',
  transitionProtocol: '.agent/project-template/GOAL-TRANSITION-PROTOCOL.md',
  transitionCard: '.agent/project-template/GOAL-TRANSITION-CARD-2026-07-05.md',
  refinementBacklog: '.agent/project-template/REFINEMENT-BACKLOG.md',
  caseStudyCoreDraft: '.agent/project-template/WORKSTREAM-02-CASE-STUDY-CORE-JIRA-DRAFT.md',
  financeFoundationDraft: '.agent/project-template/WORKSTREAM-03-FINANCE-FOUNDATION-JIRA-DRAFT.md'
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
    'Universaarl Business Central Project Plan Draft',
    'Book as Project Management Model',
    'Book Project Ticket Backlog Draft',
    'Project Cast and Stakeholders Draft',
    'Project Storyline Draft',
    'Project Scene Cards Draft',
    'Customer Data Simulation Draft',
    'Business Central Implementation Workbreakdown Draft',
    'Jira Work Item Model',
    'Documentation Cadence',
    'Project Artifact Templates',
    'Customer Data Catalog Draft',
    'Decision Log Draft',
    'Risk Register Draft',
    'Project Dashboard Draft',
    'Goal Transition Protocol',
    'Goal Transition Card - 2026-07-05',
    'Project Template Refinement Backlog',
    'WS02 Case Study Core Jira Draft',
    'WS03 Finance Foundation Jira Draft',
    'Universaarl Business Central Implementation, Book, Training and Evidence System',
    'Workstream',
    'Epic',
    'Story',
    'Task',
    'Implementation route decision',
    'Playwright validation',
    'Book curation',
    'Finance Foundation and Control Model',
    'Recommended first refinement target: Finance Foundation and Control Model',
    'Current next best step',
    'WS02-CASE-STUDY-CORE` now exists as a workstream draft',
    'WORKSTREAM-02-CASE-STUDY-CORE-JIRA-DRAFT.md',
    'Epic CS-01: Company Story and Legal Entity Model',
    'Epic CS-02: Organization, Locations and Responsibility Model',
    'Epic CS-03: Environment, Company Context and Evidence Boundary',
    'Epic FF-01: General Ledger Setup and Accounting Periods',
    'Epic FF-02: Chart of Accounts and Account Categories',
    'Epic FF-03: Posting Groups and Posting Setup',
    'Epic FF-04: VAT/USt Setup',
    'Workstream-level Playwright scenarios',
    'Workstream-level book outputs'
  ]) {
    requirePhrase(phrase);
  }

  requireAtLeast('project governance artifacts', [
    'Project plan draft',
    'Book as Project Management Model',
    'Book Project Ticket Backlog Draft',
    'Customer Data Simulation Draft',
    'Customer data request catalog',
    'Decision log',
    'Risk register',
    'UAT scenario catalog',
    'Training matrix',
    'Customer handbook',
    'Project dashboard'
  ], 8);

  requireAtLeast('book project model concepts', [
    'Project situation',
    'customer question or business need',
    'Jira tickets opened',
    'customer data requested',
    'consultant review and decision',
    'BC setup or process implementation',
    'Playwright/evidence validation',
    'UAT and customer acceptance',
    'training/handbook output'
  ], 8);

  requireAtLeast('ticket backlog anchors', [
    'BCPM-0001',
    'BCPM-0100',
    'BCPM-0200',
    'BCPM-0300',
    'BCPM-0400',
    'BCPM-0500',
    'BCPM-0600',
    'BCPM-1100',
    'BCPM-1200'
  ], 8);

  requireAtLeast('dashboard controls', [
    'Overall status',
    'Current milestone',
    'Workstream readiness',
    'Top open decisions',
    'Top active risks',
    'Next recommended work',
    'Update rule'
  ], 6);

  requireAtLeast('transition card fields', [
    'Current goal',
    'Current changed files',
    'Current active work',
    'Workstream mapping',
    'Epic mapping',
    'Issue type mapping',
    'Customer data impact',
    'Decision impact',
    'Risk impact',
    'UAT and training impact',
    'Book impact',
    'Playwright and evidence impact',
    'Next recommended project item',
    'What will not be touched'
  ], 12);

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

  requireAtLeast('case study core anchors', [
    'Company Story and Legal Entity Model',
    'Organization, Locations and Responsibility Model',
    'Environment, Company Context and Evidence Boundary',
    'Business Central Navigation and UI Baseline',
    'Company Information and Localization Inputs',
    'Book Opening, Training and UAT Frame',
    'DR-CORE-001',
    'DR-CORE-002',
    'UAT-CS-001',
    'TR-CS-001'
  ], 8);

  requireAtLeast('project story anchors', [
    'Mara Stein',
    'Jonas Weber',
    'Nora Becker',
    'Adrian Vogt',
    'Story promise',
    'SCENE-001',
    'SCENE-002',
    'SCENE-003',
    'BCPM-0100',
    'All named people are fictional characters'
  ], 7);

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
      ? 'Project template is usable as a local implementation planning anchor. Next refine WS04 Master Data/Product, while using WS02 and WS03 as the first detailed patterns.'
      : 'Fix the workbreakdown draft before using it as a planning anchor.'
};

console.log(JSON.stringify(output, null, 2));

if (errors.length) process.exitCode = 1;
