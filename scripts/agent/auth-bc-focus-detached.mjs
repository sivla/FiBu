import { execFileSync } from 'node:child_process';
import path from 'node:path';

const authProfileDir = path.resolve('playwright/.auth/bc-profile');

function sanitizeCommandLine(commandLine) {
  return String(commandLine ?? '')
    .replaceAll(authProfileDir, 'playwright/.auth/bc-profile')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant-guid}');
}

function runPowerShell(command) {
  return execFileSync('powershell', ['-NoProfile', '-Command', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function listProfileProcesses() {
  if (process.platform !== 'win32') {
    return [];
  }

  const powershellProfilePath = authProfileDir.replaceAll("'", "''");
  const output = runPowerShell(
    `$profilePath='${powershellProfilePath}'; ` +
      "Get-CimInstance Win32_Process | " +
      "Where-Object { $_.CommandLine -like \"*$profilePath*\" -or $_.CommandLine -like '*playwright/.auth/bc-profile*' -or $_.CommandLine -like '*playwright\\\\.auth\\\\bc-profile*' } | " +
      'Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress'
  );
  if (!output) return [];

  const parsed = JSON.parse(output);
  return (Array.isArray(parsed) ? parsed : [parsed])
    .filter(processInfo => /chrome|chromium|msedge/i.test(String(processInfo.Name ?? '')))
    .map(processInfo => ({
      pid: processInfo.ProcessId,
      name: processInfo.Name,
      commandLine: sanitizeCommandLine(processInfo.CommandLine)
    }));
}

function getMainWindow(pid) {
  const output = runPowerShell(
    `$p=Get-Process -Id ${Number(pid)} -ErrorAction SilentlyContinue; ` +
      "if ($p) { [pscustomobject]@{ Id=$p.Id; MainWindowHandle=$p.MainWindowHandle; MainWindowTitle=$p.MainWindowTitle } | ConvertTo-Json -Compress }"
  );
  return output ? JSON.parse(output) : null;
}

function focusWindow(handle, pid, title) {
  const numericHandle = Number(handle);
  if (!numericHandle) return false;

  const output = runPowerShell(
    'Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition ' +
      "'[System.Runtime.InteropServices.DllImport(\"user32.dll\")] public static extern bool SetForegroundWindow(IntPtr hWnd); " +
      '[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);\'; ' +
      `$h=[IntPtr]${numericHandle}; ` +
      '[Win32.NativeMethods]::ShowWindow($h, 9) | Out-Null; ' +
      '[Win32.NativeMethods]::SetForegroundWindow($h)'
  );
  if (output.trim().toLowerCase() === 'true') return true;

  const appActivateOutput = runPowerShell(
    `$shell = New-Object -ComObject WScript.Shell; ` +
      `$byPid = $shell.AppActivate(${Number(pid)}); ` +
      `$byTitle = if ($byPid) { $false } else { $shell.AppActivate('${String(title ?? '').replaceAll("'", "''")}') }; ` +
      '($byPid -or $byTitle)'
  );
  return appActivateOutput.trim().toLowerCase() === 'true';
}

const result = {
  schemaVersion: 1,
  purpose: 'business-central-detached-auth-focus',
  command: 'npm run auth:bc:focus-detached',
  profilePath: 'playwright/.auth/bc-profile',
  supported: process.platform === 'win32',
  focused: false,
  activeProfileProcesses: [],
  window: null,
  blockedBy: [],
  nextStep: ''
};

if (process.platform !== 'win32') {
  result.blockedBy.push('focus-detached-supported-only-on-windows');
  result.nextStep = 'Use the operating system window switcher to focus the detached Playwright auth browser.';
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

const activeProfileProcesses = listProfileProcesses();
result.activeProfileProcesses = activeProfileProcesses.map(processInfo => {
  const typeMatch = processInfo.commandLine.match(/--type=([^\s"]+)/);
  const targetMatch = processInfo.commandLine.match(/https:\/\/businesscentral\.dynamics\.com\/\{tenant-guid\}\/[^\s"]+/);
  return {
    pid: processInfo.pid,
    name: processInfo.name,
    role: typeMatch?.[1] ?? 'browser',
    targetUrl: targetMatch?.[0] ?? ''
  };
});

const browserProcess = activeProfileProcesses.find(processInfo => !/--type=/i.test(processInfo.commandLine));
const mainWindow = browserProcess ? getMainWindow(browserProcess.pid) : null;
result.window = mainWindow
  ? {
      pid: mainWindow.Id,
      title: mainWindow.MainWindowTitle,
      hasHandle: Number(mainWindow.MainWindowHandle) > 0
    }
  : null;

if (!browserProcess || !mainWindow || !Number(mainWindow.MainWindowHandle)) {
  result.blockedBy.push('detached-auth-browser-window-not-found');
  result.nextStep = 'Run npm run auth:bc:open-login-detached, or use the already-open Playwright browser if visible.';
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

result.focused = focusWindow(mainWindow.MainWindowHandle, mainWindow.Id, mainWindow.MainWindowTitle);
result.nextStep = result.focused
  ? 'Complete Login/MFA in the focused Playwright auth browser, wait for the Business Central shell, close it, then run npm run auth:bc:capture-detached.'
  : 'Windows did not confirm focus. Use Alt-Tab to select the Google Chrome for Testing auth window, complete Login/MFA, close it, then capture.';
console.log(JSON.stringify(result, null, 2));
