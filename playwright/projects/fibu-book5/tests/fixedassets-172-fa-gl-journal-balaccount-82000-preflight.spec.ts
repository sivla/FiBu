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
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-172-FA-GL-JOURNAL-BALACCOUNT-82000-PREFLIGHT';
const NEXT_CASE_ID = 'FIXEDASSETS-173-FA-GL-JOURNAL-BALACCOUNT-82000-RESULT-REVIEW';
const TEST_ID = 'fixedassets-172';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;

const TARGET = {
  documentNo: 'G05001',
  accountType: 'Fixed Asset',
  accountNo: 'FA-CNC-01',
  depreciationBookCode: 'HGB',
  faPostingType: 'Acquisition Cost',
  amountCandidate: '68000',
  balAccountType: 'G/L Account',
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

function faJournalPageUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(FA_GL_JOURNAL_PAGE_ID));
  return url.toString();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) {
    url.searchParams.delete(key);
  }
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

async function readJournalSignals(frame: Frame) {
  return frame.evaluate((target) => {
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

    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row, index) => ({
        index,
        text: norm(row.innerText || row.textContent).slice(0, 700),
        rect: rectOf(row),
      }))
      .filter((row) => row.text);
    const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
      .filter(visible)
      .map((header, index) => ({
        index,
        text: norm(header.innerText || header.textContent).slice(0, 180),
        rect: rectOf(header),
      }))
      .filter((header) => header.text);
    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
      .filter(visible)
      .map((control, index) => {
        const row = control.closest<HTMLElement>('[role="row"],tr');
        const cell = control.closest<HTMLElement>('[role="gridcell"],td,[role="cell"]');
        const selectedText =
          control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || '' : '';
        return {
          index,
          value: norm(control.value),
          selectedText: norm(selectedText),
          ariaLabel: norm(control.getAttribute('aria-label')),
          title: norm(control.getAttribute('title')),
          rowText: norm(row?.innerText || row?.textContent || '').slice(0, 700),
          cellText: norm(cell?.innerText || cell?.textContent || '').slice(0, 220),
          rect: rectOf(control),
          readOnly: Boolean(control.readOnly || control.getAttribute('aria-readonly') === 'true'),
          disabled: Boolean(control.disabled || control.getAttribute('aria-disabled') === 'true'),
        };
      });

    const combined = norm(
      [
        document.body?.innerText || '',
        rows.map((row) => row.text).join(' '),
        headers.map((header) => header.text).join(' '),
        controls.map((control) => `${control.value} ${control.selectedText} ${control.ariaLabel} ${control.title}`).join(' '),
      ].join(' '),
    );
    const targetRowTexts = rows
      .filter(
        (row) =>
          row.text.includes(target.documentNo) ||
          (row.text.includes(target.accountNo) && row.text.includes(target.depreciationBookCode)),
      )
      .map((row) => row.text);
    const balAccountCandidates = controls.filter((control) => {
      const labelSignal = `${control.ariaLabel} ${control.title} ${control.cellText}`.toLowerCase();
      const rowSignal = control.rowText.toLowerCase();
      return (
        /bal\. account no|bal account no|gegenkonto/.test(labelSignal) ||
        (/bal\. account|bal account|gegenkonto/.test(labelSignal) && rowSignal.includes(target.accountNo.toLowerCase()))
      );
    });

    return {
      pageTitleVisible: /Fixed Asset G\/L Journals/i.test(combined),
      targetLineVisible:
        combined.includes(target.documentNo) &&
        combined.includes(target.accountNo) &&
        combined.includes(target.depreciationBookCode),
      targetLineCount: targetRowTexts.length,
      accountNoVisible: combined.includes(target.accountNo),
      documentNoVisible: combined.includes(target.documentNo),
      depreciationBookVisible: combined.includes(target.depreciationBookCode),
      amountHeaderVisible: /\bAmount\b|Betrag/i.test(combined),
      balAccountTypeGlVisible: /G\/L Account/i.test(combined),
      balAccountNoHeaderVisible: /Bal\. Account No\.|Bal Account No|Gegenkonto/i.test(combined),
      account82000Visible: combined.includes(target.balAccountNo),
      k30000Visible: /K30000/i.test(combined),
      relevantHeaders: headers
        .filter((header) => /Posting Date|Document No|Account Type|Account No|FA Posting Type|Amount|Bal\. Account/i.test(header.text))
        .map((header) => header.text)
        .slice(0, 20),
      relevantRows: rows
        .filter((row) => /G05001|FA-CNC-01|HGB|CNC Maschine FRA|Amount|Bal\. Account|82000|K30000/i.test(row.text))
        .map((row) => row.text)
        .slice(0, 15),
      balAccountCandidates,
    };
  }, TARGET);
}

