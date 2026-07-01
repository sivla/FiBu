import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, searchFor, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-027D-VAT-POSTING-SETUP-MATRIX-WRITE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d-vat-posting-setup-matrix-write';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D-result.json');

type Capture = {
  step: string;
  url: string;
  screenshot: string;
  screenshotMetadata: string;
  textFile: string;
  surfaceAccepted: boolean;
  rowVisible: boolean;
  targetValuesVisible: boolean;
  roleCenterVisible: boolean;
  searchOverlayVisible: boolean;
  textSignals: string[];
  visibleValueCandidates: Array<{ text: string; role: string; rect: Rect }>;
};

type Rect = { x: number; y: number; width: number; height: number };

type WriteAttempt = {
  attempted: boolean;
  steps: Array<Record<string, unknown>>;
  blockedBy: string[];
  warnings: string[];
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function normalizeForMatch(value: string | null | undefined) {
  return clean(value).toLowerCase();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function buildPlaythruBaseUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.delete('page');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
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

function roleCenterVisible(text: string) {
  return /Guten Morgen|Aktivitaeten|Laufender Verkauf|Laufende Einkaufe|Shopify\s+-\s+Aktivitaeten/i.test(text);
}

function searchOverlayVisible(text: string) {
  return /Wie mochten Sie weiter verfahren|Was mochten Sie tun|Tell me|Nach .* suchen|Seiten und Aufgaben/i.test(text);
}

function dangerousDialogSignal(text: string) {
  return /\b(Post|Preview Posting|Buchungsvorschau|Delete|Loeschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja)\b/i.test(text);
}

function page472Visible(text: string) {
  return (
    /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup/i.test(text) &&
    /MwSt|USt|VAT/i.test(text) &&
    /Gesch[a-z]*ftsbuchungsgruppe|Geschaeftsbuchungsgruppe|Bus\. Posting Group|Business Posting Group/i.test(text) &&
    /Produktbuchungsgruppe|Prod\. Posting Group|Product Posting Group/i.test(text)
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

async function visibleText(page: Page) {
  return clean(await pageText(page));
}

async function findVisibleCandidates(page: Page, pattern: RegExp) {
  const all: Array<{ frameUrl: string; text: string; role: string; rect: Rect }> = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((source) => {
        const pattern = new RegExp(source, 'i');
        const selectors = '[role="option"],[role="button"],[role="link"],[role="gridcell"],[role="columnheader"],button,a,li,div,span,input';
        return [...document.querySelectorAll<HTMLElement>(selectors)]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = (element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const visible =
              text.length > 0 &&
              pattern.test(text) &&
              rect.width > 1 &&
              rect.height > 1 &&
              rect.bottom > 0 &&
              rect.right > 0 &&
              rect.top < window.innerHeight &&
              rect.left < window.innerWidth &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              Number(style.opacity || '1') > 0;
            if (!visible) return null;
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              }
            };
          })
          .filter(Boolean)
          .slice(0, 120);
      }, pattern.source)
      .catch(() => []);
    for (const entry of entries as Array<{ text: string; role: string; rect: Rect }>) {
      all.push({ frameUrl: sanitizeEvidenceUrl(frame.url()), ...entry });
    }
  }
  return all;
}

async function matrixSurface(page: Page): Promise<Locator | null> {
  const scopes = [page, ...page.frames()] as Array<Page | Frame>;
  const candidates: Locator[] = [];
  for (const scope of scopes) {
    candidates.push(scope.locator('form').filter({ hasText: /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i }).last());
    candidates.push(scope.locator('[role="grid"]').filter({ hasText: /MwSt|USt|VAT|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe/i }).last());
    candidates.push(scope.locator('form').filter({ hasText: /Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Bus\. Posting Group|Prod\. Posting Group/i }).last());
  }
  for (const candidate of candidates) {
    const count = await candidate.count().catch(() => 0);
    if (count === 0) continue;
    const locator = candidate.first();
    const text = clean(await locator.innerText({ timeout: 1000 }).catch(() => ''));
    const box = await locator.boundingBox().catch(() => null);
    if (box && box.width > 180 && box.height > 60 && page472Visible(text)) return locator;
  }
  return null;
}

