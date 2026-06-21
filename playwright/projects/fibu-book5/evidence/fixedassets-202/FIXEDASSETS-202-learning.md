# FIXEDASSETS-202 Lernzusammenfassung

Status: `labor`, `preview-posting-only`, `no-posting`, `not-final`.

## Ergebnis

FA-202 clicked only the exact Preview Posting menuitem after proving `FA Posting Type = Acquisition Cost`; outcome=`error-messages-context`. Der alte Blank-Blocker ist weg, aber Business Central meldet jetzt einen neuen fachlichen Blocker: `FA Posting Type Acquisition Cost must be posted in the FA journal in Gen. Journal Line ASSETS / DEFAULT / 10000`.

## Lernwert

Dieser Lauf prueft den naechsten fachlichen Schritt nach der Zeilenkorrektur aus FA-200. Business Central muss vor der Vorschau nicht nur den richtigen Belegkontext zeigen, sondern auch das korrigierte Zeilenfeld `FA Posting Type = Acquisition Cost`. Erst danach ist ein eng begrenzter Klick auf `Preview Posting` fachlich vertretbar.

Der neue Fehler ist kein Rueckfall auf das leere Feld aus FA-198. Das Feld ist jetzt gefuellt; BC akzeptiert aber fuer diesen Vorschau-/Buchungsweg offenbar nicht, dass die Anschaffungskostenart in diesem `Fixed Asset G/L Journals`-Kontext steht. Das muss lokal bewertet werden, bevor weitere Felder, Setup oder Buchung freigegeben werden.

## Grenzen

- Keine Buchung.
- Keine `OK`- oder `Yes`-Bestaetigung.
- Keine Journalzeile geaendert.
- Kein Setup geaendert.
- Keine echte FA-Ledger-/G/L-Postenspur.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-203: locally review the new FA journal posting-route blocker before any Post, setup change or further journal edit.
