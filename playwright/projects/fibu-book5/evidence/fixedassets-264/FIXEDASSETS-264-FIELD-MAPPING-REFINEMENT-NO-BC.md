# FIXEDASSETS-264 - Field-Mapping-Refinement ohne BC

Status: `observed`, lokal, keine Business-Central-Ausfuehrung, keine Playwright-Ausfuehrung.

## Befund

Der FA-262-Fehler entstand, weil `fieldMap()` sichtbare Controls nach DOM-Sichtbarkeit filterte und deren gefilterten Index speicherte. `fillMappedField()` verwendete diesen Index spaeter gegen eine neue, ungefilterte Playwright-Locator-Liste. Dadurch konnte `nth(index)` auf ein unsichtbares Control zeigen.

## Aenderung

`fieldMap()` speichert jetzt zusaetzlich `queryIndex`: die Ordinalposition aus derselben Control-Selector-Liste, die `fillMappedField()` spaeter verwendet. `fillMappedField()` nutzt `control.queryIndex` fuer `frame.locator(controlSelector).nth(...)`.

## Grenze

Dieser Lauf beweist nur den lokalen Code-Fix. Er beweist noch nicht, dass Business Central die Zielwerte `HGB`, `30.06.2026`, `FADEP-265-NO-OK` und `FA-CNC-01` akzeptiert.

## Naechster Schritt

`FIXEDASSETS-265`: genau ein guarded no-OK Value-Preflight-Retry. Er darf Werte auf der Request Page schreiben und lesen, aber `OK`, Preview Posting und Post bleiben gesperrt.
