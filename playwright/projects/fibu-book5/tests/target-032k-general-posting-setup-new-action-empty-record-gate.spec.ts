import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(240_000);

const CASE_ID = 'TARGET-032K-GENERAL-POSTING-SETUP-NEW-ACTION-EMPTY-RECORD-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-032k-general-posting-setup-new-action-empty-record-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-032K-result.json');
const PAGE_ID = 314;

type UiBox = {
  text: string;
  aria: string;
  title: string;
  controlName: string;
  role: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PageState = {
  step: string;
  url: string;
  title: string;
  compact: string;
  hasDangerousDialog: boolean;
  hasPage314Context: boolean;
  targetRowVisible: boolean;
  blankOrPartialRowSignal: boolean;
  dialogCount: number;
  inputCount: number;
  rowCount: number;
};

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|clientId|authority:|originAuthorityValidator|upn:/i.test(line))
    .join('\n')
    .trim();
}

function cleanEvidenceValue<T>(value: T): T {
  if (typeof value === 'string') return clean(value) as T;
  if (Array.isArray(value)) return value.map((entry) => cleanEvidenceValue(entry)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cleanEvidenceValue(entry)])) as T;
  }
  return value;
}

function buildTargetUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(PAGE_ID));
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

function companyParamIsTarget(rawUrl: string) {
  return (new URL(rawUrl).searchParams.get('company') ?? '').replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function containsDangerousText(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Company switch|^Post$|^Buchen$|^L[oe]schen$|^Delete$|^Finish$|Fertig stellen/i.test(
    text
  );
}

function hasPage314Context(text: string) {
  return /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto/i.test(
    text
  );
}

function hasTargetMatrixRow(text: string) {
  return /INLAND[\s\S]{0,1600}WAREN[\s\S]{0,2600}4400[\s\S]{0,3200}5400|INLAND[\s\S]{0,1600}WAREN[\s\S]{0,3200}5400[\s\S]{0,3200}4400/i.test(
    text
  );
}

function labelOf(box: Pick<UiBox, 'text' | 'aria' | 'title' | 'controlName'>) {
  return clean([box.text, box.aria, box.title, box.controlName].filter(Boolean).join(' '));
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

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''));
    if (expected.test(bodyText)) return { frame, bodyText };
  }
  throw new Error(`No BC frame matched ${expected}.`);
}

async function visibleDialogTexts(page: Page) {
  const result: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (text) result.push(text);
    }
  }
  return result;
}

async function domInventory(frame: Frame) {
  return frame.evaluate(() => {
    const normalize = (value: string | null | undefined) => String(value ?? '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const html = element as HTMLElement;
      const rect = html.getBoundingClientRect();
      const style = window.getComputedStyle(html);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const snapshot = (element: Element) => {
      const html = element as HTMLElement;
      const rect = html.getBoundingClientRect();
      return {
        text: normalize(html.innerText || html.textContent),
        aria: normalize(html.getAttribute('aria-label')),
        title: normalize(html.getAttribute('title')),
        controlName: normalize(html.getAttribute('controlname')),
        role: normalize(html.getAttribute('role')),
        tag: html.tagName.toLowerCase(),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };
    };
    const headers = [...document.querySelectorAll('th,[role="columnheader"],a[title^="Sortieren nach"],a[title^="Sort by"]')]
      .filter(visible)
      .map(snapshot);
    const actions = [...document.querySelectorAll('button,[role="button"],a,[role="menuitem"],[aria-label],[title]')]
      .filter(visible)
      .map(snapshot)
      .filter((entry) =>
        /Neu|New|Liste bearbeiten|Edit List|Bearbeiten|Edit|Kopieren|Copy|Weitere Optionen|More options|Verwalten|Manage|Aktionen|Actions/i.test(
          `${entry.text} ${entry.aria} ${entry.title} ${entry.controlName}`
        )
      )
      .slice(0, 120);
    const rows = [...document.querySelectorAll('[role="row"],tr')].filter(visible).map(snapshot).slice(0, 120);
    const inputs = [...document.querySelectorAll('input,textarea,[role="textbox"],[role="combobox"]')]
      .filter(visible)
      .map(snapshot)
      .filter((input) => input.width > 8 && input.height > 8)
      .slice(0, 120);
    const dialogs = [...document.querySelectorAll('[role="dialog"],[aria-modal="true"]')].filter(visible).map(snapshot);
    return { headers, actions, rows, inputs, dialogs };
  });
}

async function screenshotWithMetadata(page: Page, fileName: string, metadata: Record<string, unknown>) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  const imagePath = path.join(IMG_DIR, fileName);
  await page.screenshot({ path: imagePath, fullPage: false });
  await writeJson(path.join(EVIDENCE_DIR, fileName.replace(/\.png$/i, '.screenshot.json')), {
    fileName,
    imagePath,
    project: PROJECT,
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    ...metadata
  });
}

