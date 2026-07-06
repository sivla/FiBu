import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const scriptPath = path.resolve(root, 'scripts/agent/foundation-readiness-decision.mjs');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'foundation-readiness-decision-'));
const inputPath = path.join(tempDir, 'TARGET-075-result.json');
const outputPath = path.join(tempDir, 'FOUNDATION-READINESS-DECISION.md');

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
    doctorLiveGate: { businessCentralLiveAllowed: false, playwrightLiveAllowed: false }
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
  screenshots: ['target-075-chart-of-accounts.png'],
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

const output = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
for (const phrase of [
  '# FOUNDATION-READINESS-DECISION',
  'Instanz: playthru',
  'Company: UNIVERSAARL-DE',
  'No-Write-Grenze aus TARGET-075',
  'Master Data kann als naechster Block vorbereitet werden'
]) {
  if (!output.includes(phrase)) errors.push(`output is missing phrase: ${phrase}`);
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
