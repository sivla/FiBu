# Skill Contract

Every `.agent/skills/*.md` file, except this contract file, must use the sections below. Keep skill files short and executable.

## Skill name
Required unique skill id. Must match the file name without `.md`.

## Purpose
One short paragraph explaining the reusable ability.

## Use when
Bullets for situations where the skill applies.

## Do not use when
Bullets for situations where the skill must not be used.

## Inputs
Bullets naming required input facts or files.

## Output JSON schema
A compact JSON object shape the skill should produce or update.

## Rules
Operational rules.

## Stop if
Conditions that force stop, escalation or downgrade to read-only diagnosis.

## Safety gates
Relevant gates from the operating model.

## Preferred taskClass
One of `monkey_work`, `wizard_work`, `judge_work`, `big_brain_review`.

## Default model class
Internal routing class such as `gpt-4-mini-low`, `gpt-4-medium` or `gpt-5.5-low`.

## Max context lines
Recommended maximum context lines for this skill.

## Max output tokens
Recommended maximum output tokens for this skill.

## Tool preferred
`yes` or `no`, plus the deterministic tool family if known.

## Updates state
`yes` or `no`, plus target state files if applicable.
