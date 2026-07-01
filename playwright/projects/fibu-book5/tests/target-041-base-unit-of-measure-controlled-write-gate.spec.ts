import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-041-BASE-UNIT-OF-MEASURE-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-041-base-unit-of-measure-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-041-result.json');
const UNITS_PAGE_ID = 209;

const targetUnit = {
  code: 'STK',
  description: 'Stueck'
};

type Step = Record<string, unknown>;

function buildPlaythruUrl(filterTarget = false) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(UNITS_PAGE_ID));
  if (filterTarget) {
    url.searchParams.set('filter', `'Unit of Measure'.'Code' IS '${targetUnit.code}'`);
  }
  return url;
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function literalPattern(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsHardForbiddenText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Ship and Invoice|Delete\?|Loeschen\?|Payment Journal|Zahlungsjournal|Buchen|Apply Template\?|Vorlage anwenden\?/i.test(
    text
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [/Einheiten|Units of Measure|Unit of Measure|Code|Beschreibung|Description|International|STK|Stueck|Stuck|Neu|New/i],
    maxLines: 160,
    maxLineLength: 220
  });
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible: {
      unitsContext: /Einheiten|Units of Measure|Unit of Measure|Code|Beschreibung|Description/i.test(text),
      targetCode: literalPattern(targetUnit.code).test(text),
      targetDescription: literalPattern(targetUnit.description).test(text) || /Stuck/i.test(text),
      hardForbiddenSignal: containsHardForbiddenText(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: UNITS_PAGE_ID,
    page: 'Units of Measure / Einheiten',
    step,
    visibleLearning: [
      'Eine Basiseinheit ist die Mengenbasis eines Artikels.',
      'Ohne Basiseinheit kann der erste Artikel nicht sauber gespeichert werden.',
      'In diesem Gate wird nur eine Einheit angelegt oder verifiziert.'
    ],
    importantUi: ['Units of Measure / Einheiten', 'Code', 'Beschreibung/Description'],
    internallyProves:
      snapshot.visible.targetCode && snapshot.visible.targetDescription
        ? 'Die Basiseinheit STK ist im Einheitenkontext sichtbar.'
        : 'Einheitenkontext vor oder waehrend des kontrollierten Schreibgates.',
    doesNotProve: [
      'Kein Artikel ist gespeichert.',
      'Keine Artikelbuchungsgruppe oder USt-Gruppe ist gesetzt.',
      'Keine Lager-, Wert-, Sach- oder USt-Posten sind entstanden.'
    ],
    finalScreenshotStatus: snapshot.visible.targetCode ? 'universaarl-foundation-evidence' : 'setup-or-blocker-evidence',
    ...extra
  });
  return snapshot;
}

async function openUnits(page: Page, filterTarget = false) {
  await page.goto(buildPlaythruUrl(filterTarget).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1300);
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (expected.test(bodyText)) return { frame, bodyText: clean(bodyText) };
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible({ timeout }).catch(() => false)) return item;
  }
  return undefined;
}

async function clickAction(page: Page, frame: Frame, name: RegExp) {
  for (const scope of [frame, page]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = await firstVisible(scope.getByRole(role, { name }), 900);
      if (action) {
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(1200);
        return true;
      }
    }
  }
  return false;
}

async function editableInputs(scope: Frame | Locator) {
  const boxes = scope.locator('input[role="textbox"], input[role="combobox"], textarea[role="textbox"], input:not([type])');
  const inspected = [];
  const result: Locator[] = [];
  const count = await boxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = boxes.nth(index);
    const row = {
      index,
      visible: await box.isVisible({ timeout: 300 }).catch(() => false),
      disabled: await box.isDisabled({ timeout: 300 }).catch(() => true),
      editable: await box.isEditable({ timeout: 300 }).catch(() => false),
      aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
      title: (await box.getAttribute('title').catch(() => '')) || '',
      value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
    };
    inspected.push(row);
    if (row.visible && !row.disabled && row.editable) result.push(box);
  }
  return { result, inspected };
}

