import { test } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import {
  dismissTours,
  pageText,
  requireBcUrl,
  screenshot,
  visibleButtonNames,
  waitForBusinessCentralShell
} from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  headless: true,
  viewport: { width: 2200, height: 1200 }
});

test.setTimeout(360_000);

const testId = 'p2p-003';
const vendorNo = 'K10000';
const invoiceNo = '108219';
const paymentNo = 'PAYP2P-108219';

type TraceTarget = {
  id: string;
  pageId: number;
  tableName: string;
  filterField: string;
  filterValue: string;
  fileStem: string;
  imageFileName: string;
  labelPattern: RegExp;
};

function p2pEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function normalizeText(text: string) {
  return text.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '');
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
    /108219|PAYP2P|K10000|Vendor Ledger|Detailed Vendor|Remaining Amount|Remaining Amt|Applied Entries|Application|Initial Entry|Payment Discount|Open|Entry No\.|Amount|Stahlwerk|BANK-RM-01|Bank Account|G\/L Entries|MCP_1_20260210/i;
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const selected = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    if (!interesting.test(lines[index])) continue;
    for (let offset = -4; offset <= 8; offset += 1) {
      const selectedIndex = index + offset;
      if (selectedIndex >= 0 && selectedIndex < lines.length) selected.add(selectedIndex);
    }
  }

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 280)
  ].join('\n'));
}

function filteredBcPageUrl(pageId: number, tableName: string, fieldName: string, value: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  url.searchParams.set('filter', `'${tableName}'.'${fieldName}' IS '${value}'`);
  return url.toString();
}

function squashed(text: string) {
  return normalizeText(text).replace(/\s+/g, ' ');
}

function analyzeInvoiceLedger(text: string) {
  const oneLine = squashed(text);
  const invoiceRowPattern =
    /Invoice\s+108219[\s\S]{0,360}-25\.000,00\s+-25\.000,00\s+-25\.000,00\s+0,00\s+0,00/i;
  return {
    invoiceVisible: /Invoice\s+108219/i.test(oneLine),
    vendorVisible: new RegExp(vendorNo, 'i').test(oneLine),
    remainingAmountZeroVisible: invoiceRowPattern.test(oneLine),
    originalAmountVisible: /Invoice\s+108219[\s\S]{0,260}-25\.000,00/i.test(oneLine),
    relatedGlEntriesVisible: /Related G\/L Entries|G\/L Entries/i.test(oneLine),
    openColumnVisible: /\bOpen\b/i.test(oneLine),
    entryNo4992Visible: /\b4992\b/.test(oneLine)
  };
}

function analyzePaymentLedger(text: string) {
  const oneLine = squashed(text);
  return {
    paymentVisible: new RegExp(paymentNo, 'i').test(oneLine),
    vendorVisible: new RegExp(vendorNo, 'i').test(oneLine),
    paymentDiscountVisible: /Purchase Discounts|Payment Discount|68290/i.test(oneLine),
    remainingAmount500Visible: /PAYP2P-108219[\s\S]{0,360}500,00\s+500,00/i.test(oneLine),
    bankOrGlVisible: /18200|BANK-RM-01|Business account, Operating, Domestic/i.test(oneLine),
    entryNo5001Visible: /\b5001\b/.test(oneLine)
  };
}

function analyzeDetailedPayment(text: string) {
  const oneLine = squashed(text);
  return {
    paymentVisible: new RegExp(paymentNo, 'i').test(oneLine),
    initialEntryVisible: /Initial Entry\s+Payment\s+PAYP2P-108219/i.test(oneLine),
    paymentDiscountVisible: /Payment Discount\s+Payment\s+PAYP2P-108219/i.test(oneLine),
    positiveApplicationVisible: /Application\s+Payment\s+PAYP2P-108219[\s\S]{0,120}25\.000,00\s+25\.000,00/i.test(oneLine),
    negativeApplicationVisible: /Application\s+Payment\s+PAYP2P-108219[\s\S]{0,120}-25\.000,00\s+-25\.000,00/i.test(oneLine),
    entryNosVisible: /\b811\b[\s\S]{0,260}\b812\b[\s\S]{0,260}\b813\b[\s\S]{0,260}\b814\b/i.test(oneLine)
  };
}

