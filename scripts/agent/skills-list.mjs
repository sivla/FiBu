import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const skillsDir = resolve('.agent/skills');
const files = readdirSync(skillsDir)
  .filter((name) => name.endsWith('.md'))
  .sort();

for (const file of files) {
  const text = readFileSync(join(skillsDir, file), 'utf8');
  const firstLine = text.split(/\r?\n/, 1)[0]?.replace(/^#\s*/, '') || file;
  console.log(`${file}\t${firstLine}`);
}
