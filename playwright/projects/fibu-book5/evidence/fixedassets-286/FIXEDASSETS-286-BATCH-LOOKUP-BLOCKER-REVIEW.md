# FIXEDASSETS-286 Batch-Lookup-Blocker-Review

Status: `labor`, `local-review`, `no-bc`, `no-playwright`, `no-ok`, `no-preview`, `no-post`, `not-final`.

## Ausgangspunkt

`FIXEDASSETS-285` hat den `Batch Name`-Lookup auf `Fixed Asset G/L Journals` geoeffnet. Sichtbar wurden:

- `General Journal Batches`
- `DEFAULT`
- `Default Journal Batch`
- `FA-JNL`
- `OK`
- `Abbrechen`

Nach `Escape` war der Lookup geschlossen und im Journal war weiterhin kein konkreter Batchwert gesetzt.

## Entscheidung

`DEFAULT / Default Journal Batch / FA-JNL` wird als sichtbare Batch-Kandidaten-Evidence akzeptiert, aber nicht als bestaetigter `Batch Name`-Feldwert.

`aria-selected=true` im Lookup-Dialog wird konservativ als Fokus-/Vorwahlrisiko behandelt. Es ist kein Beweis fuer eine geschriebene Feldwertaenderung, weil:

- kein `OK` bestaetigt wurde,
- kein `Enter` gedrueckt wurde,
- nach `Escape` kein konkreter Batchwert im Journal sichtbar war,
- die Evidence keine Wertveraenderung zeigt.

## Warum kein `OK`?

Der Dialog ist eine Auswahl-/Lookup-Bestaetigung. Fuer das Buch ist wichtig: Ein sichtbarer Kandidat in einer Lookup-Liste ist noch kein bestaetigter Feldwert. Ein `OK` im Lookup waere eine Auswahlhandlung und braucht ein eigenes Gate.

## Naechster sicherer Schritt

Der naechste Schritt ist eine direkte read-only Batchlisten-/Kontextpruefung:

`FIXEDASSETS-287-FA-DEPRECIATION-GENERAL-JOURNAL-BATCHES-READONLY`

Ziel ist, `DEFAULT`, Beschreibung, Nummernserie `FA-JNL` und moegliche Template-/Batch-Kontexte sichtbar zu lesen, ohne:

- `OK` zu bestaetigen,
- einen Batch auszuwaehlen,
- `Liste bearbeiten` zu aktivieren,
- `Neu` zu klicken,
- Journalzeilen zu aendern,
- Preview Posting oder Post zu nutzen.

## Anfaenger-Lernwert

Business Central Lookup-Dialoge zeigen oft moegliche Werte. Diese Werte sind fachlich nuetzlich, aber erst nach Auswahl/Bestaetigung ein gesetzter Feldwert. Fuer Klickanleitungen muss daher unterschieden werden:

1. Kandidat in Lookup-Liste sichtbar
2. Feldwert im Ausgangsfeld sichtbar
3. daraus erzeugte Journalzeile sichtbar
4. Preview/Postenspur sichtbar

## Grenzen

- Keine neue BC-Ausfuehrung in FA-286.
- Keine Playwright-Ausfuehrung in FA-286.
- Kein Batch wurde ausgewaehlt.
- Kein Lookup-`OK`.
- Kein `Calculate Depreciation -> OK`.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

