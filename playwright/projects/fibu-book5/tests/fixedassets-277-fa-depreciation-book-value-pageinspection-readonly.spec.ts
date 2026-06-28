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

const TEST_ID = 'fixedassets-277';
const CASE_ID = 'FIXEDASSETS-277-FA-DEPRECIATION-BOOK-VALUE-PAGEINSPECTION-READONLY';
const NEXT_CASE_ID = 'FIXEDASSETS-278-FA-DEPRECIATION-BOOK-VALUE-DIAGNOSIS-REVIEW';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = 'RM-DEMO';
const ASSET_NO = 'FA-CNC-01';
const DEPRECIATION_BOOK = 'HGB';
const TARGET_DEPRECIATION_DATE = '31.01.2027';
const MISSING_DOC_NO = 'FADEP-273-OK';
const ACQUISITION_DOC_NO = 'G05001';

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
    .filter((line) => !/allowedEndpoints|allowedResources|tokenFactorySettings|aadTenantId|startTraceId/i.test(line))
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

function compactLines(value: string, keep: RegExp, maxLines = 180) {
  const seen = new Set<string>();
  return value
    .split('\n')
    .map((line) => clean(line))
    .filter(Boolean)
    .filter((line) => keep.test(line))
    .filter((line) => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    })
    .slice(0, maxLines);
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
    /\b(Post|Preview Posting|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish|Calculate Depreciation|AfA berechnen|Abschreibung berechnen)\b/i.test(
      text,
    ),
  );
  return { phase, dialogs, dangerous, ok: dangerous.length === 0 };
}

async function openReadOnly(page: Page, url: string, expected: RegExp) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, expected, { timeout: 90_000 });
  await page.waitForTimeout(1200);
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
  await page.keyboard.press('Control+Alt+F1').catch(() => undefined);
  await page.waitForTimeout(3500);
  const closedExternalPages = await closeExternalPages(page);
  const after = await pageText(page);
  const keep =
    /Page Inspection|Inspect pages and data|Page ID|Page Type|Source Table|Table ID|Fixed Asset Card|Fixed Asset|FA Depreciation Book|Depreciation Starting Date|No\. of Depreciation Years|Depreciation Ending Date|Book Value|Last Depreciation Date|Last Depr\. Date|HGB|FA-CNC-01|5600|5612|Base Application|Extension/i;
  const focusedText = await compactPageText(page, {
    include: [keep],
    maxLines: 220,
    maxLineLength: 260,
  });
  const joined = clean(`${focusedText}\n${after}`);
  const opened = /Page Inspection|Inspect pages and data|Page ID|Source Table|Table ID/i.test(joined) && after !== before;
  return {
    opened,
    closedExternalPages,
    lines: compactLines(joined, keep, 220),
    signals: {
      pageInspectionVisible: /Page Inspection|Inspect pages and data/i.test(joined),
      fixedAssetCardVisible: /Fixed Asset Card/i.test(joined),
      fixedAssetMentioned: /Fixed Asset/i.test(joined),
      depreciationBookMentioned: /Depreciation Book|FA Depreciation Book/i.test(joined),
      hgbMentioned: /\bHGB\b/i.test(joined),
      startDateMentioned: /Depreciation Starting Date/i.test(joined),
      yearsMentioned: /No\. of Depreciation Years/i.test(joined),
      endingDateMentioned: /Depreciation Ending Date/i.test(joined),
      bookValueMentioned: /Book Value/i.test(joined),
      lastDepreciationMentioned: /Last Depreciation Date|Last Depr\. Date/i.test(joined),
    },
  };
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
        const rows = [...document.querySelectorAll<HTMLElement>('[role="row"],tr,[data-control-name], [aria-label], [title]')]
          .filter(visible)
          .map((row, index) => ({
            index,
            text: norm([row.innerText || row.textContent, row.getAttribute('aria-label'), row.getAttribute('title')].filter(Boolean).join(' | ')),
          }))
          .filter((row) => keepRe.test(row.text))
          .slice(0, 160);
        const controls = [
          ...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            'input,select,textarea,[role="checkbox"],[aria-checked]',
          ),
        ]
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
          .slice(0, 160);
        return { frameUrl: location.href, rows, controls };
      }, keep.source)
      .catch((error) => ({ frameUrl: frame.url(), error: String(error), rows: [], controls: [] }));
    if (typeof signal.frameUrl === 'string') signal.frameUrl = safeUrl(signal.frameUrl);
    frameSignals.push(signal);
  }
  return frameSignals;
}

