import fs from 'node:fs';
import path from 'node:path';

export type EvidenceValidationResult = {
  ok: boolean;
  missingFiles: string[];
  missingSections: Record<string, string[]>;
  warnings: string[];
};

const requiredFiles = [
  '00-ticket-summary.md',
  '01-screenshot-analysis.md',
  '02-hypotheses.md',
  '03-repro-plan.md',
  '04-page-inspection.md',
  '05-data-checks.md',
  '06-telemetry.md',
  '07-repro-steps.md',
  '08-root-cause.md',
  '09-fix-or-workaround.md',
  '10-regression-test.md',
  '11-book-chapter-draft.md'
];

const recommendedFiles = [
  '12-lessons-learned.md',
  '13-follow-up-questions.md',
  '14-risk-notes.md'
];

const requiredSections: Record<string, RegExp[]> = {
  '04-page-inspection.md': [/page/i, /table|source table/i, /company|environment/i],
  '08-root-cause.md': [
    /cause|ursache/i,
    /beleg|evidence/i,
    /technische erklaerung|technical explanation/i,
    /fachliche erklaerung|business explanation/i,
    /ausgeschlossene hypothesen|excluded hypotheses/i
  ],
  '10-regression-test.md': [/regressionstest|testplan/i, /expected result|erwartung|assertion/i]
};

function readMarkdownIfPresent(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  return fs.readFileSync(filePath, 'utf8');
}

export function validateEvidencePack(packDir: string): EvidenceValidationResult {
  const missingFiles: string[] = [];
  const missingSections: Record<string, string[]> = {};
  const warnings: string[] = [];

  for (const fileName of requiredFiles) {
    const filePath = path.join(packDir, fileName);
    const content = readMarkdownIfPresent(filePath);
    if (content === undefined || content.trim().length === 0) {
      missingFiles.push(fileName);
    }
  }

  for (const fileName of recommendedFiles) {
    const filePath = path.join(packDir, fileName);
    const content = readMarkdownIfPresent(filePath);
    if (content === undefined || content.trim().length === 0) {
      warnings.push(`${fileName} fehlt oder ist leer. Empfohlen fuer vollstaendige Lessons/Risiken.`);
    }
  }

  for (const [fileName, patterns] of Object.entries(requiredSections)) {
    const content = readMarkdownIfPresent(path.join(packDir, fileName)) ?? '';
    const missing = patterns
      .filter((pattern) => !pattern.test(content))
      .map((pattern) => pattern.source.replace(/\\/g, ''));

    if (missing.length > 0) {
      missingSections[fileName] = missing;
    }
  }

  const pageInspection = readMarkdownIfPresent(path.join(packDir, '04-page-inspection.md')) ?? '';
  if (/synthetisch|nicht live|sample/i.test(pageInspection)) {
    warnings.push('04-page-inspection.md wirkt synthetisch oder nicht live belegt.');
  }

  return {
    ok: missingFiles.length === 0 && Object.keys(missingSections).length === 0,
    missingFiles,
    missingSections,
    warnings
  };
}
