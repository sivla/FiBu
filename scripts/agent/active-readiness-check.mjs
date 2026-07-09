import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const currentPath = '.agent/state/current.json';
const nodeCmd = process.execPath;

const checksByCase = new Map([
  [
    'FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-READFIRST',
    {
      id: 'foundation-setup-package-field-selection-readfirst',
      scriptPath: 'scripts/agent/run-foundation-setup-package-field-selection-readfirst.mjs',
      args: ['--check'],
      reason:
        'The next Foundation case may inspect existing U-VAT325-DISC / Table 325 field context read-only, but must not toggle/select fields, import, export, validate, apply or write setup data.'
    }
  ],
  [
    'FOUNDATION-SETUP-PACKAGE-ONE-METADATA-ACTION-EXECUTE',
    {
      id: 'foundation-setup-package-one-metadata-action-execute-preflight',
      scriptPath: 'scripts/agent/run-foundation-setup-package-one-metadata-action-execute.mjs',
      args: ['--check'],
      reason:
        'This write-gated live case may only attempt one configuration-package metadata line for Table 325 on U-VAT325-DISC. The runner is preflight-only until the real implementation is intentionally added.'
    }
  ],
  [
    'FOUNDATION-SETUP-PACKAGE-ONE-METADATA-ACTION-WRITE-GATE',
    {
      id: 'foundation-setup-package-one-metadata-action-write-gate-local-no-live',
      scriptPath: 'scripts/agent/local-no-live-case-readiness-check.mjs',
      reason:
        'This local no-live decision must define or reject exactly one future package metadata/table action before any package/setup write exists.'
    }
  ],
  [
    'FOUNDATION-SETUP-PACKAGE-CARD-DETAIL-READFIRST',
    {
      id: 'foundation-setup-package-card-detail-readfirst',
      scriptPath: 'scripts/agent/run-foundation-setup-package-card-detail-readfirst.mjs',
      args: ['--check'],
      reason:
        'The next Foundation case may inspect the existing package detail/card surface read-only, but must not create, edit, import, export, validate, apply or write package/setup data.'
    }
  ],
  [
    'FOUNDATION-SETUP-PACKAGE-METADATA-NARROW-WRITE-GATE',
    {
      id: 'foundation-setup-package-metadata-narrow-write-gate-local-no-live',
      scriptPath: 'scripts/agent/local-no-live-case-readiness-check.mjs',
      reason:
        'This local no-live decision must decide whether exactly one package metadata action is justified before any package/setup write case exists.'
    }
  ],
  [
    'FOUNDATION-SETUP-PACKAGE-CARD-TABLES-READFIRST',
    {
      id: 'foundation-setup-package-card-tables-readfirst',
      scriptPath: 'scripts/agent/run-foundation-setup-package-card-tables-readfirst.mjs',
      args: ['--check'],
      reason:
        'The next Foundation case may inspect Configuration Package card/table surfaces read-only, but must not create, import, export, validate, apply or edit package/setup data.'
    }
  ],
  [
    'FOUNDATION-CONFIGURATION-WORKSHEET-READFIRST',
    {
      id: 'foundation-configuration-worksheet-readfirst',
      scriptPath: 'scripts/agent/read-first-no-write-case-readiness-check.mjs',
      reason:
        'The next Foundation case may open playthru / UNIVERSAARL-DE read-only, but must not create, import, export, validate or apply configuration packages.'
    }
  ],
  [
    'FOUNDATION-SETUP-PACKAGE-TABLE-MAPPING-SOURCE-DECISION',
    {
      id: 'foundation-setup-package-table-mapping-source-decision-local-no-live',
      scriptPath: 'scripts/agent/local-no-live-case-readiness-check.mjs',
      reason:
        'This is the active local no-live Foundation decision. It must be registered as a bounded case and must not inherit TARGET-075 live-pilot checks.'
    }
  ],
  [
    'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
    {
      id: 'target-075-readiness',
      scriptPath: 'scripts/agent/target-075-readiness-check.mjs',
      reason: 'TARGET-075 is the active read-first resume pilot and must stay prepared before any freeze lift.',
      secondaryChecks: [
        {
          id: 'foundation-gap-general-posting-setup-readfirst',
          scriptPath: 'scripts/agent/run-pws-ff-002-general-posting-setup-readonly.mjs',
          args: ['--check'],
          reason: 'General Posting Setup is the next narrow read-first Foundation gap after TARGET-075 and must be prepared before Master Data.'
        },
        {
          id: 'masterdata-readfirst-handoff',
          scriptPath: 'scripts/agent/masterdata-readfirst-check.mjs',
          reason: 'After TARGET-075, the prepared Master Data read-first pilots must stay discoverable and blocked until Foundation Readiness Decision.'
        }
      ]
    }
  ],
  [
    'PWS-FF-002-GENERAL-POSTING-SETUP-READFIRST-RECOVERY',
    {
      id: 'foundation-gap-general-posting-setup-readfirst',
      scriptPath: 'scripts/agent/run-pws-ff-002-general-posting-setup-readonly.mjs',
      args: ['--check'],
      reason: 'General Posting Setup is the selected narrow read-first Foundation gap after TARGET-075.',
      secondaryChecks: [
        {
          id: 'foundation-readiness-decision',
          scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
          reason: 'PWS-FF-002 must remain grounded in TARGET-075 Foundation Readiness before any live run.'
        },
        {
          id: 'masterdata-readfirst-handoff',
          scriptPath: 'scripts/agent/masterdata-readfirst-check.mjs',
          reason: 'Master Data must remain blocked while PWS-FF-002 is the selected Foundation gap.'
        }
      ]
    }
  ],
  [
    'PWS-FF-002B-PAGE314-NAVIGATION-CAPTURE-RECOVERY',
    {
      id: 'foundation-page314-navigation-capture-recovery',
      scriptPath: 'scripts/agent/run-pws-ff-002b-page314-navigation-capture-recovery.mjs',
      args: ['--check'],
      reason: 'PWS-FF-002B is selected only after PWS-FF-002 screenshot QA rejected Role Center as Page 314 evidence.',
      secondaryChecks: [
        {
          id: 'foundation-readiness-decision-after-pws-ff-002-blocker',
          scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
          reason: 'Foundation Readiness must keep the Page 314 blocked proof visible before any master-data handoff.'
        },
        {
          id: 'masterdata-readfirst-handoff',
          scriptPath: 'scripts/agent/masterdata-readfirst-check.mjs',
          reason: 'Master Data must remain blocked while Page 314 navigation/capture recovery is pending.'
        }
      ]
    }
  ],
  [
    'FOUNDATION-READINESS-DECISION',
    {
      id: 'foundation-readiness-decision',
      scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
      reason: 'TARGET-075 has run; Foundation Readiness Decision must stay valid before any Master Data or write pilot.',
      secondaryChecks: [
        {
          id: 'foundation-page314-navigation-capture-recovery-blocked-result',
          scriptPath: 'scripts/agent/run-pws-ff-002b-page314-navigation-capture-recovery.mjs',
          args: ['--check'],
          reason: 'PWS-FF-002B is already blocked; Foundation Readiness must consume it instead of rerunning the same Page 314 route.'
        }
      ]
    }
  ],
  [
    'PWS-FF-006-CHART-OF-ACCOUNTS-STARTER-ACCOUNTS-READFIRST',
    {
      id: 'foundation-chart-of-accounts-starter-accounts-readfirst',
      scriptPath: 'scripts/agent/run-pws-ff-006-chart-of-accounts-starter-accounts-readonly.mjs',
      args: ['--check'],
      reason: 'PWS-FF-006 is the selected read-first Foundation gap and must stay no-write before any live run.',
      secondaryChecks: [
        {
          id: 'foundation-readiness-decision',
          scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
          reason: 'PWS-FF-006 must feed Foundation Readiness instead of starting Master Data or setup writes directly.'
        }
      ]
    }
  ],
  [
    'VAT-POSTING-SETUP-READFIRST',
    {
      id: 'vat-posting-setup-readfirst',
      scriptPath: 'scripts/agent/vat-posting-setup-readfirst-check.mjs',
      reason:
        'VAT-POSTING-SETUP-READFIRST is the selected read-first/no-write Foundation pilot before any master-data write, O2C, P2P, Preview Posting or Posting.',
      secondaryChecks: [
        {
          id: 'screenshot-chain-contract',
          scriptPath: 'scripts/agent/screenshot-chain-contract-check.mjs',
          reason:
            'The VAT pilot must keep the multi-checkpoint screenshot QA rule before accepting page, row, FastTab or field truth.'
        },
        {
          id: 'foundation-readiness-decision',
          scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
          reason:
            'The VAT pilot must remain grounded in the curated Foundation boundary and must not regenerate or weaken later evidence.'
        },
        {
          id: 'auth-target-boundary-selftest',
          scriptPath: 'scripts/agent/auth-target-diagnose.selftest.mjs',
          reason:
            'The next live proof must rebuild its Business Central target from playthru / UNIVERSAARL-DE and not from any legacy source URL.'
        }
      ]
    }
  ],
  [
    'CUSTOMER-PAYMENT-TERMS-WRITE-GATE',
    {
      id: 'customer-payment-terms-write-gate',
      scriptPath: 'scripts/agent/run-customer-payment-terms-write-gate.mjs',
      args: ['--check'],
      reason: 'CUSTOMER-PAYMENT-TERMS-WRITE-GATE is the active narrow setup gate and must only create or verify NET30 on Payment Terms before any customer setup write.',
      secondaryChecks: [
        {
          id: 'foundation-readiness-decision',
          scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
          reason: 'Payment Terms is a bounded setup prerequisite; broader Master Data and process readiness still depend on Foundation boundaries.'
        }
      ]
    }
  ],
  [
    'CUSTOMER-PAYMENT-TERMS-WRITE-GATE-RECOVERY',
    {
      id: 'customer-payment-terms-write-gate-recovery',
      scriptPath: 'scripts/agent/run-customer-payment-terms-route-recovery.mjs',
      args: ['--check'],
      reason: 'The Payment Terms write gate is blocked no-write; the selected recovery stays read-first until the Payment Terms page route is screenshot-proven.',
      secondaryChecks: [
        {
          id: 'foundation-readiness-decision',
          scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
          reason: 'Payment Terms recovery is a Master Data dependency and must stay inside the Foundation boundary.'
        }
      ]
    }
  ],
  [
    'CUSTOMER-SETUP-VALUE-WRITE-GATE',
    {
      id: 'customer-setup-value-write-gate-prepared',
      scriptPath: 'scripts/agent/customer-setup-value-write-gate-check.mjs',
      reason: 'CUSTOMER-SETUP-VALUE-WRITE-GATE may only follow real Payment Terms evidence and must stay inside the Foundation/Master Data boundary until its own guarded runner exists.',
      secondaryChecks: [
        {
          id: 'foundation-readiness-decision',
          scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
          reason: 'The customer setup value gate depends on Foundation boundaries as well as the NET30 prerequisite.'
        }
      ]
    }
  ],
  [
    'TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF',
    {
      id: 'target-073b-page472-surface-editor-proof',
      scriptPath: 'scripts/agent/target-073b-readiness-check.mjs',
      reason: 'TARGET-073B is the next materially new no-write Page 472 surface/editor diagnostic and must not become another VAT write attempt.',
      secondaryChecks: [
        {
          id: 'foundation-readiness-decision',
          scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
          reason: 'Foundation Readiness must remain the boundary until TARGET-073B produces stronger surface/editor evidence.'
        }
      ]
    }
  ]
]);

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(root, relativePath), 'utf8'));
}

