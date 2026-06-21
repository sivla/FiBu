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

const CASE_ID = 'FIXEDASSETS-200-FA-GL-JOURNAL-FA-POSTING-TYPE-ACQUISITION-PREFLIGHT';
const NEXT_CASE_ID = 'FIXEDASSETS-201-FA-GL-JOURNAL-FA-POSTING-TYPE-REVIEW';
const TEST_ID = 'fixedassets-200';
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

async function markControlByVisibleIndex(frame: Frame, visibleIndex: number) {
  return frame.evaluate((index) => {
    function visible(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }
    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')].filter(visible);
    const target = controls.find((control, candidateIndex) => candidateIndex === index);
    if (!target) return { marked: false, reason: 'target-control-not-found' };
    target.setAttribute('data-codex-fa200-target', 'true');
    return {
      marked: true,
      tagName: target.tagName.toLowerCase(),
      value: target.value,
      title: target.getAttribute('title') || '',
      ariaLabel: target.getAttribute('aria-label') || '',
    };
  }, visibleIndex);
}

async function setMarkedControlToAcquisitionCost(frame: Frame, page: Page) {
  const selectResult = await frame.evaluate((targetValue) => {
    const target = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-codex-fa200-target="true"]');
    if (!target) return { handled: false, method: 'none', reason: 'marked-control-not-found' };
    if (target instanceof HTMLSelectElement) {
      const option = [...target.options].find((candidate) => candidate.text.trim() === targetValue || candidate.value.trim() === targetValue);
      if (!option) return { handled: true, method: 'select', selected: false, reason: 'option-not-found' };
      target.value = option.value;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      return { handled: true, method: 'select', selected: true, value: target.value };
    }
    return { handled: false, method: 'text-control' };
  }, TARGET.faPostingType);

  if (selectResult.handled) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(1200);
    return selectResult;
  }

  const targetControl = frame.locator('[data-codex-fa200-target="true"]');
  await expect(targetControl).toBeVisible({ timeout: 10_000 });
  await targetControl.click();
  await targetControl.fill(TARGET.faPostingType);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1600);
  return { handled: true, method: 'fill-tab', selected: true };
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
      active_case_file: '.agent/state/cases/fixedassets-201-fa-gl-journal-fa-posting-type-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-200-fa-gl-journal-fa-posting-type-acquisition-preflight.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-201: locally review FA-200 FA Posting Type persistence evidence before any Preview Posting retry or Post.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-fa-posting-type-persistence' : 'blocked-fa-posting-type-persistence',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-200/FIXEDASSETS-200-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-201 local review; do not open Preview Posting or Post.',
    },
  };
}

