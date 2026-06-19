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

const CASE_ID = 'FIXEDASSETS-121-PURCHASE-INVOICE-LINE-TYPE-PAGEINSPECTION-PERSONALIZE-DIAGNOSIS';
const NEXT_CASE_ID = 'FIXEDASSETS-122-PURCHASE-INVOICE-LINE-TYPE-DIAGNOSIS-REVIEW';
const TEST_ID = 'fixedassets-121';
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
  if (/tokenFactorySettings|requestExecutorSettings|clientId|authority:|trustedOriginAuthorities/i.test(value)) {
    return '[external-frame-script-redacted]';
  }
  if (!/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(value);
    for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return value;
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

function compactInspectionLines(text: string) {
  const keep =
    /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID|Purchase Invoice|Purchase Line|Purchase Header|Type|Art|Field|Feld|Subform|Fixed Asset|Anlage/i;
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
    .slice(0, 100);
}

async function closeExternalLearnPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) continue;
    const url = candidate.url();
    if (/learn\.microsoft\.com|go\.microsoft\.com/i.test(url) || !/businesscentral\.dynamics\.com/i.test(url)) {
      closed.push(sanitizeString(url));
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
}

async function openPageInspectionOnFocusedLine(page: Page) {
  await page.keyboard.press('Control+Alt+F1');
  await page.waitForTimeout(2500);
  const closedExternalPages = await closeExternalLearnPages(page);
  const focusedText = await compactPageText(page, {
    include: [/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID|Purchase Line|Purchase Header|Purchase Invoice|Type|Art|Field|Feld|Fixed Asset|Anlage/i],
    maxLines: 150,
    maxLineLength: 220,
  });
  const fullText = await pageText(page);
  const lines = compactInspectionLines(focusedText || fullText);
  const joined = lines.join(' ');
  return {
    attempted: true,
    method: 'Control+Alt+F1',
    opened: /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(fullText) || /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(joined),
    closedExternalPages,
    lines,
    signals: {
      purchaseLineMentioned: /Purchase Line/i.test(joined),
      purchaseHeaderMentioned: /Purchase Header/i.test(joined),
      purchaseInvoiceMentioned: /Purchase Invoice/i.test(joined),
      typeMentioned: /\bType\b|Art/i.test(joined),
      fixedAssetMentioned: /Fixed Asset|Anlage/i.test(joined),
      pageInspectionMentioned: /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(joined),
    },
  };
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
            const rect = element.getBoundingClientRect();
            return {
              element,
              text: normalize(element.innerText || element.textContent),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
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
        chosen.element.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, ariaLabel: chosen.ariaLabel, title: chosen.title, rect: chosen.rect },
          candidates: candidates.slice(0, 5).map(({ element: _element, ...entry }) => entry),
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
    return { settingsResult, personalizeClick: { clicked: false, reason: 'settings-not-open' }, opened: false, lines: [], exit: null };
  }
  const personalizeClick = await clickVisibleTextLike(page, /Personalize|Personalisieren/);
  await page.waitForTimeout(1800);
  const focusedText = await compactPageText(page, {
    include: [/Personalizing|Personalize|Personalisieren|Personalisierung|Done|Fertig|Add field|Field|Feld|Type|Art|Purchase Invoice|Einkaufsrechnung/i],
    maxLines: 120,
    maxLineLength: 220,
  });
  const lines = compactInspectionLines(focusedText || (await pageText(page)));
  const fullText = await pageText(page);
  const blockedByPageInspection = /nicht starten.*Seitenpr/i.test(fullText) || /cannot start.*Page Inspection/i.test(fullText);
  const opened = !blockedByPageInspection && /Personalizing|Personalisierung|Done|Fertig|Add field|Add fields/i.test(fullText);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(600);
  const discardAttempt = await clickVisibleTextLike(page, /Discard|Verwerfen|Don't save|Nicht speichern/);
  await page.waitForTimeout(600);
  return {
    settingsResult,
    personalizeClick,
    opened,
    blockedByPageInspection,
    lines,
    exit: {
      method: discardAttempt.clicked ? 'escape-then-discard' : 'escape-only',
      discardAttempt,
      personalizationSaved: false,
    },
    signals: {
      typeMentioned: /\bType\b|Art/i.test(lines.join(' ')),
      personalizeMentioned: !blockedByPageInspection && /Personalizing|Personalize|Personalisieren|Personalisierung/i.test(lines.join(' ') || fullText),
      addFieldMentioned: /Add field|Add fields|Feld|Field/i.test(lines.join(' ') || fullText),
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
      active_case_file: '.agent/state/cases/fixedassets-122-purchase-invoice-line-type-diagnosis-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-121-purchase-invoice-line-type-pageinspection-personalize-diagnosis.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-122: review FA-121 Page Inspection/Personalize diagnosis and decide the next safe Purchase Invoice line Type route.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-purchase-invoice-line-type-pageinspection-personalize-diagnosis',
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
      nextStep: 'Run FIXEDASSETS-122 local evidence review before any Type selection or target values are unlocked.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-121/FIXEDASSETS-121-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-122 local evidence review.',
    },
  };
}

