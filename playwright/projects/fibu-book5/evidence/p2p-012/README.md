# P2P-012 Alternative Standard-UI Route

Status: `labor-route-comparison`, `read-only`, `needs-german-final-rebuild`.

Dieser Lauf vergleicht alternative Standard-UI-Routen fuer P2P/Inventory-Wirkung, ohne die blockierten Purchase-Order-Line-Edit-Routen aus P2P-009 bis P2P-011 zu wiederholen.

| Route | Page ID | Status | Mengen-/Lager-/Wertsignal | Buchkapitel-Nutzen | Grenze |
|---|---:|---|---|---|---|
| Purchase Journal | 254 | observed | ja | P2P-Kapitel; potenziell geeignet, wenn Werteingabe und Posting-Gate spaeter sichtbar kontrollierbar sind. | Keine Werteingabe, kein Preview, keine Buchung |
| Item Journal | 40 | observed | ja | Inventory-Kapitel und P2P-Abgrenzung; gut fuer Mengen-/Lagerwertwirkung, aber kein Kreditorenprozess. | Keine Werteingabe, kein Preview, keine Buchung |
| Purchase Invoices | 9308 | observed | ja | P2P-Kapitel; potenziell geeignet, wenn Werteingabe und Posting-Gate spaeter sichtbar kontrollierbar sind. | Keine Werteingabe, kein Preview, keine Buchung |
| Requisition Worksheet | 291 | observed | ja | Nur Readiness-/Planungsroute; nicht als gebuchter P2P- oder Inventory-Nachweis ausreichend. | Keine Werteingabe, kein Preview, keine Buchung |

## Ergebnis

Bevorzugte naechste Route: Item Journal.

## Buchwirkung

Das Buch darf diesen Befund als Labor-Routenentscheidung nutzen: Purchase-Order-Line-Zell-Edits werden nicht weiter blind wiederholt; der naechste P2P/Inventory-Versuch muss eine besser kontrollierbare Standard-UI verwenden.

## German Final Rebuild

Alle spaeteren finalen Screenshots und Buchungsnachweise muessen in der deutschen Zielinstanz neu erzeugt werden.
