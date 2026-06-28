import { test, type Page } from '@playwright/test';
import 'dotenv/config';

import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(300_000);

const testId = 'bank-024';
const caseId = 'BANK-024-BANK-ACCOUNT-RECONCILIATION-READONLY-SCOUT';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;

type CandidatePage = {
  id: string;
  pageId: number;
  expected: RegExp;
  purpose: string;
};

function bankEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
}

function asciiSafe(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeUrl(value: string) {
  return value.replace(/businesscentral\.dynamics\.com\/[^/?#]+/i, 'businesscentral.dynamics.com/<tenant>');
}

function buildPageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }

  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', String(pageId));
  return url.toString();
}

function compactReconciliationText(text: string) {
  const interesting =
    /Bank Account Reconciliation|Bank Acc\. Reconciliation|Bank Statement|Statement No\.|Bank Account No\.|Balance Last Statement|Statement Ending Balance|Difference|Lines|Match|Apply|Post|Preview|Import Bank Statement|BANK-RM-01|CHECKING|LIST|No\.|Description|Page Inspection|Business Central/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => asciiSafe(line))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -2; offset <= 7; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }

  return [
    `Compact read-only page text. Full raw page text is intentionally not committed. Original lines: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 160)
  ].join('\n');
}

async function dialogTexts(page: Page) {
  const texts: string[] = [];
  for (const scope of [page, ...page.frames()]) {
    const dialogs = scope.locator('[role="dialog"], [aria-modal="true"], .ms-Dialog-main');
    const count = await dialogs.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const text = await dialogs.nth(index).innerText({ timeout: 500 }).catch(() => '');
      const normalized = asciiSafe(text);
      if (normalized) texts.push(normalized);
    }
  }

  return [...new Set(texts)];
}

async function inspectReadOnlyPage(page: Page, candidate: CandidatePage) {
  await page.goto(buildPageUrl(candidate.pageId), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(2500);

  const finalUrl = page.url();
  if (!finalUrl.includes(expectedInstance)) throw new Error(`Instance mismatch after navigation: ${sanitizeUrl(finalUrl)}`);
  if (new URL(finalUrl).searchParams.get('company') !== expectedCompany) {
    throw new Error(`Company mismatch after navigation: ${sanitizeUrl(finalUrl)}`);
  }

  const dialogs = await dialogTexts(page);
  const dangerousDialog = dialogs.find((text) =>
    /\b(OK|Yes|Ja|Post|Buchen|Preview|Vorschau|Delete|Loeschen|New|Neu|Edit|Bearbeiten|Apply|Match)\b/i.test(text)
  );
  if (dangerousDialog) throw new Error(`Unsafe dialog visible on read-only scout: ${dangerousDialog}`);

  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(asciiSafe).filter(Boolean);
  const relevantActions = buttons
    .filter((button) => /Bank|Reconciliation|Statement|Match|Apply|Post|Preview|Import|Line|New|Edit|Delete/i.test(button))
    .slice(0, 60);
  const riskyActionsVisible = relevantActions
    .filter((button) => /\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Post|Buchen|Preview|Vorschau|Import|Apply|Match)\b/i.test(button))
    .slice(0, 30);

  const textEvidenceFile = `${candidate.id}-page-text.txt`;
  await writeTextEvidence(bankEvidencePath(textEvidenceFile), compactReconciliationText(text));

  return {
    id: candidate.id,
    pageId: candidate.pageId,
    purpose: candidate.purpose,
    title: asciiSafe(await page.title()),
    finalUrl: sanitizeUrl(finalUrl),
    expectedContextVisible: candidate.expected.test(text),
    bankAccountSignalVisible: /BANK-RM-01|CHECKING|Bank Account No\.|Bankkonto/i.test(text),
    statementSignalVisible: /Statement No\.|Bank Statement|Statement Ending Balance|Balance Last Statement/i.test(text),
    lineOrDifferenceSignalVisible: /Difference|Lines|Abstimmungszeile|Zeilen/i.test(text),
    relevantActionsVisibleNotClicked: relevantActions,
    riskyActionsVisibleNotClicked: riskyActionsVisible,
    textEvidenceFile,
    noActionClicked: true,
    noNew: true,
    noEdit: true,
    noDelete: true,
    noStatementLineCreated: true,
    noMatch: true,
    noApply: true,
    noPost: true
  };
}

function renderMarkdown(result: Record<string, any>) {
  const rows = result.pages
    .map(
      (candidate: Record<string, any>) =>
        `| ${candidate.id} | ${candidate.pageId} | ${candidate.expectedContextVisible ? 'ja' : 'nein'} | ${
          candidate.bankAccountSignalVisible ? 'ja' : 'nein'
        } | ${candidate.statementSignalVisible ? 'ja' : 'nein'} | ${candidate.textEvidenceFile} |`
    )
    .join('\n');

  return [
    '# BANK-024 Bank Account Reconciliation Read-only Scout',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, read-only, no-statement-line, no-match, no-apply, no-post |',
    '',
    '## Ergebnis',
    '',
    result.resultStatus === 'observed'
      ? 'Mindestens ein Bank-Account-Reconciliation-Kontext wurde read-only sichtbar.'
      : 'Kein ausreichender Bank-Account-Reconciliation-Kontext wurde sichtbar.',
    '',
    '| Seite | Page ID | Reconciliation-Kontext | Bankkonto-Signal | Statement-Signal | Evidence |',
    '|---|---:|---:|---:|---:|---|',
    rows,
    '',
    '## Sicherheitsgrenze',
    '',
    '- Keine Aktion geklickt.',
    '- Kein New/Edit/Delete.',
    '- Keine Statement-Zeile angelegt.',
    '- Kein Match oder Apply.',
    '- Kein Preview Posting.',
    '- Kein Post.',
    '- Keine Bankabstimmung gebucht.',
    '- Keine Setup-Aenderung.',
    '- Keine API-Abkuerzung.',
    '',
    '## Buchwirkung',
    '',
    'Dieser Scout beweist nur die sichere Lesbarkeit der Bankkontoabstimmungs-Route. Er beweist keine Bankabstimmung. Fuer einen spaeteren Prozessfall braucht es eigene Gates fuer Bankkonto, Statement-Zeile, Zielposten, Match/Apply-Kontext, Post-Dialog und Postenspur.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-024 scouts Bank Account Reconciliation read-only', async ({ page }) => {
  const candidates: CandidatePage[] = [
    {
      id: '010-page-388-bank-account-reconciliations-list',
      pageId: 388,
      expected: /Bank Account Reconciliations|Bank Account Reconciliation|Bank Statement|Statement Ending Balance|Difference/i,
      purpose: 'Read-only list/context scout for Bank Account Reconciliations.'
    },
    {
      id: '020-page-379-bank-account-reconciliation-card',
      pageId: 379,
      expected: /Bank Account Reconciliation|Bank Acc\. Reconciliation|Bank Statement|Statement No\.|Statement Ending Balance|Difference/i,
      purpose: 'Read-only card/context scout for a Bank Account Reconciliation page.'
    }
  ];

  const pages = [];
  for (const candidate of candidates) pages.push(await inspectReadOnlyPage(page, candidate));

  const observedPages = pages.filter((candidate) => candidate.expectedContextVisible);
  const resultStatus = observedPages.length > 0 ? 'observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'autopilot-result-normalized',
    caseId,
    testId: 'BANK-024',
    source: 'playwright-ui-readonly-bank-account-reconciliation-scout',
    resultStatus,
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    mode: 'labor-readonly-no-statement-line-no-match-no-apply-no-post',
    pages,
    bestCandidate: observedPages[0]?.id ?? null,
    proved:
      observedPages.length > 0
        ? [
            'Business Central stayed in MCP_1_20260210 / RM-DEMO.',
            'At least one Bank Account Reconciliation context was visible read-only.',
            'No New, Edit, Delete, Match, Apply, Preview, Post or setup action was clicked.',
            'Compact page text and visible action names were captured for route readiness.'
          ]
        : [
            'Business Central stayed in MCP_1_20260210 / RM-DEMO.',
            'The tested Bank Account Reconciliation direct pages did not provide enough visible context for a process follow-up.'
          ],
    notProved: [
      'No bank account reconciliation was created.',
      'No statement line was created.',
      'No Match or Apply was executed.',
      'No Preview Posting was opened.',
      'No posting was executed.',
      'No German final bank reconciliation proof.'
    ],
    flags: {
      readOnly: true,
      noPost: true,
      noPreviewPosting: true,
      noBankReconciliationPosting: true,
      noStatementLineCreated: true,
      noMatch: true,
      noApply: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noNew: true,
      noEdit: true,
      noDelete: true,
      noDraftCreated: true,
      noApiShortcut: true,
      noBookChangeInsideTest: true,
      noScreenshot: true
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    rebuildInstruction:
      'In the German target company rebuild this route with German bank account, statement line, target ledger item, match/apply context, post dialog and ledger trace.',
    targetGermanCompanyImpact:
      'German final evidence must show real German bank reconciliation pages, statement context and posting trace.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-024/BANK-024-result.json',
      'playwright/projects/fibu-book5/evidence/bank-024/BANK-024-READONLY-SCOUT.md',
      'playwright/projects/fibu-book5/evidence/bank-024/010-page-388-bank-account-reconciliations-list-page-text.txt',
      'playwright/projects/fibu-book5/evidence/bank-024/020-page-379-bank-account-reconciliation-card-page-text.txt',
      'playwright/projects/fibu-book5/evidence/bank-024/README.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-024/'],
    blockedBy: observedPages.length > 0 ? [] : ['no-bank-account-reconciliation-context-visible'],
    requiresReview: observedPages.length === 0,
    safeToFinalizeState: false,
    statePatch: {},
    nextStep:
      observedPages.length > 0
        ? 'BANK-025: decide whether to create a controlled bank reconciliation preflight with an explicit statement-line plan, or keep bank reconciliation for German final rebuild.'
        : 'BANK-025: choose a safer navigation/action-discovery route or park bank reconciliation until German final rebuild.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-024-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-024-READONLY-SCOUT.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-024 Evidence Index',
      '',
      'Status: labor, read-only-route-scout, no-statement-line, no-match, no-apply, no-post, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `BANK-024-result.json` | JSON-Ergebnis | strukturierter read-only Scout der Bank Account Reconciliation Route | keine Bankabstimmung und keine Buchung | labor-readonly |',
      '| `BANK-024-READONLY-SCOUT.md` | Lernzusammenfassung | Sicherheitsgrenze und Buchwirkung des Scouts | keinen Prozessnachweis | labor-readonly |',
      '| `010-*`, `020-*` | kompakter Page-Text | sichtbare Reconciliation-Kontexte je Page-ID | keinen Draft, kein Match, kein Posting | labor-readonly |',
      ''
    ].join('\n')
  );
});
