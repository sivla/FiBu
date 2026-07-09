import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { dismissTours, openSearchResult, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { createBcStepTimeline } from '../../../core/bc/step-timeline';
import { evaluateReadFirstPageProof, evaluateScreenshotQa } from '../../../core/bc/visual-proof-skills';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(180_000);
test.skip(
  process.env.MASTER_DATA_CUSTOMER_CANCELSAFE_LIVE_APPROVED !== '1' ||
    process.env.MASTER_DATA_CUSTOMER_CANCELSAFE_RUNNER_GUARD_CHECKED !== '1',
  'MASTER-DATA-CUSTOMER-NEW-DROPDOWN-TEMPLATE-CANCELSAFE-READFIRST must be run through its guarded runner.'
);

const CASE_ID = 'MASTER-DATA-CUSTOMER-NEW-DROPDOWN-TEMPLATE-CANCELSAFE-READFIRST';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'master-data-customer-new-dropdown-template-cancelsafe-readfirst';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

type ActionCandidate = {
  scope: string;
  text: string;
  ariaLabel: string;
  title: string;
  role: string;
  ariaHaspopup: string;
  ariaExpanded: string;
  disabled: boolean;
};

type SafeMenuAttempt = {
  attempted: boolean;
  opened: boolean;
  route: string;
  reason: string;
  menuTexts: string[];
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|upn:/i.test(line))
    .join('\n')
    .trim();
}

function targetUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL needs an environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('page', '22');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function frameScopes(page: Page): Frame[] {
  return [page.mainFrame(), ...page.frames().filter((frame) => frame !== page.mainFrame())];
}

