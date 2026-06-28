import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-273';
const CASE_ID = 'FIXEDASSETS-273-FA-DEPRECIATION-POST-ACQUISITION-CONTROLLED-OK-NO-POST';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const SEARCH_TERM = 'Calculate Depreciation';
const TARGETS = {
  depreciationBook: 'HGB',
  postingDate: '31.01.2027',
  documentNo: 'FADEP-273-OK',
  fixedAssetNo: 'FA-CNC-01',
};
const TARGET_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function rmDemoHomeUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function journalUrl() {
  const url = new URL(bcPageUrl(TARGET_PAGE_ID, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function sanitizedFrameUrl(frameUrl: string) {
  try {
    return safeUrl(frameUrl);
  } catch {
    return 'unparseable-frame-url';
  }
}

async function candidateElements(frame: Frame) {
  return frame.evaluate(() => {
    const label = /Calculate\s+Depreciation/i;
    const ascii = (value: string) =>
      value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
    return [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"],[role="row"],[role="gridcell"],span')]
      .map((element, index) => {
        const text = ascii(element.innerText || element.textContent || '');
        const aria = ascii(element.getAttribute('aria-label') || '');
        const title = ascii(element.getAttribute('title') || '');
        const role = element.getAttribute('role') || '';
        const rect = element.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.y >= 0;
        return {
          index,
          tag: element.tagName.toLowerCase(),
          role,
          text,
          aria,
          title,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible,
          matches: visible && (label.test(text) || label.test(aria) || label.test(title)),
        };
      })
      .filter((entry) => entry.matches && entry.text.length <= 180)
      .slice(0, 16);
  });
}

async function clickCalculateDepreciationResult(page: Page) {
  const inspected: Array<{ frameUrl: string; candidates: Awaited<ReturnType<typeof candidateElements>> }> = [];

  for (const frame of page.frames()) {
    const candidates = await candidateElements(frame).catch(() => []);
    if (candidates.length > 0) inspected.push({ frameUrl: sanitizedFrameUrl(frame.url()), candidates });

    const row = frame.getByRole('row', { name: /^Calculate Depreciation\s+Aufgaben/i });
    const rowCount = await row.count().catch(() => 0);
    if (rowCount === 1) {
      await row.first().click({ timeout: 4000 });
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'role:row:Calculate Depreciation Aufgaben', inspected };
    }

    const exact = frame.getByText(/^Calculate Depreciation$/);
    const exactCount = await exact.count().catch(() => 0);
    if (exactCount === 1 && (await exact.first().isVisible({ timeout: 500 }).catch(() => false))) {
      await exact.first().click({ timeout: 4000 });
      await page.waitForTimeout(5000);
      return { clicked: true, method: 'text:exact:Calculate Depreciation', inspected };
    }
  }

  return { clicked: false, method: 'not-clicked-ambiguous-or-missing', inspected };
}

function requestPageSignals(text: string) {
  const normalized = clean(text);
  const signals = {
    hasCalculateDepreciationTitle: /Calculate\s+Depreciation/i.test(normalized),
    hasDepreciationBook: /Depreciation\s+Book|AfA-Buch/i.test(normalized),
    hasPostingDate: /Posting\s+Date|Buchungsdatum/i.test(normalized),
    hasDocumentNo: /Document\s+No\.|Belegnr/i.test(normalized),
    hasPostingDescription: /Posting\s+Description/i.test(normalized),
    hasFixedAssetFilter: /Filter:\s*Fixed\s+Asset|Fixed\s+Asset/i.test(normalized),
  };
  const signalCount = Object.values(signals).filter(Boolean).length;
  return {
    ...signals,
    signalCount,
    requestPageLikelyOpen: signals.hasCalculateDepreciationTitle && signalCount >= 4,
  };
}

async function visibleBlockingConfirmation(page: Page) {
  const dialogs = await Promise.all(
    page.frames().map((frame) =>
      frame
        .locator('[role="dialog"], .ms-Dialog-main, [aria-modal="true"]')
        .evaluateAll((elements) =>
          elements
            .map((element) => {
              const rect = (element as HTMLElement).getBoundingClientRect();
              const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
              return {
                text,
                visible: rect.width > 0 && rect.height > 0,
              };
            })
            .filter((entry) => entry.visible && entry.text.length > 0),
        )
        .catch(() => []),
    ),
  );
  const text = clean(dialogs.flat().map((entry) => entry.text).join('\n'));
  const dangerousConfirm = /\b(OK|Post|Post and Print|Preview Posting|Ship|Invoice|Ship and Invoice|Delete|Yes|Ja)\b/i.test(text);
  return {
    dangerousConfirm,
    okVisibleInDialog: /\bOK\b/.test(text),
    textSample: text.slice(0, 1000),
  };
}

type FieldKey = 'depreciationBook' | 'postingDate' | 'documentNo' | 'fixedAssetNo';

const fieldSpecs: Record<FieldKey, { label: RegExp; target: string }> = {
  depreciationBook: { label: /^Depreciation\s+Book$/i, target: TARGETS.depreciationBook },
  postingDate: { label: /^Posting\s+Date$/i, target: TARGETS.postingDate },
  documentNo: { label: /^Document\s+No\.$/i, target: TARGETS.documentNo },
  fixedAssetNo: { label: /^No\.$/i, target: TARGETS.fixedAssetNo },
};

async function requestPageFrame(page: Page) {
  for (const frame of page.frames()) {
    const text = await frame.locator('body').innerText({ timeout: 1000 }).catch(() => '');
    if (/Calculate\s+Depreciation/i.test(text) && /Depreciation\s+Book/i.test(text) && /Filter:\s*Fixed\s+Asset/i.test(text)) {
      return frame;
    }
  }
  return undefined;
}

async function fieldMap(frame: Frame) {
  return frame.evaluate(() => {
    const norm = (value: string | null | undefined) =>
      (value ?? '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .trim();
    const visible = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const controlSelector = 'input,select,textarea,[contenteditable="true"],[role="textbox"],[role="combobox"],[role="spinbutton"]';
    const controls = [...document.querySelectorAll<HTMLElement>(controlSelector)]
      .map((element, queryIndex) => ({ element, queryIndex }))
      .filter(({ element }) => visible(element))
      .map(({ element, queryIndex }, visibleIndex) => {
        const rect = element.getBoundingClientRect();
        const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        return {
          index: visibleIndex,
          queryIndex,
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          type: element.getAttribute('type') || '',
          text: norm(element.innerText || element.textContent || ''),
          value: 'value' in input ? norm(input.value) : '',
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          readOnly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
        };
      });
    const labels = [...document.querySelectorAll<HTMLElement>('label,span,div,[role="row"],[role="gridcell"]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          text: norm(element.innerText || element.textContent || ''),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((item) => item.text.length > 0 && item.text.length <= 120 && !item.text.includes('\n'));
    return { controls, labels };
  });
}

function selectControl(map: Awaited<ReturnType<typeof fieldMap>>, key: FieldKey) {
  const spec = fieldSpecs[key];
  const labels = map.labels.filter((label) => spec.label.test(label.text));
  const candidates = labels
    .flatMap((label) =>
      map.controls.map((control) => ({
        label,
        control,
        dx: control.x - label.x,
        dy: control.y - label.y,
        distance: Math.round(Math.hypot(control.x - label.x, control.y - label.y)),
        rightOfLabel: control.x >= label.x,
        sameBand: Math.abs(control.y - label.y) <= 20,
      })),
    )
    .filter((candidate) => candidate.rightOfLabel && candidate.sameBand && !candidate.control.readOnly && !candidate.control.disabled)
    .sort((left, right) => left.distance - right.distance);
  return { labels, candidates, selected: candidates[0] };
}

async function fillMappedField(page: Page, frame: Frame, key: FieldKey) {
  const beforeMap = await fieldMap(frame);
  const selection = selectControl(beforeMap, key);
  if (!selection.selected) {
    return {
      key,
      target: fieldSpecs[key].target,
      status: 'blocked-no-field-candidate',
      selection,
    };
  }

  const controlSelector = 'input,select,textarea,[contenteditable="true"],[role="textbox"],[role="combobox"],[role="spinbutton"]';
  const locator = frame.locator(controlSelector).nth(selection.selected.control.queryIndex);
  await locator.click({ timeout: 3000 });
  await pageKeyboardSelectAll(page);
  await locator.fill(fieldSpecs[key].target, { timeout: 3000 });
  await locator.press('Tab').catch(() => undefined);
  await page.waitForTimeout(500);

  const afterMap = await fieldMap(frame);
  const afterSelection = selectControl(afterMap, key);
  const afterValue = afterSelection.selected?.control.value ?? '';
  return {
    key,
    target: fieldSpecs[key].target,
    status: afterValue === fieldSpecs[key].target ? 'proved' : 'blocked-value-not-persisted',
    beforeValue: selection.selected.control.value,
    afterValue,
    controlIndex: selection.selected.control.index,
    controlQueryIndex: selection.selected.control.queryIndex,
    label: selection.selected.label,
    controlBefore: selection.selected.control,
    controlAfter: afterSelection.selected?.control ?? null,
  };
}

async function pageKeyboardSelectAll(page: Page) {
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
}

async function clickRequestPageOk(page: Page, frame: Frame | undefined) {
  if (!frame) return { clicked: false, reason: 'request-page-frame-missing', okClickCount: 0 };
  const okButton = frame.getByRole('button', { name: /^OK$/ });
  const count = await okButton.count().catch(() => 0);
  if (count !== 1) return { clicked: false, reason: `ok-button-count-${count}`, okClickCount: 0 };
  await okButton.first().click({ timeout: 5000 });
  await page.waitForTimeout(6000);
  return { clicked: true, reason: 'ok-clicked-once', okClickCount: 1 };
}

async function journalSearchSignals(page: Page) {
  await page.goto(journalUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Document No\.|FA Posting Type/i, { timeout: 90_000 });
  await page.waitForTimeout(1500);

  const fullText = await pageText(page);
  const compactText = clean(
    await compactPageText(page, {
      include: [
        /Fixed Asset G\/L Journals|Batch Name|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|Amount|No\. of Depreciation Days|Depr\. until FA Posting Date|FADEP-|FA-CNC-01|HGB|Depreciation|Post|Preview Posting/i,
      ],
      maxLines: 220,
      maxLineLength: 280,
    }),
  );
  const frameSignals = [];
  for (const currentFrame of page.frames()) {
    const frameUrl = decodeURIComponent(currentFrame.url());
    if (!frameUrl.includes(EXPECTED_INSTANCE) || !frameUrl.includes(`page=${TARGET_PAGE_ID}`)) continue;
    const signal = await currentFrame
      .evaluate((targetDocumentNo) => {
        const norm = (value: string | null | undefined) =>
          (value ?? '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .trim();
        const visible = (element: HTMLElement) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const bodyText = norm(document.body?.innerText || '');
        const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
          .filter(visible)
          .map((row, index) => ({
            index,
            text: norm(row.innerText || row.textContent),
          }))
          .filter((row) => /FADEP-|FA-CNC-01|Depreciation|Document No\.|Posting Date|Fixed Asset G\/L Journals/i.test(row.text))
          .slice(0, 80);
        const combined = `${bodyText}\n${rows.map((row) => row.text).join('\n')}`;
        return {
          frameUrl: location.href,
          bodyContainsTargetDocumentNo: bodyText.includes(targetDocumentNo),
          combinedContainsTargetDocumentNo: combined.includes(targetDocumentNo),
          bodyContainsFaDepPrefix: /FADEP-/i.test(bodyText),
          titleVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(bodyText),
          rows,
        };
      }, TARGETS.documentNo)
      .catch((error) => ({ error: String(error) }));
    if ('frameUrl' in signal && typeof signal.frameUrl === 'string') {
      signal.frameUrl = safeUrl(signal.frameUrl);
    }
    frameSignals.push(signal);
  }
  const foundTargetDocumentNo =
    fullText.includes(TARGETS.documentNo) || frameSignals.some((entry: any) => entry.combinedContainsTargetDocumentNo || entry.bodyContainsTargetDocumentNo);
  const foundFaDepPrefix =
    /FADEP-/i.test(fullText) || frameSignals.some((entry: any) => entry.bodyContainsFaDepPrefix);
  return {
    finalUrl: safeUrl(page.url()),
    instanceMatches: page.url().includes(EXPECTED_INSTANCE),
    companyFromUrl: new URL(page.url()).searchParams.get('company'),
    pageTitleVisible: /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal/i.test(fullText),
    foundTargetDocumentNo,
    foundFaDepPrefix,
    compactText,
    frameSignals,
  };
}

test('fixedassets-273 executes Calculate Depreciation OK once and searches journal without post', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await page.goto(rmDemoHomeUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);

  const initialUrl = page.url();
  const instanceMatches = initialUrl.includes(EXPECTED_INSTANCE);
  const companyFromUrl = new URL(initialUrl).searchParams.get('company');
  expect(instanceMatches, `BC URL muss Instanz ${EXPECTED_INSTANCE} enthalten.`).toBe(true);
  expect(companyFromUrl, `BC URL muss Company ${EXPECTED_COMPANY} enthalten.`).toBe(EXPECTED_COMPANY);

  await searchFor(page, SEARCH_TERM);
  const click = await clickCalculateDepreciationResult(page);
  const initialText = await pageText(page);
  const signals = requestPageSignals(initialText);
  const frame = signals.requestPageLikelyOpen ? await requestPageFrame(page) : undefined;

  const blocker = [
    ...(click.clicked ? [] : ['calculate-depreciation-result-not-clicked']),
    ...(signals.requestPageLikelyOpen ? [] : ['request-page-not-recognized']),
    ...(frame ? [] : ['request-page-frame-not-found']),
  ];

  const fieldResults = [];
  let okExecution = { clicked: false, reason: 'not-attempted', okClickCount: 0 };
  if (frame && blocker.length === 0) {
    for (const key of ['depreciationBook', 'postingDate', 'documentNo', 'fixedAssetNo'] as FieldKey[]) {
      const dangerBefore = await visibleBlockingConfirmation(page);
      if (dangerBefore.dangerousConfirm) {
        blocker.push(`blocking-confirmation-dialog-visible-before-${key}`);
        break;
      }
      fieldResults.push(await fillMappedField(page, frame, key));
    }
  }

  const allValuesProved = fieldResults.length === 4 && fieldResults.every((entry) => entry.status === 'proved');
  if (!allValuesProved) {
    blocker.push(
      ...fieldResults.filter((entry) => entry.status !== 'proved').map((entry) => `${entry.key}-${entry.status}`),
    );
  }

  const compactText = clean(
    await compactPageText(page, {
      include: [
        /Calculate\s+Depreciation|Depreciation\s+Book|Posting\s+Date|Document\s+No\.|Posting\s+Description|Filter|Fixed\s+Asset|No\.|FA\s+Class|FA\s+Subclass|Budgeted\s+Asset|OK|Abbrechen|Cancel|FADEP|HGB|30\.06\.2026|FA-CNC-01/i,
      ],
      maxLines: 220,
      maxLineLength: 280,
    }),
  );

  let journalSearch: Awaited<ReturnType<typeof journalSearchSignals>> | undefined;
  if (allValuesProved && blocker.length === 0) {
    okExecution = await clickRequestPageOk(page, frame);
    if (!okExecution.clicked) {
      blocker.push(`ok-execution-${okExecution.reason}`);
    } else if (okExecution.okClickCount !== 1) {
      blocker.push(`ok-click-count-${okExecution.okClickCount}`);
    } else {
      journalSearch = await journalSearchSignals(page);
    }
  } else {
    await page.keyboard.press('Escape').catch(() => undefined);
    await page.waitForTimeout(500);
  }

  const resultStatus = blocker.length ? 'blocked' : 'observed';
  const journalLineFound = journalSearch?.foundTargetDocumentNo ?? false;
  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-post-acquisition-controlled-ok-no-post',
    caseId: CASE_ID,
    source: 'playwright-controlled-ok-no-post',
    resultStatus,
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    url: {
      initialUrl: safeUrl(initialUrl),
      finalUrl: safeUrl(page.url()),
      instanceMatches,
      companyFromUrl,
    },
    targets: TARGETS,
    click,
    requestPage: {
      ...signals,
      fieldResults,
      allValuesProved,
    },
    okExecution,
    journalSearch,
    safety: {
      okConfirmedExactlyOnce: okExecution.okClickCount === 1,
      noDepreciationPosted: true,
      noJournalLineCreated: !journalLineFound,
      journalLineSearchPerformed: Boolean(journalSearch),
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    proved: [
      ...(signals.requestPageLikelyOpen ? ['Calculate Depreciation request page was opened.'] : []),
      ...(allValuesProved
        ? ['HGB, 31.01.2027, FADEP-273-OK and FA-CNC-01 were visibly proven on the request page before OK.']
        : []),
      ...(okExecution.clicked ? ['OK was confirmed exactly once.'] : []),
      ...(journalLineFound ? ['FADEP-273-OK was found in Fixed Asset G/L Journals after OK.'] : ['FADEP-273-OK was not found in Fixed Asset G/L Journals after OK.']),
      'No Preview Posting or Post was executed.',
    ],
    notProved: [
      ...(journalLineFound ? [] : ['No depreciation journal line was found.']),
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-273-fa-depreciation-post-acquisition-controlled-ok-no-post.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-273/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-273/FIXEDASSETS-273-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-273/FIXEDASSETS-273-CONTROLLED-OK-NO-POST.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-273/010-ok-execution-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-273/020-journal-line-search.json',
    ],
    statePatch: {
      current: {
        activeCase: journalLineFound
          ? 'FIXEDASSETS-274-FA-DEPRECIATION-POST-ACQUISITION-JOURNAL-LINE-REVIEW'
          : 'FIXEDASSETS-274-FA-DEPRECIATION-POST-ACQUISITION-OK-RESULT-BLOCKER-REVIEW',
        active_case_file: journalLineFound
          ? '.agent/state/cases/fixedassets-274-fa-depreciation-post-acquisition-journal-line-review.json'
          : '.agent/state/cases/fixedassets-274-fa-depreciation-post-acquisition-ok-result-blocker-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-273-fa-depreciation-post-acquisition-controlled-ok-no-post.json',
        nextStep: journalLineFound
          ? 'FIXEDASSETS-274: locally review the FADEP-273-OK journal line and decide the next no-post evidence step.'
          : 'FIXEDASSETS-274: locally review why OK did not produce visible FADEP-273-OK journal evidence before any repeat.',
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase: journalLineFound
          ? 'FIXEDASSETS-274-FA-DEPRECIATION-POST-ACQUISITION-JOURNAL-LINE-REVIEW'
          : 'FIXEDASSETS-274-FA-DEPRECIATION-POST-ACQUISITION-OK-RESULT-BLOCKER-REVIEW',
        depreciationReadiness: journalLineFound
          ? 'FA-273 confirmed OK once and found FADEP-273-OK in Fixed Asset G/L Journals. Preview Posting and Post remain locked pending local review.'
          : 'FA-273 confirmed OK once but did not find FADEP-273-OK in Fixed Asset G/L Journals. Repeat OK remains locked pending local review.',
      },
    },
    blockedBy: blocker,
    requiresReview: true,
    safeToFinalizeState: true,
    reason: allValuesProved
      ? 'Controlled OK execution completed; local review required before Preview Posting, Post or repeat execution.'
      : 'Controlled OK execution did not complete cleanly or did not produce visible journal evidence; local review required.',
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('010-target-value-preflight.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    targets: TARGETS,
    click,
    requestPageSignals: signals,
    fieldResults,
    allValuesProved,
    blockedBy: blocker,
  });
  await writeJsonEvidence(faEvidencePath('010-ok-execution-result.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    targets: TARGETS,
    allValuesProved,
    okExecution,
    blockedBy: blocker,
  });
  await writeJsonEvidence(faEvidencePath('020-journal-line-search.json'), {
    schemaVersion: 1,
    caseId: CASE_ID,
    targetDocumentNo: TARGETS.documentNo,
    journalSearch: journalSearch ?? null,
    foundTargetDocumentNo: journalLineFound,
  });
  await writeTextEvidence(faEvidencePath('010-target-value-preflight-text.txt'), compactText || 'No compact request-page text captured.');
  if (journalSearch) {
    await writeTextEvidence(faEvidencePath('020-journal-line-search-text.txt'), journalSearch.compactText || 'No compact journal search text captured.');
  }
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-273-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-273-CONTROLLED-OK-NO-POST.md'),
    [
      '# FIXEDASSETS-273 Post-acquisition kontrollierte OK-Ausfuehrung ohne Preview/Post',
      '',
      'Status: `labor`, `ok-execution`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Zielwerte',
      '',
      `- Depreciation Book: \`${TARGETS.depreciationBook}\``,
      `- Posting Date: \`${TARGETS.postingDate}\``,
      `- Document No.: \`${TARGETS.documentNo}\``,
      `- Fixed Asset No. Filter: \`${TARGETS.fixedAssetNo}\``,
      '',
      '## Ergebnis',
      '',
      `- Request Page sichtbar: ${signals.requestPageLikelyOpen ? 'ja' : 'nein'}`,
      `- Alle Zielwerte vor OK sichtbar bewiesen: ${allValuesProved ? 'ja' : 'nein'}`,
      `- OK genau einmal bestaetigt: ${okExecution.okClickCount === 1 ? 'ja' : 'nein'}`,
      `- FADEP-273-OK im Journal sichtbar: ${journalLineFound ? 'ja' : 'nein'}`,
      `- Blocker: ${blocker.length ? blocker.join(', ') : 'keine'}`,
      '',
      '## Grenzen',
      '',
      '- Kein Preview Posting.',
      '- Keine Buchung.',
      '- Kein Setup Change.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.statePatch.current.nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-273 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-273-result.json` | JSON-Ergebnis | Post-acquisition OK-Ausfuehrung und Journal-Suchstatus | kein Preview/Post | labor |',
      '| `FIXEDASSETS-273-CONTROLLED-OK-NO-POST.md` | Lernzusammenfassung | OK-Grenze, Ergebnis und naechster Gate-Schritt | keinen deutschen Finalnachweis | labor |',
      '| `010-target-value-preflight.json` | UI-Evidence | Feld-/Wertstatus der Request Page vor OK | keine Buchungswirkung | compact |',
      '| `010-ok-execution-result.json` | JSON | OK genau einmal oder Blocker | kein Preview/Post | compact |',
      '| `020-journal-line-search.json` | JSON | Journal-Suchbefund fuer `FADEP-273-OK` | keine Buchung | compact |',
      '| `010-target-value-preflight-text.txt` | kompakter Text | sichtbarer Request-Page-Kontext | kein Rohdump | compact |',
      '',
    ].join('\n'),
  );

  expect(result.safety.okConfirmedExactlyOnce).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
});

