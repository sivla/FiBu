import { spawnSync } from 'node:child_process';
import path from 'node:path';

const tsxCommand = path.resolve('node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
const timeoutMs = process.env.BC_AUTH_TIMEOUT_MS ?? '90000';

console.log(`Running Business Central auth diagnosis with BC_AUTH_TIMEOUT_MS=${timeoutMs}.`);
console.log('Complete Login/MFA if prompted. The command is expected to fail if the BC shell is not reached.');

const result = spawnSync(tsxCommand, ['playwright/core/auth.setup.ts'], {
  env: {
    ...process.env,
    BC_AUTH_TIMEOUT_MS: timeoutMs
  },
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.error) {
  console.error(`Could not start auth diagnosis: ${result.error.message}`);
}

process.exit(result.status ?? 1);
