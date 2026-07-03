import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const confirmed = process.argv.includes('--confirm');
const authProfileDir = path.resolve('playwright/.auth/bc-profile');
const storageStateFile = path.resolve('playwright/.auth/bc-user.json');
const normalizedProfile = authProfileDir.toLowerCase();

function sanitizeCommandLine(commandLine) {
  return String(commandLine ?? '')
    .replaceAll(authProfileDir, 'playwright/.auth/bc-profile')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant-guid}');
}

function summarizeProcess(processInfo) {
  const commandLine = sanitizeCommandLine(processInfo.commandLine);
  const typeMatch = commandLine.match(/--type=([^\s"]+)/);
  const targetMatch = commandLine.match(/https:\/\/businesscentral\.dynamics\.com\/\{tenant-guid\}\/[^\s"]+/);
  return {
    pid: processInfo.pid,
    name: processInfo.name,
    role: typeMatch?.[1] ?? 'browser',
    targetUrl: targetMatch?.[0] ?? '',
    usesProfile: commandLine.includes('playwright/.auth/bc-profile')
  };
}

function listProfileProcesses() {
  try {
    if (process.platform === 'win32') {
      const powershellProfilePath = authProfileDir.replaceAll("'", "''");
      const output = execFileSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `$profilePath='${powershellProfilePath}'; Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*$profilePath*" -or $_.CommandLine -like '*playwright/.auth/bc-profile*' -or $_.CommandLine -like '*playwright\\\\.auth\\\\bc-profile*' } | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress`
        ],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
      ).trim();
      if (!output) return [];
      const parsed = JSON.parse(output);
      return (Array.isArray(parsed) ? parsed : [parsed]).map(processInfo => ({
        pid: processInfo.ProcessId,
        name: processInfo.Name,
        commandLine: processInfo.CommandLine
      }));
    }

    const output = execFileSync('ps', ['-axo', 'pid=,comm=,args='], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return output
      .split(/\r?\n/)
      .filter(line => line.toLowerCase().includes(normalizedProfile))
      .map(line => {
        const trimmed = line.trim();
        const match = trimmed.match(/^(\d+)\s+(\S+)\s+(.*)$/);
        return {
          pid: match ? Number(match[1]) : null,
          name: match?.[2] ?? '',
          commandLine: sanitizeCommandLine(match?.[3] ?? trimmed)
        };
      });
  } catch {
    return [];
  }
}

function isBrowserProfileProcess(processInfo) {
  const name = String(processInfo.name ?? '').toLowerCase();
  return /chrome|chromium|msedge/.test(name);
}

const profileExists = existsSync(authProfileDir);
const storageStateExists = existsSync(storageStateFile);
const activeProfileProcesses = listProfileProcesses().filter(isBrowserProfileProcess).map(summarizeProcess);
const canCapture = profileExists && activeProfileProcesses.length === 0;
const result = {
  schemaVersion: 1,
  purpose: 'business-central-detached-auth-capture',
  command: 'npm run auth:bc:capture-detached',
  profilePath: 'playwright/.auth/bc-profile',
  storageStateFile: 'playwright/.auth/bc-user.json',
  profileExists,
  storageStateExists,
  activeProfileProcesses,
  canCapture,
  writeMode: confirmed,
  blockedBy: [
    ...(profileExists ? [] : ['auth-profile-missing']),
    ...(activeProfileProcesses.length ? ['detached-browser-still-uses-auth-profile'] : [])
  ],
  nextStep: canCapture
    ? 'Run npm run auth:bc:capture-detached -- --confirm to validate the closed detached profile and write storage state.'
    : 'Complete Login/MFA in the detached browser, wait for Business Central shell, close the detached browser, then rerun npm run auth:bc:capture-detached.'
};

if (!confirmed || !canCapture) {
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = canCapture || !confirmed ? 0 : 1;
  process.exit();
}

console.log(JSON.stringify({ ...result, action: 'running npm run auth:bc' }, null, 2));
const authRun = spawnSync('npm', ['run', 'auth:bc'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    BC_AUTH_COMMAND_LABEL: 'npm run auth:bc:capture-detached -- --confirm'
  }
});
process.exitCode = typeof authRun.status === 'number' ? authRun.status : 1;
