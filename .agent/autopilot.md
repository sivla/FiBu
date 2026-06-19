# FiBu Buch 5 Autopilot

Zweck: kleiner Einstiegspunkt fuer Codex-Laeufe, die nicht den gesamten Projektverlauf lesen sollen.

## Startreihenfolge

1. `git branch --show-current`, `git status --short` und `git pull --ff-only` pruefen.
2. Lokale Agent-Checks laufen lassen, bevor ein Fachlauf startet:
   - `npm run agent:preflight`
   - Der Preflight prueft State, Budgets, Safety, Modellrouting, Capability-Links und Skill-Vertrag.
3. Kompakten Lauf-Steckbrief erzeugen:
   - `npm run agent:context`
   - `npm run agent:dry-run`, wenn ein Lauf erst geplant und ohne BC/Playwright validiert werden soll.
   - Der Dry-Run gibt `canProceed`, Budget, Skills, Capabilities, Safety Gates, Stop Conditions und `nextSafeAction` als JSON aus.
   - `npm run agent:run-plan`, wenn aus dem Dry-Run eine konkrete lokale Schrittfolge entstehen soll.
   - Der Run-Plan blockiert Playwright, Business Central, Buchpatches und Binary-/Screenshot-Lesen weiterhin.
   - `npm run agent:result-normalize`, wenn ein lokales Analyseergebnis in ein einheitliches Result-JSON ueberfuehrt werden soll.
   - Der Result-Normalizer schreibt noch keinen State; State-Finalisierung bleibt eine spaetere Gate-Schicht.
   - `npm run agent:state-finalize`, wenn aus einem normalisierten Result ein State-Patch-Plan entstehen soll.
   - State-Finalisierung schreibt standardmaessig nicht; `--write` ist nur mit `safeToFinalizeState=true`, Review-freiem Result und nichtleerem `statePatch` moeglich.
   - `npm run agent:state-finalize:test` prueft die lokale Pipeline mit einem kuenstlichen sicheren Result im Planmodus.
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
   - Jeder Skill muss dem Vertrag in `.agent/skills/SKILL-CONTRACT.md` folgen.
   - Fuer BC-UI-Arbeit gilt zusaetzlich `.agent/BC-OPERATING-MODEL.md`.
7. Alte grosse Projektdateien nur gezielt lesen, wenn der State oder ein Skill sie ausdruecklich verlangt.

## Arbeitsprinzip

- Repo-State ist die Wahrheit, nicht alte Chat-Historie.
- Business Central bleibt in `MCP_1_20260210`.
- Auth, `.env`, Reports, Traces, Videos und Rohsnapshots bleiben lokal.
- Screenshots und Evidence werden projekt-relativ referenziert.
- Jeder Lauf muss `last_run_summary.json` und den betroffenen Case-State aktualisieren.
- Bei `judge_work` oder `big_brain_review` muss ein Eintrag in `.agent/state/model_usage_log.jsonl` entstehen.
- Neue wiederverwendbare Playwright-/BC-Faehigkeiten werden in `.agent/capabilities.json` als Capability mit Inputs, Outputs, Gates und Reifegrad gepflegt.
- Datei-/Skill-Limits sind adaptive Budget-Profile aus `.agent/budgets.json`; fuer grosse Laeufe bewusst `expanded` oder `deep` im Case setzen statt heimlich mehr Kontext zu laden.
- Keine neue npm-Abhaengigkeit ohne ausdrueckliche Freigabe. Agent-Tools nutzen Node-Standardbibliothek.
- `monkey_work` darf nur Routing, Extraktion, Formatierung und Validierung ausfuehren; BC-/FiBu-Urteil, Posting-/Setup-Gates und Buchtext-Freigabe muessen zu `judge_work` oder `big_brain_review` eskalieren.

## Aktueller Einstieg

Der aktuelle kompakte State verweist auf die in `.agent/state/current.json` genannte aktive Case-Datei.
Aktuell ist das `FIXEDASSETS-066-PURCHASE-INVOICE-LINE-TYPE-GUARDED-PROBE-PREP`.
Der vorbereitete Runner ist nicht read-only: Er klickt `New/Neu` und kann einen temporaeren Draft erzeugen.
Er darf daher nur mit ausdruecklicher Freigabe laufen. Ohne Freigabe ist der naechste sichere Schritt ein read-only Kontext- oder Action-Inventar-Lauf.
