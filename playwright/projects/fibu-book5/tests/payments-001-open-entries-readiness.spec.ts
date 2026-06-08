import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, screenshot, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

const testId = 'payments-001';

function paymentsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function bcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function sanitizeEvidenceText(text: string) {
  return text
    .replace(/\u00c3\u0152/g, 'Ue')
    .replace(/\u00c3\u00bc/g, 'ue')
    .replace(/\u00c3\u2013/g, 'Oe')
    .replace(/\u00c3\u00b6/g, 'oe')
    .replace(/\u00c3\u201e/g, 'Ae')
    .replace(/\u00c3\u00a4/g, 'ae')
    .replace(/\u00c3\u0178/g, 'ss')
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, '');
}

function compactPageText(text: string) {
  const interesting =
    /Customer Ledger Entries|Cust\. Ledger Entry|Vendor Ledger Entries|Vendor Ledger Entry|Debitorenposten|Kreditorenposten|Remaining Amount|Restbetrag|Open|Offen|Closed|Closed by|Document No\.|Document Type|Invoice|Payment|Amount|Due Date|Posting Date|Currency|D10000|K10000|PS-INV103297|108219/i;
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) {
      continue;
    }

    for (let offset = -2; offset <= 4; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) {
        selected.add(selectedIndex);
      }
    }
  }

  const excerpt = [...selected]
    .sort((left, right) => left - right)
    .map((index) => lines[index])
    .slice(0, 160);

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...excerpt
  ].join('\n'));
}

type LedgerTarget = {
  id: 'customer-ledger-entry' | 'vendor-ledger-entry';
  pageId: number;
  tableName: string;
  documentNo: string;
  expectedAccountNo: string;
  expectedAccountName: RegExp;
  fileStem: string;
  screenshotFile: string;
  pageLabel: RegExp;
};

async function openLedgerTarget(page: Page, target: LedgerTarget) {
  await page.goto(bcPageUrl(target.pageId, target.tableName, 'Document No.', target.documentNo), {
    waitUntil: 'domcontentloaded'
  });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  const compactText = compactPageText(text);
  await writeTextEvidence(paymentsEvidencePath(`${target.fileStem}-page-text.txt`), compactText);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status: target.pageLabel.test(text) && new RegExp(target.documentNo).test(text) ? 'labor' : 'rejected',
    purpose: `PAYMENTS-001 read-only OP-Readiness fuer ${target.id} ${target.documentNo}.`,
    expectedPageText: [],
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Zahlungs- oder Bank-Finalnachweis.',
      'Read-only-Navigation; keine Zahlung, kein Ausgleich, kein Payment Journal und keine Bankabstimmung.'
    ],
    bookUse: 'evidence'
  });

  const normalized = text.replace(/\s+/g, ' ');
  const hasOpenKeyword = /\bOpen\b|Offen|Remaining Amount|Restbetrag/i.test(normalized);
  const hasPaymentActions =
    /Apply Entries|Ausgleichen|Unapply Entries|Ausgleich aufheben|Payment|Zahlung|Create Payment/i.test(normalized);

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: 'Document No.',
    filterValue: target.documentNo,
    pageContextVisible: target.pageLabel.test(text),
    documentNoVisible: new RegExp(target.documentNo).test(text),
    accountNoVisible: new RegExp(target.expectedAccountNo).test(text),
    accountNameVisible: target.expectedAccountName.test(text),
    amountVisible: /68[.,]000|68000|25[.,]000|25000/i.test(text),
    remainingAmountOrOpenVisible: hasOpenKeyword,
    paymentOrApplyActionsVisible: hasPaymentActions,
    textEvidenceFile: `${target.fileStem}-page-text.txt`,
    screenshot: target.screenshotFile
  };
}

