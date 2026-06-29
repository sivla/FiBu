# BC Field Atlas

Status: `labor-reference`.

| Feld / Spalte | Bereich | Wo sichtbar/belegt | Wirkung | Evidence | Grenze |
|---|---|---|---|---|---|
| `Buy-from Vendor No.` / Vendor | P2P | Purchase Order Draft `106002` | Kreditor setzt Belegkopf und Folge-Defaults | `evidence/p2p-004/P2P-004-result.json` | Header-Fallback teilweise geometrisch, Nachherwert sichtbar |
| `Item No.` | P2P | Purchase Order Lines Kontext | naechster P2P-005 Zielwert `RAW-STEEL` | `evidence/p2p-004/030-after-vendor-controls.json` | noch nicht gesetzt |
| Purchase Order Lines Grid Controls | P2P | Purchase Order Draft `106051` | Voraussetzung fuer `RAW-STEEL`, Menge, Preis und `Qty. to Receive` im Teil-WE | `evidence/p2p-005/P2P-005-result.json` | labor-blocked: sichtbare Zeilenansicht, aber aktueller Control-Snapshot liefert keine sichere befuellbare Feldroute |
| Purchase Order Lines Header / Fokusmodus | P2P | Purchase Order Draft `106051`, breite Layoutansicht + Lines-Fokusmodus | Header fuer `Type`, `No.`, `Location Code`, `Quantity`, `Direct Unit Cost Excl. Tax`, `Qty. to Receive` sind technisch/sichtbar erfassbar | `evidence/p2p-006/020-grid-control-snapshot.json`, `img/p2p-006-020-lines-focus-mode.png` | labor-blocked: keine Datenzeile sichtbar, Meldung `In dieser Ansicht kann nichts angezeigt werden`; keine Werteingabe |
| `No. = RAW-STEEL` | P2P | Purchase Order `106051`, Lines nach `Select items...` | beweist eine echte Einkaufszeile im Subform statt nur Header | `evidence/p2p-007/P2P-007-result.json`, `img/p2p-007-090-final-route-state.png` | Laborzeile, noch kein Teil-WE; deutsche Zielstrecke neu erzeugen |
| `Location Code` | P2P | Purchase Order `106051`, RAW-STEEL-Zeile | Lagerort waere Konten-/Lagerortsteuerung fuer Teil-WE | `evidence/p2p-009/P2P-009-result.json` | `FRA-ZL` nicht sichtbar gespeichert; mapped cell bleibt leer, Zeile zeigt weiter `ATLANTA, GA` |
| `Quantity` | P2P | Purchase Order `106051`, RAW-STEEL-Zeile | Bestellmenge fuer Teil-WE | `evidence/p2p-009/P2P-009-result.json` | Menge `4` nicht sichtbar bestaetigt; mapped cell bleibt leer |
| `Direct Unit Cost Excl. Tax` | P2P | Purchase Order `106051`, RAW-STEEL-Zeile | Preis-/Wertbasis fuer Lager-/Sachposten | `evidence/p2p-009/P2P-009-result.json` | `2.500,00` in mapped cell sichtbar, aber nicht als neu gesetzter Wert bewiesen |
| `Qty. to Receive` | P2P | Purchase Order `106051`, RAW-STEEL-Zeile | Teil-WE-Menge fuer Receive-only/Partial Receipt | `evidence/p2p-009/P2P-009-result.json` | Wert `2` nicht sichtbar bestaetigt; mapped cell bleibt leer |
| `RAW-STEEL` per Select-items auf frischem Draft | P2P | Purchase Order `106054` | Artikelkontext fuer Teil-WE-Wertepfad | `evidence/p2p-010/P2P-010-result.json` | Artikel sichtbar, aber Location/Menge/Qty. to Receive/Unit Cost-Zielwerte nicht gesetzt |
| Purchase Lines Action-Kontext | P2P | Purchase Order `106054`, More options / Line | kann Menues und Kontextaktionen sichtbar machen | `evidence/p2p-011/P2P-011-result.json` | kein Feldwert-Beweis; keine direkte Edit/List-Edit-Route fuer Zielwerte gefunden |
| Alternative Standard-UI Mengensignale | P2P/Inventory | Purchase Journal, Item Journal, Purchase Invoices, Requisition Worksheet | Read-only Signale fuer Menge/Lager/Wert und moegliche Posting-Kontexte | `evidence/p2p-012/P2P-012-result.json` | keine Feldwert-Eingabe; Item Journal beweist nicht den Kreditorenprozess |
| `Qty. to Receive` | P2P | Purchase Order Lines Kontext | Teil-WE-Menge steuert Wareneingang | `evidence/p2p-004/030-after-vendor-controls.json` | noch nicht gesetzt |
| `Qty. to Invoice` | P2P | Purchase Order Lines Kontext | Rechnungsmengenabgleich | `evidence/p2p-004/030-after-vendor-controls.json` | noch nicht gesetzt |
| `Vendor Invoice No.` | P2P | UAT-P2P-001 | Pflicht vor Preview/Buchung | `evidence/p2p-001/` | deutscher Klickpfad spaeter neu |
| `Remaining Amount` | P2P Payment | Vendor Ledger Entries Rechnung `108219` | OP-Schluss sichtbar `0,00` | `evidence/p2p-003/` | deutsch final offen |
| `Payment Discount` | P2P Payment | Detailed Vendor Ledger Entries | CRONUS-Labor-Skonto/Discount-Wirkung | `evidence/p2p-003/` | deutsche Skontologik offen |
| `Depreciation Book Code = HGB` | Fixed Assets | Fixed Asset / FA Journal | AfA-/Anlagenbuchungslogik | Fixed-Assets Evidence | Laborname, kein deutscher Finalbeweis |
| `FA Posting Group = MACHINES` | Fixed Assets | Fixed Asset / Setup | Kontenfindung Anlagenzugang | Fixed-Assets Evidence | historische Blocker beachten |
| `Acquisition Cost Bal. Acc. = 82000` | Fixed Assets | FA Posting Group Setup | Gegenkonto fuer Zugang | `fixedassets-170`, `208+` | CRONUS-Labor |
| `PRODUCTLINE=MACHINE`, `CHANNEL=B2B` | Dimensions/Reporting | O2C/Item Ledger/Reporting Evidence | Auswertungsdimensionen | `evidence/reporting-*` | Financial Reports Nutzung nur teilweise |

## Zero-Open-Questions-Regel

Jedes nicht verstandene Feld erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.