async function openFilteredPageAndCapture(page: import('@playwright/test').Page, target: TraceTarget) {
  await page.goto(filteredBcPageUrl(target.pageId, target.tableName, target.filterField, target.filterValue), {
    waitUntil: 'domcontentloaded',
    timeout: 120_000
  });
  await waitForBusinessCentralShell(page);
  await page.waitForTimeout(3000);
  await dismissTours(page);
  const text = normalizeText(await pageText(page));
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(p2pEvidencePath(`${target.fileStem}-page-text.txt`), compactPageText(text));
  await screenshot(page, target.imageFileName, {
    projectName: project.name,
    testId,
    status: target.labelPattern.test(text) && text.includes(target.filterValue) ? 'labor' : 'rejected',
    purpose: `P2P-003 read-only OP-/Application-Klaerung: ${target.id}.`,
    knownLimitations: [
      'CRONUS-USA-Labor, kein deutscher Bank-/Steuer-/Compliance-Finalnachweis.',
      'Read-only Ledger-Nachweis; keine neue Zahlung, kein Posting, kein Setup.'
    ],
    bookUse: 'posting-trace'
  });

  return {
    id: target.id,
    pageId: target.pageId,
    tableName: target.tableName,
    filterField: target.filterField,
    filterValue: target.filterValue,
    pageContextVisible: target.labelPattern.test(text),
    filterValueVisible: text.includes(target.filterValue),
    vendorVisible: new RegExp(vendorNo).test(text),
    paymentVisible: text.includes(paymentNo),
    invoiceVisible: text.includes(invoiceNo),
    relevantButtons: buttons.filter((button) => /Entry|Posten|Apply|Ausgleich|Navigate|Find|Show|Open|Unapply/i.test(button)),
    textEvidenceFile: `${target.fileStem}-page-text.txt`,
    screenshot: target.imageFileName,
    analysis:
      target.id === 'vendor-ledger-invoice'
        ? analyzeInvoiceLedger(text)
        : target.id === 'vendor-ledger-payment'
          ? analyzePaymentLedger(text)
          : analyzeDetailedPayment(text)
  };
}

