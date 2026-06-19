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
   - Standard ist danach ein Single-Agent-Lauf mit klaren Phasen. `npm run agent:subagent-plan` ist optional und kein echter Subagent-Start.
   - `agent:subagent-plan` nur ausfuehren, wenn Review/Eskalation noetig ist: `requiresStrongModel=true`, geplante Buchaenderung, Posting-/Setup-Bewertung, widerspruechliche Evidence/State, grosser Diff, blocked/failed Live-Lauf oder unklare naechste Case-Auswahl.
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
- Business Central bleibt in `MCP_1_20260210`; das ist die harte Instanzgrenze.
- Innerhalb `MCP_1_20260210` darf der Autopilot breit experimentieren, wenn der aktive Case es erlaubt und Evidence entsteht: Company wechseln, Test-Company anlegen, Drafts erzeugen, editieren, loeschen, Dialoge bestaetigen, Fehler provozieren, Preview/Post/Setup ausfuehren.
- Diese Sandbox-Freiheit ist immer case-/gate-gesteuert: jede Daten-, Setup-, Posting- oder Company-Aktion braucht dokumentierte Instanz, Company, Zweck, Ergebnis und Cleanup-/Trace-Status.
- Auth, `.env`, Reports, Traces, Videos und Rohsnapshots bleiben lokal.
- Screenshots und Evidence werden projekt-relativ referenziert.
- Jeder Lauf muss `last_run_summary.json` und den betroffenen Case-State aktualisieren.
- Bei `judge_work` oder `big_brain_review` muss ein Eintrag in `.agent/state/model_usage_log.jsonl` entstehen.
- `agent:subagent-plan` erzeugt nur einen budgetierten Review-/Delegationsplan. Er fuehrt keine KI-Subagents aus und sein Output wird im Standardlauf nicht automatisch konsumiert.
- Fuer normale Sandbox-Probes, kleine Evidence-Syncs und enge Playwright-Fixes gilt: kein Subagent-Plan als Pflicht, solange `context`, `dry-run` und `run-plan` eindeutig sind.
- Subagent-/Review-Planung bleibt Pflicht, wenn starke Urteilskraft oder zweite Sicht noetig ist: riskante fachliche Bewertung, Buchfreigabe, Posting-/Setup-Ergebnis, widerspruechliche Projektwahrheit, grosser Diff, fehlgeschlagener Live-Lauf oder unklare Case-Auswahl.
- Neue wiederverwendbare Playwright-/BC-Faehigkeiten werden in `.agent/capabilities.json` als Capability mit Inputs, Outputs, Gates und Reifegrad gepflegt.
- Datei-/Skill-Limits sind adaptive Budget-Profile aus `.agent/budgets.json`; fuer grosse Laeufe bewusst `expanded` oder `deep` im Case setzen statt heimlich mehr Kontext zu laden.
- Keine neue npm-Abhaengigkeit ohne ausdrueckliche Freigabe. Agent-Tools nutzen Node-Standardbibliothek.
- `monkey_work` darf nur Routing, Extraktion, Formatierung und Validierung ausfuehren; BC-/FiBu-Urteil, Posting-/Setup-Gates und Buchtext-Freigabe muessen zu `judge_work` oder `big_brain_review` eskalieren.

## Skill-/Capability-Lernen

- Skills, Capabilities und Playwright-Helper duerfen nur evidence-getrieben erweitert werden.
- Erlaubt ist Lernen, wenn ein aktuelles Result oder ein wiederholter Blocker zeigt, dass ein Muster fehlt: BC Lines/Subform Handling, Dropdown Value Discovery, Dialog/Confirm/Error Handling, Draft Lifecycle und Cleanup Proof, Posting/Preview Evidence Trace, Company-/Context-Dokumentation oder fokussierte Action-Inventare.
- Nicht erlaubt sind Skills auf Vorrat, Agenten-/Framework-Ausbau ohne aktuellen Blocker, grosse Architekturumbauten ohne praktischen Nutzen oder neue Dependencies ohne ausdrueckliche Freigabe.
- Neue oder geaenderte Skills muessen dem Vertrag in `.agent/skills/SKILL-CONTRACT.md` folgen und Zweck, Use/Do-not-use, Inputs, Output JSON Schema, Safety/Boundary Rules, Stop-if, Preferred taskClass, Kontextlimit und State-Update-Verhalten enthalten.
- Neue oder geaenderte Capabilities muessen eine reproduzierbare Faehigkeit, Inputs, Outputs, Gates/Boundaries, Playwright Touchpoints, Maturity und die begruendende Evidence oder den Blocker dokumentieren.
- Helper-Aenderungen brauchen einen kleinen passenden Probe/Test oder eine konkrete Evidence-Begruendung. Nach Skill-/Capability-/Helper-Aenderungen laufen mindestens `npm run agent:preflight`, `npm run check:encoding` und `git diff --check`.

## Aktueller Einstieg

Der aktuelle kompakte State verweist auf die in `.agent/state/current.json` genannte aktive Case-Datei.
Die konkrete Case-ID und der naechste sichere Schritt werden nicht mehr hier dupliziert, sondern aus `current.json` gelesen.
Fuer Fixed-Assets-Purchase-Invoice-Laeufe gilt: erst den echten Lines-/Type-Kontext beweisen, dann Zielwerte eingeben; Cleanup fuer Sandbox-Drafts bleibt Pflicht.
