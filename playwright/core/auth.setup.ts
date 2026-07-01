import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import 'dotenv/config';

import { BUSINESS_CENTRAL_AUTH_BLOCKER_RE, BUSINESS_CENTRAL_SHELL_RE } from './bc-helpers';

const authFile = 'playwright/.auth/bc-user.json';
const authMetaFile = 'playwright/.auth/bc-user.meta.json';
const bcUrlSource =
  process.env.BC_AUTH_URL ? 'BC_AUTH_URL' : process.env.FIBU_BOOK5_BC_URL ? 'FIBU_BOOK5_BC_URL' : 'BC_URL';
const bcUrl = process.env.BC_AUTH_URL ?? process.env.FIBU_BOOK5_BC_URL ?? process.env.BC_URL;
const authTimeoutMs = Number(process.env.BC_AUTH_TIMEOUT_MS ?? 10 * 60 * 1000);

if (!bcUrl) {
  throw new Error(
    'BC_AUTH_URL, FIBU_BOOK5_BC_URL oder BC_URL fehlt. Lege eine .env mit Business-Central-Ziel-URL an.'
  );
}

const expectedUrl = new URL(bcUrl);
const currentState = JSON.parse(await fs.readFile('.agent/state/current.json', 'utf8')) as {
  instance?: string;
  company?: string;
};
const expectedEnvironment = currentState.instance ?? expectedUrl.pathname.split('/').filter(Boolean).at(-1) ?? '';
const expectedCompany = currentState.company ?? expectedUrl.searchParams.get('company') ?? '';
if (expectedEnvironment) {
  const pathParts = expectedUrl.pathname.split('/').filter(Boolean);
  if (pathParts.length) {
    pathParts[pathParts.length - 1] = expectedEnvironment;
    expectedUrl.pathname = `/${pathParts.join('/')}`;
  }
}
if (expectedCompany) {
  expectedUrl.searchParams.set('company', expectedCompany);
}
const targetUrl = expectedUrl.toString();

await fs.mkdir('playwright/.auth', { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin'
});

const page = await context.newPage();
await page.goto(targetUrl);
console.log(`Auth target source ${bcUrlSource} with .agent/state/current.json override: environment=${expectedEnvironment || '(unknown)'}, company=${expectedCompany || '(unknown)'}.`);

console.log('');
console.log('Business Central wurde geöffnet.');
console.log('Bitte melde dich vollständig an, inklusive MFA und Company-Auswahl, falls erforderlich.');
console.log('Der Login-State wird automatisch gespeichert, sobald Business Central geladen ist.');
console.log('');

try {
  const shellValidationHandle = await page.waitForFunction(
    ({ authBlockerSource, authBlockerFlags, shellSource, shellFlags }) => {
      const isBusinessCentral = window.location.hostname.toLowerCase().includes('businesscentral.dynamics.com');
      const url = new URL(window.location.href);
      const text = `${document.title}\n${url.pathname}\n${url.search}\n${document.body?.innerText ?? ''}`;
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
  const actualEnvironment = String(shellValidation.pathname ?? '').split('/').filter(Boolean).at(-1) ?? '';
  const actualCompany = String(shellValidation.company ?? '');
  if (expectedEnvironment && actualEnvironment !== expectedEnvironment) {
    throw new Error(
      `Business Central environment mismatch: expected ${expectedEnvironment}, got ${actualEnvironment || '(empty)'}.`
    );
  }
  if (expectedCompany && actualCompany !== expectedCompany) {
    throw new Error(`Business Central company mismatch: expected ${expectedCompany}, got ${actualCompany || '(empty)'}.`);
  }

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
      const redactedPathname = url.pathname.replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '{tenant-guid}'
      );

      return {
        host: url.hostname,
        pathname: redactedPathname,
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
