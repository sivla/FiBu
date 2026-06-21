# FIXEDASSETS-198 Lernzusammenfassung

Status: `labor`, `preview-error-immediate-capture`, `no-posting`, `not-final`.

## Ergebnis

FA-198 captured immediate Preview Posting Error Messages details (16 line(s)) without posting.

Kernfehler aus der unmittelbaren Fehlerseite:

- Datensatz: `Gen. Journal Line ASSETS / DEFAULT / 10000`
- UI-Hinweis: `Waehlen Sie einen Wert fuer Batch Name`
- BC-Meldung: `'FA Posting Type' darf in 'Gen. Journal Line' nicht ' ' sein: 'Journal Template Name=ASSETS, Journal Batch Name=DEFAULT, Line No.=10000'`

## Was wurde nicht getan

- Kein `Post`.
- Kein `Post and Print`.
- Kein `OK` oder `Yes`.
- Keine Journalzeile geaendert.
- Kein Setup geaendert.
- Keine Buchaussage im Buch geaendert.

## Lernwert

Wenn Business Central nach `Preview Posting` auf `Error Messages` navigiert, kann der Kontext kurzlebig sein. Deshalb muss der Lauf die Fehlerzeilen unmittelbar nach dem Klick sichern. Eine spaeter leer geoeffnete Fehlerliste ist kein Setup-Beweis.

## Naechster Schritt

FIXEDASSETS-199: locally review the immediate Preview-error capture and decide whether setup/data correction, helper improvement or another route is warranted.
