import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(300_000);
test.skip(
  process.env.CUSTOMER_SETUP_VALUE_LIVE_APPROVED !== '1' || process.env.CUSTOMER_SETUP_VALUE_RUNNER_GUARD_CHECKED !== '1',
  'CUSTOMER-SETUP-VALUE-WRITE-GATE must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'CUSTOMER-SETUP-VALUE-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_CUSTOMER = 'U-CUST-100';
const TARGET_CUSTOMER_NAME = 'Saarland Maschinenbau AG';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'customer-setup-value-write-gate';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const CURRENT_USER_PATTERN = new RegExp(`Kaje${'tan'}[.\\s_-]*Kali${'cki'}`, 'gi');

type Scope = Page | Frame;

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

type FieldAttempt = {
  field: string;
  value: string;
  status: 'filled' | 'already-target' | 'blocked-conflicting-value' | 'not-found' | 'not-editable';
  before?: string;
  after?: string;
  error?: string;
};

const targetSetupValues = {
  customerPostingGroup: 'INLAND',
  genBusinessPostingGroup: 'INLAND',
  paymentTermsCode: 'NET30'
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(CURRENT_USER_PATTERN, '[user]')
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
  const url = new URL(process.env.CUSTOMER_SETUP_VALUE_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL must include a tenant/environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url;
}

function buildTargetUrl(pageId: number) {
  const url = targetInstanceUrl();
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('profile', 'Business Manager');
  return url.toString();
}

function sanitizeUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

async function fullText(page: Page) {
  const body = await pageText(page).catch(() => '');
  const frameTexts = await Promise.all(page.frames().map((frame) => frame.locator('body').innerText({ timeout: 1000 }).catch(() => '')));
  return clean(`${body}\n${frameTexts.join('\n')}`);
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
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
  return {
    screenshot: `${EVIDENCE_DIR_REL}/${fileName}`,
    screenshotMetadata: `${EVIDENCE_DIR_REL}/${path.basename(metadataPath)}`
  };
}

async function capture(page: Page, fileName: string, metadata: Record<string, unknown>, captures: Capture[]) {
  const shot = await screenshotWithMetadata(page, fileName, metadata);
  captures.push(shot);
  return shot;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function customerListSignalCount(text: string) {
  return [/Debitor|Customer|Kunde/i, /Nr\.|No\.|Name/i].filter((signal) => signal.test(text)).length;
}

function hasBillingSignals(text: string) {
  return [
    /Fakturierung|Invoicing/i,
    /Debitorenbuchungsgruppe|Customer Posting Group/i,
    /Geschaeftsbuchungsgruppe|Geschäftsbuchungsgruppe|Gen\.?\s*Bus/i
  ].filter((signal) => signal.test(text)).length;
}

function hasPaymentSignals(text: string) {
  return [
    /Zahlungen|Payment/i,
    /Zahlungsbeding|Zlg\.-Bedingungscode|Payment Terms/i,
    /Zahlungsform|Payment Method/i
  ].filter((signal) => signal.test(text)).length;
}

async function visibleCustomerCard(page: Page) {
  const titlePattern = new RegExp(`${escapeRegExp(TARGET_CUSTOMER)}\\s*[.-]?\\s*${escapeRegExp(TARGET_CUSTOMER_NAME)}`, 'i');
  for (const scope of [page, ...page.frames()]) {
    const cardTitle = scope.getByText(titlePattern).first();
    if (await cardTitle.isVisible({ timeout: 700 }).catch(() => false)) return true;
    const hasCardLabel = await scope.getByText(/Debitorenkarte|Customer Card/i).first().isVisible({ timeout: 300 }).catch(() => false);
    const hasNo = await scope.getByText(new RegExp(escapeRegExp(TARGET_CUSTOMER), 'i')).first().isVisible({ timeout: 300 }).catch(() => false);
    const hasName = await scope.getByText(new RegExp(escapeRegExp(TARGET_CUSTOMER_NAME), 'i')).first().isVisible({ timeout: 300 }).catch(() => false);
    if (hasCardLabel && hasNo && hasName) return true;
  }
  return false;
}

async function clickFirstVisible(page: Page, label: RegExp) {
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const candidates: Array<{ name: string; locator: Locator }> = [
      { name: 'role-link', locator: scope.getByRole('link', { name: label }).first() },
      { name: 'role-button', locator: scope.getByRole('button', { name: label }).first() },
      { name: 'role-menuitem', locator: scope.getByRole('menuitem', { name: label }).first() },
      { name: 'anchor-text', locator: scope.locator('a').filter({ hasText: label }).first() },
      { name: 'visible-text', locator: scope.getByText(label).first() }
    ];
    for (const candidate of candidates) {
      if (await candidate.locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await candidate.locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
        await candidate.locator.hover({ timeout: 1000 }).catch(() => undefined);
        await page.waitForTimeout(250);
        await candidate.locator.click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        return `${candidate.name}-scope-${scopeIndex}`;
      }
    }
  }
  return '';
}

async function openCustomerList(page: Page) {
  await page.goto(buildTargetUrl(22), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await expect.poll(async () => page.url(), { timeout: 30_000 }).toContain(EXPECTED_INSTANCE);

  let text = await fullText(page);
  if (customerListSignalCount(text) < 2 || !new RegExp(TARGET_CUSTOMER, 'i').test(text)) {
    const routeUsed = await clickFirstVisible(page, /^Debitoren\b|^Customers\b|^Kunden\b/i);
    if (routeUsed) {
      await waitForBusinessCentralShell(page);
      await dismissTours(page);
      await page.waitForTimeout(2000);
      await expect.poll(async () => customerListSignalCount(await fullText(page)), { timeout: 20_000 }).toBeGreaterThanOrEqual(2);
      text = await fullText(page);
    }
  }
  return text;
}

async function waitForCardContext(page: Page, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    await waitForBusinessCentralShell(page).catch(() => undefined);
    await dismissTours(page).catch(() => undefined);
    if (await visibleCustomerCard(page)) return true;
    await page.waitForTimeout(500);
  }
  return false;
}

async function openExistingCustomerCard(page: Page) {
  const attemptedRoutes: string[] = [];
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const customerNo = scope.getByText(new RegExp(`^\\s*${TARGET_CUSTOMER}\\s*$`, 'i')).first();
    if (!(await customerNo.isVisible({ timeout: 1500 }).catch(() => false))) continue;
    await customerNo.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
    attemptedRoutes.push(`row-double-click-scope-${scopeIndex}`);
    await customerNo.dblclick({ timeout: 5000 }).catch(() => undefined);
    if (await waitForCardContext(page)) return attemptedRoutes.join(' -> ');

    attemptedRoutes.push(`row-enter-scope-${scopeIndex}`);
    await customerNo.click({ timeout: 5000 }).catch(() => undefined);
    await page.keyboard.press('Enter').catch(() => undefined);
    if (await waitForCardContext(page)) return attemptedRoutes.join(' -> ');
  }
  return attemptedRoutes.join(' -> ');
}

async function returnToCustomerListFromCard(page: Page) {
  if (!(await visibleCustomerCard(page))) return '';
  const route = await clickFirstVisible(page, /^Zuruck$|^Zurück$|^Back$/i);
  if (route) {
    await page.waitForTimeout(1500);
    await waitForBusinessCentralShell(page).catch(() => undefined);
    return route;
  }
  await page.keyboard.press('Alt+ArrowLeft').catch(() => undefined);
  await page.waitForTimeout(1500);
  await waitForBusinessCentralShell(page).catch(() => undefined);
  return 'keyboard-alt-left';
}

async function clickEditIfPresent(page: Page) {
  for (const label of [/^Bearbeiten$/i, /^Edit$/i]) {
    const route = await clickFirstVisible(page, label);
    if (route) {
      await page.waitForTimeout(1000);
      await waitForBusinessCentralShell(page).catch(() => undefined);
      return route;
    }
  }
  return '';
}

async function clickVisibleMoreShow(page: Page) {
  const clicked: string[] = [];
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const more = scope.getByText(/^Mehr anzeigen$|^Show more$/i);
    const count = Math.min(await more.count().catch(() => 0), 10);
    for (let index = 0; index < count; index += 1) {
      const locator = more.nth(index);
      if (!(await locator.isVisible({ timeout: 500 }).catch(() => false))) continue;
      await locator.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
      await locator.click({ timeout: 3000 }).catch(() => undefined);
      clicked.push(`show-more-scope-${scopeIndex}-${index}`);
      await page.waitForTimeout(500);
    }
  }
  return clicked;
}

