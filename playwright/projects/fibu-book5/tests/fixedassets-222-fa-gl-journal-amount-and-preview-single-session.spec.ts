import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { analyzeJournalCellCandidates } from '../../../core/bc/journal-grid-candidates';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-222-FA-GL-JOURNAL-AMOUNT-AND-PREVIEW-SINGLE-SESSION';
const NEXT_CASE_ID = 'FIXEDASSETS-223-FA-GL-JOURNAL-AMOUNT-AND-PREVIEW-REVIEW';
const NEXT_CASE_FILE = '.agent/state/cases/fixedassets-223-fa-gl-journal-amount-and-preview-review.json';
const TEST_ID = 'fixedassets-222';
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

type ActionEntry = {
  index: number;
  tagName: string;
  role: string;
  text: string;
  ariaLabel: string;
  title: string;
  disabled?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(260_000);

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

function safeEvidenceText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe/i.test(line))
    .join('\n');
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
      .map((row, index) => ({ index, text: norm(row.innerText || row.textContent).slice(0, 900), rect: rectOf(row) }))
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
          rowText: norm(row?.innerText || row?.textContent || '').slice(0, 900),
          cellText: norm(cell?.innerText || cell?.textContent || '').slice(0, 260),
          rect: rectOf(control),
          readOnly: Boolean(control.readOnly || control.getAttribute('aria-readonly') === 'true'),
          disabled: Boolean(control.disabled || control.getAttribute('aria-disabled') === 'true'),
        };
      });

    const bodyText = norm(document.body?.innerText || '');
    return {
      bodyText: bodyText.slice(0, 1800),
      headers: headers.filter((header) => /Posting Date|Document No|Account Type|Account No|FA Posting Type|Depreciation Book|Amount|Bal\. Account/i.test(header.text)),
      rows: rows.filter((row) => /G05001|FA-CNC-01|HGB|CNC Maschine FRA|Acquisition Cost|Amount|Bal\. Account|82000/i.test(row.text)),
      controls,
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

function amountVisibleInSnapshot(
  snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined,
  analysis?: ReturnType<typeof analyzeJournalCellCandidates>,
) {
  const combined = cleanText(
    [
      snapshot?.bodyText,
      snapshot?.rows.map((row) => row.text).join(' '),
      snapshot?.controls.map((control) => [control.value, control.cellText, control.rowText].join(' ')).join(' '),
      analysis?.candidates.map((candidate) => [candidate.valueText, candidate.cellText, candidate.rowText].join(' ')).join(' '),
    ].join(' '),
  );
  return TARGET.amountDisplaySignals.some((signal) => combined.includes(signal));
}

function compactJournalSnapshot(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined) {
  if (!snapshot) return undefined;
  const relevantControls = snapshot.controls
    .filter((control) =>
      /G05001|FA-CNC-01|HGB|Acquisition Cost|82000|120\.000|120000|0,00|Fixed Asset|G\/L Account/i.test(
        [control.value, control.selectedText, control.title, control.cellText].join(' '),
      ),
    )
    .map((control) => ({
      index: control.index,
      tag: control.tag,
      value: control.value,
      selectedText: control.selectedText,
      title: control.title,
      readOnly: control.readOnly,
      disabled: control.disabled,
    }));
  return {
    bodySignals: {
      fixedAssetGlJournalsVisible: /Fixed Asset G\/L Journals/i.test(snapshot.bodyText),
      postingPreviewVisible: /Posting Preview|Buchungsvorschau/i.test(snapshot.bodyText),
      amountHeaderVisible: /Amount|Betrag/i.test(snapshot.bodyText),
    },
    headers: snapshot.headers.map((header) => ({ text: header.text, rect: header.rect })),
    targetRows: snapshot.rows.map((row) => ({ index: row.index, text: row.text.slice(0, 360) })),
    relevantControls,
  };
}

function compactCandidateAnalysis(analysis: ReturnType<typeof analyzeJournalCellCandidates> | undefined) {
  if (!analysis) return undefined;
  return {
    success: analysis.success,
    status: analysis.status,
    blockedBy: analysis.blockedBy,
    visibleSignals: analysis.visibleSignals,
    selectedCandidates: analysis.candidates.slice(0, 3).map((candidate) => ({
      index: candidate.index,
      score: candidate.score,
      reason: candidate.reason,
      valueText: candidate.valueText,
      readOnly: candidate.readOnly,
      disabled: candidate.disabled,
    })),
  };
}

function compactPreviewDomInventory(domInventory: Awaited<ReturnType<typeof capturePreviewDomInventory>> | undefined) {
  if (!domInventory) return undefined;
  return {
    pageTitle: domInventory.pageTitle,
    signals: domInventory.signals,
    frames: domInventory.frames
      .filter((frame) => frame.elements.length || /Posting Preview|G\/L Entry|FA Ledger Entry/i.test(frame.bodyTextSample))
      .map((frame) => ({
        frameIndex: frame.frameIndex,
        frameUrl: frame.frameUrl,
        pageTitle: frame.pageTitle,
        bodyTextSample: frame.bodyTextSample.slice(0, 500),
        elements: frame.elements.slice(0, 20).map((element) => ({
          tagName: element.tagName,
          role: element.role,
          text: element.text.slice(0, 180),
          ariaLabel: element.ariaLabel,
          title: element.title,
        })),
      })),
  };
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
    target.setAttribute('data-codex-fa222-target', 'true');
    return true;
  }, visibleIndex);
}

