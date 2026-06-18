import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const skillsDir = resolve('.agent/skills');
const contractPath = join(skillsDir, 'SKILL-CONTRACT.md');

const requiredHeadings = [
  '## Skill name',
  '## Purpose',
  '## Use when',
  '## Do not use when',
  '## Inputs',
  '## Output JSON schema',
  '## Rules',
  '## Stop if',
  '## Safety gates',
  '## Preferred taskClass',
  '## Default model class',
  '## Max context lines',
  '## Max output tokens',
  '## Tool preferred',
  '## Updates state',
];

const allowedTaskClasses = new Set([
  'monkey_work',
  'wizard_work',
  'judge_work',
  'big_brain_review',
]);

const errors = [];

if (!existsSync(skillsDir)) {
  errors.push('missing required directory: .agent/skills');
}

if (!existsSync(contractPath)) {
  errors.push('missing required file: .agent/skills/SKILL-CONTRACT.md');
}

const files = existsSync(skillsDir)
  ? readdirSync(skillsDir).filter((file) => file.endsWith('.md') && file !== 'SKILL-CONTRACT.md')
  : [];

if (files.length === 0) {
  errors.push('no skill files found in .agent/skills');
}

function sectionValue(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(new RegExp(`${escaped}\\s*\\r?\\n([^#]+)`, 'm'));
  return match?.[1]?.trim() ?? '';
}

for (const file of files) {
  const path = join(skillsDir, file);
  const text = readFileSync(path, 'utf8');
  const label = `.agent/skills/${file}`;
  const expectedSkillName = file.replace(/\.md$/, '');

  for (const heading of requiredHeadings) {
    if (!text.includes(`${heading}\n`) && !text.includes(`${heading}\r\n`)) {
      errors.push(`${label}: missing ${heading}`);
    }
  }

  const skillName = sectionValue(text, '## Skill name');
  if (skillName !== expectedSkillName) {
    errors.push(`${label}: Skill name must be ${expectedSkillName}`);
  }

  const taskClass = sectionValue(text, '## Preferred taskClass');
  if (!allowedTaskClasses.has(taskClass)) {
    errors.push(`${label}: Preferred taskClass is invalid: ${taskClass || '<empty>'}`);
  }

  const outputSchema = sectionValue(text, '## Output JSON schema');
  if (!outputSchema.includes('```json')) {
    errors.push(`${label}: Output JSON schema must include a json fenced block`);
  }

  const toolPreferred = sectionValue(text, '## Tool preferred').toLowerCase();
  if (!toolPreferred.startsWith('yes') && !toolPreferred.startsWith('no')) {
    errors.push(`${label}: Tool preferred must start with yes or no`);
  }

  const updatesState = sectionValue(text, '## Updates state').toLowerCase();
  if (!updatesState.startsWith('yes') && !updatesState.startsWith('no')) {
    errors.push(`${label}: Updates state must start with yes or no`);
  }
}

if (errors.length) {
  console.error(`Agent skill validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(`Agent skill validation OK (${files.length} skills)`);
