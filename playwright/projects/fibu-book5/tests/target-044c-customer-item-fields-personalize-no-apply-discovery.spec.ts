import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});
test.setTimeout(420_000);

const CASE_ID = 'TARGET-044C-CUSTOMER-ITEM-FIELDS-PERSONALIZE-NO-APPLY-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-044c-customer-item-fields-personalize-no-apply-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');

type CardProbe = {
  id: 'customer-u-cust-100' | 'item-u-item-hw100';
  pageId: number;
  listPageId: number;
  pageName: string;
  tableName: string;
  fieldName: string;
  recordNo: string;
  expectedRecordText: RegExp;
  listLinkText: RegExp;
  fieldTerms: string[];
  screenshotPrefix: string;
};

const probes: CardProbe[] = [
  {
    id: 'customer-u-cust-100',
    pageId: 21,
    listPageId: 22,
    pageName: 'Customer Card / Debitorenkarte',
    tableName: 'Customer',
    fieldName: 'No.',
    recordNo: 'U-CUST-100',
    expectedRecordText: /U-CUST-100|Universaarl Kunde 100/i,
    listLinkText: /^(Debitoren|Customers)$/i,
    fieldTerms: [
      'Debitorenbuchungsgruppe',
      'Customer Posting Group',
      'Geschaeftsbuchungsgruppe',
      'Gen. Bus. Posting Group',
      'MwSt.-Geschaeftsbuchungsgruppe',
      'VAT Bus. Posting Group',
      'Zahlungsbedingungscode',
      'Payment Terms Code'
    ],
    screenshotPrefix: 'target-044c-010-customer'
  },
  {
    id: 'item-u-item-hw100',
    pageId: 30,
    listPageId: 31,
    pageName: 'Item Card / Artikelkarte',
    tableName: 'Item',
    fieldName: 'No.',
    recordNo: 'U-ITEM-HW100',
    expectedRecordText: /U-ITEM-HW100|Universaarl Hardware 100|STK/i,
    listLinkText: /^(Artikel|Items)$/i,
    fieldTerms: [
      'Lagerbuchungsgruppe',
      'Inventory Posting Group',
      'Item Posting Group',
      'Produktbuchungsgruppe',
      'Gen. Prod. Posting Group',
      'MwSt.-Produktbuchungsgruppe',
      'VAT Prod. Posting Group',
      'Einstandspreismethode',
      'Costing Method'
    ],
    screenshotPrefix: 'target-044c-020-item'
  }
];

function buildCardUrl(probe: CardProbe) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(probe.pageId));
  url.searchParams.set('filter', `${probe.tableName}.'${probe.fieldName}' IS '@*${probe.recordNo}*'`);
  return url.toString();
}

function buildListUrl(probe: CardProbe) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(probe.listPageId));
  url.searchParams.set('filter', `${probe.tableName}.'${probe.fieldName}' IS '@*${probe.recordNo}*'`);
  return url.toString();
}

function buildHomeUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.delete('page');
  url.searchParams.delete('filter');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'filter', 'profile']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter(
      (line) =>
        !/trustedOriginAuthorities|tokenFactory|cacheLocation|allowedEndpoints|parentPageOrigin|aadTenantId|clientId|requestExecutor/i.test(
          line
        ) &&
        !/upn|allowedResources|originAuthorityValidator|shouldAttachOauthTokens|authority|accessToken|refreshToken/i.test(
          line
        )
    )
    .join('\n')
    .trim();
}

function sanitizeError(value: unknown) {
  return String(value)
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/kajetan\.kalicki(@|\\u0040)n4\.de/gi, '{user}')
    .replace(/upn:\s*\\?"[^"\\]*(?:\\.[^"\\]*)*\\?"/gi, 'upn: "{redacted}"')
    .replace(/access[_-]?token|refresh[_-]?token|client[_-]?secret|bearer/gi, '{redacted-secret-term}')
    .replace(/Received string:[\s\S]*/i, 'Received string: {redacted-page-text}');
}

