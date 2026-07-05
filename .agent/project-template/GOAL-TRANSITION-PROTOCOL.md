# Goal Transition Protocol

Status: draft
Purpose: Einen laufenden Langziel-Agenten kontrolliert auf das Projektmanagement-System umschwenken.
Last reviewed: 2026-07-05

## Why this exists

Long-running goals can create valuable progress, but they can also keep working in the old mode: task queue, local fixes, book patches or Playwright work without a clear project-management frame.

This protocol tells an agent how to switch from "execute the big goal" to "run the project as a real Business Central implementation program" without losing current work.

## Transition principle

Do not abort useful work abruptly. Transition at a safe checkpoint:

- after a compact status report
- before starting a new major live/sandbox action
- before broad file edits
- after finishing the current small case
- when a blocker requires replanning
- when asked to align with the project system

The transition is not a reset. It is a classification and steering layer.

## Required reading before transition

Read these files first:

- `.agent/project-template/README.md`
- `.agent/project-template/PROJECT-PLAN-DRAFT.md`
- `.agent/project-template/PROJECT-DASHBOARD-DRAFT.md`
- `.agent/project-template/BC-IMPLEMENTATION-WORKBREAKDOWN-DRAFT.md`
- `.agent/project-template/JIRA-WORK-ITEM-MODEL.md`
- `.agent/project-template/DOCUMENTATION-CADENCE.md`
- `.agent/project-template/PROJECT-ARTIFACT-TEMPLATES.md`
- `.agent/project-template/CUSTOMER-DATA-CATALOG-DRAFT.md`
- `.agent/project-template/DECISION-LOG-DRAFT.md`
- `.agent/project-template/RISK-REGISTER-DRAFT.md`
- `.agent/project-template/REFINEMENT-BACKLOG.md`

Also read the active operational context:

- `.agent/BC-OPERATING-MODEL.md`
- `.agent/LEARNING-SYSTEM.md`
- `.agent/PROJECT-DECISION.md`
- `.agent/state/current.json`

## Transition card

The agent should write a compact transition card in its next status/result note:

```text
Project-system transition card
Current goal:
Current changed files:
Current active work:
Current blockers:
Workstream mapping:
Epic mapping:
Issue type mapping:
Customer data impact:
Decision impact:
Risk impact:
UAT/training impact:
Book impact:
Playwright/evidence impact:
Next recommended project item:
What will not be touched:
```

## Mapping rules

Every active or recent work item must be mapped to:

- one workstream
- one epic or proposed epic
- one issue type
- evidence status
- book/training impact
- open decision or risk if needed

If no mapping is possible, classify the work as:

- `needs-discovery`
- `parked`
- `rejected`
- `technical-debt`
- `agent-learning`

Do not keep unmapped work as invisible progress.

## Issue type selection

Use the Jira model:

- `Epic`: fachliches deliverable package.
- `Story`: business capability or repeated project activity.
- `Task`: concrete action.
- `Spike`: research/discovery.
- `Decision`: route or architecture choice.
- `Risk`: tracked project risk.
- `Data Request`: missing customer data.
- `UAT Scenario`: customer acceptance test.
- `Training Item`: customer enablement.
- `Book Output`: curated chapter/section work.
- `Playwright Evidence`: repeatable proof scenario.
- `Skill/Helper Improvement`: agent learning or automation improvement.

## Safe transition steps

1. Stop starting new broad work for one checkpoint.
2. Read the project-template files and active operational context.
3. Summarize current changes and current goal state.
4. Map current work to workstream, epic and issue type.
5. Update only the smallest relevant project-template docs if needed.
6. Add decision/risk/data-request entries only when they genuinely change project understanding.
7. Resume from the best next project item, not from the old queue by inertia.
8. Keep existing live/sandbox safety gates active.

## What to update

Update these when relevant:

- `PROJECT-DASHBOARD-DRAFT.md`
  - milestone, workstream readiness, top next work
- `DECISION-LOG-DRAFT.md`
  - new route/scope/project decisions
- `RISK-REGISTER-DRAFT.md`
  - new risks or changed severity
- `CUSTOMER-DATA-CATALOG-DRAFT.md`
  - missing customer data
- workstream draft files
  - new epics/stories/tasks
- book/Playwright/skills files
  - only when evidence or learning is ready

## Do not do during transition

Do not:

- reset or revert unrelated changes
- overwrite parallel agent output
- invent customer data
- mark work done because documentation exists
- claim source/evidence without checking
- commit secrets, tenant IDs, tokens or private auth data
- turn the transition into a rewrite of the whole project
- continue live BC writes without active case permission and evidence plan

## Project-mode default after transition

After transition, every new meaningful task starts with:

```text
Workstream:
Epic:
Issue type:
Business purpose:
Customer data needed:
Implementation route:
Source/evidence needed:
Risk:
Training/book output:
Playwright/UAT output:
```

Small local documentation changes can use a compact version, but BC setup/process work should use the full version.

## Completion signal

The transition is complete when:

- the current goal has a transition card
- active work is mapped to the project system
- the next project item is clear
- top risks/decisions/data needs are not hidden
- the agent explicitly says it will use the project-system default for new work
