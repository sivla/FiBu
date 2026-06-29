# reporting-015 Inventory Dimension / Value Trace

| Feld | Wert |
|---|---|
| Sandbox | MCP_1_20260210 |
| Company | RM-DEMO |
| Status | `labor`, `read-only`, `no-posting`, `not-final` |
| Inventory-Beleg | `INV008-899959` |
| Artikel | `RM-M100` |
| Lagerort | `FRA-ZL` |

## Kernergebnis

| Trace | Seite sichtbar | Beleg sichtbar | PRODUCTLINE=MACHINE sichtbar | CHANNEL=B2B sichtbar | Dimensionskontext sichtbar |
|---|---:|---:|---:|---:|---:|
| item-ledger-entry | ja | ja | ja | nein | ja |
| value-entry | ja | ja | ja | nein | ja |
| gl-entry | ja | ja | nein | nein | nein |

| Reporting-Kontext | Befund |
|---|---|
| Analysis Views sichtbar | ja |
| RM-PLCH sichtbar | nein |
| PRODUCTLINE in Analysis Views sichtbar | nein |
| CHANNEL in Analysis Views sichtbar | nein |

## Was wurde bewiesen?

- INV008-899959 was inspected read-only in Item Ledger Entries, Value Entries and G/L Entries.
- Analysis Views page was reachable read-only as a reporting context.
- PRODUCTLINE=MACHINE is visible in at least one posted Inventory trace context.
- PRODUCTLINE/CHANNEL was not visible as an Analysis Views reporting axis in this read-only run.

## Was wurde nicht bewiesen?

- No new Business Central posting occurred.
- No Preview Posting occurred.
- No setup or master data change occurred.
- No German final proof.
- No German 19 percent VAT proof.
- No final Financial Reports or Analysis by Dimensions sum by PRODUCTLINE/CHANNEL was proven.
- No claim that Item Journal is creditor-side P2P receipt proof.

## Anfaenger-Lernwert

Eine Dimension an der Journalzeile ist ein Vor-Buchungsnachweis. Nach der Buchung muss man gesondert pruefen, ob diese Dimension auf den erzeugten Posten oder in einem Bericht sichtbar ist. Wenn `PRODUCTLINE=MACHINE` im Artikeljournal vor der Buchung sichtbar war, aber in Artikelposten, Wertposten oder Sachposten nicht sichtbar wird, darf das Buch daraus keine Reporting-Wirkung ableiten.

## Buchwirkung

Kapitel 13 darf die Bestandswirkung von `INV008-899959` weiter als Laborbeleg verwenden. Kapitel 10/25 muessen aber weiterhin trennen: `PRODUCTLINE=MACHINE` ist vor der Inventory-Buchung belegt; eine durchgaengige Reporting-/Sachposten-Dimensionswirkung ist erst belegt, wenn sie in Posten, Analysis View oder Bericht sichtbar wird.

## Grenzen

- CRONUS-USA-Labor in `RM-DEMO`, kein deutscher Finalnachweis.
- Keine Buchung, keine Vorschau, keine Stammdaten-/Setup-Aenderung.
- Keine deutsche `19 %` USt und kein deutscher Kontenplan-Endstand.
- Keine neue oder aktualisierte Analysis View.

## Naechster Schritt

Classify the visible dimension/reporting signal and sync the Inventory/Reporting draft without German final claims.
