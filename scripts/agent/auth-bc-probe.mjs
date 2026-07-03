import { spawnSync } from 'node:child_process';

const timeoutMs = process.env.BC_AUTH_PROBE_TIMEOUT_MS ?? '30000';
const result = spawnSync('npm', ['run', 'auth:bc'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    BC_AUTH_COMMAND_LABEL: 'npm run auth:bc:probe',
    BC_AUTH_TIMEOUT_MS: timeoutMs,
  },
});

process.exit(result.status ?? 1);
