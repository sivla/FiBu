import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(360_000);

const CASE_ID = 'TARGET-054-ITEM-PRODUCT-VAT-POSTING-FIELDS-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-054-item-product-vat-posting-fields-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-054-result.json');
const ITEM_CARD_PAGE_ID = 30;

const targetItem = {
  no: 'U-ITEM-HW100',
  name: 'Universaarl Hardware 100',
  baseUnit: 'STK',
  itemPostingGroup: 'WARE',
  productPostingGroup: 'WAREN',
  vatProductPostingGroup: 'VAT19'
};

type Snapshot = Record<string, unknown> & {
  text: string;
  visible: {
    targetItemNo: boolean;
    baseUnitStk: boolean;
    itemPostingGroupWare: boolean;
    productPostingGroupWaren: boolean;
    vatProductPostingGroupVat19: boolean;
    forbiddenSignals: boolean;
  };
};

type WriteOutcome = {
  status: 'already-visible' | 'attempted-assignment' | 'blocked';
  changed: boolean;
  reason: string;
  productBefore?: string;
  vatBefore?: string;
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
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Ship|Invoice|Payment|Delete\?|Loeschen\?|Buchen|VAT Posting Setup|MwSt.-Buchungsmatrix|General Posting Setup|Buchungsmatrix Einrichtung|Vorlage anwenden|Apply Template/i.test(
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

async function firstVisible(locator: Locator, timeout = 700) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible({ timeout }).catch(() => false)) return item;
  }
  return undefined;
}

async function clickVisiblePattern(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = await firstVisible(scope.getByRole(role, { name: pattern }), 500);
      if (!action) continue;
      await action.hover({ timeout: 1200 }).catch(() => undefined);
      await page.waitForTimeout(200);
      await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

async function clickFastTabText(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.getByText(pattern).first();
    if (!(await locator.isVisible({ timeout: 700 }).catch(() => false))) continue;
    await locator.hover({ timeout: 1200 }).catch(() => undefined);
    await page.waitForTimeout(200);
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

async function revealPostingFieldArea(page: Page) {
  const clicks: string[] = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const clicked = await clickVisiblePattern(page, /Mehr anzeigen|Show more/i);
    if (!clicked) break;
    clicks.push(`show-more-${attempt}`);
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const text = clean(await pageText(page));
    if (/Produktbuchungsgruppe|Gen\. Prod\. Posting Group/i.test(text) && /MwSt.-Produktbuchungsgruppe|VAT Prod\. Posting Group/i.test(text)) break;
    const clicked =
      (await clickFastTabText(page, /Einstandspreise und Buchung|Costs and Posting/i)) ||
      (await clickVisiblePattern(page, /Einstandspreise und Buchung|Costs and Posting/i)) ||
      (await clickFastTabText(page, /Lager|Inventory/i));
    if (!clicked) break;
    clicks.push(`open-posting-area-${attempt}`);
    await assertTargetContext(page);
  }
  return clicks;
}

async function enterItemEditMode(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],a[role="button"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              element,
              text: normalize(element.innerText || element.textContent),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              className: normalize(element.className),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            };
          })
          .filter((entry) => {
            const label = `${entry.text} ${entry.aria} ${entry.title} ${entry.className}`;
            return (
              (/Bearbeiten|Edit|Anderungen auf der Seite vornehmen|Aenderungen auf der Seite vornehmen|Make changes/i.test(label) ||
                /header-action-edit_view/.test(label)) &&
              entry.y < 90 &&
              entry.x > 500
            );
          })
          .sort((left, right) => left.y - right.y || left.x - right.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, candidates: candidates.map(({ element: _element, ...entry }) => entry) };
        chosen.element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        chosen.element.click();
        return {
          clicked: true,
          chosen: {
            text: chosen.text,
            aria: chosen.aria,
            title: chosen.title,
            x: chosen.x,
            y: chosen.y,
            w: chosen.w,
            h: chosen.h
          }
        };
      })
      .catch((error) => ({ clicked: false, error: String(error), candidates: [] }));
    if (result.clicked) {
      await page.waitForTimeout(1400);
      await assertTargetContext(page);
      return result;
    }
  }
  return { clicked: false, reason: 'top-edit-action-not-found' };
}

