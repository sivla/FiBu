import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const skillsDir = resolve('.agent/skills');
const routingPath = resolve('.agent/model-routing.json');
const budgetPath = resolve('.agent/budgets.json');

const errors = [];
const warnings = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`${path}: ${error.message}`);
  }
}

function sectionValue(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return '';
  }

  const collected = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) {
      break;
    }
    collected.push(line);
  }
  return collected.join('\n').trim();
}

function bulletCount(section) {
  return section.split(/\r?\n/).filter((line) => line.trim().startsWith('- ')).length;
}

function numberFromSection(section) {
  const match = section.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.NaN;
}

function jsonBlock(section) {
  const match = section.match(/```json\s*([\s\S]*?)```/m);
  return match?.[1]?.trim() ?? '';
}

if (!existsSync(skillsDir)) {
  errors.push('missing required directory: .agent/skills');
}

const routing = readJson(routingPath);
const budgets = readJson(budgetPath);
const maxOutputTokens = budgets.defaults?.maxOutputTokensPerSkill ?? 1200;
const allowedModelsByTaskClass = new Map(
  Object.entries(routing.taskClasses ?? {}).map(([taskClass, route]) => [
    taskClass,
    new Set(route.allowedModels ?? []),
  ]),
);

const files = existsSync(skillsDir)
  ? readdirSync(skillsDir).filter((file) => file.endsWith('.md') && file !== 'SKILL-CONTRACT.md')
  : [];

for (const file of files) {
  const path = join(skillsDir, file);
  const text = readFileSync(path, 'utf8');
  const label = `.agent/skills/${file}`;
  const lines = text.split(/\r?\n/);

  if (lines.length > 110) {
    warnings.push(`${label}: ${lines.length} lines; consider splitting or tightening if it grows further`);
  }

  const inputs = sectionValue(text, '## Inputs');
  const stopIf = sectionValue(text, '## Stop if');
  const safetyGates = sectionValue(text, '## Safety gates');
  const rules = sectionValue(text, '## Rules');
  const taskClass = sectionValue(text, '## Preferred taskClass');
  const modelClass = sectionValue(text, '## Default model class');
  const maxContextLines = numberFromSection(sectionValue(text, '## Max context lines'));
  const skillOutputTokens = numberFromSection(sectionValue(text, '## Max output tokens'));
  const outputSchema = jsonBlock(sectionValue(text, '## Output JSON schema'));

  if (bulletCount(inputs) < 3) {
    errors.push(`${label}: Inputs should have at least 3 concrete bullets`);
  }
  if (bulletCount(stopIf) < 3) {
    errors.push(`${label}: Stop if should have at least 3 hard stop bullets`);
  }
  if (bulletCount(safetyGates) < 3) {
    errors.push(`${label}: Safety gates should have at least 3 gates`);
  }
  if (bulletCount(rules) < 3) {
    errors.push(`${label}: Rules should have at least 3 operational bullets`);
  }

  if (!Number.isFinite(maxContextLines) || maxContextLines <= 0 || maxContextLines > 300) {
    errors.push(`${label}: Max context lines must be a positive number <= 300`);
  }

  if (!Number.isFinite(skillOutputTokens) || skillOutputTokens <= 0 || skillOutputTokens > maxOutputTokens) {
    errors.push(`${label}: Max output tokens must be a positive number <= ${maxOutputTokens}`);
  }

  const allowedModels = allowedModelsByTaskClass.get(taskClass);
  if (!allowedModels) {
    errors.push(`${label}: Preferred taskClass is unknown: ${taskClass}`);
  } else if (!allowedModels.has(modelClass)) {
    errors.push(`${label}: Default model class ${modelClass} is not allowed for ${taskClass}`);
  }

  if (!outputSchema) {
    errors.push(`${label}: Output JSON schema block is empty`);
  } else {
    try {
      JSON.parse(outputSchema);
    } catch (error) {
      errors.push(`${label}: Output JSON schema is not valid JSON: ${error.message}`);
    }
  }

  if (/Business Central|BC/i.test(text) && !/MCP_1_20260210|instance|company/i.test(text)) {
    warnings.push(`${label}: BC-related skill should mention instance or company context`);
  }
}

if (warnings.length) {
  console.warn(`Agent skill quality warnings:\n- ${warnings.join('\n- ')}`);
}

if (errors.length) {
  console.error(`Agent skill quality check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Agent skill quality check OK (${files.length} skills, ${warnings.length} warnings)`);
