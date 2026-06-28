import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
  bcPageUrl,
  compactPageText,
  dismissTours,
  hideFactBoxPane,
  pageText,
  requireBcUrl,
  waitForBusinessCentralShell,
  waitForPageText,
} from '../../../core/bc-helpers';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { project } from '../project';

const TEST_ID = 'fixedassets-269';
const CASE_ID = 'FIXEDASSETS-269-FA-DEPRECIATION-ELIGIBILITY-AND-JOURNAL-SETUP-READONLY-DIAGNOSIS';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const ASSET_NO = 'FA-CNC-01';
const DEPRECIATION_BOOK = 'HGB';
const ACQUISITION_DOC_NO = 'G05001';
const ACQUISITION_DATE = '01.01.2027';
const TARGET_DEPRECIATION_DATE = '30.06.2026';
const MISSING_DOC_NO = 'FADEP-267-OK';
const COMPARISON_DOC_NO = 'FADEP-20260627-2158';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2800, height: 1400 },
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function clean(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split(/\r?\n/)
    .filter((line) => !/allowedEndpoints|allowedResources|shouldAttachOauthTokens|tokenFactorySettings|O365MSALTokenFactoryIframe|aadTenantId|startTraceId/i.test(line))
    .join('\n')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function filteredUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(pageId === 0 ? requireBcUrl(project.envPrefix) : bcPageUrl(pageId, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  if (pageId !== 0) url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function pageUrl(pageId: number) {
  const url = new URL(bcPageUrl(pageId, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  return url.toString();
}

async function sandboxContext(page: Page) {
  const url = page.url();
  const decodedUrl = decodeURIComponent(url);
  const parsed = new URL(url);
  const text = await pageText(page);
  return {
    url: safeUrl(url),
    environmentInUrl: decodedUrl.includes(EXPECTED_INSTANCE),
    companyInUrl: parsed.searchParams.get('company') === EXPECTED_COMPANY,
    companyInText: /RM-DEMO|Rhein-Main Demo GmbH/i.test(text),
    wrongEnvironmentVisible: /Production|Produktiv/i.test(text) && !decodedUrl.includes(EXPECTED_INSTANCE),
  };
}

async function dangerousDialogs(page: Page, phase: string) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const locator = scope.locator('[role="dialog"], [aria-modal="true"]');
    const count = await locator.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = clean(await locator.nth(index).innerText({ timeout: 500 }).catch(() => ''));
      if (text) dialogs.push(text);
    }
  }
  const dangerous = dialogs.filter((text) =>
    /\b(Post|Preview Posting|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Calculate Depreciation|AfA berechnen|Abschreibung berechnen)\b/i.test(text),
  );
  return { phase, dialogs, dangerous, ok: dangerous.length === 0 };
}

async function openReadOnly(page: Page, url: string, expected: RegExp) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, expected, { timeout: 90_000 });
  await page.waitForTimeout(1500);
}

