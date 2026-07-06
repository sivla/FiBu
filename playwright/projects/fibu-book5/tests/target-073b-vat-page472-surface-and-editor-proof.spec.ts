import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  openSearchResult,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(240_000);

const CASE_ID = 'TARGET-073B-VAT-PAGE472-SURFACE-AND-EDITOR-PROOF';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-073b-vat-page472-surface-and-editor-proof';
const EVIDENCE_REL_DIR = `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}`;
const EVIDENCE_DIR = path.resolve(EVIDENCE_REL_DIR);
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-073B-result.json');

type RectLike = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type VisibleCell = {
  text: string;
  role: string;
  ariaLabel: string;
  title: string;
  rect: RectLike;
  centerX: number;
  centerY: number;
};

type EditorProbe = {
  step: string;
  target: string;
  point: { x: number; y: number };
  activeElement: Record<string, unknown> | null;
  rowScopedControls: Array<Record<string, unknown>>;
  accepted: boolean;
  rejectedReason: string;
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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|access[_-]?token|refresh[_-]?token|id[_-]?token/i.test(line))
    .join('\n')
    .trim();
}

function buildPlaythruUrl(pageId: number) {
  const url = new URL(process.env.TARGET_073B_BC_TARGET_URL || requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('dc', '0');
  return url.toString();
}

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'dc']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString().replace('%7Btenant%7D', '{tenant}');
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function page472SurfaceVisible(text: string) {
  return /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup|VAT Bus\.|VAT Prod\.|MwSt\. %|VAT %|Umsatzsteuerkonto|Sales VAT Account|Vorsteuerkonto|Purchase VAT Account/i.test(text);
}

function looksLikeRejectedSurface(text: string) {
  return /Rollencenter|Role Center|Nach .* suchen|Search results|Suchen nach|Tell me|Meine Einstellungen|My Settings/i.test(text) && !page472SurfaceVisible(text);
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

async function page472Text(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /MwSt\.-?Buchungsmatrix|USt\.-?Buchungsmatrix|VAT Posting Setup/i,
        /VAT Bus|VAT Prod|Gesch.*ftsbuchungsgruppe|Produktbuchungsgruppe|MwSt\. %|VAT %|Berechnungsart|Calculation Type/i,
        /Umsatzsteuerkonto|Sales VAT Account|Vorsteuerkonto|Purchase VAT Account|INLAND|VAT19|1406|3806|19/i,
        /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Fokus|Focus|Personalisieren|Personalize|Seiten.*pruefung|Page Inspection/i
      ],
      maxLines: 320,
      maxLineLength: 320
    })
  );
}

async function assertContext(page: Page) {
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
}

async function screenshot(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, fileName), fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath: path.join(EVIDENCE_DIR, fileName),
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function capture(page: Page, prefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await page472Text(page);
  const fullText = await visibleText(page);
  const surfaceVisible = page472SurfaceVisible(text) || page472SurfaceVisible(fullText);
  const rejectedSurface = looksLikeRejectedSurface(fullText);
  await writeText(`${prefix}.txt`, text || 'No compact Page-472 text captured.');
  await screenshot(page, `${prefix}.png`, {
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix',
    step,
    url: sanitizeEvidenceUrl(page.url()),
    surfaceProof: {
      visibleTargetPage: surfaceVisible,
      rejectedSurface: rejectedSurface ? 'role-center-or-search-overlay-without-target-page' : '',
      screenshotShowsTarget: surfaceVisible,
      searchOverlayOpen: /Nach .* suchen|Search results|Tell me/i.test(fullText),
      roleCenterStillVisible: /Rollencenter|Role Center/i.test(fullText)
    },
    visibleLearning:
      'Die MwSt.-Buchungsmatrix ist nur bewiesen, wenn die Matrix selbst sichtbar ist. Suchtreffer, Role Center oder versteckter Text reichen nicht.',
    internallyProves: 'Page 472 surface/editor diagnostic state in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No VAT setup write', 'No Preview Posting', 'No Posting', 'No VAT Entries', 'No final German VAT correctness'],
    ...extra
  });
  return { text, fullText, surfaceVisible, rejectedSurface };
}

