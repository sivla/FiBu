import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(240_000);

const CASE_ID = 'TARGET-052-ITEM-POSTING-FIELDS-FOUNDATION-CHECKPOINT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-052-item-posting-fields-foundation-checkpoint';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-052-result.json');
const ITEM_CARD_PAGE_ID = 30;

const targetItem = {
  no: 'U-ITEM-HW100',
  name: 'Universaarl Hardware 100',
  baseUnit: 'STK',
  itemPostingGroup: 'WARE'
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId|requestExecutor/i.test(line))
    .join('\n')
    .trim();
}

function buildItemCardUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(ITEM_CARD_PAGE_ID));
  url.searchParams.set('filter', `Item.'No.' IS '${targetItem.no}'`);
  return url.toString();
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
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function containsDangerousText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Ship|Invoice|Payment|Delete\?|Loeschen\?|Buchen|Vorlage anwenden|Apply Template/i.test(
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

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (containsDangerousText(text) || /\b(OK|Yes|Ja|Finish|Delete|Post|Buchen)\b/i.test(text)) dialogs.push(text);
    }
  }
  return dialogs;
}

async function assertTargetContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `Wrong instance URL: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `Wrong company URL: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    pageId: ITEM_CARD_PAGE_ID,
    page: 'Artikelkarte / Item Card',
    ...metadata
  });
}

async function clickVisiblePattern(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name: pattern });
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const action = locator.nth(index);
        if (!(await action.isVisible({ timeout: 400 }).catch(() => false))) continue;
        await action.hover({ timeout: 1200 }).catch(() => undefined);
        await page.waitForTimeout(150);
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(800);
        return true;
      }
    }
  }
  return false;
}

async function fieldSignals(page: Page) {
  const text = clean(await pageText(page));
  return {
    productPostingGroupTerm: /Produktbuchungsgruppe|Gen\. Prod\. Posting Group/i.test(text),
    vatProductPostingGroupTerm: /MwSt.-Produktbuchungsgruppe|VAT Prod\. Posting Group/i.test(text),
    costingFifo: /Lagerabgangsmethode[\s\S]{0,120}\bFIFO\b|FIFO[\s\S]{0,120}Lagerabgangsmethode/i.test(text)
  };
}

async function clickFastTabText(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.getByText(pattern).first();
    if (!(await locator.isVisible({ timeout: 700 }).catch(() => false))) continue;
    await locator.hover({ timeout: 1200 }).catch(() => undefined);
    await page.waitForTimeout(150);
    await locator.click({ timeout: 5000 }).catch(async () => locator.click({ timeout: 5000, force: true }));
    await page.waitForTimeout(900);
    return true;
  }
  return false;
}

async function openItemCard(page: Page) {
  await page.goto(buildItemCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await expect
    .poll(async () => clean(await pageText(page)), { timeout: 45_000, intervals: [1000, 1500, 2500] })
    .toMatch(/U-ITEM-HW100|Universaarl Hardware 100|STK|WARE/i);
  await assertTargetContext(page);
}

async function revealReadOnlyPostingFieldArea(page: Page) {
  const clicks: string[] = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const clicked = await clickVisiblePattern(page, /Mehr anzeigen|Show more/i);
    if (!clicked) break;
    clicks.push(`show-more-${attempt}`);
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const signals = await fieldSignals(page);
    if (signals.productPostingGroupTerm && signals.vatProductPostingGroupTerm && signals.costingFifo) break;
    const clicked =
      (await clickFastTabText(page, /Einstandspreise und Buchung|Costs and Posting/i)) ||
      (await clickVisiblePattern(page, /Einstandspreise und Buchung|Costs and Posting/i));
    if (!clicked) break;
    clicks.push(`open-costs-and-posting-${attempt}`);
    await assertTargetContext(page);
  }
  return clicks;
}

