import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-023B-DIMENSION-VALUES-ROUTE-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-023b-dimension-values-route-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-023B-result.json');

type Rect = { x: number; y: number; width: number; height: number };
type ControlEntry = {
  tag: string;
  role: string;
  ariaLabel: string;
  title: string;
  text: string;
  value: string;
  editable: boolean;
  disabled: boolean;
  rect: Rect;
};
type ValueTarget = {
  dimensionCode: string;
  valueCode: string;
  valueName: string;
};
type ValueResult = ValueTarget & {
  status: 'already-exists' | 'created' | 'blocked';
  reason: string;
  route: string;
};

const missingTargets: ValueTarget[] = [
  { dimensionCode: 'PRODUCTLINE', valueCode: 'SERVICE', valueName: 'Service' },
  { dimensionCode: 'PRODUCTLINE', valueCode: 'TRAINING', valueName: 'Training' },
  { dimensionCode: 'COSTCENTER', valueCode: 'SALES', valueName: 'Vertrieb' },
  { dimensionCode: 'COSTCENTER', valueCode: 'OPERATIONS', valueName: 'Betrieb' },
  { dimensionCode: 'CHANNEL', valueCode: 'PARTNER', valueName: 'Partner' }
];

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function buildDimensionValuesUrl(dimensionCode: string) {
  const url = buildPlaythruUrl(537);
  url.searchParams.set('filter', `'Dimension Value'.'Dimension Code' IS '${dimensionCode}'`);
  return url;
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

function sanitizeEvidenceUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  const sanitizedPath = url.pathname.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i,
    '/{tenant}/'
  );
  const kept = new URL(`${url.protocol}//${url.host}${sanitizedPath}`);
  for (const key of ['page', 'company', 'profile', 'filter']) {
    const value = url.searchParams.get(key);
    if (value) kept.searchParams.set(key, value);
  }
  return kept.toString();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
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

async function assertSafeContext(page: Page, expectedDimension?: string) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) {
    throw new Error(`Unsafe context: ${sanitizeEvidenceUrl(url)}`);
  }
  const text = await safeText(page);
  if (!/Dimensionswerte|Dimension Values|Dimensionen|Dimensions/i.test(text)) {
    throw new Error('Dimension Values context is not visible.');
  }
  const filter = new URL(url).searchParams.get('filter') ?? '';
  if (expectedDimension && !literalPattern(expectedDimension).test(text) && !filter.toUpperCase().includes(expectedDimension)) {
    throw new Error(`Dimension context ${expectedDimension} is not visible.`);
  }
  if (/Preview Posting|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Buchen\?|Ship and Invoice|Delete\?|Loeschen\?/i.test(text)) {
    throw new Error('Dangerous posting/delete/preview text is visible.');
  }
}

async function openDimensionValues(page: Page, dimensionCode: string) {
  await page.goto(buildDimensionValuesUrl(dimensionCode).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1300);
  await assertSafeContext(page, dimensionCode);
}

async function findFrameText(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (expected.test(text)) return { frame, text };
  }
  throw new Error(`No frame contains ${expected}.`);
}

async function openDimensionsPage(page: Page) {
  await page.goto(buildPlaythruUrl(536).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1300);
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) {
    throw new Error(`Unsafe dimensions context: ${sanitizeEvidenceUrl(url)}`);
  }
  return findFrameText(page, /Dimensionen|Dimensions/i);
}

