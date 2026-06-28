# FIXEDASSETS-276 AfA Eligibility-/Batch-Result-Review

Status: `labor`, `local-review`, `no-bc-run`, `no-preview`, `no-posting`, `not-final`.

## Entscheidung

Kein Repeat-OK, kein Preview Posting, kein Post und kein Setup-Fit. `FIXEDASSETS-275` zeigt zwar Erwerb/HGB-Kontext und ein Datum nach Zugang, aber weiterhin keine sichtbare `FADEP-273-OK`-Journalzeile.

## Warum

Die naechste Unsicherheit liegt nicht mehr beim reinen Datum. Die Anlagenkarte zeigt Labels wie `Depreciation Starting Date`, `No. of Depreciation Years`, `Depreciation Ending Date` und `Book Value`, aber die entscheidenden Werte sind noch nicht feldsicher genug belegt. Ohne diese Werte waere ein weiterer Batch-OK nur Wiederholung ohne neue Ursache.

## Naechster Schritt

`FIXEDASSETS-277-FA-DEPRECIATION-BOOK-VALUE-PAGEINSPECTION-READONLY`

Der naechste Lauf soll read-only per Page Inspection/Wertdiagnose die AfA-Buchwerte fuer `FA-CNC-01/HGB` pruefen. Erst danach kann entschieden werden, ob ein Setup-/Output-Target-Plan, ein weiterer Diagnosefall oder ein enger Ausfuehrungsgate sinnvoll ist.

## Buchwirkung

Fuer Anfaenger gehoert in die Anleitung: Nach `Calculate Depreciation -> OK` reicht ein Datum nach Zugang nicht aus. Man muss verstehen, ob die Anlage zum Stichtag abschreibbar ist und wohin der Batchjob schreibt. Ohne sichtbare Journalzeile gibt es keine Vorschau und keine Buchung.
