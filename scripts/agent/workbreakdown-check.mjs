import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  readme: '.agent/project-template/README.md',
  projectPlan: '.agent/project-template/PROJECT-PLAN-DRAFT.md',
  realCustomerOnboarding: '.agent/project-template/REAL-CUSTOMER-ONBOARDING-AND-PROJECT-SETUP-GUIDE-DRAFT.md',
  bookProjectModel: '.agent/project-template/BOOK-AS-PROJECT-MANAGEMENT-MODEL.md',
  bookProjectBacklog: '.agent/project-template/BOOK-PROJECT-TICKET-BACKLOG-DRAFT.md',
  projectCast: '.agent/project-template/PROJECT-CAST-AND-STAKEHOLDERS-DRAFT.md',
  projectStoryline: '.agent/project-template/PROJECT-STORYLINE-DRAFT.md',
  projectSceneCards: '.agent/project-template/PROJECT-SCENE-CARDS-DRAFT.md',
  trainingStrategy: '.agent/project-template/TRAINING-STRATEGY-AND-CURRICULUM-DRAFT.md',
  roleTrainingMatrix: '.agent/project-template/ROLE-BASED-TRAINING-MATRIX-DRAFT.md',
  trainingModuleCards: '.agent/project-template/TRAINING-MODULE-CARDS-DRAFT.md',
  playwrightTrainingEvidenceMap: '.agent/project-template/PLAYWRIGHT-TRAINING-EVIDENCE-MAP-DRAFT.md',
  playwrightScenarioCatalogWs02Ws03Ws04: '.agent/project-template/PLAYWRIGHT-SCENARIO-CATALOG-WS02-WS03-WS04-DRAFT.md',
  realismStandard: '.agent/project-template/REALISM-STANDARD-DRAFT.md',
  dataRequestRealismReview: '.agent/project-template/REALISM-REVIEW-DATA-REQUESTS-2026-07-05.md',
  specDrivenSideproject: '.agent/project-template/SPEC-DRIVEN-SIDEPROJECT-DRAFT.md',
  bcSpecPilot: '.agent/project-template/BCSPEC-PILOT-001-MASTER-DATA-PRODUCT-TRAINING.md',
  customerDataSimulation: '.agent/project-template/CUSTOMER-DATA-SIMULATION-DRAFT.md',
  simulatedDataTablesCoreMd: '.agent/project-template/SIMULATED-DATA-TABLES-CORE-MD-DRAFT.md',
  routeDecisionCardsFoundationMasterData: '.agent/project-template/ROUTE-DECISION-CARDS-FOUNDATION-MASTER-DATA-DRAFT.md',
  workbreakdown: '.agent/project-template/BC-IMPLEMENTATION-WORKBREAKDOWN-DRAFT.md',
  jiraModel: '.agent/project-template/JIRA-WORK-ITEM-MODEL.md',
  cadence: '.agent/project-template/DOCUMENTATION-CADENCE.md',
  artifactTemplates: '.agent/project-template/PROJECT-ARTIFACT-TEMPLATES.md',
  customerDataCatalog: '.agent/project-template/CUSTOMER-DATA-CATALOG-DRAFT.md',
  dataRequestJiraCandidates: '.agent/project-template/DATA-REQUEST-JIRA-CANDIDATES-DRAFT.md',
  decisionLog: '.agent/project-template/DECISION-LOG-DRAFT.md',
  riskRegister: '.agent/project-template/RISK-REGISTER-DRAFT.md',
  projectDashboard: '.agent/project-template/PROJECT-DASHBOARD-DRAFT.md',
  transitionProtocol: '.agent/project-template/GOAL-TRANSITION-PROTOCOL.md',
  transitionCard: '.agent/project-template/GOAL-TRANSITION-CARD-2026-07-05.md',
  refinementBacklog: '.agent/project-template/REFINEMENT-BACKLOG.md',
  caseStudyCoreDraft: '.agent/project-template/WORKSTREAM-02-CASE-STUDY-CORE-JIRA-DRAFT.md',
  financeFoundationDraft: '.agent/project-template/WORKSTREAM-03-FINANCE-FOUNDATION-JIRA-DRAFT.md',
  masterDataProductDraft: '.agent/project-template/WORKSTREAM-04-MASTER-DATA-PRODUCT-JIRA-DRAFT.md'
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
    'Real Customer Onboarding and Project Setup Guide Draft',
    'Book as Project Management Model',
    'Book Project Ticket Backlog Draft',
    'Project Cast and Stakeholders Draft',
    'Project Storyline Draft',
    'Project Scene Cards Draft',
    'Training Strategy and Curriculum Draft',
    'Role-Based Training Matrix Draft',
    'Training Module Cards Draft',
    'Playwright Training Evidence Map Draft',
    'Playwright Scenario Catalog - WS02/WS03/WS04 Draft',
    'Realism Standard Draft',
    'Realism Review - Data Requests 2026-07-05',
    'Spec-Driven Sideproject Draft',
    'BCSpec Pilot 001: Master Data Product Training and Evidence',
    'Customer Data Simulation Draft',
    'Simulated Data Tables - Core and Master Data Draft',
    'Route Decision Cards - Foundation and Master Data Draft',
    'Business Central Implementation Workbreakdown Draft',
    'Jira Work Item Model',
    'Documentation Cadence',
    'Project Artifact Templates',
    'Customer Data Catalog Draft',
    'Data Request Jira Candidates Draft',
    'Decision Log Draft',
    'Risk Register Draft',
    'Project Dashboard Draft',
    'Goal Transition Protocol',
    'Goal Transition Card - 2026-07-05',
    'Project Template Refinement Backlog',
    'WS02 Case Study Core Jira Draft',
    'WS03 Finance Foundation Jira Draft',
    'WS04 Master Data Product Jira Draft',
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
    'Data request Jira candidates',
    'Data request realism review',
    'Simulated core/master data tables',
    'Foundation/master-data route decisions',
    'Read-first WS02/WS03/WS04 scenario catalog',
    'WORKSTREAM-02-CASE-STUDY-CORE-JIRA-DRAFT.md',
    'Epic CS-01: Company Story and Legal Entity Model',
    'Epic CS-02: Organization, Locations and Responsibility Model',
    'Epic CS-03: Environment, Company Context and Evidence Boundary',
    'WORKSTREAM-04-MASTER-DATA-PRODUCT-JIRA-DRAFT.md',
    'DATA-REQUEST-JIRA-CANDIDATES-DRAFT.md',
    'Epic MD-01: Customer Master Data',
    'Epic MD-02: Vendor Master Data',
    'Epic MD-03: Product Model, Items, Services and Non-Inventory Items',
    'Epic FF-01: General Ledger Setup and Accounting Periods',
    'Epic FF-02: Chart of Accounts and Account Categories',
    'Epic FF-03: Posting Groups and Posting Setup',
    'Epic FF-04: VAT/USt Setup',
    'Workstream-level Playwright scenarios',
    'Workstream-level book outputs',
    'Real customer operating model',
    'Confluence is the customer-visible knowledge layer',
    'Jira is the operational control layer',
    'GitHub is the technical workbench',
    'Business Central `playthru` is the only practical sandbox',
    'Do not create a dedicated `Spec Change` issue type',
    'Confluence explains intent'
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

  requireAtLeast('master data product anchors', [
    'Customer Master Data',
    'Vendor Master Data',
    'Product Model, Items, Services and Non-Inventory Items',
    'Templates, Configuration Packages and Data Quality',
    'Route matrix',
    'DR-MD-001',
    'DR-MD-002',
    'DR-MD-003',
    'Customer owner',
    'Internal owner',
    'Validation rules',
    'Dependencies',
    'BC usage',
    'Jira issue type: `Data Request`',
    'UAT-MD-001',
    'TR-MD-001',
    'configuration package',
    'Excel import'
  ], 10);

  requireAtLeast('training and realism anchors', [
    'Training Strategy and Curriculum Draft',
    'Role-Based Training Matrix Draft',
    'Training Module Cards Draft',
    'Playwright Training Evidence Map Draft',
    'Realism Standard Draft',
    'BCSpec',
    'OpenSpec',
    'role-based',
    'training-ready',
    'evidence-needed',
    'TR-00-02 Environment, Company and Evidence Boundary',
    'TR-01-01 Role Center and Navigation',
    'TR-02-01 Chart of Accounts',
    'TR-02-02 Posting Groups',
    'Would a serious Business Central consultant',
    'RISK-011',
    'DEC-009'
  ], 12);

  requireAtLeast('spec-driven sideproject anchors', [
    'Spec-Driven Sideproject Draft',
    'BCSpec Pilot 001',
    'REQ-001 Master data must be taught as business ownership',
    'REQ-002 Bulk setup routes must be considered before manual mass entry',
    'proposal',
    'requirements',
    'design',
    'tasks',
    'customer data requests',
    'Playwright evidence planning',
    'book curation'
  ], 8);

  requireAtLeast('real customer onboarding anchors', [
    'Real Customer Onboarding and Project Setup Guide Draft',
    'Confluence structure',
    'Jira setup',
    'Spec-driven without tool theater',
    'Business Central environment setup',
    'Customer onboarding kickoff',
    'Discovery and fit-to-standard',
    'Blueprint and route approval',
    'UAT and training',
    'Cutover, go-live and hypercare',
    'Do not introduce a new Jira issue type for specs'
  ], 9);

  requireAtLeast('data request realism review anchors', [
    'Realism Review - Data Requests 2026-07-05',
    'DR-CORE-001',
    'DR-CORE-002',
    'DR-MD-001',
    'DR-MD-002',
    'DR-MD-003',
    'Ready for Jira candidate',
    'Ready for BC setup',
    'planning-ready but not BC-setup-ready',
    'simulated data tables',
    'tax-review boundary',
    'configuration-package route decision'
  ], 10);

  requireAtLeast('package-derived jira ticket anchors', [
    'Package-derived Jira ticket map',
    'DR-CORE-COMPANY-001',
    'DEC-CORE-TAX-001',
    'DR-CORE-ORG-001',
    'DEC-ORG-DIM-001',
    'DEC-ORG-LOC-001',
    'DR-MD-CUST-001',
    'DR-MD-VEND-001',
    'DEC-PAYMENT-001',
    'DR-MD-ITEM-001',
    'DEC-MD-UOM-001',
    'DEC-MD-PRODUCT-001',
    'Dependency queue from the five packages',
    'TASK-PWS-CORE-001',
    'TASK-PWS-MD-001',
    'TASK-PWS-MD-002',
    'TASK-PWS-MD-003',
    'DEC-MD-NUM-001',
    'DEC-FF-POSTING-001',
    'DEC-FF-VAT-001'
  ], 16);

  requireAtLeast('simulated core master data anchors', [
    'Simulated Data Tables - Core and Master Data Draft',
    'UNIVERSAARL_CORE_CompanyInformation',
    'UNIVERSAARL_CORE_OrganizationModel',
    'UNIVERSAARL_MD_Customers',
    'UNIVERSAARL_MD_Vendors',
    'UNIVERSAARL_MD_ItemsServices',
    'Record ID',
    'Business purpose',
    'Customer owner',
    'Internal owner',
    'Required fields',
    'Optional fields',
    'Validation rules',
    'Dependency status',
    'BC setup readiness',
    'Route candidate',
    'UAT impact',
    'Training impact',
    'Playwright evidence need',
    'Open questions',
    'Risk if missing or wrong',
    'Next action',
    'jira-ready',
    'blocked',
    'parked',
    'not import files'
  ], 22);

  requireAtLeast('foundation route decision anchors', [
    'Route Decision Cards - Foundation and Master Data Draft',
    'RD-FOUND-001 Numbering policy',
    'RD-FOUND-002 Posting group model',
    'RD-FOUND-003 Payment terms and payment method route',
    'RD-FOUND-004 Product setup route',
    'Numbering policy',
    'Posting groups',
    'Payment terms',
    'Units of measure',
    'configuration package',
    'read-first proof',
    'gated setup',
    'DEC-013'
  ], 11);

  requireAtLeast('playwright scenario catalog anchors', [
    'Playwright Scenario Catalog - WS02/WS03/WS04 Draft',
    'PWS-CORE-001 Company context proof',
    'PWS-CORE-002 Navigation and page-type read-only proof',
    'PWS-FF-001 Number series read-first context',
    'PWS-FF-002 Posting group pages read-first proof',
    'PWS-FF-003 Payment terms read-first proof',
    'PWS-MD-001 Customer card/list read-first proof',
    'PWS-MD-002 Vendor card/list read-first proof',
    'PWS-MD-003 Item/service/non-inventory read-first proof',
    'PWS-MD-004 Configuration package/import route read-first proof',
    'No `New`, `Edit`, `Delete`, `Post`, `Preview Posting`',
    'company/environment proof'
  ], 10);

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
      ? 'Project template is usable as a local implementation planning anchor. Next turn the package-derived Jira ticket map into import-ready Jira rows or project tickets.'
      : 'Fix the workbreakdown draft before using it as a planning anchor.'
};

console.log(JSON.stringify(output, null, 2));

if (errors.length) process.exitCode = 1;
