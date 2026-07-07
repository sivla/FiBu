import { existsSync, readFileSync } from 'node:fs';

const ACTIVE_CASE = 'CUSTOMER-SETUP-VALUE-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const casePath = '.agent/state/cases/customer-setup-value-write-gate.json';
const resultPath = 'playwright/projects/fibu-book5/evidence/customer-payment-terms-write-gate/result.json';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const blockedBy = [];

if (!existsSync(casePath)) blockedBy.push('customer-setup-value-write-gate-case-file-missing');
if (!existsSync(resultPath)) blockedBy.push('payment-terms-write-gate-result-missing');

let caseFile = null;
let paymentTermsResult = null;

if (existsSync(casePath)) {
  try {
    caseFile = readJson(casePath);
  } catch {
    blockedBy.push('customer-setup-value-write-gate-case-file-invalid-json');
  }
}

if (existsSync(resultPath)) {
  try {
    paymentTermsResult = readJson(resultPath);
  } catch {
    blockedBy.push('payment-terms-write-gate-result-invalid-json');
  }
}

if (caseFile) {
  if (caseFile.caseId !== ACTIVE_CASE) blockedBy.push('case-id-mismatch');
  if (caseFile.instance !== EXPECTED_INSTANCE) blockedBy.push('case-instance-mismatch');
  if (caseFile.company !== TARGET_COMPANY) blockedBy.push('case-company-mismatch');
  if (caseFile.selectedValues?.paymentTermsCode !== 'NET30') blockedBy.push('payment-terms-code-not-net30');
  if (caseFile.selectedValues?.customerPostingGroup !== 'INLAND') blockedBy.push('customer-posting-group-not-inland');
  if (caseFile.selectedValues?.genBusinessPostingGroup !== 'INLAND') blockedBy.push('gen-business-posting-group-not-inland');
}

if (paymentTermsResult) {
  if (paymentTermsResult.resultStatus !== 'observed-setup-written' && paymentTermsResult.resultStatus !== 'observed-already-existed') {
    blockedBy.push('payment-terms-result-not-observed');
  }
  if (paymentTermsResult.instance !== EXPECTED_INSTANCE) blockedBy.push('payment-terms-instance-mismatch');
  if (paymentTermsResult.company !== TARGET_COMPANY) blockedBy.push('payment-terms-company-mismatch');
  if (paymentTermsResult.safeToFinalizeState !== true) blockedBy.push('payment-terms-not-safe-to-finalize');
  if (paymentTermsResult.requiresReview === true) blockedBy.push('payment-terms-requires-review');
  const provedText = JSON.stringify(paymentTermsResult.proved ?? []);
  if (!/NET30/i.test(provedText) || !/30 Tage netto/i.test(provedText)) blockedBy.push('payment-terms-proof-missing-net30-text');
}

console.log(
  JSON.stringify(
    {
      schemaVersion: 1,
      purpose: 'customer-setup-value-write-gate-check',
      caseId: ACTIVE_CASE,
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: TARGET_COMPANY,
      casePath,
      paymentTermsResultPath: resultPath,
      canPrepareNextLiveRun: blockedBy.length === 0,
      liveActionsExecuted: false,
      businessCentralOpened: false,
      playwrightLiveRunExecuted: false,
      blockedBy
    },
    null,
    2
  )
);

process.exit(blockedBy.length === 0 ? 0 : 2);