async function openDimensionValuesViaRelatedAction(page: Page, dimensionCode: string) {
  let { frame } = await openDimensionsPage(page);
  const row = frame.getByRole('row', { name: literalPattern(dimensionCode) }).first();
  const textbox = frame.getByRole('textbox', { name: new RegExp(dimensionCode, 'i') }).first();
  if (await row.isVisible({ timeout: 1000 }).catch(() => false)) {
    await row.click({ timeout: 5000 }).catch(async () => row.click({ force: true, timeout: 5000 }));
  } else if (await textbox.isVisible({ timeout: 1000 }).catch(() => false)) {
    await textbox.click({ timeout: 5000 }).catch(async () => textbox.click({ force: true, timeout: 5000 }));
  } else {
    const textCell = frame.getByText(literalPattern(dimensionCode)).first();
    if (await textCell.isVisible({ timeout: 1000 }).catch(() => false)) {
      await textCell.click({ timeout: 5000 }).catch(async () => textCell.click({ force: true, timeout: 5000 }));
    } else {
      throw new Error(`${dimensionCode} row/textbox/text was not visible on Dimensions page.`);
    }
  }
  await page.waitForTimeout(600);

  if (!(await clickAction(page, /^Dimension$/i))) {
    throw new Error('Dimension action group was not visible from selected Dimensions row.');
  }
  await page.waitForTimeout(500);

  for (const scope of [page, ...page.frames()]) {
    for (const role of ['menuitem', 'button'] as const) {
      const action = scope.getByRole(role, { name: /Dimensionswerte|Dimension Values/i }).first();
      if (await action.isVisible({ timeout: 1200 }).catch(() => false)) {
        await action.click({ timeout: 5000 }).catch(async () => action.click({ force: true, timeout: 5000 }));
        await page.waitForTimeout(2500);
        ({ frame } = await findFrameText(page, /Dimensionswerte|Dimension Values/i));
        const form = frame.getByRole('form', { name: /Dimensionswerte|Dimension Values/i }).first();
        await expect(form).toBeVisible({ timeout: 10_000 });
        return { frame, form };
      }
    }
    const textAction = scope.getByText(/Dimensionswerte|Dimension Values/i).first();
    if (await textAction.isVisible({ timeout: 1200 }).catch(() => false)) {
      await textAction.click({ timeout: 5000 }).catch(async () => textAction.click({ force: true, timeout: 5000 }));
      await page.waitForTimeout(2500);
      ({ frame } = await findFrameText(page, /Dimensionswerte|Dimension Values/i));
      const form = frame.getByRole('form', { name: /Dimensionswerte|Dimension Values/i }).first();
      await expect(form).toBeVisible({ timeout: 10_000 });
      return { frame, form };
    }
  }

  throw new Error('Dimensionswerte / Dimension Values related action did not open.');
}

