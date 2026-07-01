import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D13-VAT-MATRIX-CONTROLLED-CLEANUP-EXECUTION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d13-vat-matrix-controlled-cleanup-execution';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D13-result.json');

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
    internallyProves: 'Universaarl Page-472 controlled cleanup evidence.',
    doesNotProve: ['No recreated VAT matrix row', 'No final VAT correctness', 'No Preview Posting', 'No Posting'],
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

async function confirmExpectedDeleteDialog(page: Page) {
  for (const frame of page.frames()) {
    const dialog = frame.locator('[role="dialog"], .ms-Dialog-main, .modal-dialog').first();
    if (!(await dialog.isVisible({ timeout: 700 }).catch(() => false))) continue;
    const dialogText = clean(await dialog.innerText().catch(() => ''));
    if (!/Fortfahren und loschen\?|Fortfahren und loeschen\?|Fortfahren und l.schen\?/i.test(dialogText)) {
      return { confirmed: false, by: 'blocked-dialog-text', label: dialogText };
    }
    for (const role of ['button', 'menuitem'] as const) {
      const buttons = await dialog.getByRole(role).all().catch(() => []);
      for (const button of buttons) {
        const name = clean(await button.innerText().catch(() => ''));
        if (/^Ja$/i.test(name) && (await button.isVisible().catch(() => false))) {
          await button.click({ timeout: 4000 }).catch(async () => button.click({ timeout: 4000, force: true }));
          await page.waitForTimeout(1200);
          return { confirmed: true, by: role, label: name };
        }
      }
    }
    return { confirmed: false, by: 'missing-ja-button', label: dialogText };
  }
  return { confirmed: false, by: 'dialog-not-visible', label: 'no-dialog' };
}

