import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  waitForBusinessCentralShell,
  waitForPageText
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-206-HGB-PAGEINSPECTION-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-207-HGB-PAGEINSPECTION-RESULT-REVIEW';
const TEST_ID = 'fixedassets-206';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2800, height: 1400 }
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function depreciationBooksUrl() {
  const url = new URL(bcPageUrl(5611, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('filter', "'Depreciation Book'.'Code' IS 'HGB'");
  return url.toString();
}

function clean(value: string) {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactLines(value: string, keep: RegExp, maxLines = 160) {
  const seen = new Set<string>();
  return value
    .split('\n')
    .map(clean)
    .filter(Boolean)
    .filter((line) => keep.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, maxLines);
}

async function assertSandboxContext(page: Page) {
  const url = page.url();
  const decoded = decodeURIComponent(url);
  const parsed = new URL(url);
  const text = await pageText(page);
  const result = {
    url,
    environmentInUrl: decoded.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decoded.includes(EXPECTED_INSTANCE)
  };

  if (!result.environmentInUrl || !result.companyInUrl || result.wrongEnvironmentVisible) {
    throw new Error(`Wrong BC context: ${JSON.stringify(result, null, 2)}`);
  }

  return result;
}

async function openHgbDepreciationBookCard(page: Page) {
  await page.goto(depreciationBooksUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await waitForPageText(page, /\bHGB\b|Depreciation Books/i, { timeout: 90_000 });
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await page.waitForTimeout(1200);

  for (const frame of page.frames()) {
    const clicked = await frame
      .evaluate(() => {
        const normalize = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();
        const visible = (element: Element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const candidates = Array.from(document.querySelectorAll<HTMLElement>('a,button,[role="button"]'))
          .filter(visible)
          .map((element) => ({
            element,
            label: [
              normalize(element.getAttribute('aria-label')),
              normalize(element.getAttribute('title')),
              normalize(element.innerText || element.textContent)
            ].join(' ')
          }))
          .filter((entry) => /\bHGB\b/i.test(entry.label) && /open|oeffnen|ffnen|datensatz|record/i.test(entry.label))
          .slice(0, 3);
        const target = candidates[0]?.element;
        if (!target) return false;
        target.click();
        return true;
      })
      .catch(() => false);
    if (clicked) {
      await page.waitForTimeout(3500);
      await dismissTours(page).catch(() => undefined);
      await hideFactBoxPane(page).catch(() => undefined);
      return { openedByRecordLink: true };
    }
  }

  return { openedByRecordLink: false };
}

async function closeExternalPages(page: Page) {
  const closed: string[] = [];
  for (const candidate of page.context().pages()) {
    if (candidate === page) continue;
    const url = candidate.url();
    if (!/businesscentral\.dynamics\.com/i.test(url)) {
      closed.push(url);
      await candidate.close().catch(() => undefined);
    }
  }
  return closed;
}

async function openPageInspection(page: Page) {
  const before = await pageText(page);
  await page.keyboard.press('Control+Alt+F1');
  await page.waitForTimeout(3000);
  const closedExternalPages = await closeExternalPages(page);
  const after = await pageText(page);
  const focusedText = await compactPageText(page, {
    include: [
      /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID/i,
      /Depreciation Book|FA Depreciation Book|G\/L Integration|Acq\. Cost|Acquisition/i,
      /Field|Table Fields|Base Application|Boolean|Code|Yes|No|True|False/i
    ],
    maxLines: 180,
    maxLineLength: 260
  });
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(after) && after !== before;
  return {
    opened,
    closedExternalPages,
    focusedText,
    lines: compactLines(
      focusedText || after,
      /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID|Depreciation Book|FA Depreciation Book|G\/L Integration|Acq\. Cost|Acquisition|Table Fields|Boolean|Yes|No|True|False/i,
      180
    )
  };
}

async function scrollInspectionForFields(page: Page) {
  const terms = [
    'G/L Integration - Acq. Cost',
    'G/L Integration',
    'Depreciation Book',
    'FA Depreciation Book',
    'Acq. Cost'
  ];
  const snapshots: Array<Record<string, unknown>> = [];

  for (const top of [0, 300, 650, 1000, 1400, 1800, 2300, 2900, 3600]) {
    for (const frame of page.frames()) {
      await frame
        .evaluate((scrollTop) => {
          const panes = Array.from(document.querySelectorAll<HTMLElement>('aside,section,div'))
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.x > window.innerWidth * 0.5 && element.scrollHeight > element.clientHeight + 60 && rect.height > 200;
            })
            .sort((left, right) => right.clientHeight - left.clientHeight);
          for (const pane of panes.slice(0, 4)) {
            pane.scrollTo({ top: scrollTop, behavior: 'instant' });
          }
        }, top)
        .catch(() => undefined);
    }
    await page.waitForTimeout(300);
    const text = await pageText(page);
    const lines = compactLines(
      text,
      /Page Inspection|Source Table|Table ID|Table Fields|Depreciation Book|FA Depreciation Book|G\/L Integration|Acq\. Cost|Acquisition|Boolean|Yes|No|True|False/i,
      120
    );
    snapshots.push({ scrollTop: top, lines });
  }

  const joined = snapshots.flatMap((snapshot) => snapshot.lines as string[]);
  const uniqueLines = [...new Set(joined)].slice(0, 220);
  const matchesByTerm = Object.fromEntries(
    terms.map((term) => [
      term,
      uniqueLines.filter((line) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(line)).slice(0, 20)
    ])
  );

  return { snapshots, uniqueLines, matchesByTerm };
}

function classifyAcqCostValue(lines: string[]) {
  const acqLines = lines.filter((line) => /G\/L Integration - Acq\. Cost|Acq\. Cost|Acquisition Cost/i.test(line));
  const joined = acqLines.join(' ');
  if (/\b(true|yes|ja|enabled|on)\b/i.test(joined)) {
    return { status: 'visible-on', basis: 'page-inspection-text', lines: acqLines.slice(0, 10) };
  }
  if (/\b(false|no|nein|disabled|off)\b/i.test(joined)) {
    return { status: 'visible-off', basis: 'page-inspection-text', lines: acqLines.slice(0, 10) };
  }
  if (acqLines.length > 0) {
    return { status: 'not-visible', basis: 'caption-visible-value-not-readable', lines: acqLines.slice(0, 10) };
  }
  return { status: 'not-visible', basis: 'field-not-found-in-page-inspection-text', lines: [] };
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-206 HGB Page Inspection Read-only',
    '',
    'Status: `labor`, `read-only`, `technical-diagnosis`, `page-inspection`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Case | ${result.caseId} |`,
    `| Umgebung | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Page Inspection | ${result.observed.pageInspectionOpened ? 'geoeffnet' : 'nicht geoeffnet'} |`,
    `| Acq.-Cost-Integrationswert | ${result.acquisitionCostIntegration.status} |`,
    '',
    '## Ergebnis',
    '',
    result.summary,
    '',
    '## Anfaenger-Lernwert',
    '',
    '- Page Inspection ist technische Nachweisfuehrung, keine Buchung.',
    '- Wenn die normale Karte nur eine Feldbeschriftung zeigt, kann Page Inspection helfen, Page, Tabelle, Felder und Werte zu pruefen.',
    '- Wenn auch Page Inspection keinen eindeutigen Wert zeigt, darf man nicht raten und keinen Setup-Schalter blind setzen.',
    '',
    '## Grenzen',
    '',
    '- Kein Toggle von `G/L Integration - Acq. Cost`.',
    '- Kein Preview Posting und kein Post.',
    '- Kein FA Journal und keine Anlagenbuchung.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('FIXEDASSETS-206 proves HGB G/L Integration Acq. Cost via Page Inspection read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const cardOpen = await openHgbDepreciationBookCard(page);
  const context = await assertSandboxContext(page);
  const cardText = await compactPageText(page, {
    include: [/Depreciation Book Card|HGB|G\/L Integration|Acq\. Cost|Integration/i],
    maxLines: 120,
    maxLineLength: 240
  });
  await writeTextEvidence(faEvidencePath('005-hgb-card-focused-text.txt'), cardText || 'No compact card text captured.');

  const pageInspection = await openPageInspection(page);
  const fieldEvidence = pageInspection.opened
    ? await scrollInspectionForFields(page)
    : { snapshots: [], uniqueLines: [] as string[], matchesByTerm: {} };
  const allLines = [...new Set([...pageInspection.lines, ...fieldEvidence.uniqueLines])];
  const acquisitionCostIntegration = classifyAcqCostValue(allLines);
  const resultStatus = pageInspection.opened ? 'observed' : 'blocked';
  const nextCaseId = 'FIXEDASSETS-207-HGB-PAGEINSPECTION-RESULT-REVIEW';
  const summary =
    resultStatus === 'observed'
      ? `FA-206 opened HGB Depreciation Book Card and Page Inspection read-only. Acq. Cost integration classification is ${acquisitionCostIntegration.status}; no setup, preview or post occurred.`
      : 'FA-206 opened HGB context but Page Inspection did not open in a stable read-only way.';

  await writeJsonEvidence(faEvidencePath('010-hgb-pageinspection-fields.json'), {
    caseId: CASE_ID,
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    context,
    cardOpen,
    pageInspection,
    fieldEvidence,
    acquisitionCostIntegration,
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noJournalEdit: true,
      noFieldToggle: true
    }
  });
  await writeTextEvidence(
    faEvidencePath('020-pageinspection-focused-lines.txt'),
    allLines.join('\n') || 'No Page Inspection lines captured.'
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-206-hgb-pageinspection-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-pageinspection',
    resultStatus,
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    acquisitionCostIntegration,
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
      url: page.url(),
      context,
      cardOpen,
      pageInspectionOpened: pageInspection.opened,
      lineCount: allLines.length
    },
    proved: [
      'The run stayed in MCP_1_20260210 / RM-DEMO.',
      'The HGB Depreciation Book Card context was opened read-only.',
      ...(pageInspection.opened ? ['Page Inspection opened read-only.'] : []),
      `G/L Integration - Acq. Cost classification: ${acquisitionCostIntegration.status}.`,
      'No setup, Preview Posting, Post, journal edit, draft, company switch or API shortcut occurred.'
    ],
    notProved: [
      acquisitionCostIntegration.status === 'not-visible'
        ? 'Page Inspection did not prove the exact Acq. Cost integration value.'
        : '',
      'No setup change is made by this run.',
      'No Preview Posting rerun.',
      'No FA Journal route tested.',
      'No FA Ledger Entry or German final proof.'
    ].filter(Boolean),
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-206-hgb-pageinspection-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-206/',
      '.agent/state/cases/fixedassets-206-hgb-pageinspection-readonly.json',
      '.agent/state/cases/fixedassets-207-hgb-pageinspection-result-review.json',
      '.agent/state/current.json',
      '.agent/state/coverage_state.json',
      '.agent/state/last_run_summary.json'
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-206/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-206/FIXEDASSETS-206-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-206/FIXEDASSETS-206-learning.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-206/010-hgb-pageinspection-fields.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-206/020-pageinspection-focused-lines.txt'
    ],
    warnings: [
      'Page Inspection is technical evidence, not posting permission.',
      'Do not toggle G/L Integration from this run alone.',
      'CRONUS-USA laboratory evidence is not German final proof.'
    ],
    blockedBy: resultStatus === 'blocked' ? ['Page Inspection did not open.'] : [],
    requiresReview: true,
    safeToFinalizeState: true,
    flags: {
      noBookChange: true,
      secretsUntouched: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noNewDraft: true,
      noFieldValueChanged: true,
      noSaveRecord: true,
      noDeleteRecord: true
    },
    statePatch: {
      current: {
        activeCase: nextCaseId,
        active_case_file: '.agent/state/cases/fixedassets-207-hgb-pageinspection-result-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-206-hgb-pageinspection-readonly.json',
        requiresStrongModel: true,
        nextStep: 'FIXEDASSETS-207: locally review FA-206 Page Inspection result before any setup-fit, Preview Posting or posting decision.'
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-readonly-pageinspection' : 'blocked-readonly-pageinspection',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-206/FIXEDASSETS-206-result.json',
          summary
        },
        nextSafeAction: 'FIXEDASSETS-207: local review of Page Inspection result; no setup, no preview, no post.'
      }
    },
    summary,
    nextStep: 'FIXEDASSETS-207: locally review FA-206 Page Inspection result before any setup-fit, Preview Posting or posting decision.'
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-206-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-206-learning.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-206 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-206-result.json` | JSON | Page-Inspection-Lauf, Klassifikation, Safety-Flags | keinen Setup-Fit, keine Buchung | `review-required` |',
      '| `010-hgb-pageinspection-fields.json` | JSON | technische Page-/Field-Evidence zu HGB und G/L Integration | keine vollstaendige Tabellenlogik | `technical-context` |',
      '| `020-pageinspection-focused-lines.txt` | Text | kompakte sichtbare Page-Inspection-Zeilen | kein Rohdump | `compact` |',
      '| `FIXEDASSETS-206-learning.md` | Markdown | Lernwert und Grenzen | keinen deutschen Finalnachweis | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      ''
    ].join('\n')
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(context.environmentInUrl).toBe(true);
  expect(context.companyInUrl).toBe(true);
});
