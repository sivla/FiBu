# BANK-005 Evidence Index

Status: labor, read-only Zielzeilen-/Open-Entry-Drilldown, no-post, no-preview, no-setup-change, not-final.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `010-payment-reconciliation-target-line-page-text.txt` | kompakter UI-Seitentext | Payment-Reconciliation-Zielkandidat `108204` soweit sichtbar | keine Zahlung | labor, read-only |
| `020-customer-ledger-document-108204-page-text.txt` | kompakter UI-Seitentext | Customer-Ledger-Filter auf `108204` | keinen gebuchten neuen Bankposten | labor, read-only |
| `030-vendor-ledger-document-108204-page-text.txt` | kompakter UI-Seitentext | Vendor-Ledger-Filter auf `108204` | keinen Payment-Post | labor, read-only |
| `040-bank-account-ledger-document-108204-page-text.txt` | kompakter UI-Seitentext | Bank-Ledger-Filter auf `108204` | keine neue Bankabstimmung | labor, read-only |
| `BANK-005-result.json` | JSON-Ergebnis | strukturierte Zielzeilen-/Ledger-Auswertung und Posting-Gate-Entscheidung | keinen deutschen Finalnachweis | labor |
| `BANK-005-TARGET-LINE-OPEN-ENTRY-DRILLDOWN.md` | Lernzusammenfassung | warum der Postingdialog ohne Open-Entry-Bezug nicht reicht | keine Zahlung | labor |
