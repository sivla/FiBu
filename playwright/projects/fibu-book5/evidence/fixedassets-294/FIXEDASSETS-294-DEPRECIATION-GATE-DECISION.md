# FIXEDASSETS-294 AfA-Gate-Entscheidung

Status: `labor-blocked`, `execution-gate`, `needs-german-final-rebuild`.

## Ausgangslage

- FA-291: `Calculate Depreciation` wurde mit `HGB`, `31.01.2027`, `FADEP-291-OK` und `FA-CNC-01` sichtbar vorbereitet und `OK` genau einmal bestaetigt.
- FA-292: lokaler Review hat blindes Wiederholen von `FADEP-291-OK` gesperrt.
- FA-293: `Fixed Asset G/L Journals` wurde read-only geoeffnet. `DEFAULT` war sichtbar, aber `FADEP-291-OK`, `FA-CNC-01`, `HGB` und `31.01.2027` waren im sichtbaren Journal-Kontext nicht sichtbar.

## Entscheidung

Die naechste fachlich sauberste Route ist ein kontrollierter OK-only Execute-Case mit neuer eindeutiger Belegnummer `FADEP-295-OK`.

Begruendung:

- Ein erneutes `OK` mit `FADEP-291-OK` waere ein Blind-Repeat und bleibt verboten.
- Preview Posting und Post bleiben verboten, solange keine AfA-Journalzeile sichtbar ist.
- Ein neuer, eindeutiger Document No. trennt den neuen Versuch vom alten Negativbefund.
- Direkt nach `OK` muss erneut read-only im Journal gesucht werden.

## Nicht gewaehlt

- Nur parken: nicht gewaehlt, weil der Laborprozess noch einen klaren naechsten Erkenntnishebel hat.
- Preview/Post: nicht gewaehlt, weil keine AfA-Journalzeile sichtbar ist.
- Setup Change: nicht gewaehlt, weil der aktuelle Befund zuerst eine saubere Output-Suche/OK-only-Kontrolle braucht.

## Anfaenger-Lernpunkt

`Calculate Depreciation` ist kein Buchungsnachweis. Erst die erzeugte Journalzeile ist der naechste Kontrollpunkt. Wenn sie nicht sichtbar ist, darf man nicht zur Buchungsvorschau oder Buchung springen.

## Grenze

Diese Entscheidung ist RM-DEMO-Labor. Sie ist kein deutscher Finalnachweis und muss spaeter in einer deutschen Zielinstanz neu aufgebaut werden.
