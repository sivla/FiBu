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

test.setTimeout(420_000);

const testId = 'bank-005';
const caseId = 'BANK-005-TARGET-LINE-OPEN-ENTRY-DRILLDOWN';
const expectedInstance = 'MCP_1_20260210';
const expectedCompany = project.defaultCompany;
const targetDocumentNo = '108204';
const targetRelatedInvoiceNo = '107196';
const targetParty = 'First Up Consultants';
const targetAmount = '-2.151,46';

type TraceTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  labelPattern: RegExp;
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

function buildPageUrl(pageId: number, filter?: { tableName: string; fieldName: string; value: string }) {
  const url = new URL(requireBcUrl(project.envPrefix));
  if (!url.toString().includes(expectedInstance)) {
    throw new Error(`Configured BC URL does not target ${expectedInstance}.`);
  }

  url.searchParams.set('company', expectedCompany);
  url.searchParams.set('page', String(pageId));
  if (filter) {
    url.searchParams.set('filter', `'${filter.tableName}'.'${filter.fieldName}' IS '${filter.value}'`);
  }
  return url.toString();
}

function compactPageText(text: string) {
  const interesting =
    /Payment Reconciliation Journal|Lines For Review|Accepted|Match Confidence|Application Reviewed|First Up Consultants|108204|107196|-2\.151,46|Customer Ledger|Cust\. Ledger|Vendor Ledger|Bank Account Ledger|Remaining Amount|Remaining Amt|Open|Document No\.|External Document|Account No\.|Account Type|Applied Amount|Transaction Amount|No\. of Open Ledger Entries|Within Amount Tolerance|Outside Amount Tolerance|MCP_1_20260210|RM-DEMO/i;
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => asciiSafe(line).replace(/\s+/g, ' '))
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -5; offset <= 10; offset += 1) {
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
      .slice(0, 300)
  ].join('\n');
}

function squash(text: string) {
  return asciiSafe(text).replace(/\s+/g, ' ');
}

function analyzePaymentReconciliation(text: string) {
  const oneLine = squash(text);
  return {
    pageVisible: /Payment Reconciliation Journal/i.test(oneLine),
    targetDocumentVisible: oneLine.includes(targetDocumentNo),
    targetRelatedInvoiceVisible: oneLine.includes(targetRelatedInvoiceNo),
    targetPartyVisible: new RegExp(targetParty, 'i').test(oneLine),
    targetAmountVisible: oneLine.includes(targetAmount),
    acceptedVisible: /Accepted/i.test(oneLine),
    applicationReviewedVisible: /Application Reviewed/i.test(oneLine),
    matchConfidenceMediumVisible: /Match Confidence\s+Medium/i.test(oneLine),
    openLedgerEntrySignalVisible: /No\. of Open Ledger Entries|Within Amount Tolerance|Outside Amount Tolerance/i.test(oneLine),
    withinToleranceOneVisible: /Within Amount Tolerance\s*1/i.test(oneLine),
    outsideToleranceTwentyVisible: /Outside Amount Tolerance\s*20/i.test(oneLine),
    postPaymentsOnlyVisible: /Post Payments Only/i.test(oneLine)
  };
}

function analyzeLedgerText(text: string, target: TraceTarget) {
  const oneLine = squash(text);
  const documentVisible = oneLine.includes(target.filterValue);
  return {
    pageContextVisible: target.labelPattern.test(oneLine),
    filterValueVisible: documentVisible,
    targetPartyVisible: new RegExp(targetParty, 'i').test(oneLine),
    relatedInvoiceVisible: oneLine.includes(targetRelatedInvoiceNo),
    amountVisible: oneLine.includes(targetAmount) || /2\.151,46|2151\.46/i.test(oneLine),
    remainingAmountVisible: /Remaining Amount|Remaining Amt|Restbetrag/i.test(oneLine),
    openSignalVisible: /\bOpen\b|Offen/i.test(oneLine),
    entryNoVisible: /Entry No\.|Postennr\.|Posten Nr\./i.test(oneLine),
    noRecordsSignalVisible: /There is nothing to show|No records|Keine Daten|Keine Posten|Nothing to show/i.test(oneLine),
    safeRelationCandidate:
      documentVisible &&
      (new RegExp(targetParty, 'i').test(oneLine) || oneLine.includes(targetRelatedInvoiceNo) || /Remaining Amount|Open/i.test(oneLine))
  };
}

