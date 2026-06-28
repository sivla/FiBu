# FIXEDASSETS-296 AfA-OK-Blockerreview nach frischer Belegnummer

Status: `labor-blocked`, `controlled-execute-trace`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`.

## Was bewiesen ist

- FA-291: `Calculate Depreciation` wurde mit `HGB`, `31.01.2027`, `FADEP-291-OK` und `FA-CNC-01` sichtbar vorbereitet.
- FA-291: `OK` wurde genau einmal bestaetigt.
- FA-291: `FADEP-291-OK` war danach im geprueften `Fixed Asset G/L Journals`-Kontext nicht sichtbar.
- FA-295: derselbe Zielpfad wurde mit frischer Belegnummer `FADEP-295-OK` wiederholt.
- FA-295: `OK` wurde genau einmal bestaetigt.
- FA-295: `FADEP-295-OK` war danach im geprueften `Fixed Asset G/L Journals`-Kontext ebenfalls nicht sichtbar.
- In beiden Laeufen wurde kein Preview Posting und keine Buchung ausgefuehrt.

## Entscheidung

Die AfA-Buchung bleibt in `RM-DEMO` geparkt. Ein weiterer `Calculate Depreciation OK`-Versuch ist ohne neue Ursache oder neue UI-/Setup-Hypothese nicht sinnvoll.

Fachliche Bewertung:

- Die Request Page allein beweist keine AfA-Journalzeile.
- Zwei eindeutige Document Nos. ohne sichtbares Journalergebnis sprechen gegen ein reines Belegnummernproblem.
- Preview Posting und Post bleiben gesperrt, weil keine Zeile sichtbar ist.
- Der Befund ist als Labor-Lernfall ausreichend fuer Buchdraft und Clickguide: Nach `AfA berechnen` muss die erzeugte Journalzeile sichtbar kontrolliert werden.

## Nicht bewiesen

- Es ist nicht bewiesen, ob Business Central intern gar keine Zeile erzeugt hat.
- Es ist nicht bewiesen, ob eine Zeile in einem anderen Template, Batch, Filter oder nicht sichtbaren Kontext liegt.
- Es gibt keine AfA-Preview.
- Es gibt keine AfA-Buchung.
- Es gibt keinen deutschen Finalnachweis.

## Naechster Schritt

`BOOK-FIXEDASSETS-CH21-DEPRECIATION-BLOCKER-SYNC`: Den Laborbefund in Kapitel 21 / Fixed-Assets-Clickguide so ergaenzen, dass Anfaenger verstehen:

- was sichtbar war,
- warum `OK` nicht reicht,
- warum Preview/Post gesperrt bleiben,
- was spaeter in der deutschen Zielinstanz neu bewiesen werden muss.
