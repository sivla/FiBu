import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  openSearchResult,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { createBcStepTimeline } from '../../../core/bc/step-timeline';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});
test.setTimeout(180_000);
test.skip(
  process.env.FOUNDATION_PACKAGE_EXISTING_METADATA_LIVE_APPROVED !== '1' ||
    process.env.FOUNDATION_PACKAGE_EXISTING_METADATA_RUNNER_GUARD_CHECKED !== '1',
  'FOUNDATION-SETUP-PACKAGE-EXISTING-METADATA-READFIRST must run through the guarded runner with --live-approved.'
);

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-EXISTING-METADATA-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'foundation-setup-package-existing-metadata-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const PACKAGE_CODE = 'U-VAT325-DISC';

function buildPlaythruPageUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  const parts = url.pathname.split('/').filter(Boolean);
  if (!parts.length) throw new Error('Business Central URL must include a tenant/environment path.');
  parts[parts.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${parts.join('/')}`;
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i,
    '/{tenant}'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const CONFIG_PACKAGE_PAGE_RE = /Konfigurationspakete|Configurationspakete|Configuration Packages/i;
const CONFIG_PACKAGE_PAGE_OR_LIST_RE =
  /Konfigurationspakete|Configurationspakete|Configuration Packages|Paketcode|Paketname|Package Code|Package Name/i;
const CONFIG_PACKAGE_ACTION_RE =
  /Neu|Tabellen abrufen|Get Tables|Import|Export|Validate|Validieren|Apply|Anwenden|Excel|Delete|Loschen|Loeschen|Paket|Package/i;

function isTargetContext(rawUrl: string) {
  const url = new URL(rawUrl);
  return (
    url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE) &&
    (url.searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY
  );
}

async function compactPackageText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        CONFIG_PACKAGE_PAGE_OR_LIST_RE,
        /U-VAT325-DISC|VAT 325 Discovery|Anzahl Tabellen|Anzahl Datensatze|Anzahl der Fehler|Fehler/i,
        CONFIG_PACKAGE_ACTION_RE
      ],
      maxLines: 180,
      maxLineLength: 240
    }).catch(() => '')
  );
}

async function fullText(page: Page) {
  const texts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(texts.join('\n'));
}

async function capture(page: Page, fileName: string, metadata: Record<string, unknown>) {
  const imagePath = evidencePath(PROJECT, EVIDENCE_ID, fileName);
  const metadataPath = evidencePath(PROJECT, EVIDENCE_ID, fileName.replace(/\.png$/i, '.screenshot.json'));
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJsonEvidence(metadataPath, {
    fileName,
    imagePath: `${EVIDENCE_DIR_REL}/${fileName}`,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
  return `${EVIDENCE_DIR_REL}/${fileName}`;
}

async function openConfigurationPackages(page: Page) {
  await page.goto(buildPlaythruPageUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  let text = await compactPackageText(page);

  if (!CONFIG_PACKAGE_PAGE_RE.test(text)) {
    await searchFor(page, 'Konfigurationspakete');
    await openSearchResult(page, /Konfigurationspakete|Configuration Packages|Config\. Packages/i, {
      expectedPageText: CONFIG_PACKAGE_PAGE_OR_LIST_RE,
      rejectIfTellMeStaysOpen: true,
      timeout: 45_000
    });
    await dismissTours(page);
    // Do not press Escape here: BC opens several list pages as a right-side page pane over the Role Center.
    // Escape would close the pane and make a valid page proof look like a failed route.
    text = await compactPackageText(page);
  }

  expect(isTargetContext(page.url()), `Wrong target context: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(text).toMatch(CONFIG_PACKAGE_PAGE_RE);
  return text;
}

async function collectVisiblePackageActions(page: Page) {
  const actions = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const interesting = /Neu|Tabellen abrufen|Get Tables|Import|Export|Validate|Validieren|Apply|Anwenden|Excel|Delete|Loschen|Loeschen|Paket|Package/i;
        return [...document.querySelectorAll<HTMLElement>('[role="button"],[role="menuitem"],button,a,span,div')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const topElement = document.elementFromPoint(centerX, centerY);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const isForeground =
              !!topElement && (element === topElement || element.contains(topElement) || !!topElement.closest('[role="dialog"], [aria-modal="true"]'));
            if (!isForeground || !interesting.test(text) || text.length > 180 || rect.width <= 1 || rect.height <= 1) return null;
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .slice(0, 200);
      })
      .catch(() => []);
    actions.push(...(entries as Array<Record<string, unknown>>));
  }
  return actions;
}

