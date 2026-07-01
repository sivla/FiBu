# TARGET-027D10-VAT-MATRIX-ROW-ACTION-INVENTORY-NO-DELETE

Instanz: playthru
Company: UNIVERSAARL-DE

## Zweck

Die partielle INLAND/VAT19-Zeile wird nur fuer eine Aktionsinventur fokussiert. Der Lauf klickt keine Loeschen-/Delete-Aktion und bestaetigt keinen Dialog.

## Ergebnis

Cleanup may be feasible but only through a separate row-scoped delete dialog-cancel probe.

## Grenzen

- Keine Cleanup-/Delete-Ausfuehrung.
- Keine Stammdaten.
- Kein Belegdraft.
- Keine Buchungsvorschau.
- Keine Buchung.
- Keine VAT Entries oder Sachposten.
- Keine finale deutsche USt- oder Compliance-Behauptung.
