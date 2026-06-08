# UAT-O2C-001 Labor-Lernzusammenfassung

| Punkt | Erklaerung |
|---|---|
| Situation | Verkaufsauftrag S-ORD101067 fuer Debitor D10000, Artikel RM-M100, Menge 1, Lagerort FRA-ZL. |
| Waehrung | Der Auftrag laeuft im aktuellen Labor mit EUR. Das entspricht jetzt dem Buchziel EUR. |
| Betrag | Netto 68000, Steuer 0, Brutto 68000. |
| Steuer-/Tax-Logik | Die Verkaufszeile nutzt Tax Code FURNITURE mit 0 %. Das ist CRONUS-USA-Sales-Tax-Logik und kein deutscher 19-%-USt-Nachweis. |
| Artikel-Posting | Artikel RM-M100 traegt Base Unit PCS, Gen. Prod. Posting Group RETAIL, Inventory Posting Group RESALE und Tax Group FURNITURE. |
| Dimensionen | Die Evidence weist CHANNEL=B2B, PRODUCTLINE=MACHINE nach. Wichtig: CHANNEL kommt aus dem Auftragskontext; PRODUCTLINE=MACHINE wird im Zeilen-Dimensionsdialog sichtbar nachgewiesen. |
| Warum BC so reagiert | Business Central berechnet Betrag, Steuer und Konten nicht aus einem einzelnen Feld. Debitor, Artikel, Buchungsgruppen, Steuergruppen, Lagerort und Dimensionen wirken zusammen. |
| Anfaengerpruefung | Vor dem Buchen Kopf, Zeile, EUR-Summen, Tax/VAT-Ergebnis, Lagerort und Dimensionsdialog pruefen. Wenn Steuer 0 % bleibt, nicht als deutschen Zielbeleg buchen. |
| Buchwirkung | Das Buch darf den aktuellen Lauf als Klickpfad- und Lernnachweis verwenden. Der deutsche 19-%-USt-Endstand bleibt future-de-final. |
