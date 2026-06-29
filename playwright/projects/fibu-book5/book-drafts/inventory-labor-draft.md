# Inventory Labor Draft - Item Journal Material Effect

Status:
- Buchziel: kontrollierte Bestandsbewegung, Postenspur und Lagerbewertung fuer Kapitel 13 erklaeren.
- Mandant: `RM-DEMO` in `MCP_1_20260210`.
- Laborstand: `labor-proven` und `labor-sufficient-for-book-draft`.
- DE-Finalnachweis: offen, spaeter in deutscher Zielinstanz neu aufzubauen.
- Buchung erfolgt: ja, als kontrollierte RM-DEMO-Laborbuchung `INV008-899959`.
- Evidence Pack: `playwright/projects/fibu-book5/evidence/inventory-008/`.
- Offene Grenzen: kein deutscher Kontenplan, keine deutsche USt, kein Warehouse, kein Manufacturing, keine Kostenregulierung.
- Nicht behaupten: Item Journal ist kein Kreditoren-/Purchase-Order-Wareneingang und kein deutscher Finalnachweis.

## Was wurde praktisch bewiesen?

`INVENTORY-008` hat in `RM-DEMO` einen positiven Artikeljournal-Zugang fuer `RM-M100` gebucht:

| Punkt | Laborbefund |
|---|---|
| Belegnummer | `INV008-899959` |
| Seite/Pfad | `Item Journals` / Artikeljournale |
| Buchungsart | `Positive Adjmt.` |
| Artikel | `RM-M100` |
| Lagerort | `FRA-ZL` |
| Menge | `+2` |
| Unit Cost | `42.000,00` |
| Betrag | `84.000,00` |
| Dimension vor Buchung | `PRODUCTLINE=MACHINE` sichtbar |
| Preflight | `Journal Check` ohne sichtbare Issues |
| Buchung | genau eine kontrollierte Laborbuchung |

Die Postenspur nach der Buchung ist belegt:

| Posten/Bericht | Was der Leser sehen soll |
|---|---|
| Artikelposten (Item Ledger Entries) | `INV008-899959`, `RM-M100`, `FRA-ZL`, Menge `2` |
| Wertposten (Value Entries) | `INV008-899959`, `RM-M100`, Menge `2`, Betrag `84.000,00`, Unit Cost `42.000,00` |
| Sachposten (G/L Entries) | `INV008-899959`, Betrag `84.000,00`, Bestandkonto `14140` |
| Lagerbewertung (Inventory Valuation) | `RM-M100 = 42.000,00`, `RAW-STEEL = 25.000,00`, `Total Inventory Value = 67.000,00` |

## Warum war dieser Schritt noetig?

Vor `INVENTORY-008` zeigte die Labor-Lagerbewertung fuer `RM-M100` einen negativen Wert, weil aus dem O2C-Labor ein Abgang belegt war, aber im betrachteten Kontext kein positiver Trainingszugang fuer `RM-M100`. Das korrigiert man nicht ueber eine manuelle Sachkontozeile, weil sonst Artikelposten und Wertposten fehlen wuerden.

Das Artikeljournal ist hier der richtige Laborpfad, weil es die Bestandsmenge und den Lagerwert im Artikel-/Wertpostenmodell bewegt. Dadurch kann der Leser verstehen, warum Lagerbewertung, Artikelposten, Wertposten und Sachposten zusammen gelesen werden muessen.

## Was ist die Grenze gegen P2P?

Diese Evidence ersetzt keinen Einkaufsprozess:

- Kein Kreditor wird bebucht.
- Keine Einkaufsbestellung wird teilweise geliefert.
- Keine Einkaufsrechnung entsteht.
- Keine Kreditorenposten entstehen.
- Kein Purchase-Order-Teilwareneingang wird dadurch bewiesen.

Fuer das P2P-Kapitel bleibt deshalb korrekt: Die Purchase-Order-Teilwareneingangsroute ist im Labor geparkt, waehrend die direkte Purchase-Journal-Route fuer Kreditor/Sachkonto und die Item-Journal-Route fuer Material-/Inventory-Wirkung getrennt erklaert werden.

## Anfaengererklaerung

Wenn du in Business Central Lagerwerte pruefst, reicht ein einzelner Bildschirm nicht. Der Zusammenhang ist:

1. Das Artikeljournal erzeugt die Bewegung.
2. Der Artikelposten beweist die Menge.
3. Der Wertposten beweist den Kostenwert.
4. Der Sachposten beweist die Hauptbuchwirkung.
5. Die Lagerbewertung fasst die Werte als Bericht zusammen.

Wenn einer dieser Punkte fehlt, ist die Buchwirkung nicht vollstaendig verstanden. Ein sichtbarer `Post`-Button bedeutet noch nicht, dass gebucht werden darf. Vor der Buchung braucht es mindestens Zielwerte, Dimension, `Journal Check` und einen Plan, welche Posten nachher geprueft werden.

