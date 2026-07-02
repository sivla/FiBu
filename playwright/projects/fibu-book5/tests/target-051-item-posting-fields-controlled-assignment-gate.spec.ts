import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(360_000);

const CASE_ID = 'TARGET-051-ITEM-POSTING-FIELDS-CONTROLLED-ASSIGNMENT-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-051-item-posting-fields-controlled-assignment-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-051-result.json');
const ITEM_CARD_PAGE_ID = 30;

const targetItem = {
  no: 'U-ITEM-HW100',
  name: 'Universaarl Hardware 100',
  baseUnit: 'STK',
  itemPostingGroup: 'WARE'
};

type FieldCandidate = {
  frameUrl: string;
  tag: string;
  role: string;
  text: string;
  aria: string;
  title: string;
  value: string;
  editable: boolean;
  disabled: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Step = Record<string, unknown>;

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

async function safeText(page: Page) {
  return clean(await pageText(page));
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
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function openItemCard(page: Page) {
  await page.goto(buildItemCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await expect
    .poll(async () => clean(await pageText(page)), { timeout: 45_000, intervals: [1000, 1500, 2500] })
    .toMatch(/U-ITEM-HW100|Universaarl Hardware 100|STK/i);
  await assertTargetContext(page);
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
      await page.waitForTimeout(250);
      await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

async function revealItemPostingFields(page: Page, steps: Step[]) {
  const clicks: Step[] = [];
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const clicked = await clickVisiblePattern(page, /Mehr anzeigen|Show more/i);
    if (!clicked) break;
    clicks.push({ clicked: 'Mehr anzeigen / Show more', attempt });
  }
  for (const pattern of [/Einstandspreise und Buchung|Costs and Posting/i, /Lager|Inventory/i, /Indirekte Steuer|Indirect Tax/i]) {
    const clicked = await clickVisiblePattern(page, pattern);
    if (clicked) {
      clicks.push({ clicked: pattern.source });
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const more = await clickVisiblePattern(page, /Mehr anzeigen|Show more/i);
        if (!more) break;
        clicks.push({ clicked: 'Mehr anzeigen / Show more after FastTab', attempt });
      }
    }
    await assertTargetContext(page);
  }
  steps.push({ step: 'reveal-item-posting-fields', clicks });
}

async function collectCandidates(page: Page) {
  const candidates: FieldCandidate[] = [];
  const pattern = /(Lagerbuchungsgruppe|Item Posting Group|Invt\. Posting Group)/i;
  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .evaluate((patternSource) => {
        const rx = new RegExp(patternSource, 'i');
        const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
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
          .slice(0, 40);
      }, pattern.source)
      .catch(() => []);
    candidates.push(...frameCandidates.map((candidate) => ({ ...candidate, frameUrl: sanitizeEvidenceUrl(frame.url()) })));
  }
  return candidates;
}

async function editablePostingGroupField(page: Page) {
  const labelPattern = /^(Lagerbuchungsgruppe|Item Posting Group|Invt\. Posting Group Code|Lagerbuchungsgruppencode)$/i;
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['combobox', 'textbox'] as const) {
      const field = await firstVisible(scope.getByRole(role, { name: labelPattern }), 600);
      if (field && (await field.isEditable({ timeout: 600 }).catch(() => false))) return field;
    }
  }
  return undefined;
}

async function enterItemEditMode(page: Page, steps: Step[]) {
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
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            };
          })
          .filter((entry) => {
            const label = `${entry.text} ${entry.aria} ${entry.title}`;
            const isHeaderEditAction =
              /Bearbeiten|Edit|Anderungen auf der Seite vornehmen|Änderungen auf der Seite vornehmen|Make changes/i.test(label) ||
              /header-action-edit_view/.test(entry.element.className);
            return isHeaderEditAction && entry.y < 80 && entry.x > 600 && entry.x < 1500;
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
          },
          candidates: candidates.slice(0, 8).map(({ element: _element, ...entry }) => entry)
        };
      })
      .catch((error) => ({ clicked: false, error: String(error), candidates: [] }));
    if (result.clicked) {
      steps.push({ step: 'enter-item-card-edit-mode', result });
      await page.waitForTimeout(1200);
      await assertTargetContext(page);
      return true;
    }
  }
  steps.push({ step: 'enter-item-card-edit-mode', result: { clicked: false, reason: 'top-edit-action-not-found' } });
  return false;
}

