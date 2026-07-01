import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import 'dotenv/config';

import { isBusinessCentralAuthBlockerText, isBusinessCentralShellText } from './bc-helpers';

const authFile = 'playwright/.auth/bc-user.json';
const bcUrl = process.env.BC_URL;

if (!bcUrl) {
  throw new Error('BC_URL fehlt. Lege eine .env mit BC_URL=https://businesscentral.dynamics.com/... an.');
}

await fs.mkdir('playwright/.auth', { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin'
});

const page = await context.newPage();
await page.goto(bcUrl);

console.log('');
console.log('Business Central wurde geöffnet.');
console.log('Bitte melde dich vollständig an, inklusive MFA und Company-Auswahl, falls erforderlich.');
console.log('Der Login-State wird automatisch gespeichert, sobald Business Central geladen ist.');
console.log('');

try {
  await page.waitForFunction(
    () => {
      const isBusinessCentral = window.location.hostname.toLowerCase().includes('businesscentral.dynamics.com');
      const text = document.body?.innerText ?? '';
      return isBusinessCentral && !isBusinessCentralAuthBlockerText(text) && isBusinessCentralShellText(text);
    },
    undefined,
    { timeout: 10 * 60 * 1000 }
  );

  await page.waitForTimeout(5000);

  await context.storageState({ path: authFile });
  console.log(`Login-State gespeichert: ${authFile}`);
} catch (error) {
  console.error('');
  console.error('Business-Central-Shell wurde nicht bestaetigt. Login-State wurde nicht gespeichert.');
  console.error('Bitte Login/MFA abschliessen und warten, bis Suche/Rollencenter/My Settings sichtbar ist.');
  throw error;
} finally {
  await browser.close().catch(() => undefined);
}
