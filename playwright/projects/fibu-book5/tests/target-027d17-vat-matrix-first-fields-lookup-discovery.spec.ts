import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-027D17-VAT-MATRIX-FIRST-FIELDS-LOOKUP-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-027d17-vat-matrix-first-fields-lookup-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-027D17-result.json');

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

function page472Visible(text: string) {
  return /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i.test(text);
}

function sanitizeForEvidence(value: unknown): unknown {
  if (typeof value === 'string') {
    if (/allowedEndpoints|allowedResources|tokenFactorySettings|clientId|authority:|parentPageOrigin|upn|shouldAttachOauthTokens/i.test(value)) {
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
        /Gesch[aeft]*ftsbuchungsgruppe|Produktbuchungsgruppe|VAT Bus|VAT Prod|Beschreibung|MwSt\. %|Umsatzsteuerkonto|Vorsteuerkonto/i,
        /Neu|Liste bearbeiten|Bearbeiten|Weitere Optionen|Details|Auswaehlen|Select|Lookup|Seitenprufung|Page Inspection/i,
        /Nicht gespeichert|Die Seite enthaelt einen Fehler|Aktualisieren Sie|Fehler|Error/i
      ],
      maxLines: 460,
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
    visibleLearning: 'Das Bild zeigt die MwSt.-Buchungsmatrix und die untersuchte Feld-/Lookup-Oberflaeche.',
    internallyProves: 'No-write UI discovery in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No VAT setup write', 'No Preview Posting', 'No Posting', 'No VAT Entries', 'No final German VAT correctness'],
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
          .slice(0, 500);
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
              Math.abs(centerY - rowY) > 30 ||
              rect.width <= 8 ||
              rect.height <= 8 ||
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
    .filter((entry) => entry.y > 150 && entry.y < 330 && entry.height <= 90)
    .sort((left, right) => left.y - right.y || left.x - right.x);
  const row = candidates[0] ?? null;
  return {
    row,
    y: row ? row.centerY : 205,
    source: row ? 'visible-default-new-row-signal' : 'fallback-y'
  };
}

async function nearbyButtons(page: Page, cell: VisibleEntry) {
  const entries: VisibleEntry[] = [];
  for (const frame of page.frames()) {
    const buttons = await frame
      .evaluate((cell) => {
        return [...document.querySelectorAll<HTMLElement>('[role="button"],button,a')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const text = (element.innerText || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .replace(/\s+/g, ' ')
              .trim();
            const centerY = rect.y + rect.height / 2;
            const nearY = Math.abs(centerY - cell.centerY) <= 28;
            const nearX = rect.x >= cell.x - 8 && rect.x <= cell.x + cell.width + 45;
            if (
              !nearY ||
              !nearX ||
              rect.width <= 1 ||
              rect.height <= 1 ||
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
              height: Math.round(rect.height),
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(centerY)
            };
          })
          .filter(Boolean);
      }, cell)
      .catch(() => []);
    entries.push(...(buttons as VisibleEntry[]));
  }
  return entries.sort((left, right) => left.x - right.x);
}

