import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const scriptPath = path.resolve(root, 'scripts/agent/foundation-readiness-decision.mjs');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'foundation-readiness-decision-'));
const inputPath = path.join(tempDir, 'TARGET-075-result.json');
const outputPath = path.join(tempDir, 'FOUNDATION-READINESS-DECISION.md');
const blockedInputPath = path.join(tempDir, 'TARGET-075-blocked-result.json');
const blockedOutputPath = path.join(tempDir, 'FOUNDATION-READINESS-BLOCKED.md');
const incompleteSetupInputPath = path.join(tempDir, 'TARGET-075-incomplete-setup-result.json');
const incompleteSetupOutputPath = path.join(tempDir, 'FOUNDATION-READINESS-INCOMPLETE-SETUP.md');
const rejectedPageInputPath = path.join(tempDir, 'TARGET-075-rejected-page-result.json');
const rejectedPageOutputPath = path.join(tempDir, 'FOUNDATION-READINESS-REJECTED-PAGE.md');
const incompleteEvidenceListInputPath = path.join(tempDir, 'TARGET-075-incomplete-evidence-list-result.json');
const incompleteEvidenceListOutputPath = path.join(tempDir, 'FOUNDATION-READINESS-INCOMPLETE-EVIDENCE-LIST.md');
const missingAuthTargetInputPath = path.join(tempDir, 'TARGET-075-missing-auth-target-result.json');
const missingAuthTargetOutputPath = path.join(tempDir, 'FOUNDATION-READINESS-MISSING-AUTH-TARGET.md');

const fixture = {
  schemaVersion: 1,
  caseId: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
  source: 'selftest-fixture',
  resultStatus: 'observed',
  instance: 'playthru',
  company: 'UNIVERSAARL-DE',
  nextCase: 'FOUNDATION-READINESS-DECISION',
  setupChanged: false,
  masterDataChanged: false,
  draftCreated: false,
  previewPosting: false,
  posted: false,
  payment: false,
  apiShortcut: false,
  authGate: {
    checkedByGuard: true,
    secretsPrinted: false,
    doctorDecision: 'stored-auth-usable-but-live-gate-blocked',
    doctorLiveGate: { businessCentralLiveAllowed: false, playwrightLiveAllowed: false },
    authTarget: {
      targetEnvironment: 'playthru',
      targetCompany: 'UNIVERSAARL-DE',
      sourceDiffersFromTarget: true,
      targetBuiltFromCurrentState: true,
      targetMatchesState: true
    }
  },
  executionGate: {
    runnerGuardChecked: true,
    liveApproved: true,
    freezeActiveAtRunner: false,
    freezeOverrideUsed: false
  },
  proved: ['Chart of Accounts was visible read-only.'],
  notProved: ['Posting readiness was not proven.'],
  blockedBy: [],
  warnings: [],
  screenshots: [
    'target-075-chart-of-accounts.png',
    'target-075-general-business-posting-groups.png',
    'target-075-general-product-posting-groups.png',
    'target-075-general-posting-setup.png',
    'target-075-vat-posting-setup.png'
  ],
  pages: [
    {
      id: 'chart-of-accounts',
      status: 'observed',
      textFile: 'target-075-chart-of-accounts.txt',
      screenshot: 'target-075-chart-of-accounts.png',
      screenshotMetadata: 'target-075-chart-of-accounts.screenshot.json'
    },
    {
      id: 'general-business-posting-groups',
      status: 'observed',
      textFile: 'target-075-general-business-posting-groups.txt',
      screenshot: 'target-075-general-business-posting-groups.png',
      screenshotMetadata: 'target-075-general-business-posting-groups.screenshot.json'
    },
    {
      id: 'general-product-posting-groups',
      status: 'observed',
      textFile: 'target-075-general-product-posting-groups.txt',
      screenshot: 'target-075-general-product-posting-groups.png',
      screenshotMetadata: 'target-075-general-product-posting-groups.screenshot.json'
    },
    {
      id: 'general-posting-setup',
      status: 'observed',
      textFile: 'target-075-general-posting-setup.txt',
      screenshot: 'target-075-general-posting-setup.png',
      screenshotMetadata: 'target-075-general-posting-setup.screenshot.json'
    },
    {
      id: 'vat-posting-setup',
      status: 'observed',
      textFile: 'target-075-vat-posting-setup.txt',
      screenshot: 'target-075-vat-posting-setup.png',
      screenshotMetadata: 'target-075-vat-posting-setup.screenshot.json'
    }
  ],
  evidenceRefs: [
    'TARGET-075-result.json',
    'README.md',
    'target-075-chart-of-accounts.txt',
    'target-075-chart-of-accounts.png',
    'target-075-chart-of-accounts.screenshot.json',
    'target-075-general-business-posting-groups.txt',
    'target-075-general-business-posting-groups.png',
    'target-075-general-business-posting-groups.screenshot.json',
    'target-075-general-product-posting-groups.txt',
    'target-075-general-product-posting-groups.png',
    'target-075-general-product-posting-groups.screenshot.json',
    'target-075-general-posting-setup.txt',
    'target-075-general-posting-setup.png',
    'target-075-general-posting-setup.screenshot.json',
    'target-075-vat-posting-setup.txt',
    'target-075-vat-posting-setup.png',
    'target-075-vat-posting-setup.screenshot.json'
  ],
  changedFiles: [
    'TARGET-075-result.json',
    'README.md',
    'target-075-chart-of-accounts.txt',
    'target-075-chart-of-accounts.png',
    'target-075-chart-of-accounts.screenshot.json',
    'target-075-general-business-posting-groups.txt',
    'target-075-general-business-posting-groups.png',
    'target-075-general-business-posting-groups.screenshot.json',
    'target-075-general-product-posting-groups.txt',
    'target-075-general-product-posting-groups.png',
    'target-075-general-product-posting-groups.screenshot.json',
    'target-075-general-posting-setup.txt',
    'target-075-general-posting-setup.png',
    'target-075-general-posting-setup.screenshot.json',
    'target-075-vat-posting-setup.txt',
    'target-075-vat-posting-setup.png',
    'target-075-vat-posting-setup.screenshot.json'
  ],
  foundationReadinessInput: {
    decisionStatus: 'ready-for-foundation-readiness-decision',
    chartOfAccounts: {
      status: 'observed',
      starterAccountsVisible: ['1200', '3300', '3806', '4400', '5400'],
      starterAccountsMissingOrUnclear: [],
      bookBoundary: 'Selftest fixture only.'
    },
    setupContext: {
      generalBusinessPostingGroups: 'observed',
      generalProductPostingGroups: 'observed',
      generalPostingSetup: 'observed',
      vatPostingSetup: 'observed',
      bookBoundary: 'Selftest fixture only.'
    },
    nextProjectOutputs: ['Create the real Foundation Readiness Decision from real TARGET-075 evidence.'],
    uatTrainingImpact: ['Supports a Foundation checkpoint exercise.']
  }
};

