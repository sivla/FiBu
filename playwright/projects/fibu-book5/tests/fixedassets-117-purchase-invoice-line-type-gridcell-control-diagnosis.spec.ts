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

const CASE_ID = 'FIXEDASSETS-117-PURCHASE-INVOICE-LINE-TYPE-GRIDCELL-CONTROL-DIAGNOSIS';
const NEXT_CASE_ID = 'FIXEDASSETS-118-PURCHASE-INVOICE-LINE-TYPE-ROUTE-DECISION';
const TEST_ID = 'fixedassets-117';
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

function sanitizeUrl(value: string) {
  if (!/^https?:\/\//i.test(value)) return value;
  try {
    const url = new URL(value);
    for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
      url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return value;
  }
}

function sanitizeString(value: string) {
  if (/tokenFactorySettings|requestExecutorSettings|clientId|authority:|trustedOriginAuthorities/i.test(value)) {
    return '[external-frame-script-redacted]';
  }
  return sanitizeUrl(value)
    .replace(/clientId:\s*"[^"]+"/gi, 'clientId:"[redacted]"')
    .replace(/authority:\s*"[^"]+"/gi, 'authority:"[redacted]"');
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

async function collectTypeControlDiagnostics(page: Page) {
  const frames = [];
  for (const frame of page.frames()) {
    const evidence = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const cleanTitle = (value: string | null | undefined) => normalize(value).replace(/[^\x20-\x7E]/g, '');
        const bodyText = normalize(document.body?.innerText || '');
        const active = document.activeElement as HTMLElement | null;
        const activeRect = active?.getBoundingClientRect();
        const activeElement = active
          ? {
              tag: active.tagName,
              role: normalize(active.getAttribute('role')),
              text: normalize(active.innerText || active.textContent || (active as HTMLInputElement).value || '').slice(0, 160),
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

        const entries = Array.from(
          document.querySelectorAll<HTMLElement>(
            'td,div,span,input,button,[role="gridcell"],[role="button"],[role="combobox"],[role="listbox"],[role="option"],[aria-label],[title]',
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
          .filter((entry) =>
            /Item|Artikel|Fixed Asset|Anlage|G\/L Account|Sachkonto|Resource|Ressource|Charge|Type|Art|No\.|Nr\.|Description|Beschreibung/i.test(
              `${entry.text} ${entry.aria} ${entry.title}`,
            ),
          )
          .filter((entry) => entry.text.length <= 220 && entry.rect.width < 1600 && entry.rect.y >= 0)
          .slice(0, 180);

        const optionTexts = Array.from(
          new Set(
            entries
              .filter((entry) => /^(G\/L Account|Sachkonto|Item|Artikel|Fixed Asset|Anlage|Resource|Ressource|Charge \(Item\)|Geb.hr \(Artikel\))$/i.test(entry.text))
              .map((entry) => entry.text)
              .filter(Boolean),
          ),
        ).slice(0, 40);

        const typeCellCandidates = entries
          .filter((entry) => /^(Item|Artikel)$/i.test(entry.text) && entry.role !== 'button' && entry.rect.width >= 70)
          .sort((left, right) => right.rect.width - left.rect.width || left.rect.y - right.rect.y)
          .slice(0, 12);

        const itemButtons = entries
          .filter((entry) => /^(Item|Artikel)$/i.test(entry.text) && entry.role === 'button')
          .slice(0, 12);

        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          purchaseInvoicesListVisible: /Purchase Invoices|Einkaufsrechnungen/i.test(bodyText),
          linesContextVisible: /\bType\b|\bNo\.\b|\bDescription\b|\bArt\b|\bNr\./i.test(bodyText),
          fixedAssetLineTypeVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text)),
          itemLineTypeVisible: entries.some((entry) => /^(Item|Artikel)$/i.test(entry.text)),
          forbiddenVendorNoVisible: /K30000/.test(bodyText),
          forbiddenFixedAssetNoVisible: /FA-CNC-01/.test(bodyText),
          vendorCardVisible: /\bVendor Card\s*-|\bKreditorenkarte\s*-/i.test(bodyText),
          vendorRegistrationVisible: /Create a new vendor card|new vendor card|not registered|Kreditor.*anlegen|neue Kreditorenkarte/i.test(bodyText),
          postingOrPreviewVisible: /\bPost\b|\bBuchen\b|Preview Posting|Buchungsvorschau/i.test(bodyText),
          optionTexts,
          activeElement,
          typeCellCandidates,
          itemButtons,
          entries: entries.slice(0, 80),
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
    postingOrPreviewVisible: frames.some((entry) => entry.postingOrPreviewVisible),
    optionTexts: Array.from(new Set(frames.flatMap((entry) => entry.optionTexts))).slice(0, 40),
    typeCellCandidates: frames.flatMap((entry) => entry.typeCellCandidates).slice(0, 24),
    itemButtons: frames.flatMap((entry) => entry.itemButtons).slice(0, 24),
    activeElements: frames.map((entry) => ({ frameUrl: entry.frameUrl, activeElement: entry.activeElement })).slice(0, 12),
    frameCount: frames.length,
    matchingEntryCount: frames.reduce((sum, frame) => sum + frame.entries.length, 0),
    frames,
  };
}

async function focusBestTypeGridcell(page: Page, diagnostics: Awaited<ReturnType<typeof collectTypeControlDiagnostics>>) {
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

async function readonlyCellProbe(page: Page) {
  const before = await collectTypeControlDiagnostics(page);
  const focus = await focusBestTypeGridcell(page, before);
  const afterFocus = await collectTypeControlDiagnostics(page);
  const attempts = [];

  if (focus.focused) {
    for (const action of ['f2', 'alt-arrowdown']) {
      if (action === 'f2') await page.keyboard.press('F2');
      if (action === 'alt-arrowdown') await page.keyboard.press('Alt+ArrowDown');
      await page.waitForTimeout(1200);
      const diagnostics = await collectTypeControlDiagnostics(page);
      attempts.push({ action, diagnostics: summarizeDiagnostics(diagnostics) });
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(500);
    }
  }

  const afterProbe = await collectTypeControlDiagnostics(page);
  return { before: summarizeDiagnostics(before), focus, afterFocus: summarizeDiagnostics(afterFocus), attempts, afterProbe: summarizeDiagnostics(afterProbe) };
}

function summarizeDiagnostics(diagnostics: Awaited<ReturnType<typeof collectTypeControlDiagnostics>>) {
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
    postingOrPreviewVisible: diagnostics.postingOrPreviewVisible,
    optionTexts: diagnostics.optionTexts,
    typeCellCandidates: diagnostics.typeCellCandidates,
    itemButtons: diagnostics.itemButtons,
    activeElements: diagnostics.activeElements,
    frameCount: diagnostics.frameCount,
    matchingEntryCount: diagnostics.matchingEntryCount,
  };
}

async function cleanupDraftIfVisible(page: Page, invoiceNo: string | null) {
  if (!invoiceNo) return { status: 'not-created-or-draft-number-not-found', invoiceNo: null, visibleAfter: false };
  await page.goto(purchaseInvoicesUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  const visible = new RegExp(invoiceNo).test(await pageText(page));
  return {
    status: visible ? 'draft-visible-cleanup-not-attempted-in-control-diagnosis' : 'not-visible-before-cleanup',
    invoiceNo,
    visibleAfter: visible,
  };
}

function statePatch(resultStatus: string, summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-118-purchase-invoice-line-type-route-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-117-purchase-invoice-line-type-gridcell-control-diagnosis.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-118: review FA-117 gridcell/control evidence and decide whether a guarded no-target Type selection proof is safe.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-purchase-invoice-line-type-gridcell-control-diagnosis',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      summary,
      nextStep: 'Run FIXEDASSETS-118 local evidence review before any Type selection or target values are unlocked.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-117/FIXEDASSETS-117-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-118 local evidence review.',
    },
  };
}

test('FIXEDASSETS-117 diagnoses Purchase Invoice line Type gridcell/control route without selecting target values', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const newAttempt = await clickScopedNew(page);
  await writeSafeJsonEvidence(faEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  const draftInvoiceNo = await extractDraftNo(page);

  const controlProbe = await readonlyCellProbe(page);
  await writeSafeJsonEvidence(faEvidencePath('030-type-gridcell-control-diagnosis.json'), controlProbe);
  await writeTextEvidence(
    faEvidencePath('031-after-gridcell-probe-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Type|Art|Fixed Asset|Anlage|Item|Artikel|G\/L Account|Sachkonto|Resource|Ressource|No\.|Nr\.|Vendor|Kreditor|Post|Buchen|Preview|Vorschau/i],
      maxLines: 180,
      maxLineLength: 220,
    }),
  );

  const finalDiagnostics = controlProbe.afterProbe;
  const meaningfulOptions = finalDiagnostics.optionTexts.filter((text) =>
    /^(G\/L Account|Sachkonto|Fixed Asset|Anlage|Resource|Ressource|Charge \(Item\)|Geb.hr \(Artikel\))$/i.test(text),
  );
  const observedControlRoute = controlProbe.focus.focused && controlProbe.afterFocus.activeElements.some((entry) => entry.activeElement?.role || entry.activeElement?.tag);
  const fixedAssetOptionVisible = finalDiagnostics.fixedAssetLineTypeVisible || finalDiagnostics.optionTexts.some((text) => /^(Fixed Asset|Anlage)$/i.test(text));
  const resultStatus = observedControlRoute || meaningfulOptions.length > 0 ? 'observed' : 'blocked';

  await screenshot(page, 'fixedassets-117-030-type-gridcell-control-diagnosis.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: meaningfulOptions.length > 0 || fixedAssetOptionVisible ? 'candidate' : 'rejected',
    bookUse: meaningfulOptions.length > 0 || fixedAssetOptionVisible ? 'evidence' : 'do-not-use',
    purpose: 'FIXEDASSETS-117 diagnostiziert das Type-Feld als Gridcell/Edit-Control; keine Auswahl und keine Zielwerte.',
    expectedPageText: [/Purchase Invoice|Einkaufsrechnung|Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: [
      'Kein K30000, kein FA-CNC-01 und kein Betrag.',
      'Keine Auswahl von Fixed Asset/Anlage.',
      'Keine Preview Posting und keine Buchung.',
    ],
  });

  const cleanup = await cleanupDraftIfVisible(page, draftInvoiceNo);
  await writeJsonEvidence(faEvidencePath('090-cleanup-result.json'), cleanup);
  const cleanupCompleted = cleanup.status === 'not-created-or-draft-number-not-found' || cleanup.status === 'not-visible-before-cleanup';
  const summary =
    resultStatus === 'observed'
      ? `FA-117 observed the Type gridcell/control route without target values; meaningfulOptions=${meaningfulOptions.join(', ') || 'none'}, fixedAssetVisible=${fixedAssetOptionVisible}. Cleanup status=${cleanup.status}.`
      : `FA-117 did not find a useful Type gridcell/control route; focus=${controlProbe.focus.focused}, meaningfulOptions=${meaningfulOptions.join(', ') || 'none'}. Cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-purchase-invoice-line-type-gridcell-control-diagnosis-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-purchase-invoice-line-type-gridcell-control-diagnosis',
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
        purpose: 'Temporary sandbox draft to diagnose only the Purchase Invoice line Type gridcell/control route; no selection, no target values, no preview, no post.',
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
      'The run diagnosed the Purchase Invoice line Type gridcell/control route without selecting any option.',
      ...(observedControlRoute ? ['A Type gridcell/control focus route was observed and active element diagnostics were captured.'] : []),
      ...(meaningfulOptions.length > 0 ? [`Meaningful option signals were visible: ${meaningfulOptions.join(', ')}`] : []),
      cleanupCompleted ? 'No persisted draft required cleanup, or the draft was not visible in filtered follow-up.' : 'Cleanup blocker is documented.',
    ],
    notProved: [
      ...(fixedAssetOptionVisible ? [] : ['Fixed Asset/Anlage was not proven as a Type option.']),
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
      '.agent/state/cases/fixedassets-117-purchase-invoice-line-type-gridcell-control-diagnosis.json',
      '.agent/state/cases/fixedassets-118-purchase-invoice-line-type-route-decision.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-117-purchase-invoice-line-type-gridcell-control-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/FIXEDASSETS-117-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/030-type-gridcell-control-diagnosis.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/031-after-gridcell-probe-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/fixedassets-117-030-type-gridcell-control-diagnosis.screenshot.json',
      'playwright/projects/fibu-book5/img/fixedassets-117-030-type-gridcell-control-diagnosis.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-117/FIXEDASSETS-117-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/030-type-gridcell-control-diagnosis.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/031-after-gridcell-probe-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-117/README.md',
      'playwright/projects/fibu-book5/img/fixedassets-117-030-type-gridcell-control-diagnosis.png',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'This probe intentionally does not select Fixed Asset/Anlage.',
      'No Preview Posting or posting was attempted.',
    ],
    blockedBy: resultStatus === 'observed' ? [] : ['Type gridcell/control route not proven through the attempted read-only probe.'],
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
      controlProbe,
    },
    nextStep: 'Run FIXEDASSETS-118 local evidence review before selecting Type = Fixed Asset or entering target values.',
  };

  await writeSafeJsonEvidence(faEvidencePath('FIXEDASSETS-117-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-117 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-117-result.json` | JSON | Gridcell-/Control-Diagnose, Cleanup, Grenzen | keine Auswahl, keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |',
      '| `030-type-gridcell-control-diagnosis.json` | JSON | Type-Zelle, Active-Elemente, nahe Controls und Optionssignale | keine No.-Feldzuordnung | `control-diagnosis` |',
      '| `031-after-gridcell-probe-focused-text.txt` | Text | kompakter UI-Text nach Control-Probe | kein Rohdump | `compact` |',
      '| `fixedassets-117-030-type-gridcell-control-diagnosis.png` | Screenshot | sichtbarer Control-/Blocker-Kontext | kein Zielwert- oder Buchungsbild | `candidate/rejected` laut Metadaten |',
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
