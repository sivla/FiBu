import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function firstItems(value, limit) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function readJsonIfExists(path) {
  if (!path || !existsSync(path)) {
    return null;
  }

  return readJson(path);
}

function buildAuthGate(current, activeCase, liveBlocked) {
  const activeAuthRefreshResultPath = 'playwright/projects/fibu-book5/evidence/auth-bc-refresh-active-resume/AUTH-BC-REFRESH-result.json';
  const joinedActions = [
    ...(activeCase.allowedActions ?? []),
    ...(current.allowedActions ?? []),
    ...(activeCase.forbiddenActions ?? []),
    ...(current.forbiddenActions ?? []),
  ].join(' ').toLowerCase();
  const authRelevant =
    current.activeCase?.toLowerCase().includes('auth') ||
    activeCase.caseId?.toLowerCase().includes('auth') ||
    joinedActions.includes('auth') ||
    joinedActions.includes('business-central');

  const latestResolution = current.latestAuthGateResolution ?? activeCase.latestAuthGateResolution ?? {};
  const resolutionCanUseStoredAuth = latestResolution.canUseStoredAuth === true;
  const resultPath =
    (existsSync(resolve(activeAuthRefreshResultPath)) ? activeAuthRefreshResultPath : null) ??
    latestResolution.resultPath ??
    current.latestAuthRefreshResult ??
    current.latestAuthResultWriter?.lastResultPath ??
    current.latestTarget027D31AuthRefreshResult ??
    activeCase.latestAuthSetupResultWriter?.resultPath ??
    activeCase.latestDoctor?.lastAuthRefreshResult;
  const latestResult = readJsonIfExists(resultPath);
  const latestWriter = current.latestAuthResultWriter ?? activeCase.latestAuthSetupResultWriter ?? {};
  const latestDoctor = current.latestAuthDoctor ?? activeCase.latestDoctor ?? {};
  const latestTarget = current.latestAuthTargetDiagnosis ?? activeCase.latestAuthTargetDiagnosis ?? {};
  const operatorActionRequired = resolutionCanUseStoredAuth
    ? false
    : latestWriter.operatorActionRequired === true ||
      latestResult?.operatorActionRequired === true ||
      latestDoctor.decision === 'operator-must-complete-playwright-auth-window';
  const blockedBy = resolutionCanUseStoredAuth
    ? []
    : [
      ...(latestResult?.blockedBy ?? []),
      ...(latestResult?.blockedByAuth ?? []),
      ...(latestWriter.blockedBy ?? []),
    ];

  if (!authRelevant && !operatorActionRequired && blockedBy.length === 0) {
    return null;
  }

  const detachedCaptureAvailable =
    current.latestDetachedAuthHandoffLaunch?.result === 'detached-playwright-profile-window-launched' ||
    existsSync(resolve('playwright/.auth/bc-profile'));
  const detachedCaptureStep =
    'Complete Login/MFA in the detached Playwright profile browser if it is still open, wait for Business Central shell, close that browser, then run npm run auth:bc:capture-detached and, if clear, npm run auth:bc:capture-detached -- --confirm. Finish with npm run auth:bc:check.';
  const nextSafeAction = (resolutionCanUseStoredAuth && liveBlocked
    ? latestDoctor.nextSafeAction ??
      'Stored auth is usable, but Business Central live work remains blocked by the active live gate. Use only local planning/checks until the freeze is lifted or an explicit case override is approved.'
    : resolutionCanUseStoredAuth
    ? current.nextStep ?? activeCase.nextStep
    : detachedCaptureAvailable
    ? detachedCaptureStep
    : [
    latestDoctor.nextSafeAction,
    latestResult?.nextSafeAction,
    latestWriter.operatorAction,
    activeCase.nextStep,
    current.nextStep,
  ].find((value) => typeof value === 'string' && value.length > 0))
    ?.replaceAll('npm run auth:bc:interactive', 'npm run auth:bc:open-login');

  return {
    requiresAuth: authRelevant,
    canRunBusinessCentralWorkflows:
      !liveBlocked && (resolutionCanUseStoredAuth || latestDoctor.canRunBusinessCentralWorkflows === true),
    operatorActionRequired,
    decision: resolutionCanUseStoredAuth && liveBlocked
      ? 'stored-auth-usable-but-live-gate-blocked'
      : resolutionCanUseStoredAuth
      ? 'stored-auth-usable-run-readonly-or-gated-target-tests'
      : latestDoctor.decision ??
      (operatorActionRequired ? 'operator-must-complete-playwright-auth-window' : undefined),
    nextSafeAction,
    preferredAuthHandoff: resolutionCanUseStoredAuth
      ? 'stored-auth'
      : detachedCaptureAvailable ? 'detached-capture' : 'bounded-open-login',
    blockedBy: firstItems([...new Set(blockedBy)], 8),
    resultPath,
    target: {
      instance: latestResolution.shellValidationMeta?.environment ?? latestTarget.targetEnvironment ?? current.instance,
      company: latestResolution.shellValidationMeta?.company ?? latestTarget.targetCompany ?? current.company,
      targetMatchesState: resolutionCanUseStoredAuth ? true : latestTarget.targetMatchesState,
    },
    normalBrowserLoginIsNotEnough: !resolutionCanUseStoredAuth && (
      latestDoctor.operatorAction?.normalBrowserLoginIsNotEnough === true ||
      latestResult?.operatorAction?.normalBrowserLoginIsNotEnough === true ||
      latestWriter.operatorActionRequired === true),
  };
}

