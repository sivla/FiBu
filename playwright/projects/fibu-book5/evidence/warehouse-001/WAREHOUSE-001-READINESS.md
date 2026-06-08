# WAREHOUSE-001 Readiness

Status: `labor`, `read-only`, `warehouse-readiness`, `gate-locked`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Umgebung | MCP_1_20260210 |
| Company | RM-DEMO |
| Datenbasis | CRONUS USA |
| Relevantes Gate | `WAREHOUSE-001-ACTIVATION` locked |
| Setup-Aenderung | nein |
| Buchung | nein |

## Lagerort FRA-ZL

Der Lagerortkontext ist sichtbar: ja.

| Warehouse-Marker auf dem Lagerort | Befund |
|---|---|
| binMandatoryVisible | nicht sichtbar |
| requireReceiveVisible | nicht sichtbar |
| requireShipmentVisible | nicht sichtbar |
| requirePutAwayVisible | nicht sichtbar |
| requirePickVisible | nicht sichtbar |
| directedPutAwayAndPickVisible | nicht sichtbar |

## Warehouse-Einstiege

| Tell-Me-Suche | Treffer sichtbar | Screenshot |
|---|---|---|
| Warehouse Receipts | ja | warehouse-001-020-warehouse-receipts-tell-me.png |
| Warehouse Put-aways | ja | warehouse-001-030-warehouse-putaways-tell-me.png |
| Warehouse Picks | ja | warehouse-001-040-warehouse-picks-tell-me.png |
| Warehouse Shipments | nein | warehouse-001-050-warehouse-shipments-tell-me.png |
| Bins | ja | warehouse-001-060-bins-tell-me.png |

## Anfaenger-Lernwert

Business Central unterscheidet einfache Lagerorte von Warehouse-Prozessen. Ein einfacher Lagerort wie `FRA-ZL` reicht fuer Artikelposten, Wertposten und Lagerbewertung. Gesteuerte Lagerlogik beginnt erst, wenn Lagerortfelder wie Bin Mandatory, Require Receive, Require Shipment, Require Put-away, Require Pick oder Directed Put-away and Pick bewusst eingerichtet sind. Solange dieses Setup nicht freigegeben ist, duerfen Warehouse Receipts, Put-aways, Picks und Shipments nur als Einstiegspfade gelesen werden.

## Was bewiesen ist

- FRA-ZL can be opened read-only as a Location in RM-DEMO.
- Warehouse-related Tell-Me entry points were checked without opening a posting or setup flow.
- The current run separates simple inventory evidence from future warehouse activation evidence.

## Was nicht bewiesen ist

- No Warehouse activation for FRA-ZL.
- No Bin setup and no directed put-away/pick setup.
- No Warehouse Receipt, Put-away, Pick or Shipment process.
- No German final warehouse screenshot.
- No posting.

## Buchwirkung

Kapitel 13 sollte vor einem gesteuerten Warehouse-Fall eine Statusbox bekommen: einfacher Lagerort ist bereits fuer Inventory belegt, Warehouse-Aktivierung bleibt aber ein eigenes Gate. Der Leser soll lernen, dass Lagerort, Bins und Warehouse-Aktivitaeten nicht dasselbe sind.

## Naechster Schritt

Without gate: Warehouse-001 book/evidence sync fuer Kapitel 13 ergaenzen oder Manufacturing/Service/Projects nur read-only vorbereiten. With gate: WAREHOUSE-001-ACTIVATION als separaten UI-first Setup-Lauf planen.
