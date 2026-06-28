# BC Field Atlas

Status: `labor-reference`.

| Feld / Spalte | Bereich | Wo sichtbar/belegt | Wirkung | Evidence | Grenze |
|---|---|---|---|---|---|
| `Buy-from Vendor No.` / Vendor | P2P | Purchase Order Draft `106002` | Kreditor setzt Belegkopf und Folge-Defaults | `evidence/p2p-004/P2P-004-result.json` | Header-Fallback teilweise geometrisch, Nachherwert sichtbar |
| `Item No.` | P2P | Purchase Order Lines Kontext | naechster P2P-005 Zielwert `RAW-STEEL` | `evidence/p2p-004/030-after-vendor-controls.json` | noch nicht gesetzt |
| `Qty. to Receive` | P2P | Purchase Order Lines Kontext | Teil-WE-Menge steuert Wareneingang | `evidence/p2p-004/030-after-vendor-controls.json` | noch nicht gesetzt |
| `Qty. to Invoice` | P2P | Purchase Order Lines Kontext | Rechnungsmengenabgleich | `evidence/p2p-004/030-after-vendor-controls.json` | noch nicht gesetzt |
| `Vendor Invoice No.` | P2P | UAT-P2P-001 | Pflicht vor Preview/Buchung | `evidence/p2p-001/` | deutscher Klickpfad spaeter neu |
| `Remaining Amount` | P2P Payment | Vendor Ledger Entries Rechnung `108219` | OP-Schluss sichtbar `0,00` | `evidence/p2p-003/` | deutsch final offen |
| `Payment Discount` | P2P Payment | Detailed Vendor Ledger Entries | CRONUS-Labor-Skonto/Discount-Wirkung | `evidence/p2p-003/` | deutsche Skontologik offen |
| `Depreciation Book Code = HGB` | Fixed Assets | Fixed Asset / FA Journal | AfA-/Anlagenbuchungslogik | Fixed-Assets Evidence | Laborname, kein deutscher Finalbeweis |
| `FA Posting Group = MACHINES` | Fixed Assets | Fixed Asset / Setup | Kontenfindung Anlagenzugang | Fixed-Assets Evidence | historische Blocker beachten |
| `Acquisition Cost Bal. Acc. = 82000` | Fixed Assets | FA Posting Group Setup | Gegenkonto fuer Zugang | `fixedassets-170`, `208+` | CRONUS-Labor |
| `PRODUCTLINE=MACHINE`, `CHANNEL=B2B` | Dimensions/Reporting | O2C/Item Ledger/Reporting Evidence | Auswertungsdimensionen | `evidence/reporting-*` | Financial Reports Nutzung nur teilweise |
