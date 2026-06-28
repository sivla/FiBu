# FIXEDASSETS-272 Post-acquisition OK-Gate-Review

Status: `labor`, `local-review`, `judge_work`, `no-bc`, `no-playwright`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

`FIXEDASSETS-271` hat die korrigierten Request-Page-Werte ohne `OK` bewiesen:

| Feld | Zielwert |
|---|---|
| AfA-Buch | `HGB` |
| Buchungsdatum / AfA bis | `31.01.2027` |
| Belegnr. im no-OK-Preflight | `FADEP-271-NO-OK` |
| Anlagenfilter | `FA-CNC-01` |

Da `31.01.2027` nach dem Zugang `01.01.2027` liegt, ist genau ein kontrollierter OK-only Lauf als naechster Evidence-Schritt vertretbar.

## Freigegebener naechster Live-Fall

`FIXEDASSETS-273-FA-DEPRECIATION-POST-ACQUISITION-CONTROLLED-OK-NO-POST`

Zielwerte:

| Feld | Zielwert |
|---|---|
| AfA-Buch | `HGB` |
| Buchungsdatum / AfA bis | `31.01.2027` |
| Belegnr. | `FADEP-273-OK` |
| Anlagenfilter | `FA-CNC-01` |

Der Lauf darf `OK` genau einmal bestaetigen und danach nur in `Fixed Asset G/L Journals` nach `FADEP-273-OK` suchen.

## Weiterhin gesperrt

- Kein Preview Posting.
- Kein Post.
- Kein Setup Change.
- Kein Company Switch.
- Keine API-Abkuerzung.
- Kein deutscher Finalnachweis.

## Anfaenger-Lernwert

`OK` auf einer Batch-Request-Page ist eine Ausfuehrungsgrenze. Vorher muessen Datum, AfA-Buch, Belegnummer und Anlagenfilter sichtbar stimmen. Nach `OK` wird zuerst das Zieljournal gesucht; man springt nicht direkt zu Preview Posting oder Post.
