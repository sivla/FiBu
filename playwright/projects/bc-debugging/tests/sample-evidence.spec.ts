import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { evidenceFileExists, readTextEvidence } from '../../../core/evidence';

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

const sampleCases = [
  'sample-001-inventory-posting-setup-missing',
  'SAMPLE-001-missing-field'
];

test('Sample-Evidence-Packs enthalten alle Pflichtdateien', async () => {
  for (const caseId of sampleCases) {
    const caseDir = path.resolve('evidence', caseId);
    for (const fileName of requiredFiles) {
      await expect(evidenceFileExists(path.join(caseDir, fileName)), `${caseId}/${fileName}`).resolves.toBe(true);
    }
  }
});

test('Sample Root Causes trennen Ursache, Technik, Fachlichkeit und ausgeschlossene Hypothesen', async () => {
  for (const caseId of sampleCases) {
    const rootCause = await readTextEvidence(path.resolve('evidence', caseId, '08-root-cause.md'));
    expect(rootCause, caseId).toContain('Bestaetigte Ursache');
    expect(rootCause, caseId).toContain('Technische Erklaerung');
    expect(rootCause, caseId).toContain('Fachliche Erklaerung');
    expect(rootCause, caseId).toContain('Ausgeschlossene Hypothesen');
  }
});

test('Sample Evidence Packs sind frei von offensichtlichen Roh-Kundendaten', async () => {
  for (const caseId of sampleCases) {
    const caseDir = path.resolve('evidence', caseId);
    const files = await fs.readdir(caseDir);
    const textFiles = files.filter((file) => file.endsWith('.md'));
    const joined = (
      await Promise.all(textFiles.map((file) => fs.readFile(path.join(caseDir, file), 'utf8')))
    ).join('\n');

    expect(joined, caseId).not.toMatch(/IBAN|BIC|Kontonummer|@|Telefon|phone/i);
  }
});