async function scrollCustomerCardDown(page: Page, amount = 700) {
  const routes: string[] = [];
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const scrolled = await scope
      .evaluate((scrollAmount) => {
        const entries = Array.from(document.querySelectorAll<HTMLElement>('body, main, section, div'))
          .map((element, index) => {
            const rect = element.getBoundingClientRect();
            return { element, index, rect, canScroll: element.scrollHeight > element.clientHeight + 120 };
          })
          .filter(({ rect, canScroll }) => canScroll && rect.left >= 300 && rect.left < 1400 && rect.top < 1200 && rect.height > 300)
          .sort((a, b) => b.rect.height - a.rect.height);
        const target = entries[0];
        if (!target) {
          window.scrollBy(0, scrollAmount);
          return 'window-scroll';
        }
        target.element.scrollTop += scrollAmount;
        return `element-${target.index}-scrollTop-${Math.round(target.element.scrollTop)}`;
      }, amount)
      .catch(() => '');
    if (scrolled) routes.push(`scope-${scopeIndex}:${scrolled}`);
  }
  await page.waitForTimeout(600);
  return routes;
}

async function expandFastTab(page: Page, label: 'Fakturierung' | 'Zahlungen') {
  const exactHeading = new RegExp(`^\\s*\\*?\\s*${label}\\s*>?\\s*$`, 'i');
  const routes: string[] = [];
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const candidateGroups: Array<{ name: string; locator: Locator }> = [
      { name: 'exact-heading-button', locator: scope.getByRole('button', { name: exactHeading }) },
      { name: 'exact-heading-text', locator: scope.getByText(exactHeading) }
    ];
    for (const candidateGroup of candidateGroups) {
      const count = Math.min(await candidateGroup.locator.count().catch(() => 0), 20);
      for (let index = 0; index < count; index += 1) {
        const candidate = candidateGroup.locator.nth(index);
        if (!(await candidate.isVisible({ timeout: 700 }).catch(() => false))) continue;
        const box = await candidate.boundingBox().catch(() => null);
        if (box && (box.x > 1300 || box.y < 500)) continue;
        await candidate
          .evaluate((element) => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            element.scrollIntoView({ block: 'center', inline: 'nearest' });
          })
          .catch(() => undefined);
        await page.waitForTimeout(500);
        await candidate.click({ timeout: 5000 }).catch(async () => {
          await candidate.evaluate((element) => {
            element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          });
        });
        await page.waitForTimeout(1000);
        const text = await fullText(page);
        if (label === 'Fakturierung' && hasBillingSignals(text) < 2) continue;
        if (label === 'Zahlungen' && hasPaymentSignals(text) < 2) continue;
        routes.push(`${candidateGroup.name}-${index}-scope-${scopeIndex}`);
        return routes;
      }
    }
  }
  return routes;
}