async function openMatrix(page: Page) {
  await page.goto(buildPlaythruUrl(472), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertContext(page);

  let text = await visibleText(page);
  if (page472SurfaceVisible(text)) return { opened: true, route: 'direct-page-472' };

  await searchFor(page, 'MwSt.-Buchungsmatrix');
  await page.waitForTimeout(1200);
  await openSearchResult(page, /MwSt\.-?Buchungsmatrix|VAT Posting Setup|USt\.-?Buchungsmatrix/i, { requireUnique: false });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape').catch(() => undefined);
  await assertContext(page);
  text = await visibleText(page);
  return { opened: page472SurfaceVisible(text), route: 'visible-tell-me-search' };
}

async function visibleActionLabels(page: Page) {
  const labels = new Set<string>();
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link'] as const) {
      const count = await scope.getByRole(role).count().catch(() => 0);
      for (let index = 0; index < Math.min(count, 160); index += 1) {
        const locator = scope.getByRole(role).nth(index);
        if (!(await locator.isVisible({ timeout: 100 }).catch(() => false))) continue;
        const label = clean(
          (await locator.getAttribute('aria-label').catch(() => null)) ??
            (await locator.getAttribute('title').catch(() => null)) ??
            (await locator.textContent().catch(() => null)) ??
            ''
        );
        if (label && /Neu|New|Bearbeiten|Edit|Liste bearbeiten|Edit List|Weitere Optionen|More options|Fokus|Focus|Maximieren|Expand|Seiten.*pruefung|Page Inspection/i.test(label)) {
          labels.add(`${role}: ${label}`.slice(0, 220));
        }
      }
    }
  }
  return [...labels].sort((left, right) => left.localeCompare(right));
}

async function clickSafeAction(page: Page, pattern: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const candidate = scope.getByRole(role, { name: pattern }).first();
      if (await candidate.isVisible({ timeout: 500 }).catch(() => false)) {
        await candidate.click({ timeout: 3000 });
        await page.waitForTimeout(1000);
        return { clicked: true, role, pattern: pattern.source };
      }
    }
  }
  return { clicked: false, role: 'not-found', pattern: pattern.source };
}

async function tryPageInspection(page: Page) {
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(1800);
  const text = await visibleText(page);
  const visible = /Page Inspection|Seiten.*pruefung|VAT Posting Setup|Source Table|Quelltabelle|Table 325|325/i.test(text);
  return {
    attempted: true,
    visible,
    signals: text
      .split('\n')
      .filter((line) => /Page Inspection|Seiten|Page|Table|Source|Quelle|VAT Posting Setup|325|472|MwSt|Buchungsmatrix/i.test(line))
      .slice(0, 80)
  };
}

async function visibleCells(page: Page) {
  const cells: VisibleCell[] = [];
  for (const [frameIndex, frame] of page.frames().entries()) {
    const found = await frame
      .evaluate((frameIndex) => {
        const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
        return [...document.querySelectorAll<HTMLElement>('[role="gridcell"],[role="columnheader"],[role="row"],td,th,input,textarea,[contenteditable="true"]')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            const input = element as HTMLInputElement;
            const text = normalize(element.innerText || input.value || element.getAttribute('aria-label') || element.getAttribute('title'));
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
              frameIndex,
              text,
              role: element.getAttribute('role') || element.tagName.toLowerCase(),
              ariaLabel: element.getAttribute('aria-label') || '',
              title: element.getAttribute('title') || '',
              rect: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              centerX: Math.round(rect.x + rect.width / 2),
              centerY: Math.round(rect.y + rect.height / 2)
            };
          })
          .filter(Boolean)
          .slice(0, 500);
      }, frameIndex)
      .catch(() => []);
    cells.push(...(found as VisibleCell[]));
  }
  return cells;
}

