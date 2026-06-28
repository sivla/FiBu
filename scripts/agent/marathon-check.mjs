import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function readJson(relativePath, fallback = undefined) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return fallback;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function normalize(value) {
  return String(value ?? '').toLowerCase();
}

function hasAnySignal(text, signals) {
  return signals.some((signal) => text.includes(normalize(signal)));
}

function collectPackages(current, lastRun) {
  const summaryPath =
    current?.latestDeepRun?.resultPath ??
    (lastRun?.resultPath?.includes('deep-run') ? lastRun.resultPath : undefined) ??
    'playwright/projects/fibu-book5/evidence/deep-run-001/DEEP-RUN-001-summary.json';
  const summary = readJson(summaryPath, undefined);
  const packages = Array.isArray(summary?.progressPackages) ? summary.progressPackages : [];
  return { summaryPath, summary, packages };
}

const marathon = readJson('.agent/state/marathon.json');
const marathonQueue = readJson('.agent/state/marathon_queue.json', {});
const current = readJson('.agent/state/current.json', {});
const lastRun = readJson('.agent/state/last_run_summary.json', {});

if (!marathon?.active) {
  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'autopilot-marathon-check',
        active: false,
        finalReportAllowed: true,
        reason: 'Marathon mode is inactive.'
      },
      null,
      2
    )
  );
  process.exit(0);
}

const { summaryPath, summary, packages } = collectPackages(current, lastRun);
const executeSignals = marathon.executePackageSignals ?? [];
const readOnlySignals = marathon.readOnlyPackageSignals ?? [];
const lightExecuteSignals = marathon.lightExecuteSignals ?? [];
const highImpactExecuteSignals = marathon.highImpactExecuteSignals ?? [];
const hardStopConditions = marathon.hardStopConditions ?? [];
const documentedHardStops = [
  ...(summary?.hardStopConditions ?? []),
  ...(summary?.hardStops ?? []),
  ...(lastRun?.hardStopConditions ?? []),
  ...(lastRun?.hardStops ?? [])
].map(normalize);

const packageClassifications = packages.map((entry) => {
  const text = normalize([entry.id, entry.type, entry.result, entry.signal, ...(entry.signals ?? [])].join(' '));
  const structuredSignalText = normalize([entry.id, entry.type, entry.signal, ...(entry.signals ?? [])].join(' '));
  const rawExecute =
    entry.execute === true ||
    entry.posted === true ||
    entry.previewPosting === true ||
    entry.setupChanged === true ||
    hasAnySignal(text, executeSignals);
  const readOnly =
    entry.execute === false ||
    hasAnySignal(text, readOnlySignals) ||
    /read.?only|route-comparison|readiness|sync|summary/.test(text);
  const execute = rawExecute && !(marathon.readOnlyDoesNotCountAsExecute && readOnly);
  const highImpact =
    execute &&
    (entry.highImpactExecute === true ||
      entry.posted === true ||
      entry.previewPosting === true ||
      entry.setupChanged === true ||
      hasAnySignal(structuredSignalText, highImpactExecuteSignals));
  const lightExecute =
    execute &&
    !highImpact &&
    (entry.lightExecute === true || hasAnySignal(text, lightExecuteSignals));
  return {
    id: entry.id ?? 'unknown',
    type: entry.type ?? '',
    execute,
    readOnly,
    lightExecute,
    highImpact
  };
});

