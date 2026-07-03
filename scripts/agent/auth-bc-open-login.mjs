import { spawnSync } from 'node:child_process';

const timeoutMs = process.env.BC_AUTH_OPEN_LOGIN_TIMEOUT_MS ?? String(5 * 60 * 1000);

console.log('');
console.log('Business Central Playwright login handoff');
console.log('');
console.log('Target: playthru / UNIVERSAARL-DE');
console.log('Use only the browser window opened by this command.');
console.log('A normal Chrome or Codex-app login does not refresh playwright/.auth/bc-user.json.');
console.log('');
console.log('Do this in the Playwright window:');
console.log('1. Complete Microsoft sign-in and MFA.');
console.log('2. Wait until Business Central is visibly loaded.');
console.log('3. Confirm the company context is UNIVERSAARL-DE if Business Central asks.');
console.log('4. Keep the window open until this command prints that the storage state was saved.');
console.log('');
console.log(`This command waits up to ${timeoutMs} ms.`);
console.log('For a longer attended handoff, set BC_AUTH_OPEN_LOGIN_TIMEOUT_MS explicitly before running this command.');
console.log('');

const result = spawnSync('npm', ['run', 'auth:bc'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    BC_AUTH_COMMAND_LABEL: 'npm run auth:bc:open-login',
    BC_AUTH_TIMEOUT_MS: timeoutMs,
  },
});

process.exit(result.status ?? 1);
