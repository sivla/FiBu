# WAREHOUSE-004 FRA-ZL Aktivierungs-Preflight

Status: `labor`, `ui-first`, `read-only-preflight`, `no-posting`, `no-setup-change`, `not-final`.

Direkte URL genutzt: ja.
Lagerort sichtbar: ja.
Setup-Feldsignale sichtbar: 6.

## Setup-Feldsignale

| Feldsignal | Sichtbar |
|---|---|
| binMandatoryVisible | ja |
| requireReceiveVisible | ja |
| requireShipmentVisible | ja |
| requirePutAwayVisible | ja |
| requirePickVisible | ja |
| directedPutAwayAndPickVisible | ja |

## Entscheidung

Warehouse setup fields are visible enough for a separate guarded setup-fit attempt.

## Grenze

- Keine Setup-Aenderung.
- Keine Bins.
- Keine Warehouse-Aktivitaet.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

WAREHOUSE-005: guarded UI-first setup-fit for explicitly visible Warehouse fields only.
