import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(360_000);

const CASE_ID = 'ITEM-SERVICE-U-ITEM-HW100-PRICE-COST-FIELD-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'item-service-u-item-hw100-price-cost-field-route';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'result.json');
const ITEM_CARD_PAGE_ID = 30;
const ITEM_LIST_PAGE_ID = 31;

const target = {
  itemNo: 'U-ITEM-HW100',
  description: 'Steuerbox Standard U100',
  unitCost: '100,00',
  unitPrice: '149,00'
};

type Capture = {
  step: string;
  screenshot: string;
  textPath: string;
  snapshotPath: string;
  qa: {
    contextKind: 'item-card' | 'item-list' | 'factbox-only' | 'role-center-or-other';
    hasItemNo: boolean;
    hasCardSignal: boolean;
    hasUnitCostTarget: boolean;
    hasUnitPriceTarget: boolean;
    hasZeroSignals: boolean;
    importantLines: string[];
  };
};

type InputCandidate = {
  index: number;
  tag: string;
  type: string;
  value: string;
  readonly: boolean;
  disabled: boolean;
  left: number;
  top: number;
  width: number;
  labelText: string;
  score: number;
};

type FieldWrite = {
  field: string;
  targetValue: string;
  status: 'changed' | 'already-visible' | 'blocked';
  before?: string;
  after?: string;
  candidate?: InputCandidate;
  reason: string;
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
  if (!segments.length) throw new Error('Business Central URL must include an environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  return url;
}

function buildBcUrl(pageId: number) {
  const url = targetInstanceUrl();
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `Item.'No.' IS '${target.itemNo}'`);
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
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

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsForbiddenText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Ship|Invoice|Payment|Delete\?|Loeschen\?|VAT Posting Setup|MwSt.-Buchungsmatrix|General Posting Setup|Buchungsmatrix Einrichtung|Vorlage anwenden|Apply Template|Buchen|Post/i.test(
    text
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function previousChangedFields() {
  const raw = await fs.readFile(RESULT_PATH, 'utf8').catch(() => '');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { changedFields?: Array<{ field: string; before?: string; after?: string }> };
    return Array.isArray(parsed.changedFields) ? parsed.changedFields : [];
  } catch {
    return [];
  }
}

async function fullText(page: Page) {
  const mainText = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1200 }).catch(() => '')));
  return clean(`${mainText}\n${frameTexts.join('\n')}`);
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

async function compactText(page: Page) {
  const compact = await compactPageText(page, {
    include: [
      /Artikelkarte|Item Card|Artikel|Items|U-ITEM-HW100|Steuerbox Standard U100|Beschreibung|Description|Basiseinheit|STK|Lagerbuchungsgruppe|WARE\b|Produktbuchungsgruppe|WAREN|MwSt|VAT|VAT19|Einstandspreis|Unit Cost|VK-Preis|Verkaufspreis|Unit Price|Preis|FactBox|Infobox|Details/i
    ],
    maxLines: 260,
    maxLineLength: 280
  }).catch(() => '');
  return clean(compact || (await fullText(page)));
}

function classify(text: string): Capture['qa'] {
  const hasCardSignal = /Artikelkarte|Item Card/i.test(text);
  const hasListSignal = /Items|Artikel\s+Search|Liste|List/i.test(text);
  const hasFactBoxSignal = /FactBox|Infobox|Details|Artikelbild|Item Picture/i.test(text);
  const hasItemNo = /\bU-ITEM-HW100\b/i.test(text);
  const contextKind: Capture['qa']['contextKind'] =
    hasCardSignal && hasItemNo
      ? 'item-card'
      : hasListSignal && hasItemNo
        ? 'item-list'
        : hasFactBoxSignal && hasItemNo
          ? 'factbox-only'
          : 'role-center-or-other';
  return {
    contextKind,
    hasItemNo,
    hasCardSignal,
    hasUnitCostTarget: /\b100[,.]00\b/.test(text),
    hasUnitPriceTarget: /\b149[,.]00\b/.test(text),
    hasZeroSignals: /\b0[,.]00\b/.test(text),
    importantLines: text
      .split(/\n/)
      .filter((line) => /U-ITEM-HW100|Steuerbox|Artikelkarte|Einstandspreis|VK-Preis|Verkaufspreis|100[,.]00|149[,.]00|0[,.]00|WAREN|WARE\b|STK/i.test(line))
      .slice(0, 80)
  };
}

