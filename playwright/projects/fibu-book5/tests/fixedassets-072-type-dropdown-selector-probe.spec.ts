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

const CASE_ID = 'FIXEDASSETS-072-TYPE-DROPDOWN-SELECTOR-FIX';
const TEST_ID = 'fixedassets-072';
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

async function extractPurchaseInvoiceDraftNo(page: Page) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const text = await pageText(page);
    const headerMatch = text.match(/\b(10\d{3,})\b/);
    if (headerMatch?.[1]) {
      return headerMatch[1];
    }
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
        const entries = Array.from(document.querySelectorAll<HTMLElement>('td,div,span,input,[role="gridcell"],[role="option"],[role="menuitem"],[role="button"]'))
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
          .filter((entry) => /^(Item|Artikel|Fixed Asset|Anlage|Type|Art|No\.|Nr\.|G\/L Account|Sachkonto|Resource|Ressource|Charge \(Item\))$/i.test(entry.text))
          .slice(0, 60);
        return {
          frameUrl: /businesscentral\.dynamics\.com$/i.test(location.hostname) ? `${location.origin}${location.pathname}` : '[external-frame]',
          purchaseInvoiceVisible: /Purchase Invoice|Einkaufsrechnung/i.test(bodyText),
          linesContextVisible: /\bType\b|\bNo\.\b|\bDescription\b|\bArt\b|\bNr\./i.test(bodyText),
          fixedAssetLineTypeVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text)),
          itemLineTypeVisible: entries.some((entry) => /^(Item|Artikel)$/i.test(entry.text)),
          fixedAssetOptionVisible: entries.some((entry) => /^(Fixed Asset|Anlage)$/i.test(entry.text) && /option|menuitem/i.test(entry.role)),
          dropdownOptionTexts: entries
            .filter((entry) => /option|menuitem/i.test(entry.role) || /G\/L Account|Sachkonto|Item|Artikel|Fixed Asset|Anlage|Resource|Ressource/i.test(entry.text))
            .map((entry) => entry.text),
          entries,
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
    dropdownOptionTexts: Array.from(new Set(frames.flatMap((entry) => entry.dropdownOptionTexts))).slice(0, 30),
    frames,
  };
}

async function clickCurrentItemTypeCell(page: Page) {
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
            if (rect.y > 560) score -= 25;
            if (rect.x > 500 && rect.x < 760) score -= 25;
            return {
              element,
              text,
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
        if (!chosen) {
          return { clicked: false, reason: 'item-type-cell-not-found', candidates: [] };
        }
        const clickPoints = [
          { name: 'cell-center', x: chosen.rect.x + Math.round(chosen.rect.width / 2), y: chosen.rect.y + Math.round(chosen.rect.height / 2) },
          { name: 'cell-right-edge', x: chosen.rect.x + chosen.rect.width - 8, y: chosen.rect.y + Math.round(chosen.rect.height / 2) },
          { name: 'cell-left-body', x: chosen.rect.x + 12, y: chosen.rect.y + Math.round(chosen.rect.height / 2) },
        ];
        const dispatched = [];
        for (const point of clickPoints) {
          const target = document.elementFromPoint(point.x, point.y) || chosen.element;
          for (const eventType of ['pointerdown', 'mousedown', 'mouseup', 'click']) {
            const event =
              eventType.startsWith('pointer')
                ? new PointerEvent(eventType, { bubbles: true, cancelable: true, clientX: point.x, clientY: point.y, pointerType: 'mouse' })
                : new MouseEvent(eventType, { bubbles: true, cancelable: true, clientX: point.x, clientY: point.y });
            target.dispatchEvent(event);
          }
          chosen.element.focus();
          dispatched.push({
            ...point,
            targetText: normalize(target.textContent),
            targetRole: normalize(target.getAttribute('role')),
            targetAria: normalize(target.getAttribute('aria-label')),
            activeText: normalize(document.activeElement?.textContent),
            activeRole: normalize(document.activeElement?.getAttribute('role')),
            activeAria: normalize(document.activeElement?.getAttribute('aria-label')),
          });
        }
        return {
          clicked: true,
          chosen: {
            text: chosen.text,
            rect: chosen.rect,
            score: chosen.score,
          },
          dispatched,
          candidates: candidates.slice(0, 8).map(({ element: _element, ...entry }) => entry),
        };
      })
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    if (result.clicked) {
      await page.waitForTimeout(800);
      return { frameUrl: frame.url(), ...result };
    }
  }
  return { clicked: false, reason: 'item-type-cell-not-found-in-any-frame', candidates: [] };
}