async function collectVisibleInputValues(page: Page) {
  const values: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
    const count = Math.min(await inputs.count().catch(() => 0), 350);
    for (let index = 0; index < count; index += 1) {
      const candidate = inputs.nth(index);
      if (!(await candidate.isVisible({ timeout: 200 }).catch(() => false))) continue;
      const value = clean(await candidate.inputValue({ timeout: 200 }).catch(async () => candidate.innerText({ timeout: 200 }).catch(() => '')));
      if (value) values.push(value);
    }
  }
  return Array.from(new Set(values)).slice(0, 120);
}

async function findInputByLabel(scope: Scope, label: RegExp) {
  const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
  const count = Math.min(await inputs.count().catch(() => 0), 350);
  for (let index = 0; index < count; index += 1) {
    const candidate = inputs.nth(index);
    const meta = await candidate
      .evaluate((node) => {
        const element = node as HTMLElement;
        const labelledBy = (element.getAttribute('aria-labelledby') ?? '')
          .split(/\s+/)
          .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '')
          .join(' ');
        return [
          element.getAttribute('aria-label'),
          labelledBy,
          element.getAttribute('title'),
          element.getAttribute('placeholder'),
          element.getAttribute('name'),
          element.getAttribute('controlname'),
          element.id
        ]
          .filter(Boolean)
          .join(' ');
      })
      .catch(() => '');
    if (label.test(meta) && (await candidate.isVisible({ timeout: 500 }).catch(() => false))) return candidate;
  }
  return null;
}

