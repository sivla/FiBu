# FIXEDASSETS-053 - K30000 Purchase Invoice Preflight ohne Buchung

Status: `labor`, `ui-first`, `preflight`, `no-posting`, `no-setup-change`, `not-final`, `de-final-open`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Zielkreditor | K30000 / Zollspedition Nord GmbH |
| Zielanlage | FA-CNC-01 / CNC Maschine FRA |
| Einkaufsrechnung angelegt | nein |
| Gebucht | nein |
| Status | preflight-context-proven-no-posting |

## Ergebnis

Purchase Invoices wurde in RM-DEMO geoeffnet, New/Neu fuehrte in einen Purchase-Invoice-Kontext, gefaehrliche Posting-Aktionen wurden nur sichtbar erkannt und der Kontext wurde ohne Buchung geschlossen.

## Was man in Business Central sieht

- `Purchase Invoices` ist der richtige Einstieg fuer eine Einkaufsrechnung ohne vorherige Einkaufsbestellung.
- Der neue Belegkontext entsteht bereits beim Klick auf `New/Neu`; deshalb ist der Abbruch-/Cleanup-Weg fachlich relevant.
- Posting-Aktionen sind im Belegkontext gefaehrlich: Sie duerfen in diesem Preflight sichtbar dokumentiert, aber nicht ausgefuehrt werden.
- Dieser Lauf prueft zuerst Seite, Pflichtfelder, Aktionsgrenzen und Entwurfsverhalten. `K30000` und `FA-CNC-01` werden erst in einem spaeteren Gate in den Beleg eingetragen, wenn Cleanup sicher genug ist.

## Buchwirkung

Kapitel 21 sollte den Kaufbeleg nicht direkt als Anlagenzugang erklaeren. Vorher braucht es einen Preflight: Seite oeffnen, Pflichtfelder verstehen, Entwurfsnummer/Auto-Save beachten, gefaehrliche Aktionen erkennen und nur danach entscheiden, ob Kreditor und Anlagenzeile kontrolliert eingetragen werden.

## Grenzen

- Keine Einkaufsrechnung wurde gespeichert oder gebucht.
- Kein `K30000`-Belegkopf und keine `FA-CNC-01`-Zeile wurden erzeugt.
- Kein Anlagenzugang, keine AfA, keine Anlagenposten.
- CRONUS-USA-Labor; kein deutscher HGB-, Kontenplan- oder VAT-Finalnachweis.

## Naechster Schritt

FIXEDASSETS-054-K30000-FA-CNC-01-PURCHASE-INVOICE-FIELD-MAPPING-GATE: decide whether one narrow UI-first field-mapping run may enter K30000 and test FA-CNC-01 line selection, still without posting.