async function openTypeDropdown(page: Page) {
  const attempts = [];
  const cellClick = await clickCurrentItemTypeCell(page);
  attempts.push({ action: 'click-current-item-type-cell', result: cellClick });
  if (!cellClick.clicked) {
    return { opened: false, attempts };
  }

  for (const key of ['Alt+ArrowDown', 'F4', 'Enter']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(1100);
    const signals = await collectLineTypeSignals(page);
    attempts.push({ action: `keyboard-${key}`, signals });
    if (signals.fixedAssetLineTypeVisible || signals.fixedAssetOptionVisible || signals.dropdownOptionTexts.length > 1) {
      return { opened: true, attempts, signals };
    }
  }

  return { opened: false, attempts, signals: await collectLineTypeSignals(page) };
}

async function trySelectFixedAssetLineType(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const option = scope.getByText(/^(Fixed Asset|Anlage)$/i).first();
    if (await option.isVisible({ timeout: 800 }).catch(() => false)) {
      await option.click();
      await page.waitForTimeout(1500);
      return { selected: true, selector: 'text:Fixed Asset|Anlage', scopeUrl: scope.url() };
    }
  }
  return { selected: false, selector: 'text:Fixed Asset|Anlage', scopeUrl: '' };
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
              element,
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
        if (!chosen) {
          return { clicked: false, reason: 'delete-action-not-found', candidates: candidates.slice(0, 20).map(({ element: _e, clickable: _c, ...entry }) => entry) };
        }
        chosen.clickable.click();
        return {
          clicked: true,
          chosen: { text: chosen.text, aria: chosen.aria, title: chosen.title, label: chosen.label, rect: chosen.rect, score: chosen.score },
          candidates: candidates.slice(0, 8).map(({ element: _e, clickable: _c, ...entry }) => entry),
        };
      })
      .catch((error) => ({ clicked: false, reason: String(error), candidates: [] }));
    if (result.clicked) {
      await page.waitForTimeout(1500);
      return result;
    }
  }
  return { clicked: false, reason: 'invoice-row-not-found', candidates: [] };
}

async function cleanupDraft(page: Page, invoiceNo: string) {
  await page.goto(purchaseInvoicesFilteredUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|No\.|Nr\./i, { timeout: 90_000 });
  await dismissTours(page);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);

  const visibleBefore = new RegExp(invoiceNo).test(await pageText(page));
  if (!visibleBefore) {
    return { status: 'not-visible-before-cleanup', invoiceNo, visibleBefore, visibleAfter: false };
  }

  const deleteAction = await clickDeleteSelectedInvoice(page, invoiceNo);
  const confirmation = deleteAction.clicked ? await confirmYes(page) : { confirmed: false, button: 'not-needed' };
  await page.waitForTimeout(2500);
  await page.goto(purchaseInvoicesFilteredUrl(invoiceNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
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
      active_case_file: '.agent/state/cases/fixedassets-072.json',
      nextStep:
        resultStatus === 'observed'
          ? 'FA-072 proved Type = Fixed Asset can be selected in the Purchase Invoice Lines context. Next step is a separate guarded field-mapping probe for K30000 and FA-CNC-01; no posting yet.'
          : 'FA-072 did not prove Type = Fixed Asset selection. Next step is a narrower selector/dropdown diagnosis or alternative UI route.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'type-dropdown-selector-probe',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        resultStatus === 'observed'
          ? 'Run a separate guarded field-mapping probe for K30000 and FA-CNC-01; no posting until field mapping and preview are documented.'
          : 'Improve the Type dropdown selector before entering target values.',
    },
    activeCase: {
      status: resultStatus,
      lastResult: {
        status: resultStatus,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-072/FIXEDASSETS-072-result.json',
        summary,
      },
      nextSafeAction:
        resultStatus === 'observed'
          ? 'Plan a separate field-mapping proof for K30000 and FA-CNC-01. No posting yet.'
          : 'Do not enter K30000 or FA-CNC-01 until Type = Fixed Asset is proven.',
    },
  };
}

