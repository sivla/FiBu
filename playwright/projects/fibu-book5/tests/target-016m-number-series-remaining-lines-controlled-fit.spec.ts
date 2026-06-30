import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016M-NUMBER-SERIES-REMAINING-LINES-CONTROLLED-FIT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016m-number-series-remaining-lines-controlled-fit';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016M-result.json');

const targets = [
  { code: 'U-VEND', startingNo: 'U-VEND00001', endingNo: 'U-VEND99999' },
  { code: 'U-ITEM', startingNo: 'U-ITEM00001', endingNo: 'U-ITEM99999' },
  { code: 'U-SO', startingNo: 'U-SO00001', endingNo: 'U-SO99999' },
  { code: 'U-SINV', startingNo: 'U-SINV00001', endingNo: 'U-SINV99999' },
  { code: 'U-PO', startingNo: 'U-PO00001', endingNo: 'U-PO99999' },
  { code: 'U-PINV', startingNo: 'U-PINV00001', endingNo: 'U-PINV99999' }
];

type Target = (typeof targets)[number];
type Rect = { x: number; y: number; width: number; height: number };
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
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) throw new Error(`Unsafe context: ${sanitizeEvidenceUrl(url)}`);
  const text = await safeText(page);
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) throw new Error('Number Series context is not visible.');
  if (/Preview Posting|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Buchen\?|Ship and Invoice/i.test(text)) {
    throw new Error('Posting/preview text is visible.');
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

async function selectSeriesRow(page: Page, target: Target) {
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

async function openTargetLines(page: Page, target: Target) {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeContext(page);
  if (!(await selectSeriesRow(page, target))) throw new Error(`${target.code} row could not be selected.`);
  if (!(await clickAction(page, /^Zeilen$|^Lines$/i))) throw new Error(`Zeilen/Lines action could not be opened for ${target.code}.`);
  await page.waitForTimeout(900);
  await assertSafeContext(page);
}

async function compactSnapshot(page: Page, target: Target) {
  const text = await safeText(page);
  return {
    compact: await compactPageText(page, {
      include: [
        /Nr\.-Serienzeilen|Nummernserie|Startdatum|Startnr|Endnr|Offen|Luecken|Lücken|Liste bearbeiten|Neu|Gespeichert/i,
        literalPattern(target.code),
        literalPattern(target.startingNo),
        literalPattern(target.endingNo)
      ],
      maxLines: 180,
      maxLineLength: 220
    }),
    visible: {
      targetCode: literalPattern(target.code).test(text),
      targetStartingNo: literalPattern(target.startingNo).test(text),
      targetEndingNo: literalPattern(target.endingNo).test(text),
      openCheckboxText: /Offen|Open/i.test(text),
      gapCheckboxText: /Luecken|Lücken|Gaps/i.test(text)
    }
  };
}

async function captureState(page: Page, filePrefix: string, target: Target, step: string, extra: Record<string, unknown> = {}) {
  const snapshot = {
    step,
    target,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    ...(await compactSnapshot(page, target)),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.compact || '');
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    target,
    visibleLearning: `Der Screenshot zeigt die Nr.-Serienzeilen fuer ${target.code} vor oder nach der kontrollierten Linienanlage.`,
    importantUi: ['Startdatum', 'Startnr.', 'Endnr.', 'Offen', 'Luecken in Nummern zulassen'],
    internallyProves: `Number Series Line state for ${target.code} in playthru / UNIVERSAARL-DE.`,
    doesNotProve: ['No setup assignment.', 'No master data.', 'No preview posting.', 'No posting.'],
    qualityDecision: 'number-series-line-fit-evidence',
    ...extra
  });
  return snapshot;
}

