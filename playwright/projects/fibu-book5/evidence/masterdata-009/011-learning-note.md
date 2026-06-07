# MASTERDATA-009 Inventory Posting Setup Fit

| Punkt | Befund |
|---|---|
| Status | Labor-Fix in CRONUS-USA-Spielwiese |
| Ziel | `FRA-ZL` + `RESALE` braucht ein `Inventory Account`, damit O2C Preview Posting nicht an dieser Stelle stoppt. |
| Kontoentscheidung | `14140`, weil vorhandene CRONUS-RESALE-Zeilen dieses Inventory Account verwenden. |
| Aktion | Inventory Account war bereits passend gesetzt. |
| Was ist damit geloest? | Die konkrete Inventory-Posting-Setup-Luecke fuer `FRA-ZL` + `RESALE` ist im Labor geschlossen. |
| Was ist nicht geloest? | Deutsche 19-%-USt, finaler deutscher Kontenplan, echte Postenvorschau und Buchung/Postenspur. |
| Anfaenger-Pruefung | Nach dem Fix muss die Zeile `FRA-ZL` + `RESALE` sichtbar `14140` zeigen. Danach wird die Buchungsvorschau erneut ausgefuehrt. |

## Naechster praktischer Schritt

`npm run fibu:uat:o2c` erneut ausfuehren. Erwartung: Die bisherige Meldung `Inventory Account is missing... FRA-ZL, RESALE` erscheint nicht mehr. Wenn ein neuer Fehler erscheint, wird er als naechster Lernfall dokumentiert.