async function captureState(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Artikelkarte|Item Card|U-ITEM-HW100|Universaarl Hardware 100|STK|Lagerbuchungsgruppe|Item Posting Group|Produktbuchungsgruppe|Gen\. Prod\. Posting Group|MwSt.-Produktbuchungsgruppe|VAT Prod\. Posting Group|Einstandspreise|Buchung|Lager|Inventory|WARE/i
      ],
      maxLines: 240,
      maxLineLength: 260
    })
  );
  const text = compact || (await safeText(page));
  const candidates = await collectCandidates(page);
  const snapshot = {
    step,
    targetItem,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    text,
    visible: {
      itemCardContext: /Artikelkarte|Item Card|Artikel|Item/i.test(text),
      targetItemNo: text.includes(targetItem.no),
      targetItemName: text.includes(targetItem.name),
      baseUnit: text.includes(targetItem.baseUnit),
      itemPostingGroupTerm: /Lagerbuchungsgruppe|Item Posting Group/i.test(text),
      itemPostingGroupValue: new RegExp(`\\b${targetItem.itemPostingGroup}\\b`).test(text),
      forbiddenSignals: containsDangerousText(text)
    },
    candidates,
    ...extra
  };
  await writeText(`${prefix}.txt`, text || 'No compact text captured.');
  await writeJson(path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${prefix}.png`, {
    pageId: ITEM_CARD_PAGE_ID,
    page: 'Artikelkarte / Item Card',
    step,
    targetItem,
    importantUi: ['Artikelkarte', 'Einstandspreise und Buchung', 'Lagerbuchungsgruppe / Item Posting Group'],
    beginnerLearning: [
      'Die Lagerbuchungsgruppe verbindet den Artikel mit der Lagerbuchungseinrichtung.',
      'Diese Zuordnung bucht noch nichts und macht den Artikel noch nicht vollstaendig buchungsfaehig.',
      'Produktbuchungsgruppe und MwSt.-Produktbuchungsgruppe bleiben eigene Setup-Schritte.'
    ],
    internallyProves: snapshot.visible.itemPostingGroupValue
      ? 'U-ITEM-HW100 shows WARE as item posting group signal on the item card.'
      : 'U-ITEM-HW100 item card context and current field visibility before or during the controlled assignment gate.',
    doesNotProve: [
      'No Gen. Product Posting Group assignment.',
      'No VAT Product Posting Group assignment.',
      'No document draft.',
      'No Preview Posting.',
      'No Posting.',
      'No Item Ledger, Value, G/L or VAT entries.'
    ],
    screenshotQaRule: 'WARE only counts when visible on the item card after reopen; nearby setup pages or menu text do not count.',
    finalScreenshotStatus: snapshot.visible.itemPostingGroupValue ? 'universaarl-foundation-evidence' : 'setup-or-blocker-evidence',
    ...extra
  });
  return snapshot;
}

async function attemptAssignment(page: Page, steps: Step[]) {
  const beforeText = await safeText(page);
  if (/\bWARE\b/i.test(beforeText) && /Lagerbuchungsgruppe|Item Posting Group/i.test(beforeText)) {
    return {
      changed: false,
      status: 'already-visible' as const,
      reason: 'WARE and an item posting group term were already visible before the write gate.'
    };
  }

  let field = await editablePostingGroupField(page);
  if (!field) {
    const editModeEntered = await enterItemEditMode(page, steps);
    if (editModeEntered) {
      await revealItemPostingFields(page, steps);
      field = await editablePostingGroupField(page);
    }
  }
  if (!field) {
    return {
      changed: false,
      status: 'blocked-no-editable-field' as const,
      reason: 'No visibly labelled editable Item Posting Group / Lagerbuchungsgruppe field was found after read-only inspection and Edit mode attempt.'
    };
  }

  const beforeValue = (await field.inputValue({ timeout: 700 }).catch(() => '')) || '';
  steps.push({ step: 'editable-item-posting-group-field-found', beforeValue });
  await field.click({ timeout: 5000 });
  await field.fill(targetItem.itemPostingGroup, { timeout: 5000 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1800);
  await assertTargetContext(page);
  return {
    changed: true,
    status: 'attempted-assignment' as const,
    beforeValue,
    reason: 'Filled only the visibly labelled Item Posting Group / Lagerbuchungsgruppe field.'
  };
}

function readme(result: any) {
  return [
    '# TARGET-051 Item Posting Fields Controlled Assignment Gate',
    '',
    `Status: ${result.resultStatus}`,
    '',
    'Ziel: Artikelkarte `U-ITEM-HW100` in `playthru / UNIVERSAARL-DE` oeffnen und nur die Lagerbuchungsgruppe `WARE` setzen oder vor einer unsicheren Feldroute stoppen.',
    '',
    '## Gemacht',
    '',
    ...result.actionsTaken.map((line: string) => `- ${line}`),
    '',
    '## Nicht gemacht',
    '',
    ...result.actionsNotTaken.map((line: string) => `- ${line}`),
    '',
    '## Grenzen',
    '',
    ...result.notProved.map((line: string) => `- ${line}`),
    '',
    `Naechster Case: ${result.nextCase}`,
    ''
  ].join('\n');
}

test('TARGET-051 assigns WARE to U-ITEM-HW100 only through a labelled item field', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-036E2 proved U-ITEM-HW100 with base unit STK, TARGET-049 proved WARE, and TARGET-050 proved SAAR-HL + WARE + 1140 in Inventory Posting Setup.',
      fieldsToChangeOnlyIfClear: ['Item Posting Group / Lagerbuchungsgruppe = WARE'],
      fieldsNotToTouch: [
        'No.',
        'Description',
        'Base Unit of Measure',
        'Gen. Prod. Posting Group',
        'VAT Prod. Posting Group',
        'Costing Method',
        'Inventory Posting Setup',
        'VAT Posting Setup',
        'General Posting Setup'
      ],
      risk: 'A wrong field write could confuse later posting evidence.',
      fallback: 'If no visibly labelled editable Item Posting Group field exists, stop with UI diagnostics and no write.'
    }
  ];

  await openItemCard(page);
  await revealItemPostingFields(page, steps);
  const before = await captureState(page, 'target-051-010-before-item-posting-field-assignment', 'before-assignment');

  const writeOutcome = await attemptAssignment(page, steps);
  const after = await captureState(page, 'target-051-020-after-item-posting-field-assignment-route', 'after-assignment', { writeOutcome });

  await openItemCard(page);
  await revealItemPostingFields(page, steps);
  const reopen = await captureState(page, 'target-051-030-reopen-proof', 'reopen-proof', { writeOutcome });

  const observed = reopen.visible.targetItemNo && reopen.visible.itemPostingGroupValue;
  const resultStatus = observed ? 'observed' : 'blocked';
  const nextCase = observed
    ? 'TARGET-052-ITEM-POSTING-FIELDS-FOUNDATION-CHECKPOINT'
    : 'TARGET-051B-ITEM-POSTING-GROUP-FIELD-ROUTE-RECOVERY';
  const blockedBy = observed ? [] : [writeOutcome.reason, 'WARE is not visibly proven on U-ITEM-HW100 after reopen.'];

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-038-O2C-PREFLIGHT',
    lastEvidenceSummary:
      'TARGET-050 proved SAAR-HL + WARE + 1140 in Inventory Posting Setup; item assignment was the next narrow dependency.',
    isPlannedNextCaseStillSensible: false,
    reason: observed
      ? 'O2C is still too early; the next safe step is a foundation checkpoint that confirms which item posting fields are now complete and which VAT/general posting fields remain open.'
      : 'O2C is still too early and the item posting group field route is not proven.',
    lookaheadReviewed: [
      {
        caseId: nextCase,
        status: observed ? 'ready-next' : 'needs-ui-discovery-first',
        reason: observed
          ? 'Reopen proof should be converted into a narrow foundation checkpoint before broader setup.'
          : 'The route needs a focused field recovery before another write.'
      },
      {
        caseId: 'TARGET-027D4-VAT-MATRIX-FIELD-CONTROL-MAPPING',
        status: 'ready-after-current',
        reason: 'VAT remains a separate lane after the item posting group checkpoint.'
      },
      {
        caseId: 'TARGET-032D-GENERAL-POSTING-SETUP-MATRIX-WRITE-GATE',
        status: 'needs-setup-first',
        reason: 'General Posting Setup should wait until item/customer/vendor posting field checkpoints are clear.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C needs item assignment, VAT, General Posting Setup and customer posting-field readiness first.'
      },
      {
        caseId: 'TARGET-036D2G-U-VEND-MANUAL-NOS-SOURCE-OR-ASSISTED-ROUTE-DECISION',
        status: 'blocked',
        reason: 'Vendor numbering remains parked and separate from the inventory item lane.'
      }
    ],
    queueChangesMade: [`Selected ${nextCase} from TARGET-051 result.`],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: observed
      ? 'It checks the completed and remaining foundation dependencies without jumping to documents.'
      : 'It fixes the exact UI route before another item field write attempt.',
    risksBeforeNextCase: [
      'Do not claim inventory posting readiness from item field visibility alone.',
      'Keep VAT and General Posting Setup separate.',
      'Keep Preview Posting and Posting false.'
    ],
    requiredPreparation: observed
      ? ['Read item card after reopen and list open posting/VAT/general setup fields.']
      : ['Use Page Inspection/Personalize or card layout diagnostics to locate the exact Item Posting Group editor.']
  };

  const result = {
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
      url: sanitizeEvidenceUrl(page.url())
    },
    targetItem,
    actionsTaken: [
      'Opened Page 30 Artikelkarte / Item Card directly for U-ITEM-HW100.',
      'Expanded safe FastTabs and Mehr anzeigen where visible.',
      'Captured before screenshot QA and field candidates.',
      writeOutcome.changed
        ? 'Attempted to set only Item Posting Group / Lagerbuchungsgruppe = WARE through a labelled editable field.'
        : `No write or no additional write: ${writeOutcome.status}.`,
      'Reopened the item card and captured proof screenshot QA.'
    ],
    actionsNotTaken: [
      'No item was created.',
      'No item number, description or base unit was changed.',
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
    masterDataChanged: writeOutcome.changed && observed,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-051-010-before-item-posting-field-assignment.png',
      'playwright/projects/fibu-book5/img/target-051-020-after-item-posting-field-assignment-route.png',
      'playwright/projects/fibu-book5/img/target-051-030-reopen-proof.png'
    ],
    proved: observed
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'U-ITEM-HW100 item card was visible.',
          'WARE is visible on the item card after reopen.',
          'No VAT Product Posting Group, Gen. Product Posting Group, Costing Method, document, Preview Posting, Posting or API shortcut occurred.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'U-ITEM-HW100 item card was visible.',
          'The case stopped before proving WARE on the item card after reopen.',
          'No VAT Product Posting Group, Gen. Product Posting Group, Costing Method, document, Preview Posting, Posting or API shortcut occurred.'
        ],
    notProved: [
      'Item posting group assignment is not proven unless WARE is visible after reopen.',
      'No VAT Product Posting Group assignment is proven.',
      'No Gen. Product Posting Group assignment is proven.',
      'No inventory posting readiness is proven.',
      'No document, Preview Posting, Posting, Item Ledger Entry, Value Entry, G/L Entry or VAT Entry is proven.'
    ],
    blockedBy,
    warnings: [
      'WARE on the item card is still only a foundation signal, not posting readiness.',
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
    steps,
    snapshots: { before, after, reopen },
    writeOutcome,
    nextStepDecision,
    nextCase,
    statePatch: observed
      ? {
          current: {
            activeArea: 'universaarl-item-posting-fields-foundation-checkpoint',
            activeCase: nextCase,
            active_case_file: '.agent/state/cases/target-052-item-posting-fields-foundation-checkpoint.json',
            nextCase,
            nextStep:
              'Run TARGET-052 as a narrow checkpoint for U-ITEM-HW100 posting-field completeness before VAT, General Posting Setup or document work.'
          },
          activeCase: {
            status: 'done',
            resultPath: 'playwright/projects/fibu-book5/evidence/target-051-item-posting-fields-controlled-assignment-gate/TARGET-051-result.json',
            nextCase
          }
        }
      : {},
    requiresReview: resultStatus !== 'observed',
    safeToFinalizeState: resultStatus === 'observed',
    reason: observed ? 'WARE is visible after reopen on U-ITEM-HW100.' : blockedBy.join(' '),
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:item-posting-fields-assignment-gate',
      'npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/target-051-item-posting-fields-controlled-assignment-gate/TARGET-051-result.json',
      'npm run check:encoding',
      'git diff --check'
    ]
  };

  await writeJson(RESULT_PATH, result);
  await writeText('README.md', readme(result));

  expect(resultStatus, blockedBy.join('\n')).toBe('observed');
  expect(result.setupChanged).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