async function visibleGridValues(form: Locator) {
  return form.locator('input[role="textbox"], span[role="textbox"]').evaluateAll((elements) =>
    elements
      .map((element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          return element.value;
        }
        return element.textContent ?? element.getAttribute('title') ?? element.getAttribute('aria-label') ?? '';
      })
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

async function createValueByRelatedActionRoute(page: Page, target: ValueTarget): Promise<ValueResult> {
  let { form } = await openDimensionValuesViaRelatedAction(page, target.dimensionCode);
  let values = await visibleGridValues(form);
  await captureState(page, `target-023b-${target.dimensionCode.toLowerCase()}-${target.valueCode.toLowerCase()}-050-related-before`, target.dimensionCode, `Related-action route before ${target.dimensionCode}.${target.valueCode}.`, {
    values
  });
  if (values.includes(target.valueCode)) {
    return {
      ...target,
      status: 'already-exists',
      reason: `${target.dimensionCode}.${target.valueCode} ist ueber Related-Action-Route bereits sichtbar.`,
      route: 'dimension-list-related-action-route'
    };
  }

  const newRow = form.getByRole('row').last();
  const codeEditor = newRow.getByRole('textbox').nth(0);
  await codeEditor.click({ force: true, timeout: 5000 });
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.insertText(target.valueCode);
  await page.keyboard.press('Tab');
  await page.keyboard.insertText(target.valueName);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(5000);
  await captureState(page, `target-023b-${target.dimensionCode.toLowerCase()}-${target.valueCode.toLowerCase()}-060-related-after-type`, target.dimensionCode, `Related-action route after type for ${target.dimensionCode}.${target.valueCode}.`);

  ({ form } = await openDimensionValuesViaRelatedAction(page, target.dimensionCode));
  values = await visibleGridValues(form);
  await captureState(page, `target-023b-${target.dimensionCode.toLowerCase()}-${target.valueCode.toLowerCase()}-070-related-after-reopen`, target.dimensionCode, `Related-action route after reopen for ${target.dimensionCode}.${target.valueCode}.`, {
    values
  });
  if (!values.includes(target.valueCode) || !values.includes(target.valueName)) {
    return {
      ...target,
      status: 'blocked',
      reason: `${target.dimensionCode}.${target.valueCode} war nach Related-Action-Reopen nicht in den Gridwerten sichtbar.`,
      route: 'dimension-list-related-action-route'
    };
  }
  return {
    ...target,
    status: 'created',
    reason: `${target.dimensionCode}.${target.valueCode} wurde ueber Dimensionsliste -> Dimension -> Dimensionswerte angelegt und nach Reopen sichtbar.`,
    route: 'dimension-list-related-action-route'
  };
}

async function collectControlMap(page: Page) {
  const frames = await Promise.all(
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
          const entryOf = (element: HTMLElement): ControlEntry => {
            const input = element as HTMLInputElement;
            const role = normalize(element.getAttribute('role'));
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
              disabled:
                element.hasAttribute('disabled') ||
                element.getAttribute('aria-disabled') === 'true' ||
                (element as HTMLInputElement).disabled === true,
              rect: rectOf(element)
            };
          };
          const selector = [
            'button',
            '[role="button"]',
            '[role="menuitem"]',
            '[role="columnheader"]',
            '[role="gridcell"]',
            'input',
            'textarea',
            'select',
            '[role="textbox"]',
            '[role="combobox"]',
            '[contenteditable="true"]'
          ].join(',');
          const controls = Array.from(document.querySelectorAll<HTMLElement>(selector))
            .filter(visible)
            .map(entryOf)
            .filter((entry) => entry.rect.y >= 40 && entry.rect.y <= 760)
            .slice(0, 220);
          const active = document.activeElement instanceof HTMLElement ? entryOf(document.activeElement) : null;
          return { frameUrl: window.location.href, controls, active };
        })
        .catch(() => null);
      if (!raw) return null;
      const offsetX = frameBox?.x ?? 0;
      const offsetY = frameBox?.y ?? 0;
      const shift = (entry: ControlEntry) => ({
        ...entry,
        rect: {
          ...entry.rect,
          x: Math.round(entry.rect.x + offsetX),
          y: Math.round(entry.rect.y + offsetY)
        }
      });
      return {
        frameUrl: sanitizeEvidenceUrl(raw.frameUrl),
        frameOffset: { x: Math.round(offsetX), y: Math.round(offsetY) },
        controls: raw.controls.map(shift),
        active: raw.active ? shift(raw.active) : null
      };
    })
  );
  return frames
    .filter((frame): frame is NonNullable<typeof frame> => Boolean(frame))
    .filter((frame) => /businesscentral\.dynamics\.com/i.test(frame.frameUrl))
    .filter((frame) => frame.controls.length || frame.active);
}

async function compactDimensionText(page: Page) {
  return clean(
    await compactPageText(page, {
      include: [
        /Dimensionswerte|Dimension Values|Dimension|Code|Name|Neu|New|Liste bearbeiten|Edit List|PRODUCTLINE|COSTCENTER|CHANNEL|SOFTWARE|SERVICE|TRAINING|ADMIN|SALES|OPERATIONS|DIRECT|PARTNER/i
      ],
      maxLines: 180,
      maxLineLength: 220
    })
  );
}

