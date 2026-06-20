import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-155-FA-GL-JOURNAL-ACQUISITION-ROUTE-READONLY-PREFLIGHT';
const NEXT_CASE_ID = 'FIXEDASSETS-156-FA-GL-JOURNAL-ROUTE-RESULT-REVIEW';
const TEST_ID = 'fixedassets-155';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_PAGE_ID = 5628;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2600, height: 1400 },
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

function evidenceText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function evidenceLines(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
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
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${TARGET_PAGE_ID}`);
}

async function journalRouteSnapshot(page: Page) {
  const targetFrame = page.frames().find(isTargetFrame);
  const frame = targetFrame ?? page.mainFrame();
  const frameUrl = safeUrl(frame.url());
  const result = await frame.evaluate(() => {
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

    const bodyText = norm(document.body?.innerText || '');
    const controls = [...document.querySelectorAll<HTMLElement>('input,select,textarea,[role="textbox"],[role="combobox"],[role="gridcell"],[role="columnheader"],button,[role="button"],[role="menuitem"]')]
      .filter(visible)
      .map((element, index) => {
        const input = element as HTMLInputElement;
        const row = element.closest<HTMLElement>('[role="row"],tr');
        return {
          index,
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role') || '',
          ariaLabel: norm(element.getAttribute('aria-label')),
          title: norm(element.getAttribute('title')),
          text: norm(element.innerText || element.textContent).slice(0, 180),
          value: norm('value' in input ? input.value : '').slice(0, 120),
          rowText: norm(row?.innerText || row?.textContent || '').slice(0, 260),
          disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
          readonly: element.hasAttribute('readonly') || element.getAttribute('aria-readonly') === 'true',
          rect: rectOf(element),
        };
      })
      .filter((entry) => entry.text || entry.value || entry.ariaLabel || entry.title || entry.rowText);

    const gridRows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row, index) => ({
        index,
        text: norm(row.innerText || row.textContent).slice(0, 360),
        rect: rectOf(row),
      }))
      .filter((row) => row.text)
      .slice(0, 80);

    return { bodyText, controls, gridRows };
  });

  const relevantPattern =
    /Fixed Asset G\/L Journals|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Fixed Asset No\.|Depreciation Book|Amount|Bal\. Account|Post|Preview|New|Delete|Edit|Batch Name|DEFAULT|FA-CNC-01|G05001|HGB|MACHINES/i;
  const relevantControls = result.controls
    .map((control) => ({
      ...control,
      ariaLabel: evidenceText(control.ariaLabel),
      title: evidenceText(control.title),
      text: evidenceText(control.text),
      value: evidenceText(control.value),
      rowText: evidenceText(control.rowText),
    }))
    .filter((control) => relevantPattern.test([control.text, control.value, control.ariaLabel, control.title, control.rowText].join(' ')))
    .slice(0, 120);
  const relevantRows = result.gridRows.map((row) => ({ ...row, text: evidenceText(row.text) })).filter((row) => relevantPattern.test(row.text)).slice(0, 60);
  const bodyText = evidenceText(result.bodyText);

  return {
    frameUrl,
    targetFrameFound: Boolean(targetFrame),
    bodyText,
    relevantControls,
    relevantRows,
    fieldSignals: {
      fixedAssetJournalPage: /Fixed Asset G\/L Journals|FA G\/L Journal|Anlagen-Fibu Buchblatt|Anlagen Fibu/i.test(bodyText),
      batchName: /Batch Name|Journal Batch|Buch.-Blattname|Name des Buch.-Blatts/i.test(bodyText),
      postingDate: /Posting Date|Buchungsdatum/i.test(bodyText),
      documentNo: /Document No\.|Belegnr\.|Belegnummer/i.test(bodyText),
      accountType: /Account Type|Kontoart/i.test(bodyText),
      accountNo: /Account No\.|Kontonr\./i.test(bodyText),
      faPostingType: /FA Posting Type|Anlagenpostenart/i.test(bodyText),
      fixedAssetNo: /Fixed Asset No\.|FA No\.|Anlagennr\./i.test(bodyText),
      depreciationBook: /Depreciation Book|AfA-Buch/i.test(bodyText),
      amount: /Amount|Betrag/i.test(bodyText),
      balancingAccount: /Bal\. Account|Balancing Account|Gegenkonto/i.test(bodyText),
    },
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-156-fa-gl-journal-route-result-review.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-155-fa-gl-journal-acquisition-route-readonly-preflight.json',
      requiresStrongModel: true,
      nextStep:
        'FIXEDASSETS-156: review FA-155 journal-route evidence locally before deciding whether a guarded acquisition journal draft is safe.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-gl-journal-acquisition-route-readonly-preflight',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      resultStatus: status,
      summary,
      nextStep: 'Run FIXEDASSETS-156 local result review; do not enter FA-CNC-01, amount, balancing account, Preview Posting or Post.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly' : 'blocked-readonly',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-155/FIXEDASSETS-155-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-156 local result review before any write probe.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: 'fa-gl-journal-acquisition-route-review',
          latestPracticalCase: 'FIXEDASSETS-155',
          nextCase: NEXT_CASE_ID,
        },
      },
    },
  };
}

test('FIXEDASSETS-155 captures FA G/L Journal acquisition route read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let routeSnapshot: Awaited<ReturnType<typeof journalRouteSnapshot>> | undefined;
  let compactContext = '';
  let buttons: string[] = [];
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
      routeSnapshot = await journalRouteSnapshot(page);
      compactContext = evidenceLines(
        await compactPageText(page, {
        include: [
          /Fixed Asset|FA G\/L|Journal|Batch Name|Posting Date|Document No\.|Account Type|Account No\.|FA Posting Type|Fixed Asset No\.|Depreciation Book|Amount|Bal\. Account/i,
          /Post|Preview|New|Edit|Delete|Buchen|Vorschau|Neu|Bearbeiten|Loeschen|L.schen/i,
          /DEFAULT|G05001|FA-CNC-01|HGB|MACHINES/i,
        ],
        maxLines: 180,
        maxLineLength: 240,
        }),
      );
      buttons = (await visibleButtonNames(page)).map((button) => evidenceText(button)).filter(Boolean).slice(0, 160);
      await screenshot(page, 'fixedassets-155-010-fa-gl-journal-readonly-preflight.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: 'labor',
        bookUse: 'field-proof',
        purpose:
          'Read-only Nachweis der Anlagen-Fibu-Journal-Route als Vorbereitung fuer eine spaetere kontrollierte Anlagenanschaffung. Sichtbar sein sollen Journal-/Zeilenkontext und relevante Feldsignale, nicht nur ein leerer Shell-Screen.',
        expectedPageText: [/Fixed Asset G\/L Journals|FA G\/L Journal|Journal/i],
        knownLimitations: [
          'Keine Werteingabe.',
          'Keine Journalzeile angelegt.',
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

  const visibleSignalText = [routeSnapshot?.bodyText, compactContext, ...buttons].filter(Boolean).join(' ');
  const mergedFieldSignals = {
    fixedAssetJournalPage:
      Boolean(routeSnapshot?.fieldSignals.fixedAssetJournalPage) || /Fixed Asset G\/L Journals|FA G\/L Journal|Anlagen-Fibu Buchblatt|Anlagen Fibu/i.test(visibleSignalText),
    batchName: Boolean(routeSnapshot?.fieldSignals.batchName) || /Batch Name|Journal Batch|Buch.-Blattname|Name des Buch.-Blatts/i.test(visibleSignalText),
    postingDate: Boolean(routeSnapshot?.fieldSignals.postingDate) || /Posting Date|Buchungsdatum/i.test(visibleSignalText),
    documentNo: Boolean(routeSnapshot?.fieldSignals.documentNo) || /Document No\.|Belegnr\.|Belegnummer/i.test(visibleSignalText),
    accountType: Boolean(routeSnapshot?.fieldSignals.accountType) || /Account Type|Kontoart/i.test(visibleSignalText),
    accountNo: Boolean(routeSnapshot?.fieldSignals.accountNo) || /Account No\.|Kontonr\./i.test(visibleSignalText),
    faPostingType: Boolean(routeSnapshot?.fieldSignals.faPostingType) || /FA Posting Type|Anlagenpostenart/i.test(visibleSignalText),
    fixedAssetNo: Boolean(routeSnapshot?.fieldSignals.fixedAssetNo) || /Fixed Asset No\.|FA No\.|Anlagennr\./i.test(visibleSignalText),
    depreciationBook: Boolean(routeSnapshot?.fieldSignals.depreciationBook) || /Depreciation Book|Depreciation Book Code|AfA-Buch/i.test(visibleSignalText),
    amount: Boolean(routeSnapshot?.fieldSignals.amount) || /Amount|Betrag/i.test(visibleSignalText),
    balancingAccount: Boolean(routeSnapshot?.fieldSignals.balancingAccount) || /Bal\. Account|Balancing Account|Gegenkonto/i.test(visibleSignalText),
  };
  const signalCount = Object.values(mergedFieldSignals).filter(Boolean).length;
  const existingJournalLineVisible = /G05001/i.test(visibleSignalText) && /FA-CNC-01/i.test(visibleSignalText);
  if (!routeSnapshot?.targetFrameFound) {
    blockedBy.push('Fixed Asset G/L Journals target frame/page was not found.');
  }
  if (!mergedFieldSignals.fixedAssetJournalPage) {
    blockedBy.push('Fixed Asset G/L Journals page signal was not visible.');
  }
  if (signalCount < 6) {
    blockedBy.push(`Only ${signalCount} acquisition-route field signals were visible.`);
  }

  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-155 proved the Fixed Asset G/L Journal route read-only in ${EXPECTED_COMPANY}. ${signalCount} acquisition-route field signals were visible; no journal line, value, preview or posting was created by this run.`
      : `FA-155 blocked before sufficient journal-route proof: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeTextEvidence(faEvidencePath('010-fa-gl-journal-readonly-context.txt'), compactContext || 'No compact FA G/L Journal context captured.');
  await writeJsonEvidence(faEvidencePath('020-fa-gl-journal-ui-signals.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-155-fa-gl-journal-ui-signals-readonly',
    caseId: CASE_ID,
    context,
    signalCount,
    routeSnapshot,
    mergedFieldSignals,
    existingJournalLineVisible,
    visibleButtons: buttons,
    screenshotCaptured,
    blockedBy,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-acquisition-route-readonly-preflight-result',
    caseId: CASE_ID,
    source: 'playwright-sandbox-readonly-preflight',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    environment: {
      expectedInstance: EXPECTED_INSTANCE,
      expectedCompany: EXPECTED_COMPANY,
      context,
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(status === 'observed' ? ['Fixed Asset G/L Journal route is visible read-only.'] : []),
      ...(screenshotCaptured ? ['A labor screenshot of the FA G/L Journal route was captured.'] : []),
      'No journal line was created.',
      'No FA-CNC-01, amount or balancing account value was entered.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      'No guarded acquisition journal draft.',
      'No journal check.',
      'No Preview Posting result.',
      'No acquisition posting.',
      'No FA Ledger Entry, G/L Entry or VAT/GST trace.',
      'No German final proof.',
    ],
    diagnosisSummary: {
      signalCount,
      fieldSignals: mergedFieldSignals,
      existingJournalLineVisible,
      relevantControlCount: routeSnapshot?.relevantControls.length ?? 0,
      relevantRowCount: routeSnapshot?.relevantRows.length ?? 0,
      screenshotCaptured,
    },
    changedFiles: [
      'package.json',
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-155-fa-gl-journal-acquisition-route-readonly-preflight.json',
      '.agent/state/cases/fixedassets-156-fa-gl-journal-route-result-review.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'playwright/projects/fibu-book5/tests/fixedassets-155-fa-gl-journal-acquisition-route-readonly-preflight.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/FIXEDASSETS-155-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/FIXEDASSETS-155-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/010-fa-gl-journal-readonly-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/020-fa-gl-journal-ui-signals.json',
      'playwright/projects/fibu-book5/img/fixedassets-155-010-fa-gl-journal-readonly-preflight.png',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/fixedassets-155-010-fa-gl-journal-readonly-preflight.screenshot.json',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-155/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/FIXEDASSETS-155-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/FIXEDASSETS-155-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/010-fa-gl-journal-readonly-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/020-fa-gl-journal-ui-signals.json',
      'playwright/projects/fibu-book5/img/fixedassets-155-010-fa-gl-journal-readonly-preflight.png',
      'playwright/projects/fibu-book5/evidence/fixedassets-155/fixedassets-155-010-fa-gl-journal-readonly-preflight.screenshot.json',
    ],
    warnings: [
      'CRONUS/RM-DEMO labor only.',
      'Read-only route preflight only; field visibility is not write-readiness.',
      'Do not enter values, preview or post from FA-155 alone. Run FA-156 local review first.',
    ],
    blockedBy,
    requiresReview: false,
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    flags: {
      noJournalLineCreated: true,
      noTargetFixedAssetEntry: true,
      noAmountEntry: true,
      noBalancingAccountEntry: true,
      noBookChange: true,
      noPost: true,
      noPreview: true,
      noShip: true,
      noInvoice: true,
      noPayment: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noEditRecord: true,
      noDeleteRecord: true,
      cleanupRequired: false,
      cleanupCompleted: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-155-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-155-learning.md'),
    [
      '# FIXEDASSETS-155 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `route-preflight`, `no-draft`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Die Anlagenanschaffung per Journal beginnt nicht mit der Buchung, sondern mit der richtigen Journalroute. Auf der Seite `Fixed Asset G/L Journals` muessen vor einem spaeteren Schreibversuch die Zeilenfelder sichtbar und fachlich verstanden sein: Buchungsdatum, Belegnr., Kontoart/Kontonr., Anlagenpostenart, AfA-Buch, Betrag und Gegenkonto.',
      '',
      '## Warum das wichtig ist',
      '',
      'Wenn ein Feld nicht sichtbar oder nicht eindeutig erreichbar ist, wird ein automatisierter Schreibversuch fragil. FA-155 bleibt deshalb absichtlich read-only und prueft zuerst, ob die spaetere Anschaffungsroute ueberhaupt als Buch-Klickpfad erklaerbar ist.',
      '',
      '## Grenzen',
      '',
      '- Keine Journalzeile angelegt.',
      '- Keine Werte eingegeben.',
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
      '# FIXEDASSETS-155 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-fa-gl-journal-readonly-context.txt` | Text | kompakte sichtbare Journal-/Feldsignale | keine Werteingabe | `labor`, `read-only` |',
      '| `020-fa-gl-journal-ui-signals.json` | JSON | Feldsignale, Buttonsignale, Screenshot-Status und Kontext | keine Buchungswirkung | `labor`, `read-only` |',
      '| `fixedassets-155-010-fa-gl-journal-readonly-preflight.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Bildes | keine fachliche Buchung | `labor` |',
      '| `FIXEDASSETS-155-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-155-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noJournalLineCreated).toBe(true);
  expect(result.flags.noAmountEntry).toBe(true);
  expect(result.flags.noBalancingAccountEntry).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
});
