# FIXEDASSETS-132 - FA-CNC-01 Acquisition Readiness Card

Status: `labor`, `ui-first`, `read-only`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.

| Pruefpunkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Anlagenkarte sichtbar | ja |
| Acquire sichtbar | ja |
| Acquire deaktiviert | ja |
| Ready-to-acquire-Hinweis sichtbar | nein |
| Book Value 0 sichtbar | ja |

## Ergebnis

FA-132 shows FA-CNC-01 on the Fixed Asset Card, but no complete acquisition-readiness state is proven. Acquire remains not safely executable from this evidence.

## Was ein Anfaenger daraus lernt

- Die Anlagenkarte ist ein guter Kontrollpunkt, bevor man einen Anschaffungspfad startet.
- Eine sichtbare Aktion ist nicht automatisch eine erlaubte oder fachlich bereite Aktion.
- `Book Value` zeigt, ob bereits ein Anlagenwert gebucht ist; hier ist weiterhin kein Zugang nachgewiesen.
- Eine Acquire-/Anschaffungsaktion darf erst als Klickanleitung gelten, wenn Bereitschaft, Eingabegrenze, Preview und Postenspur getrennt bewiesen sind.

## Buchwirkung

Kapitel 21 sollte die Anlagenkarte als Vorpruefung zeigen und erklaeren, dass ein fehlender Ready-to-acquire-Hinweis oder deaktiviertes Acquire kein Anschaffungsnachweis ist.

## Grenzen

- Kein Klick auf `Acquire`.
- Keine Feldwerte wurden geaendert.
- Keine Preview, keine Buchung, keine Setup-Aenderung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-133: local cause review of FA-CNC-01 acquisition readiness before another live acquisition route or setup change.
