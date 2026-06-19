import { expect, test, type Frame, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const CASE_ID = 'FIXEDASSETS-104-FA-GL-JOURNAL-BAL-ACCOUNT-DIAGNOSIS';
const NEXT_CASE_ID = 'FIXEDASSETS-105-FA-GL-JOURNAL-BAL-ACCOUNT-DECISION';
const TEST_ID = 'fixedassets-104';
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

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
    url,
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

async function diagnoseJournalFrame(frame: Frame) {
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
    const selectOptionSets = [...document.querySelectorAll<HTMLSelectElement>('select')]
      .filter(visible)
      .map((select, index) => {
        const rect = select.getBoundingClientRect();
        const options = [...select.options].map((option) => ({
          text: norm(option.text),
          value: option.value,
          selected: option.selected,
        }));
        return {
          index,
          value: select.value,
          selectedText: options.find((option) => option.selected)?.text ?? '',
          optionTexts: options.map((option) => option.text).filter(Boolean),
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      })
      .filter((entry) => /G\/L Account|Customer|Vendor|Bank Account|Fixed Asset|Acquisition Cost|Purchase|Sale|Settlement/i.test(entry.optionTexts.join(' ')));

    const rowTexts = [...document.querySelectorAll<HTMLElement>('[role="row"],tr')]
      .filter(visible)
      .map((row) => norm(row.innerText || row.textContent))
      .filter((row) => /Posting Date|Document No\.|Account Type|Bal\. Account|Amount|FA-CNC-01|K30000|HGB|G05001|Number of Lines|Balance/i.test(row))
      .slice(0, 8);

    const errors = [
      ...bodyText.matchAll(/Account Type or Bal\. Account Type must be a G\/L Account or Bank Account\.?/gi),
      ...bodyText.matchAll(/No suggestions are available for K30000\.?/gi),
      ...bodyText.matchAll(/Fur K30000 sind keine Vorschlage verfugbar\.?/gi),
    ].map((match) => match[0]);

    return {
      pageTitleVisible: /Fixed Asset G\/L Journals/i.test(bodyText),
      postVisible: /\bPost\b/i.test(bodyText),
      previewVisible: /Preview Posting|Posting Preview|Vorschau/i.test(bodyText),
      targetSignals: {
        faCnc01Visible: /FA-CNC-01/i.test(bodyText),
        k30000Visible: /K30000/i.test(bodyText),
        hgbVisible: /\bHGB\b/i.test(bodyText),
        amount68000Visible: /68[.,]?000|68000/i.test(bodyText),
        documentNoVisible: /G05001/i.test(bodyText),
        fixedAssetVisible: /Fixed Asset/i.test(bodyText),
        acquisitionCostVisible: /Acquisition Cost/i.test(bodyText),
      },
      errors: [...new Set(errors)],
      balAccountTypeOptionSets: selectOptionSets.filter((entry) => /G\/L Account|Customer|Vendor|Bank Account|Fixed Asset/i.test(entry.optionTexts.join(' '))),
      postingTypeOptionSets: selectOptionSets.filter((entry) => /Purchase|Sale|Settlement/i.test(entry.optionTexts.join(' '))),
      relevantRows: rowTexts,
      focusedText: bodyText
        .split(/(?=Fixed Asset G\/L Journals|Post|Posting Date|Account Type|Bal\. Account|Number of Lines|Account Type or Bal\. Account Type|No suggestions|Fur K30000)/i)
        .map((part) => part.trim())
        .filter((part) => /Fixed Asset|Post|Posting Date|Account Type|Bal\. Account|Number of Lines|K30000|FA-CNC-01|HGB|G05001|68000|G\/L Account|Bank Account|Vendor/i.test(part))
        .slice(0, 20),
    };
  });
}

function statePatch(status: 'observed' | 'blocked', summary: string) {
  return {
    current: {
      activeCase: NEXT_CASE_ID,
      active_case_file: '.agent/state/cases/fixedassets-105-fa-gl-journal-bal-account-decision.json',
      lastReferenceCase: CASE_ID,
      lastReferenceCaseFile: '.agent/state/cases/fixedassets-104-fa-gl-journal-bal-account-diagnosis.json',
      nextStep: 'FIXEDASSETS-105: decide whether a later guarded journal probe may replace Vendor balancing with G/L Account or Bank Account. No Preview Posting or posting yet.',
    },
    lastRunSummary: {
      schemaVersion: 1,
      runId: CASE_ID,
      date: '2026-06-19',
      workType: 'fixed-asset-gl-journal-bal-account-diagnosis',
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
      nextStep: 'Run FIXEDASSETS-105 local decision before any value correction, Preview Posting or posting.',
    },
    activeCase: {
      status: status === 'observed' ? 'observed-diagnosis-complete' : 'blocked',
      lastResult: {
        status,
        resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-104/FIXEDASSETS-104-result.json',
        summary,
      },
      nextSafeAction: 'Run FIXEDASSETS-105 local decision; do not preview or post.',
    },
  };
}

