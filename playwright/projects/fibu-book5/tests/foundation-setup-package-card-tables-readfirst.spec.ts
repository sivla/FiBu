import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  requireBcUrl,
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
  process.env.FOUNDATION_PACKAGE_CARD_TABLES_LIVE_APPROVED !== '1' ||
    process.env.FOUNDATION_PACKAGE_CARD_TABLES_RUNNER_GUARD_CHECKED !== '1',
  'FOUNDATION-SETUP-PACKAGE-CARD-TABLES-READFIRST must run through the guarded runner with --live-approved.'
);

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-CARD-TABLES-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'foundation-setup-package-card-tables-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const PACKAGE_CODE = 'U-VAT325-DISC';

const CONFIG_PACKAGES_RE = /Konfigurationspakete|Configurationspakete|Configuration Packages|Config\. Packages/i;
const PACKAGE_SURFACE_RE =
  /Konfigurationspakete|Configuration Packages|Paketcode|Paketname|Package Code|Package Name|U-VAT325-DISC|VAT 325 Discovery|Tabellen|Tables|Felder|Fields/i;
const WRITE_ACTION_RE =
  /Neu|New|Bearbeiten|Edit|Loeschen|Loschen|Delete|Tabellen abrufen|Get Tables|Import|Export|Validieren|Validate|Anwenden|Apply|Excel/i;

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
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i,
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
        PACKAGE_SURFACE_RE,
        /252|325|470|Buchungsmatrix|MwSt|USt|VAT|General Posting Setup|VAT Posting Setup/i,
        WRITE_ACTION_RE
      ],
      maxLines: 220,
      maxLineLength: 240
    }).catch(() => '')
  );
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

async function collectVisiblePackageActions(page: Page) {
  const actions = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const interesting =
          /Neu|New|Bearbeiten|Edit|Loeschen|Loschen|Delete|Tabellen abrufen|Get Tables|Import|Export|Validieren|Validate|Anwenden|Apply|Excel|Paket|Package|Tabelle|Table|Felder|Fields/i;
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
              !!topElement &&
              (element === topElement ||
                element.contains(topElement) ||
                !!topElement.closest('[role="dialog"], [aria-modal="true"], [role="main"]'));
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
          .slice(0, 220);
      })
      .catch(() => []);
    actions.push(...(entries as Array<Record<string, unknown>>));
  }
  return actions;
}