async function openReadonlyPage(page: Page, target: TraceTarget) {
  const targetUrl = buildPageUrl(target.pageId, {
    tableName: target.tableName,
    fieldName: target.filterField,
    value: target.filterValue
  });
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  await writeTextEvidence(bankEvidencePath(`${target.fileStem}-page-text.txt`), compactPageText(text));
  const buttons = (await visibleButtonNames(page))
    .map(asciiSafe)
    .filter((button) => /Entry|Posten|Apply|Ausgleich|Navigate|Find|Show|Open|Edit|New|Delete|Post/i.test(button))
    .slice(0, 80);

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    url: sanitizeUrl(page.url()),
    title: asciiSafe(await page.title()),
    evidenceFile: `${target.fileStem}-page-text.txt`,
    relevantButtons: buttons,
    analysis: analyzeLedgerText(text, target)
  };
}

function renderMarkdown(result: Record<string, any>) {
  return [
    '# BANK-005 Zielzeilen-/Open-Entry-Drilldown',
    '',
    '| Feld | Wert |',
    '|---|---|',
    `| Umgebung | ${result.environment} |`,
    `| Company | ${result.company} |`,
    '| Modus | labor, read-only, no-post, no-preview, no-setup-change |',
    `| Ziel-Dokument | \`${targetDocumentNo}\` |`,
    `| Ziel-Partei | ${targetParty} |`,
    `| Zielbetrag | ${targetAmount} |`,
    `| Posting jetzt freigegeben | ${result.postingReadiness.paymentPostingAllowedNow ? 'ja' : 'nein'} |`,
    '',
    '## Ergebnis',
    '',
    result.postingReadiness.openEntryRelationProven
      ? 'Die Zielzeile und mindestens ein passender offener Ledger-Bezug sind read-only sichtbar. Trotzdem wurde nicht gebucht; ein eigener BANK-006-Postingfall muesste den Trace noch final festlegen.'
      : 'Die Zielzeile ist als Payment-Reconciliation-Kandidat sichtbar, aber die direkte Open-Entry-/Ledger-Relation ist nicht eindeutig genug bewiesen. Deshalb bleibt `Post Payments Only` gesperrt.',
    '',
    '## Warum das wichtig ist',
    '',
    'Der Postingdialog allein ist kein fachlicher Nachweis. Vor einer Zahlungsbuchung muss klar sein, welche Abstimmungszeile welchen offenen Debitor-/Kreditorposten schliesst und welche Bank-/Sachposten danach erwartet werden.',
    '',
    '## Grenzen',
    '',
    '- Keine Buchung.',
    '- Keine Buchungsvorschau.',
    '- Kein Payment Posting.',
    '- Kein Setup Change.',
    '- Kein Company Switch.',
    '- Kein deutscher Finalnachweis.',
    '',
    '## German-Final-Rebuild',
    '',
    result.rebuildInstruction,
    '',
    '## Naechster Schritt',
    '',
    result.nextStep,
    ''
  ].join('\n');
}

