# REPORTING-002 Evidence-Index

Status: labor, read-only, no-posting.

Umgebung: `MCP_1_20260210`, Company `RM-DEMO`, CRONUS USA. Ausgangsbeleg ist die einmalig gebuchte O2C-Laborrechnung `PS-INV103297` aus Auftrag `S-ORD101068`. Es wurde keine neue Buchung erzeugt.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `REPORTING-002-result.json` | JSON-Ergebnis | strukturierter Gesamtbefund zu Sachposten, Wertposten, Artikelposten und Financial Reports | keine deutsche USt, keine Financial-Reports-Summenwirkung | labor |
| `REPORTING-002-PRODUCTLINE-CHANNEL.md` | Lernzusammenfassung | fachliche Trennung zwischen Postendimension und Reportingauswertung | keinen finalen deutschen Buchtext | labor |
| `010-gl-entries-ps-inv103297-page-text.txt` | UI-Seitentext | G/L Entries zur Rechnung `PS-INV103297` sind erreichbar | `PRODUCTLINE`/`CHANNEL` in Sachposten sichtbar | labor-negativ |
| `010-gl-entries-ps-inv103297-buttons.json` | UI-Aktionen | sichtbare Buttons im aktuellen G/L-Entries-Kontext | keinen Dimensionsdialog | labor |
| `020-gl-entry-dimensions-page-text.txt` | UI-Seitentext | Dimensionsdialog auf G/L Entries wurde im aktuellen Lauf nicht erreicht | Dimensionswerte auf Sachposten | rejected |
| `030-posted-sales-invoice-ps-inv103297-page-text.txt` | UI-Seitentext | Posted Sales Invoice `PS-INV103297` ist erreichbar | Dimensionssicht oder Reportingwirkung | labor |
| `040-value-entries-ps-inv103297-page-text.txt` | UI-Seitentext | Value Entries zur Rechnung sind erreichbar | Dimensionswerte im Wertposten | labor |
| `045-item-ledger-entry-792-page-text.txt` | UI-Seitentext | Item Ledger Entry `792` ist erreichbar | Dimensionswerte ohne Dialog | labor |
| `046-item-ledger-entry-792-dimensions-page-text.txt` | UI-Seitentext | `Entry` -> `Dimensions` auf Item Ledger Entry `792` zeigt `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` | Financial-Reports-Auswertung | labor |
| `050-tell-me-financial-reports-page-text.txt` | UI-Seitentext | Tell-Me findet Financial Reports | richtige Berichtsauswertung | labor |
| `055-financial-reports-list-page-text.txt` | UI-Seitentext | Financial Reports ist erreichbar; Reports und Optionen sind sichtbar | `PRODUCTLINE`/`CHANNEL` als Filter/Summe | labor |
| `055-financial-reports-list-buttons.json` | UI-Aktionen | sichtbare Optionen wie `Dimension Perspective`, `Column Definition` | deren fachliche Wirkung | labor |
| `060-financial-report-*-page-text.txt` | UI-Seitentext | `Income Statement`, `Revenue`, `Balance Sheet` sind auswählbar | Dimensionsergebnis oder Zahlenwirkung | labor |
| `*.screenshot.json` | Screenshot-Metadaten | Zweck, Status, Grenzen der jeweiligen PNGs | keine eigene fachliche Wahrheit ohne Text/JSON-Evidence | labor/rejected |

## Kernaussage

`PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten `Entry No. 792` erneut sichtbar. In `G/L Entries` und `Financial Reports` sind sie in diesem Lauf nicht als sichtbare Filter- oder Summenachse nachgewiesen. Financial Reports zeigt zwar `Dimension Perspective` und `Column Definition`; `REPORTING-003` hat den schnellen `Dimension Perspective`-Pfad danach aber als nicht belegten Sichtnachweis eingeordnet.

## Naechster Schritt

Naechster read-only Schritt ist `Dimensions - Detail` oder Analysis Views. Ziel ist ein belastbarer Reportingpfad nach `PRODUCTLINE=MACHINE` und `CHANNEL=B2B`, ohne eine weitere O2C-Buchung.