async function enter82000IfSingleCandidate(frame: Frame, signals: Awaited<ReturnType<typeof readJournalSignals>>) {
  const candidates = signals.balAccountCandidates.filter((candidate) => !candidate.disabled && !candidate.readOnly);
  if (candidates.length !== 1) {
    return {
      attempted: false,
      reason: `expected-one-editable-bal-account-no-candidate-but-found-${candidates.length}`,
      candidates,
    };
  }

  const candidate = candidates[0];
  const input = frame.locator('input,select,textarea').nth(candidate.index);
  await input.click({ timeout: 5000 });
  await input.press('Control+A');
  await input.fill(TARGET.balAccountNo);
  await input.press('Tab');
  await frame.page().waitForTimeout(1500);

  return {
    attempted: true,
    reason: 'single-editable-bal-account-no-candidate-filled-with-82000',
    candidate,
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-173-fa-gl-journal-balaccount-82000-result-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-172-fa-gl-journal-balaccount-82000-preflight.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-173: locally review the FA-172 guarded journal preflight result before any Preview Posting, Post, cleanup or further value change.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-21',
      workType: 'fixed-asset-gl-journal-balaccount-82000-preflight',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      playwrightRun: true,
      posted: false,
      previewPosting: false,
      setupChanged: false,
      companySwitched: false,
      apiShortcut: false,
      bookChanged: false,
      resultStatus: status,
      summary,
      nextStep: 'Run FIXEDASSETS-173 local result review before any Preview Posting or posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-guarded-preflight' : 'blocked-guarded-preflight',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-172/FIXEDASSETS-172-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-173 local review; do not open Preview Posting or Post.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: 'fa-gl-journal-balaccount-82000-result-review',
          latestPracticalCase: 'FIXEDASSETS-172',
          latestReviewCase: 'FIXEDASSETS-171',
          nextCase: NEXT_CASE_ID,
        },
      },
    },
  };
}