test('BANK-005 prueft Payment-Reconciliation-Zielzeile und Ledger-Bezug read-only', async ({ page }) => {
  await page.goto(buildPageUrl(1290), { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(3000);

  const journalUrl = page.url();
  expect(decodeURIComponent(journalUrl)).toMatch(new RegExp(expectedInstance));
  expect(new URL(journalUrl).searchParams.get('company')).toBe(expectedCompany);

  const journalText = await pageText(page);
  await writeTextEvidence(bankEvidencePath('010-payment-reconciliation-target-line-page-text.txt'), compactPageText(journalText));
  const journalAnalysis = analyzePaymentReconciliation(journalText);

  const traceTargets: TraceTarget[] = [
    {
      id: 'customer-ledger-document-108204',
      pageId: 25,
      tableName: 'Cust. Ledger Entry',
      filterField: 'Document No.',
      filterValue: targetDocumentNo,
      fileStem: '020-customer-ledger-document-108204',
      labelPattern: /Customer Ledger Entries|Cust\. Ledger Entries|Debitorenposten|Remaining Amount|Restbetrag/i
    },
    {
      id: 'vendor-ledger-document-108204',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: targetDocumentNo,
      fileStem: '030-vendor-ledger-document-108204',
      labelPattern: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten|Remaining Amount|Restbetrag/i
    },
    {
      id: 'bank-account-ledger-document-108204',
      pageId: 372,
      tableName: 'Bank Account Ledger Entry',
      filterField: 'Document No.',
      filterValue: targetDocumentNo,
      fileStem: '040-bank-account-ledger-document-108204',
      labelPattern: /Bank Account Ledger Entries|Bankkonto Posten|Bankposten|Bank Account Ledger/i
    }
  ];

  const traces = [];
  for (const target of traceTargets) {
    traces.push(await openReadonlyPage(page, target));
  }

  const ledgerRelationCandidates = traces.filter((trace) => trace.analysis.safeRelationCandidate);
  const openEntryRelationProven = ledgerRelationCandidates.some(
    (trace) => trace.id !== 'bank-account-ledger-document-108204'
  );
  const targetLineVisible =
    journalAnalysis.pageVisible &&
    journalAnalysis.targetDocumentVisible &&
    journalAnalysis.targetPartyVisible &&
    journalAnalysis.targetAmountVisible;
  const paymentPostingAllowedNow = false;
  const blockedBy = [
    ...(!targetLineVisible ? ['target-payment-reconciliation-line-not-fully-visible'] : []),
    ...(!openEntryRelationProven ? ['open-entry-relation-not-proven-by-direct-ledger-filter'] : [])
  ];

  const result = {
    schemaVersion: 1,
    purpose: 'payment-reconciliation-target-line-open-entry-drilldown',
    caseId,
    testId: 'BANK-005',
    source: 'playwright-ui-readonly',
    resultStatus: targetLineVisible ? 'observed' : 'blocked',
    selectedTaskClass: 'wizard_work',
    selectedModelClass: 'gpt-4-medium',
    environment: expectedInstance,
    company: expectedCompany,
    sourceCompany: expectedCompany,
    page: {
      paymentReconciliationJournalPageId: 1290,
      journalUrl: sanitizeUrl(journalUrl),
      title: asciiSafe(await page.title())
    },
    targetCandidate: {
      documentNo: targetDocumentNo,
      relatedInvoiceNo: targetRelatedInvoiceNo,
      party: targetParty,
      amount: targetAmount,
      journalAnalysis,
      evidenceFile: '010-payment-reconciliation-target-line-page-text.txt'
    },
    ledgerTraces: traces,
    postingReadiness: {
      targetLineVisible,
      openEntryRelationProven,
      ledgerRelationCandidateIds: ledgerRelationCandidates.map((trace) => trace.id),
      paymentPostingAllowedNow,
      reason: paymentPostingAllowedNow
        ? 'Not used in this run; posting would require a separate BANK-006 trace case.'
        : 'Posting remains locked because BANK-005 is read-only and direct ledger relation is not sufficient for one-click payment posting approval.'
    },
    proved: [
      ...(targetLineVisible
        ? ['Payment Reconciliation Journal shows the target candidate with document 108204, First Up Consultants and amount -2.151,46.']
        : ['Payment Reconciliation Journal opened, but the target candidate was not fully visible in compact text.']),
      'Customer, Vendor and Bank Account Ledger Entries were opened read-only with Document No. 108204 filters.',
      'No posting, preview, setup change, draft or company switch was performed.'
    ],
    notProved: [
      'No payment was posted.',
      'No bank reconciliation was posted.',
      'No Preview Posting was opened.',
      'No final relation to a single open ledger entry is claimed unless ledgerRelationCandidateIds contains a customer/vendor trace.',
      'No German bank/compliance final proof.'
    ],
    flags: {
      readOnly: true,
      noPost: true,
      noPreviewPosting: true,
      noPaymentPosting: true,
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
      'In der deutschen Zielcompany vor einer Zahlungsbuchung dieselbe Zielzeile und den offenen Postenbezug read-only nachweisen: Payment Reconciliation Journal, Debitor-/Kreditorposten, Bankposten-Erwartung, danach separater Posting-Trace.',
    targetGermanCompanyImpact:
      'Deutsche Zielcompany braucht eine eindeutige Payment-Reconciliation-Zeile mit offenem Postenbezug, bevor Payment Posting oder Bankabstimmung als finaler Prozess gezeigt werden.',
    changedFiles: [
      'playwright/projects/fibu-book5/evidence/bank-005/BANK-005-result.json',
      'playwright/projects/fibu-book5/evidence/bank-005/BANK-005-TARGET-LINE-OPEN-ENTRY-DRILLDOWN.md'
    ],
    evidenceRefs: ['playwright/projects/fibu-book5/evidence/bank-005/'],
    blockedBy,
    safeToFinalizeState: false,
    requiresReview: blockedBy.length > 0,
    nextStep: openEntryRelationProven
      ? 'BANK-006: kontrollierte Payment-Posting-Entscheidung mit explizitem Traceplan; nicht automatisch buchen.'
      : 'BANK-006: nicht Post Payments Only bestaetigen; stattdessen Manual-Application-read-only oder Single-Line Payment Journal Posting Case als sauberere Route vorbereiten.'
  };

  await writeJsonEvidence(bankEvidencePath('BANK-005-result.json'), result);
  await writeTextEvidence(bankEvidencePath('BANK-005-TARGET-LINE-OPEN-ENTRY-DRILLDOWN.md'), renderMarkdown(result));
  await writeTextEvidence(
    bankEvidencePath('README.md'),
    [
      '# BANK-005 Evidence Index',
      '',
      'Status: labor, read-only Zielzeilen-/Open-Entry-Drilldown, no-post, no-preview, no-setup-change, not-final.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-payment-reconciliation-target-line-page-text.txt` | kompakter UI-Seitentext | Payment-Reconciliation-Zielkandidat `108204` soweit sichtbar | keine Zahlung | labor, read-only |',
      '| `020-customer-ledger-document-108204-page-text.txt` | kompakter UI-Seitentext | Customer-Ledger-Filter auf `108204` | keinen gebuchten neuen Bankposten | labor, read-only |',
      '| `030-vendor-ledger-document-108204-page-text.txt` | kompakter UI-Seitentext | Vendor-Ledger-Filter auf `108204` | keinen Payment-Post | labor, read-only |',
      '| `040-bank-account-ledger-document-108204-page-text.txt` | kompakter UI-Seitentext | Bank-Ledger-Filter auf `108204` | keine neue Bankabstimmung | labor, read-only |',
      '| `BANK-005-result.json` | JSON-Ergebnis | strukturierte Zielzeilen-/Ledger-Auswertung und Posting-Gate-Entscheidung | keinen deutschen Finalnachweis | labor |',
      '| `BANK-005-TARGET-LINE-OPEN-ENTRY-DRILLDOWN.md` | Lernzusammenfassung | warum der Postingdialog ohne Open-Entry-Bezug nicht reicht | keine Zahlung | labor |',
      ''
    ].join('\n')
  );

  expect(result.flags.noPost).toBe(true);
  expect(result.flags.noPreviewPosting).toBe(true);
  expect(result.flags.noSetupChange).toBe(true);
  expect(result.flags.noCompanySwitch).toBe(true);
  expect(targetLineVisible).toBe(true);
});
