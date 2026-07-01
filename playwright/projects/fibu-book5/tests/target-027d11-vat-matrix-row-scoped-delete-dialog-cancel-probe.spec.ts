import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D11-VAT-MATRIX-ROW-SCOPED-DELETE-DIALOG-CANCEL-PROBE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d11-vat-matrix-row-scoped-delete-dialog-cancel-probe';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D11-result.json');

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
  source?: string;
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
        /Weitere Optionen|Loeschen|Loschen|Delete|Abbrechen|Nein|No|Cancel|Moechten Sie|Mochten Sie|Do you want|Nicht gespeichert|Fehler/i
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
    visibleLearning: 'Das Bild muss Zielzeile, Delete-Dialog oder Reopen-Zustand sichtbar machen.',
    internallyProves: 'Universaarl Page-472 row-scoped delete-dialog-cancel evidence.',
    doesNotProve: ['No cleanup delete confirmed', 'No final VAT correctness', 'No Preview Posting', 'No Posting'],
    ...extra
  });
  return text;
}

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
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

async function focusTargetRow(page: Page) {
  const row = await locateTargetRow(page);
  if (!row) return null;
  await page.mouse.click(row.x + Math.min(20, Math.max(5, Math.floor(row.width / 4))), row.y + Math.min(18, Math.max(5, Math.floor(row.height / 2))));
  await page.waitForTimeout(800);
  return row;
}

async function findVisibleDeleteAction(page: Page) {
  const deletePattern = /L(?:oe|o|\u00C3\u00B6|\u00F6|\?)schen|Delete|Entfernen|Remove/i;
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const candidate = frame.getByRole(role, { name: deletePattern }).first();
      if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
        const box = await candidate.boundingBox().catch(() => null);
        return { locator: candidate, entry: { role, box, source: 'role' } };
      }
    }
    const text = frame.getByText(deletePattern).first();
    if (await text.isVisible({ timeout: 700 }).catch(() => false)) {
      const box = await text.boundingBox().catch(() => null);
      return { locator: text, entry: { role: 'text', box, source: 'text' } };
    }
  }
  return null;
}

async function openMoreOptions(page: Page) {
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const candidate = frame.getByRole(role, { name: /Weitere Optionen|More options/i }).first();
      if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
        await candidate.click({ timeout: 4000 }).catch(async () => candidate.click({ timeout: 4000, force: true }));
        await page.waitForTimeout(1200);
        return { clicked: true, by: role };
      }
    }
  }
  return { clicked: false, by: 'not-found' };
}

async function getVisibleDialogText(page: Page) {
  for (const frame of page.frames()) {
    const dialog = frame.locator('[role="dialog"], .ms-Dialog-main, .modal-dialog').first();
    if (await dialog.isVisible({ timeout: 1200 }).catch(() => false)) {
      const text = clean(await dialog.innerText().catch(() => ''));
      return { visible: true, text };
    }
  }
  return { visible: false, text: '' };
}

