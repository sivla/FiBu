# INVENTORY-001 Inventory Trace

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Modus | read-only-no-posting |
| O2C-Beleg | PS-INV103297 / RM-M100 / ILE 792 |
| P2P-Beleg | 108219 / RAW-STEEL / ILE 793 |

## Kernergebnis

| Frage | Befund |
|---|---|
| O2C-Artikelposten sichtbar | ja |
| O2C-Wertposten sichtbar | ja |
| O2C-Bestandskonto 14140 sichtbar | ja |
| P2P-Artikelposten sichtbar | ja |
| P2P-Wertposten sichtbar | ja |
| P2P-Bestand und Kreditor 14140/22100 sichtbar | ja |
| Artikelkarten sichtbar | ja |
| Lagerort FRA-ZL sichtbar | ja |
| Inventory Valuation Einstieg sichtbar | ja |
| Breite Layoutansicht fuer Tabellen aktiviert | ja |
| Neue Buchung im Lauf | nein |

## Evidence-Dateien

| Kontrollpunkt | Erwartete Marker sichtbar | Seitentext | Screenshot |
|---|---|---|---|
| o2c-item-ledger-entry-rm-m100 | ja | 010-o2c-item-ledger-entry-rm-m100-page-text.txt | inventory-001-010-o2c-item-ledger-entry-rm-m100.png |
| o2c-value-entry-rm-m100 | ja | 020-o2c-value-entry-rm-m100-page-text.txt | inventory-001-020-o2c-value-entry-rm-m100.png |
| o2c-gl-entries-inventory-cogs | ja | 030-o2c-gl-entries-inventory-cogs-page-text.txt | inventory-001-030-o2c-gl-entries-inventory-cogs.png |
| p2p-item-ledger-entry-raw-steel | ja | 040-p2p-item-ledger-entry-raw-steel-page-text.txt | inventory-001-040-p2p-item-ledger-entry-raw-steel.png |
| p2p-value-entry-raw-steel | ja | 050-p2p-value-entry-raw-steel-page-text.txt | inventory-001-050-p2p-value-entry-raw-steel.png |
| p2p-gl-entries-inventory-ap | ja | 060-p2p-gl-entries-inventory-ap-page-text.txt | inventory-001-060-p2p-gl-entries-inventory-ap.png |
| item-card-rm-m100 | ja | 070-item-card-rm-m100-page-text.txt | inventory-001-070-item-card-rm-m100.png |
| item-card-raw-steel | ja | 080-item-card-raw-steel-page-text.txt | inventory-001-080-item-card-raw-steel.png |
| location-fra-zl | ja | 090-location-fra-zl-page-text.txt | inventory-001-090-location-fra-zl.png |

## Anfänger-Lernwert

Business Central trennt Mengenbewegung und Wertbewegung. Der Artikelposten zeigt, welcher Artikel in welcher Menge an welchem Lagerort bewegt wurde. Der Wertposten zeigt die Kosten-/Wertwirkung dieser Bewegung und verbindet gebuchte Belege praktisch mit dem Artikelposten. Die Sachposten zeigen, welche Finanzkonten daraus bebucht wurden. Fuer die Buchanleitung ist deshalb nicht ein einzelner Screenshot ausreichend: Ein guter Nachweis besteht aus Beleg, Artikelposten, Wertposten und Sachposten.

## Was bewiesen ist

- O2C- und P2P-Laborposten koennen ueber Artikelposten, Wertposten und Sachposten read-only nachvollzogen werden.
- Value Entries sind die praktische Bruecke von gebuchten Belegen zu Item Ledger Entries, wenn direkte Order-/Document-Filter nicht reichen.
- FRA-ZL ist als Lagerort in beiden Inventory-Spuren sichtbar.
- 14140 ist als CRONUS-USA-Labor-Bestandskonto in den Sachposten sichtbar, soweit die Seite es zeigt.
- Breite Layoutansicht wurde fuer die gefilterten Tabellenbilder aktiviert, damit mehr fachlich relevante Spalten sichtbar sind.

## Was nicht bewiesen ist

- Kein deutscher Kontenplan-Endstand.
- Kein deutscher 19-Prozent-USt-/Vorsteuer-Endstand.
- Keine aktivierte Warehouse-Funktion und keine Warehouse-Prozessfreigabe.
- Keine finale Lagerbewertungszahl, weil Inventory Valuation nur als Einstieg gesichert wurde.
- Keine neue Buchung.

## Inventory Valuation

Der Tell-Me-Einstieg wurde gesichert: sichtbar. Eine konkrete Lagerbewertungszahl wurde in diesem Lauf nicht behauptet.

## Buchwirkung

Kapitel zu Lager und Bewertung sollten die Spur nicht nur als Klickpfad zeigen, sondern die Rollen der Postenarten erklaeren: Artikelposten fuer Menge, Wertposten fuer Bewertung/Kosten, Sachposten fuer Kontenwirkung. Die CRONUS-USA-Konten und Tax-Werte bleiben Laborbefund.

## Naechster Schritt

Inventory Valuation/Lagerbewertung mit Datum, Item-Filter und Location-Filter separat read-only ausfuehren; danach Buchkapitel Lagerbewertung mit Zahlenwirkung ergaenzen.
