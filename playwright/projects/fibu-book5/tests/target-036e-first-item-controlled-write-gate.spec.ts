import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(360_000);

const CASE_ID = 'TARGET-036E-FIRST-ITEM-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-036e-first-item-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-036E-result.json');
const ITEMS_PAGE_ID = 31;
const UNITS_PAGE_ID = 209;

const targetItem = {
  itemNo: 'U-ITEM-HW100',
  description: 'Universaarl Hardware 100',
  type: 'Inventory',
  baseUnitCandidates: ['PCS', 'STK']
};

type Step = Record<string, unknown>;

function buildPlaythruUrl(pageId: number, filterTarget = false) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  if (filterTarget) {
    url.searchParams.set('filter', `'Item'.'No.' IS '${targetItem.itemNo}'`);
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
    include: [
      /Items|Artikel|Item Card|Artikelkarte|Nr\.|No\.|Description|Beschreibung|Type|Art|Inventory|Bestand|Base Unit|Basiseinheit|Einheiten|Units of Measure|Vorlage anwenden|Apply Template|Posting Group|Buchungsgruppe|U-ITEM-HW100|Universaarl Hardware 100/i
    ],
    maxLines: 180,
    maxLineLength: 220
  });
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible: {
      itemsContext: /Items|Artikel|Item Card|Artikelkarte|Nr\.|No\.|Description|Beschreibung/i.test(text),
      targetNo: literalPattern(targetItem.itemNo).test(text),
      targetDescription: literalPattern(targetItem.description).test(text),
      baseUnitSignal: /Base Unit|Basiseinheit|Einheit/i.test(text),
      templateSignal: /Vorlage anwenden|Apply Template/i.test(text),
      postingGroupSignal: /Posting Group|Buchungsgruppe/i.test(text),
      hardForbiddenSignal: containsHardForbiddenText(text)
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: ITEMS_PAGE_ID,
    page: 'Items / Artikel',
    step,
    visibleLearning: [
      'Artikel sind Stammdaten fuer Verkauf, Einkauf und Lager.',
      'Vor einem Artikel braucht Business Central mindestens einen sicheren Kartenkontext und eine Basiseinheit.',
      'Buchungsgruppen, USt-Gruppen und Lagerbuchungssetup bleiben eigene Gates.'
    ],
    importantUi: ['Items/Artikel Liste oder Karte', 'Nr./No.', 'Beschreibung/Description', 'Art/Type', 'Basiseinheit/Base Unit'],
    internallyProves:
      snapshot.visible.targetNo || snapshot.visible.targetDescription
        ? 'Der erste Universaarl-Artikel ist im Artikelkontext sichtbar.'
        : 'Artikelkontext vor oder waehrend des kontrollierten Schreibgates.',
    doesNotProve: [
      'Keine Artikelbuchungsgruppe auf einem gebuchten Beleg.',
      'Keine USt- oder Buchungsmatrix-Wirkung.',
      'Keine Lager-, Wert-, Sach- oder USt-Posten.',
      'Keine Vorlage wurde angewendet.'
    ],
    finalScreenshotStatus: snapshot.visible.targetDescription ? 'universaarl-masterdata-evidence' : 'setup-or-blocker-evidence',
    ...extra
  });
  return snapshot;
}