function chooseTaskClass(current, activeCase) {
  if (typeof activeCase.taskClass === 'string' && activeCase.taskClass.length > 0) {
    return activeCase.taskClass;
  }

  if (current.requiresStrongModel === true) {
    return 'judge_work';
  }

  const workType = `${activeCase.workType ?? ''} ${current.mode ?? ''}`.toLowerCase();
  const joinedActions = [
    ...(activeCase.allowedActions ?? []),
    ...(current.allowedActions ?? []),
  ].join(' ').toLowerCase();

  if (
    workType.includes('posting') ||
    workType.includes('setup') ||
    joinedActions.includes('posting') ||
    joinedActions.includes('setup')
  ) {
    return 'judge_work';
  }

  if (
    workType.includes('helper') ||
    workType.includes('tool') ||
    joinedActions.includes('helper-analysis') ||
    joinedActions.includes('static-helper-analysis')
  ) {
    return 'wizard_work';
  }

  return 'monkey_work';
}

const current = readJson('.agent/state/current.json');
const project = readJson('.agent/state/project_state.json');
const coverage = readJson('.agent/state/coverage_state.json');
const lastRun = readJson('.agent/state/last_run_summary.json');
const routing = readJson('.agent/model-routing.json');
const capabilityRegistry = readJson('.agent/capabilities.json');
const budgets = readJson('.agent/budgets.json');

if (!existsSync(current.active_case_file)) {
  throw new Error(`active case file not found: ${current.active_case_file}`);
}

const activeCase = readJson(current.active_case_file);
const budgetProfileName = activeCase.budgetProfile ?? budgets.defaults?.budgetProfile ?? 'standard';
const budgetProfile = budgets.budgetProfiles?.[budgetProfileName] ?? budgets.defaults ?? {};
const taskClass = chooseTaskClass(current, activeCase);
const route = routing.taskClasses?.[taskClass];

if (!route) {
  throw new Error(`model route not found for task class: ${taskClass}`);
}

const recommendedSkills = firstItems(activeCase.recommendedSkills, 3);
const recommendedCapabilities = capabilityRegistry.capabilities
  ?.filter((capability) =>
    capability.taskClass === taskClass ||
    capability.linkedSkills?.some((skill) => recommendedSkills.includes(skill)))
  .slice(0, 5)
  .map((capability) => ({
    id: capability.id,
    maturity: capability.maturity,
    taskClass: capability.taskClass,
  })) ?? [];

