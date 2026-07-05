import fs from 'node:fs';
import path from 'node:path';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = packageJson.scripts ?? {};

const legacyPattern = /RM-DEMO|MCP_1_20260210|CRONUS|Rhein-Main|Rhein Main|RheinMain|rm-de-lab|rm-demo/i;
const blockedScript = /legacy-script-blocked\.mjs/;
const playwrightTargetPattern = /(?:^|\s)playwright\s+test\s+([^\s]+)/;
const sampleLimit = 12;
const allowedScriptNames = new Set([
  'agent:legacy:active-check'
]);

const findings = [];
const warnings = [];
const activeLegacyRouteErrors = [];
const summary = {
  blockedLegacyRoutes: 0,
  activeLegacyRoutes: 0,
  legacyTargetFileReferences: 0
};
let targetFilesChecked = 0;

function addFinding(finding) {
  if (findings.length < sampleLimit) {
    findings.push(finding);
  }
}

function normalizeTargetPath(rawTarget) {
  return rawTarget.replace(/^["']|["']$/g, '');
}

for (const [name, command] of Object.entries(scripts)) {
  const haystack = `${name} ${command}`;
  if (legacyPattern.test(haystack)) {
    if (blockedScript.test(command)) {
      summary.blockedLegacyRoutes += 1;
      addFinding({
        script: name,
        status: 'blocked-legacy-route',
        command
      });
    } else if (!allowedScriptNames.has(name)) {
      summary.activeLegacyRoutes += 1;
      activeLegacyRouteErrors.push(`package script ${name} still points to a legacy route`);
      addFinding({
        script: name,
        status: 'active-legacy-route',
        command
      });
    }
  }

  const targetMatch = String(command).match(playwrightTargetPattern);
  if (!targetMatch) continue;

  const targetFile = normalizeTargetPath(targetMatch[1]);
  if (!targetFile || !fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) continue;

  targetFilesChecked += 1;
  const targetText = fs.readFileSync(targetFile, 'utf8');
  if (!legacyPattern.test(targetText)) continue;

  summary.legacyTargetFileReferences += 1;
  const targetFinding = {
    script: name,
    status: 'legacy-target-file-reference',
    targetFile: path.normalize(targetFile),
    handling: 'warning-inventory-only'
  };
  addFinding(targetFinding);
  if (warnings.length < sampleLimit) {
    warnings.push(
      `package script ${name} targets a Playwright file with legacy terms: ${path.normalize(targetFile)}`
    );
  }
}

const errors = activeLegacyRouteErrors;

const result = {
  schemaVersion: 1,
  purpose: 'legacy-active-route-check',
  ok: errors.length === 0,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  activeTruth: {
    instance: 'playthru',
    company: 'UNIVERSAARL-DE',
    legalName: 'Universaarl GmbH'
  },
  checked: {
    packageScripts: Object.keys(scripts).length,
    playwrightTargetFiles: targetFilesChecked,
    sampleLimit
  },
  policy: {
    blocked: 'Script names or commands that directly expose RM-DEMO/MCP/CRONUS/Rhein-Main routes must be ported or routed through legacy-script-blocked.mjs.',
    warning: 'Playwright target files containing legacy terms are migration inventory until the script is ported, blocked or archived; historical evidence is not mass-edited.'
  },
  summary,
  findings,
  warnings,
  errors,
  nextStep: errors.length
    ? 'Replace active legacy package scripts with Universaarl routes or legacy-script-blocked.mjs.'
    : summary.legacyTargetFileReferences
      ? 'Port, block or archive package scripts whose target Playwright files still contain legacy environment/company terms.'
      : 'No unblocked package scripts point to RM-DEMO/MCP/CRONUS/Rhein-Main routes.'
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) {
  process.exitCode = 1;
}
