# Skill: safety-gate-checker

## Skill name
safety-gate-checker

## Purpose
Check whether a proposed action violates the Business Central operating model before tools or tests run.

## Use when
- A prompt proposes BC execution, setup change, company switch or posting.
- Allowed and forbidden actions must be reconciled.
- A smaller agent selected a next step and needs safety validation.

## Do not use when
- The task is purely local documentation with no safety impact.
- The active case already provides an explicit identical gate decision.
- The action is outside the repository and cannot be validated locally.

## Inputs
- proposed action
- active case
- operating model
- allowed actions
- forbidden actions
- company and instance

## Output JSON schema
```json
{
  "skill": "safety-gate-checker",
  "decision": "allow-read-only",
  "blockedActions": ["string"],
  "requiredGate": ["string"],
  "escalateTo": "judge_work",
  "reason": "string"
}
```

## Rules
- Forbidden beats allowed when wording conflicts.
- Risky actions are locked unless explicitly unlocked.
- Instance boundary is absolute.
- API shortcuts require explicit exception.

## Stop if
- The instance is not proven.
- A risky action appears without an active gate.
- The action could create real external side effects.

## Safety gates
- instance-never-leave
- forbidden-actions-win
- risky-actions-default-locked
- api-shortcut-exception-required

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
160

## Max output tokens
700

## Tool preferred
yes: agent safety and state checks.

## Updates state
no, unless a gate decision must be recorded.
