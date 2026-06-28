# FIXEDASSETS-268 OK-Ergebnis-Blocker-Review

Status: `labor`, `local-review`, `no-bc-run`, `no-playwright`, `no-preview`, `no-posting`, `not-final`.

## Befund

`FIXEDASSETS-267` hat die Request Page `Calculate Depreciation` korrekt kontrolliert: `HGB`, `30.06.2026`, `FADEP-267-OK` und `FA-CNC-01` waren vor `OK` sichtbar bewiesen. `OK` wurde genau einmal bestaetigt. Danach war `Fixed Asset G/L Journals` sichtbar, aber `FADEP-267-OK` bzw. `FADEP-` war nicht sichtbar.

Das ist kein Buchungsnachweis und kein AfA-Postenspur-Nachweis. Es ist ein Lernfall: Ein Batchjob-Klick kann formal ausgefuehrt werden, ohne dass die erwartete Journalzeile im aktuellen Journalbild sichtbar ist.

## Einordnung

Wahrscheinlich ist nicht:

- falsche Instanz oder Company,
- fehlende Zielwerte vor `OK`,
- fehlender OK-Klick,
- weiterhin ausgeschaltete `HGB / G/L Integration - Depreciation`.

Weiter offen sind:

- Ist `30.06.2026` fuer `FA-CNC-01/HGB` ein sinnvoller AfA-Stichtag?
- Sind AfA-Start, letzte AfA, AfA-Enddatum, Methode oder Restbuchwert passend?
- Schreibt der Batchjob in einen anderen Journaltemplate-/Batch-Kontext?
- Verdeckt ein Filter oder eine virtuelle Liste die erzeugte Zeile?
- Fehlt noch ein anderes FA-/Journal-Setup?

## Entscheidung

Kein dritter OK-Klick. Kein Preview Posting. Kein Post.

Der naechste Fall ist `FIXEDASSETS-269`: read-only Diagnose von `FA-CNC-01/HGB` und Journal-/Batch-Kontext. Ziel ist zu verstehen, ob AfA ueberhaupt faellig ist und wo Business Central die Zeile schreiben sollte.

## Buchwirkung

Die Klickanleitung darf jetzt erklaeren: Nach `OK` muss der Anwender das Ergebnis suchen und verstehen. Wenn keine Journalzeile sichtbar ist, wird nicht erneut blind gestartet; zuerst prueft man AfA-Buch, Datumslogik, Batchziel und Filter.
