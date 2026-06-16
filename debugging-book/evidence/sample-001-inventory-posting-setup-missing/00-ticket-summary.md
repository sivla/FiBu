# Ticket Summary

| Feld | Wert |
|---|---|
| Ticket-ID | SAMPLE-001 |
| Kurztitel | Inventory Posting Setup missing |
| Kunde | anonymisiertes Beispiel |
| Environment | Sandbox/Labor |
| Company | RM-DEMO oder vergleichbare Testcompany |
| User/Rolle | Sales/Consultant |
| Modul | Sales, Inventory, Finance |
| Prozess | Sales Order Preview Posting |
| Fehlermeldung | `Inventory Account is missing in Inventory Posting Setup Location Code: FRA-ZL, Invt. Posting Group Code: RESALE.` |
| Erwartung | Buchungsvorschau zeigt Postenarten |
| Ist-Verhalten | BC stoppt mit Error Messages |
| Datenschutzstatus | keine echten Kundendaten; synthetischer Fall |

## Kurzfazit

Der Fehler ist kein defekter Verkaufsauftrag. Business Central kann fuer die Kombination aus Lagerort und Lagerbuchungsgruppe kein Bestandskonto bestimmen.
