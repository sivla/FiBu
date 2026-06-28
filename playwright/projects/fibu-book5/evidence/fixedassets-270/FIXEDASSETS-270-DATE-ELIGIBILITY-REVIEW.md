# FIXEDASSETS-270 AfA-Datumsreview nach FA-269

Status: `labor`, `local-review`, `judge_work`, `no-bc`, `no-playwright`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

Der Befund aus `FIXEDASSETS-269` wird angenommen: Der bisherige AfA-Ziellauf mit `30.06.2026` war fachlich nicht sinnvoll, weil der Anlagenzugang `G05001` fuer `FA-CNC-01` erst am `01.01.2027` gebucht ist.

Damit wird kein weiterer `OK`-Lauf mit `30.06.2026` freigegeben.

## Naechster sicherer Schritt

Der naechste Live-Fall ist ein no-OK Value-Preflight:

| Feld | Zielwert |
|---|---|
| AfA-Buch | `HGB` |
| Buchungsdatum / AfA bis | `31.01.2027` |
| Belegnr. | `FADEP-271-NO-OK` |
| Anlagenfilter | `FA-CNC-01` |

Der Fall darf die Werte auf der Request Page `Calculate Depreciation` beweisen, aber `OK` nicht bestaetigen.

## Anfaenger-Lernwert

Ein AfA-Lauf ist nicht nur eine technische Eingabemaske. Das Datum muss zur Historie der Anlage passen. Wenn die Anlage erst am `01.01.2027` angeschafft wurde, kann ein Stichtag `30.06.2026` keine normale AfA-Zeile fuer diese Anlage erzeugen.

## Grenzen

- Keine Business-Central-Ausfuehrung in FA-270.
- Kein Playwright-Lauf in FA-270.
- Kein `OK` auf `Calculate Depreciation`.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein deutscher Finalnachweis.

## Buchwirkung

Die Klickanleitung braucht vor der Ausfuehrung von `Calculate Depreciation` einen Kontrollpunkt: Zugangsposten und AfA-Zieldatum muessen zusammenpassen. Ein leerer Batchjob ist ein Lernfall, kein Anlass fuer blindes Wiederholen.
