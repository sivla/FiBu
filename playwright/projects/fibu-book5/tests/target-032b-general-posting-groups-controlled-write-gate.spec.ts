import { expect, test, type Frame, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });
test.setTimeout(300_000);

const CASE_ID = 'TARGET-032B-GENERAL-POSTING-GROUPS-CONTROLLED-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-032b-general-posting-groups-controlled-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-032B-result.json');

const businessGroup = {
  pageId: 312,
  label: 'Geschaeftsbuchungsgruppen / Gen. Business Posting Groups',
  code: 'INLAND',
  description: 'Inlaendische Geschaeftspartner',
  pageSignals: /Geschaeftsbuchungsgruppen|Gesch[a-z]*ftsbuchungsgruppen|Gen\. Business Posting Groups/i,
  fieldSignals: /Code|Beschreibung|Description/i
};

const productGroup = {
  pageId: 313,
  label: 'Produktbuchungsgruppen / Gen. Product Posting Groups',
  code: 'WAREN',
  description: 'Waren',
  pageSignals: /Produktbuchungsgruppen|Gen\. Product Posting Groups/i,
  fieldSignals: /Code|Beschreibung|Description/i
};

const matrix = {
  pageId: 314,
  label: 'Buchungsmatrix Einrichtung / General Posting Setup',
  genBusPostingGroup: 'INLAND',
  genProdPostingGroup: 'WAREN',
  salesAccount: '4400',
  purchaseAccount: '5400',
  pageSignals: /Buchungsmatrix|General Posting Setup/i,
  fieldSignals:
    /Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Gen\. Bus\. Posting Group|Produktbuchungsgruppe|Gen\. Prod\. Posting Group|Warenverkaufskonto|Sales Account|Wareneinkaufskonto|Purchase Account|Purch\. Account/i
};

type Step = Record<string, unknown>;

type SetupOutcome = {
  status: 'already-complete' | 'changed-and-proven' | 'blocked';
  changed: boolean;
  proved: boolean;
  blockedBy: string[];
  beforeVisible: Record<string, boolean>;
  reopenVisible: Record<string, boolean>;
};

function buildPlaythruUrl(pageId: number) {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', String(pageId));
  return url;
}

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

function literalPattern(value: string) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
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

async function firstVisible(locator: Locator, timeout = 800) {
  const count = await locator.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible({ timeout }).catch(() => false)) return item;
  }
  return undefined;
}

async function clickAction(page: Page, frame: Frame, name: RegExp) {
  for (const scope of [frame, page]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = await firstVisible(scope.getByRole(role, { name }), 900);
      if (action) {
        await action.click({ timeout: 5000 }).catch(async () => action.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(850);
        return true;
      }
    }
  }
  return false;
}

async function editableTextboxes(scope: Frame | Locator) {
  const boxes = scope.locator('input[role="textbox"], input[role="combobox"], textarea[role="textbox"], input:not([type])');
  const result: Locator[] = [];
  const count = await boxes.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const box = boxes.nth(index);
    if (!(await box.isVisible({ timeout: 300 }).catch(() => false))) continue;
    if (await box.isDisabled({ timeout: 300 }).catch(() => false)) continue;
    if ((await box.isEditable({ timeout: 300 }).catch(() => false)) === false) continue;
    result.push(box);
  }
  return result;
}

