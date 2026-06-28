import { expect, test } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(240_000);

const testId = 'bank-013';
const caseId = 'BANK-013-CONTROLLED-NEXT-EVIDENCE-STEP';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;
const staleInvoiceNo = '108204';
const stalePaymentNo = 'BANK009-108204';

function bankEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function asciiSafe(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

function sanitizeUrl(value: string) {
  return value
    .replace(/businesscentral\.dynamics\.com\/[^/?#]+/i, 'businesscentral.dynamics.com/<tenant>')
    .replace(/aadTenantId=[^&]+/gi, 'aadTenantId=<tenant>')
    .replace(/startTraceId=[^&]+/gi, 'startTraceId=<trace>')
    .replace(/tid=[^&]+/gi, 'tid=<tid>');
}

function reconciliationUrl() {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }

  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', '1290');
  return url.toString();
}

function compactText(text: string) {
  const interesting =
    /Payment Reconciliation|Lines For Review|Accepted|Application Reviewed|Post Payments Only|First Up Consultants|World Wide|Open Ledger|Match|Amount|Document|108204|BANK009|^[0-9]{6}\b/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafe(line).replace(/\s+/g, ' '))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -4; offset <= 10; offset += 1) {
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
      .slice(0, 260)
  ].join('\n');
}

function extractDocumentCandidates(text: string) {
  const oneLine = asciiSafe(text).replace(/\s+/g, ' ');
  const candidates = new Set<string>();
  const patterns = [
    /\b10[0-9]{4}\b/g,
    /\bBANK[0-9]{3}-[0-9]{6}\b/g,
    /\bPAY[0-9A-Z-]{4,20}\b/g,
    /\bINV[0-9A-Z-]{4,20}\b/g
  ];

  for (const pattern of patterns) {
    for (const match of oneLine.matchAll(pattern)) {
      const value = match[0];
      if (value === staleInvoiceNo || value === stalePaymentNo) continue;
      candidates.add(value);
    }
  }

  return [...candidates].slice(0, 25);
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-013 frische Payment-Reconciliation-Zielzeile',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Modus | ${result.mode} |`,
    `| Frische Kandidaten | ${result.freshCandidateDocuments.length ? result.freshCandidateDocuments.map((item: string) => `\`${item}\``).join(', ') : 'keine eindeutig extrahiert'} |`,
    '',
    '## Entscheidung',
    '',
    result.decision,
    '',
    '## Belegt',
    '',
    ...result.proved.map((item: string) => `- ${item}`),
    '',
    '## Nicht belegt',
    '',
    ...result.notProved.map((item: string) => `- ${item}`),
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-013 liest Payment Reconciliation nur nach frischen Zielzeilen', async ({ page }) => {
  await page.goto(reconciliationUrl(), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  const url = sanitizeUrl(page.url());
  const decodedUrl = decodeURIComponent(url);
  expect(decodedUrl).toContain(expectedInstance);
  expect(decodedUrl).toMatch(/company=RM-DEMO/i);

  const buttons = (await visibleButtonNames(page))
    .map(asciiSafe)
    .filter((button) => /Post|Apply|Accept|Match|Review|New|Edit|Delete|Entry|Open|Line/i.test(button))
    .slice(0, 80);
  const freshCandidateDocuments = extractDocumentCandidates(text);
  const oneLine = asciiSafe(text).replace(/\s+/g, ' ');
  const staleInvoiceStillVisible = oneLine.includes(staleInvoiceNo);
  const postPaymentsOnlyVisible = /Post Payments Only/i.test(oneLine);
  const hasFreshCandidate = freshCandidateDocuments.length > 0;

  const result = {
    schemaVersion: 1,
    purpose: 'bank-fresh-reconciliation-target-readonly',
    caseId,
    testId: 'BANK-013',
    source: 'playwright-ui-readonly',
    resultStatus: 'observed',
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    mode: 'labor-readonly-no-post-no-apply-no-edit',
    page: {
      pageId: 1290,
      title: asciiSafe(await page.title()),
      url,
      textEvidenceFile: '010-payment-reconciliation-fresh-target-readonly-page-text.txt',
      relevantButtonsVisibleNotClicked: buttons
    },
    staleContext: {
      staleInvoiceNo,
      stalePaymentNo,
      staleInvoiceStillVisible,
      postPaymentsOnlyVisible
    },
    freshCandidateDocuments,
    decision: hasFreshCandidate
      ? 'BANK-013 bleibt read-only: Es gibt moegliche frische Dokumentkandidaten im Payment-Reconciliation-Kontext, aber keine Zeile wurde markiert, angewendet oder gebucht. Der naechste Lauf braucht eine fachliche Einzelauswahl mit erwarteter Postenspur.'
      : 'BANK-013 bleibt read-only: Es wurde keine eindeutig frische Zielzeile extrahiert. Payment Reconciliation bleibt fuer Posting geparkt; ein anderer Bank-/Payment- oder P2P-Hebel ist sinnvoller.',
    proved: [
      'Payment Reconciliation Journal wurde in MCP_1_20260210 / RM-DEMO read-only geoeffnet.',
      'Der alte Kontext 108204 wurde nicht als Posting-Ziel weiterverwendet.',
      'Post Payments Only, Accept Applications, Apply, New, Edit und Delete wurden nicht geklickt.',
      hasFreshCandidate
        ? `Moegliche frische Dokumentkandidaten wurden nur gelesen: ${freshCandidateDocuments.join(', ')}.`
        : 'Keine frische Dokumentnummer wurde sicher als neuer Zielbeleg extrahiert.'
    ],
    notProved: [
      'Keine Bankabstimmung wurde gebucht.',
      'Keine Zahlung wurde gebucht.',
      'Keine Anwendung/Accept Applications wurde ausgefuehrt.',
      'Keine Zielzeile wurde fachlich ausgewaehlt.',
      'Kein deutscher Bank-/Compliance-Finalnachweis.'
    ],
    flags: {
      readOnly: true,
      noPost: true,
      noPreviewPosting: true,
      noPaymentPosting: true,
      noBankReconciliationPosting: true,
      noAcceptApplications: true,
      noApply: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noNew: true,
      noEdit: true,
      noDelete: true,
      noDraftCreated: true,
      noApiShortcut: true,
      noBookChangeInsideTest: true
    },
    migrationRelevance: 'needed-for-german-final',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    rebuildInstruction:
      'In der deutschen Zielcompany Payment Reconciliation nur mit frischer Statement-Zielzeile und expliziter erwarteter Bank-/Ledger-/Sachpostenspur weiterfuehren.',
    targetGermanCompanyImpact:
      'Deutsche Bankabstimmung braucht eigene Zielzeile, deutsches Bankkonto, Zielposten und separate Posting-/Reconciliation-Evidence.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-013/BANK-013-result.json',
      'playwright/projects/fibu-book5/evidence/bank-013/BANK-013-FRESH-RECONCILIATION-TARGET.md',
      'playwright/projects/fibu-book5/evidence/bank-013/010-payment-reconciliation-fresh-target-readonly-page-text.txt',
      'playwright/projects/fibu-book5/evidence/bank-013/README.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-013/'],
    blockedBy: hasFreshCandidate ? [] : ['no-fresh-target-document-extracted'],
    safeToFinalizeState: true,
    requiresReview: hasFreshCandidate,
    nextStep: hasFreshCandidate
      ? 'BANK-014: choose exactly one fresh candidate and write a posting/trace gate before any Accept Applications or Post Payments Only.'
      : 'Switch to another bounded execute/evidence step; do not post Payment Reconciliation without a fresh target line.'
  };

  await writeTextEvidence(bankEvidencePath('010-payment-reconciliation-fresh-target-readonly-page-text.txt'), compactText(text));
  await writeJsonEvidence(bankEvidencePath('BANK-013-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-013-FRESH-RECONCILIATION-TARGET.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-013 Evidence Index',
      '',
      'Status: labor, read-only, no-post, no-apply, no-preview, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-payment-reconciliation-fresh-target-readonly-page-text.txt` | kompakter UI-Seitentext | Payment-Reconciliation-Kontext ohne Aktion | keine Buchung, kein Apply | labor, read-only |',
      '| `BANK-013-result.json` | JSON-Ergebnis | ob frische Dokumentkandidaten extrahierbar waren | keine fachliche Zielzeilenauswahl | labor |',
      '| `BANK-013-FRESH-RECONCILIATION-TARGET.md` | Lernzusammenfassung | warum BANK-013 nicht blind postet | keinen deutschen Finalnachweis | labor |',
      ''
    ].join('\n')
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noAcceptApplications).toBe(true);
  expect(result.flags.noApply).toBe(true);
});
