# FIXEDASSETS-140 - FA-CNC-01 Posting Group Assignment Fit

Status: `blocked-wrong-related-card-route`, `ui-first`, `no-setup-fit`, `no-acquire`, `no-preview`, `no-posting`, `not-final`.

| Pruefpunkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Vorher Posting Group | EQUIPMENT |
| Nachher Posting Group | (nicht ermittelt) |
| Datenaenderung | nein |
| Acquire / Preview / Posting | nein |

## Ergebnis

FA-140 blocked: Posting Group route lost the Fixed Asset Card foreground and opened the related Depreciation Book Card.

## Anfaenger-Lernwert

- Die Anlagenbuchungsgruppe ist Stammdaten-/Setup-Kontext auf der Anlagenkarte, noch keine Anschaffung.
- Erst wenn `FA-CNC-01` vor dem Edit eindeutig `EQUIPMENT` zeigt und keine Anlagenposten existieren, ist ein kontrollierter Wechsel auf `MACHINES` vertretbar.
- `MACHINES` als Setup-Code reicht nicht aus; der Code muss auf der konkreten Karte sichtbar zugewiesen sein.
- Nach der Aenderung muss die Karte neu geoeffnet werden, damit der gespeicherte Zustand und nicht nur ein Eingabefeld bewiesen ist.

## Buchwirkung

Kapitel 21 muss den Posting-Group-Kartenfit weiter offen halten.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Anschaffung, kein Kreditor, keine Einkaufsrechnung, keine FA Ledger Entries.
- Keine Preview Posting und keine Buchung.

## Naechster Schritt

FIXEDASSETS-144: local route decision; do not repeat the same Related-Card path without a new UI mechanism.