fs.writeFileSync(inputPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
fs.writeFileSync(
  blockedInputPath,
  `${JSON.stringify(
    {
      ...fixture,
      resultStatus: 'partially-completed',
      blockedBy: ['VAT Posting Setup was rejected in compact evidence.'],
      warnings: ['Edit action text was visible but not clicked.'],
      foundationReadinessInput: {
        ...fixture.foundationReadinessInput,
        decisionStatus: 'needs-local-review-before-foundation-readiness-decision',
        chartOfAccounts: {
          ...fixture.foundationReadinessInput.chartOfAccounts,
          starterAccountsVisible: ['1200', '3300'],
          starterAccountsMissingOrUnclear: ['3806', '4400', '5400']
        },
        setupContext: {
          ...fixture.foundationReadinessInput.setupContext,
          generalPostingSetup: 'rejected',
          vatPostingSetup: 'blocked'
        }
      }
    },
    null,
    2
  )}\n`,
  'utf8'
);

const missingAuthTargetFixture = JSON.parse(JSON.stringify(fixture));
delete missingAuthTargetFixture.authGate.authTarget;
fs.writeFileSync(missingAuthTargetInputPath, `${JSON.stringify(missingAuthTargetFixture, null, 2)}\n`, 'utf8');

const incompleteSetupFixture = JSON.parse(JSON.stringify(fixture));
incompleteSetupFixture.foundationReadinessInput.setupContext.generalBusinessPostingGroups = 'blocked';
incompleteSetupFixture.foundationReadinessInput.setupContext.generalProductPostingGroups = 'observed';
incompleteSetupFixture.foundationReadinessInput.setupContext.generalPostingSetup = 'observed';
incompleteSetupFixture.foundationReadinessInput.setupContext.vatPostingSetup = 'observed';
fs.writeFileSync(incompleteSetupInputPath, `${JSON.stringify(incompleteSetupFixture, null, 2)}\n`, 'utf8');

const rejectedPageFixture = JSON.parse(JSON.stringify(fixture));
rejectedPageFixture.pages[2].status = 'rejected';
fs.writeFileSync(rejectedPageInputPath, `${JSON.stringify(rejectedPageFixture, null, 2)}\n`, 'utf8');

const incompleteEvidenceListFixture = JSON.parse(JSON.stringify(fixture));
incompleteEvidenceListFixture.changedFiles = incompleteEvidenceListFixture.changedFiles.filter(
  (entry) => entry !== 'target-075-vat-posting-setup.screenshot.json'
);
fs.writeFileSync(incompleteEvidenceListInputPath, `${JSON.stringify(incompleteEvidenceListFixture, null, 2)}\n`, 'utf8');

const missingScreenshotMetadataFixture = JSON.parse(JSON.stringify(fixture));
delete missingScreenshotMetadataFixture.pages[0].screenshotMetadata;
const missingScreenshotMetadataInputPath = path.join(tempDir, 'TARGET-075-missing-screenshot-metadata-result.json');
const missingScreenshotMetadataOutputPath = path.join(tempDir, 'FOUNDATION-READINESS-MISSING-SCREENSHOT-METADATA.md');
fs.writeFileSync(missingScreenshotMetadataInputPath, `${JSON.stringify(missingScreenshotMetadataFixture, null, 2)}\n`, 'utf8');

function run(args) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 5 * 1024 * 1024
  });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    // Keep parsed null; the assertion below will report stdout/stderr.
  }
  return { ...result, parsed };
}

