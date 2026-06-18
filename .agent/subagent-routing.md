# Subagent Routing

Subagents erben ohne Override das Parent-Modell. Das ist fuer Monkey- und Wizard-Aufgaben zu teuer.

Vor jedem `spawn_agent`:

1. Taskclass aus `.agent/model-routing.json` waehlen.
2. `subagentSpawn.spawnModel` als `model` setzen.
3. `reasoning_effort` aus `subagentSpawn.allowedReasoningEfforts` waehlen. Der gespeicherte `reasoningEffort` ist nur der Default.
4. Nur bei `judge_work` oder `big_brain_review` teure Modelle nutzen und begruenden.

## Beispiele

Monkey Crew fuer billige Lesearbeit:

```text
agent_type: explorer
model: gpt-5.4-mini
reasoning_effort: low | medium | high
```

Wizard Bench fuer Tool-/Helper-Arbeit:

```text
agent_type: worker oder explorer
model: gpt-5.4
reasoning_effort: low | medium | high
```

Judge Panel fuer BC-/FiBu-Urteil:

```text
agent_type: explorer
model: gpt-5.5
reasoning_effort: low | medium | high
```

Big Brain fuer seltene Endabnahme:

```text
agent_type: default
model: gpt-5.5
reasoning_effort: low | medium | high
```

## Merksatz

- Monkey liest billig.
- Wizard baut solide.
- Judge entscheidet bewusst.
- Big Brain kommt selten.
