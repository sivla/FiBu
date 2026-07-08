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
  process.env.FOUNDATION_PACKAGE_CARD_DETAIL_LIVE_APPROVED !== '1' ||
    process.env.FOUNDATION_PACKAGE_CARD_DETAIL_RUNNER_GUARD_CHECKED !== '1',
  'FOUNDATION-SETUP-PACKAGE-CARD-DETAIL-READFIRST must run through the guarded runner with --live-approved.'
);

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-CARD-DETAIL-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'foundation-setup-package-card-detail-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const PACKAGE_CODE = 'U-VAT325-DISC';

const CONFIG_PACKAGES_RE =
  /Konfigurationspakete|Configuration Packages|Config\. Packages|Paketname|Package Name|Tabellen abrufen|Get Tables|U-VAT325-DISC/i;
const PACKAGE_DETAIL_RE =
  /Paketcode|Paketname|Package Code|Package Name|Konfigurationspaketkarte|Configuration Package Card|Tabellen|Tables|Felder|Fields|U-VAT325-DISC|VAT 325 Discovery/i;
const RISKY_ACTION_RE =
  /Neu|New|Bearbeiten|Edit|Loeschen|Loschen|Delete|Tabellen abrufen|Get Tables|Import|Export|Validieren|Validate|Anwenden|Apply|Excel|Felder auswahlen|Select Fields/i;

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
        PACKAGE_DETAIL_RE,
        /252|325|470|Buchungsmatrix|MwSt|USt|VAT|General Posting Setup|VAT Posting Setup/i,
        RISKY_ACTION_RE
      ],
      maxLines: 240,
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

async function collectVisibleSignals(page: Page) {
  const signals = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const interesting =
          /U-VAT325|VAT 325 Discovery|Paketcode|Paketname|Package Code|Package Name|Tabellen|Tables|Felder|Fields|Get Tables|Tabellen abrufen|Import|Export|Validate|Validieren|Apply|Anwenden|Excel/i;
        return [...document.querySelectorAll<HTMLElement>('[role="button"],[role="menuitem"],button,a,span,div,th,td,input')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || element.getAttribute('value') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const topElement = document.elementFromPoint(centerX, centerY);
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
          .slice(0, 260);
      })
      .catch(() => []);
    signals.push(...(entries as Array<Record<string, unknown>>));
  }
  return signals;
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

async function focusPackageCandidate(page: Page) {
  const row = page.getByRole('row', { name: /U-VAT325|VAT 325 Discovery/i }).first();
  const text = page.getByText(/U-VAT325|VAT 325 Discovery/i).first();
  const openRecordButton = page.locator('button[title*="U-VAT325-DISC"], [role="button"][title*="U-VAT325-DISC"]').first();
  const packageText = await compactPackageText(page);
  const rowVisible = await row.isVisible({ timeout: 3000 }).catch(() => false);
  const textVisible = await text.isVisible({ timeout: 3000 }).catch(() => false);
  const openButtonVisible = await openRecordButton.isVisible({ timeout: 3000 }).catch(() => false);
  const textSignalVisible = /U-VAT325(?:-DISC)?|VAT 325 Discovery/i.test(packageText);
  if (rowVisible) {
    await row.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
    await row.click({ timeout: 2000 }).catch(() => undefined);
    return { visible: true, route: 'row-click' };
  }
  if (textVisible) {
    await text.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
    await text.click({ timeout: 2000 }).catch(() => undefined);
    return { visible: true, route: 'text-click' };
  }
  if (openButtonVisible) {
    await openRecordButton.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
    return { visible: true, route: 'open-record-button-visible' };
  }
  if (textSignalVisible) {
    return { visible: true, route: 'text-signal-visible' };
  }
  return { visible: false, route: 'not-visible' };
}

async function tryOpenPackageDetailReadOnly(page: Page) {
  const beforeUrl = sanitizeUrl(page.url());
  const beforeText = await compactPackageText(page);
  const beforeSignals = await collectVisibleSignals(page);
  const openRecordButton = page.locator('button[title*="U-VAT325-DISC"], [role="button"][title*="U-VAT325-DISC"]').first();
  const openButtonVisible = await openRecordButton.isVisible({ timeout: 2000 }).catch(() => false);

  // Opening an existing record is read-only in this case. No command-bar action is executed.
  if (openButtonVisible) {
    await openRecordButton.click({ timeout: 3000 });
  } else {
    await page.keyboard.press('Enter').catch(() => undefined);
  }
  await page.waitForTimeout(1200);
  await dismissTours(page);

  const afterUrl = sanitizeUrl(page.url());
  const afterText = await compactPackageText(page);
  const afterSignals = await collectVisibleSignals(page);
  const detailSignals = [
    /Paketcode|Package Code/i.test(afterText),
    /Paketname|Package Name/i.test(afterText),
    /Tabellen|Tables/i.test(afterText),
    /Felder|Fields/i.test(afterText),
    /U-VAT325-DISC|VAT 325 Discovery/i.test(afterText)
  ].filter(Boolean).length;
  const materiallyChanged = beforeUrl !== afterUrl || afterText !== beforeText || afterSignals.length !== beforeSignals.length;
  const detailSurfaceVisible = detailSignals >= 2 && materiallyChanged;

  return {
    beforeUrl,
    afterUrl,
    beforeText,
    afterText,
    beforeSignals,
    afterSignals,
    openButtonVisible,
    detailSignals,
    materiallyChanged,
    detailSurfaceVisible
  };
}

