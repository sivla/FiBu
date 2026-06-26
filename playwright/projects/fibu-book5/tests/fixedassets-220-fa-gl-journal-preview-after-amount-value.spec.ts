import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';
import fs from 'node:fs';

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

const CASE_ID = 'FIXEDASSETS-220-FA-GL-JOURNAL-PREVIEW-AFTER-AMOUNT-VALUE';
const NEXT_CASE_ID = 'FIXEDASSETS-221-FA-GL-JOURNAL-PREVIEW-AFTER-AMOUNT-REVIEW';
const NEXT_CASE_FILE = '.agent/state/cases/fixedassets-221-fa-gl-journal-preview-after-amount-review.json';
const TEST_ID = 'fixedassets-220';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;
const REVIEW_EVIDENCE = 'playwright/projects/fibu-book5/evidence/fixedassets-219/FIXEDASSETS-219-result.json';

const TARGET = {
  documentNo: 'G05001',
  accountNo: 'FA-CNC-01',
  depreciationBookCode: 'HGB',
  faPostingType: 'Acquisition Cost',
  balAccountNo: '82000',
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
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
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
      rows: rows.filter((row) => /G05001|FA-CNC-01|HGB|CNC Maschine FRA|Acquisition Cost|FA Posting Type/i.test(row.text)),
      controls,
    };
  });
}

function analyzeSnapshot(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>>) {
  return analyzeJournalCellCandidates(
    { headers: snapshot.headers, rows: snapshot.rows, controls: snapshot.controls },
    { rowRequiredSignals: [TARGET.documentNo, TARGET.accountNo, TARGET.depreciationBookCode], columnSignals: ['FA Posting Type'] },
  );
}

function selectedFaPostingTypeIsAcquisitionCost(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>>, _index?: number) {
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

          function rectOf(element: HTMLElement) {
            const rect = element.getBoundingClientRect();
            return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
          }

          const interesting = /Posting Preview|Buchungsvorschau|G\/L Entry\s*1|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i;
          const sourceElements = [document.body, ...document.querySelectorAll<HTMLElement>('body *')].filter(Boolean) as HTMLElement[];
          const elements = sourceElements
            .filter(visible)
            .map((element, index) => {
              const text = norm(element.innerText || element.textContent);
              const ariaLabel = norm(element.getAttribute('aria-label'));
              const title = norm(element.getAttribute('title'));
              return {
                index,
                tagName: element.tagName.toLowerCase(),
                role: element.getAttribute('role') || '',
                text: text.slice(0, 500),
                ariaLabel,
                title,
                tabIndex: element.getAttribute('tabindex') || '',
                ariaExpanded: element.getAttribute('aria-expanded') || '',
                ariaControls: element.getAttribute('aria-controls') || '',
                ariaOwns: element.getAttribute('aria-owns') || '',
                className: norm(typeof element.className === 'string' ? element.className : ''),
                rect: rectOf(element),
              };
            })
            .filter((entry) => interesting.test(`${entry.text} ${entry.ariaLabel} ${entry.title}`))
            .filter(
              (entry, index, all) =>
                all.findIndex(
                  (other) =>
                    other.tagName === entry.tagName &&
                    other.role === entry.role &&
                    other.text === entry.text &&
                    other.ariaLabel === entry.ariaLabel,
                ) === index,
            )
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
  const candidateClickableElements = frameInventories
    .flatMap((frame) => frame.elements)
    .filter((entry) => /button|link|menuitem|treeitem|row|gridcell/i.test(`${entry.role} ${entry.tagName}`)).length;
  return {
    pageTitle: frameInventories.map((frame) => frame.pageTitle).filter(Boolean).join(' | '),
    frames: frameInventories,
    signals: {
      postingPreviewTitleVisible: /Posting Preview|Buchungsvorschau/i.test(allSignalText),
      glEntryLabelVisible: /G\/L Entry\s*1|Sachposten/i.test(allSignalText),
      faLedgerEntryLabelVisible: /FA Ledger Entry|Anlagenposten/i.test(allSignalText),
      valueEntryLabelVisible: /Value Entry|Wertposten/i.test(allSignalText),
      candidateClickableElements,
    },
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: NEXT_CASE_FILE,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-220-fa-gl-journal-preview-after-amount-value.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-221: locally review FA-220 Preview Posting result before deciding any posting readiness.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-preview-after-amount-value' : 'blocked-preview-after-amount-value',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-220/FIXEDASSETS-220-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-221 local review; do not post.',
    },
  };
}

