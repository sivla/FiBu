# FIXEDASSETS-243 - FA Depreciation Route Decision

Status: `local-review`, `microsoft-learn-backed`, `no-bc-run`, `no-playwright-run`, `no-calculate-depreciation`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | `MCP_1_20260210` |
| Company | `RM-DEMO` |
| Ergebnis | `observed-local-decision` |
| Naechste Route | Tell-Me / Search nach `Calculate Depreciation` |
| Ausfuehrung freigegeben | nein |

## Entscheidung

Die bisherigen UI-Routen reichen nicht aus, um `AfA berechnen` fachlich sauber zu bebildern:

- `Fixed Asset G/L Journals` zeigt Journal- und Post-/Preview-Kontext, aber keinen `Calculate Depreciation`-Einstieg.
- Die `FA-CNC-01` Anlagenkarte zeigt den Bestand, `Acquire` als deaktivierte Aktion und `Acquisition Cost = 120.000,00`, aber keinen `Calculate Depreciation`-Einstieg.
- Microsoft Learn beschreibt den automatischen Weg ueber Search/Alt+Q: `Calculate Depreciation` suchen und den verknuepften Eintrag waehlen; danach erstellt der Batch Job Zeilen im Fixed Asset G/L Journal.

Deshalb ist der naechste sinnvolle Schritt nicht ein weiterer Journal-/Karten-Dropdown-Lauf, sondern ein read-only Tell-Me-Suchergebnis-Inventar fuer `Calculate Depreciation`.

## Quellenbezug

- Microsoft Learn `Depreciate or amortize fixed assets`: automatischer AfA-Weg ueber Search/Alt+Q und `Calculate Depreciation`; der Batch Job erzeugt Zeilen im Fixed Asset G/L Journal.
- Microsoft Learn `Report "Calculate Depreciation"`: Report ID `5692`, Caption `Calculate Depreciation`, `ProcessingOnly = True`, `UsageCategory = Tasks`.

## Warum das fuer Anfaenger wichtig ist

Die Anlagenkarte und das Anlagenjournal erklaeren Bestand, Werte und Buchungsziel. Sie beweisen aber nicht automatisch den Einstieg in den AfA-Batch. Eine Klickanleitung muss daher unterscheiden:

- Wo sehe ich die Anlage und ihren Buchwert?
- Wo entstehen AfA-Journalzeilen?
- Wo starte ich den Batch Job?
- Wann darf ich Preview Posting oder Post ueberhaupt erst anfassen?

## Grenzen

- Kein BC-Lauf.
- Kein Playwright-Lauf.
- Kein Tell-Me-Ergebnis in der Sandbox geoeffnet.
- Kein `Calculate Depreciation` ausgefuehrt.
- Keine AfA-Journalzeile erzeugt.
- Kein Preview Posting.
- Keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-244`: Tell-Me / Search read-only nach `Calculate Depreciation` inventarisieren. Nur Suchergebnisse und Page-/Report-Kontext erfassen; keinen verwandten Link ausfuehren und keinen OK-/Report-Dialog bestaetigen.
