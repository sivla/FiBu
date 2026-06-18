import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function requireArray(value, label, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  return value;
}

const routingPath = '.agent/model-routing.json';
const schemaPath = '.agent/schemas/model-routing.schema.json';
const exampleLogPath = '.agent/state/model_usage_log.example.jsonl';

const errors = [];

for (const path of [routingPath, schemaPath, exampleLogPath]) {
  if (!existsSync(path)) {
    errors.push(`missing required file: ${path}`);
  }
}

const routing = readJson(routingPath);
const schema = readJson(schemaPath);

for (const field of schema.requiredTopLevelFields ?? []) {
  if (!(field in routing)) {
    errors.push(`${routingPath}.${field} is required`);
  }
}

const taskClasses = routing.taskClasses ?? {};
const modelClasses = new Set(requireArray(routing.modelClasses, 'modelClasses', errors));

for (const taskClass of schema.requiredTaskClasses ?? []) {
  const task = taskClasses[taskClass];
  if (!task) {
    errors.push(`missing task class: ${taskClass}`);
    continue;
  }

  for (const field of schema.requiredTaskClassFields ?? []) {
    if (!(field in task)) {
      errors.push(`${taskClass}.${field} is required`);
    }
  }

  if (!isNonEmptyString(task.roleName)) {
    errors.push(`${taskClass}.roleName must be a non-empty string`);
  }
  if (!isNonEmptyString(task.purpose)) {
    errors.push(`${taskClass}.purpose must be a non-empty string`);
  }

  const expectedModels = new Set(schema.allowedModelsByTaskClass?.[taskClass] ?? []);
  const allowedModels = requireArray(task.allowedModels, `${taskClass}.allowedModels`, errors);
  for (const model of allowedModels) {
    if (!modelClasses.has(model)) {
      errors.push(`${taskClass}.allowedModels contains unknown model: ${model}`);
    }
    if (!expectedModels.has(model)) {
      errors.push(`${taskClass}.allowedModels contains disallowed model for class: ${model}`);
    }
  }

  if (!expectedModels.has(task.defaultModel)) {
    errors.push(`${taskClass}.defaultModel is not allowed for this task class: ${task.defaultModel}`);
  }

  const subagentSpawn = task.subagentSpawn ?? {};
  for (const field of schema.requiredSubagentSpawnFields ?? []) {
    if (!(field in subagentSpawn)) {
      errors.push(`${taskClass}.subagentSpawn.${field} is required`);
    }
  }

  if (subagentSpawn.mustSetModelOverride !== true) {
    errors.push(`${taskClass}.subagentSpawn.mustSetModelOverride must be true`);
  }
  if (subagentSpawn.doNotInheritParentModel !== true) {
    errors.push(`${taskClass}.subagentSpawn.doNotInheritParentModel must be true`);
  }

  const allowedSpawnModels = new Set(schema.allowedSpawnModels ?? []);
  if (!allowedSpawnModels.has(subagentSpawn.spawnModel)) {
    errors.push(`${taskClass}.subagentSpawn.spawnModel is not allowed: ${subagentSpawn.spawnModel}`);
  }

  const allowedReasoningEfforts = requireArray(
    subagentSpawn.allowedReasoningEfforts,
    `${taskClass}.subagentSpawn.allowedReasoningEfforts`,
    errors,
  );
  const expectedReasoningEfforts = schema.allowedReasoningEfforts ?? [];
  for (const effort of expectedReasoningEfforts) {
    if (!allowedReasoningEfforts.includes(effort)) {
      errors.push(`${taskClass}.subagentSpawn.allowedReasoningEfforts must include ${effort}`);
    }
  }
  if (!allowedReasoningEfforts.includes(subagentSpawn.reasoningEffort)) {
    errors.push(`${taskClass}.subagentSpawn.reasoningEffort must be one of allowedReasoningEfforts`);
  }
}

if (routing.defaultTaskClass !== 'monkey_work') {
  errors.push('defaultTaskClass must be monkey_work');
}

const bigBrain = taskClasses.big_brain_review;
if (bigBrain) {
  if (bigBrain.defaultModel !== 'gpt-5.5-high') {
    errors.push('big_brain_review.defaultModel must be gpt-5.5-high');
  }
  if (bigBrain.maxUsesPerMajorRun !== 1) {
    errors.push('big_brain_review.maxUsesPerMajorRun must be 1');
  }
}

for (const [taskClass, task] of Object.entries(taskClasses)) {
  const usesHigh = task.allowedModels?.includes('gpt-5.5-high');
  if (usesHigh && taskClass !== 'big_brain_review') {
    errors.push(`gpt-5.5-high is only allowed in big_brain_review, found in ${taskClass}`);
  }
}

const usageLog = routing.usageLog ?? {};
const subagentPolicy = routing.subagentPolicy ?? {};
const allowedPolicySpawnModels = requireArray(
  subagentPolicy.allowedSpawnModels,
  'subagentPolicy.allowedSpawnModels',
  errors,
);
for (const model of allowedPolicySpawnModels) {
  if (!(schema.allowedSpawnModels ?? []).includes(model)) {
    errors.push(`subagentPolicy.allowedSpawnModels contains unknown spawn model: ${model}`);
  }
}

if (taskClasses.monkey_work?.subagentSpawn?.spawnModel !== 'gpt-5.4-mini') {
  errors.push('monkey_work subagents must spawn with gpt-5.4-mini');
}
if (taskClasses.wizard_work?.subagentSpawn?.spawnModel !== 'gpt-5.4') {
  errors.push('wizard_work subagents must spawn with gpt-5.4');
}
if (taskClasses.judge_work?.subagentSpawn?.spawnModel !== 'gpt-5.5') {
  errors.push('judge_work subagents must spawn with gpt-5.5');
}
if (taskClasses.big_brain_review?.subagentSpawn?.spawnModel !== 'gpt-5.5') {
  errors.push('big_brain_review subagents must spawn with gpt-5.5');
}

const requiredForTaskClasses = requireArray(
  usageLog.requiredForTaskClasses,
  'usageLog.requiredForTaskClasses',
  errors,
);
for (const taskClass of ['judge_work', 'big_brain_review']) {
  if (!requiredForTaskClasses.includes(taskClass)) {
    errors.push(`usageLog.requiredForTaskClasses must include ${taskClass}`);
  }
  if (taskClasses[taskClass]?.usageLogRequired !== true) {
    errors.push(`${taskClass}.usageLogRequired must be true`);
  }
}

const exampleLines = readFileSync(resolve(exampleLogPath), 'utf8')
  .split(/\r?\n/)
  .filter((line) => line.trim() !== '');
const requiredLogFields = requireArray(usageLog.requiredFields, 'usageLog.requiredFields', errors);

for (const [index, line] of exampleLines.entries()) {
  let entry;
  try {
    entry = JSON.parse(line);
  } catch (error) {
    errors.push(`${exampleLogPath}:${index + 1}: ${error.message}`);
    continue;
  }
  for (const field of requiredLogFields) {
    if (!(field in entry)) {
      errors.push(`${exampleLogPath}:${index + 1}: missing ${field}`);
    }
  }
  if (!requiredForTaskClasses.includes(entry.taskClass)) {
    errors.push(`${exampleLogPath}:${index + 1}: taskClass should demonstrate a logged class`);
  }
  if (!taskClasses[entry.taskClass]?.allowedModels?.includes(entry.chosenModelClass)) {
    errors.push(`${exampleLogPath}:${index + 1}: chosenModelClass is not allowed for ${entry.taskClass}`);
  }
}

if (errors.length) {
  console.error(`Agent model routing check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('Agent model routing check OK');
