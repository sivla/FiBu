# TARGET-027D11-VAT-MATRIX-ROW-SCOPED-DELETE-DIALOG-CANCEL-PROBE

Instanz: playthru
Company: UNIVERSAARL-DE

## Zweck

Die partielle INLAND/VAT19-Zeile wird fokussiert. Die sichtbare Delete-Aktion wird nur genutzt, um den Sicherheitsdialog zu pruefen. Der Dialog wird nicht bestaetigt.

## Ergebnis

Delete can be treated as a guarded route candidate because the row still exists after cancel/close proof.

## Grenzen

- Kein OK, Ja oder Yes.
- Keine absichtliche Cleanup-/Delete-Ausfuehrung.
- Keine Stammdaten.
- Kein Belegdraft.
- Keine Buchungsvorschau.
- Keine Buchung.
- Keine VAT Entries oder Sachposten.
- Keine finale deutsche USt- oder Compliance-Behauptung.
