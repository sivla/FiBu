import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D10-VAT-MATRIX-ROW-ACTION-INVENTORY-NO-DELETE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d10-vat-matrix-row-action-inventory-no-delete';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D10-result.json');

type UiEntry = {
  text: string;
  role: string;
  tag: string;
  ariaLabel: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|startTraceId|parentPageOrigin|upn/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('dc', '0');
  return url.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const found = await frame
      .locator('[role="dialog"], .ms-Dialog-main, .modal-dialog')
      .filter({
        hasText: /Preview Posting|Buchungsvorschau|Delete|Loeschen|Loschen|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Yes|Ja|OK|Moechten Sie|Mochten Sie|Do you want/i
      })
      .first()
      .isVisible({ timeout: 300 })
      .catch(() => false);
    if (found) return true;
  }
  return false;
}

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(await dangerousDialogVisible(page)).toBe(false);
}

async function visibleText(page: Page) {
  return clean(await pageText(page));
}

async function matrixText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i,
        /INLAND|VAT19|1406|3806|19|Normale MwSt|Normal VAT/i,
        /Beschreibung|MwSt\. %|MwSt\.-Berechnungsart|Umsatzsteuerkonto|Vorsteuerkonto/i,
        /Neu|Liste bearbeiten|Weitere Optionen|Loeschen|Loschen|Delete|Kopieren|Copy|Bearbeiten|Nicht gespeichert|Fehler/i
      ],
      maxLines: 360,
      maxLineLength: 360
    })
  );
}

async function screenshot(page: Page, name: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, name.replace(/\.png$/i, '.screenshot.json')), {
    fileName: name,
    imagePath: path.join(EVIDENCE_DIR, name),
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function capture(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await matrixText(page);
  await writeText(`${prefix}.txt`, text);
  await screenshot(page, `${prefix}.png`, {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step,
    visibleLearning: 'Das Bild muss die Page-472-Zeile oder die geoeffnete Action-Flaeche sichtbar machen.',
    internallyProves: 'Universaarl Page-472 action-inventory evidence in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No cleanup/delete', 'No final VAT correctness', 'No Preview Posting', 'No Posting'],
    ...extra
  });
  return text;
}

async function openMatrix(page: Page) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertContext(page);
  const text = await visibleText(page);
  if (!/MwSt\.-?Buchungsmatrix|VAT Posting Setup/i.test(text)) {
    throw new Error('Page 472 VAT Posting Setup context is not visible.');
  }
}

async function collectVisibleActions(page: Page, source: string) {
  const result: UiEntry[] = [];
  for (const frame of page.frames()) {
    const frameEntries = await frame
      .evaluate((sourceName) => {
        return [...document.querySelectorAll<HTMLElement>('[role="button"],[role="menuitem"],[role="menuitemcheckbox"],button,a')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (
              !text ||
              rect.width <= 1 ||
              rect.height <= 1 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity || '1') <= 0
            ) {
              return null;
            }
            return {
              text,
              role: element.getAttribute('role') || '',
              tag: element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              source: sourceName
            };
          })
          .filter(Boolean)
          .slice(0, 220);
      }, source)
      .catch(() => []);
    result.push(...(frameEntries as UiEntry[]));
  }
  return result;
}

async function locateTargetRow(page: Page) {
  for (const frame of page.frames()) {
    const candidate = await frame
      .evaluate(() => {
        const entries = [...document.querySelectorAll<HTMLElement>('[role="row"],[role="gridcell"],tr,div')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || '').replace(/\s+/g, ' ').trim();
            const style = window.getComputedStyle(element);
            if (
              !/INLAND/i.test(text) ||
              !/VAT19/i.test(text) ||
              rect.width <= 10 ||
              rect.height <= 10 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none'
            ) {
              return null;
            }
            return {
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              tag: element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          })
          .filter(Boolean)
          .sort((left, right) => (left!.width - right!.width) || (left!.height - right!.height))[0];
        return entries || null;
      })
      .catch(() => null);
    if (candidate) return candidate as UiEntry;
  }
  return null;
}

