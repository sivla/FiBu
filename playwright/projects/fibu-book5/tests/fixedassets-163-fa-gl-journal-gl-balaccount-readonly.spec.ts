import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  screenshot,
  searchFor,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-163-FA-GL-JOURNAL-GL-BALACCOUNT-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-164-FA-POSTING-GROUP-BALACCOUNT-FIELD-PROOF';
const TEST_ID = 'fixedassets-163';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const FA_GL_JOURNAL_PAGE_ID = 5628;
const POSTING_GROUP_ROUTE_BLOCKER =
  'FA Posting Groups target page was not reached/read after Tell-Me navigation; the page context stayed outside the target setup page, so no account-candidate screenshot was accepted.';

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

function isFaJournalFrame(frame: Frame) {
  const frameUrl = decodeURIComponent(frame.url());
  return frameUrl.includes(EXPECTED_INSTANCE) && frameUrl.includes(`page=${FA_GL_JOURNAL_PAGE_ID}`) && frameUrl.includes('runinframe=1');
}

async function faJournalFrame(page: Page) {
  const frame = page.frames().find(isFaJournalFrame);
  if (!frame) {
    throw new Error('Fixed Asset G/L Journals runinframe was not found.');
  }
  return frame;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();
}

function compactError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  if (/Screenshot-Kontext/i.test(raw)) {
    return 'Screenshot context guard rejected the image because the expected target page text was missing.';
  }
  return raw
    .replace(/\x1b\[[0-9;]*m/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' ')
    .slice(0, 500);
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

async function readFaJournalSignals(frame: Frame) {
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

    const headers = [...document.querySelectorAll<HTMLElement>('[role="columnheader"],th,[aria-colindex]')]
      .filter(visible)
      .map((header) => norm(header.innerText || header.textContent))
      .filter(Boolean);
    const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row) => norm(row.innerText || row.textContent).slice(0, 520))
      .filter(Boolean);
    const combined = norm([document.body?.innerText || '', headers.join(' '), rows.join(' ')].join(' '));

    return {
      pageTitleVisible: /Fixed Asset G\/L Journals/i.test(combined),
      targetLineVisible: /G05001/i.test(combined) && /FA-CNC-01/i.test(combined) && /\bHGB\b/i.test(combined),
      balAccountTypeGlVisible: /G\/L Account/i.test(combined),
      k30000Visible: /K30000/i.test(combined),
      relevantHeaders: headers.filter((header) => /Document No|Account Type|Account No|Amount|Bal\. Account|Gegenkonto/i.test(header)),
      relevantRows: rows.filter((row) => /G05001|FA-CNC-01|HGB|CNC Maschine FRA|Bal\. Account|G\/L Account|K30000|82000|12210/i.test(row)).slice(0, 12),
    };
  });
}

async function clickTellMeResult(page: Page, label: RegExp) {
  for (const frame of page.frames()) {
    for (const role of ['button', 'link', 'menuitem', 'option'] as const) {
      const locator = frame.getByRole(role, { name: label }).first();
      if (await locator.isVisible({ timeout: 700 }).catch(() => false)) {
        if (await locator.click({ timeout: 4000 }).then(() => true).catch(() => false)) {
          await page.waitForTimeout(4000);
          return true;
        }
      }
    }

    const clickedByDom = await frame
      .evaluate((labelSource) => {
        const re = new RegExp(labelSource, 'i');
        const candidates = [...document.querySelectorAll<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"],span,div')]
          .filter((element) => {
            const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
            const aria = element.getAttribute('aria-label') || '';
            const title = element.getAttribute('title') || '';
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && (re.test(text) || re.test(aria) || re.test(title));
          })
          .sort((left, right) => left.getBoundingClientRect().y - right.getBoundingClientRect().y);
        const target = candidates[0]?.closest<HTMLElement>('button,a,[role="button"],[role="link"],[role="menuitem"],[role="option"]') ?? candidates[0];
        if (!target) return false;
        target.click();
        return true;
      }, label.source)
      .catch(() => false);

    if (clickedByDom) {
      await page.waitForTimeout(4000);
      return true;
    }
  }
  return false;
}

async function openFaPostingGroups(page: Page) {
  await searchFor(page, 'FA Posting Groups');
  await page.waitForTimeout(1200);
  const clicked = await clickTellMeResult(page, /^FA Posting Groups$|^FA Posting Group$|^Anlagenbuchungsgruppen$|^Anlagenbuchungsgruppe$/i);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1800);
  return clicked;
}

