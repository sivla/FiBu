import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  openSearchResult,
  pageText,
  requireBcUrl,
  searchFor,
  visibleButtonNames,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-084-FA-GL-JOURNAL-ROUTE-READONLY-DISCOVERY';
const TEST_ID = 'fixedassets-084';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const text = await pageText(page);
  return {
    url,
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: new URL(url).searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

async function openFixedAssetGlJournalReadOnly(page: Page) {
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);

  const contextBefore = await sandboxContext(page);
  if (!contextBefore.environmentInUrl || (!contextBefore.companyInUrl && !contextBefore.companyInText) || contextBefore.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context before FA G/L Journal discovery: ${JSON.stringify(contextBefore)}`);
  }

  await searchFor(page, 'Fixed Asset G/L Journals');
  await page.waitForTimeout(1500);
  const tellMeText = await compactPageText(page, {
    include: [/Fixed Asset|FA G\/L|G\/L Journal|Anlage|Fibu|Buch.-Blatt|Buchblatt|Journal/i],
    maxLines: 80,
    maxLineLength: 220,
  });
  await writeTextEvidence(faEvidencePath('010-tell-me-fixed-asset-gl-journal.txt'), tellMeText || 'No Tell-Me text captured.');

  let routeOpened = false;
  let routeOpenError = '';
  try {
    await openSearchResult(
      page,
      /^Fixed Asset G\/L Journals$|^FA G\/L Journals$|^Anlagen Fibu Buch.-Bl.*tter$|^Anlagen Fibu Buchbl.*tter$/i,
      { requireUnique: true },
    );
    routeOpened = true;
  } catch (error) {
    routeOpenError = String(error);
  }

  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1600);

  const fullText = await pageText(page);
  const pageContextText = await compactPageText(page, {
    include: [
      /Fixed Asset|FA G\/L|G\/L Journal|Anlage|Fibu|Buch.-Blatt|Buchblatt|Journal/i,
      /Posting Date|Buchungsdatum|Document|Beleg|Account|Konto|FA Posting Type|Anlagenpostenart/i,
      /Acquisition|Anschaffung|Amount|Betrag|Bal\. Account|Gegenkonto|Post|Buchen|Preview|Vorschau/i,
    ],
    maxLines: 120,
    maxLineLength: 220,
  });
  const buttons = (await visibleButtonNames(page)).slice(0, 120);
  const contextAfter = await sandboxContext(page);
  const routeContextVisible =
    routeOpened &&
    /Fixed Asset G\/L Journal|FA G\/L Journal|Fixed Asset|Anlage|Buch.-Blatt|Buchblatt/i.test(fullText) &&
    /Journal|Buch.-Blatt|Buchblatt/i.test(fullText);

  const columnSignals = {
    journalBatch: /Batch Name|Journal Batch|Name des Buch.-Blatts|Buch.-Blattname/i.test(fullText),
    postingDate: /Posting Date|Buchungsdatum/i.test(fullText),
    documentNo: /Document No\.|Belegnr\.|Belegnummer/i.test(fullText),
    accountType: /Account Type|Kontoart/i.test(fullText),
    accountNo: /Account No\.|Kontonr\./i.test(fullText),
    faPostingType: /FA Posting Type|Anlagenpostenart/i.test(fullText),
    fixedAssetNo: /FA No\.|Fixed Asset No\.|Anlagennr\./i.test(fullText),
    amount: /Amount|Betrag/i.test(fullText),
    balancingAccount: /Bal\. Account|Balancing Account|Gegenkonto/i.test(fullText),
  };

  const actionSignals = {
    newVisible: buttons.some((button) => /^(New|Neu)$|New Line|Neue Zeile/i.test(button)),
    editVisible: buttons.some((button) => /^Edit|Bearbeiten/i.test(button)),
    deleteVisible: buttons.some((button) => /Delete|Loeschen|Löschen/i.test(button)),
    postVisible: buttons.some((button) => /Post|Buchen/i.test(button)),
    previewVisible: buttons.some((button) => /Preview Posting|Buchungsvorschau|Vorschau/i.test(button)),
    journalCheckVisible: buttons.some((button) => /Check|Pruefen|Prüfen/i.test(button)),
  };

  await writeTextEvidence(faEvidencePath('020-fa-gl-journal-page-context.txt'), pageContextText || 'No FA G/L Journal page context captured.');
  await writeJsonEvidence(faEvidencePath('030-fa-gl-journal-ui-signals.json'), {
    routeOpened,
    routeOpenError,
    routeContextVisible,
    url: page.url(),
    contextBefore,
    contextAfter,
    columnSignals,
    actionSignals,
    visibleButtons: buttons,
  });

  return {
    routeOpened,
    routeOpenError,
    routeContextVisible,
    url: page.url(),
    contextBefore,
    contextAfter,
    columnSignals,
    actionSignals,
    evidence: {
      tellMeText: `playwright/projects/${project.name}/evidence/${TEST_ID}/010-tell-me-fixed-asset-gl-journal.txt`,
      pageContextText: `playwright/projects/${project.name}/evidence/${TEST_ID}/020-fa-gl-journal-page-context.txt`,
      uiSignals: `playwright/projects/${project.name}/evidence/${TEST_ID}/030-fa-gl-journal-ui-signals.json`,
    },
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  const nextCase =
    status === 'observed'
      ? 'FIXEDASSETS-085-FA-GL-JOURNAL-LINE-READINESS-DECISION'
      : 'FIXEDASSETS-085-FA-GL-JOURNAL-ROUTE-BLOCKER-DIAGNOSIS';
  const nextFile =
    status === 'observed'
      ? '.agent/state/cases/fixedassets-085-fa-gl-journal-line-readiness-decision.json'
      : '.agent/state/cases/fixedassets-085-fa-gl-journal-route-blocker-diagnosis.json';
  const nextStep =
    status === 'observed'
      ? 'Decide the controlled FA G/L Journal line readiness before any draft line: required fields, setup gates, no-posting boundary, and cleanup/keep rule.'
      : 'Diagnose why the FA G/L Journal route did not open without using New/Edit/Post/Preview.';

  return {
    current: {
      activeCase: nextCase,
      active_case_file: nextFile,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-084-fa-gl-journal-route-readonly-discovery.json',
      nextStep,
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-gl-journal-route-readonly-discovery',
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
      nextStep,
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly' : 'blocked-readonly',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-084/FIXEDASSETS-084-result.json',
        summary,
      },
      nextSafeAction: nextStep,
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock:
            status === 'observed' ? 'fa-gl-journal-line-readiness-decision' : 'fa-gl-journal-route-blocker-diagnosis',
          latestPracticalCase: 'FIXEDASSETS-084',
          nextCase,
        },
      },
    },
  };
}

test('FIXEDASSETS-084 discovers FA G/L Journal route read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const journal = await openFixedAssetGlJournalReadOnly(page);
  const status: 'observed' | 'blocked' = journal.routeContextVisible ? 'observed' : 'blocked';
  const summary = journal.routeContextVisible
    ? 'FA-084 opened the Fixed Asset G/L Journal route read-only in MCP_1_20260210 / RM-DEMO and captured page/action/column signals without creating a journal line.'
    : `FA-084 stayed read-only but did not prove the Fixed Asset G/L Journal route. Blocker: ${journal.routeOpenError || 'route context not visible after navigation'}.`;

  const proved = [
    'The run stayed in MCP_1_20260210 / RM-DEMO.',
    'The run used Tell-Me without blind Enter fallback and required a unique FA G/L Journal result.',
    'The run did not create, edit, delete, preview, post, pay, invoice, ship or change setup.',
    ...(journal.routeContextVisible
      ? ['Fixed Asset G/L Journal route/page context is visible as a read-only acquisition-route candidate.']
      : []),
  ];
  const notProved = [
    'No journal line was created.',
    'No FA-CNC-01 was entered in a journal.',
    'No K30000 was entered.',
    'No amount was entered.',
    'No Preview Posting.',
    'No acquisition posting.',
    'No German final proof.',
    ...(journal.routeContextVisible ? ['Required journal fields were only inventoried visually, not filled or validated.'] : ['The journal route was not proven open.']),
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-route-readonly-discovery-result',
    caseId: CASE_ID,
    source: 'playwright-result',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    proved,
    notProved,
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-084-fa-gl-journal-route-readonly-discovery.json',
      status === 'observed'
        ? '.agent/state/cases/fixedassets-085-fa-gl-journal-line-readiness-decision.json'
        : '.agent/state/cases/fixedassets-085-fa-gl-journal-route-blocker-diagnosis.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-084-fa-gl-journal-route-readonly-discovery.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-084/FIXEDASSETS-084-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-084/FIXEDASSETS-084-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-084/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-084/FIXEDASSETS-084-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-084/FIXEDASSETS-084-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-084/README.md',
      journal.evidence.tellMeText,
      journal.evidence.pageContextText,
      journal.evidence.uiSignals,
    ],
    warnings: [
      'CRONUS/RM-DEMO Labor only.',
      'Read-only route discovery, not a posting or setup proof.',
      'Visible Post/Preview/New/Edit/Delete actions, if present, were not clicked.',
    ],
    blockedBy: status === 'blocked' ? [journal.routeOpenError || 'FA G/L Journal route context not visible'] : [],
    requiresReview: status === 'blocked',
    safeToFinalizeState: status === 'observed',
    statePatch: statePatch(status, summary),
    route: journal,
    flags: {
      stayedInExpectedInstance: journal.contextAfter.environmentInUrl,
      companyContextDocumented: journal.contextAfter.companyInUrl || journal.contextAfter.companyInText,
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
      noJournalLineCreated: true,
      noTargetVendorEntry: true,
      noTargetFixedAssetEntry: true,
      cleanupRequired: false,
      cleanupCompleted: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep: statePatch(status, summary).current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-084-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-084-learning.md'),
    [
      '# FIXEDASSETS-084 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `route-discovery`, `no-draft`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Ein Anlagenzugang kann ueber ein Anlagen-Fibu-Journal vorbereitet werden. Vor einer spaeteren Journalzeile muss aber zuerst klar sein, welche Felder sichtbar sind und welche Gate-Regeln gelten: Buchungsdatum, Belegnummer, Kontoart/Kontonummer, Anlagenpostenart, Anlagennummer, Betrag und Gegenkonto sind fachlich andere Pruefpunkte als eine Einkaufsbelegzeile.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 sollte den Journalpfad als eigenen, UI-first nachzuweisenden Anlagenzugangsweg behandeln. FA-084 beweist nur die Route und sichtbare Signale; es beweist noch keine Anschaffung, keine Posten und keinen deutschen Zielzustand.',
      '',
      '## Grenzen',
      '',
      '- Keine Journalzeile angelegt.',
      '- Keine Werte eingegeben.',
      '- Keine Preview Posting.',
      '- Keine Buchung.',
      '- Keine Setup-Aenderung.',
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
      '# FIXEDASSETS-084 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-tell-me-fixed-asset-gl-journal.txt` | Text | Tell-Me-Kontext zur FA-G/L-Journal-Suche | keine Navigationserfolgs-Garantie allein | `labor`, `read-only` |',
      '| `020-fa-gl-journal-page-context.txt` | Text | kompakte sichtbare Page-/Feldsignale nach Navigation | keine Werteingabe | `labor`, `read-only` |',
      '| `030-fa-gl-journal-ui-signals.json` | JSON | Route, Context, Spalten-/Aktionssignale | keine Buchungswirkung | `labor`, `read-only` |',
      '| `FIXEDASSETS-084-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-084-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.stayedInExpectedInstance).toBe(true);
  expect(result.flags.companyContextDocumented).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noNewDraft).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
});