async function captureState(page: Page, filePrefix: string, dimensionCode: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactDimensionText(page);
  const controlMap = await collectControlMap(page);
  const text = await safeText(page);
  const snapshot = {
    step,
    dimensionCode,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible: {
      dimensionCode: literalPattern(dimensionCode).test(text) || (new URL(page.url()).searchParams.get('filter') ?? '').toUpperCase().includes(dimensionCode),
      service: /\bSERVICE\b/i.test(text),
      training: /\bTRAINING\b/i.test(text),
      sales: /\bSALES\b/i.test(text),
      operations: /\bOPERATIONS\b/i.test(text),
      partner: /\bPARTNER\b/i.test(text),
      editList: /Liste bearbeiten|Edit List/i.test(text),
      newAction: /\bNeu\b|\bNew\b/i.test(text)
    },
    controlMap,
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.controls.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Dimensionswerte / Dimension Values',
    step,
    dimensionCode,
    visibleLearning:
      'Der Screenshot prueft, welche Spalten, Buttons und Zeilen auf der Dimension-Values-Seite wirklich sichtbar sind.',
    importantUi: ['Code', 'Name', 'Neu', 'Liste bearbeiten', 'gefilterter Dimensionskontext'],
    internallyProves: `Dimension Values page context for ${dimensionCode} in playthru / UNIVERSAARL-DE.`,
    doesNotProve: ['No default dimension assignment.', 'No posting or reporting effect.', 'No master data.'],
    qualityDecision: 'screenshot-qa-required',
    ...extra
  });
  return snapshot;
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

function chooseGridPoint(controlMap: Awaited<ReturnType<typeof collectControlMap>>, columnPattern: RegExp) {
  const headers = controlMap
    .flatMap((frame) => frame.controls)
    .filter((entry) => entry.role === 'columnheader')
    .filter((entry) => columnPattern.test(clean(`${entry.text} ${entry.ariaLabel} ${entry.title}`)))
    .sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x);
  const header = headers[0];
  if (!header) return null;
  return {
    header,
    x: Math.round(header.rect.x + Math.min(Math.max(header.rect.width / 2, 18), Math.max(header.rect.width - 10, 18))),
    y: Math.round(header.rect.y + header.rect.height + 18)
  };
}

async function activeElement(page: Page) {
  const maps = await collectControlMap(page);
  return maps.map((entry) => entry.active).find((entry) => entry?.editable && !entry.disabled) ?? maps.map((entry) => entry.active).find(Boolean) ?? null;
}

async function focusCell(page: Page, point: { x: number; y: number }) {
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(150);
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(350);
  let active = await activeElement(page);
  if (!active?.editable) {
    await page.keyboard.press('Enter').catch(() => undefined);
    await page.waitForTimeout(350);
    active = await activeElement(page);
  }
  return active;
}

async function typeActive(page: Page, value: string) {
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 15 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(650);
}

async function visibleValue(page: Page, target: ValueTarget) {
  await openDimensionValues(page, target.dimensionCode);
  const text = await safeText(page);
  return literalPattern(target.valueCode).test(text);
}

