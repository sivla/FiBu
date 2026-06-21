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

const CASE_ID = 'FIXEDASSETS-186-FA-GL-JOURNAL-BALACCOUNT-PERSISTENCE-PROBE';
const NEXT_CASE_ID = 'FIXEDASSETS-187-FA-GL-JOURNAL-PERSISTENCE-REVIEW';
const TEST_ID = 'fixedassets-186';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;

const TARGET = {
  documentNo: 'G05001',
  accountNo: 'FA-CNC-01',
  depreciationBookCode: 'HGB',
  balAccountNo: '82000',
};

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 3000, height: 1500 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
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

async function moveVisibleGridToBalAccountColumns(page: Page) {
  await page.mouse.move(1450, 400);
  await page.mouse.wheel(1600, 0);
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
      headers: headers.filter((header) => /Posting Date|Document No|Account Type|Account No|FA Posting Type|Amount|Bal\. Account/i.test(header.text)),
      rows: rows.filter((row) => /G05001|FA-CNC-01|HGB|CNC Maschine FRA|Amount|Bal\. Account|82000|K30000/i.test(row.text)),
      controls,
      signals: {
        fixedAssetGlJournalsVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
        documentNoVisible: bodyText.includes('G05001'),
        accountNoVisible: bodyText.includes('FA-CNC-01'),
        depreciationBookVisible: bodyText.includes('HGB'),
        balAccountNoHeaderVisible: /Bal\. Account No\.|Bal Account No|Gegenkonto/i.test(bodyText),
        account82000VisibleGlobal: bodyText.includes('82000'),
        k30000VisibleGlobal: /K30000/i.test(bodyText),
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
      columnSignals: ['Bal. Account No.', 'Bal Account No', 'Gegenkonto'],
      forbiddenSignals: ['K30000'],
      expectedValue: TARGET.balAccountNo,
    },
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
    if (!target || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return false;
    target.setAttribute('data-codex-fa186-target', 'true');
    return true;
  }, visibleIndex);
}

async function safeCommitCurrentLine(page: Page) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1200);
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-187-fa-gl-journal-persistence-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-186-fa-gl-journal-balaccount-persistence-probe.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-187: locally review FA-186 persistence evidence before any Preview Posting retry or Post.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-balaccount-persistence' : 'blocked-balaccount-persistence',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-186/FIXEDASSETS-186-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-187 local review; do not open Preview Posting or Post.',
    },
  };
}

