# FIXEDASSETS-210 Lernzusammenfassung

Status: `labor`, `preview-posting-only`, `no-posting`, `not-final`.

## Ergebnis

FA-210 clicked only the exact Preview Posting menuitem after proving FA Posting Type = Acquisition Cost; outcome=preview-entry-context; prior FA Posting Type blocker gone=true.

## Lernwert

Dieser Lauf prueft den naechsten fachlichen Schritt nach dem HGB-Setup-Fit aus FA-208/FA-209. Business Central muss vor der Vorschau den richtigen Belegkontext, die akzeptierte HGB-Integration und das Zeilenfeld `FA Posting Type = Acquisition Cost` zeigen. Erst danach ist ein eng begrenzter Klick auf `Preview Posting` fachlich vertretbar.

## Grenzen

- Keine Buchung.
- Keine `OK`- oder `Yes`-Bestaetigung.
- Keine Journalzeile geaendert.
- Kein Setup geaendert.
- Keine echte FA-Ledger-/G/L-Postenspur.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-211: locally review FA-210 Preview Posting result before any Post, setup change or further journal edit.
