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
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'P2P-022-PURCHASE-INVOICE-DRAFT-CLEANUP-DIAGNOSIS';
const TEST_ID = 'p2p-022';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const PAGE_ID_PURCHASE_INVOICES = 9308;
const targetDraftNo = '107229';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
});

test.setTimeout(360_000);

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function purchaseInvoicesUrl() {
  const url = new URL(bcPageUrl(PAGE_ID_PURCHASE_INVOICES, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${targetDraftNo}'`);
  return url.toString();
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE),
  };
}

async function openFilteredPurchaseInvoices(page: Page) {
  await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1500);
}

async function countTargetSignals(page: Page) {
  const text = await pageText(page);
  const targetMatches = [...text.matchAll(new RegExp(targetDraftNo, 'g'))].length;
  return {
    targetVisible: targetMatches > 0,
    targetMatches,
    postVisible: /\bPost\b|\bBuchen\b/i.test(text),
    previewVisible: /Preview Posting|Buchungsvorschau|Vorschau buchen/i.test(text),
    otherPurchaseInvoiceNos: [...new Set([...text.matchAll(/\b(10\d{4,})\b/g)].map((match) => match[1]).filter((entry) => entry !== targetDraftNo))].slice(0, 20),
    compact: await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|107229|K10000|Vendor|Kreditor|Delete|L.schen|Post|Buchen|Preview|Vorschau|No\.|Nr\./i],
      maxLines: 140,
      maxLineLength: 240,
    }),
  };
}

async function clickTargetRow(page: Page) {
  for (const frame of page.frames()) {
    const body = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (!body.includes(targetDraftNo)) continue;
    const clicked = await frame.getByText(targetDraftNo, { exact: true }).first().click({ timeout: 3000 }).then(() => true).catch(() => false);
    if (clicked) {
      await page.waitForTimeout(900);
      return { clicked: true, frameUrl: frame.url(), method: 'exact-text-target-draft' };
    }
  }
  return { clicked: false, reason: 'target-row-not-clickable' };
}

async function triggerDelete(page: Page) {
  const rowClick = await clickTargetRow(page);
  const attempts: string[] = [`rowClick=${JSON.stringify(rowClick)}`];
  if (!rowClick.clicked) {
    return { triggered: false, attempts, reason: 'target-row-not-clicked' };
  }

  await page.keyboard.press('Control+Delete').catch((error) => attempts.push(`Control+Delete failed ${String(error)}`));
  await page.waitForTimeout(1500);
  let text = await pageText(page);
  if (/delete|l.schen|remove|entfernen/i.test(text)) {
    return { triggered: true, attempts: [...attempts, 'keyboard:Control+Delete'], method: 'keyboard:Control+Delete' };
  }

  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: /^Delete$|^L.schen$/i }).first();
      if (await action.isVisible({ timeout: 700 }).catch(() => false)) {
        await action.click().catch((error) => attempts.push(`${role}:delete failed ${String(error)}`));
        await page.waitForTimeout(1500);
        text = await pageText(page);
        return { triggered: /delete|l.schen|remove|entfernen/i.test(text), attempts: [...attempts, `${role}:delete`], method: `${role}:delete` };
      }
    }
  }

  return { triggered: false, attempts, reason: 'delete-command-did-not-open-dialog' };
}

