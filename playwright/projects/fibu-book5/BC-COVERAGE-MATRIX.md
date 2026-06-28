# BC Coverage Matrix

Status: `labor-reference`, Stand: 2026-06-28.

Company-Usecase: `BC-COMPANY-USECASE.md` definiert `RM-DEMO` als Labor-/Vorproduktionscompany in `MCP_1_20260210` und beschreibt die spaetere Rhein-Main-Zielgruppe fuer German-Final-Rebuilds.

Coverage-Level:

| Level | Bedeutung |
|---|---|
| `L0 planned` | Prozess geplant, noch kein Page-Nachweis |
| `L1 page-found` | relevante Page ist erreichbar |
| `L2 fields-actions-visible` | Felder, Spalten oder Actions sind sichtbar |
| `L3 values-entered` | Zielwerte wurden kontrolliert eingegeben |
| `L4 preview-proven` | Preview Posting oder vergleichbarer Preflight ist belegt |
| `L5 posted-or-executed` | Prozess wurde bewusst ausgefuehrt/gebucht |
| `L6 ledger-traced` | Nebenbuch-/Hauptbuch-/Wertposten sind nachvollzogen |
| `L7 error-correction-tested` | Fehler und Korrekturweg sind getestet |
| `L8 book-synced` | Buchdraft/Buchmaster/Coverage sind synchron |
| `L9 german-final-rebuild-needed` | Labor reicht fuer Draft, muss deutsch neu belegt werden |
| `L10 german-final-proven` | deutscher Finalnachweis liegt vor |

## Prozessmatrix