## Screenshot-Platzhalter fuer Buchmaster

| Platzhalter | Zweck | Laborbild |
|---|---|---|
| `CH13-INV-01` | Artikeljournalzeile vor Buchung mit Zielwerten | `playwright/projects/fibu-book5/img/inventory-008-010-journal-line-before-post.png` |
| `CH13-INV-02` | Buchungsdialog vor Bestätigung | `playwright/projects/fibu-book5/img/inventory-008-030-post-confirm-dialog.png` |
| `CH13-INV-03` | Artikelposten nach Buchung | `playwright/projects/fibu-book5/img/inventory-008-050-item-ledger-entry.png` |
| `CH13-INV-04` | Wertposten nach Buchung | `playwright/projects/fibu-book5/img/inventory-008-060-value-entry.png` |
| `CH13-INV-05` | Sachposten Bestandkonto `14140` | `playwright/projects/fibu-book5/img/inventory-008-070-gl-entry.png` |
| `CH13-INV-06` | Lagerbewertung nach Zugang | `playwright/projects/fibu-book5/img/inventory-008-091-inventory-valuation-preview.png` |

## German Final Rebuild

Dieser Laborblock muss spaeter in einer deutschen Zielinstanz neu aufgebaut werden:

- deutsche Zielcompany und Rollen-/Sprachkontext sichtbar machen,
- deutsche Artikel-/Lagerort-/Buchungsgruppen pruefen,
- Inventory Posting Setup mit deutschem Zielkontenplan belegen,
- Artikeljournal-Zielwerte und Dimensionen vor Buchung zeigen,
- Preflight oder Journal Check sichern,
- genau eine kontrollierte Buchung oder einen fachlich passenden Zielprozess buchen,
- Artikelposten, Wertposten, Sachposten und Lagerbewertung neu nachweisen,
- deutsche Screenshots und Buchbegriffe ersetzen,
- nicht aus `RM-DEMO` auf deutschen Finalzustand schliessen.

Naechster sinnvoller Laborpunkt: pruefen, ob `PRODUCTLINE=MACHINE` aus der Item-Journal-Laborbuchung in Posting Trace, Analyseansichten oder Reporting sichtbar/nutzbar wird. Bisher ist die Dimension vor Buchung sichtbar, aber nicht als durchgaengige Reporting-Wirkung bewiesen.

## REPORTING-015 Nachtrag: Dimension sichtbar, Reportingwirkung noch offen

`REPORTING-015` hat `INV008-899959` read-only in Artikelposten, Wertposten, Sachposten und Analysis Views nachverfolgt. Das Ergebnis ist wichtig fuer die Bucherklaerung:

| Kontext | Laborbefund |
|---|---|
| Artikelposten | `PRODUCTLINE=MACHINE` ist im Dimensionskontext sichtbar. |
| Wertposten | `PRODUCTLINE=MACHINE` ist im Dimensionskontext sichtbar. |
| Sachposten | `14140` und Betrag sind sichtbar; `PRODUCTLINE`/`CHANNEL` wurden nicht als sichtbare Dimension bewiesen. |
| Analysis Views | Seite ist read-only erreichbar; `PRODUCTLINE`/`CHANNEL` wurden nicht als Auswertungsachse bewiesen. |

Fuer Anfaenger heisst das: Eine Dimension kann am Beleg oder an einzelnen Posten sichtbar sein, ohne dass damit schon eine fertige Reporting-Auswertung bewiesen ist. Zwischen "Dimension ist am Posten sichtbar" und "Bericht wertet danach aus" liegt in Business Central noch eine eigene Reporting-/Analyse-Setup-Frage.

Fuer das Buch reicht `REPORTING-015` als Laborhinweis und Clickguide-Grenze: Im RM-DEMO-Labor ist `PRODUCTLINE=MACHINE` bei Artikel-/Wertposten nachweisbar. Nicht behauptet werden darf, dass `CHANNEL=B2B`, Sachposten oder Analysis Views die Dimension bereits als Reportingachse auswerten.

Evidence:
- `playwright/projects/fibu-book5/evidence/reporting-015/REPORTING-015-result.json`
- `playwright/projects/fibu-book5/evidence/reporting-015/REPORTING-015-INVENTORY-DIMENSION-VALUE-TRACE.md`

German Final Rebuild:
- Dimensionen in deutscher Zielcompany erneut vor und nach Buchung nachweisen.
- Sachposten-/Dimension-Set oder Dimensionsdetails in deutscher Oberflaeche neu belegen.
- Analysis Views oder Financial Reports nur dann als final behaupten, wenn `PRODUCTLINE`/`CHANNEL` dort sichtbar eingerichtet und ausgewertet wurden.
