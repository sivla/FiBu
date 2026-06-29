# PREP-018 - Playwright Script and Helper Inventory

Status: `prep-done`, `playwright-inventory`, `no-bc-run`, `no-playwright-run`

## Was geprüft wurde

PREP-018 hat die vorhandenen Playwright-Tests, npm-`fibu:*`-Skripte und Kernhelper klassifiziert. Ziel war nicht, Playwright auszuführen, sondern die aktive Universaarl-Schiene von historischer RM-DEMO-/MCP-/CRONUS-Laborware zu trennen.

## Ergebnis

- 306 Playwright-Testdateien wurden nach Präfix/Gruppen inventarisiert.
- 307 npm-`fibu:*`-Skripte wurden als ausführbare Test-/Prozessbefehle erkannt.
- Die aktive Universaarl-Schiene ist klein: 9 `target-*`-Tests und 4 `live-smoke-*`-Read-only-Kandidaten.
- Die meisten Prozessdateien sind Legacy-Laborwissen, besonders Fixed Assets, P2P, Warehouse, Payments/Bank und UAT-CRONUS.
- Wiederverwendbare Helper liegen in `playwright/core/bc/`, `playwright/core/bc-helpers.ts` und `playwright/core/evidence.ts`.

## Neue/aktualisierte Inventarquelle

- `playwright/projects/fibu-book5/UNIVERSAARL-PLAYWRIGHT-SCRIPT-INVENTORY.md`

## Grenzen

- Kein Business Central geöffnet.
- Kein Playwright-Test ausgeführt.
- Keine Company angelegt.
- Keine Setup-, Stammdaten-, Beleg-, Preview- oder Posting-Aktion.
- Keine Buchänderung.

## Nächster sinnvoller Schritt

`PREP-019-AUTOPILOT-EFFICIENCY-IMPROVEMENT`: Die Agenten-Auswahl soll die offene PREP-Queue besser gewichten, solange Company Creation geparkt ist. `agent:marathon:check` zeigt aktuell noch alte Target-Execute-Lever als nächsten Hebel, obwohl die Permission-Queue PREP-018/019/020 aktiv hält.
