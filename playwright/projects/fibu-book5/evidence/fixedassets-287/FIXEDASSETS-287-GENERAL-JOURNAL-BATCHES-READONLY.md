# FIXEDASSETS-287 General Journal Batches read-only

Status: `labor`, `read-only`, `batch-context`, `no-select`, `no-new`, `no-edit-list`, `no-ok`, `no-preview`, `no-post`, `not-final`.

## Ergebnis

- Page direkt geoeffnet: ja
- Batch `DEFAULT` sichtbar: ja
- Beschreibung `Default Journal Batch` sichtbar: ja
- Nummernserie `FA-JNL` sichtbar: ja
- Gegenkontoart `G/L Account` sichtbar: ja

## Bedeutung fuer die Klickanleitung

Der Batch-Kontext ist ein Setup-/Listenbefund. Er erklaert, welche Batch-Option Business Central im Lookup gezeigt hat. Er beweist weiterhin nicht, dass `Batch Name` im Anlagen-Fibu-Buchblatt gesetzt wurde und erzeugt keine AfA-Zeile.

## Grenzen

- Kein Batch wurde ausgewaehlt.
- Kein `OK` wurde bestaetigt.
- `Neu` und `Liste bearbeiten` wurden nicht geklickt.
- Kein `Calculate Depreciation -> OK`.
- Kein Preview Posting.
- Keine Buchung.
- Keine Setup-Aenderung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-288: locally review whether DEFAULT / FA-JNL batch context is enough for the depreciation click guide; do not select Batch Name or run OK/Preview/Post yet.
