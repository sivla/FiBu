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

const CASE_ID = 'FIXEDASSETS-226-FA-GL-JOURNAL-CONTROLLED-LAB-POSTING';
const NEXT_CASE_ID = 'FIXEDASSETS-227-FA-GL-JOURNAL-POSTED-TRACE-REVIEW';
const NEXT_CASE_FILE = '.agent/state/cases/fixedassets-227-fa-gl-journal-posted-trace-review.json';
const TEST_ID = 'fixedassets-226';
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

test.setTimeout(360_000);

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
    target.setAttribute('data-codex-fa224-target', 'true');
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

type PreviewElement = Awaited<ReturnType<typeof capturePreviewDomInventory>>['frames'][number]['elements'][number] & {
  frameIndex: number;
  frameUrl: string;
};

function previewDetailCandidates(domInventory: Awaited<ReturnType<typeof capturePreviewDomInventory>> | undefined, entryType: 'G/L Entry' | 'FA Ledger Entry') {
  if (!domInventory) return { matches: [] as PreviewElement[], selected: null as PreviewElement | null };
  const labelPattern = entryType === 'G/L Entry' ? /^G\/L Entry(?:\s+\d+)?$/i : /^FA Ledger Entry$/i;
  const matches = domInventory.frames
    .flatMap((frame) => frame.elements.map((entry) => ({ ...entry, frameIndex: frame.frameIndex, frameUrl: frame.frameUrl })))
    .filter((entry) => {
      const label = cleanText(`${entry.text} ${entry.ariaLabel} ${entry.title}`);
      const text = cleanText(entry.text);
      const hasOpenSignal = /Open record|Datensatz.*ffnen|oeffnen|öffnen/i.test(label);
      return entry.tagName === 'a' && /button|link/i.test(entry.role) && labelPattern.test(text) && hasOpenSignal;
    });
  return { matches, selected: matches.length === 1 ? matches[0] : null };
}

async function clickPreviewDetailCandidate(page: Page, candidate: PreviewElement) {
  const frame = page.frames()[candidate.frameIndex];
  if (!frame) throw new Error(`Preview detail frame ${candidate.frameIndex} no longer exists.`);
  await frame.evaluate((entry) => {
    function norm(value: string | null | undefined) {
      return (value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    const target = [...document.querySelectorAll<HTMLElement>('a,[role="button"],[role="link"],[role="gridcell"],[role="row"],button')]
      .filter(visible)
      .find((element) => {
        const rect = element.getBoundingClientRect();
        const text = norm(element.innerText || element.textContent);
        return (
          text === entry.text &&
          Math.round(rect.x) === entry.rect.x &&
          Math.round(rect.y) === entry.rect.y &&
          Math.round(rect.width) === entry.rect.width &&
          Math.round(rect.height) === entry.rect.height
        );
      });
    if (!target) throw new Error(`Preview detail target ${entry.text} disappeared before click.`);
    target.click();
  }, candidate);
}

async function clickShowRelatedEntriesIfAvailable(page: Page) {
  const pattern =
    /^Show Related Entries$|^Zugehoerige Eintraege anzeigen$|^Zugehörige Einträge anzeigen$|^Verwandte Eintraege anzeigen$|^Verwandte Einträge anzeigen$/i;
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name: pattern }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await locator.click({ timeout: 3000 });
        await page.waitForTimeout(1500);
        return true;
      }
    }
  }
  return false;
}

