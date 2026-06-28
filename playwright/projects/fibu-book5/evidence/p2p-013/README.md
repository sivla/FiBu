# P2P-013 Item Journal Existing Trace Sync

Status: `labor-sufficient-for-book-draft`, `existing-evidence-sync`, `needs-german-final-rebuild`.

P2P-012 hat Item Journal als stabilsten direkt erreichbaren Mengen-/Lager-/Wertpfad beobachtet. P2P-013 bucht nichts neu, sondern verknuepft diese Routenentscheidung mit der bereits vorhandenen `INVENTORY-008`-Postenspur.

## Ergebnis

Item Journal ist fuer das Buch ein guter Laborpfad, um Materialzugang, Menge, Lagerort, Wertposten, Sachposten und Inventory Valuation zu erklaeren. Es ist aber kein vollstaendiger Kreditoren-P2P-Prozess: Es gibt keinen Kreditor, keine Einkaufsrechnung und keinen Teil-Wareneingang gegen eine Purchase Order.

## Buchwirkung

Kapitel 12 darf Item Journal als Abgrenzung nennen: Wenn Purchase-Order-Zeilen in der Sandbox schwer stabil zu bearbeiten sind, kann Item Journal die Materialwirkung zeigen, aber nicht den Einkaufsbelegfluss ersetzen.

Kapitel 13 darf die eigentliche Inventory-Wirkung aus `INVENTORY-008` verwenden.

## German Final Rebuild

Spaeter muss die deutsche Zielinstanz beide Dinge getrennt neu zeigen:

- echter P2P-Pfad mit Kreditor/Einkaufsbeleg/Wareneingang/Rechnung,
- Inventory-/Journalpfad fuer Material- und Lagerwertwirkung.
