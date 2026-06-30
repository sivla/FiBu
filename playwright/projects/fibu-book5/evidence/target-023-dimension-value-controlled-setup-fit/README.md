# TARGET-023 Dimension Value Controlled Setup Fit

Instanz: playthru
Company: UNIVERSAARL-DE

## Ergebnis

Dimension setup route produced blockers; no master data or posting was executed.

## Dimensionen

- PRODUCTLINE: already-exists - PRODUCTLINE ist bereits sichtbar.
- COSTCENTER: already-exists - COSTCENTER ist bereits sichtbar.
- CHANNEL: already-exists - CHANNEL ist bereits sichtbar.

## Dimensionswerte

- PRODUCTLINE.SOFTWARE: already-exists - PRODUCTLINE.SOFTWARE ist bereits sichtbar.
- PRODUCTLINE.SERVICE: blocked - PRODUCTLINE.SERVICE war nach Reopen nicht sichtbar.
- PRODUCTLINE.TRAINING: blocked - PRODUCTLINE.TRAINING war nach Reopen nicht sichtbar.
- COSTCENTER.ADMIN: already-exists - COSTCENTER.ADMIN ist bereits sichtbar.
- COSTCENTER.SALES: blocked - COSTCENTER.SALES war nach Reopen nicht sichtbar.
- COSTCENTER.OPERATIONS: blocked - COSTCENTER.OPERATIONS war nach Reopen nicht sichtbar.
- CHANNEL.DIRECT: already-exists - CHANNEL.DIRECT ist bereits sichtbar.
- CHANNEL.PARTNER: blocked - CHANNEL.PARTNER war nach Reopen nicht sichtbar.

## Grenzen

- Keine Stammdaten, kein Beleg, keine Preview und keine Buchung.
- Global Dimension Code 1/2 wurde noch nicht gesetzt.
- Reportingwirkung braucht spaeter gebuchte Posten und Dimension Set Entries.
