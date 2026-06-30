# TARGET-017 Number Series Setup Assignment

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

TARGET-017 assigned 4/7 planned setup fields; remaining fields are blocked for diagnostics.

## Sichtbar bewiesen

- Verkaufssetup: `U-SO` fuer Auftragsnummern.
- Verkaufssetup: `U-SINV` fuer Rechnungsnummern.
- Einkaufssetup: `U-VEND` fuer Kreditorennummern.
- Einkaufssetup: `U-PINV` fuer Einkaufsrechnungsnummern.

## Blockiert fuer TARGET-017B

- Verkaufssetup: Debitorennummern `U-CUST`.
- Einkaufssetup: Einkaufsbestellungsnummern `U-PO`.
- Lager Einrichtung: Artikelnummern `U-ITEM`.

## Grenzen

- Keine Stammdaten.
- Kein Belegentwurf.
- Keine Preview und keine Buchung.
- Keine Checkbox-Aenderung an Nummernserienzeilen.
- Keine rechtliche Aussage zur deutschen Rechnungsnummern-Compliance.

## UI-Learning

Setupkarten koennen zweispaltig sein. Ein gleich hoher rechter Kartenwert ist nicht automatisch das Feld zum linken Label. Nach Reopen koennen Nummernserienwerte als sichtbarer Text oder Button/Link erscheinen, nicht nur als editierbares Eingabefeld. Deshalb gelten Screenshot, Text-Snapshot und Diagnostics zusammen als Evidence.
