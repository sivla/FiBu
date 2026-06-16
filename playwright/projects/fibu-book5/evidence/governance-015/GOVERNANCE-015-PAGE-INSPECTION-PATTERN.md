# GOVERNANCE-015 - Page Inspection / Seitenpruefung als technische Diagnose

Status: `done-doc-source-sync-no-bc-run`

Umgebung: `MCP_1_20260210`

Aktuelle Projektcompany: `RM-DEMO`

## Was aufgenommen wurde

Page Inspection wird als wiederverwendbares Diagnosemuster fuer Business-Central-Klickanleitungen, Bugfixing und Playwright-Locator-Validierung aufgenommen.

Der Standardpfad ist `Ctrl+Alt+F1`. Falls diese Tastenkombination durch Browser, Remote Desktop oder Windows abgefangen wird, wird der Help-&-Support-Pfad `Inspect pages and data` als Alternative dokumentiert.

## Warum das wichtig ist

Klickanleitungen und Tests muessen oft klären:

- Auf welcher Page steht der Anwender wirklich?
- Welche Page ID und welcher Page Type sind aktiv?
- Welche Source Table und Table ID stecken hinter der Ansicht?
- Welche Felder, Filter oder Parts sind relevant?
- Ist ein Feld oder Verhalten durch eine Extension beeinflusst?

Das ist besonders wichtig, wenn sichtbarer Seitentitel, Tabellenbereich, FactBox, Dialog oder Playwright-Locator nicht eindeutig sind.

## Grenze

Page Inspection beweist technischen Page-Kontext, aber keine fachliche Buchungs-, Posting-, Steuer- oder Kontenlogik.

Ein Page-Inspection-Bild ist ein Debug-/Evidence-Bild. Ein finales Buchbild fuer einen Prozessschritt muss weiterhin die normale Anwendersicht zeigen.

## Quellen

- Microsoft Learn: [Inspecting pages in Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/across-inspect-page)
- Microsoft Learn: [Keyboard shortcuts](https://learn.microsoft.com/en-ca/dynamics365/business-central/keyboard-shortcuts)
- Microsoft Learn for developers: [Inspecting pages](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-inspecting-pages)

## Projektwirkung

Aktualisiert:

- `BC-PLAYWRIGHT-PATTERNS.md`
- `MICROSOFT-DOC-VALIDATION.md`
- `WORKAROUNDS-AND-ERRORS.md`
- Buchkapitel 37 im Master-Blueprint

Keine BC-Ausfuehrung, keine Setup-Aenderung, keine Buchung, kein Company-Wechsel.
