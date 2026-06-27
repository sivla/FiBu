# FIXEDASSETS-236 - FA Depreciation Journal Route Read-only

Status: `read-only`, `route-discovery`, `no-journal-line`, `no-calculate-depreciation`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| Page | 5628 / Fixed Asset G/L Journals |
| Resultat | observed |
| Route sichtbar | ja |
| Calculate Depreciation sichtbar | nein |
| Preview Posting sichtbar | nein |
| Post sichtbar | ja |

## Was geprueft wurde

- Die Fixed-Asset-G/L-Journal-Route wurde direkt per BC-Page-Kontext geoeffnet.
- Aktionskandidaten wurden nur gelesen, nicht geklickt.
- Dialoge wurden als Stop-Signal behandelt.
- Es wurde keine Journalzeile angelegt, bearbeitet oder geloescht.

## Lernwert

Vor einer Abschreibungsbuchung muss die Klickroute selbst bekannt sein: Wo liegt das Anlagenjournal, welche Aktionen sind sichtbar, und welche davon waeren gefaehrlich? Dieser Lauf beweist nur die Route und die sichtbaren Aktionskandidaten. Er beweist noch keine Abschreibungsrechnung.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- `Calculate Depreciation` wurde nicht ausgefuehrt.
- `Preview Posting` wurde nicht ausgefuehrt.
- Es wurde nicht gebucht.
- Aus sichtbaren Aktionsnamen folgt noch keine fachlich richtige AfA-Berechnung.

## Naechster Schritt

FIXEDASSETS-237: locally plan safe read-only action-menu discovery because Calculate Depreciation and Preview Posting were not visible on the first route view.
