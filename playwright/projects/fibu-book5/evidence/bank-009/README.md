# BANK-009 Evidence Index

Status: CRONUS-USA-Labor, autonome UI-Kreditorenzahlung, OP-Ausgleich/Payment-Trace, keine Bankabstimmung, kein deutscher Finalnachweis.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `005-existing-payment-document-guard.json` | UI-Duplikat-Guard | `BANK009-108204` war vor der Buchung nicht als Kreditorenposten sichtbar | keine fachliche Zahlungswirkung | labor, preflight |
| `010-vendor-ledger-before-payment.json` | UI-Preflight | `108204` war vor Zahlung als Kreditorenposten sichtbar/offen genug fuer Zahlung | keine Zahlungswirkung | labor, preflight |
| `020-payment-journal-preflight-controls.json` | UI-Control-Snapshot | Payment-Journal-Zeile mit 20000, BANK-RM-01, Betrag, Applies-to und Journal Check | keine Zahlung vor Bestaetigung | labor, preflight |
| `030-apply-entries-preflight-controls.json` | UI-/Button-Evidence | Apply Entries wurde vor Buchung read-only geprueft | kein Set Applies-to ID, kein Post Application | labor, preflight |
| `035-posting-decision.txt` | Entscheidungssatz | warum die autonome Laborbuchung vertretbar war | keine Posten | labor, autonomous-posting |
| `040-post-confirm-dialog-page-text.txt` | kompakter Seitentext | Post-Dialog vor Bestaetigung | keine Posten vor Ja | labor, process-proof |
| `050-post-result-page-text.txt` | kompakter Seitentext | Zustand nach Bestaetigung | keine vollstaendige Postenspur allein | labor |
| `060-vendor-ledger-invoice-after-payment-page-text.txt` | kompakter UI-Seitentext | Rechnung `108204` nach Zahlung | keine Bankabstimmung, keine deutsche Finalaussage | labor, posting-trace |
| `061-vendor-ledger-payment-page-text.txt` | kompakter UI-Seitentext | Zahlungsbeleg `BANK009-108204` | keine Bankabstimmung | labor, posting-trace |
| `062-detailed-vendor-ledger-payment-page-text.txt` | kompakter UI-Seitentext | detaillierte Kreditorenposten zur Zahlung | keine Unapply-Pruefung | labor, posting-trace |
| `063-bank-account-ledger-payment-page-text.txt` | kompakter UI-Seitentext | Bank Account Ledger Entry zur Zahlung, falls sichtbar | keine Bankabstimmung | labor, posting-trace |
| `064-gl-entries-payment-page-text.txt` | kompakter UI-Seitentext | Sachposten zur Zahlung | keinen deutschen Kontenplan-Endstand | labor, posting-trace |
| `BANK-009-result.json` | JSON-Ergebnis | strukturierter Preflight-, Posting- und Postenspur-Befund | keine Compliance-Finalaussage | labor |
| `BANK-009-VENDOR-PAYMENT.md` | Lernzusammenfassung | Anfaengererklaerung, OP-Ausgleich, Buchwirkung, Grenzen und naechster Schritt | keinen deutschen Finalnachweis | labor |
