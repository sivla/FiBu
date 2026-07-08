import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  current: '.agent/state/current.json',
  caseFile: '.agent/state/cases/vat-posting-setup-readfirst.json',
  packageJson: 'package.json',
  spec: 'playwright/projects/fibu-book5/tests/vat-posting-setup-readfirst.spec.ts',
  foundationDecision: 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md'
};

function resolve(relativePath) {
  return path.resolve(root, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(resolve(relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function includesAll(text, phrases) {
  return phrases.every((phrase) => text.includes(phrase));
}

const errors = [];
const warnings = [];
const checkedFiles = [];

for (const [id, file] of Object.entries(files)) {
  if (!fs.existsSync(resolve(file))) {
    errors.push(`${id}: missing ${file}`);
  } else {
    checkedFiles.push(file);
  }
}

let current = null;
let caseJson = null;
let packageJson = null;
let spec = '';
let foundationDecision = '';

if (!errors.length) {
  current = readJson(files.current);
  caseJson = readJson(files.caseFile);
  packageJson = readJson(files.packageJson);
  spec = readText(files.spec);
  foundationDecision = readText(files.foundationDecision);
}

if (current) {
  if (current.instance !== 'playthru') errors.push(`${files.current}: instance must be playthru`);
  if (current.company !== 'UNIVERSAARL-DE') errors.push(`${files.current}: company must be UNIVERSAARL-DE`);
  if (current.nextCase !== 'VAT-POSTING-SETUP-READFIRST') {
    errors.push(`${files.current}: nextCase must be VAT-POSTING-SETUP-READFIRST`);
  }
  if (current.preparedNextCaseFile !== files.caseFile) {
    errors.push(`${files.current}: preparedNextCaseFile must point to ${files.caseFile}`);
  }
  const nextStep = current.nextStep ?? '';
  if (!nextStep.includes('read-first/no-write')) {
    errors.push(`${files.current}: nextStep must preserve read-first/no-write boundary`);
  }
  if (!nextStep.includes('multi-step screenshot chain')) {
    errors.push(`${files.current}: nextStep must require multi-step screenshot chain`);
  }
}

if (caseJson) {
  if (caseJson.caseId !== 'VAT-POSTING-SETUP-READFIRST') {
    errors.push(`${files.caseFile}: caseId must be VAT-POSTING-SETUP-READFIRST`);
  }
  if (caseJson.status !== 'ready-next') errors.push(`${files.caseFile}: status must be ready-next`);
  if (caseJson.instance !== 'playthru') errors.push(`${files.caseFile}: instance must be playthru`);
  if (caseJson.company !== 'UNIVERSAARL-DE') errors.push(`${files.caseFile}: company must be UNIVERSAARL-DE`);
  const allowed = caseJson.allowedActions ?? [];
  for (const action of [
    'open-vat-business-posting-groups-readonly',
    'open-vat-product-posting-groups-readonly',
    'open-vat-posting-setup-readonly',
    'capture-screenshot-qa'
  ]) {
    if (!allowed.includes(action)) errors.push(`${files.caseFile}: allowedActions missing ${action}`);
  }
  const forbidden = caseJson.forbiddenActions ?? [];
  for (const action of [
    'change-vat-setup',
    'change-posting-setup',
    'create-sales-document',
    'create-purchase-document',
    'preview-posting',
    'post',
    'payment',
    'api-shortcut',
    'company-switch',
    'use-confidential-real-customer-data',
    'force-click-as-normal-route',
    'coordinate-click-without-diagnostic-status'
  ]) {
    if (!forbidden.includes(action)) errors.push(`${files.caseFile}: forbiddenActions missing ${action}`);
  }
  const expectedEvidence = (caseJson.expectedEvidence ?? []).join('\n');
  if (!expectedEvidence.includes('VAT Business Posting Groups')) {
    errors.push(`${files.caseFile}: expectedEvidence must include VAT Business Posting Groups`);
  }
  if (!expectedEvidence.includes('VAT Product Posting Groups')) {
    errors.push(`${files.caseFile}: expectedEvidence must include VAT Product Posting Groups`);
  }
  if (!expectedEvidence.includes('VAT Posting Setup')) {
    errors.push(`${files.caseFile}: expectedEvidence must include VAT Posting Setup`);
  }
  if (!expectedEvidence.includes('no-write flags')) {
    errors.push(`${files.caseFile}: expectedEvidence must require no-write flags`);
  }
  if (caseJson.nextCaseIfBlocked !== 'VAT-POSTING-SETUP-ROUTE-RECOVERY') {
    errors.push(`${files.caseFile}: nextCaseIfBlocked must route to VAT-POSTING-SETUP-ROUTE-RECOVERY`);
  }
}

if (packageJson) {
  const expectedScript = 'playwright test playwright/projects/fibu-book5/tests/vat-posting-setup-readfirst.spec.ts';
  if (packageJson.scripts?.['fibu:target:vat-posting-setup-readfirst'] !== expectedScript) {
    errors.push(`${files.packageJson}: missing or changed fibu:target:vat-posting-setup-readfirst script`);
  }
}

if (spec) {
  const requiredSpecSignals = [
    "const CASE_ID = 'VAT-POSTING-SETUP-READFIRST'",
    "const EXPECTED_INSTANCE = 'playthru'",
    "const TARGET_COMPANY = 'UNIVERSAARL-DE'",
    "storageState: 'playwright/.auth/bc-user.json'",
    "pageId: 470",
    "pageId: 471",
    "pageId: 472",
    'MwSt.-Geschaeftsbuchungsgruppen / VAT Business Posting Groups',
    'MwSt.-Produktbuchungsgruppen / VAT Product Posting Groups',
    'MwSt.-Buchungsmatrix / VAT Posting Setup',
    'setupChanged: false',
    'masterDataChanged: false',
    'draftCreated: false',
    'previewPosting: false',
    'posted: false',
    'payment: false',
    'apiShortcut: false',
    'companySwitch: false',
    'confidentialRealCustomerDataUsed: false',
    'noWrite: true',
    'noPost: true',
    'noPreview: true',
    'noDraft: true',
    'noSetupChange: true',
    'noMasterDataChange: true',
    'No New/Neu action clicked.',
    'No Edit/List Edit action clicked.',
    'No VAT setup changed.',
    'No Preview Posting.',
    'No Posting.',
    'No confidential real customer data used.'
  ];
  for (const signal of requiredSpecSignals) {
    if (!spec.includes(signal)) errors.push(`${files.spec}: missing "${signal}"`);
  }
  if (!/screenshotQa:\s*\{[\s\S]*acceptedAsProof:\s*status === 'observed'/.test(spec)) {
    errors.push(`${files.spec}: screenshot metadata must include acceptedAsProof tied to observed status`);
  }
  if (!/resultStatus\s*=\s*blocked\.length > 0 \? 'blocked'/.test(spec)) {
    errors.push(`${files.spec}: resultStatus must prefer blocked when a VAT page is unsafe`);
  }
  if (!/nextCase\s*=\s*resultStatus === 'observed' \? 'POSTING-GROUPS-SETUP-READFIRST'/.test(spec)) {
    errors.push(`${files.spec}: observed result must hand off to POSTING-GROUPS-SETUP-READFIRST`);
  }
  if (!spec.includes("'VAT-POSTING-SETUP-ROUTE-RECOVERY'")) {
    errors.push(`${files.spec}: blocked/rejected result must hand off to VAT-POSTING-SETUP-ROUTE-RECOVERY`);
  }
}

if (foundationDecision) {
  const requiredDecisionSignals = [
    'VAT-/Posting-Boundaries',
    'Master Data bleibt nur training-/handbook-ready',
    'keine UI-Mockups',
    'keine vertraulichen echten Kundendaten',
    'Ein einzelner End-Screenshot reicht'
  ];
  if (!includesAll(foundationDecision, requiredDecisionSignals)) {
    errors.push(`${files.foundationDecision}: missing current VAT/Foundation boundary language`);
  }
}

const output = {
  schemaVersion: 1,
  purpose: 'vat-posting-setup-readfirst-check',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles,
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'VAT-POSTING-SETUP-READFIRST is locally prepared as a read-first/no-write pilot.'
      : 'Fix VAT-POSTING-SETUP-READFIRST before using it as the next live pilot.'
};

console.log(JSON.stringify(output, null, 2));
if (errors.length) process.exitCode = 1;
