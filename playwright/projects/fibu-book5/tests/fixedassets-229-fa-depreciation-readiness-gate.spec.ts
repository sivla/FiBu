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

const CASE_ID = 'FIXEDASSETS-229-FA-DEPRECIATION-READINESS-GATE';
const TEST_ID = 'fixedassets-229';
const EXPECTED_INSTANCE = 'MCP_1_20260210';
const EXPECTED_COMPANY = project.defaultCompany;
const ASSET_NO = 'FA-CNC-01';
const DOCUMENT_NO = 'G05001';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 2400, height: 1300 },
});

test.setTimeout(300_000);

function faEvidencePath(fileName: string) {
  return evidencePath(project.name, TEST_ID, fileName);
}

function filteredUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(pageId === 0 ? requireBcUrl(project.envPrefix) : bcPageUrl(pageId, project.envPrefix));
  url.searchParams.set('company', EXPECTED_COMPANY);
  if (pageId !== 0) url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function clean(value: string | null | undefined) {
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

async function dangerousDialogs(page: Page, phase: string) {
  const dialogs: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const count = await scope.locator('[role="dialog"], [aria-modal="true"]').count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await scope.locator('[role="dialog"], [aria-modal="true"]').nth(index).innerText({ timeout: 500 }).catch(() => '');
      if (text.trim()) dialogs.push(clean(text));
    }
  }
  const dangerous = dialogs.filter((text) => /\b(Post|Preview|Delete|Edit|New|Invoice|Ship|Payment|OK|Yes|Ja|Finish)\b/i.test(text));
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

async function compactRead(page: Page, include: RegExp[], maxLines = 220) {
  return clean(
    await compactPageText(page, {
      include,
      maxLines,
      maxLineLength: 260,
    }),
  );
}

async function readContext(page: Page, id: string, url: string, expected: RegExp, include: RegExp[]) {
  await openReadOnly(page, url, expected);
  const fullText = await pageText(page);
  const compactText = await compactRead(page, include);
  const context = await sandboxContext(page);
  const dialogState = await dangerousDialogs(page, id);
  const payload = {
    id,
    url: safeUrl(page.url()),
    context,
    dialogState,
    signals: {
      assetVisible: /\bFA-CNC-01\b/i.test(fullText),
      documentVisible: /\bG05001\b/i.test(fullText),
      hgbVisible: /\bHGB\b/i.test(fullText),
      machinesVisible: /\bMACHINES\b/i.test(fullText),
      acquisitionCostVisible: /Acquisition Cost/i.test(fullText),
      depreciationVisible: /Depreciation|AfA/i.test(fullText),
      bookValueVisible: /Book Value|Buchwert/i.test(fullText),
      amount120000Visible: /120\.000|120000|120,000/i.test(fullText),
      acquiredSignalVisible: /Acquired|Erworben/i.test(fullText),
      straightLineVisible: /Straight-Line|linear/i.test(fullText),
      eightYearsVisible: /8\.00|8,00|No\. of Depreciation Years/i.test(fullText),
      glIntegrationVisible: /G\/L Integration|Integration/i.test(fullText),
    },
    textEvidenceFile: `${id}-page-text.txt`,
  };
  await writeTextEvidence(faEvidencePath(payload.textEvidenceFile), compactText || 'No compact read-only text captured.');
  await writeJsonEvidence(faEvidencePath(`${id}.json`), payload);
  return payload;
}

function renderLearning(result: Record<string, any>) {
  return [
    '# FIXEDASSETS-229 - FA-CNC-01 Depreciation Readiness Gate',
    '',
    'Status: `labor`, `read-only`, `readiness-gate`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Instanz | ${result.instance} |`,
    `| Company | ${result.company} |`,
    `| Anlage | \`${ASSET_NO}\` |`,
    `| Erwerbsbeleg | \`${DOCUMENT_NO}\` |`,
    `| Resultat | ${result.resultStatus} |`,
    `| AfA-Readiness | ${result.readiness.status} |`,
    '',
    '## Was geprueft wurde',
    '',
    '- Anlagenkarte `FA-CNC-01` read-only.',
    '- `HGB`-Depreciation-Book-Kontext read-only.',
    '- Gebuchte Anlagenposten zu `FA-CNC-01`/`G05001` read-only.',
    '- Keine Journalzeile, kein Preview Posting, keine Buchung und kein Setup-Fit.',
    '',
    '## Ergebnis',
    '',
    ...result.readiness.reasons.map((reason: string) => `- ${reason}`),
    '',
    '## Anfaenger-Lernwert',
    '',
    'Eine Anlage ist nach dem Zugang nicht automatisch bereit fuer eine Abschreibungsbuchung im Buch. Vor einem AfA-Journal muss man mindestens drei Dinge getrennt lesen: die Anlagenkarte, das AfA-Buch und die vorhandenen Anlagenposten. Erst wenn Anschaffungswert, AfA-Buch und Anlagenposten zusammenpassen, darf ein spaeterer AfA-Preflight geplant werden.',
    '',
    '## Grenzen',
    '',
    '- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.',
    '- Kein AfA-Journal und keine AfA-Buchung.',
    '- Keine Steuer-/Compliance- oder Jahresabschlusswirkung.',
    '- Keine Aussage, dass die Abschreibung fachlich richtig gerechnet wurde.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    '',
  ].join('\n');
}

