# FIXEDASSETS-169 Entscheidung

Status: `labor`, `local-judge`, `setup-fit-candidate-unlocked`, `no-bc-run`, `no-playwright-run`, `no-setup-change`, `no-posting`, `not-final`.

## Entscheidung

`82000` wird nicht als finaler oder deutscher Zielwert behauptet. Der Wert ist aber als CRONUS-USA-Labor-Kandidat stark genug, um genau einen spaeteren UI-first Setup-Fit-Case zu planen:

`MACHINES / Acquisition Cost Bal. Acc. = 82000`

## Begruendung

FA-168 zeigt zwei getrennte Befunde:

- `MACHINES` zeigt das Zielfeld `Acquisition Cost Bal. Acc.` sichtbar, aber leer.
- `EQUIPMENT` zeigt dasselbe Feld sichtbar mit `82000`.

Das ist deutlich staerker als die vorherige Kontenplansichtung aus FA-166, weil der Wert nicht nur irgendwo im Kontenplan steht, sondern in genau demselben Feldtyp einer bestehenden Anlagenbuchungsgruppe sichtbar ist.

## Grenze

Der Musterwert beweist nicht automatisch, dass `82000` fuer `MACHINES` fachlich final richtig ist. Er erlaubt nur einen kontrollierten Labor-Fit mit Vorher-/Nachher-Evidence. Danach muss separat geprueft werden, ob Journalwerte, Preview Posting und Buchung freigegeben werden duerfen.

## Naechster Schritt

`FIXEDASSETS-170-FA-BALACCOUNT-82000-SETUP-FIT`

Der Lauf darf nur:

- `MACHINES` auf der `FA Posting Group Card` oeffnen.
- das Feld `Acquisition Cost Bal. Acc.` auf `82000` setzen.
- die Karte neu oeffnen oder aktualisieren.
- den sichtbaren Nachher-Zustand fotografieren und als JSON dokumentieren.

Der Lauf darf nicht:

- Journalwerte eingeben.
- Preview Posting oeffnen.
- `Post` klicken.
- eine Anlagenanschaffung buchen.
- deutschen Finalstand behaupten.
