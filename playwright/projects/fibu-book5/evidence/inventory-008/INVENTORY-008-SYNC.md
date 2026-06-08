# INVENTORY-008 Sync

Status: CRONUS-USA-Laborbuchung, `read/write`, genau einmal gebucht. Kein deutscher Finalnachweis.

## Zweck

`INVENTORY-008` ordnet den zuvor negativen `RM-M100`-Laborbestand ein und schliesst den geplanten Trainings-/Opening-Balance-Zugang praktisch ab. Der Lauf soll nicht Manufacturing oder Warehouse beweisen, sondern zeigen, wie ein bewusster Artikeljournal-Zugang eine Bestands- und Wertkette erzeugt.

## Warum `RM-M100 +2`

Vor `INVENTORY-008` war im Labor ein O2C-Abgang `RM-M100 -1` aus `FRA-ZL` belegt. Ein passender positiver Zugang fuer denselben Artikel im selben Lagerort war noch nicht belegt. Deshalb zeigte `Inventory Valuation` fuer `RM-M100` zunaechst `-42.000,00`.

Der kontrollierte Zugang `+2` ist der kleinste Trainingsschritt:

- er neutralisiert den bekannten Abgang nicht nur kosmetisch, sondern erzeugt echte Artikel-/Wertposten,
- er laesst einen Restbestand `+1` mit Wert `42.000,00`,
- er bleibt klar als Labor-Opening-Balance markiert,
- er startet keinen separaten Einkaufs-, Warehouse- oder Manufacturing-Prozess.

## Gebuchte Werte

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Dokument | `INV008-899959` |
| Buchungsart | `Positive Adjmt.` |
| Artikel | `RM-M100` |
| Lagerort | `FRA-ZL` |
| Menge | `2` |
| Unit Cost / Unit Amount | `42.000,00` |
| Betrag | `84.000,00` |
| Dimension vor Buchung | `PRODUCTLINE = MACHINE` |

## Entstandene Postenarten

| Postenart | Nachweis | Laborbefund |
|---|---|---|
| Artikelposten | `050-item-ledger-entry-page-text.txt` | Mengenbewegung `RM-M100 +2` in `FRA-ZL` |
| Wertposten | `060-value-entry-page-text.txt` | Wertbezug `84.000,00`, Unit Cost `42.000,00` |
| Sachposten | `070-gl-entry-page-text.txt` | Hauptbuchwirkung mit Inventory Account `14140` |
| Lagerbewertung | `091-inventory-valuation-preview-page-text.txt` | `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00`, `Total Inventory Value = 67.000,00` |

## Vorher / Nachher

| Zustand | RM-M100 | RAW-STEEL | Total Inventory Value | Status |
|---|---:|---:|---:|---|
| vor `INVENTORY-008` aus `INVENTORY-002` | `-42.000,00` | `25.000,00` | `-17.000,00` | Labor-Lernfall: Abgang ohne belegten Zugang |
| nach `INVENTORY-008` | `42.000,00` | `25.000,00` | `67.000,00` | Labor-Nachweis: positiver Trainingszugang gebucht |

## Was das nicht beweist

- kein deutscher Kontenplan-Endstand,
- keine deutsche `19 %` USt oder Vorsteuer,
- kein Warehouse mit Bins, Put-away, Pick oder Warehouse Shipment,
- kein Manufacturing-Output und keine Produktionskostenkette,
- keine Kostenregulierung oder Monatsabschlusslogik.

## Buchwirkung

Das Buch darf jetzt fuer Kapitel 13 und 23 sagen:

- Ein negativer Laborwert in `Inventory Valuation` kann aus einer realen Bewegungskette entstehen.
- Ein Artikeljournal-Zugang erzeugt nach bewusster Buchung Artikelposten, Wertposten und Sachposten.
- Die Lagerbewertung muss mit Stichtag, Artikel- und Lagerortfilter gelesen werden.
- Der positive `RM-M100 +2`-Zugang ist ein Trainings-/Opening-Balance-Fall, kein Fertigungsnachweis.

Das Buch darf noch nicht sagen:

- `RM-M100` wurde durch Manufacturing hergestellt,
- Warehouse ist eingerichtet oder getestet,
- die deutschen Zielkonten oder deutsche USt sind erreicht,
- die Lagerbewertung ist ein finaler deutscher Abschlussnachweis.

## Naechster sinnvoller Schritt

Keine weitere `INV008`-Buchung. Nach diesem Sync ist `PAYMENTS-001` der hoechste Nutzen: offene Debitoren-/Kreditorenposten aus `PS-INV103297` und `108219` read-only pruefen und den OP-Ausgleich vorbereiten. Alternativ bleibt Reporting-Dimensionswirkung ueber `Dimensions - Detail` oder einen kontrollierten Analysis-View-Fit offen.