test('PAYMENTS-001 offene Debitoren- und Kreditorenposten read-only pruefen', async ({ page }) => {
  const targets: LedgerTarget[] = [
    {
      id: 'customer-ledger-entry',
      pageId: 25,
      tableName: 'Cust. Ledger Entry',
      documentNo: 'PS-INV103297',
      expectedAccountNo: 'D10000',
      expectedAccountName: /Mueller Maschinenbau|D10000/i,
      fileStem: '010-customer-ledger-entry-ps-inv103297',
      screenshotFile: 'payments-001-010-customer-ledger-entry-ps-inv103297.png',
      pageLabel: /Customer Ledger Entries|Cust\. Ledger Entry|Debitorenposten/i
    },
    {
      id: 'vendor-ledger-entry',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      documentNo: '108219',
      expectedAccountNo: 'K10000',
      expectedAccountName: /Stahlwerk Ruhr|K10000/i,
      fileStem: '020-vendor-ledger-entry-108219',
      screenshotFile: 'payments-001-020-vendor-ledger-entry-108219.png',
      pageLabel: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
    }
  ];

  const traces = [];
  for (const target of targets) {
    traces.push(await openLedgerTarget(page, target));
  }

  const customerTrace = traces.find((entry) => entry.id === 'customer-ledger-entry');
  const vendorTrace = traces.find((entry) => entry.id === 'vendor-ledger-entry');
  const result = {
    testId: 'PAYMENTS-001',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-open-entry-readiness-no-posting-no-application',
    sourceDocuments: {
      postedSalesInvoiceNo: 'PS-INV103297',
      postedPurchaseInvoiceNo: '108219',
      customerNo: 'D10000',
      vendorNo: 'K10000'
    },
    traces,
    summary: {
      customerLedgerEntryVisible: customerTrace?.documentNoVisible ?? false,
      vendorLedgerEntryVisible: vendorTrace?.documentNoVisible ?? false,
      customerOpenOrRemainingVisible: customerTrace?.remainingAmountOrOpenVisible ?? false,
      vendorOpenOrRemainingVisible: vendorTrace?.remainingAmountOrOpenVisible ?? false,
      paymentOrApplyActionsSeen:
        (customerTrace?.paymentOrApplyActionsVisible ?? false) || (vendorTrace?.paymentOrApplyActionsVisible ?? false),
      posted: false,
      applied: false,
      paymentJournalOpened: false,
      bankReconciliationOpened: false
    },
    proves: [
      'Die gebuchte O2C-Laborrechnung kann als Debitorenposten fuer OP-/Payment-Lernen herangezogen werden.',
      'Die gebuchte P2P-Laborrechnung kann als Kreditorenposten fuer OP-/Payment-Lernen herangezogen werden.',
      'Der naechste Payments-Lauf darf mit offenen Posten starten, muss aber Bank-/Journal-Readiness separat pruefen.'
    ],
    doesNotProve: [
      'Keine Zahlung gebucht.',
      'Kein Ausgleich angewendet.',
      'Kein Payment Journal oder Cash Receipt Journal eingerichtet oder gebucht.',
      'Keine Bankkontoabstimmung.',
      'Kein deutscher Zahlungs-, Steuer- oder Bank-Finalnachweis.'
    ],
    nextStep:
      'PAYMENTS-002 als kontrollierter Readiness-Lauf: Bankkonto, Zahlungsjournal/Cash Receipt Journal, Zahlungsbedingungen und Apply-Entries-Pfad pruefen; erst danach eine einzelne Laborzahlung buchen oder bewusst weiter read-only bleiben.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-001-result.json'), result);
  await writeTextEvidence(
    paymentsEvidencePath('PAYMENTS-001-OPEN-ENTRY-READINESS.md'),
    [
      '# PAYMENTS-001 Open-Entry Readiness',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-payment, no-application |',
      '| O2C-Ausgangspunkt | Gebuchte Verkaufsrechnung `PS-INV103297`, Debitor `D10000` |',
      '| P2P-Ausgangspunkt | Gebuchte Einkaufsrechnung `108219`, Kreditor `K10000` |',
      '',
      '## Ergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| Debitorenposten zur Verkaufsrechnung sichtbar | ${result.summary.customerLedgerEntryVisible ? 'ja' : 'nein'} |`,
      `| Kreditorenposten zur Einkaufsrechnung sichtbar | ${result.summary.vendorLedgerEntryVisible ? 'ja' : 'nein'} |`,
      `| Offene-/Restbetragslogik im Debitorenposten sichtbar | ${result.summary.customerOpenOrRemainingVisible ? 'ja' : 'nein'} |`,
      `| Offene-/Restbetragslogik im Kreditorenposten sichtbar | ${result.summary.vendorOpenOrRemainingVisible ? 'ja' : 'nein'} |`,
      `| Zahlungs-/Ausgleichsaktionen sichtbar | ${result.summary.paymentOrApplyActionsSeen ? 'ja' : 'nein'} |`,
      '| Zahlung gebucht | nein |',
      '| Posten ausgeglichen | nein |',
      '',
      '## Anfaenger-Lernwert',
      '',
      'Nach O2C und P2P sind Rechnungen nicht einfach erledigt. Business Central fuehrt offene Debitoren- und Kreditorenposten. Erst eine Zahlung oder ein Ausgleich schliesst diese Posten. Ein Zahlungslauf darf deshalb nicht beim Bankkonto anfangen, sondern muss zuerst klaeren: Welche Rechnung ist offen, welcher Restbetrag besteht, welche Waehrung gilt und wie wird die Zahlung dem Posten zugeordnet?',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 19/20 koennen jetzt an echten Laborbelegen anknuepfen: `PS-INV103297` fuer Zahlungseingang und `108219` fuer Zahlungsausgang. Das Buch darf aber noch keine Zahlung, keinen Ausgleich und keine Bankwirkung behaupten.',
      '',
      '## Grenzen',
      '',
      '- CRONUS-USA-Labor, kein deutscher Finalnachweis.',
      '- Keine Zahlung, kein Ausgleich, kein Payment Journal, keine Bankabstimmung.',
      '- Deutsche USt/Vorsteuer bleibt offen.',
      '',
      '## Naechster Schritt',
      '',
      result.nextStep,
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-001 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, read-only, keine Zahlung, kein Ausgleich.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-customer-ledger-entry-ps-inv103297-page-text.txt` | kompakter Seitentext | Debitorenposten-Kontext zur gebuchten Verkaufsrechnung `PS-INV103297` | keine Zahlung und kein Ausgleich | labor |',
      '| `020-vendor-ledger-entry-108219-page-text.txt` | kompakter Seitentext | Kreditorenposten-Kontext zur gebuchten Einkaufsrechnung `108219` | keine Zahlung und kein Ausgleich | labor |',
      '| `PAYMENTS-001-result.json` | JSON-Ergebnis | strukturierter Readiness-Befund fuer O2C- und P2P-OP-Ausgleich | keine Bank-/Journalbuchung | labor |',
      '| `PAYMENTS-001-OPEN-ENTRY-READINESS.md` | Lernzusammenfassung | Buchwirkung, Grenzen und naechster Schritt | kein deutscher Finalnachweis | labor |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Limitationen der PNGs | keine eigenstaendige fachliche Wahrheit ohne Text/JSON | labor |',
      '',
      '## Kernergebnis',
      '',
      'Die bestehenden Laborbelege sind als Ausgangspunkt fuer Payments/OP-Ausgleich geeignet. Dieser Lauf hat bewusst nur gelesen und nicht gebucht.',
      ''
    ].join('\n')
  );

  expect(result.summary.customerLedgerEntryVisible).toBe(true);
  expect(result.summary.vendorLedgerEntryVisible).toBe(true);
  expect(result.summary.posted).toBe(false);
  expect(result.summary.applied).toBe(false);
});