async function createValueByHeaderRoute(page: Page, target: ValueTarget): Promise<ValueResult> {
  if (await visibleValue(page, target)) {
    return { ...target, status: 'already-exists', reason: `${target.dimensionCode}.${target.valueCode} ist bereits sichtbar.`, route: 'filtered-reopen-check' };
  }

  await captureState(page, `target-023b-${target.dimensionCode.toLowerCase()}-${target.valueCode.toLowerCase()}-010-before`, target.dimensionCode, `Before route recovery for ${target.dimensionCode}.${target.valueCode}.`);

  const editClicked = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
  await assertSafeContext(page, target.dimensionCode);
  const newClicked = await clickAction(page, /^Neu$|^New$/i);
  await page.waitForTimeout(800);
  const afterNew = await captureState(page, `target-023b-${target.dimensionCode.toLowerCase()}-${target.valueCode.toLowerCase()}-020-after-new`, target.dimensionCode, `After Edit List/New for ${target.dimensionCode}.${target.valueCode}.`, {
    editClicked,
    newClicked
  });

  const codePoint = chooseGridPoint(afterNew.controlMap, /^Code\b/i);
  const namePoint = chooseGridPoint(afterNew.controlMap, /^Name\b/i);
  if (!editClicked || !newClicked || !codePoint || !namePoint) {
    return createValueByRelatedActionRoute(page, target);
  }

  const codeActive = await focusCell(page, codePoint);
  if (!codeActive?.editable) {
    return createValueByRelatedActionRoute(page, target);
  }
  await typeActive(page, target.valueCode);
  const nameActive = await activeElement(page);
  if (!nameActive?.editable) {
    const fallbackNameActive = await focusCell(page, namePoint);
    if (!fallbackNameActive?.editable) {
      return createValueByRelatedActionRoute(page, target);
    }
  }
  await typeActive(page, target.valueName);
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(1800);
  await captureState(page, `target-023b-${target.dimensionCode.toLowerCase()}-${target.valueCode.toLowerCase()}-030-after-type`, target.dimensionCode, `After value entry attempt for ${target.dimensionCode}.${target.valueCode}.`, {
    codePoint,
    namePoint,
    codeActive,
    nameActive: await activeElement(page)
  });

  if (!(await visibleValue(page, target))) {
    await captureState(page, `target-023b-${target.dimensionCode.toLowerCase()}-${target.valueCode.toLowerCase()}-040-after-reopen-blocked`, target.dimensionCode, `After reopen blocked check for ${target.dimensionCode}.${target.valueCode}.`);
    return createValueByRelatedActionRoute(page, target);
  }

  await captureState(page, `target-023b-${target.dimensionCode.toLowerCase()}-${target.valueCode.toLowerCase()}-040-after-reopen`, target.dimensionCode, `After reopen proof for ${target.dimensionCode}.${target.valueCode}.`);
  return {
    ...target,
    status: 'created',
    reason: `${target.dimensionCode}.${target.valueCode} wurde ueber gefilterte Header-Route angelegt und nach Reopen sichtbar.`,
    route: 'filtered-header-point-route'
  };
}

