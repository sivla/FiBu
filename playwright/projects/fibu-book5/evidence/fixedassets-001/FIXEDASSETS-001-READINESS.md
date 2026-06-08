# FIXEDASSETS-001 Anlagen-Readiness

Status: `labor-candidate`, `read-only`, `no-posting`, `no-setup-change`, `not-final`.

## Zweck

Dieser Lauf startet Kapitel 21 kontrolliert als Readiness-Pruefung. Es wird keine Anlage angelegt, keine Einkaufsrechnung vorbereitet, keine AfA berechnet und nichts gebucht.

## Ergebnis

| Pruefpunkt | Status |
|---|---|
| Fixed Assets | labor-candidate; tell-me-page-text-and-screenshot |
| Depreciation Books | rejected; tell-me-page-text-and-screenshot |
| FA Posting Groups | rejected; tell-me-page-text-and-screenshot |
| FA Ledger Entries | labor-candidate; tell-me-page-text-and-screenshot |

## Buchwirkung

- Kapitel 21 ist noch kein praktischer Anlagenprozess.
- `FA-CNC-01`, `HGB`, `MACHINES`, Kreditor `K30000`, Zugang und AfA bleiben Zielwerte.
- Vor einer Buchung muessen Anlagenkarte, AfA-Buch, Anlagenbuchungsgruppe, Einkaufsbeleg, Preview Posting und Postenspur separat belegt werden.
- Der direkte Suchtreffer-Aufruf wurde in diesem Lauf bewusst nicht als Beweis verwendet; fuer Buchscreenshots braucht es danach gezielte Seitenoeffnungen.
- Im Buch/Testdatenmodell ist der Zugangsbetrag noch zu klaeren: Kapitel 21 nennt `120.000 EUR`, `resources-assets-projects.json` nennt `250.000`.

## Naechster Schritt

FIXEDASSETS-002 als UI-Read-only-Seitenoeffnung oder Setup-Fit nur nach Pruefung der Zielwerte: FA-CNC-01, AfA-Buch, FA Posting Group, Kreditor K30000 und Betrag im Buch/Testdatenmodell harmonisieren.