async function cancelVisibleDialog(page: Page) {
  const safeCancelPattern = /Abbrechen|Cancel|Nein|No|Schliessen|Close|Esc/i;
  const forbiddenConfirmPattern = /^(OK|Ja|Yes)$/i;
  for (const frame of page.frames()) {
    const dialog = frame.locator('[role="dialog"], .ms-Dialog-main, .modal-dialog').first();
    if (!(await dialog.isVisible({ timeout: 700 }).catch(() => false))) continue;
    for (const role of ['button', 'menuitem'] as const) {
      const buttons = await dialog.getByRole(role).all().catch(() => []);
      for (const button of buttons) {
        const name = clean(await button.innerText().catch(() => ''));
        if (forbiddenConfirmPattern.test(name)) continue;
        if (safeCancelPattern.test(name) && (await button.isVisible().catch(() => false))) {
          await button.click({ timeout: 4000 }).catch(async () => button.click({ timeout: 4000, force: true }));
          await page.waitForTimeout(1200);
          return { cancelled: true, by: role, label: name };
        }
      }
    }
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  return { cancelled: true, by: 'keyboard', label: 'Escape' };
}

test('TARGET-027D11 opens row-scoped delete dialog and cancels it', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openMatrix(page);
  actionsTaken.push('Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix in playthru / UNIVERSAARL-DE.');
  const beforeText = await capture(page, 'target-027d11-010-before-delete-dialog-probe', 'Before row-scoped delete-dialog probe.', {
    status: 'before-delete-dialog-probe'
  });
  if (!/\bINLAND\b/i.test(beforeText) || !/\bVAT19\b/i.test(beforeText)) {
    blockedBy.push('INLAND/VAT19 partial row is not visible before delete-dialog probe.');
  }

  const row = await focusTargetRow(page);
  if (!row) blockedBy.push('Could not focus a visible row containing both INLAND and VAT19.');
  await capture(page, 'target-027d11-020-after-row-focus', 'After focusing the INLAND/VAT19 row before delete probe.', {
    status: 'after-row-focus',
    row
  });

  const moreOptions = await openMoreOptions(page);
  actionsTaken.push(`Opened Weitere Optionen / More options: ${moreOptions.clicked ? moreOptions.by : 'not-found'}.`);
  const deleteAction = await findVisibleDeleteAction(page);
  if (!deleteAction) {
    blockedBy.push('No visible row/menu delete action found after row focus and More Options.');
  }
  await capture(page, 'target-027d11-030-before-delete-click', 'Visible delete action context before clicking.', {
    status: 'before-delete-click',
    moreOptions,
    deleteAction: deleteAction?.entry ?? null
  });

  let dialog = { visible: false, text: '' };
  let cancelResult = { cancelled: false, by: 'not-run', label: 'not-run' };
  if (deleteAction && blockedBy.length === 0) {
    await deleteAction.locator.click({ timeout: 4000 }).catch(async () => deleteAction.locator.click({ timeout: 4000, force: true }));
    actionsTaken.push('Clicked the visible row-scoped delete action only to probe for a confirmation dialog.');
    await page.waitForTimeout(1500);
    dialog = await getVisibleDialogText(page);
    await capture(page, 'target-027d11-040-after-delete-click-dialog-state', 'After delete click, capture dialog state before any cancel.', {
      status: dialog.visible ? 'dialog-visible' : 'dialog-not-visible',
      dialogText: dialog.text
    });
    if (dialog.visible) {
      cancelResult = await cancelVisibleDialog(page);
      actionsTaken.push(`Cancelled/closed the visible dialog with ${cancelResult.by}: ${cancelResult.label}.`);
    } else {
      warnings.push('Delete action did not expose a visible dialog within the wait window; Escape was pressed defensively.');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1200);
      cancelResult = { cancelled: true, by: 'keyboard', label: 'Escape-after-no-dialog' };
    }
  }

  await openMatrix(page);
  const reopenText = await capture(page, 'target-027d11-050-reopen-after-cancel-proof', 'Reopen proof after dialog cancel/close.', {
    status: 'reopen-after-cancel-proof',
    dialog,
    cancelResult
  });
  const rowStillVisible = /\bINLAND\b/i.test(reopenText) && /\bVAT19\b/i.test(reopenText);
  if (!rowStillVisible) {
    blockedBy.push('After reopen the INLAND/VAT19 row is not visible; possible cleanup side effect must be reviewed.');
  }

  const resultStatus = blockedBy.length
    ? 'blocked-delete-dialog-cancel-probe'
    : dialog.visible
      ? 'observed-delete-dialog-cancelled'
      : 'observed-delete-action-no-dialog-row-still-visible';
  const cleanupDeleteExecuted = !rowStillVisible;
  const nextCase = dialog.visible && rowStillVisible
    ? 'TARGET-027D12-VAT-MATRIX-CONTROLLED-CLEANUP-DECISION'
    : 'TARGET-027D12-VAT-MATRIX-ALTERNATIVE-RECREATE-ROUTE-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-delete-dialog-cancel-probe',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    row,
    moreOptions,
    dialog,
    cancelResult,
    rowStillVisible,
    cleanupDeleteExecuted,
    actionsTaken,
    actionsNotTaken: [
      'No delete confirmation accepted',
      'No OK/Ja/Yes clicked',
      'No intentional cleanup/delete execution',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No Company switch',
      'No VAT final claim'
    ],
    setupChanged: cleanupDeleteExecuted,
    setupChangeAttempted: true,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 472 and the INLAND/VAT19 partial row were visible before the delete-dialog probe.',
      dialog.visible
        ? 'The visible delete action opens a confirmation dialog that can be captured.'
        : 'The visible delete action did not expose a dialog in the observed wait window.',
      cancelResult.cancelled
        ? `The dialog/probe was closed without OK/Ja/Yes by ${cancelResult.by}.`
        : 'No safe cancel route was proven.',
      rowStillVisible
        ? 'The INLAND/VAT19 row is still visible after reopen; no cleanup effect is proven.'
        : 'The INLAND/VAT19 row is not visible after reopen; this is a blocker and possible side effect.'
    ],
    notProved: [
      'No complete VAT Posting Setup row.',
      'No controlled cleanup execution.',
      'No corrected recreate route.',
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval.'
    ],
    screenshots: [
      'target-027d11-010-before-delete-dialog-probe.png',
      'target-027d11-020-after-row-focus.png',
      'target-027d11-030-before-delete-click.png',
      'target-027d11-040-after-delete-click-dialog-state.png',
      'target-027d11-050-reopen-after-cancel-proof.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D11-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D11-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`
    ],
    blockedBy,
    warnings,
    flags: {
      noDialogConfirm: true,
      noOkJaYes: true,
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
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'D10 found visible row-scoped delete actions without clicking delete.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The VAT matrix partial row blocks Foundation; D11 is the narrowest proof of whether delete is guarded by a cancellable dialog.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: rowStillVisible ? 'ready-next' : 'blocked',
          reason: rowStillVisible
            ? 'The row survived the probe; the next case can decide controlled cleanup versus alternative recreate.'
            : 'Row visibility changed; stop for blocker review before any further setup work.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'VAT matrix row remains incomplete or cleanup/recreate is unresolved.'
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
        `Select ${nextCase} based on D11 dialog-cancel evidence.`
      ],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: rowStillVisible
        ? 'D11 proves the delete action can be probed safely without confirming deletion; a separate decision can now choose cleanup or alternative recreate.'
        : 'A possible setup side effect requires blocker review before further setup.',
      risksBeforeNextCase: [
        'Do not confirm delete without a separate controlled cleanup case.',
        'Do not create master data until VAT/posting defaults are ready.',
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.'
      ],
      requiredPreparation: [
        'Use D11 dialog/reopen screenshots.',
        'Keep D3/D5/D8 list/cell typing routes forbidden.'
      ]
    },
    safeToFinalizeState: rowStillVisible,
    requiresReview: !rowStillVisible,
    statePatch: rowStillVisible ? {
      current: {
        activeArea: 'universaarl-vat-matrix-cleanup-or-recreate-decision',
        activeCase: nextCase,
        active_case_file: '.agent/state/cases/target-027d12-vat-matrix-controlled-cleanup-decision.json',
        lastReferenceCase: CASE_ID,
        nextCase,
        nextStep: 'Decide whether a separate controlled cleanup case is justified or whether an alternative recreate route is safer.'
      },
      lastRunSummary: {
        runId: CASE_ID,
        caseId: CASE_ID,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D11-result.json`,
        summary: 'D11 probed the row-scoped delete action and cancelled/closed it without confirming deletion; the row remains visible after reopen.',
        nextCase
      }
    } : {},
    nextCase,
    reason: rowStillVisible
      ? 'Delete can be treated as a guarded route candidate because the row still exists after cancel/close proof.'
      : 'Stop for blocker review because the row is not visible after the probe.'
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
      'Die partielle INLAND/VAT19-Zeile wird fokussiert. Die sichtbare Delete-Aktion wird nur genutzt, um den Sicherheitsdialog zu pruefen. Der Dialog wird nicht bestaetigt.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Kein OK, Ja oder Yes.',
      '- Keine absichtliche Cleanup-/Delete-Ausfuehrung.',
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
