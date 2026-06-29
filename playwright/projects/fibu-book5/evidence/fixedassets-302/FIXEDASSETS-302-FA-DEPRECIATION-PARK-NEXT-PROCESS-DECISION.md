# FIXEDASSETS-302 - AfA in RM-DEMO parken

Status: `labor-blocked`, `labor-sufficient-for-book-draft`, `needs-german-final-rebuild`

## Entscheidung

Die AfA-Ausführung in `RM-DEMO` wird geparkt. Die vorhandene Fixed-Assets-Laborstrecke bleibt fuer Kapitel 21 wertvoll, aber nur als Labor-/Vorproduktionsnachweis.

Weiteres blindes Wiederholen von `Calculate Depreciation`, `Preview Posting` oder `Post` ist nicht freigegeben, weil nach den kontrollierten Versuchen kein sichtbarer AfA-Journalposten entstanden ist.

## Belegt

- FA-291 und FA-295 haben kontrollierte `Calculate Depreciation`-OK-Versuche dokumentiert.
- FA-300 hat die direkte Seite `5629` als `Fixed Asset Journals` sichtbar gemacht.
- FA-301 hat diese Seite als UI-/Routennachweis akzeptiert, aber nicht als AfA-Ausgabenachweis.
- In FA-300/FA-301 war keine Zeile `FADEP`, `FA-CNC-01` oder `HGB` sichtbar.

## Nicht belegt

- Keine sichtbare AfA-Journalzeile.
- Kein AfA-Preview-Posting.
- Keine AfA-Buchung.
- Keine AfA-Postenspur.
- Kein deutscher Finalnachweis.

## Warum parken?

Ein Journalfenster ohne erzeugte Journalzeile ist kein Buchungsnachweis. Fuer Anfaenger ist genau das wichtig: Die Seite allein reicht nicht. Erst wenn die Zeile sichtbar ist, darf man fachlich ueber Preview Posting oder Buchung sprechen.

## Naechster Prozessblock

Der naechste praktische Block ist Warehouse-Readiness. Es gibt bereits `WAREHOUSE-001` und `WAREHOUSE-002` Evidence; FA-302 setzt daher als naechsten Case:

`WAREHOUSE-003-WAREHOUSE-READINESS-FOLLOWUP-DECISION`

Dieser Folgelauf soll lokal entscheiden, welche Warehouse-Route als naechstes kontrolliert getestet wird. In FA-302 wurde kein BC geoeffnet und kein Playwright gestartet.

## German-Final-Rebuild

In der spaeteren deutschen Zielumgebung muss die AfA-Strecke neu aufgebaut werden:

- deutsche Anlage,
- deutsches AfA-Buch,
- deutsche Konten-/Buchungsmatrix,
- sichtbare AfA-Journalzeile,
- Preview Posting,
- AfA-Buchung,
- Anlagenposten/Sachposten.

RM-DEMO bleibt Laborreferenz, nicht finaler deutscher Beweis.
