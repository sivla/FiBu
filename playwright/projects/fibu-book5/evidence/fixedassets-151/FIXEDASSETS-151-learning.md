# FIXEDASSETS-151 - FA-CNC-01 Acquire readiness after MACHINES

Status: `labor`, `ui-first`, `read-only`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.

| Pruefpunkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Posting Group MACHINES sichtbar | ja |
| Acquire sichtbar | ja |
| Acquire deaktiviert | ja |
| Ready-to-acquire-Hinweis sichtbar | nein |

## Ergebnis

FA-151 reopened FA-CNC-01 after the MACHINES fit and captured Acquire readiness read-only. Acquire visible=true, disabled=true, readySignal=false.

## Anfaenger-Lernwert

- `MACHINES` auf der Karte ist eine Setup-Voraussetzung, aber noch kein Anlagenzugang.
- Ein sichtbarer `Acquire`-Button ist nur ein Aktionsangebot; die Ausfuehrung braucht einen separaten Gate-Lauf.
- Read-only Readiness prueft, ob der naechste Klickpfad fachlich plausibel ist, ohne Werte oder Posten zu erzeugen.

## Grenzen

- `Acquire` wurde nicht geklickt.
- Keine Werte, keine Preview, keine Buchung, keine Postenspur.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-152-FA-CNC-01-ACQUIRE-READINESS-RESULT-REVIEW
