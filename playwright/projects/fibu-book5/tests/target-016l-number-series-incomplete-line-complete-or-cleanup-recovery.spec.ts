import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

import { compactPageText, pageText, requireBcUrl, waitForBusinessCentralShell } from '../../../core/bc-helpers';

test.use({ storageState: 'playwright/.auth/bc-user.json' });

const CASE_ID = 'TARGET-016L-NUMBER-SERIES-INCOMPLETE-LINE-COMPLETE-OR-CLEANUP-RECOVERY';
const EXPECTED_INSTANCE = 'playthru';
const TARGET_COMPANY = 'UNIVERSAARL-DE';
const EVIDENCE_ID = 'target-016l-number-series-incomplete-line-complete-or-cleanup-recovery';
const EVIDENCE_DIR = path.resolve('playwright/projects/fibu-book5/evidence', EVIDENCE_ID);
const IMG_DIR = path.resolve('playwright/projects/fibu-book5/img');
const RESULT_PATH = path.join(EVIDENCE_DIR, 'TARGET-016L-result.json');

const target = {
  code: 'U-CUST',
  startingDate: '01.01.2026',
  startingNo: 'U-CUST00001',
  endingNo: 'U-CUST99999'
};

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
  if (!instancePathIsTarget(url) || !companyParamIsTarget(url)) {
    throw new Error(`Unsafe context: ${sanitizeEvidenceUrl(url)}`);
  }
  const text = await safeText(page);
  if (!/Nummernserie|No\. Series|Nr\.-Serienzeilen|No\. Series Lines/i.test(text)) {
    throw new Error('Number Series context is not visible.');
  }
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