test(`${CASE_ID} proves existing package detail route read-first`, async ({ page }) => {
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
    action: 'Open Configuration Packages page 8615 read-first',
    claim: 'Business Central shows Configuration Packages in playthru / UNIVERSAARL-DE.',
    expectedPageText: [CONFIG_PACKAGES_RE],
    run: async () => {
      initialText = await openConfigurationPackages(page);
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
    await capture(page, 'foundation-package-card-detail-010-list-context.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'List or pane context before package detail attempt',
      sanitizedUrl: sanitizeUrl(page.url()),
      visibleSignals: initialText.split('\n').slice(0, 90),
      noWrite: true
    })
  );

  let focusResult = { visible: false, route: 'not-run' };
  await stepTimeline.step(page, {
    stepId: '020-focus-existing-package',
    action: `Focus existing package candidate ${PACKAGE_CODE}`,
    claim: `${PACKAGE_CODE} is visible enough to focus without creating or editing a package.`,
    expectedPageText: [/U-VAT325|VAT 325 Discovery/i],
    run: async () => {
      focusResult = await focusPackageCandidate(page);
    },
    verdict: () => (focusResult.visible ? 'proven' : 'not-proven'),
    stopReason: () => (focusResult.visible ? null : `${PACKAGE_CODE} was not visible enough for focus.`)
  });
  const focusedText = await compactPackageText(page);
  screenshots.push(
    await capture(page, 'foundation-package-card-detail-020-focused-candidate.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Focused existing parked package candidate if visible',
      packageCode: PACKAGE_CODE,
      focusResult,
      visibleSignals: focusedText.split('\n').slice(0, 90),
      noWrite: true
    })
  );

  let detailProbe = {
    beforeUrl: sanitizeUrl(page.url()),
    afterUrl: sanitizeUrl(page.url()),
    beforeText: '',
    afterText: '',
    beforeSignals: [] as Array<Record<string, unknown>>,
    afterSignals: [] as Array<Record<string, unknown>>,
    openButtonVisible: false,
    detailSignals: 0,
    materiallyChanged: false,
    detailSurfaceVisible: false
  };
  if (focusResult.visible) {
    await stepTimeline.step(page, {
      stepId: '030-open-existing-package-detail',
      action: 'Open focused package detail using row activation only',
      claim: 'Existing package detail/card surface opens read-only without executing command-bar actions.',
      expectedPageText: [PACKAGE_DETAIL_RE],
      run: async () => {
        detailProbe = await tryOpenPackageDetailReadOnly(page);
      },
      verdict: () => (detailProbe.detailSurfaceVisible ? 'proven' : 'not-proven'),
      stopReason: () =>
        detailProbe.detailSurfaceVisible
          ? null
          : 'Row activation did not prove a distinct package detail/card surface.'
    });
  }

  screenshots.push(
    await capture(page, 'foundation-package-card-detail-030-detail-probe.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Package detail/card read-first probe',
      packageCode: PACKAGE_CODE,
      detailSignals: detailProbe.detailSignals,
      materiallyChanged: detailProbe.materiallyChanged,
      openButtonVisible: detailProbe.openButtonVisible,
      detailSurfaceVisible: detailProbe.detailSurfaceVisible,
      beforeUrl: detailProbe.beforeUrl,
      afterUrl: detailProbe.afterUrl,
      visibleSignals: detailProbe.afterText.split('\n').slice(0, 120),
      noWrite: true
    })
  );

  const signals = await collectVisibleSignals(page);
  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'visible-package-detail-signals.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    packageCode: PACKAGE_CODE,
    focusResult,
    detailProbe: {
      beforeUrl: detailProbe.beforeUrl,
      afterUrl: detailProbe.afterUrl,
      openButtonVisible: detailProbe.openButtonVisible,
      detailSignals: detailProbe.detailSignals,
      materiallyChanged: detailProbe.materiallyChanged,
      detailSurfaceVisible: detailProbe.detailSurfaceVisible
    },
    signals
  });
  screenshots.push(
    await capture(page, 'foundation-package-card-detail-040-signal-inventory.png', {
      page: 'Konfigurationspakete / Configuration Packages',
      step: 'Visible package detail/action signal inventory without execution',
      signalCount: signals.length,
      riskySignals: signals
        .filter((signal) => RISKY_ACTION_RE.test(`${signal.text} ${signal.title} ${signal.ariaLabel}`))
        .slice(0, 40),
      noWrite: true
    })
  );

  const finalText = await compactPackageText(page);
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'page-text.txt'), finalText);
  stepTimeline.timeline.businessCentralOpened = true;
  stepTimeline.timeline.playwrightLiveRunExecuted = true;
  stepTimeline.timeline.liveActionsExecuted = false;
  const stepTimelinePath = await stepTimeline.write();

  const resultStatus = detailProbe.detailSurfaceVisible
    ? 'observed-package-detail-surface-readfirst'
    : focusResult.visible
      ? 'blocked-package-detail-not-proven'
      : 'blocked-package-candidate-not-visible';
  const nextCase =
    resultStatus === 'observed-package-detail-surface-readfirst'
      ? 'FOUNDATION-SETUP-PACKAGE-ONE-METADATA-ACTION-WRITE-GATE'
      : 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE';
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
    packageCandidateVisible: focusResult.visible,
    packageCandidateFocusRoute: focusResult.route,
    packageDetailSurfaceVisible: detailProbe.detailSurfaceVisible,
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
      'Focused existing U-VAT325-DISC if visible.',
      'Attempted read-only row activation to prove package detail/card surface.',
      'Captured screenshot chain, visual-state JSON and visible package/detail signals.'
    ],
    actionsNotTaken: [
      'No package creation',
      'No package edit or metadata write',
      'No Get Tables/Tabellen abrufen',
      'No add/remove table',
      'No field selection',
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
    signalInventoryPath: `${EVIDENCE_DIR_REL}/visible-package-detail-signals.json`,
    proved: [
      'Business Central opened in playthru / UNIVERSAARL-DE.',
      'Configuration Packages was visible as a read-first package surface.',
      ...(focusResult.visible ? ['Existing parked package candidate U-VAT325-DISC was visible enough for focus.'] : []),
      ...(detailProbe.detailSurfaceVisible
        ? ['Existing package detail/card surface was visible after row activation.']
        : []),
      'Visible package/detail signals were inventoried without command execution.',
      'No package/setup/master-data/posting action occurred.'
    ],
    notProved: [
      ...(detailProbe.detailSurfaceVisible ? [] : ['No distinct package detail/card surface proof.']),
      'No package metadata write.',
      'No package table line for Table 252, Table 325 or Table/Page 470.',
      'No field selection route.',
      'No import/export/validate/apply route.',
      'No setup value.',
      'No posting/VAT/master-data readiness.',
      'No UAT acceptance.'
    ],
    blockedBy:
      resultStatus === 'observed-package-detail-surface-readfirst'
        ? []
        : focusResult.visible
          ? ['Focused package candidate did not open a distinct detail/card surface through safe row activation.']
          : [`${PACKAGE_CODE} was not visible as an existing package candidate.`],
    warnings: [
      'U-VAT325-DISC remains a parked route candidate. Do not reuse it for setup until a separate write gate explicitly permits one action.',
      'No command-bar action was executed; risky signals are inventory only.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        resultStatus === 'observed-package-detail-surface-readfirst'
          ? 'Configuration Packages and the existing package detail/card surface are visible read-first.'
          : 'Configuration Packages is visible, but package detail/card surface was not proven by the safe read-only route.',
      isPlannedNextCaseStillSensible: resultStatus === 'observed-package-detail-surface-readfirst',
      reason:
        resultStatus === 'observed-package-detail-surface-readfirst'
          ? 'A later one-action write gate can be considered, but only after reviewing keep/cleanup/reopen proof.'
          : 'Package write remains premature; route should be parked or a materially different route selected.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-ONE-METADATA-ACTION-WRITE-GATE',
          status:
            resultStatus === 'observed-package-detail-surface-readfirst'
              ? 'ready-after-current'
              : 'needs-ui-discovery-first',
          reason:
            resultStatus === 'observed-package-detail-surface-readfirst'
              ? 'Detail surface proof exists; still needs exact one-action scope.'
              : 'Needs detail/card surface proof first.'
        },
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE',
          status:
            resultStatus === 'observed-package-detail-surface-readfirst'
              ? 'ready-after-current'
              : 'ready-next',
          reason: 'Fallback if package route remains too weak for Foundation setup.'
        },
        {
          caseId: 'FOUNDATION-READINESS-DECISION',
          status: 'ready-after-current',
          reason: 'Consumes the package-route verdict.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed-package-detail-surface-readfirst'
          ? 'It can define whether exactly one harmless metadata action is worth a write gate.'
          : 'It prevents another near-duplicate package attempt without a materially new hypothesis.',
      risksBeforeNextCase: [
        'Any package metadata write needs explicit keep/cleanup and reopen proof.',
        'Any package apply/import/validate action remains forbidden until its own gate.'
      ],
      requiredPreparation: [
        'Review screenshot QA, visual-state JSON and signal inventory before selecting any write gate.'
      ]
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
      `Candidate visible: ${focusResult.visible}`,
      `Detail surface visible: ${detailProbe.detailSurfaceVisible}`,
      '',
      'No package was created, edited, imported, exported, validated, applied, deleted, extended with tables or edited in Excel.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].join('\n')
  );
});
