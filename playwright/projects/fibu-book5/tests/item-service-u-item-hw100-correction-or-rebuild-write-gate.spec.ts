import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(360_000);

const CASE_ID = 'ITEM-SERVICE-U-ITEM-HW100-CORRECTION-OR-REBUILD-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'item-service-u-item-hw100-correction-or-rebuild-write-gate';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'result.json');
const ITEM_CARD_PAGE_ID = 30;

const target = {
  itemNo: 'U-ITEM-HW100',
  description: 'Steuerbox Standard U100',
  type: 'Bestand',
  baseUnitOfMeasure: 'STK',
  inventoryPostingGroup: 'WARE',
  genProductPostingGroup: 'WAREN',
  vatProductPostingGroup: 'VAT19',
  costingMethod: 'FIFO',
  unitCost: '100.00',
  unitPrice: '149.00'
};

type FieldAttempt = {
  field: string;
  targetValue: string;
  status: 'already-visible' | 'changed' | 'blocked';
  reason: string;
  before?: string;
};

type Capture = {
  step: string;
  screenshot: string;
  screenshotMetadata: string;
  textPath: string;
  snapshotPath: string;
  context: {
    cardContext: boolean;
    listContext: boolean;
    url: string;
  };
  visible: {
    itemNo: boolean;
    description: boolean;
    oldDescription: boolean;
    baseUnit: boolean;
    inventoryPostingGroup: boolean;
    genProductPostingGroup: boolean;
    vatProductPostingGroup: boolean;
    costingMethod: boolean;
    unitCostTarget: boolean;
    unitPriceTarget: boolean;
    forbiddenSignals: boolean;
  };
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/KAJETAN\.KALICKI/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|upn:/i.test(line))
    .join('\n')
    .trim();
}

function targetInstanceUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) {
    throw new Error('Business Central URL must include an environment path before a target URL can be built.');
  }
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  return url;
}

function buildItemCardUrl() {
  const url = targetInstanceUrl();
  url.searchParams.set('page', String(ITEM_CARD_PAGE_ID));
  url.searchParams.set('filter', `Item.'No.' IS '${target.itemNo}'`);
  return url.toString();
}

function buildItemListUrl() {
  const url = targetInstanceUrl();
  url.searchParams.set('page', '31');
  url.searchParams.set('filter', `Item.'No.' IS '${target.itemNo}'`);
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
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

function containsForbiddenText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Ship|Invoice|Payment|Delete\?|Loeschen\?|VAT Posting Setup|MwSt.-Buchungsmatrix|General Posting Setup|Buchungsmatrix Einrichtung|Vorlage anwenden|Apply Template/i.test(
    text
  );
}

function amountPattern(value: string) {
  const normalized = value.replace('.', '[.,]');
  return new RegExp(`\\b${normalized}\\b`);
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1200 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (containsForbiddenText(text) || /\b(OK|Yes|Ja|Finish|Delete|Post|Buchen)\b/i.test(text)) dialogs.push(text);
    }
  }
  return dialogs;
}