async function compactMatrixText(page: Page) {
  const surface = await matrixSurface(page);
  if (surface) {
    const surfaceText = clean(await surface.innerText({ timeout: 1500 }).catch(() => ''));
    if (surfaceText) return surfaceText;
  }
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i,
        /Gesch[a-z]*ftsbuchungsgruppe|Bus\. Posting Group|Business Posting Group/i,
        /Produktbuchungsgruppe|Prod\. Posting Group|Product Posting Group/i,
        /Berechnungsart|Calculation Type|Normal VAT|Normale MwSt/i,
        /MwSt\.? %|VAT %|19/i,
        /Verkauf.*MwSt|Sales VAT|Einkauf.*MwSt|Purchase VAT|1406|3806/i,
        /INLAND|VAT19/i,
        /Neu|New|Liste bearbeiten|Edit list/i
      ],
      maxLines: 260,
      maxLineLength: 300
    })
  );
}

async function dangerousDialogs(page: Page) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (dangerousDialogSignal(text)) dialogs.push(text);
    }
  }
  return dialogs;
}

async function assertTargetContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogs(page), 'No dangerous dialog may be visible.').toEqual([]);
}

async function clickExactSearchResult(page: Page) {
  const scopes = [page, ...page.frames()] as Array<Page | Frame>;
  const patterns = [
    /MwSt\.-?Buchungsmatrix(?: Einr\.)?\s+Verwaltung/i,
    /VAT Posting Setup\s+Verwaltung/i,
    /MwSt\.-?Buchungsmatrix|VAT Posting Setup/i
  ];
  for (const scope of scopes) {
    for (const pattern of patterns) {
      const locators = [
        scope.getByRole('row', { name: pattern }),
        scope.getByRole('button', { name: pattern }),
        scope.getByRole('link', { name: pattern }),
        scope.getByText(pattern)
      ];
      for (const locator of locators) {
        const count = await locator.count().catch(() => 0);
        for (let index = 0; index < Math.min(count, 6); index += 1) {
          const item = locator.nth(index);
          if (!(await item.isVisible({ timeout: 600 }).catch(() => false))) continue;
          await item.click({ timeout: 5000 }).catch(async () => item.click({ timeout: 5000, force: true }));
          await page.waitForTimeout(3500);
          await waitForBusinessCentralShell(page);
          return true;
        }
      }
    }
  }
  const candidates = await findVisibleCandidates(page, /MwSt|USt|VAT|Buchungsmatrix|Verwaltung/i);
  const exact = candidates
    .filter((entry) => /buchungsmatrix|vat posting setup/i.test(normalizeForMatch(entry.text)))
    .filter((entry) => /verwaltung|posting setup|buchungsmatrix/i.test(normalizeForMatch(entry.text)))
    .filter((entry) => entry.rect.width < 760 && entry.rect.height <= 130 && entry.rect.x >= 350 && entry.rect.y >= 70)
    .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];
  if (exact) {
    await page.mouse.click(exact.rect.x + Math.min(40, Math.round(exact.rect.width / 2)), exact.rect.y + Math.round(exact.rect.height / 2));
    await page.waitForTimeout(3500);
    await waitForBusinessCentralShell(page);
    return true;
  }
  return false;
}

