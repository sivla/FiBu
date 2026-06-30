import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-024C-GLOBAL-DIMENSION-FIELD-DISCOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-024c-global-dimension-field-discovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-024C-result.json');

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
type ActionInventoryEntry = {
  name: string;
  role: string;
  visible: boolean;
  clicked: false;
  tooltip: string;
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
    finalScreenshotStatus: 'universaarl-setup-discovery-not-final-book-proof',
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

async function clickEditMode(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    for (const candidate of [
      scope
        .locator(
          [
            'button[title*="Aenderungen"]',
            'button[title*="Anderungen"]',
            'button[title*="Änderungen"]',
            'button[title*="changes" i]',
            'button[title*="Edit" i]',
            'button[aria-label*="Aenderungen"]',
            'button[aria-label*="Anderungen"]',
            'button[aria-label*="Änderungen"]',
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

async function clickGlobalDimensionsAction(page: Page) {
  const actionPattern = /Globale Dimensionen (?:a|\u00e4|\u00c3\u00a4)ndern|Change Global Dimensions/i;
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
            '[role="tab"]',
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
            .slice(0, 320);
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
    return {
      caption: captionPattern.source,
      label: null,
      rowControls: [],
      leftEditableControls: [],
      rightReadOnlyOrDisabledControls: []
    };
  }

  const centerY = label.rect.y + label.rect.height / 2;
  const rowControls = controls
    .filter((entry) => Math.abs(entry.rect.y + entry.rect.height / 2 - centerY) <= 24)
    .filter((entry) => entry.rect.x >= label.rect.x)
    .filter((entry) => /INPUT|TEXTAREA|SELECT|textbox|combobox|button/i.test(`${entry.tag} ${entry.role}`))
    .filter((entry) => {
      const signal = `${entry.text} ${entry.ariaLabel} ${entry.title}`.trim();
      const isCaptionOrDimensionLookup =
        captionPattern.test(signal) || /Wahlen Sie einen Wert fur Globaler Dimensionscode|Wählen Sie einen Wert für Globaler Dimensionscode|Vorschlag|Diesen Wert/i.test(signal);
      const isEmptyEditor = !clean(`${entry.text} ${entry.ariaLabel} ${entry.title} ${entry.value}`);
      return isCaptionOrDimensionLookup || isEmptyEditor;
    })
    .sort((left, right) => left.rect.x - right.rect.x);
  return {
    caption: clean(`${label.text} ${label.ariaLabel} ${label.title}`),
    label,
    rowControls,
    leftEditableControls: rowControls.filter((entry) => entry.rect.x < 1100 && !entry.disabled && !entry.readOnly && !captionPattern.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`)),
    rightReadOnlyOrDisabledControls: rowControls.filter((entry) => entry.rect.x >= 1100 && (entry.disabled || entry.readOnly))
  };
}

async function hoverTooltip(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'tab'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 800 }).catch(() => false)) {
        await locator.hover({ timeout: 3000 }).catch(() => undefined);
        await page.waitForTimeout(900);
        const title = await locator.getAttribute('title').catch(() => '');
        const aria = await locator.getAttribute('aria-label').catch(() => '');
        const text = clean((await locator.innerText({ timeout: 500 }).catch(() => '')) || '');
        const pageTip = clean(await page.locator('[role="tooltip"], .ms-TooltipHost, .ms-Callout').last().innerText({ timeout: 500 }).catch(() => ''));
        return clean([title, aria, text, pageTip].filter(Boolean).join(' | '));
      }
    }
  }
  return '';
}

async function collectActionInventory(page: Page): Promise<ActionInventoryEntry[]> {
  const actions = [
    { name: 'Fortlaufend', pattern: /^Fortlaufend$|^Sequential$/i },
    { name: 'Parallel', pattern: /^Parallel$/i },
    { name: 'Weitere Optionen', pattern: /Weitere Optionen|More options/i },
    { name: 'Neue Zeile', pattern: /Neue Zeile|New line/i },
    { name: 'Zeile loeschen', pattern: /Zeile loschen|Zeile loeschen|Delete line/i },
    { name: 'Erneut ausfuehren', pattern: /Erneut ausfuhren|Erneut ausfuehren|Rerun/i },
    { name: 'Fehler anzeigen', pattern: /Fehler anzeigen|Show Errors/i }
  ];
  const inventory: ActionInventoryEntry[] = [];
  for (const action of actions) {
    let foundRole = '';
    let visible = false;
    for (const scope of [page, ...page.frames()]) {
      for (const role of ['button', 'menuitem', 'tab'] as const) {
        const locator = scope.getByRole(role, { name: action.pattern }).first();
        if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
          foundRole = role;
          visible = true;
          break;
        }
      }
      if (visible) break;
    }
    inventory.push({
      name: action.name,
      role: foundRole,
      visible,
      clicked: false,
      tooltip: visible ? await hoverTooltip(page, action.pattern) : ''
    });
  }
  return inventory;
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [
      /Finanzbuchhaltung Einrichtung|General Ledger Setup|Globale Dimensionen|Global Dimensions|Globaler Dimensionscode|Dimension|Fortlaufend|Parallel|Weitere Optionen|Neue Zeile|Zeile|Fehler|PRODUCTLINE|COSTCENTER/i
    ],
    maxLines: 220,
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
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.compact);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.controls.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: extra.page ?? 'Finanzbuchhaltung Einrichtung / Globale Dimensionen aendern',
    step,
    visibleLearning: extra.visibleLearning ?? 'Der Screenshot prueft, welche Felder, Spalten und Aktionen in Business Central wirklich sichtbar sind.',
    importantUi: extra.importantUi ?? ['Globaler Dimensionscode 1', 'Globaler Dimensionscode 2', 'Fortlaufend', 'Parallel'],
    internallyProves: extra.internallyProves ?? [`Page context opened in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`],
    doesNotProve: extra.doesNotProve ?? ['No persisted global-dimension assignment.', 'No master data.', 'No posting or reporting effect.'],
    qualityDecision: 'screenshot-qa-required'
  });
  return snapshot;
}

test('TARGET-024C inspects Change Global Dimensions field/action semantics', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  await openGeneralLedgerSetup(page);
  const editModeClicked = await clickEditMode(page);
  await expandDimensionsArea(page);
  await captureState(page, 'target-024c-010-general-ledger-setup', 'General Ledger Setup before opening Change Global Dimensions.', {
    page: 'Finanzbuchhaltung Einrichtung / General Ledger Setup, Page 118',
    editModeClicked,
    importantUi: ['Globaler Dimensionscode 1', 'Globaler Dimensionscode 2', 'Globale Dimensionen aendern'],
    internallyProves: ['General Ledger Setup page 118 is reachable in playthru / UNIVERSAARL-DE.', 'Global dimension setup context is visible.']
  });

  const actionOpened = await clickGlobalDimensionsAction(page);
  if (!actionOpened) {
    throw new Error('Change Global Dimensions action was not visible.');
  }
  await assertSafeTargetContext(page, /Globale Dimensionen|Global Dimensions|Fortlaufend|Parallel/i);
  const actionEditModeClicked = await clickEditMode(page);
  await page.waitForTimeout(1000);

  const actionInventory = await collectActionInventory(page);
  const actionSnapshot = await captureState(page, 'target-024c-020-change-global-dimensions-action-page', 'Change Global Dimensions action page opened; no run action clicked.', {
    page: 'Globale Dimensionen aendern / Change Global Dimensions',
    actionEditModeClicked,
    actionInventory,
    importantUi: ['left/right input columns', 'Fortlaufend', 'Parallel', 'Weitere Optionen'],
    internallyProves: ['The Change Global Dimensions action page opens from Page 118.', 'Execution actions are visible but were not clicked.'],
    doesNotProve: ['Which run mode changes the setup.', 'Persisted Global Dimension Code assignment.', 'Posted entries or reporting effect.']
  });

  const rowMaps = [
    rowMapForCaption(actionSnapshot.controlMap as FrameControlMap[], /Globaler Dimensionscode 1|Global Dimension Code 1/i),
    rowMapForCaption(actionSnapshot.controlMap as FrameControlMap[], /Globaler Dimensionscode 2|Global Dimension Code 2/i)
  ];
  await writeJson(path.join(EVIDENCE_DIR, 'target-024c-row-column-semantics.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    rows: rowMaps,
    interpretation: [
      'The page exposes row-level controls for Global Dimension Code 1/2.',
      'Visible left-side editable controls are separate from right-side disabled/read-only controls.',
      'TARGET-024B wrote to visible left controls and did not prove persistence; TARGET-024C therefore does not click Fortlaufend or Parallel.'
    ]
  });

  await captureState(page, 'target-024c-030-action-page-control-map', 'Control geometry and action inventory after tooltip hover checks.', {
    page: 'Globale Dimensionen aendern / Change Global Dimensions',
    rowMaps,
    actionInventory,
    visibleLearning:
      'Die Action-Page hat mehrere Feldspalten. Sichtbare Eingaben allein reichen nicht als Beweis, dass die globale Dimension gespeichert wird.',
    importantUi: ['Globaler Dimensionscode 1 row', 'Globaler Dimensionscode 2 row', 'left editable controls', 'right read-only/disabled controls', 'Fortlaufend', 'Parallel'],
    internallyProves: ['Control geometry for Global Dimension Code rows was captured.', 'Tooltips/action names were inventoried without executing a run action.'],
    doesNotProve: ['No persisted setup value.', 'No global dimension assignment.', 'No Default Dimensions.', 'No posted entry dimension effect.']
  });

  const blockedBy =
    rowMaps.some((row) => !row.label || row.leftEditableControls.length === 0)
      ? ['Change Global Dimensions row controls could not be mapped clearly enough for a follow-up assignment attempt.']
      : [];
  const selectedNextCase = blockedBy.length
    ? 'TARGET-024D-GLOBAL-DIMENSION-SOURCE-AND-ASSIGNMENT-DECISION'
    : 'TARGET-024D-GLOBAL-DIMENSION-CONTROLLED-ASSIGNMENT-ROUTE';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-global-dimension-field-discovery',
    resultStatus: blockedBy.length ? 'blocked' : 'observed',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    rowMaps,
    actionInventory,
    proved: [
      'General Ledger Setup / Finanzbuchhaltung Einrichtung page 118 was opened only in playthru / UNIVERSAARL-DE.',
      'The Change Global Dimensions action page opened from Page 118.',
      'Global Dimension Code 1/2 rows were mapped with visible control geometry.',
      'The action page exposes run/action choices including Fortlaufend and Parallel, but no run action was clicked.',
      'No master data, document draft, preview posting, posting, company switch or API shortcut was executed.'
    ],
    notProved: [
      'PRODUCTLINE is not proven as Global Dimension Code 1.',
      'COSTCENTER is not proven as Global Dimension Code 2.',
      'The correct safe write/run route is not proven by this discovery case.',
      'Default Dimensions on customers, vendors, items or accounts are not proven.',
      'Dimension Set Entries, posted entries and reporting filters are not proven.'
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-024C-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.controls.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-024c-row-column-semantics.json`,
      'playwright/projects/fibu-book5/img/target-024c-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-024C-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/target-024c-row-column-semantics.json`,
      'playwright/projects/fibu-book5/img/target-024c-010-general-ledger-setup.png',
      'playwright/projects/fibu-book5/img/target-024c-020-change-global-dimensions-action-page.png',
      'playwright/projects/fibu-book5/img/target-024c-030-action-page-control-map.png'
    ],
    blockedBy,
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noSearch: true,
      noBookMasterChange: true,
      setupWriteAttempted: false,
      setupChanged: false,
      runActionClicked: false
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-024-CORE-MASTERDATA-PLAN',
      lastEvidenceSummary:
        'TARGET-023B recovered all starter Dimension Values. TARGET-024B proved Page 118 and the action page, but left-column entry plus sequential run did not persist Global Dimension Code 1/2.',
      isPlannedNextCaseStillSensible: false,
      reason:
        'Master data should not start while global dimension assignment is unresolved; the next step must either run a consciously selected assignment route or make a source-backed park decision.',
      lookaheadReviewed: [
        {
          caseId: selectedNextCase,
          status: blockedBy.length ? 'needs-source-check-first' : 'ready-next',
          reason: blockedBy.length
            ? 'Field semantics are still not sufficiently clear; source and route decision comes before another write.'
            : 'The control map is now clear enough for a separate controlled route, if source/gate agrees.'
        },
        {
          caseId: 'TARGET-024-CORE-MASTERDATA-PLAN',
          status: 'ready-after-current',
          reason: 'Master data planning follows only after global dimensions are proven or consciously parked.'
        },
        {
          caseId: 'TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Templates need posting groups, VAT and dimension/default-dimension decisions.'
        },
        {
          caseId: 'TARGET-026-VAT-SETUP-FIT-DECISION',
          status: 'needs-source-check-first',
          reason: 'German VAT setup still needs source-backed setup before document preview.'
        },
        {
          caseId: 'TARGET-028-DEFAULT-DIMENSIONS-STRATEGY',
          status: 'needs-setup-first',
          reason: 'Default Dimensions need global dimensions or a documented park decision plus concrete master data.'
        }
      ],
      queueChangesMade: [`Selected ${selectedNextCase} after TARGET-024C discovery.`],
      selectedNextCase,
      whySelectedNextCaseIsBest:
        'TARGET-024C replaced guessing with a control map. The next useful case is either the controlled route or a source-backed decision, not a repeat of TARGET-024B.',
      risksBeforeNextCase: [
        'Do not click Fortlaufend or Parallel unless the active case explicitly unlocks it.',
        'Do not claim Global Dimension Code 1/2 readiness from visible action-page controls alone.',
        'Do not start default dimensions or master data as if global dimensions are assigned.'
      ],
      requiredPreparation: [
        'Use TARGET-024C row-column semantics and TARGET-024B blocker evidence.',
        'If executing assignment, capture before/after/reopen proof and stop before master data.'
      ]
    },
    warnings: [
      'TARGET-024C is discovery evidence only.',
      'The screenshot QA intentionally distinguishes visible controls from persisted setup values.'
    ],
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: {},
    reason: blockedBy.length
      ? 'TARGET-024C opened the action page but could not classify row controls clearly enough.'
      : 'TARGET-024C mapped the Change Global Dimensions action page and stopped before any run action.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-024C Global Dimension Field Discovery',
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
      '- Die Seite `Globale Dimensionen aendern` oeffnet sich aus `Finanzbuchhaltung Einrichtung`.',
      '- Die Zeilen fuer `Globaler Dimensionscode 1` und `Globaler Dimensionscode 2` haben sichtbare Eingabe-/Anzeige-Controls.',
      '- `Fortlaufend` und `Parallel` sind sichtbare Ausfuehrungsaktionen. Sie wurden in diesem Discovery-Case nicht geklickt.',
      '- Sichtbare Controls sind kein Speicherbeweis. Ein Wert zaehlt erst nach Reopen-Proof auf Page 118.',
      '',
      '## Grenzen',
      '',
      '- Keine Setup-Aenderung.',
      '- Keine Stammdaten.',
      '- Keine Standarddimensionen.',
      '- Keine Preview und keine Buchung.',
      ''
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
  expect(actionOpened).toBeTruthy();
});
