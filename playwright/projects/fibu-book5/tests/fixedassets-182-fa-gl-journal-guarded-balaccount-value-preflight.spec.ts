import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { analyzeJournalCellCandidates } from '../../../core/bc/journal-grid-candidates';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-182-FA-GL-JOURNAL-GUARDED-BALACCOUNT-VALUE-PREFLIGHT';
const NEXT_CASE_ID = 'FIXEDASSETS-183-FA-GL-JOURNAL-BALACCOUNT-VALUE-REVIEW';
const TEST_ID = 'fixedassets-182';
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

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-183-fa-gl-journal-balaccount-value-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-182-fa-gl-journal-guarded-balaccount-value-preflight.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-183: locally review FA-182 value-entry evidence before any Preview Posting or Post.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-guarded-value-preflight' : 'blocked-guarded-value-preflight',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-182/FIXEDASSETS-182-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-183 local review; do not open Preview Posting or Post.',
    },
  };
}

test('FIXEDASSETS-182 enters Bal. Account No. 82000 through guarded journal candidate', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let snapshotAfterEntry: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let helperResult: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let helperResultAfterEntry: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
  let candidateIndex: number | undefined;
  let screenshotCaptured = false;

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
      await moveVisibleGridToBalAccountColumns(page);
      snapshot = await readReadonlyJournalSnapshot(frame);
      helperResult = analyzeJournalCellCandidates(
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

      if (helperResult.status !== 'single-editable-candidate' || helperResult.editableCandidates.length !== 1) {
        blockedBy.push(`helper-before-entry:${helperResult.status}`);
      } else {
        candidateIndex = helperResult.editableCandidates[0].index;
        if (typeof candidateIndex !== 'number') {
          blockedBy.push('candidate-index-missing');
        }
        const marked = await frame.evaluate((index) => {
          function visible(element: HTMLElement) {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          }
          const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')].filter(visible);
          const target = controls.find((control, visibleIndex) => visibleIndex === index);
          if (!target || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return false;
          target.setAttribute('data-codex-fa182-target', 'true');
          return true;
        }, candidateIndex);
        if (!marked) {
          blockedBy.push(`candidate-not-marked:${candidateIndex}`);
        } else {
          const targetControl = frame.locator('[data-codex-fa182-target="true"]');
          await expect(targetControl).toBeVisible({ timeout: 10_000 });
          await targetControl.fill(TARGET.balAccountNo);
          await targetControl.press('Tab');
          await page.waitForTimeout(1200);
          snapshotAfterEntry = await readReadonlyJournalSnapshot(frame);
          helperResultAfterEntry = analyzeJournalCellCandidates(
            {
              headers: snapshotAfterEntry.headers,
              rows: snapshotAfterEntry.rows,
              controls: snapshotAfterEntry.controls,
            },
            {
              rowRequiredSignals: [TARGET.documentNo, TARGET.accountNo, TARGET.depreciationBookCode],
              columnSignals: ['Bal. Account No.', 'Bal Account No', 'Gegenkonto'],
              forbiddenSignals: ['K30000'],
              expectedValue: TARGET.balAccountNo,
            },
          );
          if (!helperResultAfterEntry.visibleSignals.expectedValueVisible) {
            blockedBy.push(`value-not-visible-after-entry:${helperResultAfterEntry.status}`);
          }
        }
      }

      await screenshot(page, 'fixedassets-182-010-balaccount-82000-value-preflight.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: helperResult.success ? 'labor' : 'rejected',
        bookUse: helperResult.success ? 'debug-candidate' : 'do-not-use',
        purpose:
          'FA-182 Guarded Value Preflight: prueft, ob 82000 im erneut bestaetigten Bal.-Account-No.-Kandidaten sichtbar gesetzt wurde.',
        expectedPageText: [/Fixed Asset G\/L Journals/i],
        knownLimitations: [
          'Guarded Value Preflight.',
          'Werteingabe nur fuer Bal. Account No. = 82000.',
          'Keine Preview Posting.',
          'Keine Buchung.',
          'Kein deutscher Finalnachweis.',
        ],
      });
      screenshotCaptured = true;
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (helperResult && !helperResult.success) {
    blockedBy.push(...helperResult.blockedBy.map((reason) => `helper-before-entry:${reason}`));
  }
  if (helperResultAfterEntry && !helperResultAfterEntry.visibleSignals.expectedValueVisible) {
    blockedBy.push(...helperResultAfterEntry.blockedBy.map((reason) => `helper-after-entry:${reason}`));
  }

  const status: 'observed' | 'blocked' =
    blockedBy.length === 0 && Boolean(helperResultAfterEntry?.visibleSignals.expectedValueVisible) ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? 'FA-182 entered 82000 into the re-confirmed Bal. Account No. candidate and proved the value visible in the same journal candidate.'
      : `FA-182 stayed safe but did not prove Bal. Account No. = 82000: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-balaccount-82000-value-preflight.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-182-balaccount-82000-value-preflight',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    snapshotBeforeEntry: snapshot,
    helperResultBeforeEntry: helperResult,
    candidateIndex,
    snapshotAfterEntry,
    helperResultAfterEntry,
    blockedBy,
    screenshotCaptured,
    omitted: 'No full DOM dump, traces, videos, reports or auth artifacts stored.',
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-182-balaccount-82000-value-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-guarded-value-preflight',
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
      ...(snapshot?.signals.fixedAssetGlJournalsVisible ? ['Fixed Asset G/L Journals context was visible.'] : []),
      ...(snapshot?.signals.balAccountNoHeaderVisible ? ['Bal. Account No. header signal was visible.'] : []),
      ...(helperResult ? [`Geometry/header-order helper status before entry was ${helperResult.status}.`] : []),
      ...(helperResult?.success ? [`Candidate count before entry was ${helperResult.editableCandidates.length}.`] : []),
      ...(candidateIndex !== undefined ? [`Candidate index was ${candidateIndex}.`] : []),
      ...(helperResultAfterEntry?.visibleSignals.expectedValueVisible ? ['Bal. Account No. = 82000 was visible/current after entry.'] : []),
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No journal line was created or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(status === 'observed' ? [] : ['Bal. Account No. = 82000 was not proven visible/current.']),
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-182-fa-gl-journal-guarded-balaccount-value-preflight.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-182/',
      'playwright/projects/fibu-book5/img/fixedassets-182-010-balaccount-82000-value-preflight.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-182/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-182/010-balaccount-82000-value-preflight.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-182/FIXEDASSETS-182-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-182/FIXEDASSETS-182-result.json',
      'playwright/projects/fibu-book5/img/fixedassets-182-010-balaccount-82000-value-preflight.png',
    ],
    warnings: [
      'Guarded value preflight only.',
      'Draft value 82000 may remain as intentional laboratory preflight state if observed.',
      'Do not open Preview Posting or Post from this result alone.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      noValueEntry: status !== 'observed',
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
      helperResultBeforeEntry: helperResult,
      helperResultAfterEntry,
      candidateIndex,
      snapshotBeforeEntrySignals: snapshot?.signals,
      snapshotAfterEntrySignals: snapshotAfterEntry?.signals,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-182-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-182-learning.md'),
    [
      '# FIXEDASSETS-182 Lernzusammenfassung',
      '',
      'Status: `labor`, `guarded-value-preflight`, `draft-value-kept-if-observed`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      'Der Lauf prueft, ob ein zuvor reviewter Journalgrid-Kandidat sicher per UI mit dem setup-abgeleiteten Gegenkonto 82000 gefuellt werden kann. Der sichtbare Feldwert ist ein Preflight-Nachweis, noch keine Buchungsfreigabe.',
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
      '# FIXEDASSETS-182 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-balaccount-82000-value-preflight.json` | JSON | Vorher-/Nachher-Snapshot, Kandidat und sichtbaren Wert `82000` | keine Preview, keine Buchung | `labor`, `guarded-value-preflight` |',
      '| `FIXEDASSETS-182-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-182-learning.md` | Markdown | Lernwert der bewachten Journal-Werteingabe | keine Postenspur | `labor` |',
      '| `fixedassets-182-010-balaccount-82000-value-preflight.screenshot.json` | Screenshot-Metadaten | sichtbarer Journal-Kontext nach Werteingabe | keine Preview/Buchung | `labor` oder `rejected` |',
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
});
