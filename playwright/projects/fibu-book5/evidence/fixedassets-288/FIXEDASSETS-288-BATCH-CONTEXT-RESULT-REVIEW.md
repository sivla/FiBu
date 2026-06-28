# FIXEDASSETS-288 Batch-Kontext-Review

Status: `labor`, `local-review`, `no-bc`, `no-playwright`, `no-ok`, `no-preview`, `no-post`, `not-final`.

## Ausgangspunkt

`FIXEDASSETS-287` hat `General Journal Batches` / Page `251` read-only geoeffnet. Im BC-Inhaltsframe sichtbar:

- `DEFAULT`
- `Default Journal Batch`
- `Bal. Account Type = G/L Account`
- `No. Series = FA-JNL`
- Kontext-URL mit Filter `Journal Template Name IS ASSETS`

## Entscheidung

Der Befund wird als Batchlisten-/Setup-Kontext akzeptiert. Fuer die Klickanleitung darf erklaert werden:

`DEFAULT` ist ein Batch im Journal-Template-Kontext `ASSETS` und nutzt `FA-JNL` als Nummernserie.

Das ist aber kein Nachweis fuer:

- den aktuell gesetzten `Batch Name` im `Fixed Asset G/L Journals`,
- eine erzeugte `FADEP`-Journalzeile,
- Preview Posting,
- AfA-Buchung.

## Warum kein OK?

Ein weiterer `Calculate Depreciation -> OK` waere noch zu frueh. Die bisherige AfA-Route hat mehrfach gezeigt, dass ein OK-Lauf ohne sichtbares Ausgabeziel keine belastbare Journalzeile beweist. Nach dem Batchlisten-Nachweis ist der naechste sinnvolle Schritt, den `Fixed Asset G/L Journals`-Kontext fuer `ASSETS / DEFAULT` read-only zu pruefen.

## Naechster sicherer Schritt

`FIXEDASSETS-289-FA-DEPRECIATION-JOURNAL-ASSETS-DEFAULT-READONLY`

Ziel:

- `Fixed Asset G/L Journals` read-only oeffnen,
- Kontextsignale fuer `ASSETS`, `DEFAULT`, `Batch Name`, `FA-JNL`, `FADEP-`, `FA-CNC-01`, `HGB` suchen,
- keine Auswahl, kein `OK`, kein `Neu`, kein Edit, kein Preview Posting, kein Post.

## Anfaenger-Lernwert

Ein Journal-Batch ist Setup-/Listen-Kontext. Er sagt, in welchem Arbeitsbereich Business Central Journalzeilen fuehren kann. Er ist aber noch keine Journalzeile und kein Buchungsbeweis. Fuer Anfaenger muss die Anleitung daher trennen:

1. Batch existiert.
2. Batch ist im Zieljournal sichtbar/aktiv.
3. Eine konkrete AfA-Zeile wurde erzeugt.
4. Preview/Postenspur bestaetigt die Buchungswirkung.

## Grenzen

- Kein neuer BC-Lauf in FA-288.
- Kein Playwright-Lauf in FA-288.
- Kein Batch wurde ausgewaehlt.
- Kein Lookup-`OK`.
- Kein `Calculate Depreciation -> OK`.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

