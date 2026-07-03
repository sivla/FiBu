import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function runAuthCheck() {
  try {
    const output = execSync('npm run --silent auth:bc:check', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { exitCode: 0, output: JSON.parse(output) };
  } catch (error) {
    const rawOutput = `${error.stdout ?? ''}`.trim();
    let output = null;
    try {
      output = rawOutput ? JSON.parse(rawOutput) : null;
    } catch {
      output = null;
    }
    return {
      exitCode: typeof error.status === 'number' ? error.status : 1,
      output,
    };
  }
}

function readJsonIfExists(path) {
  const resolved = resolve(path);
  if (!existsSync(resolved)) return null;
  return JSON.parse(readFileSync(resolved, 'utf8'));
}

const current = readJsonIfExists('.agent/state/current.json') ?? {};
const lastAuthResult =
  typeof current.latestTarget027D31AuthRefreshResult === 'string'
    ? readJsonIfExists(current.latestTarget027D31AuthRefreshResult)
    : null;
const authCheck = runAuthCheck();
const check = authCheck.output ?? {};
const blockedBy = Array.isArray(check.blockedBy) ? check.blockedBy : ['auth-check-unavailable'];
const canUseStoredAuth = check.canUseStoredAuth === true;

const result = {
  schemaVersion: 1,
  purpose: 'business-central-auth-doctor',
  activeCase: current.activeCase ?? '',
  instance: current.instance ?? '',
  company: current.company ?? '',
  canRunBusinessCentralWorkflows: canUseStoredAuth,
  authCheck: {
    canUseStoredAuth,
    exitCode: authCheck.exitCode,
    blockedBy,
    expectedInstance: check.expectedInstance ?? current.instance ?? '',
    expectedCompany: check.expectedCompany ?? current.company ?? '',
    shellValidationMeta: check.shellValidationMeta ?? null,
    ageHours: check.ageHours ?? null,
    metaAgeHours: check.metaAgeHours ?? null,
    maxAgeHours: check.maxAgeHours ?? null,
  },
  lastAuthRefreshAttempt: lastAuthResult
    ? {
        resultPath: current.latestTarget027D31AuthRefreshResult,
        resultStatus: lastAuthResult.resultStatus ?? '',
        blockedBy: lastAuthResult.blockedBy ?? [],
        authDiagnosis: lastAuthResult.authDiagnosis ?? null,
      }
    : null,
  decision: canUseStoredAuth
    ? 'stored-auth-usable-run-readonly-or-gated-target-tests'
    : 'do-not-run-business-central-workflows-refresh-playwright-auth-first',
  nextSafeAction: canUseStoredAuth
    ? 'Run only the active case allowed by agent:run-plan and keep normal BC shell/context checks enabled.'
    : 'Run npm run auth:bc, complete Login/MFA in the Playwright-opened browser until Business Central shell is visible, then rerun npm run auth:bc:check.',
  forbiddenUntilGreen: [
    'D31 VAT Assisted Setup read-only discovery',
    'VAT setup pages',
    'setup changes',
    'master data',
    'drafts/documents',
    'Preview Posting',
    'Posting',
    'API shortcuts',
  ],
};

console.log(JSON.stringify(result, null, 2));
