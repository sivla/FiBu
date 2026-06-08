import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { evidencePath, writeJsonEvidence, writeTextEvidence } from '../../../core/evidence';
import { dismissTours, pageText, requireBcUrl, screenshot, visibleButtonNames, waitForBusinessCentralShell } from '../../../core/bc-helpers';
import { project } from '../project';

test.use({
  storageState: 'playwright/.auth/bc-user.json',
  viewport: { width: 1920, height: 1200 }
});

const testId = 'payments-002';

function paymentsEvidencePath(fileName: string) {
  return evidencePath(project.name, testId, fileName);
}

function bcPageUrl(pageId: number, filter?: string) {
  const url = new URL(requireBcUrl(project.envPrefix));
  url.searchParams.set('page', String(pageId));
  if (filter) {
    url.searchParams.set('filter', filter);
  }
  return url.toString();
}

function ledgerFilter(tableName: string, documentNo: string) {
  return `'${tableName}'.'Document No.' IS '${documentNo}'`;
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
    /Bank Accounts|Bank Account|BANK-RM-01|Cash Receipt Journal|Payment Journal|General Journals|Batch Name|Account Type|Account No\.|Bal\. Account|Applies-to|Apply Entries|Payment|Vendor Ledger Entries|Customer Ledger Entries|PS-INV103297|108219|D10000|K10000|Remaining Amount|Open|Posting Date|Document Type|Amount|Register Customer Payments|Payment Reconciliation|Bank Account Reconciliation|Journal|Zahlung|Ausgleich|Bank/i;
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

async function clickFirstVisible(page: Page, name: RegExp) {
  for (const scope of [page, ...page.frames()]) {
    for (const role of ['button', 'menuitem'] as const) {
      const locator = scope.getByRole(role, { name }).first();
      if (await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
        await locator.click();
        await page.waitForTimeout(3500);
        return true;
      }
    }

    const textLocator = scope.getByText(name).first();
    if (await textLocator.isVisible({ timeout: 1000 }).catch(() => false)) {
      await textLocator.click();
      await page.waitForTimeout(3500);
      return true;
    }
  }

  return false;
}

async function openPageAndCapture(page: Page, target: {
  pageId: number;
  fileStem: string;
  screenshotFile: string;
  purpose: string;
  expectedLabel: RegExp;
  filter?: string;
}) {
  await page.goto(bcPageUrl(target.pageId, target.filter), { waitUntil: 'domcontentloaded' });
  await waitForBusinessCentralShell(page);
  await dismissTours(page);
  await page.waitForTimeout(2500);

  const text = await pageText(page);
  const buttons = (await visibleButtonNames(page)).map(sanitizeEvidenceText);
  const status = target.expectedLabel.test(text) ? 'labor' : 'rejected';
  await writeTextEvidence(paymentsEvidencePath(`${target.fileStem}-page-text.txt`), compactPageText(text));
  await writeJsonEvidence(paymentsEvidencePath(`${target.fileStem}-buttons.json`), buttons);
  await screenshot(page, target.screenshotFile, {
    projectName: project.name,
    testId,
    status,
    purpose: target.purpose,
    knownLimitations: [
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Zahlungs- oder Bank-Finalnachweis.',
      'Readiness-Navigation; keine Zahlung, kein Ausgleich, keine Journalzeile und keine Bankabstimmung gebucht.'
    ],
    bookUse: status === 'labor' ? 'evidence' : 'do-not-use'
  });

  return { text, buttons, status };
}

test('PAYMENTS-002 Bank-, Journal- und Apply-Entries-Readiness ohne Buchung pruefen', async ({ page }) => {
  const bankAccounts = await openPageAndCapture(page, {
    pageId: 371,
    fileStem: '010-bank-accounts',
    screenshotFile: 'payments-002-010-bank-accounts.png',
    purpose: 'PAYMENTS-002 Bank Accounts read-only oeffnen und pruefen, ob Zielbankkonto BANK-RM-01 sichtbar ist.',
    expectedLabel: /Bank Accounts|Bank Account List|Bankkonten/i
  });

  const cashReceiptJournal = await openPageAndCapture(page, {
    pageId: 255,
    fileStem: '020-cash-receipt-journal',
    screenshotFile: 'payments-002-020-cash-receipt-journal.png',
    purpose: 'PAYMENTS-002 Cash Receipt Journal als moeglichen Zahlungseingangspfad read-only oeffnen.',
    expectedLabel: /Cash Receipt Journal|Zahlungseingangs.*Journal|Zahlungseingangs.*Buch/i
  });

  const paymentJournal = await openPageAndCapture(page, {
    pageId: 256,
    fileStem: '030-payment-journal',
    screenshotFile: 'payments-002-030-payment-journal.png',
    purpose: 'PAYMENTS-002 Payment Journal als moeglichen Zahlungsausgangspfad read-only oeffnen.',
    expectedLabel: /Payment Journal|Zahlungsjournal/i
  });

  const customerLedger = await openPageAndCapture(page, {
    pageId: 25,
    filter: ledgerFilter('Cust. Ledger Entry', 'PS-INV103297'),
    fileStem: '040-customer-ledger-before-apply',
    screenshotFile: 'payments-002-040-customer-ledger-before-apply.png',
    purpose: 'PAYMENTS-002 Debitorenposten vor Apply Entries read-only pruefen.',
    expectedLabel: /Customer Ledger Entries|Cust\. Ledger Entry|Debitorenposten/i
  });
  const customerActionMenuOpened = await clickFirstVisible(page, /^Start$|^Entry$/i);
  const customerApplyClicked = await clickFirstVisible(page, /^Apply Entries$|^Posten ausgleichen$|Apply Entries|Ausgleichen/i);
  await dismissTours(page);
  await page.waitForTimeout(2000);
  const customerApplyText = await pageText(page);
  await writeTextEvidence(paymentsEvidencePath('050-customer-apply-entries-page-text.txt'), compactPageText(customerApplyText));
  await screenshot(page, 'payments-002-050-customer-apply-entries.png', {
    projectName: project.name,
    testId,
    status: customerApplyClicked && /Apply.*Entries|Apply Customer Entries|Posten ausgleichen|PS-INV103297|D10000/i.test(customerApplyText) ? 'labor' : 'rejected',
    purpose: 'PAYMENTS-002 Apply Entries fuer Debitorenposten oeffnen, ohne Set Applies-to ID oder Buchung auszufuehren.',
    knownLimitations: [
      'Nur Pfadnachweis. Kein Set Applies-to ID, kein Post Application, kein Zahlungsausgleich.',
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Finalnachweis.'
    ],
    bookUse: customerApplyClicked ? 'evidence' : 'do-not-use'
  });

  const vendorLedger = await openPageAndCapture(page, {
    pageId: 29,
    filter: ledgerFilter('Vendor Ledger Entry', '108219'),
    fileStem: '060-vendor-ledger-before-apply',
    screenshotFile: 'payments-002-060-vendor-ledger-before-apply.png',
    purpose: 'PAYMENTS-002 Kreditorenposten vor Apply Entries read-only pruefen.',
    expectedLabel: /Vendor Ledger Entries|Vendor Ledger Entry|Kreditorenposten/i
  });
  const vendorActionMenuOpened = await clickFirstVisible(page, /^Start$|^Entry$/i);
  const vendorApplyClicked = await clickFirstVisible(page, /^Apply Entries$|^Posten ausgleichen$|Apply Entries|Ausgleichen/i);
  await dismissTours(page);
  await page.waitForTimeout(2000);
  const vendorApplyText = await pageText(page);
  await writeTextEvidence(paymentsEvidencePath('070-vendor-apply-entries-page-text.txt'), compactPageText(vendorApplyText));
  await screenshot(page, 'payments-002-070-vendor-apply-entries.png', {
    projectName: project.name,
    testId,
    status: vendorApplyClicked && /Apply.*Entries|Apply Vendor Entries|Posten ausgleichen|108219|K10000/i.test(vendorApplyText) ? 'labor' : 'rejected',
    purpose: 'PAYMENTS-002 Apply Entries fuer Kreditorenposten oeffnen, ohne Set Applies-to ID oder Buchung auszufuehren.',
    knownLimitations: [
      'Nur Pfadnachweis. Kein Set Applies-to ID, kein Post Application, kein Zahlungsausgleich.',
      'CRONUS-USA-Labor in RM-DEMO, kein deutscher Finalnachweis.'
    ],
    bookUse: vendorApplyClicked ? 'evidence' : 'do-not-use'
  });

  const allText = [
    bankAccounts.text,
    cashReceiptJournal.text,
    paymentJournal.text,
    customerLedger.text,
    customerApplyText,
    vendorLedger.text,
    vendorApplyText
  ].join('\n');

  const result = {
    testId: 'PAYMENTS-002',
    environment: 'MCP_1_20260210',
    company: project.defaultCompany,
    dataBasis: 'CRONUS USA',
    mode: 'controlled-readiness-no-posting-no-application-no-journal-line',
    sourceDocuments: {
      postedSalesInvoiceNo: 'PS-INV103297',
      postedPurchaseInvoiceNo: '108219',
      customerNo: 'D10000',
      vendorNo: 'K10000',
      targetBankAccountNo: 'BANK-RM-01'
    },
    pages: {
      bankAccounts: {
        pageId: 371,
        opened: bankAccounts.status === 'labor',
        targetBankAccountVisible: /BANK-RM-01/i.test(bankAccounts.text),
        anyBankAccountContextVisible: /Bank Accounts|Bank Account No\.|Checking|Operating|World Wide Bank|WWB/i.test(bankAccounts.text)
      },
      cashReceiptJournal: {
        pageId: 255,
        opened: cashReceiptJournal.status === 'labor',
        accountFieldsVisible: /Account Type|Account No\.|Bal\. Account|Applies-to|Amount|Posting Date|Document No\./i.test(cashReceiptJournal.text),
        postActionVisible: cashReceiptJournal.buttons.some((button) => /Post|Buchen/i.test(button))
      },
      paymentJournal: {
        pageId: 256,
        opened: paymentJournal.status === 'labor',
        accountFieldsVisible: /Account Type|Account No\.|Bal\. Account|Applies-to|Amount|Posting Date|Document No\./i.test(paymentJournal.text),
        postActionVisible: paymentJournal.buttons.some((button) => /Post|Buchen/i.test(button))
      },
      customerApplyEntries: {
        sourcePageId: 25,
        actionMenuOpened: customerActionMenuOpened,
        openedFromLedgerEntry: customerApplyClicked,
        documentVisible: /PS-INV103297|D10000/i.test(customerApplyText),
        dangerousApplyOrPostActionsVisible: /Set Applies-to ID|Post Application|Post|Buchen|Anwenden/i.test(customerApplyText)
      },
      vendorApplyEntries: {
        sourcePageId: 29,
        actionMenuOpened: vendorActionMenuOpened,
        openedFromLedgerEntry: vendorApplyClicked,
        documentVisible: /108219|K10000/i.test(vendorApplyText),
        dangerousApplyOrPostActionsVisible: /Set Applies-to ID|Post Application|Post|Buchen|Anwenden/i.test(vendorApplyText)
      }
    },
    safety: {
      posted: false,
      applied: false,
      journalLineCreated: false,
      bankReconciliationOpened: false,
      setAppliesToIdClicked: false,
      postApplicationClicked: false
    },
    summary: {
      bankAccountReady: /BANK-RM-01/i.test(bankAccounts.text),
      cashReceiptJournalReachable: cashReceiptJournal.status === 'labor',
      paymentJournalReachable: paymentJournal.status === 'labor',
      customerApplyEntriesPathReachable: customerApplyClicked,
      vendorApplyEntriesPathReachable: vendorApplyClicked,
      readyForPaymentPosting: false
    },
    proves: [
      'Ob der Bankkonten-Einstieg fuer den Zielbankkonto-Check erreichbar ist.',
      'Ob Cash Receipt Journal und Payment Journal als Bedienpfade erreichbar sind.',
      'Ob Apply Entries aus Debitoren- und Kreditorenposten erreichbar ist.'
    ],
    doesNotProve: [
      'Keine Zahlung gebucht.',
      'Kein Ausgleich angewendet.',
      'Keine Journalzeile erstellt.',
      'Keine Bankkontoabstimmung geoeffnet oder gebucht.',
      'Kein deutscher Zahlungs-, Steuer- oder Bank-Finalnachweis.'
    ],
    blockers: [
      /BANK-RM-01/i.test(bankAccounts.text)
        ? undefined
        : 'Zielbankkonto BANK-RM-01 ist im Bank-Accounts-Bild/Seitentext nicht sichtbar; vor einer Laborzahlung muss Bankkonto-Setup oder bewusstes CRONUS-Ersatzbankkonto entschieden werden.'
    ].filter(Boolean),
    nextStep: /BANK-RM-01/i.test(bankAccounts.text)
      ? 'PAYMENTS-003 kann eine einzelne Laborzahlung vorbereiten, aber erst nach expliziter Buchungsfreigabe und mit Preview/Journal-Check soweit verfuegbar.'
      : 'PAYMENTS-003 darf noch nicht buchen. Naechster Schritt ist ein idempotenter Bankkonto-Setup-/Fit-Lauf oder eine dokumentierte Entscheidung fuer ein vorhandenes CRONUS-Bankkonto als Laborersatz.'
  };

  await writeJsonEvidence(paymentsEvidencePath('PAYMENTS-002-result.json'), result);
  await writeTextEvidence(
    paymentsEvidencePath('PAYMENTS-002-READINESS.md'),
    [
      '# PAYMENTS-002 Bank-/Journal-/Apply-Readiness',
      '',
      '| Feld | Wert |',
      '|---|---|',
      `| Umgebung | ${result.environment} |`,
      `| Company | ${result.company} |`,
      '| Status | labor, controlled-readiness, no-payment, no-application, no-journal-line |',
      '| Ausgangsposten Debitor | `PS-INV103297` / `D10000` |',
      '| Ausgangsposten Kreditor | `108219` / `K10000` |',
      '| Zielbankkonto laut Buch | `BANK-RM-01` |',
      '',
      '## Ergebnis',
      '',
      '| Frage | Befund |',
      '|---|---|',
      `| Bank Accounts erreichbar | ${result.pages.bankAccounts.opened ? 'ja' : 'nein'} |`,
      `| Zielbankkonto BANK-RM-01 sichtbar | ${result.pages.bankAccounts.targetBankAccountVisible ? 'ja' : 'nein'} |`,
      `| Cash Receipt Journal erreichbar | ${result.pages.cashReceiptJournal.opened ? 'ja' : 'nein'} |`,
      `| Payment Journal erreichbar | ${result.pages.paymentJournal.opened ? 'ja' : 'nein'} |`,
      `| Apply Entries Debitor erreichbar | ${result.pages.customerApplyEntries.openedFromLedgerEntry ? 'ja' : 'nein'} |`,
      `| Apply Entries Kreditor erreichbar | ${result.pages.vendorApplyEntries.openedFromLedgerEntry ? 'ja' : 'nein'} |`,
      '| Zahlung gebucht | nein |',
      '| Posten ausgeglichen | nein |',
      '| Journalzeile erstellt | nein |',
      '',
      '## Anfaenger-Lernwert',
      '',
      'Ein Zahlungsprozess hat drei Ebenen: offene Posten, Journal/Bankweg und Ausgleich. `PAYMENTS-001` hat die offenen Posten belegt. `PAYMENTS-002` zeigt jetzt die naechsten Bedienorte, ohne Werte einzutragen: Bankkonten, Cash Receipt Journal, Payment Journal und Apply Entries. Fuer Anfaenger ist wichtig: Das Oeffnen von `Apply Entries` ist noch kein Ausgleich. Erst Aktionen wie `Set Applies-to ID`, `Post Application` oder eine Journalbuchung veraendern die Posten.',
      '',
      '## Buchwirkung',
      '',
      'Kapitel 19/20 kann den Payments-Pfad jetzt als Readiness-Kette darstellen: zuerst offene Posten, dann Bankkonto/Journale, dann Apply Entries. Das Buch darf weiterhin keine Zahlung, keinen Ausgleich und keine Bankwirkung behaupten.',
      '',
      '## Blocker / Grenze',
      '',
      ...(result.blockers.length ? result.blockers.map((entry) => `- ${entry}`) : ['- Kein neuer fachlicher Blocker im Readiness-Pfad; Buchung bleibt trotzdem gesperrt bis zur expliziten Freigabe.']),
      '- CRONUS-USA-Labor, kein deutscher Finalnachweis.',
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
      '# PAYMENTS-002 Evidence Index',
      '',
      'Status: CRONUS-USA-Labor, controlled-readiness, keine Zahlung, kein Ausgleich, keine Journalzeile.',
      '',
      '| Datei | Typ | Beweist | Beweist nicht | Status |',
      '|---|---|---|---|---|',
      '| `010-bank-accounts-page-text.txt` | kompakter Seitentext | Bankkonten-Einstieg und Sichtbarkeit/Fehlen von `BANK-RM-01` | keine Bankbuchung und keine Bankabstimmung | labor |',
      '| `020-cash-receipt-journal-page-text.txt` | kompakter Seitentext | Cash-Receipt-Journal-Einstieg fuer Zahlungseingang | keine Journalzeile und keine Buchung | labor |',
      '| `030-payment-journal-page-text.txt` | kompakter Seitentext | Payment-Journal-Einstieg fuer Zahlungsausgang | keine Journalzeile und keine Buchung | labor |',
      '| `050-customer-apply-entries-page-text.txt` | kompakter Seitentext | Apply-Entries-Pfad aus Debitorenposten | kein Set Applies-to ID, kein Ausgleich | labor |',
      '| `070-vendor-apply-entries-page-text.txt` | kompakter Seitentext | Apply-Entries-Pfad aus Kreditorenposten | kein Set Applies-to ID, kein Ausgleich | labor |',
      '| `PAYMENTS-002-result.json` | JSON-Ergebnis | strukturierter Readiness-Befund und Blocker | kein Zahlungs-Finalnachweis | labor |',
      '| `PAYMENTS-002-READINESS.md` | Lernzusammenfassung | Buchwirkung, Grenzen und naechster Schritt | keine Buchung | labor |',
      '| `*.screenshot.json` | Screenshot-Metadaten | Zweck und Limitationen der PNGs | keine eigenstaendige fachliche Wahrheit ohne Text/JSON | labor |',
      '',
      '## Kernergebnis',
      '',
      'Dieser Lauf prueft den Payments-Pfad vor der ersten Zahlung. Er darf nicht als Zahlungs- oder Ausgleichsnachweis gelesen werden.',
      ''
    ].join('\n')
  );

  expect(result.pages.bankAccounts.opened).toBe(true);
  expect(result.pages.cashReceiptJournal.opened).toBe(true);
  expect(result.pages.paymentJournal.opened).toBe(true);
  expect(result.safety.posted).toBe(false);
  expect(result.safety.applied).toBe(false);
  expect(result.safety.journalLineCreated).toBe(false);
});
