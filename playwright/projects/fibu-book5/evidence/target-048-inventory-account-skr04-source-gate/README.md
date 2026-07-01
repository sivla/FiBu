# TARGET-048 - Inventory Account SKR04 Source Gate

Status: `observed`

Instanz: `playthru`

Company: `UNIVERSAARL-DE`

BC/Playwright: nicht ausgefuehrt

## Ergebnis

TARGET-048 waehlt `1140 Waren (Bestand)` als source-backed Kandidat fuer den ersten Universaarl-Lagerbewertungspfad.

Das ist noch kein Business-Central-Beweis. Das Konto ist in `UNIVERSAARL-DE` noch nicht sichtbar/reopened bewiesen. Deshalb wird kein Item Posting Group Write und kein Inventory Posting Setup Write freigegeben.

## Warum nicht 5400?

`5400 Wareneingang / Materialaufwand` ist fuer die Einkaufs-/Materialaufwandslogik vorgesehen. Ein Inventory Posting Setup `Inventory Account` braucht dagegen ein Bilanzkonto fuer Bestand/Lagerbewertung.

## Naechster enger Schritt

`TARGET-048B-INVENTORY-ACCOUNT-1140-CONTROLLED-WRITE-GATE`

Nur dieses Konto:

- `1140 Waren (Bestand)`
- Bilanz
- Kontoart Buchung
- Reopen-Proof

Nicht erlaubt im naechsten Schritt: Item Posting Groups, Inventory Posting Setup, Artikelbearbeitung, Belege, Preview Posting, Posting.
