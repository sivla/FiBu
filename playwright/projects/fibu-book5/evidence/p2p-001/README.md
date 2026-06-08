# P2P-001 Evidence-Index

Status: labor, readiness, no-posting.

Umgebung: `MCP_1_20260210`, Company `RM-DEMO`, CRONUS USA. Dieser Block bereitet `UAT-P2P-001` vor, bucht aber keine Einkaufsbestellung, keinen Wareneingang und keine Einkaufsrechnung.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `P2P-READINESS.json` | JSON-Ergebnis | K10000, RAW-STEEL, FRA-ZL, Vendor-Template-Fit, RAW-STEEL-Labor-Posting-Fit und temporäre Entwurfsprobe | keine Buchung, keine Preview Posting Posten, keine deutsche 19-%-Vorsteuer | labor |
| `P2P-READINESS.md` | Lernzusammenfassung | warum P2P zuerst Stammdaten-/Setup-Readiness braucht | keinen finalen P2P-Prozess | labor |
| `005-vendor-template-application-page-text.txt` | UI-Seitentext | `Apply Template` wurde auf K10000 genutzt | konkrete Vendor-Posting-Group im sichtbaren Text | labor |
| `010-vendor-k10000-page-text.txt` | UI-Seitentext | Vendor Card `K10000` ist erreichbar | vollständige Invoicing-/Posting-Feldsicht | labor |
| `020-item-raw-steel-page-text.txt` | UI-Seitentext | Item Card `RAW-STEEL` ist erreichbar; Kosten-/Posting-Kontext sichtbar | deutsche Rohmaterial-Postinggruppen | labor |
| `030-purchase-order-draft-cleanup.json` | JSON-Cleanup | temporärer Purchase Order Draft wurde gelöscht | keine Buchung | labor |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status und Grenzen der PNGs | keine eigene fachliche Wahrheit ohne JSON/Markdown | labor |

## Kernaussage

`K10000` und `RAW-STEEL` existieren jetzt in `RM-DEMO`. `K10000` bekam einen CRONUS-Vendor-Template-Fit; `RAW-STEEL` nutzt als reinen Labor-Technikfit `RETAIL` / `RESALE` / `FURNITURE`. Eine temporäre Einkaufsbestellung mit Zeile `RAW-STEEL`, Menge `10`, `Direct Unit Cost = 2500` und Lagerort `FRA-ZL` konnte angelegt und gelöscht werden.

## Grenzen

- Der Entwurf läuft in der aktuellen CRONUS-USA-Basis mit `USD` und `Tax Percent = 0`.
- Das ist kein deutscher Vorsteuer-Endstand.
- Vendor Posting Setup, General Posting Setup und Inventory Posting Setup sind nur indirekt bis zur Entwurfszeile geprüft; die echte Buchungswirkung kommt erst im nächsten Preview-Posting-Lauf.

## Naechster Schritt

`UAT-P2P-001` als Preview-Readiness-Lauf: Einkaufsbestellung erzeugen, `Preview Posting` öffnen, Postenarten und mögliche Setup-Blocker dokumentieren, Entwurf danach bereinigen. Weiterhin nicht buchen.