function readinessFrom(asset: any, hgb: any, ledger: any) {
  const reasons: string[] = [];
  if (asset.signals.assetVisible) reasons.push('FA-CNC-01 ist auf der Anlagenkarte sichtbar.');
  if (asset.signals.hgbVisible) reasons.push('HGB ist im Anlagenkartenkontext sichtbar.');
  if (asset.signals.machinesVisible) reasons.push('MACHINES ist im Anlagenkartenkontext sichtbar.');
  if (asset.signals.bookValueVisible && asset.signals.amount120000Visible) {
    reasons.push('Book-Value-/Betragssignale zeigen, dass der Zugang im Kartenkontext angekommen ist.');
  }
  if (hgb.signals.hgbVisible && hgb.signals.glIntegrationVisible) {
    reasons.push('Das HGB-AfA-Buch ist read-only sichtbar und zeigt G/L-Integration-Kontext.');
  }
  if (ledger.signals.assetVisible && ledger.signals.documentVisible && ledger.signals.acquisitionCostVisible) {
    reasons.push('Gebuchte Anlagenposten zeigen FA-CNC-01, G05001 und Acquisition Cost.');
  }

  const hardSignals =
    asset.signals.assetVisible &&
    asset.signals.hgbVisible &&
    ledger.signals.assetVisible &&
    ledger.signals.documentVisible &&
    ledger.signals.acquisitionCostVisible;

  return {
    status: hardSignals ? 'ready-for-local-depreciation-preflight-decision' : 'blocked-readonly-readiness-incomplete',
    hardSignals,
    reasons,
  };
}

