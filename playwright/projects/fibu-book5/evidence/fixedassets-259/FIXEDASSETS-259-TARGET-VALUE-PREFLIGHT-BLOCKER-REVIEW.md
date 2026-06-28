# FIXEDASSETS-259 Guard-Review zum AfA-Zielwert-Preflight

Status: `labor`, `local-review`, `guard-review`, `no-bc-run`, `no-playwright-run`, `not-final`.

## Befund

FA-258 hat die `Calculate Depreciation` Request Page in `MCP_1_20260210` / `RM-DEMO` erreicht, aber vor der Werteingabe blockiert. Der Blocker war `dangerous-confirm-visible-before-depreciationBook`.

## Einordnung

Der Blocker ist ein Playwright-Guard-Blocker. Auf einer Business-Central-Request-Page ist `OK` normal sichtbar. Fuer den no-OK-Preflight ist nicht die Sichtbarkeit gefaehrlich, sondern ein Klick oder eine Bestaetigung auf `OK`.

## Entscheidung

Eine Guard-Verfeinerung und ein einzelner no-OK Retry sind sinnvoll. Weiterhin nicht freigegeben sind `OK`, Preview Posting, Post, Setup Change, Company Switch und API-Abkuerzung.

## Naechster Schritt

`FIXEDASSETS-260`: Guard so verfeinern, dass sichtbares Request-Page-`OK` nicht blockiert, aber jeder OK-/Confirm-/Post-/Preview-Klick hart gesperrt bleibt. Danach genau einen Zielwert-Preflight ohne `OK` ausfuehren.
