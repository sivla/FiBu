import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const currentPath = '.agent/state/current.json';
const nodeCmd = process.execPath;

const checksByCase = new Map([
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
      id: 'foundation-readiness-decision-after-pws-ff-002-blocker',
      scriptPath: 'scripts/agent/foundation-readiness-decision.mjs',
      reason: 'PWS-FF-002B is selected only after PWS-FF-002 screenshot QA rejected Role Center as Page 314 evidence.',
      secondaryChecks: [
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
          id: 'foundation-gap-general-posting-setup-readfirst',
          scriptPath: 'scripts/agent/run-pws-ff-002-general-posting-setup-readonly.mjs',
          args: ['--check'],
          reason: 'General Posting Setup is the next narrow read-first Foundation gap after TARGET-075 and must be prepared before Master Data.'
        },
        {
          id: 'masterdata-readfirst-handoff',
          scriptPath: 'scripts/agent/masterdata-readfirst-check.mjs',
          reason: 'Master Data read-first pilots must remain blocked while the Foundation decision parks Master Data.'
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