async function selectSeriesRow(page: Page) {
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

async function openUCustLines(page: Page) {
  await page.goto(buildPlaythruUrl().toString(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(1200);
  await assertSafeContext(page);
  if (!(await selectSeriesRow(page))) throw new Error('U-CUST row could not be selected.');
  if (!(await clickAction(page, /^Zeilen$|^Lines$/i))) throw new Error('Zeilen/Lines action could not be opened.');
  await page.waitForTimeout(900);
  await assertSafeContext(page);
}

async function compactSnapshot(page: Page) {
  const text = await safeText(page);
  return {
    compact: await compactPageText(page, {
      include: [/Nr\.-Serienzeilen|Nummernserie|U-CUST|Startdatum|Startnr|Endnr|30\.06|01\.01|U-CUST00001|U-CUST99999|Offen|Luecken|Lücken|Liste bearbeiten|Gespeichert/i],
      maxLines: 180,
      maxLineLength: 220
    }),
    visible: {
      incompleteDateLine: /30\.06\.2026|30\.06\.20/i.test(text) && !literalPattern(target.startingNo).test(text),
      targetStartingDate: /01\.01\.2026|1\/1\/2026|2026-01-01/i.test(text),
      targetStartingNo: literalPattern(target.startingNo).test(text),
      targetEndingNo: literalPattern(target.endingNo).test(text),
      openCheckboxText: /Offen|Open/i.test(text),
      gapCheckboxText: /Luecken|Lücken|Gaps/i.test(text)
    }
  };
}

async function captureState(page: Page, filePrefix: string, step: string, extra: Record<string, unknown> = {}) {
  const snapshot = {
    step,
    url: sanitizeEvidenceUrl(page.url()),
    title: clean(await page.title()),
    ...(await compactSnapshot(page)),
    ...extra
  };
  await writeText(`${filePrefix}.txt`, snapshot.compact || '');
  await writeJson(path.join(EVIDENCE_DIR, `${filePrefix}.snapshot.json`), snapshot);
  await screenshotWithMetadata(page, `${filePrefix}.png`, {
    page: 'Nr.-Serienzeilen / Number Series Lines',
    step,
    visibleLearning:
      'Der Screenshot zeigt, ob die bestehende U-CUST-Zeile unvollstaendig bleibt oder mit Startnr./Endnr. sichtbar vervollstaendigt wurde.',
    importantUi: ['Startdatum', 'Startnr.', 'Endnr.', 'Offen', 'Luecken in Nummern zulassen'],
    internallyProves: 'Recovery state for U-CUST Number Series Lines in playthru / UNIVERSAARL-DE.',
    doesNotProve: ['No setup assignment.', 'No master data.', 'No preview posting.', 'No posting.'],
    qualityDecision: 'recovery-evidence',
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

async function clickByPoint(page: Page, x: number, y: number) {
  await page.mouse.move(x, y);
  await page.waitForTimeout(150);
  await page.mouse.click(x, y);
  await page.waitForTimeout(350);
  return activeEditor(page);
}

async function fillActiveEditor(page: Page, value: string) {
  await page.keyboard.press('Control+A').catch(() => undefined);
  await page.keyboard.type(value, { delay: 20 });
  await page.keyboard.press('Tab');
  await page.waitForTimeout(600);
}

test('TARGET-016L completes the existing incomplete U-CUST line or documents recovery blocker', async ({ page }) => {
  await page.setViewportSize({ width: 2200, height: 1300 });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  const blockedBy: string[] = [];
  const recoveryLog: Array<Record<string, unknown>> = [];
  let setupWriteAttempted = false;
  let setupChanged = false;

  await openUCustLines(page);
  const before = await captureState(page, 'target-016l-010-before-recovery', 'Before recovery of existing incomplete U-CUST line.');

  if (!before.visible.incompleteDateLine && before.visible.targetStartingNo && before.visible.targetEndingNo) {
    setupChanged = false;
    recoveryLog.push({ step: 'already-complete', result: 'U-CUST line already has target start/end values.' });
  } else {
    const editListClicked = await clickAction(page, /^Liste bearbeiten$|^Edit List$/i);
    recoveryLog.push({ step: 'edit-list', editListClicked });
    await assertSafeContext(page);
    await captureState(page, 'target-016l-020-after-edit-list', 'After Edit List before value recovery.', { editListClicked });

    const dateEditor = await clickByPoint(page, 682, 246);
    recoveryLog.push({ step: 'date-editor', editor: dateEditor });
    if (dateEditor?.isEditable) {
      setupWriteAttempted = true;
      await fillActiveEditor(page, target.startingDate);
    } else {
      blockedBy.push('Startdatum editor was not active/editable at the known recovery point.');
    }

    const startEditor = await activeEditor(page);
    recoveryLog.push({ step: 'after-date-tab-active-editor', editor: startEditor });
    if (startEditor?.isEditable) {
      setupWriteAttempted = true;
      await fillActiveEditor(page, target.startingNo);
    } else {
      const fallbackStart = await clickByPoint(page, 822, 246);
      recoveryLog.push({ step: 'startnr-fallback-point', editor: fallbackStart });
      if (fallbackStart?.isEditable) {
        setupWriteAttempted = true;
        await fillActiveEditor(page, target.startingNo);
      } else {
        blockedBy.push('Startnr. editor was not active/editable after date field or fallback point.');
      }
    }

    const endEditor = await activeEditor(page);
    recoveryLog.push({ step: 'after-startnr-tab-active-editor', editor: endEditor });
    if (endEditor?.isEditable) {
      setupWriteAttempted = true;
      await fillActiveEditor(page, target.endingNo);
      await page.keyboard.press('Enter').catch(() => undefined);
      await page.waitForTimeout(1500);
    } else {
      blockedBy.push('Endnr. editor was not active/editable after tabbing from Startnr.; no blind coordinate retry was attempted.');
    }
  }

  await assertSafeContext(page);
  const afterAttempt = await captureState(page, 'target-016l-030-after-recovery-attempt', 'After guarded completion attempt.', {
    setupWriteAttempted,
    recoveryLog
  });

  await openUCustLines(page);
  const afterReopen = await captureState(page, 'target-016l-040-after-reopen-proof', 'After reopening U-CUST Lines for recovery proof.', {
    setupWriteAttempted,
    recoveryLog
  });

  const persisted = afterReopen.visible.targetStartingNo && afterReopen.visible.targetEndingNo;
  setupChanged = setupWriteAttempted && persisted;
  if (setupWriteAttempted && !persisted) blockedBy.push('U-CUST target Startnr./Endnr. are not both visible after reopen.');
  if (afterReopen.visible.incompleteDateLine && !persisted) blockedBy.push('Incomplete date-only line is still visible after recovery attempt.');

  const resultStatus = persisted ? 'observed' : 'blocked';
  const nextCase = persisted
    ? 'TARGET-016M-NUMBER-SERIES-REMAINING-LINES-CONTROLLED-FIT'
    : 'TARGET-016M-NUMBER-SERIES-ASSISTED-SETUP-OR-CONFIG-PACKAGE-FALLBACK';

  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId: CASE_ID,
    source: 'playwright-number-series-incomplete-line-recovery',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: TARGET_COMPANY,
    url: sanitizeEvidenceUrl(page.url()),
    targetValues: target,
    proved: [
      'U-CUST Number Series Lines context was opened in playthru / UNIVERSAARL-DE.',
      ...(setupWriteAttempted ? ['The existing U-CUST line was edited through visible active editors, not by creating a second line.'] : []),
      ...(persisted ? ['U-CUST00001 and U-CUST99999 are visible after reopening Number Series Lines.'] : []),
      'No number-series assignment, master data, preview posting or posting was executed.',
      'No Allow Gaps/Open checkbox was intentionally changed.'
    ],
    notProved: [
      ...(persisted ? ['Only U-CUST is fitted; remaining U-* lines still need controlled execution.'] : ['A clean U-CUST Number Series Lines completion is still not proven.']),
      'No customer/vendor/item/document numbering assignment is proven.',
      'No German legal invoice-number compliance claim is made.'
    ],
    snapshots: { before, afterAttempt, afterReopen },
    recoveryLog,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/target-016l-number-series-incomplete-line-complete-or-cleanup-recovery/TARGET-016L-result.json',
      'playwright/projects/fibu-book5/evidence/target-016l-number-series-incomplete-line-complete-or-cleanup-recovery/README.md',
      'playwright/projects/fibu-book5/evidence/target-016l-number-series-incomplete-line-complete-or-cleanup-recovery/*.snapshot.json',
      'playwright/projects/fibu-book5/evidence/target-016l-number-series-incomplete-line-complete-or-cleanup-recovery/*.screenshot.json',
      'playwright/projects/fibu-book5/evidence/target-016l-number-series-incomplete-line-complete-or-cleanup-recovery/*.txt',
      'playwright/projects/fibu-book5/img/target-016l-*.png'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/target-016l-number-series-incomplete-line-complete-or-cleanup-recovery/TARGET-016L-result.json',
      'playwright/projects/fibu-book5/img/target-016l-010-before-recovery.png',
      'playwright/projects/fibu-book5/img/target-016l-020-after-edit-list.png',
      'playwright/projects/fibu-book5/img/target-016l-030-after-recovery-attempt.png',
      'playwright/projects/fibu-book5/img/target-016l-040-after-reopen-proof.png'
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
      setupChanged
    },
    smartDecisionCard: {
      currentCase: CASE_ID,
      plannedNextCaseBeforeReview: CASE_ID,
      lastEvidenceSummary:
        'TARGET-016J created a persistent incomplete U-CUST line; TARGET-016K showed toolbar Delete without visible confirmation did not clean it.',
      isPlannedNextCaseStillSensible: true,
      reason: 'The incomplete line must be completed or cleaned before number-series assignment or master data.',
      lookaheadReviewed: [
        {
          caseId: nextCase,
          status: persisted ? 'ready-next' : 'ready-after-current',
          reason: persisted
            ? 'U-CUST is now fitted; remaining U-* lines can use the same guarded active-editor flow.'
            : 'A fallback route is needed because direct completion did not produce visible persistence.'
        },
        {
          caseId: 'TARGET-017-NUMBER-SERIES-SETUP-ASSIGNMENT',
          status: persisted ? 'ready-after-current' : 'needs-setup-first',
          reason: 'Setup assignment requires valid line ranges.'
        },
        {
          caseId: 'TARGET-018-CUSTOMER-MASTERDATA-PREFLIGHT',
          status: 'needs-setup-first',
          reason: 'Master data waits for numbering, posting groups, VAT and dimensions.'
        },
        {
          caseId: 'TARGET-019-POSTING-GROUPS-PREFLIGHT',
          status: 'ready-after-current',
          reason: 'Posting groups can progress after numbering is either completed or consciously parked.'
        },
        {
          caseId: 'TARGET-020-VAT-SETUP-READINESS',
          status: 'ready-after-current',
          reason: 'VAT setup remains a foundation dependency after or parallel to numbering.'
        }
      ],
      queueChangesMade: [],
      selectedNextCase: nextCase,
      whySelectedNextCaseIsBest: persisted
        ? 'It scales a now-proven line completion route to the remaining number-series codes.'
        : 'It avoids repeating direct grid completion and moves to a source-backed fallback.',
      risksBeforeNextCase: [
        'Do not assign setup pages before all required lines are valid.',
        'Do not create master data yet.',
        'Do not change checkbox values without a separate gate.'
      ],
      requiredPreparation: persisted
        ? ['Prepare target ranges for remaining U-* number-series lines.']
        : ['Use screenshot QA and source-backed fallback; consider manual cleanup if UI route remains blocked.']
    },
    blockedBy,
    requiresReview: !persisted,
    safeToFinalizeState: persisted,
    reason: persisted
      ? 'TARGET-016L completed the existing incomplete U-CUST Number Series Line with visible reopen proof.'
      : 'TARGET-016L did not prove completion or cleanup of the incomplete U-CUST Number Series Line.'
  };

  await writeJson(RESULT_PATH, result);
  await writeText(
    'README.md',
    [
      '# TARGET-016L Number Series Incomplete Line Recovery',
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
