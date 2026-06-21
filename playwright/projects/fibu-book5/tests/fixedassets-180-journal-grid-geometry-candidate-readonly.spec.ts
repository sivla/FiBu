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

const CASE_ID = 'FIXEDASSETS-180-JOURNAL-GRID-GEOMETRY-CANDIDATE-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-181-JOURNAL-GRID-GEOMETRY-CANDIDATE-REVIEW';
const TEST_ID = 'fixedassets-180';
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
      active_case_file: '.agent/state/cases/fixedassets-181-journal-grid-geometry-candidate-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-180-journal-grid-geometry-candidate-readonly.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-181: locally review the geometry/header-order helper live result before any FA G/L Journal value entry, Preview Posting or Post.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly-geometry-helper-probe' : 'blocked-readonly-geometry-helper-probe',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-180/FIXEDASSETS-180-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-181 local review; do not enter values, Preview Posting or Post.',
    },
  };
}

test('FIXEDASSETS-180 applies geometry/header-order journal-grid helper read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let snapshot: Awaited<ReturnType<typeof readReadonlyJournalSnapshot>> | undefined;
  let helperResult: ReturnType<typeof analyzeJournalCellCandidates> | undefined;
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

      await screenshot(page, 'fixedassets-180-010-geometry-candidate-readonly.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: helperResult.success ? 'labor' : 'rejected',
        bookUse: helperResult.success ? 'debug-candidate' : 'do-not-use',
        purpose:
          'FA-180 Read-only-Probe: prueft, ob der Geometry/Header-Helper genau einen Bal.-Account-No.-Kandidaten im Live-Journal findet.',
        expectedPageText: [/Fixed Asset G\/L Journals/i],
        knownLimitations: [
          'Read-only Helper-Probe.',
          'Keine Werteingabe.',
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
    blockedBy.push(...helperResult.blockedBy.map((reason) => `helper:${reason}`));
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 && Boolean(helperResult?.success) ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-180 found geometry/helper status ${helperResult?.status}; no values were entered.`
      : `FA-180 read-only geometry helper probe stayed safe but did not unlock value entry: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-geometry-candidate-readonly.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-180-geometry-journal-grid-candidate-readonly',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    snapshot,
    helperResult,
    blockedBy,
    screenshotCaptured,
    omitted: 'No full DOM dump, traces, videos, reports or auth artifacts stored.',
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-180-geometry-journal-grid-candidate-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-helper-probe',
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
      ...(helperResult ? [`Geometry/header-order helper status was ${helperResult.status}.`] : []),
      ...(helperResult?.success ? [`Candidate count was ${helperResult.editableCandidates.length}.`] : []),
      'No values were entered.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No journal line was created or deleted.',
      'No setup change was made.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      'Bal. Account No. = 82000 was not entered.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-180-journal-grid-geometry-candidate-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-180/',
      'playwright/projects/fibu-book5/img/fixedassets-180-010-geometry-candidate-readonly.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-180/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-180/010-geometry-candidate-readonly.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-180/FIXEDASSETS-180-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-180/FIXEDASSETS-180-result.json',
      'playwright/projects/fibu-book5/img/fixedassets-180-010-geometry-candidate-readonly.png',
    ],
    warnings: [
      'Read-only helper probe only.',
      'Do not enter values until FA-181 reviews this result.',
      'Do not open Preview Posting or Post from this result alone.',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      noValueEntry: true,
      noInsertLine: true,
      noDeleteLine: true,
      noCleanup: true,
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
      helperResult,
      snapshotSignals: snapshot?.signals,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-180-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-180-learning.md'),
    [
      '# FIXEDASSETS-180 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only-helper-probe`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Lernwert',
      '',
      'Der Lauf prueft nur die Stabilitaet der Geometry/Header-Kandidatenlogik im aktuellen BC-Journal. Ein erfolgreicher Kandidat ist noch keine Buchungsfreigabe.',
      '',
      '## Grenzen',
      '',
      '- Keine Werteingabe.',
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
      '# FIXEDASSETS-180 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-geometry-candidate-readonly.json` | JSON | Read-only Grid-Snapshot und Geometry/Header-Helper-Ergebnis | keine Werteingabe, keine Preview, keine Buchung | `labor`, `read-only` |',
      '| `FIXEDASSETS-180-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-180-learning.md` | Markdown | Lernwert Geometry/Header-Kandidaten | keine Postenspur | `labor` |',
      '| `fixedassets-180-010-geometry-candidate-readonly.screenshot.json` | Screenshot-Metadaten | sichtbarer Journal-Kontext der Read-only-Probe | keine Werteingabe | `labor` oder `rejected` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
  expect(result.flags.noValueEntry).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
});