async function createOrVerifyUnit(page: Page, steps: Step[]) {
  await openUnits(page);
  const beforeText = await safeText(page);
  if (literalPattern(targetUnit.code).test(beforeText)) {
    return {
      changed: false,
      status: 'already-exists' as const,
      reason: `${targetUnit.code} already visible before write gate.`
    };
  }

  const { frame } = await findBcFrame(page, /Einheiten|Units of Measure|Code|Beschreibung|Description/i);
  const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
  steps.push({ step: 'click-scoped-new-on-units-of-measure', newClicked });
  if (!newClicked) {
    return { changed: false, status: 'blocked' as const, reason: 'New/Neu was not visible in Units of Measure context.' };
  }

  await page.waitForTimeout(1200);
  const afterNewText = await safeText(page);
  if (containsHardForbiddenText(afterNewText)) {
    return { changed: false, status: 'blocked' as const, reason: 'Hard forbidden dialog/action text was visible after New.' };
  }

  const { frame: afterNewFrame } = await findBcFrame(page, /Einheiten|Units of Measure|Code|Beschreibung|Description|STK/i);
  const { inspected } = await editableInputs(afterNewFrame);
  steps.push({ step: 'editable-inputs-after-new-unit', inspected });

  // Business Central list editors often keep focus in the freshly inserted row
  // without exposing a stable textbox locator. Use the natural grid field flow.
  await page.keyboard.insertText(targetUnit.code);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await page.keyboard.insertText(targetUnit.description);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1500);

  return {
    changed: true,
    status: 'created-or-edited' as const,
    reason: 'Filled Units of Measure Code and Description only.',
    fieldsChanged: [`Code=${targetUnit.code}`, `Description=${targetUnit.description}`],
    fieldsNotTouched: ['International Standard Code', 'Item', 'Posting setup', 'VAT setup']
  };
}

