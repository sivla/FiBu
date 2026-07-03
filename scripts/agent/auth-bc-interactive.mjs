import { spawnSync } from 'node:child_process';

const timeoutMs = process.env.BC_AUTH_INTERACTIVE_TIMEOUT_MS ?? process.env.BC_AUTH_OPEN_LOGIN_TIMEOUT_MS ?? String(5 * 60 * 1000);

console.log(`Starting compatibility Business Central auth handoff with BC_AUTH_TIMEOUT_MS=${timeoutMs}.`);
console.log('Prefer npm run auth:bc:open-login. Use the Playwright-opened browser window, not normal Chrome. Wait for the Business Central shell.');
console.log('For a longer attended handoff, set BC_AUTH_OPEN_LOGIN_TIMEOUT_MS or BC_AUTH_INTERACTIVE_TIMEOUT_MS explicitly.');

const result = spawnSync('npm', ['run', 'auth:bc'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    BC_AUTH_COMMAND_LABEL: 'npm run auth:bc:interactive',
    BC_AUTH_TIMEOUT_MS: timeoutMs,
  },
});

process.exit(result.status ?? 1);