const check = run([`--input=${inputPath}`, `--output=${outputPath}`, '--check']);

const errors = [];
if (check.status !== 0) errors.push(`check mode exited ${check.status}: ${check.stderr || check.stdout}`);
if (check.parsed?.canWrite !== true) errors.push('check mode should validate the fixture as writable.');
if (fs.existsSync(outputPath) && check.parsed?.wroteFile !== true) {
  errors.push('check mode must not write the output file.');
}

const write = run([`--input=${inputPath}`, `--output=${outputPath}`, '--write']);

if (write.status !== 0) errors.push(`write mode exited ${write.status}: ${write.stderr || write.stdout}`);
if (write.parsed?.wroteFile !== true) errors.push('write mode should report wroteFile=true.');
if (!fs.existsSync(outputPath)) errors.push('write mode did not create FOUNDATION-READINESS-DECISION.md.');

const blockedWrite = run([`--input=${blockedInputPath}`, `--output=${blockedOutputPath}`, '--write']);

if (blockedWrite.status !== 0) errors.push(`blocked write mode exited ${blockedWrite.status}: ${blockedWrite.stderr || blockedWrite.stdout}`);
if (blockedWrite.parsed?.wroteFile !== true) errors.push('blocked write mode should still write a parked decision file.');
if (!fs.existsSync(blockedOutputPath)) errors.push('blocked write mode did not create a decision output.');

const missingAuthTargetWrite = run([`--input=${missingAuthTargetInputPath}`, `--output=${missingAuthTargetOutputPath}`, '--write']);

if (missingAuthTargetWrite.status === 0) errors.push('missing authTarget write mode must fail.');
if (missingAuthTargetWrite.parsed?.canWrite !== false) errors.push('missing authTarget fixture must not be writable.');
if (!missingAuthTargetWrite.parsed?.errors?.includes('authGate.authTarget is required.')) {
  errors.push('missing authTarget fixture must report authGate.authTarget is required.');
}
if (fs.existsSync(missingAuthTargetOutputPath)) {
  errors.push('missing authTarget fixture must not write a Foundation decision output.');
}

const incompleteSetupWrite = run([`--input=${incompleteSetupInputPath}`, `--output=${incompleteSetupOutputPath}`, '--write']);

if (incompleteSetupWrite.status !== 0) errors.push(`incomplete setup write mode exited ${incompleteSetupWrite.status}.`);
if (incompleteSetupWrite.parsed?.wroteFile !== true) errors.push('incomplete setup fixture should write a parked decision file.');
const incompleteSetupOutput = fs.existsSync(incompleteSetupOutputPath) ? fs.readFileSync(incompleteSetupOutputPath, 'utf8') : '';
if (!incompleteSetupOutput.includes('Master Data bleibt geparkt')) {
  errors.push('incomplete setup fixture must keep Master Data parked.');
}
if (/Master Data kann als naechster Block vorbereitet werden/.test(incompleteSetupOutput)) {
  errors.push('incomplete setup fixture must not allow Master Data preparation.');
}

