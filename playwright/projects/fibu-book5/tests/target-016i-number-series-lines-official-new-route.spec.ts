import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016I-NUMBER-SERIES-LINES-OFFICIAL-NEW-ROUTE-WRITE-GATE';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016i-number-series-lines-official-new-route-write-gate';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016I-result.json');

const target = {
  code: 'U-CUST',
  startingDate: '01.01.2026',
  startingNo: 'U-CUST00001',
  endingNo: 'U-CUST99999'
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

function companyParamIsTarget(rawUrl: string) {
  const value = new URL(rawUrl).searchParams.get('company') ?? '';
  return value.replace(/\+/g, ' ').toUpperCase() === TARGET_COMPANY;
}

function instancePathIsTarget(rawUrl: string) {
  return new URL(rawUrl).pathname.toLowerCase().split('/').filter(Boolean).includes(EXPECTED_INSTANCE);
}

function literalPattern(value: string) {
  return new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
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

async function safeText(page: Page) {
  return clean(await pageText(page));
}

function hasDangerousText(text: string) {
  return /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Buchen\?|Delete\?|Loeschen\?|Ship and Invoice|Liefern und fakturieren/i.test(text);
}

async function assertSafeContext(page: Page) {
  const url = page.url();
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) {
    throw new Error(`Unsafe context: ${sanitizeEvidenceUrl(url)}`);
  }
  const text = await safeText(page);
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Number Series or Number Series Lines context is not visible.');
  }
  if (hasDangerousText(text)) throw new Error('Dangerous dialog or posting/delete text is visible.');
  if (/Sales & Receivables Setup|Purchases & Payables Setup|Inventory Setup|Einrichtung Debitoren|Kreditoren & Einkauf|Lager Einrichtung/i.test(text)) {
    throw new Error('Setup assignment page is visible; TARGET-016I must stay in Number Series/Lines only.');
  }
}

async function visibleControls(page: Page) {
  const labels = new Set<string>();
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem', 'link', 'checkbox', 'textbox', 'row'] as const) {
      const locators = await scope.getByRole(role).all().catch(() => []);
      for (const locator of locators.slice(0, 120)) {
        if (!(await locator.isVisible({ timeout: 80 }).catch(() => false))) continue;
        const label = clean(
          (await locator.getAttribute('aria-label').catch(() => null)) ??
            (await locator.getAttribute('title').catch(() => null)) ??
            (await locator.textContent().catch(() => null)) ??
            ''
        );
        if (label && /Neu|New|Zeilen|Lines|Liste bearbeiten|Edit List|Startdatum|Startnr|Endnr|Offen|Luecken|Gaps|U-CUST/i.test(label)) {
          labels.add(`${role}: ${label}`.slice(0, 180));
        }
      }
    }
  }
  return [...labels].slice(0, 100);
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const text = await safeText(page);
  const compact = await compactPageText(page, {
    include: [/Nr\.-Serienzeilen|Nummernserie|No\. Series|U-CUST|Startdatum|Startnr|Endnr|Starting|Ending|01\.01\.2026|2026|Offen|Luecken|Gaps|Liste bearbeiten|Neu|New/i],
    maxLines: 180,
    maxLineLength: 220
  });
  const visible = {
    targetCode: literalPattern(target.code).test(text),
    startingDate: /01\.01\.2026|1\/1\/2026|2026-01-01/.test(text),
    startingNo: literalPattern(target.startingNo).test(text),
    endingNo: literalPattern(target.endingNo).test(text),
    gapOrOpenCheckboxText: /Offen|Luecken|L.cken|Gaps|Open/i.test(text)
  };
  const controls = await visibleControls(page);
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    compact,
    visible,
    controls,
    ...extra
  };
  await writeText(`${filePrefix}.txt`, compact || text.slice(0, 5000));
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    status: 'german-final-candidate-setup-evidence',
    visibleLearning:
      'Der Screenshot muss zeigen, ob U-CUST, Startdatum, Startnr. und Endnr. in den Nummernserienzeilen sichtbar sind.',
    internallyProves: 'Number Series Lines UI state for U-CUST in playthru / UNIVERSAARL-DE.',
    doesNotProve: [
      'No setup assignment.',
      'No master data.',
      'No preview posting.',
      'No posting.',
      'No checkbox value change proof unless explicitly stated.'
    ],
    qualityDecision: 'requires-visual-qa',
    visible,
    controls,
    ...extra
  });
  return snapshot;
}

async function clickFirst(locators: Locator[]) {
  for (const locator of locators) {
    const candidate = locator.first();
    if (await candidate.isVisible({ timeout: 800 }).catch(() => false)) {
      await candidate.click({ timeout: 5000 }).catch(async () => candidate.click({ timeout: 5000, force: true }));
      return true;
    }
  }
  return false;
}

