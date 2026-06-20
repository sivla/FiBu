# FIXEDASSETS-134 - Depreciation-Book-Felder auf FA-CNC-01

Status: `labor`, `ui-first`, `read-only`, `no-edit`, `no-acquire-click`, `no-preview`, `no-posting`, `not-final`.

| Pruefpunkt | Befund |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Anlage | FA-CNC-01 |
| Anlagenkarte sichtbar | ja |
| Mehr-anzeigen geklickt | ja |
| HGB sichtbar | ja |
| Posting Group sichtbar | EQUIPMENT (visueller Screenshot-Wert; DOM-Text mehrdeutig) |
| MACHINES sichtbar | nein |
| Acquired-/Erworben-Signal sichtbar | nein |
| Book Value 0 sichtbar | ja |
| Acquire deaktiviert | ja |

## Ergebnis

FA-134 zeigt FA-CNC-01 auf der Anlagenkarte mit Depreciation Book Code HGB, sichtbarer Posting Group EQUIPMENT (visueller Screenshot-Wert; DOM-Text mehrdeutig), AfA-Daten und Book Value 0,00. MACHINES und Acquired-/Ready-Signale sind nicht sichtbar; Acquire bleibt deaktiviert.

## Anfaenger-Lernwert

- `Depreciation Book` und `FA Posting Group` sind Pflichtkontext fuer Anlagenbuchungen, weil Business Central daraus AfA- und Sachpostenlogik ableitet.
- `Book Value = 0,00` zeigt nur, dass noch kein Anlagenwert gebucht ist; es beweist nicht automatisch, dass die Anschaffung jetzt geklickt werden darf.
- Eine ausgegraute Aktion wie `Acquire` ist ein Stoppzeichen: erst Ursachen und Pflichtfelder klaeren, dann einen Buchungspfad freigeben.
- `Mehr anzeigen` ist fuer Klickanleitungen wichtig, weil fachlich relevante Felder sonst im Screenshot fehlen koennen.

## Buchwirkung

Kapitel 21 kann die Anlagenkarte als Pflichtfeld-Kontrollpunkt nutzen: AfA-Buch, sichtbare Buchungsgruppe EQUIPMENT (visueller Screenshot-Wert; DOM-Text mehrdeutig) und Buchwert muessen im Screenshot lesbar sein. Der Lauf beweist weiterhin keinen Anlagenzugang und keine deutsche Finalbuchung; die sichtbare Posting Group muss gegen das fruehere MACHINES-Setup-Ziel bewertet werden.

## Grenzen

- Kein Klick auf `Acquire`.
- Keine Feldwerte wurden geaendert.
- Keine Preview, keine Buchung, keine Setup-Aenderung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-135: local review of FA-134 field visibility and remaining acquisition-readiness gap before any Acquire, Purchase Invoice or FA G/L Journal route is retried.
