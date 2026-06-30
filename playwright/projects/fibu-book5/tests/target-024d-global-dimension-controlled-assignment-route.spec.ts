import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-024D-GLOBAL-DIMENSION-CONTROLLED-ASSIGNMENT-ROUTE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-024d-global-dimension-controlled-assignment-route';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-024D-result.json');

type Rect = { x: number; y: number; width: number; height: number };
type ControlEntry = {
  tag: string;
  role: string;
  ariaLabel: string;
  title: string;
  text: string;
  value: string;
  disabled: boolean;
  readOnly: boolean;
  rect: Rect;
};
type FrameControlMap = {
  frameIndex: number;
  frameUrl: string;
  frameOffset: { x: number; y: number };
  controls: ControlEntry[];
  active: ControlEntry | null;
};
type DimensionRowMap = {
  caption: string;
  label: ControlEntry | null;
  rowControls: ControlEntry[];
  leftEditableControls: ControlEntry[];
  rightReadOnlyOrDisabledControls: ControlEntry[];
};

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

function sanitizeEvidenceUrl(rawUrl: string) {
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
}

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function dangerousText(text: string) {
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Preview Posting|Buchungsvorschau|Delete\?|Loeschen\?|Ship and Invoice|Liefern und fakturieren/i.test(
    text
  );
}

function isEvidenceNoise(line: string) {
  return /trustedOriginAuthorities|allowedEndpoints|allowedResources|clientId|authority:|parentPageOrigin|upn:|requestExecutorSettings|originAuthorityValidator|O365SuiteServiceProxy|login\.microsoftonline\.com|graph\.microsoft\.com|officeapps\.live\.com|officeshell/i.test(
    line
  );
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function writeText(fileName: string, content: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.writeFile(path.join(EVIDENCE_DIR, fileName), `${content.replace(/\r\n?/g, '\n').trim()}\n`, 'utf8');
}

async function safeText(page: Page) {
  return clean(await pageText(page));
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
    finalScreenshotStatus: 'universaarl-controlled-setup-proof-candidate',
    ...metadata
  });
}

async function assertSafeTargetContext(page: Page, expectedText: RegExp) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) {
    throw new Error(`Unsafe context: ${sanitizeEvidenceUrl(url)}`);
  }
  const text = await safeText(page);
  if (!expectedText.test(text)) {
    throw new Error(`Expected page context not visible: ${expectedText}`);
  }
  if (dangerousText(text)) {
    throw new Error('Dangerous posting/preview/delete text is visible.');
  }
}

async function openGeneralLedgerSetup(page: Page) {
  await page.goto(buildPlaythruUrl(118).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1500);
  await assertSafeTargetContext(page, /Finanzbuchhaltung Einrichtung|General Ledger Setup|Sachbuchhaltung Einrichtung/i);
}

async function clickEditMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const candidate of [
      scope
        .locator(
          [
            'button[title*="Aenderungen"]',
            'button[title*="Anderungen"]',
            'button[title*="changes" i]',
            'button[title*="Edit" i]',
            'button[aria-label*="Aenderungen"]',
            'button[aria-label*="Anderungen"]',
            'button[aria-label*="Edit" i]'
          ].join(',')
        )
        .first(),
      scope.getByRole('button', { name: /^Bearbeiten$|^Edit$/i }).first()
    ]) {
      if ((await candidate.isVisible({ timeout: 700 }).catch(() => false)) && (await candidate.isEnabled({ timeout: 700 }).catch(() => false))) {
        await candidate.click({ timeout: 3000 }).catch(async () => candidate.click({ force: true, timeout: 3000 }));
        await page.waitForTimeout(1000);
        return true;
      }
    }
  }
  return false;
}

