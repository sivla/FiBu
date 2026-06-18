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
  highImpactReviews: 0,
  status: entries.length ? 'usage-data-available' : 'no-usage-log-yet',
};

for (const entry of entries) {
  summary.byTaskClass[entry.taskClass] = (summary.byTaskClass[entry.taskClass] ?? 0) + 1;
  summary.byModelClass[entry.chosenModelClass] = (summary.byModelClass[entry.chosenModelClass] ?? 0) + 1;
  if (entry.chosenModelClass === 'gpt-5.5-high') {
    summary.highImpactReviews += 1;
  }
}

if (summary.highImpactReviews > 1) {
  summary.status = 'check-required-too-many-big-brain-reviews';
}

console.log(JSON.stringify(summary, null, 2));