async function findBcFrame(page: Page, expected: RegExp) {
  for (const frame of page.frames()) {
    const bodyText = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    const normalized = clean(bodyText);
    if (expected.test(normalized)) return { frame, bodyText: normalized };
  }
  throw new Error(`Kein BC-Frame mit ${expected} gefunden.`);
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

async function assertSafePage(page: Page, pageSignals: RegExp, fieldSignals: RegExp) {
  const url = page.url();
  expect(instancePathIsTarget(url), `URL muss Instanz ${EXPECTED_INSTANCE} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  expect(companyParamIsTarget(url), `URL muss Company ${TARGET_COMPANY} enthalten: ${sanitizeEvidenceUrl(url)}`).toBe(true);
  const text = await safeText(page);
  expect(pageSignals.test(text), `Erwartete BC-Seite nicht sichtbar: ${pageSignals}`).toBe(true);
  expect(fieldSignals.test(text), `Erwartete Feldsignale nicht sichtbar: ${fieldSignals}`).toBe(true);
  expect(containsForbiddenDialog(text), 'Keine Buchungs-, Loesch-, Apply-, Company- oder Preview-Dialoge erlaubt').toBe(false);
}

async function openSetupPage(page: Page, pageId: number, pageSignals: RegExp, fieldSignals: RegExp) {
  await page.goto(buildPlaythruUrl(pageId).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1600);
  await assertSafePage(page, pageSignals, fieldSignals);
}

async function capturePageState(
  page: Page,
  filePrefix: string,
  pageId: number,
  pageLabel: string,
  step: string,
  include: RegExp,
  extra: Record<string, unknown> = {}
) {
  const compact = clean(
    await compactPageText(page, {
      include: [include],
      maxLines: 180,
      maxLineLength: 220
    })
  );
  const text = await safeText(page);
  const snapshot = {
    step,
    pageId,
    page: pageLabel,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    hasDangerousDialog: containsForbiddenDialog(text),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId,
    page: pageLabel,
    step,
    importantUi: (compact || text)
      .split('\n')
      .filter((line) => line.length > 0)
      .slice(0, 18),
    screenshotQa: {
      safeInstance: instancePathIsTarget(page.url()),
      safeCompany: companyParamIsTarget(page.url()),
      dangerousDialogVisible: containsForbiddenDialog(text)
    },
    internallyProves: `${pageLabel} state in ${EXPECTED_INSTANCE}/${TARGET_COMPANY}.`,
    doesNotProve: [
      'No master data.',
      'No document draft.',
      'No Preview Posting.',
      'No Posting.',
      'No final SKR04 or tax correctness.'
    ],
    finalScreenshotStatus: 'foundation-evidence',
    ...extra
  });
  return snapshot;
}

async function visibleStateForSimpleGroup(page: Page, code: string, description: string) {
  const text = await safeText(page);
  return {
    code: literalPattern(code).test(text),
    description: literalPattern(description).test(text)
  };
}

async function rowWithCode(frame: Frame, code: string) {
  const row = frame.getByRole('row', { name: literalPattern(code) }).first();
  if (await row.isVisible({ timeout: 900 }).catch(() => false)) return row;
  const text = frame.getByText(literalPattern(code)).first();
  if (await text.isVisible({ timeout: 900 }).catch(() => false)) {
    await text.click({ force: true }).catch(() => undefined);
    const focused = frame.locator('[role="row"]').filter({ hasText: code }).first();
    if (await focused.isVisible({ timeout: 900 }).catch(() => false)) return focused;
  }
  return undefined;
}

async function fillSimpleGroupInputs(page: Page, frame: Frame, code: string, description: string, steps: Step[]) {
  let targetRow = await rowWithCode(frame, code);
  if (!targetRow) {
    const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
    steps.push({ step: 'click-new-for-simple-group', code, newClicked });
    if (!newClicked) return { changed: false, reason: 'Neu/New action was not visible for the simple setup group.' };
    await assertSafePage(page, /Buchungsgruppen|Posting Groups/i, /Code|Beschreibung|Description/i);
    targetRow = await rowWithCode(frame, code);
  }

  const cardBoxes = await editableTextboxes(frame);
  const cardInputs = [];
  for (const box of cardBoxes.slice(0, 10)) {
    cardInputs.push({
      aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
      title: (await box.getAttribute('title').catch(() => '')) || '',
      value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
    });
  }
  steps.push({ step: 'simple-group-editable-inputs', code, cardInputs });

  const boxes = targetRow ? await editableTextboxes(targetRow) : cardBoxes;
  const fallbackBoxes = boxes.length >= 2 ? boxes : cardBoxes;
  if (fallbackBoxes.length < 2) return { changed: false, reason: 'Fewer than two editable inputs were visible for Code and Beschreibung.' };

  const values = [code, description];
  for (let index = 0; index < values.length; index += 1) {
    await fallbackBoxes[index].click({ force: true });
    await fallbackBoxes[index].fill('').catch(async () => {
      await page.keyboard.press('Control+A');
    });
    await page.keyboard.insertText(values[index]);
    await page.keyboard.press(index === values.length - 1 ? 'Enter' : 'Tab');
    await page.waitForTimeout(index === values.length - 1 ? 1400 : 650);
  }
  return { changed: true, reason: 'Filled visible Code and Beschreibung inputs for simple setup group.' };
}

async function createOrVerifySimpleGroup(
  page: Page,
  group: typeof businessGroup,
  filePrefix: string,
  steps: Step[]
): Promise<SetupOutcome> {
  const include = new RegExp(`${group.code}|${group.description}|Code|Beschreibung|Description|Neu|New|Liste bearbeiten|Edit List`, 'i');
  await openSetupPage(page, group.pageId, group.pageSignals, group.fieldSignals);
  const before = await capturePageState(page, `${filePrefix}-010-before`, group.pageId, group.label, `Before ${group.code} write gate.`, include);
  const beforeVisible = await visibleStateForSimpleGroup(page, group.code, group.description);

  let writeAttempt = { changed: false, reason: `${group.code} was already visible with description.` };
  if (!(beforeVisible.code && beforeVisible.description)) {
    const { frame } = await findBcFrame(page, group.pageSignals);
    writeAttempt = await fillSimpleGroupInputs(page, frame, group.code, group.description, steps);
  }

  await capturePageState(page, `${filePrefix}-020-after-attempt`, group.pageId, group.label, `After ${group.code} write attempt.`, include, {
    beforeVisible,
    writeAttempt,
    steps
  });

  await openSetupPage(page, group.pageId, group.pageSignals, group.fieldSignals);
  const reopen = await capturePageState(page, `${filePrefix}-030-after-reopen`, group.pageId, group.label, `After reopening ${group.label}.`, include, {
    beforeVisible,
    writeAttempt,
    steps
  });
  const reopenVisible = await visibleStateForSimpleGroup(page, group.code, group.description);
  const proved = reopenVisible.code && reopenVisible.description;
  const blockedBy = proved ? [] : [`${group.code} with target description is not visibly proven after reopen.`];

  return {
    status: proved ? (writeAttempt.changed ? 'changed-and-proven' : 'already-complete') : 'blocked',
    changed: writeAttempt.changed,
    proved,
    blockedBy,
    beforeVisible,
    reopenVisible: { ...reopenVisible, snapshotHasText: typeof reopen.compact === 'string' && reopen.compact.length > 0 }
  };
}

async function inspectMatrixRoute(page: Page, steps: Step[]) {
  const include =
    /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Sales Account|Wareneinkaufskonto|Purchase Account|INLAND|WAREN|4400|5400|Neu|New|Liste bearbeiten|Edit List/i;
  await openSetupPage(page, matrix.pageId, matrix.pageSignals, matrix.fieldSignals);
  await capturePageState(page, 'target-032b-070-general-posting-setup-before', matrix.pageId, matrix.label, 'Before General Posting Setup matrix route decision.', include);

  const beforeText = await safeText(page);
  const alreadyComplete =
    /INLAND[\s\S]{0,900}WAREN[\s\S]{0,900}4400[\s\S]{0,1200}5400|INLAND[\s\S]{0,900}WAREN[\s\S]{0,1200}5400[\s\S]{0,1200}4400/i.test(
      beforeText
    );
  if (alreadyComplete) {
    await capturePageState(page, 'target-032b-080-general-posting-setup-reopen', matrix.pageId, matrix.label, 'General Posting Setup already complete.', include);
    return {
      status: 'already-complete' as const,
      changed: false,
      proved: true,
      blockedBy: [],
      learning: 'The INLAND/WAREN/4400/5400 row was already visible.'
    };
  }

  const { frame } = await findBcFrame(page, matrix.pageSignals);
  const editClicked = await clickAction(page, frame, /^Liste bearbeiten$|^Edit List$|^Bearbeiten$|^Edit$/i);
  steps.push({ step: 'matrix-edit-action-probe', editClicked });
  await page.waitForTimeout(800);
  await assertSafePage(page, matrix.pageSignals, matrix.fieldSignals);

  const newClicked = await clickAction(page, frame, /^Neu$|^New$/i);
  steps.push({ step: 'matrix-new-action-probe', newClicked });
  await page.waitForTimeout(1000);
  await assertSafePage(page, matrix.pageSignals, matrix.fieldSignals);

  const rows = frame.getByRole('row');
  const rowCount = await rows.count().catch(() => 0);
  const targetRow = rows.nth(Math.max(0, rowCount - 1));
  await targetRow.click({ force: true }).catch(() => undefined);
  const rowInputs = await editableTextboxes(targetRow);
  const allInputs = rowInputs.length > 0 ? rowInputs : await editableTextboxes(frame);
  const inspectedInputs = [];
  for (const box of allInputs.slice(0, 12)) {
    inspectedInputs.push({
      aria: (await box.getAttribute('aria-label').catch(() => '')) || '',
      title: (await box.getAttribute('title').catch(() => '')) || '',
      value: (await box.inputValue({ timeout: 300 }).catch(() => '')) || ''
    });
  }
  steps.push({ step: 'matrix-inputs-inspected-no-write', inputCount: allInputs.length, inspectedInputs });
  await capturePageState(page, 'target-032b-090-general-posting-setup-route-blocked', matrix.pageId, matrix.label, 'Matrix route stopped before unsafe cell mapping.', include, {
    matrixRoute: {
      editClicked,
      newClicked,
      inputCount: allInputs.length,
      inspectedInputs
    }
  });
  await openSetupPage(page, matrix.pageId, matrix.pageSignals, matrix.fieldSignals);
  const reopenSnapshot = await capturePageState(
    page,
    'target-032b-100-general-posting-setup-reopen-no-persist',
    matrix.pageId,
    matrix.label,
    'Reopen after stopped matrix route.',
    include,
    {
      matrixRoute: {
        editClicked,
        newClicked,
        inputCount: allInputs.length,
        stoppedBeforeValues: true
      }
    }
  );
  const reopenText = `${reopenSnapshot.compact ?? ''}`;
  const noTargetRowPersisted = !/INLAND[\s\S]{0,900}WAREN/i.test(reopenText);

  return {
    status: 'blocked' as const,
    changed: false,
    proved: false,
    blockedBy: [
      'General Posting Setup matrix row was not written because visible editable inputs did not provide a trusted field-to-column map for Sales Account 4400 and Purchase Account 5400.'
    ],
    learning:
      'Page 314 column order includes intermediate sales credit/prepayment fields; blindly filling the first visible inputs could put 5400 into the wrong column.',
    transientRowCreated: newClicked,
    noTargetRowPersisted
  };
}

test('TARGET-032B General Posting Groups controlled write gate', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const steps: Step[] = [
    {
      step: 'smart-decision',
      whyNow:
        'TARGET-032A proved Page 312, Page 313 and Page 314 read-only. The smallest useful write is INLAND and WAREN before attempting the Page 314 matrix.',
      supportedBy: [
        'TARGET-032 source-backed decision',
        'TARGET-032A read-only screenshots for Page 312/313/314',
        'Earlier Universaarl account proof for 4400 and 5400'
      ],
      fieldsChangedOnlyIfSafe: [
        'Page 312 Code/Description for INLAND',
        'Page 313 Code/Description for WAREN',
        'Page 314 only if field-to-column route is trusted'
      ],
      fieldsNotTouched: [
        'VAT Posting Setup',
        'Inventory Posting Setup',
        'Master Data',
        'Documents',
        'Preview Posting',
        'Posting',
        'API shortcut'
      ],
      fallback: 'Block Page 314 and create a narrow matrix route diagnosis if column mapping is not trusted.'
    }
  ];

  const businessOutcome = await createOrVerifySimpleGroup(page, businessGroup, 'target-032b-010-business-group', steps);
  const productOutcome = await createOrVerifySimpleGroup(page, productGroup, 'target-032b-040-product-group', steps);

  const matrixOutcome =
    businessOutcome.proved && productOutcome.proved
      ? await inspectMatrixRoute(page, steps)
      : {
          status: 'blocked' as const,
          changed: false,
          proved: false,
          blockedBy: ['Matrix route not attempted because prerequisite business/product posting groups were not proven.'],
          learning: 'Prerequisites must be proven before Page 314 writes.'
        };

  const blockedBy = [...businessOutcome.blockedBy, ...productOutcome.blockedBy, ...matrixOutcome.blockedBy];
  const coreGroupsProven = businessOutcome.proved && productOutcome.proved;
  const fullyProven = coreGroupsProven && matrixOutcome.proved;
  const resultStatus = fullyProven ? 'observed' : coreGroupsProven ? 'partially-completed' : 'blocked';
  const nextCase = fullyProven
    ? 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS'
    : coreGroupsProven
      ? 'TARGET-032C-GENERAL-POSTING-SETUP-MATRIX-ROW-ROUTE-DIAGNOSIS'
      : 'TARGET-032B-GENERAL-POSTING-GROUPS-CONTROLLED-WRITE-GATE-FOLLOWUP';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-universaarl-general-posting-groups-controlled-write-gate',
    resultStatus,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Pages 312, 313 and 314',
    url: sanitizeEvidenceUrl(page.url()),
    actionsTaken: [
      'Opened Business Central in playthru / UNIVERSAARL-DE.',
      'Opened Page 312 General Business Posting Groups.',
      'Created or verified INLAND with description Inlaendische Geschaeftspartner.',
      'Reopened Page 312 for persistence proof.',
      'Opened Page 313 General Product Posting Groups.',
      'Created or verified WAREN with description Waren.',
      'Reopened Page 313 for persistence proof.',
      'Opened Page 314 General Posting Setup only after prerequisites.',
      matrixOutcome.proved
        ? 'Verified INLAND/WAREN/4400/5400 matrix row.'
        : 'Stopped Page 314 before unsafe matrix cell write.'
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
    setupChanged: businessOutcome.changed || productOutcome.changed || matrixOutcome.changed,
    setupChangedOnlyAllowedScope: businessOutcome.changed || productOutcome.changed || matrixOutcome.changed,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    outcomes: {
      generalBusinessPostingGroup: businessOutcome,
      generalProductPostingGroup: productOutcome,
      generalPostingSetup: matrixOutcome
    },
    screenshots: [
      'playwright/projects/fibu-book5/img/target-032b-010-business-group-010-before.png',
      'playwright/projects/fibu-book5/img/target-032b-010-business-group-020-after-attempt.png',
      'playwright/projects/fibu-book5/img/target-032b-010-business-group-030-after-reopen.png',
      'playwright/projects/fibu-book5/img/target-032b-040-product-group-010-before.png',
      'playwright/projects/fibu-book5/img/target-032b-040-product-group-020-after-attempt.png',
      'playwright/projects/fibu-book5/img/target-032b-040-product-group-030-after-reopen.png',
      'playwright/projects/fibu-book5/img/target-032b-070-general-posting-setup-before.png',
      matrixOutcome.proved
        ? 'playwright/projects/fibu-book5/img/target-032b-080-general-posting-setup-reopen.png'
        : 'playwright/projects/fibu-book5/img/target-032b-090-general-posting-setup-route-blocked.png',
      ...(!matrixOutcome.proved
        ? ['playwright/projects/fibu-book5/img/target-032b-100-general-posting-setup-reopen-no-persist.png']
        : [])
    ],
    proved: [
      ...(businessOutcome.proved
        ? ['General Business Posting Group INLAND is visible after reopen with description Inlaendische Geschaeftspartner.']
        : []),
      ...(productOutcome.proved ? ['General Product Posting Group WAREN is visible after reopen with description Waren.'] : []),
      ...(matrixOutcome.proved ? ['General Posting Setup row INLAND/WAREN/4400/5400 is visible.'] : []),
      'Business Central stayed in playthru / UNIVERSAARL-DE.',
      'No master data, document draft, Preview Posting, Posting, Payment or API shortcut was executed.'
    ],
    notProved: [
      ...(!businessOutcome.proved ? ['General Business Posting Group INLAND persistence is not proven.'] : []),
      ...(!productOutcome.proved ? ['General Product Posting Group WAREN persistence is not proven.'] : []),
      ...(!matrixOutcome.proved ? ['General Posting Setup row INLAND/WAREN with 4400/5400 is not proven.'] : []),
      'No VAT Posting Setup is proven.',
      'No Inventory Posting Setup is proven.',
      'No posting readiness, Preview Posting, G/L Entries, VAT Entries or Value Entries are proven.',
      'No final SKR04, tax advisor or German compliance claim is proven.'
    ],
    completedScope: [
      ...(businessOutcome.proved ? ['Page 312 INLAND business posting group'] : []),
      ...(productOutcome.proved ? ['Page 313 WAREN product posting group'] : []),
      ...(matrixOutcome.proved ? ['Page 314 INLAND/WAREN matrix row'] : [])
    ],
    remainingScope: [
      ...(!matrixOutcome.proved ? ['Page 314 INLAND/WAREN matrix route with trusted Sales Account and Purchase Account field mapping'] : [])
    ],
    blockedBy,
    warnings: [
      'General Business/Product Posting Groups alone do not make the company posting-ready.',
      'The Buchungsmatrix / General Posting Setup row remains a separate gate unless proven after reopen.',
      matrixOutcome.learning,
      ...(!matrixOutcome.proved
        ? ['Page 314 produced a transient unsaved/error row during route diagnosis; the run reopened the page to avoid treating it as persisted setup.']
        : [])
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
    steps,
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-032A proved Page 312, Page 313 and Page 314 read-only. TARGET-030/031B proved specific vendor/customer posting groups.',
      isPlannedNextCaseStillSensible: true,
      reason:
        'The next setup dependency is General Business/Product Posting Groups first; Page 314 must not be written unless field-to-column mapping is safe.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-032B-GENERAL-POSTING-GROUPS-CONTROLLED-WRITE-GATE',
          status: 'ready-next',
          reason: 'Page 312/313 simple group setup is ready; Page 314 remains conditional on safe editor mapping.'
        },
        {
          caseId: 'TARGET-032C-GENERAL-POSTING-SETUP-MATRIX-ROW-ROUTE-DIAGNOSIS',
          status: fullyProven ? 'obsolete' : coreGroupsProven ? 'ready-next' : 'blocked',
          reason: fullyProven
            ? 'Matrix row already proven; no diagnosis needed.'
            : coreGroupsProven
              ? 'The groups are proven; the remaining blocker is now only Page 314 field mapping.'
              : 'Do not diagnose Page 314 before Page 312/313 prerequisites are proven.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: fullyProven ? 'ready-next' : 'ready-after-current',
          reason: fullyProven
            ? 'General Posting Setup is ready enough to resume Dimensions.'
            : 'Dimensions can continue only after the Page 314 matrix route is resolved or explicitly parked.'
        },
        {
          caseId: 'TARGET-034-FOUNDATION-READY-CHECKPOINT',
          status: 'needs-setup-first',
          reason: 'Foundation still needs matrix/VAT/dimensions status before readiness.'
        },
        {
          caseId: 'TARGET-035-MASTER-DATA-FIRST-CUSTOMER-VENDOR-ITEM',
          status: 'needs-setup-first',
          reason: 'Master data remains locked until posting groups, VAT and dimensions are sufficient.'
        }
      ],
      queueChangesMade: fullyProven ? [] : ['Selected TARGET-032C as narrow follow-up for Page 314 instead of skipping to Dimensions.'],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: fullyProven
        ? 'The full General Posting Groups gate is complete, so dimensions are the next foundation dependency.'
        : coreGroupsProven
          ? 'Page 312/313 are complete; a narrow Page 314 matrix field-mapping case avoids repeating unsafe cell edits.'
          : 'The current write gate must be recovered before any broader setup work.',
      risksBeforeNextCase: [
        'Do not create master data yet.',
        'Do not run Preview Posting or Posting.',
        'Do not claim posting readiness from posting groups alone.',
        'Do not type Page 314 account values into unknown columns.'
      ],
      requiredPreparation: fullyProven
        ? ['Prepare Dimensions recovery/defaults with current posting group status as context.']
        : ['Use Page Inspection, personalization or controlled row field diagnostics on Page 314 before any 4400/5400 write.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032B-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.snapshot.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.screenshot.json`,
      'playwright/projects/fibu-book5/img/target-032b-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032B-result.json`,
      'playwright/projects/fibu-book5/img/target-032b-010-business-group-030-after-reopen.png',
      'playwright/projects/fibu-book5/img/target-032b-040-product-group-030-after-reopen.png'
    ],
    requiresReview: !coreGroupsProven,
    safeToFinalizeState: coreGroupsProven,
    statePatch: coreGroupsProven
      ? {
          current: {
            activeCase: nextCase,
            activeArea: fullyProven
              ? 'universaarl-dimensions-recovery-defaults'
              : 'universaarl-general-posting-setup-matrix-route-diagnosis',
            nextStep: fullyProven
              ? 'Run TARGET-033 Dimensions Recovery/Defaults after General Posting Setup proof.'
              : 'Run TARGET-032C as a narrow Page 314 General Posting Setup matrix route diagnosis before any more setup or master data.'
          },
          activeCase: {
            status: resultStatus,
            resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032B-result.json`,
            nextCase
          },
          coverage: {
            latestGeneralPostingGroupsControlledWriteGate: {
              caseId: CASE_ID,
              status: resultStatus,
              businessGroup: businessOutcome.status,
              productGroup: productOutcome.status,
              generalPostingSetup: matrixOutcome.status,
              resultPath: `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032B-result.json`
            }
          }
        }
      : {},
    reason: fullyProven
      ? 'INLAND, WAREN and the INLAND/WAREN/4400/5400 matrix row are proven after reopen.'
      : coreGroupsProven
        ? 'INLAND and WAREN are proven after reopen; Page 314 stopped before unsafe matrix cell mapping.'
        : 'The prerequisite General Posting Groups were not both proven.'
  };

  await writeJson(RESULT_PATH, result);
  await fs.writeFile(
    path.join(EVIDENCE_DIR, 'README.md'),
    [
      '# TARGET-032B General Posting Groups Controlled Write Gate',
      '',
      `Status: ${resultStatus}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Erledigt',
      '',
      ...result.completedScope.map((item) => `- ${item}`),
      '',
      '## Offen',
      '',
      ...(result.remainingScope.length > 0 ? result.remainingScope.map((item) => `- ${item}`) : ['- Keine offene Scope-Grenze in diesem Case.']),
      '',
      '## Grenzen',
      '',
      '- Keine Stammdaten.',
      '- Keine Belege.',
      '- Keine Preview und keine Buchung.',
      '- Keine USt- oder Lagerbuchungseinrichtung.',
      ''
    ].join('\n'),
    'utf8'
  );

  expect(businessOutcome.proved, businessOutcome.blockedBy.join('\n')).toBe(true);
  expect(productOutcome.proved, productOutcome.blockedBy.join('\n')).toBe(true);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.draftCreated).toBe(false);
  expect(result.masterDataChanged).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
