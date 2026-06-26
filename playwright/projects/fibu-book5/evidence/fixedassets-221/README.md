# FIXEDASSETS-221 - Review Amount Persistence Blocker

Status: local review, no BC, no Playwright, no posting

## Ergebnis

FA-220 ist als sicherer Blocker akzeptiert: Der Lauf blieb in `MCP_1_20260210` / `RM-DEMO`, hat die Zielzeile erneut erkannt, aber Preview Posting nicht geoeffnet, weil `Amount 120.000,00` nach dem erneuten Laden nicht sichtbar war.

Damit ist FA-220 kein Preview-Posting-Nachweis. Es ist ein Safety- und Persistenzhinweis: Der Betrag aus FA-218 war in der Folgesitzung nicht belastbar genug sichtbar, um Preview Posting zu oeffnen.

## Entscheidung

Der naechste sinnvolle Schritt ist ein kleiner Single-Session-Lauf:

1. Zielzeile `G05001 / FA-CNC-01 / HGB / Acquisition Cost / 82000` erneut eindeutig pruefen.
2. Nur `Amount` setzen, falls die Zielzeile eindeutig ist.
3. Den Betrag sofort in derselben Sitzung sichtbar/current pruefen.
4. Nur das exakte `Preview Posting`-Menuitem oeffnen.
5. Preview-Zeilen oder Fehlermeldung kompakt sichern.
6. Nicht buchen.

## Grenzen

- Keine Preview Posting Evidence aus FA-220.
- Keine FA Ledger Entries oder G/L Entries.
- Kein deutscher Finalnachweis.
- Keine Buchungserlaubnis.

## Evidence

- `FIXEDASSETS-221-decision.md`
- `FIXEDASSETS-221-result.json`
