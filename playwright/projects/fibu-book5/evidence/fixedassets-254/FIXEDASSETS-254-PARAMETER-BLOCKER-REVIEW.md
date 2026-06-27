# FIXEDASSETS-254 Parameter-Blocker-Review

Status: `local-review`, `blocked-ok`, `no-bc`, `no-playwright`, `not-final`.

## Entscheidung

`FIXEDASSETS-253` gibt keinen erneuten `OK`-Klick auf `Calculate Depreciation` frei.

Der Grund ist fachlich einfach: Ein Batchlauf darf erst ausgefuehrt werden, wenn alle Zielparameter feldsicher sind. Nach FA-253 ist nur `Document No.` feldsicher. `Depreciation Book = HGB`, `Posting Date = 06/27/2026` und der Anlagenfilter `FA-CNC-01` sind noch nicht feldsicher.

## Ursache

Die Request Page zeigt Labels und Abschnitte sichtbar an, aber diese Labels sind nicht automatisch die zugaenglichen Namen der Eingabefelder. FA-253 hat mit `getByRole('textbox', { name: ... })` gesucht. Das reicht fuer diese Business-Central-Request-Page nicht aus, weil Labels, Filterbereiche und Eingaben getrennt gerendert werden koennen.

## Naechste Strategie

Naechster Fall ist `FIXEDASSETS-255-FA-DEPRECIATION-REQUEST-PAGE-GEOMETRY-MAP-NO-OK`.

Ziel: die Request Page erneut ohne `OK` oeffnen und eine vollstaendigere Control-Map erzeugen:

- alle sichtbaren Eingaben, Buttons, Labels und Filter-Controls mit Koordinaten,
- Label-/Control-Naehe fuer `Depreciation Book`, `Posting Date`, `Document No.` und `Filter: Fixed Asset`,
- kurze Tab-/Focus-Sequenz,
- keine Zielwerte schreiben,
- kein `OK`, kein Preview Posting, kein Post.

## Buchwirkung

Fuer die Klickanleitung entsteht ein wichtiger Debugging-Lernfall: Sichtbare Feldnamen beweisen nicht, dass der Automationspfad das richtige Eingabefeld getroffen hat. Vor Batchjobs in Business Central braucht die Anleitung einen Kontrollpunkt, der Feldbesitz und Parameterwerte eindeutig macht.

## Grenzen

- Keine Business-Central-Ausfuehrung in diesem Review.
- Keine neue Playwright-Ausfuehrung.
- Keine AfA-Journalzeile.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.