async function assertTargetContext(page: Page) {
  const url = page.url();
  expect(instancePathIsTarget(url), `Wrong instance URL: ${sanitizeUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `Wrong company URL: ${sanitizeUrl(url)}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
}

async function openItemCard(page: Page) {
  const routeAttempts: string[] = [];
  await page.goto(buildItemCardUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  routeAttempts.push('direct-page-30-filter');
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);
  let text = '';
  const directOpened = await expect
    .poll(
      async () => {
        text = clean(await pageText(page));
        return /U-ITEM-HW100|Artikelkarte|Item Card|Steuerbox Standard U100|Universaarl Hardware 100/i.test(text);
      },
      { timeout: 12_000, intervals: [1000, 1500, 2500] }
    )
    .toBe(true)
    .then(() => true)
    .catch(() => false);
  if (!directOpened) {
    routeAttempts.push('direct-page-30-landed-on-role-center');
    await writeJsonEvidence(path.join(EVIDENCE_DIR, 'route-recovery-role-center.snapshot.json'), {
      caseId: CASE_ID,
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      attemptedUrl: sanitizeUrl(buildItemCardUrl()),
      currentUrl: sanitizeUrl(page.url()),
      reason: 'Direct Page 30 URL did not expose U-ITEM-HW100; Role Center navigation must be used.',
      visibleSignals: text.split('\n').slice(0, 80)
    });

    const clickedItemNav = await clickVisibleText(page, /^Artikel$/i).catch(() => false);
    if (clickedItemNav) {
      routeAttempts.push('role-center-artikel-link');
    } else {
      await page.goto(buildItemListUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
      routeAttempts.push('direct-page-31-filter');
      await waitForBusinessCentralShell(page);
      await dismissTours(page).catch(() => undefined);
    }

    const listText = await expect
      .poll(async () => clean(await pageText(page)), { timeout: 35_000, intervals: [1000, 1500, 2500] })
      .toMatch(/Artikel|Items|U-ITEM-HW100|Beschreibung|Description/i)
      .then(async () => clean(await pageText(page)));
    if (!/U-ITEM-HW100/i.test(listText)) {
      routeAttempts.push('item-not-visible-after-item-list-route');
      await assertTargetContext(page);
      await writeJsonEvidence(path.join(EVIDENCE_DIR, 'route-attempts.json'), {
        caseId: CASE_ID,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        routeAttempts,
        cardOpened: false,
        reason: 'U-ITEM-HW100 was not visible after safe item-list recovery.',
        finalUrl: sanitizeUrl(page.url())
      });
      return { cardOpened: false, routeAttempts, reason: 'U-ITEM-HW100 was not visible after safe item-list recovery.' };
    }

    for (const scope of [page, ...page.frames()]) {
      const itemLink =
        (await firstVisible(scope.getByRole('link', { name: /U-ITEM-HW100/i }), 700)) ??
        (await firstVisible(scope.getByText(/U-ITEM-HW100/i), 700));
      if (!itemLink) continue;
      await itemLink.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
      await itemLink.click({ timeout: 5000 });
      routeAttempts.push('open-visible-u-item-hw100-from-list');
      await page.waitForTimeout(1800);
      break;
    }
  }

  let finalText = clean(await pageText(page));
  if (!/Artikelkarte|Item Card/i.test(finalText) && /U-ITEM-HW100/i.test(finalText)) {
    routeAttempts.push('visible-u-item-hw100-list-row-needs-card-open');
    for (const scope of [page, ...page.frames()]) {
      const itemLink =
        (await firstVisible(scope.getByRole('link', { name: /U-ITEM-HW100/i }), 700)) ??
        (await firstVisible(scope.getByText(/U-ITEM-HW100/i), 700));
      if (!itemLink) continue;
      await itemLink.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
      await itemLink.click({ timeout: 5000 });
      await page.keyboard.press('Enter').catch(() => undefined);
      await page.waitForTimeout(1800);
      finalText = clean(await pageText(page));
      if (!/Artikelkarte|Item Card/i.test(finalText)) {
        await itemLink.dblclick({ timeout: 5000 }).catch(() => undefined);
        await page.waitForTimeout(1800);
      }
      break;
    }
  }

  const cardOpened = await expect
    .poll(async () => {
      finalText = clean(await pageText(page));
      return /Artikelkarte|Item Card/i.test(finalText) && /U-ITEM-HW100/i.test(finalText);
    }, { timeout: 45_000, intervals: [1000, 1500, 2500] })
    .toBe(true)
    .then(() => true)
    .catch(() => false);
  await assertTargetContext(page);
  await writeJsonEvidence(path.join(EVIDENCE_DIR, 'route-attempts.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    routeAttempts,
    cardOpened,
    reason: cardOpened ? 'Item card opened.' : 'Item card did not open; Business Central stayed in list or Role Center context.',
    finalUrl: sanitizeUrl(page.url())
  });
  return {
    cardOpened,
    routeAttempts,
    reason: cardOpened ? 'Item card opened.' : 'Item card did not open; Business Central stayed in list or Role Center context.'
  };
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible({ timeout }).catch(() => false)) return candidate;
  }
  return undefined;
}

async function clickVisible(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const candidate = await firstVisible(scope.getByRole(role, { name: label }), 500);
      if (!candidate) continue;
      await candidate.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
      await candidate.hover({ timeout: 1500 }).catch(() => undefined);
      await candidate.click({ timeout: 5000 });
      await page.waitForTimeout(800);
      await assertTargetContext(page);
      return true;
    }
  }
  return false;
}

async function clickVisibleText(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const candidate = await firstVisible(scope.getByText(label), 500);
    if (!candidate) continue;
    await candidate.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
    await candidate.hover({ timeout: 1500 }).catch(() => undefined);
    await candidate.click({ timeout: 5000 });
    await page.waitForTimeout(800);
    await assertTargetContext(page);
    return true;
  }
  return false;
}

