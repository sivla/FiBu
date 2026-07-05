import { execFileSync } from 'node:child_process';
import path from 'node:path';

const confirmed = process.argv.includes('--confirm');
const authProfileDir = path.resolve('playwright/.auth/bc-profile');

function runPowerShell(command) {
  return execFileSync('powershell', ['-NoProfile', '-Command', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function sanitizeCommandLine(commandLine) {
  return String(commandLine ?? '')
    .replaceAll(authProfileDir, 'playwright/.auth/bc-profile')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant-guid}');
}

function listProfileProcesses() {
  if (process.platform !== 'win32') return [];

  const powershellProfilePath = authProfileDir.replaceAll("'", "''");
  const output = runPowerShell(
    `$profilePath='${powershellProfilePath}'; ` +
      'Get-CimInstance Win32_Process | ' +
      'Where-Object { $_.CommandLine -like "*$profilePath*" -or $_.CommandLine -like \'*playwright/.auth/bc-profile*\' -or $_.CommandLine -like \'*playwright\\\\.auth\\\\bc-profile*\' } | ' +
      'ForEach-Object { $p=Get-Process -Id $_.ProcessId -ErrorAction SilentlyContinue; [pscustomobject]@{ ProcessId=$_.ProcessId; Name=$_.Name; CommandLine=$_.CommandLine; MainWindowTitle=if ($p) { $p.MainWindowTitle } else { "" }; MainWindowHandle=if ($p) { $p.MainWindowHandle } else { 0 } } } | ConvertTo-Json -Compress'
  );
  if (!output) return [];

  const parsed = JSON.parse(output);
  return (Array.isArray(parsed) ? parsed : [parsed])
    .filter(processInfo => /chrome|chromium|msedge/i.test(String(processInfo.Name ?? '')))
    .map(processInfo => ({
      pid: processInfo.ProcessId,
      name: processInfo.Name,
      commandLine: sanitizeCommandLine(processInfo.CommandLine),
      windowTitle: processInfo.MainWindowTitle ?? '',
      mainWindowHandle: Number(processInfo.MainWindowHandle ?? 0)
    }));
}

function summarizeProcess(processInfo) {
  const typeMatch = processInfo.commandLine.match(/--type=([^\s"]+)/);
  const targetMatch = processInfo.commandLine.match(/https:\/\/businesscentral\.dynamics\.com\/\{tenant-guid\}\/[^\s"]+/);
  return {
    pid: processInfo.pid,
    name: processInfo.name,
    role: typeMatch?.[1] ?? 'browser',
    windowTitle: processInfo.windowTitle,
    targetUrl: targetMatch?.[0] ?? '',
    hasMainWindow: processInfo.mainWindowHandle > 0
  };
}

function closeMainBrowserProcess(pid) {
  const output = runPowerShell(
    `$p=Get-Process -Id ${Number(pid)} -ErrorAction SilentlyContinue; ` +
      'if (-not $p) { [pscustomobject]@{ closed=$true; reason="process-not-found" } | ConvertTo-Json -Compress; exit 0 }; ' +
      '$closed=$p.CloseMainWindow(); ' +
      'Start-Sleep -Seconds 3; ' +
      '$stillRunning=Get-Process -Id $p.Id -ErrorAction SilentlyContinue; ' +
      'if ($stillRunning) { Stop-Process -Id $p.Id -Force; Start-Sleep -Seconds 1 }; ' +
      '$final=Get-Process -Id $p.Id -ErrorAction SilentlyContinue; ' +
      '[pscustomobject]@{ closed=($null -eq $final); closeMainWindow=$closed; forceStopped=($null -ne $stillRunning) } | ConvertTo-Json -Compress'
  );
  return output ? JSON.parse(output) : { closed: false, reason: 'no-output' };
}

const supported = process.platform === 'win32';
const activeProfileProcesses = supported ? listProfileProcesses() : [];
const browserProcess = activeProfileProcesses.find(processInfo => !/--type=/i.test(processInfo.commandLine));
const result = {
  schemaVersion: 1,
  purpose: 'business-central-detached-auth-close',
  command: 'npm run auth:bc:close-detached',
  profilePath: 'playwright/.auth/bc-profile',
  supported,
  closeMode: confirmed,
  activeProfileProcesses: activeProfileProcesses.map(summarizeProcess),
  selectedBrowserProcess: browserProcess ? summarizeProcess(browserProcess) : null,
  closed: false,
  blockedBy: [],
  nextStep: ''
};

if (!supported) {
  result.blockedBy.push('close-detached-supported-only-on-windows');
  result.nextStep = 'Close the detached Playwright auth browser through the operating system, then run npm run auth:bc:capture-detached.';
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

if (!browserProcess) {
  result.closed = true;
  result.nextStep = 'No detached profile browser is open. Run npm run auth:bc:capture-detached.';
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

if (!confirmed) {
  result.blockedBy.push('dry-run-only');
  result.nextStep = 'Run npm run auth:bc:close-detached -- --confirm to close only the browser using playwright/.auth/bc-profile.';
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

result.closeResult = closeMainBrowserProcess(browserProcess.pid);
result.closed = Boolean(result.closeResult.closed);
result.nextStep = result.closed
  ? 'Run npm run auth:bc:capture-detached. If clear, run npm run auth:bc:capture-detached -- --confirm, then npm run auth:bc:check.'
  : 'The detached auth browser could not be closed automatically. Close it manually, then run npm run auth:bc:capture-detached.';

console.log(JSON.stringify(result, null, 2));
process.exitCode = result.closed ? 0 : 1;
