# FIXEDASSETS-300 Fixed Asset Journals Output Target Read-only

Status: `labor`, `read-only`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

- Non-G/L Fixed Asset Journals sichtbar: ja
- Fixed Asset G/L Journals sichtbar: nein
- Kandidaten-Pages geprueft: 5621, 5622, 5623, 5624, 5625, 5626, 5627, 5628, 5629
- FADEP-291-OK sichtbar: nein
- FADEP-295-OK sichtbar: nein
- FADEP-Prefix sichtbar: nein
- FA-CNC-01 sichtbar: nein
- HGB sichtbar: nein

## Buchwirkung

Die nicht-G/L-Anlagenjournalroute wurde im Labor sichtbar. Fuer Abschreibung bleibt trotzdem ein separates Gate noetig, weil keine Buchungsvorschau oder Buchung ausgefuehrt wurde.

## Grenzen

- Kein Calculate Depreciation OK.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein Company Switch.
- Kein deutscher Finalnachweis.
