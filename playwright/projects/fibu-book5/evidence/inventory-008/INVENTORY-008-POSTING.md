# INVENTORY-008 Positive RM-M100 Laborbuchung

Status: CRONUS-USA-Laborbuchung, bewusst genau einmal gebucht, kein deutscher Finalnachweis.

## Ziel

`INVENTORY-004` bis `INVENTORY-007` haben den Zielbestand geplant, den Item-Journal-Draft vorbereitet und den Journal Check ohne Issues belegt. Dieser Lauf bucht den Trainings-/Opening-Balance-Zugang `RM-M100 +2` in `FRA-ZL` und prueft danach die Postenspur.

## Ergebnis

| Pruefpunkt | Ergebnis |
|---|---|
| Sandbox | MCP_1_20260210 |
| Company | RM-DEMO |
| Document No. | INV008-899959 |
| Zielzeile sichtbar | ja |
| Journal Check ohne Issues | ja |
| Dimension PRODUCTLINE=MACHINE vor Buchung | ja |
| Gebucht | ja |
| Item Ledger Entry sichtbar | ja |
| Value Entry sichtbar | ja |
| G/L Entry sichtbar | ja |
| Inventory Valuation korrigiert RM-M100 auf +42.000 | ja |

## Anfaenger-Lernwert

Ein positiver Bestand entsteht in Business Central nicht durch eine Sachkontenbuchung, sondern durch eine Artikelbewegung. Das Item Journal erzeugt nach der Buchung Artikelposten und Wertposten; je nach Setup entstehen beziehungsweise aktualisieren sich auch Sachposten. Der Journal Check ist die Vorabkontrolle, die Postenspur ist der Nachweis nach der Buchung.

## Buchwirkung

Kapitel 13/23 kann jetzt die komplette Labor-Kette erklaeren: negativer Ausgangswert, Zielbestandsplan, Journal-Draft, Journal Check, bewusste Laborbuchung, Postenspur und korrigierte Inventory Valuation. Alle Bilder bleiben CRONUS-USA-Laborbilder und muessen fuer finale deutsche Screenshots neu erzeugt werden.

## Grenze

Keine deutsche 19-%-USt, kein deutscher Kontenplan-Endstand, keine Warehouse-Aktivierung, kein Manufacturing-Nachweis und keine Kostenregulierung. Diese Buchung ist bewusstes Labor-Training und darf nicht als deutscher Produktiv- oder Abschlussnachweis ausgegeben werden.

## Naechster Schritt

Inventory-Laborblock didaktisch abrunden: Buch/Coverage auf die neue positive Bestandskette synchronisieren und danach entweder Reporting-Dimension-Perspective read-only oder Payments/OP-Ausgleich als naechsten Prozessblock waehlen.
