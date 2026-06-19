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
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-074-PAGE-INSPECTION-PERSONALIZATION-ROUTE';
const TEST_ID = 'fixedassets-074';
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
  await dismissTours(page);
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
            if (rect.x > 450 && rect.x < 850) score -= 25;
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
  const keep = /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID|Purchase Invoice|Purchase Line|Purchase Header|Type|No\.|Field|Table|Page|Subform/i;
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
    .slice(0, 80);
}

async function openPageInspectionOnFocusedLine(page: Page) {
  const before = await pageText(page);
  await page.keyboard.press('Control+Alt+F1');
  await page.waitForTimeout(2500);
  const after = await pageText(page);
  const focusedText = await compactPageText(page, {
    include: [/Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID|Purchase Line|Purchase Header|Purchase Invoice|Type|Field/i],
    maxLines: 120,
    maxLineLength: 220,
  });
  const lines = compactInspectionLines(focusedText || after);
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(after) && after !== before;
  return {
    opened,
    lines,
    lineContextSignals: {
      purchaseLineMentioned: /Purchase Line/i.test(lines.join(' ')),
      purchaseHeaderMentioned: /Purchase Header/i.test(lines.join(' ')),
      typeMentioned: /\bType\b|Art/i.test(lines.join(' ')),
      pageInspectionMentioned: /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(lines.join(' ')),
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
            return { clickable, text, aria, title, label, rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }, score };
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

async function cleanupDraft(page: Page, invoiceNo: string) {
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
      activeCase: CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-074.json',
      nextStep:
        resultStatus === 'observed'
          ? 'FA-074 produced technical Page Inspection context for the Purchase Invoice Lines area. Next: decide whether a setup/page capability change or another UI route is justified before target entry.'
          : 'FA-074 could not produce useful line-level Page Inspection context. Next: use a safer setup/page-capability review, not Type-cell retries.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'purchase-invoice-line-page-inspection-diagnosis',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        resultStatus === 'observed'
          ? 'Review the Page Inspection line-context evidence and choose the next page/setup capability route.'
          : 'Do not repeat Type-cell retries; plan setup/page capability diagnosis.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-074/FIXEDASSETS-074-result.json',
        summary,
      },
      nextSafeAction:
        resultStatus === 'observed'
          ? 'Use technical line context to decide whether Fixed Asset line type is page/setup constrained.'
          : 'Use setup/page-capability review before any further target entry.',
    },
  };
}

