# Setup-Readiness-Matrix

Stand: 16.06.2026

Diese Matrix zeigt, ob ein Prozess in `RM-DEMO` praktisch tragfaehig ist. Sie ist keine Freigabe fuer Buchungen oder Setup-Aenderungen. Gates aus `POSTING-AND-SETUP-GATES.md` bleiben vorrangig.

Company-Kontext: Alle Prozesszeilen gelten aktuell fuer `RM-DEMO`, solange keine andere Company explizit genannt ist. Seit `GOVERNANCE-012` ist `COMPANY-REGISTRY.md/json` die Pflichtquelle fuer Multi-Company-Arbeit in `MCP_1_20260210`. Neue Prozessfaelle muessen ihren Company-Kontext in Evidence und `PROCESS-CASE-REGISTRY.json` fuehren.

| Prozess | Stammdaten | Setup | Preflight | Buchung erlaubt? | Luecken | Naechster Schritt |
|---|---|---|---|---|---|---|
| Company Registry | `RM-DEMO` belegt; `RM-PROD`, `RM-SALES`, `RM-SERVICE`, `RM-SHARED`, `RM-AT` geplant | Registry angelegt, Live-Enumeration offen | kein BC-Lauf in `GOVERNANCE-012` | nein | sichtbare Company-Liste in BC noch offen; Zielcompanies noch nicht als existent belegt | `GOVERNANCE-013-COMPANY-LIST-READONLY` |
| O2C | `D10000`, `RM-M100`, `FRA-ZL`, `EUR`, `PRODUCTLINE=MACHINE`, `CHANNEL=B2B` belegt | CRONUS-Laborfit inkl. `FRA-ZL` + `RESALE` -> `14140` | Preview Posting und Postenspur belegt | nein, Referenzbuchung `PS-INV103297` nicht wiederholen | deutsche 19-%-USt, deutscher Kontenplan, finaler DE-Screenshot | nur read-only oder Buch-Sync; keine zweite O2C-Buchung |
| P2P | `K10000`, `RAW-STEEL`, `FRA-ZL` belegt | Vendor Template und CRONUS-Posting tragen im Labor | Preview/Buchung/Postenspur belegt | nein, Rechnung `108219` nicht wiederholen | deutsche Vorsteuer, deutscher Kontenplan, Kreditorenzahlung | nur Folge-Evidence oder Payment-Gate |
| Inventory | `RM-M100`, `RAW-STEEL`, `FRA-ZL` belegt | Inventory Posting Setup traegt im Labor | Journal Check und Inventory Valuation belegt | nein, `INV008-899959` nicht wiederholen | keine finalen DE-Lagerwerte, Warehouse nicht aktiv | nur read-only Trace oder neues Ziel mit Gate/Zweck |
| Payments / OP | `D10000`, `PS-INV103297`, `BANK-RM-01` belegt | Bankkonto-Fit CRONUS-Labor, Page `372` Bankposten sichtbar | Journal Check, Apply Entries, Zahlung `PAY011-PS103297` belegt | nein, Zahlung nicht wiederholen | Bankabstimmung offen, Kreditorenzahlung offen, DE-Bank/Compliance offen | nur mit neuem Gate oder neuem Evidence-Zweck |
| Reporting | gebuchte Posten und Artikelposten-Dimensionen belegt | Analysis View `REVENUE` passt nicht zu `PRODUCTLINE`/`CHANNEL`; `RM-PLCH` nicht angelegt | mehrere read-only Negativpfade belegt | nein | Financial-Reports-Summenwirkung offen; Analysis-View-Setup locked | neues Gate mit gescoptem New-/Kartenmuster oder alternativer offizieller Pfad |
| Fixed Assets | Zielobjekte `FA-CNC-01`, `MACHINES`, `HGB`, `K30000` fehlen | vorhandene CRONUS-Gruppen/Kontexte read-only belegt | `FIXEDASSETS-012` beweist nur leere Karten/Templates | nein | kein Setup-Fit, kein Zielcode-Screenshot, keine Anlage/AfA | `FIXEDASSETS-013-SETUP-FIT-DECISION`, kein BC-Lauf |
| Warehouse | `FRA-ZL` sichtbar | keine aktivierte Warehouse-/Bin-Logik belegt | Einstiegspfade read-only | nein | Bins, directed warehouse, Receipts/Picks nicht praktisch | nur mit Warehouse-Gate aktivieren |
| Manufacturing / Assembly | `RM-M100`, `RAW-STEEL` sichtbar; `COMP-CTRL`, `KIT-MAINT` fehlen | BOM/Routing/Assembly-Struktur nicht belegt | Tell-Me-Readiness | nein | Komponenten, BOM/Routing, Auftrag, Verbrauch, Output | Setup-Gate vor praktischem Lauf |
| Service | `D10000` sichtbar; Servicezielobjekte fehlen | Service Management Setup nur read-only | Einstiegspfade read-only | nein | Service Item, Ressource, Ersatzteil, Technikerlager | UI-first Setup-Gate vor Serviceauftrag |
| Projects | `D10000` sichtbar; Projektzielobjekte fehlen | Projekt-/WIP-Setup nicht belegt | Einstiegspfade read-only | nein | Projekt, Aufgaben, Ressource, Material, Lager | UI-first Setup-Gate vor Projektprozess |
| Dropshipping / Sonderverkauf | `D11000`, `K20000`, `SP-PUMP-01` fehlen | Purchasing-Code-/Drop-Shipment-Logik nicht belegt | Einstiegspfade read-only; Shopify gestrichen | nein | Zielstammdaten und Drop-Shipment-Prozess | nur mit Gate, ohne Shopify-Scope |
| Intercompany / Ausland | Zieldebitoren/Companies fehlen | IC Partner, VAT/Waehrung nicht eingerichtet | Einstiegspfade read-only | nein | neue Company, IC-Partner, Ausland/VAT/Waehrung | Gate `NEW-COMPANY-001`/IC noetig |
| Tax / VAT | CRONUS-USA Sales Tax belegt | deutsche 19-%-VAT-Matrix nicht eingerichtet | Gate-Readiness `TAX-002` | nein | DE-VAT Business/Product Groups, VAT Posting Setup, VAT Entries | praktischer DE-VAT-Fit nur mit Freigabe |
| Compliance / E-Rechnung | keine finalen deutschen Compliance-Stammdaten | E-Documents, Versandprofil, Change Log nicht eingerichtet | Readiness sichtbar | nein | E-Rechnung, Peppol/Provider, Archiv, GoBD, Change Log | eigenes Gate erforderlich |
| Security / Rollen | keine User-/Permission-Aenderung | Admin-Kontexte nur read-only | Readiness sichtbar | nein | SoD, Profile, Permission Sets, Security Groups | eigenes Gate erforderlich |
| Migration / Cutover | Zielstruktur beschrieben | kein Import/Opening Balance | Buch-Sync | nein | Configuration Packages, Salden, Abstimmung | eigenes Gate erforderlich |
| Integrationen / Operations | Zielbild beschrieben | keine Extension/API/Job Queue/Monitoring-Aenderung | Buch-Sync | nein | Connector, Power BI, Power Platform, Job Queue, Telemetry | eigenes Gate erforderlich |