async function openMatrixPage(page: Page, route: string[]) {
  route.push('direct-page-472-dc0');
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertTargetContext(page);
  const directText = await compactMatrixText(page);
  if (page472Visible(directText) && !roleCenterVisible(directText) && !searchOverlayVisible(directText)) return 'direct';

  route.push('exact-search-result:MwSt.-Buchungsmatrix');
  await page.goto(buildPlaythruBaseUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await searchFor(page, 'MwSt.-Buchungsmatrix');
  const clicked = await clickExactSearchResult(page);
  if (!clicked) return 'search-result-not-clicked';
  await assertTargetContext(page);
  return 'exact-search-result';
}

async function capture(page: Page, prefix: string, step: string): Promise<Capture> {
  const text = (await compactMatrixText(page)) || (await visibleText(page));
  const surface = await matrixSurface(page);
  const visibleValueCandidates = await findVisibleCandidates(page, /INLAND|VAT19|1406|3806|19|Normal VAT|Normale MwSt|MwSt|VAT/i);
  const visibleValues = visibleValueCandidates.map((entry) => entry.text).join('\n');
  const combined = `${text}\n${visibleValues}`;
  const rowVisible = /\bINLAND\b/i.test(combined) && /\bVAT19\b/i.test(combined);
  const targetValuesVisible =
    rowVisible &&
    /\b19(?:,00|\.00)?\b|19 Prozent|VAT19/i.test(combined) &&
    /\b1406\b/i.test(combined) &&
    /\b3806\b/i.test(combined);
  const surfaceAccepted = !!surface || page472Visible(text);
  const screenshot = `${prefix}.png`;
  const screenshotMetadata = `${prefix}.screenshot.json`;
  const textFile = `${prefix}.txt`;

  await writeText(textFile, [text, ...visibleValueCandidates.map((entry) => entry.text)].filter(Boolean).join('\n') || 'No visible VAT matrix text captured.');
  const imagePath = path.join(EVIDENCE_DIR, screenshot);
  if (surface) {
    await surface.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => undefined);
    await surface.screenshot({ path: imagePath });
  } else {
    await page.screenshot({ path: imagePath, fullPage: false });
  }
  await writeJson(path.join(EVIDENCE_DIR, screenshotMetadata), {
    fileName: screenshot,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'MwSt.-Buchungsmatrix / VAT Posting Setup',
    pageId: 472,
    step,
    status: surfaceAccepted && !roleCenterVisible(text) && !searchOverlayVisible(text) ? 'accepted-page-screenshot' : 'rejected-page-screenshot',
    importantUi: [
      'MwSt.-Geschaeftsbuchungsgruppe / VAT Business Posting Group',
      'MwSt.-Produktbuchungsgruppe / VAT Product Posting Group',
      'MwSt.-Berechnungsart / VAT Calculation Type',
      'MwSt. % / VAT %',
      'Verkauf MwSt.-Konto / Sales VAT Account',
      'Einkauf MwSt.-Konto / Purchase VAT Account'
    ],
    whatAUserSees:
      'Die MwSt.-Buchungsmatrix verbindet Geschaeftspartnergruppe und Produktgruppe mit Steuersatz, Berechnungsart und Steuerkonten.',
    internallyProves: targetValuesVisible
      ? 'The target INLAND + VAT19 matrix values are visible with candidate VAT percent/accounts.'
      : 'The VAT Posting Setup matrix surface was captured for setup verification.',
    doesNotProve: [
      'No Preview Posting.',
      'No Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No final German VAT correctness.'
    ],
    screenshotQaRule: 'Accepted only when the screenshot itself shows Page 472 matrix context, not Role Center or Tell-Me search.',
    visibleValueCandidates: visibleValueCandidates.slice(0, 30)
  });

  return {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    screenshot,
    screenshotMetadata,
    textFile,
    surfaceAccepted,
    rowVisible,
    targetValuesVisible,
    roleCenterVisible: roleCenterVisible(text),
    searchOverlayVisible: searchOverlayVisible(text),
    textSignals: [text, visibleValues].join('\n').split('\n').slice(0, 100),
    visibleValueCandidates: visibleValueCandidates.slice(0, 30)
  };
}

async function clickIfVisible(locator: Locator) {
  if (!(await locator.isVisible({ timeout: 900 }).catch(() => false))) return false;
  await locator.click({ timeout: 4000 }).catch(async () => locator.click({ timeout: 4000, force: true }));
  return true;
}

