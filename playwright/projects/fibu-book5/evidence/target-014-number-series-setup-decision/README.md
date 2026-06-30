# TARGET-014 Number Series Setup Decision

Status: `observed`, `decision-only`, `no-bc-run`.

## Ausgangspunkt

TARGET-013 hat die Seite `Nummernserie` in `playthru` / `UNIVERSAARL-DE` read-only geoeffnet. Sichtbar waren nur:

- `BANKEINZ`
- `CT-MSG`
- `VATNOTIF`

Fuer Debitoren, Kreditoren, Artikel, Verkaufsbelege, Einkaufsbelege und Journale wurde keine sichtbare Nummernserienfamilie bewiesen.

## Quellenbasis

- Microsoft Learn: `Create number series - Business Central`
- Microsoft Learn Training: `Set up number series and trail codes in Dynamics 365 Business Central`

Kernaussage fuer den naechsten Case:

- Nummernserien werden auf der Seite `No. Series` / `Nummernserie` angelegt.
- Die eigentliche Verwendung und der Zahlenbereich werden ueber `Lines` / `Zeilen` definiert.
- Wo eine Serie verwendet wird, wird in den jeweiligen Setup-Seiten zugeordnet, zum Beispiel Verkauf & Forderungen oder Einkauf & Verbindlichkeiten.
- Relationships / Verbindungen sind ein eigener Schritt und werden nicht blind angelegt.

## Entscheidung

Vor Stammdaten- oder Beleganlage braucht Universaarl eigene Nummernserienfamilien. TARGET-014 ist noch kein Setup-Change. Der naechste sinnvolle Schritt ist ein kontrollierter Setup-Preflight, der die Zielcodes und Vorher-/Nachher-Bilder vorbereitet.

## Vorgeschlagene erste Universaarl-Familien

| Familie | Zielcode | Zweck | Startnummer | Noch nicht final bewiesen |
| --- | --- | --- | --- | --- |
| Debitoren | `U-CUST` | Kundenkarten | `U-CUST00001` | Zuordnung auf Debitoren-Setup |
| Kreditoren | `U-VEND` | Kreditorenkarten | `U-VEND00001` | Zuordnung auf Kreditoren-Setup |
| Artikel | `U-ITEM` | Artikelkarten | `U-ITEM00001` | Zuordnung auf Lager-/Artikelsetup |
| Verkaufsauftrag | `U-SO` | Sales Orders / Verkaufsauftraege | `U-SO00001` | Sales & Receivables Setup |
| Verkaufsrechnung | `U-SINV` | Sales Invoices / Verkaufsrechnungen | `U-SINV00001` | Sales & Receivables Setup |
| Einkaufsbestellung | `U-PO` | Purchase Orders / Einkaufsbestellungen | `U-PO00001` | Purchases & Payables Setup |
| Einkaufsrechnung | `U-PINV` | Purchase Invoices / Einkaufsrechnungen | `U-PINV00001` | Purchases & Payables Setup |

Journal- und gebuchte Belegnummern werden separat entschieden, weil Business Central je nach Journal Template, Batch und Setup-FastTab anders arbeitet. Fuer deutsche finale Rechnungsnummern wird noch keine Compliance-Aussage getroffen.

## Naechster Schritt

`TARGET-015-NUMBER-SERIES-CONTROLLED-SETUP-PREFLIGHT`: Vorherzustand der Nummernserie und relevanter Setup-Seiten sichern, dann entscheiden, ob die Zielcodes kontrolliert angelegt werden duerfen.