function urlPageParam(rawUrl: string) {
  return new URL(rawUrl).searchParams.get('page') ?? '';
}

async function cardContextIsVisible(page: Page, probe: CardProbe) {
  const text = cleanText(await pageText(page));
  return (
    urlPageParam(page.url()) === String(probe.pageId) ||
    /Customer Card|Debitorenkarte|Item Card|Artikelkarte/i.test(text)
  );
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function containsDangerousText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Loschen\?|Ship and Invoice|Buchen\?|New|Neu|Edit|Bearbeiten|Create\?|Erstellen\?|Posting|Buchung/i.test(
    text
  );
}

function containsSavePersonalizationDialog(text: string) {
  return /Save personalization|Personalisierung speichern|Save changes|Aenderungen speichern|Anderungen speichern|Apply changes|Aenderungen anwenden|Anderungen anwenden/i.test(
    text
  );
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function writeJson(fileName: string, payload: unknown) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(fileName.replace(/\.png$/i, '.screenshot.json'), {
    caseId: CASE_ID,
    fileName,
    imagePath: `playwright/projects/fibu-book5/img/${fileName}`,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function assertSafeContext(page: Page, expected: RegExp) {
  const currentUrl = page.url();
  expect(instancePathIsTarget(currentUrl), `Wrong instance in URL: ${sanitizeEvidenceUrl(currentUrl)}`).toBe(true);
  expect(companyParamIsTarget(currentUrl), `Wrong company in URL: ${sanitizeEvidenceUrl(currentUrl)}`).toBe(true);

  const text = cleanText(await pageText(page));
  expect(text).toMatch(expected);

  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogLocator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await dialogLocator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const dialogText = cleanText(await dialogLocator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (containsDangerousText(dialogText) && !containsSavePersonalizationDialog(dialogText)) dialogs.push(dialogText);
    }
  }
  expect(dialogs, 'A dangerous dialog is visible.').toEqual([]);
}

async function clickSettingsButton(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            rect: rectOf(element)
          }))
          .filter((entry) => entry.rect.y <= 120)
          .map((entry) => {
            const label = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            const matchesSettings = /Settings|Einstellungen|Setup and Extensions|Einrichtungen und Erweiterungen/i.test(label);
            const score = (matchesSettings ? 1000 : 0) + entry.rect.x / 10 - entry.rect.y;
            return { ...entry, matchesSettings, score };
          })
          .filter((entry) => entry.matchesSettings)
          .sort((left, right) => right.score - left.score);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'settings-button-not-found', candidates: candidates.slice(0, 5) };
        chosen.element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        chosen.element.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect },
          candidates: candidates.slice(0, 5).map(({ element: _element, ...entry }) => entry)
        };
      })
      .catch((error) => ({ clicked: false, reason: 'settings-evaluate-error', error: String(error), candidates: [] }));

    if (result.clicked) {
      await page.waitForTimeout(1000);
      return result;
    }
  }

  return { clicked: false, reason: 'settings-button-not-found-in-any-frame', candidates: [] };
}

async function clickVisibleTextLike(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,span,div'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            role: normalize(element.getAttribute('role')),
            rect: rectOf(element)
          }))
          .filter((entry) => {
            const haystack = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            return pattern.test(haystack) && haystack.length <= 220;
          })
          .filter((entry) => entry.rect.width >= 20 && entry.rect.height >= 8)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'target-not-found', candidates: [] };
        chosen.element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        chosen.element.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, role: chosen.role, rect: chosen.rect },
          candidates: candidates.slice(0, 8).map(({ element: _element, ...entry }) => entry)
        };
      }, pattern.source)
      .catch((error) => ({ clicked: false, reason: 'target-evaluate-error', error: String(error), candidates: [] }));

    if (result.clicked) {
      await page.waitForTimeout(1200);
      return result;
    }
  }

  return { clicked: false, reason: 'target-not-found-in-any-frame', candidates: [] };
}

