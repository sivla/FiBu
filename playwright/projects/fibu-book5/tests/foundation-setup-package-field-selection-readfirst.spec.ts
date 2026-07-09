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
  process.env.FOUNDATION_PACKAGE_FIELD_SELECTION_LIVE_APPROVED !== '1' ||
    process.env.FOUNDATION_PACKAGE_FIELD_SELECTION_RUNNER_GUARD_CHECKED !== '1',
  'FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-READFIRST must run through the guarded runner with --live-approved.'
);

const CASE_ID = 'FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-READFIRST';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'foundation-setup-package-field-selection-readfirst';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const PACKAGE_CODE = 'U-VAT325-DISC';
const TABLE_ID = '325';

const PACKAGE_CARD_RE = /Paketkarte konfigurieren|Configuration Package Card|Paketcode|Package Code|U-VAT325-DISC/i;
const TABLE_325_LINE_RE =
  /(^|\n)\s*325\s+(VAT Posting Setup|MwSt|Buchungsmatrix)|Tabellen-ID[^\n]*\n[^\n]*\b325\b/i;
const TABLE_SUBFORM_RE = /Tabellen-ID|Table ID|Tabellenname|Table Name|Tabellentrigger|Package Table|Tabellen/i;
const FIELD_CONTEXT_RE =
  /Anz\. der verfugbaren Felder|Anz\. der eingeschlossenen Felder|Anzahl der zu prufenden Felder|No\. of Available Fields|No\. of Included Fields|No\. of Fields to Validate|Felder|Fields/i;
const FORBIDDEN_ACTION_RE =
  /Tabellen abrufen|Get Tables|Import|Export|Validate|Validieren|Apply|Anwenden|Edit in Excel|In Excel bearbeiten|Felder auswahlen|Select Fields|Neu|New|Zeile loschen|Delete Line/i;

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
      include: [PACKAGE_CARD_RE, TABLE_SUBFORM_RE, TABLE_325_LINE_RE, FIELD_CONTEXT_RE, FORBIDDEN_ACTION_RE],
      maxLines: 260,
      maxLineLength: 260
    }).catch(() => '')
  );
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const visible = await frame
      .locator('[role="dialog"], .ms-Dialog-main, .modal-dialog')
      .filter({ hasText: /Import|Export|Validieren|Validate|Anwenden|Apply|Tabellen abrufen|Get Tables/i })
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

  const text = await compactPackageText(page);
  if (!PACKAGE_CARD_RE.test(text) || !text.includes(PACKAGE_CODE)) {
    throw new Error(`${PACKAGE_CODE} package card was not proven via direct Page 8614 route.`);
  }
  return text;
}

