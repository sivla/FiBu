# TARGET-048B Inventory Account 1140 Controlled Write Gate

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

1140 controlled write gate blocked: 1140 Waren (Bestand) ist im Kontenplan sichtbar, aber weiterhin als GuV/Buchung statt Bilanz/Buchung. Item Posting Groups und Inventory Posting Setup bleiben gesperrt.

## Smart Decision

TARGET-048 hat 1140 Waren (Bestand) als source-backed Kandidat fuer das spaetere Inventory Posting Setup ausgewaehlt. In diesem Lauf durfte deshalb nur dieses eine Sachkonto geprueft oder angelegt werden.

## Grenzen

- Kein vollstaendiger SKR04-Kontenplan.
- Keine Steuerberaterfreigabe.
- Keine Item Posting Group.
- Keine Inventory Posting Setup Zeile.
- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.
- Kein API Shortcut.

## UI-Learning

- `Neu` im Kontenplan kann eine neue leere BC-Grid-Zeile erzeugen, ohne normale Textboxen offenzulegen.
- Die Keyboard-Grid-Route konnte `1140 Waren (Bestand)` anlegen, Business Central setzte das Konto aber zunaechst als `GuV`.
- Die Listen- und Kartenkorrektur hat `GuV/Bilanz` noch nicht sauber auf `Bilanz` persistiert.
- Der naechste Case muss die Sachkontokarte/Page-Inspection gezielt fuer genau dieses Feld nutzen.