async function capturePageState(page: Page, frame: Frame, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|INLAND|WAREN|4400|5400|Neu|New|Liste bearbeiten|Edit List|Kopieren|Copy/i
      ],
      maxLines: 240,
      maxLineLength: 240
    })
  );
  const text = await safeText(page);
  const inventory = cleanEvidenceValue(await domInventory(frame));
  const dialogTexts = await visibleDialogTexts(page);
  const state: PageState = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    hasDangerousDialog: containsDangerousText(text) || dialogTexts.some((dialog) => containsDangerousText(dialog)),
    hasPage314Context: hasPage314Context(text),
    targetRowVisible: hasTargetMatrixRow(text),
    blankOrPartialRowSignal:
      inventory.inputs.length > 0 &&
      !hasTargetMatrixRow(text) &&
      /Geschaeftsbuchungsgruppe|Produktbuchungsgruppe|Sales Account|Warenverkaufskonto|Purch\. Account|Wareneinkaufskonto/i.test(text),
    dialogCount: dialogTexts.length,
    inputCount: inventory.inputs.length,
    rowCount: inventory.rows.length
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.inventory.json`), inventory);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), { ...state, dialogTexts, ...extra });
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: PAGE_ID,
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    step,
    importantUi: (compact || text)
      .split('\n')
      .filter(Boolean)
      .slice(0, 28),
    screenshotQa: {
      safeInstance: instancePathIsTarget(page.url()),
      safeCompany: companyParamIsTarget(page.url()),
      dangerousDialogVisible: state.hasDangerousDialog,
      page314ContextVisible: state.hasPage314Context,
      blankOrPartialRowSignal: state.blankOrPartialRowSignal
    },
    internallyProves: 'Page 314 state around standalone Neu empty-record gate in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No General Posting Setup values written.',
      'No VAT setup.',
      'No document.',
      'No Preview Posting.',
      'No Posting.',
      'No posting readiness.'
    ],
    finalScreenshotStatus: 'diagnosis-evidence',
    ...extra
  });
  return { state, inventory, dialogTexts };
}

async function openPage314(page: Page) {
  await page.goto(buildTargetUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1600);
  const text = await safeText(page);
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(hasPage314Context(text), 'Page 314 context must be visible before any action.').toBe(true);
  expect(containsDangerousText(text), 'No dangerous dialog may be visible before Neu.').toBe(false);
  return findBcFrame(page, /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Produktbuchungsgruppe/i);
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible({ timeout }).catch(() => false)) return item;
  }
  return undefined;
}

async function standaloneNewAction(page: Page, frame: Frame) {
  const scopes = [frame, page];
  for (const scope of scopes) {
    for (const role of ['button', 'menuitem'] as const) {
      const byExactName = await firstVisible(scope.getByRole(role, { name: /^Neu$|^New$/i }), 700);
      if (byExactName) return byExactName;
    }
    const byTitle = await firstVisible(scope.locator('[title="Erstellen Sie einen neuen Eintrag."], [title="Create a new entry."]'), 700);
    if (byTitle) return byTitle;
  }
  return undefined;
}

function classifyNewOutcome(after: PageState, reopen: PageState) {
  if (after.hasDangerousDialog || reopen.hasDangerousDialog) return 'blocked-dangerous-dialog';
  if (!after.hasPage314Context && !reopen.hasPage314Context) return 'blocked-left-page314';
  if (reopen.blankOrPartialRowSignal || (!after.targetRowVisible && reopen.rowCount > 0 && reopen.inputCount > 0)) {
    return 'blocked-potential-empty-row-side-effect';
  }
  if (after.dialogCount > 0 || after.inputCount > 0 || after.blankOrPartialRowSignal) return 'observed-new-context-no-values';
  return 'blocked-new-action-no-trusted-context';
}

test('TARGET-032K clicks only standalone Neu on Page 314 and proves reopen state', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  let { frame } = await openPage314(page);
  actionsTaken.push('Opened Page 314 Buchungsmatrix Einrichtung / General Posting Setup directly in playthru / UNIVERSAARL-DE.');
  const before = await capturePageState(page, frame, 'target-032k-010-before-new', 'Before standalone Neu click.');

  const newAction = await standaloneNewAction(page, frame);
  if (!newAction) {
    blockedBy.push('Standalone Neu/New action was not visible by exact name or expected title.');
  } else {
    await newAction.hover({ timeout: 1500 }).catch(() => undefined);
    await page.waitForTimeout(500);
    actionsTaken.push('Hovered the standalone Neu action before clicking it.');
    await newAction.click({ timeout: 5000 }).catch(async () => newAction.click({ timeout: 5000, force: true }));
    await page.waitForTimeout(1600);
    actionsTaken.push('Clicked standalone Neu exactly once on Page 314.');
  }

  frame = (await findBcFrame(page, /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Produktbuchungsgruppe/i)).frame;
  const after = await capturePageState(page, frame, 'target-032k-020-after-new-click', 'After standalone Neu click; no values typed.', {
    newActionFound: Boolean(newAction)
  });

  if (after.state.hasDangerousDialog) {
    blockedBy.push('Dangerous or ambiguous dialog appeared after Neu; no confirmation was clicked.');
  }

  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(700);
  actionsTaken.push('Pressed Escape once to avoid leaving a transient empty-record UI open; no confirmation was clicked.');

  await page.goto(buildTargetUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1600);
  frame = (await findBcFrame(page, /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Produktbuchungsgruppe/i)).frame;
  const reopen = await capturePageState(page, frame, 'target-032k-030-reopen-proof', 'Page 314 reopen proof after Neu gate.');
  actionsTaken.push('Reopened Page 314 for proof after the Neu gate.');

  const newOutcome = newAction ? classifyNewOutcome(after.state, reopen.state) : 'blocked-new-action-not-found';
  if (newOutcome.startsWith('blocked') && blockedBy.length === 0) blockedBy.push(newOutcome);
  if (reopen.state.blankOrPartialRowSignal) {
    warnings.push('Reopen proof still shows editable/input signals without a target row; treat as potential empty-row side effect.');
  }

  const observedTrustedContext = newOutcome === 'observed-new-context-no-values';
  const potentialSideEffect = newOutcome === 'blocked-potential-empty-row-side-effect';
  const resultStatus = observedTrustedContext ? 'observed-new-context-no-values' : newOutcome;
  const nextCase = observedTrustedContext
    ? 'TARGET-032L-GENERAL-POSTING-SETUP-CONTROLLED-VALUE-WRITE-GATE'
    : 'TARGET-032L-GENERAL-POSTING-SETUP-NEW-ACTION-RESULT-DECISION';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-empty-record-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 314 Buchungsmatrix Einrichtung / General Posting Setup',
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken,
    actionsNotTaken: [
      'No Edit List action clicked.',
      'No Copy action clicked.',
      'No setup values typed.',
      'No General Posting Setup value written.',
      'No VAT Posting Setup value written.',
      'No configuration package import/export/validate/apply.',
      'No document or draft created.',
      'No master data created.',
      'No Preview Posting.',
      'No Posting.',
      'No Payment.',
      'No API shortcut.',
      'No company switch.',
      'No book claim from this evidence.'
    ],
    setupChanged: potentialSideEffect,
    setupChangeAttempted: Boolean(newAction),
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    newOutcome,
    states: {
      before: before.state,
      after: after.state,
      reopen: reopen.state
    },
    inventorySummary: {
      beforeActions: before.inventory.actions.map((action) => ({ ...action, label: labelOf(action) })).slice(0, 80),
      afterInputs: after.inventory.inputs.length,
      afterRows: after.inventory.rows.length,
      reopenInputs: reopen.inventory.inputs.length,
      reopenRows: reopen.inventory.rows.length
    },
    screenshots: [
      'playwright/projects/fibu-book5/img/target-032k-010-before-new.png',
      'playwright/projects/fibu-book5/img/target-032k-020-after-new-click.png',
      'playwright/projects/fibu-book5/img/target-032k-030-reopen-proof.png'
    ],
    proved: [
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'Page 314 Buchungsmatrix Einrichtung / General Posting Setup was opened directly.',
      ...(newAction ? ['Standalone Neu was clicked exactly once.'] : []),
      'No values were typed in General Posting Setup.',
      'No Edit List, Copy, configuration package route, document, Preview Posting, Posting, Payment or API shortcut occurred.',
      'Page 314 was reopened after the Neu gate for side-effect proof.'
    ],
    notProved: [
      'No INLAND/WAREN General Posting Setup row with 4400/5400 is proven.',
      'No Sales Account 4400 or Purchase Account 5400 is stored by this case.',
      'No VAT Posting Setup row is proven.',
      'No posting readiness is proven.',
      'No G/L Entry, VAT Entry or Value Entry is proven.',
      'No complete SKR04 chart, tax advisor approval or German compliance claim is proven.'
    ],
    blockedBy,
    warnings,
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupValuesTyped: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noVatSetupChange: true,
      noPayment: true,
      noEditListClicked: true,
      noCopyClicked: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-032J selected standalone Neu as the smallest non-repeating Page 314 route after weak Page 314 route signals and broader configuration-package routes were deferred.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The standalone Neu gate is the only remaining narrow Page 314 route before either a controlled value write or a conscious park decision.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-032L-GENERAL-POSTING-SETUP-CONTROLLED-VALUE-WRITE-GATE',
          status: observedTrustedContext ? 'ready-next' : 'blocked',
          reason: observedTrustedContext
            ? 'Neu exposed a context without values; a separate value-write gate can decide the exact fields.'
            : 'Neu did not prove a trusted value-write context.'
        },
        {
          caseId: 'TARGET-032L-GENERAL-POSTING-SETUP-NEW-ACTION-RESULT-DECISION',
          status: observedTrustedContext ? 'ready-after-current' : 'ready-next',
          reason: observedTrustedContext
            ? 'Still useful if the project wants one final human/source decision before value typing.'
            : 'Best next step is a local decision before any further Page 314 attempt.'
        },
        {
          caseId: 'TARGET-027D26-VAT-MATRIX-ALTERNATIVE-ROUTE-DISCOVERY',
          status: 'ready-after-current',
          reason: 'VAT matrix remains separate and should not be mixed with Page 314.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Dimensions can resume after matrix blockers are solved or parked.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'O2C still needs General Posting Setup and VAT boundaries before document work.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: observedTrustedContext
        ? 'A separate write gate keeps the Neu discovery and value entry concerns cleanly separated.'
        : 'A decision case prevents another blind click/edit loop and can park Page 314 if necessary.',
      risksBeforeNextCase: [
        'Do not type 4400/5400 unless the value-write gate explicitly unlocks fields.',
        'Do not click Edit List or Copy inside the Neu-result decision.',
        'Do not claim posting readiness without General Posting Setup and VAT Posting Setup proof.'
      ],
      requiredPreparation: [
        'Review the three TARGET-032K screenshots and inventory files.',
        'Use reopen proof to decide whether any empty/partial row side effect exists.'
      ]
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032K-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      'playwright/projects/fibu-book5/img/target-032k-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032K-result.json`,
      'playwright/projects/fibu-book5/img/target-032k-010-before-new.png',
      'playwright/projects/fibu-book5/img/target-032k-020-after-new-click.png',
      'playwright/projects/fibu-book5/img/target-032k-030-reopen-proof.png'
    ],
    requiresReview: !observedTrustedContext,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeArea: observedTrustedContext
          ? 'universaarl-general-posting-setup-controlled-value-write-gate'
          : 'universaarl-general-posting-setup-new-action-result-decision',
        activeCase: nextCase,
        active_case_file: observedTrustedContext
          ? '.agent/state/cases/target-032l-general-posting-setup-controlled-value-write-gate.json'
          : '.agent/state/cases/target-032l-general-posting-setup-new-action-result-decision.json',
        nextCase,
        nextStep: observedTrustedContext
          ? 'Review TARGET-032K screenshots and, only if accepted, run a separate controlled Page 314 value-write gate.'
          : 'Run TARGET-032L as local decision to park or replace the Page 314 Neu route before any value write.'
      },
      lastRunSummary: {
        caseId: CASE_ID,
        status: resultStatus,
        instance: EXPECTED_INSTANCE,
        company: TARGET_COMPANY,
        setupChanged: potentialSideEffect,
        masterDataChanged: false,
        draftCreated: false,
        previewPosting: false,
        posted: false,
        apiShortcut: false,
        summary: `TARGET-032K clicked standalone Neu on Page 314 once, typed no values, captured screenshot QA and reopened Page 314. Outcome: ${newOutcome}.`,
        nextCase
      },
      activeCase: {
        status: observedTrustedContext ? 'done' : 'blocked',
        resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032K-result.json`,
        completedAt: new Date().toISOString(),
        nextCase
      }
    },
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:general-posting-setup-new-gate',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032K-result.json`,
      `npm run agent:state-finalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032K-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ],
    reason: `Standalone Neu gate completed with outcome ${newOutcome}.`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-032K General Posting Setup Neu Gate',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      `- Neu gefunden: ${newAction ? 'ja' : 'nein'}`,
      `- Outcome: ${newOutcome}`,
      `- Reopen blank/partial row signal: ${reopen.state.blankOrPartialRowSignal ? 'ja' : 'nein'}`,
      '',
      '## Grenzen',
      '',
      '- Keine Werte in Page 314 geschrieben.',
      '- Keine Liste bearbeiten.',
      '- Kein Kopieren.',
      '- Keine VAT Posting Setup Aenderung.',
      '- Kein Beleg und kein Draft.',
      '- Keine Preview und keine Buchung.',
      '- Keine Buchungsfaehigkeit bewiesen.',
      '',
      `Naechster Case: ${nextCase}`,
      ''
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBe(true);
  expect(companyParamIsTarget(page.url())).toBe(true);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