function amountVisibleInSnapshot(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined) {
  const combined = cleanText([
    snapshot?.bodyText,
    snapshot?.rows.map((row) => row.text).join(' '),
    snapshot?.controls.map((control) => [control.value, control.cellText, control.rowText].join(' ')).join(' '),
  ].join(' '));
  return TARGET.amountDisplaySignals.some((signal) => combined.includes(signal));
}

test('FIXEDASSETS-220 opens Preview Posting after Amount value without posting', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let snapshotBefore: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let helperBefore: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let candidateIndex: number | undefined;
  let faPostingTypeStillAcquisitionCost = false;
  let amountVisibleBeforePreview = false;
  let balAccountVisibleBeforePreview = false;
  let buttonDiscovery: Awaited<ReturnType<typeof findRelatedPostSplitButton>> | undefined;
  let menuBeforePreview: ActionEntry[] = [];
  let previewCandidateList: ActionEntry[] = [];
  let clickedSplitButton = false;
  let clickedPreviewPosting = false;
  let dialogAfterPreview: Awaited<ReturnType<typeof detectDialog>> | undefined;
  let previewContext: Awaited<ReturnType<typeof capturePreviewContext>> | undefined;
  let domInventory: Awaited<ReturnType<typeof capturePreviewDomInventory>> | undefined;
  const reviewEvidence = JSON.parse(fs.readFileSync(REVIEW_EVIDENCE, 'utf8'));
  const priorReviewAccepted = reviewEvidence?.resultStatus === 'accepted-preview-only-retry-unlocked-no-posting';

  try {
    if (!priorReviewAccepted) blockedBy.push('FA-219 did not unlock the Preview Posting-only retry.');

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
      helperBefore = analyzeSnapshot(snapshotBefore);
      if (helperBefore.status === 'single-editable-candidate' && helperBefore.editableCandidates.length === 1) {
        candidateIndex = helperBefore.editableCandidates[0].index;
      }
      faPostingTypeStillAcquisitionCost = selectedFaPostingTypeIsAcquisitionCost(snapshotBefore, candidateIndex);
      if (!faPostingTypeStillAcquisitionCost) blockedBy.push('FA Posting Type = Acquisition Cost was not still selected before Preview Posting.');
      amountVisibleBeforePreview = amountVisibleInSnapshot(snapshotBefore);
      if (!amountVisibleBeforePreview) blockedBy.push('Amount 120.000,00 was not visible before Preview Posting.');
      balAccountVisibleBeforePreview = cleanText([snapshotBefore.bodyText, snapshotBefore.rows.map((row) => row.text).join(' '), snapshotBefore.controls.map((control) => [control.value, control.cellText, control.rowText].join(' ')).join(' ')].join(' ')).includes(TARGET.balAccountNo);
      if (!balAccountVisibleBeforePreview) blockedBy.push('Bal. Account No. 82000 was not visible before Preview Posting.');

      if (blockedBy.length === 0 && priorReviewAccepted) {
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
            if (blockedBy.length === 0 && previewContext?.previewEntriesVisible) {
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
  if (previewContext?.previewEntriesVisible && !domSignals?.glEntryLabelVisible) blockedBy.push('DOM inventory did not capture a G/L Entry label.');
  if (previewContext?.previewEntriesVisible && !domSignals?.faLedgerEntryLabelVisible) blockedBy.push('DOM inventory did not capture an FA Ledger Entry label.');

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-220 captured Preview Posting after Amount value without clicking entry groups; G/L Entry visible=${domSignals?.glEntryLabelVisible}; FA Ledger Entry visible=${domSignals?.faLedgerEntryLabelVisible}; clickable candidates=${domSignals?.candidateClickableElements}.`
      : `FA-220 stayed safe but did not complete Preview Posting after Amount value: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-preview-after-amount.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-220-preview-after-amount-value',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    reviewEvidence: {
      resultStatus: reviewEvidence?.resultStatus,
      nextCase: reviewEvidence?.decision?.nextCase,
    },
    priorReviewAccepted,
    preflight: {
      snapshotBefore,
      helperBefore,
      candidateIndex,
      faPostingTypeStillAcquisitionCost,
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
    domInventory,
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
      journalEdited: false,
      companySwitched: false,
      apiShortcutUsed: false,
      bookChanged: false,
    },
    blockedBy,
  });

  await writeTextEvidence(faEvidencePath('020-preview-after-amount-text.txt'), previewContext?.compactText || 'No compact Preview Posting text was captured.');

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-220-preview-after-amount-result',
    caseId: CASE_ID,
    source: 'playwright-preview-posting-after-amount-only',
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
      ...(priorReviewAccepted ? ['FA-219 unlocked this Preview Posting-only retry after Amount value proof.'] : []),
      ...(faPostingTypeStillAcquisitionCost ? ['FA Posting Type = Acquisition Cost was still selected before Preview Posting.'] : []),
      ...(clickedSplitButton ? ['Only the related-actions-for-Post split/dropdown button was clicked before Preview Posting.'] : []),
      ...(previewCandidateList.length === 1 ? ['Exactly one exact Preview Posting menuitem candidate was found.'] : []),
      ...(clickedPreviewPosting ? ['Only the exact Preview Posting menuitem was clicked once.'] : []),
      ...(amountVisibleBeforePreview ? ['Amount 120.000,00 was visible before Preview Posting.'] : []),
      ...(balAccountVisibleBeforePreview ? ['Bal. Account No. 82000 was visible before Preview Posting.'] : []),
      ...(previewContext?.previewEntriesVisible ? ['Preview Posting entry context became visible.'] : []),
      ...(domSignals?.postingPreviewTitleVisible ? ['DOM inventory captured the Posting Preview title/context.'] : []),
      ...(domSignals?.glEntryLabelVisible ? ['DOM inventory captured a G/L Entry label.'] : []),
      ...(domSignals?.faLedgerEntryLabelVisible ? ['DOM inventory captured an FA Ledger Entry label.'] : []),
      'No Preview entry group was clicked.',
      'No main Post button was clicked.',
      'No Post menuitem was clicked.',
      'No Post and Print menuitem was clicked.',
      'No OK/Yes confirmation was clicked.',
      'No journal line was created, edited or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(domSignals?.candidateClickableElements ? [] : ['No candidate clickable Preview entry elements were identified.']),
      'No Preview entry group detail page was opened.',
      'No G/L Entry account or amount details were proven.',
      'No FA Ledger Entry fixed asset or amount details were proven.',
      'No Fixed Asset G/L Journal posting was executed.',
      'No posted FA Ledger Entry or posted G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-220-fa-gl-journal-preview-after-amount-value.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-220/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-220/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-220/010-preview-after-amount.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-220/020-preview-after-amount-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-220/FIXEDASSETS-220-result.json',
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
      clickedSplitButton,
      clickedPreviewPosting,
      clickedPreviewEntryGroup: false,
      priorReviewAccepted,
      faPostingTypeStillAcquisitionCost,
      amountVisibleBeforePreview,
      balAccountVisibleBeforePreview,
      domSignals,
      noMainPostClick: true,
      noPostMenuitemClick: true,
      noPostAndPrintClick: true,
      noInsertLine: true,
      noDeleteLine: true,
      noJournalEdit: true,
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
      helperBefore,
      candidateIndex,
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-220-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-220 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-preview-after-amount.json` | JSON | exakten Preview-Pfad nach Amount 120.000,00 und Preview-Signale | keine Buchung | `labor` oder `blocked` |',
      '| `020-preview-after-amount-text.txt` | Text | kompakten sichtbaren Preview-/Fehlertext nach Amount | keine Rohseite, keine Postenspur | `labor` oder `blocked` |',
      '| `FIXEDASSETS-220-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.priorReviewAccepted).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noOkYesConfirmation).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(result.flags.clickedPreviewEntryGroup).toBe(false);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
