import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027D15-VAT-MATRIX-RECREATE-ROUTE-DIAGNOSIS';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d15-vat-matrix-recreate-route-diagnosis';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D15-result.json');

type VisibleEntry = {
  text: string;
  role: string;
  tag: string;
  ariaLabel: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
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

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function page472Visible(text: string) {
  return /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i.test(text);
}

function sanitizeForEvidence(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/allowedEndpoints|allowedResources|tokenFactorySettings|clientId|authority:|parentPageOrigin|upn/i.test(value)) {
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

async function matrixText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i,
        /INLAND|VAT19|1406|3806|19|Normale MwSt|Normal VAT/i,
        /Beschreibung|MwSt\. %|MwSt\.-Berechnungsart|Umsatzsteuerkonto|Vorsteuerkonto/i,
        /Geschaeftsbuchungsgruppe|Gesch.ftsbuchungsgruppe|Produktbuchungsgruppe|Neu|Liste bearbeiten|Bearbeiten|Weitere Optionen/i,
        /Seitenprufung|Page Inspection|VAT Posting Setup|Table|Field|Nicht gespeichert|Fehler|Error/i
      ],
      maxLines: 420,
      maxLineLength: 360
    })
  );
}

async function dangerousDialogVisible(page: Page) {
  for (const frame of page.frames()) {
    const found = await frame
      .locator('[role="dialog"], .ms-Dialog-main, .modal-dialog')
      .filter({
        hasText: /Preview Posting|Buchungsvorschau|Ship|Invoice|Payment|Apply|Finish|Fertig stellen|Do you want to post|Moechten Sie buchen|Fortfahren und loschen/i
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

async function screenshot(page: Page, name: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, name), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, name.replace(/\.png$/i, '.screenshot.json')), {
    fileName: name,
    imagePath: path.join(EVIDENCE_DIR, name),
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    ...metadata
  });
}

async function capture(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await matrixText(page);
  await writeText(`${prefix}.txt`, text || 'No compact Page-472 text captured.');
  await screenshot(page, `${prefix}.png`, {
    step,
    visibleLearning: 'Das Bild muss die Page-472-Oberflaeche, Zeile, Zellen, Menues oder Page-Inspection-Diagnose sichtbar machen.',
    internallyProves: 'UI-Diagnose in playthru / UNIVERSAARL-DE; keine Setup-Werte wurden geschrieben.',
    doesNotProve: ['No VAT matrix setup', 'No Preview Posting', 'No Posting', 'No VAT Entries', 'No final German VAT correctness'],
    ...extra
  });
  return text;
}

async function openMatrix(page: Page) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await assertContext(page);
  const text = clean(await pageText(page));
  if (!page472Visible(text)) throw new Error('Page 472 VAT Posting Setup context is not visible.');
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

async function visibleEntries(page: Page, pattern: RegExp) {
  const all: VisibleEntry[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((source) => {
        const pattern = new RegExp(source, 'i');
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],[role="columnheader"],[role="row"],[role="button"],button,span,div,input,a')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = (element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            if (
              !pattern.test(text) ||
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
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              tag: element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(rect.y + rect.height / 2)
            };
          })
          .filter(Boolean)
          .slice(0, 300);
      }, pattern.source)
      .catch(() => []);
    all.push(...(entries as VisibleEntry[]));
  }
  return all.sort((left, right) => left.y - right.y || left.x - right.x);
}

async function rowCellCenters(page: Page, rowY: number) {
  const all: VisibleEntry[] = [];
  for (const frame of page.frames()) {
    const entries = await frame
      .evaluate((rowY) => {
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],td')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const value = element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value : '';
            const text = (element.innerText || value || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const centerY = rect.y + rect.height / 2;
            if (
              Math.abs(centerY - rowY) > 24 ||
              rect.width <= 5 ||
              rect.height <= 5 ||
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
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              tag: element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(centerY)
            };
          })
          .filter(Boolean)
          .sort((left, right) => left!.x - right!.x);
      }, rowY)
      .catch(() => []);
    all.push(...(entries as VisibleEntry[]));
  }
  const unique: VisibleEntry[] = [];
  for (const entry of all.sort((left, right) => left.x - right.x || left.width - right.width)) {
    if (unique.some((existing) => Math.abs(existing.centerX - entry.centerX) < 8)) continue;
    unique.push(entry);
  }
  return unique;
}

