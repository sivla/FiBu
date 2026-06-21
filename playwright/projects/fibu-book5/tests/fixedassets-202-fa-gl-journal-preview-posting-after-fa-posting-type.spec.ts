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

const CASE_ID = 'FIXEDASSETS-202-FA-GL-JOURNAL-PREVIEW-POSTING-AFTER-FA-POSTING-TYPE';
const NEXT_CASE_ID = 'FIXEDASSETS-203-FA-GL-JOURNAL-PREVIEW-POSTING-RESULT-REVIEW';
const TEST_ID = 'fixedassets-202';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;

const TARGET = {
  journalTemplateName: 'ASSETS',
  journalBatchName: 'DEFAULT',
  lineNo: '10000',
  documentNo: 'G05001',
  accountNo: 'FA-CNC-01',
  depreciationBookCode: 'HGB',
  faPostingType: 'Acquisition Cost',
};

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

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
  if (!frame) {
    throw new Error('Fixed Asset G/L Journals runinframe was not found.');
  }
  return frame;
}

async function readReadonlyJournalSnapshot(frame: Frame) {
  return frame.evaluate(() => {
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    function rectOf(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
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
      signals: {
        fixedAssetGlJournalsVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
        documentNoVisible: bodyText.includes('G05001'),
        accountNoVisible: bodyText.includes('FA-CNC-01'),
        depreciationBookVisible: bodyText.includes('HGB'),
        faPostingTypeHeaderVisible: /FA Posting Type/i.test(bodyText),
        acquisitionCostVisibleGlobal: /Acquisition Cost/i.test(bodyText),
      },
    };
  });
}

function analyzeSnapshot(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>>) {
  return analyzeJournalCellCandidates(
    {
      headers: snapshot.headers,
      rows: snapshot.rows,
      controls: snapshot.controls,
    },
    {
      rowRequiredSignals: [TARGET.documentNo, TARGET.accountNo, TARGET.depreciationBookCode],
      columnSignals: ['FA Posting Type'],
    },
  );
}

function controlByIndex(snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined, index: number | undefined) {
  if (!snapshot || typeof index !== 'number') return undefined;
  return snapshot.controls.find((control) => control.index === index);
}

function controlSelectedFaPostingTypeIsAcquisitionCost(
  snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined,
  index: number | undefined,
) {
  const control = controlByIndex(snapshot, index);
  if (!control) return false;
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
}

async function actionInventory(scope: Page | Frame) {
  return scope.evaluate(() => {
    function norm(value: string | null | undefined) {
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
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
      .slice(0, 320);
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
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
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
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
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
      return (value ?? '')
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
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
    dialogs,
    textSample: text.slice(0, 1600),
    postingDialog: /Do you want to post|Moechten Sie buchen|Mochten Sie buchen|Post and Print|Buchen und drucken/i.test(text),
    okYesVisible: /\bOK\b|\bYes\b|\bJa\b/i.test(text),
    previewOrErrorDialog: /Posting Preview|Buchungsvorschau|Preview Posting|Error Messages|Fehlermeldungen|G\/L Entry|FA Ledger Entry|Anlagenposten/i.test(text),
  };
}

async function capturePreviewOrError(page: Page) {
  const fullText = await pageText(page);
  const compactText = await compactPageText(page, {
    include: [
      /Posting Preview|Buchungsvorschau|Preview Posting|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i,
      /Error Messages|Fehlermeldungen|must have a value|does not exist|missing|fehlt|nicht vorhanden|nichts zu buchen|nothing to post|Batch Name|FA Posting Type/i,
      /Post and Print|Do you want to post|Moechten Sie buchen|Mochten Sie buchen|OK|Yes|Ja/i,
    ],
    maxLines: 220,
    maxLineLength: 260,
  });
  const signalLines = safeEvidenceText(compactText)
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line, index, all) => all.indexOf(line) === index)
    .slice(0, 80);
  const errorMessagesVisible = /Error Messages|Fehlermeldungen/i.test(fullText);
  const priorFaPostingTypeErrorVisible =
    /'FA Posting Type'.*(nicht ' ' sein|not be blank|must not be blank)|FA Posting Type.*darf.*nicht.*' '|FA Posting Type.*must.*not.*blank/i.test(fullText);
  const acquisitionCostMustBePostedInFaJournalVisible =
    /FA Posting Type Acquisition Cost must be posted in the FA journal/i.test(fullText);
  const previewEntriesVisible =
    /Posting Preview|Buchungsvorschau|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i.test(fullText);

  return {
    url: safeUrl(page.url()),
    errorMessagesVisible,
    priorFaPostingTypeErrorVisible,
    acquisitionCostMustBePostedInFaJournalVisible,
    previewEntriesVisible,
    signalLines,
    compactText: safeEvidenceText(compactText),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-203-fa-gl-journal-preview-posting-result-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-202-fa-gl-journal-preview-posting-after-fa-posting-type.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-203: locally review FA-202 Preview Posting result before any Post, setup change or further journal edit.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-preview-posting-after-fa-posting-type' : 'blocked-preview-posting-after-fa-posting-type',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-202/FIXEDASSETS-202-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-203 local review; do not post.',
    },
  };
}