| Bereich | Prozess | Status | hoechste Stufe | wichtigste Pages | Evidence | Screenshots | Buchkapitel | offene Laborgrenzen | deutscher Final-Rebuild | naechster Schritt |
|---|---|---|---|---|---|---|---|---|---|---|
| P2P | Purchase Order -> Posted Purchase Invoice | `labor-proven` | `L8`, `L9` | Purchase Orders, Preview Posting, Posted Purchase Invoice, Vendor Ledger Entries, G/L Entries, Item Ledger Entries, Value Entries | `evidence/p2p-001/` | P2P-001 Bilder | Kapitel 12 | USD/0% Tax, kein deutscher Kontenplan | ja | deutsche Finalstrecke spaeter neu erzeugen |
| P2P | Vendor Payment / OP-Ausgleich | `labor-proven` | `L8`, `L9` | Payment Journal, Apply Entries, Vendor Ledger Entries, Detailed Vendor Ledger Entries, Bank Account Ledger Entries, G/L Entries | `evidence/p2p-002/`, `evidence/p2p-003/` | P2P-002/P2P-003 Bilder | Kapitel 12, 19, 20 | keine Bankabstimmung, Payment Discount nur CRONUS-Labor | ja | Bankabstimmung separat |
| P2P | Teil-Wareneingang | `labor-gate-proven` | `L3`, `L8`, `L9` | Purchase Orders | `evidence/p2p-004/` | `img/p2p-004-*` | Kapitel 12 | Header-/Vendor-Gate, aber noch keine Zielwerte/Preview/Post | ja | Werteingabe-Helper vor Preview stabilisieren |
| P2P | Teil-Wareneingang Zeilen-Gate | `labor-blocked` | `L3`, `L8`, `L9` | Purchase Order `106051` | `evidence/p2p-005/` | `img/p2p-005-*` | Kapitel 12 | Lines-Grid-Controlroute nicht sicher; `RAW-STEEL`, Menge `4`, Preis `2500`, `Qty. to Receive 2` nicht nachgewiesen | ja | `P2P-006` Lines/Grid-Control-Diagnose auf Draft `106051` |
| P2P | Teil-Wareneingang Lines/Grid-Diagnose | `labor-blocked` | `L2`, `L8`, `L9` | Purchase Order `106051`, Purchase Order Subform | `evidence/p2p-006/` | `img/p2p-006-*` | Kapitel 12 | breite Layoutansicht und Fokusmodus belegt; keine Datenzeile sichtbar, Zielwerte nicht editierbar nachgewiesen | ja | gezielten Datenzeilen-Erzeugungs-/Select-items-Pfad oder neuen sauberen Teil-WE-Draft pruefen |
| P2P | Teil-Wareneingang Datenzeile per Select items | `labor-proven` | `L3`, `L8`, `L9` | Purchase Order `106051`, Select items, Purchase Order Subform | `evidence/p2p-007/` | `img/p2p-007-*` | Kapitel 12 | `RAW-STEEL`-Zeile sichtbar, aber Zielwerte `FRA-ZL`, Menge `4`, `Qty. to Receive 2` nicht bestaetigt | ja | `P2P-008` Zielwerteingabe pruefen |
| P2P | Teil-Wareneingang Zielwerteingabe | `labor-blocked` | `L3`, `L8`, `L9` | Purchase Order `106051`, Purchase Order Subform | `evidence/p2p-008/` | `img/p2p-008-*` | Kapitel 12 | sichtbare `RAW-STEEL`-Zeile, aber `Location Code FRA-ZL`, Menge `4` und `Qty. to Receive 2` nicht sichtbar gespeichert; Standard `ATLANTA, GA` bleibt | ja | `P2P-009` BC Grid Edit-Helper/Bearbeiten-Modus stabilisieren |
| P2P | Teil-Wareneingang Purchase-Lines Cell-Edit-Helper | `labor-blocked` | `L3`, `L8`, `L9` | Purchase Order `106051`, Purchase Order Subform | `evidence/p2p-009/` | `img/p2p-009-*` | Kapitel 12 | frame-aware Header/Zellen und Action-Kandidaten erfasst; `Direct Unit Cost 2.500,00` sichtbar; `FRA-ZL`, Menge `4`, `Qty. to Receive 2` weiterhin nicht sichtbar gespeichert | ja | echten Edit-Mode-/Cell-Editor-Pfad finden oder frischen kontrollierten Draft-/Select-items-Route nutzen; keine Preview vorher |
| P2P | Teil-Wareneingang Select-items Wert-Route | `labor-blocked` | `L3`, `L8`, `L9` | Purchase Order `106054`, Select items, Purchase Order Subform | `evidence/p2p-010/` | `img/p2p-010-*` | Kapitel 12 | `RAW-STEEL` sichtbar direkt ausgewaehlt, Suche bewusst nicht geoeffnet; Zielwerte `FRA-ZL`, Menge `4`, `Qty. to Receive 2`, Unit Cost `2500` nicht sichtbar gesetzt | ja | keine Wiederholung von Select-items/Search; echte Edit-Action oder alternative Standard-UI |
| P2P | Teil-Wareneingang Edit-Action-Discovery | `labor-blocked` | `L2`, `L8`, `L9` | Purchase Order `106054`, More options, Line menu | `evidence/p2p-011/` | `img/p2p-011-*` | Kapitel 12 | More options/Line-Menues sichtbar inventarisiert; keine direkte sichere Edit/List-Edit-Route fuer Location/Menge/Qty. to Receive gefunden | ja | `P2P-012` alternative Standard-UI wie Purchase Journal/Item Journal oder sauberere Lab-Company |
| O2C | Sales Order -> Posted Sales Invoice | `labor-proven` | `L6`, `L8`, `L9` | Sales Orders, Preview Posting, Posted Sales Invoice, Customer Ledger Entries, G/L Entries, Item Ledger Entries, Value Entries | `evidence/uat-o2c-001/` | O2C Bilder | Kapitel 11 | deutsche 19% USt offen | ja | deutsche Finalstrecke spaeter |
| Payments/Bank | Customer Payment / Bank trace | `labor-proven` | `L6`, `L8`, `L9` | Cash Receipt Journal, Apply Entries, Bank Account Ledger Entries | `evidence/payments-011/`, `payments-013/` | Payments Bilder | Kapitel 19, 20 | keine Kontoauszugs-/Bankabstimmung | ja | Bank Reconciliation Case |
| Fixed Assets | FA acquisition via FA G/L Journal | `labor-proven` | `L6`, `L8`, `L9` | Fixed Asset Card, FA G/L Journal, G/L Entries, FA Ledger Entries Page 5604 | `evidence/fixedassets-225/`, `227`, `229`, `231` | Fixed Assets Bilder | Kapitel 21 | Einkaufsrechnung Art=Anlage offen, Page 5606 rejected | ja | AfA/Journallinie oder deutscher Rebuild |
| Fixed Assets | Depreciation | `labor-blocked` | `L3`, `L8`, `L9` | Calculate Depreciation, Fixed Asset G/L Journals, General Journal Batches | `evidence/fixedassets-291/` | Fixed Assets Bilder | Kapitel 21 | OK erzeugte keine sichtbare Journalzeile im geprueften Kontext | ja | bounded AfA-Follow-up |
| VAT/E-Rechnung | deutsche Steuer/E-Rechnung | `planned` | `L0`, `L9` | VAT Posting Setup, E-Documents, Incoming Documents | `evidence/tax-*`, `compliance-*` | Teilbilder | Kapitel 10, 12, 30 | kein deutscher Finalnachweis | ja | deutsche Zielinstanz noetig |
| Inventory Costing | Inventory trace and valuation | `labor-proven` | `L6`, `L8`, `L9` | Item Ledger Entries, Value Entries, Inventory Valuation | `evidence/inventory-001/`, `inventory-002/` | Inventory Bilder | Kapitel 13 | negative Bewertung/CRONUS-Kontext muss erklaert werden | ja | Zielbestand/Costing-Strecke |
| Dimensions/Reporting | PRODUCTLINE/CHANNEL | `partial-labor` | `L6`, `L8`, `L9` | Item Ledger Entries, G/L Entries, Analysis Views, Financial Reports | `evidence/reporting-*` | Reporting Bilder | Kapitel 10, 25 | Financial Reports nach Dimension nur teilweise/negativ belegt | ja | Analysis View/Report-Fit |
| Month-End/Record-to-Report | Abschluss | `planned` | `L0` | Accounting Periods, Financial Reports, Journals | offen | offen | Kapitel 24, 25 | nicht durchgespielt | ja | nach Prozessbasis |
| Migration/Cutover | Rebuild Map | `labor-reference` | `L8`, `L9` | Companies, Company Information, Setup Pages | `.agent/state/german-final-rebuild-map.json` | diverse | Kapitel 28, 31 | deutsche Zielinstanz fehlt | ja | Zielinstanz registrieren |
| Intercompany | Intercompany | `readiness` | `L1` | Companies, Intercompany Setup | `evidence/intercompany-*` | Teilbilder | Kapitel 29 | nicht ausgefuehrt | ja | spaeter |
| Projects | Projects | `readiness` | `L1` | Projects/Jobs | `evidence/projects-*` | Teilbilder | Kapitel 16 | nicht ausgefuehrt | ja | spaeter |
| Service | Service | `readiness` | `L1` | Service Items, Service Orders | `evidence/service-*` | Teilbilder | Kapitel 18 | nicht ausgefuehrt | ja | spaeter |
| Manufacturing | Manufacturing | `readiness` | `L1` | BOM, Routings, Production Orders | `evidence/manufacturing-*` | Teilbilder | Kapitel 14 | nicht ausgefuehrt | ja | spaeter |
| Security/Admin | Roles/Users/Admin | `readiness` | `L1` | Users, Permission Sets, Companies | `evidence/security-*`, `governance-*` | Teilbilder | Kapitel 26, 31 | nicht final | ja | spaeter |
| Master Data | Foundation, Dimensions, Items, Customers, Vendors, Locations | `labor-partial` | `L5`, `L8`, `L9` | Master Data Pages, Posting Setup Pages | `evidence/masterdata-*` | diverse | Kapitel 6-10 | API-Historie und CRONUS-Fits trennen | ja | UI-first Rebuild in Zielcompany |
| Setup/Foundation | Company/Posting Groups/Number Series | `labor-partial` | `L5`, `L8`, `L9` | Company Information, Posting Groups, Setup Pages | `evidence/foundation-*`, `masterdata-*` | diverse | Kapitel 6-10 | kein deutscher Zielmandant | ja | German setup baseline |
