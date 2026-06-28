# FIXEDASSETS-263 Field-Mapping-Blocker-Review

Status: `labor`, `local-review`, `field-mapping-review`, `no-bc-run`, `no-playwright-run`, `not-final`.

## Befund

FA-262 brach beim Fuellen des ersten Zielwertfelds ab. Playwright wollte eine unsichtbare Checkbox `gridSelectAllCheckBox-b3o` klicken.

## Ursache

Der sichtbare Control-Index aus `fieldMap()` stammt aus einer gefilterten DOM-Liste. Danach wurde derselbe Index gegen eine andere, ungefilterte Playwright-Locator-Liste verwendet. Dadurch kann `locator.nth(index)` auf ein anderes Element zeigen als in der Evidence-Map ausgewaehlt wurde.

## Entscheidung

Ein lokaler Code-Fix ist erlaubt. Der Fix darf nicht sofort Business Central erneut starten. Der naechste Case muss die Interaktion so umbauen, dass die ausgewaehlte sichtbare Control und das geklickte Element identisch bleiben.

## Grenzen

- Keine Zielwerte wurden bewiesen.
- Kein `OK` wurde bestaetigt.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-264`: Lokale Field-Mapping-Verfeinerung ohne BC/Playwright-Lauf.