async function actionInventory(scope: Page | Frame) {
  return scope.evaluate(() => {
    function norm(value: string | null | undefined) {
      return (value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="menuitem"],[role="menuitemcheckbox"],a,[aria-label],[title]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tagName: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          text: norm(element.innerText || element.textContent),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          disabled: Boolean((element as HTMLButtonElement).disabled || element.getAttribute('aria-disabled') === 'true'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => [entry.text, entry.ariaLabel, entry.title].some(Boolean))
      .slice(0, 360);
  });
}

function joined(entry: ActionEntry) {
  return cleanText([entry.text, entry.ariaLabel, entry.title].filter(Boolean).join(' | '));
}

function previewCandidates(actions: ActionEntry[]) {
  return actions.filter((entry) => {
    const label = joined(entry);
    return (
      entry.tagName === 'button' &&
      /menuitem/i.test(entry.role) &&
      entry.text === 'Preview Posting' &&
      entry.ariaLabel === 'Preview Posting' &&
      /Review the different types of entries/i.test(label) &&
      !entry.disabled
    );
  });
}

async function findRelatedPostSplitButton(frame: Frame) {
  const candidates = await frame.evaluate(() => {
    function norm(value: string | null | undefined) {
      return (value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    return [...document.querySelectorAll<HTMLElement>('button,[aria-label],[title]')]
      .filter(visible)
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          index,
          tagName: element.tagName.toLowerCase(),
          text: norm(element.innerText || element.textContent),
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          disabled: Boolean((element as HTMLButtonElement).disabled || element.getAttribute('aria-disabled') === 'true'),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((entry) => /Verwandte Aktionen.*Post|Related Actions.*Post|Related actions.*Post/i.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
      .filter((entry) => entry.width <= 48 && entry.height <= 48);
  });
  return { candidates, selected: candidates.length === 1 ? candidates[0] : null };
}

async function clickRelatedPostSplitButtonOnly(frame: Frame, candidate: NonNullable<Awaited<ReturnType<typeof findRelatedPostSplitButton>>['selected']>) {
  await frame.evaluate((entry) => {
    function norm(value: string | null | undefined) {
      return (value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const target = [...document.querySelectorAll<HTMLElement>('button,[aria-label],[title]')].find((element) => {
      const rect = element.getBoundingClientRect();
      const label = `${norm(element.innerText || element.textContent)} ${norm(element.getAttribute('aria-label'))} ${norm(element.getAttribute('title'))}`;
      return (
        /Verwandte Aktionen.*Post|Related Actions.*Post|Related actions.*Post/i.test(label) &&
        Math.round(rect.x) === entry.x &&
        Math.round(rect.y) === entry.y &&
        Math.round(rect.width) === entry.width &&
        Math.round(rect.height) === entry.height
      );
    });
    if (!target) throw new Error('Related-actions-for-Post split button disappeared before click.');
    target.click();
  }, candidate);
}

async function clickExactPreviewPostingMenuitem(frame: Frame, candidate: ActionEntry) {
  await frame.evaluate((entry) => {
    function norm(value: string | null | undefined) {
      return (value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    const target = [...document.querySelectorAll<HTMLElement>('button[role="menuitem"]')].filter(visible).find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        norm(element.innerText || element.textContent) === 'Preview Posting' &&
        norm(element.getAttribute('aria-label')) === 'Preview Posting' &&
        /Review the different types of entries/i.test(norm(element.getAttribute('title'))) &&
        Math.round(rect.x) === entry.x &&
        Math.round(rect.y) === entry.y &&
        Math.round(rect.width) === entry.width &&
        Math.round(rect.height) === entry.height
      );
    });
    if (!target) throw new Error('Exact Preview Posting menuitem disappeared before click.');
    target.click();
  }, candidate);
}

async function detectDialog(page: Page) {
  const dialogs = await page
    .locator('[role="dialog"], .ms-Dialog, [aria-modal="true"]')
    .evaluateAll((elements) => elements.map((element) => cleanText(element.textContent)))
    .catch(() => []);
  const text = cleanText(dialogs.join(' | '));
  return {
    dialogCount: dialogs.length,
    textSample: text.slice(0, 1600),
    postingDialog: /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Post and Print|Buchen und drucken/i.test(text),
    okYesVisible: /\bOK\b|\bYes\b|\bJa\b/i.test(text),
    previewOrErrorDialog: /Posting Preview|Buchungsvorschau|Preview Posting|Error Messages|Fehlermeldungen|G\/L Entry|FA Ledger Entry|Anlagenposten/i.test(text),
  };
}

async function capturePreviewContext(page: Page) {
  const fullText = await pageText(page);
  const compactText = await compactPageText(page, {
    include: [
      /Posting Preview|Buchungsvorschau|Preview Posting|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i,
      /Error Messages|Fehlermeldungen|must have a value|does not exist|missing|fehlt|nicht vorhanden|nichts zu buchen|nothing to post|FA Posting Type/i,
      /Post and Print|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|OK|Yes|Ja/i,
    ],
    maxLines: 240,
    maxLineLength: 260,
  });
  return {
    url: safeUrl(page.url()),
    previewEntriesVisible: /Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i.test(fullText),
    errorMessagesVisible: /Error Messages|Fehlermeldungen/i.test(fullText),
    compactText: safeEvidenceText(compactText),
  };
}

async function capturePreviewDomInventory(page: Page) {
  const frameInventories = await Promise.all(
    page.frames().map(async (frame, frameIndex) => {
      const frameUrl = safeUrl(frame.url());
      const inventory = await frame
        .evaluate(() => {
          function norm(value: string | null | undefined) {
            return (value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
          }

          function visible(element: HTMLElement) {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          }

          const interesting = /Posting Preview|Buchungsvorschau|G\/L Entry(?:\s+\d+)?|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i;
          const elements = [...document.querySelectorAll<HTMLElement>('body *')]
            .filter(visible)
            .map((element, index) => {
              const rect = element.getBoundingClientRect();
              return {
                index,
                tagName: element.tagName.toLowerCase(),
                role: element.getAttribute('role') || '',
                text: norm(element.innerText || element.textContent).slice(0, 500),
                ariaLabel: norm(element.getAttribute('aria-label')),
                title: norm(element.getAttribute('title')),
                rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
              };
            })
            .filter((entry) => interesting.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
            .slice(0, 120);
          return {
            pageTitle: document.title,
            bodyTextSample: norm(document.body?.innerText || document.body?.textContent || '').slice(0, 1200),
            elements,
          };
        })
        .catch((error) => ({ pageTitle: '', bodyTextSample: '', elements: [], error: error instanceof Error ? error.message : String(error) }));
      return { frameIndex, frameUrl, ...inventory };
    }),
  );
  const allSignalText = frameInventories
    .flatMap((frame) => [frame.pageTitle, frame.bodyTextSample, ...frame.elements.map((entry) => `${entry.text} ${entry.ariaLabel} ${entry.title}`)])
    .join(' ');
  return {
    pageTitle: frameInventories.map((frame) => frame.pageTitle).filter(Boolean).join(' | '),
    frames: frameInventories,
    signals: {
      postingPreviewTitleVisible: /Posting Preview|Buchungsvorschau/i.test(allSignalText),
      glEntryLabelVisible: /G\/L Entry(?:\s+\d+)?|Sachposten/i.test(allSignalText),
      faLedgerEntryLabelVisible: /FA Ledger Entry|Anlagenposten/i.test(allSignalText),
      valueEntryLabelVisible: /Value Entry|Wertposten/i.test(allSignalText),
    },
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: NEXT_CASE_FILE,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-222-fa-gl-journal-amount-and-preview-single-session.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-223: locally review FA-222 single-session Amount-and-Preview result before any posting decision.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-amount-and-preview-single-session' : 'blocked-amount-and-preview-single-session',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-222/FIXEDASSETS-222-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-223 local review; do not post.',
    },
  };
}

test('FIXEDASSETS-222 sets Amount and opens only Preview Posting in one guarded session', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let snapshotBefore: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let snapshotAfterAmount: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let amountAnalysisBefore: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let amountAnalysisAfter: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let balAccountAnalysis: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let candidateIndex: number | undefined;
  let faPostingTypeStillAcquisitionCost = false;
  let amountEntered = false;
  let amountVisibleBeforePreview = false;
  let balAccountVisibleBeforePreview = false;
  let buttonDiscovery: Awaited<ReturnType<typeof findRelatedPostSplitButton>> | undefined;
  let menuBeforePreview: ActionEntry[] = [];
  let previewCandidateList: ActionEntry[] = [];
  let clickedSplitButton = false;
  let clickedPreviewPosting = false;
  let dialogAfterAmount: Awaited<ReturnType<typeof detectDialog>> | undefined;
  let dialogAfterPreview: Awaited<ReturnType<typeof detectDialog>> | undefined;
  let previewContext: Awaited<ReturnType<typeof capturePreviewContext>> | undefined;
  let domInventory: Awaited<ReturnType<typeof capturePreviewDomInventory>> | undefined;

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    await page.waitForTimeout(1400);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    } else {
      const frame = await targetFrame(page);
      frameUrl = safeUrl(frame.url());
      await moveVisibleGridToAmountAndBalAccountColumns(page);
      snapshotBefore = await readReadonlyJournalSnapshot(frame);

      const visibleTargetText = cleanText([
        snapshotBefore.bodyText,
        snapshotBefore.rows.map((row) => row.text).join(' '),
        snapshotBefore.controls.map((control) => [control.value, control.selectedText, control.title, control.cellText, control.rowText].join(' ')).join(' '),
      ].join(' '));

      if (!visibleTargetText.includes('Fixed Asset G/L Journals')) blockedBy.push('fixed-asset-gl-journals-context-not-visible');
      if (!visibleTargetText.includes(TARGET.documentNo)) {
        blockedBy.push('document-no-G05001-not-visible');
      }
      if (!visibleTargetText.includes(TARGET.accountNo)) {
        blockedBy.push('account-no-FA-CNC-01-not-visible');
      }
      if (!visibleTargetText.includes(TARGET.depreciationBookCode)) {
        blockedBy.push('depreciation-book-HGB-not-visible');
      }

      faPostingTypeStillAcquisitionCost = selectedFaPostingTypeIsAcquisitionCost(snapshotBefore);
      if (!faPostingTypeStillAcquisitionCost) blockedBy.push('fa-posting-type-acquisition-cost-not-proven');

      balAccountAnalysis = analyzeColumn(snapshotBefore, ['Bal. Account No.', 'Bal Account No', 'Gegenkonto'], TARGET.balAccountNo);
      balAccountVisibleBeforePreview = balAccountAnalysis.visibleSignals.expectedValueVisible;
      if (!balAccountVisibleBeforePreview) blockedBy.push(`bal-account-82000-not-proven:${balAccountAnalysis.status}`);

      amountAnalysisBefore = analyzeColumn(snapshotBefore, ['Amount', 'Betrag']);
      if (amountAnalysisBefore.status !== 'single-editable-candidate' || amountAnalysisBefore.editableCandidates.length !== 1) {
        blockedBy.push(`amount-helper-before-entry:${amountAnalysisBefore.status}`);
      }

      if (blockedBy.length === 0) {
        candidateIndex = amountAnalysisBefore.editableCandidates[0].index;
        const marked = await markControlByVisibleIndex(frame, candidateIndex);
        if (!marked) {
          blockedBy.push(`amount-candidate-not-marked:${candidateIndex}`);
        } else {
          const targetControl = frame.locator('[data-codex-fa222-target="true"]');
          await expect(targetControl).toBeVisible({ timeout: 10_000 });
          await targetControl.fill(TARGET.amountInput);
          amountEntered = true;
          await targetControl.press('Tab');
          await page.waitForTimeout(1400);
          dialogAfterAmount = await detectDialog(page);
          if (dialogAfterAmount.postingDialog || dialogAfterAmount.okYesVisible) {
            blockedBy.push(`dangerous-dialog-after-amount:${dialogAfterAmount.textSample}`);
          }
          snapshotAfterAmount = await readReadonlyJournalSnapshot(frame);
          amountAnalysisAfter = analyzeColumn(snapshotAfterAmount, ['Amount', 'Betrag']);
          amountVisibleBeforePreview = amountVisibleInSnapshot(snapshotAfterAmount, amountAnalysisAfter);
          if (!amountVisibleBeforePreview) blockedBy.push(`amount-not-visible-current-before-preview:${amountAnalysisAfter.status}`);
        }
      }

      if (blockedBy.length === 0 && amountVisibleBeforePreview) {
        buttonDiscovery = await findRelatedPostSplitButton(frame);
        if (!buttonDiscovery.selected) {
          blockedBy.push(`Related-actions-for-Post split button count was ${buttonDiscovery.candidates.length}, expected 1.`);
        } else {
          await clickRelatedPostSplitButtonOnly(frame, buttonDiscovery.selected);
          clickedSplitButton = true;
          await page.waitForTimeout(900);
          menuBeforePreview = await actionInventory(frame);
          previewCandidateList = previewCandidates(menuBeforePreview);
          if (previewCandidateList.length !== 1) {
            blockedBy.push(`Preview Posting menuitem count was ${previewCandidateList.length}, expected 1.`);
          } else {
            await clickExactPreviewPostingMenuitem(frame, previewCandidateList[0]);
            clickedPreviewPosting = true;
            for (const delay of [500, 1000, 1800]) {
              await page.waitForTimeout(delay);
              previewContext = await capturePreviewContext(page);
              if (previewContext.previewEntriesVisible || previewContext.errorMessagesVisible) break;
            }
            dialogAfterPreview = await detectDialog(page);
            if (dialogAfterPreview.postingDialog) blockedBy.push('Posting dialog appeared after clicking exact Preview Posting menuitem.');
            if (dialogAfterPreview.okYesVisible && !dialogAfterPreview.previewOrErrorDialog) {
              blockedBy.push('OK/Yes dialog appeared without clear Preview/Error context.');
            }
            if (!previewContext?.previewEntriesVisible && !previewContext?.errorMessagesVisible && !dialogAfterPreview.previewOrErrorDialog) {
              blockedBy.push('No Preview Posting entries or Error Messages context became visible.');
            }
            if (previewContext?.previewEntriesVisible) {
              domInventory = await capturePreviewDomInventory(page);
            }
          }
        }
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  } finally {
    await page.keyboard.press('Escape').catch(() => undefined);
  }

  const domSignals = domInventory?.signals;
  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-222 set Amount and captured Preview Posting in one guarded session; G/L Entry visible=${domSignals?.glEntryLabelVisible}; FA Ledger Entry visible=${domSignals?.faLedgerEntryLabelVisible}.`
      : `FA-222 stayed safe but did not complete single-session Amount-and-Preview: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-amount-and-preview-single-session.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-222-amount-and-preview-single-session',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    preflight: {
      snapshotBefore: compactJournalSnapshot(snapshotBefore),
      amountAnalysisBefore: compactCandidateAnalysis(amountAnalysisBefore),
      balAccountAnalysis: compactCandidateAnalysis(balAccountAnalysis),
      faPostingTypeStillAcquisitionCost,
    },
    amountStep: {
      candidateIndex,
      amountEntered,
      dialogAfterAmount,
      snapshotAfterAmount: compactJournalSnapshot(snapshotAfterAmount),
      amountAnalysisAfter: compactCandidateAnalysis(amountAnalysisAfter),
      amountVisibleBeforePreview,
    },
    previewRoute: {
      buttonDiscovery,
      clickedSplitButton,
      previewCandidateCount: previewCandidateList.length,
      previewCandidates: previewCandidateList,
      clickedPreviewPosting,
    },
    dialogAfterPreview,
    previewContext,
    domInventory: compactPreviewDomInventory(domInventory),
    safety: {
      clickedSplitButton,
      clickedExactPreviewPostingMenuitem: clickedPreviewPosting,
      clickedPreviewEntryGroup: false,
      clickedMainPostButton: false,
      clickedPostMenuitem: false,
      clickedPostAndPrintMenuitem: false,
      clickedOkOrYes: false,
      posted: false,
      setupChanged: false,
      companySwitched: false,
      apiShortcutUsed: false,
      bookChanged: false,
    },
    blockedBy,
  });

  await writeTextEvidence(
    faEvidencePath('020-amount-and-preview-single-session-text.txt'),
    previewContext?.compactText || cleanText(snapshotAfterAmount?.bodyText ?? snapshotBefore?.bodyText ?? 'No compact Preview Posting text was captured.'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-222-amount-and-preview-single-session-result',
    caseId: CASE_ID,
    source: 'playwright-guarded-amount-and-preview-single-session',
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
      ...(faPostingTypeStillAcquisitionCost ? ['FA Posting Type = Acquisition Cost was proven before Amount and Preview.'] : []),
      ...(balAccountVisibleBeforePreview ? ['Bal. Account No. = 82000 was proven before Amount and Preview.'] : []),
      ...(amountEntered ? ['Only the Amount candidate was filled.'] : []),
      ...(amountVisibleBeforePreview ? ['Amount 120000/120.000 was visible/current before Preview Posting in the same session.'] : []),
      ...(clickedSplitButton ? ['Only the related-actions-for-Post split/dropdown button was clicked before Preview Posting.'] : []),
      ...(previewCandidateList.length === 1 ? ['Exactly one exact Preview Posting menuitem candidate was found.'] : []),
      ...(clickedPreviewPosting ? ['Only the exact Preview Posting menuitem was clicked once.'] : []),
      ...(previewContext?.previewEntriesVisible ? ['Preview Posting entry context became visible.'] : []),
      ...(previewContext?.errorMessagesVisible ? ['Error Messages context became visible after Preview Posting.'] : []),
      ...(domSignals?.postingPreviewTitleVisible ? ['DOM inventory captured the Posting Preview title/context.'] : []),
      ...(domSignals?.glEntryLabelVisible ? ['DOM inventory captured a G/L Entry label.'] : []),
      ...(domSignals?.faLedgerEntryLabelVisible ? ['DOM inventory captured an FA Ledger Entry label.'] : []),
      'No Preview entry group was clicked.',
      'No main Post button was clicked.',
      'No Post menuitem was clicked.',
      'No Post and Print menuitem was clicked.',
      'No OK/Yes confirmation was clicked.',
      'No journal line was created or deleted.',
      'No non-Amount journal field was changed.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(status === 'observed' ? [] : ['Single-session Amount-and-Preview did not complete.']),
      'No Preview entry group detail page was opened.',
      'No G/L Entry account or amount details were proven.',
      'No FA Ledger Entry fixed asset or amount details were proven.',
      'No Fixed Asset G/L Journal posting was executed.',
      'No posted FA Ledger Entry or posted G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-222-fa-gl-journal-amount-and-preview-single-session.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-222/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-222/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-222/010-amount-and-preview-single-session.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-222/020-amount-and-preview-single-session-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-222/FIXEDASSETS-222-result.json',
    ],
    warnings: [
      'Preview Posting-only. Do not treat as posting permission.',
      'No Preview entry group was clicked in this case.',
      'Posting remains locked until local review.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      amountEntered,
      amountVisibleBeforePreview,
      clickedSplitButton,
      clickedPreviewPosting,
      clickedPreviewEntryGroup: false,
      faPostingTypeStillAcquisitionCost,
      balAccountVisibleBeforePreview,
      domSignals,
      noMainPostClick: true,
      noPostMenuitemClick: true,
      noPostAndPrintClick: true,
      noInsertLine: true,
      noDeleteLine: true,
      noNonAmountJournalEdit: true,
      amountOnlyJournalEdit: amountEntered,
      noPost: true,
      noOkYesConfirmation: true,
      previewOnly: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      candidateIndex,
      dialogAfterAmount,
      dialogAfterPreview,
      previewContextSummary: {
        url: previewContext?.url,
        previewEntriesVisible: previewContext?.previewEntriesVisible,
        errorMessagesVisible: previewContext?.errorMessagesVisible,
      },
      domSignals,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-222-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-222 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-amount-and-preview-single-session.json` | JSON | Amount-Setzung und exakten Preview-Pfad in einer Sitzung | keine Buchung | `labor` oder `blocked` |',
      '| `020-amount-and-preview-single-session-text.txt` | Text | kompakten sichtbaren Preview-/Fehlertext oder Journaltext | keine Rohseite, keine Postenspur | `labor` oder `blocked` |',
      '| `FIXEDASSETS-222-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noOkYesConfirmation).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(result.flags.clickedPreviewEntryGroup).toBe(false);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
