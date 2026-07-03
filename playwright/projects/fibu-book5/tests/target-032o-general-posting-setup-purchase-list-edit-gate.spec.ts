import { expect, test, type Frame, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, dismissTours, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 }
});

test.setTimeout(260_000);

const CASE_ID = 'TARGET-032O-GENERAL-POSTING-SETUP-PURCHASE-LIST-EDIT-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-032o-general-posting-setup-purchase-list-edit-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-032O-result.json');

const targetValues = {
  businessGroup: 'INLAND',
  productGroup: 'WAREN',
  salesAccount: '4400',
  purchaseAccount: '5400'
};

type TextBox = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
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

function buildTargetUrl() {
  const url = new URL(requireBcUrl('FIBU_BOOK5'));
  url.pathname = url.pathname.replace(/\/MCP_1_20260210(\/|$)/i, '/playthru$1');
  url.searchParams.set('company', TARGET_COMPANY);
  url.searchParams.set('page', '314');
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
  return /Preview Posting|Buchungsvorschau|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Ship and Invoice|Liefern und fakturieren|Delete\?|Loeschen\?|Loschen\?|Apply\?|Anwenden\?|Mandant wechseln|Company switch|^Post$|^Buchen$|^L[oe]schen$|^Delete$|^Finish$|Fertig stellen/i.test(text);
}

function hasCompleteRow(text: string) {
  return /INLAND[\s\S]{0,1800}WAREN[\s\S]{0,3200}4400[\s\S]{0,4200}5400|INLAND[\s\S]{0,1800}WAREN[\s\S]{0,4200}5400[\s\S]{0,4200}4400/i.test(text);
}

function hasPartialSalesRow(text: string) {
  return /INLAND[\s\S]{0,1800}WAREN[\s\S]{0,3200}4400/i.test(text);
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
    const text = clean(await frame.locator('body').innerText({ timeout: 2500 }).catch(() => ''));
    if (expected.test(text)) return { frame, bodyText: text };
  }
  const bodyText = await safeText(page);
  return { frame: page.mainFrame(), bodyText };
}

async function openPage314(page: Page) {
  await page.goto(buildTargetUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(1800);
  expect(instancePathIsTarget(page.url()), `Wrong BC instance URL: ${page.url()}`).toBe(true);
  expect(companyParamIsTarget(page.url()), `Wrong BC company URL: ${page.url()}`).toBe(true);
  const { frame, bodyText } = await findBcFrame(page, /Buchungsmatrix|General Posting Setup|Wareneinkaufskonto/i);
  expect(bodyText).toMatch(/Buchungsmatrix|General Posting Setup|Wareneinkaufskonto/i);
  return frame;
}

async function screenshot(page: Page, name: string) {
  await fs.mkdir(IMG_DIR, { recursive: true });
  await page.screenshot({ path: path.join(IMG_DIR, `${name}.png`), fullPage: true });
}

async function captureState(page: Page, name: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await safeText(page);
  const state = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title().catch(() => '')),
    compact: clean(await compactPageText(page, {
      include: [/Buchungsmatrix|General Posting Setup|Produktbuchungsgruppe|Warenverkaufskonto|Wareneinkaufskonto|INLAND|WAREN|4400|5400|Neu|Liste bearbeiten|Kopieren/i],
      maxLines: 28
    })),
    hasDangerousDialog: containsDangerousText(text),
    completeRowVisible: hasCompleteRow(text),
    partialSalesRowVisible: hasPartialSalesRow(text),
    ...extra
  };
  await writeJson(path.join(EVIDENCE_DIR, `${name}.json`), state);
  await screenshot(page, name);
  return state;
}

async function visibleTextBoxes(frame: Frame): Promise<TextBox[]> {
  return frame.locator('body *').evaluateAll((nodes) =>
    nodes
      .map((node) => {
        const element = node as HTMLElement;
        const text = (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ');
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          text,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          visible: !!text && rect.width > 4 && rect.height > 4 && style.visibility !== 'hidden' && style.display !== 'none'
        };
      })
      .filter((box) => box.visible && box.text.length < 90)
      .map(({ text, x, y, width, height }) => ({ text, x, y, width, height }))
  );
}

