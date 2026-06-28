import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(300_000);

const testId = 'bank-016';
const caseId = 'BANK-016-FRESH-VENDOR-LEDGER-CANDIDATE-SCOUT';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;

const candidateDocumentNos = ['108205', '108206', '107196', '107197', '107198'];

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

function vendorLedgerUrl(documentNo: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }

  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', '29');
  url.searchParams.set('filter', `'Vendor Ledger Entry'.'Document No.' IS '${documentNo}'`);
  return url.toString();
}

function compactText(text: string, documentNo: string) {
  const interesting = new RegExp(
    [
      'Vendor Ledger Entries',
      'Kreditorenposten',
      'Document No',
      'External Document No',
      'Vendor No',
      'Vendor Name',
      'Original Amount',
      'Remaining Amount',
      'Open',
      'Entry No',
      'Wide World',
      'First Up',
      'Graphic Design',
      '108205',
      '108206',
      '107196',
      '107197',
      '107198',
      documentNo
    ].join('|'),
    'i'
  );
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafe(line).replace(/\s+/g, ' '))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -5; offset <= 16; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }

  return [
    `Kompakter Vendor-Ledger-Auszug fuer Document No. ${documentNo}; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 260)
  ].join('\n');
}

function squash(text: string) {
  return asciiSafe(text).replace(/\s+/g, ' ');
}

function analyze(text: string, documentNo: string) {
  const oneLine = squash(text);
  const amountMatches = [...oneLine.matchAll(/-?\d{1,3}(?:\.\d{3})*,\d{2}/g)].map((match) => match[0]);
  const vendorNoMatches = [...oneLine.matchAll(/\b[1-9][0-9]{4}\b/g)].map((match) => match[0]);
  const vendorNameMatch = oneLine.match(/(Wide World Importers|First Up Consultants|Graphic Design Institute)/i);
  const documentVisible = oneLine.includes(documentNo);
  const rowSignalVisible = documentVisible && amountMatches.length > 0 && (vendorNameMatch !== null || vendorNoMatches.length > 0);

  return {
    documentNo,
    pageVisible: /Vendor Ledger Entries|Kreditorenposten/i.test(oneLine),
    documentVisible,
    hasRows: rowSignalVisible,
    remainingAmountSignalVisible: /Remaining Amount|Remaining Amt\.|Restbetrag/i.test(oneLine),
    openSignalVisible: /\bOpen\b|Offen/i.test(oneLine),
    relatedGlEntriesVisible: /Related G\/L Entries|G\/L Entries/i.test(oneLine),
    amountCandidates: [...new Set(amountMatches)].slice(0, 8),
    vendorNoCandidates: [...new Set(vendorNoMatches)].slice(0, 8),
    vendorName: vendorNameMatch ? vendorNameMatch[1] : null,
    isUsableCandidate:
      rowSignalVisible &&
      /Remaining Amount|Remaining Amt\.|Restbetrag/i.test(oneLine) &&
      amountMatches.length > 0
  };
}

async function inspectVendorLedger(page: Page, documentNo: string) {
  await page.goto(vendorLedgerUrl(documentNo), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2200);

  const text = await pageText(page);
  const textEvidenceFile = `vendor-ledger-${documentNo}-page-text.txt`;
  await writeTextEvidence(bankEvidencePath(textEvidenceFile), compactText(text, documentNo));
  const relevantButtons = (await visibleButtonNames(page))
    .map(asciiSafe)
    .filter((button) => /Post|Apply|Accept|Match|Review|New|Edit|Delete|Entry|Open|Line|Ledger/i.test(button))
    .slice(0, 80);

  return {
    documentNo,
    pageId: 29,
    filter: `'Vendor Ledger Entry'.'Document No.' IS '${documentNo}'`,
    url: sanitizeUrl(page.url()),
    title: asciiSafe(await page.title()),
    textEvidenceFile,
    relevantButtonsVisibleNotClicked: relevantButtons,
    analysis: analyze(text, documentNo)
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-016 Vendor Ledger Candidate Scout',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Ausgewaehlter Kandidat | ${result.selectedCandidate ? `\`${result.selectedCandidate.documentNo}\`` : 'keiner'} |`,
    `| Entscheidung | ${result.decisionStatus} |`,
    '',
    '## Entscheidung',
    '',
    result.decision,
    '',
    '## Kandidaten',
    '',
    ...result.candidates.map(
      (candidate: Record<string, any>) =>
        `- ${candidate.documentNo}: usable=${candidate.analysis.isUsableCandidate}, vendor=${candidate.analysis.vendorName ?? 'n/a'}, amounts=${candidate.analysis.amountCandidates.join(', ') || 'n/a'}`
    ),
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

test('BANK-016 scoutet frische Vendor-Ledger-Kandidaten read-only', async ({ page }) => {
  const candidates = [];
  for (const documentNo of candidateDocumentNos) candidates.push(await inspectVendorLedger(page, documentNo));

  const firstUrl = decodeURIComponent(candidates[0].url);
  expect(firstUrl).toContain(expectedInstance);
  expect(firstUrl).toMatch(/company=RM-DEMO/i);

  const usableCandidates = candidates.filter((candidate) => candidate.analysis.isUsableCandidate);
  const selectedCandidate = usableCandidates[0] ?? null;
  const result = {
    schemaVersion: 1,
    purpose: 'bank-fresh-vendor-ledger-candidate-scout',
    caseId,
    testId: 'BANK-016',
    source: 'playwright-ui-readonly',
    resultStatus: 'observed',
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    mode: 'labor-readonly-no-post-no-apply-no-edit-no-draft',
    candidateDocumentNos,
    candidates,
    selectedCandidate: selectedCandidate
      ? {
          documentNo: selectedCandidate.documentNo,
          vendorName: selectedCandidate.analysis.vendorName,
          vendorNoCandidates: selectedCandidate.analysis.vendorNoCandidates,
          amountCandidates: selectedCandidate.analysis.amountCandidates,
          textEvidenceFile: selectedCandidate.textEvidenceFile
        }
      : null,
    decisionStatus: selectedCandidate ? 'vendor-ledger-candidate-found' : 'vendor-ledger-candidate-not-found',
    decision: selectedCandidate
      ? `BANK-016 bleibt read-only, findet aber ${selectedCandidate.documentNo} als sichtbaren Vendor-Ledger-Kandidaten. Ein spaeterer Payment-Journal-Preflight darf nur separat und weiterhin ohne globales Payment-Reconciliation-Posting geplant werden.`
      : 'BANK-016 bleibt read-only und findet keinen ausreichend sichtbaren Vendor-Ledger-Kandidaten. Kein Payment-Journal-Draft und kein Reconciliation-Posting freigeben.',
    proved: [
      'Vendor Ledger Entries wurden in MCP_1_20260210 / RM-DEMO read-only fuer mehrere frische Kandidaten geoeffnet.',
      'Keine Payment-Journal-Zeile wurde angelegt.',
      'Keine Accept Applications-, Apply-, Post Payments Only-, New-, Edit- oder Delete-Aktion wurde geklickt.',
      selectedCandidate
        ? `Mindestens ein Kandidat ist sichtbar genug fuer einen separaten Folge-Preflight: ${selectedCandidate.documentNo}.`
        : 'Kein Kandidat war sichtbar genug fuer einen Folge-Preflight.'
    ],
    notProved: [
      'Keine Zahlung wurde gebucht.',
      'Keine Bankabstimmung wurde gebucht.',
      'Keine Anwendung/Accept Applications wurde ausgefuehrt.',
      'Keine Payment-Journal-Preflight-Zeile existiert aus BANK-016.',
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
      'In der deutschen Zielcompany offene Kreditorenposten zuerst aus Vendor Ledger Entries sichtbar ableiten; erst danach Payment Journal oder Bank Reconciliation vorbereiten.',
    targetGermanCompanyImpact:
      'Deutsche finale Payment-/Bankabstimmungs-Evidence braucht einen eigenen offenen Posten, deutsches Bankkonto, Zahlungsbeleg und Postenspur.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-016/BANK-016-result.json',
      'playwright/projects/fibu-book5/evidence/bank-016/BANK-016-VENDOR-LEDGER-SCOUT.md',
      'playwright/projects/fibu-book5/evidence/bank-016/README.md',
      ...candidateDocumentNos.map((documentNo) => `playwright/projects/fibu-book5/evidence/bank-016/vendor-ledger-${documentNo}-page-text.txt`)
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-016/'],
    blockedBy: selectedCandidate ? [] : ['no-usable-vendor-ledger-candidate-visible'],
    requiresReview: selectedCandidate !== null,
    safeToFinalizeState: true,
    nextStep: selectedCandidate
      ? `BANK-017: judge-only decision whether ${selectedCandidate.documentNo} is safe for a single-line Payment Journal preflight; do not create the draft in BANK-016.`
      : 'Switch bank route or park bank reconciliation; do not create a Payment Journal draft.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-016-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-016-VENDOR-LEDGER-SCOUT.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-016 Evidence Index',
      '',
      'Status: labor, read-only, Vendor Ledger scout, no-post, no-apply, no-draft, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `BANK-016-result.json` | JSON-Ergebnis | sichtbare Vendor-Ledger-Kandidaten fuer spaeteren Payment-Preflight | keine Zahlung, keine Bankabstimmung | labor |',
      '| `BANK-016-VENDOR-LEDGER-SCOUT.md` | Lernzusammenfassung | warum Vendor Ledger vor Payment Journal/Reconciliation fuehrt | keinen deutschen Finalnachweis | labor |',
      '| `vendor-ledger-*.txt` | kompakte UI-Seitentexte | gefilterte Vendor-Ledger-Sichten je Kandidat | keine Anwendung/Buchung | labor, read-only |',
      ''
    ].join('\n')
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noDraftCreated).toBe(true);
  expect(candidates.length).toBe(candidateDocumentNos.length);
});