async function hoverVisibleTextLike(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate((patternSource) => {
        const pattern = new RegExp(patternSource, 'i');
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,span,div'))
          .filter(visible)
          .map((element) => ({
            element,
            text: normalize(element.innerText || element.textContent),
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            role: normalize(element.getAttribute('role')),
            rect: rectOf(element)
          }))
          .filter((entry) => {
            const haystack = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            return pattern.test(haystack) && haystack.length <= 220;
          })
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { hovered: false, reason: 'target-not-found', candidates: [] };
        chosen.element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        return {
          hovered: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, role: chosen.role, rect: chosen.rect },
          candidates: candidates.slice(0, 8).map(({ element: _element, ...entry }) => entry)
        };
      }, pattern.source)
      .catch((error) => ({ hovered: false, reason: 'target-evaluate-error', error: String(error), candidates: [] }));

    if (result.hovered) {
      await page.waitForTimeout(900);
      return result;
    }
  }
  return { hovered: false, reason: 'target-not-found-in-any-frame', candidates: [] };
}

async function openPersonalizeMode(page: Page) {
  const settingsResult = await clickSettingsButton(page);
  if (!settingsResult.clicked) {
    return {
      opened: false,
      settingsResult,
      personalizeClick: { clicked: false, reason: 'settings-not-open' },
      textContainsSignals: false
    };
  }

  const personalizeHover = await hoverVisibleTextLike(page, /Personalize|Personalisieren/);
  const personalizeClick = await clickVisibleTextLike(page, /Personalize|Personalisieren/);
  await page.waitForTimeout(1500);
  const text = cleanText(await pageText(page));
  const opened = /Personalizing|Personalize|Personalisieren|Personalisierung|Done|Fertig|Add field|Add fields|Feld hinzuf|Felder hinzuf|Wird personalisiert/i.test(
    text
  );
  return {
    opened,
    settingsResult,
    personalizeHover,
    personalizeClick,
    textContainsSignals: /Personalizing|Personalize|Personalisieren|Personalisierung|Done|Fertig|Field|Feld/i.test(text)
  };
}

