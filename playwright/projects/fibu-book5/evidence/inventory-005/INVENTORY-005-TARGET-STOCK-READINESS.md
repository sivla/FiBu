# INVENTORY-005 Target Stock Readiness

Status: Labor-Readiness, read-only, keine Buchung.

## Ziel

Nach `INVENTORY-004` soll der positive Trainings-/Opening-Balance-Zugang fuer `RM-M100` vorbereitet werden. Dieser Lauf prueft nur den stabilen BC-Einstieg und die sichtbaren Kontrollpunkte. Er erzeugt keinen Artikelposten.

## Geplanter fachlicher Zielzustand

| Feld | Wert |
|---|---|
| Artikel | RM-M100 |
| Lagerort | FRA-ZL |
| Zugang | 2 |
| Unit Cost | 42000 |
| Dimension | PRODUCTLINE=MACHINE |

## Praktischer Befund

| Pruefpunkt | Ergebnis |
|---|---|
| Sandbox | MCP_1_20260210 |
| Company | RM-DEMO |
| Direkte Seite 40 wirkt wie Item Journal | ja |
| Tell-Me zeigt Journal-Treffer | ja |
| Feld Artikel/No. sichtbar | ja |
| Feld Entry Type sichtbar | ja |
| Feld Posting Date sichtbar | ja |
| Feld Document No. sichtbar | ja |
| Feld Location Code sichtbar | ja |
| Feld Quantity sichtbar | ja |
| Dimensionen sichtbar/ansprechbar | nein |
| Preview-Hinweis/Aktion sichtbar | nein |
| Buchungsaktion sichtbar | ja |
| Bestehende/default Journalzeile sichtbar | nein |
| Zielartikel RM-M100 bereits sichtbar | nein |
| Ziellagerort FRA-ZL bereits sichtbar | nein |
| Zielmenge 2 bereits sichtbar | nein |
| FactBox eingeklappt | ja |
| Breite Layoutansicht aktiviert | ja |
| Neue Buchung | nein |

## Anfaenger-Lernwert

Ein Bestand wird in Business Central nicht durch eine manuelle Sachpostenbuchung korrigiert, wenn Artikel- und Lagerbewertung verstanden werden sollen. Der richtige Einstieg ist ein Artikel-/Bestandsjournal, weil Business Central daraus Artikelposten, Wertposten und je nach Setup Sachposten erzeugen kann. Vor einer Buchung muss sichtbar sein, ob Artikel, Buchungsart, Datum, Belegnummer, Lagerort, Menge, Kosten und Dimensionen kontrolliert gesetzt werden koennen.

## Buchwirkung

Kapitel 13/23 koennen den naechsten Praxisschritt jetzt konkret formulieren: zuerst das Item Journal als kontrollierten Einstieg zeigen, danach erst die positive Trainingsbewegung buchen. Das verhindert, dass Leser eine negative Lagerbewertung mit einer falschen Fibu-Direktbuchung zu reparieren versuchen.

## Laborgrenze

Dieser Lauf beweist keinen Bestand, keine Postenspur, keine Lagerbewertungsverbesserung, keinen deutschen Kontenplan und keine deutsche USt. Page 40 und die sichtbaren Beschriftungen sind CRONUS-USA-/RM-DEMO-Laborbefund und muessen fuer finale deutsche Bilder erneut belegt werden.

## Naechster konkreter Schritt

INVENTORY-006 sollte genau eine kontrollierte Ziel-Journalzeile fuer `RM-M100 +2` in `FRA-ZL` vorbereiten. Vor `Post` muss geklaert werden, ob `Preview Posting` auf dem Journal stabil erreichbar ist. Erst wenn Zielwerte, Dimension und Preview passen, darf genau einmal gebucht und danach Artikelposten, Wertposten, Sachposten und `Inventory Valuation` gesichert werden.
