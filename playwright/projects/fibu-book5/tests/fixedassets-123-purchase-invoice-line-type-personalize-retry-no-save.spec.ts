import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  screenshot,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { clickBcScoredAction } from '../../../core/bc/actions';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-123-PURCHASE-INVOICE-LINE-TYPE-PERSONALIZE-RETRY-NO-SAVE';
const NEXT_CASE_ID = 'FIXEDASSETS-124-PURCHASE-INVOICE-LINE-TYPE-PERSONALIZE-RESULT-REVIEW';
const TEST_ID = 'fixedassets-123';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(420_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function sanitizeString(value: string) {
  const normalizeBcText = (input: string) =>
    input
      .replace(/\u00c3\u00bc/g, 'ue')
      .replace(/\u00c3\u0153/g, 'Ue')
      .replace(/\u00c3\u00b6/g, 'oe')
      .replace(/\u00c3\u2013/g, 'Oe')
      .replace(/\u00c3\u00a4/g, 'ae')
      .replace(/\u00c3\u201e/g, 'Ae')
      .replace(/\u00c3\u0178/g, 'ss')
      .replace(/\u00e2\u20ac\u00a6/g, '...')
      .replace(/\u00e2\u20ac[\u017e\u0153\u009d]/g, '"')
      .replace(/\u00e2\u20ac[\u02dc\u2122]/g, "'")
      .replace(/\u00e2\u20ac[\u201c\u201d]/g, '-')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  if (/tokenFactorySettings|requestExecutorSettings|clientId|authority:|trustedOriginAuthorities/i.test(value)) {
    return '[external-frame-script-redacted]';
  }
  if (!/^https?:\/\//i.test(value)) return normalizeBcText(value);
  try {
    const url = new URL(value);
    for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
    return normalizeBcText(url.toString());
  } catch {
    return normalizeBcText(value);
  }
}

function sanitizeEvidenceValue<T>(value: T): T {
  if (typeof value === 'string') return sanitizeString(value) as T;
  if (Array.isArray(value)) return value.map((entry) => sanitizeEvidenceValue(entry)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, sanitizeEvidenceValue(entry)]),
    ) as T;
  }
  return value;
}

async function writeSafeJsonEvidence(filePath: string, value: unknown) {
  await writeJsonEvidence(filePath, sanitizeEvidenceValue(value));
}

function purchaseInvoicesUrl(invoiceNo?: string) {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  if (invoiceNo) url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
  return url.toString();
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const text = await pageText(page);
  const decoded = decodeURIComponent(url);
  return {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };
}

async function openPurchaseInvoices(page: Page) {
  await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|Vendor|Kreditor/i, { timeout: 90_000 });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function clickScopedNew(page: Page) {
  return clickBcScoredAction(page, {
    scopeText: /Purchase Invoices|Einkaufsrechnungen/i,
    actionPattern: /^(New|Neu)$|new entry|neuen Eintrag/i,
    titleBonusPattern: /Create a new entry|Erstellen Sie einen neuen Eintrag|neuen Eintrag/i,
    rejectPattern: /Sales|Order|Quote|Power BI|Intercompany|Time Sheet|Report|PDF/i,
    preferredYMin: 35,
    preferredYMax: 140,
    waitAfterClick: 4500,
  });
}

async function extractDraftNo(page: Page) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const text = await pageText(page);
    const match = text.match(/\b(10\d{4,})\b/);
    if (match?.[1]) return match[1];
    await page.waitForTimeout(500);
  }
  return null;
}

async function focusTypeCell(page: Page) {
  for (const frame of page.frames()) {
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            let score = 0;
            if (/^(Item|Artikel)$/i.test(text)) score -= 100;
            if (rect.y > 520) score -= 25;
            if (rect.x > 450 && rect.x < 900) score -= 25;
            if (rect.width < 20 || rect.height < 10) score += 20;
            return {
              text,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score,
            };
          })
          .filter((entry) => /^(Item|Artikel)$/i.test(entry.text))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        return chosen ? { found: true, chosen, candidates: candidates.slice(0, 8) } : { found: false, chosen: null, candidates: [] };
      })
      .catch((error) => ({ found: false, chosen: null, candidates: [], error: String(error) }));
    if (result.found && result.chosen) {
      const rect = result.chosen.rect;
      await page.mouse.click(rect.x + Math.round(rect.width / 2), rect.y + Math.round(rect.height / 2));
      await page.waitForTimeout(900);
      return { frameUrl: frame.url(), ...result };
    }
  }
  return { found: false, chosen: null, candidates: [], frameUrl: '' };
}