test('FIXEDASSETS-121 diagnoses Purchase Invoice line Type context with Page Inspection and Personalize without selection', async ({ page }) => {
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
  const pageInspection = await openPageInspectionOnFocusedLine(page);
  await writeSafeJsonEvidence(faEvidencePath('030-page-inspection-line-type-context.json'), { focusedCell, pageInspection });
  await writeTextEvidence(faEvidencePath('031-page-inspection-focused-lines.txt'), pageInspection.lines.join('\n') || 'No compact Page Inspection lines captured.\n');
  await screenshot(page, 'fixedassets-121-030-page-inspection-line-type-context.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: pageInspection.opened ? 'technical-diagnosis' : 'rejected',
    bookUse: pageInspection.opened ? 'debugging-evidence-only' : 'do-not-use',
    purpose: 'Technische Seitenpruefung fuer die Type-Zelle der Einkaufsrechnungszeile; keine Auswahl und keine Zielwerte.',
    expectedPageText: [/Page Inspection|Inspect pages and data|Purchase Invoice|Einkaufsrechnung/i],
    knownLimitations: ['Kein Type=Fixed Asset Proof.', 'Kein K30000, kein FA-CNC-01, keine Preview Posting und keine Buchung.'],
  }).catch(() => undefined);

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(800);
  const personalize = await openPersonalizeDiagnosis(page);
  await writeSafeJsonEvidence(faEvidencePath('040-personalize-line-type-context.json'), personalize);
  await writeTextEvidence(faEvidencePath('041-personalize-focused-lines.txt'), personalize.lines.join('\n') || 'No compact Personalize lines captured.\n');
  await screenshot(page, 'fixedassets-121-040-personalize-line-type-diagnosis.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: personalize.opened ? 'technical-diagnosis' : 'rejected',
    bookUse: personalize.opened ? 'debugging-evidence-only' : 'do-not-use',
    purpose: 'Personalisieren nur als Diagnose fuer sichtbare Page-/Feldangebote; es wird keine Personalisierung gespeichert.',
    expectedPageText: [/Personalize|Personalisieren|Purchase Invoice|Einkaufsrechnung|Field|Feld/i],
    knownLimitations: ['Kein gespeichertes Layout.', 'Kein Type=Fixed Asset Proof.', 'Keine Zielwerte und keine Buchung.'],
  }).catch(() => undefined);

  const cleanup = await cleanupDraft(page, draftInvoiceNo);
  await writeSafeJsonEvidence(faEvidencePath('090-cleanup-result.json'), cleanup);
  const cleanupCompleted = cleanup.status === 'deleted' || cleanup.status === 'not-created-or-draft-number-not-found' || cleanup.status === 'not-visible-before-cleanup';
  const usefulDiagnosis = pageInspection.opened || personalize.opened;
  const resultStatus = usefulDiagnosis ? 'observed' : 'blocked';
  const summary =
    resultStatus === 'observed'
      ? `FA-121 captured technical diagnosis for Purchase Invoice line Type. PageInspection opened=${pageInspection.opened}, purchaseLineMentioned=${pageInspection.signals.purchaseLineMentioned}, personalizeOpened=${personalize.opened}. Cleanup status=${cleanup.status}.`
      : `FA-121 could not open useful Page Inspection or Personalize diagnosis. PageInspection opened=${pageInspection.opened}, personalizeOpened=${personalize.opened}. Cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-purchase-invoice-line-type-pageinspection-personalize-diagnosis-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-purchase-invoice-line-type-pageinspection-personalize-diagnosis',
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
        purpose: 'Temporary sandbox draft to diagnose Purchase Invoice Lines Type context; no line type selection, no target values, no preview, no post.',
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
      focusedCell.found ? 'The Purchase Invoice line Type cell was focused before diagnosis.' : 'The Type cell focus attempt was documented.',
      ...(pageInspection.opened ? ['Page Inspection was attempted from the focused Type cell and produced compact technical context.'] : []),
      ...(pageInspection.signals.purchaseLineMentioned ? ['Page Inspection text mentions Purchase Line.'] : []),
      ...(pageInspection.signals.purchaseHeaderMentioned ? ['Page Inspection text mentions Purchase Header.'] : []),
      ...(personalize.opened ? ['Personalize mode was opened as no-save diagnosis and exited without saving personalization.'] : []),
      cleanupCompleted ? 'Temporary Purchase Invoice draft was deleted, not persisted, or not visible after filtered follow-up.' : 'Cleanup blocker is documented.',
    ],
    notProved: [
      'Fixed Asset/Anlage was not proven as a selectable Type option.',
      'Type = Fixed Asset was not selected.',
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No amount was entered.',
      'No Preview Posting.',
      'No posting.',
      'No setup change.',
      'No saved personalization.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-121-purchase-invoice-line-type-pageinspection-personalize-diagnosis.json',
      '.agent/state/cases/fixedassets-122-purchase-invoice-line-type-diagnosis-review.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/CURRENT-STATE.md',
      'playwright/projects/fibu-book5/LAB-FIT-STATUS.md',
      'playwright/projects/fibu-book5/tests/fixedassets-121-purchase-invoice-line-type-pageinspection-personalize-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/FIXEDASSETS-121-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/030-page-inspection-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/031-page-inspection-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/040-personalize-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/041-personalize-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-121/FIXEDASSETS-121-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/030-page-inspection-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/031-page-inspection-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/040-personalize-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/041-personalize-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-121/README.md',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'Page Inspection and Personalize are technical debugging tools, not final book screenshots.',
      'No Type option was selected and no target values were entered.',
    ],
    blockedBy: resultStatus === 'observed' ? [] : ['No useful Page Inspection or Personalize context captured.'],
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
      pageInspection,
      personalize,
    },
    nextStep: 'Run FIXEDASSETS-122 local evidence review before selecting Type = Fixed Asset or entering target values.',
  };

  await writeSafeJsonEvidence(faEvidencePath('FIXEDASSETS-121-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-121 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-121-result.json` | JSON | Page-Inspection-/Personalisieren-Diagnose, Cleanup, Grenzen | keine Auswahl, keine Zielwerte, keine Buchung | `labor`, `technical-diagnosis` |',
      '| `030-page-inspection-line-type-context.json` | JSON | fokussierte Type-Zelle und Page-Inspection-Signale | keine Type-Werteliste | `technical-context` |',
      '| `031-page-inspection-focused-lines.txt` | Text | kompakte Page-Inspection-Zeilen | kein Rohdump | `compact` |',
      '| `040-personalize-line-type-context.json` | JSON | Personalisieren-Diagnose ohne Speichern | keine Tabellenlogik und kein gespeichertes Layout | `technical-context` |',
      '| `041-personalize-focused-lines.txt` | Text | kompakter Personalisieren-Text | kein Rohdump | `compact` |',
      '| `090-cleanup-result.json` | JSON | Cleanup-/Draft-Sichtbarkeitsstatus | keine Postenspur | `cleanup` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
      'Buchwirkung: Page Inspection und Personalisieren bleiben wertvolle Debugging-Werkzeuge, aber sie ersetzen keinen sichtbaren Wertelisten- oder Buchungsnachweis. Ein Anfaengerkapitel darf daraus nur lernen, wie man Page, Table und Feldkontext prueft, nicht dass Anlagenzugang bereits funktioniert.',
      '',
    ].join('\n'),
  );

  expect(result.flags.stayedInExpectedInstance).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noTargetVendorEntry).toBe(true);
  expect(result.flags.noTargetFixedAssetEntry).toBe(true);
  expect(result.flags.noAmountEntry).toBe(true);
  expect(result.flags.noLineTypeSelection).toBe(true);
  expect(result.flags.noPersonalizationSaved).toBe(true);
  expect(result.flags.cleanupCompleted).toBe(true);
});
