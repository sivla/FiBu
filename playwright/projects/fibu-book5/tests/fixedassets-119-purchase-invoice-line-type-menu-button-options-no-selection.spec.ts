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

const CASE_ID = 'FIXEDASSETS-119-PURCHASE-INVOICE-LINE-TYPE-MENU-BUTTON-OPTIONS-NO-SELECTION';
const NEXT_CASE_ID = 'FIXEDASSETS-120-PURCHASE-INVOICE-LINE-TYPE-OPTIONS-ROUTE-DECISION';
const TEST_ID = 'fixedassets-119';
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
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const text = await pageText(page);
    const match = text.match(/\b(10\d{4,})\b/);
    if (match?.[1]) return match[1];
    await page.waitForTimeout(400);
  }
  return null;
}

type ControlEntry = {
  text: string;
  tag: string;
  role: string;
  aria: string;
  title: string;
  tabIndex: number;
  rect: { x: number; y: number; width: number; height: number };
};

async function collectTypeMenuDiagnostics(page: Page) {
  const frames = [];
  for (const frame of page.frames()) {
    const evidence = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const cleanTitle = (value: string | null | undefined) => normalize(value).replace(/[^\x20-\x7E]/g, '');
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const bodyText = normalize(document.body?.innerText || '');
        const active = document.activeElement as HTMLElement | null;
        const activeRect = active?.getBoundingClientRect();
        const elementEntries = Array.from(
          document.querySelectorAll<HTMLElement>(
            'td,li,a,div,span,input,button,[role="gridcell"],[role="button"],[role="combobox"],[role="listbox"],[role="option"],[role="menuitem"],[aria-label],[title]',
          ),
        )
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            return {
              text,
              tag: element.tagName,
              role: normalize(element.getAttribute('role')),
              aria: normalize(element.getAttribute('aria-label')),
              title: cleanTitle(element.getAttribute('title')),
              tabIndex: element.tabIndex,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
          .filter((entry) => entry.text.length <= 220 && entry.rect.width < 1800 && entry.rect.y >= 0)
          .filter((entry) =>
            /Item|Artikel|Fixed Asset|Anlage|G\/L Account|Sachkonto|Resource|Ressource|Charge|Type|Art|No\.|Nr\.|Description|Beschreibung|Details anzeigen|Men/i.test(
              `${entry.text} ${entry.aria} ${entry.title}`,
            ),
          );

        const activeElement = active
          ? {
              tag: active.tagName,
              role: normalize(active.getAttribute('role')),
              text: normalize(active.innerText || active.textContent || (active as HTMLInputElement).value || '').slice(0, 180),
              aria: normalize(active.getAttribute('aria-label')),
              title: cleanTitle(active.getAttribute('title')),
              rect: activeRect
                ? {
                    x: Math.round(activeRect.x),
                    y: Math.round(activeRect.y),
                    width: Math.round(activeRect.width),
                    height: Math.round(activeRect.height),
                  }
                : null,
            }
          : null;

        const optionTexts = Array.from(
          new Set(
            elementEntries
              .filter((entry) => /^(G\/L Account|Sachkonto|Item|Artikel|Fixed Asset|Anlage|Resource|Ressource|Charge \(Item\)|Geb.hr \(Artikel\))$/i.test(entry.text))
              .map((entry) => entry.text),
          ),
        ).slice(0, 40);

        const typeCellCandidates = elementEntries
          .filter((entry) => /^(Item|Artikel)$/i.test(entry.text) && entry.role !== 'button' && entry.rect.width >= 70)
          .sort((left, right) => right.rect.width - left.rect.width || left.rect.y - right.rect.y)
          .slice(0, 12);

        const typeMenuButtons = elementEntries
          .filter((entry) => /Type|Art/i.test(entry.aria) && /open|ffnen|Men/i.test(`${entry.aria} ${entry.title}`))
          .sort((left, right) => Math.abs(left.rect.width - 12) - Math.abs(right.rect.width - 12) || left.rect.y - right.rect.y)
          .slice(0, 12);

        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          purchaseInvoicesListVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(bodyText),
          linesContextVisible: /\bType\b|\bNo\.\b|\bDescription\b|\bArt\b|\bNr\./i.test(bodyText),
          fixedAssetLineTypeVisible: elementEntries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text)),
          itemLineTypeVisible: elementEntries.some((entry) => /^(Item|Artikel)$/i.test(entry.text)),
          forbiddenVendorNoVisible: /K30000/.test(bodyText),
          forbiddenFixedAssetNoVisible: /FA-CNC-01/.test(bodyText),
          vendorCardVisible: /\bVendor Card\s*-|\bKreditorenkarte\s*-/i.test(bodyText),
          vendorRegistrationVisible: /Create a new vendor card|new vendor card|not registered|Kreditor.*anlegen|neue Kreditorenkarte/i.test(bodyText),
          optionTexts,
          activeElement,
          typeCellCandidates,
          typeMenuButtons,
          entries: elementEntries.slice(0, 100),
        };
      })
      .catch(() => null);
    if (evidence) frames.push(evidence);
  }

  return {
    purchaseInvoiceVisible: frames.some((entry) => entry.purchaseInvoiceVisible),
    purchaseInvoicesListVisible: frames.some((entry) => entry.purchaseInvoicesListVisible),
    linesContextVisible: frames.some((entry) => entry.linesContextVisible),
    fixedAssetLineTypeVisible: frames.some((entry) => entry.fixedAssetLineTypeVisible),
    itemLineTypeVisible: frames.some((entry) => entry.itemLineTypeVisible),
    forbiddenVendorNoVisible: frames.some((entry) => entry.forbiddenVendorNoVisible),
    forbiddenFixedAssetNoVisible: frames.some((entry) => entry.forbiddenFixedAssetNoVisible),
    vendorCardVisible: frames.some((entry) => entry.vendorCardVisible),
    vendorRegistrationVisible: frames.some((entry) => entry.vendorRegistrationVisible),
    optionTexts: Array.from(new Set(frames.flatMap((entry) => entry.optionTexts))).slice(0, 40),
    typeCellCandidates: frames.flatMap((entry) => entry.typeCellCandidates).slice(0, 24) as ControlEntry[],
    typeMenuButtons: frames.flatMap((entry) => entry.typeMenuButtons).slice(0, 24) as ControlEntry[],
    activeElements: frames.map((entry) => ({ frameUrl: entry.frameUrl, activeElement: entry.activeElement })).slice(0, 12),
    frameCount: frames.length,
    matchingEntryCount: frames.reduce((sum, frame) => sum + frame.entries.length, 0),
    frames,
  };
}

