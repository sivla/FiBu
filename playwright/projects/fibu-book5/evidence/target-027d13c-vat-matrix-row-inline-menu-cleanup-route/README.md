# TARGET-027D13C-VAT-MATRIX-ROW-INLINE-MENU-CLEANUP-ROUTE

Instanz: playthru
Company: UNIVERSAARL-DE

## Zweck

Die partielle INLAND/VAT19-Zeile wird fokussiert. Statt der bereits blockierten Toolbar-/More-Options-Loeschroute wird der sichtbare Row-Inline-Menuepfad direkt an der Zeile geprueft. Danach wird Page 472 neu geoeffnet.

## Ergebnis

Die Row-Inline-Route hat funktioniert. Nach dem Klick auf das Zeilenmenue direkt an der `INLAND`/`VAT19`-Zeile erschien der erwartete Dialog `Fortfahren und loschen?`. Nach `Ja` und erneutem Oeffnen von Page 472 ist die alte unvollstaendige Zeile nicht mehr sichtbar.

Das ist ein Cleanup-Erfolg fuer die falsche Zeile, aber noch kein fertiges USt-Setup. Die korrekte Matrixzeile muss in einem separaten Case neu angelegt oder vervollstaendigt werden.

## Grenzen

- Ja nur bei exakt erwartetem Cleanup-Dialog.
- Keine Neuerstellung der Matrixzeile in diesem Case.
- Keine Stammdaten.
- Kein Belegdraft.
- Keine Buchungsvorschau.
- Keine Buchung.
- Keine VAT Entries oder Sachposten.
- Keine finale deutsche USt- oder Compliance-Behauptung.
