# FIXEDASSETS-281 Journal-/Batch-Target read-only

Status: `labor`, `read-only`, `journal-target-diagnosis`, `no-ok`, `no-preview`, `no-post`, `not-final`.

## Ergebnis

- Instanz: `MCP_1_20260210`
- Company: `RM-DEMO`
- Page: `Fixed Asset G/L Journals` / Page `5628`
- Batch-Name-Label sichtbar: ja
- Konkreter Batch-Name-Wert erfasst: nein
- Template-/Journal-Template-Signal sichtbar: nein
- `FA-CNC-01` sichtbar: nein
- `HGB` sichtbar: nein
- `FADEP-` sichtbar: nein
- Bekannte FADEP-Dokumente sichtbar: nein

## Was ein Einsteiger daraus lernen soll

Die Aktion `Calculate Depreciation` schreibt nicht magisch direkt in Posten. Vor Preview oder Buchung muss sichtbar sein, in welchem Anlagen-Fibu-Buchblatt, Batch und Zeilenkontext Business Central die Abschreibungszeile erwartet. Wenn dort keine passende `FADEP-`-Zeile sichtbar ist, ist ein weiterer OK-Lauf kein guter naechster Schritt.

## Grenzen

- Der Calculate-Depreciation-Request-Dialog wurde in diesem Lauf nicht geoeffnet, weil der Case explizit keinen OK-Risiko-Klick benoetigt.
- Kein Preview Posting.
- Keine Buchung.
- Keine Journalzeile angelegt, bearbeitet oder geloescht.
- Kein Setup Change.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-282: locally review why the Fixed Asset G/L Journal shows no clear batch/FADEP target before any further Calculate Depreciation OK, Preview Posting or Post.