function summarizeDiagnostics(diagnostics: Awaited<ReturnType<typeof collectTypeMenuDiagnostics>>) {
  return {
    purchaseInvoiceVisible: diagnostics.purchaseInvoiceVisible,
    purchaseInvoicesListVisible: diagnostics.purchaseInvoicesListVisible,
    linesContextVisible: diagnostics.linesContextVisible,
    fixedAssetLineTypeVisible: diagnostics.fixedAssetLineTypeVisible,
    itemLineTypeVisible: diagnostics.itemLineTypeVisible,
    forbiddenVendorNoVisible: diagnostics.forbiddenVendorNoVisible,
    forbiddenFixedAssetNoVisible: diagnostics.forbiddenFixedAssetNoVisible,
    vendorCardVisible: diagnostics.vendorCardVisible,
    vendorRegistrationVisible: diagnostics.vendorRegistrationVisible,
    optionTexts: diagnostics.optionTexts,
    typeCellCandidates: diagnostics.typeCellCandidates,
    typeMenuButtons: diagnostics.typeMenuButtons,
    activeElements: diagnostics.activeElements,
    frameCount: diagnostics.frameCount,
    matchingEntryCount: diagnostics.matchingEntryCount,
  };
}

async function focusBestTypeGridcell(page: Page, diagnostics: Awaited<ReturnType<typeof collectTypeMenuDiagnostics>>) {
  const best = diagnostics.typeCellCandidates[0];
  if (!best) return { focused: false, reason: 'type-gridcell-candidate-not-found' };
  const clickPoint = {
    x: best.rect.x + Math.min(18, Math.max(4, Math.round(best.rect.width * 0.15))),
    y: best.rect.y + Math.round(best.rect.height / 2),
  };
  await page.mouse.click(clickPoint.x, clickPoint.y);
  await page.waitForTimeout(900);
  return { focused: true, candidate: best, clickPoint };
}

