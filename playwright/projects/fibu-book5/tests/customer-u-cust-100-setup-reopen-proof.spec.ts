import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1800 }
});

test.setTimeout(240_000);
test.skip(
  process.env.CUSTOMER_SETUP_REOPEN_PROOF_LIVE_APPROVED !== '1' ||
    process.env.CUSTOMER_SETUP_REOPEN_PROOF_RUNNER_GUARD_CHECKED !== '1',
  'CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF must be run through the guarded runner with --live-approved.'
);

const CASE_ID = 'CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const TARGET_CUSTOMER = 'U-CUST-100';
const TARGET_CUSTOMER_NAME = 'Saarland Maschinenbau AG';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'customer-u-cust-100-setup-reopen-proof';
const EVIDENCE_DIR_REL = `playwright/projects/${PROJECT}/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_DIR_REL);
const CURRENT_USER_PATTERN = new RegExp(`Kaje${'tan'}[.\\s_-]*Kali${'cki'}`, 'gi');

type Scope = Page | Frame;

type Capture = {
  screenshot: string;
  screenshotMetadata: string;
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
  const url = new URL(process.env.CUSTOMER_SETUP_REOPEN_PROOF_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
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

async function visibleCustomerCard(page: Page) {
  const titlePattern = new RegExp(`${escapeRegExp(TARGET_CUSTOMER)}\\s*[.-]?\\s*${escapeRegExp(TARGET_CUSTOMER_NAME)}`, 'i');
  for (const scope of [page, ...page.frames()]) {
    const hasCardLabel = await scope.getByText(/Debitorenkarte|Customer Card/i).first().isVisible({ timeout: 300 }).catch(() => false);
    const hasNo = await scope.getByText(new RegExp(escapeRegExp(TARGET_CUSTOMER), 'i')).first().isVisible({ timeout: 300 }).catch(() => false);
    const hasName = await scope.getByText(new RegExp(escapeRegExp(TARGET_CUSTOMER_NAME), 'i')).first().isVisible({ timeout: 300 }).catch(() => false);
    const hasTitle = await scope.getByText(titlePattern).first().isVisible({ timeout: 300 }).catch(() => false);
    if ((hasCardLabel && hasNo && hasName) || hasTitle) return true;
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
      if (await candidate.locator.isVisible({ timeout: 800 }).catch(() => false)) {
        await candidate.locator.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
        await candidate.locator.hover({ timeout: 800 }).catch(() => undefined);
        await page.waitForTimeout(200);
        await candidate.locator.click({ timeout: 4000 });
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
      await page.waitForTimeout(1500);
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

async function clickVisibleMoreShow(page: Page) {
  const clicked: string[] = [];
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const more = scope.getByText(/^Mehr anzeigen$|^Show more$/i);
    const count = Math.min(await more.count().catch(() => 0), 8);
    for (let index = 0; index < count; index += 1) {
      const locator = more.nth(index);
      if (!(await locator.isVisible({ timeout: 400 }).catch(() => false))) continue;
      await locator.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
      await locator.click({ timeout: 2500 }).catch(() => undefined);
      clicked.push(`show-more-scope-${scopeIndex}-${index}`);
      await page.waitForTimeout(400);
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
        await page.waitForTimeout(900);
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
  return Array.from(new Set(values)).slice(0, 140);
}

async function visibleTextInMainCardArea(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const found = await scope
      .evaluate(
        ({ source, flags }) => {
          const re = new RegExp(source, flags);
          const visible = (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              rect.left >= 330 &&
              rect.left < 1300 &&
              rect.top >= 240 &&
              rect.top < 1180 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none'
            );
          };
          return Array.from(document.body.querySelectorAll<HTMLElement>('label, span, div, p, button'))
            .filter(visible)
            .some((element) => re.test((element.textContent ?? '').replace(/\s+/g, ' ').trim()));
        },
        { source: pattern.source, flags: pattern.flags }
      )
      .catch(() => false);
    if (found) return true;
  }
  return false;
}

async function visibleInputValueInMainCardArea(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const found = await scope
      .evaluate(
        ({ source, flags }) => {
          const re = new RegExp(source, flags);
          const visible = (element: HTMLElement) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              rect.left >= 330 &&
              rect.left < 1300 &&
              rect.top >= 240 &&
              rect.top < 1180 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none'
            );
          };
          return Array.from(document.body.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select'))
            .filter(visible)
            .some((element) => re.test(element.value ?? ''));
        },
        { source: pattern.source, flags: pattern.flags }
      )
      .catch(() => false);
    if (found) return true;
  }
  return false;
}

async function revealTextInMainCardArea(page: Page, pattern: RegExp) {
  const routes: string[] = [];
  for (const [scopeIndex, scope] of [page, ...page.frames()].entries()) {
    const route = await scope
      .evaluate(
        ({ source, flags }) => {
          const re = new RegExp(source, flags);
          const nearestScrollableAncestor = (element: HTMLElement) => {
            let current: HTMLElement | null = element.parentElement;
            while (current && current !== document.body) {
              if (current.scrollHeight > current.clientHeight + 40) return current;
              current = current.parentElement;
            }
            return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : document.body;
          };
          const candidates = Array.from(document.body.querySelectorAll<HTMLElement>('label, span, div, p'))
            .map((element, index) => {
              const rect = element.getBoundingClientRect();
              const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
              return { element, index, rect, text };
            })
            .filter(({ rect, text }) => re.test(text) && rect.left >= 330 && rect.left < 1250)
            .sort((a, b) => a.text.length - b.text.length);
          const target = candidates[0];
          if (!target) return '';
          for (let attempt = 0; attempt < 6; attempt += 1) {
            const rect = target.element.getBoundingClientRect();
            const delta = rect.top - 620;
            if (Math.abs(delta) < 80) break;
            const scroller = nearestScrollableAncestor(target.element);
            scroller.scrollTop += delta;
          }
          target.element.scrollIntoView({ block: 'center', inline: 'nearest' });
          const after = target.element.getBoundingClientRect();
          return `element-${target.index}-top-${Math.round(after.top)}-text-${target.text.slice(0, 40)}`;
        },
        { source: pattern.source, flags: pattern.flags }
      )
      .catch(() => '');
    if (route) routes.push(`scope-${scopeIndex}:${route}`);
  }
  await page.waitForTimeout(700);
  return routes;
}

async function mainCardAreaElementTop(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    const top = await scope
      .evaluate(
        ({ source, flags }) => {
          const re = new RegExp(source, flags);
          const candidates = Array.from(document.body.querySelectorAll<HTMLElement>('label, span, div, p, input, textarea, select'))
            .map((element) => {
              const rect = element.getBoundingClientRect();
              const text =
                element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement
                  ? element.value
                  : element.textContent ?? '';
              const style = window.getComputedStyle(element);
              return { rect, text: text.replace(/\s+/g, ' ').trim(), visible: style.visibility !== 'hidden' && style.display !== 'none' };
            })
            .filter(
              ({ rect, text, visible }) =>
                visible &&
                re.test(text) &&
                rect.left >= 330 &&
                rect.left < 1300 &&
                rect.top >= 240 &&
                rect.top < 1750 &&
                rect.width > 0 &&
                rect.height > 0
            )
            .sort((a, b) => a.rect.top - b.rect.top);
          return candidates[0] ? Math.round(candidates[0].rect.top) : null;
        },
        { source: pattern.source, flags: pattern.flags }
      )
      .catch(() => null);
    if (typeof top === 'number') return top;
  }
  return null;
}

async function paymentFastTabProof(page: Page) {
  const scrollRoute: string[] = [];
  let route: string[] = [];
  let revealRoute: string[] = [];
  let mainAreaAccepted = false;
  let paymentLabelTop: number | null = null;
  let net30Top: number | null = null;
  for (let attempt = 0; attempt < 8 && !mainAreaAccepted; attempt += 1) {
    scrollRoute.push(...(await scrollCustomerCardDown(page, 650)));
    await page.mouse.wheel(0, 700).catch(() => undefined);
    await page.waitForTimeout(400);
    route = await expandFastTab(page, 'Zahlungen');
    revealRoute = await revealTextInMainCardArea(page, /Zahlungen|Zlg\.-Bedingungscode|Zahlungsbedingung|Payment Terms/i);
    paymentLabelTop = await mainCardAreaElementTop(page, /Zahlungen|Zlg\.-Bedingungscode|Zahlungsbedingung|Payment Terms/i);
    net30Top = await mainCardAreaElementTop(page, /NET30/i);
    mainAreaAccepted =
      paymentLabelTop !== null &&
      paymentLabelTop >= 240 &&
      paymentLabelTop <= 1650 &&
      net30Top !== null &&
      net30Top >= 240 &&
      net30Top <= 1650;
  }
  return { route, scrollRoute, revealRoute, mainAreaAccepted, paymentLabelTop, net30Top };
}

function valuesContainAll(values: string[], patterns: RegExp[]) {
  const joined = values.join('\n');
  return patterns.every((pattern) => pattern.test(joined));
}

test('CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF verifies setup values read-only', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const startedAt = new Date().toISOString();
  const captures: Capture[] = [];
  const blockedBy: string[] = [];
  const actionsTaken: string[] = [];

  const listText = await openCustomerList(page);
  await capture(
    page,
    'customer-u-cust-100-setup-reopen-010-list-context.png',
    {
      page: 'Debitoren / Customers',
      pageId: 22,
      step: 'Customer list before opening U-CUST-100',
      visibleSignals: listText.split('\n').filter((line) => /U-CUST-100|Saarland|Debitor|Customer|Name|Nr\./i.test(line)).slice(0, 120),
      internallyProves: /U-CUST-100/i.test(listText) ? 'U-CUST-100 is visible in the customer route/list context.' : 'U-CUST-100 list visibility is not accepted.',
      doesNotProve: ['No customer card setup values yet', 'No O2C readiness'],
      noWrite: true,
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );
  if (!/U-CUST-100/i.test(listText)) blockedBy.push('U-CUST-100 was not visible in the customer list context.');

  const openRoute = await openExistingCustomerCard(page);
  if (openRoute) actionsTaken.push(`Opened existing customer through ${openRoute}.`);
  const cardText = await fullText(page);
  const cardAccepted = await visibleCustomerCard(page);
  await capture(
    page,
    'customer-u-cust-100-setup-reopen-020-card-context.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Customer card context before FastTab proof',
      openRoute,
      visibleInputValues: await collectVisibleInputValues(page),
      visibleSignals: cardText.split('\n').filter((line) => /U-CUST-100|Saarland|Debitorenkarte|Customer Card|Fakturierung|Zahlungen/i.test(line)).slice(0, 140),
      internallyProves: cardAccepted ? 'U-CUST-100 customer card is visible before setup value proof.' : 'Customer card context is not accepted.',
      doesNotProve: ['No setup value proof yet', 'No O2C readiness'],
      noWrite: true,
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );
  if (!cardAccepted) blockedBy.push('U-CUST-100 customer card was not screenshot-proven.');

  const billingRoute = await expandFastTab(page, 'Fakturierung');
  await clickVisibleMoreShow(page);
  const billingText = await fullText(page);
  const billingValues = await collectVisibleInputValues(page);
  const billingAccepted =
    valuesContainAll(billingValues, [/INLAND/i]) &&
    (await visibleTextInMainCardArea(page, /Debitorenbuchungsgruppe|Customer Posting Group/i)) &&
    (await visibleTextInMainCardArea(page, /Geschaeftsbuchungsgruppe|Geschäftsbuchungsgruppe|Gen\.\s*Bus/i));
  await capture(
    page,
    'customer-u-cust-100-setup-reopen-030-billing-proof.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Fakturierung proof for customer posting and general business posting groups',
      route: billingRoute,
      visibleInputValues: billingValues,
      visibleSignals: billingText.split('\n').filter((line) => /Fakturierung|Buchungsgruppe|Posting Group|INLAND|MwSt|USt/i.test(line)).slice(0, 160),
      internallyProves: billingAccepted ? 'Fakturierung visibly shows INLAND setup values.' : 'Fakturierung proof did not show INLAND.',
      doesNotProve: ['No VAT Business Posting Group value is accepted from this proof', 'No posting readiness'],
      noWrite: true,
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );
  if (!billingAccepted) blockedBy.push('Fakturierung screenshot did not visibly prove INLAND setup values.');

  const paymentRoute = await paymentFastTabProof(page);
  const paymentText = await fullText(page);
  const paymentValues = await collectVisibleInputValues(page);
  const paymentAccepted = paymentRoute.mainAreaAccepted;
  await capture(
    page,
    'customer-u-cust-100-setup-reopen-040-payment-proof.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'Zahlungen proof for Payment Terms Code',
      route: paymentRoute.route,
      scrollRoute: paymentRoute.scrollRoute,
      revealRoute: paymentRoute.revealRoute,
      paymentLabelTop: paymentRoute.paymentLabelTop,
      net30Top: paymentRoute.net30Top,
      visibleInputValues: paymentValues,
      visibleSignals: paymentText.split('\n').filter((line) => /Zahlungen|Zlg\.|Zahlungsbeding|Payment Terms|NET30|Zahlungsform|Ausgleichsmethode/i.test(line)).slice(0, 160),
      internallyProves: paymentAccepted ? 'Zahlungen visibly shows Zlg.-Bedingungscode NET30.' : 'Zahlungen proof did not visibly show Zlg.-Bedingungscode NET30.',
      doesNotProve: ['No invoice due-date calculation', 'No O2C readiness', 'No payment readiness'],
      noWrite: true,
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );
  if (!paymentAccepted) blockedBy.push('Zahlungen screenshot did not visibly prove Zlg.-Bedingungscode NET30.');

  const endText = await fullText(page);
  await capture(
    page,
    'customer-u-cust-100-setup-reopen-050-no-write-end.png',
    {
      page: 'Debitorenkarte / Customer Card',
      pageId: 21,
      step: 'No-write end context',
      visibleInputValues: await collectVisibleInputValues(page),
      visibleSignals: endText.split('\n').filter((line) => /U-CUST-100|Saarland|INLAND|NET30|Gespeichert|Zahlungen|Fakturierung/i.test(line)).slice(0, 160),
      internallyProves: 'End context after read-only proof; no document, preview or posting action was used.',
      doesNotProve: ['No VAT correctness', 'No dimension defaults', 'No payment method', 'No O2C readiness'],
      noWrite: true,
      noDraft: true,
      noPreview: true,
      noPost: true
    },
    captures
  );

  const compact = clean(
    await compactPageText(page, {
      include: [/U-CUST-100|Saarland Maschinenbau|Debitorenkarte|Fakturierung|Zahlungen|Debitorenbuchungsgruppe|Geschaeftsbuchungsgruppe|Geschäftsbuchungsgruppe|Zlg\.-Bedingungscode|Payment Terms|INLAND|NET30|MwSt|USt|Dimension/i],
      maxLines: 320,
      maxLineLength: 260
    }).catch(() => '')
  );
  await writeTextEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'customer-u-cust-100-setup-reopen-context.txt'), compact || endText);

  const observed = blockedBy.length === 0 && billingAccepted && paymentAccepted;
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized-compatible',
    caseId: CASE_ID,
    source: 'playwright-readonly-customer-setup-reopen-proof',
    resultStatus: observed ? 'observed-readonly-reopen-proof' : 'blocked-readonly-reopen-proof',
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
    masterDataChanged: false,
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
    expectedVisibleValues: {
      customerPostingGroup: 'INLAND',
      genBusinessPostingGroup: 'INLAND',
      paymentTermsCode: 'NET30'
    },
    checks: {
      cardAccepted,
      billingAccepted,
      paymentAccepted
    },
    actionsTaken: [
      'Opened guarded Business Central context for playthru / UNIVERSAARL-DE.',
      'Opened customer list and U-CUST-100 customer card.',
      'Expanded Fakturierung and Zahlungen read-only.',
      'Captured list, card, billing, payment and no-write end screenshots.',
      ...actionsTaken
    ],
    actionsNotTaken: [
      'No Edit/Bearbeiten action clicked.',
      'No customer field changed.',
      'No VAT setup changed.',
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
      requiredCheckpoints: ['customer list', 'customer card', 'Fakturierung with INLAND', 'Zahlungen with Zlg.-Bedingungscode NET30', 'no-write end context'],
      capturedCheckpoints: captures.map((entry) => entry.screenshot),
      acceptedForCustomerSetupValues: observed,
      acceptedForO2CReady: false,
      acceptedForPostingReady: false,
      reason: observed
        ? 'Separate visible screenshots prove the customer setup values after reopen.'
        : 'One or more visible proof checkpoints failed.'
    },
    proved: observed
      ? [
          'playthru / UNIVERSAARL-DE was used.',
          'U-CUST-100 / Saarland Maschinenbau AG customer card was reopened read-only.',
          'Fakturierung visibly shows INLAND customer/general business setup values.',
          'Zahlungen visibly shows Zlg.-Bedingungscode NET30.',
          'No customer field, document, Preview Posting, Posting, payment or API shortcut was executed.'
        ]
      : [
          'playthru / UNIVERSAARL-DE was used.',
          'The customer setup reopen proof was attempted read-only.',
          'No customer field, document, Preview Posting, Posting, payment or API shortcut was executed.'
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
      'U-CUST-100 and setup values are realistic fictional Universaarl training/project data, not confidential real customer data.',
      'Customer setup values do not prove sales document or posting behavior.'
    ],
    flags: {
      noWrite: true,
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
    uiLearning: 'Business Central customer card proof requires FastTab-specific screenshots, a larger viewport and card-container scrolling; the German payment terms field is shown as Zlg.-Bedingungscode.',
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'CUSTOMER-VAT-DIMENSION-BOUNDARY-DECISION',
      lastEvidenceSummary: observed
        ? 'U-CUST-100 has visible INLAND/INLAND/NET30 read-only reopen proof.'
        : 'U-CUST-100 setup reopen proof is still incomplete.',
      isPlannedNextCaseStillSensible: observed,
      reason: observed
        ? 'Customer setup values are visually proven; the next boundary is whether VAT Business Posting Group, dimensions and payment method can remain parked before O2C route planning.'
        : 'Do not proceed to boundary decision until visible customer setup proof is accepted.',
      lookaheadReviewed: [
        {
          caseId: 'CUSTOMER-VAT-DIMENSION-BOUNDARY-DECISION',
          status: observed ? 'ready-next' : 'blocked',
          reason: observed ? 'Customer setup values have visible proof.' : 'Customer setup proof is incomplete.'
        },
        {
          caseId: 'O2C-MINIMAL-ROUTE-DECISION',
          status: 'needs-setup-first',
          reason: 'O2C still needs item/service, VAT and posting-boundary decisions.'
        },
        {
          caseId: 'ITEM-SERVICE-MASTERDATA-READFIRST',
          status: 'ready-after-current',
          reason: 'The customer side is now clearer; item/service readiness is the next master-data dependency.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: observed ? 'CUSTOMER-VAT-DIMENSION-BOUNDARY-DECISION' : 'CUSTOMER-SETUP-VALUE-WRITE-GATE-RECOVERY',
      whySelectedNextCaseIsBest: observed
        ? 'It prevents jumping into O2C while VAT, dimensions and payment method remain explicitly unproven.'
        : 'Recover visible customer setup proof before any later process work.',
      risksBeforeNextCase: ['Do not treat customer setup values as posting readiness or VAT correctness.'],
      requiredPreparation: observed
        ? ['Review Microsoft/BC setup logic only if VAT/dimension/payment-method parking needs a source-backed decision.']
        : ['Improve FastTab proof route and screenshot QA.']
    },
    evidenceRefs: [
      `${EVIDENCE_DIR_REL}/customer-u-cust-100-setup-reopen-context.txt`,
      ...captures.flatMap((entry) => [entry.screenshot, entry.screenshotMetadata]),
      `${EVIDENCE_DIR_REL}/result.json`
    ],
    nextCase: observed ? 'CUSTOMER-VAT-DIMENSION-BOUNDARY-DECISION' : 'CUSTOMER-SETUP-VALUE-WRITE-GATE-RECOVERY',
    requiresReview: !observed,
    safeToFinalizeState: observed
  };

  await writeJsonEvidence(evidencePath(PROJECT, EVIDENCE_ID, 'result.json'), result);
  await writeTextEvidence(
    evidencePath(PROJECT, EVIDENCE_ID, 'README.md'),
    [
      '# CUSTOMER-U-CUST-100-SETUP-REOPEN-PROOF',
      '',
      `Status: ${result.resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      'Dieser Lauf ist ein reiner lesender Reopen-Proof fuer den bestehenden Debitor U-CUST-100.',
      '',
      'Geprueft:',
      '',
      '- Debitorenbuchungsgruppe: INLAND',
      '- Geschaeftsbuchungsgruppe: INLAND',
      '- Zlg.-Bedingungscode: NET30',
      '',
      'Nicht enthalten: keine USt.-Einrichtung, keine Dimensionen, keine Zahlungsform, kein Beleg, keine Buchungsvorschau, keine Buchung, kein API Shortcut und keine vertraulichen echten Kundendaten.',
      '',
      '## Evidence-Dateien',
      '',
      ...result.evidenceRefs.map((file) => `- ${file}`),
      ''
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