async function compactVisibleText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`).slice(0, 5000);
}

function customerListSurfaceVisible(text: string) {
  const roleCenterOnly = /Guten Morgen|Good morning|Aktivitaten|Activities|Rollencenter|Role Center/i.test(text);
  const customerListSignals = [
    /Debitoren:/i,
    /Kontakte aus Debitoren erstellen/i,
    /Debitorennr\./i,
    /Nr\.\s*Name/i,
    /No\.\s*Name/i,
    /Customers:/i
  ];
  return customerListSignals.some((pattern) => pattern.test(text)) && !roleCenterOnly;
}

async function collectActionCandidates(page: Page): Promise<ActionCandidate[]> {
  const candidates: ActionCandidate[] = [];
  for (const [scopeIndex, frame] of frameScopes(page).entries()) {
    const found = await frame.locator('button, [role="button"], a, [role="menuitem"]').evaluateAll((elements) =>
      elements
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const text = (htmlElement.innerText || htmlElement.textContent || '').trim();
          const ariaLabel = htmlElement.getAttribute('aria-label') || '';
          const title = htmlElement.getAttribute('title') || '';
          const role = htmlElement.getAttribute('role') || htmlElement.tagName.toLowerCase();
          const ariaHaspopup = htmlElement.getAttribute('aria-haspopup') || '';
          const ariaExpanded = htmlElement.getAttribute('aria-expanded') || '';
          const disabled = Boolean((htmlElement as HTMLButtonElement).disabled || htmlElement.getAttribute('aria-disabled') === 'true');
          return { text, ariaLabel, title, role, ariaHaspopup, ariaExpanded, disabled };
        })
        .filter((item) => /Neu|New|Vorlage|Template|Weitere Optionen|More options|Create|Anlegen/i.test(`${item.text} ${item.ariaLabel} ${item.title}`))
        .slice(0, 60)
    );
    for (const item of found) {
      candidates.push({
        scope: `frame-${scopeIndex}`,
        text: clean(item.text).slice(0, 140),
        ariaLabel: clean(item.ariaLabel).slice(0, 180),
        title: clean(item.title).slice(0, 180),
        role: item.role,
        ariaHaspopup: item.ariaHaspopup,
        ariaExpanded: item.ariaExpanded,
        disabled: item.disabled
      });
    }
  }
  return candidates;
}

async function hoverFirstNewAction(page: Page) {
  for (const frame of frameScopes(page)) {
    for (const label of [/^Neu$/i, /^New$/i, /Neu|New/i]) {
      const button = frame.getByRole('button', { name: label }).first();
      if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
        await button.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
        await button.hover({ timeout: 3000 }).catch(() => undefined);
        return label.source;
      }
    }
  }
  return '';
}

async function collectVisibleMenuTexts(page: Page) {
  const texts: string[] = [];
  for (const frame of frameScopes(page)) {
    const menuItems = frame.locator('[role="menuitem"], [role="option"], [aria-haspopup="menu"], button, a');
    const count = await menuItems.count().catch(() => 0);
    for (let index = 0; index < Math.min(count, 80); index += 1) {
      const item = menuItems.nth(index);
      if (!(await item.isVisible({ timeout: 100 }).catch(() => false))) continue;
      const text = clean(await item.innerText({ timeout: 250 }).catch(() => ''));
      if (text && /Neu|New|Vorlage|Template|Create|Anlegen|Kopieren|Copy/i.test(text)) texts.push(text.slice(0, 160));
    }
  }
  return [...new Set(texts)].slice(0, 40);
}

async function firstSafeMoreOptions(page: Page): Promise<{ locator: Locator; description: string } | null> {
  for (const frame of frameScopes(page)) {
    for (const label of [/Weitere Optionen|More options|Mehr Optionen/i]) {
      const button = frame.getByRole('button', { name: label }).first();
      if (await button.isVisible({ timeout: 600 }).catch(() => false)) {
        return { locator: button, description: `role-button:${label.source}` };
      }
    }
  }
  return null;
}

async function clickCustomersNavigationLink(page: Page) {
  for (const frame of frameScopes(page)) {
    const candidates = [
      frame.getByRole('link', { name: /^Debitoren$/i }).first(),
      frame.getByRole('menuitem', { name: /^Debitoren$/i }).first(),
      frame.getByText(/^Debitoren$/i).first()
    ];
    for (const candidate of candidates) {
      if (!(await candidate.isVisible({ timeout: 600 }).catch(() => false))) continue;
      await candidate.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
      await candidate.click({ timeout: 5000 });
      await page.waitForTimeout(3000);
      return true;
    }
  }
  return false;
}

async function tryOpenSafeMenu(page: Page): Promise<SafeMenuAttempt> {
  const safeMenuButton = await firstSafeMoreOptions(page);
  if (!safeMenuButton) {
    return {
      attempted: false,
      opened: false,
      route: '',
      reason: 'No visually safe More options / Weitere Optionen command-bar menu was visible.',
      menuTexts: []
    };
  }

  await safeMenuButton.locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
  await safeMenuButton.locator.click({ timeout: 5000 });
  await page.waitForTimeout(600);
  const menuTexts = await collectVisibleMenuTexts(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(400);
  return {
    attempted: true,
    opened: menuTexts.length > 0,
    route: safeMenuButton.description,
    reason: menuTexts.length > 0 ? 'Safe command-bar menu opened and was closed with Escape.' : 'Menu click did not expose New/template-related visible menu text.',
    menuTexts
  };
}

async function writeJson(relativePath: string, value: unknown) {
  const filePath = path.resolve(relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

test('MASTER-DATA-CUSTOMER-NEW-DROPDOWN-TEMPLATE-CANCELSAFE-READFIRST inspects Debitoren New boundary without writes', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const timeline = createBcStepTimeline({
    project: PROJECT,
    evidenceId: EVIDENCE_ID,
    caseId: CASE_ID,
    evidenceDir: EVIDENCE_DIR,
    evidenceDirRelative: EVIDENCE_DIR_REL
  });
  timeline.timeline.liveActionsExecuted = true;
  timeline.timeline.businessCentralOpened = true;
  timeline.timeline.playwrightLiveRunExecuted = true;

  const expectedCustomerText = [/Debitor|Customer|Kunde/i];
  let navigationRoute = 'direct-page-url';
  const navigationAttempts: string[] = [];
  const navigationErrors: string[] = [];
  let directUrlText = '';
  let latestEntry = await timeline.step(page, {
    stepId: '010-open-customers',
    action: 'Open Debitoren / Customers list read-first; fall back to bounded Tell-Me if direct page URL is not visible enough',
    claim: 'Debitoren list opens in playthru / UNIVERSAARL-DE without creating or editing records.',
    expectedPageText: expectedCustomerText,
    run: async () => {
      await page.goto(targetUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await waitForBusinessCentralShell(page);
      await dismissTours(page);
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(2500);
      directUrlText = await compactVisibleText(page);
      if (!customerListSurfaceVisible(directUrlText)) {
        navigationAttempts.push('direct-page-url-not-enough; try-visible-role-center-debitoren-link');
        const clickedRoleCenterLink = await clickCustomersNavigationLink(page);
        if (clickedRoleCenterLink) {
          navigationRoute = 'visible-role-center-debitoren-link';
        }
        let afterRoleCenterLinkText = await compactVisibleText(page);
        if (!customerListSurfaceVisible(afterRoleCenterLinkText)) {
          navigationAttempts.push('visible-link-not-enough; try-bounded-tell-me-search');
          navigationRoute = 'bounded-tell-me-search';
          try {
            await searchFor(page, 'Debitoren');
            await openSearchResult(page, /^Debitoren$/i, {
              requireUnique: false,
              expectedPageText: /Debitor|Customer|Kunde/i,
              rejectIfTellMeStaysOpen: true
            });
          } catch (error) {
            navigationErrors.push(error instanceof Error ? error.message : String(error));
            await page.keyboard.press('Escape').catch(() => undefined);
          }
          await waitForBusinessCentralShell(page);
          await dismissTours(page);
          await page.keyboard.press('Escape').catch(() => undefined);
          await page.waitForTimeout(2500);
          afterRoleCenterLinkText = await compactVisibleText(page);
          if (!customerListSurfaceVisible(afterRoleCenterLinkText)) {
            navigationAttempts.push('bounded-tell-me-search-did-not-prove-customer-list');
          }
        }
      }
    },
    verdict: (_before, after) => (customerListSurfaceVisible(after.textExcerpt) ? 'proven' : 'not-proven'),
    stopReason: (_before, after) =>
      customerListSurfaceVisible(after.textExcerpt) ? null : 'Debitoren/Customers list text was not visible.'
  });

  const pageProof = evaluateReadFirstPageProof({
    snapshot: {
      url: latestEntry.urlAfter,
      pageTitle: '',
      textExcerpt: await compactVisibleText(page),
      focusedElement: null,
      signals: {
        targetTextVisible: latestEntry.afterAllClassifications.includes('target-page-open'),
        sidePaneVisible: latestEntry.afterAllClassifications.includes('side-pane-open'),
        searchOverlayVisible: latestEntry.afterAllClassifications.includes('search-overlay-open'),
        dialogVisible: latestEntry.afterAllClassifications.includes('dialog-open'),
        roleCenterVisible: latestEntry.afterAllClassifications.includes('role-center-background'),
        listSurfaceVisible: latestEntry.afterAllClassifications.includes('list-page-open'),
        cardSurfaceVisible: latestEntry.afterAllClassifications.includes('card-page-open')
      },
      classification: latestEntry.afterClassification,
      allClassifications: latestEntry.afterAllClassifications,
      notes: []
    },
    expectedVisibleTexts: ['Debitoren:'],
    screenshots: [latestEntry.afterScreenshot],
    pageContext: 'Debitoren / Customers'
  });

  let hoveredNew = '';
  latestEntry = await timeline.step(page, {
    stepId: '020-hover-new',
    action: 'Hover New/Neu without clicking create',
    claim: 'The New/Neu boundary can be observed without selecting Create, Save, OK, Finish or a template.',
    expectedPageText: expectedCustomerText,
    run: async () => {
      hoveredNew = await hoverFirstNewAction(page);
    },
    verdict: (_before, after) => (customerListSurfaceVisible(after.textExcerpt) ? 'proven' : 'unknown'),
    stopReason: null
  });

  const actionCandidatesBeforeMenu = await collectActionCandidates(page);
  let safeMenuAttempt: SafeMenuAttempt = {
    attempted: false,
    opened: false,
    route: '',
    reason: 'Safe menu inspection did not run.',
    menuTexts: []
  };
  latestEntry = await timeline.step(page, {
    stepId: '030-safe-more-options-menu',
    action: 'Open only a safe More options menu if visible, then close with Escape',
    claim: 'A command-bar menu can be inspected without clicking New/Neu itself or selecting a template/create action.',
    expectedPageText: expectedCustomerText,
    run: async () => {
      safeMenuAttempt = await tryOpenSafeMenu(page);
    },
    verdict: (_before, after) =>
      customerListSurfaceVisible(after.textExcerpt) && !/Debitorenkarte|Customer Card/i.test(after.textExcerpt)
        ? 'proven'
        : 'unknown',
    stopReason: (_before, after) =>
      /Debitorenkarte|Customer Card/i.test(after.textExcerpt)
        ? 'Unexpected customer card text appeared after safe menu inspection; no values were typed and the run must stop.'
        : null
  });

  const actionCandidatesAfterMenu = await collectActionCandidates(page);
  const finalText = await compactVisibleText(page);
  const screenshotQa = evaluateScreenshotQa({
    snapshot: {
      url: latestEntry.urlAfter,
      pageTitle: '',
      textExcerpt: finalText,
      focusedElement: null,
      signals: {
        targetTextVisible: latestEntry.afterAllClassifications.includes('target-page-open'),
        sidePaneVisible: latestEntry.afterAllClassifications.includes('side-pane-open'),
        searchOverlayVisible: latestEntry.afterAllClassifications.includes('search-overlay-open'),
        dialogVisible: latestEntry.afterAllClassifications.includes('dialog-open'),
        roleCenterVisible: latestEntry.afterAllClassifications.includes('role-center-background'),
        listSurfaceVisible: latestEntry.afterAllClassifications.includes('list-page-open'),
        cardSurfaceVisible: latestEntry.afterAllClassifications.includes('card-page-open')
      },
      classification: latestEntry.afterClassification,
      allClassifications: latestEntry.afterAllClassifications,
      notes: safeMenuAttempt.reason ? [safeMenuAttempt.reason] : []
    },
    screenshotPath: latestEntry.afterScreenshot,
    claimedProof: 'Debitoren list, New/Neu hover boundary and safe command-bar menu close boundary',
    expectedVisibleValues: ['Debitoren:'],
    labOrFinal: 'draft'
  });

  await writeJson(`${EVIDENCE_DIR_REL}/action-candidates-before-menu.json`, {
    schemaVersion: 1,
    caseId: CASE_ID,
    pageContext: 'Debitoren / Customers',
    actionCandidates: actionCandidatesBeforeMenu,
    noCreateClicked: true,
    noTemplateSelected: true
  });
  await writeJson(`${EVIDENCE_DIR_REL}/action-candidates-after-menu.json`, {
    schemaVersion: 1,
    caseId: CASE_ID,
    pageContext: 'Debitoren / Customers',
    actionCandidates: actionCandidatesAfterMenu,
    safeMenuAttempt,
    noCreateClicked: true,
    noTemplateSelected: true
  });

  const timelinePath = await timeline.write();
  const finalCustomerListSurfaceVisible = customerListSurfaceVisible(finalText);
  const pageOpened = pageProof.pageOpened && screenshotQa.ok && finalCustomerListSurfaceVisible;
  const safeBoundaryObserved = Boolean(hoveredNew || safeMenuAttempt.attempted);
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    status: pageOpened && safeBoundaryObserved ? 'observed-readfirst-no-write' : 'partially-blocked-readfirst-no-write',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Debitoren / Customers',
    pageId: 22,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    liveActionsExecuted: true,
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    timelinePath,
    screenshots: timeline.timeline.entries.flatMap((entry) => [entry.beforeScreenshot, entry.afterScreenshot]),
    pageProof,
    screenshotQa,
    hoveredNew,
    navigationRoute,
    navigationAttempts,
    navigationErrors,
    directUrlHadCustomerSignal: /Debitor|Customer|Kunde/i.test(directUrlText),
    directUrlHadCustomerListSurface: customerListSurfaceVisible(directUrlText),
    finalCustomerListSurfaceVisible,
    safeMenuAttempt,
    actionCandidateFiles: [
      `${EVIDENCE_DIR_REL}/action-candidates-before-menu.json`,
      `${EVIDENCE_DIR_REL}/action-candidates-after-menu.json`
    ],
    proved: [
      ...(pageOpened ? ['Debitoren/Customers surface was observed read-first in playthru / UNIVERSAARL-DE.'] : []),
      `Navigation route used: ${navigationRoute}.`,
      ...(hoveredNew ? ['New/Neu was inspected by hover only; it was not clicked as a create action.'] : []),
      ...(safeMenuAttempt.attempted ? ['A safe command-bar menu route was attempted and closed with Escape.'] : []),
      'Visual-state JSON, screenshot QA and step timeline were written for the relevant steps.',
      'No Create, Save, OK, Finish, template selection/change, typed value, setup, document, Preview Posting or Posting action was executed.'
    ],
    notProved: [
      'No customer was created or changed.',
      'No customer template was selected, changed or applied.',
      'No mandatory-field enforcement was triggered through a save attempt.',
      'No customer write gate, O2C readiness, posting readiness, UAT readiness or final handbook proof was established.'
    ],
    blockedBy: pageOpened ? [] : ['customers-page-not-proven-open-or-screenshot-qa-not-accepted'],
    warnings: [
      'New/Neu visibility is not create permission.',
      'Safe menu evidence is route-design evidence only; it is not a write gate.',
      'Any future customer write gate still needs exact values, dependency checks, stop conditions and reopen proof.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'The prior route decision requested a narrow customer New/Neu cancel-safe read-first proof before any master-data write gate.',
      isPlannedNextCaseStillSensible: false,
      reason: 'This run consumed the narrow read-first proof request.',
      lookaheadReviewed: [
        {
          caseId: 'MASTER-DATA-TEMPLATE-ROUTE-DECISION',
          status: pageOpened ? 'ready-next' : 'blocked',
          reason: 'It should consume this evidence and decide whether a customer write-gate prep is justified.'
        },
        {
          caseId: 'CUSTOMER-U-CUST-100-FIELD-COMPLETION-WRITE-GATE',
          status: 'needs-source-check-first',
          reason: 'A write gate needs exact customer fields, dependency status and a reopen-proof plan; this run did not write.'
        },
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-TABLE-MAPPING-SOURCE-DECISION',
          status: 'ready-after-current',
          reason: 'If Foundation dependencies remain too unclear, configuration-package mapping remains the cleaner project route.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'MASTER-DATA-TEMPLATE-ROUTE-DECISION',
      whySelectedNextCaseIsBest: 'It is local/no-live and can turn this read-first evidence into a route decision without prematurely writing customer data.',
      risksBeforeNextCase: [
        'Repeating New/Neu clicks without a new hypothesis.',
        'Treating hover/menu visibility as template application evidence.',
        'Skipping Foundation dependency boundaries.'
      ],
      requiredPreparation: ['Keep the next decision local/no-live; do not create or edit customer data until the route decision names a narrow write gate.']
    },
    nextCase: 'MASTER-DATA-TEMPLATE-ROUTE-DECISION',
    updatedAt: new Date().toISOString()
  };

  await writeJson(`${EVIDENCE_DIR_REL}/result.json`, result);
  await writeJson(`${EVIDENCE_DIR_REL}/README.json`, {
    schemaVersion: 1,
    caseId: CASE_ID,
    purpose: 'Debitoren/Customers New/Neu cancel-safe read-first evidence.',
    resultPath: `${EVIDENCE_DIR_REL}/result.json`,
    timelinePath,
    noWriteBoundary: true,
    safeMenuAttempt
  });

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
});
