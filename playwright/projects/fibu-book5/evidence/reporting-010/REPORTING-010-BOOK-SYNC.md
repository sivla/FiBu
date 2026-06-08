# REPORTING-010 - Book/Evidence Sync nach REPORTING-009

Stand: 08.06.2026

## Einordnung

Dieser Lauf ist ein Buch-/Evidence-Sync ohne neue Business-Central-Ausfuehrung.

Status:

- Company: `RM-DEMO`
- Sandbox: `MCP_1_20260210`
- Modus: `labor`, `documentation-sync`, `no-posting`, `no-setup`
- Basis: `REPORTING-001` bis `REPORTING-009`, O2C-Laborrechnung `PS-INV103297`, Artikelposten `792`

## Aktuelle Reporting-Wahrheit

| Pruefpunkt | Ergebnis | Status |
|---|---|---|
| `Financial Reports` oeffnen | Seite ist read-only erreichbar | Labor belegt |
| `PRODUCTLINE=MACHINE` am Artikelposten | Auf Item Ledger Entry `792` ueber `Entry` -> `Dimensions` sichtbar | Labor belegt |
| `CHANNEL=B2B` am Artikelposten | Auf Item Ledger Entry `792` ueber `Entry` -> `Dimensions` sichtbar | Labor belegt |
| `REVENUE` Analysis View | Verwendet `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`, nicht `PRODUCTLINE`/`CHANNEL` | Labor-Negativbefund |
| `Dimensions - Detail` ueber Tell-Me | Zielbericht nicht sichtbar belastbar erreicht | Labor-Negativbefund |
| `Analysis by Dimensions` ueber Tell-Me | Suchpfad sichtbar, aber kein belastbarer Analysezustand mit Ziel-Dimensionen | Labor-Negativbefund |
| `G/L Entries` zu `PS-INV103297` | Sachposten sichtbar; `Department Code` und `Customergroup Code` sichtbar | Labor belegt |
| `PRODUCTLINE`/`CHANNEL` in `G/L Entries` | Nicht sichtbar; `Entry` -> `Dimensions` im Sachpostenkontext nicht belastbar erreicht | Labor-Negativbefund |
| Financial-Reports-Summe nach `PRODUCTLINE`/`CHANNEL` | Nicht nachgewiesen | Offen |

## Buchwirkung

Das Buch darf bereits erklaeren:

- Dimensionen koennen am Beleg und an bestimmten Posten sichtbar sein.
- In `RM-DEMO` ist `PRODUCTLINE=MACHINE`/`CHANNEL=B2B` am Artikelposten nachgewiesen.
- Sichtbare Shortcut-Spalten in Sachposten sind nicht automatisch alle fachlichen Dimensionen.
- Ein Finanzbericht nach `PRODUCTLINE`/`CHANNEL` braucht entweder passende Reporting-/Analysis-View-Einrichtung oder einen anderen belastbaren Standardpfad.

Das Buch darf noch nicht behaupten:

- dass `PRODUCTLINE`/`CHANNEL` in Sachposten sichtbar belegt sind.
- dass `Financial Reports` aktuell nach `PRODUCTLINE=MACHINE` oder `CHANNEL=B2B` auswerten.
- dass die O2C-Laborrechnung ein deutscher 19-%-USt- oder deutscher Kontenplan-Endstand ist.

## Naechster Hebel

Ohne ausdrueckliche Freigabe wird kein weiterer gleicher read-only Reportingpfad wiederholt.

Naechster praktischer Reporting-Hebel:

1. Freigabe fuer einen idempotenten Labor-Analysis-View-Fit mit `PRODUCTLINE` und `CHANNEL`.
2. Danach `Analysis by Dimensions` oder gleichwertige Matrix-/Financial-Reports-Sicht erneut pruefen.

Alternative ohne Setup-Freigabe:

- Buch-/Evidence-Sync fortsetzen.
- Einen anderen Prozessblock read-only pruefen.
- Offene deutsche VAT-/Finalnachweise vorbereiten, aber nicht im CRONUS-USA-Labor umdeuten.
