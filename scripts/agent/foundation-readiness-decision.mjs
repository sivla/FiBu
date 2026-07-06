import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const defaultResultPath =
  'playwright/projects/fibu-book5/evidence/target-075-chart-of-accounts-reopen-and-setup-consistency-check/TARGET-075-result.json';
const defaultDecisionPath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.md';
const templatePath = 'playwright/projects/fibu-book5/FOUNDATION-READINESS-DECISION.template.md';
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const write = args.has('--write');
const check = args.has('--check') || !write;

function valueArg(name, fallback) {
  const prefix = `${name}=`;
  const match = rawArgs.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const resultPath = valueArg('--input', defaultResultPath);
const decisionPath = valueArg('--output', defaultDecisionPath);

function resolve(relativePath) {
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.resolve(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(resolve(relativePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(resolve(relativePath), 'utf8'));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function bullet(values, fallback = '- Keine Angabe.') {
  const list = asArray(values).filter(Boolean);
  return list.length ? list.map((value) => `- ${String(value)}`).join('\n') : fallback;
}

function validateTarget075(result) {
  const errors = [];
  const warnings = [];

  if (result.caseId !== 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK') {
    errors.push('TARGET-075-result.json has an unexpected caseId.');
  }
  if (result.instance !== 'playthru') errors.push('TARGET-075 result must use instance playthru.');
  if (result.company !== 'UNIVERSAARL-DE') errors.push('TARGET-075 result must use company UNIVERSAARL-DE.');
  if (result.nextCase !== 'FOUNDATION-READINESS-DECISION') {
    errors.push('TARGET-075 result must hand off to FOUNDATION-READINESS-DECISION.');
  }

  const falseFlags = ['setupChanged', 'masterDataChanged', 'draftCreated', 'previewPosting', 'posted', 'payment', 'apiShortcut'];
  for (const flag of falseFlags) {
    if (result[flag] !== false) errors.push(`TARGET-075 read-first result must keep ${flag}=false.`);
  }

  if (!result.authGate) {
    errors.push('TARGET-075 result is missing authGate.');
  } else {
    if (result.authGate.checkedByGuard !== true) errors.push('authGate.checkedByGuard must be true.');
    if (result.authGate.secretsPrinted !== false) errors.push('authGate.secretsPrinted must be false.');
    if (!('doctorDecision' in result.authGate)) errors.push('authGate.doctorDecision is required.');
    if (!('doctorLiveGate' in result.authGate)) errors.push('authGate.doctorLiveGate is required.');
  }

  if (!result.executionGate) {
    errors.push('TARGET-075 result is missing executionGate.');
  } else {
    if (result.executionGate.runnerGuardChecked !== true) errors.push('executionGate.runnerGuardChecked must be true.');
    if (result.executionGate.liveApproved !== true) errors.push('executionGate.liveApproved must be true.');
    if (typeof result.executionGate.freezeActiveAtRunner !== 'boolean') {
      errors.push('executionGate.freezeActiveAtRunner must be boolean.');
    }
    if (typeof result.executionGate.freezeOverrideUsed !== 'boolean') {
      errors.push('executionGate.freezeOverrideUsed must be boolean.');
    }
  }

  const input = result.foundationReadinessInput;
  if (!input) {
    errors.push('TARGET-075 result is missing foundationReadinessInput.');
  } else {
    if (!input.decisionStatus) errors.push('foundationReadinessInput.decisionStatus is required.');
    if (!input.chartOfAccounts) errors.push('foundationReadinessInput.chartOfAccounts is required.');
    if (!input.setupContext) errors.push('foundationReadinessInput.setupContext is required.');
    if (!Array.isArray(input.nextProjectOutputs)) warnings.push('foundationReadinessInput.nextProjectOutputs should be an array.');
    if (!Array.isArray(input.uatTrainingImpact)) warnings.push('foundationReadinessInput.uatTrainingImpact should be an array.');
  }

  return { errors, warnings };
}

function statusLine(value) {
  if (value === true) return 'ja';
  if (value === false) return 'nein';
  return String(value ?? 'unbekannt');
}

function renderDecision(result) {
  const input = result.foundationReadinessInput ?? {};
  const chart = input.chartOfAccounts ?? {};
  const setup = input.setupContext ?? {};
  const blockedBy = unique(asArray(result.blockedBy));
  const warnings = unique(asArray(result.warnings));
  const proven = unique(asArray(result.proved));
  const notProved = unique(asArray(result.notProved));
  const starterVisible = asArray(chart.starterAccountsVisible);
  const starterMissing = asArray(chart.starterAccountsMissingOrUnclear);
  const screenshots = asArray(result.screenshots);

  const readyForMasterData =
    result.resultStatus === 'observed' &&
    blockedBy.length === 0 &&
    starterMissing.length === 0 &&
    setup.generalPostingSetup === 'observed' &&
    setup.vatPostingSetup === 'observed';

  const decision = readyForMasterData
    ? 'Master Data kann als naechster Block vorbereitet werden, aber nur mit eigenem Smart Decision Gate.'
    : 'Master Data bleibt geparkt, bis die offenen Foundation-Grenzen geprueft oder bewusst akzeptiert sind.';

  return [
    '# FOUNDATION-READINESS-DECISION',
    '',
    '> Automatisch aus TARGET-075 Evidence erzeugt. Diese Datei ist eine Projektentscheidung, kein Buchkapitel.',
    '',
    '## Kontext',
    '',
    `- Quelle: ${resultPath}`,
    `- Instanz: ${result.instance}`,
    `- Company: ${result.company}`,
    `- Result-Status: ${result.resultStatus}`,
    `- Erzeugt am: ${new Date().toISOString()}`,
    '',
    '## Entscheidung',
    '',
    decision,
    '',
    '## No-Write-Grenze aus TARGET-075',
    '',
    `- Setup geaendert: ${statusLine(result.setupChanged)}`,
    `- Stammdaten geaendert: ${statusLine(result.masterDataChanged)}`,
    `- Beleg/Draft erzeugt: ${statusLine(result.draftCreated)}`,
    `- Buchungsvorschau: ${statusLine(result.previewPosting)}`,
    `- Buchung: ${statusLine(result.posted)}`,
    `- Zahlung: ${statusLine(result.payment)}`,
    `- API Shortcut: ${statusLine(result.apiShortcut)}`,
    '',
    '## Bewiesen',
    '',
    bullet(proven),
    '',
    '## Nicht bewiesen',
    '',
    bullet(notProved),
    '',
    '## Kontenplan',
    '',
    `- Status: ${chart.status ?? 'unbekannt'}`,
    `- Sichtbare Starterkonten: ${starterVisible.length ? starterVisible.join(', ') : 'keine'}`,
    `- Fehlend oder unklar: ${starterMissing.length ? starterMissing.join(', ') : 'keine'}`,
    `- Buchgrenze: ${chart.bookBoundary ?? 'Keine Buchgrenze im Result angegeben.'}`,
    '',
    '## Setup-Kontext',
    '',
    `- Geschaeftsbuchungsgruppen: ${setup.generalBusinessPostingGroups ?? 'unbekannt'}`,
    `- Produktbuchungsgruppen: ${setup.generalProductPostingGroups ?? 'unbekannt'}`,
    `- Buchungsmatrix Einrichtung: ${setup.generalPostingSetup ?? 'unbekannt'}`,
    `- USt-Buchungsmatrix Einrichtung: ${setup.vatPostingSetup ?? 'unbekannt'}`,
    `- Grenze: ${setup.bookBoundary ?? 'Read-first Sichtbarkeit ersetzt keine Setup-Korrektheitspruefung.'}`,
    '',
    '## Blocker und Warnungen',
    '',
    blockedBy.length || warnings.length
      ? [...blockedBy.map((item) => `- Blocker: ${item}`), ...warnings.map((item) => `- Warnung: ${item}`)].join('\n')
      : '- Keine Blocker oder Warnungen im TARGET-075 Result.',
    '',
    '## UAT und Training',
    '',
    bullet(input.uatTrainingImpact),
    '',
    '## Naechste Projektoutputs',
    '',
    bullet(input.nextProjectOutputs),
    '',
    '## Evidence',
    '',
    bullet(screenshots.map((screenshot) => `Screenshot: ${screenshot}`)),
    '',
    '## Naechster Case',
    '',
    readyForMasterData
      ? '- Einen engen Master-Data-Read-first-Pilot waehlen und vor jedem Write ein Smart Decision Gate dokumentieren.'
      : '- Foundation-Grenzen zuerst klaeren; keine Master-Data-, VAT-, Posting- oder Prozess-Writes starten.',
    ''
  ].join('\n');
}

if (!exists(resultPath)) {
  const output = {
    schemaVersion: 1,
    purpose: 'foundation-readiness-decision',
    mode: check ? 'check' : 'write',
    canWrite: false,
    resultMissing: true,
    liveActionsExecuted: false,
    businessCentralOpened: false,
    playwrightLiveRunExecuted: false,
    resultPath,
    decisionPath,
    templatePath,
    errors: write ? [`Missing required TARGET-075 result: ${resultPath}`] : [],
    warnings: [`${decisionPath} must not be created before TARGET-075 evidence exists.`],
    nextStep: 'Run TARGET-075 read-first after freeze/live-gate lift, then run this script with --write.'
  };
  console.log(JSON.stringify(output, null, 2));
  if (write) process.exitCode = 1;
  process.exit();
}

const result = readJson(resultPath);
const validation = validateTarget075(result);
const canWrite = validation.errors.length === 0;

if (write && canWrite) {
  fs.mkdirSync(path.dirname(resolve(decisionPath)), { recursive: true });
  fs.writeFileSync(resolve(decisionPath), renderDecision(result), 'utf8');
}

const output = {
  schemaVersion: 1,
  purpose: 'foundation-readiness-decision',
  mode: write ? 'write' : 'check',
  canWrite,
  wroteFile: write && canWrite,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  resultPath,
  decisionPath,
  templatePath,
  resultStatus: result.resultStatus,
  instance: result.instance,
  company: result.company,
  nextCase: result.nextCase,
  errors: validation.errors,
  warnings: validation.warnings,
  nextStep: canWrite
    ? write
      ? `${decisionPath} was updated from TARGET-075 evidence.`
      : `TARGET-075 evidence is valid for ${decisionPath}; run with --write after review.`
    : 'Fix TARGET-075 result shape before writing the Foundation Readiness Decision.'
};

console.log(JSON.stringify(output, null, 2));
if (validation.errors.length) process.exitCode = 1;
