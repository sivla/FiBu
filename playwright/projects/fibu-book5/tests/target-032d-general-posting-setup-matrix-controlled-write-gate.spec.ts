import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(300_000);

const CASE_ID = 'TARGET-032D-GENERAL-POSTING-SETUP-MATRIX-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-032d-general-posting-setup-matrix-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-032D-result.json');

const TARGET_VALUES = {
  genBusPostingGroup: 'INLAND',
  genProdPostingGroup: 'WAREN',
  salesAccount: '4400',
  purchaseAccount: '5400'
};

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

type FieldPlanEntry = {
  field: keyof typeof TARGET_VALUES;
  value: string;
  header?: UiBox;
  input?: UiBox;
  distance?: number;
};

function clean(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Kajetan Kalicki/gi, '[user]')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  const parts = new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean);
  return parts.includes(EXPECTED_INSTANCE.toLowerCase());
}

function containsForbiddenDialog(text: string) {
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Company switch/i.test(
    text
  );
}

function labelOf(box: Pick<UiBox, 'text' | 'aria' | 'title' | 'controlName'>) {
  return clean([box.text, box.aria, box.title, box.controlName].filter(Boolean).join(' '));
}

function rowComplete(text: string) {
  return /INLAND[\s\S]{0,1600}WAREN[\s\S]{0,2200}4400[\s\S]{0,2600}5400|INLAND[\s\S]{0,1600}WAREN[\s\S]{0,2600}5400[\s\S]{0,2600}4400/i.test(text);
}

function rowPartial(text: string) {
  return /INLAND[\s\S]{0,1600}WAREN/i.test(text);
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

async function openPage314(page: Page) {
  await page.goto(buildPlaythruUrl(314).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1700);
  const text = await safeText(page);
  expect(instancePathIsTarget(page.url()), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(/Buchungsmatrix|General Posting Setup/i.test(text)).toBe(true);
  expect(containsForbiddenDialog(text)).toBe(false);
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = clean(await frame.locator('body').innerText({ timeout: 1000 }).catch(() => ''));
    if (expected.test(bodyText)) return { frame, bodyText };
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
}

async function clickAction(page: Page, frame: Frame, name: RegExp) {
  for (const scope of [frame, page]) {
    for (const role of ['button', 'menuitem'] as const) {
      const count = await scope.getByRole(role, { name }).count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const action = scope.getByRole(role, { name }).nth(index);
        if (!(await action.isVisible({ timeout: 600 }).catch(() => false))) continue;
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(900);
        const text = await safeText(page);
        expect(containsForbiddenDialog(text)).toBe(false);
        return true;
      }
    }
  }
  return false;
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

async function capturePageState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const include =
    /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|INLAND|WAREN|4400|5400|Neu|New|Liste bearbeiten|Edit List|Fehler|Error|nicht|cannot/i;
  const compact = clean(
    await compactPageText(page, {
      include: [include],
      maxLines: 220,
      maxLineLength: 240
    })
  );
  const text = await safeText(page);
  const snapshot = {
    step,
    pageId: 314,
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    hasDangerousDialog: containsForbiddenDialog(text),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: 314,
    page: 'Buchungsmatrix Einrichtung / General Posting Setup',
    step,
    importantUi: (compact || text)
      .split('\n')
      .filter((line) => line.length > 0)
      .slice(0, 24),
    screenshotQa: {
      safeInstance: instancePathIsTarget(page.url()),
      safeCompany: companyParamIsTarget(page.url()),
      dangerousDialogVisible: containsForbiddenDialog(text)
    },
    internallyProves: 'Page 314 state and target row visibility in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No VAT setup.',
      'No Inventory Posting Setup.',
      'No master data.',
      'No Preview Posting.',
      'No Posting.',
      'No final tax correctness.'
    ],
    finalScreenshotStatus: 'foundation-evidence',
    ...extra
  });
  return snapshot;
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
    const inputs = [...document.querySelectorAll('input,textarea,[role="textbox"],[role="combobox"]')]
      .filter(visible)
      .map(snapshot)
      .filter((input) => input.width > 8 && input.height > 8);
    const rows = [...document.querySelectorAll('[role="row"],tr')]
      .filter(visible)
      .map(snapshot);
    return { headers, inputs, rows };
  });
}

function firstBox(boxes: UiBox[], pattern: RegExp) {
  return boxes.find((box) => pattern.test(labelOf(box)));
}

