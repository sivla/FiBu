import { expect, test, type Page } from '@playwright/test';

import { bcPageUrl, compactPageText, pageText, waitForBusinessCentralShell, waitForPageText } from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-068-PURCHASE-INVOICES-PAGEINSPECTION-READONLY';
const TEST_ID = 'fixedassets-068';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1200 },
});

test.setTimeout(180_000);

function fixedAssetsEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function purchaseInvoicesUrl() {
  const url = new URL(bcPageUrl(9308, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

function asciiSafe(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactLines(text: string) {
  const keep =
    /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID|Purchase Invoices|Einkaufsrechnungen|Purchase Header|Page|Table/i;
  const seen = new Set<string>();
  return text
    .split('\n')
    .map(asciiSafe)
    .filter((line) => line && keep.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, 80);
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

async function tryOpenPageInspection(page: Page) {
  const attempts = [];
  const before = await pageText(page);

  await page.keyboard.press('Control+Alt+F1');
  await page.waitForTimeout(2500);

  const closedExternalPages = await closeExternalPages(page);
  const after = await pageText(page);
  const focusedText = await compactPageText(page, {
    include: [
      /Page Inspection/i,
      /Inspect pages and data/i,
      /Page ID/i,
      /Page Type/i,
      /Source Table/i,
      /Table ID/i,
      /Purchase Invoices/i,
      /Einkaufsrechnungen/i,
      /Purchase Header/i,
    ],
    maxLines: 100,
    maxLineLength: 180,
  });
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(after) && after !== before;

  attempts.push({
    method: 'keyboard-control-alt-f1',
    opened,
    closedExternalPages,
  });

  return {
    opened,
    attempts,
    focusedText: asciiSafe(focusedText),
    focusedLines: compactLines(focusedText || after),
  };
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-068.json',
      nextStep:
        status === 'observed'
          ? 'Review FIXEDASSETS-068 Page Inspection evidence. Next safe step is explicit approval for the draft-capable FIXEDASSETS-066 guarded probe or another read-only context probe.'
          : 'Resolve FIXEDASSETS-068 Page Inspection blocker before any draft-capable fixed-assets probe.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'read-only-page-inspection',
      branch: 'codex/token-efficient-autopilot-state',
      bcRun: true,
      posted: false,
      companySwitched: false,
      summary,
      nextStep:
        status === 'observed'
          ? 'Review technical page/table context; do not run draft-capable probe without explicit approval.'
          : 'Fix the Page Inspection blocker or choose another read-only diagnostic route.',
    },
    activeCase: {
      status,
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-068/FIXEDASSETS-068-result.json',
        summary,
      },
      nextSafeAction:
        status === 'observed'
          ? 'Use Page Inspection context for safer Purchase Invoice field-mapping decisions. Do not click New/Neu without explicit approval.'
          : 'No draft-capable run until Page Inspection blocker is understood.',
    },
  };
}

function baseResult() {
  return {
    schemaVersion: 1,
    purpose: 'fixedassets-readonly-pageinspection-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-page-inspection',
    runPlanId: `${CASE_ID}-PLAN`,
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/last_run_summary.json',
      '.agent/state/coverage_state.json',
      '.agent/state/cases/fixedassets-068.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-068-purchase-invoices-pageinspection-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-068/FIXEDASSETS-068-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-068/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-068/FIXEDASSETS-068-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-068/README.md',
    ],
    flags: {
      noWrite: true,
      noPost: true,
      noPreview: true,
      noDraft: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noBookChange: true,
      noApiShortcut: true,
      noActionClick: true,
      noRecordOpen: true,
      noScreenshot: true,
    },
  };
}

test('FIXEDASSETS-068 opens Purchase Invoices Page Inspection read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  let finalUrl = '';
  let title = '';

  try {
    await page.goto(purchaseInvoicesUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await waitForPageText(page, /Purchase Invoices|Einkaufsrechnungen|Vendor|Kreditor/i, { timeout: 90_000 });

    finalUrl = page.url();
    title = await page.title();
    const decodedUrl = decodeURIComponent(finalUrl);
    const detectedInstance = decodedUrl.includes(EXPECTED_INSTANCE) ? EXPECTED_INSTANCE : null;
    const detectedCompany = new URL(finalUrl).searchParams.get('company');

    if (detectedInstance !== EXPECTED_INSTANCE) {
      throw new Error(`Detected instance mismatch: ${detectedInstance ?? 'not detected'}.`);
    }
    if (detectedCompany !== EXPECTED_COMPANY) {
      throw new Error(`Detected company mismatch: ${detectedCompany ?? 'not detected'}.`);
    }

    const inspection = await tryOpenPageInspection(page);
    if (!inspection.opened) {
      throw new Error('Page Inspection did not open through Control+Alt+F1 in this read-only run.');
    }

    const pageInspectionContext = inspection.focusedLines.join('; ');
    const summary =
      `FIXEDASSETS-068 opened Purchase Invoices read-only in ${EXPECTED_INSTANCE} / ${EXPECTED_COMPANY} ` +
      `and opened Page Inspection with Control+Alt+F1 without clicking New/Neu, records or posting actions. Technical context: ${pageInspectionContext}.`;
    const result = {
      ...baseResult(),
      resultStatus: 'observed',
      environment: {
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: EXPECTED_COMPANY,
        detectedInstance,
        detectedCompany,
        url: finalUrl,
        title,
      },
      proved: [
        `Business Central URL stayed in ${EXPECTED_INSTANCE}.`,
        `Company URL parameter stayed ${EXPECTED_COMPANY}.`,
        'Purchase Invoices page context was visible.',
        'Page Inspection opened from the Purchase Invoices page via Control+Alt+F1.',
        'No New/Neu action was clicked.',
        'No Purchase Invoice record was opened.',
        'No Delete/Edit/Post/Preview action was clicked.',
        'No draft was created.',
      ],
      notProved: [
        'No Type = Fixed Asset line proof.',
        'No K30000 header context.',
        'No FA-CNC-01 line context.',
        'No posting, acquisition, depreciation or German final proof.',
        'Page Inspection is technical context, not a final book screenshot or execution approval.',
      ],
      warnings: [],
      blockedBy: [],
      requiresReview: false,
      safeToFinalizeState: true,
      statePatch: statePatch('observed', summary),
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
        pageInspectionOpened: inspection.opened,
        attempts: inspection.attempts,
        focusedLines: inspection.focusedLines,
      },
    };

    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-068-result.json'), result);
    await writeTextEvidence(
      fixedAssetsEvidencePath('README.md'),
      [
        '# FIXEDASSETS-068 Evidence Index',
        '',
        '| Datei | Typ | Beweist | Beweist nicht | Status |',
        '|---|---|---|---|---|',
        '| `FIXEDASSETS-068-result.json` | JSON | Purchase-Invoices-Seite wurde read-only geoeffnet; Page Inspection wurde per `Ctrl+Alt+F1` geoeffnet | keinen Datensatz, keinen Zeilentyp, keinen Draft, keine Buchung | `observed`, `read-only`, `technical-context` |',
        '',
        'Aktuelle Wahrheit: Page Inspection ist technischer Page-/Table-Kontext. Sie ersetzt keinen Anwender-Screenshot und gibt keine Freigabe fuer `New/Neu`, Preview oder Posting.',
        '',
      ].join('\n'),
    );

    expect(result.resultStatus).toBe('observed');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const summary = `FIXEDASSETS-068 blocked: ${reason}`;
    const result = {
      ...baseResult(),
      resultStatus: 'blocked',
      environment: {
        expectedInstance: EXPECTED_INSTANCE,
        expectedCompany: EXPECTED_COMPANY,
        url: finalUrl || page.url(),
        title,
      },
      proved: [],
      notProved: [
        'Purchase Invoices Page Inspection read-only context did not complete.',
        'No technical page/table proof is claimed.',
      ],
      warnings: [],
      blockedBy: [reason],
      requiresReview: true,
      safeToFinalizeState: false,
      statePatch: statePatch('blocked', summary),
      observed: {
        startedAt,
        finishedAt: new Date().toISOString(),
      },
    };

    await writeJsonEvidence(fixedAssetsEvidencePath('FIXEDASSETS-068-result.json'), result);
    throw error;
  }
});
