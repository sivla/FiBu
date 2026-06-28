# P2P-004 Teil-Wareneingang Gate

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | labor gate, UI-first, no-post, no-preview, needs-follow-up |
| Kreditor | K10000 |
| geplanter Artikel | RAW-STEEL |
| geplante Menge | 4 |
| geplante Teil-WE-Menge | 2 |
| Ergebnis | labor-gate-proven |

## Erzeugte/geaenderte Records

| Typ | Nr. | Status |
|---|---|---|
| Purchase Order draft | 106002 | kept-as-labor-draft-trace |

## Lernwert

Der Teil-Wareneingang-Fall beginnt nicht bei `Post`, sondern bei einem stabilen Belegkopf und einer stabilen Zeilenbedienung. Fuer Anfaenger ist genau das wichtig: Eine Bestellung ist noch keine Lieferung, eine Lieferung ist noch keine Rechnung, und erst Posten beweisen die Wirkung.

Dieser Lauf beweist nur das UI-first Gate: Purchase Orders sind erreichbar, `New` oeffnet den Einkaufsbestellungskontext, und der Kreditor kann im Belegkopf gesetzt werden. Die eigentliche Teil-WE-Logik bleibt der naechste separate Gate-Schritt.

## Grenzen

- Keine Artikelzeile.
- Keine Teilmenge.
- Keine Buchungsvorschau.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

P2P-005: continue from the kept UI draft or create a fresh UI draft and enter one item line with quantity 4, then set Qty. to Receive = 2 before any Preview/Post gate.
