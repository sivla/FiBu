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
      reason: 'TARGET-075 is the active read-first resume pilot and must stay prepared before any freeze lift.'
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

function runCheck(check) {
  const result = spawnSync(nodeCmd, [check.scriptPath], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  const parsed = parseJsonOutput(result.stdout) ?? parseJsonOutput(result.stderr);
  const output = {
    schemaVersion: 1,
    purpose: 'active-readiness-check',
    ok: result.status === 0,
    selectedCheck: check.id,
    selectedCheckScript: check.scriptPath,
    reason: check.reason,
    childExitCode: result.status,
    childError: result.error?.message ?? null,
    childOutput: parsed,
    liveActionsExecuted: false,
    businessCentralOpened: false,
    playwrightLiveRunExecuted: false
  };

  console.log(JSON.stringify(output, null, 2));
  if (result.status !== 0) process.exitCode = result.status ?? 1;
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
