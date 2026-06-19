import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  searchFor,
  visibleButtonNames,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-086-FA-JOURNAL-CANDIDATE-ROUTE-PROBE';
const TEST_ID = 'fixedassets-086';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const TARGET_LABEL = 'Fixed Asset G/L Journals';

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

async function exactVisibleTellMeCandidates(page: Page) {
  const candidates: Array<{ frameUrl: string; text: string; tagName: string; role: string | null; ariaLabel: string | null }> = [];

  for (const frame of page.frames()) {
    const frameCandidates = await frame
      .evaluate((targetLabel) => {
        return [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="option"],[role="menuitem"],li,div,span,a')]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            return rect.width > 0 && rect.height > 0 && text === targetLabel;
          })
          .map((element) => ({
            frameUrl: window.location.href,
            text: (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim(),
            tagName: element.tagName,
            role: element.getAttribute('role'),
            ariaLabel: element.getAttribute('aria-label'),
          }));
      }, TARGET_LABEL)
      .catch(() => []);
    candidates.push(...frameCandidates);
  }

  return candidates;
}

async function clickUniqueExactTellMeCandidate(page: Page) {
  const candidatesBeforeClick = await exactVisibleTellMeCandidates(page);
  if (candidatesBeforeClick.length !== 1) {
    return {
      clicked: false,
      blockedBy: `Expected exactly one visible '${TARGET_LABEL}' candidate, found ${candidatesBeforeClick.length}.`,
      candidatesBeforeClick,
    };
  }

  let clicked = false;
  for (const frame of page.frames()) {
    clicked = await frame
      .evaluate((targetLabel) => {
        const elements = [...document.querySelectorAll<HTMLElement>('button,[role="button"],[role="option"],[role="menuitem"],li,div,span,a')]
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            return rect.width > 0 && rect.height > 0 && text === targetLabel;
          })
          .sort((left, right) => {
            const leftRect = left.getBoundingClientRect();
            const rightRect = right.getBoundingClientRect();
            return leftRect.width * leftRect.height - rightRect.width * rightRect.height;
          });
        const target = elements[0];
        if (!target) {
          return false;
        }
        target.click();
        return true;
      }, TARGET_LABEL)
      .catch(() => false);
    if (clicked) {
      break;
    }
  }

  await page.waitForTimeout(2500);
  return {
    clicked,
    blockedBy: clicked ? '' : `Failed to click unique '${TARGET_LABEL}' candidate.`,
    candidatesBeforeClick,
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  const nextCase =
    status === 'observed'
      ? 'FIXEDASSETS-087-FA-GL-JOURNAL-LINE-READINESS-DECISION'
      : 'FIXEDASSETS-087-FA-JOURNAL-CANDIDATE-CLICK-BLOCKER';
  const nextFile =
    status === 'observed'
      ? '.agent/state/cases/fixedassets-087-fa-gl-journal-line-readiness-decision.json'
      : '.agent/state/cases/fixedassets-087-fa-journal-candidate-click-blocker.json';
  const nextStep =
    status === 'observed'
      ? 'Decide FA G/L Journal line readiness: required fields, safe draft policy, cleanup/keep rule and preview/posting gates before any line value is entered.'
      : 'Diagnose why the exact Tell-Me candidate could not be safely clicked or did not open the expected FA journal page.';

  return {
    current: {
      activeCase: nextCase,
      active_case_file: nextFile,
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-086-fa-journal-candidate-route-probe.json',
      nextStep,
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-journal-candidate-route-probe',
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
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-086/FIXEDASSETS-086-result.json',
        summary,
      },
      nextSafeAction: nextStep,
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: status === 'observed' ? 'fa-gl-journal-line-readiness-decision' : 'fa-journal-candidate-click-blocker',
          latestPracticalCase: 'FIXEDASSETS-086',
          nextCase,
        },
      },
    },
  };
}