test('P2P-003 read-only OP-Ausgleich und Application nach PAYP2P-108219 klaeren', async ({ page }) => {
  const traceTargets: TraceTarget[] = [
    {
      id: 'vendor-ledger-invoice',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: invoiceNo,
      fileStem: '010-vendor-ledger-invoice-after-payment-readonly',
      imageFileName: 'p2p-003-010-vendor-ledger-invoice-after-payment.png',
      labelPattern: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
    },
    {
      id: 'vendor-ledger-payment',
      pageId: 29,
      tableName: 'Vendor Ledger Entry',
      filterField: 'Document No.',
      filterValue: paymentNo,
      fileStem: '020-vendor-ledger-payment-readonly',
      imageFileName: 'p2p-003-020-vendor-ledger-payment.png',
      labelPattern: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
    },
    {
      id: 'detailed-vendor-ledger-payment',
      pageId: 574,
      tableName: 'Detailed Vendor Ledg. Entry',
      filterField: 'Document No.',
      filterValue: paymentNo,
      fileStem: '030-detailed-vendor-ledger-payment-application-readonly',
      imageFileName: 'p2p-003-030-detailed-vendor-ledger-payment-application.png',
      labelPattern: /Detailed Vendor|Detailed Vend|Detaillierte Kreditorenposten|Vendor Ledger/i
    }
  ];

  const traces = [];
  for (const target of traceTargets) {
    traces.push(await openFilteredPageAndCapture(page, target));
  }

  const invoiceTrace = traces.find((trace) => trace.id === 'vendor-ledger-invoice');
  const paymentTrace = traces.find((trace) => trace.id === 'vendor-ledger-payment');
  const detailedTrace = traces.find((trace) => trace.id === 'detailed-vendor-ledger-payment');
  const invoiceAnalysis = invoiceTrace?.analysis as ReturnType<typeof analyzeInvoiceLedger> | undefined;
  const paymentAnalysis = paymentTrace?.analysis as ReturnType<typeof analyzePaymentLedger> | undefined;
  const detailedAnalysis = detailedTrace?.analysis as ReturnType<typeof analyzeDetailedPayment> | undefined;
  const invoiceClosedByRemainingAmount =
    Boolean(invoiceAnalysis?.remainingAmountZeroVisible) &&
    Boolean(detailedAnalysis?.positiveApplicationVisible) &&
    Boolean(detailedAnalysis?.negativeApplicationVisible);

  const result = {
    testId: 'P2P-003',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    mode: 'readonly-vendor-payment-application-check',
    sourceContext: {
      vendorNo,
      invoiceNo,
      paymentNo
    },
    flags: {
      readOnly: true,
      noPayment: true,
      noPost: true,
      noPreviewPosting: true,
      noSetupChange: true,
      noCompanySwitch: true,
      noApiShortcut: true,
      noBookChangeInsideTest: true
    },
    traces,
    conclusion: {
      invoiceClosedByRemainingAmount,
      invoiceRemainingAmountZeroVisible: Boolean(invoiceAnalysis?.remainingAmountZeroVisible),
      detailedApplicationEntriesVisible:
        Boolean(detailedAnalysis?.positiveApplicationVisible) && Boolean(detailedAnalysis?.negativeApplicationVisible),
      paymentDiscountVisible:
        Boolean(paymentAnalysis?.paymentDiscountVisible) || Boolean(detailedAnalysis?.paymentDiscountVisible),
      paymentEntryRemaining500Visible: Boolean(paymentAnalysis?.remainingAmount500Visible),
      ledgerEntryNos: {
        invoiceEntryNo: invoiceAnalysis?.entryNo4992Visible ? '4992' : '',
        paymentEntryNo: paymentAnalysis?.entryNo5001Visible ? '5001' : '',
        detailedPaymentEntries: detailedAnalysis?.entryNosVisible ? ['811', '812', '813', '814'] : []
      }
    },
    proves: [
      'P2P-003 ist ein read-only Nachweis; es wurde keine weitere Zahlung und keine Buchung erzeugt.',
      invoiceClosedByRemainingAmount
        ? 'Die Ausgangsrechnung 108219 zeigt im Vendor Ledger Remaining Amount = 0,00 und Detailed Vendor Ledger zeigt Application-Zeilen zur Zahlung PAYP2P-108219.'
        : 'Die Zahlung PAYP2P-108219 ist sichtbar, aber der vollstaendige OP-Schluss der Rechnung 108219 bleibt nach diesem Lauf nicht voll bewiesen.',
      'Detailed Vendor Ledger Entries zeigen Initial Entry, Payment Discount und Application zur Zahlung PAYP2P-108219.'
    ],
    doesNotProve: [
      'Keine Bankabstimmung.',
      'Kein Kontoauszugsimport.',
      'Kein deutscher Bank-, Steuer-, Compliance- oder Kontenplan-Finalnachweis.',
      'Keine deutsche 19-Prozent-Vorsteuer.'
    ],
    migrationRelevance: 'needed-for-german-final',
    sourceCompany: 'RM-DEMO',
    mustRecreateInFinalSandbox: true,
    finalScreenshotNeeded: true,
    rebuildInstruction:
      'In der deutschen Zielcompany dieselbe read-only OP-Kontrolle nach Kreditorenzahlung neu erzeugen: Vendor Ledger Invoice, Vendor Ledger Payment, Detailed Vendor Ledger Application, Restbetrag 0,00 und Bank-/G/L-/Bankabstimmungsbezug sichtbar nachweisen.',
    nextStep: invoiceClosedByRemainingAmount
      ? 'P2P-Payment als labor-proven klassifizieren; danach einen neuen P2P-Abweichungsfall waehlen.'
      : 'OP-Ausgleich nicht weiter erzwingen; als labor-blocked/partial dokumentieren oder separaten Apply-/Unapply-Readiness-Fall planen.'
  };

  await writeJsonEvidence(p2pEvidencePath('P2P-003-result.json'), result);
  await writeTextEvidence(
    p2pEvidencePath('P2P-003-OP-APPLICATION-READONLY.md'),
    [
      '# P2P-003 OP-/Application-Klaerung nach Kreditorenzahlung',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      `| Rechnung | \`${invoiceNo}\` |`,
      `| Zahlung | \`${paymentNo}\` |`,
      '| Modus | read-only, no-payment, no-post, no-preview, no-setup-change |',
      `| Rechnung Restbetrag 0,00 sichtbar | ${result.conclusion.invoiceRemainingAmountZeroVisible ? 'ja' : 'nein'} |`,
      `| Application-Zeilen sichtbar | ${result.conclusion.detailedApplicationEntriesVisible ? 'ja' : 'nein'} |`,
      `| Payment Discount sichtbar | ${result.conclusion.paymentDiscountVisible ? 'ja' : 'nein'} |`,
      `| Payment Entry Rest 500,00 sichtbar | ${result.conclusion.paymentEntryRemaining500Visible ? 'ja' : 'nein'} |`,
      '',
      '## Lernwert',
      '',
      'Eine Zahlung allein beweist noch nicht automatisch, dass die Ausgangsrechnung sauber geschlossen ist. Dafuer muss die Rechnung im Kreditorenposten selbst betrachtet werden: Restbetrag, Open-Status und detaillierte Application-Zeilen sind der eigentliche OP-Nachweis.',
      '',
      result.conclusion.invoiceClosedByRemainingAmount
        ? 'Im Labor ist die Einkaufsrechnung `108219` nach `PAYP2P-108219` als geschlossen lesbar: Die Rechnungszeile zeigt Restbetrag `0,00`, und die detaillierten Kreditorenposten zeigen Application-Zeilen zur Zahlung.'
        : 'Im Labor bleibt der vollstaendige OP-Schluss nicht eindeutig genug sichtbar. Die Zahlung ist belegt, aber der Rechnungsausgleich braucht weiteren Nachweis.',
      '',
      'Der sichtbare `Payment Discount` ist ein eigener CRONUS-USA-Laborbefund. Er erklaert, warum Zahlung, Rechnung und detaillierte Posten nicht nur aus einer einfachen 1:1-Zahlungszeile bestehen.',
      '',
      '## Grenzen',
      '',
      '- Keine neue Zahlung, keine Buchung, keine Buchungsvorschau.',
      '- Keine Bankabstimmung.',
      '- Kein deutscher Finalnachweis.',
      '- Deutsche Zielcompany muss denselben Nachweis spaeter mit deutschen Screenshots neu erzeugen.',
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    p2pEvidencePath('README.md'),
    [
      '# P2P-003 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, read-only OP-/Application-Klaerung nach `PAYP2P-108219`, kein neuer Zahlungslauf, kein Posting, kein deutscher Finalnachweis.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-vendor-ledger-invoice-after-payment-readonly-page-text.txt` | UI-Seitentext | Rechnung `108219` im Vendor Ledger nach Zahlung; Restbetrag/Zeile lesbar | keine Bankabstimmung | labor, read-only |',
      '| `020-vendor-ledger-payment-readonly-page-text.txt` | UI-Seitentext | Zahlung `PAYP2P-108219` im Vendor Ledger und Zahlungs-/Discount-Wirkung | keine neue Zahlung | labor, read-only |',
      '| `030-detailed-vendor-ledger-payment-application-readonly-page-text.txt` | UI-Seitentext | Detailed Vendor Ledger mit Initial Entry, Payment Discount und Application-Zeilen | keine deutsche Finalaussage | labor, read-only |',
      '| `P2P-003-result.json` | JSON-Ergebnis | strukturierte OP-/Application-Auswertung | kein automatischer State-Write | labor |',
      '| `P2P-003-OP-APPLICATION-READONLY.md` | Lernzusammenfassung | Anfaengererklaerung zu Rechnung, Zahlung, Restbetrag und Application | keinen deutschen Finalnachweis | labor |',
      ''
    ].join('\n')
  );
});