function center(box: TextBox) {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function findBestBox(boxes: TextBox[], pattern: RegExp) {
  return boxes
    .filter((box) => pattern.test(box.text))
    .sort((a, b) => a.y - b.y || a.x - b.x)[0];
}

function findTargetCellGeometry(boxes: TextBox[]) {
  const purchaseHeader = findBestBox(boxes, /^Wareneinkaufskonto$|^Purch\.?\s*Account$|^Purchase Account$/i);
  const product = boxes
    .filter((box) => /^WAREN$/.test(box.text))
    .sort((a, b) => a.y - b.y || a.x - b.x)[0];
  const sales = boxes
    .filter((box) => /^4400$/.test(box.text))
    .sort((a, b) => Math.abs(a.y - (product?.y ?? a.y)) - Math.abs(b.y - (product?.y ?? b.y)))[0];
  if (!purchaseHeader || !product || !sales) {
    return { ok: false, reason: 'Required visible header or target row text was not found.', purchaseHeader, product, sales };
  }
  const productCenter = center(product);
  const salesCenter = center(sales);
  if (Math.abs(productCenter.y - salesCenter.y) > 45) {
    return { ok: false, reason: 'WAREN and 4400 are not on the same visible row.', purchaseHeader, product, sales };
  }
  if (purchaseHeader.x <= sales.x) {
    return { ok: false, reason: 'Wareneinkaufskonto header is not to the right of Warenverkaufskonto 4400 as expected.', purchaseHeader, product, sales };
  }
  return {
    ok: true,
    reason: 'Header and target row geometry are usable for the one-cell write gate.',
    purchaseHeader,
    product,
    sales,
    clickPoint: { x: purchaseHeader.x + Math.min(Math.max(purchaseHeader.width / 2, 45), purchaseHeader.width - 10), y: productCenter.y }
  };
}

async function clickAction(page: Page, frame: Frame, action: RegExp) {
  const candidates = [
    frame.getByRole('button', { name: action }),
    frame.getByRole('menuitem', { name: action }),
    page.getByRole('button', { name: action }),
    page.getByRole('menuitem', { name: action })
  ];
  for (const locator of candidates) {
    const first = locator.first();
    if ((await first.count().catch(() => 0)) > 0 && (await first.isVisible({ timeout: 800 }).catch(() => false))) {
      await first.click({ timeout: 5000 });
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

test('TARGET-032O writes only Wareneinkaufskonto via strict Page 314 List Edit gate', async ({ page }) => {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await fs.mkdir(IMG_DIR, { recursive: true });

  const actionsTaken: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const geometrySnapshots: unknown[] = [];

  let frame = await openPage314(page);
  actionsTaken.push('Opened Page 314 Buchungsmatrix Einrichtung in playthru / UNIVERSAARL-DE.');
  const before = await captureState(page, 'target-032o-010-before-list-edit', 'Before strict purchase account List Edit gate.');

  let setupChangeAttempted = false;
  let editListClicked = false;
  let typed5400 = false;

  if (before.completeRowVisible) {
    warnings.push('INLAND/WAREN/4400/5400 was already visible before the write gate; no value entry needed.');
  } else if (!before.partialSalesRowVisible) {
    blockedBy.push('Existing INLAND/WAREN/4400 partial row was not visible before the write gate.');
  } else {
    const boxesBeforeEdit = await visibleTextBoxes(frame);
    const geometryBeforeEdit = findTargetCellGeometry(boxesBeforeEdit);
    geometrySnapshots.push({ step: 'before-edit-list', geometry: geometryBeforeEdit });
    await writeJson(path.join(EVIDENCE_DIR, '020-geometry-before-edit-list.json'), geometryBeforeEdit);
    if (!geometryBeforeEdit.ok) {
      blockedBy.push(`Geometry before List Edit was not safe: ${geometryBeforeEdit.reason}`);
    } else {
      editListClicked = await clickAction(page, frame, /^Liste bearbeiten$|^Edit List$/i);
      actionsTaken.push(`Clicked Liste bearbeiten / Edit List: ${editListClicked ? 'yes' : 'no'}.`);
      await captureState(page, 'target-032o-020-after-list-edit', 'After List Edit before one-cell write.', {
        editListClicked,
        geometryBeforeEdit
      });
      if (!editListClicked) {
        blockedBy.push('Liste bearbeiten / Edit List was not visible or could not be clicked.');
      } else {
        ({ frame } = await findBcFrame(page, /Buchungsmatrix|General Posting Setup|Wareneinkaufskonto|INLAND|WAREN/i));
        const geometryAfterEdit = findTargetCellGeometry(await visibleTextBoxes(frame));
        geometrySnapshots.push({ step: 'after-edit-list', geometry: geometryAfterEdit });
        await writeJson(path.join(EVIDENCE_DIR, '030-geometry-after-edit-list.json'), geometryAfterEdit);
        if (!geometryAfterEdit.ok || !geometryAfterEdit.clickPoint) {
          blockedBy.push(`Geometry after List Edit was not safe: ${geometryAfterEdit.reason}`);
        } else {
          await page.mouse.dblclick(geometryAfterEdit.clickPoint.x, geometryAfterEdit.clickPoint.y);
          await page.waitForTimeout(400);
          await page.keyboard.press('F2').catch(() => undefined);
          await page.waitForTimeout(250);
          await page.keyboard.press('Control+A');
          await page.keyboard.insertText(targetValues.purchaseAccount);
          await page.keyboard.press('Tab');
          await page.waitForTimeout(1800);
          setupChangeAttempted = true;
          typed5400 = true;
          actionsTaken.push('Typed only Wareneinkaufskonto 5400 into the geometry-selected Page 314 cell.');
        }
      }
    }
  }

  const after = await captureState(page, 'target-032o-040-after-one-cell-write-or-block', 'After one-cell List Edit write or safe block.', {
    editListClicked,
    setupChangeAttempted,
    typed5400,
    geometrySnapshots
  });
  if (after.hasDangerousDialog) blockedBy.push('Dangerous or ambiguous dialog appeared after List Edit gate.');

  frame = await openPage314(page);
  const reopen = await captureState(page, 'target-032o-050-reopen-proof', 'Page 314 reopen proof after strict purchase account List Edit gate.', {
    editListClicked,
    setupChangeAttempted,
    typed5400
  });
  actionsTaken.push('Reopened Page 314 for persistence proof.');

  const status = reopen.completeRowVisible ? 'observed' : blockedBy.length > 0 ? 'blocked' : 'partially-completed';
  if (!reopen.completeRowVisible) {
    blockedBy.push('Reopen proof does not show INLAND/WAREN/4400/5400 together on Page 314.');
  }

  const nextCase =
    status === 'observed'
      ? 'TARGET-027D26-VAT-MATRIX-ALTERNATIVE-ROUTE-DISCOVERY'
      : 'TARGET-032P-GENERAL-POSTING-SETUP-PARK-OR-SOURCE-ROUTE';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-strict-list-edit-setup-gate',
    resultStatus: status,
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    page: 'Page 314 Buchungsmatrix Einrichtung / General Posting Setup',
    url: sanitizeEvidenceUrl(page.url()),
    targetValues,
    actionsTaken,
    actionsNotTaken: [
      'No New action clicked.',
      'No Copy action clicked.',
      'No VAT Posting Setup value written.',
      'No document or draft created.',
      'No master data created.',
      'No Preview Posting.',
      'No Posting.',
      'No Payment.',
      'No API shortcut.',
      'No company switch.',
      'No book claim from this evidence.'
    ],
    setupChanged: status === 'observed',
    setupChangeAttempted,
    masterDataChanged: false,
    draftCreated: false,
    previewPosting: false,
    posted: false,
    apiShortcut: false,
    editListClicked,
    typed5400,
    states: { before, after, reopen },
    geometrySnapshots,
    screenshots: [
      'playwright/projects/fibu-book5/img/target-032o-010-before-list-edit.png',
      'playwright/projects/fibu-book5/img/target-032o-020-after-list-edit.png',
      'playwright/projects/fibu-book5/img/target-032o-040-after-one-cell-write-or-block.png',
      'playwright/projects/fibu-book5/img/target-032o-050-reopen-proof.png'
    ],
    proved:
      status === 'observed'
        ? [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'Page 314 reopen proof shows INLAND/WAREN with Warenverkaufskonto 4400 and Wareneinkaufskonto 5400.',
            'The gate did not click New or Copy and did not touch VAT, documents, Preview Posting, Posting, Payment or API.'
          ]
        : [
            'Business Central stayed in playthru / UNIVERSAARL-DE.',
            'The gate did not click New or Copy and did not touch VAT, documents, Preview Posting, Posting, Payment or API.',
            'The case stopped or remained partial without claiming posting readiness.'
          ],
    notProved: [
      ...(status === 'observed' ? [] : ['Wareneinkaufskonto 5400 is not proven after reopen.']),
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
      noNewClicked: true,
      noCopyClicked: true
    },
    nextStepDecision: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-032N allowed exactly one strict Page 314 List Edit gate because TARGET-032M exposed the purchase account column but not a card field.',
      isPlannedNextCaseStillSensible: true,
      reason: 'This was the narrowest remaining route for the missing purchase account value.',
      lookaheadReviewed: [
        {
          caseId: 'TARGET-027D26-VAT-MATRIX-ALTERNATIVE-ROUTE-DISCOVERY',
          status: status === 'observed' ? 'ready-next' : 'ready-after-current',
          reason:
            status === 'observed'
              ? 'General Posting Setup purchase and sales accounts are now visible; VAT matrix remains the next separate setup blocker.'
              : 'VAT matrix should wait until this General Posting Setup partial is parked or solved.'
        },
        {
          caseId: 'TARGET-033-DIMENSIONS-RECOVERY-DEFAULTS',
          status: 'ready-after-current',
          reason: 'Dimensions can resume after posting matrix boundary is clear.'
        },
        {
          caseId: 'TARGET-038-O2C-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'O2C remains blocked until General Posting Setup and VAT setup are proven.'
        },
        {
          caseId: 'TARGET-040-FOUNDATION-READY-RECHECK',
          status: 'ready-after-current',
          reason: 'Useful after General Posting Setup and VAT matrix have known status.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest:
        status === 'observed'
          ? 'The missing General Posting Setup purchase account is now visible after reopen, so the next practical Foundation blocker is VAT matrix.'
          : 'The strict list-edit route did not produce a complete reopen proof, so the matrix should be parked or moved to a source-backed alternative route.',
      risksBeforeNextCase: [
        'Do not claim posting readiness from General Posting Setup alone.',
        'Do not start documents before VAT setup and Foundation checkpoint.',
        'Do not repeat the same Page 314 list-edit geometry if this case blocked.'
      ],
      requiredPreparation:
        status === 'observed'
          ? ['Keep VAT setup in its own case.', 'Use TARGET-032O screenshots for the beginner explanation of the General Posting Setup row.']
          : ['Review geometry JSON and screenshots before choosing another route.']
    },
    nextCase,
    changedFiles: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032O-result.json`,
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/*.json`,
      'playwright/projects/fibu-book5/img/target-032o-*.png'
    ],
    evidenceRefs: [
      `playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032O-result.json`,
      'playwright/projects/fibu-book5/img/target-032o-050-reopen-proof.png'
    ],
    requiresReview: status !== 'observed',
    safeToFinalizeState: true,
    statePatch: {},
    validationCommands: [
      'npm run agent:preflight',
      'npm run fibu:target:general-posting-setup-purchase-list-edit-gate',
      `npm run agent:result-normalize -- --input playwright/projects/fibu-book5/evidence/${EVIDENCE_ID}/TARGET-032O-result.json`,
      'npm run check:encoding',
      'git diff --check'
    ],
    reason: status === 'observed' ? 'General Posting Setup row shows 4400 and 5400 after reopen.' : blockedBy.join('; ')
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-032O General Posting Setup Purchase List Edit Gate',
      '',
      `Status: ${status}`,
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      'Scope:',
      '',
      '- Existing row only: INLAND / WAREN.',
      '- Existing sales account: 4400.',
      '- Only target write: Wareneinkaufskonto 5400.',
      '',
      'Not done:',
      '',
      '- No New.',
      '- No Copy.',
      '- No VAT setup.',
      '- No document, Preview Posting, Posting, Payment or API.',
      '',
      `Next case: ${nextCase}`,
      ''
    ].join('\n')
  );

  expect(['observed', 'blocked', 'partially-completed'], blockedBy.join('\n')).toContain(status);
  expect(after.hasDangerousDialog).toBe(false);
  expect(result.previewPosting).toBe(false);
  expect(result.posted).toBe(false);
  expect(result.apiShortcut).toBe(false);
});
