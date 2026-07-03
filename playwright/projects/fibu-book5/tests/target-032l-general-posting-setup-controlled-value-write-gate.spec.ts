import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(260_000);

const CASE_ID = 'TARGET-032L-GENERAL-POSTING-SETUP-CONTROLLED-VALUE-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const PROJECT = 'fibu-book5';
const EVIDENCE_ID = 'target-032l-general-posting-setup-controlled-value-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-032L-result.json');
const PAGE_ID = 314;
const targetValues = {
  businessGroup: 'INLAND',
  productGroup: 'WAREN',
  salesAccount: '4400',
  purchaseAccount: '5400'
};

type FillResult = {
  label: string;
  value: string;
  found: boolean;
  x?: number;
  y?: number;
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

function buildTargetUrl(pageId = PAGE_ID) {
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
  return /INLAND[\s\S]{0,1800}WAREN[\s\S]{0,3200}4400[\s\S]{0,4200}5400|INLAND[\s\S]{0,1800}WAREN[\s\S]{0,4200}5400[\s\S]{0,4200}4400/i.test(
    text
  );
}

function hasPartialTargetRow(text: string) {
  return /INLAND[\s\S]{0,1800}WAREN[\s\S]{0,4200}(4400|5400)/i.test(text);
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

async function openPage314(page: Page) {
  await page.goto(buildTargetUrl(314).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1600);
  const text = await safeText(page);
  expect(instancePathIsTarget(page.url()), `Wrong instance URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong company URL: ${sanitizeEvidenceUrl(page.url())}`).toBe(true);
  expect(hasPage314Context(text), 'Page 314 context must be visible.').toBe(true);
  expect(containsDangerousText(text), 'No dangerous dialog may be visible.').toBe(false);
  return findBcFrame(page, /Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Produktbuchungsgruppe/i);
}

async function clickStandaloneNew(page: Page, frame: Frame) {
  for (const scope of [frame, page]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name: /^Neu$|^New$/i });
      const count = await locator.count().catch(() => 0);
      for (let index = 0; index < count; index += 1) {
        const item = locator.nth(index);
        if (!(await item.isVisible({ timeout: 700 }).catch(() => false))) continue;
        await item.hover({ timeout: 1500 }).catch(() => undefined);
        await item.click({ timeout: 5000 }).catch(async () => item.click({ timeout: 5000, force: true }));
        await page.waitForTimeout(1500);
        return true;
      }
    }
  }
  return false;
}

async function expandFastTab(page: Page, frame: Frame, label: RegExp) {
  const target = await frame.evaluate((source) => {
    const pattern = new RegExp(source, 'i');
    const norm = (text: string | null | undefined) => String(text ?? '').replace(/\s+/g, ' ').trim();
    const visible = (element: Element) => {
      const html = element as HTMLElement;
      const rect = html.getBoundingClientRect();
      const style = window.getComputedStyle(html);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    };
    const entry = [...document.querySelectorAll('span,div,a,button')]
      .filter(visible)
      .map((element) => {
        const rect = (element as HTMLElement).getBoundingClientRect();
        return {
          text: norm((element as HTMLElement).innerText || element.textContent),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height)
        };
      })
      .filter((candidate) => pattern.test(candidate.text))
      .sort((a, b) => a.w * a.h - b.w * b.h)[0];
    if (entry) return { label: entry.text, x: entry.x + Math.floor(entry.w / 2), y: entry.y + Math.floor(entry.h / 2) };
    return undefined;
  }, label.source);

  if (!target) return false;
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(250);
  await page.mouse.click(target.x, target.y);
  await page.waitForTimeout(900);
  if (/Einkauf|Purchase/i.test(label.source)) {
    await page.mouse.click(615, 606).catch(() => undefined);
    await page.waitForTimeout(900);
  }
  return true;
}

async function openExistingTargetRowCard(page: Page, frame: Frame) {
  for (const scope of [frame, page]) {
    const inland = scope.getByText(/^INLAND$/).first();
    if (await inland.isVisible({ timeout: 1000 }).catch(() => false)) {
      await inland.click({ timeout: 4000 }).catch(async () => inland.dblclick({ timeout: 4000, force: true }));
      await page.waitForTimeout(1400);
      const text = await safeText(page);
      if (/Buchungsmatrixkarte|INLAND WAREN|General Posting Setup Card/i.test(text)) return true;
    }
  }
  return false;
}

