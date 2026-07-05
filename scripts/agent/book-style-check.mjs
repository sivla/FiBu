import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failOnViolations = process.argv.includes('--fail-on-violations');

const targetFiles = [
  'FiBu_Buch_BC_Standardprozesse_DE_Master_Blueprint.md',
  ...walk(path.resolve(root, 'playwright/projects/fibu-book5/book-drafts'))
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.relative(root, file).replaceAll(path.sep, '/'))
];

const forbiddenPatterns = [
  {
    id: 'meta-this-chapter',
    severity: 'error',
    re: /\bDieses Kapitel\s+(soll|zeigt|erkl[aä]rt|dokumentiert|beschreibt)\b/i,
    guidance: 'Direkt mit der BC-Sache starten: Seite, Zweck, Feld, Wirkung.'
  },
  {
    id: 'meta-reader-should',
    severity: 'error',
    re: /\b(Der Leser|Die Leserin|Leserinnen und Leser)\s+soll(en)?\s+(verstehen|lernen|sehen)\b/i,
    guidance: 'Nicht ueber Lernziel sprechen, sondern die Sache erklaeren.'
  },
  {
    id: 'evidence-meta',
    severity: 'error',
    re: /\b(Evidence zeigt|Evidence beweist|Dieser Screenshot beweist|Der Screenshot beweist|Der Case zeigt|Der Agent hat)\b/i,
    guidance: 'Evidence-Sprache gehoert in Result, Atlas oder State; Buchtext beschreibt sichtbar und fachlich.'
  },
  {
    id: 'future-internal-todo',
    severity: 'warn',
    re: /\b(Sp[aä]ter muss|muss sp[aä]ter|noch nicht bewiesen|noch nicht belegt|Rebuild folgt)\b/i,
    guidance: 'Interne To-dos in State/Atlas fuehren; Buchtext sachlich begrenzen.'
  },
  {
    id: 'repo-artifact-language',
    severity: 'warn',
    re: /\b(Result JSON|Evidence Pack|Case-ID|Case ID|Run Summary|State-Datei|Repo-Pfad)\b/i,
    guidance: 'Artefaktsprache nur in internen Dateien verwenden.'
  }
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function normalizeLine(line) {
  return line.replace(/\s+/g, ' ').trim();
}

function scanFile(filePath) {
  const absolutePath = path.resolve(root, filePath);
  const text = fs.readFileSync(absolutePath, 'utf8');
  const findings = [];
  let inFence = false;
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const trimmed = normalizeLine(line);
    if (!trimmed) continue;

    for (const pattern of forbiddenPatterns) {
      if (pattern.re.test(trimmed)) {
        findings.push({
          file: filePath,
          line: index + 1,
          id: pattern.id,
          severity: pattern.severity,
          text: trimmed.slice(0, 240),
          guidance: pattern.guidance
        });
      }
    }
  }
  return findings;
}

const missingFiles = targetFiles.filter((file) => !fs.existsSync(path.resolve(root, file)));
const findings = targetFiles.filter((file) => !missingFiles.includes(file)).flatMap(scanFile);
const countsBySeverity = findings.reduce(
  (counts, finding) => {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
    return counts;
  },
  {}
);
const countsByPattern = findings.reduce(
  (counts, finding) => {
    counts[finding.id] = (counts[finding.id] ?? 0) + 1;
    return counts;
  },
  {}
);

const output = {
  schemaVersion: 1,
  purpose: 'book-style-check',
  checkedFiles: targetFiles,
  missingFiles,
  failOnViolations,
  ok: missingFiles.length === 0 && findings.length === 0,
  countsBySeverity,
  countsByPattern,
  findings,
  recommendation:
    findings.length === 0
      ? 'Book-facing files contain no configured agent/evidence meta-language patterns.'
      : 'Patch findings when touching the affected section. Do not mass-rewrite old legacy chapters without evidence context.'
};

console.log(JSON.stringify(output, null, 2));

if (missingFiles.length || (failOnViolations && findings.length)) process.exitCode = 1;
