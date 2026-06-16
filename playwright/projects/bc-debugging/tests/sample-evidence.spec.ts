import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { evidenceFileExists, readTextEvidence } from '../../../core/evidence';

const caseId = 'sample-001-inventory-posting-setup-missing';
const caseDir = path.resolve('evidence', caseId);

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

test('Sample-Evidence-Pack enthaelt alle Pflichtdateien', async () => {
  for (const fileName of requiredFiles) {
    await expect(evidenceFileExists(path.join(caseDir, fileName)), fileName).resolves.toBe(true);
  }
});

test('Sample Root Cause trennt Fakt, Ursache und Regression', async () => {
  const rootCause = await readTextEvidence(path.join(caseDir, '08-root-cause.md'));
  expect(rootCause).toContain('Bestaetigte Ursache');
  expect(rootCause).toContain('Technische Erklaerung');
  expect(rootCause).toContain('Fachliche Erklaerung');
  expect(rootCause).toContain('Ausgeschlossene Hypothesen');
});

test('Sample Evidence Pack ist frei von offensichtlichen Roh-Kundendaten', async () => {
  const files = await fs.readdir(caseDir);
  const textFiles = files.filter((file) => file.endsWith('.md'));
  const joined = (
    await Promise.all(textFiles.map((file) => fs.readFile(path.join(caseDir, file), 'utf8')))
  ).join('\n');

  expect(joined).not.toMatch(/IBAN|BIC|Kontonummer|@|Telefon|phone/i);
});
