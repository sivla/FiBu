# WAREHOUSE-025 Source PO Location Route Decision

Status: `labor`, `route-decision`, `no-bc-run`, `no-posting`, `not-final`.

## Entscheidung

Do not repeat WAREHOUSE-024 single-cell typing. The next best route is a read-only Active Editor and Line Details probe on Purchase Order 106055: focus the RAW-STEEL Location Code cell, capture activeElement/real inputs/comboboxes and line action candidates, but do not type FRA-ZL yet.

## Warum nicht wiederholen?

- WAREHOUSE-024 hat die sichtbare RAW-STEEL-Zeile und die `Location Code`-Spalte bereits genutzt.
- Der Zielklick war geometrisch plausibel, aber `FRA-ZL` wurde nicht sichtbar gespeichert.
- Ein weiterer identischer Klick-/Type-/Tab-Versuch waere keine neue fachliche Evidence.

## Naechster sicherer Schritt

WAREHOUSE-026: run a read-only active-editor/line-details probe on Purchase Order 106055; no value entry, no release, no receipt, no preview, no posting.

## Grenzen

- Kein BC-Lauf in WAREHOUSE-025.
- Kein Playwright-Lauf in WAREHOUSE-025.
- Kein Release, Receive, Invoice, Preview Posting oder Post.
- Kein deutscher Finalnachweis.