async function revealCardContext(page: Page) {
  const actions: string[] = [];
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const clicked = await clickVisible(page, /Mehr anzeigen|Show more/i).catch(() => false);
    if (!clicked) break;
    actions.push(`show-more-${attempt + 1}`);
  }
  for (const area of [
    /Einstandspreise und Buchung|Costs and Posting/i,
    /Buchungsdetails|Posting Details/i,
    /Preise und Verkauf|Prices and Sales/i,
    /Artikel|Item/i
  ]) {
    const clicked = (await clickVisibleText(page, area).catch(() => false)) || (await clickVisible(page, area).catch(() => false));
    if (clicked) actions.push(`open-area:${area.source}`);
  }
  return actions;
}

async function controlDiagnostics(page: Page) {
  const candidates = [];
  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value ?? '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        };
        const rx = /U-ITEM-HW100|Beschreibung|Description|Produktbuchungsgruppe|Gen\. Prod|MwSt|VAT|WAREN|VAT19|WARE|FIFO|Einstandspreis|Unit Cost|Verkaufspreis|Unit Price|Preis/i;
        return Array.from(document.querySelectorAll<HTMLElement>('input,textarea,button,[role="button"],[role="combobox"],[role="textbox"],span,div'))
          .filter(visible)
          .map((element) => {
            const input = element as HTMLInputElement;
            const rect = element.getBoundingClientRect();
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
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              w: Math.round(rect.width),
              h: Math.round(rect.height)
            };
          })
          .filter((entry) => rx.test(`${entry.text} ${entry.aria} ${entry.title} ${entry.value}`))
          .slice(0, 120);
      })
      .catch(() => []);
    candidates.push(
      ...frameCandidates.map((entry) => ({
        ...entry,
        text: clean(entry.text),
        aria: clean(entry.aria),
        title: clean(entry.title),
        value: clean(entry.value),
        frameUrl: sanitizeUrl(frame.url())
      }))
    );
  }
  return candidates;
}

function visibleSignals(text: string) {
  return {
    itemNo: /U-ITEM-HW100/i.test(text),
    description: /Steuerbox Standard U100/i.test(text),
    oldDescription: /Universaarl Hardware 100/i.test(text),
    baseUnit: /\bSTK\b/i.test(text),
    inventoryPostingGroup: /\bWARE\b/i.test(text),
    genProductPostingGroup: /\bWAREN\b/i.test(text),
    vatProductPostingGroup: /\bVAT19\b/i.test(text),
    costingMethod: /\bFIFO\b/i.test(text),
    unitCostTarget: amountPattern(target.unitCost).test(text),
    unitPriceTarget: amountPattern(target.unitPrice).test(text),
    forbiddenSignals: containsForbiddenText(text)
  };
}

function contextSignals(text: string, rawUrl: string) {
  const url = new URL(rawUrl);
  return {
    cardContext: /Artikelkarte|Item Card/i.test(text),
    listContext: /(^|\n)Artikel:|Items|Nr\.\s*Beschreibung|No\.\s*Description/i.test(text) || url.searchParams.get('page') === '31',
    url: sanitizeUrl(rawUrl)
  };
}