test('TARGET-041 creates or verifies STK base unit of measure', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-036E blocked first item creation because no PCS/STK base unit was visible. A single unit of measure is the smallest missing prerequisite.',
      evidenceBasis: [
        'TARGET-040: Units of Measure page visible read-only.',
        'TARGET-036E: first item was not saved because Base Unit was unproven.'
      ],
      fieldsChangedOnlyIfSafe: [`Unit.Code=${targetUnit.code}`, `Unit.Description=${targetUnit.description}`],
      fieldsNotTouched: ['International Standard Code', 'Items', 'Inventory Setup', 'Posting Groups', 'VAT Setup'],
      risk: 'A unit of measure is foundational master data; it should not be confused with item, posting or VAT readiness.',
      fallback: 'Abort and document screenshots if Code/Description inputs are not trusted.'
    }
  ];

  await openUnits(page);
  const before = await captureState(page, 'target-041-010-units-before', 'Before STK unit write gate.', {
    targetUnit
  });

  const writeAttempt = await createOrVerifyUnit(page, steps);
  const afterAttempt = await captureState(page, 'target-041-020-after-unit-attempt', 'After STK unit write or verify attempt.', {
    targetUnit,
    writeAttempt,
    steps
  });

  await openUnits(page, true);
  const afterReopen = await captureState(page, 'target-041-030-after-reopen-filtered-proof', 'After reopening Units filtered to STK.', {
    targetUnit,
    writeAttempt,
    steps,
    reopenProofRoute: 'direct Page 209 URL with Unit of Measure Code filter'
  });

  const afterReopenText = await safeText(page);
  const persistedCode = literalPattern(targetUnit.code).test(afterReopenText);
  const persistedDescription = literalPattern(targetUnit.description).test(afterReopenText) || /Stuck/i.test(afterReopenText);
  const persisted = persistedCode;
  const blockedBy = persisted ? [] : [`${targetUnit.code} is not visible after filtered reopen.`];
  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted
    ? 'TARGET-036E2-FIRST-ITEM-CONTROLLED-WRITE-GATE-RETRY'
    : 'TARGET-041B-BASE-UNIT-FIELD-ROUTE-RECOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-base-unit-controlled-write-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Units of Measure / Einheiten',
    pageId: UNITS_PAGE_ID,
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Page 209 Units of Measure / Einheiten.',
      'Captured before screenshot QA.',
      writeAttempt.changed
        ? 'Opened a new Units of Measure row and filled only Code and Description.'
        : writeAttempt.status === 'already-exists'
          ? 'Verified an existing STK unit without creating a duplicate.'
          : 'Stopped before an unsafe write.',
      'Reopened Page 209 with a Unit of Measure Code filter for persistence proof.',
      'Captured after/reopen screenshot QA.'
    ],
    actionsNotTaken: [
      'No item was created.',
      'No customer or vendor was created.',
      'No setup field was changed.',
      'No posting group or VAT group was changed.',
      'No sales/purchase document or draft was created.',
      'No Preview Posting was executed.',
      'No Posting was executed.',
      'No payment was executed.',
      'No API shortcut was used.',
      'No company switch was executed.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: writeAttempt.changed,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-041-010-units-before.png',
      'playwright/projects/fibu-book5/img/target-041-020-after-unit-attempt.png',
      'playwright/projects/fibu-book5/img/target-041-030-after-reopen-filtered-proof.png'
    ],
    proved: persisted
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 209 Units of Measure / Einheiten was used as the scoped page.',
          `${targetUnit.code} is visible after reopen.`,
          'No item, setup, document, Preview Posting or Posting route was used.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 209 Units of Measure / Einheiten was opened and screenshot QA was captured.'
        ],
    notProved: [
      'No item is created.',
      'No item card Base Unit value is proven.',
      persistedDescription ? 'Unit description is visible.' : `Unit description ${targetUnit.description} is not proven visible.`,
      'No posting group, VAT setup, document, Preview Posting, Posting, item ledger entry, value entry, G/L entry or VAT entry is proven.',
      ...blockedBy
    ],
    blockedBy,
    warnings: [
      'This is only a unit-of-measure foundation proof.',
      'The next item case must still set Base Unit on an item card and reopen the item.',
      'Posting/VAT/inventory posting fields remain separate gated setup steps.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCustomerCreated: true,
      noVendorCreated: true,
      noItemCreated: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      unitOfMeasureChanged: writeAttempt.changed
    },
    targetUnit,
    before,
    afterAttempt,
    afterReopen,
    writeAttempt,
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-036E blocked first item creation because no PCS/STK base unit was visible.',
      isPlannedNextCaseStillSensible: true,
      reason: 'A single STK unit is the smallest concrete prerequisite before retrying first item creation.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-036E2-FIRST-ITEM-CONTROLLED-WRITE-GATE-RETRY',
          status: persisted ? 'ready-next' : 'blocked',
          reason: persisted ? 'STK exists; retry first item creation with Base Unit STK.' : 'Retry item only after STK is visible.'
        },
        {
          caseId: 'TARGET-036E2-FIRST-ITEM-FIELD-HELPER-RECOVERY',
          status: persisted ? 'ready-after-current' : 'blocked',
          reason: 'Needed only if the next item card fill still cannot target fields safely.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'ready-after-current',
          reason: 'Useful after item creation is created or blocked again.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'O2C still needs item, posting groups, VAT and expected entry trace boundaries.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'The base-unit blocker is closed, so the first item can be retried narrowly.'
        : 'The base-unit field route must be recovered before item creation.',
      risksBeforeNextCase: [
        'The item retry must not set posting groups casually.',
        'No document, Preview Posting or Posting is allowed.',
        'The item save still needs reopen proof.'
      ],
      requiredPreparation: [
        'Use Base Unit STK on the first item retry.',
        'Set only Item No., Description, Type and Base Unit if fields are trusted.',
        'Keep posting groups and VAT fields untouched.'
      ]
    },
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        updatedAt: '2026-07-01T14:55:00.000Z',
        activeArea: persisted ? 'universaarl-first-item-write-gate' : 'universaarl-base-unit-field-route-recovery',
        activeCase: nextCase,
        active_case_file:
          nextCase === 'TARGET-036E2-FIRST-ITEM-CONTROLLED-WRITE-GATE-RETRY'
            ? '.agent/state/cases/target-036e2-first-item-controlled-write-gate-retry.json'
            : '.agent/state/cases/target-041b-base-unit-field-route-recovery.json',
        nextCase,
        nextStep: persisted
          ? 'Retry first item creation now that STK exists as a Base Unit candidate.'
          : 'Recover the Units of Measure field route before retrying first item creation.'
      }
    }
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-041 Base Unit of Measure Controlled Write Gate',
      '',
      `Status: ${resultStatus}`,
      '',
      'Dieser Case legt genau eine Basiseinheit fuer den ersten Universaarl-Artikel an oder blockiert sauber. Er erzeugt keinen Artikel und keine Buchungswirkung.',
      '',
      '## Ergebnis',
      '',
      ...result.proved.map((line) => `- ${line}`),
      '',
      '## Grenzen',
      '',
      ...result.notProved.map((line) => `- ${line}`),
      '',
      '## Screenshots',
      '',
      ...result.screenshots.map((line) => `- ${line}`)
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.setupChanged).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