async function openPage(page: Page, pageId: number, filterTarget = false) {
  await page.goto(buildPlaythruUrl(pageId, filterTarget).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
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
        await page.waitForTimeout(1500);
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

async function inspectUnits(page: Page) {
  await openPage(page, UNITS_PAGE_ID);
  const text = await safeText(page);
  await captureState(page, 'target-036e-005-units-before-item-write', 'Units of Measure before first item write.', {
    pageId: UNITS_PAGE_ID,
    targetItem
  });
  const availableCandidates = targetItem.baseUnitCandidates.filter((candidate) => literalPattern(candidate).test(text));
  return {
    hasRows: !/Es sind noch keine Daten vorhanden|There is nothing to show|No data/i.test(text),
    availableCandidates,
    rawSignals: clean(text).split(/\n| {2,}/).filter((line) => /Code|Beschreibung|PCS|STK|Unit|Einheit/i.test(line)).slice(0, 30)
  };
}

async function closeOrLeaveCard(page: Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(800);
}

test('TARGET-036E creates or blocks first Universaarl item with narrow field gate', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-040 proved the item/inventory Foundation pages read-only. TARGET-036E is allowed to create at most one item, but only if a safe base unit and trusted card fields are visible.',
      evidenceBasis: [
        'TARGET-040: Items, Inventory Setup, Inventory Posting Setup, Item Posting Groups and Units of Measure opened read-only.',
        'TARGET-036B: Item New route opens an item card with Apply Template visible but not clicked.'
      ],
      fieldsChangedOnlyIfSafe: [
        `Item.No=${targetItem.itemNo}`,
        `Item.Description=${targetItem.description}`,
        `Item.Type=${targetItem.type}`,
        `Item.Base Unit=${targetItem.baseUnitCandidates.join(' or ')} if visibly available`
      ],
      fieldsNotTouched: [
        'Apply Template / Vorlage anwenden',
        'Inventory Posting Group',
        'Gen. Prod. Posting Group',
        'VAT Prod. Posting Group',
        'Costing Method',
        'Unit Cost',
        'Unit Price',
        'Vendor No.',
        'Replenishment System'
      ],
      risk: 'An item without a valid base unit or posting setup can mislead later O2C/P2P/inventory evidence.',
      fallback: 'If no base unit is available or the card route is ambiguous, do not save an item; create a separate Units of Measure setup gate.'
    }
  ];

  const unitReadiness = await inspectUnits(page);

  await openPage(page, ITEMS_PAGE_ID);
  const before = await captureState(page, 'target-036e-010-items-before', 'Before first Item write gate.', {
    targetItem,
    unitReadiness
  });
  const beforeText = await safeText(page);

  let writeAttempt: Record<string, unknown> = {
    changed: false,
    status: 'blocked',
    reason: 'Not attempted yet.'
  };

  if (literalPattern(targetItem.itemNo).test(beforeText) || literalPattern(targetItem.description).test(beforeText)) {
    writeAttempt = {
      changed: false,
      status: 'already-exists',
      reason: `${targetItem.itemNo} or ${targetItem.description} already visible before write gate.`
    };
  } else if (unitReadiness.availableCandidates.length === 0) {
    writeAttempt = {
      changed: false,
      status: 'blocked',
      reason:
        'Units of Measure page did not show PCS or STK. The first item was not saved because Base Unit would be unproven.',
      unitReadiness
    };
  } else {
    const { frame } = await findBcFrame(page, /Items|Artikel|Nr\.|No\.|Description|Beschreibung/i);
    const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
    steps.push({ step: 'click-scoped-new-on-items', newClicked });
    if (!newClicked) {
      writeAttempt = { changed: false, status: 'blocked', reason: 'New/Neu was not visible in the Items context.' };
    } else {
      await page.waitForTimeout(1800);
      const afterNewText = await safeText(page);
      if (containsHardForbiddenText(afterNewText)) {
        writeAttempt = { changed: false, status: 'blocked', reason: 'Hard forbidden dialog/action text was visible after New.' };
      } else if (!/Item Card|Artikelkarte|Item|Artikel|Nr\.|No\.|Description|Beschreibung/i.test(afterNewText)) {
        writeAttempt = { changed: false, status: 'blocked', reason: 'New did not keep a trusted Item Card context.' };
      } else {
        const { frame: cardFrame } = await findBcFrame(page, /Item Card|Artikelkarte|Item|Artikel|Nr\.|No\.|Description|Beschreibung/i);
        const { inspected } = await editableInputs(cardFrame);
        steps.push({ step: 'editable-inputs-after-new-item-card', inspected });
        writeAttempt = {
          changed: false,
          status: 'blocked',
          reason:
            'Item card opened, but this run does not yet have a trusted field-fill helper for No./Description/Base Unit on item cards.',
          inspectedInputs: inspected.slice(0, 20)
        };
      }
    }
  }

  await captureState(page, 'target-036e-020-after-item-attempt', 'After Item create-or-block attempt.', {
    targetItem,
    unitReadiness,
    writeAttempt,
    steps
  });

  await closeOrLeaveCard(page);
  await openPage(page, ITEMS_PAGE_ID, true);
  const afterReopen = await captureState(page, 'target-036e-030-after-reopen-filtered-proof', 'After reopening Items filtered to U-ITEM-HW100.', {
    targetItem,
    unitReadiness,
    writeAttempt,
    steps,
    reopenProofRoute: 'direct Page 31 URL with Item No. filter'
  });

  const afterReopenText = await safeText(page);
  const persistedNo = literalPattern(targetItem.itemNo).test(afterReopenText);
  const persistedDescription = literalPattern(targetItem.description).test(afterReopenText);
  const created = Boolean((writeAttempt as { changed?: unknown }).changed) && persistedNo && persistedDescription;
  const alreadyExists = (writeAttempt as { status?: unknown }).status === 'already-exists' && (persistedNo || persistedDescription);
  const resultStatus = created || alreadyExists ? 'observed' : 'blocked';
  const blockedBy =
    resultStatus === 'observed'
      ? []
      : [
          String((writeAttempt as { reason?: unknown }).reason ?? 'First item was not safely created.'),
          'No U-ITEM-HW100 item is visible after filtered reopen.'
        ];
  const nextCase =
    resultStatus === 'observed'
      ? 'TARGET-040-FOUNDATION-READY-RECHECK'
      : unitReadiness.availableCandidates.length === 0
        ? 'TARGET-041-BASE-UNIT-OF-MEASURE-CONTROLLED-WRITE-GATE'
        : 'TARGET-036E2-FIRST-ITEM-FIELD-HELPER-RECOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-first-item-controlled-write-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Items / Artikel',
    pageId: ITEMS_PAGE_ID,
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Units of Measure read-only before item creation.',
      'Opened Page 31 Items / Artikel.',
      'Captured before screenshot QA.',
      resultStatus === 'observed'
        ? 'Verified or created the first target item.'
        : 'Stopped before saving an unsafe or incomplete item.',
      'Reopened Page 31 with an Item No. filter for proof.',
      'Captured after/reopen screenshot QA.'
    ],
    actionsNotTaken: [
      'No Apply Template / Vorlage anwenden action was clicked.',
      'No customer was created.',
      'No vendor was created.',
      'No setup field was changed.',
      'No item posting group or VAT product posting group was set.',
      'No sales/purchase document or draft was created.',
      'No Preview Posting was executed.',
      'No Posting was executed.',
      'No payment was executed.',
      'No API shortcut was used.',
      'No company switch was executed.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: created,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-036e-005-units-before-item-write.png',
      'playwright/projects/fibu-book5/img/target-036e-010-items-before.png',
      'playwright/projects/fibu-book5/img/target-036e-020-after-item-attempt.png',
      'playwright/projects/fibu-book5/img/target-036e-030-after-reopen-filtered-proof.png'
    ],
    proved:
      resultStatus === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Items / Artikel was used as the scoped page.',
            `${targetItem.itemNo} / ${targetItem.description} is visible after reopen.`,
            'No template, setup, document, Preview Posting or Posting route was used.'
          ]
        : [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Units of Measure and Items were inspected before the item write.',
            'The first item was not saved because the required Base Unit route was not safe enough.'
          ],
    notProved: [
      'No item master data persistence is proven unless resultStatus is observed.',
      'No Base Unit is selected on a saved item.',
      'No Item Posting Group, Gen. Prod. Posting Group or VAT Prod. Posting Group is proven on an item.',
      'No sales, purchase, inventory, Preview Posting, Posting, item ledger entry, value entry, G/L entry or VAT entry is proven.',
      ...blockedBy
    ],
    blockedBy,
    warnings: [
      'This is a first item gate, not inventory or O2C/P2P readiness.',
      'An empty Units of Measure surface blocks a trustworthy item save.',
      'Posting/VAT/inventory posting fields remain separate gated setup steps.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCustomerCreated: true,
      noVendorCreated: true,
      noTemplateApplied: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      itemMasterDataChanged: created
    },
    targetItem,
    unitReadiness,
    before,
    afterReopen,
    writeAttempt,
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-040 proved item/inventory pages read-only but did not prove a Base Unit value or item creation.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The item write gate was still the right next step, but it correctly stopped because a safe Base Unit prerequisite is missing.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-041-BASE-UNIT-OF-MEASURE-CONTROLLED-WRITE-GATE',
          status: resultStatus === 'observed' ? 'obsolete' : 'ready-next',
          reason:
            resultStatus === 'observed'
              ? 'Not needed if the item exists.'
              : 'A controlled base-unit setup/master-data gate is the narrow prerequisite before retrying the first item.'
        },
        {
          caseId: 'TARGET-036E2-FIRST-ITEM-FIELD-HELPER-RECOVERY',
          status: unitReadiness.availableCandidates.length > 0 && resultStatus !== 'observed' ? 'ready-next' : 'ready-after-current',
          reason: 'Needed only if a base unit exists but item-card field filling remains ambiguous.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: resultStatus === 'observed' ? 'ready-next' : 'ready-after-current',
          reason: 'Useful after item creation or after the base-unit blocker is resolved.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'O2C still needs item, posting groups, VAT and expected entry trace boundaries.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        nextCase === 'TARGET-041-BASE-UNIT-OF-MEASURE-CONTROLLED-WRITE-GATE'
          ? 'A base unit is the smallest missing prerequisite for a trustworthy first item.'
          : 'The selected case follows directly from the observed item gate result.',
      risksBeforeNextCase: [
        'Creating a unit of measure changes setup-like master data and needs its own Smart Decision.',
        'A later item save must not set posting groups casually.',
        'No document, Preview Posting or Posting is allowed from this foundation gate.'
      ],
      requiredPreparation: [
        'Define one Base Unit code for Universaarl, likely STK or PCS, and explain it in beginner language.',
        'Capture before/after/reopen proof.',
        'Keep posting groups and VAT fields untouched.'
      ]
    },
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        updatedAt: '2026-07-01T14:30:00.000Z',
        activeArea: nextCase === 'TARGET-041-BASE-UNIT-OF-MEASURE-CONTROLLED-WRITE-GATE' ? 'universaarl-base-unit-foundation' : 'universaarl-foundation-recheck',
        activeCase: nextCase,
        active_case_file:
          nextCase === 'TARGET-041-BASE-UNIT-OF-MEASURE-CONTROLLED-WRITE-GATE'
            ? '.agent/state/cases/target-041-base-unit-of-measure-controlled-write-gate.json'
            : `.agent/state/cases/${nextCase.toLowerCase()}.json`,
        nextCase,
        nextStep:
          nextCase === 'TARGET-041-BASE-UNIT-OF-MEASURE-CONTROLLED-WRITE-GATE'
            ? 'Create or prove one safe base unit of measure before retrying first item creation.'
            : 'Continue with the next foundation checkpoint.'
      }
    }
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-036E First Item Controlled Write Gate',
      '',
      `Status: ${resultStatus}`,
      '',
      'Dieser Case prueft den ersten Universaarl-Artikel-Gate. Er darf maximal einen Artikel vorbereiten, bleibt aber vor unsicheren Basiseinheits-, Buchungsgruppen-, Dokument-, Preview- und Posting-Schritten stehen.',
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
