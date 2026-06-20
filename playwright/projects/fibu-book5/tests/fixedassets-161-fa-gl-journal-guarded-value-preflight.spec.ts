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

const CASE_ID = 'FIXEDASSETS-161-FA-GL-JOURNAL-GUARDED-VALUE-PREFLIGHT';
const NEXT_CASE_ID = 'FIXEDASSETS-162-FA-GL-JOURNAL-BALACCOUNT-TYPE-DECISION';
const TEST_ID = 'fixedassets-161';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_PAGE_ID = 5628;

const TARGET = {
  documentNo: 'G05001',
  accountType: 'Fixed Asset',
  accountNo: 'FA-CNC-01',
  depreciationBookCode: 'HGB',
  description: 'CNC Maschine FRA',
  amount: '68000',
  balAccountType: 'G/L Account',
  balAccountNo: 'K30000',
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

async function readJournalSignals(frame: Frame) {
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

    const bodyText = norm(document.body?.innerText || '');
    const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
      .filter(visible)
      .map((header) => norm(header.innerText || header.textContent))
      .filter(Boolean);
    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row) => norm(row.innerText || row.textContent).slice(0, 520))
      .filter(Boolean);
    const combined = norm([bodyText, headers.join(' '), rows.join(' ')].join(' '));

    return {
      pageTitleVisible: /Fixed Asset G\/L Journals/i.test(combined),
      targetLineVisible: /G05001/i.test(combined) && /FA-CNC-01/i.test(combined) && /\bHGB\b/i.test(combined),
      descriptionVisible: /CNC Maschine FRA/i.test(combined),
      amountHeaderVisible: /\bAmount\b|Betrag/i.test(combined),
      balAccountHeaderVisible: /Bal\. Account No\.|Bal Account No|Bal\. Account|Gegenkonto/i.test(combined),
      amount68000Visible: /68[.,]?000|68000/i.test(combined),
      k30000Visible: /K30000/i.test(combined),
      currentAmountZeroVisible: /0,00|0\.00/i.test(combined),
      currentBalAccountTypeGlVisible: /Bal\. Account Type\s+G\/L Account|G\/L Account/i.test(combined),
      currentBalAccountNoEmptyInferred: /Bal\. Account No\./i.test(combined) && !/K30000/i.test(combined),
      relevantHeaders: headers.filter((header) => /Posting Date|Document No|Account Type|Account No|FA Posting Type|Amount|Bal\. Account/i.test(header)),
      relevantRows: rows.filter((row) => /G05001|FA-CNC-01|HGB|CNC Maschine FRA|Amount|Bal\. Account|K30000|68000/i.test(row)).slice(0, 12),
    };
  });
}

function targetConsistency() {
  const balAccountNoLooksLikeVendor = /^K\d+/i.test(TARGET.balAccountNo);
  const targetTypeAllowsVendorNo = /vendor|kreditor/i.test(TARGET.balAccountType);
  return {
    balAccountNoLooksLikeVendor,
    targetTypeAllowsVendorNo,
    consistent: !balAccountNoLooksLikeVendor || targetTypeAllowsVendorNo,
    reason: balAccountNoLooksLikeVendor && !targetTypeAllowsVendorNo
      ? `Bal. Account No. ${TARGET.balAccountNo} looks like a vendor code, but target Bal. Account Type is ${TARGET.balAccountType}.`
      : 'Target Bal. Account Type and No. look consistent.',
  };
}

function statePatch(status: 'blocked' | 'observed', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-162-fa-gl-journal-balaccount-type-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-161-fa-gl-journal-guarded-value-preflight.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-162: decide locally whether Bal. Account Type must be Vendor for K30000 or whether a different G/L Account target is required before any value entry retry.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-gl-journal-guarded-value-preflight',
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
      nextStep: 'Run FIXEDASSETS-162 local Bal. Account Type decision before any value entry retry.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-guarded-preflight' : 'blocked-target-consistency',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-161/FIXEDASSETS-161-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-162 local decision; do not enter values, Preview Posting or Post.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: 'fa-gl-journal-balaccount-type-decision',
          latestPracticalCase: 'FIXEDASSETS-161',
          latestReviewCase: 'FIXEDASSETS-160',
          nextCase: NEXT_CASE_ID,
        },
      },
    },
  };
}

