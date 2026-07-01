import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import 'dotenv/config';

import { BUSINESS_CENTRAL_AUTH_BLOCKER_RE, BUSINESS_CENTRAL_SHELL_RE } from './bc-helpers';

const authFile = 'playwright/.auth/bc-user.json';
const authMetaFile = 'playwright/.auth/bc-user.meta.json';
const bcUrl = process.env.BC_URL;
const authTimeoutMs = Number(process.env.BC_AUTH_TIMEOUT_MS ?? 10 * 60 * 1000);

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
  const shellValidationHandle = await page.waitForFunction(
    ({ authBlockerSource, authBlockerFlags, shellSource, shellFlags }) => {
      const isBusinessCentral = window.location.hostname.toLowerCase().includes('businesscentral.dynamics.com');
      const text = document.body?.innerText ?? '';
      const authBlockerRe = new RegExp(authBlockerSource, authBlockerFlags);
      const shellRe = new RegExp(shellSource, shellFlags);
      if (!isBusinessCentral || authBlockerRe.test(text) || !shellRe.test(text)) return false;

      return {
        host: window.location.hostname,
        pathname: window.location.pathname,
        company: new URL(window.location.href).searchParams.get('company') ?? '',
        matchedShellSignal: text.match(shellRe)?.[0] ?? ''
      };
    },
    {
      authBlockerSource: BUSINESS_CENTRAL_AUTH_BLOCKER_RE.source,
      authBlockerFlags: BUSINESS_CENTRAL_AUTH_BLOCKER_RE.flags,
      shellSource: BUSINESS_CENTRAL_SHELL_RE.source,
      shellFlags: BUSINESS_CENTRAL_SHELL_RE.flags
    },
    { timeout: authTimeoutMs }
  );
  const shellValidation = await shellValidationHandle.jsonValue();

  await page.waitForTimeout(5000);

  await context.storageState({ path: authFile });
  await fs.writeFile(
    authMetaFile,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        purpose: 'business-central-auth-shell-validation',
        generatedAt: new Date().toISOString(),
        authFile,
        shellValidation: true,
        host: shellValidation.host,
        pathname: shellValidation.pathname,
        company: shellValidation.company,
        matchedShellSignal: shellValidation.matchedShellSignal
      },
      null,
      2
    )}\n`,
    'utf8'
  );
  console.log(`Login-State gespeichert: ${authFile}`);
} catch (error) {
  const shellDiagnosis = await page.evaluate(
    ({ authBlockerSource, authBlockerFlags, shellSource, shellFlags }) => {
      const url = new URL(window.location.href);
      const text = document.body?.innerText ?? '';
      const authBlockerRe = new RegExp(authBlockerSource, authBlockerFlags);
      const shellRe = new RegExp(shellSource, shellFlags);

      return {
        host: url.hostname,
        pathname: url.pathname,
        hasCompanyParam: url.searchParams.has('company'),
        company: url.searchParams.get('company') ?? '',
        title: document.title,
        bodyTextLength: text.length,
        authBlockerDetected: authBlockerRe.test(text),
        shellSignalDetected: shellRe.test(text),
        matchedShellSignal: text.match(shellRe)?.[0] ?? ''
      };
    },
    {
      authBlockerSource: BUSINESS_CENTRAL_AUTH_BLOCKER_RE.source,
      authBlockerFlags: BUSINESS_CENTRAL_AUTH_BLOCKER_RE.flags,
      shellSource: BUSINESS_CENTRAL_SHELL_RE.source,
      shellFlags: BUSINESS_CENTRAL_SHELL_RE.flags
    }
  ).catch(error => ({
    diagnosisError: error instanceof Error ? error.message : String(error)
  }));

  console.error('');
  console.error('Business-Central-Shell wurde nicht bestaetigt. Login-State wurde nicht gespeichert.');
  console.error('Bitte Login/MFA abschliessen und warten, bis Suche/Rollencenter/My Settings sichtbar ist.');
  console.error(`Shell-Diagnose: ${JSON.stringify(shellDiagnosis)}`);
  throw error;
} finally {
  await browser.close().catch(() => undefined);
}
