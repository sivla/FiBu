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
const hardStopConditions = marathon.hardStopConditions ?? [];
const documentedHardStops = [
  ...(summary?.hardStopConditions ?? []),
  ...(summary?.hardStops ?? []),
  ...(lastRun?.hardStopConditions ?? []),
  ...(lastRun?.hardStops ?? [])
].map(normalize);

const packageClassifications = packages.map((entry) => {
  const text = normalize([entry.id, entry.type, entry.result, entry.signal, ...(entry.signals ?? [])].join(' '));
  const execute =
    entry.execute === true ||
    entry.posted === true ||
    entry.previewPosting === true ||
    entry.setupChanged === true ||
    hasAnySignal(text, executeSignals);
  const readOnly =
    entry.execute === false ||
    hasAnySignal(text, readOnlySignals) ||
    /read.?only|route-comparison|readiness|sync|summary/.test(text);
  return {
    id: entry.id ?? 'unknown',
    type: entry.type ?? '',
    execute,
    readOnly
  };
});

const progressPackages = packageClassifications.length;
const executePackages = packageClassifications.filter((entry) => entry.execute && !(marathon.readOnlyDoesNotCountAsExecute && entry.readOnly)).length;
const readOnlyPackages = packageClassifications.filter((entry) => entry.readOnly).length;
const onlyReadOnlyOrSync = progressPackages > 0 && executePackages === 0;
const minProgressPackagesReached = progressPackages >= marathon.minProgressPackages;
const minExecutePackagesReached = executePackages >= marathon.minExecutePackages;
const hardStopDocumented = documentedHardStops.some((stop) => hardStopConditions.map(normalize).includes(stop));
const finalReportAllowed =
  hardStopDocumented ||
  (minProgressPackagesReached && minExecutePackagesReached && !onlyReadOnlyOrSync);

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
  minProgressPackages: marathon.minProgressPackages,
  minExecutePackages: marathon.minExecutePackages,
  minProgressPackagesReached,
  minExecutePackagesReached,
  onlyReadOnlyOrSync,
  hardStopDocumented,
  finalReportAllowed,
  nextExecuteLever: marathon.nextExecuteLevers?.[0] ?? '',
  packageClassifications,
  reason: finalReportAllowed
    ? 'Marathon final report is allowed.'
    : 'Marathon final report is not allowed yet; continue with the next execute lever.'
};

console.log(JSON.stringify(output, null, 2));
process.exit(finalReportAllowed ? 0 : 1);