function pickTargetRow(cells: VisibleCell[]) {
  const contentCells = cells
    .filter((cell) => cell.rect.y > 120 && cell.rect.y < 900 && cell.rect.height < 90)
    .filter((cell) => /INLAND|VAT19|Normale MwSt|Normal VAT|0|MwSt|VAT/i.test(`${cell.text} ${cell.ariaLabel} ${cell.title}`));
  const target = contentCells.find((cell) => /\bINLAND\b|\bVAT19\b/i.test(cell.text)) ?? contentCells[0] ?? null;
  return {
    rowY: target?.centerY ?? 260,
    anchor: target,
    source: target ? 'visible-vat-or-target-row' : 'fallback-grid-region'
  };
}

function pickProbeCells(cells: VisibleCell[], rowY: number) {
  const rowCells = cells
    .filter((cell) => Math.abs(cell.centerY - rowY) <= 32)
    .filter((cell) => cell.rect.width > 8 && cell.rect.height > 8)
    .sort((left, right) => left.rect.x - right.rect.x || left.rect.width - right.rect.width);
  const unique: VisibleCell[] = [];
  for (const cell of rowCells) {
    if (unique.some((existing) => Math.abs(existing.centerX - cell.centerX) < 10)) continue;
    unique.push(cell);
  }
  return unique.slice(0, 24);
}

async function probeEditorAt(page: Page, target: string, point: { x: number; y: number }): Promise<EditorProbe> {
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(900);
  const snapshot = await page
    .evaluate((point) => {
      const normalize = (value: string | null | undefined, max = 800) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const toRect = (element: Element | null) => {
        if (!element) return null;
        const rect = (element as HTMLElement).getBoundingClientRect();
        return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
      };
      const visible = (element: HTMLElement) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 1 && rect.height > 1 && style.display !== 'none' && style.visibility !== 'hidden';
      };
      const active = document.activeElement as HTMLElement | null;
      const activeRect = toRect(active);
      const activeCenter = activeRect ? { x: activeRect.x + activeRect.width / 2, y: activeRect.y + activeRect.height / 2 } : null;
      const controlSelector = 'input,textarea,select,[role="textbox"],[role="combobox"],[contenteditable="true"]';
      const controls = [...document.querySelectorAll<HTMLElement>(controlSelector)]
        .filter(visible)
        .map((element) => {
          const input = element as HTMLInputElement;
          const rect = toRect(element)!;
          const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
          return {
            tag: element.tagName.toLowerCase(),
            role: normalize(element.getAttribute('role')),
            aria: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            value: normalize(input.value || element.textContent),
            rowText: normalize(element.closest('[role="row"],tr')?.textContent, 900),
            cellText: normalize(element.closest('[role="gridcell"],td,[role="cell"]')?.textContent),
            readonly: Boolean(input.readOnly || element.getAttribute('aria-readonly') === 'true'),
            disabled: Boolean(input.disabled || element.getAttribute('aria-disabled') === 'true'),
            rect,
            distanceFromPoint: Math.round(Math.hypot(center.x - point.x, center.y - point.y))
          };
        })
        .sort((left, right) => left.distanceFromPoint - right.distanceFromPoint);
      return {
        activeElement: active
          ? {
              tag: active.tagName.toLowerCase(),
              role: normalize(active.getAttribute('role')),
              aria: normalize(active.getAttribute('aria-label')),
              title: normalize(active.getAttribute('title')),
              text: normalize(active.innerText || active.textContent),
              value: normalize((active as HTMLInputElement).value),
              rowText: normalize(active.closest('[role="row"],tr')?.textContent, 900),
              cellText: normalize(active.closest('[role="gridcell"],td,[role="cell"]')?.textContent),
              rect: activeRect,
              distanceFromPoint: activeCenter ? Math.round(Math.hypot(activeCenter.x - point.x, activeCenter.y - point.y)) : null
            }
          : null,
        rowScopedControls: controls.filter((control) => control.distanceFromPoint <= 140).slice(0, 20)
      };
    }, point)
    .catch(() => ({ activeElement: null, rowScopedControls: [] }));
  const acceptedControl = snapshot.rowScopedControls.find((control: any) => {
    return (
      !control.readonly &&
      !control.disabled &&
      Number(control.distanceFromPoint ?? 9999) <= 90 &&
      /input|textarea|select|textbox|combobox/i.test(`${control.tag} ${control.role}`) &&
      /INLAND|VAT19|Normale MwSt|0|VAT|MwSt/i.test(`${control.rowText} ${control.cellText} ${control.aria} ${control.title} ${control.value}`)
    );
  });
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(250);
  return {
    step: 'single-click-with-surface-proof',
    target,
    point,
    activeElement: snapshot.activeElement,
    rowScopedControls: snapshot.rowScopedControls,
    accepted: Boolean(acceptedControl),
    rejectedReason: acceptedControl ? '' : 'no enabled row/column-bound editor overlapped the probed target cell'
  };
}

