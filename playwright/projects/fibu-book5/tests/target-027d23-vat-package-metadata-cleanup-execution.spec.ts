import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D23-VAT-PACKAGE-METADATA-CLEANUP-EXECUTION';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PACKAGE_CODE = 'U-VAT325-DISC';
const EVIDENCE_ID = 'target-027d23-vat-package-metadata-cleanup-execution';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D23-result.json');

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
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|originAuthority|startTraceId|parentPageOrigin|upn/i.test(line))
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

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i,
    '/{tenant}'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function configPackagesVisible(text: string) {
  return /Configuration Packages|Config\. Packages|Konfigurationspakete|Konfigurationspaket|RapidStart/i.test(text);
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

async function configText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Configuration Packages|Config\. Packages|Konfigurationspakete|Konfigurationspaket|RapidStart/i,
        /U-VAT325-DISC|VAT 325 Discovery|Code|Package Name|Paketname|Paketcode/i,
        /Neu|New|Loeschen|Loschen|Delete|Import|Export|Validate|Apply|Anwenden|Excel|Tabellen abrufen|Get Tables/i,
        /Fortfahren|Ja|Nein|Yes|No|Cancel|Abbrechen|Fehler|Error/i
      ],
      maxLines: 420,
      maxLineLength: 320
    })
  );
}

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
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
    page: 'Page 8615 Configuration Packages / Konfigurationspakete',
    ...metadata
  });
}

async function capture(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await configText(page);
  await writeText(`${prefix}.txt`, text || 'No compact Configuration Packages text captured.');
  await screenshot(page, `${prefix}.png`, {
    step,
    visibleLearning: 'Das Bild zeigt den Konfigurationspaket-Kontext, die exakte Zielzeile, den Loeschdialog oder den Reopen-Zustand.',
    internallyProves: 'Exact-code cleanup context in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['VAT correctness', 'Posting Groups readiness', 'Preview Posting readiness', 'VAT Entries', 'G/L Entries'],
    ...extra
  });
  return text;
}

async function openConfigPackages(page: Page) {
  await page.goto(buildPlaythruUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertContext(page);
  await dismissTeachingTip(page);
  const text = await visibleText(page);
  if (!configPackagesVisible(text)) throw new Error('Configuration Packages context is not visible.');
}

async function dismissTeachingTip(page: Page) {
  for (const frame of page.frames()) {
    const dismissed = await frame
      .evaluate(() => {
        const cards = [...document.querySelectorAll<HTMLElement>('[role="dialog"], .ms-TeachingBubble, .ms-Callout, .ms-Dialog-main')];
        for (const card of cards) {
          const text = (card.innerText || card.textContent || '').replace(/\s+/g, ' ').trim();
          if (!/Info .* Konfigurationspakete|Tour starten|Teaching|Hilfe anzeigen/i.test(text)) continue;
          const close = [...card.querySelectorAll<HTMLElement>('button,[role="button"],i,span')]
            .find((element) => /Close|Dismiss|Abbrechen/i.test(`${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''} ${element.innerText || ''}`));
          if (close) {
            close.click();
            return true;
          }
          const rect = card.getBoundingClientRect();
          const target = document.elementFromPoint(rect.right - 24, rect.top + 24) as HTMLElement | null;
          target?.click();
          return true;
        }
        return false;
      })
      .catch(() => false);
    if (dismissed) {
      await page.waitForTimeout(800);
      return true;
    }
  }
  return false;
}

async function locateExactPackageRow(page: Page) {
  const matches: UiEntry[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((packageCode) => {
        return [...document.querySelectorAll<HTMLElement>('[role="row"],tr,div,a,span')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const style = window.getComputedStyle(element);
            if (
              !text.includes(packageCode) ||
              rect.width <= 10 ||
              rect.height <= 10 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              rect.width > window.innerWidth * 0.95 ||
              text.length > 260
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
              height: Math.round(rect.height),
              source: 'exact-package-code-visible-element'
            };
          })
          .filter(Boolean)
          .sort((left, right) => (left!.width - right!.width) || (left!.height - right!.height));
      }, PACKAGE_CODE)
      .catch(() => []);
    matches.push(...(entries as UiEntry[]));
  }
  const rowLike = matches.filter((entry) => /row|tr/i.test(entry.role) || entry.text.includes('VAT 325 Discovery'));
  const exactRows = rowLike.filter((entry) => /row|tr/i.test(entry.role));
  const selected = rowLike[0] ?? matches[0] ?? null;
  return { selected, matches, exactRows };
}

