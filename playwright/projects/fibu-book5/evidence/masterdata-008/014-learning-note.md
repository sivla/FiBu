# MASTERDATA-008 Inventory Posting Setup Lernbefund

| Punkt | Befund |
|---|---|
| Zielkombination | Location Code FRA-ZL, Invt. Posting Group Code RESALE |
| Situation | `UAT-O2C-001` erreicht Preview Posting, stoppt aber auf `Error Messages`. |
| Symptom | `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` |
| Warum BC so reagiert | Beim Buchen einer Artikelbewegung braucht BC nicht nur Debitor, Artikel und Preis, sondern auch eine Kontenfindung fuer Bestand. Diese kommt aus Inventory Posting Setup. |
| Laborstatus | Diagnose ausgefuehrt; Konto wurde bewusst nicht automatisch gesetzt. |
| Buchwirkung | Die Anleitung muss erklaeren, dass Lagerort und Lagerbuchungsgruppe buchungsrelevant sind. Preview Posting ist der sichere Ort, diese Luecke vor einer echten Buchung zu erkennen. |

## Pruefung nach Korrektur

Nach einer fachlich freigegebenen Kontenentscheidung erneut `npm run fibu:uat:o2c` ausfuehren. Erwartung: `Preview Posting` zeigt dann Postenvorschau oder den naechsten echten Setup-Fehler.
