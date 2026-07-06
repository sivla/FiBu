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
const tsconfigFiles = Array.isArray(tsconfig.files) ? tsconfig.files : null;
const tsconfigFileCount = tsconfigFiles ? tsconfigFiles.length : null;
const activePilotTsFiles = [
  'playwright.config.ts',
  'playwright/core/auth.setup.ts',
  'playwright/core/bc/actions.ts',
  'playwright/core/bc/cards.ts',
  'playwright/core/bc/dialogs.ts',
  'playwright/core/bc/journal-grid-candidates.ts',
  'playwright/core/bc/purchase-invoice-guards.ts',
  'playwright/core/bc-api.ts',
  'playwright/core/bc-helpers.ts',
  'playwright/core/evidence.ts',
  'playwright/projects/fibu-book5/project.ts',
  'playwright/projects/fibu-book5/tests/target-075-chart-of-accounts-reopen-and-setup-consistency-check.spec.ts',
];
const activePilotMissingFromTsconfig = tsconfigFiles
  ? activePilotTsFiles.filter((file) => !tsconfigFiles.includes(file))
  : activePilotTsFiles;
const activePilotTsCovered = tsconfigFiles !== null && activePilotMissingFromTsconfig.length === 0;
const risks = [];

if (tsconfigFileCount !== null && tsconfigFileCount < Math.max(20, Math.floor(tsFilesInRepo / 4))) {
  risks.push({
    id: 'narrow-tsconfig',
    severity: activePilotTsCovered ? 'warn' : 'error',
    message: activePilotTsCovered
      ? `tsconfig.json type-checks ${tsconfigFileCount} files while ${tsFilesInRepo} TypeScript files exist. Active TARGET-075 TypeScript files are covered, but tsc is not full project health proof.`
      : `tsconfig.json type-checks ${tsconfigFileCount} files while ${tsFilesInRepo} TypeScript files exist, and active TARGET-075 TypeScript coverage is incomplete.`,
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
  tsCoverage: {
    mode: 'active-pilot-plus-core',
    activePilot: 'TARGET-075-CHART-OF-ACCOUNTS-REOPEN-AND-SETUP-CONSISTENCY-CHECK',
    activePilotTsCovered,
    activePilotTsFiles,
    activePilotMissingFromTsconfig,
    fullProjectTsHealthProven: false,
  },
  counts,
  authGuard,
  samples,
  risks,
  recommendation: [
    activePilotTsCovered
      ? 'Treat tsc as active-pilot/core coverage only; expand TypeScript coverage before trusting it as full project health proof.'
      : 'Add active TARGET-075 TypeScript files to tsconfig before trusting tsc for the resume pilot.',
    'Use guarded runners with auth freshness and live-gate checks before active Business Central specs.',
    'Promote repeated wait/force/coordinate patterns into audited helpers or rejected-path notes.',
  ],
};

console.log(JSON.stringify(result, null, 2));

if (process.argv.includes('--fail-on-error') && risks.some((risk) => risk.severity === 'error')) {
  process.exitCode = 1;
}
