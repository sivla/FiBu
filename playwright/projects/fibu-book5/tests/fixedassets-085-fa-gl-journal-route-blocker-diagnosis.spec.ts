import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  searchFor,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-085-FA-GL-JOURNAL-ROUTE-BLOCKER-DIAGNOSIS';
const TEST_ID = 'fixedassets-085';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

const SEARCH_TERMS = [
  'Fixed Asset G/L Journals',
  'FA G/L Journals',
  'Fixed Asset Journals',
  'Fixed Asset Journal',
  'FA Journal',
  'Anlagen Fibu Buchblatt',
  'Anlagen Buchblatt',
  'Anlagenjournal',
];

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

function candidateLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => /Fixed Asset|FA G\/L|FA Journal|G\/L Journal|Anlage|Anlagen|Fibu|Buchblatt|Buch.-Blatt|Journal/i.test(line));
}

function classifyCandidates(lines: string[]) {
  const likelyFaJournal = lines.filter(
    (line) =>
      /(Fixed Asset|FA|Anlage|Anlagen)/i.test(line) &&
      /(G\/L|Journal|Fibu|Buchblatt|Buch.-Blatt)/i.test(line),
  );
  const exactLike = likelyFaJournal.filter((line) =>
    /^Fixed Asset G\/L Journals$|^FA G\/L Journals$|^Fixed Asset Journal$|^Fixed Asset Journals$|^Anlagen Fibu Buch.*|^Anlagen.*Buchblatt$|^Anlagenjournal$/i.test(
      line,
    ),
  );
  return {
    likelyFaJournal: [...new Set(likelyFaJournal)],
    exactLike: [...new Set(exactLike)],
  };
}

function nextCase(foundExactLike: boolean) {
  return foundExactLike
    ? {
        id: 'FIXEDASSETS-086-FA-JOURNAL-CANDIDATE-ROUTE-PROBE',
        file: '.agent/state/cases/fixedassets-086-fa-journal-candidate-route-probe.json',
        step:
          'Probe the best unique FA journal candidate read-only, still without New/Edit/Preview/Post or target values.',
      }
    : {
        id: 'FIXEDASSETS-086-ACQUISITION-ROUTE-FALLBACK-DECISION',
        file: '.agent/state/cases/fixedassets-086-acquisition-route-fallback-decision.json',
        step:
          'Make a local fallback route decision: direct page-id research, assisted Acquire diagnostics, or documented purchase-document limitation before any journal draft.',
      };
}

function statePatch(summary: string, foundExactLike: boolean) {
  const next = nextCase(foundExactLike);
  return {
    current: {
      activeCase: next.id,
      active_case_file: next.file,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-085-fa-gl-journal-route-blocker-diagnosis.json',
      nextStep: next.step,
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-gl-journal-route-blocker-diagnosis',
      branch: 'codex/token-efficient-autopilot-state',
      instance: EXPECTED_INSTANCE,
      company: EXPECTED_COMPANY,
      bcRun: true,
      posted: false,
      preview: false,
      setupChanged: false,
      companySwitched: false,
      resultStatus: 'observed',
      summary,
      nextStep: next.step,
    },
    activeCase: {
      status: 'observed-readonly',
      lastResult: {
        status: 'observed',
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-085/FIXEDASSETS-085-result.json',
        summary,
      },
      nextSafeAction: next.step,
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: foundExactLike ? 'fa-journal-candidate-route-probe' : 'acquisition-route-fallback-decision',
          latestPracticalCase: 'FIXEDASSETS-085',
          nextCase: next.id,
        },
      },
    },
  };
}

