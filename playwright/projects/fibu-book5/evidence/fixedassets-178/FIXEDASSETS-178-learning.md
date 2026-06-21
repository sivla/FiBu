# FIXEDASSETS-178 Learning

FA-177 hat einen wichtigen Fehler verhindert: Der Playwright-Lauf sah zwar die Seite `Fixed Asset G/L Journals`, die Spalte `Bal. Account No.` und mehrere Controls der aktuellen Zeile. Die Control-Texte waren aber nicht sauber an die fachliche Zeile gebunden. Stattdessen enthielten sie vor allem Optionslisten wie `G/L Account`, `Customer`, `Vendor`, `Fixed Asset` oder `Purchase`, `Sale`, `Settlement`.

Das bedeutet fuer Anfaenger und Buchtext: Ein sichtbarer Spaltenkopf ist noch kein Beweis, dass Business Central den richtigen Wert in der richtigen Zeile akzeptiert. Bei Journalrastern muss vor jeder Eingabe klar sein:

- Welche fachliche Zeile ist gemeint?
- Welche Spalte ist gemeint?
- Welches sichtbare oder technische Control gehoert zu dieser Zeile und Spalte?
- Ist das Control wirklich editierbar?

Die sichere Entscheidung lautet daher: `82000` darf noch nicht in `Bal. Account No.` eingetragen werden. Preview Posting und Post bleiben ebenfalls gesperrt.

Naechster Schritt: Ein lokaler Helper-Verbesserungslauf soll Grid-Geometrie und Header-Reihenfolge nutzen, um Kandidaten aus `rect.x/rect.y` und sichtbaren Headern abzuleiten. Danach muss wieder eine read-only Probe laufen, bevor Werteingabe erlaubt werden kann.
