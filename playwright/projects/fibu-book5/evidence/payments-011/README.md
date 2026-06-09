# PAYMENTS-011 Evidence Index

Status: CRONUS-USA-Labor, autonome UI-Laborzahlung, OP-Ausgleich sichtbar, Skonto-/Payment-Discount-Wirkung sichtbar, keine Bankabstimmung, kein deutscher Finalnachweis.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-customer-ledger-before-payment.json` | UI-Preflight | `PS-INV103297` war vor Zahlung als Debitorenposten sichtbar/offen genug fuer Zahlung | keine Zahlungswirkung | labor, preflight |
| `020-cash-receipt-preflight-controls.json` | UI-Control-Snapshot | Cash-Receipt-Zeile mit D10000, BANK-RM-01, Betrag, Applies-to und Journal Check | keine Zahlung vor Bestaetigung | labor, preflight |
| `030-apply-entries-preflight-controls.json` | UI-/Button-Evidence | Apply Entries wurde vor Buchung read-only geprueft | kein Set Applies-to ID, kein Post Application | labor, preflight |
| `035-posting-decision.txt` | Entscheidungssatz | warum die autonome Laborbuchung vertretbar war | keine Posten | labor, autonomous-posting |
| `040-post-confirm-dialog-page-text.txt` | kompakter Seitentext | Post-Dialog vor Bestaetigung | keine Posten vor Ja | labor, process-proof |
| `050-post-result-page-text.txt` | kompakter Seitentext | Zustand nach Bestaetigung | keine vollstaendige Postenspur allein | labor |
| `060-customer-ledger-invoice-after-payment-page-text.txt` | kompakter UI-Seitentext | Rechnung `PS-INV103297` zeigt `Remaining Amount = 0,00` und `Applied Entries = 1` | keine Bankabstimmung, keine deutsche Finalaussage | labor, posting-trace |
| `061-customer-ledger-payment-page-text.txt` | kompakter UI-Seitentext | Zahlungsbeleg `PAY011-PS103297`, Zahlungsbetrag, Restbetrag und Related G/L Entries | keine Bankkontoabstimmung; erklaert allein nicht die Skontozeilen | labor, posting-trace |
| `062-detailed-customer-ledger-payment-page-text.txt` | kompakter UI-Seitentext | Detailed Customer Ledger Entries mit `Initial Entry`, `Payment Discount` und `Application` | keine Korrektur-/Unapply-Pruefung | labor, posting-trace |
| `063-bank-account-ledger-payment-page-text.txt` | kompakter UI-Seitentext / rejected trace | Der getestete Page-371-Pfad liefert keinen belastbaren Bank Account Ledger Entry Nachweis | keinen Bankposten; keine Bankabstimmung | rejected, follow-up |
| `064-gl-entries-payment-page-text.txt` | kompakter UI-Seitentext | G/L Entries mit `15110`, `18200`, `40910`; Bankwirkung indirekt ueber `BANK-RM-01` sichtbar | keinen Bank Account Ledger Entry UI-Nachweis | labor, posting-trace |
| `PAYMENTS-011-result.json` | JSON-Ergebnis | strukturierter Preflight-, Posting- und Postenspur-Befund inklusive Bank-Ledger-Limitation | keine Compliance-Finalaussage | labor |
| `PAYMENTS-011-LAB-PAYMENT.md` | Lernzusammenfassung | Anfaengererklaerung, OP-Ausgleich, Payment Discount, Buchwirkung, Grenzen und naechster Schritt | keinen deutschen Finalnachweis | labor |
