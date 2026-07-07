import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1400 }
});
test.setTimeout(300_000);

const CASE_ID = 'ITEM-SERVICE-U-ITEM-HW100-CARD-EDITOR-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'item-service-u-item-hw100-card-editor-recovery';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'result.json');
const ITEM_CARD_PAGE_ID = 30;
const ITEM_LIST_PAGE_ID = 31;

const target = {
  itemNo: 'U-ITEM-HW100',
  description: 'Steuerbox Standard U100',
  baseUnitOfMeasure: 'STK',
  inventoryPostingGroup: 'WARE',
  genProductPostingGroup: 'WAREN',
  vatProductPostingGroup: 'VAT19',
  unitCost: '100.00',
  unitPrice: '149.00'
};

type Capture = {
  step: string;
  screenshot: string;
  textPath: string;
  snapshotPath: string;
  url: string;
  qa: UiQa;
};

type UiQa = {
  contextKind: 'item-card' | 'item-list' | 'factbox-only' | 'role-center-or-other';
  hasItemNo: boolean;
  hasDescription: boolean;
  hasCardSignal: boolean;
  hasListSignal: boolean;
  hasFactBoxSignal: boolean;
  hasBaseUnit: boolean;
  hasInventoryPostingGroup: boolean;
  hasGenProductPostingGroup: boolean;
  hasVatProductPostingGroup: boolean;
  hasUnitCostTarget: boolean;
  hasUnitPriceTarget: boolean;
  hasForbiddenSignal: boolean;
  importantLines: string[];
};

type EditorProbe = {
  label: string;
  visible: boolean;
  editableCandidate: boolean;
  value: string;
  controlCount: number;
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
  if (!segments.length) {
    throw new Error('Business Central URL must include an environment path before a target URL can be built.');
  }
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

function amountPattern(value: string) {
  const normalized = value.replace('.', '[.,]');
  return new RegExp(`\\b${normalized}\\b`);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
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
      /Artikelkarte|Item Card|Artikel|Items|U-ITEM-HW100|Steuerbox Standard U100|Universaarl Hardware 100|Beschreibung|Description|Basiseinheit|Base Unit|STK|Lagerbuchungsgruppe|Item Posting Group|WARE\b|Produktbuchungsgruppe|Gen\. Prod|WAREN|MwSt|VAT|VAT19|Einstandspreis|Unit Cost|Verkaufspreis|Unit Price|Preis|FactBox|Infobox|Details/i
    ],
    maxLines: 260,
    maxLineLength: 280
  }).catch(() => '');
  return clean(compact || (await fullText(page)));
}

function classifyUi(text: string): UiQa {
  const hasCardSignal = /Artikelkarte|Item Card/i.test(text);
  const hasListSignal = /Items|Artikel\s+Search|Liste|List|Nr\.\s+Name|No\.\s+Name|Ubersicht/i.test(text);
  const hasFactBoxSignal = /FactBox|Infobox|Details|Artikelbild|Item Picture/i.test(text);
  const hasItemNo = /\bU-ITEM-HW100\b/i.test(text);
  const hasDescription = /Steuerbox Standard U100|Universaarl Hardware 100/i.test(text);
  const contextKind: UiQa['contextKind'] =
    hasCardSignal && hasItemNo
      ? 'item-card'
      : hasListSignal && hasItemNo
        ? 'item-list'
        : hasFactBoxSignal && hasItemNo
          ? 'factbox-only'
          : 'role-center-or-other';
  const importantLines = text
    .split(/\n/)
    .filter((line) => /U-ITEM-HW100|Steuerbox|Universaarl Hardware|Artikelkarte|Item Card|Basiseinheit|STK|WARE\b|WAREN|VAT19|Einstandspreis|Unit Cost|Verkaufspreis|Unit Price|FactBox|Infobox|Artikel\b|Items\b/i.test(line))
    .slice(0, 80);
  return {
    contextKind,
    hasItemNo,
    hasDescription,
    hasCardSignal,
    hasListSignal,
    hasFactBoxSignal,
    hasBaseUnit: /\bSTK\b|Basiseinheit|Base Unit/i.test(text),
    hasInventoryPostingGroup: /\bWARE\b/i.test(text),
    hasGenProductPostingGroup: /\bWAREN\b/i.test(text),
    hasVatProductPostingGroup: /\bVAT19\b/i.test(text),
    hasUnitCostTarget: amountPattern(target.unitCost).test(text),
    hasUnitPriceTarget: amountPattern(target.unitPrice).test(text),
    hasForbiddenSignal: containsForbiddenText(text),
    importantLines
  };
}

