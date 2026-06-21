# FIXEDASSETS-179 Learning

BC-Journalraster sind virtualisiert. Mehrere Controls koennen im DOM denselben verrauschten Row-Text tragen, obwohl sie sichtbar in unterschiedlichen Spalten liegen. FA-177 zeigte genau diesen Fall: Die fachlichen Werte `G05001`, `FA-CNC-01` und `HGB` waren als Controls sichtbar, der Row-Text enthielt aber Optionslisten statt einer sauberen Journalzeile.

Der Helper wurde deshalb erweitert:

- Header koennen nun `rect`-Koordinaten tragen.
- Controls koennen nun `rect`-Koordinaten tragen.
- Eine Kandidatenzelle kann lokal erkannt werden, wenn sie im `x`-Bereich eines Ziel-Headers liegt und in derselben `y`-Zeile Controls mit den geforderten fachlichen Row-Signalen liegen.

Der lokale Selftest mit FA-177-Evidence erkennt dadurch Control `14` als plausiblen `Bal. Account No.`-Kandidaten. Das ist ein Automatisierungsfortschritt, aber noch keine fachliche Freigabe fuer Werteingabe. Vor jeder Eingabe muss eine neue read-only Live-Probe zeigen, dass dieselbe Kandidatenlogik im aktuellen BC-Zustand stabil ist.