async function readFaPostingGroups(page: Page) {
  const text = normalizeText(await pageText(page));
  const rows = await Promise.all(
    page.frames().map((frame) =>
      frame
        .evaluate(() => {
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
          return [...document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name],section,main')]
            .filter(visible)
            .map((element) => norm(element.innerText || element.textContent).slice(0, 700))
            .filter((entry) => /MACHINES|EQUIPMENT|12210|82000|Acquisition Cost|Bal\. Acc/i.test(entry))
            .slice(0, 80);
        })
        .catch(() => []),
    ),
  );
  const relevantRows = [...new Set(rows.flat())];
  const accountSignals = [...new Set([text, relevantRows.join(' ')].join(' ').match(/\b\d{5}\b/g) ?? [])];
  return {
    contextVisible: /FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen|Anlagenbuchungsgruppe/i.test(text),
    machinesVisible: /\bMACHINES\b/i.test(text) || relevantRows.some((row) => /\bMACHINES\b/i.test(row)),
    equipmentVisible: /\bEQUIPMENT\b/i.test(text) || relevantRows.some((row) => /\bEQUIPMENT\b/i.test(row)),
    account12210Visible: accountSignals.includes('12210'),
    account82000Visible: accountSignals.includes('82000'),
    acquisitionCostBalAccCaptionVisible: /Acquisition Cost Bal\. Acc|Anschaffungskosten.*Gegenkonto/i.test(text) || relevantRows.some((row) => /Acquisition Cost Bal\. Acc|Anschaffungskosten.*Gegenkonto/i.test(row)),
    accountSignals,
    relevantRows,
    focusedText: text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /FA Posting|MACHINES|EQUIPMENT|12210|82000|Acquisition Cost|Bal\. Acc/i.test(line))
      .slice(0, 120),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-164-fa-posting-group-balaccount-field-proof.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-163-fa-gl-journal-gl-balaccount-readonly.json',
      requiresStrongModel: false,
      nextStep:
        'FIXEDASSETS-164: prove the exact FA Posting Group field label/value for the acquisition-cost balancing account before any FA G/L Journal value-entry retry.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-20',
      workType: 'fixed-asset-gl-journal-gl-balaccount-readonly',
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
      nextStep: 'Run FIXEDASSETS-164 field-proof before any value entry, Preview Posting or posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-readonly-candidate' : 'blocked-readonly',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-163/FIXEDASSETS-163-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-164 exact FA Posting Group field proof; do not enter values, Preview Posting or Post.',
    },
    coverage: {
      areas: {
        fixedassets: {
          currentBlock: 'fa-posting-group-balaccount-field-proof',
          latestPracticalCase: 'FIXEDASSETS-163',
          latestReviewCase: 'FIXEDASSETS-162',
          nextCase: NEXT_CASE_ID,
        },
      },
    },
  };
}