async function openConfigurationPackages(page: Page) {
  await page.goto(buildPlaythruPageUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  const text = await compactPackageText(page);
  expect(isTargetContext(page.url()), `Wrong target context: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(text).toMatch(CONFIG_PACKAGES_RE);
  return text;
}

test(`${CASE_ID} proves package card/table route read-first`, async ({ page }) => {
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

  let packageText = '';
  await stepTimeline.step(page, {
    stepId: '010-open-configuration-packages',
    action: 'Open Configuration Packages page 8615 read-first',
    claim: 'Business Central shows Configuration Packages as foreground list, page or side pane in playthru / UNIVERSAARL-DE.',
    expectedPageText: [CONFIG_PACKAGES_RE],
    run: async () => {
      packageText = await openConfigurationPackages(page);
    },
    verdict: (_before, after) =>
      ['side-pane-open', 'list-page-open', 'target-page-open', 'card-page-open'].includes(after.classification)
        ? 'proven'
        : 'not-proven',
    stopReason: (_before, after) =>
      after.classification === 'search-overlay-open'
        ? 'Search/Tell-Me overlay remained open.'
        : after.classification === 'role-center-background'
          ? 'Only Role Center background was visible.'
          : null
  });
  screenshots.push(
    await capture(page, 'foundation-package-card-tables-010-list-context.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'List or pane context before package-row inspection',
      sanitizedUrl: sanitizeUrl(page.url()),
      visibleSignals: packageText.split('\n').slice(0, 90),
      noWrite: true
    })
  );

  const row = page.getByRole('row', { name: /U-VAT325|VAT 325 Discovery/i }).first();
  const rowByText = page.getByText(/U-VAT325|VAT 325 Discovery/i).first();
  const rowRoleVisible = await row.isVisible({ timeout: 3000 }).catch(() => false);
  const rowTextVisible = await rowByText.isVisible({ timeout: 3000 }).catch(() => false);
  const textSignalVisible = /U-VAT325(?:-DISC)?|VAT 325 Discovery/i.test(packageText);
  const packageVisible = rowRoleVisible || rowTextVisible || textSignalVisible;

  await stepTimeline.step(page, {
    stepId: '020-focus-existing-package-row',
    action: `Focus existing package candidate ${PACKAGE_CODE} if visible`,
    claim: `${PACKAGE_CODE} is selected only when visible as row or text signal; no package action is executed.`,
    expectedPageText: [PACKAGE_SURFACE_RE],
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
    await capture(page, 'foundation-package-card-tables-020-row-focus.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Existing parked package row focus if visible',
      packageCode: PACKAGE_CODE,
      packageVisible,
      rowRoleVisible,
      rowTextVisible,
      textSignalVisible,
      visibleSignals: afterRowText.split('\n').slice(0, 90),
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
    await capture(page, 'foundation-package-card-tables-030-action-inventory.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Visible package action inventory without execution',
      actionCount: actions.length,
      writeCapableActions: actions
        .filter((action) => WRITE_ACTION_RE.test(`${action.text} ${action.title} ${action.ariaLabel}`))
        .slice(0, 35),
      noWrite: true
    })
  );

  const finalText = await compactPackageText(page);
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'page-text.txt'), finalText);
  stepTimeline.timeline.businessCentralOpened = true;
  stepTimeline.timeline.playwrightLiveRunExecuted = true;
  stepTimeline.timeline.liveActionsExecuted = false;
  const stepTimelinePath = await stepTimeline.write();

  const resultStatus = packageVisible ? 'observed-package-table-surface-readfirst' : 'blocked-package-candidate-not-visible';
  const nextCase =
    packageVisible ? 'FOUNDATION-SETUP-PACKAGE-METADATA-NARROW-WRITE-GATE' : 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE';
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Konfigurationspakete / Configuration Packages',
    sanitizedUrl: sanitizeUrl(page.url()),
    packageCode: PACKAGE_CODE,
    packageVisible,
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
      'Opened Configuration Packages read-first in playthru / UNIVERSAARL-DE.',
      'Captured list/pane context with visual-state classification.',
      'Focused existing U-VAT325-DISC row only if visible.',
      'Inventoried visible package actions without execution.'
    ],
    actionsNotTaken: [
      'No package creation',
      'No package edit',
      'No Get Tables/Tabellen abrufen',
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
    proved: packageVisible
      ? [
          'Business Central opened in playthru / UNIVERSAARL-DE.',
          'Configuration Packages was visible as read-first package surface.',
          'Existing parked package candidate U-VAT325-DISC was visible enough for row focus.',
          'Visible package actions were inventoried without execution.',
          'No package/setup/master-data/posting action occurred.'
        ]
      : [
          'Business Central opened in playthru / UNIVERSAARL-DE.',
          'Configuration Packages was visible as read-first package surface.',
          'No package/setup/master-data/posting action occurred.'
        ],
    notProved: [
      'No package metadata write.',
      'No package card content write.',
      'No package table line for Table 252, Table 325 or Table/Page 470.',
      'No field selection.',
      'No import/export/validate/apply route.',
      'No setup value.',
      'No posting/VAT/master-data readiness.',
      'No UAT acceptance.'
    ],
    blockedBy: packageVisible ? [] : [`${PACKAGE_CODE} was not visible as an existing package candidate.`],
    warnings: [
      'U-VAT325-DISC is still only a parked route candidate. Do not reuse it for setup until a separate write gate explicitly permits one action.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: packageVisible
        ? 'Configuration Packages and U-VAT325-DISC package candidate are visible read-first.'
        : 'Configuration Packages is visible, but U-VAT325-DISC was not visible as a package candidate.',
      isPlannedNextCaseStillSensible: packageVisible,
      reason: packageVisible
        ? 'Read-first package-table surface proof can feed a narrow metadata write-gate decision.'
        : 'Package route should be parked or recovered before any write gate.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-METADATA-NARROW-WRITE-GATE',
          status: packageVisible ? 'ready-after-current' : 'blocked',
          reason: packageVisible ? 'Can decide one narrow metadata action.' : 'Needs visible package candidate or alternative route.'
        },
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE',
          status: packageVisible ? 'ready-after-current' : 'ready-next',
          reason: packageVisible ? 'Fallback if write gate is rejected.' : 'Best next step if candidate remains invisible.'
        },
        {
          caseId: 'FOUNDATION-READINESS-DECISION',
          status: 'ready-after-current',
          reason: 'Should consume the package-route verdict.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: packageVisible
        ? 'It can decide whether exactly one package metadata action is justified.'
        : 'It avoids improvising a package write when the candidate surface is not visible.',
      risksBeforeNextCase: [
        'Any package metadata write needs explicit keep/cleanup and reopen proof.',
        'Any package apply/import/validate action remains forbidden until its own gate.'
      ],
      requiredPreparation: ['Review screenshot QA and step timeline before selecting a write gate.']
    },
    safeToFinalizeState: false,
    requiresReview: false,
    nextCase
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
      'No package was created, edited, imported, exported, validated, applied, deleted or edited in Excel.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].join('\n')
  );
});
