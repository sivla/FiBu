# REPORTING-007 Analysis by Dimensions

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-posting, no-setup |
| Ausgangslage | `REPORTING-002` bis `REPORTING-006`: Dimension am Artikelposten belegt, Reportingauswertung offen |

## Kernergebnis

| Frage | Befund |
|---|---|
| Tell-Me zeigt Analysis by Dimensions | ja |
| Analysis by Dimensions geklickt | nein |
| Ziel-/Request-/Ergebniszustand erreicht | nein |
| PRODUCTLINE oder CHANNEL sichtbar | nein |
| PRODUCTLINE=MACHINE oder CHANNEL=B2B sichtbar | nein |
| Matrix-/Berichtsaktion sichtbar | nein |
| Keine Buchung | ja |

## Anfaenger-Lernwert

`Analysis by Dimensions` ist nicht dasselbe wie ein normaler Finanzbericht und auch nicht dasselbe wie ein Sachpostenfilter. Der Pfad ist nur dann ein Buchnachweis, wenn dort die richtigen Dimensionen sichtbar als Analyseachse, Filter oder Matrixkontext verwendet werden koennen.

## Buchwirkung

Kapitel 10 und 25 bleiben beim Ziel `GuV/Revenue nach PRODUCTLINE und CHANNEL` offen, solange `Analysis by Dimensions` oder eine passende Analysis View die Ziel-Dimensionen nicht sichtbar anbietet.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Buchung, keine Stammdatenanlage und keine Analysis-View-Aktualisierung.
- Deutsche `19 %` USt bleibt offen.

## Naechster Schritt

Analysis by Dimensions wurde in diesem Laborlauf nicht belastbar geoeffnet. Naechster Hebel bleibt kontrollierter Analysis-View-Fit oder alternativer offizieller Reporting-Einstieg.