async function activeElementInfo(page: Page, cell: { x: number; y: number }) {
  const infos = [];
  for (const frame of page.frames()) {
    const info = await frame
      .evaluate(({ x, y }) => {
        const active = document.activeElement as HTMLElement | null;
        if (!active) return { found: false };
        const rect = active.getBoundingClientRect();
        const tagName = active.tagName.toLowerCase();
        const role = active.getAttribute('role') || '';
        const value = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement ? active.value : '';
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        return {
          found: true,
          tagName,
          role,
          ariaLabel: active.getAttribute('aria-label') || '',
          title: active.getAttribute('title') || '',
          value,
          text: (active.innerText || '').replace(/\s+/g, ' ').trim(),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          distanceFromCell: Math.round(Math.hypot(centerX - x, centerY - y))
        };
      }, cell)
      .catch(() => ({ found: false }));
    infos.push(info);
  }
  return infos;
}

async function locateDiagnosisRow(page: Page) {
  const candidates = (await visibleEntries(page, /Normale MwSt|Normal VAT|\b0\b|\*/))
    .filter((entry) => entry.y > 150 && entry.y < 310 && entry.height <= 80)
    .sort((left, right) => left.y - right.y || left.x - right.x);
  const row = candidates[0] ?? null;
  return {
    row,
    y: row ? row.centerY : 205,
    source: row ? 'visible-default-new-row-signal' : 'fallback-y'
  };
}