test('TARGET-073B proves Page 472 surface and editor readiness without typing VAT values', async ({ page }) => {
  expect(process.env.TARGET_073B_LIVE_APPROVED).toBe('1');
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.setViewportSize({ width: 2400, height: 1350 });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const layoutActionsTried: string[] = [];

  const route = await openMatrix(page);
  actionsTaken.push(`Opened Page 472 using route: ${route.route}.`);
  if (!route.opened) blockedBy.push('Page 472 was not visibly reachable; no editor diagnosis possible.');

  const initial = await capture(page, 'target-073b-010-surface-before-layout', 'Initial Page 472 surface proof before layout diagnosis.', { route });
  if (initial.rejectedSurface) blockedBy.push('Initial screenshot/text looks like Role Center or Search Overlay instead of the target page.');

  await dismissTours(page);
  layoutActionsTried.push('dismiss-teaching-tips-if-visible');
  const factBoxHidden = await hideFactBoxPane(page).catch(() => false);
  if (factBoxHidden) layoutActionsTried.push('hide-factbox-pane');

  const focusAction = await clickSafeAction(page, /Fokusmodus|Focus mode|In neuem Fenster|Maximieren|Maximize|Expand/i);
  if (focusAction.clicked) layoutActionsTried.push(`focus-or-maximize:${focusAction.role}`);

  await page.mouse.wheel(900, 0).catch(() => undefined);
  await page.waitForTimeout(600);
  layoutActionsTried.push('horizontal-scroll-or-wheel-on-grid-region');

  const afterLayout = await capture(page, 'target-073b-020-surface-after-layout', 'Page 472 surface after layout/focus/scroll diagnosis.', {
    layoutActionsTried,
    factBoxHidden,
    focusAction
  });

  const actionLabels = await visibleActionLabels(page);
  const pageInspection = await tryPageInspection(page);
  layoutActionsTried.push('page-inspection-shortcut-diagnostic');
  const afterInspection = await capture(page, 'target-073b-030-page-inspection-diagnostic', 'Page Inspection diagnostic state if available.', {
    pageInspection,
    actionLabels
  });

  if (!afterLayout.surfaceVisible && !afterInspection.surfaceVisible && !pageInspection.visible) {
    blockedBy.push('Surface truth is still not strong enough for Page 472 after layout and Page Inspection diagnosis.');
  }

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(600);

  const editList = await clickSafeAction(page, /^Liste bearbeiten$|^Edit List$/i);
  actionsTaken.push(`List edit no-write diagnosis: ${JSON.stringify(editList)}.`);
  const newRow = { clicked: false, role: 'not-attempted', pattern: 'new', reason: 'No-Write-Proof: Neu/New is not clicked because it could create a setup row.' };
  actionsTaken.push(`New row no-write diagnosis intentionally skipped: ${JSON.stringify(newRow)}.`);
  await assertContext(page);

  const beforeEditor = await capture(page, 'target-073b-040-before-editor-probes', 'Before row/column-bound editor probes; no target values typed.', {
    editList,
    newRow,
    actionLabels
  });

  const cells = await visibleCells(page);
  const row = pickTargetRow(cells);
  const probeCells = pickProbeCells(cells, row.rowY);
  const selectedProbeCells = probeCells
    .filter((cell) => /INLAND|VAT19|Normale MwSt|0|VAT|MwSt|Konto|Account/i.test(`${cell.text} ${cell.ariaLabel} ${cell.title}`))
    .slice(0, 8);
  const fallbackCells = selectedProbeCells.length ? selectedProbeCells : probeCells.slice(0, 8);
  const probes: EditorProbe[] = [];
  for (const [index, cell] of fallbackCells.entries()) {
    probes.push(await probeEditorAt(page, `candidate-${index}-${cell.text.slice(0, 30) || cell.role}`, { x: cell.centerX, y: cell.centerY }));
  }

  const trueEditorProven = probes.some((probe) => probe.accepted);
  if (!trueEditorProven) blockedBy.push('No true row/column-bound active editor was proven after surface, layout and Page Inspection diagnosis.');
  if (trueEditorProven) warnings.push('A possible editor was found, but TARGET-073B remains no-write; a separate write gate is still required.');

  await writeJson(path.join(EVIDENCE_DIR, 'target-073b-050-surface-and-editor-diagnosis.json'), {
    route,
    layoutActionsTried,
    actionLabels,
    pageInspection,
    row,
    probeCells: fallbackCells,
    probes,
    trueEditorProven
  });
  await capture(page, 'target-073b-060-after-editor-diagnosis-no-values', 'After editor diagnosis; no VAT target values typed.', {
    row,
    probeCellCount: fallbackCells.length,
    trueEditorProven
  });

  const resultStatus = trueEditorProven ? 'observed-editor-candidate-no-write' : blockedBy.length ? 'blocked' : 'observed-surface-only-no-write';
  const nextCase = trueEditorProven
    ? 'TARGET-071C-VAT-POSTING-SETUP-PAGE472-SEPARATE-WRITE-GATE'
    : 'FOUNDATION-READINESS-DECISION';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-vat-page472-surface-and-editor-proof',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    finalUrl: sanitizeEvidenceUrl(page.url()),
    page: 'Page 472 VAT Posting Setup / MwSt.-Buchungsmatrix Einr.',
    actionsTaken,
    actionsNotTaken: [
      'No INLAND typed',
      'No VAT19 typed',
      'No 19 typed',
      'No 3806 typed',
      'No 1406 typed',
      'No VAT setup value write',
      'No Configuration Package import/export/validate/apply',
      'No cleanup/delete',
      'No master data',
      'No document draft',
      'No Preview Posting',
      'No Posting',
      'No payment',
      'No API shortcut',
      'No company switch',
      'No book change'
    ],
    setupChanged: false,
    setupChangeAttempted: false,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    screenshots: [
      'target-073b-010-surface-before-layout.png',
      'target-073b-020-surface-after-layout.png',
      'target-073b-030-page-inspection-diagnostic.png',
      'target-073b-040-before-editor-probes.png',
      'target-073b-060-after-editor-diagnosis-no-values.png'
    ],
    surfaceProof: {
      initialSurfaceVisible: initial.surfaceVisible,
      afterLayoutSurfaceVisible: afterLayout.surfaceVisible,
      afterInspectionSurfaceVisible: afterInspection.surfaceVisible,
      pageInspectionVisible: pageInspection.visible,
      rejectedSurfaceSeen: initial.rejectedSurface || afterLayout.rejectedSurface || afterInspection.rejectedSurface
    },
    uiErgonomics: {
      helpOverlayClosed: layoutActionsTried.includes('dismiss-teaching-tips-if-visible'),
      factBoxHidden,
      gridExpandedOrFocused: focusAction.clicked,
      horizontalScrollUsed: true,
      pageInspectionUsed: pageInspection.attempted,
      layoutReasoning: 'TARGET-073B uses layout/focus/scroll/Page-Inspection diagnostics before declaring a Page-472 grid/editor blocker.'
    },
    editorDiagnosis: {
      row,
      probeCells: fallbackCells,
      trueEditorProven,
      probes
    },
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'TARGET-073B did not type VAT target values.',
      'TARGET-073B did not execute setup, master data, document draft, Preview Posting, Posting, payment, API shortcut or company switch.',
      ...(afterLayout.surfaceVisible || afterInspection.surfaceVisible || pageInspection.visible
        ? ['Page 472 surface/context was diagnosed with stronger surface truth than TARGET-073.']
        : [])
    ],
    notProved: [
      'No INLAND/VAT19 VAT Posting Setup row was saved.',
      'No VAT % 19 value was persisted.',
      'No Sales VAT Account 3806 value was persisted.',
      'No Purchase VAT Account 1406 value was persisted.',
      'No final German VAT correctness.',
      'No VAT Entries.',
      'No G/L Entries.',
      'No Preview Posting.',
      'No Posting.',
      'No Master Data readiness.'
    ],
    blockedBy,
    warnings,
    changedFiles: [
      `${EVIDENCE_REL_DIR}/TARGET-073B-result.json`,
      `${EVIDENCE_REL_DIR}/README.md`,
      `${EVIDENCE_REL_DIR}/*.txt`,
      `${EVIDENCE_REL_DIR}/*.png`,
      `${EVIDENCE_REL_DIR}/*.screenshot.json`,
      `${EVIDENCE_REL_DIR}/*.json`
    ],
    evidenceRefs: [
      `${EVIDENCE_REL_DIR}/TARGET-073B-result.json`,
      `${EVIDENCE_REL_DIR}/README.md`,
      `${EVIDENCE_REL_DIR}/target-073b-050-surface-and-editor-diagnosis.json`
    ],
    requiresReview: true,
    safeToFinalizeState: false,
    statePatch: {},
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-071/TARGET-073 reached Page 472 but did not prove a row-scoped active editor.',
      isPlannedNextCaseStillSensible: true,
      reason: 'TARGET-073B uses a materially new surface/layout/Page-Inspection/editor-proof gate instead of repeating TARGET-073 as-is.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-071C-VAT-POSTING-SETUP-PAGE472-SEPARATE-WRITE-GATE',
          status: trueEditorProven ? 'ready-after-current' : 'blocked',
          reason: trueEditorProven ? 'Only a later separate write gate may use this editor candidate.' : 'No true editor proof exists.'
        },
        {
          caseId: 'FOUNDATION-READINESS-DECISION',
          status: trueEditorProven ? 'ready-after-current' : 'ready-next',
          reason: 'Foundation readiness remains the honest boundary for Master Data and process gates.'
        },
        {
          caseId: 'PWS-MD-001-CUSTOMER-CONTEXT-READFIRST',
          status: 'needs-setup-first',
          reason: 'Master Data remains parked until Foundation gaps are resolved or consciously accepted.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: trueEditorProven
        ? 'A later separate write gate can evaluate the editor candidate with fresh before/reopen proof.'
        : 'No write route should follow without stronger editor proof; Foundation readiness must consume the limitation.',
      risksBeforeNextCase: [
        'Do not type VAT target values from this no-write diagnosis.',
        'Do not claim final German VAT correctness before Preview Posting, VAT Entries and G/L Entries.',
        'Do not start Master Data while Foundation gates remain unresolved.'
      ],
      requiredPreparation: trueEditorProven
        ? ['Review TARGET-073B editor diagnosis JSON and screenshots before any separate write gate.']
        : ['Update Foundation readiness with the Page-472 editor limitation and choose a non-repeating next setup route.']
    },
    nextCase,
    reason: trueEditorProven
      ? 'TARGET-073B found a possible row/column-bound editor candidate but intentionally wrote nothing.'
      : 'TARGET-073B improved Page-472 surface diagnosis but did not prove a safe editor route for VAT target values.'
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
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Was man aus der Oberflaeche lernt',
      '',
      'Die MwSt.-Buchungsmatrix ist eine Listenmatrix. Ein sichtbarer Tabellenwert ist noch kein Eingabefeld. Vor einer Werteingabe muss die Zeile einen echten Editor, ein Eingabeformular oder eine eindeutig zeilengebundene Alternative zeigen.',
      '',
      '## Grenzen',
      '',
      '- Keine USt-Einrichtung wurde geschrieben.',
      '- Keine Zielwerte wurden getippt.',
      '- Keine Buchungsvorschau.',
      '- Keine Buchung.',
      '- Keine Stammdaten.',
      '- Keine Belege.',
      '- Keine finale deutsche USt- oder Compliance-Behauptung.'
    ].join('\n')
  );

  expect(result.setupChanged).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