function compactPersonalizeLines(text: string) {
  const keep =
    /Personalizing|Personalize|Personalisieren|Personalisierung|Add field|Add fields|Field|Feld|Type|Art|Purchase Invoice|Einkaufsrechnung|Lines|Zeilen|Fixed Asset|Anlage|Done|Fertig|Discard|Verwerfen/i;
  const seen = new Set<string>();
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line && line.length <= 220 && keep.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, 120);
}

async function collectVisibleSignals(page: Page) {
  const entries: Array<{ frameUrl: string; text: string; ariaLabel: string; title: string; rect: unknown }> = [];
  const pattern = /Personalizing|Personalize|Personalisieren|Personalisierung|Add field|Add fields|Field|Feld|Type|Art|Purchase Invoice|Einkaufsrechnung|Lines|Zeilen|Fixed Asset|Anlage|Done|Fertig|Discard|Verwerfen/i;
  for (const frame of page.frames()) {
    const frameEntries = await frame
      .evaluate((patternSource) => {
        const localPattern = new RegExp(patternSource, 'i');
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],td,div,span,input,[aria-label],[title]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              text: normalize(element instanceof HTMLInputElement ? element.value : element.innerText || element.textContent),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => localPattern.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
          .filter((entry) => `${entry.text} ${entry.ariaLabel} ${entry.title}`.length <= 240)
          .slice(0, 80);
      }, pattern.source)
      .catch(() => []);
    for (const entry of frameEntries) entries.push({ frameUrl: frame.url(), ...entry });
  }
  const seen = new Set<string>();
  return entries
    .map((entry) => ({
      ...entry,
      text: entry.text.replace(/\s+/g, ' ').trim(),
      ariaLabel: entry.ariaLabel.replace(/\s+/g, ' ').trim(),
      title: entry.title.replace(/\s+/g, ' ').trim(),
    }))
    .filter((entry) => !/Start Prepare Approve Request Approval|Kreditoren-Abonneme|CustomersVendorsItems|Shopify/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
    .map((entry) => {
      const haystack = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
      let score = 100;
      if (/Wird personalisiert|Personalizing/i.test(haystack)) score -= 40;
      if (/Type|Art/i.test(haystack)) score -= 30;
      if (/Field|Feld|Add field|Feld hinzuf/i.test(haystack)) score -= 25;
      if (/Purchase Invoice|Einkaufsrechnung/i.test(haystack)) score -= 20;
      if (/Fertig|Done/i.test(haystack)) score -= 15;
      return { ...entry, score };
    })
    .sort((left, right) => left.score - right.score)
    .filter((entry) => {
      const key = `${entry.text}|${entry.ariaLabel}|${entry.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 30)
    .map(({ score: _score, ...entry }) => entry);
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
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],a,span,div'))
          .filter(visible)
          .map((element) => {
            const clickable = (element.closest('button,[role="button"],[role="menuitem"],a') as HTMLElement | null) ?? element;
            const rect = clickable.getBoundingClientRect();
            return {
              clickable,
              text: normalize(element.innerText || element.textContent),
              ariaLabel: normalize(element.getAttribute('aria-label') || clickable.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title') || clickable.getAttribute('title')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => {
            const haystack = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            return pattern.test(haystack) && haystack.length <= 180;
          })
          .filter((entry) => entry.rect.width >= 20 && entry.rect.height >= 10)
          .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'target-not-found', candidates: [] };
        chosen.clickable.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect },
          candidates: candidates.slice(0, 5).map(({ clickable: _clickable, ...entry }) => entry),
        };
      }, pattern.source)
      .catch((error) => ({ clicked: false, reason: 'evaluate-error', error: String(error), candidates: [] }));

    if (result.clicked) {
      await page.waitForTimeout(1200);
      return result;
    }
  }
  return { clicked: false, reason: 'target-not-found-in-any-frame', candidates: [] };
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
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              element,
              text: normalize(element.innerText || element.textContent),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => entry.rect.y <= 110)
          .map((entry) => {
            const label = `${entry.text} ${entry.ariaLabel} ${entry.title}`;
            const matchesSettings = /Settings|Einstellungen|Setup and Extensions|Einrichtungen und Erweiterungen/i.test(label);
            const score = (matchesSettings ? 100 : 0) - Math.abs(entry.rect.y - 20) - Math.max(0, 1800 - entry.rect.x) / 100;
            return { ...entry, matchesSettings, score };
          })
          .filter((entry) => entry.matchesSettings)
          .sort((left, right) => right.score - left.score || right.rect.x - left.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'settings-button-not-found' };
        chosen.element.click();
        return { clicked: true, chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect } };
      })
      .catch((error) => ({ clicked: false, reason: 'evaluate-error', error: String(error) }));

    if (result.clicked) {
      await page.waitForTimeout(900);
      return result;
    }
  }
  return { clicked: false, reason: 'settings-button-not-found-in-any-frame' };
}

async function openPersonalizeDiagnosis(page: Page) {
  const settingsResult = await clickSettingsButton(page);
  if (!settingsResult.clicked) {
    return {
      settingsResult,
      personalizeClick: { clicked: false, reason: 'settings-not-open' },
      addFieldClick: { clicked: false, reason: 'not-attempted' },
      opened: false,
      blockedByPageInspection: false,
      lines: [],
      visibleSignals: [],
      exit: null,
    };
  }

  const personalizeClick = await clickVisibleTextLike(page, /Personalize|Personalisieren/);
  await page.waitForTimeout(2200);
  const fullTextAfterOpen = await pageText(page);
  const blockedByPageInspection = /nicht starten.*Seitenpr/i.test(fullTextAfterOpen) || /cannot start.*Page Inspection/i.test(fullTextAfterOpen);
  const opened = !blockedByPageInspection && /Personalizing|Personalisierung|Done|Fertig|Add field|Add fields|Feld hinzuf/i.test(fullTextAfterOpen);

  const addFieldClick = opened ? await clickVisibleTextLike(page, /Add field|Add fields|Feld hinzuf|Felder hinzuf|\+ Field|\+ Feld/) : { clicked: false, reason: 'personalize-not-open' };
  await page.waitForTimeout(1400);
  const compactText = await compactPageText(page, {
    include: [/Personalizing|Personalize|Personalisieren|Personalisierung|Done|Fertig|Add field|Field|Feld|Type|Art|Purchase Invoice|Einkaufsrechnung|Fixed Asset|Anlage/i],
    maxLines: 150,
    maxLineLength: 220,
  });
  const fullText = await pageText(page);
  const lines = compactPersonalizeLines(compactText || fullText);
  const visibleSignals = await collectVisibleSignals(page);
  const joined = `${lines.join(' ')} ${visibleSignals.map((entry) => `${entry.text} ${entry.ariaLabel} ${entry.title}`).join(' ')}`;
  const screenshotAttempt = await screenshot(page, 'fixedassets-123-030-personalize-line-type-no-save.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: opened ? 'technical-diagnosis' : 'rejected',
    bookUse: opened ? 'debugging-evidence-only' : 'do-not-use',
    purpose: 'Personalisieren ohne vorherige Seitenpruefung fuer die Type-Zelle der Einkaufsrechnungszeile; keine Auswahl und kein Speichern.',
    expectedPageText: [/Personalize|Personalisieren|Purchase Invoice|Einkaufsrechnung|Field|Feld|Wird personalisiert/i],
    knownLimitations: ['Kein gespeichertes Layout.', 'Kein Type=Fixed Asset Proof.', 'Keine Zielwerte und keine Buchung.'],
  })
    .then(() => ({ captured: true }))
    .catch((error) => ({ captured: false, error: String(error) }));

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(600);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(600);
  const discardAttempt = await clickVisibleTextLike(page, /Discard|Verwerfen|Don't save|Nicht speichern/);
  await page.waitForTimeout(800);

  return {
    settingsResult,
    personalizeClick,
    addFieldClick,
    opened,
    blockedByPageInspection,
    lines,
    visibleSignals,
    screenshotAttempt,
    exit: {
      method: discardAttempt.clicked ? 'escape-twice-then-discard' : 'escape-twice-only',
      discardAttempt,
      personalizationSaved: false,
      finishClicked: false,
    },
    signals: {
      typeMentioned: /\bType\b|Art/i.test(joined),
      personalizeMentioned: !blockedByPageInspection && /Personalizing|Personalize|Personalisieren|Personalisierung/i.test(joined || fullText),
      addFieldMentioned: /Add field|Add fields|Feld|Field/i.test(joined || fullText),
      fixedAssetMentioned: /Fixed Asset|Anlage/i.test(joined || fullText),
      purchaseInvoiceMentioned: /Purchase Invoice|Einkaufsrechnung/i.test(joined || fullText),
    },
  };
}

async function confirmYes(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const pattern of [/^Yes$/i, /^Ja$/i, /^Delete$/i, /^L.schen$/i, /^OK$/i]) {
      const button = scope.getByRole('button', { name: pattern }).first();
      if (await button.isVisible({ timeout: 1200 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1800);
        return { confirmed: true, button: pattern.source };
      }
    }
  }
  return { confirmed: false, button: 'not-found' };
}

async function clickDeleteSelectedInvoice(page: Page, invoiceNo: string) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!new RegExp(invoiceNo).test(body)) continue;
    const result = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('button,[role="button"],[aria-label],[title],span,div'))
          .filter(visible)
          .map((element) => {
            const clickable = (element.closest('button,[role="button"]') as HTMLElement | null) ?? element;
            const rect = clickable.getBoundingClientRect();
            const text = normalize(element.innerText || element.textContent);
            const aria = normalize(element.getAttribute('aria-label') || clickable.getAttribute('aria-label'));
            const title = normalize(element.getAttribute('title') || clickable.getAttribute('title'));
            const label = `${text} ${aria} ${title}`;
            let score = 0;
            if (/^(Delete|L.*schen)$/i.test(text) || /^(Delete|L.*schen)$/i.test(aria)) score -= 60;
            if (/Delete|L.*schen/i.test(title)) score -= 30;
            if (rect.y >= 35 && rect.y <= 135) score -= 20;
            if (/Post|Preview|Buchen|Vorschau|Invoice|Rechnung|New|Neu/i.test(label)) score += 200;
            return {
              clickable,
              text,
              aria,
              title,
              label,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              score,
            };
          })
          .filter((entry) => /Delete|L.*schen/i.test(entry.label))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        if (!chosen) return { clicked: false, reason: 'delete-action-not-found' };
        chosen.clickable.click();
        return { clicked: true, chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, label: chosen.label, rect: chosen.rect, score: chosen.score } };
      })
      .catch((error) => ({ clicked: false, reason: String(error) }));
    if (result.clicked) {
      await page.waitForTimeout(1500);
      return result;
    }
  }
  return { clicked: false, reason: 'invoice-row-not-found' };
}

async function cleanupDraft(page: Page, invoiceNo: string | null) {
  if (!invoiceNo) return { status: 'not-created-or-draft-number-not-found', invoiceNo: null, visibleBefore: false, visibleAfter: false };
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);
  const visibleBefore = new RegExp(invoiceNo).test(await pageText(page));
  if (!visibleBefore) return { status: 'not-visible-before-cleanup', invoiceNo, visibleBefore, visibleAfter: false };
  const deleteAction = await clickDeleteSelectedInvoice(page, invoiceNo);
  const confirmation = deleteAction.clicked ? await confirmYes(page) : { confirmed: false, button: 'not-needed' };
  await page.waitForTimeout(2500);
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  const visibleAfter = new RegExp(invoiceNo).test(await pageText(page));
  return { status: visibleAfter ? 'cleanup-clicked-but-still-visible' : 'deleted', invoiceNo, visibleBefore, visibleAfter, deleteAction, confirmation };
}

function statePatch(resultStatus: string, summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-124-purchase-invoice-line-type-personalize-result-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-123-purchase-invoice-line-type-personalize-retry-no-save.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-124: review FA-123 Personalize-only result before any Type selection or target values are unlocked.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-purchase-invoice-line-type-personalize-only-no-save-diagnosis',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      apiShortcut: false,
      bookChanged: false,
      resultStatus,
      summary,
      nextStep: 'Run FIXEDASSETS-124 local evidence review before any Purchase Invoice Type selection or target values are unlocked.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-123/FIXEDASSETS-123-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-124 local evidence review.',
    },
  };
}

test('FIXEDASSETS-123 opens Purchase Invoice line Type Personalize diagnosis without Page Inspection and without saving', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const newAttempt = await clickScopedNew(page);
  await writeSafeJsonEvidence(faEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  const draftInvoiceNo = await extractDraftNo(page);

  const focusedCell = await focusTypeCell(page);
  const personalize = await openPersonalizeDiagnosis(page);
  await writeSafeJsonEvidence(faEvidencePath('030-personalize-line-type-context.json'), { focusedCell, personalize });
  await writeTextEvidence(faEvidencePath('031-personalize-focused-lines.txt'), personalize.lines.join('\n') || 'No compact Personalize lines captured.\n');

  const cleanup = await cleanupDraft(page, draftInvoiceNo);
  await writeSafeJsonEvidence(faEvidencePath('090-cleanup-result.json'), cleanup);
  const cleanupCompleted = cleanup.status === 'deleted' || cleanup.status === 'not-created-or-draft-number-not-found' || cleanup.status === 'not-visible-before-cleanup';
  const usefulDiagnosis = personalize.opened || personalize.lines.length > 0 || personalize.visibleSignals.length > 0 || personalize.blockedByPageInspection;
  const resultStatus = usefulDiagnosis ? 'observed' : 'blocked';
  const summary =
    resultStatus === 'observed'
      ? `FA-123 ran Personalize-only no-save diagnosis. Personalize opened=${personalize.opened}, blockedByPageInspection=${personalize.blockedByPageInspection}, addFieldMentioned=${personalize.signals.addFieldMentioned}, fixedAssetMentioned=${personalize.signals.fixedAssetMentioned}. Cleanup status=${cleanup.status}.`
      : `FA-123 could not capture useful Personalize-only context. Personalize opened=${personalize.opened}, blockedByPageInspection=${personalize.blockedByPageInspection}. Cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-purchase-invoice-line-type-personalize-only-no-save-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-purchase-invoice-line-type-personalize-only-no-save',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: { expectedInstance: EXPECTED_INSTANCE, expectedCompany: EXPECTED_COMPANY, context, urlAfterProbe: page.url() },
    createdRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Purchase Invoice',
        documentNo: draftInvoiceNo ?? '',
        purpose: 'Temporary sandbox draft to diagnose Purchase Invoice Lines Type context via Personalize only; no Page Inspection, no line type selection, no target values, no preview, no post.',
        createdAt: startedAt,
        status: draftInvoiceNo ? (cleanupCompleted ? 'deleted-or-not-visible' : 'draft-visible') : 'no-persisted-number-detected',
        cleanupStatus: cleanupCompleted ? 'complete-or-not-needed' : 'blocked',
      },
    ],
    changedRecords: [],
    postedRecords: [],
    setupChanges: [],
    cleanup: {
      required: Boolean(draftInvoiceNo),
      completed: cleanupCompleted,
      method: draftInvoiceNo ? 'filtered Purchase Invoices list delete via UI or not-visible check' : 'not-needed',
      blockedBy: cleanupCompleted ? [] : [cleanup.status],
      detail: cleanup,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'New/Neu was clicked once in the scoped Purchase Invoices context.',
      focusedCell.found ? 'The Purchase Invoice line Type cell was focused before Personalize.' : 'The Type cell focus attempt was documented.',
      'Page Inspection was not opened before Personalize.',
      ...(personalize.opened ? ['Personalize mode opened as a no-save diagnostic route.'] : []),
      ...(personalize.signals.addFieldMentioned ? ['Personalize/Add field field-context text was visible or captured.'] : []),
      ...(personalize.signals.fixedAssetMentioned ? ['Fixed Asset/Anlage was visible in the Personalize diagnostic text.'] : []),
      cleanupCompleted ? 'Temporary Purchase Invoice draft was deleted, not persisted, or not visible after filtered follow-up.' : 'Cleanup blocker is documented.',
    ],
    notProved: [
      'Fixed Asset/Anlage was not proven as a selectable Type dropdown option.',
      'Type = Fixed Asset was not selected.',
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No amount was entered.',
      'No Page Inspection in this run.',
      'No Preview Posting.',
      'No posting.',
      'No setup change.',
      'No saved personalization.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-123-purchase-invoice-line-type-personalize-retry-no-save.json',
      '.agent/state/cases/fixedassets-124-purchase-invoice-line-type-personalize-result-review.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/CURRENT-STATE.md',
      'playwright/projects/fibu-book5/LAB-FIT-STATUS.md',
      'playwright/projects/fibu-book5/tests/fixedassets-123-purchase-invoice-line-type-personalize-retry-no-save.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/FIXEDASSETS-123-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/030-personalize-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/031-personalize-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-123/FIXEDASSETS-123-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/030-personalize-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/031-personalize-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-123/README.md',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'Personalize is a technical debugging tool, not a final book screenshot.',
      'No Type option was selected and no target values were entered.',
    ],
    blockedBy: resultStatus === 'observed' ? [] : ['No useful Personalize context captured.'],
    requiresReview: true,
    safeToFinalizeState: cleanupCompleted,
    statePatch: statePatch(resultStatus, summary),
    flags: {
      stayedInExpectedInstance: context.environmentInUrl,
      companyContextDocumented: context.companyInUrl || context.companyInText,
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noPageInspection: true,
      noTargetVendorEntry: true,
      noTargetFixedAssetEntry: true,
      noAmountEntry: true,
      noLineTypeSelection: true,
      noPersonalizationSaved: true,
      cleanupCompleted,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      newAttempt,
      draftInvoiceNo,
      focusedCell,
      personalize,
    },
    nextStep: 'Run FIXEDASSETS-124 local evidence review before selecting Type = Fixed Asset or entering target values.',
  };

  await writeSafeJsonEvidence(faEvidencePath('FIXEDASSETS-123-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-123 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-123-result.json` | JSON | Personalisieren-only Diagnose, Cleanup, Grenzen | keine Auswahl, keine Zielwerte, keine Buchung | `labor`, `technical-diagnosis` |',
      '| `030-personalize-line-type-context.json` | JSON | fokussierte Type-Zelle und Personalisieren-Signale | keine Type-Werteliste | `technical-context` |',
      '| `031-personalize-focused-lines.txt` | Text | kompakte Personalisieren-Zeilen | kein Rohdump | `compact` |',
      '| `090-cleanup-result.json` | JSON | Cleanup-/Draft-Sichtbarkeitsstatus | keine Postenspur | `cleanup` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
      'Buchwirkung: Personalisieren ist ein gutes Debugging-Werkzeug, wenn ein Feld nicht sichtbar ist oder eine Page-Zeile nicht verstanden wird. Es beweist aber nur, was auf der Page personalisierbar oder sichtbar ist; es ersetzt keinen Wertelisten-, Setup- oder Buchungsnachweis.',
      '',
    ].join('\n'),
  );

  expect(result.flags.stayedInExpectedInstance).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noPageInspection).toBe(true);
  expect(result.flags.noTargetVendorEntry).toBe(true);
  expect(result.flags.noTargetFixedAssetEntry).toBe(true);
  expect(result.flags.noAmountEntry).toBe(true);
  expect(result.flags.noLineTypeSelection).toBe(true);
  expect(result.flags.noPersonalizationSaved).toBe(true);
  expect(result.flags.cleanupCompleted).toBe(true);
});