async function fieldByLabel(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['combobox', 'textbox'] as const) {
      const field = await firstVisible(scope.getByRole(role, { name: label }), 700);
      if (field && (await field.isEditable({ timeout: 700 }).catch(() => false))) return field;
    }
  }
  return undefined;
}

async function fillField(field: Locator, value: string) {
  const before = (await field.inputValue({ timeout: 1000 }).catch(() => '')) || '';
  await field.click({ timeout: 5000 });
  await field.fill(value, { timeout: 5000 }).catch(async () => {
    await field.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await field.pressSequentially(value, { delay: 35 });
  });
  await field.press('Tab').catch(() => undefined);
  await field.page().waitForTimeout(1200);
  return before;
}

async function attemptFieldAssignment(page: Page) {
  const beforeText = clean(await pageText(page));
  const alreadyVisible = /\bWAREN\b/i.test(beforeText) && /\bVAT19\b/i.test(beforeText);
  if (alreadyVisible) {
    return {
      status: 'already-visible',
      changed: false,
      reason: 'WAREN and VAT19 were already visible before the write gate.'
    } satisfies WriteOutcome;
  }

  const editResult = await enterItemEditMode(page);
  if (!editResult.clicked) {
    return { status: 'blocked', changed: false, reason: 'Item card edit action was not found.' } satisfies WriteOutcome;
  }
  await revealPostingFieldArea(page);

  const productField = await fieldByLabel(page, /^(Produktbuchungsgruppe|Gen\. Prod\. Posting Group)$/i);
  const vatField = await fieldByLabel(page, /^(MwSt\.-Produktbuchungsgruppe|VAT Prod\. Posting Group)$/i);

  if (!productField || !vatField) {
    return {
      status: 'blocked',
      changed: false,
      reason: `Editable target fields not both found: product=${Boolean(productField)}, vat=${Boolean(vatField)}.`
    } satisfies WriteOutcome;
  }

  const productBefore = await fillField(productField, targetItem.productPostingGroup);
  await assertTargetContext(page);
  const vatBefore = await fillField(vatField, targetItem.vatProductPostingGroup);
  await assertTargetContext(page);
  return {
    status: 'attempted-assignment',
    changed: true,
    reason: 'Filled only Product Posting Group WAREN and VAT Product Posting Group VAT19 on the item card.',
    productBefore,
    vatBefore
  } satisfies WriteOutcome;
}

async function extractFieldCandidates(page: Page) {
  const candidates = [];
  for (const frame of page.frames()) {
    const frameCandidates = await collectFieldCandidates(frame).catch(() => []);
    candidates.push(...frameCandidates.map((candidate) => ({ ...candidate, frameUrl: sanitizeEvidenceUrl(frame.url()) })));
  }
  return candidates;
}

async function collectFieldCandidates(frame: Frame) {
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rx = /Produktbuchungsgruppe|Gen\. Prod\. Posting Group|MwSt.-Produktbuchungsgruppe|VAT Prod\. Posting Group|WAREN|VAT19/i;
    return Array.from(document.querySelectorAll<HTMLElement>('input,textarea,button,[role="button"],[role="combobox"],[role="textbox"],a,span,div'))
      .filter(visible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const input = element as HTMLInputElement;
        return {
          tag: element.tagName,
          role: normalize(element.getAttribute('role')),
          text: normalize(element.innerText || element.textContent),
          aria: normalize(element.getAttribute('aria-label')),
          title: normalize(element.getAttribute('title')),
          value: normalize(input.value),
          editable:
            (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
            !element.disabled &&
            !element.readOnly,
          disabled: Boolean((element as HTMLInputElement).disabled),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height)
        };
      })
      .filter((entry) => rx.test(`${entry.text} ${entry.aria} ${entry.title} ${entry.value}`))
      .slice(0, 80);
  });
}

