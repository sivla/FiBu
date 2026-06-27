# FIXEDASSETS-241 - FA Depreciation Route Review

Status: `local-review`, `route-decision`, `no-bc-run`, `no-playwright-run`, `no-calculate-depreciation`, `no-preview`, `no-posting`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| Ergebnis | `Calculate Depreciation` bleibt im Journal-Kontext unbewiesen |
| naechster Pfad | `Fixed Assets` / `FA-CNC-01` read-only Action-Inventar |

## Entscheidung

Die Journalroute ist nicht falsch, aber fuer die AfA-Berechnung noch nicht der richtige naechste Klickpfad:

- `FIXEDASSETS-236` beweist `Fixed Asset G/L Journals` read-only.
- `FIXEDASSETS-238` beweist `Preview Posting` nur im gefaehrlichen `Post`-Dropdown.
- `FIXEDASSETS-239` sperrt Preview fuer AfA, weil keine AfA-Zeile und kein Berechnungspfad belegt sind.
- `FIXEDASSETS-240` beweist, dass `More Options` im Journal keinen sicheren `Calculate Depreciation`-Pfad zeigt.

Die lokale Action Map fuehrt `Calculate Depreciation` im Kontext `Fixed Assets` als gefaehrliche Aktion. Deshalb ist der naechste kleinste sichere Schritt kein Preview und keine Journalzeile, sondern ein read-only Aktionsinventar auf der Anlagenliste oder der `FA-CNC-01`-Karte.

## Buchwirkung

Die Klickanleitung darf jetzt erklaeren: Eine sichtbare Journalspalte `FA Posting Type = Depreciation` ist nicht dasselbe wie die Aktion `AfA berechnen`. Anfaenger sollen erst lernen, wo der AfA-Berechnungsbefehl liegt, bevor sie eine Vorschau oder Buchung starten.

## Nicht passiert

- Kein BC-Lauf.
- Kein Playwright-Lauf.
- Kein `Calculate Depreciation`.
- Kein `Preview Posting`.
- Kein `Post`.
- Keine Journalzeile.
- Kein Setup.
- Kein deutscher Finalnachweis.

## Naechster Schritt

`FIXEDASSETS-242`: `Fixed Assets` / `FA-CNC-01` read-only oeffnen und nur nicht-ausfuehrende Aktionsbereiche inventarisieren. Wenn `Calculate Depreciation` sichtbar wird, bleibt der Klick selbst fuer einen separaten Entscheidungsfall gesperrt.
