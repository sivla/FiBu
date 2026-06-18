import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

const capabilitiesPath = '.agent/capabilities.json';
const schemaPath = '.agent/schemas/capabilities.schema.json';
const routingPath = '.agent/model-routing.json';
const skillsDir = '.agent/skills';

const errors = [];

for (const path of [capabilitiesPath, schemaPath, routingPath]) {
  if (!existsSync(path)) {
    errors.push(`missing required file: ${path}`);
  }
}

if (!existsSync(skillsDir)) {
  errors.push(`missing required directory: ${skillsDir}`);
}

const registry = readJson(capabilitiesPath);
const schema = readJson(schemaPath);
const routing = readJson(routingPath);

for (const field of schema.requiredTopLevelFields ?? []) {
  if (!(field in registry)) {
    errors.push(`${capabilitiesPath}.${field} is required`);
  }
}

const maturityLevels = new Set(registry.maturityLevels ?? []);
for (const level of schema.allowedMaturityLevels ?? []) {
  if (!maturityLevels.has(level)) {
    errors.push(`maturityLevels must include ${level}`);
  }
}

const taskClasses = new Set(Object.keys(routing.taskClasses ?? {}));
const skillNames = new Set(
  existsSync(skillsDir)
    ? readdirSync(resolve(skillsDir))
      .filter((file) => file.endsWith('.md'))
      .map((file) => file.replace(/\.md$/, ''))
    : [],
);

const ids = new Set();
const capabilities = requireArray(registry.capabilities, 'capabilities', errors);

for (const [index, capability] of capabilities.entries()) {
  const label = `capabilities[${index}]`;

  for (const field of schema.requiredCapabilityFields ?? []) {
    if (!(field in capability)) {
      errors.push(`${label}.${field} is required`);
    }
  }

  if (!isNonEmptyString(capability.id)) {
    errors.push(`${label}.id must be a non-empty string`);
  } else if (ids.has(capability.id)) {
    errors.push(`duplicate capability id: ${capability.id}`);
  } else {
    ids.add(capability.id);
  }

  for (const field of ['name', 'purpose']) {
    if (!isNonEmptyString(capability[field])) {
      errors.push(`${label}.${field} must be a non-empty string`);
    }
  }

  if (!maturityLevels.has(capability.maturity)) {
    errors.push(`${label}.maturity is not declared: ${capability.maturity}`);
  }

  if (!taskClasses.has(capability.taskClass)) {
    errors.push(`${label}.taskClass is not declared in model routing: ${capability.taskClass}`);
  }

  for (const field of ['linkedSkills', 'inputs', 'outputs', 'gates', 'playwrightTouchpoints']) {
    const values = requireArray(capability[field], `${label}.${field}`, errors);
    if (values.length === 0) {
      errors.push(`${label}.${field} must not be empty`);
    }
    for (const [valueIndex, value] of values.entries()) {
      if (!isNonEmptyString(value)) {
        errors.push(`${label}.${field}[${valueIndex}] must be a non-empty string`);
      }
    }
  }

  for (const skill of capability.linkedSkills ?? []) {
    if (!skillNames.has(skill)) {
      errors.push(`${label}.linkedSkills references missing skill: ${skill}`);
    }
  }
}

if (errors.length) {
  console.error(`Agent capability check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log('Agent capability check OK');
