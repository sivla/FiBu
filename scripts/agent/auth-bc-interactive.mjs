import { spawnSync } from 'node:child_process';

const timeoutMs = process.env.BC_AUTH_INTERACTIVE_TIMEOUT_MS ?? String(30 * 60 * 1000);

console.log(`Starting interactive Business Central auth with BC_AUTH_TIMEOUT_MS=${timeoutMs}.`);
console.log('Use the Playwright-opened browser window, not normal Chrome. Wait for the Business Central shell.');

const result = spawnSync('npm', ['run', 'auth:bc'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    BC_AUTH_TIMEOUT_MS: timeoutMs,
  },
});

process.exit(result.status ?? 1);
