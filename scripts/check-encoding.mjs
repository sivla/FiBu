import fs from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';

const root = process.cwd();
const decoder = new TextDecoder('utf-8', { fatal: true });

const textExtensions = new Set([
  '.env',
  '.example',
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
  '.json',
  '.log',
  '.md',
  '.mjs',
  '.ts',
  '.txt',
  '.yml',
  '.yaml',
]);

const ignoredDirs = new Set([
  '.git',
  'node_modules',
  'playwright-report',
  'test-results',
]);

const mojibakePatterns = [
  /\u00c3[\u0080-\u00bf]/,
  /\u00c2[\u0080-\u00bf]?/,
  /\u00e2\u20ac[^\s]?/,
  /\u00e2\u20ac\u2122/,
  /\u00e2\u20ac\u0153/,
  /\u00e2\u20ac\ufffd/,
  /\u00e2\u20ac\u201c/,
  /\u00e2\u20ac\u201d/,
  /\u00e2\u2020\u2019/,
  /\u00e2\u201a\u00ac/,
  /\ufffd/,
];

function isTextFile(filePath) {
  const name = path.basename(filePath);
  const ext = path.extname(filePath);
  return textExtensions.has(ext) || textExtensions.has(name);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (isTextFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

const failures = [];

for (const file of walk(root)) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const bytes = fs.readFileSync(file);
  let text;

  try {
    text = decoder.decode(bytes);
  } catch (error) {
    failures.push(`${rel}: not valid UTF-8 (${error.message})`);
    continue;
  }

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (mojibakePatterns.some((pattern) => pattern.test(line))) {
      failures.push(`${rel}:${i + 1}: possible mojibake: ${line.slice(0, 180)}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Encoding check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Encoding OK: UTF-8 text files contain no common mojibake markers.');
