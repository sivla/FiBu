# FIXEDASSETS-293 AfA-Journal-/Batch-/Filter-Trace read-only

Status: `labor`, `read-only`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

- Fixed Asset G/L Journals sichtbar: ja
- ASSETS sichtbar: nein
- DEFAULT sichtbar: ja
- FADEP-291-OK sichtbar: nein
- FA-CNC-01 sichtbar: nein
- HGB sichtbar: nein
- 31.01.2027 sichtbar: nein

## Buchwirkung

Die AfA-Zeile ist im sichtbaren Journal-/Batch-Kontext weiterhin nicht belegt. Fuer Anfaenger ist wichtig: Nach `Calculate Depreciation` muss die erzeugte Journalzeile nachweisbar sein; sonst darf Preview/Post nicht folgen.

## Grenzen

- Kein Calculate Depreciation OK.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein Company Switch.
- Kein deutscher Finalnachweis.