async function clickPackageRow(page: Page, row: UiEntry | null) {
  if (!row) return false;
  await page.mouse.click(row.x + Math.min(24, Math.max(6, Math.floor(row.width / 4))), row.y + Math.min(18, Math.max(6, Math.floor(row.height / 2))));
  await page.waitForTimeout(900);
  return true;
}

async function findDeleteAction(page: Page) {
  const deletePattern = /L(?:\u00f6|oe|o)schen|Delete|Entfernen|Remove/i;
  for (const frame of page.frames()) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const candidate = frame.getByRole(role, { name: deletePattern }).first();
      if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
        const box = await candidate.boundingBox().catch(() => null);
        return { locator: candidate, entry: { role, box, source: 'role' } };
      }
    }
  }
  return null;
}

async function findDeleteMenuAction(page: Page) {
  const deletePattern = /L(?:\u00f6|oe|o)schen|Delete|Entfernen|Remove/i;
  for (const frame of page.frames()) {
    const candidate = frame.getByRole('menuitem', { name: deletePattern }).first();
    if (await candidate.isVisible({ timeout: 700 }).catch(() => false)) {
      const box = await candidate.boundingBox().catch(() => null);
      return { locator: candidate, entry: { role: 'menuitem', box, source: 'row-inline-menu' } };
    }
  }
  return null;
}

async function openRowInlineMenu(page: Page, row: UiEntry | null) {
  if (!row) return { clicked: false, by: 'missing-row' };
  await page.mouse.click(row.x + 206, row.y + Math.min(18, Math.max(6, Math.floor(row.height / 2))));
  await page.waitForTimeout(1000);
  return { clicked: true, by: 'row-inline-ellipsis-coordinate' };
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
    const dialogs = await frame.locator('[role="dialog"], .ms-Dialog-main, .modal-dialog').all().catch(() => []);
    for (const dialog of dialogs) {
      if (!(await dialog.isVisible({ timeout: 300 }).catch(() => false))) continue;
      const text = clean(await dialog.innerText().catch(() => ''));
      if (/Fortfahren und l(?:\u00f6|oe|o)schen\?|Delete|remove/i.test(text)) {
        return { visible: true, text };
      }
    }
  }
  return { visible: false, text: '' };
}

async function confirmExpectedDeleteDialog(page: Page) {
  for (const frame of page.frames()) {
    const dialogs = await frame.locator('[role="dialog"], .ms-Dialog-main, .modal-dialog').all().catch(() => []);
    for (const dialog of dialogs) {
    if (!(await dialog.isVisible({ timeout: 700 }).catch(() => false))) continue;
    const text = clean(await dialog.innerText().catch(() => ''));
    if (!/Fortfahren und l(?:\u00f6|oe|o)schen\?|Delete|remove/i.test(text)) {
      continue;
    }
    for (const role of ['button', 'menuitem'] as const) {
      const buttons = await dialog.getByRole(role).all().catch(() => []);
      for (const button of buttons) {
        const label = clean(await button.innerText().catch(() => ''));
        if (/^Ja$|^Yes$|^OK$/i.test(label) && (await button.isVisible().catch(() => false))) {
          await button.click({ timeout: 4000 }).catch(async () => button.click({ timeout: 4000, force: true }));
          await page.waitForTimeout(1800);
          return { confirmed: true, by: role, label };
        }
      }
    }
    return { confirmed: false, by: 'missing-confirm-button', label: text };
    }
  }
  return { confirmed: false, by: 'dialog-not-visible', label: 'no-dialog' };
}

