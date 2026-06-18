# Skill: guide-patcher

## Skill name
guide-patcher

## Purpose
Patch a click guide or book passage only where evidence proves the needed correction or beginner explanation.

## Use when
- A proven UI path should become a click instruction.
- A screenshot needs purpose, status and limitation text.
- A guide contains a wrong or incomplete action.

## Do not use when
- No evidence or screenshot QA exists.
- A broad rewrite is requested without explicit scope.
- The change would invent setup, tax or posting behavior.

## Inputs
- target guide file
- exact section
- evidence reference
- screenshot QA status
- beginner learning point
- lab/final boundary

## Output JSON schema
```json
{
  "skill": "guide-patcher",
  "targetFile": "string",
  "section": "string",
  "patchType": "small",
  "evidence": ["string"],
  "changedClaims": ["string"],
  "remainingLimits": ["string"]
}
```

## Rules
- Patch only the relevant section.
- Explain what the user sees, does and checks.
- Mark lab screenshots as lab or candidate.
- Do not reactivate Shopify.

## Stop if
- Evidence is missing, rejected or unrelated.
- The patch would claim final German proof.
- The requested section cannot be located safely.

## Safety gates
- evidence-backed-only
- screenshot-purpose-required
- patch-small-scope
- no-final-claim-from-lab

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
220

## Max output tokens
900

## Tool preferred
yes: `rg` for location and `git diff --check` after patch.

## Updates state
yes: coverage, book audit or findings when guide truth changes.