async function activeEditor(page: Page): Promise<ActiveEditor | null> {
  const results = await Promise.all(
    page.frames().map(async (frame) => {
      const frameBox = await frame.frameElement().then((element) => element.boundingBox()).catch(() => null);
      const value = await frame
        .evaluate(() => {
          const normalize = (input: string | null | undefined) => (input || '').replace(/\s+/g, ' ').trim();
          const element = document.activeElement as HTMLInputElement | HTMLElement | null;
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          const role = normalize(element.getAttribute('role'));
          const nearestCell = element.closest<HTMLElement>('[role="gridcell"],td,[role="cell"]');
          return {
            tag: element.tagName,
            role,
            ariaLabel: normalize(element.getAttribute('aria-label')),
            title: normalize(element.getAttribute('title')),
            text: normalize((element as HTMLElement).innerText || element.textContent).slice(0, 200),
            value: normalize('value' in element ? (element as HTMLInputElement).value : ''),
            isEditable:
              /INPUT|TEXTAREA|SELECT/.test(element.tagName) ||
              element.getAttribute('contenteditable') === 'true' ||
              /textbox|combobox|spinbutton/.test(role),
            rect: rect.width && rect.height ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
            nearestCellText: normalize(nearestCell?.innerText || nearestCell?.textContent).slice(0, 200)
          };
        })
        .catch(() => null);
      if (!value) return null;
      return {
        ...value,
        rect: value.rect
          ? {
              ...value.rect,
              x: Math.round(value.rect.x + (frameBox?.x ?? 0)),
              y: Math.round(value.rect.y + (frameBox?.y ?? 0))
            }
          : null
      };
    })
  );
  return results.find((entry) => entry?.isEditable) ?? results.find(Boolean) ?? null;
}

async function clickDateCell(page: Page) {
  await page.mouse.move(682, 246);
  await page.waitForTimeout(150);
  await page.mouse.click(682, 246);
  await page.waitForTimeout(350);
  return activeEditor(page);
}

async function fillActiveEditor(page: Page, value: string) {
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 20 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(650);
}

async function fitTargetLine(page: Page, target: Target) {
  const steps: Array<Record<string, unknown>> = [];
  const before = await captureState(page, `target-016m-${target.code.toLowerCase()}-010-before`, target, `Before controlled line fit for ${target.code}.`);
  if (before.visible.targetStartingNo && before.visible.targetEndingNo) {
    steps.push({ step: 'already-complete', code: target.code });
    return { before, afterAttempt: before, afterReopen: before, setupWriteAttempted: false, persisted: true, steps, blockedBy: [] as string[] };
  }

  const blockedBy: string[] = [];
  const editListClicked = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
  steps.push({ step: 'edit-list', editListClicked });
  await assertSafeContext(page);

  const newClicked = await clickAction(page, /^Neu$|^New$/i);
  steps.push({ step: 'new-line', newClicked });
  await page.waitForTimeout(500);

  const dateEditor = await clickDateCell(page);
  steps.push({ step: 'date-editor', editor: dateEditor });
  if (!dateEditor?.isEditable) blockedBy.push(`${target.code}: Startdatum editor not active/editable.`);
  else await fillActiveEditor(page, '01.01.2026');

  const startEditor = await activeEditor(page);
  steps.push({ step: 'after-date-tab-active-editor', editor: startEditor });
  if (!startEditor?.isEditable) blockedBy.push(`${target.code}: Startnr. editor not active/editable after date.`);
  else await fillActiveEditor(page, target.startingNo);

  const endEditor = await activeEditor(page);
  steps.push({ step: 'after-startnr-tab-active-editor', editor: endEditor });
  if (!endEditor?.isEditable) blockedBy.push(`${target.code}: Endnr. editor not active/editable after Startnr.`);
  else {
    await fillActiveEditor(page, target.endingNo);
    await page.keyboard.press('Enter').catch(() => undefined);
    await page.waitForTimeout(1300);
  }

  await assertSafeContext(page);
  const afterAttempt = await captureState(page, `target-016m-${target.code.toLowerCase()}-020-after-attempt`, target, `After controlled line fit attempt for ${target.code}.`, {
    steps
  });

  await openTargetLines(page, target);
  const afterReopen = await captureState(page, `target-016m-${target.code.toLowerCase()}-030-after-reopen`, target, `After reopening ${target.code} Lines for persistence proof.`, {
    steps
  });
  const persisted = afterReopen.visible.targetStartingNo && afterReopen.visible.targetEndingNo;
  if (!persisted) blockedBy.push(`${target.code}: target Startnr./Endnr. not both visible after reopen.`);
  return { before, afterAttempt, afterReopen, setupWriteAttempted: true, persisted, steps, blockedBy };
}

