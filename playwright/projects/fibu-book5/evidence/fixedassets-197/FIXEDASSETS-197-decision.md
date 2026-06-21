# FIXEDASSETS-197 Decision

Status: `labor`, `local-blocker-review`, `no-bc-run`, `no-playwright-run`, `not-final`.

## Entscheidung

FA-197 classifies FA-196 as a transient Error Messages blocker: the direct later page 700 route is read-only reachable but empty, so no setup cause can be inferred. The next safe practical route is one guarded Preview Posting-only rerun that captures Error Messages rows immediately after the Preview click; posting and setup remain locked.

## Warum keine Setup-Aenderung?

FA-196 zeigt nur, dass die spaeter direkt geoeffnete Seite `Error Messages` leer ist. Das ist kein fachlicher Beweis fuer fehlende Konten, Buchungsmatrizen, AfA-Buch oder Journalwerte. Eine Setup-Aenderung waere hier geraten und wuerde Projektwahrheit erfinden.

## Warum ein weiterer Preview-only-Lauf erlaubt ist

FA-194 hat den exakten `Preview Posting`-Menuepunkt bereits sicher getroffen und keine Buchung ausgeloest. Der Fehlerkontext scheint fluechtig zu sein. Deshalb ist genau ein weiterer eng bewachter Live-Lauf sinnvoll, aber nur um unmittelbar nach dem Preview-Klick die Error-Messages-Zeilen, Details, FactBox-Felder und Seitentexte zu sichern.

## Harte Grenzen fuer FA-198

- Kein `Post`.
- Kein `Post and Print`.
- Kein `OK` oder `Yes`.
- Keine Journalzeilen anlegen, aendern oder loeschen.
- Kein Setup Change.
- Kein Company Switch.
- Keine Buchaussage im Buch.

## Naechster Schritt

FIXEDASSETS-198: run one guarded Preview Posting-only rerun and capture Error Messages details immediately after the click; no posting, setup change or journal edit.