async function findInputNearVisualLabel(scope: Scope, label: RegExp) {
  const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
  const count = Math.min(await inputs.count().catch(() => 0), 350);
  for (let index = 0; index < count; index += 1) {
    const candidate = inputs.nth(index);
    if (!(await candidate.isVisible({ timeout: 500 }).catch(() => false))) continue;
    const near = await candidate
      .evaluate(
        (node, args) => {
          const element = node as HTMLElement;
          const inputRect = element.getBoundingClientRect();
          const pattern = new RegExp(args.source, args.flags);
          const visible = (el: Element) => {
            const rect = (el as HTMLElement).getBoundingClientRect();
            const style = window.getComputedStyle(el as HTMLElement);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const labels = Array.from(document.body.querySelectorAll('label, span, div, p, button'))
            .filter(visible)
            .map((el) => ({ text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(), rect: (el as HTMLElement).getBoundingClientRect() }))
            .filter(({ text }) => pattern.test(text));
          return labels.some(({ rect }) => {
            const sameRow = Math.abs(rect.top + rect.height / 2 - (inputRect.top + inputRect.height / 2)) < 28;
            const leftLabel = rect.left < inputRect.left && inputRect.left - rect.right < 620;
            return sameRow && leftLabel;
          });
        },
        { source: label.source, flags: label.flags }
      )
      .catch(() => false);
    if (near) return candidate;
  }
  return null;
}

async function findEditableInput(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const locator = (await findInputByLabel(scope, label)) ?? (await findInputNearVisualLabel(scope, label));
    if (locator) return locator;
  }
  return null;
}

async function fillSetupField(page: Page, field: string, label: RegExp, value: string): Promise<FieldAttempt> {
  const locator = await findEditableInput(page, label);
  if (!locator) return { field, value, status: 'not-found' };
  const before = clean(await locator.inputValue({ timeout: 1000 }).catch(async () => locator.innerText({ timeout: 1000 }).catch(() => '')));
  if (before === value) return { field, value, status: 'already-target', before, after: before };
  if (before && before !== value) return { field, value, status: 'blocked-conflicting-value', before, after: before };
  try {
    await locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
    await locator.click({ timeout: 3000 });
    await locator.fill(value, { timeout: 5000 });
    await page.keyboard.press('Tab').catch(() => undefined);
    await page.waitForTimeout(1000);
    const after = clean(await locator.inputValue({ timeout: 1000 }).catch(async () => locator.innerText({ timeout: 1000 }).catch(() => '')));
    if (after === value) return { field, value, status: 'filled', before, after };
    return { field, value, status: 'not-editable', before, after, error: 'value-did-not-persist-in-editor' };
  } catch (error) {
    return {
      field,
      value,
      status: 'not-editable',
      before,
      error: String(error instanceof Error ? error.message : error)
    };
  }
}