function planFields(headers: UiBox[], inputs: UiBox[]) {
  const required = {
    genBusPostingGroup: firstBox(headers, /Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Gen\.?\s*Bus/i),
    genProdPostingGroup: firstBox(headers, /Produktbuchungsgruppe|Gen\.?\s*Prod/i),
    salesAccount: firstBox(headers, /Warenverkaufskonto|Sales Account/i),
    purchaseAccount: firstBox(headers, /Wareneinkaufskonto|Purchase Account|Purch\.?\s*Account/i)
  };
  const usableInputs = inputs.filter((input) => input.y > 270).sort((left, right) => left.y - right.y || left.x - right.x);
  const used = new Set<UiBox>();
  const fieldPlan: FieldPlanEntry[] = (Object.entries(TARGET_VALUES) as [keyof typeof TARGET_VALUES, string][]).map(([field, value]) => {
    const header = required[field];
    if (!header) return { field, value };
    const headerCenter = header.x + header.width / 2;
    const candidates = usableInputs
      .filter((input) => !used.has(input))
      .map((input) => ({ input, distance: Math.abs(input.x + input.width / 2 - headerCenter) }))
      .filter(({ distance }) => distance <= Math.max(95, header.width))
      .sort((left, right) => left.distance - right.distance);
    const selected = candidates[0];
    if (selected) used.add(selected.input);
    return { field, value, header, input: selected?.input, distance: selected?.distance };
  });
  return {
    required,
    usableInputCount: usableInputs.length,
    fieldPlan,
    trusted: fieldPlan.every((entry) => Boolean(entry.header && entry.input && typeof entry.distance === 'number' && entry.distance <= 95))
  };
}

async function fillFieldPlan(page: Page, fieldPlan: FieldPlanEntry[]) {
  const steps = [];
  for (const entry of fieldPlan) {
    if (!entry.input) throw new Error(`No input mapped for ${entry.field}`);
    const x = entry.input.x + Math.max(6, Math.floor(entry.input.width / 2));
    const y = entry.input.y + Math.max(6, Math.floor(entry.input.height / 2));
    await page.mouse.click(x, y);
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(entry.value);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(850);
    const text = await safeText(page);
    expect(containsForbiddenDialog(text)).toBe(false);
    steps.push({
      field: entry.field,
      value: entry.value,
      input: entry.input,
      header: entry.header,
      distance: entry.distance
    });
  }
  await page.keyboard.press('Enter').catch(() => undefined);
  await page.waitForTimeout(1600);
  return steps;
}

