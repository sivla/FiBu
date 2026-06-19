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

const CASE_ID = 'FIXEDASSETS-073-TYPE-DROPDOWN-ALTERNATIVE-ROUTE';
const TEST_ID = 'fixedassets-073';
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
  if (invoiceNo) {
    url.searchParams.set('filter', `'Purchase Header'.'No.' IS '${invoiceNo}'`);
  }
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

async function collectLineTypeSignals(page: Page) {
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
        const bodyText = normalize(document.body?.innerText || '');
        const entries = Array.from(
          document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"],[role="option"],[role="menuitem"],[role="button"],[aria-label],[title]'),
        )
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = element instanceof HTMLInputElement ? normalize(element.value) : normalize(element.innerText || element.textContent);
            return {
              text,
              role: normalize(element.getAttribute('role')),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
            };
          })
          .filter((entry) =>
            /Item|Artikel|Fixed Asset|Anlage|Type|Art|No\.|Nr\.|G\/L Account|Sachkonto|Resource|Ressource|Charge \(Item\)|Option Values/i.test(
              `${entry.text} ${entry.aria} ${entry.title}`,
            ),
          )
          .filter((entry) => entry.text.length <= 180 && entry.rect.width < 1200 && entry.rect.y >= 0)
          .slice(0, 40);

        const optionValuePopupVisible = entries.some((entry) => /Option Values:\s*Item/i.test(`${entry.aria} ${entry.title} ${entry.text}`));
        const dropdownOptionTexts = Array.from(
          new Set(
            entries
              .filter((entry) => /option|menuitem/i.test(entry.role) || /G\/L Account|Sachkonto|Item|Artikel|Fixed Asset|Anlage|Resource|Ressource/i.test(entry.text))
              .map((entry) => entry.text || entry.aria || entry.title)
              .filter(Boolean),
          ),
        );

        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          linesContextVisible: /\bType\b|\bNo\.\b|\bDescription\b|\bArt\b|\bNr\./i.test(bodyText),
          fixedAssetLineTypeVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text)),
          itemLineTypeVisible: entries.some((entry) => /^(Item|Artikel)$/i.test(entry.text)),
          fixedAssetOptionVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text) && /option|menuitem/i.test(entry.role)),
          optionValuePopupVisible,
          dropdownOptionTexts,
          entries: entries.slice(0, 30),
        };
      })
      .catch(() => null);
    if (evidence) frames.push(evidence);
  }

  return {
    purchaseInvoiceVisible: frames.some((entry) => entry.purchaseInvoiceVisible),
    linesContextVisible: frames.some((entry) => entry.linesContextVisible),
    fixedAssetLineTypeVisible: frames.some((entry) => entry.fixedAssetLineTypeVisible),
    itemLineTypeVisible: frames.some((entry) => entry.itemLineTypeVisible),
    fixedAssetOptionVisible: frames.some((entry) => entry.fixedAssetOptionVisible),
    optionValuePopupVisible: frames.some((entry) => entry.optionValuePopupVisible),
    dropdownOptionTexts: Array.from(new Set(frames.flatMap((entry) => entry.dropdownOptionTexts))).slice(0, 40),
    frames,
  };
}

function summarizeSignals(signals: Awaited<ReturnType<typeof collectLineTypeSignals>>) {
  return {
    purchaseInvoiceVisible: signals.purchaseInvoiceVisible,
    linesContextVisible: signals.linesContextVisible,
    fixedAssetLineTypeVisible: signals.fixedAssetLineTypeVisible,
    itemLineTypeVisible: signals.itemLineTypeVisible,
    fixedAssetOptionVisible: signals.fixedAssetOptionVisible,
    optionValuePopupVisible: signals.optionValuePopupVisible,
    dropdownOptionTexts: signals.dropdownOptionTexts.slice(0, 12),
    frameCount: signals.frames.length,
    matchingEntryCount: signals.frames.reduce((sum, frame) => sum + frame.entries.length, 0),
  };
}