async function expandDimensionsArea(page: Page) {
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(500);
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.getByRole('button', { name: /^Mehr anzeigen$|^Show more$/i }).last(),
      scope.getByText(/^Mehr anzeigen$|^Show more$/i).last(),
      scope.getByText(/Dimensionen|Dimensions/i).last()
    ]) {
      if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
        await locator.scrollIntoViewIfNeeded({ timeout: 1500 }).catch(() => undefined);
        const text = clean((await locator.innerText({ timeout: 500 }).catch(() => '')) || '');
        if (/Mehr anzeigen|Show more/i.test(text)) {
          await locator.click({ timeout: 2500 }).catch(() => undefined);
          await page.waitForTimeout(700);
        }
        return true;
      }
    }
  }
  return false;
}

async function clickGlobalDimensionsAction(page: Page) {
  const actionPattern = /Globale Dimensionen (?:a|\u00e4)ndern|Change Global Dimensions/i;
  for (const scope of [page, ...page.frames()]) {
    for (const locator of [
      scope.getByRole('button', { name: actionPattern }).first(),
      scope.getByRole('menuitem', { name: actionPattern }).first(),
      scope.getByText(actionPattern).first()
    ]) {
      if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ force: true, timeout: 5000 }));
        await page.waitForTimeout(1800);
        return true;
      }
    }
  }
  return false;
}

async function clickSequentialRunAction(page: Page) {
  const actionPattern = /^Fortlaufend$|^Sequential$/i;
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name: actionPattern }).first();
      if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
        if (!(await locator.isEnabled({ timeout: 800 }).catch(() => false))) {
          return 'disabled';
        }
        await locator.click({ timeout: 5000 }).catch(async () => locator.click({ force: true, timeout: 5000 }));
        await page.waitForTimeout(700);
        for (const startScope of [page, ...page.frames()]) {
          for (const startRole of ['button', 'menuitem'] as const) {
            const startAction = startScope.getByRole(startRole, { name: /^Starten$|^Start$/i }).first();
            if (await startAction.isVisible({ timeout: 1200 }).catch(() => false)) {
              if (!(await startAction.isEnabled({ timeout: 800 }).catch(() => false))) {
                return 'start-disabled';
              }
              await startAction.click({ timeout: 5000 }).catch(async () => startAction.click({ force: true, timeout: 5000 }));
              await page.waitForTimeout(6000);
              return 'start-clicked';
            }
          }
        }
        return 'tab-clicked-no-start-action';
      }
    }
  }
  return 'not-visible';
}

async function collectControlMap(page: Page): Promise<FrameControlMap[]> {
  const maps = await Promise.all(
    page.frames().map(async (frame, frameIndex) => {
      const frameBox = await frame
        .frameElement()
        .then((element) => element.boundingBox())
        .catch(() => null);
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
            return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
          };
          const entryOf = (element: HTMLElement): ControlEntry => {
            const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
            const role = normalize(element.getAttribute('role'));
            return {
              tag: element.tagName,
              role,
              ariaLabel: normalize(element.getAttribute('aria-label')),
              title: normalize(element.getAttribute('title')),
              text: normalize(element.innerText || element.textContent).slice(0, 240),
              value: normalize('value' in input ? input.value : ''),
              disabled: Boolean('disabled' in input && input.disabled) || element.getAttribute('aria-disabled') === 'true',
              readOnly: Boolean('readOnly' in input && input.readOnly) || element.getAttribute('aria-readonly') === 'true',
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
            '[contenteditable="true"]',
            'label',
            '[aria-label]',
            '[title]'
          ].join(',');
          const controls = Array.from(document.querySelectorAll<HTMLElement>(selector))
            .filter(visible)
            .map(entryOf)
            .filter((entry) => entry.rect.y >= 0 && entry.rect.y <= 950)
            .slice(0, 360);
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
        frameIndex,
        frameUrl: sanitizeEvidenceUrl(raw.frameUrl),
        frameOffset: { x: Math.round(offsetX), y: Math.round(offsetY) },
        controls: raw.controls.map(shift),
        active: raw.active ? shift(raw.active) : null
      };
    })
  );
  return maps
    .filter((map): map is FrameControlMap => Boolean(map))
    .filter((map) => /businesscentral\.dynamics\.com/i.test(map.frameUrl))
    .filter((map) => map.controls.length || map.active);
}

