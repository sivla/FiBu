# TRAINING-001 Readiness fuer Kapitel 33

| Feld | Wert |
|---|---|
| Status | labor, read-only, book-sync, no-posting, no-setup-change, not-final |
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Buchkapitel | 33 Uebungen und Loesungen |
| BC-Ausfuehrung | nein |
| Buchung | nein |
| Setup-/Stammdatenaenderung | nein |

## Zweck

Kapitel 33 soll Lernende nicht nur durch Aufgaben fuehren, sondern ihnen zeigen, woran eine fachliche Loesung in Business Central erkannt wird. Dieser Lauf fuehrt keine neue Uebung aus. Er ordnet die Uebungen und Loesungsmuster gegen den vorhandenen Evidence-Stand ein.

## Uebungs-Mapping aus vorhandener Evidence

| Uebungsbereich | Aktueller Evidence-Stand | Status fuer Kapitel 33 |
|---|---|---|
| Verkauf/O2C | `S-ORD101068` -> `PS-INV103297` ist als CRONUS-USA-Laborbuchung mit Preview, Rechnung, Debitorenposten, Sachposten, Wertposten, Artikelposten und Artikeldimensionen belegt | als Musterloesung fuer Beleg- und Postenspur nutzbar; DE-VAT offen |
| Einkauf/P2P | Bestellung `106049` -> Einkaufsrechnung `108219` ist mit `Receive and Invoice`, Kreditorenposten, Sachposten, Wertposten und Artikelposten belegt | als Musterloesung fuer Wareneingang/Rechnung und P2P-Postenspur nutzbar; deutsche Vorsteuer offen |
| Inventory | `INV008-899959` belegt positiven `RM-M100 +2`-Laborzugang, Artikelposten, Wertposten, Sachposten `14140` und Inventory Valuation | als Musterloesung fuer Lagerwert und Journal-Preflight nutzbar |
| Bank/Payments | `PAYMENTS-001` bis `PAYMENTS-010` belegen offene Posten, Journal-Draft, Amount-/Bankkonto-Lernfaelle, Apply Entries und Post-Dialog mit Abbruch | nur Readiness; keine Loesung fuer echte Zahlung oder OP-Ausgleich |
| Reporting | `REPORTING-001` bis `REPORTING-010` belegen Financial-Reports-Einstieg und mehrere Teil-/Negativpfade; `PRODUCTLINE`/`CHANNEL` sind nicht als Financial-Reports-Summenwirkung belegt | nur Teil-/Negativbefund; keine abgeschlossene Reporting-Uebungsloesung |
| Fixed Assets, Warehouse, Manufacturing, Service, Projects, Dropshipping, Intercompany, Compliance, Security, Migration, Integration, Operations | vorhandene Readiness- und Buch-Sync-Laeufe trennen sichtbare Einstiegspfade von Prozessfaehigkeit | als Checklisten-/Fehlervermeidungsstoff nutzbar; praktische Loesungen brauchen Gates |

## Was dieser Lauf beweist

- Kapitel 33 ist jetzt an die vorhandene UAT- und Evidence-Wahrheit angebunden.
- Eine Uebungsloesung gilt im Projekt nur als belastbar, wenn sie Evidence zu Klickweg, Stammdaten/Setup, erwarteter Wirkung, Postenspur, Kontrollbericht, Fehlerfall und Korrekturpfad nennt.
- O2C, P2P und Inventory koennen als CRONUS-USA-Labormuster fuer Anfaengererklaerungen verwendet werden.
- Payments und Reporting bleiben bewusst als Lern- und Grenzfaelle markiert.

## Was dieser Lauf nicht beweist

- Keine Uebung wurde in diesem Lauf praktisch neu ausgefuehrt.
- Keine Schulung wurde abgeschlossen oder abgenommen.
- Keine Zahlung, kein OP-Ausgleich, keine Bankabstimmung, kein neuer UAT-Lauf und keine neue Buchung wurden ausgefuehrt.
- Deutsche 19-%-USt, deutscher Kontenplan, deutsche Oberflaeche und finale deutsche Screenshots bleiben offen.

## Buchwirkung

Kapitel 33 darf Uebungen und Loesungen weiterhin als Trainingsbibliothek zeigen. Neu ist die Evidence-Grenze: Eine Loesung ist nicht nur eine Klickliste. Sie muss erklaeren, warum Business Central so bucht, welche Einrichtung dahinterliegt, welche Posten entstehen, welcher Bericht das Ergebnis beweist und wie typische Fehler korrigiert werden.

## Naechster Schritt

Ohne Gate ist `MB800-001-READINESS` sinnvoll: Kapitel 34 Kompetenzmatrix gegen vorhandene Evidence einordnen und klar trennen zwischen Lernabdeckung, Labor-Evidence und offizieller Pruefungsvorbereitung.
