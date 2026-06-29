# PREP-019 - Autopilot Efficiency Improvement

Status: `prep-done`, `agent-efficiency`, `no-bc-run`, `no-playwright-run`

## Was wurde verbessert?

`agent:marathon:check` hatte noch alte Target-Marathon-Daten als naechste Execute-Hebel ausgegeben. Das war im aktuellen Zustand irrefuehrend, weil Company Creation bis zu bestaetigten SUPER-/Company-Create-Rechten geparkt ist und die aktive Queue nur PREP-/Read-only-/Repo-Arbeit erlaubt.

Der Check wertet nun die aktive `.agent/state/marathon_queue.json` fuehrend aus, wenn `noEffectiveBusinessCentralActions=true` gesetzt ist. In diesem Modus:

- wird die PREP-Queue als Laufwahrheit verwendet,
- werden alte Target-Summaries nicht mehr als Execute-Hebel verwendet,
- bleibt `nextExecuteLever` leer,
- bleibt der Check trotzdem rot, solange die PREP-Queue nicht leer ist.

## Grenze

Keine Business-Central-Ausfuehrung. Kein Playwright. Keine Company Creation. Keine Buchaenderung. Keine Setup-, Preview- oder Posting-Aktion.

## Naechster Schritt

`PREP-020-UNIVERSAARL-DATASET-BLUEPRINT`: Die Datenfamilien fuer die spaetere Universaarl-Firma sollen konkreter werden, damit nach den Rechten nicht mit zu wenigen Stammdaten und Belegen gestartet wird.
