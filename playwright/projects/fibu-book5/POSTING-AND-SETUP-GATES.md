# Posting- und Setup-Gates fuer FiBu Buch 5

Stand: 2026-06-09

Diese Datei ist die Freigabe-Leitplanke fuer autonome Laeufe in `RM-DEMO` / `MCP_1_20260210`. Sie verhindert versehentliche Doppelbuchungen, neue Setup-Aenderungen ohne fachliche Entscheidung und das Umdeuten von CRONUS-USA-Laborbefunden in deutsche Finalnachweise.

Regel: Ein Gate ist gesperrt, solange der aktuelle Prompt oder diese Datei es nicht ausdruecklich fuer genau den naechsten Lauf freigibt. Alte Chat-Historie oder fruehere Bereitschaftsdateien zaehlen nicht als aktuelle Freigabe.

## Gate-Matrix

| Gate-ID | Status | Risiko | Freigabequelle | Erlaubte Aktion | Evidence-Pflicht | Rueckfallregel |
|---|---|---|---|---|---|---|
| `PAYMENTS-011-LAB-PAYMENT` | locked | Zahlung, OP-Ausgleich und Bankposten koennen echte Folgeposten erzeugen | keine aktuelle Freigabe | genau eine kontrollierte Laborzahlung, falls freigegeben | Zahlungsbeleg, Customer/Vendor Ledger Entries, Bank/G/L Entries, Apply-Status, Buchwirkung | ohne Freigabe nur read-only Payments- oder Buch-Sync |
| `REPORTING-011-ANALYSIS-VIEW-FIT` | locked | Aendert Reporting-Setup und kann alte Negativbefunde ueberdecken | keine aktuelle Freigabe | idempotente Analysis View fuer `PRODUCTLINE`/`CHANNEL` anlegen oder aktualisieren | Vorher/Nachher, Screenshot, JSON, Reportingwirkung oder negativer Beleg | ohne Freigabe keinen weiteren gleichen Reporting-Read-only-Pfad wiederholen |
| `TAX-002-DE-VAT-FIT` | locked | Deutsche USt-/VAT-Einrichtung und Steuerposten koennen falsch behauptet werden | keine aktuelle Freigabe | VAT Business/Product Posting Groups, VAT Posting Setup, Preview und VAT Entries fuer Zielbeleg | Setup-Werte, Preview, VAT Entries, klare Labor-/DE-Trennung | ohne Freigabe nur `TAX-001`/Buch-Sync fortfuehren |
| `FIXEDASSETS-004-SETUP-OR-POSTING` | locked | Anlagenstamm, AfA-Buch, Anlagenbuchungsgruppen und Anlagenposten veraendern Setup und Ledger | keine aktuelle Freigabe | `MACHINES`, `FA-CNC-01`, `HGB`, `K30000` anlegen oder Anlagenzugang/AfA buchen | Vorher/Nachher, Preview soweit moeglich, FA Ledger/G/L/Vendor Entries bei Buchung | `FIXEDASSETS-008` Buch-/Checklisten-Sync ist erledigt; ohne Freigabe kein weiteres Fixed-Assets-Setup und keine Buchung |
| `WAREHOUSE-001-ACTIVATION` | locked | Lagerort-/Bin-/Warehouse-Setup veraendert spaetere Lagerprozesse | keine aktuelle Freigabe | Bins, Warehouse Receipts, Put-aways, Picks oder Location-Aktivierung einrichten | Setup-Screenshots, Prozessnachweis, Rueckwirkung auf `FRA-ZL` | `WAREHOUSE-001` Readiness und `WAREHOUSE-002` Buch-Sync sind erledigt; ohne Freigabe andere read-only Vorbereitung |
| `MANUFACTURING-001-POSTING` | locked | Verbrauch, Output, Kapazitaet und Kostenposten entstehen | keine aktuelle Freigabe | kontrollierte Fertigungs-/Montagebuchung | Item/Value/Capacity/G/L Entries, Kostenwirkung | `MANUFACTURING-001` Readiness und `MANUFACTURING-002` Buch-Sync sind erledigt; ohne Freigabe anderer read-only Block |
| `SERVICE-001-POSTING` | locked | Serviceauftrag kann Artikel-, Ressourcen- und Rechnungsfolgen erzeugen | keine aktuelle Freigabe | kontrollierte Servicebuchung | Servicebeleg, Item/Resource/G/L Entries, Rechnungsspur | `SERVICE-001` Readiness und `SERVICE-002` Buch-Sync sind erledigt; ohne Freigabe kein Service-Setup und keine Servicebuchung |
| `PROJECTS-001-POSTING` | locked | Projektposten, WIP oder Faktura koennen entstehen | keine aktuelle Freigabe | kontrollierte Projektbuchung oder Faktura | Job Ledger Entries, WIP/G/L, Rechnungsspur | ohne Freigabe nur Project-Readiness |
| `NEW-COMPANY-001` | locked | Neue Company erzeugt Umgebungsdrift und Handover-Risiko | keine aktuelle Freigabe | neue Company anlegen oder wechseln | Company-Erstellung, Startsetup, Handover, Scope-Begruendung | ohne Freigabe nur `RM-DEMO` nutzen |
| `O2C-REPOST-001` | locked | zweite O2C-Buchung wuerde `PS-INV103297` als Referenz verwischen | keine aktuelle Freigabe | zweiter O2C-Laborbeleg nur mit neuem Zweck | neue Belegnummer, Preview, Postenspur, warum Wiederholung noetig war | ohne Freigabe `PS-INV103297` read-only nutzen |
| `P2P-REPOST-001` | locked | zweite P2P-Buchung wuerde `108219` als Referenz verwischen | keine aktuelle Freigabe | zweiter P2P-Laborbeleg nur mit neuem Zweck | neue Belegnummer, Preview, Postenspur, warum Wiederholung noetig war | ohne Freigabe `108219` read-only nutzen |
| `INVENTORY-REPOST-INV008` | locked | zweite Inventory-Buchung wuerde Zielbestand und Valuation veraendern | keine aktuelle Freigabe | zweite Inventory-/Target-Stock-Buchung nur mit neuem Zweck | neue Dokumentnummer, Item/Value/G/L Entries, Inventory Valuation | ohne Freigabe `INV008-899959` read-only nutzen |

