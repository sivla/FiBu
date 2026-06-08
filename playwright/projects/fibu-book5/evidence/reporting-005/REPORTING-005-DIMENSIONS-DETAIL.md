# REPORTING-005 Dimensions - Detail

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-posting, no-setup |
| Ausgangslage | `REPORTING-002` bis `REPORTING-004`: Dimension am Artikelposten belegt, Reportingauswertung offen |

## Kernergebnis

| Frage | Befund |
|---|---|
| Tell-Me zeigt Dimensions - Detail | nein |
| Dimensions - Detail geklickt | nein |
| Request-/Startkontext erreicht | nein |
| Preview/Vorschau sichtbar | nein |
| Preview/Vorschau geklickt | nein |
| PRODUCTLINE oder CHANNEL sichtbar | nein |
| PRODUCTLINE=MACHINE oder CHANNEL=B2B sichtbar | nein |
| Keine Buchung | ja |

## Anfaenger-Lernwert

`Dimensions - Detail` waere ein anderer Nachweis als `Financial Reports`. Ein Finanzbericht zeigt Kontenzeilen und Summen; Dimensionsberichte beziehungsweise Analysis Views zeigen, ob Sachposten nach Dimensionen aufgeschluesselt werden koennen. Eine am Artikelposten sichtbare Dimension reicht fuer das Reporting-Ziel noch nicht aus, wenn der passende Berichtspfad nicht eindeutig erreichbar ist oder die Dimension dort nicht als Filter, Zeile oder Spalte sichtbar wird.

## Buchwirkung

Kapitel 10 und 25 duerfen den Reportingpfad weiter als offen markieren. Der aktuelle Laborstand belegt die Grenze des versuchten Bedienpfads, aber noch keine GuV-/Revenue-Auswertung nach `PRODUCTLINE=MACHINE` oder `CHANNEL=B2B`.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Buchung, keine Stammdatenanlage und keine Analysis-View-Aktualisierung.
- Deutsche `19 %` USt bleibt offen.

## Naechster Schritt

Dimensions - Detail wurde ueber Tell-Me in diesem Laborlauf nicht sichtbar gefunden. Naechster Schritt: alternativen UI-Einstieg ueber Berichtssuche/Analysis by Dimensions oder Data Analysis Mode auf G/L Entries read-only pruefen.
