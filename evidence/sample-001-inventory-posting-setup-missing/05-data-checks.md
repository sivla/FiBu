# Data Checks

| Pruefung | Erwartung | Ergebnis im Sample |
|---|---|---|
| Verkaufszeile hat Lagerort | `FRA-ZL` | angenommen aus Fehlermeldung |
| Verkaufszeile hat Inventory Posting Group | `RESALE` | angenommen aus Fehlermeldung |
| Inventory Posting Setup Zeile existiert | Kombination `FRA-ZL` + `RESALE` | zu pruefen |
| Inventory Account gefuellt | fachlich korrektes Bestandskonto | fehlt im Fehlerbild |
| Preview Posting erzeugt Postenarten | G/L, Customer, Item, Value Entries | blockiert |

## API/OData-Idee

Wenn UI nicht reicht, strukturierte Abfrage auf Tabelle `Inventory Posting Setup` fuer Location Code und Invt. Posting Group ausfuehren.