test('TARGET-016M fits remaining Universaarl U-* Number Series Lines with reopen proof', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const perCode: Record<string, unknown> = {};
  const fitted: string[] = [];
  const blockedBy: string[] = [];
  let setupWriteAttempted = false;

  for (const target of targets) {
    await openTargetLines(page, target);
    const result = await fitTargetLine(page, target);
    perCode[target.code] = result;
    setupWriteAttempted ||= result.setupWriteAttempted;
    if (result.persisted) fitted.push(target.code);
    blockedBy.push(...result.blockedBy);
    if (!result.persisted) break;
  }

  const allPersisted = fitted.length === targets.length;
  const resultStatus = allPersisted ? 'observed' : fitted.length ? 'partial-observed' : 'blocked';
  const nextCase = allPersisted
    ? 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT'
    : 'TARGET-016N-NUMBER-SERIES-REMAINING-LINES-FALLBACK-OR-MANUAL-RECOVERY';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-remaining-lines-controlled-fit',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    targetCodes: targets,
    fittedCodes: fitted,
    perCode,
    proved: [
      'Number Series Lines were operated only in playthru / UNIVERSAARL-DE.',
      ...fitted.map((code) => `${code} Startnr./Endnr. are visible after reopen.`),
      'No number-series assignment, master data, preview posting or posting was executed.',
      'No Allow Gaps/Open checkbox was intentionally changed.'
    ],
    notProved: [
      ...(allPersisted ? [] : ['Not all remaining U-* Number Series Lines are fitted.']),
      'No customer/vendor/item/document numbering assignment is proven.',
      'No German legal invoice-number compliance claim is made.'
    ],
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016m-number-series-remaining-lines-controlled-fit/TARGET-016M-result.json',
      'playwright/projects/fibu-book5/evidence/target-016m-number-series-remaining-lines-controlled-fit/README.md',
      'playwright/projects/fibu-book5/evidence/target-016m-number-series-remaining-lines-controlled-fit/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016m-number-series-remaining-lines-controlled-fit/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016m-number-series-remaining-lines-controlled-fit/*.txt',
      'playwright/projects/fibu-book5/img/target-016m-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016m-number-series-remaining-lines-controlled-fit/TARGET-016M-result.json',
      ...targets.flatMap((target) => [
        `playwright/projects/fibu-book5/img/target-016m-${target.code.toLowerCase()}-010-before.png`,
        `playwright/projects/fibu-book5/img/target-016m-${target.code.toLowerCase()}-030-after-reopen.png`
      ])
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
      setupChanged: allPersisted || fitted.length > 0
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-016L proved the active-editor sequence for U-CUST Number Series Lines.',
      isPlannedNextCaseStillSensible: true,
      reason: 'Remaining U-* lines are the direct prerequisite before setup assignment and master data.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: allPersisted ? 'ready-next' : 'ready-after-current',
          reason: allPersisted ? 'All U-* line ranges are fitted and can be assigned in setup pages next.' : 'A fallback is needed for the first blocked remaining line.'
        },
        {
          caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT',
          status: allPersisted ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Customer creation waits for setup assignment and posting setup.'
        },
        {
          caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups are the next finance foundation dependency.'
        },
        {
          caseId: 'TARGET-020-VAT-SETUP-READINESS',
          status: 'ready-after-current',
          reason: 'VAT setup is required before document preview/posting.'
        },
        {
          caseId: 'TARGET-021-DIMENSIONS-FOUNDATION',
          status: 'ready-after-current',
          reason: 'Dimensions follow numbering and posting setup as foundation.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: allPersisted
        ? 'The numbering line foundation is ready for setup-page assignment.'
        : 'A specific fallback is required before setup-page assignment.',
      risksBeforeNextCase: [
        'Do not assign setup pages unless all required line ranges are visible.',
        'Do not create master data before setup assignment.',
        'Do not make German legal numbering claims from this technical setup proof alone.'
      ],
      requiredPreparation: allPersisted
        ? ['Map Sales/Purchase/Inventory setup fields before assigning U-* number series.']
        : ['Review per-code screenshots and avoid repeating the blocked line route.']
    },
    blockedBy,
    requiresReview: !allPersisted,
    safeToFinalizeState: allPersisted,
    reason: allPersisted
      ? 'TARGET-016M fitted all remaining Universaarl U-* Number Series Lines with reopen proof.'
      : `TARGET-016M fitted ${fitted.length}/${targets.length} remaining Universaarl U-* Number Series Lines.`
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016M Remaining Number Series Lines Controlled Fit',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenzen',
      '',
      '- Keine Nummernserien-Zuweisung in Setup-Seiten.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.',
      '- Keine Checkbox-Aenderung.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