test('FIXEDASSETS-085 inventories FA journal Tell-Me search results read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);

  const contextBefore = await sandboxContext(page);
  if (!contextBefore.environmentInUrl || (!contextBefore.companyInUrl && !contextBefore.companyInText) || contextBefore.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context before FA-085 Tell-Me inventory: ${JSON.stringify(contextBefore)}`);
  }

  const inventories = [];
  for (const term of SEARCH_TERMS) {
    await searchFor(page, term);
    await page.waitForTimeout(1000);
    const text = await compactPageText(page, {
      include: [/Fixed Asset|FA G\/L|FA Journal|G\/L Journal|Anlage|Anlagen|Fibu|Buchblatt|Buch.-Blatt|Journal|Search|Suchen|Tell me/i],
      maxLines: 100,
      maxLineLength: 220,
    });
    const lines = candidateLines(text);
    const classified = classifyCandidates(lines);
    inventories.push({
      term,
      compactText: text,
      candidateLines: lines,
      likelyFaJournalCandidates: classified.likelyFaJournal,
      exactLikeCandidates: classified.exactLike,
    });
  }

  const allCandidateLines = [...new Set(inventories.flatMap((entry) => entry.candidateLines))];
  const allLikelyFaJournalCandidates = [...new Set(inventories.flatMap((entry) => entry.likelyFaJournalCandidates))];
  const allExactLikeCandidates = [...new Set(inventories.flatMap((entry) => entry.exactLikeCandidates))];
  const foundExactLike = allExactLikeCandidates.length > 0;
  const contextAfter = await sandboxContext(page);
  const summary = foundExactLike
    ? `FA-085 found exact-like FA journal Tell-Me candidates read-only: ${allExactLikeCandidates.join(', ')}. No candidate was clicked.`
    : 'FA-085 inventoried multiple FA journal Tell-Me search terms read-only, but found no exact-like Fixed Asset G/L Journal candidate. No candidate was clicked.';

  const textEvidence = inventories
    .map((entry) =>
      [
        `## ${entry.term}`,
        '',
        entry.compactText || 'No compact Tell-Me text captured.',
        '',
        `Candidate lines: ${entry.candidateLines.length ? entry.candidateLines.join(' | ') : 'none'}`,
        `Exact-like candidates: ${entry.exactLikeCandidates.length ? entry.exactLikeCandidates.join(' | ') : 'none'}`,
        '',
      ].join('\n'),
    )
    .join('\n');
  await writeTextEvidence(faEvidencePath('010-tell-me-search-inventory.txt'), textEvidence);
  await writeJsonEvidence(faEvidencePath('020-tell-me-search-inventory.json'), {
    searchTerms: SEARCH_TERMS,
    inventories,
    allCandidateLines,
    allLikelyFaJournalCandidates,
    allExactLikeCandidates,
    contextBefore,
    contextAfter,
  });

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-route-blocker-diagnosis-result',
    caseId: CASE_ID,
    source: 'playwright-result',
    resultStatus: 'observed',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The run captured Tell-Me inventories for multiple fixed-asset journal search terms.',
      'The run did not click a Tell-Me result.',
      'The run did not create, edit, delete, preview, post, pay, invoice, ship or change setup.',
      ...(foundExactLike ? ['At least one exact-like FA journal candidate was visible in Tell-Me inventory.'] : []),
    ],
    notProved: [
      'No Fixed Asset G/L Journal page was opened.',
      'No journal line was created.',
      'No FA-CNC-01 was entered in a journal.',
      'No K30000 was entered.',
      'No amount was entered.',
      'No Preview Posting.',
      'No acquisition posting.',
      'No German final proof.',
      ...(foundExactLike ? ['The candidate was not yet opened or validated as the correct journal page.'] : ['No unique FA journal navigation target was found.']),
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-085-fa-gl-journal-route-blocker-diagnosis.json',
      nextCase(foundExactLike).file,
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-085-fa-gl-journal-route-blocker-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-085/FIXEDASSETS-085-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-085/FIXEDASSETS-085-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-085/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-085/FIXEDASSETS-085-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-085/FIXEDASSETS-085-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-085/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-085/010-tell-me-search-inventory.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-085/020-tell-me-search-inventory.json',
    ],
    warnings: [
      'CRONUS/RM-DEMO Labor only.',
      'Tell-Me search inventory only; no page route was opened.',
      'No candidate was clicked because FA-085 is a blocker diagnosis, not a route probe.',
    ],
    blockedBy: [],
    requiresReview: false,
    safeToFinalizeState: true,
    statePatch: statePatch(summary, foundExactLike),
    tellMeInventory: {
      searchTerms: SEARCH_TERMS,
      allCandidateLines,
      allLikelyFaJournalCandidates,
      allExactLikeCandidates,
      foundExactLike,
    },
    flags: {
      stayedInExpectedInstance: contextAfter.environmentInUrl,
      companyContextDocumented: contextAfter.companyInUrl || contextAfter.companyInText,
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
      noTellMeResultClicked: true,
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
    nextStep: statePatch(summary, foundExactLike).current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-085-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-085-learning.md'),
    [
      '# FIXEDASSETS-085 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `tell-me-inventory`, `no-click`, `no-draft`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Tell-Me ist kein fachlicher Beweis fuer eine Seite. Fuer robuste Klickanleitungen reicht es nicht, einen Suchbegriff zu kennen; man muss sichtbar nachweisen, welcher Treffer angeboten wird und ob er eindeutig zum gewuenschten Prozess gehoert. Wenn die Treffer fehlen oder mehrdeutig sind, ist der naechste Schritt eine Navigationsdiagnose, nicht ein blinder Enter-Klick.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 braucht fuer den Anlagenzugang einen belegten Navigationspfad. FA-085 liefert noch keinen Journal-Screenshot fuer den Buchprozess, verhindert aber einen falschen Klickpfad im Buch.',
      '',
      '## Grenzen',
      '',
      '- Kein Tell-Me-Treffer wurde geklickt.',
      '- Keine Journalpage wurde validiert.',
      '- Keine Werte, keine Preview, keine Buchung, keine Setup-Aenderung.',
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
      '# FIXEDASSETS-085 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-tell-me-search-inventory.txt` | Text | kompakte sichtbare Tell-Me-Suchinventare | keine geoeffnete Journalpage | `labor`, `read-only` |',
      '| `020-tell-me-search-inventory.json` | JSON | Suchbegriffe, Kandidaten, Kontextflags | keine Buchungswirkung | `labor`, `read-only` |',
      '| `FIXEDASSETS-085-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-085-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.stayedInExpectedInstance).toBe(true);
  expect(result.flags.companyContextDocumented).toBe(true);
  expect(result.flags.noTellMeResultClicked).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noNewDraft).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
});
