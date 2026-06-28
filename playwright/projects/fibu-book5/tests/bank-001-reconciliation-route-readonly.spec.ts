import { test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(360_000);

const testId = 'bank-001';
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

function asciiSafeEvidenceText(value: string) {
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

function compactPageText(text: string) {
  const interesting =
    /Bank Account Reconciliation|Bank Acc\. Reconciliation|Payment Reconciliation|Reconciliation Journal|Bank Statement|Statement No\.|Bank Account No\.|Balance Last Statement|Statement Ending Balance|Difference|Match|Apply|Post|Preview|Import Bank Statement|Bank Accounts|BANK-RM-01|No\.|Name|Description|Lines|Journal|Batch/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => asciiSafeEvidenceText(line))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -3; offset <= 8; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }

  return [
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 180)
  ].join('\n');
}

async function inspectCandidate(page: Page, candidate: CandidatePage) {
  const targetUrl = buildPageUrl(candidate.pageId);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const finalUrl = page.url();
  const title = await page.title();
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(asciiSafeEvidenceText);
  const expectedContextVisible = candidate.expected.test(text);
  const riskyActionsVisible = buttons
    .filter((button) => /\b(New|Neu|Edit|Bearbeiten|Delete|Loeschen|Post|Buchen|Preview|Vorschau|Import|Apply|Match)\b/i.test(button))
    .slice(0, 40);
  const relevantActions = buttons
    .filter((button) => /Bank|Reconciliation|Payment|Journal|Statement|Match|Apply|Post|Preview|Import|Line/i.test(button))
    .slice(0, 40);

  const evidenceFile = `${candidate.id}-page-text.txt`;
  await writeTextEvidence(bankEvidencePath(evidenceFile), compactPageText(text));

  return {
    id: candidate.id,
    pageId: candidate.pageId,
    purpose: candidate.purpose,
    opened: /Business Central|Search|Suchen|Tell me|Was moechten Sie tun/i.test(text),
    expectedContextVisible,
    title: asciiSafeEvidenceText(title),
    finalUrl: sanitizeUrl(finalUrl),
    textEvidenceFile: evidenceFile,
    relevantActionsVisibleNotClicked: relevantActions,
    riskyActionsVisibleNotClicked: riskyActionsVisible,
    noActionClicked: true,
    noDraftCreated: true
  };
}