async function fillAllowedSetupFields(page: Page, captures: Capture[]) {
  const attempts: FieldAttempt[] = [];
  const billingRoute = await expandFastTab(page, 'Fakturierung');
  await clickVisibleMoreShow(page);
  await capture(
    page,
    'customer-setup-value-012-billing-route-before-fields.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Fakturierung FastTab route before writing posting group values',
      route: billingRoute,
      visibleInputValues: await collectVisibleInputValues(page),
      visibleSignals: (await fullText(page)).split('\n').filter((line) => /Fakturierung|Buchungsgruppe|Posting Group|INLAND/i.test(line)).slice(0, 120),
      internallyProves: billingRoute.length ? 'Fakturierung route was reached before writing bounded setup values.' : 'Fakturierung route was not accepted.',
      doesNotProve: ['No VAT correctness', 'No O2C readiness', 'No posting readiness']
    },
    captures
  );
  attempts.push(
    await fillSetupField(
      page,
      'Customer Posting Group',
      /Debitorenbuchungsgruppe|Customer Posting Group/i,
      targetSetupValues.customerPostingGroup
    )
  );
  attempts.push(
    await fillSetupField(
      page,
      'Gen. Business Posting Group',
      /Geschaeftsbuchungsgruppe|Geschäftsbuchungsgruppe|Gen\.?\s*Bus\.?\s*Posting Group|Gen\.?\s*Business Posting Group/i,
      targetSetupValues.genBusinessPostingGroup
    )
  );
  let paymentRoute: string[] = [];
  const paymentScrollRoutes: string[] = [];
  for (let attempt = 0; attempt < 5 && paymentRoute.length === 0; attempt += 1) {
    paymentScrollRoutes.push(...(await scrollCustomerCardDown(page, 650)));
    await page.mouse.wheel(0, 700).catch(() => undefined);
    await page.waitForTimeout(400);
    paymentRoute = await expandFastTab(page, 'Zahlungen');
  }
  await clickVisibleMoreShow(page);
  await capture(
    page,
    'customer-setup-value-014-payments-route-before-field.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Zahlungen FastTab route before writing payment terms value',
      route: paymentRoute,
      scrollRoute: paymentScrollRoutes,
      visibleInputValues: await collectVisibleInputValues(page),
      visibleSignals: (await fullText(page)).split('\n').filter((line) => /Zahlungen|Zahlungsbeding|Zlg|Payment Terms|NET30/i.test(line)).slice(0, 120),
      internallyProves: paymentRoute.length ? 'Zahlungen route was reached before writing Payment Terms Code.' : 'Zahlungen route was not accepted.',
      doesNotProve: ['No invoice due-date calculation', 'No O2C readiness', 'No payment readiness']
    },
    captures
  );
  attempts.push(
    await fillSetupField(
      page,
      'Payment Terms Code',
      /Zahlungsbedingungscode|Zahlungsbedingungen|Zlg\.-Bedingungscode|Zlg\.-Bedingung|Payment Terms Code/i,
      targetSetupValues.paymentTermsCode
    )
  );
  return attempts;
}

function setupValuesAccepted(values: string[]) {
  const joined = values.join('\n');
  return /INLAND/i.test(joined) && /NET30/i.test(joined);
}

function anyForbiddenValueChanged(values: string[]) {
  const joined = values.join('\n');
  return /VAT19|MWST|MwSt|Zahlungsform|Payment Method|DEPARTMENT|COSTCENTER|PRODUCTLINE/i.test(joined);
}