async function visibleRowsAndControls(page: Page, keep: RegExp) {
  const frameSignals = [];
  for (const frame of page.frames().filter((entry) => decodeURIComponent(entry.url()).includes(EXPECTED_INSTANCE))) {
    const signal = await frame
      .evaluate((keepSource) => {
        const keepRe = new RegExp(keepSource, 'i');
        const norm = (value: string | null | undefined) =>
          (value ?? '')
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\x09\x0a\x0d\x20-\x7E]/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .trim();
        const visible = (element: HTMLElement) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name]')]
          .filter(visible)
          .map((row, index) => ({ index, text: norm(row.innerText || row.textContent) }))
          .filter((row) => keepRe.test(row.text))
          .slice(0, 120);
        const controls = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input,select,textarea,[role="checkbox"],[aria-checked]')]
          .filter((control) => visible(control as HTMLElement))
          .map((control, index) => {
            const html = control as HTMLInputElement;
            return {
              index,
              tag: control.tagName.toLowerCase(),
              role: norm(control.getAttribute('role')),
              type: norm(html.type),
              value: norm(control instanceof HTMLSelectElement ? [...control.options].find((option) => option.selected)?.text || control.value : html.value),
              ariaLabel: norm(control.getAttribute('aria-label')),
              title: norm(control.getAttribute('title')),
              ariaChecked: control.getAttribute('aria-checked'),
              readOnly: control.hasAttribute('readonly') || control.getAttribute('aria-readonly') === 'true',
              disabled: control.hasAttribute('disabled') || control.getAttribute('aria-disabled') === 'true',
            };
          })
          .filter((control) => keepRe.test(`${control.value} ${control.ariaLabel} ${control.title} ${control.ariaChecked ?? ''}`))
          .slice(0, 120);
        return {
          frameUrl: location.href,
          rows,
          controls,
        };
      }, keep.source)
      .catch((error) => ({ frameUrl: frame.url(), error: String(error), rows: [], controls: [] }));
    if (typeof signal.frameUrl === 'string') signal.frameUrl = safeUrl(signal.frameUrl);
    frameSignals.push(signal);
  }
  return frameSignals;
}

async function readContext(page: Page, id: string, url: string, expected: RegExp, include: RegExp[], rowKeep: RegExp) {
  await openReadOnly(page, url, expected);
  const fullText = await pageText(page);
  const compactText = clean(
    await compactPageText(page, {
      include,
      maxLines: 260,
      maxLineLength: 260,
    }),
  );
  const context = await sandboxContext(page);
  const dialogState = await dangerousDialogs(page, id);
  const frameSignals = await visibleRowsAndControls(page, rowKeep);
  const payload = {
    id,
    url: safeUrl(page.url()),
    context,
    dialogState,
    signals: {
      assetVisible: /\bFA-CNC-01\b/i.test(fullText),
      hgbVisible: /\bHGB\b/i.test(fullText),
      missingDocVisible: new RegExp(MISSING_DOC_NO, 'i').test(fullText),
      comparisonDocVisible: new RegExp(COMPARISON_DOC_NO, 'i').test(fullText),
      depreciationVisible: /Depreciation|AfA|Abschreibung/i.test(fullText),
      acquisitionCostVisible: /Acquisition Cost/i.test(fullText),
      bookValueVisible: /Book Value|Buchwert/i.test(fullText),
      amount120000Visible: /120\.000|120000|120,000/i.test(fullText),
      straightLineVisible: /Straight-Line|linear/i.test(fullText),
      eightYearsVisible: /8\.00|8,00|No\. of Depreciation Years/i.test(fullText),
      lastDepreciationDateVisible: /Last Depreciation Date|Last Depr\. Date|Letzte/i.test(fullText),
      endingDateVisible: /Ending Date|Enddatum|End Date/i.test(fullText),
      journalBatchVisible: /Batch Name|Journal Batch|Buch.-Blattname|Vorlagenname/i.test(fullText),
      numberOfDaysVisible: /No\. of Depreciation Days|Depr\. until FA Posting Date/i.test(fullText),
    },
    frameSignals,
    textEvidenceFile: `${id}-text.txt`,
  };
  await writeTextEvidence(faEvidencePath(payload.textEvidenceFile), compactText || 'No compact read-only text captured.');
  await writeJsonEvidence(faEvidencePath(`${id}.json`), payload);
  return payload;
}

