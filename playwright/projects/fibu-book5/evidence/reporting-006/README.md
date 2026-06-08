# REPORTING-006 Evidence Index

Ziel: Read-only pruefen, ob die gefilterten `G/L Entries` zur gebuchten O2C-Laborrechnung `PS-INV103297` einen sichtbaren Data-Analysis-/Analysemodus-Hebel oder `PRODUCTLINE`/`CHANNEL` zeigen.

| Datei | Typ | Beweist | Beweist nicht | Status |
|---|---|---|---|---|
| `REPORTING-006-result.json` | JSON-Ergebnis | Sandbox, Company, Modus, geoeffnete Sachposten, sichtbaren Belegfilter, nicht erreichten Analysemodus und fehlende Sichtbarkeit von `PRODUCTLINE`/`CHANNEL` | keine Analysis View, keine GuV-Auswertung, keine deutsche Final-Evidence | labor, read-only, no-posting |
| `REPORTING-006-GL-ENTRIES-DATA-ANALYSIS.md` | Lernzusammenfassung | warum Sachposten, Artikelpostendimension und Reportingauswertung getrennte Nachweise sind | keine Zahlenwirkung nach Dimension | labor-negativ |
| `010-gl-entries-before-analysis-page-text.txt` | Seitentext | gefilterte `G/L Entries` zur Rechnung `PS-INV103297` mit Konten und Betraegen im Rohtext | keine visuelle Spaltensichtbarkeit fuer alle Werte; keine `PRODUCTLINE`/`CHANNEL` | raw-text-evidence |
| `010-gl-entries-before-analysis-buttons.json` | Button-/Text-Evidence | relevante sichtbare Aktionen/Felder vor dem Analyseversuch | kein Beweis, dass ein Data-Analysis-Modus verfuegbar ist | raw-ui-evidence |
| `020-gl-entries-after-analysis-attempt-page-text.txt` | Seitentext | Zustand nach dem kontrollierten Analyseversuch bleibt weiter bei den gefilterten Sachposten | kein erreichter Analysemodus, keine Dimensionsauswertung | raw-text-evidence |
| `020-gl-entries-after-analysis-attempt-buttons.json` | Button-/Text-Evidence | nach dem Analyseversuch sind weiter nur allgemeine Spalten-/Feldaktionen sichtbar | keine Produktlinien-/Kanalachse | raw-ui-evidence |
| `../img/reporting-006-010-gl-entries-before-analysis.png` | Screenshot | gefilterte Sachpostenliste zur gebuchten Verkaufsrechnung als Laborbild | keine sichtbare Reportingdimension, kein deutscher Finalnachweis | labor-candidate |
| `../img/reporting-006-020-gl-entries-after-analysis-attempt.png` | Screenshot | negativer Folgezustand: kein sichtbarer Analysemodus fuer `PRODUCTLINE`/`CHANNEL` erreicht | keine verwendbare Buchauswertung nach Dimension | rejected-for-final-reporting |
| `../img/reporting-006-010-gl-entries-before-analysis.screenshot.json` | Screenshot-Metadaten | Screenshot-Kontext, Quelle und erwarteter Inhalt | keine fachliche Zahlenwirkung | metadata |
| `../img/reporting-006-020-gl-entries-after-analysis-attempt.screenshot.json` | Screenshot-Metadaten | Screenshot-Kontext nach Analyseversuch | keine fachliche Zahlenwirkung | metadata |

## Kernaussage

`G/L Entries` zur Laborrechnung `PS-INV103297` sind sichtbar und enthalten die Hauptbuchspur mit Konten und Betraegen. In diesem Lauf war aber kein belastbarer Data-Analysis-/Analysemodus-Hebel sichtbar oder erreichbar, und `PRODUCTLINE=MACHINE` beziehungsweise `CHANNEL=B2B` erscheinen nicht im Sachposten-/Analysekontext.

## Buchwirkung

Das Buch darf erklaeren, dass die Dimension am Artikelposten nachgewiesen ist, die Financial-Reports- oder Sachpostenauswertung nach `PRODUCTLINE`/`CHANNEL` aber weiter offen bleibt. Der naechste belastbare Reportingpfad ist ein gezielter `Analysis by Dimensions`-Einstieg oder ein bewusst freigegebener Analysis-View-Fit fuer die Ziel-Dimensionen.
