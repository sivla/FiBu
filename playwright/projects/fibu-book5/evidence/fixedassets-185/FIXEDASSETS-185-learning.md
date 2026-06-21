# FIXEDASSETS-185 Lernzusammenfassung

Status: `labor`, `local-review`, `blocked-preview`, `no-bc-run`, `no-posting`, `not-final`.

## Ergebnis

FA-185 rejects another Preview Posting attempt: FA-182 proved 82000 only immediately after fill, while FA-184 reopened the journal and found the same candidate blank. The missing proof is value persistence/commit across refresh or reopen.

## Warum BC/Playwright so reagiert

Business Central-Journale sind zeilen- und fokusgetrieben. Ein Wert kann direkt nach `fill` im aktiven Control sichtbar sein, ohne dass dieser Lauf bereits bewiesen hat, dass der Wert nach Save/Refresh/Reopen in der Journalzeile persistent ist. FA-184 hat genau diese fehlende Persistenz aufgedeckt.

## Entscheidung

Kein Preview-Retry und kein Post. Der naechste Lauf muss zuerst beweisen, dass `Bal. Account No. = 82000` nach einem sicheren UI-Commit und Reopen/Refresh weiter sichtbar ist.

## Naechster Schritt

`FIXEDASSETS-186`: guarded value-persistence probe, weiterhin ohne Preview Posting und ohne Post.
