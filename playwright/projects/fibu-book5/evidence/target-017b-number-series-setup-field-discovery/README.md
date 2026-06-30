# TARGET-017B Number Series Setup Field Discovery

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

TARGET-017B discovered at least one missing field route without changing setup values.

## Gefundene Routen

- purchases-payables-setup: Purchase Order Nos. -> U-PO
- sales-receivables-setup: Customer Nos. -> U-CUST wurde in der getesteten Kartenansicht nicht sichtbar.
- inventory-setup: Item Nos. -> U-ITEM wurde in der getesteten Kartenansicht nicht sichtbar.

## Screenshot-QA

- `target-017b-sales-receivables-setup-field-discovery.png`: Verkaufssetup sichtbar, aber keine sichere Debitorennummern-Feldroute.
- `target-017b-purchases-payables-setup-field-discovery.png`: Einkaufssetup sichtbar; Bestellungsnummern-Kandidaten sind vorhanden, aber noch nicht zugewiesen.
- `target-017b-inventory-setup-field-discovery.png`: Lagereinrichtung sichtbar, aber keine sichere Artikelnummern-Feldroute.

## Naechster sinnvoller Schritt

TARGET-019 entscheidet, ob die offenen Nummerierungsfelder bewusst geparkt werden koennen, damit die Posting-Groups-Preflight-Strecke weitergeht, oder ob genau eine neue, nicht wiederholte Feldroute erforderlich ist.

## Grenzen

- Keine neuen Nummernserienwerte zugewiesen.
- Keine Stammdaten.
- Kein Belegentwurf.
- Keine Preview und keine Buchung.
- Keine Checkbox-Aenderung an Nummernserienzeilen.
- Keine rechtliche Aussage zur deutschen Rechnungsnummern-Compliance.