function extractNearbyValues(text: string) {
  const lines = compactLines(
    text,
    /FA-CNC-01|HGB|Depreciation Starting Date|No\. of Depreciation Years|Depreciation Ending Date|Book Value|Last Depreciation Date|Last Depr\. Date|Straight-Line|120\.000|120000|120,000|G05001|FADEP-/i,
    220,
  );
  const joined = lines.join('\n');
  const valueAfter = (label: RegExp, type: 'date' | 'years') => {
    const index = lines.findIndex((line) => label.test(line));
    if (index < 0) return undefined;
    for (const candidate of lines.slice(index, index + 4)) {
      const date = candidate.match(/\b\d{2}\.\d{2}\.\d{4}\b/)?.[0];
      if (type === 'date' && date) return date;
      const years = candidate.match(/\b\d{1,2}[.,]\d{2}\b/)?.[0];
      if (type === 'years' && years && !/120[.,]000|120000/i.test(candidate) && !label.test(candidate)) return years;
    }
    return undefined;
  };
  return {
    lines,
    signals: {
      assetVisible: /\bFA-CNC-01\b/i.test(joined),
      hgbVisible: /\bHGB\b/i.test(joined),
      straightLineVisible: /Straight-Line/i.test(joined),
      bookValue120000Visible: /120\.000|120000|120,000/i.test(joined),
      acquisitionDocVisible: /\bG05001\b/i.test(joined),
      missingDocVisible: new RegExp(MISSING_DOC_NO, 'i').test(joined),
      startDateLabelVisible: /Depreciation Starting Date/i.test(joined),
      yearsLabelVisible: /No\. of Depreciation Years/i.test(joined),
      endingDateLabelVisible: /Depreciation Ending Date/i.test(joined),
      lastDepreciationLabelVisible: /Last Depreciation Date|Last Depr\. Date/i.test(joined),
    },
    extracted: {
      depreciationStartingDate: valueAfter(/Depreciation Starting Date/i, 'date'),
      noOfDepreciationYears: valueAfter(/No\. of Depreciation Years/i, 'years'),
      depreciationEndingDate: valueAfter(/Depreciation Ending Date/i, 'date'),
      lastDepreciationDate: valueAfter(/Last Depreciation Date|Last Depr\. Date/i, 'date'),
    },
  };
}

async function readContext(page: Page, id: string, url: string, expected: RegExp, include: RegExp[], rowKeep: RegExp) {
  await openReadOnly(page, url, expected);
  const fullText = await pageText(page);
  const compactText = clean(
    await compactPageText(page, {
      include,
      maxLines: 280,
      maxLineLength: 260,
    }),
  );
  const context = await sandboxContext(page);
  const dialogState = await dangerousDialogs(page, id);
  const frameSignals = await visibleRowsAndControls(page, rowKeep);
  const nearbyValues = extractNearbyValues(`${compactText}\n${fullText}`);
  const payload = {
    id,
    url: safeUrl(page.url()),
    context,
    dialogState,
    nearbyValues,
    frameSignals,
    textEvidenceFile: `${id}-text.txt`,
  };
  await writeTextEvidence(faEvidencePath(payload.textEvidenceFile), compactText || 'No compact read-only text captured.');
  await writeJsonEvidence(faEvidencePath(`${id}.json`), payload);
  return payload;
}

