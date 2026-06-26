# FIXEDASSETS-231 - HGB G/L Integration Value Proof

Status: `labor`, `read-only`, `value-proof`, `no-preview`, `no-posting`, `no-setup-change`, `not-final`.

| Feld | Wert |
|---|---|
| Instanz | MCP_1_20260210 |
| Company | RM-DEMO |
| HGB Acq. Cost Integration | visible-on (control-checked-state) |
| HGB Depreciation Integration | visible-off (control-checked-state) |

## Ergebnis

FA-231 proved G/L Integration - Acq. Cost as visible-on read-only; no setup, preview or posting occurred.

## Anfaenger-Lernwert

Ein Feldname in Page Inspection beweist nur, dass Business Central dieses Feld auf der Page oder Tabelle kennt. Fuer eine Buchungsentscheidung braucht man den Wert: ist der Schalter an oder aus? Dieser Lauf trennt deshalb Controls, Feldcaptions und konkrete Werte.

## Grenzen

- Kein Toggle von G/L-Integration.
- Keine AfA-Journalzeile.
- Kein Preview Posting und keine Buchung.
- Kein deutscher Finalnachweis.

## Naechster Schritt

FIXEDASSETS-232: locally decide whether a tightly scoped depreciation preflight is safe; no posting yet.