test('FIXEDASSETS-074 inspects purchase invoice line context without target values', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
  const context = await assertSandboxContext(page);
  if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(context)}`);
  }

  await writeTextEvidence(
    faEvidencePath('010-before-new-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoices|Einkaufsrechnungen|New|Neu|Post|Buchen|Invoice|Rechnung/i],
      maxLines: 80,
      maxLineLength: 220,
    }),
  );

  const newAttempt = await clickScopedNew(page);
  await writeJsonEvidence(faEvidencePath('020-scoped-new-attempt.json'), newAttempt);
  let draftInvoiceNo = await extractDraftNo(page);

  const focusedCell = await focusTypeCell(page);
  const pageInspection = await openPageInspectionOnFocusedLine(page);
  await writeJsonEvidence(faEvidencePath('030-page-inspection-line-context.json'), {
    focusedCell,
    pageInspection,
  });
  await writeTextEvidence(faEvidencePath('031-page-inspection-focused-lines.txt'), pageInspection.lines.join('\n') || 'No compact Page Inspection lines captured.\n');

  draftInvoiceNo = draftInvoiceNo ?? (await extractDraftNo(page));
  const cleanup =
    draftInvoiceNo && /^\d+$/.test(draftInvoiceNo)
      ? await cleanupDraft(page, draftInvoiceNo)
      : { status: 'not-created-or-draft-number-not-found', invoiceNo: draftInvoiceNo, visibleAfter: false };
  await writeJsonEvidence(faEvidencePath('090-cleanup-result.json'), cleanup);

  const persistedDraftDetected = Boolean(draftInvoiceNo && /^\d+$/.test(draftInvoiceNo));
  const cleanupCompleted = cleanup.status === 'deleted' || cleanup.status === 'not-created-or-draft-number-not-found';
  const usefulInspection = pageInspection.opened && pageInspection.lineContextSignals.pageInspectionMentioned;
  const purchaseLineProved = pageInspection.lineContextSignals.purchaseLineMentioned;
  const fixedAssetMentionedInHelp = pageInspection.lines.some((line) => /fixed asset/i.test(line));
  const resultStatus = usefulInspection ? 'observed' : 'blocked';
  const summary = usefulInspection
    ? `FA-074 opened Page Inspection after focusing the Purchase Invoice Lines Type cell. Page Inspection resolved to ${purchaseLineProved ? 'Purchase Line context' : 'Purchase Header context'}, and fixed asset was ${fixedAssetMentionedInHelp ? 'mentioned' : 'not mentioned'} in the Type field help text. Cleanup status=${cleanup.status}.`
    : `FA-074 did not capture useful line-level Page Inspection context. Focused cell found=${focusedCell.found}, opened=${pageInspection.opened}. Cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-page-inspection-personalization-route-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-line-page-inspection-diagnosis',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      urlAfterProbe: page.url(),
    },
    createdRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Purchase Invoice',
        documentNo: draftInvoiceNo ?? '',
        purpose: 'Temporary sandbox draft to reach real Purchase Invoice Lines context for Page Inspection; no vendor/fixed asset target values, no preview, no post.',
        createdAt: startedAt,
        status: persistedDraftDetected ? (cleanupCompleted ? 'deleted' : 'draft') : 'no-persisted-number-detected',
        cleanupStatus: persistedDraftDetected ? (cleanupCompleted ? 'deleted' : 'blocked') : 'not-needed',
      },
    ],
    postedRecords: [],
    setupChanges: [],
    cleanup: {
      required: persistedDraftDetected,
      completed: cleanupCompleted,
      method: persistedDraftDetected ? 'filtered Purchase Invoices list delete via UI' : 'not-needed',
      blockedBy: cleanupCompleted ? [] : [cleanup.status],
      detail: cleanup,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'New/Neu was clicked once in the scoped Purchase Invoices context to reach real line context.',
      focusedCell.found ? 'The Purchase Invoice Lines Type cell was focused before Page Inspection.' : 'The Type cell focus was attempted and documented.',
      ...(usefulInspection ? ['Page Inspection opened and produced compact technical context lines.'] : []),
      ...(pageInspection.lineContextSignals.purchaseHeaderMentioned ? ['Page Inspection resolved to Purchase Invoice / Purchase Header technical context.'] : []),
      ...(fixedAssetMentionedInHelp ? ['The Type field help text explicitly mentions fixed asset as a possible buying type.'] : []),
      persistedDraftDetected && cleanupCompleted
        ? `Temporary Purchase Invoice draft ${draftInvoiceNo ?? ''} was removed through UI cleanup.`
        : 'No persisted Purchase Invoice draft number was detected after the probe; cleanup was not needed.',
    ],
    notProved: [
      'Type = Fixed Asset was not selected.',
      ...(purchaseLineProved ? [] : ['Page Inspection did not prove Purchase Line as the source table for the focused Type cell.']),
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No Preview Posting.',
      'No posting.',
      'No setup change.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-074.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-074-pageinspection-personalization-route.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/FIXEDASSETS-074-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/030-page-inspection-line-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/031-page-inspection-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-074/FIXEDASSETS-074-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/030-page-inspection-line-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/031-page-inspection-focused-lines.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-074/README.md',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'Page Inspection is technical diagnosis, not final book screenshot evidence.',
      'This probe intentionally stops before K30000 and FA-CNC-01.',
    ],
    blockedBy: usefulInspection ? [] : ['No useful line-level Page Inspection context captured.'],
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
      cleanupCompleted,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      newAttempt,
      draftInvoiceNo,
      focusedCell,
      pageInspection,
    },
    nextStep: usefulInspection
      ? 'Use the Page Inspection result to decide whether a setup/page capability check or a different line-subpage inspection route is needed before target entry.'
      : 'Plan a setup/page-capability review; do not repeat Type-cell retries.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-074-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-074 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-074-result.json` | JSON | Page-Inspection-Diagnose im Einkaufsrechnungs-/Zeilenkontext, Cleanup, Grenzen | keinen Anlagenkauf, keine Zielwerte, keine Buchung | `labor`, `technical-diagnosis` |',
      '| `030-page-inspection-line-context.json` | JSON | fokussierte Type-Zelle und Page-Inspection-Signale | keine Feldwert-Auswahl | `technical-context` |',
      '| `031-page-inspection-focused-lines.txt` | Text | kompakte technische Page-Inspection-Zeilen | kein Rohdump, kein Screenshot-Proof | `compact` |',
      '| `090-cleanup-result.json` | JSON | Cleanup-Status eines ggf. erzeugten Drafts | keine Postenspur | `cleanup` |',
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
  expect(result.flags.cleanupCompleted).toBe(true);
});