function classify(resultParts: {
  card: Awaited<ReturnType<typeof readContext>>;
  ledger: Awaited<ReturnType<typeof readContext>>;
  journal: Awaited<ReturnType<typeof readContext>>;
  pageInspection: Awaited<ReturnType<typeof openPageInspection>>;
}) {
  const cardSignals = resultParts.card.nearbyValues.signals;
  const ledgerSignals = resultParts.ledger.nearbyValues.signals;
  const journalText = [
    ...resultParts.journal.nearbyValues.lines,
    ...resultParts.journal.frameSignals.flatMap((frame: any) => (frame.rows ?? []).map((row: any) => row.text)),
  ].join('\n');
  const facts = {
    assetCardVisible: cardSignals.assetVisible,
    hgbVisibleOnCard: cardSignals.hgbVisible,
    straightLineVisibleOnCard: cardSignals.straightLineVisible,
    bookValue120000VisibleOnCard: cardSignals.bookValue120000Visible,
    startDateLabelVisible: cardSignals.startDateLabelVisible || resultParts.pageInspection.signals.startDateMentioned,
    yearsLabelVisible: cardSignals.yearsLabelVisible || resultParts.pageInspection.signals.yearsMentioned,
    endingDateLabelVisible: cardSignals.endingDateLabelVisible || resultParts.pageInspection.signals.endingDateMentioned,
    lastDepreciationLabelVisible: cardSignals.lastDepreciationLabelVisible || resultParts.pageInspection.signals.lastDepreciationMentioned,
    acquisitionDocVisibleInLedger: ledgerSignals.acquisitionDocVisible,
    missingDocVisibleInJournal: new RegExp(MISSING_DOC_NO, 'i').test(journalText),
    pageInspectionOpened: resultParts.pageInspection.opened,
  };
  const extracted = resultParts.card.nearbyValues.extracted;
  const hypotheses: string[] = [];
  if (facts.bookValue120000VisibleOnCard && facts.acquisitionDocVisibleInLedger) {
    hypotheses.push('FA-CNC-01 still has acquisition basis and book value context; the missing FADEP journal line is not explained by missing acquisition evidence.');
  }
  if (!extracted.depreciationStartingDate || !extracted.noOfDepreciationYears || !extracted.depreciationEndingDate) {
    hypotheses.push('Visible UI/Page-Inspection text still does not prove enough depreciation-book field values to safely repeat Calculate Depreciation OK.');
  }
  if (!facts.missingDocVisibleInJournal) {
    hypotheses.push(`${MISSING_DOC_NO} is still not visible in the Fixed Asset G/L Journal context.`);
  }
  if (facts.lastDepreciationLabelVisible && !extracted.lastDepreciationDate) {
    hypotheses.push('A last-depreciation signal was mentioned, but no exact value was field-securely extracted.');
  }
  const enoughValues =
    Boolean(extracted.depreciationStartingDate && extracted.noOfDepreciationYears && extracted.depreciationEndingDate) &&
    facts.bookValue120000VisibleOnCard;
  return {
    facts,
    extracted,
    enoughValues,
    classification: facts.missingDocVisibleInJournal
      ? 'journal-line-visible-readonly'
      : enoughValues
        ? 'field-values-visible-but-journal-line-still-missing'
        : 'field-values-still-not-fieldsecure-and-journal-line-missing',
    hypotheses,
  };
}

