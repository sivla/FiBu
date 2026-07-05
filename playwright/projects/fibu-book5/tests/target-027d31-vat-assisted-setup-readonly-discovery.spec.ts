import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D31-VAT-ASSISTED-SETUP-READONLY-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d31-vat-assisted-setup-readonly-discovery';
const EVIDENCE_REL_DIR = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_REL_DIR);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D31-result.json');

type RouteProbe = {
  id: string;
  label: string;
  searchTerm: string;
  resultPattern: RegExp;
  contextSignals: RegExp[];
  expectedLearning: string;
};

type Candidate = {
  frameUrl: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  risk: string[];
};

const routeProbes: RouteProbe[] = [
  {
    id: 'assisted-setup-vat',
    label: 'Assisted Setup VAT route',
    searchTerm: 'VAT Setup',
    resultPattern: /VAT Setup|Set up VAT|MwSt.*Einrichtung|USt.*Einrichtung|Assisted Setup|Unterst.*Setup|Unterst.*Einrichtung/i,
    contextSignals: [/VAT|MwSt|USt|Setup|Einrichtung|Assisted|Unterst/i],
    expectedLearning: 'Assisted Setup is a guided route. It is useful only after the wizard boundary and write buttons are clearly separated.'
  },
  {
    id: 'manual-setup-vat',
    label: 'Manual Setup VAT route',
    searchTerm: 'Manual Setup',
    resultPattern: /Manual Setup|Manuelle Einrichtung|Einrichtung|VAT|MwSt|USt/i,
    contextSignals: [/Manual Setup|Manuelle Einrichtung|Einrichtung|VAT|MwSt|USt/i],
    expectedLearning: 'Manual Setup is the setup navigation area. It can point to VAT pages without completing a wizard.'
  }
];

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function targetUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function riskFor(label: string) {
  const risk: string[] = [];
  if (/finish|fertig|ok$|^ok|apply|anwenden|yes|ja\b|weiter|next|start|starten|complete|abschlie/i.test(label)) {
    risk.push('could-confirm-or-advance-setup');
  }
  if (/new|neu|edit|bearbeiten|delete|loschen|loeschen|import|export|validate|publish|post|preview|buchen/i.test(label)) {
    risk.push('could-change-setup-or-data');
  }
  return risk;
}

function dangerousDialogSignal(text: string) {
  return /Do you want to post|Moechten Sie buchen|Delete\?|Loeschen\?|Preview Posting|Buchungsvorschau|Ship|Invoice|Payment/i.test(text)
    || /(^|\n)\s*(Apply|Anwenden|Finish|Fertig stellen|Next|Weiter|OK|Yes|Ja)\s*($|\n)/i.test(text);
}

function isSearchOverlay(text: string) {
  return /Tell me|Nach.*suchen|Suchen nach|Was moechten Sie tun|Wie moechten Sie weiter verfahren|Pages and Tasks|Seiten und Aufgaben/i.test(text);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function collectVisibleText(page: Page) {
  const lines: string[] = [];
  for (const frame of page.frames()) {
    const frameLines = await frame
      .evaluate(() => {
        return [...document.querySelectorAll<HTMLElement>('body *')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '').replace(/\s+/g, ' ').trim();
            const visible =
              text.length > 0 &&
              rect.width > 1 &&
              rect.height > 1 &&
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < window.innerHeight &&
              rect.left < window.innerWidth &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              Number(style.opacity || '1') > 0;
            return visible ? text : '';
          })
          .filter(Boolean)
          .slice(0, 450);
      })
      .catch(() => []);
    lines.push(...frameLines);
  }
  return clean([...new Set(lines)].join('\n'));
}

async function collectCompactText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [/Assisted|Unterst|Manual|Manuell|Setup|Einrichtung|VAT|MwSt|USt|Finish|Fertig|Next|Weiter|Apply|Anwenden|OK|New|Neu|Edit|Bearbeiten/i],
      maxLines: 160,
      maxLineLength: 240
    })
  );
}