const progressPackages = packageClassifications.length;
const executePackageEntries = packageClassifications.filter((entry) => entry.execute);
const executePackages = executePackageEntries.length;
const readOnlyPackages = packageClassifications.filter((entry) => entry.readOnly).length;
const lightExecutePackageEntries = executePackageEntries.filter((entry) => entry.lightExecute);
const highImpactPackageEntries = executePackageEntries.filter((entry) => entry.highImpact);
const lightExecutePackages = lightExecutePackageEntries.length;
const highImpactExecutePackages = highImpactPackageEntries.length;
const onlyReadOnlyOrSync = progressPackages > 0 && executePackages === 0;
const minProgressPackagesReached = progressPackages >= marathon.minProgressPackages;
const minExecutePackagesReached = executePackages >= marathon.minExecutePackages;
const minHighImpactExecutePackagesReached = highImpactExecutePackages >= (marathon.minHighImpactExecutePackages ?? 0);
const onlyLightExecute = executePackages > 0 && highImpactExecutePackages === 0 && lightExecutePackages === executePackages;
const nextBestLevers = Array.isArray(summary?.nextBestLevers) ? summary.nextBestLevers : [];
const nextExecuteLevers = nextBestLevers.length > 0 ? nextBestLevers : marathon.nextExecuteLevers ?? [];
const nextExecuteLeversExist = nextExecuteLevers.length > 0;
const queueItems = Array.isArray(marathonQueue?.items) ? marathonQueue.items : [];
const openQueueItems = queueItems
  .filter((entry) => ['pending', 'running'].includes(normalize(entry.status)))
  .sort((left, right) => (left.order ?? 9999) - (right.order ?? 9999));
const blockedQueueItems = queueItems.filter((entry) => normalize(entry.status) === 'blocked');
const doneQueueItems = queueItems.filter((entry) => normalize(entry.status) === 'done');
const nextQueueItem = openQueueItems[0] ?? null;
const queueNotEmpty = openQueueItems.length > 0;
const hardStopDocumented = documentedHardStops.some((stop) => hardStopConditions.map(normalize).includes(stop));
const finalReportAllowed =
  hardStopDocumented ||
  (minProgressPackagesReached &&
    minExecutePackagesReached &&
    minHighImpactExecutePackagesReached &&
    !onlyReadOnlyOrSync &&
    !(marathon.lightExecuteDoesNotCountAsHighImpact && onlyLightExecute) &&
    !(marathon.continueWhenNextExecuteLeversExist && nextExecuteLeversExist && highImpactExecutePackages === 0) &&
    !(marathon.queueMustBeEmptyOrHardStop && queueNotEmpty) &&
    !(marathon.finalReportAllowedOnlyWhenQueueEmpty && queueNotEmpty));

const output = {
  schemaVersion: 1,
  purpose: 'autopilot-marathon-check',
  active: true,
  mode: marathon.mode,
  instance: marathon.instance,
  summaryPath,
  progressPackages,
  executePackages,
  readOnlyPackages,
  lightExecutePackages,
  highImpactExecutePackages,
  highImpactPackageIds: highImpactPackageEntries.map((entry) => entry.id),
  minProgressPackages: marathon.minProgressPackages,
  minExecutePackages: marathon.minExecutePackages,
  minHighImpactExecutePackages: marathon.minHighImpactExecutePackages ?? 0,
  minProgressPackagesReached,
  minExecutePackagesReached,
  minHighImpactExecutePackagesReached,
  onlyReadOnlyOrSync,
  onlyLightExecute,
  nextBestLevers,
  nextExecuteLeversExist,
  queue: {
    active: marathonQueue?.active === true,
    total: queueItems.length,
    done: doneQueueItems.length,
    blocked: blockedQueueItems.length,
    open: openQueueItems.length,
    queueNotEmpty,
    nextQueueItem: nextQueueItem
      ? {
          id: nextQueueItem.id,
          order: nextQueueItem.order,
          status: nextQueueItem.status,
          category: nextQueueItem.category,
          expectedImpact: nextQueueItem.expectedImpact,
          evidenceTarget: nextQueueItem.evidenceTarget
        }
      : null
  },
  hardStopDocumented,
  finalReportAllowed,
  nextExecuteLever: nextExecuteLevers?.[0] ?? '',
  packageClassifications,
  reason: finalReportAllowed
    ? 'Marathon final report is allowed.'
    : hardStopDocumented
      ? 'Marathon final report is allowed because a hard stop was documented.'
      : queueNotEmpty
        ? 'queue-not-empty'
      : highImpactExecutePackages === 0
        ? 'Marathon final report is not allowed yet; only light execute/read-only progress exists and a high-impact execute lever remains.'
        : 'Marathon final report is not allowed yet; continue until the v2 progress, execute and high-impact thresholds are met.'
};

console.log(JSON.stringify(output, null, 2));
process.exit(finalReportAllowed ? 0 : 1);