async function capture(page: Page, step: string, note: string, extra: Record<string, unknown> = {}): Promise<Capture> {
  await assertTargetContext(page);
  const prefix = step;
  const text = await compactText(page);
  const qa = classifyUi(text);
  const screenshotPath = path.join(EVIDENCE_DIR, `${prefix}.png`);
  const textPath = path.join(EVIDENCE_DIR, `${prefix}.txt`);
  const snapshotPath = path.join(EVIDENCE_DIR, `${prefix}.snapshot.json`);
  const metadataPath = path.join(EVIDENCE_DIR, `${prefix}.screenshot.json`);
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
    title: clean(await page.title()),
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
    pageClaimBoundary: 'A screenshot counts as item-card evidence only when contextKind is item-card.',
    beginnerLearning: 'The screenshot must show whether the user is on the item card, item list, or only a FactBox/details context.',
    internalProof: qa,
    notProvedByThisScreenshot:
      qa.contextKind === 'item-card'
        ? ['It does not prove O2C/P2P document readiness, Preview Posting or Posting.']
        : ['It does not prove a full item-card route.']
  });
  return {
    step,
    screenshot: path.relative(process.cwd(), screenshotPath).replace(/\\/g, '/'),
    textPath: path.relative(process.cwd(), textPath).replace(/\\/g, '/'),
    snapshotPath: path.relative(process.cwd(), snapshotPath).replace(/\\/g, '/'),
    url: sanitizeUrl(page.url()),
    qa
  };
}

async function visible(locator: Locator, timeout = 800) {
  return locator.isVisible({ timeout }).catch(() => false);
}

async function findFirstVisible(scope: Page | Frame, locators: Locator[]) {
  for (const locator of locators) {
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      if (await visible(candidate, 600)) return candidate;
    }
  }
  return null;
}

async function openCardFromCurrentContext(page: Page) {
  const attempts: string[] = [];
  const initialText = await fullText(page);
  if (/Artikelkarte|Item Card/i.test(initialText) && /\bU-ITEM-HW100\b/i.test(initialText)) {
    return { opened: true, attempts: ['already-item-card'] };
  }
  for (const scope of [page, ...page.frames()]) {
    const candidate = await findFirstVisible(scope, [
      scope.getByRole('link', { name: /U-ITEM-HW100/i }),
      scope.getByRole('button', { name: /U-ITEM-HW100/i }),
      scope.getByText(/U-ITEM-HW100/i)
    ]);
    if (!candidate) continue;
    await candidate.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
    await candidate.hover({ timeout: 1500 }).catch(() => undefined);
    attempts.push('hovered-visible-u-item-hw100');
    await candidate.click({ timeout: 5000 });
    attempts.push('clicked-visible-u-item-hw100');
    const becameCard = await expect
      .poll(async () => /Artikelkarte|Item Card/i.test(await fullText(page)), { timeout: 10_000, intervals: [1000, 1500, 2500] })
      .toBe(true)
      .then(() => true)
      .catch(() => false);
    if (becameCard) return { opened: true, attempts };
    await candidate.dblclick({ timeout: 5000 }).catch(() => undefined);
    attempts.push('double-clicked-visible-u-item-hw100');
    const becameCardAfterDoubleClick = await expect
      .poll(async () => /Artikelkarte|Item Card/i.test(await fullText(page)), { timeout: 10_000, intervals: [1000, 1500, 2500] })
      .toBe(true)
      .then(() => true)
      .catch(() => false);
    return { opened: becameCardAfterDoubleClick, attempts };
  }
  return { opened: false, attempts };
}