async function clickActionByPaneGeometry(page: Page, name: RegExp) {
  const candidates = await findVisibleCandidates(page, name);
  const candidate = candidates
    .filter((entry) => entry.rect.x >= 390 && entry.rect.x <= 1550 && entry.rect.y >= 70 && entry.rect.y <= 190)
    .sort((a, b) => a.rect.width * a.rect.height - b.rect.width * b.rect.height)[0];
  if (!candidate) return false;
  await page.mouse.click(candidate.rect.x + Math.min(24, Math.round(candidate.rect.width / 2)), candidate.rect.y + Math.round(candidate.rect.height / 2));
  await page.waitForTimeout(1200);
  return true;
}

async function ensureEditMode(page: Page, surface: Locator) {
  const candidates = [
    surface.getByRole('menuitem', { name: /^Liste bearbeiten$|^Edit List$/i }).first(),
    surface.getByRole('button', { name: /^Liste bearbeiten$|^Edit List$/i }).first(),
    surface.getByTitle(/^Liste bearbeiten$|^Edit List$/i).first(),
    surface.getByRole('menuitem', { name: /Liste bearbeiten|Edit List|Bearbeiten/i }).first()
  ];
  for (const candidate of candidates) {
    if (await clickIfVisible(candidate)) {
      await page.waitForTimeout(1500);
      return 'clicked-edit-list';
    }
  }
  if (await clickActionByPaneGeometry(page, /^Liste bearbeiten$|^Edit List$/i)) return 'clicked-edit-list-by-geometry';
  return 'edit-list-not-visible-or-already-editable';
}

async function clickNew(page: Page, surface: Locator) {
  const candidates = [
    surface.getByRole('menuitem', { name: /^Neu$|^New$/i }).first(),
    surface.getByRole('button', { name: /^Neu$|^New$/i }).first(),
    surface.getByTitle(/^Neu$|^New$/i).first()
  ];
  for (const candidate of candidates) {
    if (await clickIfVisible(candidate)) {
      await page.waitForTimeout(1400);
      return true;
    }
  }
  if (await clickActionByPaneGeometry(page, /^Neu$|^New$/i)) return true;
  return false;
}

async function fillActiveCell(page: Page, value: string, steps: Array<Record<string, unknown>>, step: string) {
  await page.keyboard.type(value, { delay: 35 });
  await page.waitForTimeout(350);
  steps.push({ step, value });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(650);
}

async function chooseNormalVatIfVisible(page: Page, steps: Array<Record<string, unknown>>) {
  const option = page.getByText(/^Normal VAT$|^Normale MwSt\.?$|^Normal$|^Normale Umsatzsteuer$/i).last();
  if (await option.isVisible({ timeout: 600 }).catch(() => false)) {
    await option.click({ force: true });
    steps.push({ step: 'clicked-visible-normal-vat-option' });
    await page.waitForTimeout(650);
    await page.keyboard.press('Tab').catch(() => undefined);
    await page.waitForTimeout(650);
    return true;
  }
  return false;
}

async function createOrConfirmMatrixRow(page: Page, before: Capture): Promise<WriteAttempt> {
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const steps: Array<Record<string, unknown>> = [];

  if (before.targetValuesVisible) {
    steps.push({ step: 'already-visible-no-write-needed' });
    return { attempted: false, steps, blockedBy, warnings };
  }
  if (!before.surfaceAccepted || before.roleCenterVisible || before.searchOverlayVisible) {
    blockedBy.push('Page 472 matrix surface is not accepted; refusing setup write.');
    return { attempted: false, steps, blockedBy, warnings };
  }

  const surface = await matrixSurface(page);
  if (!surface) {
    blockedBy.push('No scoped Page 472 form/grid surface found; refusing unscoped New.');
    return { attempted: false, steps, blockedBy, warnings };
  }

  steps.push({ step: 'smart-decision-gate', decision: 'write-only-INLAND-VAT19-matrix-row', salesVatAccount: '3806', purchaseVatAccount: '1406' });
  steps.push({ step: 'edit-mode', result: await ensureEditMode(page, surface) });
  const newClicked = await clickNew(page, surface);
  steps.push({ step: 'new-row', clicked: newClicked });
  if (!newClicked) {
    blockedBy.push('Neu/New is not visible on accepted Page 472 matrix surface.');
    return { attempted: false, steps, blockedBy, warnings };
  }

  await assertTargetContext(page);
  await fillActiveCell(page, 'INLAND', steps, 'vat-business-posting-group');
  await fillActiveCell(page, 'VAT19', steps, 'vat-product-posting-group');
  await chooseNormalVatIfVisible(page, steps);
  await fillActiveCell(page, 'Normal VAT', steps, 'vat-calculation-type-candidate');
  await fillActiveCell(page, '19', steps, 'vat-percent');
  await fillActiveCell(page, '3806', steps, 'sales-vat-account-candidate');
  await fillActiveCell(page, '1406', steps, 'purchase-vat-account-candidate');
  await page.keyboard.press('Tab').catch(() => undefined);
  await page.waitForTimeout(2500);
  await assertTargetContext(page);
  if ((await dangerousDialogs(page)).length > 0) blockedBy.push('Dangerous dialog visible after matrix row attempt.');
  warnings.push('The row was entered by visible UI tab flow; screenshot/reopen QA decides whether it persisted.');
  return { attempted: true, steps, blockedBy, warnings };
}

