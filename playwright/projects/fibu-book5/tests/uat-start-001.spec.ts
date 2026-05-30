import { test } from '@playwright/test';
import 'dotenv/config';
import {
  openSearchResult,
  openSecondSearchBlockResult,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json'
});

test('UAT-START-001 Spielwiese öffnen und CRONUS einordnen', async ({ page }) => {
  const bcUrl = requireBcUrl(project.envPrefix);

  await page.goto(bcUrl);
  await waitForBusinessCentralShell(page);

  await screenshot(page, 'uat-start-001-020-rollencenter-startseite.png');

  await searchFor(page, 'Companies');
  await screenshot(page, 'uat-start-001-050-alt-q-suche.png');

  await openSearchResult(page, /^Companies$/i);
  await screenshot(page, 'uat-start-001-060-unternehmen-seite.png');

  await searchFor(page, 'Company Information');
  await openSecondSearchBlockResult(page);
  await screenshot(page, 'uat-start-001-070-unternehmensdaten.png');
});