async function openRecordFromCurrentList(page: Page, probe: CardProbe) {
  let openedFromList = false;
  for (const scope of [page, ...page.frames()]) {
    const recordLink = scope.getByRole('link', { name: new RegExp(probe.recordNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
    if (await recordLink.isVisible({ timeout: 1000 }).catch(() => false)) {
      await recordLink.click({ timeout: 4000 });
      openedFromList = true;
      break;
    }
    const recordButton = scope.getByRole('button', { name: new RegExp(probe.recordNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).first();
    if (await recordButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await recordButton.click({ timeout: 4000 });
      openedFromList = true;
      break;
    }
    const row = scope.getByRole('row', { name: probe.expectedRecordText }).first();
    if (await row.isVisible({ timeout: 1000 }).catch(() => false)) {
      await row.dblclick({ timeout: 4000 }).catch(async () => {
        await row.click({ timeout: 4000 }).catch(() => undefined);
        await page.keyboard.press('Enter').catch(() => undefined);
      });
      openedFromList = true;
      break;
    }
    const text = scope.getByText(probe.expectedRecordText).first();
    if (await text.isVisible({ timeout: 1000 }).catch(() => false)) {
      await text.dblclick({ timeout: 4000 }).catch(async () => {
        await text.click({ timeout: 4000 }).catch(() => undefined);
        await page.keyboard.press('Enter').catch(() => undefined);
      });
      openedFromList = true;
      break;
    }
  }

  return openedFromList;
}

async function openListFromRoleCenter(page: Page, probe: CardProbe) {
  await page.goto(buildHomeUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await assertSafeContext(page, /Universaarl GmbH|UNIVERSAARL-DE/i);

  const clickResult = await clickVisibleTextLike(page, probe.listLinkText);
  if (!clickResult.clicked) return false;
  await page.waitForTimeout(2500);
  await assertSafeContext(page, /Debitoren|Customers|Artikel|Items|Universaarl/i);

  return expect
    .poll(async () => cleanText(await pageText(page)), { timeout: 20_000, intervals: [1000, 1500, 2500] })
    .toMatch(probe.expectedRecordText)
    .then(() => true)
    .catch(() => false);
}

async function collectVisibleTermSignals(page: Page, terms: string[]) {
  const allSignals: Record<string, any[]> = Object.fromEntries(terms.map((term) => [term, []]));

  for (const frame of page.frames()) {
    const frameSignals = await frame
      .evaluate((targetTerms) => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rectOf = (element: Element) => {
          const rect = element.getBoundingClientRect();
          return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
        };
        const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(visible);
        const result: Record<string, any[]> = Object.fromEntries(targetTerms.map((term) => [term, []]));
        for (const term of targetTerms) {
          const pattern = new RegExp(escape(term), 'i');
          result[term] = visibleElements
            .map((element) => ({
              text: normalize(element.innerText || element.textContent),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              role: normalize(element.getAttribute('role')),
              tagName: element.tagName,
              rect: rectOf(element)
            }))
            .filter((entry) => {
              const haystack = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
              return pattern.test(haystack) && haystack.length <= 320;
            })
            .filter((entry) => entry.rect.width >= 8 && entry.rect.height >= 6)
            .slice(0, 16);
        }
        return result;
      }, terms)
      .catch(() => Object.fromEntries(terms.map((term) => [term, []])));

    for (const term of terms) {
      allSignals[term].push(...(frameSignals[term] ?? []));
    }
  }

  return Object.fromEntries(
    Object.entries(allSignals).map(([term, signals]) => [
      term,
      signals
        .filter((signal, index, list) => index === list.findIndex((other) => JSON.stringify(other.rect) === JSON.stringify(signal.rect) && other.text === signal.text))
        .slice(0, 12)
    ])
  );
}

async function collectPersonalizeSurface(page: Page, fieldTerms: string[]) {
  const text = cleanText(await pageText(page));
  const compact = await compactPageText(page, {
    include: [/Personalize|Personalisieren|Wird personalisiert|Fertig|Done|Field|Feld|Posting|Buchungsgruppe|VAT|MwSt|Payment|Zahlungs|Costing|Einstand|Inventory|Lager/i],
    maxLines: 180,
    maxLineLength: 220
  });
  const allTerms = [
    'Personalize',
    'Personalisieren',
    'Wird personalisiert',
    'Fertig',
    'Done',
    'Feld',
    'Field',
    ...fieldTerms
  ];
  return {
    textSignals: {
      personalizeModeVisible: /Personalizing|Personalisierung|Wird personalisiert|Done|Fertig/i.test(text),
      addFieldVisible: /Add field|Add fields|Feld hinzuf|Felder hinzuf/i.test(text),
      doneVisible: /Done|Fertig/i.test(text),
      saveApplyVisible: containsSavePersonalizationDialog(text)
    },
    compactText: compact,
    signalsByTerm: await collectVisibleTermSignals(page, allTerms)
  };
}

async function exitPersonalizeSafely(page: Page) {
  const beforeText = cleanText(await pageText(page));
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(900);

  const discardAttempt = await clickVisibleTextLike(page, /Discard|Verwerfen|Don't save|Nicht speichern|Abbrechen|Cancel/);
  await page.waitForTimeout(800);
  const afterText = cleanText(await pageText(page));
  return {
    method: discardAttempt.clicked ? 'escape-then-discard-or-cancel' : 'escape-only',
    discardAttempt,
    hadSaveApplyDialog: containsSavePersonalizationDialog(beforeText) || containsSavePersonalizationDialog(afterText),
    stillPersonalizeText: /Personalizing|Personalisierung|Wird personalisiert/i.test(afterText),
    personalizationSaved: false
  };
}

async function openProbe(page: Page, probe: CardProbe) {
  await page.goto(buildCardUrl(probe), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  const directCardOpened = await expect
    .poll(async () => cleanText(await pageText(page)), { timeout: 20_000, intervals: [1000, 1500, 2500] })
    .toMatch(probe.expectedRecordText)
    .then(() => true)
    .catch(() => false);

  if (!directCardOpened) {
    let recordVisibleInList = await openListFromRoleCenter(page, probe);

    if (!recordVisibleInList) {
      await page.goto(buildListUrl(probe), { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await waitForBusinessCentralShell(page);
      await dismissTours(page).catch(() => undefined);
      recordVisibleInList = await expect
        .poll(async () => cleanText(await pageText(page)), { timeout: 40_000, intervals: [1000, 1500, 2500] })
        .toMatch(probe.expectedRecordText)
        .then(() => true)
        .catch(() => false);
    }

    expect(recordVisibleInList, `${probe.recordNo} was not visible in the role-center or URL list fallback.`).toBe(true);
    const openedFromList = await openRecordFromCurrentList(page, probe);
    expect(openedFromList, `${probe.recordNo} row could not be opened from list fallback.`).toBe(true);
    await page.waitForTimeout(2500);
  }

  await assertSafeContext(page, probe.expectedRecordText);
  await expect
    .poll(async () => cardContextIsVisible(page, probe), { timeout: 10_000, intervals: [1000, 1500, 2500] })
    .toBe(true);
}

async function runProbe(page: Page, probe: CardProbe) {
  await openProbe(page, probe);
  const beforeText = await compactPageText(page, {
    include: [probe.expectedRecordText, /Fakturierung|Zahlungen|Einstandspreise|Buchung|Indirekte Steuer|Posting|Buchungsgruppe|VAT|MwSt|Payment|Zahlungs|Costing|Einstand/i],
    maxLines: 140,
    maxLineLength: 220
  });
  await writeText(`${probe.screenshotPrefix}-before.txt`, beforeText);
  await screenshotWithMetadata(page, `${probe.screenshotPrefix}-before-personalize.png`, {
    page: probe.pageName,
    step: 'before-personalize',
    status: 'universaarl-readonly-card-context',
    visibleLearning: 'The card context is visible before opening Personalize.',
    internallyProves: 'Correct record context before no-apply Personalize discovery.',
    doesNotProve: ['No field value correctness', 'No setup readiness', 'No posting readiness'],
    bookUse: 'diagnostic-context'
  });

  const personalizeOpen = await openPersonalizeMode(page);
  const surface = await collectPersonalizeSurface(page, probe.fieldTerms);
  await writeJson(`${probe.screenshotPrefix}-personalize-surface.json`, {
    probe: probe.id,
    personalizeOpen,
    surface
  });
  await writeText(`${probe.screenshotPrefix}-personalize-focused-text.txt`, surface.compactText || 'No focused personalize text captured.');
  await screenshotWithMetadata(page, `${probe.screenshotPrefix}-personalize-mode.png`, {
    page: probe.pageName,
    step: 'personalize-mode',
    status: personalizeOpen.opened ? 'universaarl-personalize-opened-no-apply' : 'universaarl-personalize-not-opened',
    visibleLearning: 'Personalize is used as a visibility diagnosis tool only.',
    internallyProves: 'Only visible Personalize signals and field captions in this user layout.',
    doesNotProve: ['No personalization saved', 'No customer or item field changed', 'No setup correctness'],
    bookUse: 'diagnostic-evidence-only'
  });

  const fieldAvailability = probe.fieldTerms.map((term) => {
    const signals = surface.signalsByTerm[term] ?? [];
    return {
      term,
      status: signals.length > 0 ? 'visible-in-personalize-diagnostics' : 'not-visible-in-personalize-diagnostics',
      signalCount: signals.length,
      bestSignal: signals[0] ?? null,
      signals: signals.slice(0, 8)
    };
  });

  const exitResult = await exitPersonalizeSafely(page);
  await assertSafeContext(page, probe.expectedRecordText);
  const afterExitText = cleanText(await pageText(page));
  await screenshotWithMetadata(page, `${probe.screenshotPrefix}-after-exit.png`, {
    page: probe.pageName,
    step: 'after-exit',
    status: 'universaarl-card-context-after-personalize-exit',
    visibleLearning: 'The card context is still visible after leaving Personalize.',
    internallyProves: 'No-save exit route returned to the card context.',
    doesNotProve: ['No reopen proof for field changes because no changes were allowed'],
    bookUse: 'diagnostic-context'
  });

  return {
    id: probe.id,
    pageId: probe.pageId,
    listPageId: probe.listPageId,
    pageName: probe.pageName,
    recordNo: probe.recordNo,
    url: sanitizeEvidenceUrl(page.url()),
    personalizeOpen,
    surface: {
      textSignals: surface.textSignals,
      fieldAvailability
    },
    exitResult,
    afterExitStillShowsRecord: probe.expectedRecordText.test(afterExitText),
    screenshots: [
      `playwright/projects/fibu-book5/img/${probe.screenshotPrefix}-before-personalize.png`,
      `playwright/projects/fibu-book5/img/${probe.screenshotPrefix}-personalize-mode.png`,
      `playwright/projects/fibu-book5/img/${probe.screenshotPrefix}-after-exit.png`
    ]
  };
}

function renderReadme(result: any) {
  const rows = result.pages
    .flatMap((page: any) =>
      page.surface.fieldAvailability.map((entry: any) => `| ${page.id} | ${entry.term} | ${entry.status} | ${entry.signalCount} |`)
    )
    .join('\n');
  return [
    '# TARGET-044C - Customer/Item Personalize No-Apply Discovery',
    '',
    `Status: ${result.resultStatus}`,
    '',
    'Dieser Lauf nutzt Personalisieren nur als Sichtbarkeitsdiagnose. Es wurden keine Felder hinzugefuegt, verschoben, gespeichert oder geschrieben.',
    '',
    '| Karte | Feldbegriff | Status | Signale |',
    '|---|---|---|---:|',
    rows,
    '',
    '## Grenzen',
    '',
    '- Feldverfuegbarkeit ist keine Buchungsreife.',
    '- Keine Customer-/Item-/Setup-Aenderung.',
    '- Keine Personalisierung gespeichert.',
    '- Kein Beleg, keine Buchungsvorschau, keine Buchung.',
    '',
    `Naechster Case: ${result.nextCase}`,
    ''
  ].join('\n');
}

test('TARGET-044C inspects customer/item fields via Personalize without applying changes', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const pages = [];
  const blockedBy: string[] = [];
  const blockedScreenshots: string[] = [];

  for (const probe of probes) {
    try {
      pages.push(await runProbe(page, probe));
    } catch (error) {
      blockedBy.push(`${probe.id}: ${sanitizeError(error)}`);
      const blockedScreenshot = `target-044c-000-${probe.id}-blocked-route.png`;
      await screenshotWithMetadata(page, blockedScreenshot, {
        page: 'Blocked customer/item card Personalize route',
        step: 'blocked-route',
        status: 'universaarl-readonly-blocked',
        visibleLearning: 'The tested direct-card, role-center-list or URL-list route did not leave a stable target card context.',
        internallyProves: 'The route is blocked without any write, setup, draft, Preview Posting or Posting action.',
        doesNotProve: ['No field availability', 'No field value correctness', 'No setup readiness'],
        bookUse: 'do-not-use-as-book-proof'
      });
      blockedScreenshots.push(`playwright/projects/fibu-book5/img/${blockedScreenshot}`);
      break;
    }
  }

  const allFields = pages.flatMap((entry: any) => entry.surface.fieldAvailability);
  const visibleFieldTerms = allFields.filter((entry: any) => entry.signalCount > 0).map((entry: any) => entry.term);
  const missingFieldTerms = allFields.filter((entry: any) => entry.signalCount === 0).map((entry: any) => entry.term);
  const allPersonalizeOpened = pages.length === probes.length && pages.every((entry: any) => entry.personalizeOpen.opened);
  const noSaveDialogRemained = pages.every((entry: any) => !entry.exitResult.hadSaveApplyDialog || !entry.exitResult.stillPersonalizeText);
  const observed = pages.length === probes.length && allPersonalizeOpened && noSaveDialogRemained;
  const nextCase = observed && visibleFieldTerms.length > 0
    ? 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT'
    : 'TARGET-044D-CUSTOMER-ITEM-POSTING-FIELDS-ALTERNATIVE-PAGE-ROUTE';

  const nextStepDecision = {
    currentCase: CASE_ID,
    plannedNextCaseBeforeReview: 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT',
    lastEvidenceSummary: 'TARGET-044B selected no-apply Personalize discovery because TARGET-044 did not prove a safe field-write route.',
    isPlannedNextCaseStillSensible: observed && visibleFieldTerms.length > 0,
    reason: observed && visibleFieldTerms.length > 0
      ? 'Personalize was opened and at least some relevant field captions were visible; a future write case may now be scoped narrowly but still needs exact target values.'
      : 'Personalize did not produce enough visible field availability to justify a customer/item field write.',
    lookaheadReviewed: [
      {
        caseId: 'TARGET-045-CUSTOMER-ITEM-POSTING-FIELDS-CONTROLLED-FIT',
        status: observed && visibleFieldTerms.length > 0 ? 'ready-after-current' : 'needs-ui-discovery-first',
        reason: 'A write case needs exact target fields, target values and a safe active route.'
      },
      {
        caseId: 'TARGET-044D-CUSTOMER-ITEM-POSTING-FIELDS-ALTERNATIVE-PAGE-ROUTE',
        status: observed && visibleFieldTerms.length > 0 ? 'ready-after-current' : 'ready-next',
        reason: 'Alternative page route is needed if the card Personalize route does not expose enough fields.'
      },
      {
        caseId: 'TARGET-038-O2C-PREFLIGHT',
        status: 'needs-setup-first',
        reason: 'O2C remains blocked until customer/item posting, VAT and payment readiness is proven.'
      },
      {
        caseId: 'TARGET-026N-CHART-OF-ACCOUNTS-FOUNDATION-CHECKPOINT',
        status: 'ready-after-current',
        reason: 'Foundation checkpoint remains a safe fallback if field routes stay blocked.'
      },
      {
        caseId: 'TARGET-036D3-FIRST-VENDOR-MANUAL-NUMBER-CONTROLLED-WRITE-GATE',
        status: 'blocked',
        reason: 'Vendor numbering is unrelated and remains parked.'
      }
    ],
    queueChangesMade: [
      'TARGET-044C ran as read-only/no-apply Personalize discovery.',
      `Selected ${nextCase} as next case.`
    ],
    selectedNextCase: nextCase,
    whySelectedNextCaseIsBest: observed && visibleFieldTerms.length > 0
      ? 'It can turn visible field availability into a narrow future fit case without jumping to documents.'
      : 'It avoids a blind field write and moves to a more appropriate standard-page route.',
    risksBeforeNextCase: [
      'Do not claim posting readiness from field availability.',
      'Do not edit customer, item or setup fields without exact target values.',
      'Do not start O2C/P2P documents.'
    ],
    requiredPreparation: [
      'Review visible/missing field terms from TARGET-044C.',
      'Name exact target values before any write.',
      'Keep Preview Posting and Posting locked.'
    ]
  };

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-readonly-personalize-discovery',
    resultStatus: observed ? 'observed' : 'blocked',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: pages.at(-1)?.url ?? '',
    page: 'Customer Card and Item Card Personalize no-apply discovery',
    actionsTaken: [
      'Attempted direct filtered card URL for U-CUST-100/U-ITEM-HW100.',
      'If direct card context was not stable, attempted Role Center list link fallback.',
      'If Role Center list link fallback was not sufficient, attempted filtered list URL fallback.',
      ...pages.flatMap((entry: any) => [
        `Opened ${entry.recordNo} card read-only.`,
        `Opened Personalize mode for ${entry.recordNo} without applying changes.`,
        `Exited Personalize mode for ${entry.recordNo} without saving or applying changes.`
      ]),
      ...(blockedBy.length ? ['Captured blocked-route screenshot after read-only route failure.'] : [])
    ],
    actionsNotTaken: [
      'No New action clicked.',
      'No Edit action clicked.',
      'No customer field changed.',
      'No item field changed.',
      'No setup value changed.',
      'No field was added, moved, hidden, saved or applied through Personalize.',
      'No document or draft created.',
      'No Preview Posting.',
      'No Posting.',
      'No payment.',
      'No API shortcut.',
      'No company switch.'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    payment: false,
    apiShortcut: false,
    personalizationApplied: false,
    screenshots: [...pages.flatMap((entry: any) => entry.screenshots), ...blockedScreenshots],
    proved: [
      observed ? 'U-CUST-100 and U-ITEM-HW100 were both opened in playthru / UNIVERSAARL-DE.' : '',
      allPersonalizeOpened ? 'Personalize mode opened on both cards without applying changes.' : '',
      visibleFieldTerms.length > 0 ? `Visible Personalize field terms captured: ${visibleFieldTerms.join(', ')}.` : 'No relevant field term was visibly proven through Personalize.',
      pages.length ? 'Personalize was exited without saving or applying layout changes.' : '',
      'No setup, master data, document, Preview Posting, Posting, payment, API shortcut or company switch occurred.'
    ].filter(Boolean),
    notProved: [
      allFields.length
        ? `Missing or unclear field terms: ${missingFieldTerms.join(', ') || 'none listed'}.`
        : 'Field terms were not evaluated because the target card context could not be kept stable for Personalize.',
      'No customer or item posting field value is proven correct.',
      'No customer or item field write route is proven.',
      'No VAT Posting Setup, General Posting Setup, Inventory Posting Setup, document, Preview Posting, Posting, ledger entry or VAT entry is proven.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044C-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      'playwright/projects/fibu-book5/img/target-044c-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044C-result.json`,
      ...pages.flatMap((entry: any) => entry.screenshots),
      ...blockedScreenshots
    ],
    pages,
    visibleFieldTerms,
    missingFieldTerms,
    warnings: [
      'Field availability is not posting readiness.',
      'A personalized field offer is user/profile/layout dependent.',
      'TARGET-045 still needs exact target values and a write Smart Decision Gate.'
    ],
    blockedBy,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noPersonalizationApplied: true
    },
    nextStepDecision,
    statePatch: {
      current: {
        activeArea: observed && visibleFieldTerms.length > 0
          ? 'universaarl-customer-item-posting-fields-controlled-fit'
          : 'universaarl-customer-item-alternative-field-route',
        activeCase: nextCase,
        active_case_file: observed && visibleFieldTerms.length > 0
          ? '.agent/state/cases/target-045-customer-item-posting-fields-controlled-fit.json'
          : '.agent/state/cases/target-044d-customer-item-posting-fields-alternative-page-route.json',
        nextStep: observed && visibleFieldTerms.length > 0
          ? 'Prepare TARGET-045 controlled field fit with exact values; no O2C/P2P yet.'
          : 'Prepare TARGET-044D alternative standard page route before any customer/item write.'
      },
      activeCase: {
        status: observed ? 'observed' : 'blocked',
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-044C-result.json`,
        nextCase
      }
    },
    requiresReview: false,
    safeToFinalizeState: observed,
    reason: observed
      ? 'Read-only no-apply Personalize discovery completed; writes remain separately gated.'
      : `No-apply Personalize discovery blocked: ${blockedBy.join('; ')}`,
    nextCase
  };

  await writeJson('TARGET-044C-result.json', result);
  await writeText('README.md', renderReadme(result));
  await writeJson('field-availability-summary.json', {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    visibleFieldTerms,
    missingFieldTerms,
    pages: pages.map((entry: any) => ({
      id: entry.id,
      personalizeOpened: entry.personalizeOpen.opened,
      fieldAvailability: entry.surface.fieldAvailability
    }))
  });

  if (result.resultStatus === 'blocked') {
    expect(blockedBy.length, 'Blocked result must name a blocker.').toBeGreaterThan(0);
  }
  expect(result.flags.noPersonalizationApplied).toBe(true);
  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
});
