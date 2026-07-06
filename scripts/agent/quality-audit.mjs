import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scanRoots = ['playwright/core', 'playwright/projects/fibu-book5/tests', 'scripts/agent'];
const patterns = [
  { id: 'waitForTimeout', re: /\bwaitForTimeout\s*\(/g, severity: 'warn' },
  { id: 'forceTrue', re: /force\s*:\s*true/g, severity: 'warn' },
  { id: 'mouseClick', re: /\bmouse\.click\s*\(/g, severity: 'warn' },
  { id: 'directStorageState', re: /storageState\s*:\s*['"]playwright\/\.auth\/bc-user\.json['"]/g, severity: 'warn' },
  { id: 'unscopedNth', re: /\.nth\s*\(/g, severity: 'info' },
  { id: 'directGoto', re: /\bpage\.goto\s*\(/g, severity: 'info' },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'test-results' || entry.name === 'playwright-report') continue;
      out.push(...walk(full));
    } else if (/\.(ts|mjs|js)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function lineNo(text, offset) {
  let line = 1;
  for (let i = 0; i < offset; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

const files = scanRoots.flatMap((scanRoot) => walk(path.resolve(root, scanRoot)));
const counts = Object.fromEntries(patterns.map((pattern) => [pattern.id, 0]));
const samples = Object.fromEntries(patterns.map((pattern) => [pattern.id, []]));
const authGuard = {
  guardedDirectStorageState: 0,
  unguardedDirectStorageState: 0,
  guardedSamples: [],
  unguardedSamples: [],
};

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const relativeFile = path.relative(root, file).replaceAll(path.sep, '/');
  const hasDirectStorageState = /storageState\s*:\s*['"]playwright\/\.auth\/bc-user\.json['"]/.test(text);
  if (hasDirectStorageState) {
    const hasRunnerGuard =
      /RUNNER_GUARD_CHECKED/.test(text) &&
      /LIVE_APPROVED/.test(text) &&
      /test\.skip/.test(text);
    const bucket = hasRunnerGuard ? 'guardedSamples' : 'unguardedSamples';
    const countKey = hasRunnerGuard ? 'guardedDirectStorageState' : 'unguardedDirectStorageState';
    authGuard[countKey] += 1;
    if (authGuard[bucket].length < 12) {
      authGuard[bucket].push({
        file: relativeFile,
        line: lineNo(text, text.search(/storageState\s*:/)),
      });
    }
  }
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.re)) {
      counts[pattern.id] += 1;
      if (samples[pattern.id].length < 12) {
        samples[pattern.id].push({
          file: relativeFile,
          line: lineNo(text, match.index ?? 0),
        });
      }
    }
  }
}

const tsconfig = JSON.parse(fs.readFileSync(path.resolve(root, 'tsconfig.json'), 'utf8'));
const tsFilesInRepo = walk(root).filter((file) => file.endsWith('.ts')).length;
const tsconfigFileCount = Array.isArray(tsconfig.files) ? tsconfig.files.length : null;
const risks = [];

if (tsconfigFileCount !== null && tsconfigFileCount < Math.max(20, Math.floor(tsFilesInRepo / 4))) {
  risks.push({
    id: 'narrow-tsconfig',
    severity: 'error',
    message: `tsconfig.json type-checks ${tsconfigFileCount} files while ${tsFilesInRepo} TypeScript files exist.`,
  });
}

if (authGuard.unguardedDirectStorageState > 0) {
  risks.push({
    id: 'auth-check-not-enforced',
    severity: 'warn',
    message: `${authGuard.unguardedDirectStorageState} direct storageState files appear unguarded by a runner/live approval check.`,
  });
}

if (counts.waitForTimeout > 100 || counts.forceTrue > 20 || counts.mouseClick > 20) {
  risks.push({
    id: 'playwright-flake-surface',
    severity: 'warn',
    message: `High-risk Playwright surface: ${counts.waitForTimeout} waits, ${counts.forceTrue} force clicks, ${counts.mouseClick} coordinate clicks.`,
  });
}

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  filesScanned: files.length,
  tsFilesInRepo,
  tsconfigFileCount,
  counts,
  authGuard,
  samples,
  risks,
  recommendation: [
    'Expand TypeScript coverage before trusting tsc as a project health signal.',
    'Use guarded runners with auth freshness and live-gate checks before active Business Central specs.',
    'Promote repeated wait/force/coordinate patterns into audited helpers or rejected-path notes.',
  ],
};

console.log(JSON.stringify(result, null, 2));

if (process.argv.includes('--fail-on-error') && risks.some((risk) => risk.severity === 'error')) {
  process.exitCode = 1;
}
