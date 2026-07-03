import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import 'dotenv/config';

import { BUSINESS_CENTRAL_AUTH_BLOCKER_RE, BUSINESS_CENTRAL_SHELL_RE } from './bc-helpers';

const authFile = 'playwright/.auth/bc-user.json';
const authMetaFile = 'playwright/.auth/bc-user.meta.json';
const authProfileDir = 'playwright/.auth/bc-profile';
const authResultFile =
  'playwright/projects/fibu-book5/evidence/target-027d31-auth-refresh-then-readonly-discovery/TARGET-027D31-AUTH-result.json';
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
await fs.mkdir(authProfileDir, { recursive: true });
await fs.mkdir('playwright/projects/fibu-book5/evidence/target-027d31-auth-refresh-then-readonly-discovery', {
  recursive: true
});

type AuthResultArgs = {
  resultStatus: string;
  shellValidation?: Record<string, unknown>;
  shellDiagnosis?: Record<string, unknown>;
  savedState: boolean;
  blockedBy: string[];
};

async function writeAuthResult(args: AuthResultArgs) {
  const diagnosisHost =
    typeof args.shellDiagnosis?.host === 'string'
      ? args.shellDiagnosis.host
      : typeof args.shellValidation?.host === 'string'
        ? args.shellValidation.host
        : '';
  const diagnosisPathname =
    typeof args.shellDiagnosis?.pathname === 'string'
      ? args.shellDiagnosis.pathname
      : typeof args.shellValidation?.pathname === 'string'
        ? args.shellValidation.pathname
        : '';
  const diagnosisTitle = typeof args.shellDiagnosis?.title === 'string' ? args.shellDiagnosis.title : '';
  const matchedShellSignal =
    typeof args.shellDiagnosis?.matchedShellSignal === 'string'
      ? args.shellDiagnosis.matchedShellSignal
      : typeof args.shellValidation?.matchedShellSignal === 'string'
        ? args.shellValidation.matchedShellSignal
        : '';
  const reachedShell = args.savedState && args.blockedBy.length === 0;

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: 'TARGET-027D31-AUTH-REFRESH-THEN-READONLY-DISCOVERY',
    source: 'playwright-auth-refresh-attempt',
    resultStatus: args.resultStatus,
    instance: expectedEnvironment,
    company: expectedCompany,
    page: reachedShell ? 'Business Central shell reached' : 'not reached - Microsoft sign-in page before Business Central shell',
    url: diagnosisHost.includes('login.microsoftonline.com') ? 'redacted-login.microsoftonline.com' : 'redacted-businesscentral-url',
    actionsTaken: [
      'Ran npm run auth:bc for the active D31 auth refresh gate.',
      `The Playwright auth browser targeted ${expectedEnvironment || '(unknown)'} / ${expectedCompany || '(unknown)'}.`,
      reachedShell
        ? 'Business Central shell validation succeeded and Playwright storage state was saved.'
        : `The command waited ${authTimeoutMs} ms and did not save a Business Central shell-validated storage state.`
    ],
    actionsNotTaken: [
      'No D31 VAT Assisted Setup or Manual Setup page was opened by this auth command.',
      'No setup values were typed.',
      'No wizard Next, Finish, Apply or OK was clicked.',
      'No master data, document, Preview Posting, Posting, payment or API shortcut occurred.',
      'No bookmaster change was made.'
    ],
    authDiagnosis: {
      command: 'npm run auth:bc',
      timeoutMs: authTimeoutMs,
      targetSource: `${bcUrlSource} with current.json override`,
      expectedInstance: expectedEnvironment,
      expectedCompany,
      diagnosisHost,
      diagnosisPathname,
      diagnosisTitle,
      shellSignalDetected: reachedShell || Boolean(matchedShellSignal),
      matchedShellSignal,
      savedState: args.savedState
    },
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [],
    proved: reachedShell
      ? [
          'The auth refresh command uses the intended playthru / UNIVERSAARL-DE target override.',
          'A Business Central shell signal was reached.',
          'Playwright storage state was refreshed and saved.'
        ]
      : [
          'The auth refresh command uses the intended playthru / UNIVERSAARL-DE target override.',
          'No Business Central shell signal was reached during this attempt.',
          'No Playwright storage state was refreshed or saved.',
          'D31 VAT discovery remains correctly blocked before any VAT UI action.'
        ],
    notProved: reachedShell
      ? [
          'No Assisted Setup, Manual Setup or VAT Posting Setup route was observed.',
          'No VAT setup readiness, posting readiness, VAT Entries or G/L Entries are proven.'
        ]
      : [
          'playthru / UNIVERSAARL-DE shell context was not freshly confirmed.',
          'No Assisted Setup, Manual Setup or VAT Posting Setup route was observed.',
          'No VAT setup readiness, posting readiness, VAT Entries or G/L Entries are proven.'
        ],
    blockedBy: args.blockedBy,
    warnings: reachedShell
      ? ['Run npm run auth:bc:check before any Business Central workflow.']
      : [
          'Do not rerun D31 read-only discovery until auth:bc:check returns canUseStoredAuth=true.',
          'Normal browser login or old storageState must not be accepted as current Business Central evidence.'
        ],
    nextCase: reachedShell
      ? 'TARGET-027D31-VAT-ASSISTED-SETUP-READONLY-DISCOVERY'
      : 'TARGET-027D31-AUTH-REFRESH-THEN-READONLY-DISCOVERY',
    nextStepDecision: {
      currentCase: 'TARGET-027D31-AUTH-REFRESH-THEN-READONLY-DISCOVERY',
      plannedNextCaseBeforeReview: 'TARGET-027D31-AUTH-REFRESH-THEN-READONLY-DISCOVERY',
      lastEvidenceSummary: reachedShell
        ? 'auth:bc reached the Business Central shell and saved Playwright storage state; auth:bc:check must confirm freshness next.'
        : `auth:bc stayed before Business Central shell for ${authTimeoutMs} ms and saved no Playwright storage state.`,
      isPlannedNextCaseStillSensible: true,
      reason: reachedShell
        ? 'The auth gate can move to auth:bc:check and then D31 read-only discovery.'
        : 'The active blocker is still Playwright shell auth, not VAT UI or setup logic.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027D31-AUTH-REFRESH-THEN-READONLY-DISCOVERY',
          status: reachedShell ? 'ready-after-current' : 'blocked',
          reason: reachedShell
            ? 'Requires auth:bc:check canUseStoredAuth=true.'
            : 'Needs Login/MFA completion inside the Playwright auth browser until BC shell appears.'
        },
        {
          caseId: 'TARGET-027D31-VAT-ASSISTED-SETUP-READONLY-DISCOVERY',
          status: reachedShell ? 'ready-after-current' : 'blocked',
          reason: 'Requires auth:bc:check canUseStoredAuth=true first.'
        },
        {
          caseId: 'TARGET-027D32-VAT-ASSISTED-SETUP-WRITE-GATE-DECISION',
          status: 'needs-ui-discovery-first',
          reason: 'Requires D31 read-only route evidence.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Can resume after VAT auth/discovery is resolved or intentionally parked.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Requires VAT and dimensions status.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: reachedShell
        ? 'TARGET-027D31-VAT-ASSISTED-SETUP-READONLY-DISCOVERY'
        : 'TARGET-027D31-AUTH-REFRESH-THEN-READONLY-DISCOVERY',
      whySelectedNextCaseIsBest: reachedShell
        ? 'Fresh auth is the prerequisite for safe D31 read-only VAT route discovery.'
        : 'It is the remaining gate that prevents false BC evidence and unsafe VAT discovery.',
      risksBeforeNextCase: reachedShell
        ? ['Do not run D31 until auth:bc:check confirms canUseStoredAuth=true.']
        : [
            'Repeated auth attempts will keep timing out if Login/MFA is not completed in the Playwright auth browser.',
            'Running BC tests with stale storageState would only create misleading evidence.'
          ],
      requiredPreparation: reachedShell
        ? ['Run npm run auth:bc:check and require canUseStoredAuth=true.']
        : [
            'Complete Login/MFA in the Playwright-opened browser window, not only in normal Chrome/Codex.',
            'Wait until Role Center, Search/Tell Me, My Settings or another Business Central shell signal is visible.',
            'Run npm run auth:bc:check and require canUseStoredAuth=true.'
          ]
    },
    changedFiles: [authResultFile],
    evidenceRefs: [],
    requiresReview: false,
    safeToFinalizeState: false,
    statePatch: {},
    reason: reachedShell
      ? 'Auth refresh reached shell; state finalization still requires explicit downstream validation.'
      : 'Active case blocked at Playwright auth shell validation before any Business Central UI evidence.',
    completedAt: new Date().toISOString()
  };

  await fs.writeFile(authResultFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

const context = await chromium.launchPersistentContext(authProfileDir, {
  headless: false,
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
  await writeAuthResult({
    resultStatus: 'observed-auth-shell-saved',
    shellValidation: shellValidation as Record<string, unknown>,
    savedState: true,
    blockedBy: []
  });
  console.log(`Login-State gespeichert: ${authFile}`);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
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
  console.error(`Auth-Blocker: ${errorMessage}`);
  await writeAuthResult({
    resultStatus: 'blocked-auth-before-bc-shell',
    shellDiagnosis: shellDiagnosis as Record<string, unknown>,
    savedState: false,
    blockedBy: [
      'auth:playwright-window-stayed-before-business-central-shell',
      'auth:shell-signal-not-detected',
      'auth:storage-state-not-refreshed'
    ]
  });
  process.exitCode = 1;
} finally {
  await context.close().catch(() => undefined);
}