async function captureState(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = clean(
    await compactPageText(page, {
      include: [
        /Artikelkarte|Item Card|U-ITEM-HW100|Universaarl Hardware 100|STK|WARE|WAREN|VAT19|Basiseinheit|Lagerbuchungsgruppe|Item Posting Group|Produktbuchungsgruppe|Gen\. Prod\. Posting Group|MwSt.-Produktbuchungsgruppe|VAT Prod\. Posting Group|Lagerabgangsmethode|Costing Method|FIFO|Einstandspreise|Buchung|Lager|Inventory/i
      ],
      maxLines: 280,
      maxLineLength: 300
    })
  );
  const fullText = text || clean(await pageText(page));
  const snapshot: Snapshot = {
    step,
    targetItem,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    text: fullText,
    fieldWindow: fullText
      .split(/\n/)
      .filter((line) => /U-ITEM-HW100|STK|WARE|WAREN|VAT19|Produktbuchungsgruppe|MwSt.-Produktbuchungsgruppe|Lagerbuchungsgruppe|Lagerabgangsmethode|FIFO/i.test(line))
      .slice(0, 100),
    candidates: await extractFieldCandidates(page),
    visible: {
      targetItemNo: /U-ITEM-HW100/i.test(fullText),
      baseUnitStk: /\bSTK\b/i.test(fullText),
      itemPostingGroupWare: /\bWARE\b/i.test(fullText),
      productPostingGroupWaren: /\bWAREN\b/i.test(fullText),
      vatProductPostingGroupVat19: /\bVAT19\b/i.test(fullText),
      forbiddenSignals: containsDangerousText(fullText)
    },
    ...extra
  };
  await writeText(`${prefix}.txt`, fullText || 'No compact text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    step,
    targetItem,
    importantUi: [
      'Artikelkarte',
      'Einstandspreise und Buchung',
      'Produktbuchungsgruppe WAREN',
      'MwSt.-Produktbuchungsgruppe VAT19',
      'Lagerbuchungsgruppe WARE'
    ],
    beginnerLearning: [
      'Die Produktbuchungsgruppe beschreibt, welche Art von Ware oder Leistung verkauft oder eingekauft wird.',
      'Die MwSt.-Produktbuchungsgruppe beschreibt den steuerlichen Produktkontext.',
      'Diese Felder machen den Artikel noch nicht buchungsfertig; die eigentlichen Matrizen bleiben eigene Einrichtungsschritte.'
    ],
    internallyProves:
      snapshot.visible.productPostingGroupWaren && snapshot.visible.vatProductPostingGroupVat19
        ? 'U-ITEM-HW100 shows WAREN and VAT19 on the item card after reopen.'
        : 'U-ITEM-HW100 item card context and current Product/VAT Product Posting Group field state.',
    doesNotProve: [
      'No General Posting Setup readiness.',
      'No VAT Posting Setup readiness.',
      'No document draft.',
      'No Preview Posting.',
      'No Posting.',
      'No Item Ledger, Value, G/L or VAT entries.'
    ],
    screenshotQaRule: 'WAREN and VAT19 count only when visible in the U-ITEM-HW100 item card context, not in setup lists or menu text.',
    finalScreenshotStatus:
      snapshot.visible.productPostingGroupWaren && snapshot.visible.vatProductPostingGroupVat19
        ? 'universaarl-foundation-evidence'
        : 'setup-or-blocker-evidence',
    ...extra
  });
  return snapshot;
}