function rowMapForCaption(controlMap: FrameControlMap[], captionPattern: RegExp): DimensionRowMap {
  const controls = controlMap.flatMap((map) => map.controls);
  const labels = controls
    .filter((entry) => entry.rect.width <= 520 && entry.rect.height <= 80)
    .filter((entry) => captionPattern.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`));
  const label = labels.sort((left, right) => left.rect.y - right.rect.y || left.rect.x - right.rect.x)[0] ?? null;
  if (!label) {
    return { caption: captionPattern.source, label: null, rowControls: [], leftEditableControls: [], rightReadOnlyOrDisabledControls: [] };
  }

  const centerY = label.rect.y + label.rect.height / 2;
  const rowControls = controls
    .filter((entry) => Math.abs(entry.rect.y + entry.rect.height / 2 - centerY) <= 24)
    .filter((entry) => entry.rect.x >= label.rect.x)
    .filter((entry) => /INPUT|TEXTAREA|SELECT|textbox|combobox|button/i.test(`${entry.tag} ${entry.role}`))
    .filter((entry) => {
      const signal = `${entry.text} ${entry.ariaLabel} ${entry.title}`.trim();
      const isCaptionOrDimensionLookup =
        captionPattern.test(signal) || /Wahlen Sie einen Wert fur Globaler Dimensionscode|Wahlen Sie einen Wert f|Diesen Wert/i.test(signal);
      const isEmptyOrValueEditor = !clean(`${entry.text} ${entry.ariaLabel} ${entry.title}`) || /PRODUCTLINE|COSTCENTER/i.test(entry.value);
      return isCaptionOrDimensionLookup || isEmptyOrValueEditor;
    })
    .sort((left, right) => left.rect.x - right.rect.x);
  return {
    caption: clean(`${label.text} ${label.ariaLabel} ${label.title}`),
    label,
    rowControls,
    leftEditableControls: rowControls.filter((entry) => entry.rect.x >= 650 && entry.rect.x < 1100 && !entry.disabled && !entry.readOnly && /INPUT|combobox|textbox/i.test(`${entry.tag} ${entry.role}`)),
    rightReadOnlyOrDisabledControls: rowControls.filter((entry) => entry.rect.x >= 1100 && (entry.disabled || entry.readOnly))
  };
}

async function fillControlAtRect(page: Page, control: ControlEntry, value: string) {
  const point = {
    x: Math.round(control.rect.x + Math.min(Math.max(control.rect.width / 2, 20), control.rect.width - 8)),
    y: Math.round(control.rect.y + control.rect.height / 2)
  };
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 20 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900);
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Finanzbuchhaltung Einrichtung|General Ledger Setup|Globale Dimensionen|Global Dimensions|Globaler Dimensionscode|Dimension|Fortlaufend|Parallel|Weitere Optionen|PRODUCTLINE|COSTCENTER|Fehler|Error|Meldung|Message/i
    ],
    maxLines: 240,
    maxLineLength: 220
  });
  const cleanLines = compact
    .split('\n')
    .map(clean)
    .filter((line) => line && !isEvidenceNoise(line));
  const controlMap = await collectControlMap(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact: cleanLines.join('\n'),
    controlMap,
    pageTextSignals: {
      productline: /PRODUCTLINE/i.test(await safeText(page)),
      costcenter: /COSTCENTER/i.test(await safeText(page))
    },
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.compact);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.controls.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: extra.page ?? 'Finanzbuchhaltung Einrichtung / Globale Dimensionen aendern',
    step,
    visibleLearning: extra.visibleLearning ?? 'Der Screenshot prueft Feldwerte, Aktionen und Seitensituation nach dem kontrollierten Setup-Schritt.',
    importantUi: extra.importantUi ?? ['Globaler Dimensionscode 1', 'Globaler Dimensionscode 2', 'Fortlaufend'],
    internallyProves: extra.internallyProves ?? [`Page context opened in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`],
    doesNotProve: extra.doesNotProve ?? ['No Default Dimensions.', 'No posted entry or reporting effect.'],
    qualityDecision: 'screenshot-qa-required'
  });
  return snapshot;
}

function rowLooksSafeForTarget(row: DimensionRowMap, target: string) {
  const left = row.leftEditableControls[0];
  return Boolean(
    row.label &&
      left &&
      left.rect.x >= 650 &&
      left.rect.x < 1100 &&
      left.rect.width >= 120 &&
      row.rightReadOnlyOrDisabledControls.length >= 1 &&
      !left.disabled &&
      !left.readOnly &&
      (left.value === '' || left.value.toUpperCase() === target)
  );
}

function persistedGlobalDimensions(text: string) {
  const productline = /Globaler Dimensionscode 1[\s\S]{0,220}PRODUCTLINE|PRODUCTLINE[\s\S]{0,220}Globaler Dimensionscode 1/i.test(text);
  const costcenter = /Globaler Dimensionscode 2[\s\S]{0,220}COSTCENTER|COSTCENTER[\s\S]{0,220}Globaler Dimensionscode 2/i.test(text);
  return { productline, costcenter, both: productline && costcenter };
}

test('TARGET-024D runs controlled Global Dimension assignment route', async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let setupWriteAttempted = false;
  let setupChanged = false;
  let runActionClicked = false;
  let selectedNextCase = 'TARGET-024-CORE-MASTERDATA-PLAN';

  await openGeneralLedgerSetup(page);
  const page118Before = await captureState(page, 'target-024d-010-page118-before', 'Page 118 before controlled Global Dimension assignment.', {
    page: 'Finanzbuchhaltung Einrichtung / General Ledger Setup, Page 118',
    importantUi: ['Globaler Dimensionscode 1', 'Globaler Dimensionscode 2', 'Globale Dimensionen aendern'],
    internallyProves: ['General Ledger Setup page 118 is reachable in playthru / UNIVERSAARL-DE.']
  });
  const beforePersisted = persistedGlobalDimensions(page118Before.compact);

  if (!beforePersisted.both) {
    await clickEditMode(page);
    await expandDimensionsArea(page);
    const actionOpened = await clickGlobalDimensionsAction(page);
    if (!actionOpened) {
      blockedBy.push('The Change Global Dimensions action was not visible from Page 118.');
    } else {
      await assertSafeTargetContext(page, /Globale Dimensionen|Global Dimensions|Fortlaufend|Parallel/i);
      await clickEditMode(page);
      const beforeEntry = await captureState(page, 'target-024d-020-action-page-before-entry', 'Action page before controlled left-combobox entry.', {
        page: 'Globale Dimensionen aendern / Change Global Dimensions',
        importantUi: ['left editable comboboxes', 'right disabled/read-only controls', 'Fortlaufend'],
        internallyProves: ['The Change Global Dimensions action page is open before data entry.']
      });
      let row1 = rowMapForCaption(beforeEntry.controlMap as FrameControlMap[], /Globaler Dimensionscode 1|Global Dimension Code 1/i);
      let row2 = rowMapForCaption(beforeEntry.controlMap as FrameControlMap[], /Globaler Dimensionscode 2|Global Dimension Code 2/i);
      const rowSafetyBefore = {
        row1: rowLooksSafeForTarget(row1, 'PRODUCTLINE'),
        row2: rowLooksSafeForTarget(row2, 'COSTCENTER'),
        row1LeftCount: row1.leftEditableControls.length,
        row2LeftCount: row2.leftEditableControls.length,
        row1RightCount: row1.rightReadOnlyOrDisabledControls.length,
        row2RightCount: row2.rightReadOnlyOrDisabledControls.length
      };

      if (!rowSafetyBefore.row1 || !rowSafetyBefore.row2) {
        blockedBy.push(`Row/control map is not safe enough for write. ${JSON.stringify(rowSafetyBefore)}`);
      } else {
        await fillControlAtRect(page, row1.leftEditableControls[0], 'PRODUCTLINE');
        await fillControlAtRect(page, row2.leftEditableControls[0], 'COSTCENTER');
        setupWriteAttempted = true;
        const afterEntry = await captureState(page, 'target-024d-030-action-page-after-entry-before-run', 'Action page after left-combobox entry and before Fortlaufend.', {
          page: 'Globale Dimensionen aendern / Change Global Dimensions',
          importantUi: ['PRODUCTLINE in left row 1', 'COSTCENTER in left row 2', 'Fortlaufend run action'],
          internallyProves: ['The intended values are entered before any run action.']
        });
        row1 = rowMapForCaption(afterEntry.controlMap as FrameControlMap[], /Globaler Dimensionscode 1|Global Dimension Code 1/i);
        row2 = rowMapForCaption(afterEntry.controlMap as FrameControlMap[], /Globaler Dimensionscode 2|Global Dimension Code 2/i);
        const valuesVisibleBeforeRun =
          row1.leftEditableControls.some((entry) => /PRODUCTLINE/i.test(entry.value)) &&
          row2.leftEditableControls.some((entry) => /COSTCENTER/i.test(entry.value));
        if (!valuesVisibleBeforeRun) {
          blockedBy.push('PRODUCTLINE/COSTCENTER were not visible in the expected left editable controls before Fortlaufend.');
        } else {
          const runResult = await clickSequentialRunAction(page);
          runActionClicked = runResult === 'start-clicked';
          if (runResult !== 'start-clicked') {
            blockedBy.push(`Fortlaufend run action was ${runResult}.`);
          }
          await captureState(page, 'target-024d-040-after-run-return-or-message', `After Fortlaufend result: ${runResult}.`, {
            page: 'Globale Dimensionen aendern / result context',
            importantUi: ['result message', 'Page 118 return state', 'global dimension fields'],
            internallyProves: [`Fortlaufend run action state: ${runResult}.`]
          });
        }
      }
    }

    await openGeneralLedgerSetup(page);
    await clickEditMode(page);
    await expandDimensionsArea(page);
  }

  const page118After = await captureState(page, 'target-024d-090-page118-after-reopen', 'Page 118 after controlled assignment route and reopen.', {
    page: 'Finanzbuchhaltung Einrichtung / General Ledger Setup, Page 118',
    importantUi: ['Globaler Dimensionscode 1', 'Globaler Dimensionscode 2', 'PRODUCTLINE', 'COSTCENTER'],
    internallyProves: ['Page 118 was reopened after the controlled route.']
  });
  const afterPersisted = persistedGlobalDimensions(page118After.compact);
  setupChanged = afterPersisted.both;

  if (!setupChanged) {
    blockedBy.push('Page 118 after reopen does not show PRODUCTLINE as Global Dimension Code 1 and COSTCENTER as Global Dimension Code 2.');
    selectedNextCase = 'TARGET-024E-GLOBAL-DIMENSION-ASSIGNMENT-SOURCE-OR-ALTERNATIVE-ROUTE';
  }

  const resultStatus = setupChanged ? 'observed' : setupWriteAttempted ? 'blocked' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-controlled-global-dimension-assignment',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    setupWriteAttempted,
    setupChanged,
    runActionClicked,
    proved: [
      'General Ledger Setup / Finanzbuchhaltung Einrichtung page 118 was opened only in playthru / UNIVERSAARL-DE.',
      'The controlled route used the TARGET-024C left editable combobox geometry before attempting Fortlaufend.',
      ...(setupChanged
        ? ['Page 118 after reopen shows PRODUCTLINE as Global Dimension Code 1 and COSTCENTER as Global Dimension Code 2.']
        : []),
      'No master data, document draft, preview posting, posting, company switch or API shortcut was executed.'
    ],
    notProved: [
      ...(setupChanged
        ? []
        : ['PRODUCTLINE/COSTCENTER are not proven as persisted Global Dimension Code 1/2 after reopen.']),
      'Default Dimensions on customers, vendors, items or accounts are not proven.',
      'Dimension Set Entries, posted entries and reporting filters are not proven.',
      'German VAT or posting-group correctness is not proven by this case.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-024D-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.controls.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-024d-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-024D-result.json`,
      'playwright/projects/fibu-book5/img/target-024d-010-page118-before.png',
      'playwright/projects/fibu-book5/img/target-024d-020-action-page-before-entry.png',
      'playwright/projects/fibu-book5/img/target-024d-030-action-page-after-entry-before-run.png',
      'playwright/projects/fibu-book5/img/target-024d-040-after-run-return-or-message.png',
      'playwright/projects/fibu-book5/img/target-024d-090-page118-after-reopen.png'
    ],
    blockedBy,
    warnings,
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
      setupChanged,
      runActionClicked
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-024-CORE-MASTERDATA-PLAN',
      lastEvidenceSummary:
        'TARGET-023B recovered all starter Dimension Values; TARGET-024B did not prove global dimension persistence; TARGET-024C mapped the safe left-combobox route and run actions.',
      isPlannedNextCaseStillSensible: setupChanged,
      reason: setupChanged
        ? 'Global Dimension Code 1/2 are now visible after reopen, so master-data planning can proceed while default dimensions remain open.'
        : 'Master data should still not start as if global dimensions are ready; a new source or UI route is needed.',
      lookaheadReviewed: [
        {
          caseId: selectedNextCase,
          status: setupChanged ? 'ready-next' : 'needs-source-check-first',
          reason: setupChanged
            ? 'Core master data planning can use the global-dimension foundation but must still handle default dimensions later.'
            : 'The controlled route did not produce persisted Page-118 proof.'
        },
        {
          caseId: 'TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: setupChanged ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Templates need posting groups, VAT and dimension/default-dimension decisions.'
        },
        {
          caseId: 'TARGET-026-VAT-SETUP-FIT-DECISION',
          status: 'needs-source-check-first',
          reason: 'German VAT setup still needs source-backed setup before document preview.'
        },
        {
          caseId: 'TARGET-028-DEFAULT-DIMENSIONS-STRATEGY',
          status: setupChanged ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Default Dimensions depend on global dimensions and concrete master data.'
        },
        {
          caseId: 'TARGET-024F-GLOBAL-DIMENSION-REPORTING-BOUNDARY',
          status: setupChanged ? 'ready-after-current' : 'blocked',
          reason: 'Reporting effect can only be checked after posted entries with dimensions exist.'
        }
      ],
      queueChangesMade: [`Selected ${selectedNextCase} after TARGET-024D.`],
      selectedNextCase,
      whySelectedNextCaseIsBest: setupChanged
        ? 'The foundation can move from global-dimension setup into core master-data planning, while preserving the default-dimension and posting-effect gaps.'
        : 'Repeating the same action-page route would be waste; the next case must use a new source-backed route or park decision.',
      risksBeforeNextCase: [
        'Do not claim reporting readiness before posted entries with dimensions exist.',
        'Do not claim Default Dimensions from Global Dimension Code 1/2.',
        'Do not create master data before posting groups, VAT and default-dimension expectations are consciously gated.'
      ],
      requiredPreparation: setupChanged
        ? ['Prepare core master-data plan and keep Default Dimensions as separate setup case.']
        : ['Research/inspect an alternative Global Dimension route or write a conscious park decision before master data.']
    },
    requiresReview: !setupChanged,
    safeToFinalizeState: setupChanged,
    statePatch: {},
    reason: setupChanged
      ? 'TARGET-024D proved PRODUCTLINE/COSTCENTER as Global Dimension Code 1/2 after Page 118 reopen.'
      : 'TARGET-024D attempted the controlled route but did not prove persisted Global Dimension Code 1/2 assignment.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-024D Controlled Global Dimension Assignment',
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
      '- Page 118 bleibt der Reopen-Beweis fuer globale Dimensionen.',
      '- Die Action-Page wird nur mit der in TARGET-024C dokumentierten linken Eingabespalte bedient.',
      '- Ein Wert zaehlt erst, wenn `PRODUCTLINE` und `COSTCENTER` nach erneutem Oeffnen auf Page 118 sichtbar sind.',
      '- `Fortlaufend` ist eine wirksame Setup-Aktion und wird nur im aktiven Case ausgefuehrt.',
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Keine Standarddimensionen.',
      '- Keine Preview und keine Buchung.',
      '- Keine Reportingwirkung ohne spaetere Posten.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