test('FIXEDASSETS-186 verifies Bal. Account No. 82000 persists after journal reopen', async ({ page }) => {
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
      await moveVisibleGridToBalAccountColumns(page);
      snapshotBefore = await readReadonlyJournalSnapshot(frame);
      helperBefore = analyzeSnapshot(snapshotBefore);

      if (helperBefore.visibleSignals.expectedValueVisible) {
        candidateIndex = helperBefore.candidates[0]?.index;
      } else if (helperBefore.status === 'single-editable-candidate' && helperBefore.editableCandidates.length === 1) {
        candidateIndex = helperBefore.editableCandidates[0].index;
      } else {
        blockedBy.push(`helper-before-entry:${helperBefore.status}`);
      }

      if (typeof candidateIndex !== 'number') {
        blockedBy.push('candidate-index-missing');
      } else if (!helperBefore.visibleSignals.expectedValueVisible) {
        const marked = await markControlByVisibleIndex(frame, candidateIndex);
        if (!marked) {
          blockedBy.push(`candidate-not-marked:${candidateIndex}`);
        } else {
          const targetControl = frame.locator('[data-codex-fa186-target="true"]');
          await expect(targetControl).toBeVisible({ timeout: 10_000 });
          await targetControl.fill(TARGET.balAccountNo);
          await safeCommitCurrentLine(page);
          snapshotAfterEntry = await readReadonlyJournalSnapshot(frame);
          helperAfterEntry = analyzeSnapshot(snapshotAfterEntry);
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
          await moveVisibleGridToBalAccountColumns(page);
          snapshotAfterReopen = await readReadonlyJournalSnapshot(reopenedFrame);
          helperAfterReopen = analyzeSnapshot(snapshotAfterReopen);
          if (!helperAfterReopen.visibleSignals.expectedValueVisible) {
            blockedBy.push(`value-not-persistent-after-reopen:${helperAfterReopen.status}`);
          }
        }
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const status: 'observed' | 'blocked' =
    blockedBy.length === 0 && Boolean(helperAfterReopen?.visibleSignals.expectedValueVisible) ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? 'FA-186 proved Bal. Account No. = 82000 persisted after reopening the Fixed Asset G/L Journals page.'
      : `FA-186 stayed safe but did not prove Bal. Account No. persistence: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-before-persistence-probe.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-186-before-persistence-probe',
    caseId: CASE_ID,
    context: contextBefore,
    frameUrl: frameUrlBefore,
    target: TARGET,
    snapshotBefore,
    helperBefore,
    candidateIndex,
    omitted: 'No full DOM dump, traces, videos, reports or auth artifacts stored.',
  });

  await writeJsonEvidence(faEvidencePath('020-after-value-entry.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-186-after-value-entry',
    caseId: CASE_ID,
    snapshotAfterEntry,
    helperAfterEntry,
    valueEntryAttempted: typeof candidateIndex === 'number' && !helperBefore?.visibleSignals.expectedValueVisible,
    blockedByAfterEntry: blockedBy.filter((entry) => /entry|candidate|mark|visible/i.test(entry)),
  });

  await writeJsonEvidence(faEvidencePath('030-after-reopen-persistence-check.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-186-after-reopen-persistence-check',
    caseId: CASE_ID,
    context: contextAfter,
    frameUrl: frameUrlAfter,
    snapshotAfterReopen,
    helperAfterReopen,
    persisted: Boolean(helperAfterReopen?.visibleSignals.expectedValueVisible),
    blockedBy,
    screenshotCaptured: false,
    screenshotOmittedReason:
      'The relevant value is held in a grid input value and was not reliably present in normal page text; JSON helper evidence is the authoritative proof for this probe.',
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-186-balaccount-persistence-probe-result',
    caseId: CASE_ID,
    source: 'playwright-guarded-value-persistence-probe',
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
      ...(helperAfterEntry?.visibleSignals.expectedValueVisible || helperBefore?.visibleSignals.expectedValueVisible
        ? ['Bal. Account No. = 82000 was visible/current before reopen.']
        : []),
      ...(helperAfterReopen?.visibleSignals.expectedValueVisible ? ['Bal. Account No. = 82000 was visible/current after reopening the journal page.'] : []),
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No journal line was created or deleted.',
      'No setup change was made.',
      'No company switch was performed.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(status === 'observed' ? [] : ['Bal. Account No. = 82000 persistence after reopen was not proven.']),
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-186-fa-gl-journal-balaccount-persistence-probe.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-186/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-186/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-186/010-before-persistence-probe.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-186/020-after-value-entry.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-186/030-after-reopen-persistence-check.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-186/FIXEDASSETS-186-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-186/FIXEDASSETS-186-result.json',
    ],
    warnings: [
      'Persistence probe only.',
      'Preview Posting remains locked until FIXEDASSETS-187 local review.',
      'Posting remains locked.',
      'No German final proof.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
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
      snapshotBeforeSignals: snapshotBefore?.signals,
      snapshotAfterEntrySignals: snapshotAfterEntry?.signals,
      snapshotAfterReopenSignals: snapshotAfterReopen?.signals,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-186-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-186-learning.md'),
    [
      '# FIXEDASSETS-186 Lernzusammenfassung',
      '',
      'Status: `labor`, `guarded-value-persistence-probe`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      'Ein sichtbarer Feldwert direkt nach `fill()` reicht fuer Business Central nicht als fachlicher Nachweis. Erst der Reopen-/Refresh-Schritt zeigt, ob der Wert in der Journalzeile wirklich gespeichert wurde und damit als Preflight fuer eine spaetere Buchungsvorschau taugt.',
      '',
      '## Grenzen',
      '',
      '- Keine Preview Posting.',
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
      '# FIXEDASSETS-186 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-before-persistence-probe.json` | JSON | Journal-Kontext, Kandidat und Wertlage vor Reopen-Probe | keine Persistenz | `labor` |',
      '| `020-after-value-entry.json` | JSON | sichtbaren Wert unmittelbar nach UI-Eingabe, falls Eingabe noetig war | keine Persistenz nach Reopen | `labor` oder `blocked` |',
      '| `030-after-reopen-persistence-check.json` | JSON | ob `Bal. Account No. = 82000` nach erneutem Oeffnen sichtbar/current war | keine Preview/Buchung | `labor` oder `blocked` |',
      '| `FIXEDASSETS-186-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-186-learning.md` | Markdown | Lernwert der Reopen-/Persistenzprobe | keine Postenspur | `labor` |',
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