const activeAreaCoverage = coverage.areas?.[current.activeArea] ?? {};
const bookScreenshots = activeAreaCoverage.bookScreenshots ?? {};
const bookScreenshotValues = Object.values(bookScreenshots);
const openProofs = bookScreenshotValues.filter((value) => value === 'open').length;
const availableProofs = bookScreenshotValues.filter((value) =>
  typeof value === 'string' && value.includes('available')).length;
const freezeActive =
  current.freezeStatus?.status === 'active' ||
  current.activeArea === 'project-improvement-freeze' ||
  current.mode === 'project-improvement-freeze';
const liveBlocked =
  freezeActive ||
  new Set([...(current.forbiddenActions ?? []), ...(activeCase.forbiddenActions ?? [])]).has('open-business-central-live');
const liveGate = {
  businessCentralLiveAllowed: !liveBlocked,
  freezeActive,
  blockedBy: [
    ...(freezeActive ? ['improvement-freeze-active'] : []),
    ...(
      new Set([...(current.forbiddenActions ?? []), ...(activeCase.forbiddenActions ?? [])]).has('open-business-central-live')
        ? ['open-business-central-live-forbidden']
        : []
    ),
  ],
  parkedCase: current.freezeStatus?.frozenLiveCase,
  resumeCandidate: current.freezeStatus?.resumeCandidateAfterFreeze ?? current.nextCase,
  nextLiveType: current.implementationOperatingSystem?.currentLiveBoundary?.resumePilotMode,
};
const authGate = buildAuthGate(current, activeCase, liveBlocked);

const contextPack = {
  schemaVersion: 1,
  purpose: 'compact-autopilot-context',
  branchExpected: current.branchExpected,
  instance: current.instance,
  company: current.company,
  project: project.primaryProject,
  activeArea: current.activeArea,
  activeCase: current.activeCase,
  activeCaseFile: current.active_case_file,
  lastReferenceCase: current.lastReferenceCase,
  workType: activeCase.workType ?? lastRun.workType,
  selectedTaskClass: taskClass,
  selectedRole: route.roleName,
  defaultModelClass: route.defaultModel,
  usageLogRequired: route.usageLogRequired,
  efficiencyMetrics: {
    mustReadCount: firstItems(activeCase.mustRead, 99).length,
    recommendedSkillCount: recommendedSkills.length,
    allowedActionCount: firstItems(activeCase.allowedActions ?? current.allowedActions, 99).length,
    forbiddenActionCount: firstItems(activeCase.forbiddenActions ?? current.forbiddenActions, 99).length,
    selectedTaskClass: taskClass,
    budgetProfile: budgetProfileName,
    maxFilesToReadPerRun: budgetProfile.maxFilesToReadPerRun,
    maxSkillsPerRun: budgetProfile.maxSkillsPerRun,
  },
  capabilityMaturity: {
    areaStatus: activeAreaCoverage.status,
    currentBlock: activeAreaCoverage.currentBlock,
    openProofs,
    availableProofs,
    finalProofOpen: activeAreaCoverage.finalGermanProof === 'open',
  },
  recommendedSkills,
  recommendedCapabilities,
  mustRead: firstItems(activeCase.mustRead, 8),
  allowedActions: firstItems(activeCase.allowedActions ?? current.allowedActions, 12),
  forbiddenActions: firstItems(activeCase.forbiddenActions ?? current.forbiddenActions, 16),
  acceptanceCriteria: firstItems(activeCase.acceptanceCriteria, 6),
  hardExclusions: coverage.hardExclusions ?? {},
  liveGate,
  ...(authGate ? { authGate } : {}),
  nextStep: current.nextStep ?? lastRun.nextStep,
};

console.log(JSON.stringify(contextPack, null, 2));
