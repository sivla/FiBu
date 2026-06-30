# BC Table Entry Atlas

Status: `universaarl-draft`, `not-empty`, `target-evidence-started`.

Dieses Atlas-Dokument sammelt Posten-/Entry-Kontexte fuer spaetere Buchprozesse. TARGET-001/TARGET-002 erzeugen noch keine Posten, definieren aber die Erfassungsregel.

PREP-022-Qualitaet: `thin-but-correct`.

Noch gibt es keine Universaarl-Posten. Der Atlas darf deshalb keine Postenspur behaupten. Er legt aber fest, welche Entry-Seiten spaeter pro Prozess kontrolliert werden muessen.

| Entry/Page | Bereich | Erwartete Felder | Evidence | Grenze |
|---|---|---|---|---|
| Companies List row | Foundation/Company | `Name`, `Anzeigename`, `Testunternehmen`, Setup-Status | `evidence/target-001/`, `evidence/target-002/` | Keine Buchungsposten; TARGET-002 oeffnete eine unsaved blank row, aber keine gespeicherte Company |
| No. Series Line (Table 309) | Foundation/Numbering Setup | `Series Code`, `Line No.`, `Starting Date`, `Starting No.`, `Ending No.`, `Warning No.`, `Increment-by No.`, `Last No. Used`, `Open` | `evidence/target-016d-number-series-page-inspection-or-alternative-route/`, Screenshot `target-016d-040-after-page-inspection-shortcut.png` | Setup-Tabelle, keine Ledger Entries; TARGET-016E beweist noch keine persistierte Start-/Endnummernzeile |

## Erwartete Universaarl-Entry-Matrix

| Usecase | Entries/Posten | Status |
| --- | --- | --- |
| `TARGET-O2C-001` | Posted Sales Invoice, Customer Ledger Entries, Detailed Customer Ledger Entries, G/L Entries, VAT Entries, Item Ledger Entries, Value Entries | `planned-after-masterdata` |
| `TARGET-P2P-001` | Posted Purchase Receipt/Invoice, Vendor Ledger Entries, Detailed Vendor Ledger Entries, G/L Entries, VAT Entries, Item Ledger Entries, Value Entries | `planned-after-masterdata` |
| `TARGET-INVENTORY-001` | Item Ledger Entries, Value Entries, Item Register, G/L Entries falls Wertbuchung entsteht | `planned-after-masterdata` |
| `TARGET-PAYMENT-001` | Customer/Vendor Ledger Entries, Detailed Ledger Entries, Bank Account Ledger Entries, G/L Entries | `planned-after-first-postings` |
| `TARGET-FA-001` | Fixed Asset Ledger Entries, FA G/L Entries, Depreciation Entries, G/L Entries | `planned-after-foundation-and-masterdata` |

## Erfassungsregel

Jeder gebuchte Universaarl-Prozess muss die passenden Entries/Posten erfassen: Page, Filter, Belegnummer, Konten, Betrage, Dimensionen, Steuer/VAT, Nebenbuchbezug, Korrekturweg und Screenshot-Beweis.

## Zero-Open-Questions-Regel

Jede nicht verstandene Tabelle oder Entry-Seite erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.
