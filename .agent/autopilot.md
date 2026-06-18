# FiBu Buch 5 Autopilot

Zweck: kleiner Einstiegspunkt fuer Codex-Laeufe, die nicht den gesamten Projektverlauf lesen sollen.

## Startreihenfolge

1. `git branch --show-current`, `git status --short` und `git pull --ff-only` pruefen.
2. Lokale Agent-Checks laufen lassen, bevor ein Fachlauf startet:
   - `npm run agent:preflight`
3. Kompakten Lauf-Steckbrief erzeugen:
   - `npm run agent:context`
   - optional `npm run agent:usage:summary`, wenn `judge_work` oder `big_brain_review` genutzt wurde
4. Modell-/Reasoning-Klasse aus `.agent/model-routing.json` waehlen:
   - `monkey_work` fuer billige Fleissarbeit
   - `wizard_work` fuer Tool-, Script-, Helper- und Refactor-Arbeit
   - `judge_work` fuer BC-/FiBu-Urteil, Buch-vs-Evidence und Risikoentscheidungen
   - `big_brain_review` nur als seltene Endabnahme
   - Bei `spawn_agent` immer `subagentSpawn.spawnModel` und `subagentSpawn.reasoningEffort` aus `.agent/model-routing.json` setzen; nicht das Parent-Modell erben lassen.
   - Beispiele stehen in `.agent/subagent-routing.md`.
5. Nur diese Kernstate-Dateien lesen, falls der Context-Pack nicht ausreicht:
   - `.agent/state/current.json`
   - `.agent/state/project_state.json`
   - `.agent/state/coverage_state.json`
   - `.agent/state/last_run_summary.json`
   - die in `current.json.active_case_file` genannte Case-Datei
6. Danach maximal drei Skills laden, die fuer den gewaehlten Lauf gebraucht werden.
7. Alte grosse Projektdateien nur gezielt lesen, wenn der State oder ein Skill sie ausdruecklich verlangt.

## Arbeitsprinzip

- Repo-State ist die Wahrheit, nicht alte Chat-Historie.
- Business Central bleibt in `MCP_1_20260210`.
- Auth, `.env`, Reports, Traces, Videos und Rohsnapshots bleiben lokal.
- Screenshots und Evidence werden projekt-relativ referenziert.
- Jeder Lauf muss `last_run_summary.json` und den betroffenen Case-State aktualisieren.
- Bei `judge_work` oder `big_brain_review` muss ein Eintrag in `.agent/state/model_usage_log.jsonl` entstehen.
- Neue wiederverwendbare Playwright-/BC-Faehigkeiten werden in `.agent/capabilities.json` als Capability mit Inputs, Outputs, Gates und Reifegrad gepflegt.
- Keine neue npm-Abhaengigkeit ohne ausdrueckliche Freigabe. Agent-Tools nutzen Node-Standardbibliothek.
- `monkey_work` darf nur Routing, Extraktion, Formatierung und Validierung ausfuehren; BC-/FiBu-Urteil, Posting-/Setup-Gates und Buchtext-Freigabe muessen zu `judge_work` oder `big_brain_review` eskalieren.

## Aktueller Einstieg

Der aktuelle kompakte State verweist auf `FIXEDASSETS-065-PURCHASE-INVOICE-LINE-TYPE-HELPER-DIAGNOSIS`.
Dieser Schritt ist ein Diagnose-/Helper-Schritt. Er darf nicht buchen, keine Zielwerte eingeben und `FA-CNC-01` nicht verwenden.
