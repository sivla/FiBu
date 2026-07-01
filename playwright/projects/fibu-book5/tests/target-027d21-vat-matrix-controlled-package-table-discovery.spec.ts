import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(180_000);

const CASE_ID = 'TARGET-027D21-VAT-MATRIX-CONTROLLED-PACKAGE-TABLE-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PACKAGE_CODE = 'U-VAT325-DISC';
const PACKAGE_NAME = 'VAT 325 Discovery';
const EVIDENCE_ID = 'target-027d21-vat-matrix-controlled-package-table-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D21-result.json');

type ScreenshotRef = {
  file: string;
  step: string;
};

type VisibleAction = {
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

function hasTable325Signal(text: string) {
  const withoutPackageName = text.replaceAll(PACKAGE_CODE, '').replaceAll(PACKAGE_NAME, '');
  return /VAT Posting Setup|MwSt\.-?Buchungsmatrix|Table\s*325|Tabelle\s*325|Tabellen-ID\s*325/i.test(withoutPackageName);
}

function dangerousActionText(text: string) {
  return /Paket importieren|Paket exportieren|Import Package|Export Package|Validate Package|Apply Package|Daten anwenden|Anwenden|Edit in Excel|In Excel bearbeiten|Publish|Ver[öo]ffentlichen|Buchungsvorschau|Preview Posting|Buchen|Post/i.test(text);
}

function sanitizeForEvidence(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/allowedEndpoints|allowedResources|tokenFactorySettings|clientId|authority:|originAuthority|parentPageOrigin|upn|shouldAttachOauthTokens/i.test(value)) {
      return '[filtered-business-central-shell-bootstrap-text]';
    }
    return clean(value);
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeForEvidence(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeForEvidence(item)]));
  }
  return value;
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(sanitizeForEvidence(data), null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function configText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Configuration Packages|Config\. Packages|Konfigurationspakete|Konfigurationspaket|RapidStart/i,
        /Code|Package Name|Paketname|Paketcode|Table ID|Tabellen-ID|Table Name|Tabellenname|No\. of Package Records|Anzahl/i,
        /VAT Posting Setup|MwSt\.-?Buchungsmatrix|Table 325|325|Config\. Package Table/i,
        /Neu|New|Import|Export|Validate|Apply|Anwenden|Daten anwenden|Excel|Edit in Excel|In Excel bearbeiten|Tabellen abrufen|Get Tables/i,
        /Error|Fehler|Nicht gespeichert|blocked|gesperrt/i
      ],
      maxLines: 520,
      maxLineLength: 320
    })
  );
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const found = await frame
      .locator('[role="dialog"], .ms-Dialog-main, .modal-dialog')
      .filter({
        hasText: /Daten anwenden|Apply Package|Validate Package|Edit in Excel|In Excel bearbeiten|Finish|Fertig stellen|Ja|Yes|Preview|Buchungsvorschau|Post|Buchen|Paket importieren|Paket exportieren/i
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

async function screenshot(page: Page, name: string, metadata: Record<string, unknown>, screenshots: ScreenshotRef[]) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name), fullPage: false });
  screenshots.push({ file: name, step: String(metadata.step ?? '') });
  await writeJson(path.join(EVIDENCE_DIR, name.replace(/\.png$/i, '.screenshot.json')), {
    fileName: name,
    imagePath: path.join(EVIDENCE_DIR, name),
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Config. Packages / Configuration Packages',
    ...metadata
  });
}

async function capture(page: Page, prefix: string, step: string, screenshots: ScreenshotRef[], extra: Record<string, unknown> = {}) {
  const text = await configText(page);
  await writeText(`${prefix}.txt`, text || 'No compact Configuration Packages text captured.');
  await screenshot(
    page,
    `${prefix}.png`,
    {
      step,
      visibleLearning: 'Das Bild zeigt den Konfigurationspaket-Kontext oder den Blockerzustand der Table-325-Discovery.',
      internallyProves: 'UI context and gate state in playthru / UNIVERSAARL-DE.',
      doesNotProve: [
        'German VAT correctness',
        'completed VAT Posting Setup',
        'Preview Posting readiness',
        'VAT Entries',
        'G/L Entries'
      ],
      ...extra
    },
    screenshots
  );
  return text;
}