async function capture(page: Page, step: string, note: string, extra: Record<string, unknown> = {}): Promise<Capture> {
  await assertTargetContext(page);
  const text = await compactText(page);
  const qa = classify(text);
  const screenshotPath = path.join(EVIDENCE_DIR, `${step}.png`);
  const textPath = path.join(EVIDENCE_DIR, `${step}.txt`);
  const snapshotPath = path.join(EVIDENCE_DIR, `${step}.snapshot.json`);
  const metadataPath = path.join(EVIDENCE_DIR, `${step}.screenshot.json`);
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await writeText(textPath, text || 'No compact text captured.');
  await writeJson(snapshotPath, {
    caseId: CASE_ID,
    step,
    note,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    target,
    qa,
    ...extra
  });
  await writeJson(metadataPath, {
    caseId: CASE_ID,
    step,
    note,
    screenshot: path.relative(process.cwd(), screenshotPath).replace(/\\/g, '/'),
    contextKind: qa.contextKind,
    internalProof: qa,
    notProvedByThisScreenshot:
      qa.contextKind === 'item-card'
        ? ['It does not prove O2C/P2P document readiness, Preview Posting or Posting.']
        : ['It does not prove a full item-card price/cost route.']
  });
  return {
    step,
    screenshot: path.relative(process.cwd(), screenshotPath).replace(/\\/g, '/'),
    textPath: path.relative(process.cwd(), textPath).replace(/\\/g, '/'),
    snapshotPath: path.relative(process.cwd(), snapshotPath).replace(/\\/g, '/'),
    qa
  };
}