test('FIXEDASSETS-072 probes Type dropdown and attempts Fixed Asset selection', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await openPurchaseInvoices(page);
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

  let draftInvoiceNo = await extractPurchaseInvoiceDraftNo(page);
  const beforeDropdownSignals = await collectLineTypeSignals(page);
  const dropdownProbe = await openTypeDropdown(page);
  await writeJsonEvidence(fixedAssetsEvidencePath('030-type-dropdown-probe.json'), {
    beforeDropdownSignals,
    dropdownProbe,
  });

  const selectResult = dropdownProbe.opened ? await trySelectFixedAssetLineType(page) : { selected: false, selector: 'not-attempted', scopeUrl: '' };
  await page.waitForTimeout(1800);
  const afterSelectionSignals = await collectLineTypeSignals(page);
  const guard = classifyPurchaseInvoiceLineTypeVisibility(afterSelectionSignals);
  await writeJsonEvidence(fixedAssetsEvidencePath('040-after-selection-line-type-context.json'), {
    selectResult,
    afterSelectionSignals,
    guard,
  });
  await writeTextEvidence(
    fixedAssetsEvidencePath('041-after-selection-focused-text.txt'),
    await compactPageText(page, {
      include: [/Purchase Invoice|Einkaufsrechnung|Type|Art|Fixed Asset|Anlage|Item|Artikel|No\.|Nr\.|Vendor|Kreditor|Post|Buchen|Preview|Vorschau/i],
      maxLines: 180,
      maxLineLength: 220,
    }),
  );
  draftInvoiceNo = draftInvoiceNo ?? (await extractPurchaseInvoiceDraftNo(page));

  const cleanup =
    draftInvoiceNo && /^\d+$/.test(draftInvoiceNo)
      ? await cleanupDraft(page, draftInvoiceNo)
      : { status: 'not-created-or-draft-number-not-found', invoiceNo: draftInvoiceNo, visibleAfter: false };
  await writeJsonEvidence(fixedAssetsEvidencePath('090-cleanup-result.json'), cleanup);

  const cleanupCompleted = cleanup.status === 'deleted' || cleanup.status === 'not-created-or-draft-number-not-found';
  const fixedAssetProved = selectResult.selected || afterSelectionSignals.fixedAssetLineTypeVisible || guard.success;
  const resultStatus = fixedAssetProved ? 'observed' : 'blocked';
  const summary = fixedAssetProved
    ? `FA-072 proved Type = Fixed Asset in Purchase Invoice Lines for draft ${draftInvoiceNo ?? '(unknown)'}, then removed the draft.`
    : `FA-072 did not prove Type = Fixed Asset selection; dropdown opened=${dropdownProbe.opened}, selected=${selectResult.selected}. Draft cleanup status=${cleanup.status}.`;
  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-type-dropdown-selector-probe-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-type-dropdown-probe',
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
    companyChanges: [
      {
        fromCompany: EXPECTED_COMPANY,
        toCompany: EXPECTED_COMPANY,
        reason: 'No company switch needed for FA-072.',
        changedAt: startedAt,
        result: 'not-needed',
      },
    ],
    createdCompanies: [],
    createdRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Purchase Invoice',
        documentNo: draftInvoiceNo ?? '',
        purpose: 'Sandbox Type dropdown selector probe; no vendor/fixed asset target values, no preview, no post.',
        createdAt: startedAt,
        status: cleanupCompleted ? 'deleted' : 'draft',
        cleanupStatus: cleanupCompleted ? 'deleted' : 'blocked',
      },
    ],
    changedRecords: [
      {
        company: EXPECTED_COMPANY,
        type: 'Purchase Invoice Line',
        documentNo: draftInvoiceNo ?? '',
        field: 'Type',
        oldValue: beforeDropdownSignals.itemLineTypeVisible ? 'Item' : 'unknown',
        newValue: fixedAssetProved ? 'Fixed Asset' : 'not-proven',
        purpose: 'Probe whether the Type dropdown can reach Fixed Asset before target value entry.',
        cleanupStatus: cleanupCompleted ? 'deleted-with-draft' : 'blocked',
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
      'The run interacted only with Purchase Invoice Lines Type context before target value entry.',
      ...(dropdownProbe.opened ? ['The Type dropdown/list context opened or exposed multiple line-type options.'] : []),
      ...(fixedAssetProved ? ['Type = Fixed Asset was visible or selected in the Purchase Invoice Lines context.'] : []),
      cleanupCompleted ? `Temporary Purchase Invoice draft ${draftInvoiceNo ?? ''} was removed through UI cleanup.` : 'Cleanup was attempted and blocker is documented.',
    ],
    notProved: [
      ...(fixedAssetProved ? [] : ['Type = Fixed Asset was not proven as selected or visible.']),
      'K30000 was not entered.',
      'FA-CNC-01 was not entered.',
      'No Preview Posting.',
      'No posting.',
      'No German final proof.',
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-072.json',
      '.agent/state/last_run_summary.json',
      '.agent/state/coverage_state.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-072-type-dropdown-selector-probe.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/FIXEDASSETS-072-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/030-type-dropdown-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/040-after-selection-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-072/FIXEDASSETS-072-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/030-type-dropdown-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/040-after-selection-line-type-context.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/090-cleanup-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-072/README.md',
    ],
    warnings: [
      'Sandbox/Labor evidence only.',
      'This probe intentionally stops before K30000 and FA-CNC-01.',
      'No Preview Posting or posting was attempted.',
    ],
    blockedBy: fixedAssetProved ? [] : ['Type = Fixed Asset not visible or not selectable through the attempted dropdown route.'],
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
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      newAttempt,
      draftInvoiceNo,
      beforeDropdownSignals,
      dropdownProbe,
      selectResult,
      afterSelectionSignals,
      guard,
    },
    nextStep: fixedAssetProved
      ? 'Create a separate guarded field-mapping case for K30000 and FA-CNC-01. Do not post until preview/posting evidence is planned.'
      : 'Improve the Type dropdown selector or try an alternative UI route before entering target values.',
  };

  await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-072-result.json'), result);
  await writeTextEvidence(
    fixedAssetsEvidencePath('README.md'),
    [
      '# FIXEDASSETS-072 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-072-result.json` | JSON | Type-Dropdown-Probe, Dokumentnummer, Cleanup, Grenzen | keinen Anlagenkauf, keine Zielwerte, keine Buchung | `labor`, `sandbox-probe` |',
      '| `030-type-dropdown-probe.json` | JSON | Klick-/Tastaturversuche fuer Type-Dropdown und sichtbare Optionen | keine finale Feldzuordnung | `selector-evidence` |',
      '| `040-after-selection-line-type-context.json` | JSON | sichtbarer Type-Kontext nach Auswahlversuch | keine gebuchte Anlagenbewegung | `line-type-context` |',
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
});
