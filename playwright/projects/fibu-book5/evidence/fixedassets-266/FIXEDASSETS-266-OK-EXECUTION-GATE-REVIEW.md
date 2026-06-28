# FIXEDASSETS-266 - OK-Ausfuehrungsgate fuer AfA

Status: `observed`, lokaler Review, keine Business-Central-Ausfuehrung, keine Playwright-Ausfuehrung.

## Entscheidung

`FIXEDASSETS-265` hat alle Zielwerte auf der `Calculate Depreciation` Request Page ohne `OK` bewiesen:

- `Depreciation Book = HGB`
- `Posting Date = 30.06.2026`
- `Document No. = FADEP-265-NO-OK`
- `Fixed Asset No. = FA-CNC-01`

Damit ist genau ein kontrollierter OK-Ausfuehrungslauf fachlich vertretbar. Ziel ist nicht Posting, sondern zu lernen, ob Business Central daraus AfA-Journalzeilen erzeugt.

## Freigabe fuer den naechsten Case

`FIXEDASSETS-267` darf:

- `Calculate Depreciation` oeffnen
- Zielwerte mit neuer Dokumentnummer `FADEP-267-OK` setzen
- `OK` genau einmal bestaetigen
- danach in `Fixed Asset G/L Journals` nach `FADEP-267-OK` suchen

## Weiterhin gesperrt

- Preview Posting
- Post
- Setup Change
- Company Switch
- API-Abkuerzung

Der naechste Lauf muss Keep/Cleanup-Status fuer eine entstehende Journalzeile dokumentieren.
