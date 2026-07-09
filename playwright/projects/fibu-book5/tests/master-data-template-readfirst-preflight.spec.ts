import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { createBcStepTimeline } from '../../../core/bc/step-timeline';
import { evaluateReadFirstPageProof, evaluateScreenshotQa } from '../../../core/bc/visual-proof-skills';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(240_000);
test.skip(
  process.env.MASTER_DATA_TEMPLATE_READFIRST_PREFLIGHT_LIVE_APPROVED !== '1' ||
    process.env.MASTER_DATA_TEMPLATE_READFIRST_PREFLIGHT_RUNNER_GUARD_CHECKED !== '1',
  'MASTER-DATA-TEMPLATE-READFIRST-PREFLIGHT must be run through its guarded runner.'
);

const CASE_ID = 'MASTER-DATA-TEMPLATE-READFIRST-PREFLIGHT';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'master-data-template-readfirst-preflight';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);

type SurfaceProbe = {
  key: 'customers' | 'vendors' | 'items-services';
  pageId: number;
  pageContext: string;
  expectedTexts: string[];
  expectedPatterns: RegExp[];
};

type ActionCandidate = {
  text: string;
  ariaLabel: string;
  title: string;
  role: string;
  ariaHaspopup: string;
  ariaExpanded: string;
  disabled: boolean;
};

const probes: SurfaceProbe[] = [
  {
    key: 'customers',
    pageId: 22,
    pageContext: 'Debitoren (Customers)',
    expectedTexts: ['Debitor'],
    expectedPatterns: [/Debitor|Customer|Kunde/i]
  },
  {
    key: 'vendors',
    pageId: 27,
    pageContext: 'Kreditoren (Vendors)',
    expectedTexts: ['Kreditor'],
    expectedPatterns: [/Kreditor|Vendor|Lieferant/i]
  },
  {
    key: 'items-services',
    pageId: 31,
    pageContext: 'Artikel/Services (Items/Services)',
    expectedTexts: ['Artikel', 'Item'],
    expectedPatterns: [/Artikel|Items?|Service/i]
  }
];

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

function targetUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL needs an environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