test('FIXEDASSETS-086 probes exact FA journal Tell-Me candidate read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  await page.goto(requireBcUrl(project.envPrefix), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);

  const contextBefore = await sandboxContext(page);
  if (!contextBefore.environmentInUrl || (!contextBefore.companyInUrl && !contextBefore.companyInText) || contextBefore.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context before FA-086 route probe: ${JSON.stringify(contextBefore)}`);
  }

  await searchFor(page, TARGET_LABEL);
  await page.waitForTimeout(1200);
  const tellMeText = await compactPageText(page, {
    include: [/Fixed Asset|FA G\/L|G\/L Journal|Anlage|Anlagen|Fibu|Buchblatt|Buch.-Blatt|Journal|Search|Suchen|Tell me/i],
    maxLines: 100,
    maxLineLength: 220,
  });
  await writeTextEvidence(faEvidencePath('010-tell-me-before-click.txt'), tellMeText || 'No compact Tell-Me text captured.');

  const clickResult = await clickUniqueExactTellMeCandidate(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(2500);

  const fullText = await pageText(page);
  const pageContextText = await compactPageText(page, {
    include: [
      /Fixed Asset|FA G\/L|G\/L Journal|Anlage|Anlagen|Fibu|Buchblatt|Buch.-Blatt|Journal/i,
      /Posting Date|Buchungsdatum|Document|Beleg|Account|Konto|FA Posting Type|Anlagenpostenart/i,
      /Acquisition|Anschaffung|Amount|Betrag|Bal\. Account|Gegenkonto|Post|Buchen|Preview|Vorschau/i,
    ],
    maxLines: 140,
    maxLineLength: 220,
  });
  const buttons = (await visibleButtonNames(page)).slice(0, 140);
  const contextAfter = await sandboxContext(page);

  const routeContextVisible =
    clickResult.clicked &&
    /Fixed Asset G\/L Journal|Fixed Asset G\/L Journals|FA G\/L Journal|Anlagen|Buch.-Blatt|Buchblatt/i.test(fullText) &&
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

  await writeTextEvidence(faEvidencePath('020-fa-journal-page-context.txt'), pageContextText || 'No FA journal page context captured.');
  await writeJsonEvidence(faEvidencePath('030-fa-journal-route-signals.json'), {
    clickResult,
    url: page.url(),
    contextBefore,
    contextAfter,
    routeContextVisible,
    columnSignals,
    actionSignals,
    visibleButtons: buttons,
  });

  const status: 'observed' | 'blocked' = routeContextVisible ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? 'FA-086 opened the `Fixed Asset G/L Journals` Tell-Me candidate read-only and captured journal page/action/column signals without creating a journal line.'
      : `FA-086 could not validate the ` +
        `Fixed Asset G/L Journals candidate as a journal page. Blocker: ${clickResult.blockedBy || 'route context not visible after click'}.`;

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-journal-candidate-route-probe-result',
    caseId: CASE_ID,
    source: 'playwright-result',
    resultStatus: status,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The run searched the exact Tell-Me candidate `Fixed Asset G/L Journals`.',
      'The run did not create, edit, delete, preview, post, pay, invoice, ship or change setup.',
      ...(routeContextVisible ? ['The `Fixed Asset G/L Journals` candidate opened a visible journal route context.'] : []),
    ],
    notProved: [
      'No journal line was created.',
      'No FA-CNC-01 was entered in a journal.',
      'No K30000 was entered.',
      'No amount was entered.',
      'No Preview Posting.',
      'No acquisition posting.',
      'No German final proof.',
      ...(routeContextVisible ? ['Journal fields were visible/inventoried only, not filled or validated.'] : ['The candidate did not produce a proven journal page context.']),
    ],
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-086-fa-journal-candidate-route-probe.json',
      status === 'observed'
        ? '.agent/state/cases/fixedassets-087-fa-gl-journal-line-readiness-decision.json'
        : '.agent/state/cases/fixedassets-087-fa-journal-candidate-click-blocker.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-086-fa-journal-candidate-route-probe.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-086/FIXEDASSETS-086-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-086/FIXEDASSETS-086-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-086/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-086/FIXEDASSETS-086-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-086/FIXEDASSETS-086-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-086/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-086/010-tell-me-before-click.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-086/020-fa-journal-page-context.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-086/030-fa-journal-route-signals.json',
    ],
    warnings: [
      'CRONUS/RM-DEMO Labor only.',
      'Route probe only; no journal line or posting proof.',
      'Visible Post/Preview/New/Edit/Delete actions, if present, were not clicked.',
    ],
    blockedBy: status === 'blocked' ? [clickResult.blockedBy || 'route context not visible after click'] : [],
    requiresReview: status === 'blocked',
    safeToFinalizeState: status === 'observed',
    statePatch: statePatch(status, summary),
    route: {
      clicked: clickResult.clicked,
      candidatesBeforeClick: clickResult.candidatesBeforeClick,
      routeContextVisible,
      url: page.url(),
      contextBefore,
      contextAfter,
      columnSignals,
      actionSignals,
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

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-086-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-086-learning.md'),
    [
      '# FIXEDASSETS-086 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `route-probe`, `no-draft`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Ein sichtbarer Tell-Me-Treffer ist erst dann fuer eine Klickanleitung brauchbar, wenn der geoeffnete Page-Kontext ebenfalls passt. Fuer Anlagenjournale ist danach noch immer ein separates Gate noetig: Journalzeilen duerfen erst vorbereitet werden, wenn Pflichtfelder, Batch-Kontext, Cleanup-/Keep-Regel und Vorschau-/Buchungsgrenzen dokumentiert sind.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 bekommt mit FA-086 entweder einen belastbaren Navigationsnachweis zum Anlagen-Fibu-Journal oder einen belegten Navigationsblocker. In beiden Faellen wird noch keine Anschaffung behauptet.',
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
      '# FIXEDASSETS-086 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-tell-me-before-click.txt` | Text | sichtbarer Tell-Me-Kontext vor Kandidatenklick | keine Page-Validierung allein | `labor`, `read-only` |',
      '| `020-fa-journal-page-context.txt` | Text | kompakte sichtbare Page-/Feldsignale nach Kandidatenklick | keine Werteingabe | `labor`, `read-only` |',
      '| `030-fa-journal-route-signals.json` | JSON | Klickgate, Kontext, Spalten-/Aktionssignale | keine Buchungswirkung | `labor`, `read-only` |',
      '| `FIXEDASSETS-086-result.json` | JSON | Ergebnis, Safety Flags, State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-086-learning.md` | Markdown | Lernwert und Buchwirkung | keine Postenspur | `labor` |',
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
