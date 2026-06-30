import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016J-NUMBER-SERIES-LINES-TRUE-EDITOR-OR-ASSISTED-SETUP-FALLBACK';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016j-number-series-lines-true-editor-or-assisted-setup-fallback';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016J-result.json');

const target = {
  code: 'U-CUST',
  startingDate: '01.01.2026',
  startingNo: 'U-CUST00001',
  endingNo: 'U-CUST99999'
};

type Rect = { x: number; y: number; width: number; height: number };
type CellCandidate = {
  label: string;
  headerText: string;
  x: number;
  y: number;
  rect: Rect;
};
type ActiveEditor = {
  tag: string;
  role: string;
  ariaLabel: string;
  title: string;
  text: string;
  value: string;
  isEditable: boolean;
  rect: Rect | null;
  nearestCellText: string;
};
type EditorAttempt = {
  label: string;
  point?: { x: number; y: number };
  before?: ActiveEditor | null;
  afterClick?: ActiveEditor | null;
  afterEnter?: ActiveEditor | null;
  editableProven: boolean;
  reason: string;
};

function buildPlaythruUrl(pageId = 456) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const sanitizedPath = url.pathname.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
      '/{tenant}/'
    );
    const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
    for (const key of ['page', 'company', 'profile']) {
      const value = url.searchParams.get(key);
      if (value) kept.searchParams.set(key, value);
    }
    return kept.toString();
  } catch {
    return rawUrl.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant}');
  }
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function literalPattern(value: string) {
  return new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    finalScreenshotStatus: 'debugging-not-book-final',
    ...metadata
  });
}

async function safeText(page: Page) {
  return clean(await pageText(page));
}

async function assertSafeContext(page: Page) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) {
    throw new Error(`Unsafe context: ${sanitizeEvidenceUrl(url)}`);
  }
  const text = await safeText(page);
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Number Series or Number Series Lines context is not visible.');
  }
  if (/Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Buchen\?|Delete\?|Loeschen\?|Ship and Invoice|Preview Posting/i.test(text)) {
    throw new Error('Dangerous posting/delete/preview text is visible.');
  }
}

async function clickAction(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 900 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(700);
        return true;
      }
    }
  }
  return false;
}