test('FIXEDASSETS-163 reads FA G/L Journal balancing-account candidates without changes', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let journalSignals: Awaited<ReturnType<typeof readFaJournalSignals>> | undefined;
  let faPostingGroups: Awaited<ReturnType<typeof readFaPostingGroups>> | undefined;
  let postingGroupsOpened = false;
  let journalScreenshotCaptured = false;
  let postingGroupsScreenshotCaptured = false;

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
      const frame = await faJournalFrame(page);
      journalSignals = await readFaJournalSignals(frame);
      await moveVisibleGridToAmountColumns(page);
      await screenshot(page, 'fixedassets-163-010-fa-gl-journal-balaccount-type-readonly.png', {
        projectName: project.name,
        testId: TEST_ID,
        status: 'labor',
        bookUse: 'debugging',
        purpose:
          'Read-only Kontrollbild: FA G/L Journal zeigt, dass die Journalroute aktuell ein G/L Account Gegenkonto erwartet und K30000 nicht als Zielwert gesetzt ist.',
        expectedPageText: [/Fixed Asset G\/L Journals/i],
        knownLimitations: [
          'Keine Werteingabe.',
          'Keine Journalzeile angelegt oder geloescht.',
          'Keine Preview Posting.',
          'Keine Buchung.',
          'Kein deutscher Finalnachweis.',
        ],
      });
      journalScreenshotCaptured = true;

      postingGroupsOpened = await openFaPostingGroups(page);
      faPostingGroups = await readFaPostingGroups(page);
      if (faPostingGroups.contextVisible) {
        await screenshot(page, 'fixedassets-163-020-fa-posting-groups-balaccount-candidate-readonly.png', {
          projectName: project.name,
          testId: TEST_ID,
          status: 'candidate',
          bookUse: 'setup-candidate',
          purpose:
            'Read-only Kandidatenbild: FA Posting Groups als moegliche Quelle fuer ein spaeteres G/L-Gegenkonto der FA-G/L-Journalroute.',
          expectedPageText: [/FA Posting Groups|FA Posting Group|Anlagenbuchungsgruppen/i],
          knownLimitations: [
            'Kandidatensichtung, kein endgueltiger Gegenkonto-Nachweis.',
            'Feldlabel und konkreter Wert muessen in einem spaeteren Lauf noch gemeinsam belegt werden.',
            'Keine Setup-Aenderung.',
            'Keine Preview Posting.',
            'Keine Buchung.',
          ],
        });
        postingGroupsScreenshotCaptured = true;
      }
    }
  } catch (error) {
    blockedBy.push(compactError(error));
  }

  if (!journalSignals?.pageTitleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible.');
  }
  if (!journalSignals?.balAccountTypeGlVisible) {
    blockedBy.push('Bal. Account Type = G/L Account was not visible in the journal context.');
  }
  if (!postingGroupsOpened || !faPostingGroups?.contextVisible) {
    blockedBy.push(POSTING_GROUP_ROUTE_BLOCKER);
  }

  const hasCandidateAccount = Boolean(faPostingGroups?.account82000Visible || faPostingGroups?.account12210Visible);
  const exactBalAccountFieldProved = Boolean(faPostingGroups?.acquisitionCostBalAccCaptionVisible && faPostingGroups?.account82000Visible);
  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-163 read FA G/L Journal and FA Posting Groups read-only. Account candidates visible: ${faPostingGroups?.accountSignals.join(', ') || 'none'}; exact Acquisition Cost Bal. Acc. value proof: ${exactBalAccountFieldProved}.`
      : `FA-163 blocked before a usable target-account candidate proof: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-readonly-target-account-signals.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-163-fa-gl-journal-target-account-readonly-signals',
    caseId: CASE_ID,
    context,
    journalSignals,
    faPostingGroups,
    candidateEvaluation: {
      hasCandidateAccount,
      candidateAccounts: faPostingGroups?.accountSignals ?? [],
      exactBalAccountFieldProved,
      candidateOnlyReason:
        hasCandidateAccount && !exactBalAccountFieldProved
          ? 'Visible account codes exist, but the exact Acquisition Cost Bal. Acc. label/value pairing is not yet proven.'
          : '',
    },
    screenshots: {
      journalScreenshotCaptured,
      postingGroupsScreenshotCaptured,
    },
    blockedBy,
    omitted: 'No full DOM dump, traces, videos, reports or auth artifacts stored.',
  });

  await writeTextEvidence(
    faEvidencePath('020-focused-target-account-text.txt'),
    [
      'FIXEDASSETS-163 focused target-account text',
      '',
      'Journal rows:',
      ...(journalSignals?.relevantRows ?? ['No journal rows captured.']),
      '',
      'FA Posting Groups:',
      ...(faPostingGroups?.focusedText ?? ['No FA Posting Group text captured.']),
    ].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-gl-balaccount-readonly-result',
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
      urlAfterRun: safeUrl(page.url()),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(journalSignals?.balAccountTypeGlVisible ? ['The FA G/L Journal context expects Bal. Account Type = G/L Account.'] : []),
      ...(journalSignals?.k30000Visible ? [] : ['K30000 is not visible as the current FA G/L Journal balancing value.']),
      ...(faPostingGroups?.contextVisible ? ['FA Posting Groups is reachable/readable through the UI as a setup-account source.'] : []),
      ...(hasCandidateAccount ? [`Visible account-code candidates exist: ${(faPostingGroups?.accountSignals ?? []).join(', ')}.`] : []),
      'No Amount was entered or changed.',
      'No Bal. Account No. was entered or changed.',
      'No journal line was created or deleted.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      ...(exactBalAccountFieldProved ? [] : ['The exact Acquisition Cost Bal. Acc. field/value pairing is not yet proven.']),
      'No G/L balancing account was selected for value entry.',
      'No guarded value-entry case is unlocked yet.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-163-fa-gl-journal-gl-balaccount-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-163/',
      'playwright/projects/fibu-book5/img/fixedassets-163-010-fa-gl-journal-balaccount-type-readonly.png',
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-163-fa-gl-journal-gl-balaccount-readonly.json',
      '.agent/state/cases/fixedassets-164-fa-posting-group-balaccount-field-proof.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json',
      'playwright/projects/fibu-book5/CURRENT-STATE.md',
      'playwright/projects/fibu-book5/LAB-FIT-STATUS.md',
      'playwright/projects/fibu-book5/BOOK-CLICK-GUIDE-COVERAGE.md',
      'playwright/projects/fibu-book5/SCREENSHOT-QA.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-163/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-163/010-readonly-target-account-signals.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-163/020-focused-target-account-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-163/FIXEDASSETS-163-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-163/FIXEDASSETS-163-result.json',
      'playwright/projects/fibu-book5/img/fixedassets-163-010-fa-gl-journal-balaccount-type-readonly.png',
    ],
    candidateEvaluation: {
      hasCandidateAccount,
      candidateAccounts: faPostingGroups?.accountSignals ?? [],
      exactBalAccountFieldProved,
      safeForValueEntry: false,
    },
    warnings: [
      'Read-only target-account readiness only.',
      'Visible account codes are candidates, not value-entry approval.',
      'Do not enter Amount or Bal. Account No. until the exact field/value pairing is proven.',
    ],
    blockedBy,
    requiresReview: false,
    safeToFinalizeState: status === 'observed',
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
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-163-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('FIXEDASSETS-163-learning.md'),
    [
      '# FIXEDASSETS-163 Lernzusammenfassung',
      '',
      'Status: `labor`, `read-only`, `target-account-readiness`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.',
      '',
      '## Ergebnis',
      '',
      summary,
      '',
      '## Was man in Business Central lernt',
      '',
      'Bei einer Anlagenbuchung ueber `Fixed Asset G/L Journals` reicht es nicht, einen beliebigen Code als Gegenkonto zu setzen. Der Gegenkonto-Typ bestimmt den Nummernkreis. Wenn `Bal. Account Type = G/L Account` sichtbar ist, muss ein Sachkonto oder ein sauber begruendeter anderer Gegenkonto-Pfad belegt werden.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 21 kann diesen Schritt als Debugging-/Setup-Readiness erklaeren: Erst Journaltyp und Kontenquelle verstehen, dann Zielwerte setzen. Ein sichtbares Konto wie `82000` ist nur ein Kandidat, solange Feldlabel und Wert noch nicht gemeinsam belegt sind.',
      '',
      '## Grenzen',
      '',
      '- Kein finaler Gegenkonto-Zielwert.',
      '- Keine Werteingabe.',
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
      '# FIXEDASSETS-163 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-readonly-target-account-signals.json` | JSON | Journal-Gegenkonto-Typ und FA-Posting-Group-Kontensignale | keine Zielkonto-Freigabe, keine Werteingabe | `labor`, `read-only` |',
      '| `020-focused-target-account-text.txt` | Text | kompakte Zielkonto- und Journaltextsignale | kein Rohdump | `compact` |',
      '| `fixedassets-163-010-fa-gl-journal-balaccount-type-readonly.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Journalbildes | keine Zielwerte | `labor` |',
      '| `fixedassets-163-020-fa-posting-groups-balaccount-candidate-readonly.screenshot.json` | Screenshot-Metadaten | Zweck und Grenze des Kandidatenbildes | keinen finalen Gegenkonto-Nachweis | `candidate` |',
      '| `FIXEDASSETS-163-result.json` | JSON | Ergebnis, Kandidatenstatus, Safety Flags und State-Patch-Plan | keinen deutschen Finalnachweis | `labor` |',
      '| `FIXEDASSETS-163-learning.md` | Markdown | Lernwert fuer Gegenkonto-Typ und Kontenquelle | keine Postenspur | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noValueEntry).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
});
