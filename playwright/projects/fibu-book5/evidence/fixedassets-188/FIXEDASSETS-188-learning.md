# FIXEDASSETS-188 Lernzusammenfassung

Status: `labor`, `preview-posting-only-retry`, `no-posting`, `not-final`.

## Ergebnis

FA-188 blieb sicher und bestaetigte vor dem Retry den persistierten Journalwert `Bal. Account No. = 82000`. Der Lauf bewies aber keine Vorschau: Der gewaehlte Post-Menue-Pfad oeffnete den Buchungsdialog statt `Preview Posting`.

## Lernwert

Nach dem Persistenznachweis aus FA-186 ist Preview Posting fachlich der richtige Kontrollpunkt. FA-188 zeigt aber, dass der Automationspfad selbst noch nicht stabil genug ist: Ein grober Klick auf `Post` kann in Business Central direkt den Buchungsdialog oeffnen, ohne dass `Preview Posting` tatsaechlich ausgewaehlt wurde.

Das ist ein wichtiger Playwright-Lernfall. Fuer den naechsten Live-Versuch braucht es zuerst eine gescopte Action-Inventory- oder Menue-Routenentscheidung: Wo liegt `Preview Posting` auf dieser Page wirklich, wie wird sie eindeutig angeklickt, und wie wird verhindert, dass der normale Buchungsdialog geoeffnet oder bestaetigt wird?

## Grenzen

- Keine Buchung.
- Keine Preview-Postenzeilen.
- Der sichtbare Posting-Dialog ist ein Blocker-/Rejected-Path-Befund, kein Vorschau-Nachweis.
- Keine echte FA-Ledger-/G/L-Postenspur.
- Kein deutscher Finalnachweis.
- Posting bleibt bis zum lokalen Review gesperrt.

## Naechster Schritt

FIXEDASSETS-189: locally review FA-188 Preview Posting-only evidence before any Fixed Asset G/L Journal posting.
