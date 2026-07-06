import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1350 }
});

test.setTimeout(240_000);
test.skip(
  process.env.CUSTOMER_U_CUST_100_CONVERSION_LIVE_APPROVED !== '1' ||
    process.env.CUSTOMER_U_CUST_100_CONVERSION_RUNNER_GUARD_CHECKED !== '1',
  'CUSTOMER-U-CUST-100-IDENTITY-CONVERSION-WRITE-GATE must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'CUSTOMER-U-CUST-100-IDENTITY-CONVERSION-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_CUSTOMER = 'U-CUST-100';
const PLACEHOLDER_NAME = 'Universaarl Kunde 100';
const TARGET_NAME = 'Saarland Maschinenbau AG';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'customer-u-cust-100-identity-conversion-write-gate';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const CURRENT_USER_PATTERN = new RegExp(`Kaje${'tan'}[.\\s_-]*Kali${'cki'}`, 'gi');

const targetValues = {
  name: TARGET_NAME,
  searchName: 'SAARLAND MASCHINENBAU AG',
  address: 'Hafenstrasse 12',
  postCode: '66111',
  city: 'Saarbruecken',
  countryRegionCode: 'DE',
  contact: 'Martina Weber',
  email: 'einkauf@example.invalid'
};

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
};

type FillAttempt = {
  field: string;
  label: string;
  value: string;
  status: 'filled' | 'already-target' | 'not-found' | 'not-editable';
  before?: string;
  after?: string;
  error?: string;
};

type Scope = Page | Frame;

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
  const url = new URL(process.env.CUSTOMER_U_CUST_100_CONVERSION_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  const segments = url.pathname.split('/').filter(Boolean);
  if (!segments.length) throw new Error('Business Central URL must include a tenant/environment path.');
  segments[segments.length - 1] = EXPECTED_INSTANCE;
  url.pathname = `/${segments.join('/')}`;
  url.searchParams.set('company', TARGET_COMPANY);
  if (!url.pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE)) {
    throw new Error('Target URL must resolve to playthru before navigation.');
  }
  if ((url.searchParams.get('company') ?? '').toUpperCase() !== TARGET_COMPANY) {
    throw new Error('Target URL must resolve to UNIVERSAARL-DE before navigation.');
  }
  return url;
}

