# REPORTING-004 Analysis Views als Dimensions-Reporting-Hebel

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor, read-only, no-posting, no-setup |
| Ausgangsbeleg | O2C-Laborrechnung `PS-INV103297` |
| Ausgangspunkt | `REPORTING-003` lieferte keinen sichtbaren Dimension-Perspective-Kontext |

## Kernergebnis

| Frage | Befund |
|---|---|
| Analysis Views geoeffnet | ja |
| Analysis View REVENUE gewaehlt | ja |
| Analysis by Dimensions sichtbar | ja |
| Analysis by Dimensions geklickt | nein |
| REVENUE Analysis View Card sichtbar | ja |
| REVENUE-Dimensionen sichtbar | AREA, DEPARTMENT, CUSTOMERGROUP |
| PRODUCTLINE im REVENUE-Kontext sichtbar | nein |
| CHANNEL im REVENUE-Kontext sichtbar | nein |
| PRODUCTLINE=MACHINE sichtbar | nein |
| CHANNEL=B2B sichtbar | nein |
| Show Matrix sichtbar | nein |

## Microsoft-Learn-Abgleich

Microsoft Learn beschreibt Analysis Views als Grundlage fuer `Analysis by Dimensions`; `Dimensions - Detail` baut auf einer Analysis View mit Dimensionsebenen auf. Deshalb ist dieser Lauf fachlich der richtige Anschluss an den negativen `Dimension Perspective`-Befund.

## Anfaenger-Lernwert

Reporting nach Dimensionen ist ein eigener Einrichtungspfad. Dass `PRODUCTLINE=MACHINE` am Artikelposten sichtbar ist, bedeutet noch nicht, dass ein Bericht diese Dimension sofort als Zeile, Spalte oder Filter anbietet. Ein Leser muss erst verstehen, ob es eine passende Analysis View gibt und ob sie fuer die gesuchten Dimensionen aktualisiert ist.

## Buchwirkung

Die Buchstelle zu Reporting darf den O2C-Dimensionsnachweis am Artikelposten als Laborbeleg verwenden. Sie darf aber weiterhin keine GuV-/Revenue-Auswertung nach `PRODUCTLINE` oder `CHANNEL` behaupten, solange `Analysis by Dimensions`, `Dimensions - Detail` oder ein Financial Report die Dimensionen nicht sichtbar auswertet.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Buchung und keine Analysis-View-Aktualisierung.
- Deutsche `19 %` USt bleibt offen.

## Naechster Schritt

Die bestehende REVENUE Analysis View enthaelt AREA, DEPARTMENT und CUSTOMERGROUP, aber nicht PRODUCTLINE/CHANNEL. Naechster Schritt: Read-only Dimensions - Detail pruefen oder kontrolliert klaeren, ob eine zusaetzliche Analysis View mit PRODUCTLINE/CHANNEL eingerichtet und aktualisiert werden muss.