test('FIXEDASSETS-229 checks FA-CNC-01 depreciation readiness read-only', async ({ page }) => {
  const startedAt = new Date().toISOString();
  const asset = await readContext(
    page,
    '010-fa-cnc-01-card-readonly',
    filteredUrl(5600, 'Fixed Asset', 'No.', ASSET_NO),
    /Fixed Asset Card|Fixed Asset|FA-CNC-01|Book Value/i,
    [/MCP_1_20260210|RM-DEMO|Fixed Asset Card|FA-CNC-01|CNC Maschine|HGB|MACHINES|Book Value|Acquired|Depreciation|Straight-Line|8\.00|8,00|120\.000|120000|120,000/i],
  );

  const hgb = await readContext(
    page,
    '020-hgb-depreciation-book-readonly',
    filteredUrl(5611, 'Depreciation Book', 'Code', 'HGB'),
    /Depreciation Books|Depreciation Book|HGB/i,
    [/MCP_1_20260210|RM-DEMO|Depreciation Book|HGB|G\/L Integration|Integration|Acquisition Cost|Depreciation|Book Value/i],
  );

  const ledger = await readContext(
    page,
    '030-fa-ledger-acquisition-readonly',
    filteredUrl(5604, 'FA Ledger Entry', 'FA No.', ASSET_NO),
    /FA Ledger Entries|FA Ledger Entry|Entry No\.|FA-CNC-01/i,
    [/MCP_1_20260210|RM-DEMO|FA Ledger Entries|FA Ledger Entry|FA-CNC-01|G05001|HGB|Acquisition Cost|120\.000|120000|120,000|Entry No\.|Document No\./i],
  );

  const readiness = readinessFrom(asset, hgb, ledger);
  const blockedBy = [
    ...[asset, hgb, ledger].flatMap((entry) => entry.dialogState.dangerous.map((dialog: string) => `${entry.id}:dangerous-dialog:${dialog}`)),
    ...[asset, hgb, ledger]
      .filter((entry) => !entry.context.environmentInUrl || (!entry.context.companyInUrl && !entry.context.companyInText) || entry.context.wrongEnvironmentVisible)
      .map((entry) => `${entry.id}:wrong-context`),
    ...(readiness.hardSignals ? [] : ['depreciation-readiness-hard-signals-incomplete']),
  ];

  const resultStatus = blockedBy.length ? 'blocked' : 'observed';
  const nextCaseId = readiness.hardSignals
    ? 'FIXEDASSETS-230-FA-DEPRECIATION-PREFLIGHT-DECISION'
    : 'FIXEDASSETS-230-FA-DEPRECIATION-READINESS-BLOCKER-REVIEW';
  const nextCaseFile = readiness.hardSignals
    ? '.agent/state/cases/fixedassets-230-fa-depreciation-preflight-decision.json'
    : '.agent/state/cases/fixedassets-230-fa-depreciation-readiness-blocker-review.json';
  const nextStep = readiness.hardSignals
    ? 'FIXEDASSETS-230: locally decide the smallest safe depreciation preflight; do not create depreciation journal lines yet.'
    : 'FIXEDASSETS-230: locally review the read-only depreciation readiness blocker before any depreciation preflight.';

  const result = {
    schemaVersion: 1,
    purpose: 'fixedassets-229-fa-depreciation-readiness-gate-result',
    caseId: CASE_ID,
    source: 'playwright-readonly-fa-depreciation-readiness',
    resultStatus,
    selectedTaskClass: 'judge_work',
    selectedModelClass: 'gpt-5.5-low',
    instance: EXPECTED_INSTANCE,
    company: EXPECTED_COMPANY,
    dataBasis: 'CRONUS USA laboratory',
    bcRun: true,
    playwrightRun: true,
    postedInThisRun: false,
    previewPostingInThisRun: false,
    setupChanged: false,
    companySwitched: false,
    apiShortcut: false,
    bookChanged: false,
    target: {
      assetNo: ASSET_NO,
      acquisitionDocumentNo: DOCUMENT_NO,
      depreciationBookCode: 'HGB',
    },
    contexts: [asset, hgb, ledger],
    readiness,
    proved: [
      'The run stayed in MCP_1_20260210 and RM-DEMO.',
      'FA-CNC-01 was inspected read-only on the Fixed Asset Card.',
      'HGB Depreciation Book context was inspected read-only.',
      'Posted FA Ledger Entries were inspected read-only.',
      ...(readiness.hardSignals ? ['Read-only signals are sufficient for a local depreciation preflight decision.'] : []),
      'No depreciation journal, Preview Posting, posting, setup change, draft, edit, delete, company switch or API shortcut was executed.',
    ],
    notProved: [
      ...(readiness.hardSignals ? [] : ['Depreciation readiness is not fully proven from read-only signals.']),
      'No depreciation journal line exists from this run.',
      'No depreciation calculation or depreciation posting was performed.',
      'No German final fixed asset proof exists.',
      'No German tax or closing proof exists.',
    ],
    changedFiles: [
      'package.json',
      'playwright/projects/fibu-book5/tests/fixedassets-229-fa-depreciation-readiness-gate.spec.ts',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/',
    ],
    evidenceRefs: [
      'playwright/projects/fibu-book5/evidence/fixedassets-229/README.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/FIXEDASSETS-229-result.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/FIXEDASSETS-229-DEPRECIATION-READINESS.md',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/010-fa-cnc-01-card-readonly.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/010-fa-cnc-01-card-readonly-page-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/020-hgb-depreciation-book-readonly.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/020-hgb-depreciation-book-readonly-page-text.txt',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/030-fa-ledger-acquisition-readonly.json',
      'playwright/projects/fibu-book5/evidence/fixedassets-229/030-fa-ledger-acquisition-readonly-page-text.txt',
    ],
    blockedBy,
    requiresReview: true,
    safeToFinalizeState: true,
    statePatch: {
      current: {
        activeCase: nextCaseId,
        active_case_file: nextCaseFile,
        lastReferenceCase: CASE_ID,
        lastReferenceCaseFile: '.agent/state/cases/fixedassets-229-fa-depreciation-readiness-gate.json',
        requiresStrongModel: true,
        nextStep,
      },
      activeCase: {
        status: resultStatus === 'observed' ? 'observed-readonly-readiness' : 'blocked-readonly-readiness',
        lastResult: {
          status: resultStatus,
          resultFile: 'playwright/projects/fibu-book5/evidence/fixedassets-229/FIXEDASSETS-229-result.json',
          summary: `FA-229 ${resultStatus}: ${readiness.status}.`,
        },
        nextSafeAction: nextStep,
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
      noDepreciationJournalLine: true,
    },
    observed: {
      startedAt,
      finishedAt: new Date().toISOString(),
    },
    nextStep,
  };

  await writeJsonEvidence(faEvidencePath('FIXEDASSETS-229-result.json'), result);
  await writeTextEvidence(faEvidencePath('FIXEDASSETS-229-DEPRECIATION-READINESS.md'), renderLearning(result));
  await writeTextEvidence(
    faEvidencePath('README.md'),
    [
      '# FIXEDASSETS-229 Evidence Index',
      '',
      'Status: read-only, depreciation-readiness, no-posting, no-preview, no-setup-change, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `FIXEDASSETS-229-result.json` | JSON-Ergebnis | strukturierter Readiness-Befund fuer FA-CNC-01 vor AfA | keine AfA-Buchung | observed/blocked |',
      '| `FIXEDASSETS-229-DEPRECIATION-READINESS.md` | Lernzusammenfassung | warum Karten-, AfA-Buch- und Anlagenposten-Kontext vor AfA getrennt gelesen werden | keinen deutschen Finalnachweis | labor |',
      '| `010-*` | Anlagenkarte | FA-CNC-01 Kartenkontext | keine Buchung | read-only |',
      '| `020-*` | HGB AfA-Buch | HGB Depreciation-Book-Kontext | kein Setup-Fit | read-only |',
      '| `030-*` | Anlagenposten | vorhandene Erwerbsspur | keine AfA-Posten | read-only |',
      '',
      `Aktuelle Wahrheit: ${readiness.status}.`,
      '',
    ].join('\n'),
  );

  expect(blockedBy.filter((entry) => /wrong-context|dangerous-dialog/i.test(entry))).toEqual([]);
});
