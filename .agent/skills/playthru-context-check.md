# Skill: playthru-context-check

## Skill name
playthru-context-check

## Purpose
Prove the active Business Central target context before any practical BC or Playwright work continues.

## Use when
- A BC/Playwright run is planned or resumed.
- A screenshot, setup action, data action or book claim depends on active environment/company.
- Auth or URL routing recently changed.

## Do not use when
- The task is purely local documentation with no BC context dependency.
- Another result JSON from the same run already proves the exact context.
- The active case forbids BC/Playwright execution.

## Inputs
- expected instance: `playthru`
- expected company: `UNIVERSAARL-DE`
- expected legal name if visible: `Universaarl GmbH`
- active case and allowed actions
- URL, page title and visible shell/company signals

## Output JSON schema
```json
{
  "skill": "playthru-context-check",
  "instanceConfirmed": true,
  "companyConfirmed": true,
  "legalNameObserved": "string|null",
  "url": "string",
  "pageTitle": "string",
  "safeForNextAction": true,
  "blockedBy": []
}
```

## Rules
- `playthru / UNIVERSAARL-DE` is the only active target world.
- Legacy contexts such as RM-DEMO, MCP_1_20260210, CRONUS or Rhein-Main stop active work.
- Context proof must be recorded before setup, master data, draft, preview, posting or cleanup.

## Stop if
- The URL or shell shows the wrong environment.
- The company is missing, ambiguous or legacy.
- Auth redirects prevent BC shell proof.
- The active case does not allow the planned next action.

## Safety gates
- instance-confirmed
- company-confirmed
- no-legacy-target-world
- page-context-before-action

## Preferred taskClass
wizard_work

## Default model class
gpt-4-medium

## Max context lines
120

## Max output tokens
600

## Tool preferred
yes: Playwright context checks and local result JSON validation.

## Updates state
yes: current state or result JSON when context proof changes run readiness.