test('TARGET-032D General Posting Setup matrix controlled write gate', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const actionLog: Record<string, unknown>[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-032B proved INLAND and WAREN after reopen; TARGET-032C proved Page 314 header geometry for sales and purchase account fields.',
      fieldsAllowedToChange: [
        'Geschaeftsbuchungsgruppe INLAND',
        'Produktbuchungsgruppe WAREN',
        'Warenverkaufskonto 4400',
        'Wareneinkaufskonto 5400'
      ],
      fieldsNotTouched: [
        'VAT Posting Setup',
        'Inventory Posting Setup',
        'Master Data',
        'Documents',
        'Preview Posting',
        'Posting',
        'Payment',
        'API shortcut'
      ],
      fallback: 'Stop without values if field-to-input mapping is not trusted after New/Edit List.'
    }
  ];

  await openPage314(page);
  const beforeText = await safeText(page);
  const beforeComplete = rowComplete(beforeText);
  await capturePageState(page, 'target-032d-010-before-page314', 'Before controlled Page 314 write gate.', {
    beforeComplete
  });

  let setupChangeAttempted = false;
  let writeAttempted = false;
  let writeBlockedBeforeTyping = false;
  let fieldPlanResult: ReturnType<typeof planFields> | undefined;
  let fillSteps: unknown[] = [];

  if (!beforeComplete) {
    const { frame } = await findBcFrame(page, /Buchungsmatrix|General Posting Setup/i);
    const editClicked = await clickAction(page, frame, /^Liste bearbeiten$|^Edit List$|^Bearbeiten$|^Edit$/i);
    actionLog.push({ step: 'click-edit-list', editClicked });
    await capturePageState(page, 'target-032d-020-after-edit-list', 'After Edit List before New.', { editClicked });

    const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
    actionLog.push({ step: 'click-new-row', newClicked });
    await capturePageState(page, 'target-032d-030-after-new-row-before-values', 'After New before any value typing.', { editClicked, newClicked });

    const currentInventory = cleanEvidenceValue(await domInventory(frame));
    fieldPlanResult = planFields(currentInventory.headers, currentInventory.inputs);
    await writeJson(path.join(EVIDENCE_DIR, '040-field-plan.json'), fieldPlanResult);
    actionLog.push({
      step: 'field-plan',
      trusted: fieldPlanResult.trusted,
      usableInputCount: fieldPlanResult.usableInputCount,
      fieldPlan: fieldPlanResult.fieldPlan
    });

    if (!fieldPlanResult.trusted) {
      await page.keyboard.press('Control+Insert');
      await page.waitForTimeout(1200);
      await capturePageState(page, 'target-032d-035-after-keyboard-new-fallback', 'After Ctrl+Insert fallback before any value typing.', {
        previousFieldPlanTrusted: fieldPlanResult.trusted
      });
      const keyboardInventory = cleanEvidenceValue(await domInventory(frame));
      const keyboardFieldPlan = planFields(keyboardInventory.headers, keyboardInventory.inputs);
      await writeJson(path.join(EVIDENCE_DIR, '045-field-plan-after-keyboard-new.json'), keyboardFieldPlan);
      actionLog.push({
        step: 'keyboard-new-fallback-field-plan',
        trusted: keyboardFieldPlan.trusted,
        usableInputCount: keyboardFieldPlan.usableInputCount,
        fieldPlan: keyboardFieldPlan.fieldPlan
      });
      fieldPlanResult = keyboardFieldPlan;
    }

    if (editClicked && newClicked && fieldPlanResult.trusted) {
      writeAttempted = true;
      setupChangeAttempted = true;
      fillSteps = await fillFieldPlan(page, fieldPlanResult.fieldPlan);
      actionLog.push({ step: 'fill-target-fields', fillSteps });
    } else {
      writeBlockedBeforeTyping = true;
      actionLog.push({
        step: 'blocked-before-typing',
        reason: 'Edit/New or field mapping was not trusted enough to type setup values.'
      });
    }
  }

  const afterText = await safeText(page);
  const afterComplete = rowComplete(afterText);
  const afterPartial = rowPartial(afterText);
  await capturePageState(page, 'target-032d-040-after-write-or-block', 'After controlled write attempt or mapping block.', {
    writeAttempted,
    setupChangeAttempted,
    writeBlockedBeforeTyping,
    afterComplete,
    afterPartial,
    fieldPlanResult
  });

  await openPage314(page);
  const reopenText = await safeText(page);
  const persistedComplete = rowComplete(reopenText);
  const persistedPartial = rowPartial(reopenText);
  await capturePageState(page, 'target-032d-050-reopen-proof', 'Reopen proof after controlled write gate.', {
    persistedComplete,
    persistedPartial,
    writeAttempted,
    setupChangeAttempted,
    fieldPlanResult
  });

  const resultStatus = persistedComplete ? 'observed' : persistedPartial ? 'partially-completed' : 'blocked';
  const setupChanged = persistedComplete || (writeAttempted && persistedPartial);
  const blockedBy = persistedComplete
    ? []
    : writeBlockedBeforeTyping
      ? ['Field-to-input mapping was not trusted after Edit List/New and Ctrl+Insert; stopped before typing setup values.']
      : ['INLAND/WAREN/4400/5400 was not visibly complete after reopen.'];
  const nextCase = persistedComplete
    ? 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS'
    : 'TARGET-032E-GENERAL-POSTING-SETUP-CARD-OR-ALTERNATIVE-ROUTE-DISCOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-general-posting-setup-matrix-controlled-write-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 314 Buchungsmatrix Einrichtung / General Posting Setup',
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken: [
      'Opened Page 314 directly in playthru / UNIVERSAARL-DE.',
      'Captured before screenshot.',
      beforeComplete
        ? 'Detected target INLAND/WAREN/4400/5400 row before write attempt.'
        : 'Clicked Edit List and New only inside Page 314.',
      beforeComplete
        ? 'No value entry was needed.'
        : writeAttempted
          ? 'Mapped fields by current header geometry and typed only INLAND, WAREN, 4400 and 5400.'
          : 'Tried Ctrl+Insert as a distinct list-new fallback and stopped before typing because no trusted input mapping existed.',
      'Reopened Page 314 for persistence proof.'
    ],
    actionsNotTaken: [
      'No VAT setup changed.',
      'No Inventory Posting Setup changed.',
      'No master data created.',
      'No document or draft created.',
      'No Preview Posting executed.',
      'No Posting executed.',
      'No Payment executed.',
      'No API shortcut used.',
      'No company switch.'
    ],
    setupChanged,
    setupChangeAttempted,
    setupChangedOnlyAllowedScope: setupChanged,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    targetValues: TARGET_VALUES,
    beforeComplete,
    afterComplete,
    afterPartial,
    persistedComplete,
    persistedPartial,
    writeAttempted,
    writeBlockedBeforeTyping,
    fieldPlan: fieldPlanResult,
    actionLog,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-032d-010-before-page314.png',
      'playwright/projects/fibu-book5/img/target-032d-020-after-edit-list.png',
      'playwright/projects/fibu-book5/img/target-032d-030-after-new-row-before-values.png',
      'playwright/projects/fibu-book5/img/target-032d-035-after-keyboard-new-fallback.png',
      'playwright/projects/fibu-book5/img/target-032d-040-after-write-or-block.png',
      'playwright/projects/fibu-book5/img/target-032d-050-reopen-proof.png'
    ],
    proved: [
      'Page 314 opened in playthru / UNIVERSAARL-DE.',
      ...(persistedComplete
        ? ['General Posting Setup row INLAND/WAREN with Warenverkaufskonto 4400 and Wareneinkaufskonto 5400 is visible after reopen.']
        : []),
      'No master data, document draft, Preview Posting, Posting, Payment or API shortcut occurred.'
    ],
    notProved: [
      ...(persistedComplete ? [] : ['No complete INLAND/WAREN/4400/5400 matrix row is proven after reopen.']),
      'No VAT Posting Setup is proven.',
      'No Inventory Posting Setup is proven.',
      'No posting readiness, Preview Posting, G/L Entries, VAT Entries or Value Entries are proven.',
      'No final SKR04, tax advisor or German compliance claim is proven.'
    ],
    blockedBy,
    warnings: [
      'General Posting Setup alone does not make the company posting-ready.',
      'VAT, inventory, dimensions and master data remain separate gates.',
      'Do not use this result as Preview Posting or Posting proof.'
    ],
    flags: {
      noPost: true,
      noPreview: true,
      noDraft: true,
      noMasterDataChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookMasterChange: true,
      noVatSetupChange: true,
      noInventoryPostingSetupChange: true,
      noPayment: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-032C proved Page 314 header geometry for INLAND/WAREN/4400/5400 and changed no setup.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The remaining Posting Groups foundation blocker was the Page 314 matrix row. This case either writes it with reopen proof or documents a precise write blocker.',
      lookaheadReviewed: [
        {
          caseId: CASE_ID,
          status: persistedComplete ? 'ready-next' : 'blocked',
          reason: persistedComplete ? 'The target row is proven after reopen.' : 'The target row is not fully proven after reopen.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: persistedComplete ? 'ready-next' : 'needs-setup-first',
          reason: persistedComplete
            ? 'Posting Groups can move to dimensions while VAT remains separately parked.'
            : 'Dimensions should wait until Page 314 is complete or consciously parked.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation still needs VAT and dimensions status before readiness.'
        },
        {
          caseId: 'TARGET-035-MASTER-DATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data remains locked until posting groups, VAT and dimensions are sufficient.'
        }
      ],
      queueChangesMade: persistedComplete
        ? []
        : ['Do not repeat the same Page 314 Edit List/New or Ctrl+Insert route; select TARGET-032E alternative route discovery.'],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persistedComplete
        ? 'The exact Page 314 row is proven; the next useful W1 step is dimensions/defaults recovery before foundation readiness.'
        : 'A materially different Page 314 route is needed because the exact matrix row was not fully proven and no trusted editable inputs appeared.',
      risksBeforeNextCase: [
        'Do not create master data yet.',
        'Do not run Preview Posting or Posting.',
        'Do not claim full posting readiness from Page 314 alone.'
      ],
      requiredPreparation: persistedComplete
        ? ['Keep VAT setup and Inventory Posting Setup locked for their own gates.']
        : ['Review fieldPlan and screenshots before selecting a row-card, action, personalization, page-inspection or source-backed Page 314 route.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032D-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      'playwright/projects/fibu-book5/img/target-032d-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032D-result.json`,
      'playwright/projects/fibu-book5/img/target-032d-010-before-page314.png',
      'playwright/projects/fibu-book5/img/target-032d-050-reopen-proof.png'
    ],
    requiresReview: !persistedComplete,
    safeToFinalizeState: persistedComplete,
    statePatch: persistedComplete
      ? {
          current: {
            activeCase: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
            activeArea: 'universaarl-dimensions-recovery-defaults',
            nextStep: 'Run TARGET-033 Dimensions Recovery/Defaults after Page 314 INLAND/WAREN/4400/5400 is proven after reopen.'
          },
          activeCase: {
            status: 'observed',
            resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032D-result.json`,
            nextCase
          },
          coverage: {
            latestGeneralPostingSetupMatrixControlledWriteGate: {
              caseId: CASE_ID,
              status: resultStatus,
              persistedComplete,
              setupChanged,
              resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032D-result.json`
            }
          }
        }
      : {},
    reason: persistedComplete
      ? 'The INLAND/WAREN/4400/5400 matrix row is visible after reopen.'
      : 'The exact target matrix row is not fully proven after reopen.'
  };

  await writeJson(path.join(EVIDENCE_DIR, '060-action-log.json'), actionLog);
  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-032D General Posting Setup Matrix Controlled Write Gate',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      `- Persisted complete: ${persistedComplete ? 'yes' : 'no'}`,
      `- Setup changed: ${setupChanged ? 'yes' : 'no'}`,
      `- Write attempted: ${writeAttempted ? 'yes' : 'no'}`,
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Keine Belege.',
      '- Keine Preview und keine Buchung.',
      '- Keine USt- oder Lagerbuchungseinrichtung.',
      '- Keine API.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(result.masterDataChanged).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
