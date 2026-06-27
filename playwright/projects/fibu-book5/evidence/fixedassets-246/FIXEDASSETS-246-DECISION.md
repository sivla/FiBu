# FIXEDASSETS-246 Request-Page-Entscheidung

Status: `labor`, `local-decision`, `no-bc-run`, `no-playwright-run`, `no-ok`, `not-final`.

## Entscheidung

Die Evidence aus `FIXEDASSETS-245` reicht fuer einen Buch-Kontrollpunkt: Die Anleitung darf erklaeren, dass vor der AfA-Ausfuehrung die Request Page `Calculate Depreciation` geprueft wird. Sichtbar und belegbar sind `Depreciation Book`, `Posting Date`, `Document No.`, `Posting Description`, `OK` und `Abbrechen`.

Sie reicht nicht als Nachweis einer AfA-Ausfuehrung. `OK` wurde nicht bestaetigt; es wurde keine AfA berechnet und keine Fixed-Asset-G/L-Journalzeile erzeugt.

## Buchwirkung

- Kapitel 21 darf die Request Page als Vor-Ausfuehrungsbild und Sicherheitsgrenze erklaeren.
- Der Text muss klar sagen: Bis hier wird nur geprueft. Erst `OK` startet den Batch.
- Keine Aussage zu Journalzeilen, Preview Posting, AfA-Buchung oder Postenspur aus FA-245/FA-246 ableiten.

## Gate fuer den naechsten Schritt

`FIXEDASSETS-247` soll zuerst planen, unter welchen Bedingungen ein kontrollierter Ausfuehrungslauf erlaubt ist. Der Plan muss mindestens regeln:

- welche Felder vor `OK` gesetzt oder bewusst leer gelassen werden,
- wie erkannt wird, ob Journalzeilen erzeugt wurden,
- ob erzeugte Journalzeilen behalten oder bereinigt werden,
- wo danach Preview Posting/Postenspur geprueft werden darf,
- welche Stop-Bedingungen bei unerwarteten Dialogen gelten.

## Grenzen

- Keine Business-Central-Ausfuehrung in FA-246.
- Kein Playwright-Lauf in FA-246.
- Kein `OK`.
- Keine AfA-Berechnung.
- Keine Journalzeile.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.
