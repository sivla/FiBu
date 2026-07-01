# TARGET-027D13-VAT-MATRIX-CONTROLLED-CLEANUP-EXECUTION

Instanz: playthru
Company: UNIVERSAARL-DE

## Zweck

Die partielle INLAND/VAT19-Zeile wird fokussiert. Die sichtbare Delete-Aktion wird nur nach frischem Zeilen- und Dialogbeweis bestaetigt. Danach wird Page 472 neu geoeffnet.

## Ergebnis

Blockiert: Der erwartete Dialog `Fortfahren und loschen?` wurde mit `Ja` bestaetigt, aber nach erneutem Oeffnen von Page 472 ist die `INLAND`/`VAT19`-Zeile weiterhin sichtbar.

Das ist kein Cleanup-Erfolg. Der Lauf beweist nur:

- die Zielzeile war vor dem Versuch sichtbar,
- die getestete Delete-Route fuehrte in den erwarteten Dialog,
- der bestaetigte Dialog entfernte die Zeile nicht nachweisbar,
- die toolbar-/More-Options-Route darf nicht blind wiederholt werden.

Naechster sinnvoller Versuch ist eine andere UI-Hypothese: Row-Inline-Ellipsis direkt an der sichtbaren Zielzeile.

## Grenzen

- Ja nur bei exakt erwartetem Cleanup-Dialog.
- Keine Neuerstellung der Matrixzeile in diesem Case.
- Keine Stammdaten.
- Kein Belegdraft.
- Keine Buchungsvorschau.
- Keine Buchung.
- Keine VAT Entries oder Sachposten.
- Keine finale deutsche USt- oder Compliance-Behauptung.