## Statusregeln

- `locked`: keine Setup-Aenderung oder Buchung.
- `approved-for-next-run`: Freigabe gilt nur fuer genau einen folgenden Lauf und muss danach entfernt oder auf `done-labor`/`locked` gesetzt werden.
- `done-labor`: kontrollierte Laboraktion wurde ausgefuehrt und mit Evidence belegt; Wiederholung bleibt gesperrt.
- `rejected`: der Pfad wurde versucht und als nicht tragfaehig dokumentiert.

## Aktuelle Konsequenz

`FIXEDASSETS-008` hat Kapitel 21 mit der Readiness-Kette `FIXEDASSETS-005` bis `FIXEDASSETS-007` abgeglichen. Ohne ausdrueckliche Freigabe bleibt Fixed Assets danach fuer Setup und Buchung gesperrt. `FIXEDASSETS-006` hat vorhandene CRONUS-Konten in `FA Posting Groups` gelesen; `FIXEDASSETS-007` hat `Depreciation Books` und `FA Classes` gelesen. Diese Schritte sollen nicht wiederholt werden, solange kein neuer Hebel vorliegt.

`WAREHOUSE-001` hat `FRA-ZL` und Warehouse-Einstiegspfade read-only geprueft; `WAREHOUSE-002` hat Kapitel 13 mit diesem Befund synchronisiert. Ohne ausdrueckliche Freigabe bleibt Warehouse-Aktivierung gesperrt: keine Bins anlegen, keine Lagerortfelder aktivieren, keine Warehouse Receipts/Put-aways/Picks/Shipments erzeugen oder buchen.

`MANUFACTURING-001` hat Manufacturing-/Assembly-Einstiege und Zielartikel read-only geprueft. Sichtbar sind Planning Worksheet, Production BOMs, Routings, Released Production Orders, Consumption Journal und Output Journal als Tell-Me-Einstiege sowie `RM-M100` und `RAW-STEEL` als Artikel. Nicht sichtbar sind `Assembly Orders` als stabiler Suchtreffer sowie die geplanten Artikel `COMP-CTRL` und `KIT-MAINT`; sichtbare BOM-/Routing-Marker auf den Artikelkarten wurden nicht nachgewiesen. `MANUFACTURING-002` hat Kapitel 14 mit diesem Laborstand synchronisiert und `INV008-899959` ausdruecklich als Trainingsbestand statt Manufacturing-Output markiert. Ohne ausdrueckliche Freigabe bleibt jede Fertigungs-/Montageeinrichtung und jede Buchung gesperrt. Manufacturing ist ohne Gate vorerst abgeschlossen.

`SERVICE-001` hat Service-Einstiege und Zielobjekte read-only geprueft. Tell-Me zeigt `Service Orders`, `Service Items`, `Resources`, `Service Management Setup`, `Service Contracts` und `Service Ledger Entries`; `D10000` ist sichtbar. Die konkreten Zielobjekte `RM-M100-SN1001`, `SP-PUMP-01`, `RES-TECH` und `VAN-SERV` sind im gefilterten Laborlauf nicht als Nummern sichtbar. `SERVICE-002` hat Kapitel 15 mit diesem Laborstand synchronisiert: sichtbare Service-Seiten sind nur Readiness, die Schrittfolge `SERV-4001` bleibt Zielpfad. Ohne ausdrueckliche Freigabe bleibt Service-Setup und jede Servicebuchung gesperrt: keinen Serviceartikel anlegen, kein Ersatzteil anlegen oder verbrauchen, keine Ressource anlegen oder erfassen, keinen Serviceauftrag `SERV-4001`, keine Servicerechnung. Naechster Schritt ohne Gate ist `PROJECTS-001-READINESS` read-only.