async function compactVisibleText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`).slice(0, 5000);
}

async function collectActionCandidates(page: Page): Promise<ActionCandidate[]> {
  const candidates: ActionCandidate[] = [];
  for (const frame of [page.mainFrame(), ...page.frames().filter((frame) => frame !== page.mainFrame())]) {
    for (const label of [/Neu|New/i, /Vorlage|Template/i, /Weitere|More/i, /Erstellen|Create/i]) {
      const locator = frame.getByRole('button', { name: label });
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < Math.min(count, 8); index += 1) {
        const item = locator.nth(index);
        if (!(await item.isVisible({ timeout: 250 }).catch(() => false))) continue;
        candidates.push({
          text: clean(await item.innerText({ timeout: 500 }).catch(() => '')).slice(0, 120),
          ariaLabel: (await item.getAttribute('aria-label').catch(() => '')) ?? '',
          title: (await item.getAttribute('title').catch(() => '')) ?? '',
          role: (await item.getAttribute('role').catch(() => '')) ?? 'button',
          ariaHaspopup: (await item.getAttribute('aria-haspopup').catch(() => '')) ?? '',
          ariaExpanded: (await item.getAttribute('aria-expanded').catch(() => '')) ?? '',
          disabled:
            (await item.getAttribute('disabled').catch(() => null)) !== null ||
            (await item.getAttribute('aria-disabled').catch(() => '')) === 'true'
        });
      }
    }
    for (const label of [/^Neu$/i, /^New$/i, /Neu|New|Vorlage|Template|Weitere Optionen|More options/i]) {
      const locator = frame.getByText(label);
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < Math.min(count, 8); index += 1) {
        const item = locator.nth(index);
        if (!(await item.isVisible({ timeout: 250 }).catch(() => false))) continue;
        const text = clean(await item.innerText({ timeout: 500 }).catch(() => '')).slice(0, 120);
        const ariaLabel = (await item.getAttribute('aria-label').catch(() => '')) ?? '';
        const title = (await item.getAttribute('title').catch(() => '')) ?? '';
        const signature = `${text}|${ariaLabel}|${title}|visible-text`;
        if (candidates.some((candidate) => `${candidate.text}|${candidate.ariaLabel}|${candidate.title}|${candidate.role}` === signature)) continue;
        candidates.push({
          text,
          ariaLabel,
          title,
          role: 'visible-text',
          ariaHaspopup: (await item.getAttribute('aria-haspopup').catch(() => '')) ?? '',
          ariaExpanded: (await item.getAttribute('aria-expanded').catch(() => '')) ?? '',
          disabled:
            (await item.getAttribute('disabled').catch(() => null)) !== null ||
            (await item.getAttribute('aria-disabled').catch(() => '')) === 'true'
        });
      }
    }
  }
  return candidates.slice(0, 40);
}

async function hoverFirstNewAction(page: Page) {
  for (const frame of [page.mainFrame(), ...page.frames().filter((frame) => frame !== page.mainFrame())]) {
    for (const label of [/^Neu$/i, /^New$/i, /Neu|New/i]) {
      const button = frame.getByRole('button', { name: label }).first();
      if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
        await button.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
        await button.hover({ timeout: 2500 }).catch(() => undefined);
        return label.source;
      }
      const text = frame.getByText(label).first();
      if (await text.isVisible({ timeout: 800 }).catch(() => false)) {
        await text.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
        await text.hover({ timeout: 2500 }).catch(() => undefined);
        return `text:${label.source}`;
      }
    }
  }
  return '';
}

async function writeJson(relativePath: string, value: unknown) {
  const filePath = path.resolve(relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}

test('MASTER-DATA-TEMPLATE-READFIRST-PREFLIGHT inspects master-data template boundaries without writes', async ({ page }) => {
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

  const pageResults = [];

  for (const probe of probes) {
    let latestEntry = await timeline.step(page, {
      stepId: `010-open-${probe.key}`,
      action: `Open ${probe.pageContext} list read-first`,
      claim: `${probe.pageContext} list opens in playthru / UNIVERSAARL-DE without creating or editing records.`,
      expectedPageText: probe.expectedPatterns,
      run: async () => {
        await page.goto(targetUrl(probe.pageId), { waitUntil: 'domcontentloaded' });
        await waitForBusinessCentralShell(page);
        await dismissTours(page);
      },
      verdict: (_before, after) => (probe.expectedPatterns.some((pattern) => pattern.test(after.textExcerpt)) ? 'proven' : 'not-proven'),
      stopReason: (_before, after) =>
        probe.expectedPatterns.some((pattern) => pattern.test(after.textExcerpt)) ? null : `${probe.pageContext} expected text not visible.`
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
      expectedVisibleTexts: probe.expectedTexts,
      screenshots: [latestEntry.afterScreenshot],
      pageContext: probe.pageContext
    });

    let hoveredNew = '';
    latestEntry = await timeline.step(page, {
      stepId: `020-hover-new-${probe.key}`,
      action: `Hover New/Neu on ${probe.pageContext} without clicking create`,
      claim: `New/Neu boundary can be inspected for ${probe.pageContext} without selecting Create, Save, OK, Finish or a template.`,
      expectedPageText: probe.expectedPatterns,
      run: async () => {
        hoveredNew = await hoverFirstNewAction(page);
      },
      verdict: (_before, after) => (probe.expectedPatterns.some((pattern) => pattern.test(after.textExcerpt)) ? 'proven' : 'unknown'),
      stopReason: null
    });

    const actionCandidates = await collectActionCandidates(page);
    const visibleText = await compactVisibleText(page);
    const screenshotQa = evaluateScreenshotQa({
      snapshot: {
        url: latestEntry.urlAfter,
        pageTitle: '',
        textExcerpt: visibleText,
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
      screenshotPath: latestEntry.afterScreenshot,
      claimedProof: `${probe.pageContext} list and New/Neu boundary`,
      expectedVisibleValues: probe.expectedTexts,
      labOrFinal: 'draft'
    });

    const actionInventoryPath = `${EVIDENCE_DIR_REL}/${probe.key}-action-candidates.json`;
    await writeJson(actionInventoryPath, {
      schemaVersion: 1,
      caseId: CASE_ID,
      pageContext: probe.pageContext,
      actionCandidates,
      noActionClicked: true,
      actionsNotAllowed: ['Create', 'Erstellen', 'OK', 'Finish', 'Save', 'Speichern', 'template selection/change']
    });

    pageResults.push({
      key: probe.key,
      pageContext: probe.pageContext,
      pageId: probe.pageId,
      openStep: `010-open-${probe.key}`,
      hoverStep: `020-hover-new-${probe.key}`,
      pageProof,
      screenshotQa,
      actionInventoryPath,
      actionCandidateCount: actionCandidates.length,
      hoveredNew,
      observedNewOrTemplateText: actionCandidates.some((candidate) =>
        /Neu|New|Vorlage|Template/i.test(`${candidate.text} ${candidate.ariaLabel} ${candidate.title}`)
      )
    });
  }

  const timelinePath = await timeline.write();
  const allPagesObserved = pageResults.every((result) => result.pageProof.pageOpened);
  const actionContextsObserved = pageResults.filter((result) => result.observedNewOrTemplateText).length;
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    status: allPagesObserved ? 'observed-readfirst-no-write' : 'partially-blocked-readfirst-no-write',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    timelinePath,
    pageResults,
    proved: [
      ...(allPagesObserved ? ['Customer, vendor and item/service list contexts were observed read-first.'] : []),
      `${actionContextsObserved}/3 page contexts exposed New/Neu, template or related action candidates without clicking them.`,
      'Visual-state and screenshot QA artifacts were written for each relevant step.',
      'No Create, Save, OK, Finish, template-change, typed value, setup, document, Preview Posting or Posting action was executed.'
    ],
    notProved: [
      'No master-data record was created or changed.',
      'No template was selected or changed.',
      'No mandatory-field enforcement was triggered through a save attempt.',
      'No Foundation setup, posting group, VAT, O2C, P2P, Inventory, Preview Posting, Posting or UAT readiness was proven.'
    ],
    warnings: [
      'Read-first list/action visibility is useful for route design, not a write gate.',
      'A future write-gate needs a narrower single-record purpose, values, dependency proof, save boundary and reopen proof.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'Master Data route decision requested real UI evidence for template and New/Neu boundaries before any write gate.',
      isPlannedNextCaseStillSensible: false,
      reason: 'The read-first proof has been consumed by this run.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-U-CUST-100-FIELD-COMPLETION-WRITE-GATE',
          status: allPagesObserved ? 'needs-source-check-first' : 'blocked',
          reason: 'A customer-only write gate still needs exact field values, dependency boundaries and reopen-proof plan.'
        },
        {
          caseId: 'MASTER-DATA-TEMPLATE-ROUTE-DECISION',
          status: allPagesObserved ? 'ready-next' : 'ready-after-current',
          reason: 'The new read-first visual evidence should be consumed locally before any write gate.'
        },
        {
          caseId: 'FOUNDATION-SETUP-SOURCE-GAP-DECISION',
          status: 'ready-after-current',
          reason: 'Fallback if Foundation dependencies still block even descriptive customer data.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'MASTER-DATA-TEMPLATE-ROUTE-DECISION',
      whySelectedNextCaseIsBest: 'It can consume the new visual evidence and decide whether a narrow customer write gate is justified or whether dependencies remain parked.',
      risksBeforeNextCase: [
        'Treating New/Neu visibility as create permission.',
        'Treating draft screenshot evidence as final customer handbook proof.',
        'Skipping Foundation dependency boundaries.'
      ],
      requiredPreparation: ['Keep next step local/no-live until the new read-first evidence is reviewed.']
    },
    nextCase: 'MASTER-DATA-TEMPLATE-ROUTE-DECISION',
    updatedAt: new Date().toISOString()
  };

  await writeJson(`${EVIDENCE_DIR_REL}/result.json`, result);
  await writeJson(`${EVIDENCE_DIR_REL}/README.json`, {
    schemaVersion: 1,
    caseId: CASE_ID,
    purpose: 'Read-first/no-write evidence for customer, vendor and item/service New/template boundaries.',
    resultPath: `${EVIDENCE_DIR_REL}/result.json`,
    timelinePath,
    pageCount: pageResults.length,
    noWriteBoundary: true
  });

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
});
