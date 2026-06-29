# WAREHOUSE-008 Inbound Source Document Selection

Status: `labor`, `ui-first`, `source-document-route`, `no-posting`, `not-final`.

## Ziel

WAREHOUSE-008 prueft, ob die Warehouse-Receipt-Seite nach dem Warehouse-Employee-Fit eine Source-Document-Route anbietet. Es wird kein Source Document bestaetigt und `Post Receipt` wird nicht geklickt.

## Ergebnis

Status: `blocked`
Warehouse-Employee-Blocker sichtbar: nein
Warehouse-Receipt-Kontext sichtbar: ja
New/Neu geklickt: nein
Source-Document-Aktion geoeffnet: nein
OK/Select sichtbar und nicht geklickt: nein

## Grenze

- Kein Source Document bestaetigt.
- Kein Warehouse Receipt Posting.
- Kein Put-away.
- Keine Postenspur.
- Kein deutscher Finalnachweis.

## Naechster Schritt

WAREHOUSE-009: refine Source Document action route or draft lifecycle before selecting any source document.