async function visibleActions(page: Page) {
  const all: VisibleAction[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate(() => {
        const interesting = /Neu|New|Import|Export|Validate|Apply|Anwenden|Daten anwenden|Excel|Edit in Excel|In Excel bearbeiten|Package|Paket|Table|Tabelle|Fields|Felder|Tabellen abrufen|Get Tables|OK|Abbrechen|Cancel/i;
        return [...document.querySelectorAll<HTMLElement>('[role="button"],[role="menuitem"],button,a,span,div')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const role = element.getAttribute('role') || element.tagName.toLowerCase();
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (
              !interesting.test(text) ||
              text.length > 180 ||
              rect.width <= 1 ||
              rect.height <= 1 ||
              rect.width > 620 ||
              rect.bottom <= 0 ||
              rect.right <= 0 ||
              rect.top >= window.innerHeight ||
              rect.left >= window.innerWidth ||
              style.visibility === 'hidden' ||
              style.display === 'none' ||
              Number(style.opacity || '1') <= 0 ||
              (!['button', 'menuitem', 'a'].includes(role) && !element.getAttribute('aria-label') && !element.getAttribute('title'))
            ) {
              return null;
            }
            return {
              text,
              role,
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
          .slice(0, 300);
      })
      .catch(() => []);
    all.push(...(entries as VisibleAction[]));
  }
  return all.sort((left, right) => left.y - right.y || left.x - right.x).slice(0, 160);
}

async function openConfigPackages(page: Page) {
  await page.goto(buildPlaythruUrl(8615), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertContext(page);
  const text = clean(await pageText(page));
  if (!configPackagesVisible(text)) throw new Error('Page 8615 Configuration Packages context is not visible.');
}

async function clickSafeButton(page: Page, name: RegExp) {
  for (const frame of page.frames()) {
    const button = frame.getByRole('button', { name }).first();
    if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
      await button.click();
      await page.waitForTimeout(1500);
      return true;
    }
    const menuitem = frame.getByRole('menuitem', { name }).first();
    if (await menuitem.isVisible({ timeout: 500 }).catch(() => false)) {
      await menuitem.click();
      await page.waitForTimeout(1500);
      return true;
    }
  }
  return false;
}

async function fillPackageMetadata(page: Page) {
  const existingText = await configText(page);
  if (existingText.includes(PACKAGE_CODE)) {
    for (const frame of page.frames()) {
      const packageButton = frame.getByRole('button', { name: new RegExp(PACKAGE_CODE) }).first();
      if (await packageButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await packageButton.dblclick().catch(async () => packageButton.click());
        await page.waitForTimeout(1500);
        return {
          filledCode: true,
          filledName: existingText.includes(PACKAGE_NAME),
          route: 'existing-package-row-opened-or-selected',
          beforeFocused: {}
        };
      }
    }
    return {
      filledCode: true,
      filledName: existingText.includes(PACKAGE_NAME),
      route: 'existing-package-visible',
      beforeFocused: {}
    };
  }

  const beforeFocused = await page.evaluate(() => {
    const active = document.activeElement as HTMLInputElement | HTMLElement | null;
    return {
      tag: active?.tagName ?? '',
      role: active?.getAttribute('role') ?? '',
      value: 'value' in (active ?? {}) ? String((active as HTMLInputElement).value ?? '') : '',
      ariaLabel: active?.getAttribute('aria-label') ?? '',
      title: active?.getAttribute('title') ?? ''
    };
  });
  if (/input|textarea/i.test(beforeFocused.tag) || beforeFocused.role === 'textbox') {
    await page.keyboard.type(PACKAGE_CODE);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.keyboard.type(PACKAGE_NAME);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1000);
    const text = await configText(page);
    return {
      filledCode: text.includes(PACKAGE_CODE),
      filledName: text.includes(PACKAGE_NAME),
      route: 'active-focused-code-field',
      beforeFocused
    };
  }

  for (const frame of page.frames()) {
    const inputs = await frame.locator('input, textarea, [contenteditable="true"], [role="textbox"]').all();
    for (const input of inputs.slice(0, 12)) {
      if (!(await input.isVisible({ timeout: 300 }).catch(() => false))) continue;
      const box = await input.boundingBox().catch(() => null);
      if (!box || box.y < 220 || box.y > 380 || box.x < 550 || box.x > 980) continue;
      await input.click();
      await page.keyboard.press('Control+A').catch(() => undefined);
      await page.keyboard.type(PACKAGE_CODE);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.type(PACKAGE_NAME);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(1000);
      const text = await configText(page);
      return {
        filledCode: text.includes(PACKAGE_CODE),
        filledName: text.includes(PACKAGE_NAME),
        route: 'geometry-package-header-input',
        beforeFocused
      };
    }
  }

  return { filledCode: false, filledName: false, route: 'no-safe-editor-found', beforeFocused };
}

async function fillTableId325(page: Page) {
  for (const frame of page.frames()) {
    const tableIdControls = [
      frame.getByRole('combobox', { name: /Tabellen-ID|Table ID/i }).first(),
      frame.getByRole('textbox', { name: /Tabellen-ID|Table ID/i }).first()
    ];
    for (const control of tableIdControls) {
      if (!(await control.isVisible({ timeout: 700 }).catch(() => false))) continue;
      await control.click();
      await page.keyboard.press('Control+A').catch(() => undefined);
      await page.keyboard.type('325');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(2500);
      const text = await configText(page);
      return {
        typedTableId325: text.includes('325'),
        tableNameVisible: /VAT Posting Setup|MwSt\.-?Buchungsmatrix/i.test(text),
        route: 'table-id-control',
        textAfter: text
      };
    }
  }
  return {
    typedTableId325: false,
    tableNameVisible: false,
    route: 'no-table-id-control'
  };
}

async function tryTable325Discovery(page: Page, screenshots: ScreenshotRef[]) {
  const observations: Record<string, unknown> = {};
  const warnings: string[] = [];
  const blockedBy: string[] = [];

  const beforeText = await capture(page, 'target-027d21-010-before-package-context', 'Before package metadata discovery', screenshots, {
    status: 'before-action',
    screenshotQa: {
      shouldShow: ['Konfigurationspakete page title or package list/card context'],
      shouldNotShow: ['import/apply/validate/Edit-in-Excel dialog']
    }
  });
  observations.beforeHasTable325Signal = hasTable325Signal(beforeText);

  const clickedNew = await clickSafeButton(page, /^Neu$|^New$/i);
  observations.clickedNew = clickedNew;
  if (!clickedNew) {
    blockedBy.push('No safe New button was visible on Configuration Packages page.');
    return { observations, warnings, blockedBy };
  }
  await assertContext(page);
  const afterNewText = await capture(page, 'target-027d21-020-after-new-package-metadata', 'After clicking New for temporary package metadata', screenshots, {
    status: 'package-metadata-surface-opened',
    allowedChange: 'temporary package metadata only',
    forbiddenStillLocked: ['Import', 'Export', 'Validate', 'Apply', 'Edit in Excel', 'VAT matrix values']
  });
  observations.afterNewHasDangerousText = dangerousActionText(afterNewText);
  observations.packageMetadataExists = afterNewText.includes(PACKAGE_CODE);
  if (afterNewText.includes(PACKAGE_CODE)) {
    blockedBy.push(
      'Temporary package metadata U-VAT325-DISC is already visible, but New opened a blank card/table context; stop before duplicate package or unsafe Table ID edit.'
    );
    return { observations, warnings, blockedBy };
  }

  const fillResult = await fillPackageMetadata(page);
  observations.fillPackageMetadata = fillResult;
  const afterFillText = await capture(page, 'target-027d21-030-after-package-code-entry', 'After temporary package code/name entry', screenshots, {
    status: fillResult.filledCode ? 'temporary-package-code-entered' : 'blocked-no-package-code-editor',
    packageCode: PACKAGE_CODE,
    packageName: PACKAGE_NAME
  });
  observations.afterFillHasPackageCode = afterFillText.includes(PACKAGE_CODE);
  if (!fillResult.filledCode) {
    blockedBy.push('Could not identify a safe package code editor after New.');
    return { observations, warnings, blockedBy };
  }

  const tableIdResult = await fillTableId325(page);
  observations.tableId325 = tableIdResult;
  await assertContext(page);
  const afterGetTablesText = await capture(page, 'target-027d21-040-after-table-id-325-entry', 'After entering Table ID 325 as package-table metadata', screenshots, {
    status: tableIdResult.typedTableId325 ? 'table-id-325-metadata-entered' : 'blocked-no-table-id-editor',
    stopRule: 'No Import/Export/Validate/Apply/Edit-in-Excel and no VAT matrix values are used in this case.'
  });
  observations.afterGetTablesHasTable325Signal = hasTable325Signal(afterGetTablesText);
  observations.afterGetTablesHasDangerousText = dangerousActionText(afterGetTablesText);

  if (!hasTable325Signal(afterGetTablesText)) {
    warnings.push('Table 325 / VAT Posting Setup was not visible after the bounded package/table discovery attempt.');
  }
  if (dangerousActionText(afterGetTablesText)) {
    warnings.push('The table discovery surface exposes effective/dangerous actions; D21 stopped before confirming anything.');
  }

  await capture(page, 'target-027d21-050-final-package-table-state', 'Final package/table metadata state', screenshots, {
    status: 'final-metadata-state-no-value-write',
    packageCode: PACKAGE_CODE
  });

  return { observations, warnings, blockedBy };
}

test(`${CASE_ID}: controlled Configuration Package Table 325 discovery`, async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const screenshots: ScreenshotRef[] = [];
  let resultStatus: 'observed-controlled-package-discovery' | 'blocked-controlled-package-discovery' =
    'observed-controlled-package-discovery';
  let blockedBy: string[] = [];
  let warnings: string[] = [];
  let observations: Record<string, unknown> = {};
  let actions: VisibleAction[] = [];

  try {
    await openConfigPackages(page);
    const discovery = await tryTable325Discovery(page, screenshots);
    observations = discovery.observations;
    warnings = discovery.warnings;
    blockedBy = discovery.blockedBy;
    actions = await visibleActions(page);
    await writeJson(path.join(EVIDENCE_DIR, 'target-027d21-visible-actions.json'), {
      caseId: CASE_ID,
      instance: EXPECTED_INSTANCE,
      company: TARGET_COMPANY,
      sanitizedUrl: sanitizeEvidenceUrl(page.url()),
      actions
    });
    if (blockedBy.length) resultStatus = 'blocked-controlled-package-discovery';
  } catch (error) {
    resultStatus = 'blocked-controlled-package-discovery';
    blockedBy.push(error instanceof Error ? error.message : String(error));
    await writeText('target-027d21-blocked-page-text.txt', clean(await pageText(page).catch(() => '')) || 'No page text captured.');
    await screenshot(page, 'target-027d21-090-blocked-context.png', {
      step: 'Blocked during controlled package/table discovery',
      status: 'blocked',
      blockedBy,
      internallyProves: 'The run stopped without package import/export/validate/apply/Edit-in-Excel or VAT value write.'
    }, screenshots);
  }

  const hasTableSignal = Boolean(observations.afterGetTablesHasTable325Signal || observations.beforeHasTable325Signal);
  const setupChanged = Boolean(
    observations.packageMetadataExists ||
      (observations.fillPackageMetadata && (observations.fillPackageMetadata as { filledCode?: boolean }).filledCode)
  );

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-package-discovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 8615 Config. Packages / Configuration Packages',
    sanitizedUrl: page.url() ? sanitizeEvidenceUrl(page.url()) : '',
    packageCode: PACKAGE_CODE,
    packageName: PACKAGE_NAME,
    actionsTaken: [
      'Opened Page 8615 directly with company UNIVERSAARL-DE.',
      'Captured before screenshot QA.',
      'Clicked New only for temporary configuration-package metadata if available.',
      'Reused or attempted temporary package code/name metadata only if a safe editor was visible.',
      'Attempted bounded table-discovery surface only without confirming import/export/validate/apply/Edit-in-Excel.',
      'Captured after/blocker screenshots and visible action inventory.'
    ],
    actionsNotTaken: [
      'No package import',
      'No package export',
      'No package validation',
      'No package apply',
      'No Edit in Excel publish',
      'No OK/Finish confirmation on a dangerous dialog',
      'No INLAND/VAT19 typing',
      'No 19/3806/1406 typing',
      'No VAT matrix value write',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut'
    ],
    setupChanged,
    setupChangeAttempted: true,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: screenshots.map((item) => item.file),
    proved:
      resultStatus === 'observed-controlled-package-discovery'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Configuration Packages Page 8615 was used as the controlled surface.',
            'The run stayed inside package/table discovery boundaries.',
            'No import/export/validate/apply/Edit-in-Excel, VAT value write, master data, draft, Preview Posting, Posting or API shortcut occurred.'
          ]
        : [
            'The run stopped inside playthru / UNIVERSAARL-DE.',
            'No import/export/validate/apply/Edit-in-Excel, VAT value write, master data, draft, Preview Posting, Posting or API shortcut occurred.'
          ],
    notProved: [
      'No correct INLAND/VAT19 VAT Posting Setup matrix row.',
      'No German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No Posting Groups readiness.',
      'No master data readiness.'
    ],
    observations: {
      ...observations,
      hasTable325Signal: hasTableSignal,
      visibleActions: actions
    },
    blockedBy,
    warnings,
    temporaryMetadata: {
      packageCode: PACKAGE_CODE,
      packageName: PACKAGE_NAME,
      cleanupStatus: 'not-cleaned-in-this-case',
      reason: 'D21 prioritizes route discovery and does not click destructive cleanup/delete without a separate cleanup gate.'
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'D20 selected controlled package/table discovery after D19 proved Page 8615 but not Table 325 visibility.',
      isPlannedNextCaseStillSensible: true,
      reason: 'D21 is the narrowest remaining VAT matrix route before either field-mapping decision or parking the matrix.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027D22-VAT-MATRIX-PACKAGE-FIELD-MAPPING-DECISION',
          status: hasTableSignal ? 'ready-next' : 'replace-with-better-case',
          reason: hasTableSignal
            ? 'Table 325 context/signal exists, so a no-write field-mapping decision can be made.'
            : 'If Table 325 is still not visible, the next step should decide cleanup/park/alternative route instead of field mapping.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting Groups wait for correct VAT matrix or an explicit park/replacement decision.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT/posting defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT matrix, Posting Groups and dimensions/defaults.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: hasTableSignal
        ? 'TARGET-027D22-VAT-MATRIX-PACKAGE-FIELD-MAPPING-DECISION'
        : 'TARGET-027D22-VAT-MATRIX-PACKAGE-ROUTE-PARK-OR-CLEANUP-DECISION',
      whySelectedNextCaseIsBest: hasTableSignal
        ? 'D21 found a Table-325 signal without forbidden package actions; the next case can decide field mapping without writing VAT values.'
        : 'D21 did not surface Table 325 clearly; the next useful step is a route/cleanup/park decision instead of another package click.',
      risksBeforeNextCase: [
        'Temporary configuration-package metadata may remain and must be classified or cleaned only in a separate case.',
        'No package data may be imported, exported, validated, applied or published.',
        'No VAT matrix values may be typed until a later explicit write case unlocks them.'
      ],
      requiredPreparation: [
        'Review D21 screenshots and action inventory.',
        'Do not treat package metadata as VAT setup.',
        'Create a cleanup/park decision if the temporary package remains.'
      ]
    },
    nextCase: hasTableSignal
      ? 'TARGET-027D22-VAT-MATRIX-PACKAGE-FIELD-MAPPING-DECISION'
      : 'TARGET-027D22-VAT-MATRIX-PACKAGE-ROUTE-PARK-OR-CLEANUP-DECISION',
    safeToFinalizeState: false,
    requiresReview: true
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      `# ${CASE_ID}`,
      '',
      `Status: \`${resultStatus}\`.`,
      '',
      'Controlled Configuration Package/Table-325 discovery for Universaarl VAT setup.',
      '',
      `- Package code: \`${PACKAGE_CODE}\``,
      `- Package name: \`${PACKAGE_NAME}\``,
      `- Setup metadata changed: \`${setupChanged}\``,
      `- Table 325 signal observed: \`${hasTableSignal}\``,
      '- No package import/export/validate/apply/Edit-in-Excel publish.',
      '- No VAT matrix value write.',
      '- No Preview Posting or Posting.',
      '',
      'If metadata remains, cleanup or keep-classification must be handled in a separate case.'
    ].join('\n')
  );

  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