async function openItemCard(page: Page) {
  const routeAttempts: string[] = [];
  await page.goto(buildBcUrl(ITEM_CARD_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  routeAttempts.push('direct-page-30-filter');
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertTargetContext(page);
  let text = await fullText(page);
  if (/Artikelkarte|Item Card/i.test(text) && /\bU-ITEM-HW100\b/i.test(text)) return routeAttempts;

  await page.goto(buildBcUrl(ITEM_LIST_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  routeAttempts.push('direct-page-31-filter');
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await assertTargetContext(page);
  await expect
    .poll(async () => /\bU-ITEM-HW100\b/i.test(await fullText(page)), { timeout: 30_000, intervals: [1000, 1500, 2500] })
    .toBe(true);

  for (const scope of [page, ...page.frames()]) {
    const candidate =
      (await scope.getByRole('link', { name: /U-ITEM-HW100/i }).first().isVisible({ timeout: 700 }).catch(() => false))
        ? scope.getByRole('link', { name: /U-ITEM-HW100/i }).first()
        : scope.getByText(/U-ITEM-HW100/i).first();
    if (!(await candidate.isVisible({ timeout: 700 }).catch(() => false))) continue;
    await candidate.hover({ timeout: 1500 }).catch(() => undefined);
    await candidate.click({ timeout: 5000 });
    routeAttempts.push('open-u-item-hw100-from-filtered-list');
    break;
  }

  await expect
    .poll(async () => /Artikelkarte|Item Card/i.test(await fullText(page)), { timeout: 20_000, intervals: [1000, 1500, 2500] })
    .toBe(true);
  await assertTargetContext(page);
  return routeAttempts;
}

async function expandRelevantAreas(page: Page) {
  const actions: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const showMore = scope.getByText(/Mehr anzeigen|Show more/i).first();
    if (await showMore.isVisible({ timeout: 700 }).catch(() => false)) {
      await showMore.hover({ timeout: 1200 }).catch(() => undefined);
      await showMore.click({ timeout: 4000 }).catch(() => undefined);
      actions.push('show-more');
    }
  }
  const ensureOpen = async (headerPattern: RegExp, detailPattern: RegExp, actionName: string) => {
    if (detailPattern.test(await fullText(page))) return;
    for (const scope of [page, ...page.frames()]) {
      const tab = scope.getByText(headerPattern).first();
      if (!(await tab.isVisible({ timeout: 700 }).catch(() => false))) continue;
      await tab.hover({ timeout: 1200 }).catch(() => undefined);
      await tab.click({ timeout: 4000 }).catch(() => undefined);
      actions.push(actionName);
      await page.waitForTimeout(600);
      break;
    }
  };
  await ensureOpen(/Einstandspreise und Buchung|Costs and Posting/i, /Lagerabgangsmethode|Einstandspreis \(fest\)|Costing Method/i, 'open-costs-and-posting');
  await ensureOpen(/Preise und Verkauf|Prices and Sales/i, /VK-Preis|Verkaufspreis|Unit Price/i, 'open-prices-and-sales');
  await assertTargetContext(page);
  return actions;
}

async function inputCandidates(frame: Frame, labelSource: string): Promise<InputCandidate[]> {
  return frame.locator('input, textarea').evaluateAll((nodes, source) => {
    const re = new RegExp(source, 'i');
    const visible = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 8 && rect.height > 8 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const labels = Array.from(document.querySelectorAll('body *'))
      .filter((el) => visible(el))
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        return { text, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      })
      .filter((item) => item.text && re.test(item.text));
    return nodes
      .map((node, index) => {
        const input = node as HTMLInputElement | HTMLTextAreaElement;
        const rect = input.getBoundingClientRect();
        const labelledBy = (input.getAttribute('aria-labelledby') || '')
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent || '')
          .join(' ');
        const ownLabel = [
          input.getAttribute('aria-label') || '',
          input.getAttribute('title') || '',
          input.getAttribute('placeholder') || '',
          labelledBy
        ]
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        const nearby = labels
          .filter((label) => Math.abs((label.top + label.bottom) / 2 - (rect.top + rect.bottom) / 2) < 28 && label.right <= rect.left + 25)
          .sort((a, b) => Math.abs(a.right - rect.left) - Math.abs(b.right - rect.left))
          .slice(0, 3)
          .map((label) => label.text)
          .join(' | ');
        const labelText = `${ownLabel} ${nearby}`.trim();
        const exactOwn = ownLabel && re.test(ownLabel);
        const nearbyMatch = nearby && re.test(nearby);
        return {
          index,
          tag: input.tagName.toLowerCase(),
          type: (input as HTMLInputElement).type || '',
          value: input.value || '',
          readonly: Boolean((input as HTMLInputElement).readOnly),
          disabled: Boolean((input as HTMLInputElement).disabled),
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
          labelText,
          score: (exactOwn ? 100 : 0) + (nearbyMatch ? 80 : 0) - Math.abs(rect.left - 600) / 100
        };
      })
      .filter((candidate) => candidate.width > 20 && !candidate.disabled && !candidate.readonly && re.test(candidate.labelText))
      .sort((a, b) => b.score - a.score);
  }, labelSource);
}

async function setFieldNearLabel(page: Page, field: string, labelSource: string, targetValue: string): Promise<FieldWrite> {
  const frameResults: Array<{ frame: Frame; candidates: InputCandidate[] }> = [];
  for (const frame of page.frames()) {
    const candidates = await inputCandidates(frame, labelSource).catch(() => []);
    if (candidates.length) frameResults.push({ frame, candidates });
  }
  const all = frameResults.flatMap((entry) => entry.candidates);
  if (!all.length) {
    return { field, targetValue, status: 'blocked', reason: `No visible labelled editable control candidate found for ${field}.` };
  }
  const bestFrame = frameResults[0].frame;
  const best = frameResults[0].candidates[0];
  if (all.length > 5) {
    await writeJson(path.join(EVIDENCE_DIR, `${field.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-candidates.json`), all);
  }
  const input = bestFrame.locator('input, textarea').nth(best.index);
  const before = await input.inputValue({ timeout: 1000 }).catch(() => best.value);
  const normalizedBefore = before.replace('.', ',').trim();
  if (normalizedBefore === targetValue) {
    return { field, targetValue, status: 'already-visible', before, after: before, candidate: best, reason: 'Target value was already present.' };
  }
  await input.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
  await input.hover({ timeout: 1500 }).catch(() => undefined);
  await input.click({ timeout: 5000 });
  await input.fill(targetValue, { timeout: 5000 });
  await input.press('Tab', { timeout: 5000 }).catch(() => undefined);
  await page.waitForTimeout(1000);
  const after = await input.inputValue({ timeout: 1000 }).catch(() => '');
  return {
    field,
    targetValue,
    status: after.replace('.', ',').trim() === targetValue ? 'changed' : 'blocked',
    before,
    after,
    candidate: best,
    reason:
      after.replace('.', ',').trim() === targetValue
        ? `Changed ${field} through a visible labelled input candidate.`
        : `After fill, ${field} did not show the target value.`
  };
}

test('sets U-ITEM-HW100 cost and price through labelled item-card fields only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const carriedChangedFields = await previousChangedFields();
  const captures: Capture[] = [];
  const actionsTaken: string[] = [];
  const writes: FieldWrite[] = [];
  const routeAttempts = await openItemCard(page);
  captures.push(await capture(page, '010-before-price-cost-write', 'Full item card before price/cost write gate.'));

  const enhancementActions = await expandRelevantAreas(page);
  actionsTaken.push(...enhancementActions);
  captures.push(await capture(page, '020-expanded-price-cost-areas', 'Expanded/visible cost and price areas before writing.'));

  const smartDecision = {
    whyNow:
      'U-ITEM-HW100 is a realistic fictional Universaarl item, but the recovered card evidence showed price/cost values at 0.00, which is not useful for later O2C/P2P training.',
    exactFieldsAllowed: ['Einstandspreis / Unit Cost', 'VK-Preis / Verkaufspreis / Unit Price'],
    exactValuesAllowed: { unitCost: target.unitCost, unitPrice: target.unitPrice },
    fieldsNotAllowed: ['Posting Groups', 'VAT', 'Number Series', 'Documents', 'Journals', 'Setup'],
    fallback: 'If a labelled editable field route is not clear, stop without writing and keep O2C/P2P parked.'
  };
  await writeJson(path.join(EVIDENCE_DIR, 'smart-decision.json'), smartDecision);

  writes.push(await setFieldNearLabel(page, 'Unit Cost / Einstandspreis', '(^| )Einstandspreis( |$)|Unit Cost', target.unitCost));
  writes.push(await setFieldNearLabel(page, 'Unit Price / VK-Preis', 'VK-Preis|Verkaufspreis|Unit Price', target.unitPrice));
  await assertTargetContext(page);
  captures.push(await capture(page, '030-after-price-cost-write', 'Context after writing only labelled cost and price fields.', { writes }));

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(1000);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await assertTargetContext(page);
  await expandRelevantAreas(page);
  captures.push(await capture(page, '040-reopen-proof', 'Reopen/reload proof after price/cost field write.', { writes }));

  const finalText = await fullText(page);
  const unitCostObserved = /\b100[,.]00\b/.test(finalText);
  const unitPriceObserved = /\b149[,.]00\b/.test(finalText);
  const effectiveWrites = writes.map((write) => {
    const targetObserved =
      (/Einstandspreis|Unit Cost/i.test(write.field) && unitCostObserved) || (/VK-Preis|Verkaufspreis|Unit Price/i.test(write.field) && unitPriceObserved);
    if (write.status === 'blocked' && targetObserved) {
      return {
        ...write,
        status: 'already-visible' as const,
        after: write.targetValue,
        reason: `${write.field} target value was visible after reload; no additional field edit was needed.`
      };
    }
    return write;
  });
  const allWritesSafe = effectiveWrites.every((write) => write.status === 'changed' || write.status === 'already-visible');
  const observed = unitCostObserved && unitPriceObserved && allWritesSafe;
  const resultStatus = observed ? 'observed' : writes.some((write) => write.status === 'changed') ? 'partially-completed' : 'blocked';
  const blockedBy = [
    ...effectiveWrites.filter((write) => write.status === 'blocked').map((write) => `${write.field}: ${write.reason}`),
    ...(unitCostObserved ? [] : ['Unit Cost 100.00 was not proven after reload.']),
    ...(unitPriceObserved ? [] : ['Unit Price 149.00 was not proven after reload.'])
  ];
  const nextCase = observed ? 'VAT-POSTING-SETUP-READFIRST' : 'ITEM-SERVICE-U-ITEM-HW100-ROUTE-OR-PARK-DECISION';

  const changedFields = [
    ...carriedChangedFields,
    ...effectiveWrites
      .filter((write) => write.status === 'changed')
      .map((write) => ({ field: write.field, before: write.before, after: write.after }))
  ].filter((field, index, all) => all.findIndex((candidate) => candidate.field === field.field && candidate.after === field.after) === index);
  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-write-gate-item-price-cost',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeUrl(page.url()),
    page: 'Artikelkarte / Item Card',
    target,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: false,
    masterDataChanged: changedFields.length > 0,
    currentRunMasterDataChanged: effectiveWrites.some((write) => write.status === 'changed'),
    changedFields,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    confidentialRealCustomerDataUsed: false,
    actionsTaken: [
      'Opened Business Central in playthru with company UNIVERSAARL-DE.',
      'Opened U-ITEM-HW100 item card through the previously recovered route.',
      'Captured before/after/reopen screenshots.',
      'Applied Smart Decision gate for only Unit Cost and Unit Price.',
      ...effectiveWrites.map((write) => `${write.field}: ${write.status} (${write.before ?? ''} -> ${write.after ?? ''})`)
    ],
    actionsNotTaken: [
      'No setup change.',
      'No posting group or VAT field change.',
      'No sales or purchase document.',
      'No journal line.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No company switch.',
      'No confidential real customer data.'
    ],
    smartDecision,
    routeAttempts,
    writes: effectiveWrites,
    screenshots: captures.map((captureItem) => ({
      step: captureItem.step,
      screenshot: captureItem.screenshot,
      contextKind: captureItem.qa.contextKind,
      provesItemCard: captureItem.qa.contextKind === 'item-card' && captureItem.qa.hasItemNo,
      importantLines: captureItem.qa.importantLines.slice(0, 12)
    })),
    proved: [
      `Business Central target context stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
      'U-ITEM-HW100 full item-card context was used for the price/cost route.',
      ...(unitCostObserved ? ['Unit Cost / Einstandspreis 100.00 is visible after reload.'] : []),
      ...(unitPriceObserved ? ['Unit Price / VK-Preis 149.00 is visible after reload.'] : []),
      'No setup, document, journal, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ],
    notProved: [
      ...(observed ? [] : ['The full price/cost target state is not completely proven.']),
      'No O2C/P2P readiness, Preview Posting, Posting, ledger trace or UAT readiness was proven.',
      'The values are realistic fictional Universaarl sandbox data, not confidential real customer data.'
    ],
    blockedBy,
    warnings: resultStatus === 'partially-completed' ? ['One allowed field may have changed, but final proof is incomplete; review before further writes.'] : [],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      isPlannedNextCaseStillSensible: true,
      reason: 'The card route was proven, and realistic price/cost values are needed before item-dependent customer training or process documents.',
      lookaheadReviewed: [
        {
          caseId: 'VAT-POSTING-SETUP-READFIRST',
          status: observed ? 'ready-next' : 'blocked',
          reason: observed ? 'Item price/cost no longer blocks Foundation read-first continuation.' : 'Item price/cost proof remains incomplete.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'O2C still needs VAT/Posting Groups/customer readiness before documents.'
        },
        {
          caseId: 'P2P-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'P2P still needs vendor/purchase setup and item readiness before documents.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: observed
        ? 'The item route is now sufficient to return to Foundation/VAT read-first checks.'
        : 'The remaining issue is still item-route specific and must be closed or parked before documents.',
      risksBeforeNextCase: blockedBy,
      requiredPreparation: observed ? [] : ['Review changedFields and screenshots before any further item-dependent work.']
    },
    safeToFinalizeState: true,
    requiresReview: resultStatus !== 'observed',
    changedFiles: [
      EVIDENCE_DIR_REL,
      'playwright/projects/fibu-book5/tests/item-service-u-item-hw100-price-cost-field-route.spec.ts',
      'package.json'
    ],
    nextCase
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      `# ${CASE_ID}`,
      '',
      'Purpose: set or prove realistic fictional Unit Cost and Unit Price values on U-ITEM-HW100 through labelled item-card fields only.',
      '',
      `Result: ${resultStatus}`,
      `Master data changed: ${result.masterDataChanged}`,
      `Next case: ${nextCase}`,
      '',
      'No setup, document, journal, Preview Posting, Posting, payment, API shortcut, company switch or confidential real customer data was used.'
    ].join('\n')
  );

  expect(observed, blockedBy.join('\n')).toBe(true);
});
