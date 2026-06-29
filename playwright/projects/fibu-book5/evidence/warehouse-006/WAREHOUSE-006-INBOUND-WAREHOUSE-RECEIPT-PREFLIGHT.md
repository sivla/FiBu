# WAREHOUSE-006 Inbound Warehouse Receipt/Put-away Preflight

Status: `labor`, `ui-first`, `route-scout`, `read-only`, `no-posting`, `not-final`.

## Ziel

WAREHOUSE-006 prueft nach dem FRA-ZL-Setup-Fit, welche Warehouse-Receipt-/Put-away-Seiten direkt und ohne Tell-Me-Suche erreichbar sind. Der Lauf erzeugt keinen Beleg und klickt keine riskante Aktion.

## Ergebnis

Status: `blocked`
Beste Route: keine belastbare Route gefunden

| Kandidat | Page ID | Route-Signal | Source-Document-Aktion | Riskante Aktion sichtbar |
|---|---:|---|---|---|
| warehouse-receipts-list-7331 | 7331 | nein | nein | nein |
| warehouse-receipt-card-7332 | 7332 | nein | nein | nein |
| warehouse-putaways-list-7344 | 7344 | nein | nein | nein |
| inventory-putaways-list-7375 | 7375 | nein | nein | nein |
| warehouse-activity-lines-5768 | 5768 | nein | nein | nein |

## Laborgrenze

- Kein `New`.
- Kein `Edit`.
- Kein `Delete`.
- Kein `Post`.
- Kein `Preview Posting`.
- Kein Draft.
- Keine Setup-Aenderung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

WAREHOUSE-007: refine direct page IDs or UI route discovery before any Warehouse draft.