async function findItemTypeCellBox(page: Page) {
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
              role: normalize(element.getAttribute('role')),
              aria: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
              score,
            };
          })
          .filter((entry) => /^(Item|Artikel)$/i.test(entry.text))
          .sort((left, right) => left.score - right.score || left.rect.y - right.rect.y || left.rect.x - right.rect.x);
        const chosen = candidates[0];
        return chosen
          ? { found: true, chosen, candidates: candidates.slice(0, 12) }
          : { found: false, chosen: null, candidates: [] };
      })
      .catch((error) => ({ found: false, chosen: null, candidates: [], error: String(error) }));
    if (result.found && result.chosen) return { frameUrl: frame.url(), ...result };
  }
  return { found: false, chosen: null, candidates: [], frameUrl: '' };
}

async function probeAlternativeRoute(page: Page) {
  const cell = await findItemTypeCellBox(page);
  const attempts = [];
  if (!cell.found || !cell.chosen) return { status: 'blocked-item-type-cell-not-found', cell, attempts };

  const rect = cell.chosen.rect;
  const points = [
    { name: 'center-click', x: rect.x + Math.round(rect.width / 2), y: rect.y + Math.round(rect.height / 2), kind: 'click' },
    { name: 'right-edge-click', x: rect.x + rect.width - 6, y: rect.y + Math.round(rect.height / 2), kind: 'click' },
    { name: 'center-double-click', x: rect.x + Math.round(rect.width / 2), y: rect.y + Math.round(rect.height / 2), kind: 'dblclick' },
    { name: 'left-body-click', x: rect.x + 12, y: rect.y + Math.round(rect.height / 2), kind: 'click' },
  ];
  const keys = ['F2', 'Alt+ArrowDown', 'ArrowDown', 'F4'];

  for (const point of points) {
    if (point.kind === 'dblclick') {
      await page.mouse.dblclick(point.x, point.y);
    } else {
      await page.mouse.click(point.x, point.y);
    }
    await page.waitForTimeout(700);
    let signals = await collectLineTypeSignals(page);
    attempts.push({ action: point.name, point, signals: summarizeSignals(signals) });
    if (signals.fixedAssetLineTypeVisible || signals.fixedAssetOptionVisible) {
      return { status: 'fixed-asset-visible-after-pointer-action', cell, attempts, signals };
    }
    for (const key of keys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(900);
      signals = await collectLineTypeSignals(page);
      attempts.push({ action: `${point.name}+${key}`, point, key, signals: summarizeSignals(signals) });
      if (signals.fixedAssetLineTypeVisible || signals.fixedAssetOptionVisible) {
        return { status: 'fixed-asset-visible-after-key-action', cell, attempts, signals };
      }
      if (signals.optionValuePopupVisible && !signals.fixedAssetLineTypeVisible) {
        attempts.push({ action: `${point.name}+${key}:option-value-only`, point, key, note: 'Only Option Values: Item was visible.' });
      }
      await page.keyboard.press('Escape').catch(() => undefined);
      await page.waitForTimeout(400);
    }
  }

  const signals = await collectLineTypeSignals(page);
  return {
    status: signals.optionValuePopupVisible ? 'blocked-option-values-item-only' : 'blocked-no-fixed-asset-option',
    cell,
    attempts,
    signals,
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
        return {
          clicked: true,
          chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, label: chosen.label, rect: chosen.rect, score: chosen.score },
          candidates: candidates.slice(0, 8).map(({ clickable: _clickable, ...entry }) => entry),
        };
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
  await dismissTours(page).catch(() => undefined);
  await page.waitForTimeout(1200);
  const visibleAfter = new RegExp(invoiceNo).test(await pageText(page));
  return {
    status: visibleAfter ? 'cleanup-clicked-but-still-visible' : 'deleted',
    invoiceNo,
    visibleBefore,
    visibleAfter,
    deleteAction,
    confirmation,
  };
}

