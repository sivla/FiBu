# FIXEDASSETS-262 Technischer Field-Mapping-Blocker

Status: `labor`, `technical-blocker`, `no-ok`, `no-preview`, `no-posting`, `not-final`.

## Befund

Der navigationsverfeinerte Retry wurde gestartet, brach aber vor dem Evidence-Writer ab. Playwright versuchte beim ersten Zielwertfeld einen Klick auf ein unsichtbares Checkbox-Input `gridSelectAllCheckBox-b3o`.

## Ursache

Wahrscheinlich wurde der Index aus der gefilterten sichtbaren Control-Liste gegen einen ungefilterten Locator verwendet. Dadurch zeigte `locator.nth(index)` nicht auf das erwartete Request-Page-Feld, sondern auf eine versteckte Grid-Checkbox.

## Grenzen

- Keine Zielwerte wurden belegt.
- Kein `OK` wurde bestaetigt.
- Kein Preview Posting.
- Keine Buchung.
- Kein Setup Change.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-263`: Lokaler Review des Field-Mapping-/Locator-Index-Fehlers. Erst danach darf ein weiterer BC-Retry geplant werden.
