import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCmd = process.execPath;
const currentState = JSON.parse(readFileSync('.agent/state/current.json', 'utf8'));
const selectedNextCase = currentState.nextCase ?? '';
const minAuthExpiresArg = process.argv.find((arg) => arg.startsWith('--min-auth-expires-hours='));
const minAuthExpiresInHours = minAuthExpiresArg ? Number(minAuthExpiresArg.split('=').at(1)) : null;
const authCheckArgs = Number.isFinite(minAuthExpiresInHours)
  ? ['scripts/agent/auth-state-check.mjs', `--min-expires-hours=${minAuthExpiresInHours}`]
  : null;

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

function parseJsonFromStream(text, streamName) {
  const trimmed = (text ?? '').trim();
  if (!trimmed) {
    throw new Error(`${streamName} did not contain JSON output`);
  }
  try {
    return JSON.parse(trimmed);
  } catch (wholeStreamError) {
    for (const candidate of findJsonObjects(trimmed).reverse()) {
      try {
        return JSON.parse(candidate);
      } catch {
        // Keep looking for the last valid JSON object in noisy command output.
      }
    }
    throw wholeStreamError;
  }
}

function runStep(id, command, args, options = {}) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    shell: process.platform === 'win32' && /\.cmd$/i.test(command)
  });
  const commandError = result.error?.message;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  let parsedJson = null;
  let parsedJsonSource = null;
  if (options.parseJson) {
    try {
      parsedJson = parseJsonFromStream(stdout, 'stdout');
      parsedJsonSource = 'stdout';
    } catch (stdoutError) {
      try {
        parsedJson = parseJsonFromStream(stderr, 'stderr');
        parsedJsonSource = 'stderr';
      } catch (stderrError) {
        return {
          id,
          command: [command, ...args].join(' '),
          startedAt,
          exitCode: result.status ?? 1,
          ok: false,
          commandError,
          parseError: stdoutError.message,
          stderrParseError: stderrError.message,
          stdoutTail: stdout.slice(-2000),
          stderrTail: stderr.slice(-2000)
        };
      }
    }
  }
  return {
    id,
    command: [command, ...args].join(' '),
    startedAt,
    exitCode: result.status ?? 0,
    ok: !commandError && (result.status ?? 0) === 0,
    commandError,
    parsedJson,
    parsedJsonSource,
    stdoutTail: options.keepStdout ? stdout.slice(-2000) : undefined,
    stderrTail: stderr ? stderr.slice(-2000) : undefined
  };
}

const steps = [
  runStep('agent-preflight', npmCmd, ['run', '--silent', 'agent:preflight']),
  runStep('context-live-gate', npmCmd, ['run', '--silent', 'agent:context:test'], { parseJson: true }),
  runStep('freeze-status', nodeCmd, ['scripts/agent/freeze-status-check.mjs'], { parseJson: true }),
  runStep('quality-audit', nodeCmd, ['scripts/agent/quality-audit.mjs'], { parseJson: true }),
  runStep('target-075-readiness', nodeCmd, ['scripts/agent/target-075-readiness-check.mjs'], { parseJson: true }),
  runStep('auth-state-check', authCheckArgs ? nodeCmd : npmCmd, authCheckArgs ?? ['run', '--silent', 'auth:bc:check'], {
    parseJson: true
  }),
  runStep('auth-doctor', npmCmd, ['run', '--silent', 'auth:bc:doctor'], { parseJson: true }),
  runStep('target-075-safe-check', npmCmd, ['run', '--silent', 'fibu:target:foundation-consistency-pilot', '--', '--check'], {
    parseJson: true
  }),
  runStep('foundation-decision-check', npmCmd, ['run', '--silent', 'agent:foundation:decision', '--', '--check'], {
    parseJson: true
  }),
  runStep('masterdata-readfirst-check', npmCmd, ['run', '--silent', 'agent:masterdata:readfirst:check'], {
    parseJson: true
  }),
  runStep('encoding', npmCmd, ['run', '--silent', 'check:encoding'], { keepStdout: true }),
  runStep('target-075-guarded-list', npmCmd, ['run', '--silent', 'fibu:target:foundation-consistency-pilot', '--', '--list'], {
    keepStdout: true
  })
];

