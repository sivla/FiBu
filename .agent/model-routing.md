# Modell-Routing fuer FiBu Buch 5

Diese Datei erklaert die Routing-Rollen aus `.agent/model-routing.json`.
Ziel ist nicht, immer das kleinste Modell zu nehmen. Ziel ist das beste Verhaeltnis aus Verbrauch, Qualitaet und Wiederholungsrisiko.

## Rollen

| Taskclass | Rolle | Modellfamilie | Zweck |
|---|---|---|---|
| `monkey_work` | Monkey Crew | `gpt-4-mini-*` | Billige Fleissarbeit: lesen, sortieren, validieren, extrahieren, normalisieren |
| `wizard_work` | Wizard Bench | `gpt-4-*` | Toolwork: Scripts, Checks, Helper, Schemas, Refactors |
| `judge_work` | Judge Panel | `gpt-5.5-low/medium` | Urteil: BC-/FiBu-Logik, Buch-vs-Evidence, Setup-/Posting-Risiko |
| `big_brain_review` | Big Brain | `gpt-5.5-high` | Seltene Endabnahme bei grosser Folgewirkung |

## Routing-Leitplanken

- `monkey_work` ist fuer Masse da: JSON pruefen, State lesen, Screenshot-Metadaten auswerten, Evidence-Felder extrahieren.
- `wizard_work` baut und repariert die Werkbank: Node-Tools, Playwright-Helper, Schemas, `package.json`-Skripte.
- `judge_work` entscheidet, wenn fachliche Wahrheit oder Risiko betroffen ist: BC-/FiBu-Urteil, Posting-Gates, Steuer-/Compliance-Aussagen, Buch-vs-Evidence-Konflikte.
- `big_brain_review` ist selten. `gpt-5.5-high` darf pro groesserem Lauf maximal einmal genutzt werden und ist nie Default.

## Subagent-Policy

Subagents erben ohne Override das Parent-Modell. Das ist fuer dieses Projekt zu teuer.

Deshalb gilt bei `spawn_agent`:

| Taskclass | Spawn-Modell | Reasoning | Typischer Agent |
|---|---|---|---|
| `monkey_work` | `gpt-5.4-mini` | `low/medium/high`, Default `low` | `explorer` |
| `wizard_work` | `gpt-5.4` | `low/medium/high`, Default `medium` | `worker` oder `explorer` |
| `judge_work` | `gpt-5.5` | `low/medium/high`, Default `medium` | `explorer` |
| `big_brain_review` | `gpt-5.5` | `low/medium/high`, Default `high` | `default` |

Wichtig:

- Monkey- und Wizard-Subagents duerfen nicht das Parent-Modell erben.
- Jede Rolle hat `low/medium/high`; die Rolle bestimmt die Modellfamilie, Reasoning bestimmt die Tiefe.
- Judge-Subagents brauchen eine klare Urteilsbegruendung.
- Big-Brain-Subagents sind selten und muessen geloggt werden.

## Projektbeispiele

| Situation | Taskclass |
|---|---|
| `current.json` lesen und aktiven Case finden | `monkey_work` |
| Screenshot-Metadaten pruefen, ob Status und Zweck gepflegt sind | `monkey_work` |
| `scripts/agent/*` erweitern oder ein Schema pruefen | `wizard_work` |
| Playwright-Helper fuer BC-Dialoge robuster machen | `wizard_work` |
| Entscheiden, ob ein BC-Blocker Setup, Daten, UI oder Playwright ist | `judge_work` |
| Entscheiden, ob eine Buchstelle trotz CRONUS-USA-Labor so stehen darf | `judge_work` |
| Endabnahme einer neuen Agenten-Architektur oder riskanten Posting-Strategie | `big_brain_review` |

## Eskalation

Kleine Modelle sparen nur dann, wenn sie nicht drei Korrekturschleifen erzeugen. Deshalb gilt:

- Erst Tool/Skript nutzen, wenn es die Frage deterministisch klaert.
- Niedrig routen, wenn Risiko niedrig und Outputformat strikt ist.
- Direkt `judge_work` nutzen, wenn BC-/FiBu-Urteil oder Buchwahrheit betroffen ist.
- Direkt `big_brain_review` nur mit expliziter Begruendung und maximal einmal pro groesserem Lauf.

## Logging

Jede Nutzung von `judge_work` oder `big_brain_review` muss im Model-Usage-Log begruendet werden:

- `timestamp`
- `task`
- `taskClass`
- `chosenModelClass`
- `reason`
- `expectedRisk`
- `expectedRetryAvoidance`
- `actualOutcome`
- `filesRead`
- `skillsLoaded`
- `followupRequired`

`npm run agent:usage:summary` wertet diese Felder aus. Wichtig sind nicht perfekte Zahlen, sondern Trends:

- Wird `judge_work` seltener, weil Capabilities reifer werden?
- Entstehen weniger Follow-up-Laeufe?
- Bleiben Dateien und Skills unter Budget?
- Ist ein teurer Lauf wirklich weniger teuer als drei billige Korrekturschleifen?

Beispiele stehen in `.agent/state/model_usage_log.example.jsonl`.
