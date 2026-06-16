import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createEvidencePack, evidencePackFiles, slugifyTitle } from '../../../core/evidence-scaffold';
import { validateEvidencePack } from '../../../core/evidence-validator';

function tempEvidenceRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bc-evidence-pack-'));
}

test('Evidence Pack wird mit allen Dateien erzeugt', () => {
  const evidenceRoot = tempEvidenceRoot();
  const result = createEvidencePack({ id: 'SAMPLE-002', title: 'Permission error on posting preview', evidenceRoot });

  for (const fileName of evidencePackFiles) {
    expect(fs.existsSync(path.join(result.packDir, fileName)), fileName).toBe(true);
  }
});

test('Erzeugte Dateien sind nicht leer', () => {
  const result = createEvidencePack({
    id: 'SAMPLE-002',
    title: 'Permission error on posting preview',
    evidenceRoot: tempEvidenceRoot()
  });

  for (const fileName of evidencePackFiles) {
    expect(fs.readFileSync(path.join(result.packDir, fileName), 'utf8').trim().length, fileName).toBeGreaterThan(0);
  }
});

test('Bestehender Ordner wird nicht ueberschrieben', () => {
  const evidenceRoot = tempEvidenceRoot();
  createEvidencePack({ id: 'SAMPLE-002', title: 'Permission error on posting preview', evidenceRoot });

  expect(() =>
    createEvidencePack({ id: 'SAMPLE-002', title: 'Permission error on posting preview', evidenceRoot })
  ).toThrow(/existiert bereits/);
});

test('Slug wird stabil erzeugt', () => {
  expect(slugifyTitle('Permission error on posting preview')).toBe('permission-error-on-posting-preview');
  expect(slugifyTitle('Berechtigung: Vorschau pruefen!')).toBe('berechtigung-vorschau-pruefen');
});

test('Erzeugtes Pack besteht Evidence-Validator mit synthetischen Warnungen', () => {
  const result = createEvidencePack({
    id: 'SAMPLE-002',
    title: 'Permission error on posting preview',
    evidenceRoot: tempEvidenceRoot()
  });
  const validation = validateEvidencePack(result.packDir);

  expect(validation.ok).toBe(true);
  expect(validation.warnings).toContain('04-page-inspection.md wirkt synthetisch oder nicht live belegt.');
});

test('Titel und ID werden in Ticket Summary uebernommen', () => {
  const result = createEvidencePack({
    id: 'sample 002',
    title: 'Permission error on posting preview',
    evidenceRoot: tempEvidenceRoot()
  });
  const summary = fs.readFileSync(path.join(result.packDir, '00-ticket-summary.md'), 'utf8');

  expect(summary).toContain('SAMPLE-002');
  expect(summary).toContain('Permission error on posting preview');
});
