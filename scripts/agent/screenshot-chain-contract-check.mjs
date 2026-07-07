import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const files = {
  current: '.agent/state/current.json',
  caseFile: '.agent/state/cases/foundation-readiness-decision.json',
  decision: 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md',
  uiMap: 'playwright/projects/fibu-book5/UNIVERSAARL-READONLY-UI-LOOK-AND-FEEL-MAP.md'
};

function readText(relativePath) {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => text.includes(phrase));
}

function requireText(errors, id, text, phrase, reason) {
  if (!text.includes(phrase)) errors.push(`${id}: missing "${phrase}" (${reason})`);
}

function requireAnyText(errors, id, text, phrases, reason) {
  if (!includesAny(text, phrases)) errors.push(`${id}: missing one of ${JSON.stringify(phrases)} (${reason})`);
}

function requireAllText(errors, id, text, phrases, reason) {
  for (const phrase of phrases) {
    requireText(errors, id, text, phrase, reason);
  }
}

const errors = [];
const warnings = [];
const checkedFiles = [];

for (const [id, relativePath] of Object.entries(files)) {
  if (!fs.existsSync(path.resolve(root, relativePath))) {
    errors.push(`${id}: missing required file ${relativePath}`);
  } else {
    checkedFiles.push(relativePath);
  }
}

let current = null;
let caseJson = null;
let decision = '';
let uiMap = '';

if (!errors.length) {
  current = readJson(files.current);
  caseJson = readJson(files.caseFile);
  decision = readText(files.decision);
  uiMap = readText(files.uiMap);
}

if (current) {
  if (current.instance !== 'playthru') errors.push(`${files.current}: instance must be playthru`);
  if (current.company !== 'UNIVERSAARL-DE') errors.push(`${files.current}: company must be UNIVERSAARL-DE`);
  if (current.activeCase !== 'FOUNDATION-READINESS-DECISION') {
    warnings.push(`${files.current}: activeCase is ${current.activeCase}; screenshot-chain check is tuned for FOUNDATION-READINESS-DECISION`);
  }
  requireAnyText(
    errors,
    files.current,
    current.nextStep ?? '',
    ['multi-step screenshot chain', 'Bildkette'],
    'next live proof must not collapse to one end screenshot'
  );
}

if (caseJson) {
  if (caseJson.caseId !== 'FOUNDATION-READINESS-DECISION') {
    errors.push(`${files.caseFile}: caseId must be FOUNDATION-READINESS-DECISION`);
  }
  if (caseJson.mayRunPlaywright !== false) errors.push(`${files.caseFile}: mayRunPlaywright must stay false for this local decision`);
  if (caseJson.mayOpenBusinessCentral !== false) {
    errors.push(`${files.caseFile}: mayOpenBusinessCentral must stay false for this local decision`);
  }
  const acceptanceText = (caseJson.acceptanceCriteria ?? []).join('\n');
  requireAllText(
    errors,
    files.caseFile,
    acceptanceText,
    ['screenshot chain', 'at least five accepted checkpoints', 'start context', 'navigation', 'target page', 'action/tooltip context'],
    'acceptance criteria must describe the proof chain'
  );
  const preparationText = (caseJson.nextStepDecision?.requiredPreparation ?? []).join('\n');
  requireText(errors, files.caseFile, preparationText, 'screenshot chain', 'requiredPreparation must carry the UI-learning rule');
  requireText(errors, files.caseFile, preparationText, 'at least five accepted checkpoints', 'requiredPreparation must carry the minimum checkpoint rule');
}

if (decision) {
  requireAllText(
    errors,
    files.decision,
    decision,
    [
      'Screenshot-QA fuer naechsten Live-Proof',
      'mindestens fuenf akzeptierten Checkpoints',
      'Startkontext',
      'Navigationsweg',
      'Zielseite',
      'Zielzeile/FastTab/FactBox-Kontext',
      'Ein einzelner End-Screenshot reicht'
    ],
    'Foundation decision must preserve screenshot-chain boundary'
  );
}

if (uiMap) {
  requireAllText(
    errors,
    files.uiMap,
    uiMap,
    [
      'Status: `active-reference`, `readonly-ui-map`, `universaarl-company-exists`',
      'Zielcompany: `UNIVERSAARL-DE` existiert',
      'Der naechste Foundation-/VAT-/Posting-Readfirst-Lauf darf nicht nur einen End-Screenshot erzeugen.',
      'mindestens fuenf akzeptierte Checkpoints',
      'Startkontext',
      'Navigation',
      'Zielseite',
      'Bedienkontext',
      'Inhaltskontext',
      'Technischer Kontext',
      'Grenze'
    ],
    'UI map must explain the reusable screenshot chain'
  );

  for (const stalePhrase of ['UNIVERSAARL-DE noch nicht angelegt', 'needs-universaarl-final-company']) {
    if (uiMap.includes(stalePhrase)) {
      errors.push(`${files.uiMap}: stale company-creation phrase remains: ${stalePhrase}`);
    }
  }
}

const result = {
  schemaVersion: 1,
  purpose: 'screenshot-chain-contract-check',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  checkedFiles,
  errors,
  warnings,
  nextStep:
    errors.length === 0
      ? 'Screenshot-chain contract is present for the next read-first Foundation/VAT/Posting proof.'
      : 'Fix the screenshot-chain contract before accepting future page, FastTab or field claims.'
};

console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exitCode = 1;