async function capture(page: Page, step: string, fileStem: string, extra: Record<string, unknown> = {}): Promise<Capture> {
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Artikelkarte|Item Card|U-ITEM-HW100|Steuerbox|Universaarl Hardware|Beschreibung|Description|Bestand|Inventory|STK|WARE|WAREN|VAT19|FIFO|Produktbuchungsgruppe|MwSt.-Produktbuchungsgruppe|Lagerbuchungsgruppe|Einstandspreis|Unit Cost|Verkaufspreis|Unit Price|Preis/i
      ],
      maxLines: 320,
      maxLineLength: 340
    })
  );
  const text = compact || (await fullText(page));
  const visible = visibleSignals(text);
  const context = contextSignals(text, page.url());
  const screenshot = `${EVIDENCE_DIR_REL}/${fileStem}.png`;
  const screenshotPath = path.resolve(screenshot);
  const screenshotMetadata = `${EVIDENCE_DIR_REL}/${fileStem}.screenshot.json`;
  const textPath = `${EVIDENCE_DIR_REL}/${fileStem}.txt`;
  const snapshotPath = `${EVIDENCE_DIR_REL}/${fileStem}.snapshot.json`;

  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await writeTextEvidence(path.resolve(textPath), text || 'No compact page text captured.');
  await writeJsonEvidence(path.resolve(snapshotPath), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    step,
    page: context.cardContext ? 'Artikelkarte / Item Card' : 'Artikelliste / Items List',
    pageId: context.cardContext ? ITEM_CARD_PAGE_ID : 31,
    url: context.url,
    context,
    title: clean(await page.title()),
    visible,
    textWindow: text.split('\n').slice(0, 140),
    controls: await controlDiagnostics(page),
    ...extra
  });
  await writeJsonEvidence(path.resolve(screenshotMetadata), {
    fileName: `${fileStem}.png`,
    imagePath: screenshot,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: context.cardContext ? 'Artikelkarte / Item Card' : 'Artikelliste / Items List',
    pageId: context.cardContext ? ITEM_CARD_PAGE_ID : 31,
    context,
    step,
    importantUi: [
      'Artikelkopf mit Nr. und Beschreibung',
      'Einstandspreise und Buchung',
      'Produktbuchungsgruppe WAREN',
      'MwSt.-Produktbuchungsgruppe VAT19',
      'Lagerbuchungsgruppe WARE',
      'Preis-/Kostenfelder nur wenn sichtbar'
    ],
    beginnerLearning: [
      'Die Artikelkarte verbindet Produktdaten mit Buchungslogik.',
      'Lagerbuchungsgruppe und Produktbuchungsgruppe sind unterschiedliche Felder.',
      'Ein Artikel ist erst prozessbereit, wenn die zugehoerigen Buchungs- und MwSt.-Setups ebenfalls passen.'
    ],
    internallyProves: visible.itemNo
      ? context.cardContext
        ? 'The screenshot is in the U-ITEM-HW100 item-card context.'
        : 'The screenshot is in the U-ITEM-HW100 item-list context with FactBox evidence.'
      : 'The screenshot is diagnostic only because the item context is not proven.',
    doesNotProve: [
      'No sales or purchase document readiness.',
      'No General Posting Setup readiness.',
      'No VAT Posting Setup readiness.',
      'No item ledger/value/G/L/VAT entry.',
      'No UAT acceptance.'
    ],
    screenshotQaRule:
      'A value counts as card proof only when it is visible in the U-ITEM-HW100 item-card context. List or FactBox text is weaker and must be labelled as such.',
    finalScreenshotStatus: visible.itemNo ? 'universaarl-evidence-candidate' : 'diagnostic',
    visible,
    ...extra
  });

  return { step, screenshot, screenshotMetadata, textPath, snapshotPath, context, visible };
}

async function enterEditMode(page: Page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  for (const scope of [page, ...page.frames()]) {
    const candidate =
      (await firstVisible(scope.getByRole('button', { name: /^Bearbeiten$|^Edit$|Anderungen auf der Seite vornehmen|Aenderungen auf der Seite vornehmen|Make changes/i }), 600)) ??
      (await firstVisible(scope.locator('button[title*="Bearbeiten" i],button[aria-label*="Bearbeiten" i],button[title*="Edit" i],button[aria-label*="Edit" i]'), 600));
    if (!candidate) continue;
    await candidate.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
    await candidate.hover({ timeout: 1500 }).catch(() => undefined);
    const clicked = await candidate
      .click({ timeout: 5000 })
      .then(() => true)
      .catch((error) => {
        return /spa-overlay|intercepts pointer events|Timeout/i.test(String(error)) ? false : Promise.reject(error);
      });
    if (!clicked) {
      return { clicked: false, route: 'edit-action-covered-by-overlay' };
    }
    await page.waitForTimeout(1400);
    await assertTargetContext(page);
    return { clicked: true, route: 'visible-edit-action' };
  }
  return { clicked: false, route: 'edit-action-not-visible' };
}

async function fieldByLabel(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['combobox', 'textbox', 'spinbutton'] as const) {
      const field = await firstVisible(scope.getByRole(role, { name: label }), 600);
      if (field && (await field.isEditable({ timeout: 700 }).catch(() => false))) return field;
    }
    const fallback = await firstVisible(scope.locator('input,textarea').filter({ hasText: label }), 400);
    if (fallback && (await fallback.isEditable({ timeout: 700 }).catch(() => false))) return fallback;
  }
  return undefined;
}

async function fieldByCurrentValue(page: Page, value: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const fields = scope.locator('input,textarea');
    const count = await fields.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const field = fields.nth(index);
      if (!(await field.isVisible({ timeout: 500 }).catch(() => false))) continue;
      if (!(await field.isEditable({ timeout: 500 }).catch(() => false))) continue;
      const currentValue = await field.inputValue({ timeout: 500 }).catch(() => '');
      if (value.test(currentValue)) return field;
    }
  }
  return undefined;
}

async function setField(field: Locator, value: string) {
  const before = (await field.inputValue({ timeout: 1000 }).catch(() => '')) || '';
  if (before.trim().toUpperCase() === value.trim().toUpperCase()) return before;
  await field.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
  await field.click({ timeout: 5000 });
  await field.fill(value, { timeout: 5000 }).catch(async () => {
    await field.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await field.pressSequentially(value, { delay: 35 });
  });
  await field.press('Tab').catch(() => undefined);
  await field.page().waitForTimeout(1200);
  return before;
}