test('TARGET-027D15 diagnoses Page 472 recreate route without writing setup values', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const observations: Record<string, unknown>[] = [];

  await openMatrix(page);
  const beforeText = await capture(page, 'target-027d15-010-before-diagnosis', 'Before no-write route diagnosis.', {
    status: 'before-diagnosis'
  });
  if (/\bINLAND\b/i.test(beforeText) && /\bVAT19\b/i.test(beforeText)) {
    blockedBy.push('INLAND/VAT19 row is unexpectedly visible before D15; no new-row diagnosis should continue.');
  }

  if (blockedBy.length === 0) {
    const editRoute = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
    observations.push({ step: 'edit-list-route', editRoute });
    const newRoute = await clickAction(page, /^Neu$|^New$/i);
    observations.push({ step: 'new-row-route', newRoute });
    if (!newRoute.clicked) {
      blockedBy.push('Neu/New was not visible for no-write diagnosis.');
    } else {
      await assertContext(page);
      await capture(page, 'target-027d15-020-after-new-row-diagnosis', 'After Neu/New for no-write diagnosis.', {
        status: 'after-new-row-diagnosis'
      });
      const rowInfo = await locateDiagnosisRow(page);
      const cells = await rowCellCenters(page, rowInfo.y);
      observations.push({ step: 'row-and-cell-geometry', rowInfo, cells: cells.slice(0, 20) });

      const probeCells = cells
        .filter((cell) => cell.role === 'gridcell')
        .slice(0, 8)
        .map((cell, index) => ({ index, x: cell.centerX, y: rowInfo.y, text: cell.text, role: cell.role, title: cell.title }));
      for (const cell of probeCells) {
        await page.mouse.click(cell.x, cell.y);
        await page.waitForTimeout(300);
        observations.push({
          step: 'active-element-after-cell-click',
          cell,
          activeElements: await activeElementInfo(page, { x: cell.x, y: cell.y })
        });
      }
      await capture(page, 'target-027d15-030-after-cell-probes', 'After no-write cell focus probes.', {
        status: 'after-cell-probes',
        probeCells
      });

      const editCardRoute = await clickAction(page, /^Bearbeiten$|^Edit$|^Karte bearbeiten$|^Edit Card$/i);
      observations.push({ step: 'edit-card-route-probe', editCardRoute });
      await capture(page, 'target-027d15-040-after-edit-card-probe', 'After optional Bearbeiten/card route probe without typing.', {
        status: 'after-edit-card-probe',
        editCardRoute
      });

      await page.keyboard.press('Control+Alt+F1').catch((error) => {
        warnings.push(`Page Inspection shortcut failed: ${String(error).slice(0, 160)}`);
      });
      await page.waitForTimeout(1800);
      const inspectionText = await capture(page, 'target-027d15-050-after-page-inspection-probe', 'After Page Inspection shortcut probe.', {
        status: 'after-page-inspection-probe'
      });
      observations.push({
        step: 'page-inspection-probe',
        visible: /Page Inspection|Seitenprufung|VAT Posting Setup|Table|Field/i.test(inspectionText),
        signals: inspectionText.split('\n').filter((line) => /Page|Table|Field|VAT Posting Setup|MwSt/i.test(line)).slice(0, 40)
      });
    }
  }

  await openMatrix(page);
  const reopenText = await capture(page, 'target-027d15-060-reopen-no-persist-proof', 'Reopen proof after no-write diagnosis.', {
    status: 'reopen-no-persist-proof'
  });
  const rowStillAbsent = !(/\bINLAND\b/i.test(reopenText) && /\bVAT19\b/i.test(reopenText));
  if (!rowStillAbsent) {
    blockedBy.push('INLAND/VAT19 row is visible after no-write diagnosis; manual review required.');
  }

  const nextCase = 'TARGET-027D16-VAT-MATRIX-RECREATE-CARD-OR-INSPECTION-ROUTE-DECISION';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-matrix-recreate-route-diagnosis',
    resultStatus: blockedBy.length ? 'blocked-route-diagnosis-needs-review' : 'observed-route-diagnosis-no-write',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    actionsTaken: [
      'Opened Page 472 in playthru / UNIVERSAARL-DE.',
      'Captured before screenshot/text.',
      'Clicked Liste bearbeiten and Neu only for no-write route diagnosis when the target row was absent.',
      'Captured row/cell geometry and active element states after cell clicks.',
      'Probed Bearbeiten/card route and Page Inspection without typing target setup values.',
      'Reopened Page 472 and checked that no INLAND/VAT19 row persisted.'
    ],
    actionsNotTaken: [
      'No INLAND/VAT19 typing',
      'No 19/3806/1406 typing',
      'No delete',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No API shortcut',
      'No final VAT claim'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'target-027d15-010-before-diagnosis.png',
      'target-027d15-020-after-new-row-diagnosis.png',
      'target-027d15-030-after-cell-probes.png',
      'target-027d15-040-after-edit-card-probe.png',
      'target-027d15-050-after-page-inspection-probe.png',
      'target-027d15-060-reopen-no-persist-proof.png'
    ],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'D15 captured Page 472 row/cell/active-element diagnostics without typing target setup values.',
      'No master data, document draft, Preview Posting, Posting or API shortcut was executed.',
      rowStillAbsent
        ? 'No INLAND/VAT19 row is visible after reopen; the diagnosis did not persist the target matrix row.'
        : 'Reopen proof requires review because target-row visibility changed.'
    ],
    notProved: [
      'No correct INLAND/VAT19 VAT Posting Setup matrix row.',
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.'
    ],
    observations,
    blockedBy,
    warnings,
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D15-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D15-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`
    ],
    flags: {
      noSetupWrite: true,
      noDelete: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'D14 showed Neu/New can expose a transient blank Page-472 row, but no true editor for the first mandatory field.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Before any further VAT setup write, the UI route must distinguish rowheader/header/display cells from real editable controls.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: 'ready-next',
          reason: 'D15 provides the no-write geometry/control data needed for a route decision.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting groups wait for correct VAT matrix setup.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT/posting defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT matrix and posting groups.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: 'The next step should be a local/source/UI route decision, not another blind list-cell write.',
      risksBeforeNextCase: [
        'Do not type setup values from D15 alone.',
        'Do not claim VAT setup or final German VAT correctness.',
        'Do not start master data before VAT/posting setup is ready.'
      ],
      requiredPreparation: [
        'Review D15 active-element and Page Inspection observations.',
        'Choose a card/detail route, Page Inspection backed route, or source-backed alternative before writing values.'
      ]
    },
    safeToFinalizeState: false,
    requiresReview: true,
    statePatch: {},
    nextCase,
    reason: 'D15 completed no-write route diagnosis; a separate route decision is required before any VAT matrix write.'
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
      '## Smart Decision',
      '',
      'D15 ist eine reine Diagnose nach dem D14-Editor-Blocker. Der Lauf darf Page 472 oeffnen, eine neue Zeile nur fuer UI-Diagnose sichtbar machen und Controls untersuchen. Er darf keine Zielwerte tippen.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine INLAND/VAT19-Werteingabe.',
      '- Keine 19/3806/1406-Werteingabe.',
      '- Kein Delete.',
      '- Keine Stammdaten.',
      '- Kein Belegdraft.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.setupChanged).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
});
