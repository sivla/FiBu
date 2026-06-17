# FIXEDASSETS-044 Evidence Index

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `FIXEDASSETS-044-K30000-VENDOR-PURCHASE-INVOICE-GATE-DECISION.md` | Markdown | Gate-Entscheidung nach dem partiellen K30000-Invoicing-Nachweis | keine neue BC-Sicht, keine Einkaufsrechnung, keine Buchung | decision/labor |
| `FIXEDASSETS-044-result.json` | JSON | strukturierte Entscheidung, erlaubte und gesperrte Folgeaktionen | keine UI-/Posting-/Tabellenwerte | compact |

Der Teilnachweis aus `FIXEDASSETS-043` reicht nicht fuer einen Kaufbeleg-Preflight. Sichtbar sind K30000, Zahlungswerte und einige Invoicing-/Tax-Felder; weiterhin nicht sichtbar sind Vendor Posting Group, Gen. Bus. Posting Group, Currency Code und VAT Bus. Posting Group. Der naechste praktische Schritt ist daher eine read-only UI-/Technikdiagnose mit Personalisieren/Page Inspection, nicht eine Einkaufsrechnung.