async function clickSafeUiEnhancements(page: Page) {
  const actions: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const showMore = await findFirstVisible(scope, [
      scope.getByRole('button', { name: /Mehr anzeigen|Show more/i }),
      scope.getByText(/Mehr anzeigen|Show more/i)
    ]);
    if (showMore) {
      await showMore.hover({ timeout: 1200 }).catch(() => undefined);
      await showMore.click({ timeout: 4000 }).catch(() => undefined);
      actions.push('show-more');
    }
  }
  for (const scope of [page, ...page.frames()]) {
    const costTab = await findFirstVisible(scope, [
      scope.getByText(/Einstandspreise und Buchung|Costs and Posting/i),
      scope.getByRole('button', { name: /Einstandspreise und Buchung|Costs and Posting/i })
    ]);
    if (costTab) {
      await costTab.hover({ timeout: 1200 }).catch(() => undefined);
      await costTab.click({ timeout: 4000 }).catch(() => undefined);
      actions.push('costs-and-posting-fasttab');
      break;
    }
  }
  for (const scope of [page, ...page.frames()]) {
    const factBoxToggle = await findFirstVisible(scope, [
      scope.getByRole('button', { name: /Infobox|FactBox|Details/i }),
      scope.getByLabel(/Infobox|FactBox|Details/i)
    ]);
    if (factBoxToggle) {
      await factBoxToggle.hover({ timeout: 1200 }).catch(() => undefined);
      actions.push('factbox-toggle-hovered-only');
      break;
    }
  }
  await assertTargetContext(page);
  return actions;
}

async function probeEditors(page: Page): Promise<EditorProbe[]> {
  const probes: EditorProbe[] = [];
  const labels = [
    { label: 'Unit Cost / Einstandspreis', pattern: /Einstandspreis|Unit Cost/i },
    { label: 'Unit Price / Verkaufspreis', pattern: /Verkaufspreis|Unit Price|Preis VK|VK-Preis/i }
  ];
  for (const { label, pattern } of labels) {
    let visibleLabel = false;
    let editableCandidate = false;
    let value = '';
    let controlCount = 0;
    for (const scope of [page, ...page.frames()]) {
      const labelLocator = scope.getByText(pattern);
      if (await visible(labelLocator.first(), 700)) visibleLabel = true;
      const candidates = [
        scope.getByRole('textbox', { name: pattern }),
        scope.getByRole('spinbutton', { name: pattern }),
        scope.getByLabel(pattern)
      ];
      for (const locator of candidates) {
        const count = await locator.count().catch(() => 0);
        controlCount += count;
        for (let index = 0; index < count; index += 1) {
          const candidate = locator.nth(index);
          if (!(await visible(candidate, 500))) continue;
          editableCandidate = true;
          value =
            (await candidate.inputValue({ timeout: 500 }).catch(() => '')) ||
            clean(await candidate.textContent({ timeout: 500 }).catch(() => ''));
        }
      }
    }
    probes.push({
      label,
      visible: visibleLabel,
      editableCandidate,
      value,
      controlCount,
      reason: editableCandidate
        ? 'A labelled editable control candidate was visible; no value was changed in this recovery case.'
        : visibleLabel
          ? 'The label/text was visible, but no labelled editable control candidate was safely identified.'
          : 'Neither label nor editable control was visible in the captured context.'
    });
  }
  await writeJson(path.join(EVIDENCE_DIR, 'editor-probes.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    target,
    probes
  });
  return probes;
}