function renderMarkdown(result: Record<string, any>) {
  const rows = result.candidates
    .map(
      (candidate: Record<string, any>) =>
        `| ${candidate.id} | ${candidate.pageId} | ${candidate.expectedContextVisible ? 'ja' : 'nein'} | ${candidate.textEvidenceFile} |`
    )
    .join('\n');

  return [
    '# BANK-001 Bank Reconciliation Route Read-only',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Status | labor, route-probe, read-only, no-draft, no-post, no-preview |',
    '',
    '## Ergebnis',
    '',
    result.resultStatus === 'observed'
      ? 'Mindestens ein Bank-/Payment-Reconciliation-Kontext wurde per direkter Page-Navigation sichtbar.'
      : 'In diesem Lauf wurde noch kein belastbarer Bank-/Payment-Reconciliation-Kontext sichtbar.',
    '',
    '| Kandidat | Page ID | Kontext sichtbar | Evidence |',
    '|---|---:|---:|---|',
    rows,
    '',
    '## Sicherheitsgrenze',
    '',
    '- Keine Aktion geklickt.',
    '- Kein New/Edit/Delete.',
    '- Kein Draft erzeugt.',
    '- Kein Preview Posting.',
    '- Kein Post.',
    '- Keine Bankabstimmung gebucht.',
    '- Keine Setup-Aenderung.',
    '- Keine API-Abkuerzung.',
    '',
    '## Buchwirkung',
    '',
    'Dieser Lauf ist nur eine Labor-Routenprobe. Er darf im Buch als Hinweis auf moegliche BC-Seiten und als Vorarbeit fuer einen spaeteren Clickguide genutzt werden, aber nicht als Bankabstimmungsnachweis.',
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-001 klaert Bank-/Payment-Reconciliation-Einstieg read-only', async ({ page }) => {
  const candidates: CandidatePage[] = [
    {
      id: '010-page-388-bank-account-reconciliation-candidate',
      pageId: 388,
      expected: /Bank Account Reconciliation|Bank Acc\. Reconciliation|Bank Statement|Statement Ending Balance|Difference/i,
      purpose: 'Direktseite 388 als moeglichen Bank Account Reconciliation Einstieg read-only pruefen.'
    },
    {
      id: '020-page-379-bank-account-reconciliation-candidate',
      pageId: 379,
      expected: /Bank Account Reconciliation|Bank Acc\. Reconciliation|Bank Statement|Statement Ending Balance|Difference/i,
      purpose: 'Direktseite 379 als moeglichen Bank Account Reconciliation Einstieg read-only pruefen.'
    },
    {
      id: '030-page-1290-payment-reconciliation-candidate',
      pageId: 1290,
      expected: /Payment Reconciliation|Payment Application|Reconciliation Journal|Bank Account No\.|Statement/i,
      purpose: 'Direktseite 1290 als moeglichen Payment Reconciliation Einstieg read-only pruefen.'
    },
    {
      id: '040-page-1293-payment-reconciliation-candidate',
      pageId: 1293,
      expected: /Payment Reconciliation|Payment Application|Reconciliation Journal|Bank Account No\.|Statement/i,
      purpose: 'Direktseite 1293 als moeglichen Payment Reconciliation Einstieg read-only pruefen.'
    }
  ];

  const inspected = [];
  for (const candidate of candidates) inspected.push(await inspectCandidate(page, candidate));

  const positiveCandidates = inspected.filter((candidate) => candidate.expectedContextVisible);
  const resultStatus = positiveCandidates.length > 0 ? 'observed' : 'blocked';
  const result = {
    schemaVersion: 1,
    purpose: 'bank-reconciliation-route-readonly-result',
    caseId: 'BANK-001-RECONCILIATION-CONTROLLED-LAB',
    testId: 'BANK-001',
    source: 'playwright-readonly-route-probe',
    resultStatus,
    environment: expectedInstance,
    company: expectedCompany,
    dataBasis: 'CRONUS USA / RM-DEMO labor',
    candidates: inspected,
    bestCandidate: positiveCandidates[0]?.id ?? null,
    proved:
      positiveCandidates.length > 0
        ? ['Mindestens ein Bank-/Payment-Reconciliation-Seitenkontext ist per direkter UI-Navigation erreichbar.']
        : ['Die getesteten Direktseiten erzeugten keinen belastbaren Bank-/Payment-Reconciliation-Kontext.'],
    notProved: [
      'Keine Bankabstimmung wurde angelegt.',
      'Keine Bankabstimmung wurde gebucht.',
      'Kein Matching oder Apply wurde ausgefuehrt.',
      'Kein Preview Posting.',
      'Kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    safety: {
      noActionClicked: true,
      noNew: true,
      noEdit: true,
      noDelete: true,
      noDraftCreated: true,
      noPreviewPosting: true,
      noPost: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChange: true
    },
    migrationRelevance: 'needed-for-german-final',
    sourceCompany: expectedCompany,
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    rebuildInstruction:
      'In der deutschen Zielcompany Bank-/Payment-Reconciliation-Seite ueber stabilen Klickpfad oeffnen, Bankkonto und Belegbezug sichtbar machen, danach erst kontrollierten Draft/Match/Preview/Post mit deutscher Evidence ausfuehren.',
    targetGermanCompanyImpact:
      'Bankkonto, Bankkonto-Buchungsgruppe, offene Posten und Bankabstimmungsprozess muessen in deutscher Zielinstanz neu nachgewiesen werden.',
    blockedBy: positiveCandidates.length > 0 ? [] : ['no-bank-reconciliation-page-context-visible'],
    safeToFinalizeState: false,
    requiresReview: positiveCandidates.length === 0,
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-001/BANK-001-result.json',
      'playwright/projects/fibu-book5/evidence/bank-001/BANK-001-RECONCILIATION-ROUTE-READONLY.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-001/'],
    nextStep:
      positiveCandidates.length > 0
        ? 'BANK-002: den besten Kandidaten mit einem kontrollierten Draft-/Import-/Match-Preflight pruefen; erst dann Bankabstimmung buchen.'
        : 'BANK-002: Page-ID/Klickpfad fuer Bank Account Reconciliation ueber vorhandene Bankkonto- oder Zahlungsbelegaktionen gezielt neu ermitteln; keine Wiederholung derselben Direktseitenprobe.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-001-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-001-RECONCILIATION-ROUTE-READONLY.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-001 Evidence Index',
      '',
      'Status: labor-reference, read-only-route-probe, no-draft, no-post, no-preview, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `BANK-001-result.json` | JSON-Ergebnis | strukturierte Direktseiten-Probe fuer Bank-/Payment-Reconciliation-Kontext | keine Bankabstimmung und kein Matching | labor-reference |',
      '| `BANK-001-RECONCILIATION-ROUTE-READONLY.md` | Lernzusammenfassung | Sicherheitsgrenze und Buchwirkung der Routenprobe | keinen Prozessnachweis | labor-reference |',
      '| `010-*` bis `040-*` | kompakter Page-Text | sichtbare Reconciliation-Kontexte je Kandidat | keinen Draft und keine Buchung | labor-reference |',
      ''
    ].join('\n')
  );
});