async function popupSignals(page: Page) {
  const signals = [];
  for (const frame of page.frames()) {
    const text = await frame
      .locator('[role="dialog"],[role="listbox"],[role="menu"],[role="grid"],[aria-modal="true"]')
      .evaluateAll((elements) =>
        elements
          .map((element) => ({
            role: element.getAttribute('role') || '',
            text: (element.textContent || '').replace(/\s+/g, ' ').trim()
          }))
          .filter((entry) => entry.text)
          .slice(0, 20)
      )
      .catch(() => []);
    signals.push(...text);
  }
  const seen = new Set<string>();
  return signals
    .filter((signal) => {
      const key = `${signal.role}:${signal.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 30);
}

test('TARGET-027D17 discovers first-field lookup controls without writing VAT matrix values', async ({ page }) => {
  await fs.rm(EVIDENCE_DIR, { recursive: true, force: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const observations: Record<string, unknown>[] = [];
  const screenshotNames: string[] = [];

  async function captureNamed(prefix: string, step: string, extra: Record<string, unknown> = {}) {
    screenshotNames.push(`${prefix}.png`);
    return capture(page, prefix, step, extra);
  }

  await openMatrix(page);
  const beforeText = await captureNamed('target-027d17-010-before-discovery', 'Before lookup discovery.', {
    status: 'before-discovery'
  });
  if (/\bINLAND\b/i.test(beforeText) && /\bVAT19\b/i.test(beforeText)) {
    blockedBy.push('INLAND/VAT19 row is unexpectedly visible before D17; lookup discovery should not create a duplicate.');
  }

  if (blockedBy.length === 0) {
    const editRoute = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
    observations.push({ step: 'edit-list-route', editRoute });
    const newRoute = await clickAction(page, /^Neu$|^New$/i);
    observations.push({ step: 'new-row-route', newRoute });
    if (!newRoute.clicked) {
      blockedBy.push('Neu/New was not visible for lookup discovery.');
    } else {
      await assertContext(page);
      await captureNamed('target-027d17-020-after-new-row', 'After Neu/New for first-field lookup discovery.', {
        status: 'after-new-row'
      });

      const rowInfo = await locateDiagnosisRow(page);
      const cells = await rowCellCenters(page, rowInfo.y);
      observations.push({ step: 'row-and-cell-geometry', rowInfo, cells: cells.slice(0, 16) });

      const candidateCells = cells.filter((cell) => cell.role === 'gridcell').slice(0, 2);
      for (const [index, cell] of candidateCells.entries()) {
        await page.mouse.move(cell.centerX, cell.centerY);
        await page.waitForTimeout(600);
        await page.mouse.click(cell.centerX, cell.centerY);
        await page.waitForTimeout(600);
        const activeAfterClick = await activeElementInfo(page, { x: cell.centerX, y: cell.centerY });
        const buttonsBeforeAlt = await nearbyButtons(page, cell);
        const signalsBeforeAlt = await popupSignals(page);
        observations.push({
          step: 'first-field-cell-probe',
          index,
          cell,
          activeAfterClick,
          buttonsBeforeAlt,
          signalsBeforeAlt
        });
        await captureNamed(`target-027d17-03${index}-cell-${index}-hover-click`, `After hover/click on candidate field cell ${index}.`, {
          status: 'after-cell-hover-click',
          cell,
          buttonsBeforeAlt
        });

        if (buttonsBeforeAlt.length > 0) {
          const button = buttonsBeforeAlt[0];
          await page.mouse.click(button.centerX, button.centerY);
          await page.waitForTimeout(900);
          const signalsAfterButton = await popupSignals(page);
          observations.push({
            step: 'first-field-nearby-button-probe',
            index,
            cell,
            button,
            activeAfterButton: await activeElementInfo(page, { x: button.centerX, y: button.centerY }),
            signalsAfterButton
          });
          await captureNamed(`target-027d17-05${index}-cell-${index}-nearby-button`, `After nearby cell button probe on candidate field cell ${index}.`, {
            status: 'after-nearby-cell-button-probe',
            cell,
            button,
            popupSignals: signalsAfterButton
          });
          await page.keyboard.press('Escape').catch(() => undefined);
          await page.waitForTimeout(500);
        }

        await page.keyboard.press('Alt+ArrowDown').catch((error) => {
          warnings.push(`Alt+ArrowDown probe failed on cell ${index}: ${String(error).slice(0, 160)}`);
        });
        await page.waitForTimeout(900);
        const signalsAfterAlt = await popupSignals(page);
        observations.push({
          step: 'first-field-alt-arrowdown-probe',
          index,
          cell,
          activeAfterAlt: await activeElementInfo(page, { x: cell.centerX, y: cell.centerY }),
          signalsAfterAlt
        });
        await captureNamed(`target-027d17-04${index}-cell-${index}-alt-down`, `After Alt+ArrowDown lookup probe on candidate field cell ${index}.`, {
          status: 'after-alt-arrowdown-probe',
          cell,
          popupSignals: signalsAfterAlt
        });
        await page.keyboard.press('Escape').catch(() => undefined);
        await page.waitForTimeout(500);

        const afterProbeText = await matrixText(page);
        if (!/Normale MwSt|Normal VAT|\*/i.test(afterProbeText)) {
          warnings.push(`Transient new row was no longer visible after cell ${index}; later candidate cells were not probed.`);
          break;
        }
      }
    }
  }

  await openMatrix(page);
  const reopenText = await captureNamed('target-027d17-090-reopen-no-persist-proof', 'Reopen proof after no-write lookup discovery.', {
    status: 'reopen-no-persist-proof'
  });
  const noTargetRowPersisted = !(/\bINLAND\b/i.test(reopenText) && /\bVAT19\b/i.test(reopenText));
  if (!noTargetRowPersisted) {
    blockedBy.push('INLAND/VAT19 row is visible after D17 no-write discovery; manual review required.');
  }

  const lookupEvidence = observations.some((observation) => {
    const signals = [
      ...((observation as { signalsAfterButton?: unknown[] }).signalsAfterButton ?? []),
      ...((observation as { signalsAfterAlt?: unknown[] }).signalsAfterAlt ?? [])
    ] as Array<{ role?: string; text?: string }>;
    return signals.some((signal) => /^(listbox|dialog|menu)$/i.test(signal.role ?? ''));
  });
  const resultStatus = blockedBy.length
    ? 'blocked'
    : lookupEvidence
      ? 'observed-lookup-affordance-no-write'
      : 'observed-no-safe-lookup-affordance';
  const nextCase = lookupEvidence
    ? 'TARGET-027D18-VAT-MATRIX-CONTROLLED-WRITE-IF-LOOKUP-PROVEN'
    : 'TARGET-027D18-VAT-MATRIX-NON-UI-SETUP-ROUTE-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-result',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    sanitizedUrl: sanitizeEvidenceUrl(page.url()),
    actionsTaken: [
      'Opened Page 472 in playthru / UNIVERSAARL-DE.',
      'Captured before screenshot/text.',
      'Clicked Liste bearbeiten and Neu only for no-write lookup discovery when the target row was absent.',
      'Hovered and clicked candidate first-field cells without typing values.',
      'Probed Alt+ArrowDown on candidate cells without selecting values.',
      'Captured screenshot QA for each discovered field surface.',
      'Reopened Page 472 and checked that no INLAND/VAT19 row persisted.'
    ],
    actionsNotTaken: [
      'No INLAND/VAT19 typing',
      'No INLAND/VAT19 selection',
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
    screenshots: screenshotNames,
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'D17 captured Page 472 first-field hover/click/Alt+ArrowDown lookup diagnostics without typing or selecting target values.',
      noTargetRowPersisted
        ? 'No INLAND/VAT19 row is visible after reopen; the discovery did not persist the target matrix row.'
        : 'Reopen proof requires review because target-row visibility changed.',
      lookupEvidence
        ? 'At least one lookup/detail/menu/dialog affordance signal appeared during the no-write probe.'
        : 'No safe lookup/select affordance was proven in this no-write probe.'
    ],
    notProved: [
      'No correct INLAND/VAT19 VAT Posting Setup matrix row.',
      'No safe write route is unlocked yet.',
      'No final German VAT correctness.',
      'No Preview Posting.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No VAT Statement.'
    ],
    observations,
    blockedBy,
    warnings,
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
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D17-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-027D17-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.png`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`
    ],
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'D16 selected no-write lookup/detail/select discovery after D14/D15 blocked blind typing and Bearbeiten/list routes.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The unresolved UI question is whether Page 472 exposes safe lookup/select controls for the first two mandatory VAT group fields.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: lookupEvidence ? 'ready-after-current' : 'replace-with-better-case',
          reason: lookupEvidence
            ? 'A later write case may be designed only from the captured control evidence.'
            : 'If no lookup affordance is proven, the next route should be a non-UI setup-route decision rather than another grid probe.'
        },
        {
          caseId: 'TARGET-028-POSTING-GROUPS-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Posting Groups wait for a correct VAT Posting Setup matrix row.'
        },
        {
          caseId: 'TARGET-029-MASTERDATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data waits for VAT/posting defaults.'
        },
        {
          caseId: 'TARGET-030-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation readiness waits for VAT matrix and Posting Groups.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: lookupEvidence
        ? 'It can use concrete lookup-control evidence instead of blind typing.'
        : 'The no-write probe did not prove a safe lookup route, so another UI write attempt would be waste.',
      risksBeforeNextCase: [
        'Do not select or type INLAND/VAT19 from this evidence alone unless the control binding is explicit.',
        'Do not claim VAT setup readiness before a row with 19/3806/1406 is visible after reopen.',
        'Do not start master data before VAT/posting setup is ready.'
      ],
      requiredPreparation: lookupEvidence
        ? ['Review D17 screenshots and observations; design one narrow write case with exact stop conditions.']
        : ['Decide a non-UI standard setup route or park VAT matrix setup; do not repeat grid typing.']
    },
    safeToFinalizeState: false,
    requiresReview: true,
    statePatch: {},
    nextCase,
    reason: lookupEvidence
      ? 'D17 found lookup/detail/menu/dialog affordance signals without writing values; a later write case still needs strict review.'
      : 'D17 did not prove a safe lookup/select route; future work should avoid another Page-472 grid write attempt.'
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
      'D17 untersucht nur, ob die ersten beiden Felder der MwSt.-Buchungsmatrix echte Lookup-, Detail- oder Auswahlcontrols haben. Der Lauf darf keine Zielwerte tippen oder auswaehlen.',
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine INLAND/VAT19-Werteingabe.',
      '- Keine INLAND/VAT19-Auswahl.',
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
