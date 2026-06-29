# PREP-009 RM Decommission Inventory Refinement

Status: `prep-done`, `decommission`, `no-bc-run`, `no-playwright-run`

## Zweck

Dieser Lauf schaerft die Trennung zwischen aktiver Universaarl-Zielwelt und alter RM-/Rhein-Main-/CRONUS-Laborwelt. Historische Evidence bleibt erhalten, darf aber nicht als aktive Zielwahrheit wirken.

## Geprueft

- `playwright/projects/fibu-book5/UNIVERSAARL-RM-DECOMMISSION-PLAN.md`
- `.agent/state/rm_decommission_inventory.json`
- `playwright/projects/fibu-book5/BC-FULL-PLAYTHROUGH-CATALOG.md`
- zentrale aktive Coverage-/Atlas-/State-Dateien

## Ergebnis

- Der Full-Playthrough-Katalog fuehrt nun die aktuelle PREP-Reihenfolge statt erledigter PREP-005/006/007-Cases.
- Der Decommission-Plan enthaelt einen Active-Scan vom 30.06.2026 mit Trefferklassen fuer Buchmaster, State, Coverage, Atlanten und Screenshot-Inventar.
- Das Inventar trennt deutlicher zwischen `replace-with-universaarl-evidence`, `external-archive-later`, `removed-from-active-repo` und `false-positive`.

## Grenzen

- Keine historischen Evidence-Dateien wurden umbenannt oder geloescht.
- Der Buchmaster wurde in diesem Lauf nicht massenhaft ersetzt.
- `UNIVERSAARL-DE` wurde nicht erstellt.
- Company Creation bleibt `parked-until-super-permissions`.

## Naechster sinnvoller Schritt

`PREP-010-PLAYWRIGHT-READONLY-HELPERS-AND-UI-ERGONOMICS`: Tooltip-, Splitbutton-, Fokusmodus- und Screenshot-QA-Regeln in wiederverwendbare Playwright-/Autopilot-Patterns ueberfuehren.