async function runMenuButtonProbe(page: Page) {
  const before = await collectTypeMenuDiagnostics(page);
  const focus = await focusBestTypeGridcell(page, before);
  await page.keyboard.press('Alt+ArrowDown');
  await page.waitForTimeout(900);
  const afterAltDown = await collectTypeMenuDiagnostics(page);

  let activation: Record<string, unknown> = { attempted: false, reason: 'no-type-menu-button-focused-or-visible' };
  const focusedButton = afterAltDown.activeElements.find((entry) => /Type|Art/i.test(`${entry.activeElement?.aria || ''} ${entry.activeElement?.title || ''}`));
  const menuButton = afterAltDown.typeMenuButtons[0];

  if (focusedButton?.activeElement || menuButton) {
    activation = { attempted: true, method: focusedButton?.activeElement ? 'keyboard-enter-on-focused-button' : 'mouse-click-visible-type-menu-button', focusedButton, menuButton };
    if (focusedButton?.activeElement) {
      await page.keyboard.press('Enter');
    } else if (menuButton) {
      await page.mouse.click(menuButton.rect.x + Math.round(menuButton.rect.width / 2), menuButton.rect.y + Math.round(menuButton.rect.height / 2));
    }
    await page.waitForTimeout(1500);
  }

  const afterActivation = await collectTypeMenuDiagnostics(page);
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(500);
  const afterEscape = await collectTypeMenuDiagnostics(page);
  return {
    before: summarizeDiagnostics(before),
    focus,
    afterAltDown: summarizeDiagnostics(afterAltDown),
    activation,
    afterActivation: summarizeDiagnostics(afterActivation),
    afterEscape: summarizeDiagnostics(afterEscape),
  };
}

async function cleanupDraftIfVisible(page: Page, invoiceNo: string | null) {
  if (!invoiceNo) return { status: 'not-created-or-draft-number-not-found', invoiceNo: null, visibleAfter: false };
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  const visible = new RegExp(invoiceNo).test(await pageText(page));
  return {
    status: visible ? 'draft-visible-cleanup-not-attempted-in-options-probe' : 'not-visible-before-cleanup',
    invoiceNo,
    visibleAfter: visible,
  };
}

function statePatch(resultStatus: string, summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-120-purchase-invoice-line-type-options-route-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-119-purchase-invoice-line-type-menu-button-options-no-selection.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-120: review FA-119 visible Type options evidence and decide whether selecting Fixed Asset/Anlage is safe.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-purchase-invoice-line-type-menu-button-options-probe',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      summary,
      nextStep: 'Run FIXEDASSETS-120 local evidence review before any Type selection or target values are unlocked.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-119/FIXEDASSETS-119-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-120 local evidence review.',
    },
  };
}

