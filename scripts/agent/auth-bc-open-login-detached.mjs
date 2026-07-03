import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import 'dotenv/config';

const authProfileDir = path.resolve('playwright/.auth/bc-profile');
const normalizedProfile = authProfileDir.toLowerCase();
const bcUrlSource =
  process.env.BC_AUTH_URL ? 'BC_AUTH_URL' : process.env.FIBU_BOOK5_BC_URL ? 'FIBU_BOOK5_BC_URL' : 'BC_URL';
const bcUrl = process.env.BC_AUTH_URL ?? process.env.FIBU_BOOK5_BC_URL ?? process.env.BC_URL;

if (!bcUrl) {
  throw new Error(
    'BC_AUTH_URL, FIBU_BOOK5_BC_URL oder BC_URL fehlt. Lege eine .env mit Business-Central-Ziel-URL an.'
  );
}

const expectedUrl = new URL(bcUrl);
const currentState = JSON.parse(await fs.readFile('.agent/state/current.json', 'utf8'));
const expectedEnvironment = currentState.instance ?? expectedUrl.pathname.split('/').filter(Boolean).at(-1) ?? '';
const expectedCompany = currentState.company ?? expectedUrl.searchParams.get('company') ?? '';

if (expectedEnvironment) {
  const pathParts = expectedUrl.pathname.split('/').filter(Boolean);
  if (pathParts.length) {
    pathParts[pathParts.length - 1] = expectedEnvironment;
    expectedUrl.pathname = `/${pathParts.join('/')}`;
  }
}
if (expectedCompany) {
  expectedUrl.searchParams.set('company', expectedCompany);
}

await fs.mkdir(authProfileDir, { recursive: true });

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

const activeProfileProcesses = listProfileProcesses().filter(isBrowserProfileProcess).map(summarizeProcess);
if (activeProfileProcesses.length > 0) {
  console.log(JSON.stringify(
    {
      schemaVersion: 1,
      purpose: 'business-central-detached-auth-profile-window',
      launched: false,
      command: 'npm run auth:bc:open-login-detached',
      targetSource: `${bcUrlSource} with current.json override`,
      target: {
        instance: expectedEnvironment,
        company: expectedCompany
      },
      profilePath: 'playwright/.auth/bc-profile',
      activeProfileProcesses,
      reason: 'A detached Playwright auth profile browser is already open; use that window instead of launching another one.',
      nextSteps: [
        'Complete Login/MFA in the already-open Playwright profile browser window.',
        'Wait until Business Central shell is visible for playthru / UNIVERSAARL-DE.',
        'Close that browser window after Business Central is loaded.',
        'Run npm run auth:bc:capture-detached to verify the detached browser is closed.',
        'If clear, run npm run auth:bc:capture-detached -- --confirm to validate the same profile and write playwright/.auth/bc-user.json.',
        'Run npm run auth:bc:check and require canUseStoredAuth=true before any BC workflow.'
      ]
    },
    null,
    2
  ));
  process.exit(0);
}

const executablePath = chromium.executablePath();
const args = [
  `--user-data-dir=${authProfileDir}`,
  '--new-window',
  '--no-first-run',
  '--disable-default-apps',
  expectedUrl.toString()
];

const child = spawn(executablePath, args, {
  detached: true,
  stdio: 'ignore'
});
child.unref();

console.log(JSON.stringify(
  {
    schemaVersion: 1,
    purpose: 'business-central-detached-auth-profile-window',
    launched: true,
    command: 'npm run auth:bc:open-login-detached',
    targetSource: `${bcUrlSource} with current.json override`,
    target: {
      instance: expectedEnvironment,
      company: expectedCompany
    },
    profilePath: 'playwright/.auth/bc-profile',
    noStorageStateWrittenByThisCommand: true,
    nextSteps: [
      'Complete Login/MFA in the opened Playwright profile browser window.',
      'Wait until Business Central shell is visible for playthru / UNIVERSAARL-DE.',
      'Close that browser window after Business Central is loaded.',
      'Run npm run auth:bc:capture-detached to verify the detached browser is closed.',
      'If clear, run npm run auth:bc:capture-detached -- --confirm to validate the same profile and write playwright/.auth/bc-user.json.',
      'Run npm run auth:bc:check and require canUseStoredAuth=true before any BC workflow.'
    ],
    safety: [
      'Do not copy cookies or auth files from Chrome.',
      'Do not run Business Central workflows until auth:bc:check is green.',
      'Do not accept Microsoft sign-in or remote-sign-in as Business Central evidence.'
    ]
  },
  null,
  2
));
