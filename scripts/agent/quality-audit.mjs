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

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.re)) {
      counts[pattern.id] += 1;
      if (samples[pattern.id].length < 12) {
        samples[pattern.id].push({
          file: path.relative(root, file).replaceAll(path.sep, '/'),
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

if (counts.directStorageState > 0) {
  risks.push({
    id: 'auth-check-not-enforced',
    severity: 'warn',
    message: `${counts.directStorageState} direct storageState references can run without an auth freshness preflight.`,
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
  samples,
  risks,
  recommendation: [
    'Expand TypeScript coverage before trusting tsc as a project health signal.',
    'Add an auth freshness wrapper before live Business Central specs.',
    'Promote repeated wait/force/coordinate patterns into audited helpers or rejected-path notes.',
  ],
};

console.log(JSON.stringify(result, null, 2));

if (process.argv.includes('--fail-on-error') && risks.some((risk) => risk.severity === 'error')) {
  process.exitCode = 1;
}
