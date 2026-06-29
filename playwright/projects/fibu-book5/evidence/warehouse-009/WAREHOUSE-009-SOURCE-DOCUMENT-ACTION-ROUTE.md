# WAREHOUSE-009 Source Document Action Route

Status: `labor`, `ui-first`, `source-document-route`, `no-posting`, `not-final`.

## Ziel

WAREHOUSE-009 nutzt den aus WAREHOUSE-006 bekannten Page-7331-Kandidaten, weil page 7332 nur den Receipt-Kontext, aber keine Source-Document-Aktion sichtbar machte.

## Ergebnis

Status: `blocked`
Warehouse-Employee-Blocker sichtbar: nein
Nur Source-Document-Zeilenraster sichtbar: ja
Source Document geklickt: nein
Get Source/Use Filters geklickt: nein
Auswahl-/Filter-UI sichtbar: ja
OK/Select sichtbar und nicht geklickt: nein

## Grenze

- Kein Source Document bestaetigt.
- Kein Warehouse Receipt Posting.
- Kein Put-away.
- Keine Postenspur.
- Kein deutscher Finalnachweis.

## Naechster Schritt

WAREHOUSE-010: create a controlled Warehouse Receipt draft first, then retry Get Source Documents route without posting.
