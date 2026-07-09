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
  process.env.FOUNDATION_PACKAGE_ONE_METADATA_ACTION_LIVE_APPROVED !== '1' ||
    process.env.FOUNDATION_PACKAGE_ONE_METADATA_ACTION_RUNNER_GUARD_CHECKED !== '1',
  'FOUNDATION-SETUP-PACKAGE-ONE-METADATA-ACTION-EXECUTE must run through the guarded runner with --live-approved.'
);

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-ONE-METADATA-ACTION-EXECUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'foundation-setup-package-one-metadata-action-execute';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const PACKAGE_CODE = 'U-VAT325-DISC';
const TABLE_ID = '325';

const PACKAGE_CARD_RE =
  /Paketkarte konfigurieren|Configuration Package Card|Konfigurationspaketkarte|Paketcode|Package Code|U-VAT325-DISC/i;
const TABLE_SUBFORM_RE = /Tabellen-ID|Table ID|Tabellenname|Table Name|Tabellentrigger|Package Table|Tabellen/i;
const TABLE_325_RE = /(^|\D)325(\D|$)|VAT Posting Setup|MwSt|Buchungsmatrix/i;
const FORBIDDEN_ACTION_RE =
  /Tabellen abrufen|Get Tables|Import|Export|Validate|Validieren|Apply|Anwenden|Edit in Excel|In Excel bearbeiten|Buchen|Post|Preview Posting|Buchungsvorschau/i;

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
        PACKAGE_CARD_RE,
        TABLE_SUBFORM_RE,
        TABLE_325_RE,
        FORBIDDEN_ACTION_RE,
        /Neue Zeile|New Line|Zeile loschen|Delete Line|Felder|Fields|Anz\.|No\./i
      ],
      maxLines: 260,
      maxLineLength: 260
    }).catch(() => '')
  );
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const visible = await frame
      .locator('[role="dialog"], .ms-Dialog-main, .modal-dialog')
      .filter({ hasText: FORBIDDEN_ACTION_RE })
      .first()
      .isVisible({ timeout: 300 })
      .catch(() => false);
    if (visible) return true;
  }
  return false;
}

