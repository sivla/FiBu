# WAREHOUSE-005 FRA-ZL Guarded Setup-Fit

Status: `labor`, `ui-first`, `setup-fit`, `no-posting`, `not-final`.

## Ziel

WAREHOUSE-005 setzt nur die sichtbaren Basisfelder `Require Receive`, `Require Shipment` und `Require Put-away`. `Require Pick`, `Bin Mandatory` und `Directed Put-away and Pick` bleiben bewusst unangetastet, weil sie eine eigene Outbound-/Bin-/WMS-Route brauchen.

## Vorher

| Feld | Sichtbar | Aktiv |
|---|---|---|
| Require Receive | ja | ja |
| Require Shipment | ja | ja |
| Require Put-away | ja | ja |
| Require Pick | ja | unklar |
| Bin Mandatory | ja | nein |
| Directed Put-away and Pick | ja | nein |

## Nachher

| Feld | Sichtbar | Aktiv |
|---|---|---|
| Require Receive | ja | ja |
| Require Shipment | ja | ja |
| Require Put-away | ja | ja |
| Require Pick | ja | unklar |
| Bin Mandatory | ja | nein |
| Directed Put-away and Pick | ja | nein |

## Entscheidung

FRA-ZL is fitted for basic Warehouse receive/shipment/put-away fields without enabling Require Pick, Bin Mandatory or Directed Put-away and Pick.

## Grenze

- Keine Warehouse-Buchung.
- Keine Warehouse-Belege.
- Keine Bins angelegt.
- Kein deutscher Finalnachweis.

## Naechster Schritt

WAREHOUSE-006: create a no-post inbound Warehouse Receipt/Put-away preflight; no posting until document and trace gates are explicit.