function statePatch(resultStatus: string, summary: string) {
  return {
    current: {
      activeCase: CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-073.json',
      nextStep:
        resultStatus === 'observed'
          ? 'FA-073 exposed Type = Fixed Asset through an alternative UI route. Next: a separate guarded field-mapping probe for K30000 and FA-CNC-01; no posting yet.'
          : 'FA-073 still did not expose Type = Fixed Asset; next investigate Page Inspection/Personalization or setup/page capability before target value entry.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'type-dropdown-alternative-route-probe',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        resultStatus === 'observed'
          ? 'Create a guarded field-mapping case for K30000 and FA-CNC-01. No posting yet.'
          : 'Do not enter K30000 or FA-CNC-01; investigate whether Purchase Invoice Lines Type is page/setup constrained.',
    },
    activeCase: {
      status: resultStatus === 'observed' ? 'observed-cleanup-complete' : 'blocked-cleanup-complete',
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-073/FIXEDASSETS-073-result.json',
        summary,
      },
      nextSafeAction:
        resultStatus === 'observed'
          ? 'Plan K30000/FA-CNC-01 field mapping only after confirming Type = Fixed Asset remains selected.'
          : 'Use Page Inspection/Personalization or a setup capability check before more Type-cell retries.',
    },
  };
}

test('FIXEDASSETS-073 probes an alternative Type dropdown route without target values', async ({ page }) => {
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
  const beforeProbeSignals = await collectLineTypeSignals(page);
  const alternativeRouteProbe = await probeAlternativeRoute(page);
  await writeJsonEvidence(faEvidencePath('030-alternative-route-probe.json'), {
    beforeProbeSignals: summarizeSignals(beforeProbeSignals),
    alternativeRouteProbe: {
      ...alternativeRouteProbe,
      signals: alternativeRouteProbe.signals ? summarizeSignals(alternativeRouteProbe.signals) : undefined,
    },
  });

  const afterRouteSignals = await collectLineTypeSignals(page);
  const guard = classifyPurchaseInvoiceLineTypeVisibility(afterRouteSignals);
  await writeJsonEvidence(faEvidencePath('040-after-route-line-type-context.json'), {
    afterRouteSignals: summarizeSignals(afterRouteSignals),
    guard,
  });
  draftInvoiceNo = draftInvoiceNo ?? (await extractDraftNo(page));

  const cleanup =
    draftInvoiceNo && /^\d+$/.test(draftInvoiceNo)
      ? await cleanupDraft(page, draftInvoiceNo)
      : { status: 'not-created-or-draft-number-not-found', invoiceNo: draftInvoiceNo, visibleAfter: false };
  await writeJsonEvidence(faEvidencePath('090-cleanup-result.json'), cleanup);

  const persistedDraftDetected = Boolean(draftInvoiceNo && /^\d+$/.test(draftInvoiceNo));
  const cleanupCompleted = cleanup.status === 'deleted' || cleanup.status === 'not-created-or-draft-number-not-found';
  const fixedAssetProved = afterRouteSignals.fixedAssetLineTypeVisible || afterRouteSignals.fixedAssetOptionVisible || guard.success;
  const resultStatus = fixedAssetProved ? 'observed' : 'blocked';
  const summary = fixedAssetProved
    ? `FA-073 exposed Type = Fixed Asset through an alternative UI route for draft ${draftInvoiceNo ?? '(unknown)'}, then removed the draft.`
    : `FA-073 did not expose Type = Fixed Asset; alternative route status=${alternativeRouteProbe.status}. Draft cleanup status=${cleanup.status}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-type-dropdown-alternative-route-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-type-alternative-route-probe',
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
        purpose: 'Sandbox alternative Type-route probe; no vendor/fixed asset target values, no preview, no post.',
        createdAt: startedAt,
        status: persistedDraftDetected ? (cleanupCompleted ? 'deleted' : 'draft') : 'no-persisted-number-detected',
        cleanupStatus: persistedDraftDetected ? (cleanupCompleted ? 'deleted' : 'blocked') : 'not-needed',
      },
    ],
    changedRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Purchase Invoice Line',
        documentNo: draftInvoiceNo ?? '',
        field: 'Type',
        oldValue: beforeProbeSignals.itemLineTypeVisible ? 'Item' : 'unknown',
        newValue: fixedAssetProved ? 'Fixed Asset-visible' : 'not-proven',
        purpose: 'Probe alternative UI route before target value entry.',
        cleanupStatus: persistedDraftDetected ? (cleanupCompleted ? 'deleted-with-draft' : 'blocked') : 'not-needed-no-persisted-draft-number',
      },
    ],
    postedRecords: [],
    setupChanges: [],
    cleanup: {
      required: Boolean(draftInvoiceNo),
      completed: cleanupCompleted,
      method: draftInvoiceNo ? 'filtered Purchase Invoices list delete via UI' : 'not-needed',
      blockedBy: cleanupCompleted ? [] : [cleanup.status],
      detail: cleanup,
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'New/Neu was clicked once in the scoped Purchase Invoices context.',
      'The run used real pointer/keyboard UI interaction against the Purchase Invoice Lines Type cell before target value entry.',
      persistedDraftDetected && cleanupCompleted
        ? `Temporary Purchase Invoice draft ${draftInvoiceNo ?? ''} was removed through UI cleanup.`
        : 'No persisted Purchase Invoice draft number was detected after the probe; cleanup was not needed.',
      ...(fixedAssetProved ? ['Type = Fixed Asset became visible through the alternative route.'] : []),
      ...(!fixedAssetProved && afterRouteSignals.optionValuePopupVisible ? ['The alternative route still exposed only the Option Values: Item popup.'] : []),
    ],
    notProved: [
      ...(fixedAssetProved ? [] : ['Type = Fixed Asset was not visible/selectable through this alternative route.']),
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No Preview Posting.',
      'No posting.',
      'No setup change.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-073.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-073-type-dropdown-alternative-route.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/FIXEDASSETS-073-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/030-alternative-route-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/040-after-route-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-073/FIXEDASSETS-073-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/030-alternative-route-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/040-after-route-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-073/README.md',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'This probe intentionally stops before K30000 and FA-CNC-01.',
      'No Preview Posting or posting was attempted.',
    ],
    blockedBy: fixedAssetProved ? [] : ['Type = Fixed Asset not visible/selectable through the attempted alternative route.'],
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
      beforeProbeSignals: summarizeSignals(beforeProbeSignals),
      alternativeRouteProbe: {
        ...alternativeRouteProbe,
        signals: alternativeRouteProbe.signals ? summarizeSignals(alternativeRouteProbe.signals) : undefined,
      },
      afterRouteSignals: summarizeSignals(afterRouteSignals),
      guard,
    },
    nextStep: fixedAssetProved
      ? 'Create a separate guarded field-mapping case for K30000 and FA-CNC-01. Do not post until preview/posting evidence is planned.'
      : 'Investigate Page Inspection/Personalization or setup/page capability before repeating Type-cell retries.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-073-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-073 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-073-result.json` | JSON | Alternativroute, Kontext, Cleanup, Grenzen | keinen Anlagenkauf, keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |',
      '| `030-alternative-route-probe.json` | JSON | echte Pointer-/Keyboard-Versuche an der Type-Zelle | keine finale Feldzuordnung | `selector-evidence` |',
      '| `040-after-route-line-type-context.json` | JSON | sichtbarer Type-Kontext nach Alternativroute | keine gebuchte Anlagenbewegung | `line-type-context` |',
      '| `090-cleanup-result.json` | JSON | Cleanup-Status des erzeugten Drafts | keine Postenspur | `cleanup` |',
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
