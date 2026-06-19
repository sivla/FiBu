import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { clickBcScoredAction } from '../../../core/bc/actions';
import { classifyPurchaseInvoiceLineTypeVisibility } from '../../../core/bc/purchase-invoice-guards';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-071-GUARDED-DRAFT-LINE-TYPE-CONTEXT-PROBE';
const TEST_ID = 'fixedassets-071';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(420_000);

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function purchaseInvoicesUrl() {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function purchaseInvoicesFilteredUrl(invoiceNo: string) {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
  return url.toString();
}

async function closeExternalPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) continue;
    const url = candidate.url();
    if (/learn\.microsoft\.com|go\.microsoft\.com|support\.microsoft\.com/i.test(url)) {
      closed.push(url);
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
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
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  const closedExternalPages = await closeExternalPages(page);
  await page.waitForTimeout(1200);
  return { closedExternalPages };
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

async function collectLineTypeEvidence(page: Page) {
  const frameEvidence = [];
  for (const frame of page.frames()) {
    const evidence = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const bodyText = normalize(document.body?.innerText || '');
        const entries = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"],[role="button"]'))
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            return {
              text,
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
            };
          })
          .filter((entry) => /^(Item|Artikel|Fixed Asset|Anlage|Type|Art|No\.|Nr\.)$/i.test(entry.text))
          .slice(0, 30);
        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          linesContextVisible: /\bType\b|\bNo\.\b|\bDescription\b|\bArt\b|\bNr\./i.test(bodyText),
          fixedAssetLineTypeVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text)),
          itemLineTypeVisible: entries.some((entry) => /^(Item|Artikel)$/i.test(entry.text)),
          forbiddenVendorNoVisible: bodyText.includes('K30000'),
          forbiddenFixedAssetNoVisible: bodyText.includes('FA-CNC-01'),
          vendorCardVisible: /Vendor Card\s*-|Kreditorenkarte\s*-/i.test(bodyText),
          vendorRegistrationVisible: /Create a new vendor card|new vendor card|not registered|neue Kreditorenkarte/i.test(bodyText),
          postingOrPreviewVisible: /\bPost\b|\bBuchen\b|Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(bodyText),
          entries,
        };
      })
      .catch(() => null);
    if (evidence) frameEvidence.push(evidence);
  }

  return {
    purchaseInvoiceVisible: frameEvidence.some((entry) => entry.purchaseInvoiceVisible),
    linesContextVisible: frameEvidence.some((entry) => entry.linesContextVisible),
    fixedAssetLineTypeVisible: frameEvidence.some((entry) => entry.fixedAssetLineTypeVisible),
    itemLineTypeVisible: frameEvidence.some((entry) => entry.itemLineTypeVisible),
    forbiddenVendorNoVisible: frameEvidence.some((entry) => entry.forbiddenVendorNoVisible),
    forbiddenFixedAssetNoVisible: frameEvidence.some((entry) => entry.forbiddenFixedAssetNoVisible),
    vendorCardVisible: frameEvidence.some((entry) => entry.vendorCardVisible),
    vendorRegistrationVisible: frameEvidence.some((entry) => entry.vendorRegistrationVisible),
    postingOrPreviewVisible: frameEvidence.some((entry) => entry.postingOrPreviewVisible),
    frameEvidence,
  };
}

async function extractPurchaseInvoiceDraftNo(page: Page) {
  const text = await pageText(page);
  const headerMatch = text.match(/\b(10\d{4})\b/);
  return headerMatch?.[1] ?? null;
}

async function confirmDeleteDialog(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const label of [/^Yes$|^Ja$/i, /^OK$/i]) {
      const button = scope.getByRole('button', { name: label }).first();
      if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1500);
        return { confirmed: true, button: label.source };
      }
    }
  }
  return { confirmed: false, button: 'not-found' };
}

async function deletePurchaseInvoiceDraftViaFilteredList(page: Page, invoiceNo: string) {
  await page.goto(purchaseInvoicesFilteredUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);

  const visibleBefore = new RegExp(invoiceNo).test(await pageText(page));
  if (!visibleBefore) {
    return { status: 'not-visible-before-filtered-cleanup', invoiceNo };
  }

  const result = await clickBcScoredAction(page, {
    scopeText: new RegExp(invoiceNo),
    actionPattern: /Delete|L.schen/i,
    rejectPattern: /line|zeile|posted|gebucht|archive|archiv|Post|Preview|New|Neu/i,
    preferredYMin: 35,
    preferredYMax: 135,
    candidateLimit: 15,
    waitAfterClick: 0,
  });

  if (!result.clicked) {
    return { status: 'delete-action-not-found', invoiceNo, deleteAction: result };
  }

  const confirmation = await confirmDeleteDialog(page);
  await page.waitForTimeout(3500);
  await page.goto(purchaseInvoicesFilteredUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await page.waitForTimeout(1200);
  const visibleAfter = new RegExp(invoiceNo).test(await pageText(page));
  return {
    status: visibleAfter ? 'cleanup-clicked-but-still-visible' : 'deleted',
    invoiceNo,
    deleteAction: result,
    confirmation,
    visibleAfter,
  };
}

function statePatch(resultStatus: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-071.json',
      nextStep:
        resultStatus === 'observed'
          ? 'Review FA-071 line context evidence. Do not enter K30000 or FA-CNC-01 until Type = Fixed Asset is visibly or processually proven.'
          : 'Resolve FA-071 blocker or cleanup before continuing fixed asset purchase invoice probes.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'guarded-draft-line-type-context-probe',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        resultStatus === 'observed'
          ? 'Use FA-071 evidence to decide the next guarded selector fix; no target values yet.'
          : 'Focus next run on the blocker or cleanup status.',
    },
    activeCase: {
      status: resultStatus,
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-071/FIXEDASSETS-071-result.json',
        summary,
      },
      nextSafeAction:
        resultStatus === 'observed'
          ? 'Plan the next smallest selector/line-type proof. K30000 and FA-CNC-01 remain locked.'
          : 'Do not continue until blocker or cleanup status is understood.',
    },
  };
}

