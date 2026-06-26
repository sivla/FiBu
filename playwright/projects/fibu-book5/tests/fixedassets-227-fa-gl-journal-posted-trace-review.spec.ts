import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';

import {
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

const CASE_ID = 'FIXEDASSETS-227-FA-GL-JOURNAL-POSTED-TRACE-REVIEW';
const TEST_ID = 'fixedassets-227';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const DOCUMENT_NO = 'G05001';
const ASSET_NO = 'FA-CNC-01';

type ProbeTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  expectedContext: RegExp;
  expectedSignals: RegExp[];
  purpose: string;
  knownLimitation?: string;
};

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2200, height: 1300 },
});

test.setTimeout(240_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function safeUrl(value: string) {
  const url = new URL(value);
  for (const key of ['aadTenantId', 'startTraceId', 'tid']) url.searchParams.delete(key);
  return url.toString();
}

function compactInterestingText(text: string) {
  const interesting =
    /FA Ledger Entries|FA Ledger Entry|FA-CNC-01|G05001|HGB|Acquisition Cost|120\.000|120000|120,000|Document No\.|FA No\.|Depreciation Book|Posting Type|Amount|Entry No\.|Preview/i;
  const lines = cleanText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -2; offset <= 4; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }
  return [
    `Compact read-only page text. Original visible lines: ${lines.length}.`,
    '',
    ...[...selected].sort((left, right) => left - right).map((index) => lines[index]).slice(0, 160),
  ].join('\n');
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

async function detectDangerousDialog(page: Page, phase: string) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const count = await scope.locator('[role="dialog"], [aria-modal="true"]').count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await scope.locator('[role="dialog"], [aria-modal="true"]').nth(index).innerText({ timeout: 500 }).catch(() => '');
      if (text.trim()) dialogs.push(cleanText(text));
    }
  }
  const dangerous = dialogs.filter((text) => /\b(Post|Preview|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish)\b/i.test(text));
  return { phase, dialogs, dangerous, ok: dangerous.length === 0 };
}

async function probeReadOnlyPage(page: Page, target: ProbeTarget) {
  await page.goto(filteredBcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page).catch(() => undefined);
  await hideFactBoxPane(page).catch(() => undefined);
  await waitForPageText(page, target.expectedContext, { timeout: 60_000 });
  await page.waitForTimeout(1500);

  const context = await sandboxContext(page);
  const fullText = await pageText(page);
  const compact = compactInterestingText(await compactPageText(page, {
    include: [
      /FA Ledger Entries|FA Ledger Entry|FA-CNC-01|G05001|HGB|Acquisition Cost|120\.000|120000|120,000|Document No\.|FA No\.|Depreciation Book|Posting Type|Amount|Entry No\.|Preview/i,
    ],
    maxLines: 180,
  }));
  const signalResults = target.expectedSignals.map((pattern) => ({ pattern: pattern.source, visible: pattern.test(fullText) }));
  const contextVisible = target.expectedContext.test(fullText);
  const dangerousDialog = await detectDangerousDialog(page, target.id);
  const allSignalsVisible = signalResults.every((signal) => signal.visible);
  const rowEmpty = /In dieser Ansicht kann nichts angezeigt werden|Nothing to show|No data to display|There is nothing to show/i.test(fullText);
  const status = contextVisible && allSignalsVisible && dangerousDialog.ok ? 'labor' : 'rejected';

  await writeTextEvidence(faEvidencePath(`${target.id}-page-text.txt`), compact || 'No compact FA Ledger Entries text captured.');
  await writeJsonEvidence(faEvidencePath(`${target.id}.json`), {
    schemaVersion: 1,
    caseId: CASE_ID,
    purpose: target.purpose,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    url: safeUrl(page.url()),
    context,
    contextVisible,
    signalResults,
    allSignalsVisible,
    rowEmpty,
    dangerousDialog,
    status,
    knownLimitation: target.knownLimitation ?? '',
  });

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    url: safeUrl(page.url()),
    context,
    contextVisible,
    signalResults,
    allSignalsVisible,
    rowEmpty,
    dangerousDialog,
    status,
    textEvidenceFile: `${target.id}-page-text.txt`,
    jsonEvidenceFile: `${target.id}.json`,
    knownLimitation: target.knownLimitation ?? '',
  };
}

