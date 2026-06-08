# REPORTING-004 Evidence-Index

Status: labor, read-only, no-posting, no-setup.

Umgebung: `MCP_1_20260210`, Company `RM-DEMO`, CRONUS USA. Ausgangspunkt ist die gebuchte O2C-Laborrechnung `PS-INV103297` und der nachgewiesene Artikelposten `792` mit `PRODUCTLINE=MACHINE` und `CHANNEL=B2B`. Es wurde keine neue Buchung und keine Analysis-View-Aktualisierung ausgefuehrt.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `REPORTING-004-result.json` | JSON-Ergebnis | Analysis Views ist erreichbar; `REVENUE` ist als Analysis View sichtbar; eingerichtete Dimensionen sind `AREA`, `DEPARTMENT`, `CUSTOMERGROUP` | `PRODUCTLINE`/`CHANNEL` als Auswertungsachse | labor-negativ |
| `REPORTING-004-ANALYSIS-VIEWS.md` | Lernzusammenfassung | warum eine vorhandene Analysis View nicht automatisch die Buchdimensionen auswertet | deutsche finale Reportingwirkung | labor |
| `010-tell-me-analysis-views-page-text.txt` | UI-Auszug | Tell-Me findet `Analysis Views` | richtige Dimensionsauswertung | labor |
| `020-analysis-views-list-page-text.txt` | UI-Auszug | Analysis-Views-Liste zeigt u. a. `GEN_LEDGER` und `REVENUE` | PRODUCTLINE-/CHANNEL-Auswertung | labor |
| `020-analysis-views-list-buttons.json` | UI-Aktionen | sichtbare Analysis-Views-Spalten und Aktionen | fachliche Zahlenwirkung | labor |
| `030-revenue-analysis-view-card-page-text.txt` | UI-Auszug | `REVENUE` Analysis View Card zeigt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`; `PRODUCTLINE`/`CHANNEL` fehlen | Matrix- oder Dimensions-Detail-Auswertung | labor-negativ |
| `030-revenue-analysis-view-card-buttons.json` | UI-Aktionen | sichtbare Card-Aktionen wie `Update`, `Filter`, `Dimensions` | dass diese Aktionen ausgefuehrt wurden | labor |
| `reporting-004-020-analysis-views-list.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen des Listenbilds | eigene fachliche Wahrheit ohne JSON/Markdown | labor |
| `reporting-004-030-revenue-analysis-view-card.screenshot.json` | Screenshot-Metadaten | Zweck und Grenzen der REVENUE-Card | finaler Reportingbeweis | labor |

## Kernaussage

`Analysis Views` ist der richtige naechste Reporting-Ort, aber die vorhandene `REVENUE`-View ist nicht auf die Buchdimensionen `PRODUCTLINE` und `CHANNEL` eingerichtet. Sie nutzt im Labor `AREA`, `DEPARTMENT` und `CUSTOMERGROUP`. Damit bleibt die Auswertung nach `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` offen.

## Naechster Schritt

Read-only `Dimensions - Detail` pruefen. Danach kontrolliert entscheiden, ob eine zusaetzliche Analysis View fuer `PRODUCTLINE`/`CHANNEL` eingerichtet und aktualisiert werden muss.
