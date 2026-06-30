# BC Field Atlas

Status: `labor-reference`.

PREP-022-Qualitaet: `legacy-heavy`.

Die vorhandene Feldliste bewahrt wichtige RM-DEMO-/P2P-/Fixed-Assets-Learnings. Fuer Universaarl muss die aktive Feldprioritaet aber zuerst aus Company, Foundation, Stammdaten und ersten Postings kommen. Alte Feldwerte wie `RAW-STEEL`, `K10000`, `FA-CNC-01`, `HGB` oder `MACHINES` sind Pattern-/Laborreferenz, keine Zielwerte.

## Aktive Universaarl-Feldprioritaeten

| Reihenfolge | Usecase | Feldgruppe | Warum |
| ---: | --- | --- | --- |
| 1 | `TARGET-009` | Company Name, Display Name, Datenbasis/Template | entscheidet, ob `UNIVERSAARL-DE` sauber entsteht. |
| 2 | `TARGET-COMPANY-INFO-001` | Name, Legal Name, Address, Country/Region, VAT Registration No. | traegt Firmenkontext und spaetere Screenshots. |
| 3 | `TARGET-NOSERIES-001` | Code, Starting No., Last No. Used, Manual Nos. | erklaert Belegnummern und Nachverfolgung. |
| 4 | `TARGET-POSTINGGROUPS-001` | Gen. Bus./Prod. Posting Group, Customer/Vendor/Inventory/Bank/FA Posting Group | steuert Kontenfindung. |
| 5 | `TARGET-VAT-001` | VAT Bus./Prod. Posting Group, VAT %, VAT Accounts | Grundlage fuer deutsche USt-Nachweise. |
| 6 | `TARGET-DIMENSIONS-001` | Dimension Code, Dimension Value Code, Value Posting | Grundlage fuer Reporting und Filter. |

## PREP-024 Read-only Feldpaket

| Discovery-ID | Feldgruppe | Read-only-Frage | Grenze |
| --- | --- | --- | --- |
| `RO-W0-COMPANIES-357` | Name, Display Name, Evaluation/Testunternehmen, Einrichtungsstatus | Ist `UNIVERSAARL-DE` sichtbar? Welche Spalten tragen Company-Kontext und Datenbasisrisiko? | sichtbare Spalten beweisen keine neue Company |
| `RO-W0-MY-SETTINGS` | Company, Role, Language/Region | Welcher Kontext steuert das, was Business Central dem Nutzer zeigt? | nicht speichern, nicht wechseln |
| `RO-W1-COMPANY-INFORMATION` | Name, Adresse, Country/Region, VAT Registration No. | Welche Firmenfelder erscheinen spaeter in Belegen, Reports und Buchscreenshots? | erst nach existierender Universaarl-Company pruefen |
| `RO-W1-NO-SERIES` | Code, Starting No., Last No. Used, Manual Nos. | Wie entstehen spaeter Belegnummern und Nachverfolgung? | keine Nummernserie aendern |
| `RO-W1-POSTING-GROUPS` | Business/Product/Customer/Vendor/Inventory/Bank/FA Posting Groups | Welche Felder steuern spaeter Kontenfindung und Posten? | keine Matrix-/Kontenwerte als final behaupten |
| `RO-W1-VAT-SETUP` | VAT Bus./Prod. Posting Group, VAT %, VAT Accounts | Welche Felder braucht die deutsche USt-Kette? | keine deutsche USt ohne Universaarl VAT Entries behaupten |
| `RO-W1-DIMENSIONS` | Dimension Code, Dimension Value Code, Value Posting | Welche Felder muessen vor Buchung fuer Reporting stehen? | keine Reportingwirkung ohne gebuchte Universaarl-Posten |

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
| `Posting Date` | Look and Feel/Posten/Reporting | geplant fuer Customer/Vendor/G/L/Item Ledger Entries | Zeitraumfilter, Reportfilter, Periodenvergleich | Universaarl geplant | braucht mehrere Buchungsdaten |
| `Document No.` | Look and Feel/Posten | geplant fuer alle Ledger-Entry-Listen | verbindet Belege, Posten und Nachverfolgung | Universaarl geplant | braucht gebuchte Belege |
| `Open` / Offen | Look and Feel/OP | geplant fuer Customer/Vendor Ledger Entries | trennt offene von ausgeglichenen Posten | Universaarl geplant | braucht Zahlung/Ausgleich |
| `Remaining Amount` / Restbetrag | Look and Feel/OP/Payments | geplant fuer Customer/Vendor Ledger Entries | zeigt offenen Betrag nach Zahlung oder Teilzahlung | Universaarl geplant | braucht OP- und Zahlungsfaelle |
| Dimension fields / `Shortcut Dimension 1/2` | Look and Feel/Reporting | geplant fuer Ledger Entries und Belege | Grundlage fuer Dimensionsfilter und `Filter totals by` | Universaarl geplant | braucht Dimension Foundation und gebuchte Dimensionen |
| `Status` | Look and Feel/Belege | geplant fuer Sales/Purchase Documents | trennt offene, freigegebene und gebuchte Arbeitsstaende | Universaarl geplant | Statuswirkung je Belegtyp separat belegen |

## Zero-Open-Questions-Regel

Jedes nicht verstandene Feld erzeugt entweder einen Eintrag in `.agent/state/open_questions_register.json` oder bekommt einen finalen Status aus `BC-ZERO-OPEN-QUESTIONS-POLICY.md`.

## UI-Look-and-Feel-Regel

Ein Feld gilt nicht als fehlend, bevor relevante FastTabs, Mehr anzeigen/Show more, horizontales Scrollen, FactBox-Ausblendung, Fokusmodus, Personalisierung und Page Inspection als sichere Sichtbarkeitswege geprueft wurden.

Filterfelder gelten erst als buchreif, wenn sie in einer Universaarl-Liste mit mehreren sinnvollen Treffern sichtbar und erklaerbar sind.
