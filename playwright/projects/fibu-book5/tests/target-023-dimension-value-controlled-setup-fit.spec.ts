import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-023-DIMENSION-VALUE-CONTROLLED-SETUP-FIT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-023-dimension-value-controlled-setup-fit';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-023-result.json');

type DimensionPlan = {
  code: string;
  name: string;
  globalDimensionCandidate: 1 | 2 | null;
  values: Array<{ code: string; name: string }>;
};

type StepStatus = 'created' | 'already-exists' | 'blocked';

const dimensions: DimensionPlan[] = [
  {
    code: 'PRODUCTLINE',
    name: 'Produktlinie',
    globalDimensionCandidate: 1,
    values: [
      { code: 'SOFTWARE', name: 'Software' },
      { code: 'SERVICE', name: 'Service' },
      { code: 'TRAINING', name: 'Training' }
    ]
  },
  {
    code: 'COSTCENTER',
    name: 'Kostenstelle',
    globalDimensionCandidate: 2,
    values: [
      { code: 'ADMIN', name: 'Administration' },
      { code: 'SALES', name: 'Vertrieb' },
      { code: 'OPERATIONS', name: 'Betrieb' }
    ]
  },
  {
    code: 'CHANNEL',
    name: 'Vertriebskanal',
    globalDimensionCandidate: null,
    values: [
      { code: 'DIRECT', name: 'Direkt' },
      { code: 'PARTNER', name: 'Partner' }
    ]
  }
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

function cleanEvidenceLine(value: string) {
  return value
    .replace(/\u00C3\u00A4/g, 'ae')
    .replace(/\u00C3\u00B6/g, 'oe')
    .replace(/\u00C3\u00BC/g, 'ue')
    .replace(/\u00C3\u009F/g, 'ss')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function sanitizeUrl(rawUrl: string) {
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

function isEvidenceNoise(line: string) {
  return /trustedOriginAuthorities|allowedEndpoints|clientId|login\.microsoftonline\.com|graph\.microsoft\.com|officeapps\.live\.com|officeshell/i.test(
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

async function assertSafeContext(page: Page) {
  const currentUrl = page.url();
  expect(instancePathIsTarget(currentUrl), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${currentUrl}`).toBe(true);
  expect(companyParamIsTarget(currentUrl), `URL muss Company ${TARGET_COMPANY} enthalten: ${currentUrl}`).toBe(true);
}

async function openDimensionsPage(page: Page) {
  await page.goto(buildPlaythruUrl(536).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
  return findBcFrame(page, /Dimensionen|Dimensions/i);
}

async function openGeneralLedgerSetup(page: Page) {
  await page.goto(buildPlaythruUrl(118).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (expected.test(bodyText)) {
      return { frame, bodyText };
    }
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
}

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible({ timeout }).catch(() => false)) {
      return candidate;
    }
  }
  return undefined;
}

async function clickAction(frame: Frame, name: RegExp) {
  for (const role of ['button', 'menuitem'] as const) {
    const action = await firstVisible(frame.getByRole(role, { name }), 1000);
    if (action) {
      await action.click({ force: true });
      return true;
    }
  }
  const textAction = await firstVisible(frame.getByText(name), 1000);
  if (textAction) {
    await textAction.click({ force: true });
    return true;
  }
  return false;
}

async function visibleTextboxValues(scope: Frame | Locator) {
  const values: string[] = [];
  const textboxes = scope.locator('input[role="textbox"], textarea[role="textbox"], span[role="textbox"]');
  const count = await textboxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = textboxes.nth(index);
    if (!(await box.isVisible({ timeout: 300 }).catch(() => false))) continue;
    const value =
      (await box.inputValue({ timeout: 300 }).catch(() => '')) ||
      (await box.innerText({ timeout: 300 }).catch(() => '')) ||
      (await box.getAttribute('title').catch(() => '')) ||
      (await box.getAttribute('aria-label').catch(() => '')) ||
      '';
    const normalized = value.trim();
    if (normalized) values.push(normalized);
  }
  return values;
}

async function editableTextboxes(scope: Frame | Locator) {
  const candidates: Locator[] = [];
  const textboxes = scope.locator('input[role="textbox"], textarea[role="textbox"]');
  const count = await textboxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = textboxes.nth(index);
    if (!(await box.isVisible({ timeout: 300 }).catch(() => false))) continue;
    if ((await box.isDisabled({ timeout: 300 }).catch(() => false)) || (await box.isEditable({ timeout: 300 }).catch(() => false)) === false) {
      continue;
    }
    candidates.push(box);
  }
  return candidates;
}

async function fillFirstEmptyPair(frame: Frame, code: string, name: string) {
  const forms = frame.getByRole('form');
  const formCount = await forms.count().catch(() => 0);
  const scopes: Array<Frame | Locator> = [frame];
  for (let index = 0; index < formCount; index += 1) {
    scopes.unshift(forms.nth(index));
  }

  for (const scope of scopes) {
    const rows = scope.getByRole('row');
    const rowCount = await rows.count().catch(() => 0);
    for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
      const row = rows.nth(rowIndex);
      if (!(await row.isVisible({ timeout: 300 }).catch(() => false))) continue;
      const rowBoxes = await editableTextboxes(row);
      if (rowBoxes.length < 2) continue;
      const firstValue = await rowBoxes[0].inputValue({ timeout: 300 }).catch(() => '');
      if (firstValue.trim()) continue;
      await rowBoxes[0].click({ force: true });
      await rowBoxes[0].fill('');
      await pageKeyboardInsert(rowBoxes[0].page(), code);
      await rowBoxes[1].click({ force: true });
      await rowBoxes[1].fill('');
      await pageKeyboardInsert(rowBoxes[1].page(), name);
      await rowBoxes[1].page().keyboard.press('Tab');
      await rowBoxes[1].page().waitForTimeout(1800);
      return true;
    }

    const boxes = await editableTextboxes(scope);
    if (boxes.length < 2) continue;
    const firstValue = await boxes[0].inputValue({ timeout: 300 }).catch(() => '');
    if (firstValue.trim()) continue;
    await boxes[0].click({ force: true });
    await boxes[0].fill('');
    await pageKeyboardInsert(boxes[0].page(), code);
    await boxes[1].click({ force: true });
    await boxes[1].fill('');
    await pageKeyboardInsert(boxes[1].page(), name);
    await boxes[1].page().keyboard.press('Tab');
    await boxes[1].page().waitForTimeout(1800);
    return true;
  }
  return false;
}

async function pageKeyboardInsert(page: Page, value: string) {
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(value);
}

async function ensureDimension(page: Page, plan: DimensionPlan): Promise<{ status: StepStatus; reason: string }> {
  let { frame, bodyText } = await openDimensionsPage(page);
  if (new RegExp(`\\b${plan.code}\\b`, 'i').test(bodyText)) {
    return { status: 'already-exists', reason: `${plan.code} ist bereits sichtbar.` };
  }

  const clickedNew = await clickAction(frame, /^(Neu|New)$/i);
  if (!clickedNew) {
    return { status: 'blocked', reason: 'Neu/New auf der Dimensionsliste nicht sichtbar.' };
  }

  await expect.poll(() => pageText(page), { timeout: 20_000 }).toMatch(/Neu|New|Dimension/i);
  await page.waitForTimeout(1000);
  frame = (await findBcFrame(page, /Neu|New|Dimensionen|Dimensions/i)).frame;

  const filled = await fillFirstEmptyPair(frame, plan.code, plan.name);
  if (!filled) {
    return { status: 'blocked', reason: `Keine editierbaren Code/Name-Felder fuer ${plan.code} gefunden.` };
  }

  await page.keyboard.press('Control+Enter').catch(() => undefined);
  await page.waitForTimeout(2500);
  ({ bodyText } = await openDimensionsPage(page));
  if (!new RegExp(`\\b${plan.code}\\b`, 'i').test(bodyText)) {
    return { status: 'blocked', reason: `${plan.code} war nach Eingabe/Reopen nicht sichtbar.` };
  }
  return { status: 'created', reason: `${plan.code} wurde angelegt und nach Reopen sichtbar.` };
}

async function openDimensionValues(page: Page, plan: DimensionPlan) {
  await page.goto(buildDimensionValuesUrl(plan.code).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1500);
  await assertSafeContext(page);
  return findBcFrame(page, new RegExp(`${plan.code}|Dimensionswerte|Dimension Values`, 'i'));
}

async function ensureDimensionValue(
  page: Page,
  plan: DimensionPlan,
  value: { code: string; name: string }
): Promise<{ status: StepStatus; reason: string }> {
  try {
    let { frame } = await openDimensionValues(page, plan);
    let values = await visibleTextboxValues(frame);
    const pageBody = await pageText(page);
    if (values.includes(value.code) || new RegExp(`\\b${value.code}\\b`, 'i').test(pageBody)) {
      return { status: 'already-exists', reason: `${plan.code}.${value.code} ist bereits sichtbar.` };
    }

    await clickAction(frame, /Liste bearbeiten|Edit List/i);
    await page.waitForTimeout(800);
    ({ frame } = await findBcFrame(page, new RegExp(`${plan.code}|Dimensionswerte|Dimension Values`, 'i')));

    const clickedNew = await clickAction(frame, /^(Neu|New)$/i);
    if (!clickedNew) {
      await clickAction(frame, /Liste bearbeiten|Edit List/i);
    }
    await page.waitForTimeout(1000);
    ({ frame } = await findBcFrame(page, new RegExp(`${plan.code}|Dimensionswerte|Dimension Values`, 'i')));

    let filled = await fillFirstEmptyPair(frame, value.code, value.name);
    if (!filled && clickedNew) {
      await page.keyboard.insertText(value.code);
      await page.keyboard.press('Tab');
      await page.keyboard.insertText(value.name);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(1800);
      filled = true;
    }
    if (!filled) {
      return { status: 'blocked', reason: `Keine editierbare Dimensionswerte-Zeile fuer ${plan.code}.${value.code}.` };
    }
    await page.keyboard.press('Control+Enter').catch(() => undefined);
    await page.waitForTimeout(2500);

    ({ frame } = await openDimensionValues(page, plan));
    values = await visibleTextboxValues(frame);
    const text = await pageText(page);
    if (!values.includes(value.code) && !new RegExp(`\\b${value.code}\\b`, 'i').test(text)) {
      return { status: 'blocked', reason: `${plan.code}.${value.code} war nach Reopen nicht sichtbar.` };
    }
    return { status: 'created', reason: `${plan.code}.${value.code} wurde angelegt und nach Reopen sichtbar.` };
  } catch (error) {
    return { status: 'blocked', reason: error instanceof Error ? error.message : String(error) };
  }
}

async function compactDimensionText(page: Page) {
  const compact = await compactPageText(page, {
    include: [/Dimension|Dimensions|Code|Name|PRODUCTLINE|COSTCENTER|CHANNEL|SOFTWARE|SERVICE|TRAINING|ADMIN|SALES|OPERATIONS|DIRECT|PARTNER/i],
    maxLines: 120,
    maxLineLength: 180
  });
  return compact
    .split('\n')
    .map((line) => cleanEvidenceLine(line))
    .filter((line) => line && !isEvidenceNoise(line))
    .join('\n');
}

test('TARGET-023 controlled dimension and value setup fit', async ({ page }) => {
  test.setTimeout(600_000);
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const beforeFrame = await openDimensionsPage(page);
  await writeText('dimensions-before.txt', await compactDimensionText(page));
  await screenshotWithMetadata(page, 'target-023-010-dimensions-before.png', {
    pageId: 536,
    page: 'Dimensionen / Dimensions',
    step: 'Vorher-Zustand vor Dimension-Code-Anlage',
    status: 'universaarl-setup-before',
    bookUse: 'setup-before',
    importantUi: ['Dimensionsliste mit Code/Name-Spalten und Neu-Aktion.'],
    internallyProves: 'Die Dimensionsliste wurde in playthru / UNIVERSAARL-DE vor dem Schreibschritt geoeffnet.',
    doesNotProve: ['Keine Dimension wurde allein durch diesen Screenshot angelegt.', 'Keine Reportingwirkung oder Postenwirkung.'],
    visibleRowsBefore: beforeFrame.bodyText.slice(0, 1200)
  });

  const dimensionResults: Array<{ code: string; status: StepStatus; reason: string }> = [];
  const valueResults: Array<{ dimensionCode: string; valueCode: string; status: StepStatus; reason: string }> = [];

  for (const plan of dimensions) {
    const dimensionResult = await ensureDimension(page, plan);
    dimensionResults.push({ code: plan.code, ...dimensionResult });
    if (dimensionResult.status === 'blocked') {
      continue;
    }

    for (const value of plan.values) {
      const valueResult = await ensureDimensionValue(page, plan, value);
      valueResults.push({ dimensionCode: plan.code, valueCode: value.code, ...valueResult });
    }

    await openDimensionValues(page, plan).catch(() => undefined);
    await writeText(`${plan.code.toLowerCase()}-values-after.txt`, await compactDimensionText(page));
    await screenshotWithMetadata(page, `target-023-${plan.code.toLowerCase()}-values-after.png`, {
      page: 'Dimensionswerte / Dimension Values',
      step: `Nachher-Zustand fuer ${plan.code}`,
      status: 'universaarl-setup-after',
      bookUse: 'field-proof',
      importantUi: [`${plan.code} mit Zielwerten ${plan.values.map((entry) => entry.code).join(', ')}.`],
      internallyProves: `Die Dimensionswerte-Seite fuer ${plan.code} wurde nach Anlage/Verifizierung geoeffnet.`,
      doesNotProve: ['Keine Standarddimension wurde zugewiesen.', 'Keine Buchung oder Reportingwirkung wurde erzeugt.']
    });
  }

  await openDimensionsPage(page);
  const afterText = await compactDimensionText(page);
  await writeText('dimensions-after-reopen.txt', afterText);
  await screenshotWithMetadata(page, 'target-023-090-dimensions-after-reopen.png', {
    pageId: 536,
    page: 'Dimensionen / Dimensions',
    step: 'Nachher-Reopen der Dimensionsliste',
    status: 'universaarl-setup-after-reopen',
    bookUse: 'setup-after',
    importantUi: ['PRODUCTLINE, COSTCENTER und CHANNEL muessen in der Liste sichtbar sein.'],
    internallyProves: 'Die angelegten/verifizierten Dimension-Codes sind nach erneutem Oeffnen der Liste sichtbar.',
    doesNotProve: ['Keine Global-Dimension-Assignment-Wirkung.', 'Keine Standarddimensionen auf Stammdaten.', 'Keine Posten.']
  });

  await openGeneralLedgerSetup(page);
  await writeText('general-ledger-setup-dimension-context.txt', await compactDimensionText(page));
  await screenshotWithMetadata(page, 'target-023-095-general-ledger-setup-dimension-context.png', {
    pageId: 118,
    page: 'Finanzbuchhaltung Einrichtung / General Ledger Setup',
    step: 'Kontext fuer globale Dimensionen nach Dimensionsanlage',
    status: 'universaarl-global-dimension-context-readonly',
    bookUse: 'setup-context',
    importantUi: ['Globaler Dimensionscode 1/2 sind hier die spaeteren Standard-Auswertungsachsen.'],
    internallyProves: 'General Ledger Setup wurde nach Dimension-Setup als Kontext erneut geoeffnet.',
    doesNotProve: ['Global Dimension Code 1/2 wurden in TARGET-023 noch nicht zugewiesen.']
  });

  const blockedBy = [
    ...dimensionResults.filter((entry) => entry.status === 'blocked').map((entry) => `${entry.code}: ${entry.reason}`),
    ...valueResults.filter((entry) => entry.status === 'blocked').map((entry) => `${entry.dimensionCode}.${entry.valueCode}: ${entry.reason}`)
  ];
  const allDimensionCodesVisible = dimensions.every((entry) => new RegExp(`\\b${entry.code}\\b`, 'i').test(afterText));
  const allValuesSucceeded = valueResults.length === dimensions.flatMap((entry) => entry.values).length && blockedBy.length === 0;
  const resultStatus = blockedBy.length ? 'blocked' : 'observed';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-dimensions-controlled-setup-fit',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    setupChanged: dimensionResults.some((entry) => entry.status === 'created') || valueResults.some((entry) => entry.status === 'created'),
    dimensionResults,
    valueResults,
    proved: [
      `Dimensions page 536 was opened in ${EXPECTED_INSTANCE}/${TARGET_COMPANY} before and after the setup fit.`,
      ...(allDimensionCodesVisible
        ? ['PRODUCTLINE, COSTCENTER and CHANNEL are visible after reopening the Dimensions list.']
        : []),
      ...(allValuesSucceeded
        ? ['Starter Dimension Values for PRODUCTLINE, COSTCENTER and CHANNEL were created or verified through the UI.']
        : []),
      'No master data, document draft, preview posting, posting, company switch or API shortcut was executed.'
    ],
    notProved: [
      'Global Dimension Code 1/2 assignment is not proven by TARGET-023.',
      'Default Dimensions for customers, vendors, items or accounts are not proven.',
      'Dimension Set Entries, posted entries and reporting filters are not proven.',
      ...blockedBy
    ],
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-023-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/README.md`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-023-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-023-result.json`,
      'playwright/projects/fibu-book5/img/target-023-010-dimensions-before.png',
      ...dimensions.map((entry) => `playwright/projects/fibu-book5/img/target-023-${entry.code.toLowerCase()}-values-after.png`),
      'playwright/projects/fibu-book5/img/target-023-090-dimensions-after-reopen.png',
      'playwright/projects/fibu-book5/img/target-023-095-general-ledger-setup-dimension-context.png'
    ],
    blockedBy,
    warnings: [
      'TARGET-023 intentionally does not set Global Dimension Code 1/2 because that needs a separate field-assignment proof.',
      'No final reporting claim is allowed until posted entries with dimensions exist.'
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
      setupChanged: dimensionResults.some((entry) => entry.status === 'created') || valueResults.some((entry) => entry.status === 'created'),
      setupChangeAllowedByCase: true
    },
    nextStepDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: 'TARGET-024-CORE-MASTERDATA-PLAN',
      lastEvidenceSummary:
        'TARGET-022 selected PRODUCTLINE, COSTCENTER and CHANNEL based on TARGET-021 empty dimension context and Microsoft Learn dimension guidance.',
      isPlannedNextCaseStillSensible: resultStatus === 'observed',
      reason:
        resultStatus === 'observed'
          ? 'Dimension codes and starter values are now ready enough to plan master data and later default dimensions.'
          : 'Dimension setup fit is blocked; master data planning should wait or explicitly park the blocked values.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-024-CORE-MASTERDATA-PLAN',
          status: resultStatus === 'observed' ? 'ready-next' : 'needs-setup-first',
          reason: 'Master data should use the new dimension design only after dimensions/values are visible.'
        },
        {
          caseId: 'TARGET-024B-GLOBAL-DIMENSION-ASSIGNMENT',
          status: allDimensionCodesVisible ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Global Dimension Code 1/2 assignment needs its own field route and before/after/reopen proof.'
        },
        {
          caseId: 'TARGET-025-CUSTOMER-VENDOR-ITEM-TEMPLATES-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Templates depend on master-data plan, VAT/defaults and dimension defaults.'
        },
        {
          caseId: 'TARGET-026-VAT-SETUP-FIT-DECISION',
          status: 'needs-source-check-first',
          reason: 'German VAT setup still needs its own source-backed setup decision before document preview.'
        },
        {
          caseId: 'TARGET-027-FIRST-MASTERDATA-CANDIDATE',
          status: 'needs-setup-first',
          reason: 'First customer/vendor/item should wait for master-data plan and default-dimension decision.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: resultStatus === 'observed' ? 'TARGET-024-CORE-MASTERDATA-PLAN' : 'TARGET-023B-DIMENSION-VALUES-ROUTE-RECOVERY',
      whySelectedNextCaseIsBest:
        resultStatus === 'observed'
          ? 'The next useful book/process step is to design first customers, vendors and items using the proven foundation.'
          : 'The current route did not safely finish dimension values, so another UI route or park decision is required before master data.',
      risksBeforeNextCase: [
        'Do not claim reporting readiness before posted entries with dimensions exist.',
        'Do not silently assign default dimensions to master data without a separate case.',
        'Do not treat Global Dimension Code 1/2 as assigned in TARGET-023.'
      ],
      requiredPreparation: [
        'Use TARGET-023 screenshots as setup foundation only.',
        'Plan Global Dimension assignment separately if it is required before first documents.'
      ]
    },
    requiresReview: blockedBy.length > 0,
    safeToFinalizeState: false,
    statePatch: {},
    reason:
      blockedBy.length > 0
        ? 'Dimension setup route produced blockers; no master data or posting was executed.'
        : 'Core Universaarl dimensions and starter values were created or verified through the UI.'
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-023 Dimension Value Controlled Setup Fit',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Dimensionen',
      '',
      ...dimensionResults.map((entry) => `- ${entry.code}: ${entry.status} - ${entry.reason}`),
      '',
      '## Dimensionswerte',
      '',
      ...valueResults.map((entry) => `- ${entry.dimensionCode}.${entry.valueCode}: ${entry.status} - ${entry.reason}`),
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.',
      '- Global Dimension Code 1/2 wurde noch nicht gesetzt.',
      '- Reportingwirkung braucht spaeter gebuchte Posten und Dimension Set Entries.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(allDimensionCodesVisible).toBe(true);
});