test('FIXEDASSETS-202 retries Preview Posting after FA Posting Type correction', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let snapshotBefore: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let helperBefore: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let candidateIndex: number | undefined;
  let faPostingTypeStillAcquisitionCost = false;
  let buttonDiscovery: Awaited<ReturnType<typeof findRelatedPostSplitButton>> | undefined;
  let menuBeforePreview: ActionEntry[] = [];
  let previewCandidateList: ActionEntry[] = [];
  let clickedSplitButton = false;
  let clickedPreviewPosting = false;
  let dialogAfterPreview: Awaited<ReturnType<typeof detectDialog>> | undefined;
  let previewOrError: Awaited<ReturnType<typeof capturePreviewOrError>> | undefined;

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
      snapshotBefore = await readReadonlyJournalSnapshot(frame);
      helperBefore = analyzeSnapshot(snapshotBefore);
      if (helperBefore.status === 'single-editable-candidate' && helperBefore.editableCandidates.length === 1) {
        candidateIndex = helperBefore.editableCandidates[0].index;
      } else {
        blockedBy.push(`fa-posting-type-candidate:${helperBefore.status}`);
      }
      faPostingTypeStillAcquisitionCost = controlSelectedFaPostingTypeIsAcquisitionCost(snapshotBefore, candidateIndex);
      if (!faPostingTypeStillAcquisitionCost) {
        blockedBy.push('FA Posting Type = Acquisition Cost was not still selected before Preview Posting.');
      }

      if (blockedBy.length === 0) {
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
            for (const delay of [400, 900, 1800]) {
              await page.waitForTimeout(delay);
              previewOrError = await capturePreviewOrError(page);
              if (previewOrError.previewEntriesVisible || previewOrError.errorMessagesVisible) break;
            }
            dialogAfterPreview = await detectDialog(page);
            if (dialogAfterPreview.postingDialog) {
              blockedBy.push('Posting dialog appeared after clicking exact Preview Posting menuitem.');
            }
            if (dialogAfterPreview.okYesVisible && !dialogAfterPreview.previewOrErrorDialog) {
              blockedBy.push('OK/Yes dialog appeared without clear Preview/Error context.');
            }
            if (!previewOrError?.previewEntriesVisible && !previewOrError?.errorMessagesVisible && !dialogAfterPreview.previewOrErrorDialog) {
              blockedBy.push('No Preview Posting entries or Error Messages context became visible.');
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

  const priorFaPostingTypeBlockerGone = clickedPreviewPosting && !previewOrError?.priorFaPostingTypeErrorVisible;
  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const outcome =
    previewOrError?.previewEntriesVisible
      ? 'preview-entry-context'
      : previewOrError?.errorMessagesVisible
        ? 'error-messages-context'
        : 'not-captured';
  const summary =
    status === 'observed'
      ? `FA-202 clicked only the exact Preview Posting menuitem after proving FA Posting Type = Acquisition Cost; outcome=${outcome}; prior FA Posting Type blocker gone=${priorFaPostingTypeBlockerGone}.`
      : `FA-202 stayed safe but did not complete the guarded Preview Posting retry: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-preflight-fa-posting-type.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-202-preflight-fa-posting-type',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    snapshotBefore,
    helperBefore,
    candidateIndex,
    faPostingTypeStillAcquisitionCost,
    blockedByBeforePreview: blockedBy.filter((entry) => /FA Posting Type|candidate|context/i.test(entry)),
  });

  await writeJsonEvidence(faEvidencePath('020-preview-posting-after-correction.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-202-preview-posting-after-correction',
    caseId: CASE_ID,
    buttonDiscovery,
    clickedSplitButton,
    previewCandidateCount: previewCandidateList.length,
    previewCandidates: previewCandidateList,
    clickedPreviewPosting,
    dialogAfterPreview,
    previewOrError,
    outcome,
    priorFaPostingTypeBlockerGone,
    safety: {
      clickedSplitButton,
      clickedExactPreviewPostingMenuitem: clickedPreviewPosting,
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

  await writeTextEvidence(
    faEvidencePath('030-preview-posting-result-text.txt'),
    previewOrError?.compactText || 'No compact Preview Posting or Error Messages text was captured.',
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-202-preview-posting-after-fa-posting-type-result',
    caseId: CASE_ID,
    source: 'playwright-preview-posting-only-after-fa-posting-type-correction',
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
      ...(faPostingTypeStillAcquisitionCost ? ['FA Posting Type = Acquisition Cost was still selected before Preview Posting.'] : []),
      ...(buttonDiscovery?.selected ? ['Exactly one related-actions-for-Post split/dropdown button was found.'] : []),
      ...(clickedSplitButton ? ['Only the related-actions-for-Post split/dropdown button was clicked before Preview Posting.'] : []),
      ...(previewCandidateList.length === 1 ? ['Exactly one exact Preview Posting menuitem candidate was found.'] : []),
      ...(clickedPreviewPosting ? ['Only the exact Preview Posting menuitem was clicked once.'] : []),
      ...(previewOrError?.previewEntriesVisible ? ['Preview Posting entry context became visible after correction.'] : []),
      ...(previewOrError?.errorMessagesVisible ? ['Error Messages context became visible after Preview Posting.'] : []),
      ...(priorFaPostingTypeBlockerGone ? ['The prior FA Posting Type blank error did not reappear in the captured result.'] : []),
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
      ...(previewOrError?.previewEntriesVisible ? [] : ['No real Preview Posting entry lines were proven.']),
      ...(priorFaPostingTypeBlockerGone ? [] : ['The prior FA Posting Type blocker is not proven gone.']),
      'No Fixed Asset G/L Journal posting was executed.',
      'No FA Ledger Entry or posted G/L Entry trace exists.',
      'No German final proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-202-fa-gl-journal-preview-posting-after-fa-posting-type.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-202/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-202/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-202/010-preflight-fa-posting-type.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-202/020-preview-posting-after-correction.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-202/030-preview-posting-result-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-202/FIXEDASSETS-202-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-202/FIXEDASSETS-202-result.json',
    ],
    warnings: [
      'Preview Posting-only. Do not treat as posting permission.',
      'Posting remains locked until FIXEDASSETS-203 local review.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      clickedSplitButton,
      clickedPreviewPosting,
      faPostingTypeStillAcquisitionCost,
      priorFaPostingTypeBlockerGone,
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
      outcome,
      previewOrErrorSummary: {
        url: previewOrError?.url,
        errorMessagesVisible: previewOrError?.errorMessagesVisible,
        priorFaPostingTypeErrorVisible: previewOrError?.priorFaPostingTypeErrorVisible,
        acquisitionCostMustBePostedInFaJournalVisible: previewOrError?.acquisitionCostMustBePostedInFaJournalVisible,
        previewEntriesVisible: previewOrError?.previewEntriesVisible,
        signalLines: previewOrError?.signalLines?.slice(0, 30) ?? [],
      },
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-202-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-202-learning.md'),
    [
      '# FIXEDASSETS-202 Lernzusammenfassung',
      '',
      'Status: `labor`, `preview-posting-only`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      'Dieser Lauf prueft den naechsten fachlichen Schritt nach der Zeilenkorrektur aus FA-200. Business Central muss vor der Vorschau nicht nur den richtigen Belegkontext zeigen, sondern auch das korrigierte Zeilenfeld `FA Posting Type = Acquisition Cost`. Erst danach ist ein eng begrenzter Klick auf `Preview Posting` fachlich vertretbar.',
      '',
      '## Grenzen',
      '',
      '- Keine Buchung.',
      '- Keine `OK`- oder `Yes`-Bestaetigung.',
      '- Keine Journalzeile geaendert.',
      '- Kein Setup geaendert.',
      '- Keine echte FA-Ledger-/G/L-Postenspur.',
      '- Kein deutscher Finalnachweis.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      '',
    ].join('\n'),
  );
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-202 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-preflight-fa-posting-type.json` | JSON | Kontext, Zielzeile und `FA Posting Type = Acquisition Cost` vor Preview | keine Vorschau | `labor` oder `blocked` |',
      '| `020-preview-posting-after-correction.json` | JSON | exakten Preview-Menuepunkt, Ergebnisart, Safety Flags | keine Buchung | `labor` oder `blocked` |',
      '| `030-preview-posting-result-text.txt` | Text | kompakten sichtbaren Preview-/Fehlertext | keine Rohseite, keine Postenspur | `labor` oder `blocked` |',
      '| `FIXEDASSETS-202-result.json` | JSON | Ergebnis, Grenzen, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-202-learning.md` | Markdown | Lernwert nach Zeilenkorrektur | keine Buchungsfreigabe | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.faPostingTypeStillAcquisitionCost).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noOkYesConfirmation).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
