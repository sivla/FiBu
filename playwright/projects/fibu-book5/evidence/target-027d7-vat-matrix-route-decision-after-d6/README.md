# TARGET-027D7 VAT matrix route decision after D6

D7 ist ein lokaler Entscheidungsfall. Es wurde kein Business Central geoeffnet und kein Playwright gestartet.

Entscheidung: Der naechste Execute-Case ist TARGET-027D8-VAT-MATRIX-LIST-EDIT-ACTION-ROUTE. Der Grund ist die D6-Evidence: Page 472 zeigt Weitere Optionen und Liste bearbeiten, waehrend direkte Zell-Edit-Routen aus D3/D5 fuer 3806/1406 gesperrt bleiben.

D8 darf erst schreiben, wenn nach sichtbarem Liste-bearbeiten-Weg echte aktive Editoren fuer MwSt. %, Umsatzsteuerkonto und Vorsteuerkonto bewiesen sind. Sonst stoppt D8 ohne Werteingabe.

Nicht bewiesen: keine fertige VAT-Matrix, keine 19-Prozent-USt in BC, keine Preview, keine VAT Entries, keine Sachposten.