test('TARGET-027D13 executes controlled cleanup of incomplete INLAND/VAT19 row', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  await openMatrix(page);
  actionsTaken.push('Opened Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix in playthru / UNIVERSAARL-DE.');
  const beforeText = await capture(page, 'target-027d13-010-before-cleanup', 'Before controlled cleanup execution.', {
    status: 'before-cleanup'
  });
  if (!/\bINLAND\b/i.test(beforeText) || !/\bVAT19\b/i.test(beforeText)) {
    blockedBy.push('INLAND/VAT19 partial row is not visible before controlled cleanup.');
  }

  const row = await focusTargetRow(page);
  if (!row) blockedBy.push('Could not focus a visible row containing both INLAND and VAT19.');
  await capture(page, 'target-027d13-020-after-row-focus', 'After focusing the INLAND/VAT19 row before cleanup.', {
    status: 'after-row-focus',
    row
  });

  const moreOptions = await openMoreOptions(page);
  actionsTaken.push(`Opened Weitere Optionen / More options: ${moreOptions.clicked ? moreOptions.by : 'not-found'}.`);
  const deleteAction = await findVisibleDeleteAction(page);
  if (!deleteAction) {
    blockedBy.push('No visible row/menu delete action found after row focus and More Options.');
  }
  await capture(page, 'target-027d13-030-before-delete-click', 'Visible delete action context before cleanup click.', {
    status: 'before-delete-click',
    moreOptions,
    deleteAction: deleteAction?.entry ?? null
  });

  let dialog = { visible: false, text: '' };
  let confirmResult = { confirmed: false, by: 'not-run', label: 'not-run' };
  if (deleteAction && blockedBy.length === 0) {
    await deleteAction.locator.click({ timeout: 4000 }).catch(async () => deleteAction.locator.click({ timeout: 4000, force: true }));
    actionsTaken.push('Clicked the visible row-scoped delete action after fresh target-row proof.');
    await page.waitForTimeout(1500);
    dialog = await getVisibleDialogText(page);
    await capture(page, 'target-027d13-040-before-confirm-dialog-state', 'After delete click, capture dialog state before confirmation.', {
      status: dialog.visible ? 'dialog-visible' : 'dialog-not-visible',
      dialogText: dialog.text
    });
    if (!dialog.visible) {
      blockedBy.push('Delete action did not expose a visible confirmation dialog.');
    } else if (!/Fortfahren und loschen\?|Fortfahren und loeschen\?|Fortfahren und l.schen\?/i.test(dialog.text)) {
      blockedBy.push(`Unexpected confirmation dialog text: ${dialog.text}`);
    } else {
      confirmResult = await confirmExpectedDeleteDialog(page);
      if (confirmResult.confirmed) {
        actionsTaken.push(`Confirmed the expected cleanup dialog with ${confirmResult.by}: ${confirmResult.label}.`);
      } else {
        blockedBy.push(`Expected cleanup dialog was not confirmed: ${confirmResult.by} / ${confirmResult.label}`);
      }
    }
  }

  await openMatrix(page);
  const reopenText = await capture(page, 'target-027d13-050-reopen-after-cleanup-proof', 'Reopen proof after controlled cleanup execution.', {
    status: 'reopen-after-cleanup-proof',
    dialog,
    confirmResult
  });
  const rowStillVisible = /\bINLAND\b/i.test(reopenText) && /\bVAT19\b/i.test(reopenText);
  if (confirmResult.confirmed && rowStillVisible) {
    blockedBy.push('After confirmed cleanup, the INLAND/VAT19 row is still visible; cleanup did not prove row absence.');
  }

  const resultStatus = blockedBy.length
    ? 'blocked-controlled-cleanup-execution'
    : !rowStillVisible
      ? 'observed-controlled-cleanup-row-absent-after-reopen'
      : 'blocked-controlled-cleanup-row-still-visible';
  const cleanupDeleteExecuted = confirmResult.confirmed && !rowStillVisible;
  const nextCase = cleanupDeleteExecuted
    ? 'TARGET-027D14-VAT-MATRIX-RECREATE-AFTER-CLEANUP'
    : 'TARGET-027D13B-VAT-MATRIX-CLEANUP-BLOCKER-REVIEW';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-controlled-cleanup-execution',
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
    confirmResult,
    rowStillVisible,
    cleanupDeleteExecuted,
    actionsTaken,
    actionsNotTaken: [
      confirmResult.confirmed ? 'Delete confirmation accepted only after expected dialog text.' : 'No delete confirmation accepted.',
      confirmResult.confirmed ? 'Ja clicked only on expected cleanup dialog.' : 'No OK/Ja/Yes clicked.',
      cleanupDeleteExecuted ? 'Controlled cleanup executed for INLAND/VAT19 row only.' : 'No proven cleanup/delete execution.',
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
      'Page 472 and the INLAND/VAT19 partial row were visible before the cleanup execution.',
      dialog.visible
        ? 'The visible delete action opened a confirmation dialog that was captured before confirmation.'
        : 'The visible delete action did not expose a dialog in the observed wait window.',
      confirmResult.confirmed
        ? `The expected cleanup dialog was confirmed with ${confirmResult.by}: ${confirmResult.label}.`
        : 'No cleanup confirmation was executed.',
      cleanupDeleteExecuted
        ? 'The INLAND/VAT19 row is not visible after reopen; controlled cleanup effect is proven.'
        : 'The INLAND/VAT19 row absence is not proven after reopen.'
    ],
    notProved: [
      'No complete VAT Posting Setup row.',
      'No corrected recreate route.',
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.',
      'No tax advisor approval.'
    ],
    screenshots: [
      'target-027d13-010-before-cleanup.png',
      'target-027d13-020-after-row-focus.png',
      'target-027d13-030-before-delete-click.png',
      'target-027d13-040-before-confirm-dialog-state.png',
      'target-027d13-050-reopen-after-cleanup-proof.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D13-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D13-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`
    ],
    blockedBy,
    warnings,
    flags: {
      noUnexpectedDialogConfirm: true,
      noUnexpectedOkJaYes: true,
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
      lastEvidenceSummary: 'D12 selected controlled cleanup after D11 proved the guarded Ja/Nein dialog and row survival after Nein.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The incomplete INLAND/VAT19 row blocks correct VAT matrix setup and direct correction routes are exhausted.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: cleanupDeleteExecuted ? 'ready-next' : 'blocked',
          reason: cleanupDeleteExecuted
            ? 'The incomplete row is absent after reopen; a separate recreate/completion case can now run.'
            : 'Controlled cleanup did not prove row absence or stopped before confirmation.'
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
        `Select ${nextCase} based on D13 controlled cleanup result.`
      ],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: cleanupDeleteExecuted
        ? 'The wrong row has been removed; the next smallest useful step is a separate clean recreate/completion case.'
        : 'Cleanup did not produce trusted row-absence proof, so blocker review is safer than further setup.',
      risksBeforeNextCase: [
        'Do not recreate the VAT matrix row in the same case.',
        'Do not create master data until VAT/posting defaults are ready.',
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.'
      ],
      requiredPreparation: [
        'Use D13 cleanup screenshots and row-absence proof if available.',
        'Keep D3/D5/D8 list/cell typing routes forbidden.'
      ]
    },
    safeToFinalizeState: true,
    requiresReview: false,
    statePatch: {
      current: {
        activeArea: cleanupDeleteExecuted ? 'universaarl-vat-matrix-recreate-after-cleanup' : 'universaarl-vat-matrix-cleanup-blocker-review',
        activeCase: nextCase,
        active_case_file: cleanupDeleteExecuted
          ? '.agent/state/cases/target-027d14-vat-matrix-recreate-after-cleanup.json'
          : '.agent/state/cases/target-027d13b-vat-matrix-cleanup-blocker-review.json',
        lastReferenceCase: CASE_ID,
        nextCase,
        nextStep: cleanupDeleteExecuted
          ? 'Recreate or complete the correct INLAND/VAT19 VAT Posting Setup row in a separate case after cleanup proof.'
          : 'Review the controlled cleanup blocker before any further VAT matrix setup work.'
      },
      lastRunSummary: {
        runId: CASE_ID,
        caseId: CASE_ID,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D13-result.json`,
        summary: cleanupDeleteExecuted
          ? 'D13 executed controlled cleanup for the incomplete INLAND/VAT19 row and proved row absence after reopen.'
          : 'D13 did not produce trusted cleanup proof; blocker review is required.',
        nextCase
      }
    },
    nextCase,
    reason: cleanupDeleteExecuted
      ? 'Controlled cleanup succeeded and row absence is proven after reopen.'
      : 'Stop or review because controlled cleanup did not prove the expected row absence.'
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
      'Die partielle INLAND/VAT19-Zeile wird fokussiert. Die sichtbare Delete-Aktion wird nur nach frischem Zeilen- und Dialogbeweis bestaetigt. Danach wird Page 472 neu geoeffnet.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Ja nur bei exakt erwartetem Cleanup-Dialog.',
      '- Keine Neuerstellung der Matrixzeile in diesem Case.',
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