async function collectCandidates(page: Page, pattern: RegExp) {
  const entries: Candidate[] = [];
  for (const frame of page.frames()) {
    const frameEntries = await frame
      .evaluate(({ source, flags }) => {
        const interesting = new RegExp(source, flags);
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[role="option"],a,tr,[role="row"],[aria-label],[title]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = normalize(element.innerText || element.textContent);
            const ariaLabel = normalize(element.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title'));
            const label = `${text} ${ariaLabel} ${title}`;
            return {
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              text,
              ariaLabel,
              title,
              visible:
                label.length > 0 &&
                interesting.test(label) &&
                rect.width > 0 &&
                rect.height > 0 &&
                style.visibility !== 'hidden' &&
                style.display !== 'none',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter((entry) => entry.visible)
          .slice(0, 80);
      }, { source: pattern.source, flags: pattern.flags.replace('g', '') })
      .catch(() => []);
    for (const entry of frameEntries) {
      const label = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
      entries.push({
        frameUrl: sanitizeUrl(frame.url()),
        role: entry.role,
        text: clean(entry.text).slice(0, 220),
        ariaLabel: clean(entry.ariaLabel).slice(0, 180),
        title: clean(entry.title).slice(0, 180),
        x: entry.x,
        y: entry.y,
        width: entry.width,
        height: entry.height,
        risk: riskFor(label)
      });
    }
  }
  return entries.slice(0, 40);
}

async function screenshot(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = path.join(EVIDENCE_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function openReadOnlyRoute(page: Page, probe: RouteProbe) {
  await searchFor(page, probe.searchTerm);
  const searchCandidates = await collectCandidates(page, /VAT|MwSt|USt|Setup|Einrichtung|Manual|Manuell|Assisted|Unterst/i);
  await writeJson(path.join(EVIDENCE_DIR, `${probe.id}-search-candidates.json`), {
    caseId: CASE_ID,
    probe: probe.id,
    searchTerm: probe.searchTerm,
    candidates: searchCandidates
  });

  let clicked = false;
  let clickError = '';
  try {
    await openSearchResult(page, probe.resultPattern, { requireUnique: false });
    clicked = true;
    await waitForBusinessCentralShell(page);
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape').catch(() => undefined);
  } catch (error) {
    clickError = String(error);
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(1200);
  }

  const visibleText = await collectVisibleText(page);
  const compactText = await collectCompactText(page);
  const text = visibleText || compactText || clean(await pageText(page));
  const contextVisible = clicked && probe.contextSignals.some((signal) => signal.test(text)) && !isSearchOverlay(text);
  const dangerousDialog = dangerousDialogSignal(text);
  const riskCandidates = await collectCandidates(page, /Finish|Fertig|Next|Weiter|Apply|Anwenden|OK|New|Neu|Edit|Bearbeiten|Import|Export|Post|Preview|Buchen/i);
  const status = contextVisible && !dangerousDialog ? 'observed' : 'blocked';
  const textFile = `${probe.id}.txt`;
  const screenshotFile = `${probe.id}.png`;

  await writeText(textFile, text || 'No visible route text captured.');
  await screenshot(page, screenshotFile, {
    page: probe.label,
    step: 'Read-only VAT setup route discovery',
    searchTerm: probe.searchTerm,
    clickedSearchResult: clicked,
    clickError,
    status,
    screenshotQualityGate: {
      contextVisible,
      searchOverlay: isSearchOverlay(text),
      dangerousDialog,
      acceptedAsProof: status === 'observed'
    },
    whatAUserSees: probe.expectedLearning,
    actionBoundary: 'Risk buttons are inventoried only. Next, Finish, Apply, OK, New/Edit and setup writes are not clicked.',
    riskCandidates,
    internallyProves:
      status === 'observed'
        ? `${probe.label} route context is reachable read-only in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`
        : `${probe.label} route was searched, but no safe route context was accepted.`,
    doesNotProve: [
      'No VAT setup value is correct.',
      'No VAT Posting Setup row was created or changed.',
      'No wizard was completed.',
      'No Preview Posting.',
      'No Posting.'
    ]
  });

  return {
    id: probe.id,
    label: probe.label,
    status,
    searchTerm: probe.searchTerm,
    clickedSearchResult: clicked,
    clickError,
    url: sanitizeUrl(page.url()),
    textFile,
    screenshot: screenshotFile,
    screenshotMetadata: screenshotFile.replace(/\.png$/i, '.screenshot.json'),
    candidatesFile: `${probe.id}-search-candidates.json`,
    blockedBy:
      status === 'observed'
        ? []
        : [
            ...(!clicked ? [`Search result was not opened for ${probe.label}.`] : []),
            ...(!contextVisible ? [`No accepted read-only setup context for ${probe.label}.`] : []),
            ...(isSearchOverlay(text) ? [`Visible text still looks like Tell-Me/search overlay for ${probe.label}.`] : []),
            ...(dangerousDialog ? [`Dangerous dialog/action signal detected for ${probe.label}; nothing was confirmed.`] : [])
          ],
    warnings: riskCandidates.length > 0 ? ['Write-capable or wizard-advance actions are visible, but were not clicked.'] : []
  };
}

test('TARGET-027D31 discovers VAT Assisted/Manual Setup routes read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  await page.goto(targetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);

  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeUrl(page.url())}`).toBe(true);

  const shellText = await collectCompactText(page);
  await writeText('shell-context.txt', shellText || 'Business Central shell reached.');
  await screenshot(page, 'shell-context.png', {
    page: 'Business Central shell',
    step: 'Before VAT Assisted/Manual Setup route discovery',
    status: 'observed',
    screenshotQualityGate: {
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      acceptedAsProof: true
    },
    doesNotProve: ['No VAT route opened yet.', 'No setup changed.']
  });

  const routeResults = [];
  for (const probe of routeProbes) {
    routeResults.push(await openReadOnlyRoute(page, probe));
  }

  const observed = routeResults.filter((entry) => entry.status === 'observed');
  const blockedBy = routeResults.flatMap((entry) => entry.blockedBy);
  const warnings = Array.from(new Set(routeResults.flatMap((entry) => entry.warnings)));
  const resultStatus = observed.length > 0 ? (blockedBy.length === 0 ? 'observed' : 'partially-observed') : 'blocked';
  const nextCase =
    resultStatus === 'blocked'
      ? 'TARGET-027D31B-VAT-SETUP-ROUTE-UI-SOURCE-FOLLOWUP'
      : 'TARGET-027D32-VAT-ASSISTED-SETUP-WRITE-GATE-DECISION';

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary: 'Auth is fresh for playthru / UNIVERSAARL-DE; D31 can inspect VAT Assisted/Manual Setup routes read-only.',
    isPlannedNextCaseStillSensible: true,
    reason:
      resultStatus === 'blocked'
        ? 'No safe Assisted/Manual VAT setup context was accepted; setup writes stay locked.'
        : 'At least one VAT setup route context is visible read-only; the next step can be a separate source-backed write-gate decision.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-027D32-VAT-ASSISTED-SETUP-WRITE-GATE-DECISION',
        status: resultStatus === 'blocked' ? 'blocked' : 'ready-next',
        reason:
          resultStatus === 'blocked'
            ? 'Needs a safe VAT setup route context first.'
            : 'Route evidence exists; a separate gate can decide exact values and stop rules before any setup write.'
      },
      {
        caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
        status: 'ready-after-current',
        reason: 'Can resume after VAT route is observed or intentionally parked.'
      },
      {
        caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
        status: 'needs-setup-first',
        reason: 'Requires VAT and dimensions status.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'Master/process work remains locked until W1 Foundation is clearer.'
      }
    ],
    queueChangesMade: [`Select ${nextCase} after ${CASE_ID}.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest:
      resultStatus === 'blocked'
        ? 'It keeps setup writes locked and narrows the remaining blocker to route/source/UI discovery.'
        : 'It separates route discovery from effective setup writes, avoiding a hidden wizard or OK/Finish click.',
    risksBeforeNextCase: [
      'Do not click Next, Finish, Apply, OK or any setup-saving action without a separate Smart Decision Gate.',
      'Do not claim VAT correctness without setup row, preview/posting and ledger evidence.',
      'Abort if runtime shell is not playthru / UNIVERSAARL-DE.'
    ],
    requiredPreparation:
      resultStatus === 'blocked'
        ? ['Use source/UI follow-up to locate the exact VAT Assisted/Manual setup route.']
        : ['Review route screenshots and Microsoft Learn VAT setup sources before any write gate.']
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-assisted-manual-setup-readonly',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    page: 'VAT Assisted/Manual Setup route discovery',
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Validated shell context before route discovery.',
      'Searched VAT Setup and Manual Setup read-only.',
      'Opened only search-result/page contexts and inventoried boundary actions.',
      'Captured screenshot QA and route candidate JSON.'
    ],
    actionsNotTaken: [
      'No Next/Weiter',
      'No Finish/Fertig stellen',
      'No Apply/Anwenden',
      'No OK/Ja confirmation',
      'No VAT setup write',
      'No configuration package import/export/validate',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No company switch'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    sourceRefs: [
      'https://learn.microsoft.com/en-gb/dynamics365/business-central/finance-setup-vat',
      'https://learn.microsoft.com/en-us/training/modules/set-up-vat-dynamics-365-business-central/'
    ],
    proved: [
      `Business Central stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      `${observed.length}/${routeProbes.length} VAT Assisted/Manual Setup route contexts passed read-only screenshot QA.`,
      'No VAT setup, configuration package, master data, document draft, Preview Posting, Posting or API shortcut was executed.',
      ...observed.map((entry) => `${entry.label} observed read-only.`)
    ],
    notProved: [
      'No VAT setup value is ready to write.',
      'No INLAND/VAT19 row is proven complete.',
      'No German VAT final correctness.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No Preview Posting.',
      'No Posting.',
      ...routeResults.filter((entry) => entry.status !== 'observed').map((entry) => `${entry.label}: route context not accepted.`)
    ],
    blockedBy,
    warnings,
    screenshots: ['shell-context.png', ...routeResults.map((entry) => entry.screenshot)],
    evidenceRefs: [
      'TARGET-027D31-result.json',
      'README.md',
      'shell-context.txt',
      'shell-context.png',
      'shell-context.screenshot.json',
      ...routeResults.flatMap((entry) => [entry.textFile, entry.screenshot, entry.screenshotMetadata, entry.candidatesFile])
    ],
    routeResults,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    safeToFinalizeState: false,
    requiresReview: resultStatus === 'blocked',
    statePatch: {},
    nextStepDecision,
    nextCase,
    reason:
      resultStatus === 'blocked'
        ? 'VAT Assisted/Manual Setup route discovery stayed blocked; setup writes remain locked.'
        : 'VAT Assisted/Manual Setup route discovery produced read-only route evidence; setup writes remain locked for a separate gate.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Screenshot-QA',
      '',
      '- Akzeptiert wird nur sichtbarer Business-Central-Kontext, nicht nur eine Tell-Me-Suche.',
      '- Wizard-/Setup-Grenzen werden inventarisiert, aber nicht bestaetigt.',
      '- Next, Finish, Apply, OK, New/Edit und Setup-Werte bleiben gesperrt.',
      '',
      '## Grenzen',
      '',
      '- Keine MwSt.-Einrichtung wurde angelegt oder geaendert.',
      '- Keine Konfigurationspakete wurden importiert, exportiert oder validiert.',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Keine finale deutsche USt-Behauptung.'
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
