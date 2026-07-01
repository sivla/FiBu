# TARGET-036B Customer/Vendor/Item Card Route Discovery

Status: observed
Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

Customer, Vendor and Item New routes opened direct cards with Vorlage anwenden / Apply Template actions and were closed/cancelled without saving records.

## Routen

- Customers / Debitoren: card-with-apply-template-action
- Vendors / Kreditoren: card-with-apply-template-action
- Items / Artikel: card-with-apply-template-action

## Grenzen

- Keine Debitoren, Kreditoren oder Artikel wurden gespeichert.
- Keine Vorlage wurde angewendet; sichtbar war eine Kartenroute mit der Aktion Vorlage anwenden.
- Keine Setup-Felder, Belege, Preview oder Buchung.
- Ein spaeterer Schreibcase braucht eine eigene Feldliste und einen neuen Smart Decision Gate.
