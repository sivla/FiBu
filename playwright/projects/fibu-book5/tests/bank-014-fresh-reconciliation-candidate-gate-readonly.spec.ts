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

const testId = 'bank-014';
const caseId = 'BANK-014-FRESH-RECONCILIATION-CANDIDATE-GATE';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;
const candidateTransactionDocumentNo = '108205';
const candidateInvoiceNo = '107197';
const candidateVendorNo = '40000';
const candidateVendorName = 'Wide World Importers';
const candidateAmount = '1.561,00';

type Target = {
  id: string;
  pageId: number;
  tableName?: string;
  filterField?: string;
  filterValue?: string;
  fileStem: string;
  interesting: RegExp;
};

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

function buildPageUrl(target: Target) {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }

  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', String(target.pageId));
  if (target.tableName && target.filterField && target.filterValue) {
    url.searchParams.set('filter', `'${target.tableName}'.'${target.filterField}' IS '${target.filterValue}'`);
  }
  return url.toString();
}

function compactText(text: string, interesting: RegExp) {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafe(line).replace(/\s+/g, ' '))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -5; offset <= 12; offset += 1) {
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
      .slice(0, 280)
  ].join('\n');
}

function squash(text: string) {
  return asciiSafe(text).replace(/\s+/g, ' ');
}

function analyze(text: string) {
  const oneLine = squash(text);
  return {
    candidateTransactionVisible: oneLine.includes(candidateTransactionDocumentNo),
    candidateInvoiceVisible: oneLine.includes(candidateInvoiceNo),
    vendorNoVisible: oneLine.includes(candidateVendorNo),
    vendorNameVisible: new RegExp(candidateVendorName, 'i').test(oneLine),
    candidateAmountVisible: oneLine.includes(candidateAmount),
    paymentReconciliationVisible: /Payment Reconciliation Journal/i.test(oneLine),
    vendorLedgerVisible: /Vendor Ledger Entries|Kreditorenposten/i.test(oneLine),
    openSignalVisible: /\bOpen\b|Offen/i.test(oneLine),
    remainingAmountSignalVisible: /Remaining Amount|Remaining Amt\.|Restbetrag/i.test(oneLine)
  };
}

