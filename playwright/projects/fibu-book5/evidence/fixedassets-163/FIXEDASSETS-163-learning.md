# FIXEDASSETS-163 Lernzusammenfassung

Status: `labor`, `read-only`, `target-account-readiness`, `no-value-entry`, `no-preview`, `no-posting`, `not-final`.

## Ergebnis

FA-163 blocked before a usable target-account candidate proof: FA Posting Groups target page was not reached/read after Tell-Me navigation; the page context stayed outside the target setup page, so no account-candidate screenshot was accepted.

## Was man in Business Central lernt

Bei einer Anlagenbuchung ueber `Fixed Asset G/L Journals` reicht es nicht, einen beliebigen Code als Gegenkonto zu setzen. Der Gegenkonto-Typ bestimmt den Nummernkreis. Wenn `Bal. Account Type = G/L Account` sichtbar ist, muss ein Sachkonto oder ein sauber begruendeter anderer Gegenkonto-Pfad belegt werden.

## Buchwirkung

Kapitel 21 kann diesen Schritt als Debugging-/Setup-Readiness erklaeren: Erst Journaltyp und Kontenquelle verstehen, dann Zielwerte setzen. In diesem Lauf wurde noch kein Konto-Kandidat akzeptiert, weil die Setupseite `FA Posting Groups` nicht belastbar sichtbar war.

## Grenzen

- Kein finaler Gegenkonto-Zielwert.
- Keine Werteingabe.
- Keine Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-164: prove the exact FA Posting Group field label/value for the acquisition-cost balancing account before any FA G/L Journal value-entry retry.
