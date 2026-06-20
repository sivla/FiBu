# FIXEDASSETS-124 - Route Decision nach Personalize-Result

## Kontext

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Arbeitstyp: lokaler Evidence-Review
- Kein BC-Lauf
- Kein Playwright-Lauf
- Keine Buchung
- Keine Preview
- Keine Setup-Aenderung
- Keine Buchaenderung

## Gepruefte Evidence

- `FIXEDASSETS-121`: Page Inspection nach Fokus der Einkaufsrechnungs-Zelle `Type`
- `FIXEDASSETS-122`: lokale Entscheidung, Page Inspection und Personalisieren nicht im gleichen aktiven UI-Zustand zu mischen
- `FIXEDASSETS-123`: Personalize-only no-save Diagnose

## Was FA-123 wirklich besser gemacht hat

FA-123 beseitigt den FA-121-Blocker: `Personalisieren` wurde ohne aktive Page Inspection geoeffnet. Der Screenshot und die Text-Evidence zeigen:

- `Wird personalisiert: Lines`
- sichtbarer Zeilenbereich
- sichtbares Feld `Type`
- Add-field-/Feldkontext
- kein gespeicherter Einkaufsrechnungsentwurf

Damit ist `Personalisieren` als technisches Debugging-Werkzeug bestaetigt. Es hilft zu verstehen, welche Page-/Lines-Region gerade personalisiert wird und ob ein Feld sichtbar oder verborgen ist.

## Was FA-123 nicht beweist

FA-123 beweist nicht:

- dass `Fixed Asset` / `Anlage` als Zeilentyp sichtbar ist
- dass `Type = Fixed Asset` in der Einkaufsrechnungszeile auswaehlbar ist
- dass `K30000` und `FA-CNC-01` zusammen im Belegkontext erfasst werden koennen
- dass der Anlagenzugang ueber Einkaufsrechnung in `RM-DEMO` aktuell buchungsreif ist
- dass Preview Posting oder `Post` erlaubt waeren

Der Screenshot ist deshalb `technical-diagnosis`, nicht `book-final` und nicht `line-type-proof`.

## Entscheidung

Der Purchase-Invoice-Line-Type-Pfad wird vorerst nicht weiter als Live-UI-Dropdown-Pfad verfolgt.

Begruendung:

1. Mehrere praktische Laeufe (`FA-115`, `FA-117`, `FA-119`, `FA-121`, `FA-123`) haben keinen sichtbaren `Fixed Asset`/`Anlage`-Optionsnachweis erbracht.
2. Die bisherigen UI-Signale erklaeren die Page besser, aber sie unlocken keine sichere Wertauswahl.
3. Weitere Dropdown-/Personalisieren-Retries waeren derzeit vor allem Token-/Zeitkosten ohne neuen fachlichen Hebel.
4. Das Buch braucht nicht nur einen Screenshot vom Feld `Type`, sondern einen belegten Anlagenzugang mit Postenspur.

## Naechster sinnvoller Schritt

Naechster Case:

`FIXEDASSETS-125-FA-ACQUISITION-ROUTE-AUDIT-AFTER-PERSONALIZE`

Ziel:

- vorhandene Evidence zu `Purchase Invoice`, `FA G/L Journal` und `Acquire` lokal vergleichen
- genau einen naechsten praktischen Anlagenzugangsweg bestimmen
- keine BC-Ausfuehrung, bevor der Weg begruendet ist

## Grenzen

- Keine neue UI-Evidence in FA-124.
- Keine Aenderung in Business Central.
- Kein deutscher Finalnachweis.
- Keine Anlagenposten.
- Keine AfA.
- Keine Buchkapitel-Aenderung.
