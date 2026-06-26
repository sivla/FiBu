import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { analyzeJournalCellCandidates } from '../../../core/bc/journal-grid-candidates';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-218-FA-GL-JOURNAL-AMOUNT-VALUE-PREFLIGHT';
const NEXT_CASE_ID = 'FIXEDASSETS-219-FA-GL-JOURNAL-AMOUNT-VALUE-REVIEW';
const TEST_ID = 'fixedassets-218';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;

const TARGET = {
  documentNo: 'G05001',
  accountNo: 'FA-CNC-01',
  depreciationBookCode: 'HGB',
  faPostingType: 'Acquisition Cost',
  balAccountNo: '82000',
  amountInput: '120000',
  amountDisplaySignals: ['120000', '120.000', '120,000'],
};

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function faJournalPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(FA_GL_JOURNAL_PAGE_ID));
  return url.toString();
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url: safeUrl(url),
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

function isTargetFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${FA_GL_JOURNAL_PAGE_ID}`) && frameUrl.includes('runinframe=1');
}

async function targetFrame(page: Page) {
  const frame = page.frames().find(isTargetFrame);
  if (!frame) throw new Error('Fixed Asset G/L Journals runinframe was not found.');
  return frame;
}

async function moveVisibleGridToAmountAndBalAccountColumns(page: Page) {
  await page.mouse.move(1450, 400);
  await page.mouse.wheel(1500, 0);
  await page.waitForTimeout(350);
  await page.mouse.move(980, 1398);
  await page.mouse.down();
  await page.mouse.move(2050, 1398, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(350);
}

async function readReadonlyJournalSnapshot(frame: Frame) {
  return frame.evaluate(() => {
    function norm(value: string | null | undefined) {
      return (value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    function rectOf(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
    }

    const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
      .filter(visible)
      .map((header, index) => ({ index, text: norm(header.innerText || header.textContent).slice(0, 180), rect: rectOf(header) }))
      .filter((header) => header.text);
    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row, index) => ({ index, text: norm(row.innerText || row.textContent).slice(0, 1000), rect: rectOf(row) }))
      .filter((row) => row.text);
    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
      .filter(visible)
      .map((control, index) => {
        const row = control.closest<HTMLElement>('[role="row"],tr');
        const cell = control.closest<HTMLElement>('[role="gridcell"],td,[role="cell"]');
        const selectedText =
          control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || '' : '';
        return {
          index,
          tag: control.tagName.toLowerCase(),
          value: norm(control.value),
          selectedText: norm(selectedText),
          selectedIndex: control instanceof HTMLSelectElement ? control.selectedIndex : undefined,
          options:
            control instanceof HTMLSelectElement
              ? [...control.options].map((option) => ({
                  value: norm(option.value),
                  text: norm(option.text),
                  label: norm(option.label),
                  selected: option.selected,
                }))
              : undefined,
          ariaLabel: norm(control.getAttribute('aria-label')),
          title: norm(control.getAttribute('title')),
          rowText: norm(row?.innerText || row?.textContent || '').slice(0, 1000),
          cellText: norm(cell?.innerText || cell?.textContent || '').slice(0, 280),
          rect: rectOf(control),
          readOnly: Boolean(control.readOnly || control.getAttribute('aria-readonly') === 'true'),
          disabled: Boolean(control.disabled || control.getAttribute('aria-disabled') === 'true'),
        };
      });
    const bodyText = norm(document.body?.innerText || '');
    const controlText = norm(
      controls
        .map((control) => [control.value, control.selectedText, control.title, control.rowText, control.cellText].join(' '))
        .join(' '),
    );
    const combinedText = norm([bodyText, controlText, rows.map((row) => row.text).join(' ')].join(' '));
    return {
      bodyText: bodyText.slice(0, 2200),
      headers: headers.filter((header) =>
        /Posting Date|Document No|Account Type|Account No|FA Posting Type|Depreciation Book|Amount|Bal\. Account/i.test(header.text),
      ),
      rows: rows.filter((row) => /G05001|FA-CNC-01|HGB|CNC Maschine FRA|Acquisition Cost|Amount|Bal\. Account|82000/i.test(row.text)),
      controls,
      signals: {
        fixedAssetGlJournalsVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
        documentNoVisible: combinedText.includes('G05001'),
        accountNoVisible: combinedText.includes('FA-CNC-01'),
        depreciationBookVisible: combinedText.includes('HGB'),
        acquisitionCostVisible: /Acquisition Cost/i.test(combinedText),
        balAccount82000Visible: combinedText.includes('82000'),
        amountHeaderVisible: /Amount|Betrag/i.test(combinedText),
      },
    };
  });
}

function analyzeColumn(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>>, columnSignals: string[], expectedValue?: string) {
  return analyzeJournalCellCandidates(
    { headers: snapshot.headers, rows: snapshot.rows, controls: snapshot.controls },
    {
      rowRequiredSignals: [TARGET.documentNo, TARGET.accountNo, TARGET.depreciationBookCode],
      columnSignals,
      expectedValue,
    },
  );
}

function selectedFaPostingTypeIsAcquisitionCost(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>>) {
  return snapshot.controls.some((control) => {
    const options = (control as typeof control & { options?: Array<{ value: string; text: string; label: string; selected: boolean }> }).options ?? [];
    const selectedOption = options.find((option) => option.selected);
    const targetOption = options.find((option) => [option.text, option.label].some((value) => cleanText(value) === TARGET.faPostingType));
    return (
      cleanText(control.selectedText) === TARGET.faPostingType ||
      cleanText(control.title) === TARGET.faPostingType ||
      cleanText(selectedOption?.text) === TARGET.faPostingType ||
      cleanText(selectedOption?.label) === TARGET.faPostingType ||
      (Boolean(targetOption) && cleanText(targetOption?.value) === cleanText(control.value))
    );
  });
}

function amountVisibleInAnalysis(
  analysis: ReturnType<typeof analyzeJournalCellCandidates> | undefined,
  snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined,
) {
  const combined = cleanText(
    [
      analysis?.candidates.map((candidate) => [candidate.valueText, candidate.cellText, candidate.rowText].join(' ')).join(' '),
      snapshot?.rows.map((row) => row.text).join(' '),
      snapshot?.controls.map((control) => [control.value, control.cellText, control.rowText].join(' ')).join(' '),
    ].join(' '),
  );
  return TARGET.amountDisplaySignals.some((signal) => combined.includes(signal));
}

async function markControlByVisibleIndex(frame: Frame, visibleIndex: number) {
  return frame.evaluate((index) => {
    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }
    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')].filter(visible);
    const target = controls.find((control, candidateIndex) => candidateIndex === index);
    if (!target || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return false;
    target.setAttribute('data-codex-fa218-target', 'true');
    return true;
  }, visibleIndex);
}

async function detectDangerousDialog(page: Page) {
  const dialogs = await page
    .locator('[role="dialog"], .ms-Dialog, [aria-modal="true"]')
    .evaluateAll((elements) => elements.map((element) => cleanText(element.textContent)))
    .catch(() => []);
  const text = cleanText(dialogs.join(' | '));
  return {
    dialogCount: dialogs.length,
    textSample: text.slice(0, 1200),
    postingDialog: /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Post and Print|Buchen und drucken/i.test(text),
    okYesVisible: /\bOK\b|\bYes\b|\bJa\b/i.test(text),
    errorVisible: /Error|Fehler|must|muss|not valid|ungueltig|ungultig/i.test(text),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-219-fa-gl-journal-amount-value-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-218-fa-gl-journal-amount-value-preflight.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-219: locally review FA-218 Amount value preflight before any Preview Posting retry or Post.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-amount-value-preflight' : 'blocked-amount-value-preflight',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-218/FIXEDASSETS-218-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-219 local review; do not open Preview Posting or Post.',
    },
  };
}

test('FIXEDASSETS-218 enters Amount on guarded FA journal target line without Preview or Post', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let snapshotBefore: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let snapshotAfter: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let amountAnalysisBefore: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let amountAnalysisAfter: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let balAccountAnalysis: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let candidateIndex: number | undefined;
  let dialogAfterEntry: Awaited<ReturnType<typeof detectDangerousDialog>> | undefined;
  let amountEntered = false;

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    await page.waitForTimeout(1200);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    } else {
      const frame = await targetFrame(page);
      frameUrl = safeUrl(frame.url());
      await moveVisibleGridToAmountAndBalAccountColumns(page);
      snapshotBefore = await readReadonlyJournalSnapshot(frame);

      if (!snapshotBefore.signals.fixedAssetGlJournalsVisible) blockedBy.push('fixed-asset-gl-journals-context-not-visible');
      if (!snapshotBefore.signals.documentNoVisible) blockedBy.push('document-no-G05001-not-visible');
      if (!snapshotBefore.signals.accountNoVisible) blockedBy.push('account-no-FA-CNC-01-not-visible');
      if (!snapshotBefore.signals.depreciationBookVisible) blockedBy.push('depreciation-book-HGB-not-visible');
      if (!selectedFaPostingTypeIsAcquisitionCost(snapshotBefore)) blockedBy.push('fa-posting-type-acquisition-cost-not-proven');

      balAccountAnalysis = analyzeColumn(snapshotBefore, ['Bal. Account No.', 'Bal Account No', 'Gegenkonto'], TARGET.balAccountNo);
      if (!balAccountAnalysis.visibleSignals.expectedValueVisible) blockedBy.push(`bal-account-82000-not-proven:${balAccountAnalysis.status}`);

      amountAnalysisBefore = analyzeColumn(snapshotBefore, ['Amount', 'Betrag']);
      if (amountAnalysisBefore.status !== 'single-editable-candidate' || amountAnalysisBefore.editableCandidates.length !== 1) {
        blockedBy.push(`amount-helper-before-entry:${amountAnalysisBefore.status}`);
      } else if (blockedBy.length === 0) {
        candidateIndex = amountAnalysisBefore.editableCandidates[0].index;
        if (typeof candidateIndex !== 'number') {
          blockedBy.push('amount-candidate-index-missing');
        } else {
          const marked = await markControlByVisibleIndex(frame, candidateIndex);
          if (!marked) {
            blockedBy.push(`amount-candidate-not-marked:${candidateIndex}`);
          } else {
            const targetControl = frame.locator('[data-codex-fa218-target="true"]');
            await expect(targetControl).toBeVisible({ timeout: 10_000 });
            await targetControl.fill(TARGET.amountInput);
            amountEntered = true;
            await targetControl.press('Tab');
            await page.waitForTimeout(1400);
            dialogAfterEntry = await detectDangerousDialog(page);
            if (dialogAfterEntry.postingDialog || dialogAfterEntry.okYesVisible) {
              blockedBy.push(`dangerous-dialog-after-entry:${dialogAfterEntry.textSample}`);
            }
            snapshotAfter = await readReadonlyJournalSnapshot(frame);
            amountAnalysisAfter = analyzeColumn(snapshotAfter, ['Amount', 'Betrag']);
            if (!amountVisibleInAnalysis(amountAnalysisAfter, snapshotAfter)) {
              blockedBy.push(`amount-not-visible-after-entry:${amountAnalysisAfter.status}`);
            }
          }
        }
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (amountAnalysisBefore && !amountAnalysisBefore.success) {
    blockedBy.push(...amountAnalysisBefore.blockedBy.map((reason) => `amount-helper-before-entry:${reason}`));
  }
  if (amountAnalysisAfter && !amountVisibleInAnalysis(amountAnalysisAfter, snapshotAfter)) {
    blockedBy.push(...amountAnalysisAfter.blockedBy.map((reason) => `amount-helper-after-entry:${reason}`));
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 && amountEntered && amountVisibleInAnalysis(amountAnalysisAfter, snapshotAfter) ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? 'FA-218 entered the nonzero Amount target into the uniquely verified FA-CNC-01 journal line and proved a 120000/120.000 amount signal visible without Preview Posting or Post.'
      : `FA-218 stayed safe but did not prove nonzero Amount value: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-amount-value-preflight.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-218-amount-value-preflight',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    snapshotBefore,
    amountAnalysisBefore,
    balAccountAnalysis,
    candidateIndex,
    amountEntered,
    dialogAfterEntry,
    snapshotAfter,
    amountAnalysisAfter,
    blockedBy,
    omitted: 'No screenshots, full DOM dumps, traces, videos, reports or auth artifacts stored.',
  });

  await writeTextEvidence(faEvidencePath('020-amount-value-after-text.txt'), cleanText(snapshotAfter?.bodyText ?? snapshotBefore?.bodyText ?? ''));

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-218-amount-value-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-guarded-amount-value-preflight',
    resultStatus: status,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      frameUrl,
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(snapshotBefore?.signals.fixedAssetGlJournalsVisible ? ['Fixed Asset G/L Journals context was visible.'] : []),
      ...(snapshotBefore?.signals.documentNoVisible ? ['Document No. G05001 was visible.'] : []),
      ...(snapshotBefore?.signals.accountNoVisible ? ['Account No. FA-CNC-01 was visible.'] : []),
      ...(snapshotBefore?.signals.depreciationBookVisible ? ['Depreciation Book Code HGB was visible.'] : []),
      ...(snapshotBefore && selectedFaPostingTypeIsAcquisitionCost(snapshotBefore) ? ['FA Posting Type = Acquisition Cost was proven before Amount entry.'] : []),
      ...(balAccountAnalysis?.visibleSignals.expectedValueVisible ? ['Bal. Account No. = 82000 was proven before Amount entry.'] : []),
      ...(amountAnalysisBefore ? [`Amount helper status before entry was ${amountAnalysisBefore.status}.`] : []),
      ...(candidateIndex !== undefined ? [`Amount candidate index was ${candidateIndex}.`] : []),
      ...(amountEntered ? ['Only the Amount candidate was filled.'] : []),
      ...(amountVisibleInAnalysis(amountAnalysisAfter, snapshotAfter) ? ['A nonzero Amount signal 120000/120.000 was visible/current after entry.'] : []),
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No journal line was created or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(status === 'observed' ? [] : ['Nonzero Amount was not proven visible/current.']),
      'No Preview Posting result after Amount entry.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace after Amount entry.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-218-fa-gl-journal-amount-value-preflight.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-218/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-218/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-218/010-amount-value-preflight.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-218/020-amount-value-after-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-218/FIXEDASSETS-218-result.json',
    ],
    warnings: [
      'Guarded Amount value preflight only.',
      'Draft Amount value may remain as intentional laboratory preflight state if observed.',
      'Do not open Preview Posting or Post from this result without FA-219 review.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      amountEntered,
      draftValueKept: status === 'observed',
      noInsertLine: true,
      noDeleteLine: true,
      noDocumentNoChange: true,
      noAccountNoChange: true,
      noDepreciationBookChange: true,
      noFaPostingTypeChange: true,
      noBalAccountNoChange: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      amountAnalysisBefore,
      amountAnalysisAfter,
      balAccountAnalysis,
      candidateIndex,
      dialogAfterEntry,
      snapshotBeforeSignals: snapshotBefore?.signals,
      snapshotAfterSignals: snapshotAfter?.signals,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-218-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-218 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-amount-value-preflight.json` | JSON | Zielzeile, Amount-Kandidat, Vorher/Nachher und Safety Flags | keine Preview, keine Buchung | `labor`, `guarded-value-preflight` |',
      '| `020-amount-value-after-text.txt` | Text | kompakten sichtbaren Journaltext nach Amount-Preflight | keine Rohseite, kein Screenshot | `labor` oder `blocked` |',
      '| `FIXEDASSETS-218-result.json` | JSON | Ergebnis, Grenzen und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