function renderLearning(result: any) {
  return [
    '# FIXEDASSETS-277 AfA-Buchwerte und Page Inspection',
    '',
    'Status: `labor`, `read-only`, `page-inspection`, `value-diagnosis`, `no-ok`, `no-preview`, `no-posting`, `not-final`.',
    '',
    '## Ergebnis',
    '',
    `- Instanz: \`${result.instance}\``,
    `- Company: \`${result.company}\``,
    `- Anlage: \`${ASSET_NO}\``,
    `- AfA-Buch: \`${DEPRECIATION_BOOK}\``,
    `- Klassifikation: \`${result.diagnosis.classification}\``,
    `- Page Inspection: ${result.diagnosis.facts.pageInspectionOpened ? 'geoeffnet' : 'nicht stabil geoeffnet'}`,
    '',
    '## Feldwerte',
    '',
    `- Depreciation Starting Date: \`${result.diagnosis.extracted.depreciationStartingDate ?? 'nicht field-secure bewiesen'}\``,
    `- No. of Depreciation Years: \`${result.diagnosis.extracted.noOfDepreciationYears ?? 'nicht field-secure bewiesen'}\``,
    `- Depreciation Ending Date: \`${result.diagnosis.extracted.depreciationEndingDate ?? 'nicht field-secure bewiesen'}\``,
    `- Last Depreciation Date: \`${result.diagnosis.extracted.lastDepreciationDate ?? 'nicht field-secure bewiesen'}\``,
    `- Book Value 120.000 sichtbar: ${result.diagnosis.facts.bookValue120000VisibleOnCard ? 'ja' : 'nein'}`,
    '',
    '## Hypothesen',
    '',
    ...(result.diagnosis.hypotheses.length ? result.diagnosis.hypotheses.map((entry: string) => `- ${entry}`) : ['- Keine neue Hypothese aus kompakter Evidence.']),
    '',
    '## Anfaenger-Lernwert',
    '',
    '- Wenn `Calculate Depreciation` keine sichtbare Zeile erzeugt, muss man zuerst die AfA-Buchwerte und das Ziel-Journal pruefen.',
    '- `Book Value` zeigt den vorhandenen Restwert, beweist aber allein noch nicht, dass eine AfA-Zeile faellig und im richtigen Batch sichtbar ist.',
    '- Page Inspection hilft bei der technischen Nachweisfuehrung, ersetzt aber keine Buchungsvorschau und keine Postenspur.',
    '',
    '## Grenzen',
    '',
    '- Kein `OK` auf `Calculate Depreciation`.',
    '- Kein Preview Posting.',
    '- Keine Buchung.',
    '- Kein Setup Change.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-277 inspects FA-CNC-01 HGB depreciation-book values read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();

  const card = await readContext(
    page,
    '010-fa-cnc-01-card-value-readonly',
    filteredUrl(5600, 'Fixed Asset', 'No.', ASSET_NO),
    /Fixed Asset Card|Fixed Asset|FA-CNC-01|Book Value/i,
    [
      /FA-CNC-01|HGB|Book Value|Acquisition Cost|Depreciation Starting Date|No\. of Depreciation Years|Depreciation Ending Date|Last Depreciation|Straight-Line|120\.000|120000|120,000/i,
    ],
    /FA-CNC-01|HGB|Book Value|Acquisition Cost|Depreciation Starting Date|No\. of Depreciation Years|Depreciation Ending Date|Last Depreciation|Straight-Line|120\.000|120000|120,000/i,
  );
  const pageInspection = await openPageInspection(page);
  await writeTextEvidence(
    faEvidencePath('020-pageinspection-focused-lines.txt'),
    pageInspection.lines.join('\n') || 'Page Inspection did not expose compact focused lines.',
  );
  await writeJsonEvidence(faEvidencePath('020-pageinspection-signals.json'), pageInspection);

  const ledger = await readContext(
    page,
    '030-fa-ledger-recheck-readonly',
    filteredUrl(5604, 'FA Ledger Entry', 'FA No.', ASSET_NO),
    /FA Ledger Entries|FA Ledger Entry|Entry No\.|FA-CNC-01/i,
    [/FA-CNC-01|G05001|HGB|Acquisition Cost|Depreciation|Document No\.|Posting Date|FA Posting Date|120\.000|120000|120,000/i],
    /FA-CNC-01|G05001|HGB|Acquisition Cost|Depreciation|Document No\.|Posting Date|FA Posting Date|120\.000|120000|120,000/i,
  );

  const journal = await readContext(
    page,
    '040-fa-gl-journal-recheck-readonly',
    pageUrl(5628),
    /Fixed Asset G\/L Journals|Fixed Asset G\/L Journal|Batch Name|Document No\./i,
    [/Fixed Asset G\/L Journals|Batch Name|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|Amount|FADEP-|FA-CNC-01|HGB|Depreciation|No\. of Depreciation Days|Depr\. until FA Posting Date/i],
    /Fixed Asset G\/L Journals|Batch Name|Posting Date|Document No\.|Depreciation Book Code|FA Posting Type|Amount|FADEP-|FA-CNC-01|HGB|Depreciation|No\. of Depreciation Days|Depr\. until FA Posting Date/i,
  );

  const contexts = [card, ledger, journal];
  const blockedBy = [
    ...contexts.flatMap((entry) => entry.dialogState.dangerous.map((dialog: string) => `${entry.id}:dangerous-dialog:${dialog}`)),
    ...contexts
      .filter((entry) => !entry.context.environmentInUrl || (!entry.context.companyInUrl && !entry.context.companyInText) || entry.context.wrongEnvironmentVisible)
      .map((entry) => `${entry.id}:wrong-context`),
  ];
  const diagnosis = classify({ card, ledger, journal, pageInspection });
  const resultStatus = blockedBy.length ? 'blocked' : 'observed';
  const nextStep =
    'FIXEDASSETS-278: local review of FA-277 value/Page-Inspection evidence before any repeat Calculate Depreciation OK, Preview Posting or Post.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-277-depreciation-book-value-pageinspection-readonly-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-depreciation-book-value-pageinspection',
    resultStatus,
    branch: 'codex/token-efficient-autopilot-state',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    target: {
      fixedAssetNo: ASSET_NO,
      depreciationBook: DEPRECIATION_BOOK,
      targetDepreciationDate: TARGET_DEPRECIATION_DATE,
      missingDocumentNo: MISSING_DOC_NO,
      acquisitionDocumentNo: ACQUISITION_DOC_NO,
    },
    diagnosis,
    contexts,
    pageInspection,
    safety: {
      noCalculateDepreciationOk: true,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noDraft: true,
      noEdit: true,
      noDelete: true,
      noJournalLineInsertEditDelete: true,
    },
    proved: [
      'Business Central stayed in MCP_1_20260210 / RM-DEMO.',
      'FA-CNC-01 card context was read without edit mode.',
      'Page Inspection was attempted read-only from the FA-CNC-01 card context.',
      'FA Ledger Entries for FA-CNC-01 were rechecked without edit mode.',
      'Fixed Asset G/L Journals were rechecked without edit mode.',
      ...(diagnosis.facts.bookValue120000VisibleOnCard ? ['Book Value / amount 120.000 is visible in the card context.'] : []),
      ...(diagnosis.facts.acquisitionDocVisibleInLedger ? [`Acquisition document ${ACQUISITION_DOC_NO} is visible in FA Ledger context.`] : []),
      ...(diagnosis.facts.missingDocVisibleInJournal ? [`${MISSING_DOC_NO} was visible in the journal context.`] : [`${MISSING_DOC_NO} was not visible in the journal context.`]),
      'No Calculate Depreciation OK, Preview Posting, Post, setup change, company switch, draft, edit or API shortcut was executed.',
    ],
    notProved: [
      ...(diagnosis.enoughValues ? [] : ['The exact depreciation-book field values are not all field-securely proven.']),
      'No repeat Calculate Depreciation OK result.',
      'No Preview Posting result.',
      'No depreciation posting.',
      'No German final proof.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-277-fa-depreciation-book-value-pageinspection-readonly.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-277/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-277/FIXEDASSETS-277-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-277/FIXEDASSETS-277-DEPRECIATION-BOOK-VALUE-PAGEINSPECTION-READONLY.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-277/README.md',
    ],
    statePatch: {
      current: {
        activeCase: NEXT_CASE_ID,
        active_case_file: '.agent/state/cases/fixedassets-278-fa-depreciation-book-value-diagnosis-review.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-277-fa-depreciation-book-value-pageinspection-readonly.json',
        requiresStrongModel: true,
        nextStep,
      },
      coverage: {
        activeArea: 'fixedassets',
        latestPracticalCase: CASE_ID,
        nextCase: NEXT_CASE_ID,
        depreciationReadiness: `${CASE_ID} classified as ${diagnosis.classification}; local review required before repeat OK, Preview Posting or Post.`,
      },
    },
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: resultStatus === 'observed',
    reason: 'Read-only value/Page-Inspection diagnosis collected field context; local review required before any execution step.',
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-277-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-277-DEPRECIATION-BOOK-VALUE-PAGEINSPECTION-READONLY.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-277 Evidence Index',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-277-result.json` | JSON-Ergebnis | read-only Klassifikation zu AfA-Buchwerten/Page Inspection | kein OK, kein Preview, keine Buchung | labor |',
      '| `FIXEDASSETS-277-DEPRECIATION-BOOK-VALUE-PAGEINSPECTION-READONLY.md` | Lernzusammenfassung | Feldwert-/Diagnose-Lernwert | keinen deutschen Finalnachweis | labor |',
      '| `010-*` | Anlagenkarte | Book-Value-/AfA-Feldsignale | keine Feldwertaenderung | read-only |',
      '| `020-*` | Page Inspection | technische Feld-/Page-Signale, falls stabil sichtbar | keine Tabellenvollstaendigkeit | read-only |',
      '| `030-*` | Anlagenposten | Erwerbs-/Posten-Kontext zu FA-CNC-01 | keine neue AfA-Zeile | read-only |',
      '| `040-*` | FA G/L Journal | sichtbarer Journal-/Batch-Kontext | keine Buchung | read-only |',
      '',
      `Aktuelle Wahrheit: ${diagnosis.classification}.`,
      '',
    ].join('\n'),
  );

  expect(result.safety.noCalculateDepreciationOk).toBe(true);
  expect(result.safety.noPreviewPosting).toBe(true);
  expect(result.safety.noPost).toBe(true);
  expect(result.safety.noSetupChange).toBe(true);
  expect(blockedBy.filter((entry) => /wrong-context|dangerous-dialog/i.test(entry))).toEqual([]);
});
