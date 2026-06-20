# FIXEDASSETS-153 - Acquire disabled editmode diagnosis

Status: `labor`, `ui-first`, `diagnosis`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.

| Pruefpunkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Posting Group MACHINES | ja |
| Book Value 0,00 | ja |
| Edit-Probe versucht | ja |
| Acquire vorher deaktiviert | ja |
| Acquire nachher deaktiviert | ja |

## Ergebnis

FA-153 proved in the UI that FA-CNC-01 still shows Acquire disabled after a safe edit-state probe; no acquisition route is unlocked.

## Buchwirkung

Kapitel 21 darf den Editmodus nicht als Freigabe fuer Acquire erklaeren; die Karte bleibt ein Readiness-/Blockerbild, kein Anschaffungsprozess.

## Grenzen

- `Acquire` wurde nicht geklickt oder ausgefuehrt.
- Es wurden keine Feldwerte geaendert.
- Keine Preview, kein `Post`, keine Anschaffung und keine Postenspur.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-154: local route review; decide whether to hold Acquire as disabled and pivot to another acquisition path.