async function extractFieldHints(page: Page) {
  const terms = [
    'Basiseinheit',
    'Lagerbuchungsgruppe',
    'Produktbuchungsgruppe',
    'MwSt.-Produktbuchungsgruppe',
    'Lagerabgangsmethode',
    'FIFO',
    'WARE',
    'STK'
  ];
  const text = clean(
    await compactPageText(page, {
      include: [
        /Artikelkarte|Item Card|U-ITEM-HW100|Universaarl Hardware 100|STK|WARE|Basiseinheit|Lagerbuchungsgruppe|Item Posting Group|Produktbuchungsgruppe|Gen\. Prod\. Posting Group|MwSt.-Produktbuchungsgruppe|VAT Prod\. Posting Group|Lagerabgangsmethode|Costing Method|FIFO|Einstandspreise|Buchung|Lager|Inventory/i
      ],
      maxLines: 260,
      maxLineLength: 280
    })
  );
  const fullText = text || clean(await pageText(page));
  const visibleTerms = terms.filter((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(fullText));
  const missingTerms = terms.filter((term) => !visibleTerms.includes(term));
  const fieldWindow = fullText
    .split(/\n/)
    .filter((line) => /U-ITEM-HW100|STK|WARE|Produktbuchungsgruppe|MwSt.-Produktbuchungsgruppe|Lagerbuchungsgruppe|Lagerabgangsmethode|FIFO/i.test(line))
    .slice(0, 80);
  return {
    text: fullText,
    visibleTerms,
    missingTerms,
    fieldWindow,
    visible: {
      itemCardContext: /Artikelkarte|Item Card/i.test(fullText),
      targetItemNo: /U-ITEM-HW100/i.test(fullText),
      targetItemName: /Universaarl Hardware 100/i.test(fullText),
      baseUnitStk: /\bSTK\b/i.test(fullText),
      itemPostingGroupWare: /\bWARE\b/i.test(fullText),
      productPostingGroupTerm: /Produktbuchungsgruppe|Gen\. Prod\. Posting Group/i.test(fullText),
      vatProductPostingGroupTerm: /MwSt.-Produktbuchungsgruppe|VAT Prod\. Posting Group/i.test(fullText),
      costingFifo: /Lagerabgangsmethode[\s\S]{0,80}\bFIFO\b|FIFO[\s\S]{0,80}Lagerabgangsmethode/i.test(fullText),
      forbiddenSignals: containsDangerousText(fullText)
    }
  };
}

async function captureCheckpoint(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const hints = await extractFieldHints(page);
  const snapshot = {
    step,
    targetItem,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    ...hints,
    ...extra
  };
  await writeText(`${prefix}.txt`, hints.text || 'No compact text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    step,
    targetItem,
    importantUi: [
      'Artikelkarte',
      'Einstandspreise und Buchung',
      'Basiseinheit STK',
      'Lagerbuchungsgruppe WARE',
      'Produktbuchungsgruppe',
      'MwSt.-Produktbuchungsgruppe',
      'Lagerabgangsmethode FIFO'
    ],
    beginnerLearning: [
      'Die Artikelkarte sammelt Stammdaten und Buchungsfelder fuer einen Artikel.',
      'WARE verbindet den Artikel mit der Lagerbuchungseinrichtung.',
      'Produktbuchungsgruppe und MwSt.-Produktbuchungsgruppe sind eigene Felder und duerfen nicht aus WARE abgeleitet werden.'
    ],
    internallyProves: 'Read-only checkpoint of current U-ITEM-HW100 item card field visibility after TARGET-051.',
    doesNotProve: [
      'No Product Posting Group value is proven.',
      'No VAT Product Posting Group value is proven.',
      'No General Posting Setup readiness is proven.',
      'No VAT Posting Setup readiness is proven.',
      'No document, Preview Posting, Posting or ledger entry is proven.'
    ],
    screenshotQaRule: 'The screenshot must show the item context and visible field signals, not a menu or unrelated setup page.',
    finalScreenshotStatus: 'universaarl-foundation-evidence',
    ...extra
  });
  return snapshot;
}