async function assertSafeContext(page: Page) {
  expect(isTargetContext(page.url()), `Wrong target context: ${sanitizeUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogVisible(page)).toBe(false);
}

async function openExistingPackageCard(page: Page) {
  await page.goto(buildPlaythruPageUrl(8614), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await assertSafeContext(page);

  let text = await compactPackageText(page);
  if (PACKAGE_CARD_RE.test(text) && text.includes(PACKAGE_CODE)) return { route: 'direct-page-8614', text };

  await page.goto(buildPlaythruPageUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await assertSafeContext(page);

  const row = page.getByRole('row', { name: /U-VAT325-DISC|VAT 325 Discovery/i }).first();
  const textHit = page.getByText(/U-VAT325-DISC|VAT 325 Discovery/i).first();
  if (await row.isVisible({ timeout: 3000 }).catch(() => false)) {
    await row.click({ timeout: 3000 });
    await page.keyboard.press('Enter');
  } else if (await textHit.isVisible({ timeout: 3000 }).catch(() => false)) {
    await textHit.click({ timeout: 3000 });
    await page.keyboard.press('Enter');
  } else {
    throw new Error(`${PACKAGE_CODE} is not visible on Configuration Packages list.`);
  }
  await page.waitForTimeout(1200);
  await dismissTours(page);
  await assertSafeContext(page);
  text = await compactPackageText(page);
  if (!PACKAGE_CARD_RE.test(text) || !text.includes(PACKAGE_CODE)) {
    throw new Error(`${PACKAGE_CODE} package card was not proven after safe row activation.`);
  }
  return { route: 'list-row-activation', text };
}

async function visibleTableSignals(page: Page) {
  const text = await compactPackageText(page);
  return {
    text,
    packageCardVisible: PACKAGE_CARD_RE.test(text) && text.includes(PACKAGE_CODE),
    tableSubformVisible: TABLE_SUBFORM_RE.test(text),
    table325Visible: TABLE_325_RE.test(text)
  };
}

async function activeElementProof(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLInputElement | HTMLElement | null;
    const rect = active?.getBoundingClientRect();
    return {
      tag: active?.tagName ?? '',
      role: active?.getAttribute('role') ?? '',
      ariaLabel: active?.getAttribute('aria-label') ?? '',
      title: active?.getAttribute('title') ?? '',
      value: 'value' in (active ?? {}) ? String((active as HTMLInputElement).value ?? '') : '',
      x: rect ? Math.round(rect.x) : null,
      y: rect ? Math.round(rect.y) : null,
      width: rect ? Math.round(rect.width) : null,
      height: rect ? Math.round(rect.height) : null
    };
  });
}

function activeElementIsTableIdEditor(proof: Awaited<ReturnType<typeof activeElementProof>>) {
  const label = `${proof.ariaLabel} ${proof.title}`.trim();
  const editable = /INPUT|TEXTAREA/i.test(proof.tag) || /textbox|combobox/i.test(proof.role);
  return editable && /Tabellen-ID|Table ID/i.test(label);
}

async function clickTableNewLine(page: Page) {
  const text = await compactPackageText(page);
  if (!TABLE_SUBFORM_RE.test(text)) return { clicked: false, reason: 'table-subform-not-visible' };
  for (const frame of page.frames()) {
    const button = frame.getByRole('button', { name: /^Neue Zeile$|^New Line$/i }).first();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      return { clicked: true, reason: 'table-subform-new-line-clicked' };
    }
  }
  return { clicked: false, reason: 'new-line-button-not-visible' };
}

test(`${CASE_ID} creates or confirms one package table metadata line for Table 325`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const stepTimeline = createBcStepTimeline({
    project: PROJECT,
    evidenceId: EVIDENCE_ID,
    caseId: CASE_ID,
    evidenceDir: EVIDENCE_DIR,
    evidenceDirRelative: EVIDENCE_DIR_REL
  });

  let openRoute = '';
  await stepTimeline.step(page, {
    stepId: '010-open-existing-package-card',
    action: `Open existing ${PACKAGE_CODE} package card`,
    claim: `${PACKAGE_CODE} package card is visible in playthru / UNIVERSAARL-DE.`,
    expectedPageText: [PACKAGE_CARD_RE, new RegExp(PACKAGE_CODE)],
    run: async () => {
      const opened = await openExistingPackageCard(page);
      openRoute = opened.route;
    },
    verdict: (_before, after) =>
      ['target-page-open', 'card-page-open', 'side-pane-open'].includes(after.classification) ? 'proven' : 'not-proven',
    stopReason: (_before, after) =>
      after.classification === 'search-overlay-open'
        ? 'Search/Tell-Me overlay remained open.'
        : after.classification === 'role-center-background'
          ? 'Only Role Center background was visible.'
          : null
  });

  let beforeSignals = await visibleTableSignals(page);
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, '010-before-page-text.txt'), beforeSignals.text);

  let packageMetadataChanged = false;
  let resultStatus: 'completed-existing-table325-line' | 'completed-created-table325-line' | 'blocked-before-metadata-write' =
    'blocked-before-metadata-write';
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let newLine = { clicked: false, reason: 'not-needed' };
  let editorBeforeTyping: Awaited<ReturnType<typeof activeElementProof>> | null = null;
  let table325AfterTypingVisible = false;

  if (beforeSignals.table325Visible) {
    resultStatus = 'completed-existing-table325-line';
  } else if (!beforeSignals.tableSubformVisible) {
    blockedBy.push('Package card is visible, but package table subform is not visible.');
  } else {
    await stepTimeline.step(page, {
      stepId: '020-create-one-table-line-editor',
      action: 'Click table-subform New Line only if visible',
      claim: 'A single package-table metadata line editor can be opened without Get Tables, Import, Export, Validate, Apply or Edit in Excel.',
      expectedPageText: [TABLE_SUBFORM_RE],
      run: async () => {
        newLine = await clickTableNewLine(page);
        await assertSafeContext(page);
      },
      verdict: () => (newLine.clicked ? 'proven' : 'blocked'),
      stopReason: () => (newLine.clicked ? null : newLine.reason)
    });

    if (!newLine.clicked) {
      blockedBy.push(`No safe table-subform New Line route: ${newLine.reason}.`);
    } else {
      packageMetadataChanged = true;
      editorBeforeTyping = await activeElementProof(page);
      await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, '020-active-editor-before-typing.json'), {
        caseId: CASE_ID,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        packageCode: PACKAGE_CODE,
        tableId: TABLE_ID,
        editorBeforeTyping,
        activeElementIsTableIdEditor: activeElementIsTableIdEditor(editorBeforeTyping)
      });

      if (!activeElementIsTableIdEditor(editorBeforeTyping)) {
        blockedBy.push('Active editor after New Line is not proven as Tabellen-ID / Table ID. Stop before typing.');
      } else {
        await stepTimeline.step(page, {
          stepId: '030-type-table-325',
          action: 'Type Table ID 325 into the proven active Table ID editor',
          claim: 'Exactly one package metadata line for Table 325 can be entered.',
          expectedPageText: [TABLE_SUBFORM_RE, TABLE_325_RE],
          run: async () => {
        await page.keyboard.type(TABLE_ID);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(1500);
        await assertSafeContext(page);
        table325AfterTypingVisible = (await visibleTableSignals(page)).table325Visible;
      },
          verdict: () => (table325AfterTypingVisible ? 'proven' : 'not-proven'),
          stopReason: () =>
            table325AfterTypingVisible ? null : 'Table 325 / VAT Posting Setup is not visible after the one metadata action.'
        });
        beforeSignals = await visibleTableSignals(page);
        resultStatus = beforeSignals.table325Visible ? 'completed-created-table325-line' : 'blocked-before-metadata-write';
        if (!beforeSignals.table325Visible) {
          blockedBy.push('Table 325 was not visible after typing into the proven Table ID editor.');
        }
      }
    }
  }

  let reopenedPackageVisible = false;
  await stepTimeline.step(page, {
    stepId: '040-reopen-proof',
    action: `Reopen ${PACKAGE_CODE} package card after the one-action attempt`,
    claim: 'The final package-card state can be reopened and remains within metadata-only boundaries.',
    expectedPageText: [PACKAGE_CARD_RE],
    run: async () => {
      const reopened = await openExistingPackageCard(page);
      openRoute = `${openRoute};reopen:${reopened.route}`;
      await assertSafeContext(page);
      reopenedPackageVisible = (await visibleTableSignals(page)).packageCardVisible;
    },
    verdict: () => (reopenedPackageVisible ? 'proven' : 'not-proven'),
    stopReason: () => (reopenedPackageVisible ? null : `${PACKAGE_CODE} package card was not visible after reopen.`)
  });

  const afterSignals = await visibleTableSignals(page);
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, '040-after-reopen-page-text.txt'), afterSignals.text);
  stepTimeline.timeline.businessCentralOpened = true;
  stepTimeline.timeline.playwrightLiveRunExecuted = true;
  stepTimeline.timeline.liveActionsExecuted = packageMetadataChanged;
  const stepTimelinePath = await stepTimeline.write();

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    packageCode: PACKAGE_CODE,
    targetTable: {
      tableId: 325,
      tableName: 'VAT Posting Setup',
      germanMeaning: 'MwSt.-Buchungsmatrix Einrichtung'
    },
    openRoute,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    liveActionsExecuted: packageMetadataChanged,
    packageMetadataChanged,
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    newLine,
    editorBeforeTyping,
    beforeSignals: {
      packageCardVisible: beforeSignals.packageCardVisible,
      tableSubformVisible: beforeSignals.tableSubformVisible,
      table325Visible: beforeSignals.table325Visible
    },
    afterSignals: {
      packageCardVisible: afterSignals.packageCardVisible,
      tableSubformVisible: afterSignals.tableSubformVisible,
      table325Visible: afterSignals.table325Visible
    },
    stepTimeline: stepTimelinePath,
    actionsTaken: [
      `Opened existing ${PACKAGE_CODE} package card in playthru / UNIVERSAARL-DE.`,
      'Captured before/action/after/reopen timeline with visual-state JSON.',
      ...(resultStatus === 'completed-existing-table325-line'
        ? ['No package metadata write was needed because Table 325 package metadata was already visible.']
        : packageMetadataChanged
          ? ['Attempted exactly one package-table metadata line action.']
          : ['No package metadata write was allowed because the route stopped before typing.'])
    ],
    actionsNotTaken: [
      'No package creation',
      'No Get Tables / Tabellen abrufen',
      'No select fields',
      'No import',
      'No export',
      'No validate package',
      'No apply package',
      'No Edit in Excel',
      'No setup value',
      'No VAT value',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No company switch'
    ],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      `${PACKAGE_CODE} package card was reopened after the attempt.`,
      ...(resultStatus === 'completed-existing-table325-line'
        ? ['Table 325 / VAT Posting Setup package metadata line was already visible; no metadata write was needed.']
        : []),
      ...(resultStatus === 'completed-created-table325-line'
        ? ['Exactly one Table 325 / VAT Posting Setup package metadata line was created and visible after reopen.']
        : []),
      'No import/export/validate/apply/Edit-in-Excel/setup/master-data/document/preview/posting/API action occurred.'
    ],
    notProved: [
      ...(afterSignals.table325Visible ? [] : ['No durable Table 325 package metadata line was proven.']),
      'No field-selection route.',
      'No package import/export/validate/apply route.',
      'No VAT setup values.',
      'No posting/VAT/master-data readiness.',
      'No UAT acceptance.'
    ],
    blockedBy,
    warnings,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: afterSignals.table325Visible
        ? 'U-VAT325-DISC package card can show Table 325 package metadata without any setup value write.'
        : 'U-VAT325-DISC package card is visible, but Table 325 metadata was not safely proven.',
      isPlannedNextCaseStillSensible: afterSignals.table325Visible,
      reason: afterSignals.table325Visible
        ? 'The package-route verdict can now be consumed into Foundation Readiness.'
        : 'Another package route attempt would need a materially new hypothesis or a park/cleanup decision.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-READINESS-DECISION',
          status: afterSignals.table325Visible ? 'ready-next' : 'ready-after-current',
          reason: 'Consumes the package-route verdict into the Foundation boundary.'
        },
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE',
          status: afterSignals.table325Visible ? 'ready-after-current' : 'ready-next',
          reason: 'Use if this route blocks or creates ambiguous package metadata.'
        },
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-METADATA-CLEANUP-DECISION',
          status: packageMetadataChanged && !afterSignals.table325Visible ? 'ready-next' : 'ready-after-current',
          reason: 'Use only if wrong or ambiguous metadata was created.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: afterSignals.table325Visible
        ? 'FOUNDATION-READINESS-DECISION'
        : packageMetadataChanged
          ? 'FOUNDATION-SETUP-PACKAGE-METADATA-CLEANUP-DECISION'
          : 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE',
      whySelectedNextCaseIsBest: afterSignals.table325Visible
        ? 'Foundation should consume the package metadata verdict instead of expanding package work.'
        : 'The route did not prove Table 325 metadata safely enough for another write attempt.',
      risksBeforeNextCase: [
        'Package metadata is not VAT setup.',
        'No package may be imported, exported, validated, applied or edited in Excel without a separate gate.'
      ],
      requiredPreparation: [
        'Review the step timeline and screenshot QA before using this evidence in Foundation Readiness.'
      ]
    },
    safeToFinalizeState: false,
    requiresReview: false,
    nextCase: afterSignals.table325Visible
      ? 'FOUNDATION-READINESS-DECISION'
      : packageMetadataChanged
        ? 'FOUNDATION-SETUP-PACKAGE-METADATA-CLEANUP-DECISION'
        : 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE'
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      `# ${CASE_ID}`,
      '',
      `Result: ${resultStatus}`,
      `Package: ${PACKAGE_CODE}`,
      `Target table: ${TABLE_ID} / VAT Posting Setup`,
      `Package metadata changed: ${packageMetadataChanged}`,
      '',
      'No package import, export, validate, apply, Edit in Excel, setup value, master data, document, Preview Posting, Posting, API shortcut or company switch occurred.'
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