test('TARGET-023B recovers missing Universaarl Dimension Values route', async ({ page }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const valueResults: ValueResult[] = [];
  const blockedBy: string[] = [];
  let setupWriteAttempted = false;

  for (const target of missingTargets) {
    const result = await createValueByHeaderRoute(page, target);
    valueResults.push(result);
    if (result.status === 'created') setupWriteAttempted = true;
    if (result.status === 'blocked') blockedBy.push(`${target.dimensionCode}.${target.valueCode}: ${result.reason}`);
  }

  for (const dimensionCode of [...new Set(missingTargets.map((entry) => entry.dimensionCode))]) {
    await openDimensionValues(page, dimensionCode);
    await captureState(page, `target-023b-${dimensionCode.toLowerCase()}-090-final-reopen`, dimensionCode, `Final reopen proof for ${dimensionCode}.`);
  }

  const createdOrVisible = valueResults.filter((entry) => entry.status === 'created' || entry.status === 'already-exists');
  const allVisible = createdOrVisible.length === missingTargets.length && blockedBy.length === 0;
  const resultStatus = allVisible ? 'observed' : createdOrVisible.length ? 'partial-observed' : 'blocked';
  const nextCase = allVisible ? 'TARGET-024B-GLOBAL-DIMENSION-ASSIGNMENT' : 'TARGET-023C-DIMENSION-VALUE-PAGE-INSPECTION-OR-MANUAL-RECOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-dimension-values-route-recovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    valueResults,
    proved: [
      'Dimension Values page 537 was operated only in playthru / UNIVERSAARL-DE.',
      'The route used filtered Dimension Values pages and visual Code/Name column headers as anchors.',
      ...valueResults
        .filter((entry) => entry.status === 'created')
        .map((entry) => `${entry.dimensionCode}.${entry.valueCode} is visible after reopen.`),
      ...valueResults
        .filter((entry) => entry.status === 'already-exists')
        .map((entry) => `${entry.dimensionCode}.${entry.valueCode} was already visible before write attempt.`),
      'No master data, document draft, preview posting, posting, company switch or API shortcut was executed.'
    ],
    notProved: [
      ...(allVisible ? [] : ['Not all missing Dimension Values are visible after route recovery.']),
      'No Global Dimension Code 1/2 assignment is proven.',
      'No Default Dimensions for master data are proven.',
      'No Dimension Set Entries, posted entries or reporting filters are proven.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-023B-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.controls.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-023b-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-023B-result.json`,
      ...[...new Set(missingTargets.map((entry) => entry.dimensionCode))].map(
        (dimensionCode) => `playwright/projects/fibu-book5/img/target-023b-${dimensionCode.toLowerCase()}-090-final-reopen.png`
      )
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      setupWriteAttempted,
      setupChanged: valueResults.some((entry) => entry.status === 'created')
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-024-CORE-MASTERDATA-PLAN',
      lastEvidenceSummary:
        'TARGET-023 proved the three Dimension Codes and first Dimension Values, but five remaining values were blocked by the prior cell-edit route.',
      isPlannedNextCaseStillSensible: allVisible,
      reason: allVisible
        ? 'All planned starter Dimension Values are now visible; master data can use the foundation after Global Dimension assignment is handled.'
        : 'Dimension values are still incomplete; master data should not start until the remaining value route is resolved or consciously parked.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-024B-GLOBAL-DIMENSION-ASSIGNMENT',
          status: allVisible ? 'ready-next' : 'needs-setup-first',
          reason: 'PRODUCTLINE and COSTCENTER can become Global Dimension Code 1/2 only after values are complete enough.'
        },
        {
          caseId: 'TARGET-024-CORE-MASTERDATA-PLAN',
          status: allVisible ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Customer/vendor/item planning should reference finished dimensions and values.'
        },
        {
          caseId: 'TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Template defaults need posting groups, VAT and dimension/default-dimension decisions.'
        },
        {
          caseId: 'TARGET-026-VAT-SETUP-FIT-DECISION',
          status: 'needs-source-check-first',
          reason: 'German VAT setup needs source-backed setup decision before documents.'
        },
        {
          caseId: 'TARGET-027-FIRST-MASTERDATA-CANDIDATE',
          status: 'needs-setup-first',
          reason: 'First master data should wait for foundation setup and default dimensions.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: allVisible
        ? 'The dimension-value blocker is gone; the next dependency is Global Dimension assignment before master data.'
        : 'Repeating header typing would not add value; the next case must use Page Inspection/Personalize/manual recovery or explicitly park missing values.',
      risksBeforeNextCase: [
        'Do not claim reporting readiness before posted entries with dimensions exist.',
        'Do not create master data until default dimension strategy is clear.',
        'Do not treat Global Dimension Code 1/2 as assigned by this case.'
      ],
      requiredPreparation: allVisible
        ? ['Open General Ledger Setup and prove/set Global Dimension Code 1/2 in a separate case.']
        : ['Review TARGET-023B control maps and avoid repeating the same header-cell route without a new mechanism.']
    },
    blockedBy,
    warnings: [
      'TARGET-023B is setup foundation only.',
      'Screenshots are debugging/setup evidence, not final book screenshots unless later curated.'
    ],
    requiresReview: !allVisible,
    safeToFinalizeState: allVisible,
    statePatch: {},
    reason: allVisible
      ? 'TARGET-023B recovered all missing Dimension Values with reopen proof.'
      : `TARGET-023B recovered ${createdOrVisible.length}/${missingTargets.length} missing Dimension Values.`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-023B Dimension Values Route Recovery',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Werte',
      '',
      ...valueResults.map((entry) => `- ${entry.dimensionCode}.${entry.valueCode}: ${entry.status} - ${entry.reason}`),
      '',
      '## UI-Learning',
      '',
      '- Die gefilterte Dimensionswerte-Seite muss vor dem Schreiben als richtiger Dimensionskontext sichtbar sein.',
      '- `Liste bearbeiten`, `Neu`, `Code` und `Name` werden als sichtbare Controls/Spalten dokumentiert.',
      '- Ein Wert zaehlt erst, wenn er nach erneutem Oeffnen der gefilterten Seite sichtbar ist.',
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Keine Global-Dimension-Zuweisung.',
      '- Keine Preview und keine Buchung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
