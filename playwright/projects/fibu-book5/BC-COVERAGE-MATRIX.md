# BC Coverage Matrix

Status: `labor-reference`, Stand: 2026-06-28.

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
| P2P | Teil-Wareneingang | `labor-gate-proven` | `L3`, `L8`, `L9` | Purchase Orders | `evidence/p2p-004/` | `img/p2p-004-*` | Kapitel 12 | noch keine Zeile, keine Teilmenge, kein Preview/Post | ja | `P2P-005` Line/Qty-Gate, danach Preview/Teil-WE |
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
