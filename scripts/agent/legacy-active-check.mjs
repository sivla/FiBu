import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = packageJson.scripts ?? {};

const legacyPattern = /RM-DEMO|MCP_1_20260210|CRONUS|Rhein-Main|Rhein Main|RheinMain|rm-de-lab|rm-demo/i;
const blockedScript = /legacy-script-blocked\.mjs/;
const allowedScriptNames = new Set([
  'agent:legacy:active-check'
]);

const findings = [];

for (const [name, command] of Object.entries(scripts)) {
  const haystack = `${name} ${command}`;
  if (!legacyPattern.test(haystack)) continue;
  if (blockedScript.test(command)) {
    findings.push({
      script: name,
      status: 'blocked-legacy-route',
      command
    });
    continue;
  }
  if (allowedScriptNames.has(name)) continue;
  findings.push({
    script: name,
    status: 'active-legacy-route',
    command
  });
}

const errors = findings
  .filter((finding) => finding.status === 'active-legacy-route')
  .map((finding) => `package script ${finding.script} still points to a legacy route`);

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
    packageScripts: Object.keys(scripts).length
  },
  findings,
  errors,
  nextStep: errors.length
    ? 'Replace active legacy package scripts with Universaarl routes or legacy-script-blocked.mjs.'
    : 'No unblocked package scripts point to RM-DEMO/MCP/CRONUS/Rhein-Main routes.'
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) {
  process.exitCode = 1;
}