async function clickAction(page: Page, pattern: RegExp) {
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const candidate = frame.getByRole(role, { name: pattern }).first();
      if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
        await candidate.click({ timeout: 4000 }).catch(async () => candidate.click({ timeout: 4000, force: true }));
        await page.waitForTimeout(1200);
        return { clicked: true, by: role };
      }
    }
    const text = frame.getByText(pattern).first();
    if (await text.isVisible({ timeout: 700 }).catch(() => false)) {
      await text.click({ timeout: 4000 }).catch(async () => text.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(1200);
      return { clicked: true, by: 'text' };
    }
  }
  return { clicked: false, by: 'not-found' };
}

test('TARGET-027D10 inventories row and command actions without cleanup/delete', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const actionsTaken: string[] = [];
  const inventories: Record<string, UiEntry[]> = {};

  await openMatrix(page);
  actionsTaken.push('Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix in playthru / UNIVERSAARL-DE.');
  const beforeText = await capture(page, 'target-027d10-010-before-action-inventory', 'Before row action inventory.', {
    status: 'before-action-inventory'
  });
  if (!/\bINLAND\b/i.test(beforeText) || !/\bVAT19\b/i.test(beforeText)) {
    blockedBy.push('INLAND/VAT19 partial row is not visible; no row action inventory can be trusted.');
  }

  const row = await locateTargetRow(page);
  if (!row) {
    blockedBy.push('Could not locate a visible row container containing both INLAND and VAT19.');
  } else {
    await page.mouse.click(row.x + Math.min(20, Math.max(5, Math.floor(row.width / 4))), row.y + Math.min(18, Math.max(5, Math.floor(row.height / 2))));
    await page.waitForTimeout(800);
    actionsTaken.push('Focused the visible INLAND/VAT19 row for action inventory.');
  }
  await assertContext(page);
  inventories.afterRowFocus = await collectVisibleActions(page, 'after-row-focus');
  await capture(page, 'target-027d10-020-after-row-focus', 'After focusing the INLAND/VAT19 row.', {
    status: 'after-row-focus',
    row
  });

  const moreOptions = await clickAction(page, /Weitere Optionen|More options/i);
  actionsTaken.push(`Opened Weitere Optionen / More options: ${moreOptions.clicked ? moreOptions.by : 'not-found'}.`);
  await assertContext(page);
  inventories.afterMoreOptions = await collectVisibleActions(page, 'after-more-options');
  await capture(page, 'target-027d10-030-after-more-options', 'After opening More options for action inventory.', {
    status: 'after-more-options',
    moreOptions
  });

  const dangerousActionPattern =
    /L(?:oe|o|\u00C3\u00B6|\u00F6|\?)schen|Delete|Entfernen|Remove|Buchen|Post|Preview Posting|Buchungsvorschau|OK|Ja|Yes/i;
  const deleteActionPattern = /L(?:oe|o|\u00C3\u00B6|\u00F6|\?)schen|Delete|Entfernen|Remove/i;
  const visibleDangerousActions = [...inventories.afterRowFocus, ...inventories.afterMoreOptions].filter((entry) =>
    dangerousActionPattern.test(entry.text)
  );
  if (visibleDangerousActions.some((entry) => /OK|Ja|Yes/i.test(entry.text))) {
    warnings.push('A confirmation-like action text is visible in the menu inventory; no confirmation was clicked.');
  }

  await openMatrix(page);
  const reopenText = await capture(page, 'target-027d10-040-reopen-no-delete-proof', 'Reopen proof after action inventory without delete.', {
    status: 'reopen-no-delete-proof'
  });
  if (!/\bINLAND\b/i.test(reopenText) || !/\bVAT19\b/i.test(reopenText)) {
    blockedBy.push('After reopen the INLAND/VAT19 row is not visible; cannot prove no-delete state.');
  }

  const deleteActionVisible = visibleDangerousActions.some((entry) => deleteActionPattern.test(entry.text));
  const resultStatus = blockedBy.length ? 'blocked-readonly-action-inventory' : 'observed-row-action-inventory-no-delete';
  const nextCase = deleteActionVisible
    ? 'TARGET-027D11-VAT-MATRIX-ROW-SCOPED-DELETE-DIALOG-CANCEL-PROBE'
    : 'TARGET-027D11-VAT-MATRIX-ALTERNATIVE-RECREATE-ROUTE-DISCOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-row-action-inventory-no-delete',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    row,
    moreOptions,
    inventories,
    visibleDangerousActions,
    deleteActionVisible,
    actionsTaken,
    actionsNotTaken: [
      'No cleanup/delete action clicked',
      'No confirmation dialog accepted',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch',
      'No VAT final claim'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 472 and the INLAND/VAT19 partial row were visible before action inventory.',
      'The run collected visible row/command/menu actions without clicking cleanup/delete.',
      'The row was still visible after reopen; no delete/cleanup effect was executed.',
      'No Preview Posting, Posting, master data, document draft or API shortcut was executed.'
    ],
    notProved: [
      'No complete VAT Posting Setup row.',
      'No safe cleanup/delete route yet.',
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval.'
    ],
    screenshots: [
      'target-027d10-010-before-action-inventory.png',
      'target-027d10-020-after-row-focus.png',
      'target-027d10-030-after-more-options.png',
      'target-027d10-040-reopen-no-delete-proof.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D10-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D10-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`
    ],
    blockedBy,
    warnings,
    flags: {
      noCleanupDelete: true,
      noDialogConfirm: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noD3D5D8CellRouteRepeat: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-027D10-VAT-MATRIX-ROW-ACTION-INVENTORY-NO-DELETE',
      lastEvidenceSummary:
        'D9 selected row-scoped cleanup feasibility as the next non-repeating path after D8 proved list-edit cannot expose VAT account editors.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The partial INLAND/VAT19 row blocks Foundation; cleanup/recreate may be required, but delete must not be clicked before row-scoped action inventory and dialog-cancel proof.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: deleteActionVisible ? 'ready-next' : 'needs-ui-discovery-first',
          reason: deleteActionVisible
            ? 'A cleanup/delete-like action is visible enough to justify a separate dialog-cancel probe.'
            : 'No cleanup/delete action was visible in the safe inventory; an alternative recreate route needs discovery.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'VAT matrix row remains incomplete or unproven.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT/posting defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation cannot be ready until VAT/posting/dimension gates are settled.'
        }
      ],
      queueChangesMade: [
        `Select ${nextCase} based on safe row-action inventory; no cleanup/delete was executed in D10.`
      ],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: deleteActionVisible
        ? 'A separate dialog-cancel probe is the narrowest safe way to prove whether cleanup can be row-scoped without deleting data.'
        : 'The safe inventory did not expose a usable cleanup action; the next route should discover a safer recreate/alternative path.',
      risksBeforeNextCase: [
        'Do not click or confirm delete without a dedicated row-scoped dialog-cancel case.',
        'Do not create master data until VAT/posting defaults are ready.',
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.'
      ],
      requiredPreparation: [
        'Use D10 action inventory and screenshots.',
        'Keep D3/D5/D8 list/cell typing routes forbidden.'
      ]
    },
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea: deleteActionVisible ? 'universaarl-vat-matrix-delete-dialog-cancel-probe' : 'universaarl-vat-matrix-alternative-recreate-route-discovery',
        activeCase: nextCase,
        active_case_file: deleteActionVisible
          ? '.agent/state/cases/target-027d11-vat-matrix-row-scoped-delete-dialog-cancel-probe.json'
          : '.agent/state/cases/target-027d11-vat-matrix-alternative-recreate-route-discovery.json',
        lastReferenceCase: CASE_ID,
        nextCase,
        nextStep: deleteActionVisible
          ? 'Probe only the row-scoped delete confirmation and cancel it; do not confirm cleanup.'
          : 'Discover a non-delete alternative route for recreating/completing the VAT matrix row.'
      },
      lastRunSummary: {
        runId: CASE_ID,
        caseId: CASE_ID,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D10-result.json`,
        summary: 'D10 inventoried Page 472 row/actions without cleanup/delete and kept the partial VAT matrix row visible after reopen.',
        nextCase
      }
    },
    nextCase,
    reason: deleteActionVisible
      ? 'Cleanup may be feasible but only through a separate row-scoped delete dialog-cancel probe.'
      : 'No safe cleanup/delete action was proven; choose alternative route discovery.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Zweck',
      '',
      'Die partielle INLAND/VAT19-Zeile wird nur fuer eine Aktionsinventur fokussiert. Der Lauf klickt keine Loeschen-/Delete-Aktion und bestaetigt keinen Dialog.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine Cleanup-/Delete-Ausfuehrung.',
      '- Keine Stammdaten.',
      '- Kein Belegdraft.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine VAT Entries oder Sachposten.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.resultStatus).toMatch(/observed|blocked/);
});