function buildTargetUrl(pageId: number, filter?: string) {
  const url = targetInstanceUrl();
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  if (filter) url.searchParams.set('filter', filter);
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

async function captureReadOnlyCheckpoint(page: Page, fileName: string, metadata: Record<string, unknown>, captures: Capture[]) {
  const shot = await screenshotWithMetadata(page, fileName, metadata);
  captures.push(shot);
  return shot;
}

function customerListSignalCount(text: string) {
  return [/Debitor|Customer|Kunde/i, /Nr\.|No\.|Name/i].filter((signal) => signal.test(text)).length;
}

function hasCardContext(text: string) {
  return /Debitorenkarte|Customer Card/i.test(text) && /U-CUST-100/i.test(text) && /Universaarl Kunde 100|Saarland Maschinenbau AG/i.test(text);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function visibleCustomerCard(page: Page, acceptedNames = [PLACEHOLDER_NAME, TARGET_NAME]) {
  const titlePattern = new RegExp(`${escapeRegExp(TARGET_CUSTOMER)}\\s*[·.-]?\\s*(${acceptedNames.map(escapeRegExp).join('|')})`, 'i');
  for (const scope of [page, ...page.frames()]) {
    const cardTitle = scope.getByText(titlePattern).first();
    if (await cardTitle.isVisible({ timeout: 700 }).catch(() => false)) return true;
    const hasCardLabel = await scope.getByText(/Debitorenkarte|Customer Card/i).first().isVisible({ timeout: 300 }).catch(() => false);
    const hasNo = await scope.getByText(new RegExp(escapeRegExp(TARGET_CUSTOMER), 'i')).first().isVisible({ timeout: 300 }).catch(() => false);
    const hasName = await Promise.any(
      acceptedNames.map((name) => scope.getByText(new RegExp(escapeRegExp(name), 'i')).first().isVisible({ timeout: 300 }).catch(() => false))
    ).catch(() => false);
    if (hasCardLabel && hasNo && hasName) return true;
  }
  return false;
}

async function visibleInputValue(page: Page, expectedValue: string) {
  for (const scope of [page, ...page.frames()]) {
    const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
    const count = Math.min(await inputs.count().catch(() => 0), 300);
    for (let index = 0; index < count; index += 1) {
      const candidate = inputs.nth(index);
      if (!(await candidate.isVisible({ timeout: 300 }).catch(() => false))) continue;
      const value = clean(await candidate.inputValue({ timeout: 300 }).catch(async () => candidate.innerText({ timeout: 300 }).catch(() => '')));
      if (value === expectedValue) return true;
    }
  }
  return false;
}

async function collectVisibleInputValues(page: Page) {
  const values: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
    const count = Math.min(await inputs.count().catch(() => 0), 300);
    for (let index = 0; index < count; index += 1) {
      const candidate = inputs.nth(index);
      if (!(await candidate.isVisible({ timeout: 200 }).catch(() => false))) continue;
      const value = clean(await candidate.inputValue({ timeout: 200 }).catch(async () => candidate.innerText({ timeout: 200 }).catch(() => '')));
      if (value) values.push(value);
    }
  }
  return Array.from(new Set(values)).slice(0, 80);
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
        await candidate.locator.click({ timeout: 5000 });
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
  const labels = [/^Bearbeiten$/i, /^Edit$/i];
  for (const label of labels) {
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
    const count = Math.min(await more.count().catch(() => 0), 8);
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

async function findInputByCurrentValue(scope: Scope, values: string[]) {
  const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
  const count = Math.min(await inputs.count().catch(() => 0), 300);
  for (let index = 0; index < count; index += 1) {
    const candidate = inputs.nth(index);
    if (!(await candidate.isVisible({ timeout: 500 }).catch(() => false))) continue;
    const value = clean(await candidate.inputValue({ timeout: 500 }).catch(async () => candidate.innerText({ timeout: 500 }).catch(() => '')));
    if (values.includes(value)) return candidate;
  }
  return null;
}

async function findInputNearVisualLabel(scope: Scope, label: RegExp) {
  const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
  const count = Math.min(await inputs.count().catch(() => 0), 300);
  const labelSource = label.source;
  const labelFlags = label.flags;
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
          const candidates = Array.from(document.body.querySelectorAll('label, span, div, p, button'))
            .filter(visible)
            .map((el) => ({ text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(), rect: (el as HTMLElement).getBoundingClientRect() }))
            .filter(({ text }) => pattern.test(text));
          return candidates.some(({ rect }) => {
            const sameRow = Math.abs(rect.top + rect.height / 2 - (inputRect.top + inputRect.height / 2)) < 24;
            const leftLabel = rect.left < inputRect.left && inputRect.left - rect.right < 500;
            return sameRow && leftLabel;
          });
        },
        { source: labelSource, flags: labelFlags }
      )
      .catch(() => false);
    if (near) return candidate;
  }
  return null;
}

async function findInputByLabel(scope: Scope, label: RegExp) {
  const inputs = scope.locator('input, textarea, select, [contenteditable="true"]');
  const count = Math.min(await inputs.count().catch(() => 0), 300);
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

  const byLabel = scope.getByLabel(label).first();
  if (await byLabel.isVisible({ timeout: 500 }).catch(() => false)) {
    const tag = await byLabel.evaluate((node) => {
      const element = node as HTMLElement;
      return {
        tagName: element.tagName.toLowerCase(),
        contentEditable: element.getAttribute('contenteditable'),
        role: element.getAttribute('role')
      };
    }).catch(() => ({ tagName: '', contentEditable: '', role: '' }));
    if (['input', 'textarea', 'select'].includes(tag.tagName) || tag.contentEditable === 'true') return byLabel;
  }
  return null;
}