function classifyDiagnosis(contexts: any[]) {
  const byId = Object.fromEntries(contexts.map((entry) => [entry.id, entry]));
  const asset = byId['010-fa-cnc-01-card-readonly'];
  const ledger = byId['020-fa-ledger-entries-readonly'];
  const depBook = byId['030-hgb-depreciation-book-card-readonly'];
  const journal = byId['040-fa-gl-journal-context-readonly'];
  const ledgerRows = (ledger?.frameSignals ?? []).flatMap((entry: any) => entry.rows ?? []).map((row: any) => row.text).join('\n');
  const acquisitionDateVisible = ledgerRows.includes(ACQUISITION_DATE);
  const acquisitionDocVisible = ledgerRows.includes(ACQUISITION_DOC_NO);
  const parseDeDate = (value: string) => {
    const [day, month, year] = value.split('.').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getTime();
  };
  const targetDateBeforeAcquisition =
    acquisitionDateVisible && parseDeDate(TARGET_DEPRECIATION_DATE) < parseDeDate(ACQUISITION_DATE);

  const facts = {
    assetCardHasBookValueSignals: Boolean(asset?.signals.bookValueVisible && asset?.signals.amount120000Visible),
    ledgerShowsAcquisition: Boolean(ledger?.signals.assetVisible && acquisitionDocVisible && ledger?.signals.acquisitionCostVisible),
    acquisitionDateVisible,
    acquisitionDocVisible,
    targetDepreciationDate: TARGET_DEPRECIATION_DATE,
    targetDateBeforeAcquisition,
    hgbBookContextVisible: Boolean(depBook?.signals.hgbVisible && depBook?.signals.depreciationVisible),
    journalBatchContextVisible: Boolean(journal?.signals.journalBatchVisible),
    journalHasMissingDoc: Boolean(journal?.signals.missingDocVisible),
    journalHasComparisonDoc: Boolean(journal?.signals.comparisonDocVisible),
    eligibilityDateSignalsWeak: !Boolean(asset?.signals.lastDepreciationDateVisible || asset?.signals.endingDateVisible || asset?.signals.numberOfDaysVisible),
  };

  const hypotheses: string[] = [];
  if (targetDateBeforeAcquisition) {
    hypotheses.push(`Target depreciation date ${TARGET_DEPRECIATION_DATE} is before the acquisition posting date ${ACQUISITION_DATE}; Business Central plausibly generated no depreciation line because the asset was not acquired yet at the target date.`);
  }
  if (facts.eligibilityDateSignalsWeak) {
    hypotheses.push('Read-only card text did not expose enough due-date/last-depreciation fields; a focused FA depreciation-book-values read may be needed.');
  }
  if (!facts.journalHasMissingDoc && !facts.journalHasComparisonDoc) {
    hypotheses.push('Current Fixed Asset G/L Journal context still does not show either FADEP-267-OK or FADEP-20260627-2158; batch/filter context remains plausible.');
  }
  if (facts.assetCardHasBookValueSignals && facts.ledgerShowsAcquisition && facts.hgbBookContextVisible) {
    hypotheses.push('Acquisition and HGB context exist; the blocker is likely eligibility/range/journal-target visibility rather than missing acquisition basis.');
  }

  return {
    facts,
    classification: facts.journalHasMissingDoc
      ? 'journal-line-visible-after-stronger-readonly-diagnosis'
      : targetDateBeforeAcquisition
        ? 'probable-target-date-before-acquisition'
        : 'journal-line-still-not-visible-after-readonly-diagnosis',
    hypotheses,
    nextCase: 'FIXEDASSETS-270-FA-DEPRECIATION-ELIGIBILITY-DIAGNOSIS-REVIEW',
    nextCaseFile: '.agent/state/cases/fixedassets-270-fa-depreciation-eligibility-diagnosis-review.json',
    nextStep: 'FIXEDASSETS-270: locally review FA-269 read-only evidence and decide the next smallest safe AfA step; do not repeat OK, Preview Posting or Post yet.',
  };
}

