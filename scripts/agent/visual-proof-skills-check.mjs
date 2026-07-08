import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  readFirstSkill: '.agent/skills/read-first-page-proof.md',
  screenshotSkill: '.agent/skills/screenshot-qa.md',
  helper: 'playwright/core/bc/visual-proof-skills.ts',
  selftest: 'playwright/core/bc/visual-proof-skills.selftest.ts',
  activeCase: '.agent/state/cases/foundation-configuration-worksheet-readfirst.json'
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const errors = [];

for (const file of Object.values(files)) {
  if (!exists(file)) errors.push(`missing file: ${file}`);
}

if (!errors.length) {
  for (const skillFile of [files.readFirstSkill, files.screenshotSkill]) {
    const text = read(skillFile);
    for (const required of [
      '## Executable helper/check',
      'playwright/core/bc/visual-proof-skills.ts',
      'npm run core:visual-proof-skills:selftest'
    ]) {
      if (!text.includes(required)) errors.push(`${skillFile}: missing executable binding ${required}`);
    }
  }

  const helper = read(files.helper);
  for (const required of [
    'evaluateReadFirstPageProof',
    "skill: 'read-first-page-proof'",
    'evaluateScreenshotQa',
    "skill: 'screenshot-qa'",
    'stopState',
    'safeForWriteGate: false'
  ]) {
    if (!helper.includes(required)) errors.push(`${files.helper}: missing runtime signal ${required}`);
  }

  const activeCase = JSON.parse(read(files.activeCase));
  const skills = new Set(activeCase.skills || []);
  for (const skill of ['read-first-page-proof', 'screenshot-qa']) {
    if (!skills.has(skill)) errors.push(`${files.activeCase}: active read-first case must include skill ${skill}`);
  }
  const checks = new Set(activeCase.requiredChecks || []);
  if (!checks.has('agent:visual-proof-skills:check')) {
    errors.push(`${files.activeCase}: requiredChecks must include agent:visual-proof-skills:check`);
  }
}

let selftest = null;
if (!errors.length) {
  selftest = spawnSync('npm.cmd', ['run', 'core:visual-proof-skills:selftest'], {
    cwd: root,
    encoding: 'utf8',
    shell: true
  });
  if (selftest.status !== 0) {
    errors.push(`core:visual-proof-skills:selftest failed with exit ${selftest.status}`);
  }
}

const payload = {
  schemaVersion: 1,
  purpose: 'visual-proof-skills-check',
  ok: errors.length === 0,
  checkedSkills: ['read-first-page-proof', 'screenshot-qa'],
  helper: files.helper,
  selftest: files.selftest,
  liveActionsExecuted: false,
  businessCentralOpened: false,
  playwrightLiveRunExecuted: false,
  errors,
  selftestStdout: selftest?.stdout?.trim() || null,
  nextStep:
    errors.length === 0
      ? 'Read-first page proof and screenshot QA have executable helper, schema-like JSON output and selftest coverage.'
      : 'Fix executable skill binding before the next read-first BC case.'
};

console.log(JSON.stringify(payload, null, 2));

if (errors.length > 0) process.exit(1);
