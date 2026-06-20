# FIXEDASSETS-137 - Review nach FA-136 Page Inspection

Status: `local-review`, `fixed-assets`, `no-bc-run`, `no-playwright-run`, `no-setup-change`, `no-posting`, `not-final`.

## Entscheidung

FA-136 wird als technischer Labor-Nachweis akzeptiert:

- Page: `Fixed Asset Card (5600, Document)`
- Source Table: `Fixed Asset (5600)`
- Feldkontext: `FA Posting Group (29, Code[20])`
- Readiness-Feld: `Acquired (30, Boolean)`
- Aktuell sichtbarer Kartenwert: `EQUIPMENT`
- Aktuell nicht bewiesen als Kartenwert: `MACHINES`

Der Screenshot aus FA-136 ist ein gutes Kontextbild fuer Karte und Page Inspection. Der konkrete Feldzeilenbeweis liegt in `020-pageinspection-focused-lines.txt`, `030-pageinspection-signals.json` und `FIXEDASSETS-136-result.json`.

## Fachliche Bewertung

`MACHINES` wurde frueher als Buchziel-/Laboralias fuer Maschinen angelegt. FA-136 zeigt aber, dass die konkrete Anlage `FA-CNC-01` aktuell nicht `MACHINES`, sondern `EQUIPMENT` im Anlagenbuchungsgruppen-Kontext traegt. Damit ist ein direkter Anlagenzugang fachlich nicht sauber genug, weil Buchziel, Setup-Ziel und Kartenwirklichkeit auseinanderlaufen.

Das bedeutet nicht, dass `EQUIPMENT` technisch falsch ist. Es bedeutet: Fuer das Buchprojekt muss vor einer Anschaffung entschieden und nachgewiesen werden, ob die Buchanlage bewusst mit `EQUIPMENT` weiterlaeuft oder ob sie kontrolliert auf `MACHINES` umgestellt wird.

## Anfaenger-Lernwert

- Setup-Werte und Kartenwerte sind unterschiedliche Nachweise.
- Eine vorhandene Buchungsgruppe beweist noch nicht, dass sie auf einem konkreten Stammsatz verwendet wird.
- Page Inspection hilft, den technischen Feldnamen zu klaeren, ersetzt aber keine fachliche Entscheidung.
- Vor einer Buchung muss klar sein, welche Stammdaten Business Central tatsaechlich verwendet.

## Naechster Schritt

`FIXEDASSETS-138-FA-CNC-01-POSTING-GROUP-ASSIGNMENT-FIT` ist als kontrollierter UI-first Stammdaten-Fit sinnvoll:

- `FA-CNC-01` oeffnen.
- Aktuellen Wert pruefen.
- Nur wenn weiterhin `EQUIPMENT` sichtbar ist und `MACHINES` als Zielgruppe verfuegbar ist, darf der Kartenwert kontrolliert auf `MACHINES` geaendert werden.
- Vorher/Nachher-Evidence sichern.
- Keine Anschaffung, keine Preview, kein Posting.

## Grenzen

- Kein BC-Lauf in FA-137.
- Keine Feldwert-Aenderung in FA-137.
- Kein Anlagenzugang.
- Keine Anlagenposten.
- Kein deutscher Finalnachweis.
