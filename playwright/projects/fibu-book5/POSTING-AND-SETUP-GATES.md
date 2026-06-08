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
| `FIXEDASSETS-004-SETUP-OR-POSTING` | locked | Anlagenstamm, AfA-Buch, Anlagenbuchungsgruppen und Anlagenposten veraendern Setup und Ledger | keine aktuelle Freigabe | `MACHINES`, `FA-CNC-01`, `HGB`, `K30000` anlegen oder Anlagenzugang/AfA buchen | Vorher/Nachher, Preview soweit moeglich, FA Ledger/G/L/Vendor Entries bei Buchung | ohne Freigabe nur `FIXEDASSETS-007` read-only: vorhandene AfA-Buecher/Depreciation Books und Anlagenklassen lesen |
| `WAREHOUSE-001-ACTIVATION` | locked | Lagerort-/Bin-/Warehouse-Setup veraendert spaetere Lagerprozesse | keine aktuelle Freigabe | Bins, Warehouse Receipts, Put-aways, Picks oder Location-Aktivierung einrichten | Setup-Screenshots, Prozessnachweis, Rueckwirkung auf `FRA-ZL` | ohne Freigabe nur read-only Warehouse-Readiness |
| `MANUFACTURING-001-POSTING` | locked | Verbrauch, Output, Kapazitaet und Kostenposten entstehen | keine aktuelle Freigabe | kontrollierte Fertigungs-/Montagebuchung | Item/Value/Capacity/G/L Entries, Kostenwirkung | ohne Freigabe nur Manufacturing-Readiness |
| `SERVICE-001-POSTING` | locked | Serviceauftrag kann Artikel-, Ressourcen- und Rechnungsfolgen erzeugen | keine aktuelle Freigabe | kontrollierte Servicebuchung | Servicebeleg, Item/Resource/G/L Entries, Rechnungsspur | ohne Freigabe nur Service-Readiness |
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

Ohne ausdrueckliche Freigabe ist der naechste sinnvolle praktische Schritt `FIXEDASSETS-007` als read-only-Lauf: vorhandene AfA-Buecher/Depreciation Books und Anlagenklassen lesen und dokumentieren. `FIXEDASSETS-006` hat die vorhandenen CRONUS-Konten in `FA Posting Groups` bereits gelesen; dieser Schritt soll nicht wiederholt werden, solange kein neuer Hebel vorliegt.