async function fillField(page: Page, field: string, label: RegExp, value: string, options: { currentValues?: string[] } = {}): Promise<FillAttempt> {
  for (const scope of [page, ...page.frames()]) {
    const locator =
      (options.currentValues?.length ? await findInputByCurrentValue(scope, options.currentValues) : null) ??
      (await findInputByLabel(scope, label)) ??
      (await findInputNearVisualLabel(scope, label));
    if (!locator) continue;
    const before = clean(await locator.inputValue({ timeout: 1000 }).catch(async () => locator.innerText({ timeout: 1000 }).catch(() => '')));
    if (before === value) return { field, label: String(label), value, status: 'already-target', before, after: before };
    try {
      await locator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
      await locator.click({ timeout: 3000 });
      await locator.fill(value, { timeout: 5000 });
      await page.keyboard.press('Tab').catch(() => undefined);
      await page.waitForTimeout(500);
      const after = clean(await locator.inputValue({ timeout: 1000 }).catch(async () => locator.innerText({ timeout: 1000 }).catch(() => '')));
      if (after === value) return { field, label: String(label), value, status: 'filled', before, after };
      return { field, label: String(label), value, status: 'not-editable', before, after, error: 'value-did-not-persist-in-editor' };
    } catch (error) {
      return {
        field,
        label: String(label),
        value,
        status: 'not-editable',
        before,
        error: String(error instanceof Error ? error.message : error)
      };
    }
  }
  return { field, label: String(label), value, status: 'not-found' };
}

async function fillIdentityFields(page: Page) {
  const attempts: FillAttempt[] = [];
  await clickVisibleMoreShow(page);
  const fields: Array<[string, RegExp, string, { currentValues?: string[] }?]> = [
    ['Name', /^Name$|Debitorenname|Customer Name/i, targetValues.name, { currentValues: [PLACEHOLDER_NAME, TARGET_NAME] }],
    ['Search Name', /Suchbegriff|Search Name/i, targetValues.searchName],
    ['Address', /^Adresse$|^Address$/i, targetValues.address],
    ['Post Code', /PLZ|PLZ-Code|Post Code/i, targetValues.postCode],
    ['City', /^Ort$|^City$/i, targetValues.city],
    ['Country/Region Code', /Länder|Lander|Laender|Länder-\/Regionscode|Lander-\/Regionscode|Länder.*Regionscode|Lander.*Regionscode|Country\/Region Code|Country.*Region/i, targetValues.countryRegionCode],
    ['Contact', /^Kontakt$|Kontaktname|^Contact$/i, targetValues.contact],
    ['E-Mail', /^E-Mail$|Email|E-Mail-Adresse/i, targetValues.email]
  ];
  for (const [field, label, value, options] of fields) attempts.push(await fillField(page, field, label, value, options));
  return attempts;
}

function targetIdentityVisible(text: string) {
  return (
    new RegExp(TARGET_NAME, 'i').test(text) &&
    /Hafenstrasse 12/i.test(text) &&
    /66111/i.test(text) &&
    /Saarbruecken/i.test(text)
  );
}

async function targetIdentityVisibleOnCard(page: Page) {
  return (
    (await visibleCustomerCard(page, [TARGET_NAME])) &&
    (await visibleInputValue(page, targetValues.address)) &&
    (await visibleInputValue(page, targetValues.postCode)) &&
    (await visibleInputValue(page, targetValues.city)) &&
    (await visibleInputValue(page, targetValues.contact)) &&
    (await visibleInputValue(page, targetValues.email))
  );
}

function forbiddenSetupSignalChanged(text: string) {
  return /Customer Posting Group\s+(?!\(Leer\)|Leer)|Debitorenbuchungsgruppe\s+(?!\(Leer\)|Leer)|Geschaeftsbuchungsgruppe\s+(?!\(Leer\)|Leer)|USt\.-Geschaeftsbuchungsgruppe\s+(?!\(Leer\)|Leer)/i.test(
    text
  );
}