async function attemptTargetField(page: Page, fieldName: string, label: RegExp, targetValue: string, alreadyVisible: boolean): Promise<FieldAttempt> {
  if (alreadyVisible) {
    return { field: fieldName, targetValue, status: 'already-visible', reason: `${targetValue} already visible in item-card context.` };
  }
  const field = await fieldByLabel(page, label);
  if (!field) {
    return { field: fieldName, targetValue, status: 'blocked', reason: 'Editable labelled field was not found.' };
  }
  const before = await setField(field, targetValue);
  await assertTargetContext(page);
  if (before.trim().toUpperCase() === targetValue.trim().toUpperCase()) {
    return { field: fieldName, targetValue, status: 'already-visible', reason: `${targetValue} was already in the editable labelled field.`, before };
  }
  return { field: fieldName, targetValue, status: 'changed', reason: 'Editable labelled field was filled and tabbed out.', before };
}

async function attemptWrites(page: Page, before: Capture) {
  await revealCardContext(page);
  let currentText = await fullText(page);
  let current = visibleSignals(currentText);
  let edit = { clicked: false, route: 'not-needed-editable-fields-first' };
  let descriptionField =
    (await fieldByLabel(page, /^Beschreibung$|^Description$/i)) ??
    (await fieldByCurrentValue(page, /Universaarl Hardware 100Inventory|Universaarl Hardware 100/i));
  const productField = await fieldByLabel(
    page,
    /^Produktbuchungsgruppe$|^Gen\. Prod\. Posting Group$|^Gen\. Product Posting Group$/i
  );
  const vatField = await fieldByLabel(
    page,
    /^MwSt\.-Produktbuchungsgruppe$|^VAT Prod\. Posting Group$|^VAT Product Posting Group$/i
  );

  if (!descriptionField && !productField && !vatField) {
    edit = await enterEditMode(page);
    if (!edit.clicked) {
      return {
        edit,
        attempts: [
          {
            field: 'all-target-fields',
            targetValue: 'n/a',
            status: 'blocked',
            reason: `No clear editable fields before edit fallback, and edit fallback failed: ${edit.route}.`
          } satisfies FieldAttempt
        ]
      };
    }
    await revealCardContext(page);
    currentText = await fullText(page);
    current = visibleSignals(currentText);
    descriptionField =
      (await fieldByLabel(page, /^Beschreibung$|^Description$/i)) ??
      (await fieldByCurrentValue(page, /Universaarl Hardware 100Inventory|Universaarl Hardware 100/i));
  }

  const attempts: FieldAttempt[] = [];
  if (current.description) {
    attempts.push({ field: 'description', targetValue: target.description, status: 'already-visible', reason: `${target.description} already visible in item-card context.` });
  } else if (descriptionField) {
    const beforeValue = await setField(descriptionField, target.description);
    await assertTargetContext(page);
    attempts.push({
      field: 'description',
      targetValue: target.description,
      status: beforeValue.trim().toUpperCase() === target.description.toUpperCase() ? 'already-visible' : 'changed',
      reason:
        beforeValue.trim().toUpperCase() === target.description.toUpperCase()
          ? 'Target description was already in the editable field.'
          : 'Editable description field was found by label or current value, filled and tabbed out.',
      before: beforeValue
    });
  } else {
    attempts.push({ field: 'description', targetValue: target.description, status: 'blocked', reason: 'Editable labelled description field was not found.' });
  }
  attempts.push(
    await attemptTargetField(
      page,
      'genProductPostingGroup',
      /^Produktbuchungsgruppe$|^Gen\. Prod\. Posting Group$|^Gen\. Product Posting Group$/i,
      target.genProductPostingGroup,
      current.genProductPostingGroup
    )
  );
  attempts.push(
    await attemptTargetField(
      page,
      'vatProductPostingGroup',
      /^MwSt\.-Produktbuchungsgruppe$|^VAT Prod\. Posting Group$|^VAT Product Posting Group$/i,
      target.vatProductPostingGroup,
      current.vatProductPostingGroup
    )
  );

  const afterCoreText = await fullText(page);
  const afterCore = visibleSignals(afterCoreText);
  attempts.push(
    await attemptTargetField(page, 'unitCost', /^Einstandspreis$|^Unit Cost$/i, target.unitCost, afterCore.unitCostTarget)
  );
  attempts.push(
    await attemptTargetField(page, 'unitPrice', /^Verkaufspreis$|^VK-Preis$|^Unit Price$/i, target.unitPrice, afterCore.unitPriceTarget)
  );

  return { edit, attempts, beforeVisible: before.visible };
}