test('CUSTOMER-SETUP-VALUE-WRITE-GATE writes only bounded setup values on U-CUST-100', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const blockedBy: string[] = [];
  const actionsTaken: string[] = [];

  const listText = await openCustomerList(page);
  if (!/U-CUST-100/i.test(listText)) blockedBy.push('U-CUST-100 was not visible in the customer list.');

  const openRoute = await openExistingCustomerCard(page);
  const beforeText = await fullText(page);
  const beforeCardAccepted = await visibleCustomerCard(page);
  if (!beforeCardAccepted) blockedBy.push('U-CUST-100 customer card was not screenshot-proven before write.');

  await capture(
    page,
    'customer-setup-value-010-before-card.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Before bounded customer setup value write',
      openRoute,
      visibleInputValues: await collectVisibleInputValues(page),
      visibleSignals: beforeText.split('\n').slice(0, 160),
      internallyProves: beforeCardAccepted ? 'U-CUST-100 customer card is visible before setup value write.' : 'Customer card context is not accepted.',
      doesNotProve: ['No O2C readiness', 'No posting readiness', 'No VAT setup correctness'],
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );

  let fieldAttempts: FieldAttempt[] = [];
  let masterDataChanged = false;
  if (blockedBy.length === 0) {
    const editRoute = await clickEditIfPresent(page);
    if (editRoute) actionsTaken.push(`Clicked safe Edit/Bearbeiten action through ${editRoute}.`);
    fieldAttempts = await fillAllowedSetupFields(page, captures);
    const badAttempts = fieldAttempts.filter((attempt) => attempt.status === 'not-found' || attempt.status === 'not-editable' || attempt.status === 'blocked-conflicting-value');
    if (badAttempts.length) {
      blockedBy.push(`Setup fields were not safely writable: ${badAttempts.map((attempt) => `${attempt.field}=${attempt.status}`).join(', ')}`);
    } else {
      await page.keyboard.press('Control+S').catch(() => undefined);
      await page.waitForTimeout(2500);
      actionsTaken.push('Filled or verified only Customer Posting Group, Gen. Business Posting Group and Payment Terms Code.');
    }
    masterDataChanged = fieldAttempts.some((attempt) => attempt.status === 'filled');
  }

  const afterText = await fullText(page);
  const afterValues = await collectVisibleInputValues(page);
  const afterAccepted = setupValuesAccepted(afterValues);
  if (blockedBy.length === 0 && !afterAccepted) blockedBy.push('The intended setup values were not visible after save/autosave.');
  if (anyForbiddenValueChanged(afterValues)) blockedBy.push('A forbidden setup value signal appears in visible inputs after the write gate.');

  await capture(
    page,
    'customer-setup-value-020-after-save.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'After bounded customer setup value write',
      fieldAttempts,
      visibleInputValues: afterValues,
      visibleSignals: afterText.split('\n').slice(0, 180),
      internallyProves: afterAccepted ? 'INLAND and NET30 are visible after the setup value route.' : 'The target setup values are not accepted after the route.',
      doesNotProve: ['No invoice due-date behavior', 'No O2C readiness', 'No Preview Posting or Posting'],
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );

  await returnToCustomerListFromCard(page);
  await openExistingCustomerCard(page);
  const reopenBillingRoute = await expandFastTab(page, 'Fakturierung');
  await clickVisibleMoreShow(page);
  const reopenBillingText = await fullText(page);
  const reopenBillingValues = await collectVisibleInputValues(page);
  await capture(
    page,
    'customer-setup-value-030-reopen-billing-proof.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Reopen proof for billing setup values',
      route: reopenBillingRoute,
      visibleInputValues: reopenBillingValues,
      visibleSignals: reopenBillingText.split('\n').filter((line) => /Fakturierung|Buchungsgruppe|Posting Group|INLAND/i.test(line)).slice(0, 140),
      internallyProves: /INLAND/i.test(reopenBillingValues.join('\n')) ? 'Reopen proof visibly shows INLAND billing setup values.' : 'Reopen billing proof did not visibly show INLAND.',
      doesNotProve: ['No VAT correctness', 'No O2C readiness', 'No posting readiness'],
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );
  const reopenPaymentScrollRoutes: string[] = [];
  let reopenPaymentRoute: string[] = [];
  for (let attempt = 0; attempt < 5 && reopenPaymentRoute.length === 0; attempt += 1) {
    reopenPaymentScrollRoutes.push(...(await scrollCustomerCardDown(page, 650)));
    await page.mouse.wheel(0, 700).catch(() => undefined);
    await page.waitForTimeout(400);
    reopenPaymentRoute = await expandFastTab(page, 'Zahlungen');
  }
  await clickVisibleMoreShow(page);
  const reopenText = await fullText(page);
  const reopenValues = await collectVisibleInputValues(page);
  const reopenAccepted = setupValuesAccepted(reopenValues);
  if (blockedBy.length === 0 && !reopenAccepted) blockedBy.push('Reopen proof did not show the intended setup values.');

  await capture(
    page,
    'customer-setup-value-032-reopen-payment-proof.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Reopen proof for payment terms after bounded customer setup value write',
      route: reopenPaymentRoute,
      scrollRoute: reopenPaymentScrollRoutes,
      visibleInputValues: reopenValues,
      visibleSignals: reopenText.split('\n').slice(0, 180),
      internallyProves: /NET30/i.test(reopenValues.join('\n')) ? 'Reopen proof visibly shows NET30 persisted on U-CUST-100.' : 'Reopen payment proof did not visibly show NET30.',
      doesNotProve: ['No invoice due-date behavior', 'No VAT Business Posting Group', 'No dimensions', 'No document', 'No Preview Posting', 'No Posting', 'No UAT acceptance'],
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );

  const compact = clean(
    await compactPageText(page, {
      include: [
        /U-CUST-100|Saarland Maschinenbau|Debitorenkarte|Customer Card|Debitorenbuchungsgruppe|Customer Posting Group|Geschaeftsbuchungsgruppe|Geschäftsbuchungsgruppe|Payment Terms|Zahlungsbedingung|INLAND|NET30|VAT|USt|MwSt|Dimension/i
      ],
      maxLines: 280,
      maxLineLength: 260
    }).catch(() => '')
  );
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'customer-setup-value-context.txt'), compact || clean(`${beforeText}\n${afterText}\n${reopenText}`));

  const anyTargetFieldObserved = fieldAttempts.some((attempt) => attempt.status === 'filled' || attempt.status === 'already-target');
  const resultStatus =
    blockedBy.length === 0 && reopenAccepted
      ? masterDataChanged
        ? 'observed-masterdata-setup-written'
        : 'observed-already-set'
      : anyTargetFieldObserved
        ? 'partially-completed-blocked'
        : 'blocked';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-controlled-customer-setup-value-write-gate',
    resultStatus,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Debitorenkarte / Customer Card',
    url: sanitizeUrl(page.url()),
    liveActionsExecuted: true,
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    setupChanged: false,
    masterDataChanged,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    confidentialRealCustomerDataUsed: false,
    targetCustomer: {
      no: TARGET_CUSTOMER,
      name: TARGET_CUSTOMER_NAME
    },
    selectedValues: targetSetupValues,
    fieldAttempts,
    actionsTaken: [
      'Opened guarded Business Central context for playthru / UNIVERSAARL-DE.',
      'Opened customer list and U-CUST-100 customer card.',
      ...actionsTaken,
      'Captured before, after and reopen proof screenshots.'
    ],
    actionsNotTaken: [
      'No VAT setup changed.',
      'No VAT Business Posting Group intentionally changed.',
      'No dimensions changed.',
      'No payment method changed.',
      'No sales document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No confidential real customer data used.'
    ],
    screenshots: captures.map((entry) => entry.screenshot),
    screenshotQa: {
      requiredCheckpoints: ['before U-CUST-100 setup values', 'after setup value route', 'reopen proof'],
      capturedCheckpoints: captures.map((entry) => entry.screenshot),
      acceptedForCustomerSetupValues: blockedBy.length === 0 && reopenAccepted,
      acceptedForO2CReady: false,
      acceptedForPostingReady: false
    },
    proved:
      blockedBy.length === 0 && reopenAccepted
        ? [
            'playthru / UNIVERSAARL-DE was used.',
            'U-CUST-100 / Saarland Maschinenbau AG customer card was used.',
            'INLAND and NET30 setup values are visible after reopen proof.',
            'No document, Preview Posting, Posting, payment or API shortcut was executed.'
          ]
        : [
            'playthru / UNIVERSAARL-DE was used.',
            'U-CUST-100 customer setup value route was attempted through a guarded case.',
            'No document, Preview Posting, Posting, payment or API shortcut was executed.'
          ],
    notProved: [
      'No VAT Business Posting Group value was intentionally set or proven.',
      'No dimension defaults.',
      'No payment method.',
      'No invoice due-date calculation.',
      'No O2C readiness.',
      'No Preview Posting, Posting, payment or ledger trace.',
      'No UAT acceptance.'
    ],
    blockedBy,
    warnings: [
      'This is real Business Central UI evidence in playthru, not a UI mockup.',
      'U-CUST-100 and selected setup values are realistic fictional Universaarl training/project data, not confidential real customer data.',
      'Customer setup values do not prove invoice behavior until a later document case calculates and validates due dates and posting outcomes.'
    ],
    flags: {
      noVatSetupChange: true,
      noDimensionChange: true,
      noPaymentMethodChange: true,
      noDraft: true,
      noPreview: true,
      noPost: true,
      noPayment: true,
      noApiShortcut: true,
      noConfidentialRealCustomerData: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF',
      lastEvidenceSummary:
        blockedBy.length === 0 && reopenAccepted
          ? 'U-CUST-100 shows INLAND/INLAND/NET30 setup values after reopen proof.'
          : 'Customer setup value write gate did not prove all target values.',
      isPlannedNextCaseStillSensible: blockedBy.length === 0 && reopenAccepted,
      reason:
        blockedBy.length === 0 && reopenAccepted
          ? 'A narrow customer setup proof exists; a separate review/readiness proof can decide whether O2C route planning is next.'
          : 'Do not continue to O2C or setup readiness while customer setup values are not proven.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF',
          status: blockedBy.length === 0 && reopenAccepted ? 'ready-next' : 'blocked',
          reason: blockedBy.length === 0 && reopenAccepted ? 'Customer setup values have reopen proof.' : 'Customer setup values remain blocked.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: blockedBy.length === 0 && reopenAccepted ? 'ready-after-current' : 'needs-setup-first',
          reason: 'O2C still needs VAT/item/posting boundaries even after customer setup values.'
        },
        {
          caseId: 'CUSTOMER-VAT-DIMENSION-BOUNDARY-DECISION',
          status: 'needs-source-check-first',
          reason: 'VAT Business Posting Group, dimensions and payment method were intentionally out of scope.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: blockedBy.length === 0 && reopenAccepted ? 'CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF' : 'CUSTOMER-SETUP-VALUE-WRITE-GATE-RECOVERY',
      whySelectedNextCaseIsBest:
        blockedBy.length === 0 && reopenAccepted
          ? 'A separate proof/readiness review prevents jumping directly from field writes into O2C without checking the evidence boundary.'
          : 'Recover the customer setup value route before any further process work.',
      risksBeforeNextCase: ['Do not treat these setup fields as posting readiness or VAT correctness.'],
      requiredPreparation:
        blockedBy.length === 0 && reopenAccepted
          ? ['Review screenshots and decide whether VAT/dimension boundary is parked or must be resolved before O2C.']
          : ['Diagnose visible fields, FastTabs, lookup/dropdown behavior and screenshot QA before retrying.']
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/customer-setup-value-context.txt`,
      ...captures.flatMap((entry) => [entry.screenshot, entry.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/result.json`
    ],
    nextCase: blockedBy.length === 0 && reopenAccepted ? 'CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF' : 'CUSTOMER-SETUP-VALUE-WRITE-GATE-RECOVERY',
    requiresReview: blockedBy.length > 0,
    safeToFinalizeState: blockedBy.length === 0 && reopenAccepted
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# CUSTOMER-SETUP-VALUE-WRITE-GATE',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      'Dieser Lauf setzt oder prueft nur drei Setupwerte auf dem bestehenden Debitor U-CUST-100:',
      '',
      '- Debitorenbuchungsgruppe: INLAND',
      '- Geschaeftsbuchungsgruppe: INLAND',
      '- Zahlungsbedingungscode: NET30',
      '',
      'Nicht enthalten: keine USt.-Einrichtung, keine Dimensionen, keine Zahlungsform, kein Beleg, keine Buchungsvorschau, keine Buchung, kein API Shortcut und keine vertraulichen echten Kundendaten.',
      '',
      '## Evidence-Dateien',
      '',
      ...result.evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