function findJsonObjects(text) {
  const objects = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }
    if (char === '}' && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function parseJsonOutput(text) {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    for (const candidate of findJsonObjects(trimmed).reverse()) {
      try {
        return JSON.parse(candidate);
      } catch {
        // Keep looking for the last valid JSON object in noisy command output.
      }
    }
  }
  return null;
}

function runScript(check) {
  const result = spawnSync(nodeCmd, [check.scriptPath, ...(check.args ?? [])], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  const parsed = parseJsonOutput(result.stdout) ?? parseJsonOutput(result.stderr);
  return {
    id: check.id,
    scriptPath: check.scriptPath,
    args: check.args ?? [],
    reason: check.reason,
    ok: result.status === 0,
    exitCode: result.status,
    error: result.error?.message ?? null,
    output: parsed
  };
}

function runCheck(check) {
  const primary = runScript(check);
  const secondaryChecks = (check.secondaryChecks ?? []).map(runScript);
  const failed = [primary, ...secondaryChecks].filter((entry) => !entry.ok);
  const output = {
    schemaVersion: 1,
    purpose: 'active-readiness-check',
    ok: failed.length === 0,
    selectedCheck: check.id,
    selectedCheckScript: check.scriptPath,
    reason: check.reason,
    childExitCode: primary.exitCode,
    childError: primary.error,
    childOutput: primary.output,
    secondaryChecks: secondaryChecks.map((entry) => ({
      id: entry.id,
      scriptPath: entry.scriptPath,
      args: entry.args,
      reason: entry.reason,
      ok: entry.ok,
      exitCode: entry.exitCode,
      error: entry.error,
      output: entry.output
    })),
    liveActionsExecuted: false,
    businessCentralOpened: false,
    playwrightLiveRunExecuted: false
  };

  console.log(JSON.stringify(output, null, 2));
  if (failed.length) process.exitCode = failed[0].exitCode ?? 1;
}

const current = readJson(currentPath);
const selectedCase = current.nextCase ?? current.activeCase;
const check = checksByCase.get(selectedCase);

if (check) {
  runCheck(check);
} else {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'active-readiness-check',
        ok: true,
        selectedCheck: null,
        activeCase: current.activeCase ?? '',
        nextCase: current.nextCase ?? '',
        reason: 'No dedicated active readiness check is registered for the current active/next case.',
        liveActionsExecuted: false,
        businessCentralOpened: false,
        playwrightLiveRunExecuted: false,
        warnings: ['Register a dedicated readiness check before promoting a new live pilot.']
      },
      null,
      2
    )
  );
}
