# Warehouse Labor Draft - Source Document Readiness

Status:
- Buchziel: Warehouse Receipt als abhaengigen Prozess verstehen: Lagerort, Warehouse-Setup, Warehouse Employee, eligible Source Document, Receipt und spaetere Put-away/Postenspur.
- Mandant: RM-DEMO in MCP_1_20260210.
- Laborstand: labor-blocked, aber labor-sufficient-for-book-draft.
- DE-Finalnachweis: offen, spaeter in deutscher Zielinstanz neu aufzubauen.
- Buchung erfolgt: nein.
- Evidence Pack: evidence/warehouse-001 bis evidence/warehouse-031.
- Offene Grenzen: keine freigegebene Warehouse-eligible Einkaufsbestellung, kein Warehouse Receipt Source Confirm, kein Receipt Posting, kein Put-away, keine Warehouse-Postenspur.
- Nicht behaupten: RM-DEMO beweist keinen fertigen deutschen Warehouse-Prozess.

## Was wurde praktisch bewiesen?

| Stufe | Laborbefund | Evidence |
|---|---|---|
| Lagerort | FRA-ZL ist sichtbar und Warehouse-/Receive-/Put-away-Signale sind vorhanden. | WAREHOUSE-004, WAREHOUSE-005, WAREHOUSE-029 |
| Warehouse Employee | Benutzer + FRA-ZL wurden als Setup-Fit nachgewiesen. | WAREHOUSE-007 |
| Warehouse Receipt Einstieg | Warehouse Receipt / Get Source Documents ist erreichbar. | WAREHOUSE-010 bis WAREHOUSE-018 |
| Source Document Voraussetzung | Ohne passende Einkaufsbestellung gibt es keine klare Source-Zeile. | WAREHOUSE-020 |
| Kontrollierte Einkaufsbestellung | Purchase Order 106055 mit K10000 und RAW-STEEL ist sichtbar. | WAREHOUSE-021 |
| Blocker | RAW-STEEL bleibt sichtbar bei ATLANTA, GA statt FRA-ZL. | WAREHOUSE-023, WAREHOUSE-024, WAREHOUSE-026, WAREHOUSE-027 |
| Default-Hypothese | Vendor, Item, Stockkeeping Unit und Item Vendor zeigen keine belastbare FRA-ZL-Default-Route. | WAREHOUSE-029, WAREHOUSE-030 |

## Anfaengererklaerung

Ein Warehouse Receipt ist nicht der Anfang des Prozesses. Business Central braucht zuerst eine passende Quelle. Bei Einkauf ist das eine Einkaufsbestellung, deren Zeile fuer den richtigen Lagerort und die richtige Warehouse-Logik geeignet ist.

Wenn im Warehouse Receipt keine passende Quelle erscheint, ist das nicht automatisch ein Fehler des Warehouse Receipts. Oft fehlt vorher etwas:

1. Der Lagerort muss Warehouse-Felder passend haben.
2. Der Benutzer muss als Warehouse Employee fuer den Lagerort eingerichtet sein.
3. Die Einkaufsbestellung muss eine passende Zeile enthalten.
4. Die Zeile muss den richtigen Lagerort zeigen.
5. Erst dann lohnt sich Source Document Selection.
6. Erst danach duerfen Receipt Posting, Put-away und Postenspur geprueft werden.

## Warum parken wir RM-DEMO?

In RM-DEMO ist FRA-ZL als Warehouse-Lagerort brauchbar, aber die kontrollierte Source Purchase Order 106055 zeigt RAW-STEEL weiterhin mit ATLANTA, GA. Mehrere sichere UI-Wege haben keinen editierbaren Location-Control geliefert. Auch Vendor-/Item-/Stockkeeping-/Item-Vendor-Default-Probes zeigen keine belastbare FRA-ZL-Default-Route.

Ein Setup-Fit fuer Stockkeeping Units waere jetzt moeglicherweise technisch machbar, aber fachlich nicht sauber genug begruendet. Deshalb wird der Pfad geparkt: Der Blocker ist buchfaehig, aber nicht final.

## Screenshot-Platzhalter fuer Buchmaster

| Platzhalter | Zweck | Laborbild/Evidence |
|---|---|---|
| CH13-WH-01 | FRA-ZL Location Card / Warehouse-Signale | evidence/warehouse-004, evidence/warehouse-005 |
| CH13-WH-02 | Warehouse Employee Setup fuer FRA-ZL | evidence/warehouse-007 |
| CH13-WH-03 | Warehouse Receipt Get Source Documents Kontext | evidence/warehouse-016 bis 018 |
| CH13-WH-04 | Purchase Order 106055 mit RAW-STEEL, aber falschem Location-Kontext | evidence/warehouse-021, 023, 024, 026, 027 |
| CH13-WH-05 | Default-/SKU-Negativbefund | evidence/warehouse-029, 030 |

## German Final Rebuild

In der deutschen Zielumgebung muss der Fall neu aufgebaut werden:

- deutsche Zielcompany und Rollen-/Sprachkontext sichtbar machen,
- deutschen Lagerort mit Warehouse-Feldern pruefen,
- Warehouse Employee sauber einrichten,
- Artikel/Kreditor/Location-Defaulting oder sichere Zeileneingabe vorab belegen,
- Einkaufsbestellung mit richtiger Lagerortzeile erzeugen,
- Release erst nach sichtbarer Source-Eligibility,
- Warehouse Receipt Source Selection belegen,
- Receipt Posting und Put-away nur mit Evidence-Plan ausfuehren,
- Warehouse-/Artikel-/Wert-/Sachposten neu sichern,
- RM-DEMO-Screenshots nicht als deutschen Finalnachweis verwenden.

Naechster sinnvoller Projektpunkt: Einen anderen Prozessblock weiterfuehren oder spaeter Warehouse in einer saubereren Ziel-/Lab-Company neu aufbauen.
