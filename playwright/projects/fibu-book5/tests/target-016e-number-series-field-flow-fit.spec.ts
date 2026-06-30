import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016E-NUMBER-SERIES-LINES-FIELD-FLOW-CONTROLLED-FIT';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016e-number-series-lines-field-flow-controlled-fit';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016E-result.json');
const probeSeries = { code: 'U-CUST', startDate: '01.01.2026', startNo: 'U-CUST00001', endNo: 'U-CUST99999' };

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
    return rawUrl.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{tenant}');
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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE.toLowerCase());
}

function codePattern(code: string) {
  return new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
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
    ...metadata
  });
}

async function assertSafeContext(page: Page) {
  const currentUrl = page.url();
  if (!instancePathIsTarget(currentUrl) || !companyParamIsTarget(currentUrl)) {
    throw new Error(`Unsafe context ${sanitizeEvidenceUrl(currentUrl)}`);
  }
  const text = clean(await pageText(page));
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Expected Number Series context is not visible.');
  }
  if (/Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Delete\?|Loeschen\?|Ship and Invoice/i.test(text)) {
    throw new Error('Dangerous dialog text detected.');
  }
}

async function clickFirstVisible(page: Page, names: RegExp[]) {
  for (const name of names) {
    for (const scope of [page, ...page.frames()]) {
      for (const role of ['button', 'menuitem'] as const) {
        const locator = scope.getByRole(role, { name }).first();
        if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
          await locator.click({ timeout: 4000 }).catch(async () => locator.click({ timeout: 4000, force: true }));
          await page.waitForTimeout(900);
          return true;
        }
      }
    }
  }
  return false;
}