const rejectedPageWrite = run([`--input=${rejectedPageInputPath}`, `--output=${rejectedPageOutputPath}`, '--write']);

if (rejectedPageWrite.status !== 0) errors.push(`rejected page write mode exited ${rejectedPageWrite.status}.`);
if (rejectedPageWrite.parsed?.wroteFile !== true) errors.push('rejected page fixture should write a parked decision file.');
const rejectedPageOutput = fs.existsSync(rejectedPageOutputPath) ? fs.readFileSync(rejectedPageOutputPath, 'utf8') : '';
if (!rejectedPageOutput.includes('Master Data bleibt geparkt')) {
  errors.push('rejected page fixture must keep Master Data parked.');
}
if (/Master Data kann als naechster Block vorbereitet werden/.test(rejectedPageOutput)) {
  errors.push('rejected page fixture must not allow Master Data preparation.');
}

const incompleteEvidenceListWrite = run([
  `--input=${incompleteEvidenceListInputPath}`,
  `--output=${incompleteEvidenceListOutputPath}`,
  '--write'
]);

if (incompleteEvidenceListWrite.status === 0) errors.push('incomplete evidence list write mode must fail.');
if (incompleteEvidenceListWrite.parsed?.canWrite !== false) errors.push('incomplete evidence list fixture must not be writable.');
if (
  !incompleteEvidenceListWrite.parsed?.errors?.includes(
    'TARGET-075 changedFiles is missing evidence file target-075-vat-posting-setup.screenshot.json.'
  )
) {
  errors.push('incomplete evidence list fixture must report the missing changedFiles evidence file.');
}
if (fs.existsSync(incompleteEvidenceListOutputPath)) {
  errors.push('incomplete evidence list fixture must not write a Foundation decision output.');
}

const missingScreenshotMetadataWrite = run([
  `--input=${missingScreenshotMetadataInputPath}`,
  `--output=${missingScreenshotMetadataOutputPath}`,
  '--write'
]);

if (missingScreenshotMetadataWrite.status === 0) errors.push('missing screenshot metadata write mode must fail.');
if (missingScreenshotMetadataWrite.parsed?.canWrite !== false) {
  errors.push('missing screenshot metadata fixture must not be writable.');
}
if (
  !missingScreenshotMetadataWrite.parsed?.errors?.includes(
    'TARGET-075 page evidence chart-of-accounts is missing screenshotMetadata.'
  )
) {
  errors.push('missing screenshot metadata fixture must report the missing screenshotMetadata.');
}
if (fs.existsSync(missingScreenshotMetadataOutputPath)) {
  errors.push('missing screenshot metadata fixture must not write a Foundation decision output.');
}

const output = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
for (const phrase of [
  '# FOUNDATION-READINESS-DECISION',
  'Instanz: playthru',
  'Company: UNIVERSAARL-DE',
  'Auth-Ziel: playthru / UNIVERSAARL-DE',
  'Auth-Ziel passt zum State: ja',
  'No-Write-Grenze aus TARGET-075',
  'Master Data kann als naechster Block vorbereitet werden'
]) {
  if (!output.includes(phrase)) errors.push(`output is missing phrase: ${phrase}`);
}

const blockedOutput = fs.existsSync(blockedOutputPath) ? fs.readFileSync(blockedOutputPath, 'utf8') : '';
for (const phrase of [
  'Master Data bleibt geparkt',
  'Blocker: VAT Posting Setup was rejected in compact evidence.',
  'Fehlend oder unklar: 3806, 4400, 5400',
  'Foundation-Grenzen zuerst klaeren'
]) {
  if (!blockedOutput.includes(phrase)) errors.push(`blocked output is missing phrase: ${phrase}`);
}
if (/Master Data kann als naechster Block vorbereitet werden/.test(blockedOutput)) {
  errors.push('blocked output must not allow Master Data preparation.');
}

fs.rmSync(tempDir, { recursive: true, force: true });

const result = {
  schemaVersion: 1,
  purpose: 'foundation-readiness-decision-selftest',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  errors
};

console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