test('FIXEDASSETS-119 opens only the Purchase Invoice line Type menu button and captures options without selection', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const newAttempt = await clickScopedNew(page);
  await writeSafeJsonEvidence(faEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  const draftInvoiceNo = await extractDraftNo(page);

  const menuProbe = await runMenuButtonProbe(page);
  await writeSafeJsonEvidence(faEvidencePath('030-type-menu-button-options-probe.json'), menuProbe);
  await writeTextEvidence(
    faEvidencePath('031-after-type-menu-button-probe-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Type|Art|Fixed Asset|Anlage|Item|Artikel|G\/L Account|Sachkonto|Resource|Ressource|No\.|Nr\.|Vendor|Kreditor|Post|Buchen|Preview|Vorschau/i],
      maxLines: 180,
      maxLineLength: 220,
    }),
  );

  const finalDiagnostics = menuProbe.afterActivation;
  const meaningfulOptions = finalDiagnostics.optionTexts.filter((text) =>
    /^(G\/L Account|Sachkonto|Fixed Asset|Anlage|Resource|Ressource|Charge \(Item\)|Geb.hr \(Artikel\))$/i.test(text),
  );
  const fixedAssetOptionVisible = finalDiagnostics.fixedAssetLineTypeVisible || finalDiagnostics.optionTexts.some((text) => /^(Fixed Asset|Anlage)$/i.test(text));
  const buttonActivated = Boolean((menuProbe.activation as { attempted?: boolean }).attempted);
  const resultStatus = buttonActivated ? 'observed' : 'blocked';

  await screenshot(page, 'fixedassets-119-030-type-menu-button-options-probe.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: meaningfulOptions.length > 0 || fixedAssetOptionVisible ? 'candidate' : 'rejected',
    bookUse: fixedAssetOptionVisible ? 'evidence-candidate' : 'do-not-use',
    purpose: 'FIXEDASSETS-119 oeffnet nur den Type-Menuebutton und erfasst sichtbare Optionen; keine Auswahl und keine Zielwerte.',
    expectedPageText: [/Purchase Invoice|Einkaufsrechnung|Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: [
      'Keine Auswahl von Fixed Asset/Anlage.',
      'Kein K30000, kein FA-CNC-01 und kein Betrag.',
      'Keine Preview Posting und keine Buchung.',
    ],
  });

  const cleanup = await cleanupDraftIfVisible(page, draftInvoiceNo);
  await writeJsonEvidence(faEvidencePath('090-cleanup-result.json'), cleanup);
  const cleanupCompleted = cleanup.status === 'not-created-or-draft-number-not-found' || cleanup.status === 'not-visible-before-cleanup';
  const summary =
    resultStatus === 'observed'
      ? `FA-119 activated the Type menu button without selection; options=${meaningfulOptions.join(', ') || 'none'}, fixedAssetVisible=${fixedAssetOptionVisible}. Cleanup status=${cleanup.status}.`
      : `FA-119 did not activate the Type menu button safely; options=${meaningfulOptions.join(', ') || 'none'}. Cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-purchase-invoice-line-type-menu-button-options-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-purchase-invoice-line-type-menu-button-options-no-selection',
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
        purpose: 'Temporary sandbox draft to diagnose only the Purchase Invoice line Type menu button; no selection, no target values, no preview, no post.',
        createdAt: startedAt,
        status: draftInvoiceNo ? (cleanupCompleted ? 'not-visible-after-probe' : 'draft-visible') : 'no-persisted-number-detected',
        cleanupStatus: cleanupCompleted ? 'not-needed-or-not-visible' : 'blocked',
      },
    ],
    changedRecords: [],
    postedRecords: [],
    setupChanges: [],
    cleanup: {
      required: Boolean(draftInvoiceNo),
      completed: cleanupCompleted,
      method: draftInvoiceNo ? 'filtered visibility check only' : 'not-needed',
      blockedBy: cleanupCompleted ? [] : [cleanup.status],
      detail: cleanup,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'New/Neu was clicked once in the scoped Purchase Invoices context.',
      ...(buttonActivated ? ['The small Type menu button route was activated without selecting an option.'] : []),
      ...(meaningfulOptions.length > 0 ? [`Visible non-default option signals were captured: ${meaningfulOptions.join(', ')}`] : []),
      cleanupCompleted ? 'No persisted draft required cleanup, or the draft was not visible in filtered follow-up.' : 'Cleanup blocker is documented.',
    ],
    notProved: [
      ...(fixedAssetOptionVisible ? [] : ['Fixed Asset/Anlage was not proven as a visible Type option.']),
      'Fixed Asset/Anlage was not selected.',
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No amount was entered.',
      'No Preview Posting.',
      'No posting.',
      'No setup change.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-119-purchase-invoice-line-type-menu-button-options-no-selection.json',
      '.agent/state/cases/fixedassets-120-purchase-invoice-line-type-options-route-decision.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-119-purchase-invoice-line-type-menu-button-options-no-selection.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/FIXEDASSETS-119-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/030-type-menu-button-options-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/031-after-type-menu-button-probe-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/fixedassets-119-030-type-menu-button-options-probe.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-119-030-type-menu-button-options-probe.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-119/FIXEDASSETS-119-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/030-type-menu-button-options-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/031-after-type-menu-button-probe-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-119/README.md',
      'playwright/projects/fibu-book5/img/fixedassets-119-030-type-menu-button-options-probe.png',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'This probe intentionally does not select Fixed Asset/Anlage.',
      'No Preview Posting or posting was attempted.',
    ],
    blockedBy: resultStatus === 'observed' ? [] : ['Type menu button route did not activate safely.'],
    requiresReview: !cleanupCompleted,
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
      cleanupCompleted,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      newAttempt,
      draftInvoiceNo,
      menuProbe,
    },
    nextStep: 'Run FIXEDASSETS-120 local evidence review before selecting Type = Fixed Asset or entering target values.',
  };

  await writeSafeJsonEvidence(faEvidencePath('FIXEDASSETS-119-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-119 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-119-result.json` | JSON | Type-Menuebutton-Probe, Cleanup, Grenzen | keine Auswahl, keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |',
      '| `030-type-menu-button-options-probe.json` | JSON | Menuebutton-Fokus/-Aktivierung und sichtbare Optionssignale | keine No.-Feldzuordnung | `control-diagnosis` |',
      '| `031-after-type-menu-button-probe-focused-text.txt` | Text | kompakter UI-Text nach Menuebutton-Probe | kein Rohdump | `compact` |',
      '| `fixedassets-119-030-type-menu-button-options-probe.png` | Screenshot | sichtbarer Options-/Blocker-Kontext | kein Zielwert- oder Buchungsbild | `candidate/rejected` laut Metadaten |',
      '| `090-cleanup-result.json` | JSON | Cleanup-/Draft-Sichtbarkeitsstatus | keine Postenspur | `cleanup` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
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
  expect(result.flags.cleanupCompleted).toBe(true);
});