async function visibleFieldSignals(page: Page) {
  const text = await compactPackageText(page);
  const signals = {
    packageCardVisible: PACKAGE_CARD_RE.test(text) && text.includes(PACKAGE_CODE),
    tableSubformVisible: TABLE_SUBFORM_RE.test(text),
    table325LineVisible: TABLE_325_LINE_RE.test(text),
    emptyTableViewVisible: /In dieser Ansicht kann nichts angezeigt werden|Nothing to show|There is nothing to show/i.test(text),
    availableFieldsColumnVisible: /Anz\. der verfugbaren Felder|No\. of Available Fields/i.test(text),
    includedFieldsColumnVisible: /Anz\. der eingeschlossenen Felder|No\. of Included Fields/i.test(text),
    fieldsToValidateColumnVisible: /Anzahl der zu prufenden Felder|No\. of Fields to Validate/i.test(text),
    selectFieldsActionVisible: /Felder auswahlen|Select Fields/i.test(text),
    forbiddenActionSignals: text
      .split('\n')
      .filter((line) => FORBIDDEN_ACTION_RE.test(line))
      .slice(0, 80)
  };
  return { text, signals };
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

test(`${CASE_ID} inventories package field-selection context read-first`, async ({ page }) => {
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
    stepId: '010-open-existing-package-card',
    action: `Open existing ${PACKAGE_CODE} package card read-first`,
    claim: `${PACKAGE_CODE} package card is visible in playthru / UNIVERSAARL-DE without package/setup write.`,
    expectedPageText: [PACKAGE_CARD_RE, new RegExp(PACKAGE_CODE)],
    run: async () => {
      initialText = await openExistingPackageCard(page);
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
  screenshots.push(
    await capture(page, 'foundation-package-field-selection-010-card-context.png', {
      page: 'Paketkarte konfigurieren / Configuration Package Card',
      step: 'Existing package card context',
      sanitizedUrl: sanitizeUrl(page.url()),
      visibleSignals: initialText.split('\n').slice(0, 110),
      noWrite: true
    })
  );

  let fieldContext = await visibleFieldSignals(page);
  await stepTimeline.step(page, {
    stepId: '020-inventory-field-context',
    action: 'Inventory visible Table 325 field-count and field-selection signals without activating them',
    claim: 'The existing package table line exposes field-count or field-selection context read-only.',
    expectedPageText: [TABLE_SUBFORM_RE, FIELD_CONTEXT_RE],
    run: async () => {
      fieldContext = await visibleFieldSignals(page);
      await assertSafeContext(page);
    },
    verdict: () =>
      fieldContext.signals.packageCardVisible &&
      fieldContext.signals.tableSubformVisible &&
      fieldContext.signals.table325LineVisible &&
      !fieldContext.signals.emptyTableViewVisible &&
      (fieldContext.signals.availableFieldsColumnVisible ||
        fieldContext.signals.includedFieldsColumnVisible ||
        fieldContext.signals.fieldsToValidateColumnVisible ||
        fieldContext.signals.selectFieldsActionVisible)
        ? 'proven'
        : 'not-proven',
    stopReason: () =>
      fieldContext.signals.packageCardVisible && fieldContext.signals.tableSubformVisible
        ? null
        : 'Package card or table subform was not visible enough for field-context proof.'
  });
  screenshots.push(
    await capture(page, 'foundation-package-field-selection-020-field-context.png', {
      page: 'Paketkarte konfigurieren / Configuration Package Card',
      step: 'Field-count and field-selection context inventory',
      packageCode: PACKAGE_CODE,
      tableId: TABLE_ID,
      signals: fieldContext.signals,
      visibleSignals: fieldContext.text.split('\n').slice(0, 140),
      noWrite: true
    })
  );

  const provedFieldContext =
    fieldContext.signals.packageCardVisible &&
    fieldContext.signals.tableSubformVisible &&
    fieldContext.signals.table325LineVisible &&
    !fieldContext.signals.emptyTableViewVisible &&
    (fieldContext.signals.availableFieldsColumnVisible ||
      fieldContext.signals.includedFieldsColumnVisible ||
      fieldContext.signals.fieldsToValidateColumnVisible ||
      fieldContext.signals.selectFieldsActionVisible);

  screenshots.push(
    await capture(page, 'foundation-package-field-selection-030-stop-boundary.png', {
      page: 'Paketkarte konfigurieren / Configuration Package Card',
      step: 'Stop before any field selection or package action',
      packageCode: PACKAGE_CODE,
      tableId: TABLE_ID,
      forbiddenSignalsVisible: fieldContext.signals.forbiddenActionSignals,
      stoppedBeforeFieldToggleOrSelect: true,
      noWrite: true
    })
  );

  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'page-text.txt'), fieldContext.text);
  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'field-context-signals.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    packageCode: PACKAGE_CODE,
    tableId: TABLE_ID,
    signals: fieldContext.signals,
    textExcerpt: fieldContext.text.split('\n').slice(0, 180)
  });

  stepTimeline.timeline.businessCentralOpened = true;
  stepTimeline.timeline.playwrightLiveRunExecuted = true;
  stepTimeline.timeline.liveActionsExecuted = false;
  const stepTimelinePath = await stepTimeline.write();

  const resultStatus = provedFieldContext ? 'observed-field-context-readfirst' : 'blocked-field-context-not-proven';
  const nextCase = provedFieldContext
    ? 'FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-WRITE-GATE-DECISION'
    : 'FOUNDATION-SETUP-PACKAGE-ROUTE-PARK-OR-ALTERNATIVE-DECISION';

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8614 Paketkarte konfigurieren / Configuration Package Card',
    sanitizedUrl: sanitizeUrl(page.url()),
    packageCode: PACKAGE_CODE,
    targetTable: {
      tableId: 325,
      tableName: 'VAT Posting Setup',
      germanMeaning: 'MwSt.-Buchungsmatrix Einrichtung'
    },
    fieldContextSignals: fieldContext.signals,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    liveActionsExecuted: false,
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
    screenshots,
    stepTimeline: stepTimelinePath,
    actionsTaken: [
      'Opened existing U-VAT325-DISC package card in playthru / UNIVERSAARL-DE.',
      'Inventoried visible Table 325 field-count and field-selection context.',
      'Captured screenshot chain, visual-state JSON, page text and field-context signals.',
      'Stopped before any checkbox, field selection, import/export/validate/apply/Edit-in-Excel/setup action.'
    ],
    actionsNotTaken: [
      'No package creation',
      'No package header edit',
      'No Get Tables / Tabellen abrufen',
      'No add/remove table',
      'No field toggle',
      'No Select Fields / Felder auswaehlen activation',
      'No package import',
      'No package export',
      'No package validation',
      'No package apply',
      'No Edit in Excel',
      'No setup value',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No company switch'
    ],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Existing U-VAT325-DISC package card was visible read-first.',
      ...(provedFieldContext ? ['Visible Table 325 field-count or field-selection context was observed read-first.'] : []),
      'No package/setup/master-data/posting action occurred.'
    ],
    notProved: [
      ...(provedFieldContext ? [] : ['No sufficient field-selection or field-count context was proven.']),
      'No field selection was opened or changed.',
      'No package import/export/validate/apply route.',
      'No VAT setup values.',
      'No posting/VAT/master-data readiness.',
      'No UAT acceptance.'
    ],
    blockedBy: provedFieldContext
      ? []
      : ['Existing package card did not expose enough field-count or field-selection context without unsafe activation.'],
    warnings: [
      'Field-count columns or Select Fields visibility are not setup evidence.',
      'Any later field-selection action may write package metadata and needs its own gate.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: provedFieldContext
        ? 'U-VAT325-DISC / Table 325 shows read-first field-count or field-selection context.'
        : 'U-VAT325-DISC / Table 325 does not yet show enough read-first field context.',
      isPlannedNextCaseStillSensible: provedFieldContext,
      reason: provedFieldContext
        ? 'The next question is whether a field-selection write gate is safe and useful.'
        : 'Do not repeat the route without materially new UI evidence or a different route.',
      lookaheadReviewed: [
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-FIELD-SELECTION-WRITE-GATE-DECISION',
          status: provedFieldContext ? 'ready-after-current' : 'needs-ui-discovery-first',
          reason: provedFieldContext
            ? 'Use only as local decision before any field toggle/selection.'
            : 'Needs stronger field-context proof first.'
        },
        {
          caseId: 'FOUNDATION-SETUP-PACKAGE-IMPORT-VALIDATE-APPLY-GATE-DECISION',
          status: 'needs-setup-first',
          reason: 'Import/validate/apply needs field selection, values and error strategy first.'
        },
        {
          caseId: 'FOUNDATION-READINESS-DECISION',
          status: 'ready-after-current',
          reason: 'Consumes the package field-context verdict into Foundation boundaries.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: provedFieldContext
        ? 'It decides the next narrow metadata risk before any field-selection action.'
        : 'It prevents repeating a weak package route without new evidence.',
      risksBeforeNextCase: [
        'Field selection may write package metadata.',
        'Visible field-count columns are not VAT setup correctness.'
      ],
      requiredPreparation: [
        'Review screenshot QA, visual-state JSON and field-context-signals.json.',
        'Keep import/export/validate/apply/setup values blocked until separate gates.'
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
      `Table: ${TABLE_ID} / VAT Posting Setup`,
      '',
      'No field was selected, toggled or changed.',
      'No package was created, edited, imported, exported, validated, applied, deleted, extended with tables or edited in Excel.',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].join('\n')
  );
});