test(`${CASE_ID}: exact-code cleanup of temporary package metadata`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let row: UiEntry | null = null;
  let exactMatches: UiEntry[] = [];
  let exactRows: UiEntry[] = [];
  let deleteAction: Awaited<ReturnType<typeof findDeleteAction>> = null;
  let moreOptions = { clicked: false, by: 'not-run' };
  let rowInlineMenu = { clicked: false, by: 'not-run' };
  let dialog = { visible: false, text: '' };
  let confirmResult = { confirmed: false, by: 'not-run', label: 'not-run' };

  try {
    await openConfigPackages(page);
    actionsTaken.push('Opened Page 8615 Configuration Packages directly in playthru / UNIVERSAARL-DE.');
    const beforeText = await capture(page, 'target-027d23-010-before-cleanup', 'Before exact-code package cleanup.', {
      status: 'before-cleanup',
      packageCode: PACKAGE_CODE
    });

    const located = await locateExactPackageRow(page);
    row = located.selected;
    exactMatches = located.matches;
    exactRows = located.exactRows;
    if (!beforeText.includes(PACKAGE_CODE) || !row) {
      blockedBy.push('Exact package code U-VAT325-DISC is not visible; cleanup not attempted.');
    } else if (exactRows.length !== 1) {
      blockedBy.push(`Exact package-code row count is ${exactRows.length}; cleanup target is ambiguous.`);
    } else {
      await clickPackageRow(page, row);
      actionsTaken.push('Focused the visible exact-code package row U-VAT325-DISC.');
    }

    await capture(page, 'target-027d23-020-after-target-row-focus', 'After focusing exact-code package row.', {
      status: 'target-row-focused',
      row,
      exactMatchCount: exactMatches.length,
      exactRowCount: exactRows.length
    });

    if (!blockedBy.length) {
      deleteAction = await findDeleteAction(page);
      if (!deleteAction) {
        moreOptions = await openMoreOptions(page);
        deleteAction = await findDeleteAction(page);
      }
      if (!deleteAction) {
        blockedBy.push('No delete action was visible after exact package row focus.');
      }
    }

    await capture(page, 'target-027d23-030-before-delete-click', 'Before exact-code delete click.', {
      status: deleteAction ? 'delete-action-visible' : 'delete-action-not-visible',
      moreOptions,
      deleteAction: deleteAction?.entry ?? null
    });

    if (!blockedBy.length && deleteAction) {
      await deleteAction.locator.click({ timeout: 4000 }).catch(async () => deleteAction?.locator.click({ timeout: 4000, force: true }));
      actionsTaken.push('Clicked Delete only after exact package code was visible and focused.');
      await page.waitForTimeout(1500);
      dialog = await getVisibleDialogText(page);
      if (!dialog.visible) {
        rowInlineMenu = await openRowInlineMenu(page, row);
        deleteAction = await findDeleteMenuAction(page);
        if (deleteAction) {
          await deleteAction.locator.click({ timeout: 4000 }).catch(async () => deleteAction?.locator.click({ timeout: 4000, force: true }));
          actionsTaken.push('Clicked row-inline Delete only after exact package code was visible and focused.');
          await page.waitForTimeout(1500);
          dialog = await getVisibleDialogText(page);
        }
      }
      await capture(page, 'target-027d23-040-delete-dialog', 'Delete confirmation dialog before confirmation.', {
        status: dialog.visible ? 'dialog-visible' : 'dialog-not-visible',
        dialog,
        rowInlineMenu,
        deleteAction: deleteAction?.entry ?? null
      });
      if (!dialog.visible) {
        blockedBy.push('Delete click did not expose a visible confirmation dialog.');
      } else {
        confirmResult = await confirmExpectedDeleteDialog(page);
        if (!confirmResult.confirmed) {
          blockedBy.push(`Expected delete dialog was not confirmed: ${confirmResult.by} / ${confirmResult.label}`);
        } else {
          actionsTaken.push(`Confirmed expected delete dialog with ${confirmResult.by}: ${confirmResult.label}.`);
        }
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  await openConfigPackages(page);
  const reopenText = await capture(page, 'target-027d23-050-reopen-proof', 'Reopen proof after exact-code cleanup attempt.', {
    status: 'reopen-after-cleanup-attempt',
    dialog,
    confirmResult
  });
  const packageStillVisible = reopenText.includes(PACKAGE_CODE);
  const cleanupDeleteExecuted = confirmResult.confirmed && !packageStillVisible;
  if (confirmResult.confirmed && packageStillVisible) {
    blockedBy.push('U-VAT325-DISC is still visible after confirmed delete and reopen.');
  }

  const resultStatus = cleanupDeleteExecuted
    ? 'observed-package-metadata-cleaned'
    : blockedBy.length
      ? 'blocked-package-metadata-cleanup'
      : 'observed-package-metadata-already-absent';
  const nextCase = cleanupDeleteExecuted || (!packageStillVisible && !blockedBy.length)
    ? 'TARGET-027D24-VAT-MATRIX-ALTERNATIVE-STANDARD-ROUTE-DECISION'
    : 'TARGET-027D23B-VAT-PACKAGE-METADATA-CLEANUP-BLOCKER-REVIEW';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-exact-code-package-metadata-cleanup',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Configuration Packages / Konfigurationspakete',
    sanitizedUrl: sanitizeEvidenceUrl(page.url()),
    packageCode: PACKAGE_CODE,
    row,
    exactMatchCount: exactMatches.length,
    exactRowCount: exactRows.length,
    dialog,
    confirmResult,
    packageStillVisible,
    cleanupDeleteExecuted,
    actionsTaken,
    actionsNotTaken: [
      'No New action',
      'No Get Tables / Tabellen abrufen',
      'No package import',
      'No package export',
      'No package validation',
      'No package apply',
      'No Edit in Excel publish',
      'No INLAND/VAT19 typing',
      'No 19/3806/1406 typing',
      'No VAT matrix value write',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No book change'
    ],
    setupChanged: cleanupDeleteExecuted,
    setupChangeAttempted: true,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    bookChanged: false,
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      row ? 'The exact package code U-VAT325-DISC was visible before cleanup.' : 'The exact package code U-VAT325-DISC was not visible before cleanup.',
      confirmResult.confirmed
        ? 'The expected delete dialog was confirmed only after exact-code targeting.'
        : 'No delete confirmation was executed.',
      cleanupDeleteExecuted
        ? 'U-VAT325-DISC is absent after reopening Configuration Packages.'
        : 'U-VAT325-DISC absence after cleanup is not proven.'
    ],
    notProved: [
      'No Table 325 / VAT Posting Setup package line.',
      'No correct INLAND/VAT19 VAT Posting Setup matrix row.',
      'No German VAT correctness.',
      'No Posting Groups readiness.',
      'No master data readiness.',
      'No Preview Posting, VAT Entries or G/L Entries.'
    ],
    screenshots: [
      'target-027d23-010-before-cleanup.png',
      'target-027d23-020-after-target-row-focus.png',
      'target-027d23-030-before-delete-click.png',
      'target-027d23-040-delete-dialog.png',
      'target-027d23-050-reopen-proof.png'
    ],
    blockedBy,
    warnings,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'D22 selected exact-code cleanup after D21 package metadata blocker.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Cleanup removes or reviews the temporary package metadata before another VAT setup route.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027D24-VAT-MATRIX-ALTERNATIVE-STANDARD-ROUTE-DECISION',
          status: cleanupDeleteExecuted || (!packageStillVisible && !blockedBy.length) ? 'ready-next' : 'blocked',
          reason: cleanupDeleteExecuted
            ? 'Temporary package metadata is absent after reopen; a fresh VAT route decision can run.'
            : 'Cleanup did not prove absence, so review is needed first.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting Groups still depend on VAT matrix route decision or documented park decision.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data remains locked until VAT/posting defaults are safe enough.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness cannot be claimed while VAT matrix and Posting Groups remain unresolved.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: cleanupDeleteExecuted
        ? 'The temporary package metadata is gone; the next useful step is a fresh route decision rather than another package click.'
        : 'Cleanup ambiguity remains; review the blocker before any further setup action.',
      risksBeforeNextCase: [
        'Do not treat cleanup as VAT setup proof.',
        'Do not repeat unsafe package New/Table-ID actions.',
        'Do not create master data until VAT/posting defaults are ready.'
      ],
      requiredPreparation: [
        'Use D23 screenshots and reopen proof.',
        'Choose or park the next VAT matrix route without claiming German VAT correctness.'
      ]
    },
    nextCase,
    safeToFinalizeState: cleanupDeleteExecuted || (!packageStillVisible && !blockedBy.length),
    requiresReview: !cleanupDeleteExecuted && packageStillVisible,
    statePatch: {},
    reason: cleanupDeleteExecuted
      ? 'Exact-code cleanup removed the temporary package metadata.'
      : blockedBy.length
        ? 'Exact-code cleanup blocked before trusted removal proof.'
        : 'Temporary package metadata was already absent.'
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
      'Die temporaeren Konfigurationspaket-Metadaten `U-VAT325-DISC` werden nur ueber den exakten Paketcode bereinigt oder als Blocker dokumentiert.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine neue Paketanlage.',
      '- Kein Tabellen abrufen.',
      '- Kein Import, Export, Validate, Apply oder Edit in Excel.',
      '- Keine USt-Matrixwerte.',
      '- Keine Stammdaten.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Kein finaler deutscher USt-Claim.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.resultStatus).toMatch(/observed|blocked/);
});