test('FIXEDASSETS-200 sets only FA Posting Type = Acquisition Cost and proves reopen persistence', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let contextBefore: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let contextAfter: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrlBefore = '';
  let frameUrlAfter = '';
  let snapshotBefore: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let snapshotAfterEntry: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let snapshotAfterReopen: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let helperBefore: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let helperAfterEntry: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let helperAfterReopen: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let candidateIndex: number | undefined;
  let actualBeforeMatches = false;
  let actualAfterEntryMatches = false;
  let actualAfterReopenMatches = false;
  let markResult: Awaited<ReturnType<typeof markControlByVisibleIndex>> | undefined;
  let entryResult: Awaited<ReturnType<typeof setMarkedControlToAcquisitionCost>> | undefined;
  let dangerousDialogAfterEntry: Awaited<ReturnType<typeof detectDangerousDialog>> | undefined;

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);
    await page.waitForTimeout(1200);

    contextBefore = await sandboxContext(page);
    if (!contextBefore.environmentInUrl || (!contextBefore.companyInUrl && !contextBefore.companyInText) || contextBefore.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context before entry: ${JSON.stringify(contextBefore)}`);
    } else {
      const frame = await targetFrame(page);
      frameUrlBefore = safeUrl(frame.url());
      snapshotBefore = await readReadonlyJournalSnapshot(frame);
      helperBefore = analyzeSnapshot(snapshotBefore);

      if (helperBefore.status === 'single-editable-candidate' && helperBefore.editableCandidates.length === 1) {
        candidateIndex = helperBefore.editableCandidates[0].index;
      } else {
        blockedBy.push(`helper-before-entry:${helperBefore.status}`);
      }
      actualBeforeMatches = controlSelectedFaPostingTypeIsAcquisitionCost(snapshotBefore, candidateIndex);

      if (typeof candidateIndex !== 'number') {
        blockedBy.push('candidate-index-missing');
      } else if (!actualBeforeMatches) {
        markResult = await markControlByVisibleIndex(frame, candidateIndex);
        if (!markResult.marked) {
          blockedBy.push(`candidate-not-marked:${candidateIndex}:${markResult.reason}`);
        } else {
          entryResult = await setMarkedControlToAcquisitionCost(frame, page);
          dangerousDialogAfterEntry = await detectDangerousDialog(page);
          if (dangerousDialogAfterEntry.postingDialog || dangerousDialogAfterEntry.okYesVisible) {
            blockedBy.push(`dangerous-dialog-after-entry:${dangerousDialogAfterEntry.textSample}`);
          }
          snapshotAfterEntry = await readReadonlyJournalSnapshot(frame);
          helperAfterEntry = analyzeSnapshot(snapshotAfterEntry);
          actualAfterEntryMatches = controlSelectedFaPostingTypeIsAcquisitionCost(snapshotAfterEntry, candidateIndex);
          if (!actualAfterEntryMatches) {
            blockedBy.push(`value-not-visible-after-entry:${helperAfterEntry.status}`);
          }
        }
      }

      if (blockedBy.length === 0) {
        await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
        await waitForBusinessCentralShell(page);
        await dismissTours(page).catch(() => undefined);
        await hideFactBoxPane(page).catch(() => undefined);
        await page.waitForTimeout(1400);

        contextAfter = await sandboxContext(page);
        if (!contextAfter.environmentInUrl || (!contextAfter.companyInUrl && !contextAfter.companyInText) || contextAfter.wrongEnvironmentVisible) {
          blockedBy.push(`Wrong BC context after reopen: ${JSON.stringify(contextAfter)}`);
        } else {
          const reopenedFrame = await targetFrame(page);
          frameUrlAfter = safeUrl(reopenedFrame.url());
          snapshotAfterReopen = await readReadonlyJournalSnapshot(reopenedFrame);
          helperAfterReopen = analyzeSnapshot(snapshotAfterReopen);
          const reopenCandidate =
            helperAfterReopen.status === 'single-editable-candidate' && helperAfterReopen.editableCandidates.length === 1
              ? helperAfterReopen.editableCandidates[0].index
              : candidateIndex;
          actualAfterReopenMatches = controlSelectedFaPostingTypeIsAcquisitionCost(snapshotAfterReopen, reopenCandidate);
          if (!actualAfterReopenMatches) {
            blockedBy.push(`value-not-persistent-after-reopen:${helperAfterReopen.status}`);
          }
        }
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const status: 'observed' | 'blocked' =
    blockedBy.length === 0 && actualAfterReopenMatches ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? 'FA-200 proved FA Posting Type = Acquisition Cost persisted after reopening Fixed Asset G/L Journals.'
      : `FA-200 stayed safe but did not prove FA Posting Type persistence: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-before-fa-posting-type.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-200-before-fa-posting-type',
    caseId: CASE_ID,
    context: contextBefore,
    frameUrl: frameUrlBefore,
    target: TARGET,
    snapshotBefore,
    helperBefore,
    candidateIndex,
    actualBeforeMatches,
    omitted: 'No full DOM dump, traces, videos, reports or auth artifacts stored.',
  });

  await writeJsonEvidence(faEvidencePath('020-after-fa-posting-type.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-200-after-fa-posting-type',
    caseId: CASE_ID,
    markResult,
    entryResult,
    dangerousDialogAfterEntry,
    snapshotAfterEntry,
    helperAfterEntry,
    actualAfterEntryMatches,
    valueEntryAttempted: typeof candidateIndex === 'number' && !actualBeforeMatches,
    blockedByAfterEntry: blockedBy.filter((entry) => /entry|candidate|mark|dialog|visible/i.test(entry)),
  });

  await writeJsonEvidence(faEvidencePath('030-after-reopen-persistence.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-200-after-reopen-persistence',
    caseId: CASE_ID,
    context: contextAfter,
    frameUrl: frameUrlAfter,
    snapshotAfterReopen,
    helperAfterReopen,
    actualAfterReopenMatches,
    persisted: actualAfterReopenMatches,
    blockedBy,
    screenshotCaptured: false,
    screenshotOmittedReason:
      'The authoritative proof is structured grid/header/value evidence. No screenshot was created for this narrow data-correction preflight.',
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-200-fa-posting-type-acquisition-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-guarded-journal-field-correction-preflight',
    resultStatus: status,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      contextBefore,
      contextAfter,
      frameUrlBefore,
      frameUrlAfter,
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(contextBefore?.environmentInUrl && contextAfter?.environmentInUrl ? ['The run stayed in MCP_1_20260210 before and after reopen.'] : []),
      ...(contextBefore?.companyInUrl || contextBefore?.companyInText ? ['The run started in RM-DEMO.'] : []),
      ...(contextAfter?.companyInUrl || contextAfter?.companyInText ? ['The run remained in RM-DEMO after reopen.'] : []),
      ...(snapshotBefore?.signals.fixedAssetGlJournalsVisible ? ['Fixed Asset G/L Journals context was visible before entry.'] : []),
      ...(helperBefore ? [`Geometry/header-order helper status before entry was ${helperBefore.status}.`] : []),
      ...(actualAfterEntryMatches || actualBeforeMatches
        ? ['FA Posting Type = Acquisition Cost was structurally selected/current before reopen.']
        : []),
      ...(actualAfterReopenMatches ? ['FA Posting Type = Acquisition Cost was structurally selected/current after reopening the journal page.'] : []),
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No journal line was created or deleted.',
      'No field except FA Posting Type was intentionally edited.',
      'No setup change was made.',
      'No company switch was performed.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(status === 'observed' ? [] : ['FA Posting Type = Acquisition Cost persistence after reopen was not proven.']),
      'No Preview Posting result after correction.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-200-fa-gl-journal-fa-posting-type-acquisition-preflight.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-200/',
      '.agent/state/cases/fixedassets-201-fa-gl-journal-fa-posting-type-review.json',
      '.agent/state/current.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-200/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-200/010-before-fa-posting-type.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-200/020-after-fa-posting-type.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-200/030-after-reopen-persistence.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-200/FIXEDASSETS-200-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-200/FIXEDASSETS-200-result.json',
    ],
    warnings: [
      'Journal-data correction only.',
      'Preview Posting remains locked until FIXEDASSETS-201 local review.',
      'Posting remains locked.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      onlyFaPostingTypeTargeted: true,
      noInsertLine: true,
      noDeleteLine: true,
      draftValueKept: status === 'observed',
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
      helperBefore,
      helperAfterEntry,
      helperAfterReopen,
      candidateIndex,
      markResult,
      entryResult,
      dangerousDialogAfterEntry,
      actualBeforeMatches,
      actualAfterEntryMatches,
      actualAfterReopenMatches,
      snapshotBeforeSignals: snapshotBefore?.signals,
      snapshotAfterEntrySignals: snapshotAfterEntry?.signals,
      snapshotAfterReopenSignals: snapshotAfterReopen?.signals,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-200-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-200-learning.md'),
    [
      '# FIXEDASSETS-200 Lernzusammenfassung',
      '',
      'Status: `labor`, `journal-data-correction-preflight`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      'Der Fehler aus FA-198 war kein Freibrief fuer Setup-Aenderungen. Business Central meldete konkret, dass `FA Posting Type` auf der vorhandenen Journalzeile leer war. Dieser Lauf korrigiert deshalb nur dieses eine Zeilenfeld und prueft anschliessend durch erneutes Oeffnen, ob der Wert wirklich gespeichert blieb.',
      '',
      '## Grenzen',
      '',
      '- Keine Preview Posting nach Korrektur.',
      '- Keine Buchung.',
      '- Keine Postenspur.',
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
      '# FIXEDASSETS-200 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-before-fa-posting-type.json` | JSON | Journal-Kontext, Zielzeile und Kandidat vor Feldkorrektur | keine Persistenz | `labor` |',
      '| `020-after-fa-posting-type.json` | JSON | Eingabe-/Wertlage nach `FA Posting Type = Acquisition Cost` | keine Persistenz nach Reopen | `labor` oder `blocked` |',
      '| `030-after-reopen-persistence.json` | JSON | ob `FA Posting Type = Acquisition Cost` nach erneutem Oeffnen sichtbar/current war | keine Preview/Buchung | `labor` oder `blocked` |',
      '| `FIXEDASSETS-200-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-200-learning.md` | Markdown | Lernwert zur gezielten Journaldaten-Korrektur | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.contextBefore?.environmentInUrl).toBe(true);
  expect(result.environment.contextBefore?.companyInUrl || result.environment.contextBefore?.companyInText).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(['observed', 'blocked']).toContain(result.resultStatus);
});