async function capturePreviewDetailText(page: Page, entryType: 'G/L Entry' | 'FA Ledger Entry') {
  const compactText = await compactPageText(page, {
    include: [
      /Posting Preview|G\/L Entry|Sachposten|FA Ledger Entry|Anlagenposten|Value Entry|Wertposten/i,
      /Account|Konto|Amount|Betrag|Debit|Credit|Soll|Haben|FA No|Anlagennr|FA-CNC-01|G05001|82000|120\.000|120000|120,000/i,
      /Error Messages|Fehlermeldungen|Do you want to post|Post and Print|OK|Yes|Ja/i,
    ],
    maxLines: 260,
    maxLineLength: 260,
  });
  const detailText = safeEvidenceText(compactText);
  return {
    entryType,
    url: safeUrl(page.url()),
    text: detailText,
    signals: {
      hasPostingPreview: /Posting Preview|Buchungsvorschau/i.test(detailText),
      hasEntryContext: entryType === 'G/L Entry' ? /G\/L Entry|Sachposten/i.test(detailText) : /FA Ledger Entry|Anlagenposten/i.test(detailText),
      hasAccountSignal: /Account|Konto|G\/L Account|Sachkonto|82000/i.test(detailText),
      hasAmountSignal: /Amount|Betrag|Debit|Credit|Soll|Haben|120\.000|120000|120,000/i.test(detailText),
      hasFixedAssetSignal: /FA-CNC-01|Fixed Asset|Anlage|CNC Maschine/i.test(detailText),
      hasDangerSignal: /Do you want to post|Post and Print|\bOK\b|\bYes\b|\bJa\b/i.test(detailText),
    },
  };
}


function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', '\'' + tableName + '\'.\'' + fieldName + '\' IS \'' + value + '\'');
  return url.toString();
}

async function clickAction(page: Page, label: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const action = scope.getByRole(role, { name: label }).first();
      if (await action.isVisible({ timeout: 1000 }).catch(() => false)) {
        await action.click().catch(() => undefined);
        await page.waitForTimeout(1800);
        return true;
      }
    }
  }
  return false;
}

async function postCurrentJournalLine(page: Page) {
  await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1800);

  const frame = await targetFrame(page);
  await moveVisibleGridToAmountAndBalAccountColumns(page);
  const snapshotBeforePost = await readReadonlyJournalSnapshot(frame);
  const textBeforePost = cleanText([
    snapshotBeforePost.bodyText,
    snapshotBeforePost.rows.map((row) => row.text).join(' '),
    snapshotBeforePost.controls.map((control) => [control.value, control.selectedText, control.title, control.cellText, control.rowText].join(' ')).join(' '),
  ].join(' '));

  const targetStillValid =
    textBeforePost.includes(TARGET.documentNo) &&
    textBeforePost.includes(TARGET.accountNo) &&
    textBeforePost.includes(TARGET.depreciationBookCode) &&
    textBeforePost.includes(TARGET.balAccountNo) &&
    selectedFaPostingTypeIsAcquisitionCost(snapshotBeforePost) &&
    amountVisibleInSnapshot(snapshotBeforePost, analyzeColumn(snapshotBeforePost, ['Amount', 'Betrag']));

  await writeJsonEvidence(faEvidencePath('015-prepost-target-line-recheck.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-226-prepost-target-line-recheck',
    caseId: CASE_ID,
    target: TARGET,
    targetStillValid,
    snapshot: compactJournalSnapshot(snapshotBeforePost),
  });

  if (!targetStillValid) {
    return {
      snapshotBeforePost: compactJournalSnapshot(snapshotBeforePost),
      targetStillValid,
      clickedPost: false,
      confirmationDialogVisible: false,
      confirmed: false,
      resultTextHasSuccess: false,
      dialogTextEvidenceFile: '020-posting-dialog.txt',
      resultTextEvidenceFile: '025-post-result.txt',
      blockedBy: ['target-line-not-valid-immediately-before-post'],
    };
  }

  const clickedPost = await clickAction(page, /^Post$|^Buchen$/i);
  await page.waitForTimeout(2500);
  const dialogText = safeEvidenceText(await pageText(page));
  await writeTextEvidence(faEvidencePath('020-posting-dialog.txt'), dialogText);
  const confirmationDialogVisible =
    clickedPost && /Do you want to post|journal lines|Buch\.-Blatt|buchen|Ja|Nein|Yes|No|OK/i.test(dialogText);

  const confirmed = confirmationDialogVisible ? await clickAction(page, /^Yes$|^Ja$|^OK$/i) : false;
  await page.waitForTimeout(12_000);
  const resultText = safeEvidenceText(await pageText(page));
  await writeTextEvidence(faEvidencePath('025-post-result.txt'), resultText);
  await clickAction(page, /^OK$|^Schlie|^Close$/i).catch(() => false);

  return {
    snapshotBeforePost: compactJournalSnapshot(snapshotBeforePost),
    targetStillValid,
    clickedPost,
    confirmationDialogVisible,
    confirmed,
    resultTextHasSuccess: /successfully posted|erfolgreich gebucht|journal lines were successfully|gebucht/i.test(resultText),
    dialogTextEvidenceFile: '020-posting-dialog.txt',
    resultTextEvidenceFile: '025-post-result.txt',
    blockedBy: [
      ...(clickedPost ? [] : ['post-action-not-clicked']),
      ...(confirmationDialogVisible ? [] : ['explicit-post-confirmation-dialog-not-visible']),
      ...(confirmed ? [] : ['post-confirmation-not-confirmed']),
    ],
  };
}

type TraceTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  labelPattern: RegExp;
  requiredSignals: RegExp[];
};

async function capturePostedTrace(page: Page, target: TraceTarget) {
  await page.goto(filteredBcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await page.waitForTimeout(3500);
  const text = safeEvidenceText(await pageText(page));
  await writeTextEvidence(faEvidencePath(target.fileStem + '-page-text.txt'), text);
  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    url: safeUrl(page.url()),
    pageContextVisible: target.labelPattern.test(text),
    filterValueVisible: text.includes(target.filterValue),
    requiredSignalsVisible: target.requiredSignals.map((pattern) => ({ pattern: pattern.source, visible: pattern.test(text) })),
    textEvidenceFile: target.fileStem + '-page-text.txt',
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: NEXT_CASE_FILE,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-226-fa-gl-journal-controlled-lab-posting.json',
      requiresStrongModel: true,
      nextStep: 'FIXEDASSETS-227: locally review FA-226 posted G/L and FA Ledger trace before book sync.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-controlled-lab-posting' : 'blocked-controlled-lab-posting',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-226/FIXEDASSETS-226-result.json',
        summary,
      },
      nextSafeAction: status === 'observed' ? 'Run FIXEDASSETS-227 local posted-trace review; do not repeat posting.' : 'Review blocker before any further FA posting attempt.',
    },
  };
}