async function visibleComboBoxes(frame: Frame) {
  const combos = frame.locator('input[role="combobox"]');
  const boxes: Array<{ locatorIndex: number; x: number; y: number; w: number; h: number; value: string }> = [];
  const count = await combos.count().catch(() => 0);
  for (let index = 0; index < count; index += 1) {
    const combo = combos.nth(index);
    const box = await combo.boundingBox().catch(() => undefined);
    if (!box || box.width <= 20 || box.height <= 12) continue;
    if (!(await combo.isVisible({ timeout: 300 }).catch(() => false))) continue;
    boxes.push({
      locatorIndex: index,
      x: Math.round(box.x),
      y: Math.round(box.y),
      w: Math.round(box.width),
      h: Math.round(box.height),
      value: clean(await combo.inputValue({ timeout: 300 }).catch(() => ''))
    });
  }
  return boxes;
}

async function fillVisibleComboByOrder(page: Page, frame: Frame, visibleOrder: number, label: string, value: string): Promise<FillResult> {
  const boxes = await visibleComboBoxes(frame);
  const target = boxes[visibleOrder];
  if (!target) return { label, value, found: false };
  const combo = frame.locator('input[role="combobox"]').nth(target.locatorIndex);
  await combo.click({ timeout: 5000 });
  await combo.fill(value, { timeout: 5000 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900);
  return { label, value, found: true, x: target.x + Math.floor(target.w / 2), y: target.y + Math.floor(target.h / 2) };
}

async function fillFirstVisibleComboBelow(page: Page, frame: Frame, minY: number, label: string, value: string): Promise<FillResult> {
  const boxes = (await visibleComboBoxes(frame))
    .filter((box) => box.y > minY && box.x > 650 && box.x < 1300)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const target = boxes[0];
  if (!target) return { label, value, found: false };
  const combo = frame.locator('input[role="combobox"]').nth(target.locatorIndex);
  await combo.click({ timeout: 5000 });
  await combo.fill(value, { timeout: 5000 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(900);
  return { label, value, found: true, x: target.x + Math.floor(target.w / 2), y: target.y + Math.floor(target.h / 2) };
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

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = clean(
    await compactPageText(page, {
      include: [
        /Buchungsmatrix|Buchungsmatrixkarte|General Posting Setup|Geschaeftsbuchungsgruppe|Gesch[a-z]*ftsbuchungsgruppe|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|INLAND|WAREN|4400|5400|Neu|New|Liste bearbeiten|Edit List|Kopieren|Copy/i
      ],
      maxLines: 260,
      maxLineLength: 260
    })
  );
  const text = await safeText(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    hasDangerousDialog: containsDangerousText(text),
    hasPage314Context: hasPage314Context(text),
    targetRowVisible: hasTargetMatrixRow(text),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 6000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    pageId: new URL(page.url()).searchParams.get('page'),
    page: snapshot.title,
    step,
    targetValues,
    importantUi: (compact || text).split('\n').filter(Boolean).slice(0, 28),
    screenshotQa: {
      safeInstance: instancePathIsTarget(page.url()),
      safeCompany: companyParamIsTarget(page.url()),
      dangerousDialogVisible: snapshot.hasDangerousDialog,
      targetRowVisible: snapshot.targetRowVisible
    },
    internallyProves: snapshot.targetRowVisible
      ? 'INLAND/WAREN/4400/5400 is visible on Page 314 after reopen.'
      : 'Current General Posting Setup card/list state during the controlled value gate.',
    doesNotProve: [
      'No VAT Posting Setup.',
      'No document.',
      'No Preview Posting.',
      'No Posting.',
      'No posting readiness until VAT matrix and document preview are proven.'
    ],
    finalScreenshotStatus: snapshot.targetRowVisible ? 'universaarl-foundation-evidence' : 'setup-gate-evidence',
    ...extra
  });
  return snapshot;
}

test('TARGET-032L writes one INLAND WAREN General Posting Setup row through Page 395 card', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];

  let { frame } = await openPage314(page);
  actionsTaken.push('Opened Page 314 Buchungsmatrix Einrichtung in playthru / UNIVERSAARL-DE.');
  const before = await captureState(page, 'target-032l-010-before-card-write', 'Before Page 395 card write.');
  const beforeText = await safeText(page);
  const partialBefore = hasPartialTargetRow(beforeText);
  if (before.targetRowVisible) {
    warnings.push('Target INLAND/WAREN/4400/5400 row was already visible before write; route switches to verify-only outcome.');
  }

  let fillResults: FillResult[] = [];
  if (!before.targetRowVisible) {
    if (partialBefore) {
      const openedExisting = await openExistingTargetRowCard(page, frame);
      actionsTaken.push(`Opened existing partial INLAND/WAREN row card: ${openedExisting ? 'yes' : 'no'}.`);
      if (!openedExisting) blockedBy.push('Existing partial INLAND/WAREN row could not be opened for recovery.');
    } else {
      const newClicked = await clickStandaloneNew(page, frame);
      actionsTaken.push(`Clicked standalone Neu on Page 314: ${newClicked ? 'yes' : 'no'}.`);
      if (!newClicked) blockedBy.push('Standalone Neu was not visible on Page 314.');
    }

    ({ frame } = await findBcFrame(page, /Buchungsmatrixkarte|Buchungsmatrix|General Posting Setup|Geschaeftsbuchungsgruppe|Produktbuchungsgruppe/i));
    await captureState(page, 'target-032l-020-page395-empty-card', partialBefore ? 'Page 395 card for existing partial row before recovery.' : 'Page 395 card after Neu before value entry.', {
      partialBefore
    });

    fillResults = partialBefore
      ? [await fillVisibleComboByOrder(page, frame, 2, 'Warenverkaufskonto', targetValues.salesAccount)]
      : [
          await fillVisibleComboByOrder(page, frame, 0, 'Geschaeftsbuchungsgruppe', targetValues.businessGroup),
          await fillVisibleComboByOrder(page, frame, 1, 'Produktbuchungsgruppe', targetValues.productGroup),
          await fillVisibleComboByOrder(page, frame, 2, 'Warenverkaufskonto', targetValues.salesAccount)
        ];
    await expandFastTab(page, frame, /^Einkauf$|^Purchase$/i);
    await page.waitForTimeout(500);
    ({ frame } = await findBcFrame(page, /Buchungsmatrixkarte|Buchungsmatrix|General Posting Setup|Wareneinkaufskonto|Purch\. Account/i));
    fillResults.push(await fillFirstVisibleComboBelow(page, frame, 620, 'Wareneinkaufskonto', targetValues.purchaseAccount));
    actionsTaken.push('Attempted only INLAND, WAREN, 4400 and 5400 in Page 395 card fields; missing fields block the case.');
    for (const result of fillResults) if (!result.found) blockedBy.push(`Field not found before write: ${result.label}`);
  }

  const after = await captureState(page, 'target-032l-030-after-card-write', 'After Page 395 card write before reopen.', { fillResults });
  if (after.hasDangerousDialog) blockedBy.push('Dangerous or ambiguous dialog appeared after value entry.');

  await page.goto(buildTargetUrl(314).toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1800);
  await openPage314(page);
  const reopen = await captureState(page, 'target-032l-040-reopen-proof', 'Page 314 reopen proof after card route.');
  actionsTaken.push('Reopened Page 314 after card route for persistence proof.');

  const status = reopen.targetRowVisible && blockedBy.length === 0 ? 'observed' : 'blocked';
  if (!reopen.targetRowVisible) blockedBy.push('Reopen proof does not show INLAND/WAREN/4400/5400 together on Page 314.');
  const partialSalesSetupVisible = /INLAND[\s\S]{0,1800}WAREN[\s\S]{0,3200}4400/i.test(reopen.compact);

  const nextCase = status === 'observed'
    ? 'TARGET-027D26-VAT-MATRIX-ALTERNATIVE-ROUTE-DISCOVERY'
    : 'TARGET-032M-GENERAL-POSTING-SETUP-CARD-ROUTE-RECOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-controlled-setup-write',
    resultStatus: status,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 314 / Page 395 General Posting Setup card route',
    url: sanitizeEvidenceUrl(page.url()),
    targetValues,
    actionsTaken,
    actionsNotTaken: [
      'No Edit List action clicked.',
      'No Copy action clicked.',
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
    setupChanged: (status === 'observed' || partialSalesSetupVisible) && !warnings.some((warning) => /already visible/i.test(warning)),
    setupChangeAttempted: !before.targetRowVisible,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    fillResults,
    states: { before, after, reopen },
    screenshots: [
      'playwright/projects/fibu-book5/img/target-032l-010-before-card-write.png',
      'playwright/projects/fibu-book5/img/target-032l-020-page395-empty-card.png',
      'playwright/projects/fibu-book5/img/target-032l-030-after-card-write.png',
      'playwright/projects/fibu-book5/img/target-032l-040-reopen-proof.png'
    ],
    proved:
      status === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 395 card route from Page 314 Neu was used.',
            'Only INLAND, WAREN, 4400 and 5400 were targeted.',
            'Page 314 reopen proof shows INLAND/WAREN with 4400 and 5400.',
            'No VAT setup, document, Preview Posting, Posting, Payment or API shortcut occurred.'
          ]
        : [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            ...(partialSalesSetupVisible ? ['Page 314 reopen proof shows partial INLAND/WAREN setup with Sales Account 4400.'] : []),
            'The case stopped without VAT setup, document, Preview Posting, Posting, Payment or API shortcut.'
          ],
    notProved: [
      'Wareneinkaufskonto 5400 is not proven.',
      'No VAT Posting Setup row is proven.',
      'No posting readiness is proven.',
      'No document Preview Posting is proven.',
      'No G/L Entry, VAT Entry or Value Entry is proven.',
      'No complete SKR04 chart, tax advisor approval or German compliance claim is proven.'
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
      noBookMasterChange: true,
      noVatSetupChange: true,
      noPayment: true,
      noEditListClicked: true,
      noCopyClicked: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-032K proved Page 395 as the safe General Posting Setup card route and no empty row persisted without values.',
      isPlannedNextCaseStillSensible: true,
      reason: 'A controlled card-route value write is the direct follow-up to the Page 395 discovery.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027D26-VAT-MATRIX-ALTERNATIVE-ROUTE-DISCOVERY',
          status: status === 'observed' ? 'ready-next' : 'ready-after-current',
          reason: status === 'observed'
            ? 'General Posting Setup is ready enough to return to the separate VAT matrix blocker.'
            : 'VAT matrix should wait until General Posting Setup recovery decision is complete.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Dimensions can resume after the two posting matrices are solved or parked.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'O2C still needs VAT setup and a preflight before document work.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'ready-after-current',
          reason: 'Useful after General Posting Setup and VAT matrix status are both known.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: status === 'observed'
        ? 'VAT matrix is now the remaining core posting setup blocker before O2C/P2P preflights.'
        : 'A recovery case prevents false setup readiness from a failed card route.',
      risksBeforeNextCase: [
        'Do not claim posting readiness until VAT Posting Setup and Preview Posting are proven.',
        'Do not start O2C/P2P documents before Foundation checkpoint.',
        'Do not reuse Edit List for Page 314.'
      ],
      requiredPreparation: [
        'Review Page 314 reopen screenshot and result JSON.',
        'Keep VAT setup separate from General Posting Setup.'
      ]
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032L-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.txt`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      'playwright/projects/fibu-book5/img/target-032l-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032L-result.json`,
      'playwright/projects/fibu-book5/img/target-032l-030-after-card-write.png',
      'playwright/projects/fibu-book5/img/target-032l-040-reopen-proof.png'
    ],
    requiresReview: status !== 'observed',
    safeToFinalizeState: true,
    statePatch: {},
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:general-posting-setup-card-write-gate',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032L-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ],
    reason: status === 'observed' ? 'General Posting Setup target row is visible after reopen.' : blockedBy.join('; ')
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-032L General Posting Setup Card Write Gate',
      '',
      `Status: ${status}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Zielwerte',
      '',
      '- Geschaeftsbuchungsgruppe: INLAND',
      '- Produktbuchungsgruppe: WAREN',
      '- Warenverkaufskonto: 4400',
      '- Wareneinkaufskonto: 5400',
      '',
      '## Grenzen',
      '',
      '- Keine VAT Posting Setup Aenderung.',
      '- Keine Belege.',
      '- Keine Preview und keine Buchung.',
      '- Keine Buchungsfaehigkeit als finaler Claim.',
      '',
      `Naechster Case: ${nextCase}`,
      ''
    ].join('\n')
  );

  expect(status, blockedBy.join('\n')).toBe('observed');
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
