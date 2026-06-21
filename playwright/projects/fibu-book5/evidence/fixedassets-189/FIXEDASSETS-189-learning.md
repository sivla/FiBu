# FIXEDASSETS-189 Lernzusammenfassung

Status: `local-review`, `observed`, `no-bc-run`, `no-playwright-run`, `not-final`.

## Entscheidung

FA-188 wird als sicherer, aber geblockter Preview-Posting-Retry akzeptiert. Der Lauf beweist weiter den Journal-Kontext und `Bal. Account No. = 82000`, beweist aber keine Buchungsvorschau.

Der breite `Post`-Menue-Pfad ist fuer den naechsten Versuch verworfen, weil er den normalen Buchungsdialog oeffnete. Das ist kein Preview-Nachweis und darf nicht mit `OK`, `Yes` oder `Post` bestaetigt werden.

## Lernwert

Business Central kann auf einer Journalpage mehrere fachlich aehnliche Aktionen in derselben Aktionsgruppe zeigen. Fuer Playwright reicht deshalb nicht: `Post` oeffnen und danach hoffen, dass `Preview Posting` sichtbar ist. Der sicherere Pfad ist zuerst eine read-only Action Inventory:

- Welche Actions sind direkt sichtbar?
- Gibt es einen eigenen Kandidaten `Preview Posting` / `Buchungsvorschau`?
- Liegt der Kandidat in einem Frame, einer Gruppe, einem Overflow oder ist er nicht vorhanden?
- Ist der gefundene Kandidat eindeutig genug fuer einen spaeteren Preview-only Klick?

## Naechster Schritt

`FIXEDASSETS-190`: Fixed Asset G/L Journals read-only oeffnen und Aktionen inventarisieren. Nicht `Post`, nicht `Preview Posting`, kein Dialog, keine Datenveraenderung.