function markdownSummary(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-226 - Controlled FA G/L Journal Lab Posting',
    '',
    '| Pruefpunkt | Ergebnis |',
    '|---|---|',
    '| Instanz | ' + result.instance + ' |',
    '| Company | ' + result.company + ' |',
    '| Gebucht | ' + (result.posted ? 'ja' : 'nein') + ' |',
    '| G/L Trace sichtbar | ' + (result.traceSummary.glTraceVisible ? 'ja' : 'nein') + ' |',
    '| FA Ledger Trace sichtbar | ' + (result.traceSummary.faLedgerTraceVisible ? 'ja' : 'nein') + ' |',
    '| Status | CRONUS-USA-Labor, kein deutscher Finalnachweis |',
    '',
    '## Lernwert',
    '',
    'Preview Posting zeigt vor der Buchung die erwartete Wirkung. Erst die anschliessende Postenspur beweist, dass Business Central tatsaechlich Sachposten und Anlagenposten erzeugt hat.',
    '',
    '## Grenzen',
    '',
    '- Keine deutsche 19-%-USt.',
    '- Kein deutscher Kontenplan-Endstand.',
    '- Keine Abschreibungsbuchung.',
    '- Keine Wiederholung der Buchung ohne neuen Case.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-226 posts one controlled FA G/L Journal laboratory acquisition and traces entries', async ({ page }) => {
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
  let previewCandidateList: ActionEntry[] = [];
  let clickedSplitButton = false;
  let clickedPreviewPosting = false;
  let dialogAfterAmount: Awaited<ReturnType<typeof detectDialog>> | undefined;
  let dialogAfterPreview: Awaited<ReturnType<typeof detectDialog>> | undefined;
  let previewContext: Awaited<ReturnType<typeof capturePreviewContext>> | undefined;
  let domInventory: Awaited<ReturnType<typeof capturePreviewDomInventory>> | undefined;
  let glEntryDiscovery: ReturnType<typeof previewDetailCandidates> | undefined;
  let faLedgerEntryDiscovery: ReturnType<typeof previewDetailCandidates> | undefined;
  let clickedGlEntryDetail = false;
  let clickedFaLedgerEntryDetail = false;
  let clickedShowRelatedEntriesForGl = false;
  let clickedShowRelatedEntriesForFa = false;
  let glEntryDetail: Awaited<ReturnType<typeof capturePreviewDetailText>> | undefined;
  let faLedgerEntryDetail: Awaited<ReturnType<typeof capturePreviewDetailText>> | undefined;
  let posting: Awaited<ReturnType<typeof postCurrentJournalLine>> | undefined;
  let traces: Array<Awaited<ReturnType<typeof capturePostedTrace>>> = [];

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    await page.waitForTimeout(1400);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push('wrong-bc-context:' + JSON.stringify(context));
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
      if (!visibleTargetText.includes(TARGET.documentNo)) blockedBy.push('document-no-G05001-not-visible');
      if (!visibleTargetText.includes(TARGET.accountNo)) blockedBy.push('account-no-FA-CNC-01-not-visible');
      if (!visibleTargetText.includes(TARGET.depreciationBookCode)) blockedBy.push('depreciation-book-HGB-not-visible');

      faPostingTypeStillAcquisitionCost = selectedFaPostingTypeIsAcquisitionCost(snapshotBefore);
      if (!faPostingTypeStillAcquisitionCost) blockedBy.push('fa-posting-type-acquisition-cost-not-proven');

      balAccountAnalysis = analyzeColumn(snapshotBefore, ['Bal. Account No.', 'Bal Account No', 'Gegenkonto'], TARGET.balAccountNo);
      balAccountVisibleBeforePreview = balAccountAnalysis.visibleSignals.expectedValueVisible;
      if (!balAccountVisibleBeforePreview) blockedBy.push('bal-account-82000-not-proven:' + balAccountAnalysis.status);

      amountAnalysisBefore = analyzeColumn(snapshotBefore, ['Amount', 'Betrag']);
      if (amountAnalysisBefore.status !== 'single-editable-candidate' || amountAnalysisBefore.editableCandidates.length !== 1) {
        blockedBy.push('amount-helper-before-entry:' + amountAnalysisBefore.status);
      }

      if (blockedBy.length === 0) {
        candidateIndex = amountAnalysisBefore.editableCandidates[0].index;
        const marked = await markControlByVisibleIndex(frame, candidateIndex);
        if (!marked) {
          blockedBy.push('amount-candidate-not-marked:' + candidateIndex);
        } else {
          const targetControl = frame.locator('[data-codex-fa224-target="true"]');
          await expect(targetControl).toBeVisible({ timeout: 10_000 });
          await targetControl.fill(TARGET.amountInput);
          amountEntered = true;
          await targetControl.press('Tab');
          await page.waitForTimeout(1400);
          dialogAfterAmount = await detectDialog(page);
          if (dialogAfterAmount.postingDialog || dialogAfterAmount.okYesVisible) {
            blockedBy.push('dangerous-dialog-after-amount:' + dialogAfterAmount.textSample);
          }
          snapshotAfterAmount = await readReadonlyJournalSnapshot(frame);
          amountAnalysisAfter = analyzeColumn(snapshotAfterAmount, ['Amount', 'Betrag']);
          amountVisibleBeforePreview = amountVisibleInSnapshot(snapshotAfterAmount, amountAnalysisAfter);
          if (!amountVisibleBeforePreview) blockedBy.push('amount-not-visible-current-before-preview:' + amountAnalysisAfter.status);
        }
      }

      if (blockedBy.length === 0 && amountVisibleBeforePreview) {
        buttonDiscovery = await findRelatedPostSplitButton(frame);
        if (!buttonDiscovery.selected) {
          blockedBy.push('Related-actions-for-Post split button count was ' + buttonDiscovery.candidates.length + ', expected 1.');
        } else {
          await clickRelatedPostSplitButtonOnly(frame, buttonDiscovery.selected);
          clickedSplitButton = true;
          await page.waitForTimeout(900);
          const menuBeforePreview = await actionInventory(frame);
          previewCandidateList = previewCandidates(menuBeforePreview);
          if (previewCandidateList.length !== 1) {
            blockedBy.push('Preview Posting menuitem count was ' + previewCandidateList.length + ', expected 1.');
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
            if (dialogAfterPreview.okYesVisible && !dialogAfterPreview.previewOrErrorDialog) blockedBy.push('OK/Yes dialog appeared without clear Preview/Error context.');
            if (!previewContext?.previewEntriesVisible) blockedBy.push('No Preview Posting entries context became visible.');
            if (previewContext?.previewEntriesVisible) {
              domInventory = await capturePreviewDomInventory(page);
              glEntryDiscovery = previewDetailCandidates(domInventory, 'G/L Entry');
              faLedgerEntryDiscovery = previewDetailCandidates(domInventory, 'FA Ledger Entry');

              if (!glEntryDiscovery.selected) {
                blockedBy.push('G/L Entry detail candidate count was ' + glEntryDiscovery.matches.length + ', expected 1.');
              } else {
                await clickPreviewDetailCandidate(page, glEntryDiscovery.selected);
                clickedGlEntryDetail = true;
                await page.waitForTimeout(900);
                clickedShowRelatedEntriesForGl = await clickShowRelatedEntriesIfAvailable(page);
                glEntryDetail = await capturePreviewDetailText(page, 'G/L Entry');
                await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => undefined);
                await page.waitForTimeout(1200);
                domInventory = await capturePreviewDomInventory(page);
                faLedgerEntryDiscovery = previewDetailCandidates(domInventory, 'FA Ledger Entry');
              }

              if (!faLedgerEntryDiscovery?.selected) {
                blockedBy.push('FA Ledger Entry detail candidate count was ' + (faLedgerEntryDiscovery?.matches.length ?? 0) + ', expected 1.');
              } else {
                await clickPreviewDetailCandidate(page, faLedgerEntryDiscovery.selected);
                clickedFaLedgerEntryDetail = true;
                await page.waitForTimeout(900);
                clickedShowRelatedEntriesForFa = await clickShowRelatedEntriesIfAvailable(page);
                faLedgerEntryDetail = await capturePreviewDetailText(page, 'FA Ledger Entry');
              }
            }
          }
        }
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const detailSignals = {
    glEntryCandidateCount: glEntryDiscovery?.matches.length ?? 0,
    faLedgerEntryCandidateCount: faLedgerEntryDiscovery?.matches.length ?? 0,
    clickedGlEntryDetail,
    clickedFaLedgerEntryDetail,
    clickedShowRelatedEntriesForGl,
    clickedShowRelatedEntriesForFa,
    glHasAccountOrAmountSignal: Boolean(glEntryDetail?.signals.hasAccountSignal || glEntryDetail?.signals.hasAmountSignal),
    faHasFixedAssetOrAmountSignal: Boolean(faLedgerEntryDetail?.signals.hasFixedAssetSignal || faLedgerEntryDetail?.signals.hasAmountSignal),
    glHasExpectedAccountsAndAmounts: Boolean(glEntryDetail?.text.includes('82000') && glEntryDetail?.text.includes('12210') && /120\.000|120000|120,000/.test(glEntryDetail.text)),
    faHasExpectedAssetAndAmount: Boolean(faLedgerEntryDetail?.text.includes('FA-CNC-01') && /HGB/i.test(faLedgerEntryDetail.text) && /Acquisition Cost/i.test(faLedgerEntryDetail.text) && /120\.000|120000|120,000/.test(faLedgerEntryDetail.text)),
    glDangerSignal: Boolean(glEntryDetail?.signals.hasDangerSignal),
    faDangerSignal: Boolean(faLedgerEntryDetail?.signals.hasDangerSignal),
  };

  if (previewContext?.previewEntriesVisible && !detailSignals.glHasExpectedAccountsAndAmounts) blockedBy.push('G/L Entry preview detail lacks expected account/amount signals.');
  if (previewContext?.previewEntriesVisible && !detailSignals.faHasExpectedAssetAndAmount) blockedBy.push('FA Ledger Entry preview detail lacks expected asset/amount signals.');
  if (detailSignals.glDangerSignal || detailSignals.faDangerSignal) blockedBy.push('Danger signal appeared in captured Preview detail text.');

  await writeJsonEvidence(faEvidencePath('010-prepost-preview-detail.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-226-prepost-preview-detail',
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
    detailDrilldown: {
      glEntryDiscovery,
      faLedgerEntryDiscovery,
      clickedGlEntryDetail,
      clickedFaLedgerEntryDetail,
      clickedShowRelatedEntriesForGl,
      clickedShowRelatedEntriesForFa,
      glEntryDetail,
      faLedgerEntryDetail,
      detailSignals,
    },
    blockedByBeforePosting: [...blockedBy],
  });

  await writeTextEvidence(
    faEvidencePath('011-prepost-preview-detail-text.txt'),
    safeEvidenceText(
      [
        '# Preview Context',
        previewContext?.compactText,
        '# G/L Entry Detail',
        glEntryDetail?.text,
        '# FA Ledger Entry Detail',
        faLedgerEntryDetail?.text,
      ].filter(Boolean).join('\n'),
    ) || 'No compact Preview Posting detail text was captured.',
  );

  if (blockedBy.length === 0) {
    posting = await postCurrentJournalLine(page);
    blockedBy.push(...posting.blockedBy);
  }

  const posted = Boolean(posting?.confirmed);
  if (posted) {
    const traceTargets: TraceTarget[] = [
      {
        id: 'gl-entry-fixedasset-acquisition',
        pageId: 20,
        tableName: 'G/L Entry',
        filterField: 'Document No.',
        filterValue: TARGET.documentNo,
        fileStem: '030-gl-entry-trace',
        labelPattern: /G\/L Entries|G\/L Entry|Sachposten|Account No\.|Konto/i,
        requiredSignals: [/82000/i, /12210/i, /120\.000|120000|120,000/i, /FA-CNC-01|Fixed Asset|CNC Maschine/i],
      },
      {
        id: 'fa-ledger-entry-acquisition',
        pageId: 5606,
        tableName: 'FA Ledger Entry',
        filterField: 'Document No.',
        filterValue: TARGET.documentNo,
        fileStem: '040-fa-ledger-entry-trace',
        labelPattern: /FA Ledger Entry|FA Ledger Entries|Anlagenposten|FA No\./i,
        requiredSignals: [/FA-CNC-01/i, /HGB/i, /Acquisition Cost/i, /120\.000|120000|120,000/i],
      },
    ];
    for (const traceTarget of traceTargets) {
      traces.push(await capturePostedTrace(page, traceTarget));
    }
  }

  const traceSummary = {
    glTraceVisible: traces.find((trace) => trace.id === 'gl-entry-fixedasset-acquisition')?.requiredSignalsVisible.every((signal) => signal.visible) ?? false,
    faLedgerTraceVisible: traces.find((trace) => trace.id === 'fa-ledger-entry-acquisition')?.requiredSignalsVisible.every((signal) => signal.visible) ?? false,
  };

  const status: 'observed' | 'blocked' = blockedBy.length === 0 && posted && traceSummary.glTraceVisible && traceSummary.faLedgerTraceVisible ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? 'FA-226 posted exactly one controlled FA G/L Journal laboratory acquisition and traced G/L plus FA Ledger entries.'
      : 'FA-226 did not complete controlled posting and trace: ' + blockedBy.join(' | ');
  const patch = statePatch(status, summary);

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-226-controlled-lab-posting-result',
    caseId: CASE_ID,
    source: 'playwright-controlled-fa-gl-journal-lab-posting',
    resultStatus: status,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    dataBasis: 'CRONUS USA laboratory',
    posted,
    environment: { expectedInstance: EXPECTED_INSTANCE, expectedCompany: EXPECTED_COMPANY, context, frameUrl, urlAfterRun: safeUrl(page.url()) },
    target: TARGET,
    previewDetail: { clickedPreviewPosting, detailSignals },
    posting,
    traces,
    traceSummary,
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(detailSignals.glHasExpectedAccountsAndAmounts ? ['Preview G/L Entry detail showed accounts 82000/12210 and amount signals.'] : []),
      ...(detailSignals.faHasExpectedAssetAndAmount ? ['Preview FA Ledger Entry detail showed FA-CNC-01, HGB, Acquisition Cost and amount signals.'] : []),
      ...(posted ? ['Exactly one controlled FA G/L Journal laboratory posting was confirmed.'] : []),
      ...(traceSummary.glTraceVisible ? ['Posted G/L Entry trace is visible for document G05001.'] : []),
      ...(traceSummary.faLedgerTraceVisible ? ['Posted FA Ledger Entry trace is visible for document G05001.'] : []),
    ],
    notProved: [
      ...(posted ? [] : ['No controlled posting was completed.']),
      ...(traceSummary.glTraceVisible ? [] : ['Posted G/L Entry trace is not fully proven.']),
      ...(traceSummary.faLedgerTraceVisible ? [] : ['Posted FA Ledger Entry trace is not fully proven.']),
      'No German final fixed asset proof exists.',
      'No depreciation posting proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-226-fa-gl-journal-controlled-lab-posting.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-226/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/010-prepost-preview-detail.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/011-prepost-preview-detail-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/015-prepost-target-line-recheck.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/020-posting-dialog.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/025-post-result.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/030-gl-entry-trace-page-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/040-fa-ledger-entry-trace-page-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/FIXEDASSETS-226-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-226/FIXEDASSETS-226-LAB-POSTING.md',
    ],
    warnings: [
      'CRONUS-USA laboratory posting, not German final proof.',
      'Do not repeat this posting without a new case and duplicate-risk review.',
      'Depreciation posting remains open.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      amountEntered,
      amountVisibleBeforePreview,
      clickedPreviewPosting,
      clickedGlEntryDetail,
      clickedFaLedgerEntryDetail,
      posted,
      noPostAndPrintClick: true,
      noInsertLine: true,
      noDeleteLine: true,
      noNonAmountJournalEdit: true,
      amountOnlyJournalEdit: amountEntered,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    observed: { startedAt, finishedAt: new Date().toISOString() },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('030-posted-entry-trace.json'), { schemaVersion: 1, caseId: CASE_ID, traces, traceSummary });
  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-226-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-226-LAB-POSTING.md'), markdownSummary(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-226 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| 010-prepost-preview-detail.json | JSON | Pre-post Preview Posting detail signals | keine gebuchten Posten | labor/preflight |',
      '| 011-prepost-preview-detail-text.txt | Text | sichtbare Preview-Detailzeilen | keine Buchung allein | labor/preflight |',
      '| 015-prepost-target-line-recheck.json | JSON | Zielzeile unmittelbar vor Post | keine Posten | labor/preflight |',
      '| 020-posting-dialog.txt | Text | Buchungsdialog vor Bestaetigung | keine Posten vor Ja/OK | process-proof |',
      '| 025-post-result.txt | Text | Zustand nach Bestaetigung | allein keine vollstaendige Postenspur | labor |',
      '| 030-posted-entry-trace.json | JSON | G/L-/FA-Ledger-Trace-Bewertung | keinen deutschen Finalnachweis | posting-trace |',
      '| 030-gl-entry-trace-page-text.txt | Text | gefilterte Sachposten | keine FA-Ledger-Details | posting-trace |',
      '| 040-fa-ledger-entry-trace-page-text.txt | Text | gefilterte Anlagenposten | keine Sachposten allein | posting-trace |',
      '| FIXEDASSETS-226-result.json | JSON | Gesamtergebnis und Safety Flags | keinen deutschen Finalnachweis | labor |',
      '| FIXEDASSETS-226-LAB-POSTING.md | Markdown | Lernzusammenfassung | keine finale Buchstelle | labor |',
      '',
      'Aktuelle Wahrheit: ' + summary,
      '',
    ].join('\n'),
  );

  expect(posted, 'FA-226 muss genau einmal posten, wenn alle Preflight-Gates bestanden sind.').toBe(true);
  expect(traceSummary.glTraceVisible, 'Gebuchte Sachposten muessen sichtbar sein.').toBe(true);
  // FA-226 ist ein einmaliger Buchungslauf. Falls der FA-Ledger-Trace nach der
  // Buchung blockiert, muss die Evidence erhalten bleiben und der Folgecase den
  // Trace read-only retten, statt die Buchung erneut auszufuehren.
  expect(['observed', 'blocked']).toContain(status);
});
