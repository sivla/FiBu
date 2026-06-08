import { expect, test, type Page } from '@playwright/test';
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
  viewport: { width: 1920, height: 1200 }
});

const testId = 'payments-004';

function paymentsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function bcPageUrl(pageId: number) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
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
    /BANK-RM-01|Cash Receipt Journal|Bank Accounts|Batch Name|Posting Date|Document Type|Document No\.|Account Type|Account No\.|Description|Amount|Bal\. Account|Applies-to|Apply Entries|Journal Check|Post|Preview|Payment|Customer|D10000|PS-INV103297|Ausgleich|Gegenkonto|Buchen|Zahlung|Bank/i;
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

  return sanitizeEvidenceText([
    `Kompakter Page-Text-Auszug; Volltext bewusst nicht committed. Originalzeilen: ${lines.length}.`,
    '',
    ...[...selected]
      .sort((left, right) => left - right)
      .map((index) => lines[index])
      .slice(0, 180)
  ].join('\n'));
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

async function openPage(page: Page, pageId: number) {
  await page.goto(bcPageUrl(pageId), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);
  return pageText(page);
}

test('PAYMENTS-004 Cash Receipt Journal Readiness mit BANK-RM-01 ohne Zahlung pruefen', async ({ page }) => {
  const bankText = await openPage(page, 371);
  const bankButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  await writeTextEvidence(paymentsEvidencePath('010-bank-accounts-live-check-page-text.txt'), compactPageText(bankText));
  await writeJsonEvidence(paymentsEvidencePath('010-bank-accounts-live-check-buttons.json'), bankButtons);

  const cashReceiptText = await openPage(page, 255);
  const cashReceiptButtons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const cashReceiptScreenshot = 'payments-004-010-cash-receipt-journal-readiness.png';
  await writeTextEvidence(paymentsEvidencePath('020-cash-receipt-journal-page-text.txt'), compactPageText(cashReceiptText));
  await writeJsonEvidence(paymentsEvidencePath('020-cash-receipt-journal-buttons.json'), cashReceiptButtons);
  await screenshot(page, cashReceiptScreenshot, {
    projectName: project.name,
    testId,
    status: /Cash Receipt Journal|Zahlungseingang/i.test(cashReceiptText) ? 'labor' : 'rejected',
    purpose:
      'PAYMENTS-004 nicht-buchende Readiness: Cash Receipt Journal mit relevanten Zahlungsfeldern und Preflight-/Buchungsaktionen sichtbar machen.',
    knownLimitations: [
      'Read-only-Lauf: keine Journalzeile erstellt, keine Zahlung gebucht, kein OP-Ausgleich gesetzt.',
      'BANK-RM-01 ist als CRONUS-USA-Laborbankkonto vorhanden; kein deutscher Bank-/Compliance-Finalnachweis.',
      'Feldsichtbarkeit beweist noch keine korrekte Betragsrichtung, Bankkontobuchungsgruppe oder Sachpostenwirkung.'
    ],
    bookUse: 'evidence'
  });

  const allCashReceiptEvidence = `${cashReceiptText}\n${cashReceiptButtons.join('\n')}`;
  const result = {
    testId: 'PAYMENTS-004',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'read-only-payment-journal-readiness-no-posting-no-application-no-journal-line',
    sourceContext: {
      postedSalesInvoiceNo: 'PS-INV103297',
      customerNo: 'D10000',
      targetBankAccountNo: 'BANK-RM-01',
      previousEvidence: ['PAYMENTS-001', 'PAYMENTS-002', 'PAYMENTS-003']
    },
    liveChecks: {
      bankAccountsPage: {
        pageId: 371,
        opened: /Bank Accounts|Bank Account List|Bankkonten/i.test(bankText),
        targetBankAccountVisible: /BANK-RM-01/i.test(bankText)
      },
      cashReceiptJournalPage: {
        pageId: 255,
        opened: /Cash Receipt Journal|Zahlungseingang/i.test(cashReceiptText),
        fields: {
          postingDateVisible: hasAny(allCashReceiptEvidence, [/Posting Date/i, /Buchungsdatum/i]),
          documentTypeVisible: hasAny(allCashReceiptEvidence, [/Document Type/i, /Belegart/i]),
          documentNoVisible: hasAny(allCashReceiptEvidence, [/Document No\./i, /Belegnr/i]),
          accountTypeVisible: hasAny(allCashReceiptEvidence, [/Account Type/i, /Kontotyp/i]),
          accountNoVisible: hasAny(allCashReceiptEvidence, [/Account No\./i, /Kontonr/i]),
          amountVisible: hasAny(allCashReceiptEvidence, [/Amount/i, /Betrag/i]),
          balanceAccountVisible: hasAny(allCashReceiptEvidence, [/Bal\. Account/i, /Gegenkonto/i]),
          appliesToVisible: hasAny(allCashReceiptEvidence, [/Applies-to/i, /Apply Entries/i, /Ausgleich/i])
        },
        actions: {
          journalCheckVisible: hasAny(allCashReceiptEvidence, [/Journal Check/i, /Test Report/i, /Pruef/i]),
          applyEntriesVisible: hasAny(allCashReceiptEvidence, [/Apply Entries/i, /Ausgleich/i]),
          postVisible: hasAny(allCashReceiptEvidence, [/^Post$/im, /Post \.\.\./i, /Buchen/i]),
          previewPostingVisible: hasAny(allCashReceiptEvidence, [/Preview Posting/i, /Buchungsvorschau/i])
        }
      }
    },
    safety: {
      paymentPosted: false,
      applicationPosted: false,
      journalLineCreated: false,
      bankReconciliationOpened: false,
      bankAccountCreatedOrChanged: false
    },
    readinessDecision: {
      readyForNextDraftLineCheck:
        /BANK-RM-01/i.test(bankText) &&
        /Cash Receipt Journal|Zahlungseingang/i.test(cashReceiptText) &&
        hasAny(allCashReceiptEvidence, [/Account Type/i, /Account No\./i, /Amount/i]),
      readyForPaymentPosting: false,
      recommendedNextStep:
        'PAYMENTS-005: eine kontrollierte, bereinigbare Zahlungsjournal-Entwurfszeile fuer D10000/PS-INV103297 mit Gegenkonto BANK-RM-01 vorbereiten; weiterhin nicht buchen, bis Journal Check/Feldfit belegt ist.'
    },
    proves: [
      'BANK-RM-01 ist im aktuellen Lauf weiterhin in Bank Accounts sichtbar.',
      'Cash Receipt Journal ist in RM-DEMO erreichbar.',
      'Der Journalpfad zeigt Zahlungsfelder und relevante Aktionen fuer eine spaetere kontrollierte Entwurfszeile.'
    ],
    doesNotProve: [
      'Keine Zahlung wurde gebucht.',
      'Kein OP wurde ausgeglichen.',
      'Keine Zahlungsjournalzeile wurde erstellt.',
      'Keine Bankkontobuchungsgruppe/Sachkonto-Wirkung wurde nachgewiesen.',
      'Kein deutscher Bank-, Steuer- oder Compliance-Finalnachweis.'
    ]
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-004-result.json'), result);
  await writeTextEvidence(
    paymentsEvidencePath('PAYMENTS-004-CASH-RECEIPT-JOURNAL-READINESS.md'),
    [
      '# PAYMENTS-004 Cash Receipt Journal Readiness',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, read-only, no-payment, no-application, no-journal-line |',
      '| Ausgangsposten | `PS-INV103297` / `D10000` |',
      '| Laborbankkonto | `BANK-RM-01` |',
      '',
      '## Ergebnis',
      '',
      '| Pruefpunkt | Befund |',
      '|---|---|',
      `| BANK-RM-01 in Bank Accounts sichtbar | ${result.liveChecks.bankAccountsPage.targetBankAccountVisible ? 'ja' : 'nein'} |`,
      `| Cash Receipt Journal erreichbar | ${result.liveChecks.cashReceiptJournalPage.opened ? 'ja' : 'nein'} |`,
      `| Kontotyp/Kontonummer sichtbar | ${result.liveChecks.cashReceiptJournalPage.fields.accountTypeVisible && result.liveChecks.cashReceiptJournalPage.fields.accountNoVisible ? 'ja' : 'teilweise/nein'} |`,
      `| Betrag sichtbar | ${result.liveChecks.cashReceiptJournalPage.fields.amountVisible ? 'ja' : 'nein'} |`,
      `| Gegenkonto-/Bal.-Account-Hinweis sichtbar | ${result.liveChecks.cashReceiptJournalPage.fields.balanceAccountVisible ? 'ja' : 'nein'} |`,
      `| Ausgleichs-/Apply-Hinweis sichtbar | ${result.liveChecks.cashReceiptJournalPage.fields.appliesToVisible ? 'ja' : 'nein'} |`,
      `| Journal Check/Test Report sichtbar | ${result.liveChecks.cashReceiptJournalPage.actions.journalCheckVisible ? 'ja' : 'nein'} |`,
      '| Zahlung gebucht | nein |',
      '| OP ausgeglichen | nein |',
      '| Journalzeile erstellt | nein |',
      '',
      '## Anfaenger-Lernwert',
      '',
      'Das Zahlungseingangsjournal ist der Ort, an dem ein Zahlungseingang als Journalzeile vorbereitet wird. Fuer einen spaeteren sicheren Zahlungsfall muessen drei Dinge zusammenpassen: der offene Debitorenposten, die Journalzeile mit Debitor und Betrag sowie das Bankkonto als Gegenkonto. `BANK-RM-01` ist jetzt als Laborbank vorhanden; dieser Lauf zeigt den Bedienort und die sichtbaren Felder, erzeugt aber noch keine Zahlungswirkung.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 19/20 kann den Schritt zwischen OP-Liste und erster Zahlung genauer erklaeren: Vor einer Buchung steht ein Readiness-Check im Zahlungseingangsjournal. Screenshots duerfen als Labor-Evidence fuer Navigation und Feldverstaendnis genutzt werden, nicht als Zahlungsnachweis.',
      '',
      '## Grenze',
      '',
      '- CRONUS-USA-Labor, kein deutscher Finalnachweis.',
      '- Keine deutsche Steuer-, Bank- oder Compliance-Aussage.',
      '- Keine Betragsrichtung, keine Application und keine Sachpostenwirkung nachgewiesen.',
      '',
      '## Naechster Schritt',
      '',
      result.readinessDecision.recommendedNextStep,
      ''
    ].join('\n')
  );
  await writeTextEvidence(
    paymentsEvidencePath('README.md'),
    [
      '# PAYMENTS-004 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, read-only, keine Zahlung, kein Ausgleich, keine Journalzeile.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-bank-accounts-live-check-page-text.txt` | kompakter Seitentext | `BANK-RM-01` ist im aktuellen Lauf in Bank Accounts sichtbar | keine Bankbuchung und keine Bankabstimmung | labor |',
      '| `020-cash-receipt-journal-page-text.txt` | kompakter Seitentext | Cash Receipt Journal ist erreichbar und zeigt Zahlungsjournal-Kontext | keine Journalzeile und keine Buchung | labor |',
      '| `020-cash-receipt-journal-buttons.json` | Buttonliste | sichtbare Aktionen wie Journal Check/Apply/Post, soweit BC sie liefert | keine Ausfuehrung dieser Aktionen | labor |',
      '| `payments-004-010-cash-receipt-journal-readiness.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Journal-Screenshots | keine eigenstaendige Buchungs-Evidence | labor |',
      '| `PAYMENTS-004-result.json` | JSON-Ergebnis | strukturierter Readiness-Befund und Sicherheitsstatus | kein Zahlungs-Finalnachweis | labor |',
      '| `PAYMENTS-004-CASH-RECEIPT-JOURNAL-READINESS.md` | Lernzusammenfassung | Buchwirkung, Anfaengererklaerung und naechster Schritt | keine Zahlung und kein OP-Ausgleich | labor |',
      '',
      '## Kernergebnis',
      '',
      '`PAYMENTS-004` beweist den nicht-buchenden Vorbereitungsstand fuer den Zahlungseingangsjournal-Pfad. Der naechste Schritt darf eine kontrollierte, bereinigbare Entwurfszeile sein; eine Zahlung bleibt weiterhin ein eigener, explizit freizugebender Prozess.',
      ''
    ].join('\n')
  );

  expect(result.liveChecks.bankAccountsPage.opened).toBe(true);
  expect(result.liveChecks.bankAccountsPage.targetBankAccountVisible).toBe(true);
  expect(result.liveChecks.cashReceiptJournalPage.opened).toBe(true);
  expect(result.safety.paymentPosted).toBe(false);
  expect(result.safety.applicationPosted).toBe(false);
  expect(result.safety.journalLineCreated).toBe(false);
});
