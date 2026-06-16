import { expect, test } from '@playwright/test';
import { bcPageUrl, compactPageText, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

test.skip(!process.env.BC_URL, 'BC_URL fehlt; Live-BC-Smoke wird uebersprungen.');

test.use({
  storageState: process.env.BC_STORAGE_STATE ?? 'playwright/.auth/bc-user.json'
});

test('BC read-only smoke: Role Center oeffnet und schreibt kompakten Shell-Nachweis', async ({ page }) => {
  await page.goto(bcPageUrl(0), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);

  const text = await compactPageText(page, {
    include: /Business Central|Suchen|Search|Meine Einstellungen|My Settings|Company|Mandant/i,
    maxLines: 60
  });

  await writeTextEvidence(evidencePath(project.defaultEvidenceCase, 'playwright/role-center-readonly-smoke.txt'), text);
  expect(text).toMatch(/Business Central|Suchen|Search/i);
});
