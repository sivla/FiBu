# WAREHOUSE-015 Route Decision

Status: `labor`, `route-decision`, `no-bc-run`, `no-posting`, `not-final`.

## Entscheidung

Die bestehenden Receipt-/Listenrouten werden nicht wiederholt. WAREHOUSE-011 hat `Get Source Documents...` direkt nach frischem Warehouse-Receipt-Draft und Action-Erweiterung sichtbar gemacht. WAREHOUSE-012, WAREHOUSE-013 und WAREHOUSE-014 zeigen dagegen: sobald der Pfad ueber Liste oder bestehenden Beleg `RE000001` laeuft, ist die Aktion nicht mehr sicher erreichbar.

## Naechster praktischer Schritt

WAREHOUSE-016: frischen kontrollierten Warehouse-Receipt-Draft erzeugen, sofort Aktionen erweitern, `Get Source Documents...` anklicken, aber vor `OK`, `Select` oder `Post Receipt` stoppen.

## Grenzen

- Keine BC-Ausfuehrung in WAREHOUSE-015.
- Kein Source Document bestaetigt.
- Kein Warehouse Receipt Posting.
- Kein Put-away.
- Kein deutscher Finalnachweis.