test('CUSTOMER-U-CUST-100 identity conversion writes only allowed customer fields', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const blockedBy: string[] = [];
  const actionsTaken: string[] = [];

  const listText = await openCustomerList(page);
  if (!/U-CUST-100/i.test(listText)) blockedBy.push('U-CUST-100 was not visible in the customer list.');

  const openRoute = await openExistingCustomerCard(page);
  const beforeText = await fullText(page);
  const beforePlaceholder = (await visibleCustomerCard(page, [PLACEHOLDER_NAME])) && /U-CUST-100/i.test(beforeText) && new RegExp(PLACEHOLDER_NAME, 'i').test(beforeText);
  const alreadyConvertedBefore = (await visibleCustomerCard(page, [TARGET_NAME])) && /U-CUST-100/i.test(beforeText) && new RegExp(TARGET_NAME, 'i').test(beforeText);
  if (!beforePlaceholder && !alreadyConvertedBefore) {
    blockedBy.push('U-CUST-100 was neither the expected placeholder nor the target customer before write.');
  }

  await captureReadOnlyCheckpoint(
    page,
    'customer-u-cust-100-conversion-010-before-card.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Before customer identity conversion',
      openRoute,
      visibleSignals: beforeText.split('\n').slice(0, 140),
      internallyProves: beforePlaceholder
        ? 'U-CUST-100 is the expected placeholder before the controlled write.'
        : alreadyConvertedBefore
          ? 'U-CUST-100 already shows the target customer identity before this run.'
          : 'The before state is not accepted for controlled conversion.',
      doesNotProve: ['No O2C readiness', 'No setup correctness', 'No posting readiness'],
      finalScreenshotStatus: beforePlaceholder || alreadyConvertedBefore ? 'draft-candidate' : 'boundary-candidate',
      noPost: true,
      noPreview: true
    },
    captures
  );

  let fillAttempts: FillAttempt[] = [];
  let masterDataChanged = false;
  if (blockedBy.length === 0 && beforePlaceholder) {
    const editRoute = await clickEditIfPresent(page);
    if (editRoute) actionsTaken.push(`Clicked safe Edit/Bearbeiten action through ${editRoute}.`);
    fillAttempts = await fillIdentityFields(page);
    masterDataChanged = fillAttempts.some((attempt) => attempt.status === 'filled');
    const optionalFields = new Set(['Search Name']);
    const hardFailures = fillAttempts.filter(
      (attempt) => !optionalFields.has(attempt.field) && (attempt.status === 'not-editable' || attempt.status === 'not-found')
    );
    if (hardFailures.length) {
      blockedBy.push(`Identity fields were not safely editable: ${hardFailures.map((attempt) => attempt.field).join(', ')}`);
    } else {
      await page.keyboard.press('Control+S').catch(() => undefined);
      await page.waitForTimeout(2000);
      actionsTaken.push('Filled allowed customer identity/contact fields and triggered save/autosave.');
      if (fillAttempts.some((attempt) => optionalFields.has(attempt.field) && (attempt.status === 'not-found' || attempt.status === 'not-editable'))) {
        actionsTaken.push('Search Name/Suchbegriff was not visible on the current customer card layout and remains a separate non-critical follow-up.');
      }
    }
  } else if (alreadyConvertedBefore) {
    actionsTaken.push('Customer already had target identity; no write was needed.');
  }

  const afterText = await fullText(page);
  const afterAccepted = await targetIdentityVisibleOnCard(page);
  if (blockedBy.length === 0 && !afterAccepted) blockedBy.push('Target customer identity was not visible after attempted save.');
  if (forbiddenSetupSignalChanged(afterText)) blockedBy.push('A forbidden setup-field signal appears changed or populated.');

  await captureReadOnlyCheckpoint(
    page,
    'customer-u-cust-100-conversion-020-after-save.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'After customer identity conversion save/autosave',
      fillAttempts,
      visibleInputValues: await collectVisibleInputValues(page),
      visibleSignals: afterText.split('\n').slice(0, 160),
      internallyProves: afterAccepted ? 'The target customer identity is visible after save/autosave.' : 'Target identity was not accepted after save/autosave.',
      doesNotProve: ['No posting-group correctness', 'No VAT correctness', 'No O2C readiness'],
      finalScreenshotStatus: afterAccepted ? 'draft-candidate' : 'boundary-candidate',
      noPost: true,
      noPreview: true
    },
    captures
  );

  await returnToCustomerListFromCard(page);
  await openExistingCustomerCard(page);
  const reopenText = await fullText(page);
  const reopenAccepted = await targetIdentityVisibleOnCard(page);
  if (blockedBy.length === 0 && !reopenAccepted) blockedBy.push('Reopen proof did not show persisted target customer identity.');

  await captureReadOnlyCheckpoint(
    page,
    'customer-u-cust-100-conversion-030-reopen-proof.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Reopen proof after customer identity conversion',
      visibleInputValues: await collectVisibleInputValues(page),
      visibleSignals: reopenText.split('\n').slice(0, 160),
      internallyProves: reopenAccepted ? 'Reopen proof shows the target customer identity persisted.' : 'Reopen proof did not prove persistence.',
      doesNotProve: ['No O2C readiness', 'No posting readiness', 'No UAT acceptance'],
      finalScreenshotStatus: reopenAccepted ? 'draft-candidate' : 'boundary-candidate',
      noPost: true,
      noPreview: true
    },
    captures
  );

  const compact = clean(
    await compactPageText(page, {
      include: [
        /U-CUST-100|Saarland Maschinenbau|Universaarl Kunde 100|Hafenstrasse|66111|Saarbruecken|Martina Weber|example\.invalid|Debitorenkarte|Customer Card|Customer Posting Group|Payment Terms|USt|VAT|Dimension/i
      ],
      maxLines: 260,
      maxLineLength: 260
    }).catch(() => '')
  );
  const textFile = 'customer-u-cust-100-conversion-010-context.txt';
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, textFile), compact || clean(`${beforeText}\n${afterText}\n${reopenText}`));

  const status =
    blockedBy.length === 0 && reopenAccepted
      ? masterDataChanged
        ? 'observed-identity-converted'
        : 'observed-already-converted'
      : 'blocked-identity-conversion';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-controlled-customer-identity-write-gate',
    resultStatus: status,
    startedAt,
    completedAt: new Date().toISOString(),
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Debitorenkarte / Customer Card',
    url: sanitizeUrl(page.url()),
    businessCentralOpened: true,
    playwrightLiveRunExecuted: true,
    liveActionsExecuted: true,
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    targetRecord: {
      table: 'Customer',
      no: TARGET_CUSTOMER,
      previousExpectedName: PLACEHOLDER_NAME,
      targetName: TARGET_NAME
    },
    fieldsChangedOrVerified: fillAttempts,
    actionsTaken: [
      'Opened guarded Business Central context for playthru / UNIVERSAARL-DE.',
      'Opened Customers list and existing U-CUST-100 Customer Card.',
      ...actionsTaken,
      'Captured before, after-save and reopen proof screenshots.'
    ],
    actionsNotTaken: [
      'No customer was created.',
      'No customer was deleted.',
      'No customer template changed.',
      'No customer posting group changed.',
      'No business posting group changed.',
      'No VAT posting group changed.',
      'No payment terms or payment method changed.',
      'No dimensions changed.',
      'No sales document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No confidential real customer data used.'
    ],
    screenshots: captures.map((capture) => capture.screenshot),
    screenshotQa: {
      requiredCheckpoints: [
        'before customer card with U-CUST-100 placeholder or target identity',
        'after save customer card with Saarland Maschinenbau AG',
        'reopen proof with Saarland Maschinenbau AG',
        'no posting/setup/document context'
      ],
      capturedCheckpoints: captures.map((capture) => capture.screenshot),
      acceptedForIdentityConversion: blockedBy.length === 0 && reopenAccepted,
      acceptedForSetupReadiness: false,
      acceptedForO2CReady: false
    },
    proved:
      blockedBy.length === 0 && reopenAccepted
        ? [
            'Existing customer U-CUST-100 is available in playthru / UNIVERSAARL-DE.',
            masterDataChanged
              ? 'U-CUST-100 identity/contact fields were converted to Saarland Maschinenbau AG within the guarded write gate.'
              : 'U-CUST-100 already showed Saarland Maschinenbau AG identity; no additional write was needed.',
            'Reopen proof shows Saarland Maschinenbau AG on the customer card.',
            'No setup, document, Preview Posting, Posting, payment or API shortcut was executed.'
          ]
        : [],
    notProved: [
      'Country/Region Code DE is not proven; the visible field remains a later setup/data-quality boundary.',
      'Search Name/Suchbegriff is not proven on the current card layout.',
      'No customer posting group correctness.',
      'No general business posting group correctness.',
      'No VAT business posting group correctness.',
      'No payment term correctness.',
      'No dimension default correctness.',
      'No O2C readiness.',
      'No Preview Posting, Posting, payment or ledger trace.',
      'No UAT acceptance.'
    ],
    blockedBy,
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      identityWriteGateOnly: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        blockedBy.length === 0 && reopenAccepted
          ? 'U-CUST-100 identity/contact route is proven with reopen proof.'
          : 'U-CUST-100 identity conversion is blocked or incomplete.',
      isPlannedNextCaseStillSensible: false,
      reason:
        blockedBy.length === 0 && reopenAccepted
          ? 'The identity conversion gate is complete; setup fields remain the next separate dependency.'
          : 'The same conversion should not be retried blindly; diagnose the blocked fields first.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST',
          status: blockedBy.length === 0 && reopenAccepted ? 'ready-next' : 'blocked',
          reason: 'Posting groups, VAT groups and payment terms must be read/decided separately before O2C.'
        },
        {
          caseId: 'PWS-MD-CUSTOMER-CONFIG-PACKAGE-ROUTE',
          status: 'ready-after-current',
          reason: 'Batch route follows after first manual example and field boundaries.'
        },
        {
          caseId: 'O2C-FIRST-CUSTOMER-PROCESS',
          status: 'blocked',
          reason: 'Blocked until customer setup, item/service setup and posting/VAT boundaries are consciously handled.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase:
        blockedBy.length === 0 && reopenAccepted ? 'CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST' : 'CUSTOMER-U-CUST-100-IDENTITY-CONVERSION-BLOCKER-DIAGNOSIS',
      whySelectedNextCaseIsBest:
        blockedBy.length === 0 && reopenAccepted
          ? 'The customer now has realistic identity data; setup/payment/posting fields are the next real dependency.'
          : 'Do not keep retrying writes without a field-level diagnosis.',
      risksBeforeNextCase: [
        'Do not claim customer setup or O2C readiness from identity data alone.',
        'Do not use confidential real customer data.',
        'Do not create sales documents until setup fields are decided.'
      ],
      requiredPreparation: [
        'Review which customer setup fields remain empty or blocked.',
        'Prepare read-first setup/payment field route before any O2C process.'
      ]
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/${textFile}`,
      ...captures.flatMap((capture) => [capture.screenshot, capture.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/CUSTOMER-U-CUST-100-IDENTITY-CONVERSION-WRITE-GATE-result.json`
    ],
    nextCase:
      blockedBy.length === 0 && reopenAccepted ? 'CUSTOMER-SETUP-POSTING-PAYMENT-READFIRST' : 'CUSTOMER-U-CUST-100-IDENTITY-CONVERSION-BLOCKER-DIAGNOSIS',
    requiresReview: blockedBy.length > 0,
    safeToFinalizeState: blockedBy.length === 0 && reopenAccepted
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'CUSTOMER-U-CUST-100-IDENTITY-CONVERSION-WRITE-GATE-result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# CUSTOMER-U-CUST-100 Identity Conversion Write Gate',
      '',
      'Dieser Lauf darf nur den bestehenden Debitor U-CUST-100 in Identitaet, Adresse und Kontakt auf Saarland Maschinenbau AG umstellen.',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      `Status: ${status}`,
      `MasterDataChanged: ${masterDataChanged}`,
      '',
      '## Nicht enthalten',
      '',
      '- Keine Debitorenneuanlage.',
      '- Keine Debitorenvorlage.',
      '- Keine Buchungsgruppen.',
      '- Keine USt.-Einrichtung.',
      '- Keine Zahlungsbedingungen.',
      '- Keine Dimensionen.',
      '- Kein Verkaufsbeleg.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine API-Abkuerzung.',
      '- Keine vertraulichen echten Kundendaten.',
      '',
      '## Evidence-Dateien',
      '',
      ...result.evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(status, 'Customer identity conversion must either be observed or already converted, not silently partial.').toMatch(
    /^observed-(identity-converted|already-converted)$/
  );
});
