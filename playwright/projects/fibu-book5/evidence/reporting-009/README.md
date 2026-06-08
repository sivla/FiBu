# REPORTING-009 Evidence-Index

Ziel: Read-only pruefen, ob `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` auf gefilterten `G/L Entries` zur gebuchten O2C-Laborrechnung ueber `Entry` -> `Dimensions` sichtbar werden.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `REPORTING-009-result.json` | JSON-Ergebnis | Sandbox, Company, Klickversuch, breite Ansicht, keine Buchung, keine Setup-Aenderung | keine Financial-Reports-Summenwirkung | labor, read-only |
| `REPORTING-009-GL-ENTRY-DIMENSIONS.md` | Lernzusammenfassung | warum Sachposten-Dimensionen ein eigener Kontrollpunkt sind | keinen deutschen Finalreport | labor |
| `010-gl-entries-before-dimensions-page-text.txt` | kompakter UI-Text | gefilterte Sachposten zur `PS-INV103297` | keine Dimensionserzeugung | labor |
| `020-gl-entry-dimensions-result-page-text.txt` | kompakter UI-Text | Ergebniszustand nach Dimensionsversuch | keine Buchung und keine Analysis View | labor/rejected je nach sichtbarem Zielwert |
| `../img/reporting-009-010-gl-entries-before-dimensions.png` | Screenshot | Sachposten-Ausgangspunkt in breiter Ansicht | keinen Dimensionsnachweis | labor-candidate |
| `../img/reporting-009-020-gl-entry-dimensions-result.png` | Screenshot | Ergebniszustand nach `Entry`/`Dimensions`-Versuch | nur als Dimensionsnachweis nutzbar, wenn Zielwerte sichtbar sind | labor-candidate/rejected |

## Aktuelle Wahrheit

`PRODUCTLINE`/`CHANNEL` wurde im Sachposten-Dimensionskontext nicht sichtbar als Reportingnachweis erreicht. Das Sachpostenbild zeigt aber einzelne Shortcut-Dimensionsspalten wie `Department Code`/`Customergroup Code`; Artikelposten-Dimension bleibt belegt, Financial Reports/Analysis View bleiben offen.

## Naechster Schritt

Sachposten-Dimensionsdialog liefert in diesem UI-Lauf keinen sichtbaren PRODUCTLINE-/CHANNEL-Nachweis. Naechster Reporting-Hebel bleibt der freigegebene Analysis-View-Fit oder ein alternativer offizieller Reporting-Einstieg.