async function inspectTarget(page: Page, target: Target) {
  await page.goto(buildPageUrl(target), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  await writeTextEvidence(bankEvidencePath(`${target.fileStem}-page-text.txt`), compactText(text, target.interesting));
  const buttons = (await visibleButtonNames(page))
    .map(asciiSafe)
    .filter((button) => /Post|Apply|Accept|Match|Review|New|Edit|Delete|Entry|Open|Line/i.test(button))
    .slice(0, 80);

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName ?? null,
    filterField: target.filterField ?? null,
    filterValue: target.filterValue ?? null,
    url: sanitizeUrl(page.url()),
    title: asciiSafe(await page.title()),
    textEvidenceFile: `${target.fileStem}-page-text.txt`,
    relevantButtonsVisibleNotClicked: buttons,
    analysis: analyze(text)
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-014 Kandidat 108205 / 107197 Gate',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    `| Kandidat | ${candidateTransactionDocumentNo} / Invoice ${candidateInvoiceNo} |`,
    `| Vendor | ${candidateVendorNo} / ${candidateVendorName} |`,
    `| Entscheidung | ${result.decisionStatus} |`,
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

test('BANK-014 prueft frischen Reconciliation-Kandidaten gegen Vendor Ledger read-only', async ({ page }) => {
  const targets: Target[] = [
    {
      id: 'payment-reconciliation-candidate-context',
      pageId: 1290,
      fileStem: '010-payment-reconciliation-candidate-context',
      interesting:
        /Payment Reconciliation|Lines For Review|Accepted|Application Reviewed|Post Payments Only|Accept Applications|Wide World Importers|108205|107197|-1\.561,00|40000|Match|Open Ledger/i
    },
    {
      id: 'vendor-ledger-invoice-107197',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: candidateInvoiceNo,
      fileStem: '020-vendor-ledger-invoice-107197',
      interesting:
        /Vendor Ledger Entries|Kreditorenposten|Wide World Importers|40000|107197|108205|1\.561,00|Remaining Amount|Remaining Amt\.|Open|Entry No\.|Applied Entries|Application/i
    },
    {
      id: 'vendor-ledger-transaction-108205',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: candidateTransactionDocumentNo,
      fileStem: '030-vendor-ledger-transaction-108205',
      interesting:
        /Vendor Ledger Entries|Kreditorenposten|Wide World Importers|40000|107197|108205|1\.561,00|Remaining Amount|Remaining Amt\.|Open|Entry No\.|Applied Entries|Application/i
    }
  ];

  const observations = [];
  for (const target of targets) observations.push(await inspectTarget(page, target));

  const firstUrl = decodeURIComponent(observations[0].url);
  expect(firstUrl).toContain(expectedInstance);
  expect(firstUrl).toMatch(/company=RM-DEMO/i);

  const reconciliation = observations[0].analysis;
  const invoiceLedger = observations[1].analysis;
  const transactionLedger = observations[2].analysis;
  const targetLedgerReady =
    reconciliation.candidateTransactionVisible &&
    reconciliation.candidateInvoiceVisible &&
    reconciliation.vendorNameVisible &&
    invoiceLedger.candidateInvoiceVisible &&
    (invoiceLedger.vendorNoVisible || invoiceLedger.vendorNameVisible) &&
    invoiceLedger.remainingAmountSignalVisible;

  const result = {
    schemaVersion: 1,
    purpose: 'bank-fresh-reconciliation-candidate-gate',
    caseId,
    testId: 'BANK-014',
    source: 'playwright-ui-readonly',
    resultStatus: 'observed',
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    mode: 'labor-readonly-no-post-no-apply-no-edit',
    candidate: {
      transactionDocumentNo: candidateTransactionDocumentNo,
      invoiceNo: candidateInvoiceNo,
      vendorNo: candidateVendorNo,
      vendorName: candidateVendorName,
      amount: candidateAmount
    },
    observations,
    targetLedgerReady,
    decisionStatus: targetLedgerReady ? 'candidate-gate-ready-for-review' : 'candidate-gate-blocked',
    decision: targetLedgerReady
      ? 'BANK-014 bleibt read-only, aber Kandidat 108205 / Invoice 107197 ist als fachlicher Einzelkandidat plausibel genug fuer eine separate Posting-Gate-Entscheidung. Apply/Accept/Post bleiben bis dahin gesperrt.'
      : 'BANK-014 bleibt read-only und blockiert Apply/Post: Der Kandidat 108205 / Invoice 107197 ist noch nicht ausreichend gegen Vendor Ledger Entries belegt.',
    expectedTraceIfLaterApproved: [
      'Payment Reconciliation line 108205 / Invoice 107197 / Wide World Importers selected explicitly.',
      'Accept Applications only after target line and open Vendor Ledger Entry are visible.',
      'Post Payments Only only after dialog proves scope or an all-lines decision exists.',
      'After posting: Vendor Ledger Entry for 107197, payment entry, Detailed Vendor Ledger Entry, Bank Account Ledger Entry and G/L Entries filtered by new payment document.'
    ],
    proved: [
      'Payment Reconciliation Journal wurde read-only fuer Kandidat 108205 / Invoice 107197 gelesen.',
      'Vendor Ledger Entries wurden read-only fuer Invoice 107197 geoeffnet.',
      'Vendor Ledger Entries wurden read-only fuer Document No. 108205 geoeffnet.',
      'Keine Apply-, Accept Applications-, Post Payments Only-, New-, Edit- oder Delete-Aktion wurde geklickt.'
    ],
    notProved: [
      'Keine Bankabstimmung wurde gebucht.',
      'Keine Zahlung wurde gebucht.',
      'Keine Anwendung/Accept Applications wurde ausgefuehrt.',
      'Keine Postenspur einer neuen Zahlung existiert.',
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
      'In der deutschen Zielcompany Kandidat und offenen Kreditorenposten sichtbar abgleichen, bevor Apply oder Post Payments Only genutzt werden.',
    targetGermanCompanyImpact:
      'Deutsche Bankabstimmung braucht eigene Zielzeile, deutsches Bankkonto, Zielposten und separate Posting-/Reconciliation-Evidence.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-014/BANK-014-result.json',
      'playwright/projects/fibu-book5/evidence/bank-014/BANK-014-CANDIDATE-GATE.md',
      'playwright/projects/fibu-book5/evidence/bank-014/010-payment-reconciliation-candidate-context-page-text.txt',
      'playwright/projects/fibu-book5/evidence/bank-014/020-vendor-ledger-invoice-107197-page-text.txt',
      'playwright/projects/fibu-book5/evidence/bank-014/030-vendor-ledger-transaction-108205-page-text.txt',
      'playwright/projects/fibu-book5/evidence/bank-014/README.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-014/'],
    blockedBy: targetLedgerReady ? [] : ['candidate-ledger-proof-incomplete'],
    requiresReview: true,
    safeToFinalizeState: true,
    nextStep: targetLedgerReady
      ? 'BANK-015: judge-only posting-gate decision for candidate 108205 / 107197. Do not click Accept Applications or Post Payments Only until scope and trace are approved.'
      : 'Switch to another bounded execute/evidence route; do not post candidate 108205 / 107197.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-014-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-014-CANDIDATE-GATE.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-014 Evidence Index',
      '',
      'Status: labor, read-only, candidate gate, no-post, no-apply, no-preview, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-payment-reconciliation-candidate-context-page-text.txt` | kompakter UI-Seitentext | Kandidat 108205 / 107197 im Reconciliation-Kontext | keine Anwendung/Buchung | labor, read-only |',
      '| `020-vendor-ledger-invoice-107197-page-text.txt` | kompakter UI-Seitentext | Vendor-Ledger-Sicht zur Rechnung 107197 | keine Zahlung | labor, read-only |',
      '| `030-vendor-ledger-transaction-108205-page-text.txt` | kompakter UI-Seitentext | Vendor-Ledger-Sicht zu Document No. 108205 | keine Buchung | labor, read-only |',
      '| `BANK-014-result.json` | JSON-Ergebnis | strukturierte Kandidatenentscheidung | keinen deutschen Finalnachweis | labor |',
      '| `BANK-014-CANDIDATE-GATE.md` | Lernzusammenfassung | warum vor Apply/Post ein Einzelkandidat + Trace-Gate noetig ist | keine Bankabstimmung | labor |',
      ''
    ].join('\n')
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noAcceptApplications).toBe(true);
  expect(result.flags.noApply).toBe(true);
  expect(observations.length).toBe(3);
});