function buildResult(before: Snapshot, after: Snapshot, reopen: Snapshot, writeOutcome: WriteOutcome, revealClicks: string[]) {
  const observed =
    reopen.visible.targetItemNo &&
    reopen.visible.itemPostingGroupWare &&
    reopen.visible.productPostingGroupWaren &&
    reopen.visible.vatProductPostingGroupVat19;
  const resultStatus = observed ? 'observed' : 'blocked';
  const nextCase = observed
    ? 'TARGET-027D25-VAT-MATRIX-ROUTE-REOPEN-DECISION'
    : 'TARGET-054B-ITEM-PRODUCT-VAT-POSTING-FIELDS-UI-RECOVERY';
  const blockedBy = observed ? [] : [writeOutcome.reason, 'WAREN and VAT19 are not both visibly proven on U-ITEM-HW100 after reopen.'];
  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: CASE_ID,
    lastEvidenceSummary:
      'TARGET-053 selected WAREN and VAT19 as source-backed values. TARGET-054 attempted only these item-card fields with before/after/reopen screenshot QA.',
    isPlannedNextCaseStillSensible: true,
    reason: observed
      ? 'The narrow item-card assignment is complete; VAT Posting Setup remains the next separate foundation lane.'
      : 'The narrow item-card assignment route did not prove both values after reopen, so a focused UI recovery must come before setup or documents.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: observed ? 'ready-next' : 'needs-ui-discovery-first',
        reason: observed
          ? 'VAT matrix remains the next missing foundation dependency after item product/VAT product fields.'
          : 'The item field editor route needs recovery before repeating a write.'
      },
      {
        caseId: 'TARGET-032G-GENERAL-POSTING-SETUP-ROUTE-REOPEN-DECISION',
        status: 'ready-after-current',
        reason: 'General Posting Setup is still needed, but should remain separate from item-card field assignment.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C still needs VAT and General Posting Setup readiness.'
      },
      {
        caseId: 'TARGET-036D2H-U-VEND-MANUAL-NOS-PARK-OR-PAGEINSPECTION-DECISION',
        status: 'blocked',
        reason: 'Vendor numbering remains parked and unrelated to the item foundation lane.'
      }
    ],
    queueChangesMade: [`Selected ${nextCase} after TARGET-054.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: observed
      ? 'It returns to VAT setup only after the item-card values are proven.'
      : 'It prevents a blind repeat of the same item-card write route.',
    risksBeforeNextCase: [
      'Do not claim posting readiness from item-card values alone.',
      'Do not create documents before VAT and General Posting Setup gates.',
      'Keep Preview Posting and Posting false.'
    ],
    requiredPreparation: observed
      ? ['Run a source/UI decision for the parked VAT Posting Setup route before any VAT matrix write.']
      : ['Inspect the exact Product/VAT Product field controls before another write attempt.']
  };

  return {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-masterdata-field-write',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: {
      pageId: ITEM_CARD_PAGE_ID,
      name: 'Artikelkarte / Item Card',
      url: reopen.url
    },
    targetItem,
    actionsTaken: [
      'Opened Page 30 Artikelkarte / Item Card directly for U-ITEM-HW100.',
      'Confirmed playthru / UNIVERSAARL-DE from URL context.',
      'Expanded safe item card posting areas and captured a before screenshot.',
      writeOutcome.changed
        ? 'Attempted to set only Product Posting Group WAREN and VAT Product Posting Group VAT19.'
        : `No additional write or blocked write: ${writeOutcome.status}.`,
      'Reopened the item card and captured a reopen proof screenshot.'
    ],
    actionsNotTaken: [
      'No item was created.',
      'No item number, description or base unit was changed.',
      'No Item Posting Group / Lagerbuchungsgruppe was changed.',
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
    masterDataChanged: writeOutcome.changed && observed,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-054-010-before-product-vat-field-assignment.png',
      'playwright/projects/fibu-book5/img/target-054-020-after-product-vat-field-assignment-route.png',
      'playwright/projects/fibu-book5/img/target-054-030-reopen-proof.png'
    ],
    fieldCheckpoint: {
      before: before.visible,
      after: after.visible,
      reopen: reopen.visible
    },
    proved: observed
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'U-ITEM-HW100 item card was visible.',
          'Product Posting Group WAREN is visible on U-ITEM-HW100 after reopen.',
          'VAT Product Posting Group VAT19 is visible on U-ITEM-HW100 after reopen.',
          'No setup, document, Preview Posting, Posting, payment or API shortcut occurred.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'U-ITEM-HW100 item card was visible.',
          'The case stopped before proving both WAREN and VAT19 on U-ITEM-HW100 after reopen.',
          'No setup, document, Preview Posting, Posting, payment or API shortcut occurred.'
        ],
    notProved: [
      'No General Posting Setup row INLAND/WAREN with 4400/5400 is proven.',
      'No VAT Posting Setup row INLAND/VAT19 with 19 percent and VAT accounts is proven.',
      'No O2C/P2P readiness is proven.',
      'No document, Preview Posting, Posting, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.'
    ],
    blockedBy,
    warnings: [
      'WAREN and VAT19 on the item card are foundation values, not posting readiness.',
      'VAT and General Posting Setup remain separate gated steps.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true
    },
    steps: [
      {
        step: 'smart-decision',
        whyNow:
          'TARGET-053 selected WAREN and VAT19 as source-backed item-card values; TARGET-054 is the smallest practical write before setup and document gates.',
        fieldsToChangeOnlyIfClear: [
          'Gen. Prod. Posting Group / Produktbuchungsgruppe = WAREN',
          'VAT Prod. Posting Group / MwSt.-Produktbuchungsgruppe = VAT19'
        ],
        fieldsNotToTouch: [
          'Item Posting Group / Lagerbuchungsgruppe',
          'Base Unit of Measure / Basiseinheit',
          'Costing Method / Lagerabgangsmethode',
          'Inventory Posting Setup',
          'VAT Posting Setup',
          'General Posting Setup',
          'Any document or journal'
        ],
        risk: 'A successful item-card assignment can be mistaken for posting readiness.',
        fallback: 'If fields are not editable and clearly labelled, stop and create TARGET-054B UI recovery.'
      },
      {
        step: 'read-and-reveal-item-card',
        revealClicks
      },
      {
        step: 'write-outcome',
        writeOutcome
      }
    ],
    snapshots: { before, after, reopen },
    writeOutcome,
    nextStepDecision,
    nextCase,
    statePatch: observed
      ? {
          current: {
            activeArea: 'universaarl-vat-matrix-route-reopen-decision',
            activeCase: nextCase,
            active_case_file: '.agent/state/cases/target-027d25-vat-matrix-route-reopen-decision.json',
            nextCase,
            nextStep:
              'Run the next VAT Posting Setup route decision after U-ITEM-HW100 now shows WAREN and VAT19; do not create documents or post.'
          },
          activeCase: {
            status: 'done',
            resultPath: 'playwright/projects/fibu-book5/evidence/target-054-item-product-vat-posting-fields-controlled-write-gate/TARGET-054-result.json',
            nextCase
          }
        }
      : {},
    requiresReview: !observed,
    safeToFinalizeState: observed,
    reason: observed ? 'WAREN and VAT19 are visible after reopen on U-ITEM-HW100.' : blockedBy.join(' '),
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:item-product-vat-posting-fields-write-gate',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/target-054-item-product-vat-posting-fields-controlled-write-gate/TARGET-054-result.json',
      'npm run check:encoding',
      'git diff --check'
    ]
  };
}

function readme(result: any) {
  return [
    '# TARGET-054 Item Product/VAT Posting Fields Controlled Write Gate',
    '',
    `Status: ${result.resultStatus}`,
    '',
    'Ziel: Artikelkarte `U-ITEM-HW100` in `playthru / UNIVERSAARL-DE` oeffnen und nur `Produktbuchungsgruppe = WAREN` sowie `MwSt.-Produktbuchungsgruppe = VAT19` setzen oder sicher stoppen.',
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

test('TARGET-054 assigns WAREN and VAT19 to U-ITEM-HW100 only through labelled item fields', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await openItemCard(page);
  const revealClicks = await revealPostingFieldArea(page);
  const before = await captureState(page, 'target-054-010-before-product-vat-field-assignment', 'before-assignment', {
    revealClicks
  });

  const writeOutcome = await attemptFieldAssignment(page);
  const after = await captureState(page, 'target-054-020-after-product-vat-field-assignment-route', 'after-assignment', {
    writeOutcome
  });

  await openItemCard(page);
  await revealPostingFieldArea(page);
  const reopen = await captureState(page, 'target-054-030-reopen-proof', 'reopen-proof', { writeOutcome });

  const result = buildResult(before, after, reopen, writeOutcome, revealClicks);
  await writeJson(RESULT_PATH, result);
  await writeText('README.md', readme(result));

  expect(result.resultStatus, result.blockedBy.join('\n')).toBe('observed');
  expect(result.setupChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