async function selectSeriesRow(page: Page, code: string) {
  for (const scope of [page, ...page.frames()]) {
    const row = scope.getByRole('row', { name: codePattern(code) }).first();
    if (await row.isVisible({ timeout: 800 }).catch(() => false)) {
      await row.click({ timeout: 4000 }).catch(async () => row.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
    const text = scope.getByText(codePattern(code)).first();
    if (await text.isVisible({ timeout: 800 }).catch(() => false)) {
      await text.click({ timeout: 4000 }).catch(async () => text.click({ timeout: 4000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const compact = await compactPageText(page, {
    include: [/Nr\.-Serienzeilen|Nummernserie|U-CUST|U-CUST00001|U-CUST99999|01\.01\.2026|Startdatum|Startnr|Endnr|Letzte Nr|Warnungsnr|Erhohung|Erh.hung|Luecken|L.cken|Offen|Liste bearbeiten/i],
    maxLines: 180,
    maxLineLength: 220
  });
  const text = clean(await pageText(page));
  const visible = {
    targetStartDate: /01\.01\.2026|1\/1\/2026|2026-01-01/.test(text),
    targetStartNo: codePattern(probeSeries.startNo).test(text),
    targetEndNo: codePattern(probeSeries.endNo).test(text)
  };
  await writeText(`${filePrefix}.txt`, compact);
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), { step, compact, visible, ...extra });
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    status: 'controlled-field-flow-fit',
    visibleLearning: 'Das Bild muss zeigen, ob Startdatum, Startnr. und Endnr. fuer U-CUST sichtbar gesetzt oder weiterhin leer sind.',
    internallyProves: 'Number Series Lines field-flow state for U-CUST.',
    doesNotProve: ['No setup assignment, no master data, no preview posting, no posting.'],
    qualityDecision: 'setup-evidence-candidate',
    visible,
    ...extra
  });
  return { compact, text, visible };
}

async function openUCustLines(page: Page) {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeContext(page);
  if (!(await selectSeriesRow(page, probeSeries.code))) throw new Error('U-CUST row could not be selected.');
  if (!(await clickFirstVisible(page, [/^Zeilen$|^Lines$/i]))) throw new Error('Zeilen/Lines action could not be opened.');
  await assertSafeContext(page);
  await page.waitForTimeout(800);
}

test('TARGET-016E sets U-CUST number series lines through Startdatum field flow and verifies reopen', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let setupChanged = false;

  await openUCustLines(page);
  const before = await captureState(page, 'target-016e-010-before-field-flow', 'Before controlled field-flow write.');
  const alreadyVisible = before.visible.targetStartNo && before.visible.targetEndNo;

  if (!alreadyVisible) {
    if (!(await clickFirstVisible(page, [/^Liste bearbeiten$|^Edit List$/i]))) {
      blockedBy.push('Liste bearbeiten / Edit List was not clickable.');
    } else {
      await page.waitForTimeout(500);
      await page.keyboard.type(probeSeries.startDate, { delay: 15 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(250);
      await page.keyboard.type(probeSeries.startNo, { delay: 15 });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(250);
      await page.keyboard.type(probeSeries.endNo, { delay: 15 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
      setupChanged = true;
    }
  }

  await assertSafeContext(page);
  let afterWrite = await captureState(page, 'target-016e-020-after-field-flow-write', 'After controlled Startdatum -> Startnr. -> Endnr. field-flow write.', {
    alreadyVisible,
    setupChanged
  });

  let f2FallbackAttempted = false;
  if (!alreadyVisible && !(afterWrite.visible.targetStartNo && afterWrite.visible.targetEndNo)) {
    await openUCustLines(page);
    await clickFirstVisible(page, [/^Liste bearbeiten$|^Edit List$/i]);
    await page.waitForTimeout(500);
    await page.keyboard.press('F2');
    await page.waitForTimeout(250);
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.type(probeSeries.startDate, { delay: 15 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    await page.keyboard.press('F2');
    await page.waitForTimeout(150);
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.type(probeSeries.startNo, { delay: 15 });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    await page.keyboard.press('F2');
    await page.waitForTimeout(150);
    await page.keyboard.press('Control+A').catch(() => undefined);
    await page.keyboard.type(probeSeries.endNo, { delay: 15 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
    f2FallbackAttempted = true;
    setupChanged = true;
    afterWrite = await captureState(page, 'target-016e-025-after-f2-field-flow-fallback', 'After F2 editor activation fallback for Startdatum -> Startnr. -> Endnr.', {
      alreadyVisible,
      setupChanged,
      f2FallbackAttempted
    });
  }

  await openUCustLines(page);
  const afterReopen = await captureState(page, 'target-016e-030-after-reopen-proof', 'After reopening U-CUST Number Series Lines for persistence proof.', {
    alreadyVisible,
    setupChanged
  });

  const persisted = afterReopen.visible.targetStartNo && afterReopen.visible.targetEndNo;
  if (!persisted) blockedBy.push('U-CUST Startnr./Endnr. target values were not visible after reopen.');

  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted
    ? 'TARGET-016F-NUMBER-SERIES-REMAINING-LINES-CONTROLLED-FIT'
    : 'TARGET-016F-NUMBER-SERIES-PERSONALIZE-OR-SETUP-ASSISTED-ROUTE';
  const evidenceRefs = [
    'playwright/projects/fibu-book5/img/target-016e-010-before-field-flow.png',
    'playwright/projects/fibu-book5/img/target-016e-020-after-field-flow-write.png',
    'playwright/projects/fibu-book5/img/target-016e-030-after-reopen-proof.png'
  ];
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-field-flow-fit',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    proved: [
      'U-CUST Number Series Lines context was reopened in playthru / UNIVERSAARL-DE.',
      ...(persisted ? ['U-CUST Startnr./Endnr. target values are visible after reopen.'] : []),
      ...(setupChanged ? ['A controlled U-CUST Number Series Lines field-flow write was attempted.'] : ['U-CUST target values were already visible before write attempt.'])
    ],
    notProved: [
      ...(persisted ? ['Only U-CUST was fitted; remaining U-* series are still open.'] : ['A reliable persistent Startnr./Endnr. field-flow route is still not proven.']),
      'No setup assignment, master data, preview posting, posting or ledger trace was created.',
      'Checkbox semantics were observed but not changed.'
    ],
    before,
    afterWrite,
    afterReopen,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016e-number-series-lines-field-flow-controlled-fit/TARGET-016E-result.json',
      'playwright/projects/fibu-book5/evidence/target-016e-number-series-lines-field-flow-controlled-fit/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016e-number-series-lines-field-flow-controlled-fit/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016e-number-series-lines-field-flow-controlled-fit/*.txt',
      'playwright/projects/fibu-book5/img/target-016e-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016e-number-series-lines-field-flow-controlled-fit/TARGET-016E-result.json',
      ...evidenceRefs,
      ...(f2FallbackAttempted ? ['playwright/projects/fibu-book5/img/target-016e-025-after-f2-field-flow-fallback.png'] : [])
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
      setupWriteAttempted: setupChanged,
      setupChanged: persisted
    },
    statePatch: {
      current: {
        activeCase: CASE_ID,
        activeArea: 'universaarl-w1-foundation-number-series',
        nextStep: persisted
          ? 'Apply the proven field-flow route to remaining U-* Number Series Lines under a separate controlled setup case.'
          : 'Use Personalize or another standard setup route; field-flow write did not persist U-CUST line values.'
      }
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-016D proved Page Inspection for No. Series Lines page 457 and table 309.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The active field starts at Startdatum, so field-flow input is the first non-repeated, BC-native write route.',
      lookaheadReviewed: [
        { caseId: nextCase, status: persisted ? 'ready-next' : 'needs-ui-discovery-first', reason: persisted ? 'U-CUST persistence is proven; remaining series can follow.' : 'Field-flow route did not prove persistence.' },
        { caseId: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT', status: persisted ? 'ready-after-current' : 'needs-setup-first', reason: 'Assignments require all needed line ranges.' },
        { caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT', status: 'needs-setup-first', reason: 'Customer creation depends on assigned customer number series.' },
        { caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT', status: 'ready-after-current', reason: 'Posting groups follow the numbering foundation.' }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'The first number-series line persistence proof can now be reused for remaining U-* series.'
        : 'The field-flow route is also blocked, so the next route must use Personalize or another standard setup path.',
      risksBeforeNextCase: [
        'Do not change checkboxes without their own decision.',
        'Do not assign setup pages until remaining line ranges are ready.',
        'Do not create master data yet.'
      ],
      requiredPreparation: ['Carry forward before/after/reopen screenshot QA.']
    },
    f2FallbackAttempted,
    warnings,
    blockedBy,
    requiresReview: !persisted,
    safeToFinalizeState: persisted,
    reason: persisted
      ? 'TARGET-016E proved U-CUST Number Series Lines persistence through field-flow input.'
      : 'TARGET-016E did not prove U-CUST Number Series Lines persistence after reopen.'
  };
  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016E Number Series Lines Field-Flow Controlled Fit',
      '',
      `Instanz: ${EXPECTED_INSTANCE}`,
      `Company: ${TARGET_COMPANY}`,
      '',
      '## Ergebnis',
      '',
      result.reason,
      '',
      '## Grenze',
      '',
      '- Nur U-CUST wurde geprueft.',
      '- Keine Setup-Zuweisung.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.',
      '- Checkboxen wurden nicht geaendert.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
