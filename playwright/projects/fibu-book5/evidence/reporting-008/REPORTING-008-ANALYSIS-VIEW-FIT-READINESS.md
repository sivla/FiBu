# REPORTING-008 Analysis-View-Fit-Readiness

Status: `labor`, `readiness`, `book-sync`, `no-new-bc-run`, `no-setup`, `no-posting`.

## Zweck

`REPORTING-002` bis `REPORTING-007` haben den O2C-Reportingpfad read-only untersucht. Das Ergebnis ist fachlich eindeutig genug fuer eine naechste Entscheidung: Die vorhandenen einfachen Pfade liefern noch keinen belastbaren Finanzberichtsnachweis nach `PRODUCTLINE=MACHINE` und `CHANNEL=B2B`.

Diese Datei definiert den naechsten sinnvollen Reporting-Hebel, ohne ihn schon auszufuehren.

## Ausgangslage

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Ausgangsbeleg | gebuchte Verkaufsrechnung `PS-INV103297` |
| Dimensionen am Artikelposten | `Entry No. 792` zeigt `CHANNEL=B2B` und `PRODUCTLINE=MACHINE` |
| Sachposten / G/L Entries | zur Rechnung sichtbar, aber `PRODUCTLINE`/`CHANNEL` nicht sichtbar als Filter-/Spaltennachweis |
| Financial Reports | erreichbar, aber keine sichtbare Summenwirkung nach `PRODUCTLINE`/`CHANNEL` |
| Existing Analysis View `REVENUE` | nutzt `AREA`, `DEPARTMENT`, `CUSTOMERGROUP`, nicht `PRODUCTLINE`/`CHANNEL` |
| Setup-Aenderung in diesem Lauf | nein |

## Warum nicht noch ein read-only Klickpfad

| Pfad | Laborbefund | Konsequenz |
|---|---|---|
| `Financial Reports` / `Dimension Perspective` | fuehrte nicht zu sichtbarem Ziel-Dimensionskontext | nicht erneut als schneller Beweis versuchen |
| `Dimensions - Detail` ueber Tell-Me | Zielbericht nicht belastbar sichtbar erreicht | kein aktueller Buchbildpfad |
| gefilterte `G/L Entries` | Sachposten sichtbar, aber kein belastbarer Data-Analysis-Hebel | kein Reportingnachweis |
| `Analysis by Dimensions` ueber Tell-Me | Suchpfad sichtbar, Analysezustand nicht belastbar erreicht | braucht besseren Einstieg oder Setup-Kontext |
| `REVENUE` Analysis View | Dimensionen `AREA`, `DEPARTMENT`, `CUSTOMERGROUP` | passt nicht zum Buchziel `PRODUCTLINE`/`CHANNEL` |

## Naechster freigabepflichtiger Hebel

Der naechste sinnvolle Reporting-Schritt ist ein kontrollierter Analysis-View-Fit, zum Beispiel eine eigene Labor-Analysis-View fuer das Buchziel:

| Zielwert | Begruendung |
|---|---|
| Analysis View Code | z. B. `RMREV` oder ein anderer eindeutig markierter Laborcode |
| Dimension 1 | `PRODUCTLINE` |
| Dimension 2 | `CHANNEL` |
| Dimension 3 | optional `DEPARTMENT` |
| Dimension 4 | optional leer oder `LOCATION-GROUP` |
| Update | erst nach dokumentierter Freigabe ausfuehren |
| Nachweis | `Analysis by Dimensions` oder passender Dimensionsbericht muss `PRODUCTLINE`/`CHANNEL` sichtbar als Achse/Filter/Matrix nutzen |

Warum Freigabe noetig ist: Eine Analysis View ist Reporting-Setup. Sie ist zwar risikoaermer als eine Buchung, veraendert aber die Reporting-Einrichtung der Company. Deshalb soll sie nicht heimlich im Autopilot-Lauf erstellt oder angepasst werden.

## Erwartete Evidence nach Freigabe

| Evidence | Zweck |
|---|---|
| Screenshot der Analysis-View-Liste vor dem Fit | zeigt Ausgangslage und verhindert Duplikate |
| Screenshot der neuen/geaenderten Analysis View | zeigt Dimension 1/2 und ggf. Update-Status |
| Screenshot `Analysis by Dimensions` / Matrix oder Request Page | zeigt, ob `PRODUCTLINE` und `CHANNEL` wirklich nutzbar sind |
| JSON-Ergebnis | dokumentiert Company, Code, Dimensionen, Update-Status, sichtbare Werte, keine Buchung |
| Buch-Sync | trennt CRONUS-Labor-Reporting von deutschem Finalnachweis |

## Was weiterhin nicht bewiesen ist

- keine deutsche `19 %` USt,
- kein deutscher Kontenplan-Endstand,
- keine finale deutsche Finanzberichtssumme,
- keine produktive Reporting-Freigabe,
- keine Zahlung und kein OP-Ausgleich.

## Buchwirkung

Kapitel 10 und 25 sollten aktuell sagen:

- Dimensionen koennen in Beleg und Posten vorhanden sein, ohne dass Financial Reports sie sofort auswerten.
- Eine passende Analysis View ist ein eigener Reporting-Setup-Schritt.
- Der aktuelle Laborstand beweist `PRODUCTLINE`/`CHANNEL` am Artikelposten, aber noch keine GuV-/Revenue-Summe nach diesen Dimensionen.
- Der naechste Setup-Schritt braucht eine bewusste Freigabe, auch wenn er keine Buchung erzeugt.

## Naechster konkreter Schritt

Wenn Reporting-Setup freigegeben wird: `REPORTING-009` als idempotenter UI-Setup-Lauf fuer eine Labor-Analysis-View mit `PRODUCTLINE` und `CHANNEL`, danach read-only `Analysis by Dimensions`/Matrix-Nachweis.

Wenn keine Setup-Freigabe vorliegt: keinen weiteren Reporting-Klickpfad wiederholen; stattdessen Payments nur nach Zahlungsfreigabe oder einen anderen read-only Buch-/Evidence-Sync waehlen.
