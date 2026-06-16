# Repro Steps

1. In Sandbox/Testcompany anmelden.
2. Verkaufsauftrag mit Artikelzeile und Lagerort `FRA-ZL` oeffnen.
3. Pruefen, dass die Zeile Inventory Posting Group `RESALE` nutzt.
4. `Preview Posting` starten.
5. Error Messages sichern.
6. `Inventory Posting Setup` oeffnen.
7. Zeile `FRA-ZL` + `RESALE` pruefen.
8. `Inventory Account` lesen.

## Erwartetes Repro-Ergebnis

Die Buchungsvorschau stoppt, solange fuer die Kombination kein Inventory Account gepflegt ist.