async function clickActionInAnyFrame(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    if (await clickFirst([scope.getByRole('button', { name }), scope.getByRole('menuitem', { name }), scope.getByText(name)])) {
      await page.waitForTimeout(900);
      return true;
    }
  }
  return false;
}

async function selectSeriesRow(page: Page) {
  for (const scope of [page, ...page.frames()]) {
    const row = scope.getByRole('row', { name: literalPattern(target.code) }).first();
    if (await row.isVisible({ timeout: 800 }).catch(() => false)) {
      await row.click({ timeout: 5000 }).catch(async () => row.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
    const text = scope.getByText(literalPattern(target.code)).first();
    if (await text.isVisible({ timeout: 800 }).catch(() => false)) {
      await text.click({ timeout: 5000 }).catch(async () => text.click({ timeout: 5000, force: true }));
      await page.waitForTimeout(600);
      return true;
    }
  }
  return false;
}

async function openUCustLines(page: Page) {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeContext(page);
  if (!(await selectSeriesRow(page))) throw new Error('U-CUST row could not be selected.');
  if (!(await clickActionInAnyFrame(page, /^Zeilen$|^Lines$/i))) throw new Error('Zeilen/Lines action could not be opened.');
  await page.waitForTimeout(900);
  await assertSafeContext(page);
}

async function clickDataCellUnderHeader(page: Page, headerPattern: RegExp, rowOffset = 28) {
  const point = await page
    .evaluate(
      ({ source, flags, rowOffset }) => {
        const pattern = new RegExp(source, flags);
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const headers = Array.from(document.querySelectorAll<HTMLElement>('*'))
          .filter(visible)
          .map((element) => ({ element, text: normalize(element.innerText || element.textContent || element.getAttribute('aria-label')) }))
          .filter((entry) => pattern.test(entry.text))
          .map((entry) => ({ rect: entry.element.getBoundingClientRect(), text: entry.text }))
          .filter((entry) => entry.rect.width > 20 && entry.rect.height > 8)
          .sort((left, right) => left.rect.top - right.rect.top || left.rect.left - right.rect.left);
        const header = headers[0];
        if (!header) return null;
        return {
          x: header.rect.left + Math.min(Math.max(header.rect.width / 2, 18), Math.max(header.rect.width - 8, 18)),
          y: header.rect.bottom + rowOffset,
          headerText: header.text
        };
      },
      { source: headerPattern.source, flags: headerPattern.flags, rowOffset }
    )
    .catch(() => null as { x: number; y: number; headerText: string } | null);
  if (!point) return false;
  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(250);
  return true;
}

async function enterValueAtHeader(page: Page, header: RegExp, value: string) {
  if (!(await clickDataCellUnderHeader(page, header))) return false;
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 15 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  return true;
}

test('TARGET-016I uses official Number Series Lines New route for U-CUST only', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  const warnings: string[] = [];
  let setupWriteAttempted = false;
  let routeAttempted = false;

  await openUCustLines(page);
  const before = await captureState(page, 'target-016i-010-u-cust-lines-before', 'Before official Lines New route.');
  const alreadyVisible = before.visible.startingNo && before.visible.endingNo;

  if (!alreadyVisible) {
    if (!(await clickActionInAnyFrame(page, /^Neu$|^New$/i))) {
      blockedBy.push('Scoped Neu/New on Number Series Lines was not visible or not clickable.');
    } else {
      routeAttempted = true;
      setupWriteAttempted = true;
      await page.waitForTimeout(800);
      await assertSafeContext(page);
      await captureState(page, 'target-016i-020-after-lines-new', 'After clicking scoped Neu/New on Number Series Lines.');

      const dateEntered = await enterValueAtHeader(page, /^Startdatum|^Starting Date/i, target.startingDate);
      const startEntered = await enterValueAtHeader(page, /^Startnr\.?|^Starting No\.?/i, target.startingNo);
      const endEntered = await enterValueAtHeader(page, /^Endnr\.?|^Ending No\.?/i, target.endingNo);
      await page.keyboard.press('Enter').catch(() => undefined);
      await page.waitForTimeout(1500);
      if (!dateEntered) blockedBy.push('Startdatum/Starting Date cell was not targetable.');
      if (!startEntered) blockedBy.push('Startnr./Starting No. cell was not targetable.');
      if (!endEntered) blockedBy.push('Endnr./Ending No. cell was not targetable.');
    }
  }

  await assertSafeContext(page);
  const afterWrite = await captureState(page, 'target-016i-030-after-official-route-write', 'After official Lines New value route.', {
    alreadyVisible,
    routeAttempted,
    setupWriteAttempted
  });

  await openUCustLines(page);
  const afterReopen = await captureState(page, 'target-016i-040-after-reopen-proof', 'After reopening U-CUST Lines for persistence proof.', {
    alreadyVisible,
    routeAttempted,
    setupWriteAttempted
  });

  const persisted = afterReopen.visible.startingNo && afterReopen.visible.endingNo;
  if (!persisted) blockedBy.push('U-CUST Startnr./Endnr. target values are not visible after reopen.');

  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted
    ? 'TARGET-016J-NUMBER-SERIES-REMAINING-LINES-OFFICIAL-ROUTE-WRITE-GATE'
    : 'TARGET-016J-NUMBER-SERIES-LINES-TRUE-EDITOR-OR-ASSISTED-SETUP-FALLBACK';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-lines-official-new-route',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'monkey_work',
    selectedModelClass: 'gpt-4-mini-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    targetValues: target,
    proved: [
      'U-CUST Number Series Lines context was opened in playthru / UNIVERSAARL-DE.',
      ...(routeAttempted ? ['Scoped Neu/New was clicked on the Number Series Lines page, not on the header list.'] : []),
      ...(persisted ? ['U-CUST Startnr./Endnr. values are visible after reopening Number Series Lines.'] : []),
      'No setup assignment, master data, preview posting or posting was executed.'
    ],
    notProved: [
      ...(persisted ? ['Only U-CUST was fitted; remaining U-* lines still need their own controlled route.'] : ['The official Lines New route did not yet prove visible persistence for U-CUST.']),
      'No customer/vendor/item/document numbering assignment is proven.',
      'No German legal invoice-number compliance claim is made.',
      'Checkboxes such as Offen or Luecken in Nummern zulassen were observed but not changed.'
    ],
    snapshots: { before, afterWrite, afterReopen },
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016i-number-series-lines-official-new-route-write-gate/TARGET-016I-result.json',
      'playwright/projects/fibu-book5/evidence/target-016i-number-series-lines-official-new-route-write-gate/README.md',
      'playwright/projects/fibu-book5/evidence/target-016i-number-series-lines-official-new-route-write-gate/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016i-number-series-lines-official-new-route-write-gate/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016i-number-series-lines-official-new-route-write-gate/*.txt',
      'playwright/projects/fibu-book5/img/target-016i-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016i-number-series-lines-official-new-route-write-gate/TARGET-016I-result.json',
      'playwright/projects/fibu-book5/img/target-016i-010-u-cust-lines-before.png',
      'playwright/projects/fibu-book5/img/target-016i-020-after-lines-new.png',
      'playwright/projects/fibu-book5/img/target-016i-030-after-official-route-write.png',
      'playwright/projects/fibu-book5/img/target-016i-040-after-reopen-proof.png'
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
      setupChanged: persisted && setupWriteAttempted
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary: 'TARGET-016H selected the Microsoft Learn-backed Number Series Lines route after Personalize/F2/cell routes failed.',
      isPlannedNextCaseStillSensible: true,
      reason: 'This is the first source-backed UI write gate and touches only the U-CUST line context.',
      lookaheadReviewed: [
        { caseId: nextCase, status: persisted ? 'ready-next' : 'needs-ui-discovery-first', reason: persisted ? 'U-CUST line route can be reused for remaining U-* families.' : 'Persistence is not visible after reopen.' },
        { caseId: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT', status: persisted ? 'ready-after-current' : 'needs-setup-first', reason: 'Assignments require line persistence first.' },
        { caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT', status: 'needs-setup-first', reason: 'Customer creation waits for assigned number series and posting setup.' },
        { caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT', status: 'ready-after-current', reason: 'Posting groups follow foundation numbering.' },
        { caseId: 'TARGET-020-VAT-SETUP-READINESS', status: 'ready-after-current', reason: 'VAT setup can proceed after or alongside posting groups.' }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'It scales the proven official route to the remaining Universaarl number-series lines.'
        : 'It avoids repeating failed value entry and forces a true editor/fallback diagnosis.',
      risksBeforeNextCase: [
        'Do not assign setup pages before all required line ranges are visible.',
        'Do not change gap/open checkboxes without their own gate.',
        'Do not create master data yet.'
      ],
      requiredPreparation: ['Review TARGET-016I screenshots and confirm whether U-CUST line persistence is visible.']
    },
    warnings,
    blockedBy,
    requiresReview: !persisted,
    safeToFinalizeState: persisted,
    reason: persisted
      ? 'TARGET-016I proved the official Number Series Lines New route for U-CUST with reopen proof.'
      : 'TARGET-016I did not prove U-CUST Startnr./Endnr. persistence after reopen.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016I Number Series Lines Official New Route',
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
      '- Nur U-CUST wurde geprueft.',
      '- Keine Setup-Zuweisung.',
      '- Keine Stammdaten.',
      '- Keine Preview und keine Buchung.',
      '- Keine Checkbox wurde geaendert.'
    ].join('\n')
  );

  expect(instancePathIsTarget(page.url())).toBeTruthy();
  expect(companyParamIsTarget(page.url())).toBeTruthy();
});
