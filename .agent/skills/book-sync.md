# Skill: book-sync

## Skill name
book-sync

## Purpose
Synchronize a small book or guide passage with proven Business Central evidence.

## Use when
- A book statement conflicts with evidence.
- A proven lab result needs a concise status box or caption.
- A click guide needs a small evidence-backed correction.

## Do not use when
- The task has no evidence reference.
- A large chapter rewrite is requested without a separate plan.
- The change would claim German final proof from CRONUS-USA lab data.

## Inputs
- book file and section
- instance and company behind the evidence
- evidence file or screenshot metadata
- current claim
- corrected claim
- lab/final boundary

## Output JSON schema
```json
{
  "skill": "book-sync",
  "bookSection": "string",
  "evidence": ["string"],
  "patchScope": "small",
  "claimsAdded": ["string"],
  "claimsRemoved": ["string"],
  "remainingOpen": ["string"]
}
```

## Rules
- Patch only the proven section.
- Keep status labels explicit.
- Explain screenshots by business purpose, not by file mechanics.
- Keep Shopify excluded.

## Stop if
- Evidence is missing or rejected.
- The patch would alter unrelated chapters.
- A compliance statement needs external source validation.

## Safety gates
- evidence-backed-only
- patch-only
- lab-vs-final-visible
- no-shopify-scope

## Preferred taskClass
judge_work

## Default model class
gpt-5.5-low

## Max context lines
220

## Max output tokens
1000

## Tool preferred
yes: `rg` for locating exact sections, `git diff --check` after patch.

## Updates state
yes: book audit, coverage or findings when a claim changes.