function buildResult(checkpoint: any, clicks: string[]) {
  const observed =
    checkpoint.visible.targetItemNo &&
    checkpoint.visible.baseUnitStk &&
    checkpoint.visible.itemPostingGroupWare &&
    checkpoint.visible.productPostingGroupTerm &&
    checkpoint.visible.vatProductPostingGroupTerm;
  const nextCase = observed
    ? 'TARGET-053-ITEM-PRODUCT-VAT-POSTING-FIELDS-SOURCE-DECISION'
    : 'TARGET-052B-ITEM-POSTING-FIELDS-CHECKPOINT-RECOVERY';
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-027D4-VAT-MATRIX-FIELD-CONTROL-MAPPING',
    lastEvidenceSummary:
      'TARGET-051 proved WARE on U-ITEM-HW100 after reopen. TARGET-052 checked the current item card without writes.',
    isPlannedNextCaseStillSensible: false,
    reason: observed
      ? 'VAT matrix work is still too broad. The next useful step is a source decision for the item Product Posting Group and VAT Product Posting Group target values before any write.'
      : 'The item card checkpoint did not show enough field context to move to VAT, General Posting Setup or documents.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: observed ? 'ready-next' : 'needs-ui-discovery-first',
        reason: observed
          ? 'The exact remaining item fields are visible, but values must be source-backed before a write.'
          : 'The card field context needs recovery before source or write decisions.'
      },
      {
        caseId: 'TARGET-027D4-VAT-MATRIX-FIELD-CONTROL-MAPPING',
        status: 'ready-after-current',
        reason: 'VAT Posting Setup remains relevant, but item VAT product value should be decided first.'
      },
      {
        caseId: 'TARGET-032D-GENERAL-POSTING-SETUP-MATRIX-WRITE-GATE',
        status: 'needs-setup-first',
        reason: 'General Posting Setup should follow source-backed business/product group values.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C needs item/customer posting fields plus VAT and general posting setup readiness.'
      },
      {
        caseId: 'TARGET-036D2G-U-VEND-MANUAL-NOS-SOURCE-OR-ASSISTED-ROUTE-DECISION',
        status: 'blocked',
        reason: 'Vendor manual number-series checkbox remains parked and unrelated to this item foundation lane.'
      }
    ],
    queueChangesMade: [`Selected ${nextCase} after TARGET-052 checkpoint.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: observed
      ? 'It resolves the next narrow item-card dependency without jumping to VAT setup, documents or posting.'
      : 'It recovers the exact visible field context before any setup or master-data write.',
    risksBeforeNextCase: [
      'Do not claim item posting readiness from WARE alone.',
      'Do not set Product Posting Group or VAT Product Posting Group without a source-backed target value.',
      'Keep Preview Posting and Posting false.'
    ],
    requiredPreparation: observed
      ? ['Use Microsoft Learn and existing Universaarl setup evidence to choose source-backed product/VAT product target values.']
      : ['Run read-only UI recovery with FastTabs, layout and Page Inspection before any write.']
  };

  return {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-foundation-checkpoint',
    resultStatus: observed ? 'observed' : 'blocked',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: {
      pageId: ITEM_CARD_PAGE_ID,
      name: 'Artikelkarte / Item Card',
      url: checkpoint.url
    },
    targetItem,
    actionsTaken: [
      'Opened Page 30 Artikelkarte / Item Card directly for U-ITEM-HW100.',
      'Confirmed playthru / UNIVERSAARL-DE from URL context.',
      'Expanded safe read-only card areas and captured field visibility.',
      'Captured screenshot QA and compact text evidence.',
      'Classified completed and remaining item posting-field dependencies.'
    ],
    actionsNotTaken: [
      'No item was created.',
      'No item field was changed.',
      'No Item Posting Group was changed.',
      'No Gen. Prod. Posting Group was changed.',
      'No VAT Prod. Posting Group was changed.',
      'No Costing Method was changed.',
      'No Inventory Posting Setup was changed.',
      'No VAT Posting Setup was changed.',
      'No General Posting Setup was changed.',
      'No document or draft was created.',
      'No Preview Posting was run.',
      'No Posting was run.',
      'No payment was run.',
      'No API shortcut was used.',
      'No company switch was executed.'
    ],
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: ['playwright/projects/fibu-book5/img/target-052-010-item-posting-fields-checkpoint.png'],
    fieldCheckpoint: {
      visibleTerms: checkpoint.visibleTerms,
      missingTerms: checkpoint.missingTerms,
      visible: checkpoint.visible,
      fieldWindow: checkpoint.fieldWindow
    },
    proved: observed
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'U-ITEM-HW100 item card was visible read-only.',
          'Base Unit STK and Item Posting Group WARE are visible on the item card checkpoint.',
          'Product Posting Group and VAT Product Posting Group field terms are visible as open dependencies.',
          'No item, setup, document, Preview Posting, Posting, payment or API shortcut occurred.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'U-ITEM-HW100 item card was opened read-only.',
          'No item, setup, document, Preview Posting, Posting, payment or API shortcut occurred.'
        ],
    notProved: [
      'No Product Posting Group value is proven or assigned.',
      'No VAT Product Posting Group value is proven or assigned.',
      'No General Posting Setup readiness is proven.',
      'No VAT Posting Setup readiness is proven.',
      'No O2C, P2P, document, Preview Posting, Posting, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.',
      'WARE on the item card is only a foundation signal, not posting readiness.'
    ],
    blockedBy: observed ? [] : ['Not all required item card field signals were visible in the checkpoint screenshot/text.'],
    warnings: [
      'The next step must be a source decision for remaining item product/VAT product fields, not a blind write.',
      'VAT and General Posting Setup remain separate gated lanes.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true
    },
    steps: [
      {
        step: 'smart-decision',
        whyNow:
          'TARGET-051 changed and proved WARE on U-ITEM-HW100; before continuing to VAT/General Posting/Document work, the remaining item-card dependencies must be classified read-only.',
        fieldsToChangeOnlyIfClear: [],
        fieldsNotToTouch: [
          'Item Posting Group / Lagerbuchungsgruppe',
          'Gen. Prod. Posting Group / Produktbuchungsgruppe',
          'VAT Prod. Posting Group / MwSt.-Produktbuchungsgruppe',
          'Costing Method / Lagerabgangsmethode',
          'Inventory Posting Setup',
          'VAT Posting Setup',
          'General Posting Setup'
        ],
        risk: 'Moving directly to VAT, General Posting Setup or O2C would hide remaining item-card gaps.',
        fallback: 'If read-only checkpoint is incomplete, create TARGET-052B UI recovery instead of writing any field.'
      },
      {
        step: 'read-only-reveal',
        clicks
      }
    ],
    snapshot: checkpoint,
    nextStepDecision,
    nextCase,
    statePatch: observed
      ? {
          current: {
            activeArea: 'universaarl-item-product-vat-posting-fields-source-decision',
            activeCase: nextCase,
            active_case_file: '.agent/state/cases/target-053-item-product-vat-posting-fields-source-decision.json',
            nextCase,
            nextStep:
              'Run TARGET-053 as a source-backed decision for U-ITEM-HW100 Product Posting Group and VAT Product Posting Group target values before any write.'
          },
          activeCase: {
            status: 'done',
            resultPath: 'playwright/projects/fibu-book5/evidence/target-052-item-posting-fields-foundation-checkpoint/TARGET-052-result.json',
            nextCase
          }
        }
      : {},
    requiresReview: !observed,
    safeToFinalizeState: observed,
    reason: observed
      ? 'TARGET-052 checkpoint proved the current item-card foundation signal and remaining item posting-field gaps without writes.'
      : 'TARGET-052 opened the card but did not prove all expected field signals.',
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:item-posting-fields-foundation-checkpoint',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/target-052-item-posting-fields-foundation-checkpoint/TARGET-052-result.json',
      'npm run check:encoding',
      'git diff --check'
    ]
  };
}

function readme(result: any) {
  return [
    '# TARGET-052 Item Posting Fields Foundation Checkpoint',
    '',
    `Status: ${result.resultStatus}`,
    '',
    'Ziel: Artikelkarte `U-ITEM-HW100` in `playthru / UNIVERSAARL-DE` nur lesend pruefen und die naechsten offenen Buchungsfeld-Abhaengigkeiten klar abgrenzen.',
    '',
    '## Sichtbar / bewiesen',
    '',
    ...result.proved.map((line: string) => `- ${line}`),
    '',
    '## Nicht bewiesen',
    '',
    ...result.notProved.map((line: string) => `- ${line}`),
    '',
    '## Nicht gemacht',
    '',
    ...result.actionsNotTaken.map((line: string) => `- ${line}`),
    '',
    `Naechster Case: ${result.nextCase}`,
    ''
  ].join('\n');
}

test('TARGET-052 reads U-ITEM-HW100 posting fields without changing data', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await openItemCard(page);
  const clicks = await revealReadOnlyPostingFieldArea(page);
  const checkpoint = await captureCheckpoint(page, 'target-052-010-item-posting-fields-checkpoint', 'read-only-checkpoint', {
    clicks
  });
  const result = buildResult(checkpoint, clicks);

  await writeJson(RESULT_PATH, result);
  await writeText('README.md', readme(result));

  expect(result.resultStatus, result.blockedBy.join('\n')).toBe('observed');
  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