test('recovers U-ITEM-HW100 item-card/editor route without data changes', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const captures: Capture[] = [];
  const routeAttempts: string[] = [];
  const actionsTaken: string[] = [];
  const warnings: string[] = [];

  await page.goto(buildBcUrl(ITEM_CARD_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  routeAttempts.push('direct-page-30-filter');
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertTargetContext(page);
  captures.push(await capture(page, '010-direct-page-30-attempt', 'Direct Page 30 filtered item-card attempt.'));

  let currentQa = captures.at(-1)?.qa;
  if (currentQa?.contextKind !== 'item-card') {
    await page.goto(buildBcUrl(ITEM_LIST_PAGE_ID), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    routeAttempts.push('direct-page-31-filter');
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await assertTargetContext(page);
    await expect
      .poll(async () => /\bU-ITEM-HW100\b/i.test(await fullText(page)), { timeout: 30_000, intervals: [1000, 1500, 2500] })
      .toBe(true);
    captures.push(await capture(page, '020-item-list-filtered-context', 'Filtered item list context before opening the card.'));
    const openOutcome = await openCardFromCurrentContext(page);
    routeAttempts.push(...openOutcome.attempts);
    if (!openOutcome.opened) warnings.push('The list route did not prove a full item-card context.');
    captures.push(await capture(page, '030-after-list-open-attempt', 'Context after trying to open U-ITEM-HW100 from the filtered item list.', openOutcome));
  }

  currentQa = captures.at(-1)?.qa;
  const enhancementActions = currentQa?.contextKind === 'item-card' ? await clickSafeUiEnhancements(page) : [];
  actionsTaken.push(...enhancementActions);
  captures.push(
    await capture(page, '040-after-safe-ui-enhancements', 'Context after safe read-first UI enhancements such as Show more/FastTab hover/click.', {
      enhancementActions
    })
  );

  const editorProbes = await probeEditors(page);
  captures.push(await capture(page, '050-editor-probe-context', 'Context after labelled editor probes; no value was changed.', { editorProbes }));

  const finalQa = captures.at(-1)?.qa ?? captures[0].qa;
  const fullCardObserved = captures.some((captureItem) => captureItem.qa.contextKind === 'item-card' && captureItem.qa.hasItemNo);
  const targetValuesObserved = finalQa.hasGenProductPostingGroup && finalQa.hasVatProductPostingGroup;
  const unitAmountsObserved = finalQa.hasUnitCostTarget && finalQa.hasUnitPriceTarget;
  const resultStatus = fullCardObserved ? 'observed' : 'blocked';
  const blockedBy = [
    ...(fullCardObserved ? [] : ['Full item-card context was not proven.']),
    ...(unitAmountsObserved ? [] : ['Unit cost 100.00 and unit price 149.00 were not both visible in the captured context.'])
  ];
  const proved = [
    `Business Central target context stayed in ${EXPECTED_INSTANCE} / ${TARGET_COMPANY}.`,
    fullCardObserved
      ? 'U-ITEM-HW100 item-card context was observed at least once.'
      : 'U-ITEM-HW100 was visible only outside a proven full item-card context.',
    targetValuesObserved
      ? 'WAREN and VAT19 were visible in captured context.'
      : 'WAREN/VAT19 field proof was not fully refreshed in this recovery run.',
    'No setup, document, journal, Preview Posting, Posting, payment, API shortcut or company switch occurred.',
    'Screenshot QA now classifies each capture as item-card, item-list, FactBox-only or other.'
  ].filter(Boolean);
  const notProved = [
    ...(unitAmountsObserved ? [] : ['Unit cost 100.00 and unit price 149.00 were not both proven.']),
    'No O2C/P2P readiness, document creation, Preview Posting, Posting, ledger trace or UAT readiness was proven.',
    'No confidential real customer data was used; data remains realistic fictional Universaarl sandbox data.'
  ];
  const nextCase = fullCardObserved && !unitAmountsObserved
    ? 'ITEM-SERVICE-U-ITEM-HW100-PRICE-COST-FIELD-ROUTE'
    : fullCardObserved
      ? 'VAT-POSTING-SETUP-READFIRST'
      : 'ITEM-SERVICE-U-ITEM-HW100-ROUTE-OR-PARK-DECISION';

  const result = {
    schemaVersion: 1,
    caseId: CASE_ID,
    source: 'playwright-readfirst-ui-route-recovery',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: captures.at(-1)?.url,
    page: 'Items / Item Card',
    target,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    companySwitch: false,
    confidentialRealCustomerDataUsed: false,
    actionsTaken: [
      'Opened Business Central in playthru with company UNIVERSAARL-DE.',
      'Attempted direct filtered Item Card Page 30 for U-ITEM-HW100.',
      ...(routeAttempts.includes('direct-page-31-filter') ? ['Opened filtered Items Page 31 as fallback.'] : []),
      'Captured multiple screenshots with context classification.',
      'Probed labelled Unit Cost / Unit Price editor candidates without changing values.',
      ...actionsTaken
    ],
    actionsNotTaken: [
      'No setup change.',
      'No master-data value write.',
      'No sales or purchase document.',
      'No journal line.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No company switch.',
      'No confidential real customer data.'
    ],
    routeAttempts,
    editorProbes,
    screenshots: captures.map((captureItem) => ({
      step: captureItem.step,
      screenshot: captureItem.screenshot,
      contextKind: captureItem.qa.contextKind,
      provesItemCard: captureItem.qa.contextKind === 'item-card' && captureItem.qa.hasItemNo,
      importantLines: captureItem.qa.importantLines.slice(0, 12)
    })),
    screenshotQa: {
      rule: 'A screenshot is not item-card proof unless contextKind is item-card and U-ITEM-HW100 is visible.',
      reviewed: captures.map((captureItem) => ({
        step: captureItem.step,
        contextKind: captureItem.qa.contextKind,
        hasItemNo: captureItem.qa.hasItemNo,
        hasCardSignal: captureItem.qa.hasCardSignal,
        hasListSignal: captureItem.qa.hasListSignal,
        hasFactBoxSignal: captureItem.qa.hasFactBoxSignal,
        hasUnitCostTarget: captureItem.qa.hasUnitCostTarget,
        hasUnitPriceTarget: captureItem.qa.hasUnitPriceTarget
      }))
    },
    proved,
    notProved,
    blockedBy,
    warnings,
    uiLearning: [
      'More screenshots are useful only when each screenshot has a context classification and claim boundary.',
      'List/FactBox context must not be upgraded to item-card proof.',
      'The item route can be used for training only after the card context and relevant price/cost fields are visibly understood.'
    ],
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'ITEM-SERVICE-U-ITEM-HW100-CARD-EDITOR-RECOVERY',
      lastEvidenceSummary:
        'The previous write gate showed item-card signals but did not prove full reopen/card or Unit Cost/Unit Price values.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'O2C/P2P should not use U-ITEM-HW100 until the item-card route and field visibility are understood with screenshot QA.',
      lookaheadReviewed: [
        {
          caseId: 'ITEM-SERVICE-U-ITEM-HW100-PRICE-COST-FIELD-ROUTE',
          status: fullCardObserved && !unitAmountsObserved ? 'ready-next' : 'ready-after-current',
          reason: 'Needed only if card route is proven but price/cost fields remain unproven.'
        },
        {
          caseId: 'VAT-POSTING-SETUP-READFIRST',
          status: fullCardObserved ? 'ready-after-current' : 'needs-ui-discovery-first',
          reason: 'VAT read-first can resume after item route is not blocking O2C/P2P context.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'Documents remain forbidden until Foundation/VAT/Posting Groups and item/customer readiness are clearer.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: blockedBy.length
        ? 'The next case must close the remaining UI proof gap before document work.'
        : 'The item route is sufficient to move back to Foundation read-first checks.',
      risksBeforeNextCase: blockedBy,
      requiredPreparation: fullCardObserved ? [] : ['Review screenshots and route attempts before any item-dependent O2C/P2P step.']
    },
    safeToFinalizeState: true,
    requiresReview: resultStatus === 'blocked',
    changedFiles: [
      EVIDENCE_DIR_REL,
      'playwright/projects/fibu-book5/tests/item-service-u-item-hw100-card-editor-recovery.spec.ts',
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
      'Purpose: Recover the U-ITEM-HW100 item-card/editor route with screenshot QA before O2C/P2P uses the item.',
      '',
      'No setup, master-data write, document, journal, Preview Posting, Posting, payment, API shortcut or company switch occurred.',
      '',
      'Screenshot QA rule: a screenshot counts as item-card proof only when its metadata says `contextKind = item-card` and U-ITEM-HW100 is visible.',
      '',
      `Result: ${resultStatus}`,
      `Next case: ${nextCase}`
    ].join('\n')
  );
});
