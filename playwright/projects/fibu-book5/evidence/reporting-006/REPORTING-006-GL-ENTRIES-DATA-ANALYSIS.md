# REPORTING-006 G/L Entries Data Analysis

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-posting, no-setup |
| Ausgangsbeleg | PS-INV103297 |

## Kernergebnis

| Frage | Befund |
|---|---|
| G/L Entries zur Rechnung sichtbar | ja |
| Filterwert sichtbar | ja |
| Analyse-/Data-Analysis-Aktion geklickt | nein |
| Analysemodus sichtbar erreicht | nein |
| PRODUCTLINE oder CHANNEL sichtbar | nein |
| PRODUCTLINE=MACHINE oder CHANNEL=B2B sichtbar | nein |
| Keine Buchung | ja |

## Anfaenger-Lernwert

Sachposten sind die Hauptbuchspur der gebuchten Rechnung. Data Analysis kann fuer Listen ein schneller Analysehebel sein, ersetzt aber keinen Nachweis, wenn die benoetigten Dimensionen in diesem Kontext nicht sichtbar auswaehlbar oder filterbar sind. Der Leser lernt: Posten vorhanden, Dimension am Artikelposten vorhanden und Reportingauswertung sind drei unterschiedliche Nachweise.

## Buchwirkung

Kapitel 10 und 25 bleiben beim Reportingziel offen, solange `PRODUCTLINE` und `CHANNEL` in `G/L Entries`, Data Analysis oder einem Financial Report nicht sichtbar als Filter, Spalte oder Auswertungsachse erscheinen.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Buchung, keine Stammdatenanlage und keine Analysis-View-Aktualisierung.
- Deutsche `19 %` USt bleibt offen.

## Naechster Schritt

Data Analysis auf G/L Entries liefert in diesem Laborlauf noch keinen sichtbaren PRODUCTLINE-/CHANNEL-Nachweis. Naechster Hebel: Analysis by Dimensions gezielt oeffnen oder freigegebenen Analysis-View-Fit fuer PRODUCTLINE/CHANNEL planen.