test(`${CASE_ID} inspects existing configuration-package metadata read-first`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const screenshots: string[] = [];
  const stepTimeline = createBcStepTimeline({
    project: PROJECT,
    evidenceId: EVIDENCE_ID,
    caseId: CASE_ID,
    evidenceDir: EVIDENCE_DIR,
    evidenceDirRelative: EVIDENCE_DIR_REL
  });

  let initialText = '';
  await stepTimeline.step(page, {
    stepId: '010-open-configuration-packages',
    action: 'Open Configuration Packages read-first',
    claim: 'Business Central shows Configuration Packages in the foreground, including side-pane-over-Role-Center cases.',
    expectedPageText: [CONFIG_PACKAGE_PAGE_OR_LIST_RE],
    run: async () => {
      initialText = await openConfigurationPackages(page);
    },
    verdict: (_before, after) =>
      ['side-pane-open', 'list-page-open', 'target-page-open'].includes(after.classification) ? 'proven' : 'not-proven',
    stopReason: (_before, after) =>
      after.classification === 'search-overlay-open'
        ? 'Search/Tell-Me overlay remained open after navigation.'
        : after.classification === 'role-center-background'
          ? 'Only Role Center background was visible after navigation.'
          : null
  });
  screenshots.push(
    await capture(page, 'foundation-package-existing-metadata-010-list-context.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'List context before row inspection',
      sanitizedUrl: sanitizeUrl(page.url()),
      visibleSignals: initialText.split('\n').slice(0, 80),
      noWrite: true
    })
  );

  const row = page.getByRole('row', { name: /U-VAT325|VAT 325 Discovery/i }).first();
  const rowByText = page.getByText(/U-VAT325|VAT 325 Discovery/i).first();
  const rowRoleVisible = await row.isVisible({ timeout: 3000 }).catch(() => false);
  const rowTextVisible = await rowByText.isVisible({ timeout: 3000 }).catch(() => false);
  const textSignalVisible = /U-VAT325(?:-DISC)?|VAT 325 Discovery/i.test(initialText);
  const packageVisible = rowRoleVisible || rowTextVisible || textSignalVisible;
  await stepTimeline.step(page, {
    stepId: '020-focus-existing-package-row',
    action: `Focus existing package row ${PACKAGE_CODE} if visible`,
    claim: `${PACKAGE_CODE} row focus is attempted only when the row or text signal is visible.`,
    expectedPageText: [CONFIG_PACKAGE_PAGE_OR_LIST_RE, /U-VAT325|VAT 325 Discovery/i],
    run: async () => {
      if (rowRoleVisible) {
        await row.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
        await row.click({ timeout: 2000 }).catch(() => undefined);
      } else if (rowTextVisible) {
        await rowByText.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
        await rowByText.click({ timeout: 2000 }).catch(() => undefined);
      }
    },
    verdict: packageVisible ? 'proven' : 'not-proven',
    stopReason: packageVisible ? null : `${PACKAGE_CODE} was not visible enough for row focus proof.`
  });

  const afterRowText = await compactPackageText(page);
  screenshots.push(
    await capture(page, 'foundation-package-existing-metadata-020-row-focus.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Existing package row focus if visible',
      packageCode: PACKAGE_CODE,
      packageVisible,
      rowRoleVisible,
      rowTextVisible,
      textSignalVisible,
      visibleSignals: afterRowText.split('\n').slice(0, 80),
      noWrite: true
    })
  );

  const actions = await collectVisiblePackageActions(page);
  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'visible-package-actions.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    packageCode: PACKAGE_CODE,
    actions
  });
  screenshots.push(
    await capture(page, 'foundation-package-existing-metadata-030-action-inventory.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Visible package action inventory without execution',
      actionCount: actions.length,
      writeCapableActions: actions
        .filter((action) => /Neu|Tabellen abrufen|Get Tables|Import|Export|Validate|Validieren|Apply|Anwenden|Excel|Delete|Loschen|Loeschen/i.test(`${action.text} ${action.title}`))
        .slice(0, 30),
      noWrite: true
    })
  );

  await page.keyboard.press('Escape').catch(() => undefined);
  const endText = await compactPackageText(page);
  screenshots.push(
    await capture(page, 'foundation-package-existing-metadata-040-no-write-end.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'No-write end context',
      visibleSignals: endText.split('\n').slice(0, 80),
      noWrite: true
    })
  );

  const full = await fullText(page);
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'page-text.txt'), endText || full);
  stepTimeline.timeline.businessCentralOpened = true;
  stepTimeline.timeline.playwrightLiveRunExecuted = true;
  stepTimeline.timeline.liveActionsExecuted = false;
  const stepTimelinePath = await stepTimeline.write();

  const tableCountZero = /U-VAT325-DISC[\s\S]*VAT 325 Discovery[\s\S]*(^|\D)0(\D|$)/i.test(endText || full);
  const resultStatus = packageVisible ? 'observed-existing-metadata-readfirst' : 'blocked-existing-metadata-not-visible';
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readonly-existing-configuration-package-metadata',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Konfigurationspakete / Configuration Packages',
    sanitizedUrl: sanitizeUrl(page.url()),
    packageCode: PACKAGE_CODE,
    packageVisible,
    tableCountZero,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    confidentialRealCustomerDataUsed: false,
    uiMockupUsed: false,
    actionsTaken: [
      'Opened Konfigurationspakete read-only in playthru / UNIVERSAARL-DE.',
      'Inspected existing U-VAT325-DISC row if visible.',
      'Captured list context, row focus, action inventory and no-write end screenshots.'
    ],
    actionsNotTaken: [
      'No package creation',
      'No package card open/edit',
      'No Get Tables/Tabellen abrufen click',
      'No package import',
      'No package export',
      'No package validation',
      'No package apply',
      'No package delete',
      'No Edit in Excel',
      'No setup value typing',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No company switch'
    ],
    screenshots,
    stepTimeline: stepTimelinePath,
    actionInventoryPath: `${EVIDENCE_DIR_REL}/visible-package-actions.json`,
    screenshotQaReferences: [
      'Step timeline before/after screenshots and visual-state JSON classify page, pane, dialog, overlay and Role Center background.',
      stepTimelinePath
    ],
    proved: packageVisible
      ? [
          'Business Central opened in playthru / UNIVERSAARL-DE.',
          'Existing configuration-package metadata U-VAT325-DISC is visible read-first.',
          'Package actions were inventoried without execution.',
          'No package/setup/master-data/posting action occurred.'
        ]
      : [
          'Business Central opened in playthru / UNIVERSAARL-DE.',
          'Konfigurationspakete page/list surface was visible read-first.',
          'No package/setup/master-data/posting action occurred.'
        ],
    notProved: [
      'No package card content.',
      'No package table line for Table 252, Table 325 or Page/Table 470.',
      'No package import/export/validate/apply route.',
      'No setup value.',
      'No posting/VAT/master-data readiness.',
      'No UAT acceptance.'
    ],
    warnings: packageVisible ? ['U-VAT325-DISC exists as metadata and needs keep/cleanup/reuse classification.'] : [],
    blockedBy: packageVisible ? [] : [`${PACKAGE_CODE} was not visible on the Configuration Packages list.`],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'Metadata write gate selected read-first inspection of existing package metadata.',
      isPlannedNextCaseStillSensible: packageVisible,
      reason: packageVisible
        ? 'Existing metadata is now visible and can be classified locally.'
        : 'Existing metadata visibility is blocked and must be reviewed before cleanup or reuse.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-KEEP-CLEANUP-DECISION',
          status: packageVisible ? 'ready-next' : 'blocked',
          reason: packageVisible ? 'Existing metadata can now be classified.' : 'No row visibility proof exists.'
        },
        {
          caseId: 'Foundation setup package-table route',
          status: 'needs-source-check-first',
          reason: 'Requires exact setup table purpose and field mapping.'
        },
        {
          caseId: 'Foundation Readiness decision',
          status: 'ready-after-current',
          reason: 'Should consume the package metadata classification.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: 'FOUNDATION-SETUP-PACKAGE-KEEP-CLEANUP-DECISION',
      whySelectedNextCaseIsBest: 'It decides whether existing metadata should be kept as route candidate, cleaned up, or parked.',
      risksBeforeNextCase: ['Cleanup/delete needs a separate effective-action gate and reopen proof.'],
      requiredPreparation: ['Use this read-first evidence; do not create duplicate package metadata.']
    },
    safeToFinalizeState: false,
    requiresReview: false,
    nextCase: 'FOUNDATION-SETUP-PACKAGE-KEEP-CLEANUP-DECISION'
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      `# ${CASE_ID}`,
      '',
      `Result: ${resultStatus}`,
      '',
      `Package code: ${PACKAGE_CODE}`,
      `Visible: ${packageVisible}`,
      '',
      'No package was created, opened for edit, imported, exported, validated, applied, deleted or edited in Excel.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].join('\n')
  );
});
