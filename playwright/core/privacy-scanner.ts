import fs from 'node:fs';
import path from 'node:path';

export type PrivacyFinding = {
  file: string;
  type: 'secret' | 'email' | 'iban' | 'token' | 'connection-string' | 'auth-state' | 'warning';
  line?: number;
  matchPreview: string;
};

export type PrivacyScanResult = {
  ok: boolean;
  findings: PrivacyFinding[];
};

type Rule = {
  type: PrivacyFinding['type'];
  pattern: RegExp;
  warningOnly?: (match: string, line: string) => boolean;
};

const textExtensions = new Set(['.md', '.json', '.ts']);

const rules: Rule[] = [
  {
    type: 'email',
    pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
    warningOnly: (match) => /@(example\.invalid|example\.com|example\.org|example\.net)$/i.test(match)
  },
  { type: 'iban', pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g },
  {
    type: 'secret',
    pattern: /\bclient[_-]?secret\b\s*[:=]\s*["']?[^"'\s,;]+/gi,
    warningOnly: (_match, line) => /value\(env|ParamName/i.test(line)
  },
  {
    type: 'token',
    pattern: /\b(access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*["']?[^"'\s,;]+/gi,
    warningOnly: (_match, line) => /ParamName/i.test(line)
  },
  { type: 'connection-string', pattern: /\b(connectionString|APPLICATIONINSIGHTS_CONNECTION_STRING)\b\s*[:=]\s*["']?[^"'\n]+/gi },
  { type: 'connection-string', pattern: /\bInstrumentationKey\s*=\s*[^;\s]+/gi },
  {
    type: 'auth-state',
    pattern: /\.auth|storageState|cookie/gi,
    warningOnly: (_match, line) =>
      /process\.env|runtimeConfig|playwright\/\.auth|keine |nicht versionieren|niemals|nicht committed|lokal|fehlt|separat/i.test(
        line
      )
  },
  { type: 'token', pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g }
];

function listTextFiles(rootDir: string): string[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const stat = fs.statSync(rootDir);
  if (stat.isFile()) {
    return textExtensions.has(path.extname(rootDir)) ? [rootDir] : [];
  }

  const files: string[] = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'playwright-report', 'test-results', '.git'].includes(entry.name)) {
        files.push(...listTextFiles(fullPath));
      }
      continue;
    }

    if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function maskPreview(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= 8) {
    return '***';
  }

  return `${compact.slice(0, 4)}***${compact.slice(-4)}`;
}

function shouldSkipSelf(filePath: string): boolean {
  return /privacy-scanner\.(ts|spec\.ts)$/.test(filePath.replace(/\\/g, '/'));
}

export function scanMarkdownForPrivacyIssues(rootDir: string): PrivacyScanResult {
  const findings: PrivacyFinding[] = [];

  for (const file of listTextFiles(rootDir)) {
    if (shouldSkipSelf(file)) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of rules) {
        const matches = line.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags));
        for (const match of matches) {
          const matchText = match[0];
          const warningOnly = rule.warningOnly?.(matchText, line) ?? false;
          findings.push({
            file,
            type: warningOnly ? 'warning' : rule.type,
            line: index + 1,
            matchPreview: maskPreview(matchText)
          });
        }
      }
    });
  }

  return {
    ok: findings.every((finding) => finding.type === 'warning'),
    findings
  };
}