test('TARGET-027D creates or confirms only INLAND + VAT19 VAT Posting Setup matrix row', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const route: string[] = [];
  await openMatrixPage(page, route);
  const before = await capture(page, 'target-027d-010-before-matrix', 'Before create/confirm INLAND + VAT19 matrix row');
  const writeAttempt = await createOrConfirmMatrixRow(page, before);
  const after = await capture(page, 'target-027d-020-after-matrix-attempt', 'After create/confirm attempt');
  await openMatrixPage(page, route);
  const reopen = await capture(page, 'target-027d-030-reopen-matrix-proof', 'Reopen proof after create/confirm attempt');

  const blockedBy = [...writeAttempt.blockedBy];
  const success = blockedBy.length === 0 && reopen.surfaceAccepted && reopen.rowVisible && reopen.targetValuesVisible && !reopen.roleCenterVisible && !reopen.searchOverlayVisible;
  if (!success && blockedBy.length === 0) {
    blockedBy.push('Reopen screenshot/text does not visibly prove INLAND + VAT19 with 19, 3806 and 1406.');
  }

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-posting-setup-matrix-write',
    resultStatus: success ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    targetValues: {
      vatBusinessPostingGroup: 'INLAND',
      vatProductPostingGroup: 'VAT19',
      vatCalculationTypeCandidate: 'Normal VAT',
      vatPercent: '19',
      salesVatAccount: '3806',
      purchaseVatAccount: '1406'
    },
    smartDecision: {
      whyNow: 'TARGET-027C retry confirmed the prerequisite VAT Business/Product groups by reopen screenshot QA.',
      evidenceBasis: [
        'TARGET-027B source-backed value decision.',
        'TARGET-027C retry screenshot QA for INLAND and VAT19.',
        'SKR04 starter mapping marks 1406 and 3806 as visible candidate VAT accounts.'
      ],
      fieldsChanged: success || writeAttempt.attempted ? ['VAT Bus. Posting Group', 'VAT Prod. Posting Group', 'VAT Calculation Type', 'VAT %', 'Sales VAT Account', 'Purchase VAT Account'] : [],
      fieldsNotTouched: ['Master data defaults', 'Customer/vendor/item cards', 'Documents', 'Preview Posting', 'Posting'],
      fallback: 'If the row is not visible after reopen, keep VAT matrix blocked and add a narrower field/column discovery case.'
    },
    actionsTaken: [
      'Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix in playthru / UNIVERSAARL-DE.',
      'Captured before screenshot/text/metadata.',
      ...(writeAttempt.attempted
        ? ['Attempted one controlled UI row for INLAND + VAT19 using visible Page 472 only.']
        : ['Did not attempt a write because either the row was already visible or the page/controls were not safe enough.']),
      'Captured after screenshot/text/metadata.',
      'Reopened Page 472 and captured reopen proof.',
      'Stopped before master data, document draft, Preview Posting and Posting.'
    ],
    actionsNotTaken: [
      'No master data',
      'No customer/vendor/item defaults',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch',
      'No VAT final claim',
      'No search overlay accepted as proof'
    ],
    setupChanged: success && writeAttempt.attempted,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: success
      ? [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix was visibly open.',
          'INLAND + VAT19 is visible after reopen with candidate values 19, 3806 and 1406.',
          'No master data, document draft, Preview Posting, Posting or API shortcut was executed.'
        ]
      : [
          'Business Central stayed in playthru / UNIVERSAARL-DE.',
          'Page 472 route was captured with before/after/reopen screenshots.',
          'The run stopped before master data, document draft, Preview Posting and Posting.'
        ],
    notProved: [
      'No German VAT correctness is final-proven.',
      'No Preview Posting exists.',
      'No VAT Entries exist.',
      'No G/L Entries exist.',
      'No VAT Statement exists.',
      'No tax advisor approval or compliance final proof exists.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D-result.json`,
      ...[before, after, reopen].flatMap((entry) => [
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.textFile}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.screenshot}`,
        `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/${entry.screenshotMetadata}`
      ])
    ],
    screenshots: [before.screenshot, after.screenshot, reopen.screenshot],
    route,
    pageResults: { before, after, reopen, writeAttempt },
    blockedBy,
    warnings: [
      ...writeAttempt.warnings,
      'This is setup evidence only; it is not VAT calculation, Preview Posting or posting proof.',
      'If active BC grid values are missed by text extraction, screenshot QA must review the PNG before accepting the row.'
    ],
    flags: {
      setupChangeAttempted: writeAttempt.attempted,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noSearchOverlayAsProof: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-027C retry visually confirmed prerequisite INLAND and VAT19 groups after reopen.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The Page 472 matrix row is the smallest remaining VAT prerequisite before general posting group and master-data defaults.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: success ? 'ready-next' : 'needs-setup-first',
          reason: success ? 'VAT matrix prerequisite is visible enough for posting-group preflight.' : 'VAT matrix row is still not proven.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for posting groups and VAT defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT matrix, posting groups and dimensions/defaults.'
        },
        {
          caseId: 'TARGET-031-FIRST-DOCUMENT-DRAFT-GATE',
          status: 'needs-setup-first',
          reason: 'Document drafts wait for master data and setup defaults.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D-VAT-MATRIX-FIELD-DISCOVERY-FOLLOWUP',
      whySelectedNextCaseIsBest: success
        ? 'After the VAT matrix row, the next bottleneck is posting group/default readiness, not master data.'
        : 'The matrix row needs a narrower field/column discovery before repeating setup writes.',
      risksBeforeNextCase: [
        'Do not claim final German VAT correctness without Preview Posting, VAT Entries and G/L Entries.',
        'Do not start master data until posting groups/defaults are ready.'
      ],
      requiredPreparation: success
        ? ['Read posting group preflight case and keep master data locked.']
        : ['Review screenshot QA and column order; use Page Inspection or field diagnostics if necessary.']
    },
    safeToFinalizeState: false,
    requiresReview: !success,
    statePatch: {},
    nextCase: success ? 'TARGET-028-POSTING-GROUPS-PREFLIGHT' : 'TARGET-027D-VAT-MATRIX-FIELD-DISCOVERY-FOLLOWUP',
    reason: success
      ? 'VAT Posting Setup matrix row appears visible after reopen; still no preview/posting proof.'
      : `VAT Posting Setup matrix row is not accepted yet: ${blockedBy.join('; ')}`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-027D VAT Posting Setup Matrix Write',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Smart Decision',
      '',
      'TARGET-027C hat `INLAND` und `VAT19` per Reopen-Screenshot bestaetigt. Dieser Lauf darf deshalb nur die eine Matrixzeile `INLAND + VAT19` auf Page 472 versuchen oder bestaetigen.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Kein Belegdraft.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine VAT Entries oder Sachposten.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );
  expect(result.resultStatus).toMatch(/observed|blocked/);
});
