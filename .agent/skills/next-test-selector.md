# Skill: next-test-selector

## Skill name
next-test-selector

## Purpose
Choose exactly one next useful run from compact project state without reading old chat history.

## Use when
- The agent must decide the next case.
- Multiple open areas exist.
- A previous run ended with a blocker or incomplete evidence.

## Do not use when
- The user gave one explicit case to run.
- A safety gate blocks all BC work and must be resolved first.
- Required state files are missing.

## Inputs
- current state
- project state
- instance and company from current state
- coverage state
- active case
- allowed and forbidden actions
- budget profile

## Output JSON schema
```json
{
  "skill": "next-test-selector",
  "selectedCase": "string",
  "workType": "string",
  "taskClass": "string",
  "why": "string",
  "mustRead": ["string"],
  "allowedActions": ["string"],
  "forbiddenActions": ["string"]
}
```

## Rules
- Finish started blocks before jumping.
- Prefer evidence gaps that unblock later processes.
- Do not repeat old reference documents without a new purpose.
- Shopify remains excluded.

## Stop if
- State contradicts evidence.
- The selected next step might post or change setup without a gate.
- The active case is missing.

## Safety gates
- finish-started-block-first
- no-repeat-without-new-purpose
- posting-and-setup-default-locked
- shopify-hard-excluded

## Preferred taskClass
monkey_work

## Default model class
gpt-4-mini-high

## Max context lines
160

## Max output tokens
700

## Tool preferred
yes: `npm run agent:context`.

## Updates state
no, unless the selected next step is written to current state.
