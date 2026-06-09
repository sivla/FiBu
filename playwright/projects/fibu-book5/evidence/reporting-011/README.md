# REPORTING-011 Evidence Index

Status: `labor`, `ui-first`, `setup-fit-attempt`, `rejected`, `no-posting`, `not-final`.

## Kurzbefund

`REPORTING-011` hat das durch `GOVERNANCE-006` freigegebene Analysis-View-Gate verbraucht. Die Business-Central-Seite `Analysis Views` ist in `MCP_1_20260210` / `RM-DEMO` erreichbar. Sichtbar sind die vorhandenen Views `GEN_LEDGER` und `REVENUE`, die Dimensionsspalten `Dimension 1 Code` bis `Dimension 4 Code` sowie die Aktionen `Analysis by Dimensions` und `Update`.

Der Ziel-Fit `RM-PLCH` fuer `PRODUCTLINE`/`CHANNEL` wurde nicht angelegt oder aktualisiert, weil in diesem Lauf keine sichere editierbare Feldzuordnung sichtbar war. Es wurde nicht gebucht, keine Zahlung ausgefuehrt und keine Bankabstimmung gestartet.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `REPORTING-011-result.json` | JSON-Ergebnis | Sandbox, Company, Zielwerte, UI-Zugang, sichtbare Aktionen, rejected-Fit und No-Posting-Status | keine Reporting-Summe, keine angelegte Analysis View | `labor/rejected` |
| `REPORTING-011-ANALYSIS-VIEW-FIT.md` | Lern-/Buchzusammenfassung | warum Analysis View ein eigener Reporting-Setup-Schritt ist und warum der Fit nicht per API abgekuerzt wurde | keinen deutschen Finalnachweis | `labor/rejected` |
| `010-tell-me-analysis-views-page-text.txt` | kompakter UI-Text | Tell-Me-/Role-Center-Ausgangskontext vor dem Seitenfallback | keine Zielanlage | `labor` |
| `020-analysis-views-before-fit-page-text.txt` | kompakter UI-Text | Analysis-Views-Liste vor Fit-Versuch mit vorhandenen Views und Dimensionsspalten | keine editierbare Feldzuordnung | `labor` |
| `020-analysis-views-before-fit-buttons.json` | Button-/Textliste | sichtbare Aktionen und Spaltenbegriffe vor Fit-Versuch | keine Feldwerteingabe | `labor` |
| `030-analysis-views-after-fit-page-text.txt` | kompakter UI-Text | unveraenderter Ergebniszustand nach abgebrochenem Fit-Versuch | keine Anlage von `RM-PLCH` | `rejected` |
| `030-analysis-views-after-fit-buttons.json` | Button-/Textliste | sichtbare Aktionen nach Fit-Versuch | keine Reportingwirkung | `rejected` |
| `reporting-011-020-analysis-views-before-fit.screenshot.json` | Screenshot-Metadaten | Zweck, Status, Limitationen des Vorher-Bilds | keinen Finalnachweis | `labor` |
| `reporting-011-030-analysis-views-after-fit.screenshot.json` | Screenshot-Metadaten | Zweck, Status, Limitationen des Nachher-/Blocker-Bilds | keine angelegte Analysis View | `rejected` |

## Buchwirkung

Kapitel 10 und 25 duerfen weiter sagen: `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind am Artikelposten belegt, aber noch nicht als Finanzberichtsauswertung nachgewiesen. Eine passende Analysis View bleibt ein eigener Setup-Schritt. Dieser Schritt braucht entweder einen stabilen UI-Klickpfad zur Card/List-Feldpflege oder ein neues ausdrueckliches Gate.

## Naechster Schritt

`REPORTING-012-ANALYSIS-VIEW-BLOCKER-SYNC`: den Blocker auswerten und entscheiden, ob ein neues Feldmapping-/Setup-Gate fuer die Analysis-View-Anlage sinnvoll ist. Ohne neues Gate keine Analysis View anlegen oder aendern.
