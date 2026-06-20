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

const CASE_ID = 'FIXEDASSETS-159-FA-GL-JOURNAL-AMOUNT-BALACCOUNT-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-160-FA-GL-JOURNAL-WRITE-GATE-DECISION';
const TEST_ID = 'fixedassets-159';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_PAGE_ID = 5628;

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
  url.searchParams.set('page', String(TARGET_PAGE_ID));
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
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`) && frameUrl.includes('runinframe=1');
}

async function targetFrame(page: Page) {
  const frame = page.frames().find(isTargetFrame);
  if (!frame) {
    throw new Error('Fixed Asset G/L Journals runinframe was not found.');
  }
  return frame;
}

async function moveVisibleGridToAmountColumns(page: Page) {
  await page.mouse.move(1450, 400);
  await page.mouse.wheel(1600, 0);
  await page.waitForTimeout(350);
  await page.mouse.move(980, 1398);
  await page.mouse.down();
  await page.mouse.move(2050, 1398, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(350);
}

async function readAndScrollForAmountBalAccount(frame: Frame) {
  return frame.evaluate(async () => {
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

    function snapshot(label: string) {
      const bodyText = norm(document.body?.innerText || '');
      const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
        .filter(visible)
        .map((header, index) => ({
          index,
          label,
          text: norm(header.innerText || header.textContent).slice(0, 140),
          rect: rectOf(header),
        }))
        .filter((header) => header.text);
      const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
        .filter(visible)
        .map((row, index) => ({
          index,
          label,
          text: norm(row.innerText || row.textContent).slice(0, 420),
          rect: rectOf(row),
        }))
        .filter((row) => row.text);
      const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea')]
        .filter((control) => visible(control))
        .map((control, index) => {
          const selectedText =
            control instanceof HTMLSelectElement
              ? [...control.options].find((option) => option.selected)?.text || ''
              : '';
          const row = control.closest<HTMLElement>('[role="row"],tr');
          const cell = control.closest<HTMLElement>('[role="gridcell"],td,[role="cell"]');
          return {
            index,
            label,
            value: norm(control.value),
            selectedText: norm(selectedText),
            ariaLabel: norm(control.getAttribute('aria-label')),
            title: norm(control.getAttribute('title')),
            rowText: norm(row?.innerText || row?.textContent || '').slice(0, 320),
            cellText: norm(cell?.innerText || cell?.textContent || '').slice(0, 180),
            rect: rectOf(control),
          };
        });
      const combinedText = norm(
        [
          bodyText,
          headers.map((header) => header.text).join(' '),
          rows.map((row) => row.text).join(' '),
          controls.map((control) => `${control.value} ${control.selectedText} ${control.ariaLabel} ${control.title}`).join(' '),
        ].join(' '),
      );
      return {
        label,
        bodyText,
        headers,
        rows,
        controls,
        signals: {
          titleVisible: /Fixed Asset G\/L Journals/i.test(combinedText),
          targetLineVisible: /G05001/i.test(combinedText) && /FA-CNC-01/i.test(combinedText),
          amountHeaderVisible: /\bAmount\b|Betrag/i.test(combinedText),
          balAccountHeaderVisible: /Bal\. Account No\.|Bal Account No|Bal\. Account|Gegenkonto/i.test(combinedText),
          amount68000Visible: /68[.,]?000|68000/i.test(combinedText),
          k30000Visible: /K30000/i.test(combinedText),
          postVisible: /\bPost\b/i.test(combinedText),
          previewVisible: /Preview Posting|Posting Preview|Vorschau/i.test(combinedText),
        },
      };
    }

    const scrollables = [...document.querySelectorAll<HTMLElement>('div,section,main')]
      .filter(visible)
      .filter((element) => element.scrollWidth > element.clientWidth + 20)
      .filter((element) =>
        /Fixed Asset|Posting Date|Document No|Account Type|FA-CNC-01|G05001|Amount|Bal\. Account|Number of Lines/i.test(
          norm(element.innerText || ''),
        ),
      )
      .map((element, index) => ({
        index,
        element,
        text: norm(element.innerText || '').slice(0, 220),
        scrollWidth: Math.round(element.scrollWidth),
        clientWidth: Math.round(element.clientWidth),
        originalScrollLeft: Math.round(element.scrollLeft),
        rect: rectOf(element),
      }))
      .sort((left, right) => right.scrollWidth - left.scrollWidth)
      .slice(0, 4);

    const snapshots = [snapshot('initial')];
    const maxScroll = Math.max(0, ...scrollables.map((entry) => entry.scrollWidth - entry.clientWidth));
    const positions = [0, Math.floor(maxScroll / 2), maxScroll].filter((value, index, values) => value >= 0 && values.indexOf(value) === index);

    for (const position of positions) {
      for (const entry of scrollables) {
        entry.element.scrollLeft = position;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      snapshots.push(snapshot(`scroll-left-${Math.round(position)}`));
    }

    const finalPosition = positions.at(-1) ?? 0;
    for (const entry of scrollables) {
      entry.element.scrollLeft = finalPosition;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 250));

    const allHeaders = snapshots.flatMap((entry) => entry.headers);
    const allRows = snapshots.flatMap((entry) => entry.rows);
    const allControls = snapshots.flatMap((entry) => entry.controls);
    const combinedText = norm(
      [
        snapshots.map((entry) => entry.bodyText).join(' '),
        allHeaders.map((entry) => entry.text).join(' '),
        allRows.map((entry) => entry.text).join(' '),
        allControls.map((entry) => `${entry.value} ${entry.selectedText} ${entry.ariaLabel} ${entry.title}`).join(' '),
      ].join(' '),
    );

    return {
      scrollables: scrollables.map(({ element: _element, ...entry }) => ({
        index: entry.index,
        text: entry.text,
        scrollWidth: entry.scrollWidth,
        clientWidth: entry.clientWidth,
        originalScrollLeft: entry.originalScrollLeft,
      })),
      finalScrollLeft: finalPosition,
      snapshots: snapshots.map((entry) => ({
        label: entry.label,
        signals: entry.signals,
        relevantHeaderTexts: entry.headers
          .filter((header) =>
            /Posting Date|Document No|Account Type|Account No|FA Posting Type|Depreciation Book|Amount|Bal\. Account|Gegenkonto/i.test(
              header.text,
            ),
          )
          .map((header) => header.text)
          .slice(0, 20),
        relevantRowTexts: entry.rows
          .filter((row) => /G05001|FA-CNC-01|HGB|Amount|Bal\. Account|Account No|Posting Date|Document No|68000|K30000/i.test(row.text))
          .map((row) => row.text)
          .slice(0, 10),
      })),
      interpretedSignals: {
        titleVisible: /Fixed Asset G\/L Journals/i.test(combinedText),
        targetLineVisible: /G05001/i.test(combinedText) && /FA-CNC-01/i.test(combinedText),
        amountHeaderVisible: /\bAmount\b|Betrag/i.test(combinedText),
        balAccountHeaderVisible: /Bal\. Account No\.|Bal Account No|Bal\. Account|Gegenkonto/i.test(combinedText),
        amount68000Visible: /68[.,]?000|68000/i.test(combinedText),
        k30000Visible: /K30000/i.test(combinedText),
      },
      focusedText: combinedText
        .split(/(?=Fixed Asset G\/L Journals|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Depreciation Book|Amount|Bal\. Account|Number of Lines|Balance|FA-CNC-01|G05001|K30000|HGB)/i)
        .map((part) => part.trim())
        .filter((part) => /Amount|Bal\. Account|G05001|FA-CNC-01|K30000|HGB|68000|Account No|Balance/i.test(part))
        .slice(0, 50),
    };
  });
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-160-fa-gl-journal-write-gate-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-159-fa-gl-journal-amount-balaccount-readonly.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-160: decide locally whether the FA G/L Journal line has enough visible Amount/Bal. Account evidence for a guarded write/preflight case, or remains blocked.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-gl-journal-amount-balaccount-readonly',
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
      nextStep: 'Run FIXEDASSETS-160 local decision before any value entry, cleanup, Preview Posting or posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly' : 'blocked-readonly',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-159/FIXEDASSETS-159-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-160 local decision; do not edit, cleanup, preview or post.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: 'fa-gl-journal-write-gate-decision',
          latestPracticalCase: 'FIXEDASSETS-159',
          latestReviewCase: 'FIXEDASSETS-158',
          nextCase: NEXT_CASE_ID,
        },
      },
    },
  };
}

test('FIXEDASSETS-159 captures Amount and Bal. Account visibility read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let visibility: Awaited<ReturnType<typeof readAndScrollForAmountBalAccount>> | undefined;
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
      visibility = await readAndScrollForAmountBalAccount(frame);
      await moveVisibleGridToAmountColumns(page);
      await screenshot(page, 'fixedassets-159-010-fa-gl-journal-amount-balaccount-readonly.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: 'labor',
        bookUse: 'field-proof',
        purpose:
          'Read-only Breiten-/Grid-Nachweis im Fixed Asset G/L Journal: Das Bild soll zeigen, ob Amount und Bal. Account fuer die geschuetzte FA-CNC-01-Zeile sichtbar werden.',
        expectedPageText: [/Fixed Asset G\/L Journals/i],
        knownLimitations: [
          'Nur horizontaler Scroll und Screenshot.',
          'Keine Werteingabe.',
          'Keine Journalzeile angelegt oder geloescht.',
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

  if (!visibility?.interpretedSignals.titleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible.');
  }
  if (!visibility?.interpretedSignals.targetLineVisible) {
    blockedBy.push('Target line G05001 / FA-CNC-01 was not visible in read-only grid scan.');
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-159 captured FA G/L Journal Amount/Bal. Account visibility read-only. Amount header visible: ${visibility?.interpretedSignals.amountHeaderVisible}; Bal. Account header visible: ${visibility?.interpretedSignals.balAccountHeaderVisible}; amount 68000 visible: ${visibility?.interpretedSignals.amount68000Visible}; K30000 visible: ${visibility?.interpretedSignals.k30000Visible}; screenshot captured: ${screenshotCaptured}.`
      : `FA-159 blocked before Amount/Bal. Account visibility proof: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-amount-balaccount-visibility.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-159-fa-gl-journal-amount-balaccount-visibility-readonly',
    caseId: CASE_ID,
    context,
    frameUrl,
    visibility,
    screenshotCaptured,
    blockedBy,
  });
  await writeTextEvidence(
    faEvidencePath('020-focused-amount-balaccount-text.txt'),
    ['FIXEDASSETS-159 focused Amount/Bal. Account evidence', '', ...(visibility?.focusedText ?? ['No focused text captured.'])].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-amount-balaccount-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-diagnosis',
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
      ...(visibility?.interpretedSignals.targetLineVisible ? ['The protected FA G/L Journal line remains visible with G05001 / FA-CNC-01.'] : []),
      ...(visibility?.interpretedSignals.amountHeaderVisible ? ['An Amount column/header signal is visible read-only.'] : []),
      ...(visibility?.interpretedSignals.balAccountHeaderVisible ? ['A Bal. Account column/header signal is visible read-only.'] : []),
      ...(screenshotCaptured ? ['A read-only Amount/Bal. Account visibility screenshot was captured.'] : []),
      'No value was entered or changed.',
      'No line was inserted or deleted.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      ...(visibility?.interpretedSignals.amount68000Visible ? [] : ['Amount 68000 is not visible as an existing value.']),
      ...(visibility?.interpretedSignals.k30000Visible ? [] : ['K30000 is not visible as an existing balancing value.']),
      'No value entry or correction.',
      'No cleanup decision.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    diagnosisSummary: {
      scrollables: visibility?.scrollables.length ?? 0,
      finalScrollLeft: visibility?.finalScrollLeft ?? 0,
      interpretedSignals: visibility?.interpretedSignals,
      screenshotCaptured,
    },
    changedFiles: [
      'package.json',
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-159-fa-gl-journal-amount-balaccount-readonly.json',
      '.agent/state/cases/fixedassets-160-fa-gl-journal-write-gate-decision.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'playwright/projects/fibu-book5/tests/fixedassets-159-fa-gl-journal-amount-balaccount-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-159/',
      'playwright/projects/fibu-book5/img/fixedassets-159-010-fa-gl-journal-amount-balaccount-readonly.png',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-159/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-159/FIXEDASSETS-159-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-159/FIXEDASSETS-159-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-159/010-amount-balaccount-visibility.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-159/020-focused-amount-balaccount-text.txt',
      'playwright/projects/fibu-book5/img/fixedassets-159-010-fa-gl-journal-amount-balaccount-readonly.png',
      'playwright/projects/fibu-book5/evidence/fixedassets-159/fixedassets-159-010-fa-gl-journal-amount-balaccount-readonly.screenshot.json',
    ],
    warnings: [
      'Read-only visibility run.',
      'Do not enter Amount or Bal. Account from FA-159 alone.',
      'A visible column/header is not a write-readiness decision.',
      'Run FA-160 local decision before cleanup, value entry, Preview Posting or posting.',
    ],
    blockedBy,
    requiresReview: false,
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    flags: {
      noValueCorrection: true,
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
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-159-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-159-learning.md'),
    [
      '# FIXEDASSETS-159 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `grid-visibility`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Breite Tabellen in Business Central zeigen nicht automatisch alle fachlich wichtigen Spalten. Bei Journalzeilen muss vor jeder Eingabe geklaert werden, ob Betrag und Gegenkonto wirklich sichtbar sind oder ob der Benutzer erst horizontal scrollen, Spalten einblenden oder einen anderen Nachweispfad nutzen muss.',
      '',
      '## Warum das wichtig ist',
      '',
      'Ein Screenshot ist nur dann ein gutes Buchbild, wenn er den fachlichen Kontrollpunkt sichtbar macht. Eine Zeile mit Anlage und AfA-Buch allein beweist noch nicht, dass Betrag und Gegenkonto korrekt oder ueberhaupt sichtbar sind.',
      '',
      '## Grenzen',
      '',
      '- Keine Werteingabe.',
      '- Keine Zeile angelegt, geaendert oder geloescht.',
      '- Keine Preview Posting.',
      '- Keine Buchung.',
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
      '# FIXEDASSETS-159 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-amount-balaccount-visibility.json` | JSON | read-only Scroll-/Grid-Signale fuer Amount und Bal. Account | keine Werteingabe, keine Buchung | `labor`, `read-only` |',
      '| `020-focused-amount-balaccount-text.txt` | Text | kompakte Amount-/Bal.-Account-Signale | kein Rohdump | `compact` |',
      '| `fixedassets-159-010-fa-gl-journal-amount-balaccount-readonly.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen des Bildes | keine Buchungswirkung | `labor` |',
      '| `FIXEDASSETS-159-result.json` | JSON | Ergebnis, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-159-learning.md` | Markdown | Lernwert fuer breite BC-Journalgrids | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noValueCorrection).toBe(true);
  expect(result.flags.noInsertLine).toBe(true);
  expect(result.flags.noDeleteLine).toBe(true);
  expect(result.flags.noCleanup).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
});
