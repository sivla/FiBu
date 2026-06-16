# Repro Plan

1. Environment bestaetigen: keine Production.
2. Verkaufsauftrag read-only oeffnen.
3. Verkaufszeile pruefen: Artikel, Lagerort, Inventory Posting Group.
4. Buchungsvorschau starten, aber nicht buchen.
5. Fehlermeldung sichern.
6. `Inventory Posting Setup` read-only oeffnen.
7. Kombination `FRA-ZL` + `RESALE` suchen.
8. Feld `Inventory Account` pruefen.
9. Root Cause dokumentieren.
10. Fix nur mit Freigabe: fachlich korrektes Bestandskonto eintragen oder Setup-Entscheidung vorbereiten.

## Stop-Kriterien

- Production sichtbar.
- Button `Post` wuerde echte Buchung ausloesen.
- Konto muesste geraten werden.
- Kombination ist nicht eindeutig.
