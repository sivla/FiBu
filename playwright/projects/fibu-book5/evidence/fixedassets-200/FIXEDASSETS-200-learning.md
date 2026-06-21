# FIXEDASSETS-200 Lernzusammenfassung

Status: `labor`, `journal-data-correction-preflight`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-200 proved FA Posting Type = Acquisition Cost persisted after reopening Fixed Asset G/L Journals.

## Lernwert

Der Fehler aus FA-198 war kein Freibrief fuer Setup-Aenderungen. Business Central meldete konkret, dass `FA Posting Type` auf der vorhandenen Journalzeile leer war. Dieser Lauf korrigiert deshalb nur dieses eine Zeilenfeld und prueft anschliessend durch erneutes Oeffnen, ob der Wert wirklich gespeichert blieb.

## Grenzen

- Keine Preview Posting nach Korrektur.
- Keine Buchung.
- Keine Postenspur.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-201: locally review FA-200 FA Posting Type persistence evidence before any Preview Posting retry or Post.
