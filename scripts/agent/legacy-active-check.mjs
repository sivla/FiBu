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
const activeSteeringFiles = [
  'README.md',
  'HANDOVER.md',
  '.agent/PROJECT-DECISION.md',
  '.agent/ACTIVE-ARTIFACT-CLASSIFICATION.md',
  '.agent/project-template/PROJECT-DASHBOARD-DRAFT.md',
  '.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md',
  '.agent/project-template/REFINEMENT-BACKLOG.md',
  '.agent/state/last_run_summary.json',
  '.agent/state/marathon_queue.json',
  'playwright/projects/fibu-book5/BC-COMPANY-USECASE.md',
  'playwright/projects/fibu-book5/BC-FULL-PLAYTHROUGH-CATALOG.md'
];
const staleActiveSteeringPatterns = [
  {
    pattern: /Naechster sinnvoller Schritt ist TARGET-073|Nächster sinnvoller Schritt ist TARGET-073/i,
    message: 'TARGET-073 must not be described as the next active live step'
  },
  {
    pattern: /TARGET-075-FIRST-VENDOR-CARD-CONTROLLED-FIT/i,
    message: 'Do not name a first vendor pilot before FOUNDATION-READINESS-DECISION.md'
  },
  {
    pattern: /company-to-be-created-through-book-process/i,
    message: 'UNIVERSAARL-DE already exists; do not describe it as still to be created'
  },
  {
    pattern: /UNIVERSAARL-DE[^.\n|]*nicht existiert|UNIVERSAARL-DE[^.\n|]*does not exist/i,
    message: 'UNIVERSAARL-DE exists; active steering must not say otherwise'
  },
  {
    pattern: /FOUNDATION-001.*RM-DEMO|FIBU_BOOK5_BC_URL=.*RM-DEMO/i,
    message: 'Active onboarding must not use old RM-DEMO foundation routes'
  },
  {
    pattern: /\| Finance Foundation \|[^\n]*\| TARGET-069 VAT Source-\/Route-Entscheid \|/i,
    message: 'Finance Foundation catalog row must hand off to TARGET-075 and FOUNDATION-READINESS-DECISION.md, not TARGET-069'
  },
  {
    pattern: /\| Posting Groups \|[^\n]*\| `TARGET-032K-GENERAL-POSTING-SETUP-NEW-ACTION-EMPTY-RECORD-GATE` \|/i,
    message: 'Posting Groups catalog row must not directly reactivate old Page-314 routes before Foundation Readiness'
  },
  {
    pattern: /\| VAT Setup \/ USt \|[^\n]*\| `TARGET-071-VAT-POSTING-SETUP-PAGE472-CONTROLLED-WRITE-GATE` \|/i,
    message: 'VAT catalog row must wait for TARGET-075 and FOUNDATION-READINESS-DECISION.md before any write gate'
  },
  {
    pattern: /\| Customers \|[^\n]*\| `TARGET-046-ITEM-INVENTORY-POSTING-GROUP-SOURCE-MAPPING` \|/i,
    message: 'Customer catalog row must not jump to item/posting mapping before Foundation Readiness'
  },
  {
    pattern: /\| Vendors \|[^\n]*\| `TARGET-036D2G-U-VEND-MANUAL-NOS-SOURCE-OR-ASSISTED-ROUTE-DECISION` \|/i,
    message: 'Vendor catalog row must not jump to U-VEND setup routes before Foundation Readiness'
  },
  {
    pattern: /\| Items \|[^\n]*\| `TARGET-027D25-VAT-MATRIX-ROUTE-REOPEN-DECISION` \|/i,
    message: 'Item catalog row must not jump to VAT matrix routes before Foundation Readiness'
  }
];

const findings = [];
const warnings = [];
const activeLegacyRouteErrors = [];
const summary = {
  blockedLegacyRoutes: 0,
  activeLegacyRoutes: 0,
  legacyTargetFileReferences: 0,
  universaarlTargetBoundaryReferences: 0,
  activeSteeringFilesChecked: 0,
  staleActiveSteeringFindings: 0
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

function isUniversaarlTargetBoundaryReference(scriptName, targetText) {
  if (!scriptName.startsWith('fibu:target:')) return false;

  return /playthru/i.test(targetText) && /UNIVERSAARL-DE|Universaarl GmbH/i.test(targetText);
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

  if (isUniversaarlTargetBoundaryReference(name, targetText)) {
    summary.universaarlTargetBoundaryReferences += 1;
    continue;
  }

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

for (const file of activeSteeringFiles) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;

  summary.activeSteeringFilesChecked += 1;
  const text = fs.readFileSync(file, 'utf8');
  for (const { pattern, message } of staleActiveSteeringPatterns) {
    if (!pattern.test(text)) continue;

    summary.staleActiveSteeringFindings += 1;
    activeLegacyRouteErrors.push(`${file}: ${message}`);
    addFinding({
      file,
      status: 'stale-active-steering',
      message
    });
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
    activeSteeringFiles: summary.activeSteeringFilesChecked,
    sampleLimit
  },
  policy: {
    blocked: 'Script names or commands that directly expose RM-DEMO/MCP/CRONUS/Rhein-Main routes must be ported or routed through legacy-script-blocked.mjs.',
    warning: 'Playwright target files containing legacy terms are migration inventory until the script is ported, blocked or archived; historical evidence is not mass-edited.',
    universaarlTargetBoundary: 'fibu:target:* files that clearly target playthru/UNIVERSAARL-DE may mention legacy terms only as rejected options, URL normalization, or boundary language without producing warning noise.',
    activeSteering: 'Active steering files may mention legacy only as a boundary. They must not describe TARGET-073, RM-DEMO, CRONUS or pre-existing company creation as the next active path.'
  },
  summary,
  findings,
  warnings,
  errors,
  nextStep: errors.length
    ? 'Replace active legacy package scripts or stale steering text with the Universaarl/TARGET-075/Foundation-Readiness path.'
    : summary.legacyTargetFileReferences
      ? 'Port, block or archive package scripts whose target Playwright files still contain legacy environment/company terms.'
      : 'No unblocked package scripts point to RM-DEMO/MCP/CRONUS/Rhein-Main routes.'
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) {
  process.exitCode = 1;
}