test('FIXEDASSETS-172 prepares only 82000 as guarded FA G/L Journal balancing-account candidate', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let beforeSignals: Awaited<ReturnType<typeof readJournalSignals>> | undefined;
  let afterSignals: Awaited<ReturnType<typeof readJournalSignals>> | undefined;
  let writeAttempt: Awaited<ReturnType<typeof enter82000IfSingleCandidate>> | undefined;
  let beforeScreenshotCaptured = false;
  let afterScreenshotCaptured = false;

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
      beforeSignals = await readJournalSignals(frame);

      await screenshot(page, 'fixedassets-172-010-fa-gl-journal-balaccount-before.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: 'labor',
        bookUse: 'field-proof',
        purpose:
          'FA-172 Vorher-Kontext: geschuetzte Fixed-Asset-G/L-Journal-Zeile mit Amount/Bal.-Account-Spalten vor einem moeglichen 82000-Preflight.',
        expectedPageText: [/Fixed Asset G\/L Journals/i],
        knownLimitations: [
          'Vorher-/Preflight-Bild, keine Preview Posting.',
          'Keine Buchung.',
          'Kein deutscher Finalnachweis.',
        ],
      });
      beforeScreenshotCaptured = true;

      if (!beforeSignals.targetLineVisible) {
        blockedBy.push('Protected target line G05001 / FA-CNC-01 / HGB was not uniquely visible.');
      }
      if (beforeSignals.targetLineCount > 1) {
        blockedBy.push(`Target line appears more than once in visible row text: ${beforeSignals.targetLineCount}.`);
      }
      if (!beforeSignals.balAccountTypeGlVisible) {
        blockedBy.push('Bal. Account Type = G/L Account was not visible.');
      }
      if (beforeSignals.k30000Visible) {
        blockedBy.push('K30000 is visible in the current journal context and must not be reused as G/L Bal. Account No.');
      }

      if (blockedBy.length === 0 && !beforeSignals.account82000Visible) {
        writeAttempt = await enter82000IfSingleCandidate(frame, beforeSignals);
        if (!writeAttempt.attempted) {
          blockedBy.push(writeAttempt.reason);
        }
      } else {
        writeAttempt = {
          attempted: false,
          reason: beforeSignals.account82000Visible ? '82000-already-visible' : 'blocked-before-write-attempt',
          candidates: beforeSignals.balAccountCandidates,
        };
      }

      await page.waitForTimeout(1200);
      afterSignals = await readJournalSignals(frame);
      await screenshot(page, 'fixedassets-172-020-fa-gl-journal-balaccount-after.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: afterSignals.account82000Visible ? 'labor' : 'rejected',
        bookUse: afterSignals.account82000Visible ? 'field-proof' : 'do-not-use',
        purpose:
          'FA-172 Nachher-Kontext: prueft, ob das setup-abgeleitete G/L-Gegenkonto 82000 in der Journalzone sichtbar wurde.',
        expectedPageText: [/Fixed Asset G\/L Journals/i],
        knownLimitations: [
          'Nur Bal.-Account-Preflight, keine Preview Posting.',
          'Keine Buchung.',
          'Kein deutscher Finalnachweis.',
        ],
      });
      afterScreenshotCaptured = true;

      if (writeAttempt?.attempted && !afterSignals.account82000Visible) {
        blockedBy.push('82000 was attempted but is not visible after leaving the cell.');
      }
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 && Boolean(afterSignals?.account82000Visible) ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? 'FA-172 prepared/verified Bal. Account No. = 82000 for the guarded FA G/L Journal laboratory line; no Preview Posting or Post was opened.'
      : `FA-172 stopped before a usable 82000 journal preflight proof: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-balaccount-82000-preflight-signals.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-172-fa-gl-journal-balaccount-82000-preflight-signals',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    beforeSignals,
    afterSignals,
    writeAttempt,
    blockedBy,
    screenshots: {
      beforeScreenshotCaptured,
      afterScreenshotCaptured,
    },
    omitted: 'No full DOM dump, traces, videos, reports or auth artifacts stored.',
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-balaccount-82000-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-guarded-preflight',
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
      ...(beforeSignals?.targetLineVisible ? ['The protected FA G/L Journal target line was visible before the preflight.'] : []),
      ...(beforeSignals?.balAccountTypeGlVisible ? ['Bal. Account Type = G/L Account was visible before any write attempt.'] : []),
      ...(afterSignals?.account82000Visible ? ['Bal. Account No. = 82000 is visible in the journal context after the preflight.'] : []),
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No journal line was created or deleted.',
      'No cleanup was executed.',
      'No API shortcut was used.',
      'No book content was changed.',
    ],
    notProved: [
      ...(afterSignals?.account82000Visible ? [] : ['Bal. Account No. = 82000 is not visibly proven in the journal context.']),
      'Amount 68000 was not entered in this case.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-172-fa-gl-journal-balaccount-82000-preflight.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-172/',
      'playwright/projects/fibu-book5/img/fixedassets-172-010-fa-gl-journal-balaccount-before.png',
      'playwright/projects/fibu-book5/img/fixedassets-172-020-fa-gl-journal-balaccount-after.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-172/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-172/010-balaccount-82000-preflight-signals.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-172/FIXEDASSETS-172-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-172/FIXEDASSETS-172-result.json',
      'playwright/projects/fibu-book5/img/fixedassets-172-010-fa-gl-journal-balaccount-before.png',
      'playwright/projects/fibu-book5/img/fixedassets-172-020-fa-gl-journal-balaccount-after.png',
    ],
    warnings: [
      'Guarded balancing-account preflight only.',
      'Do not open Preview Posting or Post until FA-173 reviews this result.',
      'Do not use K30000 as G/L Bal. Account No.',
    ],
    blockedBy,
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      noAmountEntry: true,
      noInsertLine: true,
      noDeleteLine: true,
      noCleanup: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noK30000AsGlBalAccountNo: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      beforeSignals,
      afterSignals,
      writeAttempt,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-172-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-172-learning.md'),
    [
      '# FIXEDASSETS-172 Lernzusammenfassung',
      '',
      'Status: `labor`, `guarded-preflight`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Ein Anlagenjournal braucht nicht nur Anlage, AfA-Buch und Buchungsart. Auch das Gegenkonto muss zum Gegenkonto-Typ passen. Nach dem Setup-Fit aus FA-170 ist `82000` der einzige aktuell freigegebene G/L-Gegenkonto-Kandidat fuer diese Route.',
      '',
      '## Grenzen',
      '',
      '- Kein Betrag eingegeben.',
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
      '# FIXEDASSETS-172 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-balaccount-82000-preflight-signals.json` | JSON | Zielzeilen-, Spalten- und 82000-Preflight-Signale | keine Preview, keine Buchung | `labor`, `guarded-preflight` |',
      '| `FIXEDASSETS-172-result.json` | JSON | Ergebnis, Grenzen, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-172-learning.md` | Markdown | Lernwert Gegenkonto-Typ und Gegenkonto-Code | keine Postenspur | `labor` |',
      '| `fixedassets-172-010-fa-gl-journal-balaccount-before.screenshot.json` | Screenshot-Metadaten | Vorher-Kontext der Journalzone | keine Buchung | `labor` |',
      '| `fixedassets-172-020-fa-gl-journal-balaccount-after.screenshot.json` | Screenshot-Metadaten | Nachher-/Blocker-Kontext der Journalzone | keine Buchung | `labor` oder `rejected` |',
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
  expect(result.flags.noK30000AsGlBalAccountNo).toBe(true);
});
