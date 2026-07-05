# Skill: state-sync-check

## Skill name
state-sync-check

## Purpose
Check that Roadmap, Dashboard, State and Backlog tell the same active truth and next step.

## Use when
- A run changes active case, next case, freeze/resume status or target world.
- A new steering artifact is added.
- A new agent should be able to continue without chat history.

## Do not use when
- A change is isolated to immutable evidence.
- The user asks for a one-off local code fix with no project-state impact.
- The relevant files are intentionally out of sync and a decision record documents why.

## Inputs
- `.agent/project-template/UNIVERSAARL-EXECUTION-ROADMAP.md`
- `.agent/project-template/PROJECT-DASHBOARD-DRAFT.md`
- `.agent/project-template/REFINEMENT-BACKLOG.md`
- `.agent/state/current.json`
- latest run summary if available

## Output JSON schema
```json
{
  "skill": "state-sync-check",
  "activeTruthConsistent": true,
  "nextCaseConsistent": true,
  "freezeStatusConsistent": true,
  "mismatches": [],
  "patchNeeded": false
}
```

## Rules
- `playthru / UNIVERSAARL-DE / Universaarl GmbH` must remain the active project truth.
- TARGET-073 stays parked unless a conscious decision changes it.
- TARGET-075 remains the read-first pilot until a later state update replaces it.

## Stop if
- Files disagree on active instance/company.
- A dashboard next step would resume legacy or live write work unexpectedly.
- Current state references a missing active case file.

## Safety gates
- single-active-truth
- no-legacy-next-step
- freeze-resume-explicit
- dashboard-state-backlog-aligned

## Preferred taskClass
monkey_work

## Default model class
gpt-4-mini-low

## Max context lines
180

## Max output tokens
700

## Tool preferred
yes: local file reads, JSON parse, `agent:workbreakdown:check`.

## Updates state
yes: dashboard, backlog or current state when inconsistency is corrected.
