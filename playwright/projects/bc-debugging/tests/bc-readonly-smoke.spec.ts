import { chromium, expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { bcPageUrl, compactPageText, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { loadBcRuntimeConfig, validateBcRuntimeConfig } from '../../../core/bc-runtime-config';
import { decideSafeAction } from '../../../core/safe-actions';

const runtimeConfig = loadBcRuntimeConfig();
const chromiumExecutableExists = fsSync.existsSync(chromium.executablePath());

test.use({
  storageState: runtimeConfig.authStatePath
});

test('BC runtime safety flags bleiben read-only', () => {
  const validation = validateBcRuntimeConfig(runtimeConfig);

  expect(validation.errors).toEqual([]);
});

test.describe('optionaler BC UI-Smoke', () => {
  test.skip(!runtimeConfig.hasUiConfig, 'BC_URL fehlt; Live-BC-Smoke wird uebersprungen.');
  test.skip(!chromiumExecutableExists, 'Playwright Chromium fehlt; Live-BC-Smoke wird uebersprungen.');

  test('BC read-only smoke: Role Center oeffnet ohne Schreibaktion', async ({ page }, testInfo) => {
    const validation = validateBcRuntimeConfig(runtimeConfig);
    expect(validation.errors).toEqual([]);

    const navigationDecision = decideSafeAction({
      environment: runtimeConfig.environment?.toLocaleLowerCase('de-DE') === 'production' ? 'production' : 'sandbox',
      risk: 'ui-navigation',
      hasExplicitApproval: false,
      actionLabel: 'Open Role Center'
    });
    expect(navigationDecision.allowed, navigationDecision.reason).toBe(true);

    await page.goto(bcPageUrl(0), { waitUntil: 'domcontentloaded' });
    await waitForBusinessCentralShell(page);

    const criticalButtons = page.getByRole('button', {
      name: /Post|Buchen|Send|Start|Release|Apply|OK|Delete|Payment|Export/i
    });
    const criticalButtonCount = await criticalButtons.count().catch(() => 0);

    const text = await compactPageText(page, {
      include: /Business Central|Suchen|Search|Meine Einstellungen|My Settings|Company|Mandant/i,
      maxLines: 60
    });

    const outputDir = path.join(testInfo.outputDir, 'bc-readonly-smoke');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(
      path.join(outputDir, 'role-center-readonly-smoke.txt'),
      [
        'read-only smoke ausgefuehrt',
        'keine Schreibaktion ausgefuehrt',
        `kritische Buttons sichtbar, aber nicht geklickt: ${criticalButtonCount}`,
        '',
        text
      ].join('\n'),
      'utf8'
    );

    expect(text).toMatch(/Business Central|Suchen|Search/i);
  });
});