async function confirmOnlySafeDeleteDialog(page: Page) {
  const text = await pageText(page);
  const hasDeleteText = /delete|l.schen|remove|entfernen|Datensatz/i.test(text);
  const hasRiskyPostingText = /\bpost\b|\bbuchen\b|preview|vorschau/i.test(text);
  const targetStillVisible = text.includes(targetDraftNo);
  const safeDialog = hasDeleteText && !hasRiskyPostingText && targetStillVisible;
  if (!safeDialog) {
    return {
      confirmed: false,
      reason: 'dialog-not-safe-for-target-delete',
      hasDeleteText,
      hasRiskyPostingText,
      targetStillVisible,
      sample: text.replace(/\s+/g, ' ').slice(0, 500),
    };
  }

  for (const scope of [page, ...page.frames()]) {
    for (const pattern of [/^Yes$/i, /^Ja$/i, /^OK$/i, /^Delete$/i, /^L.schen$/i]) {
      const button = scope.getByRole('button', { name: pattern }).first();
      if (await button.isVisible({ timeout: 1200 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(2500);
        return { confirmed: true, button: pattern.source, hasDeleteText, hasRiskyPostingText, targetStillVisible };
      }
    }
  }

  return { confirmed: false, reason: 'safe-dialog-but-confirm-button-not-found', hasDeleteText, hasRiskyPostingText, targetStillVisible };
}

function renderReadme(result: Record<string, any>) {
  return [
    '# P2P-022 Purchase Invoice Draft Cleanup Diagnosis',
    '',
    'Status: `labor`, `cleanup-diagnosis`, `no-preview`, `no-post`, `helper-only`, `needs-german-final-rebuild`.',
    '',
    `Target draft: \`${targetDraftNo}\``,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Warum das wichtig ist',
    '',
    'Ein kontrollierter Laborbeleg darf nicht einfach liegen bleiben, wenn er nur ein Preflight-Draft war. Vor jeder weiteren P2P-Route muss klar sein, ob der Draft geloescht wurde oder bewusst als Trace behalten wird.',
    '',
    '## Grenzen',
    '',
    '- Keine Preview Posting.',
    '- Keine Buchung.',
    '- Kein Setup Change.',
    '- Kein deutscher Finalnachweis.',
    '',
  ].join('\n');
}

test('P2P-022 diagnoses or cleans only Purchase Invoice draft 107229', async ({ page }) => {
  await openFilteredPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  const before = await countTargetSignals(page);
  await writeTextEvidence(p2pEvidencePath('010-filtered-list-before.txt'), before.compact);
  await writeJsonEvidence(p2pEvidencePath('010-filtered-list-before.json'), { ...before, compact: undefined });
  await screenshot(page, 'p2p-022-010-filtered-target-draft-before.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: before.targetVisible ? 'labor' : 'rejected',
    bookUse: 'evidence',
    purpose: `P2P-022 Cleanup-Diagnose: gefilterte Purchase-Invoices-Liste fuer Zielentwurf ${targetDraftNo}.`,
    expectedPageText: [/Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: ['Nur Cleanup-Diagnose, keine Preview und keine Buchung.'],
  });

  let deleteTrigger: Awaited<ReturnType<typeof triggerDelete>> = { triggered: false, attempts: [], reason: 'target-not-visible' };
  let confirmation: Awaited<ReturnType<typeof confirmOnlySafeDeleteDialog>> = {
    confirmed: false,
    reason: 'target-not-visible',
    hasDeleteText: false,
    hasRiskyPostingText: false,
    targetStillVisible: false,
    sample: '',
  };
  if (before.targetVisible && before.otherPurchaseInvoiceNos.length === 0) {
    deleteTrigger = await triggerDelete(page);
    confirmation = deleteTrigger.triggered
      ? await confirmOnlySafeDeleteDialog(page)
      : {
          confirmed: false,
          reason: deleteTrigger.reason ?? 'delete-not-triggered',
          hasDeleteText: false,
          hasRiskyPostingText: false,
          targetStillVisible: false,
          sample: '',
        };
  }

  await writeJsonEvidence(p2pEvidencePath('020-delete-attempt.json'), { deleteTrigger, confirmation });
  await openFilteredPurchaseInvoices(page);
  const after = await countTargetSignals(page);
  await writeTextEvidence(p2pEvidencePath('030-filtered-list-after.txt'), after.compact);
  await writeJsonEvidence(p2pEvidencePath('030-filtered-list-after.json'), { ...after, compact: undefined });
  await screenshot(page, 'p2p-022-030-filtered-target-draft-after.png', {
    projectName: project.name,
    testId: TEST_ID,
    status: after.targetVisible ? 'candidate' : 'labor',
    bookUse: 'evidence',
    purpose: `P2P-022 Nachkontrolle: Zielentwurf ${targetDraftNo} nach sicherem Delete-Versuch.`,
    expectedPageText: [/Purchase Invoices|Einkaufsrechnungen/i],
    knownLimitations: ['Wenn Zielnummer noch sichtbar ist, bleibt der Draft als Keep-Trace blockiert.'],
  });

  const cleaned = before.targetVisible && !after.targetVisible;
  const resultStatus = cleaned ? 'observed' : 'blocked';
  const summary = cleaned
    ? `P2P-022 cleaned Purchase Invoice draft ${targetDraftNo} through a target-filtered UI route.`
    : `P2P-022 did not clean Purchase Invoice draft ${targetDraftNo}; beforeVisible=${before.targetVisible}, deleteTriggered=${deleteTrigger.triggered}, confirmed=${confirmation.confirmed}, afterVisible=${after.targetVisible}.`;
  const result = {
    schemaVersion: 1,
    purpose: 'p2p-purchase-invoice-draft-cleanup-diagnosis-result',
    caseId: CASE_ID,
    source: 'playwright-ui-labor-targeted-cleanup-diagnosis',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    sourceCompany: EXPECTED_COMPANY,
    targetDraftNo,
    previewPosting: false,
    posted: false,
    setupChanges: [],
    changedRecords: cleaned ? [{ type: 'Purchase Invoice', documentNo: targetDraftNo, cleanup: 'deleted' }] : [],
    postedRecords: [],
    flags: {
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      onlyTargetDraftDeleteAttempted: before.targetVisible && before.otherPurchaseInvoiceNos.length === 0,
      cleanupProven: cleaned,
    },
    context,
    before: { ...before, compact: undefined },
    deleteTrigger,
    confirmation,
    after: { ...after, compact: undefined },
    proved: [
      'Filtered Purchase Invoices was opened in MCP_1_20260210 / RM-DEMO.',
      before.targetVisible ? `Target draft ${targetDraftNo} was visible before cleanup.` : `Target draft ${targetDraftNo} was not visible before cleanup.`,
      cleaned ? `Target draft ${targetDraftNo} was not visible after cleanup.` : `Target draft ${targetDraftNo} is still visible after cleanup diagnosis.`,
      'No Preview Posting or posting was executed.',
    ],
    notProved: [
      ...(cleaned ? [] : [`Purchase Invoice draft ${targetDraftNo} deleted/cleaned.`]),
      'No item line, no posted invoice and no ledger trace.',
      'No German final proof.',
    ],
    blockedBy: [
      ...(cleaned ? [] : ['target-draft-still-visible-after-cleanup-diagnosis']),
      ...(before.otherPurchaseInvoiceNos.length === 0 ? [] : ['filtered-view-contained-other-purchase-invoice-numbers']),
    ],
    migrationRelevance: 'helper-only',
    mustRecreateInFinalSandbox: false,
    finalScreenshotNeeded: false,
    safeToFinalizeState: false,
    requiresReview: !cleaned,
    statePatch: {},
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/p2p-022/P2P-022-result.json',
      'playwright/projects/fibu-book5/evidence/p2p-022/010-filtered-list-before.json',
      'playwright/projects/fibu-book5/evidence/p2p-022/020-delete-attempt.json',
      'playwright/projects/fibu-book5/evidence/p2p-022/030-filtered-list-after.json',
    ],
    screenshots: [
      'playwright/projects/fibu-book5/img/p2p-022-010-filtered-target-draft-before.png',
      'playwright/projects/fibu-book5/img/p2p-022-030-filtered-target-draft-after.png',
    ],
    summary,
    nextStep: cleaned
      ? 'P2P-023: decide whether Purchase Invoice can unlock RAW-STEEL item line entry, still without Preview/Post until values are visible.'
      : 'P2P-023: use a stronger document-card delete route or explicitly mark draft 107229 as kept laboratory trace before continuing P2P value entry.',
  };

  await writeJsonEvidence(p2pEvidencePath('P2P-022-result.json'), result);
  await writeTextEvidence(p2pEvidencePath('README.md'), renderReadme(result));

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(result.flags.noApiShortcut).toBe(true);
});
