import { expect, test } from '@playwright/test';
import path from 'node:path';
import { scanMarkdownForPrivacyIssues } from '../../../core/privacy-scanner';

test('Privacy-Scanner akzeptiert saubere synthetische Fixtures', () => {
  const result = scanMarkdownForPrivacyIssues(
    path.resolve('playwright', 'projects', 'bc-debugging', 'fixtures', 'privacy-clean')
  );

  expect(result.ok).toBe(true);
  expect(result.findings.every((finding) => finding.type === 'warning')).toBe(true);
});

test('Privacy-Scanner findet Secrets, Tokens, IBANs und Auth-State-Hinweise', () => {
  const result = scanMarkdownForPrivacyIssues(
    path.resolve('playwright', 'projects', 'bc-debugging', 'fixtures', 'privacy-dirty')
  );

  expect(result.ok).toBe(false);
  expect(result.findings.map((finding) => finding.type)).toEqual(
    expect.arrayContaining(['email', 'iban', 'secret', 'token', 'connection-string', 'auth-state'])
  );
  expect(result.findings.every((finding) => finding.matchPreview.includes('***'))).toBe(true);
});
