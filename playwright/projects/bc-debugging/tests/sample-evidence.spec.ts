import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { validateEvidencePack } from '../../../core/evidence-validator';

const samplePack = path.resolve('debugging-book', 'evidence', 'SAMPLE-001-missing-field');
const incompletePack = path.resolve(
  'playwright',
  'projects',
  'bc-debugging',
  'fixtures',
  'incomplete-evidence-pack'
);

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

test('SAMPLE-001-missing-field enthaelt alle Pflichtdateien und keine leeren Pflichtdateien', () => {
  for (const fileName of requiredFiles) {
    const filePath = path.join(samplePack, fileName);
    expect(fs.existsSync(filePath), fileName).toBe(true);
    expect(fs.readFileSync(filePath, 'utf8').trim().length, fileName).toBeGreaterThan(0);
  }
});

test('SAMPLE-001-missing-field erfuellt Root-Cause-, Regression- und Page-Inspection-Struktur', () => {
  const result = validateEvidencePack(samplePack);

  expect(result.ok).toBe(true);
  expect(result.missingFiles).toEqual([]);
  expect(result.missingSections).toEqual({});
});

test('Synthetische Page Inspection erzeugt Warnung, aber keinen Fehler', () => {
  const result = validateEvidencePack(samplePack);

  expect(result.ok).toBe(true);
  expect(result.warnings).toContain('04-page-inspection.md wirkt synthetisch oder nicht live belegt.');
});

test('Unvollstaendiges Evidence-Fixture faellt durch', () => {
  const result = validateEvidencePack(incompletePack);

  expect(result.ok).toBe(false);
  expect(result.missingFiles).toContain('01-screenshot-analysis.md');
  expect(result.missingSections['08-root-cause.md']).toBeTruthy();
});
