# POSTING-TRACE-001 Buchungsspur-Lernatlas

Status: `labor`, `book-sync`, `no-new-bc-run`, `no-posting`.

## Zweck

Dieser Lernatlas verbindet die bereits belegten CRONUS-USA-Laborbuchungen zu einer gemeinsamen Anfaengerregel: Ein gebuchter Beleg ist erst verstanden, wenn der Leser die passenden Nebenbuchposten, Sachposten, Artikelposten, Wertposten und Berichte auseinanderhalten kann.

Der Lauf erzeugt keine neue Business-Central-Ausfuehrung. Er ordnet vorhandene Evidence fuer Buchkapitel 9, 10, 11, 12, 13, 19, 23 und 25.

## Labor-Kontext

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Modus | Buch-/Evidence-Sync aus vorhandenen Nachweisen |
| Buchung in diesem Lauf | nein |
| Deutscher Finalnachweis | offen |

## Belegte Laborbelege

| Prozess | Beleg | Buchungsoption | Nachgewiesene Posten / Auswertung | Zentrale Grenze |
|---|---|---|---|---|
| O2C | Verkaufsauftrag `S-ORD101068` -> gebuchte Verkaufsrechnung `PS-INV103297` | `Ship and Invoice` | Debitorenposten, Sachposten, Wertposten, Artikelposten `792`, Dimensionen `CHANNEL=B2B` und `PRODUCTLINE=MACHINE` am Artikelposten | keine deutsche `19 %` USt, keine sichtbare Financial-Reports-Summenwirkung nach `PRODUCTLINE`/`CHANNEL` |
| P2P | Einkaufsbestellung `106049` -> gebuchte Einkaufsrechnung `108219` | `Receive and Invoice` | Kreditorenposten, Sachposten, Wertposten, Artikelposten `793` | `USD`/CRONUS-USA-Labor, keine deutsche `19 %` Vorsteuer, keine P2P-Dimensionen in Posten sichtbar |
| Inventory | Artikeljournal `INV008-899959` | `Positive Adjmt.` / `Post` | Artikelposten, Wertposten, Sachposten `14140`, Inventory Valuation mit `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00`, `Total Inventory Value = 67.000,00` | Trainings-/Opening-Balance, kein Manufacturing, kein Warehouse, kein deutscher Abschluss |

## Anfaenger-Lernregel

| Wenn der Leser fragt ... | Dann prueft er ... | Warum |
|---|---|---|
| Wurde der Kunde belastet? | `Debitorenposten (Customer Ledger Entries)` | Dort steht die Forderung und spaeter der offene oder ausgeglichene Restbetrag. |
| Muessen wir den Lieferanten noch zahlen? | `Kreditorenposten (Vendor Ledger Entries)` | Dort steht die Verbindlichkeit und spaeter der Zahlungs-/Ausgleichsstatus. |
| Welches Konto wurde bebucht? | `Sachposten (G/L Entries)` | Das Hauptbuch zeigt Forderung, Verbindlichkeit, Erlos, Aufwand, Bestand und Wareneinsatz nach Konto. |
| Wie viele Stueck gingen rein oder raus? | `Artikelposten (Item Ledger Entries)` | Artikelposten sind die Mengenwahrheit fuer Artikel und Lagerort. |
| Welcher Wert haengt an der Menge? | `Wertposten (Value Entries)` | Wertposten verbinden Menge, Kosten, Lagerbewertung und Wareneinsatz. |
| Stimmt der Lagerwert zum Stichtag? | `Inventory Valuation` plus Artikel-/Wertposten | Der Bericht ist eine Auswertung aus der Bewegungskette, kein einzelner Beleg. |
| Ist eine Dimension reportingfaehig? | erst Beleg-/Postendimension, dann Reportingpfad | Eine Dimension am Artikelposten beweist noch keine Financial-Reports-Summe. |

## Was die aktuelle Evidence beweist

| Nachweis | Status |
|---|---|
| O2C erzeugt Debitoren-, Sach-, Wert- und Artikelposten | praktisch nachgewiesen im Labor |
| P2P erzeugt Kreditoren-, Sach-, Wert- und Artikelposten | praktisch nachgewiesen im Labor |
| Inventory Journal erzeugt Artikel-, Wert- und Sachposten sowie Lagerbewertungswirkung | praktisch nachgewiesen im Labor |
| `PRODUCTLINE=MACHINE` und `CHANNEL=B2B` sind nach O2C am Artikelposten `792` sichtbar | praktisch nachgewiesen im Labor |
| Financial Reports werten `PRODUCTLINE`/`CHANNEL` sichtbar als Summe aus | nicht nachgewiesen |
| Deutsche `19 %` USt/Vorsteuer | nicht nachgewiesen |
| Deutsche Kontenplan-Endstaende | nicht nachgewiesen |
| Zahlung, OP-Ausgleich, Bankposten und Bankabstimmung | nicht gebucht; nur bis Post-Dialog vorbereitet |

## Buchwirkung

Das Buch sollte Postenspur nicht als abstrakten Kontrollbegriff verwenden. Fuer Anfaenger muss jedes Bild erklaeren:

1. welcher gebuchte Beleg der Ausgangspunkt ist,
2. welche Postenart geoeffnet wurde,
3. welche fachliche Frage diese Postenart beantwortet,
4. welche Belegnummer, Betrag, Menge, Dimension oder Kontonummer sichtbar sein muss,
5. welche Laborgrenze noch gilt.

Die aktuelle Laborwahrheit lautet:

- `PS-INV103297` ist der O2C-Laborbeleg fuer Forderung, Erlos-/Bestands-/Wareneinsatzspur und Artikelposten-Dimension.
- `108219` ist der P2P-Laborbeleg fuer Verbindlichkeit, Bestand/Wert und Sachpostenwirkung.
- `INV008-899959` ist der Inventory-Laborbeleg fuer positiven Trainingsbestand und Lagerbewertung.
- Payments bleiben ohne echte Zahlung: `PAYMENTS-010` beweist nur den vorbereiteten Zahlungsjournalweg bis zum `Ja`/`Nein`-Dialog mit Abbruch.

## Naechster sinnvoller Schritt

Keine weitere O2C-, P2P- oder `INV008`-Buchung. Der naechste risikoarme Schritt ist entweder ein weiterer Buch-Sync fuer Postenspur-Screenshots in den jeweiligen Kapiteln oder ein freigegebener Reporting-Setup-Hebel fuer `PRODUCTLINE`/`CHANNEL`. Eine echte Zahlung bleibt `PAYMENTS-011` und braucht ausdrueckliche Freigabe.