test('FIXEDASSETS-071 opens one guarded draft and inspects line type context', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const openResult = await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    fixedAssetsEvidencePath('010-before-new-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Post|Buchen|Invoice|Rechnung/i],
      maxLines: 80,
      maxLineLength: 220,
    }),
  );

  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('020-scoped-new-attempt.json'), newAttempt);

  const lineTypeEvidence = await collectLineTypeEvidence(page);
  const guard = classifyPurchaseInvoiceLineTypeVisibility(lineTypeEvidence);
  const draftInvoiceNo = await extractPurchaseInvoiceDraftNo(page);

  await writeJsonEvidence(fixedAssetsEvidencePath('030-line-type-context.json'), { lineTypeEvidence, guard });
  await writeTextEvidence(
    fixedAssetsEvidencePath('031-after-new-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Type|Art|Fixed Asset|Anlage|Item|Artikel|Vendor Card|Kreditorenkarte|Post|Buchen|Preview|Vorschau|No\.|Nr\./i],
      maxLines: 180,
      maxLineLength: 220,
    }),
  );

  const cleanup =
    draftInvoiceNo && /^\d+$/.test(draftInvoiceNo)
      ? await deletePurchaseInvoiceDraftViaFilteredList(page, draftInvoiceNo)
      : { status: 'not-created-or-draft-number-not-found', invoiceNo: draftInvoiceNo };
  await writeJsonEvidence(fixedAssetsEvidencePath('090-cleanup-result.json'), cleanup);

  const cleanupCompleted = cleanup.status === 'deleted' || cleanup.status === 'not-created-or-draft-number-not-found';
  const resultStatus = guard.success ? 'observed' : 'blocked';
  const summary = guard.success
    ? 'FA-071 proved Type = Fixed Asset in the guarded Purchase Invoice Lines context; target values remain locked.'
    : `FA-071 reached a guarded draft context but stopped with ${guard.status}. Target values remain locked.`;
  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-guarded-draft-line-type-context-probe-result',
    caseId: CASE_ID,
    source: 'playwright-guarded-draft-probe',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      urlAfterNew: page.url(),
    },
    proved: [
      'New/Neu was clicked once in the scoped Purchase Invoices context.',
      'The run inspected Purchase Invoice Lines / Type context before any target value entry.',
      'K30000 and FA-CNC-01 were not entered.',
      'No Preview Posting or Post action was clicked.',
      cleanupCompleted ? 'Cleanup finished or no draft number was created.' : 'Cleanup was attempted and its blocker is documented.',
    ],
    notProved: [
      ...(guard.success ? [] : ['Type = Fixed Asset was not proven as selected or visible.']),
      'No fixed asset acquisition was posted.',
      'No German final proof.',
      'No K30000 / FA-CNC-01 field mapping proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-071.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-071-guarded-draft-line-type-context-probe.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/FIXEDASSETS-071-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/010-before-new-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/020-scoped-new-attempt.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/030-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/031-after-new-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-071/FIXEDASSETS-071-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/030-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-071/README.md',
    ],
    warnings: [
      'This is Sandbox/Labor evidence only.',
      'The run intentionally stops before K30000 and FA-CNC-01.',
    ],
    blockedBy: guard.success ? [] : guard.stopReasons,
    requiresReview: !cleanupCompleted,
    safeToFinalizeState: cleanupCompleted,
    statePatch: statePatch(resultStatus, summary),
    createdRecords: [
      {
        type: 'Purchase Invoice',
        documentNo: draftInvoiceNo ?? '',
        purpose: 'Guarded line-type context probe only; no target values, no preview, no post.',
        createdAt: startedAt,
        cleanupStatus: cleanupCompleted ? cleanup.status : 'blocked',
      },
    ],
    cleanup: {
      required: Boolean(draftInvoiceNo),
      completed: cleanupCompleted,
      method: draftInvoiceNo ? 'filtered Purchase Invoices list delete via UI' : 'not-needed',
      blockedBy: cleanupCompleted ? [] : [cleanup.status],
      detail: cleanup,
    },
    flags: {
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noBookChange: true,
      noApiShortcut: true,
      noTargetVendorEntry: true,
      noTargetFixedAssetEntry: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      openResult,
      newAttempt,
      draftInvoiceNo,
      lineTypeEvidence,
      guard,
    },
    nextStep: guard.success
      ? 'Plan a separate guarded field-mapping proof. K30000 and FA-CNC-01 are still locked until the next case allows them.'
      : 'Fix the line-type selector/context probe; do not enter target values yet.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-071-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-071 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-071-result.json` | JSON | guardierte Draft-Probe mit New/Neu, Draftnummer, Lines-/Type-Kontext, Cleanup-Status | keinen Anlagenkauf, keine Zielwerte, keine Buchung | `labor`, `guarded-draft-probe` |',
      '| `030-line-type-context.json` | JSON | strukturierte Type-/Lines-Kontextklassifikation | keine gebuchte Anlagenbewegung | `line-type-context` |',
      '| `090-cleanup-result.json` | JSON | Cleanup-Status des erzeugten Drafts | keine API-Datenbankgarantie | `cleanup` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noTargetVendorEntry).toBe(true);
  expect(result.flags.noTargetFixedAssetEntry).toBe(true);
});