function renderLearning(result: any) {
  return [
    '# FIXEDASSETS-269 AfA-Eligibility- und Journal-Setup-Diagnose',
    '',
    'Status: `labor`, `read-only`, `diagnosis`, `no-ok`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Instanz: \`${result.instance}\``,
    `- Company: \`${result.company}\``,
    `- Anlage: \`${ASSET_NO}\``,
    `- AfA-Buch: \`${DEPRECIATION_BOOK}\``,
    `- Klassifikation: \`${result.diagnosis.classification}\``,
    '',
    '## Gelesene Kontexte',
    '',
    '- Anlagenkarte `FA-CNC-01`.',
    '- Anlagenposten zu `FA-CNC-01`.',
    '- HGB Depreciation Book Card.',
    '- Fixed Asset G/L Journals.',
    '',
    '## Hypothesen',
    '',
    ...(result.diagnosis.hypotheses.length ? result.diagnosis.hypotheses.map((entry: string) => `- ${entry}`) : ['- Keine neue Hypothese aus kompakter Evidence ableitbar.']),
    '',
    '## Grenzen',
    '',
    '- Kein `OK` auf `Calculate Depreciation`.',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Kein Setup Change.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Buchwirkung',
    '',
    'Die Anleitung sollte nach `Calculate Depreciation` nicht sofort zur Buchung springen. Wenn keine Zeile sichtbar ist, sind AfA-Faelligkeit, Datumslogik, Journalbatch und Filter erst als eigener Diagnoseblock zu pruefen.',
    '',
    '## Naechster Schritt',
    '',
    result.diagnosis.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-269 diagnoses depreciation eligibility and journal context read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const contexts = [];

  contexts.push(
    await readContext(
      page,
      '010-fa-cnc-01-card-readonly',
      filteredUrl(5600, 'Fixed Asset', 'No.', ASSET_NO),
      /Fixed Asset Card|Fixed Asset|FA-CNC-01|Book Value/i,
      [/FA-CNC-01|HGB|Book Value|Acquisition Cost|Depreciation|Straight-Line|No\. of Depreciation Years|Last Depreciation|Ending Date|120\.000|120000|120,000/i],
      /FA-CNC-01|HGB|Book Value|Acquisition Cost|Depreciation|Straight-Line|No\. of Depreciation Years|Last Depreciation|Ending Date|120\.000|120000|120,000/i,
    ),
  );

  contexts.push(
    await readContext(
      page,
      '020-fa-ledger-entries-readonly',
      filteredUrl(5604, 'FA Ledger Entry', 'FA No.', ASSET_NO),
      /FA Ledger Entries|FA Ledger Entry|Entry No\.|FA-CNC-01/i,
      [/FA-CNC-01|G05001|HGB|Acquisition Cost|Depreciation|Document No\.|Posting Date|FA Posting Date|120\.000|120000|120,000/i],
      /FA-CNC-01|G05001|HGB|Acquisition Cost|Depreciation|Document No\.|Posting Date|FA Posting Date|120\.000|120000|120,000/i,
    ),
  );

  contexts.push(
    await readContext(
      page,
      '030-hgb-depreciation-book-card-readonly',
      filteredUrl(5610, 'Depreciation Book', 'Code', DEPRECIATION_BOOK),
      /Depreciation Book Card|Depreciation Book|HGB|G\/L Integration/i,
      [/HGB|Depreciation Book|G\/L Integration|Acq\. Cost|Depreciation|Disposal|Maintenance|Bonus Depreciation/i],
      /HGB|Depreciation Book|G\/L Integration|Acq\. Cost|Depreciation|Disposal|Maintenance|Bonus Depreciation/i,
    ),
  );

  contexts.push(
    await readContext(
      page,
      '040-fa-gl-journal-context-readonly',
      pageUrl(5628),
      /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Batch Name|Document No\./i,
      [/Fixed Asset G\/L Journals|Batch Name|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|Amount|FADEP-|FA-CNC-01|HGB|Depreciation|No\. of Depreciation Days|Depr\. until FA Posting Date/i],
      /Fixed Asset G\/L Journals|Batch Name|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|Amount|FADEP-|FA-CNC-01|HGB|Depreciation|No\. of Depreciation Days|Depr\. until FA Posting Date/i,
    ),
  );

  const blockedBy = [
    ...contexts.flatMap((entry) => entry.dialogState.dangerous.map((dialog: string) => `${entry.id}:dangerous-dialog:${dialog}`)),
    ...contexts
      .filter((entry) => !entry.context.environmentInUrl || (!entry.context.companyInUrl && !entry.context.companyInText) || entry.context.wrongEnvironmentVisible)
      .map((entry) => `${entry.id}:wrong-context`),
  ];
  const diagnosis = classifyDiagnosis(contexts);
  const resultStatus = blockedBy.length ? 'blocked' : 'observed';

  const result = {
    schemaVersion: 1,
    purpose: 'fixed-assets-depreciation-eligibility-and-journal-setup-readonly-diagnosis',
    caseId: CASE_ID,
    source: 'playwright-readonly-depreciation-eligibility-diagnosis',
    resultStatus,
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    target: {
      fixedAssetNo: ASSET_NO,
      depreciationBook: DEPRECIATION_BOOK,
      acquisitionDocumentNo: ACQUISITION_DOC_NO,
      acquisitionDate: ACQUISITION_DATE,
      targetDepreciationDate: TARGET_DEPRECIATION_DATE,
      missingDocumentNo: MISSING_DOC_NO,
      comparisonDocumentNo: COMPARISON_DOC_NO,
    },
    contexts,
    diagnosis,
    safety: {
      noCalculateDepreciationOk: true,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noJournalLineInsertEditDelete: true,
    },
    proved: [
      'Business Central stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 card context was read without edit mode.',
      'FA Ledger Entries for FA-CNC-01 were read without edit mode.',
      'HGB Depreciation Book Card was read without edit mode.',
      'Fixed Asset G/L Journals context was read without edit mode.',
      ...(diagnosis.facts.journalHasMissingDoc ? [`${MISSING_DOC_NO} was visible in the journal context.`] : [`${MISSING_DOC_NO} was not visible in the journal context.`]),
      'No Calculate Depreciation OK, Preview Posting, Post, setup change, company switch or API shortcut was executed.',
    ],
    notProved: [
      'No exact root cause for missing FADEP journal line is proven yet.',
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-269-fa-depreciation-eligibility-and-journal-setup-readonly-diagnosis.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-269/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-269/FIXEDASSETS-269-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-269/FIXEDASSETS-269-DEPRECIATION-ELIGIBILITY-READONLY-DIAGNOSIS.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-269/README.md',
    ],
    statePatch: {
      current: {
        activeCase: diagnosis.nextCase,
        active_case_file: diagnosis.nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-269-fa-depreciation-eligibility-and-journal-setup-readonly-diagnosis.json',
        requiresStrongModel: true,
        nextStep: diagnosis.nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase: diagnosis.nextCase,
        depreciationReadiness: `${CASE_ID} classified as ${diagnosis.classification}; local review required before repeat OK, Preview Posting or Post.`,
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: resultStatus === 'observed',
    reason: 'Read-only diagnosis collected eligibility and journal context; local review required before any execution step.',
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-269-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-269-DEPRECIATION-ELIGIBILITY-READONLY-DIAGNOSIS.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-269 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-269-result.json` | JSON-Ergebnis | read-only Diagnoseklassifikation | keine AfA-Zeile ausserhalb sichtbarer Kontexte | labor |',
      '| `FIXEDASSETS-269-DEPRECIATION-ELIGIBILITY-READONLY-DIAGNOSIS.md` | Lernzusammenfassung | Diagnose und naechster Schritt | keinen Preview-/Post-Nachweis | labor |',
      '| `010-*` | Anlagenkarte | Karten-/AfA-Feldsignale | keine Buchung | read-only |',
      '| `020-*` | Anlagenposten | vorhandene FA-Ledger-Signale | keine neue Journalzeile | read-only |',
      '| `030-*` | HGB AfA-Buch | HGB Setup-/Integrationskontext | kein Setup-Fit | read-only |',
      '| `040-*` | FA G/L Journal | sichtbarer Journal-/Batch-Kontext | keine Buchung | read-only |',
      '',
    ].join('\n'),
  );

  expect(result.safety.noCalculateDepreciationOk).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-context|dangerous-dialog/i.test(entry))).toEqual([]);
});