test('FIXEDASSETS-104 diagnoses FA G/L Journal balancing options without changing values', async ({ page }) => {
  const blockedBy: string[] = [];
  let context: Awaited<ReturnType<typeof sandboxContext>> | undefined;
  let frameUrl = '';
  let diagnosis: Awaited<ReturnType<typeof diagnoseJournalFrame>> | undefined;

  try {
    await page.goto(faJournalPageUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await waitForBusinessCentralShell(page);
    await dismissTours(page).catch(() => undefined);
    await hideFactBoxPane(page).catch(() => undefined);

    context = await sandboxContext(page);
    if (!context.environmentInUrl || (!context.companyInUrl && !context.companyInText) || context.wrongEnvironmentVisible) {
      blockedBy.push(`Wrong BC context: ${JSON.stringify(context)}`);
    } else {
      const frame = await targetFrame(page);
      frameUrl = safeUrl(frame.url());
      diagnosis = await diagnoseJournalFrame(frame);
    }
  } catch (error) {
    blockedBy.push(error instanceof Error ? error.message : String(error));
  }

  if (!diagnosis?.pageTitleVisible) {
    blockedBy.push('Fixed Asset G/L Journals page title was not visible.');
  }
  if (!diagnosis?.errors.length) {
    blockedBy.push('Expected balancing/account error was not visible.');
  }
  if (!diagnosis?.balAccountTypeOptionSets.length) {
    blockedBy.push('Bal. Account Type / Account Type option set was not captured.');
  }

  const hasGlOrBankOption = Boolean(
    diagnosis?.balAccountTypeOptionSets.some((set) => /G\/L Account|Bank Account/i.test(set.optionTexts.join(' '))),
  );
  const vendorOptionPresent = Boolean(
    diagnosis?.balAccountTypeOptionSets.some((set) => /Vendor/i.test(set.optionTexts.join(' '))),
  );
  const vendorSelected = Boolean(
    diagnosis?.balAccountTypeOptionSets.some((set) => /Vendor/i.test(set.selectedText)),
  );
  const status: 'observed' | 'blocked' = blockedBy.length === 0 ? 'observed' : 'blocked';
  const summary =
    status === 'observed'
      ? `FA-104 captured the current FA G/L Journal balancing error and account-type options. G/L/Bank option visible: ${hasGlOrBankOption}; Vendor option present: ${vendorOptionPresent}; Vendor selected: ${vendorSelected}. No values were changed.`
      : `FA-104 blocked before complete diagnosis: ${blockedBy.join(' | ')}`;
  const patch = statePatch(status, summary);

  await writeJsonEvidence(faEvidencePath('010-bal-account-diagnosis.json'), {
    schemaVersion: 1,
    purpose: 'fixedassets-104-bal-account-type-diagnosis',
    caseId: CASE_ID,
    context,
    frameUrl,
    diagnosis,
    interpretedSignals: {
      hasGlOrBankOption,
      vendorOptionPresent,
      vendorSelected,
      errorRequiresGlOrBankAccount: Boolean(
        diagnosis?.errors.some((error) => /G\/L Account or Bank Account/i.test(error)),
      ),
    },
    blockedBy,
    omitted: 'No full page text, screenshots, traces or binaries are stored.',
  });
  await writeTextEvidence(
    faEvidencePath('020-focused-text.txt'),
    [
      'FIXEDASSETS-104 focused text',
      '',
      ...(diagnosis?.focusedText ?? ['No focused text captured.']),
    ].join('\n'),
  );

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-fa-gl-journal-bal-account-diagnosis-result',
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
      urlAfterDiagnosis: page.url(),
    },
    proved: [
      ...(context?.environmentInUrl ? ['The run stayed in MCP_1_20260210.'] : []),
      ...(context?.companyInUrl || context?.companyInText ? ['The run stayed in RM-DEMO.'] : []),
      ...(diagnosis?.errors.length ? ['The current FA G/L Journal balancing error is visible.'] : []),
      ...(hasGlOrBankOption ? ['G/L Account or Bank Account appears in visible account-type options.'] : []),
      'No value correction was made.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No setup change was executed.',
    ],
    notProved: [
      'No corrected balancing account was entered.',
      'No amount proof.',
      'No Preview Posting result.',
      'No posting result.',
      'No FA Ledger Entry or G/L Entry trace.',
      'No German final proof.',
    ],
    diagnosisSummary: {
      errors: diagnosis?.errors ?? [],
      hasGlOrBankOption,
      vendorOptionPresent,
      vendorSelected,
      targetSignals: diagnosis?.targetSignals,
    },
    changedFiles: [
      '.agent/state/current.json',
      '.agent/state/cases/fixedassets-104-fa-gl-journal-bal-account-diagnosis.json',
      '.agent/state/cases/fixedassets-105-fa-gl-journal-bal-account-decision.json',
      '.agent/state/last_run_summary.json',
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-104-fa-gl-journal-bal-account-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-104/FIXEDASSETS-104-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-104/010-bal-account-diagnosis.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-104/020-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-104/README.md',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-104/FIXEDASSETS-104-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-104/010-bal-account-diagnosis.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-104/020-focused-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-104/README.md',
    ],
    warnings: [
      'Read-only diagnostic run.',
      'The partial FA-102 draft may remain in RM-DEMO.',
      'Do not unlock Preview Posting or posting from FA-104 alone.',
    ],
    blockedBy,
    requiresReview: status === 'blocked',
    safeToFinalizeState: status === 'observed',
    statePatch: patch,
    flags: {
      noValueCorrection: true,
      noPost: true,
      noPreview: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
    },
    nextStep: patch.current.nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-104-result.json'), result);
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-104 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-bal-account-diagnosis.json` | JSON | aktuelles Fehlerbild und Account-Type-Optionen | keine Wertkorrektur | `labor`, `diagnosis` |',
      '| `020-focused-text.txt` | Text | kompakte UI-Signale | kein Screenshot, kein Rohdump | `compact` |',
      '| `FIXEDASSETS-104-result.json` | JSON | Diagnoseergebnis und naechster Decision-Case | keine Buchungswirkung | `labor` |',
      '',
      `Aktuelle Wahrheit: ${summary}`,
      '',
    ].join('\n'),
  );

  expect(result.flags.noValueCorrection).toBe(true);
  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreview).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.environment.context?.environmentInUrl).toBe(true);
  expect(result.environment.context?.companyInUrl || result.environment.context?.companyInText).toBe(true);
});
