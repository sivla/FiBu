# WAREHOUSE-002 Book Sync

Status: `book-sync`, `labor`, `readiness-only`, `gate-locked`, `no-bc-run`, `no-posting`, `not-final`.

## Ziel

Kapitel 13 soll den aktuellen Warehouse-Stand nicht als aktivierten Warehouse-Prozess ausgeben. Der Sync uebernimmt den belegten `WAREHOUSE-001`-Befund in eine Statusbox: einfacher Lagerort und Inventory-Nachweis sind vorhanden, gesteuerte Warehouse-Logik bleibt offen und gatepflichtig.

## Belegter Ausgangspunkt

| Feld | Wert |
|---|---|
| Sandbox | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Datenbasis | CRONUS USA |
| Quelle | `playwright/projects/fibu-book5/evidence/warehouse-001/` |
| BC-Lauf in diesem Sync | nein |
| Setup-Aenderung | nein |
| Buchung | nein |

## Buchwirkung

Kapitel 13 enthaelt jetzt eine Statusbox mit:

- Buchziel: `FRA-ZL` spaeter als gesteuertes Lager.
- RM-DEMO-Labor: `FRA-ZL` aktuell einfacher Lagerort mit Inventory-Posten-, Wertposten-, Sachposten- und Lagerbewertungsnachweis.
- Warehouse-Readiness: Tell-Me-Einstiege fuer `Warehouse Receipts`, `Warehouse Put-aways`, `Warehouse Picks` und `Bins` sind sichtbar; `Warehouse Shipments` ist nicht belastbar sichtbar.
- Nicht behaupten: keine Bins, keine aktivierte gesteuerte Einlagerung/Kommissionierung, keine Warehouse-Aktivitaet und keine Warehouse-Buchung.
- Gate: `WAREHOUSE-001-ACTIVATION` bleibt locked.

## Anfaenger-Lernwert

Ein Lagerort ist nicht dasselbe wie ein Warehouse-Prozess. `Location Code = FRA-ZL` erklaert, wo Artikelbewegungen stattfinden. Warehouse-Felder und Warehouse-Aktivitaeten entscheiden dagegen, ob Business Central zusaetzliche Schritte wie Lagereingang, Einlagerung, Kommissionierung oder Warenausgang verlangt.

Einsteiger sollen deshalb vor dem Warehouse-Klickpfad zuerst fragen:

1. Ist nur ein Lagerort sichtbar?
2. Sind Warehouse-Setupfelder aktiv?
3. Gibt es Lagerplaetze/Bins?
4. Entsteht eine Warehouse-Aktivitaet oder nur ein Artikelposten?
5. Ist die Aussage Laborbefund oder finaler deutscher Prozessnachweis?

## Grenzen

- Kein neuer Business-Central-Lauf.
- Keine Warehouse-Aktivierung.
- Keine Bins.
- Keine Warehouse Receipts, Put-aways, Picks oder Shipments.
- Kein deutscher Finalnachweis.
- Keine Buchung.

## Naechster Schritt

Ohne Gate ist der naechste sinnvolle Prozessblock `MANUFACTURING-001-READINESS` als read-only Lauf: Assembly/Manufacturing-Einstiege und Voraussetzungen fuer `RM-M100`, `RAW-STEEL`, Komponenten, BOM/Routing oder Montage/Fertigung klaeren, ohne Produktions-, Verbrauchs-, Output- oder Kostenbuchung.

Mit Gate waere stattdessen ein separater UI-first `WAREHOUSE-001-ACTIVATION`-Lauf moeglich: Lagerortfelder, Bins und erste Warehouse-Aktivitaet kontrolliert einrichten und dokumentieren.
