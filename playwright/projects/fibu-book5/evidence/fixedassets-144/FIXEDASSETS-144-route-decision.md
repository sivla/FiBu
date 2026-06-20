# FIXEDASSETS-144 - Posting-Group-Routenentscheidung

## Kontext

- Instanzgrenze: `MCP_1_20260210`
- Company: `RM-DEMO`
- Asset: `FA-CNC-01`
- Arbeitstyp: lokale Routenentscheidung
- Referenzen: `FIXEDASSETS-140` bis `FIXEDASSETS-143`

## Entscheidung

Der bisherige UI-Pfad fuer `Posting Group = MACHINES` wird verworfen, bis ein wirklich anderer Mechanismus belegt ist.

Nicht erneut ausfuehren:

- Klick in den sichtbaren `Posting Group`-Wertbereich.
- `Alt+ArrowDown` auf diesem Control.
- Rechtskanten-/Dropdown-Klick auf demselben Control.
- Tippen von `MACHINES` plus `ArrowDown`/`Enter`.

Grund: FA-140 und FA-143 zeigen konsistent, dass dieser Pfad die verwandte `Depreciation Book Card HGB` oeffnet. Der reparierte Guard erkennt das korrekt, aber der fachliche Fit bleibt aus.

## Naechster sicherer Hebel

`FIXEDASSETS-145-FA-CNC-01-POSTING-GROUP-PAGEINSPECTION-PERSONALIZE-NOSAVE`

Ziel: `FA-CNC-01` read-only oeffnen, `Posting Group` sichtbar fokussieren und dann nur technische Diagnose nutzen:

- Page Inspection / Seitenpruefung fuer Page/Table/Feldkontext.
- Personalisieren / Personalize zur Frage, ob `Posting Group` als Page-Feld/Control anders sichtbar oder bedienbar ist.
- Keine Wertauswahl.
- Kein Speichern einer Personalisierung.
- Kein Setup-Change.
- Keine Anschaffung.
- Keine Preview.
- Kein `Post`.

## Warum nicht direkt Setup aendern?

`MACHINES` ist als Setup vorhanden, aber nicht als aktueller Kartenwert auf `FA-CNC-01` bewiesen. Solange der UI-Hebel fuer die Karten-Zuordnung nicht belastbar ist, waere ein weiterer Schreibversuch wahrscheinlich nur eine Wiederholung desselben Fehlers oder ein stiller Kontextwechsel.

## Buchwirkung

Kapitel 21 soll diesen Abschnitt als Debugging-/Nachweisfuehrung behandeln:

- Sichtbarer Feldwert ist nicht automatisch eine Werteliste.
- Related-Record-Navigation ist ein Stoppsignal.
- Page Inspection und Personalisieren sind Diagnosewerkzeuge, keine finalen Anwenderscreenshots.
- Ein Buchscreen fuer `MACHINES` ist erst brauchbar, wenn `FA-CNC-01` den Wert sichtbar auf der richtigen Karte zeigt.

## Grenzen

- Kein neuer BC-Lauf in FA-144.
- Kein neuer Screenshot.
- Keine Setup-Aenderung.
- Keine Buchung.
- Kein deutscher Finalnachweis.
