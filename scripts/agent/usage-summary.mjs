import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function readJsonl(path) {
  if (!existsSync(path)) {
    return [];
  }

  return readFileSync(resolve(path), 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${path}:${index + 1}: ${error.message}`);
      }
    });
}

const routing = readJson('.agent/model-routing.json');
const usageLogPath = routing.usageLog?.path ?? '.agent/state/model_usage_log.jsonl';
const entries = readJsonl(usageLogPath);

const summary = {
  schemaVersion: 1,
  purpose: 'model-usage-summary',
  usageLogPath,
  entries: entries.length,
  byTaskClass: {},
  byModelClass: {},
  byReasoningEffort: {},
  outcomeCounts: {},
  highImpactReviews: 0,
  strongModelUses: 0,
  followupRequired: 0,
  totals: {
    filesRead: 0,
    skillsLoaded: 0,
  },
  efficiency: {
    strongModelUseRate: 0,
    followupRate: 0,
    averageFilesRead: 0,
    averageSkillsLoaded: 0,
  },
  recommendations: [],
  status: entries.length ? 'usage-data-available' : 'no-usage-log-yet',
};

for (const entry of entries) {
  summary.byTaskClass[entry.taskClass] = (summary.byTaskClass[entry.taskClass] ?? 0) + 1;
  summary.byModelClass[entry.chosenModelClass] = (summary.byModelClass[entry.chosenModelClass] ?? 0) + 1;
  summary.byReasoningEffort[entry.reasoningEffort] =
    (summary.byReasoningEffort[entry.reasoningEffort] ?? 0) + 1;
  summary.outcomeCounts[entry.actualOutcome] = (summary.outcomeCounts[entry.actualOutcome] ?? 0) + 1;
  summary.totals.filesRead += Number.isInteger(entry.filesRead) ? entry.filesRead : 0;
  summary.totals.skillsLoaded += Number.isInteger(entry.skillsLoaded) ? entry.skillsLoaded : 0;
  if (entry.followupRequired === true) {
    summary.followupRequired += 1;
  }
  if (['judge_work', 'big_brain_review'].includes(entry.taskClass)) {
    summary.strongModelUses += 1;
  }
  if (entry.chosenModelClass === 'gpt-5.5-high') {
    summary.highImpactReviews += 1;
  }
}

if (entries.length) {
  summary.efficiency.strongModelUseRate = Number((summary.strongModelUses / entries.length).toFixed(3));
  summary.efficiency.followupRate = Number((summary.followupRequired / entries.length).toFixed(3));
  summary.efficiency.averageFilesRead = Number((summary.totals.filesRead / entries.length).toFixed(2));
  summary.efficiency.averageSkillsLoaded = Number((summary.totals.skillsLoaded / entries.length).toFixed(2));
}

if (summary.highImpactReviews > 1) {
  summary.status = 'check-required-too-many-big-brain-reviews';
}

if (!entries.length) {
  summary.recommendations.push('Start logging judge_work and big_brain_review outcomes before drawing efficiency conclusions.');
} else {
  if (summary.efficiency.strongModelUseRate > 0.25) {
    summary.recommendations.push('Strong model use is high; check whether some judge_work can become wizard_work after capability hardening.');
  }
  if (summary.efficiency.followupRate > 0.35) {
    summary.recommendations.push('Follow-up rate is high; improve task scoping or route earlier to a stronger role.');
  }
  if (summary.efficiency.averageFilesRead > 8) {
    summary.recommendations.push('Average files read exceeds budget; tighten context-pack and mustRead lists.');
  }
}

console.log(JSON.stringify(summary, null, 2));