const failed = steps.filter((step) => !step.ok);
const freezeStatus = steps.find((step) => step.id === 'freeze-status')?.parsedJson;
const contextLiveGate = steps.find((step) => step.id === 'context-live-gate')?.parsedJson;
const qualityAudit = steps.find((step) => step.id === 'quality-audit')?.parsedJson;
const readiness = steps.find((step) => step.id === 'target-075-readiness')?.parsedJson;
const authCheck = steps.find((step) => step.id === 'auth-state-check')?.parsedJson;
const authDoctor = steps.find((step) => step.id === 'auth-doctor')?.parsedJson;
const target075SafeCheck = steps.find((step) => step.id === 'target-075-safe-check')?.parsedJson;
const foundationDecisionCheck = steps.find((step) => step.id === 'foundation-decision-check')?.parsedJson;
const masterDataReadFirstCheck = steps.find((step) => step.id === 'masterdata-readfirst-check')?.parsedJson;
const qualityRiskIds = (qualityAudit?.risks ?? []).map((risk) => risk.id);
const authDoctorStoredAuthOk = authDoctor?.authCheck?.canUseStoredAuth === true;
const authDoctorTargetOk =
  authDoctor?.authTarget?.canBuildTargetUrl === true &&
  authDoctor?.authTarget?.targetMatchesState === true &&
  authDoctor?.authTarget?.targetBuiltFromCurrentState === true &&
  authDoctor?.authTarget?.targetEnvironment === 'playthru' &&
  authDoctor?.authTarget?.targetCompany === 'UNIVERSAARL-DE';
const localResumeReady =
  failed.length === 0 &&
  readiness?.canProceedAfterFreezeLift === true &&
  authCheck?.canUseStoredAuth === true &&
  authDoctorStoredAuthOk &&
  authDoctorTargetOk &&
  target075SafeCheck?.canResumeAfterFreezeLift === true;
const freezeActive = freezeStatus?.freezeActive === true;
const liveGateAllowsNow = authDoctor?.canRunBusinessCentralWorkflows === true;
const liveGateBlockedBy = authDoctor?.liveGate?.blockedBy ?? [];
const requiresLiveGateLift = liveGateBlockedBy.length > 0 || (localResumeReady && !liveGateAllowsNow);
const operatorDecisionRequired = localResumeReady && !liveGateAllowsNow;
const missingForLiveRun = operatorDecisionRequired ? liveGateBlockedBy : [];
const safeLivePilotCommand =
  selectedNextCase === 'PWS-FF-002-GENERAL-POSTING-SETUP-READFIRST-RECOVERY'
    ? 'npm run fibu:pws:ff002:general-posting-setup -- --live-approved'
    : selectedNextCase === 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK'
      ? 'npm run fibu:target:foundation-consistency-pilot -- --live-approved'
      : null;
const requiresSecondOverrideWhileFreezeActive =
  freezeActive && selectedNextCase === 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK';
const explicitFreezeOverrideEnv = requiresSecondOverrideWhileFreezeActive ? 'TARGET_075_FREEZE_OVERRIDE_APPROVED=1' : null;

const warnings = [];
if (qualityRiskIds.includes('narrow-tsconfig')) {
  warnings.push('tsconfig is still intentionally not treated as full project health proof.');
}
if (qualityRiskIds.includes('auth-check-not-enforced')) {
  warnings.push(
    authCheck?.canUseStoredAuth === true
      ? 'Stored auth was checked locally; TARGET-075 must still validate the live Business Central shell after freeze lift.'
      : 'Stored auth is not usable; refresh Playwright auth before any live resume.'
  );
}
if (qualityRiskIds.includes('playwright-flake-surface')) {
  warnings.push('Legacy Playwright risk surface remains; TARGET-075 stays read-only.');
}
if ((authCheck?.warnings ?? []).includes('storage-state-expires-soon')) {
  warnings.push('Stored auth is usable but close to the freshness limit; refresh it before long unattended Business Central work.');
}
if ((authCheck?.blockedBy ?? []).includes('storage-state-expires-before-required-window')) {
  warnings.push(
    `Stored auth does not meet the requested ${minAuthExpiresInHours}h minimum window; refresh it before unattended Business Central work.`
  );
}
if (
  Number.isFinite(minAuthExpiresInHours) &&
  Number.isFinite(authCheck?.expiresInHours) &&
  authCheck.expiresInHours >= minAuthExpiresInHours &&
  authCheck.expiresInHours < minAuthExpiresInHours + 1
) {
  warnings.push(
    `Stored auth meets the requested ${minAuthExpiresInHours}h minimum window with less than 1h buffer; refresh it before longer unattended Business Central work.`
  );
}
if (authDoctor?.decision === 'stored-auth-usable-but-live-gate-blocked') {
  warnings.push('Stored auth is usable, but the active live gate still blocks Business Central/Playwright execution.');
}