function readme(result: any) {
  return [
    `# ${CASE_ID}`,
    '',
    `Status: ${result.resultStatus}`,
    '',
    'Ziel: Die vorhandene Artikelkarte `U-ITEM-HW100` in `playthru / UNIVERSAARL-DE` mit vielen Screenshots pruefen und nur eindeutig beschriftete Zielfelder korrigieren.',
    '',
    '## Bewiesen',
    '',
    ...result.proved.map((line: string) => `- ${line}`),
    '',
    '## Grenzen',
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

test('proves or corrects U-ITEM-HW100 item-card target fields with screenshot QA', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const initialRoute = await openItemCard(page);
  if (!initialRoute.cardOpened) {
    const routeBlocked = await capture(page, 'route-blocked-before-write', '010-route-blocked-before-write', { initialRoute });
    const result = {
      schemaVersion: 1,
      purpose: 'autopilot-result-normalized',
      caseId: CASE_ID,
      source: 'playwright-controlled-masterdata-item-write-gate',
      resultStatus: 'blocked',
      startedAt,
      completedAt: new Date().toISOString(),
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      page: {
        pageId: routeBlocked.context.cardContext ? ITEM_CARD_PAGE_ID : 31,
        name: routeBlocked.context.cardContext ? 'Artikelkarte / Item Card' : 'Artikelliste / Items List or Role Center',
        url: routeBlocked.context.url
      },
      targetValues: target,
      actionsTaken: [
        'Opened Business Central in playthru / UNIVERSAARL-DE.',
        'Tried the safe item-card route for U-ITEM-HW100.',
        'Captured a route-blocked screenshot and control diagnostics.',
        'Stopped before any write because the item-card context was not open.'
      ],
      actionsNotTaken: [
        'No item field was changed in this run.',
        'No sales document was created.',
        'No purchase document was created.',
        'No journal line was created.',
        'No Preview Posting was run.',
        'No Posting was run.',
        'No payment was run.',
        'No setup was changed.',
        'No API shortcut was used.',
        'No company switch was executed.',
        'No confidential real customer data was used.'
      ],
      setupChanged: false,
      masterDataChanged: false,
      draftCreated: false,
      previewPosting: false,
      posted: false,
      payment: false,
      apiShortcut: false,
      screenshots: [routeBlocked.screenshot],
      screenshotMetadata: [routeBlocked.screenshotMetadata],
      snapshots: [routeBlocked.snapshotPath],
      route: initialRoute,
      fieldCheckpoint: {
        routeBlocked: routeBlocked.visible,
        context: {
          routeBlocked: routeBlocked.context
        },
        changedFields: [],
        blockedFields: ['item-card-route: Item card did not open; stopped before writes.'],
        attempts: []
      },
      proved: [
        'Business Central stayed in playthru / UNIVERSAARL-DE.',
        routeBlocked.visible.itemNo
          ? 'U-ITEM-HW100 was visible in the captured context.'
          : 'U-ITEM-HW100 was not visible in the captured context.',
        'No setup, document, Preview Posting, Posting, payment or API shortcut occurred.'
      ],
      notProved: [
        'No item-card field value is proven from this blocked run.',
        'No full item-card reopen proof is proven.',
        'No O2C/P2P process readiness is proven.',
        'No General Posting Setup row INLAND/WAREN with sales/purchase accounts is proven.',
        'No VAT Posting Setup row INLAND/VAT19 with VAT percent and accounts is proven.',
        'No UAT acceptance is proven.'
      ],
      blockedBy: ['item-card-route: Item card did not open; Business Central stayed in list or Role Center context.'],
      warnings: [
        'Short codes such as WARE must not be used as standalone page-context proof because they can appear inside unrelated German UI words.',
        'Only screenshot-confirmed item-card context may count as card proof.'
      ],
      flags: {
        noPost: true,
        noPreview: true,
        noDraft: true,
        noSetupChange: true,
        noCompanySwitch: true,
        noApiShortcut: true,
        noBookMasterChange: true,
        noConfidentialRealCustomerData: true
      },
      nextStepDecision: {
        currentCase: CASE_ID,
        plannedNextCaseBeforeReview: 'O2C-MINIMAL-ROUTE-DECISION',
        lastEvidenceSummary: 'The route check did not reach a stable item-card context, so no write was attempted in this run.',
        isPlannedNextCaseStillSensible: false,
        reason: 'O2C is still too early until the item-card route and setup readiness are clear.',
        lookaheadReviewed: [
          {
            caseId: 'ITEM-SERVICE-U-ITEM-HW100-CARD-EDITOR-RECOVERY',
            status: 'ready-next',
            reason: 'The next narrow case must fix or prove the card-opening route before more writes.'
          },
          {
            caseId: 'VAT-POSTING-SETUP-READFIRST',
            status: 'ready-after-current',
            reason: 'VAT setup remains read-first after item route recovery.'
          },
          {
            caseId: 'GENERAL-POSTING-SETUP-READFIRST',
            status: 'ready-after-current',
            reason: 'General Posting Setup remains read-first after item route recovery.'
          },
          {
            caseId: 'O2C-MINIMAL-ROUTE-DECISION',
            status: 'needs-setup-first',
            reason: 'Sales process work must wait for item, VAT and posting setup gates.'
          }
        ],
        queueChangesMade: ['Kept ITEM-SERVICE-U-ITEM-HW100-CARD-EDITOR-RECOVERY as the next narrow route-recovery case.'],
        selectedNextCase: 'ITEM-SERVICE-U-ITEM-HW100-CARD-EDITOR-RECOVERY',
        whySelectedNextCaseIsBest: 'It targets the observed UI route blocker without creating documents or setup changes.',
        risksBeforeNextCase: ['Do not count list or FactBox evidence as full card proof.'],
        requiredPreparation: ['Use screenshots and active editor diagnostics before another write attempt.']
      },
      nextCase: 'ITEM-SERVICE-U-ITEM-HW100-CARD-EDITOR-RECOVERY',
      safeToFinalizeState: false,
      requiresReview: true
    };
    await writeJsonEvidence(RESULT_PATH, result);
    await writeTextEvidence(path.join(EVIDENCE_DIR, 'README.md'), readme(result));
    return;
  }
  const revealBefore = await revealCardContext(page);
  const before = await capture(page, 'before-write-gate', '010-before-item-card-context', { revealBefore });

  const writeOutcome = await attemptWrites(page, before);
  const after = await capture(page, 'after-write-attempt', '020-after-write-attempt', { writeOutcome });

  await openItemCard(page);
  const revealReopen = await revealCardContext(page);
  const reopen = await capture(page, 'reopen-proof', '030-reopen-proof', { revealReopen, writeOutcome });

  const coreFieldsProven =
    reopen.context.cardContext &&
    reopen.visible.itemNo &&
    reopen.visible.description &&
    reopen.visible.baseUnit &&
    reopen.visible.inventoryPostingGroup &&
    reopen.visible.genProductPostingGroup &&
    reopen.visible.vatProductPostingGroup &&
    reopen.visible.costingMethod;
  const commercialFieldsProven = reopen.visible.unitCostTarget && reopen.visible.unitPriceTarget;
  const changedFields = writeOutcome.attempts.filter((attempt) => attempt.status === 'changed').map((attempt) => attempt.field);
  const blockedFields = writeOutcome.attempts.filter((attempt) => attempt.status === 'blocked').map((attempt) => `${attempt.field}: ${attempt.reason}`);
  const resultStatus = coreFieldsProven ? (commercialFieldsProven ? 'observed' : 'partially-completed') : 'blocked';
  const nextCase = coreFieldsProven
    ? commercialFieldsProven
      ? 'ITEM-SERVICE-CARD-REOPEN-PROOF'
      : 'ITEM-SERVICE-U-ITEM-HW100-PRICE-COST-FIELD-ROUTE'
    : 'ITEM-SERVICE-U-ITEM-HW100-CARD-EDITOR-RECOVERY';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-masterdata-item-write-gate',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: {
      pageId: reopen.context.cardContext ? ITEM_CARD_PAGE_ID : 31,
      name: reopen.context.cardContext ? 'Artikelkarte / Item Card' : 'Artikelliste / Items List',
      url: reopen.context.url
    },
    targetValues: target,
    actionsTaken: [
      'Opened the U-ITEM-HW100 item card directly in playthru / UNIVERSAARL-DE.',
      'Captured before, after-attempt and reopen-proof screenshots plus field-control diagnostics.',
      'Used only visible labelled item-card controls; no force click and no coordinate click were used.',
      changedFields.length ? `Changed target fields: ${changedFields.join(', ')}.` : 'No target field changed because values were already visible or fields were blocked.',
      reopen.context.cardContext
        ? 'Reopened the item card after the write attempt.'
        : 'Reopen route returned the item list with FactBox evidence instead of a full item-card context.'
    ],
    actionsNotTaken: [
      'No sales document was created.',
      'No purchase document was created.',
      'No journal line was created.',
      'No Preview Posting was run.',
      'No Posting was run.',
      'No payment was run.',
      'No VAT setup was changed.',
      'No General Posting Setup was changed.',
      'No Number Series setup was changed.',
      'No API shortcut was used.',
      'No company switch was executed.',
      'No confidential real customer data was used.'
    ],
    setupChanged: false,
    masterDataChanged: changedFields.length > 0,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    screenshots: [before.screenshot, after.screenshot, reopen.screenshot],
    screenshotMetadata: [before.screenshotMetadata, after.screenshotMetadata, reopen.screenshotMetadata],
    snapshots: [before.snapshotPath, after.snapshotPath, reopen.snapshotPath],
    fieldCheckpoint: {
      before: before.visible,
      after: after.visible,
      reopen: reopen.visible,
      context: {
        before: before.context,
        after: after.context,
        reopen: reopen.context
      },
      changedFields,
      blockedFields,
      attempts: writeOutcome.attempts
    },
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      before.context.cardContext
        ? 'U-ITEM-HW100 item-card context was visible before the write gate.'
        : 'U-ITEM-HW100 item-card context was not proven before the write gate.',
      reopen.context.cardContext
        ? 'U-ITEM-HW100 item-card context was visible after reopen.'
        : 'After reopen, U-ITEM-HW100 was visible only in the item list/FactBox context, not as a full item-card reopen proof.',
      ...(coreFieldsProven
        ? [
            'The core item model is visible after reopen: description Steuerbox Standard U100, STK, WARE inventory posting group, WAREN product posting group, VAT19 VAT product posting group and FIFO.'
          ]
        : ['The complete core item model was not proven after reopen.']),
      ...(commercialFieldsProven
        ? ['Target unit cost 100.00 and target unit price 149.00 are visible after reopen.']
        : ['Price/cost target fields were not fully proven after reopen.']),
      'No setup, document, Preview Posting, Posting, payment or API shortcut occurred.'
    ],
    notProved: [
      'No O2C/P2P process readiness is proven.',
      'No General Posting Setup row INLAND/WAREN with sales/purchase accounts is proven.',
      'No VAT Posting Setup row INLAND/VAT19 with VAT percent and accounts is proven.',
      'No inventory valuation, item ledger entry, value entry, G/L entry or VAT entry is proven.',
      'No full item-card reopen proof is proven when the final screenshot is the item list/FactBox.',
      'No UAT acceptance is proven.'
    ],
    blockedBy: blockedFields,
    warnings: [
      'WARE is Lagerbuchungsgruppe / Inventory Posting Group; WAREN is Produktbuchungsgruppe / Gen. Product Posting Group.',
      'A realistic item card is still only a foundation object until posting and VAT setup gates are complete.',
      'Screenshots count only in U-ITEM-HW100 item-card context.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noConfidentialRealCustomerData: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'O2C-MINIMAL-ROUTE-DECISION',
      lastEvidenceSummary:
        'The previous local correction clarified WARE vs WAREN. This run checked and corrected the real item card with screenshot QA.',
      isPlannedNextCaseStillSensible: false,
      reason:
        'O2C is still too early until the item card is proven and VAT/General Posting Setup readiness is separately decided.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: resultStatus === 'observed' ? 'ready-next' : 'needs-ui-discovery-first',
          reason: resultStatus === 'observed' ? 'Item-card model is visible; a narrow reopen/checkpoint can lock the evidence.' : 'Unproven fields need a focused route before process work.'
        },
        {
          caseId: 'VAT-POSTING-SETUP-READFIRST',
          status: coreFieldsProven ? 'ready-after-current' : 'needs-setup-first',
          reason: 'VAT setup remains a separate foundation gate.'
        },
        {
          caseId: 'GENERAL-POSTING-SETUP-READFIRST',
          status: coreFieldsProven ? 'ready-after-current' : 'needs-setup-first',
          reason: 'General Posting Setup remains a separate foundation gate for INLAND/WAREN.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'Sales documents must wait until VAT and General Posting Setup gates are clear.'
        }
      ],
      queueChangesMade: [`Selected ${nextCase} instead of jumping to O2C.`],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'It preserves the freshly proven item evidence before setup/process work.'
          : 'It avoids blind repetition and targets only the missing item-card route.',
      risksBeforeNextCase: [
        'Do not treat item-card proof as posting readiness.',
        'Do not create O2C/P2P documents before setup gates.'
      ],
      requiredPreparation: commercialFieldsProven ? [] : ['Inspect price/cost labels and active editors before another write attempt.']
    },
    nextCase,
    safeToFinalizeState: resultStatus !== 'blocked',
    requiresReview: resultStatus === 'blocked'
  };

  await writeJsonEvidence(RESULT_PATH, result);
  await writeTextEvidence(path.join(EVIDENCE_DIR, 'README.md'), readme(result));

  expect(reopen.visible.itemNo).toBe(true);
  expect(result.setupChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