test('FIXEDASSETS-161 blocks value entry when Bal. Account target is inconsistent', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let signals: Awaited<ReturnType<typeof readJournalSignals>> | undefined;
  let screenshotCaptured = false;
  const consistency = targetConsistency();

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
      signals = await readJournalSignals(frame);
      await moveVisibleGridToAmountColumns(page);
      await screenshot(page, 'fixedassets-161-010-fa-gl-journal-target-consistency-blocker.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: 'labor',
        bookUse: 'debugging',
        purpose:
          'Guarded Value-Preflight: zeigt den Journal-Kontext, bevor wegen widerspruechlichem Ziel-Gegenkonto keine Werte eingegeben werden.',
        expectedPageText: [/Fixed Asset G\/L Journals/i],
        knownLimitations: [
          'Keine Werteingabe wegen Zielwert-Widerspruch.',
          'Keine neue Zeile.',
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

  if (!signals?.pageTitleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible.');
  }
  if (!signals?.targetLineVisible) {
    blockedBy.push('Protected target line G05001 / FA-CNC-01 / HGB was not visible.');
  }
  if (!signals?.amountHeaderVisible || !signals?.balAccountHeaderVisible) {
    blockedBy.push('Amount and Bal. Account columns were not both visible.');
  }
  if (!consistency.consistent) {
    blockedBy.push(consistency.reason);
  }

  const status: 'blocked' | 'observed' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const dataChanged = false;
  const summary =
    status === 'blocked'
      ? `FA-161 stopped before value entry: ${blockedBy.join(' | ')}`
      : 'FA-161 did not find a blocker, but this implementation still does not enter values automatically.';
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-target-consistency-and-visible-state.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-161-target-consistency-and-visible-state',
    caseId: CASE_ID,
    context,
    frameUrl,
    target: TARGET,
    consistency,
    visibleSignals: signals,
    blockedBy,
    dataChanged,
    screenshotCaptured,
    omitted: 'No full DOM dump, traces, videos or auth artifacts stored.',
  });

  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-161-learning.md'),
    [
      '# FIXEDASSETS-161 Lernzusammenfassung',
      '',
      'Status: `labor`, `guarded-preflight`, `blocked-before-value-entry`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      '`Bal. Account Type` und `Bal. Account No.` muessen fachlich zusammenpassen. Ein Code wie `K30000` ist im Projektkontext ein Kreditor-/Vendor-Code. Wenn die Zeile gleichzeitig `Bal. Account Type = G/L Account` erwartet, waere eine Eingabe riskant oder falsch.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 sollte diesen Fehlerfall erwaehnen: Vor Betrag/Gegenkonto-Eingabe wird nicht nur die Spalte sichtbar gemacht, sondern auch die Logik des Gegenkonto-Typs geprueft.',
      '',
      '## Naechster Schritt',
      '',
      patch.current.nextStep,
      '',
    ].join('\n'),
  );

  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-161 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-target-consistency-and-visible-state.json` | JSON | Zielwert-Konsistenz, sichtbare Journal-Spalten, Stop-Grund | keine Werteingabe, keine Buchung | `blocked`, `labor` |',
      '| `fixedassets-161-010-fa-gl-journal-target-consistency-blocker.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Blockerbildes | keine Zielwerte gesetzt | `labor` |',
      '| `FIXEDASSETS-161-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `blocked` |',
      '| `FIXEDASSETS-161-learning.md` | Markdown | Lernwert Gegenkonto-Typ vs Gegenkonto-Code | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-guarded-value-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-guarded-value-preflight',
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
      ...(signals?.targetLineVisible ? ['The protected FA G/L Journal line remains visible.'] : []),
      ...(signals?.amountHeaderVisible ? ['Amount column remains visible.'] : []),
      ...(signals?.balAccountHeaderVisible ? ['Bal. Account column remains visible.'] : []),
      'No value was entered or changed.',
      'No line was created or deleted.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      'Amount 68.000 was not entered.',
      'K30000 was not entered.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.'
    ],
    decision: {
      valueEntry: 'blocked-before-entry',
      reason: blockedBy,
      nextCase: NEXT_CASE_ID,
    },
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-161-fa-gl-journal-guarded-value-preflight.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-161/',
      'playwright/projects/fibu-book5/img/fixedassets-161-010-fa-gl-journal-target-consistency-blocker.png',
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-161-fa-gl-journal-guarded-value-preflight.json',
      '.agent/state/cases/fixedassets-162-fa-gl-journal-balaccount-type-decision.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-161/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-161/010-target-consistency-and-visible-state.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-161/FIXEDASSETS-161-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-161/FIXEDASSETS-161-result.json',
      'playwright/projects/fibu-book5/img/fixedassets-161-010-fa-gl-journal-target-consistency-blocker.png',
    ],
    warnings: [
      'Guarded value preflight stopped before value entry.',
      'Do not retry value entry until FA-162 decides Bal. Account Type / target account consistency.',
      'Preview Posting and Post remain locked.'
    ],
    blockedBy,
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: patch,
    flags: {
      dataChanged,
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
      consistency,
      visibleSignals: signals,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-161-result.json'), result);

  expect(result.flags.dataChanged).toBe(false);
  expect(result.flags.noValueEntry).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
});