const output = {
  schemaVersion: 1,
  purpose: 'autopilot-resume-check',
  caseId: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
  selectedNextCase,
  authMinExpiresInHours: minAuthExpiresInHours,
  canResumeAfterFreezeLift: localResumeReady,
  canResumeAfterFreezeLiftMeaning:
    target075SafeCheck?.canResumeAfterFreezeLiftMeaning ??
    'local-readiness-auth-target-and-runtime-target-url-only; Business Central/Playwright execution still requires the active live gate to clear',
  canRunNow: localResumeReady && liveGateAllowsNow,
  freezeActive,
  requiresFreezeLift: freezeActive,
  requiresLiveGateLift,
  liveGateBlockedBy,
  operatorDecisionRequired,
  missingForLiveRun,
  safeLivePilotCommand,
  requiresSecondOverrideWhileFreezeActive,
  explicitFreezeOverrideEnv,
  decisionBoundary:
    operatorDecisionRequired
      ? `All local gates are green. The remaining blocker is an intentional operator/project decision to lift the live gate for ${selectedNextCase || 'the selected read-first case'}.`
      : 'No operator freeze/live decision is currently blocking the local resume check.',
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  authStateChecked: true,
  authSecretsPrinted: false,
  steps: steps.map((step) => ({
    id: step.id,
    ok: step.ok,
    exitCode: step.exitCode,
    commandError: step.commandError,
    parseError: step.parseError,
    stderrParseError: step.stderrParseError,
    parsedJsonSource: step.parsedJsonSource,
    stdoutTail: step.stdoutTail,
    stderrTail: step.stderrTail
  })),
  qualityAuditSummary: qualityAudit
    ? {
        filesScanned: qualityAudit.filesScanned,
        tsFilesInRepo: qualityAudit.tsFilesInRepo,
        tsconfigFileCount: qualityAudit.tsconfigFileCount,
        counts: qualityAudit.counts,
        risks: qualityAudit.risks
      }
    : null,
  contextLiveGate: contextLiveGate
    ? {
        ok: contextLiveGate.ok === true,
        activeCase: contextLiveGate.details?.activeCase,
        businessCentralLiveAllowed: contextLiveGate.details?.businessCentralLiveAllowed,
        authDecision: contextLiveGate.details?.authDecision,
        canRunBusinessCentralWorkflows: contextLiveGate.details?.canRunBusinessCentralWorkflows
      }
    : null,
  target075Readiness: readiness
    ? {
        canProceedAfterFreezeLift: readiness.canProceedAfterFreezeLift,
        errors: readiness.errors,
        warnings: readiness.warnings,
        nextStep: readiness.nextStep
      }
    : null,
  target075SafeCheck: target075SafeCheck
    ? {
        canResumeAfterFreezeLift: target075SafeCheck.canResumeAfterFreezeLift,
        canResumeAfterFreezeLiftMeaning: target075SafeCheck.canResumeAfterFreezeLiftMeaning,
        canRunNow: target075SafeCheck.canRunNow,
        freezeActive: target075SafeCheck.freezeActive,
        requiresFreezeLift: target075SafeCheck.requiresFreezeLift,
        requiresLiveGateLift: target075SafeCheck.requiresLiveGateLift,
        requiresFreezeOverrideWhenFreezeActive: target075SafeCheck.requiresFreezeOverrideWhenFreezeActive,
        requiresTargetFix: target075SafeCheck.requiresTargetFix === true,
        targetUrlReady: target075SafeCheck.targetUrlReady === true,
        targetUrlPassedToLiveSpec: target075SafeCheck.targetUrlPassedToLiveSpec === true,
        authStateChecked: target075SafeCheck.authStateChecked,
        authSecretsPrinted: target075SafeCheck.authSecretsPrinted,
        expectedInstance: target075SafeCheck.expectedInstance,
        expectedCompany: target075SafeCheck.expectedCompany,
        authAgeHours: target075SafeCheck.authAgeHours,
        authMaxAgeHours: target075SafeCheck.authMaxAgeHours,
        authExpiresInHours: target075SafeCheck.authExpiresInHours,
        authWarnExpiresInHours: target075SafeCheck.authWarnExpiresInHours,
        authWarnings: target075SafeCheck.authWarnings ?? [],
        authTarget: target075SafeCheck.authDoctor?.authTarget ?? null,
        blockedBy: target075SafeCheck.blockedBy
      }
    : null,
  foundationDecisionCheck: foundationDecisionCheck
    ? {
        canWrite: foundationDecisionCheck.canWrite,
        resultMissing: foundationDecisionCheck.resultMissing === true,
        resultPath: foundationDecisionCheck.resultPath,
        decisionPath: foundationDecisionCheck.decisionPath,
        errors: foundationDecisionCheck.errors ?? [],
        warnings: foundationDecisionCheck.warnings ?? [],
        nextStep: foundationDecisionCheck.nextStep
      }
    : null,
  masterDataReadFirstCheck: masterDataReadFirstCheck
    ? {
        ok: masterDataReadFirstCheck.ok === true,
        allPrepared: masterDataReadFirstCheck.allPrepared === true,
        anyUnexpectedLiveReady: masterDataReadFirstCheck.anyUnexpectedLiveReady === true,
        blockedByLiveGateOrFoundation: masterDataReadFirstCheck.blockedByLiveGateOrFoundation === true,
        checks: (masterDataReadFirstCheck.checks ?? []).map((check) => ({
          id: check.id,
          runnerOk: check.runnerOk,
          canRunNow: check.canRunNow,
          blockedBy: check.blockedBy
        })),
        nextStep: masterDataReadFirstCheck.nextStep
      }
    : null,
  authDoctor: authDoctor
    ? {
        decision: authDoctor.decision,
        canRunBusinessCentralWorkflows: authDoctor.canRunBusinessCentralWorkflows,
        operatorActionRequired: authDoctor.operatorActionRequired,
        authCheck: authDoctor.authCheck
          ? {
              canUseStoredAuth: authDoctor.authCheck.canUseStoredAuth,
              expectedInstance: authDoctor.authCheck.expectedInstance,
              expectedCompany: authDoctor.authCheck.expectedCompany,
              ageHours: authDoctor.authCheck.ageHours,
              maxAgeHours: authDoctor.authCheck.maxAgeHours,
              profileExists: authDoctor.authCheck.profileExists
            }
          : null,
        authTargetOk: authDoctorTargetOk,
        authTarget: authDoctor.authTarget ?? null,
        liveGate: authDoctor.liveGate,
        nextSafeAction: authDoctor.nextSafeAction
      }
    : null,
  freezeStatus: freezeStatus
    ? {
        freezeActive: freezeStatus.freezeActive,
        frozenLiveCase: freezeStatus.frozenLiveCase,
        resumeCandidateAfterFreeze: freezeStatus.resumeCandidateAfterFreeze,
        errors: freezeStatus.errors,
        warnings: freezeStatus.warnings
      }
    : null,
  authState: authCheck
    ? {
        canUseStoredAuth: authCheck.canUseStoredAuth,
        ageHours: authCheck.ageHours,
        maxAgeHours: authCheck.maxAgeHours,
        expiresInHours: authCheck.expiresInHours,
        minWindowBufferHours:
          Number.isFinite(minAuthExpiresInHours) && Number.isFinite(authCheck.expiresInHours)
            ? Number((authCheck.expiresInHours - minAuthExpiresInHours).toFixed(3))
            : null,
        warnExpiresInHours: authCheck.warnExpiresInHours,
        warnings: authCheck.warnings ?? [],
        expectedInstance: authCheck.expectedInstance,
        expectedCompany: authCheck.expectedCompany,
        shellValidationMeta: authCheck.shellValidationMeta
          ? {
              generatedAt: authCheck.shellValidationMeta.generatedAt,
              host: authCheck.shellValidationMeta.host,
              environment: authCheck.shellValidationMeta.environment,
              company: authCheck.shellValidationMeta.company,
              matchedShellSignal: authCheck.shellValidationMeta.matchedShellSignal
            }
          : null,
        blockedBy: authCheck.blockedBy
      }
    : null,
  warnings,
  errors: [
    ...failed.map((step) => `${step.id} failed with exit code ${step.exitCode}`),
    ...(authDoctor && !authDoctorStoredAuthOk ? ['auth-doctor did not confirm usable stored auth'] : []),
    ...(authDoctor && !authDoctorTargetOk
      ? ['auth-doctor did not confirm target URL can be built from current state for playthru / UNIVERSAARL-DE']
      : [])
  ],
  nextStep: !localResumeReady
    ? 'Fix failed local resume checks before considering the selected read-first Foundation case.'
    : !liveGateAllowsNow
      ? `Local resume checks passed, including stored auth, but the active live gate still blocks Business Central/Playwright execution. Do not run ${selectedNextCase || 'the selected read-first case'} until explicit freeze/live-gate lift.`
      : safeLivePilotCommand
        ? `All local resume checks passed, including stored auth. Run ${selectedNextCase} only with live shell/context validation.`
        : `All local resume checks passed, including stored auth. ${selectedNextCase || 'The selected read-first Foundation case'} still needs its own guarded runner/spec before live execution; do not rerun TARGET-075 as a substitute.`
};

console.log(JSON.stringify(output, null, 2));

if (
  failed.length ||
  readiness?.canProceedAfterFreezeLift !== true ||
  authCheck?.canUseStoredAuth !== true ||
  !authDoctorStoredAuthOk ||
  !authDoctorTargetOk ||
  target075SafeCheck?.canResumeAfterFreezeLift !== true
) {
  process.exitCode = 1;
}
