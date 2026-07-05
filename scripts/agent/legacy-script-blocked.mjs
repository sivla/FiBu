const scriptName = process.argv[2] ?? 'unknown-script';
const reason = process.argv.slice(3).join(' ') || 'Legacy script is not an active Universaarl route.';

const payload = {
  schemaVersion: 1,
  purpose: 'legacy-script-blocked',
  ok: false,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  scriptName,
  reason,
  activeTruth: {
    instance: 'playthru',
    company: 'UNIVERSAARL-DE',
    legalName: 'Universaarl GmbH'
  },
  legacyBoundary:
    'RM-DEMO, MCP_1_20260210, CRONUS, Rhein-Main and RM-* scripts are not active execution routes. Port the scenario to Universaarl or classify it as legacy-purge-source before running.',
  nextStep:
    'Use TARGET-075 read-first after freeze lift, or create a Universaarl-specific route decision before any live execution.'
};

console.error(JSON.stringify(payload, null, 2));
process.exit(1);