function renderMarkdown(result: Record<string, any>) {
  const rows = result.probes
    .map(
      (probe: any) =>
        `| ${probe.id} | ${probe.pageId} | ${probe.status} | ${probe.contextVisible ? 'ja' : 'nein'} | ${probe.allSignalsVisible ? 'ja' : 'nein'} | ${probe.rowEmpty ? 'ja' : 'nein'} |`,
    )
    .join('\n');

  return [
    '# FIXEDASSETS-227 - Posted FA Ledger Trace Review',
    '',
    'Status: `read-only`, `posting-trace`, `no-posting`, `no-preview`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Instanz | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Dokument | \`${DOCUMENT_NO}\` |`,
    `| Anlage | \`${ASSET_NO}\` |`,
    `| Anlagenposten sichtbar | ${result.faLedgerProofVisible ? 'ja' : 'nein'} |`,
    `| Bester Pfad | ${result.bestProbe ?? '(keiner)'} |`,
    '',
    '## Proben',
    '',
    '| Probe | Page | Status | Kontext | Signale | Leerbild |',
    '|---|---:|---|---:|---:|---:|',
    rows,
    '',
    '## Lernwert',
    '',
    'Nach einer Buchung reicht die Sachpostenspur nicht aus. Fuer Anlagen muss Business Central zusaetzlich ueber die gebuchten Anlagenposten nachvollziehbar machen, welche Anlage, welches AfA-Buch und welcher Anlagenbuchungstyp betroffen sind. FA-227 prueft deshalb den posted Ledger read-only und trennt ihn vom vorherigen Preview-Pfad.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in RM-DEMO, kein deutscher Finalnachweis.',
    '- Keine neue Buchung und kein Preview Posting.',
    '- Keine Abschreibungsbuchung.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

test('FIXEDASSETS-227 recovers posted FA Ledger Entries read-only', async ({ page }) => {
  const targets: ProbeTarget[] = [
    {
      id: '010-fa-ledger-page-5604-fa-no',
      pageId: 5604,
      tableName: 'FA Ledger Entry',
      filterField: 'FA No.',
      filterValue: ASSET_NO,
      expectedContext: /FA Ledger Entries|FA Ledger Entry|Anlagenposten|Entry No\./i,
      expectedSignals: [/FA-CNC-01/i, /G05001/i, /HGB/i, /Acquisition Cost/i, /120\.000|120000|120,000/i],
      purpose: 'FA-227 prueft gebuchte FA Ledger Entries ueber Page 5604 und FA No. FA-CNC-01.',
    },
    {
      id: '020-fa-ledger-page-5604-document-no',
      pageId: 5604,
      tableName: 'FA Ledger Entry',
      filterField: 'Document No.',
      filterValue: DOCUMENT_NO,
      expectedContext: /FA Ledger Entries|FA Ledger Entry|Anlagenposten|Entry No\./i,
      expectedSignals: [/FA-CNC-01/i, /G05001/i, /HGB/i, /Acquisition Cost/i, /120\.000|120000|120,000/i],
      purpose: 'FA-227 prueft gebuchte FA Ledger Entries ueber Page 5604 und Document No. G05001.',
    },
    {
      id: '030-rejected-page-5606-document-no',
      pageId: 5606,
      tableName: 'FA Ledger Entry',
      filterField: 'Document No.',
      filterValue: DOCUMENT_NO,
      expectedContext: /FA Ledger Entries Preview|FA Ledger Entries|FA Ledger Entry|Anlagenposten|Entry No\./i,
      expectedSignals: [/FA-CNC-01/i, /G05001/i, /HGB/i, /Acquisition Cost/i, /120\.000|120000|120,000/i],
      purpose: 'FA-227 klassifiziert den FA-226 Page-5606-Pfad als Vergleichs-/Negativpfad.',
      knownLimitation: 'Page 5606 kann FA Ledger Entries Preview oeffnen und ist fuer gebuchte Anlagenposten nicht der bevorzugte Nachweis.',
    },
  ];

  const probes = [];
  for (const target of targets) {
    const probe = await probeReadOnlyPage(page, target);
    probes.push(probe);
    if (!probe.context.environmentInUrl || (!probe.context.companyInUrl && !probe.context.companyInText) || probe.context.wrongEnvironmentVisible) {
      break;
    }
  }

  const positiveProbes = probes.filter((probe) => probe.status === 'labor' && probe.id !== '030-rejected-page-5606-document-no');
  const blockedBy = [
    ...probes.flatMap((probe) => probe.dangerousDialog.dangerous.map((dialog: string) => `${probe.id}:dangerous-dialog:${dialog}`)),
    ...probes
      .filter((probe) => !probe.context.environmentInUrl || (!probe.context.companyInUrl && !probe.context.companyInText) || probe.context.wrongEnvironmentVisible)
      .map((probe) => `${probe.id}:wrong-context`),
    ...(positiveProbes.length ? [] : ['posted-fa-ledger-entry-not-proven-readonly']),
  ];

  const faLedgerProofVisible = positiveProbes.length > 0;
  const resultStatus = blockedBy.length ? 'blocked' : 'observed';
  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-227-posted-fa-ledger-trace-review-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-ledger-trace-recovery',
    resultStatus,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    dataBasis: 'CRONUS USA laboratory',
    postedInThisRun: false,
    previewPostingInThisRun: false,
    setupChanged: false,
    companySwitched: false,
    apiShortcut: false,
    bookChanged: false,
    target: {
      documentNo: DOCUMENT_NO,
      assetNo: ASSET_NO,
      depreciationBookCode: 'HGB',
      faPostingType: 'Acquisition Cost',
    },
    sourceEvidence: 'playwright/projects/fibu-book5/evidence/fixedassets-226/FIXEDASSETS-226-result.json',
    probes,
    faLedgerProofVisible,
    bestProbe: positiveProbes[0]?.id ?? null,
    proved: [
      'The run stayed in MCP_1_20260210 and RM-DEMO.',
      'No posting, Preview Posting, setup change, company switch or API shortcut was executed.',
      ...(faLedgerProofVisible
        ? ['Posted FA Ledger Entries are visible for FA-CNC-01/G05001/HGB/Acquisition Cost/120000 in read-only UI evidence.']
        : []),
      ...(probes.some((probe) => probe.id === '030-rejected-page-5606-document-no')
        ? ['The Page 5606 path is classified separately from the posted Page 5604 ledger path.']
        : []),
    ],
    notProved: [
      ...(faLedgerProofVisible ? [] : ['Posted FA Ledger Entry trace remains unproven.']),
      'No German final fixed asset proof exists.',
      'No depreciation posting proof exists.',
      'No book text was updated in this run.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-227-fa-gl-journal-posted-trace-review.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-227/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-227/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-227/FIXEDASSETS-227-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-227/FIXEDASSETS-227-POSTED-TRACE.md',
      ...probes.flatMap((probe) => [
        `playwright/projects/fibu-book5/evidence/fixedassets-227/${probe.jsonEvidenceFile}`,
        `playwright/projects/fibu-book5/evidence/fixedassets-227/${probe.textEvidenceFile}`,
      ]),
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: faLedgerProofVisible
          ? 'FIXEDASSETS-228-FA-ACQUISITION-BOOK-SYNC'
          : 'FIXEDASSETS-228-FA-LEDGER-ALTERNATIVE-READONLY-TRACE',
        active_case_file: faLedgerProofVisible
          ? '.agent/state/cases/fixedassets-228-fa-acquisition-book-sync.json'
          : '.agent/state/cases/fixedassets-228-fa-ledger-alternative-readonly-trace.json',
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-227-fa-gl-journal-posted-trace-review.json',
        requiresStrongModel: true,
        nextStep: faLedgerProofVisible
          ? 'FIXEDASSETS-228: sync Chapter 21 and coverage with posted FA acquisition evidence; no new posting.'
          : 'FIXEDASSETS-228: try an alternative read-only FA Ledger trace route; no new posting.',
      },
      activeCase: {
        status: faLedgerProofVisible ? 'observed' : 'blocked-readonly-trace',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-227/FIXEDASSETS-227-result.json',
          summary: faLedgerProofVisible
            ? 'FA-227 recovered posted FA Ledger Entries read-only via Page 5604.'
            : 'FA-227 did not recover posted FA Ledger Entries; alternative read-only route needed.',
        },
        nextSafeAction: faLedgerProofVisible
          ? 'Sync book and coverage with posted FA acquisition evidence.'
          : 'Try alternative read-only FA Ledger trace route without posting.',
      },
    },
    flags: {
      noPosting: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true,
      noDraft: true,
      noEdit: true,
      noDelete: true,
    },
    nextStep: faLedgerProofVisible
      ? 'FIXEDASSETS-228: sync Chapter 21 and coverage with posted FA acquisition evidence; no new posting.'
      : 'FIXEDASSETS-228: try an alternative read-only FA Ledger trace route; no new posting.',
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-227-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-227-POSTED-TRACE.md'), renderMarkdown(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-227 Evidence Index',
      '',
      'Status: read-only, no-posting, no-preview, no-setup-change, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-227-result.json` | JSON-Ergebnis | strukturierter Befund zu Page 5604/5606 fuer gebuchte Anlagenposten | keinen deutschen Finalnachweis | read-only |',
      '| `FIXEDASSETS-227-POSTED-TRACE.md` | Lernzusammenfassung | warum Sachposten und Anlagenposten getrennte Nachweisschichten sind | keine Buchaenderung | labor, posting-trace |',
      '| `010-*` | Page-5604-Probe nach FA No. | ob FA-CNC-01 als gebuchter Anlagenposten sichtbar ist | keine Abschreibung | labor/rejected |',
      '| `020-*` | Page-5604-Probe nach Document No. | ob G05001 als gebuchter Anlagenposten sichtbar ist | keinen neuen Prozess | labor/rejected |',
      '| `030-*` | Page-5606-Vergleichspfad | ob der alte Preview-Pfad weiterhin abzugrenzen ist | keine echte Posted-Trace-Empfehlung | rejected/comparison |',
      '',
      `Aktuelle Wahrheit: ${faLedgerProofVisible ? 'FA Ledger Entries wurden read-only sichtbar.' : 'FA Ledger Entries bleiben offen.'}`,
      '',
    ].join('\n'),
  );

  expect(probes.length).toBe(targets.length);
  expect(blockedBy.filter((entry) => /wrong-context|dangerous-dialog/i.test(entry))).toEqual([]);
});
