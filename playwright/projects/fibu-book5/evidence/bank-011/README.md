# BANK-011 Evidence Index

Status: labor, read-only Zustand nach BANK-009, no-post, no-preview, no-setup-change, not-final.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-payment-reconciliation-after-bank009-page-text.txt` | kompakter UI-Seitentext | Payment-Reconciliation-Kontext nach BANK-009 | keine Reconciliation-Buchung | labor, read-only |
| `020-vendor-ledger-invoice-108204-after-bank009-page-text.txt` | kompakter UI-Seitentext | Rechnungs-/OP-Kontext zur bezahlten Rechnung | kein deutsches Finalbild | labor, read-only |
| `030-vendor-ledger-payment-bank009-page-text.txt` | kompakter UI-Seitentext | Zahlungsposten `BANK009-108204` | keine neue Zahlung | labor, read-only |
| `040-bank-ledger-payment-bank009-page-text.txt` | kompakter UI-Seitentext | Bankposten zur Zahlung | keine Bankabstimmung | labor, read-only |
| `050-gl-entries-payment-bank009-page-text.txt` | kompakter UI-Seitentext | Sachposten zur Zahlung | keine Compliance-Aussage | labor, read-only |
| `BANK-011-result.json` | JSON-Ergebnis | strukturierter Read-only-Befund nach BANK-009 | keinen deutschen Finalnachweis | labor |
| `BANK-011-POST-PAYMENT-RECONCILIATION-STATE.md` | Lernzusammenfassung | warum alte Reconciliation-Zeilen nach Zahlung neu bewertet werden muessen | keine Buchung | labor |