async function selectSeriesRow(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const row = scope.getByRole('row', { name: literalPattern(target.code) }).first();
    if (await row.isVisible({ timeout: 900 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
    const code = scope.getByText(literalPattern(target.code)).first();
    if (await code.isVisible({ timeout: 900 }).catch(() => false)) {
      await code.click({ timeout: 5000 }).catch(async () => code.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

async function openUCustLines(page: Page) {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeContext(page);
  if (!(await selectSeriesRow(page))) throw new Error('U-CUST row could not be selected.');
  if (!(await clickAction(page, /^Zeilen$|^Lines$/i))) throw new Error('Zeilen/Lines action could not be opened.');
  await page.waitForTimeout(900);
  await assertSafeContext(page);
}

async function collectGridDiagnostics(page: Page) {
  const frameResults = await Promise.all(
    page.frames().map(async (frame) => {
      const frameBox = await frame.frameElement().then((element) => element.boundingBox()).catch(() => null);
      const raw = await frame
        .evaluate(() => {
          const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          };
          const rectOf = (element: Element) => {
            const rect = element.getBoundingClientRect();
            return {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            };
          };
          const active = document.activeElement as HTMLInputElement | HTMLElement | null;
          const describe = (element: Element | null): ActiveEditor | null => {
            if (!element) return null;
            const input = element as HTMLInputElement;
            const nearestCell = element.closest<HTMLElement>('[role="gridcell"],td,[role="cell"]');
            const role = normalize(element.getAttribute('role'));
            return {
              tag: element.tagName,
              role,
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              text: normalize((element as HTMLElement).innerText || element.textContent).slice(0, 260),
              value: normalize('value' in input ? input.value : ''),
              isEditable:
                /INPUT|TEXTAREA|SELECT/.test(element.tagName) ||
                element.getAttribute('contenteditable') === 'true' ||
                /textbox|combobox|spinbutton/.test(role),
              rect: visible(element) ? rectOf(element) : null,
              nearestCellText: normalize(nearestCell?.innerText || nearestCell?.textContent).slice(0, 260)
            };
          };
          const cells = Array.from(document.querySelectorAll<HTMLElement>('[role="gridcell"],td,[role="cell"],input,textarea,select,[role="textbox"],[role="combobox"],[contenteditable="true"]'))
            .filter(visible)
            .map((element) => {
              const input = element as HTMLInputElement;
              const role = normalize(element.getAttribute('role'));
              const rect = rectOf(element);
              return {
                tag: element.tagName,
                role,
                ariaLabel: normalize(element.getAttribute('aria-label')),
                title: normalize(element.getAttribute('title')),
                text: normalize(element.innerText || element.textContent).slice(0, 220),
                value: normalize('value' in input ? input.value : ''),
                editable:
                  /INPUT|TEXTAREA|SELECT/.test(element.tagName) ||
                  element.getAttribute('contenteditable') === 'true' ||
                  /textbox|combobox|spinbutton/.test(role),
                rect
              };
            })
            .filter((entry) => {
              const haystack = `${entry.ariaLabel} ${entry.title} ${entry.text} ${entry.value} ${entry.role}`;
              return entry.rect.y >= 80 && entry.rect.y <= 470 && /Startdatum|Startnr|Endnr|Starting|Ending|Offen|Luecken|Lücken|gridcell|textbox|combobox/i.test(haystack);
            })
            .slice(0, 140);
          const headers = Array.from(document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-label],[title],span,a'))
            .filter(visible)
            .map((element) => ({
              tag: element.tagName,
              role: normalize(element.getAttribute('role')),
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title')).slice(0, 180),
              rect: rectOf(element)
            }))
            .filter((entry) => {
              const haystack = `${entry.ariaLabel} ${entry.title} ${entry.text}`;
              return entry.rect.y >= 80 && entry.rect.y <= 250 && /Startdatum|Startnr|Endnr|Starting|Ending|Offen|Luecken|Lücken/i.test(haystack);
            })
            .slice(0, 80);
          return {
            frameUrl: window.location.href,
            activeElement: describe(active),
            headers,
            cells
          };
        })
        .catch(() => null);
      if (!raw) return null;
      const offsetX = frameBox?.x ?? 0;
      const offsetY = frameBox?.y ?? 0;
      const shiftRect = (rect: Rect | null) =>
        rect
          ? {
              ...rect,
              x: Math.round(rect.x + offsetX),
              y: Math.round(rect.y + offsetY)
            }
          : null;
      return {
        ...raw,
        frameOffset: { x: Math.round(offsetX), y: Math.round(offsetY) },
        activeElement: raw.activeElement ? { ...raw.activeElement, rect: shiftRect(raw.activeElement.rect) } : null,
        headers: raw.headers.map((header) => ({ ...header, rect: shiftRect(header.rect)! })),
        cells: raw.cells.map((cell) => ({ ...cell, rect: shiftRect(cell.rect)! }))
      };
    })
  );
  return frameResults
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .filter((entry) => /businesscentral\.dynamics\.com/i.test(entry.frameUrl))
    .map((entry) => ({ ...entry, frameUrl: sanitizeEvidenceUrl(entry.frameUrl) }))
    .filter((entry) => entry.headers.length || entry.cells.length || entry.activeElement);
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await safeText(page);
  const compact = await compactPageText(page, {
    include: [/Nr\.-Serienzeilen|Nummernserie|U-CUST|Startdatum|Startnr|Endnr|Letzte Nr|Warnungsnr|Erhohung|Erhöhung|Luecken|Lücken|Offen|Liste bearbeiten|Neu|New/i],
    maxLines: 180,
    maxLineLength: 220
  });
  const diagnostics = await collectGridDiagnostics(page);
  const visible = {
    targetCode: literalPattern(target.code).test(text),
    startingDate: /01\.01\.2026|1\/1\/2026|2026-01-01/.test(text),
    startingNo: literalPattern(target.startingNo).test(text),
    endingNo: literalPattern(target.endingNo).test(text),
    openCheckboxText: /Offen|Open/i.test(text),
    gapCheckboxText: /Luecken|Lücken|Gaps/i.test(text)
  };
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible,
    diagnostics,
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    visibleLearning:
      'Der Screenshot muss zeigen, ob Startdatum, Startnr., Endnr. und die Checkboxspalten in der U-CUST-Lines-Seite wirklich sichtbar sind.',
    importantUi: ['Startdatum', 'Startnr.', 'Endnr.', 'Luecken in Nummern zulassen', 'Offen', 'Sternzeile'],
    internallyProves: 'Foreground Number Series Lines state for U-CUST in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No setup assignment.',
      'No master data.',
      'No preview posting.',
      'No posting.',
      'No checkbox change.'
    ],
    qualityDecision: 'requires-visual-qa',
    visible,
    ...extra
  });
  return snapshot;
}

function chooseCellCandidate(diagnostics: Awaited<ReturnType<typeof collectGridDiagnostics>>, label: string, headerPattern: RegExp): CellCandidate | null {
  const allHeaders = diagnostics
    .flatMap((frame) => frame.headers)
    .filter((header) => header.role === 'columnheader')
    .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
  const startDateHeader = allHeaders.find((header) => /^Startdatum|^Starting Date/i.test(clean(`${header.text} ${header.ariaLabel} ${header.title}`)));
  const headers = allHeaders
    .filter((header) => headerPattern.test(clean(`${header.text} ${header.ariaLabel} ${header.title}`)))
    .filter((header) => {
      if (!startDateHeader) return true;
      const sameHeaderBand = Math.abs(header.rect.y - startDateHeader.rect.y) <= 24;
      const inLinesGrid = header.rect.x >= startDateHeader.rect.x - 20 && header.rect.x <= startDateHeader.rect.x + 950;
      const notBeforeStartDate = label === 'Startdatum' || header.rect.x > startDateHeader.rect.x + 35;
      return sameHeaderBand && inLinesGrid && notBeforeStartDate;
    })
    .sort((left, right) => left.rect.x - right.rect.x);
  const header = headers[0];
  if (!header) return null;
  return {
    label,
    headerText: clean(`${header.text} ${header.ariaLabel}`),
    x: header.rect.x + Math.min(Math.max(header.rect.width / 2, 16), Math.max(header.rect.width - 8, 16)),
    y: header.rect.y + header.rect.height + 12,
    rect: header.rect
  };
}

async function activeEditor(page: Page) {
  const diagnostics = await collectGridDiagnostics(page);
  const activeElements = diagnostics.map((entry) => entry.activeElement).filter(Boolean);
  return (
    activeElements.find((entry) => entry?.isEditable) ??
    activeElements.find((entry) => entry && !/IFRAME|BODY/i.test(entry.tag)) ??
    activeElements.at(0) ??
    null
  );
}

async function probeEditor(page: Page, candidate: CellCandidate | null): Promise<EditorAttempt> {
  if (!candidate) {
    return { label: 'missing', editableProven: false, reason: 'No matching visible column header found.' };
  }
  const before = await activeEditor(page);
  await page.mouse.move(candidate.x, candidate.y);
  await page.waitForTimeout(250);
  await page.mouse.click(candidate.x, candidate.y);
  await page.waitForTimeout(450);
  const afterClick = await activeEditor(page);
  let afterEnter: ActiveEditor | null = null;
  if (!afterClick?.isEditable) {
    await page.keyboard.press('Enter').catch(() => undefined);
    await page.waitForTimeout(450);
    afterEnter = await activeEditor(page);
  }
  const proven = Boolean(afterEnter?.isEditable || afterClick?.isEditable);
  return {
    label: candidate.label,
    point: { x: Math.round(candidate.x), y: Math.round(candidate.y) },
    before,
    afterClick,
    afterEnter,
    editableProven: proven,
    reason: proven ? 'A real editable active element was detected after cell focus.' : 'Cell focus did not expose a real editable active element.'
  };
}

async function typeViaProvenEditor(page: Page, value: string) {
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 15 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
}

test('TARGET-016J proves true editor before Number Series Lines value entry', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let setupWriteAttempted = false;

  await openUCustLines(page);
  const before = await captureState(page, 'target-016j-010-u-cust-lines-before-editor-probe', 'U-CUST Lines before true-editor probe.');

  const editListClicked = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
  await assertSafeContext(page);
  const afterEditMode = await captureState(page, 'target-016j-020-after-edit-list-and-diagnostics', 'After scoped Edit List / diagnostics.', {
    editListClicked
  });

  const startDateCandidate = chooseCellCandidate(afterEditMode.diagnostics, 'Startdatum', /^Startdatum|^Starting Date/i);
  const startNoCandidate = chooseCellCandidate(afterEditMode.diagnostics, 'Startnr.', /^Startnr\.?|^Starting No\.?/i);
  const endNoCandidate = chooseCellCandidate(afterEditMode.diagnostics, 'Endnr.', /^Endnr\.?|^Ending No\.?/i);

  const startDateProbe = await probeEditor(page, startDateCandidate);
  const startNoProbe = await probeEditor(page, startNoCandidate);
  const endNoProbe = await probeEditor(page, endNoCandidate);
  await assertSafeContext(page);
  await captureState(page, 'target-016j-030-after-true-editor-probes', 'After true-editor probes.', {
    startDateProbe,
    startNoProbe,
    endNoProbe
  });

  const canWrite =
    Boolean(startDateCandidate && startNoCandidate && endNoCandidate) &&
    startDateProbe.editableProven &&
    startNoProbe.editableProven &&
    endNoProbe.editableProven;

  if (canWrite) {
    setupWriteAttempted = true;
    await page.mouse.click(startDateCandidate!.x, startDateCandidate!.y);
    await page.keyboard.press('Enter').catch(() => undefined);
    await typeViaProvenEditor(page, target.startingDate);
    await page.mouse.click(startNoCandidate!.x, startNoCandidate!.y);
    await page.keyboard.press('Enter').catch(() => undefined);
    await typeViaProvenEditor(page, target.startingNo);
    await page.mouse.click(endNoCandidate!.x, endNoCandidate!.y);
    await page.keyboard.press('Enter').catch(() => undefined);
    await typeViaProvenEditor(page, target.endingNo);
    await page.keyboard.press('Enter').catch(() => undefined);
    await page.waitForTimeout(1200);
  } else {
    blockedBy.push('True editable active element was not proven for Startdatum, Startnr. and Endnr.; no value typing was allowed.');
  }

  await assertSafeContext(page);
  const afterAttempt = await captureState(page, 'target-016j-040-after-conditional-value-attempt', 'After conditional value attempt or no-write stop.', {
    canWrite,
    setupWriteAttempted,
    startDateProbe,
    startNoProbe,
    endNoProbe
  });

  await openUCustLines(page);
  const afterReopen = await captureState(page, 'target-016j-050-after-reopen-proof', 'After reopening U-CUST Lines for persistence proof.', {
    canWrite,
    setupWriteAttempted
  });

  const persisted = afterReopen.visible.startingNo && afterReopen.visible.endingNo;
  if (setupWriteAttempted && !persisted) blockedBy.push('Conditional true-editor route did not prove U-CUST Startnr./Endnr. persistence after reopen.');

  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted
    ? 'TARGET-016K-NUMBER-SERIES-REMAINING-LINES-TRUE-EDITOR-WRITE-GATE'
    : 'TARGET-016K-NUMBER-SERIES-ASSISTED-SETUP-OR-CONFIG-PACKAGE-FALLBACK';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-lines-true-editor-diagnostic',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    targetValues: target,
    proved: [
      'U-CUST Number Series Lines context was opened in playthru / UNIVERSAARL-DE.',
      `Scoped Liste bearbeiten / Edit List was ${editListClicked ? 'clicked' : 'not visible/clickable'}.`,
      'True-editor diagnostics were captured for Startdatum, Startnr. and Endnr. before any allowed value typing.',
      ...(setupWriteAttempted ? ['Value typing was attempted only after editable active-element proof.'] : ['No value typing was attempted because no true editor was proven for all required cells.']),
      ...(persisted ? ['U-CUST Startnr./Endnr. values are visible after reopen.'] : []),
      'No setup assignment, master data, preview posting or posting was executed.'
    ],
    notProved: [
      ...(persisted
        ? ['Only U-CUST was fitted; remaining U-* number-series lines still need controlled execution.']
        : ['A reliable persistent U-CUST Number Series Lines write route is still not proven.']),
      'No customer/vendor/item/document numbering assignment is proven.',
      'No German legal invoice-number compliance claim is made.',
      'The Number Series Line checkboxes were observed but not changed.'
    ],
    snapshots: { before, afterEditMode, afterAttempt, afterReopen },
    editorProbes: { startDateProbe, startNoProbe, endNoProbe },
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016j-number-series-lines-true-editor-or-assisted-setup-fallback/TARGET-016J-result.json',
      'playwright/projects/fibu-book5/evidence/target-016j-number-series-lines-true-editor-or-assisted-setup-fallback/README.md',
      'playwright/projects/fibu-book5/evidence/target-016j-number-series-lines-true-editor-or-assisted-setup-fallback/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016j-number-series-lines-true-editor-or-assisted-setup-fallback/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016j-number-series-lines-true-editor-or-assisted-setup-fallback/*.txt',
      'playwright/projects/fibu-book5/img/target-016j-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016j-number-series-lines-true-editor-or-assisted-setup-fallback/TARGET-016J-result.json',
      'playwright/projects/fibu-book5/img/target-016j-010-u-cust-lines-before-editor-probe.png',
      'playwright/projects/fibu-book5/img/target-016j-020-after-edit-list-and-diagnostics.png',
      'playwright/projects/fibu-book5/img/target-016j-030-after-true-editor-probes.png',
      'playwright/projects/fibu-book5/img/target-016j-040-after-conditional-value-attempt.png',
      'playwright/projects/fibu-book5/img/target-016j-050-after-reopen-proof.png'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookChange: true,
      noSetupAssignment: true,
      checkboxChanged: false,
      setupWriteAttempted,
      setupChanged: persisted && setupWriteAttempted
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-016I showed the visible U-CUST star row and proved that scoped Neu/New plus header-cell typing did not persist Startnr./Endnr.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The next step must prove a true active editor or reject the route before another write attempt.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: persisted ? 'ready-next' : 'replace-with-better-case',
          reason: persisted
            ? 'The proven editor route can be scaled to remaining U-* number-series lines.'
            : 'The visible grid editor route still does not provide a reliable persistence path.'
        },
        {
          caseId: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT',
          status: persisted ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Setup assignment requires number-series line ranges first.'
        },
        {
          caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Customer creation waits for assigned customer number series and posting setup.'
        },
        {
          caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups can proceed after number series is either completed or consciously parked.'
        },
        {
          caseId: 'TARGET-020-VAT-SETUP-READINESS',
          status: 'ready-after-current',
          reason: 'VAT setup remains a parallel foundation dependency.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'U-CUST now has a proven route; the remaining U-* line ranges can reuse it.'
        : 'Further grid typing would repeat a rejected route; a source-backed fallback such as Assisted Setup or configuration-package UI must be chosen.',
      risksBeforeNextCase: [
        'Do not assign setup pages before line persistence proof.',
        'Do not change gap/open checkboxes without their own gate.',
        'Do not create master data yet.'
      ],
      requiredPreparation: persisted
        ? ['Prepare target ranges for the remaining U-* number-series lines.']
        : ['Review TARGET-016J diagnostics and choose Assisted Setup/configuration-package UI fallback instead of more cell typing.']
    },
    warnings,
    blockedBy,
    requiresReview: !persisted,
    safeToFinalizeState: persisted,
    reason: persisted
      ? 'TARGET-016J proved U-CUST Number Series Lines true-editor persistence with reopen proof.'
      : 'TARGET-016J did not prove a reliable persistent U-CUST Number Series Lines value route; grid typing remains blocked.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016J Number Series Lines True Editor',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## UI-Learning',
      '',
      '- Eine sichtbare Sternzeile ist noch kein Editorbeweis.',
      '- `Startdatum`, `Startnr.` und `Endnr.` muessen als aktive editierbare Controls oder durch Reopen-Persistenz bewiesen werden.',
      '- `Offen` und `Luecken in Nummern zulassen` sind fachlich relevante Checkboxen; sie wurden nicht geaendert.',
      '',
      '## Grenzen',
      '',
      '- Keine Setup-Zuweisung.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
